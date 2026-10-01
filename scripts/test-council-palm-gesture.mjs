import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const directory = ".runtime/council-palm-gesture-20261001";
const receipt = JSON.parse(await readFile(`${directory}/receipt.json`, "utf8"));
const baseline = JSON.parse(await readFile(".runtime/council-relaxed-gesture-20261001-v2/receipt.json", "utf8"));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function checkWrist(samples) {
  assert.equal(samples.length, 121);
  samples.forEach((sample, index) => {
    assert.equal(sample.frame, index + 1);
    for (const key of ["rollDegrees", "rotationErrorRadians", "originDriftMetres"]) assert.ok(Number.isFinite(sample[key]));
    assert.ok(sample.rollDegrees >= 0 && sample.rollDegrees <= 90);
    assert.ok(sample.rotationErrorRadians >= 0 && sample.rotationErrorRadians <= Math.PI / 360);
    assert.ok(sample.originDriftMetres >= 0 && sample.originDriftMetres <= 0.000001);
  });
  assert.equal(samples[0].rollDegrees, 0);
  assert.equal(samples[45].rollDegrees, 90);
  assert.equal(samples[60].rollDegrees, 90);
  assert.equal(samples[100].rollDegrees, 0);
  assert.equal(samples[120].rollDegrees, 0);
}

test("palm gesture retains every requested wrist pose and returns to rest", () => checkWrist(receipt.wristChecks));
test("palm roll leaves root, feet and hand origins on the relaxed baseline", () => {
  assert.equal(receipt.sourceSha256, baseline.sourceSha256);
  assert.equal(receipt.sourceSamples.length, 121);
  receipt.sourceSamples.forEach((sample, index) => {
    for (const name of ["Root", "foot_l", "foot_r", "hand_l", "hand_r"]) {
      const position = sample.landmarks[name];
      const original = baseline.sourceSamples[index].landmarks[name];
      assert.ok(position.every(Number.isFinite));
      assert.ok(Math.hypot(...position.map((value, axis) => value - original[axis])) <= 0.000001, `${name} drift at ${sample.frame}`);
    }
  });
});
test("renders and author hashes bind the current palm study", async () => {
  assert.equal(receipt.wristAuthorSha256, sha(await readFile("scripts/render-council-palm-gesture-study.py")));
  assert.equal(receipt.poseAuthorSha256, sha(await readFile("scripts/render-council-relaxed-gesture-study.py")));
  assert.equal(receipt.frames.length, 48);
  for (const frame of receipt.frames) assert.equal(frame.sha256, sha(await readFile(`${directory}/${frame.file}`)));
});
test("wrist checks reject lost edits, drift and nonfinite values", () => {
  for (const patch of [{ rotationErrorRadians: 1 }, { originDriftMetres: 0.01 }, { rollDegrees: NaN }]) {
    const samples = structuredClone(receipt.wristChecks);
    Object.assign(samples[45], patch);
    assert.throws(() => checkWrist(samples));
  }
});
