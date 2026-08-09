#include "ShiGameMode.h"

#include "Camera/CameraActor.h"
#include "Engine/DirectionalLight.h"
#include "Engine/Engine.h"
#include "Engine/ExponentialHeightFog.h"
#include "Engine/GameViewportClient.h"
#include "Engine/HitResult.h"
#include "Engine/PointLight.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "Components/LightComponent.h"
#include "Components/PointLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "InputCoreTypes.h"
#include "Kismet/GameplayStatics.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "HAL/FileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "ShiCommandScreen.h"
#include "ShiSoundscapeComponent.h"
#include "ShiWartableModel.h"

AShiGameMode::AShiGameMode()
{
    PrimaryActorTick.bCanEverTick = true;
}

void AShiGameMode::BeginPlay()
{
    Super::BeginPlay();
    if (!Campaign.LoadCanonical(LoadError))
    {
        UE_LOG(LogTemp, Error, TEXT("SHI campaign load failed: %s"), *LoadError);
    }
    else
    {
        const bool bSaveExists = FPaths::FileExists(GetSavePath());
        FString PersistenceError;
        if (bSaveExists && RestoreChronicle(PersistenceError))
        {
            SaveStatus = FString::Printf(TEXT("RESUMED · TURN %d · AUTOSAVE READY"), Session.GetHistory().Num() + 1);
        }
        else
        {
            Session.Initialize(Campaign, CampaignSeed);
            if (bSaveExists)
            {
                bPersistenceEnabled = false;
                SaveStatus = FString::Printf(TEXT("SAVE REJECTED · %s · FRESH PREVIEW IS NOT WRITING OVER IT"), *PersistenceError);
            }
            else if (SaveChronicle(PersistenceError))
            {
                SaveStatus = TEXT("NEW CHRONICLE · AUTOSAVED LOCALLY");
            }
            else
            {
                SaveStatus = FString::Printf(TEXT("AUTOSAVE UNAVAILABLE · %s"), *PersistenceError);
            }
        }
        SelectFirstAvailableChoice();
        CreateSoundscape();
        CreateCommandSpace();
    }

    if (GEngine && GEngine->GameViewport)
    {
        SAssignNew(CommandScreen, SShiCommandScreen).GameMode(this);
        GEngine->GameViewport->AddViewportWidgetContent(CommandScreen.ToSharedRef(), 100);
    }
}

void AShiGameMode::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (AudioDirector) AudioDirector->Stop();
    if (CommandScreen.IsValid() && GEngine && GEngine->GameViewport)
        GEngine->GameViewport->RemoveViewportWidgetContent(CommandScreen.ToSharedRef());
    CommandScreen.Reset();
    Super::EndPlay(EndPlayReason);
}

void AShiGameMode::SelectChoice(int32 Index)
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(Index) || !CanChoose(Node->Choices[Index]) || Session.IsCompleted()) return;
    SelectedChoiceIndex = Index;
    if (bRestartArmed) SaveStatus = TEXT("RESTART CANCELLED · CURRENT CHRONICLE PRESERVED");
    bRestartArmed = false;
    LastConsequence.Empty();
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("select")));
    RefreshScreen();
}

void AShiGameMode::CycleChoice(int32 Direction)
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || Node->Choices.IsEmpty() || Session.IsCompleted() || Direction == 0) return;
    for (int32 Offset = 1; Offset <= Node->Choices.Num(); ++Offset)
    {
        const int32 Candidate = (SelectedChoiceIndex + Direction * Offset + Node->Choices.Num() * 2) % Node->Choices.Num();
        if (CanChoose(Node->Choices[Candidate])) { SelectChoice(Candidate); return; }
    }
}

const FShiSiteData* AShiGameMode::GetInspectedSite() const
{
    if (const FShiSiteData* Inspected = Campaign.FindSite(InspectedSiteId)) return Inspected;
    const FShiNodeData* Node = GetCurrentNode();
    return Node ? Campaign.FindSite(Node->SiteId) : nullptr;
}

