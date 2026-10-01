import { copyFile, mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { localeNames } from "../apps/web/src/i18n";
import { ui } from "../apps/web/src/ui-catalog";
import { cinemaKeys, cinemaLabel } from "../apps/web/src/cinema-labels";
import { supportedLocales } from "@shi/game-core";
import { oppositionUi } from "../apps/web/src/opposition-i18n";
import { translateCommitment } from "../apps/web/src/commitment-i18n";
import { engagementMetricLabels } from "../apps/web/src/engagement-i18n";

const root = resolve(import.meta.dirname, "..");
const target = resolve(root, "apps/mobile/ios/SHI/Resources");
await mkdir(target, { recursive: true });
const source = resolve(root, "content/campaigns/chapter-01-daze.json");
await copyFile(source, resolve(target, "campaign.json"));
await copyFile(resolve(root, "content/compatibility/chapter-01-save-compatibility.v1.json"), resolve(target, "chapter-01-save-compatibility.v1.json"));
await copyFile(resolve(root, "content/councils/chen-council.v1.json"), resolve(target, "chen-council.v1.json"));
await copyFile(resolve(root, "content/councils/fanyang-guarantee.v1.json"), resolve(target, "fanyang-guarantee.v1.json"));
await copyFile(resolve(root, "content/presentation/viewpoints.v1.json"), resolve(target, "viewpoints.v1.json"));
const hash = createHash("sha256").update(await readFile(source)).digest("hex");
await writeFile(resolve(target, "campaign.sha256"), `${hash}\n`);
const cinema = Object.fromEntries(supportedLocales.map(locale => [locale, Object.fromEntries(
  (Object.keys(cinemaKeys) as Array<keyof typeof cinemaKeys>).map(key => [key, cinemaLabel(locale, key)]),
)]));
const commitment = Object.fromEntries(supportedLocales.map(locale => [locale, { answer: translateCommitment(locale, "answer") }]));
await writeFile(resolve(target, "ui.json"), JSON.stringify({ ui, localeNames, cinema, opposition: oppositionUi, commitment, engagementMetrics: engagementMetricLabels }));
await copyFile(resolve(root, "assets/art/keyart/daze-village-rain-v1.png"), resolve(target, "daze-village-rain-v1.png"));
console.log(`Native iOS campaign + existing UI translations synchronized: ${hash}`);
