import SwiftUI

/// Shared authored Chinese scenes, confined to explicitly supplied QA content.
struct NativeRefugeView: View {
    @StateObject private var session: RefugeContinuationSession
    @Environment(\.dismiss) private var dismiss
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selectedID = ""
    @State private var confirmRestart = false
    @State private var showFollowup = false
    private let followup: Data?
    private let ink = Color(red: 0.07, green: 0.10, blue: 0.12)
    private let paper = Color(red: 0.93, green: 0.89, blue: 0.79)
    private let gold = Color(red: 0.84, green: 0.69, blue: 0.39)
    private let speakers = ["keeper": "掌简人", "householder": "屋主", "traveller": "过路人"]

    init(retreat: RetreatEngine, content: [String: Data], saveURL: URL? = nil, followup: Data? = nil) {
        self.followup = followup
        _session = StateObject(wrappedValue: RefugeContinuationSession(retreat: retreat, content: content, saveURL: saveURL))
    }
    private func lines(_ records: [Record]) -> some View {
        ForEach(Array(records.enumerated()), id: \.offset) { _, line in
            Text((speakers[line.text("speaker")].map { $0 + "：" } ?? "") + line.text("text"))
                .lineSpacing(7).fixedSize(horizontal: false, vertical: true)
        }
    }
    private func definition(_ engine: RefugeContinuationEngine, phase: Int) -> Record {
        phase == 0 ? session.story : phase == 1 ? engine.morningDefinition : engine.contactDefinition
    }
    private func scene(_ engine: RefugeContinuationEngine, phase: Int) -> Record {
        phase == 2 ? engine.contactDefinition.object("scenes").object(engine.location) : definition(engine, phase: phase)
    }
    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        if let engine = session.engine {
                            let phase = session.response?.index ?? engine.orders.count
                            let current = scene(engine, phase: min(phase, 2))
                            Text(engine.completed && session.response == nil ? "这一段留下的约定" : current.text("title"))
                                .font(.system(.largeTitle, design: .serif)).accessibilityAddTraits(.isHeader)
                                .id("refuge-top").accessibilityFocused($headingFocused)
                            Text("开发试玩 · 简体中文 · 原创戏剧重构。Not a release build.").font(.footnote)
                            if session.needsRecovery {
                                Text("存档不兼容或已损坏，原文件未被改动。确认重开前不能继续。")
                                    .accessibilityIdentifier("refuge-recovery")
                            } else if session.error != nil {
                                Text("未能保存，这项行动尚未确认。请保留当前选择并重试。")
                                    .accessibilityIdentifier("refuge-save-error")
                            }
                            if let response = session.response {
                                reaction(engine, response)
                            } else if engine.completed {
                                Text(engine.contactDefinition.text("continuation")).lineSpacing(6)
                                    .accessibilityIdentifier("refuge-complete")
                                if followup != nil {
                                    Button("沿着留下的线索继续") { showFollowup = true }
                                        .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48)
                                        .disabled(session.needsRecovery).accessibilityIdentifier("followup-enter")
                                }
                            } else {
                                decision(engine, phase: phase, current: current)
                            }
                            position(engine)
                            DisclosureGroup("史料与戏剧重构") {
                                Text(definition(engine, phase: min(phase, 2)).text("boundary")).lineSpacing(5)
                                let source = session.story.object("sourceReadback")
                                Text("\(source.text("work"))卷\(source.int("volume"))，本地校读行\(source.int("startLine"))–\(source.int("endLine"))。\(source.text("supports"))")
                                    .accessibilityIdentifier("refuge-source-boundary")
                            }.font(.footnote)
                            Button("重开这一夜及后续…") { confirmRestart = true }
                                .frame(minHeight: 44).accessibilityIdentifier("refuge-restart")
                        } else {
                            Text("无法打开续章。已有存档未被改动。")
                                .accessibilityIdentifier("refuge-content-error")
                        }
                    }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("refuge-scene")
                    .onAppear { headingFocused = true }
                    .onChange(of: session.phaseID) { _ in
                        selectedID = ""; proxy.scrollTo("refuge-top", anchor: .top); headingFocused = true
                    }
            }.background(ink).foregroundStyle(paper)
                .toolbar { ToolbarItem(placement: .confirmationAction) {
                    Button("返回退走记录") { dismiss() }.frame(minHeight: 44).accessibilityIdentifier("refuge-close")
                } }
                .toolbarBackground(ink, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
                .alert("替换这一夜及后续存档？", isPresented: $confirmRestart) {
                    Button("确认重开", role: .destructive) { session.restart() }
                        .accessibilityIdentifier("refuge-confirm-restart")
                    Button("取消", role: .cancel) { }
                } message: { Text("从原来的退走结局重新开始这一夜。此前章节、粮债和凭记去向不变；不兼容或损坏的原文件会先保留副本。") }
        }.fullScreenCover(isPresented: $showFollowup) {
            if let engine = session.engine, engine.completed, session.response == nil, !session.needsRecovery, let followup {
                NativeRefugeFollowupView(origin: engine, fingerprints: session.fingerprints, story: followup)
            }
        }.environment(\.locale, Locale(identifier: "zh-Hans")).environment(\.layoutDirection, .leftToRight)
            .tint(gold).preferredColorScheme(.dark)
    }
    @ViewBuilder private func decision(_ engine: RefugeContinuationEngine, phase: Int, current: Record) -> some View {
        Text("\(phase + 1) / 3").font(.caption).foregroundStyle(gold)
        if phase == 0 { Text(current.text("setting")); lines(current.records("lines")) }
        if phase == 1 {
            Text(current.object("nightMemory").text(engine.orders[0])).lineSpacing(5)
            lines(current.records("opening"))
        }
        if phase == 2 {
            Text(engine.contactDefinition.object("recordMemory").text(engine.records)).lineSpacing(5)
            lines(current.records("lines"))
        }
        let authored = definition(engine, phase: phase).records("choices")
        ForEach(engine.choices, id: \.idValue) { rule in
            let id = rule.text("id"), choice = authored.first { $0.text("id") == id } ?? [:]
            let available = engine.canChoose(id)
            Button { selectedID = id } label: {
                VStack(alignment: .leading, spacing: 8) {
                    Text(choice.text("title")).font(.headline)
                    Text(choice.text("intent")).font(.subheadline)
                    if !available {
                        Text(phase == 0 ? "现有公共粮秣不足；不能支用已分出或归属未明的粮。" : "现有凭记不在你手里，不能取出或抄写。")
                            .font(.footnote)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading).padding(16)
                    .background(selectedID == id ? gold.opacity(0.22) : Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
            }.buttonStyle(.plain).disabled(!available || session.needsRecovery)
                .accessibilityIdentifier("refuge-offer-" + id)
                .accessibilityAddTraits(selectedID == id ? .isSelected : [])
        }
        if let choice = authored.first(where: { $0.text("id") == selectedID }), engine.canChoose(selectedID) {
            Text("确认前：" + choice.text("intent")).lineSpacing(5).accessibilityIdentifier("refuge-preview")
            Button("确认这项行动") { session.choose(selectedID) }
                .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48)
                .disabled(session.needsRecovery).accessibilityIdentifier("refuge-commit")
        }
    }
    private func reaction(_ engine: RefugeContinuationEngine, _ response: RetreatResponse) -> some View {
        let authored = definition(engine, phase: response.index)
        let choice = authored.records("choices").first { $0.text("id") == engine.orders[response.index] } ?? [:]
        return VStack(alignment: .leading, spacing: 16) {
            Text("行动已保存").font(.caption).accessibilityIdentifier("refuge-saved")
            lines(choice.records("response"))
            if response.index == 1 { lines(engine.morningDefinition.object("promiseResponses")[engine.promise] as? [Record] ?? []) }
            Button(engine.completed ? "查看留下的约定" : "继续") { session.continueResponse(response.id) }
                .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 48)
                .disabled(session.needsRecovery).accessibilityIdentifier("refuge-continue")
        }.accessibilityElement(children: .contain).accessibilityIdentifier("refuge-response")
    }
    private func position(_ engine: RefugeContinuationEngine) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("仍可支配的公粮：\(engine.grain)").monospacedDigit()
            if !engine.orders.isEmpty {
                Text(engine.rested ? "借到一夜休息。" : "这一夜不算充分恢复精力。")
            }
            if engine.orders.count >= 2 {
                let labels = engine.morningDefinition.object("outcomeLabels")
                Text(labels.object("promise").text(engine.promise))
                // The morning's pending-message wording becomes stale once the
                // household has actually accepted a message. Use the contact
                // outcome below, without inventing successful delivery.
                if !engine.completed || engine.location != "household" {
                    Text(labels.object("contact").text(engine.localContact))
                }
            }
            if engine.completed {
                Text(engine.contactDefinition.object("outcomeLabels").text(engine.location == "household" ? engine.message : engine.evidence))
            }
            ForEach(engine.debts, id: \.id) { debt in Text("未偿粮债：\(debt.creditor)，\(debt.grain) 份。") }
            Text("失散者去向仍未证实；一次留话或问讯不代表重逢。粮债不会因交谈消失。")
        }.font(.footnote).accessibilityIdentifier("refuge-position")
    }
}
