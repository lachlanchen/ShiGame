#include "ShiEngagementModel.h"

#include "Dom/JsonObject.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
    FShiLocalizedText ReadLocalized(const TSharedPtr<FJsonObject>& Object)
    {
        FShiLocalizedText Result;
        if (!Object.IsValid()) return Result;
        for (const auto& Pair : Object->Values)
        {
            FString Value;
            if (Pair.Value.IsValid() && Pair.Value->TryGetString(Value)) Result.Values.Add(FString(Pair.Key), Value);
        }
        return Result;
    }

    TMap<FString, int32> ReadIntegers(const TSharedPtr<FJsonObject>& Object)
    {
        TMap<FString, int32> Result;
        if (!Object.IsValid()) return Result;
        for (const auto& Pair : Object->Values)
        {
            double Value = 0;
            if (Pair.Value.IsValid() && Pair.Value->TryGetNumber(Value)) Result.Add(FString(Pair.Key), FMath::RoundToInt(Value));
        }
        return Result;
    }

    TArray<FString> ReadStrings(const TArray<TSharedPtr<FJsonValue>>& Values)
    {
        TArray<FString> Result;
        Result.Reserve(Values.Num());
        for (const TSharedPtr<FJsonValue>& Value : Values)
        {
            FString Text;
            if (Value.IsValid() && Value->TryGetString(Text)) Result.Add(Text);
        }
        return Result;
    }

    FShiEngagementRequirements ReadRequirements(const TSharedPtr<FJsonObject>& Object)
    {
        FShiEngagementRequirements Result;
        if (!Object.IsValid()) return Result;
        if (Object->HasTypedField<EJson::Object>(TEXT("min"))) Result.Minimums = ReadIntegers(Object->GetObjectField(TEXT("min")));
        if (Object->HasTypedField<EJson::Object>(TEXT("max"))) Result.Maximums = ReadIntegers(Object->GetObjectField(TEXT("max")));
        return Result;
    }

    bool IsUniqueNonEmpty(const TArray<FString>& Values)
    {
        TSet<FString> Seen;
        for (const FString& Value : Values)
        {
            if (Value.IsEmpty() || Seen.Contains(Value)) return false;
            Seen.Add(Value);
        }
        return Seen.Num() == Values.Num();
    }

    bool SameSet(const TArray<FString>& First, const TArray<FString>& Second)
    {
        return First.Num() == Second.Num() && TSet<FString>(First).Includes(TSet<FString>(Second));
    }

    bool ValidateLocalized(const FShiLocalizedText& Value)
    {
        return !Value.Resolve(TEXT("en")).TrimStartAndEnd().IsEmpty()
            && Value.Values.Contains(TEXT("zh-Hans")) && !Value.Values.FindRef(TEXT("zh-Hans")).TrimStartAndEnd().IsEmpty();
    }

    bool ValidateIntegerMap(const TMap<FString, int32>& Values, const TArray<FString>& Keys, const int32 Minimum,
        const int32 Maximum, const bool bMustBeNonEmpty, FString& OutError, const FString& Label)
    {
        if (bMustBeNonEmpty && Values.IsEmpty())
        {
            OutError = Label + TEXT(" must not be empty.");
            return false;
        }
        for (const TPair<FString, int32>& Pair : Values)
        {
            if (!Keys.Contains(Pair.Key) || Pair.Value < Minimum || Pair.Value > Maximum)
            {
                OutError = FString::Printf(TEXT("%s contains invalid %s=%d."), *Label, *Pair.Key, Pair.Value);
                return false;
            }
        }
        return true;
    }

    bool ValidateRequirements(const FShiEngagementRequirements& Requirements, FString& OutError, const FString& Label)
    {
        if (!ValidateIntegerMap(Requirements.Minimums, FShiEngagementModel::MetricKeys(), 0, 100, false, OutError, Label + TEXT(".min"))
            || !ValidateIntegerMap(Requirements.Maximums, FShiEngagementModel::MetricKeys(), 0, 100, false, OutError, Label + TEXT(".max")))
            return false;
        for (const TPair<FString, int32>& Minimum : Requirements.Minimums)
        {
            if (const int32* Maximum = Requirements.Maximums.Find(Minimum.Key); Maximum && Minimum.Value > *Maximum)
            {
                OutError = FString::Printf(TEXT("%s inverts the threshold for %s."), *Label, *Minimum.Key);
                return false;
            }
        }
        return true;
    }
}

