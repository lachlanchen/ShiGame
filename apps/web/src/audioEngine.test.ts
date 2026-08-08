import { describe, expect, it } from "vitest";
import { createRainSamples, cueDurationSeconds } from "./audioEngine";

describe("procedural audio primitives", () => {
  it("reconstructs deterministic, finite, bounded rain samples", () => {
    const first = createRainSamples(24000, 1397246257);
    const repeated = createRainSamples(24000, 1397246257);
    const other = createRainSamples(24000, 1397246258);
    expect(first).toEqual(repeated);
    expect(first).not.toEqual(other);
    expect(first.every((sample) => Number.isFinite(sample) && sample >= -1 && sample <= 1)).toBe(true);
    expect(Math.abs(first[first.length - 1]! - first[0]!)).toBeLessThan(0.000001);
  });

  it("keeps every authored cue brief enough for interaction feedback", () => {
    expect(cueDurationSeconds("select")).toBeLessThanOrEqual(0.1);
    expect(cueDurationSeconds("commit")).toBeLessThanOrEqual(0.3);
    expect(cueDurationSeconds("failure")).toBeLessThanOrEqual(0.5);
  });
});