bool AShiGameMode::IsInspectingRemoteSite() const
{
    const FShiNodeData* Node = GetCurrentNode();
    const FShiSiteData* Site = GetInspectedSite();
    return Node && Site && Node->SiteId != Site->Id;
}

void AShiGameMode::CycleInspectedSite(int32 Direction)
{
    if (bEvidenceOpen || Direction == 0) return;
    InspectSite(FShiWartableModel::CycleSite(Campaign.Sites, GetInspectedSite() ? GetInspectedSite()->Id : FString(), Direction));
}

void AShiGameMode::ResetInspectedSite()
{
    if (bEvidenceOpen) return;
    if (const FShiNodeData* Node = GetCurrentNode()) InspectSite(Node->SiteId);
}

void AShiGameMode::IssueSelectedOrder()
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(SelectedChoiceIndex) || !CanChoose(Node->Choices[SelectedChoiceIndex]) || Session.IsCompleted()) return;
    const double Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
    if (Now - LastOrderIssueTime < 0.15) return;
    LastOrderIssueTime = Now;
    ResumeSoundFromGesture();

    FShiResolutionResult Resolution;
    FString ResolutionError;
    if (!Session.ResolveChoice(Node->Choices[SelectedChoiceIndex].Id, Resolution, ResolutionError))
    {
        LastConsequence = FString::Printf(TEXT("ORDER REJECTED · %s"), *ResolutionError);
        RefreshScreen();
        return;
    }
    const FShiChoiceData& Choice = *Resolution.Choice;

    TArray<FString> ConsequenceParts;
    ConsequenceParts.Add(Choice.Consequence.Resolve(Locale));
    if (Resolution.CommitmentOutcome)
        ConsequenceParts.Add(FString::Printf(TEXT("OATH %s · %s"), *Resolution.CommitmentOutcome->Status.ToUpper(), *Resolution.CommitmentOutcome->Response.Resolve(Locale)));
    if (!Choice.PressureReveal.Resolve(Locale).IsEmpty()) ConsequenceParts.Add(Choice.PressureReveal.Resolve(Locale));
    if (Resolution.Opposition) ConsequenceParts.Add(FString::Printf(TEXT("%s · %s"), *Resolution.Opposition->Title.Resolve(Locale), *Resolution.Opposition->Response.Resolve(Locale)));
    if (Resolution.MethodRead && !Resolution.MethodRead->TargetMethodId.IsEmpty())
    {
        const FString ReadResponse = Resolution.Record.bMethodReadMatched ? Resolution.MethodRead->HitResponse.Resolve(Locale) : Resolution.MethodRead->MissResponse.Resolve(Locale);
        ConsequenceParts.Add(FString::Printf(TEXT("METHOD READ %s · %s"), Resolution.Record.bMethodReadMatched ? TEXT("HIT") : TEXT("MISSED"), *ReadResponse));
    }
    if (Resolution.Condition) ConsequenceParts.Add(FString::Printf(TEXT("FIELD · %s"), *Resolution.Condition->Title.Resolve(Locale)));
    if (!Session.GetFailureReason().IsEmpty()) ConsequenceParts.Add(FString::Printf(TEXT("POSITION LOST · %s"), *Session.GetFailureReason().ToUpper()));
    LastConsequence = FString::Join(ConsequenceParts, TEXT("\n\n"));

    bRestartArmed = false;
    SelectedChoiceIndex = 0;
    SelectFirstAvailableChoice();
    if (bPersistenceEnabled)
    {
        FString PersistenceError;
        SaveStatus = SaveChronicle(PersistenceError)
            ? FString::Printf(TEXT("AUTOSAVED · %d DECISIONS"), Session.GetHistory().Num())
            : FString::Printf(TEXT("AUTOSAVE FAILED · %s"), *PersistenceError);
    }
    if (AudioDirector)
    {
        const FName Cue = !Session.GetFailureReason().IsEmpty() ? FName(TEXT("failure"))
            : Session.IsCompleted() ? FName(TEXT("ending")) : FName(TEXT("commit"));
        AudioDirector->PlayCue(Cue);
    }
    if (const FShiNodeData* NextNode = GetCurrentNode())
    {
        if (InspectedSiteId != NextNode->SiteId) InspectSite(NextNode->SiteId, false, false);
        else BeginCameraBeat();
    }
    RefreshScreen();
}