const TArray<FString>& FShiEngagementModel::MetricKeys()
{
    static const TArray<FString> Keys = {
        TEXT("crossingProgress"), TEXT("rearCohesion"), TEXT("reserveReadiness"),
        TEXT("supplyLoads"), TEXT("pursuitClosure"), TEXT("signalIntegrity")
    };
    return Keys;
}

const TArray<FString>& FShiEngagementModel::CampaignResourceKeys()
{
    static const TArray<FString> Keys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};
    return Keys;
}

bool FShiEngagementModel::LoadCanonical(const FShiCampaignModel& Campaign, FString& OutError)
{
    OutError.Empty();
    *this = FShiEngagementModel();
    const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/chapter-01-broken-crossing.v1.json"));
    FString Json;
    if (!FFileHelper::LoadFileToString(Json, *Path))
    {
        OutError = FString::Printf(TEXT("Canonical engagement missing: %s. Run npm run sync:content."), *Path);
        return false;
    }
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
    {
        OutError = TEXT("Canonical engagement JSON could not be parsed.");
        return false;
    }

    SchemaVersion = Root->GetIntegerField(TEXT("schemaVersion"));
    Id = Root->GetStringField(TEXT("id"));
    CampaignId = Root->GetStringField(TEXT("campaignId"));
    NodeId = Root->GetStringField(TEXT("nodeId"));
    DeliveryStatus = Root->GetStringField(TEXT("deliveryStatus"));
    ClaimStatus = Root->GetStringField(TEXT("claimStatus"));
    Title = ReadLocalized(Root->GetObjectField(TEXT("title")));
    Objective = ReadLocalized(Root->GetObjectField(TEXT("objective")));
    SourceRefs = ReadStrings(Root->GetArrayField(TEXT("sourceRefs")));
    ClaimRefs = ReadStrings(Root->GetArrayField(TEXT("claimRefs")));
    Metrics = ReadStrings(Root->GetArrayField(TEXT("metrics")));
    InitialMetrics = ReadIntegers(Root->GetObjectField(TEXT("initialMetrics")));

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("conditions")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEngagementConditionData& Condition = Conditions.AddDefaulted_GetRef();
        Condition.Id = Object->GetStringField(TEXT("id"));
        Condition.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Condition.Signal = ReadLocalized(Object->GetObjectField(TEXT("signal")));
        Condition.LocalEffects = ReadIntegers(Object->GetObjectField(TEXT("localEffects")));
    }
    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("plans")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEngagementPlanData& Plan = Plans.AddDefaulted_GetRef();
        Plan.Id = Object->GetStringField(TEXT("id"));
        Plan.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Plan.MainEffort = ReadLocalized(Object->GetObjectField(TEXT("mainEffort")));
        Plan.WithdrawalCondition = ReadLocalized(Object->GetObjectField(TEXT("withdrawalCondition")));
        Plan.InitialEffects = ReadIntegers(Object->GetObjectField(TEXT("initialEffects")));
        Plan.CampaignEffects = ReadIntegers(Object->GetObjectField(TEXT("campaignEffects")));
        for (const auto& Pair : Object->GetObjectField(TEXT("allowedCommands"))->Values)
        {
            const TArray<TSharedPtr<FJsonValue>>* Values = nullptr;
            if (Pair.Value.IsValid() && Pair.Value->TryGetArray(Values) && Values)
                Plan.AllowedCommands.Add(FString(Pair.Key), ReadStrings(*Values));
        }
    }
    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("pulses")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEngagementPulseData& Pulse = Pulses.AddDefaulted_GetRef();
        Pulse.Id = Object->GetStringField(TEXT("id"));
        Pulse.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Pulse.Objective = ReadLocalized(Object->GetObjectField(TEXT("objective")));
        Pulse.CommandIds = ReadStrings(Object->GetArrayField(TEXT("commandIds")));
    }
    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("commands")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEngagementCommandData& Command = Commands.AddDefaulted_GetRef();
        Command.Id = Object->GetStringField(TEXT("id"));
        Command.PulseId = Object->GetStringField(TEXT("pulseId"));
        Command.Order = Object->GetStringField(TEXT("order"));
        Command.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Command.Intent = ReadLocalized(Object->GetObjectField(TEXT("intent")));
        Command.Effects = ReadIntegers(Object->GetObjectField(TEXT("effects")));
        if (Object->HasTypedField<EJson::Object>(TEXT("requirements")))
            Command.Requirements = ReadRequirements(Object->GetObjectField(TEXT("requirements")));
        const TSharedPtr<FJsonObject> Response = Object->GetObjectField(TEXT("response"));
        Command.Response.Id = Response->GetStringField(TEXT("id"));
        Command.Response.Kind = Response->GetStringField(TEXT("kind"));
        Command.Response.Reveal = ReadLocalized(Response->GetObjectField(TEXT("reveal")));
        Command.Response.Effects = ReadIntegers(Response->GetObjectField(TEXT("effects")));
    }
    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("outcomes")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEngagementOutcomeData& Outcome = Outcomes.AddDefaulted_GetRef();
        Outcome.Id = Object->GetStringField(TEXT("id"));
        Outcome.Status = Object->GetStringField(TEXT("status"));
        Outcome.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Outcome.Summary = ReadLocalized(Object->GetObjectField(TEXT("summary")));
        if (Object->HasTypedField<EJson::Object>(TEXT("requirements")))
            Outcome.Requirements = ReadRequirements(Object->GetObjectField(TEXT("requirements")));
        Outcome.CampaignEffects = ReadIntegers(Object->GetObjectField(TEXT("campaignEffects")));
    }
    return Validate(Campaign, OutError);
}

