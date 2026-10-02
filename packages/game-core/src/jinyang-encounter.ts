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
export const JINYANG_OPERATION_COMMAND_IDS = ["screen-embankment", "rush-embankment", "open-water", "commit-reserve", "hold-front", "press-attack"] as const;
export const JINYANG_OPERATION_KEYS = ["watchThreshold", "screenLoss", "disruptedLoss", "reserveLoss", "quickAssaultLoss", "heldAssaultLoss", "minimumReserve"] as const;
export type JinyangCommandId = typeof JINYANG_COMMAND_IDS[number] | typeof JINYANG_OPERATION_COMMAND_IDS[number];
export interface JinyangDefinition {
  schemaVersion: 1 | 2;
  id: string;
  parameters: Record<typeof JINYANG_PARAMETER_KEYS[number], number>;
  commands: { id: string; site: string; time: number; cost: number; watch: number; label: Record<string, string> }[];
  operation?: Record<typeof JINYANG_OPERATION_KEYS[number], number>;
}
export interface JinyangOperation {
  phase: "deployment" | "breach" | "disrupted" | "assault" | "resolved";
  approach: "none" | "screen" | "rush";
  enemy: "guard" | "reinforced" | "counterattack" | "disordered" | "encircled";
  reserve: "ready" | "committed";
  waterOpen: boolean;
  frontHeld: boolean;
  losses: number;
  round: number;
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
  revision: 1 | 2;
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
  operation?: JinyangOperation | null;
}
const integer = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 1000;

export function jinyangFingerprint(d: JinyangDefinition): string {
  if (![1, 2].includes(d.schemaVersion) || d.id !== "jinyang-encounter-v" + d.schemaVersion
      || JINYANG_PARAMETER_KEYS.some(key => !integer(d.parameters[key]))
      || d.parameters.people < 1 || d.parameters.force < 1
      || d.commands.length !== jinyangCommandIds(d).length) throw Error("Invalid Jinyang definition");
  const parts: string[] = [d.id, String(d.schemaVersion)];
  for (const key of JINYANG_PARAMETER_KEYS) parts.push(key + "=" + d.parameters[key]);
  if (d.schemaVersion === 2) for (const key of JINYANG_OPERATION_KEYS) {
    if (!d.operation || !integer(d.operation[key])) throw Error("Invalid Jinyang operation parameter");
    parts.push(key + "=" + d.operation[key]);
  }
  for (const id of jinyangCommandIds(d)) {
    const matches = d.commands.filter(c => c.id === id);
    if (matches.length !== 1) throw Error("Invalid Jinyang command set");
    const c = matches[0]!;
    if (![c.time, c.cost, c.watch].every(integer)) throw Error("Invalid Jinyang command cost");
    if (JINYANG_OPERATION_COMMAND_IDS.includes(id as typeof JINYANG_OPERATION_COMMAND_IDS[number]) && (c.time || c.watch))
      throw Error("Operation rounds must not alter the agreed strategic window");
    parts.push(id + "=" + c.time + "," + c.cost + "," + c.watch);
  }
  return parts.join("|");
}
export function jinyangCommandIds(d: JinyangDefinition): readonly JinyangCommandId[] {
  return d.schemaVersion === 2 ? [...JINYANG_COMMAND_IDS, ...JINYANG_OPERATION_COMMAND_IDS] : JINYANG_COMMAND_IDS;
}

