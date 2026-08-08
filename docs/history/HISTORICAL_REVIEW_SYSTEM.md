# Historical claim review system

SHI treats history as a production discipline. Every playable scene exposes the claims it depends on, the evidence records behind them, the uncertainty the player should see, and the mechanic or narrative use that depends on the claim.

## Status model

| Status | Meaning | May appear in pre-alpha? | May pass the historical alpha gate? |
| --- | --- | --- | --- |
| `evidence-located` | A team member checked a precise location in a named edition and wrote an original bounded paraphrase. Interpretation is not specialist-approved. | Yes, with uncertainty visible | Only if the risk matrix does not require a specialist |
| `specialist-review-required` | The claim affects a high-risk area such as law, geography, material culture, chronology, or title/office and has not passed the named review role. | Yes, visibly marked | No |
| `authored-reconstruction` | The project intentionally invented the dialogue, character, map abstraction, field condition, or anti-hindsight rule. | Yes, visibly marked | Yes, after narrative/plausibility review |

No current Chapter I historical claim is called `approved`. A pinpoint locator is necessary but never sufficient for approval.

## Claim record contract

Schema v4 requires each claim record to contain:

- stable ASCII claim ID and claim kind;
- original English and Simplified-Chinese statement;
- one or more source-record IDs;
- review status and bounded confidence;
- player-facing uncertainty wording;
- the exact gameplay use affected by the claim;
- completed reviewer identity or an explicit pending review role.

Every playable node must cite the sources required by its exposed claim IDs. Every campaign claim must be reachable from at least one playable node. The web and Unity ledgers render the same claim subset for the active scene.

## Chapter I review queue

| Gate | Claim IDs or content | Current state | Required reviewer/evidence |
| --- | --- | --- | --- |
| Qin delayed-duty penalty | `daze-delay-penalty-account` | Specialist review required; low confidence in uniform application | Qin legal historian; excavated statute and administrative-document comparison |
| Daze/Qi/Chen route and scale | `daze-qi-geography`, `schematic-campaign-map` | Specialist review required; map explicitly schematic | Historical GIS specialist; reviewed gazetteer/archaeological coordinate matrix |
| Chronology and roles | `daze-chronology-seventh-month`, `daze-chen-wu-tunzhang` | Evidence located | Comparative narrative review plus title/office specialist |
| Rain, road and transport | `daze-rain-road-delay`, field-condition reconstructions | Broad event evidence located; exact playable circumstances authored | Environmental/material-culture review |
| Pei and Kuaiji horizon | `pei-response-after-daze`, `kuaiji-response-after-daze`, `no-future-foreknowledge` | Evidence located; later fame excluded from Chapter I knowledge | Comparative narrative and anti-hindsight review |
| Strategic vocabulary | `sunzi-five-factors-design-lens` | Evidence located; explicitly a design lens | Intellectual-history review; never promote to episode evidence |
| Fiction boundary | four reconstruction records | Authored and mechanically marked | Narrative lead plus plausibility reviewer |

## Promotion gate

1. Compare the runtime paraphrase with the registered locator and record edition/access changes.
2. Classify what the source can support: event, chronology, institution, person, geography, or lens.
3. Write the strongest uncertainty that remains, not the weakest disclaimer that permits release.
4. Have the named reviewer record a decision and date outside the runtime payload; do not overwrite contrary notes.
5. Update the claim status only after both clients and visible QA show the revised wording.
6. Run content, route, localization, native preflight, browser, and clean-checkout gates.

AI can locate candidates and test structural consistency. It cannot be the historical specialist, rights counsel, translator of record, or final approver.
