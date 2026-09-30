import SwiftUI
import CryptoKit

struct Chronicle: Codable {
    let version: Int
    let campaignSHA256: String
    let seed: UInt32
    let choices: [String]
    // Absent in legacy saves: preserve their already-acknowledged behavior.
    var pendingAftermath: Bool? = nil
}

struct ChoiceAftermath: Identifiable {
    let id: String
    let response: Record
}

@MainActor final class GameSession: ObservableObject {
    @Published var engine: CampaignEngine?
    @Published var error: String?
    @Published var lastResponse: Record?
    @Published private(set) var aftermath: ChoiceAftermath?
    @Published var needsRecovery = false
    let campaign: Record
    let translations: Record
    let fingerprint: String
    let saveURL: URL
    private var committing = false

    init(saveURL: URL? = nil, initialSeed: UInt32? = nil) {
        self.saveURL = saveURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SHI/chronicle-v1.json")
        do {
            let data = try Data(contentsOf: Bundle.main.url(forResource: "campaign", withExtension: "json")!)
            let parsed = try JSONSerialization.jsonObject(with: data) as! Record
            let labels = try JSONSerialization.jsonObject(with: Data(contentsOf: Bundle.main.url(forResource: "ui", withExtension: "json")!)) as! Record
            campaign = parsed; translations = labels
            fingerprint = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        } catch {
            campaign = [:]; translations = [:]; fingerprint = ""
            self.error = "SHI’s bundled campaign could not be opened. Please reinstall the app without deleting your device backup."
            return
        }
        do {
            if FileManager.default.fileExists(atPath: self.saveURL.path) {
                let save = try JSONDecoder().decode(Chronicle.self, from: Data(contentsOf: self.saveURL))
                guard save.version == 1, save.campaignSHA256 == fingerprint, save.choices.count <= 100 else {
                    throw CampaignError.invalid("This chronicle uses different campaign rules. It has been preserved; contact support before starting a new chronicle.")
                }
                var restored = try CampaignEngine(campaign: campaign, seed: save.seed)
                var response: Record?
                for choice in save.choices { response = try Self.resolveTurn(choice, in: &restored) }
                guard save.pendingAftermath != true || response != nil else {
                    throw CampaignError.invalid("This chronicle has an unread scene but no saved decision. It has been preserved.")
                }
                engine = restored
                lastResponse = response
                if save.pendingAftermath == true, let response {
                    aftermath = ChoiceAftermath(id: UUID().uuidString, response: response)
                }
            } else { engine = try CampaignEngine(campaign: campaign, seed: initialSeed ?? UInt32.random(in: .min ... .max)) }
        } catch { self.error = error.localizedDescription; needsRecovery = true }
    }
    func text(_ key: String, _ locale: String) -> String {
        translations.object("ui").object(locale)[key] as? String ?? translations.object("ui").object("en")[key] as? String ?? key
    }
    func label(_ group: String, _ key: String, _ locale: String) -> String {
        translations.object(group).object(locale)[key] as? String ?? translations.object(group).object("en")[key] as? String ?? key
    }
    private static func resolveTurn(_ id: String, in next: inout CampaignEngine) throws -> Record {
        let priorNode = next.node
        let choice = next.choices.first { $0.text("id") == id } ?? [:]
        let field = next.condition
        let oathOutcome = next.commitment?.records("outcomes").first { $0.text("choiceId") == id }
        let result = try next.choose(id)
        return ["choice": choice, "node": priorNode, "field": field, "turn": result, "outcome": oathOutcome ?? [:]]
    }
    private func save(_ candidate: CampaignEngine, pendingAftermath: Bool = false) throws {
        let save = Chronicle(version: 1, campaignSHA256: fingerprint, seed: candidate.seed, choices: candidate.history.map { $0.text("choiceId") }, pendingAftermath: pendingAftermath)
        try FileManager.default.createDirectory(at: saveURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(save).write(to: saveURL, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
    @discardableResult func choose(_ id: String) -> Bool {
        // Main-actor, synchronous admission: pending presentation blocks both a
        // duplicate order and a different order from the already advanced node.
        guard !committing, aftermath == nil, var next = engine else { return false }
        committing = true
        defer { committing = false }
        do {
            let response = try Self.resolveTurn(id, in: &next)
            try save(next, pendingAftermath: true) // Save the decision and unread scene together.
            engine = next
            lastResponse = response
            aftermath = ChoiceAftermath(id: UUID().uuidString, response: response)
            error = nil
            return true
        } catch { self.error = error.localizedDescription; return false }
    }
    func continueAftermath(_ id: String) {
        // A delayed callback from an earlier scene cannot dismiss a later one.
        guard !committing, aftermath?.id == id, let engine else { return }
        committing = true
        defer { committing = false }
        do {
            try save(engine) // Acknowledge presentation only; no rules are resolved.
            aftermath = nil
            error = nil
        } catch { self.error = error.localizedDescription }
    }
    func restart() {
        guard !committing else { return }
        committing = true
        defer { committing = false }
        do {
            let next = try CampaignEngine(campaign: campaign, seed: UInt32.random(in: .min ... .max))
            // Preserve an unreadable old chronicle before an explicitly confirmed reset.
            if needsRecovery && FileManager.default.fileExists(atPath: saveURL.path) {
                try FileManager.default.copyItem(at: saveURL, to: saveURL.deletingLastPathComponent().appendingPathComponent("preserved-\(UUID().uuidString).json"))
            }
            try save(next); engine = next; needsRecovery = false; error = nil; lastResponse = nil; aftermath = nil
        } catch { self.error = error.localizedDescription }
    }
}

@main struct SHIApp: App {
    @StateObject private var session = GameSession()
    var body: some Scene { WindowGroup { CampaignView().environmentObject(session).preferredColorScheme(.dark) } }
}

let ink = Color(red: 0.065, green: 0.078, blue: 0.07)
let parchment = Color(red: 0.92, green: 0.88, blue: 0.78)
let gold = Color(red: 0.79, green: 0.65, blue: 0.41)

private enum Panel: Identifiable {
    case order(String), sources, chronicle, guide, settings
    var id: String {
        switch self {
        case .order(let id): return "order-" + id
        case .sources: return "sources"
        case .chronicle: return "chronicle"
        case .guide: return "guide"
        case .settings: return "settings"
        }
    }
}

struct CampaignView: View {
    @EnvironmentObject private var session: GameSession
    @Environment(\.accessibilityReduceMotion) private var systemReducedMotion
    @AppStorage("shi.locale") private var locale = "en"
    @AppStorage("shi.reduced-motion") private var reducedMotion = false
    @State private var playing = false
    @State private var panel: Panel?
    @State private var confirmRestart = false
    @State private var showingCouncil = false
    private func t(_ key: String) -> String { session.text(key, locale) }
    private func localized(_ record: Record, _ key: String) -> String { record.localized(key, locale) }

    var body: some View {
        NavigationStack {
            ZStack {
                ink.ignoresSafeArea()
                if let engine = session.engine {
                    if playing, let aftermath = session.aftermath {
                        NativeConsequenceView(aftermath: aftermath, locale: locale)
                            .id(aftermath.id)
                    } else if playing { play(engine) } else { title(engine) }
                } else {
                    VStack(spacing: 24) {
                        Text("SHI / 勢").font(.largeTitle)
                        Text(session.error ?? "Loading…")
                        if session.needsRecovery { Button(t("newGame")) { confirmRestart = true } }
                    }.padding(28)
                }
            }
            .foregroundStyle(parchment)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if playing && session.aftermath == nil { Button { playing = false } label: { Label("SHI", systemImage: "chevron.backward") }.accessibilityIdentifier("return-title") }
                }
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    if session.aftermath == nil {
                        Button { panel = .sources } label: { Image(systemName: "books.vertical") }.accessibilityLabel(t("sources"))
                        Button { panel = .settings } label: { Image(systemName: "slider.horizontal.3") }.accessibilityLabel(t("language")).accessibilityIdentifier("settings-toggle")
                    }
                }
            }
            .toolbarBackground(ink, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar(session.aftermath == nil ? .visible : .hidden, for: .navigationBar)
            .sheet(item: $panel) { item in
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) { panelContents(item) }
                            .padding(24).frame(maxWidth: 780, alignment: .leading).frame(maxWidth: .infinity)
                    }.accessibilityIdentifier("panel-reading")
                    .background(ink).foregroundStyle(parchment)
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button(t("close")) { panel = nil } } }
                }.tint(gold).environment(\.layoutDirection, locale == "ar" ? .rightToLeft : .leftToRight)
            }
            .confirmationDialog(t("newGame"), isPresented: $confirmRestart, titleVisibility: .visible) {
                Button(t("restart"), role: .destructive) { session.restart(); playing = true }.accessibilityIdentifier("confirm-restart")
            }
            .fullScreenCover(isPresented: $showingCouncil) {
                if let origin = session.engine { NativeCouncilView(origin: origin, locale: locale) }
            }
            .alert("SHI", isPresented: Binding(get: { session.error != nil && !session.needsRecovery }, set: { if !$0 { session.error = nil } })) {
                Button("OK") { session.error = nil }
            } message: { Text(session.error ?? "") }
        }
        .tint(gold).environment(\.layoutDirection, locale == "ar" ? .rightToLeft : .leftToRight)
    }

    private func title(_ engine: CampaignEngine) -> some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottomLeading) {
                if let path = Bundle.main.path(forResource: "daze-village-rain-v1", ofType: "png"), let image = UIImage(contentsOfFile: path) {
                    Image(uiImage: image).resizable().scaledToFill().frame(width: geometry.size.width, height: geometry.size.height).clipped().accessibilityHidden(true)
                }
                LinearGradient(colors: [.clear, ink.opacity(0.75), ink], startPoint: .top, endPoint: .bottom)
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Spacer(minLength: max(24, geometry.size.height * 0.19))
                        Text("209 BCE  /  大澤鄉").font(.caption.monospaced()).tracking(3).foregroundStyle(gold)
                        HStack(alignment: .firstTextBaseline, spacing: 22) {
                            Text("勢").font(.system(size: 88, weight: .light, design: .serif)).foregroundStyle(gold)
                            Text("SHI").font(.system(size: 64, weight: .light, design: .serif)).tracking(6)
                        }.accessibilityElement(children: .ignore).accessibilityLabel("SHI, The Shape of Power")
                        Text(localized(session.campaign, "title")).font(.title2.weight(.light))
                        Text(t("opening")).font(.title3).lineSpacing(7)
                        Text(t("openingNote")).font(.subheadline).foregroundStyle(parchment.opacity(0.8)).lineSpacing(5)
                        Button { playing = true; if engine.history.isEmpty { panel = .guide } } label: {
                            Label(t(engine.history.isEmpty ? "begin" : "continue"), systemImage: "arrow.right").frame(maxWidth: .infinity).padding(.vertical, 12)
                        }.buttonStyle(.borderedProminent).tint(gold).foregroundStyle(ink).accessibilityIdentifier("begin-game")
                        Text("I · DAZE").font(.caption.monospaced()).foregroundStyle(gold)
                    }.padding(28).frame(maxWidth: 680).frame(maxWidth: .infinity)
                }.accessibilityIdentifier("title-reading")
            }
        }
    }

    private func play(_ engine: CampaignEngine) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack { Text(localized(engine.node, "dateLabel")).font(.caption); Spacer(); Text(String(format: "%08X", engine.seed)).font(.caption.monospaced()) }.foregroundStyle(gold)
                NativeWarTable(sites: session.campaign.records("sites"), activeSite: engine.node.text("siteId"), reducedMotion: reducedMotion || systemReducedMotion)
                    .frame(height: 230).clipShape(RoundedRectangle(cornerRadius: 20))
                    .accessibilityLabel("Schematic campaign map. \(localized(engine.node, "title"))")
                resourceStrip(engine.resources)
                Text(localized(engine.node, "title")).font(.system(.largeTitle, design: .serif)).accessibilityAddTraits(.isHeader).accessibilityIdentifier("story-title")
                Text(localized(engine.node, "context")).font(.body).lineSpacing(6)
                Text(localized(engine.node, "dialogue")).font(.system(.title3, design: .serif)).lineSpacing(6).padding(20).frame(maxWidth: .infinity, alignment: .leading).background(gold.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
                Text(t("reconstruction")).font(.caption).foregroundStyle(gold)
                if let echo = engine.node.records("storyEchoes").first(where: { engine.flags.contains($0.text("requiredFlag")) }) {
                    Text(localized(echo, "text")).lineSpacing(6)
                }
                if engine.completed { ending(engine) }
                else {
                    forecast(engine)
                    Text(t("choice")).font(.title2).accessibilityAddTraits(.isHeader)
                    ForEach(engine.choices, id: \.idValue) { choice in
                        Button {
                            panel = .order(choice.text("id"))
                        } label: {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(localized(choice, "label")).font(.headline)
                                Text(localized(choice, "intent")).font(.subheadline).foregroundStyle(parchment)
                                HStack { Text(t("consequence")).font(.caption); Spacer(); Image(systemName: "arrow.forward") }
                            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                                .background(gold.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(gold.opacity(0.3)))
                        }.buttonStyle(.plain).disabled(!engine.canChoose(choice)).opacity(engine.canChoose(choice) ? 1 : 0.45).accessibilityIdentifier(choice.text("id"))
                    }
                }
                HStack {
                    Button(t("record")) { panel = .chronicle }.buttonStyle(.bordered).accessibilityIdentifier("chronicle-toggle").accessibilityValue(String(engine.history.count))
                    Button(t("guide")) { panel = .guide }.buttonStyle(.bordered)
                    Spacer()
                    Image(systemName: "checkmark.shield").accessibilityLabel(t("save"))
                }.padding(.vertical, 12)
            }.padding(22).frame(maxWidth: 850).frame(maxWidth: .infinity)
        }.accessibilityIdentifier("campaign")
    }

    private func resourceStrip(_ values: Resources) -> some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 20) { resourceCells(values) }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 94))], alignment: .leading, spacing: 16) { resourceCells(values) }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
    }
    @ViewBuilder private func resourceCells(_ values: Resources) -> some View {
        ForEach(resourceKeys, id: \.self) { key in
            VStack(alignment: .leading, spacing: 5) {
                Text(t(key)).font(.caption).foregroundStyle(gold)
                Text("\(values[key, default: 0])").font(.title2.monospacedDigit())
            }.accessibilityElement(children: .combine)
        }
    }
    private func forecast(_ engine: CampaignEngine) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(t("fieldSignal"), systemImage: "cloud.rain").font(.headline).foregroundStyle(gold)
            Text(localized(engine.condition, "title")).font(.headline)
            Text(localized(engine.condition, "signal"))
            Text(localized(engine.stage, "forecast"))
            Text(localized(engine.methodRead, "forecast"))
            if let oath = engine.commitment { Text(localized(oath, "promise")).italic() }
        }.font(.subheadline).lineSpacing(4).padding(20).background(.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
    }
    private func ending(_ engine: CampaignEngine) -> some View {
        let key = engine.ending == "wildfire" ? "endingWildfire" : engine.ending == "deep-roots" ? "endingRoots" : "endingWatchful"
        return VStack(alignment: .leading, spacing: 18) {
            Text(t(engine.failure == nil ? "complete" : "failed")).font(.caption).foregroundStyle(gold)
            Text(t(key)).font(.largeTitle)
            if let reason = engine.failure { Text(t(reason)) }
            Text(t(key + "Text"))
            Text(locale.hasPrefix("zh") ? "本版本包含第一章；后续章节尚未推出。" : "This edition contains Chapter I. Later chapters are not yet available.").font(.footnote)
            if CouncilEntry.from(engine) != nil {
                Button(CouncilContent.definition.object("labels").localized("enter", locale)) { showingCouncil = true }
                    .buttonStyle(.borderedProminent).foregroundStyle(ink).frame(minHeight: 44).accessibilityIdentifier("council-enter")
            }
            Button(t("newGame")) { confirmRestart = true }.buttonStyle(.borderedProminent).foregroundStyle(ink)
        }.padding(24).frame(maxWidth: .infinity, alignment: .leading).background(gold.opacity(0.1), in: RoundedRectangle(cornerRadius: 18))
    }

    @ViewBuilder private func panelContents(_ panel: Panel) -> some View {
        switch panel {
        case .order(let choiceID):
            if let engine = session.engine, let choice = engine.choices.first(where: { $0.text("id") == choiceID }) {
                Text(localized(choice, "label")).font(.largeTitle)
                Text(localized(choice, "intent")).font(.title3)
                Text(t("consequence")).font(.headline).foregroundStyle(gold)
                Text(localized(choice, "consequence"))
                Text(localized(choice.object("pressure"), "warning"))
                if let outcome = engine.commitment?.records("outcomes").first(where: { $0.text("choiceId") == choiceID }) { Text(localized(outcome, "forecast")) }
                forecast(engine)
                Text(t("principle")).font(.headline).foregroundStyle(gold)
                Text(localized(choice, "strategy"))
                Button {
                    if session.choose(choiceID) { self.panel = nil }
                } label: { Label(localized(choice, "label"), systemImage: "checkmark.seal").frame(maxWidth: .infinity).padding(.vertical, 12) }
                    .buttonStyle(.borderedProminent).foregroundStyle(ink).accessibilityIdentifier("issue-order")
            }
        case .chronicle:
            Text(t("record")).font(.largeTitle)
            if session.engine?.history.isEmpty != false { Text(t("historyEmpty")) }
            ForEach(Array((session.engine?.history ?? []).enumerated()), id: \.offset) { index, turn in
                if let node = session.campaign.records("nodes").first(where: { $0.text("id") == turn.text("nodeId") }),
                   let choice = node.records("choices").first(where: { $0.text("id") == turn.text("choiceId") }) {
                    Text("\(index + 1) · \(localized(node, "title"))").font(.headline).foregroundStyle(gold)
                    Text(localized(choice, "label")).font(.title3)
                    Text(localized(choice, "consequence"))
                    resourceStrip(turn["after"] as? Resources ?? [:])
                }
            }
        case .sources:
            Text(t("sources")).font(.largeTitle)
            Text(t("openingNote"))
            ForEach(session.campaign.records("claims"), id: \.idValue) { claim in
                Text(localized(claim, "statement")).font(.headline)
                Text(localized(claim, "uncertainty")).font(.subheadline)
                Text(claim.text("reviewStatus")).font(.caption).foregroundStyle(gold)
                Divider()
            }
            ForEach(session.campaign.records("sources"), id: \.idValue) { source in
                Text("\(source.text("work")) · \(source.text("section"))").font(.headline)
                Text(source.text("locator")).font(.caption)
                Text(localized(source, "note"))
                Text(source.text("claimStatus")).font(.caption).foregroundStyle(gold)
                if let url = URL(string: source.text("url")), url.scheme == "https" { Link(source.text("work"), destination: url) }
                Divider()
            }
        case .guide:
            Text(t("guideTitle")).font(.largeTitle)
            Text(t("guideFieldTitle")).font(.title2).foregroundStyle(gold)
            Text(t("guideFieldText"))
            Text(t("guideMoveTitle")).font(.title2).foregroundStyle(gold)
            Text(t("intent") + " · " + t("consequence") + " · " + t("principle"))
            Text(t("guideReplyTitle")).font(.title2).foregroundStyle(gold)
            Text(t("pressureForecast") + " · " + t("fieldSignal"))
            Button(t("guideContinue")) { self.panel = nil }.buttonStyle(.borderedProminent).foregroundStyle(ink).accessibilityIdentifier("close-guide")
        case .settings:
            Text("SHI / 勢").font(.largeTitle)
            Picker(t("language"), selection: $locale) {
                ForEach(session.translations.object("localeNames").keys.sorted(), id: \.self) { key in
                    Text(session.translations.object("localeNames").text(key)).tag(key)
                }
            }.pickerStyle(.menu)
            Toggle(t("reducedMotion"), isOn: $reducedMotion)
            Text(t("save")).font(.headline).foregroundStyle(gold)
            Text(locale.hasPrefix("zh") ? "游戏离线运行。进度仅保存在此设备上；删除应用会删除存档。无账户、广告、追踪或应用内购买。" : "Play offline. Progress stays on this device; deleting the app removes its save. No account, ads, tracking, or in-app purchases.")
            Link("support@lazying.art", destination: URL(string: "mailto:support@lazying.art")!)
            Link(locale.hasPrefix("zh") ? "隐私政策" : "Privacy policy", destination: URL(string: "https://lachlan.lazying.art/ShiGame/privacy.html")!)
            Text("LazyingArt LLC · 1.0.0 (1)").font(.caption)
            Text("Native SwiftUI + SceneKit · Chapter I").font(.caption)
            Button(t("newGame"), role: .destructive) { self.panel = nil; confirmRestart = true }.accessibilityIdentifier("new-chronicle")
        }
    }
}

extension Dictionary where Key == String, Value == Any {
    var idValue: String { text("id") }
}
