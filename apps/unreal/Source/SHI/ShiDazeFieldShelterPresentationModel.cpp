#include "ShiDazeFieldShelterPresentationModel.h"

#include "ShiCommandSurfacePresentationModel.h"

namespace
{
    const TCHAR* ShelterMeshPath = TEXT("/Game/SHI/Art/Environment/DazeShelter/SM_SHI_DazeFieldShelter_01.SM_SHI_DazeFieldShelter_01");
    const TCHAR* ShelterDisclosure = TEXT("FICTIONAL PRACTICAL FIELD CONSTRUCTION · NOT AN ATTESTED DAZE RECONSTRUCTION · PRODUCTION BLOCKOUT");
    const TArray<FVector2D> AuthoredPostCenters = {
        FVector2D(-360.f, -260.f), FVector2D(360.f, -260.f),
        FVector2D(-360.f, 260.f), FVector2D(360.f, 260.f),
    };
}

FShiDazeFieldShelterPresentationData FShiDazeFieldShelterPresentationModel::Build()
{
    FShiDazeFieldShelterPresentationData Presentation;
    Presentation.MeshPath = ShelterMeshPath;
    Presentation.HistoricalDisclosure = ShelterDisclosure;
    Presentation.Transform = FTransform::Identity;
    Presentation.BoundsMinimum = FVector(-HalfWidth(), -HalfDepth(), MinimumZ());
    Presentation.BoundsMaximum = FVector(HalfWidth(), HalfDepth(), MaximumZ());
    Presentation.PostCenters = AuthoredPostCenters;
    Presentation.ConservativePostRadius = ConservativePostRadius();
    Presentation.MinimumEaveHeight = MinimumEaveHeight();
    Presentation.bHistoricallyAttested = false;
    Presentation.bFinalArt = false;
    Presentation.bInteractive = false;
    Presentation.bCollisionEnabled = false;
    Presentation.bAffectsNavigation = false;
    Presentation.bVisibleDuringEngagement = true;
    return Presentation;
}

bool FShiDazeFieldShelterPresentationModel::Validate(
    const FShiDazeFieldShelterPresentationData& Presentation, FString& OutError)
{
    if (Presentation.MeshPath != ShelterMeshPath
        || Presentation.HistoricalDisclosure != ShelterDisclosure
        || !Presentation.Transform.GetLocation().Equals(FVector::ZeroVector, .0001f)
        || !Presentation.Transform.GetRotation().Equals(FQuat::Identity, .0001f)
        || !Presentation.Transform.GetScale3D().Equals(FVector::OneVector, .0001f)
        || !Presentation.BoundsMinimum.Equals(FVector(-HalfWidth(), -HalfDepth(), MinimumZ()), .001f)
        || !Presentation.BoundsMaximum.Equals(FVector(HalfWidth(), HalfDepth(), MaximumZ()), .001f))
    {
        OutError = TEXT("The Daze shelter must preserve its reviewed asset, disclosure, identity transform and exact bounds.");
        return false;
    }
    if (Presentation.bHistoricallyAttested || Presentation.bFinalArt || Presentation.bInteractive
        || Presentation.bCollisionEnabled || Presentation.bAffectsNavigation
        || !Presentation.bVisibleDuringEngagement)
    {
        OutError = TEXT("The Daze shelter is a disclosed production blockout with no historical, final-art, interaction, collision or navigation authority.");
        return false;
    }
    if (!FMath::IsNearlyEqual(Presentation.MinimumEaveHeight, MinimumEaveHeight(), .001f)
        || !FMath::IsNearlyEqual(Presentation.ConservativePostRadius, ConservativePostRadius(), .001f)
        || Presentation.MinimumEaveHeight < 250.f
        || Presentation.BoundsMaximum.Z > MaximumAllowedHeight())
    {
        OutError = TEXT("The shelter height or eave-clearance envelope drifted from the reviewed council composition.");
        return false;
    }
    if (Presentation.PostCenters.Num() != AuthoredPostCenters.Num())
    {
        OutError = TEXT("The shelter must retain exactly four reviewed corner posts.");
        return false;
    }
    for (int32 Index = 0; Index < AuthoredPostCenters.Num(); ++Index)
    {
        const FVector2D Post = Presentation.PostCenters[Index];
        if (!Post.Equals(AuthoredPostCenters[Index], .001f)
            || FMath::Abs(Post.X) - Presentation.ConservativePostRadius
                < FShiCommandSurfacePresentationModel::HalfWidth() + MinimumPostClearance()
            || FMath::Abs(Post.Y) - Presentation.ConservativePostRadius
                < FShiCommandSurfacePresentationModel::HalfDepth() + MinimumPostClearance())
        {
            OutError = TEXT("A shelter post intrudes on the safe command-surface clearance envelope.");
            return false;
        }
    }
    OutError.Empty();
    return true;
}

FTransform FShiDazeFieldShelterPresentationModel::ReviewCameraTransform()
{
    const FVector Target(0.f, 0.f, 150.f);
    const FVector Location(1150.f, -1050.f, 600.f);
    return FTransform((Target - Location).Rotation(), Location);
}
