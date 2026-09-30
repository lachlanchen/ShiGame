import Foundation

struct FanyangEntry: Codable, Equatable {
    let id: String
    let councilChoices: [String]
    let metrics: Resources

    /// The caller supplies the replay-validated council and canonical digest.
    /// Native identity is platform-local; gameplay is cross-engine conformant.
    init(council: CouncilEngine, fingerprint: String) throws {
        guard council.completed, Self.validDigest(fingerprint) else {
            throw CampaignError.invalid("Complete and validate Chen before continuing.")
        }
        councilChoices = council.history.map(\.choiceId)
        metrics = council.metrics
        let identity: [Any] = ["fanyang-guarantee.v1", council.definition.text("id"), fingerprint,
                               council.entry.id, council.entry.arrival, councilChoices]
        id = String(decoding: try JSONSerialization.data(withJSONObject: identity, options: [.sortedKeys]), as: UTF8.self)
    }
    static func validDigest(_ value: String) -> Bool {
        value.count == 64 && value.utf8.allSatisfy { (48...57).contains($0) || (97...102).contains($0) }
    }
}

struct FanyangChronicle: Codable {
    let version: Int
    let definitionId: String
    let definitionSHA256: String
    let entryId: String
    let choices: [String]
}

struct FanyangEngine {
    static let metricKeys = CouncilEngine.metricKeys + ["assurance"]
    let definition: Record
    let entry: FanyangEntry
    private(set) var metrics: Resources
    private(set) var history: [CouncilTurn] = []

    init(definition: Record, entry: FanyangEntry) throws {
        guard definition.int("schemaVersion") == 1, definition.text("id") == "fanyang-guarantee.v1",
              definition.records("rounds").count == 3,
              Set(entry.metrics.keys) == Set(CouncilEngine.metricKeys),
              entry.metrics.values.allSatisfy({ (0...10).contains($0) }),
              let assurance = definition["initialAssurance"] as? Int, (0...10).contains(assurance) else {
            throw CampaignError.invalid("Unsupported Fan Yang definition or entry.")
        }
        self.definition = definition; self.entry = entry
        metrics = entry.metrics; metrics["assurance"] = assurance
    }
    var completed: Bool { history.count == definition.records("rounds").count }
    var round: Record { completed ? [:] : definition.records("rounds")[history.count] }
    var choices: [Record] { round.records("choices") }
    var gateChecks: [CouncilRequirement] {
        let required = definition.object("gateRequirements")
        return Self.metricKeys.compactMap { key in
            guard let minimum = required[key] as? Int else { return nil }
            return CouncilRequirement(id: key, value: metrics[key, default: 0], required: minimum)
        }
    }
    var outcome: String? {
        guard completed, let last = history.last else { return nil }
        let choice = definition.records("rounds").last!.records("choices").first { $0.text("id") == last.choiceId }!
        return choice.text("resolution") == "withdraw" ? "withdrawn" : gateChecks.allSatisfy(\.met) ? "opened" : "deferred"
    }
    func canChoose(_ offered: Record) -> Bool {
        guard !completed, let choice = choices.first(where: { $0.text("id") == offered.text("id") }) else { return false }
        return Self.metricKeys.allSatisfy { metrics[$0, default: 0] >= choice.object("requires").int($0) }
            && (!(choice["gateRequired"] as? Bool ?? false) || gateChecks.allSatisfy(\.met))
    }
    func answers(_ choice: Record) -> [Record] {
        let past = entry.councilChoices + history.map(\.choiceId)
        return choice.records("answers").filter { past.contains($0.text("afterChoice")) }
    }
    func preview(_ id: String) throws -> FanyangEngine { var next = self; try next.choose(id); return next }
    @discardableResult mutating func choose(_ id: String) throws -> CouncilTurn {
        guard let choice = choices.first(where: { $0.text("id") == id }), canChoose(choice),
              history.count < 2 || ["enter", "revise", "withdraw"].contains(choice.text("resolution")) else {
            throw CampaignError.invalid("Unavailable Fan Yang order.")
        }
        let before = metrics
        for effects in [choice.object("effects")] + answers(choice).map({ $0.object("effects") }) {
            for key in Self.metricKeys { metrics[key] = max(0, min(10, metrics[key, default: 0] + effects.int(key))) }
        }
        let turn = CouncilTurn(choiceId: id, before: before, after: metrics)
        history.append(turn); return turn
    }
    var prospects: [String] {
        if let outcome { return [outcome] }
        var found = Set<String>()
        for choice in choices where canChoose(choice) {
            if let next = try? preview(choice.text("id")) { found.formUnion(next.prospects) }
        }
        return ["opened", "withdrawn", "deferred"].filter { found.contains($0) }
    }
    func chronicle(fingerprint: String) throws -> FanyangChronicle {
        guard FanyangEntry.validDigest(fingerprint) else { throw CampaignError.invalid("Invalid Fan Yang digest.") }
        return FanyangChronicle(version: 1, definitionId: definition.text("id"), definitionSHA256: fingerprint,
                                entryId: entry.id, choices: history.map(\.choiceId))
    }
    static func restore(definition: Record, entry: FanyangEntry, fingerprint: String, save: FanyangChronicle) throws -> FanyangEngine {
        guard FanyangEntry.validDigest(fingerprint), save.version == 1, save.definitionId == definition.text("id"),
              save.definitionSHA256 == fingerprint, save.entryId == entry.id, save.choices.count <= 3 else {
            throw CampaignError.invalid("Fan Yang save does not match this council or content revision.")
        }
        var engine = try FanyangEngine(definition: definition, entry: entry)
        for id in save.choices { try engine.choose(id) }
        return engine
    }
}
