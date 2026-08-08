import { describe, expect, it } from "vitest";
import { createRainSamples, cueDurationSeconds, scheduleGain } from "./audioEngine";

describe("procedural audio primitives", () => {
  it("reconstructs deterministic, finite, bounded rain samples", () => {
    const first = createRainSamples(24000, 1397246257);
    const repeated = createRainSamples(24000, 1397246257);
    const other = createRainSamples(24000, 1397246258);
    expect(first).toEqual(repeated);
    expect(first).not.toEqual(other);
    expect(first.every((sample) => Number.isFinite(sample) && sample >= -1 && sample <= 1)).toBe(true);
    const mean = first.reduce((sum, sample) => sum + sample, 0) / first.length;
    const adjacentJumps = Array.from(first.slice(1), (sample, index) => Math.abs(sample - first[index]!)).sort((left, right) => left - right);
    const boundaryJump = Math.abs(first[first.length - 1]! - first[0]!);
    const p99 = adjacentJumps[Math.floor(adjacentJumps.length * 0.99)]!;
    expect(Math.abs(mean)).toBeLessThan(0.000001);
    expect(boundaryJump / p99).toBeLessThanOrEqual(0.8);
  });

  it("keeps every authored cue brief enough for interaction feedback", () => {
    expect(cueDurationSeconds("select")).toBeLessThanOrEqual(0.1);
    expect(cueDurationSeconds("commit")).toBeLessThanOrEqual(0.3);
    expect(cueDurationSeconds("failure")).toBeLessThanOrEqual(0.5);
  });

  it("pins an immediate mute before a later fade can expose the intrinsic full-scale gain", () => {
    const events: Array<[string, number, number?]> = [];
    const parameter = {
      value: 1,
      cancelScheduledValues: (time: number) => { events.push(["cancel", time]); },
      cancelAndHoldAtTime: (time: number) => { events.push(["hold", time]); },
      setValueAtTime: (value: number, time: number) => { events.push(["set", value, time]); },
      linearRampToValueAtTime: (value: number, time: number) => { events.push(["ramp", value, time]); },
    } as unknown as AudioParam;

    scheduleGain(parameter, 0, 1, 0);
    scheduleGain(parameter, 0.07, 1, 0.18);

    expect(parameter.value).toBe(0);
    expect(events).toEqual([
      ["cancel", 1],
      ["set", 0, 1],
      ["hold", 1],
      ["ramp", 0.07, 1.18],
    ]);
  });
});
