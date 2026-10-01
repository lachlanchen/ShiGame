// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import type { RefugeContactEntry } from "@shi/game-core";
import * as persistence from "../persistence";
import { RefugeContactScene } from "./RefugeContactScene";

const entry = (location: RefugeContactEntry["location"], records: RefugeContactEntry["records"] = "carry-records"): RefugeContactEntry => ({
  version: 1, id: JSON.stringify([location, records]), location, records,
  identityEvidence: records === "carry-records" ? "held-records" : records === "divide-records" ? "distributed-records" : "anonymized",
  promise: location === "household" ? "kept" : "broken", localContact: location === "household" ? "holds-word" : "refused",
  commonGrain: 2, debts: [], companionPresence: "unestablished", messageDelivery: "not-entrusted", witnessAccount: "not-questioned",
});
const props = (input: RefugeContactEntry) => ({ entry: input, saveNamespace: "shi.contact-test", reducedMotion: true, onClose: vi.fn(), onSavingChange: vi.fn() });
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("contact encounter", () => {
  it.each([
    ["household", "leave-route", "已托付去处口信"], ["household", "leave-record", "已托付一笔核对记录"],
    ["river-approach", "ask-unprompted", "取得未受凭记提示的陈述"], ["river-approach", "show-record", "不是独立印证"],
  ] as const)("plays and reloads %s / %s without inventing delivery or reunion", async (location, order, expected) => {
    const input = props(entry(location)); let view = render(<RefugeContactScene {...input} />);
    await view.findByTestId("contact-commit");
    fireEvent.click(view.container.querySelector(`[data-contact-choice="${order}"]`)!);
    expect(localStorage.length).toBe(0);
    fireEvent.click(view.getByTestId("contact-commit"));
    expect((await view.findByTestId("contact-response")).textContent).toContain(expected);
    expect(view.queryByTestId("contact-commit")).toBeNull();
    const key = Object.keys(localStorage)[0]!, bytes = localStorage.getItem(key);
    view.unmount(); view = render(<RefugeContactScene {...input} />);
    expect((await view.findByTestId("contact-response")).textContent).toContain(expected);
    expect(localStorage.getItem(key)).toBe(bytes);
    expect(JSON.parse(bytes!).order).toBe(order);
    fireEvent.click(view.getByTestId("contact-open-followup"));
    await view.findByTestId("followup-commit");
    expect(localStorage.getItem(key)).toBe(bytes);
    fireEvent.click(view.getByTestId("followup-back"));
    await view.findByTestId("contact-response");
  });
  it.each(["divide-records", "strip-identities"] as const)("keeps a useful non-identifying path for %s", async records => {
    const view = render(<RefugeContactScene {...props(entry("river-approach", records))} />);
    await view.findByTestId("contact-commit");
    fireEvent.click(view.container.querySelector('[data-contact-choice="show-record"]')!);
    expect((view.getByTestId("contact-commit") as HTMLButtonElement).disabled).toBe(true);
    expect(view.getByTestId("contact-unavailable").textContent).toContain("身份不会恢复");
    fireEvent.click(view.container.querySelector('[data-contact-choice="ask-unprompted"]')!);
    fireEvent.click(view.getByTestId("contact-commit"));
    expect((await view.findByTestId("contact-response")).textContent).toContain("没有在旁边填上任何人的名字");
  });
  it("has accessible controls, blocks duplicate/busy input, rolls back failure, and retries", async () => {
    const input = props(entry("household")), view = render(<RefugeContactScene {...input} />);
    await view.findByTestId("contact-commit");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    let fail!: (reason: Error) => void;
    const flush = vi.spyOn(persistence, "flushPersistence").mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("contact-commit")); fireEvent.click(view.getByTestId("contact-commit"));
    fireEvent.keyDown(view.getByTestId("refuge-contact"), { key: "Escape" });
    expect(input.onClose).not.toHaveBeenCalled(); expect(flush).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId("contact-response")).toBeNull();
    await act(async () => fail(new Error("disk full")));
    await view.findByRole("alert"); expect(localStorage.length).toBe(0);
    fireEvent.click(view.getByTestId("contact-commit")); await view.findByTestId("contact-response");
    expect(input.onSavingChange.mock.calls.map(call => call[0])).toEqual([true, false, true, false]);
  });
  it("preserves a corrupt contact save instead of silently resetting it", async () => {
    const input = props(entry("household")); let view = render(<RefugeContactScene {...input} />);
    await view.findByTestId("contact-commit"); fireEvent.click(view.getByTestId("contact-commit")); await view.findByTestId("contact-response");
    const key = Object.keys(localStorage)[0]!; localStorage.setItem(key, "corrupt");
    view.unmount(); view = render(<RefugeContactScene {...input} />);
    expect((await view.findByRole("alert")).textContent).toContain("原存档保留");
    expect(view.queryByTestId("contact-commit")).toBeNull(); expect(localStorage.getItem(key)).toBe("corrupt");
  });
});
