#include "ShiGameMode.h"

#include "Camera/CameraActor.h"
#include "Camera/CameraComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
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
#include "Misc/CommandLine.h"
#include "Misc/FileHelper.h"
#include "Misc/ConfigCacheIni.h"
#include "Misc/Parse.h"
#include "Misc/Paths.h"
#include "ShiCommandScreen.h"
#include "ShiCommandSurfacePresentationModel.h"
#include "ShiCommandWeightPresentationModel.h"
#include "ShiCouncilFigure.h"
#include "ShiCouncilStagingModel.h"
#include "ShiDazeFieldShelterPresentationModel.h"
#include "ShiWetFieldEnvironmentPresentationModel.h"
#include "ShiOrderTransactionModel.h"
#include "ShiSoundscapeComponent.h"
#include "ShiWartableModel.h"

namespace
{
    const TCHAR* CinematicSettingsSection = TEXT("/Script/SHI.ShiCinematic");
    constexpr float InspectionFieldOfViewDegrees = 50.f;
}

AShiGameMode::AShiGameMode()
{
    PrimaryActorTick.bCanEverTick = true;
}

void AShiGameMode::BeginPlay()
{
    Super::BeginPlay();
#if !UE_BUILD_SHIPPING
    bCommandWeightReviewBack = FParse::Param(FCommandLine::Get(), TEXT("ShiCommandWeightReviewBack"));
    bCommandWeightReview = bCommandWeightReviewBack
        || FParse::Param(FCommandLine::Get(), TEXT("ShiCommandWeightReviewFront"));
    bCommandSurfaceReview = FParse::Param(FCommandLine::Get(), TEXT("ShiCommandSurfaceReview"));
    bWetFieldEnvironmentReview = FParse::Param(FCommandLine::Get(), TEXT("ShiWetFieldEnvironmentReview"));
    bDazeFieldShelterReview = FParse::Param(FCommandLine::Get(), TEXT("ShiDazeFieldShelterReview"));
#endif
    LoadCinematicPreferences();
    if (!Campaign.LoadCanonical(LoadError))
    {
        UE_LOG(LogTemp, Error, TEXT("SHI campaign load failed: %s"), *LoadError);
    }
    else if (!Engagement.LoadCanonical(Campaign, LoadError))
    {
        LoadError = FString::Printf(TEXT("SHI engagement load failed: %s"), *LoadError);
        UE_LOG(LogTemp, Error, TEXT("%s"), *LoadError);
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

    if (!bCommandWeightReview && !bCommandSurfaceReview && !bWetFieldEnvironmentReview
        && !bDazeFieldShelterReview
        && GEngine && GEngine->GameViewport)
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
    if (IsCinematicSequenceActive() || bEngagementOpen) return;
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(Index) || !CanChoose(Node->Choices[Index]) || Session.IsCompleted()) return;
    SelectedChoiceIndex = Index;
    if (bRestartArmed) SaveStatus = TEXT("RESTART CANCELLED · CURRENT CHRONICLE PRESERVED");
    bRestartArmed = false;
    LastConsequence.Empty();
    FString SignalError;
    if (!RebuildCommandSignals(SignalError))
    {
        LoadError = FString::Printf(TEXT("Command signals rejected: %s"), *SignalError);
        RefreshScreen();
        return;
    }
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("select")));
    RefreshScreen();
}

void AShiGameMode::CycleChoice(int32 Direction)
{
    if (IsCinematicSequenceActive() || bEngagementOpen) return;
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

const FShiCommandSignalData* AShiGameMode::GetInspectedCommandSignal() const
{
    return FShiCommandSignalModel::Find(CommandSignals, InspectedCommandSignalId);
}

const FShiCinematicBeatData* AShiGameMode::GetActiveCinematicBeat() const
{
    return CinematicBeats.IsValidIndex(CinematicBeatIndex) ? &CinematicBeats[CinematicBeatIndex] : nullptr;
}

const FShiCouncilParticipantData* AShiGameMode::GetCouncilSpeaker() const
{
    return FShiCouncilStagingModel::FindParticipant(CouncilStage, TEXT("speaker"));
}

bool AShiGameMode::IsInspectingRemoteSite() const
{
    const FShiNodeData* Node = GetCurrentNode();
    const FShiSiteData* Site = GetInspectedSite();
    return Node && Site && Node->SiteId != Site->Id;
}

void AShiGameMode::CycleInspectedSite(int32 Direction)
{
    if (bEvidenceOpen || bEngagementOpen || IsCinematicSequenceActive() || Direction == 0) return;
    InspectSite(FShiWartableModel::CycleSite(Campaign.Sites, GetInspectedSite() ? GetInspectedSite()->Id : FString(), Direction));
}

void AShiGameMode::CycleInspectedCommandSignal(int32 Direction)
{
    if (bEvidenceOpen || bEngagementOpen || IsCinematicSequenceActive() || Direction == 0) return;
    InspectCommandSignal(FShiCommandSignalModel::CycleSignal(CommandSignals,
        GetInspectedCommandSignal() ? GetInspectedCommandSignal()->Id : FString(), Direction));
}

void AShiGameMode::ResetInspectedSite()
{
    if (bEvidenceOpen || bEngagementOpen || IsCinematicSequenceActive()) return;
    if (const FShiNodeData* Node = GetCurrentNode()) InspectSite(Node->SiteId);
}

void AShiGameMode::PresentCouncil()
{
    if (bEvidenceOpen || bEngagementOpen || IsCinematicSequenceActive()) return;
    FocusCouncil(false, true);
}

bool AShiGameMode::IsEngagementAvailable() const
{
    const FShiNodeData* Node = GetCurrentNode();
    const FShiFieldConditionData* Condition = GetCurrentFieldCondition();
    return !Session.IsCompleted() && Node && Node->Id == Engagement.NodeId && Condition
        && Engagement.FindCondition(Condition->Id) && Node->Choices.IsValidIndex(SelectedChoiceIndex)
        && Engagement.FindPlan(Node->Choices[SelectedChoiceIndex].Id);
}

TArray<const FShiEngagementCommandData*> AShiGameMode::GetAvailableEngagementCommands() const
{
    TArray<const FShiEngagementCommandData*> Commands;
    FString Error;
    if (bEngagementOpen) EngagementSession.AvailableCommands(Commands, Error);
    return Commands;
}

const FShiEngagementCommandData* AShiGameMode::GetSelectedEngagementCommand() const
{
    const TArray<const FShiEngagementCommandData*> Commands = GetAvailableEngagementCommands();
    return Commands.IsValidIndex(SelectedEngagementCommandIndex) ? Commands[SelectedEngagementCommandIndex] : nullptr;
}

void AShiGameMode::OpenEngagement()
{
    if (bEngagementOpen || bEvidenceOpen || IsCinematicSequenceActive() || !IsEngagementAvailable()) return;
    const FShiNodeData* Node = GetCurrentNode();
    const FShiFieldConditionData* Condition = GetCurrentFieldCondition();
    FString Error;
    FString CampaignSnapshot;
    FShiEngagementSession CandidateEngagementSession;
    TArray<FShiEngagementSignalData> CandidateSignals;
    if (!Node || !Condition || !Session.ExportSaveJson(CampaignSnapshot, Error)
        || !CandidateEngagementSession.Initialize(Engagement, Node->Choices[SelectedChoiceIndex].Id, Condition->Id, Error)
        || !FShiEngagementSignalModel::Build(CandidateEngagementSession.GetMetrics(), CandidateSignals, Error))
    {
        LastConsequence = FString::Printf(TEXT("COMMAND EXERCISE HELD · CAMPAIGN UNCHANGED · %s"), *Error);
        RefreshScreen();
        return;
    }
    for (const FShiEngagementSignalData& Signal : CandidateSignals)
    {
        const TWeakObjectPtr<AStaticMeshActor>* Marker = EngagementMetricMarkers.Find(Signal.MetricId);
        if (!Marker || !Marker->IsValid() || !Marker->Get()->GetStaticMeshComponent())
        {
            LastConsequence = FString::Printf(TEXT("COMMAND EXERCISE HELD · CAMPAIGN UNCHANGED · metric actor %s is unavailable"), *Signal.MetricId);
            RefreshScreen();
            return;
        }
    }
    EngagementSession = MoveTemp(CandidateEngagementSession);
    EngagementSignals = MoveTemp(CandidateSignals);
    EngagementCampaignSnapshot = MoveTemp(CampaignSnapshot);
    SelectedEngagementCommandIndex = 0;
    bEngagementOpen = true;
    bCouncilFocused = false;
    ApplyEngagementCommandSpace(true);
    BeginCameraTransition(FShiEngagementSignalModel::CameraTransform(), .72f, 48.f);
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("drawer")));
    RefreshScreen();
}

