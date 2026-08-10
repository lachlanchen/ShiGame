#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(
  repositoryRoot,
  "docs/production/evidence/unreal-daze-council-facial-performance-presentation-status.json",
);
const requiredEnvironment = [
  "SHI_UNREAL_PACKAGE_ROOT",
  "SHI_FACIAL_SPEAKER_LOG",
  "SHI_FACIAL_REDUCED_LOG",
  "SHI_FACIAL_KEEPER_LOG",
];
const expectedArtifactPaths = [
  "SHI.sh",
  "SHI/Binaries/Linux/SHI",
  "SHI/Content/Paks/SHI-Linux.pak",
  "SHI/Content/Paks/SHI-Linux.ucas",
  "SHI/Content/Paks/SHI-Linux.utoc",
];
const speakerAdmission =
  "SHI_COUNCIL_FACIAL_RUNTIME_ADMITTED character=chen-sheng role=speaker mesh=/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.SKM_SHI_DazeCouncil_ChenSheng_Facial_01 morph_controls=21";
const keeperAdmission =
  "SHI_COUNCIL_FACIAL_RUNTIME_ADMITTED character=keeper role=listener mesh=/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_Keeper_Facial_01.SKM_SHI_DazeCouncil_Keeper_Facial_01 morph_controls=21";
const speakerExercise =
  "SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED character=chen-sheng role=speaker state=object-glance skin=SkinClay eye=EyeBrown alpha=";
const keeperExercise =
  "SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED character=keeper role=listener state=object-glance skin=SkinClay eye=EyeBrown alpha=";
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
  ["facial contract rejection", /Council facial contract rejected/iu],
  ["neutral-face fallback", /Council facial performance .*accepted neutral-face fallback/iu],
  ["facial cadence fail-closed", /Council facial cadence failed closed/iu],
  ["character contract rejection", /Council character contract rejected/iu],
  ["primitive character fallback", /Council character .*fail-closed primitive fallback/iu],
  ["performance contract rejection", /Council performance contract rejected/iu],
  ["reference-pose performance fallback", /Council performance .*fail-closed reference-pose fallback/iu],
  ["reference-pose participant fallback", /Council character .*uses the reference-pose fallback/iu],
  ["council figure initialization failure", /Council figure .*could not initialize/iu],
  ["council review rejection", /Council character review rejected/iu],
  ["runtime material-usage repair", /Had to pass SMU back to game thread.*DazeCouncilFacial/iu],
  ["facial material missing usage", /Material \/Game\/SHI\/Art\/Characters\/DazeCouncilFacial\/.*missing usage flag/iu],
  ["default-material fallback", /Default Material will be used in game/iu],
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
  if (actual !== expected) reject(scope, `${label} must be ${JSON.stringify(expected)} (found ${JSON.stringify(actual)})`);
}

function isInside(parent, child) {
  const pathFromParent = relative(parent, child);
  return pathFromParent === "" || (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent));
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

