// Web keeps its established synchronous store. Native installs a durable writer
// before React starts, so the same migration and deterministic save rules apply.
export interface NativeStore {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}
let native: NativeStore | undefined;
let pending = Promise.resolve();
const snapshot = () => Object.fromEntries(Object.keys(localStorage)
  .filter((key) => key.startsWith("shi.")).map((key) => [key, localStorage.getItem(key)!]));

export async function initializePersistence(store: NativeStore) {
  const raw = await store.read();
  if (raw !== null) {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)
      || Object.entries(saved).some(([key, value]) => !key.startsWith("shi.") || typeof value !== "string")) {
      throw new Error("Invalid SHI native save; original data has been preserved.");
    }
    for (const key of Object.keys(snapshot())) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value as string);
  } else {
    await store.write(JSON.stringify(snapshot()));
  }
  native = store;
}

function persist() {
  if (!native) return;
  const value = JSON.stringify(snapshot());
  const writer = native;
  pending = pending.catch(() => undefined).then(() => writer.write(value));
  void pending.then(
    () => window.dispatchEvent(new CustomEvent("shi-save-status", { detail: true })),
    () => window.dispatchEvent(new CustomEvent("shi-save-status", { detail: false })),
  );
}

export const gameStorage = import.meta.env.VITE_SHI_NATIVE === "1" ? {
  getItem: (key: string) => localStorage.getItem(key),
  setItem(key: string, value: string) { localStorage.setItem(key, value); persist(); },
  removeItem(key: string) { localStorage.removeItem(key); persist(); },
} : localStorage;
export const flushPersistence = () => pending;
