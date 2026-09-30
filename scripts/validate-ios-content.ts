import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { supportedLocales } from "@shi/game-core";
import { ui, localeNames } from "../apps/web/src/i18n";
import { cinemaKeys, cinemaLabel } from "../apps/web/src/cinema-labels";
import { oppositionUi } from "../apps/web/src/opposition-i18n";
import { translateCommitment } from "../apps/web/src/commitment-i18n";

const root = resolve(import.meta.dirname, "..");
const resource = resolve(root, "apps/mobile/ios/SHI/Resources");
assert((await readFile(resolve(root, "assets/art/keyart/daze-village-rain-v1.png"))).equals(
  await readFile(resolve(resource, "daze-village-rain-v1.png")),
), "Native title art differs from the reviewed source");
assert((await readFile(resolve(root, "assets/mobile/shi-icon-1024.png"))).equals(
  await readFile(resolve(root, "apps/mobile/ios/SHI/Assets.xcassets/AppIcon.appiconset/AppIcon.png")),
), "Native app icon differs from the reviewed mobile identity");
const source = await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"));
assert(source.equals(await readFile(resolve(resource, "campaign.json"))), "Native campaign differs from the canonical campaign; run npm run sync:ios");
assert((await readFile(resolve(root, "content/councils/chen-council.v1.json"))).equals(await readFile(resolve(resource, "chen-council.v1.json"))), "Native council differs from its shared definition");
const hash = createHash("sha256").update(source).digest("hex");
assert((await readFile(resolve(root, "content/councils/fanyang-guarantee.v1.json"))).equals(await readFile(resolve(resource, "fanyang-guarantee.v1.json"))), "Native Fan Yang differs from its shared definition");
assert.equal((await readFile(resolve(resource, "campaign.sha256"), "utf8")).trim(), hash);
const actual = JSON.parse(await readFile(resolve(resource, "ui.json"), "utf8"));
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
