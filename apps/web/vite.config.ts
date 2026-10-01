import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { privateScoreServer } from "./private-score-server";
import { privateCouncilFilmServer } from "./private-council-film-server";
import { privateRainSceneServer } from "./private-rain-scene-server";

export default defineConfig(({ mode, command }) => {
  const internal = mode === "internal-crossing";
  const repository = fileURLToPath(new URL("../..", import.meta.url));
  const output = internal ? process.env.SHI_INTERNAL_CROSSING_OUT : undefined;
  if (internal) {
    if (!output || !resolve(output).startsWith(resolve(repository, ".runtime") + sep)
      || command === "build" && existsSync(output)) throw new Error("Internal crossing requires a fresh output below SHI .runtime.");
    if (["VITE_SHI_NATIVE", "VITE_SHI_PRIVATE_SCORE_AUDITION", "VITE_SHI_PRIVATE_COUNCIL_FILM", "VITE_SHI_PRIVATE_RAIN_SCENE"].some(key => process.env[key] === "1")) {
      throw new Error("Internal crossing excludes native packaging and private media.");
    }
  }
  return {
  plugins: [react(), ...(internal ? [{ name: "shi-internal-crossing-entry", transformIndexHtml: { order: "pre" as const, handler: (html: string) => html
    .replace('/src/main.tsx', '/src/internal-crossing-main.tsx')
    .replace('<title>SHI · The Shape of Power</title>', '<meta name="shi-build-channel" content="internal-crossing-v2" /><title>SHI · Internal Crossing 2</title>') } }] : []),
    privateScoreServer(process.env.VITE_SHI_PRIVATE_SCORE_AUDITION === "1", fileURLToPath(new URL("../..", import.meta.url))),
    privateCouncilFilmServer(process.env.VITE_SHI_PRIVATE_COUNCIL_FILM === "1", fileURLToPath(new URL("../..", import.meta.url))),
    privateRainSceneServer(process.env.VITE_SHI_PRIVATE_RAIN_SCENE === "1", fileURLToPath(new URL("../..", import.meta.url)))],
  base: internal ? "/" : process.env.SHI_BASE_PATH ?? "/",
  build: {
    ...(internal ? { outDir: resolve(output!), emptyOutDir: false } : {}),
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
  };
});
