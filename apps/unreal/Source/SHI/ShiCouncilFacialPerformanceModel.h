#pragma once

#include "CoreMinimal.h"

class USkeletalMesh;

struct FShiCouncilFacialMeshData
{
    FString CharacterId;
    FString MeshPath;
    FString SkeletonPath;
    FString HistoricalDisclosure;
    TArray<FName> MaterialSlots;
    TArray<FName> MorphTargets;
    FVector AssetLocalOrigin = FVector::ZeroVector;
    FVector AssetLocalDimensions = FVector::ZeroVector;
    FVector ComponentScale = FVector::OneVector;
    int32 SourceTriangles = 0;
    int32 BoneCount = 0;
    bool bEngineeringBlockout = false;
    bool bGenericNonPortraitFace = false;
    bool bDeterministic = false;
    bool bLanguageNeutral = false;
    bool bSilentIntentCadence = false;
    bool bReducedMotionSupported = false;
    bool bAudioDriven = false;
    bool bTranscriptDriven = false;
    bool bPhonemeDriven = false;
    bool bRandomized = false;
    bool bInteractionAuthority = false;
    bool bGameplayAuthority = false;
    bool bSaveAuthority = false;
    bool bReplicated = false;
    bool bWideAndMediumFramingOnly = true;
    bool bCloseFramingApproved = false;
    bool bFinalFace = false;
    bool bFinalActing = false;
    bool bFinalVoice = false;
};

struct FShiCouncilFacialMorphWeight
{
    FName MorphTarget = NAME_None;
    float Weight = 0.f;
};

struct FShiCouncilFacialFrameData
{
    FString RoleId;
    FString StateId;
    TArray<FShiCouncilFacialMorphWeight> MorphWeights;
    float CycleSeconds = 0.f;
    float TargetAlpha = 0.f;
    bool bSpeaker = false;
    bool bReducedMotion = false;
    bool bMotionSuppressed = false;
    bool bDeterministic = false;
    bool bLanguageNeutral = false;
    bool bSilentIntentCadence = false;
    bool bAudioDriven = false;
    bool bTranscriptDriven = false;
    bool bPhonemeDriven = false;
    bool bRandomized = false;
    bool bInteractionAuthority = false;
    bool bGameplayAuthority = false;
    bool bSaveAuthority = false;
    bool bReplicated = false;
};

class FShiCouncilFacialPerformanceModel
{
public:
    static constexpr float PresentationScale() { return 100.f; }
    static constexpr int32 BoneCount() { return 53; }
    static constexpr int32 MorphTargetCount() { return 21; }
    static constexpr float CycleDurationSeconds() { return 4.f; }
    static constexpr int32 MaximumTriangles() { return 56000; }
    static constexpr int32 MaximumMaterialSlots() { return 7; }
    static constexpr float MinimumPresentedHeight() { return 155.f; }
    static constexpr float MaximumPresentedHeight() { return 183.f; }

    static const TArray<FString>& CanonicalCharacterIds();
    static const TArray<FString>& CanonicalRoleIds();
    static const TArray<FString>& CanonicalStateIds();
    static const TArray<FName>& CanonicalMorphTargets();
    static float MaximumWeightForMorphTarget(const FName& MorphTarget);

    static bool Build(const FString& CharacterId, FShiCouncilFacialMeshData& OutPresentation,
        FString& OutError);
    static bool Validate(const FShiCouncilFacialMeshData& Presentation, FString& OutError);
    static bool ValidateMesh(const FShiCouncilFacialMeshData& Presentation,
        const USkeletalMesh& Mesh, FString& OutError);

    static bool Evaluate(bool bSpeaker, float ElapsedSeconds, bool bReducedMotion,
        FShiCouncilFacialFrameData& OutFrame, FString& OutError);
    static bool ValidateFrame(const FShiCouncilFacialFrameData& Frame, FString& OutError);
    static bool TryGetWeight(const FShiCouncilFacialFrameData& Frame,
        const FName& MorphTarget, float& OutWeight);
};
