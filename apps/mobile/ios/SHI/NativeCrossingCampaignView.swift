import SwiftUI

struct NativeCrossingPreviewRoot: View {
    private let loaded = Result { try CrossingPreviewContent.load() }
    var body: some View {
        switch loaded {
        case .success(let content): NativeCrossingCampaignView(content: content)
        case .failure(let error): Text(error.localizedDescription).padding().accessibilityIdentifier("crossing-content-error")
        }
    }
}

private struct CrossingSelection: Identifiable {
    let id = UUID().uuidString
    let title: String
    let explanation: String
    let event: Record
    let phase: String
}

/// A separate simulator QA route, not a replacement for the released chapter.
/// Every button delegates to the durable session; merely reading a sheet or
/// displaying the map cannot write, advance, or acknowledge a decision.
struct NativeCrossingCampaignView: View {
    @StateObject private var session: CrossingCampaignSession
    @AppStorage("shi.locale") private var language = "en"
    @AppStorage("shi.reduced-motion") private var manualReducedMotion = false
    @Environment(\.accessibilityReduceMotion) private var reducedMotion
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selection: CrossingSelection?
    @State private var confirmRestart = false
    @State private var confirmReplay = false
    @State private var confirmationPhase = ""
    @State private var showingCouncil = false
    private let labels: Record
    private var locale: String { language == "zh-Hans" ? "zh-Hans" : "en" }

