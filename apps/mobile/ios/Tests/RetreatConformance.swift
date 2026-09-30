import Foundation
import CryptoKit

@main struct RetreatConformance {
    static func main() throws {
        guard CommandLine.arguments.count == 7 else { fatalError("Pass campaign, council, Fan Yang, rules, story and fixture JSON") }
        func load(_ index: Int) throws -> (Record, String) {
            let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[index]))
            return (try JSONSerialization.jsonObject(with: data) as! Record,
                SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined())
        }
        let (campaign, ch) = try load(1), (councilDefinition, co) = try load(2), (fanyangDefinition, fa) = try load(3)
        let (rules, ru) = try load(4), (_, st) = try load(5), (fixture, _) = try load(6)
        precondition(fixture.object("hashes") as NSDictionary == ["campaign": ch, "council": co, "fanyang": fa, "rules": ru, "story": st] as NSDictionary)
        var chapter = try CampaignEngine(campaign: campaign, seed: 0)
        for id in fixture.strings("chapterChoices") { try chapter.choose(id) }
        var council = try CouncilEngine(definition: councilDefinition, entry: CouncilEntry.from(chapter)!)
        for id in fixture.strings("councilChoices") { try council.choose(id) }
        func json<T: Encodable>(_ value: T) throws -> Any { try JSONSerialization.jsonObject(with: JSONEncoder().encode(value), options: [.fragmentsAllowed]) }
        var states = 0, endings = 0, rejected = 0
        func rejects(_ work: () throws -> Void) {
            do { try work() } catch { rejected += 1; return }
            fatalError("Invalid retreat operation accepted")
        }
        for route in fixture.records("entries") {
            var fanyang = try FanyangEngine(definition: fanyangDefinition, entry: FanyangEntry(council: council, fingerprint: co))
            for id in route.strings("fanyangChoices") { try fanyang.choose(id) }
            let entry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
                campaignFingerprint: ch, councilFingerprint: co, fanyangFingerprint: fa)
            for expected in route.records("cases") {
                var engine = try RetreatEngine(definition: rules, entry: entry)
                for id in expected.strings("choices") { try engine.choose(id) }
                precondition(engine.metrics == expected["metrics"] as! Resources)
                precondition(engine.outcome == expected["outcome"] as? String)
                precondition(engine.resourceCustody == expected.text("resourceCustody"))
                let actualDebts = try json(engine.debts) as! NSArray
                let actualHistory = try json(engine.history) as! NSArray
                precondition(actualDebts == expected["debts"] as! NSArray)
                precondition(actualHistory == expected["history"] as! NSArray)
                let original = engine.history
                for check in expected.records("inspections") {
                    let preview = try engine.inspect(check.text("id"))
                    precondition(preview.available == check["available"] as! Bool)
                    precondition(preview.effects == check["effects"] as! Resources)
                    precondition(preview.after == check["after"] as? Resources)
                    precondition(preview.outcome == check["outcome"] as? String)
                    if let debt = preview.newDebt {
                        let actualDebt = try json(debt) as! NSDictionary
                        precondition(actualDebt == check["newDebt"] as! NSDictionary)
                    }
                    else { precondition(check["newDebt"] is NSNull) }
                    if preview.available {
                        let next = try engine.preview(check.text("id"))
                        precondition(next.metrics == preview.after && next.outcome == preview.outcome)
                    } else { rejects { _ = try engine.preview(check.text("id")) } }
                }
                precondition(engine.history == original)
                let save = try engine.chronicle(rulesFingerprint: ru, storyFingerprint: st)
                let encoded = try JSONEncoder().encode(save)
                let restored = try RetreatEngine.restore(definition: rules, entry: entry, rulesFingerprint: ru,
                    storyFingerprint: st, save: JSONDecoder().decode(RetreatChronicle.self, from: encoded))
                precondition(restored.history == engine.history && restored.debts == engine.debts && restored.outcome == engine.outcome)
                rejects { _ = try engine.preview("invented-order") }
                states += 1; if engine.completed { endings += 1 }
            }
            let empty = try RetreatEngine(definition: rules, entry: entry)
            let save = try empty.chronicle(rulesFingerprint: ru, storyFingerprint: st)
            rejects { _ = try RetreatEngine.restore(definition: rules, entry: entry, rulesFingerprint: ru, storyFingerprint: String(repeating: "0", count: 64), save: save) }
            rejects { _ = try empty.chronicle(rulesFingerprint: "invalid", storyFingerprint: st) }
        }
        precondition(states == fixture.int("stateCount") && endings == fixture.int("endings"))
        print("Retreat Swift/TypeScript parity passed: \(states) states, \(endings) endings, \(rejected) rejected operations; previews, histories, debts, custody and replay agree. One chapter/council baseline, not UI acceptance.")
    }
}
