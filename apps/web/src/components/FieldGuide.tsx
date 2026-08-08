import type { Locale } from "@shi/game-core";
import { translate } from "../i18n";

interface FieldGuideProps {
  locale: Locale;
  controllerConnected: boolean;
  onClose: () => void;
}

export function FieldGuide({ locale, controllerConnected, onClose }: FieldGuideProps) {
  return (
    <aside className="drawer guide-drawer" data-testid="guide-drawer" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="drawer-head">
        <div><span className="eyebrow">SHI · {translate(locale, "guide")}</span><h2 id="guide-title">{translate(locale, "guideTitle")}</h2></div>
        <button className="icon-button" autoFocus onClick={onClose} aria-label={translate(locale, "close")}>×</button>
      </div>
      <p className="guide-intro">{translate(locale, "guideIntro")}</p>
      <ol className="guide-steps">
        <li><span>一</span><div><h3>{translate(locale, "guideFieldTitle")}</h3><p>{translate(locale, "guideFieldText")}</p></div></li>
        <li><span>二</span><div><h3>{translate(locale, "guideMoveTitle")}</h3><p>{translate(locale, "guideMoveText")}</p></div></li>
        <li><span>三</span><div><h3>{translate(locale, "guideReplyTitle")}</h3><p>{translate(locale, "guideReplyText")}</p></div></li>
      </ol>
      <div className={`controller-callout ${controllerConnected ? "is-connected" : ""}`} aria-live="polite">
        <span>{controllerConnected ? translate(locale, "controllerReady") : translate(locale, "controllerOptional")}</span>
        <p>{translate(locale, "controllerHint")}</p>
      </div>
      <button className="primary-button guide-continue" data-testid="guide-continue" onClick={onClose}>{translate(locale, "guideContinue")} <span>→</span></button>
    </aside>
  );
}
