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
    void SetSkinLookdevReviewEnabled(bool bEnabled);
    void SetWetRegisterInteractionReviewEnabled(bool bEnabled, const FString& NodeId);
    void ApplyParticipant(const FShiCouncilParticipantData& Participant);
    void SetReducedMotion(bool bValue);
    void SetReviewVisible(bool bVisible);
    const FString& GetSlotId() const { return SlotId; }
    const FString& GetCharacterId() const { return CharacterId; }
    bool IsUsingSkeletalPresentation() const { return bUsingSkeletalPresentation; }
    bool IsUsingPerformance() const { return bUsingPerformance; }
    bool IsUsingFacialPerformance() const { return bUsingFacialPerformance; }
    bool IsUsingSkinLookdev() const { return bUsingSkinLookdev; }
    bool IsUsingWetRegisterInteraction() const { return bUsingWetRegisterInteraction; }
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
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> WetRegisterProp;
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
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInterface> SkinLookdevMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInterface> SkinLookdevBaselineMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UStaticMesh> WetRegisterMesh;
    UPROPERTY(Transient)
    TObjectPtr<UMaterialInterface> WetRegisterMaterial;
    UPROPERTY(Transient)
    TObjectPtr<UAnimSequence> WetRegisterInteractionClip;
    FString SlotId;
    FString CharacterId;
    FString PerformanceRoleId;
    FString WetRegisterNodeId;
    FString WetRegisterStateId;
    bool bUsingSkeletalPresentation = false;
    bool bUsingPerformance = false;
    bool bUsingFacialPerformance = false;
    bool bSkinLookdevReviewEnabled = false;
    bool bSkinLookdevInventoryReady = false;
    bool bUsingSkinLookdev = false;
    bool bWetRegisterInteractionReviewEnabled = false;
    bool bWetRegisterInteractionInventoryReady = false;
    bool bUsingWetRegisterInteraction = false;
    bool bParticipantSpeaker = false;
    bool bReducedMotion = false;
    bool bReviewVisible = true;
    bool bLoggedMorphSectionExercise = false;
    bool bLoggedSkinLookdevAdmission = false;
    bool bLoggedWetRegisterAdmission = false;
    bool bLoggedWetRegisterBilateralContact = false;
    bool bLoggedWetRegisterHeldQuestion = false;
    bool bLoggedWetRegisterOrderedRelease = false;
    bool bLoggedWetRegisterTerminalClamp = false;
    int32 SkinLookdevMaterialIndex = INDEX_NONE;
    float FacialElapsedSeconds = 0.f;
    float WetRegisterElapsedSeconds = 0.f;

    void ApplyFacialFrame();
    bool LoadSkinLookdevInventory(FString& OutError);
    bool LoadWetRegisterInteractionInventory(FString& OutError);
    void ApplySkinLookdevFrame();
    bool ActivateWetRegisterInteraction(const FShiCouncilParticipantData& Participant,
        FString& OutError);
    void ApplyWetRegisterInteractionFrame();
    void ClearWetRegisterInteraction();
    bool RestoreSkinLookdevBaseline();
    void UseSkinLookdevPrimitiveFallback();
    void ClearSkinLookdevPresentationState();
    void ClearFacialFrame();
    void RefreshActorTick();
};
