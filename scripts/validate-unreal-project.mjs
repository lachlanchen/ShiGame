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
  "Source/SHI/ShiCommandSurfacePresentationModel.h", "Source/SHI/ShiCommandSurfacePresentationModel.cpp",
  "Source/SHI/ShiWetFieldEnvironmentPresentationModel.h", "Source/SHI/ShiWetFieldEnvironmentPresentationModel.cpp",
  "Source/SHI/ShiDazeFieldShelterPresentationModel.h", "Source/SHI/ShiDazeFieldShelterPresentationModel.cpp",
  "Source/SHI/ShiRainPresentationModel.h", "Source/SHI/ShiRainPresentationModel.cpp",
  "Source/SHI/ShiRainField.h", "Source/SHI/ShiRainField.cpp",
  "Source/SHI/ShiWetFieldVegetationPresentationModel.h", "Source/SHI/ShiWetFieldVegetationPresentationModel.cpp",
  "Source/SHI/ShiWetFieldVegetation.h", "Source/SHI/ShiWetFieldVegetation.cpp",
  "Source/SHI/ShiCommandWeightPresentationModel.h", "Source/SHI/ShiCommandWeightPresentationModel.cpp",
  "Source/SHI/ShiCouncilStagingModel.h", "Source/SHI/ShiCouncilStagingModel.cpp",
  "Source/SHI/ShiCouncilCharacterPresentationModel.h", "Source/SHI/ShiCouncilCharacterPresentationModel.cpp",
  "Source/SHI/ShiCouncilPerformancePresentationModel.h", "Source/SHI/ShiCouncilPerformancePresentationModel.cpp",
  "Source/SHI/ShiCouncilFacialPerformanceModel.h", "Source/SHI/ShiCouncilFacialPerformanceModel.cpp",
  "Source/SHI/ShiCouncilSkinLookdevModel.h", "Source/SHI/ShiCouncilSkinLookdevModel.cpp",
  "Source/SHI/ShiCouncilFigure.h", "Source/SHI/ShiCouncilFigure.cpp",
  "Source/SHI/ShiCinematicBeatModel.h", "Source/SHI/ShiCinematicBeatModel.cpp",
  "Source/SHI/ShiOrderTransactionModel.h", "Source/SHI/ShiOrderTransactionModel.cpp",
  "Source/SHI/ShiEngagementModel.h", "Source/SHI/ShiEngagementModel.cpp",
  "Source/SHI/ShiEngagementSession.h", "Source/SHI/ShiEngagementSession.cpp",
  "Source/SHI/ShiEngagementSignalModel.h", "Source/SHI/ShiEngagementSignalModel.cpp",
  "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Source/SHI/Private/Tests/ShiEngagementAutomationTest.cpp",
  "Source/SHI/Private/Tests/ShiCouncilSkinLookdevAutomationTest.cpp",
  "Source/SHIEditor/SHIEditor.Build.cs", "Source/SHIEditor/Private/SHIEditorModule.cpp",
  "Source/SHIEditor/Public/ShiAnimationImportLibrary.h", "Source/SHIEditor/Private/ShiAnimationImportLibrary.cpp",
  "Config/DefaultEngine.ini", "Config/DefaultGame.ini",
  "Content/SHI/Art/Props/CommandWeight/M_SHI_RiverStone.uasset",
  "Content/SHI/Art/Props/CommandWeight/M_SHI_WorkedBronze.uasset",
  "Content/SHI/Art/Props/CommandWeight/SM_SHI_CommandWeight_01.uasset",
  "Content/SHI/Art/Environment/CommandSurface/M_SHI_DarkWorkedWood.uasset",
  "Content/SHI/Art/Environment/CommandSurface/M_SHI_WetPackedEarth.uasset",
  "Content/SHI/Art/Environment/CommandSurface/SM_SHI_CommandSurface_01.uasset",
  "Content/SHI/Art/Environment/WetField/M_SHI_WetFieldGround.uasset",
  "Content/SHI/Art/Environment/WetField/M_SHI_ShallowRainwater.uasset",
  "Content/SHI/Art/Environment/WetField/SM_SHI_WetFieldEnvironment_01.uasset",
  "Content/SHI/Art/Environment/DazeShelter/M_SHI_RainDarkenedWood.uasset",
  "Content/SHI/Art/Environment/DazeShelter/M_SHI_WovenReedMat.uasset",
  "Content/SHI/Art/Environment/DazeShelter/M_SHI_CoarseFiberCord.uasset",
  "Content/SHI/Art/Environment/DazeShelter/SM_SHI_DazeFieldShelter_01.uasset",
  "Content/SHI/Art/VFX/DazeRain/M_SHI_RainRipple.uasset",
  "Content/SHI/Art/VFX/DazeRain/M_SHI_RainStreak.uasset",
  "Content/SHI/Art/VFX/DazeRain/SM_SHI_RainRipple_01.uasset",
  "Content/SHI/Art/VFX/DazeRain/SM_SHI_RainStreak_01.uasset",
  "Content/SHI/Art/Environment/WetFieldVegetation/M_SHI_RainDarkenedFieldPlant.uasset",
  "Content/SHI/Art/Environment/WetFieldVegetation/SM_SHI_FieldStalkClump_01.uasset",
  "Content/SHI/Art/Environment/WetFieldVegetation/SM_SHI_LowBladeTuft_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SKM_SHI_DazeCouncil_Keeper_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SKM_SHI_DazeCouncil_ChenSheng_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SKM_SHI_DazeCouncil_WuGuang_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SKM_SHI_DazeCouncil_YuMu_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/SKM_SHI_DazeCouncil_QinCourier_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_Character_SkinClay.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_Character_HairClay.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_Character_BindingClay.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_Character_RolePropClay.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_keeper_ClothBase.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_keeper_ClothOuter.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_chen-sheng_ClothBase.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_chen-sheng_ClothOuter.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_wu-guang_ClothBase.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_wu-guang_ClothOuter.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_yu-mu_ClothBase.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_yu-mu_ClothOuter.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_qin-courier_ClothBase.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/M_SHI_qin-courier_ClothOuter.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/Performance/AN_SHI_DazeCouncil_AttentiveIdle_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncil/Performance/AN_SHI_DazeCouncil_SpeakerMeasured_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_Keeper_Facial_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_WuGuang_Facial_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_YuMu_Facial_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_QinCourier_Facial_01.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/M_SHI_Character_EyeBrown.uasset",
  "Content/SHI/Art/Characters/DazeCouncilFacial/T_SHI_Character_EyeBrown_CC0.uasset",
  "Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1/M_SHI_ChenSheng_SkinLookdevV1.uasset",
  "Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1/SP_SHI_ChenSheng_SkinLookdevV1.uasset",
  "Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_BaseColor_2K.uasset",
  "Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_DetailNormal_1K.uasset",
  "Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_Masks_2K.uasset",
  "Content/StreamingAssets/chapter-01-daze.json", "Content/StreamingAssets/chapter-01-audio.json",
  "Content/StreamingAssets/chapter-01-broken-crossing.v1.json",
  "Content/StreamingAssets/chapter-01-replays.v1.json", "Content/StreamingAssets/editions.json",
];

for (const relative of required) {
  try { await access(resolve(unreal, relative), constants.R_OK); } catch { errors.push(`missing Unreal project file: ${relative}`); }
}

const commandWeightProvenancePath = resolve(root, "assets/provenance/shi-command-weight-v1.json");
const commandWeightImportEvidencePath = resolve(root, "docs/production/evidence/unreal-command-weight-import-status.json");
const commandWeightPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-command-weight-presentation-status.json");
const commandWeightProvenance = JSON.parse(await readFile(commandWeightProvenancePath, "utf8"));
const commandWeightImportEvidence = JSON.parse(await readFile(commandWeightImportEvidencePath, "utf8"));
const commandWeightPresentationEvidence = JSON.parse(await readFile(commandWeightPresentationEvidencePath, "utf8"));
const commandWeightPresentationDecision = "approved-engine-production-blockout-presented-authored-materials-not-final-art";
if (commandWeightProvenance.assetId !== "shi-command-weight-v1" || commandWeightProvenance.status !== commandWeightPresentationDecision)
  errors.push("Unreal command-weight provenance does not preserve its bounded runtime-presented blockout decision");
if (commandWeightImportEvidence.assetId !== "shi-command-weight-v1" || commandWeightImportEvidence.decision !== "approved-engine-production-blockout-packaged-not-final-art")
  errors.push("Unreal command-weight admission evidence is missing or overstates its decision");
if (commandWeightPresentationEvidence.assetId !== "shi-command-weight-v1" || commandWeightPresentationEvidence.decision !== commandWeightPresentationDecision)
  errors.push("Unreal command-weight presentation evidence is missing or overstates its bounded decision");
for (const output of commandWeightProvenance.outputs ?? []) {
  const file = resolve(root, "assets/provenance", output.file);
  try {
    const bytes = await readFile(file);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== output.bytes) errors.push(`command-weight provenance byte count drifted: ${output.file}`);
    if (sha256 !== output.sha256) errors.push(`command-weight provenance hash drifted: ${output.file}`);
  } catch {
    errors.push(`command-weight provenance output is missing: ${output.file}`);
  }
}
for (const tool of [commandWeightProvenance.toolchain?.generator, commandWeightProvenance.toolchain?.validator, commandWeightProvenance.toolchain?.unrealImporter, commandWeightProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("command-weight provenance omits a generator, validator, Unreal importer or Unreal material-author receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256) errors.push(`command-weight tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`command-weight provenance tool is missing: ${tool.file}`);
  }
}
const importedMeshReceipt = (commandWeightImportEvidence.trackedUnrealAssets ?? []).find((asset) => asset.file.endsWith("/SM_SHI_CommandWeight_01.uasset"));
for (const asset of importedMeshReceipt ? [importedMeshReceipt] : []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== asset.bytes || sha256 !== asset.sha256) errors.push(`tracked Unreal command-weight receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal command-weight asset is missing: ${asset.file}`);
  }
}
if (!importedMeshReceipt) errors.push("Unreal command-weight import evidence omits the immutable static-mesh receipt");
if (commandWeightImportEvidence.trackedUnrealAssets?.length !== 3) errors.push("Unreal command-weight import evidence does not retain its three original import receipts");
if (!commandWeightImportEvidence.import?.passed || commandWeightImportEvidence.import?.lodTriangles?.join(",") !== "3256,1384" || commandWeightImportEvidence.import?.lodUvChannels?.join(",") !== "2,2" || commandWeightImportEvidence.import?.convexCollisionCount !== 1)
  errors.push("Unreal command-weight import evidence omits the accepted LOD, UV or collision boundary");
