// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./components/ThreeBackdrop", () => ({
  ThreeBackdrop: () => <div data-testid="three-backdrop" />,
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("shi.chapter-01.seed.v1", "0");
  localStorage.setItem("shi.onboarding.field-guide.v1", "complete");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [] });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

class FakeAudioParam {
  value = 0;
  cancelScheduledValues() { /* deterministic no-op */ }
  setValueAtTime(value: number) { this.value = value; return this; }
  linearRampToValueAtTime(value: number) { this.value = value; return this; }
  exponentialRampToValueAtTime(value: number) { this.value = value; return this; }
}

class FakeAudioNode {
  connect() { return this; }
  disconnect() { /* deterministic no-op */ }
}

class FakeAudioContext {
  state: AudioContextState = "running";
  currentTime = 1;
  destination = new FakeAudioNode();
  createGain() { return Object.assign(new FakeAudioNode(), { gain: new FakeAudioParam() }); }
  createOscillator() { return Object.assign(new FakeAudioNode(), { type: "sine", frequency: new FakeAudioParam(), start: vi.fn(), stop: vi.fn() }); }
  createBiquadFilter() { return Object.assign(new FakeAudioNode(), { type: "lowpass", frequency: new FakeAudioParam() }); }
  createBuffer(_channels: number, length: number) { return { copyToChannel: vi.fn(), length }; }
  createBufferSource() { return Object.assign(new FakeAudioNode(), { buffer: null, loop: false, start: vi.fn(), stop: vi.fn() }); }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}

