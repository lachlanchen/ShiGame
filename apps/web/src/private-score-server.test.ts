import { describe, expect, it } from "vitest";
import { privateScorePath, privateScoreServer } from "../private-score-server";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";

async function request(enabled: boolean, url: string, address = "127.0.0.1", host = "127.0.0.1:4173", method = "GET") {
  let middleware!: (request: IncomingMessage, response: ServerResponse, next: () => void) => Promise<void>;
  const plugin = privateScoreServer(enabled, "/intentionally-missing-shi-audition");
  const configure = plugin.configureServer as (server: ViteDevServer) => void;
  configure({ middlewares: { use: (value: typeof middleware) => { middleware = value; } } } as unknown as ViteDevServer);
  const result = { statusCode: 200, next: false, headers: {} as Record<string, unknown>, body: "", setHeader(key: string, value: unknown) { this.headers[key] = value; }, end(value = "") { this.body = String(value); } };
  await middleware({ url, method, headers: { host }, socket: { remoteAddress: address } } as IncomingMessage, result as unknown as ServerResponse, () => { result.next = true; });
  return result;
}
describe("private score server isolation", () => {
  it("does not intercept ordinary game requests", async () => { expect((await request(false, "/")).next).toBe(true); });
  it.each([
    [false, privateScorePath, "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, privateScorePath, "192.0.2.1", "127.0.0.1:4173", "GET"],
    [true, privateScorePath, "127.0.0.1", "public.example", "GET"],
    [true, "/__shi_private_score__/../request.json", "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, `${privateScorePath}?file=other`, "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, privateScorePath, "127.0.0.1", "127.0.0.1:4173", "POST"],
  ] as const)("rejects disabled, remote and arbitrary asset requests (%s %s %s %s %s)", async (enabled, url, address, host, method) => {
    const result = await request(enabled, url, address, host, method); expect(result.statusCode).toBe(404); expect(result.body).toBe(""); expect(result.headers["Cache-Control"]).toBe("no-store");
  });
  it("fails closed when the pinned listening copy is unavailable", async () => { expect((await request(true, privateScorePath)).statusCode).toBe(503); });
});
