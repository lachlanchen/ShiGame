import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState, localize, resolveChoice, type Campaign } from "@shi/game-core";
import campaignJson from "../../../../content/campaigns/chapter-01-daze.json";
import { ConsequencePresentation } from "./ConsequencePresentation";
import { ResolvedConsequenceScene } from "./ResolvedConsequenceScene";
import axe from "axe-core";

const campaign = campaignJson as unknown as Campaign;
const resolution = resolveChoice(campaign, createInitialState(campaign, 0), "read-the-names");
const props = { campaign, resolution, locale: "en" as const, reducedMotion: false };
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.style.overflow = ""; });

describe("readable consequence during presentation loading", () => {
  it("immediately shows the committed outcome and keeps Continue usable while the import never resolves", async () => {
    const exit = vi.fn();
    const view = render(<ConsequencePresentation {...props} load={() => new Promise(() => {})} onContinue={exit} />);
    expect(view.getByText(localize(resolution.choice.consequence, "en"))).toBeTruthy();
    expect(document.activeElement).toBe(view.getByRole("heading"));
    expect(view.getByTestId("resolution").dataset.presentation).toBe("loading");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(view.getByTestId("resolution-continue"));
    const result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
    fireEvent.click(view.getByTestId("resolution-continue"));
    fireEvent.click(view.getByTestId("resolution-continue"));
    fireEvent.keyDown(view.getByRole("dialog"), { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("retains the outcome, a failed save message and a retryable Continue after import failure", async () => {
    const exit = vi.fn().mockReturnValueOnce(false).mockReturnValue(undefined);
    const view = render(<ConsequencePresentation {...props} load={() => Promise.reject(new Error("offline chunk"))} saveError="Save not written" onContinue={exit} />);
    await waitFor(() => expect(view.getByTestId("resolution").dataset.presentation).toBe("written"));
    expect(view.getByText(localize(resolution.choice.consequence, "en"))).toBeTruthy();
    expect(view.getByRole("alert").textContent).toBe("Save not written");
    expect(exit).not.toHaveBeenCalled();
    fireEvent.click(view.getByTestId("resolution-continue"));
    fireEvent.click(view.getByTestId("resolution-continue"));
    expect(exit).toHaveBeenCalledTimes(2);
  });

  it("hands the identical resolution to the loaded view without advancing and releases the scroll lock", async () => {
    let ready!: (value: { ResolvedConsequenceScene: typeof ResolvedConsequenceScene }) => void;
    const load = () => new Promise<{ ResolvedConsequenceScene: typeof ResolvedConsequenceScene }>(resolve => { ready = resolve; });
    const exit = vi.fn();
    document.body.style.overflow = "auto";
    const view = render(<ConsequencePresentation {...props} load={load} onContinue={exit} />);
    await act(async () => ready({ ResolvedConsequenceScene }));
    expect(view.getByTestId("resolution-details")).toBeTruthy();
    expect(view.getByText(localize(resolution.choice.consequence, "en"))).toBeTruthy();
    expect(exit).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("keeps a supplied crossing title and correct Arabic fallback direction", () => {
    const view = render(<ConsequencePresentation {...props} locale="ar" titleOverride={{ en: "The boats return", "zh-Hans": "船回来了" }} load={() => new Promise(() => {})} onContinue={vi.fn()} />);
    expect(view.getByRole("heading").textContent).toBe("The boats return");
    expect(view.getByRole("heading").getAttribute("dir")).toBe("ltr");
  });

  it("keeps Continue focused when the detailed reaction arrives after keyboard navigation", async () => {
    let ready!: (value: { ResolvedConsequenceScene: typeof ResolvedConsequenceScene }) => void;
    const load = () => new Promise<{ ResolvedConsequenceScene: typeof ResolvedConsequenceScene }>(resolve => { ready = resolve; });
    const exit = vi.fn();
    const view = render(<ConsequencePresentation {...props} load={load} onContinue={exit} />);
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(view.getByTestId("resolution-continue"));
    await act(async () => ready({ ResolvedConsequenceScene }));
    expect(view.getByTestId("resolution-details")).toBeTruthy();
    expect(document.activeElement).toBe(view.getByTestId("resolution-continue"));
    expect(exit).not.toHaveBeenCalled();
    fireEvent.click(document.activeElement!);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
