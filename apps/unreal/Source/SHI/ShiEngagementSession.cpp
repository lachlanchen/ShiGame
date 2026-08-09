#include "ShiEngagementSession.h"

#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
    TSharedRef<FJsonObject> IntegerMapToJson(const TMap<FString, int32>& Values, const TArray<FString>& OrderedKeys, const bool bIncludeZero)
    {
        const TSharedRef<FJsonObject> Object = MakeShared<FJsonObject>();
        for (const FString& Key : OrderedKeys)
        {
            const int32 Value = Values.FindRef(Key);
            if (bIncludeZero || Value != 0) Object->SetNumberField(Key, Value);
        }
        return Object;
    }

    bool ReadIntegerMap(const TSharedPtr<FJsonObject>& Object, const TArray<FString>& AllowedKeys, const bool bRequireEveryKey,
        TMap<FString, int32>& OutValues)
    {
        OutValues.Empty();
        if (!Object.IsValid()) return false;
        for (const auto& Pair : Object->Values)
        {
            double Value = 0;
            const FString Key(Pair.Key);
            if (!AllowedKeys.Contains(Key) || !Pair.Value.IsValid() || !Pair.Value->TryGetNumber(Value)
                || !FMath::IsNearlyEqual(Value, FMath::RoundToDouble(Value))) return false;
            OutValues.Add(Key, FMath::RoundToInt(Value));
        }
        if (bRequireEveryKey)
        {
            for (const FString& Key : AllowedKeys) if (!OutValues.Contains(Key)) return false;
        }
        return true;
    }

    bool ReadRequiredObject(const TSharedPtr<FJsonObject>& Parent, const FString& Field, TSharedPtr<FJsonObject>& OutObject)
    {
        const TSharedPtr<FJsonObject>* Value = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Value) || !Value || !Value->IsValid()) return false;
        OutObject = *Value;
        return true;
    }
}

TMap<FString, int32> FShiEngagementSession::ApplyMetricEffects(const TMap<FString, int32>& Values, const TMap<FString, int32>& Effects)
{
    TMap<FString, int32> Result;
    for (const FString& Key : FShiEngagementModel::MetricKeys())
        Result.Add(Key, FMath::Clamp(Values.FindRef(Key) + Effects.FindRef(Key), 0, 100));
    return Result;
}

bool FShiEngagementSession::Initialize(const FShiEngagementModel& InModel, const FString& InPlanId,
    const FString& InConditionId, FString& OutError)
{
    OutError.Empty();
    const FShiEngagementPlanData* Plan = InModel.FindPlan(InPlanId);
    const FShiEngagementConditionData* Condition = InModel.FindCondition(InConditionId);
    if (!Plan || !Condition)
    {
        OutError = TEXT("Unknown engagement plan or field condition.");
        return false;
    }
    FShiEngagementSession Candidate;
    Candidate.Model = &InModel;
    Candidate.PlanId = InPlanId;
    Candidate.ConditionId = InConditionId;
    Candidate.Metrics = ApplyMetricEffects(ApplyMetricEffects(InModel.InitialMetrics, Plan->InitialEffects), Condition->LocalEffects);
    *this = MoveTemp(Candidate);
    return true;
}

void FShiEngagementSession::AvailableCommands(TArray<const FShiEngagementCommandData*>& OutCommands, FString& OutError) const
{
    OutCommands.Empty();
    OutError.Empty();
    if (!Model || bCompleted)
    {
        if (!Model) OutError = TEXT("Engagement session is not initialized.");
        return;
    }
    if (!Model->Pulses.IsValidIndex(PulseIndex))
    {
        OutError = TEXT("Engagement pulse index is invalid.");
        return;
    }
    const FShiEngagementPulseData& Pulse = Model->Pulses[PulseIndex];
    const FShiEngagementPlanData* Plan = Model->FindPlan(PlanId);
    const TArray<FString>* Allowed = Plan ? Plan->AllowedCommands.Find(Pulse.Id) : nullptr;
    if (!Allowed)
    {
        OutError = TEXT("Engagement plan has no command set for the active pulse.");
        return;
    }
    for (const FString& CommandId : Pulse.CommandIds)
    {
        const FShiEngagementCommandData* Command = Model->FindCommand(CommandId);
        if (Command && Command->PulseId == Pulse.Id && Allowed->Contains(CommandId)
            && FShiEngagementModel::MeetsRequirements(Metrics, Command->Requirements)) OutCommands.Add(Command);
    }
}

