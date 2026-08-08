// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./components/ThreeBackdrop", () => ({
  ThreeBackdrop: () => <div data-testid="three-backdrop" />,
}));

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("playable web shell", () => {
  it("resolves a keyboard decision and reveals the authored pressure response", async () => {
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));

    expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("rain-order");
    fireEvent.keyDown(window, { key: "!", code: "Digit1", shiftKey: true });

    await waitFor(() => expect(view.getByTestId("shi-app").getAttribute("data-node-id")).toBe("open-council"));
    expect(view.getByTestId("resolution").textContent).toContain("The position answers");
    expect(view.getByTestId("resolution").textContent).toContain("relay clerk");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v2") ?? "null")?.saveVersion).toBe(2));
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
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shi.chapter-01.save.v2") ?? "null")?.resources.danger).toBe(59));
  });
});
