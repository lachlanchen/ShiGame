import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { supportedLocales } from "@shi/game-core";
import { localeNames } from "../apps/web/src/i18n";
import { ui } from "../apps/web/src/ui-catalog";
import { cinemaKeys, cinemaLabel } from "../apps/web/src/cinema-labels";
import { oppositionUi } from "../apps/web/src/opposition-i18n";
import { translateCommitment } from "../apps/web/src/commitment-i18n";
import { engagementMetricLabels } from "../apps/web/src/engagement-i18n";

const root = resolve(import.meta.dirname, "..");
const resource = resolve(root, "apps/mobile/ios/SHI/Resources");
assert((await readFile(resolve(root, "content/compatibility/chapter-01-save-compatibility.v1.json"))).equals(
  await readFile(resolve(resource, "chapter-01-save-compatibility.v1.json")),
), "Native save compatibility policy differs from its reviewed source");
// This draft is only copied by the separate QA project, never sync:ios.
const productionSpec = await readFile(resolve(root, "apps/mobile/ios/project.yml"), "utf8");
const qaSpec = await readFile(resolve(root, "apps/mobile/ios/project-qa.yml"), "utf8");
const crossingSpec = await readFile(resolve(root, "apps/mobile/ios/project-crossing-qa.yml"), "utf8");
assert(!productionSpec.includes("SHI_CROSSING_PREVIEW") && !qaSpec.includes("SHI_CROSSING_PREVIEW"), "Crossing flag leaked outside its isolated project");
assert(crossingSpec.includes("SHI_CROSSING_PREVIEW") && crossingSpec.includes("art.lazying.shi.crossingqa") && crossingSpec.includes("CODE_SIGNING_ALLOWED: NO"));
for (const filename of ["chapter-01-broken-crossing.v1.json", "chapter-01-crossing-campaign.rules.v2.json", "chapter-01-crossing-aftermath.v2.json"]) {
  assert(!(await readdir(resource)).includes(filename), `Crossing draft ${filename} must not enter production Resources`);
  assert(crossingSpec.includes(filename), `Crossing QA project is missing ${filename}`);
}
assert(!productionSpec.includes("SHI_RETREAT_PREVIEW") && !productionSpec.includes("chen-retreat"), "Retreat preview leaked into the production project");
for (const filename of ["chen-retreat.rules.v1.json", "chen-retreat.v1.json"]) {
  assert(!(await readdir(resource)).includes(filename), `Draft ${filename} must not enter production Resources`);
  assert(qaSpec.includes(filename), `QA project is missing ${filename}`);
}
assert(qaSpec.includes("SHI_RETREAT_PREVIEW"), "QA retreat condition missing");
const viewpoints = await readFile(resolve(root, "content/presentation/viewpoints.v1.json"));
assert(viewpoints.equals(await readFile(resolve(resource, "viewpoints.v1.json"))), "Native viewpoint presentation differs from shared prose");
const viewpointData = JSON.parse(viewpoints.toString());
assert.equal(viewpointData.schemaVersion, 1);
assert.deepEqual(Object.keys(viewpointData.scenes).sort(), ["council", "fanyang"]);
for (const scene of Object.values(viewpointData.scenes) as { title: Record<string, string>; text: Record<string, string>; bridge: Record<string, string> }[]) {
  for (const field of [scene.title, scene.text, scene.bridge]) for (const locale of ["en", "zh-Hans"]) assert(field[locale]?.trim(), `Missing ${locale} viewpoint prose`);
}
assert((await readFile(resolve(root, "assets/art/keyart/daze-village-rain-v1.png"))).equals(
  await readFile(resolve(resource, "daze-village-rain-v1.png")),
), "Native title art differs from the reviewed source");
assert((await readFile(resolve(root, "assets/mobile/shi-icon-1024.png"))).equals(
  await readFile(resolve(root, "apps/mobile/ios/SHI/Assets.xcassets/AppIcon.appiconset/AppIcon.png")),
), "Native app icon differs from the reviewed mobile identity");
const source = await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"));
const strategicChoices = JSON.parse(source.toString()).nodes.find((node: { id: string }) => node.id === "three-roads").choices.map((choice: { id: string }) => choice.id).sort();
assert.deepEqual(viewpointData.scenes.council.chapterBridges.map((item: { afterChoice: string }) => item.afterChoice).sort(), strategicChoices, "Council bridges must cover exactly the real chapter strategies");
for (const memory of viewpointData.scenes.council.chapterBridges) {
  for (const locale of ["en", "zh-Hans"]) assert(memory.text[locale]?.trim(), "Missing council strategy bridge translation");
}
assert(source.equals(await readFile(resolve(resource, "campaign.json"))), "Native campaign differs from the canonical campaign; run npm run sync:ios");
assert((await readFile(resolve(root, "content/councils/chen-council.v1.json"))).equals(await readFile(resolve(resource, "chen-council.v1.json"))), "Native council differs from its shared definition");
const hash = createHash("sha256").update(source).digest("hex");
assert((await readFile(resolve(root, "content/councils/fanyang-guarantee.v1.json"))).equals(await readFile(resolve(resource, "fanyang-guarantee.v1.json"))), "Native Fan Yang differs from its shared definition");
assert.equal((await readFile(resolve(resource, "campaign.sha256"), "utf8")).trim(), hash);
const actual = JSON.parse(await readFile(resolve(resource, "ui.json"), "utf8"));
assert.deepEqual(actual.engagementMetrics, engagementMetricLabels, "Native crossing metric labels drifted");
assert.deepEqual(actual.ui, ui, "Native UI text is stale");
assert.deepEqual(actual.localeNames, localeNames);
assert.deepEqual(actual.opposition, oppositionUi);
assert.deepEqual(Object.keys(actual.cinema).sort(), [...supportedLocales].sort());
const keys = Object.keys(cinemaKeys) as Array<keyof typeof cinemaKeys>;
for (const locale of supportedLocales) {
  assert.deepEqual(Object.keys(actual.cinema[locale]).sort(), [...keys].sort());
  for (const key of keys) {
    assert.equal(actual.cinema[locale][key], cinemaLabel(locale, key), `${locale}/${key}: native presentation label drift`);
    assert(actual.cinema[locale][key].trim().length > 0, `${locale}/${key}: missing label`);
  }
  assert.equal(actual.commitment[locale].answer, translateCommitment(locale, "answer"));
}
console.log(`Native content parity valid: campaign ${hash.slice(0, 12)}, ${supportedLocales.length} UI locales, ${supportedLocales.length * keys.length} cinematic labels and shared response labels.`);
