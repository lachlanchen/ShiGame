import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { encodeContactSnapshot, inspectContactChoice, prepareFollowupEntry, resolveContact, restoreContact,
  type ContactDefinition, type ContactOrder, type ContactState, type RefugeContactEntry } from "@shi/game-core";
import story from "../../../../content/story-drafts/refuge-contact.v1.json";
import storyText from "../../../../content/story-drafts/refuge-contact.v1.json?raw";
import { flushPersistence, gameStorage } from "../persistence";
import { RefugeFollowupScene } from "./RefugeFollowupScene";

const definition = story as ContactDefinition;
const speakers: Record<string, string> = { keeper: "掌简人", householder: "屋主", traveller: "过路人" };
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) => <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function RefugeContactScene({ entry, saveNamespace, reducedMotion, onClose, onSavingChange }: {
  entry: RefugeContactEntry; saveNamespace?: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const offers = story.choices.filter(choice => choice.location === entry.location);
  const [loaded, setLoaded] = useState<{ key: string; hash: string; result: ContactState | null } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ContactOrder>(offers[0]!.id as ContactOrder);
  const [busy, setBusy] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const [revision, branch] = await Promise.all([hash(storyText), hash(entry.id)]);
        const key = `${saveNamespace ?? "shi.dev"}.refuge-contact.v1.${branch}`;
        const saved = gameStorage.getItem(key);
        const result = saved === null ? null : restoreContact(definition, entry, JSON.parse(saved), revision);
        if (saved !== null && !result) throw new Error("Incompatible contact save");
        if (alive.current) setLoaded({ key, hash: revision, result });
      } catch { if (alive.current) setError("不能验证这次问讯的记录。原存档保留，未修改此前经历。"); }
    })();
    return () => { alive.current = false; };
  }, [entry, saveNamespace]);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [loaded?.result, Boolean(loaded), showFollowup]);
  const commit = async () => {
    if (!loaded || loaded.result || transaction.current || !inspectContactChoice(definition, entry, selected).available) return;
    transaction.current = true; setBusy(true); setError(""); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      const result = resolveContact(definition, entry, selected);
      previous = gameStorage.getItem(loaded.key);
      gameStorage.setItem(loaded.key, encodeContactSnapshot(result, loaded.hash)); wrote = true;
      await flushPersistence();
      if (alive.current) setLoaded({ ...loaded, result });
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(loaded.key); else gameStorage.setItem(loaded.key, previous);
        await flushPersistence();
      } catch { /* Do not claim confirmation when rollback fails. */ }
      if (alive.current) setError("未能保存，行动尚未确认。请恢复存储后重试。");
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  const scene = story.scenes[entry.location];
  const choice = offers.find(item => item.id === (loaded?.result?.order ?? selected))!;
  const available = inspectContactChoice(definition, entry, selected).available;
  const resultLabel = loaded?.result && (loaded.result.evidence === "none" ? loaded.result.message : loaded.result.evidence);
  const followup = useMemo(() => loaded?.result
    ? prepareFollowupEntry(definition, entry, JSON.parse(encodeContactSnapshot(loaded.result, loaded.hash)), loaded.hash) : null, [loaded, entry]);
  if (showFollowup && followup) return <RefugeFollowupScene entry={followup} saveNamespace={saveNamespace}
    reducedMotion={reducedMotion} onClose={() => setShowFollowup(false)} onSavingChange={onSavingChange} />;
  return <section className="drawer chen-council" data-testid="refuge-contact" role="dialog" aria-modal="true" aria-labelledby="contact-title" lang="zh-Hans" dir="ltr" data-motion={reducedMotion ? "reduced" : "full"}
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
    <header className="chen-header"><h2 ref={heading} id="contact-title" tabIndex={-1}>{scene.title}</h2><button className="icon-button" aria-label="回看天亮时的决定" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>×</button></header>
    <p className="chen-boundary">开发续章 · 原创戏剧重构，尚未发布。</p>
    {error && <p role="alert" className="chen-error">{error}</p>}
    {!loaded && !error && <p role="status">正在核对前段经历…</p>}
    {loaded && <div className="chen-layout"><section className="chen-main"><section className="chen-scene">
      {loaded.result ? <div data-testid="contact-response" aria-live="polite"><h3>{choice.title}</h3>{lines(choice.response)}
        <p>{resultLabel && resultLabel !== "not-entrusted" && story.outcomeLabels[resultLabel]}</p>
        <p>行动已保存。{story.continuation}</p>
        {followup && <button className="primary-button" data-testid="contact-open-followup" onClick={() => setShowFollowup(true)}>沿着留下的线索继续 →</button>}
      </div> : <>{lines(scene.lines)}<p data-testid="contact-record-memory">{story.recordMemory[entry.records]}</p>
        <div className="chen-offers">{offers.map((item, index) => <button key={item.id} disabled={busy} data-contact-choice={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id as ContactOrder)}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{item.title}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h3>{choice.title}</h3><p>{choice.intent}</p>
          {!available && <p data-testid="contact-unavailable">现在不能出示集中保管的凭记。去掉的身份不会恢复，分给各组的记录也不会自动回到囊里；可以选择不出示凭记的问讯方式。</p>}
          <button className="primary-button" data-testid="contact-commit" disabled={busy || !available} onClick={() => void commit()}>{busy ? "保存中…" : "确认行动"}</button>
        </section></>}
    </section></section><aside className="chen-position" aria-label="没有因此消失的事"><h3>没有因此消失的事</h3><p>可支配公粮：{entry.commonGrain}。交谈不改变粮数。</p>
      {entry.debts.map(debt => <p key={debt.id}>仍欠本地粮主 {debt.grain} 份粮秣。</p>)}
      {entry.promise === "broken" && <p>补漏失约仍在，尚未修复与屋主的关系。</p>}
      <p>失散者的身份和去向仍须另行核实。</p>
    </aside></div>}
    <details className="chen-history"><summary>史料与重构边界</summary><p>{story.boundary}</p></details>
    <button className="text-button" data-testid="contact-back" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>回看天亮时的决定（不撤销问讯）</button>
  </section>;
}
