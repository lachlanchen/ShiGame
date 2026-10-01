import Foundation

/// Foundation-only tactical crossing. The campaign ledger must explicitly
/// adopt its result; finishing this engine alone never advances Chapter I.
struct EngagementEngine {
    static let metricKeys = ["crossingProgress", "rearCohesion", "reserveReadiness", "supplyLoads", "pursuitClosure", "signalIntegrity"]
    let definition: Record
    let planID: String
    let conditionID: String
    private(set) var pulseIndex = 0
    private(set) var metrics: Resources
    private(set) var history: [Record] = []
    private(set) var completed = false
    private(set) var outcomeID: String?
    private(set) var campaignEffects: Resources?

    init(definition: Record, planID: String, conditionID: String) throws {
        guard definition.int("schemaVersion") == 1,
              definition.text("deliveryStatus") == "validated-shared-contract-not-campaign-authority",
              definition.text("claimStatus") == "dramatic-reconstruction",
              Set(definition.strings("metrics")) == Set(Self.metricKeys),
              let initial = definition["initialMetrics"] as? Resources,
              Set(initial.keys) == Set(Self.metricKeys),
              let plan = definition.records("plans").first(where: { $0.text("id") == planID }),
              let condition = definition.records("conditions").first(where: { $0.text("id") == conditionID }),
              !definition.records("pulses").isEmpty else {
            throw CampaignError.invalid("Unsupported crossing definition, plan or condition.")
        }
        self.definition = definition; self.planID = planID; self.conditionID = conditionID
        metrics = Self.apply(Self.apply(initial, plan.object("initialEffects")), condition.object("localEffects"))
    }

    private static func apply(_ metrics: Resources, _ effects: Record) -> Resources {
        Dictionary(uniqueKeysWithValues: metricKeys.map { ($0, max(0, min(100, metrics[$0, default: 0] + effects.int($0)))) })
    }

    private static func meets(_ metrics: Resources, _ requirements: Record) -> Bool {
        metricKeys.allSatisfy { key in
            let value = metrics[key, default: 0]
            return value >= (requirements.object("min")[key] as? Int ?? Int.min)
                && value <= (requirements.object("max")[key] as? Int ?? Int.max)
        }
    }

    var availableCommands: [Record] {
        guard !completed, definition.records("pulses").indices.contains(pulseIndex),
              let plan = definition.records("plans").first(where: { $0.text("id") == planID }) else { return [] }
        let pulse = definition.records("pulses")[pulseIndex]
        let allowed = Set(plan.object("allowedCommands").strings(pulse.text("id")))
        return pulse.strings("commandIds").compactMap { id in
            definition.records("commands").first { command in
                command.text("id") == id && command.text("pulseId") == pulse.text("id")
                    && allowed.contains(id) && Self.meets(metrics, command.object("requirements"))
            }
        }
    }

    @discardableResult mutating func command(_ id: String) throws -> Record {
        guard let command = availableCommands.first(where: { $0.text("id") == id }) else {
            throw CampaignError.invalid("Crossing order is unavailable or the encounter is complete.")
        }
        let pulse = definition.records("pulses")[pulseIndex]
        let response = command.object("response"), before = metrics
        let afterCommand = Self.apply(before, command.object("effects"))
        let afterResponse = Self.apply(afterCommand, response.object("effects"))
        let nextIndex = pulseIndex + 1, done = nextIndex == definition.records("pulses").count
        var outcome: Record?
        var combined: Resources?
        if done {
            guard let selected = definition.records("outcomes").first(where: { Self.meets(afterResponse, $0.object("requirements")) }),
                  let plan = definition.records("plans").first(where: { $0.text("id") == planID }) else {
                throw CampaignError.invalid("Completed crossing has no authored outcome.")
            }
            outcome = selected
            combined = Dictionary(uniqueKeysWithValues: resourceKeys.compactMap { key in
                let value = plan.object("campaignEffects").int(key) + selected.object("campaignEffects").int(key)
                return value == 0 ? nil : (key, value)
            })
        }
        let turn: Record = ["pulseId": pulse.text("id"), "commandId": id, "before": before,
                            "afterCommand": afterCommand, "responseId": response.text("id"), "afterResponse": afterResponse]
        // Publish state only after all validation succeeds.
        metrics = afterResponse; pulseIndex = nextIndex; completed = done
        outcomeID = outcome?.text("id"); campaignEffects = combined; history.append(turn)
        return turn
    }

    var snapshot: Record {
        var result: Record = ["saveVersion": 1, "engagementId": definition.text("id"), "planId": planID,
                              "conditionId": conditionID, "pulseIndex": pulseIndex, "metrics": metrics,
                              "history": history, "completed": completed]
        if let outcomeID { result["outcomeId"] = outcomeID }
        if let campaignEffects { result["campaignEffects"] = campaignEffects }
        return result
    }

    static func sameJSON(_ first: Any, _ second: Any) -> Bool {
        guard let lhs = try? JSONSerialization.data(withJSONObject: ["value": first], options: [.sortedKeys]),
              let rhs = try? JSONSerialization.data(withJSONObject: ["value": second], options: [.sortedKeys]) else { return false }
        return lhs == rhs
    }

    /// As in the canonical resolver, replay identifiers and compare every
    /// derived value. Ignore only unknown top-level transport metadata.
    static func replay(definition: Record, saved: Record) throws -> EngagementEngine {
        guard saved.int("saveVersion") == 1, saved.text("engagementId") == definition.text("id"),
              let records = saved["history"] as? [Record] else { throw CampaignError.invalid("Invalid crossing save.") }
        var engine = try Self(definition: definition, planID: saved.text("planId"), conditionID: saved.text("conditionId"))
        for record in records {
            let actual = try engine.command(record.text("commandId"))
            guard sameJSON(actual, record) else { throw CampaignError.invalid("Crossing turn does not match canonical replay.") }
        }
        let keys = ["saveVersion", "engagementId", "planId", "conditionId", "pulseIndex", "metrics", "history", "completed", "outcomeId", "campaignEffects"]
        let comparable = saved.filter { keys.contains($0.key) }
        guard sameJSON(engine.snapshot, comparable) else { throw CampaignError.invalid("Crossing state does not match canonical replay.") }
        return engine
    }
}
