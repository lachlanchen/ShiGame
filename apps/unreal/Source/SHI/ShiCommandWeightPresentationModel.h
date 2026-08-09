#pragma once

#include "CoreMinimal.h"
#include "ShiCommandSignalModel.h"
#include "ShiCouncilStagingModel.h"

struct FShiCommandWeightPresentationData
{
    FString MeshPath;
    FTransform Transform;
    FVector BoundsMinimum = FVector::ZeroVector;
    FVector BoundsMaximum = FVector::ZeroVector;
    bool bInteractive = false;
    bool bVisibleDuringEngagement = false;
};

class FShiCommandWeightPresentationModel
{
public:
    static FShiCommandWeightPresentationData Build();
    static bool Validate(const FShiCommandWeightPresentationData& Presentation,
        const TArray<FShiSiteData>& Sites, const TArray<FShiCommandSignalData>& Signals,
        const FShiCouncilStageData& CouncilStage, FString& OutError);
    static bool ProjectToCouncilFrame(const FShiCouncilStageData& CouncilStage, const FVector& WorldPoint,
        FVector2D& OutNormalizedDevicePoint, float& OutDepth);
    static FTransform ReviewCameraTransform(const FShiCommandWeightPresentationData& Presentation, bool bBackView);
    static constexpr float ReviewFieldOfViewDegrees() { return 28.f; }
};
