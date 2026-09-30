import { councilMetricKeys, type CouncilMetrics } from "./council";
import type { FanyangEntry } from "./fanyang-entry";
import type { LocalizedText } from "./types";

export const fanyangMetricKeys = [...councilMetricKeys, "assurance"] as const;
export type FanyangMetrics = CouncilMetrics & { assurance: number };
export type FanyangEffects = Partial<FanyangMetrics>;
export type FanyangOutcome = "opened" | "withdrawn" | "deferred";
export interface FanyangChoice {
  id: string; title: LocalizedText; intent: LocalizedText; response: LocalizedText;
  effects: FanyangEffects; requires?: FanyangEffects;
  gateRequired?: boolean; resolution?: "enter" | "revise" | "withdraw";
  answers?: { afterChoice: string; text: LocalizedText; effects: FanyangEffects }[];
}
export interface FanyangDefinition {
  schemaVersion: 1; id: "fanyang-guarantee.v1";
  title: LocalizedText; boundary: LocalizedText; introduction: LocalizedText;
  initialAssurance: number; gateRequirements: FanyangEffects;
  metrics: Record<keyof FanyangMetrics, LocalizedText>;
  rounds: { id: string; title: LocalizedText; context: LocalizedText; choices: FanyangChoice[] }[];
  outcomes: Record<FanyangOutcome, { title: LocalizedText; text: LocalizedText }>;
}
export interface FanyangState {
  version: 1; definitionId: string; entryId: string;
  metrics: FanyangMetrics; councilChoices: string[];
  history: { choiceId: string; before: FanyangMetrics; after: FanyangMetrics }[];
  completed: boolean; outcome?: FanyangOutcome;
}

/** Only accept the verified handoff returned by prepareFanyangEntry. */
export function createFanyang(definition: FanyangDefinition, entry: FanyangEntry): FanyangState {
  if (entry.sceneId !== definition.id) throw new Error("Wrong continuation");
  return { version: 1, definitionId: definition.id, entryId: entry.id,
    metrics: { ...entry.metrics, assurance: definition.initialAssurance },
    councilChoices: [...entry.choices], history: [], completed: false };
}

export function fanyangGateChecks(definition: FanyangDefinition, state: FanyangState) {
  return fanyangMetricKeys.filter(key => definition.gateRequirements[key] !== undefined)
    .map(key => ({ key, value: state.metrics[key], required: definition.gateRequirements[key]!,
      met: state.metrics[key] >= definition.gateRequirements[key]! }));
}

export function fanyangAnswers(state: FanyangState, choice: FanyangChoice) {
  const past = [...state.councilChoices, ...state.history.map(turn => turn.choiceId)];
  return (choice.answers ?? []).filter(answer => past.includes(answer.afterChoice));
}

export function fanyangCanChoose(definition: FanyangDefinition, state: FanyangState, choice: FanyangChoice): boolean {
  return state.definitionId === definition.id && !state.completed
    && definition.rounds[state.history.length]?.choices.some(item => item.id === choice.id) === true
    && fanyangMetricKeys.every(key => state.metrics[key] >= (choice.requires?.[key] ?? 0))
    && (!choice.gateRequired || fanyangGateChecks(definition, state).every(check => check.met));
}

/** Preview and commit use the same deterministic transition; no random surrender. */
export function resolveFanyang(definition: FanyangDefinition, state: FanyangState, choiceId: string): FanyangState {
  const choice = definition.rounds[state.history.length]?.choices.find(item => item.id === choiceId);
  if (!choice || !fanyangCanChoose(definition, state, choice)) throw new Error("Unavailable Fan Yang order");
  const metrics = { ...state.metrics };
  for (const effects of [choice.effects, ...fanyangAnswers(state, choice).map(answer => answer.effects)]) {
    for (const key of fanyangMetricKeys) metrics[key] = Math.max(0, Math.min(10, metrics[key] + (effects[key] ?? 0)));
  }
  const history = [...state.history, { choiceId, before: { ...state.metrics }, after: { ...metrics } }];
  const completed = history.length === definition.rounds.length;
  const next: FanyangState = { ...state, metrics, history, completed };
  if (completed) {
    if (!choice.resolution) throw new Error("Missing Fan Yang resolution");
    next.outcome = choice.resolution === "withdraw" ? "withdrawn"
      : fanyangGateChecks(definition, next).every(check => check.met) ? "opened" : "deferred";
  }
  return next;
}

export function encodeFanyangSnapshot(state: FanyangState, definitionSHA256: string): string {
  if (!/^[a-f0-9]{64}$/.test(definitionSHA256)) throw new Error("Invalid Fan Yang revision");
  return JSON.stringify({ version: 1, definitionId: state.definitionId, definitionSHA256,
    entryId: state.entryId, choices: state.history.map(turn => turn.choiceId) });
}

/** Never trust saved metrics, council choices, phase or outcome. */
export function restoreFanyang(definition: FanyangDefinition, entry: FanyangEntry, snapshot: unknown, canonicalSHA256: string): FanyangState | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
    || !/^[a-f0-9]{64}$/.test(canonicalSHA256)) return null;
  const saved = snapshot as { version?: unknown; definitionId?: unknown; definitionSHA256?: unknown; entryId?: unknown; choices?: unknown };
  if (saved.version !== 1 || saved.definitionId !== definition.id || saved.definitionSHA256 !== canonicalSHA256
    || saved.entryId !== entry.id || !Array.isArray(saved.choices) || saved.choices.length > definition.rounds.length) return null;
  try {
    let state = createFanyang(definition, entry);
    for (const choice of saved.choices) {
      if (typeof choice !== "string") return null;
      state = resolveFanyang(definition, state, choice);
    }
    return state;
  } catch { return null; }
}
