#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignModel.h"

struct FShiEngagementRequirements
{
    TMap<FString, int32> Minimums;
    TMap<FString, int32> Maximums;
};

struct FShiEngagementConditionData
{
    FString Id;
    FShiLocalizedText Title;
    FShiLocalizedText Signal;
    TMap<FString, int32> LocalEffects;
};

struct FShiEngagementPlanData
{
    FString Id;
    FShiLocalizedText Title;
    FShiLocalizedText MainEffort;
    FShiLocalizedText WithdrawalCondition;
    TMap<FString, int32> InitialEffects;
    TMap<FString, int32> CampaignEffects;
    TMap<FString, TArray<FString>> AllowedCommands;
};

struct FShiEngagementResponseData
{
    FString Id;
    FString Kind;
    FShiLocalizedText Reveal;
    TMap<FString, int32> Effects;
};

struct FShiEngagementCommandData
{
    FString Id;
    FString PulseId;
    FString Order;
    FShiLocalizedText Title;
    FShiLocalizedText Intent;
    TMap<FString, int32> Effects;
    FShiEngagementRequirements Requirements;
    FShiEngagementResponseData Response;
};

struct FShiEngagementPulseData
{
    FString Id;
    FShiLocalizedText Title;
    FShiLocalizedText Objective;
    TArray<FString> CommandIds;
};

struct FShiEngagementOutcomeData
{
    FString Id;
    FString Status;
    FShiLocalizedText Title;
    FShiLocalizedText Summary;
    FShiEngagementRequirements Requirements;
    TMap<FString, int32> CampaignEffects;
};

class FShiEngagementModel
{
public:
    int32 SchemaVersion = 0;
    FString Id;
    FString CampaignId;
    FString NodeId;
    FString DeliveryStatus;
    FString ClaimStatus;
    FShiLocalizedText Title;
    FShiLocalizedText Objective;
    TArray<FString> SourceRefs;
    TArray<FString> ClaimRefs;
    TArray<FString> Metrics;
    TMap<FString, int32> InitialMetrics;
    TArray<FShiEngagementConditionData> Conditions;
    TArray<FShiEngagementPlanData> Plans;
    TArray<FShiEngagementPulseData> Pulses;
    TArray<FShiEngagementCommandData> Commands;
    TArray<FShiEngagementOutcomeData> Outcomes;

    bool LoadCanonical(const FShiCampaignModel& Campaign, FString& OutError);
    bool Validate(const FShiCampaignModel& Campaign, FString& OutError) const;
    const FShiEngagementConditionData* FindCondition(const FString& ConditionId) const;
    const FShiEngagementPlanData* FindPlan(const FString& PlanId) const;
    const FShiEngagementPulseData* FindPulse(const FString& PulseId) const;
    const FShiEngagementCommandData* FindCommand(const FString& CommandId) const;
    const FShiEngagementOutcomeData* FindOutcome(const FString& OutcomeId) const;

    static const TArray<FString>& MetricKeys();
    static const TArray<FString>& CampaignResourceKeys();
    static bool MeetsRequirements(const TMap<FString, int32>& Values, const FShiEngagementRequirements& Requirements);
};
