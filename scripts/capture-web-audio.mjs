import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { analyzeAudioArtifact, createAudioSpectrogram } from "./lib/audio-reference.mjs";

const root = resolve(import.meta.dirname, "..");
const cdpPort = Number(process.env.SHI_AUDIO_CDP_PORT ?? 9323);
const sinkName = process.env.SHI_AUDIO_SINK ?? "shi-game-audio-capture";
const ffmpegPath = process.env.SHI_FFMPEG ?? (existsSync("/usr/bin/ffmpeg") ? "/usr/bin/ffmpeg" : "ffmpeg");
const captureUrl = new URL(process.env.SHI_AUDIO_CAPTURE_URL ?? "http://127.0.0.1:4173/");
captureUrl.searchParams.set("seed", process.env.SHI_PLAYTEST_SEED ?? "5EED2026");
const runtimeDir = resolve(root, ".runtime/audio");
const evidenceDir = resolve(root, "docs/production/evidence");
const silencePath = resolve(runtimeDir, "web-pre-consent-silence.wav");
const activePath = resolve(runtimeDir, "web-visible-soundscape.wav");
const screenshotPath = resolve(evidenceDir, "audio-browser-capture-ui.png");
const spectrogramPath = resolve(evidenceDir, "audio-browser-capture-spectrogram.png");
const evidencePath = resolve(evidenceDir, "audio-browser-capture-status.json");
const contractPath = resolve(root, "content/audio/chapter-01-audio.json");
const contractSource = await readFile(contractPath);
const contract = JSON.parse(contractSource);
const captureContract = contract.quality.browserCapture;
const testedCommit = process.env.SHI_TESTED_COMMIT ?? "working-tree";
await Promise.all([mkdir(runtimeDir, { recursive: true }), mkdir(evidenceDir, { recursive: true })]);

const targets = await fetch(`http://127.0.0.1:${cdpPort}/json`).then((response) => {
  if (!response.ok) throw new Error(`CDP target list returned ${response.status}.`);
  return response.json();
});
const target = targets.find((candidate) => candidate.type === "page" && /^https?:/.test(candidate.url));
if (!target) throw new Error("SHI audio-capture page target was not found.");
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
    const operation = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) operation.reject(new Error(message.error.message)); else operation.resolve(message.result);
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
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
};
const waitFor = async (expression, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
};
const click = async (selector) => {
  const box = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error('Missing ${selector}'); const box = element.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
};
const key = async (keyName, code = keyName) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code });
};
const captureScreenshot = async () => {
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(screenshotPath, Buffer.from(result.data, "base64"));
};
const recordMonitor = async (path, seconds, operation) => {
  const args = [
    "-y", "-hide_banner", "-loglevel", "error", "-f", "pulse", "-i", `${sinkName}.monitor`,
    "-t", String(seconds), "-ac", "2", "-ar", String(captureContract.sampleRate), "-c:a", "pcm_s24le", path,
  ];
  const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  await wait(500);
  await operation();
  const code = await new Promise((resolveExit) => child.once("exit", resolveExit));
  if (code !== 0) throw new Error(`Pulse capture failed with ${code}: ${stderr.trim()}`);
};
const stableMetric = (value) => Number.isFinite(value) ? value : "-inf";
const sanitizedAnalysis = (analysis) => ({
  ...analysis,
  metrics: Object.fromEntries(Object.entries(analysis.metrics).map(([keyName, value]) => [keyName, stableMetric(value)])),
  path: relative(root, analysis.path ?? ""),
  committed: false,
});

