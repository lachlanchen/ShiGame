import XCTest

// Run these as two separate invocations, installing the candidate between them.
// No fixture injection or app-only test hooks: the historical UI creates the save.
#if SHI_UPGRADE_QA
final class UpgradeUITests: XCTestCase {
    private let app = XCUIApplication(bundleIdentifier: "art.lazying.shi.upgradeqa")

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launchArguments = ["-shi.locale", "en", "-shi.reduced-motion", "true"]
    }
    override func tearDownWithError() throws { app.terminate() }

    private func tap(_ id: String) {
        let button = app.buttons.matching(identifier: id).firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: 15), id)
        for _ in 0..<18 {
            if button.isHittable { button.tap(); return }
            let scroll = app.scrollViews.allElementsBoundByIndex.first { $0.isHittable }
            (scroll ?? app).swipeUp(velocity: .slow)
        }
        XCTFail("Upgrade control is not reachable: \(id)")
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    private func beginSavedGame() {
        app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15))
        XCTAssertEqual(app.buttons["begin-game"].label, "Continue")
        tap("begin-game")
    }
    private func issue(_ id: String) {
        tap(id); tap("issue-order")
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.scrollViews["campaign"].exists)
    }
    private func acknowledge() {
        tap("aftermath-continue")
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 15))
    }

    func testPrepareHistoricalUnreadSave() {
        app.launch()
        // A prior interrupted harness run may have left its QA-only unread save.
        // Acknowledge through the real UI before the explicitly confirmed reset.
        if !app.buttons["settings-toggle"].waitForExistence(timeout: 3) {
            tap("begin-game"); acknowledge()
        }
        tap("settings-toggle"); tap("new-chronicle"); tap("confirm-restart")
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 15))
        issue("hide-the-register")
        XCTAssertTrue(app.staticTexts["aftermath-consequence"].exists)
        capture("upgrade-01-historical-unread")
        // Keep the actual file written by the historical app. Never reset in phase 2.
        app.terminate()
    }

    func testResumeInstalledCandidateWithoutReset() {
        beginSavedGame()
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.staticTexts["aftermath-consequence"].exists)
        XCTAssertFalse(app.scrollViews["campaign"].exists)
        capture("upgrade-02-candidate-preserved-unread")
        acknowledge()
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "1")
        issue("release-oldest")
        app.terminate(); beginSavedGame()
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 15))
        acknowledge()
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "2")
        for id in ["cut-the-carts", "race-for-chen"] { issue(id); acknowledge() }
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        XCTAssertTrue(app.staticTexts["Chapter complete"].exists)
        capture("upgrade-03-completed-after-relaunch")
        app.terminate(); beginSavedGame()
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        XCTAssertFalse(app.buttons["aftermath-continue"].exists)
    }
}
#endif
