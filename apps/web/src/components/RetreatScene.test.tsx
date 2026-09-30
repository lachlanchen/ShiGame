// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canChoose, councilEntry, createCouncil, createFanyang, createInitialState, encodeFanyangSnapshot, getNode,
  prepareFanyangEntry, prepareRetreatEntry, resolveChoice, resolveCouncil, resolveFanyang,
  type Campaign, type CouncilDefinition, type FanyangDefinition } from "@shi/game-core";
import campaignRaw from "../../../../content/campaigns/chapter-01-daze.json";
import councilRaw from "../../../../content/councils/chen-council.v1.json";
import fanyangRaw from "../../../../content/councils/fanyang-guarantee.v1.json";
import councilHash from "../generated/chen-council.v1.sha256?raw";
import fanyangReview from "../../../../content/research/fanyang-entry-review.v1.json";
import { encodeCouncilSnapshot } from "../council-snapshot";
import * as persistence from "../persistence";
import { ChenCouncil } from "./ChenCouncil";
import { RetreatScene, retreatSaveKey } from "./RetreatScene";

const definitions = { campaign: campaignRaw as Campaign, council: councilRaw as CouncilDefinition, fanyang: fanyangRaw as FanyangDefinition };
let chapter = createInitialState(definitions.campaign, 0);
while (!chapter.completed) chapter = resolveChoice(definitions.campaign, chapter, getNode(definitions.campaign, chapter.currentNodeId).choices.find(choice => canChoose(choice, chapter.resources))!.id).state;
let council = createCouncil(definitions.council, councilEntry(chapter)!);
for (const choice of ["defer-title", "joint-ledger", "one-command"]) council = resolveCouncil(definitions.council, council, choice);
const councilSnapshot = encodeCouncilSnapshot(council, councilHash.trim());
const fanyangEntry = prepareFanyangEntry(definitions.council, chapter, JSON.parse(councilSnapshot), councilHash.trim())!;
let fanyang = createFanyang(definitions.fanyang, fanyangEntry);
for (const choice of ["public-safety", "hold-talks", "withdraw-envoy"]) fanyang = resolveFanyang(definitions.fanyang, fanyang, choice);
const fanyangSnapshot = encodeFanyangSnapshot(fanyang, fanyangReview.contentSHA256);
const entry = prepareRetreatEntry(definitions, { chapter, council: JSON.parse(councilSnapshot), fanyang: JSON.parse(fanyangSnapshot) },
  { campaign: "a".repeat(64), council: councilHash.trim(), fanyang: fanyangReview.contentSHA256 })!;
const props = () => ({ entry, rulesHash: "b".repeat(64), storyHash: "c".repeat(64), reducedMotion: true, onClose: vi.fn(), onSavingChange: vi.fn() });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function choose(view: ReturnType<typeof render>, id: string) {
  fireEvent.click(view.container.querySelector(`[data-retreat-choice="${id}"]`)!);
  fireEvent.click(view.getByTestId("retreat-commit"));
  const response = await view.findByTestId("retreat-response");
  fireEvent.click(within(response).getByRole("button", { name: /继续/ }));
}

