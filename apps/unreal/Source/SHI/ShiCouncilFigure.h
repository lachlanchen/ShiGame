#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShiCouncilStagingModel.h"
#include "ShiCouncilFigure.generated.h"

class UMaterialInstanceDynamic;
class UMaterialInterface;
class USceneComponent;
class UAnimSequence;
class USkeletalMesh;
class USkeletalMeshComponent;
class UStaticMesh;
class UStaticMeshComponent;

UCLASS()
class SHI_API AShiCouncilFigure : public AActor
{
    GENERATED_BODY()

public:
    AShiCouncilFigure();
    virtual void Tick(float DeltaSeconds) override;
    bool InitializeFigure(UStaticMesh* Cylinder, UStaticMesh* Sphere, UStaticMesh* Cube,
        UMaterialInterface* BasicMaterial, FString& OutError);
    void ApplyParticipant(const FShiCouncilParticipantData& Participant);
    void SetReducedMotion(bool bValue);
    void SetReviewVisible(bool bVisible);
    const FString& GetSlotId() const { return SlotId; }
    const FString& GetCharacterId() const { return CharacterId; }
    bool IsUsingSkeletalPresentation() const { return bUsingSkeletalPresentation; }
    bool IsUsingPerformance() const { return bUsingPerformance; }
    bool IsUsingFacialPerformance() const { return bUsingFacialPerformance; }
    bool IsReducedMotion() const { return bReducedMotion; }
    const FString& GetPerformanceRoleId() const { return PerformanceRoleId; }

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> FigureRoot;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Body;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Head;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Mantle;
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USkeletalMeshComponent> CharacterMesh;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> BodyMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> HeadMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInstanceDynamic> MantleMaterial;
    UPROPERTY(Transient)
    TMap<FString, TObjectPtr<USkeletalMesh>> CharacterMeshes;
    UPROPERTY(Transient)
    TMap<FString, TObjectPtr<USkeletalMesh>> FacialCharacterMeshes;
    UPROPERTY(Transient)
    TMap<FString, TObjectPtr<UAnimSequence>> PerformanceClips;
    FString SlotId;
    FString CharacterId;
    FString PerformanceRoleId;
    bool bUsingSkeletalPresentation = false;
    bool bUsingPerformance = false;
    bool bUsingFacialPerformance = false;
    bool bParticipantSpeaker = false;
    bool bReducedMotion = false;
    bool bReviewVisible = true;
    bool bLoggedMorphSectionExercise = false;
    float FacialElapsedSeconds = 0.f;

    void ApplyFacialFrame();
    void ClearFacialFrame();
    void RefreshActorTick();
};
