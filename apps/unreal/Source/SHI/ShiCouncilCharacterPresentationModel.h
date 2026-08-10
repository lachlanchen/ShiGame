#pragma once

#include "CoreMinimal.h"

class USkeletalMesh;

struct FShiCouncilCharacterPresentationData
{
    FString CharacterId;
    FString MeshPath;
    FString SkeletonPath;
    FString RoleSilhouette;
    FString HistoricalDisclosure;
    TArray<FName> MaterialSlots;
    FVector ComponentScale = FVector::OneVector;
    float AssetLocalHeight = 0.f;
    int32 SourceTriangles = 0;
    int32 BoneCount = 0;
    bool bExactCostumeReconstruction = false;
    bool bHistoricalPortrait = false;
    bool bFinalArt = false;
    bool bAnimated = false;
    bool bCollisionEnabled = false;
    bool bSkeletalMeshIsInteractionAuthority = false;
    bool bPrimitiveInteractionFallback = true;
    bool bWideAndMediumFramingOnly = true;
};

class FShiCouncilCharacterPresentationModel
{
public:
    static constexpr float PresentationScale() { return 100.f; }
    static constexpr int32 BoneCount() { return 53; }
    static constexpr float MinimumPresentedHeight() { return 155.f; }
    static constexpr float MaximumPresentedHeight() { return 183.f; }
    static constexpr int32 MaximumTriangles() { return 55000; }
    static constexpr int32 MaximumMaterialSlots() { return 6; }

    static const TArray<FString>& CanonicalCharacterIds();
    static bool Build(const FString& CharacterId, FShiCouncilCharacterPresentationData& OutPresentation,
        FString& OutError);
    static bool Validate(const FShiCouncilCharacterPresentationData& Presentation, FString& OutError);
    static bool ValidateMesh(const FShiCouncilCharacterPresentationData& Presentation,
        const USkeletalMesh& Mesh, FString& OutError);
};
