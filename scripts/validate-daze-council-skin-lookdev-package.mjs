#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { hostname } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);
const manifestPath = resolve(
  repositoryRoot,
  "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json",
);
const importEvidenceRelativePath =
  "docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json";
const requiredEnvironment = [
  "SHI_UNREAL_PACKAGE_ROOT",
  "SHI_SKIN_LOOKDEV_PACKAGE_LOG",
  "SHI_SKIN_LOOKDEV_NORMAL_LOG",
  "SHI_SKIN_LOOKDEV_REDUCED_LOG",
];
const expectedArtifacts = [
  { relativePath: "SHI.sh", role: "Linux packaged-player launcher", bytes: 218, sha256: "7eeb214781ca5113696ae2be6c5124b5404cd4abcd1fff39aa383ba15ff1cf1e" },
  { relativePath: "SHI/Binaries/Linux/SHI", role: "Linux development executable", bytes: 298779248, sha256: "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02" },
  { relativePath: "SHI/Content/Paks/SHI-Linux.pak", role: "Pak metadata and non-IoStore payload", bytes: 10428046, sha256: "1f15ef443e196e79f26e2c9f88450b4b1ff2b21efe65f6d66ec71f01368a1cbd" },
  { relativePath: "SHI/Content/Paks/SHI-Linux.ucas", role: "IoStore data container", bytes: 176534544, sha256: "2543c7c1fc8c3f38d25dc6cadf91b8410e9771336bd639fb226654b92ee51ff2" },
  { relativePath: "SHI/Content/Paks/SHI-Linux.utoc", role: "IoStore table of contents", bytes: 158699, sha256: "c73d443cc10e6dac4ee314e94a68446d495fcd968264de9cc189b1b02acf1e25" },
];
const assetId = "shi-daze-council-skin-lookdev-v1";
const reviewFlag = "-ShiCouncilSkinLookdevReview";
const isolatedRoot = "/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1";
const meshPath =
  "/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.SKM_SHI_DazeCouncil_ChenSheng_Facial_01";
const materialPath =
  `${isolatedRoot}/M_SHI_ChenSheng_SkinLookdevV1.M_SHI_ChenSheng_SkinLookdevV1`;
const profilePath =
  `${isolatedRoot}/SP_SHI_ChenSheng_SkinLookdevV1.SP_SHI_ChenSheng_SkinLookdevV1`;
const materialSlot = "M_SHI_Character_SkinClay";
const routeId = "chen-sheng-skin-lookdev-v1";
const profileOpacitySource = "MaterialMasks2K.B";
const profileOpacitySourceTextureParameter = "MaterialMasks2K";
const profileOpacitySourceChannel = "B";
const profileOpacitySourceUnorm8 = 89;
const profileOpacity = profileOpacitySourceUnorm8 / 255;
const maximumProfileOpacity = profileOpacitySourceUnorm8 / 255;
const profileOpacityThresholdExclusive = 0.10;
const profileMeanFreePathDistance = 2.6748;
const effectiveMeanFreePathDistance = profileMeanFreePathDistance * profileOpacity;
const requiredDisclosure =
  "CHEN SHENG SKIN LOOKDEV V1 · DRAMATIC CASTING, NOT A HISTORICAL LIKENESS OR COMPLEXION CLAIM · NOT HUMAN-APPROVED FINAL ART OR CLOSE-CAMERA AUTHORITY";
const requiredDecision =
  "privacy-v11-import-package-runtime-engineering-pass-watched-visual-art-rejected-not-final-not-close-camera-not-human-reviewed";
const privacyRevision = "privacy-v11-base-asset-import-data-sanitized";
const inertStatusMarker =
  "SHI_COUNCIL_SKIN_LOOKDEV_REVIEW_INERT story_input=false save_read=false save_write=false campaign_advance=false";
const campaignSaveLogicalPath =
  "$SHI_UNREAL_REVIEW_USER_DIR/Saved/SaveGames/shi-chapter-01-v6.json";
const textures = [
  {
    textureId: "base-color-2k",
    parameter: "BaseColor2K",
    assetPath:
      `${isolatedRoot}/T_SHI_ChenSheng_Skin_BaseColor_2K.T_SHI_ChenSheng_Skin_BaseColor_2K`,
    dimensions: [2048, 2048],
    srgb: true,
  },
  {
    textureId: "material-masks-2k",
    parameter: "MaterialMasks2K",
    assetPath:
      `${isolatedRoot}/T_SHI_ChenSheng_Skin_Masks_2K.T_SHI_ChenSheng_Skin_Masks_2K`,
    dimensions: [2048, 2048],
    srgb: false,
  },
  {
    textureId: "detail-normal-1k",
    parameter: "DetailNormal1K",
    assetPath:
      `${isolatedRoot}/T_SHI_ChenSheng_Skin_DetailNormal_1K.T_SHI_ChenSheng_Skin_DetailNormal_1K`,
    dimensions: [1024, 1024],
    srgb: false,
  },
];
const expectedScreenshots = [
  {
    file: "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-normal-material-qa-v2.png",
    reviewId: "skin-normal",
    bytes: 881210,
    sha256: "63b9ae8484e874631f45fdb8b8f134c076986d00066ea19e2787218de8e22877",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-object-glance-v2.png",
    reviewId: "skin-reduced",
    bytes: 880469,
    sha256: "ef6829e1cb4e93dad0d9f17babfcdb2252c7caf79e632d08eb1ec3166d84624d",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-terminal-neutral-v2.png",
    reviewId: "skin-reduced",
    bytes: 877768,
    sha256: "251a94346962af8dcca7c6df57ea3cae0282dde924cef9679524c03d1041a5e7",
  },
];
const expectedTrackedUassetReceipts = {
  "M_SHI_ChenSheng_SkinLookdevV1.uasset": {
    bytes: 11579,
    sha256: "13d8dde823611bfd15ef8aae330cb109304a1621da0511518220bedcd51eb1f3",
    sourceIdentity: null,
  },
  "SP_SHI_ChenSheng_SkinLookdevV1.uasset": {
    bytes: 1913,
    sha256: "c730da3eddda2a67fe60a39ea8cf3d6b32b792afbc7a2318536cdd3af3c6512b",
    sourceIdentity: null,
  },
  "T_SHI_ChenSheng_Skin_BaseColor_2K.uasset": {
    bytes: 2113116,
    sha256: "54122ea3a81132a263c0a7d3541a8a534bc472313133359d85d3982716393c87",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-basecolor-2k.png",
  },
  "T_SHI_ChenSheng_Skin_DetailNormal_1K.uasset": {
    bytes: 1532856,
    sha256: "6378f416c33ca89161479c3cde2584a7958a623fa5a9c348f344873a2934e7bc",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png",
  },
  "T_SHI_ChenSheng_Skin_Masks_2K.uasset": {
    bytes: 1472351,
    sha256: "392ddda8ce0af8b8821116682081234ce680e04899e78722b39331e87a216ee8",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-masks-2k.png",
  },
};
const expectedSafeRpathEntries = [
  "$ORIGIN",
  "$ORIGIN/..",
  "$ORIGIN/NotForLicensees",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/Qualcomm/Linux",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/PhysX3/Unix/x86_64-unknown-linux-gnu",
  "$ORIGIN/../../../Engine/Plugins/Interchange/Runtime/Source/ThirdParty/Draco/lib/Linux",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/MsQuic/v220/linux",
  "$ORIGIN/../../../Engine/Plugins/Compression/OodleNetwork/Sdks/2.9.16/lib/Linux",
  "$ORIGIN/../../../Engine/Plugins/Media/WebMMedia/Source/ThirdParty/webm/1.0.0.27/lib/Linux/x86_64-unknown-linux-gnu/Release",
];
const expectedPathSanitizedArtifacts = {
  "SHI/Binaries/Linux/SHI": [298779248, "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02"],
  "SHI/Binaries/Linux/SHI.debug": [164328112, "0d60e1f0ff432d8af470587d4ac2e9cb32307d486230321ebbddba8aa531e248"],
  "SHI/Binaries/Linux/SHI.sym": [124176922, "f6f24b4f07e828f4d30703cedc0b4ee9a79cba95caf38f49047d8f0a9881dc73"],
};
const otherReviewFlags = [
  "-ShiCouncilCharacterReviewSpeaker",
  "-ShiCouncilCharacterReviewKeeper",
  "-ShiCommandWeightReviewBack",
  "-ShiCommandWeightReviewFront",
  "-ShiCommandSurfaceReview",
  "-ShiWetFieldEnvironmentReview",
  "-ShiDazeFieldShelterReview",
  "-ShiRainVfxReview",
  "-ShiWetFieldVegetationReview",
];
const exitSequence = [
  "LogExit: Preparing to exit.",
  "LogExit: Game engine shut down",
  "LogExit: Object subsystem successfully closed.",
  "LogExit: Exiting.",
  "LogCore: FUnixPlatformMisc::RequestExit(bForce=false, ReturnCode=143)",
  "Log file closed,",
];
const forbiddenLogPatterns = [
  ["campaign load failure", /SHI campaign load failed:/iu],
  ["engagement load failure", /SHI engagement load failed:/iu],
  ["skin review rejection", /SHI skin lookdev review rejected/iu],
  ["skin contract failure", /Council skin lookdev contract failed closed/iu],
  ["skin route failure", /Council skin lookdev routing failed closed/iu],
  ["skin override failure", /Council skin lookdev override failed closed/iu],
  ["SkinClay fallback", /Council skin lookdev .*SkinClay fallback/iu],
  ["SkinClay baseline route", /accepted-skin-clay-baseline/iu],
  ["skin primitive fallback", /Council skin lookdev .*primitive fallback/iu],
  ["skin hidden-presentation fallback", /Council skin lookdev .*hid the skeletal presentation/iu],
  ["facial contract rejection", /Council facial contract rejected/iu],
  ["neutral-face fallback", /Council facial performance .*accepted neutral-face fallback/iu],
  ["facial cadence fallback", /Council facial cadence failed closed/iu],
  ["facial SkinClay exercise fallback", /SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED[^\r\n]*skin=SkinClay/iu],
  ["character contract rejection", /Council character contract rejected/iu],
  ["primitive character fallback", /Council character .*fail-closed primitive fallback/iu],
  ["performance contract rejection", /Council performance contract rejected/iu],
  ["reference-pose performance fallback", /Council performance .*fail-closed reference-pose fallback/iu],
  ["reference-pose participant fallback", /Council character .*uses the reference-pose fallback/iu],
  ["council figure initialization failure", /Council figure .*could not initialize/iu],
  ["council review rejection", /Council character review rejected/iu],
  ["runtime material-usage repair", /Had to pass SMU back to game thread.*DazeCouncilSkinLookdevV1/iu],
  ["skin material missing usage", /Material \/Game\/SHI\/Art\/Characters\/DazeCouncilSkinLookdevV1\/.*missing usage flag/iu],
  ["default-material fallback", /Default Material will be used in game/iu],
  ["positive final, close-camera or human-review claim", /(?:final_skin|close_camera|human_review)=true/iu],
  ["story decision mutation", /(?:AUTOSAVED · [0-9]+ DECISIONS|UNSAVED PREVIEW ADVANCED|NATIVE COMMAND EXERCISE)/iu],
  ["new or resumed chronicle mutation", /(?:NEW CHRONICLE · AUTOSAVED|RESUMED · TURN [0-9]+)/iu],
  ["Unreal error or fatal category", /Log[^:\r\n]+: (?:Error|Fatal):/iu],
  ["fatal error", /Fatal error:/iu],
  ["assertion failure", /Assertion failed:/iu],
  ["ensure failure", /Ensure condition failed/iu],
  ["unhandled exception", /Unhandled Exception/iu],
  ["low-level fatal error", /LowLevelFatalError/iu],
  ["fatal signal", /Signal 11 caught/iu],
  ["segmentation fault", /Segmentation fault/iu],
  ["GPU crash", /GPU Crash dump triggered/iu],
  ["forced Unreal exit", /RequestExit\(bForce=true/iu],
];
const forbiddenTrueClaimKeys = new Set([
  "finalSkin",
  "finalCharacterArt",
  "finalFace",
  "finalActing",
  "finalVoice",
  "closeCameraApproved",
  "closeFramingApproved",
  "humanReviewApproved",
  "humanHistoricalCulturalReviewApproved",
  "historicalPortrait",
  "historicallyAttestedComplexion",
]);
const packageLogForbiddenPatterns = [
  ["failed UAT build", /BUILD FAILED/iu],
  ["nonzero UAT exit", /AutomationTool exiting with ExitCode=(?!0\b)[^\r\n]*/iu],
  ["cook error", /LogCook: Error:/iu],
  ["cook warning", /LogCook: Warning:/iu],
  ["material error", /LogMaterial: Error:/iu],
  ["material warning", /LogMaterial: Warning:/iu],
  ["shader compile error", /LogShaderCompilers: Error:/iu],
  ["skin material warning", /(?:Warning|Error):[^\r\n]*DazeCouncilSkinLookdevV1|DazeCouncilSkinLookdevV1[^\r\n]*(?:Warning|Error):/iu],
  ["skin fallback", /Council skin lookdev .*fallback|accepted-skin-clay-baseline/iu],
  ["default-material fallback", /Default Material will be used in game/iu],
  ["missing package", /Unable to find package[^\r\n]*DazeCouncilSkinLookdevV1/iu],
  ["failed asset load", /Failed to load[^\r\n]*DazeCouncilSkinLookdevV1/iu],
  ["Unreal error or fatal category", /Log[^:\r\n]+: (?:Error|Fatal):/iu],
  ["fatal error", /Fatal error:|LowLevelFatalError|Unhandled Exception|Assertion failed:|Ensure condition failed/iu],
];

const errors = [];

function reject(scope, message) {
  errors.push(`${scope}: ${message}`);
}

function countLiteral(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(needle, offset)) !== -1) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

