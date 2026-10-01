import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const directory = process.env.SHI_PALM_STUDY ?? ".runtime/council-palm-fingers-20261001";
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
  const keys = [[1, 0], [16, 0], [46, 90], [61, 90], [101, 0], [121, 0]];
  for (const sample of samples) {
    const index = keys.findIndex(([frame], i) => i < keys.length - 1 && sample.frame >= frame && sample.frame <= keys[i + 1][0]);
    const [a, start] = keys[index], [b, end] = keys[index + 1];
    const t = (sample.frame - a) / (b - a);
    const expected = start + (end - start) * t * t * (3 - 2 * t);
    assert.ok(Math.abs(sample.rollDegrees - expected) < 1e-8, `unexpected wrist curve at ${sample.frame}`);
    assert.ok(Number.isFinite(sample.fingerClosure) && Math.abs(sample.fingerClosure - expected / 90 * 0.65) < 1e-8, `unexpected finger convergence at ${sample.frame}`);
  }
  const speeds = samples.slice(1).map((sample, i) => (sample.rollDegrees - samples[i].rollDegrees) * 30);
  assert.ok(Math.max(...speeds.map(Math.abs)) <= 140, "wrist speed exceeds the authored study bound");
  assert.ok(Math.max(...speeds.slice(1).map((speed, i) => Math.abs(speed - speeds[i]) * 30)) <= 600, "wrist acceleration exceeds the authored study bound");
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
test("wrist checks reject a mid-gesture snap even when phase endpoints are correct", () => {
  const samples = structuredClone(receipt.wristChecks);
  samples[30].rollDegrees = 90;
  assert.throws(() => checkWrist(samples));
});
test("wrist checks reject unrequested movement during settle and hold", () => {
  for (const index of [8, 50, 110]) {
    const samples = structuredClone(receipt.wristChecks);
    samples[index].rollDegrees += samples[index].rollDegrees === 90 ? -1 : 1;
    assert.throws(() => checkWrist(samples));
  }
});
