// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createDevelopmentCrossingDriver, DEVELOPMENT_CROSSING_KEY } from "./development-crossing";

vi.mock("./components/ThreeBackdrop", () => ({ ThreeBackdrop: () => <div /> }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("shi.chapter-01.seed.v1", "0");
  localStorage.setItem("shi.chapter-01.save.v6", "unchanged release save");
  localStorage.setItem("shi.onboarding.field-guide.v1", "complete");
  localStorage.setItem("shi.locale", "en");
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
  Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [] });
  Object.defineProperty(document, "fonts", { configurable: true, value: { load: async () => [], check: () => true } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function opening(view: ReturnType<typeof render>) {
  fireEvent.click(view.getByTestId("begin-game"));
  for (const id of ["read-the-names", "issue-grain-tallies"]) {
    await view.findByTestId("commit-selected");
    fireEvent.click(view.container.querySelector(`[data-choice-id='${id}']`)!);
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(await view.findByTestId("resolution-continue"));
    await waitFor(() => expect(view.queryByTestId("resolution")).toBeNull());
  }
}

describe("crossing campaign in the real App shell", () => {
  it("renders the actual second-edition promise and personal reaction after a costly crossing and reload", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const olderKeys = ["shi.chen-council.v1", "shi.fanyang-guarantee.v1", "shi.dev.chen-retreat.v1"];
    for (const key of olderKeys) localStorage.setItem(key, `preserved ${key}`);
    let driver = createDevelopmentCrossingDriver(localStorage, 2);
    let view = render(<App developmentCrossing={driver} />);
    await opening(view);
    expect(view.getByTestId("decision-inspector").textContent).toContain("actual crossing result decides");
    fireEvent.click(view.container.querySelector("[data-choice-id='families-first']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    const board = await view.findByTestId("engagement-board");
    for (const id of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) {
      fireEvent.click(board.querySelector(`[data-engagement-command='${id}']`)!);
    }
    fireEvent.click(view.getByTestId("engagement-return"));
    const reaction = await view.findByTestId("resolution");
    const saved = driver.getCrossingRecord()!;
    expect(reaction.textContent).toContain(saved.summary.en);
    expect(view.getByTestId("commitment-resolution").closest("details")).toBeNull();
    expect(view.getByTestId("commitment-resolution").closest("[data-testid=consequence-character]")).not.toBeNull();
    expect(view.queryAllByTestId("commitment-resolution")).toHaveLength(1);
    expect(driver.getCrossingCommitment()!.outcome.status).toBe("strained");
    view.unmount();
    driver = createDevelopmentCrossingDriver(localStorage, 2);
    view = render(<App developmentCrossing={driver} />);
    fireEvent.click(view.getByTestId("begin-game"));
    expect((await view.findByTestId("resolution")).textContent).toContain(saved.summary.en);
    fireEvent.click(view.getByTestId("resolution-continue"));
    await waitFor(() => expect(view.queryByTestId("resolution")).toBeNull());
    fireEvent.click(view.getByTestId("record-toggle"));
    expect((await view.findByTestId("crossing-record")).textContent).toContain(saved.summary.en);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(view.container.querySelector("[data-choice-id='root-in-villages']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(await view.findByTestId("resolution-continue"));
    fireEvent.click(await view.findByTestId("council-enter"));
    await view.findByTestId("chen-council");
    for (const id of ["defer-title", "joint-ledger", "one-command"]) {
      fireEvent.click(view.container.querySelector(`[data-council-choice='${id}']`)!);
      fireEvent.click(view.getByTestId("council-commit"));
      fireEvent.click(await view.findByTestId("council-continue"));
    }
    fireEvent.click(view.getByTestId("fanyang-enter"));
    await view.findByTestId("fanyang-scene");
    for (const id of ["public-safety", "guarded-escort", "accept-transfer"]) {
      fireEvent.click(view.container.querySelector(`[data-fanyang-choice='${id}']`)!);
      fireEvent.click(view.getByTestId("fanyang-commit"));
      fireEvent.click((await view.findByTestId("fanyang-response")).querySelector("button")!);
    }
    fireEvent.click(view.getByTestId("retreat-enter"));
    await view.findByTestId("retreat-scene");
    for (const id of ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"]) {
      fireEvent.click(view.container.querySelector(`[data-retreat-choice='${id}']`)!);
      expect((view.getByTestId("retreat-commit") as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(view.getByTestId("retreat-commit"));
      if (id === "keep-reserve") {
        const reaction = (await view.findByTestId("retreat-response")).textContent;
        const savedRetreat = localStorage.getItem(`${driver.interludeNamespace}.chen-retreat.v1`);
        view.unmount();
        driver = createDevelopmentCrossingDriver(localStorage, 2);
        view = render(<App developmentCrossing={driver} />);
        fireEvent.click(view.getByTestId("begin-game"));
        fireEvent.click(await view.findByTestId("council-enter"));
        fireEvent.click(await view.findByTestId("council-continue"));
        fireEvent.click(view.getByTestId("fanyang-enter"));
        fireEvent.click((await view.findByTestId("fanyang-response")).querySelector("button")!);
        fireEvent.click(view.getByTestId("retreat-enter"));
        expect((await view.findByTestId("retreat-response")).textContent).toBe(reaction);
        expect(localStorage.getItem(`${driver.interludeNamespace}.chen-retreat.v1`)).toBe(savedRetreat);
      }
      fireEvent.click((await view.findByTestId("retreat-response")).querySelector("button")!);
    }
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("together");
    for (const key of olderKeys) expect(localStorage.getItem(key)).toBe(`preserved ${key}`);
    for (const suffix of ["chen-council.v1", "fanyang-guarantee.v1", "chen-retreat.v1"]) {
      expect(localStorage.getItem(`${driver.interludeNamespace}.${suffix}`)).not.toBeNull();
    }
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe("unchanged release save");
  });
  it("plays, pauses, cold-resumes, commits once and continues to the matching Chen arrival", async () => {
    let driver = createDevelopmentCrossingDriver(localStorage);
    let view = render(<App developmentCrossing={driver} />);
    expect(view.getByTestId("crossing-development-notice").textContent).toContain("Existing release saves remain separate");
    await opening(view);
    expect(view.container.querySelector(".choice-card .effects")).toBeNull();
    expect(view.getByTestId("decision-inspector").textContent).toContain("actual cost depends");
    fireEvent.click(view.getByTestId("commit-selected"));
    let board = await view.findByTestId("engagement-board");
    expect(board.textContent).not.toContain("This exercise does not change the campaign");
    fireEvent.click(board.querySelector("[data-engagement-command]")!);
    expect(board.getAttribute("data-pulse-index")).toBe("1");
    expect(view.queryByTestId("cancel-crossing-plan")).toBeNull();
    const afterOrder = localStorage.getItem(DEVELOPMENT_CROSSING_KEY);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.getByTestId("resume-crossing")).toBeTruthy();
    expect(view.queryByTestId("commit-selected")).toBeNull();
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(afterOrder);
    view.unmount();
    driver = createDevelopmentCrossingDriver(localStorage);
    view = render(<App developmentCrossing={driver} />);
    fireEvent.click(view.getByTestId("begin-game"));
    board = await view.findByTestId("engagement-board");
    expect(board.getAttribute("data-pulse-index")).toBe("1");
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(afterOrder);
    while (board.getAttribute("data-completed") !== "true") fireEvent.click(board.querySelector("[data-engagement-command]")!);
    expect(view.queryByTestId("resolution")).toBeNull();
    expect(driver.restore()!.state.currentNodeId).toBe("broken-crossing");
    const outcomeSummary = board.querySelector(".engagement-outcome > p")!.textContent;
    fireEvent.click(view.getByTestId("engagement-return"));
    const reaction = await view.findByTestId("resolution");
    expect(reaction.textContent).toContain(outcomeSummary);
    expect(driver.restore()!.state.history).toHaveLength(3);
    view.unmount();
    driver = createDevelopmentCrossingDriver(localStorage);
    view = render(<App developmentCrossing={driver} />);
    fireEvent.click(view.getByTestId("begin-game"));
    expect((await view.findByTestId("resolution")).textContent).toContain(outcomeSummary);
    fireEvent.click(view.getByTestId("resolution-continue"));
    await waitFor(() => expect(view.queryByTestId("resolution")).toBeNull());
    const afterReaction = localStorage.getItem(DEVELOPMENT_CROSSING_KEY);
    fireEvent.click(view.getByTestId("record-toggle"));
    const record = await view.findByTestId("crossing-record");
    expect(record.textContent).toContain(outcomeSummary);
    expect(record.querySelectorAll("[data-crossing-record-command]")).toHaveLength(3);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(afterReaction);
    fireEvent.click(view.container.querySelector("[data-choice-id='root-in-villages']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(await view.findByTestId("resolution-continue"));
    await view.findByTestId("council-enter");
    fireEvent.click(view.getByTestId("council-enter"));
    const council = await view.findByTestId("chen-council");
    const resources = driver.restore()!.state.resources;
    expect(council.getAttribute("data-arrival")).toBe(resources.grain >= 45 ? "supplied" : resources.danger >= 65 ? "pressed" : "divided");
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe("unchanged release save");
  });

  it("shows failed writes in the battle and retries without losing or duplicating a command", async () => {
    let fail = false;
    const driver = createDevelopmentCrossingDriver({
      getItem: key => localStorage.getItem(key),
      setItem(key, value) { if (fail) throw new Error("Storage full"); localStorage.setItem(key, value); },
    });
    const view = render(<App developmentCrossing={driver} />);
    await opening(view);
    fireEvent.click(view.getByTestId("commit-selected"));
    const board = await view.findByTestId("engagement-board");
    const saved = localStorage.getItem(DEVELOPMENT_CROSSING_KEY);
    fail = true;
    fireEvent.click(board.querySelector("[data-engagement-command]")!);
    expect(board.getAttribute("data-pulse-index")).toBe("0");
    expect(view.getByRole("alert").textContent).toContain("Progress has not advanced");
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(saved);
    fail = false;
    fireEvent.click(board.querySelector("[data-engagement-command]")!);
    expect(board.getAttribute("data-pulse-index")).toBe("1");
    expect(view.queryByRole("alert")).toBeNull();
    expect(driver.getEngagement()!.history).toHaveLength(1);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe("unchanged release save");
  });

  it("lets the player change plans before an order without changing campaign resources", async () => {
    const driver = createDevelopmentCrossingDriver(localStorage);
    const view = render(<App developmentCrossing={driver} />);
    await opening(view);
    const resources = driver.restore()!.state.resources;
    fireEvent.click(view.getByTestId("commit-selected"));
    fireEvent.click(await view.findByTestId("cancel-crossing-plan"));
    expect(view.queryByTestId("engagement-board")).toBeNull();
    expect(driver.restore()!.state.resources).toEqual(resources);
    fireEvent.click(view.container.querySelector("[data-choice-id='repair-the-ford']")!);
    fireEvent.click(view.getByTestId("commit-selected"));
    expect((await view.findByTestId("engagement-board")).getAttribute("data-plan-id")).toBe("repair-the-ford");
  });

  it("keeps a reaction visible when its acknowledgement fails and allows the same Continue control to retry", async () => {
    let fail = false;
    const driver = createDevelopmentCrossingDriver({
      getItem: key => localStorage.getItem(key),
      setItem(key, value) { if (fail) throw new Error("Storage full"); localStorage.setItem(key, value); },
    });
    const view = render(<App developmentCrossing={driver} />);
    fireEvent.click(view.getByTestId("begin-game"));
    fireEvent.click(await view.findByTestId("commit-selected"));
    await view.findByTestId("resolution");
    const saved = localStorage.getItem(DEVELOPMENT_CROSSING_KEY);
    fail = true;
    fireEvent.click(view.getByTestId("resolution-continue"));
    expect(view.getByTestId("resolution")).toBeTruthy();
    expect(view.getByRole("alert").closest("details")).toBeNull();
    expect(localStorage.getItem(DEVELOPMENT_CROSSING_KEY)).toBe(saved);
    fail = false;
    fireEvent.click(view.getByTestId("resolution-continue"));
    await waitFor(() => expect(view.queryByTestId("resolution")).toBeNull());
    expect(driver.restore()!.resolution).toBeNull();
  });
});
