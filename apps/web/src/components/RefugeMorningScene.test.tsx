// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { createRefuge, resolveRefuge, type RefugeEntry, type RefugeOrder } from "@shi/game-core";
import * as persistence from "../persistence";
import { RefugeMorningScene } from "./RefugeMorningScene";

const entry: RefugeEntry = { version: 1, id: "verified-night-test", retreatOutcome: "remnant", custody: "common",
  recordedGrain: 3, spendableCommonGrain: 3, debts: [], records: "strip-identities", priorOrders: [], companionPresence: "unestablished" };
const props = (order: RefugeOrder = "offer-labour") => ({ night: resolveRefuge(createRefuge(entry), order),
  nightHash: "a".repeat(64), reducedMotion: true, onClose: vi.fn(), onSavingChange: vi.fn(), saveNamespace: "shi.morning-test" });
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("morning continuation", () => {
  it.each(["offer-grain", "offer-labour", "sleep-outside"] as const)("remembers %s without inventing a promise, preserves the night, and reloads", async order => {
    const input = props(order), before = JSON.stringify(input.night);
    let view = render(<RefugeMorningScene {...input} />);
    await view.findByTestId("morning-commit");
    fireEvent.click(view.container.querySelector('[data-morning-choice="follow-witness"]')!);
    expect(view.getByTestId("morning-preview").textContent).toContain(order === "offer-labour" ? "已失信" : "不记作失信");
    expect(localStorage.length).toBe(0);
    fireEvent.click(view.getByTestId("morning-commit"));
    const response = await view.findByTestId("morning-response");
    expect(response.textContent).toContain("河边人的身份仍待核实");
    expect(response.textContent).toContain(order === "offer-labour" ? "别再让我替你应下别的" : "不记作失信");
    const saved = localStorage.getItem(Object.keys(localStorage)[0]!);
    expect(JSON.stringify(input.night)).toBe(before);
    view.unmount(); view = render(<RefugeMorningScene {...input} />);
    expect((await view.findByTestId("morning-response")).textContent).toContain("已跟上过路人");
    expect(localStorage.getItem(Object.keys(localStorage)[0]!)).toBe(saved);
  });
  it("keeps the promise but loses the passing witness, with accessible controls", async () => {
    const view = render(<RefugeMorningScene {...props()} />);
    await view.findByTestId("morning-commit");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    fireEvent.click(view.getByTestId("morning-commit"));
    const result = await view.findByTestId("morning-response");
    expect(result.textContent).toContain("补漏之约已履行");
    expect(result.textContent).toContain("过路人已经离开");
    expect(result.textContent).toContain("具体话语尚未托付");
    expect(view.queryByTestId("morning-commit")).toBeNull();
  });
  it("rolls back a rejected save, blocks duplicate input and Escape while committing, then retries", async () => {
    const input = props(), view = render(<RefugeMorningScene {...input} />);
    await view.findByTestId("morning-commit");
    let fail!: (reason: Error) => void;
    const flush = vi.spyOn(persistence, "flushPersistence").mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("morning-commit"));
    fireEvent.click(view.getByTestId("morning-commit"));
    fireEvent.keyDown(view.getByTestId("refuge-morning"), { key: "Escape" });
    expect(input.onClose).not.toHaveBeenCalled(); expect(flush).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId("morning-response")).toBeNull();
    await act(async () => fail(new Error("disk full")));
    expect((await view.findByRole("alert")).textContent).toContain("未能保存");
    expect(localStorage.length).toBe(0);
    fireEvent.click(view.getByTestId("morning-commit"));
    await view.findByTestId("morning-response");
    expect(input.onSavingChange.mock.calls.map(call => call[0])).toEqual([true, false, true, false]);
  });
  it("preserves a corrupt saved morning and refuses to overwrite it", async () => {
    const input = props(); let view = render(<RefugeMorningScene {...input} />);
    await view.findByTestId("morning-commit"); fireEvent.click(view.getByTestId("morning-commit"));
    await view.findByTestId("morning-response");
    const key = Object.keys(localStorage)[0]!; localStorage.setItem(key, "corrupt");
    view.unmount(); view = render(<RefugeMorningScene {...input} />);
    expect((await view.findByRole("alert")).textContent).toContain("原存档保留");
    expect(view.queryByTestId("morning-commit")).toBeNull();
    expect(localStorage.getItem(key)).toBe("corrupt");
  });
});
