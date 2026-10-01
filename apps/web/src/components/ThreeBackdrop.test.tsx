import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreeBackdrop } from "./ThreeBackdrop";

const gpu = vi.hoisted(() => ({ create: vi.fn(), module: vi.fn() }));
vi.mock("three", () => {
  gpu.module();
  return {
    Scene: class {},
    PerspectiveCamera: class { position = { set() {} }; lookAt() {} },
    WebGLRenderer: class { constructor() { gpu.create(); throw new Error("WebGL unavailable"); } },
  };
});
beforeEach(() => gpu.create.mockClear());
afterEach(cleanup);

describe("optional atmospheric renderer", () => {
  it("does not request Three or create a GPU context for initial reduced motion", async () => {
    const view = render(<ThreeBackdrop reducedMotion />);
    await act(async () => {});
    expect(gpu.module).not.toHaveBeenCalled();
    expect(gpu.create).not.toHaveBeenCalled();
    expect(view.container.firstElementChild?.getAttribute("data-renderer")).toBe("static");
    expect(view.container.querySelector("canvas")).toBeNull();
  });

  it("falls back to the static page when WebGL cannot initialize", async () => {
    const view = render(<ThreeBackdrop reducedMotion={false} />);
    await waitFor(() => expect(view.container.firstElementChild?.getAttribute("data-renderer")).toBe("unavailable"));
    expect(gpu.create).toHaveBeenCalledOnce();
    expect(view.container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(view.container.querySelector("canvas")).toBeNull();
  });

  it("starts optional graphics only when motion is explicitly enabled", async () => {
    const view = render(<ThreeBackdrop reducedMotion />);
    expect(gpu.create).not.toHaveBeenCalled();
    view.rerender(<ThreeBackdrop reducedMotion={false} />);
    await waitFor(() => expect(gpu.create).toHaveBeenCalledOnce());
    view.rerender(<ThreeBackdrop reducedMotion />);
    expect(view.container.firstElementChild?.getAttribute("data-renderer")).toBe("static");
  });
});