if (commandWeightImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only" || commandWeightImportEvidence.import?.readOnlyInspection?.exitCode !== 0 || !commandWeightImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged)
  errors.push("Unreal command-weight inspection is not proven read-only");
if (commandWeightImportEvidence.package?.packageCount !== 499 || commandWeightImportEvidence.package?.addedPackageCount !== 3 || commandWeightImportEvidence.package?.cookedEntries?.length !== 4)
  errors.push("Unreal command-weight package evidence does not preserve the 499-package three-asset admission");
if (commandWeightImportEvidence.smokeTest?.exitCode !== 0 || commandWeightImportEvidence.smokeTest?.gameMode !== "ShiGameMode" || commandWeightImportEvidence.smokeTest?.mountedIoStorePackages !== 499)
  errors.push("Unreal command-weight package smoke evidence is incomplete");
for (const screenshot of commandWeightPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== screenshot.bytes || sha256 !== screenshot.sha256) errors.push(`command-weight presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`command-weight presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (commandWeightPresentationEvidence.screenshots?.length !== 4)
  errors.push("Unreal command-weight presentation evidence must retain council, front, back and story/performance views");
if (commandWeightPresentationEvidence.materials?.readOnlyInspection?.mode !== "inspect-only"
    || commandWeightPresentationEvidence.materials?.readOnlyInspection?.exitCode !== 0
    || !commandWeightPresentationEvidence.materials?.readOnlyInspection?.passed
    || !commandWeightPresentationEvidence.materials?.readOnlyInspection?.trackedUassetHashesUnchanged
    || commandWeightPresentationEvidence.materials?.stone?.nodeCount !== 10
    || commandWeightPresentationEvidence.materials?.bronze?.nodeCount !== 14)
  errors.push("Unreal command-weight authored-material inspection is incomplete");
if (commandWeightPresentationEvidence.presentation?.councilFieldOfViewDegrees !== 44
    || commandWeightPresentationEvidence.presentation?.minimumInspectableMarkerClearanceCentimeters !== 62
    || commandWeightPresentationEvidence.presentation?.interactive !== false
    || commandWeightPresentationEvidence.presentation?.collision !== false
    || commandWeightPresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== false)
  errors.push("Unreal command-weight presentation evidence violates its bounded non-authoritative council contract");
if (commandWeightPresentationEvidence.automation?.discovered !== 12 || commandWeightPresentationEvidence.automation?.passed !== 12
    || commandWeightPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.CommandWeightPresentationV1")
  errors.push("Unreal command-weight presentation automation receipt is incomplete");
if (commandWeightPresentationEvidence.package?.packageCount !== 499 || commandWeightPresentationEvidence.package?.result !== "BUILD SUCCESSFUL"
    || commandWeightPresentationEvidence.smokeTest?.exitCode !== 0 || !commandWeightPresentationEvidence.visiblePlaytest?.storyAdvanced)
  errors.push("Unreal command-weight final package, smoke or visible story-progression evidence is incomplete");

const commandSurfaceProvenancePath = resolve(root, "assets/provenance/shi-command-surface-v1.json");
const commandSurfaceImportEvidencePath = resolve(root, "docs/production/evidence/unreal-command-surface-import-status.json");
const commandSurfacePresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-command-surface-presentation-status.json");
const commandSurfaceProvenance = JSON.parse(await readFile(commandSurfaceProvenancePath, "utf8"));
const commandSurfaceImportEvidence = JSON.parse(await readFile(commandSurfaceImportEvidencePath, "utf8"));
const commandSurfacePresentationEvidence = JSON.parse(await readFile(commandSurfacePresentationEvidencePath, "utf8"));
const commandSurfaceDecision = "approved-runtime-command-surface-production-blockout-council-engagement-story-reviewed-not-final-environment";
if (commandSurfaceProvenance.assetId !== "shi-command-surface-v1" || commandSurfaceProvenance.status !== commandSurfaceDecision)
  errors.push("Unreal command-surface provenance does not preserve its bounded runtime blockout decision");
if (commandSurfaceImportEvidence.decision !== "approved-engine-command-surface-production-blockout-packaged-not-final-environment")
  errors.push("Unreal command-surface import evidence is missing or overstates final-environment approval");
if (commandSurfacePresentationEvidence.decision !== commandSurfaceDecision)
  errors.push("Unreal command-surface presentation evidence is missing or overstates final-environment approval");
for (const output of commandSurfaceProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== output.bytes || hash !== output.sha256)
      errors.push(`command-surface provenance receipt drifted: ${output.file}`);
  } catch {
    errors.push(`command-surface provenance output is missing: ${output.file}`);
  }
}
for (const tool of [commandSurfaceProvenance.toolchain?.generator, commandSurfaceProvenance.toolchain?.validator,
  commandSurfaceProvenance.toolchain?.unrealImporter, commandSurfaceProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("command-surface provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`command-surface tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`command-surface provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of commandSurfaceImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal command-surface receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal command-surface asset is missing: ${asset.file}`);
  }
}
if (commandSurfaceImportEvidence.trackedUnrealAssets?.length !== 3
    || commandSurfaceImportEvidence.import?.lodTriangles?.join(",") !== "620,60"
    || commandSurfaceImportEvidence.import?.lodUvChannels?.join(",") !== "2,2"
    || commandSurfaceImportEvidence.import?.lodScreenSizes?.length !== 2
    || commandSurfaceImportEvidence.import?.convexCollisionCount !== 1
    || commandSurfaceImportEvidence.import?.naniteEnabled !== false
    || commandSurfaceImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only"
    || !commandSurfaceImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged)
  errors.push("Unreal command-surface mesh/import receipt is incomplete");
if (commandSurfaceImportEvidence.package?.packageCount !== 502
    || commandSurfaceImportEvidence.package?.addedPackageCount !== 3
    || commandSurfaceImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || commandSurfaceImportEvidence.smokeTest?.exitCode !== 0)
  errors.push("Unreal command-surface package or smoke receipt is incomplete");
for (const screenshot of commandSurfacePresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`command-surface presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`command-surface presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (commandSurfacePresentationEvidence.screenshots?.length !== 3
    || commandSurfacePresentationEvidence.materials?.wetPackedEarth?.nodeCount !== 10
    || commandSurfacePresentationEvidence.materials?.darkWorkedWood?.nodeCount !== 10
    || commandSurfacePresentationEvidence.materials?.readOnlyInspection?.mode !== "inspect-only"
    || !commandSurfacePresentationEvidence.materials?.readOnlyInspection?.trackedUassetHashesUnchanged
    || commandSurfacePresentationEvidence.presentation?.interactive !== false
    || commandSurfacePresentationEvidence.presentation?.runtimeCollision !== false
    || commandSurfacePresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== true
    || commandSurfacePresentationEvidence.automation?.discovered !== 13
    || commandSurfacePresentationEvidence.automation?.passed !== 13
    || !commandSurfacePresentationEvidence.visiblePlaytest?.storyAdvanced
    || !commandSurfacePresentationEvidence.visiblePlaytest?.engagementAdvanced
    || !commandSurfacePresentationEvidence.visiblePlaytest?.campaignUnchangedByEngagement)
  errors.push("Unreal command-surface material, runtime, automation or visible-play receipt is incomplete");

const wetFieldProvenancePath = resolve(root, "assets/provenance/shi-wet-field-environment-v1.json");
const wetFieldImportEvidencePath = resolve(root, "docs/production/evidence/unreal-wet-field-environment-import-status.json");
const wetFieldPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-wet-field-environment-presentation-status.json");
const wetFieldProvenance = JSON.parse(await readFile(wetFieldProvenancePath, "utf8"));
const wetFieldImportEvidence = JSON.parse(await readFile(wetFieldImportEvidencePath, "utf8"));
const wetFieldPresentationEvidence = JSON.parse(await readFile(wetFieldPresentationEvidencePath, "utf8"));
const wetFieldDecision = "approved-runtime-wet-field-production-blockout-council-engagement-story-reviewed-not-final-environment";
if (wetFieldProvenance.assetId !== "shi-wet-field-environment-v1" || wetFieldProvenance.status !== wetFieldDecision)
  errors.push("Unreal wet-field provenance does not preserve its bounded runtime blockout decision");
if (wetFieldImportEvidence.decision !== "approved-engine-wet-field-production-blockout-packaged-not-final-environment")
  errors.push("Unreal wet-field import evidence is missing or overstates final-environment approval");
if (wetFieldPresentationEvidence.decision !== wetFieldDecision)
  errors.push("Unreal wet-field presentation evidence is missing or overstates final-environment approval");
for (const output of wetFieldProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== output.bytes || hash !== output.sha256)
      errors.push(`wet-field provenance receipt drifted: ${output.file}`);
  } catch {
    errors.push(`wet-field provenance output is missing: ${output.file}`);
  }
}
for (const tool of [wetFieldProvenance.toolchain?.generator, wetFieldProvenance.toolchain?.validator,
  wetFieldProvenance.toolchain?.unrealImporter, wetFieldProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("wet-field provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`wet-field tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`wet-field provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of wetFieldImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal wet-field receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal wet-field asset is missing: ${asset.file}`);
  }
}
if (wetFieldImportEvidence.trackedUnrealAssets?.length !== 3
    || wetFieldImportEvidence.import?.passed !== true
    || wetFieldImportEvidence.import?.lodTriangles?.join(",") !== "9120,2492"
    || wetFieldImportEvidence.import?.lodVertices?.join(",") !== "5480,1662"
    || wetFieldImportEvidence.import?.lodUvChannels?.join(",") !== "2,2"
    || wetFieldImportEvidence.import?.lodScreenSizes?.length !== 2
    || wetFieldImportEvidence.import?.materialSlots?.join(",") !== "M_SHI_WetFieldGround,M_SHI_ShallowRainwater"
    || wetFieldImportEvidence.import?.simpleCollisionCount !== 0
    || wetFieldImportEvidence.import?.convexCollisionCount !== 1
    || wetFieldImportEvidence.import?.lightMapResolution !== 256
    || wetFieldImportEvidence.import?.lightMapCoordinateIndex !== 1
    || wetFieldImportEvidence.import?.naniteEnabled !== false
    || wetFieldImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only"
    || wetFieldImportEvidence.import?.readOnlyInspection?.exitCode !== 0
    || !wetFieldImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged)
  errors.push("Unreal wet-field mesh/import receipt is incomplete");
const wetFieldMin = wetFieldImportEvidence.import?.boundsCentimeters?.minimum ?? [];
const wetFieldMax = wetFieldImportEvidence.import?.boundsCentimeters?.maximum ?? [];
if (wetFieldMin.length !== 3 || wetFieldMax.length !== 3
    || Math.abs(wetFieldMin[0] + 1200) > 0.001 || Math.abs(wetFieldMin[1] + 1200) > 0.001
    || Math.abs(wetFieldMin[2] + 32) > 0.001 || Math.abs(wetFieldMax[0] - 1200) > 0.001
    || Math.abs(wetFieldMax[1] - 1200) > 0.001 || Math.abs(wetFieldMax[2] + 7.6) > 0.001)
  errors.push("Unreal wet-field exact admitted bounds drifted");
if (wetFieldImportEvidence.package?.packageCount !== 505
    || wetFieldImportEvidence.package?.priorAcceptedPackageCount !== 502
    || wetFieldImportEvidence.package?.addedPackageCount !== 3
    || wetFieldImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || wetFieldImportEvidence.package?.artifacts?.length !== 4
    || wetFieldImportEvidence.smokeTest?.exitCode !== 0
    || wetFieldImportEvidence.smokeTest?.containerPackageCount !== 505
    || wetFieldImportEvidence.smokeTest?.gameMode !== "ShiGameMode")
  errors.push("Unreal wet-field package or smoke receipt is incomplete");
for (const screenshot of wetFieldPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`wet-field presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`wet-field presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (wetFieldPresentationEvidence.screenshots?.length !== 7
    || wetFieldPresentationEvidence.materials?.wetFieldGround?.nodeCount !== 15
    || wetFieldPresentationEvidence.materials?.shallowRainwater?.nodeCount !== 5
    || wetFieldPresentationEvidence.materials?.readOnlyInspection?.mode !== "inspect-only"
    || wetFieldPresentationEvidence.materials?.readOnlyInspection?.exitCode !== 0
    || !wetFieldPresentationEvidence.materials?.readOnlyInspection?.passed
    || !wetFieldPresentationEvidence.materials?.readOnlyInspection?.trackedUassetHashesUnchanged
    || wetFieldPresentationEvidence.presentation?.interactive !== false
    || wetFieldPresentationEvidence.presentation?.runtimeCollision !== false
    || wetFieldPresentationEvidence.presentation?.navigationInfluence !== false
    || wetFieldPresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== true
    || wetFieldPresentationEvidence.presentation?.minimumRequiredCommandSurfaceClearanceCentimeters !== 4
    || Math.abs((wetFieldPresentationEvidence.presentation?.observedCommandSurfaceClearanceCentimeters ?? 0) - 5.599975109100342) > 0.001
    || wetFieldPresentationEvidence.presentation?.developmentReview?.fieldOfViewDegrees !== 52
    || wetFieldPresentationEvidence.presentation?.developmentReview?.exposureCompensation !== -1.5
    || wetFieldPresentationEvidence.automation?.discovered !== 14
    || wetFieldPresentationEvidence.automation?.passed !== 14
    || wetFieldPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.WetFieldEnvironmentPresentationV1"
    || !wetFieldPresentationEvidence.visiblePlaytest?.storyAdvanced
    || !wetFieldPresentationEvidence.visiblePlaytest?.engagementAdvanced
    || !wetFieldPresentationEvidence.visiblePlaytest?.engagementCompleted
    || !wetFieldPresentationEvidence.visiblePlaytest?.campaignUnchangedByEngagement)
  errors.push("Unreal wet-field material, runtime, automation or visible-play receipt is incomplete");

const shelterProvenancePath = resolve(root, "assets/provenance/shi-daze-field-shelter-v1.json");
const shelterImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-field-shelter-import-status.json");
const shelterPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-field-shelter-presentation-status.json");
const shelterProvenance = JSON.parse(await readFile(shelterProvenancePath, "utf8"));
const shelterImportEvidence = JSON.parse(await readFile(shelterImportEvidencePath, "utf8"));
const shelterPresentationEvidence = JSON.parse(await readFile(shelterPresentationEvidencePath, "utf8"));
const shelterDecision = "approved-runtime-daze-field-shelter-production-blockout-council-engagement-story-reviewed-not-final-environment";
if (shelterProvenance.assetId !== "shi-daze-field-shelter-v1" || shelterProvenance.status !== shelterDecision)
  errors.push("Unreal Daze-shelter provenance does not preserve its bounded runtime blockout decision");
if (shelterImportEvidence.decision !== "approved-engine-daze-field-shelter-production-blockout-packaged-not-final-environment")
  errors.push("Unreal Daze-shelter import evidence is missing or overstates final-environment approval");
if (shelterPresentationEvidence.decision !== shelterDecision)
  errors.push("Unreal Daze-shelter presentation evidence is missing or overstates final-environment approval");
for (const output of shelterProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (bytes.byteLength !== output.bytes || hash !== output.sha256)
      errors.push(`Daze-shelter provenance receipt drifted: ${output.file}`);
  } catch {
    errors.push(`Daze-shelter provenance output is missing: ${output.file}`);
  }
}
for (const tool of [shelterProvenance.toolchain?.generator, shelterProvenance.toolchain?.validator,
  shelterProvenance.toolchain?.unrealImporter, shelterProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("Daze-shelter provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`Daze-shelter tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`Daze-shelter provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of shelterImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal Daze-shelter receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal Daze-shelter asset is missing: ${asset.file}`);
  }
}
if (shelterImportEvidence.trackedUnrealAssets?.length !== 4
    || shelterImportEvidence.import?.passed !== true
    || shelterImportEvidence.import?.lodTriangles?.join(",") !== "3948,460"
    || shelterImportEvidence.import?.lodVertices?.join(",") !== "8589,712"
    || shelterImportEvidence.import?.lodUvChannels?.join(",") !== "2,2"
    || shelterImportEvidence.import?.lodScreenSizes?.length !== 2
    || shelterImportEvidence.import?.materialSlots?.join(",") !== "M_SHI_RainDarkenedWood,M_SHI_WovenReedMat,M_SHI_CoarseFiberCord"
    || shelterImportEvidence.import?.simpleCollisionCount !== 0
    || shelterImportEvidence.import?.convexCollisionCount !== 0
    || shelterImportEvidence.import?.lightMapResolution !== 256
    || shelterImportEvidence.import?.lightMapCoordinateIndex !== 1
    || shelterImportEvidence.import?.naniteEnabled !== false
    || shelterImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only"
    || shelterImportEvidence.import?.readOnlyInspection?.exitCode !== 0
    || !shelterImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged)
  errors.push("Unreal Daze-shelter mesh/import receipt is incomplete");
const shelterMin = shelterImportEvidence.import?.boundsCentimeters?.minimum ?? [];
const shelterMax = shelterImportEvidence.import?.boundsCentimeters?.maximum ?? [];
if (shelterMin.length !== 3 || shelterMax.length !== 3
    || Math.abs(shelterMin[0] + 420) > 0.001 || Math.abs(shelterMin[1] + 336.7437) > 0.001
    || Math.abs(shelterMin[2] + 18) > 0.001 || Math.abs(shelterMax[0] - 420) > 0.001
    || Math.abs(shelterMax[1] - 336.7437) > 0.001 || Math.abs(shelterMax[2] - 337) > 0.001)
  errors.push("Unreal Daze-shelter exact admitted bounds drifted");
if (shelterImportEvidence.package?.packageCount !== 509
    || shelterImportEvidence.package?.priorAcceptedPackageCount !== 505
    || shelterImportEvidence.package?.addedPackageCount !== 4
    || shelterImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || shelterImportEvidence.package?.cookedEntries?.length !== 5
    || shelterImportEvidence.package?.artifacts?.length !== 4
    || shelterImportEvidence.smokeTest?.exitCode !== 0
    || shelterImportEvidence.smokeTest?.containerPackageCount !== 509
    || shelterImportEvidence.smokeTest?.assetRegistryNewPackages !== 509
    || shelterImportEvidence.smokeTest?.gameMode !== "ShiGameMode")
  errors.push("Unreal Daze-shelter package, cooked-container or smoke receipt is incomplete");
for (const screenshot of shelterPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`Daze-shelter presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`Daze-shelter presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (shelterPresentationEvidence.screenshots?.length !== 4
    || shelterPresentationEvidence.materials?.rainDarkenedWood?.nodeCount !== 8
    || shelterPresentationEvidence.materials?.wovenReedMat?.nodeCount !== 11
    || shelterPresentationEvidence.materials?.coarseFiberCord?.nodeCount !== 8
    || shelterPresentationEvidence.materials?.readOnlyInspection?.mode !== "inspect-only"
    || shelterPresentationEvidence.materials?.readOnlyInspection?.exitCode !== 0
    || !shelterPresentationEvidence.materials?.readOnlyInspection?.passed
    || !shelterPresentationEvidence.materials?.readOnlyInspection?.trackedUassetHashesUnchanged
    || shelterPresentationEvidence.presentation?.historicallyAttested !== false
    || shelterPresentationEvidence.presentation?.finalArt !== false
    || shelterPresentationEvidence.presentation?.interactive !== false
    || shelterPresentationEvidence.presentation?.runtimeCollision !== false
    || shelterPresentationEvidence.presentation?.navigationInfluence !== false
    || shelterPresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== true
    || shelterPresentationEvidence.presentation?.minimumPostClearanceBeyondCommandSurfaceAxesCentimeters !== 50
    || shelterPresentationEvidence.presentation?.minimumEaveHeightCentimeters !== 278
    || shelterPresentationEvidence.presentation?.maximumAllowedStructureHeightCentimeters !== 345
    || shelterPresentationEvidence.presentation?.developmentReview?.fieldOfViewDegrees !== 52
    || shelterPresentationEvidence.automation?.discovered !== 15
    || shelterPresentationEvidence.automation?.passed !== 15
    || shelterPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.DazeFieldShelterPresentationV1"
    || !shelterPresentationEvidence.visiblePlaytest?.storyAdvanced
    || !shelterPresentationEvidence.visiblePlaytest?.engagementAdvanced
    || !shelterPresentationEvidence.visiblePlaytest?.engagementCompleted
    || !shelterPresentationEvidence.visiblePlaytest?.campaignUnchangedByEngagement
    || !shelterPresentationEvidence.visiblePlaytest?.shelterVisibleDuringEngagement)
  errors.push("Unreal Daze-shelter material, disclosure, runtime, automation or visible-play receipt is incomplete");

const rainProvenancePath = resolve(root, "assets/provenance/shi-daze-rain-vfx-v1.json");
const rainImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-rain-import-status.json");
const rainPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-rain-presentation-status.json");
const rainProvenance = JSON.parse(await readFile(rainProvenancePath, "utf8"));
const rainImportEvidence = JSON.parse(await readFile(rainImportEvidencePath, "utf8"));
const rainPresentationEvidence = JSON.parse(await readFile(rainPresentationEvidencePath, "utf8"));
const rainDecision = "approved-runtime-daze-rain-production-vfx-blockout-council-engagement-story-reviewed-not-final-environment";
if (rainProvenance.assetId !== "shi-daze-rain-vfx-v1" || rainProvenance.status !== rainDecision)
  errors.push("Unreal Daze-rain provenance does not preserve its bounded runtime VFX-blockout decision");
if (rainImportEvidence.decision !== "approved-engine-daze-rain-production-vfx-blockout-packaged-not-final-environment")
  errors.push("Unreal Daze-rain import evidence is missing or overstates final-environment approval");
if (rainPresentationEvidence.decision !== rainDecision)
  errors.push("Unreal Daze-rain presentation evidence is missing or overstates final-environment approval");
for (const output of rainProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    if (bytes.byteLength !== output.bytes || createHash("sha256").update(bytes).digest("hex") !== output.sha256)
      errors.push(`Daze-rain provenance receipt drifted: ${output.file}`);
  } catch {
    errors.push(`Daze-rain provenance output is missing: ${output.file}`);
  }
}
for (const tool of [rainProvenance.toolchain?.generator, rainProvenance.toolchain?.validator,
  rainProvenance.toolchain?.unrealImporter, rainProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("Daze-rain provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`Daze-rain tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`Daze-rain provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of rainImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal Daze-rain receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal Daze-rain asset is missing: ${asset.file}`);
  }
}
const rainStreakImport = rainImportEvidence.import?.streak;
const rainRippleImport = rainImportEvidence.import?.ripple;
if (rainImportEvidence.trackedUnrealAssets?.length !== 4
    || rainImportEvidence.import?.passed !== true
    || rainImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only"
    || rainImportEvidence.import?.readOnlyInspection?.exitCode !== 0
    || !rainImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged
    || rainStreakImport?.lodTriangles?.join(",") !== "12,6"
    || rainRippleImport?.lodTriangles?.join(",") !== "288,64"
    || rainStreakImport?.lodUvChannels?.join(",") !== "2,2"
    || rainRippleImport?.lodUvChannels?.join(",") !== "2,2"
    || rainStreakImport?.materialSlot !== "M_SHI_RainStreak"
    || rainRippleImport?.materialSlot !== "M_SHI_RainRipple"
    || rainStreakImport?.simpleCollisionCount !== 0 || rainStreakImport?.convexCollisionCount !== 0
    || rainRippleImport?.simpleCollisionCount !== 0 || rainRippleImport?.convexCollisionCount !== 0
    || rainStreakImport?.lightMapResolution !== 64 || rainRippleImport?.lightMapResolution !== 64
    || rainStreakImport?.lightMapCoordinateIndex !== 1 || rainRippleImport?.lightMapCoordinateIndex !== 1
    || rainStreakImport?.naniteEnabled !== false || rainRippleImport?.naniteEnabled !== false)
  errors.push("Unreal Daze-rain mesh/import receipt is incomplete");
const rainStreakMin = rainStreakImport?.boundsCentimeters?.minimum ?? [];
const rainStreakMax = rainStreakImport?.boundsCentimeters?.maximum ?? [];
const rainRippleMin = rainRippleImport?.boundsCentimeters?.minimum ?? [];
const rainRippleMax = rainRippleImport?.boundsCentimeters?.maximum ?? [];
if (rainStreakMin.length !== 3 || rainStreakMax.length !== 3
    || Math.abs(rainStreakMin[0] + .6) > .001 || Math.abs(rainStreakMin[1] + .6) > .001
    || Math.abs(rainStreakMin[2]) > .001 || Math.abs(rainStreakMax[0] - .6) > .001
    || Math.abs(rainStreakMax[1] - .6) > .001 || Math.abs(rainStreakMax[2] - 100) > .001
    || rainRippleMin.length !== 3 || rainRippleMax.length !== 3
    || Math.abs(rainRippleMin[0] + 50) > .001 || Math.abs(rainRippleMin[1] + 50) > .001
    || Math.abs(rainRippleMin[2]) > .001 || Math.abs(rainRippleMax[0] - 50) > .001
    || Math.abs(rainRippleMax[1] - 50) > .001 || Math.abs(rainRippleMax[2]) > .001)
  errors.push("Unreal Daze-rain exact admitted bounds drifted");
if (rainImportEvidence.package?.packageCount !== 513
    || rainImportEvidence.package?.priorAcceptedPackageCount !== 509
    || rainImportEvidence.package?.addedPackageCount !== 4
    || rainImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || rainImportEvidence.package?.cookedEntries?.length !== 4
    || rainImportEvidence.package?.artifacts?.length !== 4
    || rainImportEvidence.smokeTest?.exitCode !== 0
    || rainImportEvidence.smokeTest?.containerPackageCount !== 513
    || rainImportEvidence.smokeTest?.gameMode !== "ShiGameMode"
    || rainImportEvidence.smokeTest?.materialOrLoadWarnings !== 0)
  errors.push("Unreal Daze-rain package, cooked-container or smoke receipt is incomplete");
for (const screenshot of rainPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`Daze-rain presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`Daze-rain presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (rainPresentationEvidence.screenshots?.length !== 4
    || rainPresentationEvidence.materials?.streak?.nodeCount !== 6
    || rainPresentationEvidence.materials?.ripple?.nodeCount !== 6
    || rainPresentationEvidence.materials?.streak?.usedWithInstancedStaticMeshes !== true
    || rainPresentationEvidence.materials?.ripple?.usedWithInstancedStaticMeshes !== true
    || rainPresentationEvidence.materials?.readOnlyInspection?.mode !== "inspect-only"
    || rainPresentationEvidence.materials?.readOnlyInspection?.exitCode !== 0
    || !rainPresentationEvidence.materials?.readOnlyInspection?.passed
    || !rainPresentationEvidence.materials?.readOnlyInspection?.trackedUassetHashesUnchanged
    || rainPresentationEvidence.presentation?.streakInstances !== 384
    || rainPresentationEvidence.presentation?.ripplePoolInstances !== 72
    || rainPresentationEvidence.presentation?.fieldHalfExtentCentimeters !== 1200
    || rainPresentationEvidence.presentation?.shelterRoofInterceptCentimeters !== 340
    || rainPresentationEvidence.presentation?.deterministicSeed !== 0x5EED209
    || rainPresentationEvidence.presentation?.historicallyExactWeather !== false
    || rainPresentationEvidence.presentation?.finalArt !== false
    || rainPresentationEvidence.presentation?.interactive !== false
    || rainPresentationEvidence.presentation?.runtimeCollision !== false
    || rainPresentationEvidence.presentation?.navigationInfluence !== false
    || rainPresentationEvidence.presentation?.gameplayAuthority !== false
    || rainPresentationEvidence.presentation?.saveAuthority !== false
    || rainPresentationEvidence.presentation?.audioIndependent !== true
    || rainPresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== true
    || rainPresentationEvidence.presentation?.groundRipplesUnderShelter !== false
    || rainPresentationEvidence.presentation?.developmentReview?.fieldOfViewDegrees !== 50
    || rainPresentationEvidence.automation?.discovered !== 16
    || rainPresentationEvidence.automation?.passed !== 16
    || rainPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.DazeRainPresentationV1"
    || !rainPresentationEvidence.visiblePlaytest?.storyAdvanced
    || !rainPresentationEvidence.visiblePlaytest?.engagementAdvanced
    || !rainPresentationEvidence.visiblePlaytest?.engagementCompleted
    || !rainPresentationEvidence.visiblePlaytest?.campaignUnchangedByEngagement
    || !rainPresentationEvidence.visiblePlaytest?.rainVisibleDuringEngagement
    || !rainPresentationEvidence.visiblePlaytest?.rainVisibleOnExposedGround
    || !rainPresentationEvidence.visiblePlaytest?.shelterInteriorDry
    || rainPresentationEvidence.visiblePlaytest?.campaignSave?.sha256BeforeEngagement
      !== rainPresentationEvidence.visiblePlaytest?.campaignSave?.sha256AfterReturn
    || !rainPresentationEvidence.visiblePlaytest?.campaignSave?.modifiedTimeUnchanged)
  errors.push("Unreal Daze-rain material, disclosure, runtime, automation or visible-play receipt is incomplete");

const vegetationProvenancePath = resolve(root, "assets/provenance/shi-daze-wet-field-vegetation-v1.json");
const vegetationImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-wet-field-vegetation-import-status.json");
const vegetationPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-wet-field-vegetation-presentation-status.json");
const vegetationProvenance = JSON.parse(await readFile(vegetationProvenancePath, "utf8"));
const vegetationImportEvidence = JSON.parse(await readFile(vegetationImportEvidencePath, "utf8"));
const vegetationPresentationEvidence = JSON.parse(await readFile(vegetationPresentationEvidencePath, "utf8"));
const vegetationDecision = "approved-runtime-wet-field-vegetation-production-blockout-council-engagement-story-reviewed-not-final-environment";
if (vegetationProvenance.assetId !== "shi-daze-wet-field-vegetation-v1"
    || vegetationProvenance.status !== vegetationDecision)
  errors.push("Unreal wet-field-vegetation provenance does not preserve its bounded runtime blockout decision");
if (vegetationImportEvidence.decision !== "approved-engine-wet-field-vegetation-production-blockout-packaged-not-final-environment")
  errors.push("Unreal wet-field-vegetation import evidence is missing or overstates final-environment approval");
if (vegetationPresentationEvidence.decision !== vegetationDecision)
  errors.push("Unreal wet-field-vegetation presentation evidence is missing or overstates final-environment approval");
for (const output of vegetationProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    if (bytes.byteLength !== output.bytes || createHash("sha256").update(bytes).digest("hex") !== output.sha256)
      errors.push(`wet-field-vegetation provenance receipt drifted: ${output.file}`);
  } catch {
    errors.push(`wet-field-vegetation provenance output is missing: ${output.file}`);
  }
}
for (const tool of [vegetationProvenance.toolchain?.generator, vegetationProvenance.toolchain?.validator,
  vegetationProvenance.toolchain?.unrealImporter, vegetationProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("wet-field-vegetation provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`wet-field-vegetation tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`wet-field-vegetation provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of vegetationImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal wet-field-vegetation receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal wet-field-vegetation asset is missing: ${asset.file}`);
  }
}
const vegetationStalkImport = vegetationImportEvidence.import?.stalk;
const vegetationTuftImport = vegetationImportEvidence.import?.tuft;
if (vegetationImportEvidence.trackedUnrealAssets?.length !== 3
    || vegetationImportEvidence.import?.passed !== true
    || vegetationImportEvidence.import?.readOnlyInspection?.mode !== "inspect-only"
    || vegetationImportEvidence.import?.readOnlyInspection?.exitCode !== 0
    || !vegetationImportEvidence.import?.readOnlyInspection?.trackedUassetHashesUnchanged
    || vegetationImportEvidence.import?.readOnlyInspection?.unrelatedTrackedUassetHashesUnchanged !== 17
    || vegetationStalkImport?.lodTriangles?.join(",") !== "84,28"
    || vegetationTuftImport?.lodTriangles?.join(",") !== "64,14"
    || vegetationStalkImport?.lodUvChannels?.join(",") !== "2,2"
    || vegetationTuftImport?.lodUvChannels?.join(",") !== "2,2"
    || vegetationStalkImport?.materialSlot !== "M_SHI_RainDarkenedFieldPlant"
    || vegetationTuftImport?.materialSlot !== "M_SHI_RainDarkenedFieldPlant"
    || vegetationStalkImport?.simpleCollisionCount !== 0 || vegetationStalkImport?.convexCollisionCount !== 0
    || vegetationTuftImport?.simpleCollisionCount !== 0 || vegetationTuftImport?.convexCollisionCount !== 0
    || vegetationStalkImport?.lightMapResolution !== 64 || vegetationTuftImport?.lightMapResolution !== 64
    || vegetationStalkImport?.lightMapCoordinateIndex !== 1 || vegetationTuftImport?.lightMapCoordinateIndex !== 1
    || vegetationStalkImport?.naniteEnabled !== false || vegetationTuftImport?.naniteEnabled !== false)
  errors.push("Unreal wet-field-vegetation mesh/import receipt is incomplete");
const vegetationStalkMin = vegetationStalkImport?.boundsCentimeters?.minimum ?? [];
const vegetationStalkMax = vegetationStalkImport?.boundsCentimeters?.maximum ?? [];
const vegetationTuftMin = vegetationTuftImport?.boundsCentimeters?.minimum ?? [];
const vegetationTuftMax = vegetationTuftImport?.boundsCentimeters?.maximum ?? [];
if (vegetationStalkMin.length !== 3 || vegetationStalkMax.length !== 3
    || Math.abs(vegetationStalkMin[0] + 34) > .001 || Math.abs(vegetationStalkMin[1] + 31) > .001
    || Math.abs(vegetationStalkMin[2]) > .001 || Math.abs(vegetationStalkMax[0] - 34) > .001
    || Math.abs(vegetationStalkMax[1] - 30) > .001 || Math.abs(vegetationStalkMax[2] - 135) > .001
    || vegetationTuftMin.length !== 3 || vegetationTuftMax.length !== 3
    || Math.abs(vegetationTuftMin[0] + 45) > .001 || Math.abs(vegetationTuftMin[1] + 45) > .001
    || Math.abs(vegetationTuftMin[2]) > .001 || Math.abs(vegetationTuftMax[0] - 45) > .001
    || Math.abs(vegetationTuftMax[1] - 45) > .001 || Math.abs(vegetationTuftMax[2] - 52) > .001)
  errors.push("Unreal wet-field-vegetation exact admitted bounds drifted");
if (vegetationImportEvidence.package?.packageCount !== 516
    || vegetationImportEvidence.package?.priorAcceptedPackageCount !== 513
    || vegetationImportEvidence.package?.addedPackageCount !== 3
    || vegetationImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || vegetationImportEvidence.package?.alwaysCookPath !== "/Game/SHI/Art/Environment/WetFieldVegetation"
    || vegetationImportEvidence.package?.cookedEntries?.length !== 5
    || vegetationImportEvidence.package?.artifacts?.length !== 4
    || vegetationImportEvidence.package?.rejectedFirstArchive?.accepted !== false
    || vegetationImportEvidence.smokeTest?.exitCode !== 0
    || vegetationImportEvidence.smokeTest?.containerPackageCount !== 516
    || vegetationImportEvidence.smokeTest?.gameMode !== "ShiGameMode"
    || vegetationImportEvidence.smokeTest?.materialOrLoadWarnings !== 0)
  errors.push("Unreal wet-field-vegetation package, forced-cook, rejected-trial or smoke receipt is incomplete");
for (const screenshot of vegetationPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`wet-field-vegetation presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`wet-field-vegetation presentation screenshot is missing: ${screenshot.file}`);
  }
}
if (vegetationPresentationEvidence.screenshots?.length !== 4
    || vegetationPresentationEvidence.material?.nodeCount !== 15
    || vegetationPresentationEvidence.material?.usedWithInstancedStaticMeshes !== true
    || vegetationPresentationEvidence.material?.readOnlyInspection?.mode !== "inspect-only"
    || vegetationPresentationEvidence.material?.readOnlyInspection?.exitCode !== 0
    || !vegetationPresentationEvidence.material?.readOnlyInspection?.passed
    || !vegetationPresentationEvidence.material?.readOnlyInspection?.trackedUassetHashesUnchanged
    || vegetationPresentationEvidence.material?.windAmplitudeCentimeters !== 2.4
    || vegetationPresentationEvidence.material?.textures !== 0
    || vegetationPresentationEvidence.presentation?.stalkInstances !== 42
    || vegetationPresentationEvidence.presentation?.tuftInstances !== 64
    || vegetationPresentationEvidence.presentation?.totalInstances !== 106
    || vegetationPresentationEvidence.presentation?.rootHalfExtentCentimeters !== 1125
    || vegetationPresentationEvidence.presentation?.centralExclusionHalfExtentCentimeters?.join(",") !== "520,440"
    || vegetationPresentationEvidence.presentation?.routeHalfWidthCentimeters !== 115
    || vegetationPresentationEvidence.presentation?.deterministicSeed !== 0x5EED20A
    || vegetationPresentationEvidence.presentation?.exactBotanicalReconstruction !== false
    || vegetationPresentationEvidence.presentation?.finalArt !== false
    || vegetationPresentationEvidence.presentation?.interactive !== false
    || vegetationPresentationEvidence.presentation?.runtimeCollision !== false
    || vegetationPresentationEvidence.presentation?.navigationInfluence !== false
    || vegetationPresentationEvidence.presentation?.gameplayAuthority !== false
    || vegetationPresentationEvidence.presentation?.saveAuthority !== false
    || vegetationPresentationEvidence.presentation?.replication !== false
    || vegetationPresentationEvidence.presentation?.cpuAnimation !== false
    || vegetationPresentationEvidence.presentation?.materialWindOnly !== true
    || vegetationPresentationEvidence.presentation?.visibleDuringNonAuthoritativeEngagement !== true
    || vegetationPresentationEvidence.presentation?.developmentReview?.fieldOfViewDegrees !== 52
    || vegetationPresentationEvidence.automation?.discovered !== 17
    || vegetationPresentationEvidence.automation?.passed !== 17
    || vegetationPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.WetFieldVegetationPresentationV1"
    || !vegetationPresentationEvidence.visiblePlaytest?.storyAdvanced
    || !vegetationPresentationEvidence.visiblePlaytest?.engagementAdvanced
    || !vegetationPresentationEvidence.visiblePlaytest?.engagementCompleted
    || !vegetationPresentationEvidence.visiblePlaytest?.campaignUnchangedByEngagement
    || !vegetationPresentationEvidence.visiblePlaytest?.vegetationVisibleDuringCouncil
    || !vegetationPresentationEvidence.visiblePlaytest?.vegetationVisibleDuringEngagement
    || !vegetationPresentationEvidence.visiblePlaytest?.shelterAndCommandCenterClear
    || !vegetationPresentationEvidence.visiblePlaytest?.approachCorridorClear
    || vegetationPresentationEvidence.visiblePlaytest?.campaignSave?.sha256BeforeEngagement
      !== vegetationPresentationEvidence.visiblePlaytest?.campaignSave?.sha256AfterReturn
    || !vegetationPresentationEvidence.visiblePlaytest?.campaignSave?.modifiedTimeUnchanged)
  errors.push("Unreal wet-field-vegetation material, disclosure, runtime, automation or visible-play receipt is incomplete");

const councilCharacterProvenancePath = resolve(root, "assets/provenance/shi-daze-council-characters-v1.json");
const councilCharacterImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-characters-import-status.json");
const councilCharacterPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-characters-presentation-status.json");
const councilCharacterProvenance = JSON.parse(await readFile(councilCharacterProvenancePath, "utf8"));
const councilCharacterImportEvidence = JSON.parse(await readFile(councilCharacterImportEvidencePath, "utf8"));
const councilCharacterPresentationEvidence = JSON.parse(await readFile(councilCharacterPresentationEvidencePath, "utf8"));
const councilCharacterImportDecision = "approved-engine-five-identity-skeletal-production-blockout-presented-not-final-character-art";
const councilCharacterPresentationDecision = "approved-runtime-five-identity-skeletal-production-blockout-story-reviewed-not-final-character-art";
const councilCharacterIds = ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier"];
if (councilCharacterProvenance.assetId !== "shi-daze-council-characters-v1"
    || councilCharacterProvenance.status !== councilCharacterPresentationDecision
    || councilCharacterImportEvidence.assetId !== "shi-daze-council-characters-v1"
    || councilCharacterImportEvidence.decision !== councilCharacterImportDecision
    || councilCharacterPresentationEvidence.assetId !== "shi-daze-council-characters-v1"
    || councilCharacterPresentationEvidence.decision !== councilCharacterPresentationDecision)
  errors.push("Unreal council-character provenance or evidence overstates its bounded production-blockout decision");
for (const output of councilCharacterProvenance.sourceOutputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    if (bytes.byteLength !== output.bytes || createHash("sha256").update(bytes).digest("hex") !== output.sha256)
      errors.push(`council-character source receipt drifted: ${output.file}`);
  } catch {
    errors.push(`council-character source output is missing: ${output.file}`);
  }
}
for (const character of councilCharacterProvenance.characterExports ?? []) {
  for (const output of [character.fbx, character.glb]) {
    try {
      const bytes = await readFile(resolve(root, "assets/provenance", output.file));
      if (bytes.byteLength !== output.bytes || createHash("sha256").update(bytes).digest("hex") !== output.sha256)
        errors.push(`council-character export receipt drifted: ${output.file}`);
    } catch {
      errors.push(`council-character export is missing: ${output.file}`);
    }
  }
}
for (const tool of [councilCharacterProvenance.toolchain?.generator, councilCharacterProvenance.toolchain?.validator,
  councilCharacterProvenance.toolchain?.unrealImporter, councilCharacterProvenance.toolchain?.unrealMaterialAuthor]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("council-character provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`council-character tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`council-character provenance tool is missing: ${tool.file}`);
  }
}
for (const asset of councilCharacterImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal council-character receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal council-character asset is missing: ${asset.file}`);
  }
}
const characterImportChecks = councilCharacterImportEvidence.import?.checks;
if (councilCharacterProvenance.sourceOutputs?.length !== 7
    || councilCharacterProvenance.characterExports?.length !== 5
    || councilCharacterProvenance.characterExports?.map((character) => character.characterId).join(",") !== councilCharacterIds.join(",")
    || councilCharacterProvenance.engineOutputs?.trackedAssets !== 20
    || councilCharacterProvenance.engineOutputs?.skeletalMeshes !== 5
    || councilCharacterProvenance.engineOutputs?.sharedSkeletons !== 1
    || councilCharacterProvenance.engineOutputs?.materials !== 14
    || councilCharacterProvenance.visibleEvidence?.screenshots !== 7
    || councilCharacterProvenance.visibleEvidence?.realInputAndAutosave !== true
    || councilCharacterImportEvidence.trackedUnrealAssets?.length !== 20
    || councilCharacterImportEvidence.import?.passed !== true
    || councilCharacterImportEvidence.import?.normalImportMethod !== "FBXNIM_IMPORT_NORMALS"
    || councilCharacterImportEvidence.import?.referencePoseBoneCount !== 53
    || councilCharacterImportEvidence.import?.presentationScale !== 100
    || councilCharacterImportEvidence.import?.characterIds?.join(",") !== councilCharacterIds.join(",")
    || !characterImportChecks?.exactReferencePoseBones || !characterImportChecks?.identityScaleReferenceRoot
    || councilCharacterImportEvidence.import?.referenceRoot?.scale?.join(",") !== "1,1,1"
    || !characterImportChecks?.rootAndPelvisRelationship
    || !characterImportChecks?.boundedMaterials || !characterImportChecks?.noPhysicsAssets
    || !characterImportChecks?.noMorphTargets || !characterImportChecks?.noTextures
    || !characterImportChecks?.noAnimations || !characterImportChecks?.cleanFbxRoundTrip
    || !characterImportChecks?.cleanGlbRoundTrip
    || councilCharacterImportEvidence.materials?.count !== 14
    || councilCharacterImportEvidence.materials?.nodesPerMaterial !== 3
    || councilCharacterImportEvidence.materials?.textures !== 0)
  errors.push("Unreal council-character source, import, skeleton, material or rights-bounded receipt is incomplete");
if (councilCharacterImportEvidence.package?.packageCount !== 538
    || councilCharacterImportEvidence.package?.priorAcceptedPackageCount !== 516
    || councilCharacterImportEvidence.package?.addedPackageCount !== 22
    || councilCharacterImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || councilCharacterImportEvidence.package?.artifacts?.length !== 4
    || councilCharacterImportEvidence.smokeTest?.exitCode !== 0
    || councilCharacterImportEvidence.smokeTest?.containerPackageCount !== 538
    || councilCharacterImportEvidence.smokeTest?.gameMode !== "ShiGameMode"
    || councilCharacterImportEvidence.smokeTest?.map !== "/Engine/Maps/Entry"
    || !councilCharacterImportEvidence.smokeTest?.cleanRequestedExit)
  errors.push("Unreal council-character package, cooked-container or smoke receipt is incomplete");
for (const screenshot of councilCharacterPresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`council-character presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`council-character presentation screenshot is missing: ${screenshot.file}`);
  }
}
const characterPresentation = councilCharacterPresentationEvidence.presentation;
const characterPlaytest = councilCharacterPresentationEvidence.visiblePlaytest;
if (councilCharacterPresentationEvidence.screenshots?.length !== 7
    || characterPresentation?.characterIds?.join(",") !== councilCharacterIds.join(",")
    || characterPresentation?.sharedSkeletonBones !== 53
    || characterPresentation?.skeletalMeshes !== 5
    || characterPresentation?.materials !== 14
    || characterPresentation?.participantLights?.join(",") !== "speaker-key,speaker-fill,keeper-key,keeper-fill"
    || characterPresentation?.defaultPawnSuppressed !== true
    || characterPresentation?.renderMeshCollision !== false
    || characterPresentation?.navigationInfluence !== false
    || characterPresentation?.gameplayAuthority !== false
    || characterPresentation?.saveAuthority !== false
    || characterPresentation?.replication !== false
    || characterPresentation?.finalArt !== false
    || characterPresentation?.exactPortraitReconstruction !== false
    || characterPresentation?.exactCostumeReconstruction !== false
    || councilCharacterPresentationEvidence.automation?.discovered !== 18
    || councilCharacterPresentationEvidence.automation?.passed !== 18
    || councilCharacterPresentationEvidence.automation?.exitCode !== 0
    || councilCharacterPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.CouncilCharacterPresentationV1"
    || !characterPlaytest?.storyAdvanced || !characterPlaytest?.transactionVerified
    || !characterPlaytest?.normalUiVisible || !characterPlaytest?.choiceCardsVisible
    || !characterPlaytest?.rainVisible || !characterPlaytest?.councilCharactersVisible
    || characterPlaytest?.autosave?.currentNodeId !== "open-council"
    || characterPlaytest?.autosave?.historyChoiceIds?.join(",") !== "read-the-names"
    || characterPlaytest?.autosave?.completed !== false)
  errors.push("Unreal council-character disclosure, runtime, automation or real visible-play receipt is incomplete");

const councilPerformanceProvenancePath = resolve(root, "assets/provenance/shi-daze-council-performance-v1.json");
const councilPerformanceImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-performance-import-status.json");
const councilPerformancePresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-performance-presentation-status.json");
const councilPerformanceProvenance = JSON.parse(await readFile(councilPerformanceProvenancePath, "utf8"));
const councilPerformanceImportEvidence = JSON.parse(await readFile(councilPerformanceImportEvidencePath, "utf8"));
const councilPerformancePresentationEvidence = JSON.parse(await readFile(councilPerformancePresentationEvidencePath, "utf8"));
const councilPerformanceImportDecision = "approved-engine-shared-skeleton-body-performance-blockout-packaged-not-final-acting";
const councilPerformancePresentationDecision = "approved-runtime-shared-skeleton-body-performance-blockout-story-reviewed-not-final-acting";
if (councilPerformanceProvenance.assetId !== "shi-daze-council-performance-v1"
    || councilPerformanceProvenance.status !== councilPerformancePresentationDecision
    || councilPerformanceImportEvidence.assetId !== "shi-daze-council-performance-v1"
    || councilPerformanceImportEvidence.decision !== councilPerformanceImportDecision
    || councilPerformancePresentationEvidence.assetId !== "shi-daze-council-performance-v1"
    || councilPerformancePresentationEvidence.decision !== councilPerformancePresentationDecision)
  errors.push("Unreal council-performance provenance or evidence overstates its bounded body-performance decision");
for (const output of councilPerformanceProvenance.outputs ?? []) {
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", output.file));
    if (bytes.byteLength !== output.bytes || createHash("sha256").update(bytes).digest("hex") !== output.sha256)
      errors.push(`council-performance source/export receipt drifted: ${output.file}`);
  } catch {
    errors.push(`council-performance source/export output is missing: ${output.file}`);
  }
}
for (const tool of [councilPerformanceProvenance.toolchain?.generator,
  councilPerformanceProvenance.toolchain?.validator, councilPerformanceProvenance.toolchain?.unrealImporter,
  ...(councilPerformanceProvenance.toolchain?.unrealNormalizer ?? [])]) {
  if (!tool?.file || !tool?.sha256) {
    errors.push("council-performance provenance omits a bounded tool receipt");
    continue;
  }
  try {
    const bytes = await readFile(resolve(root, "assets/provenance", tool.file));
    if (createHash("sha256").update(bytes).digest("hex") !== tool.sha256)
      errors.push(`council-performance tool hash drifted: ${tool.file}`);
  } catch {
    errors.push(`council-performance tool is missing: ${tool.file}`);
  }
}
for (const asset of councilPerformanceImportEvidence.trackedUnrealAssets ?? []) {
  try {
    const bytes = await readFile(resolve(root, asset.file));
    if (bytes.byteLength !== asset.bytes || createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      errors.push(`tracked Unreal council-performance receipt drifted: ${asset.file}`);
  } catch {
    errors.push(`tracked Unreal council-performance asset is missing: ${asset.file}`);
  }
}
const performanceImport = councilPerformanceImportEvidence.import;
const performanceImportChecks = performanceImport?.checks;
if (councilPerformanceProvenance.outputs?.length !== 10
    || councilPerformanceProvenance.clipContract?.roles?.join(",") !== "attentive-idle,speaker-measured"
    || councilPerformanceProvenance.clipContract?.sharedSkeletonBones !== 53
    || councilPerformanceProvenance.clipContract?.sourceSamples !== 121
    || councilPerformanceProvenance.clipContract?.durationSeconds !== 4
    || councilPerformanceProvenance.clipContract?.framesPerSecond !== 30
    || councilPerformanceProvenance.clipContract?.unrealChildTracks !== 52
    || councilPerformanceProvenance.clipContract?.rootTrackRemoved !== true
    || councilPerformanceProvenance.clipContract?.rootMotion !== false
    || councilPerformanceImportEvidence.trackedUnrealAssets?.length !== 2
    || performanceImport?.passed !== true || performanceImport?.mode !== "inspect-only"
    || performanceImport?.samples !== 121 || performanceImport?.frames !== 120
    || performanceImport?.durationSeconds !== 4 || performanceImport?.framesPerSecond !== 30
    || performanceImport?.childTrackCount !== 52
    || performanceImport?.referenceRoot?.scale?.join(",") !== "1,1,1"
    || !performanceImportChecks?.exactAssetIdentity || !performanceImportChecks?.sharedSkeleton
    || !performanceImportChecks?.exactSamplesDurationAndRate || !performanceImportChecks?.rootTrackRemoved
    || !performanceImportChecks?.identityReferenceRootPreserved || !performanceImportChecks?.rotationOnlyChildChannels
    || !performanceImportChecks?.pelvisAndBodyTracksRetained || !performanceImportChecks?.rootMotionDisabled
    || !performanceImportChecks?.notAdditive || !performanceImportChecks?.noUnexpectedAssets)
  errors.push("Unreal council-performance source, import, Root, timing or authority-bounded receipt is incomplete");
if (councilPerformanceImportEvidence.package?.packageCount !== 538
    || councilPerformanceImportEvidence.package?.priorAcceptedPackageCount !== 536
    || councilPerformanceImportEvidence.package?.addedPackageCount !== 2
    || councilPerformanceImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || councilPerformanceImportEvidence.package?.artifacts?.length !== 4
    || councilPerformanceImportEvidence.smokeTest?.exitCode !== 0
    || councilPerformanceImportEvidence.smokeTest?.containerPackageCount !== 538
    || councilPerformanceImportEvidence.smokeTest?.gameMode !== "ShiGameMode"
    || councilPerformanceImportEvidence.smokeTest?.map !== "/Engine/Maps/Entry"
    || !councilPerformanceImportEvidence.smokeTest?.cleanRequestedExit)
  errors.push("Unreal council-performance package, cooked-container or smoke receipt is incomplete");
for (const screenshot of councilPerformancePresentationEvidence.screenshots ?? []) {
  try {
    const bytes = await readFile(resolve(root, screenshot.file));
    if (bytes.byteLength !== screenshot.bytes || createHash("sha256").update(bytes).digest("hex") !== screenshot.sha256)
      errors.push(`council-performance presentation screenshot drifted: ${screenshot.file}`);
  } catch {
    errors.push(`council-performance presentation screenshot is missing: ${screenshot.file}`);
  }
}
const performancePresentation = councilPerformancePresentationEvidence.presentation;
const performancePlaytest = councilPerformancePresentationEvidence.visiblePlaytest;
if (councilPerformancePresentationEvidence.screenshots?.length !== 4
    || performancePresentation?.clipIds?.join(",") !== "attentive-idle,speaker-measured"
    || performancePresentation?.sharedSkeletonBones !== 53
    || performancePresentation?.rootScale?.join(",") !== "1,1,1"
    || performancePresentation?.rootMotion !== false
    || performancePresentation?.completeBodyPreservedThroughMotion !== true
    || performancePresentation?.facialPerformance !== false
    || performancePresentation?.dialogueSynchronization !== false
    || performancePresentation?.interactionHands !== false
    || performancePresentation?.clothOrHairSimulation !== false
    || performancePresentation?.historicalEtiquetteClaim !== false
    || performancePresentation?.gameplayAuthority !== false
    || performancePresentation?.saveAuthority !== false
    || performancePresentation?.replication !== false
    || performancePresentation?.finalActing !== false
    || councilPerformancePresentationEvidence.automation?.discovered !== 19
    || councilPerformancePresentationEvidence.automation?.passed !== 19
    || councilPerformancePresentationEvidence.automation?.exitCode !== 0
    || councilPerformancePresentationEvidence.automation?.newSuite !== "SHI.Cinematic.CouncilPerformancePresentationV1"
    || !performancePlaytest?.storyAdvanced || !performancePlaytest?.transactionVerified
    || !performancePlaytest?.autosaved || !performancePlaytest?.normalUiVisible
    || !performancePlaytest?.choiceCardsVisible || !performancePlaytest?.rainVisible
    || !performancePlaytest?.animatedCouncilCharacterVisible)
  errors.push("Unreal council-performance disclosure, runtime, automation or visible-play receipt is incomplete");

const facialAssetId = "shi-daze-council-facial-performance-v1";
const facialCharacterIds = ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier"];
const facialCharacterSuffixes = ["Keeper", "ChenSheng", "WuGuang", "YuMu", "QinCourier"];
const facialMorphTargets = [
  "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
  "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
  "eyeLookUpLeft", "eyeLookUpRight", "browInnerUp", "browDownLeft", "browDownRight",
  "cheekSquintLeft", "cheekSquintRight", "jawOpen", "mouthFunnel", "mouthPressLeft",
  "mouthPressRight", "mouthUpperUpLeft", "mouthUpperUpRight",
];
const facialEyeMorphTargets = [
  "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight",
  "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight",
];
const facialExpectedSkeleton = "/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton";
const facialEvidenceRelative = "../../docs/production/evidence/unreal-daze-council-facial-performance-import-status.json";
const facialRuntimeEvidenceRelative = "../../docs/production/evidence/unreal-daze-council-facial-performance-runtime-status.json";
const facialPresentationEvidenceRelative = "../../docs/production/evidence/unreal-daze-council-facial-performance-presentation-status.json";
const facialEvidenceStatus = "five-identity facial-performance engineering blockout; not final acting";
const facialAdmissionStatus = "engineering blockout admitted in Unreal; not final acting/voice/close framing";
const facialPresentationStatus = "packaged and visibly reviewed engineering blockout; not final acting/voice/close framing or human art/historical approval";
const facialPresentationDecision = "approved-runtime-five-identity-facial-performance-engineering-blockout-packaged-visible-reviewed-not-final-acting";
const facialDisclosure = "FACIAL PERFORMANCE ENGINEERING BLOCKOUT · SILENT INTENT CADENCE · GENERIC NON-PORTRAIT FACE · NOT FINAL ACTING, LIP SYNC OR VOICE";
const facialMaterialNames = [
  "M_SHI_Character_BindingClay", "M_SHI_Character_EyeBrown", "M_SHI_Character_HairClay",
  "M_SHI_Character_RolePropClay", "M_SHI_Character_SkinClay", "M_SHI_keeper_ClothBase",
  "M_SHI_keeper_ClothOuter", "M_SHI_chen-sheng_ClothBase", "M_SHI_chen-sheng_ClothOuter",
  "M_SHI_wu-guang_ClothBase", "M_SHI_wu-guang_ClothOuter", "M_SHI_yu-mu_ClothBase",
  "M_SHI_yu-mu_ClothOuter", "M_SHI_qin-courier_ClothBase", "M_SHI_qin-courier_ClothOuter",
];
const facialMorphSectionMaterials = ["M_SHI_Character_EyeBrown", "M_SHI_Character_SkinClay"];
const facialProvenancePath = resolve(root, "assets/provenance/shi-daze-council-facial-performance-v1.json");
const facialMetricsPath = resolve(root, "assets/3d/source/shi-daze-council-facial-performance-v1.metrics.json");
const facialValidationPath = resolve(root, "assets/3d/source/shi-daze-council-facial-performance-v1.validation.json");
const facialImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-facial-performance-import-status.json");
const facialRuntimeEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-facial-performance-runtime-status.json");
const facialPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-facial-performance-presentation-status.json");

async function readFacialJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    errors.push(`${label} is missing or is not valid JSON`);
    return {};
  }
}

