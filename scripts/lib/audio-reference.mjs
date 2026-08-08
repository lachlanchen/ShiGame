import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const runFile = promisify(execFile);
const ffmpegPath = process.env.SHI_FFMPEG ?? "/usr/bin/ffmpeg";
const ffprobePath = process.env.SHI_FFPROBE ?? "/usr/bin/ffprobe";

const finiteDb = (amplitude) => amplitude > 0 ? 20 * Math.log10(amplitude) : Number.NEGATIVE_INFINITY;
const rounded = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : value;

export function createRainSamples(length, seed) {
  const samples = new Float32Array(Math.max(1, Math.floor(length)));
  let state = seed >>> 0 || 1;
  let slow = 0;
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const white = ((state >>> 0) / 0xffffffff) * 2 - 1;
    slow = slow * 0.985 + white * 0.015;
    const grain = (state & 0x7ff) < 3 ? white * 0.22 : 0;
    samples[index] = Math.max(-1, Math.min(1, white * 0.42 + slow * 0.82 + grain));
    sum += samples[index];
  }
  const mean = sum / samples.length;
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.max(-1, Math.min(1, samples[index] - mean));
  return samples;
}

export function createCueSamples(tones, envelope, sampleRate) {
  const durationMs = Math.max(...tones.map((tone) => tone.offsetMs + tone.durationMs));
  const samples = new Float32Array(Math.ceil((durationMs + envelope.releaseMs) / 1000 * sampleRate));
  const attackSamples = Math.max(1, envelope.attackMs / 1000 * sampleRate);
  const releaseSamples = Math.max(1, envelope.releaseMs / 1000 * sampleRate);
  for (const tone of tones) {
    const start = Math.round(tone.offsetMs / 1000 * sampleRate);
    const count = Math.max(1, Math.round(tone.durationMs / 1000 * sampleRate));
    let phase = 0;
    for (let index = 0; index < count && start + index < samples.length; index += 1) {
      const progress = index / Math.max(1, count - 1);
      const frequency = tone.frequencyHz * Math.pow(tone.endFrequencyHz / tone.frequencyHz, progress);
      phase += 2 * Math.PI * frequency / sampleRate;
      const wave = tone.wave === "triangle" ? 2 / Math.PI * Math.asin(Math.sin(phase)) : Math.sin(phase);
      const attack = Math.min(1, index / attackSamples);
      const release = Math.min(1, (count - index - 1) / releaseSamples);
      samples[start + index] = Math.max(-1, Math.min(1, samples[start + index] + wave * tone.gain * Math.min(attack, release)));
    }
  }
  return samples;
}

function encodeFloat32Wav(samples, sampleRate, channels = 1) {
  const dataBytes = samples.length * Float32Array.BYTES_PER_ELEMENT;
  const buffer = Buffer.allocUnsafe(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 4, 28);
  buffer.writeUInt16LE(channels * 4, 32);
  buffer.writeUInt16LE(32, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) buffer.writeFloatLE(samples[index], 44 + index * 4);
  return buffer;
}

function measureMono(samples, gain = 1) {
  let peak = 0;
  let squareSum = 0;
  let sum = 0;
  for (const source of samples) {
    const sample = source * gain;
    peak = Math.max(peak, Math.abs(sample));
    squareSum += sample * sample;
    sum += sample;
  }
  return {
    peakDbfs: rounded(finiteDb(peak)),
    rmsDbfs: rounded(finiteDb(Math.sqrt(squareSum / samples.length))),
    dcOffset: rounded(sum / samples.length, 8),
  };
}

async function decodeFloat32(path, sampleRate, channels) {
  const { stdout } = await runFile(ffmpegPath, [
    "-hide_banner", "-loglevel", "error", "-i", path,
    "-ar", String(sampleRate), "-ac", String(channels), "-f", "f32le", "pipe:1",
  ], { encoding: "buffer", maxBuffer: 128 * 1024 * 1024 });
  return stdout;
}

