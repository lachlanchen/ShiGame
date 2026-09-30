import Foundation
import CryptoKit

@main enum CouncilConformance {
    static func main() throws {
        guard CommandLine.arguments.count == 3 else {
            throw CampaignError.invalid("Usage: council-conformance DEFINITION FIXTURE")
        }
        let definitionData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let definition = try JSONSerialization.jsonObject(with: definitionData) as! Record
        let fixtures = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! Record
        let fingerprint = SHA256.hash(data: definitionData).map { String(format: "%02x", $0) }.joined()
        guard fixtures.int("fixtureVersion") == 1, fixtures.text("definitionId") == definition.text("id"),
              fixtures.text("definitionSHA256") == fingerprint else {
            throw CampaignError.invalid("Fixture does not match the exact council definition.")
        }
        var turns = 0
        var outcomes = Set<String>()
        for route in fixtures.records("routes") {
            let entry = CouncilEntry(id: "conformance-" + route.text("arrival"), arrival: route.text("arrival"))
            var engine = try CouncilEngine(definition: definition, entry: entry)
            for expected in route.records("turns") {
                let preview = try engine.preview(expected.text("choiceId"))
                let actual = try engine.choose(expected.text("choiceId"))
                guard actual.before == expected["before"] as? Resources,
                      actual.after == expected["after"] as? Resources,
                      actual.choiceId == expected.text("choiceId"), preview.metrics == engine.metrics else {
                    throw CampaignError.invalid("Council turn mismatch: \(route.strings("choices"))")
                }
                let restored = try CouncilEngine.restore(definition: definition, entry: entry, fingerprint: fixtures.text("definitionSHA256"), save: engine.chronicle(fingerprint: fixtures.text("definitionSHA256")))
                guard restored.history == engine.history, restored.metrics == engine.metrics, restored.outcome == engine.outcome else {
                    throw CampaignError.invalid("Council restore mismatch.")
                }
                turns += 1
            }
            guard engine.completed, engine.metrics == route["metrics"] as? Resources, engine.outcome == route.text("outcome") else {
                throw CampaignError.invalid("Council conclusion mismatch.")
            }
            outcomes.insert(route.text("outcome"))
            do { try engine.choose("hold-chen"); throw CampaignError.invalid("Duplicate final order accepted") }
            catch CampaignError.invalid(let message) where message == "Unavailable council choice." { }
        }
        guard fixtures.int("routeCount") == 77, fixtures.records("routes").count == 77, turns == 231,
              outcomes == Set(["common-front", "city-stronghold", "empty-granaries", "fragile-coalition"]) else {
            throw CampaignError.invalid("Incomplete council coverage.")
        }
        print("PASS: 77 canonical council routes, 231 turns, exact before/after metrics, previews, replay and all four outcomes.")
    }
}
