import { describe, expect, it } from "vitest";
import rawCampaign from "../../../content/campaigns/chapter-01-daze.json";
import rawDefinition from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import rawV1 from "../../../content/engagements/chapter-01-crossing-campaign.rules.v1.json";
import rawV2 from "../../../content/engagements/chapter-01-crossing-campaign.rules.v2.json";
import rawAftermath from "../../../content/engagements/chapter-01-crossing-aftermath.v2.json";
import {
  advanceCrossingCampaign, availableEngagementCommands, canChoose, createCrossingCampaignSave,
  getNode, replayCrossingCampaign, selectFieldCondition,
  type Campaign, type CrossingAftermath, type CrossingCampaignEvent, type CrossingCampaignReplay,
  type CrossingCampaignRules, type EngagementDefinition,
} from "../src";

const campaign = rawCampaign as Campaign;
const definition = rawDefinition as EngagementDefinition;
const v1 = rawV1 as CrossingCampaignRules;
const v2 = rawV2 as CrossingCampaignRules;
const aftermath = rawAftermath as CrossingAftermath;
const advance = (state: CrossingCampaignReplay, event: CrossingCampaignEvent) => advanceCrossingCampaign(campaign, definition, v2, state.save, event, aftermath);
function crossing(opening: string, seed: number) {
  let state = replayCrossingCampaign(campaign, definition, v2, createCrossingCampaignSave(campaign, v2, seed), aftermath)!;
  state = advance(state, { kind: "decision", choiceId: opening });
  const choice = getNode(campaign, state.campaign.currentNodeId).choices.find(choice => canChoose(choice, state.campaign.resources))!;
  return advance(state, { kind: "decision", choiceId: choice.id });
}

