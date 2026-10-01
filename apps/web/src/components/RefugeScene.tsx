import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRefuge, encodeRefugeSnapshot, inspectRefugeChoice, resolveRefuge, restoreRefuge,
  type RefugeEntry, type RefugeOrder, type RefugeState } from "@shi/game-core";
import story from "../../../../content/story-drafts/refuge.v1.json";
import storyText from "../../../../content/story-drafts/refuge.v1.json?raw";
import { flushPersistence, gameStorage } from "../persistence";

const speakers: Record<string, string> = { keeper: "掌简人", householder: "屋主" };
const lines = (items: { speaker: string; text: string }[]) => items.map((line, index) =>
  <p className="chen-prose" key={index}>{speakers[line.speaker] && <strong>{speakers[line.speaker]}： </strong>}{line.text}</p>);
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Authoring-only continuation. Branch-specific slots preserve other retreat endings. */
export function RefugeScene({ entry, saveNamespace, reducedMotion, onClose, onSavingChange }: {
  entry: RefugeEntry; saveNamespace?: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<{ state: RefugeState; key: string; hash: string } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RefugeOrder>("offer-labour");
  const [busy, setBusy] = useState(false);
  const transaction = useRef(false), alive = useRef(true), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const [revision, branch] = await Promise.all([hash(storyText), hash(entry.id)]);
        const key = `${saveNamespace ?? "shi.dev"}.refuge.v1.${branch}`;
        const saved = gameStorage.getItem(key);
        const state = saved === null ? createRefuge(entry) : restoreRefuge(entry, JSON.parse(saved), revision);
        if (!state) throw new Error("Invalid continuation");
        if (alive.current) setLoaded({ state, key, hash: revision });
      } catch { if (alive.current) setError("不能验证续章存档。原记录保留，未修改此前经历；请返回，不要覆盖存档。"); }
    })();
    return () => { alive.current = false; };
  }, [entry, saveNamespace]);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView?.({ block: "start", behavior: "instant" }); }, [loaded?.state.order, Boolean(loaded)]);
  const commit = async () => {
    if (!loaded || transaction.current || !inspectRefugeChoice(loaded.state, selected).available) return;
    transaction.current = true; setBusy(true); setError(""); onSavingChange?.(true);
    let previous: string | null = null, wrote = false;
    try {
      const next = resolveRefuge(loaded.state, selected);
      previous = gameStorage.getItem(loaded.key);
      gameStorage.setItem(loaded.key, encodeRefugeSnapshot(next, loaded.hash)); wrote = true;
      await flushPersistence();
      if (alive.current) setLoaded({ ...loaded, state: next });
    } catch {
      if (wrote) try {
        if (previous === null) gameStorage.removeItem(loaded.key); else gameStorage.setItem(loaded.key, previous);
        await flushPersistence();
      } catch { /* Never present a failed rollback as a confirmed choice. */ }
      if (alive.current) setError("未能保存，行动尚未确认。请恢复存储后重试。");
    } finally { transaction.current = false; onSavingChange?.(false); if (alive.current) setBusy(false); }
  };
  const choice = story.choices.find(item => item.id === (loaded?.state.order ?? selected))!;
  return <section className="drawer chen-council" data-testid="refuge-scene" role="dialog" aria-modal="true" aria-labelledby="refuge-title" lang="zh-Hans" dir="ltr" data-motion={reducedMotion ? "reduced" : "full"}
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
    <header className="chen-header"><h2 id="refuge-title" ref={heading} tabIndex={-1}>{story.title}</h2><button className="icon-button" aria-label="返回退走结局" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>×</button></header>
    <p className="chen-boundary">开发续章 · 简体中文 · 原创戏剧重构，尚未发布。</p>
    {error && <p role="alert" className="chen-error">{error}</p>}
    {!loaded && !error && <p role="status">正在核对退走后的经历…</p>}
    {loaded && <div className="chen-layout"><section className="chen-main"><section className="chen-scene">
      {loaded.state.order ? <div data-testid="refuge-response" aria-live="polite"><h3>{choice.title}</h3>{lines(choice.response)}
        <p>行动已保存。{loaded.state.personalObligation ? "天亮要帮屋主补漏；这项承诺尚未履行。" : loaded.state.rested ? "你换得了一夜休息。" : "你留在屋外，没有添下新约。"}</p>
        <p>{story.continuation}</p>
      </div> : <><p>{story.setting}</p>{lines(story.lines)}
        <div className="chen-offers">{story.choices.map((item, index) => <button key={item.id} disabled={busy} aria-pressed={selected === item.id} data-refuge-choice={item.id} onClick={() => setSelected(item.id as RefugeOrder)}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{item.title}</button>)}</div>
        <section className="chen-offer-detail" aria-live="polite"><h3>{choice.title}</h3><p>{choice.intent}</p>
          {!inspectRefugeChoice(loaded.state, selected).available && <p>没有仍可支配的公粮。已经分出的粮不能再花一次；可以承诺自己的劳作，或不添新约。</p>}
          <button className="primary-button" data-testid="refuge-commit" disabled={busy || !inspectRefugeChoice(loaded.state, selected).available} onClick={() => void commit()}>{busy ? "保存中…" : "确认行动"}</button>
        </section></>}
    </section></section><aside className="chen-position" aria-label="带来的处境"><h3>带来的处境</h3>
      <p>仍可支配的公粮：{loaded.state.commonGrain}</p>
      <p>{entry.custody === "groups" ? "此前的粮已经分给各组，不是你的公共库存。" : entry.custody === "unresolved" ? "此前物资去向未明，不能重复调拨。" : "公粮仍属于现存队伍；个人借宿的支出也要入账。"}</p>
      {loaded.state.debts.map(debt => <p key={debt.id}>仍欠本地粮主 {debt.grain} 份粮秣。</p>)}
      <p>其他人的到达尚未核实；没有因进入续章而自动重逢。</p>
    </aside></div>}
    <details className="chen-history"><summary>史料与重构边界</summary><p>{story.boundary}</p><p>《{story.sourceReadback.work}》卷{story.sourceReadback.volume}：{story.sourceReadback.supports}</p></details>
    <button className="text-button" disabled={busy} onClick={() => { if (!transaction.current) onClose(); }}>返回退走结局</button>
  </section>;
}
