#include "ShiWetFieldEnvironmentPresentationModel.h"

#include "ShiCommandSurfacePresentationModel.h"

namespace
{
    const TCHAR* WetFieldMeshPath = TEXT("/Game/SHI/Art/Environment/WetField/SM_SHI_WetFieldEnvironment_01.SM_SHI_WetFieldEnvironment_01");
}

FShiWetFieldEnvironmentPresentationData FShiWetFieldEnvironmentPresentationModel::Build()
{
    FShiWetFieldEnvironmentPresentationData Presentation;
    Presentation.MeshPath = WetFieldMeshPath;
    Presentation.Transform = FTransform::Identity;
    Presentation.BoundsMinimum = FVector(-HalfExtent(), -HalfExtent(), MinimumZ());
    Presentation.BoundsMaximum = FVector(HalfExtent(), HalfExtent(), MaximumZ());
    Presentation.bInteractive = false;
    Presentation.bCollisionEnabled = false;
    Presentation.bAffectsNavigation = false;
    Presentation.bVisibleDuringEngagement = true;
    return Presentation;
}

bool FShiWetFieldEnvironmentPresentationModel::Validate(
    const FShiWetFieldEnvironmentPresentationData& Presentation, FString& OutError)
{
    if (Presentation.MeshPath != WetFieldMeshPath
        || !Presentation.Transform.GetLocation().Equals(FVector::ZeroVector, .0001f)
        || !Presentation.Transform.GetRotation().Equals(FQuat::Identity, .0001f)
        || !Presentation.Transform.GetScale3D().Equals(FVector::OneVector, .0001f)
        || !Presentation.BoundsMinimum.Equals(FVector(-HalfExtent(), -HalfExtent(), MinimumZ()), .001f)
        || !Presentation.BoundsMaximum.Equals(FVector(HalfExtent(), HalfExtent(), MaximumZ()), .001f))
    {
        OutError = TEXT("The wet-field environment must preserve its reviewed asset, identity transform and exact bounds.");
        return false;
    }
    if (Presentation.bInteractive || Presentation.bCollisionEnabled || Presentation.bAffectsNavigation
        || !Presentation.bVisibleDuringEngagement)
    {
        OutError = TEXT("The wet-field environment is a non-authoritative presentation layer with no runtime interaction, collision or navigation.");
        return false;
    }
    const float CommandSurfaceBottom = FShiCommandSurfacePresentationModel::Build().BoundsMinimum.Z;
    if (Presentation.BoundsMaximum.Z > CommandSurfaceBottom - MinimumCommandSurfaceClearance())
    {
        OutError = TEXT("The wet field must retain visible clearance below the admitted command-surface volume.");
        return false;
    }
    OutError.Empty();
    return true;
}

FTransform FShiWetFieldEnvironmentPresentationModel::ReviewCameraTransform()
{
    const FVector Target(0.f, 0.f, -10.f);
    const FVector Location(1700.f, -1950.f, 1280.f);
    return FTransform((Target - Location).Rotation(), Location);
}
