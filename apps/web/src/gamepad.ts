export type GamepadCommand = "previous" | "next" | "confirm" | "back" | "record" | "sources" | "guide";

export interface GamepadSnapshot {
  axes: readonly number[];
  buttons: readonly boolean[];
}

const axisDirection = (snapshot: GamepadSnapshot | null): -1 | 0 | 1 => {
  if (!snapshot) return 0;
  const horizontal = snapshot.axes[0] ?? 0;
  const vertical = snapshot.axes[1] ?? 0;
  const dominant = Math.abs(horizontal) >= Math.abs(vertical) ? horizontal : vertical;
  if (dominant <= -0.65) return -1;
  if (dominant >= 0.65) return 1;
  return 0;
};

const buttonEdge = (current: GamepadSnapshot, previous: GamepadSnapshot | null, index: number): boolean =>
  Boolean(current.buttons[index]) && !previous?.buttons[index];

/**
 * Converts a standards-mapped controller sample into one edge-triggered game
 * command. Directional input has to cross the dead zone before it can repeat.
 */
export function readGamepadCommand(current: GamepadSnapshot, previous: GamepadSnapshot | null): GamepadCommand | null {
  if (buttonEdge(current, previous, 1)) return "back";
  if (buttonEdge(current, previous, 9)) return "guide";
  if (buttonEdge(current, previous, 4)) return "record";
  if (buttonEdge(current, previous, 5)) return "sources";

  const direction = axisDirection(current);
  const previousDirection = axisDirection(previous);
  const previousEdge = buttonEdge(current, previous, 12) || buttonEdge(current, previous, 14);
  const nextEdge = buttonEdge(current, previous, 13) || buttonEdge(current, previous, 15);
  if (previousEdge || (direction === -1 && previousDirection === 0)) return "previous";
  if (nextEdge || (direction === 1 && previousDirection === 0)) return "next";
  if (buttonEdge(current, previous, 0)) return "confirm";
  return null;
}

export const snapshotGamepad = (gamepad: Gamepad): GamepadSnapshot => ({
  axes: Array.from(gamepad.axes),
  buttons: Array.from(gamepad.buttons, (button) => button.pressed || button.value >= 0.5),
});
