import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { localize } from "@shi/game-core";
import { translate } from "../i18n";
import type { ResolvedConsequenceScene } from "./ResolvedConsequenceScene";

type Props = ComponentProps<typeof ResolvedConsequenceScene>;
type Scene = typeof ResolvedConsequenceScene;
type Loader = () => Promise<{ ResolvedConsequenceScene: Scene }>;
let readyScene: Scene | null = null;
const loadScene: Loader = () => import("./ResolvedConsequenceScene").then(module => {
  readyScene = module.ResolvedConsequenceScene;
  return module;
});

/** The committed outcome is already in memory: reading it must not depend on
 * downloading presentation code. A failed import leaves the written route usable. */
export function ConsequencePresentation({ load = loadScene, ...props }: Props & { load?: Loader }) {
  const [scene, setScene] = useState<Scene | null>(() => load === loadScene ? readyScene : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void load().then(module => { if (active) setScene(() => module.ResolvedConsequenceScene); },
      () => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [load]);
  const Scene = scene;
  return Scene ? <Scene {...props} /> : <ReadableConsequence {...props} failed={failed} />;
}

function ReadableConsequence({ resolution, titleOverride, locale, onContinue, saveError, failed }: Props & { failed: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const exited = useRef(false);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, []);
  const finish = () => {
    if (exited.current) return;
    exited.current = true;
    if (onContinue() === false) exited.current = false;
  };
  const title = titleOverride ?? resolution.choice.label;
  return <div className="consequence-reader" role="dialog" aria-modal="true"
    aria-labelledby="consequence-reader-title" aria-describedby="consequence-reader-text"
    data-testid="resolution" data-presentation={failed ? "written" : "loading"}
    onKeyDown={event => {
      if (event.key === "Tab") { event.preventDefault(); button.current?.focus(); }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); }
    }}>
    <div className="consequence-reader-card">
      <div className="consequence-reader-copy">
        <span className="eyebrow">{translate(locale, "reconstruction")}</span>
        <h2 id="consequence-reader-title" tabIndex={-1} ref={heading} dir={locale === "ar" && !title.ar ? "ltr" : undefined}>{localize(title, locale)}</h2>
        <p id="consequence-reader-text" dir={locale === "ar" && !resolution.choice.consequence.ar ? "ltr" : undefined}>{localize(resolution.choice.consequence, locale)}</p>
        {saveError && <p role="alert">{saveError}</p>}
      </div>
      <footer><button className="primary-button" data-testid="resolution-continue" ref={button} onClick={finish}>{translate(locale, "continue")}</button></footer>
    </div>
  </div>;
}
