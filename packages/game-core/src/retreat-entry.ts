import { migrateGameState } from "./engine";
import { prepareFanyangEntry } from "./fanyang-entry";
import { restoreFanyang, type FanyangDefinition, type FanyangMetrics, type FanyangOutcome } from "./fanyang";
import type { CouncilDefinition, CouncilOutcome } from "./council";
import type { Campaign, GameState } from "./types";
import { replayCrossingCampaign, type CrossingAftermath, type CrossingCampaignRules, type CrossingCampaignSave } from "./crossing-campaign";
import type { EngagementDefinition } from "./engagement";

export interface CrossingRetreatSource {
  definition: EngagementDefinition;
  rules: CrossingCampaignRules;
  aftermath?: CrossingAftermath;
  save: CrossingCampaignSave;
}

export interface RetreatRevisions { campaign: string; council: string; fanyang: string }
export interface RetreatEntry {
  version: 1;
  sceneId: "chen-retreat-story-draft.v1";
  id: string;
  revisions: RetreatRevisions;
  /** Separate historical resource scales; never sum these inventories. */
  chapter: GameState;
  council: { choices: string[]; outcome: CouncilOutcome };
  fanyang: { choices: string[]; outcome: FanyangOutcome; metrics: FanyangMetrics };
  continuity: {
    registerOpening: "read-publicly" | "beacon-seized" | "hidden" | "unestablished";
    crossingOrder: string | null;
    courierRecruitedEarlier: boolean;
    /** Prior cooperation or crossing success does not prove later presence. */
    currentCompanionPresence: { yu: "unestablished"; han: "unestablished" };
  };
  readingContext: { fanyang: FanyangOutcome; yu: "unestablished"; han: "unestablished" };
}

/** Replay all three episodes. The caller verifies canonical bytes and supplies
 * their digests; digests are revision identities, not signatures/authentication.
 * Chapter legacy rules are preserved by migrateGameState. A development
 * crossing instead requires its identifiers-only ledger and trusted bundled
 * definitions; replay must exactly match the displayed chapter. Council migration,
 * if needed, must happen before this boundary. This function performs no writes,
 * creates no resources and makes no claim that the retreat is a playable client.
 */
export function prepareRetreatEntry(
  definitions: { campaign: Campaign; council: CouncilDefinition; fanyang: FanyangDefinition },
  snapshots: { chapter: unknown; council: unknown; fanyang: unknown },
  revisions: RetreatRevisions,
  crossing?: CrossingRetreatSource,
): RetreatEntry | null {
  if (![revisions.campaign, revisions.council, revisions.fanyang].every(value => /^[a-f0-9]{64}$/.test(value))) return null;
  let chapter: GameState | null;
  if (crossing) {
    if (crossing.rules.campaignSha256 !== revisions.campaign) return null;
    try {
      chapter = replayCrossingCampaign(definitions.campaign, crossing.definition, crossing.rules, crossing.save, crossing.aftermath)?.campaign ?? null;
    } catch { return null; }
    // A ledger is authoritative, but must also describe the chapter shown by
    // the caller. Never silently replace an unrelated displayed chronicle.
    if (JSON.stringify(chapter) !== JSON.stringify(snapshots.chapter)) return null;
  } else chapter = migrateGameState(definitions.campaign, snapshots.chapter);
  if (!chapter?.completed || chapter.failureReason) return null;
  const origin = prepareFanyangEntry(definitions.council, chapter, snapshots.council, revisions.council);
  if (!origin) return null;
  const fanyang = restoreFanyang(definitions.fanyang, origin, snapshots.fanyang, revisions.fanyang);
  if (!fanyang?.completed || !fanyang.outcome) return null;
  const choices = fanyang.history.map(turn => turn.choiceId);
  const opening = chapter.history.find(turn => turn.nodeId === "rain-order")?.choiceId;
  return {
    version: 1, sceneId: "chen-retreat-story-draft.v1",
    id: JSON.stringify(["chen-retreat-story-draft.v1", revisions.campaign, revisions.council,
      revisions.fanyang, origin.id, choices, chapter.legacyDecisionCount,
      chapter.preMethodReadDecisionCount, chapter.preCommitmentDecisionCount,
      ...(crossing ? [crossing.rules.id, crossing.rules.engagementSha256, crossing.rules.aftermathSha256 ?? null] : [])]),
    revisions: { ...revisions }, chapter,
    council: { choices: [...origin.choices], outcome: origin.outcome },
    fanyang: { choices, outcome: fanyang.outcome, metrics: { ...fanyang.metrics } },
    continuity: {
      registerOpening: opening === "read-the-names" ? "read-publicly"
        : opening === "take-the-beacon" ? "beacon-seized"
        : opening === "hide-the-register" ? "hidden" : "unestablished",
      crossingOrder: chapter.history.find(turn => turn.nodeId === "broken-crossing")?.choiceId ?? null,
      courierRecruitedEarlier: chapter.history.some(turn => turn.choiceId === "turn-the-courier"),
      currentCompanionPresence: { yu: "unestablished", han: "unestablished" },
    },
    readingContext: { fanyang: fanyang.outcome, yu: "unestablished", han: "unestablished" },
  };
}
