import type { RefugeState } from "./refuge";

export type MorningOrder = "repair-roof" | "follow-witness";
export type MorningPromise = "kept" | "broken" | "none";
export type MorningContact = "holds-word" | "refused" | "none";
export type MorningLead = "departed" | "with-witness";
export interface MorningDefinition {
  schemaVersion: number;
  id: string;
  choices: { id: string; effects: { promiseIfOwed: "kept" | "broken";
    contact: MorningContact; contactIfOwed?: MorningContact; lead: MorningLead } }[];
}
export interface MorningState {
  entryId: string;
  order: MorningOrder;
  promise: MorningPromise;
  contact: MorningContact;
  lead: MorningLead;
  commonGrain: number;
  debts: RefugeState["debts"];
  records: RefugeState["records"];
}
export function morningEntryId(night: RefugeState): string {
  if (!night.order) throw new Error("Shelter decision required before morning");
  return JSON.stringify(["refuge-morning.v1", night.entryId, night.order]);
}
export function resolveMorning(definition: MorningDefinition, night: RefugeState, order: MorningOrder): MorningState {
  const entryId = morningEntryId(night);
  const choice = definition.choices.find(item => item.id === order);
  if (definition.schemaVersion !== 1 || definition.id !== "refuge-morning.v1" || !choice) throw new Error("Unknown morning definition or order");
  const owed = night.personalObligation === "morning-repair";
  return { entryId, order, promise: owed ? choice.effects.promiseIfOwed : "none",
    contact: owed ? choice.effects.contactIfOwed ?? choice.effects.contact : choice.effects.contact,
    lead: choice.effects.lead, commonGrain: night.commonGrain, debts: night.debts.map(debt => ({ ...debt })), records: night.records };
}
export function encodeMorningSnapshot(state: MorningState, definitionHash: string, nightHash: string): string {
  if (![definitionHash, nightHash].every(hash => /^[a-f0-9]{64}$/.test(hash))) throw new Error("Invalid morning revision");
  return JSON.stringify({ version: 1, entryId: state.entryId, order: state.order, definitionSHA256: definitionHash, nightSHA256: nightHash });
}
export function restoreMorning(definition: MorningDefinition, night: RefugeState, snapshot: unknown,
  definitionHash: string, nightHash: string): MorningState | null {
  if (![definitionHash, nightHash].every(hash => /^[a-f0-9]{64}$/.test(hash)) || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const saved = snapshot as Record<string, unknown>;
  try {
    if (saved.version !== 1 || saved.entryId !== morningEntryId(night) || saved.definitionSHA256 !== definitionHash || saved.nightSHA256 !== nightHash) return null;
    return resolveMorning(definition, night, saved.order as MorningOrder);
  } catch { return null; }
}
