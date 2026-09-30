import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createFanyang, fanyangCanChoose, fanyangProspects, resolveFanyang, type FanyangDefinition, type FanyangEntry, type FanyangState } from "../packages/game-core/src";
const root = resolve(import.meta.dirname, "..");
const bytes = readFileSync(resolve(root, "content/councils/fanyang-guarantee.v1.json"));
const definition = JSON.parse(bytes.toString()) as FanyangDefinition;
const council = JSON.parse(readFileSync(resolve(root, "content/conformance/chen-council-replays.v1.json"), "utf8"));
const states: unknown[] = [];
let endings = 0;
for (const route of council.routes) {
  const entry: FanyangEntry = { version: 1, sceneId: definition.id, id: JSON.stringify([route.arrival, route.choices]),
    councilDefinitionId: council.definitionId, councilSHA256: council.definitionSHA256,
    origin: { id: `conformance-${route.arrival}`, arrival: route.arrival }, choices: route.choices, metrics: route.metrics, outcome: route.outcome };
  const visit = (state: FanyangState) => {
    const available = (definition.rounds[state.history.length]?.choices ?? []).filter(choice => fanyangCanChoose(definition, state, choice));
    states.push({ arrival: route.arrival, councilChoices: route.choices, choices: state.history.map(turn => turn.choiceId),
      metrics: state.metrics, history: state.history, outcome: state.outcome ?? null,
      available: available.map(choice => choice.id), prospects: fanyangProspects(definition, state) });
    if (state.completed) { endings++; return; }
    if (!available.length) throw new Error("Fan Yang deadlock");
    for (const choice of available) visit(resolveFanyang(definition, state, choice.id));
  };
  visit(createFanyang(definition, entry));
}
if (endings !== 993) throw new Error(`Review route count change: ${endings}`);
const output = process.argv[2];
if (!output) throw new Error("Supply an output JSON path in a private runtime staging directory");
writeFileSync(output, JSON.stringify({ version: 1, definitionSHA256: createHash("sha256").update(bytes).digest("hex"),
  councilSHA256: council.definitionSHA256, councilRoutes: council.routes.length, endings, states }));
console.log(`Fan Yang parity fixture: ${states.length} states, ${endings} endings from ${council.routes.length} councils.`);
