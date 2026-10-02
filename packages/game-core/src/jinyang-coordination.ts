/**
 * Jinyang design experiment, not a released encounter or a historical simulation.
 * Tongjian I motivates shared threat / disclosure fear / coordinated timing.
 * Numerical incentives, messages and route capacity are gameplay reconstruction.
 * The scene supplies facts; this module never commands Han or Wei for the player.
 */
export type AllyId = "han" | "wei";
export type AllyDecision = "stay" | "withhold" | "conditional";

export interface AllyPosition {
  /** Abstract design units: these are not measurements of historical people. */
  futureThreat: number;
  disclosureRisk: number;
  unilateralRisk: number;
  /** What this ally has actually received, not omniscient player knowledge. */
  receivedProposal: boolean;
  receivedPartnerCommitment: boolean;
  agreedWindow: number | null;
  forceReadyAt: number;
}

export interface CoordinationSituation {
  version: 1;
  operationWindow: number;
  cityHoldsUntil: number;
  diversionReadyAt: number | null;
  /** Changes exposure cost; independent of an ally's desire to remove Zhi. */
  enemyWatch: number;
  withdrawal: { readyAt: number; capacity: number } | null;
  peopleAtRisk: number;
  allies: Record<AllyId, AllyPosition>;
}

export interface AllyResponse {
  decision: AllyDecision;
  reason: "no-contact" | "exposure-outweighs-interest" | "unsupported-risk" | "conditional-agreement";
  participates: boolean;
  /** Failure to arrive is different from refusing or changing sides. */
  executionIssue: "not-committed" | "wrong-window" | "not-ready" | null;
}

export interface CoordinationResult {
  outcome: "coordinated-reversal" | "costly-withdrawal" | "isolated-defeat";
  allies: Record<AllyId, AllyResponse>;
  cityHeld: boolean;
  diversionExecuted: boolean;
  evacuated: number;
  leftBehind: number;
  /** Creditor identities, not arbitrary positive trust points. */
  settlementObligations: AllyId[];
  reasons: string[];
}

const allyIds: AllyId[] = ["han", "wei"];
const natural = (value: number, label: string) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${label}`);
};

function validate(s: CoordinationSituation): void {
  if (s.version !== 1) throw new Error("Unsupported coordination version");
  for (const key of ["operationWindow", "cityHoldsUntil", "enemyWatch", "peopleAtRisk"] as const) natural(s[key], key);
  if (s.diversionReadyAt !== null) natural(s.diversionReadyAt, "diversionReadyAt");
  if (s.withdrawal !== null) {
    natural(s.withdrawal.readyAt, "withdrawal.readyAt");
    natural(s.withdrawal.capacity, "withdrawal.capacity");
  }
  for (const id of allyIds) {
    const a = s.allies[id];
    if (!a) throw new Error(`Missing ally ${id}`);
    for (const key of ["futureThreat", "disclosureRisk", "unilateralRisk", "forceReadyAt"] as const) natural(a[key], `${id}.${key}`);
    if (a.agreedWindow !== null) natural(a.agreedWindow, `${id}.agreedWindow`);
    for (const key of ["receivedProposal", "receivedPartnerCommitment"] as const) {
      if (typeof a[key] !== "boolean") throw new Error(`Invalid ${id}.${key}`);
    }
    if (a.disclosureRisk + s.enemyWatch > Number.MAX_SAFE_INTEGER) throw new Error("Exposure overflow");
  }
}

/** Evaluate an ally using only its information and interests. */
function respond(a: AllyPosition, s: CoordinationSituation): AllyResponse {
  let reason: AllyResponse["reason"];
  if (!a.receivedProposal) reason = "no-contact";
  else if (a.futureThreat <= a.disclosureRisk + s.enemyWatch) reason = "exposure-outweighs-interest";
  else if (!a.receivedPartnerCommitment && a.futureThreat <= a.unilateralRisk) reason = "unsupported-risk";
  else reason = "conditional-agreement";
  const decision: AllyDecision = reason === "no-contact" || reason === "exposure-outweighs-interest"
    ? "stay" : reason === "unsupported-risk" ? "withhold" : "conditional";
  const executionIssue = decision !== "conditional" ? "not-committed"
    : a.agreedWindow !== s.operationWindow ? "wrong-window"
      : a.forceReadyAt > s.operationWindow ? "not-ready" : null;
  return { decision, reason, participates: executionIssue === null, executionIssue };
}

/**
 * Resolve from immutable prepared facts. A movie finishing cannot call this with
 * different facts or make an unready ally participate. Withdrawal is a prepared
 * fallback, not a free rescue; its capacity and departure deadline are binding.
 */
export function resolveJinyangCoordination(s: CoordinationSituation): CoordinationResult {
  validate(s);
  const allies = { han: respond(s.allies.han, s), wei: respond(s.allies.wei, s) };
  const cityHeld = s.operationWindow <= s.cityHoldsUntil;
  const diversionExecuted = cityHeld && s.diversionReadyAt !== null && s.diversionReadyAt <= s.operationWindow;
  const coordinated = diversionExecuted && allyIds.every(id => allies[id].participates);
  const canWithdraw = !coordinated && cityHeld && s.withdrawal !== null
    && s.withdrawal.readyAt <= s.operationWindow
    && s.withdrawal.capacity > 0;
  const evacuated = canWithdraw ? Math.min(s.peopleAtRisk, s.withdrawal!.capacity) : 0;
  const reasons: string[] = [];
  if (!cityHeld) reasons.push("city-deadline-missed");
  if (!diversionExecuted) reasons.push("diversion-unavailable");
  for (const id of allyIds) if (!allies[id].participates) reasons.push(`${id}:${allies[id].executionIssue}`);
  if (canWithdraw) reasons.push("prepared-withdrawal-used");
  return {
    outcome: coordinated ? "coordinated-reversal" : evacuated > 0 ? "costly-withdrawal" : "isolated-defeat",
    allies, cityHeld, diversionExecuted, evacuated,
    leftBehind: coordinated ? 0 : s.peopleAtRisk - evacuated,
    settlementObligations: coordinated ? allyIds.filter(id => allies[id].participates) : [],
    reasons,
  };
}
