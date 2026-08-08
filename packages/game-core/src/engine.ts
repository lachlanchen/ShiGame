import type { Campaign, CampaignNode, Choice, ChoiceResolution, GameState, Locale, LocalizedText, Resources } from "./types";
import { resourceKeys } from "./types";

export const currentSaveVersion = 2 as const;
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

export function createInitialState(campaign: Campaign): GameState {
  return {
    saveVersion: currentSaveVersion,
    campaignId: campaign.id,
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

export function resolveChoice(campaign: Campaign, state: GameState, choiceId: string): ChoiceResolution {
  if (state.completed) throw new Error("The campaign is already complete.");
  const node = getNode(campaign, state.currentNodeId);
  const choice = node.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} at node ${node.id}`);
  if (!canChoose(choice, state.resources)) throw new Error(`Choice ${choiceId} is not currently available.`);

  const before = { ...state.resources };
  const afterChoice = applyEffects(before, choice.effects);
  const after = applyEffects(afterChoice, choice.pressure?.effects ?? {});
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
      before,
      afterChoice,
      pressureEffects: resourceDeltas(afterChoice, after),
      after,
    }],
    completed,
    failureReason,
  };

  return {
    state: nextState,
    node,
    choice,
    playerDeltas: resourceDeltas(before, afterChoice),
    pressureDeltas: resourceDeltas(afterChoice, after),
    deltas: resourceDeltas(before, after),
  };
}

/**
 * Rebuild a save from its decision history. Stored resource totals are never
 * trusted, which makes old saves deterministic under the current campaign and
 * rejects impossible or tampered routes.
 */
export function migrateGameState(campaign: Campaign, input: unknown): GameState | null {
  if (!input || typeof input !== "object") return null;
  const saved = input as { campaignId?: unknown; history?: unknown };
  if (saved.campaignId !== campaign.id || !Array.isArray(saved.history)) return null;

  let state = createInitialState(campaign);
  try {
    for (const value of saved.history) {
      if (!value || typeof value !== "object" || state.completed) return null;
      const record = value as { nodeId?: unknown; choiceId?: unknown };
      if (record.nodeId !== state.currentNodeId || typeof record.choiceId !== "string") return null;
      state = resolveChoice(campaign, state, record.choiceId).state;
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
