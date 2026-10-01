import Foundation

/// Pure shared-data continuation. No bundle loading, persistence or release
/// admission. Initialize from a completed, replay-verified native retreat.
struct RefugeContinuationEngine {
    let entryID: String
    let nightDefinition: Record
    let morningDefinition: Record
    let contactDefinition: Record
    let initialGrain: Int
    let debts: [RetreatDebt]
    let records: String
    private(set) var orders: [String] = []
    private(set) var grain: Int
    private(set) var shelter = "undecided"
    private(set) var rested = false
    private(set) var obligation: String?
    private(set) var promise = "none"
    private(set) var localContact = "none"
    private(set) var lead: String?
    private(set) var message = "not-entrusted"
    private(set) var evidence = "none"
    private(set) var disclosure = "none"
    var completed: Bool { orders.count == 3 }
    var location: String { orders.count < 2 ? "unestablished" : orders[1] == "repair-roof" ? "household" : "river-approach" }

    init(retreat: RetreatEngine, night: Record, morning: Record, contact: Record) throws {
        guard retreat.completed,
              let recordOrder = retreat.history.first(where: { $0.sceneId == "records" })?.choiceId,
              ["carry-records", "divide-records", "strip-identities"].contains(recordOrder),
              night.int("schemaVersion") == 1, night.text("id") == "refuge-rules.v1",
              morning.int("schemaVersion") == 1, morning.text("id") == "refuge-morning.v1",
              contact.int("schemaVersion") == 1, contact.text("id") == "refuge-contact.v1",
              night.records("choices").map({ $0.text("id") }) == ["offer-grain", "offer-labour", "sleep-outside"],
              morning.records("choices").map({ $0.text("id") }) == ["repair-roof", "follow-witness"],
              contact.records("choices").map({ $0.text("id") }) == ["leave-route", "leave-record", "ask-unprompted", "show-record"] else {
            throw CampaignError.invalid("Incomplete retreat or unsupported continuation content.")
        }
        entryID = String(decoding: try JSONSerialization.data(withJSONObject:
            ["native-refuge.v1", retreat.entry.id, retreat.history.map(\.choiceId)], options: [.sortedKeys]), as: UTF8.self)
        nightDefinition = night; morningDefinition = morning; contactDefinition = contact
        initialGrain = retreat.resourceCustody == "common" ? retreat.metrics["grain", default: 0] : 0
        grain = initialGrain; debts = retreat.debts; records = recordOrder
    }
    var choices: [Record] {
        switch orders.count {
        case 0: return nightDefinition.records("choices")
        case 1: return morningDefinition.records("choices")
        case 2: return contactDefinition.records("choices").filter { $0.text("location") == location }
        default: return []
        }
    }
    func canChoose(_ id: String) -> Bool {
        guard let choice = choices.first(where: { $0.text("id") == id }) else { return false }
        switch orders.count {
        case 0: return choice.int("grainCost") >= 0 && grain >= choice.int("grainCost")
        case 1: return true
        case 2: return (choice["requiresHeldRecords"] as? Bool == false || records == "carry-records")
            && (location != "household" || localContact == "holds-word")
        default: return false
        }
    }
    func preview(_ id: String) throws -> RefugeContinuationEngine { var next = self; try next.choose(id); return next }
    mutating func choose(_ id: String) throws {
        guard canChoose(id), let choice = choices.first(where: { $0.text("id") == id }) else {
            throw CampaignError.invalid("Unavailable continuation choice.")
        }
        switch orders.count {
        case 0:
            grain -= choice.int("grainCost"); shelter = choice.text("shelter")
            obligation = choice["personalObligation"] as? String; rested = choice["rested"] as? Bool ?? false
        case 1:
            let effects = choice.object("effects"), owed = obligation == "morning-repair"
            promise = owed ? effects.text("promiseIfOwed") : "none"
            localContact = owed ? (effects["contactIfOwed"] as? String ?? effects.text("contact")) : effects.text("contact")
            lead = effects.text("lead")
        case 2:
            let effects = choice.object("effects")
            message = effects.text("message"); evidence = effects.text("evidence")
            disclosure = effects.text("disclosure"); lead = effects.text("nextLead")
        default: throw CampaignError.invalid("Continuation already complete.")
        }
        orders.append(id)
    }
    /// Historical night obligation remains in the record; `promise` gives its
    /// later disposition. No phase invents a reunion, delivery or discharged debt.
    var summary: Record {
        ["orders": orders, "commonGrain": grain, "debts": debts.map { ["id": $0.id, "creditor": $0.creditor, "grain": $0.grain] as Record },
         "records": records, "shelter": shelter, "rested": rested, "personalObligation": obligation as Any? ?? NSNull(),
         "promise": promise, "localContact": localContact, "lead": lead as Any? ?? NSNull(), "message": message,
         "evidence": evidence, "disclosure": disclosure, "companionPresence": "unestablished", "completed": completed]
    }
    func chronicle(fingerprints: [String: String]) throws -> RefugeContinuationChronicle {
        guard Set(fingerprints.keys) == Set(["retreatRules", "retreatStory", "nightRules", "nightStory", "morning", "contact"]),
              fingerprints.values.allSatisfy(FanyangEntry.validDigest) else { throw CampaignError.invalid("Invalid continuation revisions.") }
        return RefugeContinuationChronicle(version: 1, entryID: entryID, fingerprints: fingerprints, orders: orders)
    }
    static func restore(initial: RefugeContinuationEngine, save: RefugeContinuationChronicle,
                        fingerprints: [String: String]) throws -> RefugeContinuationEngine {
        _ = try initial.chronicle(fingerprints: fingerprints)
        guard initial.orders.isEmpty, save.version == 1, save.entryID == initial.entryID,
              save.fingerprints == fingerprints, save.orders.count <= 3 else { throw CampaignError.invalid("Continuation save mismatch.") }
        var engine = initial
        for id in save.orders { try engine.choose(id) }
        return engine
    }
}
struct RefugeContinuationChronicle: Codable {
    let version: Int
    let entryID: String
    let fingerprints: [String: String]
    let orders: [String]
}
