import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { resolve } from "node:path";
import { privateRainSceneServer } from "../private-rain-scene-server";
import { supportedLocales } from "@shi/game-core";

async function request(url: string, options: { enabled?: boolean; address?: string; host?: string; method?: string; root?: string } = {}) {
  let middleware!: (request: IncomingMessage, response: ServerResponse, next: () => void) => Promise<void>;
  const configure = privateRainSceneServer(options.enabled ?? true, options.root ?? resolve(import.meta.dirname, "../../..")).configureServer as (server: ViteDevServer) => void;
  configure({ middlewares: { use: (value: typeof middleware) => { middleware = value; } } } as unknown as ViteDevServer);
  const result = { statusCode: 200, next: false, headers: {} as Record<string, unknown>, body: "",
    setHeader(key: string, value: unknown) { this.headers[key] = value; }, end(value = "") { this.body = String(value); } };
  await middleware({ url, method: options.method ?? "GET", headers: { host: options.host ?? "127.0.0.1:4173" },
    socket: { remoteAddress: options.address ?? "127.0.0.1" } } as IncomingMessage, result as unknown as ServerResponse, () => { result.next = true; });
  return result;
}

describe("private opening cinema access", () => {
  it("leaves unrelated routes alone", async () => { expect((await request("/")).next).toBe(true); });
  it.each([
    ["/__shi_private_rain_scene__/listening.mp4", { enabled: false }],
    ["/__shi_private_rain_scene__/listening.mp4", { address: "192.0.2.1" }],
    ["/__shi_private_rain_scene__/listening.mp4", { host: "public.example" }],
    ["/__shi_private_rain_scene__/listening.mp4", { method: "POST" }],
    ["/__shi_private_rain_scene__/constructor", {}],
    ["/__shi_private_rain_scene__/receipt.json", {}],
    ["/__shi_private_rain_scene__/../image-prompt.txt", {}],
    ["/__shi_private_rain_scene__/listening.vtt?locale=not-a-language", {}],
  ])("rejects arbitrary media and non-local requests: %s", async (url, options) => {
    expect((await request(url as string, options as Parameters<typeof request>[1])).statusCode).toBe(404);
  });
  it("fails without the pinned media while leaving text playable", async () => {
    const result = await request("/__shi_private_rain_scene__/listening.mp4", { root: "/missing-scene" });
    expect(result.statusCode).toBe(503);
    expect(result.body).toContain("written story and choices remain available");
  });
  it.each(supportedLocales)("gets an explicitly translated %s scene description", async locale => {
    const result = await request(`/__shi_private_rain_scene__/listening.vtt?locale=${locale}`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("WEBVTT");
    expect(result.body).toContain("00:16.000");
    if (locale === "ar") expect(result.body).toMatch(/[\u0600-\u06ff]/);
    if (locale === "zh-Hant") expect(result.body).toContain("陳勝");
    expect(result.headers["Cache-Control"]).toBe("no-store");
  });
});
