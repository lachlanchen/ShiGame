#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShiCouncilStagingModel.h"
#include "ShiCouncilFigure.generated.h"

class UMaterialInstanceDynamic;
class UMaterialInterface;
class USceneComponent;
class UStaticMesh;
class UStaticMeshComponent;

UCLASS()
class SHI_API AShiCouncilFigure : public AActor
{
    GENERATED_BODY()

public:
    AShiCouncilFigure();
    bool InitializeFigure(UStaticMesh* Cylinder, UStaticMesh* Sphere, UStaticMesh* Cube,
        UMaterialInterface* BasicMaterial, FString& OutError);
    void ApplyParticipant(const FShiCouncilParticipantData& Participant);
    const FString& GetSlotId() const { return SlotId; }

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> FigureRoot;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Body;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Head;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Mantle;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> BodyMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> HeadMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> MantleMaterial;
    FString SlotId;
};
