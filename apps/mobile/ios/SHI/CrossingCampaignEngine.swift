import Foundation
import CryptoKit

/// Hash-bound shared content. This development ledger never migrates or writes
/// the released native Chronicle's choices-only save.
struct CrossingCampaignContent {
    let campaign: Record
    let engagement: Record
    let rules: Record
    let aftermath: Record
    let fingerprint: String

    init(campaignData: Data, engagementData: Data, rulesData: Data, aftermathData: Data) throws {
        func object(_ data: Data) throws -> Record {
            guard let value = try JSONSerialization.jsonObject(with: data) as? Record else {
                throw CampaignError.invalid("Crossing content must be an object.")
            }
            return value
        }
        func hash(_ data: Data) -> String { SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined() }
        campaign = try object(campaignData); engagement = try object(engagementData)
        rules = try object(rulesData); aftermath = try object(aftermathData)
        fingerprint = hash(rulesData)
        guard rules.int("schemaVersion") == 2, rules.text("effectPolicy") == "outcome-aware-crossing",
              rules.text("deliveryStatus") == "development-only",
              rules.text("campaignSha256") == hash(campaignData), rules.text("engagementSha256") == hash(engagementData),
              rules.text("aftermathSha256") == hash(aftermathData),
              rules.text("campaignId") == campaign.text("id"), engagement.text("campaignId") == campaign.text("id"),
              rules.text("engagementId") == engagement.text("id"), rules.text("nodeId") == engagement.text("nodeId"),
              aftermath.int("schemaVersion") == 2, aftermath.text("id") == rules.text("aftermathId"),
              aftermath.text("deliveryStatus") == "development-only", aftermath.text("claimStatus") == "dramatic-reconstruction",
              aftermath.object("review").text("status") == "reviewed-development-copy",
              engagement.records("outcomes").allSatisfy({ !aftermath.object("outcomes").object($0.text("id")).isEmpty }),
              campaign.records("commitments").allSatisfy({ !aftermath.object("commitments").object($0.text("id")).isEmpty }),
              let node = campaign.records("nodes").first(where: { $0.text("id") == rules.text("nodeId") }) else {
            throw CampaignError.invalid("Crossing content hashes or authored bindings do not match.")
        }
        for (source, target) in [(engagement.records("plans"), node.records("choices")),
                                 (engagement.records("conditions"), node.records("conditions"))] {
            let ids = source.map { $0.text("id") }
            guard ids.count == target.count, Set(ids).count == ids.count, Set(ids) == Set(target.map { $0.text("id") }) else {
                throw CampaignError.invalid("Crossing plans or fields differ from the campaign.")
            }
        }
    }
}

struct CrossingCampaignEngine {
    let content: CrossingCampaignContent
    private(set) var engine: CampaignEngine
    private(set) var engagement: EngagementEngine?
    private(set) var crossings: [EngagementEngine] = []
    private(set) var events: [Record] = []
    private(set) var lastResponse: Record?
    private(set) var crossingResponses: [Record] = []

    init(content: CrossingCampaignContent, seed: UInt32) throws {
        self.content = content
        engine = try CampaignEngine(campaign: content.campaign, seed: seed)
    }

    var save: Record {
        ["saveVersion": 1, "rulesId": content.rules.text("id"), "campaignId": content.campaign.text("id"),
         "seed": engine.seed, "campaignSha256": content.rules.text("campaignSha256"),
         "engagementSha256": content.rules.text("engagementSha256"), "events": events]
    }

    static func replay(content: CrossingCampaignContent, saved: Record) throws -> CrossingCampaignEngine {
        guard saved.count == 7, EngagementEngine.sameJSON(saved["saveVersion"] ?? NSNull(), 1),
              saved.text("rulesId") == content.rules.text("id"), saved.text("campaignId") == content.campaign.text("id"),
              saved.text("campaignSha256") == content.rules.text("campaignSha256"),
              saved.text("engagementSha256") == content.rules.text("engagementSha256"),
              let seed = saved["seed"] as? NSNumber, seed.uint64Value <= UInt32.max,
              EngagementEngine.sameJSON(saved["seed"] ?? NSNull(), seed.uint64Value), let events = saved["events"] as? [Record] else {
            throw CampaignError.invalid("Invalid crossing campaign ledger; original save preserved.")
        }
        // NSNumber bridges both JSON numbers and our in-memory UInt32. The
        // JSON equality above still rejects booleans and fractional numbers.
        var result = try Self(content: content, seed: UInt32(seed.uint64Value))
        for event in events { try result.apply(event) }
        return result
    }

    /// Pure candidate transaction. The caller must atomically persist `save`
    /// before publishing the returned state or its character reaction.
    func advancing(_ event: Record) throws -> CrossingCampaignEngine {
        var candidate = self
        try candidate.apply(event)
        return candidate
    }

    func reconsideringFailedCrossing() throws -> CrossingCampaignEngine {
        guard engine.completed, engine.failure != nil, crossings.count == 1,
              let index = events.lastIndex(where: { $0.text("kind") == "begin-crossing" }) else {
            throw CampaignError.invalid("Only a terminal loss after the crossing can be reconsidered.")
        }
        var checkpoint = save; checkpoint["events"] = Array(events.prefix(index))
        let next = try Self.replay(content: content, saved: checkpoint)
        guard next.engagement == nil, !next.engine.completed, next.engine.nodeID == content.rules.text("nodeId") else {
            throw CampaignError.invalid("Crossing replay checkpoint is unavailable.")
        }
        return next
    }

