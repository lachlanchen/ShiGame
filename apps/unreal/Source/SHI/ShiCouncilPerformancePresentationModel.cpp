#include "ShiCouncilPerformancePresentationModel.h"

#include "Animation/AnimSequence.h"
#include "Animation/Skeleton.h"

namespace
{
    const TCHAR* SharedSkeletonPath = TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton");
    const TCHAR* Disclosure = TEXT("BODY-ONLY SHARED-SKELETON COUNCIL PERFORMANCE BLOCKOUT · GENERIC MEASURED GESTURE · NOT RECONSTRUCTED 209 BCE ETIQUETTE OR FINAL ACTING");
    const TArray<FString> RoleIds = {TEXT("attentive-idle"), TEXT("speaker-measured")};

    struct FContract
    {
        const TCHAR* RoleId;
        const TCHAR* AnimationName;
    };

    const TArray<FContract> Contracts = {
        {TEXT("attentive-idle"), TEXT("AN_SHI_DazeCouncil_AttentiveIdle_01")},
        {TEXT("speaker-measured"), TEXT("AN_SHI_DazeCouncil_SpeakerMeasured_01")},
    };

    const FContract* FindContract(const FString& RoleId)
    {
        return Contracts.FindByPredicate([&](const FContract& Contract)
        {
            return RoleId == Contract.RoleId;
        });
    }

    FString AnimationPath(const FContract& Contract)
    {
        return FString::Printf(
            TEXT("/Game/SHI/Art/Characters/DazeCouncil/Performance/%s.%s"),
            Contract.AnimationName, Contract.AnimationName);
    }
}

const TArray<FString>& FShiCouncilPerformancePresentationModel::CanonicalRoleIds()
{
    return RoleIds;
}

bool FShiCouncilPerformancePresentationModel::Build(const FString& RoleId,
    FShiCouncilPerformanceData& OutPerformance, FString& OutError)
{
    const FContract* Contract = FindContract(RoleId);
    if (!Contract)
    {
        OutError = FString::Printf(TEXT("Unknown Daze council performance role: %s."), *RoleId);
        return false;
    }

    FShiCouncilPerformanceData Candidate;
    Candidate.RoleId = RoleId;
    Candidate.AnimationPath = AnimationPath(*Contract);
    Candidate.SkeletonPath = SharedSkeletonPath;
    Candidate.HistoricalDisclosure = Disclosure;
    Candidate.ExpectedSamples = ExpectedSamples();
    Candidate.ExpectedDurationSeconds = ExpectedDurationSeconds();
    Candidate.ExpectedFramesPerSecond = ExpectedFramesPerSecond();
    Candidate.bLooping = true;
    Candidate.bBodyOnly = true;
    Candidate.bSharedSkeleton = true;
    if (!Validate(Candidate, OutError)) return false;
    OutPerformance = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilPerformancePresentationModel::ForParticipant(bool bSpeaker,
    FShiCouncilPerformanceData& OutPerformance, FString& OutError)
{
    return Build(bSpeaker ? TEXT("speaker-measured") : TEXT("attentive-idle"),
        OutPerformance, OutError);
}

bool FShiCouncilPerformancePresentationModel::Validate(
    const FShiCouncilPerformanceData& Performance, FString& OutError)
{
    const FContract* Contract = FindContract(Performance.RoleId);
    if (!Contract || Performance.AnimationPath != AnimationPath(*Contract)
        || Performance.SkeletonPath != SharedSkeletonPath
        || Performance.HistoricalDisclosure != Disclosure)
    {
        OutError = TEXT("Council performance identity, animation, Skeleton or disclosure drifted from admission.");
        return false;
    }
    if (Performance.ExpectedSamples != ExpectedSamples()
        || !FMath::IsNearlyEqual(Performance.ExpectedDurationSeconds, ExpectedDurationSeconds(), .0001f)
        || !FMath::IsNearlyEqual(Performance.ExpectedFramesPerSecond, ExpectedFramesPerSecond(), .0001f)
        || !Performance.bLooping || !Performance.bBodyOnly || !Performance.bSharedSkeleton)
    {
        OutError = TEXT("Council performance duration, sample rate, loop, body-only or shared-skeleton contract drifted.");
        return false;
    }
    if (Performance.bRootMotion || Performance.bFacialPerformance
        || Performance.bInteractionAuthority || Performance.bGameplayAuthority
        || Performance.bSaveAuthority || Performance.bReplicated
        || Performance.bHistoricallyReconstructedEtiquette || Performance.bFinalPerformance
        || !Performance.bWideAndMediumFramingOnly)
    {
        OutError = TEXT("Council body performance cannot claim face, history, final art, root motion or gameplay authority.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilPerformancePresentationModel::ValidateSequence(
    const FShiCouncilPerformanceData& Performance, const UAnimSequence& Sequence,
    const USkeleton& ExpectedSkeleton, FString& OutError)
{
    if (!Validate(Performance, OutError)) return false;
    if (Sequence.GetPathName() != Performance.AnimationPath
        || ExpectedSkeleton.GetPathName() != Performance.SkeletonPath
        || Sequence.GetSkeleton() != &ExpectedSkeleton)
    {
        OutError = TEXT("Council performance animation identity or shared Skeleton binding is incorrect.");
        return false;
    }
    if (Sequence.GetNumberOfSampledKeys() != Performance.ExpectedSamples
        || !FMath::IsNearlyEqual(Sequence.GetPlayLength(), Performance.ExpectedDurationSeconds, .0001f)
        || !FMath::IsNearlyEqual(
            static_cast<float>(Sequence.GetSamplingFrameRate().AsDecimal()),
            Performance.ExpectedFramesPerSecond, .0001f))
    {
        OutError = TEXT("Council performance sampled keys, duration or target frame rate drifted from admission.");
        return false;
    }
    if (Sequence.HasRootMotion() || Sequence.IsValidAdditive())
    {
        OutError = TEXT("Council performance unexpectedly acquired root-motion or additive authority.");
        return false;
    }
    OutError.Empty();
    return true;
}
