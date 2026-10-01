import Foundation

typealias Record = [String: Any]
typealias Resources = [String: Int]
let resourceKeys = ["grain", "trust", "momentum", "people", "danger"]

extension Dictionary where Key == String, Value == Any {
    func text(_ key: String) -> String { self[key] as? String ?? "" }
    func object(_ key: String) -> Record { self[key] as? Record ?? [:] }
    func records(_ key: String) -> [Record] { self[key] as? [Record] ?? [] }
    func strings(_ key: String) -> [String] { self[key] as? [String] ?? [] }
    func int(_ key: String) -> Int { self[key] as? Int ?? 0 }
    func localized(_ key: String, _ locale: String) -> String {
        let value = object(key)
        return value[locale] as? String ?? value["en"] as? String ?? value["zh-Hans"] as? String ?? ""
    }
}

enum CampaignError: Error, LocalizedError {
    case invalid(String)
    var errorDescription: String? { if case .invalid(let message) = self { return message }; return nil }
}

struct CampaignEngine {
    let campaign: Record
    let seed: UInt32
    private(set) var nodeID: String
    private(set) var resources: Resources
    private(set) var history: [Record] = []
    private(set) var flags: Set<String> = []
    private(set) var completed = false
    private(set) var failure: String?

    init(campaign: Record, seed: UInt32) throws {
        guard campaign.int("schemaVersion") == 7,
              let initial = campaign["initialResources"] as? Resources,
              resourceKeys.allSatisfy({ initial[$0] != nil }),
              campaign.records("nodes").contains(where: { $0.text("id") == campaign.text("startNodeId") }) else {
            throw CampaignError.invalid("Unsupported campaign. Your saved chronicle has not been replaced.")
        }
        self.campaign = campaign; self.seed = seed
        nodeID = campaign.text("startNodeId"); resources = initial
    }

