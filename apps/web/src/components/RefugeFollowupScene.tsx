import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { canChooseFollowup, encodeFollowupSnapshot, resolveFollowup, restoreFollowup,
  type FollowupDefinition, type FollowupEntry, type FollowupOrder, type FollowupState } from "@shi/game-core";
import story from "../../../../content/story-drafts/refuge-followup.v1.json";
import storyText from "../../../../content/story-drafts/refuge-followup.v1.json?raw";
import { flushPersistence, gameStorage } from "../persistence";

const definition = story as FollowupDefinition;
const speakers: Record<string, string> = { keeper: "掌简人", householder: "屋主", traveller: "过路人", stranger: "来者" };
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) =>
  <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");
}
/** Development continuation. Reading or returning never changes preceding saves. */
export function RefugeFollowupScene({ entry, saveNamespace, reducedMotion, onClose, onSavingChange }: {
  entry: FollowupEntry; saveNamespace?: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<{ key: string; hash: string; result: FollowupState | null } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FollowupOrder>(entry.contact.commonGrain > 0 ? "share-ration" : "walk-to-ferry");
  const [busy, setBusy] = useState(false);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const [revision, branch] = await Promise.all([hash(storyText), hash(entry.id)]);
        const key = `${saveNamespace ?? "shi.dev"}.refuge-followup.v1.${branch}`;
        const raw = gameStorage.getItem(key);
        const result = raw === null ? null : restoreFollowup(definition, entry, JSON.parse(raw), revision);
        if (raw !== null && !result) throw new Error("Incompatible follow-up save");
        if (alive.current) setLoaded({ key, hash: revision, result });
      } catch { if (alive.current) setError("不能验证这段经历。原存档保留，未修改此前经历。"); }
    })();
    return () => { alive.current = false; };
  }, [entry, saveNamespace]);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [loaded?.result, Boolean(loaded)]);
  const commit = async () => {
    if (!loaded || loaded.result || transaction.current || !canChooseFollowup(definition, entry, selected)) return;
    transaction.current = true; setBusy(true); setError(""); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      const result = resolveFollowup(definition, entry, selected);
      previous = gameStorage.getItem(loaded.key);
      gameStorage.setItem(loaded.key, encodeFollowupSnapshot(result, loaded.hash)); wrote = true;
      await flushPersistence();
      if (alive.current) setLoaded({ ...loaded, result });
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(loaded.key); else gameStorage.setItem(loaded.key, previous);
        await flushPersistence();
      } catch { /* Preserve error; never present an unconfirmed outcome. */ }
      if (alive.current) setError("未能保存，行动尚未确认。请恢复存储后重试。");
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  const scene = story.scenes[entry.contact.nextLead];
  const presentation = (item: typeof story.choices[number]) => item.id === "walk-to-ferry" && "escort" in scene ? { ...item, ...scene.escort } : item;
  const choice = presentation(story.choices.find(item => item.id === (loaded?.result?.order ?? selected))!);
  const available = canChooseFollowup(definition, entry, selected);
  const preview = available ? resolveFollowup(definition, entry, selected) : null;
  const memory = entry.contact.message === "not-entrusted" ? null : story.messageMemory[entry.contact.message];
  return <section className="drawer chen-council" data-testid="refuge-followup" role="dialog" aria-modal="true" aria-labelledby="followup-title" lang="zh-Hans" dir="ltr" data-motion={reducedMotion ? "reduced" : "full"}
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
    <header className="chen-header"><h2 ref={heading} id="followup-title" tabIndex={-1}>{loaded?.result ? story.title : scene.title}</h2><button className="icon-button" aria-label="回看问讯" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>×</button></header>
    <p className="chen-boundary">开发续章 · 简体中文 · 原创戏剧重构，尚未发布。</p>
    {error && <p role="alert" className="chen-error">{error}</p>}
    {!loaded && !error && <p role="status">正在核对问讯记录…</p>}
    {loaded && <div className="chen-layout"><section className="chen-main"><section className="chen-scene">
      {loaded.result ? <div data-testid="followup-response" aria-live="polite"><h3>{choice.title}</h3>{lines(choice.response)}
        {loaded.result.order === "share-ration" && entry.contact.promise === "broken" && <p className="chen-prose">{story.brokenPromiseResponse}</p>}
        <p>行动已保存。{story.ending}</p>
      </div> : <>{lines(scene.lines)}{memory && <p data-testid="followup-message-memory">{memory}</p>}
        <p className="chen-prose">{story.decisionContext}</p>
        <div className="chen-offers">{story.choices.map((item, index) => <button key={item.id} disabled={busy} data-followup-choice={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id as FollowupOrder)}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{presentation(item).title}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h3>{choice.title}</h3><p>{choice.intent}</p>
          {preview ? <p data-testid="followup-preview">可支配公粮：{entry.contact.commonGrain} → {preview.commonGrain}。{selected === "share-ration" ? "来者今夜有落脚处；错过末班渡船的查问。" : "来者有人陪同问船；今晚的食宿仍待解决。"}</p>
            : <p data-testid="followup-unavailable">没有可支配的公粮，不能拿欠粮或已分给别人的粮作承诺。仍可陪来者问船。</p>}
          <button className="primary-button" data-testid="followup-commit" disabled={busy || !available} onClick={() => void commit()}>{busy ? "保存中…" : "确认行动"}</button>
        </section></>}
    </section></section><aside className="chen-position" aria-label="仍要承担的事"><h3>仍要承担的事</h3>
      <p data-testid="followup-grain">可支配公粮：{loaded.result?.commonGrain ?? entry.contact.commonGrain}。</p>
      {entry.contact.debts.map(debt => <p key={debt.id}>仍欠本地粮主 {debt.grain} 份粮秣。</p>)}
      {entry.contact.promise === "broken" && <p>补漏失约仍在，帮助来者不会替你补上那处屋顶。</p>}
      {entry.contact.disclosure === "identifying-record" && <p>此前出示的那笔身份信息不能收回，听过的人仍知道它。</p>}
      <p>来者尚未确认为旧同伴。记录去向与此前粮债不变。</p>
    </aside></div>}
    <details className="chen-history"><summary>史料与重构边界</summary><p>{story.boundary}</p></details>
    <button className="text-button" data-testid="followup-back" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>回看问讯（不撤销行动）</button>
  </section>;
}
