#include "ShiWetFieldVegetationPresentationModel.h"

#include "ShiDazeFieldShelterPresentationModel.h"
#include "ShiWetFieldEnvironmentPresentationModel.h"

namespace
{
    const TCHAR* StalkMeshPath = TEXT("/Game/SHI/Art/Environment/WetFieldVegetation/SM_SHI_FieldStalkClump_01.SM_SHI_FieldStalkClump_01");
    const TCHAR* TuftMeshPath = TEXT("/Game/SHI/Art/Environment/WetFieldVegetation/SM_SHI_LowBladeTuft_01.SM_SHI_LowBladeTuft_01");
    const TCHAR* MaterialPath = TEXT("/Game/SHI/Art/Environment/WetFieldVegetation/M_SHI_RainDarkenedFieldPlant.M_SHI_RainDarkenedFieldPlant");
    const TCHAR* HistoricalDisclosure = TEXT("GENERIC RAIN-FLATTENED FIELD-EDGE FORMS · NOT AN EXACT BOTANICAL RECONSTRUCTION · PRODUCTION VEGETATION BLOCKOUT");
    const FVector ReviewedWindDirection(1.f, .35f, 0.f);
}

FShiWetFieldVegetationPresentationData FShiWetFieldVegetationPresentationModel::Build()
{
    FShiWetFieldVegetationPresentationData Presentation;
    Presentation.StalkMeshPath = StalkMeshPath;
    Presentation.TuftMeshPath = TuftMeshPath;
    Presentation.MaterialPath = MaterialPath;
    Presentation.HistoricalDisclosure = HistoricalDisclosure;
    Presentation.Transform = FTransform::Identity;
    Presentation.RootHalfExtent = FVector2D(RootHalfExtent());
    Presentation.CentralExclusionHalfExtent = FVector2D(
        CentralExclusionHalfWidth(), CentralExclusionHalfDepth());
    Presentation.WindDirection = ReviewedWindDirection;
    Presentation.RootZ = RootZ();
    Presentation.RouteSlope = RouteSlope();
    Presentation.RouteHalfWidth = RouteHalfWidth();
    Presentation.StalkMinimumScale = StalkMinimumScale();
    Presentation.StalkMaximumScale = StalkMaximumScale();
    Presentation.TuftMinimumScale = TuftMinimumScale();
    Presentation.TuftMaximumScale = TuftMaximumScale();
    Presentation.WindSpeed = WindSpeed();
    Presentation.WindAmplitude = WindAmplitude();
    Presentation.StalkInstanceCount = StalkInstanceCount();
    Presentation.TuftInstanceCount = TuftInstanceCount();
    Presentation.Seed = Seed();
    Presentation.bExactBotanicalReconstruction = false;
    Presentation.bFinalArt = false;
    Presentation.bInteractive = false;
    Presentation.bCollisionEnabled = false;
    Presentation.bAffectsNavigation = false;
    Presentation.bAffectsGameplay = false;
    Presentation.bSerialized = false;
    Presentation.bReplicated = false;
    Presentation.bCpuAnimated = false;
    Presentation.bMaterialWindOnly = true;
    Presentation.bVisibleDuringEngagement = true;
    return Presentation;
}

