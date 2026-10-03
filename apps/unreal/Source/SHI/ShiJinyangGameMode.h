#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ShiJinyangModel.h"
#include "ShiJinyangGameMode.generated.h"
class ACameraActor;
class AStaticMeshActor;
class AShiJinyangFigure;
class UShiSoundscapeComponent;
class UStaticMesh;
class UMaterialInterface;
class AShiJinyangExplorer;
class UTouchInterface;

struct FShiJinyangPresentationBeat
{
    TArray<FVector> Route;
    FString Camp;
    float HoldSeconds = 0.f;
};

UCLASS()
class SHI_API AShiJinyangGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AShiJinyangGameMode();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    virtual void EndPlay(const EEndPlayReason::Type Reason) override;
    // Hide scenic chrome without concealing the controls that own input.
    static bool IsExplorationInterfaceVisible(bool HideHud, bool Intro, bool Inspect, bool Paused)
    { return !HideHud || Intro || Inspect || Paused; }
    static void NormalizeTouchAxes(UTouchInterface* Interface);
private:
    FShiJinyangModel Model;
    FString DefinitionText, SavePath, LastSaved, SelectedSite = TEXT("wall"), Note;
    bool bSaveBlocked = false, bPaused = false, bReducedMotion = false, bRestartArmed = false, bChinese = false;
    float BusyTime = 0.f;
    FString ActivePresentation;
    bool bFollowingAction = false;
    TWeakObjectPtr<AShiJinyangFigure> ActionSubject;
    TArray<FVector> ActionCameraRoute;
    bool bHideHud = false;
    bool bAudioReview = false, bAudioRecording = false;
    TArray<FShiJinyangPresentationBeat> Beats;
    int32 BeatIndex = -1;
    float BeatHold = 0.f;
    bool bBeatResponseStarted = false;
    TSharedPtr<SWidget> Screen;
    TMap<FString, FVector> Sites;
    TMap<FString, TWeakObjectPtr<AStaticMeshActor>> Markers;
    TMap<FString, TWeakObjectPtr<AStaticMeshActor>> Signals;
    TArray<TWeakObjectPtr<AShiJinyangFigure>> Figures;
    TWeakObjectPtr<ACameraActor> Camera;
    TWeakObjectPtr<AShiJinyangFigure> Envoy;
    TWeakObjectPtr<AStaticMeshActor> Water;
    FVector CameraTarget;
    FRotator RotationTarget;
    UPROPERTY() TObjectPtr<UShiSoundscapeComponent> Sound;
    UPROPERTY() TObjectPtr<UStaticMesh> Cube;
    UPROPERTY() TObjectPtr<UStaticMesh> Sphere;
    UPROPERTY() TObjectPtr<UStaticMesh> Cylinder;
    UPROPERTY() TObjectPtr<UMaterialInterface> BasicMaterial;
    UPROPERTY() TObjectPtr<UTouchInterface> WalkingTouchInterface;
    bool bTouchControls=false,bTouchActive=false,bReviewFakesTouch=false;
    bool bWorldReady = false, bExploring = false, bExploreIntro = false, bWorldInspect = false;
    bool bWorldPaused = false;
    int32 GuideIndex=0;
    TArray<FString> GuidePlaces;
    TArray<TWeakObjectPtr<AShiJinyangFigure>> Residents;
    TArray<TArray<FVector>> ResidentRoutes;
    TArray<bool> ResidentGoingOut;
    TArray<float> ResidentWait;
    TWeakObjectPtr<AShiJinyangExplorer> Explorer;
    FString NearbyPlace, InspectedPlace;
    FString DefenseChoice, DefenseError;
    TSet<FString> VisitedPlaces;
    TMap<FString,FVector> WorldPlaces;
    bool CreateExplorationWorld();
    void StartExploration();
    void ConfigureWalkingTouch();
    void SyncWalkingTouch();
    void SuspendWalkingInput();
    FVector2D ExplorationUiSize() const;
    float TouchUiCompensation() const;
    FVector2D LastUiSize=FVector2D::ZeroVector;
    void ToggleExploration();
    void TickExploration(float Dt);
    void RefreshExplorationScreen();
    void SaveExploration() const;
    void InspectNearby();
    bool IsDefenseStation() const;
    void ChooseDefenseWork(const FString& Id);
    void DispatchDefenseWork();
    FString DefenseForecast(const FString& Id) const;
    void PauseExploration(bool Pause);
    void TickResidents(float Dt);
    FString ExplorationGuide() const;
    FString PlaceName(const FString& Id) const;
    FString PlaceStory(const FString& Id) const;
    void CreateWorld();
    void CreateFigures();
    FVector ForceDestination(int32 Index) const;
    TArray<FVector> ForceRoute(int32 Index) const;
    void RefreshScreen();
    void SelectSite(const FString& Id);
    void Issue(const FString& Id);
    void Present(const FString& Id);
    void TickPresentation(float DeltaSeconds);
    void BeginNextBeat();
    void FollowPresentation(int32 FigureIndex, const TArray<FVector>& Route);
    void FramePresentationCamera();
    void ToggleCameraMotion();
    void SetDiplomaticVisuals(const FString& Camp, bool Instant);
    void SetOutcomeCamera();
    void SetOperationVisuals(bool Instant);
    TArray<FVector> OperationRoute(int32 Index, const FVector& End) const;
    FString OperationReport() const;
    void ApplySettledVisuals(bool bResume);
    void Restart();
    void TogglePause();
    void SkipMovement();
    TArray<FString> ContextCommands() const;
    int32 CommandKey(const FString& Id) const;
    FString Text(const TCHAR* English, const TCHAR* Chinese) const;
    FString Objective() const;
    FString SiteReport() const;
    AStaticMeshActor* Box(const FVector& Position, const FVector& Scale, const FLinearColor& Color);
    AShiJinyangFigure* Figure(const FVector& Position, const FLinearColor& Color);
};