async function verifyFacialReceipt(baseDirectory, receipt, label) {
  if (!receipt?.file || !Number.isInteger(receipt.bytes) || receipt.bytes <= 0
      || !/^[0-9a-f]{64}$/.test(receipt.sha256 ?? "")) {
    errors.push(`${label} omits its file, byte count or SHA-256 receipt`);
    return;
  }
  try {
    const bytes = await readFile(resolve(baseDirectory, receipt.file));
    if (bytes.byteLength !== receipt.bytes
        || createHash("sha256").update(bytes).digest("hex") !== receipt.sha256)
      errors.push(`${label} receipt drifted: ${receipt.file}`);
  } catch {
    errors.push(`${label} is missing: ${receipt.file}`);
  }
}

const sameStringSet = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length
  && [...actual].sort().join("\n") === [...expected].sort().join("\n");
const everyCheckPassed = (checks) => checks && Object.keys(checks).length > 0
  && Object.values(checks).every((value) => value === true);

const facialProvenance = await readFacialJson(facialProvenancePath, "Daze council facial provenance");
const facialMetrics = await readFacialJson(facialMetricsPath, "Daze council facial metrics");
const facialValidation = await readFacialJson(facialValidationPath, "Daze council facial validation");
const facialImportEvidence = await readFacialJson(facialImportEvidencePath, "Daze council facial Unreal import evidence");
const facialRuntimeEvidence = await readFacialJson(facialRuntimeEvidencePath, "Daze council facial Unreal runtime evidence");
const facialPresentationEvidence = await readFacialJson(facialPresentationEvidencePath, "Daze council facial Unreal presentation evidence");

if (facialProvenance.assetId !== facialAssetId
    || typeof facialProvenance.status !== "string"
    || !facialProvenance.status.includes("engine")
    || !facialProvenance.status.includes("packaged-visible-reviewed")
    || !facialProvenance.status.includes("engineering-blockout")
    || !facialProvenance.status.includes("not-final-acting")
    || facialProvenance.status.includes("pending")
    || facialProvenance.engineImportEvidence !== facialEvidenceRelative
    || facialProvenance.engineRuntimeEvidence !== facialRuntimeEvidenceRelative
    || facialProvenance.enginePresentationEvidence !== facialPresentationEvidenceRelative
    || facialProvenance.engineAdmissionStatus !== facialAdmissionStatus
    || facialProvenance.enginePresentationStatus !== facialPresentationStatus)
  errors.push("Daze council facial provenance does not preserve its admitted engineering-blockout/final-art boundary");
if (facialProvenance.engineOutputs?.trackedAssets !== 21
    || facialProvenance.engineOutputs?.skeletalMeshes !== 5
    || facialProvenance.engineOutputs?.sharedSkeletons !== 1
    || facialProvenance.engineOutputs?.materials !== 15
    || facialProvenance.engineOutputs?.textures !== 1
    || facialProvenance.engineOutputs?.hashManifest !== facialEvidenceRelative
    || facialProvenance.engineOutputs?.runtimeStatus !== facialRuntimeEvidenceRelative
    || facialProvenance.engineOutputs?.presentationStatus !== facialPresentationEvidenceRelative)
  errors.push("Daze council facial provenance omits the exact 21-asset isolated Unreal admission boundary");

for (const output of facialProvenance.sourceOutputs ?? [])
  await verifyFacialReceipt(resolve(root, "assets/provenance"), output, "Daze council facial source output");
for (const character of facialProvenance.characterExports ?? []) {
  for (const output of [character.fbx, character.glb])
    await verifyFacialReceipt(resolve(root, "assets/provenance"), output, `Daze council facial ${character.characterId} export`);
}
for (const render of [
  ...(facialProvenance.sourceReviewRenders ?? []),
  ...(facialProvenance.cleanFbxReviewRenders ?? []),
]) await verifyFacialReceipt(resolve(root, "assets/provenance"), render, `Daze council facial ${render.state} review render`);
for (const tool of [
  facialProvenance.toolchain?.generator,
  facialProvenance.toolchain?.characterBuilderDependency,
  facialProvenance.toolchain?.validator,
  facialProvenance.toolchain?.unrealImporter,
  facialProvenance.toolchain?.packageReviewValidator,
]) await verifyFacialReceipt(resolve(root, "assets/provenance"), tool, "Daze council facial tool");
for (const [evidenceType, receipt] of Object.entries(facialProvenance.engineEvidenceReceipts ?? {}))
  await verifyFacialReceipt(resolve(root, "assets/provenance"), receipt,
    `Daze council facial ${evidenceType} engine evidence`);
if (Object.keys(facialProvenance.engineEvidenceReceipts ?? {}).sort().join(",") !== "import,presentation,runtime")
  errors.push("Daze council facial provenance must retain exact import, runtime and presentation receipts");

if (facialProvenance.sourceOutputs?.length !== 4
    || facialProvenance.characterExports?.length !== 5
    || facialProvenance.characterExports?.map((item) => item.characterId).join(",") !== facialCharacterIds.join(",")
    || facialProvenance.sourceReviewRenders?.map((item) => item.state).join(",")
      !== "lineup-front,lineup-oblique,neutral,blink,object-glance,interrupted-return,silent-speech,held-breath"
    || facialProvenance.cleanFbxReviewRenders?.map((item) => item.state).join(",")
      !== "neutral,blink,object-glance,silent-speech"
    || facialProvenance.morphContract?.bodyControlCount !== 21
    || facialProvenance.morphContract?.bodyControls?.join(",") !== facialMorphTargets.join(",")
    || facialProvenance.morphContract?.eyeControlCount !== 8
    || facialProvenance.morphContract?.eyeControls?.join(",") !== facialEyeMorphTargets.join(",")
    || facialProvenance.morphContract?.otherMeshMorphTargets !== 0
    || facialProvenance.morphContract?.sharedSkeleton !== "SK_SHI_DazeCouncil_Skeleton"
    || facialProvenance.morphContract?.sharedSkeletonBones !== 53
    || facialProvenance.morphContract?.canonicalCharacterIds?.join(",") !== facialCharacterIds.join(",")
    || facialProvenance.morphContract?.neuralGeneration !== false
    || facialProvenance.morphContract?.voiceOrTranscriptInput !== false
    || facialProvenance.morphContract?.gameplayAuthority !== false)
  errors.push("Daze council facial provenance omits an exact source, render, identity, Skeleton or morph receipt");

if (facialMetrics.assetId !== facialAssetId
    || facialMetrics.boneCount !== 53
    || facialMetrics.morphTargetCount !== 21
    || facialMetrics.morphTargets?.join(",") !== facialMorphTargets.join(",")
    || facialMetrics.eyeGazeTargets?.join(",") !== facialEyeMorphTargets.join(",")
    || facialMetrics.characters?.map((item) => item.id).join(",") !== facialCharacterIds.join(",")
    || facialMetrics.neuralGeneration !== false
    || facialMetrics.voiceOrTranscriptInput !== false)
  errors.push("Daze council facial source metrics violate the exact silent, non-neural five-identity contract");

const morphEquivalence = facialValidation.crossFormatMorphEquivalence;
if (facialValidation.assetId !== facialAssetId
    || facialValidation.status !== "pass"
    || facialValidation.boneCount !== 53
    || facialValidation.morphTargetCount !== 21
    || !sameStringSet(facialValidation.morphTargets, facialMorphTargets)
    || !sameStringSet(facialValidation.eyeGazeTargets, facialEyeMorphTargets)
    || facialValidation.sharedRestPose !== true
    || facialValidation.canonicalCharacterIds?.join(",") !== facialCharacterIds.join(",")
    || morphEquivalence?.status !== "pass"
    || morphEquivalence?.toleranceMetres !== 0.000005
    || !Number.isFinite(morphEquivalence?.maximumAbsoluteErrorMetres)
    || morphEquivalence.maximumAbsoluteErrorMetres > 0.000005
    || morphEquivalence?.characters?.map((item) => item.characterId).join(",") !== facialCharacterIds.join(","))
  errors.push("Daze council facial clean interchange or cross-format morph equivalence is not proven within 5e-6 metres");

for (const format of ["fbx", "glb"]) {
  const rows = facialValidation.formats?.[format] ?? [];
  if (rows.length !== 5 || rows.map((row) => row.characterId).join(",") !== facialCharacterIds.join(",")) {
    errors.push(`Daze council facial ${format.toUpperCase()} validation omits one or more canonical identities`);
    continue;
  }
  for (const row of rows) {
    await verifyFacialReceipt(root, row, `Daze council facial clean ${format.toUpperCase()} validation`);
    const expectedHelperMeshes = format === "fbx" ? [] : ["Icosphere"];
    if (row.boneCount !== 53 || !sameStringSet(Object.keys(row.bodyMorphTargets ?? {}), facialMorphTargets)
        || !sameStringSet(Object.keys(row.eyeMorphTargets ?? {}), facialEyeMorphTargets)
        || row.importerOnlyHelperMeshes?.join(",") !== expectedHelperMeshes.join(","))
      errors.push(`Daze council facial ${format.toUpperCase()} ${row.characterId} target, Skeleton or helper-mesh contract drifted`);
  }
}

const expectedFacialMeshPaths = Object.fromEntries(facialCharacterIds.map((characterId, index) => {
  const name = `SKM_SHI_DazeCouncil_${facialCharacterSuffixes[index]}_Facial_01`;
  return [characterId, `/Game/SHI/Art/Characters/DazeCouncilFacial/${name}.${name}`];
}));
if (facialImportEvidence.assetId !== facialAssetId
    || facialImportEvidence.status !== facialEvidenceStatus
    || facialImportEvidence.mode !== "import-replace"
    || facialImportEvidence.mutationEnvironment !== "SHI_DAZE_COUNCIL_FACIAL_REIMPORT"
    || facialImportEvidence.mutationAuthorized !== true
    || facialImportEvidence.saved !== true
    || facialImportEvidence.passed !== true
    || facialImportEvidence.destination !== "/Game/SHI/Art/Characters/DazeCouncilFacial"
    || facialImportEvidence.coordinateTransform?.sourceSpace !== "Blender right-handed Z-up metres"
    || facialImportEvidence.coordinateTransform?.unrealAssetLocalSpace
      !== "Unreal left-handed Z-up asset-local values retaining metre magnitudes"
    || facialImportEvidence.coordinateTransform?.sourceToAssetLocalScale?.join(",") !== "1,-1,1"
    || facialImportEvidence.coordinateTransform?.runtimePresentationScale !== 100
    || facialImportEvidence.coordinateTransform?.presentedUnit !== "centimetres"
    || facialImportEvidence.coordinateTransform?.passed !== true
    || facialImportEvidence.sourceContract?.passed !== true
    || !everyCheckPassed(facialImportEvidence.sourceContract?.checks)
    || facialImportEvidence.sharedSkeleton?.assetPath !== facialExpectedSkeleton
    || facialImportEvidence.sharedSkeleton?.boneCount !== 53
    || facialImportEvidence.sharedSkeleton?.passed !== true
    || !everyCheckPassed(facialImportEvidence.sharedSkeleton?.checks)
    || facialImportEvidence.morphContract?.count !== 21
    || facialImportEvidence.morphContract?.names?.join(",") !== facialMorphTargets.join(",")
    || facialImportEvidence.acceptedV1Preservation?.passed !== true
    || !everyCheckPassed(facialImportEvidence.acceptedV1Preservation?.checks)
    || facialImportEvidence.destinationInventory?.passed !== true
    || !everyCheckPassed(facialImportEvidence.destinationInventory?.checks)
    || facialImportEvidence.destinationInventory?.assets?.length !== 21
    || Object.values(facialImportEvidence.authorityBoundary ?? {}).some((value) => value !== false))
  errors.push("Daze council facial Unreal evidence does not prove an explicitly gated exact isolated admission, coordinate transform and accepted-v1 fallback");

const morphMetadataExtension = facialImportEvidence.sharedSkeleton?.morphMetadataExtension;
if (!sameStringSet(morphMetadataExtension?.addedNames, facialMorphTargets)
    || morphMetadataExtension?.removedNames?.length !== 0
    || morphMetadataExtension?.exactTwentyOneAddedNoExtras !== true
    || morphMetadataExtension?.existingMetadataPreserved !== true
    || morphMetadataExtension?.passed !== true
    || !Array.isArray(morphMetadataExtension?.beforeNames)
    || !sameStringSet(
      morphMetadataExtension?.afterNames,
      [...morphMetadataExtension.beforeNames, ...facialMorphTargets],
    ))
  errors.push("Daze council facial Unreal evidence does not bound the shared Skeleton morph-metadata extension to the exact 21 controls");

const facialReadOnlyInspection = facialImportEvidence.readOnlyInspection;
if (facialReadOnlyInspection?.mode !== "inspect-only"
    || facialReadOnlyInspection?.mutationAuthorized !== false
    || facialReadOnlyInspection?.exitCode !== 0
    || facialReadOnlyInspection?.trackedUassetHashesUnchanged !== true
    || facialReadOnlyInspection?.sourceContractPassed !== true
    || facialReadOnlyInspection?.sharedSkeletonPassed !== true
    || facialReadOnlyInspection?.allFiveCharactersPassed !== true
    || facialReadOnlyInspection?.eyeMaterialPassed !== true
    || facialReadOnlyInspection?.materialUsagePassed !== true
    || facialReadOnlyInspection?.destinationInventoryPassed !== true
    || facialReadOnlyInspection?.acceptedV1Preserved !== true
    || facialReadOnlyInspection?.passed !== true)
  errors.push("Daze council facial default inspect-only rerun is not proven read-only against all 21 admitted uasset hashes");

for (const characterId of facialCharacterIds) {
  const character = facialImportEvidence.characters?.[characterId];
  if (character?.characterId !== characterId
      || character?.assetPath !== expectedFacialMeshPaths[characterId]
      || character?.skeleton !== facialExpectedSkeleton
      || character?.boneCount !== 53
      || character?.passed !== true
      || !everyCheckPassed(character?.checks)
      || !sameStringSet(character?.morphTargets, facialMorphTargets)
      || character?.physicsAsset !== null)
    errors.push(`Daze council facial Unreal evidence rejects or omits ${characterId}`);
  await verifyFacialReceipt(root, facialImportEvidence.sourceFbxReceipts?.[characterId],
    `Daze council facial ${characterId} source FBX evidence`);
}

const expectedFacialAssetFiles = [
  ...facialCharacterSuffixes.map((suffix) => `SKM_SHI_DazeCouncil_${suffix}_Facial_01.uasset`),
  ...facialMaterialNames.map((name) => `${name}.uasset`),
  "T_SHI_Character_EyeBrown_CC0.uasset",
];
const trackedFacialAssets = facialImportEvidence.trackedUnrealAssets;
if (trackedFacialAssets?.root !== "apps/unreal/Content/SHI/Art/Characters/DazeCouncilFacial"
    || trackedFacialAssets?.passed !== true
    || !everyCheckPassed(trackedFacialAssets?.checks)
    || !sameStringSet(Object.keys(trackedFacialAssets?.receipts ?? {}), expectedFacialAssetFiles))
  errors.push("Daze council facial Unreal evidence does not retain exact receipts for its 21 isolated uassets");
for (const [file, receipt] of Object.entries(trackedFacialAssets?.receipts ?? {}))
  await verifyFacialReceipt(resolve(root, trackedFacialAssets.root), {file, ...receipt},
    "Tracked Unreal Daze council facial asset");

const facialMaterialUsage = facialImportEvidence.materialUsage;
if (facialMaterialUsage?.compiledDuringThisRun !== true
    || facialMaterialUsage?.passed !== true
    || !everyCheckPassed(facialMaterialUsage?.checks)
    || facialMaterialUsage?.materials?.length !== facialMaterialNames.length
    || !sameStringSet(facialMaterialUsage.materials.map((item) => item.name), facialMaterialNames))
  errors.push("Daze council facial Unreal evidence does not prove the exact 15-material skeletal/morph usage boundary");
for (const material of facialMaterialUsage?.materials ?? []) {
  const expectsMorph = facialMorphSectionMaterials.includes(material.name);
  if (material.path !== `/Game/SHI/Art/Characters/DazeCouncilFacial/${material.name}.${material.name}`
      || material.skeletalMeshUsage !== true
      || material.requiresMorphTargetUsage !== expectsMorph
      || material.morphTargetUsage !== expectsMorph
      || material.compileErrors?.length !== 0)
    errors.push(`Daze council facial material usage or compile receipt drifted for ${material.name}`);
}

await verifyFacialReceipt(root, facialImportEvidence.eyeTextureImport?.source,
  "Tracked CC0 Daze council facial eye texture source");
if (facialImportEvidence.eyeTextureImport?.assetPath
      !== "/Game/SHI/Art/Characters/DazeCouncilFacial/T_SHI_Character_EyeBrown_CC0.T_SHI_Character_EyeBrown_CC0"
    || facialImportEvidence.eyeTextureImport?.passed !== true
    || facialImportEvidence.eyeMaterial?.material
      !== "/Game/SHI/Art/Characters/DazeCouncilFacial/M_SHI_Character_EyeBrown.M_SHI_Character_EyeBrown"
    || facialImportEvidence.eyeMaterial?.texture
      !== "/Game/SHI/Art/Characters/DazeCouncilFacial/T_SHI_Character_EyeBrown_CC0.T_SHI_Character_EyeBrown_CC0"
    || facialImportEvidence.eyeMaterial?.passed !== true
    || !everyCheckPassed(facialImportEvidence.eyeMaterial?.checks))
  errors.push("Daze council facial Unreal evidence does not preserve the exact tracked CC0 eye texture/material binding");

await verifyFacialReceipt(root, facialRuntimeEvidence.importAdmission?.evidence,
  "Daze council facial runtime-to-import evidence");
await verifyFacialReceipt(root, facialRuntimeEvidence.packagePresentation?.evidence,
  "Daze council facial runtime-to-presentation evidence");
const historicallyBoundFacialSharedSources = {
  "apps/unreal/Source/SHI/ShiCouncilFigure.h": [2693, "c24aaf859d8216afe15feacbe26be6953c0f180cf216b59972ce564a71f8384c"],
  "apps/unreal/Source/SHI/ShiCouncilFigure.cpp": [17259, "a68f807373548e41702144099ec3aefcb4183a478c5e96c1e28df7a89b5bd6a3"],
  "apps/unreal/Source/SHI/ShiGameMode.cpp": [78715, "8145101a7cb021b0f8423dd0a01c19404eb74c0bda4bcd06904357d54702965e"],
  "apps/unreal/Config/DefaultGame.ini": [1181, "1154fff38e5a45029a6420bb9e6769e65ca8dd0aee04afd6a32fdf4459e768b0"],
};
for (const receipt of facialRuntimeEvidence.compiledSourceSnapshot ?? []) {
  const historical = historicallyBoundFacialSharedSources[receipt.file];
  if (historical) {
    if (receipt.bytes !== historical[0] || receipt.sha256 !== historical[1])
      errors.push(`Daze council facial historical compiled source receipt drifted: ${receipt.file}`);
  } else {
    await verifyFacialReceipt(root, receipt, "Daze council facial compiled source snapshot");
  }
}

const facialRuntimeContract = facialRuntimeEvidence.runtimeContract;
const facialRuntimeGates = facialRuntimeEvidence.releaseGates;
const finalFullSuite = facialRuntimeEvidence.automation?.fullShiNamespace;
const finalSelectedFacialSuite = facialRuntimeEvidence.automation?.selectedFacialSuite;
if (facialRuntimeEvidence.assetId !== facialAssetId
    || facialRuntimeEvidence.status
      !== "native-engine-runtime-contract-automation-package-and-visible-engineering-review-pass; not-final-acting"
    || facialRuntimeEvidence.disclosure !== facialDisclosure
    || facialRuntimeEvidence.engine?.association !== "5.8"
    || facialRuntimeEvidence.engine?.version !== "5.8.1-56057345+++UE5+Release-5.8"
    || facialRuntimeEvidence.importAdmission?.trackedAssets !== 21
    || facialRuntimeEvidence.importAdmission?.exactMorphTargetsPerMesh !== 21
    || facialRuntimeEvidence.importAdmission?.defaultReadOnlyInspectionPassed !== true
    || facialRuntimeEvidence.packagePresentation?.status !== "pass-engineering-blockout-only"
    || facialRuntimeEvidence.packagePresentation?.package !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || facialRuntimeEvidence.packagePresentation?.cookedPackages !== 559
    || facialRuntimeEvidence.packagePresentation?.renderedPackagedRuns !== 3
    || facialRuntimeEvidence.packagePresentation?.trackedScreenshots !== 6
    || facialRuntimeEvidence.packagePresentation?.normalSpeakerReviewed !== true
    || facialRuntimeEvidence.packagePresentation?.reducedSpeakerReviewed !== true
    || facialRuntimeEvidence.packagePresentation?.normalKeeperReviewed !== true
    || facialRuntimeEvidence.packagePresentation?.visibleFallbackReviewed !== false
    || facialRuntimeEvidence.packagePresentation?.inputDrivenStoryReviewed !== false
    || facialRuntimeEvidence.packagePresentation?.headlessSmokeRunAfterV2 !== false
    || facialRuntimeEvidence.packagePresentation?.finalArt !== false
    || facialRuntimeEvidence.packagePresentation?.finalActing !== false
    || facialRuntimeEvidence.packagePresentation?.finalVoice !== false
    || facialRuntimeEvidence.compiledSourceSnapshot?.length !== 7
    || finalSelectedFacialSuite?.status !== "pass"
    || finalSelectedFacialSuite?.filter !== "SHI.Cinematic.CouncilFacialPerformanceV1"
    || finalSelectedFacialSuite?.discovered !== 1
    || finalSelectedFacialSuite?.passed !== 1
    || finalSelectedFacialSuite?.failed !== 0
    || finalSelectedFacialSuite?.exitCode !== 0
    || finalFullSuite?.status !== "pass"
    || finalFullSuite?.filter !== "SHI."
    || finalFullSuite?.discovered !== 20
    || finalFullSuite?.started !== 20
    || finalFullSuite?.passed !== 20
    || finalFullSuite?.failed !== 0
    || finalFullSuite?.exitCode !== 0
    || finalFullSuite?.tests?.length !== 20
    || finalFullSuite?.transientLog?.tracked !== false
    || finalFullSuite?.transientLog?.bytes !== 264740
    || finalFullSuite?.transientLog?.sha256
      !== "59ef74c18438bcc6bce1917b917537d15f4ecb5473e1c6c3ebadc19c312e5ea6")
  errors.push("Daze council facial runtime evidence does not prove the final 20/20 native and bounded packaged-visible engineering review");
if (facialRuntimeContract?.characters !== 5
    || facialRuntimeContract?.roles?.join(",") !== "listener,speaker"
    || facialRuntimeContract?.states?.join(",")
      !== "neutral,blink,object-glance,interrupted-return,silent-speech,held-breath"
    || facialRuntimeContract?.morphTargets !== 21
    || facialRuntimeContract?.cycleSeconds !== 4
    || facialRuntimeContract?.deterministic !== true
    || facialRuntimeContract?.languageNeutral !== true
    || facialRuntimeContract?.silentIntentCadence !== true
    || facialRuntimeContract?.audioDriven !== false
    || facialRuntimeContract?.transcriptDriven !== false
    || facialRuntimeContract?.phonemeDriven !== false
    || facialRuntimeContract?.randomized !== false
    || facialRuntimeContract?.gameplayAuthority !== false
    || facialRuntimeContract?.saveAuthority !== false
    || facialRuntimeContract?.interactionAuthority !== false
    || facialRuntimeContract?.replicated !== false
    || facialRuntimeContract?.reducedMotionSupported !== true
    || facialRuntimeContract?.wideAndMediumFramingOnly !== true
    || facialRuntimeContract?.closeFramingApproved !== false
    || facialRuntimeContract?.finalFace !== false
    || facialRuntimeContract?.finalActing !== false
    || facialRuntimeContract?.finalVoice !== false)
  errors.push("Daze council facial runtime evidence overstates or drifts from its deterministic non-authoritative non-final contract");
if (facialRuntimeGates?.nativeEditorBuild !== "pass"
    || facialRuntimeGates?.selectedFacialAutomation !== "pass-1-of-1"
    || facialRuntimeGates?.fullProjectAutomation !== "pass-20-of-20"
    || facialRuntimeGates?.packagedBuildWithFacialAssets !== "pass-v2-559-cooked-packages"
    || facialRuntimeGates?.packagedHeadlessSmoke !== "not-run-after-v2"
    || facialRuntimeGates?.visibleNoVncReview !== "pass-three-development-review-runs-six-frames"
    || facialRuntimeGates?.inputDrivenStoryPlaytest !== "not-run-for-this-facial-build"
    || facialRuntimeGates?.reducedMotionVisibleReview !== "pass-engineering-only"
    || facialRuntimeGates?.visibleFallbackReview !== "not-run"
    || facialRuntimeGates?.physicalDisplayReview !== "not-run"
    || facialRuntimeGates?.humanAnimationHistoricalCulturalAccessibilityReview !== "required"
    || facialRuntimeGates?.finalCloseDialogue !== "rejected"
    || facialRuntimeGates?.voiceOrLipSync !== "not-admitted")
  errors.push("Daze council facial runtime release gates do not preserve the open smoke/story/fallback/human/final-art boundary");

const expectedFacialPackageArtifacts = [
  ["SHI.sh", 218, "7eeb214781ca5113696ae2be6c5124b5404cd4abcd1fff39aa383ba15ff1cf1e"],
  ["SHI/Binaries/Linux/SHI", 298709552, "5e08896235d3e4aed403295abd7c27aefd6ec41fd8f928e5bd3ac60887308316"],
  ["SHI/Content/Paks/SHI-Linux.pak", 10428583, "6f2adad6fa4b76624a2cb44ce48cde04cc01b8aded453583627cabfc86f828e4"],
  ["SHI/Content/Paks/SHI-Linux.ucas", 170413024, "939764152cbaffd87c4a488febe9a42221fcac13a49e924eda87db77bd1fd378"],
  ["SHI/Content/Paks/SHI-Linux.utoc", 155892, "5d36d466a17b763d3ad34a8ec3af161e61937eb808d3f11752483763259ef7b1"],
];
const facialPackage = facialPresentationEvidence.package;
if (facialPackage?.artifacts?.length !== expectedFacialPackageArtifacts.length) {
  errors.push("Daze council facial package receipt must retain the launcher, executable, Pak, Ucas and Utoc artifacts");
} else {
  for (let index = 0; index < expectedFacialPackageArtifacts.length; index += 1) {
    const [relativePath, bytes, sha256] = expectedFacialPackageArtifacts[index];
    const artifact = facialPackage.artifacts[index];
    if (artifact.relativePath !== relativePath || artifact.bytes !== bytes || artifact.sha256 !== sha256)
      errors.push(`Daze council facial v2 package artifact receipt drifted: ${relativePath}`);
  }
}

const expectedFacialVisibleLogs = [
  {
    reviewId: "speaker-normal", reviewFlag: "-ShiCouncilCharacterReviewSpeaker", reducedMotion: false,
    override: "ReducedMotion=False", alpha: 0.0624,
    visibleCharacterId: "chen-sheng", visibleRole: "speaker", bytes: 123520,
    sha256: "0862e56cb4763ee9e1ce6d947498d78b57985064853060d4d721c2f4456de34c",
  },
  {
    reviewId: "speaker-reduced", reviewFlag: "-ShiCouncilCharacterReviewSpeaker", reducedMotion: true,
    override: "ReducedMotion=True", alpha: 1.0,
    visibleCharacterId: "chen-sheng", visibleRole: "speaker", bytes: 123524,
    sha256: "3ebd6978b0ccf7dc5f005360a4c4240d1a3c4c9838c266d20f75359269f4868c",
  },
  {
    reviewId: "keeper-normal", reviewFlag: "-ShiCouncilCharacterReviewKeeper", reducedMotion: false,
    override: "ReducedMotion=False", alpha: 0.1218,
    visibleCharacterId: "keeper", visibleRole: "listener", bytes: 123545,
    sha256: "ccf6ebb5df49fbd4c5b04b63ff97ccd64fb1348e8fd95c3ae705c6b060d420a4",
  },
];
const facialVisiblePlaytest = facialPresentationEvidence.visiblePlaytest;
if (facialVisiblePlaytest?.runtimeLogs?.length !== expectedFacialVisibleLogs.length) {
  errors.push("Daze council facial visible evidence must retain normal speaker, reduced speaker and normal keeper log receipts");
} else {
  for (let index = 0; index < expectedFacialVisibleLogs.length; index += 1) {
    const expected = expectedFacialVisibleLogs[index];
    const log = facialVisiblePlaytest.runtimeLogs[index];
    const scan = log.scan;
    const shutdown = log.shutdown;
    if (log.reviewId !== expected.reviewId || log.reviewFlag !== expected.reviewFlag
        || log.reducedMotion !== expected.reducedMotion
        || log.commandLineReducedMotionOverride !== expected.override
        || log.commandLineOverrideObserved !== true
        || log.visibleCharacterId !== expected.visibleCharacterId || log.visibleRole !== expected.visibleRole
        || log.tracked !== false || log.bytes !== expected.bytes || log.sha256 !== expected.sha256
        || scan?.runtimeAdmissionMarkers !== 2 || scan?.morphSectionExerciseMarkers !== 1
        || scan?.visibleRoleExerciseMarker !== true || scan?.neutralFallbackWarnings !== 0
        || scan?.visibleRoleExerciseAlpha !== expected.alpha
        || scan?.cadenceFailClosedErrors !== 0 || scan?.morphUsageRepairWarnings !== 0
        || scan?.defaultMaterialFallbackWarnings !== 0 || scan?.fatalErrors !== 0
        || scan?.unhandledExceptions !== 0 || scan?.assertionFailures !== 0 || scan?.passed !== true
        || shutdown?.method !== "controlled SIGTERM after evidence capture"
        || shutdown?.processReturnCode !== 143 || shutdown?.unrealPreparingToExit !== true
        || shutdown?.unrealGameEngineShutDown !== true || shutdown?.unrealObjectSubsystemClosed !== true
        || shutdown?.unrealExiting !== true || shutdown?.cleanUnrealShutdown !== true)
      errors.push(`Daze council facial visible runtime log or controlled-shutdown receipt drifted: ${expected.reviewId}`);
  }
}

