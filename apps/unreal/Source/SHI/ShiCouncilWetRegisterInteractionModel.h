#pragma once

#include "CoreMinimal.h"

struct FShiCouncilWetRegisterAssetData
{
    FString AssetId;
    FString AssetPath;
    FString AssetClass;
};

struct FShiCouncilWetRegisterSemanticStateData
{
    FString StateId;
    int32 SourceFrame = 0;
    int32 SampleIndex = 0;
    float TimeSeconds = 0.f;
    bool bLeftSupport = false;
    bool bRightContact = false;
    bool bRightReleasing = false;
};

struct FShiCouncilWetRegisterInteractionContractData
{
    FString AssetId;
    FString ReviewModeId;
    FString NodeId;
    FString SpeakerCharacterId;
    FString ParticipantSlotId;
    FString IsolatedRootPath;
    FString CharacterMeshPath;
    FString SkeletonPath;
    FString SkeletonSourceName;
    FString SkeletonHierarchyAndBindSha256;
    FString HistoricalDisclosure;
    FString ContactMeasurementScope;
    FString SourceWatchedDecision;
    FString CanonicalPlayerOwnershipContext;
    FString StoryContinuityBoundary;
    FName PropOwnerBone = NAME_None;
    FName RightContactBone = NAME_None;
    TArray<FShiCouncilWetRegisterAssetData> AssetInventory;
    TArray<FString> MarkerIds;
    TArray<FString> MarkerSocketNames;
    TArray<FTransform> MarkerLocalTransformsCentimeters;
    TArray<FShiCouncilWetRegisterSemanticStateData> SemanticStates;
    FVector PropWorldDimensionsCentimeters = FVector::ZeroVector;
    FVector CharacterComponentScale = FVector::OneVector;
    FVector PropAttachmentRelativeScale = FVector::OneVector;
    int32 BoneCount = 0;
    int32 ExpectedSamples = 0;
    float ExpectedFramesPerSecond = 0.f;
    float ExpectedDurationSeconds = 0.f;
    int32 ContactAcquisitionCount = 0;
    int32 ContactReleaseCount = 0;
    int32 ContactAcquisitionSample = INDEX_NONE;
    int32 OrderedReleasePhaseOnsetSample = INDEX_NONE;
    int32 ContactReleaseSample = INDEX_NONE;
    double MaximumObservedRootTranslationDriftCentimeters = 0.0;
    double MaximumObservedRootYawDriftDegrees = 0.0;
    double MaximumObservedLeftSupportDriftCentimeters = 0.0;
    double MaximumObservedLeftSupportDriftDegrees = 0.0;
    double MaximumObservedLeftSupportFloatingCentimeters = 0.0;
    double MaximumObservedHandPenetrationCentimeters = 0.0;
    double MaximumObservedRightFloatingCentimeters = 0.0;
    double MinimumObservedArmChainScale = 1.0;
    double MaximumObservedArmChainScale = 1.0;
    bool bEngineeringBlockout = false;
    bool bDramaticReconstruction = false;
    bool bStageOwnedProp = false;
    bool bLeftHandOwnsPropForEntireClip = false;
    bool bRightContactSingleContinuousInterval = false;
    bool bReducedMotionSupported = false;
    bool bReducedMotionHeldCutParity = false;
    bool bDeterministic = false;
    bool bAllTransformsFinite = false;
    bool bSourceMeasurementReceiptBound = false;
    bool bNoNegativeScale = false;
    bool bNoIkStretch = false;
    bool bClipLooping = false;
    bool bRootMotion = false;
    bool bRandomized = false;
    bool bAudioDriven = false;
    bool bTranscriptDriven = false;
    bool bPhysicsDriven = false;
    bool bProceduralNoise = false;
    bool bPropReparentedDuringClip = false;
    bool bPropAttachedToCamera = false;
    bool bCollisionEnabled = false;
    bool bInteractionInputAuthority = false;
    bool bChoiceAuthority = false;
    bool bGameplayAuthority = false;
    bool bCampaignMutationAuthority = false;
    bool bSaveAuthority = false;
    bool bNavigationAuthority = false;
    bool bReplicated = false;
    bool bHistoricallyAuthenticatedObject = false;
    bool bHumanHistoricalCulturalReviewApproved = false;
    bool bConservativeSourceMeshContactProxyPassed = false;
    bool bVisibleMeshContactReviewed = false;
    bool bKeeperOwnsRegisterBeforeClip = false;
    bool bAssumesPriorOffscreenKeeperToChenHandoff = false;
    bool bHandoffShown = false;
    bool bPlayerOwnershipContinuityApproved = false;
    bool bClipAloneCompletesStoryBeat = false;
    bool bTwoCharacterTransferDeferred = false;
    bool bFinalStoryBeatApproved = false;
    bool bCloseCameraApproved = false;
    bool bFinalProp = false;
    bool bFinalHandAnimation = false;
};

