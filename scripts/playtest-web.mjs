import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cdpPort = Number(process.env.SHI_CDP_PORT ?? 9321);
const gameUrl = process.env.SHI_PLAYTEST_URL ?? "http://127.0.0.1:4173/";
const testUrl = new URL(gameUrl);
testUrl.searchParams.set("seed", process.env.SHI_PLAYTEST_SEED ?? "5EED2026");
const testedCommit = process.env.SHI_TESTED_COMMIT ?? "working-tree";
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
const selectValue = async (selector, value) => evaluate(`(() => {
  const select = document.querySelector(${JSON.stringify(selector)});
  if (!(select instanceof HTMLSelectElement)) throw new Error("Missing select: ${selector}");
  select.focus();
  select.value = ${JSON.stringify(value)};
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return select.value;
})()`);
const key = async (keyName, code = keyName) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code });
};
const altShortcut = async (keyName, code) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Alt", code: "AltLeft", modifiers: 1 });
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code, modifiers: 1 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, modifiers: 1 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Alt", code: "AltLeft" });
};
const shiftDigit = async (digit) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Shift", code: "ShiftLeft", modifiers: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: digit === "1" ? "!" : digit, code: `Digit${digit}`, modifiers: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: digit === "1" ? "!" : digit, code: `Digit${digit}`, modifiers: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Shift", code: "ShiftLeft" });
};
const gamepadButton = async (index) => {
  await evaluate(`window.__SHI_VIRTUAL_GAMEPAD__.setButton(${index}, true)`);
  await wait(500);
  await evaluate(`window.__SHI_VIRTUAL_GAMEPAD__.setButton(${index}, false)`);
  await wait(500);
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
await send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 }));
  const gamepad = { id: 'SHI noVNC virtual standard controller', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [gamepad] });
  Object.defineProperty(window, '__SHI_VIRTUAL_GAMEPAD__', { configurable: true, value: {
    setButton(index, pressed) {
      buttons[index].pressed = pressed;
      buttons[index].touched = pressed;
      buttons[index].value = pressed ? 1 : 0;
      gamepad.timestamp += 1;
    }
  }});
})()` });
await send("Page.navigate", { url: testUrl.href });
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
  controller: document.querySelector('[data-testid=shi-app]')?.getAttribute('data-controller'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})`);
check(snapshot.title === "SHI · The Shape of Power", "title metadata is present");
check(snapshot.primary.includes("Enter the rain"), "new game call-to-action is visible");
check(snapshot.canvas === 1, "Three.js atmosphere rendered to a canvas");
check(snapshot.controller === "connected", "standard Gamepad API device is detected on the title");
check(snapshot.overflow <= 1, "desktop title has no horizontal overflow");

await gamepadButton(0);
await waitForSelector("[data-testid=guide-drawer]");
await screenshot("web-09-field-guide.png");
snapshot = await evaluate(`({
  modal: document.querySelector('[data-testid=guide-drawer]')?.getAttribute('aria-modal'),
  steps: document.querySelectorAll('.guide-steps li').length,
  controller: document.querySelector('.controller-callout')?.textContent?.trim(),
  history: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').history?.length ?? 0,
  onboarding: localStorage.getItem('shi.onboarding.field-guide.v1'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})`);
check(snapshot.modal === "true" && snapshot.steps === 3, "first-run field guide teaches three position-reading steps");
check(snapshot.controller.includes("Controller ready"), "field guide reports the connected controller textually");
check(snapshot.history === 0 && snapshot.onboarding === null, "field guide changes no campaign state before dismissal");
check(snapshot.overflow <= 1, "field guide has no desktop horizontal overflow");
await gamepadButton(0);
await wait(450);
await screenshot("web-02-gameplay-en.png");
snapshot = await evaluate(`({
  heading: document.querySelector('.story-panel h1')?.textContent?.trim(),
  choices: document.querySelectorAll('.choice-card').length,
  meters: document.querySelectorAll('[role=meter]').length,
  sourceButton: document.querySelector('.source-link')?.textContent?.trim(),
  pressureWarnings: document.querySelectorAll('.pressure-warning').length,
  fieldTitle: document.querySelector('.field-signal h2')?.textContent?.trim(),
  fieldEffects: document.querySelector('.field-effects')?.textContent?.trim(),
  seed: document.querySelector('[data-testid=shi-app]')?.getAttribute('data-seed'),
  onboarding: localStorage.getItem('shi.onboarding.field-guide.v1'),
  saveVersion: document.querySelector('[data-save-version]')?.getAttribute('data-save-version'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
})`);
check(snapshot.heading === "The road has become a river", "opening story node rendered from shared content");
check(snapshot.choices === 3, "opening offers three strategic choices");
check(snapshot.meters === 5, "all five strategic resources are visible");
check(snapshot.sourceButton.includes("4"), "node source count is visible");
check(snapshot.pressureWarnings === 3, "every opening choice exposes a qualitative pressure warning");
check(snapshot.fieldTitle === "Water over the axle", "seeded field signal is disclosed before commitment");
check(snapshot.fieldEffects.includes("-3 Grain") && snapshot.fieldEffects.includes("+2 Exposure"), "field signal exposes its exact resource effects");
check(snapshot.seed === "5EED2026", "shareable hexadecimal chronicle seed is visible");
check(snapshot.onboarding === "complete", "dismissed onboarding preference is stored outside campaign state");
check(snapshot.saveVersion === "3", "web client advertises save contract version 3");
check(snapshot.overflow <= 1, "desktop gameplay has no horizontal overflow");

