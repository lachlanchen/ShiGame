import { localize, type Locale, type LocalizedText, type OppositionModel, type ResourceKey, type Resources } from "@shi/game-core";
import oppositionJson from "../generated/chapter-01-opposition.json";
import { translate } from "../i18n";
import { translateOpposition } from "../opposition-i18n";

const opposition = oppositionJson as unknown as OppositionModel;
const effectLabel = (key: ResourceKey, value: number, locale: Locale) => `${value > 0 ? "+" : ""}${value} ${translate(locale, key)}`;
const contentDirection = (text: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !text.ar ? "ltr" : undefined;
const stageFor = (stageId: string) => {
  const stage = opposition.stages.find((candidate) => candidate.id === stageId);
  if (!stage?.title || !stage.forecast || !stage.response || !stage.counterplay || !opposition.title) throw new Error(`Opponent presentation is incomplete for ${stageId}.`);
  return stage as typeof stage & Required<Pick<typeof stage, "title" | "forecast" | "response" | "counterplay">>;
};

export function OppositionPanel({ stageId, locale }: { stageId: string; locale: Locale }) {
  const stage = stageFor(stageId);
  return (
    <section className={`opposition-panel opposition-${stage.id}`} data-testid="opposition-posture" data-stage-id={stage.id} aria-label={translateOpposition(locale, "posture")}>
      <div className="opposition-identity"><span>{translateOpposition(locale, "posture")} · {translate(locale, "reconstruction")}</span><strong dir={contentDirection(stage.title, locale)}>{localize(opposition.title!, locale)} · {localize(stage.title, locale)}</strong></div>
      <p dir={contentDirection(stage.forecast, locale)}>{localize(stage.forecast, locale)}</p>
      <div className="opposition-effects" role="group" aria-label={translate(locale, "pressureForecast")}>{Object.keys(stage.effects).length > 0 ? Object.entries(stage.effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>) : <span className="neutral">{translateOpposition(locale, "noModifier")}</span>}</div>
      <small><b>{translateOpposition(locale, "counterplay")}</b><span dir={contentDirection(stage.counterplay, locale)}>{localize(stage.counterplay, locale)}</span></small>
    </section>
  );
}

export function OppositionResolutionCopy({ stageId, locale }: { stageId: string; locale: Locale }) {
  const stage = stageFor(stageId);
  return <div className="opposition-reveal"><span>{translateOpposition(locale, "response")} · {localize(stage.title, locale)}</span><p dir={contentDirection(stage.response, locale)}>{localize(stage.response, locale)}</p></div>;
}

export function OppositionResolutionDeltas({ effects, locale }: { effects: Partial<Resources>; locale: Locale }) {
  return <div className="delta-list opposition-deltas">{Object.keys(effects).length > 0 ? Object.entries(effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>) : <span className="neutral">{translateOpposition(locale, "noModifier")}</span>}</div>;
}

export function OppositionRecord({ stageId, effects, locale }: { stageId: string; effects: Partial<Resources>; locale: Locale }) {
  const stage = stageFor(stageId);
  return <p className="record-opposition"><b>{translateOpposition(locale, "response")}</b>{localize(stage.title, locale)} · {Object.keys(effects).length > 0 ? Object.entries(effects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ") : translateOpposition(locale, "noModifier")}</p>;
}
