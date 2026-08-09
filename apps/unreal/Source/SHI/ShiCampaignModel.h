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

struct FShiCharacterData
{
    FString Id;
    FShiLocalizedText Name;
    FShiLocalizedText Role;
    bool bHistorical = false;
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
    FString SpeakerId;
    int32 TimeIndex = 0;
    FString SiteId;
    FShiLocalizedText DateLabel;
    FShiLocalizedText Title;
    FShiLocalizedText Context;
    FShiLocalizedText Dialogue;
    TArray<FString> SourceRefs;
    TArray<FString> ClaimRefs;
    TArray<FShiFieldConditionData> Conditions;
    TArray<FShiChoiceData> Choices;
};

struct FShiSiteData
{
    FString Id;
    FShiLocalizedText Name;
    float X = 0.f;
    float Z = 0.f;
    FString Status;
    FShiLocalizedText Summary;
    FShiLocalizedText Uncertainty;
    TArray<FString> SourceRefs;
    TArray<FString> ClaimRefs;
};

struct FShiEditionData
{
    FString Id;
    FString SourceUrl;
    FString RightsStatus;
};

struct FShiSourceData
{
    FString Id;
    FString EditionId;
    FString Work;
    FString Section;
    FString Locator;
    FString Url;
    FString Author;
    FString Date;
    FShiLocalizedText Note;
    FString ClaimStatus;
    FString RightsStatus;
};

struct FShiClaimData
{
    FString Id;
    FString Kind;
    FShiLocalizedText Statement;
    TArray<FString> SourceRefs;
    FString ReviewStatus;
    FString Confidence;
    FShiLocalizedText Uncertainty;
    FShiLocalizedText GameUse;
    FString Reviewer;
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
    TArray<FShiCharacterData> Characters;
    TArray<FShiNodeData> Nodes;
    TArray<FShiSiteData> Sites;
    TArray<FShiEditionData> Editions;
    TArray<FShiSourceData> Sources;
    TArray<FShiClaimData> Claims;
    TArray<FString> MethodIds;
    int32 MinimumMethodObservations = 0;
    FShiMethodReadData NeutralMethodRead;
    TArray<FShiMethodReadData> MethodReads;
    TArray<FShiOppositionStageData> OppositionStages;
    TArray<FShiCommitmentData> Commitments;

    bool LoadCanonical(FString& OutError);
    const FShiNodeData* FindNode(const FString& NodeId) const;
    const FShiActData* FindAct(const FString& ActId) const;
    const FShiCharacterData* FindCharacter(const FString& CharacterId) const;
    const FShiSiteData* FindSite(const FString& SiteId) const;
    const FShiEditionData* FindEdition(const FString& EditionId) const;
    const FShiSourceData* FindSource(const FString& SourceId) const;
    const FShiClaimData* FindClaim(const FString& ClaimId) const;
    const FShiCommitmentData* FindEstablishedCommitment(const FString& ChoiceId) const;
    bool ValidateEvidence(FString& OutError) const;
    bool ValidateHorizon(FString& OutError) const;
};