function expectExact(scope, actual, expected, label) {
  if (actual !== expected) {
    reject(scope, `${label} must be ${JSON.stringify(expected)} (found ${JSON.stringify(actual)})`);
  }
}

function expectPositiveInteger(scope, actual, label) {
  if (!Number.isSafeInteger(actual) || actual <= 0) {
    reject(scope, `${label} must be a positive safe integer`);
  }
}

function expectNonnegativeInteger(scope, actual, label) {
  if (!Number.isSafeInteger(actual) || actual < 0) {
    reject(scope, `${label} must be a nonnegative safe integer`);
  }
}

function isInside(parent, child) {
  const pathFromParent = relative(parent, child);
  return pathFromParent === "" || (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent));
}

function sameStringSet(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && new Set(actual).size === expected.length
    && expected.every((item) => actual.includes(item));
}

function countCommandToken(commandLine, token) {
  return commandLine
    .split(/\s+/u)
    .filter((candidate) => candidate === token)
    .length;
}

async function sha256File(filePath) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest("hex");
}

async function readReceipt(scope, filePath) {
  try {
    const payload = await readFile(filePath);
    return {
      bytes: payload.byteLength,
      sha256: createHash("sha256").update(payload).digest("hex"),
      text: payload.toString("utf8"),
    };
  } catch (error) {
    reject(scope, `could not read supplied file (${error.code ?? "read failure"})`);
    return null;
  }
}

async function resolveExternalLog(scope, filePath, environmentName) {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      reject(scope, `${environmentName} must point to a regular file`);
      return null;
    }
    const resolvedPath = await realpath(filePath);
    if (isInside(repositoryRoot, resolvedPath)) {
      reject(scope, `${environmentName} must resolve outside the Git repository`);
      return null;
    }
    return resolvedPath;
  } catch (error) {
    reject(scope, `${environmentName} is unavailable (${error.code ?? "path failure"})`);
    return null;
  }
}

function validateReceiptShape(scope, receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    reject(scope, "receipt must be an object");
    return false;
  }
  expectPositiveInteger(scope, receipt.bytes, "receipt bytes");
  if (typeof receipt.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(receipt.sha256)) {
    reject(scope, "receipt sha256 must be a lowercase 64-digit digest");
  }
  return true;
}

function validateNoPositiveReleaseClaims(value, scope = "manifest", path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoPositiveReleaseClaims(item, scope, [...path, index]));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (child === true && forbiddenTrueClaimKeys.has(key)) {
      reject(scope, `${[...path, key].join(".")} cannot make a final, close-camera, human-review or historical-likeness claim`);
    }
    validateNoPositiveReleaseClaims(child, scope, [...path, key]);
  }
}

function validateTextureContract(scope, actual) {
  if (!Array.isArray(actual)) {
    reject(scope, "textureInventory must be an array");
    return;
  }
  expectExact(scope, actual.length, textures.length, "texture inventory count");
  for (let index = 0; index < textures.length; index += 1) {
    const item = actual[index];
    const expected = textures[index];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      reject(scope, `textureInventory[${index}] must be an object`);
      continue;
    }
    for (const key of ["textureId", "parameter", "assetPath", "srgb"]) {
      expectExact(scope, item[key], expected[key], `textureInventory[${index}].${key}`);
    }
    if (!Array.isArray(item.dimensions) || item.dimensions.length !== 2) {
      reject(scope, `textureInventory[${index}].dimensions must contain exactly two values`);
    } else {
      expectExact(scope, item.dimensions[0], expected.dimensions[0], `textureInventory[${index}].dimensions[0]`);
      expectExact(scope, item.dimensions[1], expected.dimensions[1], `textureInventory[${index}].dimensions[1]`);
    }
  }
}

function validateAuthorityBoundary(scope, boundary) {
  const exact = {
    reviewOnly: true,
    developmentOnly: true,
    chenShengOnly: true,
    deterministic: true,
    standardMotionSupported: true,
    reducedMotionSupported: true,
    interactionAuthority: false,
    gameplayAuthority: false,
    storyAuthority: false,
    saveAuthority: false,
    replicationAuthority: false,
    identityAuthority: false,
    historicalPortrait: false,
    historicallyAttestedComplexion: false,
    humanHistoricalCulturalReviewApproved: false,
    closeCameraApproved: false,
    finalCharacterArt: false,
    finalSkin: false,
  };
  for (const [key, expected] of Object.entries(exact)) {
    expectExact(scope, boundary?.[key], expected, key);
  }
}

function validateRuntimeContract(manifest) {
  const scope = "manifest runtimeContract";
  const contract = manifest.runtimeContract;
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    reject(scope, "runtimeContract must be an object");
    return;
  }
  const exact = {
    assetId,
    targetCharacterId: "chen-sheng",
    visibleRole: "speaker",
    reviewFlag,
    isolatedRoot,
    meshPath,
    materialSlot,
    materialPath,
    subsurfaceProfilePath: profilePath,
    routeId,
    textureCount: 3,
    metallic: 0,
    specular: 0.25,
    framing: "material-qa-only",
  };
  for (const [key, expected] of Object.entries(exact)) {
    expectExact(scope, contract[key], expected, key);
  }
  const subsurfaceAmount = contract.subsurfaceAmount;
  if (!subsurfaceAmount || typeof subsurfaceAmount !== "object" || Array.isArray(subsurfaceAmount)) {
    reject(scope, "subsurfaceAmount must be an object");
  } else {
    const exactSubsurfaceAmount = {
      source: profileOpacitySource,
      sourceTextureParameter: profileOpacitySourceTextureParameter,
      sourceChannel: profileOpacitySourceChannel,
      sourceUnorm8: profileOpacitySourceUnorm8,
      sourceNormalized: profileOpacity,
      maximumSourceNormalized: maximumProfileOpacity,
      opacityThresholdExclusive: profileOpacityThresholdExclusive,
      materialInput: "MP_OPACITY",
      opacityConnected: true,
      subsurfaceColorConnected: false,
      profileMeanFreePathDistance,
      effectiveMeanFreePathDistance,
      maximumAllowedEffectiveMeanFreePathDistance: effectiveMeanFreePathDistance,
      effectiveMeanFreePathWithinThreshold: true,
    };
    for (const [key, expected] of Object.entries(exactSubsurfaceAmount)) {
      expectExact(scope, subsurfaceAmount[key], expected, `subsurfaceAmount.${key}`);
    }
    if (!(subsurfaceAmount.sourceNormalized > subsurfaceAmount.opacityThresholdExclusive)) {
      reject(scope, "subsurfaceAmount.sourceNormalized must remain strictly above the UE 0.10 opacity threshold");
    }
    if (!(subsurfaceAmount.sourceNormalized <= subsurfaceAmount.maximumSourceNormalized)) {
      reject(scope, "subsurfaceAmount.sourceNormalized must remain at or below the exact 89/255 maximum");
    }
    if (subsurfaceAmount.effectiveMeanFreePathDistance
        !== subsurfaceAmount.profileMeanFreePathDistance * subsurfaceAmount.sourceNormalized) {
      reject(scope, "subsurfaceAmount.effectiveMeanFreePathDistance must equal profile distance times Opacity");
    }
  }
  validateTextureContract(scope, contract.textureInventory);
  validateAuthorityBoundary(`${scope}.authority`, contract.authority);
}

