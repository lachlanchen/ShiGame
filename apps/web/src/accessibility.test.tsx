// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createInitialState, resolveChoice, supportedLocales, type Campaign } from "@shi/game-core";
import campaignData from "../../../content/campaigns/chapter-01-daze.json";
import chapterFixtures from "../../../content/conformance/chapter-01-replays.v1.json";
import { ui } from "./ui-catalog";

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
  it.each(supportedLocales)("keeps defeat readable and retry operable in %s", async locale => {
    localStorage.setItem("shi.locale", locale);
    localStorage.setItem("shi.onboarding.field-guide.v1", "complete");
    const campaign = campaignData as Campaign;
    const route = chapterFixtures.routes.find(item => item.final.failureReason === "captured")!;
    let state = createInitialState(campaign, chapterFixtures.seed);
    for (const id of route.choiceIds) state = resolveChoice(campaign, state, id).state;
    const saved = JSON.stringify(state);
    localStorage.setItem("shi.chapter-01.save.v6", saved);
    const view = render(<App />);
    fireEvent.click(view.getByTestId("begin-game"));
    await view.findByTestId("chapter-ending-prose");
    expect(view.getByRole("heading", { level: 1, name: ui[locale].captured })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(view.container.querySelector(".story-panel")));
    expect((await scan()).violations).toEqual([]);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(saved);
    fireEvent.click(view.getByRole("button", { name: new RegExp(ui[locale].restart) }));
    await view.findByTestId("commit-selected");
    expect(view.queryByTestId("chapter-ending-prose")).toBeNull();
    expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBeNull();
    expect((await scan()).violations).toEqual([]);
  });

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
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(await view.findByTestId("commit-selected"));
    await view.findByTestId("resolution");
    expect((await scan()).violations).toEqual([]);
    fireEvent.click(await view.findByText("What changed"));
    expect((await scan()).violations).toEqual([]);
  });
});
