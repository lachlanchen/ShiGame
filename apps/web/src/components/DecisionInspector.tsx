import { localize, type Choice, type Locale, type LocalizedText, type ResourceKey } from "@shi/game-core";
import { translateDecision } from "../decision-i18n";
import { translateEngagement } from "../engagement-i18n";
import { translate } from "../i18n";
import { CommitmentEstablishForecast, CommitmentForecast } from "./CommitmentLayer";
import { ChoiceMethodForecast } from "./OppositionLayer";
import "./DecisionInspector.css";

const effectLabel = (key: ResourceKey, value: number, locale: Locale) => `${value > 0 ? "+" : ""}${value} ${translate(locale, key)}`;
const contentDirection = (text: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !text.ar ? "ltr" : undefined;

export function DecisionInspector({
  choice,
  choiceIndex,
  locale,
  readId,
  establishedCommitmentId,
  establishingStakeholder,
  activeCommitmentId,
  commitmentOutcomeId,
  enabled,
  onOpenCommandBoard,
  onCommit,
}: {
  choice: Choice;
  choiceIndex: number;
  locale: Locale;
  readId: string;
  establishedCommitmentId?: string;
  establishingStakeholder?: LocalizedText;
  activeCommitmentId?: string;
  commitmentOutcomeId?: string;
  enabled: boolean;
  onOpenCommandBoard?: () => void;
  onCommit: () => void;
}) {
  const titleId = `selected-order-${choice.id}`;
  return <section className="decision-inspector" data-testid="decision-inspector" data-selected-choice={choice.id} aria-labelledby={titleId}>
    <header className="decision-inspector-head">
      <span className="decision-seal" aria-hidden="true">{String.fromCharCode(65 + choiceIndex)}</span>
      <div>
        <p>{translateDecision(locale, "selectedOrder")}</p>
        <h2 id={titleId} dir={contentDirection(choice.label, locale)}>{localize(choice.label, locale)}</h2>
        <span dir={contentDirection(choice.intent, locale)}>{localize(choice.intent, locale)}</span>
      </div>
    </header>
    <div className="decision-inspector-grid">
      <div className="decision-principle">
        <span>{translate(locale, "principle")}</span>
        <p dir={contentDirection(choice.strategy, locale)}>{localize(choice.strategy, locale)}</p>
      </div>
      {establishedCommitmentId && establishingStakeholder && <CommitmentEstablishForecast commitmentId={establishedCommitmentId} stakeholder={establishingStakeholder} locale={locale} />}
      {activeCommitmentId && commitmentOutcomeId && <CommitmentForecast commitmentId={activeCommitmentId} outcomeId={commitmentOutcomeId} locale={locale} />}
      <ChoiceMethodForecast methodId={choice.methodId} readId={readId} locale={locale} />
      {choice.pressure && <div className={`pressure-warning pressure-${choice.pressure.kind}`}><span>{translate(locale, "pressureForecast")}</span><p dir={contentDirection(choice.pressure.warning, locale)}>{localize(choice.pressure.warning, locale)}</p></div>}
    </div>
    <footer className="decision-confirmation">
      <div>
        <div className="effects" role="group" aria-label={translate(locale, "strategicState")}>{Object.entries(choice.effects).map(([key, value]) => <span className={`${(value ?? 0) < 0 ? "negative" : "positive"} ${key === "danger" ? "risk" : ""}`} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>
        <small>{translateDecision(locale, "reviewHint")}</small>
        {onOpenCommandBoard && <button type="button" className="open-command-board" data-testid="open-command-board" onClick={onOpenCommandBoard}>{translateEngagement(locale, "openBoard")} <i aria-hidden="true">◎</i></button>}
      </div>
      <button type="button" className="issue-order-button" data-testid="commit-selected" onClick={onCommit} disabled={!enabled} aria-label={`${translateDecision(locale, "issueOrder")}: ${localize(choice.label, locale)}`}>
        <span>{translateDecision(locale, "issueOrder")}</span><strong dir={contentDirection(choice.label, locale)}>{localize(choice.label, locale)}</strong><i aria-hidden="true">→</i>
      </button>
    </footer>
  </section>;
}
