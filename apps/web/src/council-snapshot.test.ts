import { describe, expect, it } from "vitest";
import { createCouncil, resolveCouncil, restoreCouncil, type CouncilDefinition } from "@shi/game-core";
import raw from "../../../content/councils/chen-council.v1.json";
import rawFingerprint from "./generated/chen-council.v1.sha256?raw";
import { councilSnapshotMatchesRevision, encodeCouncilSnapshot } from "./council-snapshot";

const definition = raw as CouncilDefinition;
const fingerprint = rawFingerprint.trim();
const initial = createCouncil(definition, { id: "snapshot-test", arrival: "divided" });
const state = resolveCouncil(definition, initial, "defer-title");

describe("council snapshot revision", () => {
  it("binds saved decisions to exact content without changing the deterministic state", () => {
    const before = JSON.stringify(state);
    const saved = JSON.parse(encodeCouncilSnapshot(state, fingerprint));
    expect(saved.definitionSHA256).toBe(fingerprint);
    expect(councilSnapshotMatchesRevision(saved, fingerprint)).toBe(true);
    expect(restoreCouncil(definition, state.entry, saved)).toEqual(state);
    expect(JSON.stringify(state)).toBe(before);
    expect(councilSnapshotMatchesRevision(saved, "0".repeat(64))).toBe(false);
  });

  it("permits untagged first-revision development saves only against that same revision", () => {
    const legacy = JSON.parse(JSON.stringify(state));
    expect(councilSnapshotMatchesRevision(legacy, fingerprint)).toBe(true);
    expect(restoreCouncil(definition, state.entry, legacy)).toEqual(state);
    expect(councilSnapshotMatchesRevision(legacy, "0".repeat(64))).toBe(false);
    expect(Object.hasOwn(legacy, "definitionSHA256")).toBe(false);
    expect(councilSnapshotMatchesRevision({ ...legacy, definitionId: "another-council" }, fingerprint)).toBe(false);
  });

  it("does not treat invalid or explicit mismatched fingerprints as legacy saves", () => {
    for (const value of [null, [], {}, { ...state, definitionSHA256: null }, { ...state, definitionSHA256: "" }, { ...state, definitionSHA256: "0".repeat(64) }]) {
      expect(councilSnapshotMatchesRevision(value, fingerprint)).toBe(false);
    }
    for (const hash of ["", "unknown", fingerprint.toUpperCase()]) {
      expect(councilSnapshotMatchesRevision(state, hash)).toBe(false);
      expect(() => encodeCouncilSnapshot(state, hash)).toThrow("fingerprint");
    }
  });
});
