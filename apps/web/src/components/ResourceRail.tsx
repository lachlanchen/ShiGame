import { resourceKeys, type Locale, type Resources } from "@shi/game-core";
import { translate } from "../i18n";

export function ResourceRail({ resources, locale }: { resources: Resources; locale: Locale }) {
  return (
    <section className="resource-rail" aria-label={translate(locale, "strategicState")}>
      {resourceKeys.map((key) => {
        const value = resources[key];
        const danger = key === "danger";
        return (
          <div className={`resource ${danger ? "danger" : ""}`} key={key}>
            <div className="resource-label"><span>{translate(locale, key)}</span><strong>{value}</strong></div>
            <div className="meter" role="meter" aria-label={translate(locale, key)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
              <span style={{ width: `${value}%` }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
