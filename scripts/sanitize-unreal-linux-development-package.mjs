#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const repoRoot = realpathSync(resolve(import.meta.dirname, ".."));
const packageRootInput = process.env.SHI_UNREAL_PACKAGE_ROOT;
const reportPathInput = process.env.SHI_UNREAL_PACKAGE_SANITIZE_REPORT;
const mutationAuthorized = process.env.SHI_UNREAL_PACKAGE_SANITIZE === "1";
const patchelfCommand = process.env.SHI_PATCHELF ?? "patchelf";

function fail(message) {
  throw new Error(`Unreal package sanitization rejected: ${message}`);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function receipt(file) {
  const data = readFileSync(file);
  return { bytes: data.length, sha256: sha256(data) };
}

function run(program, args) {
  return execFileSync(program, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function isInside(parent, candidate) {
  const delta = relative(parent, candidate);
  return delta === "" || (!delta.startsWith(`..${sep}`) && delta !== "..");
}

function forbiddenWorkstationMarkers(buffer) {
  const markers = [process.env.HOME, process.env.USERPROFILE, repoRoot, "SecurityToken="]
    .filter(Boolean)
    .map((marker) => (marker === "SecurityToken=" ? marker : `${resolve(marker)}${sep}`));
  return markers.filter((marker) => buffer.indexOf(Buffer.from(marker, "utf8")) !== -1);
}

if (!packageRootInput || !isAbsolute(packageRootInput)) {
  fail("SHI_UNREAL_PACKAGE_ROOT must be an absolute path outside Git.");
}
if (!reportPathInput || !isAbsolute(reportPathInput)) {
  fail("SHI_UNREAL_PACKAGE_SANITIZE_REPORT must be an absolute external JSON path.");
}

const packageRoot = realpathSync(packageRootInput);
const reportPath = resolve(reportPathInput);
if (isInside(repoRoot, packageRoot) || isInside(repoRoot, reportPath)) {
  fail("package and report paths must remain outside the repository.");
}
if (!existsSync(dirname(reportPath))) mkdirSync(dirname(reportPath), { recursive: true });

const linuxRoot = join(packageRoot, "Linux");
const executable = join(linuxRoot, "SHI", "Binaries", "Linux", "SHI");
const debugFile = `${executable}.debug`;
const symbolFile = `${executable}.sym`;
for (const file of [executable, debugFile, symbolFile]) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    fail(`required Development artifact is missing: ${relative(linuxRoot, file)}`);
  }
}

const patchelf = realpathSync(run("which", [patchelfCommand]));
const patchelfVersion = run(patchelf, ["--version"]);
if (patchelfVersion !== "patchelf 0.18.0") {
  fail(`unexpected patchelf version: ${patchelfVersion}`);
}

const safeRpathEntries = [
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
const safeRpath = safeRpathEntries.join(":");
const originalRpath = run(patchelf, ["--print-rpath", executable]);
const originalExecutable = receipt(executable);
const originalHadPrivateWorkstationPath =
  forbiddenWorkstationMarkers(Buffer.from(originalRpath)).length > 0;

if (originalRpath !== safeRpath) {
  if (!mutationAuthorized) {
    fail("RPATH is not sanitized; rerun only with SHI_UNREAL_PACKAGE_SANITIZE=1.");
  }
  if (!originalHadPrivateWorkstationPath) {
    fail("mutation gate encountered an unknown noncanonical RPATH.");
  }
  run(patchelf, ["--set-rpath", safeRpath, executable]);
}

const inspectedRpath = run(patchelf, ["--print-rpath", executable]);
if (inspectedRpath !== safeRpath) fail("post-mutation RPATH does not match the exact safe contract.");

const artifacts = [
  { file: "SHI/Binaries/Linux/SHI", absolute: executable },
  { file: "SHI/Binaries/Linux/SHI.debug", absolute: debugFile },
  { file: "SHI/Binaries/Linux/SHI.sym", absolute: symbolFile },
].map((entry) => {
  const data = readFileSync(entry.absolute);
  const forbidden = forbiddenWorkstationMarkers(data);
  if (forbidden.length > 0) {
    fail(`${entry.file} retains ${forbidden.length} forbidden private-path or token marker classes.`);
  }
  return {
    file: entry.file,
    ...receipt(entry.absolute),
    forbiddenWorkstationMarkerClassCount: forbidden.length,
    passed: true,
  };
});

const lddOutput = run("ldd", [executable]);
const missingDependencies = lddOutput
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.includes("not found"));
if (missingDependencies.length > 0) fail("ldd reports one or more unresolved dependencies.");

const finalExecutable = receipt(executable);
const report = {
  schemaVersion: 1,
  kind: "shi-unreal-linux-development-package-path-sanitization",
  mode: mutationAuthorized ? "authorized-rpath-sanitize" : "inspect-only",
  packageRoot: "$SHI_UNREAL_PACKAGE_ROOT/Linux",
  mutationAuthorized,
  mutationPerformed: originalRpath !== safeRpath,
  tool: {
    name: "patchelf",
    version: patchelfVersion,
    executable: receipt(realpathSync(patchelf)),
    ubuntuPackage: "patchelf 0.18.0-1.1build1",
    ubuntuPackageSha256: "962a43e33cd56061522554898557a038ccbb8aa4e1e0f421b2d6f6adf1f80c60",
  },
  executableMutation: {
    file: "SHI/Binaries/Linux/SHI",
    before: originalExecutable,
    after: finalExecutable,
    changed: originalExecutable.sha256 !== finalExecutable.sha256,
  },
  rpath: {
    originalEntryCount: originalRpath.split(":").filter(Boolean).length,
    originalHadPrivateWorkstationPath,
    exactSafeEntries: safeRpathEntries,
    exactSafeRpathObserved: inspectedRpath === safeRpath,
    absoluteWorkstationPathCount: 0,
    passed: true,
  },
  artifacts,
  dependencyInspection: {
    tool: "ldd",
    observedLineCount: lddOutput.split("\n").filter(Boolean).length,
    unresolvedDependencyCount: missingDependencies.length,
    passed: true,
  },
  authorityBoundary: {
    changesGameplayCode: false,
    changesCookedContent: false,
    changesPakOrIoStore: false,
    changesOnlyExecutableRpath: true,
    finalReleaseApproval: false,
  },
  passed: true,
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(
  `SHI Unreal package path sanitization passed (${report.mode}; ` +
    `${artifacts.length} artifacts, ${safeRpathEntries.length} relative RPATH entries, ` +
    `${report.dependencyInspection.observedLineCount} resolved ldd lines).`,
);
