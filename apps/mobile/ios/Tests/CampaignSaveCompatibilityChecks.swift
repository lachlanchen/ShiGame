import Foundation

@main enum CampaignSaveCompatibilityChecks {
    static func main() throws {
        let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let policy = try JSONDecoder().decode(CampaignSaveCompatibility.self, from: data)
        let current = policy.currentCampaignSHA256
        var checks = 0
        func check(_ saved: String, _ target: String, _ bytes: Data?, _ expected: Bool) {
            precondition(CampaignSaveCompatibility.accepts(saved: saved, current: target, policy: bytes) == expected)
            checks += 1
        }
        check(current, current, nil, true)
        check("", "", data, false)
        for prior in policy.previousCampaigns {
            check(prior.campaignSHA256, current, data, true)
            check(prior.campaignSHA256, current, nil, false)
            check(prior.campaignSHA256, current, Data("bad policy".utf8), false)
            check(prior.campaignSHA256.uppercased(), current, data, false)
            check(prior.campaignSHA256, String(repeating: "0", count: 64), data, false)
            check(String(repeating: "0", count: 64), current, data, false)
            for key in ["schemaVersion", "campaignId", "reviewStatus", "currentCampaignSHA256", "previousCampaigns"] {
                var invalid = try JSONSerialization.jsonObject(with: data) as! [String: Any]
                invalid.removeValue(forKey: key)
                check(prior.campaignSHA256, current, try JSONSerialization.data(withJSONObject: invalid), false)
            }
        }
        print("PASS: \(checks) native save-policy acceptance/rejection checks; no files modified.")
    }
}
