import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(), flush: vi.fn(), get: vi.fn(), set: vi.fn(),
  minimize: vi.fn(), listen: vi.fn(),
}));
vi.mock("./persistence", () => ({ initializePersistence: mocks.initialize, flushPersistence: mocks.flush }));
vi.mock("@capacitor/preferences", () => ({ Preferences: { get: mocks.get, set: mocks.set } }));
vi.mock("@capacitor/app", () => ({ App: { addListener: mocks.listen, minimizeApp: mocks.minimize } }));
import { initializeNative } from "./native";

let cleanup: Array<() => void> = [];
const listeners = new Map<string, (event?: unknown) => void>();
beforeEach(() => {
  vi.resetAllMocks(); listeners.clear();
  mocks.initialize.mockResolvedValue(undefined);
  mocks.flush.mockResolvedValue(undefined);
  mocks.minimize.mockResolvedValue(undefined);
  mocks.listen.mockImplementation(async (name, callback) => { listeners.set(name, callback); return { remove: vi.fn() }; });
  const add = window.addEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((...args) => {
    add(...args); cleanup.push(() => window.removeEventListener(args[0], args[1], args[2]));
  });
});
afterEach(() => {
  cleanup.forEach(fn => fn()); cleanup = [];
  document.querySelectorAll(".native-save-warning").forEach(node => node.remove());
  delete document.documentElement.dataset.native;
  vi.restoreAllMocks();
});
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

describe("Android lifecycle bridge", () => {
  it("waits for save initialization before installing native navigation", async () => {
    let ready!: () => void;
    mocks.initialize.mockReturnValue(new Promise<void>(resolve => { ready = resolve; }));
    const opening = initializeNative();
    expect(mocks.listen).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.native).toBeUndefined();
    ready(); await opening;
    const store = mocks.initialize.mock.calls[0]![0];
    mocks.get.mockResolvedValue({ value: "saved" });
    expect(await store.read()).toBe("saved");
    await store.write("next");
    expect(mocks.get).toHaveBeenCalledWith({ key: "shi.mobile.snapshot.v1" });
    expect(mocks.set).toHaveBeenCalledWith({ key: "shi.mobile.snapshot.v1", value: "next" });
  });
  it("rejects unreadable saves without installing navigation or rewriting preferences", async () => {
    mocks.initialize.mockRejectedValue(new Error("invalid saved progress"));
    await expect(initializeNative()).rejects.toThrow("invalid saved progress");
    expect(mocks.listen).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("lets React consume Back without minimizing or flushing another transaction", async () => {
    await initializeNative();
    window.addEventListener("shi-native-back", event => event.preventDefault());
    listeners.get("backButton")!(); await settle();
    expect(mocks.minimize).not.toHaveBeenCalled();
    expect(mocks.flush).not.toHaveBeenCalled();
  });
  it("waits for durable writes before minimizing from the title", async () => {
    await initializeNative();
    let saved!: () => void;
    mocks.flush.mockReturnValue(new Promise<void>(resolve => { saved = resolve; }));
    listeners.get("backButton")!();
    expect(mocks.minimize).not.toHaveBeenCalled();
    saved(); await settle();
    expect(mocks.minimize).toHaveBeenCalledTimes(1);
  });
  it("keeps the app open with a visible warning when saving fails", async () => {
    await initializeNative();
    mocks.flush.mockRejectedValue(new Error("storage full"));
    listeners.get("backButton")!(); await settle();
    expect(mocks.minimize).not.toHaveBeenCalled();
    expect((document.querySelector(".native-save-warning") as HTMLElement).hidden).toBe(false);
    window.dispatchEvent(new CustomEvent("shi-save-status", { detail: true }));
    expect((document.querySelector(".native-save-warning") as HTMLElement).hidden).toBe(true);
  });
  it("forwards background and foreground changes, flushing only on background", async () => {
    await initializeNative();
    const events: boolean[] = [];
    window.addEventListener("shi-native-active", event => events.push((event as CustomEvent<boolean>).detail));
    listeners.get("appStateChange")!({ isActive: false });
    listeners.get("appStateChange")!({ isActive: true });
    await settle();
    expect(events).toEqual([false, true]);
    expect(mocks.flush).toHaveBeenCalledTimes(1);
    expect(mocks.minimize).not.toHaveBeenCalled();
  });
});
