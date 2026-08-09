import rawDefinition from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import { describe, expect, it } from "vitest";
import {
  availableEngagementCommands,
  createEngagementState,
  replayEngagementState,
  resolveEngagementCommand,
} from "../src";
import type { EngagementDefinition, EngagementState } from "../src";

const definition = rawDefinition as EngagementDefinition;

const completeWithFirstLegalCommand = (initial: EngagementState): EngagementState => {
  let state = initial;
  while (!state.completed) {
    const command = availableEngagementCommands(definition, state)[0];
    if (!command) throw new Error(`Test route deadlocked at pulse ${state.pulseIndex}.`);
    state = resolveEngagementCommand(definition, state, command.id);
  }
  return state;
};

const reverseObjectKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (!value || typeof value !== "object") return value;
  return Object.entries(value)
    .reverse()
    .reduce<Record<string, unknown>>((result, [key, child]) => {
      result[key] = reverseObjectKeys(child);
      return result;
    }, {});
};

describe("broken-crossing engagement", () => {
  it("creates deterministic plan and condition state without mutating authored content", () => {
    const snapshot = structuredClone(definition);
    const first = createEngagementState(definition, "families-first", "ford-rises");
    const second = createEngagementState(definition, "families-first", "ford-rises");

    expect(first).toEqual(second);
    expect(first.metrics).toEqual({
      crossingProgress: 14,
      rearCohesion: 52,
      reserveReadiness: 58,
      supplyLoads: 64,
      pursuitClosure: 47,
      signalIntegrity: 72,
    });
    expect(definition).toEqual(snapshot);
  });

  it("exposes only commands allowed by the chosen plan and current pulse", () => {
    const families = createEngagementState(definition, "families-first", "ford-rises");
    const mobile = createEngagementState(definition, "cut-the-carts", "ford-rises");

    expect(availableEngagementCommands(definition, families).map((command) => command.id)).toEqual([
      "screen-through-reeds",
      "brace-the-approach",
    ]);
    expect(availableEngagementCommands(definition, mobile).map((command) => command.id)).toEqual([
      "screen-through-reeds",
      "open-three-files",
    ]);
  });

  it("records player command effects before the authored field response", () => {
    const initial = createEngagementState(definition, "families-first", "ford-rises");
    const next = resolveEngagementCommand(definition, initial, "screen-through-reeds");
    const record = next.history[0];

    expect(record?.before).toEqual(initial.metrics);
    expect(record?.afterCommand.pursuitClosure).toBe(41);
    expect(record?.responseId).toBe("patrol-probes-reeds");
    expect(record?.afterResponse.pursuitClosure).toBe(44);
    expect(next.metrics).toEqual(record?.afterResponse);
    expect(initial.history).toEqual([]);
  });

  it("rejects commands that are outside the plan or fail a requirement", () => {
    const initial = createEngagementState(definition, "families-first", "ford-rises");
    expect(() => resolveEngagementCommand(definition, initial, "open-three-files")).toThrow(/not legal/);

    const depleted = structuredClone(initial);
    depleted.metrics.signalIntegrity = 39;
    expect(availableEngagementCommands(definition, depleted).map((command) => command.id)).not.toContain("screen-through-reeds");
    expect(() => resolveEngagementCommand(definition, depleted, "screen-through-reeds")).toThrow(/not legal/);
  });

  it("resolves a three-pulse command route into an authored outcome and combined campaign effects", () => {
    let state = createEngagementState(definition, "cut-the-carts", "ford-rises");
    for (const commandId of ["open-three-files", "abandon-the-loads", "release-the-reserve"])
      state = resolveEngagementCommand(definition, state, commandId);

    expect(state.completed).toBe(true);
    expect(state.history).toHaveLength(3);
    expect(state.outcomeId).toBe("orderly-crossing");
    expect(state.campaignEffects).toEqual({ grain: -9, trust: -2, momentum: 9, people: 2, danger: -11 });
    expect(availableEngagementCommands(definition, state)).toEqual([]);
  });

  it("replays an exact save and rejects altered metrics, responses, and command ids", () => {
    const completed = completeWithFirstLegalCommand(createEngagementState(definition, "repair-the-ford", "rope-ferry-returns"));
    expect(replayEngagementState(definition, structuredClone(completed))).toEqual(completed);

    const reordered = reverseObjectKeys(completed);
    expect(replayEngagementState(definition, reordered)).toEqual(completed);

    const alteredMetric = structuredClone(completed);
    alteredMetric.metrics.crossingProgress += 1;
    expect(replayEngagementState(definition, alteredMetric)).toBeNull();

    const alteredResponse = structuredClone(completed);
    alteredResponse.history[0]!.responseId = "invented-response";
    expect(replayEngagementState(definition, alteredResponse)).toBeNull();

    const alteredCommand = structuredClone(completed);
    alteredCommand.history[0]!.commandId = "invented-command";
    expect(replayEngagementState(definition, alteredCommand)).toBeNull();
  });
});
