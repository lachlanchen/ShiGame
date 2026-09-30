import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCouncil, councilCanChoose, resolveCouncil, createFanyang, encodeFanyangSnapshot,
  fanyangAnswers, fanyangCanChoose, fanyangGateChecks, fanyangMetricKeys, resolveFanyang, restoreFanyang,
  type CouncilDefinition, type CouncilState, type FanyangDefinition, type FanyangEntry, type FanyangState } from "../src";
import raw from "../../../content/councils/fanyang-guarantee.v1.json";
import chenRaw from "../../../content/councils/chen-council.v1.json";
import review from "../../../content/research/fanyang-entry-review.v1.json";

const definition = raw as FanyangDefinition;
const chen = chenRaw as CouncilDefinition;
const fingerprint = createHash("sha256").update(readFileSync(new URL("../../../content/councils/fanyang-guarantee.v1.json", import.meta.url))).digest("hex");
// Engine fixtures cover all 77 Chen routes. The separate entry tests verify
// these inputs against real completed chapters and canonical council hashes.
const entries: FanyangEntry[] = [];
for (const arrival of ["supplied", "pressed", "divided"] as const) {
  const visit = (state: CouncilState) => {
    if (state.completed) {
      entries.push({ version: 1, sceneId: definition.id, id: JSON.stringify([arrival, state.history]),
        councilDefinitionId: chen.id, councilSHA256: "a".repeat(64), origin: state.entry,
        choices: state.history.map(turn => turn.choiceId), metrics: state.metrics, outcome: state.outcome! });
      return;
    }
    for (const choice of chen.rounds[state.history.length]!.choices) if (councilCanChoose(state, choice)) visit(resolveCouncil(chen, state, choice.id));
  };
  visit(createCouncil(chen, { id: `fixture-${arrival}`, arrival }));
}