for (const screenshot of facialPresentationEvidence.screenshots ?? []) {
  await verifyFacialReceipt(root, screenshot, "Daze council facial packaged screenshot");
  if (screenshot.dimensions?.join(",") !== "1600,1000")
    errors.push(`Daze council facial packaged screenshot dimensions drifted: ${screenshot.file}`);
}
const facialPresentation = facialPresentationEvidence.presentation;
const rejectedFacialPass = facialPresentationEvidence.review?.rejectedFirstPass;
const remainingFacialGates = facialPresentationEvidence.review?.remainingRedGates ?? [];
if (facialPresentationEvidence.assetId !== facialAssetId
    || facialPresentationEvidence.decision !== facialPresentationDecision
    || facialPresentationEvidence.requiredDisclosure !== facialDisclosure
    || facialPresentation?.characterIds?.join(",") !== facialCharacterIds.join(",")
    || facialPresentation?.roles?.join(",") !== "listener,speaker"
    || facialPresentation?.states?.join(",")
      !== "neutral,blink,object-glance,interrupted-return,silent-speech,held-breath"
    || facialPresentation?.sharedSkeletonBones !== 53
    || facialPresentation?.morphTargetsPerMesh !== 21
    || facialPresentation?.morphSectionMaterials?.join(",") !== facialMorphSectionMaterials.join(",")
    || facialPresentation?.allFifteenMaterialsSavedForSkeletalMeshUsage !== true
    || facialPresentation?.exactTwoMaterialsSavedForMorphTargetUsage !== true
    || facialPresentation?.deterministic !== true || facialPresentation?.languageNeutral !== true
    || facialPresentation?.silentIntentCadence !== true || facialPresentation?.audioDriven !== false
    || facialPresentation?.transcriptDriven !== false || facialPresentation?.phonemeDriven !== false
    || facialPresentation?.randomized !== false || facialPresentation?.gameplayAuthority !== false
    || facialPresentation?.saveAuthority !== false || facialPresentation?.interactionAuthority !== false
    || facialPresentation?.replicated !== false || facialPresentation?.reducedMotionSupported !== true
    || facialPresentation?.wideAndMediumFramingOnly !== true || facialPresentation?.closeFramingApproved !== false
    || facialPresentation?.visibleFallbackReviewed !== false || facialPresentation?.finalFace !== false
    || facialPresentation?.finalActing !== false || facialPresentation?.finalVoice !== false
    || facialPresentation?.developmentReview?.excludedFromShipping !== true
    || facialPackage?.result !== "BUILD SUCCESSFUL" || facialPackage?.exitCode !== 0
    || facialPackage?.outsideGitRoot !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || facialPackage?.alwaysCookPath !== "/Game/SHI/Art/Characters/DazeCouncilFacial"
    || facialPackage?.priorAcceptedPackageCount !== 538 || facialPackage?.addedPackageCount !== 21
    || facialPackage?.cookedPackageCount !== 559 || facialPackage?.platformSkippedPackageCount !== 7
    || facialPackage?.totalCookCandidates !== 566 || facialPackage?.translatedMaterials !== 15
    || facialPackage?.cookErrors !== 0 || facialPackage?.cookWarnings !== 0
    || facialPackage?.headlessSmoke?.status !== "not-run-after-v2"
    || facialPackage?.headlessSmoke?.claim !== false
    || facialPresentationEvidence.automation?.discovered !== 20
    || facialPresentationEvidence.automation?.started !== 20
    || facialPresentationEvidence.automation?.passed !== 20
    || facialPresentationEvidence.automation?.failed !== 0
    || facialPresentationEvidence.automation?.exitCode !== 0
    || facialPresentationEvidence.automation?.newSuite !== "SHI.Cinematic.CouncilFacialPerformanceV1"
    || facialPresentationEvidence.screenshots?.length !== 6
    || facialVisiblePlaytest?.resolution?.join(",") !== "1600,1000"
    || facialVisiblePlaytest?.package !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || facialVisiblePlaytest?.developmentReviewOnly !== true
    || facialVisiblePlaytest?.inputDrivenStoryPlaytest !== "not-run-for-this-facial-package-review"
    || facialVisiblePlaytest?.visibleFallbackReview !== "not-run"
    || facialVisiblePlaytest?.speakerNormalReviewed !== true
    || facialVisiblePlaytest?.speakerReducedMotionReviewed !== true
    || facialVisiblePlaytest?.keeperNormalReviewed !== true
    || facialVisiblePlaytest?.reducedTerminalNeutralObservedAfterClampedPass !== true
    || facialVisiblePlaytest?.brownEyeAndSkinMaterialsRenderedWithoutDefaultMaterialFallback !== true
    || facialVisiblePlaytest?.materialOrLoadWarnings !== 0
    || rejectedFacialPass?.package !== "SHI-Builds-DazeCouncilFacialPerformance-Review-v1/Linux"
    || rejectedFacialPass?.log?.tracked !== false || rejectedFacialPass?.log?.bytes !== 123977
    || rejectedFacialPass?.log?.sha256 !== "a0bd14d1589ec4958eab87350bc4c59e0e5dd6c2df342a5a393ad87909188946"
    || rejectedFacialPass?.log?.morphUsageRepairWarnings !== 2
    || rejectedFacialPass?.log?.defaultMaterialFallbackWarnings !== 2
    || !remainingFacialGates.some((gate) => gate.includes("generic face"))
    || !remainingFacialGates.some((gate) => gate.includes("headless smoke"))
    || !remainingFacialGates.some((gate) => gate.includes("voice, lip sync"))
    || !remainingFacialGates.some((gate) => gate.includes("human animation")))
  errors.push("Daze council facial package, visible, rejection-history or explicit non-final red-gate evidence is incomplete");

const skinAssetId = "shi-daze-council-skin-lookdev-v1";
const skinDestination = "/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1";
const skinDisclosure = "CHEN SHENG SKIN LOOKDEV V1 · DRAMATIC CASTING, NOT A HISTORICAL LIKENESS OR COMPLEXION CLAIM · NOT HUMAN-APPROVED FINAL ART OR CLOSE-CAMERA AUTHORITY";
const skinProvenanceDisclosure = "CHEN SHENG SKIN MATERIAL LOOKDEV · GENERIC DRAMATIC CASTING · NOT A HISTORICAL LIKENESS · NOT FINAL CHARACTER ART";
const skinPrivacyRevision = "privacy-v11-base-asset-import-data-sanitized";
const skinPrivacyImportRootSha256 = "2a5b64796c446d1328c1c10cf17aa98e4ea5d12b1ff1c931277a4bc0eedd65f1";
const skinPrivacyImportReceipt = {
  bytes: 41086,
  sha256: "c80a07a63c56e4c486a65c3bbaa8e000fe9ad616ebb7037551a378c7657504c2",
};
const skinPrivacyImporterReceipt = {
  file: "scripts/import-daze-council-skin-lookdev-unreal.py",
  bytes: 75871,
  sha256: "ff9f67fb9bd797e3504ab528eccba0ae6ba456cf22e32079df16d08485e52242",
};
const skinProvenancePath = resolve(root, "assets/provenance/shi-daze-council-skin-lookdev-v1.json");
const skinMetricsPath = resolve(root, "assets/3d/source/shi-daze-council-skin-lookdev-v1.metrics.json");
const skinValidationPath = resolve(root, "assets/3d/source/shi-daze-council-skin-lookdev-v1.validation.json");
const skinImportEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json");
const skinRuntimeEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-skin-lookdev-runtime-status.json");
const skinPresentationEvidencePath = resolve(root, "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json");
const skinProvenance = await readFacialJson(skinProvenancePath, "Daze council skin lookdev provenance");
const skinMetrics = await readFacialJson(skinMetricsPath, "Daze council skin lookdev metrics");
const skinValidation = await readFacialJson(skinValidationPath, "Daze council skin lookdev validation");
const skinImportEvidence = await readFacialJson(skinImportEvidencePath, "Daze council skin lookdev Unreal import evidence");
const skinRuntimeEvidence = await readFacialJson(skinRuntimeEvidencePath, "Daze council skin lookdev Unreal runtime evidence");
const skinPresentationEvidence = await readFacialJson(skinPresentationEvidencePath, "Daze council skin lookdev Unreal presentation evidence");

const expectedSkinSourceFiles = [
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-basecolor-2k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-masks-2k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-height-1k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1.metrics.json",
  "assets/3d/source/shi-daze-council-skin-lookdev-v1.validation.json",
];
if (skinProvenance.assetId !== skinAssetId
    || skinProvenance.characterId !== "chen-sheng"
    || skinProvenance.status !== "source-review-candidate-only-not-engine-admitted-not-final-not-human-approved"
    || skinProvenance.disclosure !== skinProvenanceDisclosure
    || skinProvenance.engineImportEvidence !== "../../docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json"
    || skinProvenance.engineRuntimeEvidence !== "../../docs/production/evidence/unreal-daze-council-skin-lookdev-runtime-status.json"
    || skinProvenance.authorship?.method !== "deterministic SHI-authored procedural fields"
    || Object.entries(skinProvenance.authorship ?? {}).some(([key, value]) => key !== "method" && value !== false))
  errors.push("Daze council skin provenance weakens its deterministic, non-neural, non-portrait source boundary");
const skinEngineeringAdmission = skinProvenance.engineEngineeringAdmission;
if (skinEngineeringAdmission?.status !== "passed-privacy-v11-path-sanitized-v5-package-normal-reduced-v6-runtime-engineering-only-watched-visual-rejected"
    || skinEngineeringAdmission?.revision !== skinPrivacyRevision
    || skinEngineeringAdmission?.destination !== skinDestination
    || skinEngineeringAdmission?.trackedAssets !== 5
    || skinEngineeringAdmission?.subsurfaceProfiles !== 1
    || skinEngineeringAdmission?.materials !== 1
    || skinEngineeringAdmission?.textures !== 3
    || skinEngineeringAdmission?.canonicalHeightImported !== false
    || skinEngineeringAdmission?.chenShengOnly !== true
    || skinEngineeringAdmission?.optInReviewFlag !== "-ShiCouncilSkinLookdevReview"
    || skinEngineeringAdmission?.acceptedFacialAssetsPreserved !== true
    || skinEngineeringAdmission?.readOnlyInspectionPassed !== true
    || skinEngineeringAdmission?.embeddedSourceContractFileReceiptsAreImportTimeSnapshot !== true
    || skinEngineeringAdmission?.embeddedSourceContractFileReceiptsAreNotCurrentCrossReceipts !== true
    || skinEngineeringAdmission?.immutableImportReceiptRootSha256 !== skinPrivacyImportRootSha256
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.status !== "pass-current-five-uassets-private-absolute-paths-absent"
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.exactFiveAssetsScanned !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.threeTextureAssetsUseBaseAssetImportData !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.threeTextureAssetsRetainRelativeFilenameAndSourceBasename !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.materialAndProfileHaveNoSourceIdentity !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.interchangeAssetImportDataAbsentFromAllFive !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.privateAbsolutePathsAbsentFromAllFive !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.readOnlyRenderedInspectionPassed !== true
    || skinEngineeringAdmission?.embeddedMetadataPrivacy?.trackedHashesUnchangedDuringInspection !== true
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.source !== "MaterialMasks2K.B"
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.sourceByte !== 89
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.value !== 89 / 255
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.thresholdExclusive !== 0.1
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.maximum !== 89 / 255
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.profileMeanFreePathDistance !== 2.6748
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.effectiveMeanFreePath !== 0.9335576470588234
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.maximumEffectiveMeanFreePath !== 0.9335576470588234
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.materialInput !== "MP_OPACITY"
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.opacityConnected !== true
    || skinEngineeringAdmission?.subsurfaceProfileOpacity?.subsurfaceColorInput !== "unconnected"
    || skinEngineeringAdmission?.packageExercise !== true
    || skinEngineeringAdmission?.runtimeMarkersObserved !== true
    || skinEngineeringAdmission?.runtimeRouteExercise !== true
    || skinEngineeringAdmission?.packageRuntimeEvidenceRevision !== "privacy-v11-path-sanitized-package-v5-current-with-normal-reduced-v6-raw-capture-proof"
    || skinEngineeringAdmission?.currentPrivacyV11PackageExercise !== true
    || skinEngineeringAdmission?.currentPrivacyV11RuntimeRouteExercise !== true
    || skinEngineeringAdmission?.currentPrivacyV11PackageRefreshPending !== false
    || skinEngineeringAdmission?.packageExecutableDebugSymbolPathSanitizationPassed !== true
    || skinEngineeringAdmission?.normalAndReducedRawCaptureTimingPassed !== true
    || skinEngineeringAdmission?.supersededCorrectedV3HistoryRetained !== true
    || skinEngineeringAdmission?.rejectedPrivacyV4HistoryRetained !== true
    || skinEngineeringAdmission?.watchedDeformationReview !== false
    || skinEngineeringAdmission?.watchedVisualReviewPerformed !== true
    || skinEngineeringAdmission?.currentVisualArtAdmission !== false
    || skinEngineeringAdmission?.closeCameraApproved !== false
    || skinEngineeringAdmission?.humanReviewApproved !== false
    || skinEngineeringAdmission?.finalCharacterArt !== false)
  errors.push("Daze council skin provenance omits the privacy-v11 import boundary, retained corrected-v3 engineering evidence or visual red gates");
const skinReviewStatus = skinProvenance.reviewStatus;
if (skinReviewStatus?.automatedSourceValidation !== "passed"
    || skinReviewStatus?.engineAdmission !== false
    || !skinProvenance.reviewStatusSemantics?.engineAdmission?.includes("privacy-v11 import/package/runtime engineering evidence")
    || skinReviewStatus?.packageExercise !== false
    || skinReviewStatus?.watchedDeformationReview !== false
    || skinReviewStatus?.humanCharacterAnatomyApproval !== false
    || skinReviewStatus?.humanHistoricalCulturalApproval !== false
    || skinReviewStatus?.humanCinematicColorApproval !== false
    || skinReviewStatus?.humanAccessibilityApproval !== false
    || skinReviewStatus?.finalCharacterArt !== false)
  errors.push("Daze council skin source review status promotes privacy-v11 or retained corrected-v3 engineering work into visual, human-review or final-art authority");
await verifyFacialReceipt(resolve(root, "assets/provenance"), skinProvenance.enginePresentationEvidence,
  "Daze council privacy-v11 provenance-to-presentation evidence");
const rejectedV1ProvenanceReference = skinProvenance.rejectedV1PresentationHistoryReference;
if (rejectedV1ProvenanceReference?.originalLogicalFile
      !== "../../docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json"
    || rejectedV1ProvenanceReference?.tracked !== false
    || rejectedV1ProvenanceReference?.retainedPayload !== false
    || rejectedV1ProvenanceReference?.currentHistoryContainer
      !== "../../docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json"
    || rejectedV1ProvenanceReference?.currentHistorySection
      !== "reviewHistory.rejectedV1MaterialPackageAndScreens")
  errors.push("Daze council rejected-v1 provenance history reference is not explicitly non-retained");
if (skinProvenance.rejectedV1History?.status !== "rejected-diagnostic-only-superseded-by-corrected-v2-opacity-package-runtime-engineering-route"
    || !skinProvenance.rejectedV1History?.graphDefect?.includes("MP_OPACITY remained unconnected at default 1.0")
    || skinProvenance.rejectedV1History?.visualDecision !== "rejected-orange-bright-waxy-smooth-no-replication"
    || skinProvenance.rejectedV1History?.packageAndRuntimeReceiptsRetainedAsDiagnostics !== true
    || skinProvenance.rejectedV1History?.materialEngineeringAdmission !== false)
  errors.push("Daze council skin provenance loses the explicit rejected v1 graph and visual history");
if (skinProvenance.supersededCorrectedV3History?.status
      !== "superseded-historical-engineering-evidence-only-pre-privacy-v11-watched-visual-rejected"
    || !skinProvenance.supersededCorrectedV3History?.reason?.includes("Path-leaking privacy v4 is rejected history")
    || !skinProvenance.supersededCorrectedV3History?.reason?.includes("path-sanitized v5 package and normal/reduced v6 runtime receipts are current")
    || skinProvenance.supersededCorrectedV3History?.currentPackageAuthority !== false
    || skinProvenance.rejectedPrivacyV4History?.status
      !== "rejected-for-public-package-workstation-path-leak-diagnostic-engineering-history-only"
    || skinProvenance.rejectedPrivacyV4History?.packagePrivacyAdmission !== false
    || skinProvenance.rejectedPrivacyV4History?.currentPackageAuthority !== false)
  errors.push("Daze council skin provenance confuses superseded v3/path-leaking v4 with current v5/v6 evidence");
if (!sameStringSet(skinProvenance.sourceOutputs?.map((item) => item.file), expectedSkinSourceFiles))
  errors.push("Daze council skin provenance does not retain the exact six source outputs");
for (const receipt of skinProvenance.sourceOutputs ?? [])
  await verifyFacialReceipt(root, receipt, "Daze council skin source output");
for (const tool of [
  skinProvenance.toolchain?.generator,
  skinProvenance.toolchain?.validator,
  skinProvenance.toolchain?.unrealImporter,
]) await verifyFacialReceipt(root, tool, "Daze council skin tool");
await verifyFacialReceipt(root, skinProvenance.sourceCharacter, "Daze council skin accepted source character");
await verifyFacialReceipt(root, skinProvenance.automatedValidation, "Daze council skin automated source validation");

if (skinMetrics.assetId !== skinAssetId || skinMetrics.characterId !== "chen-sheng"
    || skinMetrics.status !== "deterministic-procedural-source-review-candidate-not-engine-admitted-not-final"
    || skinMetrics.authorship?.method !== "deterministic SHI-authored procedural fields"
    || skinMetrics.authorship?.neuralGeneration !== false
    || skinMetrics.authorship?.generatedImagePixelsSampled !== false
    || skinMetrics.authorship?.privateReferencePixelsSampled !== false
    || skinMetrics.uv0?.accessorSha256 !== "f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6"
    || skinMetrics.uv0?.vertexCount !== 14517 || skinMetrics.uv0?.triangleCount !== 26756
    || skinMetrics.textureTier?.selectedDetailRepeat !== null)
  errors.push("Daze council skin metrics drift from the accepted UV0 and unselected source-review contract");
if (skinValidation.assetId !== skinAssetId || skinValidation.status !== "pass"
    || skinValidation.passed !== true
    || skinValidation.qualification !== "automated-source-validation-only-not-engine-admitted-not-final-not-human-approved"
    || skinValidation.files?.length !== 4
    || !everyCheckPassed(skinValidation.checks)
    || skinValidation.acceptedUpstream?.uv0Sha256 !== "f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6"
    || skinValidation.acceptedUpstream?.vertices !== 14517
    || skinValidation.acceptedUpstream?.triangles !== 26756)
  errors.push("Daze council skin source validation no longer proves the exact four-map deterministic candidate");

const expectedSkinAssetFiles = [
  "M_SHI_ChenSheng_SkinLookdevV1.uasset",
  "SP_SHI_ChenSheng_SkinLookdevV1.uasset",
  "T_SHI_ChenSheng_Skin_BaseColor_2K.uasset",
  "T_SHI_ChenSheng_Skin_DetailNormal_1K.uasset",
  "T_SHI_ChenSheng_Skin_Masks_2K.uasset",
];
const expectedSkinPrivacyUassets = {
  "M_SHI_ChenSheng_SkinLookdevV1.uasset": {
    bytes: 11579,
    sha256: "13d8dde823611bfd15ef8aae330cb109304a1621da0511518220bedcd51eb1f3",
    sourceIdentity: null,
  },
  "SP_SHI_ChenSheng_SkinLookdevV1.uasset": {
    bytes: 1913,
    sha256: "c730da3eddda2a67fe60a39ea8cf3d6b32b792afbc7a2318536cdd3af3c6512b",
    sourceIdentity: null,
  },
  "T_SHI_ChenSheng_Skin_BaseColor_2K.uasset": {
    bytes: 2113116,
    sha256: "54122ea3a81132a263c0a7d3541a8a534bc472313133359d85d3982716393c87",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-basecolor-2k.png",
  },
  "T_SHI_ChenSheng_Skin_DetailNormal_1K.uasset": {
    bytes: 1532856,
    sha256: "6378f416c33ca89161479c3cde2584a7958a623fa5a9c348f344873a2934e7bc",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png",
  },
  "T_SHI_ChenSheng_Skin_Masks_2K.uasset": {
    bytes: 1472351,
    sha256: "392ddda8ce0af8b8821116682081234ce680e04899e78722b39331e87a216ee8",
    sourceIdentity: "assets/3d/source/shi-daze-council-skin-lookdev-v1-masks-2k.png",
  },
};
if (!sameStringSet(Object.keys(skinEngineeringAdmission?.trackedUassetReceipts ?? {}), expectedSkinAssetFiles)
    || Object.entries(expectedSkinPrivacyUassets).some(([file, expected]) =>
      skinEngineeringAdmission?.trackedUassetReceipts?.[file]?.bytes !== expected.bytes
      || skinEngineeringAdmission?.trackedUassetReceipts?.[file]?.sha256 !== expected.sha256)
    || skinProvenance.toolchain?.unrealImporter?.file !== skinPrivacyImporterReceipt.file
    || skinProvenance.toolchain?.unrealImporter?.bytes !== skinPrivacyImporterReceipt.bytes
    || skinProvenance.toolchain?.unrealImporter?.sha256 !== skinPrivacyImporterReceipt.sha256)
  errors.push("Daze council skin provenance omits the exact privacy-v11 importer or five uasset receipts");
const expectedSkinTexturePaths = {
  baseColor: `${skinDestination}/T_SHI_ChenSheng_Skin_BaseColor_2K.T_SHI_ChenSheng_Skin_BaseColor_2K`,
  materialMasks: `${skinDestination}/T_SHI_ChenSheng_Skin_Masks_2K.T_SHI_ChenSheng_Skin_Masks_2K`,
  detailNormal: `${skinDestination}/T_SHI_ChenSheng_Skin_DetailNormal_1K.T_SHI_ChenSheng_Skin_DetailNormal_1K`,
};
if (skinImportEvidence.assetId !== skinAssetId
    || skinImportEvidence.status !== "isolated Chen Sheng skin material lookdev; source-review candidate, not final skin or close-camera authority"
    || skinImportEvidence.mode !== "import-replace"
    || skinImportEvidence.mutationEnvironment !== "SHI_DAZE_COUNCIL_SKIN_LOOKDEV_REIMPORT"
    || skinImportEvidence.mutationAuthorized !== true
    || skinImportEvidence.saved !== true || skinImportEvidence.passed !== true
    || skinImportEvidence.engineVersion !== "5.8.1-56057345+++UE5+Release-5.8"
    || skinImportEvidence.destination !== skinDestination
    || skinImportEvidence.sourceContract?.passed !== true
    || !everyCheckPassed(skinImportEvidence.sourceContract?.checks)
    || skinImportEvidence.sourceContract?.provenance?.importTimeSnapshot !== true
    || skinImportEvidence.sourceContract?.provenance?.currentCrossReceipts !== false
    || !skinImportEvidence.sourceContract?.provenance?.snapshotBoundary?.includes("captured by the authorized import run")
    || !skinImportEvidence.sourceContract?.provenance?.snapshotBoundary?.includes("must not be verified as current mutable-path cross-receipts")
    || skinImportEvidence.authorityBoundary?.reviewOnly !== true
    || skinImportEvidence.authorityBoundary?.chenShengOnly !== true
    || Object.entries(skinImportEvidence.authorityBoundary ?? {}).some(([key, value]) => !["reviewOnly", "chenShengOnly"].includes(key) && value !== false))
  errors.push("Daze council skin import evidence does not prove the explicitly authorized Chen-only non-authoritative admission");

const expectedSkinTextureContracts = {
  baseColor: {path: expectedSkinTexturePaths.baseColor, dimensions: "2048,2048", srgb: true, compression: "TC_BC7", address: "TA_CLAMP", group: "TEXTUREGROUP_CHARACTER"},
  materialMasks: {path: expectedSkinTexturePaths.materialMasks, dimensions: "2048,2048", srgb: false, compression: "TC_MASKS", address: "TA_CLAMP", group: "TEXTUREGROUP_CHARACTER"},
  detailNormal: {path: expectedSkinTexturePaths.detailNormal, dimensions: "1024,1024", srgb: false, compression: "TC_NORMALMAP", address: "TA_WRAP", group: "TEXTUREGROUP_CHARACTER_NORMAL_MAP"},
};
for (const [role, expected] of Object.entries(expectedSkinTextureContracts)) {
  const texture = skinImportEvidence.textureImports?.[role];
  if (texture?.role !== role || texture?.assetPath !== expected.path
      || texture?.dimensions?.join(",") !== expected.dimensions || texture?.srgb !== expected.srgb
      || texture?.compression !== expected.compression || texture?.addressX !== expected.address
      || texture?.addressY !== expected.address || texture?.textureGroup !== expected.group
      || texture?.passed !== true || !everyCheckPassed(texture?.checks))
    errors.push(`Daze council skin Unreal texture contract drifted: ${role}`);
  await verifyFacialReceipt(root, texture?.source, `Daze council skin ${role} source`);
}
const skinHeightSource = skinImportEvidence.canonicalHeightSource;
if (skinHeightSource?.receipt?.file !== "assets/3d/source/shi-daze-council-skin-lookdev-v1-detail-height-1k.png"
    || skinHeightSource?.pngHeader?.width !== 1024 || skinHeightSource?.pngHeader?.height !== 1024
    || skinHeightSource?.pngHeader?.bitDepth !== 16 || skinHeightSource?.pngHeader?.colorType !== 0
    || skinHeightSource?.importedIntoEngine !== false || skinHeightSource?.passed !== true
    || !everyCheckPassed(skinHeightSource?.checks))
  errors.push("Daze council skin canonical 16-bit height source was imported or lost its source-only boundary");
await verifyFacialReceipt(root, skinHeightSource?.receipt, "Daze council skin canonical height source");

const skinProfile = skinImportEvidence.subsurfaceProfile;
if (skinProfile?.assetPath !== `${skinDestination}/SP_SHI_ChenSheng_SkinLookdevV1.SP_SHI_ChenSheng_SkinLookdevV1`
    || skinProfile?.passed !== true || !everyCheckPassed(skinProfile?.checks))
  errors.push("Daze council skin subsurface profile is absent or has drifted from its exact admitted settings");
const skinMaterial = skinImportEvidence.material;
if (skinMaterial?.assetPath !== `${skinDestination}/M_SHI_ChenSheng_SkinLookdevV1.M_SHI_ChenSheng_SkinLookdevV1`
    || skinMaterial?.profile !== skinProfile?.assetPath || skinMaterial?.nodeCount !== 7
    || skinMaterial?.nodeClasses?.join(",") !== "MaterialExpressionTextureCoordinate,MaterialExpressionTextureCoordinate,MaterialExpressionTextureSampleParameter2D,MaterialExpressionTextureSampleParameter2D,MaterialExpressionTextureSampleParameter2D,MaterialExpressionScalarParameter,MaterialExpressionScalarParameter"
    || skinMaterial?.textureParameters?.BaseColor2K?.texture !== expectedSkinTexturePaths.baseColor
    || skinMaterial?.textureParameters?.BaseColor2K?.samplerType !== "SAMPLERTYPE_COLOR"
    || skinMaterial?.textureParameters?.MaterialMasks2K?.texture !== expectedSkinTexturePaths.materialMasks
    || skinMaterial?.textureParameters?.MaterialMasks2K?.samplerType !== "SAMPLERTYPE_MASKS"
    || skinMaterial?.textureParameters?.DetailNormal1K?.texture !== expectedSkinTexturePaths.detailNormal
    || skinMaterial?.textureParameters?.DetailNormal1K?.samplerType !== "SAMPLERTYPE_NORMAL"
    || skinMaterial?.scalarParameters?.Metallic !== 0 || skinMaterial?.scalarParameters?.Specular !== 0.25
    || skinMaterial?.outputs?.opacity?.node !== "MaterialExpressionTextureSampleParameter2D"
    || skinMaterial?.outputs?.opacity?.output !== "B"
    || skinMaterial?.outputs?.subsurfaceColor?.node !== null
    || skinMaterial?.outputs?.subsurfaceColor?.output !== ""
    || skinMaterial?.subsurfaceProfileOpacity?.source !== "MaterialMasks2K.B"
    || skinMaterial?.subsurfaceProfileOpacity?.sourceByte !== 89
    || skinMaterial?.subsurfaceProfileOpacity?.value !== 89 / 255
    || skinMaterial?.subsurfaceProfileOpacity?.thresholdExclusive !== 0.1
    || skinMaterial?.subsurfaceProfileOpacity?.maximum !== 89 / 255
    || skinMaterial?.subsurfaceProfileOpacity?.profileMeanFreePathDistance !== 2.6748
    || skinMaterial?.subsurfaceProfileOpacity?.effectiveMeanFreePath !== 0.9335576470588234
    || skinMaterial?.subsurfaceProfileOpacity?.maximumEffectiveMeanFreePath !== 0.9335576470588234
    || skinMaterial?.subsurfaceProfileOpacity?.materialInput !== "MP_OPACITY"
    || skinMaterial?.subsurfaceProfileOpacity?.subsurfaceColorInput !== "unconnected"
    || skinMaterial?.subsurfaceProfileOpacity?.passed !== true
    || skinMaterial?.activeMaterialUsages?.join(",") !== "MATUSAGE_MORPH_TARGETS,MATUSAGE_SKELETAL_MESH"
    || skinMaterial?.compiledDuringThisRun !== true || skinMaterial?.compileErrors?.length !== 0
    || skinMaterial?.coreMaterialChecksPassed !== true || skinMaterial?.passed !== true
    || !everyCheckPassed(skinMaterial?.checks)
    || skinMaterial?.usedTextureInspection?.state !== "deferred-to-read-only-reload"
    || skinMaterial?.usedTextureInspection?.acceptedForCurrentMode !== true)
  errors.push("Daze council skin material graph, exact three parameters, compile or skeletal/morph usage contract drifted");

const skinReadOnlyInspection = skinImportEvidence.readOnlyInspection;
const skinReadOnlyTextureInspection = skinReadOnlyInspection?.usedTextureInspection;
if (skinReadOnlyInspection?.mode !== "inspect-only"
    || skinReadOnlyInspection?.mutationAuthorized !== false
    || skinReadOnlyInspection?.exitCode !== 0
    || skinReadOnlyInspection?.sourceContractPassed !== true
    || skinReadOnlyInspection?.allThreeTexturesPassed !== true
    || skinReadOnlyInspection?.subsurfaceProfilePassed !== true
    || skinReadOnlyInspection?.materialGraphAndCompilePassed !== true
    || skinReadOnlyInspection?.materialAdmissionPassed !== true
    || skinReadOnlyInspection?.usedTextureInspectionStrictPassed !== true
    || skinReadOnlyTextureInspection?.state !== "observed-strict-pass"
    || skinReadOnlyTextureInspection?.rawEntryCount !== 3
    || skinReadOnlyTextureInspection?.observedTexturePathCount !== 3
    || skinReadOnlyTextureInspection?.strictObservationPassed !== true
    || !everyCheckPassed(skinReadOnlyTextureInspection?.observationChecks)
    || skinReadOnlyInspection?.destinationInventoryPassed !== true
    || skinReadOnlyInspection?.canonicalHeightRemainedSourceOnly !== true
    || skinReadOnlyInspection?.acceptedFacialHashesUnchanged !== true
    || skinReadOnlyInspection?.trackedUassetHashesUnchanged !== true
    || skinReadOnlyInspection?.embeddedMetadataPrivacyPassed !== true
    || skinReadOnlyInspection?.overallPassed !== true || skinReadOnlyInspection?.passed !== true
    || skinReadOnlyInspection?.immutableImportReceiptRootSha256 !== skinPrivacyImportRootSha256
    || skinReadOnlyInspection?.canonicalImportReceiptRootPreserved !== true)
  errors.push("Daze council skin default read-only reload does not strictly prove three admitted textures, privacy-safe metadata and five unchanged uassets");

const skinDestinationInventory = skinImportEvidence.destinationInventory;
const expectedSkinInventory = {
  [`${skinDestination}/M_SHI_ChenSheng_SkinLookdevV1.M_SHI_ChenSheng_SkinLookdevV1`]: "Material",
  [`${skinDestination}/SP_SHI_ChenSheng_SkinLookdevV1.SP_SHI_ChenSheng_SkinLookdevV1`]: "SubsurfaceProfile",
  [expectedSkinTexturePaths.baseColor]: "Texture2D",
  [expectedSkinTexturePaths.detailNormal]: "Texture2D",
  [expectedSkinTexturePaths.materialMasks]: "Texture2D",
};
if (skinDestinationInventory?.passed !== true || !everyCheckPassed(skinDestinationInventory?.checks)
    || skinDestinationInventory?.assets?.length !== 5
    || !sameStringSet(Object.keys(skinDestinationInventory?.expected ?? {}), Object.keys(expectedSkinInventory))
    || Object.entries(expectedSkinInventory).some(([path, assetClass]) => skinDestinationInventory?.expected?.[path] !== assetClass))
  errors.push("Daze council skin registry inventory is not the exact isolated profile/material/three-texture set");
const trackedSkinAssets = skinImportEvidence.trackedUnrealAssets;
if (trackedSkinAssets?.root !== "apps/unreal/Content/SHI/Art/Characters/DazeCouncilSkinLookdevV1"
    || trackedSkinAssets?.passed !== true || !everyCheckPassed(trackedSkinAssets?.checks)
    || !sameStringSet(Object.keys(trackedSkinAssets?.receipts ?? {}), expectedSkinAssetFiles))
  errors.push("Daze council skin evidence does not retain exact receipts for five and only five isolated uassets");
const skinEmbeddedPrivacy = skinImportEvidence.embeddedMetadataPrivacy;
const commonSkinPrivacyChecks = [
  "repositoryAbsolutePathAbsent", "unixHomePathAbsent", "macUsersPathAbsent",
  "windowsForwardUsersPathAbsent", "windowsBackslashUsersPathAbsent",
  "absoluteInterchangeFactoryPathAbsent", "interchangeAssetImportDataAbsent",
];
const textureSkinPrivacyChecks = [
  "exactSourceAbsolutePathAbsent", "baseAssetImportDataPresent",
  "relativeFilenamePropertyPresent", "sourceBasenamePresent",
];
if (skinEmbeddedPrivacy?.passed !== true
    || skinEmbeddedPrivacy?.checks?.exactFiveAssetsScanned !== true
    || skinEmbeddedPrivacy?.checks?.allTrackedBinariesPrivatePathsAbsent !== true
    || !sameStringSet(Object.keys(skinEmbeddedPrivacy?.assets ?? {}), expectedSkinAssetFiles))
  errors.push("Daze council skin import evidence omits the exact top-level five-uasset embedded-metadata privacy pass");
for (const [file, expected] of Object.entries(expectedSkinPrivacyUassets)) {
  const receipt = trackedSkinAssets?.receipts?.[file];
  if (receipt?.bytes !== expected.bytes || receipt?.sha256 !== expected.sha256)
    errors.push(`Daze council skin privacy-v11 uasset receipt drifted: ${file}`);
  await verifyFacialReceipt(resolve(root, trackedSkinAssets?.root ?? ""), {file, ...receipt},
    "Tracked Unreal Daze council skin privacy-v11 asset");

  const privacy = skinEmbeddedPrivacy?.assets?.[file];
  const expectedCheckKeys = expected.sourceIdentity === null
    ? commonSkinPrivacyChecks
    : [...commonSkinPrivacyChecks, ...textureSkinPrivacyChecks];
  if (privacy?.sourceIdentity !== expected.sourceIdentity
      || privacy?.passed !== true
      || !sameStringSet(Object.keys(privacy?.checks ?? {}), expectedCheckKeys)
      || expectedCheckKeys.some((key) => privacy?.checks?.[key] !== true))
    errors.push(`Daze council skin embedded-metadata privacy contract drifted: ${file}`);

  const binaryPath = resolve(root, trackedSkinAssets?.root ?? "", file);
  try {
    const binary = await readFile(binaryPath);
    const text = binary.toString("latin1");
    const forbidden = ["/home/", "/Users/", "C:/Users/", "C:\\Users\\", "Factory_/", "InterchangeAssetImportData"];
    if (forbidden.some((token) => text.includes(token)))
      errors.push(`Daze council skin uasset embeds a forbidden private-path or Interchange token: ${file}`);
    if (expected.sourceIdentity === null) {
      if (text.includes("AssetImportData") || text.includes("RelativeFilename"))
        errors.push(`Daze council skin material/profile unexpectedly retains source identity metadata: ${file}`);
    } else if (!text.includes("AssetImportData")
        || !text.includes("RelativeFilename")
        || !text.includes(expected.sourceIdentity.split("/").at(-1))) {
      errors.push(`Daze council skin texture omits exact Base AssetImportData, relative filename or source basename: ${file}`);
    }
  } catch {
    errors.push(`Daze council skin privacy-v11 uasset could not be read: ${file}`);
  }
}

