import { describe, expect, it } from "vitest";
import { councilFilmPath, privateCouncilFilmServer } from "../private-council-film-server";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";

async function request(enabled: boolean, url: string, address = "127.0.0.1", host = "127.0.0.1:4173", method = "GET") {
  let middleware!: (request: IncomingMessage, response: ServerResponse, next: () => void) => Promise<void>;
  const configure = privateCouncilFilmServer(enabled, "/missing-private-film").configureServer as (server: ViteDevServer) => void;
  configure({ middlewares: { use: (value: typeof middleware) => { middleware = value; } } } as unknown as ViteDevServer);
  const result = { statusCode: 200, next: false, headers: {} as Record<string, unknown>, body: "", setHeader(key: string, value: unknown) { this.headers[key] = value; }, end(value = "") { this.body = String(value); } };
  await middleware({ url, method, headers: { host }, socket: { remoteAddress: address } } as IncomingMessage, result as unknown as ServerResponse, () => { result.next = true; });
  return result;
}
describe("private council film isolation", () => {
  it("leaves ordinary requests alone", async () => { expect((await request(false, "/")).next).toBe(true); });
  it.each([
    [false, councilFilmPath, "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, councilFilmPath, "192.0.2.1", "127.0.0.1:4173", "GET"],
    [true, councilFilmPath, "127.0.0.1", "public.example", "GET"],
    [true, `${councilFilmPath}?file=other`, "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, "/__shi_private_council_film__/../receipt.json", "127.0.0.1", "127.0.0.1:4173", "GET"],
    [true, councilFilmPath, "127.0.0.1", "127.0.0.1:4173", "POST"],
  ] as const)("rejects disabled, remote or arbitrary requests (%s %s %s %s %s)", async (enabled, url, address, host, method) => {
    expect((await request(enabled, url, address, host, method)).statusCode).toBe(404);
  });
  it("fails closed for an unavailable pinned movie", async () => { expect((await request(true, councilFilmPath)).statusCode).toBe(503); });
  it("serves only the fixed descriptive captions without caching", async () => {
    const result = await request(true, "/__shi_private_council_film__/study.vtt");
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("WEBVTT");
    expect(result.body).toContain("Not a depiction of this order");
    expect(result.headers["Cache-Control"]).toBe("no-store");
    expect(result.headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});
