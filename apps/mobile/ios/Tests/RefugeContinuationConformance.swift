import Foundation
import CryptoKit

@main struct RefugeContinuationConformance {
    static func main() throws {
        guard CommandLine.arguments.count == 3 else { fatalError("Pass fixture and content root") }
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! Record
        var definitions: [String: Record] = [:]
        let hashes = fixture["hashes"] as! [String: String]
        for (key, path) in fixture["paths"] as! [String: String] {
            let bytes = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]).appendingPathComponent(path))
            precondition(SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined() == hashes[key])
            definitions[key] = try JSONSerialization.jsonObject(with: bytes) as? Record
        }
        var chapter = try CampaignEngine(campaign: definitions["campaign"]!, seed: 0)
        for id in fixture.strings("chapterChoices") { try chapter.choose(id) }
        var council = try CouncilEngine(definition: definitions["council"]!, entry: CouncilEntry.from(chapter)!)
        for id in fixture.strings("councilChoices") { try council.choose(id) }
        var fanyang = try FanyangEngine(definition: definitions["fanyang"]!, entry: FanyangEntry(council: council, fingerprint: hashes["council"]!))
        for id in fixture.strings("fanyangChoices") { try fanyang.choose(id) }
        let entry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang, campaignFingerprint: hashes["campaign"]!, councilFingerprint: hashes["council"]!, fanyangFingerprint: hashes["fanyang"]!)
        let fingerprints = hashes.filter { !["campaign", "council", "fanyang"].contains($0.key) }
        var count = 0, rejected = 0
        func rejects(_ work: () throws -> Void) {
            do { try work() } catch { rejected += 1; return }; fatalError("Invalid continuation accepted")
        }
        for route in fixture.records("entries") {
            var retreat = try RetreatEngine(definition: definitions["retreatRules"]!, entry: entry)
            rejects { _ = try RefugeContinuationEngine(retreat: retreat, night: definitions["nightRules"]!, morning: definitions["morning"]!, contact: definitions["contact"]!) }
            for id in route.strings("retreatChoices") { try retreat.choose(id) }
            precondition(retreat.outcome == route.text("outcome"))
            let initial = try RefugeContinuationEngine(retreat: retreat, night: definitions["nightRules"]!, morning: definitions["morning"]!, contact: definitions["contact"]!)
            for expected in route.records("cases") {
                var engine = initial
                for id in expected.object("summary").strings("orders") { try engine.choose(id) }
                precondition(engine.summary as NSDictionary == expected.object("summary") as NSDictionary, "Parity mismatch: \(engine.summary)")
                precondition(engine.choices.filter { engine.canChoose($0.text("id")) }.map { $0.text("id") } == expected.strings("available"))
                for id in ["offer-grain", "offer-labour", "sleep-outside", "repair-roof", "follow-witness", "leave-route", "leave-record", "ask-unprompted", "show-record", "invented"] {
                    if engine.canChoose(id) { _ = try engine.preview(id) }
                    else { rejects { _ = try engine.preview(id) } }
                }
                let save = try engine.chronicle(fingerprints: fingerprints)
                let decoded = try JSONDecoder().decode(RefugeContinuationChronicle.self, from: JSONEncoder().encode(save))
                let restored = try RefugeContinuationEngine.restore(initial: initial, save: decoded, fingerprints: fingerprints)
                precondition(restored.summary as NSDictionary == engine.summary as NSDictionary)
                let foreign = RefugeContinuationChronicle(version: 1, entryID: "foreign", fingerprints: fingerprints, orders: save.orders)
                rejects { _ = try RefugeContinuationEngine.restore(initial: initial, save: foreign, fingerprints: fingerprints) }
                var stale = fingerprints; stale["nightRules"] = String(repeating: "0", count: 64)
                rejects { _ = try RefugeContinuationEngine.restore(initial: initial, save: save, fingerprints: stale) }
                count += 1
            }
        }
        precondition(count == fixture.int("stateCount"))
        print("Native refuge parity passed: \(count) states, four retreat endings, three record modes; \(rejected) rejected operations. Rules, debt, privacy, promises, evidence and replay agree. Not a native UI or device test.")
    }
}
