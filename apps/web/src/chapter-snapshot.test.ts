import { describe, expect, it } from "vitest";
import { canChoose, createInitialState, getNode, resolveChoice, type Campaign, type GameState } from "@shi/game-core";
import campaignJson from "./generated/chapter-01-gameplay.json";
import { readChapterSnapshot, writeChapterSnapshot } from "./chapter-snapshot";

const campaign = campaignJson as unknown as Campaign;
const first = () => resolveChoice(campaign, createInitialState(campaign, 0xcb918329), "read-the-names");

describe("chapter aftermath snapshot", () => {
  it("restores every reachable reaction, including endings and failures, for the device seed", () => {
    let turns = 0, endings = 0;
    const visit = (state: GameState) => {
      if (state.completed) { endings++; return; }
      for (const choice of getNode(campaign, state.currentNodeId).choices) {
        if (!canChoose(choice, state.resources)) continue;
        const result = resolveChoice(campaign, state, choice.id);
        const restored = readChapterSnapshot(campaign, JSON.parse(writeChapterSnapshot(result.state, result)))!;
        expect(restored.resolution).toEqual(result);
        expect(restored.state.history).toHaveLength(state.history.length + 1);
        turns++;
        visit(result.state);
      }
    };
    visit(createInitialState(campaign, 0xcb918329));
    expect(turns).toBeGreaterThan(50);
    expect(endings).toBeGreaterThan(10);
  });
  it("restores the exact unread reaction without committing another turn", () => {
    const result = first();
    const saved = writeChapterSnapshot(result.state, result);
    const restored = readChapterSnapshot(campaign, JSON.parse(saved))!;
    expect(restored.state).toEqual(result.state);
    expect(restored.resolution).toEqual(result);
    expect(writeChapterSnapshot(restored.state, restored.resolution)).toBe(saved);
    expect(restored.state.history).toHaveLength(1);
  });
  it("does not reopen an acknowledged reaction or invent one for an old save", () => {
    const result = first();
    expect(readChapterSnapshot(campaign, JSON.parse(writeChapterSnapshot(result.state, null)))?.resolution).toBeNull();
    expect(readChapterSnapshot(campaign, result.state)?.resolution).toBeNull();
  });
  it.each([0, 2, -1, "1", true, {}, null])("ignores invalid or stale presentation metadata %j", marker => {
    const result = first();
    const restored = readChapterSnapshot(campaign, { ...result.state, pendingAftermath: marker })!;
    expect(restored.resolution).toBeNull();
    expect(restored.state).toEqual(result.state);
  });
  it("does not trust altered campaign history even with a matching marker", () => {
    const result = first();
    expect(readChapterSnapshot(campaign, { ...result.state, pendingAftermath: 1,
      history: [{ ...result.state.history[0], choiceId: "invented-choice" }] })).toBeNull();
  });
});
