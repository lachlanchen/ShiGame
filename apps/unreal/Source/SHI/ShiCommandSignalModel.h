#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignModel.h"

struct FShiCommandSignalData
{
    FString Id;
    FString Category;
    FString Label;
    FString State;
    FString Detail;
    FString MeshPath;
    int32 NumericValue = INDEX_NONE;
    bool bActive = true;
    FVector Location = FVector::ZeroVector;
    FVector Scale = FVector::OneVector;
    FRotator Rotation = FRotator::ZeroRotator;
    FLinearColor Color = FLinearColor::White;
    int32 StencilValue = 0;
};

class FShiCommandSignalModel
{
public:
    static bool Build(const TMap<FString, int32>& Resources, const FShiFieldConditionData* Field,
        const FShiOppositionStageData* Pursuit, const FShiMethodReadData* MethodRead,
        const FShiCommitmentData* Commitment, const FShiChoiceData* SelectedChoice, const FString& Locale,
        TArray<FShiCommandSignalData>& OutSignals, FString& OutError);
    static const FShiCommandSignalData* Find(const TArray<FShiCommandSignalData>& Signals, const FString& SignalId);
    static FString CycleSignal(const TArray<FShiCommandSignalData>& Signals, const FString& CurrentSignalId, int32 Direction);
    static FShiCommandSignalData SelectedStyle(const FShiCommandSignalData& Signal, bool bSelected);
    static FTransform CameraTransform(const FShiCommandSignalData& Signal);
    static bool Validate(const TArray<FShiCommandSignalData>& Signals, FString& OutError);
    static bool ValidateAgainstSites(const TArray<FShiCommandSignalData>& Signals, const TArray<FShiSiteData>& Sites, FString& OutError);
};
