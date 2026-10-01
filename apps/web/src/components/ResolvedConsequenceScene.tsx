import { localize, type Campaign, type ChoiceResolution, type Locale, type LocalizedText, type ResourceKey } from "@shi/game-core";
import { translate } from "../i18n";
import { translateOpposition } from "../opposition-i18n";
import { translateCommitment } from "../commitment-i18n";
import { ConsequenceScene } from "./ConsequenceScene";
import { CommitmentResolutionCopy, CommitmentResolutionDeltas } from "./CommitmentLayer";
import { MethodReadResolutionCopy, MethodReadResolutionDeltas, OppositionResolutionCopy, OppositionResolutionDeltas } from "./OppositionLayer";

export function ResolvedConsequenceScene({ campaign, resolution, locale, reducedMotion, onContinue, saveError, titleOverride }: {
  campaign: Campaign; resolution: ChoiceResolution; locale: Locale; reducedMotion: boolean; onContinue: () => void | boolean;
  saveError?: string;
  titleOverride?: LocalizedText;
}) {
  const direction = (text: LocalizedText) => locale === "ar" && !text.ar ? "ltr" as const : undefined;
  const personalCrossing = resolution.commitment?.outcome.id.startsWith("crossing-v2-") === true;
  const promiseReaction = resolution.commitment && <CommitmentResolutionCopy commitmentId={resolution.commitment.commitment.id} outcomeId={resolution.commitment.outcome.id} outcomeOverride={resolution.commitment.outcome} stakeholder={campaign.characters.find((character) => character.id === resolution.commitment!.commitment.stakeholderId)!.name} locale={locale} />;
  const deltas = (effects: ChoiceResolution["deltas"], className: string) => (
    <div className={`delta-list ${className}`}>{Object.entries(effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{`${value > 0 ? "+" : ""}${value} ${translate(locale, key as ResourceKey)}`}</span>)}</div>
  );
  return (
    <ConsequenceScene locale={locale} title={localize(titleOverride ?? resolution.choice.label, locale)} titleDirection={direction(titleOverride ?? resolution.choice.label)}
      consequence={localize(resolution.choice.consequence, locale)} textDirection={direction(resolution.choice.consequence)}
      reducedMotion={reducedMotion} onContinue={onContinue} saveError={saveError} characterReaction={personalCrossing ? promiseReaction : undefined}>
      <div className="resolution-copy">
        {!personalCrossing && promiseReaction}
        {resolution.choice.pressure && <div className="pressure-reveal"><span>{translate(locale, "pressureResponse")}</span><p dir={direction(resolution.choice.pressure.reveal)}>{localize(resolution.choice.pressure.reveal, locale)}</p></div>}
        {resolution.oppositionStage && <OppositionResolutionCopy stageId={resolution.oppositionStage.id} locale={locale} />}
        {resolution.methodRead && <MethodReadResolutionCopy readId={resolution.methodRead.read.id} methodId={resolution.method.id} matched={resolution.methodReadMatched} locale={locale} />}
        <div className="field-reveal"><span>{translate(locale, "fieldApplied")}</span><p dir={direction(resolution.condition.title)}>{localize(resolution.condition.title, locale)}</p></div>
      </div>
      <div className="resolution-deltas">
        <section className="consequence-delta-layer"><h3 dir={direction(resolution.choice.label)}>{localize(resolution.choice.label, locale)}</h3>{deltas(resolution.playerDeltas, "action-deltas")}</section>
        {resolution.commitment && <section className="consequence-delta-layer"><h3>{translateCommitment(locale, "answer")}</h3><CommitmentResolutionDeltas effects={resolution.commitmentDeltas} locale={locale} /></section>}
        {Object.keys(resolution.pressureDeltas).length > 0 && <section className="consequence-delta-layer"><h3>{translate(locale, "pressureResponse")}</h3>{deltas(resolution.pressureDeltas, "pressure-deltas")}</section>}
        <section className="consequence-delta-layer"><h3>{translateOpposition(locale, "response")}</h3><OppositionResolutionDeltas effects={resolution.oppositionDeltas} locale={locale} /></section>
        <section className="consequence-delta-layer"><h3>{translateOpposition(locale, "methodRead")}</h3><MethodReadResolutionDeltas effects={resolution.methodReadDeltas} locale={locale} /></section>
        {Object.keys(resolution.fieldDeltas).length > 0 && <section className="consequence-delta-layer"><h3>{translate(locale, "fieldApplied")}</h3>{deltas(resolution.fieldDeltas, "field-deltas")}</section>}
      </div>
    </ConsequenceScene>
  );
}
