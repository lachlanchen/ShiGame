import Foundation
import Combine
import CryptoKit

struct RetreatResponse: Identifiable {
    let id = UUID().uuidString
    let index: Int
}

/// Development-only: callers explicitly supply both shared files. No draft
/// content is implicitly bundled or loaded into the store application.
@MainActor final class RetreatSession: ObservableObject {
    @Published private(set) var engine: RetreatEngine?
    @Published private(set) var response: RetreatResponse?
    @Published private(set) var needsRecovery = false
    @Published private(set) var resumedEarlierProse = false
    @Published private(set) var error: String?
    let definition: Record
    let story: Record
    let rulesFingerprint: String
    let storyFingerprint: String
    let entry: RetreatEntry
    let saveURL: URL
    private var committing = false
    private let writer: (Data, URL) throws -> Void

    init(entry: RetreatEntry, rulesData: Data?, storyData: Data?, saveURL: URL? = nil,
         writer: @escaping (Data, URL) throws -> Void = { data, url in
             try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
         }) {
        self.entry = entry; self.writer = writer
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SHI/development/chen-retreat-v1.json")
        definition = rulesData.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
        story = storyData.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
        func digest(_ data: Data?) -> String {
            data.map { SHA256.hash(data: $0).map { String(format: "%02x", $0) }.joined() } ?? ""
        }
        rulesFingerprint = digest(rulesData); storyFingerprint = digest(storyData)
        guard story.int("schemaVersion") == 1, story.text("id") == definition.text("storyId"),
              story.text("status") == "authoring-only", story["publicationApproved"] as? Bool == false,
              !story.records("scenes").isEmpty,
              story.records("scenes").map({ $0.text("id") }) == definition.records("scenes").map({ $0.text("id") }),
              zip(story.records("scenes"), definition.records("scenes")).allSatisfy({ scene, rules in
                  scene.records("choices").map({ $0.text("id") }) == rules.records("choices").map({ $0.text("id") })
              }) else { error = "Missing or mismatched retreat story and rules."; return }
        do { engine = try RetreatEngine(definition: definition, entry: entry) }
        catch { self.error = error.localizedDescription; return }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path) {
                let save = try JSONDecoder().decode(RetreatChronicle.self, from: Data(contentsOf: self.saveURL))
                let compatibility = story["saveCompatibility"] as? Record ?? [:]
                let compatible = compatibility.text("rulesSHA256") == rulesFingerprint
                    ? compatibility.strings("previousStorySHA256") : []
                let restored = try RetreatEngine.restore(definition: definition, entry: entry,
                    rulesFingerprint: rulesFingerprint, storyFingerprint: storyFingerprint, save: save,
                    compatibleStoryFingerprints: compatible)
                engine = restored
                resumedEarlierProse = save.storySHA256 != storyFingerprint
                if !restored.history.isEmpty { response = RetreatResponse(index: restored.history.count - 1) }
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }
    var phaseID: String { "\(engine?.history.count ?? 0)-\(response?.id ?? "decision")" }
    private func persist(_ candidate: RetreatEngine) throws {
        let data = try JSONEncoder().encode(candidate.chronicle(rulesFingerprint: rulesFingerprint, storyFingerprint: storyFingerprint))
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try writer(data, saveURL)
        resumedEarlierProse = false
    }
    @discardableResult func choose(_ id: String) -> Bool {
        guard !committing, !needsRecovery, response == nil, var next = engine else { return false }
        committing = true
        defer { committing = false }
        do {
            try next.choose(id)
            try persist(next)
            engine = next; response = RetreatResponse(index: next.history.count - 1); error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func continueResponse(_ id: String) {
        guard !committing, response?.id == id else { return }
        response = nil
    }
    /// UI must obtain explicit restart confirmation. Never silently overwrite
    /// incompatible progress; backup failure also prevents replacement.
    @discardableResult func restart() -> Bool {
        guard !committing, engine != nil else { return false }
        committing = true
        defer { committing = false }
        do {
            let next = try RetreatEngine(definition: definition, entry: entry)
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL,
                    to: saveURL.deletingLastPathComponent().appendingPathComponent("preserved-retreat-\(UUID().uuidString).json"))
            }
            try persist(next)
            engine = next; response = nil; error = nil; needsRecovery = false
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
}