void AShiGameMode::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        const bool bEvidenceToggle = Controller->WasInputKeyJustPressed(EKeys::E)
            || Controller->WasInputKeyJustPressed(EKeys::Gamepad_LeftShoulder);
        if (bEvidenceOpen)
        {
            if (CommandScreen.IsValid()
                && (Controller->WasInputKeyJustPressed(EKeys::Up) || Controller->WasInputKeyJustPressed(EKeys::PageUp)
                    || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Up))) CommandScreen->ScrollEvidence(-1);
            if (CommandScreen.IsValid()
                && (Controller->WasInputKeyJustPressed(EKeys::Down) || Controller->WasInputKeyJustPressed(EKeys::PageDown)
                    || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Down))) CommandScreen->ScrollEvidence(1);
            if (bEvidenceToggle || Controller->WasInputKeyJustPressed(EKeys::Escape)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Right)) ToggleEvidence();
            return;
        }
        if (bEvidenceToggle)
        {
            ToggleEvidence();
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::LeftMouseButton) && InspectSiteUnderCursor(*Controller)) return;
        if (Controller->WasInputKeyJustPressed(EKeys::Tab) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_RightShoulder))
        {
            const bool bReverse = Controller->IsInputKeyDown(EKeys::LeftShift) || Controller->IsInputKeyDown(EKeys::RightShift);
            CycleInspectedSite(bReverse ? -1 : 1);
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::Home))
        {
            ResetInspectedSite();
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::One) || Controller->WasInputKeyJustPressed(EKeys::NumPadOne)) SelectChoice(0);
        if (Controller->WasInputKeyJustPressed(EKeys::Two) || Controller->WasInputKeyJustPressed(EKeys::NumPadTwo)) SelectChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Three) || Controller->WasInputKeyJustPressed(EKeys::NumPadThree)) SelectChoice(2);
        if (Controller->WasInputKeyJustPressed(EKeys::Left) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Left)) CycleChoice(-1);
        if (Controller->WasInputKeyJustPressed(EKeys::Right) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Right)) CycleChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Enter) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Bottom)) IssueSelectedOrder();
        if (Controller->WasInputKeyJustPressed(EKeys::M) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Top)) ToggleSound();
        if (CameraBeatDuration > 0.f && Controller->WasInputKeyJustPressed(EKeys::SpaceBar)) CameraBeatElapsed = CameraBeatDuration;
    }
    TickCamera(DeltaSeconds);
}

void AShiGameMode::BeginCameraBeat()
{
    if (!CommandCamera.IsValid()) return;
    CameraTransitionDuration = 0.f;
    CameraBaseLocation = CommandCamera->GetActorLocation();
    CameraBaseRotation = CommandCamera->GetActorRotation();
    CameraBeatElapsed = 0.f;
    CameraBeatDuration = 1.4f;
}

void AShiGameMode::BeginCameraTransition(const FTransform& Target, float Duration)
{
    if (!CommandCamera.IsValid()) return;
    CameraBeatDuration = 0.f;
    CameraTransitionStartLocation = CommandCamera->GetActorLocation();
    CameraTransitionStartRotation = CommandCamera->GetActorRotation();
    CameraTransitionTargetLocation = Target.GetLocation();
    CameraTransitionTargetRotation = Target.GetRotation().Rotator();
    CameraTransitionElapsed = 0.f;
    CameraTransitionDuration = FMath::Max(Duration, .01f);
}

