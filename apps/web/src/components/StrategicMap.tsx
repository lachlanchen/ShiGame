import { localize, type Campaign, type Locale } from "@shi/game-core";

export function StrategicMap({ campaign, locale, activeSiteId }: { campaign: Campaign; locale: Locale; activeSiteId: string }) {
  return (
    <section className="map-card" aria-label="Campaign map">
      <svg className="map-lines" viewBox="0 0 100 80" role="img" aria-label="Strategic map from Xianyang to the lower Yangtze">
        <defs>
          <filter id="map-glow"><feGaussianBlur stdDeviation="1.4" /></filter>
          <linearGradient id="river" x1="0" x2="1"><stop offset="0" stopColor="#596d6c" stopOpacity=".2" /><stop offset=".5" stopColor="#9bb5b1" stopOpacity=".75" /><stop offset="1" stopColor="#596d6c" stopOpacity=".2" /></linearGradient>
        </defs>
        <path className="river" d="M0 47 C18 39, 25 61, 40 52 S66 27, 100 42" />
        <path className="road" d="M17 27 C34 35, 41 43, 50 49 S61 58, 69 62" />
        <path className="road secondary" d="M50 49 C67 44, 76 36, 83 30" />
        <path className="road secondary" d="M50 49 C55 43, 57 39, 59 36" />
        {campaign.sites.map((site) => {
          const active = site.id === activeSiteId;
          return (
            <g key={site.id} className={`site site-${site.status}${active ? " active" : ""}`} transform={`translate(${site.x} ${site.z})`}>
              {active && <circle className="site-glow" r="6" filter="url(#map-glow)" />}
              <circle className="site-dot" r={active ? 1.7 : 1.05} />
              <text x="2.7" y="1.2">{localize(site.name, locale)}</text>
            </g>
          );
        })}
      </svg>
      <div className="map-sweep" />
    </section>
  );
}
