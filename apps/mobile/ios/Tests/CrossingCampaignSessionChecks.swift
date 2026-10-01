import Foundation
import Combine

@main enum CrossingCampaignSessionChecks {
    @MainActor static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments[1])
        let output = URL(fileURLWithPath: CommandLine.arguments[2])
        guard !FileManager.default.fileExists(atPath: output.path) else { throw CampaignError.invalid("Use a fresh test directory.") }
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        func data(_ path: String) throws -> Data { try Data(contentsOf: root.appendingPathComponent(path)) }
        let content = try CrossingCampaignContent(campaignData: data("content/campaigns/chapter-01-daze.json"),
            engagementData: data("content/engagements/chapter-01-broken-crossing.v1.json"),
            rulesData: data("content/engagements/chapter-01-crossing-campaign.rules.v2.json"),
            aftermathData: data("content/engagements/chapter-01-crossing-aftermath.v2.json"))
        let fixtures = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[3]))) as! Record
        func session(_ name: String, seed: UInt32 = 0) -> CrossingCampaignSession {
            CrossingCampaignSession(content: content, seed: seed, saveURL: output.appendingPathComponent(name))
        }
        func equal(_ a: Any, _ b: Any) { precondition(EngagementEngine.sameJSON(a, b)) }
        func bytes(_ name: String) throws -> Data { try Data(contentsOf: output.appendingPathComponent(name)) }
        func unchanged(_ name: String, _ expected: Data) throws { let actual = try bytes(name); precondition(actual == expected) }
        var checks = 0
        func pass(_ name: String) { checks += 1; print("PASS \(name)") }
        let legacyURL = output.appendingPathComponent("chronicle-v1.json"), legacy = Data("preserved released save".utf8)
        try legacy.write(to: legacyURL)

        var failWrite = false, reentered = false, observedOldCount = -1
        weak var observed: CrossingCampaignSession?
        let live = CrossingCampaignSession(content: content, seed: 0, saveURL: output.appendingPathComponent("live.json"), writer: { data, url in
            if let current = observed {
                observedOldCount = current.state!.events.count
                reentered = current.advance(["kind": "decision", "choiceId": "take-the-beacon"], phase: current.phaseID)
            }
            if failWrite { throw CocoaError(.fileWriteOutOfSpace) }
            try data.write(to: url, options: .atomic)
        })
        observed = live
        precondition(live.error == nil && live.reaction == nil && !FileManager.default.fileExists(atPath: live.saveURL.path))
        precondition(!live.advance(["kind": "decision", "choiceId": "missing"], phase: live.phaseID))
        precondition(!FileManager.default.fileExists(atPath: live.saveURL.path))
        let oldPhase = live.phaseID
        precondition(live.advance(["kind": "decision", "choiceId": "read-the-names"], phase: oldPhase))
        precondition(observedOldCount == 0 && !reentered && live.state!.events.count == 1)
        let firstBytes = try bytes("live.json"), reactionID = live.reaction!.id
        precondition(!live.advance(["kind": "decision", "choiceId": "issue-grain-tallies"], phase: live.phaseID))
        precondition(!live.continueReaction("stale"))
        failWrite = true
        precondition(!live.continueReaction(reactionID) && live.reaction!.id == reactionID)
        try unchanged("live.json", firstBytes)
        failWrite = false
        precondition(live.continueReaction(reactionID))
        precondition(!live.advance(["kind": "decision", "choiceId": "issue-grain-tallies"], phase: oldPhase))
        let acknowledgedBytes = try bytes("live.json")
        let resumed = session("live.json", seed: 999)
        precondition(resumed.state!.engine.seed == 0 && resumed.reaction == nil && !resumed.needsRecovery)
        failWrite = true
        let phaseBeforeFailure = live.phaseID
        precondition(!live.advance(["kind": "decision", "choiceId": "issue-grain-tallies"], phase: live.phaseID))
        precondition(live.state!.events.count == 1 && live.phaseID == phaseBeforeFailure)
        try unchanged("live.json", acknowledgedBytes)
        failWrite = false
        pass("durable-first publication, reentrancy, write/ack failure and stale-phase guards")

        // All represented outcome/failure categories are played through this
        // session; terminate/recreate after every issued event and its ack.
        var selected: [String: Record] = [:]
        for item in fixtures.records("cases") where item.object("expected")["completed"] as? Bool == true {
            let expected = item.object("expected")
            guard let crossing = expected.records("crossings").first else { continue }
            let key = crossing.text("outcomeId") + ":" + expected.text("failure")
            if selected[key] == nil { selected[key] = item }
        }
        precondition(selected.count >= 4)
        var resumedEvents = 0
        for (index, item) in selected.sorted(by: { $0.key < $1.key }).enumerated() {
            let saved = item.value.object("save"), name = "route-\(index).json"
            var current = session(name, seed: UInt32(saved.int("seed")))
            for event in saved.records("events") {
                precondition(current.advance(event, phase: current.phaseID))
                let persisted = try bytes(name), previous = current.state!.save
                let pendingKind = current.reaction?.kind
                current = session(name, seed: 999)
                equal(current.state!.save, previous)
                precondition(current.reaction?.kind == pendingKind && !current.needsRecovery)
                try unchanged(name, persisted)
                if let reaction = current.reaction {
                    precondition(current.councilEntry == nil)
                    precondition(current.continueReaction(reaction.id))
                    current = session(name)
                    precondition(current.reaction == nil)
                    equal(current.state!.save, previous)
                }
                resumedEvents += 1
            }
            let expected = try CrossingCampaignEngine.replay(content: content, saved: saved)
            equal(current.state!.save, expected.save)
            precondition(current.state!.engine.resources == expected.engine.resources)
            precondition(current.councilEntry == CouncilEntry.from(expected.engine))
            if expected.engine.failure != nil {
                let original = try bytes(name), before = current.state!.save
                precondition(!current.reconsiderFailure(confirmed: false, phase: current.phaseID))
                try unchanged(name, original)
                let failing = CrossingCampaignSession(content: content, seed: 999, saveURL: current.saveURL, writer: { _, _ in throw CocoaError(.fileWriteOutOfSpace) })
                precondition(!failing.reconsiderFailure(confirmed: true, phase: failing.phaseID))
                equal(failing.state!.save, before); try unchanged(name, original)
                precondition(current.reconsiderFailure(confirmed: true, phase: current.phaseID))
                equal(current.state!.save, try expected.reconsideringFailedCrossing().save)
                let restored = session(name)
                precondition(restored.state!.engine.nodeID == "broken-crossing" && restored.state!.engagement == nil)
                precondition(restored.reaction == nil && restored.state!.engine.seed == expected.engine.seed)
            }
        }
        pass("\(selected.count) outcome/failure routes, \(resumedEvents) event cold-resumes, acknowledgement and confirmed loss replay")

        let planning = session("planning.json")
        for id in ["read-the-names", "issue-grain-tallies"] {
            precondition(planning.advance(["kind": "decision", "choiceId": id], phase: planning.phaseID))
            precondition(planning.continueReaction(planning.reaction!.id))
        }
        let beforePlan = planning.state!.engine.resources
        precondition(planning.advance(["kind": "begin-crossing", "planId": "families-first"], phase: planning.phaseID))
        precondition(planning.reaction == nil && planning.state!.engine.resources == beforePlan)
        let planningReload = session("planning.json")
        precondition(planningReload.state!.engagement != nil && planningReload.reaction == nil)
        precondition(planningReload.advance(["kind": "cancel-crossing"], phase: planningReload.phaseID))
        precondition(planningReload.state!.engagement == nil && planningReload.state!.engine.resources == beforePlan)
        precondition(planningReload.advance(["kind": "begin-crossing", "planId": "families-first"], phase: planningReload.phaseID))
        let command = planningReload.state!.engagement!.availableCommands[0].text("id")
        precondition(planningReload.advance(["kind": "crossing-command", "commandId": command], phase: planningReload.phaseID))
        precondition(planningReload.continueReaction(planningReload.reaction!.id))
        let ordered = try bytes("planning.json")
        precondition(!planningReload.advance(["kind": "cancel-crossing"], phase: planningReload.phaseID))
        try unchanged("planning.json", ordered)
        pass("planning/cancellation save without costs; an issued field order cannot be undone")

        var completedByLegacyIdentity: [String: CrossingCampaignEngine] = [:], isolated = false
        for item in fixtures.records("cases") where item.object("expected")["completed"] as? Bool == true {
            let state = try CrossingCampaignEngine.replay(content: content, saved: item.object("save"))
            guard state.engine.failure == nil else { continue }
            let oldIdentity: [Any] = [state.engine.seed, state.engine.history.map { [$0.text("nodeId"), $0.text("choiceId"), $0.text("conditionId")] }, state.engine.resources]
            let key = String(data: try JSONSerialization.data(withJSONObject: oldIdentity, options: .sortedKeys), encoding: .utf8)!
            if let earlier = completedByLegacyIdentity[key], !EngagementEngine.sameJSON(earlier.save, state.save) {
                precondition(CouncilEntry.from(earlier.engine) != CouncilEntry.from(state.engine))
                let restored = try CrossingCampaignEngine.replay(content: content, saved: state.save)
                precondition(CouncilEntry.from(restored.engine) == CouncilEntry.from(state.engine))
                isolated = true; break
            }
            completedByLegacyIdentity[key] = state
        }
        precondition(isolated)
        var oldChapter = try CampaignEngine(campaign: content.campaign, seed: 0)
        for id in ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"] { try oldChapter.choose(id) }
        precondition(oldChapter.continuationIdentity == nil)
        pass("identical abstract route/resources but different field orders isolate council saves; legacy identity unchanged")

        var envelope = try JSONSerialization.jsonObject(with: firstBytes) as! Record
        let valid = envelope
        let mutations: [(String, Any)] = [("version", true), ("rulesSHA256", "wrong"), ("pendingEventIndex", true),
            ("pendingEventIndex", -1), ("pendingEventIndex", 0.5), ("pendingEventIndex", 99), ("extra", 1), ("ledger", [:])]
        for (index, mutation) in mutations.enumerated() {
            envelope = valid; envelope[mutation.0] = mutation.1
            let name = "bad-\(index).json", malformed = try JSONSerialization.data(withJSONObject: envelope)
            try malformed.write(to: output.appendingPathComponent(name))
            let bad = session(name)
            precondition(bad.needsRecovery && bad.reaction == nil)
            precondition(!bad.advance(["kind": "decision", "choiceId": "read-the-names"], phase: bad.phaseID))
            precondition(!bad.restart(confirmed: false, seed: 0, phase: bad.phaseID))
            try unchanged(name, malformed)
        }
        let corruptName = "corrupt.json", corruptURL = output.appendingPathComponent(corruptName), corrupt = Data("{broken".utf8)
        try corrupt.write(to: corruptURL)
        let blockedBackup = CrossingCampaignSession(content: content, seed: 0, saveURL: corruptURL, backup: { _, _ in throw CocoaError(.fileWriteNoPermission) })
        precondition(blockedBackup.needsRecovery)
        precondition(!blockedBackup.restart(confirmed: true, seed: 0, phase: blockedBackup.phaseID))
        precondition(blockedBackup.needsRecovery); try unchanged(corruptName, corrupt)
        let recovery = session(corruptName)
        precondition(recovery.restart(confirmed: true, seed: 27, phase: recovery.phaseID))
        precondition(!recovery.needsRecovery && recovery.state!.engine.seed == 27)
        let backups = try FileManager.default.contentsOfDirectory(at: output, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("preserved-crossing-") }
        precondition(backups.count == 1)
        let backupBytes = try Data(contentsOf: backups[0]); precondition(backupBytes == corrupt)
        let legacyBytes = try Data(contentsOf: legacyURL); precondition(legacyBytes == legacy)
        pass("malformed/wrong-version saves preserved; backup failure blocks recovery; confirmed recovery keeps original bytes")
        print("PASS: \(checks) native crossing session groups; no released save or device state changed.")
    }
}
