import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const field = JSON.parse(readFileSync(new URL("../content/presentation/crossing-field.v1.json", import.meta.url), "utf8"));
assert.equal(field.schemaVersion, 1);
assert.equal(field.id, "crossing-field-v1");
assert.equal(field.claimStatus, "dramatic-reconstruction");
assert.deepEqual(field.canvas, { width: 100, height: 60 });
assert(field.route.startX < field.river.left && field.route.endX > field.river.right);
assert(field.rear.x < field.river.left && field.pursuit.endX < field.rear.x);
assert(field.rear.minimumSpread >= 0 && field.rear.maximumSpread >= field.rear.minimumSpread);
for (const geometry of [field.river, field.route, field.rear, field.pursuit]) {
  for (const value of Object.values(geometry)) assert(Number.isFinite(value) && value >= 0 && value <= 100);
}
for (const color of Object.values(field.palette)) assert.match(color, /^#[0-9a-f]{6}$/);
assert.deepEqual(Object.keys(field.labels).sort(), ["en", "ja", "zh-Hans", "zh-Hant", "ko", "vi", "ar", "fr", "es", "ru", "de"].sort());
for (const [locale, labels] of Object.entries(field.labels)) {
  assert.deepEqual(Object.keys(labels).sort(), ["title", "nearBank", "farBank", "boundary"].sort());
  for (const value of Object.values(labels)) assert(typeof value === "string" && value.trim(), `Empty ${locale} label`);
}
console.log("Crossing field contract: bounded shared geometry, reconstruction boundary and 11 complete label sets.");

const root = new URL("../", import.meta.url);
const scene = JSON.parse(readFileSync(new URL("content/presentation/crossing-establishing.v1.json", root), "utf8"));
const art = JSON.parse(readFileSync(new URL("assets/provenance/broken-crossing-establishing-v1.json", root), "utf8"));
assert.equal(scene.id, "crossing-establishing-v1");
assert.equal(scene.claimStatus, "dramatic-reconstruction");
assert.equal(scene.showWhen, "before-first-crossing-order");
assert.equal(art.reviewStatus, "agent-approved-pre-alpha-establishing-still");
assert.equal(scene.image, "broken-crossing-establishing-v1.jpg");
assert.deepEqual(Object.keys(scene.labels).sort(), Object.keys(field.labels).sort());
for (const labels of Object.values(scene.labels)) for (const key of ["alt", "caption"]) assert(labels[key]?.trim());
for (const entry of [art.input, art.output, art.delivery]) {
  const bytes = readFileSync(new URL(entry.file, root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, `Unreviewed image bytes: ${entry.file}`);
}
const png = readFileSync(new URL(art.output.file, root));
assert.equal(png.readUInt32BE(16), scene.width);
assert.equal(png.readUInt32BE(20), scene.height);
assert(readFileSync(new URL(art.delivery.file, root)).length < 400 * 1024, "Crossing still exceeds its 400 KiB delivery budget");
console.log("Crossing still: reviewed source/delivery hashes, 11 readable alternatives and bounded pre-order use.");
