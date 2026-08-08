import type { Campaign, CampaignNode, Choice, ChoiceResolution, FieldCondition, GameState, Locale, LocalizedText, OppositionStage, Resources } from "./types";
import { resourceKeys } from "./types";

export const currentSaveVersion = 4 as const;
const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const applyEffects = (resources: Resources, effects: Partial<Resources>): Resources => resourceKeys.reduce<Resources>((result, key) => {
  result[key] = clamp(resources[key] + (effects[key] ?? 0));
  return result;
}, { ...resources });

const resourceDeltas = (before: Resources, after: Resources): Partial<Resources> => resourceKeys.reduce<Partial<Resources>>((result, key) => {
  const delta = after[key] - before[key];
  if (delta !== 0) result[key] = delta;
  return result;
}, {});

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en ?? text["zh-Hans"];
}

export const normalizeSeed = (value: number): number => Math.trunc(value) >>> 0;
export const formatSeed = (seed: number): string => normalizeSeed(seed).toString(16).toUpperCase().padStart(8, "0");

export function hashSeedKey(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function selectFieldCondition(campaign: Campaign, node: CampaignNode, seed: number, turn: number): FieldCondition {
  if (node.conditions.length === 0) throw new Error(`Node ${node.id} has no field conditions.`);
  const totalWeight = node.conditions.reduce((sum, condition) => sum + condition.weight, 0);
  if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0) throw new Error(`Node ${node.id} has invalid field-condition weights.`);
  let roll = hashSeedKey(`${campaign.id}|${normalizeSeed(seed)}|${node.id}|${turn}`) % totalWeight;
  for (const condition of node.conditions) {
    if (roll < condition.weight) return condition;
    roll -= condition.weight;
  }
  throw new Error(`Node ${node.id} field-condition selection overflowed.`);
}

export function selectOppositionStage(campaign: Campaign, resources: Resources): OppositionStage {
  const stage = campaign.opposition.stages.find((candidate) => resources.danger >= candidate.minDanger && resources.danger <= candidate.maxDanger);
  if (!stage) throw new Error(`No ${campaign.opposition.id} stage covers Exposure ${resources.danger}.`);
  return stage;
}

export function createInitialState(campaign: Campaign, seed = 0): GameState {
  return {
    saveVersion: currentSaveVersion,
    legacyDecisionCount: 0,
    campaignId: campaign.id,
    seed: normalizeSeed(seed),
    currentNodeId: campaign.startNodeId,
    resources: { ...campaign.initialResources },
    flags: [],
    history: [],
    completed: false,
  };
}

export function getNode(campaign: Campaign, nodeId: string): CampaignNode {
  const node = campaign.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown campaign node: ${nodeId}`);
  return node;
}

export function canChoose(choice: Choice, resources: Resources): boolean {
  const minimums = choice.requirements?.min ?? {};
  const maximums = choice.requirements?.max ?? {};
  return resourceKeys.every((key) => {
    const minimum = minimums[key];
    const maximum = maximums[key];
    return (minimum === undefined || resources[key] >= minimum)
      && (maximum === undefined || resources[key] <= maximum);
  });
}

function resolveChoiceWithRules(campaign: Campaign, state: GameState, choiceId: string, includeOpposition: boolean): ChoiceResolution {
  if (state.completed) throw new Error("The campaign is already complete.");
  const node = getNode(campaign, state.currentNodeId);
  const choice = node.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} at node ${node.id}`);
  if (!canChoose(choice, state.resources)) throw new Error(`Choice ${choiceId} is not currently available.`);
  const condition = selectFieldCondition(campaign, node, state.seed, state.history.length);
  const oppositionStage = includeOpposition ? selectOppositionStage(campaign, state.resources) : undefined;

  const before = { ...state.resources };
  const afterChoice = applyEffects(before, choice.effects);
  const afterPressure = applyEffects(afterChoice, choice.pressure?.effects ?? {});
  const afterOpposition = applyEffects(afterPressure, oppositionStage?.effects ?? {});
  const after = applyEffects(afterOpposition, condition.effects);
  const failureReason = after.danger >= 100 ? "captured" : after.people <= 0 ? "scattered" : undefined;
  const completed = !choice.nextNodeId || failureReason !== undefined;
  const nextState: GameState = {
    ...state,
    currentNodeId: failureReason ? state.currentNodeId : choice.nextNodeId ?? state.currentNodeId,
    resources: after,
    flags: [...new Set([...state.flags, ...(choice.flags ?? [])])],
    history: [...state.history, {
      nodeId: node.id,
      choiceId,
      conditionId: condition.id,
      before,
      afterChoice,
      pressureEffects: resourceDeltas(afterChoice, afterPressure),
      afterPressure,
      oppositionStageId: oppositionStage?.id,
      oppositionEffects: resourceDeltas(afterPressure, afterOpposition),
      afterOpposition,
      conditionEffects: resourceDeltas(afterOpposition, after),
      after,
    }],
    completed,
    failureReason,
  };

  return {
    state: nextState,
    node,
    choice,
    condition,
    oppositionStage,
    playerDeltas: resourceDeltas(before, afterChoice),
    pressureDeltas: resourceDeltas(afterChoice, afterPressure),
    oppositionDeltas: resourceDeltas(afterPressure, afterOpposition),
    fieldDeltas: resourceDeltas(afterOpposition, after),
    deltas: resourceDeltas(before, after),
  };
}