describe("outcome-aware crossing promises and personal reactions", () => {
  it("does not award kept protection for a costly crossing simply because households were prioritized", () => {
    let state = advance(crossing("read-the-names", 0), { kind: "begin-crossing", planId: "families-first" });
    for (const commandId of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) state = advance(state, { kind: "crossing-command", commandId });
    const before = state.campaign.resources;
    state = advance(state, { kind: "finish-crossing" });
    const result = state.lastResolution!;
    expect(state.crossings[0]!.outcomeId).toBe("costly-crossing");
    expect(result.commitment!.outcome.status).toBe("strained");
    expect(result.commitmentDeltas).toEqual({ trust: -2, momentum: 1 });
    expect(result.choice.pressure!.reveal).toEqual(aftermath.outcomes["costly-crossing"]!.pressure);
    expect(result.choice.consequence).toEqual(aftermath.outcomes["costly-crossing"]!.reaction);
    expect(result.node.choices.find(choice => choice.id === result.choice.id)).toBe(result.choice);
    expect(state.campaign.history.at(-1)!.before).toEqual(before);
    // The last-household order establishes this limited observation, not a universal census.
    expect(state.campaign.flags).toContain("families-first");
    const old = replayCrossingCampaign(campaign, definition, v1, { ...state.save, rulesId: v1.id });
    expect(old!.lastResolution!.commitment!.outcome.status).toBe("kept");
    expect(old!.campaign.resources.trust - state.campaign.resources.trust).toBe(6);
    expect(replayCrossingCampaign(campaign, definition, v1, state.save)).toBeNull();
  });

  it("covers every tactical branch for all three inherited promises under both field conditions", () => {
    let routes = 0;
    const unavailable: { opening: string; condition: string; plan: string; grain: number }[] = [];
    const observed = new Map<string, Set<string>>();
    const originalBytes = JSON.stringify({ campaign, definition, aftermath });
    const visit = (state: CrossingCampaignReplay) => {
      expect(replayCrossingCampaign(campaign, definition, v2, JSON.parse(JSON.stringify(state.save)), aftermath)).toEqual(state);
      if (!state.engagement!.completed) {
        const commands = availableEngagementCommands(definition, state.engagement!);
        expect(commands.length).toBeGreaterThan(0);
        for (const command of commands) visit(advance(state, { kind: "crossing-command", commandId: command.id }));
        return;
      }
      routes++;
      const issued = state.engagement!;
      const finished = advance(state, { kind: "finish-crossing" });
      const result = finished.lastResolution!;
      const commitment = result.commitment!;
      const statuses = observed.get(commitment.commitment.id) ?? new Set<string>();
      statuses.add(commitment.outcome.status); observed.set(commitment.commitment.id, statuses);
      expect(commitment.outcome.id).toContain("crossing-v2-");
      expect(result.choice.pressure!.reveal).toEqual(aftermath.outcomes[issued.outcomeId!]!.pressure);
      expect(result.choice.consequence).toEqual(finished.campaign.failureReason ? aftermath.terminal[finished.campaign.failureReason] : aftermath.outcomes[issued.outcomeId!]!.reaction);
      if (issued.planId === "families-first" && issued.outcomeId !== "orderly-crossing") expect(commitment.outcome.status).not.toBe("kept");
      if (issued.planId === "repair-the-ford" && issued.outcomeId !== "orderly-crossing") expect(finished.campaign.flags).not.toContain("ford-braced");
      if (issued.planId === "families-first" && issued.outcomeId !== "orderly-crossing" && !issued.history.some(record => record.commandId === "hold-for-the-last-household")) expect(finished.campaign.flags).not.toContain("families-first");
      if (issued.planId === "cut-the-carts") expect(finished.campaign.flags).not.toContain("carts-abandoned");
      expect(replayCrossingCampaign(campaign, definition, v2, finished.save, aftermath)).toEqual(finished);
      if (!finished.campaign.completed) {
        const choice = getNode(campaign, finished.campaign.currentNodeId).choices.find(choice => canChoose(choice, finished.campaign.resources))!;
        expect(advance(finished, { kind: "decision", choiceId: choice.id }).campaign.completed).toBe(true);
      }
    };
    for (const opening of ["read-the-names", "take-the-beacon", "hide-the-register"]) {
      const conditions = new Map<string, CrossingCampaignReplay>();
      for (let seed = 0; seed < 100 && conditions.size < 2; seed++) {
        const state = crossing(opening, seed);
        conditions.set(selectFieldCondition(campaign, getNode(campaign, state.campaign.currentNodeId), seed, state.campaign.history.length).id, state);
      }
      expect(conditions.size).toBe(2);
      for (const before of conditions.values()) for (const plan of definition.plans) {
        if (canChoose(getNode(campaign, before.campaign.currentNodeId).choices.find(choice => choice.id === plan.id)!, before.campaign.resources)) visit(advance(before, { kind: "begin-crossing", planId: plan.id }));
        else unavailable.push({ opening, condition: selectFieldCondition(campaign, getNode(campaign, before.campaign.currentNodeId), before.campaign.seed, before.campaign.history.length).id, plan: plan.id, grain: before.campaign.resources.grain });
      }
    }
    // One inherited route has 29 grain, below the existing 30-grain repair gate.
    // Its eighteen tactical continuations must not be invented by filling resources.
    expect(unavailable).toEqual([{ opening: "hide-the-register", condition: "rope-ferry-returns", plan: "repair-the-ford", grain: 29 }]);
    expect(routes).toBe(210);
    for (const commitment of campaign.commitments) expect([...observed.get(commitment.id)!].sort()).toEqual(["broken", "kept", "strained"]);
    expect(JSON.stringify({ campaign, definition, aftermath })).toBe(originalBytes);
  });

  it("fails closed when the revised authored reaction contract is missing or belongs to another edition", () => {
    const state = crossing("read-the-names", 0);
    expect(replayCrossingCampaign(campaign, definition, v2, state.save)).toBeNull();
    expect(replayCrossingCampaign(campaign, definition, v2, state.save, { ...aftermath, id: "another-edition" })).toBeNull();
    expect(replayCrossingCampaign(campaign, definition, v2, state.save, { ...aftermath, outcomes: {} })).toBeNull();
  });
});
