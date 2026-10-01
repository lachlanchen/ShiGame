import Foundation

/// Two independent gates: a QA-only compilation condition and exact QA bundle
/// identity. The production project must not contain either draft resource.
enum RetreatPreviewContent {
    static func isEligible(bundleIdentifier: String?) -> Bool {
        #if SHI_RETREAT_PREVIEW
        return bundleIdentifier == "art.lazying.shi.aftermathqa"
        #else
        return false
        #endif
    }
    private static func load(_ name: String) -> Data? {
        guard isEligible(bundleIdentifier: Bundle.main.bundleIdentifier),
              let url = Bundle.main.url(forResource: name, withExtension: "json") else { return nil }
        return try? Data(contentsOf: url)
    }
    static let rules = load("chen-retreat.rules.v1")
    static let story = load("chen-retreat.v1")
    static let followup = load("refuge-followup.v1")
    static var refuge: [String: Data]? {
        let names = ["retreatRules": "chen-retreat.rules.v1", "retreatStory": "chen-retreat.v1",
                     "nightRules": "refuge.rules.v1", "nightStory": "refuge.v1",
                     "morning": "refuge-morning.v1", "contact": "refuge-contact.v1"]
        var content: [String: Data] = [:]
        for (key, name) in names {
            guard let bytes = load(name) else { return nil }
            content[key] = bytes
        }
        return content
    }
}
