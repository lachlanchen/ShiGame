import Foundation
import Combine
import CryptoKit

@main struct FanyangSessionChecks {
    @MainActor static func main() throws {
        guard CommandLine.arguments.count == 4 else { fatalError("Pass council JSON, scene JSON, unused test directory") }
        let councilData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let sceneData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))
        let definition = try JSONSerialization.jsonObject(with: councilData) as! Record
        let councilHash = SHA256.hash(data: councilData).map { String(format: "%02x", $0) }.joined()
        let root = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
        precondition(!FileManager.default.fileExists(atPath: root.path), "Never overwrite an earlier test run")
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var council = try CouncilEngine(definition: definition, entry: CouncilEntry(id: "native-session-origin", arrival: "divided"))
        for choice in ["defer-title", "joint-ledger", "one-command"] { try council.choose(choice) }
        let encoder = JSONEncoder(); encoder.outputFormatting = .sortedKeys
        let originalCouncil = try encoder.encode(council.chronicle(fingerprint: councilHash))
        func unchanged(_ url: URL, _ bytes: Data) throws {
            let current = try Data(contentsOf: url)
            precondition(current == bytes)
        }
        func session(_ name: String, data: Data? = sceneData) -> FanyangSession {
            FanyangSession(council: council, councilFingerprint: councilHash, definitionData: data, saveURL: root.appendingPathComponent(name))
        }
        var checks = 0
        func pass(_ name: String) { checks += 1; print("PASS \(name)") }

        let live = session("route.json")
        precondition(live.engine?.history.isEmpty == true && live.error == nil)
        precondition(!FileManager.default.fileExists(atPath: live.saveURL.path))
        pass("opening does not write a save")

        precondition(live.choose("public-safety"))
        let firstBytes = try Data(contentsOf: live.saveURL)
        precondition(!live.choose("guarded-escort"))
        let firstResponse = live.response!.id
        live.continueResponse("stale-response")
        precondition(live.response?.id == firstResponse)
        let restored = session("route.json")
        precondition(restored.engine?.history == live.engine?.history && restored.response?.index == 0)
        try unchanged(live.saveURL, firstBytes)
        restored.continueResponse(restored.response!.id)
        precondition(restored.choose("guarded-escort"))
        restored.continueResponse(restored.response!.id)
        precondition(restored.choose("accept-transfer"))
        precondition(restored.engine?.outcome == "opened")
        let completed = session("route.json")
        precondition(completed.engine?.outcome == "opened" && completed.response?.index == 2)
        precondition(!completed.choose("withdraw-envoy"))
        pass("full route, unread reaction, stale acknowledgment, duplicate and completed-order rejection")

        var failWrite = true
        let failedURL = root.appendingPathComponent("failure.json")
        let failed = FanyangSession(council: council, councilFingerprint: councilHash, definitionData: sceneData, saveURL: failedURL) { data, url in
            if failWrite { throw CocoaError(.fileWriteOutOfSpace) }
            try data.write(to: url, options: .atomic)
        }
        precondition(!failed.choose("public-safety") && failed.engine?.history.isEmpty == true && failed.response == nil)
        precondition(failed.error != nil && !FileManager.default.fileExists(atPath: failedURL.path))
        failWrite = false
        precondition(failed.choose("public-safety") && failed.engine?.history.count == 1)
        pass("failed atomic write publishes no order; retry writes one order")
        let beforeFailedRestart = try Data(contentsOf: failedURL)
        failWrite = true
        precondition(!failed.restart() && failed.engine?.history.count == 1 && failed.response != nil)
        try unchanged(failedURL, beforeFailedRestart)
        pass("failed restart preserves disk, decision and unread reaction")

        let corruptURL = root.appendingPathComponent("corrupt.json")
        let corruptBytes = Data("{not-json".utf8)
        try corruptBytes.write(to: corruptURL)
        let corrupt = session("corrupt.json")
        precondition(corrupt.needsRecovery && !corrupt.choose("public-safety"))
        try unchanged(corruptURL, corruptBytes)
        precondition(corrupt.restart() && !corrupt.needsRecovery && corrupt.engine?.history.isEmpty == true)
        let backups = try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("preserved-fanyang-") }
        precondition(backups.count == 1)
        try unchanged(backups[0], corruptBytes)
        pass("corrupt save preserved before explicitly requested recovery")

        var otherCouncil = try CouncilEngine(definition: definition, entry: CouncilEntry(id: "another-origin", arrival: "divided"))
        for choice in ["defer-title", "joint-ledger", "one-command"] { try otherCouncil.choose(choice) }
        let routeBytes = try Data(contentsOf: live.saveURL)
        let foreign = FanyangSession(council: otherCouncil, councilFingerprint: councilHash, definitionData: sceneData, saveURL: live.saveURL)
        precondition(foreign.needsRecovery && !foreign.choose("public-safety"))
        try unchanged(live.saveURL, routeBytes)
        let revised = session("route.json", data: sceneData + Data("\n".utf8))
        precondition(revised.needsRecovery && !revised.choose("public-safety"))
        try unchanged(live.saveURL, routeBytes)
        pass("foreign council and different content revision are preserved, not overwritten")

        let missing = session("missing.json", data: nil)
        precondition(missing.engine == nil && !missing.choose("public-safety") && !missing.restart())
        precondition(!FileManager.default.fileExists(atPath: missing.saveURL.path))
        pass("missing definition never creates or resets a save")

        let reentrant = session("reentry.json")
        var observed = 0
        let subscription = reentrant.$engine.dropFirst().sink { candidate in
            observed += 1
            precondition(!reentrant.restart() && !reentrant.choose("public-safety"))
            let saved = try! JSONDecoder().decode(FanyangChronicle.self, from: Data(contentsOf: reentrant.saveURL))
            precondition(saved.choices == candidate!.history.map(\.choiceId))
        }
        precondition(reentrant.choose("public-safety"))
        precondition(reentrant.restart())
        precondition(observed == 2 && reentrant.engine?.history.isEmpty == true && reentrant.response == nil)
        subscription.cancel()
        pass("publish follows disk write; observer-triggered choose/restart is blocked")

        let finalCouncil = try encoder.encode(council.chronicle(fingerprint: councilHash))
        precondition(finalCouncil == originalCouncil)
        pass("originating council remains unchanged")
        print("Fan Yang native session checks passed: \(checks); temporary test saves retained at \(root.path)")
    }
}
