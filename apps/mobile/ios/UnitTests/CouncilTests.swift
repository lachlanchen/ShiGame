import XCTest
import Combine
@testable import SHI

@MainActor final class CouncilTests: XCTestCase {
    func testReadinessPreservesAllBoundedOutcomes() {
        for grain in 0...10 { for tempo in 0...10 { for city in 0...10 {
            for allies in 0...10 { for veterans in 0...10 {
                let metrics = ["grain": grain, "tempo": tempo, "city": city, "allies": allies, "veterans": veterans]
                let count = [city, allies, veterans].filter { $0 >= 6 }.count
                let expected = grain == 0 ? "empty-granaries"
                    : count >= 2 && grain >= 2 && tempo >= 3 ? "common-front"
                    : city >= 6 && veterans >= 6 ? "city-stronghold" : "fragile-coalition"
                let readiness = CouncilEngine.assess(metrics)
                guard CouncilEngine.classify(metrics) == expected,
                      readiness.checks.allSatisfy(\.met) == (expected == "common-front"),
                      readiness.supporters.count == count else {
                    XCTFail("Readiness diverged for \(metrics)"); return
                }
            }}
        }}}
        let readiness = CouncilEngine.assess(["grain": 1, "tempo": 2, "city": 6, "allies": 5, "veterans": 6])
        XCTAssertEqual(readiness.supporters, ["city", "veterans"])
        XCTAssertEqual(readiness.checks, [CouncilRequirement(id: "support", value: 2, required: 2),
            CouncilRequirement(id: "grain", value: 1, required: 2), CouncilRequirement(id: "tempo", value: 2, required: 3)])
    }
    private func directory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("shi-council-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
    private func completedChapter(at url: URL, seed: UInt32 = 0) throws -> GameSession {
        let chapter = GameSession(saveURL: url, initialSeed: seed)
        while chapter.engine?.completed == false {
            let engine = try XCTUnwrap(chapter.engine)
            let choice = try XCTUnwrap(engine.choices.first { engine.canChoose($0) })
            XCTAssertTrue(chapter.choose(choice.text("id")))
            chapter.continueAftermath(try XCTUnwrap(chapter.aftermath).id)
        }
        XCTAssertNil(chapter.engine?.failure)
        return chapter
    }

    func testInspectCommitResumeAndExactChapterIsolation() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapterURL = folder.appendingPathComponent("chapter.json")
        let chapter = try completedChapter(at: chapterURL)
        let bytes = try Data(contentsOf: chapterURL), origin = try XCTUnwrap(chapter.engine)
        let councilURL = folder.appendingPathComponent("council.json")
        let session = CouncilSession(origin: origin, saveURL: councilURL)
        let initial = try XCTUnwrap(session.engine)
        _ = try initial.preview("defer-title")
        XCTAssertFalse(FileManager.default.fileExists(atPath: councilURL.path))
        XCTAssertEqual(session.engine?.history.count, 0)
        XCTAssertTrue(session.choose("defer-title"))
        XCTAssertFalse(session.choose("defer-title")); XCTAssertFalse(session.choose("joint-ledger"))
        let saved = try Data(contentsOf: councilURL)
        let restored = CouncilSession(origin: origin, saveURL: councilURL)
        XCTAssertEqual(restored.engine?.history, session.engine?.history)
        XCTAssertEqual(restored.engine?.metrics, session.engine?.metrics)
        XCTAssertNotNil(restored.response)
        restored.continueResponse(try XCTUnwrap(restored.response).id)
        XCTAssertNil(restored.response)
        XCTAssertEqual(try Data(contentsOf: councilURL), saved)
        XCTAssertEqual(try Data(contentsOf: chapterURL), bytes)
        XCTAssertTrue(restored.choose("joint-ledger"))
        XCTAssertEqual(restored.engine?.history.count, 2)
        XCTAssertEqual(try Data(contentsOf: chapterURL), bytes)
    }