    init(content: CrossingCampaignContent) {
        let seed = ProcessInfo.processInfo.environment["SHI_CROSSING_SEED"].flatMap(UInt32.init) ?? UInt32.random(in: .min ... .max)
        _session = StateObject(wrappedValue: CrossingCampaignSession(content: content, seed: seed))
        labels = Bundle.main.url(forResource: "ui", withExtension: "json")
            .flatMap { try? Data(contentsOf: $0) }.flatMap { (try? JSONSerialization.jsonObject(with: $0)) as? Record } ?? [:]
    }
    private func t(_ key: String) -> String { labels.object("ui").object(locale).text(key) }
    private func copy(_ en: String, _ zh: String) -> String { locale == "zh-Hans" ? zh : en }
    private func text(_ record: Record, _ key: String) -> String { record.localized(key, locale) }
    private func metricName(_ key: String) -> String { labels.object("engagementMetrics").object(locale).text(key) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            Text(copy("NATIVE CROSSING · DEVELOPMENT PREVIEW", "原生渡河 · 开发预览"))
                                .font(.caption).foregroundStyle(gold).id("crossing-top")
                            if locale != language { Text("English fallback for this development preview.").font(.footnote) }
                            if let error = session.error { Text(error).foregroundStyle(.orange).accessibilityIdentifier("crossing-save-error") }
                            if session.needsRecovery {
                                Text(copy("Your saved attempt has been preserved. Start a new attempt only after confirming a backup.", "原存档已保留。确认备份后才能开始新的尝试。"))
                            } else if let state = session.state {
                                content(state)
                                DisclosureGroup(t("sources")) {
                                    Text(t("openingNote")).font(.footnote)
                                    ForEach(session.content.campaign.records("sources"), id: \.idValue) { source in
                                        VStack(alignment: .leading, spacing: 8) {
                                            Text(source.text("work") + " · " + source.text("section")).font(.headline)
                                            Text(source.text("locator")).font(.caption)
                                            Text(text(source, "note")).font(.footnote)
                                            Text(source.text("claimStatus")).font(.caption).foregroundStyle(gold)
                                        }
                                    }
                                }.accessibilityIdentifier("crossing-sources")
                                DisclosureGroup(t("record")) {
                                    VStack(alignment: .leading, spacing: 16) {
                                        ForEach(Array(state.engine.history.enumerated()), id: \.offset) { index, turn in
                                            let node = session.content.campaign.records("nodes").first { $0.text("id") == turn.text("nodeId") } ?? [:]
                                            let choice = node.records("choices").first { $0.text("id") == turn.text("choiceId") } ?? [:]
                                            Text("\(index + 1) · " + text(choice, "label")).font(.headline)
                                            metrics(turn["after"] as? Resources ?? [:], keys: resourceKeys, tactical: false)
                                        }
                                        fieldRecord(state)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                    }.accessibilityIdentifier("crossing-reading")
                    .onChange(of: session.phaseID) { _ in
                        proxy.scrollTo("crossing-top", anchor: .top); headingFocused = true
                    }
                }
                if let reaction = session.reaction, !session.needsRecovery {
                    Button(copy("Continue", "继续")) { _ = session.continueReaction(reaction.id) }
                        .buttonStyle(.borderedProminent).foregroundStyle(ink)
                        .frame(minHeight: 44).padding(20).frame(maxWidth: .infinity)
                        .accessibilityIdentifier("crossing-reaction-continue")
                }
            }
            .background(ink).foregroundStyle(parchment).tint(gold)
            .toolbarBackground(ink, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Picker("Language", selection: $language) { Text("English").tag("en"); Text("中文").tag("zh-Hans") }.pickerStyle(.menu)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(t("newGame")) { confirmationPhase = session.phaseID; confirmRestart = true }.accessibilityIdentifier("crossing-new-game")
                }
            }
            .sheet(item: $selection) { selected in
                NavigationStack {
                    VStack(spacing: 0) {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 24) {
                                Text(selected.title).font(.largeTitle)
                                Text(selected.explanation).lineSpacing(6)
                                if let error = session.error { Text(error).foregroundStyle(.orange) }
                            }.padding(24)
                        }.accessibilityIdentifier("crossing-order-reading")
                        Button(copy("Confirm order", "确认命令")) {
                            if session.advance(selected.event, phase: selected.phase) { selection = nil }
                        }.buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 44).padding(24)
                            .accessibilityIdentifier("crossing-issue-order")
                    }.background(ink).foregroundStyle(parchment).tint(gold)
                    .toolbarBackground(ink, for: .navigationBar)
                    .toolbarBackground(.visible, for: .navigationBar)
                    .toolbar { Button(t("close")) { selection = nil } }
                }
            }
            .confirmationDialog(t("newGame"), isPresented: $confirmRestart, titleVisibility: .visible) {
                Button(t("restart"), role: .destructive) {
                    _ = session.restart(confirmed: true, seed: 0, phase: confirmationPhase)
                }.accessibilityIdentifier("crossing-confirm-restart")
            } message: { Text(copy("This replaces only the development crossing save. Unreadable saves are backed up first.", "只替换开发版渡河存档。无法读取的存档会先行备份。")) }
            .sheet(isPresented: $confirmReplay) {
                VStack(alignment: .leading, spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            Text(copy("Reconsider the crossing?", "重新考虑渡河？")).font(.system(.largeTitle, design: .serif))
                                .accessibilityAddTraits(.isHeader)
                            Text(copy("Replace this failed attempt, keeping the opening and the same field conditions.", "替换这次失败的尝试，保留开局选择与相同的战场条件。"))
                                .lineSpacing(6)
                            if let error = session.error { Text(error).foregroundStyle(.orange) }
                        }.padding(24).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    VStack(spacing: 16) {
                        Button(copy("Keep this attempt", "保留这次尝试")) { confirmReplay = false }
                            .buttonStyle(.bordered).frame(minHeight: 44).accessibilityIdentifier("crossing-cancel-replay")
                        Button(copy("Replay from the crossing", "从渡河处重试")) {
                            if session.reconsiderFailure(confirmed: true, phase: confirmationPhase) { confirmReplay = false }
                        }.buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 44)
                            .accessibilityIdentifier("crossing-confirm-replay")
                    }.padding(24).frame(maxWidth: .infinity)
                }.background(ink.ignoresSafeArea()).foregroundStyle(parchment).tint(gold)
            }
            .fullScreenCover(isPresented: $showingCouncil) {
                if let state = session.state, session.councilEntry != nil {
                    NativeCouncilView(origin: state.engine, locale: locale, campaignFingerprint: session.content.rules.text("campaignSha256"))
                }
            }
        }.environment(\.layoutDirection, .leftToRight)
    }

    @ViewBuilder private func content(_ state: CrossingCampaignEngine) -> some View {
        let phase = session.phaseID
        if let reaction = session.reaction {
            reactionView(reaction, state: state)
        } else if let battle = state.engagement {
            heading(text(session.content.engagement, "title"))
            if battle.history.isEmpty && !battle.completed { NativeCrossingEstablishing(locale: locale) }
            if let field = CrossingFieldPresentation.bundled {
                NativeCrossingField(definition: field, metrics: battle.metrics, labels: labels, locale: locale,
                                    reducedMotion: reducedMotion || manualReducedMotion)
            }
            metrics(battle.metrics, keys: EngagementEngine.metricKeys, tactical: true)
            if battle.completed {
                let outcome = session.content.engagement.records("outcomes").first { $0.text("id") == battle.outcomeID } ?? [:]
                Text(text(outcome, "title")).font(.title2)
                Text(text(outcome, "summary")).lineSpacing(6)
                Button(copy("See what this crossing changed", "看看这次渡河改变了什么")) {
                    _ = session.advance(["kind": "finish-crossing"], phase: phase)
                }.buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 44).accessibilityIdentifier("crossing-finish")
            } else {
                let pulse = session.content.engagement.records("pulses")[battle.pulseIndex]
                Text(text(pulse, "title")).font(.title2).accessibilityIdentifier("crossing-pulse")
                Text(text(pulse, "objective")).lineSpacing(6)
                ForEach(battle.availableCommands, id: \.idValue) { command in
                    order(title: text(command, "title"), explanation: text(command, "intent") + "\n\n" + effects(command.object("effects"), tactical: true),
                          event: ["kind": "crossing-command", "commandId": command.text("id")], phase: phase, id: command.text("id"))
                }
                if battle.history.isEmpty {
                    Button(copy("Change the plan before issuing an order", "下令前更换方案")) {
                        _ = session.advance(["kind": "cancel-crossing"], phase: phase)
                    }.frame(minHeight: 44).accessibilityIdentifier("crossing-cancel-plan")
                }
            }
        } else if state.engine.completed {
            heading(t(state.engine.failure == nil ? "complete" : "failed"))
            metrics(state.engine.resources, keys: resourceKeys, tactical: false)
            let ending = state.engine.ending == "wildfire" ? "endingWildfire" : state.engine.ending == "deep-roots" ? "endingRoots" : "endingWatchful"
            Text(t(state.engine.failure ?? ending)).font(.title2)
            Text(t((state.engine.failure ?? ending) + "Text")).lineSpacing(6)
            if session.councilEntry != nil {
                Button(CouncilContent.definition.object("labels").localized("enter", locale)) { showingCouncil = true }
                    .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 44).accessibilityIdentifier("crossing-council-enter")
            } else if state.engine.failure != nil {
                Button(copy("Reconsider the crossing", "重新考虑渡河")) { confirmationPhase = phase; confirmReplay = true }
                    .frame(minHeight: 44).accessibilityIdentifier("crossing-replay")
            }
        } else {
            heading(text(state.engine.node, "title"))
            Text(text(state.engine.node, "dateLabel")).foregroundStyle(gold)
            NativeWarTable(sites: session.content.campaign.records("sites"), activeSite: state.engine.node.text("siteId"), reducedMotion: reducedMotion || manualReducedMotion)
                .frame(height: 180).clipShape(RoundedRectangle(cornerRadius: 18)).accessibilityHidden(true)
            metrics(state.engine.resources, keys: resourceKeys, tactical: false)
            Text(text(state.engine.node, "context")).lineSpacing(6)
            Text(text(state.engine.node, "dialogue")).font(.system(.title3, design: .serif)).lineSpacing(6)
            Text(t("reconstruction")).font(.caption).foregroundStyle(gold)
            Text(text(state.engine.condition, "signal")).lineSpacing(5)
            if let promise = state.engine.commitment { Text(text(promise, "promise")).italic() }
            if state.engine.nodeID == session.content.rules.text("nodeId") {
                Text(copy("Your plan sets the priority. The orders you issue—and the result—decide what you can keep.", "方案决定优先次序，真正的命令与结果才决定你能守住什么。"))
                ForEach(session.content.engagement.records("plans"), id: \.idValue) { plan in
                    let choice = state.engine.choices.first { $0.text("id") == plan.text("id") } ?? [:]
                    order(title: text(plan, "title"), explanation: text(plan, "mainEffort") + "\n\n" + text(plan, "withdrawalCondition") + "\n\n" + effects(plan.object("initialEffects"), tactical: true),
                          event: ["kind": "begin-crossing", "planId": plan.text("id")], phase: phase, id: plan.text("id"))
                        .disabled(!state.engine.canChoose(choice))
                }
            } else {
                ForEach(state.engine.choices, id: \.idValue) { choice in
                    order(title: text(choice, "label"), explanation: text(choice, "intent") + "\n\n" + text(choice, "strategy") + "\n\n" + text(choice.object("pressure"), "warning"),
                          event: ["kind": "decision", "choiceId": choice.text("id")], phase: phase, id: choice.text("id"))
                        .disabled(!state.engine.canChoose(choice))
                }
            }
        }
    }
    private func heading(_ value: String) -> some View {
        Text(value).font(.system(.largeTitle, design: .serif)).accessibilityAddTraits(.isHeader)
            .accessibilityFocused($headingFocused).accessibilityIdentifier("crossing-scene-title")
    }
    private func effects(_ values: Record, tactical: Bool) -> String {
        let keys = tactical ? EngagementEngine.metricKeys : resourceKeys
        return keys.filter { values[$0] != nil }.map { key in
            (tactical ? metricName(key) : t(key)) + ": " + String(format: "%+d", values.int(key))
        }.joined(separator: "\n")
    }
    private func order(title: String, explanation: String, event: Record, phase: String, id: String) -> some View {
        Button { selection = CrossingSelection(title: title, explanation: explanation, event: event, phase: phase) } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack { Text(title).font(.headline); Spacer(); Image(systemName: "arrow.forward").accessibilityHidden(true) }
                Text(explanation.components(separatedBy: "\n\n").first ?? explanation).font(.subheadline).lineSpacing(4)
            }
                .padding(20).frame(maxWidth: .infinity, alignment: .leading).background(gold.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
        }.buttonStyle(.plain).frame(minHeight: 44).accessibilityIdentifier("crossing-order-" + id)
    }
    private func metrics(_ values: Resources, keys: [String], tactical: Bool, before: Resources? = nil) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 125))], alignment: .leading, spacing: 14) {
            ForEach(keys, id: \.self) { key in
                let name = tactical ? metricName(key) : t(key)
                let value = values[key, default: 0]
                let displayed = before.map { "\($0[key, default: 0]) → \(value)" } ?? "\(value)"
                VStack(alignment: .leading, spacing: 5) {
                    Text(name).font(.caption).foregroundStyle(gold).accessibilityHidden(true)
                    Text(displayed).font(.title2.monospacedDigit()).fixedSize(horizontal: false, vertical: true)
                        .accessibilityLabel(name + ": " + displayed).accessibilityIdentifier("crossing-metric-" + key)
                }
            }
        }.padding(18).background(.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
    }
    @ViewBuilder private func fieldRecord(_ state: CrossingCampaignEngine) -> some View {
        let attempts = state.crossings + (state.engagement.map { [$0] } ?? [])
        ForEach(Array(attempts.enumerated()), id: \.offset) { _, attempt in
            let plan = session.content.engagement.records("plans").first { $0.text("id") == attempt.planID } ?? [:]
            Text(text(plan, "title")).font(.title3)
            ForEach(Array(attempt.history.enumerated()), id: \.offset) { index, turn in
                let command = session.content.engagement.records("commands").first { $0.text("id") == turn.text("commandId") } ?? [:]
                VStack(alignment: .leading, spacing: 10) {
                    Text("\(index + 1) · " + text(command, "title")).font(.headline)
                        .accessibilityIdentifier("crossing-record-order-" + turn.text("commandId"))
                    Text(text(command.object("response"), "reveal")).lineSpacing(5)
                }.padding(.vertical, 8)
            }
        }
    }
    @ViewBuilder private func reactionView(_ reaction: CrossingReaction, state: CrossingCampaignEngine) -> some View {
        if reaction.kind == "crossing-command" {
            heading(text(reaction.record.object("command"), "title"))
            Text(text(reaction.record.object("response"), "reveal")).font(.title3).lineSpacing(8)
            metrics(state.engagement?.metrics ?? [:], keys: EngagementEngine.metricKeys, tactical: true,
                    before: reaction.record.object("turn")["before"] as? Resources)
        } else {
            let choice = reaction.record.object("choice")
            heading(text(choice, "label"))
            Text(text(choice, "consequence")).font(.system(.title3, design: .serif)).lineSpacing(8)
            if !reaction.record.object("outcome").isEmpty { Text(text(reaction.record.object("outcome"), "response")).lineSpacing(6) }
            Text(text(choice.object("pressure"), "reveal")).lineSpacing(6)
            metrics(state.engine.resources, keys: resourceKeys, tactical: false,
                    before: state.engine.history.last?["before"] as? Resources)
        }
        Text(t("reconstruction")).font(.caption).foregroundStyle(gold)
    }
}