bool FShiEngagementModel::Validate(const FShiCampaignModel& Campaign, FString& OutError) const
{
    OutError.Empty();
    if (SchemaVersion != 1 || Id != TEXT("chapter-01-broken-crossing") || CampaignId != Campaign.Id
        || NodeId != TEXT("broken-crossing") || DeliveryStatus != TEXT("validated-shared-contract-not-campaign-authority")
        || ClaimStatus != TEXT("dramatic-reconstruction") || !ValidateLocalized(Title) || !ValidateLocalized(Objective))
    {
        OutError = TEXT("Engagement identity, authority, disclosure or localized heading drifted.");
        return false;
    }
    const FShiNodeData* Node = Campaign.FindNode(NodeId);
    if (!Node || !IsUniqueNonEmpty(SourceRefs) || !IsUniqueNonEmpty(ClaimRefs)
        || !SameSet(Metrics, MetricKeys()) || InitialMetrics.Num() != MetricKeys().Num()
        || !ValidateIntegerMap(InitialMetrics, MetricKeys(), 0, 100, true, OutError, TEXT("initialMetrics")))
    {
        if (OutError.IsEmpty()) OutError = TEXT("Engagement node, evidence or metric registry does not close.");
        return false;
    }
    for (const FString& SourceRef : SourceRefs)
    {
        if (!Campaign.FindSource(SourceRef)) { OutError = TEXT("Engagement references an unknown campaign source."); return false; }
    }
    for (const FString& ClaimRef : ClaimRefs)
    {
        const FShiClaimData* Claim = Campaign.FindClaim(ClaimRef);
        if (!Claim) { OutError = TEXT("Engagement references an unknown campaign claim."); return false; }
        for (const FString& RequiredSource : Claim->SourceRefs)
        {
            if (!SourceRefs.Contains(RequiredSource)) { OutError = TEXT("Engagement claim sources are incomplete."); return false; }
        }
    }

    TArray<FString> ConditionIds;
    for (const FShiEngagementConditionData& Condition : Conditions)
    {
        ConditionIds.Add(Condition.Id);
        if (!ValidateLocalized(Condition.Title) || !ValidateLocalized(Condition.Signal)
            || !ValidateIntegerMap(Condition.LocalEffects, MetricKeys(), -25, 25, true, OutError, TEXT("condition effects"))) return false;
    }
    TArray<FString> ExpectedConditionIds;
    for (const FShiFieldConditionData& Condition : Node->Conditions) ExpectedConditionIds.Add(Condition.Id);
    if (!IsUniqueNonEmpty(ConditionIds) || !SameSet(ConditionIds, ExpectedConditionIds))
    {
        OutError = TEXT("Engagement conditions do not exactly mirror the campaign node.");
        return false;
    }

    TArray<FString> PulseIds;
    TArray<FString> PulseCommandIds;
    for (const FShiEngagementPulseData& Pulse : Pulses)
    {
        PulseIds.Add(Pulse.Id);
        PulseCommandIds.Append(Pulse.CommandIds);
        if (!ValidateLocalized(Pulse.Title) || !ValidateLocalized(Pulse.Objective)
            || Pulse.CommandIds.Num() < 2 || !IsUniqueNonEmpty(Pulse.CommandIds))
        { OutError = TEXT("An engagement pulse is incomplete."); return false; }
    }
    if (Pulses.Num() != 3 || !IsUniqueNonEmpty(PulseIds)) { OutError = TEXT("Engagement requires exactly three command pulses."); return false; }

    const TArray<FString> ValidOrders = {TEXT("anchor"), TEXT("advance"), TEXT("screen"), TEXT("shift"), TEXT("feint"), TEXT("reserve"), TEXT("withdraw")};
    const TArray<FString> ValidResponseKinds = {TEXT("state"), TEXT("terrain"), TEXT("supply"), TEXT("network")};
    TArray<FString> CommandIds;
    TArray<FString> ResponseIds;
    for (const FShiEngagementCommandData& Command : Commands)
    {
        CommandIds.Add(Command.Id);
        ResponseIds.Add(Command.Response.Id);
        const FShiEngagementPulseData* Pulse = FindPulse(Command.PulseId);
        if (!Pulse || !Pulse->CommandIds.Contains(Command.Id) || !ValidOrders.Contains(Command.Order)
            || !ValidResponseKinds.Contains(Command.Response.Kind) || !ValidateLocalized(Command.Title)
            || !ValidateLocalized(Command.Intent) || !ValidateLocalized(Command.Response.Reveal)
            || !ValidateIntegerMap(Command.Effects, MetricKeys(), -25, 25, true, OutError, TEXT("command effects"))
            || !ValidateIntegerMap(Command.Response.Effects, MetricKeys(), -25, 25, true, OutError, TEXT("response effects"))
            || !ValidateRequirements(Command.Requirements, OutError, TEXT("command requirements"))) return false;
    }
    if (!IsUniqueNonEmpty(CommandIds) || !IsUniqueNonEmpty(ResponseIds) || !SameSet(PulseCommandIds, CommandIds)
        || PulseCommandIds.Num() != CommandIds.Num())
    { OutError = TEXT("Every engagement command and response must be unique and owned by one pulse."); return false; }

    TArray<FString> PlanIds;
    for (const FShiEngagementPlanData& Plan : Plans)
    {
        PlanIds.Add(Plan.Id);
        TArray<FString> AllowedPulseIds;
        Plan.AllowedCommands.GetKeys(AllowedPulseIds);
        if (!ValidateLocalized(Plan.Title) || !ValidateLocalized(Plan.MainEffort) || !ValidateLocalized(Plan.WithdrawalCondition)
            || !ValidateIntegerMap(Plan.InitialEffects, MetricKeys(), -25, 25, true, OutError, TEXT("plan effects"))
            || !ValidateIntegerMap(Plan.CampaignEffects, CampaignResourceKeys(), -25, 25, false, OutError, TEXT("plan campaign effects"))
            || !SameSet(AllowedPulseIds, PulseIds)) return false;
        for (const FShiEngagementPulseData& Pulse : Pulses)
        {
            const TArray<FString>* Allowed = Plan.AllowedCommands.Find(Pulse.Id);
            if (!Allowed || Allowed->Num() < 2 || !IsUniqueNonEmpty(*Allowed)) { OutError = TEXT("Every plan requires two legal options per pulse."); return false; }
            for (const FString& CommandId : *Allowed)
                if (!Pulse.CommandIds.Contains(CommandId)) { OutError = TEXT("A plan allows a command outside its pulse."); return false; }
        }
    }
    TArray<FString> ExpectedPlanIds;
    for (const FShiChoiceData& Choice : Node->Choices) ExpectedPlanIds.Add(Choice.Id);
    if (!IsUniqueNonEmpty(PlanIds) || !SameSet(PlanIds, ExpectedPlanIds))
    { OutError = TEXT("Engagement plans do not exactly mirror campaign choices."); return false; }

    const TArray<FString> OrderedStatuses = {TEXT("success"), TEXT("costly-success"), TEXT("withdrawal"), TEXT("failure")};
    TArray<FString> OutcomeIds;
    for (int32 Index = 0; Index < Outcomes.Num(); ++Index)
    {
        const FShiEngagementOutcomeData& Outcome = Outcomes[Index];
        OutcomeIds.Add(Outcome.Id);
        if (!OrderedStatuses.IsValidIndex(Index) || Outcome.Status != OrderedStatuses[Index]
            || !ValidateLocalized(Outcome.Title) || !ValidateLocalized(Outcome.Summary)
            || (Index < Outcomes.Num() - 1 && Outcome.Requirements.Minimums.IsEmpty() && Outcome.Requirements.Maximums.IsEmpty())
            || !ValidateRequirements(Outcome.Requirements, OutError, TEXT("outcome requirements"))
            || !ValidateIntegerMap(Outcome.CampaignEffects, CampaignResourceKeys(), -25, 25, false, OutError, TEXT("outcome campaign effects"))) return false;
    }
    if (Outcomes.Num() != 4 || !IsUniqueNonEmpty(OutcomeIds)
        || !Outcomes.Last().Requirements.Minimums.IsEmpty() || !Outcomes.Last().Requirements.Maximums.IsEmpty())
    { OutError = TEXT("Engagement outcomes must remain ordered best-to-unconditional-fallback."); return false; }
    return true;
}

