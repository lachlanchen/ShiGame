import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.stubEnv("VITE_SHI_NATIVE", "1"); });
afterEach(() => vi.unstubAllEnvs());

it("restores native state before React and preserves unrelated local keys", async () => {
  localStorage.setItem("other.app", "keep"); localStorage.setItem("shi.old", "stale");
  const { initializePersistence, gameStorage } = await import("./persistence");
  await initializePersistence({ read: async () => '{"shi.locale":"ar","shi.chapter-01.save.v6":"route"}', write: vi.fn() });
  expect(gameStorage.getItem("shi.locale")).toBe("ar");
  expect(gameStorage.getItem("shi.old")).toBeNull();
  expect(localStorage.getItem("other.app")).toBe("keep");
});

it.each(['{"unrelated":"bad"}', '{"shi.save":13}', "[]", "not json"])("preserves originals when native data is invalid: %s", async (raw) => {
  localStorage.setItem("shi.save", "original");
  const { initializePersistence } = await import("./persistence"); const write = vi.fn();
  await expect(initializePersistence({ read: async () => raw, write })).rejects.toThrow();
  expect(write).not.toHaveBeenCalled(); expect(localStorage.getItem("shi.save")).toBe("original");
});

it("serializes updates and deletion, and never exports another app's storage", async () => {
  const values: string[] = []; localStorage.setItem("other.app", "private");
  const { initializePersistence, gameStorage, flushPersistence } = await import("./persistence");
  await initializePersistence({ read: async () => null, write: async (value) => { values.push(value); } });
  gameStorage.setItem("shi.save", "one"); gameStorage.setItem("shi.save", "two"); gameStorage.removeItem("shi.save");
  await flushPersistence();
  expect(values).toEqual(["{}", '{"shi.save":"one"}', '{"shi.save":"two"}', "{}"]);
});

it("reports a failed durable write and permits a later successful write", async () => {
  const { initializePersistence, gameStorage, flushPersistence } = await import("./persistence");
  const write = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("disk full")).mockResolvedValue(undefined);
  await initializePersistence({ read: async () => null, write });
  gameStorage.setItem("shi.save", "one"); await expect(flushPersistence()).rejects.toThrow("disk full");
  gameStorage.setItem("shi.save", "two"); await flushPersistence();
  expect(write).toHaveBeenLastCalledWith('{"shi.save":"two"}');
});