await gamepadButton(3);
await waitForSelector("[data-testid=map-intel]");
await wait(250);
await screenshot("web-13-wartable-intel-daze.png");
snapshot = await evaluate(`({
  title: document.querySelector('[data-testid=map-intel] h2')?.textContent?.trim(),
  status: document.querySelector('[data-testid=map-intel] .map-intel-head span')?.textContent?.trim(),
  known: document.querySelectorAll('.site-known').length,
  reported: document.querySelectorAll('.site-reported').length,
  reference: document.querySelectorAll('.site-reference').length,
  selected: document.querySelector('.site-marker[aria-pressed=true]')?.getAttribute('data-site-id'),
  history: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').history?.length ?? 0
})`);
check(snapshot.title === "Daze Village" && snapshot.status === "Known ground", "Y/Triangle opens intelligence on the active known site");
check(snapshot.known === 2 && snapshot.reported === 2 && snapshot.reference === 1, "wartable differentiates known, reported and reference-only sites");
check(snapshot.selected === "daze", "inspected marker exposes its selected state accessibly");
check(snapshot.history === 0, "opening the intelligence map does not mutate campaign history");

await gamepadButton(15);
await gamepadButton(15);
await wait(250);
await screenshot("web-14-wartable-reported-pei.png");
snapshot = await evaluate(`({
  title: document.querySelector('[data-testid=map-intel] h2')?.textContent?.trim(),
  copy: document.querySelector('[data-testid=map-intel]')?.textContent?.trim(),
  selected: document.querySelector('.site-marker[aria-pressed=true]')?.getAttribute('data-site-id')
})`);
check(snapshot.title === "Pei" && snapshot.selected === "pei", "D-pad cycles intelligence sites without moving the campaign");
check(snapshot.copy.includes("Reported network") && snapshot.copy.includes("not knowledge available to the opening council"), "reported intelligence discloses its hindsight boundary");

await gamepadButton(0);
await waitForSelector("[data-testid=sources-drawer]");
await wait(250);
await screenshot("web-15-wartable-site-evidence.png");
snapshot = await evaluate(`({
  context: document.querySelector('[data-testid=sources-drawer] .eyebrow')?.textContent?.trim(),
  sources: document.querySelectorAll('.source').length,
  claims: document.querySelectorAll('.claim').length
})`);
check(snapshot.context === "Pei", "site evidence drawer retains the inspected place as context");
check(snapshot.sources === 5 && snapshot.claims === 3, "site evidence is filtered to the place's five records and three claims");
await gamepadButton(1);
await wait(250);
snapshot = await evaluate(`document.querySelector('[data-testid=map-intel] h2')?.textContent?.trim()`);
check(snapshot === "Pei", "closing site evidence returns to the inspected wartable position");
await gamepadButton(3);
snapshot = await evaluate(`Boolean(document.querySelector('[data-testid=map-intel]'))`);
check(snapshot === false, "Y/Triangle closes wartable inspection cleanly");

