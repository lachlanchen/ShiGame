#pragma once

#include "CoreMinimal.h"

struct FShiEngagementSignalData
{
    FString MetricId;
    FString Label;
    int32 Value = 0;
    FString MeshPath;
    FVector Location = FVector::ZeroVector;
    FVector Scale = FVector::OneVector;
    FLinearColor Color = FLinearColor::White;
    int32 StencilValue = 0;
};

class FShiEngagementSignalModel
{
public:
    static bool Build(const TMap<FString, int32>& Metrics, TArray<FShiEngagementSignalData>& OutSignals, FString& OutError);
    static bool Validate(const TArray<FShiEngagementSignalData>& Signals, FString& OutError);
    static FTransform CameraTransform();
};