struct FShiCouncilWetRegisterInteractionFrameRequest
{
    FShiCouncilWetRegisterInteractionContractData Contract;
    FString NodeId;
    FString SpeakerCharacterId;
    FString ParticipantSlotId;
    FString ReviewModeId;
    float ElapsedSeconds = 0.f;
    bool bDevelopmentReviewAuthorized = false;
    bool bReducedMotion = false;
};

struct FShiCouncilWetRegisterInteractionFrameData
{
    FString AssetId;
    FString RouteId;
    FString NodeId;
    FString SpeakerCharacterId;
    FString ParticipantSlotId;
    FString StateId;
    FString CharacterMeshPath;
    FString SkeletonPath;
    FString PropMeshPath;
    FString PropMaterialPath;
    FString AnimationPath;
    FVector PropWorldDimensionsCentimeters = FVector::ZeroVector;
    FVector CharacterComponentScale = FVector::OneVector;
    FVector PropAttachmentRelativeScale = FVector::OneVector;
    float RequestedSeconds = 0.f;
    float PlaybackSeconds = 0.f;
    float PoseSeconds = 0.f;
    double MaximumObservedRootTranslationDriftCentimeters = 0.0;
    double MaximumObservedRootYawDriftDegrees = 0.0;
    double MaximumObservedLeftSupportDriftCentimeters = 0.0;
    double MaximumObservedLeftSupportDriftDegrees = 0.0;
    double MaximumObservedLeftSupportFloatingCentimeters = 0.0;
    double MaximumObservedHandPenetrationCentimeters = 0.0;
    double MaximumObservedRightFloatingCentimeters = 0.0;
    double MinimumObservedArmChainScale = 1.0;
    double MaximumObservedArmChainScale = 1.0;
    int32 PlaybackSampleIndex = 0;
    int32 PoseSampleIndex = 0;
    int32 SemanticSampleIndex = 0;
    int32 StateIndex = 0;
    int32 ContactAcquisitionCount = 0;
    int32 ContactReleaseCount = 0;
    bool bDevelopmentReviewAuthorized = false;
    bool bReducedMotion = false;
    bool bMotionSuppressed = false;
    bool bTerminalClamp = false;
    bool bLeftSupport = false;
    bool bRightContact = false;
    bool bRightReleasing = false;
    bool bLeftHandOwnsProp = false;
    bool bKeeperOwnsRegisterBeforeClip = false;
    bool bAssumesPriorOffscreenKeeperToChenHandoff = false;
    bool bHandoffShown = false;
    bool bPlayerOwnershipContinuityApproved = false;
    bool bClipAloneCompletesStoryBeat = false;
    bool bTwoCharacterTransferDeferred = false;
    bool bFinalStoryBeatApproved = false;
    bool bDeterministic = false;
    bool bAllTransformsFinite = false;
    bool bNoNegativeScale = false;
    bool bNoIkStretch = false;
    bool bCanLoop = false;
    bool bRandomized = false;
    bool bAudioDriven = false;
    bool bTranscriptDriven = false;
    bool bPhysicsDriven = false;
    bool bProceduralNoise = false;
    bool bCollisionEnabled = false;
    bool bInteractionInputAuthority = false;
    bool bChoiceAuthority = false;
    bool bGameplayAuthority = false;
    bool bCampaignMutationAuthority = false;
    bool bSaveAuthority = false;
    bool bNavigationAuthority = false;
    bool bReplicated = false;
};

