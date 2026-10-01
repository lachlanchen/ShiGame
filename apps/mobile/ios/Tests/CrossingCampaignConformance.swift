import Foundation

@main enum CrossingCampaignConformance {
    static func response(_ value: Record?) -> Any {
        guard let value else { return NSNull() }
        let choice = value.object("choice")
        return ["choiceId": choice.text("id"), "consequence": choice.object("consequence"),
                "pressure": choice.object("pressure").object("reveal"), "outcome": value.object("outcome")] as Record
    }
    static func snapshot(_ state: CrossingCampaignEngine) -> Record {
        let keys = ["nodeId", "choiceId", "conditionId", "oppositionStageId", "methodId", "methodReadId", "methodReadMatched",
                    "commitmentId", "commitmentOutcomeId", "before", "afterChoice", "afterCommitment", "afterPressure", "afterOpposition", "afterMethodRead", "after"]
        return ["resources": state.engine.resources, "nodeId": state.engine.nodeID, "flags": state.engine.flags.sorted(),
                "completed": state.engine.completed, "failure": state.engine.failure as Any? ?? NSNull(), "ending": state.engine.ending,
                "history": state.engine.history.map { turn in Dictionary(uniqueKeysWithValues: keys.map { ($0, turn[$0] ?? NSNull()) }) },
                "engagement": state.engagement?.snapshot as Any? ?? NSNull(), "crossings": state.crossings.map(\.snapshot),
                "response": response(state.lastResponse), "crossingResponses": state.crossingResponses.map { response($0) }]
    }
    static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments[1])
        func data(_ path: String) throws -> Data { try Data(contentsOf: root.appendingPathComponent(path)) }
        let campaignData = try data("content/campaigns/chapter-01-daze.json")
        let engagementData = try data("content/engagements/chapter-01-broken-crossing.v1.json")
        let rulesData = try data("content/engagements/chapter-01-crossing-campaign.rules.v2.json")
        let aftermathData = try data("content/engagements/chapter-01-crossing-aftermath.v2.json")
        let content = try CrossingCampaignContent(campaignData: campaignData, engagementData: engagementData, rulesData: rulesData, aftermathData: aftermathData)
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! Record
        var count = 0, recovered = 0
        for item in fixture.records("cases") {
            let state: CrossingCampaignEngine
            do { state = try CrossingCampaignEngine.replay(content: content, saved: item.object("save")) }
            catch { throw CampaignError.invalid("Checkpoint \(count) could not replay: \(error)") }
            let actual = snapshot(state), expected = item.object("expected")
            for (key, value) in expected {
                guard EngagementEngine.sameJSON(actual[key] ?? NSNull(), value) else {
                    throw CampaignError.invalid("Crossing campaign checkpoint \(count): \(key) mismatch.")
                }
            }
            guard EngagementEngine.sameJSON(state.save, item.object("save")) else { throw CampaignError.invalid("Ledger rewrite mismatch.") }
            let memoryReplay = try CrossingCampaignEngine.replay(content: content, saved: state.save)
            guard EngagementEngine.sameJSON(snapshot(memoryReplay), actual) else { throw CampaignError.invalid("In-memory ledger replay differs.") }
            let before = state.save
            do { _ = try state.advancing(["kind": "invalid"]); throw CampaignError.invalid("Invalid event accepted.") }
            catch CampaignError.invalid(let message) where message == "Invalid crossing campaign event." { }
            guard EngagementEngine.sameJSON(state.save, before) else { throw CampaignError.invalid("Failed event mutated original.") }
            if let checkpoint = item["replayCheckpoint"] as? Record {
                let replay = try state.reconsideringFailedCrossing()
                guard EngagementEngine.sameJSON(replay.save, checkpoint) else { throw CampaignError.invalid("Failed crossing replay differs.") }
                recovered += 1
            } else {
                do { _ = try state.reconsideringFailedCrossing(); throw CampaignError.invalid("Invalid replay allowed.") }
                catch CampaignError.invalid(let message) where message.contains("Only a terminal loss") { }
            }
            count += 1
        }
        for bad in fixture.records("rejected") {
            do { _ = try CrossingCampaignEngine.replay(content: content, saved: bad) }
            catch { continue }
            throw CampaignError.invalid("Invalid campaign ledger accepted.")
        }
        for index in 0..<3 {
            var inputs = [campaignData, engagementData, aftermathData]; inputs[index].append(32)
            do { _ = try CrossingCampaignContent(campaignData: inputs[0], engagementData: inputs[1], rulesData: rulesData, aftermathData: inputs[2]) }
            catch { continue }
            throw CampaignError.invalid("Content-byte drift accepted.")
        }
        print("PASS: \(count) campaign checkpoints, \(fixture.int("tacticalPaths")) tactical paths, \(recovered) loss/recovery checkpoints, \(fixture.records("rejected").count) corrupt ledgers; exact resource layers, flags, promises and reactions.")
    }
}
