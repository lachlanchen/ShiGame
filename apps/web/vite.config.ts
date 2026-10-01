import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { privateScoreServer } from "./private-score-server";
import { privateCouncilFilmServer } from "./private-council-film-server";

export default defineConfig({
  plugins: [react(), privateScoreServer(process.env.VITE_SHI_PRIVATE_SCORE_AUDITION === "1", fileURLToPath(new URL("../..", import.meta.url))),
    privateCouncilFilmServer(process.env.VITE_SHI_PRIVATE_COUNCIL_FILM === "1", fileURLToPath(new URL("../..", import.meta.url)))],
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
