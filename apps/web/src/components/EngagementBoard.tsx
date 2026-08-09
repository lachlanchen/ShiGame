import { useEffect, useMemo, useRef, useState } from "react";
import {
  availableEngagementCommands,
  createEngagementState,
  engagementMetricKeys,
  localize,
  resolveEngagementCommand,
  type EngagementDefinition,
  type EngagementMetricEffects,
  type EngagementState,
  type Locale,
  type LocalizedText,
  type ResourceKey,
} from "@shi/game-core";
import rawDefinition from "../generated/chapter-01-broken-crossing.v1.json";
import { translate } from "../i18n";
import { engagementMetricLabels, engagementOrderLabels, translateEngagement } from "../engagement-i18n";
import "./EngagementBoard.css";

const definition = rawDefinition as EngagementDefinition;
const contentDirection = (text: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !text.ar ? "ltr" : undefined;
const signed = (value: number): string => `${value > 0 ? "+" : ""}${value}`;

const metricEffects = (effects: EngagementMetricEffects, locale: Locale) => Object.entries(effects).map(([key, value]) => (
  <span className={`${(value ?? 0) < 0 ? "negative" : "positive"} ${key === "pursuitClosure" ? "risk" : ""}`} key={key}>
    {signed(value ?? 0)} {engagementMetricLabels[locale][key as keyof EngagementMetricEffects]}
  </span>
));

export function EngagementBoard({ planId, conditionId, locale, onCue, onClose }: {
  planId: string;
  conditionId: string;
  locale: Locale;
  onCue: (cue: "select" | "commit" | "ending") => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<EngagementState>(() => createEngagementState(definition, planId, conditionId));
  const boardRef = useRef<HTMLElement>(null);
  const plan = useMemo(() => definition.plans.find((candidate) => candidate.id === planId)!, [planId]);
  const condition = useMemo(() => definition.conditions.find((candidate) => candidate.id === conditionId)!, [conditionId]);
  const pulse = definition.pulses[state.pulseIndex];
  const commands = availableEngagementCommands(definition, state);
  const outcome = state.outcomeId ? definition.outcomes.find((candidate) => candidate.id === state.outcomeId) : undefined;
  const lastRecord = state.history.at(-1);
  const lastCommand = lastRecord ? definition.commands.find((candidate) => candidate.id === lastRecord.commandId) : undefined;
  const titleId = "engagement-board-title";

  useEffect(() => {
    if (state.history.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      boardRef.current?.querySelector<HTMLButtonElement>("[data-engagement-command], [data-testid='engagement-return']")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.history.length]);

  const issue = (commandId: string) => {
    const next = resolveEngagementCommand(definition, state, commandId);
    setState(next);
    onCue(next.completed ? "ending" : "commit");
  };

  return <aside
    ref={boardRef}
    className="drawer engagement-drawer"
    data-testid="engagement-board"
    data-engagement-id={state.engagementId}
    data-plan-id={state.planId}
    data-condition-id={state.conditionId}
    data-pulse-index={state.pulseIndex}
    data-completed={state.completed ? "true" : "false"}
    data-outcome-id={state.outcomeId ?? "none"}
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
  >
    <header className="drawer-head engagement-head">
      <div>
        <span className="eyebrow">{translateEngagement(locale, "commandBoard")}</span>
        <h2 id={titleId} dir={contentDirection(definition.title, locale)}>{localize(definition.title, locale)}</h2>
        <p className="engagement-status"><i aria-hidden="true" />{translateEngagement(locale, "referenceStatus")}</p>
      </div>
      <button className="icon-button" data-engagement-close autoFocus onClick={onClose} aria-label={translate(locale, "close")}>×</button>
    </header>

    <p className="engagement-boundary">{translateEngagement(locale, "boundary")}</p>

    <section className="engagement-briefing" aria-label={translateEngagement(locale, "objective")}>
      <div><span>{translateEngagement(locale, "plan")}</span><strong dir={contentDirection(plan.title, locale)}>{localize(plan.title, locale)}</strong><p dir={contentDirection(plan.mainEffort, locale)}>{localize(plan.mainEffort, locale)}</p></div>
      <div><span>{translateEngagement(locale, "condition")}</span><strong dir={contentDirection(condition.title, locale)}>{localize(condition.title, locale)}</strong><p dir={contentDirection(condition.signal, locale)}>{localize(condition.signal, locale)}</p></div>
      <div className="engagement-objective"><span>{translateEngagement(locale, "objective")}</span><p dir={contentDirection(definition.objective, locale)}>{localize(definition.objective, locale)}</p></div>
    </section>

    <section className="engagement-metrics" aria-label={translateEngagement(locale, "localState")}>
      <h3>{translateEngagement(locale, "localState")}</h3>
      <div>{engagementMetricKeys.map((key) => {
        const value = state.metrics[key];
        const risk = key === "pursuitClosure";
        return <div className={`engagement-metric ${risk ? "is-risk" : ""}`} key={key} data-metric={key} data-value={value}>
          <span>{engagementMetricLabels[locale][key]}</span><strong>{value}</strong>
          <i aria-hidden="true"><b style={{ inlineSize: `${value}%` }} /></i>
        </div>;
      })}</div>
    </section>

    {lastCommand && lastRecord && <section className="engagement-answer" data-testid="engagement-answer" aria-label={translateEngagement(locale, "fieldAnswer")} aria-live="polite">
      <span>{translateEngagement(locale, "fieldAnswer")}</span>
      <h3 dir={contentDirection(lastCommand.response.reveal, locale)}>{localize(lastCommand.response.reveal, locale)}</h3>
      <div className="engagement-effect-row">{metricEffects(lastCommand.response.effects, locale)}</div>
    </section>}

    {!state.completed && pulse ? <section className="engagement-pulse" aria-labelledby={`pulse-${pulse.id}`}>
      <div className="engagement-pulse-head">
        <div><span>{translateEngagement(locale, "pulse")} {state.pulseIndex + 1} / {definition.pulses.length}</span><h3 id={`pulse-${pulse.id}`} dir={contentDirection(pulse.title, locale)}>{localize(pulse.title, locale)}</h3></div>
        <p dir={contentDirection(pulse.objective, locale)}>{localize(pulse.objective, locale)}</p>
      </div>
      <p className="engagement-command-prompt">{translateEngagement(locale, "chooseCommand")}</p>
      <div className="engagement-command-grid">{commands.map((command) => <button
        type="button"
        data-engagement-command={command.id}
        data-order={command.order}
        key={command.id}
        onFocus={() => onCue("select")}
        onClick={() => issue(command.id)}
      >
        <span>{engagementOrderLabels[locale][command.order]}</span>
        <strong dir={contentDirection(command.title, locale)}>{localize(command.title, locale)}</strong>
        <p dir={contentDirection(command.intent, locale)}>{localize(command.intent, locale)}</p>
        <div className="engagement-effect-row">{metricEffects(command.effects, locale)}</div>
        <em>{translateEngagement(locale, "issueCommand")} →</em>
      </button>)}</div>
    </section> : outcome && <section className={`engagement-outcome outcome-${outcome.status}`} data-testid="engagement-outcome" aria-labelledby="engagement-outcome-title" aria-live="polite">
      <span>{translateEngagement(locale, "completed")}</span>
      <h3 id="engagement-outcome-title" dir={contentDirection(outcome.title, locale)}>{localize(outcome.title, locale)}</h3>
      <p dir={contentDirection(outcome.summary, locale)}>{localize(outcome.summary, locale)}</p>
      <div><strong>{translateEngagement(locale, "campaignPreview")}</strong><div className="engagement-effect-row">{Object.entries(state.campaignEffects ?? {}).map(([key, value]) => <span className={`${(value ?? 0) < 0 ? "negative" : "positive"} ${key === "danger" ? "risk" : ""}`} key={key}>{signed(value ?? 0)} {translate(locale, key as ResourceKey)}</span>)}</div></div>
      <button type="button" className="primary-button engagement-return" data-testid="engagement-return" onClick={onClose}>{translateEngagement(locale, "returnToCouncil")} <i aria-hidden="true">↩</i></button>
    </section>}

    {state.history.length > 0 && <section className="engagement-history" aria-label={translateEngagement(locale, "commandRecord")}>
      <h3>{translateEngagement(locale, "commandRecord")}</h3>
      <ol>{state.history.map((record, index) => {
        const command = definition.commands.find((candidate) => candidate.id === record.commandId)!;
        return <li key={record.commandId}><span>{String(index + 1).padStart(2, "0")}</span><div><strong dir={contentDirection(command.title, locale)}>{localize(command.title, locale)}</strong><p dir={contentDirection(command.response.reveal, locale)}>{localize(command.response.reveal, locale)}</p></div></li>;
      })}</ol>
    </section>}
  </aside>;
}
