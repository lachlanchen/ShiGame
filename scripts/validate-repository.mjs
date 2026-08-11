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
  "assets/provenance/shi-daze-council-wet-register-interaction-v1.json",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1.blend",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-prop.fbx",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-prop.glb",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-chen-sheng.fbx",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-chen-sheng.glb",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1.metrics.json",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1.validation.json",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-oblique-frame-001.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-oblique-frame-031.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-oblique-frame-061.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-oblique-frame-091.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-oblique-frame-121.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-front-frame-061.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-profile-frame-061.png",
  "assets/3d/source/shi-daze-council-wet-register-interaction-v1-council-44deg-frame-061.png",
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
  "scripts/build-daze-council-wet-register-interaction.py",
  "scripts/validate-daze-council-wet-register-interaction.py",
  "scripts/import-daze-council-wet-register-interaction-unreal.py",
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
  "docs/production/evidence/unreal-daze-council-wet-register-interaction-import-status.json",
  "docs/production/evidence/unreal-daze-council-wet-register-interaction-runtime-status.json",
  "docs/production/evidence/unreal-daze-council-wet-register-interaction-presentation-status.json",
  "docs/production/evidence/unreal-daze-council-wet-register-normal-held-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-normal-later-physical-separation-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-normal-release-onset-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-normal-terminal-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-held-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-release-v1.png",
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-terminal-v1.png",
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

const wetRegisterRuntimePath = resolve(root, "docs/production/evidence/unreal-daze-council-wet-register-interaction-runtime-status.json");
const wetRegisterImportPath = resolve(root, "docs/production/evidence/unreal-daze-council-wet-register-interaction-import-status.json");
const wetRegisterPresentationPath = resolve(root, "docs/production/evidence/unreal-daze-council-wet-register-interaction-presentation-status.json");
const wetRegisterProvenancePath = resolve(root, "assets/provenance/shi-daze-council-wet-register-interaction-v1.json");
let wetRegisterRuntime = {};
let wetRegisterImport = {};
let wetRegisterPresentation = {};
let wetRegisterProvenance = {};
let wetRegisterRuntimeText = "";
let wetRegisterImportText = "";
let wetRegisterPresentationText = "";
let wetRegisterPresentationBytes = null;
try {
  wetRegisterRuntimeText = await readFile(wetRegisterRuntimePath, "utf8");
  wetRegisterImportText = await readFile(wetRegisterImportPath, "utf8");
  wetRegisterPresentationBytes = await readFile(wetRegisterPresentationPath);
  wetRegisterPresentationText = wetRegisterPresentationBytes.toString("utf8");
  wetRegisterRuntime = JSON.parse(wetRegisterRuntimeText);
  wetRegisterImport = JSON.parse(wetRegisterImportText);
  wetRegisterPresentation = JSON.parse(wetRegisterPresentationText);
  wetRegisterProvenance = JSON.parse(await readFile(wetRegisterProvenancePath, "utf8"));
} catch {
  errors.push("wet-register provenance/import/runtime/presentation evidence is missing or invalid JSON");
}
for (const [label, text] of [["runtime", wetRegisterRuntimeText], ["import", wetRegisterImportText], ["presentation", wetRegisterPresentationText]])
  for (const token of ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "SecurityToken="])
    if (text.includes(token)) errors.push(`wet-register ${label} evidence contains an absolute workstation path`);

if (wetRegisterProvenance.assetId !== "shi-daze-council-wet-register-interaction-v1"
    || wetRegisterProvenance.status !== "engineering-only source candidate; no final, historical, cinematic or engine approval"
    || wetRegisterProvenance.reviewStatus?.engineAdmission !== false
    || wetRegisterProvenance.reviewStatus?.sourceEngineering !== false
    || wetRegisterProvenance.reviewStatus?.humanHistoricalCulturalApproval !== false
    || wetRegisterProvenance.reviewStatus?.finalProp !== false
    || wetRegisterProvenance.reviewStatus?.finalHandAnimation !== false
    || wetRegisterProvenance.reviewStatus?.anatomy !== false
    || wetRegisterProvenance.reviewStatus?.cinematic !== false
    || wetRegisterProvenance.reviewStatus?.accessibility !== false
    || wetRegisterProvenance.reviewStatus?.playerOwnershipContinuity !== false)
  errors.push("wet-register source provenance no longer preserves its source-only all-red approval boundary");