async function validateImportAdmission(manifest) {
  const scope = "import admission";
  const admission = manifest.importAdmission;
  expectExact(scope, admission?.status, "pass", "status");
  expectExact(scope, admission?.revision, privacyRevision, "revision");
  expectExact(scope, admission?.file, importEvidenceRelativePath, "file");
  expectExact(scope, admission?.bytes, 41086, "privacy-v11 import receipt bytes");
  expectExact(scope, admission?.sha256,
    "c80a07a63c56e4c486a65c3bbaa8e000fe9ad616ebb7037551a378c7657504c2",
    "privacy-v11 import receipt sha256");
  validateReceiptShape(scope, admission);

  const evidencePath = resolve(repositoryRoot, importEvidenceRelativePath);
  const receipt = await readReceipt(scope, evidencePath);
  if (!receipt) return;
  expectExact(scope, receipt.bytes, admission?.bytes, "bytes against manifest");
  expectExact(scope, receipt.sha256, admission?.sha256, "sha256 against manifest");

  let evidence;
  try {
    evidence = JSON.parse(receipt.text);
  } catch (error) {
    reject(scope, `tracked import evidence is not valid JSON (${error.name})`);
    return;
  }
  expectExact(scope, evidence.assetId, assetId, "assetId");
  expectExact(scope, evidence.destination, isolatedRoot, "destination");
  expectExact(scope, evidence.mode, "import-replace", "mode");
  expectExact(scope, evidence.mutationAuthorized, true, "mutationAuthorized");
  expectExact(scope, evidence.passed, true, "passed");
  expectExact(scope, evidence.saved, true, "saved");
  expectExact(scope, evidence.destinationInventory?.passed, true, "destinationInventory.passed");
  expectExact(scope, evidence.material?.passed, true, "material.passed");
  expectExact(scope, evidence.trackedUnrealAssets?.passed, true, "trackedUnrealAssets.passed");
  expectExact(scope, evidence.material?.assetPath, materialPath, "material.assetPath");
  expectExact(scope, evidence.material?.profile, profilePath, "material.profile");
  expectExact(scope, evidence.material?.compiledDuringThisRun, true, "material.compiledDuringThisRun");
  expectExact(scope, evidence.material?.coreMaterialChecksPassed, true, "material.coreMaterialChecksPassed");
  expectExact(scope, evidence.material?.checks?.compileClean, true, "material.checks.compileClean");
  expectExact(scope, evidence.sourceContract?.provenance?.importTimeSnapshot, true,
    "sourceContract.provenance.importTimeSnapshot");
  expectExact(scope, evidence.sourceContract?.provenance?.currentCrossReceipts, false,
    "sourceContract.provenance.currentCrossReceipts");
  if (!evidence.sourceContract?.provenance?.snapshotBoundary?.includes("captured by the authorized import run")
      || !evidence.sourceContract.provenance.snapshotBoundary.includes("must not be verified as current mutable-path cross-receipts")) {
    reject(scope, "sourceContract.provenance.snapshotBoundary must explicitly bound captured receipts away from current mutable paths");
  }

  // The canonical import-replace receipt deliberately preserves the API's
  // same-process empty observation. A later non-mutating reload owns the strict
  // used-texture proof; replacing the root with that reload would destroy the
  // mutation receipt boundary.
  expectExact(scope, evidence.material?.fullUsedTextureCount, 0, "material.fullUsedTextureCount");
  for (const key of ["fullUsedTexturePaths", "admittedProjectTexturePaths"]) {
    if (!Array.isArray(evidence.material?.[key])) {
      reject(scope, `material.${key} must preserve the deferred empty array`);
    } else {
      expectExact(scope, evidence.material[key].length, 0, `material.${key} count`);
    }
  }
  const deferred = evidence.material?.usedTextureInspection;
  const deferredExact = {
    state: "deferred-to-read-only-reload",
    apiAvailable: true,
    apiReturnedExactlyEmpty: true,
    apiReturnedNonempty: false,
    rawEntryCount: 0,
    observedTexturePathCount: 0,
    observedTextureClaimsMade: false,
    strictObservationPassed: false,
    deferredToReadOnlyReload: true,
    deferralAllowedForCurrentMode: true,
    acceptedForCurrentMode: true,
  };
  for (const [key, expected] of Object.entries(deferredExact)) {
    expectExact(scope, deferred?.[key], expected, `material.usedTextureInspection.${key}`);
  }
  expectExact(scope, deferred?.deferralChecks?.authorizedImportReplaceMode, true, "material.usedTextureInspection.deferralChecks.authorizedImportReplaceMode");
  expectExact(scope, deferred?.deferralChecks?.apiReturnedExactlyEmpty, true, "material.usedTextureInspection.deferralChecks.apiReturnedExactlyEmpty");
  expectExact(scope, deferred?.deferralChecks?.coreMaterialChecksPassedBeforeDeferral, true, "material.usedTextureInspection.deferralChecks.coreMaterialChecksPassedBeforeDeferral");
  expectExact(scope, evidence.material?.engineExtras?.observationAvailable, false, "material.engineExtras.observationAvailable");
  expectExact(scope, evidence.material?.engineExtras?.count, 0, "material.engineExtras.count");
  expectExact(scope, evidence.material?.engineExtras?.passed, false, "material.engineExtras.passed");
  const expectedTextureImports = [
    ["baseColor", textures[0]],
    ["materialMasks", textures[1]],
    ["detailNormal", textures[2]],
  ];
  for (const [key, expected] of expectedTextureImports) {
    const actual = evidence.textureImports?.[key];
    expectExact(scope, actual?.assetPath, expected.assetPath, `textureImports.${key}.assetPath`);
    expectExact(scope, actual?.dimensions?.[0], expected.dimensions[0], `textureImports.${key}.dimensions[0]`);
    expectExact(scope, actual?.dimensions?.[1], expected.dimensions[1], `textureImports.${key}.dimensions[1]`);
    expectExact(scope, actual?.srgb, expected.srgb, `textureImports.${key}.srgb`);
    expectExact(scope, actual?.passed, true, `textureImports.${key}.passed`);
  }
  const parameterMap = evidence.material?.textureParameters;
  for (const expected of textures) {
    expectExact(scope, parameterMap?.[expected.parameter]?.texture, expected.assetPath, `material.textureParameters.${expected.parameter}.texture`);
  }
  const expectedTrackedUassets = Object.keys(expectedTrackedUassetReceipts);
  const trackedReceipts = evidence.trackedUnrealAssets?.receipts;
  if (!trackedReceipts || typeof trackedReceipts !== "object" || Array.isArray(trackedReceipts)
      || !sameStringSet(Object.keys(trackedReceipts), expectedTrackedUassets)) {
    reject(scope, "immutable import root must bind exactly the five tracked skin-lookdev uassets");
  } else {
    for (const [file, trackedReceipt] of Object.entries(trackedReceipts)) {
      validateReceiptShape(`${scope} tracked ${file}`, trackedReceipt);
      const expected = expectedTrackedUassetReceipts[file];
      expectExact(scope, trackedReceipt.bytes, expected.bytes, `trackedUnrealAssets.receipts.${file}.bytes`);
      expectExact(scope, trackedReceipt.sha256, expected.sha256, `trackedUnrealAssets.receipts.${file}.sha256`);
    }
  }

  const metadataPrivacy = evidence.embeddedMetadataPrivacy;
  expectExact(scope, metadataPrivacy?.passed, true, "embeddedMetadataPrivacy.passed");
  expectExact(scope, metadataPrivacy?.checks?.exactFiveAssetsScanned, true,
    "embeddedMetadataPrivacy.checks.exactFiveAssetsScanned");
  expectExact(scope, metadataPrivacy?.checks?.allTrackedBinariesPrivatePathsAbsent, true,
    "embeddedMetadataPrivacy.checks.allTrackedBinariesPrivatePathsAbsent");
  const privacyAssets = metadataPrivacy?.assets;
  if (!privacyAssets || typeof privacyAssets !== "object" || Array.isArray(privacyAssets)
      || !sameStringSet(Object.keys(privacyAssets), expectedTrackedUassets)) {
    reject(scope, "embeddedMetadataPrivacy.assets must bind exactly the five tracked skin-lookdev uassets");
  } else {
    const commonPrivacyChecks = [
      "repositoryAbsolutePathAbsent",
      "unixHomePathAbsent",
      "macUsersPathAbsent",
      "windowsForwardUsersPathAbsent",
      "windowsBackslashUsersPathAbsent",
      "absoluteInterchangeFactoryPathAbsent",
      "interchangeAssetImportDataAbsent",
    ];
    const texturePrivacyChecks = [
      "exactSourceAbsolutePathAbsent",
      "baseAssetImportDataPresent",
      "relativeFilenamePropertyPresent",
      "sourceBasenamePresent",
    ];
    for (const [file, expected] of Object.entries(expectedTrackedUassetReceipts)) {
      const asset = privacyAssets[file];
      expectExact(scope, asset?.sourceIdentity, expected.sourceIdentity,
        `embeddedMetadataPrivacy.assets.${file}.sourceIdentity`);
      for (const key of commonPrivacyChecks) {
        expectExact(scope, asset?.checks?.[key], true,
          `embeddedMetadataPrivacy.assets.${file}.checks.${key}`);
      }
      if (expected.sourceIdentity === null) {
        for (const key of texturePrivacyChecks) {
          expectExact(scope, asset?.checks?.[key], undefined,
            `embeddedMetadataPrivacy.assets.${file}.checks.${key}`);
        }
      } else {
        for (const key of texturePrivacyChecks) {
          expectExact(scope, asset?.checks?.[key], true,
            `embeddedMetadataPrivacy.assets.${file}.checks.${key}`);
        }
      }
      expectExact(scope, asset?.passed, true, `embeddedMetadataPrivacy.assets.${file}.passed`);
    }
  }

  const trackedRoot = evidence.trackedUnrealAssets?.root;
  expectExact(scope, trackedRoot,
    "apps/unreal/Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1",
    "trackedUnrealAssets.root");
  for (const [file, expected] of Object.entries(expectedTrackedUassetReceipts)) {
    const assetScope = `${scope} current binary ${file}`;
    const assetPath = resolve(repositoryRoot, trackedRoot ?? "", file);
    const receipt = await readReceipt(assetScope, assetPath);
    if (!receipt) continue;
    expectExact(assetScope, receipt.bytes, expected.bytes, "bytes");
    expectExact(assetScope, receipt.sha256, expected.sha256, "sha256");
    const binary = await readFile(assetPath);
    const binaryText = binary.toString("latin1");
    const forbiddenPrivateTokens = [
      "/home/",
      "/Users/",
      "C:/Users/",
      "C:\\Users\\",
      "Factory_/",
      "InterchangeAssetImportData",
    ];
    for (const token of forbiddenPrivateTokens) {
      if (binaryText.includes(token)) reject(assetScope, `forbidden embedded metadata token ${JSON.stringify(token)}`);
    }
    if (expected.sourceIdentity === null) {
      if (binaryText.includes("AssetImportData") || binaryText.includes("RelativeFilename")) {
        reject(assetScope, "material/profile must not retain a source import identity");
      }
    } else {
      if (!binaryText.includes("AssetImportData")) reject(assetScope, "Base AssetImportData marker is absent");
      if (!binaryText.includes("RelativeFilename")) reject(assetScope, "RelativeFilename metadata is absent");
      if (!binaryText.includes(basename(expected.sourceIdentity))) reject(assetScope, "source basename is absent");
    }
  }

  const inspection = evidence.readOnlyInspection;
  const inspectionExact = {
    mode: "inspect-only",
    mutationAuthorized: false,
    exitCode: 0,
    sourceContractPassed: true,
    allThreeTexturesPassed: true,
    subsurfaceProfilePassed: true,
    materialGraphAndCompilePassed: true,
    materialAdmissionPassed: true,
    usedTextureInspectionStrictPassed: true,
    destinationInventoryPassed: true,
    canonicalHeightRemainedSourceOnly: true,
    acceptedFacialHashesUnchanged: true,
    trackedUassetHashesUnchanged: true,
    embeddedMetadataPrivacyPassed: true,
    overallPassed: true,
    passed: true,
    canonicalImportReceiptRootPreserved: true,
  };
  for (const [key, expected] of Object.entries(inspectionExact)) {
    expectExact(scope, inspection?.[key], expected, `readOnlyInspection.${key}`);
  }
  const immutableRootSha256 = inspection?.immutableImportReceiptRootSha256;
  if (typeof immutableRootSha256 !== "string" || !/^[0-9a-f]{64}$/u.test(immutableRootSha256)) {
    reject(scope, "readOnlyInspection.immutableImportReceiptRootSha256 must be a lowercase 64-digit digest");
  }
  expectExact(scope, admission?.immutableImportReceiptRootSha256, immutableRootSha256, "manifest immutableImportReceiptRootSha256");
  expectExact(scope, admission?.canonicalImportReceiptRootPreserved, true, "manifest canonicalImportReceiptRootPreserved");
  expectExact(scope, admission?.readOnlyInspectionPassed, true, "manifest readOnlyInspectionPassed");
  expectExact(scope, admission?.embeddedMetadataPrivacyPassed, true, "manifest embeddedMetadataPrivacyPassed");
  expectExact(scope, admission?.readOnlyInspectionEmbeddedMetadataPrivacyPassed, true,
    "manifest readOnlyInspectionEmbeddedMetadataPrivacyPassed");
  expectExact(scope, admission?.embeddedSourceContractFileReceiptsAreImportTimeSnapshot, true,
    "manifest embeddedSourceContractFileReceiptsAreImportTimeSnapshot");
  expectExact(scope, admission?.embeddedSourceContractFileReceiptsAreNotCurrentCrossReceipts, true,
    "manifest embeddedSourceContractFileReceiptsAreNotCurrentCrossReceipts");

  const privacyRepair = manifest.privacyRepair;
  expectExact(scope, privacyRepair?.status,
    "pass-current-five-uassets-private-absolute-paths-absent", "privacyRepair.status");
  expectExact(scope, privacyRepair?.revision, privacyRevision, "privacyRepair.revision");
  expectExact(scope, privacyRepair?.importer?.file,
    "scripts/import-daze-council-skin-lookdev-unreal.py", "privacyRepair.importer.file");
  expectExact(scope, privacyRepair?.importer?.bytes, 75871, "privacyRepair.importer.bytes");
  expectExact(scope, privacyRepair?.importer?.sha256,
    "ff9f67fb9bd797e3504ab528eccba0ae6ba456cf22e32079df16d08485e52242",
    "privacyRepair.importer.sha256");
  if (!privacyRepair?.trackedUassets || !sameStringSet(
    Object.keys(privacyRepair.trackedUassets), expectedTrackedUassets,
  )) {
    reject(scope, "privacyRepair.trackedUassets must bind exactly the five privacy-v11 binaries");
  } else {
    for (const [file, expected] of Object.entries(expectedTrackedUassetReceipts)) {
      expectExact(scope, privacyRepair.trackedUassets[file]?.bytes, expected.bytes,
        `privacyRepair.trackedUassets.${file}.bytes`);
      expectExact(scope, privacyRepair.trackedUassets[file]?.sha256, expected.sha256,
        `privacyRepair.trackedUassets.${file}.sha256`);
    }
  }
  for (const key of [
    "exactFiveAssetsScanned",
    "threeTextureAssetsUseBaseAssetImportData",
    "threeTextureAssetsRetainRelativeFilenameAndSourceBasename",
    "materialAndProfileHaveNoSourceIdentity",
    "interchangeAssetImportDataAbsentFromAllFive",
    "repositoryAbsolutePathAbsentFromAllFive",
    "unixHomePathAbsentFromAllFive",
    "macUsersPathAbsentFromAllFive",
    "windowsUsersPathsAbsentFromAllFive",
    "absoluteInterchangeFactoryPathAbsentFromAllFive",
  ]) expectExact(scope, privacyRepair?.metadataContract?.[key], true, `privacyRepair.metadataContract.${key}`);
  for (const key of [
    "readOnlyRenderedInspectionPassed",
    "trackedHashesUnchangedDuringInspection",
    "correctedV3PackageRuntimeEvidenceRetained",
    "correctedV3PackagePredatesPrivacyRepair",
    "currentPrivacyV11SourceUassetsFreshlyPackaged",
    "currentPrivacyV11PackageAndRuntimePassed",
  ]) expectExact(scope, privacyRepair?.[key], true, `privacyRepair.${key}`);
  expectExact(scope, privacyRepair?.freshPackagePending, false, "privacyRepair.freshPackagePending");

  const strict = inspection?.usedTextureInspection;
  const strictExact = {
    state: "observed-strict-pass",
    apiAvailable: true,
    apiReturnedExactlyEmpty: false,
    apiReturnedNonempty: true,
    rawEntryCount: 3,
    observedTexturePathCount: 3,
    observedTextureClaimsMade: true,
    strictObservationPassed: true,
    deferredToReadOnlyReload: false,
    deferralAllowedForCurrentMode: false,
    acceptedForCurrentMode: true,
  };
  for (const [key, expected] of Object.entries(strictExact)) {
    expectExact(scope, strict?.[key], expected, `readOnlyInspection.usedTextureInspection.${key}`);
  }
  for (const key of [
    "apiAvailable",
    "apiReturnedNonempty",
    "uniqueEntriesByPathObserved",
    "exactThreeAdmittedProjectTexturesObserved",
    "boundedOptionalEngineDefaultObserved",
    "noUnapprovedTexturePathsObserved",
    "strictThreeProjectTexturesPlusBoundedEngineDefaultObserved",
  ]) {
    expectExact(scope, strict?.observationChecks?.[key], true, `readOnlyInspection.usedTextureInspection.observationChecks.${key}`);
  }
  expectExact(scope, strict?.deferralChecks?.authorizedImportReplaceMode, false, "readOnlyInspection.usedTextureInspection.deferralChecks.authorizedImportReplaceMode");
  expectExact(scope, strict?.deferralChecks?.apiReturnedExactlyEmpty, false, "readOnlyInspection.usedTextureInspection.deferralChecks.apiReturnedExactlyEmpty");
  expectExact(scope, strict?.deferralChecks?.coreMaterialChecksPassedBeforeDeferral, true, "readOnlyInspection.usedTextureInspection.deferralChecks.coreMaterialChecksPassedBeforeDeferral");
  expectExact(scope, evidence.authorityBoundary?.reviewOnly, true, "authorityBoundary.reviewOnly");
  expectExact(scope, evidence.authorityBoundary?.chenShengOnly, true, "authorityBoundary.chenShengOnly");
  for (const key of [
    "historicalPortrait",
    "historicallyAttestedComplexion",
    "humanHistoricalCulturalReviewApproved",
    "closeCameraApproved",
    "finalCharacterArt",
    "interaction",
    "gameplay",
    "saveOrCampaign",
    "replication",
  ]) {
    expectExact(scope, evidence.authorityBoundary?.[key], false, `authorityBoundary.${key}`);
  }
}

