/** Local artifact regression tests; render/encode both documented studies first. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import test from "node:test";

const candidate = resolve(".runtime/council-relaxed-gesture-20261001-v2");
const run = (directory, candidateMode = true) => execFileSync(process.execPath,
  ["scripts/validate-council-motion-film.mjs", directory, ...(candidateMode ? ["--relaxed-gesture"] : [])], { encoding: "utf8", stdio: "pipe" });

test("accepted source and relaxed study both retain independent engineering gates", () => {
  assert.equal(JSON.parse(run(resolve(".runtime/council-motion-film-20261001"), false)).framesDecoded, 48);
  const result = JSON.parse(run(candidate));
  assert.equal(result.framesDecoded, 48);
  assert.ok(result.poseDiagnostics.handTravelMetres > 0.2);
  assert.ok(result.remaining.includes("game integration"));
});

const cases = {
  "wrong pose author": r => { r.poseAuthorSha256 = "0".repeat(64); },
  "root drift": r => { r.sourceSamples[45].landmarks.Root[0] += 0.02; },
  "all feet shifted without sliding": r => { r.sourceSamples.forEach(s => { s.landmarks.foot_l[0] += 0.02; }); },
  "gesture removed": r => { const first = r.sourceSamples[0].landmarks.hand_r; r.sourceSamples.forEach(s => { s.landmarks.hand_r = [...first]; }); },
  "false hold phase": r => { r.envelope[45].weight = 0.5; },
  "frame hash mismatch": r => { r.frames[18].sha256 = "0".repeat(64); },
  "nonfinite landmark": r => { r.sourceSamples[20].landmarks.hand_l[0] = null; },
};
for (const [name, mutate] of Object.entries(cases)) {
  test(`rejects ${name}`, () => {
    const directory = mkdtempSync(join(tmpdir(), "shi-motion-test-"));
    try {
      const receipt = JSON.parse(readFileSync(join(candidate, "receipt.json"), "utf8"));
      for (const frame of receipt.frames) copyFileSync(join(candidate, frame.file), join(directory, frame.file));
      copyFileSync(join(candidate, "speaker-study.mp4"), join(directory, "speaker-study.mp4"));
      mutate(receipt);
      writeFileSync(join(directory, "receipt.json"), JSON.stringify(receipt));
      assert.throws(() => run(directory));
    } finally {
      // This exact newly created directory contains only generated test fixtures.
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
