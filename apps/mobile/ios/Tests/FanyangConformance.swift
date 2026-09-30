import Foundation
import CryptoKit

@main struct FanyangConformance {
    static func main() throws {
        guard CommandLine.arguments.count == 4 else { fatalError("Pass council JSON, Fan Yang JSON and fixture JSON") }
        func load(_ path: String) throws -> (Data, Record) {
            let bytes = try Data(contentsOf: URL(fileURLWithPath: path))
            return (bytes, try JSONSerialization.jsonObject(with: bytes) as! Record)
        }
        let (councilBytes, councilDefinition) = try load(CommandLine.arguments[1])
        let (sceneBytes, definition) = try load(CommandLine.arguments[2])
        let (_, fixture) = try load(CommandLine.arguments[3])
        func hash(_ data: Data) -> String { SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined() }
        let councilHash = hash(councilBytes), sceneHash = hash(sceneBytes)
        precondition(fixture.text("definitionSHA256") == sceneHash && fixture.text("councilSHA256") == councilHash)
        let cases = fixture.records("states")
        precondition(!cases.isEmpty && fixture.int("endings") == 993 && fixture.int("councilRoutes") == 77)
        var endings = 0, turns = 0, rejectionChecks = 0
        func reject(_ operation: () throws -> Void) {
            do { try operation() } catch { rejectionChecks += 1; return }
            fatalError("Invalid order or save accepted")
        }
        for item in cases {
            let arrival = item.text("arrival")
            var council = try CouncilEngine(definition: councilDefinition, entry: CouncilEntry(id: "conformance-\(arrival)", arrival: arrival))
            for id in item.strings("councilChoices") { try council.choose(id) }
            let entry = try FanyangEntry(council: council, fingerprint: councilHash)
            var state = try FanyangEngine(definition: definition, entry: entry)
            for id in item.strings("choices") { try state.choose(id) }
            precondition(state.metrics == item["metrics"] as! Resources)
            let expectedTurns = try JSONDecoder().decode([CouncilTurn].self, from: JSONSerialization.data(withJSONObject: item.records("history")))
            precondition(state.history == expectedTurns)
            precondition(state.outcome == item["outcome"] as? String)
            precondition(state.choices.filter { state.canChoose($0) }.map { $0.text("id") } == item.strings("available"))
            precondition(state.prospects == item.strings("prospects"))
            let save = try state.chronicle(fingerprint: sceneHash)
            let roundTrip = try JSONDecoder().decode(FanyangChronicle.self, from: JSONEncoder().encode(save))
            let restored = try FanyangEngine.restore(definition: definition, entry: entry, fingerprint: sceneHash, save: roundTrip)
            precondition(restored.history == state.history && restored.metrics == state.metrics && restored.outcome == state.outcome)
            reject { _ = try FanyangEngine.restore(definition: definition, entry: entry, fingerprint: String(repeating: "0", count: 64), save: save) }
            reject { _ = try state.preview("not-an-order") }
            for choice in state.choices where !state.canChoose(choice) { reject { _ = try state.preview(choice.text("id")) } }
            if state.completed { endings += 1; reject { _ = try state.preview("withdraw-envoy") } }
            turns += state.history.count
        }
        precondition(endings == fixture.int("endings"))
        print("Fan Yang Swift parity passed: \(cases.count) states, \(endings) endings, \(turns) replayed turns, \(rejectionChecks) rejected invalid actions; all metrics/history/outcomes/available orders/prospects/save round trips match.")
    }
}