function validateReceiptShape(scope, receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
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

function validateManifestRunShape(run, expected) {
  const scope = `manifest ${expected.reviewId}`;
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    reject(scope, "runtime-log receipt is missing");
    return;
  }
  expectExact(scope, run.reviewId, expected.reviewId, "reviewId");
  expectExact(scope, run.reviewFlag, expected.reviewFlag, "reviewFlag");
  expectExact(scope, run.reducedMotion, expected.reducedMotion, "reducedMotion");
  expectExact(scope, run.visibleCharacterId, expected.visibleCharacterId, "visibleCharacterId");
  expectExact(scope, run.visibleRole, expected.visibleRole, "visibleRole");
  expectExact(scope, run.tracked, false, "tracked");
  expectExact(
    scope,
    run.commandLineReducedMotionOverride,
    expected.commandLineReducedMotionOverride,
    "commandLineReducedMotionOverride",
  );
  expectExact(scope, run.commandLineOverrideObserved, true, "commandLineOverrideObserved");
  validateReceiptShape(scope, run);
  const expectedLogicalFile = `$SHI_UNREAL_REVIEW_ROOT/${basename(expected.logPath)}`;
  expectExact(scope, run.file, expectedLogicalFile, "logical log path");

  const expectedScan = {
    runtimeAdmissionMarkers: 2,
    morphSectionExerciseMarkers: 1,
    visibleRoleExerciseMarker: true,
    neutralFallbackWarnings: 0,
    cadenceFailClosedErrors: 0,
    morphUsageRepairWarnings: 0,
    defaultMaterialFallbackWarnings: 0,
    fatalErrors: 0,
    unhandledExceptions: 0,
    assertionFailures: 0,
    visibleRoleExerciseAlpha: expected.exerciseAlpha,
    passed: true,
  };
  for (const [key, value] of Object.entries(expectedScan)) {
    expectExact(scope, run.scan?.[key], value, `scan.${key}`);
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

function validateLogContent(receipt, expected) {
  const scope = expected.reviewId;
  const { text } = receipt;
  const lines = text.split(/\r?\n/u);

  expectExact(scope, countLiteral(text, "SHI_COUNCIL_FACIAL_RUNTIME_ADMITTED"), 2, "total admission markers");
  expectExact(scope, countLiteral(text, speakerAdmission), 1, "Chen Sheng speaker admission");
  expectExact(scope, countLiteral(text, keeperAdmission), 1, "Keeper listener admission");
  expectExact(scope, countLiteral(text, "SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED"), 1, "total morph-section exercise markers");
  expectExact(scope, countLiteral(text, expected.exercisePrefix), 1, "visible-role morph-section exercise");
  expectExact(scope, countLiteral(text, expected.otherExercisePrefix), 0, "hidden-role morph-section exercise");

  const exerciseLine = lines.find((line) => line.includes(expected.exercisePrefix));
  const alphaMatch = exerciseLine?.match(/alpha=([0-9]+\.[0-9]{4})(?:\s*)$/u);
  if (!alphaMatch) {
    reject(scope, "visible-role exercise marker must end with a four-decimal alpha");
  } else {
    const alpha = Number(alphaMatch[1]);
    if (!Number.isFinite(alpha) || alpha <= 0 || alpha > 1) {
      reject(scope, `exercise alpha must be within (0, 1] (found ${alphaMatch[1]})`);
    }
    expectExact(scope, alphaMatch[1], expected.exerciseAlphaText, "visible-role exercise alpha");
  }

  const commandLines = lines.filter((line) => line.includes("LogInit: Command Line:"));
  expectExact(scope, commandLines.length, 1, "LogInit command-line records");
  if (commandLines.length === 1) {
    const commandLine = commandLines[0];
    const expectedOverride = `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${expected.reducedMotion ? "True" : "False"}`;
    const oppositeOverride = `-ini:GameUserSettings:[/Script/SHI.ShiCinematic]:ReducedMotion=${expected.reducedMotion ? "False" : "True"}`;
    expectExact(scope, countLiteral(commandLine, expectedOverride), 1, "expected reduced-motion configuration override");
    expectExact(scope, countLiteral(commandLine, oppositeOverride), 0, "opposite reduced-motion configuration override");
    expectExact(scope, countLiteral(commandLine, expected.reviewFlag), 1, "expected character-review flag");
    expectExact(scope, countLiteral(commandLine, expected.otherReviewFlag), 0, "opposite character-review flag");
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

  for (const [label, pattern] of forbiddenLogPatterns) {
    if (pattern.test(text)) reject(scope, `forbidden ${label} signature is present`);
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
  if (isInside(repositoryRoot, packageRealRoot)) {
    reject(scope, "packaged builds must remain outside the Git repository");
  }

  const linuxRoot = resolve(packageRealRoot, "Linux");
  const logicalRoot = "$SHI_UNREAL_PACKAGE_ROOT/Linux";
  expectExact(scope, manifest.package?.outsideGitRoot, logicalRoot, "manifest package root");
  expectExact(scope, manifest.visiblePlaytest?.package, logicalRoot, "manifest visible-playtest package root");
  expectExact(scope, manifest.package?.result, "BUILD SUCCESSFUL", "build result");
  expectExact(scope, manifest.package?.exitCode, 0, "build exitCode");
  expectExact(scope, manifest.package?.addedPackageCount, 21, "addedPackageCount");
  expectExact(scope, manifest.package?.cookedPackageCount, 559, "cookedPackageCount");
  expectExact(scope, manifest.package?.cookErrors, 0, "cookErrors");
  expectExact(scope, manifest.package?.cookWarnings, 0, "cookWarnings");

  const artifacts = manifest.package?.artifacts;
  if (!Array.isArray(artifacts)) {
    reject(scope, "manifest package.artifacts must be an array");
    return;
  }
  expectExact(scope, artifacts.length, expectedArtifactPaths.length, "artifact receipt count");
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

  for (const relativePath of expectedArtifactPaths) {
    const entry = artifactByPath.get(relativePath);
    if (!entry) {
      reject(scope, `missing artifact receipt ${relativePath}`);
      continue;
    }
    const artifactScope = `package artifact ${relativePath}`;
    try {
      const artifactStats = await stat(entry.candidate);
      if (!artifactStats.isFile()) {
        reject(artifactScope, "package artifact is not a regular file");
        continue;
      }
      const artifactRealPath = await realpath(entry.candidate);
      if (!isInside(await realpath(linuxRoot), artifactRealPath)) {
        reject(artifactScope, "resolved artifact escapes the Linux package root");
        continue;
      }
      expectExact(artifactScope, artifactStats.size, entry.artifact.bytes, "bytes");
      const digest = await sha256File(artifactRealPath);
      expectExact(artifactScope, digest, entry.artifact.sha256, "sha256");
    } catch (error) {
      reject(artifactScope, `could not inspect package artifact (${error.code ?? "inspection failure"})`);
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
  expectExact("manifest", manifest.assetId, "shi-daze-council-facial-performance-v1", "assetId");

  const packageRoot = resolve(process.env.SHI_UNREAL_PACKAGE_ROOT);
  const runContracts = [
    {
      reviewId: "speaker-normal",
      environmentName: "SHI_FACIAL_SPEAKER_LOG",
      logPath: resolve(process.env.SHI_FACIAL_SPEAKER_LOG),
      reviewFlag: "-ShiCouncilCharacterReviewSpeaker",
      otherReviewFlag: "-ShiCouncilCharacterReviewKeeper",
      reducedMotion: false,
      commandLineReducedMotionOverride: "ReducedMotion=False",
      exerciseAlpha: 0.0624,
      exerciseAlphaText: "0.0624",
      visibleCharacterId: "chen-sheng",
      visibleRole: "speaker",
      exercisePrefix: speakerExercise,
      otherExercisePrefix: keeperExercise,
    },
    {
      reviewId: "speaker-reduced",
      environmentName: "SHI_FACIAL_REDUCED_LOG",
      logPath: resolve(process.env.SHI_FACIAL_REDUCED_LOG),
      reviewFlag: "-ShiCouncilCharacterReviewSpeaker",
      otherReviewFlag: "-ShiCouncilCharacterReviewKeeper",
      reducedMotion: true,
      commandLineReducedMotionOverride: "ReducedMotion=True",
      exerciseAlpha: 1.0,
      exerciseAlphaText: "1.0000",
      visibleCharacterId: "chen-sheng",
      visibleRole: "speaker",
      exercisePrefix: speakerExercise,
      otherExercisePrefix: keeperExercise,
    },
    {
      reviewId: "keeper-normal",
      environmentName: "SHI_FACIAL_KEEPER_LOG",
      logPath: resolve(process.env.SHI_FACIAL_KEEPER_LOG),
      reviewFlag: "-ShiCouncilCharacterReviewKeeper",
      otherReviewFlag: "-ShiCouncilCharacterReviewSpeaker",
      reducedMotion: false,
      commandLineReducedMotionOverride: "ReducedMotion=False",
      exerciseAlpha: 0.1218,
      exerciseAlphaText: "0.1218",
      visibleCharacterId: "keeper",
      visibleRole: "listener",
      exercisePrefix: keeperExercise,
      otherExercisePrefix: speakerExercise,
    },
  ];

  if (new Set(runContracts.map(({ logPath }) => logPath)).size !== runContracts.length) {
    reject("environment", "the three facial review logs must be distinct files");
  }
  for (const contract of runContracts) {
    if (isInside(repositoryRoot, contract.logPath)) {
      reject(contract.reviewId, `${contract.environmentName} must point outside the Git repository`);
    }
  }

  const manifestRuns = manifest.visiblePlaytest?.runtimeLogs;
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

  for (const contract of runContracts) {
    const manifestRun = manifestRuns?.find((run) => run?.reviewId === contract.reviewId);
    const receipt = await readReceipt(contract.reviewId, contract.logPath);
    if (!receipt) continue;
    expectExact(contract.reviewId, receipt.bytes, manifestRun?.bytes, "bytes against manifest");
    expectExact(contract.reviewId, receipt.sha256, manifestRun?.sha256, "sha256 against manifest");
    validateLogContent(receipt, contract);
  }
}

await main();

if (errors.length > 0) {
  console.error(`Daze council facial package validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "Daze council facial package validation passed: 5 artifacts, 3 anchored logs, 6 admissions, 3 role exercises, reduced alpha 1.0000, and 3 controlled Unreal shutdowns.",
  );
}
