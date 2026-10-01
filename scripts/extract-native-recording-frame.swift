// macOS evidence helper; extracts one unaltered frame from an existing recording.
// Usage: xcrun swift extract-native-recording-frame.swift input.mp4 new.png seconds
import Foundation
import AVFoundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 4,
      let seconds = Double(CommandLine.arguments[3]), seconds.isFinite, seconds >= 0 else {
    fatalError("Pass recording, fresh PNG output and nonnegative time in seconds")
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard FileManager.default.fileExists(atPath: input.path),
      !FileManager.default.fileExists(atPath: output.path) else {
    fatalError("Input must exist; never overwrite an evidence frame")
}
let asset = AVURLAsset(url: input)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
var actual = CMTime.zero
let frame = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: &actual)
guard let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    fatalError("Cannot create PNG destination")
}
CGImageDestinationAddImage(destination, frame, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Cannot finish PNG") }
print("Recorded frame at \(CMTimeGetSeconds(actual))s, \(frame.width)x\(frame.height). No resize, compositing or generated content.")
