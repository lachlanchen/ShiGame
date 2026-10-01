import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import { App } from "./App";
import type { DevelopmentCrossingDriver } from "./development-crossing";
import "./styles.css";

function render(developmentCrossing?: DevelopmentCrossingDriver) { createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App developmentCrossing={developmentCrossing} />
  </StrictMode>,
); }

if (import.meta.env.DEV && import.meta.env.VITE_SHI_NATIVE !== "1" && ["campaign", "campaign-v2"].includes(new URLSearchParams(window.location.search).get("crossing") ?? "")) {
  import("./development-crossing").then(({ createDevelopmentCrossingDriver }) => render(createDevelopmentCrossingDriver(localStorage,
    new URLSearchParams(window.location.search).get("crossing") === "campaign-v2" ? 2 : 1))).catch(() => {
    document.getElementById("root")!.textContent = "SHI could not open the development crossing save. Original progress has been preserved. Reload to retry.";
  });
} else if (import.meta.env.VITE_SHI_NATIVE === "1") {
  import("./native").then(({ initializeNative }) => initializeNative()).then(() => render()).catch(() => {
    // Do not start a fresh campaign over an unreadable native save.
    const root = document.getElementById("root")!;
    root.textContent = "SHI could not open your saved progress. Your save has not been replaced. ";
    const retry = document.createElement("button");
    retry.textContent = "Retry";
    retry.onclick = () => window.location.reload();
    root.append(retry);
  });
} else render();