describe("Fan Yang guarantee", () => {
  it("binds the development review to the exact authored scene, without release approval", () => {
    expect(review.contentSHA256).toBe(fingerprint);
    expect(review.publicationApproved).toBe(false);
  });
  it("exhausts all legal continuations of 77 Chen routes, with honest previews and a safe exit", () => {
    expect(entries).toHaveLength(77);
    const authored = JSON.stringify(definition);
    const outcomes = new Set<string>();
    let endings = 0;
    for (const entry of entries) {
      const source = JSON.stringify(entry);
      const visit = (state: FanyangState) => {
        expect(restoreFanyang(definition, entry, JSON.parse(encodeFanyangSnapshot(state, fingerprint)), fingerprint)).toEqual(state);
        if (state.completed) {
          endings++; outcomes.add(state.outcome!);
          if (state.outcome === "opened") expect(fanyangGateChecks(definition, state).every(check => check.met)).toBe(true);
          expect(() => resolveFanyang(definition, state, "withdraw-envoy")).toThrow();
          return;
        }
        const choices = definition.rounds[state.history.length]!.choices.filter(choice => fanyangCanChoose(definition, state, choice));
        expect(choices.length).toBeGreaterThan(0);
        if (state.history.length === 2) expect(choices.some(choice => choice.id === "withdraw-envoy")).toBe(true);
        for (const choice of choices) {
          const before = JSON.stringify(state);
          const preview = resolveFanyang(definition, state, choice.id);
          expect(resolveFanyang(definition, state, choice.id)).toEqual(preview);
          expect(JSON.stringify(state)).toBe(before);
          expect(preview.history).toHaveLength(state.history.length + 1);
          for (const metric of fanyangMetricKeys) {
            expect(Number.isInteger(preview.metrics[metric])).toBe(true);
            expect(preview.metrics[metric]).toBeGreaterThanOrEqual(0);
            expect(preview.metrics[metric]).toBeLessThanOrEqual(10);
          }
          visit(preview);
        }
      };
      const initial = createFanyang(definition, entry);
      for (const key of ["grain", "tempo", "city", "allies", "veterans"] as const) expect(initial.metrics[key]).toBe(entry.metrics[key]);
      visit(initial);
      expect(JSON.stringify(entry)).toBe(source);
    }
    expect(endings).toBeGreaterThan(77);
    expect([...outcomes].sort()).toEqual(["deferred", "opened", "withdrawn"]);
    expect(JSON.stringify(definition)).toBe(authored);
  });

  it("carries Chen promises into visible costs and benefits", () => {
    const entry = entries.find(item => item.choices.includes("recognize-allies") && item.choices.includes("joint-ledger") && item.metrics.grain >= 1 && item.metrics.veterans >= 5)!;
    expect(entry).toBeDefined();
    const state = resolveFanyang(definition, createFanyang(definition, entry), "public-safety");
    const escort = definition.rounds[1]!.choices.find(item => item.id === "guarded-escort")!;
    expect(fanyangAnswers(state, escort).map(answer => answer.afterChoice)).toEqual(["recognize-allies"]);
    expect(resolveFanyang(definition, state, escort.id).metrics.allies).toBe(Math.max(0, state.metrics.allies - 2));
    const witness = definition.rounds[1]!.choices.find(item => item.id === "joint-witnesses")!;
    expect(fanyangAnswers(state, witness).map(answer => answer.afterChoice)).toEqual(["joint-ledger"]);
  });

  it("never replenishes an exhausted council and always permits orderly withdrawal", () => {
    const entry = entries.find(item => item.metrics.grain === 0)!;
    expect(entry).toBeDefined();
    let state = createFanyang(definition, entry);
    expect(state.metrics.grain).toBe(0);
    expect(() => resolveFanyang(definition, state, "keep-cordon")).toThrow();
    state = resolveFanyang(definition, state, "public-safety");
    state = resolveFanyang(definition, state, "hold-talks");
    expect(() => resolveFanyang(definition, state, "accept-transfer")).toThrow();
    const result = resolveFanyang(definition, state, "withdraw-envoy");
    expect(result.outcome).toBe("withdrawn");
    expect(result.metrics).toEqual(state.metrics);
  });

  it("rejects reordered, duplicate, foreign and revision-mismatched saves; ignores forged totals", () => {
    const entry = entries[0]!;
    const state = resolveFanyang(definition, createFanyang(definition, entry), "public-safety");
    const snapshot = JSON.parse(encodeFanyangSnapshot(state, fingerprint));
    expect(restoreFanyang(definition, entry, { ...snapshot, metrics: { grain: 999 }, completed: true, outcome: "opened", councilChoices: [] }, fingerprint)).toEqual(state);
    for (const saved of [null, [], {}, { ...snapshot, version: 2 }, { ...snapshot, entryId: "another-run" },
      { ...snapshot, definitionSHA256: "0".repeat(64) }, { ...snapshot, choices: ["withdraw-envoy"] },
      { ...snapshot, choices: ["public-safety", "public-safety"] }, { ...snapshot, choices: [null] },
      { ...snapshot, choices: Array(4).fill("public-safety") }]) {
      expect(restoreFanyang(definition, entry, saved, fingerprint)).toBeNull();
    }
    expect(() => resolveFanyang(definition, state, "public-safety")).toThrow();
    expect(() => encodeFanyangSnapshot(state, "bad-revision")).toThrow();
  });

  it("keeps all dialogue bilingual and all terminal offers explicit", () => {
    const ids = new Set<string>();
    for (const [index, round] of definition.rounds.entries()) for (const choice of round.choices) {
      expect(ids.has(choice.id)).toBe(false); ids.add(choice.id);
      for (const text of [round.title, round.context, choice.title, choice.intent, choice.response, ...(choice.answers ?? []).map(answer => answer.text)]) {
        expect(text.en.trim()).not.toBe(""); expect(text["zh-Hans"].trim()).not.toBe("");
      }
      expect(Boolean(choice.resolution)).toBe(index === definition.rounds.length - 1);
    }
  });
});
