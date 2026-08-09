import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  availableEngagementCommands,
  createEngagementState,
  engagementMetricKeys,
  replayEngagementState,
  resolveEngagementCommand,
  resourceKeys,
  supportedLocales,
} from "../packages/game-core/src";
import type {
  Campaign,
  EngagementDefinition,
  EngagementMetricEffects,
  EngagementRequirements,
  EngagementState,
  LocalizedText,
  Resources,
} from "../packages/game-core/src";

const root = resolve(import.meta.dirname, "..");
const definition = JSON.parse(await readFile(resolve(root, "content/engagements/chapter-01-broken-crossing.v1.json"), "utf8")) as EngagementDefinition;
const campaign = JSON.parse(await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"), "utf8")) as Campaign;
const errors: string[] = [];
const assert = (condition: unknown, message: string): void => { if (!condition) errors.push(message); };
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const metricKeySet = new Set<string>(engagementMetricKeys);
const resourceKeySet = new Set<string>(resourceKeys);
const localeKeySet = new Set<string>(supportedLocales);

const onlyKeys = (value: object, allowed: readonly string[], label: string): void => {
  for (const key of Object.keys(value)) assert(allowed.includes(key), `${label} contains unknown field ${key}`);
};

const sameSet = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length && actual.every((value) => expected.includes(value));

const localized = (value: LocalizedText | undefined, label: string): void => {
  assert(typeof value?.en === "string" && value.en.trim().length > 0, `${label} requires English`);
  assert(typeof value?.["zh-Hans"] === "string" && value["zh-Hans"].trim().length > 0, `${label} requires Simplified Chinese`);
  for (const key of Object.keys(value ?? {})) assert(localeKeySet.has(key), `${label} contains unsupported locale ${key}`);
};

const validateMetricEffects = (effects: EngagementMetricEffects | undefined, label: string, minimum = -25, maximum = 25): void => {
  assert(effects !== undefined && Object.keys(effects).length > 0, `${label} must contain at least one metric effect`);
  for (const [key, value] of Object.entries(effects ?? {})) {
    assert(metricKeySet.has(key), `${label} contains unknown metric ${key}`);
    assert(Number.isInteger(value) && value >= minimum && value <= maximum, `${label}.${key} must be an integer from ${minimum} to ${maximum}`);
  }
};

const validateRequirements = (requirements: EngagementRequirements | undefined, label: string): void => {
  if (!requirements) return;
  assert(Object.keys(requirements).every((key) => key === "min" || key === "max"), `${label} contains an unknown requirements field`);
  assert(Boolean(requirements.min || requirements.max), `${label} must contain min or max thresholds`);
  for (const side of ["min", "max"] as const) {
    for (const [key, value] of Object.entries(requirements[side] ?? {})) {
      assert(metricKeySet.has(key), `${label}.${side} contains unknown metric ${key}`);
      assert(Number.isInteger(value) && value >= 0 && value <= 100, `${label}.${side}.${key} must be an integer from 0 to 100`);
    }
  }
};

const validateCampaignEffects = (effects: Partial<Resources>, label: string): void => {
  for (const [key, value] of Object.entries(effects)) {
    assert(resourceKeySet.has(key), `${label} contains unknown campaign resource ${key}`);
    assert(Number.isInteger(value) && value >= -25 && value <= 25, `${label}.${key} must be an integer from -25 to 25`);
  }
};

onlyKeys(definition, ["schemaVersion", "id", "campaignId", "nodeId", "deliveryStatus", "claimStatus", "title", "objective", "sourceRefs", "claimRefs", "metrics", "initialMetrics", "conditions", "plans", "pulses", "commands", "outcomes"], "engagement");
assert(definition.schemaVersion === 1, "engagement schemaVersion must be 1");
assert(definition.id === "chapter-01-broken-crossing", "engagement id drifted");
assert(definition.campaignId === campaign.id, "engagement campaignId does not close to the campaign");
assert(definition.nodeId === "broken-crossing", "engagement nodeId drifted");
assert(definition.deliveryStatus === "validated-shared-contract-not-campaign-authority", "engagement must remain non-authoritative until both clients ship it");
assert(definition.claimStatus === "dramatic-reconstruction", "engagement must disclose dramatic reconstruction status");
localized(definition.title, "engagement.title");
localized(definition.objective, "engagement.objective");
assert(sameSet(definition.metrics, [...engagementMetricKeys]), "engagement metric registry must exactly match game-core");
assert(sameSet(Object.keys(definition.initialMetrics), [...engagementMetricKeys]), "initialMetrics must define every metric exactly once");
for (const [key, value] of Object.entries(definition.initialMetrics))
  assert(Number.isInteger(value) && value >= 0 && value <= 100, `initialMetrics.${key} must be an integer from 0 to 100`);

const sourceIds = new Set(campaign.sources.map((source) => source.id));
const claimIds = new Set(campaign.claims.map((claim) => claim.id));
assert(new Set(definition.sourceRefs).size === definition.sourceRefs.length && definition.sourceRefs.length > 0, "sourceRefs must be non-empty and unique");
assert(new Set(definition.claimRefs).size === definition.claimRefs.length && definition.claimRefs.length > 0, "claimRefs must be non-empty and unique");
for (const sourceRef of definition.sourceRefs) assert(sourceIds.has(sourceRef), `engagement sourceRef ${sourceRef} is missing from the campaign`);
for (const claimRef of definition.claimRefs) {
  const claim = campaign.claims.find((candidate) => candidate.id === claimRef);
  assert(Boolean(claim), `engagement claimRef ${claimRef} is missing from the campaign`);
  for (const sourceRef of claim?.sourceRefs ?? [])
    assert(definition.sourceRefs.includes(sourceRef), `engagement sourceRefs omit ${sourceRef}, required by claim ${claimRef}`);
}

const node = campaign.nodes.find((candidate) => candidate.id === definition.nodeId);
assert(Boolean(node), `campaign node ${definition.nodeId} does not exist`);
const expectedConditionIds = node?.conditions.map((condition) => condition.id) ?? [];
const expectedPlanIds = node?.choices.map((choice) => choice.id) ?? [];
assert(sameSet(definition.conditions.map((condition) => condition.id), expectedConditionIds), "engagement conditions must exactly mirror the campaign node conditions");
assert(sameSet(definition.plans.map((plan) => plan.id), expectedPlanIds), "engagement plans must exactly mirror the campaign node choices");

for (const condition of definition.conditions) {
  onlyKeys(condition, ["id", "title", "signal", "localEffects"], `condition ${condition.id}`);
  assert(idPattern.test(condition.id), `condition ${condition.id} has an invalid id`);
  localized(condition.title, `condition ${condition.id}.title`);
  localized(condition.signal, `condition ${condition.id}.signal`);
  validateMetricEffects(condition.localEffects, `condition ${condition.id}.localEffects`);
}

const pulseIds = definition.pulses.map((pulse) => pulse.id);
assert(pulseIds.length === 3 && new Set(pulseIds).size === pulseIds.length, "engagement requires exactly three unique command pulses");
const commandIds = definition.commands.map((command) => command.id);
const commandIdSet = new Set(commandIds);
assert(commandIdSet.size === commandIds.length, "engagement command ids must be unique");
const responseIds = definition.commands.map((command) => command.response.id);
assert(new Set(responseIds).size === responseIds.length, "engagement response ids must be unique");

const pulseCommandIds: string[] = [];
for (const pulse of definition.pulses) {
  onlyKeys(pulse, ["id", "title", "objective", "commandIds"], `pulse ${pulse.id}`);
  assert(idPattern.test(pulse.id), `pulse ${pulse.id} has an invalid id`);
  localized(pulse.title, `pulse ${pulse.id}.title`);
  localized(pulse.objective, `pulse ${pulse.id}.objective`);
  assert(pulse.commandIds.length >= 2 && new Set(pulse.commandIds).size === pulse.commandIds.length, `pulse ${pulse.id} requires at least two unique commands`);
  for (const commandId of pulse.commandIds) {
    pulseCommandIds.push(commandId);
    const command = definition.commands.find((candidate) => candidate.id === commandId);
    assert(Boolean(command), `pulse ${pulse.id} references missing command ${commandId}`);
    assert(command?.pulseId === pulse.id, `command ${commandId} has the wrong pulseId`);
  }
}
assert(sameSet(pulseCommandIds, commandIds) && pulseCommandIds.length === commandIds.length, "every command must appear in exactly one pulse");

for (const plan of definition.plans) {
  onlyKeys(plan, ["id", "title", "mainEffort", "withdrawalCondition", "initialEffects", "campaignEffects", "allowedCommands"], `plan ${plan.id}`);
  assert(idPattern.test(plan.id), `plan ${plan.id} has an invalid id`);
  localized(plan.title, `plan ${plan.id}.title`);
  localized(plan.mainEffort, `plan ${plan.id}.mainEffort`);
  localized(plan.withdrawalCondition, `plan ${plan.id}.withdrawalCondition`);
  validateMetricEffects(plan.initialEffects, `plan ${plan.id}.initialEffects`);
  validateCampaignEffects(plan.campaignEffects, `plan ${plan.id}.campaignEffects`);
  assert(sameSet(Object.keys(plan.allowedCommands), pulseIds), `plan ${plan.id} must define exactly the authored pulse keys`);
  for (const pulse of definition.pulses) {
    const allowed = plan.allowedCommands[pulse.id] ?? [];
    assert(allowed.length >= 2 && new Set(allowed).size === allowed.length, `plan ${plan.id} requires at least two unique commands at ${pulse.id}`);
    for (const commandId of allowed)
      assert(pulse.commandIds.includes(commandId), `plan ${plan.id} allows ${commandId} outside pulse ${pulse.id}`);
  }
}

for (const command of definition.commands) {
  onlyKeys(command, ["id", "pulseId", "order", "title", "intent", "effects", "requirements", "response"], `command ${command.id}`);
  assert(idPattern.test(command.id), `command ${command.id} has an invalid id`);
  assert(pulseIds.includes(command.pulseId), `command ${command.id} references an unknown pulse`);
  assert(["anchor", "advance", "screen", "shift", "feint", "reserve", "withdraw"].includes(command.order), `command ${command.id} has an invalid order`);
  localized(command.title, `command ${command.id}.title`);
  localized(command.intent, `command ${command.id}.intent`);
  validateMetricEffects(command.effects, `command ${command.id}.effects`);
  validateRequirements(command.requirements, `command ${command.id}.requirements`);
  assert(idPattern.test(command.response.id), `command ${command.id} response has an invalid id`);
  onlyKeys(command.response, ["id", "kind", "reveal", "effects"], `command ${command.id}.response`);
  assert(["state", "terrain", "supply", "network"].includes(command.response.kind), `command ${command.id} response has an invalid kind`);
  localized(command.response.reveal, `command ${command.id}.response.reveal`);
  validateMetricEffects(command.response.effects, `command ${command.id}.response.effects`);
}

const outcomeIds = definition.outcomes.map((outcome) => outcome.id);
assert(outcomeIds.length === 4 && new Set(outcomeIds).size === outcomeIds.length, "engagement requires exactly four unique outcomes");
assert(definition.outcomes.map((outcome) => outcome.status).join(",") === "success,costly-success,withdrawal,failure", "outcomes must remain ordered best-to-fallback");
assert(definition.outcomes.at(-1)?.requirements === undefined, "the final outcome must be an unconditional fallback");
for (const outcome of definition.outcomes) {
  onlyKeys(outcome, ["id", "status", "title", "summary", "requirements", "campaignEffects"], `outcome ${outcome.id}`);
  assert(idPattern.test(outcome.id), `outcome ${outcome.id} has an invalid id`);
  localized(outcome.title, `outcome ${outcome.id}.title`);
  localized(outcome.summary, `outcome ${outcome.id}.summary`);
  validateRequirements(outcome.requirements, `outcome ${outcome.id}.requirements`);
  validateCampaignEffects(outcome.campaignEffects, `outcome ${outcome.id}.campaignEffects`);
}

type RouteStats = { routes: number; viable: number; outcomes: Set<string>; commandIds: Set<string> };
const aggregate: RouteStats = { routes: 0, viable: 0, outcomes: new Set(), commandIds: new Set() };
const matrix = new Map<string, RouteStats>();

const visit = (state: EngagementState, stats: RouteStats): void => {
  if (state.completed) {
    assert(state.history.length === definition.pulses.length, `completed route ${state.planId}/${state.conditionId} has the wrong history length`);
    assert(typeof state.outcomeId === "string" && outcomeIds.includes(state.outcomeId), `completed route ${state.planId}/${state.conditionId} has no authored outcome`);
    assert(replayEngagementState(definition, structuredClone(state)) !== null, `exact replay failed for ${state.planId}/${state.conditionId}`);
    const outcome = definition.outcomes.find((candidate) => candidate.id === state.outcomeId);
    stats.routes += 1;
    aggregate.routes += 1;
    if (outcome?.status === "success" || outcome?.status === "costly-success") {
      stats.viable += 1;
      aggregate.viable += 1;
    }
    if (state.outcomeId) {
      stats.outcomes.add(state.outcomeId);
      aggregate.outcomes.add(state.outcomeId);
    }
    for (const record of state.history) {
      stats.commandIds.add(record.commandId);
      aggregate.commandIds.add(record.commandId);
    }
    return;
  }
  const legal = availableEngagementCommands(definition, state);
  assert(legal.length > 0, `deadlocked route at ${state.planId}/${state.conditionId}/pulse-${state.pulseIndex}`);
  for (const command of legal) {
    const before = structuredClone(state);
    const first = resolveEngagementCommand(definition, state, command.id);
    const second = resolveEngagementCommand(definition, state, command.id);
    assert(JSON.stringify(first) === JSON.stringify(second), `command ${command.id} is not deterministic`);
    assert(JSON.stringify(state) === JSON.stringify(before), `command ${command.id} mutated its input state`);
    visit(first, stats);
  }
};

for (const plan of definition.plans) {
  for (const condition of definition.conditions) {
    const key = `${plan.id}/${condition.id}`;
    const stats: RouteStats = { routes: 0, viable: 0, outcomes: new Set(), commandIds: new Set() };
    visit(createEngagementState(definition, plan.id, condition.id), stats);
    matrix.set(key, stats);
    assert(stats.routes >= 4, `${key} does not expose enough command routes`);
    assert(stats.viable > 0, `${key} has no successful or costly-success route`);
  }
}

for (const condition of definition.conditions) {
  const viablePlans = definition.plans.filter((plan) => (matrix.get(`${plan.id}/${condition.id}`)?.viable ?? 0) > 0);
  assert(viablePlans.length >= 2, `condition ${condition.id} has fewer than two viable plans`);
}
assert(aggregate.routes >= 50, "engagement exhaustive traversal has fewer than 50 routes");
assert(sameSet([...aggregate.outcomes], outcomeIds), "not every authored outcome is reachable");
assert(sameSet([...aggregate.commandIds], commandIds), "not every authored command is reachable");

let tamperedRejected = false;
for (const plan of definition.plans) {
  const condition = definition.conditions[0];
  if (!condition) continue;
  let state = createEngagementState(definition, plan.id, condition.id);
  while (!state.completed) {
    const command = availableEngagementCommands(definition, state)[0];
    if (!command) break;
    state = resolveEngagementCommand(definition, state, command.id);
  }
  if (state.completed) {
    const tampered = structuredClone(state);
    if (tampered.history[0]) tampered.history[0].responseId = "invented-response";
    tamperedRejected = replayEngagementState(definition, tampered) === null;
    break;
  }
}
assert(tamperedRejected, "engagement replay accepted a tampered authored response");

if (errors.length > 0) {
  console.error(`Engagement validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const matrixSummary = [...matrix.entries()]
  .map(([key, stats]) => `${key}=${stats.routes}/${stats.viable}`)
  .join(", ");
console.log(`Engagement contract valid: ${aggregate.routes} exhaustive routes, ${aggregate.viable} viable, ${aggregate.outcomes.size} outcomes, replay tamper rejection; ${matrixSummary}.`);
