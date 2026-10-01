import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
