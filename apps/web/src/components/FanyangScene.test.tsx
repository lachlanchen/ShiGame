// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { canChoose, councilEntry, createCouncil, createInitialState, getNode, prepareFanyangEntry, resolveChoice, resolveCouncil, type Campaign, type CouncilDefinition } from "@shi/game-core";
import campaignRaw from "../../../../content/campaigns/chapter-01-daze.json";
import chenRaw from "../generated/chen-council.v1.json";
import chenHash from "../generated/chen-council.v1.sha256?raw";
import { encodeCouncilSnapshot } from "../council-snapshot";
import * as persistence from "../persistence";
import { ChenCouncil } from "./ChenCouncil";
import { FanyangScene } from "./FanyangScene";
import { supportedLocales, type FanyangDefinition } from "@shi/game-core";
import { cinemaLabel } from "../cinema-labels";
import fanyangRaw from "../../../../content/councils/fanyang-guarantee.v1.json";

const campaign = campaignRaw as Campaign, chen = chenRaw as CouncilDefinition;
let origin = createInitialState(campaign, 0);
while (!origin.completed) origin = resolveChoice(campaign, origin, getNode(campaign, origin.currentNodeId).choices.find(choice => canChoose(choice, origin.resources))!.id).state;
let council = createCouncil(chen, councilEntry(origin)!);
for (const choice of ["defer-title", "joint-ledger", "one-command"]) council = resolveCouncil(chen, council, choice);
const councilSave = encodeCouncilSnapshot(council, chenHash.trim());
const entry = prepareFanyangEntry(chen, origin, JSON.parse(councilSave), chenHash.trim())!;
const props = () => ({ entry, locale: "en" as const, reducedMotion: true, onClose: vi.fn(), onCue: vi.fn(), onSavingChange: vi.fn() });
const key = "shi.fanyang-guarantee.v1";
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
async function choose(view: ReturnType<typeof render>, id: string) {
  fireEvent.click(view.container.querySelector(`[data-fanyang-choice="${id}"]`)!);
  fireEvent.click(view.getByTestId("fanyang-commit"));
  await view.findByTestId("fanyang-response");
  fireEvent.click(within(view.getByTestId("fanyang-response")).getByRole("button", { name: /Continue/ }));
}

