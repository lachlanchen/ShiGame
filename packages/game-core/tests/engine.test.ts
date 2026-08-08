import { describe, expect, it } from "vitest";
import { canChoose, createInitialState, deriveEnding, formatSeed, hashSeedKey, localize, migrateGameState, resolveChoice, selectFieldCondition } from "../src";
import type { Campaign } from "../src";

const campaign: Campaign = {
  schemaVersion: 2,
  id: "test",
  title: { en: "Test", "zh-Hans": "测试" },
  subtitle: { en: "Test", "zh-Hans": "测试" },
  startNodeId: "start",
  initialResources: { grain: 50, trust: 50, momentum: 50, people: 50, danger: 50 },
  sites: [],
  characters: [],
  sources: [],
  nodes: [{
    id: "start",
    dateLabel: { en: "Now", "zh-Hans": "现在" },
    siteId: "site",
    speakerId: "speaker",
    title: { en: "Start", "zh-Hans": "开始" },
    context: { en: "Context", "zh-Hans": "背景" },
    dialogue: { en: "Words", "zh-Hans": "话" },
    sourceRefs: [],
    conditions: [
      { id: "still", claimStatus: "dramatic-reconstruction", title: { en: "Still", "zh-Hans": "静" }, signal: { en: "Still.", "zh-Hans": "静。" }, weight: 1, effects: { momentum: 0 } },
      { id: "wind", claimStatus: "dramatic-reconstruction", title: { en: "Wind", "zh-Hans": "风" }, signal: { en: "Wind.", "zh-Hans": "风。" }, weight: 1, effects: { momentum: 0 } },
    ],
    choices: [{
      id: "choose",
      label: { en: "Choose", "zh-Hans": "选择" },
      intent: { en: "Intent", "zh-Hans": "意图" },
      consequence: { en: "Consequence", "zh-Hans": "结果" },
      strategy: { en: "Thickness", "zh-Hans": "厚势" },
      effects: { grain: 80, danger: -80 },
    }],
  }],
};

