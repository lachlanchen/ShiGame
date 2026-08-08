import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cdpPort = Number(process.env.SHI_CDP_PORT ?? 9321);
const gameUrl = process.env.SHI_PLAYTEST_URL ?? "http://127.0.0.1:4173/";
const outputDir = resolve(import.meta.dirname, "../docs/production/evidence");
await mkdir(outputDir, { recursive: true });

const targets = await fetch(`http://127.0.0.1:${cdpPort}/json`).then((response) => response.json());
const target = targets.find((candidate) => candidate.type === "page" && /^https?:/.test(candidate.url));
if (!target) throw new Error("SHI page target was not found on the dedicated CDP port.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, reject) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const consoleErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve: resolveCall, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolveCall(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") consoleErrors.push(message.params.entry.text);
});

const send = (method, params = {}) => new Promise((resolveCall, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve: resolveCall, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const rect = async (selector, index = 0) => evaluate(`(() => {
  const element = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
  if (!element) throw new Error("Missing selector: ${selector}[${index}]");
  const box = element.getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height };
})()`);
const click = async (selector, index = 0) => {
  const box = await rect(selector, index);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
};
const key = async (keyName, code = keyName) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code });
};
const screenshot = async (name) => {
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(resolve(outputDir, name), Buffer.from(result.data, "base64"));
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const waitForSelector = async (selector, timeout = 5000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${selector}`);
};
const waitForTitleAssets = async () => {
  await waitForSelector("canvas", 15000);
  await evaluate(`Promise.all([
    document.fonts.ready,
    new Promise((resolveImage, rejectImage) => {
      const background = getComputedStyle(document.querySelector('.title-image')).backgroundImage;
      const url = background.match(/url\\(["']?(.*?)["']?\\)/)?.[1];
      if (!url) return rejectImage(new Error('Title background URL is missing'));
      const image = new Image();
      image.onload = () => resolveImage(true);
      image.onerror = () => rejectImage(new Error('Title background failed to load'));
      image.src = url;
    })
  ]).then(() => true)`);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Page.navigate", { url: gameUrl });
await waitForSelector(".primary-button", 10000);
await evaluate("localStorage.clear(); location.reload(); true");
await waitForSelector(".primary-button");
await waitForTitleAssets();
await wait(250);

const report = { checks: [], consoleErrors };
const check = (condition, message) => {
  assert(condition, message);
  report.checks.push(message);
};

await screenshot("web-01-title-en.png");
let snapshot = await evaluate(`({
  title: document.title,
  primary: document.querySelector('.primary-button')?.textContent?.trim(),
  canvas: document.querySelectorAll('canvas').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})`);
check(snapshot.title === "SHI · The Shape of Power", "title metadata is present");
check(snapshot.primary.includes("Enter the rain"), "new game call-to-action is visible");
check(snapshot.canvas === 1, "Three.js atmosphere rendered to a canvas");
check(snapshot.overflow <= 1, "desktop title has no horizontal overflow");

await click(".primary-button");
await wait(700);
await screenshot("web-02-gameplay-en.png");
snapshot = await evaluate(`({
  heading: document.querySelector('.story-panel h1')?.textContent?.trim(),
  choices: document.querySelectorAll('.choice-card').length,
  meters: document.querySelectorAll('[role=meter]').length,
  sourceButton: document.querySelector('.source-link')?.textContent?.trim(),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})`);
check(snapshot.heading === "The road has become a river", "opening story node rendered from shared content");
check(snapshot.choices === 3, "opening offers three strategic choices");
check(snapshot.meters === 5, "all five strategic resources are visible");
check(snapshot.sourceButton.includes("3"), "node source count is visible");
check(snapshot.overflow <= 1, "desktop gameplay has no horizontal overflow");

await click(".source-link");
await wait(350);
await screenshot("web-03-source-ledger.png");
snapshot = await evaluate(`({ sources: document.querySelectorAll('.source').length, reconstructions: document.querySelectorAll('.source-dramatic-reconstruction').length })`);
check(snapshot.sources === 3, "source ledger opens with the node's three records");
check(snapshot.reconstructions === 1, "dramatic reconstruction is visually distinguished");
await click(".drawer .icon-button");
await wait(250);

await click(".header-select");
await key("Home");
await key("ArrowDown");
await key("Enter");
await wait(350);
await screenshot("web-04-gameplay-ar-rtl.png");
snapshot = await evaluate(`({ locale: document.documentElement.lang, direction: document.documentElement.dir, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })`);
check(snapshot.locale === "ar" && snapshot.direction === "rtl", "Arabic switches the document to RTL");
check(snapshot.overflow <= 1, "Arabic RTL gameplay has no horizontal overflow");

await click(".header-select");
await key("Home");
await key("Enter");
await wait(250);
await click(".choice-card", 0);
await wait(650);
await screenshot("web-05-choice-resolution.png");
snapshot = await evaluate(`({
  heading: document.querySelector('.story-panel h1')?.textContent?.trim(),
  resolution: document.querySelector('.resolution-banner')?.textContent?.trim(),
  history: JSON.parse(localStorage.getItem('shi.chapter-01.save.v1') || '{}').history?.length
})`);
check(snapshot.heading === "A covenant must eat", "choice advances to the authored branch");
check(snapshot.resolution.includes("The ranks see one another"), "choice consequence remains visible after transition");
check(snapshot.history === 1, "choice is persisted locally");

await send("Page.reload", { ignoreCache: true });
await waitForSelector(".primary-button");
snapshot = await evaluate(`({ primary: document.querySelector('.primary-button')?.textContent?.trim() })`);
check(snapshot.primary.includes("Continue"), "reload offers save continuation");
await click(".primary-button");
await wait(400);
snapshot = await evaluate(`document.querySelector('.story-panel h1')?.textContent?.trim()`);
check(snapshot === "A covenant must eat", "save resumes at the exact branch node");

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
await wait(450);
await screenshot("web-06-mobile-gameplay.png");
snapshot = await evaluate(`({ choices: document.querySelectorAll('.choice-card').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, width: innerWidth })`);
check(snapshot.width === 390 && snapshot.choices === 2, "mobile viewport retains the active branch choices");
check(snapshot.overflow <= 1, "mobile gameplay has no horizontal overflow");
await send("Emulation.clearDeviceMetricsOverride");

if (consoleErrors.length > 0) console.error("Browser console errors:", JSON.stringify(consoleErrors, null, 2));
check(consoleErrors.length === 0, "browser console remained free of errors");
await writeFile(resolve(outputDir, "web-playtest-status.json"), `${JSON.stringify({ ok: true, ...report, target: gameUrl, cdpPort }, null, 2)}\n`);
socket.close();
console.log(`Visible playtest passed: ${report.checks.length} checks, ${consoleErrors.length} console errors.`);
