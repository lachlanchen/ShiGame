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
        CurrentNodeId = Campaign.StartNodeId;
        Resources = Campaign.InitialResources;
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
    if (!Node || !Node->Choices.IsValidIndex(Index) || !CanChoose(Node->Choices[Index]) || bCompleted) return;
    SelectedChoiceIndex = Index;
    LastConsequence.Empty();
    RefreshScreen();
}

void AShiGameMode::IssueSelectedOrder()
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(SelectedChoiceIndex) || !CanChoose(Node->Choices[SelectedChoiceIndex]) || bCompleted) return;
    const FShiChoiceData Choice = Node->Choices[SelectedChoiceIndex];

    const FShiFieldConditionData* Condition = SelectFieldCondition(*Node);
    const FShiOppositionStageData* Opposition = SelectOppositionStage();
    const FShiMethodReadData* MethodRead = SelectMethodRead();
    const bool bMethodReadHit = MethodRead && !MethodRead->TargetMethodId.IsEmpty() && MethodRead->TargetMethodId == Choice.MethodId;
    const FShiCommitmentData* ActiveCommitment = Campaign.Commitments.FindByPredicate([&](const FShiCommitmentData& Item) { return Item.Id == ActiveCommitmentId; });
    const FShiCommitmentOutcomeData* CommitmentOutcome = ActiveCommitment
        ? ActiveCommitment->Outcomes.FindByPredicate([&](const FShiCommitmentOutcomeData& Item) { return Item.ChoiceId == Choice.Id; }) : nullptr;

    ApplyEffects(Choice.Effects);
    if (CommitmentOutcome) ApplyEffects(CommitmentOutcome->Effects);
    ApplyEffects(Choice.PressureEffects);
    if (Opposition) ApplyEffects(Opposition->Effects);
    if (bMethodReadHit) ApplyEffects(MethodRead->Effects);
    if (Condition) ApplyEffects(Condition->Effects);

    TArray<FString> ConsequenceParts;
    ConsequenceParts.Add(Choice.Consequence.Resolve(Locale));
    if (CommitmentOutcome)
    {
        ConsequenceParts.Add(FString::Printf(TEXT("OATH %s · %s"), *CommitmentOutcome->Status.ToUpper(), *CommitmentOutcome->Response.Resolve(Locale)));
        ActiveCommitmentId.Empty();
    }
    if (!Choice.PressureReveal.Resolve(Locale).IsEmpty()) ConsequenceParts.Add(Choice.PressureReveal.Resolve(Locale));
    if (Opposition) ConsequenceParts.Add(FString::Printf(TEXT("%s · %s"), *Opposition->Title.Resolve(Locale), *Opposition->Response.Resolve(Locale)));
    if (MethodRead && !MethodRead->TargetMethodId.IsEmpty())
    {
        const FString ReadResponse = bMethodReadHit ? MethodRead->HitResponse.Resolve(Locale) : MethodRead->MissResponse.Resolve(Locale);
        ConsequenceParts.Add(FString::Printf(TEXT("METHOD READ %s · %s"), bMethodReadHit ? TEXT("HIT") : TEXT("MISSED"), *ReadResponse));
    }
    if (Condition) ConsequenceParts.Add(FString::Printf(TEXT("FIELD · %s"), *Condition->Title.Resolve(Locale)));
    LastConsequence = FString::Join(ConsequenceParts, TEXT("\n\n"));

    if (const FShiCommitmentData* Established = Campaign.FindEstablishedCommitment(Choice.Id)) ActiveCommitmentId = Established->Id;
    MethodHistory.Add(Choice.MethodId);
    ChoiceHistory.Add(Choice.Id);
    Flags.Append(Choice.Flags);

    const bool bFailed = Resources.FindRef(TEXT("danger")) >= 100 || Resources.FindRef(TEXT("people")) <= 0;
    if (Choice.Next.IsEmpty() || bFailed) bCompleted = true;
    else
    {
        CurrentNodeId = Choice.Next;
        SelectedChoiceIndex = 0;
    }
    BeginCameraBeat();
    RefreshScreen();
}

