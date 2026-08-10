#pragma once

#include "CoreMinimal.h"

struct FShiRainPresentationData
{
    FString StreakMeshPath;
    FString RippleMeshPath;
    FString StreakMaterialPath;
    FString RippleMaterialPath;
    FString HistoricalDisclosure;
    FTransform Transform;
    FVector2D FieldHalfExtent = FVector2D::ZeroVector;
    FVector2D ShelterHalfExtent = FVector2D::ZeroVector;
    FVector Velocity = FVector::ZeroVector;
    float SpawnCeiling = 0.f;
    float GroundIntercept = 0.f;
    float ShelterRoofIntercept = 0.f;
    float RippleLifetimeSeconds = 0.f;
    float MaximumDeltaSeconds = 0.f;
    int32 StreakInstanceCount = 0;
    int32 RipplePoolInstanceCount = 0;
    uint32 Seed = 0;
    bool bHistoricallyAttestedWeather = false;
    bool bFinalArt = false;
    bool bInteractive = false;
    bool bCollisionEnabled = false;
    bool bAffectsNavigation = false;
    bool bAffectsGameplay = false;
    bool bSerialized = false;
    bool bTiedToRainAudio = false;
    bool bVisibleDuringEngagement = true;
};

class FShiRainPresentationModel
{
public:
    static constexpr float FieldHalfExtent() { return 1200.f; }
    static constexpr float SpawnCeiling() { return 1050.f; }
    static constexpr float GroundIntercept() { return -5.f; }
    static constexpr float ShelterHalfWidth() { return 420.f; }
    static constexpr float ShelterHalfDepth() { return 336.7437f; }
    static constexpr float ShelterRoofIntercept() { return 340.f; }
    static constexpr float RippleLifetimeSeconds() { return .70f; }
    static constexpr float MaximumDeltaSeconds() { return .05f; }
    static constexpr int32 StreakInstanceCount() { return 384; }
    static constexpr int32 RipplePoolInstanceCount() { return 72; }
    static constexpr uint32 Seed() { return 0x5EED209u; }

    static FShiRainPresentationData Build();
    static bool Validate(const FShiRainPresentationData& Presentation, FString& OutError);
    static bool IsInsideShelterFootprint(const FVector2D& Position);
    static float ImpactHeightAt(const FVector2D& Position);
    static bool CanSpawnGroundRipple(const FVector2D& Position);
    static FTransform ReviewCameraTransform();
    static constexpr float ReviewFieldOfViewDegrees() { return 50.f; }
};
