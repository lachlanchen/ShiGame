import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "content/campaigns/chapter-01-daze.json");
const outputs = [
  resolve(root, "apps/web/src/generated/chapter-01-daze.json"),
  resolve(root, "apps/unity/Assets/StreamingAssets/chapter-01-daze.json"),
];
const contents = await readFile(source);
const campaign = JSON.parse(contents.toString("utf8"));
const sha256 = createHash("sha256").update(contents).digest("hex");

for (const output of outputs) {
  await mkdir(dirname(output), { recursive: true });
  await copyFile(source, output);
}
const webGameplay = { ...campaign, claims: [] };
await writeFile(resolve(root, "apps/web/src/generated/chapter-01-gameplay.json"), `${JSON.stringify(webGameplay)}\n`);
await writeFile(resolve(root, "apps/web/src/generated/chapter-01-claims.json"), `${JSON.stringify(campaign.claims)}\n`);
const webKeyArt = resolve(root, "apps/web/public/art/keyart/daze-village-rain-v1.png");
await mkdir(dirname(webKeyArt), { recursive: true });
await copyFile(resolve(root, "assets/art/keyart/daze-village-rain-v1.png"), webKeyArt);
await copyFile(resolve(root, "assets/favicon.svg"), resolve(root, "apps/web/public/favicon.svg"));
await writeFile(resolve(root, "content/campaigns/chapter-01-daze.sha256"), `${sha256}\n`);
await copyFile(
  resolve(root, "assets/art/keyart/daze-village-rain-v1.png"),
  resolve(root, "apps/unity/Assets/StreamingAssets/daze-village-rain-v1.png"),
);
await copyFile(
  resolve(root, "assets/3d/export/shi-daze-wartable-v1.fbx"),
  resolve(root, "apps/unity/Assets/StreamingAssets/shi-daze-wartable-v1.fbx"),
);
console.log(`Synced campaign ${sha256.slice(0, 12)} to Unity and lossless web transport slices.`);
