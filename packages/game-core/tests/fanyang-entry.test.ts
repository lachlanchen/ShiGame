import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { canChoose, councilCanChoose, councilEntry, createCouncil, createInitialState, getNode, prepareFanyangEntry, resolveChoice, resolveCouncil, type Campaign, type CouncilDefinition, type CouncilState, type GameState } from "../src";
import rawCampaign from "../../../content/campaigns/chapter-01-daze.json";
import rawCouncil from "../../../content/councils/chen-council.v1.json";
import review from "../../../content/research/chen-council-review.v1.json";

const campaign = rawCampaign as Campaign;
const definition = rawCouncil as CouncilDefinition;
const fingerprint = review.contentSHA256;
function chapter(seed = 0) {
  let state = createInitialState(campaign, seed);
  while (!state.completed) state = resolveChoice(campaign, state,
    getNode(campaign, state.currentNodeId).choices.find(choice => canChoose(choice, state.resources))!.id).state;
  return state;
}
const origin = chapter();
function completed() {
  let state = createCouncil(definition, councilEntry(origin)!);
  for (const id of ["defer-title", "joint-ledger", "one-command"]) state = resolveCouncil(definition, state, id);
  return { ...state, definitionSHA256: fingerprint };
}

describe("Fan Yang continuation handoff", () => {
  it("binds the review fingerprint to the actual canonical council bytes", () => {
    expect(createHash("sha256").update(readFileSync(new URL("../../../content/councils/chen-council.v1.json", import.meta.url))).digest("hex")).toBe(fingerprint);
  });
  it("carries every council route from every surviving chapter route at two fixed seeds", () => {
    const arrivals = new Set<string>();
    const outcomes = new Set<string>();
    const identities = new Set<string>();
    let chapters = 0;
    let handoffs = 0;
    const visit = (state: CouncilState, chapterState: GameState) => {
      if (!state.completed) {
        const legal = definition.rounds[state.history.length]!.choices.filter(choice => councilCanChoose(state, choice));
        expect(legal.length).toBeGreaterThan(0);
        for (const choice of legal) visit(resolveCouncil(definition, state, choice.id), chapterState);
        return;
      }
      handoffs++;
      const snapshot = { ...state, definitionSHA256: fingerprint };
      const before = JSON.stringify(snapshot);
      const chapterBefore = JSON.stringify(chapterState);
      const entry = prepareFanyangEntry(definition, chapterState, snapshot, fingerprint)!;
      expect(entry).not.toBeNull();
      identities.add(entry.id);
      outcomes.add(entry.outcome);
      arrivals.add(entry.origin.arrival);
      expect(entry.metrics).toEqual(state.metrics);
      expect(entry.outcome).toEqual(state.outcome);
      expect(entry.choices).toEqual(state.history.map(turn => turn.choiceId));
      expect(prepareFanyangEntry(definition, chapterState, JSON.parse(before), fingerprint)).toEqual(entry);
      entry.metrics.grain = 999;
      entry.choices.push("unrelated");
      entry.origin.id = "unrelated";
      expect(JSON.stringify(snapshot)).toBe(before);
      expect(JSON.stringify(chapterState)).toBe(chapterBefore);
    };
    const visitChapter = (state: GameState) => {
      if (state.completed) {
        const entry = councilEntry(state);
        if (entry) {
          chapters++;
          visit(createCouncil(definition, entry), state);
        } else expect(prepareFanyangEntry(definition, state, completed(), fingerprint)).toBeNull();
        return;
      }
      for (const choice of getNode(campaign, state.currentNodeId).choices) {
        if (canChoose(choice, state.resources)) visitChapter(resolveChoice(campaign, state, choice.id).state);
      }
    };
    for (const seed of [0, 0x5eed2026]) visitChapter(createInitialState(campaign, seed));
    expect(chapters).toBeGreaterThan(0);
    expect(handoffs).toBeGreaterThan(chapters);
    expect(identities.size).toBe(handoffs);
    expect([...arrivals].sort()).toEqual(["divided", "pressed", "supplied"]);
    expect([...outcomes].sort()).toEqual(["city-stronghold", "common-front", "empty-granaries", "fragile-coalition"]);
  });

  it("rejects an unfinished chapter, unfinished council, other chronicle or revision", () => {
    expect(prepareFanyangEntry(definition, createInitialState(campaign, 0), completed(), fingerprint)).toBeNull();
    expect(prepareFanyangEntry(definition, origin, { ...createCouncil(definition, councilEntry(origin)!), definitionSHA256: fingerprint }, fingerprint)).toBeNull();
    expect(prepareFanyangEntry(definition, chapter(1), completed(), fingerprint)).toBeNull();
    expect(prepareFanyangEntry(definition, origin, completed(), "0".repeat(64))).toBeNull();
    for (const snapshot of [null, [], {}, { ...completed(), definitionSHA256: undefined }]) {
      expect(prepareFanyangEntry(definition, origin, snapshot, fingerprint)).toBeNull();
    }
  });

  it("replays choices instead of trusting forged totals or a forged conclusion", () => {
    const snapshot = completed();
    const expected = prepareFanyangEntry(definition, origin, snapshot, fingerprint);
    expect(prepareFanyangEntry(definition, origin, { ...snapshot, metrics: { grain: 999 }, outcome: "empty-granaries" }, fingerprint)).toEqual(expected);
    expect(prepareFanyangEntry(definition, origin, { ...snapshot, history: [{ choiceId: "not-an-order" }] }, fingerprint)).toBeNull();
    const alternative = resolveCouncil(definition, resolveCouncil(definition,
      resolveCouncil(definition, createCouncil(definition, councilEntry(origin)!), "defer-title"), "joint-ledger"), "hold-chen");
    expect(prepareFanyangEntry(definition, origin, { ...alternative, definitionSHA256: fingerprint }, fingerprint)?.id).not.toBe(expected?.id);
  });
});
