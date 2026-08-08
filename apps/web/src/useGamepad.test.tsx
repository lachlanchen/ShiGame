// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useGamepad } from "./useGamepad";

function Probe() {
  const connected = useGamepad(() => undefined);
  return <output data-testid="connection">{connected ? "connected" : "none"}</output>;
}

afterEach(cleanup);

describe("Gamepad API polling", () => {
  it("resets cleanly across disconnect and reconnect", async () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 }));
    const gamepad = { id: "reconnect test", index: 0, connected: true, mapping: "standard", timestamp: 0, axes: [0, 0], buttons } as unknown as Gamepad;
    let pads: Gamepad[] = [];
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => pads });
    const view = render(<Probe />);

    expect(view.getByTestId("connection").textContent).toBe("none");
    pads = [gamepad];
    await waitFor(() => expect(view.getByTestId("connection").textContent).toBe("connected"));
    pads = [];
    await waitFor(() => expect(view.getByTestId("connection").textContent).toBe("none"));
    pads = [gamepad];
    await waitFor(() => expect(view.getByTestId("connection").textContent).toBe("connected"));
  });
});
