import Foundation
import Combine
import CryptoKit

@MainActor final class RefugeFollowupSession: ObservableObject {
    @Published private(set) var engine: RefugeFollowupEngine?
    @Published private(set) var needsRecovery = false
    @Published private(set) var error: String?
    let hash: String
    private(set) var saveURL: URL?
    private var initial: RefugeFollowupEngine?
    private var committing = false
    private let writer: (Data, URL) throws -> Void

    init(origin: RefugeContinuationEngine, fingerprints: [String: String], story: Data, saveURL: URL? = nil,
         writer: @escaping (Data, URL) throws -> Void = { data, url in
             try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
         }) {
        self.writer = writer
        hash = SHA256.hash(data: story).map { String(format: "%02x", $0) }.joined()
        do {
            let definition = try JSONSerialization.jsonObject(with: story) as? Record ?? [:]
            let candidate = try RefugeFollowupEngine(origin: origin, fingerprints: fingerprints, definition: definition)
            let branch = SHA256.hash(data: Data(candidate.entryID.utf8)).map { String(format: "%02x", $0) }.joined()
            self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("SHI/development/refuge-followup-v1-\(branch).json")
            initial = candidate; engine = candidate
        } catch { self.error = error.localizedDescription; return }
        do {
            if let url = self.saveURL, let initial, FileManager.default.fileExists(atPath: url.path) {
                let save = try JSONDecoder().decode(RefugeFollowupChronicle.self, from: Data(contentsOf: url))
                engine = try RefugeFollowupEngine.restore(initial: initial, save: save, hash: hash)
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }
    private func persist(_ candidate: RefugeFollowupEngine) throws {
        guard let saveURL else { throw CampaignError.invalid("Missing save location.") }
        let bytes = try JSONEncoder().encode(candidate.chronicle(hash: hash))
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try writer(bytes, saveURL)
    }
    @discardableResult func choose(_ id: String) -> Bool {
        guard !committing, !needsRecovery, var next = engine else { return false }
        committing = true; defer { committing = false }
        do { try next.choose(id); try persist(next); engine = next; error = nil; return true }
        catch { self.error = error.localizedDescription; return false }
    }
    /// View must confirm replacement. Never touch the earlier refuge file.
    @discardableResult func restart() -> Bool {
        guard !committing, let initial, let saveURL else { return false }
        committing = true; defer { committing = false }
        do {
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL, to: saveURL.deletingLastPathComponent()
                    .appendingPathComponent("preserved-followup-\(UUID().uuidString).json"))
            }
            try persist(initial); engine = initial; needsRecovery = false; error = nil; return true
        } catch { self.error = error.localizedDescription; return false }
    }
}
