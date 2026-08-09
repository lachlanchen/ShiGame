import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const unreal = resolve(root, "apps/unreal");
const errors = [];
const required = [
  "SHI.uproject", "Source/SHI.Target.cs", "Source/SHIEditor.Target.cs", "Source/SHI/SHI.Build.cs",
  "Source/SHI/ShiCampaignModel.h", "Source/SHI/ShiCampaignModel.cpp", "Source/SHI/ShiGameMode.h",
  "Source/SHI/ShiCampaignSession.h", "Source/SHI/ShiCampaignSession.cpp", "Source/SHI/ShiGameMode.cpp",
  "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Config/DefaultEngine.ini", "Config/DefaultGame.ini",
  "Content/StreamingAssets/chapter-01-daze.json", "Content/StreamingAssets/chapter-01-audio.json",
  "Content/StreamingAssets/chapter-01-replays.v1.json",
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
const replayBytes = await readFile(resolve(unreal, "Content/StreamingAssets/chapter-01-replays.v1.json"));
const replayFixture = JSON.parse(replayBytes.toString("utf8"));
const campaignSha256 = createHash("sha256").update(canonical).digest("hex");
if (replayFixture.fixtureVersion !== 1 || replayFixture.campaignId !== "chapter-01-daze" || replayFixture.campaignSchemaVersion !== 7)
  errors.push("Unreal replay conformance header is invalid");
if (replayFixture.campaignSha256 !== campaignSha256) errors.push("Unreal replay conformance fixture targets a different campaign payload");
if (replayFixture.routeCount !== 46 || replayFixture.routes?.length !== 46 || replayFixture.successfulRoutes !== 40 || replayFixture.failureRoutes !== 6)
  errors.push("Unreal replay conformance fixture does not cover the reviewed 46-route horizon");

const model = await readFile(resolve(unreal, "Source/SHI/ShiCampaignModel.cpp"), "utf8");
const session = await readFile(resolve(unreal, "Source/SHI/ShiCampaignSession.cpp"), "utf8");
const gameMode = await readFile(resolve(unreal, "Source/SHI/ShiGameMode.cpp"), "utf8");
const screen = await readFile(resolve(unreal, "Source/SHI/ShiCommandScreen.cpp"), "utf8");
for (const token of ["schema v7", "TimeIndex <=", "NextActIndex <", "StreamingAssets/chapter-01-daze.json", "initialResources", "nextNodeId", "commitments", "countermeasures"]) if (!model.includes(token)) errors.push(`Unreal model omits contract token: ${token}`);
for (const token of ["ApplyEffects(Choice->Effects)", "CommitmentOutcome->Effects", "Choice->PressureEffects", "Opposition->Effects", "MethodRead->Effects", "Condition->Effects", "SelectFieldCondition", "CanChoose", "ReplaySaveJson", "MoveTemp(Candidate)"]) if (!session.includes(token)) errors.push(`Unreal deterministic session omits contract token: ${token}`);
for (const token of ["RestoreChronicle", "SaveChronicle", "ForceUTF8WithoutBOM", "Gamepad_FaceButton_Bottom", "RequestNewChronicle"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits persistence/input token: ${token}`);
for (const token of ["SELECTED ORDER", "ISSUE ORDER", "ACT %d/%d", "SCENE %d/%d", "NEW CHRONICLE", "GAMEPAD A"]) if (!screen.includes(token)) errors.push(`Unreal command screen omits interaction token: ${token}`);

if (errors.length) {
  console.error(`Unreal project validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7 staging, 46 golden routes, deterministic save/replay session, controls, command surface and automation boundary.`);