    func testFinalResponseAndStaleCallbacksAcrossRestart() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = try completedChapter(at: folder.appendingPathComponent("chapter.json"))
        let session = CouncilSession(origin: try XCTUnwrap(chapter.engine), saveURL: folder.appendingPathComponent("council.json"))
        var oldID = ""
        for id in ["defer-title", "joint-ledger", "one-command"] {
            XCTAssertTrue(session.choose(id))
            let response = try XCTUnwrap(session.response)
            oldID = response.id
            XCTAssertEqual(session.engine?.choice(at: response.index).text("id"), id)
            if id != "one-command" { session.continueResponse(response.id) }
        }
        XCTAssertEqual(session.engine?.completed, true)
        XCTAssertNotNil(session.response)
        XCTAssertNotNil(session.engine?.outcome)
        session.continueResponse(oldID)
        XCTAssertFalse(session.choose("hold-chen"))
        XCTAssertTrue(session.restart())
        XCTAssertEqual(session.engine?.history.count, 0)
        XCTAssertNil(session.response)
        XCTAssertTrue(session.choose("defer-title"))
        let current = try XCTUnwrap(session.response)
        session.continueResponse(oldID)
        XCTAssertEqual(session.response?.id, current.id)
    }

    func testCompletedResumeRetainsReactionAndJournalWithoutChangingSave() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapterURL = folder.appendingPathComponent("chapter.json")
        let chapter = try completedChapter(at: chapterURL)
        let origin = try XCTUnwrap(chapter.engine)
        let chapterBytes = try Data(contentsOf: chapterURL)
        let url = folder.appendingPathComponent("council.json")
        let session = CouncilSession(origin: origin, saveURL: url)
        let route = ["defer-title", "army-rations", "hold-chen"]
        for id in route {
            XCTAssertTrue(session.choose(id))
            if id != route.last { session.continueResponse(try XCTUnwrap(session.response).id) }
        }
        let bytes = try Data(contentsOf: url)
        let restored = CouncilSession(origin: origin, saveURL: url)
        let engine = try XCTUnwrap(restored.engine)
        XCTAssertTrue(engine.completed)
        let response = try XCTUnwrap(restored.response)
        XCTAssertEqual(response.index, 2)
        XCTAssertEqual(engine.choice(at: response.index).text("id"), "hold-chen")
        for index in engine.history.indices {
            let expected = engine.choice(at: index).records("answers").filter { answer in
                route.prefix(index).contains(answer.text("afterChoice"))
            }
            XCTAssertEqual(engine.journalAnswers(at: index).map { $0.text("afterChoice") }, expected.map { $0.text("afterChoice") })
        }
        XCTAssertFalse(engine.journalAnswers(at: 1).isEmpty)
        XCTAssertTrue(engine.journalAnswers(at: -1).isEmpty)
        XCTAssertTrue(engine.journalAnswers(at: 3).isEmpty)
        XCTAssertFalse(restored.choose("hold-chen"))
        restored.continueResponse("stale-response")
        XCTAssertEqual(restored.response?.id, response.id)
        restored.continueResponse(response.id)
        XCTAssertNil(restored.response)
        XCTAssertNotNil(restored.engine?.outcome)
        XCTAssertEqual(restored.engine?.history, engine.history)
        XCTAssertEqual(try Data(contentsOf: url), bytes)
        XCTAssertEqual(try Data(contentsOf: chapterURL), chapterBytes)
    }

    func testFailedAtomicSaveDoesNotAdvanceOrAnnounceSuccess() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = try completedChapter(at: folder.appendingPathComponent("chapter.json"))
        let blocker = folder.appendingPathComponent("not-a-directory")
        try Data("keep".utf8).write(to: blocker)
        let session = CouncilSession(origin: try XCTUnwrap(chapter.engine), saveURL: blocker.appendingPathComponent("council.json"))
        let before = session.engine?.metrics
        XCTAssertFalse(session.choose("take-crown"))
        XCTAssertEqual(session.engine?.metrics, before)
        XCTAssertEqual(session.engine?.history.count, 0)
        XCTAssertNil(session.response); XCTAssertNotNil(session.error)
        XCTAssertFalse(session.restart())
        XCTAssertEqual(try Data(contentsOf: blocker), Data("keep".utf8))
    }

    func testCorruptSavePreservedUntilExplicitRecovery() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = try completedChapter(at: folder.appendingPathComponent("chapter.json"))
        let url = folder.appendingPathComponent("council.json"), damaged = Data("not-json".utf8)
        try damaged.write(to: url)
        let session = CouncilSession(origin: try XCTUnwrap(chapter.engine), saveURL: url)
        XCTAssertTrue(session.needsRecovery)
        XCTAssertFalse(session.choose("take-crown"))
        XCTAssertEqual(try Data(contentsOf: url), damaged)
        XCTAssertTrue(session.restart())
        XCTAssertFalse(session.needsRecovery)
        XCTAssertEqual(session.engine?.history.count, 0)
        let backup = try XCTUnwrap(FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil).first { $0.lastPathComponent.hasPrefix("preserved-council-") })
        XCTAssertEqual(try Data(contentsOf: backup), damaged)
        XCTAssertTrue(session.choose("take-crown"))
    }

    func testObserverCannotReenterCommitOrRestart() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = try completedChapter(at: folder.appendingPathComponent("chapter.json"))
        let session = CouncilSession(origin: try XCTUnwrap(chapter.engine), saveURL: folder.appendingPathComponent("council.json"))
        var duplicate: Bool?, restart: Bool?
        let observation = session.$engine.dropFirst().sink { _ in
            duplicate = session.choose("take-crown")
            restart = session.restart()
        }
        defer { observation.cancel() }
        XCTAssertTrue(session.choose("take-crown"))
        XCTAssertEqual(duplicate, false); XCTAssertEqual(restart, false)
        XCTAssertEqual(session.engine?.history.count, 1)
        XCTAssertNotNil(session.response)
    }

    func testRuleFingerprintAndInvalidReplayAreRejected() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = try completedChapter(at: folder.appendingPathComponent("chapter.json"))
        let origin = try XCTUnwrap(chapter.engine), url = folder.appendingPathComponent("council.json")
        let session = CouncilSession(origin: origin, saveURL: url)
        let entry = try XCTUnwrap(session.entry)
        let badSaves = [
            CouncilChronicle(version: 2, definitionId: "chen-council.v1", definitionSHA256: session.fingerprint, entry: entry, choices: []),
            CouncilChronicle(version: 1, definitionId: "chen-council.v1", definitionSHA256: "changed", entry: entry, choices: []),
            CouncilChronicle(version: 1, definitionId: "chen-council.v1", definitionSHA256: session.fingerprint, entry: entry, choices: ["one-command"]),
            CouncilChronicle(version: 1, definitionId: "chen-council.v1", definitionSHA256: session.fingerprint, entry: entry, choices: Array(repeating: "take-crown", count: 4))
        ]
        for save in badSaves {
            let bytes = try JSONEncoder().encode(save); try bytes.write(to: url)
            let restored = CouncilSession(origin: origin, saveURL: url)
            XCTAssertTrue(restored.needsRecovery)
            XCTAssertFalse(restored.choose("take-crown"))
            XCTAssertEqual(try Data(contentsOf: url), bytes)
        }
    }

    func testAnotherChronicleDoesNotInheritDecisionsOrDestroyUntilCommit() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let first = try completedChapter(at: folder.appendingPathComponent("first.json"), seed: 0)
        let second = try completedChapter(at: folder.appendingPathComponent("second.json"), seed: 1)
        let url = folder.appendingPathComponent("council.json")
        let a = CouncilSession(origin: try XCTUnwrap(first.engine), saveURL: url)
        XCTAssertTrue(a.choose("take-crown"))
        let bytes = try Data(contentsOf: url)
        let b = CouncilSession(origin: try XCTUnwrap(second.engine), saveURL: url)
        XCTAssertNotEqual(a.entry?.id, b.entry?.id)
        XCTAssertEqual(b.engine?.history.count, 0)
        XCTAssertFalse(b.needsRecovery)
        XCTAssertEqual(try Data(contentsOf: url), bytes)
        XCTAssertTrue(b.choose("defer-title"))
        XCTAssertNotEqual(try Data(contentsOf: url), bytes)
    }

    func testCouncilNotAvailableBeforeChapterCompletion() async throws {
        let folder = try directory(); defer { try? FileManager.default.removeItem(at: folder) }
        let chapter = GameSession(saveURL: folder.appendingPathComponent("chapter.json"), initialSeed: 0)
        let session = CouncilSession(origin: try XCTUnwrap(chapter.engine), saveURL: folder.appendingPathComponent("council.json"))
        XCTAssertNil(session.entry); XCTAssertNil(session.engine)
        XCTAssertFalse(session.choose("take-crown")); XCTAssertFalse(session.restart())
    }
}