const wetRegisterGates = wetRegisterRuntime.releaseGates;
if (wetRegisterRuntime.assetId !== "shi-daze-council-wet-register-interaction-v1"
    || wetRegisterRuntime.status !== "import-native-package-runtime-and-watched-route-engineering-pass; visible-mesh-contact-human-historical-cultural-cinematic-accessibility-and-final gates red"
    || wetRegisterRuntime.admissionBoundary?.sourceReceipt?.immutableImportTimeSnapshot !== true
    || wetRegisterRuntime.admissionBoundary?.sourceReceipt?.currentMutableCrossReceipt !== false
    || wetRegisterRuntime.admissionBoundary?.sourceReceipt?.reviewStatusRemainsSourceScoped?.engineAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.sourceReceipt?.reviewStatusRemainsSourceScoped?.finalProp !== false
    || wetRegisterRuntime.admissionBoundary?.sourceReceipt?.reviewStatusRemainsSourceScoped?.finalHandAnimation !== false
    || wetRegisterRuntime.admissionBoundary?.separateEngineeringEngineAdmission !== true
    || wetRegisterRuntime.admissionBoundary?.engineeringAdmissionBasis?.length !== 7
    || wetRegisterRuntime.admissionBoundary?.packageAdmission !== true
    || wetRegisterRuntime.admissionBoundary?.liveRuntimeMarkerAdmission !== true
    || wetRegisterRuntime.admissionBoundary?.visibleNoVncAdmission !== true
    || wetRegisterRuntime.admissionBoundary?.visibleNoVncEngineeringOnly !== true
    || wetRegisterRuntime.admissionBoundary?.visibleMeshContactClearanceAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.materialArtAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.playerOwnershipContinuityAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.humanHistoricalCulturalAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.humanAnatomyAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.humanCinematicAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.closeCameraAdmission !== false
    || wetRegisterRuntime.admissionBoundary?.finalProp !== false
    || wetRegisterRuntime.admissionBoundary?.finalHandAnimation !== false
    || wetRegisterRuntime.admissionBoundary?.finalCharacterArt !== false
    || wetRegisterGates?.exactAlwaysCookRoot !== "pass-567-packages-three-isolated-assets-engineering-only"
    || wetRegisterGates?.packagedBuildWithWetRegisterAssets !== "pass-engineering-only"
    || wetRegisterGates?.liveRuntimeAdmissionMarkers !== "pass-normal-and-reduced-engineering-only"
    || wetRegisterGates?.normalMotionVisibleNoVncReview !== "pass-engineering-only"
    || wetRegisterGates?.reducedMotionVisibleNoVncReview !== "pass-engineering-only"
    || wetRegisterGates?.visibleFallbackReview !== "not-run"
    || wetRegisterGates?.visibleHandMeshReview !== "pending-human-review"
    || wetRegisterGates?.visibleMeshContactAndClearanceReview !== "required"
    || wetRegisterGates?.materialArtReview !== "pending-human-review"
    || wetRegisterGates?.playerOwnershipContinuityReview !== "pending-human-review"
    || wetRegisterGates?.humanHandAnatomyAndContactReview !== "required"
    || wetRegisterGates?.humanHistoricalMaterialAndCulturalReview !== "required"
    || wetRegisterGates?.humanCinematicFramingAndActingReview !== "required"
    || wetRegisterGates?.cinematicContinuityReview !== "required"
    || wetRegisterGates?.humanAccessibilityAndLocalizationReview !== "required"
    || wetRegisterGates?.mouthInteriorVoiceAndMultilingualLipSync !== "not-admitted"
    || wetRegisterGates?.closeCameraUse !== "rejected"
    || wetRegisterGates?.finalProp !== "not-admitted"
    || wetRegisterGates?.finalHandAnimation !== "not-admitted"
    || wetRegisterGates?.finalCharacterArt !== "not-admitted")
  errors.push("wet-register runtime evidence overstates source, package, visible, human-review or final approval");
if (wetRegisterRuntime.authoredRuntimeMarkers?.status !== "observed-once-in-order-in-normal-v5-and-reduced-v5-inert-packaged-routes-engineering-only"
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedInPackagedRuntime !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.admission?.token !== "SHI_COUNCIL_WET_REGISTER_INTERACTION_RUNTIME_ADMITTED"
    || wetRegisterRuntime.authoredRuntimeMarkers?.admission?.requiredFields?.playerOwnershipContinuity !== false
    || wetRegisterRuntime.authoredRuntimeMarkers?.admission?.requiredFields?.humanHistoricalCulturalReview !== false
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.token !== "SHI_COUNCIL_WET_REGISTER_INTERACTION_HELD_QUESTION"
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.semanticSample !== 60
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.leftOwner !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.rightContact !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.playerOwnershipContinuity !== false
    || wetRegisterRuntime.authoredRuntimeMarkers?.heldQuestion?.humanHistoricalCulturalReview !== false
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.token
      !== "SHI_COUNCIL_WET_REGISTER_INTERACTION_ORDERED_RELEASE"
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.semanticSample !== 90
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.standardMotionPoseSampleAtExactBoundary !== 90
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease
      ?.normalMotionFirstMarkerPoseSamplesAllowed?.join(",") !== "90,91"
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.reducedMotionPoseSample !== 91
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.rightContact !== false
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.physicalContactExitSample !== 91
    || wetRegisterRuntime.authoredRuntimeMarkers?.orderedRelease?.semanticAndPhysicalBoundaryDistinct !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.normal?.bilateralPoseSample !== 31
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.normal?.heldPoseSample !== 60
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.normal?.orderedReleasePoseSample !== 90
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.normal?.terminalPoseSample !== 120
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.reduced?.bilateralPoseSample !== 30
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.reduced?.heldPoseSample !== 60
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.reduced?.orderedReleasePoseSample !== 91
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.reduced?.terminalPoseSample !== 120
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.eachMarkerExactlyOnce !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.ordered !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.storyAndSaveInert !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.observedPackagedRoutes?.cleanControlledShutdown !== true
    || wetRegisterRuntime.authoredRuntimeMarkers?.packageMarkerGateRemainsPending !== false)
  errors.push("wet-register authored/observed marker schema loses sample-90 onset, sample-91 physical exit or exact inert packaged-route evidence");