const acceptedFacialPreservation = skinImportEvidence.acceptedFacialPreservation;
const acceptedFacialReceipts = acceptedFacialPreservation?.before?.uassetReceipts ?? {};
const canonicalFacialReceipts = facialImportEvidence.trackedUnrealAssets?.receipts ?? {};
if (acceptedFacialPreservation?.before?.assetCount !== 21
    || acceptedFacialPreservation?.before?.passed !== true
    || !everyCheckPassed(acceptedFacialPreservation?.before?.checks)
    || acceptedFacialPreservation?.assetCountAfter !== 21
    || acceptedFacialPreservation?.uassetReceiptCountAfter !== 21
    || acceptedFacialPreservation?.passed !== true
    || !everyCheckPassed(acceptedFacialPreservation?.checks)
    || !sameStringSet(Object.keys(acceptedFacialReceipts), Object.keys(canonicalFacialReceipts))
    || Object.keys(canonicalFacialReceipts).some((file) => acceptedFacialReceipts[file]?.bytes !== canonicalFacialReceipts[file]?.bytes
      || acceptedFacialReceipts[file]?.sha256 !== canonicalFacialReceipts[file]?.sha256))
  errors.push("Daze council skin admission does not exactly preserve all 21 accepted facial uassets");

await verifyFacialReceipt(root, skinRuntimeEvidence.importAdmission?.evidence,
  "Daze council skin runtime-to-import evidence");
await verifyFacialReceipt(root, skinRuntimeEvidence.correctedPackageRuntimePresentation?.evidence,
  "Daze council skin runtime-to-corrected-presentation evidence");
const skinRuntimePrivacyRepair = skinRuntimeEvidence.privacyRepair;
if (skinRuntimePrivacyRepair?.status !== "pass-current-five-uassets-private-absolute-paths-absent"
    || skinRuntimePrivacyRepair?.revision !== skinPrivacyRevision
    || skinRuntimePrivacyRepair?.importer?.file !== skinPrivacyImporterReceipt.file
    || skinRuntimePrivacyRepair?.importer?.bytes !== skinPrivacyImporterReceipt.bytes
    || skinRuntimePrivacyRepair?.importer?.sha256 !== skinPrivacyImporterReceipt.sha256
    || skinRuntimePrivacyRepair?.immutableImportReceiptRootSha256 !== skinPrivacyImportRootSha256
    || skinRuntimePrivacyRepair?.exactFiveAssetsScanned !== true
    || skinRuntimePrivacyRepair?.threeTextureAssetsUseBaseAssetImportData !== true
    || skinRuntimePrivacyRepair?.threeTextureAssetsRetainRelativeFilenameAndSourceBasename !== true
    || skinRuntimePrivacyRepair?.materialAndProfileHaveNoSourceIdentity !== true
    || skinRuntimePrivacyRepair?.interchangeAssetImportDataAbsentFromAllFive !== true
    || skinRuntimePrivacyRepair?.privateAbsolutePathsAbsentFromAllFive !== true
    || skinRuntimePrivacyRepair?.readOnlyRenderedInspectionPassed !== true
    || skinRuntimePrivacyRepair?.trackedHashesUnchangedDuringInspection !== true
    || skinRuntimePrivacyRepair?.freshPackagePending !== false
    || skinRuntimePrivacyRepair?.currentPrivacyV11PackageAndRuntimePassed !== true
    || !sameStringSet(Object.keys(skinRuntimePrivacyRepair?.trackedUassetReceipts ?? {}), expectedSkinAssetFiles)
    || Object.entries(expectedSkinPrivacyUassets).some(([file, expected]) =>
      skinRuntimePrivacyRepair?.trackedUassetReceipts?.[file]?.bytes !== expected.bytes
      || skinRuntimePrivacyRepair?.trackedUassetReceipts?.[file]?.sha256 !== expected.sha256))
  errors.push("Daze council skin runtime evidence omits the exact privacy-v11 repair, importer and five binary receipts");
const expectedSkinCompiledFiles = [
  "apps/unreal/Source/SHI/ShiCouncilSkinLookdevModel.h",
  "apps/unreal/Source/SHI/ShiCouncilSkinLookdevModel.cpp",
  "apps/unreal/Source/SHI/ShiCouncilFigure.h",
  "apps/unreal/Source/SHI/ShiCouncilFigure.cpp",
  "apps/unreal/Source/SHI/ShiGameMode.h",
  "apps/unreal/Source/SHI/ShiGameMode.cpp",
  "apps/unreal/Source/SHI/Private/Tests/ShiCouncilSkinLookdevAutomationTest.cpp",
  "apps/unreal/Config/DefaultGame.ini",
];
if (!sameStringSet(skinRuntimeEvidence.compiledSourceSnapshot?.map((item) => item.file), expectedSkinCompiledFiles))
  errors.push("Daze council skin runtime evidence omits one or more compiled/configured source receipts");
for (const receipt of skinRuntimeEvidence.compiledSourceSnapshot ?? [])
  await verifyFacialReceipt(root, receipt, "Daze council skin compiled source snapshot");
const skinNativeBuild = skinRuntimeEvidence.nativeBuild;
const selectedSkinSuite = skinRuntimeEvidence.automation?.selectedSkinLookdevSuite;
const fullSkinSuite = skinRuntimeEvidence.automation?.fullShiNamespace;
const expectedSkinTests = [
  "SHI.Audio.ProceduralContractV1", "SHI.Campaign.CrossEngineReplayV1",
  "SHI.Campaign.OrderTransactionV1", "SHI.Campaign.SaveReplayIntegrityV6",
  "SHI.Campaign.SchemaV7Horizon", "SHI.Cinematic.CommandSurfacePresentationV1",
  "SHI.Cinematic.CommandWeightPresentationV1", "SHI.Cinematic.CouncilCharacterPresentationV1",
  "SHI.Cinematic.CouncilFacialPerformanceV1", "SHI.Cinematic.CouncilPerformancePresentationV1",
  "SHI.Cinematic.CouncilSkinLookdevV1", "SHI.Cinematic.CouncilStagingV1",
  "SHI.Cinematic.DazeFieldShelterPresentationV1", "SHI.Cinematic.DazeRainPresentationV1",
  "SHI.Cinematic.ResolutionGrammarV1", "SHI.Cinematic.WetFieldEnvironmentPresentationV1",
  "SHI.Cinematic.WetFieldVegetationPresentationV1", "SHI.CommandSpace.LiveSignalsV1",
  "SHI.Engagement.BrokenCrossingParityV1", "SHI.History.SourceClaimClosureV1",
  "SHI.Wartable.SpatialIntelligenceV1",
];
if (skinRuntimeEvidence.assetId !== skinAssetId
    || skinRuntimeEvidence.status !== "privacy-v11-import-path-sanitized-v5-package-normal-reduced-v6-runtime-engineering-pass; watched-visual-art-material-quality-rejected; v1-v4-history-retained; final-close-human-gates-red"
    || skinRuntimeEvidence.disclosure !== skinDisclosure
    || skinRuntimeEvidence.engine?.association !== "5.8"
    || skinRuntimeEvidence.engine?.version !== "5.8.1-56057345+++UE5+Release-5.8"
    || skinRuntimeEvidence.importAdmission?.status !== "pass-privacy-v11-import-read-only-rendered-inspect-engineering-only"
    || skinRuntimeEvidence.importAdmission?.revision !== skinPrivacyRevision
    || skinRuntimeEvidence.importAdmission?.trackedAssets !== 5
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfiles !== 1
    || skinRuntimeEvidence.importAdmission?.materials !== 1
    || skinRuntimeEvidence.importAdmission?.textures !== 3
    || skinRuntimeEvidence.importAdmission?.canonicalHeightImported !== false
    || skinRuntimeEvidence.importAdmission?.defaultReadOnlyInspectionPassed !== true
    || skinRuntimeEvidence.importAdmission?.readOnlyInspectionTrackedHashesUnchanged !== true
    || skinRuntimeEvidence.importAdmission?.embeddedMetadataPrivacyPassed !== true
    || skinRuntimeEvidence.importAdmission?.readOnlyInspectionEmbeddedMetadataPrivacyPassed !== true
    || skinRuntimeEvidence.importAdmission?.embeddedSourceContractFileReceiptsAreImportTimeSnapshot !== true
    || skinRuntimeEvidence.importAdmission?.embeddedSourceContractFileReceiptsAreNotCurrentCrossReceipts !== true
    || skinRuntimeEvidence.importAdmission?.acceptedFacialAssetsPreserved !== true
    || skinRuntimeEvidence.importAdmission?.readOnlyInspectionImmutableImportReceiptRootSha256 !== skinPrivacyImportRootSha256
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfileOpacity?.source !== "MaterialMasks2K.B"
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfileOpacity?.value !== 89 / 255
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfileOpacity?.materialInput !== "MP_OPACITY"
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfileOpacity?.opacityConnected !== true
    || skinRuntimeEvidence.importAdmission?.subsurfaceProfileOpacity?.subsurfaceColorInput !== "unconnected"
    || skinRuntimeEvidence.importAdmission?.currentEngineeringAdmission !== true
    || skinRuntimeEvidence.importAdmission?.correctedV3PackageEngineeringEvidenceRetained !== true
    || skinRuntimeEvidence.importAdmission?.correctedV3RuntimeRouteExerciseRetained !== true
    || skinRuntimeEvidence.importAdmission?.currentPrivacyV11PackageEngineeringAdmission !== true
    || skinRuntimeEvidence.importAdmission?.currentPrivacyV11RuntimeRouteExercise !== true
    || skinRuntimeEvidence.importAdmission?.packageAdmission !== false
    || skinRuntimeEvidence.importAdmission?.visualArtAdmission !== false
    || skinNativeBuild?.status !== "pass" || skinNativeBuild?.target !== "SHIEditor"
    || skinNativeBuild?.result !== "Succeeded" || skinNativeBuild?.actionCount !== 5
    || skinNativeBuild?.actions?.join(",") !== "Compile ShiCouncilSkinLookdevModel.cpp,Compile ShiCouncilSkinLookdevAutomationTest.cpp,Compile ShiCouncilFigure.cpp,Compile ShiGameMode.cpp,Link libUnrealEditor-SHI.so"
    || skinNativeBuild?.transientLog?.tracked !== false || skinNativeBuild?.transientLog?.bytes !== 8533
    || skinNativeBuild?.transientLog?.sha256 !== "1778cdad92e9b914a51ba76ce6f167e2f26fa891d12f1a44647059978d1d931d"
    || selectedSkinSuite?.status !== "pass" || selectedSkinSuite?.filter !== "SHI.Cinematic.CouncilSkinLookdevV1"
    || selectedSkinSuite?.discovered !== 1 || selectedSkinSuite?.started !== 1
    || selectedSkinSuite?.passed !== 1 || selectedSkinSuite?.failed !== 0 || selectedSkinSuite?.exitCode !== 0
    || selectedSkinSuite?.tests?.join(",") !== "SHI.Cinematic.CouncilSkinLookdevV1"
    || selectedSkinSuite?.transientLog?.tracked !== false || selectedSkinSuite?.transientLog?.bytes !== 247202
    || selectedSkinSuite?.transientLog?.sha256 !== "6f429f38b2bdaaf05fb9c6116b5bfb692bac6ec070ffcdea170d0aaebeb73158"
    || fullSkinSuite?.status !== "pass" || fullSkinSuite?.filter !== "SHI."
    || fullSkinSuite?.discovered !== 21 || fullSkinSuite?.started !== 21
    || fullSkinSuite?.passed !== 21 || fullSkinSuite?.failed !== 0 || fullSkinSuite?.exitCode !== 0
    || fullSkinSuite?.tests?.join(",") !== expectedSkinTests.join(",")
    || fullSkinSuite?.transientLog?.tracked !== false || fullSkinSuite?.transientLog?.bytes !== 265777
    || fullSkinSuite?.transientLog?.sha256 !== "ee8161f10f16f89fb1272c76736b6257bb21021f38c73014daa2eeb1c6e64a11")
  errors.push("Daze council skin runtime evidence does not prove privacy-v11 import plus retained build, focused 1/1 and full 21/21 receipts");

const skinCorrectedPresentation = skinRuntimeEvidence.correctedPackageRuntimePresentation;
if (skinCorrectedPresentation?.status !== "pass-privacy-v11-path-sanitized-v5-package-normal-reduced-v6-runtime-engineering-only-watched-visual-art-rejected"
    || skinCorrectedPresentation?.evidence?.file !== "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json"
    || skinCorrectedPresentation?.package?.cookedPackages !== 564
    || skinCorrectedPresentation?.package?.incrementallySkippedPackages !== 0
    || skinCorrectedPresentation?.package?.platformSkippedPackages !== 7
    || skinCorrectedPresentation?.package?.totalCookCandidates !== 571
    || skinCorrectedPresentation?.package?.isolatedSkinAssets !== 5
    || skinCorrectedPresentation?.package?.result !== "BUILD SUCCESSFUL"
    || skinCorrectedPresentation?.package?.buildCookRunSeconds !== 110.37
    || skinCorrectedPresentation?.package?.builtFromPrivacyV11SourceUassets !== true
    || skinCorrectedPresentation?.package?.sourceSnapshotMatchesFiveCurrentReceipts !== true
    || skinCorrectedPresentation?.package?.pathSanitizedExecutableDebugAndSymbols !== true
    || skinCorrectedPresentation?.package?.postRpathExecutableSha256 !== "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02"
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.gpu !== "NVIDIA GeForce RTX 4090 D"
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.exerciseAlpha !== 0.1474
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.controlledExitCode !== 143
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.targetedMaterialFallbackOrFatalSignatures !== 0
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.documentedWarningSeverityMarkers !== 4
    || skinCorrectedPresentation?.runtimeRoutes?.normal?.displaySwapchainDiagnosticMarkers !== 1
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.gpu !== "NVIDIA GeForce RTX 4090 D"
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.exerciseAlpha !== 1
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.controlledExitCode !== 143
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.targetedMaterialFallbackOrFatalSignatures !== 0
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.documentedWarningSeverityMarkers !== 4
    || skinCorrectedPresentation?.runtimeRoutes?.reduced?.displaySwapchainDiagnosticMarkers !== 1
    || skinCorrectedPresentation?.trackedScreenshots !== 3
    || skinCorrectedPresentation?.normalObjectGlanceCaptureStartSecondsAfterAdmission !== 1.460644246
    || skinCorrectedPresentation?.normalObjectGlanceCaptureCompleteSecondsAfterAdmission !== 1.470167318
    || skinCorrectedPresentation?.normalObjectGlanceCaptureWithinDefinedSection !== true
    || skinCorrectedPresentation?.reducedObjectGlanceCaptureStartSecondsAfterMarker !== 0.035183811
    || skinCorrectedPresentation?.reducedObjectGlanceCaptureStartSecondsAfterAdmission !== 1.155183811
    || skinCorrectedPresentation?.reducedObjectGlanceCaptureCompleteSecondsAfterAdmission !== 1.166618803
    || skinCorrectedPresentation?.reducedObjectGlanceCaptureWithinDefinedSection !== true
    || skinCorrectedPresentation?.captureTimingReceipts?.normal?.bytes !== 148
    || skinCorrectedPresentation?.captureTimingReceipts?.normal?.sha256 !== "206a71da5a95ceb4d017dec93618e0426b8f8dab530b08a3f3987110c195c3aa"
    || skinCorrectedPresentation?.captureTimingReceipts?.reduced?.bytes !== 249
    || skinCorrectedPresentation?.captureTimingReceipts?.reduced?.sha256 !== "758bf8c2d8a6c524e4589836479733840260a3c6c1531f31116bcf8aa9e958c4"
    || skinCorrectedPresentation?.oneReusedNoVncStack !== true
    || skinCorrectedPresentation?.storyAndSaveRouteInert !== true
    || skinCorrectedPresentation?.freshCampaignSaveAbsentBeforeAndAfter !== true
    || skinCorrectedPresentation?.packageEngineeringAdmission !== true
    || skinCorrectedPresentation?.runtimeRouteEngineeringAdmission !== true
    || skinCorrectedPresentation?.predatesPrivacyV11UassetSerialization !== false
    || skinCorrectedPresentation?.currentPrivacyV11PackageRefreshPending !== false
    || skinCorrectedPresentation?.visualArtMaterialQualityAdmission !== false
    || skinCorrectedPresentation?.closeCameraApproved !== false
    || skinCorrectedPresentation?.humanReviewApproved !== false
    || skinCorrectedPresentation?.finalCharacterArt !== false)
  errors.push("Daze council skin runtime evidence does not bind the corrected package/runtime receipts and rejected visual-art boundary");

const skinRuntimeContract = skinRuntimeEvidence.runtimeContract;
if (skinRuntimeContract?.targetCharacterId !== "chen-sheng"
    || skinRuntimeContract?.reviewModeId !== "-ShiCouncilSkinLookdevReview"
    || skinRuntimeContract?.isolatedRoot !== skinDestination
    || skinRuntimeContract?.materialSlot !== "M_SHI_Character_SkinClay"
    || skinRuntimeContract?.assetInventoryCount !== 5 || skinRuntimeContract?.textureInventoryCount !== 3
    || skinRuntimeContract?.subsurfaceProfileOpacity?.source !== "MaterialMasks2K.B"
    || skinRuntimeContract?.subsurfaceProfileOpacity?.sourceByte !== 89
    || skinRuntimeContract?.subsurfaceProfileOpacity?.value !== 89 / 255
    || skinRuntimeContract?.subsurfaceProfileOpacity?.thresholdExclusive !== 0.1
    || skinRuntimeContract?.subsurfaceProfileOpacity?.maximum !== 89 / 255
    || skinRuntimeContract?.subsurfaceProfileOpacity?.profileMeanFreePathDistance !== 2.6748
    || skinRuntimeContract?.subsurfaceProfileOpacity?.effectiveMeanFreePath !== 0.9335576470588234
    || skinRuntimeContract?.subsurfaceProfileOpacity?.maximumEffectiveMeanFreePath !== 0.9335576470588234
    || skinRuntimeContract?.subsurfaceProfileOpacity?.materialInput !== "MP_OPACITY"
    || skinRuntimeContract?.subsurfaceProfileOpacity?.opacityConnected !== true
    || skinRuntimeContract?.subsurfaceProfileOpacity?.subsurfaceColorInput !== "unconnected"
    || skinRuntimeContract?.reviewOnly !== true || skinRuntimeContract?.chenShengOnly !== true
    || skinRuntimeContract?.explicitDevelopmentAuthorizationRequired !== true
    || skinRuntimeContract?.baselineFallbackRequired !== true
    || skinRuntimeContract?.canonicalHeightSourceOutsideEngine !== true
    || skinRuntimeContract?.deterministic !== true
    || skinRuntimeContract?.standardMotionCompatible !== true
    || skinRuntimeContract?.reducedMotionCompatible !== true
    || skinRuntimeContract?.motionIndependent !== true
    || Object.entries(skinRuntimeContract ?? {}).some(([key, value]) => [
      "runtimeRandomness", "dynamicNetworkDependency", "runtimeParameterMutation",
      "interactionAuthority", "gameplayAuthority", "saveAuthority", "replicated",
      "identityAuthority", "historicalPortrait", "historicallyAttestedComplexion",
      "humanHistoricalCulturalReviewApproved", "closeCameraApproved", "finalCharacterArt", "finalSkin",
    ].includes(key) && value !== false))
  errors.push("Daze council skin runtime contract overstates motion, authority, history, human review, close-camera or final-art scope");
const skinReleaseGates = skinRuntimeEvidence.releaseGates;
if (skinReleaseGates?.isolatedImport !== "pass-privacy-v11-five-uassets-opacity-semantics-and-sanitized-metadata"
    || skinReleaseGates?.defaultReadOnlyInspection !== "pass-privacy-v11-five-hashes-unchanged-and-embedded-metadata-private-paths-absent"
    || skinReleaseGates?.nativeEditorBuild !== "pass"
    || skinReleaseGates?.selectedSkinLookdevAutomation !== "pass-1-of-1"
    || skinReleaseGates?.fullProjectAutomation !== "pass-21-of-21"
    || skinReleaseGates?.embeddedMetadataPrivacy !== "pass-privacy-v11-base-asset-import-data-no-interchange-no-private-absolute-paths"
    || skinReleaseGates?.packagedBuildWithSkinAssets !== "pass-privacy-v11-path-sanitized-v5-564-cooked-packages-engineering-only"
    || skinReleaseGates?.packageExecutableDebugSymbolPathPrivacy !== "pass-prefix-mapped-build-plus-audited-relative-rpath-mutation-and-immutable-inspection"
    || skinReleaseGates?.runtimeAdmissionMarkers !== "pass-path-sanitized-package-normal-v6-reduced-v6-two-expanded-markers"
    || skinReleaseGates?.runtimeMorphSectionExercise !== "pass-normal-0.1474-reduced-1.0000-engineering-route"
    || skinReleaseGates?.storyAndSaveInertReviewRoute !== "pass-two-exact-inert-markers-save-absent"
    || skinReleaseGates?.packagedHeadlessSmoke !== "not-run-for-this-corrected-material-qa-package"
    || skinReleaseGates?.visibleNoVncReview !== "performed-path-sanitized-v5-one-reused-stack-engineering-route-pass-visual-art-rejected"
    || skinReleaseGates?.standardMotionWatchedDeformationReview !== "performed-normal-v6-raw-timing-bound-live-glance-engineering-only-visual-art-rejected"
    || skinReleaseGates?.reducedMotionWatchedDeformationReview !== "performed-reduced-v6-raw-timing-bound-live-glance-engineering-only-visual-art-rejected"
    || skinReleaseGates?.visualSkinArtReview !== "rejected-generic-low-detail-nonportrait-uniform-smooth-plastic-waxy-blockout"
    || skinReleaseGates?.correctedV2ImportPackageAndRuntimeReview !== "privacy-v11-path-sanitized-package-runtime-engineering-pass-v1-v3-v4-history-retained-visual-art-rejected"
    || skinReleaseGates?.currentPrivacyV11PackageRefresh !== "pass-path-sanitized-v5-package-normal-reduced-v6-runtime"
    || skinReleaseGates?.visibleBaselineFallbackReview !== "pending-not-run"
    || skinReleaseGates?.physicalDisplayReview !== "pending-not-run"
    || skinReleaseGates?.interactionHandsAndContact !== "required"
    || skinReleaseGates?.mouthInteriorTeethAndTongue !== "required"
    || skinReleaseGates?.voiceAndMultilingualLipSync !== "required"
    || skinReleaseGates?.humanCharacterAnatomyReview !== "required"
    || skinReleaseGates?.humanHistoricalCulturalReview !== "required"
    || skinReleaseGates?.humanCinematicLightingColorReview !== "required"
    || skinReleaseGates?.humanAccessibilityReview !== "required"
    || skinReleaseGates?.identitySpecificTopologyAndHeadUvDecision !== "required"
    || skinReleaseGates?.renderedUnrealTangentBasisProof !== "insufficient-full-body-framing-close-detail-proof-required"
    || skinReleaseGates?.finalCloseDialogue !== "rejected"
    || skinReleaseGates?.historicalLikenessOrComplexionClaim !== "rejected"
    || skinReleaseGates?.finalCharacterArt !== "not-admitted")
  errors.push("Daze council skin runtime evidence does not preserve the exact package/runtime QA, visual rejection and remaining red gates");

const skinPresentationDecision = "privacy-v11-import-package-runtime-engineering-pass-watched-visual-art-rejected-not-final-not-close-camera-not-human-reviewed";
const skinRejectedV1History = skinRuntimeEvidence.rejectedV1PackageAndPresentationHistory;
if (skinRejectedV1History?.status !== "rejected-diagnostic-only-superseded-by-corrected-v2-opacity-package-runtime-engineering-route"
    || skinRejectedV1History?.historicalPresentationReference?.originalLogicalFile !== "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json"
    || skinRejectedV1History?.historicalPresentationReference?.tracked !== false
    || skinRejectedV1History?.historicalPresentationReference?.retainedPayload !== false
    || skinRejectedV1History?.historicalPresentationReference?.currentHistoryContainer !== "docs/production/evidence/unreal-daze-council-skin-lookdev-presentation-status.json"
    || skinRejectedV1History?.historicalPresentationReference?.currentHistorySection !== "reviewHistory.rejectedV1MaterialPackageAndScreens"
    || skinRejectedV1History?.package?.cookedPackages !== 564
    || skinRejectedV1History?.package?.incrementallySkippedPackages !== 0
    || skinRejectedV1History?.package?.platformSkippedPackages !== 7
    || skinRejectedV1History?.package?.totalCookCandidates !== 571
    || skinRejectedV1History?.package?.isolatedSkinAssets !== 5
    || skinRejectedV1History?.package?.result !== "BUILD SUCCESSFUL"
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.normal?.gpu !== "NVIDIA GeForce RTX 4090 D"
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.normal?.exerciseAlpha !== 0.0346
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.normal?.controlledExitCode !== 143
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.reduced?.gpu !== "NVIDIA GeForce RTX 4090 D"
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.reduced?.exerciseAlpha !== 1
    || skinRejectedV1History?.diagnosticRuntimeRoutes?.reduced?.controlledExitCode !== 143
    || skinRejectedV1History?.oneReusedNoVncStack !== true
    || skinRejectedV1History?.storyAndSaveRouteInert !== true
    || skinRejectedV1History?.freshCampaignSaveAbsentBeforeAndAfter !== true
    || skinRejectedV1History?.historicalDiagnosticReceiptsRetained !== true
    || skinRejectedV1History?.v1MaterialEngineeringAdmission !== false
    || !skinRejectedV1History?.knownSemanticDefect?.includes("Opacity/custom-data alpha")
    || skinRejectedV1History?.visualArtDecision !== "reject-then-current-v1-orange-bright-waxy-smooth-appearance-for-replication-final-close-camera-and-film-quality-use"
    || skinRejectedV1History?.finalSkin !== false
    || skinRejectedV1History?.closeCameraApproved !== false
    || skinRejectedV1History?.humanReviewApproved !== false)
  errors.push("Daze council skin runtime evidence loses the rejected v1 graph/visual history or overstates its diagnostic receipts");

const runtimeCorrectedV3History = skinRuntimeEvidence.supersededCorrectedV3PackageAndRuntimeHistory;
const runtimeRejectedV4History = skinRuntimeEvidence.rejectedPrivacyV4PackageAndRuntimeHistory;
if (runtimeCorrectedV3History?.status !== "superseded-historical-engineering-evidence-only-pre-privacy-v11-watched-visual-rejected"
    || runtimeCorrectedV3History?.historicalImportReceipt?.bytes !== 35830
    || runtimeCorrectedV3History?.historicalImportReceipt?.sha256 !== "e65269ea71bee3d95d5cb7c1078e3f63578ba3f13eb510fb9436f213c275e6f8"
    || runtimeCorrectedV3History?.package?.buildLogSha256 !== "fa8859cb712b3b13a353b8a1453c1b062f3b27b2bfbd852420ad7adf41252eb9"
    || runtimeCorrectedV3History?.runtimeRoutes?.normal?.sha256 !== "3919f3606ee6adddbd97b785d705e4b24c9b75f1014183ba37f4bbe5d9609d03"
    || runtimeCorrectedV3History?.runtimeRoutes?.reduced?.sha256 !== "9aac883e892d4890c16d54b0630109784e9c02889d18ea14dfbff92c2aafc575"
    || runtimeCorrectedV3History?.historicalScreenshotPayloadsOverwrittenByCurrentV5V6Evidence !== true
    || runtimeCorrectedV3History?.currentPackageAuthority !== false
    || runtimeCorrectedV3History?.visualArtMaterialQualityAdmission !== false
    || runtimeRejectedV4History?.status !== "rejected-for-public-package-workstation-path-leak-diagnostic-engineering-history-only"
    || runtimeRejectedV4History?.package?.buildLogSha256 !== "09dc4a60725d8eee4011ed9f5f5947a35378fdc6dc3f91ff24378adeb7308aa5"
    || runtimeRejectedV4History?.package?.executableCurrentWorkstationPathMatches !== 6
    || runtimeRejectedV4History?.package?.debugCurrentWorkstationPathMatches !== 93
    || runtimeRejectedV4History?.package?.symbolCurrentWorkstationPathMatches !== 192
    || runtimeRejectedV4History?.runtimeRoutes?.normalV4?.sha256 !== "eb41b352636adbfc9e1ae5c57e9c5f9a2ec36dc5ca9b6d51aa4c17d3460af78a"
    || runtimeRejectedV4History?.runtimeRoutes?.reducedV5?.sha256 !== "b4532e1aeb634bf4a3aa48dda2cd3f2688a632ba93887f1e679b7b6cf31f1cb3"
    || runtimeRejectedV4History?.currentPackageAuthority !== false
    || runtimeRejectedV4History?.visualArtMaterialQualityAdmission !== false)
  errors.push("Daze council skin runtime evidence loses superseded v3 or rejected path-leaking-v4 history");

const skinPresentationContract = skinPresentationEvidence.runtimeContract;
const skinPresentationAuthority = skinPresentationContract?.authority;
if (skinPresentationEvidence.schemaVersion !== 1
    || skinPresentationEvidence.assetId !== skinAssetId
    || skinPresentationEvidence.decision !== skinPresentationDecision
    || skinPresentationEvidence.requiredDisclosure !== skinDisclosure
    || !skinPresentationEvidence.scope?.includes("Watched visual art and material quality remain rejected")
    || !skinPresentationEvidence.historicalBoundary?.includes("not evidence for Chen Sheng's likeness")
    || skinPresentationContract?.assetId !== skinAssetId
    || skinPresentationContract?.targetCharacterId !== "chen-sheng"
    || skinPresentationContract?.visibleRole !== "speaker"
    || skinPresentationContract?.reviewFlag !== "-ShiCouncilSkinLookdevReview"
    || skinPresentationContract?.isolatedRoot !== skinDestination
    || skinPresentationContract?.meshPath !== skinRuntimeContract?.acceptedFacialMesh
    || skinPresentationContract?.materialSlot !== "M_SHI_Character_SkinClay"
    || skinPresentationContract?.materialPath !== skinRuntimeContract?.lookdevMaterial
    || skinPresentationContract?.subsurfaceProfilePath !== `${skinDestination}/SP_SHI_ChenSheng_SkinLookdevV1.SP_SHI_ChenSheng_SkinLookdevV1`
    || skinPresentationContract?.routeId !== "chen-sheng-skin-lookdev-v1"
    || skinPresentationContract?.textureCount !== 3
    || skinPresentationContract?.metallic !== 0 || skinPresentationContract?.specular !== 0.25
    || skinPresentationContract?.framing !== "material-qa-only"
    || skinPresentationContract?.subsurfaceAmount?.source !== "MaterialMasks2K.B"
    || skinPresentationContract?.subsurfaceAmount?.sourceTextureParameter !== "MaterialMasks2K"
    || skinPresentationContract?.subsurfaceAmount?.sourceChannel !== "B"
    || skinPresentationContract?.subsurfaceAmount?.sourceUnorm8 !== 89
    || skinPresentationContract?.subsurfaceAmount?.sourceNormalized !== 89 / 255
    || skinPresentationContract?.subsurfaceAmount?.maximumSourceNormalized !== 89 / 255
    || skinPresentationContract?.subsurfaceAmount?.opacityThresholdExclusive !== 0.1
    || skinPresentationContract?.subsurfaceAmount?.materialInput !== "MP_OPACITY"
    || skinPresentationContract?.subsurfaceAmount?.opacityConnected !== true
    || skinPresentationContract?.subsurfaceAmount?.subsurfaceColorConnected !== false
    || skinPresentationContract?.subsurfaceAmount?.profileMeanFreePathDistance !== 2.6748
    || skinPresentationContract?.subsurfaceAmount?.effectiveMeanFreePathDistance !== 0.9335576470588234
    || skinPresentationContract?.subsurfaceAmount?.maximumAllowedEffectiveMeanFreePathDistance !== 0.9335576470588234
    || skinPresentationContract?.subsurfaceAmount?.effectiveMeanFreePathWithinThreshold !== true
    || skinPresentationAuthority?.reviewOnly !== true
    || skinPresentationAuthority?.developmentOnly !== true
    || skinPresentationAuthority?.chenShengOnly !== true
    || skinPresentationAuthority?.deterministic !== true
    || skinPresentationAuthority?.standardMotionSupported !== true
    || skinPresentationAuthority?.reducedMotionSupported !== true
    || Object.entries(skinPresentationAuthority ?? {}).some(([key, value]) => [
      "interactionAuthority", "gameplayAuthority", "storyAuthority", "saveAuthority",
      "replicationAuthority", "identityAuthority", "historicalPortrait",
      "historicallyAttestedComplexion", "humanHistoricalCulturalReviewApproved",
      "closeCameraApproved", "finalCharacterArt", "finalSkin",
    ].includes(key) && value !== false))
  errors.push("Daze council skin presentation contract overstates character, story, history, close-camera, human-review or final-art authority");
const expectedSkinPresentationTextures = [
  {textureId: "base-color-2k", parameter: "BaseColor2K", assetPath: expectedSkinTexturePaths.baseColor, dimensions: "2048,2048", srgb: true},
  {textureId: "material-masks-2k", parameter: "MaterialMasks2K", assetPath: expectedSkinTexturePaths.materialMasks, dimensions: "2048,2048", srgb: false},
  {textureId: "detail-normal-1k", parameter: "DetailNormal1K", assetPath: expectedSkinTexturePaths.detailNormal, dimensions: "1024,1024", srgb: false},
];
if (skinPresentationContract?.textureInventory?.length !== 3
    || expectedSkinPresentationTextures.some((expected, index) => {
      const actual = skinPresentationContract.textureInventory[index];
      return actual?.textureId !== expected.textureId || actual?.parameter !== expected.parameter
        || actual?.assetPath !== expected.assetPath || actual?.dimensions?.join(",") !== expected.dimensions
        || actual?.srgb !== expected.srgb;
    }))
  errors.push("Daze council skin presentation no longer binds the exact three named runtime textures");

