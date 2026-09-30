import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { councilMetricKeys, createRetreat, encodeRetreatSnapshot, inspectRetreatChoice, resolveRetreat, restoreRetreat,
  type RetreatDefinition, type RetreatEntry, type RetreatState } from "@shi/game-core";
import story from "../../../../content/story-drafts/chen-retreat.v1.json";
import rawRules from "../../../../content/campaigns/chen-retreat.rules.v1.json";
import { flushPersistence, gameStorage } from "../persistence";
import "./ChenCouncil.css";

const rules = rawRules as RetreatDefinition;
export const retreatSaveKey = "shi.dev.chen-retreat.v1";
const metrics = { grain: "粮秣", tempo: "行动余裕", city: "民间支持", allies: "诸部支持", veterans: "军中支持" };
const speakers: Record<string, string> = { keeper: "掌简人", "supply-officer": "催粮军吏", "yu-mu": "妪母", "qin-courier": "韩驿使", "wounded-soldier": "伤卒", "partner-steward": "邻部管事", "rear-guard": "守路士卒" };
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) => <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
const outcomeTitle = (outcome: RetreatState["outcome"]) => outcome === "scattered" ? rules.scattered.title["zh-Hans"] : outcome ? story.endings[outcome].title : "";

export function RetreatScene({ entry, rulesHash, storyHash, reducedMotion, onClose, onSavingChange }: {
  entry: RetreatEntry; rulesHash: string; storyHash: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const [{ initial, damaged }] = useState(() => {
    const initial = createRetreat(rules, entry);
    try {
      const saved = gameStorage.getItem(retreatSaveKey);
      if (!saved) return { initial, damaged: false };
      const restored = restoreRetreat(rules, entry, JSON.parse(saved), rulesHash, storyHash);
      return { initial: restored ?? initial, damaged: !restored };
    } catch { return { initial, damaged: true }; }
  });
  const [state, setState] = useState(initial), [invalid, setInvalid] = useState(damaged);
  const [selected, setSelected] = useState(0), [reading, setReading] = useState(initial.history.length > 0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false), [reset, setReset] = useState(false);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  const scene = story.scenes[state.history.length], choice = scene?.choices[selected] ?? scene?.choices[0];
  const preview = choice ? inspectRetreatChoice(rules, state, choice.id) : null;
  const last = state.history.at(-1), lastScene = last && story.scenes.find(item => item.id === last.sceneId);
  const lastChoice = lastScene?.choices.find(item => item.id === last?.choiceId);
  const lastPreview = last ? inspectRetreatChoice(rules, { ...state, metrics: last.before,
    history: state.history.slice(0, -1), completed: false, outcome: undefined }, last.choiceId) : null;
  const facts: Record<string, string> = { ...entry.readingContext, ...Object.fromEntries(state.history.map(turn => [turn.sceneId, turn.choiceId])) };
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [state.history.length, reading, reset]);
  const persist = async (next: RetreatState) => {
    if (transaction.current) return;
    transaction.current = true; setBusy(true); setError(false); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      previous = gameStorage.getItem(retreatSaveKey);
      gameStorage.setItem(retreatSaveKey, encodeRetreatSnapshot(next, rulesHash, storyHash)); wrote = true;
      await flushPersistence();
      if (alive.current) { setState(next); setSelected(0); setReading(next.history.length > 0); setInvalid(false); setReset(false); }
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(retreatSaveKey); else gameStorage.setItem(retreatSaveKey, previous);
        await flushPersistence();
      } catch { /* An unsuccessful rollback never authorizes a success message. */ }
      if (alive.current) setError(true);
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  return <section className="drawer chen-council" data-testid="retreat-scene" data-motion={reducedMotion ? "reduced" : "full"}
    role="dialog" aria-modal="true" aria-labelledby="retreat-title" lang="zh-Hans" dir="ltr"
    onKeyDown={event => {
      if (event.altKey || event.key === "Escape") event.stopPropagation();
      if (event.key === "Escape" && !transaction.current) onClose();
      if (event.key === "Tab") {
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), summary, [href]")];
        const first = controls[0], lastControl = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); lastControl?.focus(); }
        else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <header className="chen-header"><h2 id="retreat-title">{story.title}</h2><button className="icon-button" data-council-action="close" aria-label="返回范阳" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>×</button></header>
    <p className="chen-boundary">开发试玩 · 简体中文剧本，部分规则说明暂用英语。<span lang="en"> Development preview: Chinese story, English rule explanations. Not a release build.</span></p>
    <p className="chen-boundary">参考《资治通鉴》卷七、卷八。对白、地方行动与分支结局均为原创戏剧重构，并非史书记载。</p>
    <p className="chen-boundary">粮秣与支持数值承接已完成的议事，表示剩余组织能力，不表示北方粮仓搬到陈地。人物当前去向尚未确认，不凭旧日合作假定重逢。</p>
    {invalid && <p role="alert" className="chen-error">存档损坏、来自另一段经历或内容已改版。原存档保留；明确重开前不能提交命令。</p>}
    {error && <p role="alert" className="chen-error">未能保存，命令尚未确认。请恢复存储后重试。</p>}
    <div className="chen-layout"><main className="chen-main">
      {reset ? <section className="chen-scene"><h3 ref={heading} tabIndex={-1}>替换本段开发存档？此前章节不变。</h3>
        <button className="primary-button" disabled={busy} data-council-action="reset" onClick={() => void persist(createRetreat(rules, entry))}>确认重开</button>
        <button className="text-button" disabled={busy} data-council-action="cancel" onClick={() => setReset(false)}>取消</button></section>
      : reading && lastChoice && lastScene ? <section className="chen-scene" data-testid="retreat-response" aria-live="polite"><h3 ref={heading} tabIndex={-1}>{lastChoice.title}</h3>
        {state.outcome === "scattered" ? <p className="chen-prose">{rules.scattered.reaction["zh-Hans"]}</p> : lines(lastChoice.response)}
        {lastPreview?.answers.map(answer => <p className="chen-promise-answer" key={answer.afterChoice} lang="en">{answer.reason}</p>)}
        {last && <div className="chen-preview">{councilMetricKeys.map(key => <span key={key}>{metrics[key]} <b>{last.before[key]} → {last.after[key]}</b></span>)}</div>}
        {lines((lastScene as typeof lastScene & { exitLines?: { speaker: string; text: string }[] }).exitLines ?? [])}
        <button className="primary-button" data-council-action="continue" onClick={() => setReading(false)}>继续 →</button></section>
      : state.completed && state.outcome ? <section className="chen-scene" data-testid="retreat-outcome" data-outcome={state.outcome} aria-live="polite"><h3 ref={heading} tabIndex={-1}>{outcomeTitle(state.outcome)}</h3>
        {state.outcome === "scattered" ? <><p>{rules.scattered.reaction["zh-Hans"]}</p><p>{rules.scattered.recovery["zh-Hans"]}</p></> : <>{lines(story.endings[state.outcome].lines)}<p>{story.endings[state.outcome].unresolved}</p></>}
        <p>{story.epilogue}</p><p>本卷开发段落到此结束。后续尚未开放。</p>
        <p>物资归属：{state.resourceCustody === "common" ? "现存队伍" : state.resourceCustody === "groups" ? "分行各组，不再是公共库存" : "未明，不能重复调拨"}</p>
        <button className="primary-button" data-council-action="close" onClick={onClose}>返回范阳</button></section>
      : scene && choice && preview ? <section className="chen-scene"><p className="eyebrow">{state.history.length + 1} / {story.scenes.length}</p><h3 ref={heading} tabIndex={-1}>{scene.title}</h3>
        <p>{scene.transition}</p>{lines(scene.lines)}
        {scene.variants.filter(variant => Object.entries(variant.when).every(([key, value]) => facts[key] === value)).map((variant, index) => <div key={index}>{lines(variant.lines)}</div>)}
        <div className="chen-offers">{scene.choices.map((item, index) => <button key={item.id} data-retreat-choice={item.id} data-council-choice={item.id} data-council-action="offer" disabled={busy || invalid} aria-pressed={choice.id === item.id} onClick={() => setSelected(index)}>{item.title}{!inspectRetreatChoice(rules, state, item.id).available && <small>条件未满足，可查看原因</small>}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h4>{choice.title}</h4><p>{choice.intent}</p><p lang="en">{preview.choice.reason}</p>
          {preview.answers.map(answer => <p className="chen-promise-answer" lang="en" key={answer.afterChoice}>{answer.reason}</p>)}
          {!preview.prerequisiteMet && <p>需要先完成家户护送。</p>}
          <ul>{preview.checks.filter(check => check.required > 0).map(check => <li key={check.key}>{metrics[check.key]}：{check.value} / 需要 {check.required} {check.met ? "✓" : "不足"}</li>)}</ul>
          {preview.after && <div className="chen-preview">{councilMetricKeys.map(key => <span key={key}>{metrics[key]} <b>{state.metrics[key]} → {preview.after![key]}</b></span>)}</div>}
          {preview.outcome && <p data-testid="retreat-preview" data-outcome={preview.outcome}>预计结果：{outcomeTitle(preview.outcome)}</p>}
          {preview.reactionOverride && <p>{preview.reactionOverride["zh-Hans"]}</p>}
          <button className="primary-button" data-council-action="commit" data-testid="retreat-commit" disabled={busy || invalid || !preview.available} onClick={() => { if (!invalid) void persist(resolveRetreat(rules, state, choice.id)); }}>{busy ? "保存中…" : "确认命令"} →</button>
        </section></section> : null}
    </main><aside className="chen-position" aria-label="当前局势"><h3>当前局势</h3><ul className="chen-metrics">{councilMetricKeys.map(key => <li key={key}><span>{metrics[key]}</span><span>{state.metrics[key]} / 10</span></li>)}</ul></aside></div>
    {!reset && <button className="text-button" data-council-action="retry" disabled={busy} onClick={() => setReset(true)}>重开本段…</button>}
  </section>;
}
