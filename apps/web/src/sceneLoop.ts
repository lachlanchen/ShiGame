/** Decorative rendering only. No gameplay clock or random simulation lives here. */
export function createSceneLoop(draw: (seconds: number) => void,
  request = requestAnimationFrame, cancel = cancelAnimationFrame) {
  let frame = 0, last: number | null = null, visible = false, animate = false, disposed = false;
  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible || !animate) return;
    if (last === null) last = now;
    if (now - last >= 1000 / 30) {
      draw(Math.min((now - last) / 1000, .1));
      last = now;
    }
    frame = request(tick);
  };
  return {
    setMode(nextAnimate: boolean, nextVisible: boolean) {
      if (disposed) return;
      if (frame) cancel(frame);
      frame = 0; last = null; animate = nextAnimate; visible = nextVisible;
      if (visible) { draw(0); if (animate) frame = request(tick); }
    },
    redraw() { if (!disposed && visible) draw(0); },
    dispose() { disposed = true; if (frame) cancel(frame); frame = 0; },
  };
}