class FShiCouncilWetRegisterInteractionModel
{
public:
    static constexpr int32 AssetInventoryCount() { return 3; }
    static constexpr int32 MarkerCount() { return 3; }
    static constexpr int32 SemanticStateCount() { return 5; }
    static constexpr int32 BoneCount() { return 53; }
    static constexpr int32 ExpectedSamples() { return 121; }
    static constexpr float ExpectedFramesPerSecond() { return 30.f; }
    static constexpr float ExpectedDurationSeconds() { return 4.f; }
    static constexpr double RootTranslationToleranceCentimeters() { return .1; }
    static constexpr double RootYawToleranceDegrees() { return .1; }
    static constexpr double LeftSupportTranslationToleranceCentimeters() { return .25; }
    static constexpr double LeftSupportRotationToleranceDegrees() { return .25; }
    static constexpr double LeftSupportFloatingToleranceCentimeters() { return .8; }
    static constexpr double HandPenetrationToleranceCentimeters() { return .4; }
    static constexpr double RightFloatingToleranceCentimeters() { return .8; }
    static constexpr double AcceptedRootTranslationDriftCentimeters() { return 0.0; }
    static constexpr double AcceptedRootYawDriftDegrees() { return 0.0; }
    static constexpr double AcceptedLeftSupportDriftCentimeters()
    {
        return .0039685306858313904;
    }
    static constexpr double AcceptedLeftSupportDriftDegrees() { return 0.0; }
    static constexpr double AcceptedLeftSupportFloatingCentimeters()
    {
        return .3386637148479367;
    }
    static constexpr double AcceptedHandPenetrationCentimeters()
    {
        return .3500294405966997;
    }
    static constexpr double AcceptedRightFloatingCentimeters()
    {
        return 0.0;
    }

    static const FString& CanonicalAssetId();
    static const FString& CanonicalReviewModeId();
    static const FString& CanonicalNodeId();
    static const FString& CanonicalSpeakerCharacterId();
    static const FString& CanonicalParticipantSlotId();
    static const FString& CanonicalIsolatedRootPath();
    static const FString& CanonicalCharacterMeshPath();
    static const FString& CanonicalSkeletonPath();
    static const FString& CanonicalSkeletonHierarchyAndBindSha256();
    static const FString& CanonicalPropMeshPath();
    static const FString& CanonicalPropMaterialPath();
    static const FString& CanonicalAnimationPath();
    static FName CanonicalPropOwnerBone();
    static FName CanonicalRightContactBone();
    static const TArray<FString>& CanonicalMarkerIds();
    static const TArray<FString>& CanonicalMarkerSocketNames();
    static const TArray<FTransform>& CanonicalMarkerLocalTransformsCentimeters();
    static const TArray<FString>& CanonicalSemanticStateIds();
    static bool TryGetMarkerLocalTransform(const FString& MarkerId,
        FTransform& OutLocalTransformCentimeters);

    static bool BuildContract(FShiCouncilWetRegisterInteractionContractData& OutContract,
        FString& OutError);
    static bool ValidateContract(const FShiCouncilWetRegisterInteractionContractData& Contract,
        FString& OutError);
    static bool Evaluate(const FShiCouncilWetRegisterInteractionFrameRequest& Request,
        FShiCouncilWetRegisterInteractionFrameData& OutFrame, FString& OutError);
    static bool ValidateFrame(const FShiCouncilWetRegisterInteractionFrameData& Frame,
        FString& OutError);
};