function validateSaveSnapshot(scope, snapshot, label) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    reject(scope, `${label} must be an object`);
    return;
  }
  if (snapshot.exists === false) {
    expectExact(scope, snapshot.bytes, undefined, `${label}.bytes when absent`);
    expectExact(scope, snapshot.sha256, undefined, `${label}.sha256 when absent`);
    return;
  }
  expectExact(scope, snapshot.exists, true, `${label}.exists`);
  validateReceiptShape(`${scope} ${label}`, snapshot);
}

function saveSnapshotsMatch(before, after) {
  if (before?.exists === false && after?.exists === false) return true;
  return before?.exists === true
    && after?.exists === true
    && before.bytes === after.bytes
    && before.sha256 === after.sha256;
}

function validateInertEvidence(run, logText, expected) {
  const scope = `manifest ${expected.reviewId} inertEvidence`;
  const inert = run.inertEvidence;
  expectExact(scope, inert?.storyProgressionObserved, false, "storyProgressionObserved");
  expectExact(scope, inert?.campaignSaveMutationObserved, false, "campaignSaveMutationObserved");
  expectExact(scope, inert?.campaignSaveLogicalPath, campaignSaveLogicalPath, "campaignSaveLogicalPath");

  const markerCount = countLiteral(logText, inertStatusMarker);
  expectExact(scope, markerCount, 1, "exact story/save inert marker count");
  expectExact(scope, inert?.exactInertMarkerObserved, true, "exactInertMarkerObserved");

  const hasBefore = inert?.campaignSaveBefore !== undefined;
  const hasAfter = inert?.campaignSaveAfter !== undefined;
  if (hasBefore !== hasAfter) reject(scope, "campaign-save snapshots must provide both before and after");
  if (hasBefore && hasAfter) {
    validateSaveSnapshot(scope, inert.campaignSaveBefore, "campaignSaveBefore");
    validateSaveSnapshot(scope, inert.campaignSaveAfter, "campaignSaveAfter");
    expectExact(scope, inert.campaignSaveUnchanged, true, "campaignSaveUnchanged");
    if (!saveSnapshotsMatch(inert.campaignSaveBefore, inert.campaignSaveAfter)) {
      reject(scope, "campaign-save before/after snapshots must be byte-identical or both absent");
    }
  } else {
    expectExact(scope, inert?.campaignSaveUnchanged, undefined, "campaignSaveUnchanged without snapshots");
  }
  // Save snapshots are complementary evidence. The exact runtime marker is
  // mandatory because it proves that the packaged review route itself disabled
  // story input, save reads, save writes and campaign advance.
}

function validateManifestRunShape(run, expected) {
  const scope = `manifest ${expected.reviewId}`;
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    reject(scope, "runtime-log receipt is missing");
    return;
  }
  const exact = {
    reviewId: expected.reviewId,
    reviewFlag,
    reducedMotion: expected.reducedMotion,
    motion: expected.motion,
    visibleCharacterId: "chen-sheng",
    visibleRole: "speaker",
    gpu: "NVIDIA GeForce RTX 4090 D",
    tracked: false,
    commandLineReducedMotionOverride: `ReducedMotion=${expected.reducedMotion ? "True" : "False"}`,
    commandLineOverrideObserved: true,
  };
  for (const [key, value] of Object.entries(exact)) expectExact(scope, run[key], value, key);
  validateReceiptShape(scope, run);
  expectExact(scope, run.file, `$SHI_UNREAL_REVIEW_ROOT/${basename(expected.logPath)}`, "logical log path");

  const expectedScan = {
    runtimeAdmissionMarkers: 1,
    objectGlanceMarkers: 1,
    runtimeTextureInventoryCount: 3,
    skinClayFallbackWarnings: 0,
    defaultMaterialFallbackWarnings: 0,
    facialFallbackWarnings: 0,
    storyMutationMarkers: 0,
    fatalErrors: 0,
    unhandledExceptions: 0,
    assertionFailures: 0,
    documentedWarningSeverityMarkers: 4,
    displaySwapchainDiagnosticMarkers: 1,
    passed: true,
  };
  for (const [key, value] of Object.entries(expectedScan)) {
    expectExact(scope, run.scan?.[key], value, `scan.${key}`);
  }
  const alpha = run.scan?.visibleRoleExerciseAlpha;
  if (typeof alpha !== "number" || !Number.isFinite(alpha) || alpha <= 0 || alpha > 1) {
    reject(scope, "scan.visibleRoleExerciseAlpha must be a finite number within (0, 1]");
  } else if (Number(alpha.toFixed(4)) !== alpha) {
    reject(scope, "scan.visibleRoleExerciseAlpha must be exactly representable with four decimal places");
  }
  expectExact(scope, alpha, expected.expectedAlpha, "visible-role exercise alpha");
  expectExact(scope, run.documentedWarnings?.length, 4, "documented Warning-severity count");

  expectExact(scope, run.shutdown?.method, "controlled SIGTERM after evidence capture", "shutdown.method");
  expectExact(scope, run.shutdown?.processReturnCode, 143, "shutdown.processReturnCode");
  for (const key of [
    "unrealPreparingToExit",
    "unrealGameEngineShutDown",
    "unrealObjectSubsystemClosed",
    "unrealExiting",
    "cleanUnrealShutdown",
  ]) {
    expectExact(scope, run.shutdown?.[key], true, `shutdown.${key}`);
  }
}

function validateLogContent(receipt, run, expected) {
  const scope = expected.reviewId;
  const { text } = receipt;
  const lines = text.split(/\r?\n/u);
  const alphaText = typeof run?.scan?.visibleRoleExerciseAlpha === "number"
    ? run.scan.visibleRoleExerciseAlpha.toFixed(4)
    : "<invalid>";
  const admission =
    `SHI_COUNCIL_SKIN_LOOKDEV_RUNTIME_ADMITTED character=chen-sheng role=speaker mesh=${meshPath} slot=${materialSlot} material=${materialPath} route=${routeId} textures=3 parameters=BaseColor2K,MaterialMasks2K,DetailNormal1K metallic=0.0000 specular=0.2500 profile_opacity_source=MaterialMasks2K.B profile_opacity=0.3490 effective_mfp=0.9336 subsurface_color=unconnected motion=${expected.motion} final_skin=false close_camera=false human_review=false`;
  const exercise =
    `SHI_COUNCIL_SKIN_LOOKDEV_MORPH_SECTIONS_EXERCISED character=chen-sheng role=speaker state=object-glance slot=${materialSlot} material=${materialPath} eye=EyeBrown motion=${expected.motion} alpha=${alphaText}`;

  expectExact(scope, countLiteral(text, "SHI_COUNCIL_SKIN_LOOKDEV_RUNTIME_ADMITTED"), 1, "total skin admission markers");
  expectExact(scope, countLiteral(text, admission), 1, "exact Chen skin admission marker");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_SKIN_LOOKDEV_MORPH_SECTIONS_EXERCISED"), 1, "total skin object-glance markers");
  expectExact(scope, countLiteral(text, exercise), 1, "exact Chen skin object-glance marker");
  expectExact(scope, countLiteral(text,
    "LogVulkanRHI: AcquireNextImage() failed due to the outdated swapchain, not even attempting to present."),
  1, "pre-admission outdated-swapchain Display diagnostic");
  expectExact(scope, countLiteral(text,
    "LogVulkanRHI: Display: - DeviceName: NVIDIA GeForce RTX 4090 D"),
  1, "selected NVIDIA GeForce RTX 4090 D Vulkan device marker");
  expectExact(scope, countLiteral(text, "Warning:"), 4, "Warning-severity markers");

  const commandLines = lines.filter((line) => line.includes("LogInit: Command Line:"));
  expectExact(scope, commandLines.length, 1, "LogInit command-line records");
  if (commandLines.length === 1) {
    const commandLine = commandLines[0];
    const expectedOverride =
      `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${expected.reducedMotion ? "True" : "False"}`;
    const oppositeOverride =
      `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${expected.reducedMotion ? "False" : "True"}`;
    expectExact(scope, countCommandToken(commandLine, reviewFlag), 1, "exact skin-review flag token");
    expectExact(scope, countCommandToken(commandLine, expectedOverride), 1, "expected reduced-motion override token");
    expectExact(scope, countCommandToken(commandLine, oppositeOverride), 0, "opposite reduced-motion override token");
    for (const otherFlag of otherReviewFlags) {
      expectExact(scope, countCommandToken(commandLine, otherFlag), 0, `forbidden concurrent review flag ${otherFlag}`);
    }
  }

  validateInertEvidence(run, text, expected);

  let priorExitOffset = -1;
  for (const marker of exitSequence) {
    expectExact(scope, countLiteral(text, marker), 1, `clean-exit marker ${marker}`);
    const markerOffset = text.indexOf(marker);
    if (markerOffset !== -1 && markerOffset <= priorExitOffset) {
      reject(scope, `clean-exit marker is out of order: ${marker}`);
    }
    priorExitOffset = Math.max(priorExitOffset, markerOffset);
  }
  expectExact(scope, countLiteral(text, "ReturnCode="), 1, "Unreal return-code records");

  for (const [label, pattern] of forbiddenLogPatterns) {
    if (pattern.test(text)) reject(scope, `forbidden ${label} signature is present`);
  }
}

