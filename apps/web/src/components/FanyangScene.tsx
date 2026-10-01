import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ViewpointIntro } from "./ViewpointIntro";
import { createFanyang, encodeFanyangSnapshot, fanyangAnswers, fanyangCanChoose, fanyangGateChecks,
  fanyangMetricKeys, fanyangProspects, localize, resolveFanyang, restoreFanyang,
  type FanyangDefinition, type FanyangEntry, type FanyangState, type Locale, type LocalizedText } from "@shi/game-core";
import raw from "../../../../content/councils/fanyang-guarantee.v1.json";
import review from "../../../../content/research/fanyang-entry-review.v1.json";
import { flushPersistence, gameStorage } from "../persistence";
import "./ChenCouncil.css";
import { cinemaLabel } from "../cinema-labels";
const definition = raw as FanyangDefinition, fingerprint = review.contentSHA256;

export function FanyangScene({ entry, locale, reducedMotion, onClose, onCue, onSavingChange, onContinue, saveNamespace }: {
  entry: FanyangEntry; locale: Locale; reducedMotion: boolean; onClose: () => void;
  onCue: (cue: "select" | "commit" | "ending") => void; onSavingChange?: (saving: boolean) => void;
  onContinue?: (snapshot: string) => void;
  saveNamespace?: string;
}) {
  const key = saveNamespace ? `${saveNamespace}.fanyang-guarantee.v1` : "shi.fanyang-guarantee.v1";
  const [{ initial, damaged }] = useState(() => {
    const initial = createFanyang(definition, entry);
    try {
      const saved = gameStorage.getItem(key);
      if (!saved) return { initial, damaged: false };
      const restored = restoreFanyang(definition, entry, JSON.parse(saved), fingerprint);
      return { initial: restored ?? initial, damaged: !restored };
    } catch { return { initial, damaged: true }; }
  });
  const [state, setState] = useState(initial), [invalid, setInvalid] = useState(damaged);
  const [selected, setSelected] = useState(0), [reading, setReading] = useState(initial.history.length > 0);
  const [reset, setReset] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  const text = (value: LocalizedText) => localize(value, locale);
  const say = (en: string, zh: string) => text({ en, "zh-Hans": zh });
  const round = definition.rounds[state.history.length], choice = round?.choices[selected] ?? round?.choices[0];
  const preview = choice && fanyangCanChoose(definition, state, choice) ? resolveFanyang(definition, state, choice.id) : null;
  const last = state.history.at(-1), lastChoice = last && definition.rounds[state.history.length - 1]!.choices.find(item => item.id === last.choiceId);
  const outcome = state.outcome && definition.outcomes[state.outcome];
  const prospects = preview ? fanyangProspects(definition, preview) : [];
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [state.history.length, reading, reset]);
  const persist = async (next: FanyangState) => {
    if (transaction.current) return;
    transaction.current = true; setBusy(true); setError(false); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      previous = gameStorage.getItem(key);
      gameStorage.setItem(key, encodeFanyangSnapshot(next, fingerprint)); wrote = true;
      await flushPersistence();
      if (!alive.current) return;
      setState(next); setSelected(0); setReading(next.history.length > 0); setReset(false); setInvalid(false);
      onCue(next.completed ? "ending" : "commit");
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(key); else gameStorage.setItem(key, previous);
        await flushPersistence();
      } catch { /* Do not announce success after a failed rollback. */ }
      if (alive.current) setError(true);
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  const changes = (before: FanyangState["metrics"], after: FanyangState["metrics"]) => <div className="chen-preview">
    {fanyangMetricKeys.map(metric => <span key={metric}>{text(definition.metrics[metric])} <b>{before[metric]} → {after[metric]}</b></span>)}</div>;
  return <div className="drawer chen-council" data-testid="fanyang-scene" data-motion={reducedMotion ? "reduced" : "full"}
    role="dialog" aria-modal="true" aria-labelledby="fanyang-title" dir="ltr" lang={locale === "zh-Hans" ? "zh-Hans" : "en"}
    onKeyDown={event => { if (event.altKey || event.key === "Escape") event.stopPropagation(); if (event.key === "Escape" && !transaction.current) onClose(); }}>
    <header className="chen-header"><h2 id="fanyang-title">{text(definition.title)}</h2><button className="icon-button" data-council-action="close" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }} aria-label={say("Return to Chen", "返回陈县议事")}>×</button></header>
    <p className="chen-boundary">{text(definition.boundary)}</p>
    {invalid && <p className="chen-error" role="alert">{say("This save is damaged, belongs to another council, or uses different content. It is preserved. Explicitly restart this scene to replace it; Chen is unchanged.", "存档损坏、属于另一场议事，或内容版本不同。原存档已保留，只有明确重开本场景才会替换；陈县存档不变。")}</p>}
    {error && <p className="chen-error" role="alert">{say("Could not save. The order is not confirmed. Retry when storage is available.", "未能保存，命令尚未确认。存储恢复后请重试。")}</p>}
    <div className={`chen-layout${reading && !reset ? " chen-reading-layout" : ""}`}><section className="chen-main">
      {reset ? <section className="chen-scene"><h3 ref={heading} tabIndex={-1}>{say("Replace this Fan Yang save? Chen will remain unchanged.", "替换范阳存档？陈县议事不会改变。")}</h3>
        <button className="primary-button" data-council-action="reset" disabled={busy} onClick={() => void persist(createFanyang(definition, entry))}>{say("Restart Fan Yang", "重开范阳")}</button>
        <button className="text-button" data-council-action="cancel" disabled={busy} onClick={() => setReset(false)}>{say("Cancel", "取消")}</button></section>
      : reading && lastChoice && last ? <section className="chen-scene chen-response" data-testid="fanyang-response" aria-live="polite"><h3 ref={heading} tabIndex={-1}>{text(lastChoice.title)}</h3><p className="chen-prose">{text(lastChoice.response)}</p>
        {fanyangAnswers(state, lastChoice).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{text(answer.text)}</p>)}
        <details className="chen-history" data-testid="fanyang-response-changes"><summary>{cinemaLabel(locale, "changes")}</summary>{changes(last.before, last.after)}</details>
        <button className="primary-button" data-council-action="continue" onClick={() => setReading(false)}>{say("Continue", "继续")} →</button></section>
      : outcome ? <section className="chen-scene" data-testid="fanyang-outcome" data-outcome={state.outcome} aria-live="polite"><h3 ref={heading} tabIndex={-1}>{text(outcome.title)}</h3><p className="chen-prose">{text(outcome.text)}</p>
        <p>{onContinue ? say("Your decisions are saved. A Chinese-only development preview continues the story in Chen; it is not release-approved.", "选择已保存。可进入陈地后续的中文开发试玩，尚未通过发行审核。") : say("This development episode ends here. Your decisions are saved; the next episode is not available yet.", "本开发篇章到此结束。选择已保存，下一篇尚未开放。")}</p>
        {onContinue && <button className="primary-button" data-council-action="continue" data-testid="retreat-enter" onClick={() => onContinue(encodeFanyangSnapshot(state, fingerprint))}>{say("Continue in Chen · development preview", "回到陈地 · 开发试玩")} →</button>}
        <button className="primary-button" data-council-action="close" onClick={onClose}>{say("Return to Chen", "返回陈县议事")}</button></section>
      : round && choice ? <section className="chen-scene"><p className="eyebrow">{state.history.length + 1} / {definition.rounds.length}</p><h3 ref={heading} tabIndex={-1}>{text(round.title)}</h3>
        {state.history.length === 0 && <><ViewpointIntro scene="fanyang" locale={locale} /><p className="chen-prose">{text(definition.introduction)}</p></>}<p className="chen-prose">{text(round.context)}</p>
        <div className="chen-offers">{round.choices.map((item, index) => <button key={item.id} data-council-action="offer" data-council-choice={item.id} data-fanyang-choice={item.id} aria-pressed={item.id === choice.id} disabled={busy || invalid} onClick={() => { setSelected(index); onCue("select"); }}><span>{String.fromCharCode(65 + index)}</span>{text(item.title)}{!fanyangCanChoose(definition, state, item) && <small>{say("Unavailable: requirements not met", "暂不可用：条件未满足")}</small>}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h4>{text(choice.title)}</h4><p>{text(choice.intent)}</p>
          {choice.requires && <p>{say("Requires", "需要")}: {fanyangMetricKeys.filter(metric => choice.requires?.[metric] !== undefined).map(metric => `${text(definition.metrics[metric])} ≥ ${choice.requires![metric]}`).join(" · ")}</p>}
          {choice.gateRequired && <p>{say("Requires every gate condition listed alongside this scene.", "需要满足本场景列出的全部开城条件。")}</p>}
          {fanyangAnswers(state, choice).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{text(answer.text)}</p>)}{preview && changes(state.metrics, preview.metrics)}
          {preview?.outcome && <p data-testid="fanyang-preview" data-outcome={preview.outcome}>{say("Expected outcome", "预计结果")}: {text(definition.outcomes[preview.outcome].title)}</p>}
          {preview && !preview.completed && <details className="chen-history" data-testid="fanyang-prospects"><summary>{say("What remains possible after this order?", "此令之后，还有哪些可能？")}</summary>
            <p>{prospects.includes("opened")
              ? say("At least one legal sequence can still secure surrender. Later choices and their costs matter; this order alone does not open the gate.", "至少还有一条可行路线能够受降。后续选择与代价仍然重要，此令本身并不能开城。")
              : say("No remaining sequence in this episode can secure surrender from this position. Do not spend reserves expecting to repair every shortfall; an orderly withdrawal remains possible.", "按当前局势，本篇余下的选择已无法达成受降。不要以为再付出余粮就能补齐所有缺口；仍可有序退使。")}</p>
            <p>{say("This checks the disclosed rules of this scene, not historical inevitability or the outcome of a future episode.", "这只检查本场景公开的规则，不代表历史必然，也不预判下一篇的结果。")}</p>
          </details>}
          <button className="primary-button" data-council-action="commit" data-testid="fanyang-commit" disabled={!preview || invalid || busy} onClick={() => { if (choice && !invalid) void persist(resolveFanyang(definition, state, choice.id)); }}>{say(busy ? "Saving…" : "Confirm order", busy ? "保存中…" : "确认命令")} →</button>
        </section></section> : null}
    </section>{(!reading || reset) && <aside className="chen-position" aria-label={say("Position and gate conditions", "局势与开城条件")}><h3>{say("Your position", "当前局势")}</h3>
      <ul className="chen-metrics">{fanyangMetricKeys.map(metric => <li key={metric}><span>{text(definition.metrics[metric])}</span><span>{state.metrics[metric]} / 10</span></li>)}</ul>
      <h3>{say("Conditions for surrender", "受降条件")}</h3><ul>{fanyangGateChecks(definition, state).map(check => <li key={check.key}>{check.met ? "✓" : "—"} {text(definition.metrics[check.key])}: {check.value} {check.met ? "≥" : "<"} {check.required}</li>)}</ul></aside>}</div>
    {state.history.length > 0 && <details className="chen-history" data-testid="fanyang-journal"><summary>{say("Your decisions at Fan Yang", "范阳决策记录")}</summary><ol>
      {state.history.map((turn, index) => {
        const past = definition.rounds[index]!.choices.find(item => item.id === turn.choiceId)!;
        const before = { ...state, history: state.history.slice(0, index) };
        return <li key={turn.choiceId}><h3>{text(past.title)}</h3><p>{text(past.response)}</p>
          {fanyangAnswers(before, past).map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{text(answer.text)}</p>)}
          {changes(turn.before, turn.after)}</li>;
      })}
    </ol></details>}
    {!reset && <button className="text-button" data-council-action="retry" disabled={busy} onClick={() => setReset(true)}>{say("Restart this scene…", "重开本场景…")}</button>}
  </div>;
}
