import { describe, expect, it } from "vitest";
import { canChoose, createInitialState, deriveEnding, localize, resolveChoice } from "../src";
import type { Campaign } from "../src";

const campaign: Campaign = {
  schemaVersion: 1,
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
    expect(result.state.completed).toBe(true);
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
