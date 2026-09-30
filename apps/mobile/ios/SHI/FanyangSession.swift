import Foundation
import Combine
import CryptoKit

enum FanyangContent {
    static let data: Data? = Bundle.main.url(forResource: "fanyang-guarantee.v1", withExtension: "json").flatMap { try? Data(contentsOf: $0) }
}

struct FanyangResponse: Identifiable {
    let id = UUID().uuidString
    let index: Int
}

@MainActor final class FanyangSession: ObservableObject {
    @Published private(set) var engine: FanyangEngine?
    @Published private(set) var response: FanyangResponse?
    @Published private(set) var needsRecovery = false
    @Published private(set) var error: String?
    let definition: Record
    let fingerprint: String
    let entry: FanyangEntry?
    let saveURL: URL
    private var committing = false
    private let writer: (Data, URL) throws -> Void

    init(council: CouncilEngine, councilFingerprint: String, definitionData: Data? = FanyangContent.data,
         saveURL: URL? = nil, writer: @escaping (Data, URL) throws -> Void = { data, url in
             try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
         }) {
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SHI/fanyang-guarantee-v1.json")
        self.writer = writer
        definition = definitionData.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
        fingerprint = definitionData.map { SHA256.hash(data: $0).map { String(format: "%02x", $0) }.joined() } ?? ""
        entry = try? FanyangEntry(council: council, fingerprint: councilFingerprint)
        guard let entry else { error = "Complete a validated Chen council before continuing."; return }
        do { engine = try FanyangEngine(definition: definition, entry: entry) }
        catch { self.error = error.localizedDescription; return }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path) {
                let save = try JSONDecoder().decode(FanyangChronicle.self, from: Data(contentsOf: self.saveURL))
                // Unlike a new chapter, an unrelated continuation is never
                // silently replaced. The player must confirm a scene restart.
                let restored = try FanyangEngine.restore(definition: definition, entry: entry, fingerprint: fingerprint, save: save)
                engine = restored
                if !restored.history.isEmpty { response = FanyangResponse(index: restored.history.count - 1) }
            }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }

    var phaseID: String { "\(engine?.history.count ?? 0)-\(response?.id ?? "decision")" }
    private func persist(_ candidate: FanyangEngine) throws {
        let data = try JSONEncoder().encode(candidate.chronicle(fingerprint: fingerprint))
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try writer(data, saveURL)
    }
    @discardableResult func choose(_ id: String) -> Bool {
        guard !committing, !needsRecovery, response == nil, var next = engine else { return false }
        committing = true
        defer { committing = false }
        do {
            try next.choose(id)
            try persist(next)
            engine = next
            response = FanyangResponse(index: next.history.count - 1)
            error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func continueResponse(_ id: String) {
        guard !committing, response?.id == id else { return }
        response = nil
    }
    /// Call only after explicit UI confirmation. Preserve an incompatible save
    /// before replacing it, and publish nothing if either backup or write fails.
    @discardableResult func restart() -> Bool {
        guard !committing, let entry, engine != nil else { return false }
        committing = true
        defer { committing = false }
        do {
            let next = try FanyangEngine(definition: definition, entry: entry)
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL, to: saveURL.deletingLastPathComponent().appendingPathComponent("preserved-fanyang-\(UUID().uuidString).json"))
            }
            try persist(next)
            engine = next; response = nil; error = nil; needsRecovery = false
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
}
