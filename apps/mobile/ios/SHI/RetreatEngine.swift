import Foundation

struct RetreatDebt: Codable, Equatable {
    let id: String
    let creditor: String
    let grain: Int
}
struct RetreatTurn: Codable, Equatable {
    let sceneId: String
    let choiceId: String
    let before: Resources
    let after: Resources
}
struct RetreatChronicle: Codable {
    let version: Int
    let definitionId: String
    let entryId: String
    let rulesSHA256: String
    let storySHA256: String
    let choices: [String]
}
struct RetreatInspection {
    let available: Bool
    let effects: Resources
    let requirements: [CouncilRequirement]
    let maximums: Resources
    let prerequisiteMet: Bool
    let answers: [Record]
    let after: Resources?
    let outcome: String?
    let newDebt: RetreatDebt?
}

/// Pure development rules. The caller verifies canonical bytes and supplies a
/// validated entry. No persistence, bundle promotion or invented starting stock.
struct RetreatEngine {
    let definition: Record
    let entry: RetreatEntry
    private(set) var metrics: Resources
    private(set) var history: [RetreatTurn] = []
    private(set) var debts: [RetreatDebt] = []
    private(set) var outcome: String?
    var completed: Bool { outcome != nil }
    var resourceCustody: String { outcome == "dispersed" ? "groups" : outcome == "scattered" ? "unresolved" : "common" }
    var scene: Record { completed ? [:] : definition.records("scenes")[history.count] }
    var choices: [Record] { scene.records("choices") }

    init(definition: Record, entry: RetreatEntry) throws {
        guard definition.int("schemaVersion") == 1, definition.text("id") == "chen-retreat-rules.v1",
              definition.text("storyId") == "chen-retreat-story-draft.v1",
              definition.records("scenes").map({ $0.text("id") }) == ["reserves", "bad-news", "evacuation", "records", "dawn"],
              Set(entry.metrics.keys) == Set(CouncilEngine.metricKeys),
              entry.metrics.values.allSatisfy({ (0...10).contains($0) }) else {
            throw CampaignError.invalid("Unsupported retreat definition or entry.")
        }
        self.definition = definition; self.entry = entry; metrics = entry.metrics
    }

    func inspect(_ id: String) throws -> RetreatInspection {
        guard !completed, let choice = choices.first(where: { $0.text("id") == id }) else {
            throw CampaignError.invalid("Unknown retreat order.")
        }
        let past = entry.priorChoices + history.map(\.choiceId)
        let answers = choice.records("answers").filter { past.contains($0.text("afterChoice")) }
        var effects: Resources = [:]
        // Aggregate before clamping: reserve/ledger savings offset actual costs.
        for change in [choice.object("effects")] + answers.map({ $0.object("effects") }) {
            for key in CouncilEngine.metricKeys { effects[key, default: 0] += change.int(key) }
        }
        let requirements = CouncilEngine.metricKeys.map { key in
            CouncilRequirement(id: key, value: metrics[key]!, required: max(choice.object("requires").int(key),
                key == "grain" || key == "tempo" ? max(0, -effects[key, default: 0]) : 0))
        }
        let maximums = choice.object("maximum").compactMapValues { $0 as? Int }
        let prerequisiteMet = choice["afterChoiceRequired"] == nil || past.contains(choice.text("afterChoiceRequired"))
        let debt = choice.object("debt")
        let available = requirements.allSatisfy(\.met) && prerequisiteMet
            && maximums.allSatisfy { metrics[$0.key, default: 0] <= $0.value }
            && (debt.isEmpty || !debts.contains { $0.id == debt.text("id") })
        let after = Dictionary(uniqueKeysWithValues: CouncilEngine.metricKeys.map {
            ($0, max(0, min(10, metrics[$0]! + effects[$0, default: 0])))
        })
        var ending: String?
        if available, let requested = choice["ending"] as? String {
            if requested == "disperse" {
                let required = definition.object("dispersionRequirements")
                ending = after["grain"]! >= required.int("grain")
                    && max(after["city"]!, max(after["allies"]!, after["veterans"]!)) >= required.int("anyBacking")
                    ? "dispersed" : "scattered"
            } else { ending = requested }
        }
        return RetreatInspection(available: available, effects: effects, requirements: requirements,
            maximums: maximums, prerequisiteMet: prerequisiteMet, answers: answers,
            after: available ? after : nil, outcome: ending,
            newDebt: available && !debt.isEmpty ? RetreatDebt(id: debt.text("id"), creditor: debt.text("creditor"), grain: debt.int("grain")) : nil)
    }
    func canChoose(_ choice: Record) -> Bool { (try? inspect(choice.text("id")).available) ?? false }
    func preview(_ id: String) throws -> RetreatEngine { var next = self; try next.choose(id); return next }
    @discardableResult mutating func choose(_ id: String) throws -> RetreatTurn {
        let inspected = try inspect(id)
        guard inspected.available, let after = inspected.after,
              (history.count + 1 == definition.records("scenes").count) == (inspected.outcome != nil),
              inspected.outcome == nil || ["together", "remnant", "dispersed", "scattered"].contains(inspected.outcome!) else {
            throw CampaignError.invalid("Unavailable retreat order or invalid ending.")
        }
        let turn = RetreatTurn(sceneId: scene.text("id"), choiceId: id, before: metrics, after: after)
        metrics = after; history.append(turn); outcome = inspected.outcome
        if let debt = inspected.newDebt { debts.append(debt) }
        return turn
    }
    func chronicle(rulesFingerprint: String, storyFingerprint: String) throws -> RetreatChronicle {
        guard [rulesFingerprint, storyFingerprint].allSatisfy(FanyangEntry.validDigest) else {
            throw CampaignError.invalid("Invalid retreat revision.")
        }
        return RetreatChronicle(version: 1, definitionId: definition.text("id"), entryId: entry.id,
            rulesSHA256: rulesFingerprint, storySHA256: storyFingerprint, choices: history.map(\.choiceId))
    }
    static func restore(definition: Record, entry: RetreatEntry, rulesFingerprint: String,
                        storyFingerprint: String, save: RetreatChronicle, compatibleStoryFingerprints: [String] = []) throws -> RetreatEngine {
        guard [rulesFingerprint, storyFingerprint].allSatisfy(FanyangEntry.validDigest), save.version == 1,
              save.definitionId == definition.text("id"), save.entryId == entry.id,
              save.rulesSHA256 == rulesFingerprint, FanyangEntry.validDigest(save.storySHA256),
              (save.storySHA256 == storyFingerprint || compatibleStoryFingerprints.contains(save.storySHA256)),
              save.choices.count <= 5 else { throw CampaignError.invalid("Retreat save does not match this entry or revision.") }
        var engine = try RetreatEngine(definition: definition, entry: entry)
        for id in save.choices { try engine.choose(id) }
        return engine
    }
}
