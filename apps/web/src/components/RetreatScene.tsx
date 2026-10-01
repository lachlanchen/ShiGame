import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { councilMetricKeys, createRetreat, encodeRetreatSnapshot, inspectRetreatChoice, resolveRetreat, restoreRetreat,
  type RetreatDefinition, type RetreatEntry, type RetreatState } from "@shi/game-core";
import story from "../../../../content/story-drafts/chen-retreat.v1.json";
import rawRules from "../../../../content/campaigns/chen-retreat.rules.v1.json";
import sourceLocations from "../../../../content/research/retreat-source-locations.v1.json";
import { flushPersistence, gameStorage } from "../persistence";
import "./ChenCouncil.css";

const rules = rawRules as RetreatDefinition;
const explanations: Record<string, string> = rawRules.explanationsZh;
const answerExplanations: Record<string, string> = rawRules.answerExplanationsZh;
export const retreatSaveKey = "shi.dev.chen-retreat.v1";
const metrics = { grain: "粮秣", tempo: "行动余裕", city: "民间支持", allies: "诸部支持", veterans: "军中支持" };
const speakers: Record<string, string> = { keeper: "掌简人", "supply-officer": "催粮军吏", "yu-mu": "妪母", "qin-courier": "韩驿使", "wounded-soldier": "伤卒", "partner-steward": "邻部管事", "rear-guard": "守路士卒", "granary-holder": "粮主" };
speakers["han-letter"] = "韩驿使来简";
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) => <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
const outcomeTitle = (outcome: RetreatState["outcome"]) => outcome === "scattered" ? rules.scattered.title["zh-Hans"] : outcome ? story.endings[outcome].title : "";

