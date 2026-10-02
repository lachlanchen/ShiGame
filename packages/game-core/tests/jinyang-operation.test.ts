import { describe, expect, it } from "vitest";
import legacy from "../../../content/encounters/jinyang.v1.json";
import definition from "../../../content/encounters/jinyang.v2.json";
import { createJinyang, commitJinyang, availableJinyangCommands, exportJinyangSave, restoreJinyang,
  type JinyangDefinition, type JinyangCommandId } from "../src/jinyang-encounter";
const d = definition as JinyangDefinition;
const quiet: JinyangCommandId[] = ["brace","diversion","quiet-han","quiet-wei","relay","aligned-date","execute"];
const exposed: JinyangCommandId[] = ["diversion","escort-han","escort-wei","relay","aligned-date","execute"];
const play = (ids: JinyangCommandId[], contract = d) => ids.reduce((s,id)=>commitJinyang(contract,s,id),createJinyang(contract));
describe("Jinyang interactive operation", () => {
  it("launches coordinated forces without awarding a victory or estate before action", () => {
    const s=play(quiet);
    expect(s.operation?.phase).toBe("deployment"); expect(s.operation?.enemy).toBe("guard");
    expect(s.result).toBeNull(); expect(s.estate).toBeNull();
    expect(availableJinyangCommands(d,s)).toEqual(["screen-embankment","rush-embankment"]);
    expect(()=>commitJinyang(d,s,"execute")).toThrow();
    expect(()=>commitJinyang(d,s,"press-attack")).toThrow();
  });
  it("exposure visibly changes the guard; a screened breach and quiet rush can both succeed", () => {
    expect(play(exposed).operation?.enemy).toBe("reinforced");
    const a=play([...quiet,"rush-embankment","open-water","press-attack"]);
    const b=play([...exposed,"screen-embankment","open-water","hold-front","press-attack"]);
    expect(a.result?.outcome).toBe("coordinated-reversal");
    expect(b.result?.outcome).toBe("coordinated-reversal");
    expect(a.estate?.survivingForce).toBe(90); expect(b.estate?.survivingForce).toBe(72);
    expect(b.estate?.treasury).toBe(15);
    expect(b.estate?.obligations).toEqual(["han","wei"]);
  });
  it("allows an exposed rush to fail locally and recover using the retained reserve", () => {
    const setback=play([...exposed,"rush-embankment","open-water"]);
    expect(setback.operation).toMatchObject({phase:"disrupted",enemy:"counterattack",waterOpen:false,losses:12});
    expect(setback.force).toBe(68); expect(setback.result).toBeNull();
    const recovered=commitJinyang(d,setback,"commit-reserve");
    expect(recovered.operation).toMatchObject({phase:"assault",waterOpen:true,reserve:"committed",losses:20});
    const ending=commitJinyang(d,commitJinyang(d,recovered,"hold-front"),"press-attack");
    expect(ending.estate?.survivingForce).toBe(56);
    expect(ending.result?.reasons).toContain("flanks-arrived");
    expect(ending.tick).toBe(setback.tick); // Tactical rounds share the agreed date.
  });
  it("an attack into the intact line fails; an explicit prepared withdrawal preserves a remnant", () => {
    const prefix: JinyangCommandId[]=["brace","escape",...exposed,"rush-embankment","open-water"];
    const defeat=play([...prefix,"press-attack"]), exit=play([...prefix,"withdraw"]);
    expect(defeat.result?.outcome).toBe("isolated-defeat");
    expect(defeat.result?.reasons).toContain("breach-not-open"); expect(defeat.estate?.survivingForce).toBe(0);
    expect(exit.estate).toMatchObject({survivingForce:60,office:"displaced-command",landClaims:[],obligations:[]});
    expect(exit.result?.reasons).toContain("operation-withdrawal");
  });
  it("holds Zhao's front for independent allied movement at a real reserve cost", () => {
    const s=play([...quiet,"rush-embankment","open-water"]);
    const immediate=commitJinyang(d,s,"press-attack");
    const hold=commitJinyang(d,s,"hold-front");
    expect(hold.treasury).toBe(s.treasury-2);
    expect(hold.operation?.enemy).toBe("encircled");
    expect(()=>commitJinyang(d,hold,"hold-front")).toThrow();
    expect(commitJinyang(d,hold,"press-attack").force).toBeGreaterThan(immediate.force);
  });
  it("retains an opened breach when the player subsequently breaks contact", () => {
    const s=play(["brace","escape",...exposed,"screen-embankment","open-water","withdraw"]);
    expect(s.result?.outcome).toBe("costly-withdrawal");
    expect(s.result?.diversionExecuted).toBe(true);
    expect(s.result?.reasons).not.toContain("diversion-unavailable");
    expect(s.operation?.waterOpen).toBe(true);
  });
  it("preserves each intermediate battle state, losses and choices through replay", () => {
    let s=createJinyang(d);
    for(const id of [...exposed,"rush-embankment","open-water","commit-reserve","hold-front","press-attack"] as JinyangCommandId[]) {
      const before=JSON.stringify(s); const next=commitJinyang(d,s,id);
      expect(JSON.stringify(s)).toBe(before); s=next;
      expect(restoreJinyang(d,exportJinyangSave(s))).toEqual(s);
    }
    expect(availableJinyangCommands(d,s)).toEqual([]);
    expect(()=>restoreJinyang(d,JSON.stringify({...JSON.parse(exportJinyangSave(s)),operation:{losses:0}}))).toThrow();
  });
  it("keeps legacy outcomes under their own rules and rejects silent cross-version loading", () => {
    const v1=legacy as JinyangDefinition, old=play(quiet,v1), fresh=play(quiet);
    expect(old.estate?.survivingForce).toBe(100); expect(old.operation).toBeUndefined();
    expect(restoreJinyang(v1,exportJinyangSave(old))).toEqual(old);
    expect(()=>restoreJinyang(d,exportJinyangSave(old))).toThrow();
    expect(()=>restoreJinyang(v1,exportJinyangSave(fresh))).toThrow();
    const changed=structuredClone(d); changed.operation!.disruptedLoss++;
    expect(()=>restoreJinyang(changed,exportJinyangSave(fresh))).toThrow();
  });
});
