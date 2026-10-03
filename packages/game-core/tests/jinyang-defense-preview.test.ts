import { describe, expect, it } from "vitest";
import v1 from "../../../content/encounters/jinyang.v1.json";
import v2 from "../../../content/encounters/jinyang.v2.json";
import {
  createJinyang, commitJinyang, previewJinyangDefense, exportJinyangSave, restoreJinyang,
  type JinyangDefinition, type JinyangCommandId,
} from "../src/jinyang-encounter";

for (const raw of [v1, v2]) {
  const d = raw as JinyangDefinition;
  describe(`Jinyang v${d.schemaVersion} in-world defense preview`, () => {
    it("lets the player compare competing work without performing any order", () => {
      const before = createJinyang(d), snapshot = JSON.stringify(before);
      const wall = previewJinyangDefense(d, before, "brace")!;
      const breach = previewJinyangDefense(d, before, "diversion")!;
      const exit = previewJinyangDefense(d, before, "escape")!;
      expect(wall.tick).toBe(1);
      expect(wall.treasury).toBe(37);
      expect(wall.situation.cityHoldsUntil - wall.tick).toBe(15);
      expect(breach.tick).toBe(2);
      expect(breach.treasury).toBe(35);
      expect(breach.situation.enemyWatch).toBe(1);
      expect(breach.situation.diversionReadyAt).toBe(2);
      expect(exit.situation.withdrawal).toEqual({ readyAt: 2, capacity: 60 });
      expect(exit.treasury).toBe(36);
      expect(JSON.stringify(before)).toBe(snapshot);
      // UI consumers cannot mutate the player's current state via their preview.
      exit.situation.allies.han.receivedProposal = true;
      expect(before.situation.allies.han.receivedProposal).toBe(false);
    });

    it("uses current versioned costs and not hard-coded UI estimates", () => {
      const changed = structuredClone(d);
      changed.parameters.braceExtension = 7;
      changed.commands.find(c => c.id === "brace")!.cost = 9;
      const before = createJinyang(changed);
      const after = previewJinyangDefense(changed, before, "brace")!;
      expect(after.treasury).toBe(31);
      expect(after.situation.cityHoldsUntil).toBe(19);
      expect(after).toEqual(commitJinyang(changed, before, "brace"));
    });

    it("charges exactly once when the selected work is dispatched and resumed", () => {
      let s = createJinyang(d);
      for (const id of ["brace", "escape", "diversion"] as JinyangCommandId[]) {
        const before = exportJinyangSave(s);
        const preview = previewJinyangDefense(d, s, id)!;
        expect(exportJinyangSave(s)).toBe(before);
        s = commitJinyang(d, s, id);
        expect(s).toEqual(preview);
        expect(restoreJinyang(d, exportJinyangSave(s))).toEqual(s);
        expect(previewJinyangDefense(d, s, id)).toBeNull();
      }
      expect(s.history).toEqual(["brace", "escape", "diversion"]);
      expect(s.treasury).toBe(28);
    });

    it("discloses a deadline ending instead of promising a usable new preparation", () => {
      const urgent = structuredClone(d);
      urgent.parameters.cityDeadline = 1;
      const before = createJinyang(urgent);
      expect(previewJinyangDefense(urgent, before, "diversion")!.result?.outcome).toBe("isolated-defeat");
      expect(previewJinyangDefense(urgent, before, "brace")!.result).toBeNull();
      expect(before.result).toBeNull();
    });

    it("does not offer unavailable jobs, tactical predictions or work after the ending", () => {
      let s = createJinyang(d);
      expect(previewJinyangDefense(d, s, "execute")).toBeNull();
      expect(previewJinyangDefense(d, s, "quiet-han")).toBeNull();
      s = commitJinyang(d, s, "escape");
      s = commitJinyang(d, s, "withdraw");
      expect(previewJinyangDefense(d, s, "brace")).toBeNull();
      const poor = structuredClone(d);
      poor.parameters.treasury = 2;
      expect(previewJinyangDefense(poor, createJinyang(poor), "brace")).toBeNull();
    });
  });
}