const wetRegisterRuntimePresentation = wetRegisterRuntime.packageRuntimeAdmission;
if (wetRegisterRuntimePresentation?.status !== "pass-engineering-only"
    || wetRegisterRuntimePresentation?.presentationEvidence?.file
      !== "docs/production/evidence/unreal-daze-council-wet-register-interaction-presentation-status.json"
    || wetRegisterRuntimePresentation?.presentationEvidence?.tracked !== true
    || wetRegisterRuntimePresentation?.presentationEvidence?.bytes !== 40822
    || wetRegisterRuntimePresentation?.presentationEvidence?.sha256
      !== "3910929d223ddac6bd20d5240bcec24cceed9d3572a535cfe89b07396999f8ef"
    || wetRegisterRuntimePresentation?.package?.result !== "BUILD SUCCESSFUL"
    || wetRegisterRuntimePresentation?.package?.cookedPackageCount !== 567
    || wetRegisterRuntimePresentation?.package?.isolatedAssetCount !== 3
    || wetRegisterRuntimePresentation?.package?.pathSanitized !== true
    || wetRegisterRuntimePresentation?.package?.currentWorkstationPathMarkerCount !== 0
    || wetRegisterRuntimePresentation?.package?.afsCredentialValueRecorded !== false
    || wetRegisterRuntimePresentation?.package?.temporaryPostCookSnapshotGloballyCredentialFreeClaim !== false
    || wetRegisterRuntimePresentation?.runtimeLogs?.normalV5?.bytes !== 127773
    || wetRegisterRuntimePresentation?.runtimeLogs?.normalV5?.sha256
      !== "1665f5e89d8fbe08e7a08f7b91bf1918b885ec91519e9c21338037cdc5786e97"
    || wetRegisterRuntimePresentation?.runtimeLogs?.normalV5?.warningSeverityMarkers !== 12
    || wetRegisterRuntimePresentation?.runtimeLogs?.normalV5?.errorSeverityMarkers !== 0
    || wetRegisterRuntimePresentation?.runtimeLogs?.normalV5?.cleanUnrealShutdown !== true
    || wetRegisterRuntimePresentation?.runtimeLogs?.reducedV5?.bytes !== 127679
    || wetRegisterRuntimePresentation?.runtimeLogs?.reducedV5?.sha256
      !== "b18d11a83651181b3457202e35f569d9cf75c08e247f8122c6131400bc44e265"
    || wetRegisterRuntimePresentation?.runtimeLogs?.reducedV5?.warningSeverityMarkers !== 12
    || wetRegisterRuntimePresentation?.runtimeLogs?.reducedV5?.errorSeverityMarkers !== 0
    || wetRegisterRuntimePresentation?.runtimeLogs?.reducedV5?.cleanUnrealShutdown !== true
    || wetRegisterRuntimePresentation?.runtimeLogs?.campaignSaveAbsentBeforeAndAfterBothRuns !== true
    || wetRegisterRuntimePresentation?.runtimeLogs?.storyProgressionObserved !== false
    || wetRegisterRuntimePresentation?.watchedEvidence?.trackedScreenshotCount !== 7
    || wetRegisterRuntimePresentation?.watchedEvidence?.rawXwdToTrackedPngPixelDifferenceCountEach !== 0
    || wetRegisterRuntimePresentation?.watchedEvidence?.normalLaterPhysicalSeparation?.exactSample91Proof !== false
    || wetRegisterRuntimePresentation?.watchedEvidence?.reducedRelease?.poseSample !== 91
    || wetRegisterRuntimePresentation?.watchedEvidence?.reducedRelease?.wristMarkerEngineeringExit !== true
    || wetRegisterRuntimePresentation?.watchedEvidence?.reducedRelease?.visibleSeparationLegibleAtFullFrame !== false
    || wetRegisterRuntimePresentation?.watchedEvidence?.reducedRelease?.fingersAppearOverlappingAtFullFrame !== true
    || wetRegisterRuntimePresentation?.watchedEvidence?.reducedRelease?.visibleMeshClearanceProof !== false
    || wetRegisterRuntimePresentation?.engineeringAdmission !== true
    || wetRegisterRuntimePresentation?.visibleHandMeshReviewApproved !== false
    || wetRegisterRuntimePresentation?.visibleMeshContactClearanceApproved !== false
    || wetRegisterRuntimePresentation?.playerOwnershipContinuityReviewApproved !== false
    || wetRegisterRuntimePresentation?.humanHistoricalCulturalReviewApproved !== false
    || wetRegisterRuntimePresentation?.humanAnatomyReviewApproved !== false
    || wetRegisterRuntimePresentation?.humanCinematicReviewApproved !== false
    || wetRegisterRuntimePresentation?.humanAccessibilityLocalizationReviewApproved !== false
    || wetRegisterRuntimePresentation?.closeCameraApproved !== false
    || wetRegisterRuntimePresentation?.mouthInteriorApproved !== false
    || wetRegisterRuntimePresentation?.voiceApproved !== false
    || wetRegisterRuntimePresentation?.lipSyncApproved !== false
    || wetRegisterRuntimePresentation?.finalProp !== false
    || wetRegisterRuntimePresentation?.finalHandAnimation !== false
    || wetRegisterRuntimePresentation?.finalCharacterArt !== false)
  errors.push("wet-register runtime does not cross-bind the exact watched presentation receipt, two-route caveats and all red gates");

