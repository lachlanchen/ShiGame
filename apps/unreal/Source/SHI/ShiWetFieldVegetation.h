#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShiWetFieldVegetationPresentationModel.h"
#include "ShiWetFieldVegetation.generated.h"

class UHierarchicalInstancedStaticMeshComponent;

UCLASS()
class SHI_API AShiWetFieldVegetation : public AActor
{
    GENERATED_BODY()

public:
    AShiWetFieldVegetation();

    bool Initialize(const FShiWetFieldVegetationPresentationData& InPresentation, FString& OutError);
    int32 GetStalkInstanceCount() const;
    int32 GetTuftInstanceCount() const;
    bool IsPresentationReady() const { return bPresentationReady; }

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UHierarchicalInstancedStaticMeshComponent> StalkInstances;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UHierarchicalInstancedStaticMeshComponent> TuftInstances;

    FShiWetFieldVegetationPresentationData Presentation;
    bool bPresentationReady = false;
};
