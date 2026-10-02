#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShiJinyangFigure.generated.h"
class UStaticMeshComponent;
class UStaticMesh;
class UMaterialInterface;

/** Articulated motion blockout, not final character art or authenticated dress. */
UCLASS()
class SHI_API AShiJinyangFigure : public AActor
{
    GENERATED_BODY()
public:
    AShiJinyangFigure();
    void Initialize(UStaticMesh* Cube, UStaticMesh* Sphere, UStaticMesh* Cylinder,
        UMaterialInterface* Material, const FLinearColor& Color);
    void MoveAlong(const TArray<FVector>& Route, bool bCarry = false);
    void SetWorking(bool Working);
    void FinishMotion();
    bool IsMoving() const { return Waypoints.Num() > 0; }
    virtual void Tick(float DeltaSeconds) override;
private:
    UPROPERTY() TArray<TObjectPtr<UStaticMeshComponent>> Parts;
    TArray<FVector> Waypoints;
    bool bCarrying = false, bWorking = false;
    float Distance = 0.f, WorkTime = 0.f;
    void Pose();
    void Rod(int32 Index, const FVector& A, const FVector& B, float Width);
};
