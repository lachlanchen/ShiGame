import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { councilAnswers, councilCanChoose, councilEntry, councilMetricKeys, councilReadiness, createCouncil, localize, prepareFanyangEntry, resolveCouncil, restoreCouncil,
  type CouncilDefinition, type CouncilRecord, type CouncilState, type GameState, type Locale } from "@shi/game-core";
import data from "../generated/chen-council.v1.json";
import rawFingerprint from "../generated/chen-council.v1.sha256?raw";
import { flushPersistence, gameStorage } from "../persistence";
import { councilSnapshotMatchesRevision, encodeCouncilSnapshot } from "../council-snapshot";
import "./ChenCouncil.css";
import { FanyangScene } from "./FanyangScene";

const definition = data as CouncilDefinition;
const fingerprint = rawFingerprint.trim();
const key = "shi.chen-council.v1";

export function ChenCouncil({ origin, locale, reducedMotion, onClose, onCue, onSavingChange }: {
  origin: GameState; locale: Locale; reducedMotion: boolean; onClose: () => void; onCue: (cue: "select" | "commit" | "ending") => void;
  onSavingChange?: (saving: boolean) => void;
}) {
  const [entry] = useState(() => {
    const value = councilEntry(origin);
    if (!value) throw new Error("Complete Chapter I before entering Chen");
    return value;
  });
  const [{ initial, damaged }] = useState(() => {
    let initial = createCouncil(definition, entry), damaged = false;
    try {
      const raw = gameStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!councilSnapshotMatchesRevision(parsed, fingerprint)) damaged = true;
        else {
          const restored = restoreCouncil(definition, entry, parsed);
          if (restored) initial = restored;
          // A different completed chronicle starts a new interlude. A malformed
          // current save is preserved until the player explicitly restarts.
          else damaged = parsed?.entry?.id === entry.id || !parsed?.entry?.id;
        }
      }
    } catch { damaged = true; }
    return { initial, damaged };
  });
  const [state, setState] = useState(initial);
  const [invalid, setInvalid] = useState(damaged);
  const [selected, setSelected] = useState(0);
  // A saved final decision still has a character response to read. Reopening
  // may replay presentation, but must never replay the decision itself.
  const [reading, setReading] = useState(initial.history.length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showFanyang, setShowFanyang] = useState(false);
  const transaction = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const sceneHeading = useRef<HTMLHeadingElement>(null);
  const presented = useRef(false);
  const alive = useRef(true);
  const label = (name: string) => localize(definition.labels[name]!, locale);
  const text = (value: { en: string; "zh-Hans": string }) => localize(value, locale);
  const round = definition.rounds[state.history.length];
  const choice = round?.choices[selected] ?? round?.choices[0];
  const available = choice && councilCanChoose(state, choice);
  const preview = available && choice ? resolveCouncil(definition, state, choice.id) : null;
  const last = state.history.at(-1);
  const lastChoice = last ? definition.rounds[state.history.length - 1]!.choices.find(item => item.id === last.choiceId)! : null;
  const firstChoice = definition.rounds[0]!.choices.find(item => item.id === state.history[0]?.choiceId);
  const outcome = state.outcome ? definition.outcomes[state.outcome] : null;
  const readiness = councilReadiness(state.metrics);
  const arrival = definition.arrivals[entry.arrival];
  const savedChanges = (record: CouncilRecord) => <div className="chen-preview" role="list" aria-label={label("journal")} data-testid="council-saved-changes">
    {councilMetricKeys.map(metric => {
      const delta = record.after[metric] - record.before[metric];
      return <span role="listitem" key={metric} data-saved-metric={metric}>{text(definition.metrics[metric].title)} <b>{record.before[metric]} → {record.after[metric]}</b> ({delta > 0 ? "+" : ""}{delta})</span>;
    })}
  </div>;

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useLayoutEffect(() => {
    const target = presented.current || reading || confirmReset ? sceneHeading.current ?? heading.current : heading.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "instant" });
    presented.current = true;
  }, [state.history.length, reading, confirmReset, showFanyang]);

  const persist = async (next: CouncilState) => {
    if (transaction.current) return;
    transaction.current = true; onSavingChange?.(true); setBusy(true); setError(false);
    let previous: string | null = null;
    let wrote = false;
    try {
      previous = gameStorage.getItem(key);
      gameStorage.setItem(key, encodeCouncilSnapshot(next, fingerprint)); wrote = true;
      await flushPersistence();
      if (!alive.current) return;
      setState(next); setSelected(0); setReading(next.history.length > 0); setInvalid(false); setConfirmReset(false);
      onCue(next.completed ? "ending" : "commit");
    } catch {
      if (wrote) {
        try {
          if (previous === null) gameStorage.removeItem(key); else gameStorage.setItem(key, previous);
          await flushPersistence();
        } catch { /* keep the original error visible; never announce success */ }
      }
      if (alive.current) setError(true);
    } finally {
      transaction.current = false;
      onSavingChange?.(false);
      if (alive.current) setBusy(false);
    }
  };

  const continuation = !invalid && state.completed
    ? prepareFanyangEntry(definition, origin, { ...state, definitionSHA256: fingerprint }, fingerprint) : null;
  if (showFanyang && continuation) return <FanyangScene entry={continuation} locale={locale} reducedMotion={reducedMotion}
    onCue={onCue} onClose={() => setShowFanyang(false)} onSavingChange={onSavingChange} />;

  return <aside className="drawer chen-council" data-testid="chen-council" data-round={state.history.length}
    data-arrival={entry.arrival} data-reading={reading} data-completed={state.completed} data-motion={reducedMotion ? "reduced" : "full"}
    role="dialog" aria-modal="true" aria-labelledby="chen-title" dir="ltr" lang={locale === "zh-Hans" ? "zh-Hans" : "en"}
    onKeyDown={event => {
      // Do not let global map/record shortcuts replace an active council.
      if (event.altKey || event.key === "Escape") event.stopPropagation();
      if (event.key === "Escape" && !transaction.current) onClose();
    }}>
    <header className="chen-header">
      <div><p className="eyebrow">{label("interlude")} · 209 BCE</p><h2 id="chen-title" ref={heading} tabIndex={-1}>{text(definition.title)}</h2></div>
      <button className="icon-button" data-council-action="close" disabled={busy} onClick={onClose} aria-label={label("close")}>×</button>
    </header>
    <p className="chen-boundary">{text(definition.boundary)}</p>
    <ol className="chen-progress" aria-label={label("round")}>{definition.rounds.map((item, index) => <li key={item.id} aria-current={!reading && index === state.history.length ? "step" : undefined} className={index < state.history.length ? "done" : ""}><span>{index < state.history.length ? "✓" : `0${index + 1}`}</span>{text(item.title)}</li>)}</ol>
    <p className="chen-objective">{text(definition.objective)}</p>
    <div className="chen-layout">
      <section className="chen-main">
        {invalid && <p role="alert" className="chen-error">{label("invalidSave")}</p>}
        {error && <p role="alert" className="chen-error">{label("saveError")}</p>}
        {confirmReset ? <section className="chen-scene">
          <h3 ref={sceneHeading} tabIndex={-1}>{label("confirmRetry")}</h3>
          <div className="chen-actions"><button className="primary-button" data-council-action="reset" disabled={busy} onClick={() => void persist(createCouncil(definition, entry))}>{label("reset")}</button>
            <button className="text-button" data-council-action="cancel" disabled={busy} onClick={() => setConfirmReset(false)}>{label("cancel")}</button></div>
        </section> : reading && lastChoice ? <section className="chen-scene" key={`answer-${state.history.length}`} data-testid="council-response" aria-live="polite">
          <p className="eyebrow">{label("response")}</p><h3 ref={sceneHeading} tabIndex={-1}>{text(lastChoice.title)}</h3><p className="chen-prose">{text(lastChoice.response)}</p>
          {councilAnswers(state, lastChoice).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{text(answer.text)}</p>)}
          {last && savedChanges(last)}
          <button className="primary-button" data-council-action="continue" data-testid="council-continue" onClick={() => setReading(false)}>{label(state.completed ? "conclude" : "continue")} →</button>
        </section> : outcome ? <section className="chen-scene" data-testid="council-outcome" data-outcome={state.outcome} aria-live="polite">
          <p className="eyebrow">{label("round")} · 3 / 3</p><h3 ref={sceneHeading} tabIndex={-1}>{text(outcome.title)}</h3><p className="chen-prose">{text(outcome.text)}</p>
          <section data-testid="council-readiness" aria-labelledby="chen-readiness-title">
            <h4 id="chen-readiness-title">{text({ en: "What a common front needs", "zh-Hans": "共同出兵的条件" })}</h4>
            <ul>{readiness.checks.map(check => <li key={check.id} data-requirement={check.id} data-met={check.met}>
              <span aria-hidden="true">{check.met ? "✓" : "—"} </span>
              {check.id === "support" ? text({ en: "Groups with at least 6 support", "zh-Hans": "支持达到6的群体" }) : text(definition.metrics[check.id].title)}: {check.value} {check.met ? "≥" : "<"} {check.required}
            </li>)}</ul>
            <ul>{(["city", "allies", "veterans"] as const).map(metric => <li key={metric}>
              {text(definition.metrics[metric].title)}: {state.metrics[metric]} {readiness.supporters.includes(metric) ? "≥" : "<"} 6
            </li>)}</ul>
          </section>
          {continuation && <button className="primary-button" data-council-action="continue" data-testid="fanyang-enter" onClick={() => setShowFanyang(true)}>{text({ en: "Continue north: the gate at Fan Yang", "zh-Hans": "继续北行：范阳城门" })} →</button>}
          <div className="chen-actions"><button className="primary-button" data-council-action="close" onClick={onClose}>{label("close")}</button><button className="text-button" data-council-action="retry" onClick={() => setConfirmReset(true)}>{label("retry")}</button></div>
        </section> : round && choice ? <section className="chen-scene" key={round.id}>
          <p className="eyebrow">{label("round")} · {state.history.length + 1} / 3</p><h3 ref={sceneHeading} tabIndex={-1}>{text(round.title)}</h3>
          {state.history.length === 0 && <p className="chen-prose">{text(definition.introduction)}</p>}
          <p className="chen-prose">{text(round.context)}</p>
          <div className="chen-offers" aria-label={label("inspect")}>{round.choices.map((item, index) => <button key={item.id} data-council-action="offer" data-council-choice={item.id} aria-pressed={choice.id === item.id}
            disabled={busy || invalid} onClick={() => { setSelected(index); onCue("select"); }}><span>{String.fromCharCode(65 + index)}</span>{text(item.title)}{!councilCanChoose(state, item) && <small>{label("need")} {Object.entries(item.requires ?? {}).map(([k, v]) => `${text(definition.metrics[k as keyof typeof definition.metrics].title)} ${v}`).join(" · ")}</small>}</button>)}</div>
          <section className="chen-offer-detail" aria-live="polite"><h4>{text(choice.title)}</h4><p>{text(choice.intent)}</p>
            {choice.pledge && <p className="chen-promise-answer">{label("pledge")}: {text(choice.pledge)}</p>}
            {councilAnswers(state, choice).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{label("memory")}: {text(answer.text)}</p>)}
            {preview && <div className="chen-preview" aria-label={label("preview")}>{councilMetricKeys.map(metric => {
              const delta = preview.metrics[metric] - state.metrics[metric];
              return <span key={metric}>{text(definition.metrics[metric].title)} <b>{state.metrics[metric]} → {preview.metrics[metric]}</b> ({delta > 0 ? "+" : ""}{delta})</span>;
            })}</div>}
            {preview?.completed && preview.outcome && <p className="chen-promise-answer" data-testid="council-outcome-preview" data-outcome={preview.outcome}>
              {label("preview")}: <strong>{text(definition.outcomes[preview.outcome].title)}</strong>
            </p>}
            <button className="primary-button" data-council-action="commit" data-testid="council-commit" disabled={!available || busy || invalid} onClick={() => { if (choice && !invalid) void persist(resolveCouncil(definition, state, choice.id)); }}>{label(busy ? "saving" : "commit")} →</button>
          </section>
        </section> : null}
      </section>
      <aside className="chen-position" aria-label={label("arrival")}>
        <p className="eyebrow">{label("arrival")}</p><h3>{text(arrival.title)}</h3><p>{text(arrival.text)}</p>
        <ul className="chen-metrics">{councilMetricKeys.map(metric => <li key={metric} data-council-metric={metric} data-value={state.metrics[metric]}><span>{text(definition.metrics[metric].title)}</span><span className="chen-value">{state.metrics[metric]} / 10</span>
          <div className="chen-meter" aria-hidden="true"><i style={{ inlineSize: `${state.metrics[metric] * 10}%` }} /></div><small>{text(definition.metrics[metric].meaning)}</small></li>)}</ul>
        {firstChoice?.pledge && <section className="chen-promise"><h4>{label("pledge")}</h4><p>{text(firstChoice.pledge)}</p></section>}
      </aside>
    </div>
    <details className="chen-history"><summary>{label("history")}</summary><h3>{text(definition.history.title)}</h3><p>{text(definition.history.account)}</p><p>{text(definition.history.distinction)}</p>
      <ul>{definition.history.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.locator}</p></li>)}</ul></details>
    {state.history.length > 0 && <details className="chen-history"><summary>{label("journal")}</summary><ol>{state.history.map((record, index) => {
      const past = definition.rounds[index]!.choices.find(item => item.id === record.choiceId)!;
      const before = { ...state, history: state.history.slice(0, index) };
      return <li key={record.choiceId}><h4>{text(past.title)}</h4><p>{text(past.response)}</p>
        {councilAnswers(before, past).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{text(answer.text)}</p>)}
        {savedChanges(record)}
      </li>;
    })}</ol></details>}
    {!confirmReset && (invalid || state.history.length > 0) && <button className="text-button chen-restart" data-council-action="retry" disabled={busy} onClick={() => setConfirmReset(true)}>{label("retry")}</button>}
  </aside>;
}
