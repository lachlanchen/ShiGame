import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export const privateScorePath = "/__shi_private_score__/candidate-b.mp3";
export const privateScoreSHA256 = "7d28d185acd999637b19fd9eb0eb1bec778eff9f17c9507fff92519643cdada4";

/** One fixed private listening copy, never a directory server or build asset. */
export function privateScoreServer(enabled: boolean, root: string): Plugin {
  return {
    name: "shi-private-score-audition",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith("/__shi_private_score__")) return next();
        response.setHeader("Cache-Control", "no-store");
        const address = request.socket.remoteAddress;
        const host = request.headers.host?.split(":")[0];
        if (!enabled || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "")
          || !["localhost", "127.0.0.1"].includes(host ?? "")) {
          response.statusCode = 404; response.end(); return;
        }
        if (request.url !== privateScorePath || !["GET", "HEAD"].includes(request.method ?? "")) {
          response.statusCode = 404; response.end(); return;
        }
        try {
          const bytes = await readFile(resolve(root, ".runtime/local-cinema-20260926/score-audition/preview-926102.mp3"));
          if (createHash("sha256").update(bytes).digest("hex") !== privateScoreSHA256) throw new Error("Score identity mismatch");
          response.setHeader("Content-Type", "audio/mpeg");
          response.setHeader("Content-Length", bytes.length);
          response.setHeader("X-Content-Type-Options", "nosniff");
          response.end(request.method === "HEAD" ? undefined : bytes);
        } catch { response.statusCode = 503; response.end("Private score unavailable; original files are unchanged."); }
      });
    },
  };
}
