import Foundation
import CryptoKit

@main struct RefugeFollowupChecks {
    @MainActor static func main() throws {
        guard CommandLine.arguments.count == 4 else { fatalError("Pass fixture, content root, fresh evidence directory") }
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! Record
        let root = URL(fileURLWithPath: CommandLine.arguments[2])
        let output = URL(fileURLWithPath: CommandLine.arguments[3])
        precondition(!FileManager.default.fileExists(atPath: output.path))
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        var definitions: [String: Record] = [:]
        let hashes = fixture["hashes"] as! [String: String]
        for (key, path) in fixture["paths"] as! [String: String] {
            let bytes = try Data(contentsOf: root.appendingPathComponent(path))
            precondition(SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined() == hashes[key])
            definitions[key] = try JSONSerialization.jsonObject(with: bytes) as? Record
        }
        let story = try Data(contentsOf: root.appendingPathComponent(fixture.object("followup").text("path")))
        let hash = SHA256.hash(data: story).map { String(format: "%02x", $0) }.joined()
        precondition(hash == fixture.object("followup").text("sha256"))
        let definition = try JSONSerialization.jsonObject(with: story) as! Record
        var chapter = try CampaignEngine(campaign: definitions["campaign"]!, seed: 0)
        for id in fixture.strings("chapterChoices") { try chapter.choose(id) }
        var council = try CouncilEngine(definition: definitions["council"]!, entry: CouncilEntry.from(chapter)!)
        for id in fixture.strings("councilChoices") { try council.choose(id) }
        var fanyang = try FanyangEngine(definition: definitions["fanyang"]!, entry: FanyangEntry(council: council, fingerprint: hashes["council"]!))
        for id in fixture.strings("fanyangChoices") { try fanyang.choose(id) }
        let entry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
            campaignFingerprint: hashes["campaign"]!, councilFingerprint: hashes["council"]!, fanyangFingerprint: hashes["fanyang"]!)
        let fingerprints = hashes.filter { !["campaign", "council", "fanyang"].contains($0.key) }
        var count = 0, rejected = 0, branches = Set<String>()
        func rejects(_ work: () throws -> Void) {
            do { try work() } catch { rejected += 1; return }; fatalError("Invalid follow-up accepted")
        }
        for route in fixture.records("entries") {
            var retreat = try RetreatEngine(definition: definitions["retreatRules"]!, entry: entry)
            for id in route.strings("retreatChoices") { try retreat.choose(id) }
            let initial = try RefugeContinuationEngine(retreat: retreat, night: definitions["nightRules"]!, morning: definitions["morning"]!, contact: definitions["contact"]!)
            rejects { _ = try RefugeFollowupEngine(origin: initial, fingerprints: fingerprints, definition: definition) }
            for expected in route.records("cases") where expected.object("summary")["completed"] as? Bool == true {
                var origin = initial
                for id in expected.object("summary").strings("orders") { try origin.choose(id) }
                let oldBytes = try JSONEncoder().encode(origin.chronicle(fingerprints: fingerprints))
                let oldURL = output.appendingPathComponent("prior-\(branches.count).json")
                try oldBytes.write(to: oldURL)
                let next = try RefugeFollowupEngine(origin: origin, fingerprints: fingerprints, definition: definition)
                precondition(branches.insert(next.entryID).inserted, "Branches must not overwrite each other")
                let expectedOrders = expected.records("followup").map { $0.text("order") }
                precondition(next.choices.filter { next.canChoose($0.text("id")) }.map { $0.text("id") } == expectedOrders)
                if origin.lead == "ferry-with-guide" { precondition(next.presentation("walk-to-ferry").text("intent").contains("已经在渡口")) }
                for item in expected.records("followup") {
                    let order = item.text("order"), candidate = try next.preview(order)
                    precondition(candidate.summary as NSDictionary == item as NSDictionary, "Shared-rule mismatch")
                    let url = output.appendingPathComponent("case-\(count).json")
                    var fail = true
                    let live = RefugeFollowupSession(origin: origin, fingerprints: fingerprints, story: story, saveURL: url) { bytes, destination in
                        if fail { throw CocoaError(.fileWriteOutOfSpace) }; try bytes.write(to: destination, options: .atomic)
                    }
                    precondition(live.engine != nil && !FileManager.default.fileExists(atPath: url.path))
                    precondition(!live.choose(order) && !live.engine!.completed && live.engine!.grain == origin.grain)
                    fail = false; precondition(live.choose(order) && !live.choose(order))
                    precondition(live.engine!.summary as NSDictionary == item as NSDictionary)
                    let saved = try Data(contentsOf: url)
                    let restored = RefugeFollowupSession(origin: origin, fingerprints: fingerprints, story: story, saveURL: url)
                    precondition(restored.engine!.summary as NSDictionary == item as NSDictionary)
                    let afterRestore = try Data(contentsOf: url); precondition(afterRestore == saved)
                    let oldAfter = try Data(contentsOf: oldURL); precondition(oldAfter == oldBytes)
                    let chronicle = try JSONDecoder().decode(RefugeFollowupChronicle.self, from: saved)
                    rejects { _ = try RefugeFollowupEngine.restore(initial: next, save: chronicle, hash: String(repeating: "0", count: 64)) }
                    let foreign = RefugeFollowupChronicle(version: 1, entryID: "foreign", definitionSHA256: hash, order: order)
                    rejects { _ = try RefugeFollowupEngine.restore(initial: next, save: foreign, hash: hash) }
                    let stale = RefugeFollowupSession(origin: origin, fingerprints: fingerprints, story: story + Data(" ".utf8), saveURL: url)
                    precondition(stale.needsRecovery && !stale.choose(order))
                    let corrupt = Data("broken".utf8); try corrupt.write(to: url)
                    let damaged = RefugeFollowupSession(origin: origin, fingerprints: fingerprints, story: story, saveURL: url)
                    precondition(damaged.needsRecovery && !damaged.choose(order))
                    let unchanged = try Data(contentsOf: url); precondition(unchanged == corrupt)
                    precondition(damaged.restart() && !damaged.needsRecovery && !damaged.engine!.completed)
                    let backups = try FileManager.default.contentsOfDirectory(at: output, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("preserved-followup-") }
                    let backedUp = try backups.contains { try Data(contentsOf: $0) == corrupt }; precondition(backedUp)
                    precondition(origin.summary as NSDictionary == expected.object("summary") as NSDictionary)
                    count += 1
                }
                for id in ["share-ration", "walk-to-ferry", "invented"] where !next.canChoose(id) { rejects { _ = try next.preview(id) } }
            }
        }
        precondition(count > 0 && branches.count > 0)
        print("Native follow-up passed: \(count) outcomes across \(branches.count) completed contact branches, \(rejected) rejections; shared rules, distinct saves, failed writes, reload, prior-save preservation and corrupt recovery. Not UI/device acceptance.")
    }
}
