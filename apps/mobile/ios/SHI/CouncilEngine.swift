import Foundation

struct CouncilEntry: Codable, Equatable {
    let id: String
    let arrival: String

    static func from(_ origin: CampaignEngine) -> CouncilEntry? {
        guard origin.completed, origin.failure == nil, !origin.history.isEmpty else { return nil }
        // Platform-local save identity, not an interchange claim with web storage.
        // Bind to the complete source route and resources, never just its seed.
        var identity: [Any] = [origin.campaign.text("id"), origin.seed,
            origin.history.map { [$0.text("nodeId"), $0.text("choiceId"), $0.text("conditionId")] }, origin.resources]
        if let tacticalIdentity = origin.continuationIdentity { identity.append(tacticalIdentity) }
        guard let data = try? JSONSerialization.data(withJSONObject: identity, options: [.sortedKeys]),
              let id = String(data: data, encoding: .utf8) else { return nil }
        let arrival = origin.resources["grain", default: 0] >= 45 ? "supplied"
            : origin.resources["danger", default: 0] >= 65 ? "pressed" : "divided"
        return CouncilEntry(id: id, arrival: arrival)
    }
}

struct CouncilTurn: Codable, Equatable {
    let choiceId: String
    let before: Resources
    let after: Resources
}

struct CouncilRequirement: Identifiable, Equatable {
    let id: String
    let value: Int
    let required: Int
    var met: Bool { value >= required }
}

struct CouncilReadiness {
    let supporters: [String]
    let checks: [CouncilRequirement]
}

struct CouncilChronicle: Codable {
    let version: Int
    let definitionId: String
    let definitionSHA256: String
    let entry: CouncilEntry
    let choices: [String]
}

/// Foundation-only implementation of the shared council contract. Every legal
/// route and every intermediate result is compared to TypeScript fixtures.
struct CouncilEngine {
    static let metricKeys = ["grain", "tempo", "city", "allies", "veterans"]
    let definition: Record
    let entry: CouncilEntry
    private(set) var metrics: Resources
    private(set) var history: [CouncilTurn] = []

    init(definition: Record, entry: CouncilEntry) throws {
        guard definition.int("schemaVersion") == 1, definition.text("id") == "chen-council.v1",
              definition.records("rounds").count == 3, !entry.id.isEmpty,
              let initial = definition.object("arrivals").object(entry.arrival)["metrics"] as? Resources,
              Set(initial.keys) == Set(Self.metricKeys), initial.values.allSatisfy({ (0...10).contains($0) }) else {
            throw CampaignError.invalid("Unsupported council definition or arrival.")
        }
        self.definition = definition; self.entry = entry; metrics = initial
    }

    var completed: Bool { history.count == definition.records("rounds").count }
    var round: Record { completed ? [:] : definition.records("rounds")[history.count] }
    var choices: [Record] { round.records("choices") }
    var outcome: String? {
        guard completed else { return nil }
        return Self.classify(metrics)
    }
    var readiness: CouncilReadiness { Self.assess(metrics) }
    static func assess(_ metrics: Resources) -> CouncilReadiness {
        let supporters = ["city", "allies", "veterans"].filter { metrics[$0, default: 0] >= 6 }
        return CouncilReadiness(supporters: supporters, checks: [
            CouncilRequirement(id: "support", value: supporters.count, required: 2),
            CouncilRequirement(id: "grain", value: metrics["grain", default: 0], required: 2),
            CouncilRequirement(id: "tempo", value: metrics["tempo", default: 0], required: 3)
        ])
    }
    static func classify(_ metrics: Resources) -> String {
        if metrics["grain", default: 0] <= 0 { return "empty-granaries" }
        if assess(metrics).checks.allSatisfy(\.met) { return "common-front" }
        if metrics["city", default: 0] >= 6 && metrics["veterans", default: 0] >= 6 { return "city-stronghold" }
        return "fragile-coalition"
    }
    func canChoose(_ choice: Record) -> Bool {
        !completed && choices.contains(where: { $0.text("id") == choice.text("id") })
            && Self.metricKeys.allSatisfy { metrics[$0, default: 0] >= choice.object("requires").int($0) }
    }
    func answers(_ choice: Record) -> [Record] {
        choice.records("answers").filter { answer in history.contains { $0.choiceId == answer.text("afterChoice") } }
    }
    func choice(at index: Int) -> Record {
        guard history.indices.contains(index) else { return [:] }
        return definition.records("rounds")[index].records("choices").first { $0.text("id") == history[index].choiceId } ?? [:]
    }
    func journalAnswers(at index: Int) -> [Record] {
        guard history.indices.contains(index) else { return [] }
        return choice(at: index).records("answers").filter { answer in
            history.prefix(index).contains { $0.choiceId == answer.text("afterChoice") }
        }
    }
    func preview(_ id: String) throws -> CouncilEngine { var next = self; try next.choose(id); return next }
    @discardableResult mutating func choose(_ id: String) throws -> CouncilTurn {
        guard let choice = choices.first(where: { $0.text("id") == id }), canChoose(choice) else {
            throw CampaignError.invalid("Unavailable council choice.")
        }
        let before = metrics
        // Clamp each ordered effect separately, exactly as the shared resolver.
        for effects in [choice.object("effects")] + answers(choice).map({ $0.object("effects") }) {
            for key in Self.metricKeys { metrics[key] = max(0, min(10, metrics[key, default: 0] + effects.int(key))) }
        }
        let turn = CouncilTurn(choiceId: id, before: before, after: metrics)
        history.append(turn)
        return turn
    }
    func chronicle(fingerprint: String) -> CouncilChronicle {
        CouncilChronicle(version: 1, definitionId: definition.text("id"), definitionSHA256: fingerprint, entry: entry, choices: history.map(\.choiceId))
    }
    static func restore(definition: Record, entry: CouncilEntry, fingerprint: String, save: CouncilChronicle) throws -> CouncilEngine {
        guard save.version == 1, save.definitionId == definition.text("id"), save.definitionSHA256 == fingerprint,
              save.entry == entry, save.choices.count <= definition.records("rounds").count else {
            throw CampaignError.invalid("This council save does not match the current chronicle or rules.")
        }
        var engine = try CouncilEngine(definition: definition, entry: entry)
        for id in save.choices { try engine.choose(id) }
        return engine
    }
}
