#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignModel.h"

struct FShiWartableMarkerStyle
{
    FString MeshPath;
    FVector Scale = FVector::OneVector;
    FLinearColor Color = FLinearColor::White;
    int32 StencilValue = 0;
};

class FShiWartableModel
{
public:
    static FVector ProjectSite(const FShiSiteData& Site);
    static FTransform CameraTransform(const FShiSiteData& Site);
    static FShiWartableMarkerStyle MarkerStyle(const FString& Status, bool bSelected);
    static FString CycleSite(const TArray<FShiSiteData>& Sites, const FString& CurrentSiteId, int32 Direction);
    static bool Validate(const TArray<FShiSiteData>& Sites, FString& OutError);
};
