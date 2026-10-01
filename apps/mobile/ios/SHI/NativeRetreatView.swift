import SwiftUI

/// Explicit development entry; no implicit production-resource loading.
struct NativeRetreatView: View {
    @StateObject private var session: RetreatSession
    @Environment(\.dismiss) private var dismiss
    @AccessibilityFocusState private var headingFocused: Bool
    @State private var selectedID = ""
    @State private var confirmRestart = false
    private let metrics = ["grain": "粮秣", "tempo": "行动余裕", "city": "民间支持", "allies": "诸部支持", "veterans": "军中支持"]
    private let speakers = ["keeper": "掌简人", "supply-officer": "催粮军吏", "yu-mu": "妪母", "qin-courier": "韩驿使", "wounded-soldier": "伤卒", "partner-steward": "邻部管事", "rear-guard": "守路士卒", "granary-holder": "粮主", "han-letter": "韩驿使来简"]

    init(entry: RetreatEntry, rulesData: Data?, storyData: Data?, saveURL: URL? = nil) {
        _session = StateObject(wrappedValue: RetreatSession(entry: entry, rulesData: rulesData, storyData: storyData, saveURL: saveURL))
    }
    private func outcomeTitle(_ id: String) -> String {
        id == "scattered" ? session.definition.object("scattered").localized("title", "zh-Hans") : session.story.object("endings").object(id).text("title")
    }
    private func prose(_ lines: [Record]) -> some View {
        ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
            Text((speakers[line.text("speaker")].map { $0 + "：" } ?? "") + line.text("text"))
                .lineSpacing(7).fixedSize(horizontal: false, vertical: true)
        }
    }
    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        Text(session.story.text("title")).font(.system(.largeTitle, design: .serif))
                            .accessibilityAddTraits(.isHeader).accessibilityFocused($headingFocused).id("retreat-top")
                        Text("开发试玩 · 简体中文 · 原创戏剧重构。Chinese-language development preview. Not a release build.").font(.footnote)
                        if session.resumedEarlierProse {
                            Text("故事文字已修订，你的决定与物资不变。正在按原进度阅读新版文字；确认下一项行动后才会更新存档版本。")
                                .font(.footnote).accessibilityIdentifier("retreat-prose-revision")
                        }
                        if let engine = session.engine {
                            let presentation = RetreatPresentation(story: session.story, engine: engine, reading: session.response != nil)
                            if session.needsRecovery { notice("存档不兼容或已损坏，原文件已保留。确认重开前不能提交命令，此前章节不变。") }
                            else if session.error != nil { notice("未能保存，命令尚未确认。存储恢复后请重试。") }
                            if let response = session.response { reaction(engine, presentation, response) }
                            else if let outcome = engine.outcome { conclusion(engine, presentation, outcome) }
                            else { decision(engine, presentation) }
                            if session.response == nil || !engine.debts.isEmpty || !presentation.witnessed.isEmpty {
                                position(engine, presentation)
                            }
                            DisclosureGroup("史料与开发说明") {
                                Text("参考《资治通鉴》卷七、卷八。对白、地方行动与分支结局均为原创戏剧重构。粮秣与支持数值承接议事所得的组织能力，不表示北方粮仓搬到了陈地。")
                                    .lineSpacing(4).accessibilityIdentifier("retreat-source-boundary")
                                Text(presentation.evidenceScene.text("transition")).lineSpacing(5)
                                Text(session.story.object("viewpoint").text("historyBoundary")).lineSpacing(5)
                                ForEach(presentation.evidenceScene.strings("sourceIds"), id: \.self) { id in
                                    let source = session.story.object("sources").object(id)
                                    Text("\(source.text("work"))卷\(source.int("volume")) · \(source.text("anchor"))。\(source.text("supports"))")
                                }
                                if engine.completed { Text(presentation.ending.text("unresolved")) }
                                Text(session.story.text("boundary"))
                            }.font(.footnote).accessibilityIdentifier("retreat-source-notes")
                            Button("重开本段…") { confirmRestart = true }.buttonStyle(.bordered)
                                .frame(minHeight: 44).accessibilityIdentifier("retreat-retry")
                        } else { notice("无法打开本段故事。已有存档未被改动。") }
                    }.padding(24).frame(maxWidth: 820, alignment: .leading).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("retreat-scene")
                    .onAppear { headingFocused = true }
                    .onChange(of: session.phaseID) { _ in
                        selectedID = ""; proxy.scrollTo("retreat-top", anchor: .top); headingFocused = true
                    }
            }.background(ink).foregroundStyle(parchment)
                .toolbar { ToolbarItem(placement: .confirmationAction) {
                    Button("返回范阳") { dismiss() }.frame(minHeight: 44).accessibilityIdentifier("retreat-close")
                } }
                .toolbarBackground(ink, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
                .alert("替换本段开发存档？此前章节不变。", isPresented: $confirmRestart) {
                    Button("确认重开", role: .destructive) { session.restart() }.accessibilityIdentifier("retreat-confirm-restart")
                    Button("取消", role: .cancel) { }.accessibilityIdentifier("retreat-cancel-restart")
                }
        }.environment(\.locale, Locale(identifier: "zh-Hans")).environment(\.layoutDirection, .leftToRight)
            .tint(gold).preferredColorScheme(.dark)
    }
    private func notice(_ text: String) -> some View {
        Text(text).padding(16).background(Color.red.opacity(0.16), in: RoundedRectangle(cornerRadius: 12)).accessibilityIdentifier("retreat-error")
    }
    private func changes(_ before: Resources, _ after: Resources) -> some View {
        ForEach(CouncilEngine.metricKeys, id: \.self) { key in
            Text("\(metrics[key]!)  \(before[key, default: 0]) → \(after[key, default: 0])").monospacedDigit()
        }
    }
    @ViewBuilder private func decision(_ engine: RetreatEngine, _ presentation: RetreatPresentation) -> some View {
        let scene = presentation.scene
        let offer = scene.records("choices").first { $0.text("id") == selectedID } ?? scene.records("choices").first ?? [:]
        Text("\(engine.history.count + 1) / \(session.story.records("scenes").count)").font(.caption).foregroundStyle(gold)
        Text(scene.text("title")).font(.title2).accessibilityAddTraits(.isHeader)
        if engine.history.isEmpty {
            Text(session.story.object("viewpoint").text("title")).font(.headline)
            Text(session.story.object("viewpoint").text("text")).lineSpacing(5)
        }
        Text(scene.text("setting")).font(.subheadline)
        prose(presentation.sceneLines)
        ForEach(scene.records("choices"), id: \.idValue) { item in
            Button { selectedID = item.text("id") } label: {
                HStack(alignment: .top) {
                    Image(systemName: item.text("id") == offer.text("id") ? "largecircle.fill.circle" : "circle").accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 8) {
                        Text(item.text("title"))
                        if !engine.canChoose(item) { Text("条件未满足，可查看原因").font(.caption) }
                    }
                    Spacer(minLength: 0)
                }.multilineTextAlignment(.leading).padding(16).frame(maxWidth: .infinity, minHeight: 52)
                    .background(gold.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
            }.buttonStyle(.plain).disabled(session.needsRecovery)
                .accessibilityAddTraits(item.text("id") == offer.text("id") ? [.isSelected] : [])
                .accessibilityIdentifier("retreat-offer-" + item.text("id"))
        }
        if let preview = try? engine.inspect(offer.text("id")) {
            VStack(alignment: .leading, spacing: 16) {
                Text(offer.text("title")).font(.headline)
                Text(offer.text("intent")).lineSpacing(5)
                Text(session.definition.object("explanationsZh").text(offer.text("id"))).lineSpacing(5)
                ForEach(Array(preview.answers.enumerated()), id: \.offset) { _, answer in
                    Text(session.definition.object("answerExplanationsZh").text(answer.text("afterChoice"))).foregroundStyle(gold)
                }
                if !preview.prerequisiteMet { Text("此前撤离时没有选择护送家户，因此现在不能组织这次共同等待。可查看其他去向；当前命令不会改写那次撤离。") }
                ForEach(preview.requirements.filter { $0.required > 0 }) { check in
                    Text("\(metrics[check.id]!)：\(check.value) / 需要 \(check.required) \(check.met ? "✓" : "还缺 \(check.required - check.value)")")
                }
                ForEach(preview.maximums.keys.sorted(), id: \.self) { key in
                    Text("要求借粮前\(metrics[key] ?? key) ≤ \(preview.maximums[key]!)（当前 \(engine.metrics[key, default: 0])）")
                }
                if let debt = preview.newDebt { Text("新欠本地粮主：\(debt.grain) 份粮秣。分行或去名不会销账。") }
                if let after = preview.after { changes(engine.metrics, after) }
                if let outcome = preview.outcome {
                    Text("预计结果：" + outcomeTitle(outcome)).foregroundStyle(gold)
                        .accessibilityIdentifier("retreat-preview").accessibilityValue(outcome)
                    if outcome == "scattered" { Text(session.definition.object("scattered").localized("reaction", "zh-Hans")) }
                }
                if !preview.available && !session.needsRecovery {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("这条路暂时走不通。你仍可查看其他命令；查看不会下令，也不会改变此前的约定。")
                        ForEach(presentation.feasibleChoices, id: \.idValue) { alternative in
                            Button("查看：" + alternative.text("title")) { selectedID = alternative.text("id") }
                                .frame(minHeight: 44)
                                .accessibilityIdentifier("retreat-alternative-" + alternative.text("id"))
                        }
                    }.accessibilityIdentifier("retreat-available-alternatives")
                }
                Button("确认命令") { session.choose(offer.text("id")) }.buttonStyle(.borderedProminent).foregroundStyle(ink)
                    .frame(minHeight: 48).disabled(session.needsRecovery || !preview.available).accessibilityIdentifier("retreat-commit")
            }.padding(20).background(gold.opacity(0.07), in: RoundedRectangle(cornerRadius: 14))
        }
    }
    private func reaction(_ engine: RetreatEngine, _ presentation: RetreatPresentation, _ response: RetreatResponse) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(presentation.lastChoice.text("title")).font(.title2).accessibilityAddTraits(.isHeader)
            VStack(alignment: .leading, spacing: 16) { prose(presentation.responseLines) }
                .accessibilityElement(children: .contain).accessibilityIdentifier("retreat-response")
            ForEach(Array(presentation.promiseAnswers.enumerated()), id: \.offset) { _, answer in
                Text(answer).foregroundStyle(gold).lineSpacing(5)
            }
            DisclosureGroup("局势的变化") {
                changes(engine.history[response.index].before, engine.history[response.index].after)
            }.accessibilityIdentifier("retreat-response-changes")
            Button("继续") { session.continueResponse(response.id) }.buttonStyle(.borderedProminent).foregroundStyle(ink)
                .frame(minHeight: 48).accessibilityIdentifier("retreat-continue")
        }
    }
    private func conclusion(_ engine: RetreatEngine, _ presentation: RetreatPresentation, _ outcome: String) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(outcomeTitle(outcome)).font(.title).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("retreat-outcome").accessibilityValue(outcome)
            prose(presentation.endingLines)
            if outcome == "scattered" { Text(session.definition.object("scattered").localized("recovery", "zh-Hans")) }
            Text(session.story.text("epilogue")).font(.footnote)
            Text("本卷开发段落到此结束。后续尚未开放。")
            Text("物资归属：" + (engine.resourceCustody == "common" ? "现存队伍" : engine.resourceCustody == "groups" ? "分行各组，不再是公共库存" : "未明，不能重复调拨"))
            DisclosureGroup("回看这一路的决定") {
                VStack(alignment: .leading, spacing: 16) {
                    Text("这里只记录已经确认的行动与当时的变化，不代表失散者已经归来，也不替你判定哪条路最好。")
                    ForEach(presentation.decisionRecord) { record in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(record.title).font(.headline).accessibilityAddTraits(.isHeader)
                            Text(record.explanation).lineSpacing(5)
                            DisclosureGroup("这道命令的回应 · 戏剧重构") { prose(record.responseLines) }
                                .accessibilityIdentifier("retreat-recorded-response-" + record.id)
                            ForEach(record.changedKeys, id: \.self) { key in
                                Text("\(metrics[key]!): \(record.before[key, default: 0]) → \(record.after[key, default: 0])").monospacedDigit()
                            }
                            if record.changedKeys.isEmpty {
                                Text("本次未改变这五项数值；已作出的承诺与记录仍然保留。")
                            }
                        }.accessibilityElement(children: .contain)
                            .accessibilityIdentifier("retreat-record-" + record.id)
                    }
                }.padding(.top, 8)
            }
            Button("返回范阳") { dismiss() }.buttonStyle(.bordered).frame(minHeight: 44)
        }
    }
    private func position(_ engine: RetreatEngine, _ presentation: RetreatPresentation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(session.response == nil ? "当前局势" : "已确认的约定与往来").font(.headline)
            if session.response == nil {
                ForEach(CouncilEngine.metricKeys, id: \.self) { key in Text("\(metrics[key]!): \(engine.metrics[key, default: 0]) / 10").monospacedDigit() }
            }
            if !engine.debts.isEmpty {
                Text("未偿之约").font(.headline)
                ForEach(engine.debts, id: \.id) { debt in Text("欠本地粮主 \(debt.grain) 份粮秣；粮主另持欠契，分行不表示免责。") }
            }
            if !presentation.witnessed.isEmpty {
                Text("已核实的往来").font(.headline)
                ForEach(presentation.witnessed, id: \.idValue) { event in Text(event.text("observation")) }
            }
        }
    }
}