describe("playable web shell", () => {
  it("keeps sound opt-in and persists an independently mixed runtime", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const view = render(<App />);

    expect(view.getByTestId("shi-app").getAttribute("data-audio-enabled")).toBe("false");
    fireEvent.click(view.getByTestId("title-audio-toggle"));
    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-audio-status")).toBe("ready"));
    expect(JSON.parse(localStorage.getItem("shi.audio.v1") ?? "null")?.enabled).toBe(true);

    fireEvent.click(view.getByTestId("begin-game"));
    fireEvent.click(view.getByTestId("audio-toggle"));
    const drawer = await view.findByTestId("audio-drawer");
    expect(drawer.getAttribute("aria-modal")).toBe("true");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    fireEvent.change(view.getByTestId("audio-ambience"), { target: { value: "0.17" } });
    fireEvent.change(view.getByTestId("audio-effects"), { target: { value: "0.41" } });
    fireEvent.click(view.getByTestId("audio-preview"));
    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-audio-cue")).toBe("commit"));
    const stored = JSON.parse(localStorage.getItem("shi.audio.v1") ?? "null");
    expect(stored).toMatchObject({ enabled: true, ambience: 0.17, effects: 0.41 });

    fireEvent.click(view.getByTestId("audio-enabled"));
    expect(view.getByTestId("shi-app").getAttribute("data-audio-status")).toBe("off");
    expect((view.getByTestId("audio-preview") as HTMLButtonElement).disabled).toBe(true);
  });

  it("teaches the three-stage loop once and keeps the field guide replayable", async () => {
    localStorage.removeItem("shi.onboarding.field-guide.v1");
    const view = render(<App />);

    fireEvent.click(view.getByTestId("begin-game"));
    expect((await view.findByTestId("guide-drawer")).textContent).toContain("Every order resolves in three strokes");
    fireEvent.click(view.getByTestId("guide-continue"));

    expect(view.queryByTestId("guide-drawer")).toBeNull();
    expect(localStorage.getItem("shi.onboarding.field-guide.v1")).toBe("complete");
    const guideToggle = view.getByTestId("guide-toggle");
    guideToggle.focus();
    fireEvent.click(guideToggle);
    const replayedGuide = await view.findByTestId("guide-drawer");
    expect(replayedGuide.getAttribute("aria-modal")).toBe("true");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(replayedGuide.querySelector(".icon-button")));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(view.getByTestId("guide-continue"));
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(replayedGuide.querySelector(".icon-button"));
    fireEvent.click(view.getByTestId("guide-continue"));
    await waitFor(() => expect(document.activeElement).toBe(guideToggle));
  });

  it("navigates and commits through the standard Gamepad API surface", async () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 }));
    const gamepad = { id: "SHI test controller", index: 0, connected: true, mapping: "standard", timestamp: 0, axes: [0, 0, 0, 0], buttons } as unknown as Gamepad;
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [gamepad] });
    const press = async (index: number) => {
      buttons[index]!.pressed = true;
      buttons[index]!.value = 1;
      await act(() => new Promise((resolve) => setTimeout(resolve, 35)));
      buttons[index]!.pressed = false;
      buttons[index]!.value = 0;
      await act(() => new Promise((resolve) => setTimeout(resolve, 35)));
    };
    const view = render(<App />);

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-controller")).toBe("connected"));
    await press(0);
    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-screen")).toBe("play"));
    await press(3);
    expect(view.getByTestId("map-intel").textContent).toContain("Daze Village");
    await press(15);
    expect(view.getByTestId("map-intel").textContent).toContain("Chen");
    await press(0);
    await view.findByTestId("sources-drawer");
    await press(1);
    await press(3);
    expect(view.queryByTestId("map-intel")).toBeNull();
    await press(15);
    expect(document.querySelector("[data-choice-id='take-the-beacon']")?.className).toContain("is-gamepad-selected");
    await press(0);

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("fire-council"));
  });

  it("resolves a keyboard decision and reveals the authored pressure response", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("rain-order");
    expect(view.getByTestId("shi-app").getAttribute("data-seed")).toBe("00000000");
    expect(view.getByTestId("field-signal").textContent).toContain("Water over the axle");
    expect(view.getByTestId("field-signal").textContent).toContain("-3 Grain");
    fireEvent.keyDown(window, { key: "!", code: "Digit1", shiftKey: true });

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council"));
    expect(view.getByTestId("resolution").textContent).toContain("The position answers");
    expect(view.getByTestId("resolution").textContent).toContain("relay clerk");
    expect(view.getByTestId("resolution").textContent).toContain("Field condition resolves");
    expect(document.querySelector(".choices-panel")?.hasAttribute("inert")).toBe(true);
    fireEvent.click(document.querySelector("[data-choice-id='issue-grain-tallies']")!);
    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v3") ?? "null")?.saveVersion).toBe(3));
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v3") ?? "null")?.history).toHaveLength(1);
  });

  it("opens accessible drawers with shortcuts and closes them with Escape", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    fireEvent.keyDown(window, { key: "s", altKey: true });
    const sources = await view.findByTestId("sources-drawer");
    expect(sources.getAttribute("aria-modal")).toBe("true");
    expect(sources.textContent).toContain("卷048 · 陳涉世家第十八 · 二世元年七月段");
    expect(sources.textContent).toContain("Specialist review required");
    expect(sources.querySelectorAll(".claim")).toHaveLength(9);
    expect(sources.querySelector("a[href='https://zh.wikisource.org/wiki/史記三家註/卷048']")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.queryByTestId("sources-drawer")).toBeNull();

    fireEvent.keyDown(window, { key: "r", altKey: true });
    expect(view.getByTestId("record-drawer").getAttribute("role")).toBe("dialog");
  });

  it("inspects reported map intelligence without leaking hindsight or changing game state", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    fireEvent.keyDown(window, { key: "m", altKey: true });
    expect(view.getByTestId("map-intel").textContent).toContain("Daze Village");
    fireEvent.keyDown(window, { key: "m", altKey: true });
    expect(view.queryByTestId("map-intel")).toBeNull();
    fireEvent.click(document.querySelector("[data-site-id='pei']")!);
    expect(view.getByTestId("map-intel").textContent).toContain("Reported network");
    expect(view.getByTestId("map-intel").textContent).toContain("not knowledge available to the opening council");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(view.getByTestId("map-intel").textContent).toContain("Kuaiji");
    expect(view.getByTestId("map-intel").textContent).toContain("not a route, scale claim or predetermined Xiang path");
    fireEvent.keyDown(window, { key: "Enter" });
    const sources = await view.findByTestId("sources-drawer");
    expect(sources.textContent).toContain("Kuaiji");
    expect(sources.querySelectorAll(".claim")).toHaveLength(3);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.queryByTestId("sources-drawer")).toBeNull();
    expect(view.getByTestId("map-intel")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.queryByTestId("map-intel")).toBeNull();
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v3") ?? "{}")?.history ?? []).toHaveLength(0);
  });

  it("migrates a version-one save by replaying its decision history", async () => {
    localStorage.setItem("shi.chapter-01.save.v1", JSON.stringify({
      campaignId: "chapter-01-daze",
      currentNodeId: "wrong-node",
      resources: { grain: 0, trust: 0, momentum: 0, people: 0, danger: 100 },
      flags: ["invented"],
      history: [{ nodeId: "rain-order", choiceId: "read-the-names", before: {}, after: {} }],
      completed: false,
    }));

    const view = render(<App />);
    expect(view.getByTestId("begin-game").textContent).toContain("Continue");
    fireEvent.click(view.getByTestId("begin-game"));

    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council");
    expect(localStorage.getItem("shi.chapter-01.save.v1")).toBeNull();
    await waitFor(() => {
      const migrated = JSON.parse(localStorage.getItem("shi.chapter-01.save.v3") ?? "null");
      expect(migrated?.resources.danger).toBe(61);
      expect(migrated?.seed).toBe(0);
      expect(migrated?.history[0]?.conditionId).toBe("water-over-axle");
    });
  });
});
