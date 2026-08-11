#include "ShiCouncilWetRegisterInteractionModel.h"

namespace
{
    const FString AssetId(TEXT("shi-daze-council-wet-register-interaction-v1"));
    const FString ReviewModeId(TEXT("-ShiCouncilWetRegisterInteractionReview"));
    const FString NodeId(TEXT("rain-order"));
    const FString SpeakerCharacterId(TEXT("chen-sheng"));
    const FString ParticipantSlotId(TEXT("speaker"));
    const FString IsolatedRootPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1"));
    const FString CharacterMeshPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.SKM_SHI_DazeCouncil_ChenSheng_Facial_01"));
    const FString SkeletonPath(TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton"));
    const FString SkeletonSourceName(TEXT("SK_SHI_DazeCouncil_Skeleton"));
    const FString SkeletonHierarchyAndBindSha256(TEXT("b04056562dc0a4212b7d72e9bb091fd7c130f96f3442a584fdf38123805ee9fa"));
    const FString PropMeshPath(IsolatedRootPath
        / TEXT("SM_SHI_DazeCouncil_WetRegister_Blockout_01.SM_SHI_DazeCouncil_WetRegister_Blockout_01"));
    const FString PropMaterialPath(IsolatedRootPath
        / TEXT("M_SHI_DazeCouncil_WetRegister_Clay_01.M_SHI_DazeCouncil_WetRegister_Clay_01"));
    const FString AnimationPath(IsolatedRootPath
        / TEXT("A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01.A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01"));
    const FString HistoricalDisclosure(TEXT("PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER"));
    const FString ContactMeasurementScope(TEXT("all 121 source frames plus the dense t=3 boundary: ordered-release phase onset is sample 90 and measured wrist-marker contact exit is sample 91; wrist-marker alignment is a separate live runtime gate; conservative hand-mesh penetration/floating passed source rejection thresholds; watched in-engine deformation/anatomy review remains required"));
    const FString SourceWatchedDecision(TEXT("conditional-engineering-accept"));
    const FString CanonicalPlayerOwnershipContext(TEXT("In this reconstruction, you hold the soaked register that makes the crowd legible to the state."));
    const FString StoryContinuityBoundary(TEXT("Chen-only clip begins after an unshown offscreen Keeper-to-Chen handoff; prior player ownership continuity and the complete story beat remain unapproved."));
    const FName PropOwnerBone(TEXT("hand_l"));
    const FName RightContactBone(TEXT("hand_r"));
    const TArray<FString> MarkerIds = {
        TEXT("wet-register-left-support"),
        TEXT("wet-register-right-contact"),
        TEXT("wet-register-camera-readability")
    };
    const TArray<FString> MarkerSocketNames = {
        TEXT("WetRegister_LeftSupport"),
        TEXT("WetRegister_RightContact"),
        TEXT("WetRegister_CameraReadability")
    };
    const TArray<FTransform> MarkerLocalTransformsCentimeters = {
        FTransform(FQuat(FRotator(0.f, 0.f, 180.f)),
            FVector(11.f, -5.5f, -3.35f), FVector::OneVector),
        FTransform(FQuat(FRotator(0.f, 90.f, 0.f)),
            FVector(-11.f, 5.5f, 3.35f), FVector::OneVector),
        FTransform(FQuat::Identity, FVector(0.f, 0.f, 1.f), FVector::OneVector)
    };
    const TArray<FString> SemanticStateIds = {
        TEXT("start"), TEXT("bilateral-contact"), TEXT("held-question"),
        TEXT("ordered-release"), TEXT("settle")
    };

    FShiCouncilWetRegisterAssetData MakeAsset(
        const TCHAR* InAssetId, const FString& InAssetPath, const TCHAR* InAssetClass)
    {
        FShiCouncilWetRegisterAssetData Asset;
        Asset.AssetId = InAssetId;
        Asset.AssetPath = InAssetPath;
        Asset.AssetClass = InAssetClass;
        return Asset;
    }

    FShiCouncilWetRegisterSemanticStateData MakeState(const TCHAR* InStateId,
        int32 InSourceFrame, int32 InSampleIndex, float InTimeSeconds,
        bool bInLeftSupport, bool bInRightContact, bool bInRightReleasing)
    {
        FShiCouncilWetRegisterSemanticStateData State;
        State.StateId = InStateId;
        State.SourceFrame = InSourceFrame;
        State.SampleIndex = InSampleIndex;
        State.TimeSeconds = InTimeSeconds;
        State.bLeftSupport = bInLeftSupport;
        State.bRightContact = bInRightContact;
        State.bRightReleasing = bInRightReleasing;
        return State;
    }

    FShiCouncilWetRegisterInteractionContractData MakeExpectedContract()
    {
        FShiCouncilWetRegisterInteractionContractData Contract;
        Contract.AssetId = AssetId;
        Contract.ReviewModeId = ReviewModeId;
        Contract.NodeId = NodeId;
        Contract.SpeakerCharacterId = SpeakerCharacterId;
        Contract.ParticipantSlotId = ParticipantSlotId;
        Contract.IsolatedRootPath = IsolatedRootPath;
        Contract.CharacterMeshPath = CharacterMeshPath;
        Contract.SkeletonPath = SkeletonPath;
        Contract.SkeletonSourceName = SkeletonSourceName;
        Contract.SkeletonHierarchyAndBindSha256 = SkeletonHierarchyAndBindSha256;
        Contract.HistoricalDisclosure = HistoricalDisclosure;
        Contract.ContactMeasurementScope = ContactMeasurementScope;
        Contract.SourceWatchedDecision = SourceWatchedDecision;
        Contract.CanonicalPlayerOwnershipContext = CanonicalPlayerOwnershipContext;
        Contract.StoryContinuityBoundary = StoryContinuityBoundary;
        Contract.PropOwnerBone = PropOwnerBone;
        Contract.RightContactBone = RightContactBone;
        Contract.AssetInventory = {
            MakeAsset(TEXT("wet-register-blockout"), PropMeshPath, TEXT("StaticMesh")),
            MakeAsset(TEXT("wet-register-clay"), PropMaterialPath, TEXT("Material")),
            MakeAsset(TEXT("chen-sheng-wet-register-interaction"),
                AnimationPath, TEXT("AnimSequence"))
        };
        Contract.MarkerIds = MarkerIds;
        Contract.MarkerSocketNames = MarkerSocketNames;
        Contract.MarkerLocalTransformsCentimeters = MarkerLocalTransformsCentimeters;
        Contract.SemanticStates = {
            MakeState(TEXT("start"), 1, 0, 0.f, true, false, false),
            MakeState(TEXT("bilateral-contact"), 31, 30, 1.f, true, true, false),
            MakeState(TEXT("held-question"), 61, 60, 2.f, true, true, false),
            MakeState(TEXT("ordered-release"), 91, 90, 3.f, true, false, true),
            MakeState(TEXT("settle"), 121, 120, 4.f, true, false, false)
        };
        Contract.PropWorldDimensionsCentimeters = FVector(32.f, 14.f, 2.f);
        Contract.CharacterComponentScale = FVector(100.f);
        Contract.PropAttachmentRelativeScale = FVector(.01f);
        Contract.BoneCount = FShiCouncilWetRegisterInteractionModel::BoneCount();
        Contract.ExpectedSamples = FShiCouncilWetRegisterInteractionModel::ExpectedSamples();
        Contract.ExpectedFramesPerSecond =
            FShiCouncilWetRegisterInteractionModel::ExpectedFramesPerSecond();
        Contract.ExpectedDurationSeconds =
            FShiCouncilWetRegisterInteractionModel::ExpectedDurationSeconds();
        Contract.ContactAcquisitionCount = 1;
        Contract.ContactReleaseCount = 1;
        Contract.ContactAcquisitionSample = 30;
        Contract.OrderedReleasePhaseOnsetSample = 90;
        Contract.ContactReleaseSample = 91;
        Contract.MaximumObservedRootTranslationDriftCentimeters =
            FShiCouncilWetRegisterInteractionModel::AcceptedRootTranslationDriftCentimeters();
        Contract.MaximumObservedRootYawDriftDegrees =
            FShiCouncilWetRegisterInteractionModel::AcceptedRootYawDriftDegrees();
        Contract.MaximumObservedLeftSupportDriftCentimeters =
            FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportDriftCentimeters();
        Contract.MaximumObservedLeftSupportDriftDegrees =
            FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportDriftDegrees();
        Contract.MaximumObservedLeftSupportFloatingCentimeters =
            FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportFloatingCentimeters();
        Contract.MaximumObservedHandPenetrationCentimeters =
            FShiCouncilWetRegisterInteractionModel::AcceptedHandPenetrationCentimeters();
        Contract.MaximumObservedRightFloatingCentimeters =
            FShiCouncilWetRegisterInteractionModel::AcceptedRightFloatingCentimeters();
        Contract.bEngineeringBlockout = true;
        Contract.bDramaticReconstruction = true;
        Contract.bStageOwnedProp = true;
        Contract.bLeftHandOwnsPropForEntireClip = true;
        Contract.bRightContactSingleContinuousInterval = true;
        Contract.bReducedMotionSupported = true;
        Contract.bReducedMotionHeldCutParity = true;
        Contract.bDeterministic = true;
        Contract.bAllTransformsFinite = true;
        Contract.bSourceMeasurementReceiptBound = true;
        Contract.bNoNegativeScale = true;
        Contract.bNoIkStretch = true;
        Contract.bConservativeSourceMeshContactProxyPassed = true;
        Contract.bKeeperOwnsRegisterBeforeClip = true;
        Contract.bAssumesPriorOffscreenKeeperToChenHandoff = true;
        Contract.bTwoCharacterTransferDeferred = true;
        return Contract;
    }

    bool AssetMatches(const FShiCouncilWetRegisterAssetData& Actual,
        const FShiCouncilWetRegisterAssetData& Expected)
    {
        return Actual.AssetId == Expected.AssetId
            && Actual.AssetPath == Expected.AssetPath
            && Actual.AssetClass == Expected.AssetClass;
    }

    bool StateMatches(const FShiCouncilWetRegisterSemanticStateData& Actual,
        const FShiCouncilWetRegisterSemanticStateData& Expected)
    {
        return Actual.StateId == Expected.StateId
            && Actual.SourceFrame == Expected.SourceFrame
            && Actual.SampleIndex == Expected.SampleIndex
            && FMath::IsNearlyEqual(Actual.TimeSeconds, Expected.TimeSeconds, .0001f)
            && Actual.bLeftSupport == Expected.bLeftSupport
            && Actual.bRightContact == Expected.bRightContact
            && Actual.bRightReleasing == Expected.bRightReleasing;
    }

    bool IsFiniteVector(const FVector& Value)
    {
        return FMath::IsFinite(Value.X)
            && FMath::IsFinite(Value.Y)
            && FMath::IsFinite(Value.Z);
    }

    bool IsFiniteTransform(const FTransform& Value)
    {
        const FQuat Rotation = Value.GetRotation();
        return IsFiniteVector(Value.GetTranslation())
            && IsFiniteVector(Value.GetScale3D())
            && FMath::IsFinite(Rotation.X) && FMath::IsFinite(Rotation.Y)
            && FMath::IsFinite(Rotation.Z) && FMath::IsFinite(Rotation.W);
    }

    bool IsFiniteNonNegativeWithin(double Value, double Maximum)
    {
        return FMath::IsFinite(Value) && Value >= 0.f && Value <= Maximum;
    }

    int32 StateIndexForTime(float PlaybackSeconds)
    {
        // Semantic phases retain their exact authored whole-second boundaries.
        // The source pose must hold physical contact through t=3.0 and begin
        // continuous separation only after ordered-release has started.
        if (PlaybackSeconds >= FShiCouncilWetRegisterInteractionModel::ExpectedDurationSeconds())
        {
            return FShiCouncilWetRegisterInteractionModel::SemanticStateCount() - 1;
        }
        return FMath::Clamp(FMath::FloorToInt(PlaybackSeconds), 0,
            FShiCouncilWetRegisterInteractionModel::SemanticStateCount() - 2);
    }

    int32 ReducedPoseSampleForState(
        const FShiCouncilWetRegisterInteractionContractData& Contract,
        const FShiCouncilWetRegisterSemanticStateData& State)
    {
        // A reduced-motion cut for ordered-release must show the first measured
        // physical exit, not freeze forever on the still-contacting phase-onset
        // pose at sample 90. Semantic authority remains sample 90 / t=3.0.
        return State.bRightReleasing
            ? Contract.ContactReleaseSample : State.SampleIndex;
    }

    bool ValidateMeasuredBounds(double RootTranslation, double RootYaw,
        double LeftTranslation, double LeftRotation, double LeftFloating,
        double HandPenetration, double RightFloating, double MinimumArmScale,
        double MaximumArmScale)
    {
        return IsFiniteNonNegativeWithin(RootTranslation,
                FShiCouncilWetRegisterInteractionModel::RootTranslationToleranceCentimeters())
            && IsFiniteNonNegativeWithin(RootYaw,
                FShiCouncilWetRegisterInteractionModel::RootYawToleranceDegrees())
            && IsFiniteNonNegativeWithin(LeftTranslation,
                FShiCouncilWetRegisterInteractionModel::LeftSupportTranslationToleranceCentimeters())
            && IsFiniteNonNegativeWithin(LeftRotation,
                FShiCouncilWetRegisterInteractionModel::LeftSupportRotationToleranceDegrees())
            && IsFiniteNonNegativeWithin(LeftFloating,
                FShiCouncilWetRegisterInteractionModel::LeftSupportFloatingToleranceCentimeters())
            && IsFiniteNonNegativeWithin(HandPenetration,
                FShiCouncilWetRegisterInteractionModel::HandPenetrationToleranceCentimeters())
            && IsFiniteNonNegativeWithin(RightFloating,
                FShiCouncilWetRegisterInteractionModel::RightFloatingToleranceCentimeters())
            && FMath::IsFinite(MinimumArmScale) && FMath::IsFinite(MaximumArmScale)
            && MinimumArmScale == 1.0 && MaximumArmScale == 1.0;
    }

    bool MeasurementsMatchAccepted(double RootTranslation, double RootYaw,
        double LeftTranslation, double LeftRotation, double LeftFloating,
        double HandPenetration, double RightFloating, double MinimumArmScale,
        double MaximumArmScale)
    {
        return RootTranslation
                == FShiCouncilWetRegisterInteractionModel::AcceptedRootTranslationDriftCentimeters()
            && RootYaw
                == FShiCouncilWetRegisterInteractionModel::AcceptedRootYawDriftDegrees()
            && LeftTranslation
                == FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportDriftCentimeters()
            && LeftRotation
                == FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportDriftDegrees()
            && LeftFloating
                == FShiCouncilWetRegisterInteractionModel::AcceptedLeftSupportFloatingCentimeters()
            && HandPenetration
                == FShiCouncilWetRegisterInteractionModel::AcceptedHandPenetrationCentimeters()
            && RightFloating
                == FShiCouncilWetRegisterInteractionModel::AcceptedRightFloatingCentimeters()
            && MinimumArmScale == 1.0 && MaximumArmScale == 1.0;
    }
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalAssetId()
{
    return AssetId;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalReviewModeId()
{
    return ReviewModeId;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalNodeId()
{
    return NodeId;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalSpeakerCharacterId()
{
    return SpeakerCharacterId;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalParticipantSlotId()
{
    return ParticipantSlotId;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalIsolatedRootPath()
{
    return IsolatedRootPath;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalCharacterMeshPath()
{
    return CharacterMeshPath;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalSkeletonPath()
{
    return SkeletonPath;
}

const FString&
FShiCouncilWetRegisterInteractionModel::CanonicalSkeletonHierarchyAndBindSha256()
{
    return SkeletonHierarchyAndBindSha256;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalPropMeshPath()
{
    return PropMeshPath;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalPropMaterialPath()
{
    return PropMaterialPath;
}

const FString& FShiCouncilWetRegisterInteractionModel::CanonicalAnimationPath()
{
    return AnimationPath;
}

FName FShiCouncilWetRegisterInteractionModel::CanonicalPropOwnerBone()
{
    return PropOwnerBone;
}

FName FShiCouncilWetRegisterInteractionModel::CanonicalRightContactBone()
{
    return RightContactBone;
}

const TArray<FString>& FShiCouncilWetRegisterInteractionModel::CanonicalMarkerIds()
{
    return MarkerIds;
}

const TArray<FString>& FShiCouncilWetRegisterInteractionModel::CanonicalMarkerSocketNames()
{
    return MarkerSocketNames;
}

const TArray<FTransform>&
FShiCouncilWetRegisterInteractionModel::CanonicalMarkerLocalTransformsCentimeters()
{
    return MarkerLocalTransformsCentimeters;
}

const TArray<FString>& FShiCouncilWetRegisterInteractionModel::CanonicalSemanticStateIds()
{
    return SemanticStateIds;
}

bool FShiCouncilWetRegisterInteractionModel::TryGetMarkerLocalTransform(
    const FString& MarkerId, FTransform& OutLocalTransformCentimeters)
{
    const int32 Index = MarkerIds.IndexOfByKey(MarkerId);
    if (!MarkerLocalTransformsCentimeters.IsValidIndex(Index)) return false;
    OutLocalTransformCentimeters = MarkerLocalTransformsCentimeters[Index];
    return true;
}

bool FShiCouncilWetRegisterInteractionModel::BuildContract(
    FShiCouncilWetRegisterInteractionContractData& OutContract, FString& OutError)
{
    FShiCouncilWetRegisterInteractionContractData Candidate = MakeExpectedContract();
    if (!ValidateContract(Candidate, OutError)) return false;
    OutContract = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilWetRegisterInteractionModel::ValidateContract(
    const FShiCouncilWetRegisterInteractionContractData& Contract, FString& OutError)
{
    const FShiCouncilWetRegisterInteractionContractData Expected = MakeExpectedContract();
    if (Contract.AssetId != Expected.AssetId
        || Contract.ReviewModeId != Expected.ReviewModeId
        || Contract.NodeId != Expected.NodeId
        || Contract.SpeakerCharacterId != Expected.SpeakerCharacterId
        || Contract.ParticipantSlotId != Expected.ParticipantSlotId
        || Contract.IsolatedRootPath != Expected.IsolatedRootPath
        || Contract.CharacterMeshPath != Expected.CharacterMeshPath
        || Contract.SkeletonPath != Expected.SkeletonPath
        || Contract.SkeletonSourceName != Expected.SkeletonSourceName
        || Contract.SkeletonHierarchyAndBindSha256
            != Expected.SkeletonHierarchyAndBindSha256
        || Contract.HistoricalDisclosure != Expected.HistoricalDisclosure
        || Contract.ContactMeasurementScope != Expected.ContactMeasurementScope
        || Contract.SourceWatchedDecision != Expected.SourceWatchedDecision
        || Contract.CanonicalPlayerOwnershipContext
            != Expected.CanonicalPlayerOwnershipContext
        || Contract.StoryContinuityBoundary != Expected.StoryContinuityBoundary
        || Contract.PropOwnerBone != Expected.PropOwnerBone
        || Contract.RightContactBone != Expected.RightContactBone)
    {
        OutError = TEXT("Wet-register node, speaker, slot, review route, accepted mesh, Skeleton, watched decision, continuity or disclosure drifted.");
        return false;
    }
    if (Contract.AssetInventory.Num() != AssetInventoryCount())
    {
        OutError = TEXT("Wet-register interaction inventory must contain exactly one prop, one material and one clip.");
        return false;
    }
    for (int32 Index = 0; Index < Contract.AssetInventory.Num(); ++Index)
    {
        if (!Expected.AssetInventory.IsValidIndex(Index)
            || !AssetMatches(Contract.AssetInventory[Index], Expected.AssetInventory[Index]))
        {
            OutError = TEXT("Wet-register asset identity, class, path or canonical order drifted.");
            return false;
        }
    }
    if (Contract.MarkerIds != Expected.MarkerIds
        || Contract.MarkerSocketNames != Expected.MarkerSocketNames
        || Contract.MarkerLocalTransformsCentimeters.Num() != MarkerCount())
    {
        OutError = TEXT("Wet-register left-support, right-contact or camera marker/socket inventory drifted.");
        return false;
    }
    for (int32 Index = 0; Index < Contract.MarkerLocalTransformsCentimeters.Num(); ++Index)
    {
        const FTransform& Transform = Contract.MarkerLocalTransformsCentimeters[Index];
        if (!Expected.MarkerLocalTransformsCentimeters.IsValidIndex(Index)
            || !IsFiniteTransform(Transform)
            || !Transform.Equals(Expected.MarkerLocalTransformsCentimeters[Index], .0001f))
        {
            OutError = TEXT("Wet-register marker-local transform or canonical order drifted.");
            return false;
        }
    }
    if (Contract.SemanticStates.Num() != SemanticStateCount())
    {
        OutError = TEXT("Wet-register interaction must retain exactly five semantic states.");
        return false;
    }
    for (int32 Index = 0; Index < Contract.SemanticStates.Num(); ++Index)
    {
        if (!Expected.SemanticStates.IsValidIndex(Index)
            || !StateMatches(Contract.SemanticStates[Index], Expected.SemanticStates[Index]))
        {
            OutError = TEXT("Wet-register start/contact/hold/release/settle timing or contact semantics drifted.");
            return false;
        }
    }
    if (!IsFiniteVector(Contract.PropWorldDimensionsCentimeters)
        || !Contract.PropWorldDimensionsCentimeters.Equals(FVector(32.f, 14.f, 2.f), .0001f)
        || !IsFiniteVector(Contract.CharacterComponentScale)
        || !Contract.CharacterComponentScale.Equals(FVector(100.f), .0001f)
        || !IsFiniteVector(Contract.PropAttachmentRelativeScale)
        || !Contract.PropAttachmentRelativeScale.Equals(FVector(.01f), .000001f))
    {
        OutError = TEXT("Wet-register world envelope or explicit x100 attachment compensation drifted.");
        return false;
    }
    if (Contract.BoneCount != BoneCount()
        || Contract.ExpectedSamples != ExpectedSamples()
        || !FMath::IsNearlyEqual(Contract.ExpectedFramesPerSecond,
            ExpectedFramesPerSecond(), .0001f)
        || !FMath::IsNearlyEqual(Contract.ExpectedDurationSeconds,
            ExpectedDurationSeconds(), .0001f)
        || Contract.ContactAcquisitionCount != 1 || Contract.ContactReleaseCount != 1
        || Contract.ContactAcquisitionSample != 30
        || Contract.OrderedReleasePhaseOnsetSample != 90
        || Contract.ContactReleaseSample != 91)
    {
        OutError = TEXT("Wet-register shared rig, 121-sample clip or single contact/release event contract drifted.");
        return false;
    }
    if (!ValidateMeasuredBounds(
            Contract.MaximumObservedRootTranslationDriftCentimeters,
            Contract.MaximumObservedRootYawDriftDegrees,
            Contract.MaximumObservedLeftSupportDriftCentimeters,
            Contract.MaximumObservedLeftSupportDriftDegrees,
            Contract.MaximumObservedLeftSupportFloatingCentimeters,
            Contract.MaximumObservedHandPenetrationCentimeters,
            Contract.MaximumObservedRightFloatingCentimeters,
            Contract.MinimumObservedArmChainScale,
            Contract.MaximumObservedArmChainScale))
    {
        OutError = TEXT("Wet-register root, hand contact, penetration, float or arm-scale measurement is non-finite or outside tolerance.");
        return false;
    }
    if (!MeasurementsMatchAccepted(
            Contract.MaximumObservedRootTranslationDriftCentimeters,
            Contract.MaximumObservedRootYawDriftDegrees,
            Contract.MaximumObservedLeftSupportDriftCentimeters,
            Contract.MaximumObservedLeftSupportDriftDegrees,
            Contract.MaximumObservedLeftSupportFloatingCentimeters,
            Contract.MaximumObservedHandPenetrationCentimeters,
            Contract.MaximumObservedRightFloatingCentimeters,
            Contract.MinimumObservedArmChainScale,
            Contract.MaximumObservedArmChainScale))
    {
        OutError = TEXT("Wet-register accepted source measurement receipt drifted inside its outer tolerance.");
        return false;
    }
    if (!Contract.bEngineeringBlockout || !Contract.bDramaticReconstruction
        || !Contract.bStageOwnedProp || !Contract.bLeftHandOwnsPropForEntireClip
        || !Contract.bRightContactSingleContinuousInterval
        || !Contract.bReducedMotionSupported || !Contract.bReducedMotionHeldCutParity
        || !Contract.bDeterministic || !Contract.bAllTransformsFinite
        || !Contract.bSourceMeasurementReceiptBound
        || !Contract.bNoNegativeScale || !Contract.bNoIkStretch
        || Contract.bClipLooping || Contract.bRootMotion || Contract.bRandomized
        || Contract.bAudioDriven || Contract.bTranscriptDriven
        || Contract.bPhysicsDriven || Contract.bProceduralNoise
        || Contract.bPropReparentedDuringClip || Contract.bPropAttachedToCamera
        || Contract.bCollisionEnabled || Contract.bInteractionInputAuthority
        || Contract.bChoiceAuthority || Contract.bGameplayAuthority
        || Contract.bCampaignMutationAuthority || Contract.bSaveAuthority
        || Contract.bNavigationAuthority || Contract.bReplicated
        || Contract.bHistoricallyAuthenticatedObject
        || Contract.bHumanHistoricalCulturalReviewApproved
        || !Contract.bConservativeSourceMeshContactProxyPassed
        || Contract.bVisibleMeshContactReviewed
        || !Contract.bKeeperOwnsRegisterBeforeClip
        || !Contract.bAssumesPriorOffscreenKeeperToChenHandoff
        || Contract.bHandoffShown
        || Contract.bPlayerOwnershipContinuityApproved
        || Contract.bClipAloneCompletesStoryBeat
        || !Contract.bTwoCharacterTransferDeferred
        || Contract.bFinalStoryBeatApproved
        || Contract.bCloseCameraApproved || Contract.bFinalProp
        || Contract.bFinalHandAnimation)
    {
        OutError = TEXT("Wet-register blockout cannot loop, randomize, listen, simulate, collide, mutate, replicate, erase its offscreen handoff or claim historical/final approval.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilWetRegisterInteractionModel::Evaluate(
    const FShiCouncilWetRegisterInteractionFrameRequest& Request,
    FShiCouncilWetRegisterInteractionFrameData& OutFrame, FString& OutError)
{
    if (!ValidateContract(Request.Contract, OutError)) return false;
    if (!Request.bDevelopmentReviewAuthorized
        || Request.NodeId != Request.Contract.NodeId
        || Request.SpeakerCharacterId != Request.Contract.SpeakerCharacterId
        || Request.ParticipantSlotId != Request.Contract.ParticipantSlotId
        || Request.ReviewModeId != Request.Contract.ReviewModeId)
    {
        OutError = TEXT("Wet-register interaction is admitted only by its exact review flag at rain-order for Chen Sheng in the speaker slot.");
        return false;
    }
    if (!FMath::IsFinite(Request.ElapsedSeconds) || Request.ElapsedSeconds < 0.f)
    {
        OutError = TEXT("Wet-register interaction time must be finite and non-negative.");
        return false;
    }

    FShiCouncilWetRegisterInteractionFrameData Candidate;
    Candidate.AssetId = Request.Contract.AssetId;
    Candidate.RouteId = Request.ReviewModeId;
    Candidate.NodeId = Request.NodeId;
    Candidate.SpeakerCharacterId = Request.SpeakerCharacterId;
    Candidate.ParticipantSlotId = Request.ParticipantSlotId;
    Candidate.CharacterMeshPath = Request.Contract.CharacterMeshPath;
    Candidate.SkeletonPath = Request.Contract.SkeletonPath;
    Candidate.PropMeshPath = PropMeshPath;
    Candidate.PropMaterialPath = PropMaterialPath;
    Candidate.AnimationPath = AnimationPath;
    Candidate.PropWorldDimensionsCentimeters = Request.Contract.PropWorldDimensionsCentimeters;
    Candidate.CharacterComponentScale = Request.Contract.CharacterComponentScale;
    Candidate.PropAttachmentRelativeScale = Request.Contract.PropAttachmentRelativeScale;
    Candidate.RequestedSeconds = Request.ElapsedSeconds;
    Candidate.PlaybackSeconds = FMath::Min(Request.ElapsedSeconds, ExpectedDurationSeconds());
    Candidate.PlaybackSampleIndex = FMath::Clamp(
        FMath::RoundToInt(Candidate.PlaybackSeconds * ExpectedFramesPerSecond()),
        0, ExpectedSamples() - 1);
    Candidate.StateIndex = StateIndexForTime(Candidate.PlaybackSeconds);
    const FShiCouncilWetRegisterSemanticStateData& State =
        Request.Contract.SemanticStates[Candidate.StateIndex];
    Candidate.StateId = State.StateId;
    Candidate.SemanticSampleIndex = State.SampleIndex;
    const int32 ReducedPoseSample = ReducedPoseSampleForState(Request.Contract, State);
    Candidate.PoseSeconds = Request.bReducedMotion
        ? static_cast<float>(ReducedPoseSample) / ExpectedFramesPerSecond()
        : Candidate.PlaybackSeconds;
    Candidate.PoseSampleIndex = Request.bReducedMotion
        ? ReducedPoseSample : Candidate.PlaybackSampleIndex;
    Candidate.MaximumObservedRootTranslationDriftCentimeters =
        Request.Contract.MaximumObservedRootTranslationDriftCentimeters;
    Candidate.MaximumObservedRootYawDriftDegrees =
        Request.Contract.MaximumObservedRootYawDriftDegrees;
    Candidate.MaximumObservedLeftSupportDriftCentimeters =
        Request.Contract.MaximumObservedLeftSupportDriftCentimeters;
    Candidate.MaximumObservedLeftSupportDriftDegrees =
        Request.Contract.MaximumObservedLeftSupportDriftDegrees;
    Candidate.MaximumObservedLeftSupportFloatingCentimeters =
        Request.Contract.MaximumObservedLeftSupportFloatingCentimeters;
    Candidate.MaximumObservedHandPenetrationCentimeters =
        Request.Contract.MaximumObservedHandPenetrationCentimeters;
    Candidate.MaximumObservedRightFloatingCentimeters =
        Request.Contract.MaximumObservedRightFloatingCentimeters;
    Candidate.MinimumObservedArmChainScale = Request.Contract.MinimumObservedArmChainScale;
    Candidate.MaximumObservedArmChainScale = Request.Contract.MaximumObservedArmChainScale;
    Candidate.ContactAcquisitionCount = Request.Contract.ContactAcquisitionCount;
    Candidate.ContactReleaseCount = Request.Contract.ContactReleaseCount;
    Candidate.bDevelopmentReviewAuthorized = true;
    Candidate.bReducedMotion = Request.bReducedMotion;
    Candidate.bMotionSuppressed = Request.bReducedMotion;
    Candidate.bTerminalClamp = Request.ElapsedSeconds >= ExpectedDurationSeconds();
    Candidate.bLeftSupport = State.bLeftSupport;
    Candidate.bRightContact = State.bRightContact;
    Candidate.bRightReleasing = State.bRightReleasing;
    Candidate.bLeftHandOwnsProp = Request.Contract.bLeftHandOwnsPropForEntireClip;
    Candidate.bKeeperOwnsRegisterBeforeClip =
        Request.Contract.bKeeperOwnsRegisterBeforeClip;
    Candidate.bAssumesPriorOffscreenKeeperToChenHandoff =
        Request.Contract.bAssumesPriorOffscreenKeeperToChenHandoff;
    Candidate.bTwoCharacterTransferDeferred =
        Request.Contract.bTwoCharacterTransferDeferred;
    Candidate.bDeterministic = Request.Contract.bDeterministic;
    Candidate.bAllTransformsFinite = Request.Contract.bAllTransformsFinite;
    Candidate.bNoNegativeScale = Request.Contract.bNoNegativeScale;
    Candidate.bNoIkStretch = Request.Contract.bNoIkStretch;
    if (!ValidateFrame(Candidate, OutError)) return false;
    OutFrame = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilWetRegisterInteractionModel::ValidateFrame(
    const FShiCouncilWetRegisterInteractionFrameData& Frame, FString& OutError)
{
    if (Frame.AssetId != AssetId || Frame.RouteId != ReviewModeId
        || Frame.NodeId != NodeId || Frame.SpeakerCharacterId != SpeakerCharacterId
        || Frame.ParticipantSlotId != ParticipantSlotId
        || Frame.CharacterMeshPath != CharacterMeshPath || Frame.SkeletonPath != SkeletonPath
        || Frame.PropMeshPath != PropMeshPath || Frame.PropMaterialPath != PropMaterialPath
        || Frame.AnimationPath != AnimationPath || !Frame.bDevelopmentReviewAuthorized)
    {
        OutError = TEXT("Wet-register frame identity, review route or exact engine asset binding drifted.");
        return false;
    }
    if (!FMath::IsFinite(Frame.RequestedSeconds) || Frame.RequestedSeconds < 0.f
        || !FMath::IsFinite(Frame.PlaybackSeconds) || !FMath::IsFinite(Frame.PoseSeconds))
    {
        OutError = TEXT("Wet-register frame time is non-finite or negative.");
        return false;
    }
    const float ExpectedPlayback = FMath::Min(Frame.RequestedSeconds, ExpectedDurationSeconds());
    const int32 ExpectedPlaybackSample = FMath::Clamp(
        FMath::RoundToInt(ExpectedPlayback * ExpectedFramesPerSecond()),
        0, ExpectedSamples() - 1);
    const int32 ExpectedStateIndex = StateIndexForTime(ExpectedPlayback);
    const FShiCouncilWetRegisterInteractionContractData ExpectedContract = MakeExpectedContract();
    const FShiCouncilWetRegisterSemanticStateData& ExpectedState =
        ExpectedContract.SemanticStates[ExpectedStateIndex];
    const int32 ExpectedReducedPoseSample = ReducedPoseSampleForState(
        ExpectedContract, ExpectedState);
    const float ExpectedPoseSeconds = Frame.bReducedMotion
        ? static_cast<float>(ExpectedReducedPoseSample) / ExpectedFramesPerSecond()
        : ExpectedPlayback;
    const int32 ExpectedPoseSample = Frame.bReducedMotion
        ? ExpectedReducedPoseSample : ExpectedPlaybackSample;
    if (!FMath::IsNearlyEqual(Frame.PlaybackSeconds, ExpectedPlayback, .0001f)
        || !FMath::IsNearlyEqual(Frame.PoseSeconds, ExpectedPoseSeconds, .0001f)
        || Frame.PlaybackSampleIndex != ExpectedPlaybackSample
        || Frame.PoseSampleIndex != ExpectedPoseSample
        || Frame.SemanticSampleIndex != ExpectedState.SampleIndex
        || Frame.StateIndex != ExpectedStateIndex || Frame.StateId != ExpectedState.StateId
        || Frame.bLeftSupport != ExpectedState.bLeftSupport
        || Frame.bRightContact != ExpectedState.bRightContact
        || Frame.bRightReleasing != ExpectedState.bRightReleasing
        || Frame.bMotionSuppressed != Frame.bReducedMotion
        || Frame.bTerminalClamp != (Frame.RequestedSeconds >= ExpectedDurationSeconds()))
    {
        OutError = TEXT("Wet-register frame diverged from the clamped normal or reduced-motion five-state timeline.");
        return false;
    }
    if (!IsFiniteVector(Frame.PropWorldDimensionsCentimeters)
        || !Frame.PropWorldDimensionsCentimeters.Equals(FVector(32.f, 14.f, 2.f), .0001f)
        || !IsFiniteVector(Frame.CharacterComponentScale)
        || !Frame.CharacterComponentScale.Equals(FVector(100.f), .0001f)
        || !IsFiniteVector(Frame.PropAttachmentRelativeScale)
        || !Frame.PropAttachmentRelativeScale.Equals(FVector(.01f), .000001f)
        || !ValidateMeasuredBounds(
            Frame.MaximumObservedRootTranslationDriftCentimeters,
            Frame.MaximumObservedRootYawDriftDegrees,
            Frame.MaximumObservedLeftSupportDriftCentimeters,
            Frame.MaximumObservedLeftSupportDriftDegrees,
            Frame.MaximumObservedLeftSupportFloatingCentimeters,
            Frame.MaximumObservedHandPenetrationCentimeters,
            Frame.MaximumObservedRightFloatingCentimeters,
            Frame.MinimumObservedArmChainScale,
            Frame.MaximumObservedArmChainScale)
        || !MeasurementsMatchAccepted(
            Frame.MaximumObservedRootTranslationDriftCentimeters,
            Frame.MaximumObservedRootYawDriftDegrees,
            Frame.MaximumObservedLeftSupportDriftCentimeters,
            Frame.MaximumObservedLeftSupportDriftDegrees,
            Frame.MaximumObservedLeftSupportFloatingCentimeters,
            Frame.MaximumObservedHandPenetrationCentimeters,
            Frame.MaximumObservedRightFloatingCentimeters,
            Frame.MinimumObservedArmChainScale,
            Frame.MaximumObservedArmChainScale)
        || Frame.ContactAcquisitionCount != 1 || Frame.ContactReleaseCount != 1)
    {
        OutError = TEXT("Wet-register frame scale, dimensions, contact events or finite measured bounds drifted.");
        return false;
    }
    if (!Frame.bLeftHandOwnsProp
        || !Frame.bKeeperOwnsRegisterBeforeClip
        || !Frame.bAssumesPriorOffscreenKeeperToChenHandoff
        || Frame.bHandoffShown
        || Frame.bPlayerOwnershipContinuityApproved
        || Frame.bClipAloneCompletesStoryBeat
        || !Frame.bTwoCharacterTransferDeferred
        || Frame.bFinalStoryBeatApproved
        || !Frame.bDeterministic
        || !Frame.bAllTransformsFinite || !Frame.bNoNegativeScale || !Frame.bNoIkStretch
        || Frame.bCanLoop || Frame.bRandomized || Frame.bAudioDriven
        || Frame.bTranscriptDriven || Frame.bPhysicsDriven || Frame.bProceduralNoise
        || Frame.bCollisionEnabled || Frame.bInteractionInputAuthority
        || Frame.bChoiceAuthority || Frame.bGameplayAuthority
        || Frame.bCampaignMutationAuthority || Frame.bSaveAuthority
        || Frame.bNavigationAuthority || Frame.bReplicated)
    {
        OutError = TEXT("Wet-register frame cannot loop, randomize, listen, simulate, collide, erase its offscreen handoff or acquire story/campaign authority.");
        return false;
    }
    OutError.Empty();
    return true;
}
