// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as persistence from "./persistence";

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
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

class FakeAudioParam {
  value = 0;
  cancelScheduledValues() { /* deterministic no-op */ }
  cancelAndHoldAtTime() { /* deterministic no-op */ }
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
  it.each([true, false])("plays title through Chen, Fan Yang and a retreat ending with resume and guarded saves (success=%s)", async success => {
    vi.stubGlobal("crypto", webcrypto);
    vi.stubEnv("VITE_SHI_NATIVE", "1");
    let view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    for (let turn = 0; turn < 4; turn++) {
      fireEvent.click(await view.findByTestId("commit-selected"));
      fireEvent.click(await view.findByTestId("resolution-continue"));
    }
    const chapter = localStorage.getItem("shi.chapter-01.save.v6");
    fireEvent.click(await view.findByTestId("council-enter"));
    await view.findByTestId("chen-council");
    for (const id of ["defer-title", "joint-ledger", "one-command"]) {
      fireEvent.click(view.container.querySelector(`[data-council-choice="${id}"]`)!);
      fireEvent.click(view.getByTestId("council-commit"));
      await view.findByTestId("council-response");
      fireEvent.click(view.getByTestId("council-continue"));
    }
    const chen = localStorage.getItem("shi.chen-council.v1");
    fireEvent.click(view.getByTestId("fanyang-enter"));
    const scene = await view.findByTestId("fanyang-scene");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    // Inspecting an offer, wrapping focus and opening global shortcuts must not
    // create an order or replace this continuation with another drawer.
    const first = scene.querySelector<HTMLButtonElement>("[data-council-action='close']")!;
    const last = scene.querySelector<HTMLButtonElement>("[data-council-action='retry']")!;
    first.focus(); fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" }); expect(document.activeElement).toBe(first);
    fireEvent.keyDown(window, { key: "r", altKey: true });
    fireEvent.keyDown(window, { key: "m", altKey: true });
    expect(view.getByTestId("fanyang-scene")).toBe(scene);
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBeNull();
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const pad = { id: "Fan Yang controller", index: 0, connected: true, mapping: "standard", timestamp: 0, axes: [0, 0, 0, 0], buttons } as unknown as Gamepad;
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [pad] });
    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-controller")).toBe("connected"));
    const press = async (index: number) => {
      buttons[index]!.pressed = true; buttons[index]!.value = 1;
      await act(() => new Promise(resolve => setTimeout(resolve, 35)));
      buttons[index]!.pressed = false; buttons[index]!.value = 0;
      await act(() => new Promise(resolve => setTimeout(resolve, 35)));
    };
    scene.querySelector<HTMLElement>("h3[tabindex]")!.focus();
    await press(0);
    expect(document.activeElement?.getAttribute("data-fanyang-choice")).toBe("public-safety");
    await press(15); await press(0);
    expect(scene.querySelector('[data-fanyang-choice="witnessed-transfer"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBeNull();
    fireEvent.click(scene.querySelector('[data-fanyang-choice="public-safety"]')!);
    let finish!: () => void, fail!: (error: Error) => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValueOnce(new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; })).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    fireEvent.click(view.container.querySelector(".drawer-scrim")!);
    fireEvent.keyDown(document, { key: "Escape" });
    const back = new Event("shi-native-back", { cancelable: true });
    act(() => { window.dispatchEvent(back); });
    expect(back.defaultPrevented).toBe(true);
    expect(view.getByTestId("fanyang-scene")).toBe(scene);
    expect(view.queryByTestId("fanyang-response")).toBeNull();
    await act(async () => { if (success) finish(); else fail(new Error("storage full")); });
    if (!success) {
      await view.findByRole("alert");
      expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBeNull();
      fireEvent.click(view.getByTestId("fanyang-commit"));
    }
    await view.findByTestId("fanyang-response");
    const firstOrder = localStorage.getItem("shi.fanyang-guarantee.v1");
    view.unmount();
    view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    fireEvent.click(await view.findByTestId("council-enter"));
    fireEvent.click(await view.findByTestId("council-continue"));
    fireEvent.click(view.getByTestId("fanyang-enter"));
    expect(await view.findByTestId("fanyang-response")).toBeTruthy();
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBe(firstOrder);
    fireEvent.click(view.getByTestId("fanyang-response").querySelector("button")!);
    for (const id of ["guarded-escort", "accept-transfer"]) {
      fireEvent.click(view.container.querySelector(`[data-fanyang-choice="${id}"]`)!);
      fireEvent.click(view.getByTestId("fanyang-commit"));
      await view.findByTestId("fanyang-response");
      fireEvent.click(view.getByTestId("fanyang-response").querySelector("button")!);
    }
    expect(view.getByTestId("fanyang-outcome").getAttribute("data-outcome")).toBe("opened");
    const final = localStorage.getItem("shi.fanyang-guarantee.v1");
    const journal = view.getByTestId("fanyang-journal");
    fireEvent.click(journal.querySelector("summary")!);
    expect(journal.querySelectorAll("ol > li")).toHaveLength(3);
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBe(final);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(chapter);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(chen);

