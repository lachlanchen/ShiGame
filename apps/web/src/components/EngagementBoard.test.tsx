// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EngagementBoard } from "./EngagementBoard";

afterEach(cleanup);

describe("broken-crossing Web command board", () => {
  it("plays three disclosed command pulses without claiming campaign authority", () => {
    const onClose = vi.fn();
    const onCue = vi.fn();
    const view = render(<EngagementBoard planId="families-first" conditionId="ford-rises" locale="en" onCue={onCue} onClose={onClose} />);
    const board = view.getByTestId("engagement-board");

    expect(board.getAttribute("aria-modal")).toBe("true");
    expect(board.getAttribute("data-pulse-index")).toBe("0");
    expect(board.textContent).toContain("This exercise does not change the campaign");
    expect(board.textContent).toContain("Households first");
    expect(board.textContent).toContain("The ford rises another hand");
    expect(board.querySelectorAll("[data-engagement-command]")).toHaveLength(2);

    fireEvent.click(board.querySelector("[data-engagement-command='screen-through-reeds']")!);
    expect(board.getAttribute("data-pulse-index")).toBe("1");
    expect(view.getByTestId("engagement-answer").textContent).toContain("Small probes force the screen");
    fireEvent.click(board.querySelector("[data-engagement-command='repair-the-landing']")!);
    expect(board.getAttribute("data-pulse-index")).toBe("2");
    fireEvent.click(board.querySelector("[data-engagement-command='hold-for-the-last-household']")!);

    expect(board.getAttribute("data-completed")).toBe("true");
    expect(board.getAttribute("data-outcome-id")).toBe("costly-crossing");
    expect(view.getByTestId("engagement-outcome").textContent).toContain("Crossing under pressure");
    expect(board.querySelectorAll(".engagement-history li")).toHaveLength(3);
    expect(onCue).toHaveBeenCalledTimes(3);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(view.getByTestId("engagement-return"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("localizes the board shell and preserves left-to-right fallback source copy in Arabic", () => {
    const view = render(<EngagementBoard planId="cut-the-carts" conditionId="rope-ferry-returns" locale="ar" onCue={vi.fn()} onClose={vi.fn()} />);
    expect(view.getByTestId("engagement-board").textContent).toContain("لوحة القيادة");
    expect(view.getByTestId("engagement-board").querySelector("h2")?.getAttribute("dir")).toBe("ltr");
    expect(view.getByTestId("engagement-board").querySelector("[data-metric='pursuitClosure']")?.textContent).toContain("المطاردة");
  });
});
