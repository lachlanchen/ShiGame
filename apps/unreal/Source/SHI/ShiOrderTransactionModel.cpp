#include "ShiOrderTransactionModel.h"

namespace
{
    bool SameMap(const TMap<FString, int32>& Left, const TMap<FString, int32>& Right)
    {
        if (Left.Num() != Right.Num()) return false;
        for (const TPair<FString, int32>& Pair : Left)
        {
            const int32* Value = Right.Find(Pair.Key);
            if (!Value || *Value != Pair.Value) return false;
        }
        return true;
    }

    bool SameRecord(const FShiDecisionRecord& Left, const FShiDecisionRecord& Right)
    {
        return Left.NodeId == Right.NodeId && Left.ChoiceId == Right.ChoiceId
            && Left.ConditionId == Right.ConditionId && Left.OppositionStageId == Right.OppositionStageId
            && Left.MethodId == Right.MethodId && Left.MethodReadId == Right.MethodReadId
            && Left.bMethodReadMatched == Right.bMethodReadMatched && Left.CommitmentId == Right.CommitmentId
            && Left.CommitmentOutcomeId == Right.CommitmentOutcomeId && SameMap(Left.Before, Right.Before)
            && SameMap(Left.AfterChoice, Right.AfterChoice) && SameMap(Left.CommitmentEffects, Right.CommitmentEffects)
            && SameMap(Left.AfterCommitment, Right.AfterCommitment) && SameMap(Left.PressureEffects, Right.PressureEffects)
            && SameMap(Left.AfterPressure, Right.AfterPressure) && SameMap(Left.OppositionEffects, Right.OppositionEffects)
            && SameMap(Left.AfterOpposition, Right.AfterOpposition) && SameMap(Left.MethodReadEffects, Right.MethodReadEffects)
            && SameMap(Left.AfterMethodRead, Right.AfterMethodRead) && SameMap(Left.ConditionEffects, Right.ConditionEffects)
            && SameMap(Left.After, Right.After);
    }

    bool SameResolution(const FShiResolutionResult& Left, const FShiResolutionResult& Right)
    {
        return Left.Node == Right.Node && Left.Choice == Right.Choice && Left.Condition == Right.Condition
            && Left.Opposition == Right.Opposition && Left.MethodRead == Right.MethodRead
            && Left.Commitment == Right.Commitment && Left.CommitmentOutcome == Right.CommitmentOutcome
            && SameRecord(Left.Record, Right.Record);
    }

    bool SameSignal(const FShiCommandSignalData& Left, const FShiCommandSignalData& Right)
    {
        return Left.Id == Right.Id && Left.Category == Right.Category && Left.Label == Right.Label
            && Left.State == Right.State && Left.Detail == Right.Detail && Left.MeshPath == Right.MeshPath
            && Left.NumericValue == Right.NumericValue && Left.bActive == Right.bActive
            && Left.Location.Equals(Right.Location, .0001f) && Left.Scale.Equals(Right.Scale, .0001f)
            && Left.Rotation.Equals(Right.Rotation, .0001f) && Left.Color.Equals(Right.Color, .0001f)
            && Left.StencilValue == Right.StencilValue;
    }

    bool SameSignals(const TArray<FShiCommandSignalData>& Left, const TArray<FShiCommandSignalData>& Right)
    {
        if (Left.Num() != Right.Num()) return false;
        for (int32 Index = 0; Index < Left.Num(); ++Index)
            if (!SameSignal(Left[Index], Right[Index])) return false;
        return true;
    }

    bool SameBeat(const FShiCinematicBeatData& Left, const FShiCinematicBeatData& Right)
    {
        return Left.Id == Right.Id && Left.Layer == Right.Layer && Left.Label == Right.Label
            && Left.Detail == Right.Detail && Left.FocusKind == Right.FocusKind && Left.FocusId == Right.FocusId
            && Left.CameraMotion == Right.CameraMotion
            && FMath::IsNearlyEqual(Left.FieldOfViewDegrees, Right.FieldOfViewDegrees, .0001f)
            && FMath::IsNearlyEqual(Left.TransitionSeconds, Right.TransitionSeconds, .0001f)
            && FMath::IsNearlyEqual(Left.HoldSeconds, Right.HoldSeconds, .0001f);
    }

    bool SameBeats(const TArray<FShiCinematicBeatData>& Left, const TArray<FShiCinematicBeatData>& Right)
    {
        if (Left.Num() != Right.Num()) return false;
        for (int32 Index = 0; Index < Left.Num(); ++Index)
            if (!SameBeat(Left[Index], Right[Index])) return false;
        return true;
    }

