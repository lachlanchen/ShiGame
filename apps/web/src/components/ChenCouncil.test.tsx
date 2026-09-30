// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { canChoose, councilCanChoose, councilEntry, councilMetricKeys, councilReadiness, createCouncil, createInitialState, getNode, resolveChoice, resolveCouncil, type Campaign, type CouncilDefinition, type CouncilState } from "@shi/game-core";
import { encodeCouncilSnapshot } from "../council-snapshot";
import raw from "../../../../content/campaigns/chapter-01-daze.json";
import { ChenCouncil } from "./ChenCouncil";
import * as persistence from "../persistence";
import rawFingerprint from "../generated/chen-council.v1.sha256?raw";
import rawCouncilData from "../generated/chen-council.v1.json";

const councilData = rawCouncilData as CouncilDefinition;

const campaign = raw as Campaign;
function origin() {
  let state = createInitialState(campaign, 0);
  while (!state.completed) state = resolveChoice(campaign, state, getNode(campaign, state.currentNodeId).choices.find(choice => canChoose(choice, state.resources))!.id).state;
  return state;
}
const props = () => ({ origin: origin(), locale: "en" as const, reducedMotion: false, onCue: vi.fn(), onClose: vi.fn() });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("Chen council presentation", () => {
  it("brings the saved reaction and next question into view without a new decision", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
    try {
      const view = render(<ChenCouncil {...props()} />);
      const commit = view.container.querySelector<HTMLButtonElement>('[data-council-action="commit"]')!;
      expect(commit).not.toBeNull();
      fireEvent.click(commit);
      await waitFor(() => expect(view.queryByTestId("council-response")).not.toBeNull());
      const reaction = within(view.getByTestId("council-response")).getByRole("heading", { level: 3 });
      expect(document.activeElement).toBe(reaction);
      expect(scroll.mock.instances.at(-1)).toBe(reaction);
      expect(scroll).toHaveBeenLastCalledWith({ block: "start", behavior: "instant" });
      const saved = localStorage.getItem("shi.chen-council.v1");
      fireEvent.click(view.getByTestId("council-continue"));
      expect(document.activeElement?.tagName).toBe("H3");
      expect(document.activeElement).not.toBe(reaction);
      expect(scroll.mock.instances.at(-1)).toBe(document.activeElement);
      expect(localStorage.getItem("shi.chen-council.v1")).toBe(saved);
    } finally {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", descriptor);
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });
  it.each(["common-front", "city-stronghold", "fragile-coalition", "empty-granaries"])("explains %s from the saved result without writing a choice", async outcome => {
    const input = props();
    let ending: CouncilState | undefined;
    function visit(state: CouncilState): CouncilState | undefined {
      if (state.completed) return state.outcome === outcome ? state : undefined;
      for (const choice of councilData.rounds[state.history.length]!.choices) {
        if (!councilCanChoose(state, choice)) continue;
        const found = visit(resolveCouncil(councilData, state, choice.id));
        if (found) return found;
      }
    }
    for (const [grain, danger] of [[50, 10], [20, 80], [30, 10]]) {
      input.origin = { ...input.origin, resources: { ...input.origin.resources, grain: grain!, danger: danger! } };
      ending = visit(createCouncil(councilData, councilEntry(input.origin)!));
      if (ending) break;
    }
    expect(ending).toBeDefined();
    const saved = encodeCouncilSnapshot(ending!, rawFingerprint.trim());
    localStorage.setItem("shi.chen-council.v1", saved);
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const view = render(<ChenCouncil {...input} />);
    expect(view.queryByTestId("council-readiness")).toBeNull();
    fireEvent.click(view.getByTestId("council-continue"));
    const report = view.getByTestId("council-readiness");
    expect(view.getByTestId("council-outcome").getAttribute("data-outcome")).toBe(outcome);
    for (const check of councilReadiness(ending!.metrics).checks) {
      const row = report.querySelector(`[data-requirement='${check.id}']`)!;
      expect(row.getAttribute("data-met")).toBe(String(check.met));
      expect(row.textContent).toContain(`${check.value} ${check.met ? "≥" : "<"} ${check.required}`);
    }
    view.rerender(<ChenCouncil {...input} locale="zh-Hans" />);
    expect(view.getByText("共同出兵的条件")).toBeTruthy();
    expect(view.getByText(/支持达到6的群体/)).toBeTruthy();
    expect(writes).not.toHaveBeenCalled();
    expect(input.onCue).not.toHaveBeenCalled();
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(saved);
  });
  it("retains the last reaction and promise consequences on completed-save resume without writing", async () => {
    const input = props();
    let view = render(<ChenCouncil {...input} />);
    const route = ["defer-title", "army-rations", "hold-chen"];
    for (const id of route) {
      fireEvent.click(view.container.querySelector(`[data-council-choice='${id}']`)!);
      fireEvent.click(view.getByTestId("council-commit"));
      await view.findByTestId("council-response");
      if (id !== "hold-chen") fireEvent.click(view.getByTestId("council-continue"));
    }
    const saved = localStorage.getItem("shi.chen-council.v1");
    const savedState = JSON.parse(saved!) as CouncilState;
    view.unmount();
    input.onCue.mockClear();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    view = render(<ChenCouncil {...input} />);
    const last = councilData.rounds[2]!.choices.find(choice => choice.id === "hold-chen")!;
    expect(within(view.getByTestId("council-response")).getByText(last.response.en)).toBeTruthy();
    const lastChanges = within(view.getByTestId("council-response")).getByTestId("council-saved-changes");
    for (const metric of councilMetricKeys) {
      const record = savedState.history[2]!;
      const delta = record.after[metric] - record.before[metric];
      expect(lastChanges.querySelector(`[data-saved-metric='${metric}']`)?.textContent).toBe(`${councilData.metrics[metric].title.en} ${record.before[metric]} → ${record.after[metric]} (${delta > 0 ? "+" : ""}${delta})`);
    }
    fireEvent.click(view.getByTestId("council-continue"));
    expect(view.getByTestId("council-outcome")).toBeTruthy();
    const journal = Array.from(view.container.querySelectorAll("details")).find(detail => detail.querySelector("summary")?.textContent === councilData.labels.journal!.en)!;
    const entries = journal.querySelectorAll("ol > li");
    expect(entries).toHaveLength(3);
    expect(entries[1]!.querySelector(".chen-promise-answer")).not.toBeNull();
    for (const [index, id] of route.entries()) {
      const choice = councilData.rounds[index]!.choices.find(item => item.id === id)!;
      const changes = within(entries[index] as HTMLElement).getByTestId("council-saved-changes");
      for (const metric of councilMetricKeys) {
        const record = savedState.history[index]!;
        const delta = record.after[metric] - record.before[metric];
        expect(changes.querySelector(`[data-saved-metric='${metric}']`)?.textContent).toBe(`${councilData.metrics[metric].title.en} ${record.before[metric]} → ${record.after[metric]} (${delta > 0 ? "+" : ""}${delta})`);
      }
      const answers = choice.answers ?? [];
      for (const answer of answers) {
        const matched = route.slice(0, index).includes(answer.afterChoice);
        expect(within(entries[index] as HTMLElement).queryByText(answer.text.en) !== null).toBe(matched);
      }
    }
    expect(writes).not.toHaveBeenCalled();
    expect(input.onCue).not.toHaveBeenCalled();
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(saved);
  });

  it("keeps the council and its resource list semantically accessible", async () => {
    document.documentElement.lang = "en";
    document.title = "SHI · Council review";
    render(<ChenCouncil {...props()} />);
    const result = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it("inspects without mutation, saves each commitment once, pauses and resumes", async () => {
    const input = props();
    const snapshot = JSON.stringify(input.origin);
    localStorage.setItem("shi.chapter-01.save.v6", snapshot);
    let view = render(<ChenCouncil {...input} />);
    expect(document.activeElement?.id).toBe("chen-title");
    fireEvent.click(view.container.querySelector("[data-council-choice='defer-title']")!);
    expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
    const commit = view.getByTestId("council-commit");
    act(() => { commit.click(); commit.click(); });
    await view.findByTestId("council-response");
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).definitionSHA256).toBe(rawFingerprint.trim());
    expect(view.queryByTestId("council-commit")).toBeNull();
    expect(input.onCue).toHaveBeenCalledWith("commit");
    const committed = localStorage.getItem("shi.chen-council.v1");
    fireEvent.click(view.getByTestId("council-continue"));
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(committed);
    view.unmount();
    view = render(<ChenCouncil {...input} />);
    expect(view.getByTestId("council-response")).toBeTruthy();
    fireEvent.click(view.getByTestId("council-continue"));
    fireEvent.click(view.container.querySelector("[data-council-choice='joint-ledger']")!);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    fireEvent.click(view.getByTestId("council-continue"));
    fireEvent.click(view.container.querySelector("[data-council-choice='hold-chen']")!);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    fireEvent.click(view.getByTestId("council-continue"));
    expect(view.getByTestId("council-outcome")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toHaveLength(3);
    expect(localStorage.getItem("shi.chapter-01.save.v6")).toBe(snapshot);
    expect(JSON.stringify(input.origin)).toBe(snapshot);
  });

  it("leaves the decision unapplied when storage refuses it", async () => {
    const view = render(<ChenCouncil {...props()} />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByRole("alert");
    expect(view.getByTestId("chen-council").getAttribute("data-round")).toBe("0");
    expect(view.queryByTestId("council-response")).toBeNull();
    expect((view.getByTestId("council-commit") as HTMLButtonElement).disabled).toBe(false);
  });

  it("preserves a different content revision and requires explicit recovery instead of retallying it", async () => {
    const input = props();
    let view = render(<ChenCouncil {...input} />);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    view.unmount();
    const incompatible = JSON.stringify({ ...JSON.parse(localStorage.getItem("shi.chen-council.v1")!), definitionSHA256: "0".repeat(64) });
    localStorage.setItem("shi.chen-council.v1", incompatible);
    view = render(<ChenCouncil {...input} />);
    expect(view.getByRole("alert")).toBeTruthy();
    expect(view.queryByTestId("council-response")).toBeNull();
    expect((view.getByTestId("council-commit") as HTMLButtonElement).disabled).toBe(true);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(incompatible);
    fireEvent.click(view.container.querySelector("[data-council-action='retry']")!);
    fireEvent.click(view.container.querySelector("[data-council-action='cancel']")!);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(incompatible);
    fireEvent.click(view.container.querySelector("[data-council-action='retry']")!);
    fireEvent.click(view.container.querySelector("[data-council-action='reset']")!);
    await waitFor(() => expect(view.queryByRole("alert")).toBeNull());
    const reset = JSON.parse(localStorage.getItem("shi.chen-council.v1")!);
    expect(reset.history).toEqual([]);
    expect(reset.definitionSHA256).toBe(rawFingerprint.trim());
  });

  it("resumes the original untagged save read-only and adds its revision on the next commitment", async () => {
    const input = props();
    let view = render(<ChenCouncil {...input} />);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    view.unmount();
    const legacy = JSON.parse(localStorage.getItem("shi.chen-council.v1")!);
    delete legacy.definitionSHA256;
    const bytes = JSON.stringify(legacy);
    localStorage.setItem("shi.chen-council.v1", bytes);
    view = render(<ChenCouncil {...input} />);
    expect(view.queryByRole("alert")).toBeNull();
    expect(view.getByTestId("council-response")).toBeTruthy();
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(bytes);
    fireEvent.click(view.getByTestId("council-continue"));
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(bytes);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    const saved = JSON.parse(localStorage.getItem("shi.chen-council.v1")!);
    expect(saved.definitionSHA256).toBe(rawFingerprint.trim());
    expect(saved.history).toHaveLength(2);
    expect(saved.history[0]).toEqual(legacy.history[0]);
  });

  it("waits for durable storage and guards duplicate input and Escape while saving", async () => {
    let finish!: () => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve; }));
    const input = props();
    const view = render(<ChenCouncil {...input} />);
    const commit = view.getByTestId("council-commit");
    act(() => { commit.click(); commit.click(); });
    expect(view.getByTestId("chen-council").getAttribute("data-round")).toBe("0");
    expect((commit as HTMLButtonElement).disabled).toBe(true);
    expect(input.onCue).not.toHaveBeenCalled();
    fireEvent.keyDown(view.getByTestId("chen-council"), { key: "Escape" });
    expect(input.onClose).not.toHaveBeenCalled();
    await act(async () => finish());
    await view.findByTestId("council-response");
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toHaveLength(1);
    expect(input.onCue).toHaveBeenCalledExactlyOnceWith("commit");
  });

  it("rolls back a failed durable write and permits an explicit retry", async () => {
    const flush = vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("native disk full")).mockResolvedValue(undefined);
    const input = props();
    const view = render(<ChenCouncil {...input} />);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
    expect(view.queryByTestId("council-response")).toBeNull();
    expect(input.onCue).not.toHaveBeenCalled();
    expect(flush).toHaveBeenCalledTimes(2);
    fireEvent.click(view.getByTestId("council-commit"));
    await view.findByTestId("council-response");
    expect(view.queryByRole("alert")).toBeNull();
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toHaveLength(1);
  });

  it("keeps the parent exit guard active throughout a delayed rollback", async () => {
    let rejectWrite!: (error: Error) => void, finishRollback!: () => void;
    const flush = vi.spyOn(persistence, "flushPersistence")
      .mockReturnValueOnce(new Promise<void>((_, reject) => { rejectWrite = reject; }))
      .mockReturnValueOnce(new Promise<void>(resolve => { finishRollback = resolve; }));
    const onSavingChange = vi.fn();
    const view = render(<ChenCouncil {...props()} onSavingChange={onSavingChange} />);
    fireEvent.click(view.getByTestId("council-commit"));
    expect(onSavingChange.mock.calls).toEqual([[true]]);
    await act(async () => { rejectWrite(new Error("disk full")); });
    expect(flush).toHaveBeenCalledTimes(2);
    expect(onSavingChange.mock.calls).toEqual([[true]]);
    expect((view.getByTestId("council-commit") as HTMLButtonElement).disabled).toBe(true);
    expect(view.queryByTestId("council-response")).toBeNull();
    await act(async () => { finishRollback(); });
    expect(onSavingChange.mock.calls).toEqual([[true], [false]]);
    expect(view.getByRole("alert")).toBeTruthy();
    expect(localStorage.getItem("shi.chen-council.v1")).toBeNull();
  });

  it("preserves corrupt data until an explicit confirmed reset", async () => {
    localStorage.setItem("shi.chen-council.v1", "damaged");
    const view = render(<ChenCouncil {...props()} />);
    expect(view.getByRole("alert")).toBeTruthy();
    expect((view.getByTestId("council-commit") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.container.querySelector("[data-council-action='retry']")!);
    fireEvent.click(view.container.querySelector("[data-council-action='cancel']")!);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe("damaged");
    fireEvent.click(view.container.querySelector("[data-council-action='retry']")!);
    fireEvent.click(view.container.querySelector("[data-council-action='reset']")!);
    await waitFor(() => expect(view.queryByRole("alert")).toBeNull());
    expect(JSON.parse(localStorage.getItem("shi.chen-council.v1")!).history).toEqual([]);
  });

  it("shows explicit language fallback, reduced-motion preference and source boundaries", () => {
    const view = render(<ChenCouncil {...props()} locale="ar" reducedMotion />);
    expect(view.getByTestId("chen-council").getAttribute("dir")).toBe("ltr");
    expect(view.getByTestId("chen-council").getAttribute("lang")).toBe("en");
    expect(view.getByTestId("chen-council").getAttribute("data-motion")).toBe("reduced");
    expect(view.getByText(/related textual traditions/)).toBeTruthy();
    expect(view.getByText(/not a claim that every opening route/)).toBeTruthy();
  });
});