async function measureProgramme(path, sampleRate, channels) {
  const decoded = await decodeFloat32(path, sampleRate, channels);
  const frames = decoded.length / (Float32Array.BYTES_PER_ELEMENT * channels);
  let peak = 0;
  let squareSum = 0;
  let stereoDifferenceSquareSum = 0;
  const channelSums = new Float64Array(channels);
  for (let frame = 0; frame < frames; frame += 1) {
    const frameSamples = [];
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = decoded.readFloatLE((frame * channels + channel) * 4);
      frameSamples.push(sample);
      peak = Math.max(peak, Math.abs(sample));
      squareSum += sample * sample;
      channelSums[channel] += sample;
    }
    if (channels === 2) {
      const difference = frameSamples[0] - frameSamples[1];
      stereoDifferenceSquareSum += difference * difference;
    }
  }
  const { stderr } = await runFile(ffmpegPath, [
    "-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-",
  ], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const summaries = [...stderr.matchAll(/Summary:\s*[\s\S]*?I:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+LUFS[\s\S]*?Peak:\s*(-?(?:\d+(?:\.\d+)?|inf))\s+dBFS/g)];
  if (summaries.length === 0) throw new Error("FFmpeg did not emit a parseable EBU R128 summary.");
  const summary = summaries[summaries.length - 1];
  const parseLevel = (value) => value.includes("inf") ? Number.NEGATIVE_INFINITY : Number.parseFloat(value);
  return {
    frames,
    samplePeakDbfs: rounded(finiteDb(peak)),
    rmsDbfs: rounded(finiteDb(Math.sqrt(squareSum / (frames * channels)))),
    integratedLufs: parseLevel(summary[1]),
    truePeakDbtp: parseLevel(summary[2]),
    dcOffsetAbsolute: rounded(Math.max(...channelSums.map((sum) => Math.abs(sum / frames))), 8),
    stereoDifferenceRms: rounded(channels === 2 ? Math.sqrt(stereoDifferenceSquareSum / frames) : 0, 8),
  };
}

export async function analyzeAudioArtifact(audioPath) {
  const probe = await probeAudioFile(audioPath);
  const stream = probe.streams?.[0];
  if (!stream) throw new Error(`Audio stream is missing from ${audioPath}.`);
  const sampleRate = Number.parseInt(stream.sample_rate, 10);
  const channels = Number.parseInt(stream.channels, 10);
  const metrics = await measureProgramme(audioPath, sampleRate, channels);
  return {
    probe,
    metrics,
    sha256: await sha256File(audioPath),
    bytes: Number.parseInt(probe.format?.size, 10),
    seconds: Number.parseFloat(probe.format?.duration),
    sampleRate,
    channels,
    codec: stream.codec_name,
  };
}

function buildChecks(contract, metrics, cueMetrics, loop) {
  const limits = contract.quality.limits;
  const checks = [
    { id: "sample-peak", value: metrics.samplePeakDbfs, rule: "<=", limit: limits.samplePeakDbfsMax, pass: metrics.samplePeakDbfs <= limits.samplePeakDbfsMax },
    { id: "true-peak", value: metrics.truePeakDbtp, rule: "<=", limit: limits.truePeakDbtpMax, pass: metrics.truePeakDbtp <= limits.truePeakDbtpMax },
    { id: "integrated-loudness-min", value: metrics.integratedLufs, rule: ">=", limit: limits.integratedLufsMin, pass: metrics.integratedLufs >= limits.integratedLufsMin },
    { id: "integrated-loudness-max", value: metrics.integratedLufs, rule: "<=", limit: limits.integratedLufsMax, pass: metrics.integratedLufs <= limits.integratedLufsMax },
    { id: "quietest-cue-peak", value: Math.min(...cueMetrics.map((cue) => cue.peakDbfs)), rule: ">=", limit: limits.cuePeakDbfsMin, pass: cueMetrics.every((cue) => cue.peakDbfs >= limits.cuePeakDbfsMin) },
    { id: "dc-offset", value: metrics.dcOffsetAbsolute, rule: "<=", limit: limits.dcOffsetAbsoluteMax, pass: metrics.dcOffsetAbsolute <= limits.dcOffsetAbsoluteMax },
    { id: "raw-ambience-dc-offset", value: loop.raw.dcOffsetAbsolute, rule: "<=", limit: limits.rawAmbienceDcOffsetAbsoluteMax, pass: loop.raw.dcOffsetAbsolute <= limits.rawAmbienceDcOffsetAbsoluteMax },
    { id: "loop-boundary-jump-ratio", value: loop.boundaryJumpRatio, rule: "<=", limit: limits.loopBoundaryJumpRatioMax, pass: loop.boundaryJumpRatio <= limits.loopBoundaryJumpRatioMax },
    { id: "stereo-difference", value: metrics.stereoDifferenceRms, rule: "<=", limit: limits.stereoDifferenceRmsMax, pass: metrics.stereoDifferenceRms <= limits.stereoDifferenceRmsMax },
  ];
  return checks;
}

