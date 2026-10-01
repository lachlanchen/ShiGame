import { useEffect, useRef, useState } from "react";
import "./PrivateScoreAudition.css";

const scoreURL = "/__shi_private_score__/candidate-b.mp3";
const sha256 = "7d28d185acd999637b19fd9eb0eb1bec778eff9f17c9507fff92519643cdada4";

/** Private review overlay, not asset admission. No campaign state or save API. */
export function PrivateScoreAudition() {
  const audio = useRef<HTMLAudioElement>(null);
  const prepared = useRef(false);
  const loading = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const playRequest = useRef(0);
  const [status, setStatus] = useState("idle");
  const [volume, setVolume] = useState(0.2);
  const volumeRef = useRef(volume);
  const pause = () => {
    playRequest.current++; abort.current?.abort(); audio.current?.pause();
    if (alive.current) setStatus(current => current === "playing" || current === "loading" ? "paused" : current);
  };
  useEffect(() => {
    alive.current = true;
    const alreadyActive = document.body.classList.contains("score-review-active");
    document.body.classList.add("score-review-active");
    const player = audio.current!;
    const visibility = () => { if (document.hidden) pause(); };
    const native = (event: Event) => { if (!(event as CustomEvent<boolean>).detail) pause(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pause);
    window.addEventListener("shi-native-active", native);
    return () => {
      alive.current = false; abort.current?.abort(); player.pause();
      player.removeAttribute("src"); player.load();
      prepared.current = false; loading.current = false;
      if (!alreadyActive) document.body.classList.remove("score-review-active");
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("shi-native-active", native);
    };
  }, []);
  const play = async () => {
    if (loading.current) return;
    loading.current = true;
    const request = ++playRequest.current;
    const player = audio.current!;
    try {
      if (!prepared.current) {
        setStatus("loading"); abort.current = new AbortController();
        const response = await fetch(scoreURL, { cache: "no-store", signal: abort.current.signal });
        if (!response.ok) throw new Error("Private cue unavailable");
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 2_000_000) throw new Error("Oversized private recording");
        const hash = await crypto.subtle.digest("SHA-256", bytes);
        if (Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("") !== sha256) throw new Error("Wrong recording");
        if (!alive.current || abort.current.signal.aborted || request !== playRequest.current) return;
        // Same-origin media complies with media-src 'self'. The fixed server
        // endpoint rechecks the pinned hash for the media request as well.
        player.src = scoreURL;
        prepared.current = true;
      }
      player.volume = volumeRef.current;
      if (player.ended) player.currentTime = 0;
      await player.play();
      if (!alive.current || document.hidden || request !== playRequest.current) { player.pause(); return; }
      setStatus("playing");
    } catch { if (alive.current && request === playRequest.current) setStatus("unavailable"); }
    finally { loading.current = false; }
  };
  return <details className="private-score-audition" data-testid="private-score-audition" data-status={status} onKeyDown={event => { if (event.altKey || event.key === "Escape") event.stopPropagation(); }}>
    <summary aria-label="Score B · private audition / 配乐试听"><span className="audition-icon" aria-hidden="true">♫</span><span className="audition-label">Score B · private audition / 配乐试听</span></summary>
    <p>ACE-Step / Musia · seed 926102 · 45 s. Working candidate only: listening, similarity, rights and scene-mix approval pending. Not a release asset.</p>
    <p>开发试听，未通过听审与商用准入。一次播放，不循环；场景切换不重启，不自动作出选择。其他候选与原音频保留。</p>
    <audio ref={audio} preload="none" onEnded={() => { if (alive.current) setStatus("ended"); }} onError={() => { if (alive.current) setStatus("unavailable"); }} />
    <div><button type="button" disabled={status === "loading"} onClick={() => { void play(); }}>Play / 播放</button>
      <button type="button" onClick={pause}>Pause / 暂停</button></div>
    <label>Audition level / 试听音量 <input type="range" min="0" max="0.35" step="0.01" value={volume} onChange={event => { const next = Number(event.target.value); volumeRef.current = next; setVolume(next); if (audio.current) audio.current.volume = next; }} /></label>
    <p role="status">{status === "unavailable" ? "Cannot play this private cue. Retry, or continue silently. / 无法播放，可重试或静音继续。" : `Playback: ${status}`}</p>
  </details>;
}