void AShiGameMode::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (CameraBeatDuration <= 0.f || !CommandCamera.IsValid()) return;
    CameraBeatElapsed += DeltaSeconds;
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(GetWorld(), 0))
        if (Controller->WasInputKeyJustPressed(EKeys::SpaceBar)) CameraBeatElapsed = CameraBeatDuration;
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

bool AShiGameMode::CanChoose(const FShiChoiceData& Choice) const
{
    for (const TPair<FString, int32>& Minimum : Choice.Minimums)
        if (Resources.FindRef(Minimum.Key) < Minimum.Value) return false;
    for (const TPair<FString, int32>& Maximum : Choice.Maximums)
        if (Resources.FindRef(Maximum.Key) > Maximum.Value) return false;
    return true;
}

const FShiFieldConditionData* AShiGameMode::GetCurrentFieldCondition() const
{
    const FShiNodeData* Node = GetCurrentNode();
    return Node ? SelectFieldCondition(*Node) : nullptr;
}

const FShiCommitmentData* AShiGameMode::GetActiveCommitment() const
{
    return Campaign.Commitments.FindByPredicate([&](const FShiCommitmentData& Item) { return Item.Id == ActiveCommitmentId; });
}

void AShiGameMode::ApplyEffects(const TMap<FString, int32>& Effects)
{
    for (const TPair<FString, int32>& Effect : Effects)
    {
        int32& Value = Resources.FindOrAdd(Effect.Key);
        Value = FMath::Clamp(Value + Effect.Value, 0, 100);
    }
}

const FShiFieldConditionData* AShiGameMode::SelectFieldCondition(const FShiNodeData& Node) const
{
    int32 TotalWeight = 0;
    for (const FShiFieldConditionData& Condition : Node.Conditions) TotalWeight += Condition.Weight;
    if (TotalWeight <= 0) return nullptr;
    const FString Key = FString::Printf(TEXT("%s|%u|%s|%d"), *Campaign.Id, CampaignSeed, *Node.Id, ChoiceHistory.Num());
    uint32 Hash = 0x811c9dc5u;
    for (TCHAR Character : Key) { Hash ^= static_cast<uint32>(Character); Hash *= 0x01000193u; }
    int32 Roll = static_cast<int32>(Hash % static_cast<uint32>(TotalWeight));
    for (const FShiFieldConditionData& Condition : Node.Conditions)
    {
        if (Roll < Condition.Weight) return &Condition;
        Roll -= Condition.Weight;
    }
    return nullptr;
}

const FShiOppositionStageData* AShiGameMode::SelectOppositionStage() const
{
    const int32 Danger = Resources.FindRef(TEXT("danger"));
    return Campaign.OppositionStages.FindByPredicate([&](const FShiOppositionStageData& Stage) { return Danger >= Stage.MinDanger && Danger <= Stage.MaxDanger; });
}

const FShiMethodReadData* AShiGameMode::SelectMethodRead() const
{
    if (MethodHistory.Num() < Campaign.MinimumMethodObservations) return &Campaign.NeutralMethodRead;
    TMap<FString, int32> Counts;
    for (const FString& MethodId : Campaign.MethodIds) Counts.Add(MethodId, 0);
    for (const FString& MethodId : MethodHistory) Counts.FindOrAdd(MethodId) += 1;
    int32 Highest = -1;
    FString Leader;
    bool bTie = false;
    for (const TPair<FString, int32>& Count : Counts)
    {
        if (Count.Value > Highest) { Highest = Count.Value; Leader = Count.Key; bTie = false; }
        else if (Count.Value == Highest) bTie = true;
    }
    if (bTie) return &Campaign.NeutralMethodRead;
    if (const FShiMethodReadData* Read = Campaign.MethodReads.FindByPredicate([&](const FShiMethodReadData& Item) { return Item.TargetMethodId == Leader; })) return Read;
    return &Campaign.NeutralMethodRead;
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
    if (APlayerController* Controller = UGameplayStatics::GetPlayerController(World, 0)) Controller->SetViewTarget(Camera);
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