bool FShiEngagementSession::ResolveCommand(const FString& CommandId, FShiEngagementCommandRecord& OutRecord, FString& OutError)
{
    OutError.Empty();
    if (bCompleted) { OutError = TEXT("The engagement is already complete."); return false; }
    TArray<const FShiEngagementCommandData*> Legal;
    AvailableCommands(Legal, OutError);
    if (!OutError.IsEmpty()) return false;
    const FShiEngagementCommandData* const* FoundCommand = Legal.FindByPredicate(
        [&](const FShiEngagementCommandData* Value) { return Value && Value->Id == CommandId; });
    const FShiEngagementCommandData* Command = FoundCommand ? *FoundCommand : nullptr;
    if (!Command || !Model || !Model->Pulses.IsValidIndex(PulseIndex))
    {
        OutError = FString::Printf(TEXT("Command %s is not legal at pulse %d."), *CommandId, PulseIndex);
        return false;
    }
    const FShiEngagementPulseData& Pulse = Model->Pulses[PulseIndex];
    FShiEngagementCommandRecord Record;
    Record.PulseId = Pulse.Id;
    Record.CommandId = Command->Id;
    Record.Before = Metrics;
    Record.AfterCommand = ApplyMetricEffects(Record.Before, Command->Effects);
    Record.ResponseId = Command->Response.Id;
    Record.AfterResponse = ApplyMetricEffects(Record.AfterCommand, Command->Response.Effects);

    const int32 NextPulseIndex = PulseIndex + 1;
    FString NextOutcomeId;
    TMap<FString, int32> NextCampaignEffects;
    const bool bNextCompleted = NextPulseIndex == Model->Pulses.Num();
    if (bNextCompleted)
    {
        const FShiEngagementOutcomeData* Outcome = Model->Outcomes.FindByPredicate(
            [&](const FShiEngagementOutcomeData& Candidate) { return FShiEngagementModel::MeetsRequirements(Record.AfterResponse, Candidate.Requirements); });
        const FShiEngagementPlanData* Plan = Model->FindPlan(PlanId);
        if (!Outcome || !Plan) { OutError = TEXT("Completed engagement has no authored outcome."); return false; }
        NextOutcomeId = Outcome->Id;
        for (const FString& Key : FShiEngagementModel::CampaignResourceKeys())
        {
            const int32 Effect = Plan->CampaignEffects.FindRef(Key) + Outcome->CampaignEffects.FindRef(Key);
            if (Effect != 0) NextCampaignEffects.Add(Key, Effect);
        }
    }

    PulseIndex = NextPulseIndex;
    Metrics = Record.AfterResponse;
    History.Add(Record);
    bCompleted = bNextCompleted;
    OutcomeId = NextOutcomeId;
    CampaignEffects = MoveTemp(NextCampaignEffects);
    OutRecord = MoveTemp(Record);
    return true;
}

