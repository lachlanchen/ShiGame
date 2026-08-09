import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  canChoose,
  createInitialState,
  deriveEnding,
  getNode,
  resolveChoice,
  selectActiveCommitment,
} from "../packages/game-core/src/engine";
import type { Campaign, ChoiceResolution, GameState } from "../packages/game-core/src/types";

const root = resolve(import.meta.dirname, "..");
const campaignPath = resolve(root, "content/campaigns/chapter-01-daze.json");
export const fixturePath = resolve(root, "content/conformance/chapter-01-replays.v1.json");
export const conformanceSeed = 0x5eed2026;

const snapshot = (state: GameState) => ({
  currentNodeId: state.currentNodeId,
  resources: state.resources,
  flags: state.flags,
  completed: state.completed,
  failureReason: state.failureReason ?? null,
});

const turnFixture = (campaign: Campaign, resolution: ChoiceResolution) => ({
  nodeId: resolution.node.id,
  choiceId: resolution.choice.id,
  conditionId: resolution.condition.id,
  oppositionStageId: resolution.oppositionStage?.id ?? null,
  methodId: resolution.method.id,
  methodReadId: resolution.methodRead?.read.id ?? null,
  methodReadMatched: resolution.methodReadMatched,
  commitmentId: resolution.commitment?.commitment.id ?? null,
  commitmentOutcomeId: resolution.commitment?.outcome.id ?? null,
  playerDeltas: resolution.playerDeltas,
  commitmentDeltas: resolution.commitmentDeltas,
  pressureDeltas: resolution.pressureDeltas,
  oppositionDeltas: resolution.oppositionDeltas,
  methodReadDeltas: resolution.methodReadDeltas,
  fieldDeltas: resolution.fieldDeltas,
  afterChoice: resolution.state.history.at(-1)?.afterChoice,
  afterCommitment: resolution.state.history.at(-1)?.afterCommitment,
  afterPressure: resolution.state.history.at(-1)?.afterPressure,
  afterOpposition: resolution.state.history.at(-1)?.afterOpposition,
  afterMethodRead: resolution.state.history.at(-1)?.afterMethodRead,
  after: resolution.state.resources,
  nextNodeId: resolution.state.currentNodeId,
  completed: resolution.state.completed,
  failureReason: resolution.state.failureReason ?? null,
  activeCommitmentId: selectActiveCommitment(campaign, resolution.state)?.id ?? null,
});

export async function generateConformanceFixture() {
  const campaignBytes = await readFile(campaignPath);
  const campaign = JSON.parse(campaignBytes.toString("utf8")) as Campaign;
  const routes: Array<{
    id: string;
    choiceIds: string[];
    turns: ReturnType<typeof turnFixture>[];
    final: ReturnType<typeof snapshot> & { ending: ReturnType<typeof deriveEnding> };
  }> = [];

  const visit = (state: GameState, turns: ReturnType<typeof turnFixture>[]) => {
    if (state.completed) {
      const choiceIds = turns.map((turn) => turn.choiceId);
      routes.push({
        id: choiceIds.join("__"),
        choiceIds,
        turns,
        final: { ...snapshot(state), ending: deriveEnding(state) },
      });
      return;
    }
    const node = getNode(campaign, state.currentNodeId);
    const legalChoices = node.choices.filter((choice) => canChoose(choice, state.resources));
    if (legalChoices.length === 0) throw new Error(`Conformance traversal deadlocked at ${node.id}.`);
    for (const choice of legalChoices) {
      const resolution = resolveChoice(campaign, state, choice.id);
      visit(resolution.state, [...turns, turnFixture(campaign, resolution)]);
    }
  };

  visit(createInitialState(campaign, conformanceSeed), []);
  routes.sort((left, right) => left.id.localeCompare(right.id));
  return {
    fixtureVersion: 1,
    campaignId: campaign.id,
    campaignSchemaVersion: campaign.schemaVersion,
    saveVersion: 6,
    seed: conformanceSeed,
    campaignSha256: createHash("sha256").update(campaignBytes).digest("hex"),
    generatedBy: "scripts/generate-conformance-fixtures.ts",
    routeCount: routes.length,
    successfulRoutes: routes.filter((route) => !route.final.failureReason).length,
    failureRoutes: routes.filter((route) => route.final.failureReason).length,
    routes,
  };
}

if (process.argv.includes("--write")) {
  const fixture = await generateConformanceFixture();
  const serialized = `${JSON.stringify(fixture, null, 2)}\n`;
  await mkdir(dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, serialized);
  console.log(`Wrote ${fixture.routeCount} cross-engine replay routes to ${fixturePath}.`);
}