async function validateExternalSaveAbsence(receipt, expected) {
  const scope = `${expected.reviewId} save absence`;
  const commandLine = receipt.text.split(/\r?\n/u)
    .find((line) => line.includes("LogInit: Command Line:"));
  const match = commandLine?.match(/(?:^|\s)-UserDir=([^\s]+)/u);
  if (!match) {
    reject(scope, "runtime command line does not bind a unique external UserDir");
    return;
  }
  const expectedBasename = expected.reviewId === "skin-normal"
    ? "SHI-DazeCouncilSkinLookdev-PathSanitized-ReviewUser-normal-v6"
    : "SHI-DazeCouncilSkinLookdev-PathSanitized-ReviewUser-reduced-v6";
  const userDir = resolve(match[1]);
  expectExact(scope, basename(userDir), expectedBasename, "external review UserDir basename");
  if (isInside(repositoryRoot, userDir)) reject(scope, "runtime UserDir must remain outside the repository");
  try {
    const userDirReal = await realpath(userDir);
    if (isInside(repositoryRoot, userDirReal)) reject(scope, "resolved runtime UserDir enters the repository");
  } catch (error) {
    reject(scope, `runtime UserDir is unavailable (${error.code ?? "path failure"})`);
    return;
  }
  const savePath = resolve(userDir, "Saved/SaveGames/shi-chapter-01-v6.json");
  try {
    await stat(savePath);
    reject(scope, "fresh review campaign save unexpectedly exists");
  } catch (error) {
    if (error.code !== "ENOENT") reject(scope, `could not prove save absence (${error.code ?? "stat failure"})`);
  }
}

async function validatePackage(packageRoot, manifest) {
  const scope = "package";
  let packageRealRoot;
  try {
    const packageRootStats = await stat(packageRoot);
    if (!packageRootStats.isDirectory()) reject(scope, "SHI_UNREAL_PACKAGE_ROOT must be a directory");
    packageRealRoot = await realpath(packageRoot);
  } catch (error) {
    reject(scope, `SHI_UNREAL_PACKAGE_ROOT is unavailable (${error.code ?? "path failure"})`);
    return;
  }
  if (isInside(repositoryRoot, packageRealRoot)) reject(scope, "packaged builds must remain outside the Git repository");

  const linuxRoot = resolve(packageRealRoot, "Linux");
  let linuxRealRoot;
  try {
    const linuxStats = await stat(linuxRoot);
    if (!linuxStats.isDirectory()) reject(scope, "the package root must contain a Linux directory");
    linuxRealRoot = await realpath(linuxRoot);
  } catch (error) {
    reject(scope, `Linux package directory is unavailable (${error.code ?? "path failure"})`);
    return;
  }
  if (!isInside(packageRealRoot, linuxRealRoot)) reject(scope, "resolved Linux package directory escapes the supplied package root");

  const logicalRoot = "$SHI_UNREAL_PACKAGE_ROOT/Linux";
  expectExact(scope, manifest.package?.outsideGitRoot, logicalRoot, "manifest package root");
  expectExact(scope, manifest.visiblePlaytest?.package, logicalRoot, "visible-playtest package root");
  expectExact(scope, manifest.package?.result, "BUILD SUCCESSFUL", "build result");
  expectExact(scope, manifest.package?.exitCode, 0, "build exitCode");
  expectExact(scope, manifest.package?.alwaysCookPath, isolatedRoot, "alwaysCookPath");
  expectExact(scope, manifest.package?.isolatedAssetCount, 5, "isolatedAssetCount");
  expectPositiveInteger(scope, manifest.package?.cookedPackageCount, "cookedPackageCount");
  expectExact(scope, manifest.package?.incrementallySkippedPackageCount, 0, "incrementallySkippedPackageCount");
  expectNonnegativeInteger(scope, manifest.package?.platformSkippedPackageCount, "platformSkippedPackageCount");
  expectPositiveInteger(scope, manifest.package?.totalCookCandidates, "totalCookCandidates");
  expectExact(
    scope,
    manifest.package?.cookedPackageCount + manifest.package?.platformSkippedPackageCount,
    manifest.package?.totalCookCandidates,
    "cooked plus platform-skipped package total",
  );
  expectExact(scope, manifest.package?.cookErrors, 0, "cookErrors");
  expectExact(scope, manifest.package?.cookWarnings, 0, "cookWarnings");
  expectExact(scope, manifest.package?.executionSeconds, 110.37, "executionSeconds");
  expectExact(scope, manifest.package?.buildActionCount, 75, "buildActionCount");
  expectExact(scope, manifest.package?.engineeringAdmission, true, "engineeringAdmission");
  expectExact(scope, manifest.package?.visualArtAdmission, false, "visualArtAdmission");
  expectExact(scope, manifest.package?.disposition,
    "corrected-opacity-route-package-engineering-pass-visual-art-review-rejected", "disposition");
  expectExact(scope, manifest.package?.receiptRevision,
    "privacy-v11-path-sanitized-package-v5-current", "receiptRevision");
  expectExact(scope, manifest.package?.predatesPrivacyV11UassetSerialization, false,
    "predatesPrivacyV11UassetSerialization");
  expectExact(scope, manifest.package?.builtFromCurrentPrivacyV11SourceUassets, true,
    "builtFromCurrentPrivacyV11SourceUassets");
  expectExact(scope, manifest.package?.cookedContainersTransformEditorSerialization, true,
    "cookedContainersTransformEditorSerialization");
  expectExact(scope, manifest.package?.freshPrivacyV11PackagePending, false,
    "freshPrivacyV11PackagePending");
  expectExact(scope, manifest.package?.preservedMaterialRouteEvidence, true,
    "preservedMaterialRouteEvidence");
  const expectedPhaseSeconds = { build: 46.78, cook: 26.15, stage: 36, archive: 0.61 };
  for (const [key, value] of Object.entries(expectedPhaseSeconds))
    expectExact(scope, manifest.package?.phaseSeconds?.[key], value, `phaseSeconds.${key}`);
  const expectedCookResources = {
    cookByTheBookTickSeconds: 2.466689,
    cookByTheBookTotalSeconds: 4.836254,
    peakPhysicalMiB: 2805,
    peakVirtualMiB: 13616,
  };
  for (const [key, value] of Object.entries(expectedCookResources))
    expectExact(scope, manifest.package?.cookResourceSummary?.[key], value, `cookResourceSummary.${key}`);

  const artifacts = manifest.package?.artifacts;
  if (!Array.isArray(artifacts)) {
    reject(scope, "manifest package.artifacts must be an array");
    return;
  }
  expectExact(scope, artifacts.length, expectedArtifacts.length, "artifact receipt count");
  const artifactByPath = new Map();
  for (const artifact of artifacts) {
    const artifactScope = `package artifact ${artifact?.relativePath ?? "<missing>"}`;
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      reject(artifactScope, "receipt must be an object");
      continue;
    }
    if (typeof artifact.relativePath !== "string" || artifact.relativePath.length === 0) {
      reject(artifactScope, "relativePath must be a non-empty string");
      continue;
    }
    if (isAbsolute(artifact.relativePath) || artifact.relativePath.includes("\\")) {
      reject(artifactScope, "relativePath must be a portable relative path");
      continue;
    }
    const candidate = resolve(linuxRoot, artifact.relativePath);
    if (!isInside(linuxRoot, candidate) || candidate === linuxRoot) {
      reject(artifactScope, "relativePath escapes the Linux package root");
      continue;
    }
    if (artifactByPath.has(artifact.relativePath)) {
      reject(artifactScope, "duplicate artifact receipt");
      continue;
    }
    validateReceiptShape(artifactScope, artifact);
    artifactByPath.set(artifact.relativePath, { artifact, candidate });
  }

  for (const expected of expectedArtifacts) {
    const entry = artifactByPath.get(expected.relativePath);
    if (!entry) {
      reject(scope, `missing artifact receipt ${expected.relativePath}`);
      continue;
    }
    const artifactScope = `package artifact ${expected.relativePath}`;
    expectExact(artifactScope, entry.artifact.role, expected.role, "role");
    expectExact(artifactScope, entry.artifact.bytes, expected.bytes, "manifest exact bytes");
    expectExact(artifactScope, entry.artifact.sha256, expected.sha256, "manifest exact sha256");
    try {
      const artifactStats = await stat(entry.candidate);
      if (!artifactStats.isFile()) {
        reject(artifactScope, "package artifact is not a regular file");
        continue;
      }
      const artifactRealPath = await realpath(entry.candidate);
      if (!isInside(linuxRealRoot, artifactRealPath)) {
        reject(artifactScope, "resolved artifact escapes the Linux package root");
        continue;
      }
      expectExact(artifactScope, artifactStats.size, entry.artifact.bytes, "bytes");
      expectExact(artifactScope, await sha256File(artifactRealPath), entry.artifact.sha256, "sha256");
    } catch (error) {
      reject(artifactScope, `could not inspect package artifact (${error.code ?? "inspection failure"})`);
    }
  }
}

