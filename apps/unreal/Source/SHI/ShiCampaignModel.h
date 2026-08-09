#pragma once

#include "CoreMinimal.h"

struct FShiLocalizedText
{
    TMap<FString, FString> Values;
    FString Resolve(const FString& Locale) const;
};

struct FShiActData
{
    FString Id;
    FShiLocalizedText Title;
    FShiLocalizedText Objective;
};

struct FShiChoiceData
{
    FString Id;
    FShiLocalizedText Label;
    FShiLocalizedText Intent;
    FShiLocalizedText Strategy;
    FShiLocalizedText Consequence;
    FString MethodId;
    TMap<FString, int32> Effects;
    TMap<FString, int32> Minimums;
    TMap<FString, int32> Maximums;
    TMap<FString, int32> PressureEffects;
    FShiLocalizedText PressureWarning;
    FShiLocalizedText PressureReveal;
    TArray<FString> Flags;
    FString Next;
};

struct FShiFieldConditionData
{
    FString Id;
    FShiLocalizedText Title;
    FShiLocalizedText Signal;
    int32 Weight = 0;
    TMap<FString, int32> Effects;
};

struct FShiNodeData
{
    FString Id;
    FString ActId;
    int32 TimeIndex = 0;
    FString SiteId;
    FShiLocalizedText DateLabel;
    FShiLocalizedText Title;
    FShiLocalizedText Context;
    FShiLocalizedText Dialogue;
    TArray<FShiFieldConditionData> Conditions;
    TArray<FShiChoiceData> Choices;
};

struct FShiSiteData
{
    FString Id;
    FShiLocalizedText Name;
};

struct FShiOppositionStageData
{
    FString Id;
    int32 MinDanger = 0;
    int32 MaxDanger = 0;
    FShiLocalizedText Title;
    FShiLocalizedText Forecast;
    FShiLocalizedText Response;
    FShiLocalizedText Counterplay;
    TMap<FString, int32> Effects;
};

struct FShiMethodReadData
{
    FString Id;
    FString TargetMethodId;
    FShiLocalizedText Title;
    FShiLocalizedText Forecast;
    FShiLocalizedText HitResponse;
    FShiLocalizedText MissResponse;
    TMap<FString, int32> Effects;
};

struct FShiCommitmentOutcomeData
{
    FString Id;
    FString ChoiceId;
    FString Status;
    FShiLocalizedText Response;
    TMap<FString, int32> Effects;
};

struct FShiCommitmentData
{
    FString Id;
    FString EstablishedByChoiceId;
    FShiLocalizedText Title;
    FShiLocalizedText Promise;
    TArray<FShiCommitmentOutcomeData> Outcomes;
};

class FShiCampaignModel
{
public:
    int32 SchemaVersion = 0;
    FString Id;
    FString StartNodeId;
    TMap<FString, int32> InitialResources;
    TArray<FShiActData> Acts;
    TArray<FShiNodeData> Nodes;
    TArray<FShiSiteData> Sites;
    TArray<FString> MethodIds;
    int32 MinimumMethodObservations = 0;
    FShiMethodReadData NeutralMethodRead;
    TArray<FShiMethodReadData> MethodReads;
    TArray<FShiOppositionStageData> OppositionStages;
    TArray<FShiCommitmentData> Commitments;

    bool LoadCanonical(FString& OutError);
    const FShiNodeData* FindNode(const FString& NodeId) const;
    const FShiActData* FindAct(const FString& ActId) const;
    const FShiSiteData* FindSite(const FString& SiteId) const;
    const FShiCommitmentData* FindEstablishedCommitment(const FString& ChoiceId) const;
    bool ValidateHorizon(FString& OutError) const;
};
