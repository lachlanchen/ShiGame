import Foundation

/// Separate continuation: never extend or reinterpret the frozen three-order
/// refuge chronicle. Story/rules are the same reviewed JSON used by Web.
struct RefugeFollowupEngine {
    let origin: RefugeContinuationEngine
    let definition: Record
    let entryID: String
    private(set) var order: String?
    private(set) var grain: Int
    var completed: Bool { order != nil }
    var choices: [Record] { completed ? [] : definition.records("choices") }
    var scene: Record { definition.object("scenes").object(origin.lead ?? "") }

    init(origin: RefugeContinuationEngine, fingerprints: [String: String], definition: Record) throws {
        _ = try origin.chronicle(fingerprints: fingerprints)
        guard origin.completed, definition.int("schemaVersion") == 1,
              definition.text("id") == "refuge-followup.v1",
              definition["publicationApproved"] as? Bool == false,
              !definition.object("scenes").object(origin.lead ?? "").isEmpty,
              definition.records("choices").map({ $0.text("id") }) == ["share-ration", "walk-to-ferry"] else {
            throw CampaignError.invalid("Incomplete inquiry or unsupported follow-up.")
        }
        self.origin = origin; self.definition = definition; grain = origin.grain
        entryID = String(decoding: try JSONSerialization.data(withJSONObject:
            ["native-refuge-followup.v1", origin.entryID, origin.orders, fingerprints], options: [.sortedKeys]), as: UTF8.self)
    }
    func canChoose(_ id: String) -> Bool {
        guard let choice = choices.first(where: { $0.text("id") == id }), let cost = choice["grainCost"] as? Int else { return false }
        return cost >= 0 && cost <= grain
    }
    func preview(_ id: String) throws -> RefugeFollowupEngine { var next = self; try next.choose(id); return next }
    mutating func choose(_ id: String) throws {
        guard canChoose(id), let choice = choices.first(where: { $0.text("id") == id }) else {
            throw CampaignError.invalid("Unavailable follow-up action.")
        }
        grain -= choice.int("grainCost"); order = id
    }
    func presentation(_ id: String) -> Record {
        var choice = definition.records("choices").first { $0.text("id") == id } ?? [:]
        if id == "walk-to-ferry", !scene.object("escort").isEmpty {
            choice.merge(scene.object("escort")) { _, new in new }
        }
        return choice
    }
    var summary: Record {
        guard let order else { return [:] }
        let effects = definition.records("choices").first { $0.text("id") == order }!.object("effects")
        return ["order": order, "commonGrain": grain,
                "debts": origin.debts.map { ["id": $0.id, "creditor": $0.creditor, "grain": $0.grain] as Record },
                "promise": origin.promise, "records": origin.records, "localContact": origin.localContact,
                "priorDisclosure": origin.disclosure, "companionPresence": "unestablished",
                "newcomer": effects.text("newcomer"), "search": effects.text("search"), "disclosure": effects.text("disclosure")]
    }
    func chronicle(hash: String) throws -> RefugeFollowupChronicle {
        guard FanyangEntry.validDigest(hash) else { throw CampaignError.invalid("Invalid follow-up revision.") }
        return RefugeFollowupChronicle(version: 1, entryID: entryID, definitionSHA256: hash, order: order)
    }
    static func restore(initial: RefugeFollowupEngine, save: RefugeFollowupChronicle, hash: String) throws -> RefugeFollowupEngine {
        _ = try initial.chronicle(hash: hash)
        guard !initial.completed, save.version == 1, save.entryID == initial.entryID, save.definitionSHA256 == hash else {
            throw CampaignError.invalid("Follow-up save mismatch.")
        }
        var next = initial
        if let order = save.order { try next.choose(order) }
        return next
    }
}
struct RefugeFollowupChronicle: Codable {
    let version: Int
    let entryID: String
    let definitionSHA256: String
    let order: String?
}
