import { lazy, Suspense } from "react";
import { localize, type Campaign, type Locale, type MapSite } from "@shi/game-core";
import { translateMap, type MapUiKey } from "../map-i18n";

const MapIntel = lazy(() => import("./MapIntel").then((module) => ({ default: module.MapIntel })));

const statusKey = (site: MapSite): MapUiKey => {
  if (site.status === "reported") return "reportedGround";
  if (site.status === "reference") return "referenceOnly";
  return "knownGround";
};

export function StrategicMap({
  campaign,
  locale,
  activeSiteId,
  selectedSiteId,
  onSelectSite,
  onCloseInspection,
  onOpenEvidence,
}: {
  campaign: Campaign;
  locale: Locale;
  activeSiteId: string;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  onCloseInspection: () => void;
  onOpenEvidence: (site: MapSite) => void;
}) {
  const selected = campaign.sites.find((site) => site.id === selectedSiteId) ?? null;
  return (
    <section className={`map-card${selected ? " is-inspecting" : ""}`} aria-label={translateMap(locale, "mapIntel")}>
      <svg className="map-lines" viewBox="0 0 100 80" role="img" aria-label={translateMap(locale, "mapIntel")}>
        <defs>
          <filter id="map-glow"><feGaussianBlur stdDeviation="1.4" /></filter>
          <linearGradient id="river" x1="0" x2="1"><stop offset="0" stopColor="#596d6c" stopOpacity=".2" /><stop offset=".5" stopColor="#9bb5b1" stopOpacity=".75" /><stop offset="1" stopColor="#596d6c" stopOpacity=".2" /></linearGradient>
        </defs>
        <path className="river" d="M0 47 C18 39, 25 61, 40 52 S66 27, 100 42" />
        <path className="road" d="M17 27 C34 35, 41 43, 50 49 S61 58, 69 62" />
        <path className="road secondary" d="M50 49 C67 44, 76 36, 83 30" />
        <path className="road secondary" d="M50 49 C55 43, 57 39, 59 36" />
      </svg>
      <div className="map-sites">
        {campaign.sites.map((site) => {
          const active = site.id === activeSiteId;
          const inspected = site.id === selectedSiteId;
          return (
            <button
              type="button"
              key={site.id}
              data-site-id={site.id}
              className={`site-marker site-${site.status}${active ? " active" : ""}${inspected ? " inspected" : ""}`}
              style={{ left: `${site.x}%`, top: `${site.z / 0.8}%` }}
              aria-label={`${translateMap(locale, "inspectMap")}: ${localize(site.name, locale)} · ${translateMap(locale, statusKey(site))}`}
              aria-pressed={inspected}
              onClick={() => onSelectSite(site.id)}
            >
              <i /><span>{localize(site.name, locale)}</span>
            </button>
          );
        })}
      </div>
      <div className="map-sweep" />
      <button className="map-inspect-hint" type="button" aria-keyshortcuts="Alt+M" onClick={() => onSelectSite(activeSiteId)}>{translateMap(locale, "inspectMap")} <span>M · Y/△</span></button>
      {selected && <Suspense fallback={null}><MapIntel campaign={campaign} locale={locale} site={selected} statusKey={statusKey(selected)} onClose={onCloseInspection} onOpenEvidence={onOpenEvidence} /></Suspense>}
    </section>
  );
}
