// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { availableEngagementCommands, getNode, type Campaign, type EngagementDefinition } from "@shi/game-core";
import campaignJson from "../../../content/campaigns/chapter-01-daze.json";
import engagementJson from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import { createDevelopmentCrossingDriver, DEVELOPMENT_CROSSING_KEY, DEVELOPMENT_CROSSING_V2_KEY } from "./development-crossing";

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
