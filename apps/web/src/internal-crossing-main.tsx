import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "./styles.css";

// A separate, production-compiled entry. The public entry never imports this
// module; URL parameters cannot enable this candidate in the released game.
const root = document.getElementById("root")!;
const chinese = navigator.language.toLowerCase().startsWith("zh");
root.textContent = chinese ? "正在打开内部试玩…" : "Opening internal playthrough…";
if (import.meta.env.MODE !== "internal-crossing" || import.meta.env.VITE_SHI_NATIVE === "1") {
  throw new Error("Internal crossing entry requires its isolated web build.");
}
Promise.all([import("./App"), import("./development-crossing")]).then(([{ App }, { createDevelopmentCrossingDriver }]) => {
  const driver = createDevelopmentCrossingDriver(localStorage, 2, "internal");
  createRoot(root).render(<StrictMode><App developmentCrossing={driver} /></StrictMode>);
}).catch(() => {
  root.textContent = chinese ? "内部试玩未能打开。原有存档未被替换。" : "The internal playthrough could not open. Existing saves have not been replaced. ";
  const retry = document.createElement("button");
  retry.textContent = chinese ? "重试" : "Retry";
  retry.onclick = () => window.location.reload();
  root.append(retry);
});
