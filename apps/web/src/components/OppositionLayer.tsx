import { localize, type Locale, type LocalizedText, type MethodCountermeasure, type OppositionModel, type ResourceKey, type Resources } from "@shi/game-core";
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
const methodFor = (methodId: string) => {
  const method = opposition.methods.find((candidate) => candidate.id === methodId);
  if (!method) throw new Error(`Strategic-method presentation is incomplete for ${methodId}.`);
  return method;
};
const readFor = (readId: string) => {
  if (opposition.methodRead.neutral.id === readId) return opposition.methodRead.neutral;
  const read = opposition.methodRead.countermeasures.find((candidate) => candidate.id === readId);
  if (!read) throw new Error(`Method-read presentation is incomplete for ${readId}.`);
  return read;
};
const isCountermeasure = (read: ReturnType<typeof readFor>): read is MethodCountermeasure => "targetMethodId" in read;

function EffectList({ effects, locale, className }: { effects: Partial<Resources>; locale: Locale; className: string }) {
  return <div className={className} role="group" aria-label={translate(locale, "pressureForecast")}>{Object.keys(effects).length > 0 ? Object.entries(effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>) : <span className="neutral">{translateOpposition(locale, "noModifier")}</span>}</div>;
}

export function OppositionPanel({ stageId, readId, methodCounts, locale }: { stageId: string; readId: string; methodCounts: Record<string, number>; locale: Locale }) {
  const stage = stageFor(stageId);
  const read = readFor(readId);
  const counterEffects = isCountermeasure(read) ? read.effects : {};
  return <>
    <section className={`opposition-panel opposition-${stage.id}`} data-testid="opposition-posture" data-stage-id={stage.id} aria-label={translateOpposition(locale, "posture")}>
      <div className="opposition-identity"><span>{translateOpposition(locale, "posture")} · {translate(locale, "reconstruction")}</span><strong dir={contentDirection(stage.title, locale)}>{localize(opposition.title!, locale)} · {localize(stage.title, locale)}</strong></div>
      <p dir={contentDirection(stage.forecast, locale)}>{localize(stage.forecast, locale)}</p>
      <EffectList effects={stage.effects} locale={locale} className="opposition-effects" />
      <small><b>{translateOpposition(locale, "counterplay")}</b><span dir={contentDirection(stage.counterplay, locale)}>{localize(stage.counterplay, locale)}</span></small>
    </section>
    <section className={`method-read-panel method-read-${read.id}`} data-testid="method-read" data-read-id={read.id} aria-label={translateOpposition(locale, "methodRead")}>
      <div className="method-read-identity"><span>{translateOpposition(locale, "methodRead")} · {translate(locale, "reconstruction")}</span><strong dir={contentDirection(read.title, locale)}>{localize(opposition.methodRead.title, locale)} · {localize(read.title, locale)}</strong></div>
      <div className="method-read-counts" role="list" aria-label={translateOpposition(locale, "observed")}>{opposition.methods.map((method) => <span role="listitem" data-method-id={method.id} data-targeted={isCountermeasure(read) && read.targetMethodId === method.id ? "true" : "false"} key={method.id}><b>{methodCounts[method.id] ?? 0}</b><i dir={contentDirection(method.title, locale)}>{localize(method.title, locale)}</i></span>)}</div>
      <p dir={contentDirection(read.forecast, locale)}>{localize(read.forecast, locale)}</p>
      <EffectList effects={counterEffects} locale={locale} className="method-read-effects" />
      <small><b>{translateOpposition(locale, "counterplay")}</b><span dir={contentDirection(read.counterplay, locale)}>{localize(read.counterplay, locale)}</span></small>
    </section>
  </>;
}

export function ChoiceMethodForecast({ methodId, readId, locale }: { methodId: string; readId: string; locale: Locale }) {
  const method = methodFor(methodId);
  const read = readFor(readId);
  const matched = isCountermeasure(read) && read.targetMethodId === method.id;
  return <div className={`method-choice ${matched ? "is-read" : "is-unread"}`} data-method-id={method.id} data-read-hit={matched ? "true" : "false"} role="group" aria-label={`${translateOpposition(locale, "method")}: ${localize(method.title, locale)}`}>
    <span>{translateOpposition(locale, "method")} · <b dir={contentDirection(method.title, locale)}>{localize(method.title, locale)}</b></span>
    <p dir={contentDirection(method.reading, locale)}>{localize(method.reading, locale)}</p>
    <small><b>{translateOpposition(locale, matched ? "readHits" : "readMisses")}</b>{matched && isCountermeasure(read) ? Object.entries(read.effects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ") : translateOpposition(locale, "noModifier")}</small>
  </div>;
}

export function OppositionResolutionCopy({ stageId, locale }: { stageId: string; locale: Locale }) {
  const stage = stageFor(stageId);
  return <div className="opposition-reveal"><span>{translateOpposition(locale, "response")} · {localize(stage.title, locale)}</span><p dir={contentDirection(stage.response, locale)}>{localize(stage.response, locale)}</p></div>;
}

export function MethodReadResolutionCopy({ readId, methodId, matched, locale }: { readId: string; methodId: string; matched: boolean; locale: Locale }) {
  const read = readFor(readId);
  const method = methodFor(methodId);
  const response = isCountermeasure(read) ? (matched ? read.hitResponse : read.missResponse) : read.response;
  return <div className={`method-read-reveal ${matched ? "is-read" : "is-unread"}`}><span>{translateOpposition(locale, matched ? "readHits" : "readMisses")} · {localize(read.title, locale)}</span><p dir={contentDirection(response, locale)}>{localize(response, locale)} <i>· {localize(method.title, locale)}</i></p></div>;
}

export function OppositionResolutionDeltas({ effects, locale }: { effects: Partial<Resources>; locale: Locale }) {
  return <EffectList effects={effects} locale={locale} className="delta-list opposition-deltas" />;
}

export function MethodReadResolutionDeltas({ effects, locale }: { effects: Partial<Resources>; locale: Locale }) {
  return <EffectList effects={effects} locale={locale} className="delta-list method-read-deltas" />;
}

export function OppositionRecord({ stageId, effects, locale }: { stageId: string; effects: Partial<Resources>; locale: Locale }) {
  const stage = stageFor(stageId);
  return <p className="record-opposition"><b>{translateOpposition(locale, "response")}</b>{localize(stage.title, locale)} · {Object.keys(effects).length > 0 ? Object.entries(effects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ") : translateOpposition(locale, "noModifier")}</p>;
}

export function MethodReadRecord({ readId, methodId, matched, effects, locale }: { readId: string; methodId: string; matched: boolean; effects: Partial<Resources>; locale: Locale }) {
  const read = readFor(readId);
  const method = methodFor(methodId);
  return <p className={`record-method-read ${matched ? "is-read" : "is-unread"}`}><b>{translateOpposition(locale, matched ? "readHits" : "readMisses")}</b>{localize(read.title, locale)} · {localize(method.title, locale)} · {Object.keys(effects).length > 0 ? Object.entries(effects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ") : translateOpposition(locale, "noModifier")}</p>;
}
