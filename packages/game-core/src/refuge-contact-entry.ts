import { restoreRefuge, type RefugeEntry } from "./refuge";
import { restoreMorning, type MorningDefinition, type MorningState } from "./refuge-morning";

/** Future contact-scene input, derived from both actual confirmed decisions. */
export interface RefugeContactEntry {
  version: 1;
  id: string;
  location: "household" | "river-approach";
  promise: MorningState["promise"];
  localContact: MorningState["contact"];
  records: RefugeEntry["records"];
  identityEvidence: "held-records" | "distributed-records" | "anonymized";
  commonGrain: number;
  debts: MorningState["debts"];
  companionPresence: "unestablished";
  messageDelivery: "not-entrusted";
  witnessAccount: "not-questioned";
}

export function prepareRefugeContactEntry(definition: MorningDefinition, entry: RefugeEntry,
  nightSnapshot: unknown, morningSnapshot: unknown,
  nightHash: string, morningHash: string): RefugeContactEntry | null {
  const night = restoreRefuge(entry, nightSnapshot, nightHash);
  if (!night) return null;
  const morning = restoreMorning(definition, night, morningSnapshot, morningHash, nightHash);
  if (!morning) return null;
  return {
    version: 1,
    id: JSON.stringify(["refuge-contact.v1", morning.entryId, morning.order, nightHash, morningHash]),
    location: morning.lead === "with-witness" ? "river-approach" : "household",
    promise: morning.promise, localContact: morning.contact, records: morning.records,
    identityEvidence: morning.records === "carry-records" ? "held-records" : morning.records === "divide-records" ? "distributed-records" : "anonymized",
    commonGrain: morning.commonGrain, debts: morning.debts.map(debt => ({ ...debt })),
    // An opportunity to speak is not testimony, delivery, or proof of survival.
    companionPresence: "unestablished", messageDelivery: "not-entrusted", witnessAccount: "not-questioned",
  };
}
