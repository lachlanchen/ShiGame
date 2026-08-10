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
  "Source/SHI/ShiCouncilFigure.h", "Source/SHI/ShiCouncilFigure.cpp",
  "Source/SHI/ShiCinematicBeatModel.h", "Source/SHI/ShiCinematicBeatModel.cpp",
  "Source/SHI/ShiOrderTransactionModel.h", "Source/SHI/ShiOrderTransactionModel.cpp",
  "Source/SHI/ShiEngagementModel.h", "Source/SHI/ShiEngagementModel.cpp",
  "Source/SHI/ShiEngagementSession.h", "Source/SHI/ShiEngagementSession.cpp",
  "Source/SHI/ShiEngagementSignalModel.h", "Source/SHI/ShiEngagementSignalModel.cpp",
  "Source/SHI/ShiCommandScreen.h", "Source/SHI/ShiCommandScreen.cpp",
  "Source/SHI/Private/Tests/ShiCampaignAutomationTest.cpp", "Source/SHI/Private/Tests/ShiEngagementAutomationTest.cpp",
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
    || !characterImportChecks?.exactReferencePoseBones || !characterImportChecks?.rootAndPelvisRelationship
    || !characterImportChecks?.boundedMaterials || !characterImportChecks?.noPhysicsAssets
    || !characterImportChecks?.noMorphTargets || !characterImportChecks?.noTextures
    || !characterImportChecks?.noAnimations || !characterImportChecks?.cleanFbxRoundTrip
    || !characterImportChecks?.cleanGlbRoundTrip
    || councilCharacterImportEvidence.materials?.count !== 14
    || councilCharacterImportEvidence.materials?.nodesPerMaterial !== 3
    || councilCharacterImportEvidence.materials?.textures !== 0)
  errors.push("Unreal council-character source, import, skeleton, material or rights-bounded receipt is incomplete");