void AShiGameMode::CloseEngagement()
{
    if (!bEngagementOpen) return;
    FString Error;
    if (!CampaignMatchesEngagementSnapshot(Error))
    {
        LoadError = FString::Printf(TEXT("Engagement authority guard failed: %s"), *Error);
        RefreshScreen();
        return;
    }
    if (EngagementSession.IsCompleted())
    {
        const FShiEngagementOutcomeData* Outcome = Engagement.FindOutcome(EngagementSession.GetOutcomeId());
        LastConsequence = Outcome
            ? FString::Printf(TEXT("NATIVE COMMAND EXERCISE · %s · CAMPAIGN SAVE UNCHANGED\n%s"),
                *Outcome->Title.Resolve(Locale).ToUpper(), *Outcome->Summary.Resolve(Locale))
            : TEXT("NATIVE COMMAND EXERCISE CLOSED · CAMPAIGN SAVE UNCHANGED");
    }
    else LastConsequence = TEXT("NATIVE COMMAND EXERCISE CLOSED EARLY · CAMPAIGN SAVE UNCHANGED");
    bEngagementOpen = false;
    SelectedEngagementCommandIndex = 0;
    EngagementCampaignSnapshot.Empty();
    ApplyEngagementCommandSpace(false);
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("close")));
    FocusCouncil(false, false);
}

void AShiGameMode::SelectEngagementCommand(int32 Index)
{
    if (!bEngagementOpen || EngagementSession.IsCompleted()) return;
    const TArray<const FShiEngagementCommandData*> Commands = GetAvailableEngagementCommands();
    if (!Commands.IsValidIndex(Index)) return;
    SelectedEngagementCommandIndex = Index;
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("select")));
    RefreshScreen();
}

void AShiGameMode::CycleEngagementCommand(int32 Direction)
{
    if (!bEngagementOpen || EngagementSession.IsCompleted() || Direction == 0) return;
    const TArray<const FShiEngagementCommandData*> Commands = GetAvailableEngagementCommands();
    if (Commands.IsEmpty()) return;
    SelectEngagementCommand((SelectedEngagementCommandIndex + (Direction < 0 ? -1 : 1) + Commands.Num()) % Commands.Num());
}

void AShiGameMode::IssueEngagementCommand()
{
    if (!bEngagementOpen || EngagementSession.IsCompleted()) return;
    const FShiEngagementCommandData* Selected = GetSelectedEngagementCommand();
    if (!Selected) return;
    FString Error;
    if (!CampaignMatchesEngagementSnapshot(Error))
    {
        LoadError = FString::Printf(TEXT("Engagement authority guard failed before command: %s"), *Error);
        RefreshScreen();
        return;
    }
    FShiEngagementSession Candidate = EngagementSession;
    FShiEngagementCommandRecord Record;
    TArray<FShiEngagementSignalData> CandidateSignals;
    if (!Candidate.ResolveCommand(Selected->Id, Record, Error)
        || !FShiEngagementSignalModel::Build(Candidate.GetMetrics(), CandidateSignals, Error)
        || !CampaignMatchesEngagementSnapshot(Error))
    {
        LastConsequence = FString::Printf(TEXT("COMMAND HELD · EXERCISE AND CAMPAIGN UNCHANGED · %s"), *Error);
        RefreshScreen();
        return;
    }
    for (const FShiEngagementSignalData& Signal : CandidateSignals)
    {
        const TWeakObjectPtr<AStaticMeshActor>* Marker = EngagementMetricMarkers.Find(Signal.MetricId);
        if (!Marker || !Marker->IsValid() || !Marker->Get()->GetStaticMeshComponent())
        {
            LastConsequence = FString::Printf(TEXT("COMMAND HELD · EXERCISE AND CAMPAIGN UNCHANGED · metric actor %s is unavailable"), *Signal.MetricId);
            RefreshScreen();
            return;
        }
    }
    EngagementSession = MoveTemp(Candidate);
    EngagementSignals = MoveTemp(CandidateSignals);
    SelectedEngagementCommandIndex = 0;
    ApplyEngagementCommandSpace(true);
    ResumeSoundFromGesture();
    if (AudioDirector) AudioDirector->PlayCue(EngagementSession.IsCompleted() ? FName(TEXT("ending")) : FName(TEXT("commit")));
    RefreshScreen();
}

void AShiGameMode::IssueSelectedOrder()
{
    if (bEngagementOpen) { IssueEngagementCommand(); return; }
    if (IsCinematicSequenceActive()) return;
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || !Node->Choices.IsValidIndex(SelectedChoiceIndex) || !CanChoose(Node->Choices[SelectedChoiceIndex]) || Session.IsCompleted()) return;
    const double Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
    if (Now - LastOrderIssueTime < 0.15) return;
    LastOrderIssueTime = Now;
    const FString ChoiceId = Node->Choices[SelectedChoiceIndex].Id;
    FShiOrderTransactionData Transaction;
    FString TransactionError;
    if (!FShiOrderTransactionModel::Build(Session, Campaign, ChoiceId, Locale, Transaction, TransactionError))
    {
        LastConsequence = FString::Printf(TEXT("ORDER HELD · CHRONICLE UNCHANGED · %s"), *TransactionError);
        RefreshScreen();
        return;
    }
    if (!CanPresentResolutionSequence(Transaction.CommandSignals, Transaction.CinematicBeats, TransactionError)
        || !CanPresentCouncilStage(Transaction.CouncilStage, TransactionError))
    {
        LastConsequence = FString::Printf(TEXT("ORDER HELD · WORLD PREFLIGHT FAILED · CHRONICLE UNCHANGED · %s"), *TransactionError);
        RefreshScreen();
        return;
    }
    if (bPersistenceEnabled && !SaveChronicle(Transaction.Session, TransactionError))
    {
        SaveStatus = FString::Printf(TEXT("ORDER NOT ISSUED · AUTOSAVE FAILED · %s"), *TransactionError);
        LastConsequence = TEXT("ORDER HELD · THE PREVIOUS CHRONICLE AND WORLD POSITION REMAIN AUTHORITATIVE");
        RefreshScreen();
        return;
    }

    const FShiResolutionResult Resolution = Transaction.Resolution;
    Session = MoveTemp(Transaction.Session);
    CommandSignals = MoveTemp(Transaction.CommandSignals);
    CouncilStage = MoveTemp(Transaction.CouncilStage);
    SelectedChoiceIndex = Transaction.SelectedChoiceIndex;
    ApplyCouncilStage();
    UpdateCommandSignalSelection();
    ResumeSoundFromGesture();
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
    if (bPersistenceEnabled)
    {
        SaveStatus = FString::Printf(TEXT("AUTOSAVED · %d DECISIONS · TRANSACTION VERIFIED"), Session.GetHistory().Num());
    }
    else SaveStatus = TEXT("UNSAVED PREVIEW ADVANCED · REJECTED LOCAL SAVE REMAINS UNCHANGED");
    if (AudioDirector)
    {
        const FName Cue = !Session.GetFailureReason().IsEmpty() ? FName(TEXT("failure"))
            : Session.IsCompleted() ? FName(TEXT("ending")) : FName(TEXT("commit"));
        AudioDirector->PlayCue(Cue);
    }
    BeginPreparedResolutionSequence(MoveTemp(Transaction.CinematicBeats));
    RefreshScreen();
}

