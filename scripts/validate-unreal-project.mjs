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
  "Source/SHI/ShiCouncilStagingModel.h", "Source/SHI/ShiCouncilStagingModel.cpp",
  "Source/SHI/ShiCouncilFigure.h", "Source/SHI/ShiCouncilFigure.cpp",
  "Source/SHI/ShiCinematicBeatModel.h", "Source/SHI/ShiCinematicBeatModel.cpp",
  "Source/SHI/ShiOrderTransactionModel.h", "Source/SHI/ShiOrderTransactionModel.cpp",
  "Source/SHI/ShiEngagementModel.h", "Source/SHI/ShiEngagementModel.cpp",
  "Source/SHI/ShiEngagementSession.h", "Source/SHI/ShiEngagementSession.cpp",
  "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Source/SHI/Private/Tests/ShiEngagementAutomationTest.cpp",
  "Config/DefaultEngine.ini", "Config/DefaultGame.ini",
  "Content/StreamingAssets/chapter-01-daze.json", "Content/StreamingAssets/chapter-01-audio.json",
  "Content/StreamingAssets/chapter-01-broken-crossing.v1.json",
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
const canonicalEngagement = await readFile(resolve(root, "content/engagements/chapter-01-broken-crossing.v1.json"));
const stagedEngagement = await readFile(resolve(unreal, "Content/StreamingAssets/chapter-01-broken-crossing.v1.json"));
if (!canonicalEngagement.equals(stagedEngagement)) errors.push("Unreal staged engagement differs from canonical shared contract");
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
const councilStaging = await readFile(resolve(unreal, "Source/SHI/ShiCouncilStagingModel.cpp"), "utf8");
const councilFigure = await readFile(resolve(unreal, "Source/SHI/ShiCouncilFigure.cpp"), "utf8");
const cinematic = await readFile(resolve(unreal, "Source/SHI/ShiCinematicBeatModel.cpp"), "utf8");
const orderTransaction = await readFile(resolve(unreal, "Source/SHI/ShiOrderTransactionModel.cpp"), "utf8");
const engagementModel = await readFile(resolve(unreal, "Source/SHI/ShiEngagementModel.cpp"), "utf8");
const engagementSession = await readFile(resolve(unreal, "Source/SHI/ShiEngagementSession.cpp"), "utf8");
const gameMode = await readFile(resolve(unreal, "Source/SHI/ShiGameMode.cpp"), "utf8");
const screen = await readFile(resolve(unreal, "Source/SHI/ShiCommandScreen.cpp"), "utf8");
const automation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp"), "utf8");
const engagementAutomation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiEngagementAutomationTest.cpp"), "utf8");
const buildRules = await readFile(resolve(unreal, "Source/SHI/SHI.Build.cs"), "utf8");
const gameConfig = await readFile(resolve(unreal, "Config/DefaultGame.ini"), "utf8");
const engineConfig = await readFile(resolve(unreal, "Config/DefaultEngine.ini"), "utf8");
const pipeline = await readFile(resolve(root, "scripts/unreal-pipeline.sh"), "utf8");
for (const token of ["schema v7", "TimeIndex <=", "NextActIndex <", "StreamingAssets/chapter-01-daze.json", "StreamingAssets/editions.json", "initialResources", "nextNodeId", "commitments", "countermeasures", "characters", "speakerId", "FindCharacter", "ValidateEvidence", "public-link-metadata-only", "specialist-review-required"]) if (!model.includes(token)) errors.push(`Unreal model omits contract token: ${token}`);
for (const token of ["ApplyEffects(Choice->Effects)", "CommitmentOutcome->Effects", "Choice->PressureEffects", "Opposition->Effects", "MethodRead->Effects", "Condition->Effects", "SelectFieldCondition", "CanChoose", "ReplaySaveJson", "MoveTemp(Candidate)"]) if (!session.includes(token)) errors.push(`Unreal deterministic session omits contract token: ${token}`);
for (const token of ["project-original-procedural", "RequiredCues", "CreateRainSamples", "CreateCueSamples", "bDefaultEnabled"]) if (!audioModel.includes(token)) errors.push(`Unreal audio model omits contract token: ${token}`);
for (const token of ["FShiSoundGenerator", "CreateSoundGenerator", "PendingCues", "GGameUserSettingsIni", "FadeSeconds", "OutAudio[Frame * 2]", "OutAudio[Frame * 2 + 1]"]) if (!soundscape.includes(token)) errors.push(`Unreal soundscape omits render/persistence token: ${token}`);
for (const token of ["ProjectSite", "CameraTransform", "Cylinder.Cylinder", "Sphere.Sphere", "Cone.Cone", "Dist2D", "CycleSite", "TableHalfWidth", "TableHalfDepth"]) if (!wartable.includes(token)) errors.push(`Unreal wartable model omits spatial contract token: ${token}`);
for (const token of ["resource-grain", "layer-field", "layer-pursuit", "layer-method-read", "layer-commitment", "TableSurfaceZ", "MinimumPointerSpacing", "COUNTER WOULD HIT", "PURSUIT CLOSED · CAPTURED", "EXPOSURE 100 / 100", "SelectedStyle", "CameraTransform", "CycleSignal", "ValidateAgainstSites", "overlaps wartable site", "No carried promise currently awaits an answer."]) if (!commandSignals.includes(token)) errors.push(`Unreal command-signal model omits live-world contract token: ${token}`);
for (const token of ["speaker", "keeper", "HISTORICAL FIGURE · WORDS ARE AUTHORED DRAMATIZATION, NOT TRANSCRIPT", "FICTIONAL CHARACTER · PROJECT-AUTHORED DRAMATIC RECONSTRUCTION", "SpeakerCamera", "CouncilFieldOfViewDegrees", "FindParticipant", "SameParticipant", "cannot preserve canonical cast, disclosure, blocking and camera authorship", "OutStage = MoveTemp(Candidate)"]) if (!councilStaging.includes(token)) errors.push(`Unreal council staging omits cast/blocking/disclosure token: ${token}`);
for (const token of ["FigureRoot", "Body", "Head", "Mantle", "InitializeFigure", "ShiCharacter:", "ShiCouncilSpeaker", "SetMobility", "SetRenderCustomDepth", "SetCustomDepthStencilValue", "SetActorTransform"]) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits live performance-proxy token: ${token}`);
for (const token of ["resolution-order", "resolution-commitment", "resolution-pressure", "resolution-pursuit", "resolution-method-read", "resolution-field", "resolution-position", "MaximumSequenceSeconds", "MaximumEasedTranslation", "MaximumEasedRotationDegrees", "FieldOfViewForBeat", "CameraMotionBetween", "TEXT(\"cut\")", "TEXT(\"ease\")", "DominantResourceSignal", "EffectsSummary", "POSITION LOST", "OATH ESTABLISHED", "TotalDuration", "OutBeats = MoveTemp(BuiltBeats)"]) if (!cinematic.includes(token)) errors.push(`Unreal cinematic model omits resolution/motion-grammar token: ${token}`);
for (const token of ["BuildTurnSnapshot", "Candidate.Session = CurrentSession", "ResolveChoice", "ValidateAgainstSites", "FShiCouncilStagingModel::Build", "FShiCinematicBeatModel::Build", "SelectedChoiceIndex", "CouncilStage", "ExportSaveJson", "TransactionSave != ExpectedSave", "SameResolution", "SameSignals", "SameBeats", "SameCouncilStage", "OutTransaction = MoveTemp(Candidate)"]) if (!orderTransaction.includes(token)) errors.push(`Unreal order transaction omits fail-closed preflight token: ${token}`);
for (const token of ["StreamingAssets/chapter-01-broken-crossing.v1.json", "validated-shared-contract-not-campaign-authority", "dramatic-reconstruction", "crossingProgress", "signalIntegrity", "Every plan requires two legal options per pulse", "ordered best-to-unconditional-fallback", "Engagement claim sources are incomplete"]) if (!engagementModel.includes(token)) errors.push(`Unreal engagement model omits shared-contract token: ${token}`);
for (const token of ["ApplyMetricEffects", "AvailableCommands", "MeetsRequirements", "Completed engagement has no authored outcome", "plan, condition and command identifiers", "SameRecord", "Engagement save state diverges from identifier replay", "*this = MoveTemp(Candidate)"]) if (!engagementSession.includes(token)) errors.push(`Unreal engagement session omits deterministic/replay token: ${token}`);
if (!buildRules.includes('"AudioMixer"')) errors.push("Unreal runtime module does not depend on AudioMixer");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Engine/BasicShapes")')) errors.push("Unreal packaging does not cook the engine-native wartable assets loaded by path");
if (!engineConfig.includes("r.CustomDepth=3")) errors.push("Unreal renderer does not preserve the selected wartable marker stencil");
for (const token of ["prepare_external_directory", "SHI_UNREAL_DERIVED_DATA", "UE-LocalDataCachePath", "SHI_UNREAL_PACKAGE_ROOT", "must be a dedicated directory outside the Git repository", "-archivedirectory=\"$SHI_PACKAGE_ROOT\""]) if (!pipeline.includes(token)) errors.push(`Unreal pipeline omits outside-Git build/cache token: ${token}`);
if (pipeline.includes('archivedirectory="$SHI_REPO_ROOT/apps/unreal')) errors.push("Unreal Linux packaging still writes archives inside the Git worktree");
for (const token of ["RestoreChronicle", "SaveChronicle", "ForceUTF8WithoutBOM", "Gamepad_FaceButton_Bottom", "RequestNewChronicle", "CreateSoundscape", "ToggleSound", "Gamepad_FaceButton_Top", "ToggleEvidence", "Gamepad_LeftShoulder", "GetHitResultAtScreenPosition", "Gamepad_RightShoulder", "Gamepad_LeftThumbstick", "Gamepad_RightThumbstick", "RebuildCommandSignals", "FShiOrderTransactionModel::Build", "FShiOrderTransactionModel::BuildTurnSnapshot", "CanPresentCommandSignals", "CanPresentResolutionSequence", "CanPresentCouncilStage", "ApplyCouncilStage", "FocusCouncil", "CouncilFigures", "SaveChronicle(Transaction.Session", "Session = MoveTemp(Transaction.Session)", "SaveChronicle(CandidateSession", "Session = MoveTemp(CandidateSession)", "CURRENT CHRONICLE PRESERVED", "BeginPreparedResolutionSequence", "ORDER HELD", "StartCinematicBeat", "TickCinematicSequence", "SkipCinematicSequence", "Gamepad_FaceButton_Right", "Gamepad_Special_Right", "has no live world actor", "SetCameraImmediate", "SetFieldOfView", "CinematicHoldElapsed = -Beat->TransitionSeconds", "ToggleReducedMotion", "LoadCinematicPreferences", "SaveCinematicPreferences", "GGameUserSettingsIni", "ReducedMotion", "SetActorLocationAndRotation", "CameraTransitionElapsed = CameraTransitionDuration", "bReturningFromCommandSignal", "BeginCameraTransition", "FQuat::Slerp", "SetRenderCustomDepth", "ShiSite:", "ShiSignal:"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits persistence/input/audio/evidence/world-signal/cinematic-motion/transaction token: ${token}`);
if (gameMode.indexOf("SaveChronicle(Transaction.Session") > gameMode.indexOf("Session = MoveTemp(Transaction.Session)")) errors.push("Unreal order commit mutates memory before the candidate save is durable");
if (gameMode.indexOf("SaveChronicle(CandidateSession") > gameMode.indexOf("Session = MoveTemp(CandidateSession)")) errors.push("Unreal restart mutates memory before the replacement save is durable");
for (const token of ["SELECTED ORDER", "ISSUE ORDER", "ACT %d/%d", "SCENE %d/%d", "NEW CHRONICLE", "GAMEPAD A", "SOUND OFF", "RAIN −", "CUES −", "HISTORICAL BASIS", "EXACT LOCATOR", "SPECIALIST REVIEW REQUIRED", "OPEN PUBLIC EDITION", "WARTABLE FOCUS", "INTELLIGENCE ONLY · NOT A DESTINATION", "SHIFT REVERSES", "SPACE / B SKIPS CONSEQUENCE", "COMMAND SIGNAL", "READ-ONLY 3D TALLY", "CONSEQUENCE %d / %d", "CAMERA ONLY · THE GAMEPLAY RESULT IS ALREADY RESOLVED", "SKIP CONSEQUENCE CAMERA", "REDUCED MOTION · CUTS ONLY", "CAMERA MOTION · RESTRAINED", "V / MENU MOTION", "C / L3 SIGNALS", "RETURN TO COUNCIL", "COUNCIL SPEAKER", "D / R3", "CURRENT GROUND", "WhiteBrush"]) if (!screen.includes(token)) errors.push(`Unreal command screen omits interaction/evidence/world-signal/cinematic-motion/readability token: ${token}`);
if (screen.indexOf("TSharedRef<SVerticalBox> Root") > screen.indexOf("COMMAND SIGNAL")) errors.push("Unreal command-signal card is constructed before its Slate root exists");
for (const token of ["SHI.Wartable.SpatialIntelligenceV1", "Daze projection is deterministic", "overlapping pointer targets are rejected", "unsupported hindsight marker status is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits wartable contract token: ${token}`);
for (const token of ["SHI.CommandSpace.LiveSignalsV1", "five resources and four tactical layers are visible", "selected tally remains anchored", "captured terminal state has an exact pursuit-closed signal", "nonterminal state cannot omit its pursuit band", "the carried oath becomes a live world signal", "overlapping live command signals are rejected", "cross-family pointer overlap is rejected", "missing authoritative resources reject the signal snapshot", "failed signal rebuild is atomic"]) if (!automation.includes(token)) errors.push(`Unreal automation omits live command-signal token: ${token}`);
for (const token of ["SHI.Campaign.OrderTransactionV1", "order preflight never mutates the active chronicle", "resolution drift rejects the entire prepared transaction", "world drift rejects the entire prepared transaction", "cinematic drift rejects the entire prepared transaction", "post-order briefing drift rejects the entire prepared transaction", "extra hidden decision rejects the entire prepared transaction", "failed order transaction build is atomic", "active chronicle remains byte-identical after every attack", "preflight history is immutable", "full transaction revalidates"]) if (!automation.includes(token)) errors.push(`Unreal automation omits fail-closed order-transaction token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilStagingV1", "speaker and keeper occupy the scene", "historical dialogue is explicitly not a transcript", "Aunt Yu is never presented as a historical person", "cast identity drift is rejected", "dialogue drift is rejected", "unauthored dialogue camera drift is rejected", "failed council rebuild is atomic", "council staging drift rejects the entire prepared transaction", "prepared council follows position"]) if (!automation.includes(token)) errors.push(`Unreal automation omits canonical council-staging token: ${token}`);
for (const token of ["SHI.Cinematic.ResolutionGrammarV1", "opening sequence includes order, established oath, four response layers and position", "complete consequence sequence stays below five seconds", "first consequence shot cuts from unknowable prior inspection", "near pursuit-to-method translation uses one restrained ease", "pressure close reading has the narrowest authored lens", "position resolves through the widest authored lens", "cinematic cut/ease authorship cannot drift from spatial bounds", "cinematic lens grammar rejects disorienting drift", "cinematic planning never appends campaign history", "unbound cinematic world targets are rejected", "overlong cinematic shots are rejected", "cinematic layer reordering is rejected", "captured terminal position has a bounded consequence plan", "cinematic final resources must match resolution and world snapshots", "failed cinematic rebuild is atomic", "prepared world signal count"]) if (!automation.includes(token)) errors.push(`Unreal automation omits cinematic resolution/motion token: ${token}`);
for (const token of ["SHI.Engagement.BrokenCrossingParityV1", "native exhaustive traversal matches Web route count", "native exhaustive traversal matches Web viable count", "every authored outcome is reachable", "every authored command is reachable", "each field condition preserves at least two viable plans", "same command from the same state is deterministic", "copy resolution never mutates the source position", "engagement replay rejects an invented authored response", "failed replay cannot mutate the accepted engagement", "native model rejects premature campaign authority", "native model rejects campaign condition drift"]) if (!engagementAutomation.includes(token)) errors.push(`Unreal engagement automation omits parity/hostile token: ${token}`);

if (errors.length) {
  console.error(`Unreal project validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7/edition/audio/engagement staging, 46 campaign routes plus a native 76-route Broken Crossing parity boundary, deterministic save/replay, fail-closed durable-first order transactions with canonical council cast/blocking, source-claim ledger, bounded inspectable 3D wartable, live command signals and sub-five-second cut/ease/lens resolution cinema with persistent reduced motion, procedural soundscape, controls, command surface and automation boundary.`);
