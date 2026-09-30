import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { ConsequenceScene } from "./ConsequenceScene";
import type { SilentFilmAsset } from "./SilentFilm";

// Test-only asset reference; not generated art, not a production admission.
const film: SilentFilmAsset = { src: "/test-only.mp4", captions: { src: "/test-only.vtt", language: "en", label: "English" } };
const props = { locale: "en" as const, title: "Read every name aloud", consequence: "The ranks see one another.", reducedMotion: false, children: <p>Complete strategic account</p> };

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); axe.reset(); });

describe("consequence presentation boundary", () => {
  it("works without a film, focuses its heading and keeps details optional", async () => {
    const exit = vi.fn();
    const view = render(<ConsequenceScene {...props} onContinue={exit} />);
    expect(view.queryByTestId("silent-film")).toBeNull();
    expect(document.activeElement).toBe(view.getByRole("heading"));
    expect((view.getByTestId("resolution-details") as HTMLDetailsElement).open).toBe(false);
    const violations = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
    expect(violations.violations).toEqual([]);
    fireEvent.click(view.getByTestId("resolution-continue"));
    fireEvent.click(view.getByTestId("resolution-continue"));
    fireEvent.keyDown(view.getByRole("dialog"), { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("traps keyboard focus and restores the previous body scroll setting", () => {
    document.body.style.overflow = "auto";
    const view = render(<ConsequenceScene {...props} onContinue={vi.fn()} />);
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(view.getByTestId("resolution-continue"));
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(view.getByText("What changed"));
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("does not mount or request video in reduced-motion mode", () => {
    const view = render(<ConsequenceScene {...props} film={film} reducedMotion onContinue={vi.fn()} />);
    expect(view.container.querySelector("video")).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(view.getByText(props.consequence)).toBeTruthy();
  });

  it("never autoplays, is silent and captioned, and holds after duplicate ended events", async () => {
    const exit = vi.fn();
    const view = render(<ConsequenceScene {...props} film={film} onContinue={exit} />);
    const video = view.container.querySelector("video")!;
    expect(video.autoplay).toBe(false);
    expect(video.preload).toBe("none");
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.querySelector("track")?.getAttribute("kind")).toBe("captions");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    await waitFor(() => expect(view.getByTestId("silent-film").dataset.playback).toBe("playing"));
    fireEvent.ended(video);
    fireEvent.ended(video);
    expect(view.getByText("Scene finished")).toBeTruthy();
    expect(exit).not.toHaveBeenCalled();
    fireEvent.click(view.getByTestId("resolution-continue"));
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it.each(["decode", "play-rejected"])("keeps the full written outcome and an exit after %s failure", async (reason) => {
    const exit = vi.fn();
    if (reason === "play-rejected") vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error("NotAllowedError"));
    const view = render(<ConsequenceScene {...props} film={film} onContinue={exit} />);
    if (reason === "decode") fireEvent.error(view.container.querySelector("video")!);
    else fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    await waitFor(() => expect(view.getByTestId("silent-film").dataset.playback).toBe("unavailable"));
    expect(view.getByText(props.consequence)).toBeTruthy();
    expect(exit).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("button", { name: "Skip scene" }));
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it.each(["visibility", "native-background", "pagehide"])("pauses for %s without automatically resuming or advancing", async (reason) => {
    const exit = vi.fn();
    const view = render(<ConsequenceScene {...props} film={film} onContinue={exit} />);
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    await view.findByRole("button", { name: "Pause" });
    await act(async () => {
      if (reason === "visibility") {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", { configurable: true, value: false });
        document.dispatchEvent(new Event("visibilitychange"));
      } else if (reason === "native-background") {
        window.dispatchEvent(new CustomEvent("shi-native-active", { detail: false }));
        window.dispatchEvent(new CustomEvent("shi-native-active", { detail: true }));
      } else window.dispatchEvent(new Event("pagehide"));
    });
    expect(view.getByTestId("silent-film").dataset.playback).toBe("paused");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
  });

  it("ignores a late play promise after pause and stops the media on unmount", async () => {
    let accept: () => void = () => undefined;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise<void>((resolve) => { accept = resolve; }));
    const view = render(<ConsequenceScene {...props} film={film} onContinue={vi.fn()} />);
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    fireEvent.click(view.getByRole("button", { name: "Pause" }));
    await act(async () => accept());
    expect(view.getByTestId("silent-film").dataset.playback).toBe("paused");
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    view.unmount();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });
});
