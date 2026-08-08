import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  canChoose,
  createInitialState,
  currentSaveVersion,
  deriveEnding,
  formatSeed,
  getNode,
  localize,
  migrateGameState,
  resolveChoice,
  selectFieldCondition,
  supportedLocales,
  type Campaign,
  type Choice,
  type ChoiceResolution,
  type GameState,
  type Locale,
  type LocalizedText,
  type MapSite,
  type ResourceKey,
} from "@shi/game-core";
import campaignJson from "./generated/chapter-01-gameplay.json";
import { isRtl, localeNames, translate } from "./i18n";
import { ResourceRail } from "./components/ResourceRail";
import { ThreeBackdrop } from "./components/ThreeBackdrop";
import { useGamepad } from "./useGamepad";
import type { GamepadCommand } from "./gamepad";
import { audioCaps, audioDefaults, readAudioPreferences, storeAudioPreferences, type AudioCue, type AudioPreferences, type AudioRuntimeStatus } from "./audio-types";
import { translateSound } from "./audio-labels";
import type { ShiAudioEngine } from "./audioEngine";

const campaign = campaignJson as unknown as Campaign;
const StrategicMap = lazy(() => import("./components/StrategicMap").then((module) => ({ default: module.StrategicMap })));
const FieldGuide = lazy(() => import("./components/FieldGuide").then((module) => ({ default: module.FieldGuide })));
const SourceLedger = lazy(() => import("./components/SourceLedger").then((module) => ({ default: module.SourceLedger })));
const AudioSettings = lazy(() => import("./components/AudioSettings").then((module) => ({ default: module.AudioSettings })));
const SAVE_KEY = "shi.chapter-01.save.v3";
const LEGACY_SAVE_KEYS = ["shi.chapter-01.save.v2", "shi.chapter-01.save.v1"];
const DRAFT_SEED_KEY = "shi.chapter-01.seed.v1";
const LOCALE_KEY = "shi.locale";
const MOTION_KEY = "shi.reduced-motion";
const ONBOARDING_KEY = "shi.onboarding.field-guide.v1";

function readSavedState(): GameState | null {
  for (const key of [SAVE_KEY, ...LEGACY_SAVE_KEYS]) {
    try {
      const migrated = migrateGameState(campaign, JSON.parse(localStorage.getItem(key) ?? "null"));
      if (!migrated || migrated.history.length === 0) continue;
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
      localStorage.setItem(DRAFT_SEED_KEY, String(migrated.seed));
      for (const legacy of LEGACY_SAVE_KEYS) localStorage.removeItem(legacy);
      return migrated;
    } catch {
      // Try the next known save key; malformed local data must not stop startup.
    }
  }
  return null;
}

function seedFromUrl(): number | null {
  const value = new URLSearchParams(window.location.search).get("seed")?.trim();
  const match = value?.match(/^(?:0x)?([0-9a-f]{1,8})$/i);
  return match?.[1] ? Number.parseInt(match[1], 16) >>> 0 : null;
}

function randomSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] ?? 0;
}

function initialSeed(): number {
  const requested = seedFromUrl();
  const stored = Number.parseInt(localStorage.getItem(DRAFT_SEED_KEY) ?? "", 10);
  const seed = requested ?? (Number.isInteger(stored) && stored >= 0 && stored <= 0xffffffff ? stored : randomSeed());
  localStorage.setItem(DRAFT_SEED_KEY, String(seed));
  return seed;
}

function initialLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
  if (saved && supportedLocales.includes(saved)) return saved;
  const language = navigator.language.toLowerCase();
  if (language.startsWith("zh-tw") || language.startsWith("zh-hk")) return "zh-Hant";
  if (language.startsWith("zh")) return "zh-Hans";
  const base = language.split("-")[0] as Locale;
  return supportedLocales.includes(base) ? base : "en";
}

