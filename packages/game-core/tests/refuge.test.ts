import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createInitialState, resolveChoice, councilEntry, createCouncil, resolveCouncil, prepareFanyangEntry,
  createFanyang, resolveFanyang, encodeFanyangSnapshot, prepareRetreatEntry, createRetreat, resolveRetreat,
  encodeRetreatSnapshot, prepareRefugeEntry, createRefuge, inspectRefugeChoice, resolveRefuge,
  encodeRefugeSnapshot, restoreRefuge, type Campaign, type CouncilDefinition, type FanyangDefinition,
  type RetreatDefinition, type MorningDefinition, resolveMorning, restoreMorning, encodeMorningSnapshot, prepareRefugeContactEntry } from "../src";
import campaignRaw from "../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../content/councils/fanyang-guarantee.v1.json";
import retreatRaw from "../../../content/campaigns/chen-retreat.rules.v1.json";
import draft from "../../../content/story-drafts/refuge.v1.json";
import review from "../../../content/research/refuge-review.v1.json";
import morningRaw from "../../../content/story-drafts/refuge-morning.v1.json";
import morningReview from "../../../content/research/refuge-morning-review.v1.json";
const morning = morningRaw as MorningDefinition;
const morningHash = createHash("sha256").update(JSON.stringify(morningRaw)).digest("hex");

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
  it.each(["carry-records", "divide-records", "strip-identities"] as const)("preserves %s into both contact locations using old identifier-only saves", records => {
    const { entry } = route(["send-support", "borrow-local-grain", "hold-formation", records, "move-with-remnant"]);
    expect(entry).not.toBeNull();
    const night = resolveRefuge(createRefuge(entry!), "offer-labour");
    // This is the exact existing v1 wire shape: no new records field is needed.
    const oldNight = { version: 1, entryId: entry!.id, definitionSHA256: refugeHash, order: "offer-labour" };
    expect(JSON.parse(encodeRefugeSnapshot(night, refugeHash))).toEqual(oldNight);
    for (const order of ["repair-roof", "follow-witness"] as const) {
      const dawn = resolveMorning(morning, night, order);
      const oldMorning = { version: 1, entryId: dawn.entryId, order, definitionSHA256: morningHash, nightSHA256: refugeHash };
      expect(JSON.parse(encodeMorningSnapshot(dawn, morningHash, refugeHash))).toEqual(oldMorning);
      const contact = prepareRefugeContactEntry(morning, entry!, oldNight, oldMorning, refugeHash, morningHash)!;
      expect(contact.records).toBe(records);
      expect(contact.debts.length).toBeGreaterThan(0);
      expect(contact.localContact).toBe(order === "repair-roof" ? "holds-word" : "refused");
      const otherNight = { ...oldNight, order: "sleep-outside" };
      expect(prepareRefugeContactEntry(morning, entry!, otherNight, oldMorning, refugeHash, morningHash)).toBeNull();
      // Mutating a downstream copy cannot alter either historical entry.
      contact.debts[0]!.grain = 999;
      expect(night.debts[0]!.grain).not.toBe(999);
      expect(entry!.debts[0]!.grain).not.toBe(999);
    }
  });
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
      expect(result.records).toBe(entry!.records);
      expect(result.debts).toEqual(retreat.debts);
      expect(result.commonGrain).toBe(initial.commonGrain - (order === "offer-grain" ? 1 : 0));
      expect(result.personalObligation).toBe(order === "offer-labour" ? "morning-repair" : null);
      expect(() => resolveRefuge(result, order)).toThrow();
      expect(restoreRefuge(entry!, JSON.parse(encodeRefugeSnapshot(result, refugeHash)), refugeHash)).toEqual(result);
      for (const action of ["repair-roof", "follow-witness"] as const) {
        const dawn = resolveMorning(morning, result, action);
        expect(dawn.promise).toBe(order === "offer-labour" ? action === "repair-roof" ? "kept" : "broken" : "none");
        expect(dawn.contact).toBe(action === "repair-roof" ? "holds-word" : order === "offer-labour" ? "refused" : "none");
        expect(dawn.lead).toBe(action === "repair-roof" ? "departed" : "with-witness");
        expect(dawn.commonGrain).toBe(result.commonGrain);
        expect(dawn.debts).toEqual(result.debts);
        expect(dawn.records).toBe(entry!.records);
        const saved = JSON.parse(encodeMorningSnapshot(dawn, morningHash, refugeHash));
        const nightSaved = JSON.parse(encodeRefugeSnapshot(result, refugeHash));
        const contact = prepareRefugeContactEntry(morning, entry!, nightSaved, saved, refugeHash, morningHash)!;
        expect(contact.location).toBe(action === "repair-roof" ? "household" : "river-approach");
        expect(contact.promise).toBe(dawn.promise);
        expect(contact.localContact).toBe(dawn.contact);
        expect(contact.records).toBe(entry!.records);
        expect(contact.identityEvidence).toBe(entry!.records === "carry-records" ? "held-records" : entry!.records === "divide-records" ? "distributed-records" : "anonymized");
        expect(contact.commonGrain).toBe(result.commonGrain);
        expect(contact.debts).toEqual(retreat.debts);
        expect(contact.companionPresence).toBe("unestablished");
        expect(contact.messageDelivery).toBe("not-entrusted");
        expect(contact.witnessAccount).toBe("not-questioned");
        expect(prepareRefugeContactEntry(morning, entry!, { ...nightSaved, records: "carry-records" },
          { ...saved, records: "carry-records", commonGrain: 999, companionPresence: "arrived", messageDelivery: "delivered" }, refugeHash, morningHash)).toEqual(contact);
        expect(prepareRefugeContactEntry(morning, entry!, { ...nightSaved, order: null }, saved, refugeHash, morningHash)).toBeNull();
        expect(prepareRefugeContactEntry(morning, entry!, nightSaved, { ...saved, entryId: "foreign" }, refugeHash, morningHash)).toBeNull();
        expect(prepareRefugeContactEntry(morning, entry!, nightSaved, saved, "0".repeat(64), morningHash)).toBeNull();
        expect(prepareRefugeContactEntry(morning, entry!, nightSaved, saved, refugeHash, "0".repeat(64))).toBeNull();
        expect(restoreMorning(morning, result, { ...saved, commonGrain: 999, promise: "kept", debts: [] }, morningHash, refugeHash)).toEqual(dawn);
        expect(restoreMorning(morning, result, saved, "0".repeat(64), refugeHash)).toBeNull();
        expect(restoreMorning(morning, result, saved, morningHash, "0".repeat(64))).toBeNull();
        expect(restoreMorning(morning, result, { ...saved, order: "invented" }, morningHash, refugeHash)).toBeNull();
        expect(restoreMorning(morning, result, { ...saved, entryId: "another-night" }, morningHash, refugeHash)).toBeNull();
        expect(result.personalObligation).toBe(order === "offer-labour" ? "morning-repair" : null);
      }
    }
    expect(initial.order).toBeNull();
    expect(() => resolveMorning(morning, initial, "repair-roof")).toThrow();
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
    expect(morningRaw.publicationApproved).toBe(false);
    expect(morningReview.storySHA256).toBe(hash("story-drafts/refuge-morning.v1.json"));
    expect(morning.choices.map(choice => choice.id)).toEqual(["repair-roof", "follow-witness"]);
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
