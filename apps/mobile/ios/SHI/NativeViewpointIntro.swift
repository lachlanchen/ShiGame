import SwiftUI

/// Presentation only: deliberately separate from hash-bound campaign saves.
struct NativeViewpointIntro: View {
    let scene: String
    let locale: String
    var chapterChoices: [String] = []
    private static let content: Record = {
        guard let url = Bundle.main.url(forResource: "viewpoints.v1", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let record = (try? JSONSerialization.jsonObject(with: data)) as? Record else { return [:] }
        return record.object("scenes")
    }()

    var body: some View {
        let passage = Self.content.object(scene)
        let memories = scene == "council" ? passage.records("chapterBridges").filter { chapterChoices.contains($0.text("afterChoice")) } : []
        if !passage.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text(passage.localized("title", locale)).font(.headline).accessibilityAddTraits(.isHeader)
                Text(passage.localized("text", locale)).lineSpacing(6)
                Text(passage.localized("bridge", locale)).lineSpacing(6)
                    .accessibilityIdentifier("\(scene)-story-bridge")
                if memories.count == 1 {
                    Text(memories[0].localized("text", locale)).lineSpacing(6)
                        .accessibilityIdentifier("council-chapter-bridge")
                }
            }.accessibilityElement(children: .combine).accessibilityIdentifier("\(scene)-viewpoint")
        }
    }
}
