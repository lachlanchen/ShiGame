import XCTest
@testable import SHI

@MainActor final class ReleasedChronicleUpgradeTests: XCTestCase {
    private let releasedHash = "445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c"
    private func directory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("shi-upgrade-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
    private func policy() throws -> Data {
        try Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: "chapter-01-save-compatibility.v1", withExtension: "json")))
    }
    private func bytes(_ choices: [String], seed: UInt32 = 0, pending: Bool? = nil, hash: String? = nil) throws -> Data {
        try JSONEncoder().encode(Chronicle(version: 1, campaignSHA256: hash ?? releasedHash, seed: seed, choices: choices, pendingAftermath: pending))
    }

    func testEveryReleasedCheckpointRestoresWithoutWritingOrInventingAnUnreadScene() throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("chronicle.json")
        let fixtureURL = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "chapter-01-replays.v1", withExtension: "json"))
        let fixtures = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: fixtureURL)) as? Record)
        XCTAssertEqual(fixtures.int("routeCount"), 46)
        var checkpoints = 0
        for route in fixtures.records("routes") {
            var choices: [String] = []
            for expected in route.records("turns") {
                choices.append(expected.text("choiceId"))
                let saved = try bytes(choices, seed: UInt32(fixtures.int("seed")))
                try saved.write(to: url, options: .atomic)
                let restored = GameSession(saveURL: url)
                XCTAssertFalse(restored.needsRecovery, route.text("id"))
                XCTAssertNil(restored.error)
                XCTAssertNil(restored.aftermath)
                let engine = try XCTUnwrap(restored.engine)
                XCTAssertEqual(engine.nodeID, expected.text("nextNodeId"))
                XCTAssertEqual(engine.resources, expected["after"] as? Resources)
                XCTAssertEqual(engine.history.count, choices.count)
                XCTAssertEqual(engine.completed, expected["completed"] as? Bool)
                XCTAssertEqual(engine.failure, expected["failureReason"] as? String)
                XCTAssertNil(engine.continuationIdentity, "A legacy save must not acquire invented tactical orders")
                let actual = try XCTUnwrap(engine.history.last)
                for (key, value) in expected {
                    XCTAssertEqual(
                        try JSONSerialization.data(withJSONObject: ["value": actual[key] ?? NSNull()], options: .sortedKeys),
                        try JSONSerialization.data(withJSONObject: ["value": value], options: .sortedKeys), key)
                }
                XCTAssertEqual(try Data(contentsOf: url), saved, "Loading must not migrate or acknowledge on disk")
                checkpoints += 1
            }
            let engine = try XCTUnwrap(GameSession(saveURL: url).engine)
            XCTAssertEqual(engine.ending, route.object("final").text("ending"))
            XCTAssertEqual(engine.flags, Set(route.object("final").strings("flags")))
        }
        XCTAssertEqual(checkpoints, 183)
    }

    func testCompatibleUnreadSceneSurvivesRelaunchAndOnlyAcknowledgementUpdatesFingerprint() throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("chronicle.json")
        let saved = try bytes(["read-the-names"], pending: true)
        try saved.write(to: url)
        let session = GameSession(saveURL: url)
        let pending = try XCTUnwrap(session.aftermath)
        let resources = try XCTUnwrap(session.engine).resources
        XCTAssertEqual(pending.response.object("choice").text("id"), "read-the-names")
        XCTAssertNotNil(GameSession(saveURL: url).aftermath)
        XCTAssertFalse(session.choose("issue-grain-tallies"))
        XCTAssertEqual(try Data(contentsOf: url), saved)
        session.continueAftermath("stale-callback")
        XCTAssertEqual(try Data(contentsOf: url), saved)
        session.continueAftermath(pending.id)
        let updated = try JSONDecoder().decode(Chronicle.self, from: Data(contentsOf: url))
        XCTAssertEqual(updated.campaignSHA256, session.fingerprint)
        XCTAssertEqual(updated.choices, ["read-the-names"])
        XCTAssertEqual(updated.seed, 0)
        XCTAssertEqual(updated.pendingAftermath, false)
        let reopened = GameSession(saveURL: url)
        XCTAssertFalse(reopened.needsRecovery)
        XCTAssertNil(reopened.aftermath)
        XCTAssertEqual(reopened.engine?.resources, resources)
    }

    func testLegacyAcknowledgedSaveContinuesNormallyAndLeavesReleasedBytesAloneUntilAnOrder() throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("chronicle.json")
        let saved = try bytes(["read-the-names"])
        try saved.write(to: url)
        let session = GameSession(saveURL: url)
        XCTAssertEqual(try Data(contentsOf: url), saved)
        XCTAssertTrue(session.choose("issue-grain-tallies"))
        let updated = try JSONDecoder().decode(Chronicle.self, from: Data(contentsOf: url))
        XCTAssertEqual(updated.campaignSHA256, session.fingerprint)
        XCTAssertEqual(updated.choices, ["read-the-names", "issue-grain-tallies"])
        XCTAssertEqual(updated.pendingAftermath, true)
        let reopened = GameSession(saveURL: url)
        XCTAssertEqual(reopened.engine?.resources, session.engine?.resources)
        XCTAssertEqual(reopened.aftermath?.response.object("choice").text("id"), "issue-grain-tallies")
    }

    func testUnknownCorruptAndOversizedSavesRemainUntouched() throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("chronicle.json")
        for saved in [
            try bytes(["read-the-names"], hash: String(repeating: "0", count: 64)),
            try bytes(["invented-order"]),
            try bytes([], pending: true),
            Data("not a chronicle".utf8),
            Data(repeating: 32, count: 2_000_001),
        ] {
            try saved.write(to: url, options: .atomic)
            let session = GameSession(saveURL: url)
            XCTAssertTrue(session.needsRecovery)
            XCTAssertNil(session.engine)
            XCTAssertEqual(try Data(contentsOf: url), saved)
        }
    }

    func testPolicyIsBoundToExactCurrentContentAndFailsClosed() throws {
        let data = try policy()
        let manifest = try JSONDecoder().decode(CampaignSaveCompatibility.self, from: data)
        let current = manifest.currentCampaignSHA256
        XCTAssertTrue(CampaignSaveCompatibility.accepts(saved: releasedHash, current: current, policy: data))
        XCTAssertTrue(CampaignSaveCompatibility.accepts(saved: current, current: current, policy: nil))
        XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: releasedHash, current: current, policy: nil))
        XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: releasedHash, current: String(repeating: "0", count: 64), policy: data))
        XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: releasedHash.uppercased(), current: current, policy: data))
        XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: String(repeating: "0", count: 64), current: current, policy: data))
        XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: "", current: "", policy: data))
        for key in ["schemaVersion", "campaignId", "reviewStatus", "currentCampaignSHA256", "previousCampaigns"] {
            var invalid = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? Record)
            invalid.removeValue(forKey: key)
            XCTAssertFalse(CampaignSaveCompatibility.accepts(saved: releasedHash, current: current,
                policy: try JSONSerialization.data(withJSONObject: invalid)))
        }
    }
}