void AShiGameMode::TickCamera(float DeltaSeconds)
{
    if (!CommandCamera.IsValid()) return;
    if (CameraTransitionDuration > 0.f)
    {
        CameraTransitionElapsed += DeltaSeconds;
        const float Alpha = FMath::Clamp(CameraTransitionElapsed / CameraTransitionDuration, 0.f, 1.f);
        const float Ease = FMath::InterpEaseInOut(0.f, 1.f, Alpha, 2.f);
        CommandCamera->SetActorLocation(FMath::Lerp(CameraTransitionStartLocation, CameraTransitionTargetLocation, Ease));
        CommandCamera->SetActorRotation(FQuat::Slerp(CameraTransitionStartRotation.Quaternion(), CameraTransitionTargetRotation.Quaternion(), Ease));
        if (Alpha >= 1.f)
        {
            CameraBaseLocation = CameraTransitionTargetLocation;
            CameraBaseRotation = CameraTransitionTargetRotation;
            CameraTransitionDuration = 0.f;
        }
        return;
    }
    if (CameraBeatDuration <= 0.f) return;
    CameraBeatElapsed += DeltaSeconds;
    const float Alpha = FMath::Clamp(CameraBeatElapsed / CameraBeatDuration, 0.f, 1.f);
    const float Arc = FMath::Sin(Alpha * PI);
    CommandCamera->SetActorLocation(CameraBaseLocation + FVector(-38.f * Arc, 34.f * Arc, 16.f * Arc));
    CommandCamera->SetActorRotation(CameraBaseRotation + FRotator(-1.8f * Arc, 2.8f * Arc, 0.f));
    if (Alpha >= 1.f)
    {
        CommandCamera->SetActorLocation(CameraBaseLocation);
        CommandCamera->SetActorRotation(CameraBaseRotation);
        CameraBeatDuration = 0.f;
    }
}

void AShiGameMode::InspectSite(const FString& SiteId, bool bImmediate, bool bPlayCue)
{
    const FShiSiteData* Site = Campaign.FindSite(SiteId);
    if (!Site) return;
    const bool bChanged = InspectedSiteId != SiteId;
    InspectedSiteId = SiteId;
    UpdateWartableSelection();
    const FTransform Target = FShiWartableModel::CameraTransform(*Site);
    if (bImmediate && CommandCamera.IsValid())
    {
        CameraTransitionDuration = 0.f;
        CameraBeatDuration = 0.f;
        CameraBaseLocation = Target.GetLocation();
        CameraBaseRotation = Target.GetRotation().Rotator();
        CommandCamera->SetActorLocation(CameraBaseLocation);
        CommandCamera->SetActorRotation(CameraBaseRotation);
    }
    else if (bChanged || CameraTransitionDuration <= 0.f)
    {
        BeginCameraTransition(Target, .72f);
    }
    if (bPlayCue)
    {
        ResumeSoundFromGesture();
        if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("inspect")));
    }
    RefreshScreen();
}

bool AShiGameMode::InspectSiteUnderCursor(APlayerController& Controller)
{
    float MouseX = 0.f;
    float MouseY = 0.f;
    if (!Controller.GetMousePosition(MouseX, MouseY)) return false;
    FHitResult Hit;
    if (!Controller.GetHitResultAtScreenPosition(FVector2D(MouseX, MouseY), ECC_Visibility, false, Hit)) return false;
    AActor* HitActor = Hit.GetActor();
    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : SiteMarkers)
    {
        if (Pair.Value.Get() == HitActor)
        {
            InspectSite(Pair.Key);
            return true;
        }
    }
    return false;
}

void AShiGameMode::UpdateWartableSelection()
{
    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : SiteMarkers)
    {
        AStaticMeshActor* Marker = Pair.Value.Get();
        const FShiSiteData* Site = Campaign.FindSite(Pair.Key);
        if (!Marker || !Site) continue;
        const bool bSelected = Pair.Key == InspectedSiteId;
        const FShiWartableMarkerStyle Style = FShiWartableModel::MarkerStyle(Site->Status, bSelected);
        Marker->SetActorScale3D(Style.Scale);
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetRenderCustomDepth(bSelected);
        Component->SetCustomDepthStencilValue(Style.StencilValue);
        if (UMaterialInstanceDynamic* Material = Cast<UMaterialInstanceDynamic>(Component->GetMaterial(0)))
            Material->SetVectorParameterValue(FName(TEXT("Color")), Style.Color);
    }
}

