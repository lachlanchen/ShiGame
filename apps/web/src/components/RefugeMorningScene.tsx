import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { encodeMorningSnapshot, encodeRefugeSnapshot, morningEntryId, resolveMorning, restoreMorning, prepareRefugeContactEntry,
  type MorningDefinition, type MorningOrder, type MorningState, type RefugeState, type RefugeEntry, type RefugeContactEntry } from "@shi/game-core";
import { RefugeContactScene } from "./RefugeContactScene";
import story from "../../../../content/story-drafts/refuge-morning.v1.json";
import storyText from "../../../../content/story-drafts/refuge-morning.v1.json?raw";
import { flushPersistence, gameStorage } from "../persistence";

const definition = story as MorningDefinition;
const speakers: Record<string, string> = { keeper: "掌简人", householder: "屋主", traveller: "过路人" };
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) => <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function RefugeMorningScene({ night, nightHash, refugeEntry, saveNamespace, reducedMotion, onClose, onSavingChange }: {
  night: RefugeState; nightHash: string; refugeEntry: RefugeEntry; saveNamespace?: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<{ key: string; hash: string; result: MorningState | null } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MorningOrder>("repair-roof");
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<RefugeContactEntry | null>(null);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const [revision, branch] = await Promise.all([hash(storyText), hash(morningEntryId(night))]);
        const key = `${saveNamespace ?? "shi.dev"}.refuge-morning.v1.${branch}`;
        const saved = gameStorage.getItem(key);
        const result = saved === null ? null : restoreMorning(definition, night, JSON.parse(saved), revision, nightHash);
        if (saved !== null && !result) throw new Error("Incompatible morning save");
        if (alive.current) setLoaded({ key, hash: revision, result });
      } catch { if (alive.current) setError("不能验证天亮后的记录。原存档保留，未修改昨夜或此前经历。"); }
    })();
    return () => { alive.current = false; };
  }, [night, nightHash, saveNamespace]);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [loaded?.result, Boolean(loaded), contact]);
  const commit = async () => {
    if (!loaded || loaded.result || transaction.current) return;
    transaction.current = true; setBusy(true); setError(""); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      const result = resolveMorning(definition, night, selected);
      previous = gameStorage.getItem(loaded.key);
      gameStorage.setItem(loaded.key, encodeMorningSnapshot(result, loaded.hash, nightHash)); wrote = true;
      await flushPersistence();
      if (alive.current) setLoaded({ ...loaded, result });
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(loaded.key); else gameStorage.setItem(loaded.key, previous);
        await flushPersistence();
      } catch { /* A failed rollback does not establish a confirmed action. */ }
      if (alive.current) setError("未能保存，行动尚未确认。请恢复存储后重试。");
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  const choice = story.choices.find(item => item.id === (loaded?.result?.order ?? selected))!;
  const preview = loaded?.result ?? (loaded ? resolveMorning(definition, night, selected) : null);
  if (contact) return <RefugeContactScene entry={contact} saveNamespace={saveNamespace} reducedMotion={reducedMotion} onClose={() => setContact(null)} onSavingChange={onSavingChange} />;
  return <section className="drawer chen-council" data-testid="refuge-morning" role="dialog" aria-modal="true" aria-labelledby="morning-title" lang="zh-Hans" dir="ltr" data-motion={reducedMotion ? "reduced" : "full"}
    onKeyDown={event => {
      if (event.altKey || event.key === "Escape") event.stopPropagation();
      if (event.key === "Escape" && !transaction.current) onClose();
      if (event.key === "Tab") {
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), summary")];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <header className="chen-header"><h2 ref={heading} id="morning-title" tabIndex={-1}>{story.title}</h2><button className="icon-button" aria-label="回看昨夜" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>×</button></header>
    <p className="chen-boundary">开发续章 · 原创戏剧重构，尚未发布。</p>
    {error && <p role="alert" className="chen-error">{error}</p>}
    {!loaded && !error && <p role="status">正在核对昨夜的决定…</p>}
    {loaded && <div className="chen-layout"><section className="chen-main"><section className="chen-scene">
      {loaded.result ? <div data-testid="morning-response" aria-live="polite"><h3>{choice.title}</h3>
        {loaded.result.promise === "broken" && lines(story.promiseResponses.broken)}
        {lines(choice.response)}
        {loaded.result.promise === "kept" && lines(story.promiseResponses.kept)}
        <ul>{preview && <><li>{story.outcomeLabels.promise[preview.promise]}</li><li>{story.outcomeLabels.contact[preview.contact]}</li><li>{story.outcomeLabels.lead[preview.lead]}</li></>}</ul>
        <p>行动已保存。接下来可以{loaded.result.lead === "with-witness" ? "在河边向过路人问讯" : "向屋主托付口信"}，这一步尚未替你完成。</p>
        <button className="primary-button" data-testid="morning-open-contact" onClick={() => {
          const next = prepareRefugeContactEntry(definition, refugeEntry, JSON.parse(encodeRefugeSnapshot(night, nightHash)), JSON.parse(encodeMorningSnapshot(loaded.result!, loaded.hash, nightHash)), nightHash, loaded.hash);
          if (next) setContact(next); else setError("不能核对问讯所需的前段记录，未修改存档。");
        }}>继续：{loaded.result.lead === "with-witness" ? "河边问讯" : "留下口信"} →</button>
      </div> : <>{lines(story.opening)}<p data-testid="morning-memory">{story.nightMemory[night.order!]}</p>
        <div className="chen-offers">{story.choices.map((item, index) => <button key={item.id} disabled={busy} data-morning-choice={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id as MorningOrder)}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{item.title}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h3>{choice.title}</h3><p>{choice.intent}</p>
          {preview && <p data-testid="morning-preview">确认后：{story.outcomeLabels.promise[preview.promise]}；{story.outcomeLabels.contact[preview.contact]}；{story.outcomeLabels.lead[preview.lead]}。</p>}
          <button className="primary-button" data-testid="morning-commit" disabled={busy} onClick={() => void commit()}>{busy ? "保存中…" : "确认行动"}</button>
        </section></>}
    </section></section><aside className="chen-position" aria-label="仍需面对的事"><h3>仍需面对的事</h3><p>可支配公粮：{night.commonGrain}。本次行动不支出或补回粮食。</p>
      {night.debts.map(debt => <p key={debt.id}>仍欠本地粮主 {debt.grain} 份粮秣。</p>)}
      <p>河边的人尚未确认身份；没有自动重逢。</p>
    </aside></div>}
    <details className="chen-history"><summary>史料与重构边界</summary><p>{story.boundary}</p></details>
    <button className="text-button" data-testid="morning-back" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>回看昨夜（不撤销今天的决定）</button>
  </section>;
}
