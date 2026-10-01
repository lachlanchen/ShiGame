import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrivateScoreAudition } from "./PrivateScoreAudition";

const hash = Uint8Array.from("7d28d185acd999637b19fd9eb0eb1bec778eff9f17c9507fff92519643cdada4".match(/../g)!, value => Number.parseInt(value, 16)).buffer;
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  vi.stubGlobal("crypto", { subtle: { digest: vi.fn().mockResolvedValue(hash) } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) }));
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:test-cue") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("private scene score audition", () => {
  it("does not fetch or play until requested, keeps the same recording across renders, and never loops", async () => {
    const view = render(<PrivateScoreAudition />);
    const player = view.container.querySelector("audio")!;
    expect(player.preload).toBe("none"); expect(player.loop).toBe(false);
    expect(fetch).not.toHaveBeenCalled(); expect(player.play).not.toHaveBeenCalled();
    fireEvent.click(view.getByText("Play / 播放"));
    await waitFor(() => expect(view.getByTestId("private-score-audition").dataset.status).toBe("playing"));
    expect(player.volume).toBe(0.2);
    view.rerender(<PrivateScoreAudition />);
    expect(fetch).toHaveBeenCalledTimes(1); expect(player.play).toHaveBeenCalledTimes(1);
    fireEvent.ended(player);
    expect(view.getByTestId("private-score-audition").dataset.status).toBe("ended");
    expect(player.play).toHaveBeenCalledTimes(1);
    view.unmount(); expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-cue");
  });
  it.each(["bad-hash", "missing", "play-rejected"])("keeps the game independent when %s fails", async failure => {
    if (failure === "bad-hash") vi.mocked(crypto.subtle.digest).mockResolvedValue(new ArrayBuffer(32));
    if (failure === "missing") vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    if (failure === "play-rejected") vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error("Rejected"));
    const before = JSON.stringify(localStorage);
    const view = render(<PrivateScoreAudition />);
    fireEvent.click(view.getByText("Play / 播放"));
    await waitFor(() => expect(view.getByTestId("private-score-audition").dataset.status).toBe("unavailable"));
    if (failure !== "play-rejected") expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(JSON.stringify(localStorage)).toBe(before);
  });
  it("pauses on backgrounding without restarting when visible again", async () => {
    const view = render(<PrivateScoreAudition />);
    fireEvent.click(view.getByText("Play / 播放"));
    await waitFor(() => expect(view.getByTestId("private-score-audition").dataset.status).toBe("playing"));
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(view.getByTestId("private-score-audition").dataset.status).toBe("paused");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });
  it("does not start a late download after the reviewer pauses", async () => {
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const view = render(<PrivateScoreAudition />);
    fireEvent.click(view.getByText("Play / 播放")); fireEvent.click(view.getByText("Pause / 暂停"));
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) } as Response);
    await waitFor(() => expect(crypto.subtle.digest).toHaveBeenCalled());
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(view.getByTestId("private-score-audition").dataset.status).toBe("paused");
  });
});
