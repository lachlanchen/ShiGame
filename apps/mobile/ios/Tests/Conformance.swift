import Foundation

@main enum Conformance {
    static func main() throws {
        let campaign = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! Record
        let fixtures = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! Record
        var turns = 0
        for route in fixtures.records("routes") {
            var engine = try CampaignEngine(campaign: campaign, seed: UInt32(fixtures.int("seed")))
            for expected in route.records("turns") {
                let actual = try engine.choose(expected.text("choiceId"))
                for (key, value) in expected {
                    let lhs = try JSONSerialization.data(withJSONObject: ["value": value], options: [.sortedKeys])
                    let rhs = try JSONSerialization.data(withJSONObject: ["value": actual[key] ?? NSNull()], options: [.sortedKeys])
                    guard lhs == rhs else { throw CampaignError.invalid("\(route.text("id")): \(key) mismatch\nexpected \(String(data: lhs, encoding: .utf8)!)\nactual \(String(data: rhs, encoding: .utf8)!)") }
                }
                turns += 1
            }
            let final = route.object("final")
            guard final.text("ending") == engine.ending,
                  final.text("currentNodeId") == engine.nodeID,
                  final["completed"] as? Bool == engine.completed,
                  final["resources"] as? Resources == engine.resources,
                  Set(final.strings("flags")) == engine.flags,
                  (final["failureReason"] as? String) == engine.failure else {
                throw CampaignError.invalid("Final state or ending mismatch: \(route.text("id"))")
            }
            do { try engine.choose("not-a-choice"); throw CampaignError.invalid("Invalid choice accepted") }
            catch CampaignError.invalid(let message) where message.contains("not available") { }
        }
        print("PASS: \(fixtures.int("routeCount")) canonical routes, \(turns) turns, every intermediate resource layer, oath, prepared read, seeded field and ending.")
    }
}