bool FShiEngagementSession::ExportSaveJson(FString& OutJson, FString& OutError) const
{
    OutError.Empty();
    OutJson.Empty();
    if (!Model) { OutError = TEXT("Cannot save an uninitialized engagement."); return false; }
    const TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
    Root->SetNumberField(TEXT("saveVersion"), 1);
    Root->SetStringField(TEXT("engagementId"), Model->Id);
    Root->SetStringField(TEXT("planId"), PlanId);
    Root->SetStringField(TEXT("conditionId"), ConditionId);
    Root->SetNumberField(TEXT("pulseIndex"), PulseIndex);
    Root->SetObjectField(TEXT("metrics"), IntegerMapToJson(Metrics, FShiEngagementModel::MetricKeys(), true));
    TArray<TSharedPtr<FJsonValue>> Records;
    for (const FShiEngagementCommandRecord& Record : History)
    {
        const TSharedRef<FJsonObject> Object = MakeShared<FJsonObject>();
        Object->SetStringField(TEXT("pulseId"), Record.PulseId);
        Object->SetStringField(TEXT("commandId"), Record.CommandId);
        Object->SetObjectField(TEXT("before"), IntegerMapToJson(Record.Before, FShiEngagementModel::MetricKeys(), true));
        Object->SetObjectField(TEXT("afterCommand"), IntegerMapToJson(Record.AfterCommand, FShiEngagementModel::MetricKeys(), true));
        Object->SetStringField(TEXT("responseId"), Record.ResponseId);
        Object->SetObjectField(TEXT("afterResponse"), IntegerMapToJson(Record.AfterResponse, FShiEngagementModel::MetricKeys(), true));
        Records.Add(MakeShared<FJsonValueObject>(Object));
    }
    Root->SetArrayField(TEXT("history"), Records);
    Root->SetBoolField(TEXT("completed"), bCompleted);
    if (bCompleted)
    {
        Root->SetStringField(TEXT("outcomeId"), OutcomeId);
        Root->SetObjectField(TEXT("campaignEffects"), IntegerMapToJson(CampaignEffects, FShiEngagementModel::CampaignResourceKeys(), false));
    }
    const TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutJson);
    if (!FJsonSerializer::Serialize(Root, Writer)) { OutError = TEXT("Engagement save serialization failed."); return false; }
    return true;
}

bool FShiEngagementSession::SameIntegerMap(const TMap<FString, int32>& First, const TMap<FString, int32>& Second)
{
    if (First.Num() != Second.Num()) return false;
    for (const TPair<FString, int32>& Pair : First)
    {
        const int32* Other = Second.Find(Pair.Key);
        if (!Other || *Other != Pair.Value) return false;
    }
    return true;
}

bool FShiEngagementSession::SameRecord(const FShiEngagementCommandRecord& First, const FShiEngagementCommandRecord& Second)
{
    return First.PulseId == Second.PulseId && First.CommandId == Second.CommandId && First.ResponseId == Second.ResponseId
        && SameIntegerMap(First.Before, Second.Before) && SameIntegerMap(First.AfterCommand, Second.AfterCommand)
        && SameIntegerMap(First.AfterResponse, Second.AfterResponse);
}

