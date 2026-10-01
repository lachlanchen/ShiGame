import { useEffect, useRef, useState } from "react";
import type { Locale } from "@shi/game-core";
import { translateSound } from "../audio-labels";
import { cinemaLabel } from "../cinema-labels";

/** Playback only: choice and save ownership stay with the enclosing scene. */
export interface SceneFilmAsset {
  src: string;
  poster?: string;
  captions: { src: string; language: string; label: string };
}

export function SceneFilm({ asset, locale, active = true, soundtrack = false, testId = "scene-film" }: {
  asset: SceneFilmAsset; locale: Locale; active?: boolean; soundtrack?: boolean; testId?: string;
}) {
  const [muted, setMuted] = useState(true);
  const activeRef = useRef(active);
  activeRef.current = active;
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef<HTMLParagraphElement>(null);
  const requestRef = useRef(0);
  const wantedRef = useRef(false);
  const mountedRef = useRef(true);
  const nativeActiveRef = useRef(true);
  const pageActiveRef = useRef(true);
  const [status, setStatus] = useState<"ready" | "starting" | "playing" | "paused" | "ended" | "skipped" | "unavailable">("ready");
  useEffect(() => {
    if (status === "skipped") finishedRef.current?.focus({ preventScroll: true });
  }, [status]);

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

  useEffect(() => {
    if (!active) {
      wantedRef.current = false;
      requestRef.current += 1;
      videoRef.current?.pause();
      setStatus(current => current === "playing" || current === "starting" ? "paused" : current);
    }
  }, [active]);

  const mayPlay = () => activeRef.current && mountedRef.current && wantedRef.current && nativeActiveRef.current && pageActiveRef.current && !document.hidden;

  const play = async () => {
    const video = videoRef.current;
    if (!video || !activeRef.current || !mountedRef.current || !nativeActiveRef.current || !pageActiveRef.current || document.hidden || status === "unavailable" || status === "ended" || status === "skipped") return;
    const request = ++requestRef.current;
    wantedRef.current = true;
    setStatus("starting");
    try {
      // Only a play gesture starts this media; sound starts disabled.
      video.muted = !soundtrack || muted;
      video.volume = 0.7;
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
    <section className="silent-film" data-testid={testId} data-playback={status}>
      <video key={JSON.stringify([asset.src, asset.captions.src, asset.captions.language])} ref={videoRef} src={asset.src} poster={asset.poster} muted={!soundtrack || muted} playsInline preload="none" aria-label={cinemaLabel(locale, "play")}
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
        <p ref={finishedRef} tabIndex={-1} role="status">{cinemaLabel(locale, status === "unavailable" ? "unavailable" : "finished")}</p>
      ) : (
        <><button className="text-button" data-film-action="play" disabled={!active} onClick={() => {
          if (status === "playing" || status === "starting") { wantedRef.current = false; requestRef.current += 1; videoRef.current?.pause(); setStatus("paused"); }
          else void play();
        }}>{cinemaLabel(locale, status === "playing" || status === "starting" ? "pause" : "play")}</button>
        <button className="text-button" data-film-action="skip" onClick={() => {
          wantedRef.current = false; requestRef.current += 1;
          videoRef.current?.pause(); setStatus("skipped");
        }}>{cinemaLabel(locale, "skip")}</button>
        {soundtrack && <button className="text-button" data-film-action="sound" aria-label={translateSound(locale, "sound")} aria-pressed={!muted}
          onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next; }}>
          {translateSound(locale, muted ? "off" : "on")}
        </button>}</>
      )}
    </section>
  );
}
