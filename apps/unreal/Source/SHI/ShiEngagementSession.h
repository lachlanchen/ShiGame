#pragma once

#include "CoreMinimal.h"
#include "ShiEngagementModel.h"

struct FShiEngagementCommandRecord
{
    FString PulseId;
    FString CommandId;
    TMap<FString, int32> Before;
    TMap<FString, int32> AfterCommand;
    FString ResponseId;
    TMap<FString, int32> AfterResponse;
};

class FShiEngagementSession
{
public:
    bool Initialize(const FShiEngagementModel& InModel, const FString& InPlanId, const FString& InConditionId, FString& OutError);
    void AvailableCommands(TArray<const FShiEngagementCommandData*>& OutCommands, FString& OutError) const;
    bool ResolveCommand(const FString& CommandId, FShiEngagementCommandRecord& OutRecord, FString& OutError);
    bool ExportSaveJson(FString& OutJson, FString& OutError) const;
    bool ReplaySaveJson(const FShiEngagementModel& InModel, const FString& Json, FString& OutError);

    const FShiEngagementModel* GetModel() const { return Model; }
    const FString& GetPlanId() const { return PlanId; }
    const FString& GetConditionId() const { return ConditionId; }
    int32 GetPulseIndex() const { return PulseIndex; }
    const TMap<FString, int32>& GetMetrics() const { return Metrics; }
    const TArray<FShiEngagementCommandRecord>& GetHistory() const { return History; }
    bool IsCompleted() const { return bCompleted; }
    const FString& GetOutcomeId() const { return OutcomeId; }
    const TMap<FString, int32>& GetCampaignEffects() const { return CampaignEffects; }

private:
    const FShiEngagementModel* Model = nullptr;
    FString PlanId;
    FString ConditionId;
    int32 PulseIndex = 0;
    TMap<FString, int32> Metrics;
    TArray<FShiEngagementCommandRecord> History;
    bool bCompleted = false;
    FString OutcomeId;
    TMap<FString, int32> CampaignEffects;

    static TMap<FString, int32> ApplyMetricEffects(const TMap<FString, int32>& Values, const TMap<FString, int32>& Effects);
    static bool SameIntegerMap(const TMap<FString, int32>& First, const TMap<FString, int32>& Second);
    static bool SameRecord(const FShiEngagementCommandRecord& First, const FShiEngagementCommandRecord& Second);
};