    var node: Record { campaign.records("nodes").first { $0.text("id") == nodeID }! }
    var choices: [Record] { node.records("choices") }
    var stage: Record {
        campaign.object("opposition").records("stages").first {
            resources["danger", default: 0] >= $0.int("minDanger") && resources["danger", default: 0] <= $0.int("maxDanger")
        } ?? [:]
    }
    static func hash(_ text: String) -> UInt32 {
        text.utf16.reduce(UInt32(0x811c9dc5)) { ($0 ^ UInt32($1)) &* 0x01000193 }
    }
    var condition: Record {
        let conditions = node.records("conditions")
        let total = conditions.reduce(0) { $0 + $1.int("weight") }
        guard total > 0 else { return [:] }
        var roll = Int(Self.hash("\(campaign.text("id"))|\(seed)|\(nodeID)|\(history.count)")) % total
        for condition in conditions {
            if roll < condition.int("weight") { return condition }
            roll -= condition.int("weight")
        }
        return [:]
    }
    var methodRead: Record {
        let opposition = campaign.object("opposition"), model = opposition.object("methodRead")
        var counts = Dictionary(uniqueKeysWithValues: opposition.records("methods").map { ($0.text("id"), 0) })
        for turn in history { counts[turn.text("methodId"), default: 0] += 1 }
        let high = counts.values.max() ?? 0, leaders = counts.filter { $0.value == high }
        guard history.count >= model.int("minimumObservations"), leaders.count == 1,
              let target = leaders.first?.key else { return model.object("neutral") }
        return model.records("countermeasures").first { $0.text("targetMethodId") == target } ?? model.object("neutral")
    }
    var commitment: Record? {
        let chosen = Set(history.map { $0.text("choiceId") }), resolved = Set(history.map { $0.text("commitmentId") })
        return campaign.records("commitments").first { chosen.contains($0.text("establishedByChoiceId")) && !resolved.contains($0.text("id")) }
    }
    func canChoose(_ choice: Record) -> Bool {
        let requirements = choice.object("requirements")
        return !completed && resourceKeys.allSatisfy { key in
            let value = resources[key, default: 0]
            return value >= (requirements.object("min")[key] as? Int ?? Int.min)
                && value <= (requirements.object("max")[key] as? Int ?? Int.max)
        }
    }
    static func apply(_ resources: Resources, _ effects: Record) -> Resources {
        Dictionary(uniqueKeysWithValues: resourceKeys.map { key in
            (key, max(0, min(100, resources[key, default: 0] + effects.int(key))))
        })
    }
    static func delta(_ before: Resources, _ after: Resources) -> Resources {
        Dictionary(uniqueKeysWithValues: resourceKeys.compactMap { key in
            let difference = after[key, default: 0] - before[key, default: 0]
            return difference == 0 ? nil : (key, difference)
        })
    }
    @discardableResult mutating func choose(_ id: String) throws -> Record {
        guard let choice = choices.first(where: { $0.text("id") == id }), canChoose(choice) else {
            throw CampaignError.invalid("This order is not available in the current position.")
        }
        let field = condition, opposition = stage, read = methodRead, oath = commitment
        let outcome = oath?.records("outcomes").first { $0.text("choiceId") == id }
        let matched = !read.text("targetMethodId").isEmpty && read.text("targetMethodId") == choice.text("methodId")
        let before = resources
        let afterChoice = Self.apply(before, choice.object("effects"))
        let afterCommitment = Self.apply(afterChoice, outcome?.object("effects") ?? [:])
        let afterPressure = Self.apply(afterCommitment, choice.object("pressure").object("effects"))
        let afterOpposition = Self.apply(afterPressure, opposition.object("effects"))
        let afterMethodRead = Self.apply(afterOpposition, matched ? read.object("effects") : [:])
        let after = Self.apply(afterMethodRead, field.object("effects"))
        let failure = after["danger", default: 0] >= 100 ? "captured" : after["people", default: 0] <= 0 ? "scattered" : nil
        let next = choice.text("nextNodeId")
        let done = next.isEmpty || failure != nil
        let nextID = failure != nil || next.isEmpty ? nodeID : next
        if !done && !campaign.records("nodes").contains(where: { $0.text("id") == nextID }) {
            throw CampaignError.invalid("The next campaign scene is missing.")
        }
        var turn: Record = [
            "nodeId": nodeID, "choiceId": id, "conditionId": field.text("id"),
            "oppositionStageId": opposition.text("id"), "methodId": choice.text("methodId"),
            "methodReadId": read.text("id"), "methodReadMatched": matched,
            "commitmentId": outcome == nil ? NSNull() : oath!.text("id") as Any,
            "commitmentOutcomeId": outcome?["id"] ?? NSNull(),
            "before": before, "afterChoice": afterChoice, "afterCommitment": afterCommitment,
            "afterPressure": afterPressure, "afterOpposition": afterOpposition,
            "afterMethodRead": afterMethodRead, "after": after,
            "playerDeltas": Self.delta(before, afterChoice),
            "commitmentDeltas": Self.delta(afterChoice, afterCommitment),
            "pressureDeltas": Self.delta(afterCommitment, afterPressure),
            "oppositionDeltas": Self.delta(afterPressure, afterOpposition),
            "methodReadDeltas": Self.delta(afterOpposition, afterMethodRead),
            "fieldDeltas": Self.delta(afterMethodRead, after),
            "nextNodeId": nextID, "completed": done, "failureReason": failure as Any? ?? NSNull()
        ]
        history.append(turn); flags.formUnion(choice.strings("flags"))
        resources = after; nodeID = nextID; completed = done; self.failure = failure
        turn["activeCommitmentId"] = commitment?["id"] ?? NSNull()
        history[history.count - 1] = turn
        return turn
    }
    var ending: String {
        if failure != nil { return "watchful-strategist" }
        if flags.contains("ending-wildfire") { return "wildfire" }
        if flags.contains("ending-deep-roots") { return "deep-roots" }
        if flags.contains("ending-watchful") { return "watchful-strategist" }
        if resources["momentum", default: 0] >= 65 && resources["grain", default: 0] < 40 { return "wildfire" }
        if resources["people", default: 0] + resources["trust", default: 0] >= 125 { return "deep-roots" }
        return "watchful-strategist"
    }

    /// Keep the exact played state while applying a reviewed encounter's
    /// temporary choice/commitment definition. Never replay tactical history
    /// as the old abstract chapter choices.
    func replacingDefinition(_ definition: Record) throws -> CampaignEngine {
        guard definition.text("id") == campaign.text("id"),
              definition.records("nodes").contains(where: { $0.text("id") == nodeID }) else {
            throw CampaignError.invalid("Encounter definition does not match the campaign.")
        }
        var next = try CampaignEngine(campaign: definition, seed: seed)
        next.nodeID = nodeID; next.resources = resources; next.history = history
        next.flags = flags; next.completed = completed; next.failure = failure
        return next
    }
}
