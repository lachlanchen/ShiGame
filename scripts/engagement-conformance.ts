import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { availableEngagementCommands, createEngagementState, replayEngagementState, resolveEngagementCommand,
  type EngagementDefinition, type EngagementState } from "../packages/game-core/src";

// Deterministic canonical checkpoints, not native-generated expectations.
const bytes = await readFile(new URL("../content/engagements/chapter-01-broken-crossing.v1.json", import.meta.url));
const definition = JSON.parse(bytes.toString()) as EngagementDefinition;
const checkpoints: Array<{ state: EngagementState; available: string[] }> = [];
const rejected: unknown[] = [];
const visit = (state: EngagementState) => {
  checkpoints.push({ state, available: availableEngagementCommands(definition, state).map(command => command.id) });
  for (const command of availableEngagementCommands(definition, state)) visit(resolveEngagementCommand(definition, state, command.id));
};
for (const plan of definition.plans) for (const condition of definition.conditions) visit(createEngagementState(definition, plan.id, condition.id));
const initial = checkpoints[0]!.state;
const finished = checkpoints.find(item => item.state.completed)!.state;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
for (const [key, value] of Object.entries({ saveVersion: true, engagementId: "foreign", planId: "missing", conditionId: "missing", pulseIndex: 999,
  metrics: { ...initial.metrics, crossingProgress: 999 }, history: null, completed: true, outcomeId: "orderly-crossing", campaignEffects: { grain: 99 } })) {
  rejected.push({ ...clone(initial), [key]: value });
}
for (const mutate of [
  (state: EngagementState) => { state.history[0]!.before.crossingProgress++; },
  (state: EngagementState) => { state.history[0]!.afterCommand.rearCohesion++; },
  (state: EngagementState) => { state.history[0]!.afterResponse.signalIntegrity++; },
  (state: EngagementState) => { state.history[0]!.responseId = "invented"; },
  (state: EngagementState) => { state.history[0]!.pulseId = "invented"; },
  (state: EngagementState) => { state.history[0]!.commandId = "not-an-order"; },
  (state: EngagementState) => { state.history.push(clone(state.history[0]!)); },
]) { const state = clone(finished); mutate(state); rejected.push(state); }
for (const value of rejected) if (replayEngagementState(definition, value)) throw new Error("Tamper fixture unexpectedly accepted by canonical replay.");
const fixture = { schemaVersion: 1, engagementId: definition.id, definitionSha256: createHash("sha256").update(bytes).digest("hex"),
  boundary: "Tactical-only conformance; not campaign authority, native UI or save-session qualification.", checkpoints, rejected };
const output = new URL("../content/conformance/crossing-tactical-replays.v1.json", import.meta.url);
const encoded = JSON.stringify(fixture) + "\n";
if (process.argv.includes("--write")) await writeFile(output, encoded);
else if (await readFile(output, "utf8") !== encoded) throw new Error("Crossing tactical fixtures drifted; review before regenerating.");
console.log(`Crossing tactical fixtures: ${checkpoints.length} checkpoints, ${checkpoints.filter(item => item.state.completed).length} complete paths, ${rejected.length} corrupt states rejected.`);
