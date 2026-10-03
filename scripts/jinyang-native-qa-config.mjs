#!/usr/bin/env node
/** Produce two QA-only config files in a NEW directory; never patch a working project. */
import { readFile, writeFile, mkdir, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
export const qaIdentifier="art.lazying.shi.jinyangqa";
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");

/** Replace only the named section keys, preserving unrelated values and comments. */
export function overrideIni(source,section,values) {
  if(/[\r\n\[\]]/.test(section))throw Error("Invalid section");
  const keys=new Set(Object.keys(values));
  const lines=source.replace(/\r\n/g,"\n").split("\n");
  let active=false;
  const kept=[];
  for(const line of lines) {
    const header=line.match(/^\s*\[([^\]]+)\]\s*$/);
    if(header)active=header[1]===section;
    const key=line.match(/^\s*[+!.-]?([A-Za-z0-9_.]+)\s*=/)?.[1];
    if(active && key && keys.has(key))continue;
    kept.push(line);
  }
  // Unreal combines repeated sections; overridden keys have already been removed.
  const additions=Object.entries(values).flatMap(([key,value])=>{
    if(!/^[A-Za-z0-9_.]+$/.test(key))throw Error("Invalid key");
    const all=Array.isArray(value)?value:[value];
    if(all.some(x=>typeof x!=="string" || /[\r\n]/.test(x)))throw Error("Invalid value");
    return Array.isArray(value)?[`!${key}=ClearArray`,...all.map(x=>`+${key}=${x}`)]:[`${key}=${value}`];
  });
  return kept.join("\n").trimEnd()+`\n\n[${section}]\n${additions.join("\n")}\n`;
}

export function renderQaConfig(engine,game,platform) {
  if(!["IOS","Android","Mac"].includes(platform))throw Error("Choose IOS, Android or Mac");
  if(!engine.includes("GlobalDefaultGameMode=/Script/SHI.ShiGameMode"))
    throw Error("Expected unchanged base SHI engine configuration");
  const apply=(text,sections)=>Object.entries(sections).reduce((s,[name,values])=>overrideIni(s,name,values),text);
  engine=apply(engine,{
    "/Script/EngineSettings.GameMapsSettings":{
      GameDefaultMap:"/Engine/Maps/Entry",GlobalDefaultGameMode:"/Script/SHI.ShiJinyangGameMode",
    },
    "/Script/IOSRuntimeSettings.IOSRuntimeSettings":{
      BundleIdentifier:qaIdentifier,BundleDisplayName:"SHI Jinyang QA",BundleName:"SHIJinyangQA",
      bSupportsPortraitOrientation:"False",bSupportsUpsideDownOrientation:"False",
      bSupportsLandscapeLeftOrientation:"True",bSupportsLandscapeRightOrientation:"True",
      bSupportsMetal:"True",bSupportsMetalMobileSM5:"False",bSupportsMetalMobileSM6:"False",
      bEnableGameCenterSupport:"False",
    },
    "/Script/AndroidRuntimeSettings.AndroidRuntimeSettings":{
      PackageName:qaIdentifier,ApplicationDisplayName:"SHI Jinyang QA",VersionDisplayName:"0.1.0-qa",
      StoreVersion:"1",Orientation:"SensorLandscape",bBuildForArm64:"True",bBuildForX8664:"False",
      bSupportsVulkan:"True",bSupportsVulkanSM5:"False",bBuildForES31:"True",
      bPackageDataInsideApk:"True",bUseExternalFilesDir:"True",bPublicLogFiles:"False",
      bEnableGooglePlaySupport:"False",bSupportAdMob:"False",
    },
  });
  // Mobile renderer qualification, not a promise of desktop Lumen/Nanite on a phone.
  if(platform!=="Mac")engine=apply(engine,{
    "/Script/Engine.RendererSettings":{
      "r.DynamicGlobalIlluminationMethod":"0","r.ReflectionMethod":"0",
      "r.GenerateMeshDistanceFields":"False","r.Mobile.ShadingPath":"0",
      "r.Mobile.AntiAliasing":"2","r.AntiAliasingMethod":"2",
    },
  });
  game=apply(game,{
    "/Script/EngineSettings.GeneralProjectSettings":{
      ProjectName:"SHI Jinyang QA",ProjectVersion:"0.1.0-qa",
      ProjectDisplayedTitle:'NSLOCTEXT("SHI", "JinyangQATitle", "SHI Jinyang QA")',
    },
    "SHI.Jinyang":{StartInExploration:"True",InitialLocale:"zh-Hans",NativeQATarget:platform},
    "/Script/UnrealEd.ProjectPackagingSettings":{
      BuildConfiguration:"PPBC_Development",ForDistribution:"False",FullRebuild:"False",
      DirectoriesToAlwaysCook:[
        '(Path="/Engine/BasicShapes")','(Path="/Engine/MobileResources/HUD")',
        '(Path="/Game/SHI/Art/JinyangWorld")',
      ],
    },
  });
  return {engine,game};
}

export async function prepareQaConfig(destination,platform) {
  if(!isAbsolute(destination))throw Error("Destination must be absolute");
  const parent=await realpath(dirname(destination));
  destination=resolve(parent,relative(dirname(destination),destination));
  const engineProject=await realpath(resolve(root,"apps/unreal"));
  if(destination===engineProject || destination.startsWith(engineProject+"/"))
    throw Error("Never prepare overrides inside the canonical Unreal project");
  const engine=await readFile(resolve(engineProject,"Config/DefaultEngine.ini"),"utf8");
  const game=await readFile(resolve(engineProject,"Config/DefaultGame.ini"),"utf8");
  const result=renderQaConfig(engine,game,platform);
  // Exclusive creation means an existing source/config directory is never overwritten.
  await mkdir(destination,{mode:0o700});
  const files={"DefaultEngine.ini":result.engine,"DefaultGame.ini":result.game};
  for(const [name,text] of Object.entries(files))await writeFile(resolve(destination,name),text,{flag:"wx"});
  const receipt={profile:"jinyang-native-qa-v1",platform,applicationId:qaIdentifier,
    sourceConfig:{engine:sha(engine),game:sha(game)},
    outputs:Object.fromEntries(Object.entries(files).map(([name,text])=>[name,sha(text)])),
    qualification:"configuration only; not a compiled, installed, signed or submitted application",
    apply:"Use only in an isolated SHI staging checkout after preserving its original Config files.",
    engineRequirements:"Use the installed engine SDK metadata; this profile does not install or pin shared SDKs.",
  };
  await writeFile(resolve(destination,"qa-config-receipt.json"),JSON.stringify(receipt,null,2)+"\n",{flag:"wx"});
  return receipt;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [platform,destination,...rest]=process.argv.slice(2);
  if(!platform || !destination || rest.length)throw Error("Usage: node scripts/jinyang-native-qa-config.mjs IOS|Android|Mac /absolute/new-config-directory");
  console.log(JSON.stringify(await prepareQaConfig(destination,platform),null,2));
}