export function resolveChoice(campaign: Campaign, state: GameState, choiceId: string): ChoiceResolution {
  return resolveChoiceWithRules(campaign, state, choiceId, true);
}

/**
 * Rebuild a save from its decision history. Stored resource totals are never
 * trusted. Decisions from older formats replay under their original layer
 * contract; current-format decisions verify both field and pursuit identity.
 * Impossible or tampered routes fail closed.
 */
export function migrateGameState(campaign: Campaign, input: unknown): GameState | null {
  if (!input || typeof input !== "object") return null;
  const saved = input as { saveVersion?: unknown; legacyDecisionCount?: unknown; campaignId?: unknown; seed?: unknown; history?: unknown };
  if (saved.campaignId !== campaign.id || !Array.isArray(saved.history)) return null;
  if (saved.saveVersion !== undefined && saved.saveVersion !== 1 && saved.saveVersion !== 2 && saved.saveVersion !== 3 && saved.saveVersion !== currentSaveVersion) return null;
  const seeded = saved.saveVersion === 3 || saved.saveVersion === currentSaveVersion;
  if (seeded && (typeof saved.seed !== "number" || !Number.isInteger(saved.seed) || saved.seed < 0 || saved.seed > 0xffffffff)) return null;
  const legacyDecisionCount = saved.saveVersion === currentSaveVersion ? saved.legacyDecisionCount : saved.history.length;
  if (!Number.isInteger(legacyDecisionCount) || (legacyDecisionCount as number) < 0 || (legacyDecisionCount as number) > saved.history.length) return null;

  let state = createInitialState(campaign, seeded ? saved.seed as number : 0);
  state.legacyDecisionCount = legacyDecisionCount as number;
  try {
    for (const [index, value] of saved.history.entries()) {
      if (!value || typeof value !== "object" || state.completed) return null;
      const record = value as { nodeId?: unknown; choiceId?: unknown; conditionId?: unknown; oppositionStageId?: unknown };
      if (record.nodeId !== state.currentNodeId || typeof record.choiceId !== "string") return null;
      const includeOpposition = index >= state.legacyDecisionCount;
      const resolution = resolveChoiceWithRules(campaign, state, record.choiceId, includeOpposition);
      if (seeded && record.conditionId !== resolution.condition.id) return null;
      if (includeOpposition && record.oppositionStageId !== resolution.oppositionStage?.id) return null;
      if (!includeOpposition && record.oppositionStageId !== undefined && record.oppositionStageId !== "") return null;
      state = resolution.state;
    }
  } catch {
    return null;
  }
  return state;
}

export function deriveEnding(state: GameState): "wildfire" | "deep-roots" | "watchful-strategist" {
  if (state.failureReason) return "watchful-strategist";
  if (state.flags.includes("ending-wildfire")) return "wildfire";
  if (state.flags.includes("ending-deep-roots")) return "deep-roots";
  if (state.flags.includes("ending-watchful")) return "watchful-strategist";
  if (state.resources.momentum >= 65 && state.resources.grain < 40) return "wildfire";
  if (state.resources.people + state.resources.trust >= 125) return "deep-roots";
  return "watchful-strategist";
}

export function scoreChoice(choice: Choice): number {
  const combined = [...Object.entries(choice.effects), ...Object.entries(choice.pressure?.effects ?? {})];
  return combined.reduce((score, [key, value]) => {
    const direction = key === "danger" ? -1 : 1;
    return score + direction * (value ?? 0);
  }, 0);
}
