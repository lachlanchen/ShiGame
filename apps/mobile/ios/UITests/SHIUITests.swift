import XCTest

final class SHIUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
    }
    override func tearDownWithError() throws {
        // A failed rotation assertion must not poison the next test's layout.
        XCUIDevice.shared.orientation = .portrait
        XCUIApplication().terminate()
    }
    func startFresh(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["settings-toggle"].waitForExistence(timeout: 15))
        app.buttons["settings-toggle"].tap()
        let reset = app.buttons["new-chronicle"]
        reveal(reset, in: app); reset.tap()
        // SwiftUI's confirmation dialog exposes nested buttons with the same
        // identifier on iOS26. Select the first representation of this action.
        let confirm = app.buttons.matching(identifier: "confirm-restart").firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 10)); confirm.tap()
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 10))
    }
    func continueAftermath(_ app: XCUIApplication) {
        let next = app.buttons["aftermath-continue"]
        XCTAssertTrue(next.waitForExistence(timeout: 10))
        XCTAssertFalse(app.scrollViews["campaign"].exists, "The next decision must not remain behind the outcome")
        XCTAssertTrue(next.isHittable); next.tap()
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 10))
    }
    func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<32 {
            let reading = ["panel-reading", "aftermath", "refuge-scene", "retreat-scene", "fanyang-scene", "council", "campaign", "title-reading"]
                .map { app.scrollViews[$0] }.first { $0.exists && $0.isHittable }
            let viewport = reading ?? app
            var visible = viewport.frame.intersection(app.frame)
            // NavigationStack scroll frames can include content under its bar.
            // Keep taps and drags inside the unobscured reading region.
            for bar in app.navigationBars.allElementsBoundByIndex where bar.isHittable {
                if bar.frame.intersects(visible) {
                    let top = max(visible.minY, bar.frame.maxY)
                    visible = CGRect(x: visible.minX, y: top, width: visible.width, height: max(0, visible.maxY - top))
                }
            }
            visible = visible.insetBy(dx: 4, dy: 12)
            let frame = element.exists ? element.frame : .zero
            // A campaign choice includes its explanatory prose and can be
            // taller than a phone at AX XXXL. Such a card cannot fit in full;
            // center its tappable area safely instead. Compact action buttons
            // (including Continue) still require complete visibility.
            let tallCardCentered = element.exists && element.elementType == .button
                && frame.height > visible.height && frame.minX >= visible.minX && frame.maxX <= visible.maxX
                && visible.contains(CGPoint(x: frame.midX, y: frame.midY))
                && visible.intersection(frame).height >= 44
            if element.exists && element.isHittable && (visible.contains(frame) || tallCardCentered) { return }
            guard visible.width > 0, visible.height > 0 else { continue }
            // Center the observed target with a bounded drag. Full-screen flicks
            // overshoot tall controls in landscape and can oscillate forever.
            let limit = visible.height * 0.4
            let distance = frame.height > 0 ? max(-limit, min(limit, frame.midY - visible.midY)) : limit
            let start = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: visible.midX, dy: visible.midY))
            let end = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: visible.midX, dy: visible.midY - distance))
            // Hold at the endpoint so UIScrollView does not add inertial travel
            // and repeatedly fling a landscape control past both boundaries.
            start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.25)
        }
        capture("unreachable-control")
        XCTFail("Control was not reachable: \(element)")
    }
    func capture(_ name: String) {
        // A visible element may exist while the system's sheet is still moving.
        Thread.sleep(forTimeInterval: 0.8)
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
    func testNativeCampaignAndDurableResume() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-shi.locale", "en", "-shi.reduced-motion", "true"]
        app.launch()
        startFresh(app)
        app.buttons["return-title"].tap()
        let begin = app.buttons["begin-game"]
        XCTAssertTrue(begin.waitForExistence(timeout: 20)); capture("01-native-title")
        reveal(begin, in: app); begin.tap()
        let guide = app.buttons["close-guide"]
        if guide.waitForExistence(timeout: 3) { reveal(guide, in: app); guide.tap() }
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 10))
        capture("02-native-campaign")
        let first = app.buttons["hide-the-register"]
        reveal(first, in: app); first.tap()
        XCTAssertTrue(app.buttons["issue-order"].waitForExistence(timeout: 10))
        capture("03-native-order-reading")
        let issue = app.buttons["issue-order"]
        reveal(issue, in: app); issue.tap()
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.scrollViews["campaign"].exists)
        XCTAssertTrue(app.staticTexts["aftermath-consequence"].exists)
        capture("04-native-aftermath")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 10))
        capture("05-native-aftermath-background-resume")
        // Terminate while reading, before Continue: saved rules already advanced.
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15))
        XCTAssertEqual(app.buttons["begin-game"].label, "Continue")
        app.buttons["begin-game"].tap()
        XCTAssertTrue(app.buttons["aftermath-continue"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["aftermath-consequence"].exists)
        capture("05b-native-unread-aftermath-relaunch")
        continueAftermath(app)
        XCTAssertFalse(app.buttons["aftermath-continue"].exists)
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "1")
        for id in ["release-oldest", "cut-the-carts", "race-for-chen"] {
            let order = app.buttons[id]; reveal(order, in: app); order.tap()
            reveal(app.buttons["issue-order"], in: app); app.buttons["issue-order"].tap()
            continueAftermath(app)
        }
        reveal(app.staticTexts["Chapter complete"], in: app)
        XCTAssertTrue(app.staticTexts["Chapter complete"].exists)
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        capture("06-native-ending")
        app.buttons["Sources"].tap()
        XCTAssertTrue(app.staticTexts["Historical basis"].exists || app.staticTexts["Sources"].exists)
        capture("07-native-sources")
        app.terminate()
    }
    func testLargeTextAndRTL() throws {
        continueAfterFailure = false
        for locale in ["zh-Hans", "ar"] {
            let app = XCUIApplication()
            app.launchArguments = ["-shi.locale", locale, "-shi.reduced-motion", "true", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            app.launch()
            startFresh(app)
            app.buttons["return-title"].tap()
            let begin = app.buttons["begin-game"]
            XCTAssertTrue(begin.waitForExistence(timeout: 20))
            reveal(begin, in: app)
            XCTAssertTrue(begin.isHittable)
            capture("06-large-text-" + locale)
            begin.tap()
            let guide = app.buttons["close-guide"]
            if guide.waitForExistence(timeout: 3) { reveal(guide, in: app); guide.tap() }
            XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 10))
            capture("07-large-text-campaign-" + locale)
            let order = app.buttons["read-the-names"]
            reveal(order, in: app); order.tap()
            let issue = app.buttons["issue-order"]
            reveal(issue, in: app); issue.tap()
            let next = app.buttons["aftermath-continue"]
            XCTAssertTrue(next.waitForExistence(timeout: 10)); XCTAssertTrue(next.isHittable)
            capture("08-large-text-aftermath-" + locale)
            let details = app.buttons.matching(identifier: "aftermath-details").firstMatch
            reveal(details, in: app); details.tap()
            XCTAssertTrue(app.scrollViews["aftermath"].exists)
            // Read inside the disclosure as well, not just its toggle label.
            app.scrollViews["aftermath"].swipeUp()
            XCTAssertTrue(next.isHittable)
            capture("09-large-text-details-" + locale)
            XCUIDevice.shared.orientation = .landscapeLeft
            XCTAssertTrue(next.isHittable)
            capture("10-large-text-landscape-" + locale)
            XCUIDevice.shared.orientation = .portrait
            continueAftermath(app)
            XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "1")
            app.terminate()
        }
    }

    func finishChapterForCouncil(_ app: XCUIApplication) {
        startFresh(app)
        for id in ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"] {
            let order = app.buttons[id]; reveal(order, in: app); order.tap()
            reveal(app.buttons["issue-order"], in: app); app.buttons["issue-order"].tap()
            continueAftermath(app)
        }
        let enter = app.buttons["council-enter"]
        reveal(enter, in: app); XCTAssertTrue(enter.isHittable); enter.tap()
        XCTAssertTrue(app.staticTexts["council-title"].waitForExistence(timeout: 10))
    }
    @discardableResult
    func councilDecision(_ id: String, _ app: XCUIApplication, expectedOutcome: String? = nil) -> [String: String] {
        let offer = app.buttons["council-offer-" + id]
        reveal(offer, in: app); offer.tap()
        var expected: [String: String] = [:]
        for key in ["grain", "tempo", "city", "allies", "veterans"] {
            let preview = app.staticTexts["council-preview-" + key].label
            let parts = preview.components(separatedBy: "→")
            XCTAssertEqual(parts.count, 2)
            guard parts.count == 2,
                  let before = Int(parts[0].split(separator: " ").last ?? ""),
                  let after = Int(parts[1].trimmingCharacters(in: .whitespaces)) else {
                XCTFail("Expected numeric before/after preview for \(key): \(preview)")
                return [:]
            }
            let delta = after - before
            expected[key] = preview + " (\(delta > 0 ? "+" : "")\(delta))"
        }
        let outcomePreview = app.staticTexts["council-outcome-preview"]
        if let expectedOutcome {
            reveal(outcomePreview, in: app)
            XCTAssertTrue(outcomePreview.exists)
            XCTAssertEqual(outcomePreview.value as? String, expectedOutcome)
            XCTAssertFalse(app.staticTexts["council-response"].exists)
            capture("council-final-outcome-preview")
        } else {
            XCTAssertFalse(outcomePreview.exists)
        }
        let commit = app.buttons["council-commit"]
        reveal(commit, in: app); XCTAssertTrue(commit.isEnabled); commit.tap()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["council-commit"].exists)
        assertSavedChanges(expected, prefix: "council-response", app)
        return expected
    }
    func assertSavedChanges(_ expected: [String: String], prefix: String, _ app: XCUIApplication) {
        for (key, value) in expected {
            XCTAssertEqual(app.staticTexts[prefix + "-saved-" + key].label, value)
        }
    }
    func councilContinue(_ app: XCUIApplication) {
        let next = app.buttons["council-continue"]
        reveal(next, in: app); next.tap()
    }
    func testCouncilChoicesDurableResumeAndReplayCancel() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-shi.locale", "en", "-shi.reduced-motion", "true"]
        app.launch(); finishChapterForCouncil(app)
        capture("council-01-native-opening")
        let firstChanges = councilDecision("defer-title", app)
        capture("council-02-native-response")
        XCUIDevice.shared.press(.home); app.activate()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10))
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15)); app.buttons["begin-game"].tap()
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        let enter = app.buttons["council-enter"]; reveal(enter, in: app); enter.tap()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "council-progress").firstMatch.value as? String, "1")
        assertSavedChanges(firstChanges, prefix: "council-response", app)
        capture("council-03-native-resumed")
        councilContinue(app)
        let secondChanges = councilDecision("joint-ledger", app); councilContinue(app)
        let thirdChanges = councilDecision("one-command", app, expectedOutcome: "common-front")
        // Simulate leaving after durable commitment, before reading the ending.
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15)); app.buttons["begin-game"].tap()
        let reenter = app.buttons["council-enter"]; reveal(reenter, in: app); reenter.tap()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "council-progress").firstMatch.value as? String, "3")
        assertSavedChanges(thirdChanges, prefix: "council-response", app)
        capture("council-final-reaction-restored")
        councilContinue(app)
        let outcome = app.staticTexts["council-outcome"]
        reveal(outcome, in: app); XCTAssertTrue(outcome.exists)
        XCTAssertEqual(outcome.value as? String, "common-front")
        let finalMetrics = try thirdChanges.mapValues { text -> Int in
            let parts = text.components(separatedBy: "→")
            XCTAssertEqual(parts.count, 2)
            return try XCTUnwrap(Int(parts.last!.split(separator: " ").first!))
        }
        let supporters = ["city", "allies", "veterans"].filter { finalMetrics[$0, default: 0] >= 6 }.count
        for (id, value, required) in [("support", supporters, 2), ("grain", finalMetrics["grain"]!, 2), ("tempo", finalMetrics["tempo"]!, 3)] {
            XCTAssertTrue(app.staticTexts["council-readiness-" + id].label.hasSuffix("\(value) \(value >= required ? "≥" : "<") \(required)"))
        }
        for id in ["city", "allies", "veterans"] {
            let value = finalMetrics[id]!
            XCTAssertTrue(app.staticTexts["council-support-" + id].label.hasSuffix("\(value) \(value >= 6 ? "≥" : "<") 6"))
        }
        let readiness = app.staticTexts["council-readiness-title"]
        reveal(readiness, in: app)
        capture("council-04-native-conclusion")
        let journal = app.descendants(matching: .any).matching(identifier: "council-journal-toggle").firstMatch
        reveal(journal, in: app); journal.tap()
        for (index, changes) in [firstChanges, secondChanges, thirdChanges].enumerated() {
            assertSavedChanges(changes, prefix: "council-journal-\(index)", app)
        }
        let retry = app.buttons["council-retry"]; reveal(retry, in: app); retry.tap()
        let cancel = app.buttons.matching(identifier: "council-cancel-restart").firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        reveal(outcome, in: app); XCTAssertTrue(outcome.exists)
        app.buttons["council-close"].tap()
        XCTAssertTrue(app.scrollViews["campaign"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        app.terminate()
    }
    func testFanyangContinuationResumeWithdrawalAndCancel() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-shi.locale", "en", "-shi.reduced-motion", "true"]
        app.launch(); finishChapterForCouncil(app)
        for id in ["defer-title", "joint-ledger", "one-command"] {
            councilDecision(id, app, expectedOutcome: id == "one-command" ? "common-front" : nil)
            councilContinue(app)
        }
        let enter = app.buttons["fanyang-enter"]; reveal(enter, in: app); enter.tap()
        XCTAssertTrue(app.staticTexts["fanyang-title"].waitForExistence(timeout: 10))
        // Explicitly reset only this QA scene, retaining any incompatible test save.
        let retry = app.buttons["fanyang-retry"]; reveal(retry, in: app); retry.tap()
        let confirm = app.buttons.matching(identifier: "fanyang-confirm-restart").firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 10)); confirm.tap()
        func order(_ id: String) {
            let offer = app.buttons["fanyang-offer-" + id]; reveal(offer, in: app); offer.tap()
            let commit = app.buttons["fanyang-commit"]; reveal(commit, in: app)
            XCTAssertTrue(commit.isEnabled); commit.tap()
            XCTAssertTrue(app.staticTexts["fanyang-response"].waitForExistence(timeout: 10))
        }
        func next() {
            let button = app.buttons["fanyang-continue"]; reveal(button, in: app); button.tap()
        }
        order("public-safety")
        let reaction = app.staticTexts["fanyang-response"].label
        capture("fanyang-01-native-reaction")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15)); app.buttons["begin-game"].tap()
        let chen = app.buttons["council-enter"]; reveal(chen, in: app); chen.tap()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10)); councilContinue(app)
        reveal(app.buttons["fanyang-enter"], in: app); app.buttons["fanyang-enter"].tap()
        XCTAssertTrue(app.staticTexts["fanyang-response"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["fanyang-response"].label, reaction)
        capture("fanyang-02-native-resumed")
        next(); order("hold-talks"); next(); order("withdraw-envoy"); next()
        let outcome = app.staticTexts["fanyang-outcome"]
        XCTAssertTrue(outcome.waitForExistence(timeout: 10)); XCTAssertEqual(outcome.value as? String, "withdrawn")
        capture("fanyang-03-native-withdrawn")
        reveal(app.buttons["fanyang-retry"], in: app); app.buttons["fanyang-retry"].tap()
        let cancel = app.buttons.matching(identifier: "fanyang-cancel-restart").firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertEqual(outcome.value as? String, "withdrawn")
        app.buttons["fanyang-close"].tap()
        XCTAssertTrue(app.staticTexts["council-outcome"].waitForExistence(timeout: 10))
    }

    #if SHI_RETREAT_PREVIEW
    func testRetreatContinuationResumeEndingAndCancel() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-shi.locale", "en", "-shi.reduced-motion", "true"]
        app.launch(); finishChapterForCouncil(app)
        func reviewBridge(_ scene: String, containing expected: String) {
            let passage = app.descendants(matching: .any).matching(identifier: scene + "-viewpoint").firstMatch
            XCTAssertTrue(passage.waitForExistence(timeout: 10))
            reveal(passage, in: app)
            let text = ([passage.label] + passage.descendants(matching: .staticText).allElementsBoundByIndex.map(\.label)).joined(separator: " ")
            XCTAssertTrue(text.contains(expected), "Missing shared narrative bridge: \(scene)")
            capture("story-bridge-" + scene)
        }
        if app.buttons["council-retry"].exists {
            let retry = app.buttons["council-retry"]; reveal(retry, in: app); retry.tap()
            let confirm = app.buttons.matching(identifier: "council-confirm-restart").firstMatch
            XCTAssertTrue(confirm.waitForExistence(timeout: 10)); confirm.tap()
        }
        let rules = app.buttons["Council rules and conditions"].firstMatch
        reveal(rules, in: app)
        XCTAssertTrue(rules.exists)
        let ruleText = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Secure at least two groups")).firstMatch
        XCTAssertFalse(ruleText.exists)
        capture("council-rules-native-closed")
        rules.tap()
        XCTAssertTrue(ruleText.waitForExistence(timeout: 10))
        capture("council-rules-native-open")
        reveal(rules, in: app); rules.tap()
        XCTAssertFalse(ruleText.exists)
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "council-progress").firstMatch.value as? String, "0")
        reviewBridge("council", containing: "keeper enters with a supply column")
        for id in ["defer-title", "joint-ledger", "one-command"] {
            councilDecision(id, app, expectedOutcome: id == "one-command" ? "common-front" : nil)
            councilContinue(app)
        }
        let fanyang = app.buttons["fanyang-enter"]; reveal(fanyang, in: app); fanyang.tap()
        XCTAssertTrue(app.staticTexts["fanyang-title"].waitForExistence(timeout: 10))
        reveal(app.buttons["fanyang-retry"], in: app); app.buttons["fanyang-retry"].tap()
        let resetFanyang = app.buttons.matching(identifier: "fanyang-confirm-restart").firstMatch
        XCTAssertTrue(resetFanyang.waitForExistence(timeout: 10)); resetFanyang.tap()
        reviewBridge("fanyang", containing: "soldiers waiting here will obey him")
        for id in ["public-safety", "hold-talks", "withdraw-envoy"] {
            let offer = app.buttons["fanyang-offer-" + id]; reveal(offer, in: app); offer.tap()
            let commit = app.buttons["fanyang-commit"]; reveal(commit, in: app); XCTAssertTrue(commit.isEnabled); commit.tap()
            XCTAssertTrue(app.staticTexts["fanyang-response"].waitForExistence(timeout: 10))
            let next = app.buttons["fanyang-continue"]; reveal(next, in: app); next.tap()
        }
        func enterRetreat() {
            let enter = app.buttons["retreat-enter"]; reveal(enter, in: app); XCTAssertTrue(enter.exists); enter.tap()
            XCTAssertTrue(app.scrollViews["retreat-scene"].waitForExistence(timeout: 10))
            // Wait for presentation geometry rather than measuring a moving cover.
            let reader = app.scrollViews["retreat-scene"]
            let fullReadingArea = NSPredicate { _, _ in
                let visible = reader.frame.intersection(app.frame)
                return visible.width >= app.frame.width * 0.9 && visible.height >= app.frame.height * 0.8
            }
            expectation(for: fullReadingArea, evaluatedWith: reader)
            waitForExpectations(timeout: 10)
        }
        func reaction() -> XCUIElement { app.descendants(matching: .any).matching(identifier: "retreat-response").firstMatch }
        func order(_ id: String) {
            let offer = app.buttons["retreat-offer-" + id]; reveal(offer, in: app); offer.tap()
            let commit = app.buttons["retreat-commit"]; reveal(commit, in: app); XCTAssertTrue(commit.isEnabled); commit.tap()
            XCTAssertTrue(reaction().waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["retreat-commit"].exists)
        }
        func next() { let button = app.buttons["retreat-continue"]; reveal(button, in: app); button.tap() }
        enterRetreat()
        reveal(app.buttons["retreat-retry"], in: app); app.buttons["retreat-retry"].tap()
        let reset = app.buttons.matching(identifier: "retreat-confirm-restart").firstMatch
        XCTAssertTrue(reset.waitForExistence(timeout: 10)); reset.tap()
        order("decline-dispatch")
        let original = reaction().descendants(matching: .staticText).allElementsBoundByIndex.map(\.label)
        XCTAssertFalse(original.isEmpty)
        capture("retreat-01-native-reaction")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["begin-game"].waitForExistence(timeout: 15)); app.buttons["begin-game"].tap()
        XCTAssertEqual(app.buttons["chronicle-toggle"].value as? String, "4")
        reveal(app.buttons["council-enter"], in: app); app.buttons["council-enter"].tap()
        XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10)); councilContinue(app)
        reveal(app.buttons["fanyang-enter"], in: app); app.buttons["fanyang-enter"].tap()
        XCTAssertTrue(app.staticTexts["fanyang-response"].waitForExistence(timeout: 10))
        reveal(app.buttons["fanyang-continue"], in: app); app.buttons["fanyang-continue"].tap()
        enterRetreat()
        XCTAssertTrue(reaction().waitForExistence(timeout: 10))
        XCTAssertEqual(reaction().descendants(matching: .staticText).allElementsBoundByIndex.map(\.label), original)
        capture("retreat-02-native-resumed")
        next()
        for id in ["gather-own", "split-routes", "carry-records"] { order(id); next() }
        let release = app.buttons["retreat-offer-release-groups"]; reveal(release, in: app); release.tap()
        let preview = app.staticTexts["retreat-preview"]; reveal(preview, in: app)
        let expected = try XCTUnwrap(preview.value as? String)
        XCTAssertTrue(["dispersed", "scattered"].contains(expected))
        capture("retreat-03-native-ending-preview")
        order("release-groups"); next()
        let ending = app.staticTexts["retreat-outcome"]
        XCTAssertTrue(ending.waitForExistence(timeout: 10)); XCTAssertEqual(ending.value as? String, expected)
        let releasePassage = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "没有再问他们何时归队")).firstMatch
        if expected == "dispersed" {
            XCTAssertTrue(releasePassage.waitForExistence(timeout: 10))
            reveal(releasePassage, in: app)
            capture("retreat-release-of-command-native")
        } else {
            XCTAssertFalse(releasePassage.exists)
        }
        capture("retreat-04-native-ending")
        let record = app.buttons["回看这一路的决定"]
        XCTAssertTrue(record.waitForExistence(timeout: 10))
        let firstRecord = app.descendants(matching: .any).matching(identifier: "retreat-record-decline-dispatch").firstMatch
        XCTAssertFalse(firstRecord.exists)
        reveal(record, in: app); record.tap()
        XCTAssertTrue(firstRecord.waitForExistence(timeout: 10))
        reveal(firstRecord, in: app)
        capture("retreat-05-native-decision-record")
        let lastRecord = app.descendants(matching: .any).matching(identifier: "retreat-record-release-groups").firstMatch
        reveal(lastRecord, in: app); XCTAssertTrue(lastRecord.exists)
        capture("retreat-06-native-decision-record-last")
        let replay = app.buttons["retreat-rewind-carry-records"]
        reveal(replay, in: app); replay.tap()
        let replayCancel = app.buttons.matching(identifier: "retreat-rewind-cancel").firstMatch
        XCTAssertTrue(replayCancel.waitForExistence(timeout: 10))
        capture("retreat-07-native-replay-confirmation")
        replayCancel.tap()
        XCTAssertEqual(ending.value as? String, expected)
        reveal(replay, in: app); replay.tap()
        let replayConfirm = app.buttons.matching(identifier: "retreat-rewind-confirm").firstMatch
        XCTAssertTrue(replayConfirm.waitForExistence(timeout: 10)); replayConfirm.tap()
        XCTAssertTrue(app.buttons["retreat-commit"].waitForExistence(timeout: 10))
        XCTAssertFalse(reaction().exists)
        order("strip-identities"); next()
        order("release-groups"); next()
        XCTAssertTrue(ending.waitForExistence(timeout: 10))
        XCTAssertEqual(ending.value as? String, expected)
        capture("retreat-08-native-replayed-ending")
        reveal(record, in: app); record.tap()
        let changedRecord = app.descendants(matching: .any).matching(identifier: "retreat-record-strip-identities").firstMatch
        reveal(changedRecord, in: app); XCTAssertTrue(changedRecord.exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "retreat-record-carry-records").firstMatch.exists)
        capture("retreat-09-native-replayed-record")
        reveal(record, in: app); record.tap()
        XCTAssertEqual(ending.value as? String, expected)
        reveal(app.buttons["retreat-retry"], in: app); app.buttons["retreat-retry"].tap()
        let cancel = app.buttons.matching(identifier: "retreat-cancel-restart").firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertEqual(ending.value as? String, expected)
        let refuge = app.buttons["refuge-enter"]
        reveal(refuge, in: app); XCTAssertTrue(refuge.isEnabled); refuge.tap()
        XCTAssertTrue(app.scrollViews["refuge-scene"].waitForExistence(timeout: 10))
        reveal(app.buttons["refuge-restart"], in: app); app.buttons["refuge-restart"].tap()
        app.buttons.matching(identifier: "refuge-confirm-restart").firstMatch.tap()
        func refugeOrder(_ id: String) {
            let offer = app.buttons["refuge-offer-" + id]
            reveal(offer, in: app); XCTAssertTrue(offer.isEnabled); offer.tap()
            let commit = app.buttons["refuge-commit"]
            reveal(commit, in: app); commit.tap()
            XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "refuge-response").firstMatch.waitForExistence(timeout: 10))
            XCTAssertTrue(app.buttons["refuge-continue"].exists)
            XCTAssertFalse(app.buttons["refuge-commit"].exists)
        }
        func refugeNext() {
            let next = app.buttons["refuge-continue"]; reveal(next, in: app); next.tap()
        }
        refugeOrder("offer-labour"); capture("refuge-01-native-night-response"); refugeNext()
        refugeOrder("repair-roof"); capture("refuge-02-native-kept-promise"); refugeNext()
        let privateRecord = app.buttons["refuge-offer-leave-record"]
        reveal(privateRecord, in: app); XCTAssertTrue(privateRecord.exists); XCTAssertFalse(privateRecord.isEnabled)
        refugeOrder("leave-route")
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "具体话语尚未托付")).firstMatch.exists,
            "The saved contact outcome must replace the morning's pending-message status")
        capture("refuge-03-native-message-response")
        app.buttons["refuge-close"].tap()
        reveal(refuge, in: app); refuge.tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "refuge-response").firstMatch.waitForExistence(timeout: 10))
        refugeNext()
        let complete = app.staticTexts["refuge-complete"]
        reveal(complete, in: app); XCTAssertTrue(complete.exists)
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "具体话语尚未托付")).firstMatch.exists)
        capture("refuge-04-native-resumed-conclusion")
        app.buttons["refuge-close"].tap()
        app.buttons["retreat-close"].tap()
        XCTAssertTrue(app.staticTexts["fanyang-outcome"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["fanyang-outcome"].value as? String, "withdrawn")
    }

    #endif

    func testCouncilLargestTextChineseAndArabicFallback() throws {
        continueAfterFailure = false
        for locale in ["zh-Hans", "ar"] {
            let app = XCUIApplication()
            app.launchArguments = ["-shi.locale", locale, "-shi.reduced-motion", "true", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
            app.launch(); finishChapterForCouncil(app)
            capture("council-05-large-text-" + locale)
            XCTAssertEqual(app.staticTexts["council-title"].label, locale == "zh-Hans" ? "陈地议事" : "The council at Chen")
            let offer = app.buttons["council-offer-defer-title"]; reveal(offer, in: app); offer.tap()
            let commit = app.buttons["council-commit"]
            reveal(commit, in: app); XCTAssertTrue(commit.isHittable)
            capture("council-06-large-preview-" + locale)
            commit.tap()
            XCTAssertTrue(app.staticTexts["council-response"].waitForExistence(timeout: 10))
            let next = app.buttons["council-continue"]; reveal(next, in: app)
            XCTAssertTrue(next.isHittable)
            capture("council-07-large-response-" + locale)
            XCUIDevice.shared.orientation = .landscapeLeft
            reveal(next, in: app); XCTAssertTrue(next.isHittable)
            capture("council-08-large-landscape-" + locale)
            XCUIDevice.shared.orientation = .portrait
            councilContinue(app)
            let second = app.buttons["council-offer-joint-ledger"]; reveal(second, in: app); XCTAssertTrue(second.isHittable)
            app.buttons["council-close"].tap(); app.terminate()
        }
    }
}
