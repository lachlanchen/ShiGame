/** Engineering evidence only; passing does not approve acting or asset admission. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const directory = resolve(process.argv[2] ?? ".runtime/council-motion-film-20261001");
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
assert.equal(receipt.action, "AN_SHI_DazeCouncil_SpeakerMeasured_01");
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
  remaining: ["acting", "costume deformation", "scene staging", "human motion review", "game integration"] }, null, 2));