void AShiGameMode::SelectFirstAvailableChoice()
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node) return;
    for (int32 Index = 0; Index < Node->Choices.Num(); ++Index)
        if (CanChoose(Node->Choices[Index])) { SelectedChoiceIndex = Index; return; }
}

FString AShiGameMode::GetSavePath() const
{
    return FPaths::Combine(FPaths::ProjectSavedDir(), TEXT("SaveGames"), TEXT("shi-chapter-01-v6.json"));
}

bool AShiGameMode::RestoreChronicle(FString& OutError)
{
    FString Json;
    if (!FFileHelper::LoadFileToString(Json, *GetSavePath()))
    {
        OutError = TEXT("the local chronicle could not be read");
        return false;
    }
    return Session.ReplaySaveJson(Campaign, Json, OutError);
}

bool AShiGameMode::SaveChronicle(FString& OutError) const
{
    FString Json;
    if (!Session.ExportSaveJson(Json, OutError)) return false;
    const FString SavePath = GetSavePath();
    const FString SaveDirectory = FPaths::GetPath(SavePath);
    if (!IFileManager::Get().DirectoryExists(*SaveDirectory) && !IFileManager::Get().MakeDirectory(*SaveDirectory, true))
    {
        OutError = TEXT("the save directory could not be created");
        return false;
    }
    const FString TemporaryPath = SavePath + TEXT(".tmp");
    if (!FFileHelper::SaveStringToFile(Json, *TemporaryPath, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM))
    {
        OutError = TEXT("the temporary chronicle could not be written");
        return false;
    }
    if (!IFileManager::Get().Move(*SavePath, *TemporaryPath, true, true, false, true))
    {
        OutError = TEXT("the verified chronicle could not replace the previous save");
        return false;
    }
    OutError.Empty();
    return true;
}

void AShiGameMode::RequestNewChronicle()
{
    if (!LoadError.IsEmpty()) return;
    if (!bRestartArmed)
    {
        bRestartArmed = true;
        SaveStatus = TEXT("RESTART ARMED · PRESS NEW CHRONICLE AGAIN TO REPLACE THE LOCAL RUN");
        RefreshScreen();
        return;
    }
    Session.Initialize(Campaign, CampaignSeed);
    LastConsequence.Empty();
    SelectedChoiceIndex = 0;
    SelectFirstAvailableChoice();
    bPersistenceEnabled = true;
    bRestartArmed = false;
    FString PersistenceError;
    SaveStatus = SaveChronicle(PersistenceError)
        ? TEXT("NEW CHRONICLE · AUTOSAVED LOCALLY")
        : FString::Printf(TEXT("NEW CHRONICLE · AUTOSAVE FAILED · %s"), *PersistenceError);
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("close")));
    if (const FShiNodeData* Node = GetCurrentNode()) InspectSite(Node->SiteId, false, false);
    RefreshScreen();
}

void AShiGameMode::ToggleEvidence()
{
    if (!LoadError.IsEmpty()) return;
    bEvidenceOpen = !bEvidenceOpen;
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(bEvidenceOpen ? FName(TEXT("drawer")) : FName(TEXT("close")));
    RefreshScreen();
}

bool AShiGameMode::IsAudioReady() const { return AudioDirector && AudioDirector->IsContractReady(); }
bool AShiGameMode::IsSoundEnabled() const { return AudioDirector && AudioDirector->IsSoundEnabled(); }
bool AShiGameMode::IsSoundPreferred() const { return AudioDirector && AudioDirector->IsSoundPreferred(); }
float AShiGameMode::GetAmbienceLevel() const { return AudioDirector ? AudioDirector->GetAmbienceLevel() : 0.f; }
float AShiGameMode::GetEffectsLevel() const { return AudioDirector ? AudioDirector->GetEffectsLevel() : 0.f; }

