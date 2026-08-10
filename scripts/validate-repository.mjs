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
  "assets/provenance/shi-command-surface-v1.json",
  "assets/provenance/shi-wet-field-environment-v1.json",
  "assets/provenance/shi-daze-council-facial-performance-v1.json",
  "assets/provenance/shi-daze-council-skin-lookdev-v1.json",
  "assets/3d/source/shi-daze-council-facial-performance-v1-brown-eye-cc0.png",
  "assets/3d/source/shi-daze-council-facial-performance-v1.metrics.json",
  "assets/3d/source/shi-daze-council-facial-performance-v1.validation.json",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1.blend",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-lineup-front.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-lineup-oblique.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-neutral.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-blink.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-object-glance.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-interrupted-return.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-silent-speech.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-held-breath.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-fbx-import-neutral.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-fbx-import-blink.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-fbx-import-gaze.png",
  "assets/3d/rendered/shi-daze-council-facial-performance-v1-fbx-import-silent-speech.png",
  "assets/3d/export/shi-daze-council-facial-performance-v1-keeper.fbx",
  "assets/3d/export/shi-daze-council-facial-performance-v1-keeper.glb",
  "assets/3d/export/shi-daze-council-facial-performance-v1-chen-sheng.fbx",
  "assets/3d/export/shi-daze-council-facial-performance-v1-chen-sheng.glb",
  "assets/3d/export/shi-daze-council-facial-performance-v1-wu-guang.fbx",
  "assets/3d/export/shi-daze-council-facial-performance-v1-wu-guang.glb",
  "assets/3d/export/shi-daze-council-facial-performance-v1-yu-mu.fbx",
  "assets/3d/export/shi-daze-council-facial-performance-v1-yu-mu.glb",
  "assets/3d/export/shi-daze-council-facial-performance-v1-qin-courier.fbx",
  "assets/3d/export/shi-daze-council-facial-performance-v1-qin-courier.glb",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-basecolor-2k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-masks-2k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-height-1k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1.metrics.json",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1.validation.json",
  "assets/3d/source/shi-wet-field-environment-v1.metrics.json",
  "assets/3d/source/shi-wet-field-environment-v1.validation.json",
  "assets/3d/rendered/shi-wet-field-environment-v1.png",
  "assets/3d/rendered/shi-wet-field-environment-v1-profile.png",
  "assets/3d/rendered/shi-wet-field-environment-v1-glb-import.png",
  "assets/3d/rendered/shi-wet-field-environment-v1.blend",
  "assets/3d/export/shi-wet-field-environment-v1-lod0.glb",
  "assets/3d/export/shi-wet-field-environment-v1.fbx",
  "assets/3d/export/shi-wet-field-environment-v1-lod1.glb",
  "assets/3d/export/shi-wet-field-environment-v1-lod1.fbx",
  "docs/art/BROKEN_CROSSING_ENVIRONMENT_BRIEF.md",
  "docs/art/COMMAND_WEIGHT_PROP_BRIEF.md",
  "docs/art/COMMAND_SURFACE_BRIEF.md",
  "docs/art/FIELD_ENVIRONMENT_BRIEF.md",
  "docs/art/COUNCIL_FIGURINE_DIRECTION.md",
  "docs/art/DAZE_COUNCIL_FACIAL_PERFORMANCE_BRIEF.md",
  "docs/art/DAZE_COUNCIL_SKIN_LOOKDEV_BRIEF.md",
  "docs/production/THREE_YEAR_FILM_LEVEL_PLAN.md",
  "docs/technical/AI_ASSET_TOOLCHAIN.md",
  "docs/production/OPEN_SOURCE_3D_TOOLING_DECISION.md",
  "scripts/build-command-weight.py",
  "scripts/validate-command-weight.py",
  "scripts/import-command-weight-unreal.py",
  "scripts/build-command-surface.py",
  "scripts/validate-command-surface.py",
  "scripts/import-command-surface-unreal.py",
  "scripts/author-command-surface-materials-unreal.py",
  "scripts/build-field-environment.py",
  "scripts/validate-field-environment.py",
  "scripts/import-field-environment-unreal.py",
  "scripts/author-field-environment-materials-unreal.py",
  "scripts/build-daze-council-facial-performance.py",
  "scripts/validate-daze-council-facial-performance.py",
  "scripts/validate-daze-council-facial-performance-package.mjs",
  "scripts/import-daze-council-facial-performance-unreal.py",
  "scripts/build-daze-council-skin-lookdev.py",
  "scripts/validate-daze-council-skin-lookdev.py",
  "scripts/validate-daze-council-skin-lookdev-package.mjs",
  "scripts/sanitize-unreal-linux-development-package.mjs",
  "scripts/import-daze-council-skin-lookdev-unreal.py",
  "docs/production/evidence/unreal-command-surface-import-status.json",
  "docs/production/evidence/unreal-command-surface-presentation-status.json",
  "docs/production/evidence/unreal-wet-field-environment-import-status.json",
  "docs/production/evidence/unreal-wet-field-environment-presentation-status.json",
  "docs/production/evidence/unreal-daze-council-facial-performance-import-status.json",
  "docs/production/evidence/unreal-daze-council-facial-performance-runtime-status.json",
  "docs/production/evidence/unreal-daze-council-facial-performance-presentation-status.json",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-runtime-status.json",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-normal-material-qa-v2.png",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-object-glance-v2.png",
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-terminal-neutral-v2.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-speaker-silent-speech.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-speaker-blink.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-reduced-object-glance.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-reduced-terminal-neutral.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-keeper-listener.png",
  "docs/production/evidence/unreal-daze-council-facial-performance-v2-keeper-blink.png",
]) if (!await exists(resolve(root, relative))) errors.push(`asset pipeline output missing: ${relative}`);

