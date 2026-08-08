import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { renderAudioReference } from "./lib/audio-reference.mjs";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "content/audio/chapter-01-audio.json");
const contract = JSON.parse(await readFile(sourcePath, "utf8"));
const provenance = JSON.parse(await readFile(resolve(root, "assets/provenance/chapter-01-audio.json"), "utf8"));
const errors = [];
const requiredCues = ["select", "inspect", "drawer", "close", "commit", "ending", "failure"];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const inRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

assert(contract.schemaVersion === 1, "audio schemaVersion must be 1");
assert(contract.id === "chapter-01-daze-audio", "audio contract id changed unexpectedly");
assert(typeof contract.title === "string" && contract.title.trim().length > 0, "audio title is missing");
assert(contract.synthesis === "project-original-procedural", "audio must remain project-original procedural synthesis");
assert(contract.mix?.defaults?.enabled === false, "audio must be off by default");
for (const bus of ["master", "ambience", "effects"]) {
  assert(inRange(contract.mix?.defaults?.[bus], 0, 1), `default ${bus} must be within 0..1`);
  assert(inRange(contract.mix?.caps?.[bus], 0, 1), `cap ${bus} must be within 0..1`);
  assert(contract.mix?.defaults?.[bus] <= contract.mix?.caps?.[bus], `default ${bus} exceeds its cap`);
}
assert(inRange(contract.mix?.fadeSeconds, 0.05, 3), "mix fadeSeconds must be within 0.05..3");
assert(inRange(contract.envelope?.attackMs, 1, 50), "audio envelope attackMs must be within 1..50");
assert(inRange(contract.envelope?.releaseMs, 1, 100), "audio envelope releaseMs must be within 1..100");
assert(contract.envelope?.curve === "linear", "audio envelope curve must be linear");
assert(Number.isInteger(contract.ambience?.seed) && contract.ambience.seed > 0, "ambience seed must be a nonzero integer");
assert(Number.isInteger(contract.ambience?.sampleRate) && inRange(contract.ambience.sampleRate, 16000, 48000), "ambience sampleRate must be within 16000..48000");
assert(Number.isInteger(contract.ambience?.loopSeconds) && inRange(contract.ambience.loopSeconds, 2, 30), "ambience loopSeconds must be within 2..30");
assert(inRange(contract.ambience?.highpassHz, 20, 1000), "ambience highpassHz must be within 20..1000");
assert(inRange(contract.ambience?.lowpassHz, 1000, 12000), "ambience lowpassHz must be within 1000..12000");
assert(contract.ambience?.highpassHz < contract.ambience?.lowpassHz, "ambience filter band is inverted");
assert(inRange(contract.ambience?.gain, 0, 0.5), "ambience gain must be within 0..0.5");

assert(Object.keys(contract.cues ?? {}).sort().join("|") === [...requiredCues].sort().join("|"), "audio cue set must be exact and versioned");
for (const cue of requiredCues) {
  const tones = contract.cues?.[cue];
  assert(Array.isArray(tones) && tones.length >= 1 && tones.length <= 4, `${cue} must contain 1..4 tones`);
  for (const [index, tone] of (tones ?? []).entries()) {
    const label = `${cue}[${index}]`;
    assert(Number.isInteger(tone.offsetMs) && inRange(tone.offsetMs, 0, 1000), `${label}.offsetMs is unsafe`);
    assert(inRange(tone.frequencyHz, 80, 1600) && inRange(tone.endFrequencyHz, 80, 1600), `${label} frequency is unsafe`);
    assert(Number.isInteger(tone.durationMs) && inRange(tone.durationMs, 20, 1000), `${label}.durationMs is unsafe`);
    assert(inRange(tone.gain, 0.001, 0.15), `${label}.gain exceeds the authored cap`);
    assert(["sine", "triangle"].includes(tone.wave), `${label}.wave is unsupported`);
  }
}
const reference = contract.quality?.reference;
const browserCapture = contract.quality?.browserCapture;
const limits = contract.quality?.limits;
assert(Number.isInteger(reference?.sampleRate) && inRange(reference.sampleRate, 44100, 96000), "quality reference sampleRate must be within 44100..96000");
assert(inRange(reference?.seconds, 10, 60), "quality reference seconds must be within 10..60");
assert(Array.isArray(reference?.cueSchedule) && reference.cueSchedule.length === requiredCues.length, "quality reference must schedule seven cues");
assert((reference?.cueSchedule ?? []).map((item) => item.cue).sort().join("|") === [...requiredCues].sort().join("|"), "quality reference must schedule every cue exactly once");
for (const item of reference?.cueSchedule ?? []) {
  assert(inRange(item.atSeconds, 0, reference.seconds), `quality reference cue ${item.cue} is outside the programme`);
}
assert(Number.isInteger(browserCapture?.sampleRate) && inRange(browserCapture.sampleRate, 44100, 96000), "browser capture sampleRate must be within 44100..96000");
assert(inRange(browserCapture?.preConsentSeconds, 1, 10), "browser capture preConsentSeconds must be within 1..10");
assert(inRange(browserCapture?.activeSeconds, 14, 60), "browser capture activeSeconds must be within 14..60");
assert(inRange(limits?.samplePeakDbfsMax, -30, -1), "sample peak limit is unsafe");
assert(inRange(limits?.truePeakDbtpMax, -30, -1), "true-peak limit is unsafe");
assert(inRange(limits?.integratedLufsMin, -60, -10) && inRange(limits?.integratedLufsMax, -60, -10) && limits.integratedLufsMin < limits.integratedLufsMax, "integrated loudness window is invalid");
assert(inRange(limits?.cuePeakDbfsMin, -60, -10), "minimum cue peak is invalid");
for (const field of ["dcOffsetAbsoluteMax", "rawAmbienceDcOffsetAbsoluteMax", "stereoDifferenceRmsMax"]) assert(inRange(limits?.[field], 0, 0.01), `${field} is invalid`);
assert(inRange(limits?.loopBoundaryJumpRatioMax, 0, 2), "loopBoundaryJumpRatioMax is invalid");
assert(provenance.assetId === contract.id, "audio provenance does not identify the contract");
assert(provenance.rightsStatus === "project-original", "audio provenance must remain project-original");
assert(Array.isArray(provenance.sourceMedia) && provenance.sourceMedia.length === 0, "procedural audio must not claim untracked source media");
assert(provenance.reviewStatus === "engineering-pass-human-listening-required", "audio must preserve the human-listening release gate");
assert(provenance.review?.preConsentSilence === "actual visible-browser output pass" && provenance.review?.browserOutputCapture === "engineering pass; human perception not inferred", "audio provenance must record the actual-browser engineering boundary");
assert(provenance.review?.humanListening === "required" && /physical device review required/.test(provenance.review?.monoAndDeviceMatrix ?? "") && /native-platform review required/.test(provenance.review?.loudnessMeasurement ?? ""), "audio provenance weakened a human, device, or native review gate");

