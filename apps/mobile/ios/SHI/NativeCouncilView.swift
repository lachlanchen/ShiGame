import SwiftUI

struct NativeCouncilView: View {
    @StateObject private var session: CouncilSession
    @Environment(\.dismiss) private var dismiss
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selectedID = ""
    @State private var confirmRestart = false
    @State private var showFanyang = false
    let locale: String
    private let origin: CampaignEngine
    private let campaignFingerprint: String

    init(origin: CampaignEngine, locale: String, campaignFingerprint: String = "") {
        _session = StateObject(wrappedValue: CouncilSession(origin: origin))
        self.origin = origin; self.campaignFingerprint = campaignFingerprint
        self.locale = locale == "zh-Hans" ? "zh-Hans" : "en"
    }
    private func text(_ record: Record, _ key: String) -> String { record.localized(key, locale) }
    private func label(_ key: String) -> String { session.definition.object("labels").localized(key, locale) }
    private func metric(_ key: String) -> String { text(session.definition.object("metrics").object(key), "title") }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Text(label("interlude") + " · 209 BCE").font(.caption).foregroundStyle(gold)
                        Text(text(session.definition, "title")).font(.system(.largeTitle, design: .serif))
                            .accessibilityAddTraits(.isHeader).accessibilityIdentifier("council-title")
                            .accessibilityFocused($headingFocused).id("council-top")
                        Text(text(session.definition, "boundary")).font(.footnote).lineSpacing(4)
                        if let engine = session.engine {
                            progress(engine)
                            DisclosureGroup {
                                Text(text(session.definition, "objective")).font(.subheadline).lineSpacing(4)
                            } label: {
                                Text(locale == "zh-Hans" ? "议事规则与条件" : "Council rules and conditions")
                            }
                            .accessibilityIdentifier("council-rules")
                            if session.needsRecovery { notice(label("invalidSave")) }
                            else if session.error != nil { notice(label("saveError")) }
                            if let response = session.response { responseView(engine, response) }
                            else if let outcome = engine.outcome { conclusion(engine, outcome) }
                            else { decision(engine) }
                            position(engine)
                            sourceDisclosure
                            if !engine.history.isEmpty {
                                DisclosureGroup {
                                    VStack(alignment: .leading, spacing: 16) {
                                        ForEach(engine.history.indices, id: \.self) { index in
                                            Text(text(engine.choice(at: index), "title")).font(.headline)
                                            Text(text(engine.choice(at: index), "response")).lineSpacing(5)
                                            ForEach(Array(engine.journalAnswers(at: index).enumerated()), id: \.offset) { _, answer in
                                                Text(text(answer, "text")).foregroundStyle(gold).lineSpacing(5)
                                            }
                                            savedChanges(engine.history[index], prefix: "council-journal-\(index)")
                                        }
                                    }.padding(.top, 12)
                                } label: {
                                    Text(label("journal")).accessibilityIdentifier("council-journal-toggle")
                                }
                            }
                            if session.needsRecovery || !engine.history.isEmpty {
                                Button(label("retry")) { confirmRestart = true }.buttonStyle(.bordered)
                                    .frame(minHeight: 44).accessibilityIdentifier("council-retry")
                            }
                        } else { notice(session.error ?? "The council could not be opened.") }
                    }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("council")
                    .onAppear { headingFocused = true }
                    .onChange(of: session.phaseID) { _ in
                        selectedID = ""
                        proxy.scrollTo("council-top", anchor: .top)
                        headingFocused = true
                    }
            }
            .background(ink).foregroundStyle(parchment)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(label("close")) { dismiss() }.frame(minHeight: 44).accessibilityIdentifier("council-close")
                }
            }
            .toolbarBackground(ink, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            // An alert keeps an explicit Cancel action in both compact and
            // regular layouts; popover confirmation dialogs can omit it.
            .alert(label("confirmRetry"), isPresented: $confirmRestart) {
                Button(label("reset"), role: .destructive) { session.restart() }.accessibilityIdentifier("council-confirm-restart")
                Button(label("cancel"), role: .cancel) { }.accessibilityIdentifier("council-cancel-restart")
            }
        }
        // The shared interlude currently has EN/zh-Hans prose. Do not display an
        // English fallback as Arabic speech or right-to-left narrative.
        .environment(\.locale, Locale(identifier: locale)).environment(\.layoutDirection, .leftToRight)
        .tint(gold).preferredColorScheme(.dark)
        .sheet(isPresented: $showFanyang) {
            if let engine = session.engine, engine.completed, !session.needsRecovery {
                NativeFanyangView(council: engine, fingerprint: session.fingerprint, locale: locale,
                    chapter: origin, campaignFingerprint: campaignFingerprint)
            }
        }
    }

    private func notice(_ message: String) -> some View {
        Text(message).padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.red.opacity(0.16), in: RoundedRectangle(cornerRadius: 12))
            .accessibilityIdentifier("council-error")
    }
    private func progress(_ engine: CouncilEngine) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(session.definition.records("rounds").enumerated()), id: \.offset) { index, round in
                Text("\(index < engine.history.count ? "✓" : String(index + 1)) · \(text(round, "title"))")
                    .font(.subheadline).foregroundStyle(index <= engine.history.count ? gold : parchment)
            }
        }.accessibilityElement(children: .combine).accessibilityIdentifier("council-progress")
            .accessibilityValue(String(engine.history.count))
    }
    @ViewBuilder private func decision(_ engine: CouncilEngine) -> some View {
        let choice = engine.choices.first { $0.text("id") == selectedID } ?? engine.choices.first ?? [:]
        Text(label("round") + " · \(engine.history.count + 1) / 3").font(.caption).foregroundStyle(gold)
        Text(text(engine.round, "title")).font(.title2).accessibilityAddTraits(.isHeader)
        if engine.history.isEmpty {
            NativeViewpointIntro(scene: "council", locale: locale, chapterChoices: origin.history.map { $0.text("choiceId") })
            Text(text(session.definition, "introduction")).lineSpacing(6)
        }
        Text(text(engine.round, "context")).lineSpacing(6)
        ForEach(engine.choices, id: \.idValue) { offer in
            Button { selectedID = offer.text("id") } label: {
                HStack(alignment: .top, spacing: 14) {
                    Image(systemName: offer.text("id") == choice.text("id") ? "largecircle.fill.circle" : "circle")
                        .accessibilityHidden(true)
                    Text(text(offer, "title")).multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                }.padding(16).frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
                    .background(gold.opacity(offer.text("id") == choice.text("id") ? 0.18 : 0.06), in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(gold.opacity(0.5)))
            }.buttonStyle(.plain).disabled(session.needsRecovery)
                .accessibilityAddTraits(offer.text("id") == choice.text("id") ? [.isSelected] : [])
                .accessibilityIdentifier("council-offer-" + offer.text("id"))
        }
        VStack(alignment: .leading, spacing: 18) {
            Text(text(choice, "title")).font(.headline)
            Text(text(choice, "intent")).lineSpacing(5)
            if !choice.object("pledge").isEmpty { Text(label("pledge") + ": " + text(choice, "pledge")).foregroundStyle(gold) }
            ForEach(Array(engine.answers(choice).enumerated()), id: \.offset) { _, answer in
                Text(label("memory") + ": " + text(answer, "text")).foregroundStyle(gold)
            }
            if let preview = try? engine.preview(choice.text("id")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(label("preview")).font(.headline)
                    ForEach(CouncilEngine.metricKeys, id: \.self) { key in
                        Text("\(metric(key))  \(engine.metrics[key, default: 0]) → \(preview.metrics[key, default: 0])")
                            .monospacedDigit().accessibilityIdentifier("council-preview-" + key)
                    }
                    if let outcome = preview.outcome {
                        Text(label("preview") + ": " + text(session.definition.object("outcomes").object(outcome), "title"))
                            .font(.headline).foregroundStyle(gold)
                            .accessibilityIdentifier("council-outcome-preview").accessibilityValue(outcome)
                    }
                }
            } else {
                Text(label("need") + ": " + CouncilEngine.metricKeys.filter { choice.object("requires")[$0] != nil }
                    .map { "\(metric($0)) \(choice.object("requires").int($0))" }.joined(separator: " · "))
            }
            Button { session.choose(choice.text("id")) } label: {
                Label(label("commit"), systemImage: "checkmark.seal").frame(maxWidth: .infinity).padding(.vertical, 12)
            }.buttonStyle(.borderedProminent).foregroundStyle(ink)
                .disabled(session.needsRecovery || !engine.canChoose(choice)).accessibilityIdentifier("council-commit")
        }.padding(20).background(gold.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
    }
    private func savedChanges(_ turn: CouncilTurn, prefix: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(CouncilEngine.metricKeys, id: \.self) { key in
                let before = turn.before[key, default: 0]
                let after = turn.after[key, default: 0]
                let delta = after - before
                Text("\(metric(key))  \(before) → \(after) (\(delta > 0 ? "+" : "")\(delta))")
                    .monospacedDigit().fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier(prefix + "-saved-" + key)
            }
        }
    }
    private func responseView(_ engine: CouncilEngine, _ response: CouncilResponse) -> some View {
        let choice = engine.choice(at: response.index)
        return VStack(alignment: .leading, spacing: 20) {
            Text(label("response")).font(.caption).foregroundStyle(gold)
            Text(text(choice, "title")).font(.title2).accessibilityAddTraits(.isHeader)
            Text(text(choice, "response")).font(.title3).lineSpacing(7).accessibilityIdentifier("council-response")
            ForEach(Array(engine.answers(choice).enumerated()), id: \.offset) { _, answer in
                Text(text(answer, "text")).foregroundStyle(gold).lineSpacing(5)
            }
            if engine.history.indices.contains(response.index) {
                savedChanges(engine.history[response.index], prefix: "council-response")
            }
            Button { session.continueResponse(response.id) } label: {
                Label(label(engine.completed ? "conclude" : "continue"), systemImage: "arrow.right").frame(maxWidth: .infinity).padding(.vertical, 12)
            }.buttonStyle(.borderedProminent).foregroundStyle(ink).accessibilityIdentifier("council-continue")
        }
    }
    private func conclusion(_ engine: CouncilEngine, _ id: String) -> some View {
        let outcome = session.definition.object("outcomes").object(id)
        return VStack(alignment: .leading, spacing: 20) {
            Text(text(outcome, "title")).font(.title).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("council-outcome").accessibilityValue(id)
            Text(text(outcome, "text")).font(.title3).lineSpacing(7)
            VStack(alignment: .leading, spacing: 12) {
                Text(locale == "zh-Hans" ? "共同出兵的条件" : "What a common front needs")
                    .font(.headline).accessibilityAddTraits(.isHeader).accessibilityIdentifier("council-readiness-title")
                ForEach(engine.readiness.checks) { check in
                    let title = check.id == "support"
                        ? (locale == "zh-Hans" ? "支持达到6的群体" : "Groups with at least 6 support") : metric(check.id)
                    Text("\(check.met ? "✓" : "—") \(title): \(check.value) \(check.met ? "≥" : "<") \(check.required)")
                        .monospacedDigit().fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("council-readiness-" + check.id)
                }
                ForEach(["city", "allies", "veterans"], id: \.self) { key in
                    Text("\(metric(key)): \(engine.metrics[key, default: 0]) \(engine.readiness.supporters.contains(key) ? "≥" : "<") 6")
                        .monospacedDigit().fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("council-support-" + key)
                }
            }
            Button(label("close")) { dismiss() }.buttonStyle(.borderedProminent).foregroundStyle(ink)
                .frame(minHeight: 44).accessibilityIdentifier("council-finish")
            Button(locale == "zh-Hans" ? "继续北行：范阳城门" : "Continue north: the gate at Fan Yang") { showFanyang = true }
                .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48)
                .disabled(session.needsRecovery).accessibilityIdentifier("fanyang-enter")
        }
    }
    private func position(_ engine: CouncilEngine) -> some View {
        let arrival = session.definition.object("arrivals").object(engine.entry.arrival)
        return DisclosureGroup(label("arrival")) {
            VStack(alignment: .leading, spacing: 18) {
                Text(text(arrival, "title")).font(.headline)
                Text(text(arrival, "text")).lineSpacing(5)
                ForEach(CouncilEngine.metricKeys, id: \.self) { key in
                    VStack(alignment: .leading, spacing: 6) {
                        Text("\(metric(key))  \(engine.metrics[key, default: 0]) / 10").font(.headline).monospacedDigit()
                        Text(text(session.definition.object("metrics").object(key), "meaning")).font(.subheadline)
                    }.accessibilityElement(children: .combine).accessibilityIdentifier("council-metric-" + key)
                }
                if !engine.history.isEmpty { Text(label("pledge") + ": " + text(engine.choice(at: 0), "pledge")).foregroundStyle(gold) }
            }.padding(.top, 12)
        }.accessibilityIdentifier("council-position")
    }
    private var sourceDisclosure: some View {
        let history = session.definition.object("history")
        return DisclosureGroup(label("history")) {
            VStack(alignment: .leading, spacing: 16) {
                Text(text(history, "title")).font(.headline)
                Text(text(history, "account")).lineSpacing(5)
                Text(text(history, "distinction")).font(.subheadline).lineSpacing(5)
                ForEach(Array(history.records("sources").enumerated()), id: \.offset) { _, source in
                    if let url = URL(string: source.text("url")) { Link(source.text("title"), destination: url) }
                    Text(source.text("locator")).font(.footnote)
                }
            }.padding(.top, 12)
        }.accessibilityIdentifier("council-sources")
    }
}
