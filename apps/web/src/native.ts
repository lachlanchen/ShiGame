import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { flushPersistence, initializePersistence } from "./persistence";
import "./native.css";

export async function initializeNative() {
  await initializePersistence({
    read: async () => (await Preferences.get({ key: "shi.mobile.snapshot.v1" })).value,
    write: (value) => Preferences.set({ key: "shi.mobile.snapshot.v1", value }),
  });
  document.documentElement.dataset.native = "true";
  const warning = document.createElement("div");
  warning.className = "native-save-warning";
  warning.setAttribute("role", "alert");
  warning.hidden = true;
  warning.textContent = "Progress could not be saved. Keep SHI open and free some device storage before continuing.";
  document.body.append(warning);
  window.addEventListener("shi-save-status", (event) => { warning.hidden = (event as CustomEvent<boolean>).detail; });
  await App.addListener("backButton", () => {
    // React owns the navigation stack; Android never rewinds a committed order.
    const event = new Event("shi-native-back", { cancelable: true });
    if (window.dispatchEvent(event)) void flushPersistence().then(() => App.minimizeApp()).catch(() => { warning.hidden = false; });
  });
  await App.addListener("appStateChange", ({ isActive }) => {
    window.dispatchEvent(new CustomEvent("shi-native-active", { detail: isActive }));
    if (!isActive) void flushPersistence().catch(() => { warning.hidden = false; });
  });
}