    bool BuildUnchecked(const FShiCampaignSession& CurrentSession, const FShiCampaignModel& Campaign,
        const FString& ChoiceId, const FString& Locale, FShiOrderTransactionData& OutTransaction, FString& OutError)
    {
        if (CurrentSession.GetCampaign() != &Campaign || CurrentSession.IsCompleted())
        {
            OutError = TEXT("Order transaction requires the active, incomplete canonical campaign session.");
            return false;
        }

        FShiOrderTransactionData Candidate;
        Candidate.Session = CurrentSession;
        if (!Candidate.Session.ResolveChoice(ChoiceId, Candidate.Resolution, OutError)) return false;
        if (Candidate.Session.GetHistory().Num() != CurrentSession.GetHistory().Num() + 1)
        {
            OutError = TEXT("Order transaction did not append exactly one authoritative decision.");
            return false;
        }

        const FShiNodeData* PositionNode = Candidate.Session.GetCurrentNode();
        const FShiSiteData* PositionSite = PositionNode ? Campaign.FindSite(PositionNode->SiteId) : nullptr;
        if (!PositionNode || !PositionSite)
        {
            OutError = TEXT("Order transaction has no representable post-order position.");
            return false;
        }
        if (!FShiOrderTransactionModel::BuildTurnSnapshot(Candidate.Session, Campaign, Locale,
            Candidate.SelectedChoiceIndex, Candidate.CommandSignals, OutError)) return false;
        if (!FShiCinematicBeatModel::Build(Candidate.Resolution, Candidate.Session.GetActiveCommitment(),
            Candidate.Session.GetResources(), PositionSite, Candidate.Session.IsCompleted(), Candidate.Session.GetFailureReason(),
            Candidate.CommandSignals, Locale, Candidate.CinematicBeats, OutError)) return false;

        OutTransaction = MoveTemp(Candidate);
        OutError.Empty();
        return true;
    }
}

bool FShiOrderTransactionModel::BuildTurnSnapshot(const FShiCampaignSession& Session, const FShiCampaignModel& Campaign,
    const FString& Locale, int32& OutSelectedChoiceIndex, TArray<FShiCommandSignalData>& OutSignals, FString& OutError)
{
    if (Session.GetCampaign() != &Campaign)
    {
        OutError = TEXT("Turn snapshot requires the canonical campaign session.");
        return false;
    }
    const FShiNodeData* Node = Session.GetCurrentNode();
    if (!Node || Node->Choices.IsEmpty())
    {
        OutError = TEXT("Turn snapshot has no representable briefing choice.");
        return false;
    }
    int32 SelectedChoiceIndex = INDEX_NONE;
    for (int32 Index = 0; Index < Node->Choices.Num(); ++Index)
    {
        if (Session.CanChoose(Node->Choices[Index]))
        {
            SelectedChoiceIndex = Index;
            break;
        }
    }
    if (SelectedChoiceIndex == INDEX_NONE && Session.IsCompleted()) SelectedChoiceIndex = 0;
    if (!Node->Choices.IsValidIndex(SelectedChoiceIndex))
    {
        OutError = TEXT("Turn snapshot has no legal briefing selection.");
        return false;
    }

    TArray<FShiCommandSignalData> Signals;
    if (!FShiCommandSignalModel::Build(Session.GetResources(), Session.GetCurrentFieldCondition(),
        Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(), Session.GetActiveCommitment(),
        &Node->Choices[SelectedChoiceIndex], Locale, Signals, OutError)) return false;
    if (!FShiCommandSignalModel::ValidateAgainstSites(Signals, Campaign.Sites, OutError)) return false;
    OutSelectedChoiceIndex = SelectedChoiceIndex;
    OutSignals = MoveTemp(Signals);
    OutError.Empty();
    return true;
}

bool FShiOrderTransactionModel::Build(const FShiCampaignSession& CurrentSession, const FShiCampaignModel& Campaign,
    const FString& ChoiceId, const FString& Locale, FShiOrderTransactionData& OutTransaction, FString& OutError)
{
    FShiOrderTransactionData Candidate;
    if (!BuildUnchecked(CurrentSession, Campaign, ChoiceId, Locale, Candidate, OutError)) return false;
    if (!Validate(CurrentSession, Campaign, ChoiceId, Locale, Candidate, OutError)) return false;
    OutTransaction = MoveTemp(Candidate);
    return true;
}

bool FShiOrderTransactionModel::Validate(const FShiCampaignSession& CurrentSession, const FShiCampaignModel& Campaign,
    const FString& ChoiceId, const FString& Locale, const FShiOrderTransactionData& Transaction, FString& OutError)
{
    FShiOrderTransactionData Expected;
    if (!BuildUnchecked(CurrentSession, Campaign, ChoiceId, Locale, Expected, OutError)) return false;

    FString TransactionSave;
    FString ExpectedSave;
    FString SaveError;
    if (!Transaction.Session.ExportSaveJson(TransactionSave, SaveError)
        || !Expected.Session.ExportSaveJson(ExpectedSave, SaveError) || TransactionSave != ExpectedSave
        || Transaction.SelectedChoiceIndex != Expected.SelectedChoiceIndex
        || !SameResolution(Transaction.Resolution, Expected.Resolution)
        || !SameSignals(Transaction.CommandSignals, Expected.CommandSignals)
        || !SameBeats(Transaction.CinematicBeats, Expected.CinematicBeats))
    {
        OutError = SaveError.IsEmpty()
            ? TEXT("Order transaction differs from deterministic replay, world state, or cinematic authorship.")
            : FString::Printf(TEXT("Order transaction save preflight failed: %s"), *SaveError);
        return false;
    }

    OutError.Empty();
    return true;
}
