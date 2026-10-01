import Foundation

/// Shared diagram contract. These are display coordinates, never world positions
/// or counts of people. Reading/projecting cannot advance the engagement.
struct CrossingFieldPresentation: Decodable {
    struct Canvas: Decodable { let width: Double; let height: Double }
    struct River: Decodable { let left: Double; let right: Double }
    struct Route: Decodable { let startX: Double; let endX: Double; let y: Double }
    struct Rear: Decodable { let x: Double; let y: Double; let minimumSpread: Double; let maximumSpread: Double }
    struct Projection: Equatable { let progressX: Double; let rearSpread: Double; let pursuitX: Double }
    let schemaVersion: Int
    let id: String
    let claimStatus: String
    let canvas: Canvas
    let river: River
    let route: Route
    let rear: Rear
    let pursuit: Route
    let palette: [String: String]
    let labels: [String: [String: String]]

    static func load(_ data: Data) throws -> Self {
        let result = try JSONDecoder().decode(Self.self, from: data)
        guard result.schemaVersion == 1, result.id == "crossing-field-v1",
              result.claimStatus == "dramatic-reconstruction",
              result.canvas.width == 100, result.canvas.height == 60,
              result.river.left < result.river.right,
              result.route.startX < result.route.endX,
              result.rear.minimumSpread >= 0, result.rear.maximumSpread >= result.rear.minimumSpread,
              result.pursuit.startX < result.pursuit.endX else {
            throw CampaignError.invalid("Unsupported crossing diagram; use the readable metrics.")
        }
        return result
    }
    static let bundled: Self? = Bundle.main.url(forResource: "crossing-field.v1", withExtension: "json")
        .flatMap { try? Data(contentsOf: $0) }.flatMap { try? load($0) }
    func text(_ key: String, locale: String) -> String { labels[locale]?[key] ?? labels["en"]?[key] ?? key }
    func project(_ metrics: Resources) -> Projection {
        func index(_ key: String) -> Double { Double(max(0, min(100, metrics[key, default: 0]))) / 100 }
        return Projection(progressX: route.startX + (route.endX - route.startX) * index("crossingProgress"),
                          rearSpread: rear.minimumSpread + (rear.maximumSpread - rear.minimumSpread) * (1 - index("rearCohesion")),
                          pursuitX: pursuit.startX + (pursuit.endX - pursuit.startX) * index("pursuitClosure"))
    }
}