void AShiGameMode::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    APlayerController* Controller = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (IsCinematicSequenceActive())
    {
        const bool bSkip = Controller && (Controller->WasInputKeyJustPressed(EKeys::SpaceBar)
            || Controller->WasInputKeyJustPressed(EKeys::Escape)
            || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Right));
        if (bSkip) SkipCinematicSequence();
        else TickCinematicSequence(DeltaSeconds);
        return;
    }
    if (Controller)
    {
        const bool bEvidenceToggle = Controller->WasInputKeyJustPressed(EKeys::E)
            || Controller->WasInputKeyJustPressed(EKeys::Gamepad_LeftShoulder);
        if (bEngagementOpen)
        {
            if (Controller->WasInputKeyJustPressed(EKeys::X)
                || Controller->WasInputKeyJustPressed(EKeys::Escape)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Left)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Right)) CloseEngagement();
            else if (Controller->WasInputKeyJustPressed(EKeys::Left)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Left)) CycleEngagementCommand(-1);
            else if (Controller->WasInputKeyJustPressed(EKeys::Right)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Right)) CycleEngagementCommand(1);
            else if (Controller->WasInputKeyJustPressed(EKeys::Enter)
                || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Bottom)) IssueEngagementCommand();
            TickCamera(DeltaSeconds);
            return;
        }
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
        if ((Controller->WasInputKeyJustPressed(EKeys::X)
            || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Left)) && IsEngagementAvailable())
        {
            OpenEngagement();
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::LeftMouseButton) && InspectWorldUnderCursor(*Controller)) return;
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
        if (Controller->WasInputKeyJustPressed(EKeys::D) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_RightThumbstick))
        {
            PresentCouncil();
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::C) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_LeftThumbstick))
        {
            const bool bReverse = Controller->IsInputKeyDown(EKeys::LeftShift) || Controller->IsInputKeyDown(EKeys::RightShift);
            CycleInspectedCommandSignal(bReverse ? -1 : 1);
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::V) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_Special_Right))
        {
            ToggleReducedMotion();
            return;
        }
        if (Controller->WasInputKeyJustPressed(EKeys::One) || Controller->WasInputKeyJustPressed(EKeys::NumPadOne)) SelectChoice(0);
        if (Controller->WasInputKeyJustPressed(EKeys::Two) || Controller->WasInputKeyJustPressed(EKeys::NumPadTwo)) SelectChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Three) || Controller->WasInputKeyJustPressed(EKeys::NumPadThree)) SelectChoice(2);
        if (Controller->WasInputKeyJustPressed(EKeys::Left) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Left)) CycleChoice(-1);
        if (Controller->WasInputKeyJustPressed(EKeys::Right) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_DPad_Right)) CycleChoice(1);
        if (Controller->WasInputKeyJustPressed(EKeys::Enter) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Bottom)) IssueSelectedOrder();
        if (Controller->WasInputKeyJustPressed(EKeys::M) || Controller->WasInputKeyJustPressed(EKeys::Gamepad_FaceButton_Top)) ToggleSound();
        if (Controller->WasInputKeyJustPressed(EKeys::SpaceBar))
        {
            if (CameraTransitionDuration > 0.f) CameraTransitionElapsed = CameraTransitionDuration;
        }
    }
    TickCamera(DeltaSeconds);
}

void AShiGameMode::BeginCameraTransition(const FTransform& Target, float Duration, float FieldOfViewDegrees)
{
    if (!CommandCamera.IsValid()) return;
    if (bReducedMotion)
    {
        SetCameraImmediate(Target, FieldOfViewDegrees);
        return;
    }
    CameraTransitionStartLocation = CommandCamera->GetActorLocation();
    CameraTransitionStartRotation = CommandCamera->GetActorRotation();
    CameraTransitionTargetLocation = Target.GetLocation();
    CameraTransitionTargetRotation = Target.GetRotation().Rotator();
    CameraTransitionStartFieldOfView = CommandCamera->GetCameraComponent()->FieldOfView;
    CameraTransitionTargetFieldOfView = FMath::Clamp(FieldOfViewDegrees, 35.f, 65.f);
    CameraTransitionElapsed = 0.f;
    CameraTransitionDuration = FMath::Max(Duration, .01f);
}

void AShiGameMode::SetCameraImmediate(const FTransform& Target, float FieldOfViewDegrees)
{
    if (!CommandCamera.IsValid()) return;
    CameraTransitionDuration = 0.f;
    CameraTransitionElapsed = 0.f;
    CameraBaseLocation = Target.GetLocation();
    CameraBaseRotation = Target.GetRotation().Rotator();
    CameraTransitionTargetLocation = CameraBaseLocation;
    CameraTransitionTargetRotation = CameraBaseRotation;
    CameraTransitionTargetFieldOfView = FMath::Clamp(FieldOfViewDegrees, 35.f, 65.f);
    CameraTransitionStartFieldOfView = CameraTransitionTargetFieldOfView;
    CommandCamera->SetActorLocation(CameraBaseLocation);
    CommandCamera->SetActorRotation(CameraBaseRotation);
    CommandCamera->GetCameraComponent()->SetFieldOfView(CameraTransitionTargetFieldOfView);
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
        CommandCamera->GetCameraComponent()->SetFieldOfView(FMath::Lerp(CameraTransitionStartFieldOfView, CameraTransitionTargetFieldOfView, Ease));
        if (Alpha >= 1.f)
        {
            CameraBaseLocation = CameraTransitionTargetLocation;
            CameraBaseRotation = CameraTransitionTargetRotation;
            CameraTransitionDuration = 0.f;
        }
        return;
    }
}

bool AShiGameMode::CanPresentCommandSignals(const TArray<FShiCommandSignalData>& PreparedSignals, FString& OutError) const
{
    for (const FShiCommandSignalData& Signal : PreparedSignals)
    {
        const TWeakObjectPtr<AStaticMeshActor>* Actor = CommandSignalMarkers.Find(Signal.Id);
        if (!Actor || !Actor->IsValid() || !Actor->Get()->GetStaticMeshComponent())
        {
            OutError = FString::Printf(TEXT("Prepared command signal %s has no live world actor."), *Signal.Id);
            return false;
        }
    }
    OutError.Empty();
    return true;
}

bool AShiGameMode::CanPresentResolutionSequence(const TArray<FShiCommandSignalData>& PreparedSignals,
    const TArray<FShiCinematicBeatData>& PreparedBeats, FString& OutError) const
{
    if (!CommandCamera.IsValid())
    {
        OutError = TEXT("Cinematic consequence camera is unavailable.");
        return false;
    }
    if (!CanPresentCommandSignals(PreparedSignals, OutError)) return false;
    for (const FShiCinematicBeatData& Beat : PreparedBeats)
    {
        const TWeakObjectPtr<AStaticMeshActor>* Actor = Beat.FocusKind == TEXT("signal")
            ? CommandSignalMarkers.Find(Beat.FocusId) : SiteMarkers.Find(Beat.FocusId);
        if (!Actor || !Actor->IsValid())
        {
            OutError = FString::Printf(TEXT("Cinematic beat %s has no live world actor."), *Beat.Id);
            return false;
        }
    }
    OutError.Empty();
    return true;
}

