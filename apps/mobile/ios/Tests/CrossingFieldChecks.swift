import Foundation

@main struct CrossingFieldChecks {
    static func main() throws {
        let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let field = try CrossingFieldPresentation.load(data)
        precondition(field.labels.count == 11)
        for locale in field.labels.keys {
            for key in ["title", "nearBank", "farBank", "boundary"] { precondition(!field.text(key, locale: locale).isEmpty) }
        }
        var count = 0
        for value in -1...101 {
            let metrics = Dictionary(uniqueKeysWithValues: EngagementEngine.metricKeys.map { ($0, value) })
            let actual = field.project(metrics), n = Double(max(0, min(100, value))) / 100
            precondition(abs(actual.progressX - (24 + 56 * n)) < 0.000001)
            precondition(abs(actual.rearSpread - (8 - 6 * n)) < 0.000001)
            precondition(abs(actual.pursuitX - (6 + 13 * n)) < 0.000001)
            precondition(actual.progressX >= 24 && actual.progressX <= 80)
            count += 1
        }
        precondition(field.project([:]) == field.project(["crossingProgress": Int.min, "rearCohesion": Int.min, "pursuitClosure": Int.min]))
        var invalid = try JSONSerialization.jsonObject(with: data) as! Record
        invalid["claimStatus"] = "historical-fact"
        do { _ = try CrossingFieldPresentation.load(JSONSerialization.data(withJSONObject: invalid)); preconditionFailure("Accepted false historical map") }
        catch is CampaignError {}
        print("PASS: \(count) crossing diagram projections, 11 label sets, clamped bounds, missing metrics and false-historical-claim rejection.")
    }
}
