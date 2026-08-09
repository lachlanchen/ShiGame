import { describe, expect, it } from "vitest";
import { canChoose, createInitialState, deriveEnding, formatSeed, hashSeedKey, localize, methodReadMatches, migrateGameState, resolveChoice, selectFieldCondition, selectMethodRead, selectOppositionStage } from "../src";
import type { Campaign } from "../src";

const campaign: Campaign = {
  schemaVersion: 5,
  id: "test",
  title: { en: "Test", "zh-Hans": "测试" },
  subtitle: { en: "Test", "zh-Hans": "测试" },
  startNodeId: "start",
  initialResources: { grain: 50, trust: 50, momentum: 50, people: 50, danger: 50 },
  opposition: {
    id: "test-pursuit",
    claimStatus: "dramatic-reconstruction",
    title: { en: "Pursuit", "zh-Hans": "追捕" },
    description: { en: "Test opposition.", "zh-Hans": "测试追捕。" },
    methods: [
      { id: "witnessed", title: { en: "Witnessed", "zh-Hans": "见证" }, reading: { en: "Witnessed method.", "zh-Hans": "见证手法。" } },
      { id: "forced", title: { en: "Forced", "zh-Hans": "先手" }, reading: { en: "Forced method.", "zh-Hans": "先手手法。" } },
      { id: "distributed", title: { en: "Distributed", "zh-Hans": "分散" }, reading: { en: "Distributed method.", "zh-Hans": "分散手法。" } },
    ],
    methodRead: {
      claimStatus: "dramatic-reconstruction",
      minimumObservations: 2,
      title: { en: "Method read", "zh-Hans": "识势" },
      description: { en: "Test method read.", "zh-Hans": "测试识势。" },
      neutral: {
        id: "unresolved",
        title: { en: "Unresolved", "zh-Hans": "未定" },
        forecast: { en: "No read.", "zh-Hans": "尚无判断。" },
        response: { en: "No response.", "zh-Hans": "没有应手。" },
        counterplay: { en: "Keep a tie.", "zh-Hans": "维持持平。" },
      },
      countermeasures: [
        { id: "witness-read", targetMethodId: "witnessed", title: { en: "Witness read", "zh-Hans": "见证判断" }, forecast: { en: "Witness forecast.", "zh-Hans": "见证预判。" }, hitResponse: { en: "Witness hit.", "zh-Hans": "见证命中。" }, missResponse: { en: "Witness miss.", "zh-Hans": "见证落空。" }, counterplay: { en: "Change method.", "zh-Hans": "改变手法。" }, effects: { danger: 3 } },
        { id: "forced-read", targetMethodId: "forced", title: { en: "Forced read", "zh-Hans": "先手判断" }, forecast: { en: "Forced forecast.", "zh-Hans": "先手预判。" }, hitResponse: { en: "Forced hit.", "zh-Hans": "先手命中。" }, missResponse: { en: "Forced miss.", "zh-Hans": "先手落空。" }, counterplay: { en: "Change method.", "zh-Hans": "改变手法。" }, effects: { momentum: -3 } },
        { id: "distributed-read", targetMethodId: "distributed", title: { en: "Distributed read", "zh-Hans": "分散判断" }, forecast: { en: "Distributed forecast.", "zh-Hans": "分散预判。" }, hitResponse: { en: "Distributed hit.", "zh-Hans": "分散命中。" }, missResponse: { en: "Distributed miss.", "zh-Hans": "分散落空。" }, counterplay: { en: "Change method.", "zh-Hans": "改变手法。" }, effects: { grain: -2 } },
      ],
    },
    stages: [{
      id: "watch",
      minDanger: 0,
      maxDanger: 99,
      title: { en: "Watch", "zh-Hans": "监视" },
      forecast: { en: "No modifier.", "zh-Hans": "没有修正。" },
      response: { en: "The watch waits.", "zh-Hans": "监视仍在等待。" },
      counterplay: { en: "Stay unseen.", "zh-Hans": "保持隐蔽。" },
      effects: {},
    }],
  },
  sites: [],
  characters: [],
  sources: [],
  claims: [],
  nodes: [{
    id: "start",
    dateLabel: { en: "Now", "zh-Hans": "现在" },
    siteId: "site",
    speakerId: "speaker",
    title: { en: "Start", "zh-Hans": "开始" },
    context: { en: "Context", "zh-Hans": "背景" },
    dialogue: { en: "Words", "zh-Hans": "话" },
    sourceRefs: [],
    claimRefs: [],
    conditions: [
      { id: "still", claimStatus: "dramatic-reconstruction", title: { en: "Still", "zh-Hans": "静" }, signal: { en: "Still.", "zh-Hans": "静。" }, weight: 1, effects: { momentum: 0 } },
      { id: "wind", claimStatus: "dramatic-reconstruction", title: { en: "Wind", "zh-Hans": "风" }, signal: { en: "Wind.", "zh-Hans": "风。" }, weight: 1, effects: { momentum: 0 } },
    ],
    choices: [{
      id: "choose",
      methodId: "witnessed",
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
    expect(result.state.saveVersion).toBe(5);
    expect(result.state.legacyDecisionCount).toBe(0);
    expect(result.state.preMethodReadDecisionCount).toBe(0);
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

  it("applies the disclosed opposition posture after authored pressure", () => {
    const opposed = structuredClone(campaign);
    opposed.nodes[0]!.choices[0]!.effects = { grain: 10 };
    opposed.nodes[0]!.choices[0]!.pressure = {
      kind: "state",
      warning: { en: "The road answers.", "zh-Hans": "道路会回应。" },
      reveal: { en: "A patrol moves.", "zh-Hans": "巡卒开始移动。" },
      effects: { danger: 5 },
    };
    opposed.opposition.stages[0]!.effects = { danger: 3, grain: -1 };

    const result = resolveChoice(opposed, createInitialState(opposed), "choose");

    expect(selectOppositionStage(opposed, createInitialState(opposed).resources).id).toBe("watch");
    expect(result.oppositionStage?.id).toBe("watch");
    expect(result.state.history[0]!.afterPressure).toEqual({ grain: 60, trust: 50, momentum: 50, people: 50, danger: 55 });
    expect(result.state.history[0]!.afterOpposition).toEqual({ grain: 59, trust: 50, momentum: 50, people: 50, danger: 58 });
    expect(result.oppositionDeltas).toEqual({ grain: -1, danger: 3 });
    expect(result.state.resources).toEqual({ grain: 59, trust: 50, momentum: 50, people: 50, danger: 58 });
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

    expect(migrated?.saveVersion).toBe(5);
    expect(migrated?.legacyDecisionCount).toBe(1);
    expect(migrated?.preMethodReadDecisionCount).toBe(1);
    expect(migrated?.seed).toBe(0);
    expect(migrated?.resources.grain).toBe(100);
    expect(migrated?.flags).toEqual([]);
    expect(migrated?.completed).toBe(true);
  });

  it("preserves legacy version-three decisions and activates opposition only afterward", () => {
    const opposed = structuredClone(campaign);
    opposed.nodes[0]!.choices[0]!.effects = { danger: 5 };
    opposed.nodes[0]!.choices[0]!.nextNodeId = "second";
    opposed.nodes[0]!.choices[0]!.pressure = {
      kind: "state",
      warning: { en: "Warning", "zh-Hans": "警告" },
      reveal: { en: "Response", "zh-Hans": "回应" },
      effects: { danger: 1 },
    };
    opposed.nodes.push({ ...structuredClone(opposed.nodes[0]!), id: "second", choices: [structuredClone(opposed.nodes[0]!.choices[0]!)] });
    opposed.nodes[1]!.choices[0]!.id = "finish";
    delete opposed.nodes[1]!.choices[0]!.nextNodeId;
    delete opposed.nodes[1]!.choices[0]!.pressure;
    opposed.opposition.stages[0]!.effects = { danger: 4 };
    const legacy = {
      saveVersion: 3,
      campaignId: opposed.id,
      seed: 7,
      history: [{ nodeId: "start", choiceId: "choose", conditionId: selectFieldCondition(opposed, opposed.nodes[0]!, 7, 0).id }],
    };

    const migrated = migrateGameState(opposed, legacy);

    expect(migrated?.legacyDecisionCount).toBe(1);
    expect(migrated?.resources.danger).toBe(56);
    expect(migrated?.history[0]!.oppositionStageId).toBeUndefined();
    const next = resolveChoice(opposed, migrated!, "finish");
    expect(next.oppositionDeltas).toEqual({ danger: 4 });
    expect(next.state.history[1]!.oppositionStageId).toBe("watch");
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

  it("prepares only a unique repeated method and leaves ties unresolved", () => {
    const adaptive = structuredClone(campaign);
    adaptive.nodes[0]!.choices[0]!.nextNodeId = "second";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "second", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[1]!.choices[0]!.id = "second-witness";
    adaptive.nodes[1]!.choices[0]!.nextNodeId = "third";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "third", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[2]!.choices[0]!.id = "finish";
    delete adaptive.nodes[2]!.choices[0]!.nextNodeId;

    const initial = createInitialState(adaptive);
    expect(selectMethodRead(adaptive, initial).read.id).toBe("unresolved");
    const afterOne = resolveChoice(adaptive, initial, "choose").state;
    expect(selectMethodRead(adaptive, afterOne).read.id).toBe("unresolved");
    const afterTwo = resolveChoice(adaptive, afterOne, "second-witness").state;
    const repeated = selectMethodRead(adaptive, afterTwo);
    expect(repeated.read.id).toBe("witness-read");
    expect(repeated.counts).toEqual({ witnessed: 2, forced: 0, distributed: 0 });
    expect(methodReadMatches(repeated, adaptive.nodes[2]!.choices[0]!)).toBe(true);

    const tied = structuredClone(afterTwo);
    tied.history[1]!.choiceId = "second-forced";
    adaptive.nodes[1]!.choices.push({ ...structuredClone(adaptive.nodes[1]!.choices[0]!), id: "second-forced", methodId: "forced" });
    expect(selectMethodRead(adaptive, tied).read.id).toBe("unresolved");
  });

  it("applies a matching method read after pursuit and records a changed-method miss", () => {
    const adaptive = structuredClone(campaign);
    adaptive.opposition.stages[0]!.effects = { grain: -1 };
    adaptive.nodes[0]!.choices[0]!.effects = { grain: 5 };
    adaptive.nodes[0]!.choices[0]!.nextNodeId = "second";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "second", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[1]!.choices[0]!.id = "second-witness";
    adaptive.nodes[1]!.choices[0]!.nextNodeId = "third";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "third", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!), structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[2]!.choices[0]!.id = "repeat";
    delete adaptive.nodes[2]!.choices[0]!.nextNodeId;
    adaptive.nodes[2]!.choices[1]!.id = "switch";
    adaptive.nodes[2]!.choices[1]!.methodId = "forced";
    delete adaptive.nodes[2]!.choices[1]!.nextNodeId;

    const afterOne = resolveChoice(adaptive, createInitialState(adaptive), "choose").state;
    const afterTwo = resolveChoice(adaptive, afterOne, "second-witness").state;
    const hit = resolveChoice(adaptive, afterTwo, "repeat");
    expect(hit.methodRead?.read.id).toBe("witness-read");
    expect(hit.methodReadMatched).toBe(true);
    expect(hit.methodReadDeltas).toEqual({ danger: 3 });
    expect(hit.state.history[2]!.afterOpposition.grain).toBe(62);
    expect(hit.state.history[2]!.afterMethodRead.danger).toBe(53);
    expect(hit.state.history[2]!.methodId).toBe("witnessed");
    expect(hit.state.history[2]!.methodReadId).toBe("witness-read");
    expect(hit.state.history[2]!.methodReadMatched).toBe(true);

    const miss = resolveChoice(adaptive, afterTwo, "switch");
    expect(miss.methodRead?.read.id).toBe("witness-read");
    expect(miss.methodReadMatched).toBe(false);
    expect(miss.methodReadDeltas).toEqual({});
    expect(miss.state.history[2]!.methodReadMatched).toBe(false);
    expect(miss.state.history[2]!.afterMethodRead).toEqual(miss.state.history[2]!.afterOpposition);
  });

  it("preserves version-four pursuit outcomes and activates the visible method read only afterward", () => {
    const adaptive = structuredClone(campaign);
    adaptive.opposition.stages[0]!.effects = { danger: 2 };
    adaptive.nodes[0]!.choices[0]!.effects = { danger: 1 };
    adaptive.nodes[0]!.choices[0]!.nextNodeId = "second";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "second", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[1]!.choices[0]!.id = "second-witness";
    adaptive.nodes[1]!.choices[0]!.nextNodeId = "third";
    adaptive.nodes.push({ ...structuredClone(adaptive.nodes[0]!), id: "third", choices: [structuredClone(adaptive.nodes[0]!.choices[0]!)] });
    adaptive.nodes[2]!.choices[0]!.id = "finish";
    delete adaptive.nodes[2]!.choices[0]!.nextNodeId;
    const legacy = {
      saveVersion: 4,
      legacyDecisionCount: 0,
      campaignId: adaptive.id,
      seed: 0,
      history: [
        { nodeId: "start", choiceId: "choose", conditionId: selectFieldCondition(adaptive, adaptive.nodes[0]!, 0, 0).id, oppositionStageId: "watch" },
        { nodeId: "second", choiceId: "second-witness", conditionId: selectFieldCondition(adaptive, adaptive.nodes[1]!, 0, 1).id, oppositionStageId: "watch" },
      ],
    };

    const migrated = migrateGameState(adaptive, legacy);
    expect(migrated?.saveVersion).toBe(5);
    expect(migrated?.legacyDecisionCount).toBe(0);
    expect(migrated?.preMethodReadDecisionCount).toBe(2);
    expect(migrated?.history[0]!.methodReadId).toBeUndefined();
    expect(migrated?.history[1]!.methodReadId).toBeUndefined();
    const next = resolveChoice(adaptive, migrated!, "finish");
    expect(next.methodRead?.read.id).toBe("witness-read");
    expect(next.methodReadDeltas).toEqual({ danger: 3 });
  });

  it("rejects current histories with tampered method-read identity", () => {
    const resolved = resolveChoice(campaign, createInitialState(campaign), "choose");
    const tampered = structuredClone(resolved.state);
    tampered.history[0]!.methodReadId = "forced-read";
    expect(migrateGameState(campaign, tampered)).toBeNull();
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
      methodId: "witnessed",
      label: { en: "Costly", "zh-Hans": "昂贵" },
      intent: { en: "Intent", "zh-Hans": "意图" },
      consequence: { en: "Consequence", "zh-Hans": "结果" },
      strategy: { en: "Strategy", "zh-Hans": "策略" },
      effects: {},
      requirements: { min: { trust: 70 } },
    }, campaign.initialResources)).toBe(false);
  });
});
