import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  advanceCrossingCampaign, availableEngagementCommands, canChoose, createCrossingCampaignSave,
  councilEntry, deriveEnding, getNode, replayCrossingCampaign, reconsiderFailedCrossing,
  type Campaign, type CrossingAftermath, type CrossingCampaignReplay, type CrossingCampaignRules, type EngagementDefinition,
} from "../packages/game-core/src";

const campaignBytes = await readFile(new URL("../content/campaigns/chapter-01-daze.json", import.meta.url));
const engagementBytes = await readFile(new URL("../content/engagements/chapter-01-broken-crossing.v1.json", import.meta.url));
const campaign = JSON.parse(campaignBytes.toString()) as Campaign;
const definition = JSON.parse(engagementBytes.toString()) as EngagementDefinition;
const revision = process.argv.includes("--v2") ? 2 : 1;
const rules = JSON.parse(await readFile(new URL(`../content/engagements/chapter-01-crossing-campaign.rules.v${revision}.json`, import.meta.url), "utf8")) as CrossingCampaignRules;
const aftermathBytes = revision === 2 ? await readFile(new URL("../content/engagements/chapter-01-crossing-aftermath.v2.json", import.meta.url)) : undefined;
const aftermath = aftermathBytes ? JSON.parse(aftermathBytes.toString()) as CrossingAftermath : undefined;
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
if (rules.campaignSha256 !== hash(campaignBytes) || rules.engagementSha256 !== hash(engagementBytes)) {
  throw new Error("Crossing integration inputs changed: review and version the rules/migration before adoption.");
}
if (aftermathBytes && rules.aftermathSha256 !== hash(aftermathBytes)) throw new Error("Crossing reaction content changed without a reviewed rules revision.");
if (aftermath) {
  const text = (value: { en?: string; "zh-Hans"?: string }) => {
    if (!value.en?.trim() || !value["zh-Hans"]?.trim()) throw new Error("Crossing reaction requires both authored languages.");
  };
  for (const outcome of definition.outcomes) { text(aftermath.outcomes[outcome.id]!.reaction); text(aftermath.outcomes[outcome.id]!.pressure); }
  for (const terminal of Object.values(aftermath.terminal)) text(terminal);
  for (const commitment of campaign.commitments) for (const status of ["kept", "strained", "broken"] as const) {
    const profile = aftermath.commitments[commitment.id]![status]; text(profile.response);
    for (const [key, value] of Object.entries(profile.effects)) {
      if (!["grain", "trust", "momentum", "people", "danger"].includes(key) || !Number.isInteger(value) || Math.abs(value) > 25) throw new Error("Invalid crossing promise effect.");
    }
  }
}
if (Object.keys(rules).sort().join(",") !== ["schemaVersion", "id", "deliveryStatus", "campaignId", "engagementId", "nodeId", "effectPolicy", "campaignSha256", "engagementSha256", ...(revision === 2 ? ["aftermathId", "aftermathSha256"] : [])].sort().join(",")) {
  throw new Error("Unexpected crossing integration contract fields.");
}

