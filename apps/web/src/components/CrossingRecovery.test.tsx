import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { DevelopmentCrossingDriver } from "../development-crossing";
import CrossingRecovery from "./CrossingRecovery";

vi.mock("./DecisionInspector", () => { throw new Error("Download unavailable"); });
afterEach(cleanup);

it("preserves the ending instead of offering replay when a required panel cannot load", async () => {
  const reconsider = vi.fn();
  const driver = { canReconsider: () => true, reconsider } as unknown as DevelopmentCrossingDriver;
  const onRetry = vi.fn();
  const view = render(<CrossingRecovery driver={driver} locale="en" onRetry={onRetry} />);
  expect((view.getByTestId("crossing-reconsider") as HTMLButtonElement).disabled).toBe(true);
  expect((await view.findByRole("alert")).textContent).toContain("Your ending is still saved");
  expect(view.getByTestId("crossing-reconsider").textContent).toContain("reload");
  expect(view.queryByTestId("crossing-retry-confirm")).toBeNull();
  expect(reconsider).not.toHaveBeenCalled();
  expect(onRetry).not.toHaveBeenCalled();
});
