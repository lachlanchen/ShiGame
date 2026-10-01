import type { RefugeContactEntry } from "./refuge-contact-entry";

export type ContactOrder = "leave-route" | "leave-record" | "ask-unprompted" | "show-record";
export interface ContactEffects {
  message: "not-entrusted" | "route-entrusted" | "record-entrusted";
  evidence: "none" | "unprompted-account" | "prompted-account";
  disclosure: "none" | "route" | "identifying-record";
  nextLead: "return-at-sunset" | "reed-bank-alone" | "ferry-with-guide";
}
export interface ContactDefinition {
  schemaVersion: number; id: string;
  choices: { id: string; location: RefugeContactEntry["location"]; requiresHeldRecords: boolean; effects: ContactEffects }[];
}
export interface ContactState extends ContactEffects {
  entryId: string; order: ContactOrder; commonGrain: number;
  debts: RefugeContactEntry["debts"]; promise: RefugeContactEntry["promise"];
  localContact: RefugeContactEntry["localContact"];
  records: RefugeContactEntry["records"]; companionPresence: "unestablished";
}
export function inspectContactChoice(definition: ContactDefinition, entry: RefugeContactEntry, order: ContactOrder) {
  const choice = definition.choices.find(item => item.id === order);
  if (definition.schemaVersion !== 1 || definition.id !== "refuge-contact.v1" || !choice) throw new Error("Unknown contact choice");
  const locationMet = choice.location === entry.location;
  const recordsMet = !choice.requiresHeldRecords || entry.records === "carry-records";
  const contactMet = entry.location !== "household" || entry.localContact === "holds-word";
  return { available: locationMet && recordsMet && contactMet, locationMet, recordsMet, contactMet, effects: { ...choice.effects } };
}
export function resolveContact(definition: ContactDefinition, entry: RefugeContactEntry, order: ContactOrder): ContactState {
  const preview = inspectContactChoice(definition, entry, order);
  if (!preview.available) throw new Error("Unavailable contact choice");
  return { ...preview.effects, entryId: entry.id, order, commonGrain: entry.commonGrain,
    debts: entry.debts.map(debt => ({ ...debt })), promise: entry.promise, localContact: entry.localContact,
    records: entry.records, companionPresence: "unestablished" };
}
export function encodeContactSnapshot(state: ContactState, definitionHash: string): string {
  if (!/^[a-f0-9]{64}$/.test(definitionHash)) throw new Error("Invalid contact revision");
  return JSON.stringify({ version: 1, entryId: state.entryId, order: state.order, definitionSHA256: definitionHash });
}
export function restoreContact(definition: ContactDefinition, entry: RefugeContactEntry, snapshot: unknown, definitionHash: string): ContactState | null {
  if (!/^[a-f0-9]{64}$/.test(definitionHash) || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const saved = snapshot as Record<string, unknown>;
  if (saved.version !== 1 || saved.entryId !== entry.id || saved.definitionSHA256 !== definitionHash) return null;
  try { return resolveContact(definition, entry, saved.order as ContactOrder); } catch { return null; }
}
