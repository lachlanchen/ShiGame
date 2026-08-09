#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignSession.h"
#include "ShiCommandSignalModel.h"

struct FShiCinematicBeatData
{
    FString Id;
    FString Layer;
    FString Label;
    FString Detail;
    FString FocusKind;
    FString FocusId;
    float TransitionSeconds = 0.f;
    float HoldSeconds = 0.f;
};

class FShiCinematicBeatModel
{
public:
    static bool Build(const FShiResolutionResult& Resolution, const FShiCommitmentData* CurrentCommitment,
        const TMap<FString, int32>& FinalResources, const FShiSiteData* PositionSite, bool bCompleted,
        const FString& FailureReason, const TArray<FShiCommandSignalData>& Signals, const FString& Locale,
        TArray<FShiCinematicBeatData>& OutBeats, FString& OutError);
    static bool Validate(const TArray<FShiCinematicBeatData>& Beats, const TArray<FShiCommandSignalData>& Signals,
        const FShiSiteData* PositionSite, FString& OutError);
    static float TotalDuration(const TArray<FShiCinematicBeatData>& Beats);
};
