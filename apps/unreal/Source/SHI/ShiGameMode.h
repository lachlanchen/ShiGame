#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ShiCampaignModel.h"
#include "ShiCampaignSession.h"
#include "ShiGameMode.generated.h"

class SShiCommandScreen;
class ACameraActor;
class APlayerController;
class AStaticMeshActor;
class UShiSoundscapeComponent;

UCLASS()
class SHI_API AShiGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AShiGameMode();
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
    virtual void Tick(float DeltaSeconds) override;

    const FShiCampaignModel& GetCampaign() const { return Campaign; }
    const FShiNodeData* GetCurrentNode() const { return Session.GetCurrentNode(); }
    const TMap<FString, int32>& GetResources() const { return Session.GetResources(); }
    int32 GetSelectedChoiceIndex() const { return SelectedChoiceIndex; }
    const FString& GetLocale() const { return Locale; }
    const FString& GetLastConsequence() const { return LastConsequence; }
    const FString& GetActiveCommitmentId() const { return Session.GetActiveCommitmentId(); }
    const FString& GetLoadError() const { return LoadError; }
    const FString& GetSaveStatus() const { return SaveStatus; }
    const FString& GetFailureReason() const { return Session.GetFailureReason(); }
    const FString& GetAudioStatus() const { return AudioStatus; }
    int32 GetDecisionCount() const { return Session.GetHistory().Num(); }
    bool IsCompleted() const { return Session.IsCompleted(); }
    bool IsRestartArmed() const { return bRestartArmed; }
    bool IsEvidenceOpen() const { return bEvidenceOpen; }
    bool IsAudioReady() const;
    bool IsSoundEnabled() const;
    bool IsSoundPreferred() const;
    float GetAmbienceLevel() const;
    float GetEffectsLevel() const;
    bool CanChoose(const FShiChoiceData& Choice) const { return Session.CanChoose(Choice); }
    const FShiFieldConditionData* GetCurrentFieldCondition() const { return Session.GetCurrentFieldCondition(); }
    const FShiOppositionStageData* GetCurrentOppositionStage() const { return Session.GetCurrentOppositionStage(); }
    const FShiMethodReadData* GetCurrentMethodRead() const { return Session.GetCurrentMethodRead(); }
    const FShiCommitmentData* GetActiveCommitment() const { return Session.GetActiveCommitment(); }
    const FShiSiteData* GetInspectedSite() const;
    bool IsInspectingRemoteSite() const;

    void SelectChoice(int32 Index);
    void CycleChoice(int32 Direction);
    void CycleInspectedSite(int32 Direction);
    void ResetInspectedSite();
    void IssueSelectedOrder();
    void RequestNewChronicle();
    void ToggleEvidence();
    void ToggleSound();
    void AdjustAmbience(int32 Direction);
    void AdjustEffects(int32 Direction);

private:
    FShiCampaignModel Campaign;
    FShiCampaignSession Session;
    FString Locale = TEXT("en");
    FString LastConsequence;
    FString LoadError;
    FString SaveStatus;
    FString AudioStatus;
    int32 SelectedChoiceIndex = 0;
    static constexpr uint32 CampaignSeed = 0x5EED2026u;
    bool bPersistenceEnabled = true;
    bool bRestartArmed = false;
    bool bEvidenceOpen = false;
    FString InspectedSiteId;
    double LastOrderIssueTime = -1000.0;
    TSharedPtr<SShiCommandScreen> CommandScreen;
    UPROPERTY(Transient)
    TObjectPtr<UShiSoundscapeComponent> AudioDirector;
    TWeakObjectPtr<ACameraActor> CommandCamera;
    TMap<FString, TWeakObjectPtr<AStaticMeshActor>> SiteMarkers;
    FVector CameraBaseLocation;
    FRotator CameraBaseRotation;
    FVector CameraTransitionStartLocation;
    FRotator CameraTransitionStartRotation;
    FVector CameraTransitionTargetLocation;
    FRotator CameraTransitionTargetRotation;
    float CameraTransitionElapsed = 0.f;
    float CameraTransitionDuration = 0.f;
    float CameraBeatElapsed = 0.f;
    float CameraBeatDuration = 0.f;

    void CreateCommandSpace();
    void CreateSoundscape();
    void RefreshScreen();
    void BeginCameraBeat();
    void BeginCameraTransition(const FTransform& Target, float Duration);
    void TickCamera(float DeltaSeconds);
    void InspectSite(const FString& SiteId, bool bImmediate = false, bool bPlayCue = true);
    bool InspectSiteUnderCursor(APlayerController& Controller);
    void UpdateWartableSelection();
    void SelectFirstAvailableChoice();
    void ResumeSoundFromGesture();
    FString GetSavePath() const;
    bool RestoreChronicle(FString& OutError);
    bool SaveChronicle(FString& OutError) const;
};