async function validatePathSanitization(packageRoot, manifest) {
  const scope = "path-sanitized development package";
  const linuxRoot = resolve(packageRoot, "Linux");
  const sanitization = manifest.package?.pathSanitization;
  expectExact(scope, sanitization?.status,
    "pass-authorized-rpath-mutation-then-immutable-inspection", "status");
  expectExact(scope, sanitization?.script?.file,
    "scripts/sanitize-unreal-linux-development-package.mjs", "script.file");
  expectExact(scope, sanitization?.script?.tracked, true, "script.tracked");
  expectExact(scope, sanitization?.script?.bytes, 6989, "script.bytes");
  expectExact(scope, sanitization?.script?.sha256,
    "f0dc86ac46f8649bab64ff8137bf2c11dc8ebe5b047e6eda4ba32d6ea693c8f5", "script.sha256");
  const scriptReceipt = await readReceipt(scope, resolve(repositoryRoot, sanitization?.script?.file ?? ""));
  if (scriptReceipt) {
    expectExact(scope, scriptReceipt.bytes, sanitization.script.bytes, "tracked script bytes");
    expectExact(scope, scriptReceipt.sha256, sanitization.script.sha256, "tracked script sha256");
  }

  const expectedTool = {
    name: "patchelf",
    version: "patchelf 0.18.0",
    executableBytes: 252256,
    executableSha256: "35fc95654387035338a74bb8cf62fde3712ec83dd8ca30a768deb714d07f063a",
    ubuntuPackageSha256: "962a43e33cd56061522554898557a038ccbb8aa4e1e0f421b2d6f6adf1f80c60",
  };
  for (const [key, value] of Object.entries(expectedTool))
    expectExact(scope, sanitization?.tool?.[key], value, `tool.${key}`);
  let patchelfPath = null;
  for (const entry of (process.env.PATH ?? "").split(":")) {
    if (!entry) continue;
    const candidate = resolve(entry, "patchelf");
    try {
      if ((await stat(candidate)).isFile()) { patchelfPath = candidate; break; }
    } catch { /* Continue searching PATH. */ }
  }
  if (patchelfPath === null) {
    reject(scope, "patchelf is unavailable on PATH");
  } else {
    const patchelfReceipt = await readReceipt(scope, patchelfPath);
    if (patchelfReceipt) {
      expectExact(scope, patchelfReceipt.bytes, expectedTool.executableBytes, "installed patchelf bytes");
      expectExact(scope, patchelfReceipt.sha256, expectedTool.executableSha256, "installed patchelf sha256");
    }
  }

  expectExact(scope, sanitization?.executable?.file, "SHI/Binaries/Linux/SHI", "executable.file");
  expectExact(scope, sanitization?.executable?.preRpathBytes, 298779248, "executable.preRpathBytes");
  expectExact(scope, sanitization?.executable?.preRpathSha256,
    "36c5e0a317b1230da21e5e9bd2f16b76a12b787e243c79ba617f69ae677a02a6",
    "executable.preRpathSha256");
  expectExact(scope, sanitization?.executable?.postRpathBytes, 298779248, "executable.postRpathBytes");
  expectExact(scope, sanitization?.executable?.postRpathSha256,
    "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02",
    "executable.postRpathSha256");
  if (!Array.isArray(sanitization?.exactSafeRpathEntries)
      || sanitization.exactSafeRpathEntries.join("\0") !== expectedSafeRpathEntries.join("\0"))
    reject(scope, "manifest must bind the exact ordered nine-entry packaged-relative RPATH");
  for (const key of ["exactSafeRpathObserved", "changesOnlyExecutableRpath"])
    expectExact(scope, sanitization?.[key], true, key);
  for (const key of ["changesGameplayCode", "changesCookedContent", "changesPakOrIoStore", "finalReleaseApproval"])
    expectExact(scope, sanitization?.[key], false, key);
  expectExact(scope, sanitization?.currentWorkstationPathMarkerCount, 0, "currentWorkstationPathMarkerCount");
  expectExact(scope, sanitization?.securityTokenMarkerCount, 0, "securityTokenMarkerCount");
  expectExact(scope, sanitization?.lddObservedLineCount, 8, "lddObservedLineCount");
  expectExact(scope, sanitization?.unresolvedDependencyCount, 0, "unresolvedDependencyCount");

  const additional = sanitization?.additionalArtifacts;
  if (!Array.isArray(additional)
      || !sameStringSet(additional.map((item) => item?.file), [
        "SHI/Binaries/Linux/SHI.debug", "SHI/Binaries/Linux/SHI.sym",
      ])) reject(scope, "additionalArtifacts must bind exactly SHI.debug and SHI.sym");
  for (const item of additional ?? []) {
    const expected = expectedPathSanitizedArtifacts[item.file];
    if (!expected) continue;
    expectExact(scope, item.bytes, expected[0], `${item.file}.bytes`);
    expectExact(scope, item.sha256, expected[1], `${item.file}.sha256`);
  }

  const forbiddenPublicMarkers = [
    `${dirname(dirname(repositoryRoot))}/`, "SecurityToken=", hostname(),
    "/tmp/shi-skin-lookdev-package-source-v4",
  ];
  for (const [file, expected] of Object.entries(expectedPathSanitizedArtifacts)) {
    const artifactScope = `${scope} ${file}`;
    const artifactPath = resolve(linuxRoot, file);
    const receipt = await readReceipt(artifactScope, artifactPath);
    if (!receipt) continue;
    expectExact(artifactScope, receipt.bytes, expected[0], "bytes");
    expectExact(artifactScope, receipt.sha256, expected[1], "sha256");
    const text = (await readFile(artifactPath)).toString("latin1");
    for (const token of forbiddenPublicMarkers)
      if (text.includes(token)) reject(artifactScope, `forbidden public-artifact marker ${JSON.stringify(token)}`);
    if (file === "SHI/Binaries/Linux/SHI" && !text.includes(expectedSafeRpathEntries.join(":")))
      reject(artifactScope, "exact packaged-relative RPATH string is absent");
  }

  const reportRoot = dirname(dirname(resolve(process.env.SHI_SKIN_LOOKDEV_PACKAGE_LOG)));
  const expectedReports = [
    ["mutationReport", "SHI-DazeCouncilSkinLookdev-PathSanitized-Rpath-Mutation-v5.json", 2870,
      "9e1b15afdc19bd7f5dfc89f4043a8e569fcd8cb3ff9bb89aff8e9b1607f6076c", "authorized-rpath-sanitize", true],
    ["inspectReport", "SHI-DazeCouncilSkinLookdev-PathSanitized-Rpath-Inspect-v5.json", 2861,
      "9340d0636ed9840321099c62eb6230779cc5eae0be397ecc2c33dfe8af1f19c2", "inspect-only", false],
  ];
  for (const [key, file, bytes, sha256, mode, mutationPerformed] of expectedReports) {
    const manifestReceipt = sanitization?.[key];
    expectExact(scope, manifestReceipt?.file, `$SHI_UNREAL_REVIEW_ROOT/${file}`, `${key}.file`);
    expectExact(scope, manifestReceipt?.tracked, false, `${key}.tracked`);
    expectExact(scope, manifestReceipt?.bytes, bytes, `${key}.bytes`);
    expectExact(scope, manifestReceipt?.sha256, sha256, `${key}.sha256`);
    const reportReceipt = await readReceipt(`${scope} ${key}`, resolve(reportRoot, file));
    if (!reportReceipt) continue;
    expectExact(scope, reportReceipt.bytes, bytes, `${key} external bytes`);
    expectExact(scope, reportReceipt.sha256, sha256, `${key} external sha256`);
    let report;
    try { report = JSON.parse(reportReceipt.text); } catch { reject(scope, `${key} must be valid JSON`); continue; }
    expectExact(scope, report.mode, mode, `${key} mode`);
    expectExact(scope, report.mutationPerformed, mutationPerformed, `${key} mutationPerformed`);
    expectExact(scope, report.packageRoot, "$SHI_UNREAL_PACKAGE_ROOT/Linux", `${key} packageRoot`);
    expectExact(scope, report.rpath?.exactSafeRpathObserved, true, `${key} exactSafeRpathObserved`);
    expectExact(scope, report.rpath?.absoluteWorkstationPathCount, 0, `${key} absoluteWorkstationPathCount`);
    if (!Array.isArray(report.rpath?.exactSafeEntries)
        || report.rpath.exactSafeEntries.join("\0") !== expectedSafeRpathEntries.join("\0"))
      reject(scope, `${key} exactSafeEntries drifted`);
    expectExact(scope, report.dependencyInspection?.observedLineCount, 8, `${key} ldd observedLineCount`);
    expectExact(scope, report.dependencyInspection?.unresolvedDependencyCount, 0,
      `${key} unresolvedDependencyCount`);
    expectExact(scope, report.dependencyInspection?.passed, true, `${key} dependency passed`);
    expectExact(scope, report.passed, true, `${key} passed`);
  }
}

