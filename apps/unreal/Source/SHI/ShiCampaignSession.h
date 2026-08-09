#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignModel.h"

struct FShiDecisionRecord
{
    FString NodeId;
    FString ChoiceId;
    FString ConditionId;
    FString OppositionStageId;
    FString MethodId;
    FString MethodReadId;
    bool bMethodReadMatched = false;
    FString CommitmentId;
    FString CommitmentOutcomeId;
    TMap<FString, int32> Before;
    TMap<FString, int32> AfterChoice;
    TMap<FString, int32> CommitmentEffects;
    TMap<FString, int32> AfterCommitment;
    TMap<FString, int32> PressureEffects;
    TMap<FString, int32> AfterPressure;
    TMap<FString, int32> OppositionEffects;
    TMap<FString, int32> AfterOpposition;
    TMap<FString, int32> MethodReadEffects;
    TMap<FString, int32> AfterMethodRead;
    TMap<FString, int32> ConditionEffects;
    TMap<FString, int32> After;
};

struct FShiResolutionResult
{
    FShiDecisionRecord Record;
    const FShiNodeData* Node = nullptr;
    const FShiChoiceData* Choice = nullptr;
    const FShiFieldConditionData* Condition = nullptr;
    const FShiOppositionStageData* Opposition = nullptr;
    const FShiMethodReadData* MethodRead = nullptr;
    const FShiCommitmentData* Commitment = nullptr;
    const FShiCommitmentOutcomeData* CommitmentOutcome = nullptr;
};

class FShiCampaignSession
{
public:
    void Initialize(const FShiCampaignModel& InCampaign, uint32 InSeed);
    bool ResolveChoice(const FString& ChoiceId, FShiResolutionResult& OutResult, FString& OutError);
    bool CanChoose(const FShiChoiceData& Choice) const;
    bool ExportSaveJson(FString& OutJson, FString& OutError) const;
    bool ReplaySaveJson(const FShiCampaignModel& InCampaign, const FString& Json, FString& OutError);

    const FShiCampaignModel* GetCampaign() const { return Campaign; }
    const FShiNodeData* GetCurrentNode() const { return Campaign ? Campaign->FindNode(CurrentNodeId) : nullptr; }
    const TMap<FString, int32>& GetResources() const { return Resources; }
    const TArray<FShiDecisionRecord>& GetHistory() const { return History; }
    const TArray<FString>& GetFlags() const { return Flags; }
    const FString& GetCurrentNodeId() const { return CurrentNodeId; }
    const FString& GetActiveCommitmentId() const { return ActiveCommitmentId; }
    const FString& GetFailureReason() const { return FailureReason; }
    uint32 GetSeed() const { return Seed; }
    bool IsCompleted() const { return bCompleted; }
    const FShiFieldConditionData* GetCurrentFieldCondition() const;
    const FShiOppositionStageData* GetCurrentOppositionStage() const;
    const FShiMethodReadData* GetCurrentMethodRead() const;
    const FShiCommitmentData* GetActiveCommitment() const;

private:
    const FShiCampaignModel* Campaign = nullptr;
    uint32 Seed = 0;
    FString CurrentNodeId;
    FString ActiveCommitmentId;
    FString FailureReason;
    TMap<FString, int32> Resources;
    TArray<FString> Flags;
    TArray<FShiDecisionRecord> History;
    bool bCompleted = false;

    void ApplyEffects(const TMap<FString, int32>& Effects);
    const FShiFieldConditionData* SelectFieldCondition(const FShiNodeData& Node) const;
    const FShiOppositionStageData* SelectOppositionStage() const;
    const FShiMethodReadData* SelectMethodRead() const;
};
