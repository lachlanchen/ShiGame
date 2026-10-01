import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const hash = value => createHash("sha256").update(value).digest("hex");
const sha = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const prosePath = /^\/nodes\/(0|[1-9]\d*)\/(?:dialogue\/(?:en|zh-Hans)|storyEchoes\/(0|[1-9]\d*)\/text\/(?:en|zh-Hans))$/;

// Reverse only reviewed prose tokens in the exact current bytes. Reconstructing
// the published SHA proves everything else, including formatting and all rules,
// is unchanged. No Git history or permissive structural projection is needed.
export function validateChapterCompatibility(source, manifest, fixtures) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.campaignId, "chapter-01-daze");
  assert.equal(manifest.reviewStatus, "reviewed-prose-only");
  assert.equal(hash(source), manifest.currentCampaignSHA256, "Compatibility target is stale");
  const current = JSON.parse(source);
  assert.equal(current.id, manifest.campaignId);
  assert(Array.isArray(manifest.previousCampaigns) && manifest.previousCampaigns.length > 0);
  const seen = new Set();
  const reconstructed = [];
  for (const prior of manifest.previousCampaigns) {
    assert(sha(prior.campaignSHA256) && prior.campaignSHA256 !== manifest.currentCampaignSHA256);
    assert(!seen.has(prior.campaignSHA256), "Duplicate prior revision"); seen.add(prior.campaignSHA256);
    assert(/^[a-f0-9]{40}$/.test(prior.sourceCommit));
    assert(sha(prior.releasedConformanceSHA256));
    assert(Array.isArray(prior.previousText) && prior.previousText.length > 0);
    let restored = source;
    const paths = new Set();
    for (const edit of prior.previousText) {
      assert(prosePath.test(edit.path), "Only dialogue/echo prose may be reversed");
      assert(!paths.has(edit.path), "Duplicate prose path"); paths.add(edit.path);
      const value = edit.path.slice(1).split("/").reduce((at, key) => at?.[key], current);
      assert(typeof value === "string" && typeof edit.previousText === "string" && edit.previousText.trim());
      assert.notEqual(value, edit.previousText, "Redundant prose edit");
      const token = JSON.stringify(value);
      assert.equal(restored.split(token).length, 2, "Prose token must occur exactly once");
      restored = restored.replace(token, () => JSON.stringify(edit.previousText));
    }
    assert.equal(hash(restored), prior.campaignSHA256, "Released campaign cannot be reconstructed byte-for-byte");
    const token = JSON.stringify(manifest.currentCampaignSHA256);
    assert.equal(fixtures.split(token).length, 2);
    const oldFixtures = fixtures.replace(token, JSON.stringify(prior.campaignSHA256));
    assert.equal(hash(oldFixtures), prior.releasedConformanceSHA256, "Released replay expectations changed");
    reconstructed.push(restored);
  }
  return reconstructed;
}

export async function readChapterCompatibility() {
  const root = new URL("../", import.meta.url);
  return {
    source: await readFile(new URL("content/campaigns/chapter-01-daze.json", root), "utf8"),
    manifest: JSON.parse(await readFile(new URL("content/compatibility/chapter-01-save-compatibility.v1.json", root), "utf8")),
    fixtures: await readFile(new URL("content/conformance/chapter-01-replays.v1.json", root), "utf8"),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { source, manifest, fixtures } = await readChapterCompatibility();
  const previous = validateChapterCompatibility(source, manifest, fixtures);
  console.log(`Chapter save compatibility: ${previous.length} exact released campaign(s), unchanged replay expectations, prose-only differences.`);
}
