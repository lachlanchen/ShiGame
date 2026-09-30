import XCTest
import AVFoundation
import CoreVideo
@testable import SHI

@MainActor final class FilmTests: XCTestCase {
    func testRealLocalDecodeStaysSilentAndNeedsGestureAfterBackground() async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("shi-decode-\(UUID().uuidString).mov")
        defer { try? FileManager.default.removeItem(at: url) }
        let writer = try AVAssetWriter(outputURL: url, fileType: .mov)
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 64, AVVideoHeightKey: 64])
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input,
            sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
                kCVPixelBufferWidthKey as String: 64, kCVPixelBufferHeightKey as String: 64])
        writer.add(input)
        XCTAssertTrue(writer.startWriting())
        writer.startSession(atSourceTime: .zero)
        var raw: CVPixelBuffer?
        XCTAssertEqual(CVPixelBufferCreate(kCFAllocatorDefault, 64, 64, kCVPixelFormatType_32ARGB, nil, &raw), kCVReturnSuccess)
        let buffer = try XCTUnwrap(raw)
        CVPixelBufferLockBaseAddress(buffer, [])
        memset(CVPixelBufferGetBaseAddress(buffer), 80, CVPixelBufferGetDataSize(buffer))
        CVPixelBufferUnlockBaseAddress(buffer, [])
        for frame in 0..<20 {
            for _ in 0..<100 where !input.isReadyForMoreMediaData { try await Task.sleep(nanoseconds: 10_000_000) }
            XCTAssertTrue(input.isReadyForMoreMediaData)
            XCTAssertTrue(adaptor.append(buffer, withPresentationTime: CMTime(value: Int64(frame), timescale: 10)))
        }
        input.markAsFinished()
        await writer.finishWriting()
        XCTAssertEqual(writer.status, .completed, writer.error?.localizedDescription ?? "")

        let model = NativeFilmPlayer()
        defer { model.detach() }
        model.prepare(NativeFilmAsset(url: url, captions: [.init(start: 0, end: 2, text: "Synthetic decoder fixture")]))
        model.setActive(true)
        XCTAssertEqual(model.player.rate, 0)
        model.play()
        for _ in 0..<100 where model.status != .playing { try await Task.sleep(nanoseconds: 30_000_000) }
        XCTAssertEqual(model.status, .playing)
        XCTAssertTrue(model.player.isMuted)
        model.setActive(false)
        XCTAssertEqual(model.player.rate, 0)
        model.setActive(true)
        try await Task.sleep(nanoseconds: 150_000_000)
        XCTAssertEqual(model.status, .paused)
        XCTAssertEqual(model.player.rate, 0)
        model.play()
        for _ in 0..<150 where model.status != .ended { try await Task.sleep(nanoseconds: 30_000_000) }
        XCTAssertEqual(model.status, .ended)
        model.play()
        XCTAssertEqual(model.status, .ended)
        XCTAssertEqual(model.player.rate, 0)
    }

    func testRemoteAndMissingAssetsNeverEnterPlayer() {
        let model = NativeFilmPlayer()
        for url in [URL(string: "https://example.invalid/movie.mp4")!, URL(fileURLWithPath: "/missing-shi-film.mp4")] {
            model.prepare(NativeFilmAsset(url: url, captions: [.init(start: 0, end: 1, text: "Rain")]))
            model.setActive(true); model.play()
            XCTAssertEqual(model.status, .unavailable)
            XCTAssertNil(model.player.currentItem)
            XCTAssertEqual(model.player.rate, 0)
        }
    }

    func testCaptionsHaveHalfOpenBoundariesAndSupportOverlaps() {
        let asset = NativeFilmAsset(url: URL(fileURLWithPath: "/unused.mp4"), captions: [
            .init(start: 0, end: 2, text: "Rain"), .init(start: 1, end: 3, text: "A hand reaches for the register")])
        XCTAssertEqual(asset.caption(at: 0), "Rain")
        XCTAssertEqual(asset.caption(at: 1), "Rain\nA hand reaches for the register")
        XCTAssertEqual(asset.caption(at: 2), "A hand reaches for the register")
        XCTAssertEqual(asset.caption(at: 3), "")
    }

    func testInactivePauseForegroundAndDetachNeverAutoplay() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("shi-film-\(UUID().uuidString).mp4")
        // Invalid decoder input is deliberate: this checks intent synchronously,
        // not successful decoding or visual quality.
        try Data().write(to: url)
        defer { try? FileManager.default.removeItem(at: url) }
        let model = NativeFilmPlayer()
        defer { model.detach() }
        model.prepare(NativeFilmAsset(url: url, captions: [.init(start: 0, end: 1, text: "Rain")]))
        XCTAssertTrue(model.player.isMuted)
        model.play()
        XCTAssertEqual(model.status, .ready)
        model.setActive(true)
        XCTAssertEqual(model.status, .ready)
        model.play()
        XCTAssertEqual(model.status, .starting)
        model.setActive(false)
        XCTAssertEqual(model.status, .paused)
        model.setActive(true)
        XCTAssertEqual(model.status, .paused)
        XCTAssertEqual(model.player.rate, 0)
        model.detach()
        XCTAssertNil(model.player.currentItem)
        model.play()
        XCTAssertEqual(model.player.rate, 0)
    }
}
