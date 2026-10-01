import Foundation

@main struct RefugeContinuationSessionChecks {
    @MainActor static func main() throws {
        guard CommandLine.arguments.count == 4 else { fatalError("Pass parity fixture, content root, new evidence directory") }
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! Record
        let root = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
        precondition(!FileManager.default.fileExists(atPath: root.path))
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let contentRoot = URL(fileURLWithPath: CommandLine.arguments[2])
        var bytes: [String: Data] = [:], definitions: [String: Record] = [:]
        for (key, path) in fixture["paths"] as! [String: String] {
            bytes[key] = try Data(contentsOf: contentRoot.appendingPathComponent(path))
            definitions[key] = try JSONSerialization.jsonObject(with: bytes[key]!) as? Record
        }
        let hashes = fixture["hashes"] as! [String: String]
        var chapter = try CampaignEngine(campaign: definitions["campaign"]!, seed: 0)
        for id in fixture.strings("chapterChoices") { try chapter.choose(id) }
        var council = try CouncilEngine(definition: definitions["council"]!, entry: CouncilEntry.from(chapter)!)
        for id in fixture.strings("councilChoices") { try council.choose(id) }
        var fanyang = try FanyangEngine(definition: definitions["fanyang"]!, entry: FanyangEntry(council: council, fingerprint: hashes["council"]!))
        for id in fixture.strings("fanyangChoices") { try fanyang.choose(id) }
        let entry = try RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
            campaignFingerprint: hashes["campaign"]!, councilFingerprint: hashes["council"]!, fanyangFingerprint: hashes["fanyang"]!)
        let content = bytes.filter { !["campaign", "council", "fanyang"].contains($0.key) }
        var checks = 0
        for (index, route) in fixture.records("entries").enumerated() {
            var retreat = try RetreatEngine(definition: definitions["retreatRules"]!, entry: entry)
            for id in route.strings("retreatChoices") { try retreat.choose(id) }
            let source = retreat.history
            let url = root.appendingPathComponent("route-\(index).json")
            var failWrite = true
            let live = RefugeContinuationSession(retreat: retreat, content: content, saveURL: url) { data, destination in
                if failWrite { throw CocoaError(.fileWriteOutOfSpace) }
                try data.write(to: destination, options: .atomic)
            }
            precondition(live.engine != nil && live.error == nil && !FileManager.default.fileExists(atPath: url.path))
            precondition(!live.choose("invented") && live.engine!.orders.isEmpty)
            precondition(!live.choose("offer-labour") && live.engine!.orders.isEmpty && live.response == nil)
            precondition(!FileManager.default.fileExists(atPath: url.path))
            failWrite = false
            for id in ["offer-labour", "follow-witness", "ask-unprompted"] {
                precondition(live.choose(id))
                let saved = try Data(contentsOf: url), responseID = live.response!.id
                precondition(!live.choose(id))
                live.continueResponse("stale"); precondition(live.response!.id == responseID)
                let resumed = RefugeContinuationSession(retreat: retreat, content: content, saveURL: url)
                precondition(resumed.engine!.summary as NSDictionary == live.engine!.summary as NSDictionary)
                precondition(resumed.response?.index == live.response?.index)
                let afterResume = try Data(contentsOf: url); precondition(afterResume == saved)
                live.continueResponse(responseID)
                checks += 1
            }
            precondition(live.engine!.completed && live.engine!.promise == "broken")
            precondition(!live.choose("show-record"))
            let good = try Data(contentsOf: url)
            let corrupt = Data("not a chronicle".utf8); try corrupt.write(to: url)
            let damaged = RefugeContinuationSession(retreat: retreat, content: content, saveURL: url)
            precondition(damaged.needsRecovery && !damaged.choose("sleep-outside"))
            let untouched = try Data(contentsOf: url); precondition(untouched == corrupt)
            precondition(damaged.restart() && !damaged.needsRecovery && damaged.engine!.orders.isEmpty)
            let backups = try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)
                .filter { $0.lastPathComponent.hasPrefix("preserved-refuge-") }
            let hasBackup = try backups.contains { try Data(contentsOf: $0) == corrupt }
            precondition(hasBackup)
            try good.write(to: url)
            var changed = content; changed["nightStory"] = content["nightStory"]! + Data(" ".utf8)
            let stale = RefugeContinuationSession(retreat: retreat, content: changed, saveURL: url)
            precondition(stale.needsRecovery && !stale.choose("sleep-outside"))
            let preserved = try Data(contentsOf: url); precondition(preserved == good)
            var missing = content; missing.removeValue(forKey: "nightStory")
            let absent = RefugeContinuationSession(retreat: retreat, content: missing, saveURL: url)
            precondition(absent.engine == nil && !absent.restart())
            precondition(retreat.history == source)
            checks += 8
        }
        print("Native continuation session passed: \(checks) checkpoint checks across four retreat entries; durable choices, failed writes, cold resume, reaction lock, corruption backup and stale revision refusal. Not a SwiftUI/device test.")
    }
}
