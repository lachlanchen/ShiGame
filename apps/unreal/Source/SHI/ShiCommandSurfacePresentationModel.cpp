#include "ShiCommandSurfacePresentationModel.h"

#include "ShiWartableModel.h"

namespace
{
    const TCHAR* CommandSurfaceMeshPath = TEXT("/Game/SHI/Art/Environment/CommandSurface/SM_SHI_CommandSurface_01.SM_SHI_CommandSurface_01");

    bool FitsSafeField(const FVector& Point)
    {
        return FMath::Abs(Point.X) <= FShiCommandSurfacePresentationModel::HalfWidth()
                - FShiCommandSurfacePresentationModel::EdgeClearance()
            && FMath::Abs(Point.Y) <= FShiCommandSurfacePresentationModel::HalfDepth()
                - FShiCommandSurfacePresentationModel::EdgeClearance();
    }
}

FShiCommandSurfacePresentationData FShiCommandSurfacePresentationModel::Build()
{
    FShiCommandSurfacePresentationData Presentation;
    Presentation.MeshPath = CommandSurfaceMeshPath;
    Presentation.Transform = FTransform::Identity;
    Presentation.BoundsMinimum = FVector(-290.f, -185.f, -2.f);
    Presentation.BoundsMaximum = FVector(290.f, 185.f, 14.f);
    Presentation.bInteractive = false;
    Presentation.bCollisionEnabled = false;
    Presentation.bVisibleDuringEngagement = true;
    return Presentation;
}

bool FShiCommandSurfacePresentationModel::Validate(
    const FShiCommandSurfacePresentationData& Presentation, const TArray<FShiSiteData>& Sites,
    const TArray<FShiCommandSignalData>& Signals, FString& OutError)
{
    if (Presentation.MeshPath != CommandSurfaceMeshPath
        || !Presentation.Transform.GetLocation().Equals(FVector::ZeroVector, .0001f)
        || !Presentation.Transform.GetRotation().Equals(FQuat::Identity, .0001f)
        || !Presentation.Transform.GetScale3D().Equals(FVector::OneVector, .0001f)
        || !Presentation.BoundsMinimum.Equals(FVector(-290.f, -185.f, -2.f), .001f)
        || !Presentation.BoundsMaximum.Equals(FVector(290.f, 185.f, 14.f), .001f)
        || Presentation.bInteractive || Presentation.bCollisionEnabled
        || !Presentation.bVisibleDuringEngagement)
    {
        OutError = TEXT("The command surface must preserve its reviewed asset, identity transform, exact bounds and non-interactive stage contract.");
        return false;
    }
    if (!FMath::IsNearlyEqual(Presentation.BoundsMaximum.Z, SurfaceTopZ(), .001f)
        || !FShiWartableModel::Validate(Sites, OutError)
        || !FShiCommandSignalModel::ValidateAgainstSites(Signals, Sites, OutError))
    {
        return false;
    }
    for (const FShiSiteData& Site : Sites)
    {
        if (!FitsSafeField(FShiWartableModel::ProjectSite(Site)))
        {
            OutError = FString::Printf(TEXT("Inspectable site %s leaves the reviewed command-ground safe field."), *Site.Id);
            return false;
        }
    }
    for (const FShiCommandSignalData& Signal : Signals)
    {
        if (!FitsSafeField(Signal.Location)
            || Signal.Location.Z < SurfaceTopZ() - .01f)
        {
            OutError = FString::Printf(TEXT("Live command signal %s leaves or penetrates the reviewed command-ground surface."), *Signal.Id);
            return false;
        }
    }
    OutError.Empty();
    return true;
}

FTransform FShiCommandSurfacePresentationModel::ReviewCameraTransform()
{
    const FVector Target(0.f, 0.f, 18.f);
    const FVector Location(640.f, -680.f, 455.f);
    return FTransform((Target - Location).Rotation(), Location);
}
