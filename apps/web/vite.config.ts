import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.SHI_BASE_PATH ?? "/",
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 800,
  },
});
