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
private:
    FShiJinyangModel Model;
    FString DefinitionText, SavePath, LastSaved, SelectedSite = TEXT("wall"), Note;
    bool bSaveBlocked = false, bPaused = false, bReducedMotion = false, bRestartArmed = false, bChinese = false;
    float BusyTime = 0.f;
    FString ActivePresentation;
    bool bFollowingEnvoy = false;
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
    void CreateWorld();
    void CreateFigures();
    FVector ForceDestination(int32 Index) const;
    TArray<FVector> ForceRoute(int32 Index) const;
    void RefreshScreen();
    void SelectSite(const FString& Id);
    void Issue(const FString& Id);
    void Present(const FString& Id);
    void BeginNextBeat();
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
