import Foundation
import Combine
import CryptoKit

@main struct RetreatSessionChecks {
    @MainActor static func main() throws {
        guard CommandLine.arguments.count == 7 else { fatalError("Pass campaign, council, Fan Yang, rules, story and unused test directory") }
        func load(_ index: Int) throws -> (Data, Record, String) {
            let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[index]))
            return (data, try JSONSerialization.jsonObject(with: data) as! Record,
                SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined())
        }
        let (_, campaign, ch) = try load(1), (_, councilDefinition, co) = try load(2), (_, fanyangDefinition, fa) = try load(3)
        let (rulesData, _, _) = try load(4), (storyData, _, _) = try load(5)
        let root = URL(fileURLWithPath: CommandLine.arguments[6], isDirectory: true)
        precondition(!FileManager.default.fileExists(atPath: root.path), "Never overwrite previous evidence")
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var chapter = try CampaignEngine(campaign: campaign, seed: 0)
        for id in ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"] { try chapter.choose(id) }
        var council = try CouncilEngine(definition: councilDefinition, entry: CouncilEntry.from(chapter)!)
        for id in ["defer-title", "joint-ledger", "one-command"] { try council.choose(id) }
        var fanyang = try FanyangEngine(definition: fanyangDefinition, entry: FanyangEntry(council: council, fingerprint: co))
        for id in ["public-safety", "hold-talks", "withdraw-envoy"] { try fanyang.choose(id) }
        let entry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
            campaignFingerprint: ch, councilFingerprint: co, fanyangFingerprint: fa)
        let foreignEntry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
            campaignFingerprint: String(repeating: "0", count: 64), councilFingerprint: co, fanyangFingerprint: fa)
        let sourceMetrics = fanyang.metrics, sourceHistory = fanyang.history
        func session(_ name: String, rules: Data? = rulesData, story: Data? = storyData, source: RetreatEntry? = nil) -> RetreatSession {
            RetreatSession(entry: source ?? entry, rulesData: rules, storyData: story, saveURL: root.appendingPathComponent(name))
        }
        func unchanged(_ url: URL, _ bytes: Data) throws { let current = try Data(contentsOf: url); precondition(current == bytes) }
        var checks = 0
        func pass(_ name: String) { checks += 1; print("PASS \(name)") }

        let live = session("route.json")
        precondition(live.engine != nil && live.error == nil && !FileManager.default.fileExists(atPath: live.saveURL.path))
        precondition(!live.resumedEarlierProse)
        precondition(!live.choose("invented-order") && live.engine!.history.isEmpty)
        pass("opening and invalid order never write a save")
        precondition(live.choose("send-support"))
        let firstBytes = try Data(contentsOf: live.saveURL), firstID = live.response!.id
        let currentStory = try JSONSerialization.jsonObject(with: storyData) as! Record
        let compatibility = currentStory.object("saveCompatibility")
        for (index, fingerprint) in compatibility.strings("previousStorySHA256").enumerated() {
            let name = "prose-migration-\(index).json"
            let url = root.appendingPathComponent(name)
            var previous = try JSONSerialization.jsonObject(with: firstBytes) as! Record
            previous["storySHA256"] = fingerprint
            let oldBytes = try JSONSerialization.data(withJSONObject: previous)
            try oldBytes.write(to: url)
            let migrated = session(name)
            precondition(!migrated.needsRecovery && migrated.error == nil)
            precondition(migrated.resumedEarlierProse)
            precondition(migrated.engine!.history == live.engine!.history && migrated.response?.index == 0)
            try unchanged(url, oldBytes)
            migrated.continueResponse(migrated.response!.id)
            precondition(migrated.choose("borrow-local-grain"))
            precondition(!migrated.resumedEarlierProse)
            let updated = try JSONDecoder().decode(RetreatChronicle.self, from: Data(contentsOf: url))
            precondition(updated.storySHA256 == migrated.storyFingerprint && updated.choices == ["send-support", "borrow-local-grain"])
        }
        pass("reviewed prose resumes without writing; next confirmed order records current revision")
        precondition(!live.choose("borrow-local-grain"))
        live.continueResponse("stale-response")
        precondition(live.response?.id == firstID)
        let resumed = session("route.json")
        precondition(resumed.engine!.history == live.engine!.history && resumed.response?.index == 0)
        try unchanged(live.saveURL, firstBytes)
        resumed.continueResponse(resumed.response!.id)
        precondition(resumed.choose("borrow-local-grain") && resumed.engine!.debts.count == 1)
        let withDebt = session("route.json")
        precondition(withDebt.engine!.debts == resumed.engine!.debts && withDebt.response?.index == 1)
        for id in ["hold-formation", "strip-identities", "move-with-remnant"] {
            withDebt.continueResponse(withDebt.response!.id); precondition(withDebt.choose(id))
        }
        let complete = session("route.json")
        precondition(complete.engine?.outcome == "remnant" && complete.engine!.debts.count == 1 && complete.response?.index == 4)
        complete.continueResponse(complete.response!.id)
        precondition(!complete.choose("release-groups"))
        pass("five decisions, loan debt, unread reaction, resume and completed-order lock")

        var failing = false
        let failed = RetreatSession(entry: entry, rulesData: rulesData, storyData: storyData, saveURL: root.appendingPathComponent("failed.json")) { bytes, url in
            if failing { throw CocoaError(.fileWriteOutOfSpace) }
            try bytes.write(to: url, options: .atomic)
        }
        precondition(failed.choose("send-support")); failed.continueResponse(failed.response!.id)
        let beforeLoan = try Data(contentsOf: failed.saveURL), beforeMetrics = failed.engine!.metrics
        failing = true
        precondition(!failed.choose("borrow-local-grain") && failed.engine!.debts.isEmpty && failed.engine!.metrics == beforeMetrics && failed.response == nil)
        try unchanged(failed.saveURL, beforeLoan)
        failing = false
        precondition(failed.choose("borrow-local-grain") && failed.engine!.history.count == 2 && failed.engine!.debts.count == 1)
        pass("failed loan save publishes no debt or resources; retry commits exactly once")
        let beforeRestart = try Data(contentsOf: failed.saveURL), savedResponse = failed.response!.id
        failing = true
        precondition(!failed.restart() && failed.engine!.history.count == 2 && failed.response!.id == savedResponse)
        try unchanged(failed.saveURL, beforeRestart)
        pass("failed restart preserves old bytes and unread reaction")

        let corruptURL = root.appendingPathComponent("corrupt.json"), corruptBytes = Data("{not-json".utf8)
        try corruptBytes.write(to: corruptURL)
        let corrupt = session("corrupt.json")
        precondition(corrupt.needsRecovery && !corrupt.choose("send-support"))
        try unchanged(corruptURL, corruptBytes)
        precondition(corrupt.restart() && !corrupt.needsRecovery && corrupt.engine!.history.isEmpty)
        let backups = try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("preserved-retreat-") }
        precondition(backups.count == 1); try unchanged(backups[0], corruptBytes)
        pass("corruption is preserved until explicit restart, with an intact backup")

        let routeBytes = try Data(contentsOf: live.saveURL)
        for candidate in [session("route.json", source: foreignEntry),
                          session("route.json", rules: rulesData + Data("\n".utf8)),
                          session("route.json", story: storyData + Data("\n".utf8))] {
            precondition(candidate.needsRecovery && !candidate.choose("send-support"))
            try unchanged(live.saveURL, routeBytes)
        }
        pass("foreign entry and independently changed rules/story revisions do not overwrite progress")
        for candidate in [session("missing-rules.json", rules: nil), session("missing-story.json", story: nil)] {
            precondition(candidate.engine == nil && !candidate.choose("send-support") && !candidate.restart())
            precondition(!FileManager.default.fileExists(atPath: candidate.saveURL.path))
        }
        var malformed = try JSONSerialization.jsonObject(with: storyData) as! Record
        malformed["scenes"] = []
        let mismatched = session("mismatch.json", story: try JSONSerialization.data(withJSONObject: malformed))
        precondition(mismatched.engine == nil && !mismatched.restart())
        pass("missing or mismatched story/rules cannot initialize or replace progress")

        let observer = session("observer.json")
        var observed = 0
        let subscription = observer.$engine.dropFirst().sink { candidate in
            observed += 1
            precondition(!observer.restart() && !observer.choose("send-support"))
            let saved = try! JSONDecoder().decode(RetreatChronicle.self, from: Data(contentsOf: observer.saveURL))
            precondition(saved.choices == candidate!.history.map(\.choiceId))
        }
        precondition(observer.choose("send-support") && observer.restart())
        precondition(observed == 2); subscription.cancel()
        pass("disk precedes publication and observers cannot reenter transactions")
        precondition(fanyang.metrics == sourceMetrics && fanyang.history == sourceHistory && entry.metrics == live.entry.metrics)
        pass("prior episode state is unchanged")
        print("Native retreat session checks passed: \(checks). Test saves retained at \(root.path)")
    }
}
