import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { createHash } from "node:crypto";

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
const sourceEngagement = await readFile(resolve(root, "content/engagements/chapter-01-broken-crossing.v1.json"));
for (const relative of [
  "apps/web/src/generated/chapter-01-broken-crossing.v1.json",
  "apps/unity/Assets/StreamingAssets/chapter-01-broken-crossing.v1.json",
  "apps/unreal/Content/StreamingAssets/chapter-01-broken-crossing.v1.json",
]) {
  const generated = await readFile(resolve(root, relative));
  if (!sourceEngagement.equals(generated)) errors.push(`generated engagement candidate is stale: ${relative}`);
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
  "assets/art/lookdev/broken-crossing-command-space-v1.png",
  "assets/provenance/broken-crossing-command-space-v1.json",
  "assets/art/generation-inputs/shi-command-weight-v1-chroma.png",
  "assets/art/generation-inputs/shi-command-weight-v1.png",
  "assets/provenance/shi-command-weight-v1-input.json",
  "assets/provenance/shi-command-weight-v1-triposr-trial.json",
  "assets/provenance/shi-command-weight-v1.json",
  "docs/art/BROKEN_CROSSING_ENVIRONMENT_BRIEF.md",
  "docs/art/COMMAND_WEIGHT_PROP_BRIEF.md",
  "docs/art/COUNCIL_FIGURINE_DIRECTION.md",
  "docs/technical/AI_ASSET_TOOLCHAIN.md",
  "scripts/build-command-weight.py",
  "scripts/validate-command-weight.py",
  "scripts/import-command-weight-unreal.py",
]) if (!await exists(resolve(root, relative))) errors.push(`asset pipeline output missing: ${relative}`);

async function verifyHash(file, expected, label) {
  try {
    const bytes = await readFile(file);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== expected) errors.push(`${label} SHA-256 drifted`);
    return bytes;
  } catch {
    errors.push(`${label} is missing`);
    return null;
  }
}

const brokenCrossingProvenancePath = resolve(root, "assets/provenance/broken-crossing-command-space-v1.json");
const brokenCrossingProvenance = JSON.parse(await readFile(brokenCrossingProvenancePath, "utf8"));
const brokenCrossingBytes = await verifyHash(
  resolve(dirname(brokenCrossingProvenancePath), brokenCrossingProvenance.file),
  brokenCrossingProvenance.output?.sha256,
  "Broken Crossing lookdev",
);
if (brokenCrossingBytes && brokenCrossingBytes.byteLength !== brokenCrossingProvenance.output?.bytes) errors.push("Broken Crossing lookdev byte count drifted");
if (brokenCrossingProvenance.reviewStatus !== "approved-lookdev-reference-historical-specialist-required" || brokenCrossingProvenance.historicalStatus !== "Generated environment design, not archaeological or textual reconstruction evidence")
  errors.push("Broken Crossing provenance weakened its lookdev or historical-review boundary");
for (const input of brokenCrossingProvenance.inputs ?? []) {
  await verifyHash(resolve(dirname(brokenCrossingProvenancePath), input.file), input.sha256, `Broken Crossing input ${input.file}`);
}

const commandWeightInputPath = resolve(root, "assets/provenance/shi-command-weight-v1-input.json");
const commandWeightInput = JSON.parse(await readFile(commandWeightInputPath, "utf8"));
await verifyHash(resolve(dirname(commandWeightInputPath), commandWeightInput.files?.chromaSource), commandWeightInput.outputs?.chromaSourceSha256, "command-weight chroma input");
await verifyHash(resolve(dirname(commandWeightInputPath), commandWeightInput.files?.alphaInput), commandWeightInput.outputs?.alphaInputSha256, "command-weight alpha input");
if (commandWeightInput.reviewStatus !== "approved-ai-to-3d-trial-input-only" || !/not a claimed late-Qin artifact/.test(commandWeightInput.historicalStatus ?? ""))
  errors.push("command-weight input provenance weakened its technical-trial or historical boundary");

const rejectedTrial = JSON.parse(await readFile(resolve(root, "assets/provenance/shi-command-weight-v1-triposr-trial.json"), "utf8"));
if (rejectedTrial.status !== "rejected-before-cleanup-or-unreal-import" || rejectedTrial.review?.decision !== "reject" || rejectedTrial.rawOutput?.retention !== "Raw output and inspection renders retained outside Git; no generated mesh is packaged")
  errors.push("rejected TripoSR trial no longer preserves its rejection and outside-Git boundary");

if (errors.length) {
  console.error(`Repository validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Repository valid: ${expectedReadmes.length + 1} README languages, ${publicFiles.filter((path) => extname(path) === ".md").length} Markdown files, shared campaign/audio/engagement payloads synchronized.`);
