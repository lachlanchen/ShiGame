import Foundation

struct RetreatDecisionRecord: Identifiable {
    let id: String
    let title: String
    let explanation: String
    let responseLines: [Record]
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
    var evidenceScene: Record {
        if engine.completed, let last = engine.history.last {
            return story.records("scenes").first { $0.text("id") == last.sceneId } ?? [:]
        }
        return scene
    }
    var feasibleChoices: [Record] {
        guard !reading, !engine.completed else { return [] }
        return scene.records("choices").filter { engine.canChoose($0) }
    }
    var promiseAnswers: [String] {
        guard reading, let last = engine.history.last,
              var before = try? RetreatEngine(definition: engine.definition, entry: engine.entry) else { return [] }
        do {
            for turn in engine.history.dropLast() { try before.choose(turn.choiceId) }
            return try before.inspect(last.choiceId).answers.map {
                engine.definition.object("answerExplanationsZh").text($0.text("afterChoice"))
            }
        } catch { return [] }
    }
    var sceneLines: [Record] {
        let current = scene
        var lines = current.records("lines")
        lines += witnessed.filter { $0.text("sceneId") == current.text("id") }.flatMap { $0.records("lines") }
        lines += variants(current)
        for key in ["councilCallbacks", "chapterCallbacks"] {
            let callbacks = story.records(key).filter {
                $0.text("sceneId") == current.text("id") && engine.entry.priorChoices.contains($0.text("afterChoice"))
            }
            lines += callbacks.flatMap { $0.records("lines") }
        }
        lines += current.records("decisionLeadIn")
        return lines
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
                responseLines: engine.outcome == "scattered" && turn == engine.history.last
                    ? story.object("scatteredEnding").records("response") : choice.records("response"),
                before: turn.before, after: turn.after)
        }
    }
}