const effectLabel = (key: ResourceKey, value: number, locale: Locale) => `${value > 0 ? "+" : ""}${value} ${translate(locale, key)}`;
const contentDirection = (text: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !text.ar ? "ltr" : undefined;

export function App() {
  const [restoredState] = useState<GameState | null>(readSavedState);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [state, setState] = useState<GameState>(() => restoredState ?? createInitialState(campaign, initialSeed()));
  const [screen, setScreen] = useState<"title" | "play">("title");
  const [drawer, setDrawer] = useState<"sources" | "record" | "guide" | "audio" | null>(null);
  const [mapSiteId, setMapSiteId] = useState<string | null>(null);
  const [sourceSiteId, setSourceSiteId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<ChoiceResolution | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem(MOTION_KEY) === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [fontStatus, setFontStatus] = useState<"loading" | "ready" | "error">("loading");
  const [hasSave, setHasSave] = useState(restoredState !== null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>(readAudioPreferences);
  const [audioStatus, setAudioStatus] = useState<AudioRuntimeStatus>(() => readAudioPreferences().enabled ? "armed" : "off");
  const [lastAudioCue, setLastAudioCue] = useState<AudioCue | "none">("none");
  const storyRef = useRef<HTMLElement>(null);
  const beginButtonRef = useRef<HTMLButtonElement>(null);
  const endingRestartRef = useRef<HTMLButtonElement>(null);
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioEngineRef = useRef<ShiAudioEngine | null>(null);
  const audioLoadingRef = useRef<Promise<void> | null>(null);
  const pendingAudioCueRef = useRef<AudioCue | null>(null);
  const audioPreferencesRef = useRef(audioPreferences);
  const screenRef = useRef(screen);
  const node = getNode(campaign, state.currentNodeId);
  const activeCondition = selectFieldCondition(campaign, node, state.seed, state.history.length);
  const speaker = campaign.characters.find((character) => character.id === node.speakerId)!;
  const ending = state.completed ? deriveEnding(state) : null;
  const nodeNumber = campaign.nodes.findIndex((candidate) => candidate.id === node.id) + 1;
  const sourceSite = campaign.sites.find((site) => site.id === sourceSiteId) ?? null;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
    localStorage.setItem(LOCALE_KEY, locale);
    let current = true;
    setFontStatus("loading");
    import("./fontLoader").then(({ ensureLocaleFont }) => ensureLocaleFont(locale)).then(
      () => { if (current) setFontStatus("ready"); },
      (error: unknown) => {
        console.error(error);
        if (current) setFontStatus("error");
      },
    );
    return () => { current = false; };
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(DRAFT_SEED_KEY, String(state.seed));
    if (state.history.length > 0) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      for (const legacy of LEGACY_SAVE_KEYS) localStorage.removeItem(legacy);
      setHasSave(true);
    }
  }, [state]);

  useEffect(() => {
    screenRef.current = screen;
    audioEngineRef.current?.setAmbienceActive(screen === "play");
  }, [screen]);

  useEffect(() => () => {
    audioEngineRef.current?.dispose();
    audioEngineRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  const applyAudioPreferences = (next: AudioPreferences) => {
    audioPreferencesRef.current = next;
    setAudioPreferences(next);
    storeAudioPreferences(next);
    audioEngineRef.current?.setPreferences(next);
  };

  const playAudioCue = (cue: AudioCue) => {
    if (!audioPreferencesRef.current.enabled) return;
    pendingAudioCueRef.current = cue;
    let context = audioContextRef.current;
    if (!context || context.state === "closed") {
      try {
        context = new AudioContext({ latencyHint: "interactive" });
        audioContextRef.current = context;
      } catch {
        setAudioStatus(typeof AudioContext === "undefined" ? "unsupported" : "error");
        return;
      }
    }
    const resume = context.state === "suspended" ? context.resume() : Promise.resolve();
    if (audioEngineRef.current) {
      void resume.then(() => {
        const pending = pendingAudioCueRef.current;
        pendingAudioCueRef.current = null;
        audioEngineRef.current?.setPreferences(audioPreferencesRef.current);
        audioEngineRef.current?.setAmbienceActive(screenRef.current === "play");
        if (pending) { audioEngineRef.current?.playCue(pending); setLastAudioCue(pending); }
        setAudioStatus("ready");
      }).catch(() => setAudioStatus("error"));
      return;
    }
    if (audioLoadingRef.current) return;
    setAudioStatus("starting");
    audioLoadingRef.current = Promise.all([resume, import("./audioEngine")]).then(([, module]) => {
      if (audioEngineRef.current) return;
      const engine = new module.ShiAudioEngine(context!, audioPreferencesRef.current);
      audioEngineRef.current = engine;
      engine.setAmbienceActive(screenRef.current === "play");
      if (!audioPreferencesRef.current.enabled) {
        pendingAudioCueRef.current = null;
        setAudioStatus("off");
        return;
      }
      const pending = pendingAudioCueRef.current;
      pendingAudioCueRef.current = null;
      if (pending) { engine.playCue(pending); setLastAudioCue(pending); }
      setAudioStatus("ready");
    }).catch(() => {
      setAudioStatus("error");
    }).finally(() => { audioLoadingRef.current = null; });
  };

  const setAudioEnabled = (enabled: boolean) => {
    const next = { ...audioPreferencesRef.current, enabled };
    applyAudioPreferences(next);
    if (enabled) {
      setAudioStatus("armed");
      playAudioCue("drawer");
    } else {
      pendingAudioCueRef.current = null;
      setAudioStatus("off");
      setLastAudioCue("none");
    }
  };

  const setAudioLevel = (bus: "ambience" | "effects", value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(audioCaps[bus], value)) : audioDefaults[bus];
    applyAudioPreferences({ ...audioPreferencesRef.current, [bus]: safeValue });
  };

  const choose = (choice: Choice) => {
    if (resolution || drawer || !canChoose(choice, state.resources)) return;
    const result = resolveChoice(campaign, state, choice.id);
    setResolution(result);
    setState(result.state);
    playAudioCue(result.state.completed ? (result.state.failureReason ? "failure" : "ending") : "commit");
  };

  const openDrawer = (next: "sources" | "record" | "guide" | "audio") => {
    if (!drawer) {
      const active = document.activeElement;
      returnFocusRef.current = active instanceof HTMLElement && active !== document.body && active !== document.documentElement ? active : null;
    }
    setDrawer(next);
    playAudioCue("drawer");
  };

  const enterPlay = () => {
    screenRef.current = "play";
    setScreen("play");
    if (audioPreferencesRef.current.enabled) playAudioCue("drawer");
    if (!hasSave && localStorage.getItem(ONBOARDING_KEY) !== "complete") openDrawer("guide");
  };

  const closeTransient = () => {
    if (drawer === "guide") localStorage.setItem(ONBOARDING_KEY, "complete");
    const returnTarget = returnFocusRef.current;
    returnFocusRef.current = null;
    setDrawer(null);
    setResolution(null);
    playAudioCue("close");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const story = document.querySelector<HTMLElement>(".story-panel");
      const target = returnTarget?.isConnected ? returnTarget : story;
      target?.focus({ preventScroll: true });
      if (document.activeElement !== target) story?.focus({ preventScroll: true });
    }));
  };

  const focusChoice = (index: number) => {
    setSelectedChoiceIndex(index);
    window.requestAnimationFrame(() => {
      const card = choiceRefs.current[index];
      card?.focus({ preventScroll: true });
      card?.scrollIntoView?.({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    });
  };

  const moveChoice = (step: -1 | 1) => {
    const enabled = node.choices.map((choice, index) => canChoose(choice, state.resources) ? index : -1).filter((index) => index >= 0);
    if (enabled.length === 0) return;
    const current = enabled.indexOf(selectedChoiceIndex);
    const next = current < 0 ? enabled[0]! : enabled[(current + step + enabled.length) % enabled.length]!;
    focusChoice(next);
    playAudioCue("select");
  };

  const moveMapInspection = (step: -1 | 1) => {
    const current = campaign.sites.findIndex((site) => site.id === mapSiteId);
    const next = current < 0 ? 0 : (current + step + campaign.sites.length) % campaign.sites.length;
    setMapSiteId(campaign.sites[next]!.id);
    playAudioCue("inspect");
  };

  const openNodeSources = () => {
    setSourceSiteId(null);
    setMapSiteId(null);
    openDrawer("sources");
  };

  const openSiteEvidence = (site: MapSite) => {
    setSourceSiteId(site.id);
    openDrawer("sources");
  };

  const handleGamepad = (command: GamepadCommand) => {
    if (screen === "title") {
      if (command === "confirm") beginButtonRef.current?.click();
      return;
    }
    if (drawer) {
      if (command === "back" || (command === "confirm" && drawer === "guide")) closeTransient();
      else if (command === "guide") {
        if (drawer === "guide") closeTransient(); else openDrawer("guide");
      }
      else if (command === "record") { if (drawer === "record") closeTransient(); else openDrawer("record"); }
      else if (command === "sources") {
        if (drawer === "sources") closeTransient(); else openNodeSources();
      }
      else if (command === "map") { returnFocusRef.current = null; setDrawer(null); setMapSiteId(node.siteId); }
      return;
    }
    if (resolution) {
      if (command === "back" || command === "confirm") closeTransient();
      return;
    }
    if (mapSiteId) {
      if (command === "back" || command === "map") { setMapSiteId(null); setSourceSiteId(null); return; }
      if (command === "previous") { moveMapInspection(-1); return; }
      if (command === "next") { moveMapInspection(1); return; }
      if (command === "confirm" || command === "sources") {
        const site = campaign.sites.find((candidate) => candidate.id === mapSiteId);
        if (site) openSiteEvidence(site);
        return;
      }
      if (command === "guide") { openDrawer("guide"); return; }
      if (command === "record") { openDrawer("record"); return; }
      return;
    }
    if (command === "guide") { openDrawer("guide"); return; }
    if (command === "record") { openDrawer("record"); return; }
    if (command === "sources") { openNodeSources(); return; }
    if (command === "map") { setMapSiteId(node.siteId); return; }
    if (state.completed) {
      if (command === "confirm") endingRestartRef.current?.click();
      return;
    }
    if (command === "previous") { moveChoice(-1); return; }
    if (command === "next") { moveChoice(1); return; }
    if (command === "confirm") {
      const choice = node.choices[selectedChoiceIndex];
      if (choice && canChoose(choice, state.resources)) choose(choice);
    }
  };

  const controllerConnected = useGamepad(handleGamepad);

  useEffect(() => {
    const firstEnabled = node.choices.findIndex((choice) => canChoose(choice, state.resources));
    setSelectedChoiceIndex(firstEnabled < 0 ? 0 : firstEnabled);
    setMapSiteId(null);
    setSourceSiteId(null);
  }, [node.id]);

  useEffect(() => {
    if (screen !== "play" || state.history.length === 0) return;
    const frame = window.requestAnimationFrame(() => storyRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [node.id, screen, state.history.length]);

  useEffect(() => {
    if (!drawer) return;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const panel = document.querySelector<HTMLElement>(".drawer[role='dialog']");
      if (!panel) { event.preventDefault(); return; }
      const controls = [...panel.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])")]
        .filter((element) => !element.hidden && getComputedStyle(element).display !== "none" && getComputedStyle(element).visibility !== "hidden");
      if (controls.length === 0) { event.preventDefault(); panel.focus({ preventScroll: true }); return; }
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!panel.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [drawer]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") {
        if (drawer || resolution) {
          event.preventDefault();
          closeTransient();
          return;
        }
        if (mapSiteId) {
          event.preventDefault();
          setMapSiteId(null);
          setSourceSiteId(null);
          return;
        }
      }
      if (screen !== "play" || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (event.altKey && key === "s") {
        event.preventDefault();
        if (drawer === "sources") closeTransient(); else openNodeSources();
        return;
      }
      if (event.altKey && key === "r") {
        event.preventDefault();
        if (drawer === "record") closeTransient(); else openDrawer("record");
        return;
      }
      if (event.altKey && key === "m") {
        event.preventDefault();
        setDrawer(null);
        setResolution(null);
        setSourceSiteId(null);
        setMapSiteId(mapSiteId ? null : node.siteId);
        return;
      }
      if (mapSiteId && !event.altKey) {
        if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); moveMapInspection(-1); return; }
        if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); moveMapInspection(1); return; }
        if (event.key === "Enter") {
          event.preventDefault();
          const site = campaign.sites.find((candidate) => candidate.id === mapSiteId);
          if (site) openSiteEvidence(site);
          return;
        }
      }
      if (!event.shiftKey || event.altKey || drawer || resolution || state.completed) return;
      const match = event.code.match(/^Digit([1-3])$/);
      const index = match?.[1] ? Number.parseInt(match[1], 10) - 1 : -1;
      const choice = node.choices[index];
      if (index >= 0 && choice && canChoose(choice, state.resources)) {
        event.preventDefault();
        choose(choice);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [drawer, mapSiteId, node, resolution, screen, state]);

  const clearSaves = () => {
    localStorage.removeItem(SAVE_KEY);
    for (const legacy of LEGACY_SAVE_KEYS) localStorage.removeItem(legacy);
  };

  const restart = () => {
    clearSaves();
    setState(createInitialState(campaign, state.seed));
    localStorage.setItem(DRAFT_SEED_KEY, String(state.seed));
    setResolution(null);
    setDrawer(null);
    setMapSiteId(null);
    setSourceSiteId(null);
    setScreen("play");
    setHasSave(false);
  };

  const newChronicle = () => {
    clearSaves();
    const seed = randomSeed();
    localStorage.setItem(DRAFT_SEED_KEY, String(seed));
    setState(createInitialState(campaign, seed));
    setResolution(null);
    setDrawer(null);
    setMapSiteId(null);
    setSourceSiteId(null);
    setScreen("play");
    setHasSave(false);
  };

  const toggleMotion = () => {
    setReducedMotion((current) => {
      localStorage.setItem(MOTION_KEY, String(!current));
      return !current;
    });
  };

  if (screen === "title") {
    return (
      <main className="title-screen" data-testid="shi-app" data-screen="title" data-font-status={fontStatus} data-motion={reducedMotion ? "reduced" : "full"} data-controller={controllerConnected ? "connected" : "none"} data-audio-enabled={audioPreferences.enabled ? "true" : "false"} data-audio-status={audioStatus} data-audio-cue={lastAudioCue}>
        <ThreeBackdrop reducedMotion={reducedMotion} />
        <div className="title-image" />
        <div className="title-vignette" />
        <header className="title-topbar">
          <span className="wordmark-small">SHI / 勢</span>
          <label className="language-control"><span className="sr-only">{translate(locale, "language")}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>{supportedLocales.map((item) => <option value={item} key={item}>{localeNames[item]}</option>)}</select>
          </label>
        </header>
        <section className="title-copy">
          <p className="eyebrow">{translate(locale, "chapter")}</p>
          <div className="seal-title"><span className="hanzi">勢</span><div><h1>SHI</h1><p>{localize(campaign.title, locale).replace(/^SHI\s*[—-]\s*/i, "")}</p></div></div>
          <blockquote>{translate(locale, "opening")}</blockquote>
          <p className="title-note">{translate(locale, "openingNote")}</p>
          <div className="title-actions">
            <button className="primary-button" data-testid="begin-game" ref={beginButtonRef} onClick={enterPlay}>{hasSave ? translate(locale, "continue") : translate(locale, "begin")} <span>→</span></button>
            {hasSave && <button className="text-button" onClick={newChronicle}>{translate(locale, "newGame")}</button>}
          </div>
        </section>
        <footer className="title-footer"><span>209 BCE</span><span>DAZE VILLAGE · 大澤鄉</span>{controllerConnected && <span className="controller-status">● {translate(locale, "controllerReady")}</span>}<button data-testid="title-audio-toggle" className={audioPreferences.enabled ? "active" : ""} aria-pressed={audioPreferences.enabled} onClick={() => setAudioEnabled(!audioPreferences.enabled)}>{translateSound(locale, audioPreferences.enabled ? "on" : "off")}</button><button className={reducedMotion ? "active" : ""} onClick={toggleMotion}>{translate(locale, "reducedMotion")}</button></footer>
      </main>
    );
  }

  return (
    <main className={`game-shell ${state.completed ? "is-complete" : ""}`} data-testid="shi-app" data-screen="play" data-font-status={fontStatus} data-motion={reducedMotion ? "reduced" : "full"} data-node-id={node.id} data-save-version={currentSaveVersion} data-seed={formatSeed(state.seed)} data-condition-id={activeCondition.id} data-controller={controllerConnected ? "connected" : "none"} data-audio-enabled={audioPreferences.enabled ? "true" : "false"} data-audio-status={audioStatus} data-audio-cue={lastAudioCue}>
      <ThreeBackdrop reducedMotion={reducedMotion} />
      <div className="game-stage" data-testid="game-stage" inert={Boolean(drawer)}>
      <header className="game-header">
        <button className="brand-button" onClick={() => setScreen("title")} aria-label="SHI title screen"><span>勢</span><div><strong>SHI</strong><small>{localize(campaign.subtitle, locale)}</small></div></button>
        <div className="header-actions">
          <span className="save-state"><i />{translate(locale, "save")}</span>
          <button className={`header-button audio-button ${audioPreferences.enabled ? "active" : ""}`} data-icon="◌" data-testid="audio-toggle" aria-label={translateSound(locale, "sound")} aria-pressed={audioPreferences.enabled} onClick={() => drawer === "audio" ? closeTransient() : openDrawer("audio")}><span className="header-button-label">{translateSound(locale, "sound")}</span></button>
          <button className="header-button guide-button" data-icon="?" data-testid="guide-toggle" aria-label={translate(locale, "guide")} onClick={() => drawer === "guide" ? closeTransient() : openDrawer("guide")}><span className="header-button-label">{translate(locale, "guide")}</span></button>
          <button className="header-button" data-icon="▤" data-testid="record-toggle" aria-label={translate(locale, "record")} aria-keyshortcuts="Alt+R" onClick={() => drawer === "record" ? closeTransient() : openDrawer("record")}><span className="header-button-label">{translate(locale, "record")}</span> <b>{state.history.length}</b></button>
          <button className="header-button" data-icon="◫" data-testid="sources-toggle" aria-label={translate(locale, "sources")} aria-keyshortcuts="Alt+S" onClick={() => drawer === "sources" ? closeTransient() : openNodeSources()}><span className="header-button-label">{translate(locale, "sources")}</span> <b>{node.sourceRefs.length}</b></button>
          <select className="header-select" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={translate(locale, "language")}>{supportedLocales.map((item) => <option value={item} key={item}>{localeNames[item]}</option>)}</select>
        </div>
      </header>

      <ResourceRail resources={state.resources} locale={locale} />

      <div className="game-grid">
        <div className="map-column">
          <Suspense fallback={<div className="map-card map-loading" aria-busy="true" />}><StrategicMap campaign={campaign} locale={locale} activeSiteId={node.siteId} selectedSiteId={mapSiteId} onSelectSite={(siteId) => { setMapSiteId(siteId); playAudioCue("inspect"); }} onCloseInspection={() => { setMapSiteId(null); setSourceSiteId(null); playAudioCue("close"); }} onOpenEvidence={openSiteEvidence} /></Suspense>
          <div className="map-legend"><span><i className="dot active" />{localize(campaign.sites.find((site) => site.id === node.siteId)!.name, locale)}</span><span>{node.dateLabel && localize(node.dateLabel, locale)}</span></div>
        </div>

        <article className="story-panel" ref={storyRef} tabIndex={-1} aria-labelledby="story-title">
          <div className="story-number"><span>{String(nodeNumber).padStart(2, "0")}</span><i /></div>
          <p className="date-line" dir={contentDirection(node.dateLabel, locale)}>{localize(node.dateLabel, locale)}</p>
          <h1 id="story-title" dir={contentDirection(node.title, locale)}>{localize(node.title, locale)}</h1>
          <p className="context" dir={contentDirection(node.context, locale)}>{localize(node.context, locale)}</p>
          <section className="field-signal" data-testid="field-signal" aria-label={translate(locale, "fieldSignal")}>
            <div className="field-signal-head"><span>{translate(locale, "fieldSignal")} · {translate(locale, "reconstruction")}</span><code>{translate(locale, "chronicleSeed")} {formatSeed(state.seed)}</code></div>
            <h2 dir={contentDirection(activeCondition.title, locale)}>{localize(activeCondition.title, locale)}</h2>
            <p dir={contentDirection(activeCondition.signal, locale)}>{localize(activeCondition.signal, locale)}</p>
            <div className="field-effects">{Object.entries(activeCondition.effects).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>
          </section>
          <blockquote className="dialogue">
            <p dir={contentDirection(node.dialogue, locale)}>{localize(node.dialogue, locale)}</p>
            <footer><strong dir={contentDirection(speaker.name, locale)}>{localize(speaker.name, locale)}</strong><span dir={contentDirection(speaker.role, locale)}>{localize(speaker.role, locale)}</span>{!speaker.historical && <em>{translate(locale, "reconstruction")}</em>}</footer>
          </blockquote>
          <button className="source-link" onClick={openNodeSources}><span>◫</span>{translate(locale, "openSources")} · {node.sourceRefs.length}</button>
        </article>
      </div>

      {resolution && (
        <div className="resolution-banner" data-testid="resolution" role="status" aria-live="polite">
          <div className="resolution-copy">
            <div><span>{translate(locale, "consequence")}</span><p>{localize(resolution.choice.consequence, locale)}</p></div>
            {resolution.choice.pressure && <div className="pressure-reveal"><span>{translate(locale, "pressureResponse")}</span><p dir={contentDirection(resolution.choice.pressure.reveal, locale)}>{localize(resolution.choice.pressure.reveal, locale)}</p></div>}
            <div className="field-reveal"><span>{translate(locale, "fieldApplied")}</span><p dir={contentDirection(resolution.condition.title, locale)}>{localize(resolution.condition.title, locale)}</p></div>
          </div>
          <div className="resolution-deltas">
            <div className="delta-list action-deltas">{Object.entries(resolution.playerDeltas).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>
            {Object.keys(resolution.pressureDeltas).length > 0 && <div className="delta-list pressure-deltas">{Object.entries(resolution.pressureDeltas).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>}
            {Object.keys(resolution.fieldDeltas).length > 0 && <div className="delta-list field-deltas">{Object.entries(resolution.fieldDeltas).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>}
          </div>
          <button onClick={() => setResolution(null)} aria-label={translate(locale, "close")}>×</button>
        </div>
      )}

      {!state.completed ? (
        <section className="choices-panel" inert={Boolean(resolution)}>
          <div className="choices-heading"><span>{translate(locale, "choice")} · {translate(locale, "chronicleSeed")} {formatSeed(state.seed)}</span><small aria-live="polite">{translate(locale, "turn")} {state.history.length + 1} · {controllerConnected ? `${translate(locale, "controllerReady")} · ${translate(locale, "controllerHint")} · Y/△ · M` : translate(locale, "keyboardHint")}</small></div>
          <div className="choices-grid">
            {node.choices.map((choice, index) => {
              const enabled = canChoose(choice, state.resources);
              return (
                <button className={`choice-card ${controllerConnected && selectedChoiceIndex === index ? "is-gamepad-selected" : ""}`} data-choice-id={choice.id} aria-keyshortcuts={`Shift+${index + 1}`} key={choice.id} ref={(element) => { choiceRefs.current[index] = element; }} onFocus={() => setSelectedChoiceIndex(index)} onClick={() => { setSelectedChoiceIndex(index); choose(choice); }} disabled={!enabled}>
                  <span className="choice-index">{String.fromCharCode(65 + index)}</span>
                  <div className="choice-main"><h2 dir={contentDirection(choice.label, locale)}>{localize(choice.label, locale)}</h2><p dir={contentDirection(choice.intent, locale)}>{localize(choice.intent, locale)}</p><div className="choice-reading"><span>{translate(locale, "principle")}</span><span className="choice-reading-copy" dir={contentDirection(choice.strategy, locale)}>{localize(choice.strategy, locale)}</span></div>{choice.pressure && <div className={`pressure-warning pressure-${choice.pressure.kind}`}><span>{translate(locale, "pressureForecast")}</span><p dir={contentDirection(choice.pressure.warning, locale)}>{localize(choice.pressure.warning, locale)}</p></div>}</div>
                  <div className="effects">{Object.entries(choice.effects).map(([key, value]) => <span className={`${(value ?? 0) < 0 ? "negative" : "positive"} ${key === "danger" ? "risk" : ""}`} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>
                  {!enabled && <span className="locked">{translate(locale, "locked")} {Object.entries(choice.requirements?.min ?? {}).map(([key, value]) => `${translate(locale, key as ResourceKey)} ${value}`).join(" · ")}</span>}
                  <span className="choice-arrow">↗</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="ending-panel">
          <span className="ending-seal">{state.failureReason ? "止" : ending === "wildfire" ? "火" : ending === "deep-roots" ? "根" : "觀"}</span>
          <div>
            <p className="eyebrow">{state.failureReason ? translate(locale, "failed") : translate(locale, "complete")}</p>
            <h2>{state.failureReason ? translate(locale, state.failureReason) : translate(locale, ending === "wildfire" ? "endingWildfire" : ending === "deep-roots" ? "endingRoots" : "endingWatchful")}</h2>
            <p>{state.failureReason ? translate(locale, state.failureReason) : translate(locale, ending === "wildfire" ? "endingWildfireText" : ending === "deep-roots" ? "endingRootsText" : "endingWatchfulText")}</p>
          </div>
          <button className="primary-button" ref={endingRestartRef} onClick={restart}>{translate(locale, "restart")} <span>↺</span></button>
        </section>
      )}
      </div>

      {drawer === "guide" && <Suspense fallback={null}><FieldGuide locale={locale} controllerConnected={controllerConnected} onClose={closeTransient} /></Suspense>}
      {drawer === "sources" && <Suspense fallback={null}><SourceLedger campaign={campaign} locale={locale} activeIds={sourceSite?.sourceRefs ?? node.sourceRefs} activeClaimIds={sourceSite?.claimRefs ?? node.claimRefs} contextTitle={sourceSite ? localize(sourceSite.name, locale) : undefined} onClose={closeTransient} /></Suspense>}
      {drawer === "audio" && <Suspense fallback={null}><AudioSettings locale={locale} preferences={audioPreferences} status={audioStatus} onEnabledChange={setAudioEnabled} onLevelChange={setAudioLevel} onPreview={() => playAudioCue("commit")} onClose={closeTransient} /></Suspense>}
      {drawer === "record" && (
        <aside className="drawer record-drawer" data-testid="record-drawer" role="dialog" aria-modal="true" aria-label={translate(locale, "record")}>
          <div className="drawer-head"><div><span className="eyebrow">SHI</span><h2>{translate(locale, "record")}</h2></div><button className="icon-button" autoFocus onClick={closeTransient} aria-label={translate(locale, "close")}>×</button></div>
          {state.history.length === 0 ? <p className="empty-record">{translate(locale, "historyEmpty")}</p> : (
            <ol className="record-list">{state.history.map((record, index) => {
              const pastNode = getNode(campaign, record.nodeId);
              const pastChoice = pastNode.choices.find((choice) => choice.id === record.choiceId)!;
              const pastCondition = pastNode.conditions.find((condition) => condition.id === record.conditionId)!;
              return <li key={`${record.nodeId}-${record.choiceId}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{localize(pastNode.title, locale)}</small><strong>{localize(pastChoice.label, locale)}</strong><p>{localize(pastChoice.consequence, locale)}</p>{pastChoice.pressure && <p className="record-pressure"><b>{translate(locale, "pressureResponse")}</b>{localize(pastChoice.pressure.reveal, locale)}</p>}<p className="record-field"><b>{translate(locale, "fieldApplied")}</b>{localize(pastCondition.title, locale)} · {Object.entries(record.conditionEffects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ")}</p></div></li>;
            })}</ol>
          )}
          <button className="text-button restart-button" onClick={restart}>{translate(locale, "restart")}</button>
        </aside>
      )}
      {drawer && <button className="drawer-scrim" onClick={closeTransient} aria-label={translate(locale, "close")} />}
    </main>
  );
}
