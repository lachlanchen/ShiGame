/** Engineering evidence only; passing does not approve acting or asset admission. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const directory = resolve(process.argv[2] ?? ".runtime/council-motion-film-20261001");
const poseStudy = process.argv[3] === "--relaxed-gesture";
assert.ok(process.argv[3] === undefined || poseStudy, "Unknown review mode");
const sha = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const receipt = JSON.parse(readFileSync(resolve(directory, "receipt.json"), "utf8"));
// Match Python's ties-to-even rounding used by the renderer.
const sourceFrame = index => {
  const value = index * 30 / 12;
  const lower = Math.floor(value);
  return 1 + (value - lower === 0.5 ? lower + lower % 2 : Math.round(value));
};
assert.equal(receipt.status, "private-engineering-review-not-shipping");
assert.equal(receipt.sourceSha256, sha("assets/3d/rendered/shi-daze-council-performance-v1.blend"));
assert.equal(receipt.scriptSha256, sha("scripts/render-council-motion-film.py"));
assert.equal(receipt.blender, "4.5.12 LTS");
assert.equal(receipt.rig, "SK_SHI_keeper_Rig");
assert.equal(receipt.action, poseStudy ? "AN_SHI_PrivateCouncil_RelaxedGesture_Study01" : "AN_SHI_DazeCouncil_SpeakerMeasured_01");
assert.equal(receipt.fps, 12);
assert.equal(receipt.durationSeconds, 4);
assert.equal(receipt.frames.length, 48);
assert.equal(receipt.sourceSamples.length, 121);
receipt.frames.forEach((frame, index) => {
  assert.equal(frame.file, `frame-${String(index).padStart(3, "0")}.png`);
  assert.equal(frame.sourceFrame, sourceFrame(index));
  assert.equal(frame.sha256, sha(resolve(directory, frame.file)));
});
const names = ["Root", "foot_l", "foot_r", "hand_l", "hand_r", "head"];
receipt.sourceSamples.forEach((sample, index) => {
  assert.equal(sample.frame, index + 1);
  assert.deepEqual(Object.keys(sample.landmarks).sort(), [...names].sort());
  names.forEach(name => {
    assert.equal(sample.landmarks[name].length, 3);
    assert.ok(sample.landmarks[name].every(Number.isFinite));
  });
});
for (const name of ["foot_l", "foot_r"]) {
  const first = receipt.sourceSamples[0].landmarks[name];
  const displacement = Math.max(...receipt.sourceSamples.map(sample =>
    Math.hypot(...sample.landmarks[name].map((v, axis) => v - first[axis]))));
  assert.ok(Math.abs(displacement - receipt.maximumFootDisplacementMetres[name]) < 1e-9);
  assert.ok(displacement < 0.001, "Bounded stationary study must not slide feet");
}
let poseDiagnostics;
if (poseStudy) {
  assert.equal(receipt.poseAuthorSha256, sha("scripts/render-council-relaxed-gesture-study.py"));
  assert.equal(receipt.skeletonBones.length, 53);
  assert.equal(new Set(receipt.skeletonBones).size, 53);
  assert.equal(receipt.envelope.length, 121);
  receipt.envelope.forEach((sample, index) => {
    assert.equal(sample.frame, index + 1);
    assert.ok(Number.isFinite(sample.weight) && sample.weight >= 0 && sample.weight <= 1);
    if (sample.frame <= 16 || sample.frame >= 101) assert.equal(sample.weight, 0);
    if (sample.frame >= 46 && sample.frame <= 61) assert.equal(sample.weight, 1);
  });
  // Compare to the actual accepted-action review, not invented neutral coordinates.
  const baseline = JSON.parse(readFileSync(".runtime/council-motion-film-20261001/receipt.json", "utf8"));
  assert.equal(baseline.sourceSha256, receipt.sourceSha256);
  assert.equal(baseline.action, "AN_SHI_DazeCouncil_SpeakerMeasured_01");
  assert.equal(baseline.sourceSamples.length, 121);
  for (const name of ["Root", "foot_l", "foot_r"]) {
    receipt.sourceSamples.forEach((sample, index) => {
      assert.ok(Math.hypot(...sample.landmarks[name].map((v, axis) =>
        v - baseline.sourceSamples[index].landmarks[name][axis])) < 1e-6, "Do not move the accepted root/feet");
    });
  }
  const distance = (a, b) => Math.hypot(...a.map((v, axis) => v - b[axis]));
  const start = receipt.sourceSamples[0].landmarks.hand_r;
  const travel = Math.max(...receipt.sourceSamples.map(s => distance(s.landmarks.hand_r, start)));
  const speed = Math.max(...receipt.sourceSamples.slice(1).map((s, index) =>
    distance(s.landmarks.hand_r, receipt.sourceSamples[index].landmarks.hand_r) * 30));
  assert.ok(travel > 0.2 && travel < 0.5, "Bounded readable offer gesture");
  assert.ok(speed < 1.5, "No large sampled wrist jumps");
  assert.ok(distance(start, receipt.sourceSamples[120].landmarks.hand_r) < 0.001, "Return to relaxed rest");
  poseDiagnostics = { handTravelMetres: travel, maximumSampledHandSpeedMetresPerSecond: speed };
}
const movie = resolve(directory, "speaker-study.mp4");
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", movie], { encoding: "utf8" }));
assert.equal(probe.streams.length, 1, "The study is silent");
const stream = probe.streams[0];
assert.equal(stream.codec_name, "h264");
assert.equal(stream.width, 640);
assert.equal(stream.height, 360);
assert.equal(stream.r_frame_rate, "12/1");
assert.equal(Number(stream.nb_frames), 48);
assert.equal(Number(probe.format.duration), 4);
// Decode the whole movie, not just its container header.
execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", movie, "-f", "null", "-"], { stdio: "pipe" });
console.log(JSON.stringify({ status: "engineering-export-verified-not-release-approved", sourceSamples: 121,
  framesDecoded: 48, movieSha256: sha(movie), receiptSha256: sha(resolve(directory, "receipt.json")),
  poseDiagnostics,
  remaining: ["acting", "costume deformation", "scene staging", "human motion review", "game integration"] }, null, 2));
