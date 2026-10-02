import { resolveJinyangCoordination, type CoordinationResult, type CoordinationSituation } from "./jinyang-coordination";

export const JINYANG_PARAMETER_KEYS = [
  "cityDeadline", "people", "treasury", "force", "braceExtension", "withdrawalCapacity",
  "escortForce", "hanThreat", "weiThreat", "hanRisk", "weiRisk", "unilateralRisk",
  "hanPreparation", "weiPreparation",
] as const;
export const JINYANG_COMMAND_IDS = [
  "brace", "diversion", "escape", "quiet-han", "quiet-wei", "escort-han", "escort-wei",
  "relay", "early-date", "aligned-date", "wait", "execute", "withdraw",
] as const;
export type JinyangCommandId = typeof JINYANG_COMMAND_IDS[number];
export interface JinyangDefinition {
  schemaVersion: 1;
  id: string;
  parameters: Record<typeof JINYANG_PARAMETER_KEYS[number], number>;
  commands: { id: string; site: string; time: number; cost: number; watch: number; label: Record<string, string> }[];
}
export interface JinyangEstate {
  landClaims: string[];
  treasury: number;
  survivingForce: number;
  office: "zhao-command" | "displaced-command" | "lost-command";
  contacts: ("han" | "wei")[];
  obligations: ("han" | "wei")[];
  household: never[]; // Chapter 2/3 must establish these; victory never awards partners.
}
export interface JinyangState {
  revision: 1;
  definitionFingerprint: string;
  history: JinyangCommandId[];
  tick: number;
  treasury: number;
  force: number;
  braced: boolean;
  diversion: boolean;
  exit: boolean;
  relayed: boolean;
  window: number | null;
  missions: { han: "quiet" | "escort" | null; wei: "quiet" | "escort" | null };
  situation: CoordinationSituation;
  result: CoordinationResult | null;
  estate: JinyangEstate | null;
}
const integer = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 1000;

export function jinyangFingerprint(d: JinyangDefinition): string {
  if (d.schemaVersion !== 1 || d.id !== "jinyang-encounter-v1"
      || JINYANG_PARAMETER_KEYS.some(key => !integer(d.parameters[key]))
      || d.parameters.people < 1 || d.parameters.force < 1
      || d.commands.length !== JINYANG_COMMAND_IDS.length) throw Error("Invalid Jinyang definition");
  const parts: string[] = [d.id, "1"];
  for (const key of JINYANG_PARAMETER_KEYS) parts.push(key + "=" + d.parameters[key]);
  for (const id of JINYANG_COMMAND_IDS) {
    const matches = d.commands.filter(c => c.id === id);
    if (matches.length !== 1) throw Error("Invalid Jinyang command set");
    const c = matches[0]!;
    if (![c.time, c.cost, c.watch].every(integer)) throw Error("Invalid Jinyang command cost");
    parts.push(id + "=" + c.time + "," + c.cost + "," + c.watch);
  }
  return parts.join("|");
}

export function createJinyang(d: JinyangDefinition): JinyangState {
  const p = d.parameters;
  return {
    revision: 1, definitionFingerprint: jinyangFingerprint(d), history: [], tick: 0,
    treasury: p.treasury, force: p.force, braced: false, diversion: false, exit: false,
    relayed: false, window: null, missions: { han: null, wei: null }, result: null, estate: null,
    situation: {
      version: 1, operationWindow: 0, cityHoldsUntil: p.cityDeadline,
      diversionReadyAt: null, enemyWatch: 0, withdrawal: null, peopleAtRisk: p.people,
      allies: {
        han: { futureThreat: p.hanThreat, disclosureRisk: p.hanRisk, unilateralRisk: p.unilateralRisk,
          receivedProposal: false, receivedPartnerCommitment: false, agreedWindow: null, forceReadyAt: 1000 },
        wei: { futureThreat: p.weiThreat, disclosureRisk: p.weiRisk, unilateralRisk: p.unilateralRisk,
          receivedProposal: false, receivedPartnerCommitment: false, agreedWindow: null, forceReadyAt: 1000 },
      },
    },
  };
}