const skinPresentationImport = skinPresentationEvidence.importAdmission;
if (skinPresentationImport?.status !== "pass"
    || skinPresentationImport?.revision !== skinPrivacyRevision
    || skinPresentationImport?.file !== "docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json"
    || skinPresentationImport?.tracked !== true
    || skinPresentationImport?.bytes !== skinPrivacyImportReceipt.bytes
    || skinPresentationImport?.sha256 !== skinPrivacyImportReceipt.sha256
    || skinPresentationImport?.immutableImportReceiptRootSha256 !== skinPrivacyImportRootSha256
    || skinPresentationImport?.canonicalImportReceiptRootPreserved !== true
    || skinPresentationImport?.readOnlyInspectionPassed !== true
    || skinPresentationImport?.embeddedMetadataPrivacyPassed !== true
    || skinPresentationImport?.readOnlyInspectionEmbeddedMetadataPrivacyPassed !== true
    || skinPresentationImport?.embeddedSourceContractFileReceiptsAreImportTimeSnapshot !== true
    || skinPresentationImport?.embeddedSourceContractFileReceiptsAreNotCurrentCrossReceipts !== true
    || skinPresentationImport?.engineeringOnly !== true
    || skinPresentationImport?.visualArtAdmission !== false)
  errors.push("Daze council skin presentation does not bind the exact privacy-v11 import/read-only embedded-metadata receipt");
const skinPresentationPrivacyRepair = skinPresentationEvidence.privacyRepair;
const expectedSkinPresentationPrivacyKeys = [
  "exactFiveAssetsScanned", "threeTextureAssetsUseBaseAssetImportData",
  "threeTextureAssetsRetainRelativeFilenameAndSourceBasename",
  "materialAndProfileHaveNoSourceIdentity", "interchangeAssetImportDataAbsentFromAllFive",
  "repositoryAbsolutePathAbsentFromAllFive", "unixHomePathAbsentFromAllFive",
  "macUsersPathAbsentFromAllFive", "windowsUsersPathsAbsentFromAllFive",
  "absoluteInterchangeFactoryPathAbsentFromAllFive",
];
if (skinPresentationPrivacyRepair?.status !== "pass-current-five-uassets-private-absolute-paths-absent"
    || skinPresentationPrivacyRepair?.revision !== skinPrivacyRevision
    || skinPresentationPrivacyRepair?.importer?.file !== skinPrivacyImporterReceipt.file
    || skinPresentationPrivacyRepair?.importer?.bytes !== skinPrivacyImporterReceipt.bytes
    || skinPresentationPrivacyRepair?.importer?.sha256 !== skinPrivacyImporterReceipt.sha256
    || !sameStringSet(Object.keys(skinPresentationPrivacyRepair?.trackedUassets ?? {}), expectedSkinAssetFiles)
    || Object.entries(expectedSkinPrivacyUassets).some(([file, expected]) =>
      skinPresentationPrivacyRepair?.trackedUassets?.[file]?.bytes !== expected.bytes
      || skinPresentationPrivacyRepair?.trackedUassets?.[file]?.sha256 !== expected.sha256)
    || !sameStringSet(Object.keys(skinPresentationPrivacyRepair?.metadataContract ?? {}), expectedSkinPresentationPrivacyKeys)
    || expectedSkinPresentationPrivacyKeys.some((key) => skinPresentationPrivacyRepair?.metadataContract?.[key] !== true)
    || skinPresentationPrivacyRepair?.readOnlyRenderedInspectionPassed !== true
    || skinPresentationPrivacyRepair?.trackedHashesUnchangedDuringInspection !== true
    || skinPresentationPrivacyRepair?.correctedV3PackageRuntimeEvidenceRetained !== true
    || skinPresentationPrivacyRepair?.correctedV3PackagePredatesPrivacyRepair !== true
    || skinPresentationPrivacyRepair?.currentPrivacyV11SourceUassetsFreshlyPackaged !== true
    || skinPresentationPrivacyRepair?.currentPrivacyV11PackageAndRuntimePassed !== true
    || skinPresentationPrivacyRepair?.freshPackagePending !== false)
  errors.push("Daze council skin presentation omits the exact privacy-v11 repair and retained-v3 package boundary");
const rejectedV1PresentationHistory = skinPresentationEvidence.reviewHistory?.rejectedV1MaterialPackageAndScreens;
const rejectedV1ImportReceipt = rejectedV1PresentationHistory?.historicalImportReceipt;
if (rejectedV1PresentationHistory?.status !== "rejected-diagnostic-only-superseded-by-corrected-opacity-route"
    || !rejectedV1PresentationHistory?.graphDefect?.includes("MP_OPACITY remained unconnected at default 1.0")
    || rejectedV1ImportReceipt?.status !== "rejected-v1-historical-receipt-passed-incomplete-then-checks"
    || rejectedV1ImportReceipt?.originalLogicalFile !== "docs/production/evidence/unreal-daze-council-skin-lookdev-import-status.json"
    || rejectedV1ImportReceipt?.tracked !== false
    || rejectedV1ImportReceipt?.retainedPayload !== false
    || rejectedV1ImportReceipt?.supersededInPlaceByCorrectedV2 !== true
    || rejectedV1ImportReceipt?.bytes !== 35236
    || rejectedV1ImportReceipt?.sha256 !== "f5ebe66d914a7750c0fa5ddac360aca1f3de8198f30853beb79ac127db6ecb7e"
    || rejectedV1ImportReceipt?.immutableImportReceiptRootSha256 !== "a8ce1e5d2522c115ddda1e820af10c7bc090be6c82a734964f326cbcabbd16f9"
    || rejectedV1ImportReceipt?.canonicalImportReceiptRootPreserved !== true
    || rejectedV1ImportReceipt?.readOnlyInspectionPassed !== true
    || rejectedV1ImportReceipt?.currentMaterialAdmission !== false)
  errors.push("Daze council skin presentation no longer preserves the superseded v1 import receipt and graph-defect boundary");

const expectedSkinPackageArtifacts = {
  "SHI.sh": ["Linux packaged-player launcher", 218, "7eeb214781ca5113696ae2be6c5124b5404cd4abcd1fff39aa383ba15ff1cf1e"],
  "SHI/Binaries/Linux/SHI": ["Linux development executable", 298779248, "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02"],
  "SHI/Content/Paks/SHI-Linux.pak": ["Pak metadata and non-IoStore payload", 10428046, "1f15ef443e196e79f26e2c9f88450b4b1ff2b21efe65f6d66ec71f01368a1cbd"],
  "SHI/Content/Paks/SHI-Linux.ucas": ["IoStore data container", 176534544, "2543c7c1fc8c3f38d25dc6cadf91b8410e9771336bd639fb226654b92ee51ff2"],
  "SHI/Content/Paks/SHI-Linux.utoc": ["IoStore table of contents", 158699, "c73d443cc10e6dac4ee314e94a68446d495fcd968264de9cc189b1b02acf1e25"],
};
const skinPresentationPackage = skinPresentationEvidence.package;
const skinPackageLog = skinPresentationPackage?.buildLog;
if (skinPresentationPackage?.result !== "BUILD SUCCESSFUL" || skinPresentationPackage?.exitCode !== 0
    || skinPresentationPackage?.outsideGitRoot !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || skinPresentationPackage?.alwaysCookPath !== skinDestination
    || skinPresentationPackage?.priorAcceptedPackageCount !== 559
    || skinPresentationPackage?.addedPackageCount !== 5
    || skinPresentationPackage?.isolatedAssetCount !== 5
    || skinPresentationPackage?.cookedPackageCount !== 564
    || skinPresentationPackage?.incrementallySkippedPackageCount !== 0
    || skinPresentationPackage?.platformSkippedPackageCount !== 7
    || skinPresentationPackage?.totalCookCandidates !== 571
    || skinPresentationPackage?.cookErrors !== 0 || skinPresentationPackage?.cookWarnings !== 0
    || skinPresentationPackage?.executionSeconds !== 110.37
    || skinPresentationPackage?.buildActionCount !== 75
    || skinPresentationPackage?.engineeringAdmission !== true
    || skinPresentationPackage?.visualArtAdmission !== false
    || skinPresentationPackage?.disposition !== "corrected-opacity-route-package-engineering-pass-visual-art-review-rejected"
    || skinPresentationPackage?.receiptRevision !== "privacy-v11-path-sanitized-package-v5-current"
    || skinPresentationPackage?.predatesPrivacyV11UassetSerialization !== false
    || skinPresentationPackage?.builtFromCurrentPrivacyV11SourceUassets !== true
    || skinPresentationPackage?.cookedContainersTransformEditorSerialization !== true
    || skinPresentationPackage?.freshPrivacyV11PackagePending !== false
    || skinPresentationPackage?.preservedMaterialRouteEvidence !== true
    || skinPackageLog?.file !== "$SHI_UNREAL_PACKAGE_LOG_ROOT/Log.txt"
    || skinPackageLog?.tracked !== false || skinPackageLog?.bytes !== 281372
    || skinPackageLog?.sha256 !== "f4fadef9ec9ca88f2a283a8206f34427987ac0737411e162f23be8286480e5ac"
    || skinPackageLog?.scan?.buildSuccessfulMarkers !== 1
    || skinPackageLog?.scan?.automationExitCodeZeroMarkers !== 1
    || skinPackageLog?.scan?.cookSummaryMarkers !== 1
    || skinPackageLog?.scan?.cookedPackageCount !== 564
    || skinPackageLog?.scan?.cookErrorMarkers !== 0
    || skinPackageLog?.scan?.cookWarningMarkers !== 0
    || skinPackageLog?.scan?.materialWarningMarkers !== 0
    || skinPackageLog?.scan?.targetedFallbackMarkers !== 0
    || skinPackageLog?.scan?.fatalErrors !== 0
    || skinPackageLog?.scan?.warningSeverityMarkers !== 0
    || skinPackageLog?.scan?.errorSeverityMarkers !== 0
    || skinPackageLog?.scan?.nonfatalDisplayFailedDiagnostics !== 4
    || skinPackageLog?.scan?.nonfatalDisplayDiagnosticKinds?.join("|") !== [
      "missing engine game directory",
      "Android SDK setup unavailable during Linux-only package",
      "stale shader-autogen delete failure before regeneration",
      "storage-server connection unavailable before local fallback",
    ].join("|")
    || skinPackageLog?.scan?.passed !== true
    || skinPresentationPackage?.headlessSmoke?.status !== "not-run-for-this-material-qa-package"
    || skinPresentationPackage?.headlessSmoke?.claim !== false)
  errors.push("Daze council skin presentation package/log receipt is incomplete or overstates the unrun headless smoke");

if (skinPresentationPackage?.phaseSeconds?.build !== 46.78
    || skinPresentationPackage?.phaseSeconds?.cook !== 26.15
    || skinPresentationPackage?.phaseSeconds?.stage !== 36
    || skinPresentationPackage?.phaseSeconds?.archive !== 0.61
    || skinPresentationPackage?.cookResourceSummary?.cookByTheBookTickSeconds !== 2.466689
    || skinPresentationPackage?.cookResourceSummary?.cookByTheBookTotalSeconds !== 4.836254
    || skinPresentationPackage?.cookResourceSummary?.peakPhysicalMiB !== 2805
    || skinPresentationPackage?.cookResourceSummary?.peakVirtualMiB !== 13616
    || skinPresentationPackage?.transcript?.file !== "$SHI_UNREAL_PACKAGE_LOG_ROOT/../SHI-DazeCouncilSkinLookdev-PathSanitized-Package-v5.transcript.log"
    || skinPresentationPackage?.transcript?.tracked !== false
    || skinPresentationPackage?.transcript?.bytes !== 131078
    || skinPresentationPackage?.transcript?.sha256 !== "7f7656988c666f6e1b649562fcd24cf9fb29e4c4293626988fff8104e6ed0e4e"
    || skinPresentationPackage?.ufsManifest?.file !== "$SHI_UNREAL_PACKAGE_LOG_ROOT/FinalCopyLinux_UFSFiles.txt"
    || skinPresentationPackage?.ufsManifest?.tracked !== false
    || skinPresentationPackage?.ufsManifest?.entries !== 2428
    || skinPresentationPackage?.ufsManifest?.isolatedSkinLookdevEntries !== 8
    || skinPresentationPackage?.ufsManifest?.bytes !== 431878
    || skinPresentationPackage?.ufsManifest?.sha256 !== "060da31560d94eb546fa63acaab93e9541455fde38c541316609ae4ee554daac")
  errors.push("Daze council skin presentation omits exact v5 phase, resource, transcript or UFS receipts");

const skinSourceSnapshot = skinPresentationPackage?.sourceSnapshot;
if (skinSourceSnapshot?.root !== "$SHI_UNREAL_ANONYMIZED_PACKAGE_SOURCE/apps/unreal"
    || skinSourceSnapshot?.privacyRevision !== skinPrivacyRevision
    || skinSourceSnapshot?.matchesCurrentRepositoryReceipts !== true
    || skinSourceSnapshot?.embeddedMetadataPrivacyPassed !== true
    || !sameStringSet(Object.keys(skinSourceSnapshot?.trackedUassets ?? {}), expectedSkinAssetFiles)
    || Object.entries(expectedSkinPrivacyUassets).some(([file, expected]) =>
      skinSourceSnapshot?.trackedUassets?.[file]?.bytes !== expected.bytes
      || skinSourceSnapshot?.trackedUassets?.[file]?.sha256 !== expected.sha256))
  errors.push("Daze council skin v5 package source snapshot does not bind the exact five privacy-v11 uassets");

const skinPathSanitization = skinPresentationPackage?.pathSanitization;
const expectedSkinSafeRpath = [
  "$ORIGIN", "$ORIGIN/..", "$ORIGIN/NotForLicensees",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/Qualcomm/Linux",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/PhysX3/Unix/x86_64-unknown-linux-gnu",
  "$ORIGIN/../../../Engine/Plugins/Interchange/Runtime/Source/ThirdParty/Draco/lib/Linux",
  "$ORIGIN/../../../Engine/Binaries/ThirdParty/MsQuic/v220/linux",
  "$ORIGIN/../../../Engine/Plugins/Compression/OodleNetwork/Sdks/2.9.16/lib/Linux",
  "$ORIGIN/../../../Engine/Plugins/Media/WebMMedia/Source/ThirdParty/webm/1.0.0.27/lib/Linux/x86_64-unknown-linux-gnu/Release",
];
if (skinPathSanitization?.status !== "pass-authorized-rpath-mutation-then-immutable-inspection"
    || skinPathSanitization?.script?.file !== "scripts/sanitize-unreal-linux-development-package.mjs"
    || skinPathSanitization?.script?.tracked !== true
    || skinPathSanitization?.script?.bytes !== 6989
    || skinPathSanitization?.script?.sha256 !== "f0dc86ac46f8649bab64ff8137bf2c11dc8ebe5b047e6eda4ba32d6ea693c8f5"
    || skinPathSanitization?.tool?.name !== "patchelf"
    || skinPathSanitization?.tool?.version !== "patchelf 0.18.0"
    || skinPathSanitization?.tool?.executableBytes !== 252256
    || skinPathSanitization?.tool?.executableSha256 !== "35fc95654387035338a74bb8cf62fde3712ec83dd8ca30a768deb714d07f063a"
    || skinPathSanitization?.tool?.ubuntuPackageSha256 !== "962a43e33cd56061522554898557a038ccbb8aa4e1e0f421b2d6f6adf1f80c60"
    || skinPathSanitization?.mutationReport?.tracked !== false
    || skinPathSanitization?.mutationReport?.bytes !== 2870
    || skinPathSanitization?.mutationReport?.sha256 !== "9e1b15afdc19bd7f5dfc89f4043a8e569fcd8cb3ff9bb89aff8e9b1607f6076c"
    || skinPathSanitization?.inspectReport?.tracked !== false
    || skinPathSanitization?.inspectReport?.bytes !== 2861
    || skinPathSanitization?.inspectReport?.sha256 !== "9340d0636ed9840321099c62eb6230779cc5eae0be397ecc2c33dfe8af1f19c2"
    || skinPathSanitization?.executable?.preRpathBytes !== 298779248
    || skinPathSanitization?.executable?.preRpathSha256 !== "36c5e0a317b1230da21e5e9bd2f16b76a12b787e243c79ba617f69ae677a02a6"
    || skinPathSanitization?.executable?.postRpathBytes !== 298779248
    || skinPathSanitization?.executable?.postRpathSha256 !== "03b4a0680060fd8b7c02a0be7de2bbd29ee6bd9488d0ed2ac0fb97d00465fb02"
    || skinPathSanitization?.additionalArtifacts?.[0]?.file !== "SHI/Binaries/Linux/SHI.debug"
    || skinPathSanitization?.additionalArtifacts?.[0]?.bytes !== 164328112
    || skinPathSanitization?.additionalArtifacts?.[0]?.sha256 !== "0d60e1f0ff432d8af470587d4ac2e9cb32307d486230321ebbddba8aa531e248"
    || skinPathSanitization?.additionalArtifacts?.[1]?.file !== "SHI/Binaries/Linux/SHI.sym"
    || skinPathSanitization?.additionalArtifacts?.[1]?.bytes !== 124176922
    || skinPathSanitization?.additionalArtifacts?.[1]?.sha256 !== "f6f24b4f07e828f4d30703cedc0b4ee9a79cba95caf38f49047d8f0a9881dc73"
    || skinPathSanitization?.exactSafeRpathEntries?.join("\0") !== expectedSkinSafeRpath.join("\0")
    || skinPathSanitization?.exactSafeRpathObserved !== true
    || skinPathSanitization?.currentWorkstationPathMarkerCount !== 0
    || skinPathSanitization?.securityTokenMarkerCount !== 0
    || skinPathSanitization?.lddObservedLineCount !== 8
    || skinPathSanitization?.unresolvedDependencyCount !== 0
    || skinPathSanitization?.changesGameplayCode !== false
    || skinPathSanitization?.changesCookedContent !== false
    || skinPathSanitization?.changesPakOrIoStore !== false
    || skinPathSanitization?.changesOnlyExecutableRpath !== true
    || skinPathSanitization?.finalReleaseApproval !== false)
  errors.push("Daze council skin path-sanitized v5 package contract or exact receipts drifted");
await verifyFacialReceipt(root, skinPathSanitization?.script,
  "Daze council skin package path-sanitizer script");
if (!sameStringSet(skinPresentationPackage?.artifacts?.map((item) => item.relativePath), Object.keys(expectedSkinPackageArtifacts))
    || (skinPresentationPackage?.artifacts ?? []).some((item) => {
      const expected = expectedSkinPackageArtifacts[item.relativePath];
      return !expected || item.role !== expected[0] || item.bytes !== expected[1] || item.sha256 !== expected[2];
    }))
  errors.push("Daze council skin presentation no longer retains the exact five outside-Git package artifact receipts");

const skinVisibleReview = skinPresentationEvidence.visiblePlaytest;
const skinVisibleRuns = skinVisibleReview?.runtimeLogs ?? [];
const expectedSkinVisibleRuns = {
  "skin-normal": {
    reducedMotion: false, motion: "normal", override: "ReducedMotion=False", alpha: 0.1474,
    file: "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-PathSanitized-Review-normal-v6.log",
    bytes: 124555, sha256: "c97c1227f5f7c0d20f82c6b84e12348928e74489397bceb01a5e13faba8f4f76",
  },
  "skin-reduced": {
    reducedMotion: true, motion: "reduced", override: "ReducedMotion=True", alpha: 1,
    file: "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-PathSanitized-Review-reduced-v6.log",
    bytes: 124561, sha256: "ea9283ee4c6cbd5554a9a8384fdb316d7d07a96e016330328f8a659ceed3f9e6",
  },
};
if (skinVisibleReview?.stackCount !== 1 || skinVisibleReview?.stackReusedAcrossCorrectedRuns !== true
    || !skinVisibleReview?.desktop?.includes("Xvfb :129")
    || skinVisibleReview?.package !== "$SHI_UNREAL_PACKAGE_ROOT/Linux"
    || skinVisibleReview?.resolution?.join(",") !== "1600,1000"
    || skinVisibleReview?.renderer !== "Vulkan"
    || skinVisibleReview?.selectedGpu !== "NVIDIA GeForce RTX 4090 D"
    || skinVisibleReview?.developmentReviewOnly !== true
    || skinVisibleReview?.receiptRevision !== "privacy-v11-path-sanitized-package-v5-current-with-normal-reduced-v6-raw-capture-proof"
    || skinVisibleReview?.predatesPrivacyV11UassetSerialization !== false
    || skinVisibleReview?.postPrivacyV11RuntimeRerun !== true
    || skinVisibleReview?.preservedWatchDecision !== true
    || skinVisibleReview?.materialImplementationAcceptedForEngineering !== true
    || skinVisibleReview?.visualMaterialQualityAccepted !== false
    || skinVisibleReview?.normalReviewed !== true || skinVisibleReview?.reducedMotionReviewed !== true
    || skinVisibleReview?.normalObjectGlanceCaptureAnchoredToMarker !== true
    || skinVisibleReview?.reducedObjectGlanceCaptureAnchoredToMarker !== true
    || skinVisibleReview?.storyProgressionReview !== "not-run-for-this-material-qa-review"
    || skinVisibleReview?.closeCameraReview !== "rejected-not-close-camera-evidence"
    || skinVisibleReview?.humanHistoricalCulturalReview !== "not-run"
    || skinVisibleReview?.finalCharacterArtReview !== "rejected-generic-low-detail-blockout"
    || !sameStringSet(skinVisibleRuns.map((item) => item.reviewId), Object.keys(expectedSkinVisibleRuns)))
  errors.push("Daze council skin visible review does not preserve the single-stack, NVIDIA, development-only review boundary");
for (const run of skinVisibleRuns) {
  const expected = expectedSkinVisibleRuns[run.reviewId];
  const scan = run.scan;
  const inert = run.inertEvidence;
  const shutdown = run.shutdown;
  if (!expected || run.reviewFlag !== "-ShiCouncilSkinLookdevReview"
      || run.reducedMotion !== expected.reducedMotion || run.motion !== expected.motion
      || run.commandLineReducedMotionOverride !== expected.override || run.commandLineOverrideObserved !== true
      || run.visibleCharacterId !== "chen-sheng" || run.visibleRole !== "speaker"
      || run.gpu !== "NVIDIA GeForce RTX 4090 D" || run.file !== expected.file
      || run.tracked !== false || run.bytes !== expected.bytes || run.sha256 !== expected.sha256
      || scan?.runtimeAdmissionMarkers !== 1 || scan?.objectGlanceMarkers !== 1
      || scan?.runtimeTextureInventoryCount !== 3 || scan?.visibleRoleExerciseAlpha !== expected.alpha
      || scan?.skinClayFallbackWarnings !== 0 || scan?.defaultMaterialFallbackWarnings !== 0
      || scan?.facialFallbackWarnings !== 0 || scan?.storyMutationMarkers !== 0
      || scan?.fatalErrors !== 0 || scan?.unhandledExceptions !== 0
      || scan?.assertionFailures !== 0 || scan?.documentedWarningSeverityMarkers !== 4
      || scan?.displaySwapchainDiagnosticMarkers !== 1
      || run.documentedWarnings?.length !== 4 || scan?.passed !== true
      || inert?.exactInertMarkerObserved !== true || inert?.storyProgressionObserved !== false
      || inert?.campaignSaveMutationObserved !== false || inert?.campaignSaveBefore?.exists !== false
      || inert?.campaignSaveAfter?.exists !== false || inert?.campaignSaveUnchanged !== true
      || shutdown?.method !== "controlled SIGTERM after evidence capture"
      || shutdown?.processReturnCode !== 143 || shutdown?.unrealPreparingToExit !== true
      || shutdown?.unrealGameEngineShutDown !== true || shutdown?.unrealObjectSubsystemClosed !== true
      || shutdown?.unrealExiting !== true || shutdown?.cleanUnrealShutdown !== true)
    errors.push(`Daze council skin visible runtime receipt drifted: ${run.reviewId ?? "unknown"}`);
}

const skinRawCapture = skinVisibleReview?.rawCaptureEvidence;
if (skinRawCapture?.clock !== "UTC nanoseconds recorded immediately around raw X11 capture; PNG filesystem times are not capture-start evidence"
    || skinRawCapture?.normal?.timingReceipt?.file !== "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-PathSanitized-Review-normal-v6-capture-times.txt"
    || skinRawCapture?.normal?.timingReceipt?.tracked !== false
    || skinRawCapture?.normal?.timingReceipt?.bytes !== 148
    || skinRawCapture?.normal?.timingReceipt?.sha256 !== "206a71da5a95ceb4d017dec93618e0426b8f8dab530b08a3f3987110c195c3aa"
    || skinRawCapture?.normal?.rawXwd?.file !== "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-PathSanitized-Review-normal-v6-material.xwd"
    || skinRawCapture?.normal?.rawXwd?.tracked !== false
    || skinRawCapture?.normal?.rawXwd?.bytes !== 6403179
    || skinRawCapture?.normal?.rawXwd?.sha256 !== "e315e29517fc0d14f9a5f15da455c98c2d36dfe21609aa70fc44e07af338dd41"
    || skinRawCapture?.normal?.runtimeAdmissionAtUtc !== "2026-08-10T17:59:36.004Z"
    || skinRawCapture?.normal?.runtimeMorphMarkerAtUtc !== "2026-08-10T17:59:37.112Z"
    || skinRawCapture?.normal?.captureStartSecondsAfterAdmission !== 1.460644246
    || skinRawCapture?.normal?.captureCompleteSecondsAfterAdmission !== 1.470167318
    || skinRawCapture?.normal?.withinNormalObjectGlanceSection !== true
    || skinRawCapture?.normal?.rawToPngPixelDifferenceCount !== 0
    || skinRawCapture?.reduced?.timingReceipt?.file !== "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-PathSanitized-Review-reduced-v6-capture-times.txt"
    || skinRawCapture?.reduced?.timingReceipt?.tracked !== false
    || skinRawCapture?.reduced?.timingReceipt?.bytes !== 249
    || skinRawCapture?.reduced?.timingReceipt?.sha256 !== "758bf8c2d8a6c524e4589836479733840260a3c6c1531f31116bcf8aa9e958c4"
    || skinRawCapture?.reduced?.glanceRawXwd?.bytes !== 6403179
    || skinRawCapture?.reduced?.glanceRawXwd?.sha256 !== "5dd2d955722255317cfbeafebce9a77c8e65706ae6ffb26bcbd70d66f71658f4"
    || skinRawCapture?.reduced?.terminalRawXwd?.bytes !== 6403179
    || skinRawCapture?.reduced?.terminalRawXwd?.sha256 !== "e6d04745dc7a0214949b0a5aa75e65afb25b643900625728d1b904feb659135a"
    || skinRawCapture?.reduced?.runtimeAdmissionAtUtc !== "2026-08-10T18:01:24.576Z"
    || skinRawCapture?.reduced?.runtimeMorphMarkerAtUtc !== "2026-08-10T18:01:25.696Z"
    || skinRawCapture?.reduced?.glanceCaptureStartSecondsAfterAdmission !== 1.155183811
    || skinRawCapture?.reduced?.glanceCaptureCompleteSecondsAfterAdmission !== 1.166618803
    || skinRawCapture?.reduced?.withinReducedObjectGlanceSection !== true
    || skinRawCapture?.reduced?.terminalCaptureStartSecondsAfterAdmission !== 4.518843532
    || skinRawCapture?.reduced?.terminalAfterFourSecondNeutralClamp !== true
    || skinRawCapture?.reduced?.glanceRawToPngPixelDifferenceCount !== 0
    || skinRawCapture?.reduced?.terminalRawToPngPixelDifferenceCount !== 0)
  errors.push("Daze council skin presentation omits exact v6 raw-XWD timing and lossless PNG evidence");

const expectedSkinScreenshots = {
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-normal-material-qa-v2.png": ["skin-normal", 881210, "63b9ae8484e874631f45fdb8b8f134c076986d00066ea19e2787218de8e22877"],
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-object-glance-v2.png": ["skin-reduced", 880469, "ef6829e1cb4e93dad0d9f17babfcdb2252c7caf79e632d08eb1ec3166d84624d"],
  "docs/production/evidence/unreal-daze-council-skin-lookdev-opacity-reduced-terminal-neutral-v2.png": ["skin-reduced", 877768, "251a94346962af8dcca7c6df57ea3cae0282dde924cef9679524c03d1041a5e7"],
};
if (!sameStringSet(skinPresentationEvidence.screenshots?.map((item) => item.file), Object.keys(expectedSkinScreenshots)))
  errors.push("Daze council skin presentation must retain exactly three corrected-opacity engineering-QA screenshots");
for (const screenshot of skinPresentationEvidence.screenshots ?? []) {
  const expected = expectedSkinScreenshots[screenshot.file];
  if (!expected || screenshot.reviewId !== expected[0] || screenshot.dimensions?.join(",") !== "1600,1000"
      || screenshot.bitDepth !== 8 || screenshot.channels !== 3 || screenshot.colorSpace !== "sRGB"
      || screenshot.alpha !== false || screenshot.bytes !== expected[1] || screenshot.sha256 !== expected[2]
      || !screenshot.role?.includes("rejected")
      || screenshot.rawToPngPixelDifferenceCount !== 0
      || (screenshot.file.includes("opacity-reduced-object-glance-v2")
        && (!screenshot.captureQualification?.includes("strict reduced speaker interval (1.02, 1.48)")
          || screenshot.runtimeMarkerAtUtc !== "2026-08-10T18:01:25.696Z"
          || screenshot.rawCaptureStartAtUtc !== "2026-08-10T18:01:25.731183811Z"
          || screenshot.captureStartSecondsAfterMarker !== 0.035183811
          || screenshot.captureStartSecondsAfterAdmission !== 1.155183811
          || screenshot.captureCompleteSecondsAfterAdmission !== 1.166618803
          || screenshot.rawCaptureWithinReducedObjectGlanceSection !== true))
      || (screenshot.file.includes("opacity-reduced-terminal-neutral-v2")
        && (screenshot.rawCaptureStartAtUtc !== "2026-08-10T18:01:29.094843532Z"
          || screenshot.captureStartSecondsAfterAdmission !== 4.518843532)))
    errors.push(`Daze council skin screenshot metadata drifted: ${screenshot.file ?? "unknown"}`);
  await verifyFacialReceipt(root, screenshot, "Daze council skin material-QA screenshot");
}

const rejectedSkinAdapterRun = skinPresentationEvidence.reviewHistory?.rejectedGraphicsAdapterZeroRun;
const skinArtReview = skinPresentationEvidence.review;
const remainingSkinRedGates = skinArtReview?.remainingRedGates ?? [];
if (rejectedSkinAdapterRun?.reviewId !== "skin-normal-v1"
    || rejectedSkinAdapterRun?.disposition !== "rejected-diagnostic-only-not-an-accepted-runtime-or-visual-receipt"
    || rejectedSkinAdapterRun?.selectedDevice !== "Intel(R) Graphics (RPL-S)"
    || rejectedSkinAdapterRun?.requestedAdapter !== 0
    || rejectedSkinAdapterRun?.runtimeAdmissionMarkers !== 0
    || rejectedSkinAdapterRun?.screenshotsAdmitted !== 0
    || rejectedSkinAdapterRun?.processReturnCode !== 1
    || rejectedSkinAdapterRun?.forcedExit !== true
    || rejectedSkinAdapterRun?.log?.file !== "$SHI_UNREAL_REVIEW_ROOT/SHI-DazeCouncilSkinLookdev-Review-normal-v1.log"
    || rejectedSkinAdapterRun?.log?.tracked !== false || rejectedSkinAdapterRun?.log?.bytes !== 92634
    || rejectedSkinAdapterRun?.log?.sha256 !== "42399c40d43592a862ed2fc0176afb2c5affcccd993fa123629db5335d1147c1"
    || skinArtReview?.technicalMaterialRouteDecision !== "pass-corrected-opacity-route-package-runtime-engineering-only"
    || skinArtReview?.visualArtDecision !== "reject-generic-low-detail-nonportrait-blockout-for-material-quality-replication-final-close-camera-or-film-quality-use"
    || skinArtReview?.correctedRouteSemantics?.source !== "MaterialMasks2K.B"
    || skinArtReview?.correctedRouteSemantics?.sourceUnorm8 !== 89
    || skinArtReview?.correctedRouteSemantics?.sourceNormalized !== 89 / 255
    || skinArtReview?.correctedRouteSemantics?.opacityThresholdExclusive !== 0.1
    || skinArtReview?.correctedRouteSemantics?.materialInput !== "MP_OPACITY"
    || skinArtReview?.correctedRouteSemantics?.opacityConnected !== true
    || skinArtReview?.correctedRouteSemantics?.subsurfaceColorConnected !== false
    || skinArtReview?.correctedRouteSemantics?.profileMeanFreePathDistance !== 2.6748
    || skinArtReview?.correctedRouteSemantics?.effectiveMeanFreePathDistance !== 0.9335576470588234
    || skinArtReview?.retainedEngineeringFactsOnly?.length !== 4
    || skinArtReview?.acceptedOnly !== undefined
    || !skinArtReview?.visualObservations?.some((item) => item.includes("generic low-detail non-portrait blockout"))
    || !skinArtReview?.visualObservations?.some((item) => item.includes("smooth, plastic and waxy"))
    || !skinArtReview?.prohibitedConclusions?.some((item) => item.includes("do not treat technical graph"))
    || !remainingSkinRedGates.some((item) => item.includes("interaction hands"))
    || !remainingSkinRedGates.some((item) => item.includes("mouth interior"))
    || !remainingSkinRedGates.some((item) => item.includes("voice, multilingual pronunciation and lip sync"))
    || !remainingSkinRedGates.some((item) => item.includes("close framing"))
    || !remainingSkinRedGates.some((item) => item.includes("identity-specific topology"))
    || !remainingSkinRedGates.some((item) => item.includes("human historical and cultural review"))
    || !remainingSkinRedGates.some((item) => item.includes("human character/anatomy review"))
    || !remainingSkinRedGates.some((item) => item.includes("human cinematic lighting/color review"))
    || !remainingSkinRedGates.some((item) => item.includes("human accessibility review")))
  errors.push("Daze council skin presentation loses the rejected adapter/graph/visual history or mandatory downstream red gates");