bool FShiEngagementSession::ReplaySaveJson(const FShiEngagementModel& InModel, const FString& Json, FString& OutError)
{
    // Rebuild only from plan, condition and command identifiers; stored response/state fields are comparison evidence.
    OutError.Empty();
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid()) { OutError = TEXT("Engagement save is invalid JSON."); return false; }
    double SaveVersion = 0;
    FString EngagementId;
    FString SavedPlanId;
    FString SavedConditionId;
    double SavedPulseIndex = 0;
    bool bSavedCompleted = false;
    const TArray<TSharedPtr<FJsonValue>>* SavedHistory = nullptr;
    TSharedPtr<FJsonObject> SavedMetrics;
    if (!Root->TryGetNumberField(TEXT("saveVersion"), SaveVersion) || SaveVersion != 1
        || !Root->TryGetStringField(TEXT("engagementId"), EngagementId) || EngagementId != InModel.Id
        || !Root->TryGetStringField(TEXT("planId"), SavedPlanId)
        || !Root->TryGetStringField(TEXT("conditionId"), SavedConditionId)
        || !Root->TryGetNumberField(TEXT("pulseIndex"), SavedPulseIndex)
        || !FMath::IsNearlyEqual(SavedPulseIndex, FMath::RoundToDouble(SavedPulseIndex))
        || !Root->TryGetBoolField(TEXT("completed"), bSavedCompleted)
        || !Root->TryGetArrayField(TEXT("history"), SavedHistory) || !SavedHistory
        || !ReadRequiredObject(Root, TEXT("metrics"), SavedMetrics))
    { OutError = TEXT("Engagement save header is incomplete or incompatible."); return false; }

    TMap<FString, int32> ExpectedMetrics;
    if (!ReadIntegerMap(SavedMetrics, FShiEngagementModel::MetricKeys(), true, ExpectedMetrics))
    { OutError = TEXT("Engagement save metrics are invalid."); return false; }
    FShiEngagementSession Candidate;
    if (!Candidate.Initialize(InModel, SavedPlanId, SavedConditionId, OutError)) return false;
    for (const TSharedPtr<FJsonValue>& Value : *SavedHistory)
    {
        const TSharedPtr<FJsonObject> Object = Value.IsValid() ? Value->AsObject() : nullptr;
        FShiEngagementCommandRecord Expected;
        TSharedPtr<FJsonObject> Before;
        TSharedPtr<FJsonObject> AfterCommand;
        TSharedPtr<FJsonObject> AfterResponse;
        if (!Object.IsValid() || !Object->TryGetStringField(TEXT("pulseId"), Expected.PulseId)
            || !Object->TryGetStringField(TEXT("commandId"), Expected.CommandId)
            || !Object->TryGetStringField(TEXT("responseId"), Expected.ResponseId)
            || !ReadRequiredObject(Object, TEXT("before"), Before) || !ReadIntegerMap(Before, FShiEngagementModel::MetricKeys(), true, Expected.Before)
            || !ReadRequiredObject(Object, TEXT("afterCommand"), AfterCommand) || !ReadIntegerMap(AfterCommand, FShiEngagementModel::MetricKeys(), true, Expected.AfterCommand)
            || !ReadRequiredObject(Object, TEXT("afterResponse"), AfterResponse) || !ReadIntegerMap(AfterResponse, FShiEngagementModel::MetricKeys(), true, Expected.AfterResponse))
        { OutError = TEXT("Engagement save contains an invalid command record."); return false; }
        FShiEngagementCommandRecord Actual;
        if (Candidate.bCompleted || !Candidate.ResolveCommand(Expected.CommandId, Actual, OutError) || !SameRecord(Actual, Expected))
        { if (OutError.IsEmpty()) OutError = TEXT("Engagement command replay diverged from its authored record."); return false; }
    }

    FString SavedOutcomeId;
    TMap<FString, int32> SavedCampaignEffects;
    if (bSavedCompleted)
    {
        TSharedPtr<FJsonObject> CampaignEffectsObject;
        if (!Root->TryGetStringField(TEXT("outcomeId"), SavedOutcomeId)
            || !ReadRequiredObject(Root, TEXT("campaignEffects"), CampaignEffectsObject)
            || !ReadIntegerMap(CampaignEffectsObject, FShiEngagementModel::CampaignResourceKeys(), false, SavedCampaignEffects))
        { OutError = TEXT("Completed engagement save lacks its outcome or campaign effect preview."); return false; }
    }
    else if (Root->HasField(TEXT("outcomeId")) || Root->HasField(TEXT("campaignEffects")))
    { OutError = TEXT("Incomplete engagement save cannot claim an outcome."); return false; }

    if (Candidate.PulseIndex != FMath::RoundToInt(SavedPulseIndex) || Candidate.bCompleted != bSavedCompleted
        || Candidate.OutcomeId != SavedOutcomeId || !SameIntegerMap(Candidate.Metrics, ExpectedMetrics)
        || !SameIntegerMap(Candidate.CampaignEffects, SavedCampaignEffects)
        || Candidate.History.Num() != SavedHistory->Num())
    { OutError = TEXT("Engagement save state diverges from identifier replay."); return false; }
    *this = MoveTemp(Candidate);
    return true;
}