    static func commitmentStatus(_ id: String, plan: String, outcome: String) throws -> String {
        guard ["families-first", "repair-the-ford", "cut-the-carts"].contains(plan),
              ["orderly-crossing", "costly-crossing", "fighting-withdrawal", "rear-broken"].contains(outcome) else {
            throw CampaignError.invalid("Unknown crossing plan or outcome.")
        }
        switch id {
        case "names-under-protection":
            if plan == "cut-the-carts" || outcome == "rear-broken" { return "broken" }
            return plan == "families-first" && outcome == "orderly-crossing" ? "kept" : "strained"
        case "movement-before-answer", "register-stays-dark":
            if plan == "repair-the-ford" || outcome == "rear-broken" { return "broken" }
            return plan == "cut-the-carts" && outcome == "orderly-crossing" ? "kept" : "strained"
        default: throw CampaignError.invalid("Unknown crossing promise.")
        }
    }

    private mutating func apply(_ event: Record) throws {
        let kind = event.text("kind")
        let field = ["decision": "choiceId", "begin-crossing": "planId", "crossing-command": "commandId"][kind]
        guard !engine.completed,
              field.map({ event.count == 2 && !event.text($0).isEmpty })
                ?? (event.count == 1 && ["cancel-crossing", "finish-crossing"].contains(kind)) else {
            throw CampaignError.invalid("Invalid crossing campaign event.")
        }
        switch kind {
        case "decision":
            guard engagement == nil, engine.nodeID != content.rules.text("nodeId") else {
                throw CampaignError.invalid("Use field orders at the crossing.")
            }
            lastResponse = try resolve(event.text("choiceId"), definition: content.campaign)
        case "begin-crossing":
            guard engagement == nil, crossings.isEmpty, engine.nodeID == content.rules.text("nodeId"),
                  let choice = engine.choices.first(where: { $0.text("id") == event.text("planId") }), engine.canChoose(choice) else {
                throw CampaignError.invalid("This crossing plan is unavailable.")
            }
            engagement = try EngagementEngine(definition: content.engagement, planID: choice.text("id"), conditionID: engine.condition.text("id"))
        case "crossing-command":
            guard var next = engagement else { throw CampaignError.invalid("No active crossing.") }
            try next.command(event.text("commandId")); engagement = next
        case "cancel-crossing":
            guard let current = engagement, current.history.isEmpty else { throw CampaignError.invalid("An issued field order cannot be cancelled.") }
            engagement = nil
        case "finish-crossing":
            guard let current = engagement, current.completed, let outcome = current.outcomeID,
                  let effects = current.campaignEffects, engine.nodeID == content.rules.text("nodeId") else {
                throw CampaignError.invalid("Complete the field orders before leaving the crossing.")
            }
            var definition = content.campaign
            definition["commitments"] = try content.campaign.records("commitments").map { commitment -> Record in
                let id = commitment.text("id"), status = try Self.commitmentStatus(id, plan: current.planID, outcome: outcome)
                let profile = content.aftermath.object("commitments").object(id).object(status)
                guard !profile.isEmpty else { throw CampaignError.invalid("Missing crossing promise reaction.") }
                var patched = commitment
                patched["outcomes"] = commitment.records("outcomes").map { original -> Record in
                    guard original.text("choiceId") == current.planID else { return original }
                    var result = original
                    result["id"] = "crossing-v2-\(id)-\(current.planID)-\(outcome)"; result["status"] = status
                    result["forecast"] = profile.object("response"); result["response"] = profile.object("response")
                    result["effects"] = profile.object("effects")
                    return result
                }
                return patched
            }
            let reaction = content.aftermath.object("outcomes").object(outcome)
            definition["nodes"] = content.campaign.records("nodes").map { node -> Record in
                guard node.text("id") == engine.nodeID else { return node }
                var patched = node
                patched["choices"] = node.records("choices").map { choice -> Record in
                    guard choice.text("id") == current.planID else { return choice }
                    var result = choice
                    result["effects"] = effects; result["consequence"] = reaction.object("reaction")
                    if choice["pressure"] != nil {
                        var pressure = choice.object("pressure"); pressure["reveal"] = reaction.object("pressure"); result["pressure"] = pressure
                    }
                    result["flags"] = choice.strings("flags").filter { flag in
                        if flag == "families-first" { return outcome == "orderly-crossing" || current.history.contains { $0.text("commandId") == "hold-for-the-last-household" } }
                        if flag == "ford-braced" { return outcome == "orderly-crossing" }
                        return flag != "carts-abandoned"
                    } + ["crossing-\(outcome)"]
                    return result
                }
                return patched
            }
            var response = try resolve(current.planID, definition: definition)
            if let failure = engine.failure {
                var choice = response.object("choice"); choice["consequence"] = content.aftermath.object("terminal").object(failure)
                response["choice"] = choice
                var node = response.object("node")
                node["choices"] = node.records("choices").map { $0.text("id") == current.planID ? choice : $0 }; response["node"] = node
            }
            lastResponse = response; crossingResponses.append(response); crossings.append(current); engagement = nil
        default: throw CampaignError.invalid("Unknown crossing event.")
        }
        events.append(event)
        let identity = try JSONSerialization.data(withJSONObject: ["rules": content.fingerprint, "ledger": save], options: [.sortedKeys])
        let digest = SHA256.hash(data: identity).map { String(format: "%02x", $0) }.joined()
        engine = engine.bindingContinuationIdentity("crossing-v2-" + digest)
    }

    private mutating func resolve(_ id: String, definition: Record) throws -> Record {
        var next = try engine.replacingDefinition(definition)
        let node = next.node, field = next.condition
        let choice = next.choices.first { $0.text("id") == id } ?? [:]
        let outcome = next.commitment?.records("outcomes").first { $0.text("choiceId") == id } ?? [:]
        let turn = try next.choose(id)
        engine = try next.replacingDefinition(content.campaign)
        return ["node": node, "choice": choice, "field": field, "outcome": outcome, "turn": turn]
    }
}
