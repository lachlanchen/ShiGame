#pragma once

#include "CoreMinimal.h"

struct FShiDazeFieldShelterPresentationData
{
    FString MeshPath;
    FString HistoricalDisclosure;
    FTransform Transform;
    FVector BoundsMinimum = FVector::ZeroVector;
    FVector BoundsMaximum = FVector::ZeroVector;
    TArray<FVector2D> PostCenters;
    float ConservativePostRadius = 0.f;
    float MinimumEaveHeight = 0.f;
    bool bHistoricallyAttested = false;
    bool bFinalArt = false;
    bool bInteractive = false;
    bool bCollisionEnabled = false;
    bool bAffectsNavigation = false;
    bool bVisibleDuringEngagement = true;
};

class FShiDazeFieldShelterPresentationModel
{
public:
    static constexpr float HalfWidth() { return 420.f; }
    static constexpr float HalfDepth() { return 336.7437f; }
    static constexpr float MinimumZ() { return -18.f; }
    static constexpr float MaximumZ() { return 337.f; }
    static constexpr float MaximumAllowedHeight() { return 345.f; }
    static constexpr float MinimumEaveHeight() { return 278.f; }
    static constexpr float ConservativePostRadius() { return 13.f; }
    static constexpr float MinimumPostClearance() { return 50.f; }

    static FShiDazeFieldShelterPresentationData Build();
    static bool Validate(const FShiDazeFieldShelterPresentationData& Presentation, FString& OutError);
    static FTransform ReviewCameraTransform();
    static constexpr float ReviewFieldOfViewDegrees() { return 52.f; }
};