try {
  const importBytes = await readFile(wetRegisterImportPath);
  const importSha256 = createHash("sha256").update(importBytes).digest("hex");
  if (importBytes.byteLength !== 72005
      || importSha256 !== "814e6c2767f6adc6c235dc7a16231adb83a703cd381627a4962aa16b432ed583"
      || wetRegisterRuntime.importAdmission?.evidence?.bytes !== importBytes.byteLength
      || wetRegisterRuntime.importAdmission?.evidence?.sha256 !== importSha256)
    errors.push("wet-register current import-status receipt drifted");
} catch {
  errors.push("wet-register current import-status receipt is missing");
}
if (wetRegisterImport.mode !== "import-replace" || wetRegisterImport.mutationAuthorized !== true
    || wetRegisterImport.saved !== true || wetRegisterImport.passed !== true
    || wetRegisterImport.destination !== "/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1"
    || wetRegisterImport.readOnlyInspection?.mode !== "inspect-only"
    || wetRegisterImport.readOnlyInspection?.mutationAuthorized !== false
    || wetRegisterImport.readOnlyInspection?.distinctFromImportProcess !== true
    || wetRegisterImport.readOnlyInspection?.exitCode !== 0
    || wetRegisterImport.readOnlyInspection?.passed !== true
    || wetRegisterImport.readOnlyInspection?.immutableImportReceiptRootSha256
      !== "85c64e8515e6cc17a23528cbdec90823ee4ada2f4635eafbb7eb69c814913fb8"
    || wetRegisterImport.readOnlyInspection?.canonicalImportReceiptRootPreserved !== true
    || wetRegisterImport.readOnlyInspection?.trackedUassetHashesUnchanged !== true
    || wetRegisterImport.readOnlyInspection?.embeddedMetadataPrivacyPassed !== true
    || wetRegisterImport.readOnlyInspection?.compressedRuntimeDataValid !== true
    || wetRegisterImport.readOnlyInspection?.all121By53TransformsResampled !== true
    || wetRegisterImport.acceptedAssetPreservation?.checks?.acceptedFacialHashesUnchanged !== true
    || wetRegisterImport.acceptedAssetPreservation?.checks?.acceptedSkinHashesUnchanged !== true
    || wetRegisterImport.acceptedAssetPreservation?.checks?.sharedSkeletonPackageAndReferencePoseUnchanged !== true)
  errors.push("wet-register import evidence omits its exact import-replace, nested inspect-only or accepted-asset-preservation boundary");

const wetRegisterPrivacyUassets = {
  "A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01.uasset": [168077, "264ae1b9a1ca0b2b0e05e3351248562e4d2d88c83a1c1d80590eeb60b0062b29"],
  "M_SHI_DazeCouncil_WetRegister_Clay_01.uasset": [10704, "63c89e6a26fc81285a364bf41966964c5835330ba36c7733d307cdf01a731755"],
  "SM_SHI_DazeCouncil_WetRegister_Blockout_01.uasset": [22679, "a4e4403b906eeb7df49bdcd1ba766f036d4926e6a05194affd7af75091a17df8"],
};
const wetRegisterPrivacyRoot = resolve(root, "apps/unreal/Content/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1");
if (Object.keys(wetRegisterRuntime.trackedUnrealAssets?.receipts ?? {}).sort().join("\n")
      !== Object.keys(wetRegisterPrivacyUassets).sort().join("\n")
    || Object.keys(wetRegisterImport.trackedUnrealAssets?.receipts ?? {}).sort().join("\n")
      !== Object.keys(wetRegisterPrivacyUassets).sort().join("\n"))
  errors.push("wet-register evidence does not bind exactly three tracked uassets");
for (const [file, [expectedBytes, expectedSha256]] of Object.entries(wetRegisterPrivacyUassets)) {
  try {
    const binary = await readFile(resolve(wetRegisterPrivacyRoot, file));
    const sha256 = createHash("sha256").update(binary).digest("hex");
    const text = binary.toString("latin1");
    const runtimeReceipt = wetRegisterRuntime.trackedUnrealAssets?.receipts?.[file];
    const importReceipt = wetRegisterImport.trackedUnrealAssets?.receipts?.[file];
    if (binary.byteLength !== expectedBytes || sha256 !== expectedSha256
        || runtimeReceipt?.bytes !== expectedBytes || runtimeReceipt?.sha256 !== expectedSha256
        || importReceipt?.bytes !== expectedBytes || importReceipt?.sha256 !== expectedSha256)
      errors.push(`wet-register uasset receipt drifted: ${file}`);
    for (const token of ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "InterchangeAssetImportData", "@crypt_", "Bearer "])
      if (text.includes(token)) errors.push(`wet-register uasset embeds a private path, Interchange metadata or credential marker: ${file}`);
  } catch {
    errors.push(`wet-register uasset is missing or unreadable: ${file}`);
  }
}

