import XCTest
@testable import SHI

final class RetreatPreviewBundleTests: XCTestCase {
    func testDraftResourcesFollowTheAppIdentity() throws {
        let qa = Bundle.main.bundleIdentifier == "art.lazying.shi.aftermathqa"
        XCTAssertEqual(RetreatPreviewContent.isEligible(bundleIdentifier: Bundle.main.bundleIdentifier), qa)
        for name in ["chen-retreat.rules.v1", "chen-retreat.v1", "refuge.rules.v1", "refuge.v1", "refuge-morning.v1", "refuge-contact.v1"] {
            XCTAssertEqual(Bundle.main.url(forResource: name, withExtension: "json") != nil, qa)
        }
        XCTAssertEqual(RetreatPreviewContent.rules != nil, qa)
        XCTAssertEqual(RetreatPreviewContent.story != nil, qa)
        XCTAssertEqual(RetreatPreviewContent.refuge != nil, qa)
        if qa {
            let rules = try JSONSerialization.jsonObject(with: XCTUnwrap(RetreatPreviewContent.rules)) as! Record
            let story = try JSONSerialization.jsonObject(with: XCTUnwrap(RetreatPreviewContent.story)) as! Record
            XCTAssertEqual(rules.text("storyId"), story.text("id"))
            XCTAssertEqual(story["publicationApproved"] as? Bool, false)
        }
    }
}