let checkpoints = 0;
let terminalRoutes = 0;
let recoveryCheckpoints = 0;
const failures: Record<string, number> = {};
const arrivals: Record<string, number> = {};
const outcomes: Record<string, number> = {};
const conditions = new Set<string>();
const promiseJudgments = new Map<string, Set<string>>();
const fateGroups = new Map<string, Set<string>>();
const visit = (state: CrossingCampaignReplay) => {
  checkpoints++;
  const resumed = replayCrossingCampaign(campaign, definition, rules, JSON.parse(JSON.stringify(state.save)), aftermath);
  if (!resumed || JSON.stringify(resumed) !== JSON.stringify(state)) throw new Error("Cold replay drifted.");
  const commitment = state.crossingResolutions.at(-1)?.commitment;
  if (commitment) {
    const statuses = promiseJudgments.get(commitment.commitment.id) ?? new Set<string>();
    statuses.add(commitment.outcome.status); promiseJudgments.set(commitment.commitment.id, statuses);
  }
  if (state.campaign.completed) {
    terminalRoutes++;
    if (state.campaign.failureReason && state.crossings.length === 1) {
      const original = JSON.stringify(state);
      const checkpoint = reconsiderFailedCrossing(campaign, definition, rules, state.save, aftermath);
      if (JSON.stringify(state) !== original || checkpoint.save.seed !== state.save.seed
        || checkpoint.campaign.completed || checkpoint.engagement || checkpoint.campaign.currentNodeId !== rules.nodeId
        || JSON.stringify(checkpoint.save.events) !== JSON.stringify(state.save.events.slice(0, checkpoint.save.events.length))
        || checkpoint.campaign.history.length !== 2) throw new Error("Failed-chapter replay changed its opening checkpoint.");
      recoveryCheckpoints++;
    }
    if (state.campaign.failureReason) failures[state.campaign.failureReason] = (failures[state.campaign.failureReason] ?? 0) + 1;
    const arrival = councilEntry(state.campaign)?.arrival;
    if (arrival) arrivals[arrival] = (arrivals[arrival] ?? 0) + 1;
    if (!state.campaign.failureReason) {
      const sameStrategicRoute = JSON.stringify([state.campaign.seed, state.campaign.history.map((record) => record.choiceId)]);
      const fates = fateGroups.get(sameStrategicRoute) ?? new Set<string>();
      fates.add(`${deriveEnding(state.campaign)} / ${arrival}`);
      fateGroups.set(sameStrategicRoute, fates);
    }
    return;
  }
  const next = (event: Parameters<typeof advanceCrossingCampaign>[4]) =>
    visit(advanceCrossingCampaign(campaign, definition, rules, state.save, event, aftermath));
  if (state.engagement) {
    conditions.add(state.engagement.conditionId);
    if (state.engagement.completed) {
      const outcome = state.engagement.outcomeId!;
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
      next({ kind: "finish-crossing" });
    } else {
      const commands = availableEngagementCommands(definition, state.engagement);
      if (!commands.length) throw new Error("Tactical branch deadlocked.");
      for (const command of commands) next({ kind: "crossing-command", commandId: command.id });
    }
    return;
  }
  const node = getNode(campaign, state.campaign.currentNodeId);
  const choices = node.choices.filter((choice) => canChoose(choice, state.campaign.resources));
  if (!choices.length) throw new Error("Campaign branch deadlocked.");
  for (const choice of choices) next(node.id === rules.nodeId
    ? { kind: "begin-crossing", planId: choice.id } : { kind: "decision", choiceId: choice.id });
};
const seeds = [0, 1, 2, 3, 4, 0x5eed2026];
for (const seed of seeds) {
  const initial = replayCrossingCampaign(campaign, definition, rules, createCrossingCampaignSave(campaign, rules, seed), aftermath);
  if (!initial) throw new Error("Crossing integration content failed binding.");
  visit(initial);
}
if (conditions.size !== definition.conditions.length || Object.keys(outcomes).length < 2 || !terminalRoutes) {
  throw new Error("Crossing integration audit did not exercise alternate field conditions and consequences.");
}
const changedFateGroups = [...fateGroups].filter(([, fates]) => fates.size > 1);
if (!changedFateGroups.length) throw new Error("Tactical commands never change an ending or council arrival on the same strategic route.");
if (revision === 2 && campaign.commitments.some(commitment => promiseJudgments.get(commitment.id)?.size !== 3)) throw new Error("Some revised promise judgments are unreachable.");
const representativeEvents = [
  { kind: "decision", choiceId: "read-the-names" },
  { kind: "decision", choiceId: "issue-grain-tallies" },
  { kind: "begin-crossing", planId: "families-first" },
  { kind: "crossing-command", commandId: "screen-through-reeds" },
  { kind: "crossing-command", commandId: "repair-the-landing" },
  { kind: "crossing-command", commandId: "hold-for-the-last-household" },
  { kind: "finish-crossing" },
  { kind: "decision", choiceId: "root-in-villages" },
];
const representative = replayCrossingCampaign(campaign, definition, rules, {
  ...createCrossingCampaignSave(campaign, rules, 0), events: representativeEvents,
}, aftermath);
if (!representative?.campaign.completed || representative.campaign.failureReason) throw new Error("Representative crossing-to-Chen route failed.");
console.log(JSON.stringify({
  status: "development-rules-audit-not-client-acceptance", rulesId: rules.id,
  campaignSha256: rules.campaignSha256, engagementSha256: rules.engagementSha256,
  seeds, checkpoints, terminalRoutes, recoveryCheckpoints, conditions: [...conditions].sort(), outcomes, failures, councilArrivals: arrivals,
  promiseJudgments: Object.fromEntries([...promiseJudgments].map(([id, values]) => [id, [...values].sort()])),
  sameStrategicRoutesWithChangedFates: changedFateGroups.length,
  example: { strategicRoute: JSON.parse(changedFateGroups[0]![0]), possibleFates: [...changedFateGroups[0]![1]] },
  representative: { seed: 0, events: representativeEvents, resources: representative.campaign.resources,
    outcome: representative.crossings[0]!.outcomeId, councilArrival: councilEntry(representative.campaign)!.arrival },
  scope: "All legal campaign and tactical routes for six seeds; resume every checkpoint; no client or visual acceptance claimed.",
}, null, 2));
