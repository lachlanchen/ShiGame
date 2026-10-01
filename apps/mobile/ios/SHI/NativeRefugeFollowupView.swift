import SwiftUI

struct NativeRefugeFollowupView: View {
    @StateObject private var session: RefugeFollowupSession
    @Environment(\.dismiss) private var dismiss
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selected = ""
    @State private var confirmRestart = false
    private let ink = Color(red: 0.07, green: 0.10, blue: 0.12)
    private let paper = Color(red: 0.93, green: 0.89, blue: 0.79)
    private let gold = Color(red: 0.84, green: 0.69, blue: 0.39)
    private let speakers = ["keeper": "掌简人", "householder": "屋主", "traveller": "过路人", "stranger": "来者"]
    init(origin: RefugeContinuationEngine, fingerprints: [String: String], story: Data) {
        _session = StateObject(wrappedValue: RefugeFollowupSession(origin: origin, fingerprints: fingerprints, story: story))
    }
    private func lines(_ values: [Record]) -> some View {
        ForEach(Array(values.enumerated()), id: \.offset) { _, line in
            Text((speakers[line.text("speaker")].map { $0 + "：" } ?? "") + line.text("text"))
                .lineSpacing(7).fixedSize(horizontal: false, vertical: true)
        }
    }
    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        if let engine = session.engine {
                            Text(engine.completed ? engine.definition.text("title") : engine.scene.text("title"))
                                .font(.system(.largeTitle, design: .serif)).accessibilityAddTraits(.isHeader)
                                .id("followup-top").accessibilityFocused($headingFocused)
                            Text("开发试玩 · 简体中文 · 原创戏剧重构。Not a release build.").font(.footnote)
                            if session.needsRecovery {
                                Text("存档不兼容或已损坏，原文件保留。确认重开这次相遇前不能继续。")
                                    .accessibilityIdentifier("followup-recovery")
                            } else if session.error != nil {
                                Text("未能保存，行动尚未确认。请保留选择并重试。")
                                    .accessibilityIdentifier("followup-save-error")
                            }
                            if let order = engine.order {
                                VStack(alignment: .leading, spacing: 16) {
                                    Text(engine.presentation(order).text("title")).font(.title2)
                                    Text("行动已保存").font(.caption)
                                    lines(engine.presentation(order).records("response"))
                                    if order == "share-ration" && engine.origin.promise == "broken" {
                                        Text(engine.definition.text("brokenPromiseResponse")).lineSpacing(7)
                                    }
                                    Text(engine.definition.text("ending")).lineSpacing(7)
                                }.accessibilityElement(children: .contain).accessibilityIdentifier("followup-response")
                            } else { decision(engine) }
                            position(engine)
                            DisclosureGroup("史料与戏剧重构") { Text(engine.definition.text("boundary")).lineSpacing(6) }
                            Button("重开这次相遇…") { confirmRestart = true }
                                .frame(minHeight: 44).accessibilityIdentifier("followup-restart")
                        } else { Text("无法验证续章内容，已有存档未被改动。").accessibilityIdentifier("followup-content-error") }
                    }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("followup-scene").onAppear { headingFocused = true }
                    .onChange(of: session.engine?.order) { _ in
                        selected = ""; proxy.scrollTo("followup-top", anchor: .top); headingFocused = true
                    }
            }.background(ink).foregroundStyle(paper)
                .toolbar { ToolbarItem(placement: .confirmationAction) {
                    Button("回看问讯") { dismiss() }.frame(minHeight: 44).accessibilityIdentifier("followup-close")
                } }
                .toolbarBackground(ink, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
                .alert("替换这次相遇的决定？", isPresented: $confirmRestart) {
                    Button("确认重开", role: .destructive) { session.restart() }.accessibilityIdentifier("followup-confirm-restart")
                    Button("取消", role: .cancel) { }
                } message: { Text("只重开这次相遇。此前的退走、借宿、补漏和问讯记录不变。损坏或不兼容的原文件会先保留副本。") }
        }.environment(\.locale, Locale(identifier: "zh-Hans")).environment(\.layoutDirection, .leftToRight)
            .tint(gold).preferredColorScheme(.dark)
    }
    private func decision(_ engine: RefugeFollowupEngine) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            lines(engine.scene.records("lines"))
            if engine.origin.message != "not-entrusted" {
                Text(engine.definition.object("messageMemory").text(engine.origin.message)).lineSpacing(7)
            }
            Text(engine.definition.text("decisionContext")).lineSpacing(7)
            ForEach(engine.choices, id: \.idValue) { item in
                let id = item.text("id"), choice = engine.presentation(id)
                Button { selected = id } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(choice.text("title")).font(.headline)
                        Text(choice.text("intent")).font(.subheadline)
                        if !engine.canChoose(id) { Text("没有可支配公粮，不能许出欠粮或别人的粮。仍可陪来者问船。").font(.footnote) }
                    }.frame(maxWidth: .infinity, alignment: .leading).padding(16)
                        .background(selected == id ? gold.opacity(0.22) : Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).disabled(session.needsRecovery || !engine.canChoose(id))
                    .accessibilityIdentifier("followup-offer-" + id).accessibilityAddTraits(selected == id ? .isSelected : [])
            }
            if let preview = try? engine.preview(selected) {
                Text("可支配公粮：\(engine.grain) → \(preview.grain)。" + (selected == "share-ration" ? "来者今夜有落脚处；错过末班渡船的查问。" : "来者有人陪同问船；今晚的食宿仍待解决。"))
                    .accessibilityIdentifier("followup-preview")
                Button("确认行动") { session.choose(selected) }.buttonStyle(.borderedProminent).foregroundStyle(ink)
                    .frame(minHeight: 48).disabled(session.needsRecovery).accessibilityIdentifier("followup-commit")
            }
        }
    }
    private func position(_ engine: RefugeFollowupEngine) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("可支配公粮：\(engine.grain)").monospacedDigit().accessibilityIdentifier("followup-grain")
            ForEach(engine.origin.debts, id: \.id) { debt in Text("未偿粮债：\(debt.creditor)，\(debt.grain) 份。") }
            if engine.origin.promise == "broken" { Text("补漏失约仍在，帮助来者不会替你补上那处屋顶。") }
            if engine.origin.disclosure == "identifying-record" { Text("此前出示的身份信息不能收回，听过的人仍知道它。") }
            Text("来者尚未确认为旧同伴。记录去向与此前粮债不变。")
        }.font(.footnote).accessibilityElement(children: .contain).accessibilityIdentifier("followup-position")
    }
}
