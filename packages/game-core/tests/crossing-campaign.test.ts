import { describe, expect, it } from "vitest";
import rawCampaign from "../../../content/campaigns/chapter-01-daze.json";
import rawDefinition from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import rawRules from "../../../content/engagements/chapter-01-crossing-campaign.rules.v1.json";
import {
  advanceCrossingCampaign, availableEngagementCommands, canChoose,
  createCrossingCampaignSave, getNode, replayCrossingCampaign,
  resourceKeys, selectFieldCondition,
  type Campaign, type CrossingCampaignEvent, type CrossingCampaignReplay,
  type CrossingCampaignRules, type CrossingCampaignSave, type EngagementDefinition,
} from "../src";

const campaign = rawCampaign as Campaign;
const definition = rawDefinition as EngagementDefinition;
const rules = rawRules as CrossingCampaignRules;
const replay = (save: unknown) => replayCrossingCampaign(campaign, definition, rules, save);
const advance = (state: CrossingCampaignReplay, event: CrossingCampaignEvent) =>
  advanceCrossingCampaign(campaign, definition, rules, state.save, event);

function atCrossing(seed = 0): CrossingCampaignReplay {
  let state = replay(createCrossingCampaignSave(campaign, rules, seed))!;
  while (state.campaign.currentNodeId !== rules.nodeId) {
    const choice = getNode(campaign, state.campaign.currentNodeId).choices.find((candidate) => canChoose(candidate, state.campaign.resources))!;
    state = advance(state, { kind: "decision", choiceId: choice.id });
  }
  return state;
}

function finishFirst(state: CrossingCampaignReplay): CrossingCampaignReplay {
  while (!state.engagement!.completed) {
    state = advance(state, {
      kind: "crossing-command",
      commandId: availableEngagementCommands(definition, state.engagement!)[0]!.id,
    });
  }
  return advance(state, { kind: "finish-crossing" });
}