describe("campaign engine", () => {
  it("clamps resources and records a deterministic choice", () => {
    const result = resolveChoice(campaign, createInitialState(campaign), "choose");
    expect(result.state.resources.grain).toBe(100);
    expect(result.state.resources.danger).toBe(0);
    expect(result.state.history).toHaveLength(1);
    expect(result.state.history.at(0)!.afterChoice.grain).toBe(100);
    expect(result.state.saveVersion).toBe(3);
    expect(result.state.completed).toBe(true);
  });

  it("applies a visible pressure response after the player action", () => {
    const pressured = structuredClone(campaign);
    pressured.nodes.at(0)!.choices.at(0)!.pressure = {
      kind: "state",
      warning: { en: "The post will answer.", "zh-Hans": "驿站会回应。" },
      reveal: { en: "A patrol closes the road.", "zh-Hans": "巡卒封住道路。" },
      effects: { danger: 25, grain: -10 },
    };

    const result = resolveChoice(pressured, createInitialState(pressured), "choose");

    expect(result.state.history.at(0)!.afterChoice).toEqual({ grain: 100, trust: 50, momentum: 50, people: 50, danger: 0 });
    expect(result.state.resources).toEqual({ grain: 90, trust: 50, momentum: 50, people: 50, danger: 25 });
    expect(result.playerDeltas).toEqual({ grain: 50, danger: -50 });
    expect(result.pressureDeltas).toEqual({ grain: -10, danger: 25 });
  });

  it("does not reveal the next scene when pressure ends the run", () => {
    const pressured = structuredClone(campaign);
    pressured.nodes.at(0)!.choices.at(0)!.nextNodeId = "unearned";
    pressured.nodes.at(0)!.choices.at(0)!.pressure = {
      kind: "state",
      warning: { en: "The cordon is closing.", "zh-Hans": "合围将至。" },
      reveal: { en: "The cordon closes.", "zh-Hans": "追捕合围。" },
      effects: { danger: 100 },
    };
    pressured.nodes.push({
      ...structuredClone(pressured.nodes.at(0)!),
      id: "unearned",
      choices: [],
    });

    const result = resolveChoice(pressured, createInitialState(pressured), "choose");

    expect(result.state.completed).toBe(true);
    expect(result.state.failureReason).toBe("captured");
    expect(result.state.currentNodeId).toBe("start");
  });

  it("migrates version-one saves by replaying authoritative choice history", () => {
    const legacy = {
      campaignId: "test",
      currentNodeId: "tampered",
      resources: { grain: 0, trust: 0, momentum: 0, people: 0, danger: 100 },
      flags: ["invented"],
      history: [{ nodeId: "start", choiceId: "choose", before: {}, after: {} }],
      completed: false,
    };

    const migrated = migrateGameState(campaign, legacy);

    expect(migrated?.saveVersion).toBe(3);
    expect(migrated?.seed).toBe(0);
    expect(migrated?.resources.grain).toBe(100);
    expect(migrated?.flags).toEqual([]);
    expect(migrated?.completed).toBe(true);
  });

  it("rejects impossible save histories", () => {
    expect(migrateGameState(campaign, {
      campaignId: "test",
      history: [{ nodeId: "wrong-node", choiceId: "choose" }],
    })).toBeNull();
    expect(migrateGameState(campaign, {
      saveVersion: 99,
      campaignId: "test",
      history: [],
    })).toBeNull();
  });

  it("selects authored conditions from stable unsigned seed vectors", () => {
    const node = campaign.nodes[0]!;
    expect(hashSeedKey("chapter|0|node|0")).toBe(918888254);
    expect(formatSeed(0x1a2b3c)).toBe("001A2B3C");
    expect(selectFieldCondition(campaign, node, 0, 0).id).toBe("wind");
    expect(selectFieldCondition(campaign, node, 7, 0).id).toBe("still");
  });

  it("applies the disclosed field condition after the pressure stage", () => {
    const variable = structuredClone(campaign);
    variable.nodes[0]!.conditions = [{
      id: "mud",
      claimStatus: "dramatic-reconstruction",
      title: { en: "Mud", "zh-Hans": "泥" },
      signal: { en: "The road sinks.", "zh-Hans": "道路下沉。" },
      weight: 1,
      effects: { grain: -4, danger: 3 },
    }];
    variable.nodes[0]!.choices[0]!.pressure = {
      kind: "terrain",
      warning: { en: "Pressure", "zh-Hans": "压力" },
      reveal: { en: "Answer", "zh-Hans": "应手" },
      effects: { grain: -10, danger: 25 },
    };

    const result = resolveChoice(variable, createInitialState(variable, 9), "choose");

    expect(result.state.history[0]!.afterPressure).toEqual({ grain: 90, trust: 50, momentum: 50, people: 50, danger: 25 });
    expect(result.state.resources).toEqual({ grain: 86, trust: 50, momentum: 50, people: 50, danger: 28 });
    expect(result.fieldDeltas).toEqual({ grain: -4, danger: 3 });
    expect(result.state.history[0]!.conditionId).toBe("mud");
  });

  it("rejects a format-three history whose condition does not match its seed", () => {
    const result = resolveChoice(campaign, createInitialState(campaign, 7), "choose");
    const tampered = structuredClone(result.state);
    tampered.history[0]!.conditionId = "wind";
    expect(migrateGameState(campaign, tampered)).toBeNull();
  });

  it("falls back to English for an untranslated locale", () => {
    expect(localize({ en: "Grain", "zh-Hans": "粮" }, "fr")).toBe("Grain");
  });

  it("derives endings from strategic state", () => {
    const state = createInitialState(campaign);
    state.resources = { grain: 20, trust: 40, momentum: 80, people: 40, danger: 70 };
    expect(deriveEnding(state)).toBe("wildfire");
  });

  it("enforces resource requirements", () => {
    expect(canChoose({
      id: "costly",
      label: { en: "Costly", "zh-Hans": "昂贵" },
      intent: { en: "Intent", "zh-Hans": "意图" },
      consequence: { en: "Consequence", "zh-Hans": "结果" },
      strategy: { en: "Strategy", "zh-Hans": "策略" },
      effects: {},
      requirements: { min: { trust: 70 } },
    }, campaign.initialResources)).toBe(false);
  });
});