const FShiEngagementConditionData* FShiEngagementModel::FindCondition(const FString& ConditionId) const
{ return Conditions.FindByPredicate([&](const FShiEngagementConditionData& Value) { return Value.Id == ConditionId; }); }
const FShiEngagementPlanData* FShiEngagementModel::FindPlan(const FString& PlanId) const
{ return Plans.FindByPredicate([&](const FShiEngagementPlanData& Value) { return Value.Id == PlanId; }); }
const FShiEngagementPulseData* FShiEngagementModel::FindPulse(const FString& PulseId) const
{ return Pulses.FindByPredicate([&](const FShiEngagementPulseData& Value) { return Value.Id == PulseId; }); }
const FShiEngagementCommandData* FShiEngagementModel::FindCommand(const FString& CommandId) const
{ return Commands.FindByPredicate([&](const FShiEngagementCommandData& Value) { return Value.Id == CommandId; }); }
const FShiEngagementOutcomeData* FShiEngagementModel::FindOutcome(const FString& OutcomeId) const
{ return Outcomes.FindByPredicate([&](const FShiEngagementOutcomeData& Value) { return Value.Id == OutcomeId; }); }

bool FShiEngagementModel::MeetsRequirements(const TMap<FString, int32>& Values, const FShiEngagementRequirements& Requirements)
{
    for (const FString& Key : MetricKeys())
    {
        const int32 Value = Values.FindRef(Key);
        if (const int32* Minimum = Requirements.Minimums.Find(Key); Minimum && Value < *Minimum) return false;
        if (const int32* Maximum = Requirements.Maximums.Find(Key); Maximum && Value > *Maximum) return false;
    }
    return true;
}
