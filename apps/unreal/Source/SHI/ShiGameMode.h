#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ShiCampaignModel.h"
#include "ShiCampaignSession.h"
#include "ShiCinematicBeatModel.h"
#include "ShiCommandSignalModel.h"
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
    bool IsReducedMotion() const { return bReducedMotion; }
    bool CanChoose(const FShiChoiceData& Choice) const { return Session.CanChoose(Choice); }
    const FShiFieldConditionData* GetCurrentFieldCondition() const { return Session.GetCurrentFieldCondition(); }
    const FShiOppositionStageData* GetCurrentOppositionStage() const { return Session.GetCurrentOppositionStage(); }
    const FShiMethodReadData* GetCurrentMethodRead() const { return Session.GetCurrentMethodRead(); }
    const FShiCommitmentData* GetActiveCommitment() const { return Session.GetActiveCommitment(); }
    const FShiSiteData* GetInspectedSite() const;
    const FShiCommandSignalData* GetInspectedCommandSignal() const;
    const FShiCinematicBeatData* GetActiveCinematicBeat() const;
    int32 GetCinematicBeatIndex() const { return CinematicBeatIndex; }
    int32 GetCinematicBeatCount() const { return CinematicBeats.Num(); }
    bool IsCinematicSequenceActive() const { return CinematicBeats.IsValidIndex(CinematicBeatIndex); }
    bool IsInspectingRemoteSite() const;

    void SelectChoice(int32 Index);
    void CycleChoice(int32 Direction);
    void CycleInspectedSite(int32 Direction);
    void CycleInspectedCommandSignal(int32 Direction);
    void ResetInspectedSite();
    void IssueSelectedOrder();
    void RequestNewChronicle();
    void ToggleEvidence();
    void ToggleSound();
    void AdjustAmbience(int32 Direction);
    void AdjustEffects(int32 Direction);
    void ToggleReducedMotion();
    void SkipCinematicSequence();

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
    bool bReducedMotion = false;
    FString InspectedSiteId;
    FString InspectedCommandSignalId;
    TArray<FShiCommandSignalData> CommandSignals;
    double LastOrderIssueTime = -1000.0;
    TSharedPtr<SShiCommandScreen> CommandScreen;
    UPROPERTY(Transient)
    TObjectPtr<UShiSoundscapeComponent> AudioDirector;
    TWeakObjectPtr<ACameraActor> CommandCamera;
    TMap<FString, TWeakObjectPtr<AStaticMeshActor>> SiteMarkers;
    TMap<FString, TWeakObjectPtr<AStaticMeshActor>> CommandSignalMarkers;
    TArray<FShiCinematicBeatData> CinematicBeats;
    int32 CinematicBeatIndex = INDEX_NONE;
    float CinematicHoldElapsed = 0.f;
    bool bCinematicHolding = false;
    FVector CameraBaseLocation;
    FRotator CameraBaseRotation;
    FVector CameraTransitionStartLocation;
    FRotator CameraTransitionStartRotation;
    FVector CameraTransitionTargetLocation;
    FRotator CameraTransitionTargetRotation;
    float CameraTransitionElapsed = 0.f;
    float CameraTransitionDuration = 0.f;
    float CameraTransitionStartFieldOfView = 50.f;
    float CameraTransitionTargetFieldOfView = 50.f;

    void CreateCommandSpace();
    void CreateSoundscape();
    void RefreshScreen();
    void BeginCameraTransition(const FTransform& Target, float Duration, float FieldOfViewDegrees = 50.f);
    void SetCameraImmediate(const FTransform& Target, float FieldOfViewDegrees);
    void TickCamera(float DeltaSeconds);
    bool CanPresentCommandSignals(const TArray<FShiCommandSignalData>& PreparedSignals, FString& OutError) const;
    bool CanPresentResolutionSequence(const TArray<FShiCommandSignalData>& PreparedSignals,
        const TArray<FShiCinematicBeatData>& PreparedBeats, FString& OutError) const;
    void BeginPreparedResolutionSequence(TArray<FShiCinematicBeatData>&& PreparedBeats);
    void StartCinematicBeat();
    void TickCinematicSequence(float DeltaSeconds);
    void CompleteCinematicSequence();
    void InspectSite(const FString& SiteId, bool bImmediate = false, bool bPlayCue = true);
    void InspectCommandSignal(const FString& SignalId, bool bPlayCue = true);
    bool InspectWorldUnderCursor(APlayerController& Controller);
    void UpdateWartableSelection();
    bool RebuildCommandSignals(FString& OutError);
    void UpdateCommandSignalSelection();
    void SelectFirstAvailableChoice();
    void ResumeSoundFromGesture();
    void LoadCinematicPreferences();
    void SaveCinematicPreferences() const;
    FString GetSavePath() const;
    bool RestoreChronicle(FString& OutError);
    bool SaveChronicle(FString& OutError) const;
    bool SaveChronicle(const FShiCampaignSession& SourceSession, FString& OutError) const;
};
