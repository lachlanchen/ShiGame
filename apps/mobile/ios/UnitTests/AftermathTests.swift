import XCTest
import Combine
@testable import SHI

@MainActor final class AftermathTests: XCTestCase {
    private func temporaryDirectory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("shi-aftermath-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    func testOneOrderThenSaveInertContinueAndStaleCallbacks() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let session = GameSession(saveURL: url, initialSeed: 0)
        XCTAssertTrue(session.choose("read-the-names"))
        let first = try XCTUnwrap(session.aftermath)
        let bytes = try Data(contentsOf: url)
        let after = try XCTUnwrap(session.engine).resources
        XCTAssertEqual(session.engine?.history.count, 1)
        XCTAssertEqual(first.response.object("node").text("id"), "rain-order")
        XCTAssertFalse(session.choose("read-the-names"))
        XCTAssertFalse(session.choose("issue-grain-tallies"))
        XCTAssertEqual(try Data(contentsOf: url), bytes)
        session.continueAftermath(first.id)
        session.continueAftermath(first.id)
        XCTAssertNil(session.aftermath)
        XCTAssertEqual(session.engine?.resources, after)
        XCTAssertEqual(session.engine?.history.count, 1)
        let acknowledged = try JSONDecoder().decode(Chronicle.self, from: Data(contentsOf: url))
        XCTAssertEqual(acknowledged.pendingAftermath, false)
        XCTAssertEqual(acknowledged.choices, ["read-the-names"])
        XCTAssertNil(GameSession(saveURL: url).aftermath)
        XCTAssertTrue(session.choose("issue-grain-tallies"))
        let second = try XCTUnwrap(session.aftermath)
        session.continueAftermath(first.id)
        XCTAssertEqual(session.aftermath?.id, second.id)
        XCTAssertEqual(session.engine?.history.count, 2)
    }

