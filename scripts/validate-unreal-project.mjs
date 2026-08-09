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
  "Source/SHI/ShiAudioModel.h", "Source/SHI/ShiAudioModel.cpp", "Source/SHI/ShiSoundscapeComponent.h", "Source/SHI/ShiSoundscapeComponent.cpp",
  "Source/SHI/ShiWartableModel.h", "Source/SHI/ShiWartableModel.cpp",
  "Source/SHI/ShiCommandSignalModel.h", "Source/SHI/ShiCommandSignalModel.cpp",
  "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Config/DefaultEngine.ini", "Config/DefaultGame.ini",
  "Content/StreamingAssets/chapter-01-daze.json", "Content/StreamingAssets/chapter-01-audio.json",
  "Content/StreamingAssets/chapter-01-replays.v1.json", "Content/StreamingAssets/editions.json",
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
const canonicalEditions = await readFile(resolve(root, "content/research/editions.json"));
const stagedEditions = await readFile(resolve(unreal, "Content/StreamingAssets/editions.json"));
if (!canonicalEditions.equals(stagedEditions)) errors.push("Unreal staged public edition registry differs from canonical research metadata");
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
const audioModel = await readFile(resolve(unreal, "Source/SHI/ShiAudioModel.cpp"), "utf8");
const soundscape = await readFile(resolve(unreal, "Source/SHI/ShiSoundscapeComponent.cpp"), "utf8");
const wartable = await readFile(resolve(unreal, "Source/SHI/ShiWartableModel.cpp"), "utf8");
const commandSignals = await readFile(resolve(unreal, "Source/SHI/ShiCommandSignalModel.cpp"), "utf8");
const gameMode = await readFile(resolve(unreal, "Source/SHI/ShiGameMode.cpp"), "utf8");
const screen = await readFile(resolve(unreal, "Source/SHI/ShiCommandScreen.cpp"), "utf8");
const automation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp"), "utf8");
const buildRules = await readFile(resolve(unreal, "Source/SHI/SHI.Build.cs"), "utf8");
const gameConfig = await readFile(resolve(unreal, "Config/DefaultGame.ini"), "utf8");
const engineConfig = await readFile(resolve(unreal, "Config/DefaultEngine.ini"), "utf8");
for (const token of ["schema v7", "TimeIndex <=", "NextActIndex <", "StreamingAssets/chapter-01-daze.json", "StreamingAssets/editions.json", "initialResources", "nextNodeId", "commitments", "countermeasures", "ValidateEvidence", "public-link-metadata-only", "specialist-review-required"]) if (!model.includes(token)) errors.push(`Unreal model omits contract token: ${token}`);
for (const token of ["ApplyEffects(Choice->Effects)", "CommitmentOutcome->Effects", "Choice->PressureEffects", "Opposition->Effects", "MethodRead->Effects", "Condition->Effects", "SelectFieldCondition", "CanChoose", "ReplaySaveJson", "MoveTemp(Candidate)"]) if (!session.includes(token)) errors.push(`Unreal deterministic session omits contract token: ${token}`);
for (const token of ["project-original-procedural", "RequiredCues", "CreateRainSamples", "CreateCueSamples", "bDefaultEnabled"]) if (!audioModel.includes(token)) errors.push(`Unreal audio model omits contract token: ${token}`);
for (const token of ["FShiSoundGenerator", "CreateSoundGenerator", "PendingCues", "GGameUserSettingsIni", "FadeSeconds", "OutAudio[Frame * 2]", "OutAudio[Frame * 2 + 1]"]) if (!soundscape.includes(token)) errors.push(`Unreal soundscape omits render/persistence token: ${token}`);
for (const token of ["ProjectSite", "CameraTransform", "Cylinder.Cylinder", "Sphere.Sphere", "Cone.Cone", "Dist2D", "CycleSite", "TableHalfWidth", "TableHalfDepth"]) if (!wartable.includes(token)) errors.push(`Unreal wartable model omits spatial contract token: ${token}`);
for (const token of ["resource-grain", "layer-field", "layer-pursuit", "layer-method-read", "layer-commitment", "TableSurfaceZ", "MinimumPointerSpacing", "COUNTER WOULD HIT", "PURSUIT CLOSED · CAPTURED", "EXPOSURE 100 / 100", "SelectedStyle", "CameraTransform", "CycleSignal", "ValidateAgainstSites", "overlaps wartable site", "No carried promise currently awaits an answer."]) if (!commandSignals.includes(token)) errors.push(`Unreal command-signal model omits live-world contract token: ${token}`);
if (!buildRules.includes('"AudioMixer"')) errors.push("Unreal runtime module does not depend on AudioMixer");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Engine/BasicShapes")')) errors.push("Unreal packaging does not cook the engine-native wartable assets loaded by path");
if (!engineConfig.includes("r.CustomDepth=3")) errors.push("Unreal renderer does not preserve the selected wartable marker stencil");
for (const token of ["RestoreChronicle", "SaveChronicle", "ForceUTF8WithoutBOM", "Gamepad_FaceButton_Bottom", "RequestNewChronicle", "CreateSoundscape", "ToggleSound", "Gamepad_FaceButton_Top", "ToggleEvidence", "Gamepad_LeftShoulder", "GetHitResultAtScreenPosition", "Gamepad_RightShoulder", "Gamepad_LeftThumbstick", "RebuildCommandSignals", "SetActorLocationAndRotation", "CameraTransitionElapsed = CameraTransitionDuration", "bReturningFromCommandSignal", "BeginCameraTransition", "FQuat::Slerp", "SetRenderCustomDepth", "ShiSite:", "ShiSignal:"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits persistence/input/audio/evidence/world-signal token: ${token}`);
for (const token of ["SELECTED ORDER", "ISSUE ORDER", "ACT %d/%d", "SCENE %d/%d", "NEW CHRONICLE", "GAMEPAD A", "SOUND OFF", "RAIN −", "CUES −", "HISTORICAL BASIS", "EXACT LOCATOR", "SPECIALIST REVIEW REQUIRED", "OPEN PUBLIC EDITION", "WARTABLE FOCUS", "INTELLIGENCE ONLY · NOT A DESTINATION", "SHIFT REVERSES", "SPACE SKIPS CAMERA", "COMMAND SIGNAL", "READ-ONLY 3D TALLY", "C / L3 SIGNALS", "CURRENT GROUND"]) if (!screen.includes(token)) errors.push(`Unreal command screen omits interaction/evidence/world-signal token: ${token}`);
if (screen.indexOf("TSharedRef<SVerticalBox> Root") > screen.indexOf("COMMAND SIGNAL")) errors.push("Unreal command-signal card is constructed before its Slate root exists");
for (const token of ["SHI.Wartable.SpatialIntelligenceV1", "Daze projection is deterministic", "overlapping pointer targets are rejected", "unsupported hindsight marker status is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits wartable contract token: ${token}`);
for (const token of ["SHI.CommandSpace.LiveSignalsV1", "five resources and four tactical layers are visible", "selected tally remains anchored", "captured terminal state has an exact pursuit-closed signal", "nonterminal state cannot omit its pursuit band", "the carried oath becomes a live world signal", "overlapping live command signals are rejected", "cross-family pointer overlap is rejected", "missing authoritative resources reject the signal snapshot", "failed signal rebuild is atomic"]) if (!automation.includes(token)) errors.push(`Unreal automation omits live command-signal token: ${token}`);

if (errors.length) {
  console.error(`Unreal project validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7/edition/audio staging, 46 golden routes, deterministic save/replay, source-claim ledger, bounded inspectable 3D wartable and live command signals, procedural soundscape, controls, command surface and automation boundary.`);
