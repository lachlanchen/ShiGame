import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "content/councils/chen-council.v1.json"));
const definition = JSON.parse(source);
const review = JSON.parse(await readFile(resolve(root, "content/research/chen-council-review.v1.json"), "utf8"));
const keys = ["grain", "tempo", "city", "allies", "veterans"];
assert.equal(definition.schemaVersion, 1);
assert.equal(definition.id, "chen-council.v1");
assert.equal(review.contentId, definition.id);
assert.equal(review.reviewStatus, "agent-reviewed-development-only");
assert.equal(review.contentSHA256, createHash("sha256").update(source).digest("hex"), "Content changed: repeat the prose/source review");
assert.equal((await readFile(resolve(root, "apps/web/src/generated/chen-council.v1.sha256"), "utf8")).trim(), review.contentSHA256,
  "Stale web/Android council save fingerprint");
assert.equal(review.publicationApproved, false, "This interlude has not received human release review");
assert.equal(review.rightsStatus, "project-original-prose-public-source-metadata-only");
const effects = value => {
  assert(value && typeof value === "object" && !Array.isArray(value));
  for (const [key, amount] of Object.entries(value)) {
    assert(keys.includes(key), `Unknown metric ${key}`);
    assert(Number.isInteger(amount) && Math.abs(amount) <= 10, `Invalid effect ${key}`);
  }
};
function prose(value) {
  if (!value || typeof value !== "object") return;
  if (Object.hasOwn(value, "en")) for (const locale of ["en", "zh-Hans"]) assert(typeof value[locale] === "string" && value[locale].trim(), `Missing ${locale} prose`);
  for (const child of Object.values(value)) prose(child);
}
prose(definition);
assert.deepEqual(Object.keys(definition.metrics), keys);
assert.equal(definition.rounds.length, 3);
assert.deepEqual(Object.keys(definition.outcomes).sort(), ["city-stronghold", "common-front", "empty-granaries", "fragile-coalition"]);
const seen = new Set();
for (const round of definition.rounds) {
  assert.equal(round.choices.length, 3);
  const earlier = new Set(seen);
  for (const choice of round.choices) {
    assert(!seen.has(choice.id)); seen.add(choice.id);
    effects(choice.effects);
    if (choice.requires) { effects(choice.requires); assert(Object.values(choice.requires).every(value => value >= 0)); }
    for (const answer of choice.answers ?? []) { assert(earlier.has(answer.afterChoice), "A promise response must refer to an earlier round"); effects(answer.effects); }
  }
}
assert.deepEqual(Object.keys(definition.arrivals).sort(), ["divided", "pressed", "supplied"]);
for (const arrival of Object.values(definition.arrivals)) {
  effects(arrival.metrics); assert.deepEqual(Object.keys(arrival.metrics), keys);
  assert(Object.values(arrival.metrics).every(value => value >= 0));
}
for (const folder of ["apps/web/src/generated", "apps/unity/Assets/StreamingAssets", "apps/unreal/Content/StreamingAssets", "apps/mobile/ios/SHI/Resources"]) {
  assert(source.equals(await readFile(resolve(root, folder, "chen-council.v1.json"))), `Stale council export: ${folder}`);
}
for (const item of definition.history.sources) assert(new URL(item.url).origin === "https://zh.wikisource.org");
console.log("Chen council valid: 3 rounds, 9 offers, 3 arrivals, original bilingual prose, hash-bound development review, four identical exports. Runtime qualification is recorded separately; human release review remains pending.");
