#include "ShiGameMode.h"

#include "Camera/CameraActor.h"
#include "Engine/DirectionalLight.h"
#include "Engine/Engine.h"
#include "Engine/ExponentialHeightFog.h"
#include "Engine/GameViewportClient.h"
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
#include "HAL/FileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "ShiCommandScreen.h"

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

void AShiGameMode::IssueSelectedOrder()
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(SelectedChoiceIndex) || !CanChoose(Node->Choices[SelectedChoiceIndex]) || Session.IsCompleted()) return;
    const double Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
    if (Now - LastOrderIssueTime < 0.15) return;
    LastOrderIssueTime = Now;

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
    BeginCameraBeat();
    RefreshScreen();
}

void AShiGameMode::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(GetWorld(), 0))
    {
        if (Controller->WasInputKeyJustPressed(EKeys::One) || Controller->WasInputKeyJustPressed(EKeys::NumPadOne)) SelectChoice(0);
        if (Controller->WasInputKeyJustPressed(EKeys::Two) || Controller->WasInputKeyJustPressed(EKeys::NumPadTwo)) SelectChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Three) || Controller->WasInputKeyJustPressed(EKeys::NumPadThree)) SelectChoice(2);
        if (Controller->WasInputKeyJustPressed(EKeys::Left) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Left)) CycleChoice(-1);
        if (Controller->WasInputKeyJustPressed(EKeys::Right) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Right)) CycleChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Enter) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Bottom)) IssueSelectedOrder();
        if (CameraBeatDuration > 0.f && Controller->WasInputKeyJustPressed(EKeys::SpaceBar)) CameraBeatElapsed = CameraBeatDuration;
    }
    if (CameraBeatDuration <= 0.f || !CommandCamera.IsValid()) return;
    CameraBeatElapsed += DeltaSeconds;
    const float Alpha = FMath::Clamp(CameraBeatElapsed / CameraBeatDuration, 0.f, 1.f);
    const float Ease = FMath::InterpEaseInOut(0.f, 1.f, Alpha, 2.f);
    const float Arc = FMath::Sin(Alpha * PI);
    CommandCamera->SetActorLocation(CameraRestLocation + FVector(-95.f * Ease, 70.f * Arc, 24.f * Arc));
    CommandCamera->SetActorRotation(CameraRestRotation + FRotator(-2.5f * Arc, 4.f * Arc, 0.f));
    if (Alpha >= 1.f)
    {
        CameraRestLocation = CommandCamera->GetActorLocation();
        CameraRestRotation = CommandCamera->GetActorRotation();
        CameraBeatDuration = 0.f;
    }
}

void AShiGameMode::BeginCameraBeat()
{
    if (!CommandCamera.IsValid()) return;
    CameraRestLocation = CommandCamera->GetActorLocation();
    CameraRestRotation = CommandCamera->GetActorRotation();
    CameraBeatElapsed = 0.f;
    CameraBeatDuration = 1.4f;
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
    RefreshScreen();
}

void AShiGameMode::RefreshScreen()
{
    if (CommandScreen.IsValid()) CommandScreen->Refresh();
}

void AShiGameMode::CreateCommandSpace()
{
    UWorld* World = GetWorld();
    if (!World) return;
    ACameraActor* Camera = World->SpawnActor<ACameraActor>(FVector(720, -760, 520), FRotator(-24, 133, 0));
    CommandCamera = Camera;
    CameraRestLocation = Camera->GetActorLocation();
    CameraRestRotation = Camera->GetActorRotation();
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(World, 0))
    {
        Controller->SetViewTarget(Camera);
        Controller->SetShowMouseCursor(true);
        FInputModeGameAndUI InputMode;
        InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
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
    if (Plane)
    {
        AStaticMeshActor* Ground = World->SpawnActor<AStaticMeshActor>(FVector(0, 0, -12), FRotator::ZeroRotator);
        Ground->GetStaticMeshComponent()->SetStaticMesh(Plane);
        Ground->SetActorScale3D(FVector(24.f, 24.f, 1.f));
    }
    if (Cube)
    {
        AStaticMeshActor* Table = World->SpawnActor<AStaticMeshActor>(FVector(0, 0, 6), FRotator::ZeroRotator);
        Table->GetStaticMeshComponent()->SetStaticMesh(Cube);
        Table->SetActorScale3D(FVector(5.8f, 3.7f, 0.16f));
    }
    for (int32 Index = 0; Cube && Index < 7; ++Index)
    {
        AStaticMeshActor* Marker = World->SpawnActor<AStaticMeshActor>(FVector(Index * 130.f - 390.f, 0, Index == 3 ? 55.f : 20.f), FRotator::ZeroRotator);
        Marker->GetStaticMeshComponent()->SetStaticMesh(Cube);
        Marker->SetActorScale3D(FVector(0.45f, 0.45f, Index == 3 ? 1.1f : 0.4f));
    }
}
