import { canChoose, createInitialState, getNode, resolveChoice, selectFieldCondition } from "./engine";
import { createEngagementState, resolveEngagementCommand, type EngagementDefinition, type EngagementState } from "./engagement";
import type { Campaign, ChoiceResolution, GameState } from "./types";

/** Development contract: clients must adopt this ledger together before release. */
export interface CrossingCampaignRules {
  schemaVersion: 1;
  id: string;
  deliveryStatus: "development-only";
  campaignId: string;
  engagementId: string;
  nodeId: string;
  effectPolicy: "replace-player-effects-retain-other-layers";
  campaignSha256: string;
  engagementSha256: string;
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
  lastResolution?: ChoiceResolution;
}

function validateBinding(campaign: Campaign, definition: EngagementDefinition, rules: CrossingCampaignRules): void {
  if (rules.schemaVersion !== 1 || rules.deliveryStatus !== "development-only"
    || rules.effectPolicy !== "replace-player-effects-retain-other-layers"
    || !/^[a-f0-9]{64}$/.test(rules.campaignSha256) || !/^[a-f0-9]{64}$/.test(rules.engagementSha256)
    || rules.campaignId !== campaign.id || definition.campaignId !== campaign.id
    || rules.engagementId !== definition.id || rules.nodeId !== definition.nodeId) {
    throw new Error("Crossing campaign contract does not match its authored content.");
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
): CrossingCampaignReplay | null {
  try {
    validateBinding(campaign, definition, rules);
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
            nodes: campaign.nodes.map((candidate) => candidate.id !== node.id ? candidate : {
              ...candidate,
              choices: candidate.choices.map((choice) => choice.id !== completed.planId ? choice : {
                ...choice, effects: { ...completed.campaignEffects },
              }),
            }),
          };
          lastResolution = resolveChoice(encounterCampaign, state, completed.planId);
          state = lastResolution.state;
          crossings.push(completed);
          engagement = undefined;
          break;
        }
      }
      events.push(event);
    }
    return {
      save: { saveVersion: 1, rulesId: rules.id, campaignId: campaign.id, seed: saved.seed,
        campaignSha256: rules.campaignSha256, engagementSha256: rules.engagementSha256, events },
      campaign: state, engagement, crossings, lastResolution,
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
): CrossingCampaignReplay {
  const next = replayCrossingCampaign(campaign, definition, rules, { ...saved, events: [...saved.events, event] });
  if (!next) throw new Error("Crossing campaign action or saved history is invalid.");
  return next;
}
