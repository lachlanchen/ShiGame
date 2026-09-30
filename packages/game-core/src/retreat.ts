import { councilMetricKeys, type CouncilMetrics } from "./council";
import type { RetreatEntry } from "./retreat-entry";
import type { LocalizedText } from "./types";

export type RetreatOutcome = "together" | "remnant" | "dispersed" | "scattered";
type Effects = Partial<CouncilMetrics>;
export interface RetreatRuleChoice {
  id: string; requires: Effects; effects: Effects; reason: string;
  afterChoiceRequired?: string;
  answers?: { afterChoice: string; effects: Effects; reason: string }[];
  ending?: "together" | "remnant" | "disperse";
}
export interface RetreatDefinition {
  schemaVersion: 1; id: string; storyId: string;
  scenes: { id: string; choices: RetreatRuleChoice[] }[];
  dispersionRequirements: { grain: number; anyBacking: number };
  scattered: { title: LocalizedText; reaction: LocalizedText; recovery: LocalizedText };
}
export interface RetreatState {
  version: 1; definitionId: string; entryId: string; metrics: CouncilMetrics;
  priorChoices: string[];
  history: { sceneId: string; choiceId: string; before: CouncilMetrics; after: CouncilMetrics }[];
  resourceCustody: "common" | "groups" | "unresolved";
  completed: boolean; outcome?: RetreatOutcome;
}

/** Input must come from prepareRetreatEntry; no second initial-resource table. */
export function createRetreat(definition: RetreatDefinition, entry: RetreatEntry): RetreatState {
  if (entry.sceneId !== definition.storyId) throw new Error("Wrong retreat story");
  const metrics = Object.fromEntries(councilMetricKeys.map(key => [key, entry.fanyang.metrics[key]])) as CouncilMetrics;
  if (!councilMetricKeys.every(key => Number.isInteger(metrics[key]) && metrics[key] >= 0 && metrics[key] <= 10)) throw new Error("Invalid inherited capacity");
  return { version: 1, definitionId: definition.id, entryId: entry.id, metrics,
    priorChoices: [...entry.chapter.history.map(turn => turn.choiceId), ...entry.council.choices, ...entry.fanyang.choices],
    history: [], resourceCustody: "common", completed: false };
}

function pastChoices(state: RetreatState) { return [...state.priorChoices, ...state.history.map(turn => turn.choiceId)]; }

/** Inspect only canonical choices. Negative food/time effects are actual costs;
 * political disapproval may bottom out at zero without making exit impossible.
 * Conditional savings and burdens are combined before affordability checks.
 */
export function inspectRetreatChoice(definition: RetreatDefinition, state: RetreatState, choiceId: string) {
  if (state.definitionId !== definition.id || state.completed) throw new Error("Retreat is not accepting orders");
  const choice = definition.scenes[state.history.length]?.choices.find(item => item.id === choiceId);
  if (!choice) throw new Error("Unknown retreat order");
  const past = pastChoices(state);
  const answers = (choice.answers ?? []).filter(answer => past.includes(answer.afterChoice));
  const effects: Effects = {};
  for (const change of [choice.effects, ...answers.map(answer => answer.effects)]) {
    for (const key of councilMetricKeys) effects[key] = (effects[key] ?? 0) + (change[key] ?? 0);
  }
  const checks = councilMetricKeys.map(key => {
    const spend = key === "grain" || key === "tempo" ? Math.max(0, -(effects[key] ?? 0)) : 0;
    const required = Math.max(choice.requires[key] ?? 0, spend);
    return { key, value: state.metrics[key], required, met: state.metrics[key] >= required };
  });
  const prerequisiteMet = !choice.afterChoiceRequired || past.includes(choice.afterChoiceRequired);
  const available = prerequisiteMet && checks.every(check => check.met);
  const after = Object.fromEntries(councilMetricKeys.map(key => [key, Math.max(0, Math.min(10, state.metrics[key] + (effects[key] ?? 0)))])) as CouncilMetrics;
  let outcome: RetreatOutcome | undefined;
  if (available && choice.ending) {
    outcome = choice.ending === "disperse"
      ? after.grain >= definition.dispersionRequirements.grain
        && Math.max(after.city, after.allies, after.veterans) >= definition.dispersionRequirements.anyBacking
        ? "dispersed" : "scattered"
      : choice.ending;
  }
  return { choice, answers, effects, checks, prerequisiteMet, available,
    // Unavailable previews must not advertise clamped unaffordable spending.
    after: available ? after : null, outcome,
    reactionOverride: outcome === "scattered" ? definition.scattered.reaction : undefined };
}

export function resolveRetreat(definition: RetreatDefinition, state: RetreatState, choiceId: string): RetreatState {
  const preview = inspectRetreatChoice(definition, state, choiceId);
  if (!preview.available || !preview.after) throw new Error("Unavailable retreat order");
  const scene = definition.scenes[state.history.length]!;
  const history = [...state.history, { sceneId: scene.id, choiceId, before: { ...state.metrics }, after: { ...preview.after } }];
  const completed = history.length === definition.scenes.length;
  if (completed !== Boolean(preview.outcome)) throw new Error("Retreat ending contract mismatch");
  return { ...state, metrics: { ...preview.after }, history, completed,
    resourceCustody: preview.outcome === "dispersed" ? "groups" : preview.outcome === "scattered" ? "unresolved" : "common",
    ...(preview.outcome ? { outcome: preview.outcome } : {}) };
}

export function encodeRetreatSnapshot(state: RetreatState, rulesSHA256: string, storySHA256: string): string {
  if (![rulesSHA256, storySHA256].every(hash => /^[a-f0-9]{64}$/.test(hash))) throw new Error("Invalid retreat revision");
  return JSON.stringify({ version: 1, definitionId: state.definitionId, entryId: state.entryId,
    rulesSHA256, storySHA256, choices: state.history.map(turn => turn.choiceId) });
}

export function restoreRetreat(definition: RetreatDefinition, entry: RetreatEntry, snapshot: unknown, rulesSHA256: string, storySHA256: string): RetreatState | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
    || ![rulesSHA256, storySHA256].every(hash => /^[a-f0-9]{64}$/.test(hash))) return null;
  const saved = snapshot as { version?: unknown; definitionId?: unknown; entryId?: unknown; rulesSHA256?: unknown; storySHA256?: unknown; choices?: unknown };
  if (saved.version !== 1 || saved.definitionId !== definition.id || saved.entryId !== entry.id
    || saved.rulesSHA256 !== rulesSHA256 || saved.storySHA256 !== storySHA256
    || !Array.isArray(saved.choices) || saved.choices.length > definition.scenes.length) return null;
  try {
    let state = createRetreat(definition, entry);
    for (const choice of saved.choices) {
      if (typeof choice !== "string") return null;
      state = resolveRetreat(definition, state, choice);
    }
    return state;
  } catch { return null; }
}
