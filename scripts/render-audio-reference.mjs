import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { createAudioSpectrogram, renderAudioReference } from "./lib/audio-reference.mjs";

const root = resolve(import.meta.dirname, "..");
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return resolve(root, index >= 0 ? process.argv[index + 1] : fallback);
};
const contractPath = resolve(root, "content/audio/chapter-01-audio.json");
const audioPath = argument("--audio", ".runtime/audio/chapter-01-reference.wav");
const evidencePath = argument("--evidence", "docs/production/evidence/audio-reference-status.json");
const spectrogramPath = argument("--spectrogram", "docs/production/evidence/audio-reference-spectrogram.png");
const contractSource = await readFile(contractPath);
const contract = JSON.parse(contractSource);
const result = await renderAudioReference(contract, audioPath);
await createAudioSpectrogram(audioPath, spectrogramPath);

const report = {
  schemaVersion: 1,
  kind: "deterministic-reference-render",
  contractId: contract.id,
  contractSha256: createHash("sha256").update(contractSource).digest("hex"),
  generatedAt: new Date().toISOString(),
  reference: contract.quality.reference,
  limits: contract.quality.limits,
  ...result,
  artifact: {
    ...result.artifact,
    committed: false,
    path: relative(root, audioPath),
  },
  visualEvidence: relative(root, spectrogramPath),
  reviewBoundary: {
    engineeringMeasurement: result.ok ? "pass" : "fail",
    humanListening: "required",
    deviceMatrix: "required",
    unityNativeParity: "required",
  },
};
await mkdir(dirname(evidencePath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
if (!result.ok) {
  for (const check of result.checks.filter((check) => !check.pass)) console.error(`${check.id}: ${check.value} ${check.rule} ${check.limit}`);
  process.exit(1);
}
console.log(`Audio reference passed: ${result.metrics.integratedLufs} LUFS, ${result.metrics.truePeakDbtp} dBTP, ${result.artifact.sha256.slice(0, 12)}.`);
