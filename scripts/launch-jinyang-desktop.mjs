#!/usr/bin/env node
/** Launch the installed Linux game on the ordinary desktop, not an editor or noVNC. */
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, readFile, mkdir, open } from "node:fs/promises";
import { resolve, join } from "node:path";
import { constants } from "node:fs";
const run=promisify(execFile);
const packageRoot=process.argv.slice(2).find(a=>!a.startsWith("--"));
if(!packageRoot)throw Error("Usage: node scripts/launch-jinyang-desktop.mjs /absolute/package/Linux [--zh] [--reduced-motion]");
const root=resolve(packageRoot),binary=join(root,"SHI/Binaries/Linux/SHI");
await access(binary,constants.X_OK);
if(!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY)throw Error("No ordinary desktop display is available.");
const processes=(await run("ps",["-u",String(process.getuid()),"-o","pid=,args="])).stdout;
if(processes.split("\n").some(line=>/^\s*\d+\s+\S*\/SHI\/Binaries\/Linux\/SHI(?:\s|$)/.test(line)
  || /^\s*\d+\s+\S*\/UnrealEditor\s/.test(line)&&line.includes("SHI.uproject")&&line.includes("-game")))
  throw Error("A SHI player is already open. Close or reuse it; no second player started.");
const mem=await readFile("/proc/meminfo","utf8");
const number=key=>Number(mem.match(new RegExp("^"+key+":\\s+(\\d+)","m"))?.[1]);
if(number("MemAvailable")<24*1024*1024 || number("SwapTotal") && (number("SwapTotal")-number("SwapFree"))/number("SwapTotal")>.75)
  throw Error("Shared-workstation memory limit reached. No game started.");
const data=resolve(process.env.SHI_JINYANG_DATA || join(process.env.XDG_DATA_HOME || join(process.env.HOME,".local/share"),"shi/jinyang"));
await mkdir(data,{recursive:true});
const log=await open(join(data,"desktop-launch.log"),"a");
const child=spawn(binary,["/Engine/Maps/Entry?game=/Script/SHI.ShiJinyangGameMode","-ShiExplore",
  "-windowed","-ResX=1600","-ResY=900","-nosplash","-vulkan",
  "-ShiJinyangSave="+join(data,"chronicle.v2.json"),"-abslog="+join(data,"game.log"),
  ...(process.argv.includes("--profile")?["-csvCaptureFrames=600"]:[]),
  ...(process.argv.includes("--zh")?["-ShiLocale=zh-Hans"]:[]),
  ...(process.argv.includes("--reduced-motion")?["-ShiReducedMotion"]:[])],
  {cwd:root,detached:true,stdio:["ignore",log.fd,log.fd]});
await new Promise((resolve,reject)=>{child.once("spawn",resolve);child.once("error",reject);});
child.unref();await log.close();
console.log(`SHI desktop player started: PID ${child.pid}. Save: ${data}`);