void AShiGameMode::ToggleSound()
{
    if (!IsAudioReady()) return;
    if (AudioDirector->IsSoundEnabled())
    {
        AudioDirector->PlayCue(FName(TEXT("close")));
        AudioDirector->SetSoundEnabled(false);
        AudioStatus = TEXT("SOUND OFF · TEXT AND GEOMETRY RETAIN ALL GAMEPLAY INFORMATION");
    }
    else
    {
        AudioDirector->SetSoundEnabled(true);
        AudioDirector->PlayCue(FName(TEXT("drawer")));
        AudioStatus = TEXT("SOUND ON · ENGINEERING PREVIEW · HUMAN LISTENING REVIEW OPEN");
    }
    RefreshScreen();
}

void AShiGameMode::AdjustAmbience(int32 Direction)
{
    if (!IsAudioReady() || Direction == 0) return;
    if (!AudioDirector->IsSoundEnabled()) AudioDirector->SetSoundEnabled(true);
    AudioDirector->SetAmbienceLevel(AudioDirector->GetAmbienceLevel() + Direction * .05f);
    AudioDirector->PlayCue(FName(TEXT("inspect")));
    AudioStatus = FString::Printf(TEXT("RAIN %d%% · PERSISTED LOCALLY"), FMath::RoundToInt(AudioDirector->GetAmbienceLevel() * 100.f));
    RefreshScreen();
}

void AShiGameMode::AdjustEffects(int32 Direction)
{
    if (!IsAudioReady() || Direction == 0) return;
    if (!AudioDirector->IsSoundEnabled()) AudioDirector->SetSoundEnabled(true);
    AudioDirector->SetEffectsLevel(AudioDirector->GetEffectsLevel() + Direction * .05f);
    AudioDirector->PlayCue(FName(TEXT("select")));
    AudioStatus = FString::Printf(TEXT("CUES %d%% · PERSISTED LOCALLY"), FMath::RoundToInt(AudioDirector->GetEffectsLevel() * 100.f));
    RefreshScreen();
}

void AShiGameMode::RefreshScreen()
{
    if (CommandScreen.IsValid()) CommandScreen->Refresh();
}

void AShiGameMode::ResumeSoundFromGesture()
{
    if (AudioDirector && AudioDirector->ResumePreferredFromGesture())
        AudioStatus = TEXT("SOUND ON · ENGINEERING PREVIEW · HUMAN LISTENING REVIEW OPEN");
}

void AShiGameMode::CreateSoundscape()
{
    AudioDirector = NewObject<UShiSoundscapeComponent>(this, TEXT("ShiSoundscape"));
    FString Error;
    if (!AudioDirector || !AudioDirector->LoadCanonical(Error))
    {
        AudioStatus = FString::Printf(TEXT("SOUND UNAVAILABLE · %s"), *Error);
        AudioDirector = nullptr;
        return;
    }
    AudioDirector->RegisterComponentWithWorld(GetWorld());
    AudioDirector->Initialize(AudioDirector->GetContractSampleRate());
    AudioDirector->SetAmbienceActive(true);
    AudioStatus = AudioDirector->IsSoundPreferred()
        ? TEXT("SOUND ARMED · RESUMES AFTER YOUR NEXT COMMAND · NO AUTOPLAY")
        : TEXT("SOUND OFF · OPT IN WITH M, GAMEPAD Y, OR THE SOUND CONTROL");
}

