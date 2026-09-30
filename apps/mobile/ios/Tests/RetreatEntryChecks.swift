import Foundation
import CryptoKit

@main struct RetreatEntryChecks {
    static func main() throws {
        guard CommandLine.arguments.count == 4 else { fatalError("Pass campaign, council and Fan Yang JSON") }
        func load(_ path: String) throws -> (Record, String) {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            return (try JSONSerialization.jsonObject(with: data) as! Record,
                    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined())
        }
        let (campaign, campaignHash) = try load(CommandLine.arguments[1])
        let (councilDefinition, councilHash) = try load(CommandLine.arguments[2])
        let (fanyangDefinition, fanyangHash) = try load(CommandLine.arguments[3])
        func chapter(_ seed: UInt32) throws -> CampaignEngine {
            var game = try CampaignEngine(campaign: campaign, seed: seed)
            for choice in ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"] { try game.choose(choice) }
            precondition(game.completed && game.failure == nil)
            return game
        }
        let origin = try chapter(0), foreign = try chapter(1)
        var council = try CouncilEngine(definition: councilDefinition, entry: CouncilEntry.from(origin)!)
        for id in ["defer-title", "joint-ledger", "one-command"] { try council.choose(id) }
        let initial = try FanyangEngine(definition: fanyangDefinition, entry: FanyangEntry(council: council, fingerprint: councilHash))
        func handoff(_ state: FanyangEngine, source: CampaignEngine? = nil, revision: String? = nil) throws -> RetreatEntry {
            try RetreatEntry(chapter: source ?? origin, council: council, fanyang: state,
                             campaignFingerprint: campaignHash, councilFingerprint: revision ?? councilHash, fanyangFingerprint: fanyangHash)
        }
        var rejected = 0
        func rejects(_ work: () throws -> Void) {
            do { try work() } catch { rejected += 1; return }
            fatalError("Invalid retreat handoff accepted")
        }
        rejects { _ = try handoff(initial) }
        var count = 0, outcomes = Set<String>(), identities = Set<String>()
        func walk(_ state: FanyangEngine) throws {
            if !state.completed {
                for choice in state.choices where state.canChoose(choice) { try walk(state.preview(choice.text("id"))) }
                return
            }
            let before = state.metrics, history = state.history
            let entry = try handoff(state)
            let repeated = try handoff(state)
            precondition(entry == repeated)
            precondition(entry.metrics == Dictionary(uniqueKeysWithValues: CouncilEngine.metricKeys.map { ($0, before[$0]!) }))
            precondition(entry.metrics["assurance"] == nil)
            precondition(entry.priorChoices == origin.history.map { $0.text("choiceId") } + council.history.map(\.choiceId) + state.history.map(\.choiceId))
            precondition(entry.readingContext == ["fanyang": state.outcome!, "yu": "unestablished", "han": "unestablished"])
            precondition(entry.registerOpening == "read-publicly" && entry.crossingOrder == "repair-the-ford" && !entry.courierRecruitedEarlier)
            rejects { _ = try handoff(state, source: foreign) }
            rejects { _ = try handoff(state, revision: String(repeating: "0", count: 64)) }
            rejects { _ = try handoff(state, revision: "invalid") }
            let revised = try RetreatEntry(chapter: origin, council: council, fanyang: state,
                                          campaignFingerprint: String(repeating: "1", count: 64), councilFingerprint: councilHash, fanyangFingerprint: fanyangHash)
            precondition(revised.id != entry.id)
            precondition(state.metrics == before && state.history == history)
            precondition(identities.insert(entry.id).inserted)
            outcomes.insert(state.outcome!); count += 1
        }
        try walk(initial)
        precondition(outcomes == Set(["opened", "withdrawn", "deferred"]))
        print("Retreat native entry checks passed: \(count) real Fan Yang routes from one complete chapter/council, all three outcomes, \(rejected) invalid handoffs rejected; no resource refill, assumed reunion or input mutation.")
    }
}
