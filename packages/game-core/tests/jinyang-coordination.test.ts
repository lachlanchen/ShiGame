import { describe, expect, it } from "vitest";
import { resolveJinyangCoordination as resolve, type CoordinationSituation } from "../src/jinyang-coordination";

const ready = (): CoordinationSituation => ({
  version: 1, operationWindow: 4, cityHoldsUntil: 5, diversionReadyAt: 3,
  enemyWatch: 1, withdrawal: null, peopleAtRisk: 100,
  allies: {
    han: { futureThreat: 5, disclosureRisk: 1, unilateralRisk: 7, receivedProposal: true,
      receivedPartnerCommitment: true, agreedWindow: 4, forceReadyAt: 3 },
    wei: { futureThreat: 5, disclosureRisk: 2, unilateralRisk: 7, receivedProposal: true,
      receivedPartnerCommitment: true, agreedWindow: 4, forceReadyAt: 4 },
  },
});

describe("Jinyang coordination design experiment", () => {
  it("resolves coordinated action with continuing obligations, not a trust reset", () => {
    const result = resolve(ready());
    expect(result.outcome).toBe("coordinated-reversal");
    expect(result.settlementObligations).toEqual(["han", "wei"]);
  });

  it("shared fear alone does not make allies risk unilateral defection", () => {
    const s = ready();
    s.allies.han.receivedPartnerCommitment = false;
    s.allies.wei.receivedPartnerCommitment = false;
    const result = resolve(s);
    expect(result.outcome).toBe("isolated-defeat");
    expect(result.allies.han.reason).toBe("unsupported-risk");
    expect(result.allies.wei.decision).toBe("withhold");
  });

  it("one ally's receipt does not give the other omniscient knowledge", () => {
    const s = ready(); s.allies.wei.receivedPartnerCommitment = false;
    expect(resolve(s).allies.han.participates).toBe(true);
    expect(resolve(s).allies.wei.participates).toBe(false);
  });

  it("distinguishes willingness, matching time and actual readiness", () => {
    const s = ready(); s.allies.han.agreedWindow = 3; s.allies.wei.forceReadyAt = 5;
    const result = resolve(s);
    expect(result.allies.han.decision).toBe("conditional");
    expect(result.allies.han.executionIssue).toBe("wrong-window");
    expect(result.allies.wei.decision).toBe("conditional");
    expect(result.allies.wei.executionIssue).toBe("not-ready");
  });

  it("enemy vigilance changes the coalition even when its shared threat is unchanged", () => {
    const s = ready(); s.enemyWatch = 3;
    expect(resolve(s).allies.han.participates).toBe(true);
    expect(resolve(s).allies.wei.reason).toBe("exposure-outweighs-interest");
    expect(resolve(s).outcome).toBe("isolated-defeat");
  });

  it("losing the operation can carry a costly prepared withdrawal into the ending", () => {
    const s = ready(); s.allies.wei.forceReadyAt = 5;
    s.withdrawal = { readyAt: 3, capacity: 60 };
    const result = resolve(s);
    expect(result.outcome).toBe("costly-withdrawal");
    expect(result.evacuated).toBe(60);
    expect(result.leftBehind).toBe(40);
    expect(result.settlementObligations).toEqual([]);
  });

  it("does not create an evacuation route after the city deadline", () => {
    const s = ready(); s.operationWindow = 6; s.withdrawal = { readyAt: 6, capacity: 100 };
    expect(resolve(s).outcome).toBe("isolated-defeat");
    expect(resolve(s).evacuated).toBe(0);
    s.withdrawal.readyAt = 3;
    expect(resolve(s).evacuated).toBe(0); // Earlier preparation cannot reverse an expired deadline.
  });

  it("cannot win without the diversion or beyond the endurance deadline", () => {
    const s = ready(); s.diversionReadyAt = null;
    expect(resolve(s).outcome).toBe("isolated-defeat");
    s.diversionReadyAt = 3; s.cityHoldsUntil = 3;
    expect(resolve(s).outcome).toBe("isolated-defeat");
  });

  it("replays identically and never mutates prepared scene facts", () => {
    const s = ready(); const before = JSON.stringify(s);
    const result = resolve(s);
    expect(JSON.stringify(s)).toBe(before);
    expect(resolve(JSON.parse(before))).toEqual(result);
  });

  it("rejects invalid numerical state and absent ally records", () => {
    for (const value of [NaN, Infinity, -1, 1.5]) {
      const s = ready(); s.operationWindow = value;
      expect(() => resolve(s)).toThrow();
    }
    const s = ready(); delete (s.allies as Partial<typeof s.allies>).han;
    expect(() => resolve(s)).toThrow("Missing ally han");
  });
});
