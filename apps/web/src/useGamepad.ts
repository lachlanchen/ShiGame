import { useEffect, useRef, useState } from "react";
import { readGamepadCommand, snapshotGamepad, type GamepadCommand, type GamepadSnapshot } from "./gamepad";

export function useGamepad(onCommand: (command: GamepadCommand) => void): boolean {
  const commandRef = useRef(onCommand);
  const connectedRef = useRef(false);
  const previousRef = useRef<GamepadSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  commandRef.current = onCommand;

  useEffect(() => {
    let frame = 0;
    const updateConnection = (value: boolean) => {
      if (connectedRef.current === value) return;
      connectedRef.current = value;
      setConnected(value);
    };
    const poll = () => {
      const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
      const gamepad = Array.from(pads).find((candidate): candidate is Gamepad => Boolean(candidate?.connected));
      if (!gamepad) {
        previousRef.current = null;
        updateConnection(false);
      } else {
        updateConnection(true);
        const current = snapshotGamepad(gamepad);
        const command = readGamepadCommand(current, previousRef.current);
        previousRef.current = current;
        if (command) commandRef.current(command);
      }
      frame = window.requestAnimationFrame(poll);
    };
    frame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return connected;
}
