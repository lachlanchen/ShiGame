import { describe, expect, it } from "vitest";
import { readGamepadCommand, type GamepadSnapshot } from "./gamepad";

const sample = (buttons: number[] = [], axes: number[] = [0, 0]): GamepadSnapshot => ({
  axes,
  buttons: Array.from({ length: 16 }, (_, index) => buttons.includes(index)),
});

describe("standard gamepad command adapter", () => {
  it("maps buttons to one prioritized command on the pressed edge", () => {
    expect(readGamepadCommand(sample([0]), sample())).toBe("confirm");
    expect(readGamepadCommand(sample([4]), sample())).toBe("record");
    expect(readGamepadCommand(sample([5]), sample())).toBe("sources");
    expect(readGamepadCommand(sample([9]), sample())).toBe("guide");
    expect(readGamepadCommand(sample([0, 1]), sample())).toBe("back");
  });

  it("does not repeat a held button", () => {
    expect(readGamepadCommand(sample([0]), sample([0]))).toBeNull();
  });

  it("requires an axis to return through the dead zone before repeating", () => {
    expect(readGamepadCommand(sample([], [0.8, 0]), sample())).toBe("next");
    expect(readGamepadCommand(sample([], [0.9, 0]), sample([], [0.8, 0]))).toBeNull();
    expect(readGamepadCommand(sample([], [0, 0]), sample([], [0.9, 0]))).toBeNull();
    expect(readGamepadCommand(sample([], [-0.8, 0]), sample())).toBe("previous");
  });

  it("maps both D-pad axes to enabled-choice movement", () => {
    expect(readGamepadCommand(sample([12]), sample())).toBe("previous");
    expect(readGamepadCommand(sample([14]), sample())).toBe("previous");
    expect(readGamepadCommand(sample([13]), sample())).toBe("next");
    expect(readGamepadCommand(sample([15]), sample())).toBe("next");
  });
});
