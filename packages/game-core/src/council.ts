import type { GameState, LocalizedText } from "./types";

export const councilMetricKeys = ["grain", "tempo", "city", "allies", "veterans"] as const;
export type CouncilMetric = typeof councilMetricKeys[number];
export type CouncilMetrics = Record<CouncilMetric, number>;
export type CouncilEffects = Partial<CouncilMetrics>;
export type CouncilArrival = "supplied" | "pressed" | "divided";
export type CouncilOutcome = "common-front" | "city-stronghold" | "fragile-coalition" | "empty-granaries";

export interface CouncilChoice {
  id: string;
  title: LocalizedText;
  intent: LocalizedText;
  response: LocalizedText;
  effects: CouncilEffects;
  requires?: CouncilEffects;
  pledge?: LocalizedText;
  answers?: { afterChoice: string; text: LocalizedText; effects: CouncilEffects }[];
}
export interface CouncilDefinition {
  schemaVersion: 1;
  id: string;
  title: LocalizedText;
  introduction: LocalizedText;
  boundary: LocalizedText;
  objective: LocalizedText;
  labels: Record<string, LocalizedText>;
  metrics: Record<CouncilMetric, { title: LocalizedText; meaning: LocalizedText }>;
  arrivals: Record<CouncilArrival, { title: LocalizedText; text: LocalizedText; metrics: CouncilMetrics }>;
  rounds: { id: string; title: LocalizedText; context: LocalizedText; choices: CouncilChoice[] }[];
  outcomes: Record<CouncilOutcome, { title: LocalizedText; text: LocalizedText }>;
  history: { title: LocalizedText; account: LocalizedText; distinction: LocalizedText; sources: { title: string; locator: string; url: string }[] };
}
export interface CouncilEntry { id: string; arrival: CouncilArrival }
export interface CouncilRecord {
  choiceId: string;
  before: CouncilMetrics;
  after: CouncilMetrics;
}
export interface CouncilState {
  version: 1;
  definitionId: string;
  entry: CouncilEntry;
  metrics: CouncilMetrics;
  history: CouncilRecord[];
  completed: boolean;
  outcome?: CouncilOutcome;
}

/** A separate counterfactual interlude, never an implicit Chapter I rewrite. */
export function councilEntry(state: GameState): CouncilEntry | null {
  if (!state.completed || state.failureReason || !state.history.length) return null;
  return {
    id: JSON.stringify([state.campaignId, state.seed, state.history.map(r => [r.nodeId, r.choiceId, r.conditionId]), state.resources]),
    arrival: state.resources.grain >= 45 ? "supplied" : state.resources.danger >= 65 ? "pressed" : "divided",
  };
}

export function createCouncil(definition: CouncilDefinition, entry: CouncilEntry): CouncilState {
  if (!Object.hasOwn(definition.arrivals, entry.arrival) || !entry.id) throw new Error("Invalid council arrival");
  return { version: 1, definitionId: definition.id, entry: { ...entry }, metrics: { ...definition.arrivals[entry.arrival].metrics }, history: [], completed: false };
}

export function councilAnswers(state: CouncilState, choice: CouncilChoice) {
  return (choice.answers ?? []).filter(answer => state.history.some(record => record.choiceId === answer.afterChoice));
}

export function councilCanChoose(state: CouncilState, choice: CouncilChoice): boolean {
  return !state.completed && councilMetricKeys.every(key => state.metrics[key] >= (choice.requires?.[key] ?? 0));
}

/** Visible requirements for a common front, evaluated from the resolved totals. */
export function councilReadiness(metrics: CouncilMetrics) {
  const supporters = (["city", "allies", "veterans"] as const).filter(key => metrics[key] >= 6);
  return {
    supporters,
    checks: [
      { id: "support" as const, value: supporters.length, required: 2 },
      { id: "grain" as const, value: metrics.grain, required: 2 },
      { id: "tempo" as const, value: metrics.tempo, required: 3 },
    ].map(check => ({ ...check, met: check.value >= check.required })),
  };
}

export function councilOutcome(metrics: CouncilMetrics): CouncilOutcome {
  if (metrics.grain <= 0) return "empty-granaries";
  if (councilReadiness(metrics).checks.every(check => check.met)) return "common-front";
  if (metrics.city >= 6 && metrics.veterans >= 6) return "city-stronghold";
  return "fragile-coalition";
}

/** Shared by previews and commits: no hidden roll, no post-choice rule change. */
export function resolveCouncil(definition: CouncilDefinition, state: CouncilState, choiceId: string): CouncilState {
  if (state.definitionId !== definition.id || state.completed) throw new Error("Council is not accepting orders");
  const round = definition.rounds[state.history.length];
  const choice = round?.choices.find(candidate => candidate.id === choiceId);
  if (!choice || !councilCanChoose(state, choice)) throw new Error("Unavailable council choice");
  const metrics = { ...state.metrics };
  for (const effects of [choice.effects, ...councilAnswers(state, choice).map(answer => answer.effects)]) {
    for (const key of councilMetricKeys) metrics[key] = Math.max(0, Math.min(10, metrics[key] + (effects[key] ?? 0)));
  }
  const history = [...state.history, { choiceId, before: { ...state.metrics }, after: { ...metrics } }];
  const completed = history.length === definition.rounds.length;
  return { ...state, metrics, history, completed, ...(completed ? { outcome: councilOutcome(metrics) } : {}) };
}

/** Recompute every result. Saved metrics/outcome are never trusted. */
export function restoreCouncil(definition: CouncilDefinition, entry: CouncilEntry, value: unknown): CouncilState | null {
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<CouncilState>;
  if (saved.version !== 1 || saved.definitionId !== definition.id || saved.entry?.id !== entry.id || saved.entry.arrival !== entry.arrival
    || !Array.isArray(saved.history) || saved.history.length > definition.rounds.length) return null;
  try {
    let state = createCouncil(definition, entry);
    for (const record of saved.history) {
      if (!record || typeof record.choiceId !== "string") return null;
      state = resolveCouncil(definition, state, record.choiceId);
    }
    return state;
  } catch { return null; }
}
