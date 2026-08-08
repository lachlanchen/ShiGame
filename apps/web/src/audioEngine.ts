import audioJson from "./generated/chapter-01-audio.json";
import type { AudioCue, AudioPreferences } from "./audio-types";

interface ToneContract {
  offsetMs: number;
  frequencyHz: number;
  endFrequencyHz: number;
  durationMs: number;
  gain: number;
  wave: OscillatorType;
}

interface AudioContract {
  mix: { defaults: { master: number }; fadeSeconds: number };
  ambience: { seed: number; sampleRate: number; loopSeconds: number; highpassHz: number; lowpassHz: number; gain: number };
  cues: Record<AudioCue, ToneContract[]>;
}

const contract = audioJson as AudioContract;

export function createRainSamples(length: number, seed: number): Float32Array<ArrayBuffer> {
  const sampleCount = Math.max(1, Math.floor(length));
  const samples = new Float32Array(new ArrayBuffer(sampleCount * Float32Array.BYTES_PER_ELEMENT));
  let state = seed >>> 0 || 1;
  let slow = 0;
  for (let index = 0; index < samples.length; index++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const white = ((state >>> 0) / 0xffffffff) * 2 - 1;
    slow = slow * 0.985 + white * 0.015;
    const grain = (state & 0x7ff) < 3 ? white * 0.22 : 0;
    samples[index] = Math.max(-1, Math.min(1, white * 0.42 + slow * 0.82 + grain));
  }
  if (samples.length > 1) {
    const drift = samples[samples.length - 1]! - samples[0]!;
    for (let index = 1; index < samples.length; index++) {
      samples[index] = Math.max(-1, Math.min(1, samples[index]! - drift * index / (samples.length - 1)));
    }
    samples[samples.length - 1] = samples[0]!;
  }
  return samples;
}

export function cueDurationSeconds(cue: AudioCue): number {
  return Math.max(...contract.cues[cue].map((tone) => tone.offsetMs + tone.durationMs)) / 1000;
}

export class ShiAudioEngine {
  private readonly master: GainNode;
  private readonly ambienceBus: GainNode;
  private readonly effectsBus: GainNode;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private preferences: AudioPreferences;
  private ambienceActive = false;

  constructor(private readonly context: AudioContext, preferences: AudioPreferences) {
    this.preferences = { ...preferences };
    this.master = context.createGain();
    this.ambienceBus = context.createGain();
    this.effectsBus = context.createGain();
    this.ambienceBus.connect(this.master);
    this.effectsBus.connect(this.master);
    this.master.connect(context.destination);
    this.applyMix(true);
  }

  setPreferences(preferences: AudioPreferences): void {
    this.preferences = { ...preferences };
    this.applyMix(false);
    if (!preferences.enabled) this.stopAmbience();
    else if (this.ambienceActive) this.startAmbience();
  }

  setAmbienceActive(active: boolean): void {
    this.ambienceActive = active;
    if (active && this.preferences.enabled) this.startAmbience();
    else this.stopAmbience();
  }

  playCue(cue: AudioCue): void {
    if (!this.preferences.enabled || this.context.state !== "running") return;
    const now = this.context.currentTime + 0.006;
    for (const tone of contract.cues[cue]) {
      const start = now + tone.offsetMs / 1000;
      const end = start + tone.durationMs / 1000;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequencyHz, start);
      oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequencyHz, end);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(tone.gain, start + Math.min(0.012, tone.durationMs / 3000));
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(this.effectsBus);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    }
  }

  dispose(): void {
    this.stopAmbience();
    this.ambienceBus.disconnect();
    this.effectsBus.disconnect();
    this.master.disconnect();
  }

  private applyMix(immediate: boolean): void {
    const time = this.context.currentTime;
    const fade = immediate ? 0 : contract.mix.fadeSeconds;
    this.setGain(this.master.gain, this.preferences.enabled ? contract.mix.defaults.master : 0, time, fade);
    this.setGain(this.ambienceBus.gain, this.preferences.ambience * contract.ambience.gain, time, fade);
    this.setGain(this.effectsBus.gain, this.preferences.effects, time, fade);
  }

  private setGain(parameter: AudioParam, value: number, time: number, fade: number): void {
    parameter.cancelScheduledValues(time);
    parameter.setValueAtTime(parameter.value, time);
    parameter.linearRampToValueAtTime(value, time + fade);
  }

  private startAmbience(): void {
    if (this.ambienceSource || this.context.state !== "running") return;
    const settings = contract.ambience;
    const length = settings.sampleRate * settings.loopSeconds;
    const buffer = this.context.createBuffer(1, length, settings.sampleRate);
    buffer.copyToChannel(createRainSamples(length, settings.seed), 0);
    const source = this.context.createBufferSource();
    const highpass = this.context.createBiquadFilter();
    const lowpass = this.context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = settings.highpassHz;
    lowpass.type = "lowpass";
    lowpass.frequency.value = settings.lowpassHz;
    source.buffer = buffer;
    source.loop = true;
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.ambienceBus);
    source.start();
    this.ambienceSource = source;
  }

  private stopAmbience(): void {
    if (!this.ambienceSource) return;
    try { this.ambienceSource.stop(); } catch { /* Already stopped by the browser. */ }
    this.ambienceSource.disconnect();
    this.ambienceSource = null;
  }
}