await gamepadButton(15);
snapshot = await evaluate(`document.querySelector('[data-choice-id=take-the-beacon]')?.classList.contains('is-gamepad-selected')`);
check(snapshot === true, "D-pad moves the highlighted enabled decision");
await gamepadButton(14);
await gamepadButton(5);
await wait(350);
await screenshot("web-03-source-ledger.png");
snapshot = await evaluate(`({
  sources: document.querySelectorAll('.source').length,
  reconstructions: document.querySelectorAll('.source-dramatic-reconstruction').length,
  claims: document.querySelectorAll('.claim').length,
  specialists: document.querySelectorAll('.claim-specialist-review-required').length,
  locators: [...document.querySelectorAll('.source-locator')].map((item) => item.textContent?.trim()),
  publicLinks: document.querySelectorAll('.source-external[href^="https://zh.wikisource.org/"]').length
})`);
check(snapshot.sources === 4, "source ledger opens with the node's four records");
check(snapshot.reconstructions === 1, "dramatic reconstruction is visually distinguished");
check(snapshot.claims === 9, "active scene exposes its nine historical and reconstruction claims");
check(snapshot.specialists === 2, "two unresolved P0 claims are visibly marked for specialist review");
check(snapshot.locators.includes("卷048 · 陳涉世家第十八 · 二世元年七月段"), "source ledger exposes the exact Shiji locator");
check(snapshot.publicLinks === 3, "public edition links are distinct from the project-original reconstruction");
await evaluate(`(() => { const drawer = document.querySelector('.drawer'); drawer.scrollTop = drawer.scrollHeight; return drawer.scrollTop; })()`);
await wait(350);
await screenshot("web-12-claim-register.png");
snapshot = await evaluate(`({ authored: document.querySelectorAll('.claim-authored-reconstruction').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })`);
check(snapshot.authored === 3, "authored reconstruction claims remain visually distinct from historical evidence");
check(snapshot.overflow <= 1, "claim register has no desktop horizontal overflow");
await gamepadButton(1);
await wait(250);
snapshot = await evaluate(`Boolean(document.querySelector('.drawer'))`);
check(snapshot === false, "B/Circle closes the source ledger");

await selectValue(".header-select", "ar");
await wait(350);
await screenshot("web-04-gameplay-ar-rtl.png");
snapshot = await evaluate(`({ locale: document.documentElement.lang, direction: document.documentElement.dir, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })`);
check(snapshot.locale === "ar" && snapshot.direction === "rtl", "Arabic switches the document to RTL");
check(snapshot.overflow <= 1, "Arabic RTL gameplay has no horizontal overflow");
await gamepadButton(9);
await waitForSelector("[data-testid=guide-drawer]");
await wait(250);
await screenshot("web-11-guide-ar-rtl.png");
snapshot = await evaluate(`(() => {
  const guide = document.querySelector('[data-testid=guide-drawer]');
  const box = guide?.getBoundingClientRect();
  return { direction: getComputedStyle(guide).direction, steps: guide?.querySelectorAll('.guide-steps li').length, left: box?.left, right: box?.right, width: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
})()`);
check(snapshot.direction === "rtl" && snapshot.steps === 3 && snapshot.left >= 0 && snapshot.right <= snapshot.width, "Arabic field guide is RTL and fitted to the viewport");
check(snapshot.overflow <= 1, "Arabic field guide has no horizontal overflow");
await gamepadButton(1);

await selectValue(".header-select", "en");
await wait(250);
await click(".story-panel");
await shiftDigit("1");
await wait(650);
await screenshot("web-05-choice-resolution.png");
snapshot = await evaluate(`({
  heading: document.querySelector('.story-panel h1')?.textContent?.trim(),
  resolution: document.querySelector('.resolution-banner')?.textContent?.trim(),
  pressure: document.querySelector('.pressure-reveal')?.textContent?.trim(),
  field: document.querySelector('.field-reveal')?.textContent?.trim(),
  pressureDeltas: document.querySelectorAll('.pressure-deltas span').length,
  fieldDeltas: document.querySelectorAll('.field-deltas span').length,
  history: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').history?.length,
  conditionId: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').history?.[0]?.conditionId,
  seed: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').seed,
  saveVersion: JSON.parse(localStorage.getItem('shi.chapter-01.save.v3') || '{}').saveVersion
})`);
check(snapshot.heading === "A covenant must eat", "choice advances to the authored branch");
check(snapshot.resolution.includes("The ranks see one another"), "choice consequence remains visible after transition");
check(snapshot.pressure.includes("relay clerk"), "authored pressure response is revealed after commitment");
check(snapshot.pressureDeltas === 2, "pressure resource deltas remain visually separate");
check(snapshot.field.includes("Water over the axle") && snapshot.fieldDeltas === 2, "disclosed field condition resolves as a separate third stage");
check(snapshot.history === 1, "choice is persisted locally");
check(snapshot.conditionId === "water-over-axle" && snapshot.seed === 0x5eed2026, "save records the matching seed and condition identity");
check(snapshot.saveVersion === 3, "persisted save uses replayable format 3");

