import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const excluded = new Set([".git", ".runtime", "node_modules", "references", "dist", "Library", "Temp", "Logs"]);
const errors = [];
const expectedReadmes = ["ar", "de", "es", "fr", "ja", "ko", "ru", "vi", "zh-Hans", "zh-Hant"].map((locale) => `i18n/README.${locale}.md`);

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

for (const relative of ["README.md", ...expectedReadmes, "CITATION.cff", "LICENSE.md", "SECURITY.md", "CONTRIBUTING.md"]) {
  if (!await exists(resolve(root, relative))) errors.push(`missing required project file: ${relative}`);
}

const publicFiles = await walk(root);
for (const file of publicFiles.filter((path) => extname(path) === ".md")) {
  const markdown = await readFile(file, "utf8");
  if (markdown.includes("/home/lachlan/")) errors.push(`public Markdown contains an absolute workstation path: ${file.slice(root.length + 1)}`);
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    if (/^(https?:|mailto:|#)/.test(raw)) continue;
    const pathText = decodeURIComponent(raw.split("#")[0]);
    if (!pathText) continue;
    if (!await exists(resolve(dirname(file), pathText))) errors.push(`broken local link in ${file.slice(root.length + 1)}: ${raw}`);
  }
}

const sourceCampaign = await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"));
for (const relative of [
  "apps/web/src/generated/chapter-01-daze.json",
  "apps/unity/Assets/StreamingAssets/chapter-01-daze.json",
  "apps/unreal/Content/StreamingAssets/chapter-01-daze.json",
]) {
  const generated = await readFile(resolve(root, relative));
  if (!sourceCampaign.equals(generated)) errors.push(`generated campaign is stale: ${relative}`);
}
const parsedCampaign = JSON.parse(sourceCampaign.toString("utf8"));
const webGameplay = JSON.parse(await readFile(resolve(root, "apps/web/src/generated/chapter-01-gameplay.json"), "utf8"));
const webHorizon = JSON.parse(await readFile(resolve(root, "apps/web/src/generated/chapter-01-horizon.json"), "utf8"));
const webClaims = JSON.parse(await readFile(resolve(root, "apps/web/src/generated/chapter-01-claims.json"), "utf8"));
const webOpposition = JSON.parse(await readFile(resolve(root, "apps/web/src/generated/chapter-01-opposition.json"), "utf8"));
const webCommitments = JSON.parse(await readFile(resolve(root, "apps/web/src/generated/chapter-01-commitments.json"), "utf8"));
if (JSON.stringify({ ...webGameplay, acts: webHorizon, claims: webClaims, commitments: webCommitments, opposition: webOpposition }) !== JSON.stringify(parsedCampaign))
  errors.push("generated web gameplay/horizon/claim/commitment/opposition slices do not reconstruct the canonical campaign");
const sourceAudio = await readFile(resolve(root, "content/audio/chapter-01-audio.json"));
for (const relative of [
  "apps/web/src/generated/chapter-01-audio.json",
  "apps/unity/Assets/StreamingAssets/chapter-01-audio.json",
  "apps/unreal/Content/StreamingAssets/chapter-01-audio.json",
]) {
  const generated = await readFile(resolve(root, relative));
  if (!sourceAudio.equals(generated)) errors.push(`generated audio contract is stale: ${relative}`);
}
const sourceConformance = await readFile(resolve(root, "content/conformance/chapter-01-replays.v1.json"));
for (const relative of [
  "apps/unreal/Content/StreamingAssets/chapter-01-replays.v1.json",
  "apps/unity/Assets/StreamingAssets/chapter-01-replays.v1.json",
]) {
  const generated = await readFile(resolve(root, relative));
  if (!sourceConformance.equals(generated)) errors.push(`generated replay conformance contract is stale: ${relative}`);
}

for (const relative of [
  "assets/art/keyart/daze-village-rain-v1.png",
  "assets/provenance/daze-village-rain-v1.json",
  "assets/3d/source/shi-wartable.scene.json",
  "assets/3d/rendered/shi-daze-wartable-v1.png",
  "assets/3d/rendered/shi-daze-wartable-v1.blend",
  "assets/3d/export/shi-daze-wartable-v1.glb",
  "assets/3d/export/shi-daze-wartable-v1.fbx",
  "assets/provenance/shi-daze-wartable-v1.json",
  "assets/provenance/chapter-01-audio.json",
]) if (!await exists(resolve(root, relative))) errors.push(`asset pipeline output missing: ${relative}`);

if (errors.length) {
  console.error(`Repository validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Repository valid: ${expectedReadmes.length + 1} README languages, ${publicFiles.filter((path) => extname(path) === ".md").length} Markdown files, shared campaign/audio payloads synchronized.`);
