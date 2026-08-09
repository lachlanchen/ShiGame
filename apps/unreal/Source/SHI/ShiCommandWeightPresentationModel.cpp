#include "ShiCommandWeightPresentationModel.h"

#include "ShiCommandSurfacePresentationModel.h"
#include "ShiWartableModel.h"

namespace
{
    const TCHAR* CommandWeightMeshPath = TEXT("/Game/SHI/Art/Props/CommandWeight/SM_SHI_CommandWeight_01.SM_SHI_CommandWeight_01");
    constexpr float MinimumMarkerClearance = 62.f;
    constexpr float CouncilAspectRatio = 16.f / 9.f;

    FVector BoundsCenter(const FShiCommandWeightPresentationData& Presentation)
    {
        return Presentation.Transform.TransformPosition((Presentation.BoundsMinimum + Presentation.BoundsMaximum) * .5f);
    }

    bool FitsCommandSurface(const FShiCommandWeightPresentationData& Presentation)
    {
        for (int32 XIndex = 0; XIndex < 2; ++XIndex)
        {
            for (int32 YIndex = 0; YIndex < 2; ++YIndex)
            {
                const FVector Corner(
                    XIndex == 0 ? Presentation.BoundsMinimum.X : Presentation.BoundsMaximum.X,
                    YIndex == 0 ? Presentation.BoundsMinimum.Y : Presentation.BoundsMaximum.Y,
                    Presentation.BoundsMinimum.Z);
                const FVector WorldCorner = Presentation.Transform.TransformPosition(Corner);
                if (FMath::Abs(WorldCorner.X) > FShiCommandSurfacePresentationModel::HalfWidth()
                        - FShiCommandSurfacePresentationModel::EdgeClearance()
                    || FMath::Abs(WorldCorner.Y) > FShiCommandSurfacePresentationModel::HalfDepth()
                        - FShiCommandSurfacePresentationModel::EdgeClearance())
                {
                    return false;
                }
            }
        }
        return true;
    }
}

FShiCommandWeightPresentationData FShiCommandWeightPresentationModel::Build()
{
    FShiCommandWeightPresentationData Presentation;
    Presentation.MeshPath = CommandWeightMeshPath;
    Presentation.BoundsMinimum = FVector(-3.637946f, -2.861216f, .114589f);
    Presentation.BoundsMaximum = FVector(4.84f, 2.690566f, 3.54f);
    Presentation.Transform = FTransform(FRotator(0.f, 20.f, 0.f),
        FVector(90.f, 172.f, FShiCommandSurfacePresentationModel::SurfaceTopZ() - Presentation.BoundsMinimum.Z));
    Presentation.bInteractive = false;
    Presentation.bVisibleDuringEngagement = false;
    return Presentation;
}

bool FShiCommandWeightPresentationModel::ProjectToCouncilFrame(const FShiCouncilStageData& CouncilStage,
    const FVector& WorldPoint, FVector2D& OutNormalizedDevicePoint, float& OutDepth)
{
    const FVector Delta = WorldPoint - CouncilStage.CameraTransform.GetLocation();
    const FQuat CameraRotation = CouncilStage.CameraTransform.GetRotation();
    const FVector Forward = CameraRotation.GetForwardVector();
    const FVector Right = CameraRotation.GetRightVector();
    const FVector Up = CameraRotation.GetUpVector();
    OutDepth = FVector::DotProduct(Delta, Forward);
    if (OutDepth <= KINDA_SMALL_NUMBER || CouncilStage.FieldOfViewDegrees <= 0.f
        || CouncilStage.FieldOfViewDegrees >= 170.f)
    {
        OutNormalizedDevicePoint = FVector2D::ZeroVector;
        return false;
    }
    const float HorizontalTangent = FMath::Tan(FMath::DegreesToRadians(CouncilStage.FieldOfViewDegrees * .5f));
    const float VerticalTangent = HorizontalTangent / CouncilAspectRatio;
    OutNormalizedDevicePoint.X = FVector::DotProduct(Delta, Right) / (OutDepth * HorizontalTangent);
    OutNormalizedDevicePoint.Y = FVector::DotProduct(Delta, Up) / (OutDepth * VerticalTangent);
    return FMath::IsFinite(OutNormalizedDevicePoint.X) && FMath::IsFinite(OutNormalizedDevicePoint.Y);
}