async function validatePackageLog(manifest, packageLogPath) {
  const scope = "package build log";
  const logManifest = manifest.package?.buildLog;
  expectExact(scope, logManifest?.file, `$SHI_UNREAL_PACKAGE_LOG_ROOT/${basename(packageLogPath)}`, "logical path");
  expectExact(scope, logManifest?.tracked, false, "tracked");
  validateReceiptShape(scope, logManifest);

  const externalLogPath = await resolveExternalLog(
    scope,
    packageLogPath,
    "SHI_SKIN_LOOKDEV_PACKAGE_LOG",
  );
  if (!externalLogPath) return;
  const receipt = await readReceipt(scope, externalLogPath);
  if (!receipt) return;
  expectExact(scope, receipt.bytes, logManifest?.bytes, "bytes against manifest");
  expectExact(scope, receipt.sha256, logManifest?.sha256, "sha256 against manifest");

  const buildSuccessfulMarkers = countLiteral(receipt.text, "BUILD SUCCESSFUL");
  const automationExitCodeZeroMarkers = countLiteral(
    receipt.text,
    "AutomationTool exiting with ExitCode=0 (Success)",
  );
  expectExact(scope, buildSuccessfulMarkers, 1, "BUILD SUCCESSFUL markers");
  expectExact(scope, automationExitCodeZeroMarkers, 1, "successful AutomationTool exit markers");

  const summaryPattern = /LogCook: Display:\s+Packages Cooked: (\d+), Packages Incrementally Skipped: (\d+), Packages Skipped by Platform: (\d+), Total Packages: (\d+)/gu;
  const summaries = [...receipt.text.matchAll(summaryPattern)];
  expectExact(scope, summaries.length, 1, "final cook summary markers");
  if (summaries.length === 1) {
    const [, cooked, incrementallySkipped, platformSkipped, total] = summaries[0];
    expectExact(scope, Number(cooked), manifest.package?.cookedPackageCount, "observed cookedPackageCount");
    expectExact(scope, Number(incrementallySkipped), manifest.package?.incrementallySkippedPackageCount, "observed incrementallySkippedPackageCount");
    expectExact(scope, Number(platformSkipped), manifest.package?.platformSkippedPackageCount, "observed platformSkippedPackageCount");
    expectExact(scope, Number(total), manifest.package?.totalCookCandidates, "observed totalCookCandidates");
  }

  let forbiddenCount = 0;
  for (const [label, pattern] of packageLogForbiddenPatterns) {
    if (pattern.test(receipt.text)) {
      forbiddenCount += 1;
      reject(scope, `forbidden ${label} signature is present`);
    }
  }
  const expectedScan = {
    buildSuccessfulMarkers: 1,
    automationExitCodeZeroMarkers: 1,
    cookSummaryMarkers: 1,
    cookedPackageCount: manifest.package?.cookedPackageCount,
    cookErrorMarkers: 0,
    cookWarningMarkers: 0,
    materialWarningMarkers: 0,
    targetedFallbackMarkers: 0,
    fatalErrors: 0,
    warningSeverityMarkers: 0,
    errorSeverityMarkers: 0,
    nonfatalDisplayFailedDiagnostics: 4,
    passed: true,
  };
  for (const [key, expected] of Object.entries(expectedScan)) {
    expectExact(scope, logManifest?.scan?.[key], expected, `scan.${key}`);
  }
  const expectedDiagnosticKinds = [
    "missing engine game directory",
    "Android SDK setup unavailable during Linux-only package",
    "stale shader-autogen delete failure before regeneration",
    "storage-server connection unavailable before local fallback",
  ];
  if (!Array.isArray(logManifest?.scan?.nonfatalDisplayDiagnosticKinds)
      || logManifest.scan.nonfatalDisplayDiagnosticKinds.join("\0") !== expectedDiagnosticKinds.join("\0")) {
    reject(scope, "scan.nonfatalDisplayDiagnosticKinds must bind the exact four ordered nonfatal diagnostics");
  }
  expectExact(scope, countLiteral(receipt.text, "Warning:"), 0, "Warning-severity markers");
  expectExact(scope, countLiteral(receipt.text, "Error:"), 0, "Error-severity markers");
  expectExact(scope, countLiteral(receipt.text, "Failed"), 4, "documented nonfatal Display-level Failed diagnostics");

  const logRoot = dirname(externalLogPath);
  const reviewRoot = dirname(logRoot);
  const ancillary = [
    ["transcript", resolve(reviewRoot, "SHI-DazeCouncilSkinLookdev-PathSanitized-Package-v5.transcript.log"),
      "$SHI_UNREAL_PACKAGE_LOG_ROOT/../SHI-DazeCouncilSkinLookdev-PathSanitized-Package-v5.transcript.log",
      131078, "7f7656988c666f6e1b649562fcd24cf9fb29e4c4293626988fff8104e6ed0e4e"],
    ["ufsManifest", resolve(logRoot, "FinalCopyLinux_UFSFiles.txt"),
      "$SHI_UNREAL_PACKAGE_LOG_ROOT/FinalCopyLinux_UFSFiles.txt",
      431878, "060da31560d94eb546fa63acaab93e9541455fde38c541316609ae4ee554daac"],
  ];
  for (const [key, path, logicalPath, bytes, sha256] of ancillary) {
    const declared = manifest.package?.[key];
    expectExact(scope, declared?.file, logicalPath, `${key}.file`);
    expectExact(scope, declared?.tracked, false, `${key}.tracked`);
    expectExact(scope, declared?.bytes, bytes, `${key}.bytes`);
    expectExact(scope, declared?.sha256, sha256, `${key}.sha256`);
    const ancillaryReceipt = await readReceipt(`${scope} ${key}`, path);
    if (!ancillaryReceipt) continue;
    expectExact(scope, ancillaryReceipt.bytes, bytes, `${key} external bytes`);
    expectExact(scope, ancillaryReceipt.sha256, sha256, `${key} external sha256`);
    if (key === "ufsManifest") {
      const lines = ancillaryReceipt.text.trimEnd().split(/\r?\n/u);
      const isolatedLines = lines.filter((line) => line.includes("DazeCouncilSkinLookdevV1"));
      expectExact(scope, lines.length, 2428, "ufsManifest.entries");
      expectExact(scope, isolatedLines.length, 8, "ufsManifest.isolatedSkinLookdevEntries");
      expectExact(scope, isolatedLines.filter((line) => line.includes(".uasset\"")).length, 5,
        "ufsManifest isolated .uasset entries");
      expectExact(scope, isolatedLines.filter((line) => line.includes(".ubulk\"")).length, 3,
        "ufsManifest isolated .ubulk entries");
      expectExact(scope, declared?.entries, 2428, "ufsManifest declared entries");
      expectExact(scope, declared?.isolatedSkinLookdevEntries, 8,
        "ufsManifest declared isolatedSkinLookdevEntries");
    }
  }

  const projectMatches = [...receipt.text.matchAll(/-project=(\/tmp\/shi-skin-lookdev-package-source-v4\/apps\/unreal\/SHI\.uproject)\b/gu)];
  expectExact(scope, projectMatches.length, 2, "anonymized package-source project arguments");
  const snapshot = manifest.package?.sourceSnapshot;
  expectExact(scope, snapshot?.root, "$SHI_UNREAL_ANONYMIZED_PACKAGE_SOURCE/apps/unreal", "sourceSnapshot.root");
  expectExact(scope, snapshot?.privacyRevision, privacyRevision, "sourceSnapshot.privacyRevision");
  expectExact(scope, snapshot?.matchesCurrentRepositoryReceipts, true, "sourceSnapshot.matchesCurrentRepositoryReceipts");
  expectExact(scope, snapshot?.embeddedMetadataPrivacyPassed, true, "sourceSnapshot.embeddedMetadataPrivacyPassed");
  const snapshotRoot = "/tmp/shi-skin-lookdev-package-source-v4/apps/unreal/Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1";
  if (!snapshot?.trackedUassets || !sameStringSet(
    Object.keys(snapshot.trackedUassets), Object.keys(expectedTrackedUassetReceipts),
  )) {
    reject(scope, "sourceSnapshot.trackedUassets must bind exactly the five privacy-v11 source uassets");
  } else {
    for (const [file, expected] of Object.entries(expectedTrackedUassetReceipts)) {
      const declared = snapshot.trackedUassets[file];
      expectExact(scope, declared?.bytes, expected.bytes, `sourceSnapshot.${file}.bytes`);
      expectExact(scope, declared?.sha256, expected.sha256, `sourceSnapshot.${file}.sha256`);
      const snapshotPath = resolve(snapshotRoot, file);
      const snapshotReceipt = await readReceipt(`${scope} sourceSnapshot ${file}`, snapshotPath);
      if (!snapshotReceipt) continue;
      expectExact(scope, snapshotReceipt.bytes, expected.bytes, `sourceSnapshot external ${file}.bytes`);
      expectExact(scope, snapshotReceipt.sha256, expected.sha256, `sourceSnapshot external ${file}.sha256`);
      const binaryText = (await readFile(snapshotPath)).toString("latin1");
      for (const token of ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "Factory_/", "InterchangeAssetImportData"]) {
        if (binaryText.includes(token)) reject(scope, `sourceSnapshot ${file} contains forbidden metadata token ${JSON.stringify(token)}`);
      }
      if (expected.sourceIdentity === null) {
        if (binaryText.includes("AssetImportData") || binaryText.includes("RelativeFilename"))
          reject(scope, `sourceSnapshot ${file} must not retain import source identity`);
      } else {
        for (const token of ["AssetImportData", "RelativeFilename", basename(expected.sourceIdentity)])
          if (!binaryText.includes(token)) reject(scope, `sourceSnapshot ${file} is missing ${JSON.stringify(token)}`);
      }
    }
  }
  if (forbiddenCount > 0) expectExact(scope, logManifest?.scan?.passed, false, "scan.passed with forbidden signatures");
}

async function validateScreenshots(manifest) {
  const scope = "tracked corrected-opacity screenshots";
  const screenshots = manifest.screenshots;
  if (!Array.isArray(screenshots)) {
    reject(scope, "screenshots must be an array");
    return;
  }
  expectExact(scope, screenshots.length, expectedScreenshots.length, "screenshot receipt count");
  if (!sameStringSet(screenshots.map((item) => item?.file), expectedScreenshots.map((item) => item.file))) {
    reject(scope, "screenshots must contain exactly the three corrected-opacity v2 review images");
  }
  for (const expected of expectedScreenshots) {
    const screenshot = screenshots.find((item) => item?.file === expected.file);
    const screenshotScope = `${scope} ${expected.file}`;
    if (!screenshot) continue;
    expectExact(screenshotScope, screenshot.reviewId, expected.reviewId, "reviewId");
    expectExact(screenshotScope, screenshot.dimensions?.[0], 1600, "width");
    expectExact(screenshotScope, screenshot.dimensions?.[1], 1000, "height");
    expectExact(screenshotScope, screenshot.bitDepth, 8, "bitDepth");
    expectExact(screenshotScope, screenshot.channels, 3, "channels");
    expectExact(screenshotScope, screenshot.colorSpace, "sRGB", "colorSpace");
    expectExact(screenshotScope, screenshot.alpha, false, "alpha");
    expectExact(screenshotScope, screenshot.bytes, expected.bytes, "bytes");
    expectExact(screenshotScope, screenshot.sha256, expected.sha256, "sha256");
    const receipt = await readReceipt(screenshotScope, resolve(repositoryRoot, expected.file));
    if (!receipt) continue;
    expectExact(screenshotScope, receipt.bytes, expected.bytes, "tracked bytes");
    expectExact(screenshotScope, receipt.sha256, expected.sha256, "tracked sha256");
  }

  const normal = screenshots.find((item) => item?.file.includes("opacity-normal-material-qa-v2"));
  expectExact(scope, normal?.rawCaptureEvidence, "visiblePlaytest.rawCaptureEvidence.normal",
    "normal rawCaptureEvidence pointer");
  expectExact(scope, normal?.rawCaptureWithinNormalObjectGlanceSection, true,
    "normal rawCaptureWithinNormalObjectGlanceSection");
  expectExact(scope, normal?.rawToPngPixelDifferenceCount, 0, "normal rawToPngPixelDifferenceCount");

  const glance = screenshots.find((item) => item?.file.includes("opacity-reduced-object-glance-v2"));
  const exactGlance = {
    runtimeMarkerAtUtc: "2026-08-10T18:01:25.696Z",
    rawCaptureStartAtUtc: "2026-08-10T18:01:25.731183811Z",
    rawCaptureCompleteAtUtc: "2026-08-10T18:01:25.742618803Z",
    captureStartSecondsAfterMarker: 0.035183811,
    captureCompleteSecondsAfterAdmission: 1.166618803,
    captureStartSecondsAfterAdmission: 1.155183811,
    rawCaptureWithinReducedObjectGlanceSection: true,
    deterministicPngEncodingAfterRawCapture: true,
    rawToPngPixelDifferenceCount: 0,
  };
  for (const [key, expected] of Object.entries(exactGlance))
    expectExact(scope, glance?.[key], expected, `reduced glance ${key}`);
  if (!glance?.captureQualification?.includes("strict reduced speaker interval (1.02, 1.48)")
      || !glance.captureQualification.includes("XWD-to-PNG AE is exactly zero")) {
    reject(scope, "reduced glance captureQualification must state the strict interval and lossless raw conversion");
  }

  const terminal = screenshots.find((item) => item?.file.includes("opacity-reduced-terminal-neutral-v2"));
  const exactTerminal = {
    rawCaptureStartAtUtc: "2026-08-10T18:01:29.094843532Z",
    rawCaptureCompleteAtUtc: "2026-08-10T18:01:29.107590985Z",
    captureStartSecondsAfterAdmission: 4.518843532,
    deterministicPngEncodingAfterRawCapture: true,
    rawToPngPixelDifferenceCount: 0,
  };
  for (const [key, expected] of Object.entries(exactTerminal))
    expectExact(scope, terminal?.[key], expected, `reduced terminal ${key}`);

  const raw = manifest.visiblePlaytest?.rawCaptureEvidence;
  expectExact(scope, raw?.clock,
    "UTC nanoseconds recorded immediately around raw X11 capture; PNG filesystem times are not capture-start evidence",
    "rawCaptureEvidence.clock");
  const exactNormal = {
    runtimeAdmissionAtUtc: "2026-08-10T17:59:36.004Z",
    runtimeMorphMarkerAtUtc: "2026-08-10T17:59:37.112Z",
    markerObservedAtUtc: "2026-08-10T17:59:37.302435784Z",
    captureStartAtUtc: "2026-08-10T17:59:37.464644246Z",
    captureCompleteAtUtc: "2026-08-10T17:59:37.474167318Z",
    captureStartSecondsAfterAdmission: 1.460644246,
    captureCompleteSecondsAfterAdmission: 1.470167318,
    captureStartSecondsAfterMorphMarker: 0.352644246,
    captureStartSecondsAfterMarkerObserved: 0.162208462,
    withinNormalObjectGlanceSection: true,
    rawToPngPixelDifferenceCount: 0,
  };
  for (const [key, expected] of Object.entries(exactNormal))
    expectExact(scope, raw?.normal?.[key], expected, `rawCaptureEvidence.normal.${key}`);
  const exactReduced = {
    runtimeAdmissionAtUtc: "2026-08-10T18:01:24.576Z",
    runtimeMorphMarkerAtUtc: "2026-08-10T18:01:25.696Z",
    markerObservedAtUtc: "2026-08-10T18:01:25.730319407Z",
    glanceCaptureStartAtUtc: "2026-08-10T18:01:25.731183811Z",
    glanceCaptureCompleteAtUtc: "2026-08-10T18:01:25.742618803Z",
    glanceCaptureStartSecondsAfterAdmission: 1.155183811,
    glanceCaptureCompleteSecondsAfterAdmission: 1.166618803,
    glanceCaptureStartSecondsAfterMorphMarker: 0.035183811,
    glanceCaptureStartSecondsAfterMarkerObserved: 0.000864404,
    withinReducedObjectGlanceSection: true,
    terminalCaptureStartAtUtc: "2026-08-10T18:01:29.094843532Z",
    terminalCaptureCompleteAtUtc: "2026-08-10T18:01:29.107590985Z",
    terminalCaptureStartSecondsAfterAdmission: 4.518843532,
    terminalAfterFourSecondNeutralClamp: true,
    glanceRawToPngPixelDifferenceCount: 0,
    terminalRawToPngPixelDifferenceCount: 0,
  };
  for (const [key, expected] of Object.entries(exactReduced))
    expectExact(scope, raw?.reduced?.[key], expected, `rawCaptureEvidence.reduced.${key}`);
  if (!(raw?.normal?.captureStartSecondsAfterAdmission > 1.02
      && raw.normal.captureCompleteSecondsAfterAdmission < 1.48)) {
    reject(scope, "normal raw capture must start and complete inside the strict (1.02, 1.48) object-glance interval");
  }
  if (!(raw?.reduced?.glanceCaptureStartSecondsAfterAdmission > 1.02
      && raw.reduced.glanceCaptureCompleteSecondsAfterAdmission < 1.48)) {
    reject(scope, "reduced raw glance must start and complete inside the strict (1.02, 1.48) object-glance interval");
  }
  if (!(raw?.reduced?.terminalCaptureStartSecondsAfterAdmission > 4))
    reject(scope, "reduced terminal raw capture must begin after the four-second neutral clamp");

  const reviewRoot = dirname(resolve(process.env.SHI_SKIN_LOOKDEV_NORMAL_LOG));
  expectExact(scope, dirname(resolve(process.env.SHI_SKIN_LOOKDEV_REDUCED_LOG)), reviewRoot,
    "normal/reduced external review root");
  const rawReceipts = [
    ["normal timing", raw?.normal?.timingReceipt,
      "SHI-DazeCouncilSkinLookdev-PathSanitized-Review-normal-v6-capture-times.txt", 148,
      "206a71da5a95ceb4d017dec93618e0426b8f8dab530b08a3f3987110c195c3aa",
      "marker_seen_utc=2026-08-10T17:59:37.302435784Z\ncapture_start_utc=2026-08-10T17:59:37.464644246Z\ncapture_complete_utc=2026-08-10T17:59:37.474167318Z\n"],
    ["normal XWD", raw?.normal?.rawXwd,
      "SHI-DazeCouncilSkinLookdev-PathSanitized-Review-normal-v6-material.xwd", 6403179,
      "e315e29517fc0d14f9a5f15da455c98c2d36dfe21609aa70fc44e07af338dd41", null],
    ["reduced timing", raw?.reduced?.timingReceipt,
      "SHI-DazeCouncilSkinLookdev-PathSanitized-Review-reduced-v6-capture-times.txt", 249,
      "758bf8c2d8a6c524e4589836479733840260a3c6c1531f31116bcf8aa9e958c4",
      "marker_seen_utc=2026-08-10T18:01:25.730319407Z\nglance_start_utc=2026-08-10T18:01:25.731183811Z\nglance_complete_utc=2026-08-10T18:01:25.742618803Z\nterminal_start_utc=2026-08-10T18:01:29.094843532Z\nterminal_complete_utc=2026-08-10T18:01:29.107590985Z\n"],
    ["reduced glance XWD", raw?.reduced?.glanceRawXwd,
      "SHI-DazeCouncilSkinLookdev-PathSanitized-Review-reduced-v6-glance.xwd", 6403179,
      "5dd2d955722255317cfbeafebce9a77c8e65706ae6ffb26bcbd70d66f71658f4", null],
    ["reduced terminal XWD", raw?.reduced?.terminalRawXwd,
      "SHI-DazeCouncilSkinLookdev-PathSanitized-Review-reduced-v6-terminal.xwd", 6403179,
      "e6d04745dc7a0214949b0a5aa75e65afb25b643900625728d1b904feb659135a", null],
  ];
  const rawPaths = {};
  for (const [label, declared, filename, bytes, sha256, exactText] of rawReceipts) {
    const receiptScope = `${scope} ${label}`;
    expectExact(receiptScope, declared?.file, `$SHI_UNREAL_REVIEW_ROOT/${filename}`, "logical file");
    expectExact(receiptScope, declared?.tracked, false, "tracked");
    expectExact(receiptScope, declared?.bytes, bytes, "manifest bytes");
    expectExact(receiptScope, declared?.sha256, sha256, "manifest sha256");
    const path = resolve(reviewRoot, filename);
    rawPaths[label] = path;
    const receipt = await readReceipt(receiptScope, path);
    if (!receipt) continue;
    expectExact(receiptScope, receipt.bytes, bytes, "external bytes");
    expectExact(receiptScope, receipt.sha256, sha256, "external sha256");
    if (exactText !== null) expectExact(receiptScope, receipt.text, exactText, "exact timing payload");
  }
  const comparisons = [
    ["normal", rawPaths["normal XWD"], normal?.file],
    ["reduced glance", rawPaths["reduced glance XWD"], glance?.file],
    ["reduced terminal", rawPaths["reduced terminal XWD"], terminal?.file],
  ];
  for (const [label, rawPath, pngFile] of comparisons) {
    if (!rawPath || !pngFile) continue;
    try {
      const { stderr } = await execFileAsync(
        "compare", ["-metric", "AE", rawPath, resolve(repositoryRoot, pngFile), "null:"],
        { encoding: "utf8", maxBuffer: 1024 * 1024 },
      );
      expectExact(scope, stderr.trim(), "0", `${label} raw-to-PNG absolute-error pixel count`);
    } catch (error) {
      reject(scope, `${label} raw-to-PNG comparison failed (${String(error.stderr ?? error.code ?? error.name).trim()})`);
    }
  }
}