try {
  await Promise.all([
    send("Page.enable"), send("Runtime.enable"), send("Log.enable"), send("Page.bringToFront"),
    send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1600, screenHeight: 1000 }),
  ]);
  await send("Page.navigate", { url: captureUrl.href });
  await waitFor(`document.readyState === 'complete' && Boolean(document.querySelector('[data-testid=shi-app]'))`);
  await evaluate("localStorage.clear(); true");
  await send("Page.reload", { ignoreCache: true });
  await waitFor(`document.readyState === 'complete' && Boolean(document.querySelector('[data-testid=begin-game]'))`, 15000);
  await click("[data-testid=begin-game]");
  await waitFor(`Boolean(document.querySelector('[data-testid=guide-drawer]'))`);
  await click("[data-testid=guide-continue]");
  await waitFor(`Boolean(document.querySelector('[data-testid=audio-toggle]')) && !document.querySelector('[data-testid=guide-drawer]')`);
  await click("[data-testid=audio-toggle]");
  await waitFor(`Boolean(document.querySelector('[data-testid=audio-drawer]'))`);
  const initialState = await evaluate(`({ enabled: document.querySelector('[data-testid=audio-enabled]')?.checked, status: document.querySelector('[data-testid=shi-app]')?.getAttribute('data-audio-status') })`);
  if (initialState.enabled !== false || initialState.status !== "off") throw new Error(`Audio did not begin off: ${JSON.stringify(initialState)}`);

  await recordMonitor(silencePath, captureContract.preConsentSeconds, async () => { await wait(Math.max(250, (captureContract.preConsentSeconds - .8) * 1000)); });
  const events = [];
  const activeStarted = Date.now();
  const mark = (event) => events.push({ event, atSeconds: Number(((Date.now() - activeStarted) / 1000).toFixed(3)) });
  await recordMonitor(activePath, captureContract.activeSeconds, async () => {
    await click("[data-testid=audio-enabled]");
    await waitFor(`document.querySelector('[data-testid=shi-app]')?.getAttribute('data-audio-status') === 'ready'`);
    mark("enable-sound-and-drawer-cue");
    await wait(1200);
    await captureScreenshot();
    await wait(1700);
    await click("[data-testid=audio-preview]");
    mark("commit-preview-cue");
    await wait(2000);
    await click(".audio-drawer .icon-button");
    await waitFor(`!document.querySelector('[data-testid=audio-drawer]')`);
    mark("close-cue");
    await wait(1800);
    await click(".site-marker[data-site-id=daze]");
    await waitFor(`Boolean(document.querySelector('[data-testid=map-intel]'))`);
    mark("inspect-cue");
    await wait(1800);
    await click("[data-testid=map-intel] button");
    await waitFor(`!document.querySelector('[data-testid=map-intel]')`);
    mark("close-map-cue");
    await wait(1500);
    await key("ArrowDown", "ArrowDown");
    mark("select-cue");
  });

  const [silence, active, browser] = await Promise.all([
    analyzeAudioArtifact(silencePath).then((value) => ({ ...value, path: silencePath })),
    analyzeAudioArtifact(activePath).then((value) => ({ ...value, path: activePath })),
    send("Browser.getVersion"),
  ]);
  await createAudioSpectrogram(activePath, spectrogramPath);
  const limits = contract.quality.limits;
  const checks = [
    { id: "pre-consent-digital-silence", value: stableMetric(silence.metrics.samplePeakDbfs), rule: "-inf", pass: silence.metrics.samplePeakDbfs === Number.NEGATIVE_INFINITY },
    { id: "active-sample-peak", value: active.metrics.samplePeakDbfs, rule: "<=", limit: limits.samplePeakDbfsMax, pass: active.metrics.samplePeakDbfs <= limits.samplePeakDbfsMax },
    { id: "active-true-peak", value: active.metrics.truePeakDbtp, rule: "<=", limit: limits.truePeakDbtpMax, pass: active.metrics.truePeakDbtp <= limits.truePeakDbtpMax },
    { id: "active-loudness-min", value: active.metrics.integratedLufs, rule: ">=", limit: limits.integratedLufsMin, pass: active.metrics.integratedLufs >= limits.integratedLufsMin },
    { id: "active-loudness-max", value: active.metrics.integratedLufs, rule: "<=", limit: limits.integratedLufsMax, pass: active.metrics.integratedLufs <= limits.integratedLufsMax },
    { id: "active-dc-offset", value: active.metrics.dcOffsetAbsolute, rule: "<=", limit: limits.dcOffsetAbsoluteMax, pass: active.metrics.dcOffsetAbsolute <= limits.dcOffsetAbsoluteMax },
    { id: "dual-mono-output", value: active.metrics.stereoDifferenceRms, rule: "<=", limit: limits.stereoDifferenceRmsMax, pass: active.metrics.stereoDifferenceRms <= limits.stereoDifferenceRmsMax },
    { id: "browser-console", value: consoleErrors.length, rule: "===", limit: 0, pass: consoleErrors.length === 0 },
  ];
  const report = {
    schemaVersion: 1,
    kind: "visible-browser-audio-capture",
    contractId: contract.id,
    contractSha256: createHash("sha256").update(contractSource).digest("hex"),
    capturedAt: new Date().toISOString(),
    testedCommit,
    url: captureUrl.href,
    cdpPort,
    sink: sinkName,
    browser: { product: browser.product, protocolVersion: browser.protocolVersion, userAgent: browser.userAgent },
    preConsent: sanitizedAnalysis(silence),
    active: sanitizedAnalysis(active),
    events,
    checks,
    ok: checks.every((check) => check.pass),
    consoleErrors,
    visualEvidence: [relative(root, screenshotPath), relative(root, spectrogramPath)],
    reviewBoundary: {
      engineeringBrowserCapture: checks.every((check) => check.pass) ? "pass" : "fail",
      humanListening: "required",
      physicalDevices: "required",
      unityNativeParity: "required",
    },
  };
  await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`Browser audio capture failed: ${checks.filter((check) => !check.pass).map((check) => check.id).join(", ")}`);
  console.log(`Visible browser audio passed: ${active.metrics.integratedLufs} LUFS, ${active.metrics.truePeakDbtp} dBTP, pre-consent silence.`);
} finally {
  socket.close();
}
