import Foundation

struct RetreatDecisionRecord: Identifiable {
    let id: String
    let title: String
    let explanation: String
    let before: Resources
    let after: Resources
    var changedKeys: [String] { CouncilEngine.metricKeys.filter { before[$0] != after[$0] } }
}

/// Pure projection of the shared story and replayed decisions. No new facts,
/// resource changes, companion recruitment or persistence in presentation code.
struct RetreatPresentation {
    let story: Record
    let engine: RetreatEngine
    let reading: Bool
    var facts: [String: String] {
        engine.history.reduce(into: engine.entry.readingContext) { $0[$1.sceneId] = $1.choiceId }
    }
    private func matches(_ condition: Record) -> Bool {
        condition.allSatisfy { key, value in (value as? String).map { facts[key] == $0 } ?? false }
    }
    var witnessed: [Record] {
        story.records("witnessedEvents").filter { event in
            guard let index = story.records("scenes").firstIndex(where: { $0.text("id") == event.text("sceneId") }) else { return false }
            return (index < engine.history.count || (!reading && index == engine.history.count))
                && matches(event.object("when"))
                && (event["priorChapterChoice"] == nil || engine.entry.priorChoices.contains(event.text("priorChapterChoice")))
        }
    }
    var scene: Record {
        let index = reading ? engine.history.count - 1 : engine.history.count
        let scenes = story.records("scenes")
        return scenes.indices.contains(index) ? scenes[index] : [:]
    }
    var sceneLines: [Record] {
        scene.records("lines")
        + witnessed.filter { $0.text("sceneId") == scene.text("id") }.flatMap { $0.records("lines") }
        + variants(scene)
        + ["councilCallbacks", "chapterCallbacks"].flatMap { key in
            story.records(key).filter { $0.text("sceneId") == scene.text("id") && engine.entry.priorChoices.contains($0.text("afterChoice")) }.flatMap { $0.records("lines") }
        }
        + scene.records("decisionLeadIn")
    }
    func variants(_ record: Record) -> [Record] {
        record.records("variants").filter { matches($0.object("when")) }.flatMap { $0.records("lines") }
    }
    var lastChoice: Record {
        guard let last = engine.history.last,
              let source = story.records("scenes").first(where: { $0.text("id") == last.sceneId }) else { return [:] }
        return source.records("choices").first { $0.text("id") == last.choiceId } ?? [:]
    }
    var responseLines: [Record] {
        guard reading, let last = engine.history.last else { return [] }
        let response = engine.outcome == "scattered" ? story.object("scatteredEnding").records("response") : lastChoice.records("response")
        let endingAnswers = engine.outcome.map { outcome in witnessed.flatMap { $0.object("endingResponses").records(outcome) } } ?? []
        return response + endingAnswers
            + witnessed.flatMap { $0.object("decisionResponses").records(last.choiceId) }
            + scene.records("exitLines")
    }
    var ending: Record {
        guard let outcome = engine.outcome else { return [:] }
        return outcome == "scattered" ? story.object("scatteredEnding") : story.object("endings").object(outcome)
    }
    var endingLines: [Record] { ending.records("lines") + variants(ending) }
    var decisionRecord: [RetreatDecisionRecord] {
        guard engine.completed, !reading else { return [] }
        return engine.history.map { turn in
            let scene = story.records("scenes").first { $0.text("id") == turn.sceneId } ?? [:]
            let choice = scene.records("choices").first { $0.text("id") == turn.choiceId } ?? [:]
            return RetreatDecisionRecord(id: turn.choiceId,
                title: scene.text("title") + " · " + choice.text("title"),
                explanation: engine.definition.object("explanationsZh").text(turn.choiceId),
                before: turn.before, after: turn.after)
        }
    }
}
