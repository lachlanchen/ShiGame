import Foundation

/// Development-only handoff. Callers verify the canonical source bytes before
/// supplying their digests. Native save identity is not a web interchange ID.
/// This does not load draft content into the release app or create a new save.
struct RetreatEntry: Equatable {
    let id: String
    let metrics: Resources
    let priorChoices: [String]
    let readingContext: [String: String]
    let registerOpening: String
    let crossingOrder: String?
    let courierRecruitedEarlier: Bool

    init(chapter: CampaignEngine, council: CouncilEngine, fanyang: FanyangEngine,
         campaignFingerprint: String, councilFingerprint: String, fanyangFingerprint: String) throws {
        guard [campaignFingerprint, councilFingerprint, fanyangFingerprint].allSatisfy(FanyangEntry.validDigest),
              let chapterEntry = CouncilEntry.from(chapter), chapterEntry == council.entry,
              council.completed, fanyang.completed, let outcome = fanyang.outcome,
              ["opened", "withdrawn", "deferred"].contains(outcome) else {
            throw CampaignError.invalid("Complete matching chapters before entering the retreat.")
        }
        let expectedFanyang = try FanyangEntry(council: council, fingerprint: councilFingerprint)
        guard expectedFanyang == fanyang.entry,
              CouncilEngine.metricKeys.allSatisfy({ key in
                  fanyang.metrics[key].map { (0...10).contains($0) } ?? false
              }) else {
            throw CampaignError.invalid("Fan Yang belongs to another council or revision.")
        }
        // Assurance belongs to diplomacy; it is not a sixth retreat resource.
        metrics = Dictionary(uniqueKeysWithValues: CouncilEngine.metricKeys.map { ($0, fanyang.metrics[$0]!) })
        let chapterChoices = chapter.history.map { $0.text("choiceId") }
        let councilChoices = council.history.map(\.choiceId)
        let fanyangChoices = fanyang.history.map(\.choiceId)
        priorChoices = chapterChoices + councilChoices + fanyangChoices
        readingContext = ["fanyang": outcome, "yu": "unestablished", "han": "unestablished"]
        let opening = chapter.history.first { $0.text("nodeId") == "rain-order" }?.text("choiceId")
        switch opening {
        case "read-the-names": registerOpening = "read-publicly"
        case "take-the-beacon": registerOpening = "beacon-seized"
        case "hide-the-register": registerOpening = "hidden"
        default: registerOpening = "unestablished"
        }
        crossingOrder = chapter.history.first { $0.text("nodeId") == "broken-crossing" }?.text("choiceId")
        courierRecruitedEarlier = chapterChoices.contains("turn-the-courier")
        let identity: [Any] = ["chen-retreat-story-draft.v1", campaignFingerprint,
            councilFingerprint, fanyangFingerprint, chapterEntry.id, councilChoices, fanyangChoices]
        id = String(decoding: try JSONSerialization.data(withJSONObject: identity, options: [.sortedKeys]), as: UTF8.self)
    }
}