bool AShiGameMode::CanPresentCouncilStage(const FShiCouncilStageData& PreparedStage, FString& OutError) const
{
    const FShiNodeData* Node = Campaign.FindNode(PreparedStage.NodeId);
    if (!CommandCamera.IsValid() || !Node || !FShiCouncilStagingModel::Validate(Campaign, *Node, Locale, PreparedStage, OutError))
    {
        if (OutError.IsEmpty()) OutError = TEXT("Prepared council stage has no live camera or canonical node.");
        return false;
    }
    for (const FShiCouncilParticipantData& Participant : PreparedStage.Participants)
    {
        const TWeakObjectPtr<AShiCouncilFigure>* Figure = CouncilFigures.Find(Participant.SlotId);
        if (!Figure || !Figure->IsValid() || Figure->Get()->GetSlotId() != Participant.SlotId)
        {
            OutError = FString::Printf(TEXT("Prepared council slot %s has no initialized live figure."), *Participant.SlotId);
            return false;
        }
    }
    OutError.Empty();
    return true;
}

void AShiGameMode::ApplyCouncilStage()
{
    for (const FShiCouncilParticipantData& Participant : CouncilStage.Participants)
    {
        if (TWeakObjectPtr<AShiCouncilFigure>* Figure = CouncilFigures.Find(Participant.SlotId))
            if (Figure->IsValid()) Figure->Get()->ApplyParticipant(Participant);
    }
}

void AShiGameMode::BeginPreparedResolutionSequence(TArray<FShiCinematicBeatData>&& PreparedBeats)
{
    CinematicBeats = MoveTemp(PreparedBeats);
    CinematicBeatIndex = 0;
    CinematicHoldElapsed = 0.f;
    bCinematicHolding = false;
    if (const FShiNodeData* PositionNode = GetCurrentNode()) InspectedSiteId = PositionNode->SiteId;
    InspectedCommandSignalId.Empty();
    bCouncilFocused = false;
    StartCinematicBeat();
}

void AShiGameMode::StartCinematicBeat()
{
    const FShiCinematicBeatData* Beat = GetActiveCinematicBeat();
    if (!Beat)
    {
        CompleteCinematicSequence();
        return;
    }
    if (!CommandCamera.IsValid())
    {
        CompleteCinematicSequence();
        return;
    }

    FTransform Target;
    if (Beat->FocusKind == TEXT("signal"))
    {
        const FShiCommandSignalData* Signal = FShiCommandSignalModel::Find(CommandSignals, Beat->FocusId);
        if (!Signal)
        {
            LoadError = FString::Printf(TEXT("Cinematic focus signal %s disappeared."), *Beat->FocusId);
            CompleteCinematicSequence();
            return;
        }
        Target = FShiCommandSignalModel::CameraTransform(*Signal);
    }
    else
    {
        const FShiSiteData* Site = Campaign.FindSite(Beat->FocusId);
        if (!Site)
        {
            LoadError = FString::Printf(TEXT("Cinematic focus site %s disappeared."), *Beat->FocusId);
            CompleteCinematicSequence();
            return;
        }
        Target = FShiWartableModel::CameraTransform(*Site);
    }

    CinematicHoldElapsed = 0.f;
    bCinematicHolding = false;
    if (bReducedMotion || Beat->CameraMotion == TEXT("cut"))
    {
        SetCameraImmediate(Target, Beat->FieldOfViewDegrees);
        bCinematicHolding = true;
        CinematicHoldElapsed = -Beat->TransitionSeconds;
    }
    else
    {
        BeginCameraTransition(Target, Beat->TransitionSeconds, Beat->FieldOfViewDegrees);
    }
    UpdateWartableSelection();
    UpdateCommandSignalSelection();
    RefreshScreen();
}

void AShiGameMode::TickCinematicSequence(float DeltaSeconds)
{
    const FShiCinematicBeatData* Beat = GetActiveCinematicBeat();
    if (!Beat) return;
    const bool bWasTransitioning = CameraTransitionDuration > 0.f;
    TickCamera(DeltaSeconds);
    if (bWasTransitioning)
    {
        if (CameraTransitionDuration <= 0.f)
        {
            bCinematicHolding = true;
            CinematicHoldElapsed = 0.f;
        }
        return;
    }
    if (!bCinematicHolding) bCinematicHolding = true;
    CinematicHoldElapsed += DeltaSeconds;
    if (CinematicHoldElapsed < Beat->HoldSeconds) return;

    ++CinematicBeatIndex;
    if (IsCinematicSequenceActive()) StartCinematicBeat();
    else CompleteCinematicSequence();
}

void AShiGameMode::SkipCinematicSequence()
{
    if (!IsCinematicSequenceActive()) return;
    CompleteCinematicSequence();
}

void AShiGameMode::CompleteCinematicSequence()
{
    CinematicBeats.Empty();
    CinematicBeatIndex = INDEX_NONE;
    CinematicHoldElapsed = 0.f;
    bCinematicHolding = false;
    CameraTransitionDuration = 0.f;
    if (GetCurrentNode()) FocusCouncil(false, false);
    else
    {
        UpdateWartableSelection();
        UpdateCommandSignalSelection();
        RefreshScreen();
    }
}

void AShiGameMode::InspectSite(const FString& SiteId, bool bImmediate, bool bPlayCue)
{
    const FShiSiteData* Site = Campaign.FindSite(SiteId);
    if (!Site) return;
    const bool bChanged = InspectedSiteId != SiteId;
    const bool bReturningFromCommandSignal = !InspectedCommandSignalId.IsEmpty();
    InspectedSiteId = SiteId;
    InspectedCommandSignalId.Empty();
    bCouncilFocused = false;
    UpdateWartableSelection();
    UpdateCommandSignalSelection();
    const FTransform Target = FShiWartableModel::CameraTransform(*Site);
    if (bImmediate && CommandCamera.IsValid())
    {
        SetCameraImmediate(Target, InspectionFieldOfViewDegrees);
    }
    else if (bChanged || bReturningFromCommandSignal || CameraTransitionDuration <= 0.f)
    {
        BeginCameraTransition(Target, .72f, InspectionFieldOfViewDegrees);
    }
    if (bPlayCue)
    {
        ResumeSoundFromGesture();
        if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("inspect")));
    }
    RefreshScreen();
}

void AShiGameMode::InspectCommandSignal(const FString& SignalId, bool bPlayCue)
{
    const FShiCommandSignalData* Signal = FShiCommandSignalModel::Find(CommandSignals, SignalId);
    if (!Signal) return;
    if (const FShiNodeData* Node = GetCurrentNode()) InspectedSiteId = Node->SiteId;
    InspectedCommandSignalId = SignalId;
    bCouncilFocused = false;
    UpdateWartableSelection();
    UpdateCommandSignalSelection();
    BeginCameraTransition(FShiCommandSignalModel::CameraTransform(*Signal), .64f, InspectionFieldOfViewDegrees);
    if (bPlayCue)
    {
        ResumeSoundFromGesture();
        if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("inspect")));
    }
    RefreshScreen();
}

void AShiGameMode::FocusCouncil(bool bImmediate, bool bPlayCue)
{
    const FShiNodeData* Node = GetCurrentNode();
    if (!Node || CouncilStage.NodeId != Node->Id || !CommandCamera.IsValid()) return;
    InspectedSiteId = Node->SiteId;
    InspectedCommandSignalId.Empty();
    bCouncilFocused = true;
    UpdateWartableSelection();
    UpdateCommandSignalSelection();
    if (bImmediate) SetCameraImmediate(CouncilStage.CameraTransform, CouncilStage.FieldOfViewDegrees);
    else BeginCameraTransition(CouncilStage.CameraTransform, .82f, CouncilStage.FieldOfViewDegrees);
    if (bPlayCue)
    {
        ResumeSoundFromGesture();
        if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("inspect")));
    }
    RefreshScreen();
}

