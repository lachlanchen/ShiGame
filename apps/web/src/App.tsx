import { useEffect, useMemo, useState } from "react";
import {
  canChoose,
  createInitialState,
  deriveEnding,
  getNode,
  localize,
  resolveChoice,
  supportedLocales,
  type Campaign,
  type Choice,
  type ChoiceResolution,
  type GameState,
  type Locale,
  type LocalizedText,
  type ResourceKey,
} from "@shi/game-core";
import campaignJson from "./generated/chapter-01-daze.json";
import { isRtl, localeNames, translate } from "./i18n";
import { ResourceRail } from "./components/ResourceRail";
import { SourceLedger } from "./components/SourceLedger";
import { StrategicMap } from "./components/StrategicMap";
import { ThreeBackdrop } from "./components/ThreeBackdrop";

const campaign = campaignJson as unknown as Campaign;
const SAVE_KEY = "shi.chapter-01.save.v1";
const LOCALE_KEY = "shi.locale";
const MOTION_KEY = "shi.reduced-motion";

function readSavedState(): GameState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as GameState | null;
    if (!parsed || parsed.campaignId !== campaign.id || !campaign.nodes.some((node) => node.id === parsed.currentNodeId)) return null;
    return parsed;
  } catch {
    return null;
  }
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
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [state, setState] = useState<GameState>(() => readSavedState() ?? createInitialState(campaign));
  const [screen, setScreen] = useState<"title" | "play">("title");
  const [drawer, setDrawer] = useState<"sources" | "record" | null>(null);
  const [resolution, setResolution] = useState<ChoiceResolution | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem(MOTION_KEY) === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const hasSave = useMemo(() => readSavedState() !== null, []);
  const node = getNode(campaign, state.currentNodeId);
  const speaker = campaign.characters.find((character) => character.id === node.speakerId)!;
  const ending = state.completed ? deriveEnding(state) : null;
  const nodeNumber = campaign.nodes.findIndex((candidate) => candidate.id === node.id) + 1;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (state.history.length > 0) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const choose = (choice: Choice) => {
    if (!canChoose(choice, state.resources)) return;
    const result = resolveChoice(campaign, state, choice.id);
    setResolution(result);
    setState(result.state);
  };

  const restart = () => {
    localStorage.removeItem(SAVE_KEY);
    setState(createInitialState(campaign));
    setResolution(null);
    setDrawer(null);
    setScreen("play");
  };

  const toggleMotion = () => {
    setReducedMotion((current) => {
      localStorage.setItem(MOTION_KEY, String(!current));
      return !current;
    });
  };

  if (screen === "title") {
    return (
      <main className="title-screen">
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
            <button className="primary-button" onClick={() => setScreen("play")}>{hasSave ? translate(locale, "continue") : translate(locale, "begin")} <span>→</span></button>
            {hasSave && <button className="text-button" onClick={restart}>{translate(locale, "newGame")}</button>}
          </div>
        </section>
        <footer className="title-footer"><span>209 BCE</span><span>DAZE VILLAGE · 大澤鄉</span><button className={reducedMotion ? "active" : ""} onClick={toggleMotion}>{translate(locale, "reducedMotion")}</button></footer>
      </main>
    );
  }

  return (
    <main className={`game-shell ${state.completed ? "is-complete" : ""}`}>
      <ThreeBackdrop reducedMotion={reducedMotion} />
      <header className="game-header">
        <button className="brand-button" onClick={() => setScreen("title")} aria-label="SHI title screen"><span>勢</span><div><strong>SHI</strong><small>{localize(campaign.subtitle, locale)}</small></div></button>
        <div className="header-actions">
          <span className="save-state"><i />{translate(locale, "save")}</span>
          <button className="header-button" data-icon="▤" aria-label={translate(locale, "record")} onClick={() => setDrawer(drawer === "record" ? null : "record")}><span className="header-button-label">{translate(locale, "record")}</span> <b>{state.history.length}</b></button>
          <button className="header-button" data-icon="◫" aria-label={translate(locale, "sources")} onClick={() => setDrawer(drawer === "sources" ? null : "sources")}><span className="header-button-label">{translate(locale, "sources")}</span> <b>{node.sourceRefs.length}</b></button>
          <select className="header-select" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={translate(locale, "language")}>{supportedLocales.map((item) => <option value={item} key={item}>{localeNames[item]}</option>)}</select>
        </div>
      </header>

      <ResourceRail resources={state.resources} locale={locale} />

      <div className="game-grid">
        <div className="map-column">
          <StrategicMap campaign={campaign} locale={locale} activeSiteId={node.siteId} />
          <div className="map-legend"><span><i className="dot active" />{localize(campaign.sites.find((site) => site.id === node.siteId)!.name, locale)}</span><span>{node.dateLabel && localize(node.dateLabel, locale)}</span></div>
        </div>

        <article className="story-panel">
          <div className="story-number"><span>{String(nodeNumber).padStart(2, "0")}</span><i /></div>
          <p className="date-line" dir={contentDirection(node.dateLabel, locale)}>{localize(node.dateLabel, locale)}</p>
          <h1 dir={contentDirection(node.title, locale)}>{localize(node.title, locale)}</h1>
          <p className="context" dir={contentDirection(node.context, locale)}>{localize(node.context, locale)}</p>
          <blockquote className="dialogue">
            <p dir={contentDirection(node.dialogue, locale)}>{localize(node.dialogue, locale)}</p>
            <footer><strong dir={contentDirection(speaker.name, locale)}>{localize(speaker.name, locale)}</strong><span dir={contentDirection(speaker.role, locale)}>{localize(speaker.role, locale)}</span>{!speaker.historical && <em>{translate(locale, "reconstruction")}</em>}</footer>
          </blockquote>
          <button className="source-link" onClick={() => setDrawer("sources")}><span>◫</span>{translate(locale, "openSources")} · {node.sourceRefs.length}</button>
        </article>
      </div>

      {resolution && !state.completed && (
        <div className="resolution-banner" role="status">
          <div><span>{translate(locale, "consequence")}</span><p>{localize(resolution.choice.consequence, locale)}</p></div>
          <div className="delta-list">{Object.entries(resolution.deltas).map(([key, value]) => <span className={key === "danger" ? "risk" : ""} key={key}>{effectLabel(key as ResourceKey, value ?? 0, locale)}</span>)}</div>
          <button onClick={() => setResolution(null)} aria-label={translate(locale, "close")}>×</button>
        </div>
      )}

      {!state.completed ? (
        <section className="choices-panel">
          <div className="choices-heading"><span>{translate(locale, "choice")}</span><small>{translate(locale, "turn")} {state.history.length + 1} {translate(locale, "of")} 3</small></div>
          <div className="choices-grid">
            {node.choices.map((choice, index) => {
              const enabled = canChoose(choice, state.resources);
              return (
                <button className="choice-card" key={choice.id} onClick={() => choose(choice)} disabled={!enabled}>
                  <span className="choice-index">{String.fromCharCode(65 + index)}</span>
                  <div className="choice-main"><h2 dir={contentDirection(choice.label, locale)}>{localize(choice.label, locale)}</h2><p dir={contentDirection(choice.intent, locale)}>{localize(choice.intent, locale)}</p><div className="choice-reading"><span>{translate(locale, "principle")}</span><span className="choice-reading-copy" dir={contentDirection(choice.strategy, locale)}>{localize(choice.strategy, locale)}</span></div></div>
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
          <button className="primary-button" onClick={restart}>{translate(locale, "restart")} <span>↺</span></button>
        </section>
      )}

      {drawer === "sources" && <SourceLedger campaign={campaign} locale={locale} activeIds={node.sourceRefs} onClose={() => setDrawer(null)} />}
      {drawer === "record" && (
        <aside className="drawer record-drawer">
          <div className="drawer-head"><div><span className="eyebrow">SHI</span><h2>{translate(locale, "record")}</h2></div><button className="icon-button" onClick={() => setDrawer(null)}>×</button></div>
          {state.history.length === 0 ? <p className="empty-record">{translate(locale, "historyEmpty")}</p> : (
            <ol className="record-list">{state.history.map((record, index) => {
              const pastNode = getNode(campaign, record.nodeId);
              const pastChoice = pastNode.choices.find((choice) => choice.id === record.choiceId)!;
              return <li key={`${record.nodeId}-${record.choiceId}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{localize(pastNode.title, locale)}</small><strong>{localize(pastChoice.label, locale)}</strong><p>{localize(pastChoice.consequence, locale)}</p></div></li>;
            })}</ol>
          )}
          <button className="text-button restart-button" onClick={restart}>{translate(locale, "restart")}</button>
        </aside>
      )}
      {drawer && <button className="drawer-scrim" onClick={() => setDrawer(null)} aria-label={translate(locale, "close")} />}
    </main>
  );
}
