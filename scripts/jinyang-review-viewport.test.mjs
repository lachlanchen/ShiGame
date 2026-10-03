import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewViewport, viewportArgument, recordedViewport } from "./jinyang-review-viewport.mjs";

test("desktop default and small landscape/portrait reviews keep their actual dimensions", () => {
  assert.deepEqual(viewportArgument([]), { width: 1920, height: 1080 });
  for (const value of ["844x390", "390x844", "1280x720", "1080x1920", "320x320"])
    assert.deepEqual(recordedViewport({ viewport: viewportArgument([`--viewport=${value}`]) }), reviewViewport(value));
});

test("rejects malformed, ambiguous and over-budget viewport requests before launch", () => {
  for (const value of ["", "844X390", "844x390x24", "-844x390", "844.5x390", "0844x390", "319x390", "9999x390", "2560x1440", "Infinityx390", null])
    assert.throws(() => reviewViewport(value), /viewport/);
  assert.throws(() => viewportArgument(["--viewport"]), /WIDTHxHEIGHT/);
  assert.throws(() => viewportArgument(["--viewport=844x390", "--viewport=844x390"]), /only once/);
});

test("only absent legacy metadata gets a default; corrupt evidence is rejected", () => {
  assert.deepEqual(recordedViewport({}), { width: 1920, height: 1080 });
  for (const viewport of [null, {}, { width: "844", height: 390 }, { width: 844, height: 390.1 }, { width: 2560, height: 2560 }])
    assert.throws(() => recordedViewport({ viewport }), /viewport/);
});
