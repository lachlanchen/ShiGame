#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShiRainPresentationModel.h"
#include "ShiRainField.generated.h"

class UInstancedStaticMeshComponent;

struct FShiRainStreakState
{
    FVector Position = FVector::ZeroVector;
    float WidthScale = 1.f;
    float LengthScale = 1.f;
    float SpeedScale = 1.f;
};

struct FShiRainRippleState
{
    FVector Position = FVector::ZeroVector;
    float AgeSeconds = 0.f;
    bool bActive = false;
};

UCLASS()
class SHI_API AShiRainField : public AActor
{
    GENERATED_BODY()

public:
    AShiRainField();
    virtual void Tick(float DeltaSeconds) override;

    bool Initialize(const FShiRainPresentationData& InPresentation, FString& OutError);
    int32 GetStreakInstanceCount() const;
    int32 GetRippleInstanceCount() const;
    bool IsPresentationReady() const { return bPresentationReady; }

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UInstancedStaticMeshComponent> StreakInstances;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UInstancedStaticMeshComponent> RippleInstances;

    FShiRainPresentationData Presentation;
    FRandomStream RandomStream;
    TArray<FShiRainStreakState> StreakStates;
    TArray<FShiRainRippleState> RippleStates;
    TArray<FTransform> StreakTransforms;
    TArray<FTransform> RippleTransforms;
    int32 NextRippleIndex = 0;
    bool bPresentationReady = false;

    void ResetStreak(int32 Index, bool bInitial);
    void ActivateRipple(const FVector2D& Position);
    FTransform BuildStreakTransform(const FShiRainStreakState& State) const;
    FTransform BuildRippleTransform(const FShiRainRippleState& State) const;
};
