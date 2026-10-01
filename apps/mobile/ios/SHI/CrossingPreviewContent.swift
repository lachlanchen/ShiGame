import Foundation

enum CrossingPreviewContent {
    static func isEligible(bundleIdentifier: String?) -> Bool {
        #if SHI_CROSSING_PREVIEW
        return bundleIdentifier == "art.lazying.shi.crossingqa"
        #else
        return false
        #endif
    }
    static var enabled: Bool { isEligible(bundleIdentifier: Bundle.main.bundleIdentifier) }
    static func load() throws -> CrossingCampaignContent {
        guard enabled else { throw CampaignError.invalid("Crossing preview is not enabled in this app.") }
        func data(_ name: String) throws -> Data {
            guard let url = Bundle.main.url(forResource: name, withExtension: "json") else { throw CampaignError.invalid("Missing crossing preview content: \(name)") }
            return try Data(contentsOf: url)
        }
        return try CrossingCampaignContent(campaignData: data("campaign"), engagementData: data("chapter-01-broken-crossing.v1"),
            rulesData: data("chapter-01-crossing-campaign.rules.v2"), aftermathData: data("chapter-01-crossing-aftermath.v2"))
    }
}