bool FShiWetFieldVegetationPresentationModel::Validate(
    const FShiWetFieldVegetationPresentationData& Presentation, FString& OutError)
{
    if (Presentation.StalkMeshPath != StalkMeshPath
        || Presentation.TuftMeshPath != TuftMeshPath
        || Presentation.MaterialPath != MaterialPath
        || Presentation.HistoricalDisclosure != HistoricalDisclosure
        || !Presentation.Transform.Equals(FTransform::Identity, .0001f))
    {
        OutError = TEXT("Wet-field vegetation must preserve its reviewed assets, disclosure and identity-root placement.");
        return false;
    }
    if (!Presentation.RootHalfExtent.Equals(FVector2D(RootHalfExtent()), .001f)
        || !Presentation.CentralExclusionHalfExtent.Equals(
            FVector2D(CentralExclusionHalfWidth(), CentralExclusionHalfDepth()), .001f)
        || !FMath::IsNearlyEqual(Presentation.RootZ, RootZ(), .001f)
        || !FMath::IsNearlyEqual(Presentation.RouteSlope, RouteSlope(), .001f)
        || !FMath::IsNearlyEqual(Presentation.RouteHalfWidth, RouteHalfWidth(), .001f)
        || Presentation.RootHalfExtent.X >= FShiWetFieldEnvironmentPresentationModel::HalfExtent()
        || Presentation.RootHalfExtent.Y >= FShiWetFieldEnvironmentPresentationModel::HalfExtent()
        || Presentation.CentralExclusionHalfExtent.X <= FShiDazeFieldShelterPresentationModel::HalfWidth()
        || Presentation.CentralExclusionHalfExtent.Y <= FShiDazeFieldShelterPresentationModel::HalfDepth())
    {
        OutError = TEXT("Vegetation field bounds, shelter clearance or approach-corridor geometry drifted from review.");
        return false;
    }
    if (!FMath::IsNearlyEqual(Presentation.StalkMinimumScale, StalkMinimumScale(), .001f)
        || !FMath::IsNearlyEqual(Presentation.StalkMaximumScale, StalkMaximumScale(), .001f)
        || !FMath::IsNearlyEqual(Presentation.TuftMinimumScale, TuftMinimumScale(), .001f)
        || !FMath::IsNearlyEqual(Presentation.TuftMaximumScale, TuftMaximumScale(), .001f)
        || Presentation.StalkInstanceCount != StalkInstanceCount()
        || Presentation.TuftInstanceCount != TuftInstanceCount()
        || Presentation.Seed != Seed())
    {
        OutError = TEXT("Vegetation scale envelopes, deterministic seed or fixed instance budget drifted from review.");
        return false;
    }
    if (!Presentation.WindDirection.Equals(ReviewedWindDirection, .001f)
        || !FMath::IsNearlyEqual(Presentation.WindSpeed, WindSpeed(), .001f)
        || !FMath::IsNearlyEqual(Presentation.WindAmplitude, WindAmplitude(), .001f)
        || Presentation.WindDirection.Z != 0.f
        || !Presentation.bMaterialWindOnly || Presentation.bCpuAnimated)
    {
        OutError = TEXT("Vegetation must retain its bounded horizontal material-wind contract without CPU animation.");
        return false;
    }
    if (Presentation.bExactBotanicalReconstruction || Presentation.bFinalArt
        || Presentation.bInteractive || Presentation.bCollisionEnabled
        || Presentation.bAffectsNavigation || Presentation.bAffectsGameplay
        || Presentation.bSerialized || Presentation.bReplicated
        || !Presentation.bVisibleDuringEngagement)
    {
        OutError = TEXT("Vegetation is a disclosed non-authoritative presentation layer with no interaction, save or replication role.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiWetFieldVegetationPresentationModel::IsRootAdmitted(const FVector2D& Root)
{
    if (FMath::Abs(Root.X) > RootHalfExtent() || FMath::Abs(Root.Y) > RootHalfExtent())
        return false;
    if (FMath::Abs(Root.X) <= CentralExclusionHalfWidth()
        && FMath::Abs(Root.Y) <= CentralExclusionHalfDepth())
        return false;
    if (FMath::Abs(Root.X) < RouteHalfLength()
        && FMath::Abs(Root.Y - RouteSlope() * Root.X) < RouteHalfWidth())
        return false;
    return true;
}

TArray<FTransform> FShiWetFieldVegetationPresentationModel::BuildTransforms(
    const FShiWetFieldVegetationPresentationData& Presentation,
    int32 Count,
    float MinimumScale,
    float MaximumScale,
    uint32 TransformSeed)
{
    TArray<FTransform> Transforms;
    Transforms.Reserve(Count);
    FRandomStream RandomStream(static_cast<int32>(TransformSeed));
    constexpr int32 MaximumAttempts = 20000;
    for (int32 Attempt = 0; Attempt < MaximumAttempts && Transforms.Num() < Count; ++Attempt)
    {
        const FVector2D Root(
            RandomStream.FRandRange(-Presentation.RootHalfExtent.X, Presentation.RootHalfExtent.X),
            RandomStream.FRandRange(-Presentation.RootHalfExtent.Y, Presentation.RootHalfExtent.Y));
        if (!IsRootAdmitted(Root)) continue;
        const float Scale = RandomStream.FRandRange(MinimumScale, MaximumScale);
        const float Yaw = RandomStream.FRandRange(0.f, 360.f);
        Transforms.Emplace(FRotator(0.f, Yaw, 0.f),
            FVector(Root.X, Root.Y, Presentation.RootZ), FVector(Scale));
    }
    return Transforms;
}

TArray<FTransform> FShiWetFieldVegetationPresentationModel::BuildStalkTransforms(
    const FShiWetFieldVegetationPresentationData& Presentation)
{
    return BuildTransforms(Presentation, Presentation.StalkInstanceCount,
        Presentation.StalkMinimumScale, Presentation.StalkMaximumScale, Presentation.Seed);
}

TArray<FTransform> FShiWetFieldVegetationPresentationModel::BuildTuftTransforms(
    const FShiWetFieldVegetationPresentationData& Presentation)
{
    return BuildTransforms(Presentation, Presentation.TuftInstanceCount,
        Presentation.TuftMinimumScale, Presentation.TuftMaximumScale, Presentation.Seed + 1u);
}

FTransform FShiWetFieldVegetationPresentationModel::ReviewCameraTransform()
{
    const FVector Target(0.f, 0.f, 55.f);
    const FVector Location(1500.f, -1700.f, 710.f);
    return FTransform((Target - Location).Rotation(), Location);
}
