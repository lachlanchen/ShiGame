#pragma once

#include "CoreMinimal.h"

class UAnimSequence;
class USkeleton;

struct FShiCouncilPerformanceData
{
    FString RoleId;
    FString AnimationPath;
    FString SkeletonPath;
    FString HistoricalDisclosure;
    int32 ExpectedSamples = 0;
    float ExpectedDurationSeconds = 0.f;
    float ExpectedFramesPerSecond = 0.f;
    bool bLooping = false;
    bool bBodyOnly = false;
    bool bSharedSkeleton = false;
    bool bRootMotion = false;
    bool bFacialPerformance = false;
    bool bInteractionAuthority = false;
    bool bGameplayAuthority = false;
    bool bSaveAuthority = false;
    bool bReplicated = false;
    bool bHistoricallyReconstructedEtiquette = false;
    bool bFinalPerformance = false;
    bool bWideAndMediumFramingOnly = true;
};

class FShiCouncilPerformancePresentationModel
{
public:
    static constexpr int32 ExpectedSamples() { return 121; }
    static constexpr float ExpectedDurationSeconds() { return 4.f; }
    static constexpr float ExpectedFramesPerSecond() { return 30.f; }

    static const TArray<FString>& CanonicalRoleIds();
    static bool Build(const FString& RoleId, FShiCouncilPerformanceData& OutPerformance,
        FString& OutError);
    static bool ForParticipant(bool bSpeaker, FShiCouncilPerformanceData& OutPerformance,
        FString& OutError);
    static bool Validate(const FShiCouncilPerformanceData& Performance, FString& OutError);
    static bool ValidateSequence(const FShiCouncilPerformanceData& Performance,
        const UAnimSequence& Sequence, const USkeleton& ExpectedSkeleton, FString& OutError);
};
