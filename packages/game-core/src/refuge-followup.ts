import { restoreContact, type ContactDefinition, type ContactState } from "./refuge-contact";
import type { RefugeContactEntry } from "./refuge-contact-entry";

export type FollowupOrder = "share-ration" | "walk-to-ferry";
export interface FollowupDefinition {
  schemaVersion: number; id: string;
  choices: { id: string; grainCost: number; effects: {
    newcomer: "sheltered" | "accompanied-to-ferry";
    search: "last-ferry-missed" | "last-ferry-inquiry";
    disclosure: "shelter-location" | "travel-route";
  } }[];
}
export interface FollowupEntry { id: string; contact: ContactState }
export interface FollowupState {
  entryId: string; order: FollowupOrder; commonGrain: number;
  debts: ContactState["debts"]; promise: ContactState["promise"];
  records: ContactState["records"]; localContact: ContactState["localContact"];
  priorDisclosure: ContactState["disclosure"];
  companionPresence: "unestablished";
  newcomer: "sheltered" | "accompanied-to-ferry";
  search: "last-ferry-missed" | "last-ferry-inquiry";
  disclosure: "shelter-location" | "travel-route";
}
const revision = (hash: string) => /^[a-f0-9]{64}$/.test(hash);
/** Derive only from the replayed preceding decision, never a supplied inventory. */
export function prepareFollowupEntry(definition: ContactDefinition, entry: RefugeContactEntry,
  snapshot: unknown, contactHash: string): FollowupEntry | null {
  const contact = restoreContact(definition, entry, snapshot, contactHash);
  if (!contact) return null;
  return { id: JSON.stringify(["refuge-followup.v1", contact.entryId, contact.order, contactHash]), contact };
}
export function canChooseFollowup(definition: FollowupDefinition, entry: FollowupEntry, order: FollowupOrder): boolean {
  const choice = definition.choices.find(item => item.id === order);
  return definition.schemaVersion === 1 && definition.id === "refuge-followup.v1" && !!choice
    && Number.isSafeInteger(choice.grainCost) && choice.grainCost >= 0 && choice.grainCost <= entry.contact.commonGrain;
}
export function resolveFollowup(definition: FollowupDefinition, entry: FollowupEntry, order: FollowupOrder): FollowupState {
  if (!canChooseFollowup(definition, entry, order)) throw new Error("Unavailable follow-up action");
  const choice = definition.choices.find(item => item.id === order)!;
  return { entryId: entry.id, order, commonGrain: entry.contact.commonGrain - choice.grainCost,
    debts: entry.contact.debts.map(debt => ({ ...debt })), promise: entry.contact.promise,
    records: entry.contact.records, localContact: entry.contact.localContact,
    priorDisclosure: entry.contact.disclosure, companionPresence: "unestablished", ...choice.effects };
}
export function encodeFollowupSnapshot(state: FollowupState, hash: string): string {
  if (!revision(hash)) throw new Error("Invalid follow-up revision");
  return JSON.stringify({ version: 1, entryId: state.entryId, order: state.order, definitionSHA256: hash });
}
export function restoreFollowup(definition: FollowupDefinition, entry: FollowupEntry, snapshot: unknown, hash: string): FollowupState | null {
  if (!revision(hash) || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const saved = snapshot as Record<string, unknown>;
  if (saved.version !== 1 || saved.entryId !== entry.id || saved.definitionSHA256 !== hash) return null;
  try { return resolveFollowup(definition, entry, saved.order as FollowupOrder); } catch { return null; }
}
