import { readFile, writeFile } from "node:fs/promises";
import { gzipSync, gunzipSync } from "node:zlib";
import { advanceCrossingCampaign, availableEngagementCommands, canChoose, createCrossingCampaignSave, deriveEnding,
  getNode, reconsiderFailedCrossing, replayCrossingCampaign, selectFieldCondition,
  type Campaign, type CrossingAftermath, type CrossingCampaignEvent, type CrossingCampaignReplay,
  type CrossingCampaignRules, type EngagementDefinition } from "../packages/game-core/src";

const read = async (path: string) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const campaign = await read("../content/campaigns/chapter-01-daze.json") as Campaign;
const definition = await read("../content/engagements/chapter-01-broken-crossing.v1.json") as EngagementDefinition;
const rules = await read("../content/engagements/chapter-01-crossing-campaign.rules.v2.json") as CrossingCampaignRules;
const aftermath = await read("../content/engagements/chapter-01-crossing-aftermath.v2.json") as CrossingAftermath;
const replay = (value: unknown) => replayCrossingCampaign(campaign, definition, rules, value, aftermath);
const advance = (state: CrossingCampaignReplay, event: CrossingCampaignEvent) => advanceCrossingCampaign(campaign, definition, rules, state.save, event, aftermath);
const response = (r: CrossingCampaignReplay["lastResolution"]) => r ? {
  choiceId: r.choice.id, consequence: r.choice.consequence, pressure: r.choice.pressure?.reveal ?? {}, outcome: r.commitment?.outcome ?? {},
} : null;
const snapshot = (state: CrossingCampaignReplay) => ({
  resources: state.campaign.resources, nodeId: state.campaign.currentNodeId, flags: [...state.campaign.flags].sort(),
  completed: state.campaign.completed, failure: state.campaign.failureReason ?? null, ending: deriveEnding(state.campaign),
  history: state.campaign.history.map(h => ({
    nodeId: h.nodeId, choiceId: h.choiceId, conditionId: h.conditionId, oppositionStageId: h.oppositionStageId ?? null,
    methodId: h.methodId ?? null, methodReadId: h.methodReadId ?? null, methodReadMatched: h.methodReadMatched ?? null,
    commitmentId: h.commitmentId ?? null, commitmentOutcomeId: h.commitmentOutcomeId ?? null,
    before: h.before, afterChoice: h.afterChoice, afterCommitment: h.afterCommitment, afterPressure: h.afterPressure,
    afterOpposition: h.afterOpposition, afterMethodRead: h.afterMethodRead, after: h.after,
  })), engagement: state.engagement ?? null, crossings: state.crossings,
  response: response(state.lastResolution), crossingResponses: state.crossingResolutions.map(response),
});
const cases: Array<{ save: unknown; expected: ReturnType<typeof snapshot>; replayCheckpoint: unknown }> = [];
const rejected: unknown[] = [];
const seen = new Set<string>();
function record(state: CrossingCampaignReplay) {
  const key = JSON.stringify(state.save);
  if (seen.has(key)) return;
  seen.add(key);
  let checkpoint: unknown = null;
  if (state.campaign.failureReason && state.crossings.length === 1) checkpoint = reconsiderFailedCrossing(campaign, definition, rules, state.save, aftermath).save;
  cases.push({ save: state.save, expected: snapshot(state), replayCheckpoint: checkpoint });
}
let tacticalPaths = 0;
function visit(state: CrossingCampaignReplay) {
  record(state);
  if (!state.engagement!.completed) {
    for (const command of availableEngagementCommands(definition, state.engagement!)) visit(advance(state, { kind: "crossing-command", commandId: command.id }));
    return;
  }
  tacticalPaths++;
  const finished = advance(state, { kind: "finish-crossing" }); record(finished);
  if (!finished.campaign.completed) for (const choice of getNode(campaign, finished.campaign.currentNodeId).choices) {
    if (canChoose(choice, finished.campaign.resources)) record(advance(finished, { kind: "decision", choiceId: choice.id }));
  }
}
for (const opening of ["read-the-names", "take-the-beacon", "hide-the-register"]) {
  const fields = new Map<string, CrossingCampaignReplay>();
  for (let seed = 0; seed < 100 && fields.size < 2; seed++) {
    const initial = replay(createCrossingCampaignSave(campaign, rules, seed))!; record(initial);
    const opened = advance(initial, { kind: "decision", choiceId: opening }); record(opened);
    const choice = getNode(campaign, opened.campaign.currentNodeId).choices.find(c => canChoose(c, opened.campaign.resources))!;
    const before = advance(opened, { kind: "decision", choiceId: choice.id }); record(before);
    fields.set(selectFieldCondition(campaign, getNode(campaign, before.campaign.currentNodeId), seed, before.campaign.history.length).id, before);
  }
  if (fields.size !== 2) throw Error("Missing field coverage.");
  for (const before of fields.values()) for (const plan of definition.plans) {
    if (canChoose(getNode(campaign, before.campaign.currentNodeId).choices.find(c => c.id === plan.id)!, before.campaign.resources)) {
      const begun = advance(before, { kind: "begin-crossing", planId: plan.id });
      record(advance(begun, { kind: "cancel-crossing" })); visit(begun);
    } else rejected.push({ ...before.save, events: [...before.save.events, { kind: "begin-crossing", planId: plan.id }] });
  }
}
const initial = cases[0]!.save as ReturnType<typeof createCrossingCampaignSave>;
for (const [key, value] of Object.entries({ saveVersion: true, rulesId: "wrong", campaignId: "wrong", seed: true,
  campaignSha256: "0".repeat(64), engagementSha256: "0".repeat(64), events: null, extra: 1 })) rejected.push({ ...initial, [key]: value });
for (const seed of [-1, 1.5, 0x100000000]) rejected.push({ ...initial, seed });
for (const event of [{kind:"finish-crossing"}, {kind:"cancel-crossing"}, {kind:"crossing-command",commandId:"anything"},
  {kind:"decision",choiceId:"missing"}, {kind:"decision",choiceId:"read-the-names",extra:true}]) rejected.push({ ...initial, events: [event] });
for (const item of cases) {
  const save = item.save as typeof initial;
  if (item.expected.engagement?.history.length) rejected.push({ ...save, events: [...save.events, {kind:"cancel-crossing"}] });
  if (item.expected.crossings.length && !item.expected.completed) rejected.push({ ...save, events: [...save.events, {kind:"finish-crossing"}] });
}
if (rejected.some(value => replay(value))) throw Error("Canonical rejection fixture was accepted.");
const failures = cases.filter(c => c.expected.failure).length;
if (tacticalPaths !== 210 || failures === 0) throw Error("Missing tactical path or loss/recovery coverage.");
// These exhaustive snapshots contain much repeated prose. Deterministic gzip
// retains the readable JSON contract without committing megabytes of copies.
const encoded = JSON.stringify({version:1, rulesId: rules.id, tacticalPaths, failures, cases, rejected}) + "\n";
const path = new URL("../content/conformance/crossing-campaign-replays.v2.json.gz", import.meta.url);
if (process.argv.includes("--write")) await writeFile(path, gzipSync(encoded, { level: 9 }));
else if (gunzipSync(await readFile(path)).toString("utf8") !== encoded) throw Error("Crossing campaign fixtures drifted.");
console.log(`Crossing campaign: ${cases.length} checkpoints, ${tacticalPaths} tactical paths, ${failures} terminal-loss checkpoints, ${rejected.length} rejected ledgers.`);
