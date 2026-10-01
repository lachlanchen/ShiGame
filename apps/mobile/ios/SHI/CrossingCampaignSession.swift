import Foundation
import Combine

struct CrossingReaction: Identifiable {
    let id = UUID().uuidString
    let eventIndex: Int
    let kind: String
    let record: Record
}

/// Native development session. Its separate envelope and file never replace
/// the released choices-only chronicle. Media callbacks cannot resolve orders.
@MainActor final class CrossingCampaignSession: ObservableObject {
    @Published private(set) var state: CrossingCampaignEngine?
    @Published private(set) var reaction: CrossingReaction?
    @Published private(set) var needsRecovery = false
    @Published private(set) var error: String?
    @Published private(set) var phaseID = UUID().uuidString
    let content: CrossingCampaignContent
    let saveURL: URL
    private let writer: (Data, URL) throws -> Void
    private let backup: (URL, URL) throws -> Void
    private var committing = false

    init(content: CrossingCampaignContent, seed: UInt32, saveURL: URL? = nil,
         writer: @escaping (Data, URL) throws -> Void = { data, url in
             try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
         }, backup: @escaping (URL, URL) throws -> Void = { source, destination in
             try FileManager.default.copyItem(at: source, to: destination)
         }) {
        self.content = content; self.writer = writer; self.backup = backup
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SHI/development/crossing-campaign-v2.json")
        do { state = try CrossingCampaignEngine(content: content, seed: seed) }
        catch { self.error = error.localizedDescription; return }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path) {
                let attributes = try FileManager.default.attributesOfItem(atPath: self.saveURL.path)
                guard ((attributes[.size] as? NSNumber)?.intValue ?? Int.max) <= 2_000_000 else {
                    throw CampaignError.invalid("Crossing save exceeds the supported size; it has been preserved.")
                }
                let data = try Data(contentsOf: self.saveURL)
                guard let saved = try JSONSerialization.jsonObject(with: data) as? Record,
                      saved.count == 4, EngagementEngine.sameJSON(saved["version"] ?? NSNull(), 1),
                      saved.text("rulesSHA256") == content.fingerprint,
                      let ledger = saved["ledger"] as? Record else {
                    throw CampaignError.invalid("Crossing save uses different rules; it has been preserved.")
                }
                let restored = try CrossingCampaignEngine.replay(content: content, saved: ledger)
                let pending: CrossingReaction?
                if saved["pendingEventIndex"] is NSNull { pending = nil }
                else {
                    guard let index = saved["pendingEventIndex"] as? Int,
                          EngagementEngine.sameJSON(saved["pendingEventIndex"] ?? NSNull(), index),
                          index == restored.events.count - 1 else {
                        throw CampaignError.invalid("Crossing reaction does not match its saved order.")
                    }
                    pending = try Self.reaction(for: restored, at: index)
                }
                state = restored; reaction = pending
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }

    private static func reaction(for state: CrossingCampaignEngine, at index: Int) throws -> CrossingReaction {
        guard state.events.indices.contains(index), index == state.events.count - 1 else {
            throw CampaignError.invalid("Reaction index is outside its ledger.")
        }
        let kind = state.events[index].text("kind")
        switch kind {
        case "decision", "finish-crossing":
            guard let response = state.lastResponse else { throw CampaignError.invalid("Missing saved campaign reaction.") }
            return CrossingReaction(eventIndex: index, kind: kind, record: response)
        case "crossing-command":
            guard let engagement = state.engagement, let turn = engagement.history.last,
                  let command = state.content.engagement.records("commands").first(where: { $0.text("id") == turn.text("commandId") }) else {
                throw CampaignError.invalid("Missing saved field response.")
            }
            return CrossingReaction(eventIndex: index, kind: kind, record: ["command": command, "turn": turn, "response": command.object("response")])
        default: throw CampaignError.invalid("Planning or cancellation cannot have an unread reaction.")
        }
    }

    private func persist(_ candidate: CrossingCampaignEngine, pending: CrossingReaction?) throws {
        let envelope: Record = ["version": 1, "rulesSHA256": content.fingerprint, "ledger": candidate.save,
                                "pendingEventIndex": pending?.eventIndex as Any? ?? NSNull()]
        let data = try JSONSerialization.data(withJSONObject: envelope, options: [.sortedKeys])
        guard data.count <= 2_000_000 else { throw CampaignError.invalid("Crossing save exceeds the supported size; earlier progress is preserved.") }
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try writer(data, saveURL)
    }

    /// The UI captures the rendered phase token, not a fresh token at callback
    /// execution time. Old double taps must not act on the next decision.
    @discardableResult func advance(_ event: Record, phase: String) -> Bool {
        guard !committing, !needsRecovery, reaction == nil, phase == phaseID, let state else { return false }
        committing = true; defer { committing = false }
        do {
            let next = try state.advancing(event)
            let kind = event.text("kind")
            let pending = ["decision", "crossing-command", "finish-crossing"].contains(kind)
                ? try Self.reaction(for: next, at: next.events.count - 1) : nil
            try persist(next, pending: pending)
            self.state = next; reaction = pending; phaseID = UUID().uuidString; error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }

    @discardableResult func continueReaction(_ id: String) -> Bool {
        guard !committing, !needsRecovery, reaction?.id == id, let state else { return false }
        committing = true; defer { committing = false }
        do {
            try persist(state, pending: nil)
            reaction = nil; phaseID = UUID().uuidString; error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }

    /// Call after the player confirms replacing their failed attempt. No
    /// in-battle undo, seed reroll, or lost opening decision is permitted.
    @discardableResult func reconsiderFailure(confirmed: Bool, phase: String) -> Bool {
        guard confirmed, !committing, !needsRecovery, reaction == nil, phase == phaseID, let state else { return false }
        committing = true; defer { committing = false }
        do {
            let next = try state.reconsideringFailedCrossing()
            try persist(next, pending: nil)
            self.state = next; reaction = nil; phaseID = UUID().uuidString; error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }

    /// Explicit new game/recovery only. A failed backup or save never replaces
    /// the in-memory state and never clears the recovery requirement.
    @discardableResult func restart(confirmed: Bool, seed: UInt32, phase: String) -> Bool {
        guard confirmed, !committing, phase == phaseID, state != nil else { return false }
        committing = true; defer { committing = false }
        do {
            let next = try CrossingCampaignEngine(content: content, seed: seed)
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                let destination = saveURL.deletingLastPathComponent().appendingPathComponent("preserved-crossing-\(UUID().uuidString).json")
                try backup(saveURL, destination)
            }
            try persist(next, pending: nil)
            state = next; reaction = nil; needsRecovery = false; phaseID = UUID().uuidString; error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }

    var councilEntry: CouncilEntry? {
        guard !needsRecovery, reaction == nil, let state, state.crossings.count == 1 else { return nil }
        return CouncilEntry.from(state.engine)
    }
}
