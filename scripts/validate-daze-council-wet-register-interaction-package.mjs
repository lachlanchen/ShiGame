#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);
const manifestPath = resolve(
  repositoryRoot,
  "docs/production/evidence/unreal-daze-council-wet-register-interaction-presentation-status.json",
);
const importEvidenceRelativePath =
  "docs/production/evidence/unreal-daze-council-wet-register-interaction-import-status.json";
const importEvidencePath = resolve(repositoryRoot, importEvidenceRelativePath);
const sanitizerRelativePath = "scripts/sanitize-unreal-linux-development-package.mjs";

const requiredEnvironment = [
  "SHI_UNREAL_PACKAGE_ROOT",
  "SHI_WET_REGISTER_UAT_LOG",
  "SHI_WET_REGISTER_NORMAL_LOG",
  "SHI_WET_REGISTER_REDUCED_LOG",
];
const assetId = "shi-daze-council-wet-register-interaction-v1";
const reviewFlag = "-ShiCouncilWetRegisterInteractionReview";
const isolatedRoot = "/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1";
const propPath =
  `${isolatedRoot}/SM_SHI_DazeCouncil_WetRegister_Blockout_01.SM_SHI_DazeCouncil_WetRegister_Blockout_01`;
const materialPath =
  `${isolatedRoot}/M_SHI_DazeCouncil_WetRegister_Clay_01.M_SHI_DazeCouncil_WetRegister_Clay_01`;
const animationPath =
  `${isolatedRoot}/A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01.A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01`;
const requiredDecision =
  "package-runtime-engineering-pass-visible-blockout-review-only-not-final-not-close-camera-not-human-reviewed";
const requiredDisclosure =
  "PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER · NOT FINAL HAND PERFORMANCE OR CLOSE-CAMERA AUTHORITY";
const immutableImportReceiptRootSha256 =
  "85c64e8515e6cc17a23528cbdec90823ee4ada2f4635eafbb7eb69c814913fb8";
const expectedImportEvidence = {
  bytes: 72005,
  sha256: "814e6c2767f6adc6c235dc7a16231adb83a703cd381627a4962aa16b432ed583",
};
const expectedPresentationEvidence = {
  bytes: 40822,
  sha256: "3910929d223ddac6bd20d5240bcec24cceed9d3572a535cfe89b07396999f8ef",
};
const expectedScreenshots = [
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-normal-held-v1.png",
    reviewId: "wet-register-normal",
    phase: "held",
    bytes: 885909,
    sha256: "b5bccda585ec9fa364baaee216062eaea3b0ecd9d08da90359722c3324763f91",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-normal-release-onset-v1.png",
    reviewId: "wet-register-normal",
    phase: "ordered-release",
    bytes: 880587,
    sha256: "909cef096a9d95f50ceb91924eac7b3215d45d986d890f6eb935720eebb29916",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-normal-later-physical-separation-v1.png",
    reviewId: "wet-register-normal",
    phase: "physical-exit",
    bytes: 882347,
    sha256: "9752f84b3ff4c4964275706d589fdca6a83ca2cc5e3ef1a6f21bc568b35cf759",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-normal-terminal-v1.png",
    reviewId: "wet-register-normal",
    phase: "terminal",
    bytes: 884420,
    sha256: "8e3325c191ac73211c844137081729ae775f0059d7bacd3548cf0b4ed596a363",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-reduced-held-v1.png",
    reviewId: "wet-register-reduced",
    phase: "held",
    bytes: 883994,
    sha256: "0840c28c3017970a87234e62b40d0ef767abcdb625bdc8952d9fab6812eb8dca",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-reduced-release-v1.png",
    reviewId: "wet-register-reduced",
    phase: "ordered-release",
    bytes: 883046,
    sha256: "29c4369233d7be2665dcad2d77e11d75349e481bfe29532e8ffaa7b29d676e07",
  },
  {
    file: "docs/production/evidence/unreal-daze-council-wet-register-reduced-terminal-v1.png",
    reviewId: "wet-register-reduced",
    phase: "terminal",
    bytes: 882657,
    sha256: "35e6cc39d079d4b2ba66b6285f0e8ecd1ebcefcb3e670ab2c00ad14fa40cc3d9",
  },
];
const expectedSanitizer = {
  bytes: 6989,
  sha256: "f0dc86ac46f8649bab64ff8137bf2c11dc8ebe5b047e6eda4ba32d6ea693c8f5",
};
const expectedTrackedUassets = {
  "A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01.uasset": {
    bytes: 168077,
    sha256: "264ae1b9a1ca0b2b0e05e3351248562e4d2d88c83a1c1d80590eeb60b0062b29",
  },
  "M_SHI_DazeCouncil_WetRegister_Clay_01.uasset": {
    bytes: 10704,
    sha256: "63c89e6a26fc81285a364bf41966964c5835330ba36c7733d307cdf01a731755",
  },
  "SM_SHI_DazeCouncil_WetRegister_Blockout_01.uasset": {
    bytes: 22679,
    sha256: "a4e4403b906eeb7df49bdcd1ba766f036d4926e6a05194affd7af75091a17df8",
  },
};
const trackedUassetRoot = resolve(
  repositoryRoot,
  "apps/unreal/Content/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1",
);
const expectedInventory = [
  { path: animationPath, class: "AnimSequence" },
  { path: materialPath, class: "Material" },
  { path: propPath, class: "StaticMesh" },
];
const expectedArtifactRoles = new Map([
  ["SHI.sh", "Linux packaged-player launcher"],
  ["SHI/Binaries/Linux/SHI", "Linux development executable"],
  ["SHI/Content/Paks/SHI-Linux.pak", "Pak metadata and non-IoStore payload"],
  ["SHI/Content/Paks/SHI-Linux.ucas", "IoStore data container"],
  ["SHI/Content/Paks/SHI-Linux.utoc", "IoStore table of contents"],
]);
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
const otherReviewFlags = [
  "-ShiCouncilCharacterReviewSpeaker",
  "-ShiCouncilCharacterReviewKeeper",
  "-ShiCouncilSkinLookdevReview",
  "-ShiCommandWeightReviewBack",
  "-ShiCommandWeightReviewFront",
  "-ShiCommandSurfaceReview",
  "-ShiWetFieldEnvironmentReview",
  "-ShiDazeFieldShelterReview",
  "-ShiRainVfxReview",
  "-ShiWetFieldVegetationReview",
];
const inertMarker =
  "SHI_COUNCIL_WET_REGISTER_INTERACTION_REVIEW_INERT story_input=false save_read=false save_write=false campaign_advance=false";
const admissionPrefix =
  `SHI_COUNCIL_WET_REGISTER_INTERACTION_RUNTIME_ADMITTED asset=${assetId} node=rain-order character=chen-sheng role=speaker prop=${propPath} material=${materialPath} clip=${animationPath} samples=121 fps=30.0000 duration=4.0000 dimensions_cm=32.0000,14.0000,2.0000 left_owner=hand_l relative_scale=0.0100 source_contact=conservative-mesh-sampled source_max_penetration_cm=0.3500 source_left_support_max_floating_cm=0.3387 source_right_hold_max_floating_cm=0.0000 runtime_contact=wrist-marker`;
const exitSequence = [
  "LogExit: Preparing to exit.",
  "LogExit: Game engine shut down",
  "LogExit: Object subsystem successfully closed.",
  "LogExit: Exiting.",
  "LogCore: FUnixPlatformMisc::RequestExit(bForce=false, ReturnCode=143)",
  "Log file closed,",
];
const forbiddenRuntimePatterns = [
  ["campaign load failure", /SHI campaign load failed:/iu],
  ["engagement load failure", /SHI engagement load failed:/iu],
  ["review-route rejection", /SHI wet-register interaction review rejected/iu],
  ["runtime fail-closed", /Council wet-register runtime failed closed/iu],
  ["neutral reference-pose fallback", /ShiWetRegisterInteractionFallback:NeutralReferencePose/iu],
  ["character contract rejection", /Council character contract rejected/iu],
  ["primitive character fallback", /Council character .*primitive fallback/iu],
  ["facial contract rejection", /Council facial contract rejected/iu],
  ["neutral-face fallback", /Council facial performance .*neutral-face fallback/iu],
  ["performance contract rejection", /Council performance contract rejected/iu],
  ["reference-pose performance fallback", /Council performance .*reference-pose fallback/iu],
  ["missing wet-register asset", /Failed to load[^\r\n]*DazeCouncilWetRegisterInteractionV1/iu],
  ["default-material fallback", /Default Material will be used in game/iu],
  ["story/save mutation", /(?:AUTOSAVED · [0-9]+ DECISIONS|UNSAVED PREVIEW ADVANCED|NATIVE COMMAND EXERCISE|NEW CHRONICLE · AUTOSAVED|RESUMED · TURN [0-9]+)/iu],
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
const forbiddenUatPatterns = [
  ["failed build", /BUILD FAILED/iu],
  ["nonzero AutomationTool exit", /AutomationTool exiting with ExitCode=(?!0\b)[^\r\n]*/iu],
  ["cook error", /LogCook: Error:/iu],
  ["cook warning", /LogCook: Warning:/iu],
  ["material error", /LogMaterial: Error:/iu],
  ["material warning", /LogMaterial: Warning:/iu],
  ["shader compile error", /LogShaderCompilers: Error:/iu],
  ["targeted asset warning or error", /(?:Warning|Error):[^\r\n]*DazeCouncilWetRegisterInteractionV1|DazeCouncilWetRegisterInteractionV1[^\r\n]*(?:Warning|Error):/iu],
  ["targeted fallback", /Council wet-register[^\r\n]*fallback/iu],
  ["default-material fallback", /Default Material will be used in game/iu],
  ["missing targeted package", /Unable to find package[^\r\n]*DazeCouncilWetRegisterInteractionV1/iu],
  ["failed targeted asset load", /Failed to load[^\r\n]*DazeCouncilWetRegisterInteractionV1/iu],
  ["Unreal error or fatal category", /Log[^:\r\n]+: (?:Error|Fatal):/iu],
  ["fatal error", /Fatal error:|LowLevelFatalError|Unhandled Exception|Assertion failed:|Ensure condition failed/iu],
];
const forbiddenTrueClaimKeys = new Set([
  "visibleHandMeshReviewApproved",
  "materialArtReviewApproved",
  "playerOwnershipContinuityApproved",
  "playerOwnershipContinuityReviewApproved",
  "humanHistoricalCulturalReviewApproved",
  "humanAnatomyReviewApproved",
  "humanCinematicReviewApproved",
  "humanAccessibilityLocalizationReviewApproved",
  "historicalPropAuthentication",
  "historicalObject",
  "closeCameraApproved",
  "closeFramingApproved",
  "mouthInteriorApproved",
  "voiceApproved",
  "lipSyncApproved",
  "finalProp",
  "finalHand",
  "finalHandAnimation",
  "finalCharacterArt",
  "finalFace",
  "finalActing",
  "finalVoice",
]);

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

function expectSameArray(scope, actual, expected, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length
      || actual.some((value, index) => value !== expected[index])) {
    reject(scope, `${label} must match the exact ordered contract`);
  }
}

