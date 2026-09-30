import { readFileSync } from "node:fs";
import { createCouncil, councilCanChoose, resolveCouncil, createFanyang, fanyangCanChoose, resolveFanyang,
  type CouncilDefinition, type CouncilState, type FanyangDefinition, type FanyangEntry, type FanyangState } from "../packages/game-core/src";

const chen = JSON.parse(readFileSync(new URL("../content/councils/chen-council.v1.json", import.meta.url), "utf8")) as CouncilDefinition;
const scene = JSON.parse(readFileSync(new URL("../content/councils/fanyang-guarantee.v1.json", import.meta.url), "utf8")) as FanyangDefinition;
const byOpening: Record<string, { availableEntries: number; entriesWithSurrender: number; opened: number; withdrawn: number; deferred: number; amendedRecoveries: number }> = {};
for (const choice of scene.rounds[0]!.choices) byOpening[choice.id] = { availableEntries: 0, entriesWithSurrender: 0, opened: 0, withdrawn: 0, deferred: 0, amendedRecoveries: 0 };
let entries = 0, deadlocks = 0;
const noSurrender: { arrival: string; choices: string[]; grain: number }[] = [];
function audit(council: CouncilState) {
  entries++;
  const entry: FanyangEntry = { version: 1, sceneId: scene.id, id: JSON.stringify(council), councilDefinitionId: chen.id,
    councilSHA256: "a".repeat(64), origin: council.entry, choices: council.history.map(turn => turn.choiceId), metrics: council.metrics, outcome: council.outcome! };
  const initial = createFanyang(scene, entry);
  let canOpen = false;
  for (const opening of scene.rounds[0]!.choices) {
    if (!fanyangCanChoose(scene, initial, opening)) continue;
    const row = byOpening[opening.id]!; row.availableEntries++;
    let opens = false;
    const visit = (state: FanyangState) => {
      if (state.completed) {
        row[state.outcome!]++;
        if (state.outcome === "opened") {
          opens = true; canOpen = true;
          if (state.history.at(-1)?.choiceId === "amend-guarantee") {
            const before = state.history.at(-1)!.before;
            if (Object.entries(scene.gateRequirements).some(([metric, minimum]) => before[metric as keyof typeof before] < minimum!)) row.amendedRecoveries++;
          }
        }
        return;
      }
      const legal = scene.rounds[state.history.length]!.choices.filter(choice => fanyangCanChoose(scene, state, choice));
      if (!legal.length) deadlocks++;
      for (const choice of legal) visit(resolveFanyang(scene, state, choice.id));
    };
    visit(resolveFanyang(scene, initial, opening.id));
    if (opens) row.entriesWithSurrender++;
  }
  if (!canOpen) noSurrender.push({ arrival: council.entry.arrival, choices: entry.choices, grain: entry.metrics.grain });
}
for (const arrival of ["supplied", "pressed", "divided"] as const) {
  const visit = (state: CouncilState) => {
    if (state.completed) { audit(state); return; }
    for (const choice of chen.rounds[state.history.length]!.choices) if (councilCanChoose(state, choice)) visit(resolveCouncil(chen, state, choice.id));
  };
  visit(createCouncil(chen, { id: `balance-${arrival}`, arrival }));
}
console.log(JSON.stringify({ scope: "Exhaustive deterministic routes, not probabilities or human enjoyment evidence", entries, deadlocks, byOpening, noSurrender }, null, 2));
if (entries !== 77 || deadlocks || Object.values(byOpening).some(row => row.entriesWithSurrender === 0 || row.withdrawn === 0)) process.exitCode = 1;
