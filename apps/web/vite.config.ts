import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.SHI_BASE_PATH ?? "/",
  build: {
    target: "es2022",
    sourcemap: process.env.SHI_SOURCEMAP === "1" ? "hidden" : false,
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Compress the already-eager dependency graph together. Dynamic scene,
          // font and Three.js imports retain their on-demand boundaries.
          groups: [{ name: "initial", tags: ["$initial"] }],
        },
      },
    },
  },
});
