import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createInitialState, resolveChoice, councilEntry, createCouncil, resolveCouncil, prepareFanyangEntry,
  createFanyang, resolveFanyang, encodeFanyangSnapshot, prepareRetreatEntry, createRetreat, resolveRetreat,
  encodeRetreatSnapshot, prepareRefugeEntry, createRefuge, inspectRefugeChoice, resolveRefuge,
  encodeRefugeSnapshot, restoreRefuge, type Campaign, type CouncilDefinition, type FanyangDefinition,
  type RetreatDefinition } from "../src";
import campaignRaw from "../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../content/councils/fanyang-guarantee.v1.json";
import retreatRaw from "../../../content/campaigns/chen-retreat.rules.v1.json";
import draft from "../../../content/story-drafts/refuge.v1.json";
import review from "../../../content/research/refuge-review.v1.json";

const hash = (path: string) => createHash("sha256").update(readFileSync(new URL(`../../../content/${path}`, import.meta.url))).digest("hex");
const revisions = { campaign: hash("campaigns/chapter-01-daze.json"), council: hash("councils/chen-council.v1.json"), fanyang: hash("councils/fanyang-guarantee.v1.json") };
const rulesHash = hash("campaigns/chen-retreat.rules.v1.json"), storyHash = hash("story-drafts/chen-retreat.v1.json"), refugeHash = hash("story-drafts/refuge.v1.json");
const definitions = { campaign: campaignRaw as Campaign, council: councilRaw as CouncilDefinition, fanyang: fanyangRaw as FanyangDefinition };
const rules = retreatRaw as RetreatDefinition;
let chapter = createInitialState(definitions.campaign, 0);
for (const id of ["read-the-names", "issue-grain-tallies", "repair-the-ford", "root-in-villages"]) chapter = resolveChoice(definitions.campaign, chapter, id).state;
let council = createCouncil(definitions.council, councilEntry(chapter)!);
for (const id of ["defer-title", "joint-ledger", "one-command"]) council = resolveCouncil(definitions.council, council, id);
const savedCouncil = { ...council, definitionSHA256: revisions.council };
const fanyangEntry = prepareFanyangEntry(definitions.council, chapter, savedCouncil, revisions.council)!;
let fanyang = createFanyang(definitions.fanyang, fanyangEntry);
for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) fanyang = resolveFanyang(definitions.fanyang, fanyang, id);
const retreatEntry = prepareRetreatEntry(definitions, { chapter, council: savedCouncil,
  fanyang: JSON.parse(encodeFanyangSnapshot(fanyang, revisions.fanyang)) }, revisions)!;
function route(orders: string[]) {
  const retreat = orders.reduce((state, id) => resolveRetreat(rules, state, id), createRetreat(rules, retreatEntry));
  const snapshot = JSON.parse(encodeRetreatSnapshot(retreat, rulesHash, storyHash));
  return { retreat, snapshot, entry: prepareRefugeEntry(rules, retreatEntry, snapshot, rulesHash, storyHash) };
}
const routes = [
  ["together", ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"]],
  ["remnant", ["send-support", "borrow-local-grain", "hold-formation", "strip-identities", "move-with-remnant"]],
  ["dispersed", ["decline-dispatch", "gather-own", "split-routes", "divide-records", "release-groups"]],
  ["scattered", ["keep-reserve", "open-reception", "escort-households", "carry-records", "release-groups"]],
] as const;

describe("shelter continuation boundary", () => {
  it.each(routes)("carries the actual %s ending into shelter without reunions or replenishment", (outcome, orders) => {
    const { retreat, snapshot, entry } = route([...orders]);
    expect(retreat.outcome).toBe(outcome); expect(entry).not.toBeNull();
    expect(entry!.recordedGrain).toBe(retreat.metrics.grain);
    expect(entry!.spendableCommonGrain).toBe(retreat.resourceCustody === "common" ? retreat.metrics.grain : 0);
    expect(entry!.debts).toEqual(retreat.debts);
    expect(entry!.companionPresence).toBe("unestablished");
    const initial = createRefuge(entry!);
    expect(inspectRefugeChoice(initial, "offer-grain").available).toBe(initial.commonGrain >= 1);
    for (const order of ["offer-grain", "offer-labour", "sleep-outside"] as const) {
      if (!inspectRefugeChoice(initial, order).available) { expect(() => resolveRefuge(initial, order)).toThrow(); continue; }
      const result = resolveRefuge(initial, order);
      expect(result.debts).toEqual(retreat.debts);
      expect(result.commonGrain).toBe(initial.commonGrain - (order === "offer-grain" ? 1 : 0));
      expect(result.personalObligation).toBe(order === "offer-labour" ? "morning-repair" : null);
      expect(() => resolveRefuge(result, order)).toThrow();
      expect(restoreRefuge(entry!, JSON.parse(encodeRefugeSnapshot(result, refugeHash)), refugeHash)).toEqual(result);
    }
    expect(initial.order).toBeNull();
    expect(snapshot.choices).toEqual(orders);
  });
  it("rejects incomplete, foreign and stale histories and ignores forged inventory fields", () => {
    expect(route(["decline-dispatch"]).entry).toBeNull();
    const { snapshot, entry } = route([...routes[2][1]]);
    expect(prepareRefugeEntry(rules, retreatEntry, { ...snapshot, entryId: "foreign" }, rulesHash, storyHash)).toBeNull();
    expect(prepareRefugeEntry(rules, retreatEntry, snapshot, "0".repeat(64), storyHash)).toBeNull();
    expect(prepareRefugeEntry(rules, retreatEntry, { ...snapshot, metrics: { grain: 10 }, resourceCustody: "common" }, rulesHash, storyHash)).toEqual(entry);
    expect(restoreRefuge(entry!, { version: 1, entryId: entry!.id, definitionSHA256: refugeHash, order: "offer-grain", commonGrain: 10 }, refugeHash)).toBeNull();
    expect(() => encodeRefugeSnapshot(createRefuge(entry!), refugeHash)).toThrow();
  });
  it("keeps the authored scene private, source-bounded and matched to executable orders", () => {
    expect(draft.publicationApproved).toBe(false);
    expect(draft.choices.map(choice => choice.id)).toEqual(["offer-grain", "offer-labour", "sleep-outside"]);
    expect(draft.choices.every(choice => choice.response.length >= 2)).toBe(true);
    expect(draft.sourceReadback.volume).toBe(8);
    expect(review.storySHA256).toBe(refugeHash);
    expect(review.publicationApproved).toBe(false);
  });
  it("remembers a personal promise across reload without settling earlier debts", () => {
    const { entry } = route([...routes[1][1]]);
    expect(entry!.debts.length).toBeGreaterThan(0);
    const initial = createRefuge(entry!);
    const promised = resolveRefuge(initial, "offer-labour");
    const restored = restoreRefuge(entry!, JSON.parse(encodeRefugeSnapshot(promised, refugeHash)), refugeHash)!;
    expect(restored.personalObligation).toBe("morning-repair");
    expect(restored.shelter).toBe("under-eaves");
    expect(restored.rested).toBe(false);
    expect(restored.debts).toEqual(entry!.debts);
    expect(restored.commonGrain).toBe(initial.commonGrain);
    expect(restoreRefuge(entry!, JSON.parse(encodeRefugeSnapshot(promised, refugeHash)), "0".repeat(64))).toBeNull();
  });
});
