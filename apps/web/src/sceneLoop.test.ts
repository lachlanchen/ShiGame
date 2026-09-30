import { describe, expect, it, vi } from "vitest";
import { createSceneLoop } from "./sceneLoop";

function fixture() {
  let id = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const draw = vi.fn();
  const loop = createSceneLoop(draw, fn => { callbacks.set(++id, fn); return id; }, id => { callbacks.delete(id); });
  const tick = (time: number) => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(time)); };
  return { loop, draw, tick, callbacks };
}
describe("decorative rendering budget", () => {
  it("renders reduced-motion and modal backgrounds once, not forever", () => {
    const { loop, draw, callbacks } = fixture();
    loop.setMode(false, true);
    expect(draw).toHaveBeenCalledExactlyOnceWith(0);
    expect(callbacks.size).toBe(0);
    loop.redraw();
    expect(draw).toHaveBeenCalledTimes(2);
    loop.dispose(); loop.redraw();
    expect(draw).toHaveBeenCalledTimes(2);
  });
  it("caps draws, uses elapsed time, and stops while hidden", () => {
    const { loop, draw, tick, callbacks } = fixture();
    loop.setMode(true, true);
    for (let time = 0; time <= 1000; time += 10) tick(time);
    expect(draw.mock.calls.length).toBeLessThanOrEqual(31);
    expect(draw.mock.calls.slice(1).reduce((sum, [dt]) => sum + dt, 0)).toBeCloseTo(1);
    loop.setMode(true, false);
    expect(callbacks.size).toBe(0);
    const before = draw.mock.calls.length;
    tick(90000); loop.redraw();
    expect(draw).toHaveBeenCalledTimes(before);
    loop.setMode(true, true); tick(90000); tick(90050);
    expect(draw).toHaveBeenLastCalledWith(.05);
    loop.dispose(); expect(callbacks.size).toBe(0);
  });
});
