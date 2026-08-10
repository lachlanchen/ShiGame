#pragma once

#include "CoreMinimal.h"

struct FShiWetFieldVegetationPresentationData
{
    FString StalkMeshPath;
    FString TuftMeshPath;
    FString MaterialPath;
    FString HistoricalDisclosure;
    FTransform Transform;
    FVector2D RootHalfExtent = FVector2D::ZeroVector;
    FVector2D CentralExclusionHalfExtent = FVector2D::ZeroVector;
    FVector WindDirection = FVector::ZeroVector;
    float RootZ = 0.f;
    float RouteSlope = 0.f;
    float RouteHalfWidth = 0.f;
    float StalkMinimumScale = 0.f;
    float StalkMaximumScale = 0.f;
    float TuftMinimumScale = 0.f;
    float TuftMaximumScale = 0.f;
    float WindSpeed = 0.f;
    float WindAmplitude = 0.f;
    int32 StalkInstanceCount = 0;
    int32 TuftInstanceCount = 0;
    uint32 Seed = 0;
    bool bExactBotanicalReconstruction = false;
    bool bFinalArt = false;
    bool bInteractive = false;
    bool bCollisionEnabled = false;
    bool bAffectsNavigation = false;
    bool bAffectsGameplay = false;
    bool bSerialized = false;
    bool bReplicated = false;
    bool bCpuAnimated = false;
    bool bMaterialWindOnly = true;
    bool bVisibleDuringEngagement = true;
};

class FShiWetFieldVegetationPresentationModel
{
public:
    static constexpr float RootHalfExtent() { return 1125.f; }
    static constexpr float CentralExclusionHalfWidth() { return 520.f; }
    static constexpr float CentralExclusionHalfDepth() { return 440.f; }
    static constexpr float RootZ() { return -7.6f; }
    static constexpr float RouteSlope() { return .28f; }
    static constexpr float RouteHalfWidth() { return 115.f; }
    static constexpr float RouteHalfLength() { return 1000.f; }
    static constexpr float StalkMinimumScale() { return .72f; }
    static constexpr float StalkMaximumScale() { return 1.06f; }
    static constexpr float TuftMinimumScale() { return .70f; }
    static constexpr float TuftMaximumScale() { return 1.12f; }
    static constexpr float WindSpeed() { return .38f; }
    static constexpr float WindAmplitude() { return 2.4f; }
    static constexpr int32 StalkInstanceCount() { return 42; }
    static constexpr int32 TuftInstanceCount() { return 64; }
    static constexpr uint32 Seed() { return 0x5EED20Au; }

    static FShiWetFieldVegetationPresentationData Build();
    static bool Validate(const FShiWetFieldVegetationPresentationData& Presentation, FString& OutError);
    static bool IsRootAdmitted(const FVector2D& Root);
    static TArray<FTransform> BuildStalkTransforms(const FShiWetFieldVegetationPresentationData& Presentation);
    static TArray<FTransform> BuildTuftTransforms(const FShiWetFieldVegetationPresentationData& Presentation);
    static FTransform ReviewCameraTransform();
    static constexpr float ReviewFieldOfViewDegrees() { return 52.f; }

private:
    static TArray<FTransform> BuildTransforms(
        const FShiWetFieldVegetationPresentationData& Presentation,
        int32 Count,
        float MinimumScale,
        float MaximumScale,
        uint32 TransformSeed);
};