// Fail closed on editor import metadata because Unreal texture assets can leak
// workstation source paths even when every public text file is clean.
const skinPrivacyUassets = {
  "M_SHI_ChenSheng_SkinLookdevV1.uasset": [11579, "13d8dde823611bfd15ef8aae330cb109304a1621da0511518220bedcd51eb1f3", null],
  "SP_SHI_ChenSheng_SkinLookdevV1.uasset": [1913, "c730da3eddda2a67fe60a39ea8cf3d6b32b792afbc7a2318536cdd3af3c6512b", null],
  "T_SHI_ChenSheng_Skin_BaseColor_2K.uasset": [2113116, "54122ea3a81132a263c0a7d3541a8a534bc472313133359d85d3982716393c87", "shi-daze-council-skin-lookdev-v1-basecolor-2k.png"],
  "T_SHI_ChenSheng_Skin_DetailNormal_1K.uasset": [1532856, "6378f416c33ca89161479c3cde2584a7958a623fa5a9c348f344873a2934e7bc", "shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png"],
  "T_SHI_ChenSheng_Skin_Masks_2K.uasset": [1472351, "392ddda8ce0af8b8821116682081234ce680e04899e78722b39331e87a216ee8", "shi-daze-council-skin-lookdev-v1-masks-2k.png"],
};
const skinPrivacyRoot = resolve(root, "apps/unreal/Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1");
for (const [file, [expectedBytes, expectedSha256, sourceBasename]] of Object.entries(skinPrivacyUassets)) {
  try {
    const binary = await readFile(resolve(skinPrivacyRoot, file));
    const sha256 = createHash("sha256").update(binary).digest("hex");
    const text = binary.toString("latin1");
    if (binary.byteLength !== expectedBytes || sha256 !== expectedSha256)
      errors.push(`skin privacy-v11 uasset receipt drifted: ${file}`);
    for (const token of ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "Factory_/", "InterchangeAssetImportData"])
      if (text.includes(token)) errors.push(`skin uasset embeds forbidden private-path or Interchange metadata: ${file}`);
    if (sourceBasename === null) {
      if (text.includes("AssetImportData") || text.includes("RelativeFilename"))
        errors.push(`skin material/profile unexpectedly embeds source import metadata: ${file}`);
    } else if (!text.includes("AssetImportData") || !text.includes("RelativeFilename") || !text.includes(sourceBasename)) {
      errors.push(`skin texture omits Base AssetImportData, relative filename or source basename: ${file}`);
    }
  } catch {
    errors.push(`skin privacy-v11 uasset is missing or unreadable: ${file}`);
  }
}

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
