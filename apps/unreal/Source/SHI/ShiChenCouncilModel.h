#pragma once

#include "CoreMinimal.h"

struct FShiChenTurn
{
    FString ChoiceId;
    TMap<FString, int32> Before;
    TMap<FString, int32> After;
};

/** Deterministic shared council rules. No actor, presentation or disk authority. */
class FShiChenCouncilModel
{
public:
    bool Initialize(const FString& DefinitionJson, const FString& Arrival, FString& Error, const FString& EntryId = FString());
    bool ExportSaveJson(FString& Json, FString& Error) const;
    bool ReplaySaveJson(const FString& DefinitionJson, const FString& Arrival, const FString& EntryId,
        const FString& Json, FString& Error);
    bool Preview(const FString& ChoiceId, FShiChenTurn& Turn) const;
    bool Commit(const FString& ChoiceId);
    TArray<FString> GetChoices() const;
    const TMap<FString, int32>& GetMetrics() const { return Metrics; }
    const TArray<FShiChenTurn>& GetHistory() const { return History; }
    bool IsCompleted() const { return Rounds.Num() == 3 && History.Num() == Rounds.Num(); }
    FString GetOutcome() const;

private:
    struct FAnswer { FString AfterChoice; TMap<FString, int32> Effects; };
    struct FChoice
    {
        FString Id;
        TMap<FString, int32> Effects;
        TMap<FString, int32> Requires;
        TArray<FAnswer> Answers;
    };
    TArray<TArray<FChoice>> Rounds;
    TMap<FString, int32> Metrics;
    TArray<FShiChenTurn> History;
    FString DefinitionFingerprint;
    FString ArrivalId;
    FString ChronicleEntryId;
};