bool AShiGameMode::InspectWorldUnderCursor(APlayerController& Controller)
{
    float MouseX = 0.f;
    float MouseY = 0.f;
    if (!Controller.GetMousePosition(MouseX, MouseY)) return false;
    FHitResult Hit;
    if (!Controller.GetHitResultAtScreenPosition(FVector2D(MouseX, MouseY), ECC_Visibility, false, Hit)) return false;
    AActor* HitActor = Hit.GetActor();
    for (const TPair<FString, TWeakObjectPtr<AShiCouncilFigure>>& Pair : CouncilFigures)
    {
        if (Pair.Value.Get() == HitActor)
        {
            PresentCouncil();
            return true;
        }
    }
    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : CommandSignalMarkers)
    {
        if (Pair.Value.Get() == HitActor)
        {
            InspectCommandSignal(Pair.Key);
            return true;
        }
    }
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
    const FShiCinematicBeatData* CinematicBeat = GetActiveCinematicBeat();
    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : SiteMarkers)
    {
        AStaticMeshActor* Marker = Pair.Value.Get();
        const FShiSiteData* Site = Campaign.FindSite(Pair.Key);
        if (!Marker || !Site) continue;
        const bool bSelected = CinematicBeat
            ? CinematicBeat->FocusKind == TEXT("site") && Pair.Key == CinematicBeat->FocusId
            : !bCouncilFocused && InspectedCommandSignalId.IsEmpty() && Pair.Key == InspectedSiteId;
        const FShiWartableMarkerStyle Style = FShiWartableModel::MarkerStyle(Site->Status, bSelected);
        Marker->SetActorScale3D(Style.Scale);
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetRenderCustomDepth(bSelected);
        Component->SetCustomDepthStencilValue(Style.StencilValue);
        if (UMaterialInstanceDynamic* Material = Cast<UMaterialInstanceDynamic>(Component->GetMaterial(0)))
            Material->SetVectorParameterValue(FName(TEXT("Color")), Style.Color);
    }
}

bool AShiGameMode::RebuildCommandSignals(FString& OutError)
{
    const FShiNodeData* Node = GetCurrentNode();
    const FShiChoiceData* SelectedChoice = Node && Node->Choices.IsValidIndex(SelectedChoiceIndex)
        ? &Node->Choices[SelectedChoiceIndex] : nullptr;
    TArray<FShiCommandSignalData> Candidate;
    if (!FShiCommandSignalModel::Build(Session.GetResources(), Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(),
        Session.GetCurrentMethodRead(), Session.GetActiveCommitment(), SelectedChoice, Locale, Candidate, OutError)) return false;
    if (!FShiCommandSignalModel::ValidateAgainstSites(Candidate, Campaign.Sites, OutError)) return false;
    CommandSignals = MoveTemp(Candidate);
    if (!InspectedCommandSignalId.IsEmpty() && !FShiCommandSignalModel::Find(CommandSignals, InspectedCommandSignalId))
        InspectedCommandSignalId.Empty();
    UpdateCommandSignalSelection();
    return true;
}

bool AShiGameMode::CampaignMatchesEngagementSnapshot(FString& OutError) const
{
    if (EngagementCampaignSnapshot.IsEmpty())
    {
        OutError = TEXT("the protected campaign snapshot is unavailable");
        return false;
    }
    FString CurrentCampaign;
    if (!Session.ExportSaveJson(CurrentCampaign, OutError)) return false;
    if (CurrentCampaign != EngagementCampaignSnapshot)
    {
        OutError = TEXT("the campaign save changed while the non-authoritative exercise was open");
        return false;
    }
    OutError.Empty();
    return true;
}

void AShiGameMode::ApplyEngagementCommandSpace(bool bVisible)
{
    const auto SetStandardVisibility = [bVisible](const auto& Markers)
    {
        for (const auto& Pair : Markers)
        {
            if (AActor* Actor = Pair.Value.Get())
            {
                Actor->SetActorHiddenInGame(bVisible);
                Actor->SetActorEnableCollision(!bVisible);
            }
        }
    };
    SetStandardVisibility(SiteMarkers);
    SetStandardVisibility(CommandSignalMarkers);
    SetStandardVisibility(CouncilFigures);
    if (AStaticMeshActor* Prop = CommandWeightProp.Get())
    {
        Prop->SetActorHiddenInGame(bVisible);
        Prop->SetActorEnableCollision(false);
    }

    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : EngagementMetricMarkers)
    {
        AStaticMeshActor* Marker = Pair.Value.Get();
        const FShiEngagementSignalData* Signal = EngagementSignals.FindByPredicate(
            [&Pair](const FShiEngagementSignalData& Item) { return Item.MetricId == Pair.Key; });
        if (!Marker || !Signal || !Marker->GetStaticMeshComponent()) continue;
        Marker->SetActorLocation(Signal->Location);
        Marker->SetActorScale3D(Signal->Scale);
        Marker->SetActorHiddenInGame(!bVisible);
        Marker->SetActorEnableCollision(bVisible);
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetRenderCustomDepth(bVisible);
        Component->SetCustomDepthStencilValue(Signal->StencilValue);
        if (UMaterialInstanceDynamic* Material = Cast<UMaterialInstanceDynamic>(Component->GetMaterial(0)))
            Material->SetVectorParameterValue(FName(TEXT("Color")), Signal->Color);
    }
}

