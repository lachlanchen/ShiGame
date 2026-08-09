import type { LocalizedText, Resources } from "./types";
import { resourceKeys } from "./types";

export const engagementMetricKeys = [
  "crossingProgress",
  "rearCohesion",
  "reserveReadiness",
  "supplyLoads",
  "pursuitClosure",
  "signalIntegrity",
] as const;

export type EngagementMetricKey = (typeof engagementMetricKeys)[number];
export type EngagementMetrics = Record<EngagementMetricKey, number>;
export type EngagementMetricEffects = Partial<EngagementMetrics>;
export type EngagementOrder = "anchor" | "advance" | "screen" | "shift" | "feint" | "reserve" | "withdraw";
export type EngagementOutcomeStatus = "success" | "costly-success" | "withdrawal" | "failure";

export interface EngagementRequirements {
  min?: EngagementMetricEffects;
  max?: EngagementMetricEffects;
}

export interface EngagementCondition {
  id: string;
  title: LocalizedText;
  signal: LocalizedText;
  localEffects: EngagementMetricEffects;
}

export interface EngagementPlan {
  id: string;
  title: LocalizedText;
  mainEffort: LocalizedText;
  withdrawalCondition: LocalizedText;
  initialEffects: EngagementMetricEffects;
  campaignEffects: Partial<Resources>;
  allowedCommands: Record<string, string[]>;
}

export interface EngagementResponse {
  id: string;
  kind: "state" | "terrain" | "supply" | "network";
  reveal: LocalizedText;
  effects: EngagementMetricEffects;
}

export interface EngagementCommand {
  id: string;
  pulseId: string;
  order: EngagementOrder;
  title: LocalizedText;
  intent: LocalizedText;
  effects: EngagementMetricEffects;
  requirements?: EngagementRequirements;
  response: EngagementResponse;
}

export interface EngagementPulse {
  id: string;
  title: LocalizedText;
  objective: LocalizedText;
  commandIds: string[];
}

export interface EngagementOutcome {
  id: string;
  status: EngagementOutcomeStatus;
  title: LocalizedText;
  summary: LocalizedText;
  requirements?: EngagementRequirements;
  campaignEffects: Partial<Resources>;
}

export interface EngagementDefinition {
  schemaVersion: 1;
  id: string;
  campaignId: string;
  nodeId: string;
  deliveryStatus: "validated-shared-contract-not-campaign-authority";
  claimStatus: "dramatic-reconstruction";
  title: LocalizedText;
  objective: LocalizedText;
  sourceRefs: string[];
  claimRefs: string[];
  metrics: EngagementMetricKey[];
  initialMetrics: EngagementMetrics;
  conditions: EngagementCondition[];
  plans: EngagementPlan[];
  pulses: EngagementPulse[];
  commands: EngagementCommand[];
  outcomes: EngagementOutcome[];
}

export interface EngagementCommandRecord {
  pulseId: string;
  commandId: string;
  before: EngagementMetrics;
  afterCommand: EngagementMetrics;
  responseId: string;
  afterResponse: EngagementMetrics;
}

export interface EngagementState {
  saveVersion: 1;
  engagementId: string;
  planId: string;
  conditionId: string;
  pulseIndex: number;
  metrics: EngagementMetrics;
  history: EngagementCommandRecord[];
  completed: boolean;
  outcomeId?: string;
  campaignEffects?: Partial<Resources>;
}

const clampMetric = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const applyMetricEffects = (metrics: EngagementMetrics, effects: EngagementMetricEffects): EngagementMetrics =>
  engagementMetricKeys.reduce<EngagementMetrics>((result, key) => {
    result[key] = clampMetric(metrics[key] + (effects[key] ?? 0));
    return result;
  }, { ...metrics });

const sumCampaignEffects = (first: Partial<Resources>, second: Partial<Resources>): Partial<Resources> =>
  resourceKeys.reduce<Partial<Resources>>((result, key) => {
    const amount = (first[key] ?? 0) + (second[key] ?? 0);
    if (amount !== 0) result[key] = amount;
    return result;
  }, {});

export function meetsEngagementRequirements(metrics: EngagementMetrics, requirements?: EngagementRequirements): boolean {
  return engagementMetricKeys.every((key) => {
    const minimum = requirements?.min?.[key];
    const maximum = requirements?.max?.[key];
    return (minimum === undefined || metrics[key] >= minimum)
      && (maximum === undefined || metrics[key] <= maximum);
  });
}

export function getEngagementPlan(definition: EngagementDefinition, planId: string): EngagementPlan {
  const plan = definition.plans.find((candidate) => candidate.id === planId);
  if (!plan) throw new Error(`Unknown engagement plan: ${planId}`);
  return plan;
}

export function getEngagementCondition(definition: EngagementDefinition, conditionId: string): EngagementCondition {
  const condition = definition.conditions.find((candidate) => candidate.id === conditionId);
  if (!condition) throw new Error(`Unknown engagement condition: ${conditionId}`);
  return condition;
}

