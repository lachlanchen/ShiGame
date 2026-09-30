import { describe, expect, it } from "vitest";
import raw from "../../../content/councils/chen-council.v1.json";
import campaignRaw from "../../../content/campaigns/chapter-01-daze.json";
import { canChoose, getNode, councilAnswers, councilCanChoose, councilEntry, councilMetricKeys, councilOutcome, councilReadiness, createCouncil, createInitialState, resolveChoice, resolveCouncil, restoreCouncil,
  type Campaign, type CouncilArrival, type CouncilDefinition, type CouncilState } from "../src";

const definition = raw as CouncilDefinition;
const start = (arrival: CouncilArrival = "divided") => createCouncil(definition, { id: "test-chronicle", arrival });
const play = (choices: string[], arrival: CouncilArrival = "divided") => choices.reduce((state, choice) => resolveCouncil(definition, state, choice), start(arrival));

describe("Chen council", () => {
  it("explains every possible bounded outcome without changing the original thresholds", () => {
    for (let grain = 0; grain <= 10; grain++) for (let tempo = 0; tempo <= 10; tempo++)
      for (let city = 0; city <= 10; city++) for (let allies = 0; allies <= 10; allies++)
        for (let veterans = 0; veterans <= 10; veterans++) {
          const metrics = { grain, tempo, city, allies, veterans };
          const count = [city, allies, veterans].filter(n => n >= 6).length;
          const expected = grain === 0 ? "empty-granaries" : count >= 2 && grain >= 2 && tempo >= 3 ? "common-front"
            : city >= 6 && veterans >= 6 ? "city-stronghold" : "fragile-coalition";
          const readiness = councilReadiness(metrics);
          if (councilOutcome(metrics) !== expected || readiness.checks.every(c => c.met) !== (expected === "common-front")
            || readiness.supporters.length !== count) throw new Error(JSON.stringify(metrics));
        }
    const metrics = { grain: 1, tempo: 2, city: 6, allies: 5, veterans: 6 };
    expect(councilReadiness(metrics)).toEqual({ supporters: ["city", "veterans"], checks: [
      { id: "support", value: 2, required: 2, met: true },
      { id: "grain", value: 1, required: 2, met: false },
      { id: "tempo", value: 2, required: 3, met: false },
    ] });
    expect(metrics).toEqual({ grain: 1, tempo: 2, city: 6, allies: 5, veterans: 6 });
  });
  it("exhausts every legal route, has no deadlocks, and replays every result", () => {
    const original = JSON.stringify(definition);
    const outcomes = new Set<string>();
    let endings = 0;
    for (const arrival of ["supplied", "pressed", "divided"] as const) {
      const initial = start(arrival);
      let wins = 0;
      function visit(state: CouncilState) {
        if (state.completed) {
          endings++; outcomes.add(state.outcome!);
          if (state.outcome === "common-front") wins++;
          expect(restoreCouncil(definition, initial.entry, JSON.parse(JSON.stringify(state)))).toEqual(state);
          expect(() => resolveCouncil(definition, state, "hold-chen")).toThrow();
          return;
        }
        const legal = definition.rounds[state.history.length]!.choices.filter(choice => councilCanChoose(state, choice));
        expect(legal.length).toBeGreaterThan(0);
        for (const choice of legal) {
          const snapshot = JSON.stringify(state);
          const next = resolveCouncil(definition, state, choice.id);
          expect(JSON.stringify(state)).toBe(snapshot);
          expect(next.history).toHaveLength(state.history.length + 1);
          expect(councilMetricKeys.every(key => Number.isInteger(next.metrics[key]) && next.metrics[key] >= 0 && next.metrics[key] <= 10)).toBe(true);
          visit(next);
        }
      }
      visit(initial);
      expect(wins).toBeGreaterThan(0);
    }
    expect(endings).toBe(77);
    expect([...outcomes].sort()).toEqual(["city-stronghold", "common-front", "empty-granaries", "fragile-coalition"]);
    expect(JSON.stringify(definition)).toBe(original);
  });

  it("makes reneging a disclosed extra cost, not a hidden random punishment", () => {
    const state = play(["recognize-allies", "buy-convoys"]);
    const command = definition.rounds[2]!.choices[0]!;
    expect(councilAnswers(state, command)).toHaveLength(1);
    const result = resolveCouncil(definition, state, command.id);
    expect(result.metrics.allies).toBe(state.metrics.allies - 5);
    expect(councilAnswers(play(["take-crown", "buy-convoys"]), command)).toHaveLength(0);
  });

  it("supports a viable bargain for every authority policy and no free dominant opening", () => {
    expect(play(["recognize-allies", "army-rations", "many-banners"], "supplied").outcome).toBe("common-front");
    expect(play(["take-crown", "joint-ledger", "one-command"], "divided").outcome).toBe("common-front");
    expect(play(["defer-title", "joint-ledger", "one-command"], "pressed").outcome).toBe("common-front");
    const first = definition.rounds[0]!.choices.map(choice => resolveCouncil(definition, start(), choice.id));
    for (const a of first) for (const b of first) if (a !== b) {
      expect(councilMetricKeys.every(key => a.metrics[key] >= b.metrics[key])).toBe(false);
    }
  });

  it("rejects wrong-round, unaffordable and duplicate commands", () => {
    expect(() => resolveCouncil(definition, start(), "one-command")).toThrow();
    const state = play(["recognize-allies", "army-rations"], "pressed");
    expect(() => resolveCouncil(definition, state, "one-command")).toThrow();
    expect(() => resolveCouncil(definition, play(["take-crown"]), "take-crown")).toThrow();
  });

  it("reconstructs totals and rejects another chronicle or corrupt route", () => {
    const state = play(["take-crown", "joint-ledger"]);
    expect(restoreCouncil(definition, state.entry, { ...state, metrics: { grain: 999 }, completed: true })).toEqual(state);
    for (const value of [null, {}, { ...state, version: 9 }, { ...state, history: [null] }, { ...state, history: [{ choiceId: "one-command" }] }, { ...state, history: Array(4).fill(state.history[0]) }]) {
      expect(restoreCouncil(definition, state.entry, value)).toBeNull();
    }
    expect(restoreCouncil(definition, { ...state.entry, id: "another-run" }, state)).toBeNull();
  });

  it("opens only after a surviving chapter, binds arrival and leaves its save intact", () => {
    const campaign = campaignRaw as Campaign;
    let state = createInitialState(campaign, 0);
    expect(councilEntry(state)).toBeNull();
    while (!state.completed) state = resolveChoice(campaign, state, getNode(campaign, state.currentNodeId).choices.find(choice => canChoose(choice, state.resources))!.id).state;
    expect(state.failureReason).toBeUndefined();
    const completed = { ...state, resources: { ...state.resources, grain: 50 } };
    const snapshot = JSON.stringify(completed);
    const entry = councilEntry(completed);
    expect(entry?.arrival).toBe("supplied");
    createCouncil(definition, entry!);
    expect(JSON.stringify(completed)).toBe(snapshot);
    expect(councilEntry({ ...completed, failureReason: "captured" })).toBeNull();
    expect(councilEntry({ ...completed, resources: { ...completed.resources, grain: 20, danger: 80 } })?.arrival).toBe("pressed");
  });
});
