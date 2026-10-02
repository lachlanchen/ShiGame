#!/usr/bin/env node
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir, open, writeFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const engine = process.env.SHI_UNREAL_ROOT || "/home/lachlan/UnrealEngine/UE_5.8.1";
const evidence = resolve(process.argv[2] || resolve(root, ".runtime/jinyang-desktop-review"));
const display = ":121", vnc = 5921, novnc = 6121;
const children = [];
const logs = [];
let finish;
const stopped = new Promise(resolve => { finish = resolve; });
process.on("SIGINT", () => finish("interrupt"));
process.on("SIGTERM", () => finish("terminate"));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const env = { ...process.env, DISPLAY: display, XAUTHORITY: "" };
for (const path of ["/tmp/.X121-lock", "/tmp/.X11-unix/X121"]) {
  let exists = false;
  try { await access(path); exists = true; } catch {}
  if (exists) throw Error("Display :121 already has a lock/socket; no duplicate stack started.");
}
const mem = await readFile("/proc/meminfo", "utf8");
const number = key => Number(mem.match(new RegExp("^" + key + ":\\s+(\\d+)", "m"))?.[1]);
if (number("MemAvailable") < 24 * 1024 * 1024)
  throw Error("Less than 24 GiB available; no runtime started.");
if (number("SwapTotal") && (number("SwapTotal") - number("SwapFree")) / number("SwapTotal") > .75)
  throw Error("Swap exceeds 75%; no runtime started. Inspect only obsolete SHI-owned jobs.");
for (const port of [vnc, novnc]) {
  await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", () => reject(Error("SHI review port already occupied: " + port)));
    s.listen(port, "127.0.0.1", () => s.close(resolve));
  });
}
await mkdir(evidence, { recursive: true });
async function start(name, executable, args) {
  const log = await open(resolve(evidence, name + ".log"), "a"); logs.push(log);
  const child = spawn(executable, args, { env, stdio: ["ignore", log.fd, log.fd] });
  child.on("error", e => finish(name + ": " + e.message));
  children.push({ name, child });
  await writeFile(resolve(evidence, "owned-processes.json"), JSON.stringify({
    display, vnc, novnc, evidence, processes: children.map(x => ({ name: x.name, pid: x.child.pid })),
  }, null, 2));
  return child;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode) return;
  child.kill("SIGTERM");
  await Promise.race([new Promise(resolve => child.once("exit", resolve)), pause(1500)]);
  if (child.exitCode === null && !child.signalCode) child.kill("SIGKILL");
}
try {
  await start("xvfb", "Xvfb", [display, "-screen", "0", "1920x1080x24", "-ac", "-nolisten", "tcp"]);
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { await run("xdpyinfo", [], { env }); ready = true; break; } catch { await pause(250); }
  }
  if (!ready) throw Error("Owned X display did not start.");
  await start("vnc", "x11vnc", ["-display", display, "-localhost", "-no6", "-nopw", "-forever", "-shared", "-rfbport", String(vnc)]);
  await start("novnc", "websockify", ["--web=/usr/share/novnc", "127.0.0.1:" + novnc, "127.0.0.1:" + vnc]);
  const player = await start("player", resolve(engine, "Engine/Binaries/Linux/UnrealEditor"), [
    resolve(root, "apps/unreal/SHI.uproject"), "/Engine/Maps/Entry?game=/Script/SHI.ShiJinyangGameMode",
    "-game", "-windowed", "-ResX=1920", "-ResY=1080", "-WinX=0", "-WinY=0", "-nosplash", "-vulkan",
    "-ShiJinyangSave=" + resolve(evidence, "chronicle.v1.json"),
    "-ShiAudioReview",
    "-abslog=" + resolve(evidence, "engine.log"),
  ]);
  player.on("exit", (code, signal) => finish("player exit " + code + " " + signal));
  const fit = setInterval(async () => {
    try {
      const { stdout } = await run("xdotool", ["search", "--onlyvisible", "--pid", String(player.pid)], { env });
      const id = stdout.trim().split("\n").at(-1);
      if (id) await run("xdotool", ["windowmap", id, "windowmove", id, "0", "0", "windowsize", id, "1920", "1080", "windowfocus", id], { env });
    } catch {}
  }, 2000);
  const url = "http://127.0.0.1:6121/vnc.html?host=127.0.0.1&port=6121&autoconnect=1&resize=scale&view_only=0&shared=0";
  console.log("Jinyang review starting. URL: " + url);
  console.log("Owned player PID " + player.pid + "; evidence " + evidence + ". Ctrl-C cleans up this exact stack.");
  const reason = await stopped; clearInterval(fit);
  console.log("Stopping review: " + reason);
} finally {
  for (const { child } of [...children].reverse()) await stop(child);
  for (const log of logs) await log.close();
  await writeFile(resolve(evidence, "closed.json"), JSON.stringify({ closed: true, time: new Date().toISOString(), display, vnc, novnc }));
  console.log("Owned player and GUI stack stopped.");
}
