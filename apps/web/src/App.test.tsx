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
  vi.restoreAllMocks();
});

describe("playable web shell", () => {
  it("teaches the two-stage loop once and keeps the field guide replayable", () => {
    localStorage.removeItem("shi.onboarding.field-guide.v1");
    const view = render(<App />);

    fireEvent.click(view.getByTestId("begin-game"));
    expect(view.getByTestId("guide-drawer").textContent).toContain("Every order resolves in three strokes");
    fireEvent.click(view.getByTestId("guide-continue"));

    expect(view.queryByTestId("guide-drawer")).toBeNull();
    expect(localStorage.getItem("shi.onboarding.field-guide.v1")).toBe("complete");
    fireEvent.click(view.getByTestId("guide-toggle"));
    expect(view.getByTestId("guide-drawer").getAttribute("aria-modal")).toBe("true");
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
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v3") ?? "null")?.saveVersion).toBe(3));
  });

  it("opens accessible drawers with shortcuts and closes them with Escape", () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    fireEvent.keyDown(window, { key: "s", altKey: true });
    expect(view.getByTestId("sources-drawer").getAttribute("aria-modal")).toBe("true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.queryByTestId("sources-drawer")).toBeNull();

    fireEvent.keyDown(window, { key: "r", altKey: true });
    expect(view.getByTestId("record-drawer").getAttribute("role")).toBe("dialog");
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
