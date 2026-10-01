import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canChoose, councilCanChoose, councilEntry, councilMetricKeys, createCouncil, createFanyang, createInitialState,
  createRetreat, encodeFanyangSnapshot, encodeRetreatSnapshot, fanyangCanChoose, getNode, inspectRetreatChoice,
  prepareFanyangEntry, prepareRetreatEntry, resolveChoice, resolveCouncil, resolveFanyang, resolveRetreat, restoreRetreat,
  type Campaign, type CouncilDefinition, type CouncilState, type FanyangDefinition, type FanyangState,
  type GameState, type RetreatDefinition, type RetreatEntry, type RetreatState } from "../src";
import campaignRaw from "../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../content/councils/fanyang-guarantee.v1.json";
import rulesRaw from "../../../content/campaigns/chen-retreat.rules.v1.json";
import story from "../../../content/story-drafts/chen-retreat.v1.json";

const definitions = { campaign: campaignRaw as Campaign, council: councilRaw as CouncilDefinition, fanyang: fanyangRaw as FanyangDefinition };
const rules = rulesRaw as RetreatDefinition;
const hash = (path: string) => createHash("sha256").update(readFileSync(new URL(`../../../content/${path}`, import.meta.url))).digest("hex");
const revisions = { campaign: hash("campaigns/chapter-01-daze.json"), council: hash("councils/chen-council.v1.json"), fanyang: hash("councils/fanyang-guarantee.v1.json") };
const rulesHash = hash("campaigns/chen-retreat.rules.v1.json"), storyHash = hash("story-drafts/chen-retreat.v1.json");
const chapters = new Map<string, GameState>();
const walkChapter = (state: GameState) => {
  if (state.completed) { const origin = councilEntry(state); if (origin && !chapters.has(origin.arrival)) chapters.set(origin.arrival, state); return; }
  for (const choice of getNode(definitions.campaign, state.currentNodeId).choices) if (canChoose(choice, state.resources)) walkChapter(resolveChoice(definitions.campaign, state, choice.id).state);
};
walkChapter(createInitialState(definitions.campaign, 0));
const entries: RetreatEntry[] = [];
for (const chapter of chapters.values()) {
  const walkCouncil = (council: CouncilState) => {
    if (!council.completed) {
      for (const choice of definitions.council.rounds[council.history.length]!.choices) if (councilCanChoose(council, choice)) walkCouncil(resolveCouncil(definitions.council, council, choice.id));
      return;
    }
    const savedCouncil = { ...council, definitionSHA256: revisions.council };
    const origin = prepareFanyangEntry(definitions.council, chapter, savedCouncil, revisions.council)!;
    const walkFanyang = (fanyang: FanyangState) => {
      if (!fanyang.completed) {
        for (const choice of definitions.fanyang.rounds[fanyang.history.length]!.choices) if (fanyangCanChoose(definitions.fanyang, fanyang, choice)) walkFanyang(resolveFanyang(definitions.fanyang, fanyang, choice.id));
        return;
      }
      entries.push(prepareRetreatEntry(definitions, { chapter, council: savedCouncil,
        fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, revisions.fanyang)) }, revisions)!);
    };
    walkFanyang(createFanyang(definitions.fanyang, origin));
  };
  walkCouncil(createCouncil(definitions.council, councilEntry(chapter)!));
}

function follow(entry: RetreatEntry, choices: string[]) {
  return choices.reduce((state, choice) => resolveRetreat(rules, state, choice), createRetreat(rules, entry));
}
// Explicit boundary fixtures are not gameplay arrival grants.
function capacity(value: number) {
  const entry = structuredClone(entries[0]!);
  for (const key of councilMetricKeys) entry.fanyang.metrics[key] = value;
  return entry;
}