void AShiGameMode::CreateCommandSpace()
{
    UWorld* World = GetWorld();
    if (!World) return;
    FString WartableError;
    if (!FShiWartableModel::Validate(Campaign.Sites, WartableError))
    {
        LoadError = FString::Printf(TEXT("Wartable layout rejected: %s"), *WartableError);
        return;
    }
    ACameraActor* Camera = World->SpawnActor<ACameraActor>(FVector(720, -760, 520), FRotator(-24, 133, 0));
    if (!Camera)
    {
        LoadError = TEXT("Cinematic command camera could not spawn.");
        return;
    }
    CommandCamera = Camera;
    CameraBaseLocation = Camera->GetActorLocation();
    CameraBaseRotation = Camera->GetActorRotation();
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(World, 0))
    {
        Controller->SetViewTarget(Camera);
        Controller->SetShowMouseCursor(true);
        FInputModeGameAndUI InputMode;
        InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
        InputMode.SetHideCursorDuringCapture(false);
        Controller->SetInputMode(InputMode);
    }
    ADirectionalLight* Moon = World->SpawnActor<ADirectionalLight>(FVector::ZeroVector, FRotator(-42, 28, 0));
    if (Moon) { Moon->GetLightComponent()->SetIntensity(2.4f); Moon->GetLightComponent()->SetLightColor(FLinearColor(0.34f, 0.44f, 0.56f)); }
    APointLight* Fire = World->SpawnActor<APointLight>(FVector(-160, -110, 135), FRotator::ZeroRotator);
    if (Fire) { Fire->GetPointLightComponent()->SetIntensity(1850.f); Fire->GetPointLightComponent()->SetLightColor(FLinearColor(1.f, 0.36f, 0.10f)); Fire->GetPointLightComponent()->SetAttenuationRadius(720.f); }
    AExponentialHeightFog* Fog = World->SpawnActor<AExponentialHeightFog>();
    if (Fog) Fog->GetComponent()->SetFogDensity(0.025f);

    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    UStaticMesh* Plane = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Plane.Plane"));
    if (!Cube || !Plane)
    {
        LoadError = TEXT("Required engine-native command-space meshes are unavailable.");
        return;
    }
    if (Plane)
    {
        AStaticMeshActor* Ground = World->SpawnActor<AStaticMeshActor>(FVector(0, 0, -12), FRotator::ZeroRotator);
        if (!Ground) { LoadError = TEXT("Command-space ground could not spawn."); return; }
        Ground->GetStaticMeshComponent()->SetMobility(EComponentMobility::Movable);
        Ground->GetStaticMeshComponent()->SetStaticMesh(Plane);
        Ground->SetActorScale3D(FVector(24.f, 24.f, 1.f));
    }
    if (Cube)
    {
        AStaticMeshActor* Table = World->SpawnActor<AStaticMeshActor>(FVector(0, 0, 6), FRotator::ZeroRotator);
        if (!Table) { LoadError = TEXT("Wartable surface could not spawn."); return; }
        Table->GetStaticMeshComponent()->SetMobility(EComponentMobility::Movable);
        Table->GetStaticMeshComponent()->SetStaticMesh(Cube);
        Table->SetActorScale3D(FVector(5.8f, 3.7f, 0.16f));
    }
    UMaterialInterface* BasicMaterial = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    if (!BasicMaterial)
    {
        LoadError = TEXT("Required engine-native wartable material is unavailable.");
        return;
    }
    SiteMarkers.Empty();
    for (const FShiSiteData& Site : Campaign.Sites)
    {
        const FShiWartableMarkerStyle Style = FShiWartableModel::MarkerStyle(Site.Status, false);
        UStaticMesh* MarkerMesh = LoadObject<UStaticMesh>(nullptr, *Style.MeshPath);
        if (!MarkerMesh)
        {
            LoadError = FString::Printf(TEXT("Wartable marker mesh missing for %s."), *Site.Id);
            return;
        }
        AStaticMeshActor* Marker = World->SpawnActor<AStaticMeshActor>(FShiWartableModel::ProjectSite(Site), FRotator::ZeroRotator);
        if (!Marker)
        {
            LoadError = FString::Printf(TEXT("Wartable marker could not spawn for %s."), *Site.Id);
            return;
        }
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetMobility(EComponentMobility::Movable);
        Component->SetStaticMesh(MarkerMesh);
        Component->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
        Component->SetCollisionResponseToAllChannels(ECR_Ignore);
        Component->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
        UMaterialInstanceDynamic* Material = Component->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
        if (!Material)
        {
            LoadError = FString::Printf(TEXT("Wartable marker material could not initialize for %s."), *Site.Id);
            return;
        }
        Material->SetVectorParameterValue(FName(TEXT("Color")), Style.Color);
        Marker->Tags.Add(FName(*FString::Printf(TEXT("ShiSite:%s"), *Site.Id)));
        Marker->SetActorScale3D(Style.Scale);
        SiteMarkers.Add(Site.Id, Marker);
    }
    if (const FShiNodeData* Node = GetCurrentNode()) InspectSite(Node->SiteId, false, false);
}
