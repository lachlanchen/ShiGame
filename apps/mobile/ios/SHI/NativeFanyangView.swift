import SwiftUI

struct NativeFanyangView: View {
    @StateObject private var session: FanyangSession
    @Environment(\.dismiss) private var dismiss
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selectedID = ""
    @State private var confirmRestart = false
    @State private var showRetreat = false
    let locale: String
    private let chapter: CampaignEngine?
    private let council: CouncilEngine
    private let campaignFingerprint: String
    private let councilFingerprint: String

    init(council: CouncilEngine, fingerprint: String, locale: String, chapter: CampaignEngine? = nil, campaignFingerprint: String = "") {
        _session = StateObject(wrappedValue: FanyangSession(council: council, councilFingerprint: fingerprint))
        self.council = council; self.chapter = chapter
        self.campaignFingerprint = campaignFingerprint; self.councilFingerprint = fingerprint
        self.locale = locale == "zh-Hans" ? "zh-Hans" : "en"
    }
    private var retreatEntry: RetreatEntry? {
        guard RetreatPreviewContent.rules != nil, RetreatPreviewContent.story != nil,
              !session.needsRecovery, session.response == nil,
              let chapter, let fanyang = session.engine, fanyang.completed else { return nil }
        return try? RetreatEntry(chapter: chapter, council: council, fanyang: fanyang,
            campaignFingerprint: campaignFingerprint, councilFingerprint: councilFingerprint, fanyangFingerprint: session.fingerprint)
    }
    private func say(_ en: String, _ zh: String) -> String { locale == "zh-Hans" ? zh : en }
    private func text(_ record: Record, _ key: String) -> String { record.localized(key, locale) }
    private func metric(_ key: String) -> String { session.definition.object("metrics").localized(key, locale) }
    private func choice(_ engine: FanyangEngine, _ index: Int) -> Record {
        session.definition.records("rounds")[index].records("choices").first { $0.text("id") == engine.history[index].choiceId } ?? [:]
    }
    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Text(text(session.definition, "title")).font(.system(.largeTitle, design: .serif))
                            .accessibilityAddTraits(.isHeader).accessibilityFocused($headingFocused)
                            .accessibilityIdentifier("fanyang-title").id("fanyang-top")
                        Text(text(session.definition, "boundary")).font(.footnote).lineSpacing(4)
                        if let engine = session.engine {
                            if session.needsRecovery {
                                notice(say("This save is incompatible or damaged. It is preserved. Confirm a restart to replace it; Chen is unchanged.", "存档不兼容或已损坏，原文件已保留。确认重开后才会替换，陈县存档不变。"))
                            } else if session.error != nil {
                                notice(say("Could not save. Your order is not confirmed. Please retry when storage is available.", "未能保存，命令尚未确认。存储恢复后请重试。"))
                            }
                            if let response = session.response { reaction(engine, response) }
                            else if let outcome = engine.outcome { conclusion(outcome) }
                            else { decision(engine) }
                            position(engine)
                            if !engine.history.isEmpty { journal(engine) }
                            Button(say("Restart this scene…", "重开本场景…")) { confirmRestart = true }
                                .buttonStyle(.bordered).frame(minHeight: 44).accessibilityIdentifier("fanyang-retry")
                        } else {
                            notice(say("The continuation could not be opened. Your existing saves have not been changed.", "无法打开续章。已有存档未被改动。"))
                        }
                    }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("fanyang-scene")
                    .onAppear { headingFocused = true }
                    .onChange(of: session.phaseID) { _ in
                        selectedID = ""; proxy.scrollTo("fanyang-top", anchor: .top); headingFocused = true
                    }
            }
            .background(ink).foregroundStyle(parchment)
            .toolbar { ToolbarItem(placement: .confirmationAction) {
                Button(say("Return to Chen", "返回陈县议事")) { dismiss() }.frame(minHeight: 44).accessibilityIdentifier("fanyang-close")
            } }
            .toolbarBackground(ink, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
            .alert(say("Replace this Fan Yang save? Chen will remain unchanged.", "替换范阳存档？陈县议事不会改变。"), isPresented: $confirmRestart) {
                Button(say("Restart Fan Yang", "重开范阳"), role: .destructive) { session.restart() }.accessibilityIdentifier("fanyang-confirm-restart")
                Button(say("Cancel", "取消"), role: .cancel) { }.accessibilityIdentifier("fanyang-cancel-restart")
            }
        }.environment(\.locale, Locale(identifier: locale)).environment(\.layoutDirection, .leftToRight)
            .tint(gold).preferredColorScheme(.dark)
            .fullScreenCover(isPresented: $showRetreat) {
                if let entry = retreatEntry {
                    NativeRetreatView(entry: entry, rulesData: RetreatPreviewContent.rules, storyData: RetreatPreviewContent.story)
                }
            }
    }
    private func notice(_ value: String) -> some View {
        Text(value).padding(16).background(Color.red.opacity(0.16), in: RoundedRectangle(cornerRadius: 12)).accessibilityIdentifier("fanyang-error")
    }
    private func changes(_ before: Resources, _ after: Resources) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(FanyangEngine.metricKeys, id: \.self) { key in
                Text("\(metric(key))  \(before[key, default: 0]) → \(after[key, default: 0])")
                    .monospacedDigit().fixedSize(horizontal: false, vertical: true)
            }
        }
    }
    @ViewBuilder private func decision(_ engine: FanyangEngine) -> some View {
        let offer = engine.choices.first { $0.text("id") == selectedID } ?? engine.choices.first ?? [:]
        Text("\(engine.history.count + 1) / 3").font(.caption).foregroundStyle(gold)
        Text(text(engine.round, "title")).font(.title2).accessibilityAddTraits(.isHeader)
        if engine.history.isEmpty {
            NativeViewpointIntro(scene: "fanyang", locale: locale)
            Text(text(session.definition, "introduction")).lineSpacing(6)
        }
        Text(text(engine.round, "context")).lineSpacing(6)
        ForEach(engine.choices, id: \.idValue) { item in
            Button { selectedID = item.text("id") } label: {
                HStack(alignment: .top) {
                    Image(systemName: item.text("id") == offer.text("id") ? "largecircle.fill.circle" : "circle").accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 8) {
                        Text(text(item, "title"))
                        if !engine.canChoose(item) { Text(say("Requirements not met", "条件尚未满足")).font(.caption) }
                    }
                    Spacer(minLength: 0)
                }.multilineTextAlignment(.leading).padding(16).frame(maxWidth: .infinity, minHeight: 52)
                    .background(gold.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
            }.buttonStyle(.plain).disabled(session.needsRecovery)
                .accessibilityAddTraits(item.text("id") == offer.text("id") ? [.isSelected] : [])
                .accessibilityIdentifier("fanyang-offer-" + item.text("id"))
        }
        VStack(alignment: .leading, spacing: 18) {
            Text(text(offer, "title")).font(.headline)
            Text(text(offer, "intent")).lineSpacing(5)
            ForEach(Array(engine.answers(offer).enumerated()), id: \.offset) { _, answer in Text(text(answer, "text")).foregroundStyle(gold) }
            if !offer.object("requires").isEmpty {
                Text(say("Requires: ", "需要：") + FanyangEngine.metricKeys.filter { offer.object("requires")[$0] != nil }
                    .map { "\(metric($0)) ≥ \(offer.object("requires").int($0))" }.joined(separator: " · "))
            }
            if offer["gateRequired"] as? Bool == true { Text(say("All surrender conditions below must be met.", "必须满足下方全部受降条件。")) }
            if let preview = try? engine.preview(offer.text("id")) {
                changes(engine.metrics, preview.metrics)
                if let outcome = preview.outcome {
                    Text(say("Expected outcome: ", "预计结果：") + text(session.definition.object("outcomes").object(outcome), "title"))
                        .foregroundStyle(gold).accessibilityIdentifier("fanyang-preview").accessibilityValue(outcome)
                } else {
                    DisclosureGroup(say("What remains possible after this order?", "此令之后，还有哪些可能？")) {
                        Text(preview.prospects.contains("opened")
                            ? say("At least one legal sequence can still secure surrender. Later choices and costs matter.", "至少还有一条路线能够受降，后续选择与代价仍然重要。")
                            : say("No remaining sequence in this episode can secure surrender. An orderly withdrawal remains possible.", "本篇余下的选择已无法达成受降，仍可有序退使。"))
                        Text(say("This describes this scene's rules, not historical inevitability or a future episode.", "这只描述本场景规则，不代表历史必然，也不预判下一篇。"))
                    }
                }
            }
            Button(say("Confirm order", "确认命令")) { session.choose(offer.text("id")) }
                .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48)
                .disabled(session.needsRecovery || !engine.canChoose(offer)).accessibilityIdentifier("fanyang-commit")
        }.padding(20).background(gold.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
    }
    private func reaction(_ engine: FanyangEngine, _ response: FanyangResponse) -> some View {
        let offer = choice(engine, response.index), turn = engine.history[response.index]
        return VStack(alignment: .leading, spacing: 20) {
            Text(text(offer, "title")).font(.title2).accessibilityAddTraits(.isHeader)
            Text(text(offer, "response")).font(.title3).lineSpacing(7).accessibilityIdentifier("fanyang-response")
            ForEach(Array(engine.answers(offer).enumerated()), id: \.offset) { _, answer in Text(text(answer, "text")).foregroundStyle(gold) }
            changes(turn.before, turn.after)
            Button(say("Continue", "继续")) { session.continueResponse(response.id) }
                .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48).accessibilityIdentifier("fanyang-continue")
        }
    }
    private func conclusion(_ outcome: String) -> some View {
        let record = session.definition.object("outcomes").object(outcome)
        return VStack(alignment: .leading, spacing: 20) {
            Text(text(record, "title")).font(.title).accessibilityAddTraits(.isHeader).accessibilityIdentifier("fanyang-outcome").accessibilityValue(outcome)
            Text(text(record, "text")).font(.title3).lineSpacing(7)
            if retreatEntry != nil {
                Text(say("Your decisions are saved. Continue as the keeper in Chen. This QA story preview is in Simplified Chinese.", "选择已保存。回到陈地，继续掌简人的故事。此 QA 故事试玩目前仅有简体中文。"))
                Button(say("Continue in Chen · development preview", "回到陈地 · 开发试玩")) { showRetreat = true }
                    .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48).accessibilityIdentifier("retreat-enter")
            } else {
                Text(say("This development episode ends here. Your decisions are saved; the next episode is not available yet.", "本开发篇章到此结束。选择已保存，下一篇尚未开放。"))
            }
            Button(say("Return to Chen", "返回陈县议事")) { dismiss() }.buttonStyle(.bordered).frame(minHeight: 44)
        }
    }
    private func position(_ engine: FanyangEngine) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(say("Your position", "当前局势")).font(.headline)
            ForEach(FanyangEngine.metricKeys, id: \.self) { key in Text("\(metric(key)): \(engine.metrics[key, default: 0]) / 10").monospacedDigit() }
            Text(say("Conditions for surrender", "受降条件")).font(.headline)
            ForEach(engine.gateChecks) { check in Text("\(check.met ? "✓" : "—") \(metric(check.id)): \(check.value) \(check.met ? "≥" : "<") \(check.required)").monospacedDigit() }
        }
    }
    private func journal(_ engine: FanyangEngine) -> some View {
        DisclosureGroup(say("Your decisions at Fan Yang", "范阳决策记录")) {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(engine.history.indices, id: \.self) { index in
                    Text(text(choice(engine, index), "title")).font(.headline)
                    Text(text(choice(engine, index), "response")).lineSpacing(5)
                    ForEach(Array(engine.answers(choice(engine, index)).enumerated()), id: \.offset) { _, answer in Text(text(answer, "text")).foregroundStyle(gold) }
                    changes(engine.history[index].before, engine.history[index].after)
                }
            }.padding(.top, 12)
        }.accessibilityIdentifier("fanyang-journal")
    }
}
