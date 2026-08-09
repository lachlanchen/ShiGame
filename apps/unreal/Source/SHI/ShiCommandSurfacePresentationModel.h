#pragma once

#include "CoreMinimal.h"
#include "ShiCommandSignalModel.h"
#include "ShiCampaignModel.h"

struct FShiCommandSurfacePresentationData
{
    FString MeshPath;
    FTransform Transform;
    FVector BoundsMinimum = FVector::ZeroVector;
    FVector BoundsMaximum = FVector::ZeroVector;
    bool bInteractive = false;
    bool bCollisionEnabled = false;
    bool bVisibleDuringEngagement = true;
};

class FShiCommandSurfacePresentationModel
{
public:
    static constexpr float SurfaceTopZ() { return 14.f; }
    static constexpr float HalfWidth() { return 290.f; }
    static constexpr float HalfDepth() { return 185.f; }
    static constexpr float EdgeClearance() { return 5.f; }

    static FShiCommandSurfacePresentationData Build();
    static bool Validate(const FShiCommandSurfacePresentationData& Presentation,
        const TArray<FShiSiteData>& Sites, const TArray<FShiCommandSignalData>& Signals,
        FString& OutError);
    static FTransform ReviewCameraTransform();
    static constexpr float ReviewFieldOfViewDegrees() { return 48.f; }
};