export function createEngagementState(definition: EngagementDefinition, planId: string, conditionId: string): EngagementState {
  const plan = getEngagementPlan(definition, planId);
  const condition = getEngagementCondition(definition, conditionId);
  const afterPlan = applyMetricEffects(definition.initialMetrics, plan.initialEffects);
  return {
    saveVersion: 1,
    engagementId: definition.id,
    planId,
    conditionId,
    pulseIndex: 0,
    metrics: applyMetricEffects(afterPlan, condition.localEffects),
    history: [],
    completed: false,
  };
}

export function availableEngagementCommands(definition: EngagementDefinition, state: EngagementState): EngagementCommand[] {
  if (state.completed) return [];
  if (state.engagementId !== definition.id) throw new Error(`Engagement state targets ${state.engagementId}, not ${definition.id}.`);
  const pulse = definition.pulses[state.pulseIndex];
  if (!pulse) throw new Error(`Engagement state has invalid pulse index ${state.pulseIndex}.`);
  const plan = getEngagementPlan(definition, state.planId);
  const allowed = new Set(plan.allowedCommands[pulse.id] ?? []);
  return pulse.commandIds.flatMap((commandId) => {
    const command = definition.commands.find((candidate) => candidate.id === commandId && candidate.pulseId === pulse.id);
    return command && allowed.has(command.id) && meetsEngagementRequirements(state.metrics, command.requirements) ? [command] : [];
  });
}

function selectEngagementOutcome(definition: EngagementDefinition, metrics: EngagementMetrics): EngagementOutcome {
  const outcome = definition.outcomes.find((candidate) => meetsEngagementRequirements(metrics, candidate.requirements));
  if (!outcome) throw new Error("Completed engagement has no authored outcome.");
  return outcome;
}

export function resolveEngagementCommand(definition: EngagementDefinition, state: EngagementState, commandId: string): EngagementState {
  if (state.completed) throw new Error("The engagement is already complete.");
  const command = availableEngagementCommands(definition, state).find((candidate) => candidate.id === commandId);
  if (!command) throw new Error(`Command ${commandId} is not legal at pulse ${state.pulseIndex}.`);
  const pulse = definition.pulses[state.pulseIndex];
  if (!pulse) throw new Error(`Engagement state has invalid pulse index ${state.pulseIndex}.`);

  const before = { ...state.metrics };
  const afterCommand = applyMetricEffects(before, command.effects);
  const afterResponse = applyMetricEffects(afterCommand, command.response.effects);
  const nextPulseIndex = state.pulseIndex + 1;
  const completed = nextPulseIndex === definition.pulses.length;
  const outcome = completed ? selectEngagementOutcome(definition, afterResponse) : undefined;
  const plan = getEngagementPlan(definition, state.planId);

  return {
    ...state,
    pulseIndex: nextPulseIndex,
    metrics: afterResponse,
    history: [...state.history, {
      pulseId: pulse.id,
      commandId: command.id,
      before,
      afterCommand,
      responseId: command.response.id,
      afterResponse,
    }],
    completed,
    outcomeId: outcome?.id,
    campaignEffects: outcome ? sumCampaignEffects(plan.campaignEffects, outcome.campaignEffects) : undefined,
  };
}

const canonicalJson = (value: unknown): string => JSON.stringify(value, (_key, candidate: unknown) => {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;
  return Object.keys(candidate as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((ordered, key) => {
      ordered[key] = (candidate as Record<string, unknown>)[key];
      return ordered;
    }, {});
});

const sameJson = (first: unknown, second: unknown): boolean => canonicalJson(first) === canonicalJson(second);

/**
 * Replays an engagement save from the plan, condition and command identifiers.
 * Stored metrics, responses, outcomes and campaign effects are never trusted.
 */
export function replayEngagementState(definition: EngagementDefinition, input: unknown): EngagementState | null {
  if (!input || typeof input !== "object") return null;
  const saved = input as Partial<EngagementState>;
  if (saved.saveVersion !== 1 || saved.engagementId !== definition.id || typeof saved.planId !== "string"
    || typeof saved.conditionId !== "string" || !Array.isArray(saved.history)) return null;
  try {
    let replayed = createEngagementState(definition, saved.planId, saved.conditionId);
    for (const value of saved.history) {
      if (!value || typeof value !== "object" || replayed.completed) return null;
      const record = value as Partial<EngagementCommandRecord>;
      if (typeof record.commandId !== "string") return null;
      const next = resolveEngagementCommand(definition, replayed, record.commandId);
      if (!sameJson(next.history.at(-1), record)) return null;
      replayed = next;
    }
    const comparableSaved = {
      saveVersion: saved.saveVersion,
      engagementId: saved.engagementId,
      planId: saved.planId,
      conditionId: saved.conditionId,
      pulseIndex: saved.pulseIndex,
      metrics: saved.metrics,
      history: saved.history,
      completed: saved.completed,
      outcomeId: saved.outcomeId,
      campaignEffects: saved.campaignEffects,
    };
    return sameJson(replayed, comparableSaved) ? replayed : null;
  } catch {
    return null;
  }
}
