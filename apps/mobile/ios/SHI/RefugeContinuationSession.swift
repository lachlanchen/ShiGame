import Foundation
import Combine
import CryptoKit

/// Explicit development inputs only. Production must never load draft resources
/// implicitly. A decision becomes visible only after its chronicle is durable.
@MainActor final class RefugeContinuationSession: ObservableObject {
    @Published private(set) var engine: RefugeContinuationEngine?
    @Published private(set) var response: RetreatResponse?
    @Published private(set) var needsRecovery = false
    @Published private(set) var error: String?
    let story: Record
    let fingerprints: [String: String]
    let saveURL: URL
    private var initial: RefugeContinuationEngine?
    private var committing = false
    private let writer: (Data, URL) throws -> Void

    init(retreat: RetreatEngine, content: [String: Data], saveURL: URL? = nil,
         writer: @escaping (Data, URL) throws -> Void = { data, url in
             try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
         }) {
        self.writer = writer
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SHI/development/refuge-continuation-v1.json")
        fingerprints = content.mapValues { SHA256.hash(data: $0).map { String(format: "%02x", $0) }.joined() }
        let definitions = content.mapValues { (try? JSONSerialization.jsonObject(with: $0)) as? Record ?? [:] }
        story = definitions["nightStory"] ?? [:]
        do {
            guard Set(content.keys) == Set(["retreatRules", "retreatStory", "nightRules", "nightStory", "morning", "contact"]),
                  let retreatRules = definitions["retreatRules"], let retreatStory = definitions["retreatStory"],
                  let night = definitions["nightRules"], let morning = definitions["morning"], let contact = definitions["contact"],
                  retreatRules as NSDictionary == retreat.definition as NSDictionary,
                  retreatStory.text("id") == retreatRules.text("storyId"),
                  retreatStory.text("status") == "authoring-only",
                  retreatStory["publicationApproved"] as? Bool == false,
                  story.text("id") == "refuge.v1", story.int("schemaVersion") == 1,
                  story.text("status") == "authoring-only",
                  [story, morning, contact].allSatisfy({ $0["publicationApproved"] as? Bool == false }),
                  story.records("choices").map({ $0.text("id") }) == night.records("choices").map({ $0.text("id") }) else {
                throw CampaignError.invalid("Missing, mismatched or unreviewed development continuation content.")
            }
            let candidate = try RefugeContinuationEngine(retreat: retreat, night: night, morning: morning, contact: contact)
            _ = try candidate.chronicle(fingerprints: fingerprints)
            initial = candidate; engine = candidate
        } catch { self.error = error.localizedDescription; return }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path), let initial {
                let save = try JSONDecoder().decode(RefugeContinuationChronicle.self, from: Data(contentsOf: self.saveURL))
                let restored = try RefugeContinuationEngine.restore(initial: initial, save: save, fingerprints: fingerprints)
                engine = restored
                if !restored.orders.isEmpty { response = RetreatResponse(index: restored.orders.count - 1) }
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }

    var phaseID: String { "\(engine?.orders.count ?? 0)-\(response?.id ?? "decision")" }
    private func persist(_ candidate: RefugeContinuationEngine) throws {
        let data = try JSONEncoder().encode(candidate.chronicle(fingerprints: fingerprints))
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try writer(data, saveURL)
    }
    @discardableResult func choose(_ id: String) -> Bool {
        guard !committing, !needsRecovery, response == nil, var next = engine else { return false }
        committing = true
        defer { committing = false }
        do {
            try next.choose(id); try persist(next)
            engine = next; response = RetreatResponse(index: next.orders.count - 1); error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func continueResponse(_ id: String) {
        guard !committing, !needsRecovery, response?.id == id else { return }
        response = nil
    }
    /// Caller must first obtain explicit replacement confirmation. Preserve an
    /// unreadable/foreign save before replacing it; do not modify the retreat.
    @discardableResult func restart() -> Bool {
        guard !committing, let initial else { return false }
        committing = true
        defer { committing = false }
        do {
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL,
                    to: saveURL.deletingLastPathComponent().appendingPathComponent("preserved-refuge-\(UUID().uuidString).json"))
            }
            try persist(initial)
            engine = initial; response = nil; needsRecovery = false; error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
}