describe("development crossing-to-campaign ledger", () => {
  it("derives the disclosed field condition and keeps campaign bytes unchanged through every pulse", () => {
    const before = atCrossing();
    const original = JSON.stringify(before);
    let state = advance(before, { kind: "begin-crossing", planId: "families-first" });
    const node = getNode(campaign, state.campaign.currentNodeId);
    expect(state.engagement!.conditionId).toBe(selectFieldCondition(campaign, node, state.campaign.seed, state.campaign.history.length).id);
    const campaignBytes = JSON.stringify(state.campaign);
    while (!state.engagement!.completed) {
      state = advance(state, { kind: "crossing-command", commandId: availableEngagementCommands(definition, state.engagement!)[0]!.id });
      expect(JSON.stringify(state.campaign)).toBe(campaignBytes);
      expect(replay(JSON.parse(JSON.stringify(state.save)))).toEqual(state);
    }
    expect(JSON.stringify(before)).toBe(original);
    const committed = advance(state, { kind: "finish-crossing" });
    expect(committed.campaign.history).toHaveLength(before.campaign.history.length + 1);
    expect(committed.campaign.currentNodeId).toBe("three-roads");
    expect(committed.engagement).toBeUndefined();
    expect(committed.crossings[0]).toEqual(state.engagement);
    for (const key of resourceKeys) {
      const expected = Math.max(0, Math.min(100, before.campaign.resources[key] + (state.engagement!.campaignEffects![key] ?? 0)));
      expect(committed.campaign.history.at(-1)!.afterChoice[key]).toBe(expected);
    }
    expect(() => advance(committed, { kind: "finish-crossing" })).toThrow(/invalid/);
  });

  it("allows plan reselection before an order, but cannot undo an issued command or bypass the battle", () => {
    const before = atCrossing();
    expect(() => advance(before, { kind: "decision", choiceId: "families-first" })).toThrow(/invalid/);
    const selected = advance(before, { kind: "begin-crossing", planId: "families-first" });
    expect(() => advance(selected, { kind: "finish-crossing" })).toThrow(/invalid/);
    const cancelled = advance(selected, { kind: "cancel-crossing" });
    expect(cancelled.campaign).toEqual(before.campaign);
    const changed = advance(cancelled, { kind: "begin-crossing", planId: "cut-the-carts" });
    const issued = advance(changed, { kind: "crossing-command", commandId: availableEngagementCommands(definition, changed.engagement!)[0]!.id });
    expect(() => advance(issued, { kind: "cancel-crossing" })).toThrow(/invalid/);
    expect(() => advance(issued, { kind: "begin-crossing", planId: "families-first" })).toThrow(/invalid/);
    expect(() => advance(issued, { kind: "decision", choiceId: "cut-the-carts" })).toThrow(/invalid/);
  });

  it("carries tactical costs into the next decision and cold-replays the earned chapter ending", () => {
    const completed = finishFirst(advance(atCrossing(), { kind: "begin-crossing", planId: "families-first" }));
    const nextChoice = getNode(campaign, completed.campaign.currentNodeId).choices.find((choice) => canChoose(choice, completed.campaign.resources))!;
    const ending = advance(completed, { kind: "decision", choiceId: nextChoice.id });
    expect(ending.campaign.history.at(-1)!.before).toEqual(completed.campaign.resources);
    expect(ending.campaign.completed).toBe(true);
    expect(replay(JSON.parse(JSON.stringify(ending.save)))).toEqual(ending);
    expect(() => advance(ending, { kind: "decision", choiceId: nextChoice.id })).toThrow(/invalid/);
  });

  it("replays every legal tactical branch under both seeded campaign conditions without double charging", () => {
    const seeds = new Map<string, number>();
    for (let seed = 0; seed < 100 && seeds.size < definition.conditions.length; seed++) {
      const before = atCrossing(seed);
      const field = selectFieldCondition(campaign, getNode(campaign, rules.nodeId), seed, before.campaign.history.length);
      seeds.set(field.id, seed);
    }
    expect(seeds.size).toBe(2);
    let routes = 0;
    const outcomes = new Set<string>();
    const finalResources = new Set<string>();
    const visit = (state: CrossingCampaignReplay) => {
      expect(replay(JSON.parse(JSON.stringify(state.save)))).toEqual(state);
      if (!state.engagement!.completed) {
        const commands = availableEngagementCommands(definition, state.engagement!);
        expect(commands.length).toBeGreaterThan(0);
        for (const command of commands) visit(advance(state, { kind: "crossing-command", commandId: command.id }));
        return;
      }
      routes++;
      const committed = advance(state, { kind: "finish-crossing" });
      expect(replay(committed.save)).toEqual(committed);
      expect(committed.lastResolution!.choice.effects).toEqual(state.engagement!.campaignEffects);
      expect(committed.campaign.history.at(-1)!.choiceId).toBe(state.engagement!.planId);
      outcomes.add(state.engagement!.outcomeId!);
      finalResources.add(JSON.stringify(committed.campaign.resources));
    };
    const bytes = JSON.stringify({ campaign, definition, rules });
    for (const seed of seeds.values()) for (const plan of definition.plans) {
      visit(advance(atCrossing(seed), { kind: "begin-crossing", planId: plan.id }));
    }
    expect(routes).toBe(76);
    expect(outcomes.size).toBeGreaterThan(1);
    expect(finalResources.size).toBeGreaterThan(definition.plans.length);
    expect(JSON.stringify({ campaign, definition, rules })).toBe(bytes);
  });

  it("fails closed on malformed, transplanted, forged and out-of-sequence ledgers", () => {
    const save = atCrossing().save;
    const corrupt: unknown[] = [
      null, [], { ...save, resources: campaign.initialResources },
      { ...save, seed: -1 }, { ...save, seed: 1.5 }, { ...save, seed: 0x100000000 },
      { ...save, rulesId: "another-ruleset" }, { ...save, campaignId: "another-campaign" },
      { ...save, campaignSha256: "0".repeat(64) }, { ...save, engagementSha256: "0".repeat(64) },
      { ...save, events: [...save.events, { kind: "begin-crossing", planId: "unknown" }] },
      { ...save, events: [...save.events, { kind: "crossing-command", commandId: "screen-through-reeds" }] },
      { ...save, events: [...save.events, { kind: "finish-crossing" }] },
      { ...save, events: [...save.events, { kind: "begin-crossing", planId: "families-first", conditionId: "ford-rises" }] },
      { ...save, events: [{ kind: "begin-crossing", planId: "families-first" }] },
    ];
    for (const candidate of corrupt) expect(replay(candidate)).toBeNull();
    expect(replayCrossingCampaign(campaign, definition, { ...rules, nodeId: "three-roads" }, save)).toBeNull();
    expect(replayCrossingCampaign(campaign, { ...definition, conditions: definition.conditions.slice(1) }, rules, save)).toBeNull();
    const started = advance(atCrossing(), { kind: "begin-crossing", planId: "families-first" });
    const forbidden: CrossingCampaignSave = { ...started.save, events: [...started.save.events, { kind: "crossing-command", commandId: "open-three-files" }] };
    expect(replay(forbidden)).toBeNull();
  });
});
