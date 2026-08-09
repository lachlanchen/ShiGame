#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ShiCampaignModel.h"
#include "ShiGameMode.generated.h"

class SShiCommandScreen;
class ACameraActor;

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
    const FShiNodeData* GetCurrentNode() const { return Campaign.FindNode(CurrentNodeId); }
    const TMap<FString, int32>& GetResources() const { return Resources; }
    int32 GetSelectedChoiceIndex() const { return SelectedChoiceIndex; }
    const FString& GetLocale() const { return Locale; }
    const FString& GetLastConsequence() const { return LastConsequence; }
    const FString& GetActiveCommitmentId() const { return ActiveCommitmentId; }
    const FString& GetLoadError() const { return LoadError; }
    bool IsCompleted() const { return bCompleted; }
    bool CanChoose(const FShiChoiceData& Choice) const;
    const FShiFieldConditionData* GetCurrentFieldCondition() const;
    const FShiOppositionStageData* GetCurrentOppositionStage() const { return SelectOppositionStage(); }
    const FShiMethodReadData* GetCurrentMethodRead() const { return SelectMethodRead(); }
    const FShiCommitmentData* GetActiveCommitment() const;

    void SelectChoice(int32 Index);
    void IssueSelectedOrder();

private:
    FShiCampaignModel Campaign;
    FString CurrentNodeId;
    FString Locale = TEXT("en");
    FString LastConsequence;
    FString ActiveCommitmentId;
    FString LoadError;
    TMap<FString, int32> Resources;
    TArray<FString> MethodHistory;
    TArray<FString> ChoiceHistory;
    TArray<FString> Flags;
    int32 SelectedChoiceIndex = 0;
    uint32 CampaignSeed = 0x5EED2026u;
    bool bCompleted = false;
    TSharedPtr<SShiCommandScreen> CommandScreen;
    TWeakObjectPtr<ACameraActor> CommandCamera;
    FVector CameraRestLocation;
    FRotator CameraRestRotation;
    float CameraBeatElapsed = 0.f;
    float CameraBeatDuration = 0.f;

    void CreateCommandSpace();
    void RefreshScreen();
    void BeginCameraBeat();
    void ApplyEffects(const TMap<FString, int32>& Effects);
    const FShiFieldConditionData* SelectFieldCondition(const FShiNodeData& Node) const;
    const FShiOppositionStageData* SelectOppositionStage() const;
    const FShiMethodReadData* SelectMethodRead() const;
};
