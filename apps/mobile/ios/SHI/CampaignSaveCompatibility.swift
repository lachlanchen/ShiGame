import Foundation

/// Build validation reconstructs each admitted edition's exact published bytes
/// by reversing prose-only edits. Never take this policy from a saved chronicle.
struct CampaignSaveCompatibility: Decodable {
    struct Previous: Decodable { let campaignSHA256: String }
    let schemaVersion: Int
    let campaignId: String
    let currentCampaignSHA256: String
    let reviewStatus: String
    let previousCampaigns: [Previous]

    static func accepts(saved: String, current: String, policy: Data?) -> Bool {
        func valid(_ hash: String) -> Bool {
            hash.count == 64 && hash.allSatisfy { "0123456789abcdef".contains($0) }
        }
        guard valid(saved), valid(current) else { return false }
        if saved == current { return true }
        guard let policy, let manifest = try? JSONDecoder().decode(Self.self, from: policy),
              manifest.schemaVersion == 1, manifest.campaignId == "chapter-01-daze",
              manifest.reviewStatus == "reviewed-prose-only",
              manifest.currentCampaignSHA256 == current,
              !manifest.previousCampaigns.isEmpty,
              manifest.previousCampaigns.allSatisfy({ valid($0.campaignSHA256) && $0.campaignSHA256 != current }),
              Set(manifest.previousCampaigns.map(\.campaignSHA256)).count == manifest.previousCampaigns.count else { return false }
        return manifest.previousCampaigns.contains { $0.campaignSHA256 == saved }
    }
}
