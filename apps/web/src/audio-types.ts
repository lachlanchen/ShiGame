import audioJson from "./generated/chapter-01-audio.json";

export type AudioCue = "select" | "inspect" | "drawer" | "close" | "commit" | "ending" | "failure";
export type AudioRuntimeStatus = "off" | "armed" | "starting" | "ready" | "unsupported" | "error";

export interface AudioPreferences {
  enabled: boolean;
  ambience: number;
  effects: number;
}

export const AUDIO_PREFERENCES_KEY = "shi.audio.v1";
export const audioDefaults: AudioPreferences = {
  enabled: audioJson.mix.defaults.enabled,
  ambience: audioJson.mix.defaults.ambience,
  effects: audioJson.mix.defaults.effects,
};
export const audioCaps = {
  ambience: audioJson.mix.caps.ambience,
  effects: audioJson.mix.caps.effects,
};

const clamp = (value: unknown, fallback: number, maximum: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(maximum, value)) : fallback;

export function readAudioPreferences(): AudioPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "null") as Partial<AudioPreferences> | null;
    if (!stored) return { ...audioDefaults };
    return {
      enabled: stored.enabled === true,
      ambience: clamp(stored.ambience, audioDefaults.ambience, audioCaps.ambience),
      effects: clamp(stored.effects, audioDefaults.effects, audioCaps.effects),
    };
  } catch {
    return { ...audioDefaults };
  }
}

export function storeAudioPreferences(preferences: AudioPreferences): void {
  localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(preferences));
}
