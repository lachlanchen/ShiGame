#include "ShiWartableModel.h"

namespace
{
    constexpr float TableHalfWidth = 230.f;
    constexpr float TableHalfDepth = 140.f;
    constexpr float MarkerHeight = 28.f;
}

FVector FShiWartableModel::ProjectSite(const FShiSiteData& Site)
{
    return FVector((Site.X - 50.f) * 4.6f, (Site.Z - 50.f) * 2.8f, MarkerHeight);
}

FTransform FShiWartableModel::CameraTransform(const FShiSiteData& Site)
{
    const FVector Target = ProjectSite(Site) + FVector(0.f, 0.f, 12.f);
    const FVector Location = Target + FVector(390.f, -430.f, 285.f);
    return FTransform((Target - Location).Rotation(), Location);
}

FShiWartableMarkerStyle FShiWartableModel::MarkerStyle(const FString& Status, bool bSelected)
{
    FShiWartableMarkerStyle Style;
    if (Status == TEXT("known"))
    {
        Style.MeshPath = TEXT("/Engine/BasicShapes/Cylinder.Cylinder");
        Style.Scale = FVector(.27f, .27f, .18f);
        Style.Color = FLinearColor(.72f, .34f, .08f);
        Style.StencilValue = 1;
    }
    else if (Status == TEXT("reported"))
    {
        Style.MeshPath = TEXT("/Engine/BasicShapes/Sphere.Sphere");
        Style.Scale = FVector(.22f, .22f, .22f);
        Style.Color = FLinearColor(.18f, .42f, .52f);
        Style.StencilValue = 2;
    }
    else if (Status == TEXT("reference"))
    {
        Style.MeshPath = TEXT("/Engine/BasicShapes/Cone.Cone");
        Style.Scale = FVector(.22f, .22f, .25f);
        Style.Color = FLinearColor(.25f, .27f, .25f);
        Style.StencilValue = 3;
    }
    if (bSelected)
    {
        Style.Scale *= 1.24f;
        Style.Color = FLinearColor::LerpUsingHSV(Style.Color, FLinearColor(.95f, .76f, .34f), .48f);
    }
    return Style;
}

FString FShiWartableModel::CycleSite(const TArray<FShiSiteData>& Sites, const FString& CurrentSiteId, int32 Direction)
{
    if (Sites.IsEmpty() || Direction == 0) return CurrentSiteId;
    const int32 CurrentIndex = Sites.IndexOfByPredicate([&](const FShiSiteData& Site) { return Site.Id == CurrentSiteId; });
    const int32 Step = Direction < 0 ? -1 : 1;
    const int32 BaseIndex = CurrentIndex == INDEX_NONE ? (Step > 0 ? -1 : 0) : CurrentIndex;
    const int32 NextIndex = (BaseIndex + Step + Sites.Num()) % Sites.Num();
    return Sites[NextIndex].Id;
}

bool FShiWartableModel::Validate(const TArray<FShiSiteData>& Sites, FString& OutError)
{
    if (Sites.IsEmpty())
    {
        OutError = TEXT("The wartable requires at least one intelligence site.");
        return false;
    }
    TSet<FString> SiteIds;
    TArray<FVector> Positions;
    for (const FShiSiteData& Site : Sites)
    {
        const FShiWartableMarkerStyle Style = MarkerStyle(Site.Status, false);
        const FVector Position = ProjectSite(Site);
        if (Site.Id.IsEmpty() || SiteIds.Contains(Site.Id) || Style.MeshPath.IsEmpty() || Style.StencilValue < 1 || Style.StencilValue > 3
            || Style.Scale.GetMin() <= 0.f || !FMath::IsFinite(Position.X) || !FMath::IsFinite(Position.Y) || !FMath::IsFinite(Position.Z) || FMath::Abs(Position.X) > TableHalfWidth
            || FMath::Abs(Position.Y) > TableHalfDepth || !FMath::IsNearlyEqual(Position.Z, MarkerHeight))
        {
            OutError = FString::Printf(TEXT("Site %s cannot be represented safely on the bounded wartable."), *Site.Id);
            return false;
        }
        for (const FVector& Existing : Positions)
        {
            if (FVector::Dist2D(Existing, Position) < 32.f)
            {
                OutError = FString::Printf(TEXT("Site %s overlaps another inspectable wartable marker."), *Site.Id);
                return false;
            }
        }
        SiteIds.Add(Site.Id);
        Positions.Add(Position);
    }
    OutError.Empty();
    return true;
}
