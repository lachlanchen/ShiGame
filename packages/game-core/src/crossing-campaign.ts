import { canChoose, createInitialState, getNode, resolveChoice, selectFieldCondition } from "./engine";
import { createEngagementState, resolveEngagementCommand, type EngagementDefinition, type EngagementState } from "./engagement";
import type { Campaign, ChoiceResolution, CommitmentStatus, GameState, LocalizedText, Resources } from "./types";

/** Development contract: clients must adopt this ledger together before release. */
export interface CrossingCampaignRules {
  schemaVersion: 1 | 2;
  id: string;
  deliveryStatus: "development-only";
  campaignId: string;
  engagementId: string;
  nodeId: string;
  effectPolicy: "replace-player-effects-retain-other-layers" | "outcome-aware-crossing";
  campaignSha256: string;
  engagementSha256: string;
  aftermathId?: string;
  aftermathSha256?: string;
}

export interface CrossingAftermath {
  schemaVersion: 2;
  id: string;
  deliveryStatus: "development-only";
  claimStatus: "dramatic-reconstruction";
  review: { status: "reviewed-development-copy"; reviewer: string; historicalBoundary: string; humanAcceptance: "pending" };
  outcomes: Record<string, { reaction: LocalizedText; pressure: LocalizedText }>;
  terminal: Record<"captured" | "scattered", LocalizedText>;
  commitments: Record<string, Record<CommitmentStatus, { response: LocalizedText; effects: Partial<Resources> }>>;
}

export type CrossingCampaignEvent =
  | { kind: "decision"; choiceId: string }
  | { kind: "begin-crossing"; planId: string }
  | { kind: "crossing-command"; commandId: string }
  | { kind: "cancel-crossing" }
  | { kind: "finish-crossing" };

/** Identifiers only. Resources, outcomes and intermediate totals are reconstructed. */
export interface CrossingCampaignSave {
  saveVersion: 1;
  rulesId: string;
  campaignId: string;
  seed: number;
  campaignSha256: string;
  engagementSha256: string;
  events: CrossingCampaignEvent[];
}

export interface CrossingCampaignReplay {
  save: CrossingCampaignSave;
  campaign: GameState;
  engagement?: EngagementState;
  crossings: EngagementState[];
  crossingResolutions: ChoiceResolution[];
  lastResolution?: ChoiceResolution;
}

function validateBinding(campaign: Campaign, definition: EngagementDefinition, rules: CrossingCampaignRules, aftermath?: CrossingAftermath): void {
  const policyValid = rules.schemaVersion === 1 ? rules.effectPolicy === "replace-player-effects-retain-other-layers"
    : rules.schemaVersion === 2 && rules.effectPolicy === "outcome-aware-crossing";
  if (!policyValid || rules.deliveryStatus !== "development-only"
    || !/^[a-f0-9]{64}$/.test(rules.campaignSha256) || !/^[a-f0-9]{64}$/.test(rules.engagementSha256)
    || rules.campaignId !== campaign.id || definition.campaignId !== campaign.id
    || rules.engagementId !== definition.id || rules.nodeId !== definition.nodeId) {
    throw new Error("Crossing campaign contract does not match its authored content.");
  }
  if (rules.schemaVersion === 2 && (!aftermath || aftermath.schemaVersion !== 2 || aftermath.id !== rules.aftermathId
    || !/^[a-f0-9]{64}$/.test(rules.aftermathSha256 ?? "") || aftermath.deliveryStatus !== "development-only"
    || aftermath.claimStatus !== "dramatic-reconstruction" || aftermath.review.status !== "reviewed-development-copy"
    || definition.outcomes.some((outcome) => !aftermath.outcomes[outcome.id])
    || campaign.commitments.some((commitment) => !aftermath.commitments[commitment.id]))) {
    throw new Error("Crossing aftermath is missing or does not close to its rules.");
  }
  const node = getNode(campaign, rules.nodeId);
  if (definition.plans.length !== node.choices.length
    || new Set(definition.plans.map((plan) => plan.id)).size !== definition.plans.length
    || definition.plans.some((plan) => !node.choices.some((choice) => choice.id === plan.id))
    || definition.conditions.length !== node.conditions.length
    || new Set(definition.conditions.map((condition) => condition.id)).size !== definition.conditions.length
    || definition.conditions.some((condition) => !node.conditions.some((field) => field.id === condition.id))) {
    throw new Error("Crossing plans and conditions must exactly match the campaign node.");
  }
}