if (councilCharacterImportEvidence.package?.packageCount !== 536
    || councilCharacterImportEvidence.package?.priorAcceptedPackageCount !== 516
    || councilCharacterImportEvidence.package?.addedPackageCount !== 20
    || councilCharacterImportEvidence.package?.result !== "BUILD SUCCESSFUL"
    || councilCharacterImportEvidence.package?.artifacts?.length !== 4
    || councilCharacterImportEvidence.smokeTest?.exitCode !== 0
    || councilCharacterImportEvidence.smokeTest?.containerPackageCount !== 536
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
for (const token of ["SHI_DAZE_COUNCIL_CHARACTERS_REIMPORT", "inspect-only", "SK_SHI_DazeCouncil_Skeleton", "asset_name", "Keeper", "ChenSheng", "WuGuang", "YuMu", "QinCourier", "PRESENTATION_SCALE = 100.0", "FBXNIM_IMPORT_NORMALS", "exactReferencePoseBones", "presentedPhysicalHeight", "noPhysicsAsset", "noMorphTargets"]) if (!councilCharacterImporter.includes(token)) errors.push(`Unreal council-character importer omits exact shared-skeleton admission token: ${token}`);
for (const token of ["SHI_DAZE_COUNCIL_AUTHOR_MATERIALS", "EXPECTED_NODE_COUNT = 3", "used_with_skeletal_mesh", "MP_BASE_COLOR", "MP_ROUGHNESS", "MP_SPECULAR", "MP_NORMAL", "MP_EMISSIVE_COLOR", "MP_OPACITY", "MP_WORLD_POSITION_OFFSET", "compileClean", "noTextureNormalEmissiveOpacityOrDisplacementPretence", "inspect-only"]) if (!councilCharacterMaterialAuthor.includes(token)) errors.push(`Unreal council-character material author omits exact texture-free skeletal graph token: ${token}`);
for (const token of ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier", "SK_SHI_DazeCouncil_Skeleton", "SKELETAL COUNCIL CHARACTER PRODUCTION BLOCKOUT", "PresentationScale", "BoneCount", "MaximumTriangles", "bPrimitiveInteractionFallback", "bWideAndMediumFramingOnly", "ValidateMesh", "GetPhysicsAsset", "GetMorphTargets", "GetTotalFaces"]) if (!councilCharacterPresentation.includes(token)) errors.push(`Unreal council-character presentation omits identity/skeleton/red-gate token: ${token}`);
for (const token of ["speaker", "keeper", "HISTORICAL FIGURE · WORDS ARE AUTHORED DRAMATIZATION, NOT TRANSCRIPT", "FICTIONAL CHARACTER · PROJECT-AUTHORED DRAMATIC RECONSTRUCTION", "SpeakerCamera", "ParticipantCamera", "BuildParticipantReviewCamera", "BuildParticipantLights", "speaker-key", "speaker-fill", "keeper-key", "keeper-fill", "CouncilFieldOfViewDegrees", "FindParticipant", "SameParticipant", "cannot preserve canonical cast, disclosure, blocking and camera authorship", "OutStage = MoveTemp(Candidate)"]) if (!councilStaging.includes(token)) errors.push(`Unreal council staging omits cast/blocking/disclosure/review-camera/light token: ${token}`);
for (const token of ["FigureRoot", "Body", "Head", "Mantle", "CharacterMesh", "InitializeFigure", "FShiCouncilCharacterPresentationModel::CanonicalCharacterIds", "FShiCouncilCharacterPresentationModel::ValidateMesh", "SetSkeletalMeshAsset", "ShiCharacter:", "ShiCouncilSpeaker", "ShiArtStatus:SkeletalProductionBlockout", "ShiArtFallback:EnginePrimitive", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "SetCanEverAffectNavigation(false)", "SetVisibility", "SetHiddenInGame", "SetRenderCustomDepth", "SetCustomDepthStencilValue", "SetActorTransform"]) if (!councilFigure.includes(token)) errors.push(`Unreal council figure omits fail-closed skeletal presentation/primitive interaction token: ${token}`);
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
if (!engineConfig.includes("r.CustomDepth=3")) errors.push("Unreal renderer does not preserve the selected wartable marker stencil");
for (const token of ["prepare_external_directory", "SHI_UNREAL_DERIVED_DATA", "UE-LocalDataCachePath", "SHI_UNREAL_PACKAGE_ROOT", "must be a dedicated directory outside the Git repository", "-archivedirectory=\"$SHI_PACKAGE_ROOT\"", "-nosound", "Automation RunTests SHI.; Quit", "Automation Test Queue Empty"]) if (!pipeline.includes(token)) errors.push(`Unreal pipeline omits outside-Git build/cache/test-exit token: ${token}`);
if (pipeline.includes('archivedirectory="$SHI_REPO_ROOT/apps/unreal')) errors.push("Unreal Linux packaging still writes archives inside the Git worktree");
for (const token of ["RestoreChronicle", "SaveChronicle", "ForceUTF8WithoutBOM", "Gamepad_FaceButton_Bottom", "RequestNewChronicle", "CreateSoundscape", "ToggleSound", "Gamepad_FaceButton_Top", "ToggleEvidence", "Gamepad_LeftShoulder", "GetHitResultAtScreenPosition", "Gamepad_RightShoulder", "Gamepad_LeftThumbstick", "Gamepad_RightThumbstick", "RebuildCommandSignals", "FShiOrderTransactionModel::Build", "FShiOrderTransactionModel::BuildTurnSnapshot", "CanPresentCommandSignals", "CanPresentResolutionSequence", "CanPresentCouncilStage", "ApplyCouncilStage", "FocusCouncil", "CouncilFigures", "SaveChronicle(Transaction.Session", "Session = MoveTemp(Transaction.Session)", "SaveChronicle(CandidateSession", "Session = MoveTemp(CandidateSession)", "CURRENT CHRONICLE PRESERVED", "BeginPreparedResolutionSequence", "ORDER HELD", "StartCinematicBeat", "TickCinematicSequence", "SkipCinematicSequence", "Gamepad_FaceButton_Right", "Gamepad_Special_Right", "has no live world actor", "SetCameraImmediate", "SetFieldOfView", "CinematicHoldElapsed = -Beat->TransitionSeconds", "ToggleReducedMotion", "LoadCinematicPreferences", "SaveCinematicPreferences", "GGameUserSettingsIni", "ReducedMotion", "SetActorLocationAndRotation", "CameraTransitionElapsed = CameraTransitionDuration", "bReturningFromCommandSignal", "BeginCameraTransition", "FQuat::Slerp", "SetRenderCustomDepth", "ShiSite:", "ShiSignal:", "OpenEngagement", "IssueEngagementCommand", "CampaignMatchesEngagementSnapshot", "ApplyEngagementCommandSpace", "EngagementMetricMarkers", "ShiEngagement:", "CAMPAIGN SAVE UNCHANGED", "Session.ExportSaveJson(CampaignSnapshot", "CurrentCampaign != EngagementCampaignSnapshot", "FShiCommandSurfacePresentationModel::Build", "ShiCommandSurfaceReview", "ShiEnvironment:CommandSurface", "ShiPresentation:FictionalInterfaceStage", "FShiCommandWeightPresentationModel::Build", "ShiCommandWeightReviewFront", "ShiCommandWeightReviewBack", "SetCollisionEnabled(ECollisionEnabled::NoCollision)", "ShiProp:CommandWeight", "ShiPresentation:NonAuthoritative", "Prop->SetActorHiddenInGame(bVisible)", "FShiWetFieldEnvironmentPresentationModel::Build", "ShiWetFieldEnvironmentReview", "ShiEnvironment:WetField", "M_SHI_WetFieldGround", "M_SHI_ShallowRainwater", "SetCanEverAffectNavigation(false)"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits persistence/input/audio/evidence/world-signal/cinematic-motion/transaction/engagement-authority/surface/command-weight/wet-field token: ${token}`);
for (const token of ["FShiDazeFieldShelterPresentationModel::Build", "ShiDazeFieldShelterReview", "ShiEnvironment:DazeShelter", "ShiPresentation:FictionalPracticalConstruction", "ShiArtStatus:ProductionBlockout", "M_SHI_RainDarkenedWood", "M_SHI_WovenReedMat", "M_SHI_CoarseFiberCord", "DazeFieldShelterProp"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits Daze-shelter runtime/disclosure token: ${token}`);
for (const token of ["FShiRainPresentationModel::Build", "ShiRainVfxReview", "AShiRainField", "ShiEnvironment:DazeRain", "ShiPresentation:NonAuthoritative", "ShiArtStatus:ProductionVfxBlockout", "RainField", "ReviewFieldOfViewDegrees"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits Daze-rain runtime/disclosure token: ${token}`);
for (const token of ["FShiWetFieldVegetationPresentationModel::Build", "ShiWetFieldVegetationReview", "AShiWetFieldVegetation", "ShiEnvironment:WetFieldVegetation", "ShiPresentation:NonAuthoritative", "ShiArtStatus:ProductionVegetationBlockout", "WetFieldVegetation", "ReviewFieldOfViewDegrees"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits wet-field-vegetation runtime/disclosure token: ${token}`);
for (const token of ["ShiCouncilCharacterReviewSpeaker", "ShiCouncilCharacterReviewKeeper", "bCouncilCharacterReview", "BuildParticipantReviewCamera", "Council character review rejected", "DefaultPawnClass = nullptr"]) if (!gameMode.includes(token)) errors.push(`Unreal playable shell omits dedicated council-character review/default-pawn suppression token: ${token}`);
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
console.log(`Unreal project contract valid: engine ${project.EngineAssociation}, canonical schema-v7/edition/audio/engagement staging, 46 campaign routes plus a native 76-route Broken Crossing parity boundary, deterministic save/replay, fail-closed durable-first order transactions with canonical council cast/blocking, source-claim ledger, bounded inspectable 3D wartable, live command signals and sub-five-second cut/ease/lens resolution cinema with persistent reduced motion, procedural soundscape, controls, and hash-bound runtime-presented command-weight, command-surface, wet-field, Daze field-shelter, Daze-rain, wet-field-vegetation and five shared-skeleton council-character production blockouts with explicit historical/final-art red gates.`);
