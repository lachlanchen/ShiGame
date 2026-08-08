import { localize, type Campaign, type Locale, type SourceRef } from "@shi/game-core";
import { translate } from "../i18n";

const statusLabel = (source: SourceRef, locale: Locale) => {
  if (source.claimStatus === "dramatic-reconstruction") return translate(locale, "reconstruction");
  if (source.claimStatus === "later-compilation") return translate(locale, "later");
  return translate(locale, "primary");
};

export function SourceLedger({ campaign, locale, activeIds, onClose }: { campaign: Campaign; locale: Locale; activeIds: string[]; onClose: () => void }) {
  const sources = campaign.sources.filter((source) => activeIds.includes(source.id));
  return (
    <aside className="drawer" data-testid="sources-drawer" role="dialog" aria-modal="true" aria-label={translate(locale, "sources")}>
      <div className="drawer-head">
        <div><span className="eyebrow">{translate(locale, "sourceBasis")}</span><h2>{translate(locale, "sources")}</h2></div>
        <button className="icon-button" autoFocus onClick={onClose} aria-label={translate(locale, "close")}>×</button>
      </div>
      <div className="source-list">
        {sources.map((source) => (
          <article className={`source source-${source.claimStatus}`} key={source.id}>
            <span className="source-status">{statusLabel(source, locale)}</span>
            <h3 dir="auto">{source.work}</h3>
            <p className="source-section" dir="auto">{source.section}{source.date ? ` · ${source.date}` : ""}</p>
            <p dir={locale === "ar" && !source.note.ar ? "ltr" : undefined}>{localize(source.note, locale)}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
