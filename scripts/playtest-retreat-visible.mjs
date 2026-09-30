// Own one isolated visible desktop; preserve evidence, terminate exact children.
import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile, open } from "node:fs/promises";
import { resolve } from "node:path";
import net from "node:net";

const root = resolve(import.meta.dirname, "..");
const route = process.argv[2] ?? "together";
if (!["together", "dispersed"].includes(route) || process.argv.length > 3) throw new Error("Usage: node scripts/playtest-retreat-visible.mjs [together|dispersed]");
const evacuation = route === "together" ? "escort-households" : "hold-formation";
const out = resolve(root, ".runtime/story-review", new Date().toISOString().replaceAll(":", "-"));
await mkdir(out, { recursive: true });
const report = { status: "running", output: out, started: new Date().toISOString(), checks: [], screenshots: [], errors: [], owned: [],
  route,
  boundary: "Agent-operated visible development web route; not human acceptance, native or store verification." };
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
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);
  await delay(200);
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
const layout = async name => {
  const value = await evaluate("({viewport:innerWidth,document:document.documentElement.scrollWidth,drawers:[...document.querySelectorAll('.drawer')].map(e=>({width:e.clientWidth,scroll:e.scrollWidth}))})");
  check(value.document <= value.viewport + 1 && value.drawers.every(d => d.scroll <= d.width + 1), `${name}: no horizontal overflow`);
  check(await evaluate("getComputedStyle(document.body).overflowY==='hidden'"), `${name}: background page scrolling locked`);
};
try {
  for (const port of [4173, 5921, 6121, 9321]) await freePort(port);
  let liveDisplay = false;
  try { execFileSync("xdpyinfo", ["-display", ":121"], { stdio: "ignore" }); liveDisplay = true; } catch {}
  check(!liveDisplay, "SHI display is unoccupied");
  await launch("xvfb", "Xvfb", [":121", "-screen", "0", "1600x1000x24", "-nolisten", "tcp"]);
  await delay(800);
  await launch("vnc", "x11vnc", ["-display", ":121", "-listen", "127.0.0.1", "-rfbport", "5921", "-nopw", "-forever", "-nevershared"]);
  await launch("novnc", "websockify", ["--web=/usr/share/novnc", "127.0.0.1:6121", "127.0.0.1:5921"]);
  await launch("vite", process.execPath, ["node_modules/vite/bin/vite.js", "apps/web", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], { VITE_SHI_NATIVE: "1" });
  // Existing isolated profile, but an incognito app window preserves old QA saves.
  await launch("chrome", "google-chrome", ["--no-first-run", "--no-default-browser-check", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--incognito", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=9321", `--user-data-dir=${root}/.runtime/novnc/profile`, "--window-size=1600,1000", "--app=http://127.0.0.1:4173/?seed=00000000"], { DISPLAY: ":121" });
  fit = setInterval(() => { try {
    const ids = execFileSync("xdotool", ["search", "--onlyvisible", "--class", "Google-chrome"], { env: { ...process.env, DISPLAY: ":121" }, encoding: "utf8" }).trim().split("\n");
    for (const id of ids.filter(Boolean)) execFileSync("xdotool", ["windowmove", "--sync", id, "0", "0", "windowsize", "--sync", id, "1600", "1000"], { env: { ...process.env, DISPLAY: ":121" }, stdio: "ignore" });
  } catch {} }, 1500);
  let target;
  for (let n = 0; n < 80 && !target; n++) { try { target = (await fetch("http://127.0.0.1:9321/json").then(r => r.json())).find(t => t.type === "page"); } catch {} await delay(200); }
  check(target, "dedicated Chrome page available");
  check((await fetch("http://127.0.0.1:6121/vnc.html")).ok, "full noVNC viewer reachable");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((yes, no) => { socket.addEventListener("open", yes, { once: true }); socket.addEventListener("error", no, { once: true }); });
  socket.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (p) m.error ? p.no(new Error(m.error.message)) : p.yes(m.result); } if (m.method === "Runtime.exceptionThrown") report.errors.push(m.params.exceptionDetails.text); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:4173/?seed=00000000" });
  await until(exists('[data-testid="begin-game"]'));
  const xenv = { ...process.env, DISPLAY: ":121" };
  const windowId = execFileSync("xdotool", ["search", "--onlyvisible", "--class", "Google-chrome"], { env: xenv, encoding: "utf8" }).trim().split("\n")[0];
  execFileSync("xdotool", ["windowmove", "--sync", windowId, "0", "0", "windowsize", "--sync", windowId, "1600", "1000"], { env: xenv });
  report.windowGeometry = execFileSync("xdotool", ["getwindowgeometry", "--shell", windowId], { env: xenv, encoding: "utf8" });
  check(/WIDTH=1600\b/.test(report.windowGeometry) && /HEIGHT=1000\b/.test(report.windowGeometry), "Chrome window fits the dedicated desktop");
  await evaluate("(()=>{const e=document.querySelector('select');e.value='zh-Hans';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await until("document.documentElement.lang==='zh-Hans'"); await capture("01-title");
  await click('[data-testid="begin-game"]');
  await click('[data-testid="guide-continue"]');
  for (let n = 0; n < 4; n++) { await click('[data-testid="commit-selected"]'); await click('[data-testid="resolution-continue"]'); }
  await click('[data-testid="council-enter"]');
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await capture("02-council-mobile"); await layout("council");
  for (const id of ["defer-title", "joint-ledger", "one-command"]) { await click(`[data-council-choice="${id}"]`); await click('[data-testid="council-commit"]'); await click('[data-testid="council-continue"]'); }
  await click('[data-testid="fanyang-enter"]');
  for (const id of ["public-safety", "hold-talks", "withdraw-envoy"]) { await click(`[data-fanyang-choice="${id}"]`); await click('[data-testid="fanyang-commit"]'); await click('[data-testid="fanyang-response"] [data-council-action="continue"]'); }
  await click('[data-testid="retreat-enter"]'); await until(exists('[data-testid="retreat-commit"]'));
  await capture("03-retreat-mobile"); await layout("retreat opening");
  for (const id of ["keep-reserve", "gather-own", evacuation, "carry-records"]) {
    await click(`[data-retreat-choice="${id}"]`);
    if (id === "keep-reserve") {
      await capture("03b-retreat-choice-mobile");
      report.choiceGeometry = await evaluate("(()=>{const e=document.querySelector('[data-retreat-choice=keep-reserve]'),r=document.createRange();r.selectNodeContents([...e.childNodes].find(n=>n.nodeType===Node.TEXT_NODE));return {labelWidth:r.getBoundingClientRect().width,buttonWidth:e.getBoundingClientRect().width}})()");
      check(report.choiceGeometry.labelWidth > report.choiceGeometry.buttonWidth / 2, "retreat choice uses a readable text column");
    }
    await click('[data-testid="retreat-commit"]');
    if (id === evacuation) {
      const expected = route === "together" ? "掌心全是木刺" : "墙角以里";
      check(await evaluate(`document.querySelector('[data-testid=retreat-response]').textContent.includes(${JSON.stringify(expected)})`), "saved evacuation presents its matching physical aftermath");
      await capture("04-evacuation-aftermath-mobile"); await layout("evacuation aftermath");
    }
    await click('[data-testid="retreat-response"] [data-council-action="continue"]');
  }
  check(await evaluate(exists('[data-testid="retreat-witnessed-arrival"]')) === (route === "together"), "Yu presence matches the actual escort decision");
  if (route === "together") {
    await evaluate("document.querySelector('[data-testid=retreat-witnessed-arrival]').scrollIntoView({block:'start'})");
    await capture("04-yu-arrival-mobile"); await layout("Yu arrival");
  }
  await click(`[data-retreat-choice="${route === "together" ? "stay-together" : "release-groups"}"]`); await click('[data-testid="retreat-commit"]');
  await capture("05-ending-response-mobile");
  await click('[data-testid="retreat-response"] [data-council-action="continue"]');
  check(await evaluate(`document.querySelector('[data-testid=retreat-outcome]')?.dataset.outcome===${JSON.stringify(route)}`), `complete title-to-${route} route`);
  const closingLine = route === "together" ? "锅边已经有人喊你吃饭" : "人分开了，账还是找你";
  check(await evaluate(`document.querySelector('[data-testid=retreat-ending-memory]').textContent.includes(${JSON.stringify(closingLine)})`), "ending preserves centrally held records");
  await evaluate("document.querySelector('[data-testid=retreat-outcome]').scrollIntoView({block:'start'})");
  await capture("06-ending-mobile"); await layout("ending");
  await click('[data-testid="retreat-outcome"] [data-council-action="close"]');
  await click('[data-testid="fanyang-scene"] [data-council-action="close"]');
  await click('[data-testid="chen-council"] [data-council-action="close"]');
  await until("!document.querySelector('.drawer')");
  check(await evaluate("getComputedStyle(document.body).overflowY!=='hidden'"), "background page scrolling restored after closing story");
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
