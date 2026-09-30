import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInitialState, resolveChoice, councilEntry, createCouncil, resolveCouncil,
  createFanyang, resolveFanyang, fanyangCanChoose, createRetreat, inspectRetreatChoice, resolveRetreat,
  type Campaign, type CouncilDefinition, type FanyangDefinition, type FanyangState,
  type RetreatDefinition, type RetreatEntry, type RetreatState } from "../packages/game-core/src";

const root = resolve(import.meta.dirname, "..");
function load(path: string) {
  const bytes = readFileSync(resolve(root, path));
  return { value: JSON.parse(bytes.toString()), hash: createHash("sha256").update(bytes).digest("hex") };
}
const campaign = load("content/campaigns/chapter-01-daze.json");
const council = load("content/councils/chen-council.v1.json");
const fanyang = load("content/councils/fanyang-guarantee.v1.json");
const rules = load("content/campaigns/chen-retreat.rules.v1.json");
const story = load("content/story-drafts/chen-retreat.v1.json");
const chapterChoices = ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"];
const councilChoices = ["defer-title", "joint-ledger", "one-command"];
let chapter = createInitialState(campaign.value as Campaign, 0);
for (const id of chapterChoices) chapter = resolveChoice(campaign.value, chapter, id).state;
const origin = councilEntry(chapter);
if (!origin || !chapter.completed || chapter.failureReason) throw new Error("Invalid chapter fixture");
let councilState = createCouncil(council.value as CouncilDefinition, origin);
for (const id of councilChoices) councilState = resolveCouncil(council.value, councilState, id);
const first = createFanyang(fanyang.value as FanyangDefinition, {
  version: 1, sceneId: fanyang.value.id, id: "native-parity-origin", councilDefinitionId: council.value.id,
  councilSHA256: council.hash, origin, choices: councilChoices, metrics: councilState.metrics, outcome: councilState.outcome!,
});
const entries: unknown[] = [];
let stateCount = 0, endings = 0;
const outcomes = new Set<string>();
function visitFanyang(state: FanyangState) {
  if (!state.completed) {
    for (const choice of fanyang.value.rounds[state.history.length].choices) {
      if (fanyangCanChoose(fanyang.value, state, choice)) visitFanyang(resolveFanyang(fanyang.value, state, choice.id));
    }
    return;
  }
  const fanyangChoices = state.history.map(turn => turn.choiceId);
  const entry: RetreatEntry = {
    version: 1, sceneId: "chen-retreat-story-draft.v1", id: JSON.stringify(fanyangChoices),
    revisions: { campaign: campaign.hash, council: council.hash, fanyang: fanyang.hash }, chapter,
    council: { choices: councilChoices, outcome: councilState.outcome! },
    fanyang: { choices: fanyangChoices, metrics: state.metrics, outcome: state.outcome! },
    continuity: { registerOpening: "read-publicly", crossingOrder: "repair-the-ford", courierRecruitedEarlier: false,
      currentCompanionPresence: { yu: "unestablished", han: "unestablished" } },
    readingContext: { fanyang: state.outcome!, yu: "unestablished", han: "unestablished" },
  };
  const cases: unknown[] = [];
  function walk(current: RetreatState) {
    const inspections = current.completed ? [] : (rules.value as RetreatDefinition).scenes[current.history.length]!.choices.map(choice => {
      const preview = inspectRetreatChoice(rules.value, current, choice.id);
      return { id: choice.id, available: preview.available, effects: preview.effects,
        after: preview.after, outcome: preview.outcome ?? null, newDebt: preview.newDebt ?? null };
    });
    cases.push({ choices: current.history.map(turn => turn.choiceId), history: current.history,
      metrics: current.metrics, debts: current.debts, outcome: current.outcome ?? null,
      resourceCustody: current.resourceCustody, inspections });
    stateCount++;
    if (current.completed) { endings++; outcomes.add(current.outcome!); }
    else for (const choice of inspections.filter(item => item.available)) walk(resolveRetreat(rules.value, current, choice.id));
  }
  walk(createRetreat(rules.value, entry));
  entries.push({ fanyangChoices, cases });
}
visitFanyang(first);
if (entries.length !== 18 || outcomes.size !== 4) throw new Error("Review parity coverage");
const output = process.argv[2];
if (!output) throw new Error("Supply a private runtime fixture output path");
writeFileSync(output, JSON.stringify({ version: 1, hashes: { campaign: campaign.hash, council: council.hash,
  fanyang: fanyang.hash, rules: rules.hash, story: story.hash }, chapterChoices, councilChoices,
  entries, stateCount, endings, outcomes: [...outcomes].sort() }));
console.log(`Retreat reference: ${entries.length} real Fan Yang entries, ${stateCount} states, ${endings} endings, ${[...outcomes].sort().join(", ")}.`);