describe("Fan Yang playable continuation", () => {
  it.each(["en", "zh-Hans"] as const)("keeps Chen's shared-ledger callback in the main reply (%s)", async locale => {
    // The default one-command route spends allied support. Use a real council
    // route that leaves this witness procedure affordable, not invented metrics.
    let alliedCouncil = createCouncil(chen, councilEntry(origin)!);
    for (const id of ["defer-title", "joint-ledger", "many-banners"]) alliedCouncil = resolveCouncil(chen, alliedCouncil, id);
    const alliedEntry = prepareFanyangEntry(chen, origin, JSON.parse(encodeCouncilSnapshot(alliedCouncil, chenHash.trim())), chenHash.trim())!;
    const input = { ...props(), locale, entry: alliedEntry };
    let view = render(<FanyangScene {...input} />);
    fireEvent.click(view.container.querySelector('[data-fanyang-choice="public-safety"]')!);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    fireEvent.click(view.getByTestId("fanyang-response").querySelector("button")!);
    fireEvent.click(view.container.querySelector('[data-fanyang-choice="joint-witnesses"]')!);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    const answer = (fanyangRaw as FanyangDefinition).rounds[1]!.choices.find(c => c.id === "joint-witnesses")!.answers![0]!.text[locale]!;
    expect(within(view.getByTestId("fanyang-response")).getByText(answer).closest("details")).toBeNull();
    expect((view.getByTestId("fanyang-response-changes") as HTMLDetailsElement).open).toBe(false);
    const saved = localStorage.getItem(key);
    expect(JSON.parse(saved!).choices).toEqual(["public-safety", "joint-witnesses"]);
    view.unmount();
    view = render(<FanyangScene {...input} />);
    expect(within(view.getByTestId("fanyang-response")).getByText(answer).closest("details")).toBeNull();
    expect(localStorage.getItem(key)).toBe(saved);
  });
  it.each(supportedLocales)("presents the saved reply before accounting, without losing conditions or resume (%s)", async locale => {
    const input = { ...props(), locale };
    let view = render(<FanyangScene {...input} />);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    const saved = localStorage.getItem(key);
    const response = view.getByTestId("fanyang-response");
    const changes = view.getByTestId("fanyang-response-changes") as HTMLDetailsElement;
    expect(changes.open).toBe(false);
    expect(changes.querySelector("summary")?.textContent).toBe(cinemaLabel(locale, "changes"));
    expect(response.querySelector(".chen-prose")?.closest("details")).toBeNull();
    expect(changes.querySelectorAll(".chen-preview > span")).toHaveLength(Object.keys(fanyangRaw.metrics).length);
    expect(view.container.querySelector(".chen-position")).toBeNull();
    fireEvent.click(changes.querySelector("summary")!);
    expect(changes.open).toBe(true);
    expect(localStorage.getItem(key)).toBe(saved);
    view.unmount();
    view = render(<FanyangScene {...input} />);
    expect((view.getByTestId("fanyang-response-changes") as HTMLDetailsElement).open).toBe(false);
    expect(localStorage.getItem(key)).toBe(saved);
    fireEvent.click(view.getByTestId("fanyang-response").querySelector("button")!);
    expect(view.container.querySelector(".chen-position")).not.toBeNull();
    expect(localStorage.getItem(key)).toBe(saved);
    expect(input.onCue).toHaveBeenCalledTimes(1);
  });
  it("introduces the envoy once before negotiation without transporting the Chen households", async () => {
    const view = render(<FanyangScene {...props()} />);
    expect(view.getByTestId("fanyang-viewpoint").textContent).toContain("have not travelled here with the camera");
    expect(localStorage.getItem(key)).toBeNull();
    await choose(view, "public-safety");
    expect(view.queryByTestId("fanyang-viewpoint")).toBeNull();
  });

  it("shows an optional honest planning warning without making an order", () => {
    const view = render(<FanyangScene {...props()} entry={{ ...entry, metrics: { ...entry.metrics, grain: 0 } }} />);
    const help = view.getByTestId("fanyang-prospects");
    fireEvent.click(help.querySelector("summary")!);
    expect(help.textContent).toContain("No remaining sequence in this episode can secure surrender");
    expect(localStorage.getItem(key)).toBeNull();
    expect(view.queryByTestId("fanyang-response")).toBeNull();
  });
  it("continues from the actual Chen ending, resolves a full route and preserves both earlier saves", async () => {
    localStorage.setItem("shi.chen-council.v1", councilSave);
    localStorage.setItem("shi.save", "chapter-sentinel");
    const view = render(<ChenCouncil origin={origin} locale="en" reducedMotion onClose={vi.fn()} onCue={vi.fn()} />);
    expect(view.queryByTestId("fanyang-enter")).toBeNull();
    fireEvent.click(view.getByTestId("council-continue"));
    fireEvent.click(view.getByTestId("fanyang-enter"));
    expect(view.getByTestId("fanyang-scene")).toBeTruthy();
    expect(localStorage.getItem(key)).toBeNull();
    await choose(view, "public-safety");
    await choose(view, "guarded-escort");
    const preview = view.getByTestId("fanyang-preview").getAttribute("data-outcome");
    await choose(view, "accept-transfer");
    expect(view.getByTestId("fanyang-outcome").getAttribute("data-outcome")).toBe(preview);
    expect(preview).toBe("opened");
    expect(JSON.parse(localStorage.getItem(key)!).choices).toEqual(["public-safety", "guarded-escort", "accept-transfer"]);
    expect(localStorage.getItem("shi.chen-council.v1")).toBe(councilSave);
    expect(localStorage.getItem("shi.save")).toBe("chapter-sentinel");
    fireEvent.click(within(view.getByTestId("fanyang-outcome")).getByRole("button", { name: "Return to Chen" }));
    expect(view.getByTestId("council-outcome")).toBeTruthy();
    expect(document.activeElement?.tagName).toBe("H3");
  });

  it("restores the last reaction without choosing again, then finishes by withdrawal", async () => {
    const input = props();
    let view = render(<FanyangScene {...input} />);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    const saved = localStorage.getItem(key);
    view.unmount();
    const writes = vi.spyOn(Storage.prototype, "setItem");
    view = render(<FanyangScene {...input} />);
    expect(view.getByTestId("fanyang-response")).toBeTruthy();
    expect(document.activeElement).toBe(within(view.getByTestId("fanyang-response")).getByRole("heading"));
    expect(writes).not.toHaveBeenCalled();
    fireEvent.click(within(view.getByTestId("fanyang-response")).getByRole("button", { name: /Continue/ }));
    expect(localStorage.getItem(key)).toBe(saved);
    await choose(view, "hold-talks");
    await choose(view, "withdraw-envoy");
    expect(view.getByTestId("fanyang-outcome").getAttribute("data-outcome")).toBe("withdrawn");
  });

  it("locks duplicate orders and closing until durable storage confirms the decision", async () => {
    let release!: () => void;
    vi.spyOn(persistence, "flushPersistence").mockReturnValue(new Promise<void>(resolve => { release = resolve; }));
    const input = props(), view = render(<FanyangScene {...input} />);
    const button = view.getByTestId("fanyang-commit");
    fireEvent.click(button); fireEvent.click(button);
    fireEvent.keyDown(view.getByTestId("fanyang-scene"), { key: "Escape" });
    expect(input.onClose).not.toHaveBeenCalled();
    expect(view.queryByTestId("fanyang-response")).toBeNull();
    expect(JSON.parse(localStorage.getItem(key)!).choices).toHaveLength(1);
    expect(input.onSavingChange).toHaveBeenLastCalledWith(true);
    await act(async () => release());
    await view.findByTestId("fanyang-response");
    expect(input.onCue).toHaveBeenCalledTimes(1);
    expect(input.onSavingChange).toHaveBeenLastCalledWith(false);
  });

  it("rolls back a failed durable save and retries the same single order", async () => {
    vi.spyOn(persistence, "flushPersistence").mockRejectedValueOnce(new Error("offline storage error")).mockResolvedValue(undefined);
    const view = render(<FanyangScene {...props()} />);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByRole("alert");
    expect(localStorage.getItem(key)).toBeNull();
    expect(view.queryByTestId("fanyang-response")).toBeNull();
    await waitFor(() => expect((view.getByTestId("fanyang-commit") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    expect(JSON.parse(localStorage.getItem(key)!).choices).toHaveLength(1);
  });

  it("preserves an incompatible save until an explicit confirmed restart", async () => {
    localStorage.setItem(key, '{"version":99}');
    const view = render(<FanyangScene {...props()} />);
    expect(view.getByRole("alert")).toBeTruthy();
    expect((view.getByTestId("fanyang-commit") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "Restart this scene…" }));
    fireEvent.click(view.getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem(key)).toBe('{"version":99}');
    fireEvent.click(view.getByRole("button", { name: "Restart this scene…" }));
    fireEvent.click(view.getByRole("button", { name: "Restart Fan Yang" }));
    await waitFor(() => expect(view.queryByRole("alert")).toBeNull());
    expect(JSON.parse(localStorage.getItem(key)!).choices).toEqual([]);
  });

  it.each(["en", "zh-Hans", "ar"] as const)("has accessible semantics and honest prose fallback (%s)", async locale => {
    const view = render(<FanyangScene {...props()} locale={locale} />);
    expect(view.getByRole("dialog").getAttribute("lang")).toBe(locale === "zh-Hans" ? "zh-Hans" : "en");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    fireEvent.click(view.getByTestId("fanyang-commit"));
    await view.findByTestId("fanyang-response");
    expect((await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
});
