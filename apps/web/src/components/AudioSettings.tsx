import type { Locale } from "@shi/game-core";
import { audioCaps, type AudioPreferences, type AudioRuntimeStatus } from "../audio-types";
import { translate } from "../i18n";
import { translateAudio } from "../audio-i18n";

interface AudioSettingsProps {
  locale: Locale;
  preferences: AudioPreferences;
  status: AudioRuntimeStatus;
  onEnabledChange: (enabled: boolean) => void;
  onLevelChange: (bus: "ambience" | "effects", value: number) => void;
  onPreview: () => void;
  onClose: () => void;
}

const percent = (value: number, maximum: number) => Math.round(value / maximum * 100);

export function AudioSettings({ locale, preferences, status, onEnabledChange, onLevelChange, onPreview, onClose }: AudioSettingsProps) {
  const statusText = translateAudio(locale, status);
  return (
    <aside className="drawer audio-drawer" data-testid="audio-drawer" role="dialog" aria-modal="true" aria-labelledby="audio-title">
      <div className="drawer-head">
        <div><span className="eyebrow">SHI · AUDIO</span><h2 id="audio-title">{translateAudio(locale, "title")}</h2></div>
        <button className="icon-button" autoFocus onClick={onClose} aria-label={translate(locale, "close")}>×</button>
      </div>
      <p className="audio-intro">{translateAudio(locale, "intro")}</p>
      <label className="audio-enable">
        <input data-testid="audio-enabled" type="checkbox" checked={preferences.enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        <span><strong>{translateAudio(locale, "enable")}</strong><small aria-live="polite">{statusText}</small></span>
      </label>
      <div className="audio-mixer" aria-disabled={!preferences.enabled}>
        {(["ambience", "effects"] as const).map((bus) => (
          <label className="audio-channel" key={bus}>
            <span><strong>{translateAudio(locale, bus)}</strong><output htmlFor={`audio-${bus}`}>{percent(preferences[bus], audioCaps[bus])}%</output></span>
            <input id={`audio-${bus}`} data-testid={`audio-${bus}`} type="range" min="0" max={audioCaps[bus]} step="0.01" value={preferences[bus]} disabled={!preferences.enabled} onChange={(event) => onLevelChange(bus, Number.parseFloat(event.target.value))} />
          </label>
        ))}
      </div>
      <button className="audio-preview" data-testid="audio-preview" disabled={!preferences.enabled || status === "unsupported" || status === "error"} onClick={onPreview}>{translateAudio(locale, "preview")} <span aria-hidden="true">◌</span></button>
      <p className="audio-review">{translateAudio(locale, "review")}</p>
    </aside>
  );
}