    fireEvent.click(view.getByTestId("retreat-enter"));
    const retreat = await view.findByTestId("retreat-scene");
    const retreatKey = "shi.dev.chen-retreat.v1";
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    const retreatClose = retreat.querySelector<HTMLButtonElement>("[data-council-action='close']")!;
    const retreatRetry = retreat.querySelector<HTMLButtonElement>("[data-council-action='retry']")!;
    retreatClose.focus(); fireEvent.keyDown(retreatClose, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(retreatRetry);
    fireEvent.keyDown(retreatRetry, { key: "Tab" });
    expect(document.activeElement).toBe(retreatClose);
    fireEvent.keyDown(window, { key: "m", altKey: true });
    fireEvent.keyDown(window, { key: "r", altKey: true });
    expect(view.getByTestId("retreat-scene")).toBe(retreat);
    retreat.querySelector<HTMLElement>("h3[tabindex]")!.focus();
    await press(0);
    expect(document.activeElement?.getAttribute("data-retreat-choice")).toBe("keep-reserve");
    await press(15); await press(0);
    expect(retreat.querySelector('[data-retreat-choice="send-support"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem(retreatKey)).toBeNull();
    const firstRetreatChoice = success ? "keep-reserve" : "decline-dispatch";
    fireEvent.click(retreat.querySelector(`[data-retreat-choice="${firstRetreatChoice}"]`)!);
    let finishRetreat!: () => void, failRetreat!: (error: Error) => void;
    vi.mocked(persistence.flushPersistence).mockReturnValueOnce(new Promise<void>((resolve, reject) => { finishRetreat = resolve; failRetreat = reject; }));
    fireEvent.click(view.getByTestId("retreat-commit"));
    fireEvent.click(view.getByTestId("retreat-commit"));
    fireEvent.click(view.container.querySelector(".drawer-scrim")!);
    fireEvent.keyDown(document, { key: "Escape" });
    const retreatBack = new Event("shi-native-back", { cancelable: true });
    act(() => { window.dispatchEvent(retreatBack); });
    expect(retreatBack.defaultPrevented).toBe(true);
    expect(view.getByTestId("retreat-scene")).toBe(retreat);
    expect(view.queryByTestId("retreat-response")).toBeNull();
    expect(JSON.parse(localStorage.getItem(retreatKey)!).choices).toEqual([firstRetreatChoice]);
    await act(async () => { if (success) finishRetreat(); else failRetreat(new Error("retreat write failure")); });
    if (!success) {
      await view.findByRole("alert");
      expect(localStorage.getItem(retreatKey)).toBeNull();
      fireEvent.click(view.getByTestId("retreat-commit"));
    }
    const reaction = (await view.findByTestId("retreat-response")).textContent;
    const retreatSave = localStorage.getItem(retreatKey);
    view.unmount();
    view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    fireEvent.click(await view.findByTestId("council-enter"));
    fireEvent.click(await view.findByTestId("council-continue"));
    fireEvent.click(view.getByTestId("fanyang-enter"));
    fireEvent.click((await view.findByTestId("fanyang-response")).querySelector("button")!);
    fireEvent.click(view.getByTestId("retreat-enter"));
    expect((await view.findByTestId("retreat-response")).textContent).toBe(reaction);
    expect(localStorage.getItem(retreatKey)).toBe(retreatSave);
    fireEvent.click(view.getByTestId("retreat-response").querySelector("button")!);
    const remaining = success ? ["gather-own", "escort-households", "carry-records", "stay-together"]
      : ["gather-own", "split-routes", "carry-records", "release-groups"];
    for (const id of remaining) {
      fireEvent.click(view.container.querySelector(`[data-retreat-choice="${id}"]`)!);
      expect((view.getByTestId("retreat-commit") as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(view.getByTestId("retreat-commit"));
      fireEvent.click((await view.findByTestId("retreat-response")).querySelector("button")!);
    }
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe(success ? "together" : "dispersed");
    expect(JSON.parse(localStorage.getItem(retreatKey)!).choices).toEqual([firstRetreatChoice, ...remaining]);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(chapter);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(chen);
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBe(final);
  }, 15_000);

  it("resumes an unread aftermath after remount and acknowledges it without replaying the order", async () => {
    vi.stubEnv("VITE_SHI_NATIVE", "1");
    const first = render(<App />);
    fireEvent.click(first.getByTestId("begin-game"));
    fireEvent.click(await first.findByTestId("commit-selected"));
    const original = (await first.findByTestId("resolution")).textContent;
    const saved = localStorage.getItem("shi.chapter-01.save.v6");
    first.unmount();
    const resumed = render(<App />);
    expect(resumed.queryByTestId("resolution")).toBeNull();
    const backAtTitle = new Event("shi-native-back", { cancelable: true });
    act(() => { window.dispatchEvent(backAtTitle); });
    expect(backAtTitle.defaultPrevented).toBe(false);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
    fireEvent.click(resumed.getByTestId("begin-game"));
    expect((await resumed.findByTestId("resolution")).textContent).toBe(original);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
    fireEvent.click(resumed.getByTestId("commit-selected"));
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
    fireEvent.click(resumed.getByTestId("resolution-continue"));
    const acknowledged = JSON.parse(localStorage.getItem("shi.chapter-01.save.v6")!);
    expect(acknowledged.history).toHaveLength(1);
    expect(acknowledged.pendingAftermath).toBeUndefined();
    resumed.unmount();
    const again = render(<App />);
    fireEvent.click(again.getByTestId("begin-game"));
    expect(again.queryByTestId("resolution")).toBeNull();
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6")!)).toEqual(acknowledged);
  });

  it("does not let delayed scene-focus callbacks steal focus from a newly opened council", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    for (let turn = 0; turn < 4; turn++) {
      fireEvent.click(await view.findByTestId("commit-selected"));
      const next = await view.findByTestId("resolution-continue");
      if (turn < 3) fireEvent.click(next);
    }
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { frames.push(callback); return frames.length; });
    fireEvent.click(view.getByTestId("resolution-continue"));
    const enter = await view.findByTestId("council-enter");
    enter.focus(); fireEvent.click(enter);
    await view.findByTestId("chen-council");
    for (let frame = 0; frame < 2; frame++) {
      const current = frames.splice(0);
      act(() => { for (const callback of current) callback(performance.now()); });
    }
    expect(document.activeElement?.id).toBe("chen-title");
    expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
  });

  it.each([true, false])("keeps every council exit locked until durable save settles (success=%s)", async success => {
    vi.stubEnv("VITE_SHI_NATIVE", "1");
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    for (let turn = 0; turn < 4; turn++) {
      fireEvent.click(await view.findByTestId("commit-selected"));
      fireEvent.click(await view.findByTestId("resolution-continue"));
    }
    const chapter = localStorage.getItem("shi.chapter-01.save.v6");
    const enter = await view.findByTestId("council-enter");
    enter.focus(); fireEvent.click(enter);
    await view.findByTestId("chen-council");
    let finish!: () => void, fail!: (error: Error) => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValueOnce(new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; })).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("council-commit"));
    fireEvent.click(view.container.querySelector(".drawer-scrim")!);
    fireEvent.keyDown(document, { key: "Escape" });
    const back = new Event("shi-native-back", { cancelable: true });
    act(() => { window.dispatchEvent(back); });
    expect(back.defaultPrevented).toBe(true);
    expect(view.getByTestId("chen-council").getAttribute("data-round")).toBe("0");
    expect(view.queryByTestId("council-response")).toBeNull();
    await act(async () => { if (success) finish(); else fail(new Error("device storage full")); });
    if (success) {
      expect(await view.findByTestId("council-response")).toBeTruthy();
      expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toHaveLength(1);
    } else {
      expect(await view.findByRole("alert")).toBeTruthy();
      expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
    }
    fireEvent.click(view.container.querySelector(".drawer-scrim")!);
    expect(view.queryByTestId("chen-council")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(enter));
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(chapter);
  });

  it("continues a surviving chapter into a save-isolated council and traps its shortcuts", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    for (let turn = 0; turn < 4; turn++) {
      fireEvent.click(await view.findByTestId("commit-selected"));
      fireEvent.click(await view.findByTestId("resolution-continue"));
    }
    const chapter = localStorage.getItem("shi.chapter-01.save.v6");
    const enter = await view.findByTestId("council-enter");
    enter.focus(); fireEvent.click(enter);
    const council = await view.findByTestId("chen-council");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    expect(document.activeElement?.id).toBe("chen-title");
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const pad = { id: "Council test controller", index: 0, connected: true, mapping: "standard", timestamp: 0, axes: [0, 0, 0, 0], buttons } as unknown as Gamepad;
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [pad] });
    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-controller")).toBe("connected"));
    buttons[14]!.pressed = true; buttons[14]!.value = 1;
    await act(() => new Promise(resolve => setTimeout(resolve, 35)));
    buttons[14]!.pressed = false; buttons[14]!.value = 0;
    await act(() => new Promise(resolve => setTimeout(resolve, 35)));
    expect(document.activeElement).toBe(view.getByTestId("council-commit"));
    expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
    view.getByRole("heading", { name: "The council at Chen" }).focus();
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement?.tagName).toBe("SUMMARY");
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement?.getAttribute("data-council-action")).toBe("close");
    fireEvent.keyDown(window, { key: "m", altKey: true });
    fireEvent.keyDown(window, { key: "r", altKey: true });
    expect(view.getByTestId("chen-council")).toBe(council);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(chapter);
    fireEvent.keyDown(council, { key: "Escape" });
    await waitFor(() => expect(view.queryByTestId("chen-council")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(enter));
    fireEvent.click(enter);
    await view.findByTestId("council-response");
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(chapter);
  });

  it("holds the aftermath without extra orders, then restores the next scene and the exact saved turn", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    const commit = await view.findByTestId("commit-selected");
    act(() => { commit.click(); commit.click(); });
    const result = await view.findByTestId("resolution");
    const saved = localStorage.getItem("shi.chapter-01.save.v6");
    expect(JSON.parse(saved!).history).toHaveLength(1);
    expect(result.getAttribute("role")).toBe("dialog");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    expect(view.getByTestId("game-stage").getAttribute("aria-hidden")).toBe("true");
    expect(document.activeElement?.id).toBe("consequence-title");
    expect(view.container.querySelector("video")).toBeNull();
    fireEvent.keyDown(window, { key: "m", altKey: true });
    fireEvent.keyDown(window, { key: "s", altKey: true });
    fireEvent.click(view.getByTestId("commit-selected"));
    expect(view.queryByTestId("map-intel")).toBeNull();
    expect(view.queryByTestId("sources-drawer")).toBeNull();
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
    fireEvent.click(view.getByTestId("resolution-continue"));
    expect(view.queryByTestId("resolution")).toBeNull();
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(document.querySelector(".story-panel")));
    const acknowledged = localStorage.getItem("shi.chapter-01.save.v6");
    const { pendingAftermath, ...campaignState } = JSON.parse(saved!);
    expect(pendingAftermath).toBe(1);
    expect(JSON.parse(acknowledged!)).toEqual(campaignState);
    view.unmount();
    const resumed = render(<App />);
    fireEvent.click(resumed.getByTestId("begin-game"));
    expect(resumed.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council");
    expect(resumed.queryByTestId("resolution")).toBeNull();
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(acknowledged);
    fireEvent.click(await resumed.findByTestId("commit-selected"));
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6")!).history).toHaveLength(2);
  });

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

  it("teaches the six-layer loop once and keeps the field guide replayable", async () => {
    localStorage.removeItem("shi.onboarding.field-guide.v1");
    const view = render(<App />);

    const titleTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(titleTab);
    expect(titleTab.defaultPrevented).toBe(false);

    fireEvent.click(view.getByTestId("begin-game"));
    expect((await view.findByTestId("guide-drawer")).textContent).toContain("Every order resolves in six visible layers");
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
    expect((await view.findByTestId("map-intel")).textContent).toContain("Daze Village");
    await press(15);
    await waitFor(() => expect(view.getByTestId("map-intel").textContent).toContain("Chen"));
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

  it("selects without mutation, then explicitly issues a keyboard-reviewed order", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("rain-order");
    const openingHorizon = await view.findByTestId("campaign-horizon");
    expect(openingHorizon.getAttribute("data-act-id")).toBe("register");
    expect(openingHorizon.getAttribute("data-time-index")).toBe("0");
    expect(openingHorizon.textContent).toContain("Act I · The register");
    expect(openingHorizon.querySelector("[aria-current='step']")?.textContent).toContain("Current");
    expect(view.getByTestId("shi-app").getAttribute("data-seed")).toBe("00000000");
    expect(view.getByTestId("shi-app").getAttribute("data-opposition-stage")).toBe("scattered-watch");
    expect(view.getByTestId("shi-app").getAttribute("data-method-read-id")).toBe("unresolved-pattern");
    expect(view.getByTestId("opposition-posture").textContent).toContain("Scattered watch");
    expect(view.getByTestId("opposition-posture").textContent).toContain("No added pressure");
    expect(view.getByTestId("method-read").textContent).toContain("Unresolved pattern");
    expect((await view.findByTestId("decision-inspector")).getAttribute("data-selected-choice")).toBe("read-the-names");
    expect(view.getByTestId("decision-inspector").querySelector("[data-method-id='witnessed-compact']")?.textContent).toContain("Witnessed compact");
    expect(view.getByTestId("field-signal").textContent).toContain("Water over the axle");
    expect(view.getByTestId("field-signal").textContent).toContain("-3 Grain");
    expect((await view.findByTestId("commitment-establish-names-under-protection")).textContent).toContain("Aunt Yu");
    fireEvent.keyDown(window, { key: "!", code: "Digit1", shiftKey: true });

    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("rain-order");
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "{}")?.history ?? []).toHaveLength(0);
    expect(document.querySelector("[data-choice-id='read-the-names']")?.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(view.getByTestId("commit-selected"));

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council"));
    await waitFor(() => expect(view.getByTestId("campaign-horizon").getAttribute("data-act-id")).toBe("organization"));
    expect(view.getByTestId("campaign-horizon").getAttribute("data-time-index")).toBe("1");
    expect(view.getByTestId("campaign-horizon").textContent).toContain("Act II · The cost of organization");
    expect(view.getByTestId("campaign-horizon").textContent).toContain("209 BCE · The same night");
    await waitFor(() => {
      const resolution = view.getByTestId("resolution").textContent;
      expect(resolution).toContain("The position answers");
      expect(resolution).toContain("relay clerk");
      expect(resolution).toContain("Pursuit acts");
      expect(resolution).toContain("Scattered watch");
      expect(resolution).toContain("Read misses");
      expect(resolution).toContain("Unresolved pattern");
      expect(resolution).toContain("Field condition resolves");
    });
    expect((await view.findByTestId("commitment-panel")).textContent).toContain("Names under protection");
    expect(view.getByTestId("commitment-panel").textContent).toContain("Aunt Yu");
    expect(document.querySelector(".choices-panel")?.hasAttribute("inert")).toBe(true);
    fireEvent.click(document.querySelector("[data-choice-id='issue-grain-tallies']")!);
    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null")?.saveVersion).toBe(6));
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null")?.history).toHaveLength(1);
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
    expect((await view.findByTestId("record-drawer")).getAttribute("role")).toBe("dialog");
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
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "{}")?.history ?? []).toHaveLength(0);
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
      const migrated = JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null");
      expect(migrated?.resources.danger).toBe(61);
      expect(migrated?.seed).toBe(0);
      expect(migrated?.saveVersion).toBe(6);
      expect(migrated?.legacyDecisionCount).toBe(1);
      expect(migrated?.preMethodReadDecisionCount).toBe(1);
      expect(migrated?.history[0]?.conditionId).toBe("water-over-axle");
    });
  });

  it("discloses repeated-method memory, exact hit counterplay, and the persisted response", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    fireEvent.click(document.querySelector("[data-choice-id='read-the-names']")!);
    fireEvent.click(await view.findByTestId("commit-selected"));
    fireEvent.click(view.getByTestId("resolution").querySelector("button")!);
    fireEvent.click(document.querySelector("[data-choice-id='issue-grain-tallies']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(view.getByTestId("resolution").querySelector("button")!);

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-method-read-id")).toBe("witness-chain"));
    expect(view.getByTestId("story-echo").getAttribute("data-story-echo-id")).toBe("covenant-reaches-the-ford");
    expect(view.getByTestId("story-echo").textContent).toContain("Do not let the river turn us back into a count");
    expect(view.getByTestId("story-echo").textContent).toContain("Aunt Yu");
    expect((await view.findByTestId("commitment-panel")).textContent).toContain("Names under protection");
    expect(view.getByTestId("decision-inspector").querySelector("[data-commitment-status='kept']")?.textContent).toContain("+4 Trust");
    fireEvent.click(document.querySelector("[data-choice-id='repair-the-ford']")!);
    expect(view.getByTestId("decision-inspector").querySelector("[data-commitment-status='strained']")?.textContent).toContain("-2 Trust");
    expect(view.getByTestId("decision-inspector").querySelector("[data-read-hit='false']")?.textContent).toContain("No added pressure");
    fireEvent.click(document.querySelector("[data-choice-id='cut-the-carts']")!);
    expect(view.getByTestId("decision-inspector").querySelector("[data-commitment-status='broken']")?.textContent).toContain("+2 Exposure");
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null")?.history).toHaveLength(2);
    const read = view.getByTestId("method-read");
    expect(read.textContent).toContain("Witness chain");
    expect(read.querySelector("[data-method-id='witnessed-compact']")?.textContent).toContain("2");
    expect(read.querySelector("[data-method-id='witnessed-compact']")?.getAttribute("data-targeted")).toBe("true");
    fireEvent.click(document.querySelector("[data-choice-id='families-first']")!);
    expect(view.getByTestId("decision-inspector").querySelector("[data-read-hit='true']")?.textContent).toContain("+3 Exposure");
    fireEvent.click(view.getByTestId("commit-selected"));
    expect(view.getByTestId("story-echo").getAttribute("data-story-echo-id")).toBe("households-name-the-next-road");
    expect(view.getByTestId("story-echo").textContent).toContain("remember who held it open");
    expect(view.getByTestId("resolution").textContent).toContain("Read hits");
    expect(view.getByTestId("resolution").textContent).toContain("Repeated public commitments");
    expect(view.getByTestId("resolution").textContent).toContain("+3 Exposure");
    expect((await view.findByTestId("commitment-resolution")).textContent).toContain("Kept");
    expect(view.getByTestId("resolution").textContent).toContain("+4 Trust");
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null");
      expect(saved?.history[2]?.commitmentId).toBe("names-under-protection");
      expect(saved?.history[2]?.commitmentOutcomeId).toBe("names-families-kept");
      expect(saved?.history[2]?.commitmentEffects).toEqual({ trust: 4 });
      expect(saved?.history[2]?.methodId).toBe("witnessed-compact");
      expect(saved?.history[2]?.methodReadId).toBe("witness-chain");
      expect(saved?.history[2]?.methodReadMatched).toBe(true);
      expect(saved?.history[2]?.methodReadEffects).toEqual({ danger: 3 });
    });
    fireEvent.click(view.getByTestId("resolution").querySelector("button")!);
    fireEvent.click(view.getByTestId("record-toggle"));
    await waitFor(() => expect(view.getByTestId("record-drawer").textContent).toContain("Witness chain"));
    expect(view.getByTestId("record-drawer").textContent).toContain("Read hits");
  });

  it("plays the broken-crossing command reference without mutating campaign authority", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    fireEvent.click(document.querySelector("[data-choice-id='read-the-names']")!);
    fireEvent.click(await view.findByTestId("commit-selected"));
    fireEvent.click(view.getByTestId("resolution").querySelector("button")!);
    fireEvent.click(document.querySelector("[data-choice-id='issue-grain-tallies']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(view.getByTestId("resolution").querySelector("button")!);

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("broken-crossing"));
    fireEvent.click(document.querySelector("[data-choice-id='cut-the-carts']")!);
    const open = await view.findByTestId("open-command-board");
    open.focus();
    fireEvent.click(open);
    const board = await view.findByTestId("engagement-board");
    expect(view.getByTestId("game-stage").hasAttribute("inert")).toBe(true);
    expect(board.getAttribute("data-plan-id")).toBe("cut-the-carts");
    const campaignBefore = localStorage.getItem("shi.chapter-01.save.v6");

    fireEvent.click(board.querySelector("[data-engagement-command='open-three-files']")!);
    fireEvent.click(board.querySelector("[data-engagement-command='abandon-the-loads']")!);
    fireEvent.click(board.querySelector("[data-engagement-command='release-the-reserve']")!);

    expect(board.getAttribute("data-outcome-id")).toBe("orderly-crossing");
    expect(view.getByTestId("engagement-outcome").textContent).toContain("Orderly crossing");
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(campaignBefore);
    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("broken-crossing");
    fireEvent.click(view.getByTestId("engagement-return"));
    await waitFor(() => expect(view.queryByTestId("engagement-board")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(open));
    expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v6") ?? "null")?.history).toHaveLength(2);
  });
});