describe("retreat development scene", () => {
  it("keeps authoring caveats in optional notes and explains the active choice in Chinese", () => {
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByText("陈地，收发粮秣的院落。北方的文书辗转抵达，西边的催援也到了。")).toBeTruthy();
    expect(view.getByText(/付出一份粮秣，把答应的粮车送出/)).toBeTruthy();
    expect(view.container.querySelector(".chen-main")?.textContent).not.toContain("成文和抵达时间分别待历史校对");
    const notes = view.getByText("史料与开发说明").closest("details")!;
    expect(notes.open).toBe(false);
    expect(notes.textContent).toContain("成文和抵达时间分别待历史校对");
    expect(view.queryByText("Supply the agreed grain convoy but retain an escort reserve; partners receive less support than requested.")).toBeNull();
  });

  it("plays five decisions to an ending without touching previous episode saves", async () => {
    localStorage.setItem("shi.chen-council.v1", councilSnapshot);
    localStorage.setItem("shi.fanyang-guarantee.v1", fanyangSnapshot);
    const view = render(<RetreatScene {...props()} />);
    for (const id of ["decline-dispatch", "gather-own", "split-routes", "carry-records", "release-groups"]) await choose(view, id);
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("dispersed");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toHaveLength(5);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(councilSnapshot);
    expect(localStorage.getItem("shi.fanyang-guarantee.v1")).toBe(fanyangSnapshot);
  });

  it("restores the saved reaction without submitting or skipping the order", async () => {
    const input = props(), view = render(<RetreatScene {...input} />);
    await choose(view, "decline-dispatch");
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const restored = render(<RetreatScene {...input} />);
    expect(restored.getByTestId("retreat-response").textContent).toContain("没有新的车队出发");
    expect(document.activeElement).toBe(within(restored.getByTestId("retreat-response")).getByRole("heading"));
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
  });

  it("waits for durable storage and blocks duplicate commits and exits", async () => {
    let finish!: () => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    const input = props(), view = render(<RetreatScene {...input} />);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="decline-dispatch"]')!);
    fireEvent.click(view.getByTestId("retreat-commit")); fireEvent.click(view.getByTestId("retreat-commit"));
    fireEvent.keyDown(view.getByTestId("retreat-scene"), { key: "Escape" });
    expect(view.queryByTestId("retreat-response")).toBeNull();
    expect(input.onClose).not.toHaveBeenCalled();
    expect(input.onSavingChange).toHaveBeenLastCalledWith(true);
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual(["decline-dispatch"]);
    await act(async () => finish());
    await view.findByTestId("retreat-response");
    expect(input.onSavingChange).toHaveBeenLastCalledWith(false);
  });

  it("rolls back a failed write and retries one order", async () => {
    vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("storage failure")).mockResolvedValue(undefined);
    const view = render(<RetreatScene {...props()} />);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="decline-dispatch"]')!);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem(retreatSaveKey)).toBeNull();
    expect(view.queryByTestId("retreat-response")).toBeNull();
    await choose(view, "decline-dispatch");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual(["decline-dispatch"]);
  });

  it("preserves incompatible data until explicit restart and supports cancellation", async () => {
    localStorage.setItem(retreatSaveKey, "unreadable original");
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByRole("alert")).toBeTruthy();
    expect((view.getByTestId("retreat-commit") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "重开本段…" }));
    fireEvent.click(view.getByRole("button", { name: "取消" }));
    expect(localStorage.getItem(retreatSaveKey)).toBe("unreadable original");
    fireEvent.click(view.getByRole("button", { name: "重开本段…" }));
    fireEvent.click(view.getByRole("button", { name: "确认重开" }));
    await view.findByTestId("retreat-commit");
    expect(JSON.parse(localStorage.getItem(retreatSaveKey)!).choices).toEqual([]);
  });

  it("previews scattering and never substitutes the peaceful dispersion response", async () => {
    const input = props(), empty = structuredClone(entry);
    for (const key of ["grain", "tempo", "city", "allies", "veterans"] as const) empty.fanyang.metrics[key] = 0;
    const view = render(<RetreatScene {...input} entry={empty} />);
    for (const id of ["decline-dispatch", "gather-own", "split-routes", "carry-records"]) await choose(view, id);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="release-groups"]')!);
    expect(view.getByTestId("retreat-preview").getAttribute("data-outcome")).toBe("scattered");
    fireEvent.click(view.getByTestId("retreat-commit"));
    const response = await view.findByTestId("retreat-response");
    expect(response.textContent).toContain("账还没核完");
    expect(response.textContent).not.toContain("愿结伴的结伴");
    fireEvent.click(within(response).getByRole("button", { name: /继续/ }));
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("scattered");
  });

  it("has a named Chinese dialog, keyboard focus wrapping and no automatic semantic violations", async () => {
    const view = render(<RetreatScene {...props()} />);
    expect(view.getByRole("dialog").getAttribute("lang")).toBe("zh-Hans");
    const close = view.getByRole("button", { name: "返回范阳" }); close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(view.getByRole("button", { name: "重开本段…" }));
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("enters from the real Chen and Fan Yang flow using hashes of actual canonical bytes", async () => {
    vi.stubGlobal("crypto", webcrypto);
    localStorage.setItem("shi.chen-council.v1", councilSnapshot);
    localStorage.setItem("shi.fanyang-guarantee.v1", fanyangSnapshot);
    const view = render(<ChenCouncil origin={chapter} locale="en" reducedMotion onCue={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(view.getByTestId("council-continue"));
    fireEvent.click(view.getByTestId("fanyang-enter"));
    fireEvent.click(within(view.getByTestId("fanyang-response")).getByRole("button", { name: /Continue/ }));
    fireEvent.click(view.getByTestId("retreat-enter"));
    await view.findByTestId("retreat-scene");
    await choose(view, "decline-dispatch");
    const saved = JSON.parse(localStorage.getItem(retreatSaveKey)!);
    expect(saved.rulesSHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.storySHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.choices).toEqual(["decline-dispatch"]);
  });
});
