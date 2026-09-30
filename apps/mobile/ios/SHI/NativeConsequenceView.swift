import SwiftUI

/// Native presentation of an already saved turn. No timers, choice resolver,
/// media callbacks or save writer live in this view.
struct NativeConsequenceView: View {
    @EnvironmentObject private var session: GameSession
    @Environment(\.accessibilityReduceMotion) private var reducedMotion
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var detailsExpanded = false
    let aftermath: ChoiceAftermath
    let locale: String
    var film: NativeFilmAsset? = nil

    private var response: Record { aftermath.response }
    private var choice: Record { response.object("choice") }
    private var turn: Record { response.object("turn") }
    private func t(_ key: String) -> String { session.text(key, locale) }
    private func label(_ group: String, _ key: String) -> String { session.label(group, key, locale) }

    private func direction(_ record: Record, _ key: String) -> LayoutDirection {
        locale == "ar" && record.object(key)["ar"] != nil ? .rightToLeft : .leftToRight
    }

    var body: some View {
        VStack(spacing: 0) {
            narrative
            continueButton
        }
        .background(ink).foregroundStyle(parchment)
        .onAppear { headingFocused = true }
    }

    private var narrative: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(label("cinema", "aftermath") + " · " + t("reconstruction"))
                    .font(.subheadline).foregroundStyle(gold)
                Text(choice.localized("label", locale))
                    .font(.system(.largeTitle, design: .serif))
                    .accessibilityAddTraits(.isHeader).accessibilityFocused($headingFocused)
                    .accessibilityIdentifier("aftermath-title")
                    .environment(\.layoutDirection, direction(choice, "label"))
                Divider().overlay(gold.opacity(0.3))
                if let film, !reducedMotion {
                    NativeSilentFilm(asset: film, label: { label("cinema", $0) })
                        .id(film.url)
                }
                Text(choice.localized("consequence", locale))
                    .font(.system(.title3, design: .serif)).lineSpacing(8)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("aftermath-consequence")
                    .environment(\.layoutDirection, direction(choice, "consequence"))
                DisclosureGroup(isExpanded: $detailsExpanded) {
                    VStack(alignment: .leading, spacing: 24) { layers }
                        .padding(.top, 20)
                } label: {
                    Text(label("cinema", "changes")).font(.headline).padding(.vertical, 12)
                }.tint(gold).accessibilityIdentifier("aftermath-details")
            }.padding(24).frame(maxWidth: 780, alignment: .leading).frame(maxWidth: .infinity)
        }
        .accessibilityIdentifier("aftermath")
        .clipped()
    }

    // A sibling, not a scroll inset: the reading viewport and this control have
    // disjoint bounds, including for accessibility hit testing at largest text.
    private var continueButton: some View {
            Button {
                session.continueAftermath(aftermath.id)
            } label: {
                HStack {
                    Text(t("continue")).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 16)
                    Image(systemName: "arrow.forward").accessibilityHidden(true)
                }.frame(minHeight: 44).padding(.horizontal, 18).padding(.vertical, 8)
            }
            .buttonStyle(.borderedProminent).tint(gold).foregroundStyle(ink)
            .accessibilityIdentifier("aftermath-continue")
            .padding(20).frame(maxWidth: 820).frame(maxWidth: .infinity)
            .background(ink)
    }

    @ViewBuilder private var layers: some View {
        layer(title: choice.localized("label", locale), record: [:], field: "", effects: turn.object("playerDeltas"))
        if !response.object("outcome").isEmpty {
            layer(title: label("commitment", "answer"), record: response.object("outcome"), field: "response", effects: turn.object("commitmentDeltas"))
        }
        layer(title: t("pressureResponse"), record: choice.object("pressure"), field: "reveal", effects: turn.object("pressureDeltas"))
        let opposition = session.campaign.object("opposition")
        let stage = opposition.records("stages").first { $0.text("id") == turn.text("oppositionStageId") } ?? [:]
        layer(title: label("opposition", "response"), record: stage, field: "response", effects: turn.object("oppositionDeltas"))
        let model = opposition.object("methodRead")
        let read = ([model.object("neutral")] + model.records("countermeasures")).first { $0.text("id") == turn.text("methodReadId") } ?? [:]
        layer(title: label("opposition", "methodRead"), record: read, field: "title", effects: turn.object("methodReadDeltas"))
        layer(title: t("fieldApplied"), record: response.object("field"), field: "title", effects: turn.object("fieldDeltas"))
    }

    private func layer(title: String, record: Record, field: String, effects: Record) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.headline).foregroundStyle(gold).accessibilityAddTraits(.isHeader)
            if !record.localized(field, locale).isEmpty {
                Text(record.localized(field, locale)).lineSpacing(5)
                    .environment(\.layoutDirection, direction(record, field))
            }
            if effects.isEmpty { Text(label("opposition", "noModifier")).font(.subheadline) }
            else {
                ForEach(resourceKeys.filter { effects[$0] != nil }, id: \.self) { key in
                    HStack(alignment: .firstTextBaseline) {
                        Text(t(key))
                        Spacer(minLength: 12)
                        Text(String(format: "%+d", effects.int(key))).monospacedDigit()
                    }.accessibilityElement(children: .combine)
                }
            }
            Divider().overlay(gold.opacity(0.2))
        }
    }
}
