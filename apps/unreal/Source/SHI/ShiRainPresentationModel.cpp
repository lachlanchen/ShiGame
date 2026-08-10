#include "ShiRainPresentationModel.h"

#include "ShiDazeFieldShelterPresentationModel.h"
#include "ShiWetFieldEnvironmentPresentationModel.h"

namespace
{
    const TCHAR* RainStreakMeshPath = TEXT("/Game/SHI/Art/VFX/DazeRain/SM_SHI_RainStreak_01.SM_SHI_RainStreak_01");
    const TCHAR* RainRippleMeshPath = TEXT("/Game/SHI/Art/VFX/DazeRain/SM_SHI_RainRipple_01.SM_SHI_RainRipple_01");
    const TCHAR* RainStreakMaterialPath = TEXT("/Game/SHI/Art/VFX/DazeRain/M_SHI_RainStreak.M_SHI_RainStreak");
    const TCHAR* RainRippleMaterialPath = TEXT("/Game/SHI/Art/VFX/DazeRain/M_SHI_RainRipple.M_SHI_RainRipple");
    const TCHAR* RainDisclosure = TEXT("DRAMATIC RAIN RECONSTRUCTION · NOT EVIDENCE OF EXACT DAZE WEATHER IN 209 BCE · PRODUCTION VFX BLOCKOUT");
    const FVector ReviewedVelocity(130.f, 45.f, -1900.f);
}

FShiRainPresentationData FShiRainPresentationModel::Build()
{
    FShiRainPresentationData Presentation;
    Presentation.StreakMeshPath = RainStreakMeshPath;
    Presentation.RippleMeshPath = RainRippleMeshPath;
    Presentation.StreakMaterialPath = RainStreakMaterialPath;
    Presentation.RippleMaterialPath = RainRippleMaterialPath;
    Presentation.HistoricalDisclosure = RainDisclosure;
    Presentation.Transform = FTransform::Identity;
    Presentation.FieldHalfExtent = FVector2D(FieldHalfExtent(), FieldHalfExtent());
    Presentation.ShelterHalfExtent = FVector2D(ShelterHalfWidth(), ShelterHalfDepth());
    Presentation.Velocity = ReviewedVelocity;
    Presentation.SpawnCeiling = SpawnCeiling();
    Presentation.GroundIntercept = GroundIntercept();
    Presentation.ShelterRoofIntercept = ShelterRoofIntercept();
    Presentation.RippleLifetimeSeconds = RippleLifetimeSeconds();
    Presentation.MaximumDeltaSeconds = MaximumDeltaSeconds();
    Presentation.StreakInstanceCount = StreakInstanceCount();
    Presentation.RipplePoolInstanceCount = RipplePoolInstanceCount();
    Presentation.Seed = Seed();
    Presentation.bHistoricallyAttestedWeather = false;
    Presentation.bFinalArt = false;
    Presentation.bInteractive = false;
    Presentation.bCollisionEnabled = false;
    Presentation.bAffectsNavigation = false;
    Presentation.bAffectsGameplay = false;
    Presentation.bSerialized = false;
    Presentation.bTiedToRainAudio = false;
    Presentation.bVisibleDuringEngagement = true;
    return Presentation;
}

bool FShiRainPresentationModel::Validate(
    const FShiRainPresentationData& Presentation, FString& OutError)
{
    if (Presentation.StreakMeshPath != RainStreakMeshPath
        || Presentation.RippleMeshPath != RainRippleMeshPath
        || Presentation.StreakMaterialPath != RainStreakMaterialPath
        || Presentation.RippleMaterialPath != RainRippleMaterialPath
        || Presentation.HistoricalDisclosure != RainDisclosure
        || !Presentation.Transform.Equals(FTransform::Identity, .0001f))
    {
        OutError = TEXT("Rain must preserve its reviewed assets, disclosure and identity-root placement.");
        return false;
    }
    if (!Presentation.FieldHalfExtent.Equals(FVector2D(FieldHalfExtent()), .001f)
        || !Presentation.ShelterHalfExtent.Equals(FVector2D(ShelterHalfWidth(), ShelterHalfDepth()), .001f)
        || !Presentation.Velocity.Equals(ReviewedVelocity, .001f)
        || !FMath::IsNearlyEqual(Presentation.SpawnCeiling, SpawnCeiling(), .001f)
        || !FMath::IsNearlyEqual(Presentation.GroundIntercept, GroundIntercept(), .001f)
        || !FMath::IsNearlyEqual(Presentation.ShelterRoofIntercept, ShelterRoofIntercept(), .001f)
        || Presentation.ShelterRoofIntercept <= FShiDazeFieldShelterPresentationModel::MaximumZ()
        || Presentation.SpawnCeiling <= Presentation.ShelterRoofIntercept)
    {
        OutError = TEXT("Rain field, wind or shelter-interception geometry drifted from the reviewed composition.");
        return false;
    }
    if (Presentation.StreakInstanceCount != StreakInstanceCount()
        || Presentation.RipplePoolInstanceCount != RipplePoolInstanceCount()
        || !FMath::IsNearlyEqual(Presentation.RippleLifetimeSeconds, RippleLifetimeSeconds(), .001f)
        || !FMath::IsNearlyEqual(Presentation.MaximumDeltaSeconds, MaximumDeltaSeconds(), .001f)
        || Presentation.Seed != Seed())
    {
        OutError = TEXT("Rain determinism, pool size or time bounds drifted from the reviewed runtime budget.");
        return false;
    }
    if (Presentation.bHistoricallyAttestedWeather || Presentation.bFinalArt
        || Presentation.bInteractive || Presentation.bCollisionEnabled
        || Presentation.bAffectsNavigation || Presentation.bAffectsGameplay
        || Presentation.bSerialized || Presentation.bTiedToRainAudio
        || !Presentation.bVisibleDuringEngagement)
    {
        OutError = TEXT("Rain is a disclosed, non-authoritative visual layer independent of audio and save state.");
        return false;
    }
    if (!FMath::IsNearlyEqual(Presentation.FieldHalfExtent.X,
            FShiWetFieldEnvironmentPresentationModel::HalfExtent(), .001f)
        || !FMath::IsNearlyEqual(Presentation.FieldHalfExtent.Y,
            FShiWetFieldEnvironmentPresentationModel::HalfExtent(), .001f))
    {
        OutError = TEXT("Rain must remain bounded to the admitted wet-field footprint.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiRainPresentationModel::IsInsideShelterFootprint(const FVector2D& Position)
{
    return FMath::Abs(Position.X) <= ShelterHalfWidth()
        && FMath::Abs(Position.Y) <= ShelterHalfDepth();
}

float FShiRainPresentationModel::ImpactHeightAt(const FVector2D& Position)
{
    return IsInsideShelterFootprint(Position) ? ShelterRoofIntercept() : GroundIntercept();
}

bool FShiRainPresentationModel::CanSpawnGroundRipple(const FVector2D& Position)
{
    return !IsInsideShelterFootprint(Position);
}

FTransform FShiRainPresentationModel::ReviewCameraTransform()
{
    const FVector Target(0.f, 0.f, 175.f);
    const FVector Location(1180.f, -1080.f, 540.f);
    return FTransform((Target - Location).Rotation(), Location);
}
