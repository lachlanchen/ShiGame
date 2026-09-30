import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { councilCanChoose, createCouncil, resolveCouncil, type CouncilDefinition, type CouncilState } from "../packages/game-core/src/council";

const root = resolve(import.meta.dirname, "..");
const bytes = await readFile(resolve(root, "content/councils/chen-council.v1.json"));
const definition = JSON.parse(bytes.toString()) as CouncilDefinition;
const routes: { arrival: string; choices: string[]; turns: CouncilState["history"]; metrics: CouncilState["metrics"]; outcome: string }[] = [];
for (const arrival of ["supplied", "pressed", "divided"] as const) {
  const visit = (state: CouncilState) => {
    if (state.completed) {
      routes.push({ arrival, choices: state.history.map(t => t.choiceId), turns: state.history, metrics: state.metrics, outcome: state.outcome! });
      return;
    }
    const legal = definition.rounds[state.history.length]!.choices.filter(choice => councilCanChoose(state, choice));
    assert(legal.length > 0);
    for (const choice of legal) visit(resolveCouncil(definition, state, choice.id));
  };
  visit(createCouncil(definition, { id: `conformance-${arrival}`, arrival }));
}
assert.equal(routes.length, 77);
const fixture = { fixtureVersion: 1, definitionId: definition.id, definitionSHA256: createHash("sha256").update(bytes).digest("hex"), routeCount: routes.length, routes };
const path = resolve(root, "content/conformance/chen-council-replays.v1.json");
if (process.argv.includes("--write")) await writeFile(path, `${JSON.stringify(fixture)}\n`);
else assert.deepEqual(JSON.parse(await readFile(path, "utf8")), fixture, "Council replay fixtures are stale; review rules before regenerating");
console.log(`Council conformance ${process.argv.includes("--write") ? "written" : "verified"}: ${routes.length} routes, ${routes.reduce((n, r) => n + r.turns.length, 0)} turns, all five metrics and four outcomes.`);