    func testFailedSaveDoesNotPublishOutcomeOrAdvance() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let blocker = directory.appendingPathComponent("not-a-directory")
        try Data("occupied".utf8).write(to: blocker)
        let session = GameSession(saveURL: blocker.appendingPathComponent("chronicle.json"), initialSeed: 0)
        let before = try XCTUnwrap(session.engine).resources
        XCTAssertFalse(session.choose("read-the-names"))
        XCTAssertNotNil(session.error)
        XCTAssertNil(session.aftermath)
        XCTAssertNil(session.lastResponse)
        XCTAssertEqual(session.engine?.history.count, 0)
        XCTAssertEqual(session.engine?.nodeID, "rain-order")
        XCTAssertEqual(session.engine?.resources, before)
        XCTAssertEqual(try Data(contentsOf: blocker), Data("occupied".utf8))
    }

    func testPublishedStateObserverCannotReenterTheCommit() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let session = GameSession(saveURL: directory.appendingPathComponent("chronicle.json"), initialSeed: 0)
        var observerAdmission: Bool?
        let observation = session.$engine.dropFirst().sink { _ in
            observerAdmission = session.choose("read-the-names")
        }
        defer { observation.cancel() }
        XCTAssertTrue(session.choose("read-the-names"))
        XCTAssertEqual(observerAdmission, false)
        XCTAssertEqual(session.engine?.history.count, 1)
        XCTAssertNotNil(session.aftermath)
    }

    func testReloadDuringOutcomeResumesExactlyOneSavedTurn() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let original = GameSession(saveURL: url, initialSeed: 0)
        XCTAssertTrue(original.choose("hide-the-register"))
        XCTAssertNotNil(original.aftermath)
        let bytes = try Data(contentsOf: url)
        let restored = GameSession(saveURL: url)
        let resumed = try XCTUnwrap(restored.aftermath)
        XCTAssertEqual(resumed.response.object("choice").text("id"), "hide-the-register")
        XCTAssertFalse(restored.choose("release-oldest"))
        XCTAssertEqual(restored.engine?.history.count, 1)
        XCTAssertEqual(restored.engine?.nodeID, original.engine?.nodeID)
        XCTAssertEqual(restored.engine?.resources, original.engine?.resources)
        XCTAssertEqual(try Data(contentsOf: url), bytes)
    }

    func testLegacySaveDoesNotInventUnreadSceneOrRewriteItself() throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let session = GameSession(saveURL: url, initialSeed: 0)
        XCTAssertTrue(session.choose("hide-the-register"))
        var legacy = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        legacy.removeValue(forKey: "pendingAftermath")
        let bytes = try JSONSerialization.data(withJSONObject: legacy)
        try bytes.write(to: url)
        let restored = GameSession(saveURL: url)
        XCTAssertNil(restored.aftermath)
        XCTAssertEqual(restored.engine?.history.count, 1)
        XCTAssertEqual(try Data(contentsOf: url), bytes)
    }

    func testFailedAcknowledgementKeepsSceneAndDoesNotResolveAgain() throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let session = GameSession(saveURL: url, initialSeed: 0)
        XCTAssertTrue(session.choose("hide-the-register"))
        let pending = try XCTUnwrap(session.aftermath)
        let before = session.engine?.resources
        // Move only this generated fixture aside; a directory forces write failure.
        let preserved = directory.appendingPathComponent("preserved.json")
        try FileManager.default.moveItem(at: url, to: preserved)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
        session.continueAftermath(pending.id)
        XCTAssertEqual(session.aftermath?.id, pending.id)
        XCTAssertNotNil(session.error)
        XCTAssertEqual(session.engine?.resources, before)
        XCTAssertEqual(session.engine?.history.count, 1)
        XCTAssertNotNil(GameSession(saveURL: preserved).aftermath)
    }

    func testPendingSceneWithoutDecisionIsPreservedAsInvalid() throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let fresh = GameSession(saveURL: url, initialSeed: 0)
        let bytes = try JSONEncoder().encode(Chronicle(version: 1, campaignSHA256: fresh.fingerprint, seed: 0, choices: [], pendingAftermath: true))
        try bytes.write(to: url)
        let restored = GameSession(saveURL: url)
        XCTAssertTrue(restored.needsRecovery)
        XCTAssertNil(restored.engine)
        XCTAssertEqual(try Data(contentsOf: url), bytes)
    }

    func testInvalidOrderLeavesPresentationAndSaveAbsent() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("chronicle.json")
        let session = GameSession(saveURL: url, initialSeed: 0)
        XCTAssertFalse(session.choose("not-a-choice"))
        XCTAssertNil(session.aftermath)
        XCTAssertEqual(session.engine?.history.count, 0)
        XCTAssertFalse(FileManager.default.fileExists(atPath: url.path))
    }

    func testFinalOrderStillHasAnOutcomeBeforeEnding() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let session = GameSession(saveURL: directory.appendingPathComponent("chronicle.json"), initialSeed: 0)
        for id in ["hide-the-register", "release-oldest", "cut-the-carts", "race-for-chen"] {
            XCTAssertTrue(session.choose(id))
            let aftermath = try XCTUnwrap(session.aftermath)
            XCTAssertEqual(aftermath.response.object("choice").text("id"), id)
            if id == "race-for-chen" {
                let reopened = GameSession(saveURL: directory.appendingPathComponent("chronicle.json"))
                XCTAssertEqual(reopened.engine?.completed, true)
                XCTAssertEqual(reopened.aftermath?.response.object("choice").text("id"), id)
                XCTAssertEqual(reopened.engine?.history.count, 4)
            }
            session.continueAftermath(aftermath.id)
        }
        XCTAssertEqual(session.engine?.completed, true)
        XCTAssertEqual(session.engine?.history.count, 4)
        XCTAssertFalse(session.choose("race-for-chen"))
        XCTAssertNil(session.aftermath)
    }

    func testSharedPresentationLabelsCoverAllElevenLocales() async throws {
        let directory = try temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let session = GameSession(saveURL: directory.appendingPathComponent("chronicle.json"), initialSeed: 0)
        let locales = session.translations.object("localeNames").keys
        XCTAssertEqual(locales.count, 11)
        for locale in locales {
            for key in ["aftermath", "changes", "play", "pause", "skip", "unavailable", "finished"] {
                let text = session.translations.object("cinema").object(locale).text(key)
                XCTAssertFalse(text.isEmpty, "\(locale): \(key)")
            }
        }
        XCTAssertEqual(session.label("cinema", "aftermath", "zh-Hans"), "令出之后")
    }
}
