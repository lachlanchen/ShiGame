#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignSession.h"
#include "ShiCinematicBeatModel.h"
#include "ShiCommandSignalModel.h"

struct FShiOrderTransactionData
{
    FShiCampaignSession Session;
    FShiResolutionResult Resolution;
    TArray<FShiCommandSignalData> CommandSignals;
    TArray<FShiCinematicBeatData> CinematicBeats;
    int32 SelectedChoiceIndex = INDEX_NONE;
};

class FShiOrderTransactionModel
{
public:
    static bool BuildTurnSnapshot(const FShiCampaignSession& Session, const FShiCampaignModel& Campaign,
        const FString& Locale, int32& OutSelectedChoiceIndex, TArray<FShiCommandSignalData>& OutSignals, FString& OutError);
    static bool Build(const FShiCampaignSession& CurrentSession, const FShiCampaignModel& Campaign,
        const FString& ChoiceId, const FString& Locale, FShiOrderTransactionData& OutTransaction, FString& OutError);
    static bool Validate(const FShiCampaignSession& CurrentSession, const FShiCampaignModel& Campaign,
        const FString& ChoiceId, const FString& Locale, const FShiOrderTransactionData& Transaction, FString& OutError);
};