function expectClose(scope, actual, expected, label, tolerance = 1e-9) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
    reject(scope, `${label} must be within ${tolerance} of ${expected} (found ${actual})`);
  }
}

function isInside(parent, child) {
  const pathFromParent = relative(parent, child);
  return pathFromParent === "" || (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function sha256File(filePath) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest("hex");
}

async function readBinaryReceipt(scope, filePath) {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      reject(scope, "supplied path is not a regular file");
      return null;
    }
    return {
      bytes: fileStats.size,
      sha256: await sha256File(filePath),
    };
  } catch (error) {
    reject(scope, `could not read supplied file (${error.code ?? "read failure"})`);
    return null;
  }
}

async function compareMetric(scope, metric, firstPath, secondPath) {
  try {
    const result = await execFileAsync(
      "compare",
      ["-metric", metric, firstPath, secondPath, "null:"],
      { encoding: "utf8", maxBuffer: 1024 * 1024 },
    );
    return result.stderr.trim();
  } catch (error) {
    const output = String(error.stderr ?? "").trim();
    if (error.code === 1 && output) return output;
    reject(scope, `ImageMagick ${metric} comparison failed (${output || error.code || error.name})`);
    return null;
  }
}

function parseCaptureReceipt(text) {
  const fields = {};
  for (const line of text.split(/\r?\n/u)) {
    const separator = line.indexOf("=");
    if (separator > 0) fields[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return fields;
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

function validateReceiptShape(scope, receipt) {
  if (!isPlainObject(receipt)) {
    reject(scope, "receipt must be an object");
    return false;
  }
  if (!Number.isSafeInteger(receipt.bytes) || receipt.bytes <= 0) {
    reject(scope, "receipt bytes must be a positive safe integer");
  }
  if (typeof receipt.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(receipt.sha256)) {
    reject(scope, "receipt sha256 must be a lowercase 64-digit digest");
  }
  return true;
}

function validateNoPositiveReleaseClaims(value, path = "manifest") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoPositiveReleaseClaims(entry, `${path}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenTrueClaimKeys.has(key) && child === true) {
      reject(path, `${key}=true is forbidden for this engineering-only gate`);
    }
    validateNoPositiveReleaseClaims(child, `${path}.${key}`);
  }
}

function requireExternalAbsolutePath(scope, environmentName) {
  const value = process.env[environmentName]?.trim();
  if (!value) {
    reject(scope, `${environmentName} is required`);
    return null;
  }
  if (!isAbsolute(value)) {
    reject(scope, `${environmentName} must be an absolute path`);
    return null;
  }
  const candidate = resolve(value);
  if (isInside(repositoryRoot, candidate)) {
    reject(scope, `${environmentName} must point outside the Git repository`);
    return null;
  }
  return candidate;
}

async function validateTrackedReceipt(scope, relativePath, expected) {
  const path = resolve(repositoryRoot, relativePath);
  const receipt = await readReceipt(scope, path);
  if (!receipt) return;
  expectExact(scope, receipt.bytes, expected.bytes, "bytes");
  expectExact(scope, receipt.sha256, expected.sha256, "sha256");
}

function validateExactTrackedUassetObject(scope, actual) {
  if (!isPlainObject(actual)) {
    reject(scope, "trackedUassets must be an object");
    return;
  }
  const names = Object.keys(actual).sort();
  const expectedNames = Object.keys(expectedTrackedUassets).sort();
  expectSameArray(scope, names, expectedNames, "exact three uasset names");
  for (const name of expectedNames) {
    const receiptScope = `${scope} ${name}`;
    validateReceiptShape(receiptScope, actual[name]);
    expectExact(receiptScope, actual[name]?.bytes, expectedTrackedUassets[name].bytes, "bytes");
    expectExact(receiptScope, actual[name]?.sha256, expectedTrackedUassets[name].sha256, "sha256");
  }
}

async function validateImportAdmission(manifest) {
  const scope = "import admission";
  const admission = manifest.importAdmission;
  if (!isPlainObject(admission)) {
    reject(scope, "manifest importAdmission is required");
    return;
  }
  expectExact(scope, admission.status, "pass", "status");
  expectExact(scope, admission.file, importEvidenceRelativePath, "file");
  expectExact(scope, admission.tracked, true, "tracked");
  expectExact(scope, admission.bytes, expectedImportEvidence.bytes, "bytes");
  expectExact(scope, admission.sha256, expectedImportEvidence.sha256, "sha256");
  expectExact(
    scope,
    admission.immutableImportReceiptRootSha256,
    immutableImportReceiptRootSha256,
    "immutableImportReceiptRootSha256",
  );
  expectExact(scope, admission.canonicalImportReceiptRootPreserved, true, "canonicalImportReceiptRootPreserved");
  expectExact(scope, admission.readOnlyInspectionPassed, true, "readOnlyInspectionPassed");
  expectExact(scope, admission.trackedUassetHashesUnchanged, true, "trackedUassetHashesUnchanged");
  expectExact(scope, admission.embeddedMetadataPrivacyPassed, true, "embeddedMetadataPrivacyPassed");
  expectExact(scope, admission.engineeringOnly, true, "engineeringOnly");
  expectExact(scope, admission.humanHistoricalCulturalReviewApproved, false, "humanHistoricalCulturalReviewApproved");
  expectExact(scope, admission.finalHandAnimation, false, "finalHandAnimation");
  expectExact(scope, admission.finalProp, false, "finalProp");

  const receipt = await readReceipt(scope, importEvidencePath);
  if (!receipt) return;
  expectExact(scope, receipt.bytes, expectedImportEvidence.bytes, "current tracked evidence bytes");
  expectExact(scope, receipt.sha256, expectedImportEvidence.sha256, "current tracked evidence sha256");

  let evidence;
  try {
    evidence = JSON.parse(receipt.text);
  } catch (error) {
    reject(scope, `tracked import evidence is not JSON (${error.name})`);
    return;
  }
  expectExact(scope, evidence.schemaVersion, 1, "import schemaVersion");
  expectExact(scope, evidence.assetId, assetId, "import assetId");
  expectExact(scope, evidence.mode, "import-replace", "import mode");
  expectExact(scope, evidence.mutationAuthorized, true, "import mutationAuthorized");
  expectExact(scope, evidence.saved, true, "import saved");
  expectExact(scope, evidence.passed, true, "import passed");
  expectExact(scope, evidence.destination, isolatedRoot, "import destination");
  expectExact(scope, evidence.destinationInventory?.passed, true, "destination inventory passed");
  const inventory = evidence.destinationInventory?.assets;
  if (!Array.isArray(inventory)) {
    reject(scope, "import destination inventory must be an array");
  } else {
    expectExact(scope, inventory.length, expectedInventory.length, "destination inventory count");
    expectedInventory.forEach((expected, index) => {
      expectExact(scope, inventory[index]?.path, expected.path, `inventory[${index}].path`);
      expectExact(scope, inventory[index]?.class, expected.class, `inventory[${index}].class`);
    });
  }
  expectExact(scope, evidence.readOnlyInspection?.mode, "inspect-only", "read-only inspection mode");
  expectExact(scope, evidence.readOnlyInspection?.mutationAuthorized, false, "read-only mutationAuthorized");
  expectExact(scope, evidence.readOnlyInspection?.distinctFromImportProcess, true, "distinct inspection process");
  expectExact(scope, evidence.readOnlyInspection?.passed, true, "read-only inspection passed");
  expectExact(
    scope,
    evidence.readOnlyInspection?.immutableImportReceiptRootSha256,
    immutableImportReceiptRootSha256,
    "immutable import receipt root",
  );
  expectExact(
    scope,
    evidence.readOnlyInspection?.canonicalImportReceiptRootPreserved,
    true,
    "canonical import receipt root preserved",
  );
  validateExactTrackedUassetObject(scope, evidence.trackedUnrealAssets?.receipts);
  expectExact(scope, evidence.authorityBoundary?.playerOwnershipContinuityReviewApproved, false,
    "import player ownership continuity approval");
  expectExact(scope, evidence.authorityBoundary?.humanHistoricalCulturalReviewApproved, false,
    "import human historical-cultural approval");
  expectExact(scope, evidence.authorityBoundary?.humanAnatomyReviewApproved, false,
    "import anatomy approval");
  expectExact(scope, evidence.authorityBoundary?.humanCinematicReviewApproved, false,
    "import cinematic approval");
  expectExact(scope, evidence.authorityBoundary?.closeCameraApproved, false, "import close-camera approval");
  expectExact(scope, evidence.authorityBoundary?.finalHandAnimation, false, "import final hand animation");

  for (const [name, expected] of Object.entries(expectedTrackedUassets)) {
    const fileScope = `${scope} tracked uasset ${name}`;
    const filePath = resolve(trackedUassetRoot, name);
    const fileReceipt = await readReceipt(fileScope, filePath);
    if (!fileReceipt) continue;
    expectExact(fileScope, fileReceipt.bytes, expected.bytes, "bytes");
    expectExact(fileScope, fileReceipt.sha256, expected.sha256, "sha256");
    const binaryText = (await readFile(filePath)).toString("latin1");
    for (const token of [
      "/home/",
      "/Users/",
      "C:/Users/",
      "C:\\Users\\",
      "SecurityToken=",
      "Factory_/",
      "InterchangeAssetImportData",
    ]) {
      if (binaryText.includes(token)) {
        reject(fileScope, `forbidden embedded metadata token ${JSON.stringify(token)}`);
      }
    }
  }
}

async function validatePackageSourceSnapshot(scope, text, manifest) {
  const projectPattern =
    /-project=(\/tmp\/shi-wet-register-package-source-v[1-9][0-9]*\/apps\/unreal\/SHI\.uproject)\b/gu;
  const matches = [...text.matchAll(projectPattern)].map((match) => match[1]);
  expectExact(scope, matches.length, 2, "anonymized package-source project arguments");
  if (matches.length !== 2) return;
  expectExact(scope, matches[0], matches[1], "repeated anonymized package-source project argument");
  const projectPath = matches[0];
  const snapshotUnrealRoot = dirname(projectPath);
  if (isInside(repositoryRoot, snapshotUnrealRoot)) {
    reject(scope, "anonymized package-source project unexpectedly resolves inside Git");
    return;
  }
  expectExact(scope, manifest.package?.sourceSnapshot?.root,
    "$SHI_UNREAL_ANONYMIZED_PACKAGE_SOURCE/apps/unreal", "sourceSnapshot.root");
  const snapshotAssetRoot = resolve(
    snapshotUnrealRoot,
    "Content/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1",
  );
  for (const [name, expected] of Object.entries(expectedTrackedUassets)) {
    const assetScope = `${scope} source snapshot ${name}`;
    const assetPath = resolve(snapshotAssetRoot, name);
    const receipt = await readReceipt(assetScope, assetPath);
    if (!receipt) continue;
    expectExact(assetScope, receipt.bytes, expected.bytes, "bytes");
    expectExact(assetScope, receipt.sha256, expected.sha256, "sha256");
    const binaryText = (await readFile(assetPath)).toString("latin1");
    for (const token of [
      "/home/",
      "/Users/",
      "C:/Users/",
      "C:\\Users\\",
      "SecurityToken=",
      "Factory_/",
      "InterchangeAssetImportData",
    ]) {
      if (binaryText.includes(token)) {
        reject(assetScope, `forbidden embedded metadata token ${JSON.stringify(token)}`);
      }
    }
  }
}

async function validateUatLogContent(receipt, manifestReceipt, manifest) {
  const scope = "UAT Log.txt";
  const { text } = receipt;
  const finalCookSummary =
    "LogCook: Display: Packages Cooked: 567, Packages Incrementally Skipped: 0, Packages Skipped by Platform: 7, Total Packages: 574";
  expectExact(scope, countLiteral(text, "BUILD SUCCESSFUL"), 1, "BUILD SUCCESSFUL markers");
  expectExact(scope, countLiteral(text, "AutomationTool exiting with ExitCode=0 (Success)"), 1,
    "AutomationTool zero-exit markers");
  expectExact(scope, countLiteral(text, finalCookSummary), 1, "exact 567-package cook summary");
  for (const [label, pattern] of forbiddenUatPatterns) {
    if (pattern.test(text)) reject(scope, `forbidden ${label} signature is present`);
  }
  const expectedScan = {
    buildSuccessfulMarkers: 1,
    automationExitCodeZeroMarkers: 1,
    finalCookSummaryMarkers: 1,
    cookedPackageCount: 567,
    incrementallySkippedPackageCount: 0,
    platformSkippedPackageCount: 7,
    totalCookCandidates: 574,
    cookErrorMarkers: 0,
    cookWarningMarkers: 0,
    targetedFallbackMarkers: 0,
    fatalErrors: 0,
    passed: true,
  };
  for (const [key, expected] of Object.entries(expectedScan)) {
    expectExact(scope, manifestReceipt?.scan?.[key], expected, `manifest scan.${key}`);
  }
  await validatePackageSourceSnapshot(scope, text, manifest);
}

async function validateUatLog(uatLogPath, manifest) {
  const scope = "UAT Log.txt";
  if (basename(uatLogPath) !== "Log.txt") reject(scope, "SHI_WET_REGISTER_UAT_LOG must identify UAT Log.txt");
  const declared = manifest.package?.buildLog;
  if (!isPlainObject(declared)) {
    reject(scope, "manifest package.buildLog receipt is required");
    return;
  }
  expectExact(scope, declared.file, "$SHI_UNREAL_PACKAGE_LOG_ROOT/Log.txt", "logical file");
  expectExact(scope, declared.tracked, false, "tracked");
  validateReceiptShape(scope, declared);
  const receipt = await readReceipt(scope, uatLogPath);
  if (!receipt) return;
  expectExact(scope, receipt.bytes, declared.bytes, "bytes against manifest");
  expectExact(scope, receipt.sha256, declared.sha256, "sha256 against manifest");
  await validateUatLogContent(receipt, declared, manifest);
}

async function validatePackageArtifacts(packageRoot, manifest) {
  const scope = "package";
  let packageRealRoot;
  try {
    const packageStats = await stat(packageRoot);
    if (!packageStats.isDirectory()) reject(scope, "SHI_UNREAL_PACKAGE_ROOT must be a directory");
    packageRealRoot = await realpath(packageRoot);
  } catch (error) {
    reject(scope, `SHI_UNREAL_PACKAGE_ROOT is unavailable (${error.code ?? "path failure"})`);
    return { linuxRoot: null, artifactReceipts: new Map() };
  }
  if (isInside(repositoryRoot, packageRealRoot)) reject(scope, "packaged build must remain outside Git");
  const linuxRoot = resolve(packageRealRoot, "Linux");
  try {
    const linuxStats = await stat(linuxRoot);
    if (!linuxStats.isDirectory()) reject(scope, "Linux package directory is missing");
  } catch (error) {
    reject(scope, `Linux package directory is unavailable (${error.code ?? "path failure"})`);
  }

  const packageManifest = manifest.package;
  expectExact(scope, packageManifest?.result, "BUILD SUCCESSFUL", "result");
  expectExact(scope, packageManifest?.exitCode, 0, "exitCode");
  expectExact(scope, packageManifest?.outsideGitRoot, "$SHI_UNREAL_PACKAGE_ROOT/Linux", "logical package root");
  expectExact(scope, packageManifest?.alwaysCookPath, isolatedRoot, "AlwaysCook path");
  expectExact(scope, packageManifest?.priorAcceptedPackageCount, 564, "priorAcceptedPackageCount");
  expectExact(scope, packageManifest?.addedPackageCount, 3, "addedPackageCount");
  expectExact(scope, packageManifest?.isolatedAssetCount, 3, "isolatedAssetCount");
  expectExact(scope, packageManifest?.cookedPackageCount, 567, "cookedPackageCount");
  expectExact(scope, packageManifest?.incrementallySkippedPackageCount, 0, "incrementallySkippedPackageCount");
  expectExact(scope, packageManifest?.platformSkippedPackageCount, 7, "platformSkippedPackageCount");
  expectExact(scope, packageManifest?.totalCookCandidates, 574, "totalCookCandidates");
  expectExact(scope, packageManifest?.cookErrors, 0, "cookErrors");
  expectExact(scope, packageManifest?.cookWarnings, 0, "cookWarnings");
  expectExact(scope, packageManifest?.engineeringAdmission, true, "engineeringAdmission");
  expectExact(scope, packageManifest?.humanApproval, false, "humanApproval");
  expectExact(scope, packageManifest?.finalReleaseApproval, false, "finalReleaseApproval");
  expectExact(scope, packageManifest?.sourceSnapshot?.matchesCurrentRepositoryReceipts, true,
    "source snapshot repository match");
  validateExactTrackedUassetObject(scope, packageManifest?.sourceSnapshot?.trackedUassets);

  const artifacts = packageManifest?.artifacts;
  const artifactReceipts = new Map();
  if (!Array.isArray(artifacts)) {
    reject(scope, "manifest package.artifacts must be an array");
    return { linuxRoot, artifactReceipts };
  }
  expectExact(scope, artifacts.length, expectedArtifactRoles.size, "artifact receipt count");
  let linuxRealRoot = null;
  try {
    linuxRealRoot = await realpath(linuxRoot);
  } catch {
    // The earlier Linux-root diagnostic is the useful failure.
  }
  for (const artifact of artifacts) {
    const relativePath = artifact?.relativePath;
    const artifactScope = `${scope} artifact ${relativePath ?? "<missing>"}`;
    if (!isPlainObject(artifact)) {
      reject(artifactScope, "receipt must be an object");
      continue;
    }
    if (typeof relativePath !== "string" || !expectedArtifactRoles.has(relativePath)) {
      reject(artifactScope, "relativePath is not one of the exact five package artifacts");
      continue;
    }
    if (artifactReceipts.has(relativePath)) {
      reject(artifactScope, "duplicate artifact receipt");
      continue;
    }
    expectExact(artifactScope, artifact.role, expectedArtifactRoles.get(relativePath), "role");
    validateReceiptShape(artifactScope, artifact);
    const candidate = resolve(linuxRoot, relativePath);
    if (!isInside(linuxRoot, candidate) || candidate === linuxRoot) {
      reject(artifactScope, "relativePath escapes the Linux package root");
      continue;
    }
    try {
      const candidateStats = await stat(candidate);
      const candidateRealPath = await realpath(candidate);
      if (!candidateStats.isFile()) reject(artifactScope, "artifact is not a regular file");
      if (linuxRealRoot && !isInside(linuxRealRoot, candidateRealPath)) {
        reject(artifactScope, "resolved artifact escapes the Linux package root");
      }
      expectExact(artifactScope, candidateStats.size, artifact.bytes, "bytes");
      expectExact(artifactScope, await sha256File(candidateRealPath), artifact.sha256, "sha256");
    } catch (error) {
      reject(artifactScope, `could not inspect artifact (${error.code ?? "inspection failure"})`);
    }
    artifactReceipts.set(relativePath, artifact);
  }
  for (const relativePath of expectedArtifactRoles.keys()) {
    if (!artifactReceipts.has(relativePath)) reject(scope, `missing artifact receipt ${relativePath}`);
  }
  return { linuxRoot, artifactReceipts };
}

function validateSanitizerReport(scope, report, expectedMode, artifactReceipts) {
  if (!isPlainObject(report)) {
    reject(scope, "sanitizer report must be a JSON object");
    return;
  }
  const isMutation = expectedMode === "authorized-rpath-sanitize";
  expectExact(scope, report.schemaVersion, 1, "schemaVersion");
  expectExact(scope, report.kind, "shi-unreal-linux-development-package-path-sanitization", "kind");
  expectExact(scope, report.mode, expectedMode, "mode");
  expectExact(scope, report.packageRoot, "$SHI_UNREAL_PACKAGE_ROOT/Linux", "packageRoot");
  expectExact(scope, report.mutationAuthorized, isMutation, "mutationAuthorized");
  expectExact(scope, report.mutationPerformed, isMutation, "mutationPerformed");
  expectExact(scope, report.tool?.name, "patchelf", "tool.name");
  expectExact(scope, report.tool?.version, "patchelf 0.18.0", "tool.version");
  expectExact(scope, report.tool?.ubuntuPackageSha256,
    "962a43e33cd56061522554898557a038ccbb8aa4e1e0f421b2d6f6adf1f80c60",
    "tool.ubuntuPackageSha256");
  expectExact(scope, report.executableMutation?.file, "SHI/Binaries/Linux/SHI", "executable file");
  expectExact(scope, report.executableMutation?.changed, isMutation, "executable changed");
  if (isMutation) {
    if (report.executableMutation?.before?.sha256 === report.executableMutation?.after?.sha256) {
      reject(scope, "authorized sanitizer receipt must prove an executable RPATH mutation");
    }
  } else {
    expectExact(scope, report.executableMutation?.before?.bytes, report.executableMutation?.after?.bytes,
      "inspect-only executable bytes stability");
    expectExact(scope, report.executableMutation?.before?.sha256, report.executableMutation?.after?.sha256,
      "inspect-only executable hash stability");
  }
  expectSameArray(scope, report.rpath?.exactSafeEntries, expectedSafeRpathEntries, "safe RPATH entries");
  expectExact(scope, report.rpath?.exactSafeRpathObserved, true, "exactSafeRpathObserved");
  expectExact(scope, report.rpath?.absoluteWorkstationPathCount, 0, "absoluteWorkstationPathCount");
  expectExact(scope, report.rpath?.originalHadPrivateWorkstationPath, isMutation,
    "originalHadPrivateWorkstationPath");
  expectExact(scope, report.rpath?.passed, true, "rpath passed");
  expectExact(scope, report.dependencyInspection?.unresolvedDependencyCount, 0,
    "unresolvedDependencyCount");
  expectExact(scope, report.dependencyInspection?.passed, true, "dependency inspection passed");
  expectExact(scope, report.authorityBoundary?.changesGameplayCode, false, "changesGameplayCode");
  expectExact(scope, report.authorityBoundary?.changesCookedContent, false, "changesCookedContent");
  expectExact(scope, report.authorityBoundary?.changesPakOrIoStore, false, "changesPakOrIoStore");
  expectExact(scope, report.authorityBoundary?.changesOnlyExecutableRpath, true, "changesOnlyExecutableRpath");
  expectExact(scope, report.authorityBoundary?.finalReleaseApproval, false, "finalReleaseApproval");
  expectExact(scope, report.passed, true, "passed");

  const expectedSanitizedArtifacts = [
    "SHI/Binaries/Linux/SHI",
    "SHI/Binaries/Linux/SHI.debug",
    "SHI/Binaries/Linux/SHI.sym",
  ];
  if (!Array.isArray(report.artifacts)) {
    reject(scope, "artifacts must be an array");
  } else {
    expectExact(scope, report.artifacts.length, expectedSanitizedArtifacts.length, "sanitized artifact count");
    for (const file of expectedSanitizedArtifacts) {
      const matches = report.artifacts.filter((artifact) => artifact?.file === file);
      expectExact(scope, matches.length, 1, `receipt count for ${file}`);
      const artifact = matches[0];
      validateReceiptShape(`${scope} ${file}`, artifact);
      expectExact(scope, artifact?.forbiddenWorkstationMarkerClassCount, 0,
        `${file} forbidden marker class count`);
      expectExact(scope, artifact?.passed, true, `${file} passed`);
      if (file === "SHI/Binaries/Linux/SHI") {
        const packageArtifact = artifactReceipts.get(file);
        expectExact(scope, artifact?.bytes, packageArtifact?.bytes, "sanitized executable bytes vs package receipt");
        expectExact(scope, artifact?.sha256, packageArtifact?.sha256, "sanitized executable hash vs package receipt");
      }
    }
  }
}

async function validatePathSanitization(manifest, reviewRoot, artifactReceipts) {
  const scope = "path sanitization";
  const declared = manifest.package?.pathSanitization;
  if (!isPlainObject(declared)) {
    reject(scope, "manifest package.pathSanitization is required");
    return;
  }
  expectExact(scope, declared.status, "pass-authorized-rpath-mutation-then-immutable-inspection", "status");
  expectExact(scope, declared.script?.file, sanitizerRelativePath, "script.file");
  expectExact(scope, declared.script?.tracked, true, "script.tracked");
  expectExact(scope, declared.script?.bytes, expectedSanitizer.bytes, "script.bytes");
  expectExact(scope, declared.script?.sha256, expectedSanitizer.sha256, "script.sha256");
  await validateTrackedReceipt(scope, sanitizerRelativePath, expectedSanitizer);
  expectSameArray(scope, declared.exactSafeRpathEntries, expectedSafeRpathEntries, "declared safe RPATH entries");
  expectExact(scope, declared.exactSafeRpathObserved, true, "exactSafeRpathObserved");
  expectExact(scope, declared.currentWorkstationPathMarkerCount, 0, "currentWorkstationPathMarkerCount");
  expectExact(scope, declared.securityTokenMarkerCount, 0, "securityTokenMarkerCount");
  expectExact(scope, declared.unresolvedDependencyCount, 0, "unresolvedDependencyCount");
  expectExact(scope, declared.changesGameplayCode, false, "changesGameplayCode");
  expectExact(scope, declared.changesCookedContent, false, "changesCookedContent");
  expectExact(scope, declared.changesPakOrIoStore, false, "changesPakOrIoStore");
  expectExact(scope, declared.changesOnlyExecutableRpath, true, "changesOnlyExecutableRpath");
  expectExact(scope, declared.finalReleaseApproval, false, "finalReleaseApproval");

  const reportContracts = [
    {
      key: "mutationReport",
      mode: "authorized-rpath-sanitize",
      pattern: /^SHI-DazeCouncilWetRegisterInteraction-PathSanitized-Rpath-Mutation-v([1-9][0-9]*)\.json$/u,
    },
    {
      key: "inspectReport",
      mode: "inspect-only",
      pattern: /^SHI-DazeCouncilWetRegisterInteraction-PathSanitized-Rpath-Inspect-v([1-9][0-9]*)\.json$/u,
    },
  ];
  const observedVersions = [];
  for (const contract of reportContracts) {
    const reportScope = `${scope} ${contract.key}`;
    const receipt = declared[contract.key];
    if (!validateReceiptShape(reportScope, receipt)) continue;
    expectExact(reportScope, receipt.tracked, false, "tracked");
    const logicalPrefix = "$SHI_UNREAL_REVIEW_ROOT/";
    if (typeof receipt.file !== "string" || !receipt.file.startsWith(logicalPrefix)) {
      reject(reportScope, `logical file must begin with ${logicalPrefix}`);
      continue;
    }
    const filename = receipt.file.slice(logicalPrefix.length);
    if (filename !== basename(filename)) {
      reject(reportScope, "logical sanitizer receipt must be a direct review-root child");
      continue;
    }
    const versionMatch = filename.match(contract.pattern);
    if (!versionMatch) {
      reject(reportScope, "sanitizer receipt filename does not match the exact Gate 5A convention");
      continue;
    }
    observedVersions.push(versionMatch[1]);
    const reportPath = resolve(reviewRoot, filename);
    const externalReceipt = await readReceipt(reportScope, reportPath);
    if (!externalReceipt) continue;
    expectExact(reportScope, externalReceipt.bytes, receipt.bytes, "external bytes");
    expectExact(reportScope, externalReceipt.sha256, receipt.sha256, "external sha256");
    let report;
    try {
      report = JSON.parse(externalReceipt.text);
    } catch (error) {
      reject(reportScope, `sanitizer receipt is not JSON (${error.name})`);
      continue;
    }
    validateSanitizerReport(reportScope, report, contract.mode, artifactReceipts);
  }
  if (observedVersions.length === 2) {
    expectExact(scope, observedVersions[0], observedVersions[1], "mutation/inspection receipt version");
  }
}

function matchSingleRuntimeMarker(scope, text, pattern, label) {
  const matches = [...text.matchAll(pattern)];
  expectExact(scope, matches.length, 1, `${label} markers`);
  return matches[0] ?? null;
}

function validateSemanticMarker(scope, match, expected, reducedMotion) {
  if (!match) return;
  const poseSample = Number(match.groups?.pose);
  const minimum = expected.semanticSample;
  const maximum = expected.maximumNormalSample;
  const reducedPoseSample = expected.reducedPoseSample ?? minimum;
  if (!Number.isSafeInteger(poseSample)) {
    reject(scope, `${expected.label} pose sample must be an integer`);
  } else if (reducedMotion && poseSample !== reducedPoseSample) {
    reject(scope, `${expected.label} reduced-motion pose sample must be ${reducedPoseSample} (found ${poseSample})`);
  } else if (!reducedMotion && (poseSample < minimum || poseSample > maximum)) {
    reject(scope, `${expected.label} normal-motion pose sample must be within ${minimum}..${maximum} (found ${poseSample})`);
  }
  if (match.groups?.motion !== expected.motion) {
    reject(scope, `${expected.label} motion field must be ${expected.motion}`);
  }
  if (match.groups?.leftDrift !== undefined) {
    const leftDrift = Number(match.groups.leftDrift);
    const rightFloat = Number(match.groups.rightFloat);
    if (!Number.isFinite(leftDrift) || leftDrift < 0 || leftDrift > 0.25) {
      reject(scope, `bilateral left drift must remain within 0..0.25 cm (found ${match.groups.leftDrift})`);
    }
    if (!Number.isFinite(rightFloat) || rightFloat < 0 || rightFloat > 0.8) {
      reject(scope, `bilateral right floating must remain within 0..0.8 cm (found ${match.groups.rightFloat})`);
    }
  }
}

function validateRuntimeLogContent(receipt, contract, manifestRun) {
  const scope = contract.reviewId;
  const { text } = receipt;
  const lines = text.split(/\r?\n/u);
  expectExact(scope, countLiteral(text, inertMarker), 1, "exact inert markers");
  const admission = `${admissionPrefix} motion=${contract.motion} visible_mesh_review=false anatomy_review=false final_hand=false final_prop=false historical_object=false player_ownership_continuity=false human_historical_cultural_review=false`;
  expectExact(scope, countLiteral(text, admission), 1, "exact runtime admission markers");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_WET_REGISTER_INTERACTION_RUNTIME_ADMITTED"), 1,
    "total wet-register admission markers");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_WET_REGISTER_INTERACTION_BILATERAL_CONTACT"), 1,
    "total bilateral-contact markers");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_WET_REGISTER_INTERACTION_HELD_QUESTION"), 1,
    "total held-question markers");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_WET_REGISTER_INTERACTION_ORDERED_RELEASE"), 1,
    "total ordered-release markers");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_WET_REGISTER_INTERACTION_TERMINAL_CLAMP"), 1,
    "total terminal-clamp markers");

  const motionPattern = contract.motion;
  const bilateral = matchSingleRuntimeMarker(
    scope,
    text,
    new RegExp(
      `SHI_COUNCIL_WET_REGISTER_INTERACTION_BILATERAL_CONTACT state=bilateral-contact semantic_sample=30 pose_sample=(?<pose>[0-9]+) left_drift_cm=(?<leftDrift>[0-9]+\\.[0-9]{4}) right_float_cm=(?<rightFloat>[0-9]+\\.[0-9]{4}) runtime_contact=wrist-marker visible_mesh_review=false motion=(?<motion>${motionPattern})`,
      "gu",
    ),
    "bilateral-contact",
  );
  const held = matchSingleRuntimeMarker(
    scope,
    text,
    new RegExp(
      `SHI_COUNCIL_WET_REGISTER_INTERACTION_HELD_QUESTION state=held-question semantic_sample=60 pose_sample=(?<pose>[0-9]+) left_owner=true right_contact=true player_ownership_continuity=false human_historical_cultural_review=false motion=(?<motion>${motionPattern})`,
      "gu",
    ),
    "held-question",
  );
  const release = matchSingleRuntimeMarker(
    scope,
    text,
    new RegExp(
      `SHI_COUNCIL_WET_REGISTER_INTERACTION_ORDERED_RELEASE state=ordered-release semantic_sample=90 pose_sample=(?<pose>[0-9]+) left_owner=true right_contact=false motion=(?<motion>${motionPattern})`,
      "gu",
    ),
    "ordered-release",
  );
  validateSemanticMarker(scope, bilateral, {
    label: "bilateral-contact", semanticSample: 30, maximumNormalSample: 59, motion: contract.motion,
  }, contract.reducedMotion);
  validateSemanticMarker(scope, held, {
    label: "held-question", semanticSample: 60, maximumNormalSample: 89, motion: contract.motion,
  }, contract.reducedMotion);
  validateSemanticMarker(scope, release, {
    label: "ordered-release", semanticSample: 90, maximumNormalSample: 91,
    reducedPoseSample: 91, motion: contract.motion,
  }, contract.reducedMotion);
  const terminal =
    `SHI_COUNCIL_WET_REGISTER_INTERACTION_TERMINAL_CLAMP state=settle sample=120 seconds=4.0000 left_owner=true loop=false motion=${contract.motion}`;
  expectExact(scope, countLiteral(text, terminal), 1, "exact terminal-clamp markers");

  const orderedMarkers = [admission, "SHI_COUNCIL_WET_REGISTER_INTERACTION_BILATERAL_CONTACT",
    "SHI_COUNCIL_WET_REGISTER_INTERACTION_HELD_QUESTION",
    "SHI_COUNCIL_WET_REGISTER_INTERACTION_ORDERED_RELEASE", terminal];
  let previousOffset = -1;
  for (const marker of orderedMarkers) {
    const offset = text.indexOf(marker);
    if (offset === -1) continue;
    if (offset <= previousOffset) reject(scope, `runtime marker is out of order: ${marker.split(" ")[0]}`);
    previousOffset = offset;
  }

  const commandLines = lines.filter((line) => line.includes("LogInit: Command Line:"));
  expectExact(scope, commandLines.length, 1, "LogInit command-line records");
  if (commandLines.length === 1) {
    const commandLine = commandLines[0];
    const expectedOverride =
      `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${contract.reducedMotion ? "True" : "False"}`;
    const oppositeOverride =
      `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${contract.reducedMotion ? "False" : "True"}`;
    expectExact(scope, countLiteral(commandLine, reviewFlag), 1, "wet-register review flag");
    expectExact(scope, countLiteral(commandLine, expectedOverride), 1, "expected reduced-motion override");
    expectExact(scope, countLiteral(commandLine, oppositeOverride), 0, "opposite reduced-motion override");
    for (const flag of otherReviewFlags) {
      expectExact(scope, countLiteral(commandLine, flag), 0, `mutually exclusive review flag ${flag}`);
    }
  }

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
  for (const [label, pattern] of forbiddenRuntimePatterns) {
    if (pattern.test(text)) reject(scope, `forbidden ${label} signature is present`);
  }

  const expectedScan = {
    inertMarkers: 1,
    runtimeAdmissionMarkers: 1,
    bilateralContactMarkers: 1,
    heldQuestionMarkers: 1,
    orderedReleaseMarkers: 1,
    terminalClampMarkers: 1,
    runtimeFailClosedMarkers: 0,
    neutralFallbackMarkers: 0,
    storyMutationMarkers: 0,
    defaultMaterialFallbackWarnings: 0,
    fatalErrors: 0,
    unhandledExceptions: 0,
    assertionFailures: 0,
    warningSeverityMarkers: 12,
    errorSeverityMarkers: 0,
    targetedErrors: 0,
    passed: true,
  };
  for (const [key, expected] of Object.entries(expectedScan)) {
    expectExact(scope, manifestRun?.scan?.[key], expected, `manifest scan.${key}`);
  }

  const warningCounts = {
    enhancedInputWithoutPlayerInputDuringInertRoute:
      (text.match(/LogEnhancedInput: Warning: UEnhancedInputLocalPlayerSubsystem[^\r\n]*does not have a valid PlayerInput object/gu) ?? []).length,
    preMeshAssignmentHandSocketLookups:
      (text.match(/LogSkinnedMeshComp: Warning: GetSocketInfoByName\(hand_l\): No SkeletalMesh/gu) ?? []).length,
    motionVectorThreadSafety:
      (text.match(/LogConsoleManager: Warning: Console variable 'r\.MotionVectorSimulation' used in the render thread/gu) ?? []).length,
    vulkanUnfreedAllocationShutdown:
      (text.match(/LogVulkanRHI: Warning: Found 1 unfreed allocations!/gu) ?? []).length,
  };
  const expectedWarningCounts = {
    enhancedInputWithoutPlayerInputDuringInertRoute: 1,
    preMeshAssignmentHandSocketLookups: 8,
    motionVectorThreadSafety: 1,
    vulkanUnfreedAllocationShutdown: 2,
  };
  for (const [key, expected] of Object.entries(expectedWarningCounts)) {
    expectExact(scope, warningCounts[key], expected, `observed warning class ${key}`);
    expectExact(scope, manifestRun?.documentedWarnings?.[key], expected, `documentedWarnings.${key}`);
  }
  const allWarnings = (text.match(/Log[^:\r\n]+: Warning:/gu) ?? []).length;
  const allErrors = (text.match(/Log[^:\r\n]+: Error:/gu) ?? []).length;
  const targetedErrors = (text.match(/(?:wet-register|WetRegister)[^\r\n]*(?:Error:|failed closed)|(?:Error:|failed closed)[^\r\n]*(?:wet-register|WetRegister)/gu) ?? []).length;
  expectExact(scope, allWarnings, 12, "total warning-severity markers");
  expectExact(scope, allErrors, 0, "total error-severity markers");
  expectExact(scope, targetedErrors, 0, "targeted error markers");
  expectExact(scope, manifestRun?.documentedWarnings?.total, 12, "documentedWarnings.total");
}

function validateManifestRunShape(run, contract) {
  const scope = `manifest ${contract.reviewId}`;
  if (!isPlainObject(run)) {
    reject(scope, "runtime-log receipt is missing");
    return;
  }
  expectExact(scope, run.reviewId, contract.reviewId, "reviewId");
  expectExact(scope, run.reviewFlag, reviewFlag, "reviewFlag");
  expectExact(scope, run.reducedMotion, contract.reducedMotion, "reducedMotion");
  expectExact(scope, run.motion, contract.motion, "motion");
  expectExact(scope, run.commandLineReducedMotionOverride,
    `ReducedMotion=${contract.reducedMotion ? "True" : "False"}`,
    "commandLineReducedMotionOverride");
  expectExact(scope, run.commandLineOverrideObserved, true, "commandLineOverrideObserved");
  expectExact(scope, run.visibleCharacterId, "chen-sheng", "visibleCharacterId");
  expectExact(scope, run.visibleRole, "speaker", "visibleRole");
  expectExact(scope, run.tracked, false, "tracked");
  expectExact(scope, run.file, `$SHI_UNREAL_REVIEW_ROOT/${basename(contract.logPath)}`, "logical file");
  validateReceiptShape(scope, run);
  const inert = run.inertEvidence;
  expectExact(scope, inert?.exactInertMarkerObserved, true, "inert exact marker");
  expectExact(scope, inert?.storyProgressionObserved, false, "story progression");
  expectExact(scope, inert?.campaignSaveMutationObserved, false, "campaign save mutation");
  expectExact(scope, inert?.campaignSaveLogicalPath,
    "$SHI_UNREAL_REVIEW_USER_DIR/Saved/SaveGames/shi-chapter-01-v6.json", "campaign save logical path");
  expectExact(scope, inert?.campaignSaveBefore?.exists, false, "campaign save before exists");
  expectExact(scope, inert?.campaignSaveAfter?.exists, false, "campaign save after exists");
  expectExact(scope, inert?.campaignSaveUnchanged, true, "campaign save unchanged");
  const userDirectoryPrefix = "$SHI_UNREAL_REVIEW_ROOT/";
  if (typeof inert?.userDirectory !== "string" || !inert.userDirectory.startsWith(userDirectoryPrefix)) {
    reject(scope, `inertEvidence.userDirectory must begin with ${userDirectoryPrefix}`);
  } else {
    const userDirectoryBasename = inert.userDirectory.slice(userDirectoryPrefix.length);
    if (!userDirectoryBasename || userDirectoryBasename !== basename(userDirectoryBasename)) {
      reject(scope, "inertEvidence.userDirectory must be a direct review-root child");
    }
  }
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

async function validateSaveAbsence(reviewRoot, manifestRun, contract) {
  const scope = `${contract.reviewId} save absence`;
  const logicalUserDirectory = manifestRun?.inertEvidence?.userDirectory;
  const prefix = "$SHI_UNREAL_REVIEW_ROOT/";
  if (typeof logicalUserDirectory !== "string" || !logicalUserDirectory.startsWith(prefix)) return;
  const name = logicalUserDirectory.slice(prefix.length);
  if (!name || name !== basename(name)) return;
  const userDirectory = resolve(reviewRoot, name);
  if (!isInside(reviewRoot, userDirectory) || userDirectory === reviewRoot) {
    reject(scope, "resolved user directory escapes the external review root");
    return;
  }
  const savePath = resolve(userDirectory, "Saved/SaveGames/shi-chapter-01-v6.json");
  try {
    await stat(savePath);
    reject(scope, "campaign save exists after inert review run");
  } catch (error) {
    if (error.code !== "ENOENT") reject(scope, `could not prove save absence (${error.code ?? "stat failure"})`);
  }
}

async function validateCaptureReceipt(scope, declared, logicalRoot, captureRoot, phase, kind) {
  if (!validateReceiptShape(scope, declared)) return null;
  expectExact(scope, declared.tracked, false, "tracked");
  const suffix = kind === "timingReceipt" ? ".capture.txt" : kind === "rawXwd" ? ".xwd" : ".png";
  expectExact(scope, declared.file, `${logicalRoot}/${phase}${suffix}`, "logical file");
  const actualPath = resolve(captureRoot, `${phase}${suffix}`);
  if (!isInside(captureRoot, actualPath) || actualPath === captureRoot) {
    reject(scope, "resolved capture path escapes its derived capture directory");
    return null;
  }
  const receipt = kind === "timingReceipt"
    ? await readReceipt(scope, actualPath)
    : await readBinaryReceipt(scope, actualPath);
  if (!receipt) return null;
  expectExact(scope, receipt.bytes, declared.bytes, "external bytes");
  expectExact(scope, receipt.sha256, declared.sha256, "external sha256");
  return { path: actualPath, receipt };
}

async function validateScreenshotsAndRawCaptures(manifest, normalLogPath, reducedLogPath) {
  const scope = "tracked screenshots and raw captures";
  const screenshots = manifest.screenshots;
  if (!Array.isArray(screenshots)) {
    reject(scope, "screenshots must be an array");
    return;
  }
  expectExact(scope, screenshots.length, expectedScreenshots.length, "exact screenshot count");
  expectSameArray(scope, screenshots.map((item) => item?.file),
    expectedScreenshots.map((item) => item.file), "ordered screenshot inventory");
  for (const expected of expectedScreenshots) {
    const screenshot = screenshots.find((item) => item?.file === expected.file);
    const screenshotScope = `${scope} ${expected.file}`;
    if (!screenshot) continue;
    expectExact(screenshotScope, screenshot.reviewId, expected.reviewId, "reviewId");
    expectExact(screenshotScope, screenshot.phase, expected.phase, "phase");
    expectSameArray(screenshotScope, screenshot.dimensions, [1600, 1000], "dimensions");
    expectExact(screenshotScope, screenshot.bitDepth, 8, "bitDepth");
    expectExact(screenshotScope, screenshot.channels, 3, "channels");
    expectExact(screenshotScope, screenshot.colorSpace, "sRGB", "colorSpace");
    expectExact(screenshotScope, screenshot.alpha, false, "alpha");
    expectExact(screenshotScope, screenshot.bytes, expected.bytes, "bytes");
    expectExact(screenshotScope, screenshot.sha256, expected.sha256, "sha256");
    expectExact(screenshotScope, screenshot.rawXwdToTrackedPngPixelDifferenceCount, 0,
      "rawXwdToTrackedPngPixelDifferenceCount");
    expectExact(screenshotScope, screenshot.visibleHandMeshReviewApproved, false,
      "visibleHandMeshReviewApproved");
    expectExact(screenshotScope, screenshot.visibleMeshContactClearanceApproved, false,
      "visibleMeshContactClearanceApproved");
    expectExact(screenshotScope, screenshot.finalHandAnimation, false, "finalHandAnimation");
    expectExact(screenshotScope, screenshot.finalProp, false, "finalProp");
    const receipt = await readBinaryReceipt(screenshotScope, resolve(repositoryRoot, expected.file));
    if (!receipt) continue;
    expectExact(screenshotScope, receipt.bytes, expected.bytes, "tracked bytes");
    expectExact(screenshotScope, receipt.sha256, expected.sha256, "tracked sha256");
  }

  const raw = manifest.visiblePlaytest?.rawCaptureEvidence;
  expectExact(scope, raw?.pathDerivation?.additionalEnvironmentVariablesRequired, false,
    "additional capture environment variables required");
  const modeContracts = [
    {
      mode: "normal",
      reviewId: "wet-register-normal",
      logPath: normalLogPath,
      logicalRoot: "$SHI_WET_REGISTER_NORMAL_CAPTURE_DIR",
      phases: ["held", "ordered-release", "physical-exit", "terminal", "terminal-stable"],
    },
    {
      mode: "reduced",
      reviewId: "wet-register-reduced",
      logPath: reducedLogPath,
      logicalRoot: "$SHI_WET_REGISTER_REDUCED_CAPTURE_DIR",
      phases: ["held", "ordered-release", "terminal", "terminal-stable"],
    },
  ];
  for (const contract of modeContracts) {
    const logNamePattern = new RegExp(
      `^SHI-DazeCouncilWetRegisterInteraction-PathSanitized-Review-${contract.mode}-v5\\.log$`, "u",
    );
    if (!logNamePattern.test(basename(contract.logPath))) {
      reject(scope, `${contract.mode} log basename must be the accepted v5 receipt`);
      continue;
    }
    const captureName = basename(contract.logPath)
      .replace(`-Review-${contract.mode}-v5.log`, `-Captures-${contract.mode}-v5`);
    const captureRoot = resolve(dirname(contract.logPath), captureName);
    try {
      const captureStats = await stat(captureRoot);
      if (!captureStats.isDirectory()) reject(scope, `${contract.mode} derived capture root is not a directory`);
    } catch (error) {
      reject(scope, `${contract.mode} derived capture root is unavailable (${error.code ?? "stat failure"})`);
      continue;
    }
    const modeEvidence = raw?.[contract.mode];
    expectExact(scope, modeEvidence?.captureDirectory, contract.logicalRoot,
      `${contract.mode} logical capture directory`);
    expectSameArray(scope, Object.keys(modeEvidence?.phases ?? {}), contract.phases,
      `${contract.mode} phase inventory`);
    const resolvedPhasePaths = {};
    for (const phase of contract.phases) {
      const phaseScope = `${scope} ${contract.mode}/${phase}`;
      const phaseEvidence = modeEvidence?.phases?.[phase];
      if (!isPlainObject(phaseEvidence)) {
        reject(phaseScope, "phase evidence is required");
        continue;
      }
      expectExact(phaseScope, phaseEvidence.phase, phase, "phase");
      expectExact(phaseScope, phaseEvidence.rawXwdToRenderedPngPixelDifferenceCount, 0,
        "raw XWD to external PNG AE");
      const timing = await validateCaptureReceipt(
        `${phaseScope} timing`, phaseEvidence.timingReceipt, contract.logicalRoot, captureRoot, phase, "timingReceipt",
      );
      const xwd = await validateCaptureReceipt(
        `${phaseScope} XWD`, phaseEvidence.rawXwd, contract.logicalRoot, captureRoot, phase, "rawXwd",
      );
      const png = await validateCaptureReceipt(
        `${phaseScope} PNG`, phaseEvidence.renderedPng, contract.logicalRoot, captureRoot, phase, "renderedPng",
      );
      resolvedPhasePaths[phase] = { xwd: xwd?.path, png: png?.path };
      if (timing) {
        const fields = parseCaptureReceipt(timing.receipt.text);
        expectExact(phaseScope, fields.phase, phase, "timing phase");
        expectExact(phaseScope, fields.start, phaseEvidence.captureStartAtUtc, "timing start");
        expectExact(phaseScope, fields.end, phaseEvidence.captureCompleteAtUtc, "timing end");
        if (phase === "terminal-stable") {
          expectExact(phaseScope, fields.marker, undefined, "terminal-stable marker absence");
          expectExact(phaseScope, fields.log_line, undefined, "terminal-stable log line absence");
        } else {
          expectExact(phaseScope, fields.marker, phaseEvidence.marker, "timing marker");
          if (typeof fields.log_line !== "string" || !fields.log_line.includes(phaseEvidence.marker)) {
            reject(phaseScope, "timing log line must contain the declared marker");
          }
          if (!fields.log_line?.includes(`pose_sample=${phaseEvidence.poseSample}`)
              && phase !== "terminal") {
            reject(phaseScope, "timing log line must contain the declared pose sample");
          }
        }
      }
      if (xwd?.path && png?.path) {
        expectExact(phaseScope, await compareMetric(phaseScope, "AE", xwd.path, png.path), "0",
          "raw XWD to external PNG absolute-error pixel count");
      }
      const matchingScreenshot = expectedScreenshots.find(
        (item) => item.reviewId === contract.reviewId && item.phase === phase,
      );
      if (matchingScreenshot) {
        expectExact(phaseScope, phaseEvidence.trackedScreenshot, matchingScreenshot.file,
          "trackedScreenshot");
        expectExact(phaseScope, phaseEvidence.rawXwdToTrackedPngPixelDifferenceCount, 0,
          "raw XWD to tracked PNG AE");
        expectExact(phaseScope, phaseEvidence.renderedPng?.bytes, matchingScreenshot.bytes,
          "external/tracked PNG bytes");
        expectExact(phaseScope, phaseEvidence.renderedPng?.sha256, matchingScreenshot.sha256,
          "external/tracked PNG sha256");
        if (xwd?.path) {
          expectExact(phaseScope, await compareMetric(
            phaseScope, "AE", xwd.path, resolve(repositoryRoot, matchingScreenshot.file),
          ), "0", "raw XWD to tracked PNG absolute-error pixel count");
        }
      } else {
        expectExact(phaseScope, phaseEvidence.trackedScreenshot, null, "external-only trackedScreenshot");
      }
    }

    const terminal = modeEvidence?.phases?.terminal;
    const stable = modeEvidence?.phases?.["terminal-stable"];
    const stability = modeEvidence?.terminalStability;
    const elapsedMilliseconds = Date.parse(stable?.captureStartAtUtc) - Date.parse(terminal?.captureStartAtUtc);
    if (!(elapsedMilliseconds > 1000)) {
      reject(scope, `${contract.mode} terminal-stable capture must start more than one second after terminal capture`);
    }
    expectExact(scope, stability?.exactPixelEquality, false, `${contract.mode} exactPixelEquality`);
    expectExact(scope, stability?.environmentalRainAndEffectsContinue, true,
      `${contract.mode} environmentalRainAndEffectsContinue`);
    expectExact(scope, stability?.watchedNoGrossCharacterOrPropRestart, true,
      `${contract.mode} watchedNoGrossCharacterOrPropRestart`);
    const terminalPath = resolvedPhasePaths.terminal?.png;
    const stablePath = resolvedPhasePaths["terminal-stable"]?.png;
    if (terminalPath && stablePath) {
      const aeText = await compareMetric(scope, "AE", terminalPath, stablePath);
      const rmseText = await compareMetric(scope, "RMSE", terminalPath, stablePath);
      const psnrText = await compareMetric(scope, "PSNR", terminalPath, stablePath);
      const nccText = await compareMetric(scope, "NCC", terminalPath, stablePath);
      const ae = Number.parseInt(aeText ?? "", 10);
      const normalizedRmse = Number.parseFloat(rmseText?.match(/\(([^)]+)\)/u)?.[1] ?? "");
      const psnr = Number.parseFloat(psnrText ?? "");
      const ncc = Number.parseFloat(nccText ?? "");
      expectExact(scope, ae, stability?.terminalToStableFullFrameDifferentPixelCount,
        `${contract.mode} terminal/stable changed pixels`);
      if (!(ae > 0 && ae < 1600 * 1000)) {
        reject(scope, `${contract.mode} terminal/stable AE must prove nonzero bounded live-FX change`);
      }
      expectClose(scope, normalizedRmse, stability?.terminalToStableNormalizedRmse,
        `${contract.mode} terminal/stable normalized RMSE`, 1e-8);
      expectClose(scope, psnr, stability?.terminalToStablePsnr,
        `${contract.mode} terminal/stable PSNR`, 1e-4);
      expectClose(scope, ncc, stability?.terminalToStableNcc,
        `${contract.mode} terminal/stable NCC`, 1e-6);
      if (!(ncc > 0.99)) reject(scope, `${contract.mode} terminal/stable NCC must exceed 0.99`);
    }
  }

  const normalRelease = raw?.normal?.phases?.["ordered-release"];
  expectExact(scope, normalRelease?.semanticSample, 90, "normal release semantic sample");
  expectExact(scope, normalRelease?.poseSample, 90, "normal release pose sample");
  expectExact(scope, normalRelease?.semanticReleaseOnset, true, "normal semantic release onset");
  expectExact(scope, normalRelease?.physicalContactExitSampleProof, false,
    "normal onset physical exit proof");
  const later = raw?.normal?.phases?.["physical-exit"];
  expectExact(scope, later?.captureStartSecondsAfterReleaseMarkerTimestamp, 0.545644844,
    "normal later separation marker offset");
  expectExact(scope, later?.laterVisibleSeparationObserved, true, "normal later visible separation");
  expectExact(scope, later?.exactSample91Proof, false, "normal exact sample-91 proof");
  if (!later?.qualification?.includes("not the exact sample-91")) {
    reject(scope, "normal later separation qualification must deny exact sample-91 proof");
  }
  const reducedRelease = raw?.reduced?.phases?.["ordered-release"];
  expectExact(scope, reducedRelease?.semanticSample, 90, "reduced release semantic sample");
  expectExact(scope, reducedRelease?.poseSample, 91, "reduced release pose sample");
  expectExact(scope, reducedRelease?.wristMarkerEngineeringExit, true, "reduced wrist-marker exit");
  expectExact(scope, reducedRelease?.visibleMeshReviewApproved, false, "reduced visible mesh approval");
  expectExact(scope, reducedRelease?.visibleMeshClearanceProof, false, "reduced visible clearance proof");
  expectExact(scope, reducedRelease?.visibleSeparationLegibleAtFullFrame, false,
    "reduced full-frame separation legibility");
  expectExact(scope, reducedRelease?.fingersAppearOverlappingAtFullFrame, true,
    "reduced apparent finger overlap");
}

function validateAuthorityBoundary(manifest) {
  const scope = "authority boundary";
  const boundary = manifest.authorityBoundary;
  if (!isPlainObject(boundary)) {
    reject(scope, "manifest authorityBoundary is required");
    return;
  }
  const expected = {
    developmentReviewOnly: true,
    engineeringAdmission: true,
    terminalPoseEngineeringApproved: true,
    visibleHandMeshReviewApproved: false,
    visibleMeshContactClearanceApproved: false,
    materialArtReviewApproved: false,
    playerOwnershipContinuityReviewApproved: false,
    humanHistoricalCulturalReviewApproved: false,
    humanAnatomyReviewApproved: false,
    humanCinematicReviewApproved: false,
    cinematicContinuityApproved: false,
    humanAccessibilityLocalizationReviewApproved: false,
    historicalPropAuthentication: false,
    closeCameraApproved: false,
    mouthInteriorApproved: false,
    voiceApproved: false,
    lipSyncApproved: false,
    finalProp: false,
    finalHandAnimation: false,
    finalCharacterArt: false,
    campaignAuthority: false,
    choiceAuthority: false,
    inputAuthority: false,
    saveAuthority: false,
  };
  for (const [key, value] of Object.entries(expected)) {
    expectExact(scope, boundary[key], value, key);
  }
  const releaseGates = manifest.releaseGates;
  const expectedReleaseGates = {
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
  if (!isPlainObject(releaseGates)) {
    reject(scope, "manifest releaseGates is required");
  } else {
    for (const [key, value] of Object.entries(expectedReleaseGates)) {
      expectExact(scope, releaseGates[key], value, `releaseGates.${key}`);
    }
  }
}

async function main() {
  const resolvedEnvironment = {};
  for (const name of requiredEnvironment) {
    resolvedEnvironment[name] = requireExternalAbsolutePath("environment", name);
  }
  if (errors.length > 0) return;
  const packageRoot = resolvedEnvironment.SHI_UNREAL_PACKAGE_ROOT;
  const uatLogPath = resolvedEnvironment.SHI_WET_REGISTER_UAT_LOG;
  const normalLogPath = resolvedEnvironment.SHI_WET_REGISTER_NORMAL_LOG;
  const reducedLogPath = resolvedEnvironment.SHI_WET_REGISTER_REDUCED_LOG;
  if (new Set([uatLogPath, normalLogPath, reducedLogPath]).size !== 3) {
    reject("environment", "UAT, normal and reduced-motion logs must be three distinct files");
  }
  if (dirname(normalLogPath) !== dirname(reducedLogPath)) {
    reject("environment", "normal and reduced-motion logs must share one external review receipt directory");
  }
  if (errors.length > 0) return;
  const reviewRoot = dirname(normalLogPath);

  let manifest;
  try {
    const manifestPayload = await readFile(manifestPath);
    expectExact("manifest", manifestPayload.byteLength, expectedPresentationEvidence.bytes,
      "tracked presentation bytes");
    expectExact("manifest", createHash("sha256").update(manifestPayload).digest("hex"),
      expectedPresentationEvidence.sha256, "tracked presentation sha256");
    const manifestText = manifestPayload.toString("utf8");
    for (const token of ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "SecurityToken="]) {
      if (manifestText.includes(token)) {
        reject("manifest", `tracked presentation evidence contains forbidden private token ${JSON.stringify(token)}`);
      }
    }
    manifest = JSON.parse(manifestText);
  } catch (error) {
    reject("manifest", `could not load presentation evidence (${error.code ?? error.name})`);
    return;
  }
  expectExact("manifest", manifest.schemaVersion, 1, "schemaVersion");
  expectExact("manifest", manifest.assetId, assetId, "assetId");
  expectExact("manifest", manifest.decision, requiredDecision, "decision");
  expectExact("manifest", manifest.requiredDisclosure, requiredDisclosure, "requiredDisclosure");
  validateNoPositiveReleaseClaims(manifest);
  validateAuthorityBoundary(manifest);
  await validateScreenshotsAndRawCaptures(manifest, normalLogPath, reducedLogPath);
  await validateImportAdmission(manifest);
  await validateUatLog(uatLogPath, manifest);
  const { artifactReceipts } = await validatePackageArtifacts(packageRoot, manifest);
  await validatePathSanitization(manifest, reviewRoot, artifactReceipts);

  const visible = manifest.visiblePlaytest;
  expectExact("visible playtest", visible?.package, "$SHI_UNREAL_PACKAGE_ROOT/Linux", "package");
  expectExact("visible playtest", visible?.developmentReviewOnly, true, "developmentReviewOnly");
  expectExact("visible playtest", visible?.stackCount, 1, "stackCount");
  expectExact("visible playtest", visible?.stackReusedAcrossRuns, true, "stackReusedAcrossRuns");
  expectExact("visible playtest", visible?.normalReviewed, true, "normalReviewed");
  expectExact("visible playtest", visible?.reducedMotionReviewed, true, "reducedMotionReviewed");
  expectExact("visible playtest", visible?.visibleHandMeshReviewApproved, false, "visibleHandMeshReviewApproved");
  expectExact("visible playtest", visible?.playerOwnershipContinuityReviewApproved, false,
    "playerOwnershipContinuityReviewApproved");
  expectExact("visible playtest", visible?.humanHistoricalCulturalReviewApproved, false,
    "humanHistoricalCulturalReviewApproved");
  expectExact("visible playtest", visible?.finalCharacterArtApproved, false, "finalCharacterArtApproved");

  const runContracts = [
    {
      reviewId: "wet-register-normal",
      environmentName: "SHI_WET_REGISTER_NORMAL_LOG",
      logPath: normalLogPath,
      reducedMotion: false,
      motion: "normal",
    },
    {
      reviewId: "wet-register-reduced",
      environmentName: "SHI_WET_REGISTER_REDUCED_LOG",
      logPath: reducedLogPath,
      reducedMotion: true,
      motion: "reduced",
    },
  ];
  const manifestRuns = visible?.runtimeLogs;
  if (!Array.isArray(manifestRuns)) {
    reject("visible playtest", "runtimeLogs must be an array");
  } else {
    expectExact("visible playtest", manifestRuns.length, runContracts.length, "runtime-log receipt count");
  }
  for (const contract of runContracts) {
    const matches = Array.isArray(manifestRuns)
      ? manifestRuns.filter((run) => run?.reviewId === contract.reviewId)
      : [];
    expectExact(`manifest ${contract.reviewId}`, matches.length, 1, "matching runtime-log receipts");
    const manifestRun = matches[0];
    validateManifestRunShape(manifestRun, contract);
    await validateSaveAbsence(reviewRoot, manifestRun, contract);
    const receipt = await readReceipt(contract.reviewId, contract.logPath);
    if (!receipt) continue;
    expectExact(contract.reviewId, receipt.bytes, manifestRun?.bytes, "bytes against manifest");
    expectExact(contract.reviewId, receipt.sha256, manifestRun?.sha256, "sha256 against manifest");
    validateRuntimeLogContent(receipt, contract, manifestRun);
  }
}

await main();

if (errors.length > 0) {
  console.error(`Daze council wet-register package validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "Daze council wet-register package validation passed: 567 cooked packages, exact three Gate 5A assets, path-sanitized Development artifacts, two inert packaged-player timelines, twelve interaction markers, absent campaign saves, and two controlled Unreal shutdowns; human, continuity, close-camera and final-art gates remain red.",
  );
}
