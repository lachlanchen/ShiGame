import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readChapterCompatibility, validateChapterCompatibility } from "./chapter-save-compatibility.mjs";

const { source, manifest, fixtures } = await readChapterCompatibility();
const check = (m = manifest, s = source, f = fixtures) => validateChapterCompatibility(s, m, f);
test("reconstructs the exact release-1 campaign and its original 46-route expectations", () => {
  const [old] = check();
  assert.equal(createHash("sha256").update(old).digest("hex"), "445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c");
  assert.equal(JSON.parse(fixtures).routeCount, 46);
  assert.equal(manifest.previousCampaigns[0].previousText.length, 14);
});
test("rejects a rule change even if someone updates the target hash", () => {
  const campaign = JSON.parse(source); campaign.initialResources.grain += 1;
  const changed = JSON.stringify(campaign, null, 2) + "\n";
  const m = structuredClone(manifest); m.currentCampaignSHA256 = createHash("sha256").update(changed).digest("hex");
  assert.throws(() => check(m, changed), /byte-for-byte/);
});
test("rejects permissive paths, duplicate patches and fabricated historical prose", () => {
  for (const mutate of [
    m => { m.previousCampaigns[0].previousText[0].path = "/nodes/0/choices/0/effects/grain"; },
    m => { m.previousCampaigns[0].previousText.push(m.previousCampaigns[0].previousText[0]); },
    m => { m.previousCampaigns[0].previousText[0].previousText += " invented"; },
    m => { m.previousCampaigns.push(m.previousCampaigns[0]); },
    m => { m.reviewStatus = "pending"; },
  ]) { const m = structuredClone(manifest); mutate(m); assert.throws(() => check(m)); }
});
test("rejects stale targets and changed historical replay expectations", () => {
  assert.throws(() => check(manifest, source + " "), /stale/);
  assert.throws(() => check(manifest, source, fixtures.replace('"routeCount": 46', '"routeCount": 45')), /expectations changed/);
});
