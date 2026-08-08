import { localize, type Campaign, type Locale, type MapSite } from "@shi/game-core";
import { translate } from "../i18n";
import { translateMap, type MapUiKey } from "../map-i18n";

export function MapIntel({
  campaign,
  locale,
  site,
  statusKey,
  onClose,
  onOpenEvidence,
}: {
  campaign: Campaign;
  locale: Locale;
  site: MapSite;
  statusKey: MapUiKey;
  onClose: () => void;
  onOpenEvidence: (site: MapSite) => void;
}) {
  return (
    <article className={`map-intel site-intel-${site.status}`} data-testid="map-intel" aria-live="polite">
      <div className="map-intel-head">
        <div><span>{translateMap(locale, statusKey)}</span><h2 dir="auto">{localize(site.name, locale)}</h2></div>
        <button type="button" onClick={onClose} aria-label={translate(locale, "close")}>×</button>
      </div>
      <p className="map-intel-summary" dir={locale === "ar" && !site.summary.ar ? "ltr" : undefined}>{localize(site.summary, locale)}</p>
      <div className="map-intel-uncertainty">
        <b>{translateMap(locale, "uncertainty")}</b>
        <p dir={locale === "ar" && !site.uncertainty.ar ? "ltr" : undefined}>{localize(site.uncertainty, locale)}</p>
      </div>
      <footer>
        <span>{campaign.sites.findIndex((candidate) => candidate.id === site.id) + 1} / {campaign.sites.length} · ← →</span>
        <button type="button" onClick={() => onOpenEvidence(site)}>{translate(locale, "openSources")} · {site.sourceRefs.length}</button>
      </footer>
    </article>
  );
}
