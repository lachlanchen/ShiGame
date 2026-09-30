import Foundation
import CryptoKit

@main struct RetreatPresentationChecks {
    static func main() throws {
        guard CommandLine.arguments.count == 6 else { fatalError("Pass campaign, council, Fan Yang, rules and story JSON") }
        func load(_ index: Int) throws -> (Record, String) {
            let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[index]))
            return (try JSONSerialization.jsonObject(with: data) as! Record,
                SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined())
        }
        let (campaign, ch) = try load(1), (councilDefinition, co) = try load(2), (fanyangDefinition, fa) = try load(3)
        let (rules, ru) = try load(4), (story, st) = try load(5)
        func entry(_ recruited: Bool) throws -> RetreatEntry {
            var chapter = try CampaignEngine(campaign: campaign, seed: 0)
            let orders = recruited ? ["hide-the-register", "turn-the-courier", "families-first", "root-in-villages"]
                : ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"]
            for id in orders { try chapter.choose(id) }
            var council = try CouncilEngine(definition: councilDefinition, entry: CouncilEntry.from(chapter)!)
            for id in ["defer-title", "joint-ledger", "one-command"] { try council.choose(id) }
            var fanyang = try FanyangEngine(definition: fanyangDefinition, entry: FanyangEntry(council: council, fingerprint: co))
            for id in ["public-safety", "hold-talks", "withdraw-envoy"] { try fanyang.choose(id) }
            return try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
                campaignFingerprint: ch, councilFingerprint: co, fanyangFingerprint: fa)
        }
        func texts(_ lines: [Record]) -> [String] { lines.map { $0.text("text") } }
        let routes = [
            ("together", ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"]),
            ("remnant", ["keep-reserve", "gather-own", "hold-formation", "strip-identities", "move-with-remnant"]),
            ("dispersed", ["decline-dispatch", "gather-own", "split-routes", "divide-records", "release-groups"]),
            ("scattered", ["keep-reserve", "open-reception", "escort-households", "carry-records", "release-groups"])
        ]
        var phases = 0
        for (outcome, choices) in routes {
            let origin = try entry(false)
            var engine = try RetreatEngine(definition: rules, entry: origin)
            for id in choices {
                let view = RetreatPresentation(story: story, engine: engine, reading: false)
                let lines = texts(view.sceneLines)
                precondition(view.responseLines.isEmpty)
                precondition(view.decisionRecord.isEmpty, "Do not insert the ending record during play")
                if view.scene.text("id") == "dawn" {
                    let question = "还按原来的队么？"
                    precondition(lines.last == question, "Ask for the final decision after the reports")
                    precondition(lines.filter { $0 == question }.count == 1)
                }
                for key in ["chapterCallbacks", "councilCallbacks"] {
                    for callback in story.records(key) {
                        for line in texts(callback.records("lines")) {
                            precondition(lines.contains(line) == (callback.text("sceneId") == view.scene.text("id") && origin.priorChoices.contains(callback.text("afterChoice"))))
                        }
                    }
                }
                let yuExpected = view.scene.text("id") == "dawn" && choices[0] == "keep-reserve" && choices[2] == "escort-households"
                precondition(view.witnessed.contains { $0.text("id") == "yu-rendezvous-arrival" } == yuExpected)
                precondition(!view.witnessed.contains { $0.text("id") == "han-route-reply" })
                try engine.choose(id)
                let reaction = RetreatPresentation(story: story, engine: engine, reading: true)
                precondition(reaction.decisionRecord.isEmpty, "Read the saved reaction before the ending record")
                let save = try engine.chronicle(rulesFingerprint: ru, storyFingerprint: st)
                let restored = try RetreatEngine.restore(definition: rules, entry: origin, rulesFingerprint: ru, storyFingerprint: st, save: save)
                precondition(texts(reaction.responseLines) == texts(RetreatPresentation(story: story, engine: restored, reading: true).responseLines))
                precondition(!reaction.responseLines.isEmpty)
                if engine.history.count == 4 { precondition(reaction.witnessed.isEmpty, "Do not reveal dawn arrival during record reaction") }
                if engine.outcome == "scattered" {
                    let prefix = texts(story.object("scatteredEnding").records("response"))
                    precondition(Array(texts(reaction.responseLines).prefix(prefix.count)) == prefix)
                }
                phases += 2
            }
            precondition(engine.outcome == outcome)
            let end = RetreatPresentation(story: story, engine: engine, reading: false)
            precondition(end.scene.isEmpty && !end.endingLines.isEmpty)
            let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
            let saveBeforeRecord = try encoder.encode(engine.chronicle(rulesFingerprint: ru, storyFingerprint: st))
            let record = end.decisionRecord
            precondition(record.map(\.id) == choices)
            for (row, turn) in zip(record, engine.history) {
                precondition(row.before == turn.before && row.after == turn.after)
                precondition(!row.title.isEmpty && !row.explanation.isEmpty)
                precondition(row.changedKeys == CouncilEngine.metricKeys.filter { turn.before[$0] != turn.after[$0] })
            }
            let saveAfterRecord = try encoder.encode(engine.chronicle(rulesFingerprint: ru, storyFingerprint: st))
            precondition(saveAfterRecord == saveBeforeRecord)
            let matched = end.ending.records("variants").filter { $0.object("when").text("records") == choices[3] }
            precondition(matched.count == 1)
            precondition(texts(end.endingLines) == texts(end.ending.records("lines") + matched[0].records("lines")))
            phases += 1
        }
        for recruited in [false, true] {
            var engine = try RetreatEngine(definition: rules, entry: entry(recruited))
            for id in ["verify-road", "gather-own", "split-routes"] { try engine.choose(id) }
            precondition(RetreatPresentation(story: story, engine: engine, reading: true).witnessed.isEmpty)
            let records = RetreatPresentation(story: story, engine: engine, reading: false)
            precondition(records.witnessed.contains { $0.text("id") == "han-route-reply" } == recruited)
            try engine.choose("strip-identities")
            let reaction = RetreatPresentation(story: story, engine: engine, reading: true)
            let letter = story.records("witnessedEvents").first { $0.text("id") == "han-route-reply" }!
            for line in texts(letter.object("decisionResponses").records("strip-identities")) {
                precondition(texts(reaction.responseLines).contains(line) == recruited)
            }
            phases += 3
        }
        print("Native retreat presentation checks passed: \(phases) decision/reaction/ending phases, four actual outcomes, scoped chapter/council memories, witnessed Yu/Han timing and replayed prose.")
    }
}