for (const receipt of [
  wetRegisterRuntime.admissionBoundary?.sourceReceipt,
  ...Object.values(wetRegisterRuntime.sourceContractReceipts ?? {}),
  ...(wetRegisterRuntime.toolchainReceipts ?? []),
  ...(wetRegisterRuntime.compiledSourceSnapshot ?? []),
]) {
  if (!receipt?.file || !Number.isInteger(receipt.bytes) || receipt.bytes <= 0
      || !/^[0-9a-f]{64}$/.test(receipt.sha256 ?? "")) {
    errors.push("wet-register runtime manifest contains an incomplete source/tool/compiled receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, receipt.file));
    if (bytes.byteLength !== receipt.bytes
        || createHash("sha256").update(bytes).digest("hex") !== receipt.sha256)
      errors.push(`wet-register source/tool/compiled receipt drifted: ${receipt.file}`);
  } catch {
    errors.push(`wet-register source/tool/compiled receipt is missing: ${receipt.file}`);
  }
}
if (Object.keys(wetRegisterRuntime.sourceContractReceipts ?? {}).length !== 4
    || wetRegisterRuntime.toolchainReceipts?.length !== 6
    || wetRegisterRuntime.compiledSourceSnapshot?.length !== 8
    || wetRegisterRuntime.nativeBuild?.transientLog?.tracked !== false
    || wetRegisterRuntime.nativeBuild?.actionCount !== 41
    || wetRegisterRuntime.nativeBuild?.completedActionCount !== 41
    || wetRegisterRuntime.nativeBuild?.transientLog?.bytes !== 5673
    || wetRegisterRuntime.nativeBuild?.transientLog?.sha256 !== "3474ef9841e2213746f25d0fdf514c276daff05ea235474ad9a53486a579326f"
    || wetRegisterRuntime.automation?.focusedWetRegisterSuite?.passed !== 1
    || wetRegisterRuntime.automation?.focusedWetRegisterSuite?.transientLog?.bytes !== 243218
    || wetRegisterRuntime.automation?.focusedWetRegisterSuite?.transientLog?.sha256 !== "223e725b6edd74dff1ab550086abeb67e3fd24fe610e5b549ff862b7d68342d5"
    || wetRegisterRuntime.automation?.fullShiNamespace?.passed !== 22
    || wetRegisterRuntime.automation?.fullShiNamespace?.failed !== 0
    || wetRegisterRuntime.automation?.fullShiNamespace?.tests?.length !== 22
    || wetRegisterRuntime.automation?.fullShiNamespace?.transientLog?.bytes !== 262237
    || wetRegisterRuntime.automation?.fullShiNamespace?.transientLog?.sha256 !== "1cb22dff1b4e988a010c07abb118b9eb8a2fb4679f049affb6d78112d4fe32d8")
  errors.push("wet-register manifest omits current source/helper/config, v7 41/41 build, focused 1/1 or full 22/22 receipts");

const wetRegisterPresentationSha256 = wetRegisterPresentationBytes
  ? createHash("sha256").update(wetRegisterPresentationBytes).digest("hex")
  : "";
if (wetRegisterPresentationBytes?.byteLength !== 40822
    || wetRegisterPresentationSha256 !== "3910929d223ddac6bd20d5240bcec24cceed9d3572a535cfe89b07396999f8ef")
  errors.push("wet-register presentation receipt drifted from the final watched Gate 5A record");

const wetRegisterPresentationDecision = "package-runtime-engineering-pass-visible-blockout-review-only-not-final-not-close-camera-not-human-reviewed";
const wetRegisterPresentationDisclosure = "PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER · NOT FINAL HAND PERFORMANCE OR CLOSE-CAMERA AUTHORITY";
if (wetRegisterPresentation.schemaVersion !== 1
    || wetRegisterPresentation.assetId !== "shi-daze-council-wet-register-interaction-v1"
    || wetRegisterPresentation.decision !== wetRegisterPresentationDecision
    || wetRegisterPresentation.requiredDisclosure !== wetRegisterPresentationDisclosure
    || !wetRegisterPresentation.scope?.includes("visible mesh contact and clearance")
    || !wetRegisterPresentation.scope?.includes("accessibility, localization")
    || !wetRegisterPresentation.historicalBoundary?.includes("not an authenticated surviving Qin object")
    || !wetRegisterPresentation.historicalBoundary?.includes("Human historical and cultural review has not occurred"))
  errors.push("wet-register presentation overstates its watched blockout, historical or review boundary");

const wetRegisterPresentationImport = wetRegisterPresentation.importAdmission;
if (wetRegisterPresentationImport?.status !== "pass"
    || wetRegisterPresentationImport?.file !== "docs/production/evidence/unreal-daze-council-wet-register-interaction-import-status.json"
    || wetRegisterPresentationImport?.tracked !== true
    || wetRegisterPresentationImport?.bytes !== 72005
    || wetRegisterPresentationImport?.sha256 !== "814e6c2767f6adc6c235dc7a16231adb83a703cd381627a4962aa16b432ed583"
    || wetRegisterPresentationImport?.immutableImportReceiptRootSha256 !== "85c64e8515e6cc17a23528cbdec90823ee4ada2f4635eafbb7eb69c814913fb8"
    || wetRegisterPresentationImport?.canonicalImportReceiptRootPreserved !== true
    || wetRegisterPresentationImport?.readOnlyInspectionPassed !== true
    || wetRegisterPresentationImport?.trackedUassetHashesUnchanged !== true
    || wetRegisterPresentationImport?.embeddedMetadataPrivacyPassed !== true
    || wetRegisterPresentationImport?.engineeringOnly !== true
    || wetRegisterPresentationImport?.humanHistoricalCulturalReviewApproved !== false
    || wetRegisterPresentationImport?.finalHandAnimation !== false
    || wetRegisterPresentationImport?.finalProp !== false)
  errors.push("wet-register presentation loses the immutable import snapshot or promotes it beyond engineering scope");

const wetRegisterPresentationPackage = wetRegisterPresentation.package;
if (wetRegisterPresentationPackage?.result !== "BUILD SUCCESSFUL"
    || wetRegisterPresentationPackage?.exitCode !== 0
    || wetRegisterPresentationPackage?.outsideGitRoot !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || wetRegisterPresentationPackage?.alwaysCookPath !== "/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1"
    || wetRegisterPresentationPackage?.priorAcceptedPackageCount !== 564
    || wetRegisterPresentationPackage?.addedPackageCount !== 3
    || wetRegisterPresentationPackage?.isolatedAssetCount !== 3
    || wetRegisterPresentationPackage?.cookedPackageCount !== 567
    || wetRegisterPresentationPackage?.incrementallySkippedPackageCount !== 0
    || wetRegisterPresentationPackage?.platformSkippedPackageCount !== 7
    || wetRegisterPresentationPackage?.totalCookCandidates !== 574
    || wetRegisterPresentationPackage?.cookErrors !== 0
    || wetRegisterPresentationPackage?.cookWarnings !== 0
    || wetRegisterPresentationPackage?.engineeringAdmission !== true
    || wetRegisterPresentationPackage?.humanApproval !== false
    || wetRegisterPresentationPackage?.finalReleaseApproval !== false
    || wetRegisterPresentationPackage?.sourceSnapshot?.matchesCurrentRepositoryReceipts !== true
    || wetRegisterPresentationPackage?.sourceSnapshot?.automationAppendedTransientAfsCredentialToTemporaryConfigAfterCook !== true
    || wetRegisterPresentationPackage?.sourceSnapshot?.globallyCredentialFreeSnapshotClaim !== false
    || wetRegisterPresentationPackage?.sourceSnapshot?.credentialValueRecorded !== false
    || wetRegisterPresentationPackage?.pathSanitization?.status !== "pass-authorized-rpath-mutation-then-immutable-inspection"
    || wetRegisterPresentationPackage?.pathSanitization?.currentWorkstationPathMarkerCount !== 0
    || wetRegisterPresentationPackage?.pathSanitization?.securityTokenMarkerCount !== 0
    || wetRegisterPresentationPackage?.pathSanitization?.unresolvedDependencyCount !== 0
    || wetRegisterPresentationPackage?.pathSanitization?.finalReleaseApproval !== false
    || wetRegisterPresentationPackage?.headlessSmoke?.status !== "not-run-for-this-interaction-package"
    || wetRegisterPresentationPackage?.headlessSmoke?.claim !== false)
  errors.push("wet-register presentation package receipt is not the exact bounded engineering-only v4 pass");
if (Object.keys(wetRegisterPresentationPackage?.sourceSnapshot?.trackedUassets ?? {}).sort().join("\n")
      !== Object.keys(wetRegisterPrivacyUassets).sort().join("\n")
    || Object.entries(wetRegisterPrivacyUassets).some(([file, [bytes, sha256]]) =>
      wetRegisterPresentationPackage?.sourceSnapshot?.trackedUassets?.[file]?.bytes !== bytes
      || wetRegisterPresentationPackage?.sourceSnapshot?.trackedUassets?.[file]?.sha256 !== sha256))
  errors.push("wet-register package snapshot no longer binds exactly the three current uassets");

const wetRegisterVisible = wetRegisterPresentation.visiblePlaytest;
const wetRegisterExpectedRuns = {
  "wet-register-normal": {
    reducedMotion: false, motion: "normal", override: "ReducedMotion=False",
    bytes: 127773, sha256: "1665f5e89d8fbe08e7a08f7b91bf1918b885ec91519e9c21338037cdc5786e97",
    markerSamples: {bilateral: [30, 31], held: [60, 60], orderedRelease: [90, 90], terminal: [undefined, 120]},
  },
  "wet-register-reduced": {
    reducedMotion: true, motion: "reduced", override: "ReducedMotion=True",
    bytes: 127679, sha256: "b18d11a83651181b3457202e35f569d9cf75c08e247f8122c6131400bc44e265",
    markerSamples: {bilateral: [30, 30], held: [60, 60], orderedRelease: [90, 91], terminal: [undefined, 120]},
  },
};
if (wetRegisterVisible?.package !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || wetRegisterVisible?.resolution?.join(",") !== "1600,1000"
    || wetRegisterVisible?.renderer !== "Vulkan"
    || wetRegisterVisible?.selectedGpu !== "NVIDIA GeForce RTX 4090 D"
    || wetRegisterVisible?.developmentReviewOnly !== true
    || wetRegisterVisible?.stackCount !== 1
    || wetRegisterVisible?.stackReusedAcrossRuns !== true
    || wetRegisterVisible?.normalReviewed !== true
    || wetRegisterVisible?.reducedMotionReviewed !== true
    || wetRegisterVisible?.visibleHandMeshReviewApproved !== false
    || wetRegisterVisible?.playerOwnershipContinuityReviewApproved !== false
    || wetRegisterVisible?.humanHistoricalCulturalReviewApproved !== false
    || wetRegisterVisible?.finalCharacterArtApproved !== false
    || wetRegisterVisible?.storyProgressionReview !== "not-run-inert-review-route"
    || wetRegisterVisible?.visibleFallbackReview !== "not-run"
    || Object.keys(wetRegisterExpectedRuns).sort().join("\n")
      !== (wetRegisterVisible?.runtimeLogs ?? []).map((run) => run.reviewId).sort().join("\n"))
  errors.push("wet-register visible review loses its exact two-route development-only boundary");
for (const run of wetRegisterVisible?.runtimeLogs ?? []) {
  const expected = wetRegisterExpectedRuns[run.reviewId];
  if (!expected || run.reviewFlag !== "-ShiCouncilWetRegisterInteractionReview"
      || run.reducedMotion !== expected.reducedMotion || run.motion !== expected.motion
      || run.commandLineReducedMotionOverride !== expected.override || run.commandLineOverrideObserved !== true
      || run.visibleCharacterId !== "chen-sheng" || run.visibleRole !== "speaker"
      || run.tracked !== false || run.bytes !== expected.bytes || run.sha256 !== expected.sha256
      || Object.entries({
        inertMarkers: 1, runtimeAdmissionMarkers: 1, bilateralContactMarkers: 1,
        heldQuestionMarkers: 1, orderedReleaseMarkers: 1, terminalClampMarkers: 1,
        runtimeFailClosedMarkers: 0, neutralFallbackMarkers: 0, storyMutationMarkers: 0,
        defaultMaterialFallbackWarnings: 0, fatalErrors: 0, unhandledExceptions: 0,
        assertionFailures: 0, warningSeverityMarkers: 12, errorSeverityMarkers: 0,
        targetedErrors: 0, passed: true,
      }).some(([key, value]) => run.scan?.[key] !== value)
      || Object.entries(expected.markerSamples).some(([phase, [semantic, pose]]) =>
        run.markerSamples?.[phase]?.semantic !== semantic || run.markerSamples?.[phase]?.pose !== pose)
      || run.inertEvidence?.exactInertMarkerObserved !== true
      || run.inertEvidence?.storyProgressionObserved !== false
      || run.inertEvidence?.campaignSaveMutationObserved !== false
      || run.inertEvidence?.campaignSaveBefore?.exists !== false
      || run.inertEvidence?.campaignSaveAfter?.exists !== false
      || run.inertEvidence?.campaignSaveUnchanged !== true
      || run.shutdown?.processReturnCode !== 143 || run.shutdown?.cleanUnrealShutdown !== true)
    errors.push(`wet-register visible runtime receipt drifted: ${run.reviewId ?? "unknown"}`);
}

const wetRegisterExpectedScreenshots = {
  "docs/production/evidence/unreal-daze-council-wet-register-normal-held-v1.png": ["wet-register-normal", "held", 885909, "b5bccda585ec9fa364baaee216062eaea3b0ecd9d08da90359722c3324763f91"],
  "docs/production/evidence/unreal-daze-council-wet-register-normal-release-onset-v1.png": ["wet-register-normal", "ordered-release", 880587, "909cef096a9d95f50ceb91924eac7b3215d45d986d890f6eb935720eebb29916"],
  "docs/production/evidence/unreal-daze-council-wet-register-normal-later-physical-separation-v1.png": ["wet-register-normal", "physical-exit", 882347, "9752f84b3ff4c4964275706d589fdca6a83ca2cc5e3ef1a6f21bc568b35cf759"],
  "docs/production/evidence/unreal-daze-council-wet-register-normal-terminal-v1.png": ["wet-register-normal", "terminal", 884420, "8e3325c191ac73211c844137081729ae775f0059d7bacd3548cf0b4ed596a363"],
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-held-v1.png": ["wet-register-reduced", "held", 883994, "0840c28c3017970a87234e62b40d0ef767abcdb625bdc8952d9fab6812eb8dca"],
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-release-v1.png": ["wet-register-reduced", "ordered-release", 883046, "29c4369233d7be2665dcad2d77e11d75349e481bfe29532e8ffaa7b29d676e07"],
  "docs/production/evidence/unreal-daze-council-wet-register-reduced-terminal-v1.png": ["wet-register-reduced", "terminal", 882657, "35e6cc39d079d4b2ba66b6285f0e8ecd1ebcefcb3e670ab2c00ad14fa40cc3d9"],
};
if (Object.keys(wetRegisterExpectedScreenshots).sort().join("\n")
      !== (wetRegisterPresentation.screenshots ?? []).map((item) => item.file).sort().join("\n"))
  errors.push("wet-register presentation must retain exactly seven reviewed screenshots");
for (const screenshot of wetRegisterPresentation.screenshots ?? []) {
  const expected = wetRegisterExpectedScreenshots[screenshot.file];
  if (!expected || screenshot.reviewId !== expected[0] || screenshot.phase !== expected[1]
      || screenshot.dimensions?.join(",") !== "1600,1000" || screenshot.bitDepth !== 8
      || screenshot.channels !== 3 || screenshot.colorSpace !== "sRGB" || screenshot.alpha !== false
      || screenshot.bytes !== expected[2] || screenshot.sha256 !== expected[3]
      || screenshot.rawXwdToTrackedPngPixelDifferenceCount !== 0
      || screenshot.visibleHandMeshReviewApproved !== false
      || screenshot.visibleMeshContactClearanceApproved !== false
      || screenshot.finalHandAnimation !== false || screenshot.finalProp !== false)
    errors.push(`wet-register screenshot metadata drifted: ${screenshot.file ?? "unknown"}`);
  try {
    const png = await readFile(resolve(root, screenshot.file));
    if (png.byteLength !== expected?.[2]
        || createHash("sha256").update(png).digest("hex") !== expected?.[3]
        || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
        || png.readUInt32BE(16) !== 1600 || png.readUInt32BE(20) !== 1000
        || png[24] !== 8 || png[25] !== 2 || png[28] !== 0)
      errors.push(`wet-register screenshot payload or PNG dimensions drifted: ${screenshot.file}`);
  } catch {
    errors.push(`wet-register screenshot is missing or unreadable: ${screenshot.file ?? "unknown"}`);
  }
}

const wetRegisterRawCapture = wetRegisterVisible?.rawCaptureEvidence;
const wetRegisterRawPhaseKeys = {normal: ["held", "ordered-release", "physical-exit", "terminal", "terminal-stable"], reduced: ["held", "ordered-release", "terminal", "terminal-stable"]};
for (const [motion, expectedKeys] of Object.entries(wetRegisterRawPhaseKeys)) {
  const route = wetRegisterRawCapture?.[motion];
  if (Object.keys(route?.phases ?? {}).sort().join("\n") !== [...expectedKeys].sort().join("\n")
      || route?.terminalStability?.exactPixelEquality !== false
      || route?.terminalStability?.environmentalRainAndEffectsContinue !== true
      || route?.terminalStability?.watchedNoGrossCharacterOrPropRestart !== true)
    errors.push(`wet-register ${motion} raw-capture inventory or terminal rain/FX qualification drifted`);
}
const wetNormalPhases = wetRegisterRawCapture?.normal?.phases;
const wetReducedPhases = wetRegisterRawCapture?.reduced?.phases;
if (wetNormalPhases?.["ordered-release"]?.semanticSample !== 90
    || wetNormalPhases?.["ordered-release"]?.poseSample !== 90
    || wetNormalPhases?.["ordered-release"]?.physicalContactExitSampleProof !== false
    || wetNormalPhases?.["ordered-release"]?.visibleMeshClearanceProof !== false
    || wetNormalPhases?.["physical-exit"]?.laterVisibleSeparationObserved !== true
    || wetNormalPhases?.["physical-exit"]?.exactSample91Proof !== false
    || wetReducedPhases?.["ordered-release"]?.semanticSample !== 90
    || wetReducedPhases?.["ordered-release"]?.poseSample !== 91
    || wetReducedPhases?.["ordered-release"]?.wristMarkerEngineeringExit !== true
    || wetReducedPhases?.["ordered-release"]?.visibleMeshReviewApproved !== false
    || wetReducedPhases?.["ordered-release"]?.visibleMeshClearanceProof !== false
    || wetReducedPhases?.["ordered-release"]?.visibleSeparationLegibleAtFullFrame !== false
    || wetReducedPhases?.["ordered-release"]?.fingersAppearOverlappingAtFullFrame !== true)
  errors.push("wet-register normal/reduced capture caveats no longer distinguish marker engineering from visible mesh clearance");
for (const screenshot of wetRegisterPresentation.screenshots ?? []) {
  const motion = screenshot.reviewId === "wet-register-normal" ? "normal" : "reduced";
  const rawPhase = wetRegisterRawCapture?.[motion]?.phases?.[screenshot.phase];
  if (rawPhase?.trackedScreenshot !== screenshot.file
      || rawPhase?.renderedPng?.bytes !== screenshot.bytes
      || rawPhase?.renderedPng?.sha256 !== screenshot.sha256
      || rawPhase?.rawXwdToTrackedPngPixelDifferenceCount !== 0)
    errors.push(`wet-register raw capture does not bind tracked screenshot: ${screenshot.file ?? "unknown"}`);
}

const wetRegisterExpectedAuthority = {
  developmentReviewOnly: true, engineeringAdmission: true, terminalPoseEngineeringApproved: true,
  visibleHandMeshReviewApproved: false, visibleMeshContactClearanceApproved: false,
  materialArtReviewApproved: false, playerOwnershipContinuityReviewApproved: false,
  humanHistoricalCulturalReviewApproved: false, humanAnatomyReviewApproved: false,
  humanCinematicReviewApproved: false, cinematicContinuityApproved: false,
  humanAccessibilityLocalizationReviewApproved: false, historicalPropAuthentication: false,
  closeCameraApproved: false, mouthInteriorApproved: false, voiceApproved: false,
  lipSyncApproved: false, finalProp: false, finalHandAnimation: false,
  finalCharacterArt: false, campaignAuthority: false, choiceAuthority: false,
  inputAuthority: false, saveAuthority: false,
};
const wetRegisterAuthority = wetRegisterPresentation.authorityBoundary;
if (Object.keys(wetRegisterAuthority ?? {}).sort().join("\n") !== Object.keys(wetRegisterExpectedAuthority).sort().join("\n")
    || Object.entries(wetRegisterExpectedAuthority).some(([key, value]) => wetRegisterAuthority?.[key] !== value))
  errors.push("wet-register presentation authority boundary loses a required engineering pass or red gate");
const wetRegisterExpectedPresentationGates = {
  packagedBuildWithWetRegisterAssets: "pass-engineering-only",
  liveRuntimeAdmissionMarkers: "pass-normal-and-reduced-engineering-only",
  normalMotionVisibleNoVncReview: "pass-engineering-only",
  reducedMotionVisibleNoVncReview: "pass-engineering-only",
  visibleFallbackReview: "not-run",
  visibleHandMeshReview: "pending-human-review",
  visibleMeshContactAndClearanceReview: "required",
  materialArtReview: "pending-human-review",
  playerOwnershipContinuityReview: "pending-human-review",
  humanHandAnatomyAndContactReview: "required",
  humanHistoricalMaterialAndCulturalReview: "required",
  humanCinematicFramingAndActingReview: "required",
  cinematicContinuityReview: "required",
  humanAccessibilityAndLocalizationReview: "required",
  mouthInteriorVoiceAndMultilingualLipSync: "not-admitted",
  closeCameraUse: "rejected",
  finalProp: "not-admitted",
  finalHandAnimation: "not-admitted",
  finalCharacterArt: "not-admitted",
};
if (Object.keys(wetRegisterPresentation.releaseGates ?? {}).sort().join("\n") !== Object.keys(wetRegisterExpectedPresentationGates).sort().join("\n")
    || Object.entries(wetRegisterExpectedPresentationGates).some(([key, value]) => wetRegisterPresentation.releaseGates?.[key] !== value))
  errors.push("wet-register presentation no longer preserves exact engineering-only passes and downstream red gates");
const wetRegisterExpectedRedGates = [
  "visible mesh contact, finger placement, deformation and clearance",
  "hand and wrist anatomy, skin, sleeve and wet response",
  "register material, construction and historical-cultural review",
  "keeper-to-Chen handoff and cinematic continuity",
  "close framing, final camera, acting and character art",
  "mouth interior, voice, multilingual pronunciation and lip sync",
  "accessibility, localization, physical-display and observed-player review",
];
if (wetRegisterPresentation.review?.engineeringDecision !== "pass-bounded-package-runtime-markers-and-watched-terminal-route"
    || wetRegisterPresentation.review?.visualMeshDecision !== "reject-contact-and-clearance-as-final-or-human-approved"
    || wetRegisterPresentation.review?.remainingRedGates?.join("\n") !== wetRegisterExpectedRedGates.join("\n"))
  errors.push("wet-register watched review no longer names every visible-mesh, anatomy, continuity, history, accessibility, localization, close, mouth, voice or final red gate");

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