await send("Page.reload", { ignoreCache: true });
await waitForSelector(".primary-button");
snapshot = await evaluate(`({ primary: document.querySelector('.primary-button')?.textContent?.trim() })`);
check(snapshot.primary.includes("Continue"), "reload offers save continuation");
await click(".primary-button");
await wait(400);
snapshot = await evaluate(`({ heading: document.querySelector('.story-panel h1')?.textContent?.trim(), seed: document.querySelector('[data-testid=shi-app]')?.getAttribute('data-seed'), condition: document.querySelector('[data-testid=shi-app]')?.getAttribute('data-condition-id') })`);
check(snapshot.heading === "A covenant must eat", "save resumes at the exact branch node");
check(snapshot.seed === "5EED2026" && Boolean(snapshot.condition), "reload preserves the seed and derives the next field condition");

await gamepadButton(4);
await wait(300);
await screenshot("web-07-pressure-record.png");
snapshot = await evaluate(`({ records: document.querySelectorAll('.record-list li').length, pressure: document.querySelector('.record-pressure')?.textContent?.trim(), field: document.querySelector('.record-field')?.textContent?.trim() })`);
check(snapshot.records === 1, "decision record contains the migrated turn");
check(snapshot.pressure.includes("relay clerk"), "decision record preserves the revealed pressure response");
check(snapshot.field.includes("Water over the axle"), "decision record preserves the applied field condition");
await gamepadButton(1);

await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
await wait(450);
await screenshot("web-06-mobile-gameplay.png");
snapshot = await evaluate(`({ choices: document.querySelectorAll('.choice-card').length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, width: innerWidth })`);
check(snapshot.width === 390 && snapshot.choices === 2, "mobile viewport retains the active branch choices");
check(snapshot.overflow <= 1, "mobile gameplay has no horizontal overflow");
await evaluate("scrollTo(0, 0); true");
await gamepadButton(3);
await waitForSelector("[data-testid=map-intel]");
await wait(250);
await screenshot("web-16-mobile-wartable-intel.png");
snapshot = await evaluate(`(() => {
  const column = document.querySelector('.map-column')?.getBoundingClientRect();
  const panel = document.querySelector('[data-testid=map-intel]')?.getBoundingClientRect();
  return { columnHeight: column?.height, panelTop: panel?.top, panelBottom: panel?.bottom, columnTop: column?.top, columnBottom: column?.bottom, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
})()`);
check(snapshot.columnHeight >= 400 && snapshot.panelTop >= snapshot.columnTop && snapshot.panelBottom <= snapshot.columnBottom, "mobile wartable expands to keep the intelligence panel fully visible");
check(snapshot.overflow <= 1, "mobile wartable inspection has no horizontal overflow");
await gamepadButton(3);
await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 360, y: 760, deltaX: 0, deltaY: 650 });
await wait(450);
await screenshot("web-08-mobile-choices.png");
snapshot = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.choice-card')];
  const visible = cards.filter((card) => { const box = card.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight; });
  return { visible: visible.length, warnings: visible.reduce((count, card) => count + card.querySelectorAll('.pressure-warning').length, 0), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
})()`);
check(snapshot.visible >= 1, "mobile scroll reaches a complete decision card");
check(snapshot.warnings >= 1, "mobile decision card keeps its pressure warning readable");
check(snapshot.overflow <= 1, "scrolled mobile decisions retain horizontal fit");
await gamepadButton(9);
await waitForSelector("[data-testid=guide-drawer]");
await wait(250);
await screenshot("web-10-mobile-guide.png");
snapshot = await evaluate(`(() => {
  const guide = document.querySelector('[data-testid=guide-drawer]');
  const box = guide?.getBoundingClientRect();
  return { steps: guide?.querySelectorAll('.guide-steps li').length, left: box?.left, right: box?.right, width: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
})()`);
check(snapshot.steps === 3 && snapshot.left >= 0 && snapshot.right <= snapshot.width, "Start reopens a fitted mobile field guide");
check(snapshot.overflow <= 1, "mobile field guide has no horizontal overflow");
await gamepadButton(1);
await send("Emulation.clearDeviceMetricsOverride");

if (consoleErrors.length > 0) console.error("Browser console errors:", JSON.stringify(consoleErrors, null, 2));
check(consoleErrors.length === 0, "browser console remained free of errors");
await writeFile(resolve(outputDir, "web-playtest-status.json"), `${JSON.stringify({ ok: true, ...report, target: testUrl.href, testedCommit, cdpPort }, null, 2)}\n`);
socket.close();
console.log(`Visible playtest passed: ${report.checks.length} checks, ${consoleErrors.length} console errors.`);
