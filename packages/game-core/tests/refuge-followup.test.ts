import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import contact from "../../../content/story-drafts/refuge-contact.v1.json";
import followup from "../../../content/story-drafts/refuge-followup.v1.json";
import review from "../../../content/research/refuge-followup-review.v1.json";
import { encodeContactSnapshot, resolveContact, type ContactDefinition, type ContactOrder } from "../src/refuge-contact";
import type { RefugeContactEntry } from "../src/refuge-contact-entry";
import { canChooseFollowup, encodeFollowupSnapshot, prepareFollowupEntry, resolveFollowup, restoreFollowup,
  type FollowupDefinition, type FollowupOrder } from "../src/refuge-followup";
const definition = followup as FollowupDefinition;
const hash = (name: string) => createHash("sha256").update(readFileSync(new URL(`../../../content/story-drafts/${name}.v1.json`, import.meta.url))).digest("hex");
const contactHash = hash("refuge-contact"), followupHash = hash("refuge-followup");
describe("the person found after the refuge inquiry", () => {
  it("replays every available contact and record/food branch without inventing a reunion or cancelling debt", () => {
    for (const records of ["carry-records", "divide-records", "strip-identities"] as const)
      for (const grain of [0, 1, 3]) for (const prior of contact.choices) {
        if (prior.requiresHeldRecords && records !== "carry-records") continue;
        const origin: RefugeContactEntry = { version: 1, id: JSON.stringify([records, grain, prior.id]),
          location: prior.location as RefugeContactEntry["location"], records, commonGrain: grain,
          identityEvidence: records === "carry-records" ? "held-records" : records === "divide-records" ? "distributed-records" : "anonymized",
          promise: prior.location === "household" ? "kept" : "broken", localContact: prior.location === "household" ? "holds-word" : "refused",
          debts: [{ id: "unpaid", creditor: "local-grain-holder", grain: 2 }],
          companionPresence: "unestablished", messageDelivery: "not-entrusted", witnessAccount: "not-questioned" };
        const result = resolveContact(contact as ContactDefinition, origin, prior.id as ContactOrder);
        const snapshot = JSON.parse(encodeContactSnapshot(result, contactHash));
        const entry = prepareFollowupEntry(contact as ContactDefinition, origin, snapshot, contactHash)!;
        expect(entry.contact).toEqual(result);
        expect(prepareFollowupEntry(contact as ContactDefinition, origin, { ...snapshot, commonGrain: 999, debts: [] }, contactHash)).toEqual(entry);
        expect(prepareFollowupEntry(contact as ContactDefinition, origin, { ...snapshot, entryId: "foreign" }, contactHash)).toBeNull();
        expect(prepareFollowupEntry(contact as ContactDefinition, origin, snapshot, "0".repeat(64))).toBeNull();
        expect(followup.scenes[result.nextLead].lines.length).toBeGreaterThan(3);
        expect(canChooseFollowup(definition, entry, "share-ration")).toBe(grain >= 1);
        expect(canChooseFollowup(definition, entry, "walk-to-ferry")).toBe(true);
        for (const order of ["share-ration", "walk-to-ferry"] as FollowupOrder[]) {
          if (!canChooseFollowup(definition, entry, order)) { expect(() => resolveFollowup(definition, entry, order)).toThrow(); continue; }
          const next = resolveFollowup(definition, entry, order);
          expect(next.commonGrain).toBe(grain - (order === "share-ration" ? 1 : 0));
          expect(next.debts).toEqual(origin.debts);
          expect(next.promise).toBe(origin.promise);
          expect(next.records).toBe(records);
          expect(next.localContact).toBe(origin.localContact);
          expect(next.priorDisclosure).toBe(result.disclosure);
          expect(next.companionPresence).toBe("unestablished");
          expect(next.newcomer).toBe(order === "share-ration" ? "sheltered" : "accompanied-to-ferry");
          const saved = JSON.parse(encodeFollowupSnapshot(next, followupHash));
          expect(restoreFollowup(definition, entry, { ...saved, commonGrain: 999, debts: [], companionPresence: "arrived" }, followupHash)).toEqual(next);
          expect(restoreFollowup(definition, entry, saved, "0".repeat(64))).toBeNull();
          expect(restoreFollowup(definition, entry, { ...saved, entryId: "foreign" }, followupHash)).toBeNull();
          expect(restoreFollowup(definition, entry, { ...saved, order: "invented" }, followupHash)).toBeNull();
        }
        expect(entry.contact.commonGrain).toBe(grain);
      }
  });
  it("keeps the new scene a reconstruction and preserves previous contact revision", () => {
    expect(followup.publicationApproved).toBe(false);
    expect(review.storySHA256).toBe(followupHash);
    expect(review.publicationApproved).toBe(false);
    expect(contactHash).toBe("1e94a87617cff06c2fd8115af0f58ee547a89da1ad2a9222516d2ce363fd0905");
    expect(followup.choices.map(choice => choice.grainCost)).toEqual([1, 0]);
    expect(followup.brokenPromiseResponse).toContain("不等于原谅");
  });
});