const source = await readFile(sourcePath);
for (const relative of [
  "apps/web/src/generated/chapter-01-audio.json",
  "apps/unity/Assets/StreamingAssets/chapter-01-audio.json",
]) {
  const path = resolve(root, relative);
  try {
    await access(path, constants.F_OK);
    assert(source.equals(await readFile(path)), `generated audio contract is stale: ${relative}`);
  } catch {
    errors.push(`generated audio contract is missing: ${relative}`);
  }
}

const evidencePath = resolve(root, "docs/production/evidence/audio-reference-status.json");
const spectrogramPath = resolve(root, "docs/production/evidence/audio-reference-spectrogram.png");
const browserEvidencePath = resolve(root, "docs/production/evidence/audio-browser-capture-status.json");
const browserScreenshotPath = resolve(root, "docs/production/evidence/audio-browser-capture-ui.png");
const browserSpectrogramPath = resolve(root, "docs/production/evidence/audio-browser-capture-spectrogram.png");
const renderDirectory = await mkdtemp(join(tmpdir(), "shi-audio-validation-"));
try {
  const rendered = await renderAudioReference(contract, join(renderDirectory, "reference.wav"));
  assert(rendered.ok, `reference render violates quality limits: ${rendered.checks.filter((check) => !check.pass).map((check) => check.id).join(", ")}`);
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const contractSha256 = createHash("sha256").update(source).digest("hex");
  assert(evidence.schemaVersion === 1 && evidence.kind === "deterministic-reference-render", "audio reference evidence identity is invalid");
  assert(evidence.contractId === contract.id && evidence.contractSha256 === contractSha256, "audio reference evidence is stale for the current contract");
  assert(evidence.ok === true && evidence.reviewBoundary?.engineeringMeasurement === "pass", "audio reference engineering measurement did not pass");
  assert(evidence.reviewBoundary?.humanListening === "required" && evidence.reviewBoundary?.deviceMatrix === "required" && evidence.reviewBoundary?.unityNativeParity === "required", "audio reference evidence weakened a human or native review gate");
  assert(evidence.artifact?.committed === false && evidence.artifact?.path === ".runtime/audio/chapter-01-reference.wav", "audio reference WAV must remain reproducible and uncommitted");
  for (const field of ["samplePeakDbfs", "integratedLufs", "truePeakDbtp", "dcOffsetAbsolute", "stereoDifferenceRms"]) {
    assert(Math.abs(evidence.metrics?.[field] - rendered.metrics[field]) <= 0.35, `audio reference evidence ${field} drifted from a fresh render`);
  }
  assert(evidence.loop?.boundaryJumpRatio === rendered.loop.boundaryJumpRatio && evidence.loop?.raw?.dcOffsetAbsolute === rendered.loop.raw.dcOffsetAbsolute, "audio loop evidence drifted from deterministic synthesis");
  assert(evidence.cueMetrics?.length === requiredCues.length && evidence.cueMetrics.every((cue, index) => cue.cue === rendered.cueMetrics[index].cue && Math.abs(cue.peakDbfs - rendered.cueMetrics[index].peakDbfs) <= 0.01), "audio cue evidence drifted from deterministic synthesis");
  await access(spectrogramPath, constants.R_OK);

  const browserEvidence = JSON.parse(await readFile(browserEvidencePath, "utf8"));
  assert(browserEvidence.schemaVersion === 1 && browserEvidence.kind === "visible-browser-audio-capture", "browser audio evidence identity is invalid");
  assert(browserEvidence.contractId === contract.id && browserEvidence.contractSha256 === contractSha256, "browser audio evidence is stale for the current contract");
  assert(browserEvidence.ok === true && browserEvidence.reviewBoundary?.engineeringBrowserCapture === "pass", "browser audio engineering capture did not pass");
  assert(browserEvidence.reviewBoundary?.humanListening === "required" && browserEvidence.reviewBoundary?.physicalDevices === "required" && browserEvidence.reviewBoundary?.unityNativeParity === "required", "browser audio evidence weakened a human, physical-device, or native review gate");
  assert(typeof browserEvidence.testedCommit === "string" && /^(?:working-tree|[0-9a-f]{40})$/.test(browserEvidence.testedCommit), "browser audio evidence has no traceable tested commit");
  assert(browserEvidence.cdpPort === 9323 && browserEvidence.sink === "shi-game-audio-capture", "browser audio capture did not use the isolated production sink");
  assert(/^Chrome\//.test(browserEvidence.browser?.product ?? "") && (browserEvidence.consoleErrors ?? []).length === 0, "browser audio capture has no Chrome identity or contains console errors");
  assert(browserEvidence.preConsent?.path === ".runtime/audio/web-pre-consent-silence.wav" && browserEvidence.preConsent?.committed === false, "pre-consent WAV must remain reproducible and uncommitted");
  assert(browserEvidence.active?.path === ".runtime/audio/web-visible-soundscape.wav" && browserEvidence.active?.committed === false, "active browser WAV must remain reproducible and uncommitted");
  for (const artifact of [browserEvidence.preConsent, browserEvidence.active]) {
    assert(artifact?.sampleRate === browserCapture.sampleRate && artifact?.channels === 2 && artifact?.codec === "pcm_s24le", "browser capture format drifted from the contract");
  }
  assert(Math.abs(browserEvidence.preConsent?.seconds - browserCapture.preConsentSeconds) <= .25, "pre-consent capture duration drifted from the contract");
  assert(Math.abs(browserEvidence.active?.seconds - browserCapture.activeSeconds) <= .25, "active capture duration drifted from the contract");
  assert(browserEvidence.preConsent?.metrics?.samplePeakDbfs === "-inf" && browserEvidence.preConsent?.metrics?.truePeakDbtp === "-inf" && browserEvidence.preConsent?.metrics?.dcOffsetAbsolute === 0, "pre-consent capture is not exact digital silence");
  assert(browserEvidence.active?.metrics?.samplePeakDbfs <= limits.samplePeakDbfsMax && browserEvidence.active?.metrics?.truePeakDbtp <= limits.truePeakDbtpMax, "browser audio peak ceiling failed");
  assert(browserEvidence.active?.metrics?.integratedLufs >= limits.integratedLufsMin && browserEvidence.active?.metrics?.integratedLufs <= limits.integratedLufsMax, "browser audio loudness window failed");
  assert(browserEvidence.active?.metrics?.dcOffsetAbsolute <= limits.dcOffsetAbsoluteMax && browserEvidence.active?.metrics?.stereoDifferenceRms <= limits.stereoDifferenceRmsMax, "browser audio DC or channel-parity limit failed");
  const expectedBrowserChecks = ["pre-consent-digital-silence", "active-sample-peak", "active-true-peak", "active-loudness-min", "active-loudness-max", "active-dc-offset", "dual-mono-output", "browser-console"];
  assert(browserEvidence.checks?.map((check) => check.id).join("|") === expectedBrowserChecks.join("|") && browserEvidence.checks.every((check) => check.pass === true), "browser audio check set is incomplete or failed");
  const expectedBrowserEvents = ["enable-sound-and-drawer-cue", "commit-preview-cue", "close-cue", "inspect-cue", "close-map-cue", "select-cue"];
  assert(browserEvidence.events?.map((event) => event.event).join("|") === expectedBrowserEvents.join("|") && browserEvidence.events.every((event, index, events) => event.atSeconds >= 0 && event.atSeconds < browserCapture.activeSeconds && (index === 0 || event.atSeconds > events[index - 1].atSeconds)), "browser audio event sequence is incomplete, unordered, or outside the capture");
  assert(browserEvidence.visualEvidence?.join("|") === "docs/production/evidence/audio-browser-capture-ui.png|docs/production/evidence/audio-browser-capture-spectrogram.png", "browser audio visual evidence inventory drifted");
  await Promise.all([access(browserScreenshotPath, constants.R_OK), access(browserSpectrogramPath, constants.R_OK)]);
} catch (error) {
  errors.push(`audio reference validation failed: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await rm(renderDirectory, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`Audio validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Audio contract valid: zero-mean ${contract.ambience.loopSeconds}s ambience, ${requiredCues.length} semantic cues, measured reference programme, opt-in ${Math.round(contract.mix.defaults.master * 100)}% master ceiling.`);
