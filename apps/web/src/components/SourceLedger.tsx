import { localize, type Campaign, type HistoricalClaim, type Locale, type SourceRef } from "@shi/game-core";
import claimsJson from "../generated/chapter-01-claims.json";
import { translateEvidence } from "../evidence-i18n";
import { translate } from "../i18n";

const statusLabel = (source: SourceRef, locale: Locale) => {
  if (source.claimStatus === "dramatic-reconstruction") return translate(locale, "reconstruction");
  if (source.claimStatus === "later-compilation") return translate(locale, "later");
  if (source.claimStatus === "strategic-text") return translate(locale, "primary");
  return translateEvidence(locale, "received");
};

const claimStatusLabel = (claim: HistoricalClaim, locale: Locale) => {
  if (claim.reviewStatus === "specialist-review-required") return translateEvidence(locale, "specialistReview");
  if (claim.reviewStatus === "authored-reconstruction") return translateEvidence(locale, "authoredClaim");
  return translateEvidence(locale, "evidenceLocated");
};

export function SourceLedger({ campaign, locale, activeIds, activeClaimIds, onClose }: { campaign: Campaign; locale: Locale; activeIds: string[]; activeClaimIds: string[]; onClose: () => void }) {
  const sources = campaign.sources.filter((source) => activeIds.includes(source.id));
  const claims = (claimsJson as HistoricalClaim[]).filter((claim) => activeClaimIds.includes(claim.id));
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
            <p className="source-locator" dir="auto">{source.locator}</p>
            <p dir={locale === "ar" && !source.note.ar ? "ltr" : undefined}>{localize(source.note, locale)}</p>
            {source.url && <a className="source-external" href={source.url} target="_blank" rel="noreferrer">{translateEvidence(locale, "openEdition")} ↗</a>}
          </article>
        ))}
      </div>
      <section className="claim-register" aria-label={translateEvidence(locale, "claimRegister")}>
        <div className="claim-register-head"><span className="eyebrow">{translateEvidence(locale, "publicSource")}</span><h2>{translateEvidence(locale, "claimRegister")}</h2></div>
        <div className="claim-list">
          {claims.map((claim) => (
            <article className={`claim claim-${claim.reviewStatus}`} key={claim.id}>
              <div className="claim-meta"><span>{claimStatusLabel(claim, locale)}</span><code>{claim.confidence}</code></div>
              <h3 dir={locale === "ar" && !claim.statement.ar ? "ltr" : undefined}>{localize(claim.statement, locale)}</h3>
              <p className="claim-uncertainty" dir={locale === "ar" && !claim.uncertainty.ar ? "ltr" : undefined}>{localize(claim.uncertainty, locale)}</p>
              <p className="claim-use" dir={locale === "ar" && !claim.gameUse.ar ? "ltr" : undefined}>{localize(claim.gameUse, locale)}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