FTransform FShiCommandWeightPresentationModel::ReviewCameraTransform(
    const FShiCommandWeightPresentationData& Presentation, bool bBackView)
{
    const FVector Target = BoundsCenter(Presentation);
    const FVector Offset = bBackView ? FVector(-56.f, 52.f, 34.f) : FVector(56.f, -52.f, 34.f);
    const FVector Location = Target + Offset;
    return FTransform((Target - Location).Rotation(), Location);
}

bool FShiCommandWeightPresentationModel::Validate(const FShiCommandWeightPresentationData& Presentation,
    const TArray<FShiSiteData>& Sites, const TArray<FShiCommandSignalData>& Signals,
    const FShiCouncilStageData& CouncilStage, FString& OutError)
{
    if (Presentation.MeshPath != CommandWeightMeshPath || Presentation.bInteractive
        || Presentation.bVisibleDuringEngagement || !Presentation.Transform.GetScale3D().Equals(FVector::OneVector, .0001f)
        || !Presentation.BoundsMinimum.Equals(FVector(-3.637946f, -2.861216f, .114589f), .001f)
        || !Presentation.BoundsMaximum.Equals(FVector(4.84f, 2.690566f, 3.54f), .001f))
    {
        OutError = TEXT("The command weight must preserve its reviewed asset, scale and non-authoritative presentation contract.");
        return false;
    }
    const FVector ContactPoint = Presentation.Transform.TransformPosition(
        FVector(0.f, 0.f, Presentation.BoundsMinimum.Z));
    if (!FMath::IsNearlyEqual(ContactPoint.Z, FShiCommandSurfacePresentationModel::SurfaceTopZ(), .01f)
        || !FitsCommandSurface(Presentation))
    {
        OutError = TEXT("The command weight must make contact with the bounded command surface and retain an edge margin.");
        return false;
    }
    if (!FShiWartableModel::Validate(Sites, OutError)
        || !FShiCommandSignalModel::ValidateAgainstSites(Signals, Sites, OutError))
    {
        return false;
    }
    const FVector PropLocation = Presentation.Transform.GetLocation();
    for (const FShiSiteData& Site : Sites)
    {
        if (FVector::Dist2D(PropLocation, FShiWartableModel::ProjectSite(Site)) < MinimumMarkerClearance)
        {
            OutError = FString::Printf(TEXT("The command weight crowds inspectable site %s."), *Site.Id);
            return false;
        }
    }
    for (const FShiCommandSignalData& Signal : Signals)
    {
        if (FVector::Dist2D(PropLocation, Signal.Location) < MinimumMarkerClearance)
        {
            OutError = FString::Printf(TEXT("The command weight crowds live command signal %s."), *Signal.Id);
            return false;
        }
    }
    FVector2D FramePoint;
    float Depth = 0.f;
    if (!FMath::IsNearlyEqual(CouncilStage.FieldOfViewDegrees, 44.f, .001f)
        || !ProjectToCouncilFrame(CouncilStage, BoundsCenter(Presentation), FramePoint, Depth)
        || FMath::Abs(FramePoint.X) > .75f || FramePoint.Y < -.82f || FramePoint.Y > .60f)
    {
        OutError = TEXT("The command weight falls outside the authored 44-degree council composition safe area.");
        return false;
    }
    const float HorizontalTangent = FMath::Tan(FMath::DegreesToRadians(CouncilStage.FieldOfViewDegrees * .5f));
    const float LongestDimension = (Presentation.BoundsMaximum - Presentation.BoundsMinimum).GetMax();
    const float NormalizedReadableSpan = LongestDimension / (Depth * HorizontalTangent);
    if (NormalizedReadableSpan < .035f)
    {
        OutError = TEXT("The command weight is too small in the council composition to read as a physical decision object.");
        return false;
    }
    OutError.Empty();
    return true;
}
