import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@shi/game-core";
import { cinemaLabel } from "../cinema-labels";
import { translate } from "../i18n";
import { SilentFilm, type SilentFilmAsset } from "./SilentFilm";
import "./ConsequenceScene.css";

/** Receives resolved text, never a choice resolver, state setter or save writer.
 * Remount per committed turn. Completion, skip and media errors cannot issue orders. */
export function ConsequenceScene({ locale, title, titleDirection, consequence, textDirection, children, reducedMotion, film, onContinue }: {
  locale: Locale;
  title: string;
  titleDirection?: "ltr";
  consequence: string;
  textDirection?: "ltr";
  children: ReactNode;
  reducedMotion: boolean;
  film?: SilentFilmAsset;
  onContinue: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const exitedRef = useRef(false);
  const showFilm = Boolean(film && !reducedMotion);
  const finish = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onContinue();
  };

  useLayoutEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = priorOverflow; };
  }, []);

  return (
    <div className="resolution-banner consequence-scene" data-testid="resolution" data-motion={reducedMotion ? "reduced" : "full"}
      role="dialog" aria-modal="true" aria-labelledby="consequence-title" aria-describedby="consequence-text"
      ref={panelRef} onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); return; }
        if (event.key !== "Tab") return;
        const panel = panelRef.current;
        const controls = [...(panel?.querySelectorAll<HTMLElement>("button:not(:disabled), summary") ?? [])];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}>
      <div className="consequence-card">
        <div className="consequence-scroll">
        <header className="consequence-heading">
          <p className="consequence-eyebrow">{cinemaLabel(locale, "aftermath")} · {translate(locale, "reconstruction")}</p>
          <h2 id="consequence-title" ref={titleRef} tabIndex={-1} dir={titleDirection}>{title}</h2>
        </header>
        <div className="consequence-body">
          {showFilm && film && <SilentFilm key={film.src} asset={film} locale={locale} />}
          <p className="consequence-prose" id="consequence-text" dir={textDirection}>{consequence}</p>
          <details className="consequence-details" data-testid="resolution-details">
            <summary>{cinemaLabel(locale, "changes")}</summary>
            <div className="consequence-ledger">{children}</div>
          </details>
        </div>
        </div>
        <footer className="consequence-footer">
          <button className="primary-button" data-testid="resolution-continue" onClick={finish}>
            {translate(locale, "continue")} <span aria-hidden="true">→</span>
          </button>
          {showFilm && <button className="text-button" onClick={finish}>{cinemaLabel(locale, "skip")}</button>}
        </footer>
      </div>
    </div>
  );
}