/** Authored v2 judgment: an intention alone cannot certify an observed promise. */
export function crossingCommitmentStatus(commitmentId: string, planId: string, outcomeId: string): CommitmentStatus {
  if (!["families-first", "repair-the-ford", "cut-the-carts"].includes(planId)
    || !["orderly-crossing", "costly-crossing", "fighting-withdrawal", "rear-broken"].includes(outcomeId)) {
    throw new Error("Unknown crossing plan or outcome for commitment judgment.");
  }
  if (commitmentId === "names-under-protection") {
    if (planId === "cut-the-carts" || outcomeId === "rear-broken") return "broken";
    return planId === "families-first" && outcomeId === "orderly-crossing" ? "kept" : "strained";
  }
  if (commitmentId === "movement-before-answer" || commitmentId === "register-stays-dark") {
    if (planId === "repair-the-ford" || outcomeId === "rear-broken") return "broken";
    return planId === "cut-the-carts" && outcomeId === "orderly-crossing" ? "kept" : "strained";
  }
  throw new Error(`No crossing judgment for ${commitmentId}.`);
}

function eventIsValid(value: unknown): value is CrossingCampaignEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  const field = event.kind === "decision" ? "choiceId"
    : event.kind === "begin-crossing" ? "planId"
      : event.kind === "crossing-command" ? "commandId" : undefined;
  if (field) return Object.keys(event).length === 2 && typeof event[field] === "string" && event[field] !== "";
  return Object.keys(event).length === 1 && (event.kind === "cancel-crossing" || event.kind === "finish-crossing");
}

export function createCrossingCampaignSave(campaign: Campaign, rules: CrossingCampaignRules, seed: number): CrossingCampaignSave {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff || rules.campaignId !== campaign.id) {
    throw new Error("Invalid crossing campaign seed or campaign binding.");
  }
  return { saveVersion: 1, rulesId: rules.id, campaignId: campaign.id, seed,
    campaignSha256: rules.campaignSha256, engagementSha256: rules.engagementSha256, events: [] };
}

/**
 * Every command is resumable, but campaign costs commit once, after the last pulse.
 * The completed encounter replaces—not adds to—the old abstract player effects.
 * Oath, pressure, pursuit, method read and field layers keep their existing order.
 * This is NOT a v6 GameState save: passing the derived campaign to its old loader
 * would lose the battle. Persist this ledger instead.
 */