async function main() {
  for (const name of requiredEnvironment) {
    if (!process.env[name]?.trim()) reject("environment", `${name} is required`);
  }
  if (errors.length > 0) return;

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    reject("manifest", `could not load presentation evidence (${error.code ?? error.name})`);
    return;
  }
  expectExact("manifest", manifest.schemaVersion, 1, "schemaVersion");
  expectExact("manifest", manifest.assetId, assetId, "assetId");
  expectExact("manifest", manifest.decision, requiredDecision, "decision");
  expectExact("manifest", manifest.requiredDisclosure, requiredDisclosure, "requiredDisclosure");
  validateNoPositiveReleaseClaims(manifest);
  validateRuntimeContract(manifest);
  await validateImportAdmission(manifest);
  await validateScreenshots(manifest);

  const packageRoot = resolve(process.env.SHI_UNREAL_PACKAGE_ROOT);
  const packageLogPath = resolve(process.env.SHI_SKIN_LOOKDEV_PACKAGE_LOG);
  const runContracts = [
    {
      reviewId: "skin-normal",
      environmentName: "SHI_SKIN_LOOKDEV_NORMAL_LOG",
      logPath: resolve(process.env.SHI_SKIN_LOOKDEV_NORMAL_LOG),
      reducedMotion: false,
      motion: "normal",
      expectedAlpha: 0.1474,
    },
    {
      reviewId: "skin-reduced",
      environmentName: "SHI_SKIN_LOOKDEV_REDUCED_LOG",
      logPath: resolve(process.env.SHI_SKIN_LOOKDEV_REDUCED_LOG),
      reducedMotion: true,
      motion: "reduced",
      expectedAlpha: 1,
    },
  ];

  if (new Set(runContracts.map(({ logPath }) => logPath)).size !== runContracts.length) {
    reject("environment", "normal and reduced-motion skin review logs must be distinct files");
  }
  if (runContracts.some(({ logPath }) => logPath === packageLogPath)) {
    reject("environment", "the package build log and two runtime review logs must be three distinct files");
  }
  for (const contract of runContracts) {
    if (isInside(repositoryRoot, contract.logPath)) {
      reject(contract.reviewId, `${contract.environmentName} must point outside the Git repository`);
    }
  }

  const visible = manifest.visiblePlaytest;
  expectExact("manifest visiblePlaytest", visible?.developmentReviewOnly, true, "developmentReviewOnly");
  expectExact("manifest visiblePlaytest", visible?.stackCount, 1, "stackCount");
  expectExact("manifest visiblePlaytest", visible?.stackReusedAcrossCorrectedRuns, true, "stackReusedAcrossCorrectedRuns");
  expectExact("manifest visiblePlaytest", visible?.selectedGpu, "NVIDIA GeForce RTX 4090 D", "selectedGpu");
  expectExact("manifest visiblePlaytest", visible?.receiptRevision,
    "privacy-v11-path-sanitized-package-v5-current-with-normal-reduced-v6-raw-capture-proof", "receiptRevision");
  expectExact("manifest visiblePlaytest", visible?.predatesPrivacyV11UassetSerialization, false,
    "predatesPrivacyV11UassetSerialization");
  expectExact("manifest visiblePlaytest", visible?.postPrivacyV11RuntimeRerun, true,
    "postPrivacyV11RuntimeRerun");
  expectExact("manifest visiblePlaytest", visible?.preservedWatchDecision, true,
    "preservedWatchDecision");
  expectExact("manifest visiblePlaytest", visible?.materialImplementationAcceptedForEngineering, true, "materialImplementationAcceptedForEngineering");
  expectExact("manifest visiblePlaytest", visible?.visualMaterialQualityAccepted, false, "visualMaterialQualityAccepted");
  expectExact("manifest visiblePlaytest", visible?.normalReviewed, true, "normalReviewed");
  expectExact("manifest visiblePlaytest", visible?.reducedMotionReviewed, true, "reducedMotionReviewed");
  expectExact("manifest visiblePlaytest", visible?.normalObjectGlanceCaptureAnchoredToMarker, true,
    "normalObjectGlanceCaptureAnchoredToMarker");
  expectExact("manifest visiblePlaytest", visible?.reducedObjectGlanceCaptureAnchoredToMarker, true, "reducedObjectGlanceCaptureAnchoredToMarker");
  expectExact("manifest visiblePlaytest", visible?.storyProgressionReview, "not-run-for-this-material-qa-review", "storyProgressionReview");
  expectExact("manifest visiblePlaytest", visible?.closeCameraReview, "rejected-not-close-camera-evidence", "closeCameraReview");
  expectExact("manifest visiblePlaytest", visible?.humanHistoricalCulturalReview, "not-run", "humanHistoricalCulturalReview");
  expectExact("manifest visiblePlaytest", visible?.finalCharacterArtReview, "rejected-generic-low-detail-blockout", "finalCharacterArtReview");
  expectExact("manifest review", manifest.review?.technicalMaterialRouteDecision,
    "pass-corrected-opacity-route-package-runtime-engineering-only", "technicalMaterialRouteDecision");
  expectExact("manifest review", manifest.review?.visualArtDecision,
    "reject-generic-low-detail-nonportrait-blockout-for-material-quality-replication-final-close-camera-or-film-quality-use",
    "visualArtDecision");

  const manifestRuns = visible?.runtimeLogs;
  if (!Array.isArray(manifestRuns)) {
    reject("manifest", "visiblePlaytest.runtimeLogs must be an array");
  } else {
    expectExact("manifest", manifestRuns.length, runContracts.length, "runtime-log receipt count");
    for (const contract of runContracts) {
      const matches = manifestRuns.filter((run) => run?.reviewId === contract.reviewId);
      expectExact(`manifest ${contract.reviewId}`, matches.length, 1, "matching runtime-log receipts");
      validateManifestRunShape(matches[0], contract);
    }
  }

  await validatePackage(packageRoot, manifest);
  await validatePathSanitization(packageRoot, manifest);
  await validatePackageLog(manifest, packageLogPath);

  for (const contract of runContracts) {
    const run = manifestRuns?.find((candidate) => candidate?.reviewId === contract.reviewId);
    const externalLogPath = await resolveExternalLog(
      contract.reviewId,
      contract.logPath,
      contract.environmentName,
    );
    if (!externalLogPath) continue;
    const receipt = await readReceipt(contract.reviewId, externalLogPath);
    if (!receipt) continue;
    expectExact(contract.reviewId, receipt.bytes, run?.bytes, "bytes against manifest");
    expectExact(contract.reviewId, receipt.sha256, run?.sha256, "sha256 against manifest");
    validateLogContent(receipt, run, contract);
    await validateExternalSaveAbsence(receipt, contract);
  }
}

await main();

if (errors.length > 0) {
  console.error(`Daze council skin lookdev package validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "Daze council skin lookdev package validation passed for the privacy-v11 path-sanitized v5 package and fresh normal/reduced v6 runtime/capture evidence; engineering is admitted while watched visual art, close-camera, final and human review remain rejected.",
  );
}
