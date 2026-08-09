#pragma once

#include "CoreMinimal.h"

struct FShiWetFieldEnvironmentPresentationData
{
    FString MeshPath;
    FTransform Transform;
    FVector BoundsMinimum = FVector::ZeroVector;
    FVector BoundsMaximum = FVector::ZeroVector;
    bool bInteractive = false;
    bool bCollisionEnabled = false;
    bool bAffectsNavigation = false;
    bool bVisibleDuringEngagement = true;
};

class FShiWetFieldEnvironmentPresentationModel
{
public:
    static constexpr float HalfExtent() { return 1200.f; }
    static constexpr float MinimumZ() { return -32.f; }
    static constexpr float MaximumZ() { return -7.6f; }
    static constexpr float MinimumCommandSurfaceClearance() { return 4.f; }

    static FShiWetFieldEnvironmentPresentationData Build();
    static bool Validate(const FShiWetFieldEnvironmentPresentationData& Presentation, FString& OutError);
    static FTransform ReviewCameraTransform();
    static constexpr float ReviewFieldOfViewDegrees() { return 52.f; }
    static constexpr float ExposureCompensation() { return -1.5f; }
};
