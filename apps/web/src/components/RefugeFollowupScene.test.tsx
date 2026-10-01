// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import type { FollowupEntry } from "@shi/game-core";
import * as persistence from "../persistence";
import { RefugeFollowupScene } from "./RefugeFollowupScene";
const entry = (lead: FollowupEntry["contact"]["nextLead"], grain = 2): FollowupEntry => ({
  id: JSON.stringify([lead, grain]), contact: { entryId: "contact", order: lead === "return-at-sunset" ? "leave-record" : lead === "reed-bank-alone" ? "ask-unprompted" : "show-record",
    commonGrain: grain, records: "carry-records", debts: [{ id: "debt", creditor: "local-grain-holder", grain: 2 }],
    promise: "broken", localContact: "refused", companionPresence: "unestablished", nextLead: lead,
    disclosure: lead === "reed-bank-alone" ? "none" : "identifying-record",
    message: lead === "return-at-sunset" ? "record-entrusted" : "not-entrusted",
    evidence: lead === "return-at-sunset" ? "none" : lead === "reed-bank-alone" ? "unprompted-account" : "prompted-account" },
});
const props = (lead: FollowupEntry["contact"]["nextLead"], grain = 2) => ({ entry: entry(lead, grain), reducedMotion: true,
  onClose: vi.fn(), onSavingChange: vi.fn() });
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); localStorage.setItem("previous-contact", "untouched"); });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("refuge inquiry payoff", () => {
  it.each(["return-at-sunset", "reed-bank-alone", "ferry-with-guide"] as const)("plays both choices after %s and reloads without spending twice", async lead => {
    for (const order of ["share-ration", "walk-to-ferry"]) {
      const input = props(lead); let view = render(<RefugeFollowupScene {...input} />);
      await view.findByTestId("followup-commit");
      fireEvent.click(view.container.querySelector(`[data-followup-choice="${order}"]`)!);
      if (lead === "ferry-with-guide" && order === "walk-to-ferry") {
        expect(view.getByTestId("refuge-followup").textContent).toContain("你们已经在渡口");
        expect(view.getByTestId("refuge-followup").textContent).not.toContain("陪他赶到渡口");
      }
      expect(localStorage.length).toBe(1);
      expect(view.getByTestId("followup-preview").textContent).toContain(order === "share-ration" ? "2 → 1" : "2 → 2");
      fireEvent.click(view.getByTestId("followup-commit"));
      expect((await view.findByTestId("followup-response")).textContent).toContain(order === "share-ration" ? "不必再抱着湿鞋过夜" : "他没有再独自走");
      const key = Object.keys(localStorage).find(key => key.includes("refuge-followup"))!, saved = localStorage.getItem(key);
      expect(JSON.parse(saved!).order).toBe(order);
      view.unmount(); view = render(<RefugeFollowupScene {...input} />);
      await view.findByTestId("followup-response");
      expect(view.getByTestId("followup-grain").textContent).toContain(order === "share-ration" ? "1" : "2");
      expect(localStorage.getItem(key)).toBe(saved);
      expect(localStorage.getItem("previous-contact")).toBe("untouched");
      expect(view.getByTestId("refuge-followup").textContent).toContain("仍欠本地粮主 2");
      expect(view.queryByTestId("followup-commit")).toBeNull();
      view.unmount(); localStorage.removeItem(key);
    }
  });
  it.each(["return-at-sunset", "reed-bank-alone", "ferry-with-guide"] as const)("keeps a zero-food route available after %s and never erases broken trust", async lead => {
    const view = render(<RefugeFollowupScene {...props(lead, 0)} />);
    await view.findByTestId("followup-commit");
    fireEvent.click(view.container.querySelector('[data-followup-choice="share-ration"]')!);
    expect((view.getByTestId("followup-commit") as HTMLButtonElement).disabled).toBe(true);
    expect(view.getByTestId("followup-unavailable").textContent).toContain("已分给别人的粮");
    expect(view.getByTestId("followup-unavailable").textContent).toContain("仍可陪来者问船");
    fireEvent.click(view.container.querySelector('[data-followup-choice="walk-to-ferry"]')!);
    fireEvent.click(view.getByTestId("followup-commit")); await view.findByTestId("followup-response");
    expect(view.getByTestId("followup-grain").textContent).toContain("0");
    expect(view.getByTestId("refuge-followup").textContent).toContain("补漏失约仍在");
  });
  it("blocks duplicate and busy navigation, rolls back a failed save and retries", async () => {
    const input = props("ferry-with-guide"), view = render(<RefugeFollowupScene {...input} />);
    await view.findByTestId("followup-commit");
    let fail!: (error: Error) => void;
    const flush = vi.spyOn(persistence, "flushPersistence").mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("followup-commit")); fireEvent.click(view.getByTestId("followup-commit"));
    fireEvent.keyDown(view.getByTestId("refuge-followup"), { key: "Escape" });
    expect(input.onClose).not.toHaveBeenCalled(); expect(flush).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId("followup-response")).toBeNull();
    await act(async () => fail(new Error("disk full"))); await view.findByRole("alert");
    expect(localStorage.length).toBe(1);
    fireEvent.click(view.getByTestId("followup-commit")); await view.findByTestId("followup-response");
    expect(input.onSavingChange.mock.calls.map(call => call[0])).toEqual([true, false, true, false]);
  });
  it("preserves corrupt records and allows reading back without resetting them", async () => {
    const input = props("return-at-sunset"); let view = render(<RefugeFollowupScene {...input} />);
    await view.findByTestId("followup-commit"); fireEvent.click(view.getByTestId("followup-commit")); await view.findByTestId("followup-response");
    const key = Object.keys(localStorage).find(key => key.includes("refuge-followup"))!;
    localStorage.setItem(key, "corrupt"); view.unmount(); view = render(<RefugeFollowupScene {...input} />);
    await view.findByRole("alert"); expect(view.queryByTestId("followup-commit")).toBeNull();
    fireEvent.click(view.getByTestId("followup-back")); expect(input.onClose).toHaveBeenCalledOnce();
    expect(localStorage.getItem(key)).toBe("corrupt");
  });
  it("provides a semantic dialog, predictable keyboard focus and no motion requirement", async () => {
    const view = render(<RefugeFollowupScene {...props("return-at-sunset")} />);
    await view.findByTestId("followup-commit");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    const back = view.getByTestId("followup-back"); back.focus(); fireEvent.keyDown(back, { key: "Tab" });
    expect(document.activeElement).toBe(view.getByRole("button", { name: "回看问讯" }));
    expect(view.getByTestId("refuge-followup").getAttribute("data-motion")).toBe("reduced");
  });
});
