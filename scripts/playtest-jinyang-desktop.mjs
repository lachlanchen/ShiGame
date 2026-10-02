#!/usr/bin/env node
/** Real input recording on an already-owned review. Never writes game saves or injects outcomes. */
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, copyFile, access, stat } from "node:fs/promises";
import { resolve } from "node:path";
const run = promisify(execFile);
const evidence = resolve(process.argv[2] || ".runtime/jinyang-desktop-review");
const routeName = process.argv[3] || "quiet-recovery";
const captureName = process.argv.find(a=>a.startsWith("--capture="))?.slice(10) || routeName;
if (!/^[a-z0-9-]{1,64}$/.test(captureName)) throw Error("Invalid capture name");
const routes = {
  "quiet-recovery": [["wall",1,"brace"],["embankment",1,"diversion"],["han",1,"quiet-han"],
    ["wei",1,"quiet-wei"],["zhao",1,"relay"],["zhao",2,"early-date"],
    ["zhao",3,"aligned-date"],["zhao",5,"execute"]],
  withdrawal: [["route",1,"escape"],["route",2,"withdraw"]],
};
if (!routes[routeName]) throw Error("Unknown review route");
const ownership = JSON.parse(await readFile(resolve(evidence,"owned-processes.json"),"utf8"));
const player = ownership.processes.find(p => p.name === "player");
if (ownership.display !== ":121" || !player?.pid) throw Error("Not the dedicated SHI review");
const command = await readFile(`/proc/${player.pid}/cmdline`,"utf8");
if (!command.includes("ShiJinyangGameMode") || !command.includes(evidence)) throw Error("Player ownership mismatch");
const env = {...process.env,DISPLAY:ownership.display,XAUTHORITY:""};
const pause = ms => new Promise(r => setTimeout(r,ms));
const key = async k => { await run("xdotool",["key",k],{env}); await pause(500); };
const logPath = resolve(evidence,"engine.log"), savePath = resolve(evidence,"chronicle.v1.json");
const videoPath = resolve(evidence,captureName+"-full.mp4");
try { await access(videoPath); throw Error("Recording already exists; choose another capture name"); }
catch (e) { if (e.code!=="ENOENT") throw e; }
async function waitFor(predicate,label,seconds=120) {
  const until = Date.now()+seconds*1000;
  while (Date.now()<until) { if (await predicate()) return; await pause(250); }
  throw Error("Timed out: "+label+". No retry or save mutation applied.");
}
await waitFor(async()=> (await readFile(logPath,"utf8")).includes("SHI_JINYANG_READY"),"player ready");
const ledger = JSON.parse(await readFile(savePath,"utf8"));
if (ledger.history.length) {
  if (!process.argv.includes("--archive-restart")) throw Error("Route needs a fresh chronicle, or an explicit --archive-restart on a completed ending");
  const log = await readFile(logPath,"utf8");
  if (!/SHI_JINYANG_SETTLED[^\n]*outcome=(coordinated-reversal|costly-withdrawal|isolated-defeat)/.test(log))
    throw Error("Existing route is not observed at a settled ending; not restarted");
  await key("r"); await pause(700); await key("r");
  await waitFor(async()=> JSON.parse(await readFile(savePath,"utf8")).history.length===0,"confirmed archived restart",10);
}
let recording, recordingClosed;
let audioStarted = false;
const events = [], started = Date.now();
try {
  recording = spawn("ffmpeg",["-hide_banner","-loglevel","error","-f","x11grab","-framerate","15",
    "-video_size","1920x1080","-i",":121.0","-vf","scale=1280:720","-c:v","libx264",
    "-threads","2","-preset","veryfast","-crf","24","-pix_fmt","yuv420p",videoPath],
    {env,stdio:["pipe","ignore","inherit"]});
  recordingClosed = new Promise((resolve,reject)=> { recording.once("error",reject); recording.once("exit",(code)=> code===0?resolve():reject(Error("Recorder exit "+code))); });
  const beforeAudio = (await readFile(logPath,"utf8")).length;
  await key("F8");
  await waitFor(async()=> (await readFile(logPath,"utf8")).slice(beforeAudio).includes("SHI_JINYANG_AUDIO enabled="),"sound state",10);
  if ((await readFile(logPath,"utf8")).slice(beforeAudio).includes("SHI_JINYANG_AUDIO enabled=1")) { await key("m"); await pause(1200); }
  await key("F9"); audioStarted = true;
  await pause(2200); // Explicit pre-consent silence.
  await key("m");
  await run("import",["-window","root",resolve(evidence,captureName+"-entry.png")],{env});
  const sites=["wall","embankment","route","han","wei","zhi","zhao"];
  let selected=0;
  for (const [site,digit,id] of routes[routeName]) {
    while (sites[selected]!==site) { await key("Tab"); selected=(selected+1)%sites.length; }
    await pause(800);
    const before = (await readFile(logPath,"utf8")).length;
    await key(String(digit));
    await waitFor(async()=> (await readFile(logPath,"utf8")).slice(before).includes("SHI_JINYANG_ORDER id="+id+" "),"committed "+id,10);
    const history=JSON.parse(await readFile(savePath,"utf8")).history;
    if (history.at(-1)!==id) throw Error("Unexpected actual order: "+JSON.stringify(history));
    events.push({id,history:history.length,atSeconds:(Date.now()-started)/1000});
    console.log("Committed "+id+"; watching the whole presentation (no skip).");
    await waitFor(async()=> (await readFile(logPath,"utf8")).slice(before).includes(`SHI_JINYANG_SETTLED history=${history.length} skipped=false`),"settled "+id);
    await pause(1300);
    await run("import",["-window","root",resolve(evidence,captureName+"-"+id+".png")],{env});
  }
  await key("F8"); await pause(3000);
  const exportStarted=Date.now(); await key("F9"); audioStarted = false;
  await waitFor(async()=> { try { const s=await stat(resolve(evidence,"jinyang-mixer.wav")); return s.mtimeMs>=exportStarted && s.size>44; } catch { return false; } },"fresh mixer export",15);
  await pause(1000);
  await copyFile(resolve(evidence,"jinyang-mixer.wav"),resolve(evidence,captureName+"-mixer.wav"));
  await writeFile(resolve(evidence,captureName+"-input-review.json"),JSON.stringify({route:routeName,
    started:new Date(started).toISOString(),seconds:(Date.now()-started)/1000,events,
    input:"actual xdotool keyboard; no skips; save inspected read-only",visualReview:"pending",
    capture:"15fps capture is not measured engine frame rate; mixer audio is not physical speaker acceptance"},null,2));
  console.log("Complete route recorded: "+videoPath);
} finally {
  if (audioStarted) await key("F9");
  if (recording && recording.exitCode===null) recording.stdin.end("q\n");
  if (recordingClosed) await recordingClosed;
}
