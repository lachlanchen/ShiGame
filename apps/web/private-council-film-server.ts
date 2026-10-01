import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export const councilFilmPath = "/__shi_private_council_film__/study.mp4";
export const councilFilmSHA256 = "ef86dc9babb6e073949b2285a75bd4cc82703cae8eef55a422b42fe476819345";
const captions = "WEBVTT\n\n00:00.000 --> 00:04.000\nPrivate engineering study: the keeper raises one arm and returns to rest.\nNot a depiction of this order or final acting.\n";

/** Fixed, loopback-only review artifacts. Never package private media. */
export function privateCouncilFilmServer(enabled: boolean, root: string): Plugin {
  return { name: "shi-private-council-film", apply: "serve", configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith("/__shi_private_council_film__")) return next();
      response.setHeader("Cache-Control", "no-store");
      const host = request.headers.host?.split(":")[0];
      if (!enabled || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "")
        || !["localhost", "127.0.0.1"].includes(host ?? "")
        || !["GET", "HEAD"].includes(request.method ?? "")
        || ![councilFilmPath, "/__shi_private_council_film__/study.vtt"].includes(request.url)) {
        response.statusCode = 404; response.end(); return;
      }
      try {
        let bytes: Buffer;
        if (request.url === councilFilmPath) {
          bytes = await readFile(resolve(root, ".runtime/council-relaxed-gesture-20261001-v2/speaker-study.mp4"));
          if (createHash("sha256").update(bytes).digest("hex") !== councilFilmSHA256) throw new Error("Film identity mismatch");
          response.setHeader("Content-Type", "video/mp4");
        } else {
          bytes = Buffer.from(captions);
          response.setHeader("Content-Type", "text/vtt; charset=utf-8");
        }
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Content-Length", bytes.length);
        response.end(request.method === "HEAD" ? undefined : bytes);
      } catch { response.statusCode = 503; response.end("Private film unavailable. Continue with the written response."); }
    });
  } };
}
