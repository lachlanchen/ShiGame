import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrivateCouncilFilm } from "./PrivateCouncilFilm";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const toggle = (element: HTMLDetailsElement, open: boolean) => { element.open = open; fireEvent(element, new Event("toggle")); };
describe("private council motion review", () => {
  it("does not mount media while collapsed or in reduced motion", () => {
    const view = render(<PrivateCouncilFilm reducedMotion />);
    expect(view.container.querySelector("video")).toBeNull();
    toggle(view.getByTestId("private-council-film") as HTMLDetailsElement, true);
    expect(view.container.querySelector("video")).toBeNull();
    expect(view.getByText(/Moving imagery is disabled/)).toBeTruthy();
  });
  it("requires play, pauses on collapse and never touches saves", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const view = render(<PrivateCouncilFilm reducedMotion={false} />);
    expect(view.container.querySelector("video")).toBeNull();
    toggle(view.getByTestId("private-council-film") as HTMLDetailsElement, true);
    await waitFor(() => expect(view.container.querySelector("video")).not.toBeNull());
    expect(play).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(play).toHaveBeenCalledOnce();
    pause.mockClear();
    toggle(view.getByTestId("private-council-film") as HTMLDetailsElement, false);
    await waitFor(() => expect(view.container.querySelector("video")).toBeNull());
    expect(pause).toHaveBeenCalledOnce();
    expect(writes).not.toHaveBeenCalled();
  });
});
