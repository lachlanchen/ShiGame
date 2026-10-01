import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import type { Locale } from "@shi/game-core";
import { rainSceneDescription } from "./src/rain-scene-description";

const base = "/__shi_private_rain_scene__/";
const files = {
  "listening.mp4": ["council-listening-animatic-v1.mp4", "56c4bcc2b57fece9ee9feb76ea02767c047576d24f6c5a85da14c3d09015450e", "video/mp4"],
  "listening.png": ["chen-council-listening-v1.png", "a7b05dee15757880ee77b79642a3dd9e1d6e7f1e9004f9e14ca5a27e1239c23a", "image/png"],
} as const;

/** One hash-bound private scene. Production builds never copy its files. */
export function privateRainSceneServer(enabled: boolean, root: string): Plugin {
  return { name: "shi-private-rain-scene", apply: "serve", configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith(base)) return next();
      response.setHeader("Cache-Control", "no-store");
      const host = request.headers.host?.split(":")[0];
      if (!enabled || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "")
        || !["localhost", "127.0.0.1"].includes(host ?? "") || !["GET", "HEAD"].includes(request.method ?? "")) {
        response.statusCode = 404; response.end(); return;
      }
      const url = new URL(request.url, "http://localhost");
      const name = url.pathname.slice(base.length);
      if (!Object.hasOwn(files, name) && name !== "listening.vtt") { response.statusCode = 404; response.end(); return; }
      try {
        let bytes: Buffer;
        if (name === "listening.vtt") {
          const language = url.searchParams.get("locale") as Locale;
          if (!Object.hasOwn(rainSceneDescription, language)) { response.statusCode = 404; response.end(); return; }
          bytes = Buffer.from(`WEBVTT\n\n00:00.000 --> 00:16.000\n${rainSceneDescription[language]}\n`);
          response.setHeader("Content-Type", "text/vtt; charset=utf-8");
        } else {
          const [file, hash, type] = files[name as keyof typeof files];
          bytes = await readFile(resolve(root, ".runtime/council-cinema-20261001", file));
          if (createHash("sha256").update(bytes).digest("hex") !== hash) throw new Error("Scene identity mismatch");
          response.setHeader("Content-Type", type);
        }
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Accept-Ranges", "bytes");
        if (request.headers.range) {
          const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range);
          const start = match ? Number(match[1]) : NaN;
          const end = match?.[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
          if (!Number.isSafeInteger(start) || start < 0 || start > end || start >= bytes.length) {
            response.statusCode = 416; response.setHeader("Content-Range", `bytes */${bytes.length}`); response.end(); return;
          }
          response.statusCode = 206; response.setHeader("Content-Range", `bytes ${start}-${end}/${bytes.length}`);
          bytes = bytes.subarray(start, end + 1);
        }
        response.setHeader("Content-Length", bytes.length);
        response.end(request.method === "HEAD" ? undefined : bytes);
      } catch { response.statusCode = 503; response.end("Scene unavailable. The written story and choices remain available."); }
    });
  } };
}
