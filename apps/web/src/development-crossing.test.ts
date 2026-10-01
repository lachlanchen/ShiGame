// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { availableEngagementCommands, getNode, type Campaign, type EngagementDefinition } from "@shi/game-core";
import campaignJson from "../../../content/campaigns/chapter-01-daze.json";
import engagementJson from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import { createDevelopmentCrossingDriver, DEVELOPMENT_CROSSING_KEY, DEVELOPMENT_CROSSING_V2_KEY, INTERNAL_CROSSING_V2_KEY } from "./development-crossing";

const campaign = campaignJson as Campaign;
const definition = engagementJson as EngagementDefinition;
const legacyKey = "shi.chapter-01.save.v6";
beforeEach(() => { localStorage.clear(); localStorage.setItem(legacyKey, "owner's original save"); });

function crossing(driver: ReturnType<typeof createDevelopmentCrossingDriver>) {
  let state = driver.initialize(0);
  while (state.currentNodeId !== "broken-crossing") {
    state = driver.commit({ kind: "decision", choiceId: getNode(campaign, state.currentNodeId).choices[0]!.id }).campaign;
    driver.acknowledge();
  }
  return driver.commit({ kind: "begin-crossing", planId: "families-first" });
}

describe("development crossing durable browser adapter", () => {
  function defeated() {
    const driver = createDevelopmentCrossingDriver(localStorage, 2, "internal");
    driver.initialize(1);
    for (const choiceId of ["read-the-names", "issue-grain-tallies"]) { driver.commit({ kind: "decision", choiceId }); driver.acknowledge(); }
    const checkpoint = driver.restore()!.state;
    driver.commit({ kind: "begin-crossing", planId: "families-first" });
    for (const commandId of ["brace-the-approach", "reinforce-the-rear", "staggered-withdrawal"]) driver.commit({ kind: "crossing-command", commandId });
    driver.commit({ kind: "finish-crossing" }); driver.acknowledge();
    expect(driver.commit({ kind: "decision", choiceId: "root-in-villages" }).campaign.failureReason).toBe("captured");
    return { driver, checkpoint };
  }

  it("replays only a read terminal loss and preserves the exact opening and seed", () => {
    const { driver, checkpoint } = defeated();
    expect(driver.canReconsider()).toBe(false);
    expect(() => driver.reconsider()).toThrow(/Read/);
    driver.acknowledge();
    expect(driver.canReconsider()).toBe(true);
    expect(driver.reconsider()).toEqual(checkpoint);
    expect(driver.getEngagement()).toBeNull();
    expect(driver.getCrossingRecord()).toBeUndefined();
    expect(createDevelopmentCrossingDriver(localStorage, 2, "internal").restore()).toEqual({ state: checkpoint, resolution: null });
    expect(() => driver.reconsider()).toThrow(/terminal/);
    driver.commit({ kind: "begin-crossing", planId: "families-first" });
    expect(() => driver.reconsider()).toThrow(/terminal/);
    for (const commandId of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) driver.commit({ kind: "crossing-command", commandId });
    const changed = driver.commit({ kind: "finish-crossing" });
    expect(changed.campaign.failureReason).toBeUndefined();
    expect(changed.crossings[0]!.outcomeId).toBe("costly-crossing");
    driver.acknowledge();
    expect(driver.commit({ kind: "decision", choiceId: "root-in-villages" }).campaign.failureReason).toBeUndefined();
    driver.acknowledge();
    expect(driver.canReconsider()).toBe(false);
    expect(() => driver.reconsider()).toThrow(/terminal/);
    expect(localStorage.getItem(legacyKey)).toBe("owner's original save");
  });

  it("keeps the defeat and live state intact if replay checkpoint storage fails", () => {
    const { driver } = defeated(); driver.acknowledge();
    const before = localStorage.getItem(INTERNAL_CROSSING_V2_KEY);
    const snapshot = driver.restore();
    const writer = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    expect(() => driver.reconsider()).toThrow("full");
    writer.mockRestore();
    expect(driver.restore()).toEqual(snapshot);
    expect(localStorage.getItem(INTERNAL_CROSSING_V2_KEY)).toBe(before);
  });

  it("keeps an internal revision-2 route isolated from released and development campaigns", () => {
    const keys = [legacyKey, DEVELOPMENT_CROSSING_KEY, DEVELOPMENT_CROSSING_V2_KEY, "shi.chen-council.v1", "shi.fanyang-guarantee.v1"];
    for (const key of keys) localStorage.setItem(key, `preserve ${key}`);
    let driver = createDevelopmentCrossingDriver(localStorage, 2, "internal");
    crossing(driver);
    for (const commandId of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) driver.commit({ kind: "crossing-command", commandId });
    const result = driver.commit({ kind: "finish-crossing" });
    driver = createDevelopmentCrossingDriver(localStorage, 2, "internal");
    expect(driver.restore()!.resolution).toEqual(result.lastResolution);
    expect(driver.getCrossingCommitment()!.outcome.status).toBe("strained");
    expect(driver.interludeNamespace).toBe(INTERNAL_CROSSING_V2_KEY);
    expect(driver.labels("en").status).toContain("not a store release");
    expect(driver.labels("zh-Hans").status).toContain("非商店发行版");
    driver.acknowledge();
    driver.commit({ kind: "decision", choiceId: "root-in-villages" });
    for (const key of keys) expect(localStorage.getItem(key)).toBe(`preserve ${key}`);
    expect(() => createDevelopmentCrossingDriver(localStorage, 1, "internal")).toThrow(/revision 2/);
  });

  it("preserves a malformed internal save rather than adopting a development campaign", () => {
    localStorage.setItem(INTERNAL_CROSSING_V2_KEY, "malformed owner data");
    localStorage.setItem(DEVELOPMENT_CROSSING_V2_KEY, "separate development progress");
    expect(() => createDevelopmentCrossingDriver(localStorage, 2, "internal")).toThrow();
    expect(localStorage.getItem(INTERNAL_CROSSING_V2_KEY)).toBe("malformed owner data");
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_V2_KEY)).toBe("separate development progress");
    expect(localStorage.getItem(legacyKey)).toBe("owner's original save");
  });

  it("keeps the revised personal reaction and promise judgment through reload without changing older chapter saves", () => {
    localStorage.setItem(DEVELOPMENT_CROSSING_KEY, "owner's first-edition save");
    let driver = createDevelopmentCrossingDriver(localStorage, 2);
    crossing(driver);
    for (const commandId of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) {
      driver.commit({ kind: "crossing-command", commandId });
      driver = createDevelopmentCrossingDriver(localStorage, 2);
    }
    const finished = driver.commit({ kind: "finish-crossing" });
    expect(finished.crossings[0]!.outcomeId).toBe("costly-crossing");
    driver = createDevelopmentCrossingDriver(localStorage, 2);
    expect(driver.restore()!.resolution).toEqual(finished.lastResolution);
    expect(driver.getCrossingCommitment()!.outcome.status).toBe("strained");
    expect(driver.getCrossingRecord()!.summary).toEqual(finished.lastResolution!.choice.consequence);
    expect(driver.getCrossingRecord()!.pressure).toEqual(finished.lastResolution!.choice.pressure!.reveal);
    driver.acknowledge();
    expect(createDevelopmentCrossingDriver(localStorage, 2).getCrossingCommitment()!.outcome.status).toBe("strained");
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_V2_KEY)).not.toBeNull();
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe("owner's first-edition save");
    expect(localStorage.getItem(legacyKey)).toBe("owner's original save");
  });
  it("resumes every pulse and the outcome reaction without touching release saves", () => {
    let driver = createDevelopmentCrossingDriver(localStorage);
    let active = crossing(driver);
    while (!active.engagement!.completed) {
      const command = availableEngagementCommands(definition, active.engagement!)[0]!;
      active = driver.commit({ kind: "crossing-command", commandId: command.id });
      driver = createDevelopmentCrossingDriver(localStorage);
      expect(driver.getEngagement()).toEqual(active.engagement);
      expect(driver.restore()!.state).toEqual(active.campaign);
      expect(driver.restore()!.resolution).toBeNull();
    }
    const completed = driver.commit({ kind: "finish-crossing" });
    driver = createDevelopmentCrossingDriver(localStorage);
    expect(driver.restore()!.resolution).toEqual(completed.lastResolution);
    expect(driver.restore()!.resolution!.choice.consequence).toEqual(definition.outcomes.find((outcome) => outcome.id === completed.crossings[0]!.outcomeId)!.summary);
    expect(() => driver.commit({ kind: "finish-crossing" })).toThrow(/Read the saved reaction/);
    driver.acknowledge();
    expect(createDevelopmentCrossingDriver(localStorage).restore()!.resolution).toBeNull();
    driver.reset(123);
    expect(localStorage.getItem(legacyKey)).toBe("owner's original save");
  });

  it("keeps both saved bytes and live state on failed order, finish, acknowledgement and restart writes", () => {
    let rejectWrites = false;
    const storage = {
      getItem: (key: string) => localStorage.getItem(key),
      setItem(key: string, value: string) {
        if (rejectWrites) throw new DOMException("Storage full", "QuotaExceededError");
        localStorage.setItem(key, value);
      },
    };
    const driver = createDevelopmentCrossingDriver(storage);
    let active = crossing(driver);
    const assertWriteFailure = (action: () => void) => {
      const saved = localStorage.getItem(DEVELOPMENT_CROSSING_KEY);
      const before = JSON.stringify({ restored: driver.restore(), engagement: driver.getEngagement() });
      rejectWrites = true;
      expect(action).toThrow(/Storage full/);
      expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(saved);
      expect(JSON.stringify({ restored: driver.restore(), engagement: driver.getEngagement() })).toBe(before);
      rejectWrites = false;
    };
    const first = availableEngagementCommands(definition, active.engagement!)[0]!.id;
    assertWriteFailure(() => driver.commit({ kind: "crossing-command", commandId: first }));
    while (!active.engagement!.completed) active = driver.commit({ kind: "crossing-command", commandId: availableEngagementCommands(definition, active.engagement!)[0]!.id });
    assertWriteFailure(() => driver.commit({ kind: "finish-crossing" }));
    driver.commit({ kind: "finish-crossing" });
    assertWriteFailure(() => driver.acknowledge());
    assertWriteFailure(() => driver.reset(123));
    driver.acknowledge();
    expect(driver.restore()!.resolution).toBeNull();
    expect(localStorage.getItem(legacyKey)).toBe("owner's original save");
  });

  it.each(["broken JSON", JSON.stringify({ snapshotVersion: 1, ledger: {}, pendingEventIndex: null })])("preserves unreadable data instead of starting a fresh chapter: %s", (raw) => {
    localStorage.setItem(DEVELOPMENT_CROSSING_KEY, raw);
    const writer = vi.spyOn(Storage.prototype, "setItem");
    expect(() => createDevelopmentCrossingDriver(localStorage)).toThrow();
    expect(writer).not.toHaveBeenCalled();
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(raw);
    writer.mockRestore();
  });
});
