import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneFilm } from "./SceneFilm";
import { PrivateRainScene } from "./PrivateRainScene";

const asset = { src: "/test.mp4", poster: "/test.png", captions: { src: "/test.vtt", language: "en", label: "Description" } };
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("scored scene interruptions", () => {
  it("requires separate explicit play and sound gestures without writing a choice", async () => {
    const save = vi.spyOn(Storage.prototype, "setItem");
    const view = render(<SceneFilm asset={asset} locale="en" soundtrack />);
    const video = view.container.querySelector("video")!;
    expect(video.muted).toBe(true);
    expect(video.preload).toBe("none");
    expect(video.autoplay).toBe(false);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(video.muted).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "Sound" }));
    expect(video.muted).toBe(false);
    expect(video.volume).toBe(0.7);
    fireEvent.click(view.getByRole("button", { name: "Skip scene" }));
    expect(view.getByTestId("scene-film").dataset.playback).toBe("skipped");
    expect(save).not.toHaveBeenCalled();
  });
  it("pauses behind a game drawer and needs a new gesture when the drawer closes", async () => {
    const view = render(<SceneFilm asset={asset} locale="en" soundtrack active />);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    view.rerender(<SceneFilm asset={asset} locale="en" soundtrack active={false} />);
    expect(view.getByTestId("scene-film").dataset.playback).toBe("paused");
    expect((view.getByRole("button", { name: "Play scene" }) as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<SceneFilm asset={asset} locale="en" soundtrack active />);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });
  it("does not revive a pending play when a drawer opens and closes", async () => {
    let done!: () => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementation(() => new Promise<void>(resolve => { done = resolve; }));
    const view = render(<SceneFilm asset={asset} locale="en" soundtrack />);
    fireEvent.click(view.getByRole("button", { name: "Play scene" }));
    view.rerender(<SceneFilm asset={asset} locale="en" soundtrack active={false} />);
    view.rerender(<SceneFilm asset={asset} locale="en" soundtrack active />);
    await act(async () => done());
    expect(view.getByTestId("scene-film").dataset.playback).toBe("paused");
  });
  it("uses the static image in reduced motion and pauses media when that preference changes", async () => {
    const view = render(<PrivateRainScene locale="en" reducedMotion={false} active description="Chen Sheng" />);
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    view.rerender(<PrivateRainScene locale="en" reducedMotion active description="Chen Sheng" />);
    expect(view.container.querySelector("video")).toBeNull();
    expect(view.getByRole("img", { name: /Chen Sheng listens/ }).getAttribute("src")).toContain("listening.png");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
  });
  it("keeps the silent slot unable to enable sound", async () => {
    const view = render(<SceneFilm asset={asset} locale="en" />);
    expect(view.queryByRole("button", { name: "Sound" })).toBeNull();
    await act(async () => fireEvent.click(view.getByRole("button", { name: "Play scene" })));
    expect(view.container.querySelector("video")!.muted).toBe(true);
  });
});
