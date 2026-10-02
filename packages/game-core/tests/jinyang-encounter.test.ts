import { describe, expect, it } from "vitest";
import definition from "../../../content/encounters/jinyang.v1.json";
import {
  createJinyang, commitJinyang, availableJinyangCommands, exportJinyangSave, restoreJinyang,
  type JinyangDefinition, type JinyangCommandId,
} from "../src/jinyang-encounter";
const d = definition as JinyangDefinition;
const play = (commands: JinyangCommandId[]) =>
  commands.reduce((s, c) => commitJinyang(d, s, c), createJinyang(d));

export const quiet: JinyangCommandId[] = ["brace", "diversion", "quiet-han", "quiet-wei", "relay", "aligned-date", "execute"];
export const fast: JinyangCommandId[] = ["diversion", "escort-han", "escort-wei", "relay", "aligned-date", "execute"];
describe("performed Jinyang orders", () => {
  it("supports two winning plans with different time, wealth and surviving force", () => {
    const a = play(quiet), b = play(fast);
    expect(a.result?.outcome).toBe("coordinated-reversal");
    expect(b.result?.outcome).toBe("coordinated-reversal");
    expect(a.tick).toBeGreaterThan(b.tick);
    expect(a.estate?.survivingForce).toBe(100);
    expect(b.estate?.survivingForce).toBe(80);
    expect(a.estate?.treasury).not.toBe(b.estate?.treasury);
    expect(a.estate?.landClaims).toEqual(["zhi-settlement-claim"]);
    expect(a.estate?.household).toEqual([]);
  });
  it("requires actual contact, pledge relay and date agreement", () => {
    let s = createJinyang(d);
    expect(availableJinyangCommands(d, s)).not.toContain("relay");
    expect(() => commitJinyang(d, s, "execute")).toThrow();
    s = commitJinyang(d, s, "quiet-han");
    expect(s.situation.allies.wei.receivedProposal).toBe(false);
    expect(s.situation.allies.han.receivedPartnerCommitment).toBe(false);
    expect(() => commitJinyang(d, s, "escort-han")).toThrow();
  });
  it("keeps late Wei readiness separate from Han's agreement", () => {
    const s = play(["diversion", "quiet-han", "quiet-wei", "relay", "early-date", "execute"]);
    expect(s.result?.allies.han.participates).toBe(true);
    expect(s.result?.allies.wei.executionIssue).toBe("not-ready");
    expect(s.result?.outcome).toBe("isolated-defeat");
  });
  it("allows a corrected date before the final operation", () => {
    const s = play(["brace", "diversion", "quiet-han", "quiet-wei", "relay", "early-date", "aligned-date", "execute"]);
    expect(s.result?.outcome).toBe("coordinated-reversal");
  });
  it("carries a prepared, capacity-limited withdrawal into the estate", () => {
    const s = play(["escape", "quiet-han", "withdraw"]);
    expect(s.result?.outcome).toBe("costly-withdrawal");
    expect(s.result?.evacuated).toBe(60);
    expect(s.result?.leftBehind).toBe(40);
    expect(s.estate?.office).toBe("displaced-command");
    expect(s.estate?.contacts).toEqual(["han"]);
    expect(s.estate?.landClaims).toEqual([]);
  });
  it("cannot repeat preparation, spend inspection time or issue orders after an ending", () => {
    const start = createJinyang(d), snapshot = JSON.stringify(start);
    availableJinyangCommands(d, start);
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(() => commitJinyang(d, play(["diversion"]), "diversion")).toThrow();
    expect(availableJinyangCommands(d, play(quiet))).toEqual([]);
    expect(() => commitJinyang(d, play(quiet), "wait")).toThrow();
  });
  it("replays every prefix, including ending, without trusting a serialized estate", () => {
    for (const route of [quiet, fast, ["escape", "withdraw"] as JinyangCommandId[]]) {
      let s = createJinyang(d);
      for (const c of route) {
        s = commitJinyang(d, s, c);
        expect(restoreJinyang(d, exportJinyangSave(s))).toEqual(s);
      }
    }
    const s = play(quiet);
    expect(() => restoreJinyang(d, JSON.stringify({ ...JSON.parse(exportJinyangSave(s)), estate: { treasury: 999 } }))).toThrow();
    expect(() => restoreJinyang(d, JSON.stringify({ ...JSON.parse(exportJinyangSave(s)), history: ["relay"] }))).toThrow();
  });
  it("rejects changed parameters or costs even with the same encounter id", () => {
    const s = play(["brace"]);
    const changed = structuredClone(d);
    changed.parameters.cityDeadline++;
    expect(() => restoreJinyang(changed, exportJinyangSave(s))).toThrow();
    const costs = structuredClone(d);
    costs.commands[0]!.cost++;
    expect(() => restoreJinyang(costs, exportJinyangSave(s))).toThrow();
  });
  it("does not mutate inputs or refill the treasury on replay", () => {
    const s = createJinyang(d), before = JSON.stringify(s);
    const after = commitJinyang(d, s, "brace");
    expect(JSON.stringify(s)).toBe(before);
    expect(after.treasury).toBe(d.parameters.treasury - 3);
    expect(restoreJinyang(d, exportJinyangSave(after)).treasury).toBe(after.treasury);
  });
  it("ends an expired position instead of leaving the player with no legal order", () => {
    const s = play(["diversion", "quiet-han", "quiet-wei", "relay", "early-date", "aligned-date", "wait"]);
    expect(s.result?.outcome).toBe("isolated-defeat");
    expect(s.result?.reasons).toContain("city-deadline-missed");
    expect(s.estate?.office).toBe("lost-command");
    expect(restoreJinyang(d, exportJinyangSave(s))).toEqual(s);
  });
});
