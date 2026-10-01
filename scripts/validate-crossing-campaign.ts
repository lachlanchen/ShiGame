import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  advanceCrossingCampaign, availableEngagementCommands, canChoose, createCrossingCampaignSave,
  councilEntry, deriveEnding, getNode, replayCrossingCampaign,
  type Campaign, type CrossingCampaignReplay, type CrossingCampaignRules, type EngagementDefinition,
} from "../packages/game-core/src";

const campaignBytes = await readFile(new URL("../content/campaigns/chapter-01-daze.json", import.meta.url));
const engagementBytes = await readFile(new URL("../content/engagements/chapter-01-broken-crossing.v1.json", import.meta.url));
const campaign = JSON.parse(campaignBytes.toString()) as Campaign;
const definition = JSON.parse(engagementBytes.toString()) as EngagementDefinition;
const rules = JSON.parse(await readFile(new URL("../content/engagements/chapter-01-crossing-campaign.rules.v1.json", import.meta.url), "utf8")) as CrossingCampaignRules;
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
if (rules.campaignSha256 !== hash(campaignBytes) || rules.engagementSha256 !== hash(engagementBytes)) {
  throw new Error("Crossing integration inputs changed: review and version the rules/migration before adoption.");
}
if (Object.keys(rules).sort().join(",") !== ["schemaVersion", "id", "deliveryStatus", "campaignId", "engagementId", "nodeId", "effectPolicy", "campaignSha256", "engagementSha256"].sort().join(",")) {
  throw new Error("Unexpected crossing integration contract fields.");
}

let checkpoints = 0;
let terminalRoutes = 0;
const failures: Record<string, number> = {};
const arrivals: Record<string, number> = {};
const outcomes: Record<string, number> = {};
const conditions = new Set<string>();
const fateGroups = new Map<string, Set<string>>();
const visit = (state: CrossingCampaignReplay) => {
  checkpoints++;
  const resumed = replayCrossingCampaign(campaign, definition, rules, JSON.parse(JSON.stringify(state.save)));
  if (!resumed || JSON.stringify(resumed) !== JSON.stringify(state)) throw new Error("Cold replay drifted.");
  if (state.campaign.completed) {
    terminalRoutes++;
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
    visit(advanceCrossingCampaign(campaign, definition, rules, state.save, event));
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
  const initial = replayCrossingCampaign(campaign, definition, rules, createCrossingCampaignSave(campaign, rules, seed));
  if (!initial) throw new Error("Crossing integration content failed binding.");
  visit(initial);
}
if (conditions.size !== definition.conditions.length || Object.keys(outcomes).length < 2 || !terminalRoutes) {
  throw new Error("Crossing integration audit did not exercise alternate field conditions and consequences.");
}
const changedFateGroups = [...fateGroups].filter(([, fates]) => fates.size > 1);
if (!changedFateGroups.length) throw new Error("Tactical commands never change an ending or council arrival on the same strategic route.");
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
});
if (!representative?.campaign.completed || representative.campaign.failureReason) throw new Error("Representative crossing-to-Chen route failed.");
console.log(JSON.stringify({
  status: "development-rules-audit-not-client-acceptance", rulesId: rules.id,
  campaignSha256: rules.campaignSha256, engagementSha256: rules.engagementSha256,
  seeds, checkpoints, terminalRoutes, conditions: [...conditions].sort(), outcomes, failures, councilArrivals: arrivals,
  sameStrategicRoutesWithChangedFates: changedFateGroups.length,
  example: { strategicRoute: JSON.parse(changedFateGroups[0]![0]), possibleFates: [...changedFateGroups[0]![1]] },
  representative: { seed: 0, events: representativeEvents, resources: representative.campaign.resources,
    outcome: representative.crossings[0]!.outcomeId, councilArrival: councilEntry(representative.campaign)!.arrival },
  scope: "All legal campaign and tactical routes for six seeds; resume every checkpoint; no client or visual acceptance claimed.",
}, null, 2));
