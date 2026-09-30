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
  it("remembers the replayed council's grain account and command choice in later scenes", async () => {
    const input = props();
    const before = JSON.stringify(input.entry);
    const view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-council-memory").textContent).toContain("共验时分给他的账");
    expect(view.queryByText(/上回不是等来了商队/)).toBeNull();
    await choose(view, "decline-dispatch");
    expect(view.queryByTestId("retreat-council-memory")).toBeNull();
    await choose(view, "gather-own");
    expect(view.getByTestId("retreat-council-memory").textContent).toContain("当初出城只传一道令");
    expect(view.queryByText(/当初说留在陈地/)).toBeNull();
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByTestId("retreat-council-memory").textContent).toContain("当初出城只传一道令");
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    expect(JSON.stringify(input.entry)).toBe(before);
  });

  it("pays off reception and escort with a witnessed reunion after resume, even with identities removed", async () => {
    const input = props();
    input.entry = structuredClone(input.entry);
    // Explicit capacity fixture; do not claim this is a canonical prior route.
    input.entry.fanyang.metrics = { ...input.entry.fanyang.metrics, grain: 8, tempo: 8, city: 8, allies: 8, veterans: 8 };
    const view = render(<RetreatScene {...input} />);
    for (const id of ["keep-reserve", "open-reception", "escort-households", "strip-identities"]) await choose(view, id);
    expect(view.getByText("阿衡。我还当你走了另一条路。", { exact: false })).toBeTruthy();
    expect(view.getByText(/其他失散者仍没有消息/)).toBeTruthy();
    expect(view.getByText(/没有补写那些被去掉的名字/)).toBeTruthy();
    const saved = localStorage.getItem(retreatSaveKey);
    view.unmount();
    const restored = render(<RetreatScene {...input} />);
    fireEvent.click(within(restored.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    expect(restored.getByText(/亲眼见到了人/)).toBeTruthy();
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    await choose(restored, "release-groups");
    expect(restored.getByTestId("retreat-outcome")).toBeTruthy();
  });

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

  it("saves borrowed grain and its debt together, rolls back failure, and preserves the debt after resume and dispersal", async () => {
    const supported = structuredClone(entry);
    for (const key of ["tempo", "city", "allies", "veterans"] as const) supported.fanyang.metrics[key] = 6;
    supported.fanyang.metrics.grain = 0;
    const input = { ...props(), entry: supported };
    let view = render(<RetreatScene {...input} />);
    await choose(view, "decline-dispatch");
    const before = localStorage.getItem(retreatSaveKey);
    fireEvent.click(view.container.querySelector('[data-retreat-choice="borrow-local-grain"]')!);
    expect(view.getByTestId("retreat-debt-preview").textContent).toContain("2 份粮秣");
    expect(view.queryByTestId("retreat-debts")).toBeNull();
    expect(localStorage.getItem(retreatSaveKey)).toBe(before);
    vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("loan save failed")).mockResolvedValue(undefined);
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem(retreatSaveKey)).toBe(before);
    expect(view.queryByTestId("retreat-debts")).toBeNull();
    fireEvent.click(view.getByTestId("retreat-commit"));
    await view.findByTestId("retreat-response");
    expect(view.getByTestId("retreat-debts").textContent).toContain("欠本地粮主 2 份粮秣");
    const saved = localStorage.getItem(retreatSaveKey);
    expect(JSON.parse(saved!).choices).toEqual(["decline-dispatch", "borrow-local-grain"]);
    view.unmount();
    view = render(<RetreatScene {...input} />);
    expect(view.getByTestId("retreat-response").textContent).toContain("粮补上了，欠契也留下了");
    expect(view.getByTestId("retreat-debts").querySelectorAll("p")).toHaveLength(1);
    expect(localStorage.getItem(retreatSaveKey)).toBe(saved);
    fireEvent.click(within(view.getByTestId("retreat-response")).getByRole("button", { name: /继续/ }));
    for (const id of ["split-routes", "strip-identities", "release-groups"]) await choose(view, id);
    expect(view.getByTestId("retreat-outcome").getAttribute("data-outcome")).toBe("dispersed");
    expect(view.getByTestId("retreat-debts").textContent).toContain("分行不表示免责");
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
