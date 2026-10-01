import { useEffect, useRef, useState } from "react";
import type { Locale } from "@shi/game-core";
import { cinemaLabel } from "../cinema-labels";

/** An asset slot, not an approval mechanism. No production clips are admitted yet.
 * Only reviewed silent performances with a localized descriptive VTT belong here.
 * Music/voice mixing and admission by a hash-bound catalog are separate gates. */
export interface SilentFilmAsset {
  src: string;
  captions: { src: string; language: string; label: string };
}

export function SilentFilm({ asset, locale }: { asset: SilentFilmAsset; locale: Locale }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef(0);
  const wantedRef = useRef(false);
  const mountedRef = useRef(true);
  const nativeActiveRef = useRef(true);
  const pageActiveRef = useRef(true);
  const [status, setStatus] = useState<"ready" | "starting" | "playing" | "paused" | "ended" | "skipped" | "unavailable">("ready");

  useEffect(() => {
    mountedRef.current = true;
    wantedRef.current = false;
    requestRef.current += 1;
    setStatus("ready");
    const video = videoRef.current;
    const pause = () => {
      wantedRef.current = false;
      requestRef.current += 1;
      video?.pause();
      setStatus((current) => current === "playing" || current === "starting" ? "paused" : current);
    };
    const visibility = () => { if (document.hidden) pause(); };
    const active = (event: Event) => {
      nativeActiveRef.current = (event as CustomEvent<boolean>).detail === true;
      if (!nativeActiveRef.current) pause();
    };
    const hide = () => { pageActiveRef.current = false; pause(); };
    // Returning from the back-forward cache permits a new gesture, not autoplay.
    const show = () => { pageActiveRef.current = true; };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    window.addEventListener("shi-native-active", active);
    return () => {
      mountedRef.current = false;
      wantedRef.current = false;
      requestRef.current += 1;
      video?.pause();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
      window.removeEventListener("shi-native-active", active);
    };
  }, [asset.src, asset.captions.src, asset.captions.language]);

  const mayPlay = () => mountedRef.current && wantedRef.current && nativeActiveRef.current && pageActiveRef.current && !document.hidden;

  const play = async () => {
    const video = videoRef.current;
    if (!video || !mountedRef.current || !nativeActiveRef.current || !pageActiveRef.current || document.hidden || status === "unavailable" || status === "ended" || status === "skipped") return;
    const request = ++requestRef.current;
    wantedRef.current = true;
    setStatus("starting");
    try {
      // No autoplay and no audio: entering a result never starts a soundtrack.
      video.muted = true;
      await video.play();
      // A late completion must not restart a paused/backgrounded/detached scene.
      // But an obsolete completion must not stop a newer explicit play request.
      if (video !== videoRef.current || !mayPlay()) { video.pause(); return; }
      if (request !== requestRef.current) return;
      setStatus("playing");
    } catch {
      if (request === requestRef.current && mountedRef.current) {
        wantedRef.current = false;
        setStatus("unavailable");
      }
    }
  };

  return (
    <section className="silent-film" data-testid="silent-film" data-playback={status}>
      <video key={JSON.stringify([asset.src, asset.captions.src, asset.captions.language])} ref={videoRef} src={asset.src} muted playsInline preload="none" aria-label={cinemaLabel(locale, "play")}
        onPlaying={() => {
          if (!mayPlay()) { videoRef.current?.pause(); return; }
          setStatus("playing");
        }}
        onEnded={() => { wantedRef.current = false; requestRef.current += 1; setStatus(current => current === "skipped" ? current : "ended"); }}
        onPause={() => {
          // Browser/native controls may pause without using our button. Revoke
          // intent too, so a pending play promise cannot restart the scene.
          wantedRef.current = false;
          requestRef.current += 1;
          setStatus((current) => current === "playing" || current === "starting" ? "paused" : current);
        }}
        onError={() => { wantedRef.current = false; requestRef.current += 1; videoRef.current?.pause(); setStatus(current => current === "skipped" ? current : "unavailable"); }}>
        <track kind="captions" src={asset.captions.src} srcLang={asset.captions.language} label={asset.captions.label} default />
      </video>
      {status === "ended" || status === "skipped" || status === "unavailable" ? (
        <p role="status">{cinemaLabel(locale, status === "unavailable" ? "unavailable" : "finished")}</p>
      ) : (
        <><button className="text-button" onClick={() => {
          if (status === "playing" || status === "starting") { wantedRef.current = false; requestRef.current += 1; videoRef.current?.pause(); setStatus("paused"); }
          else void play();
        }}>{cinemaLabel(locale, status === "playing" || status === "starting" ? "pause" : "play")}</button>
        <button className="text-button" onClick={() => {
          wantedRef.current = false; requestRef.current += 1;
          videoRef.current?.pause(); setStatus("skipped");
        }}>{cinemaLabel(locale, "skip")}</button></>
      )}
    </section>
  );
}
