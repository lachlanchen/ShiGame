import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SilentFilm } from "./SilentFilm";

// Synthetic test reference only; no generated/production asset admission.
const asset = { src: "/test-only.mp4", captions: { src: "/test-only.vtt", language: "en", label: "English" } };
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("silent film playback intent", () => {
  it("keeps a restored page paused until the next explicit play", async () => {
    const view = render(<SilentFilm asset={asset} locale="en" />);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    act(() => window.dispatchEvent(new Event("pagehide")));
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event("pageshow")));
    expect(view.getByTestId("silent-film").dataset.playback).toBe("paused");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it.each(["ended", "error"])("does not reopen a terminal %s scene on a late playing event", async reason => {
    const view = render(<SilentFilm asset={asset} locale="en" />);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    const video = view.container.querySelector("video")!;
    fireEvent(video, new Event(reason));
    const status = view.getByTestId("silent-film").dataset.playback;
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    fireEvent.playing(video);
    expect(view.getByTestId("silent-film").dataset.playback).toBe(status);
    expect(status).toBe(reason === "ended" ? "ended" : "unavailable");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });

  it("refuses playback while native-inactive and requires a fresh gesture after foregrounding", async () => {
    const view = render(<SilentFilm asset={asset} locale="en" />);
    act(() => window.dispatchEvent(new CustomEvent("shi-native-active", { detail: false })));
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new CustomEvent("shi-native-active", { detail: true })));
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(view.getByTestId("silent-film").dataset.playback).toBe("playing");
  });

  it("stops an unsolicited playing event rather than allowing media to resume itself", () => {
    const view = render(<SilentFilm asset={asset} locale="en" />);
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    fireEvent.playing(view.container.querySelector("video")!);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    expect(view.getByTestId("silent-film").dataset.playback).not.toBe("playing");
  });

  it.each(["button", "hidden", "native", "pagehide", "unmount"])("reasserts pause after late play completion following %s", async reason => {
    let resolve!: () => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise<void>(done => { resolve = done; }));
    const view = render(<SilentFilm asset={asset} locale="en" />);
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    act(() => {
      if (reason === "button") fireEvent.click(view.getByRole("button", { name: "Pause" }));
      if (reason === "hidden") {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      }
      if (reason === "native") window.dispatchEvent(new CustomEvent("shi-native-active", { detail: false }));
      if (reason === "pagehide") window.dispatchEvent(new Event("pagehide"));
      if (reason === "unmount") view.unmount();
    });
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    await act(async () => resolve());
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    if (reason !== "unmount") expect(view.getByTestId("silent-film").dataset.playback).toBe("paused");
  });

  it.each(["resolve", "reject"])("does not let an old %s stop a newer explicit play", async completion => {
    const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })));
    const view = render(<SilentFilm asset={asset} locale="en" />);
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    fireEvent.click(view.getByRole("button", { name: "Pause" }));
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    await act(async () => pending[1]!.resolve());
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    await act(async () => completion === "resolve" ? pending[0]!.resolve() : pending[0]!.reject(new Error("old request")));
    expect(view.getByTestId("silent-film").dataset.playback).toBe("playing");
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
  });
});