void AShiGameMode::UpdateCommandSignalSelection()
{
    const FShiCinematicBeatData* CinematicBeat = GetActiveCinematicBeat();
    for (const TPair<FString, TWeakObjectPtr<AStaticMeshActor>>& Pair : CommandSignalMarkers)
    {
        AStaticMeshActor* Marker = Pair.Value.Get();
        const FShiCommandSignalData* Signal = FShiCommandSignalModel::Find(CommandSignals, Pair.Key);
        if (!Marker || !Signal) continue;
        const bool bSelected = CinematicBeat
            ? CinematicBeat->FocusKind == TEXT("signal") && Pair.Key == CinematicBeat->FocusId
            : !bCouncilFocused && Pair.Key == InspectedCommandSignalId;
        const FShiCommandSignalData Style = FShiCommandSignalModel::SelectedStyle(*Signal, bSelected);
        Marker->SetActorLocationAndRotation(Style.Location, Style.Rotation);
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
    return SaveChronicle(Session, OutError);
}

bool AShiGameMode::SaveChronicle(const FShiCampaignSession& SourceSession, FString& OutError) const
{
    FString Json;
    if (!SourceSession.ExportSaveJson(Json, OutError)) return false;
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
    if (!LoadError.IsEmpty() || bEngagementOpen || IsCinematicSequenceActive()) return;
    if (!bRestartArmed)
    {
        bRestartArmed = true;
        SaveStatus = TEXT("RESTART ARMED · PRESS NEW CHRONICLE AGAIN TO REPLACE THE LOCAL RUN");
        RefreshScreen();
        return;
    }
    FShiCampaignSession CandidateSession;
    CandidateSession.Initialize(Campaign, CampaignSeed);
    int32 CandidateSelection = INDEX_NONE;
    TArray<FShiCommandSignalData> CandidateSignals;
    FShiCouncilStageData CandidateCouncilStage;
    FString RestartError;
    if (!FShiOrderTransactionModel::BuildTurnSnapshot(CandidateSession, Campaign, Locale,
        CandidateSelection, CandidateSignals, CandidateCouncilStage, RestartError)
        || !CanPresentCommandSignals(CandidateSignals, RestartError)
        || !CanPresentCouncilStage(CandidateCouncilStage, RestartError))
    {
        SaveStatus = FString::Printf(TEXT("RESTART HELD · CURRENT CHRONICLE PRESERVED · %s"), *RestartError);
        RefreshScreen();
        return;
    }
    if (!SaveChronicle(CandidateSession, RestartError))
    {
        SaveStatus = FString::Printf(TEXT("RESTART NOT APPLIED · CURRENT CHRONICLE PRESERVED · %s"), *RestartError);
        RefreshScreen();
        return;
    }
    Session = MoveTemp(CandidateSession);
    CommandSignals = MoveTemp(CandidateSignals);
    CouncilStage = MoveTemp(CandidateCouncilStage);
    SelectedChoiceIndex = CandidateSelection;
    LastConsequence.Empty();
    ApplyCouncilStage();
    UpdateCommandSignalSelection();
    bPersistenceEnabled = true;
    bRestartArmed = false;
    SaveStatus = TEXT("NEW CHRONICLE · AUTOSAVED LOCALLY · RESTART TRANSACTION VERIFIED");
    if (AudioDirector) AudioDirector->PlayCue(FName(TEXT("close")));
    if (GetCurrentNode()) FocusCouncil(false, false);
    RefreshScreen();
}

void AShiGameMode::ToggleEvidence()
{
    if (!LoadError.IsEmpty() || bEngagementOpen || IsCinematicSequenceActive()) return;
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
    if (!IsAudioReady() || IsCinematicSequenceActive()) return;
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
    if (!IsAudioReady() || IsCinematicSequenceActive() || Direction == 0) return;
    if (!AudioDirector->IsSoundEnabled()) AudioDirector->SetSoundEnabled(true);
    AudioDirector->SetAmbienceLevel(AudioDirector->GetAmbienceLevel() + Direction * .05f);
    AudioDirector->PlayCue(FName(TEXT("inspect")));
    AudioStatus = FString::Printf(TEXT("RAIN %d%% · PERSISTED LOCALLY"), FMath::RoundToInt(AudioDirector->GetAmbienceLevel() * 100.f));
    RefreshScreen();
}

void AShiGameMode::AdjustEffects(int32 Direction)
{
    if (!IsAudioReady() || IsCinematicSequenceActive() || Direction == 0) return;
    if (!AudioDirector->IsSoundEnabled()) AudioDirector->SetSoundEnabled(true);
    AudioDirector->SetEffectsLevel(AudioDirector->GetEffectsLevel() + Direction * .05f);
    AudioDirector->PlayCue(FName(TEXT("select")));
    AudioStatus = FString::Printf(TEXT("CUES %d%% · PERSISTED LOCALLY"), FMath::RoundToInt(AudioDirector->GetEffectsLevel() * 100.f));
    RefreshScreen();
}

void AShiGameMode::ToggleReducedMotion()
{
    if (!LoadError.IsEmpty() || bEvidenceOpen || bEngagementOpen || IsCinematicSequenceActive()) return;
    bReducedMotion = !bReducedMotion;
    if (bReducedMotion && CameraTransitionDuration > 0.f)
        SetCameraImmediate(FTransform(CameraTransitionTargetRotation, CameraTransitionTargetLocation), CameraTransitionTargetFieldOfView);
    SaveCinematicPreferences();
    if (AudioDirector) AudioDirector->PlayCue(bReducedMotion ? FName(TEXT("close")) : FName(TEXT("drawer")));
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

void AShiGameMode::LoadCinematicPreferences()
{
    bReducedMotion = false;
    if (GConfig) GConfig->GetBool(CinematicSettingsSection, TEXT("ReducedMotion"), bReducedMotion, GGameUserSettingsIni);
}

void AShiGameMode::SaveCinematicPreferences() const
{
    if (!GConfig) return;
    GConfig->SetBool(CinematicSettingsSection, TEXT("ReducedMotion"), bReducedMotion, GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);
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
    FString CommandSignalError;
    if (!RebuildCommandSignals(CommandSignalError))
    {
        LoadError = FString::Printf(TEXT("Command signals rejected: %s"), *CommandSignalError);
        return;
    }
    const FShiNodeData* OpeningNode = GetCurrentNode();
    FShiCouncilStageData OpeningCouncilStage;
    FString CouncilError;
    if (!OpeningNode || !FShiCouncilStagingModel::Build(Campaign, *OpeningNode, Locale, OpeningCouncilStage, CouncilError))
    {
        LoadError = FString::Printf(TEXT("Council staging rejected: %s"), *CouncilError);
        return;
    }
    ACameraActor* Camera = World->SpawnActor<ACameraActor>(FVector(720, -760, 520), FRotator(-24, 133, 0));
    if (!Camera)
    {
        LoadError = TEXT("Cinematic command camera could not spawn.");
        return;
    }
    CommandCamera = Camera;
    Camera->GetCameraComponent()->SetFieldOfView(InspectionFieldOfViewDegrees);
    Camera->GetCameraComponent()->PostProcessSettings.bOverride_AutoExposureBias = true;
    Camera->GetCameraComponent()->PostProcessSettings.AutoExposureBias =
        FShiWetFieldEnvironmentPresentationModel::ExposureCompensation();
    Camera->GetCameraComponent()->PostProcessBlendWeight = 1.f;
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
    if (Fire)
    {
        if (UPointLightComponent* FireLight = Cast<UPointLightComponent>(Fire->GetLightComponent()))
        {
            FireLight->SetIntensity(1850.f);
            FireLight->SetLightColor(FLinearColor(1.f, 0.36f, 0.10f));
            FireLight->SetAttenuationRadius(720.f);
        }
    }
    AExponentialHeightFog* Fog = World->SpawnActor<AExponentialHeightFog>();
    if (Fog) Fog->GetComponent()->SetFogDensity(0.025f);

    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    UStaticMesh* Cylinder = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    UStaticMesh* Sphere = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    if (!Cube || !Cylinder || !Sphere)
    {
        LoadError = TEXT("Required engine-native command-space meshes are unavailable.");
        return;
    }
    const FShiWetFieldEnvironmentPresentationData WetFieldPresentation = FShiWetFieldEnvironmentPresentationModel::Build();
    FString WetFieldError;
    if (!FShiWetFieldEnvironmentPresentationModel::Validate(WetFieldPresentation, WetFieldError))
    {
        LoadError = FString::Printf(TEXT("Wet-field environment presentation rejected: %s"), *WetFieldError);
        return;
    }
    UStaticMesh* WetFieldMesh = LoadObject<UStaticMesh>(nullptr, *WetFieldPresentation.MeshPath);
    if (!WetFieldMesh)
    {
        LoadError = TEXT("Reviewed wet-field environment mesh is unavailable.");
        return;
    }
    const FBox WetFieldBounds = WetFieldMesh->GetBoundingBox();
    TSet<FName> WetFieldMaterialSlots;
    for (const FStaticMaterial& Material : WetFieldMesh->GetStaticMaterials())
    {
        WetFieldMaterialSlots.Add(Material.MaterialSlotName);
    }
    if (!WetFieldBounds.Min.Equals(WetFieldPresentation.BoundsMinimum, .08f)
        || !WetFieldBounds.Max.Equals(WetFieldPresentation.BoundsMaximum, .08f)
        || WetFieldMaterialSlots.Num() != 2
        || !WetFieldMaterialSlots.Contains(FName(TEXT("M_SHI_WetFieldGround")))
        || !WetFieldMaterialSlots.Contains(FName(TEXT("M_SHI_ShallowRainwater"))))
    {
        LoadError = TEXT("Reviewed wet-field runtime bounds or material slots drifted from the admitted asset.");
        return;
    }
    AStaticMeshActor* WetFieldEnvironment = World->SpawnActor<AStaticMeshActor>(
        WetFieldPresentation.Transform.GetLocation(), WetFieldPresentation.Transform.Rotator());
    if (!WetFieldEnvironment)
    {
        LoadError = TEXT("Reviewed wet-field environment could not spawn.");
        return;
    }
    UStaticMeshComponent* WetFieldComponent = WetFieldEnvironment->GetStaticMeshComponent();
    WetFieldComponent->SetMobility(EComponentMobility::Movable);
    WetFieldComponent->SetStaticMesh(WetFieldMesh);
    WetFieldComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    WetFieldComponent->SetGenerateOverlapEvents(false);
    WetFieldComponent->SetCanEverAffectNavigation(false);
    WetFieldEnvironment->SetActorScale3D(WetFieldPresentation.Transform.GetScale3D());
    WetFieldEnvironment->SetActorEnableCollision(false);
    WetFieldEnvironment->Tags.Add(FName(TEXT("ShiEnvironment:WetField")));
    WetFieldEnvironment->Tags.Add(FName(TEXT("ShiPresentation:NonAuthoritative")));
    WetFieldEnvironmentProp = WetFieldEnvironment;
    const FShiDazeFieldShelterPresentationData ShelterPresentation =
        FShiDazeFieldShelterPresentationModel::Build();
    FString ShelterError;
    if (!FShiDazeFieldShelterPresentationModel::Validate(ShelterPresentation, ShelterError))
    {
        LoadError = FString::Printf(TEXT("Daze field-shelter presentation rejected: %s"), *ShelterError);
        return;
    }
    UStaticMesh* ShelterMesh = LoadObject<UStaticMesh>(nullptr, *ShelterPresentation.MeshPath);
    if (!ShelterMesh)
    {
        LoadError = TEXT("Reviewed Daze field-shelter mesh is unavailable.");
        return;
    }
    const FBox ShelterBounds = ShelterMesh->GetBoundingBox();
    TSet<FName> ShelterMaterialSlots;
    for (const FStaticMaterial& Material : ShelterMesh->GetStaticMaterials())
    {
        ShelterMaterialSlots.Add(Material.MaterialSlotName);
    }
    if (!ShelterBounds.Min.Equals(ShelterPresentation.BoundsMinimum, .10f)
        || !ShelterBounds.Max.Equals(ShelterPresentation.BoundsMaximum, .10f)
        || ShelterMaterialSlots.Num() != 3
        || !ShelterMaterialSlots.Contains(FName(TEXT("M_SHI_RainDarkenedWood")))
        || !ShelterMaterialSlots.Contains(FName(TEXT("M_SHI_WovenReedMat")))
        || !ShelterMaterialSlots.Contains(FName(TEXT("M_SHI_CoarseFiberCord"))))
    {
        LoadError = TEXT("Reviewed Daze field-shelter runtime bounds or material slots drifted from the admitted asset.");
        return;
    }
    AStaticMeshActor* Shelter = World->SpawnActor<AStaticMeshActor>(
        ShelterPresentation.Transform.GetLocation(), ShelterPresentation.Transform.Rotator());
    if (!Shelter)
    {
        LoadError = TEXT("Reviewed Daze field shelter could not spawn.");
        return;
    }
    UStaticMeshComponent* ShelterComponent = Shelter->GetStaticMeshComponent();
    ShelterComponent->SetMobility(EComponentMobility::Movable);
    ShelterComponent->SetStaticMesh(ShelterMesh);
    ShelterComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    ShelterComponent->SetGenerateOverlapEvents(false);
    ShelterComponent->SetCanEverAffectNavigation(false);
    Shelter->SetActorScale3D(ShelterPresentation.Transform.GetScale3D());
    Shelter->SetActorEnableCollision(false);
    Shelter->Tags.Add(FName(TEXT("ShiEnvironment:DazeShelter")));
    Shelter->Tags.Add(FName(TEXT("ShiPresentation:FictionalPracticalConstruction")));
    Shelter->Tags.Add(FName(TEXT("ShiArtStatus:ProductionBlockout")));
    DazeFieldShelterProp = Shelter;
    const FShiCommandSurfacePresentationData CommandSurfacePresentation = FShiCommandSurfacePresentationModel::Build();
    FString CommandSurfaceError;
    if (!FShiCommandSurfacePresentationModel::Validate(CommandSurfacePresentation, Campaign.Sites,
        CommandSignals, CommandSurfaceError))
    {
        LoadError = FString::Printf(TEXT("Command-surface presentation rejected: %s"), *CommandSurfaceError);
        return;
    }
    UStaticMesh* CommandSurfaceMesh = LoadObject<UStaticMesh>(nullptr, *CommandSurfacePresentation.MeshPath);
    if (!CommandSurfaceMesh)
    {
        LoadError = TEXT("Reviewed command-surface mesh is unavailable.");
        return;
    }
    const FBox CommandSurfaceBounds = CommandSurfaceMesh->GetBoundingBox();
    TSet<FName> CommandSurfaceMaterialSlots;
    for (const FStaticMaterial& Material : CommandSurfaceMesh->GetStaticMaterials())
    {
        CommandSurfaceMaterialSlots.Add(Material.MaterialSlotName);
    }
    if (!CommandSurfaceBounds.Min.Equals(CommandSurfacePresentation.BoundsMinimum, .06f)
        || !CommandSurfaceBounds.Max.Equals(CommandSurfacePresentation.BoundsMaximum, .06f)
        || CommandSurfaceMaterialSlots.Num() != 2
        || !CommandSurfaceMaterialSlots.Contains(FName(TEXT("M_SHI_WetPackedEarth")))
        || !CommandSurfaceMaterialSlots.Contains(FName(TEXT("M_SHI_DarkWorkedWood"))))
    {
        LoadError = TEXT("Reviewed command-surface runtime bounds or material slots drifted from the admitted asset.");
        return;
    }
    AStaticMeshActor* CommandSurface = World->SpawnActor<AStaticMeshActor>(
        CommandSurfacePresentation.Transform.GetLocation(), CommandSurfacePresentation.Transform.Rotator());
    if (!CommandSurface)
    {
        LoadError = TEXT("Reviewed command-surface presentation could not spawn.");
        return;
    }
    UStaticMeshComponent* CommandSurfaceComponent = CommandSurface->GetStaticMeshComponent();
    CommandSurfaceComponent->SetMobility(EComponentMobility::Movable);
    CommandSurfaceComponent->SetStaticMesh(CommandSurfaceMesh);
    CommandSurfaceComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    CommandSurfaceComponent->SetGenerateOverlapEvents(false);
    CommandSurfaceComponent->SetCanEverAffectNavigation(false);
    CommandSurface->SetActorScale3D(CommandSurfacePresentation.Transform.GetScale3D());
    CommandSurface->SetActorEnableCollision(false);
    CommandSurface->Tags.Add(FName(TEXT("ShiEnvironment:CommandSurface")));
    CommandSurface->Tags.Add(FName(TEXT("ShiPresentation:FictionalInterfaceStage")));
    CommandSurfaceProp = CommandSurface;
    UMaterialInterface* BasicMaterial = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    if (!BasicMaterial)
    {
        LoadError = TEXT("Required engine-native wartable material is unavailable.");
        return;
    }
    CouncilFigures.Empty();
    for (const FShiCouncilParticipantData& Participant : OpeningCouncilStage.Participants)
    {
        AShiCouncilFigure* Figure = World->SpawnActor<AShiCouncilFigure>();
        FString FigureError;
        if (!Figure || !Figure->InitializeFigure(Cylinder, Sphere, Cube, BasicMaterial, FigureError))
        {
            LoadError = FString::Printf(TEXT("Council figure %s could not initialize: %s"), *Participant.SlotId, *FigureError);
            return;
        }
        Figure->ApplyParticipant(Participant);
        CouncilFigures.Add(Participant.SlotId, Figure);
    }
    CouncilStage = MoveTemp(OpeningCouncilStage);
    const FShiCommandWeightPresentationData CommandWeightPresentation = FShiCommandWeightPresentationModel::Build();
    FString CommandWeightError;
    if (!FShiCommandWeightPresentationModel::Validate(CommandWeightPresentation, Campaign.Sites, CommandSignals,
        CouncilStage, CommandWeightError))
    {
        LoadError = FString::Printf(TEXT("Command-weight presentation rejected: %s"), *CommandWeightError);
        return;
    }
    UStaticMesh* CommandWeightMesh = LoadObject<UStaticMesh>(nullptr, *CommandWeightPresentation.MeshPath);
    if (!CommandWeightMesh)
    {
        LoadError = TEXT("Reviewed command-weight mesh is unavailable.");
        return;
    }
    const FBox CommandWeightBounds = CommandWeightMesh->GetBoundingBox();
    if (!CommandWeightBounds.Min.Equals(CommandWeightPresentation.BoundsMinimum, .05f)
        || !CommandWeightBounds.Max.Equals(CommandWeightPresentation.BoundsMaximum, .05f))
    {
        LoadError = TEXT("Reviewed command-weight runtime bounds drifted from the admitted centimeter-scale asset.");
        return;
    }
    AStaticMeshActor* CommandWeight = World->SpawnActor<AStaticMeshActor>(
        CommandWeightPresentation.Transform.GetLocation(), CommandWeightPresentation.Transform.Rotator());
    if (!CommandWeight)
    {
        LoadError = TEXT("Reviewed command-weight presentation could not spawn.");
        return;
    }
    UStaticMeshComponent* CommandWeightComponent = CommandWeight->GetStaticMeshComponent();
    CommandWeightComponent->SetMobility(EComponentMobility::Movable);
    CommandWeightComponent->SetStaticMesh(CommandWeightMesh);
    CommandWeightComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    CommandWeightComponent->SetGenerateOverlapEvents(false);
    CommandWeightComponent->SetCanEverAffectNavigation(false);
    CommandWeight->SetActorScale3D(CommandWeightPresentation.Transform.GetScale3D());
    CommandWeight->SetActorEnableCollision(false);
    CommandWeight->Tags.Add(FName(TEXT("ShiProp:CommandWeight")));
    CommandWeight->Tags.Add(FName(TEXT("ShiPresentation:NonAuthoritative")));
    CommandWeightProp = CommandWeight;
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
    CommandSignalMarkers.Empty();
    for (const FShiCommandSignalData& Signal : CommandSignals)
    {
        UStaticMesh* SignalMesh = LoadObject<UStaticMesh>(nullptr, *Signal.MeshPath);
        if (!SignalMesh)
        {
            LoadError = FString::Printf(TEXT("Command signal mesh missing for %s."), *Signal.Id);
            return;
        }
        AStaticMeshActor* Marker = World->SpawnActor<AStaticMeshActor>(Signal.Location, Signal.Rotation);
        if (!Marker)
        {
            LoadError = FString::Printf(TEXT("Command signal could not spawn for %s."), *Signal.Id);
            return;
        }
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetMobility(EComponentMobility::Movable);
        Component->SetStaticMesh(SignalMesh);
        Component->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
        Component->SetCollisionResponseToAllChannels(ECR_Ignore);
        Component->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
        UMaterialInstanceDynamic* Material = Component->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
        if (!Material)
        {
            LoadError = FString::Printf(TEXT("Command signal material could not initialize for %s."), *Signal.Id);
            return;
        }
        Material->SetVectorParameterValue(FName(TEXT("Color")), Signal.Color);
        Marker->Tags.Add(FName(*FString::Printf(TEXT("ShiSignal:%s"), *Signal.Id)));
        Marker->SetActorScale3D(Signal.Scale);
        CommandSignalMarkers.Add(Signal.Id, Marker);
    }
    TArray<FShiEngagementSignalData> InitialEngagementSignals;
    FString EngagementSignalError;
    if (!FShiEngagementSignalModel::Build(Engagement.InitialMetrics, InitialEngagementSignals, EngagementSignalError))
    {
        LoadError = FString::Printf(TEXT("Engagement command-space signals rejected: %s"), *EngagementSignalError);
        return;
    }
    EngagementMetricMarkers.Empty();
    for (const FShiEngagementSignalData& Signal : InitialEngagementSignals)
    {
        UStaticMesh* SignalMesh = LoadObject<UStaticMesh>(nullptr, *Signal.MeshPath);
        if (!SignalMesh)
        {
            LoadError = FString::Printf(TEXT("Engagement metric mesh missing for %s."), *Signal.MetricId);
            return;
        }
        AStaticMeshActor* Marker = World->SpawnActor<AStaticMeshActor>(Signal.Location, FRotator::ZeroRotator);
        if (!Marker)
        {
            LoadError = FString::Printf(TEXT("Engagement metric could not spawn for %s."), *Signal.MetricId);
            return;
        }
        UStaticMeshComponent* Component = Marker->GetStaticMeshComponent();
        Component->SetMobility(EComponentMobility::Movable);
        Component->SetStaticMesh(SignalMesh);
        Component->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
        Component->SetCollisionResponseToAllChannels(ECR_Ignore);
        Component->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
        UMaterialInstanceDynamic* Material = Component->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
        if (!Material)
        {
            LoadError = FString::Printf(TEXT("Engagement metric material could not initialize for %s."), *Signal.MetricId);
            return;
        }
        Material->SetVectorParameterValue(FName(TEXT("Color")), Signal.Color);
        Component->SetCustomDepthStencilValue(Signal.StencilValue);
        Marker->Tags.Add(FName(*FString::Printf(TEXT("ShiEngagement:%s"), *Signal.MetricId)));
        Marker->SetActorScale3D(Signal.Scale);
        Marker->SetActorHiddenInGame(true);
        Marker->SetActorEnableCollision(false);
        EngagementMetricMarkers.Add(Signal.MetricId, Marker);
    }
    if (!CanPresentCouncilStage(CouncilStage, CouncilError))
    {
        LoadError = FString::Printf(TEXT("Live council staging rejected: %s"), *CouncilError);
        return;
    }
    if (bDazeFieldShelterReview)
    {
        SetCameraImmediate(FShiDazeFieldShelterPresentationModel::ReviewCameraTransform(),
            FShiDazeFieldShelterPresentationModel::ReviewFieldOfViewDegrees());
    }
    else if (bWetFieldEnvironmentReview)
    {
        SetCameraImmediate(FShiWetFieldEnvironmentPresentationModel::ReviewCameraTransform(),
            FShiWetFieldEnvironmentPresentationModel::ReviewFieldOfViewDegrees());
    }
    else if (bCommandSurfaceReview)
    {
        SetCameraImmediate(FShiCommandSurfacePresentationModel::ReviewCameraTransform(),
            FShiCommandSurfacePresentationModel::ReviewFieldOfViewDegrees());
    }
    else if (bCommandWeightReview)
    {
        SetCameraImmediate(FShiCommandWeightPresentationModel::ReviewCameraTransform(
            CommandWeightPresentation, bCommandWeightReviewBack),
            FShiCommandWeightPresentationModel::ReviewFieldOfViewDegrees());
    }
    else if (GetCurrentNode()) FocusCouncil(true, false);
}
