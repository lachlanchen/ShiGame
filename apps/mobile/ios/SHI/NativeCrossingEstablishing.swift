import SwiftUI

/// Optional local still, never an outcome or a command. Missing art is harmless.
struct NativeCrossingEstablishing: View {
    let locale: String
    private static let definition: Record = Bundle.main.url(forResource: "crossing-establishing.v1", withExtension: "json")
        .flatMap { try? Data(contentsOf: $0) }.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
    private static let image = Bundle.main.path(forResource: "broken-crossing-establishing-v1", ofType: "jpg")
        .flatMap { UIImage(contentsOfFile: $0) }
    var body: some View {
        if let image = Self.image, Self.definition.text("id") == "crossing-establishing-v1" {
            let text = Self.definition.object("labels").object(locale)
            VStack(alignment: .leading, spacing: 8) {
                Image(uiImage: image).resizable().scaledToFit().clipShape(RoundedRectangle(cornerRadius: 10))
                    .accessibilityLabel(text.text("alt")).accessibilityIdentifier("crossing-establishing-image")
                Text(text.text("caption")).font(.caption).foregroundStyle(parchment.opacity(0.85))
            }
        }
    }
}
