import { useEffect, useRef, useState } from "react";
import type { GameState, Locale } from "@shi/game-core";
import type { DevelopmentCrossingDriver } from "../development-crossing";

/** An explicit replay operation, not a fictional rescue or a new historical event. */
export default function CrossingRecovery({ driver, locale, onRetry }: {
  driver: DevelopmentCrossingDriver; locale: Locale; onRetry: (state: GameState) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const opener = useRef<HTMLButtonElement>(null);
  const zh = locale.startsWith("zh");
  const prepare = () => {
    const attempt = ++generation.current;
    setLoading(true);
    // A cold resume at an ending has not rendered these gameplay panels.
    // Resolve their modules before offering an offline-capable checkpoint move.
    void Promise.all([import("./DecisionInspector"), import("./OppositionLayer"), import("./CommitmentLayer")]).then(() => {
      if (generation.current === attempt) { setReady(true); setLoading(false); }
    }, () => { if (generation.current === attempt) setLoading(false); });
  };
  useEffect(() => { prepare(); return () => { generation.current++; }; }, []);
  const cancel = () => { setConfirming(false); setError(false); requestAnimationFrame(() => opener.current?.focus()); };
  if (!driver.canReconsider()) return null;
  return <section data-testid="crossing-recovery" lang={zh ? "zh-Hans" : "en"} dir="ltr">
    <button className="text-button" ref={opener} data-testid="crossing-reconsider" aria-expanded={confirming}
      disabled={loading} aria-busy={loading} onClick={() => ready ? setConfirming(true) : window.location.reload()}>{ready
        ? zh ? "从渡口重新推演…" : "Reconsider the crossing…"
        : loading ? zh ? "正在准备重玩…" : "Preparing replay…" : zh ? "联网后重新载入重玩选项" : "Reconnect and reload replay options"}</button>
    {!loading && !ready && <p role="alert">{zh ? "未能载入重玩所需的界面。这次结局仍已保存。" : "The replay panels could not load. Your ending is still saved."}</p>}
    {confirming && <div role="group" aria-labelledby="crossing-retry-title" data-testid="crossing-retry-confirmation"
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); cancel(); } }}>
      <h3 id="crossing-retry-title">{zh ? "保留先前的承诺，重选渡河命令？" : "Keep your earlier promises and choose new crossing orders?"}</h3>
      <p>{zh ? "这是重玩，不是获救。开场的两次决定、当时的粮秣与局势会保留；渡河起的命令、后续决定和这次败局将被替换。不同命令仍可能失败。" : "This is a replay, not a rescue. Your two opening decisions and the supplies and conditions at that point remain. Orders from the crossing onward, later decisions and this defeat will be replaced. Different orders can still fail."}</p>
      <button className="text-button" autoFocus onClick={cancel} data-testid="crossing-retry-cancel">{zh ? "保留这次结局" : "Keep this ending"}</button>
      <button className="primary-button" data-testid="crossing-retry-confirm" onClick={() => {
        try { const next = driver.reconsider(); onRetry(next); }
        catch { setError(true); }
      }}>{zh ? "确认重玩渡河" : "Replay from the crossing"}</button>
      {error && <p role="alert">{driver.labels(locale).error}</p>}
    </div>}
  </section>;
}
