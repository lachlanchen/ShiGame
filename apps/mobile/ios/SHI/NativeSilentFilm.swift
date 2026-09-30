import SwiftUI
import AVFoundation
import Combine

/// A presentation slot, not a media approval mechanism. Callers must supply a
/// reviewed local asset and localized descriptive captions; no remote fetching.
struct NativeFilmAsset {
    struct Caption {
        let start: Double
        let end: Double
        let text: String
    }
    let url: URL
    let captions: [Caption]
    func caption(at seconds: Double) -> String {
        captions.filter { seconds >= $0.start && seconds < $0.end }.map(\.text).joined(separator: "\n")
    }
}

@MainActor final class NativeFilmPlayer: ObservableObject {
    enum Status { case ready, starting, playing, paused, ended, unavailable }
    @Published private(set) var status: Status = .ready
    @Published private(set) var seconds: Double = 0
    let player = AVPlayer()
    private var active = false
    private var wantsPlayback = false
    private var observations = Set<AnyCancellable>()
    private var clock: Any?

    init() { player.isMuted = true; player.actionAtItemEnd = .pause }

    func prepare(_ asset: NativeFilmAsset) {
        detach()
        seconds = 0
        guard asset.url.isFileURL, FileManager.default.fileExists(atPath: asset.url.path),
              !asset.captions.isEmpty,
              asset.captions.allSatisfy({ $0.start.isFinite && $0.end.isFinite && $0.start >= 0 && $0.end > $0.start && !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
        else { status = .unavailable; return }
        status = .ready
        let item = AVPlayerItem(url: asset.url)
        player.replaceCurrentItem(with: item)
        item.publisher(for: \.status).receive(on: DispatchQueue.main).sink { [weak self, weak item] value in
            guard let self, let item, self.player.currentItem === item else { return }
            if value == .failed { self.fail() }
        }.store(in: &observations)
        player.publisher(for: \.timeControlStatus).receive(on: DispatchQueue.main).sink { [weak self, weak item] value in
            guard let self, let item, self.player.currentItem === item else { return }
            if value == .playing {
                guard self.active && self.wantsPlayback else { self.player.pause(); return }
                self.status = .playing
            }
        }.store(in: &observations)
        NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime, object: item)
            .receive(on: DispatchQueue.main).sink { [weak self, weak item] _ in
                guard let self, let item, self.player.currentItem === item else { return }
                self.wantsPlayback = false; self.player.pause(); self.status = .ended
            }.store(in: &observations)
        NotificationCenter.default.publisher(for: .AVPlayerItemFailedToPlayToEndTime, object: item)
            .receive(on: DispatchQueue.main).sink { [weak self, weak item] _ in
                guard let self, let item, self.player.currentItem === item else { return }
                self.fail()
            }.store(in: &observations)
        clock = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.1, preferredTimescale: 600), queue: .main) { [weak self, weak item] time in
            Task { @MainActor in
                guard let self, let item, self.player.currentItem === item, time.seconds.isFinite else { return }
                self.seconds = time.seconds
            }
        }
    }

    func setActive(_ value: Bool) {
        active = value
        if !value { pause() }
        // Foregrounding never grants playback intent.
    }

    func play() {
        guard active, player.currentItem != nil, status != .ended, status != .unavailable else { return }
        wantsPlayback = true; status = .starting
        player.isMuted = true
        player.play()
    }

    func pause() {
        wantsPlayback = false; player.pause()
        if status == .playing || status == .starting { status = .paused }
    }

    private func fail() { wantsPlayback = false; player.pause(); status = .unavailable }

    func detach() {
        pause()
        observations.removeAll()
        if let clock { player.removeTimeObserver(clock) }
        clock = nil
        player.replaceCurrentItem(with: nil)
    }

    deinit {
        if let clock { player.removeTimeObserver(clock) }
        player.pause()
    }
}

private final class FilmSurface: UIView {
    override class var layerClass: AnyClass { AVPlayerLayer.self }
}

private struct SilentFilmSurface: UIViewRepresentable {
    let player: AVPlayer
    func makeUIView(context: Context) -> FilmSurface {
        let view = FilmSurface()
        (view.layer as? AVPlayerLayer)?.videoGravity = .resizeAspect
        view.isAccessibilityElement = false
        return view
    }
    func updateUIView(_ view: FilmSurface, context: Context) { (view.layer as? AVPlayerLayer)?.player = player }
    static func dismantleUIView(_ view: FilmSurface, coordinator: ()) { (view.layer as? AVPlayerLayer)?.player = nil }
}

struct NativeSilentFilm: View {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var playback = NativeFilmPlayer()
    let asset: NativeFilmAsset
    let label: (String) -> String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SilentFilmSurface(player: playback.player).aspectRatio(16 / 9, contentMode: .fit)
                .background(Color.black).accessibilityHidden(true)
            let caption = asset.caption(at: playback.seconds)
            if !caption.isEmpty { Text(caption).fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("film-caption") }
            if playback.status == .ended || playback.status == .unavailable {
                Text(label(playback.status == .ended ? "finished" : "unavailable"))
                    .accessibilityIdentifier("film-status")
            } else {
                let running = playback.status == .playing || playback.status == .starting
                Button(label(running ? "pause" : "play")) {
                    if running { playback.pause() } else { playback.play() }
                }.buttonStyle(.bordered).accessibilityIdentifier("film-play-pause")
            }
        }
        .onAppear { playback.prepare(asset); playback.setActive(scenePhase == .active) }
        .onChange(of: scenePhase) { value in playback.setActive(value == .active) }
        .onDisappear { playback.detach() }
    }
}