const rejectedV1Package = rejectedV1PresentationHistory?.package;
const expectedRejectedV1Artifacts = {
  "SHI.sh": [218, "7eeb214781ca5113696ae2be6c5124b5404cd4abcd1fff39aa383ba15ff1cf1e"],
  "SHI/Binaries/Linux/SHI": [298771056, "51062427f73e188c1c973e5c5084eff149080cde4c6489edacea8bfe686877b9"],
  "SHI/Content/Paks/SHI-Linux.pak": [10428044, "8c70154355e6968c1e9a2a645bc6c9c3d52e926ce73d9592b409dd3ec97e1dd9"],
  "SHI/Content/Paks/SHI-Linux.ucas": [176534544, "3e751425398011a9fb9eb6c4ea53dcfcae93103fc3587efcf6aaefea28a13662"],
  "SHI/Content/Paks/SHI-Linux.utoc": [158699, "1d1308f43de89141d1e2ab6eb2b4e1841f0ee701499b02baf413471aea20081a"],
};
const expectedRejectedV1Screenshots = {
  "docs/production/evidence/unreal-daze-council-skin-lookdev-normal-material-qa-v1.png": [886722, "8b1bfd728127c45fa5e70255b92ab092dfaa136aedc9fa7a4a62b2d6f3f1387d"],
  "docs/production/evidence/unreal-daze-council-skin-lookdev-reduced-object-glance-v1.png": [877456, "58ff4422393a7938edf3de2750ddadc2a9fe0aab0b62d143951f9ff209807c1a"],
  "docs/production/evidence/unreal-daze-council-skin-lookdev-reduced-terminal-neutral-v1.png": [882116, "accc35b614fdb004b6cdd3a41232f5fecfeff624abcb2c7259d20c5b10ab7a02"],
};
const rejectedV1RuntimeLogs = rejectedV1PresentationHistory?.runtimeLogs ?? [];
const rejectedV1Screenshots = rejectedV1PresentationHistory?.screenshots ?? [];
if (rejectedV1Package?.result !== "BUILD SUCCESSFUL"
    || rejectedV1Package?.cookedPackageCount !== 564
    || rejectedV1Package?.incrementallySkippedPackageCount !== 0
    || rejectedV1Package?.platformSkippedPackageCount !== 7
    || rejectedV1Package?.totalCookCandidates !== 571
    || rejectedV1Package?.isolatedAssetCount !== 5
    || rejectedV1Package?.executionSeconds !== 69.07
    || rejectedV1Package?.buildLog?.bytes !== 267356
    || rejectedV1Package?.buildLog?.sha256 !== "78c0056f72c1c48f9bf1469e8f1e9a4bbd70b6204ba4669c5964955482fe4c82"
    || !sameStringSet(rejectedV1Package?.artifacts?.map((item) => item.relativePath), Object.keys(expectedRejectedV1Artifacts))
    || (rejectedV1Package?.artifacts ?? []).some((item) => {
      const expected = expectedRejectedV1Artifacts[item.relativePath];
      return !expected || item.bytes !== expected[0] || item.sha256 !== expected[1];
    })
    || rejectedV1RuntimeLogs.length !== 2
    || rejectedV1RuntimeLogs[0]?.bytes !== 124345
    || rejectedV1RuntimeLogs[0]?.sha256 !== "544815f075cdbb4b16eb1014562d427683c00e6ab4ef04c85fb668bbbafb2667"
    || rejectedV1RuntimeLogs[0]?.exerciseAlpha !== 0.0346
    || rejectedV1RuntimeLogs[0]?.controlledExitCode !== 143
    || rejectedV1RuntimeLogs[1]?.bytes !== 124351
    || rejectedV1RuntimeLogs[1]?.sha256 !== "f9df9b0b160f3b0a66cd76c3c7622fbb36c7a8568eb80fae4d82a0c649d8e847"
    || rejectedV1RuntimeLogs[1]?.exerciseAlpha !== 1
    || rejectedV1RuntimeLogs[1]?.controlledExitCode !== 143
    || !sameStringSet(rejectedV1Screenshots.map((item) => item.file), Object.keys(expectedRejectedV1Screenshots))
    || rejectedV1Screenshots.some((item) => {
      const expected = expectedRejectedV1Screenshots[item.file];
      return !expected || item.bytes !== expected[0] || item.sha256 !== expected[1];
    })
    || !rejectedV1Screenshots.find((item) => item.file.includes("reduced-object-glance-v1"))?.captureQualification?.includes("Legacy filename only")
    || rejectedV1PresentationHistory?.visualDecision !== "rejected-orange-bright-waxy-smooth-no-replication"
    || rejectedV1PresentationHistory?.materialEngineeringAdmission !== false
    || rejectedV1PresentationHistory?.finalSkin !== false)
  errors.push("Daze council skin presentation does not retain the exact rejected-v1 package, runtime and screenshot diagnostic history");

const correctedV3History = skinPresentationEvidence.reviewHistory?.supersededCorrectedV3PrePrivacyPackageAndRuntime;
if (correctedV3History?.status !== "superseded-historical-engineering-evidence-only-watched-visual-rejected"
    || correctedV3History?.historicalImportReceipt?.bytes !== 35830
    || correctedV3History?.historicalImportReceipt?.sha256 !== "e65269ea71bee3d95d5cb7c1078e3f63578ba3f13eb510fb9436f213c275e6f8"
    || correctedV3History?.historicalImportReceipt?.immutableImportReceiptRootSha256 !== "57ea5e3c55a340ae4cf19e8b3506ec62e0fb0a2e1d55206a833a0b19052286f6"
    || correctedV3History?.historicalImportReceipt?.currentPrivacyAdmission !== false
    || correctedV3History?.currentPackageAuthority !== false
    || correctedV3History?.package?.executionSeconds !== 67.92
    || correctedV3History?.package?.buildLog?.bytes !== 269498
    || correctedV3History?.package?.buildLog?.sha256 !== "fa8859cb712b3b13a353b8a1453c1b062f3b27b2bfbd852420ad7adf41252eb9"
    || correctedV3History?.runtimeLogs?.[0]?.bytes !== 124516
    || correctedV3History?.runtimeLogs?.[0]?.sha256 !== "3919f3606ee6adddbd97b785d705e4b24c9b75f1014183ba37f4bbe5d9609d03"
    || correctedV3History?.runtimeLogs?.[0]?.exerciseAlpha !== 0.0108
    || correctedV3History?.runtimeLogs?.[1]?.bytes !== 124522
    || correctedV3History?.runtimeLogs?.[1]?.sha256 !== "9aac883e892d4890c16d54b0630109784e9c02889d18ea14dfbff92c2aafc575"
    || correctedV3History?.runtimeLogs?.[1]?.exerciseAlpha !== 1
    || correctedV3History?.supersededScreenshotReceipts?.some((item) => item.currentTrackedPayloadRetained !== false)
    || correctedV3History?.visualArtMaterialQualityAdmission !== false
    || correctedV3History?.finalSkin !== false
    || correctedV3History?.closeCameraApproved !== false
    || correctedV3History?.humanReviewApproved !== false)
  errors.push("Daze council skin presentation loses exact superseded corrected-v3 diagnostic history");

const rejectedPrivacyV4History = skinPresentationEvidence.reviewHistory?.rejectedPrivacyV4PackageAndRuntime;
if (rejectedPrivacyV4History?.status !== "rejected-for-public-package-workstation-path-leak-diagnostic-engineering-history-only"
    || rejectedPrivacyV4History?.packagePrivacyAdmission !== false
    || rejectedPrivacyV4History?.currentPackageAuthority !== false
    || rejectedPrivacyV4History?.package?.executionSeconds !== 91.02
    || rejectedPrivacyV4History?.package?.buildLog?.bytes !== 283497
    || rejectedPrivacyV4History?.package?.buildLog?.sha256 !== "09dc4a60725d8eee4011ed9f5f5947a35378fdc6dc3f91ff24378adeb7308aa5"
    || rejectedPrivacyV4History?.package?.artifacts?.find((item) => item.relativePath === "SHI/Binaries/Linux/SHI")?.currentWorkstationPathMatches !== 6
    || rejectedPrivacyV4History?.package?.additionalPathLeakCounts?.["SHI.debug"] !== 93
    || rejectedPrivacyV4History?.package?.additionalPathLeakCounts?.["SHI.sym"] !== 192
    || rejectedPrivacyV4History?.runtimeLogs?.[0]?.bytes !== 124513
    || rejectedPrivacyV4History?.runtimeLogs?.[0]?.sha256 !== "eb41b352636adbfc9e1ae5c57e9c5f9a2ec36dc5ca9b6d51aa4c17d3460af78a"
    || rejectedPrivacyV4History?.runtimeLogs?.[0]?.exerciseAlpha !== 0.002
    || rejectedPrivacyV4History?.runtimeLogs?.[1]?.bytes !== 124519
    || rejectedPrivacyV4History?.runtimeLogs?.[1]?.sha256 !== "b4532e1aeb634bf4a3aa48dda2cd3f2688a632ba93887f1e679b7b6cf31f1cb3"
    || rejectedPrivacyV4History?.runtimeLogs?.[1]?.exerciseAlpha !== 1
    || rejectedPrivacyV4History?.captureEvidence?.timingReceipt?.sha256 !== "43b6b5dd03cc7195ca818703db71bd1372ff469cae66fdcaf65ca04db2aa768b"
    || rejectedPrivacyV4History?.captureEvidence?.glanceRawXwd?.sha256 !== "27e42e63b20d2db579165909380a65bb854bf1319fe2ad4c34a1f77a404b7222"
    || rejectedPrivacyV4History?.captureEvidence?.terminalRawXwd?.sha256 !== "142cde618b562091536215edd91ee758d51a107524f6e5979fd882362f823947"
    || rejectedPrivacyV4History?.visualArtMaterialQualityAdmission !== false
    || rejectedPrivacyV4History?.finalSkin !== false
    || rejectedPrivacyV4History?.closeCameraApproved !== false
    || rejectedPrivacyV4History?.humanReviewApproved !== false)
  errors.push("Daze council skin presentation loses exact rejected privacy-v4 package/runtime history");