export function RetreatScene({ entry, rulesHash, storyHash, reducedMotion, onClose, onSavingChange, saveNamespace }: {
  entry: RetreatEntry; rulesHash: string; storyHash: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
  saveNamespace?: string;
}) {
  const saveKey = saveNamespace ? `${saveNamespace}.chen-retreat.v1` : retreatSaveKey;
  const [{ initial, damaged, revised }] = useState(() => {
    const initial = createRetreat(rules, entry);
    try {
      const saved = gameStorage.getItem(saveKey);
      if (!saved) return { initial, damaged: false, revised: false };
      const compatible = story.saveCompatibility.rulesSHA256 === rulesHash ? story.saveCompatibility.previousStorySHA256 : [];
      const snapshot = JSON.parse(saved);
      const restored = restoreRetreat(rules, entry, snapshot, rulesHash, storyHash, compatible);
      return { initial: restored ?? initial, damaged: !restored, revised: Boolean(restored && snapshot.storySHA256 !== storyHash) };
    } catch { return { initial, damaged: true, revised: false }; }
  });
  const [revisionNotice, setRevisionNotice] = useState(revised);
  const [state, setState] = useState(initial), [invalid, setInvalid] = useState(damaged);
  const [selected, setSelected] = useState(0), [reading, setReading] = useState(initial.history.length > 0);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false), [reset, setReset] = useState(false);
  const [rewindIndex, setRewindIndex] = useState<number | null>(null);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  const offerButtons = useRef(new Map<string, HTMLButtonElement>());
  const scene = story.scenes[state.history.length], choice = scene?.choices[selected] ?? scene?.choices[0];
  const preview = choice ? inspectRetreatChoice(rules, state, choice.id) : null;
  const last = state.history.at(-1), lastScene = last && story.scenes.find(item => item.id === last.sceneId);
  const evidenceScene = reading || state.completed ? lastScene : scene;
  const lastChoice = lastScene?.choices.find(item => item.id === last?.choiceId);
  const beforeLast = last ? state.history.slice(0, -1).reduce((current, turn) => resolveRetreat(rules, current, turn.choiceId), createRetreat(rules, entry)) : null;
  const lastPreview = last && beforeLast ? inspectRetreatChoice(rules, beforeLast, last.choiceId) : null;
  const facts: Record<string, string> = { ...entry.readingContext, ...Object.fromEntries(state.history.map(turn => [turn.sceneId, turn.choiceId])) };
  // Observations derive from saved choices, never from an assumed old presence.
  // A later ending cannot turn a witnessed arrival into guaranteed future custody.
  const witnessed = story.witnessedEvents.filter(event =>
    (state.history.length > story.scenes.findIndex(scene => scene.id === event.sceneId)
      || (!reading && state.history.length === story.scenes.findIndex(scene => scene.id === event.sceneId)))
    && Object.entries(event.when).every(([key, value]) => facts[key] === value)
    && (!event.priorChapterChoice || entry.chapter.history.some(turn => turn.choiceId === event.priorChapterChoice)));
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [state.history.length, reading, reset, rewindIndex]);
  const persist = async (next: RetreatState, showResponse = true) => {
    if (transaction.current) return;
    transaction.current = true; setBusy(true); setError(false); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      previous = gameStorage.getItem(saveKey);
      gameStorage.setItem(saveKey, encodeRetreatSnapshot(next, rulesHash, storyHash)); wrote = true;
      await flushPersistence();
      if (alive.current) { setState(next); setSelected(0); setReading(showResponse && next.history.length > 0); setInvalid(false); setReset(false); setRewindIndex(null); setRevisionNotice(false); }
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(saveKey); else gameStorage.setItem(saveKey, previous);
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
    <p className="chen-boundary">开发试玩 · 简体中文。<span lang="en"> Chinese-language development preview. Not a release build.</span></p>
    <p className="chen-boundary">参考《资治通鉴》卷七、卷八。对白、地方行动与分支结局均为原创戏剧重构，并非史书记载。</p>
    <p className="chen-boundary">粮秣与支持数值承接已完成的议事，表示剩余组织能力，不表示北方粮仓搬到陈地。人物去向须由本段实际发生的事件确认，不凭旧日合作假定重逢。</p>
    {invalid && <p role="alert" className="chen-error">存档损坏、来自另一段经历或内容已改版。原存档保留；明确重开前不能提交命令。</p>}
    {revisionNotice && <p role="status" className="chen-boundary" data-testid="retreat-prose-revision">故事文字已修订，你的决定与物资不变。正在按原进度阅读新版文字；确认下一项行动后才会更新存档版本。</p>}
    {error && <p role="alert" className="chen-error">未能保存，命令尚未确认。请恢复存储后重试。</p>}
    <div className={`chen-layout${reading && !reset ? " chen-reading-layout" : ""}`}><section className="chen-main">
      {rewindIndex !== null ? <section className="chen-scene" data-testid="retreat-rewind-confirmation">
        <h3 ref={heading} tabIndex={-1}>回到「{story.scenes[rewindIndex]!.title}」下令之前？</h3>
        <p>这是重试另一条分支，不是故事中的时光倒流。确认后将替换本段存档，移除这道命令及其后的决定和结局；更早的决定、当时的物资与未偿之约按原记录恢复。此前章节、陈县议事与范阳不变。原结局不会另存。</p>
        <button className="primary-button" data-testid="retreat-rewind-confirm" disabled={busy} onClick={() => {
          const checkpoint = state.history.slice(0, rewindIndex).reduce((current, turn) => resolveRetreat(rules, current, turn.choiceId), createRetreat(rules, entry));
          void persist(checkpoint, false);
        }}>{busy ? "保存中…" : "确认替换，重试此处"}</button>
        <button className="text-button" disabled={busy} onClick={() => { setRewindIndex(null); setError(false); }}>取消，保留原结局</button>
      </section> : reset ? <section className="chen-scene"><h3 ref={heading} tabIndex={-1}>替换本段开发存档？此前章节不变。</h3>
        <button className="primary-button" disabled={busy} data-council-action="reset" onClick={() => void persist(createRetreat(rules, entry))}>确认重开</button>
        <button className="text-button" disabled={busy} data-council-action="cancel" onClick={() => setReset(false)}>取消</button></section>
      : reading && lastChoice && lastScene ? <section className="chen-scene chen-response" data-testid="retreat-response" aria-live="polite"><h3 ref={heading} tabIndex={-1}>{lastChoice.title}</h3>
        {state.outcome === "scattered" ? lines(story.scatteredEnding.response) : lines(lastChoice.response)}
        {state.outcome && witnessed.map(event => <div data-testid="retreat-companion-answer" key={event.id}>{lines(event.endingResponses[state.outcome!])}</div>)}
        {last && witnessed.map(event => {
          const replies = event.decisionResponses as Record<string, { speaker: string; text: string }[]> | undefined;
          return replies?.[last.choiceId] ? <div data-testid="retreat-letter-answer" key={event.id}>{lines(replies[last.choiceId]!)}</div> : null;
        })}
        {lastPreview?.answers.map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{answerExplanations[answer.afterChoice]}</p>)}
        {last && <details className="chen-history" data-testid="retreat-response-changes"><summary>局势的变化</summary><div className="chen-preview">{councilMetricKeys.map(key => <span key={key}>{metrics[key]} <b>{last.before[key]} → {last.after[key]}</b></span>)}</div></details>}
        {lines((lastScene as typeof lastScene & { exitLines?: { speaker: string; text: string }[] }).exitLines ?? [])}
        <button className="primary-button" data-council-action="continue" onClick={() => setReading(false)}>继续 →</button></section>
      : state.completed && state.outcome ? <section className="chen-scene" data-testid="retreat-outcome" data-outcome={state.outcome} aria-live="polite"><h3 ref={heading} tabIndex={-1}>{outcomeTitle(state.outcome)}</h3>
        {state.outcome === "scattered" ? <>{lines(story.scatteredEnding.lines)}<div data-testid="retreat-scattered-memory">{story.scatteredEnding.variants.filter(variant => Object.entries(variant.when).every(([key, value]) => facts[key] === value)).map((variant, index) => <div key={index}>{lines(variant.lines)}</div>)}</div><p>{rules.scattered.recovery["zh-Hans"]}</p></> : lines(story.endings[state.outcome].lines)}
        {state.outcome !== "scattered" && <div data-testid="retreat-ending-memory">{story.endings[state.outcome].variants.filter(variant => Object.entries(variant.when).every(([key, value]) => facts[key] === value)).map((variant, index) => <div key={index}>{lines(variant.lines)}</div>)}</div>}
        <p>{story.epilogue}</p><p>本卷开发段落到此结束。后续尚未开放。</p>
        <p>物资归属：{state.resourceCustody === "common" ? "现存队伍" : state.resourceCustody === "groups" ? "分行各组，不再是公共库存" : "未明，不能重复调拨"}</p>
        <details className="chen-history" data-testid="retreat-decision-record"><summary>回看这一路的决定</summary>
          <p>这里只记录已经确认的行动与当时的变化，不代表失散者已经归来，也不替你判定哪条路最好。</p>
          <ol>{state.history.map(turn => {
            const recordedScene = story.scenes.find(item => item.id === turn.sceneId)!;
            const recordedChoice = recordedScene.choices.find(item => item.id === turn.choiceId)!;
            return <li key={turn.sceneId} data-recorded-choice={turn.choiceId}>
              <h4>{recordedScene.title} · {recordedChoice.title}</h4>
              <p>{explanations[turn.choiceId]}</p>
              <details className="chen-history" data-retreat-recorded-response={turn.sceneId}>
                <summary>这道命令的回应 · 戏剧重构</summary>
                {lines(state.outcome === "scattered" && turn === state.history.at(-1) ? story.scatteredEnding.response : recordedChoice.response)}
              </details>
              <ul>{councilMetricKeys.filter(key => turn.before[key] !== turn.after[key]).map(key =>
                <li key={key}>{metrics[key]}：{turn.before[key]} → {turn.after[key]}</li>)}</ul>
              {councilMetricKeys.every(key => turn.before[key] === turn.after[key]) && <p>本次未改变这五项数值；已作出的承诺与记录仍然保留。</p>}
              <button className="text-button" data-retreat-rewind={turn.sceneId} disabled={busy || invalid} onClick={() => setRewindIndex(state.history.indexOf(turn))}>从这道命令之前重试…</button>
            </li>;
          })}</ol>
        </details>
        <button className="primary-button" data-council-action="close" onClick={onClose}>返回范阳</button></section>
      : scene && choice && preview ? <section className="chen-scene"><p className="eyebrow">{state.history.length + 1} / {story.scenes.length}</p><h3 ref={heading} tabIndex={-1}>{scene.title}</h3>
        {state.history.length === 0 && <section data-testid="retreat-viewpoint"><h4>{story.viewpoint.title}</h4><p>{story.viewpoint.text}</p></section>}
        <p>{scene.setting}</p>{lines(scene.lines)}
        {witnessed.filter(event => event.sceneId === scene.id).map(event => <div data-testid="retreat-witnessed-arrival" key={event.id}>{lines(event.lines)}</div>)}
        {scene.variants.filter(variant => Object.entries(variant.when).every(([key, value]) => facts[key] === value)).map((variant, index) => <div key={index}>{lines(variant.lines)}</div>)}
        {story.councilCallbacks.some(callback => callback.sceneId === scene.id && entry.council.choices.includes(callback.afterChoice)) && <div data-testid="retreat-council-memory">{story.councilCallbacks.filter(callback => callback.sceneId === scene.id && entry.council.choices.includes(callback.afterChoice)).map(callback => <div key={callback.afterChoice}>{lines(callback.lines)}</div>)}</div>}
        {story.chapterCallbacks.some(callback => callback.sceneId === scene.id && entry.chapter.history.some(turn => turn.choiceId === callback.afterChoice)) && <div data-testid="retreat-chapter-memory">{story.chapterCallbacks.filter(callback => callback.sceneId === scene.id && entry.chapter.history.some(turn => turn.choiceId === callback.afterChoice)).map(callback => <div key={callback.afterChoice}>{lines(callback.lines)}</div>)}</div>}
        {lines(scene.decisionLeadIn ?? [])}
        <div className="chen-offers">{scene.choices.map((item, index) => <button key={item.id} ref={element => { if (element) offerButtons.current.set(item.id, element); else offerButtons.current.delete(item.id); }} data-retreat-choice={item.id} data-council-choice={item.id} data-council-action="offer" disabled={busy || invalid} aria-pressed={choice.id === item.id} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{item.title}{!inspectRetreatChoice(rules, state, item.id).available && <small>条件未满足，可查看原因</small>}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h4>{choice.title}</h4><p>{choice.intent}</p><p>{explanations[choice.id]}</p>
          {preview.answers.map(answer => <p className="chen-promise-answer" key={answer.afterChoice}>{answerExplanations[answer.afterChoice]}</p>)}
          {!preview.prerequisiteMet && <p data-testid="retreat-prior-choice-required">此前撤离时没有选择护送家户，因此现在不能组织这次共同等待。可查看其他去向；当前命令不会改写那次撤离。</p>}
          <ul>{preview.checks.filter(check => check.required > 0).map(check => <li key={check.key}>{metrics[check.key]}：{check.value} / 需要 {check.required} {check.met ? "✓" : `还缺 ${check.required - check.value}`}</li>)}</ul>
          {preview.maximumChecks.map(check => <p key={check.key}>要求借粮前{metrics[check.key]} ≤ {check.maximum}（当前 {check.value}）{check.met ? "✓" : "已超过"}</p>)}
          {preview.newDebt && <p data-testid="retreat-debt-preview">新欠本地粮主：{preview.newDebt.grain} 份粮秣。债随约定保留，分行或去名不会销账。</p>}
          {preview.after && <div className="chen-preview">{councilMetricKeys.map(key => <span key={key}>{metrics[key]} <b>{state.metrics[key]} → {preview.after![key]}</b></span>)}</div>}
          {preview.outcome && <p data-testid="retreat-preview" data-outcome={preview.outcome}>预计结果：{outcomeTitle(preview.outcome)}</p>}
          {preview.dispersionChecks.length > 0 && <section data-testid="retreat-dispersal-checks" aria-label="有序分行条件">
            <p>停止统领不需要许可；能否安排妥当，要看下令后的粮秣与支持。支持只需一方达标，不把三方相加。</p>
            <ul>{preview.dispersionChecks.map(check => <li key={check.key}>{check.key === "grain" ? "分行粮秣" : "民间、诸部、军中最高一方支持"}：{check.value} / 需要 {check.required} {check.met ? "✓" : `还缺 ${check.required - check.value}`}</li>)}</ul>
          </section>}
          {preview.reactionOverride && <p>{preview.reactionOverride["zh-Hans"]}</p>}
          {!preview.available && !invalid && <section data-testid="retreat-available-alternatives" aria-label="可行的其他命令">
            <p>这条路暂时走不通。你仍可查看其他命令；查看不会下令，也不会改变此前的约定。</p>
            {scene.choices.map((alternative, index) => inspectRetreatChoice(rules, state, alternative.id).available
              ? <button className="text-button" key={alternative.id} disabled={busy} data-retreat-alternative={alternative.id} onClick={() => { setSelected(index); offerButtons.current.get(alternative.id)?.focus(); }}>查看：{alternative.title}</button>
              : null)}
          </section>}
          <button className="primary-button" data-council-action="commit" data-testid="retreat-commit" disabled={busy || invalid || !preview.available} onClick={() => { if (!invalid) void persist(resolveRetreat(rules, state, choice.id)); }}>{busy ? "保存中…" : "确认命令"} →</button>
        </section></section> : null}
    </section>{(!reading || reset || state.debts.length > 0 || witnessed.length > 0) && <aside className="chen-position" aria-label={reading && !reset ? "已确认的约定与往来" : "当前局势"}><h3>{reading && !reset ? "已确认的约定与往来" : "当前局势"}</h3>{(!reading || reset) && <ul className="chen-metrics">{councilMetricKeys.map(key => <li key={key}><span>{metrics[key]}</span><span>{state.metrics[key]} / 10</span></li>)}</ul>}
      {state.debts.length > 0 && <section data-testid="retreat-debts"><h3>未偿之约</h3>{state.debts.map(debt => <p key={debt.id}>欠本地粮主 {debt.grain} 份粮秣；债未偿还，粮主另持欠契。分行不表示免责。</p>)}</section>}
      {witnessed.length > 0 && <section data-testid="retreat-observations"><h3>已核实的往来</h3>{witnessed.map(event => <p key={event.id}>{event.observation}</p>)}</section>}
    </aside>}</div>
    <details className="chen-history" data-testid="retreat-source-panel"><summary>史料与开发说明</summary><p>{evidenceScene?.transition}</p>
      <p>{story.viewpoint.historyBoundary}</p>
      {evidenceScene?.sourceIds.map(id => { const source = story.sources[id as keyof typeof story.sources]; const location = sourceLocations.locations[id as keyof typeof sourceLocations.locations]; return <p key={id} data-retreat-source={id}>{source.work}卷{source.volume} · {source.anchor}。{source.supports}{location && <small> 本地对读定位：第{location.startLine}–{location.endLine}行。</small>}</p>; })}
      <p>{sourceLocations.boundaryZh}</p>
      {state.completed && state.outcome && state.outcome !== "scattered" && <p>{story.endings[state.outcome].unresolved}</p>}
      {state.completed && state.outcome === "scattered" && <p>{story.scatteredEnding.unresolved}</p>}
      <p>{story.boundary}</p></details>
    {!reset && rewindIndex === null && <button className="text-button" data-council-action="retry" disabled={busy} onClick={() => setReset(true)}>重开本段…</button>}
  </section>;
}
