import { localize, type CommitmentOutcome, type CommitmentStatus, type Locale, type LocalizedText, type PlayerCommitment, type ResourceKey, type Resources } from "@shi/game-core";
import commitmentsJson from "../generated/chapter-01-commitments.json";
import { translateCommitment } from "../commitment-i18n";
import { translate } from "../i18n";

const commitments = commitmentsJson as unknown as PlayerCommitment[];
const commitmentFor = (commitmentId: string): PlayerCommitment => commitments.find((candidate) => candidate.id === commitmentId) ?? (() => { throw new Error(`Commitment presentation is incomplete for ${commitmentId}.`); })();
const outcomeFor = (commitment: PlayerCommitment, outcomeId: string): CommitmentOutcome => commitment.outcomes.find((candidate) => candidate.id === outcomeId) ?? (() => { throw new Error(`Commitment outcome presentation is incomplete for ${outcomeId}.`); })();
const contentDirection = (value: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !value.ar ? "ltr" : undefined;
const effectLabel = (key: ResourceKey, value: number, locale: Locale) => `${value > 0 ? "+" : ""}${value} ${translate(locale, key)}`;

function CommitmentEffects({ effects, locale, className }: { effects: Partial<Resources>; locale: Locale; className: string }) {
  return <div className={className} role="group" aria-label={translateCommitment(locale, "effects")}>{Object.entries(effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>;
}

export function CommitmentEstablishForecast({ commitmentId, stakeholder, locale }: { commitmentId: string; stakeholder: LocalizedText; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  return <div className="commitment-establish" data-testid={`commitment-establish-${commitment.id}`} data-commitment-id={commitment.id} role="group" aria-label={translateCommitment(locale, "establishes")}>
    <span>{translateCommitment(locale, "establishes")} · {translate(locale, "reconstruction")}</span>
    <strong dir={contentDirection(commitment.title, locale)}>{localize(commitment.title, locale)}</strong>
    <p dir={contentDirection(commitment.promise, locale)}>{localize(commitment.promise, locale)}</p>
    <small><b>{translateCommitment(locale, "stakeholder")}</b><span dir={contentDirection(stakeholder, locale)}>{localize(stakeholder, locale)}</span></small>
  </div>;
}

export function CommitmentPanel({ commitmentId, stakeholder, locale }: { commitmentId: string; stakeholder: LocalizedText; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  return <section className="commitment-panel" data-testid="commitment-panel" data-commitment-id={commitment.id} aria-label={translateCommitment(locale, "carried")}>
    <div className="commitment-identity"><span>{translateCommitment(locale, "carried")} · {translate(locale, "reconstruction")}</span><strong dir={contentDirection(commitment.title, locale)}>{localize(commitment.title, locale)}</strong></div>
    <p dir={contentDirection(commitment.promise, locale)}>{localize(commitment.promise, locale)}</p>
    <small><b>{translateCommitment(locale, "stakeholder")}</b><span dir={contentDirection(stakeholder, locale)}>{localize(stakeholder, locale)}</span></small>
  </section>;
}

export function CommitmentForecast({ commitmentId, outcomeId, locale }: { commitmentId: string; outcomeId: string; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  const outcome = outcomeFor(commitment, outcomeId);
  return <div className={`commitment-forecast commitment-${outcome.status}`} data-commitment-id={commitment.id} data-commitment-outcome={outcome.id} data-commitment-status={outcome.status} role="group" aria-label={`${translateCommitment(locale, "answer")}: ${translateCommitment(locale, outcome.status)}`}>
    <span>{translateCommitment(locale, "answer")} · <b>{translateCommitment(locale, outcome.status)}</b></span>
    <p dir={contentDirection(outcome.forecast, locale)}>{localize(outcome.forecast, locale)}</p>
    <CommitmentEffects effects={outcome.effects} locale={locale} className="commitment-forecast-effects" />
  </div>;
}

export function CommitmentResolutionCopy({ commitmentId, outcomeId, stakeholder, locale }: { commitmentId: string; outcomeId: string; stakeholder: LocalizedText; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  const outcome = outcomeFor(commitment, outcomeId);
  return <div className={`commitment-reveal commitment-${outcome.status}`} data-testid="commitment-resolution" data-commitment-status={outcome.status}>
    <span>{translateCommitment(locale, "answer")} · {translateCommitment(locale, outcome.status)}</span>
    <p dir={contentDirection(outcome.response, locale)}>{localize(outcome.response, locale)} <i dir={contentDirection(stakeholder, locale)}>· {localize(stakeholder, locale)}</i></p>
  </div>;
}

export function CommitmentResolutionDeltas({ effects, locale }: { effects: Partial<Resources>; locale: Locale }) {
  return <CommitmentEffects effects={effects} locale={locale} className="delta-list commitment-deltas" />;
}

export function CommitmentRecord({ commitmentId, outcomeId, effects, locale }: { commitmentId: string; outcomeId: string; effects: Partial<Resources>; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  const outcome = outcomeFor(commitment, outcomeId);
  return <p className={`record-commitment commitment-${outcome.status}`}><b>{translateCommitment(locale, "answer")} · {translateCommitment(locale, outcome.status)}</b>{localize(commitment.title, locale)} · {Object.entries(effects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ")}</p>;
}

export function CommitmentEndingSummary({ commitmentId, outcomeId, locale }: { commitmentId: string; outcomeId: string; locale: Locale }) {
  const commitment = commitmentFor(commitmentId);
  const outcome = outcomeFor(commitment, outcomeId);
  return <p className={`commitment-ending commitment-${outcome.status}`} data-testid="commitment-ending" data-commitment-status={outcome.status}><b>{translateCommitment(locale, "chapterAnswer")} · {translateCommitment(locale, outcome.status)}</b><span>{localize(commitment.title, locale)}</span></p>;
}
