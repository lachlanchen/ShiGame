import { restoreRetreat, type RetreatDebt, type RetreatDefinition, type RetreatOutcome } from "./retreat";
import type { RetreatEntry } from "./retreat-entry";
import sharedRules from "../../../content/campaigns/refuge.rules.v1.json";

/** Development continuation boundary. Only a fully replayed retreat may enter. */
export interface RefugeEntry {
  version: 1;
  id: string;
  retreatOutcome: RetreatOutcome;
  custody: "common" | "groups" | "unresolved";
  /** Historical capacity is not necessarily available to this viewpoint. */
  recordedGrain: number;
  spendableCommonGrain: number;
  debts: RetreatDebt[];
  records: "carry-records" | "divide-records" | "strip-identities";
  priorOrders: string[];
  companionPresence: "unestablished";
}

export function prepareRefugeEntry(definition: RetreatDefinition, entry: RetreatEntry,
  snapshot: unknown, rulesHash: string, storyHash: string): RefugeEntry | null {
  const retreat = restoreRetreat(definition, entry, snapshot, rulesHash, storyHash);
  if (!retreat?.completed || !retreat.outcome) return null;
  const records = retreat.history.find(turn => turn.sceneId === "records")?.choiceId;
  if (records !== "carry-records" && records !== "divide-records" && records !== "strip-identities") return null;
  const priorOrders = retreat.history.map(turn => turn.choiceId);
  return {
    version: 1, id: JSON.stringify(["refuge.v1", entry.id, rulesHash, storyHash, priorOrders]),
    retreatOutcome: retreat.outcome, custody: retreat.resourceCustody,
    recordedGrain: retreat.metrics.grain,
    spendableCommonGrain: retreat.resourceCustody === "common" ? retreat.metrics.grain : 0,
    debts: retreat.debts.map(debt => ({ ...debt })), records, priorOrders,
    // A retreat observation is not proof of arrival at the next household.
    companionPresence: "unestablished",
  };
}

export type RefugeOrder = "offer-grain" | "offer-labour" | "sleep-outside";
export interface RefugeState {
  version: 1;
  entryId: string;
  commonGrain: number;
  debts: RetreatDebt[];
  order: RefugeOrder | null;
  records: RefugeEntry["records"];
  shelter: "undecided" | "under-eaves" | "outside";
  personalObligation: "morning-repair" | null;
  rested: boolean;
}

export function createRefuge(entry: RefugeEntry): RefugeState {
  return { version: 1, entryId: entry.id, commonGrain: entry.spendableCommonGrain,
    debts: entry.debts.map(debt => ({ ...debt })), order: null, records: entry.records, shelter: "undecided",
    personalObligation: null, rested: false };
}

export function inspectRefugeChoice(state: RefugeState, order: RefugeOrder) {
  const choice = sharedRules.choices.find(choice => choice.id === order);
  if (!choice) throw new Error("Unknown shelter order");
  return { available: state.order === null && state.commonGrain >= choice.grainCost,
    grainCost: choice.grainCost, shelter: choice.shelter as RefugeState["shelter"], rested: choice.rested,
    personalObligation: choice.personalObligation as RefugeState["personalObligation"] };
}

export function resolveRefuge(state: RefugeState, order: RefugeOrder): RefugeState {
  const preview = inspectRefugeChoice(state, order);
  if (!preview.available) throw new Error("Unavailable shelter order");
  return { ...state, debts: state.debts.map(debt => ({ ...debt })), order,
    commonGrain: state.commonGrain - preview.grainCost,
    shelter: preview.shelter,
    personalObligation: preview.personalObligation,
    rested: preview.rested };
}

/** Identifier-only save; resource balances are always reconstructed. */
export function encodeRefugeSnapshot(state: RefugeState, definitionHash: string): string {
  if (!state.order || !/^[a-f0-9]{64}$/.test(definitionHash)) throw new Error("Unconfirmed shelter order or invalid revision");
  return JSON.stringify({ version: 1, entryId: state.entryId, definitionSHA256: definitionHash, order: state.order });
}

export function restoreRefuge(entry: RefugeEntry, snapshot: unknown, definitionHash: string): RefugeState | null {
  if (!/^[a-f0-9]{64}$/.test(definitionHash) || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const saved = snapshot as Record<string, unknown>;
  if (saved.version !== 1 || saved.entryId !== entry.id || saved.definitionSHA256 !== definitionHash
    || !["offer-grain", "offer-labour", "sleep-outside"].includes(saved.order as string)) return null;
  try { return resolveRefuge(createRefuge(entry), saved.order as RefugeOrder); } catch { return null; }
}
