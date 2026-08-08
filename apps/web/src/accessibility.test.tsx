// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./components/ThreeBackdrop", () => ({ ThreeBackdrop: () => <div aria-hidden="true" /> }));

beforeEach(() => {
  document.title = "SHI · The Shape of Power";
  localStorage.clear();
  localStorage.setItem("shi.chapter-01.seed.v1", "0");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [] });
});

afterEach(() => {
  cleanup();
  axe.reset();
  vi.restoreAllMocks();
});

const scan = async () => axe.run(document, {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  rules: { "color-contrast": { enabled: false } },
});

describe("WCAG semantic gate", () => {
  it("has no automatic violations on the title, modal guide, gameplay, and wartable", async () => {
    const view = render(<App />);
    expect((await scan()).violations).toEqual([]);

    fireEvent.click(view.getByTestId("begin-game"));
    await view.findByTestId("guide-drawer");
    expect((await scan()).violations).toEqual([]);

    fireEvent.click(view.getByTestId("guide-continue"));
    fireEvent.click(document.querySelector("[data-site-id='daze']")!);
    await view.findByTestId("map-intel");
    expect((await scan()).violations).toEqual([]);
  });
});