export function replayCrossingCampaign(
  campaign: Campaign,
  definition: EngagementDefinition,
  rules: CrossingCampaignRules,
  input: unknown,
  aftermath?: CrossingAftermath,
): CrossingCampaignReplay | null {
  try {
    validateBinding(campaign, definition, rules, aftermath);
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const saved = input as Partial<CrossingCampaignSave>;
    if (Object.keys(saved).length !== 7 || saved.saveVersion !== 1 || saved.rulesId !== rules.id
      || saved.campaignSha256 !== rules.campaignSha256 || saved.engagementSha256 !== rules.engagementSha256
      || saved.campaignId !== campaign.id || typeof saved.seed !== "number"
      || !Number.isInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff
      || !Array.isArray(saved.events)) return null;
    let state = createInitialState(campaign, saved.seed);
    let engagement: EngagementState | undefined;
    let lastResolution: ChoiceResolution | undefined;
    const crossings: EngagementState[] = [];
    const crossingResolutions: ChoiceResolution[] = [];
    const events: CrossingCampaignEvent[] = [];
    for (const value of saved.events) {
      if (!eventIsValid(value) || state.completed) return null;
      const event = { ...value };
      const node = getNode(campaign, state.currentNodeId);
      switch (event.kind) {
        case "decision":
          if (engagement || node.id === rules.nodeId) return null;
          lastResolution = resolveChoice(campaign, state, event.choiceId);
          state = lastResolution.state;
          break;
        case "begin-crossing": {
          if (engagement || node.id !== rules.nodeId || crossings.length > 0) return null;
          const choice = node.choices.find((candidate) => candidate.id === event.planId);
          if (!choice || !canChoose(choice, state.resources)) return null;
          const condition = selectFieldCondition(campaign, node, state.seed, state.history.length);
          engagement = createEngagementState(definition, choice.id, condition.id);
          break;
        }
        case "crossing-command":
          if (!engagement) return null;
          engagement = resolveEngagementCommand(definition, engagement, event.commandId);
          break;
        case "cancel-crossing":
          // Selection is reversible. An issued field order is not an undo button.
          if (!engagement || engagement.history.length !== 0) return null;
          engagement = undefined;
          break;
        case "finish-crossing": {
          if (!engagement?.completed || !engagement.campaignEffects || node.id !== rules.nodeId) return null;
          const completed = engagement;
          const encounterCampaign: Campaign = {
            ...campaign,
            commitments: rules.schemaVersion === 1 ? campaign.commitments : campaign.commitments.map((commitment) => {
              const status = crossingCommitmentStatus(commitment.id, completed.planId, completed.outcomeId!);
              const profile = aftermath!.commitments[commitment.id]![status];
              return { ...commitment, outcomes: commitment.outcomes.map((outcome) => outcome.choiceId !== completed.planId ? outcome : {
                ...outcome, id: `crossing-v2-${commitment.id}-${completed.planId}-${completed.outcomeId}`, status,
                forecast: profile.response, response: profile.response, effects: { ...profile.effects },
              }) };
            }),
            nodes: campaign.nodes.map((candidate) => candidate.id !== node.id ? candidate : {
              ...candidate,
              choices: candidate.choices.map((choice) => choice.id !== completed.planId ? choice : {
                ...choice, effects: { ...completed.campaignEffects },
                consequence: rules.schemaVersion === 2 ? aftermath!.outcomes[completed.outcomeId!]!.reaction
                  : definition.outcomes.find((outcome) => outcome.id === completed.outcomeId)!.summary,
                ...(rules.schemaVersion === 2 ? {
                  pressure: choice.pressure ? { ...choice.pressure, reveal: aftermath!.outcomes[completed.outcomeId!]!.pressure } : undefined,
                  flags: [
                    ...(choice.flags ?? []).filter((flag) =>
                      flag === "families-first" ? completed.outcomeId === "orderly-crossing" || completed.history.some((record) => record.commandId === "hold-for-the-last-household")
                        : flag === "ford-braced" ? completed.outcomeId === "orderly-crossing"
                          : flag !== "carts-abandoned"),
                    `crossing-${completed.outcomeId}`,
                  ],
                } : {}),
              }),
            }),
          };
          lastResolution = resolveChoice(encounterCampaign, state, completed.planId);
          if (rules.schemaVersion === 2 && lastResolution.state.failureReason) {
            lastResolution.choice = { ...lastResolution.choice, consequence: aftermath!.terminal[lastResolution.state.failureReason] };
            lastResolution.node = { ...lastResolution.node, choices: lastResolution.node.choices.map(choice => choice.id === completed.planId ? lastResolution!.choice : choice) };
          }
          state = lastResolution.state;
          crossings.push(completed);
          crossingResolutions.push(lastResolution);
          engagement = undefined;
          break;
        }
      }
      events.push(event);
    }
    return {
      save: { saveVersion: 1, rulesId: rules.id, campaignId: campaign.id, seed: saved.seed,
        campaignSha256: rules.campaignSha256, engagementSha256: rules.engagementSha256, events },
      campaign: state, engagement, crossings, crossingResolutions, lastResolution,
    };
  } catch {
    return null;
  }
}

/** Pure transaction: callers persist the returned ledger before replacing UI state. */
export function advanceCrossingCampaign(
  campaign: Campaign,
  definition: EngagementDefinition,
  rules: CrossingCampaignRules,
  saved: CrossingCampaignSave,
  event: CrossingCampaignEvent,
  aftermath?: CrossingAftermath,
): CrossingCampaignReplay {
  const next = replayCrossingCampaign(campaign, definition, rules, { ...saved, events: [...saved.events, event] }, aftermath);
  if (!next) throw new Error("Crossing campaign action or saved history is invalid.");
  return next;
}