export function createJinyang(d: JinyangDefinition): JinyangState {
  const p = d.parameters;
  return {
    revision: d.schemaVersion, definitionFingerprint: jinyangFingerprint(d), history: [], tick: 0,
    treasury: p.treasury, force: p.force, braced: false, diversion: false, exit: false,
    relayed: false, window: null, missions: { han: null, wei: null }, result: null, estate: null,
    ...(d.schemaVersion === 2 ? { operation: null } : {}),
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
  return jinyangCommandIds(d).filter(id => {
    const c = d.commands.find(c => c.id === id)!;
    if (c.cost > s.treasury || (id.startsWith("escort-") && s.force < d.parameters.escortForce)) return false;
    if (s.operation) {
      const op = s.operation;
      if (id === "withdraw") return s.exit;
      if (op.phase === "deployment") return id === "rush-embankment"
        || (id === "screen-embankment" && s.force >= d.operation!.minimumReserve);
      if (op.phase === "breach") return id === "open-water";
      if (op.phase === "disrupted") return id === "press-attack"
        || (id === "commit-reserve" && op.reserve === "ready" && s.force >= d.operation!.minimumReserve);
      if (op.phase === "assault") return id === "press-attack" || (id === "hold-front" && !op.frontHeld);
      return false;
    }
    if (!JINYANG_COMMAND_IDS.includes(id as typeof JINYANG_COMMAND_IDS[number])) return false;
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
  if (s.operation) {
    performOperation(d, s, id);
    return s;
  }
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
    const resolution = resolveJinyangCoordination(s.situation);
    if (id === "execute" && d.schemaVersion === 2 && resolution.outcome === "coordinated-reversal") {
      s.operation = { phase: "deployment", approach: "none",
        enemy: s.situation.enemyWatch >= d.operation!.watchThreshold ? "reinforced" : "guard",
        reserve: "ready", waterOpen: false, frontHeld: false, losses: 0, round: 0 };
    } else finishJinyang(s, resolution);
  }
  return s;
}

function finishJinyang(s: JinyangState, result: CoordinationResult): void {
    s.result = result;
    if (s.operation) s.operation.phase = "resolved";
    const won = result.outcome === "coordinated-reversal";
    const survived = result.outcome === "costly-withdrawal";
    s.estate = {
      landClaims: won ? ["zhi-settlement-claim"] : [], treasury: won || survived ? s.treasury : 0,
      survivingForce: won ? s.force : survived ? Math.min(s.force, s.result.evacuated) : 0,
      office: won ? "zhao-command" : survived ? "displaced-command" : "lost-command",
      contacts: (["han", "wei"] as const).filter(ally => !!s.missions[ally]),
      obligations: [...s.result.settlementObligations], household: [],
    };
}

/** Tactical rounds unfold within the agreed operation window. Inspection costs no round. */
function performOperation(d: JinyangDefinition, s: JinyangState, id: JinyangCommandId): void {
  const op = s.operation!, p = d.operation!;
  op.round++;
  const lose = (amount: number) => { const n = Math.min(s.force, amount); s.force -= n; op.losses += n; };
  if (id === "screen-embankment" || id === "rush-embankment") {
    op.approach = id === "screen-embankment" ? "screen" : "rush";
    op.reserve = op.approach === "screen" ? "committed" : "ready";
    op.phase = "breach";
  } else if (id === "open-water") {
    if (op.approach === "rush" && op.enemy === "reinforced") {
      lose(p.disruptedLoss); op.phase = "disrupted"; op.enemy = "counterattack";
    } else {
      if (op.approach === "screen") lose(p.screenLoss);
      op.waterOpen = true; op.phase = "assault"; op.enemy = "disordered";
    }
  } else if (id === "commit-reserve") {
    lose(p.reserveLoss); op.reserve = "committed";
    op.waterOpen = true; op.phase = "assault"; op.enemy = "disordered";
  } else if (id === "hold-front") {
    op.frontHeld = true; op.enemy = "encircled";
  } else if (id === "press-attack" || id === "withdraw") {
    const situation = structuredClone(s.situation);
    if (!op.waterOpen || id === "withdraw") situation.diversionReadyAt = null;
    // An attack into an intact line loses the position; only an explicit exit order uses the fallback.
    if (id === "press-attack" && !op.waterOpen) situation.withdrawal = null;
    if (id === "press-attack" && op.waterOpen) lose(op.frontHeld ? p.heldAssaultLoss : p.quickAssaultLoss);
    const result = resolveJinyangCoordination(situation);
    if (op.waterOpen) {
      result.diversionExecuted = true;
      result.reasons = result.reasons.filter(reason => reason !== "diversion-unavailable");
    }
    result.reasons.push(id === "withdraw" ? "operation-withdrawal"
      : !op.waterOpen ? "breach-not-open" : op.frontHeld ? "flanks-arrived" : "front-rushed");
    finishJinyang(s, result);
  }
}

export function exportJinyangSave(s: JinyangState): string {
  return JSON.stringify({ revision: s.revision, definitionFingerprint: s.definitionFingerprint, history: s.history });
}

export function restoreJinyang(d: JinyangDefinition, save: string): JinyangState {
  if (save.length > 16384) throw Error("Jinyang save too large");
  const parsed = JSON.parse(save) as Record<string, unknown>;
  if (!parsed || parsed.revision !== d.schemaVersion || parsed.definitionFingerprint !== jinyangFingerprint(d)
      || !Array.isArray(parsed.history) || parsed.history.length > 32
      || Object.keys(parsed).some(k => !["revision", "definitionFingerprint", "history"].includes(k)))
    throw Error("Invalid Jinyang save");
  let s = createJinyang(d);
  for (const id of parsed.history) {
    if (typeof id !== "string" || !jinyangCommandIds(d).includes(id as JinyangCommandId))
      throw Error("Unknown Jinyang order");
    s = commitJinyang(d, s, id as JinyangCommandId);
  }
  return s;
}