describe("resource-backed retreat rules", () => {
  it.each([
    [0, 3, 3, 3, "scattered"], [1, 1, 1, 1, "scattered"],
    [1, 2, 0, 0, "dispersed"], [1, 0, 2, 0, "dispersed"], [1, 0, 0, 2, "dispersed"],
  ] as const)("explains dispersal at grain %s and backing %s/%s/%s", (grain, city, allies, veterans, outcome) => {
    const state = follow(capacity(8), ["decline-dispatch", "gather-own", "split-routes", "carry-records"]);
    Object.assign(state.metrics, { grain, city, allies, veterans }); // Threshold fixture, not a claimed playable route.
    const original = JSON.stringify(state);
    const preview = inspectRetreatChoice(rules, state, "release-groups");
    expect(preview.available).toBe(true); // Leaving command remains possible even when orderly departure is not.
    expect(preview.dispersionChecks).toEqual([
      { key: "grain", value: grain, required: 1, met: grain >= 1 },
      { key: "backing", value: Math.max(city, allies, veterans), required: 2, met: Math.max(city, allies, veterans) >= 2 },
    ]);
    expect(preview.outcome).toBe(outcome);
    expect(resolveRetreat(rules, state, "release-groups").outcome).toBe(outcome);
    expect(JSON.stringify(state)).toBe(original);
  });
  it("matches every authored scene and order, without promoting the draft to a release", () => {
    expect(rules.storyId).toBe(story.id);
    expect(rulesRaw.publicationApproved).toBe(false);
    expect(story.publicationApproved).toBe(false);
    expect(rules.scenes.map(scene => [scene.id, scene.choices.map(choice => choice.id)]))
      .toEqual(story.scenes.map(scene => [scene.id, scene.choices.map(choice => choice.id)]));
    expect(Object.keys(rulesRaw.explanationsZh).sort()).toEqual(rules.scenes.flatMap(scene => scene.choices.map(choice => choice.id)).sort());
    expect(Object.keys(rulesRaw.answerExplanationsZh).sort()).toEqual([...new Set(rules.scenes.flatMap(scene => scene.choices.flatMap(choice => (choice.answers ?? []).map(answer => answer.afterChoice))))].sort());
    expect(Object.values(rulesRaw.explanationsZh).every(text => text.length > 0)).toBe(true);
  });

  it("exhausts legal retreat routes from 993 real prior endings without dead ends or unaccounted resupply", () => {
    expect(entries).toHaveLength(993);
    const outcomes = new Set<string>();
    const recoveredEmptyEntries = new Set<string>();
    let paths = 0;
    for (const entry of entries) {
      const entryBefore = JSON.stringify(entry);
      const walk = (state: RetreatState) => {
        if (state.completed) {
          paths++; outcomes.add(state.outcome!);
          if (entry.fanyang.metrics.grain === 0 && state.outcome !== "scattered"
            && state.history.some(turn => turn.choiceId === "borrow-local-grain")) recoveredEmptyEntries.add(entry.id);
          expect(restoreRetreat(rules, entry, JSON.parse(encodeRetreatSnapshot(state, rulesHash, storyHash)), rulesHash, storyHash)).toEqual(state);
          expect(() => resolveRetreat(rules, state, "release-groups")).toThrow();
          return;
        }
        const before = JSON.stringify(state);
        const options = rules.scenes[state.history.length]!.choices.map(choice => inspectRetreatChoice(rules, state, choice.id));
        expect(options.some(option => option.available)).toBe(true);
        for (const option of options) {
          if (!option.available) { expect(option.after).toBeNull(); continue; }
          const next = resolveRetreat(rules, state, option.choice.id);
          expect(next.metrics).toEqual(option.after);
          expect(next.outcome).toBe(option.outcome);
          expect(next.metrics.grain).toBeLessThanOrEqual(state.metrics.grain + (option.newDebt?.grain ?? 0));
          expect(next.debts.length).toBe(state.debts.length + (option.newDebt ? 1 : 0));
          if (option.newDebt) expect(next.metrics.grain - state.metrics.grain).toBe(option.newDebt.grain);
          expect(next.metrics.tempo).toBeLessThanOrEqual(state.metrics.tempo);
          for (const key of councilMetricKeys) expect(next.metrics[key]).toBeGreaterThanOrEqual(0);
          walk(next);
        }
        expect(JSON.stringify(state)).toBe(before);
      };
      const initial = createRetreat(rules, entry);
      for (const key of councilMetricKeys) expect(initial.metrics[key]).toBe(entry.fanyang.metrics[key]);
      walk(initial);
      expect(JSON.stringify(entry)).toBe(entryBefore);
    }
    expect(paths).toBeGreaterThan(993);
    expect([...outcomes].sort()).toEqual(["dispersed", "remnant", "scattered", "together"]);
    expect(recoveredEmptyEntries.size).toBeGreaterThan(0);
    console.info(`Retreat exhaustive audit: ${entries.length} inherited entries, ${paths} complete routes, ${recoveredEmptyEntries.size} actual grain-empty entries with a loan-supported recovery, four outcomes, no narrative dead ends.`);
  }, 45_000);

  it("discloses a depleted campaign's exit as scattering, not an invented orderly reunion", () => {
    const empty = capacity(0);
    const choices = ["decline-dispatch", "gather-own", "split-routes", "carry-records"];
    const state = follow(empty, choices);
    const preview = inspectRetreatChoice(rules, state, "release-groups");
    expect(preview.available).toBe(true);
    expect(preview.outcome).toBe("scattered");
    expect(preview.reactionOverride).toEqual(rules.scattered.reaction);
    const ending = resolveRetreat(rules, state, "release-groups");
    expect(ending.resourceCustody).toBe("unresolved");
    expect(ending.metrics.grain).toBe(0);
    expect(inspectRetreatChoice(rules, state, "stay-together").available).toBe(false);
  });

  it("charges the extra escort burden and recognizes the earlier reserve and shared-ledger procedure", () => {
    const entry = capacity(10);
    let state = follow(entry, ["keep-reserve", "open-reception"]);
    const escort = inspectRetreatChoice(rules, state, "escort-households");
    expect(escort.effects.grain).toBe(-2);
    expect(escort.effects.tempo).toBe(0);
    expect(escort.answers.map(answer => answer.afterChoice)).toEqual(["keep-reserve", "open-reception"]);
    state = { ...state, metrics: { ...state.metrics, grain: 1 } };
    expect(inspectRetreatChoice(rules, state, "escort-households").available).toBe(false);
    const preparation = follow(entry, ["decline-dispatch"]);
    const withLedger = { ...preparation, priorChoices: ["joint-ledger"] };
    const withoutLedger = { ...preparation, priorChoices: [] };
    expect(inspectRetreatChoice(rules, withLedger, "verify-with-partners").effects.tempo).toBe(-1);
    expect(inspectRetreatChoice(rules, withoutLedger, "verify-with-partners").effects.tempo).toBe(-2);
  });

  it("hands dispersed provisions to groups rather than leaving a duplicate common inventory", () => {
    const ending = follow(capacity(10), ["decline-dispatch", "gather-own", "split-routes", "carry-records", "release-groups"]);
    expect(ending.outcome).toBe("dispersed");
    expect(ending.resourceCustody).toBe("groups");
  });

  it("recovers a grain-empty but supported position by taking a debt that survives identity removal and dispersal", () => {
    const entry = capacity(6);
    entry.fanyang.metrics.grain = 0;
    let state = follow(entry, ["decline-dispatch"]);
    const before = JSON.stringify(state);
    const offer = inspectRetreatChoice(rules, state, "borrow-local-grain");
    expect(offer.available).toBe(true);
    expect(offer.newDebt).toEqual({ id: "local-grain-loan", creditor: "local-granary", grain: 2 });
    expect(JSON.stringify(state)).toBe(before);
    state = resolveRetreat(rules, state, "borrow-local-grain");
    expect(state.metrics).toEqual({ grain: 2, tempo: 5, city: 5, allies: 3, veterans: 6 });
    expect(state.debts).toEqual([offer.newDebt]);
    expect(() => resolveRetreat(rules, state, "borrow-local-grain")).toThrow();
    for (const choice of ["split-routes", "strip-identities", "release-groups"]) state = resolveRetreat(rules, state, choice);
    expect(state.outcome).toBe("dispersed");
    expect(state.resourceCustody).toBe("groups");
    expect(state.debts).toEqual([offer.newDebt]);
    const snapshot = JSON.parse(encodeRetreatSnapshot(state, rulesHash, storyHash));
    expect(snapshot).not.toHaveProperty("debts");
    expect(restoreRetreat(rules, entry, { ...snapshot, debts: [], metrics: { grain: 10 } }, rulesHash, storyHash)).toEqual(state);
    const noLoan = follow(entry, ["decline-dispatch", "gather-own", "split-routes", "strip-identities", "release-groups"]);
    expect(noLoan.outcome).toBe("scattered");
  });

  it("requires guarantors and handover time, and never incurs a full debt for a clipped grain delivery", () => {
    for (const entry of [capacity(0), capacity(10)]) {
      const state = follow(entry, ["decline-dispatch"]);
      const preview = inspectRetreatChoice(rules, state, "borrow-local-grain");
      expect(preview.available).toBe(false);
      expect(preview.newDebt).toBeUndefined();
      expect(preview.after).toBeNull();
      expect(() => resolveRetreat(rules, state, "borrow-local-grain")).toThrow();
    }
    const entry = capacity(6); entry.fanyang.metrics.tempo = 0;
    expect(inspectRetreatChoice(rules, follow(entry, ["decline-dispatch"]), "borrow-local-grain").available).toBe(false);
  });

  it("binds replay to both story and rules revisions and ignores fabricated totals", () => {
    const entry = entries[0]!;
    const state = follow(entry, ["decline-dispatch", "gather-own"]);
    const saved = JSON.parse(encodeRetreatSnapshot(state, rulesHash, storyHash));
    expect(restoreRetreat(rules, entry, saved, rulesHash, storyHash)).toEqual(state);
    expect(restoreRetreat(rules, entry, { ...saved, metrics: { grain: 999 }, outcome: "together", resourceCustody: "groups" }, rulesHash, storyHash)).toEqual(state);
    for (const invalid of [null, [], {}, { ...saved, entryId: "foreign" }, { ...saved, choices: ["stay-together"] },
      { ...saved, rulesSHA256: "0".repeat(64) }, { ...saved, storySHA256: "0".repeat(64) }]) {
      expect(restoreRetreat(rules, entry, invalid, rulesHash, storyHash)).toBeNull();
    }
    expect(() => encodeRetreatSnapshot(state, "invalid", storyHash)).toThrow();
  });

  it("replays only explicitly reviewed prose revisions without mutating old saves", () => {
    expect(story.saveCompatibility.rulesSHA256).toBe(rulesHash);
    const compatible = story.saveCompatibility.previousStorySHA256;
    const entry = entries[0]!;
    const state = follow(entry, ["decline-dispatch", "gather-own"]);
    for (const old of compatible) {
      const saved = JSON.parse(encodeRetreatSnapshot(state, rulesHash, old));
      const before = JSON.stringify(saved);
      expect(restoreRetreat(rules, entry, saved, rulesHash, storyHash)).toBeNull();
      expect(restoreRetreat(rules, entry, saved, rulesHash, storyHash, compatible)).toEqual(state);
      expect(JSON.stringify(saved)).toBe(before);
      for (const invalid of [{ ...saved, entryId: "foreign" }, { ...saved, rulesSHA256: "0".repeat(64) },
        { ...saved, choices: ["stay-together"] }, { ...saved, storySHA256: "f".repeat(64), compatibleStorySHA256: ["f".repeat(64)] }]) {
        expect(restoreRetreat(rules, entry, invalid, rulesHash, storyHash, compatible)).toBeNull();
      }
    }
  });
});
