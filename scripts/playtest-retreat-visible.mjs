// Own one isolated visible desktop; preserve evidence, terminate exact children.
import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile, open, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import net from "node:net";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const route = process.argv[2] ?? "together";
const production = process.env.SHI_PLAYTEST_PRODUCTION === "1";
const internalDirectory = process.env.SHI_PLAYTEST_INTERNAL_CROSSING_DIR;
if (internalDirectory && (!production || route !== "crossing-v2")) throw new Error("Internal candidate review requires production crossing-v2.");
if (production && !["captured", "consequence-loading", "scene-arrival", "interlude-arrival", ...(internalDirectory ? ["crossing-v2"] : [])].includes(route)) throw new Error("Unsupported production review route.");
let internalDist;
if (internalDirectory) {
  const candidate = resolve(internalDirectory);
  if (!candidate.startsWith(resolve(root, ".runtime") + "/")) throw new Error("Candidate must be below SHI .runtime.");
  const receipt = JSON.parse(await readFile(resolve(candidate, "receipt.json"), "utf8"));
  if (receipt.status !== "built-not-playtest-qualified" || receipt.channel !== "internal-crossing-v2") throw new Error("Unknown internal candidate receipt.");
  internalDist = resolve(candidate, "dist");
  const inventory = async directory => {
    const paths = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) paths.push(...await inventory(path));
      else if (entry.isFile()) paths.push(path.slice(internalDist.length + 1));
      else throw new Error("Unexpected candidate link: " + path);
    }
    return paths.sort();
  };
  if (JSON.stringify(await inventory(internalDist)) !== JSON.stringify(receipt.artifacts.map(item => item.file).sort())
    || createHash("sha256").update(JSON.stringify(receipt.artifacts)).digest("hex") !== receipt.artifactTreeSHA256) throw new Error("Candidate inventory changed.");
  execFileSync(process.execPath, ["scripts/validate-web-build.mjs", "--internal-crossing", internalDist], { cwd: root, stdio: "pipe" });
  for (const artifact of receipt.artifacts) {
    const path = resolve(internalDist, artifact.file);
    if (!path.startsWith(internalDist + "/") || createHash("sha256").update(await readFile(path)).digest("hex") !== artifact.sha256) throw new Error("Candidate artifact changed: " + artifact.file);
  }
}
const storyBranch = process.argv[3] ?? "baseline";
if (!["together", "dispersed", "remnant", "scattered", "book", "captured", "crossing", "crossing-v2", "consequence-loading", "scene-arrival", "interlude-arrival"].includes(route) || !["baseline", "partner-search", "loan-search"].includes(storyBranch) || process.argv.length > 4) throw new Error("Unknown review route or story branch");
if (route === "consequence-loading" && !production) throw new Error("Consequence loading review requires the production bundle.");
const isCrossing = route === "crossing" || route === "crossing-v2";
const revisedCrossing = route === "crossing-v2";
const crossingScenario = process.env.SHI_PLAYTEST_CROSSING_SCENARIO ?? "costly";
const crossingScenarios = {
  costly: { commands: ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"], outcome: "costly-crossing", promise: "strained", resources: "48,83,11,97,96" },
  withdrawal: { commands: ["brace-the-approach", "reinforce-the-rear", "staggered-withdrawal"], outcome: "fighting-withdrawal", promise: "strained", resources: "49,80,7,93,90" },
  orderly: { commands: ["screen-through-reeds", "repair-the-landing", "release-the-reserve"], outcome: "orderly-crossing", promise: "kept", resources: "51,91,15,100,87" },
  recovery: { commands: ["brace-the-approach", "reinforce-the-rear", "staggered-withdrawal"], outcome: "rear-broken", promise: "broken", resources: "47,89,20,96,94" },
};
if (!Object.hasOwn(crossingScenarios, crossingScenario) || (crossingScenario !== "costly" && !internalDirectory)) throw new Error("Alternate crossing scenarios require the compiled internal candidate.");
const crossingExpectation = crossingScenarios[crossingScenario];
const graphicsReview = process.env.SHI_PLAYTEST_GRAPHICS ?? "normal";
if (!["normal", "reduced", "unavailable"].includes(graphicsReview) || (graphicsReview !== "normal" && !internalDirectory)) throw new Error("Graphics fault review requires the compiled internal candidate.");
if (crossingScenario === "recovery" && graphicsReview === "unavailable") throw new Error("Review recovery preparation and renderer download faults separately.");
const scoreAudition = process.env.SHI_PLAYTEST_SCORE === "1";
const councilFilm = process.env.SHI_PLAYTEST_COUNCIL_FILM === "1";
const rainCinema = process.env.SHI_PLAYTEST_RAIN_CINEMA === "1";
const morningOrder = process.env.SHI_PLAYTEST_MORNING;
const contactOrder = process.env.SHI_PLAYTEST_CONTACT;
const followupOrder = process.env.SHI_PLAYTEST_FOLLOWUP;
if (followupOrder && (!contactOrder || !["share-ration", "walk-to-ferry"].includes(followupOrder))) throw new Error("Follow-up review requires a contact and a known action.");
if (contactOrder && (!morningOrder || !["leave-route", "leave-record", "ask-unprompted", "show-record"].includes(contactOrder))) throw new Error("Contact review requires morning and a known contact choice.");
if (morningOrder && (!["repair-roof", "follow-witness"].includes(morningOrder) || process.env.SHI_PLAYTEST_REFUGE !== "1")) throw new Error("Morning review requires refuge and a known morning choice.");
if (councilFilm && (!revisedCrossing || production)) throw new Error("Private council film requires the development crossing-v2 route.");
if (rainCinema && (!revisedCrossing || production || scoreAudition)) throw new Error("Rain cinema requires development crossing-v2 and no separate score overlay.");
if (scoreAudition && (!revisedCrossing || production)) throw new Error("Private score review requires the development crossing-v2 route.");
const aftermath = revisedCrossing ? JSON.parse(await readFile(resolve(root, "content/engagements/chapter-01-crossing-aftermath.v2.json"), "utf8")) : null;
const councilMetricCount = Object.keys(JSON.parse(await readFile(resolve(root, "content/councils/chen-council.v1.json"), "utf8")).metrics).length;
const appURL = `http://127.0.0.1:4173/?seed=${route === "captured" ? "5EED2026" : crossingScenario === "recovery" ? "00000001" : "00000000"}${isCrossing ? `&crossing=${revisedCrossing ? "campaign-v2" : "campaign"}` : ""}${scoreAudition ? "&score=audition" : ""}${councilFilm ? "&councilFilm=review" : ""}${rainCinema ? "&cinema=rain-review" : ""}`;
const grainPromise = storyBranch === "partner-search" ? "voluntary-pots" : "issue-grain-tallies";
const evacuation = ["together", "scattered"].includes(route) ? "escort-households" : "hold-formation";
const reserves = route === "scattered" || storyBranch !== "baseline" ? "send-support" : "keep-reserve";
const reception = storyBranch === "partner-search" ? "verify-with-partners" : storyBranch === "loan-search" ? "borrow-local-grain" : route === "scattered" ? "open-reception" : "gather-own";
const finalChoice = route === "together" ? "stay-together" : route === "remnant" ? "move-with-remnant" : "release-groups";
const out = resolve(root, ".runtime/story-review", new Date().toISOString().replaceAll(":", "-"));
await mkdir(out, { recursive: true });
const report = { status: "running", output: out, started: new Date().toISOString(), checks: [], screenshots: [], errors: [], owned: [],
  route, storyBranch, grainPromise, reception, ...(isCrossing ? { crossingScenario } : {}), graphicsReview,
  boundary: `Agent-operated visible ${production ? "production-bundle" : "development"} web route; not human acceptance, native or store verification.` };
const children = [], logs = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket, fit;
const check = (value, message) => { report.checks.push({ message, pass: Boolean(value) }); if (!value) throw new Error(message); };
const launch = async (name, command, args, env = {}) => {
  const log = await open(resolve(out, `${name}.log`), "a"); logs.push(log);
  const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env }, detached: true, stdio: ["ignore", log.fd, log.fd] });
  children.push(child); report.owned.push({ name, pid: child.pid });
  child.on("error", error => report.errors.push(`${name}: ${error.message}`));
  return child;
};
const freePort = port => new Promise((yes, no) => { const server = net.createServer(); server.once("error", no); server.listen(port, "127.0.0.1", () => server.close(yes)); });
let serial = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((yes, no) => {
  const id = ++serial, timer = setTimeout(() => { pending.delete(id); no(new Error(`CDP timeout: ${method}`)); }, 15000);
  pending.set(id, { yes: result => { clearTimeout(timer); yes(result); }, no: error => { clearTimeout(timer); no(error); } });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const until = async expression => { for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await delay(150); } throw new Error(`UI timeout: ${expression}`); };
const exists = selector => `!!document.querySelector(${JSON.stringify(selector)})`;
const click = async selector => {
  await send("Page.bringToFront"); await until(exists(selector));
  await until(`(() => {const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`);
  // Let focus-driven scrolling and scroll anchoring settle before choosing
  // coordinates. A hit test before that settlement can target an old position.
  await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  const point = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();if(e.disabled)throw Error('Disabled control');const x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Occluded control');return {x,y}})()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  await delay(150);
};
const capture = async name => {
  await send("Page.bringToFront");
  await evaluate("document.fonts.ready"); await delay(650);
  const frame = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(resolve(out, `${name}.png`), Buffer.from(frame.data, "base64")); report.screenshots.push(`${name}.png`);
};
const layout = async (name, modal = true) => {
  const value = await evaluate("({viewport:innerWidth,document:document.documentElement.scrollWidth,drawers:[...document.querySelectorAll('.drawer')].map(e=>({width:e.clientWidth,scroll:e.scrollWidth}))})");
  check(value.document <= value.viewport + 1 && value.drawers.every(d => d.scroll <= d.width + 1), `${name}: no horizontal overflow`);
  check(await evaluate("getComputedStyle(document.body).overflowY==='hidden'") === modal, `${name}: background scrolling ${modal ? "locked for modal" : "available outside modal"}`);
};
try {
  for (const port of [4173, 5921, 6121, 9321]) await freePort(port);
  let liveDisplay = false;
  try { execFileSync("xdpyinfo", ["-display", ":121"], { stdio: "ignore" }); liveDisplay = true; } catch {}
  check(!liveDisplay, "SHI display is unoccupied");
  await launch("xvfb", "Xvfb", [":121", "-screen", "0", "1600x1000x24", "-nolisten", "tcp"]);
  await delay(800);
  await launch("vnc", "x11vnc", ["-display", ":121", "-listen", "127.0.0.1", "-no6", "-rfbport", "5921", "-nopw", "-forever", "-nevershared"]);
  await launch("novnc", "websockify", ["--web=/usr/share/novnc", "127.0.0.1:6121", "127.0.0.1:5921"]);
  await launch("vite", process.execPath, ["node_modules/vite/bin/vite.js", ...(production ? ["preview"] : []), "apps/web", ...(internalDist ? ["--outDir", internalDist] : []), "--host", "127.0.0.1", "--port", "4173", "--strictPort"], production ? {} : { VITE_SHI_NATIVE: isCrossing ? "0" : "1", VITE_SHI_PRIVATE_SCORE_AUDITION: scoreAudition ? "1" : "0", VITE_SHI_PRIVATE_COUNCIL_FILM: councilFilm ? "1" : "0", VITE_SHI_PRIVATE_RAIN_SCENE: rainCinema ? "1" : "0" });
  report.buildMode = production ? "production-dist" : "development";
  if (internalDirectory) report.internalCandidate = internalDirectory;
  // Existing isolated profile, but an incognito app window preserves old QA saves.
  await launch("chrome", "google-chrome", ["--no-first-run", "--no-default-browser-check", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--incognito", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=9321", `--user-data-dir=${process.env.SHI_BROWSER_PROFILE ?? `${root}/.runtime/novnc/profile`}`, "--window-size=1600,1000", "--app=http://127.0.0.1:4173/?seed=00000000"], { DISPLAY: ":121" });
  fit = setInterval(() => { try {
    const ids = execFileSync("xdotool", ["search", "--onlyvisible", "--class", "Google-chrome"], { env: { ...process.env, DISPLAY: ":121" }, encoding: "utf8" }).trim().split("\n");
    for (const id of ids.filter(Boolean)) execFileSync("xdotool", ["windowmove", "--sync", id, "0", "0", "windowsize", "--sync", id, "1600", "1000"], { env: { ...process.env, DISPLAY: ":121" }, stdio: "ignore" });
  } catch {} }, 1500);
  let target;
  for (let n = 0; n < 80 && !target; n++) { try { target = (await fetch("http://127.0.0.1:9321/json").then(r => r.json())).find(t => t.type === "page"); } catch {} await delay(200); }
  check(target, "dedicated Chrome page available");
  check((await fetch("http://127.0.0.1:6121/vnc.html")).ok, "full noVNC viewer reachable");
  report.listeners = execFileSync("ss", ["-H", "-ltn"], { encoding: "utf8" }).trim().split("\n")
    .map(line => line.trim().split(/\s+/)[3]).filter(address => /:(4173|5921|6121|9321)$/.test(address ?? ""));
  check(report.listeners.length === 4 && report.listeners.every(address => address.startsWith("127.0.0.1:")), "all four review services bind only IPv4 loopback, with no wildcard IPv6 listener");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((yes, no) => { socket.addEventListener("open", yes, { once: true }); socket.addEventListener("error", no, { once: true }); });
  socket.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (p) m.error ? p.no(new Error(m.error.message)) : p.yes(m.result); } if (m.method === "Runtime.exceptionThrown") report.errors.push(m.params.exceptionDetails.text); });
  await send("Page.enable"); await send("Runtime.enable");
  if (internalDirectory) {
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    report.graphicsRequests = [];
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.method === "Network.requestWillBeSent" && /\/three\.module-.*\.js/.test(message.params.request.url)) report.graphicsRequests.push(message.params.request.url);
      if (graphicsReview === "unavailable" && message.method === "Fetch.requestPaused" && message.params.resourceType !== "Image") {
        void send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }).catch(error => report.errors.push(error.message));
      }
    });
    if (graphicsReview === "reduced") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    if (graphicsReview === "unavailable") await send("Fetch.enable", { patterns: [{ urlPattern: "*three.module-*.js*", requestStage: "Request" }] });
  }
  await send("Page.navigate", { url: appURL });
  await until(exists('[data-testid="begin-game"]'));
  if (internalDirectory) {
    await until("document.querySelector('[data-testid=shi-app]').dataset.fontStatus==='ready'");
    report.startup = await evaluate(`(() => {
      const sampledAtMs = performance.now();
      const resources = performance.getEntriesByType('resource').filter(entry => entry.responseEnd > 0 && entry.responseEnd <= sampledAtMs)
        .map(entry => ({ path: new URL(entry.name).pathname, type: entry.initiatorType, encodedBytes: entry.encodedBodySize,
          decodedBytes: entry.decodedBodySize, transferBytes: entry.transferSize, responseEndMs: entry.responseEnd }));
      return { boundary: 'Local desktop, cache disabled, warm browser; sampled when Begin is present and required fonts are ready. Not physical-device startup or all future lazy content.',
        sampledAtMs, navigation: performance.getEntriesByType('navigation')[0]?.toJSON(), resources,
        scriptDecodedBytes: resources.filter(entry => entry.path.endsWith('.js')).reduce((sum, entry) => sum + entry.decodedBytes, 0),
        completedTransferBytes: resources.reduce((sum, entry) => sum + entry.transferBytes, 0) };
    })()`);
    check(report.startup.resources.some(entry => /\/App-.*\.js$/.test(entry.path))
      && report.startup.resources.some(entry => /\/development-crossing-.*\.js$/.test(entry.path)), "startup measurement includes required App and crossing driver, not entry alone");
    if (graphicsReview !== "normal") {
      await until(`document.querySelector('.three-backdrop')?.dataset.renderer===${JSON.stringify(graphicsReview === "reduced" ? "static" : "unavailable")}`);
      check(!await evaluate("!!document.querySelector('.three-backdrop canvas')"), "static title remains playable without a decorative GPU canvas");
    }
  }
  const xenv = { ...process.env, DISPLAY: ":121" };
  const windowId = execFileSync("xdotool", ["search", "--onlyvisible", "--class", "Google-chrome"], { env: xenv, encoding: "utf8" }).trim().split("\n")[0];
  execFileSync("xdotool", ["windowmove", "--sync", windowId, "0", "0", "windowsize", "--sync", windowId, "1600", "1000"], { env: xenv });
  report.windowGeometry = execFileSync("xdotool", ["getwindowgeometry", "--shell", windowId], { env: xenv, encoding: "utf8" });
  check(/WIDTH=1600\b/.test(report.windowGeometry) && /HEIGHT=1000\b/.test(report.windowGeometry), "Chrome window fits the dedicated desktop");
  if (route === "scene-arrival" || route === "interlude-arrival") {
    const configs = [{ locale: "en", width: 390, reduced: false }, { locale: "zh-Hans", width: 320, reduced: true }, route === "interlude-arrival" ? { locale: "en", width: 1280, reduced: false } : { locale: "ar", width: 390, reduced: false }, ...(route === "interlude-arrival" ? [{ locale: "ar", width: 390, reduced: false }] : [])];
    for (const [index, config] of configs.entries()) {
      await send("Emulation.setDeviceMetricsOverride", { width: config.width, height: 844, deviceScaleFactor: 1, mobile: false });
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: config.reduced ? "reduce" : "no-preference" }] });
      await send("Page.navigate", { url: appURL });
      await until(exists('[data-testid="begin-game"]'));
      await evaluate(`(()=>{const select=document.querySelector('select');select.value=${JSON.stringify(config.locale)};select.dispatchEvent(new Event('change',{bubbles:true}))})()`);
      await until(`document.documentElement.lang===${JSON.stringify(config.locale)}`);
      check(await evaluate(`document.querySelector('[data-testid=shi-app]').dataset.motion===${JSON.stringify(config.reduced ? "reduced" : "full")}`), `${config.locale}: motion preference applied`);
      await click('[data-testid="begin-game"]');
      // First-launch guide is lazy; wait for its control instead of sampling
      // before it mounts and then trying to click the inert order underneath.
      if (index === 0) await click('[data-testid="guide-continue"]');
      // Restart the same deterministic seed through the UI, never replace saves
      // with fixtures. The prior route's ending is retained until this action.
      if (index > 0) await click('.chen-ending-actions > button:last-child');
      for (let turn = 0; turn < 4; turn++) {
        await click('[data-testid="commit-selected"]');
        await until(exists('[data-testid="resolution-continue"]'));
        const before = await evaluate("JSON.parse(localStorage.getItem('shi.chapter-01.save.v6'))");
        check(before.history.length === turn + 1, `${config.locale}/${turn}: exactly one order saved`);
        await click('[data-testid="resolution-continue"]');
        const selector = turn === 3 ? '.ending-panel' : '.story-panel';
        const heading = turn === 3 ? '#chapter-ending-title' : '#story-title';
        await until(`document.activeElement===document.querySelector(${JSON.stringify(selector)})`);
        await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const geometry = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(heading)}).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight,scrollY}})()`);
        check(geometry.top >= -1 && geometry.bottom <= geometry.height, `${config.locale}/${turn}: next heading visible without corrective scrolling`);
        const after = await evaluate("JSON.parse(localStorage.getItem('shi.chapter-01.save.v6'))");
        check(JSON.stringify(after.history) === JSON.stringify(before.history) && !after.pendingAftermath, `${config.locale}/${turn}: arrival preserves the committed history`);
        await layout(`${config.locale}/${turn} arrival`, false);
        if (turn === 0 || turn === 3) await capture(`scene-arrival-${config.locale}-${turn === 0 ? 'story' : 'ending'}`);
      }
      if (route === "interlude-arrival") {
        const prefix = `interlude-${config.locale}-${config.width}`;
        const chapter = await evaluate("localStorage.getItem('shi.chapter-01.save.v6')");
        const arrival = async name => {
          // Let the authored 280ms movement finish. Do not correct the scroll.
          await delay(400);
          const geometry = await evaluate("(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),d=e.closest('.drawer')?.getBoundingClientRect();return {tag:e.tagName,top:r.top,bottom:r.bottom,edge:d?.top??0,height:innerHeight,text:e.textContent}})()");
          (report.arrivals ??= []).push({ name: `${prefix}-${name}`, ...geometry });
          if (!(geometry.tag === 'H3' && geometry.top >= geometry.edge + 8 && geometry.bottom <= geometry.height)) await capture(`${prefix}-${name}-failed`);
          check(geometry.tag === 'H3' && geometry.top >= geometry.edge + 8 && geometry.bottom <= geometry.height, `${prefix}/${name}: focused heading has reading inset after animation`);
          await layout(`${prefix}/${name}`);
        };
        await click('[data-testid="council-enter"]');
        if (index > 0) { await click('[data-testid="chen-council"] [data-council-action="retry"]'); await click('[data-testid="chen-council"] [data-council-action="reset"]'); }
        const alternateCouncil = index % 2 === 1;
        const councilOrders = alternateCouncil ? ['defer-title', 'joint-ledger', 'many-banners'] : ['take-crown', 'army-rations', 'one-command'];
        for (const [turn, id] of councilOrders.entries()) {
          await click(`[data-council-choice="${id}"]`); await click('[data-testid="council-commit"]');
          await until(exists('[data-testid="council-response"]'));
          await arrival(`chen-response-${turn}`);
          const saved = await evaluate("localStorage.getItem('shi.chen-council.v1')");
          await click('[data-testid="council-continue"]'); await arrival(`chen-question-${turn}`);
          check(await evaluate("localStorage.getItem('shi.chen-council.v1')") === saved, `${prefix}/${turn}: acknowledging council response preserves saved decision`);
          if (turn === 0) await capture(`${prefix}-chen-question`);
        }
        const councilSave = await evaluate("localStorage.getItem('shi.chen-council.v1')");
        const previousFanyang = await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')");
        await click('[data-testid="fanyang-enter"]');
        if (index > 0) {
          await until(exists('[data-testid="fanyang-save-recovery"]'));
          await arrival('fanyang-recovery');
          check(await evaluate("document.querySelector('[data-testid=fanyang-save-recovery]').contains(document.activeElement) && !document.querySelector('[data-testid=fanyang-commit]') && !document.querySelector('.chen-position')"), `${prefix}: blocked record has a focused recovery screen, not a misleading order`);
          check(await evaluate("(()=>{const r=document.querySelector('[data-testid=fanyang-save-recovery] [data-council-action=retry]').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight})()"), `${prefix}: restart is visible without hunting below disabled orders`);
          await capture(`${prefix}-save-recovery`);
          await click('[data-testid="fanyang-scene"] [data-council-action="retry"]');
          await arrival('fanyang-reset-confirmation');
          await click('[data-testid="fanyang-scene"] [data-council-action="cancel"]');
          await arrival('fanyang-recovery-cancelled');
          check(await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')") === previousFanyang, `${prefix}: cancelling replacement preserves exact earlier record`);
          await click('[data-testid="fanyang-save-recovery"] [data-council-action="close"]');
          await click('[data-testid="fanyang-enter"]');
          await until(exists('[data-testid="fanyang-save-recovery"]'));
          check(await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')") === previousFanyang, `${prefix}: returning and reopening do not replace earlier record`);
          await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
          await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
          await until("!document.querySelector('[data-testid=fanyang-scene]')");
          check(await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')") === previousFanyang, `${prefix}: Escape returns safely without replacing the record`);
          await click('[data-testid="fanyang-enter"]');
          await click('[data-testid="fanyang-scene"] [data-council-action="retry"]');
          await click('[data-testid="fanyang-scene"] [data-council-action="reset"]');
          await until(exists('[data-testid="fanyang-commit"]'));
          check(await evaluate("JSON.parse(localStorage.getItem('shi.fanyang-guarantee.v1')).choices.length===0"), `${prefix}: confirmed restart opens a new empty record`);
          check(await evaluate("localStorage.getItem('shi.chen-council.v1')") === councilSave, `${prefix}: replacement preserves the current council`);
        }
        await arrival('fanyang-entry');
        const envoyOrders = alternateCouncil ? ['public-safety', 'joint-witnesses', 'withdraw-envoy'] : ['public-safety', 'guarded-escort', 'accept-transfer'];
        for (const [turn, id] of envoyOrders.entries()) {
          if (alternateCouncil && turn === 2) {
            await click('[data-fanyang-choice="accept-transfer"]');
            check(await evaluate("document.querySelector('[data-testid=fanyang-commit]').disabled"), `${prefix}: insufficient soldiers block surrender despite strong civilian protection`);
          }
          await click(`[data-fanyang-choice="${id}"]`); await click('[data-testid="fanyang-commit"]');
          await until(exists('[data-testid="fanyang-response"]')); await arrival(`fanyang-response-${turn}`);
          const saved = await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')");
          await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await arrival(`fanyang-question-${turn}`);
          check(await evaluate("localStorage.getItem('shi.fanyang-guarantee.v1')") === saved, `${prefix}/${turn}: acknowledging envoy response preserves saved decision`);
        }
        check(await evaluate("document.querySelector('[data-testid=fanyang-outcome]').dataset.outcome") === (alternateCouncil ? 'withdrawn' : 'opened'), `${prefix}: restored continuation reaches its actual legal ending`);
        await capture(`${prefix}-ending`);
        check(await evaluate("localStorage.getItem('shi.chapter-01.save.v6')") === chapter, `${prefix}: interludes preserve chapter save`);
      }
    }
  } else if (route === "consequence-loading") {
    const readerLocale = process.env.SHI_PLAYTEST_LOCALE ?? "en";
    if (!["en", "ar", "zh-Hans"].includes(readerLocale)) throw new Error("Unsupported consequence review locale");
    report.locale = readerLocale;
    await evaluate(`(()=>{const select=document.querySelector('select');select.value=${JSON.stringify(readerLocale)};select.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await until(`document.documentElement.lang===${JSON.stringify(readerLocale)}`);
    const requests = [];
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.method === "Fetch.requestPaused") requests.push(message.params.requestId);
    });
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*ResolvedConsequenceScene*.js*", requestStage: "Request" }] });
    const chapter = JSON.parse(await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"), "utf8"));
    const opening = chapter.nodes.find(node => node.id === "rain-order").choices.find(choice => choice.id === "read-the-names");
    const saved = () => evaluate("JSON.parse(localStorage.getItem('shi.chapter-01.save.v6'))");
    await click('[data-testid="begin-game"]');
    await until(exists('[data-testid="guide-continue"]'));
    await click('[data-testid="guide-continue"]');
    await click('[data-choice-id="read-the-names"]');
    await click('[data-testid="commit-selected"]');
    await until(exists('[data-presentation="loading"]'));
    check(await evaluate(`document.querySelector('#consequence-reader-text').textContent === ${JSON.stringify(opening.consequence[readerLocale] ?? opening.consequence.en)}`), "full selected outcome visible while presentation download is held");
    if (readerLocale === "ar") check(await evaluate("document.documentElement.dir==='rtl' && document.querySelector('#consequence-reader-text').dir==='ltr'"), "Arabic interface preserves readable direction for untranslated story prose");
    check((await saved()).history.length === 1 && (await saved()).pendingAftermath === 1, "held download has one saved decision and pending reaction");
    check(await evaluate("document.activeElement.id==='consequence-reader-title' && getComputedStyle(document.body).overflow==='hidden'"), "loading reader owns focus and scroll lock");
    const readerFont = await evaluate("getComputedStyle(document.querySelector('#consequence-reader-text')).fontFamily");
    await capture("consequence-loading-desktop");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    check(await evaluate("document.documentElement.scrollWidth<=innerWidth && document.querySelector('[data-testid=resolution-continue]').getBoundingClientRect().bottom<=innerHeight"), "loading reader and Continue fit phone viewport");
    await capture("consequence-loading-phone");
    await click('[data-testid="resolution-continue"]');
    await until("!document.querySelector('[data-testid=resolution]')");
    const acknowledged = await saved();
    check(acknowledged.history.length === 1 && !acknowledged.pendingAftermath, "Continue acknowledges the written reaction exactly once");
    check(requests.length > 0, "actual production presentation request was intercepted");
    for (const requestId of requests.splice(0)) await send("Fetch.continueRequest", { requestId });
    await until("performance.getEntriesByType('resource').some(r=>r.name.includes('ResolvedConsequenceScene') && r.responseEnd>0)");
    check(!await evaluate(exists('[data-testid="resolution"]')) && JSON.stringify(await saved()) === JSON.stringify(acknowledged), "late presentation arrival does not reopen or repeat the decision");
    await click('[data-testid="commit-selected"]');
    await until(exists('[data-testid="resolution-details"]'));
    const pending = await saved();
    check(pending.history.length === 2 && pending.pendingAftermath === 2, "next decision reaches the rich reaction without repeating the first");
    // Cold resume while downloading: a late presentation must retain the
    // player's focused Continue control rather than reset to the heading.
    await send("Page.reload");
    await until(exists('[data-testid="begin-game"]'));
    await click('[data-testid="begin-game"]');
    await until(exists('[data-presentation="loading"]'));
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    check(await evaluate("document.activeElement.dataset.testid==='resolution-continue'"), "Continue focused before the late presentation arrives");
    for (let n = 0; n < 80 && requests.length === 0; n++) await delay(100);
    check(requests.length > 0, "cold focus handoff intercepts the actual presentation request");
    for (const requestId of requests.splice(0)) await send("Fetch.continueRequest", { requestId });
    await until(exists('[data-testid="resolution-details"]'));
    check(await evaluate("document.activeElement.dataset.testid==='resolution-continue'"), "late rich reaction preserves Continue focus");
    check(await evaluate("getComputedStyle(document.querySelector('#consequence-text')).fontFamily") === readerFont, "outcome keeps the same typeface after presentation loads");
    check(JSON.stringify(await saved()) === JSON.stringify(pending), "focus handoff does not acknowledge or change the saved reaction");
    await capture("consequence-late-focus-phone");
    await send("Page.reload");
    await until(exists('[data-testid="begin-game"]'));
    await click('[data-testid="begin-game"]');
    await until(exists('[data-presentation="loading"]'));
    for (let n = 0; n < 80 && requests.length === 0; n++) await delay(100);
    check(requests.length > 0, "cold resume requests the uncached presentation chunk");
    for (const requestId of requests.splice(0)) await send("Fetch.failRequest", { requestId, errorReason: "Aborted" });
    await until(exists('[data-presentation="written"]'));
    check(JSON.stringify(await saved()) === JSON.stringify(pending), "failed download preserves the exact pending save on cold resume");
    const prior = pending.history.at(-1);
    const choice = chapter.nodes.flatMap(node => node.choices).find(choice => choice.id === prior.choiceId);
    check(await evaluate(`document.querySelector('#consequence-reader-text').textContent === ${JSON.stringify(choice.consequence[readerLocale] ?? choice.consequence.en)}`), "cold-resumed reader matches the second committed choice");
    await capture("consequence-offline-resume-phone");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    check(await evaluate("document.activeElement.dataset.testid==='resolution-continue'"), "keyboard can reach Continue after download failure");
    await click('[data-testid="resolution-continue"]');
    await until("!document.querySelector('[data-testid=resolution]')");
    check((await saved()).history.length === 2 && !(await saved()).pendingAftermath, "failed-download reader continues with both decisions intact");
    check(await evaluate("getComputedStyle(document.body).overflow!=='hidden'"), "reader releases scrolling after continuation");
    await send("Fetch.disable");
  } else if (route === "book") {
    await send("Page.navigate", { url: new URL("file://" + resolve(root, ".runtime/story-book/index.html")).href });
    await until("document.title==='势 · 第一卷故事审阅'");
    await capture("book-desktop");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await capture("book-phone");
    check(await evaluate("document.documentElement.scrollWidth<=innerWidth"), "book phone has no horizontal overflow");
    await click('a[href="#courier"]');
    await until("location.hash==='#courier'");
    await click('#courier > summary');
    check(await evaluate("document.querySelector('#courier').open"), "courier route opens through visible summary");
    await evaluate("document.querySelector('#courier > summary').focus()");
    execFileSync("xdotool", ["windowfocus", "--sync", windowId, "key", "--clearmodifiers", "Return"], { env: xenv });
    await until("!document.querySelector('#courier').open");
    check(true, "keyboard Enter closes the focused route");
    await click('#courier > summary');
    await evaluate("([...document.querySelectorAll('#courier p')].find(e=>e.textContent.startsWith('韩驿使来信：'))).scrollIntoView({block:'center'})");
    await capture("book-courier-phone");
    check(await evaluate("document.documentElement.scrollWidth<=innerWidth"), "expanded courier text has no horizontal overflow");
    await click('#courier .back');
    await until("location.hash==='#top'");
    check(true, "return link reaches route directory");
    check(await evaluate("!document.querySelector('script,iframe,img,link,form')"), "offline book has no active external content");
  } else if (isCrossing) {
    if (internalDirectory) check(await evaluate("document.querySelector('meta[name=shi-build-channel]')?.content==='internal-crossing-v2' && document.title==='SHI · Internal Crossing 2'"), "production-built internal entry is visibly distinguished from release");
    await evaluate("(()=>{const e=document.querySelector('select');e.value='zh-Hans';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
    await until("document.documentElement.lang==='zh-Hans'");
    check(await evaluate("document.querySelector('[data-testid=crossing-development-notice]').textContent.includes('旧版存档独立保留')"), "development rules and release-save boundary are disclosed");
    const releaseBefore = await evaluate("localStorage.getItem('shi.chapter-01.save.v6')");
    const olderKeys = ["shi.chen-council.v1", "shi.fanyang-guarantee.v1", "shi.dev.chen-retreat.v1", "shi.development.crossing-campaign.v1", ...(internalDirectory ? ["shi.development.crossing-campaign.v2"] : [])];
    const olderBytes = revisedCrossing ? await evaluate(`Object.fromEntries(${JSON.stringify(olderKeys)}.map(key=>[key,localStorage.getItem(key)]))`) : null;
    if (scoreAudition) {
      await until(exists('[data-testid="private-score-audition"]'));
      check(await evaluate("document.querySelector('[data-testid=private-score-audition]').dataset.status==='idle' && !document.querySelector('[data-testid=private-score-audition] audio').getAttribute('src')"), "private score is not requested or played automatically");
      await click('[data-testid="private-score-audition"] summary');
      await click('[data-testid="private-score-audition"] button');
      await until("document.querySelector('[data-testid=private-score-audition]').dataset.status==='playing'");
      await until("document.querySelector('[data-testid=private-score-audition] audio').currentTime>0.25");
      report.scorePlayback = await evaluate("(()=>{const a=document.querySelector('[data-testid=private-score-audition] audio');return {duration:a.duration,loop:a.loop,volume:a.volume,currentTime:a.currentTime,paused:a.paused}})()");
      check(Math.abs(report.scorePlayback.duration - 45) < 0.1 && !report.scorePlayback.loop && !report.scorePlayback.paused, "pinned B recording decodes and plays once at the private audition level");
      check(await evaluate("localStorage.getItem('shi.development.crossing-campaign.v2')===null"), "starting music does not commit a game order");
      await capture("score-audition-playing-desktop");
      await click('[data-testid="private-score-audition"] summary');
    }
    await capture("crossing-title-desktop");
    await click('[data-testid="begin-game"]');
    await click('[data-testid="guide-continue"]');
    if (rainCinema) {
      await until(exists('[data-testid="private-rain-scene"] video'));
      const saveBefore = await evaluate("localStorage.getItem('shi.development.crossing-campaign.v2')");
      check(await evaluate("(()=>{const v=document.querySelector('[data-testid=private-rain-scene] video');return v.paused&&v.muted&&v.currentTime===0&&!v.autoplay&&v.preload==='none'})()"), "opening image and choices do not autoplay music or motion");
      await click('[data-film-action="sound"]');
      await click('[data-film-action="play"]');
      await until("document.querySelector('[data-testid=private-rain-scene] video').currentTime>0.5");
      report.rainCinema = await evaluate("(()=>{const v=document.querySelector('[data-testid=private-rain-scene] video');return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,currentTime:v.currentTime,muted:v.muted,volume:v.volume}})()");
      check(report.rainCinema.duration === 16 && report.rainCinema.width === 1920 && report.rainCinema.height === 1080 && !report.rainCinema.muted, "actual scored animatic decodes after explicit sound and play gestures");
      await capture("rain-cinema-playing-desktop"); await layout("rain cinema desktop", false);
      await click('[data-testid="sources-toggle"]');
      await until("document.querySelector('[data-testid=private-rain-scene] video').paused");
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await until("!document.querySelector('.drawer')");
      check(await evaluate("document.querySelector('[data-testid=private-rain-scene] video').paused"), "opening and closing evidence pauses the soundtrack without resuming");
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
      await click('[data-film-action="play"]');
      await until("!document.querySelector('[data-testid=private-rain-scene] video').paused");
      await capture("rain-cinema-playing-phone"); await layout("rain cinema phone", false);
      await click('[data-film-action="skip"]');
      check(await evaluate("document.querySelector('[data-testid=scene-film]').dataset.playback==='skipped'&&document.querySelector('[data-testid=private-rain-scene] video').paused"), "skip stops the scored scene");
      check(await evaluate("localStorage.getItem('shi.development.crossing-campaign.v2')") === saveBefore, "cinema play, sound, pause and skip leave the actual decision ledger byte-identical");
      await capture("rain-cinema-skipped-phone");
      await click('.brand-button');
      await click('.title-footer button:last-child');
      await evaluate("(()=>{const e=document.querySelector('select');e.value='ar';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
      await until("document.documentElement.lang==='ar'");
      await click('[data-testid="begin-game"]');
      await until(exists('[data-testid="private-rain-scene"] img'));
      check(await evaluate("!document.querySelector('[data-testid=private-rain-scene] video')&&document.documentElement.dir==='rtl'&&/[\\u0600-\\u06ff]/.test(document.querySelector('[data-testid=private-rain-scene] img').alt)"), "reduced motion has a static Arabic description and no moving media");
      await evaluate("document.querySelector('[data-testid=private-rain-scene]').scrollIntoView({block:'center',behavior:'instant'})");
      await capture("rain-cinema-reduced-arabic-phone"); await layout("rain cinema reduced Arabic", false);
      await click('.brand-button');
      await click('.title-footer button:last-child');
      await evaluate("(()=>{const e=document.querySelector('select');e.value='zh-Hans';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
      await click('[data-testid="begin-game"]');
      await until(exists('[data-testid="private-rain-scene"] video'));
      check(await evaluate("document.querySelector('[data-testid=private-rain-scene] video').paused&&document.querySelector('[data-testid=private-rain-scene] video').muted"), "returning to the opening requires fresh play and sound gestures");
      check(await evaluate("localStorage.getItem('shi.development.crossing-campaign.v2')") === saveBefore, "motion and language changes preserve the opening ledger");
      await send("Emulation.clearDeviceMetricsOverride");
    }
    for (const id of ["read-the-names", "issue-grain-tallies"]) {
      await click(`[data-choice-id="${id}"]`);
      await click('[data-testid="commit-selected"]');
      if (rainCinema && id === "read-the-names") {
        check(!await evaluate(exists('[data-testid="private-rain-scene"]')), "saving the chosen order removes the introductory soundtrack before its reaction");
        const saved = JSON.parse(await evaluate("localStorage.getItem('shi.development.crossing-campaign.v2')"));
        check(saved.ledger.events.filter(event => event.kind === "decision" && event.choiceId === "read-the-names").length === 1, "the first actual decision is saved exactly once after watching and skipping");
      }
      await click('[data-testid="resolution-continue"]');
    }
    check(await evaluate("document.querySelector('[data-testid=shi-app]').dataset.nodeId==='broken-crossing' && !document.querySelector('.choice-card .effects')"), "crossing does not disclose obsolete fixed abstract costs");
    await click('[data-testid="commit-selected"]');
    await until(exists('[data-testid="engagement-board"]'));
    await capture("crossing-command-desktop"); await layout("crossing desktop");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await capture("crossing-command-phone"); await layout("crossing phone");
    await until("(()=>{const e=document.querySelector('[data-testid=crossing-establishing] img');return e?.complete&&e.naturalWidth===1672})()");
    await evaluate("document.querySelector('[data-testid=crossing-establishing]').scrollIntoView({block:'center',behavior:'instant'})");
    await capture("crossing-establishing-phone"); await layout("crossing establishing still");
    const key = internalDirectory ? "shi.internal.crossing-campaign.v2" : `shi.development.crossing-campaign.v${revisedCrossing ? 2 : 1}`;
    const beforeOrder = JSON.parse(await evaluate(`localStorage.getItem('${key}')`));
    const fieldPosition = await evaluate("document.querySelector('[data-field-progress]')?.getAttribute('data-field-progress')");
    check(fieldPosition !== null && fieldPosition !== undefined, "shared crossing schematic is present");
    await evaluate("document.querySelector('[data-testid=crossing-field]').scrollIntoView({block:'center',behavior:'instant'})");
    await capture("crossing-field-before-phone"); await layout("crossing schematic phone");
    const fieldSave = await evaluate(`localStorage.getItem('${key}')`);
    for (const language of ["ar", "zh-Hans"]) {
      await click('[data-engagement-close]'); await click('.brand-button');
      await click('.title-footer button:last-child');
      await evaluate(`(()=>{const e=document.querySelector('select');e.value=${JSON.stringify(language)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
      await until(`document.documentElement.lang===${JSON.stringify(language)}`);
      await click('[data-testid="begin-game"]'); await until(exists('[data-testid="crossing-field"]'));
      check(await evaluate(`localStorage.getItem('${key}')`) === fieldSave, "changing diagram language does not mutate the crossing ledger");
      if (language === "ar") {
        check(await evaluate("document.documentElement.dir==='rtl'&&document.querySelector('.crossing-field-banks').dir==='ltr'"), "Arabic reading preserves the fixed bank orientation");
        await evaluate("document.querySelector('[data-testid=crossing-field]').scrollIntoView({block:'center',behavior:'instant'})");
        await capture("crossing-field-arabic-phone"); await layout("Arabic crossing schematic");
      }
    }
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    check(await evaluate("getComputedStyle(document.querySelector('.crossing-field-marker')).transitionDuration==='0s'"), "schematic movement honors reduced motion");
    await send("Emulation.setEmulatedMedia", { features: graphicsReview === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] });
    // Fail only this optional image at the network layer. The real saved
    // pre-order scene must reopen and accept the next order without it.
    const stillURL = await evaluate("document.querySelector('[data-testid=crossing-establishing] img').currentSrc");
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    // In Vite development the same path with ?import is a JavaScript module.
    // Intercept Image requests only, never the module which renders the UI.
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.method === "Fetch.requestPaused" && message.params.resourceType === "Image") {
        void send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }).catch(error => report.errors.push(error.message));
      }
    });
    await send("Fetch.enable", { patterns: [{ urlPattern: stillURL, resourceType: "Image", requestStage: "Request" },
      ...(graphicsReview === "unavailable" ? [{ urlPattern: "*three.module-*.js*", requestStage: "Request" }] : [])] });
    await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
    await until("!!document.querySelector('[data-testid=engagement-board]')&&!document.querySelector('[data-testid=crossing-establishing]')");
    check(await evaluate(`localStorage.getItem('${key}')`) === fieldSave, "failed scenery download preserves the pre-order save");
    await capture("crossing-establishing-unavailable-phone"); await layout("crossing without optional scenery");
    await click(`[data-engagement-command="${crossingExpectation.commands[0]}"]`);
    if (graphicsReview === "unavailable") await send("Fetch.enable", { patterns: [{ urlPattern: "*three.module-*.js*", requestStage: "Request" }] });
    else await send("Fetch.disable");
    await until("document.querySelector('[data-testid=engagement-board]').dataset.pulseIndex==='1'");
    const afterOrder = await evaluate(`localStorage.getItem('${key}')`);
    const committedFieldPosition = await evaluate("document.querySelector('[data-field-progress]').getAttribute('data-field-progress')");
    check(committedFieldPosition !== fieldPosition, "committed command changes the schematic progress index");
    check(!await evaluate("!!document.querySelector('[data-testid=crossing-establishing]')"), "pre-order still cannot impersonate a committed outcome");
    await evaluate("document.querySelector('[data-testid=crossing-field]').scrollIntoView({block:'center',behavior:'instant'})");
    await capture("crossing-field-after-phone");
    check(JSON.parse(afterOrder).ledger.events.length === beforeOrder.ledger.events.length + 1, "one pointer-issued field order is saved exactly once");
    check(!await evaluate("!!document.querySelector('[data-testid=cancel-crossing-plan]')"), "issued orders cannot be cancelled");
    await capture("crossing-response-phone");
    await click('[data-engagement-close]');
    await until(exists('[data-testid="resume-crossing"]'));
    check(await evaluate(`localStorage.getItem('${key}')`) === afterOrder, "closing pauses without changing battle bytes");
    check(!await evaluate("!!document.querySelector('[data-testid=commit-selected]')"), "paused battle cannot be bypassed by an abstract choice");
    await capture("crossing-paused-phone"); await layout("paused crossing", false);
    await send("Page.reload"); await until(exists('[data-testid="begin-game"]'));
    await click('[data-testid="begin-game"]');
    await until("document.querySelector('[data-testid=engagement-board]')?.dataset.pulseIndex==='1'");
    check(await evaluate(`localStorage.getItem('${key}')`) === afterOrder, "cold resume preserves the saved first order");
    check(await evaluate("document.querySelector('[data-field-progress]').getAttribute('data-field-progress')") === committedFieldPosition, "cold resume reconstructs the same schematic without another order");
    check(!await evaluate("!!document.querySelector('[data-testid=crossing-establishing]')"), "cold resume does not restore a stale pre-order still");
    if (scoreAudition) {
      await until(exists('[data-testid="private-score-audition"]'));
      check(await evaluate("document.querySelector('[data-testid=private-score-audition]').dataset.status==='idle'"), "reload does not automatically resume the private soundtrack");
      await click('[data-testid="private-score-audition"] summary');
      await click('[data-testid="private-score-audition"] button');
      await until("document.querySelector('[data-testid=private-score-audition]').dataset.status==='playing'");
      await click('[data-testid="private-score-audition"] summary');
      check(await evaluate(`localStorage.getItem('${key}')`) === afterOrder, "explicit score replay does not issue another field command");
    }
    for (const command of crossingExpectation.commands.slice(1)) await click(`[data-engagement-command="${command}"]`);
    await until(exists('[data-testid="engagement-outcome"]'));
    check(await evaluate("document.querySelector('[data-testid=shi-app]').dataset.nodeId==='broken-crossing'"), "completed battle waits for explicit campaign commit");
    const outcome = revisedCrossing ? aftermath.outcomes[crossingExpectation.outcome].reaction["zh-Hans"] : await evaluate("document.querySelector('.engagement-outcome > p').textContent");
    await capture("crossing-outcome-phone"); await layout("crossing outcome");
    await click('[data-testid="engagement-return"]');
    await until(exists('[data-testid="resolution"]'));
    check(await evaluate(`document.querySelector('[data-testid=resolution]').textContent.includes(${JSON.stringify(outcome)})`), "campaign reaction matches the saved tactical outcome");
    await capture("crossing-reaction-phone");
    if (scoreAudition) {
      check(await evaluate("document.querySelector('[data-testid=private-score-audition] audio').currentTime>1"), "same private recording survives scene transitions without restarting");
    }
    if (revisedCrossing) {
      check(await evaluate("document.querySelector('[data-testid=commitment-resolution]').closest('details')===null && document.querySelectorAll('[data-testid=commitment-resolution]').length===1"), "personal promise reaction is visible without opening statistical details");
      await capture("crossing-personal-reaction-phone"); await layout("personal reaction phone");
      await click('[data-testid="resolution-details"] summary');
      check(await evaluate(`document.querySelector('[data-testid=commitment-resolution]').dataset.commitmentStatus===${JSON.stringify(crossingExpectation.promise)}`), `${crossingExpectation.outcome}: protection promise is ${crossingExpectation.promise}`);
      check(await evaluate(`document.querySelector('[data-testid=commitment-resolution]').textContent.includes(${JSON.stringify(aftermath.commitments["names-under-protection"][crossingExpectation.promise].response["zh-Hans"])})`), "the affected character answers the actual promise judgment");
      await capture("crossing-promise-phone"); await layout("actual promise reaction");
      await click('[data-testid="resolution-details"] summary');
    }
    const finished = await evaluate(`localStorage.getItem('${key}')`);
    await send("Page.reload"); await until(exists('[data-testid="begin-game"]'));
    await click('[data-testid="begin-game"]'); await until(exists('[data-testid="resolution"]'));
    check(await evaluate(`localStorage.getItem('${key}')`) === finished, "outcome reload does not duplicate the campaign commit");
    await click('[data-testid="resolution-continue"]');
    await click('[data-testid="record-toggle"]'); await until(exists('[data-testid="crossing-record"]'));
    await click('[data-testid="crossing-record"] summary');
    check(await evaluate("document.querySelectorAll('[data-crossing-record-command]').length===3"), "chronicle retains all three tactical orders");
    await capture("crossing-record-phone"); await layout("crossing chronicle");
    await click('[data-testid="record-drawer"] .icon-button');
    await click('[data-choice-id="root-in-villages"]');
    await click('[data-testid="commit-selected"]'); await click('[data-testid="resolution-continue"]');
    if (crossingScenario === "recovery") {
      await until(exists('[data-testid="crossing-reconsider"]'));
      check(!await evaluate(exists('[data-testid="council-enter"]')) && await evaluate("!!document.querySelector('.story-panel-failed')"), "broken rear and subsequent strategic choice reach a real terminal loss, not Chen");
      const defeated = await evaluate(`localStorage.getItem('${key}')`);
      await capture("crossing-defeat-phone"); await layout("terminal loss phone", false);
      let failedPreparations = 0;
      const failPreparation = event => {
        const message = JSON.parse(event.data);
        if (message.method === "Fetch.requestPaused") {
          failedPreparations++;
          void send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }).catch(error => report.errors.push(error.message));
        }
      };
      socket.addEventListener("message", failPreparation);
      await send("Fetch.enable", { patterns: [{ urlPattern: "*DecisionInspector-*.js*", requestStage: "Request" }] });
      await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
      await until("!!document.querySelector('[data-testid=crossing-recovery] [role=alert]')");
      check(failedPreparations > 0 && await evaluate(`localStorage.getItem('${key}')`) === defeated, "failed preparation download keeps the defeat saved and does not offer an unsafe replay");
      await evaluate("document.querySelector('[data-testid=crossing-recovery] [role=alert]').scrollIntoView({block:'center',behavior:'instant'})");
      await capture("crossing-replay-load-failure-phone");
      await send("Fetch.disable"); socket.removeEventListener("message", failPreparation);
      await click('[data-testid="crossing-reconsider"]');
      await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
      await until("document.querySelector('[data-testid=crossing-reconsider]')?.disabled===false");
      await click('[data-testid="crossing-reconsider"]');
      check(await evaluate(`localStorage.getItem('${key}')`) === defeated, "defeat reload and opening replay confirmation preserve the complete ending");
      check(await evaluate("document.activeElement.dataset.testid==='crossing-retry-cancel'"), "confirmation initially focuses keeping the ending");
      await evaluate("document.querySelector('[data-testid=crossing-retry-confirmation]').scrollIntoView({block:'center',behavior:'instant'})");
      await capture("crossing-replay-confirm-phone"); await layout("replay confirmation phone", false);
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await until("!document.querySelector('[data-testid=crossing-retry-confirmation]')");
      check(await evaluate(`localStorage.getItem('${key}')`) === defeated, "Escape cancels replay without changing the defeat");
      await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
      await click('[data-testid="crossing-reconsider"]'); await click('[data-testid="crossing-retry-confirm"]');
      await until(exists('[data-testid="commit-selected"]'));
      const replayBytes = await evaluate(`localStorage.getItem('${key}')`);
      const replay = JSON.parse(replayBytes);
      check(replay.ledger.seed === 1 && replay.pendingEventIndex === null
        && JSON.stringify(replay.ledger.events) === JSON.stringify(beforeOrder.ledger.events.slice(0, 2)), "offline confirmed replay retains the exact two opening choices and seed, not the failed later orders");
      await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
      await until(exists('[data-testid="commit-selected"]'));
      check(await evaluate(`localStorage.getItem('${key}')`) === replayBytes && !await evaluate(exists('[data-testid="resolution"]')), "cold replay starts at the crossing without replaying opening reactions");
      await capture("crossing-replay-checkpoint-phone"); await layout("replay checkpoint phone", false);
      await click('[data-choice-id="families-first"]'); await click('[data-testid="commit-selected"]');
      for (const command of ["screen-through-reeds", "repair-the-landing", "hold-for-the-last-household"]) await click(`[data-engagement-command="${command}"]`);
      await click('[data-testid="engagement-return"]'); await until(exists('[data-testid="resolution"]'));
      check(await evaluate(`document.querySelector('[data-testid=resolution]').textContent.includes(${JSON.stringify(aftermath.outcomes["costly-crossing"].reaction["zh-Hans"])})`), "new orders earn a costly crossing under unchanged conditions, not a free perfect result");
      await capture("crossing-replayed-reaction-phone");
      await click('[data-testid="resolution-continue"]'); await click('[data-choice-id="root-in-villages"]');
      await click('[data-testid="commit-selected"]'); await click('[data-testid="resolution-continue"]');
    }
    await click('[data-testid="council-enter"]'); await until(exists('[data-testid="chen-council"]'));
    check(await evaluate(`[...document.querySelectorAll('.resource-rail [role=meter]')].map(e=>Number(e.getAttribute('aria-valuenow'))).join(',')==='${revisedCrossing ? crossingExpectation.resources : "48,89,10,97,96"}'`), "visible final resources match the independently replayed representative route");
    check(await evaluate("document.querySelector('[data-testid=chen-council]').dataset.arrival==='supplied'"), "surviving route produces the expected supplied Chen arrival despite high pursuit");
    check(await evaluate("localStorage.getItem('shi.chapter-01.save.v6')") === releaseBefore, "integrated playthrough never writes the release chapter save");
    await capture("crossing-chen-phone"); await layout("Chen after crossing");
    await send("Emulation.clearDeviceMetricsOverride"); await capture("crossing-chen-desktop"); await layout("Chen desktop");
    if (revisedCrossing) {
      for (const id of ["defer-title", "joint-ledger", "one-command"]) {
        await click(`[data-council-choice="${id}"]`); await click('[data-testid="council-commit"]');
        if (id === "defer-title") {
          const councilKey = `${key}.chen-council.v1`;
          const bytes = await evaluate(`localStorage.getItem('${councilKey}')`);
          const response = await evaluate("document.querySelector('[data-testid=council-response] .chen-prose').textContent");
          if (councilFilm) {
            await until(exists('[data-testid="private-council-film"]'));
            check(await evaluate("!document.querySelector('[data-testid=private-council-film]').open && !document.querySelector('[data-testid=private-council-film] video')"), "private film is initially collapsed without media requests");
            await click('[data-testid="private-council-film"] summary');
            await until(exists('[data-testid="private-council-film"] video'));
            check(await evaluate("document.querySelector('[data-testid=private-council-film] video').paused"), "opening film review does not autoplay");
            await click('[data-testid="private-council-film"] button');
            await until("document.querySelector('[data-testid=private-council-film] video').currentTime>0.1");
            report.councilFilm = await evaluate("(()=>{const v=document.querySelector('[data-testid=private-council-film] video');return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,loop:v.loop,currentTime:v.currentTime}})()");
            check(report.councilFilm.duration === 4 && report.councilFilm.width === 640 && report.councilFilm.height === 360 && report.councilFilm.muted && !report.councilFilm.loop, "actual four-second silent Blender study decodes in the game");
            await capture("council-private-film-playing-desktop"); await layout("private film review");
            await click('[data-testid="private-council-film"] button');
            check(await evaluate("document.querySelector('[data-testid=private-council-film] video').paused"), "explicit film pause stops playback");
            await click('[data-testid="private-council-film"] .silent-film button:nth-of-type(2)');
            check(await evaluate("document.querySelector('[data-testid=private-council-film] .silent-film').dataset.playback === 'skipped' && document.querySelector('[data-testid=private-council-film] video').paused"), "explicit skip stops the private scene");
            check(await evaluate("document.activeElement === document.querySelector('[data-testid=private-council-film] [role=status]')"), "skipping preserves a keyboard focus target");
            await capture("council-private-film-skipped-desktop");
            await click('[data-testid="private-council-film"] summary');
            await until("!document.querySelector('[data-testid=private-council-film] video')");
            check(await evaluate(`localStorage.getItem('${councilKey}')`) === bytes, "playing and closing film review never changes a saved order");
          }
          check(await evaluate("!document.querySelector('[data-testid=council-response-changes]').open && !document.querySelector('.chen-position')"), "council response leads without an expanded ledger or competing metrics");
          await capture("crossing-council-response-desktop"); await layout("council response desktop");
          await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
          await capture("crossing-council-response-phone"); await layout("council response phone");
          await click('[data-testid="council-response-changes"] summary');
          check(await evaluate(`document.querySelector('[data-testid=council-response-changes]').open && document.querySelectorAll('[data-testid=council-response-changes] [role=listitem]').length===${councilMetricCount}`), "optional council ledger retains every saved metric");
          check(await evaluate(`localStorage.getItem('${councilKey}')`) === bytes, "reading council changes does not save a decision");
          await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]'); await click('[data-testid="council-enter"]');
          await until(exists('[data-testid="council-response"]'));
          check(await evaluate("document.querySelector('[data-testid=council-response] .chen-prose').textContent") === response && await evaluate(`localStorage.getItem('${councilKey}')`) === bytes, "council cold resume retains reaction and exact save bytes");
          check(await evaluate("!document.querySelector('[data-testid=council-response-changes]').open"), "resumed council reaction restores the quiet reading presentation");
          await capture("crossing-council-response-resumed-phone");
          await send("Emulation.clearDeviceMetricsOverride");
        }
        await click('[data-testid="council-continue"]');
      }
      await click('[data-testid="fanyang-enter"]');
      for (const id of ["public-safety", "guarded-escort", "accept-transfer"]) {
        await click(`[data-fanyang-choice="${id}"]`); await click('[data-testid="fanyang-commit"]');
        if (id === "public-safety") {
          const fanyangKey = `${key}.fanyang-guarantee.v1`;
          const bytes = await evaluate(`localStorage.getItem('${fanyangKey}')`);
          const response = await evaluate("document.querySelector('[data-testid=fanyang-response] .chen-prose').textContent");
          check(await evaluate("!document.querySelector('[data-testid=fanyang-response-changes]').open && !document.querySelector('.chen-position')"), "Fan Yang reply leads without competing accounting");
          await capture("crossing-fanyang-response-desktop"); await layout("Fan Yang reply desktop");
          await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
          await capture("crossing-fanyang-response-phone"); await layout("Fan Yang reply phone");
          await click('[data-testid="fanyang-response-changes"] summary');
          check(await evaluate("document.querySelector('[data-testid=fanyang-response-changes]').open") && await evaluate(`localStorage.getItem('${fanyangKey}')`) === bytes, "reading Fan Yang accounting does not save an order");
          await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
          await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
          await until(exists('[data-testid="fanyang-response"]'));
          check(await evaluate("document.querySelector('[data-testid=fanyang-response] .chen-prose').textContent") === response && await evaluate(`localStorage.getItem('${fanyangKey}')`) === bytes, "Fan Yang cold resume retains reaction and exact saved bytes");
          check(await evaluate("!document.querySelector('[data-testid=fanyang-response-changes]').open"), "Fan Yang resume restores a quiet reply");
          await capture("crossing-fanyang-response-resumed-phone");
          await send("Emulation.clearDeviceMetricsOverride");
        }
        await click('[data-testid="fanyang-response"] [data-council-action="continue"]');
      }
      if (!internalDirectory) {
      await click('[data-testid="retreat-enter"]'); await until(exists('[data-testid="retreat-scene"]'));
      await capture("crossing-retreat-desktop"); await layout("retreat after crossing");
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
      await capture("crossing-retreat-phone"); await layout("retreat phone");
      const retreatKey = `${key}.chen-retreat.v1`;
      for (const id of ["keep-reserve", "gather-own", "escort-households", "carry-records", "stay-together"]) {
        await click(`[data-retreat-choice="${id}"]`); await click('[data-testid="retreat-commit"]');
        if (id === "keep-reserve") {
          const bytes = await evaluate(`localStorage.getItem('${retreatKey}')`);
          const response = await evaluate("document.querySelector('[data-testid=retreat-response]').textContent");
          check(await evaluate("!document.querySelector('[data-testid=retreat-response-changes]').open && !document.querySelector('.chen-metrics')"), "retreat reaction leads without competing numeric accounting");
          await capture("crossing-retreat-response-phone"); await layout("retreat response phone");
          await send("Emulation.clearDeviceMetricsOverride");
          await capture("crossing-retreat-response-desktop"); await layout("retreat response desktop");
          await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
          await click('[data-testid="retreat-response-changes"] summary');
          check(await evaluate("document.querySelector('[data-testid=retreat-response-changes]').open && document.querySelectorAll('[data-testid=retreat-response-changes] .chen-preview > span').length===5") && await evaluate(`localStorage.getItem('${retreatKey}')`) === bytes, "optional retreat accounting preserves saved orders");
          await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
          await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
          await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await click('[data-testid="retreat-enter"]');
          await until(exists('[data-testid="retreat-response"]'));
          check(await evaluate("document.querySelector('[data-testid=retreat-response]').textContent") === response && await evaluate(`localStorage.getItem('${retreatKey}')`) === bytes, "cold resume retains the same retreat response and save bytes");
          check(await evaluate("!document.querySelector('[data-testid=retreat-response-changes]').open"), "retreat resume restores quiet reading");
          await capture("crossing-retreat-resumed-phone");
        }
        await click('[data-testid="retreat-response"] [data-council-action="continue"]');
      }
      check(await evaluate("document.querySelector('[data-testid=retreat-outcome]').dataset.outcome==='together'"), "revised crossing continues to an earned first-volume ending");
      check(await evaluate(`Object.fromEntries(${JSON.stringify(olderKeys)}.map(key=>[key,localStorage.getItem(key)]))`).then(value=>JSON.stringify(value)===JSON.stringify(olderBytes)), "older chapter and interlude slots remain unchanged");
      check(await evaluate(`JSON.parse(localStorage.getItem('${retreatKey}')).choices.length===5`), "five retreat choices are committed once in the edition-owned save");
      await capture("crossing-ending-phone"); await layout("crossing volume ending");
      await send("Emulation.clearDeviceMetricsOverride"); await capture("crossing-ending-desktop"); await layout("crossing ending desktop");
      } else {
        check(!await evaluate(exists('[data-testid="retreat-enter"]')), "unreviewed retreat remains excluded from the internal production candidate");
        check(await evaluate(`Object.fromEntries(${JSON.stringify(olderKeys)}.map(key=>[key,localStorage.getItem(key)]))`).then(value=>JSON.stringify(value)===JSON.stringify(olderBytes)), "released and development interlude slots remain unchanged");
        check(await evaluate(`JSON.parse(localStorage.getItem('${key}.chen-council.v1')).history.length===3 && JSON.parse(localStorage.getItem('${key}.fanyang-guarantee.v1')).choices.length===3`), "internal route completes all council and Fan Yang decisions exactly once");
        await capture("internal-crossing-ending-desktop"); await layout("internal ending desktop");
        await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
        await capture("internal-crossing-ending-phone"); await layout("internal ending phone");
      }
    }
  } else if (route === "captured") {
    await evaluate("(()=>{const e=document.querySelector('select');e.value='zh-Hans';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
    await until("document.documentElement.lang==='zh-Hans'");
    await capture("capture-title");
    await click('[data-testid="begin-game"]');
    await click('[data-testid="guide-continue"]');
    for (const id of ["read-the-names", "issue-grain-tallies", "families-first", "race-for-chen"]) {
      await click(`[data-choice-id="${id}"]`);
      await click('[data-testid="commit-selected"]');
      await click('[data-testid="resolution-continue"]');
    }
    await until(exists('[data-testid="chapter-ending-prose"]'));
    check(await evaluate("document.querySelector('[data-testid=chapter-ending-prose]').textContent.includes('追兵喝止')"), "capture has its own closing prose");
    check(await evaluate("!document.querySelector('.dialogue,[data-testid=field-signal],[data-testid=story-echo]') && document.querySelectorAll('.ending-panel').length===1"), "defeat replaces next-scene dialogue rather than following it");
    check(await evaluate("document.querySelector('[data-testid=shi-app]').dataset.oppositionStage==='complete' && !document.querySelector('[data-testid=council-enter],[data-testid=commit-selected]')"), "terminal screen offers no next pursuit round or council entry");
    const save = await evaluate("localStorage.getItem('shi.chapter-01.save.v6')");
    const saved = JSON.parse(save);
    check(saved.failureReason === "captured" && saved.resources.danger === 100 && saved.history.length === 4, "actual choices reach exposure-100 capture");
    await evaluate("document.querySelector('.ending-panel').scrollIntoView({block:'center'})");
    await capture("capture-ending-desktop"); await layout("captured desktop", false);
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await evaluate("document.querySelector('.ending-panel').scrollIntoView({block:'center'})");
    await capture("capture-ending-phone"); await layout("captured phone", false);
    await click('[data-testid="record-toggle"]');
    await until(exists('[data-testid="record-drawer"]'));
    check(await evaluate("document.querySelectorAll('.record-list > li').length===4"), "captured chronicle retains all four decisions");
    await capture("capture-record-phone"); await layout("captured record");
    await click('[data-testid="record-drawer"] .icon-button');
    check(await evaluate("localStorage.getItem('shi.chapter-01.save.v6')") === save, "reading terminal chronicle preserves save bytes");
    await send("Page.reload");
    await until(exists('[data-testid="begin-game"]'));
    await click('[data-testid="begin-game"]');
    await until(exists('[data-testid="chapter-ending-prose"]'));
    check(await evaluate("localStorage.getItem('shi.chapter-01.save.v6')") === save, "captured reload resumes without mutation or crash");
    await click('.ending-panel .primary-button');
    await until(exists('[data-testid="commit-selected"]'));
    check(await evaluate("document.querySelector('[data-testid=shi-app]').dataset.nodeId==='rain-order' && localStorage.getItem('shi.chapter-01.save.v6')===null"), "explicit retry returns to a fresh opening without an automatic command");
    await capture("capture-retry-phone"); await layout("captured retry", false);
  } else {
  await evaluate("(()=>{const e=document.querySelector('select');e.value='zh-Hans';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await until("document.documentElement.lang==='zh-Hans'"); await capture("01-title");
  await click('[data-testid="begin-game"]');
  await click('[data-testid="guide-continue"]');
  for (let n = 0; n < 4; n++) { if (n === 1) await click(`[data-choice-id="${grainPromise}"]`); if (n === 3) await click('[data-choice-id="root-in-villages"]'); await click('[data-testid="commit-selected"]'); await click('[data-testid="resolution-continue"]'); }
  await click('[data-testid="council-enter"]');
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await capture("02-council-mobile"); await layout("council");
  const councilSaveBeforeRules = await evaluate("localStorage.getItem('shi.chen-council.v1')");
  check(!await evaluate("document.querySelector('[data-testid=council-rules]').open"), "council rules start collapsed");
  const rulesDistance = "document.querySelector('[data-council-choice]').getBoundingClientRect().top-document.querySelector('[data-testid=council-rules] summary').getBoundingClientRect().top";
  report.councilRulesClosedDistance = await evaluate(rulesDistance);
  await click('[data-testid="council-rules"] summary');
  check(await evaluate("document.querySelector('[data-testid=council-rules]').open"), "visible summary opens complete rules");
  report.councilRulesOpenDistance = await evaluate(rulesDistance);
  check(report.councilRulesOpenDistance > report.councilRulesClosedDistance, "collapsed rules reduce space before choices");
  await capture("02e-council-rules-open-mobile"); await layout("open council rules");
  await evaluate("document.querySelector('[data-testid=council-rules] summary').focus()");
  execFileSync("xdotool", ["windowfocus", "--sync", windowId, "key", "--clearmodifiers", "Return"], { env: xenv });
  await until("!document.querySelector('[data-testid=council-rules]').open");
  check(await evaluate("localStorage.getItem('shi.chen-council.v1')") === councilSaveBeforeRules, "reading and keyboard-closing rules do not save an order");
  await capture("02f-council-rules-closed-mobile");
  check(await evaluate("document.querySelector('[data-testid=council-story-bridge]')?.textContent.includes('掌简人随粮队入城') && document.querySelector('[data-testid=council-story-bridge]')?.textContent.includes('领粮的人举起旧凭记')"), "council transition establishes arrival and unresolved food claims");
  await evaluate("document.querySelector('[data-testid=council-story-bridge]').scrollIntoView({block:'center'})");
  await capture("02b-council-bridge-mobile");
  check(await evaluate("document.querySelector('[data-testid=council-chapter-bridge]')?.dataset.choice==='root-in-villages'"), "council recalls the actual village strategy");
  check(await evaluate("document.querySelector('[data-testid=council-chapter-bridge]')?.textContent.includes('明天有事找谁')"), "village strategy creates a concrete council question");
  await evaluate("document.querySelector('[data-testid=council-chapter-bridge]').scrollIntoView({block:'center'})");
  await capture("02d-council-strategy-mobile"); await layout("council strategy bridge");
  for (const id of ["defer-title", "joint-ledger", "one-command"]) { await click(`[data-council-choice="${id}"]`); await click('[data-testid="council-commit"]'); await click('[data-testid="council-continue"]'); }
  await click('[data-testid="fanyang-enter"]');
  check(await evaluate("document.querySelector('[data-testid=fanyang-story-bridge]')?.textContent.includes('哪些士卒肯听他的话')"), "envoy transition preserves uncertain local obedience");
  await evaluate("document.querySelector('[data-testid=fanyang-story-bridge]').scrollIntoView({block:'center'})");
  await capture("02c-envoy-bridge-mobile"); await layout("envoy bridge");
  for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) { await click(`[data-fanyang-choice="${id}"]`); await click('[data-testid="fanyang-commit"]'); await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); }
  await click('[data-testid="retreat-enter"]'); await until(exists('[data-testid="retreat-commit"]'));
  await capture("03-retreat-mobile"); await layout("retreat opening");
  for (const id of [reserves, reception, evacuation, "carry-records"]) {
    if (id === "carry-records") {
      const memory = await evaluate("document.querySelector('[data-testid=retreat-chapter-memory]')?.textContent ?? ''");
      const voluntary = grainPromise === "voluntary-pots";
      check(voluntary ? memory.includes("一处灶火只献一釜") && memory.includes("不能把两回事混着算") : memory.includes("当初凭券取粮时") && memory.includes("谁还找得到你"), "selected opening grain promise returns as a custody dilemma");
      check(!memory.includes(voluntary ? "当初凭券取粮时" : "一处灶火只献一釜"), "unselected food promise is not remembered as fact");
      await evaluate("document.querySelector('[data-testid=retreat-chapter-memory]').scrollIntoView({block:'start'})");
      await capture("04b-grain-promise-mobile"); await layout("grain promise");
    }
    await click(`[data-retreat-choice="${id}"]`);
    if (id === reserves) {
      await capture("03b-retreat-choice-mobile");
      report.choiceGeometry = await evaluate(`(()=>{const e=document.querySelector('[data-retreat-choice=${reserves}]'),r=document.createRange();r.selectNodeContents([...e.childNodes].find(n=>n.nodeType===Node.TEXT_NODE));const label=r.getBoundingClientRect();return {labelWidth:label.width,labelStart:label.x,markerEnd:e.firstElementChild.getBoundingClientRect().right,textColumnWidth:parseFloat(getComputedStyle(e).gridTemplateColumns.split(' ')[1]),buttonWidth:e.getBoundingClientRect().width}})()`);
      check(report.choiceGeometry.labelStart >= report.choiceGeometry.markerEnd && report.choiceGeometry.textColumnWidth > report.choiceGeometry.buttonWidth / 2, "retreat choice uses a readable text column");
    }
    await click('[data-testid="retreat-commit"]');
    if (id === "open-reception") {
      check(await evaluate("document.querySelector('[data-testid=retreat-response]').textContent.includes('把两份都推回他面前')"), "soldier retains both tokens after reception");
      await evaluate("([...document.querySelectorAll('[data-testid=retreat-response] p')].find(e=>e.textContent.includes('把两份都推回他面前'))).scrollIntoView({block:'center'})");
      await capture("03c-token-return-mobile"); await layout("token return");
    }
    if (id === evacuation) {
      const expected = evacuation === "escort-households" ? "掌心全是木刺" : "墙角以里";
      check(await evaluate(`document.querySelector('[data-testid=retreat-response]').textContent.includes(${JSON.stringify(expected)})`), "saved evacuation presents its matching physical aftermath");
      await capture("04-evacuation-aftermath-mobile"); await layout("evacuation aftermath");
    }
    await click('[data-testid="retreat-response"] [data-council-action="continue"]');
  }
  if (storyBranch !== "baseline") {
    const expectedSearch = storyBranch === "partner-search" ? "没有阿衡的消息" : "粮数对上了，找人的事还没对上";
    check(await evaluate(`document.querySelector('[data-testid=retreat-scene]').textContent.includes(${JSON.stringify(expectedSearch)})`), "search receives its selected unresolved follow-up");
    check(!await evaluate("document.querySelector('[data-testid=retreat-scene]').textContent.includes('左鞋还缠着麻绳')"), "unwitnessed reunion is not invented");
    await evaluate(`([...document.querySelectorAll('[data-testid=retreat-scene] p')].find(e=>e.textContent.includes(${JSON.stringify(expectedSearch)}))).scrollIntoView({block:'center'})`);
    await capture("04c-search-follow-up-mobile"); await layout("search follow-up");
  }
  const yuArrives = reserves === "keep-reserve" && evacuation === "escort-households";
  if (reception === "open-reception" && evacuation === "escort-households") {
    check(await evaluate("document.querySelector('[data-testid=retreat-scene]').textContent.includes('我怕你回来没得领，就一直带着')"), "reunion pays off the retained companion token");
    check(await evaluate("document.querySelector('[data-testid=retreat-scene]').textContent.includes('尚未凭它再领一份粮')"), "reunion does not claim duplicate grain distribution");
    await evaluate("([...document.querySelectorAll('[data-testid=retreat-scene] p')].find(e=>e.textContent.includes('我怕你回来没得领'))).scrollIntoView({block:'center'})");
    await capture("04d-reunion-mobile"); await layout("reunion");
  }
  check(await evaluate(exists('[data-testid="retreat-witnessed-arrival"]')) === yuArrives, "Yu presence matches the actual escort decision");
  if (yuArrives) {
    await evaluate("document.querySelector('[data-testid=retreat-witnessed-arrival]').scrollIntoView({block:'start'})");
    await capture("04-yu-arrival-mobile"); await layout("Yu arrival");
  }
  if (route === "dispersed") {
    const savedBeforeInspection = await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')");
    await click('[data-retreat-choice="stay-together"]');
    await until(exists('[data-testid="retreat-available-alternatives"]'));
    check(await evaluate("document.querySelector('[data-testid=retreat-commit]').disabled && !document.querySelector('[data-retreat-alternative=stay-together]')"), "blocked collective waiting cannot be issued or offered as feasible");
    await evaluate("document.querySelector('[data-testid=retreat-available-alternatives]').scrollIntoView({block:'center',behavior:'instant'})");
    await capture("retreat-alternatives-phone"); await layout("retreat alternatives phone");
    await click('[data-retreat-alternative="release-groups"]');
    check(await evaluate("document.activeElement?.dataset.retreatChoice === 'release-groups' && !document.querySelector('[data-testid=retreat-available-alternatives]')"), "alternative inspection selects the command and preserves keyboard focus");
    check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeInspection, "inspecting feasible retreat alternatives does not write a decision");
  } else await click(`[data-retreat-choice="${finalChoice}"]`);
  check(await evaluate(`document.querySelector('[data-testid=retreat-preview]')?.dataset.outcome===${JSON.stringify(route)}`), "final outcome disclosed before commitment");
  if (finalChoice === "release-groups") {
    const checksText = await evaluate("document.querySelector('[data-testid=retreat-dispersal-checks]').textContent");
    check(checksText.includes("不把三方相加") && checksText.includes("分行粮秣"), "forecast distinguishes food and single-group support requirements");
    if (route === "scattered") check(checksText.includes("还缺"), "scattering preview explains an actual missing requirement");
    await evaluate("document.querySelector('[data-testid=retreat-dispersal-checks]').scrollIntoView({block:'center',behavior:'instant'})");
    await capture("04e-dispersal-requirements-mobile"); await layout("dispersal requirements");
  }
  if (route === "scattered") await capture("04b-scattering-warning-mobile");
  await click('[data-testid="retreat-commit"]');
  await capture("05-ending-response-mobile");
  await click('[data-testid="retreat-response"] [data-council-action="continue"]');
  check(await evaluate(`document.querySelector('[data-testid=retreat-outcome]')?.dataset.outcome===${JSON.stringify(route)}`), `complete title-to-${route} route`);
  const releaseLine = "没有再问他们何时归队";
  check(await evaluate(`document.querySelector('[data-testid=retreat-outcome]').textContent.includes(${JSON.stringify(releaseLine)})`) === (route === "dispersed"), "personal release belongs only to orderly dispersal");
  if (route === "dispersed") {
    await evaluate(`([...document.querySelectorAll('[data-testid=retreat-outcome] p')].find(e=>e.textContent.includes(${JSON.stringify(releaseLine)}))).scrollIntoView({block:'center'})`);
    await capture("05c-release-of-command-mobile"); await layout("release of command");
  }
  const closingLine = { together: "锅边已经有人喊你吃饭", dispersed: "人分开了，账还是找你", remnant: "你把装简的囊换到身前", scattered: "你没有把无人应答的几笔勾掉" }[route];
  const memoryId = route === "scattered" ? "retreat-scattered-memory" : "retreat-ending-memory";
  check(await evaluate(`document.querySelector('[data-testid=${memoryId}]').textContent.includes(${JSON.stringify(closingLine)})`), "ending preserves centrally held records");
  if (storyBranch === "loan-search") {
    check(await evaluate("document.querySelector('[data-testid=retreat-debts]')?.textContent.includes('债未偿还')"), "new grain debt survives the ending");
    const loanLine = { together: "欠的不能跟着减", remnant: "消息能不能传回陈地", dispersed: "别临走才把没作保的人添上去", scattered: "没有在欠数旁写下已清" }[route];
    check(await evaluate(`document.querySelector('[data-testid=${memoryId}]').textContent.includes(${JSON.stringify(loanLine)})`), "loan obligation receives the matching dramatic ending");
    await evaluate(`([...document.querySelectorAll('[data-testid=${memoryId}] p')].find(e=>e.textContent.includes(${JSON.stringify(loanLine)}))).scrollIntoView({block:'center'})`);
    await capture("05b-loan-obligation-mobile"); await layout("loan obligation");
  }
  await evaluate("document.querySelector('[data-testid=retreat-outcome]').scrollIntoView({block:'start'})");
  await capture("06-ending-mobile"); await layout("ending");
  const savedBeforeRecord = await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')");
  check(!await evaluate("document.querySelector('[data-testid=retreat-decision-record]').open"), "decision record does not interrupt the ending");
  await click('[data-testid="retreat-decision-record"] summary');
  check(await evaluate("document.querySelector('[data-testid=retreat-decision-record]').open"), "decision record opens through its visible control");
  check(await evaluate("document.querySelectorAll('[data-testid=retreat-decision-record] [data-recorded-choice]').length===5"), "record contains five committed retreat choices");
  const retreatStory = JSON.parse(await readFile(resolve(root, "content/story-drafts/chen-retreat.v1.json"), "utf8"));
  const expectedRecall = route === "scattered" ? retreatStory.scatteredEnding.response
    : retreatStory.scenes.at(-1).choices.find(choice => choice.id === finalChoice).response;
  const recallSelector = `[data-recorded-choice="${finalChoice}"] [data-retreat-recorded-response]`;
  await click(`${recallSelector} summary`);
  check(await evaluate(`document.querySelector(${JSON.stringify(recallSelector)}).open`), "actual final response opens through visible recall control");
  const remembered = await evaluate(`document.querySelector(${JSON.stringify(recallSelector)}).textContent`);
  check(expectedRecall.every(line => remembered.includes(line.text)), "recalled response matches actual outcome and shared story");
  await capture("06c-remembered-response-mobile"); await layout("remembered response");
  await click('[data-testid="retreat-source-panel"] summary');
  const endingSources = await evaluate("document.querySelector('[data-testid=retreat-source-panel]').textContent");
  check(endingSources.includes("2799") && endingSources.includes("不是通行版本页码"), "ending retains precise Tongjian reference and edition boundary");
  await evaluate("document.querySelector('[data-retreat-source=embers]').scrollIntoView({block:'center',behavior:'instant'})");
  await capture("06d-ending-sources-mobile"); await layout("ending sources");
  await click('[data-testid="retreat-source-panel"] summary');
  await capture("06b-decision-record-mobile"); await layout("decision record");
  check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "reading the decision record does not rewrite the save");
  await click('[data-testid="retreat-decision-record"] summary');
  await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
  await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
  await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await click('[data-testid="retreat-enter"]');
  await click('[data-testid="retreat-response"] [data-council-action="continue"]');
  await until(exists('[data-testid="retreat-outcome"]'));
  await click('[data-testid="retreat-decision-record"] summary'); await click(`${recallSelector} summary`);
  check(await evaluate(`document.querySelector(${JSON.stringify(recallSelector)}).textContent`) === remembered, "cold reload preserves exact recalled response");
  check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "recall, sources and reload preserve saved decisions byte for byte");
  await capture("06e-restored-response-mobile"); await layout("restored response");
  if (process.env.SHI_PLAYTEST_REFUGE === "1") {
    await click('[data-testid="retreat-open-refuge"]');
    await until(exists('[data-testid="refuge-commit"]'));
    check(await evaluate("[...document.querySelectorAll('[data-refuge-choice]')].every(button=>{const text=[...button.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(!text)return false;const range=document.createRange();range.selectNodeContents(text);return range.getBoundingClientRect().width>=120 && parseFloat(getComputedStyle(button).gridTemplateColumns.split(' ')[1])>=160;})"), "shelter choices have readable text columns, not single-character stacks");
    await capture("refuge-opening-mobile"); await layout("shelter opening");
    await click('[data-refuge-choice="offer-labour"]');
    await click('[data-testid="refuge-commit"]');
    await until(exists('[data-testid="refuge-response"]'));
    check(await evaluate("document.querySelector('[data-testid=refuge-response]').textContent.includes('这项承诺尚未履行')"), "shelter keeps morning repair as an unfulfilled personal promise");
    const refugeBytes = await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge.v1.')).map(k=>[k,localStorage.getItem(k)]))");
    check(Object.keys(refugeBytes).length === 1, "shelter writes exactly one branch-specific slot");
    check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "shelter does not rewrite the retreat ending");
    if (storyBranch === "loan-search") check(await evaluate("document.querySelector('[data-testid=refuge-scene]').textContent.includes('仍欠本地粮主 2 份粮秣')"), "shelter preserves the earlier grain loan");
    await capture("refuge-promise-mobile"); await layout("shelter response");
    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
    await capture("refuge-promise-desktop"); await layout("shelter desktop");
    await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
    await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
    await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await click('[data-testid="retreat-enter"]');
    await click('[data-testid="retreat-response"] [data-council-action="continue"]');
    await click('[data-testid="retreat-open-refuge"]'); await until(exists('[data-testid="refuge-response"]'));
    check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(refugeBytes), "cold reload preserves shelter save byte for byte");
    await capture("refuge-restored-desktop");
    if (morningOrder) {
      await click('[data-testid="refuge-open-morning"]'); await until(exists('[data-testid="morning-commit"]'));
      await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
      await capture("morning-opening-mobile"); await layout("morning opening");
      await click(`[data-morning-choice="${morningOrder}"]`);
      await capture("morning-choice-mobile"); await layout("morning choice");
      check(await evaluate("[...document.querySelectorAll('[data-morning-choice]')].every(button=>parseFloat(getComputedStyle(button).gridTemplateColumns.split(' ')[1])>=160)"), "morning choices retain readable text columns");
      check(await evaluate("document.querySelector('[data-testid=morning-memory]').textContent.includes('昨夜你答应')"), "morning recalls the actual labour promise");
      await click('[data-testid="morning-commit"]'); await until(exists('[data-testid="morning-response"]'));
      const expected = morningOrder === "repair-roof" ? "补漏之约已履行" : "补漏之约已失信";
      check(await evaluate(`document.querySelector('[data-testid=morning-response]').textContent.includes(${JSON.stringify(expected)})`), "morning presents the matching kept or broken promise");
      const morningBytes = await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-morning.v1.')).map(k=>[k,localStorage.getItem(k)]))");
      check(Object.keys(morningBytes).length === 1, "morning writes exactly one branch-specific save");
      await capture("morning-response-mobile"); await layout("morning response");
      await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
      await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
      await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await click('[data-testid="retreat-enter"]');
      await click('[data-testid="retreat-response"] [data-council-action="continue"]');
      await click('[data-testid="retreat-open-refuge"]'); await click('[data-testid="refuge-open-morning"]');
      await until(exists('[data-testid="morning-response"]'));
      check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-morning.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(morningBytes), "morning cold reload preserves exact saved choice");
      check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(refugeBytes), "morning does not rewrite the night's historical record");
      check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "morning preserves retreat ending bytes");
      await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
      await capture("morning-restored-desktop"); await layout("morning restored desktop");
      if (contactOrder) {
        await click('[data-testid="morning-open-contact"]'); await until(exists('[data-testid="contact-commit"]'));
        await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
        await capture("contact-opening-mobile"); await layout("contact opening");
        await click(`[data-contact-choice="${contactOrder}"]`);
        await capture("contact-choice-mobile"); await layout("contact choice");
        check(await evaluate("[...document.querySelectorAll('[data-contact-choice]')].every(button=>parseFloat(getComputedStyle(button).gridTemplateColumns.split(' ')[1])>=160)"), "contact choices have readable text columns");
        await click('[data-testid="contact-commit"]'); await until(exists('[data-testid="contact-response"]'));
        const expectedContact = { "leave-route": "已托付去处口信", "leave-record": "已托付一笔核对记录", "ask-unprompted": "取得未受凭记提示的陈述", "show-record": "不是独立印证" }[contactOrder];
        check(await evaluate(`document.querySelector('[data-testid=contact-response]').textContent.includes(${JSON.stringify(expectedContact)})`), "contact reaction matches the committed information choice");
        const contactBytes = await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-contact.v1.')).map(k=>[k,localStorage.getItem(k)]))");
        check(Object.keys(contactBytes).length === 1 && JSON.parse(Object.values(contactBytes)[0]).order === contactOrder, "one contact choice is saved to the correct branch");
        await capture("contact-response-mobile"); await layout("contact response");
        await send("Page.reload"); await until(exists('[data-testid="begin-game"]')); await click('[data-testid="begin-game"]');
        await click('[data-testid="council-enter"]'); await click('[data-testid="council-continue"]'); await click('[data-testid="fanyang-enter"]');
        await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); await click('[data-testid="retreat-enter"]');
        await click('[data-testid="retreat-response"] [data-council-action="continue"]');
        await click('[data-testid="retreat-open-refuge"]'); await click('[data-testid="refuge-open-morning"]');
        await click('[data-testid="morning-open-contact"]'); await until(exists('[data-testid="contact-response"]'));
        check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-contact.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(contactBytes), "contact cold reload preserves exact choice bytes");
        check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-morning.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(morningBytes), "contact does not rewrite morning history");
        check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(refugeBytes), "contact does not rewrite the night");
        check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "contact preserves retreat history");
        await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
        await capture("contact-restored-desktop"); await layout("contact restored desktop");
        if (followupOrder) {
          await click('[data-testid="contact-open-followup"]'); await until(exists('[data-testid="followup-commit"]'));
          await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
          await capture("followup-opening-mobile"); await layout("follow-up opening");
          const initialGrain = await evaluate("document.querySelector('[data-testid=followup-grain]').textContent");
          await click(`[data-followup-choice="${followupOrder}"]`);
          await capture("followup-choice-mobile"); await layout("follow-up choice");
          check(await evaluate("[...document.querySelectorAll('[data-followup-choice]')].every(button=>parseFloat(getComputedStyle(button).gridTemplateColumns.split(' ')[1])>=160)"), "follow-up choices retain readable phone text columns");
          await click('[data-testid="followup-commit"]'); await until(exists('[data-testid="followup-response"]'));
          const expectedLine = followupOrder === "share-ration" ? "不必再抱着湿鞋过夜" : "他没有再独自走";
          check(await evaluate(`document.querySelector('[data-testid=followup-response]').textContent.includes(${JSON.stringify(expectedLine)})`), "newcomer receives the committed local outcome, not a fabricated reunion");
          const finalGrain = await evaluate("document.querySelector('[data-testid=followup-grain]').textContent");
          check(Number(finalGrain.match(/\d+/)[0]) === Number(initialGrain.match(/\d+/)[0]) - (followupOrder === "share-ration" ? 1 : 0), "follow-up spends only the disclosed available grain");
          const followupBytes = await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-followup.v1.')).map(k=>[k,localStorage.getItem(k)]))");
          check(Object.keys(followupBytes).length === 1 && JSON.parse(Object.values(followupBytes)[0]).order === followupOrder, "follow-up writes one branch-specific choice");
          await evaluate("document.querySelector('[data-testid=followup-response]').scrollIntoView({block:'start',behavior:'instant'})");
          await capture("followup-response-mobile"); await layout("follow-up response");
          await send("Page.reload");
          for (const selector of ['[data-testid="begin-game"]', '[data-testid="council-enter"]', '[data-testid="council-continue"]', '[data-testid="fanyang-enter"]',
            '[data-testid="fanyang-response"] [data-council-action="continue"]', '[data-testid="retreat-enter"]', '[data-testid="retreat-response"] [data-council-action="continue"]',
            '[data-testid="retreat-open-refuge"]', '[data-testid="refuge-open-morning"]', '[data-testid="morning-open-contact"]', '[data-testid="contact-open-followup"]']) await click(selector);
          await until(exists('[data-testid="followup-response"]'));
          check(JSON.stringify(await evaluate("Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.refuge-followup.v1.')).map(k=>[k,localStorage.getItem(k)]))")) === JSON.stringify(followupBytes), "cold reload preserves exact follow-up bytes");
          check(await evaluate("document.querySelector('[data-testid=followup-grain]').textContent") === finalGrain, "cold resume does not spend another ration");
          for (const [prefix, bytes] of [["refuge-contact", contactBytes], ["refuge-morning", morningBytes], ["refuge", refugeBytes]]) {
            check(JSON.stringify(await evaluate(`Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('shi.dev.${prefix}.v1.')).map(k=>[k,localStorage.getItem(k)]))`)) === JSON.stringify(bytes), `follow-up preserves ${prefix} history`);
          }
          check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "follow-up preserves original retreat history");
          await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
          await capture("followup-restored-desktop"); await layout("follow-up restored desktop");
          await click('[data-testid="followup-back"]');
        }
        await click('[data-testid="contact-back"]');
      }
      await click('[data-testid="morning-back"]');
    }
    await click('[data-testid="refuge-scene"] .text-button');
    await click('[data-testid="retreat-decision-record"] summary');
  }
  if (route === "dispersed" && storyBranch === "baseline") {
    const upstream = await evaluate("[localStorage.getItem('shi.chen-council.v1'),localStorage.getItem('shi.fanyang-guarantee.v1')]");
    await click('[data-retreat-rewind="evacuation"]');
    check(await evaluate("localStorage.getItem('shi.dev.chen-retreat.v1')") === savedBeforeRecord, "opening checkpoint confirmation preserves original ending");
    await capture("07-replay-confirmation-mobile"); await layout("replay confirmation");
    await click('[data-testid="retreat-rewind-confirm"]'); await until(exists('[data-testid="retreat-commit"]'));
    check(await evaluate("JSON.parse(localStorage.getItem('shi.dev.chen-retreat.v1')).choices.join(',')") === `${reserves},${reception}`, "checkpoint retains only the two earlier orders");
    for (const id of ["escort-households", "carry-records", "stay-together"]) {
      await click(`[data-retreat-choice="${id}"]`); await click('[data-testid="retreat-commit"]');
      await click('[data-testid="retreat-response"] [data-council-action="continue"]');
    }
    check(await evaluate("document.querySelector('[data-testid=retreat-outcome]').dataset.outcome==='together'"), "reconsidered evacuation reaches a different earned ending");
    check(JSON.stringify(await evaluate("[localStorage.getItem('shi.chen-council.v1'),localStorage.getItem('shi.fanyang-guarantee.v1')]")) === JSON.stringify(upstream), "replaying retreat preserves council and Fan Yang saves");
    await capture("08-replayed-together-mobile"); await layout("replayed ending");
    await click('[data-testid="retreat-decision-record"] summary');
  }
  await click('[data-testid="retreat-decision-record"] summary');
  await click('[data-testid="retreat-outcome"] [data-council-action="close"]');
  await click('[data-testid="fanyang-scene"] [data-council-action="close"]');
  await click('[data-testid="chen-council"] [data-council-action="close"]');
  await until("!document.querySelector('.drawer')");
  check(await evaluate("getComputedStyle(document.body).overflowY!=='hidden'"), "background page scrolling restored after closing story");
  }
  if (graphicsReview === "reduced") check(report.graphicsRequests.length === 0, "entire reduced-motion route makes no Three renderer download request");
  if (graphicsReview === "unavailable") check(report.graphicsRequests.length > 0, "actual optional renderer requests failed while the route remained playable");
  check(report.errors.length === 0, "no browser runtime exceptions"); report.status = "passed";
} catch (error) {
  report.status = "failed"; report.failure = error.stack;
  if (socket?.readyState === WebSocket.OPEN) { try { await capture("failure"); } catch {} }
  process.exitCode = 1;
} finally {
  clearInterval(fit); socket?.close();
  for (const child of children.reverse()) { try { process.kill(-child.pid, "SIGTERM"); } catch {} }
  await delay(1000);
  for (const child of children) { try { process.kill(-child.pid, 0); process.kill(-child.pid, "SIGKILL"); } catch {} }
  for (const log of logs) await log.close();
  report.finished = new Date().toISOString();
  await writeFile(resolve(out, "status.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
