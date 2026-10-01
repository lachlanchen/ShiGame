import Foundation
import CryptoKit

@main enum EngagementConformance {
    static func main() throws {
        let bytes = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let definition = try JSONSerialization.jsonObject(with: bytes) as! Record
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! Record
        let hash = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
        guard fixture.text("definitionSha256") == hash else { throw CampaignError.invalid("Fixture/definition hash mismatch.") }
        var valid = 0, rejected = 0, commands = 0
        for item in fixture.records("checkpoints") {
            let expected = item.object("state")
            var engine = try EngagementEngine.replay(definition: definition, saved: expected)
            guard EngagementEngine.sameJSON(engine.snapshot, expected), engine.availableCommands.map({ $0.text("id") }) == item.strings("available") else {
                throw CampaignError.invalid("Native crossing checkpoint/availability drift.")
            }
            commands += engine.history.count
            let before = engine.snapshot
            do { try engine.command("invalid-order"); throw CampaignError.invalid("Invalid order accepted.") }
            catch CampaignError.invalid(let message) where message.contains("unavailable") { }
            guard EngagementEngine.sameJSON(before, engine.snapshot) else { throw CampaignError.invalid("Failed order mutated live state.") }
            // Match canonical transport behavior: extra top-level metadata is
            // ignored, but it never becomes trusted metric or history state.
            var metadata = expected; metadata["transportNote"] = "ignored"
            _ = try EngagementEngine.replay(definition: definition, saved: metadata)
            valid += 1
        }
        for bad in fixture.records("rejected") {
            do { _ = try EngagementEngine.replay(definition: definition, saved: bad) }
            catch { rejected += 1; continue }
            throw CampaignError.invalid("Corrupt crossing snapshot accepted.")
        }
        print("PASS: \(valid) canonical crossing checkpoints, \(commands) replayed commands, \(rejected) corrupt states rejected; exact metrics, responses, legal orders and outcome effects.")
    }
}
