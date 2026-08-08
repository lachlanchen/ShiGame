import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

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
assert(provenance.assetId === contract.id, "audio provenance does not identify the contract");
assert(provenance.rightsStatus === "project-original", "audio provenance must remain project-original");
assert(Array.isArray(provenance.sourceMedia) && provenance.sourceMedia.length === 0, "procedural audio must not claim untracked source media");
assert(provenance.reviewStatus === "engineering-pass-human-listening-required", "audio must preserve the human-listening release gate");

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

if (errors.length) {
  console.error(`Audio validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Audio contract valid: deterministic ${contract.ambience.loopSeconds}s ambience, ${requiredCues.length} semantic cues, opt-in ${Math.round(contract.mix.defaults.master * 100)}% master ceiling.`);