export async function renderAudioReference(contract, outputPath) {
  const temporary = await mkdtemp(join(tmpdir(), "shi-audio-reference-"));
  try {
    const sourceRate = contract.ambience.sampleRate;
    const reference = contract.quality.reference;
    const loopSamples = createRainSamples(sourceRate * contract.ambience.loopSeconds, contract.ambience.seed);
    const rain = new Float32Array(Math.ceil(reference.seconds * sourceRate));
    for (let index = 0; index < rain.length; index += 1) rain[index] = loopSamples[index % loopSamples.length];
    const effects = new Float32Array(Math.ceil(reference.seconds * reference.sampleRate));
    const cueMetrics = [];
    const effectsGain = contract.mix.defaults.master * contract.mix.defaults.effects;
    for (const scheduled of reference.cueSchedule) {
      const cue = createCueSamples(contract.cues[scheduled.cue], contract.envelope, reference.sampleRate);
      const start = Math.round(scheduled.atSeconds * reference.sampleRate);
      for (let index = 0; index < cue.length && start + index < effects.length; index += 1) {
        effects[start + index] = Math.max(-1, Math.min(1, effects[start + index] + cue[index]));
      }
      cueMetrics.push({ cue: scheduled.cue, atSeconds: scheduled.atSeconds, ...measureMono(cue, effectsGain) });
    }
    const rainPath = join(temporary, "rain-source.wav");
    const effectsPath = join(temporary, "effects-source.wav");
    await Promise.all([
      writeFile(rainPath, encodeFloat32Wav(rain, sourceRate)),
      writeFile(effectsPath, encodeFloat32Wav(effects, reference.sampleRate)),
      mkdir(dirname(outputPath), { recursive: true }),
    ]);
    const ambienceGain = contract.mix.defaults.master * contract.mix.defaults.ambience * contract.ambience.gain;
    const filter = [
      `[0:a]aresample=${reference.sampleRate},highpass=f=${contract.ambience.highpassHz},lowpass=f=${contract.ambience.lowpassHz},volume=${ambienceGain}[bed]`,
      `[1:a]volume=${effectsGain}[effects]`,
      `[bed][effects]amix=inputs=2:duration=longest:normalize=0,atrim=duration=${reference.seconds},pan=stereo|c0=c0|c1=c0[mix]`,
    ].join(";");
    await runFile(ffmpegPath, [
      "-y", "-hide_banner", "-loglevel", "error", "-i", rainPath, "-i", effectsPath,
      "-filter_complex", filter, "-map", "[mix]", "-ar", String(reference.sampleRate), "-c:a", "pcm_s24le", outputPath,
    ], { maxBuffer: 16 * 1024 * 1024 });
    const metrics = await measureProgramme(outputPath, reference.sampleRate, 2);
    const adjacentJumps = [];
    for (let index = 1; index < loopSamples.length; index += 1) adjacentJumps.push(Math.abs(loopSamples[index] - loopSamples[index - 1]));
    adjacentJumps.sort((left, right) => left - right);
    const boundaryDelta = Math.abs(loopSamples[loopSamples.length - 1] - loopSamples[0]);
    const adjacentJumpP99 = adjacentJumps[Math.floor(adjacentJumps.length * 0.99)];
    const rawLoop = measureMono(loopSamples);
    const loop = {
      samples: loopSamples.length,
      boundaryDelta: rounded(boundaryDelta, 8),
      adjacentJumpP99: rounded(adjacentJumpP99, 8),
      boundaryJumpRatio: rounded(boundaryDelta / adjacentJumpP99),
      raw: { ...rawLoop, dcOffsetAbsolute: rounded(Math.abs(rawLoop.dcOffset), 8) },
    };
    const checks = buildChecks(contract, metrics, cueMetrics, loop);
    const audio = await readFile(outputPath);
    const { stdout: ffmpegVersion } = await runFile(ffmpegPath, ["-version"], { encoding: "utf8" });
    return {
      metrics,
      cueMetrics,
      loop,
      checks,
      ok: checks.every((check) => check.pass),
      artifact: {
        bytes: audio.length,
        sha256: createHash("sha256").update(audio).digest("hex"),
        sampleRate: reference.sampleRate,
        channels: 2,
        codec: "pcm_s24le",
        seconds: reference.seconds,
      },
      toolchain: {
        renderer: "SHI deterministic reference renderer v1",
        ffmpeg: ffmpegVersion.split("\n", 1)[0],
      },
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function createAudioSpectrogram(audioPath, imagePath) {
  await mkdir(dirname(imagePath), { recursive: true });
  await runFile(ffmpegPath, [
    "-y", "-hide_banner", "-loglevel", "error", "-i", audioPath,
    "-lavfi", "showspectrumpic=s=1600x900:legend=1:scale=log:color=fiery:win_func=hann",
    "-frames:v", "1", imagePath,
  ], { maxBuffer: 16 * 1024 * 1024 });
}

export async function probeAudioFile(audioPath) {
  const { stdout } = await runFile(ffprobePath, [
    "-v", "error", "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels", "-of", "json", audioPath,
  ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout);
}

export async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}
