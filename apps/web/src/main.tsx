import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import { App } from "./App";
import "./styles.css";

function render() { createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
); }

if (import.meta.env.VITE_SHI_NATIVE === "1") {
  import("./native").then(({ initializeNative }) => initializeNative()).then(render).catch(() => {
    // Do not start a fresh campaign over an unreadable native save.
    const root = document.getElementById("root")!;
    root.textContent = "SHI could not open your saved progress. Your save has not been replaced. ";
    const retry = document.createElement("button");
    retry.textContent = "Retry";
    retry.onclick = () => window.location.reload();
    root.append(retry);
  });
} else render();