const project = JSON.parse(await readFile(resolve(unreal, "SHI.uproject"), "utf8"));
if (project.EngineAssociation !== "5.8") errors.push("Unreal engine association must be 5.8");
if (!project.Modules?.some((module) => module.Name === "SHI" && module.Type === "Runtime")) errors.push("SHI runtime module is not registered");
if (!project.Modules?.some((module) => module.Name === "SHIEditor" && module.Type === "Editor")) errors.push("SHI editor-only animation import module is not registered");

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
const commandSurfacePresentation = await readFile(resolve(unreal, "Source/SHI/ShiCommandSurfacePresentationModel.cpp"), "utf8");
const wetFieldPresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldEnvironmentPresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldEnvironmentPresentationModel.cpp"), "utf8")}`;
const shelterPresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiDazeFieldShelterPresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiDazeFieldShelterPresentationModel.cpp"), "utf8")}`;
const rainPresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiRainPresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiRainPresentationModel.cpp"), "utf8")}`;
const rainField = `${await readFile(resolve(unreal, "Source/SHI/ShiRainField.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiRainField.cpp"), "utf8")}`;
const vegetationPresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldVegetationPresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldVegetationPresentationModel.cpp"), "utf8")}`;
const vegetationActor = `${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldVegetation.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiWetFieldVegetation.cpp"), "utf8")}`;
const commandWeightPresentation = await readFile(resolve(unreal, "Source/SHI/ShiCommandWeightPresentationModel.cpp"), "utf8");
const councilStaging = await readFile(resolve(unreal, "Source/SHI/ShiCouncilStagingModel.cpp"), "utf8");
const councilCharacterPresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiCouncilCharacterPresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiCouncilCharacterPresentationModel.cpp"), "utf8")}`;
const councilPerformancePresentation = `${await readFile(resolve(unreal, "Source/SHI/ShiCouncilPerformancePresentationModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiCouncilPerformancePresentationModel.cpp"), "utf8")}`;
const councilFacialPerformance = `${await readFile(resolve(unreal, "Source/SHI/ShiCouncilFacialPerformanceModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiCouncilFacialPerformanceModel.cpp"), "utf8")}`;
const councilSkinLookdev = `${await readFile(resolve(unreal, "Source/SHI/ShiCouncilSkinLookdevModel.h"), "utf8")}\n${await readFile(resolve(unreal, "Source/SHI/ShiCouncilSkinLookdevModel.cpp"), "utf8")}`;
const councilFigure = await readFile(resolve(unreal, "Source/SHI/ShiCouncilFigure.cpp"), "utf8");
const cinematic = await readFile(resolve(unreal, "Source/SHI/ShiCinematicBeatModel.cpp"), "utf8");
const orderTransaction = await readFile(resolve(unreal, "Source/SHI/ShiOrderTransactionModel.cpp"), "utf8");
const engagementModel = await readFile(resolve(unreal, "Source/SHI/ShiEngagementModel.cpp"), "utf8");
const engagementSession = await readFile(resolve(unreal, "Source/SHI/ShiEngagementSession.cpp"), "utf8");
const engagementSignals = await readFile(resolve(unreal, "Source/SHI/ShiEngagementSignalModel.cpp"), "utf8");
const gameMode = await readFile(resolve(unreal, "Source/SHI/ShiGameMode.cpp"), "utf8");
const screen = await readFile(resolve(unreal, "Source/SHI/ShiCommandScreen.cpp"), "utf8");
const automation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp"), "utf8");
const engagementAutomation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiEngagementAutomationTest.cpp"), "utf8");
const councilSkinLookdevAutomation = await readFile(resolve(unreal, "Source/SHI/Private/Tests/ShiCouncilSkinLookdevAutomationTest.cpp"), "utf8");
const buildRules = await readFile(resolve(unreal, "Source/SHI/SHI.Build.cs"), "utf8");
const gameConfig = await readFile(resolve(unreal, "Config/DefaultGame.ini"), "utf8");
const engineConfig = await readFile(resolve(unreal, "Config/DefaultEngine.ini"), "utf8");
const pipeline = await readFile(resolve(root, "scripts/unreal-pipeline.sh"), "utf8");
const commandWeightMaterialAuthor = await readFile(resolve(root, "scripts/author-command-weight-materials-unreal.py"), "utf8");
const commandSurfaceMaterialAuthor = await readFile(resolve(root, "scripts/author-command-surface-materials-unreal.py"), "utf8");
const wetFieldImporter = await readFile(resolve(root, "scripts/import-field-environment-unreal.py"), "utf8");
const wetFieldMaterialAuthor = await readFile(resolve(root, "scripts/author-field-environment-materials-unreal.py"), "utf8");
const shelterImporter = await readFile(resolve(root, "scripts/import-daze-field-shelter-unreal.py"), "utf8");
const shelterMaterialAuthor = await readFile(resolve(root, "scripts/author-daze-field-shelter-materials-unreal.py"), "utf8");
const rainImporter = await readFile(resolve(root, "scripts/import-daze-rain-vfx-unreal.py"), "utf8");
const rainMaterialAuthor = await readFile(resolve(root, "scripts/author-daze-rain-vfx-materials-unreal.py"), "utf8");
const vegetationImporter = await readFile(resolve(root, "scripts/import-daze-wet-field-vegetation-unreal.py"), "utf8");
const vegetationMaterialAuthor = await readFile(resolve(root, "scripts/author-daze-wet-field-vegetation-material-unreal.py"), "utf8");
const councilCharacterImporter = await readFile(resolve(root, "scripts/import-daze-council-characters-unreal.py"), "utf8");
const councilCharacterMaterialAuthor = await readFile(resolve(root, "scripts/author-daze-council-character-materials-unreal.py"), "utf8");
const councilPerformanceImporter = await readFile(resolve(root, "scripts/import-daze-council-performance-unreal.py"), "utf8");
const councilPerformanceNormalizer = await readFile(resolve(unreal, "Source/SHIEditor/Private/ShiAnimationImportLibrary.cpp"), "utf8");
const councilFacialGenerator = await readFile(resolve(root, "scripts/build-daze-council-facial-performance.py"), "utf8");
const councilFacialValidator = await readFile(resolve(root, "scripts/validate-daze-council-facial-performance.py"), "utf8");
const councilFacialPackageValidator = await readFile(resolve(root, "scripts/validate-daze-council-facial-performance-package.mjs"), "utf8");
const councilFacialImporter = await readFile(resolve(root, "scripts/import-daze-council-facial-performance-unreal.py"), "utf8");
const councilSkinLookdevImporter = await readFile(resolve(root, "scripts/import-daze-council-skin-lookdev-unreal.py"), "utf8");
const councilFacialBrief = await readFile(resolve(root, "docs/art/DAZE_COUNCIL_FACIAL_PERFORMANCE_BRIEF.md"), "utf8");
for (const token of ["schema v7", "TimeIndex <=", "NextActIndex <", "StreamingAssets/chapter-01-daze.json", "StreamingAssets/editions.json", "initialResources", "nextNodeId", "commitments", "countermeasures", "characters", "speakerId", "FindCharacter", "ValidateEvidence", "public-link-metadata-only", "specialist-review-required"]) if (!model.includes(token)) errors.push(`Unreal model omits contract token: ${token}`);
for (const token of ["ApplyEffects(Choice->Effects)", "CommitmentOutcome->Effects", "Choice->PressureEffects", "Opposition->Effects", "MethodRead->Effects", "Condition->Effects", "SelectFieldCondition", "CanChoose", "ReplaySaveJson", "MoveTemp(Candidate)"]) if (!session.includes(token)) errors.push(`Unreal deterministic session omits contract token: ${token}`);
for (const token of ["project-original-procedural", "RequiredCues", "CreateRainSamples", "CreateCueSamples", "bDefaultEnabled"]) if (!audioModel.includes(token)) errors.push(`Unreal audio model omits contract token: ${token}`);
for (const token of ["FShiSoundGenerator", "CreateSoundGenerator", "PendingCues", "GGameUserSettingsIni", "FadeSeconds", "OutAudio[Frame * 2]", "OutAudio[Frame * 2 + 1]"]) if (!soundscape.includes(token)) errors.push(`Unreal soundscape omits render/persistence token: ${token}`);
for (const token of ["ProjectSite", "CameraTransform", "Cylinder.Cylinder", "Sphere.Sphere", "Cone.Cone", "Dist2D", "CycleSite", "TableHalfWidth", "TableHalfDepth"]) if (!wartable.includes(token)) errors.push(`Unreal wartable model omits spatial contract token: ${token}`);
for (const token of ["resource-grain", "layer-field", "layer-pursuit", "layer-method-read", "layer-commitment", "TableSurfaceZ", "MinimumPointerSpacing", "COUNTER WOULD HIT", "PURSUIT CLOSED · CAPTURED", "EXPOSURE 100 / 100", "SelectedStyle", "CameraTransform", "CycleSignal", "ValidateAgainstSites", "overlaps wartable site", "No carried promise currently awaits an answer."]) if (!commandSignals.includes(token)) errors.push(`Unreal command-signal model omits live-world contract token: ${token}`);
for (const token of ["SM_SHI_CommandSurface_01.SM_SHI_CommandSurface_01", "SurfaceTopZ", "HalfWidth", "HalfDepth", "EdgeClearance", "FTransform::Identity", "bInteractive = false", "bCollisionEnabled = false", "bVisibleDuringEngagement = true", "FitsSafeField", "ValidateAgainstSites", "ReviewCameraTransform"]) if (!commandSurfacePresentation.includes(token)) errors.push(`Unreal command-surface presentation model omits bounded stage token: ${token}`);
for (const token of ["SM_SHI_WetFieldEnvironment_01.SM_SHI_WetFieldEnvironment_01", "BoundsMinimum", "BoundsMaximum", "FTransform::Identity", "bInteractive = false", "bCollisionEnabled = false", "bAffectsNavigation = false", "bVisibleDuringEngagement = true", "MinimumCommandSurfaceClearance", "ReviewCameraTransform", "52.f", "ExposureCompensation", "-1.5f"]) if (!wetFieldPresentation.includes(token)) errors.push(`Unreal wet-field presentation model omits bounded environment token: ${token}`);
for (const token of ["SM_SHI_DazeFieldShelter_01.SM_SHI_DazeFieldShelter_01", "FICTIONAL PRACTICAL FIELD CONSTRUCTION", "NOT AN ATTESTED DAZE RECONSTRUCTION", "PRODUCTION BLOCKOUT", "FTransform::Identity", "PostCenters", "MinimumPostClearance", "MinimumEaveHeight", "bHistoricallyAttested = false", "bFinalArt = false", "bInteractive = false", "bCollisionEnabled = false", "bAffectsNavigation = false", "bVisibleDuringEngagement = true", "ReviewCameraTransform", "52.f"]) if (!shelterPresentation.includes(token)) errors.push(`Unreal Daze-shelter presentation model omits bounded construction/disclosure token: ${token}`);
for (const token of ["SM_SHI_RainStreak_01.SM_SHI_RainStreak_01", "SM_SHI_RainRipple_01.SM_SHI_RainRipple_01", "M_SHI_RainStreak.M_SHI_RainStreak", "M_SHI_RainRipple.M_SHI_RainRipple", "DRAMATIC RAIN RECONSTRUCTION", "NOT EVIDENCE OF EXACT DAZE WEATHER IN 209 BCE", "PRODUCTION VFX BLOCKOUT", "FTransform::Identity", "FieldHalfExtent", "ShelterRoofIntercept", "MaximumDeltaSeconds", "StreakInstanceCount", "RipplePoolInstanceCount", "0x5EED209u", "bHistoricallyAttestedWeather = false", "bFinalArt = false", "bInteractive = false", "bCollisionEnabled = false", "bAffectsNavigation = false", "bAffectsGameplay = false", "bSerialized = false", "bTiedToRainAudio = false", "bVisibleDuringEngagement = true", "CanSpawnGroundRipple", "ReviewCameraTransform", "50.f"]) if (!rainPresentation.includes(token)) errors.push(`Unreal Daze-rain presentation model omits bounded VFX/disclosure token: ${token}`);
for (const token of ["UInstancedStaticMeshComponent", "RainStreakInstances", "RainRippleInstances", "FRandomStream", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "SetGenerateOverlapEvents(false)", "SetCanEverAffectNavigation(false)", "SetActorEnableCollision(false)", "StreakStates.SetNum", "RippleStates.SetNum", "ImpactHeightAt", "CanSpawnGroundRipple", "BatchUpdateInstancesTransforms", "bReplicates = false"]) if (!rainField.includes(token)) errors.push(`Unreal Daze-rain actor omits bounded instancing/non-authority token: ${token}`);
for (const token of ["SM_SHI_FieldStalkClump_01.SM_SHI_FieldStalkClump_01", "SM_SHI_LowBladeTuft_01.SM_SHI_LowBladeTuft_01", "M_SHI_RainDarkenedFieldPlant.M_SHI_RainDarkenedFieldPlant", "GENERIC RAIN-FLATTENED FIELD-EDGE FORMS", "NOT AN EXACT BOTANICAL RECONSTRUCTION", "PRODUCTION VEGETATION BLOCKOUT", "FTransform::Identity", "RootHalfExtent", "CentralExclusionHalfExtent", "RouteHalfWidth", "StalkInstanceCount", "TuftInstanceCount", "0x5EED20Au", "bExactBotanicalReconstruction = false", "bFinalArt = false", "bInteractive = false", "bCollisionEnabled = false", "bAffectsNavigation = false", "bAffectsGameplay = false", "bSerialized = false", "bReplicated = false", "bCpuAnimated = false", "bMaterialWindOnly = true", "bVisibleDuringEngagement = true", "IsRootAdmitted", "ReviewCameraTransform", "52.f"]) if (!vegetationPresentation.includes(token)) errors.push(`Unreal wet-field-vegetation presentation model omits bounded placement/disclosure token: ${token}`);
for (const token of ["UHierarchicalInstancedStaticMeshComponent", "FieldStalkInstances", "LowBladeTuftInstances", "PrimaryActorTick.bCanEverTick = false", "bReplicates = false", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "SetGenerateOverlapEvents(false)", "SetCanEverAffectNavigation(false)", "SetActorEnableCollision(false)", "SetCullDistances", "AddInstances", "GetInstanceCount", "IsRootAdmitted"]) if (!vegetationActor.includes(token)) errors.push(`Unreal wet-field-vegetation actor omits bounded HISM/non-authority token: ${token}`);
for (const token of ["SM_SHI_CommandWeight_01.SM_SHI_CommandWeight_01", "FShiCommandSurfacePresentationModel::SurfaceTopZ", "FShiCommandSurfacePresentationModel::EdgeClearance", "MinimumMarkerClearance", "CouncilAspectRatio", "bInteractive = false", "bVisibleDuringEngagement = false", "FRotator(0.f, 20.f, 0.f)", "FitsCommandSurface", "ProjectToCouncilFrame", "ReviewCameraTransform", "44.f", "too small in the council composition"]) if (!commandWeightPresentation.includes(token)) errors.push(`Unreal command-weight presentation model omits bounded placement/lens token: ${token}`);
for (const token of ["SHI_COMMAND_WEIGHT_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNTS", "REVIEWED_PARAMETER_VALUES", "NOISEFUNCTION_GRADIENT_TEX3D", "delete_all_material_expressions", "retune_authored_material", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_METALLIC", "MP_SPECULAR", "MP_AMBIENT_OCCLUSION", "MP_NORMAL", "compileClean", "inspect-only"]) if (!commandWeightMaterialAuthor.includes(token)) errors.push(`Unreal command-weight material author omits bounded graph/inspection token: ${token}`);
for (const token of ["SHI_COMMAND_SURFACE_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNTS", "REVIEWED_PARAMETER_VALUES", "NOISEFUNCTION_GRADIENT_TEX3D", "delete_all_material_expressions", "retune_authored_material", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_METALLIC", "MP_SPECULAR", "MP_AMBIENT_OCCLUSION", "MP_NORMAL", "compileClean", "inspect-only"]) if (!commandSurfaceMaterialAuthor.includes(token)) errors.push(`Unreal command-surface material author omits bounded graph/inspection token: ${token}`);
for (const token of ["SHI_FIELD_ENVIRONMENT_REIMPORT", "inspect-only", "SM_SHI_WetFieldEnvironment_01", "M_SHI_WetFieldGround", "M_SHI_ShallowRainwater", "lod_triangles == [9120, 2492]", "all(count >= 2 for count in lod_uv_channels)", "convex_collision_count == 1", "light_map_resolution\")) == 256", "naniteEnabled"]) if (!wetFieldImporter.includes(token)) errors.push(`Unreal wet-field importer omits bounded reimport/inspection token: ${token}`);
for (const token of ["SHI_FIELD_ENVIRONMENT_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNTS", "REVIEWED_PARAMETER_VALUES", "NOISEFUNCTION_GRADIENT_TEX3D", "VertexColor", "delete_all_material_expressions", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_METALLIC", "MP_SPECULAR", "MP_AMBIENT_OCCLUSION", "compileClean", "inspect-only"]) if (!wetFieldMaterialAuthor.includes(token)) errors.push(`Unreal wet-field material author omits bounded graph/inspection token: ${token}`);
for (const token of ["SHI_DAZE_FIELD_SHELTER_REIMPORT", "inspect-only", "SM_SHI_DazeFieldShelter_01", "M_SHI_RainDarkenedWood", "M_SHI_WovenReedMat", "M_SHI_CoarseFiberCord", "lod_triangles == [3948, 460]", "all(count >= 2 for count in lod_uv_channels)", "simple_collision_count == 0", "convex_collision_count == 0", "light_map_resolution\")) == 256", "naniteDeliberatelyOff"]) if (!shelterImporter.includes(token)) errors.push(`Unreal Daze-shelter importer omits bounded reimport/inspection token: ${token}`);
for (const token of ["SHI_DAZE_FIELD_SHELTER_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNTS", "REVIEWED_PARAMETER_VALUES", "NOISEFUNCTION_GRADIENT_TEX3D", "VertexColor", "delete_all_material_expressions", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_METALLIC", "MP_SPECULAR", "MP_AMBIENT_OCCLUSION", "MP_NORMAL", "compileClean", "inspect-only"]) if (!shelterMaterialAuthor.includes(token)) errors.push(`Unreal Daze-shelter material author omits bounded graph/inspection token: ${token}`);
for (const token of ["SHI_DAZE_RAIN_VFX_REIMPORT", "inspect-only", "SM_SHI_RainStreak_01", "SM_SHI_RainRipple_01", "M_SHI_RainStreak", "M_SHI_RainRipple", "lod_triangles", "triangles", "all(count >= 2 for count in lod_uv_channels)", "simple_collision_count == 0", "convex_collision_count == 0", "light_map_resolution\")) == 64", "naniteDeliberatelyOff"]) if (!rainImporter.includes(token)) errors.push(`Unreal Daze-rain importer omits bounded reimport/inspection token: ${token}`);
for (const token of ["SHI_DAZE_RAIN_VFX_AUTHOR_MATERIALS", "used_with_instanced_static_meshes", "delete_material_expression", "MP_OPACITY", "MP_EMISSIVE_COLOR", "MP_BASE_COLOR", "MP_NORMAL", "compileClean", "exactNodeCount", "noTextures", "inspect-only"]) if (!rainMaterialAuthor.includes(token)) errors.push(`Unreal Daze-rain material author omits exact translucent graph/inspection token: ${token}`);
for (const token of ["SHI_DAZE_VEGETATION_REIMPORT", "inspect-only", "SM_SHI_FieldStalkClump_01", "SM_SHI_LowBladeTuft_01", "M_SHI_RainDarkenedFieldPlant", "triangles", "all(count >= 2 for count in lod_uv_channels)", "simple_collision_count == 0", "convex_collision_count == 0", "light_map_resolution\")) == 64", "naniteDeliberatelyOff"]) if (!vegetationImporter.includes(token)) errors.push(`Unreal wet-field-vegetation importer omits bounded reimport/inspection token: ${token}`);
for (const token of ["SHI_DAZE_VEGETATION_AUTHOR_MATERIAL", "EXPECTED_NODE_COUNT = 15", "used_with_instanced_static_meshes", "MaterialExpressionVertexColor", "MaterialExpressionTime", "MaterialExpressionSine", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_SPECULAR", "MP_WORLD_POSITION_OFFSET", "MP_NORMAL", "MP_EMISSIVE_COLOR", "MP_OPACITY", "compileClean", "noTextureNormalEmissiveOrOpacityPretence", "inspect-only"]) if (!vegetationMaterialAuthor.includes(token)) errors.push(`Unreal wet-field-vegetation material author omits exact GPU-wind graph/inspection token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_CHARACTERS_REIMPORT", "inspect-only", "SK_SHI_DazeCouncil_Skeleton", "asset_name", "Keeper", "ChenSheng", "WuGuang", "YuMu", "QinCourier", "PRESENTATION_SCALE = 100.0", "FBXNIM_IMPORT_NORMALS", "exactReferencePoseBones", "identityScaleReferenceRoot", "presentedPhysicalHeight", "noPhysicsAsset", "noMorphTargets"]) if (!councilCharacterImporter.includes(token)) errors.push(`Unreal council-character importer omits exact shared-skeleton admission token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNT = 3", "used_with_skeletal_mesh", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_SPECULAR", "MP_NORMAL", "MP_EMISSIVE_COLOR", "MP_OPACITY", "MP_WORLD_POSITION_OFFSET", "compileClean", "noTextureNormalEmissiveOpacityOrDisplacementPretence", "inspect-only"]) if (!councilCharacterMaterialAuthor.includes(token)) errors.push(`Unreal council-character material author omits exact texture-free skeletal graph token: ${token}`);
for (const token of ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier", "SK_SHI_DazeCouncil_Skeleton", "SKELETAL COUNCIL CHARACTER PRODUCTION BLOCKOUT", "PresentationScale", "BoneCount", "MaximumTriangles", "bPrimitiveInteractionFallback", "bWideAndMediumFramingOnly", "ValidateMesh", "GetPhysicsAsset", "GetMorphTargets", "GetTotalFaces"]) if (!councilCharacterPresentation.includes(token)) errors.push(`Unreal council-character presentation omits identity/skeleton/red-gate token: ${token}`);
for (const token of ["attentive-idle", "speaker-measured", "AN_SHI_DazeCouncil_AttentiveIdle_01", "AN_SHI_DazeCouncil_SpeakerMeasured_01", "ExpectedSamples", "ExpectedDurationSeconds", "ExpectedFramesPerSecond", "bBodyOnly", "bSharedSkeleton", "bRootMotion", "bFacialPerformance", "bInteractionAuthority", "bHistoricallyReconstructedEtiquette", "bFinalPerformance", "ValidateSequence", "GetNumberOfSampledKeys", "HasRootMotion"]) if (!councilPerformancePresentation.includes(token)) errors.push(`Unreal council-performance model omits exact clip/timing/authority token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_PERFORMANCE_REIMPORT", "inspect-only", "EXPECTED_SAMPLES = 121", "EXPECTED_IMPORTED_TRACKS = 52", "remove", "rootTrackRemoved", "rootReferencePosePreserved", "rotationOnlyChildChannels", "ShiAnimationImportLibrary.normalize_rotation_only_sequence", "shared-skeleton council body-performance blockout; not final acting"]) if (!councilPerformanceImporter.includes(token)) errors.push(`Unreal council-performance importer omits isolated rotation-only admission token: ${token}`);
for (const token of ["ExpectedSampleCount", "ReferencePose", "GetBoneTrackTransforms", "Track.Rotations", "RemoveBoneTrack", "Positions.Init(Track.ReferenceTranslation", "Scales.Init(Track.ReferenceScale", "SetBoneTrackKeys", "did not isolate exactly 52 child-body tracks"]) if (!councilPerformanceNormalizer.includes(token)) errors.push(`Unreal editor-only animation normalizer omits Root-removal/reference-channel token: ${token}`);
for (const token of ["shi-daze-council-facial-performance-v1", "FACEUNITS_ARCHIVE_SHA256", "load_arkit_faceunits=True", "retain_exact_shape_keys", "MORPH_TARGETS", "EYE_GAZE_TARGETS", "REVIEW_STATES", "brown-eye-cc0.png", "neuralGeneration", "voiceOrTranscriptInput"]) if (!councilFacialGenerator.includes(token)) errors.push(`Daze council facial generator omits pinned source/morph/review token: ${token}`);
for (const token of ["shi-daze-council-facial-performance-v1", "cross_format_morph_equivalence", "tolerance_metres = 0.000005", "morph_scale_to_metres = 1.0", "MORPH_TARGETS", "EYE_GAZE_TARGETS", "EYE_TEXTURE_SHA256", "importerOnlyHelperMeshes", "--skip-render", "cleanFbxStateRenders"]) if (!councilFacialValidator.includes(token)) errors.push(`Daze council facial clean-interchange validator omits exact morph/equivalence token: ${token}`);
for (const token of ["SHI_UNREAL_PACKAGE_ROOT", "SHI_FACIAL_SPEAKER_LOG", "SHI_FACIAL_REDUCED_LOG", "SHI_FACIAL_KEEPER_LOG", "$SHI_UNREAL_PACKAGE_ROOT/Linux", "SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED", "ReducedMotion=", "ReturnCode=143", "Default Material will be used in game", "sha256File"]) if (!councilFacialPackageValidator.includes(token)) errors.push(`Daze council facial package validator omits exact artifact/log gate token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_FACIAL_REIMPORT", "inspect-only", "/Game/SHI/Art/Characters/DazeCouncilFacial", "SKELETON_PATH = f\"{LEGACY_DESTINATION}/{SKELETON_NAME}\"", "import_morph_targets", "morph_threshold_position", "exactTwentyOneMorphTargetsNoExtras", "acceptedV1DiskReceiptsUnchanged", "options.import_animations = False", "options.create_physics_asset = False", "coordinateTransform", "sourceToAssetLocalScale", "morphMetadataExtension", "existingMetadataPreserved", "trackedUnrealAssets", "previous_import_report", "readOnlyInspection", "trackedUassetHashesUnchanged", "set_base_material_usage", "MATUSAGE_SKELETAL_MESH", "MATUSAGE_MORPH_TARGETS", "exactMorphTargetUsageNoShaderPermutationExtras", "materialUsagePassed"]) if (!councilFacialImporter.includes(token)) errors.push(`Unreal Daze council facial importer omits gated, isolated morph/Skeleton/material evidence token: ${token}`);
for (const token of ["FACIAL PERFORMANCE ENGINEERING BLOCKOUT", "exactly these 21 case-sensitive names", "Every omitted control is exactly `0.0`", "never a random number, audio amplitude", "Reduced-motion presentation", "shared generic non-portrait blockout", "0.000005 m", "No attractive still, successful import, machine pass or source license turns this engineering blockout into final acting"]) if (!councilFacialBrief.includes(token)) errors.push(`Daze council facial brief omits exact morph/determinism/source/red-gate token: ${token}`);
for (const token of ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier", "SKM_SHI_DazeCouncil_Keeper_Facial_01", "SKM_SHI_DazeCouncil_ChenSheng_Facial_01", "SKM_SHI_DazeCouncil_WuGuang_Facial_01", "SKM_SHI_DazeCouncil_YuMu_Facial_01", "SKM_SHI_DazeCouncil_QinCourier_Facial_01", facialExpectedSkeleton, "MorphTargetCount", "eyeBlinkLeft", "eyeLookOutLeft", "jawOpen", "mouthFunnel", "held-breath", "silent-speech", "bGenericNonPortraitFace", "bLanguageNeutral", "bSilentIntentCadence", "bReducedMotionSupported", "bRandomized", "bGameplayAuthority", "bSaveAuthority", "bWideAndMediumFramingOnly", "ValidateMesh", "GetMorphTargets", "GetTotalFaces", "SmoothPulse", "FMath::Fmod", "ValidateFrame"]) if (!councilFacialPerformance.includes(token)) errors.push(`Unreal council facial model omits exact identity/Skeleton/morph/determinism/red-gate token: ${token}`);
for (const token of ["speaker", "keeper", "HISTORICAL FIGURE · WORDS ARE AUTHORED DRAMATIZATION, NOT TRANSCRIPT", "FICTIONAL CHARACTER · PROJECT-AUTHORED DRAMATIC RECONSTRUCTION", "SpeakerCamera", "ParticipantCamera", "BuildParticipantReviewCamera", "BuildParticipantLights", "speaker-key", "speaker-fill", "keeper-key", "keeper-fill", "CouncilFieldOfViewDegrees", "FindParticipant", "SameParticipant", "cannot preserve canonical cast, disclosure, blocking and camera authorship", "OutStage = MoveTemp(Candidate)"]) if (!councilStaging.includes(token)) errors.push(`Unreal council staging omits cast/blocking/disclosure/review-camera/light token: ${token}`);
for (const token of ["FigureRoot", "Body", "Head", "Mantle", "CharacterMesh", "InitializeFigure", "FShiCouncilCharacterPresentationModel::CanonicalCharacterIds", "FShiCouncilCharacterPresentationModel::ValidateMesh", "SetSkeletalMeshAsset", "ShiCharacter:", "ShiCouncilSpeaker", "ShiArtStatus:SkeletalProductionBlockout", "ShiArtFallback:EnginePrimitive", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "SetCanEverAffectNavigation(false)", "SetVisibility", "SetHiddenInGame", "SetRenderCustomDepth", "SetCustomDepthStencilValue", "SetActorTransform"]) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits fail-closed skeletal presentation/primitive interaction token: ${token}`);
for (const token of ["FShiCouncilPerformancePresentationModel::CanonicalRoleIds", "FShiCouncilPerformancePresentationModel::ForParticipant", "PerformanceClips", "SetForceRefPose(false)", "PlayAnimation", "ShiPerformance:", "ShiPerformanceStatus:SharedSkeletonBodyBlockout", "ShiPerformanceFallback:ReferencePose", "SetComponentTickEnabled"]) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits admitted performance/reference-pose fallback token: ${token}`);
for (const token of ["FShiCouncilFacialPerformanceModel::CanonicalCharacterIds", "FShiCouncilFacialPerformanceModel::ValidateMesh", "FacialCharacterMeshes", "accepted neutral-face fallback", "bUsingFacialPerformance", "FacialElapsedSeconds", "SetReducedMotion", "ApplyFacialFrame", "ClearFacialFrame", "RefreshActorTick", "SetMorphTarget", "ClearMorphTargets", "ShiArtStatus:FacialPerformanceEngineeringBlockout", "ShiFacialPerformance:SilentIntentCadence", "ShiFraming:WideMediumOnly", "SetActorTickEnabled", "SHI_COUNCIL_FACIAL_RUNTIME_ADMITTED", "SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED", "state=object-glance skin=SkinClay eye=EyeBrown"] ) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits fail-closed facial preference/fallback/cadence/runtime-exercise token: ${token}`);
for (const token of ["resolution-order", "resolution-commitment", "resolution-pressure", "resolution-pursuit", "resolution-method-read", "resolution-field", "resolution-position", "MaximumSequenceSeconds", "MaximumEasedTranslation", "MaximumEasedRotationDegrees", "FieldOfViewForBeat", "CameraMotionBetween", "TEXT(\"cut\")", "TEXT(\"ease\")", "DominantResourceSignal", "EffectsSummary", "POSITION LOST", "OATH ESTABLISHED", "TotalDuration", "OutBeats = MoveTemp(BuiltBeats)"]) if (!cinematic.includes(token)) errors.push(`Unreal cinematic model omits resolution/motion-grammar token: ${token}`);
for (const token of ["BuildTurnSnapshot", "Candidate.Session = CurrentSession", "ResolveChoice", "ValidateAgainstSites", "FShiCouncilStagingModel::Build", "FShiCinematicBeatModel::Build", "SelectedChoiceIndex", "CouncilStage", "ExportSaveJson", "TransactionSave != ExpectedSave", "SameResolution", "SameSignals", "SameBeats", "SameCouncilStage", "OutTransaction = MoveTemp(Candidate)"]) if (!orderTransaction.includes(token)) errors.push(`Unreal order transaction omits fail-closed preflight token: ${token}`);
for (const token of ["StreamingAssets/chapter-01-broken-crossing.v1.json", "validated-shared-contract-not-campaign-authority", "dramatic-reconstruction", "crossingProgress", "signalIntegrity", "Every plan requires two legal options per pulse", "ordered best-to-unconditional-fallback", "Engagement claim sources are incomplete"]) if (!engagementModel.includes(token)) errors.push(`Unreal engagement model omits shared-contract token: ${token}`);
for (const token of ["ApplyMetricEffects", "AvailableCommands", "MeetsRequirements", "Completed engagement has no authored outcome", "plan, condition and command identifiers", "SameRecord", "Engagement save state diverges from identifier replay", "*this = MoveTemp(Candidate)"]) if (!engagementSession.includes(token)) errors.push(`Unreal engagement session omits deterministic/replay token: ${token}`);
for (const token of ["TableSurfaceZ", "MinimumPointerSpacing", "HeightScale", "FShiEngagementModel::MetricKeys", "CROSSING", "PURSUIT", "exactly six live metric signals", "overlaps another pointer target", "OutSignals = MoveTemp(Candidate)", "CameraTransform"]) if (!engagementSignals.includes(token)) errors.push(`Unreal engagement signal model omits bounded 3D metric token: ${token}`);
if (!buildRules.includes('"AudioMixer"')) errors.push("Unreal runtime module does not depend on AudioMixer");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Engine/BasicShapes")')) errors.push("Unreal packaging does not cook the engine-native wartable assets loaded by path");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Props/CommandWeight")')) errors.push("Unreal packaging does not force-cook the admitted command-weight assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Environment/CommandSurface")')) errors.push("Unreal packaging does not force-cook the admitted command-surface assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Environment/WetField")')) errors.push("Unreal packaging does not force-cook the admitted wet-field assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Environment/DazeShelter")')) errors.push("Unreal packaging does not force-cook the admitted Daze-shelter assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/VFX/DazeRain")')) errors.push("Unreal packaging does not force-cook the admitted Daze-rain assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Environment/WetFieldVegetation")')) errors.push("Unreal packaging does not force-cook the admitted wet-field-vegetation assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Characters/DazeCouncil")')) errors.push("Unreal packaging does not force-cook the admitted Daze council-character assets");
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Characters/DazeCouncilFacial")')) errors.push("Unreal packaging does not force-cook the admitted Daze council facial-performance assets");
if (!engineConfig.includes("r.CustomDepth=3")) errors.push("Unreal renderer does not preserve the selected wartable marker stencil");
for (const token of ["prepare_external_directory", "SHI_UNREAL_DERIVED_DATA", "UE-LocalDataCachePath", "SHI_UNREAL_PACKAGE_ROOT", "must be a dedicated directory outside the Git repository", "-archivedirectory=\"$SHI_PACKAGE_ROOT\"", "-nosound", "Automation RunTests SHI.; Quit", "Automation Test Queue Empty"]) if (!pipeline.includes(token)) errors.push(`Unreal pipeline omits outside-Git build/cache/test-exit token: ${token}`);
if (pipeline.includes('archivedirectory="$SHI_REPO_ROOT/apps/unreal')) errors.push("Unreal Linux packaging still writes archives inside the Git worktree");
for (const token of ["RestoreChronicle", "SaveChronicle", "ForceUTF8WithoutBOM", "Gamepad_FaceButton_Bottom", "RequestNewChronicle", "CreateSoundscape", "ToggleSound", "Gamepad_FaceButton_Top", "ToggleEvidence", "Gamepad_LeftShoulder", "GetHitResultAtScreenPosition", "Gamepad_RightShoulder", "Gamepad_LeftThumbstick", "Gamepad_RightThumbstick", "RebuildCommandSignals", "FShiOrderTransactionModel::Build", "FShiOrderTransactionModel::BuildTurnSnapshot", "CanPresentCommandSignals", "CanPresentResolutionSequence", "CanPresentCouncilStage", "ApplyCouncilStage", "FocusCouncil", "CouncilFigures", "SaveChronicle(Transaction.Session", "Session = MoveTemp(Transaction.Session)", "SaveChronicle(CandidateSession", "Session = MoveTemp(CandidateSession)", "CURRENT CHRONICLE PRESERVED", "BeginPreparedResolutionSequence", "ORDER HELD", "StartCinematicBeat", "TickCinematicSequence", "SkipCinematicSequence", "Gamepad_FaceButton_Right", "Gamepad_Special_Right", "has no live world actor", "SetCameraImmediate", "SetFieldOfView", "CinematicHoldElapsed = -Beat->TransitionSeconds", "ToggleReducedMotion", "LoadCinematicPreferences", "SaveCinematicPreferences", "GGameUserSettingsIni", "ReducedMotion", "SetActorLocationAndRotation", "CameraTransitionElapsed = CameraTransitionDuration", "bReturningFromCommandSignal", "BeginCameraTransition", "FQuat::Slerp", "SetRenderCustomDepth", "ShiSite:", "ShiSignal:", "OpenEngagement", "IssueEngagementCommand", "CampaignMatchesEngagementSnapshot", "ApplyEngagementCommandSpace", "EngagementMetricMarkers", "ShiEngagement:", "CAMPAIGN SAVE UNCHANGED", "Session.ExportSaveJson(CampaignSnapshot", "CurrentCampaign != EngagementCampaignSnapshot", "FShiCommandSurfacePresentationModel::Build", "ShiCommandSurfaceReview", "ShiEnvironment:CommandSurface", "ShiPresentation:FictionalInterfaceStage", "FShiCommandWeightPresentationModel::Build", "ShiCommandWeightReviewFront", "ShiCommandWeightReviewBack", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "ShiProp:CommandWeight", "ShiPresentation:NonAuthoritative", "Prop->SetActorHiddenInGame(bVisible)", "FShiWetFieldEnvironmentPresentationModel::Build", "ShiWetFieldEnvironmentReview", "ShiEnvironment:WetField", "M_SHI_WetFieldGround", "M_SHI_ShallowRainwater", "SetCanEverAffectNavigation(false)"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits persistence/input/audio/evidence/world-signal/cinematic-motion/transaction/engagement-authority/surface/command-weight/wet-field token: ${token}`);
for (const token of ["FShiDazeFieldShelterPresentationModel::Build", "ShiDazeFieldShelterReview", "ShiEnvironment:DazeShelter", "ShiPresentation:FictionalPracticalConstruction", "ShiArtStatus:ProductionBlockout", "M_SHI_RainDarkenedWood", "M_SHI_WovenReedMat", "M_SHI_CoarseFiberCord", "DazeFieldShelterProp"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits Daze-shelter runtime/disclosure token: ${token}`);
for (const token of ["FShiRainPresentationModel::Build", "ShiRainVfxReview", "AShiRainField", "ShiEnvironment:DazeRain", "ShiPresentation:NonAuthoritative", "ShiArtStatus:ProductionVfxBlockout", "RainField", "ReviewFieldOfViewDegrees"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits Daze-rain runtime/disclosure token: ${token}`);
for (const token of ["FShiWetFieldVegetationPresentationModel::Build", "ShiWetFieldVegetationReview", "AShiWetFieldVegetation", "ShiEnvironment:WetFieldVegetation", "ShiPresentation:NonAuthoritative", "ShiArtStatus:ProductionVegetationBlockout", "WetFieldVegetation", "ReviewFieldOfViewDegrees"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits wet-field-vegetation runtime/disclosure token: ${token}`);
for (const token of ["ShiCouncilCharacterReviewSpeaker", "ShiCouncilCharacterReviewKeeper", "bCouncilCharacterReview", "BuildParticipantReviewCamera", "Council character review rejected", "DefaultPawnClass = nullptr"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits dedicated council-character review/default-pawn suppression token: ${token}`);
for (const token of ["Figure->Get()->SetReducedMotion(bReducedMotion)", "Figure->SetReducedMotion(bReducedMotion)", "ApplyCouncilStage", "ToggleReducedMotion"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits council facial reduced-motion propagation token: ${token}`);
if (gameMode.includes("/Engine/BasicShapes/Plane.Plane") || gameMode.includes("Command-space ground")) errors.push("Unreal runtime still contains the superseded white engine-plane ground");
for (const token of ["bOverride_AutoExposureBias", "ExposureCompensation", "PostProcessBlendWeight = 1.f"]) if (!gameMode.includes(token)) errors.push(`Unreal command camera omits reviewed exposure token: ${token}`);
if (gameMode.indexOf("SaveChronicle(Transaction.Session") > gameMode.indexOf("Session = MoveTemp(Transaction.Session)")) errors.push("Unreal order commit mutates memory before the candidate save is durable");
if (gameMode.indexOf("SaveChronicle(CandidateSession") > gameMode.indexOf("Session = MoveTemp(CandidateSession)")) errors.push("Unreal restart mutates memory before the replacement save is durable");
for (const token of ["SELECTED ORDER", "ISSUE ORDER", "ACT %d/%d", "SCENE %d/%d", "NEW CHRONICLE", "GAMEPAD A", "SOUND OFF", "RAIN −", "CUES −", "HISTORICAL BASIS", "EXACT LOCATOR", "SPECIALIST REVIEW REQUIRED", "OPEN PUBLIC EDITION", "WARTABLE FOCUS", "INTELLIGENCE ONLY · NOT A DESTINATION", "SHIFT REVERSES", "SPACE / B SKIPS CONSEQUENCE", "COMMAND SIGNAL", "READ-ONLY 3D TALLY", "CONSEQUENCE %d / %d", "CAMERA ONLY · THE GAMEPLAY RESULT IS ALREADY RESOLVED", "SKIP CONSEQUENCE CAMERA", "REDUCED MOTION · CUTS ONLY", "CAMERA MOTION · RESTRAINED", "V / MENU MOTION", "C / L3 SIGNALS", "RETURN TO COUNCIL", "COUNCIL SPEAKER", "D / R3", "CURRENT GROUND", "WhiteBrush", "FIELD COMMAND EXERCISE", "SIX LIVE 3D TALLIES", "PLAYER EFFECT", "FIELD ANSWER", "CAMPAIGN SAVE BYTE-GUARDED", "ISSUE PULSE ORDER", "CAMPAIGN EFFECT PREVIEW", "RETURN TO CAMPAIGN UNCHANGED"]) if (!screen.includes(token)) errors.push(`Unreal command screen omits interaction/evidence/world-signal/cinematic-motion/readability/engagement token: ${token}`);
if (screen.indexOf("TSharedRef<SVerticalBox> Root") > screen.indexOf("COMMAND SIGNAL")) errors.push("Unreal command-signal card is constructed before its Slate root exists");
for (const token of ["SHI.Wartable.SpatialIntelligenceV1", "Daze projection is deterministic", "overlapping pointer targets are rejected", "unsupported hindsight marker status is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits wartable contract token: ${token}`);
for (const token of ["SHI.CommandSpace.LiveSignalsV1", "five resources and four tactical layers are visible", "selected tally remains anchored", "captured terminal state has an exact pursuit-closed signal", "nonterminal state cannot omit its pursuit band", "the carried oath becomes a live world signal", "overlapping live command signals are rejected", "cross-family pointer overlap is rejected", "missing authoritative resources reject the signal snapshot", "failed signal rebuild is atomic"]) if (!automation.includes(token)) errors.push(`Unreal automation omits live command-signal token: ${token}`);
for (const token of ["SHI.Campaign.OrderTransactionV1", "order preflight never mutates the active chronicle", "resolution drift rejects the entire prepared transaction", "world drift rejects the entire prepared transaction", "cinematic drift rejects the entire prepared transaction", "post-order briefing drift rejects the entire prepared transaction", "extra hidden decision rejects the entire prepared transaction", "failed order transaction build is atomic", "active chronicle remains byte-identical after every attack", "preflight history is immutable", "full transaction revalidates"]) if (!automation.includes(token)) errors.push(`Unreal automation omits fail-closed order-transaction token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilStagingV1", "speaker and keeper occupy the scene", "historical dialogue is explicitly not a transcript", "Aunt Yu is never presented as a historical person", "cast identity drift is rejected", "dialogue drift is rejected", "unauthored dialogue camera drift is rejected", "failed council rebuild is atomic", "council staging drift rejects the entire prepared transaction", "prepared council follows position"]) if (!automation.includes(token)) errors.push(`Unreal automation omits canonical council-staging token: ${token}`);
for (const token of ["dedicated speaker review camera is admitted", "speaker review exactly preserves the authored dialogue camera", "dedicated keeper review camera is admitted", "keeper review cannot silently reuse the speaker position", "unknown council review slot is rejected", "failed council review camera build is atomic"]) if (!automation.includes(token)) errors.push(`Unreal automation omits fail-closed council review-camera token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilCharacterPresentationV1", "five exact council character identities are admitted", "council character order remains canonical", "uses the exact x100 component scale", "remains a disclosed non-final neutral blockout", "engine asset passes bones, materials, bounds and topology", "all five figures use one exact engine Skeleton", "unknown generated identity is rejected", "failed identity build is atomic", "metre-valued asset cannot silently shrink to centimetres", "generic layers cannot be promoted to exact 209 BCE costume", "skeletal blockout cannot replace primitive interaction authority", "wrong or generated character asset is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits council-character live-asset/hostile-drift token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilPerformancePresentationV1", "two exact council body-performance roles remain canonical", "keeps 121 target samples", "retains exactly 52 child-body tracks", "cannot override the admitted reference Root", "child positions/scales remain the exact shared reference pose", "both body performances use one exact engine Skeleton", "non-speaker maps to attentive performance", "speaker maps to measured performance", "unknown generated performance role is rejected", "sample-count drift is rejected", "frame-rate drift is rejected", "root-motion authority is rejected", "generic gesture cannot become reconstructed 209 BCE etiquette", "body blockout cannot become final acting without review", "visual performance cannot acquire gameplay authority"]) if (!automation.includes(token)) errors.push(`Unreal automation omits council-performance live-asset/hostile-drift token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilFacialPerformanceV1", "five exact facial identities remain canonical and ordered", "the facial rig exposes exactly the admitted 21 morphs in canonical order", "uses the exact accepted shared Skeleton", "live mesh passes exact bones, materials, bounds, topology and morph admission", "all five live facial meshes use one exact Skeleton object", "unknown facial identity is rejected", "facial material order drift is rejected", "extra facial morph control is rejected", "silent intent cadence cannot become audio driven", "deterministic facial presentation cannot acquire randomness", "engineering face cannot acquire close-framing approval", "facial evaluator is exactly deterministic for repeated input", "all listener and speaker timeline samples preserve exact morph order and bounds", "reduced-motion cadence is a single clamped pass and cannot loop after four seconds", "facial frame morph reordering is rejected", "facial frame extra morph control is rejected", "facial frame gameplay authority is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits council-facial live-asset/determinism/reduced-motion/hostile-drift token: ${token}`);
for (const token of ["shi-daze-council-skin-lookdev-v1", "-ShiCouncilSkinLookdevReview", "/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1", "M_SHI_Character_SkinClay", "SubsurfaceProfile", "BaseColor2K", "MaterialMasks2K", "DetailNormal1K", "bCanonicalHeightSourceKeptOutsideEngine", "bBaselineFallbackRequired", "bStandardMotionSupported", "bReducedMotionSupported", "bHistoricallyAttestedComplexion", "bHumanHistoricalCulturalReviewApproved", "bCloseCameraApproved", "bFinalCharacterArt", "bFinalSkin"]) if (!councilSkinLookdev.includes(token)) errors.push(`Unreal council-skin model omits exact isolated/fail-closed token: ${token}`);
for (const token of ["SHI.Cinematic.CouncilSkinLookdevV1", "skin lookdev has exactly five isolated engine assets", "lookdev engine inventory excludes the canonical height source", "skin material is an opaque skeletal morph-compatible Subsurface Profile material", "skin fallback binds exact accepted Chen mesh, SkinClay, rig, source and UV receipts", "legacy-root overwrite is rejected", "imported canonical height source is rejected", "Unreal Default Material substitution is rejected", "native contract cannot manufacture human approval", "missing lookdev inventory fails closed to accepted SkinClay", "unknown skin review token is rejected", "skin frame cannot acquire motion behavior", "skin frame gameplay authority is rejected", "skin frame historical complexion claim is rejected", "skin frame close-camera approval is rejected", "skin frame final-skin claim is rejected"]) if (!councilSkinLookdevAutomation.includes(token)) errors.push(`Unreal council-skin automation omits hostile-drift/fallback token: ${token}`);
for (const token of ["SHI_COUNCIL_SKIN_LOOKDEV_RUNTIME_ADMITTED", "SHI_COUNCIL_SKIN_LOOKDEV_MORPH_SECTIONS_EXERCISED", "RestoreSkinLookdevBaseline", "UseSkinLookdevPrimitiveFallback", "SetMaterial(SkinMaterialIndex, SkinLookdevMaterial)"]) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits skin-lookdev runtime/fallback token: ${token}`);
for (const token of ["ShiCouncilSkinLookdevReview", "-ShiCouncilSkinLookdevReview is Chen-only", "SHI_COUNCIL_SKIN_LOOKDEV_REVIEW_INERT", "SetSkinLookdevReviewEnabled", "CanonicalTargetCharacterId"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits Chen-only inert skin-review token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_SKIN_LOOKDEV_REIMPORT", "inspect-only", "canonicalHeightRemainedSourceOnly", "trackedUassetHashesUnchanged", "immutableImportReceiptRootSha256"]) if (!councilSkinLookdevImporter.includes(token)) errors.push(`Unreal council-skin importer omits mutation/read-only receipt token: ${token}`);
if (!gameConfig.includes('+DirectoriesToAlwaysCook=(Path="/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1")')) errors.push("Unreal packaging config omits the isolated skin-lookdev always-cook path");
for (const token of ["SHI.Cinematic.CommandWeightPresentationV1", "preserves contact, pointer clearance and the 44-degree safe frame", "not a gameplay interaction target", "lower decision-object field without covering the speaker", "development front review camera looks exactly at the admitted prop", "development back review camera looks exactly at the admitted prop", "a prop that crowds a live signal is rejected", "a floating command weight is rejected", "an unauthored council lens cannot admit the prop"]) if (!automation.includes(token)) errors.push(`Unreal automation omits command-weight presentation token: ${token}`);
for (const token of ["SHI.Cinematic.CommandSurfacePresentationV1", "reviewed command ground contains every site and live signal", "command ground is not an interaction target", "command ground has no runtime collision", "command ground remains beneath the non-authoritative engagement exercise", "surface review camera sees the whole authored command field", "unreviewed surface scaling is rejected", "runtime surface collision is rejected", "a disappearing engagement ground is rejected", "a signal outside the safe command field is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits command-surface presentation token: ${token}`);
for (const token of ["SHI.Cinematic.WetFieldEnvironmentPresentationV1", "reviewed wet-field environment passes its presentation contract", "wet field is a bounded identity-root environment below the command surface", "wet field is not an interaction target", "wet field collision is disabled", "wet field does not affect navigation", "wet field persists beneath Broken Crossing", "environment review camera sees the whole bounded field", "unreviewed field scaling is rejected", "runtime field collision is rejected", "runtime field navigation authority is rejected", "a disappearing engagement environment is rejected", "terrain that violates command-surface clearance is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits wet-field presentation token: ${token}`);
for (const token of ["SHI.Cinematic.DazeFieldShelterPresentationV1", "reviewed Daze field shelter passes its disclosed blockout contract", "shelter is identity-rooted around rather than on the command surface", "each shelter post clears both command-surface axes", "shelter is not presented as an attested Daze reconstruction", "shelter remains explicitly below final-art status", "shelter is not an interaction target", "shelter collision is disabled", "shelter does not affect navigation", "shelter persists around the Broken Crossing exercise", "shelter review camera holds the roof and council clearance envelope", "unreviewed shelter scaling is rejected", "runtime shelter collision is rejected", "runtime shelter navigation authority is rejected", "a disappearing engagement shelter is rejected", "an unsupported reconstruction claim is rejected", "premature final-art status is rejected", "a post entering command clearance is rejected", "a shelter that compromises the council sightline is rejected", "a shelter outside the reviewed vertical envelope is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits Daze-shelter presentation token: ${token}`);
for (const token of ["SHI.Cinematic.DazeRainPresentationV1", "reviewed Daze rain passes its disclosed presentation contract", "rain uses exactly two bounded instanced pools", "rain is deterministic and bounded to the admitted wet field", "rain is not presented as attested Daze weather", "rain remains explicitly below final-art status", "rain is not an interaction target", "rain collision is disabled", "rain does not affect navigation", "rain does not affect campaign or engagement rules", "rain visual state is never serialized", "visible rain is independent of the opt-in audio control", "rain persists through the Broken Crossing exercise", "the exact shelter footprint intercepts rain at the roof", "exposed field rain reaches the admitted wet ground", "no ground ripple can spawn beneath the shelter", "rain review camera holds exposed field, roof edge and command shelter", "unreviewed rain-field scaling is rejected", "a per-drop or oversized rain pool is rejected", "runtime rain collision is rejected", "runtime rain navigation authority is rejected", "hidden gameplay weather authority is rejected", "serialized cosmetic rain state is rejected", "audio-coupled rain visibility is rejected", "an unsupported exact-weather claim is rejected", "premature final-weather status is rejected", "rain disappearing from the engagement is rejected", "a rain field that leaks through the shelter is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits Daze-rain presentation token: ${token}`);
for (const token of ["SHI.Cinematic.WetFieldVegetationPresentationV1", "reviewed generic wet-field vegetation passes its disclosed presentation contract", "vegetation retains exact deterministic HISM budgets", "material wind is bounded, horizontal and GPU-only", "generic forms are not presented as an exact botanical reconstruction", "vegetation remains explicitly below final-art status", "vegetation is not interactive", "vegetation collision is disabled", "vegetation does not affect navigation", "vegetation does not affect campaign or engagement authority", "vegetation state is never serialized", "vegetation does not replicate", "vegetation persists through the Broken Crossing exercise", "the shelter and command work area remain clear", "the compacted approach corridor remains clear", "deterministic placement fills exactly 42 stalks and 64 low tufts", "vegetation review camera holds both field edges and the protected center", "unreviewed vegetation-field scaling is rejected", "an oversized vegetation budget is rejected", "vegetation entering the shelter envelope is rejected", "CPU per-instance vegetation sway is rejected", "storm-thrashing wind amplitude is rejected", "vegetation collision authority is rejected", "hidden vegetation gameplay authority is rejected", "replicated cosmetic vegetation is rejected", "an unsupported exact botanical claim is rejected", "premature final-vegetation status is rejected", "vegetation disappearing during the engagement is rejected"]) if (!automation.includes(token)) errors.push(`Unreal automation omits wet-field-vegetation presentation token: ${token}`);
for (const token of ["SHI.Cinematic.ResolutionGrammarV1", "opening sequence includes order, established oath, four response layers and position", "complete consequence sequence stays below five seconds", "first consequence shot cuts from unknowable prior inspection", "near pursuit-to-method translation uses one restrained ease", "pressure close reading has the narrowest authored lens", "position resolves through the widest authored lens", "cinematic cut/ease authorship cannot drift from spatial bounds", "cinematic lens grammar rejects disorienting drift", "cinematic planning never appends campaign history", "unbound cinematic world targets are rejected", "overlong cinematic shots are rejected", "cinematic layer reordering is rejected", "captured terminal position has a bounded consequence plan", "cinematic final resources must match resolution and world snapshots", "failed cinematic rebuild is atomic", "prepared world signal count"]) if (!automation.includes(token)) errors.push(`Unreal automation omits cinematic resolution/motion token: ${token}`);
for (const token of ["SHI.Engagement.BrokenCrossingParityV1", "native exhaustive traversal matches Web route count", "native exhaustive traversal matches Web viable count", "every authored outcome is reachable", "every authored command is reachable", "each field condition preserves at least two viable plans", "same command from the same state is deterministic", "copy resolution never mutates the source position", "engagement replay rejects an invented authored response", "failed replay cannot mutate the accepted engagement", "native model rejects premature campaign authority", "native model rejects campaign condition drift", "six bounded 3D tallies follow every native position", "engagement signal height encodes its exact metric", "overlapping engagement pointers are rejected", "missing engagement metric rejects signal rebuild", "failed engagement signal rebuild is atomic"]) if (!engagementAutomation.includes(token)) errors.push(`Unreal engagement automation omits parity/hostile/spatial token: ${token}`);

if (errors.length) {
  console.error(`Unreal project validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7/edition/audio/engagement staging, 46 campaign routes plus a native 76-route Broken Crossing parity boundary, deterministic save/replay, fail-closed durable-first order transactions with canonical council cast/blocking, source-claim ledger, bounded inspectable 3D wartable, live command signals and sub-five-second cut/ease/lens resolution cinema with persistent reduced motion, procedural soundscape, controls, and hash-bound runtime-presented command-weight, command-surface, wet-field, Daze field-shelter, Daze-rain, wet-field-vegetation, five identity-Root shared-skeleton council characters, two body-performance clips, exact 21-control silent facial-intent cadence and an isolated five-asset Chen Sheng skin engineering lookdev with package/visible/human/final-art red gates.`);