/** Every performed order is replayed from the contract. Callers cannot supply a winning snapshot. */
export function availableJinyangCommands(d: JinyangDefinition, s: JinyangState): JinyangCommandId[] {
  if (s.definitionFingerprint !== jinyangFingerprint(d)) throw Error("Jinyang definition changed");
  if (s.result || s.history.length >= 32) return [];
  return JINYANG_COMMAND_IDS.filter(id => {
    const c = d.commands.find(c => c.id === id)!;
    if (c.cost > s.treasury || (id.startsWith("escort-") && s.force < d.parameters.escortForce)) return false;
    if (id === "execute") return s.window !== null;
    if (id === "withdraw") return s.exit;
    if (s.tick > s.situation.cityHoldsUntil) return false;
    if (id === "brace") return !s.braced && s.window === null;
    if (id === "diversion") return !s.diversion && s.window === null;
    if (id === "escape") return !s.exit && s.window === null;
    if (id.endsWith("-han")) return s.missions.han === null && s.window === null;
    if (id.endsWith("-wei")) return s.missions.wei === null && s.window === null;
    if (id === "relay") return !!s.missions.han && !!s.missions.wei && !s.relayed;
    if (id === "early-date" || id === "aligned-date")
      return s.relayed && !s.history.includes(id); // One reschedule is a recoverable mistake.
    return id === "wait" && s.window !== null && s.history.filter(c => c === "wait").length < 2;
  });
}

export function commitJinyang(d: JinyangDefinition, before: JinyangState, id: JinyangCommandId): JinyangState {
  if (!availableJinyangCommands(d, before).includes(id)) throw Error("Unavailable Jinyang order: " + id);
  const s = structuredClone(before);
  const c = d.commands.find(c => c.id === id)!;
  s.history.push(id);
  s.tick += c.time;
  s.treasury -= c.cost;
  s.situation.enemyWatch += c.watch;
  if (id === "brace") { s.braced = true; s.situation.cityHoldsUntil += d.parameters.braceExtension; }
  if (id === "diversion") { s.diversion = true; s.situation.diversionReadyAt = s.tick; }
  if (id === "escape") {
    s.exit = true;
    s.situation.withdrawal = { readyAt: s.tick, capacity: d.parameters.withdrawalCapacity };
  }
  for (const ally of ["han", "wei"] as const) {
    if (id === "quiet-" + ally || id === "escort-" + ally) {
      const escort = id.startsWith("escort-");
      s.missions[ally] = escort ? "escort" : "quiet";
      if (escort) s.force -= d.parameters.escortForce;
      s.situation.allies[ally].receivedProposal = true;
      s.situation.allies[ally].forceReadyAt = s.tick
        + d.parameters[ally === "han" ? "hanPreparation" : "weiPreparation"];
    }
  }
  if (id === "relay") {
    s.relayed = true;
    s.situation.allies.han.receivedPartnerCommitment = true;
    s.situation.allies.wei.receivedPartnerCommitment = true;
  }
  if (id === "early-date" || id === "aligned-date") {
    s.window = s.tick + (id === "early-date" ? 1 : 3);
    s.situation.operationWindow = s.window;
    const proposal = resolveJinyangCoordination(s.situation);
    for (const ally of ["han", "wei"] as const)
      s.situation.allies[ally].agreedWindow =
        proposal.allies[ally].decision === "conditional" ? s.window : null;
  }
  if (id === "execute" || id === "withdraw" || s.tick > s.situation.cityHoldsUntil) {
    // Time spent holding can miss the agreed window; a movie never repairs it.
    s.situation.operationWindow = Math.max(s.tick, s.window ?? s.tick);
    s.tick = s.situation.operationWindow;
    if (id === "withdraw") s.situation.diversionReadyAt = null;
    s.result = resolveJinyangCoordination(s.situation);
    const won = s.result.outcome === "coordinated-reversal";
    const survived = s.result.outcome === "costly-withdrawal";
    s.estate = {
      landClaims: won ? ["zhi-settlement-claim"] : [], treasury: won || survived ? s.treasury : 0,
      survivingForce: won ? s.force : survived ? Math.min(s.force, s.result.evacuated) : 0,
      office: won ? "zhao-command" : survived ? "displaced-command" : "lost-command",
      contacts: (["han", "wei"] as const).filter(ally => !!s.missions[ally]),
      obligations: [...s.result.settlementObligations], household: [],
    };
  }
  return s;
}

export function exportJinyangSave(s: JinyangState): string {
  return JSON.stringify({ revision: 1, definitionFingerprint: s.definitionFingerprint, history: s.history });
}

export function restoreJinyang(d: JinyangDefinition, save: string): JinyangState {
  if (save.length > 16384) throw Error("Jinyang save too large");
  const parsed = JSON.parse(save) as Record<string, unknown>;
  if (!parsed || parsed.revision !== 1 || parsed.definitionFingerprint !== jinyangFingerprint(d)
      || !Array.isArray(parsed.history) || parsed.history.length > 32
      || Object.keys(parsed).some(k => !["revision", "definitionFingerprint", "history"].includes(k)))
    throw Error("Invalid Jinyang save");
  let s = createJinyang(d);
  for (const id of parsed.history) {
    if (typeof id !== "string" || !JINYANG_COMMAND_IDS.includes(id as JinyangCommandId))
      throw Error("Unknown Jinyang order");
    s = commitJinyang(d, s, id as JinyangCommandId);
  }
  return s;
}
