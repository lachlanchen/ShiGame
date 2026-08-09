import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const unreal = resolve(root, "apps/unreal");
const errors = [];
const required = [
  "SHI.uproject", "Source/SHI.Target.cs", "Source/SHIEditor.Target.cs", "Source/SHI/SHI.Build.cs",
  "Source/SHI/ShiCampaignModel.h", "Source/SHI/ShiCampaignModel.cpp", "Source/SHI/ShiGameMode.h",
  "Source/SHI/ShiGameMode.cpp", "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Config/DefaultEngine.ini", "Config/DefaultGame.ini",
  "Content/StreamingAssets/chapter-01-daze.json", "Content/StreamingAssets/chapter-01-audio.json",
];

for (const relative of required) {
  try { await access(resolve(unreal, relative), constants.R_OK); } catch { errors.push(`missing Unreal project file: ${relative}`); }
}

const project = JSON.parse(await readFile(resolve(unreal, "SHI.uproject"), "utf8"));
if (project.EngineAssociation !== "5.8") errors.push("Unreal engine association must be 5.8");
if (!project.Modules?.some((module) => module.Name === "SHI" && module.Type === "Runtime")) errors.push("SHI runtime module is not registered");

const canonical = await readFile(resolve(root, "content/campaigns/chapter-01-daze.json"));
const staged = await readFile(resolve(unreal, "Content/StreamingAssets/chapter-01-daze.json"));
if (!canonical.equals(staged)) errors.push("Unreal staged campaign differs from canonical content");

const model = await readFile(resolve(unreal, "Source/SHI/ShiCampaignModel.cpp"), "utf8");
const gameMode = await readFile(resolve(unreal, "Source/SHI/ShiGameMode.cpp"), "utf8");
const screen = await readFile(resolve(unreal, "Source/SHI/ShiCommandScreen.cpp"), "utf8");
for (const token of ["schema v7", "TimeIndex <=", "NextActIndex <", "StreamingAssets/chapter-01-daze.json", "initialResources", "nextNodeId", "commitments", "countermeasures"]) if (!model.includes(token)) errors.push(`Unreal model omits contract token: ${token}`);
for (const token of ["ApplyEffects(Choice.Effects)", "CommitmentOutcome->Effects", "Choice.PressureEffects", "Opposition->Effects", "MethodRead->Effects", "Condition->Effects", "SelectFieldCondition", "CanChoose"]) if (!gameMode.includes(token)) errors.push(`Unreal resolution omits contract token: ${token}`);
for (const token of ["SELECTED ORDER", "ISSUE ORDER", "ACT %d/%d", "SCENE %d/%d"]) if (!screen.includes(token)) errors.push(`Unreal command screen omits interaction token: ${token}`);

if (errors.length) {
  console.error(`Unreal project validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7 staging, C++ loader, command surface and automation boundary.`);
