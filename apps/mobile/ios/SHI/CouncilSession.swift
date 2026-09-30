import SwiftUI
import CryptoKit

enum CouncilContent {
    static let data: Data? = Bundle.main.url(forResource: "chen-council.v1", withExtension: "json").flatMap { try? Data(contentsOf: $0) }
    static let definition: Record = data.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
}

struct CouncilResponse: Identifiable {
    let id = UUID().uuidString
    let index: Int
}

@MainActor final class CouncilSession: ObservableObject {
    @Published private(set) var engine: CouncilEngine?
    @Published private(set) var response: CouncilResponse?
    @Published private(set) var needsRecovery = false
    @Published private(set) var error: String?
    let definition: Record
    let fingerprint: String
    let entry: CouncilEntry?
    let saveURL: URL
    private var committing = false

    init(origin: CampaignEngine, definitionData: Data? = CouncilContent.data, saveURL: URL? = nil) {
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SHI/chen-council-v1.json")
        entry = CouncilEntry.from(origin)
        definition = definitionData.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
        fingerprint = definitionData.map { SHA256.hash(data: $0).map { String(format: "%02x", $0) }.joined() } ?? ""
        guard let entry else { error = "Complete a surviving Chapter I before entering Chen."; return }
        do { engine = try CouncilEngine(definition: definition, entry: entry) }
        catch { self.error = error.localizedDescription; return }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path) {
                let save = try JSONDecoder().decode(CouncilChronicle.self, from: Data(contentsOf: self.saveURL))
                guard save.version == 1, save.definitionId == definition.text("id"), save.definitionSHA256 == fingerprint else {
                    throw CampaignError.invalid("The saved council uses different rules. It has been preserved.")
                }
                // A different completed Chapter I starts another interlude, but
                // the old file is untouched until the player commits a new order.
                if save.entry != entry { return }
                let restored = try CouncilEngine.restore(definition: definition, entry: entry, fingerprint: fingerprint, save: save)
                engine = restored
                // Reopen the saved reaction even after the final decision.
                // Presentation may repeat; the durable commitment must not.
                if !restored.history.isEmpty { response = CouncilResponse(index: restored.history.count - 1) }
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }

    var phaseID: String { "\(engine?.history.count ?? 0)-\(response?.id ?? "decision")" }
    private func persist(_ candidate: CouncilEngine) throws {
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(candidate.chronicle(fingerprint: fingerprint)).write(to: saveURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
    @discardableResult func choose(_ id: String) -> Bool {
        guard !committing, !needsRecovery, response == nil, var next = engine else { return false }
        committing = true
        defer { committing = false }
        do {
            try next.choose(id)
            try persist(next) // Publish only after the atomic durable write.
            engine = next
            response = CouncilResponse(index: next.history.count - 1)
            error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func continueResponse(_ id: String) {
        guard !committing, response?.id == id else { return }
        response = nil
    }
    @discardableResult func restart() -> Bool {
        guard !committing, let entry else { return false }
        committing = true
        defer { committing = false }
        do {
            let next = try CouncilEngine(definition: definition, entry: entry)
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL, to: saveURL.deletingLastPathComponent().appendingPathComponent("preserved-council-\(UUID().uuidString).json"))
            }
            try persist(next)
            engine = next; response = nil; error = nil; needsRecovery = false
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
}
