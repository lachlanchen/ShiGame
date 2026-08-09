#include "ShiCampaignSession.h"

#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"

namespace
{
    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};

    TMap<FString, int32> ResourceDeltas(const TMap<FString, int32>& Before, const TMap<FString, int32>& After)
    {
        TMap<FString, int32> Result;
        for (const FString& Key : ResourceKeys)
        {
            const int32 Delta = After.FindRef(Key) - Before.FindRef(Key);
            if (Delta != 0) Result.Add(Key, Delta);
        }
        return Result;
    }

    TSharedRef<FJsonObject> WriteResources(const TMap<FString, int32>& Resources)
    {
        TSharedRef<FJsonObject> Object = MakeShared<FJsonObject>();
        for (const FString& Key : ResourceKeys) Object->SetNumberField(Key, Resources.FindRef(Key));
        return Object;
    }

    TSharedRef<FJsonObject> WriteEffects(const TMap<FString, int32>& Effects)
    {
        TSharedRef<FJsonObject> Object = MakeShared<FJsonObject>();
        for (const FString& Key : ResourceKeys)
            if (const int32* Value = Effects.Find(Key)) Object->SetNumberField(Key, *Value);
        return Object;
    }

    bool SameResources(const TMap<FString, int32>& Left, const TMap<FString, int32>& Right)
    {
        for (const FString& Key : ResourceKeys) if (Left.FindRef(Key) != Right.FindRef(Key)) return false;
        return true;
    }


    bool ReadRequiredResources(const TSharedPtr<FJsonObject>& Parent, const FString& Field, TMap<FString, int32>& OutResources)
    {
        const TSharedPtr<FJsonObject>* Object = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Object) || !Object || !Object->IsValid()) return false;
        OutResources.Empty();
        for (const FString& Key : ResourceKeys)
        {
            double Value = 0;
            if (!(*Object)->TryGetNumberField(Key, Value) || !FMath::IsFinite(Value) || Value != FMath::FloorToDouble(Value) || Value < 0 || Value > 100)
                return false;
            OutResources.Add(Key, static_cast<int32>(Value));
        }
        return true;
    }

    bool ReadRequiredString(const TSharedPtr<FJsonObject>& Object, const FString& Field, FString& OutValue)
    {
        return Object.IsValid() && Object->TryGetStringField(Field, OutValue) && !OutValue.IsEmpty();
    }
}

void FShiCampaignSession::Initialize(const FShiCampaignModel& InCampaign, uint32 InSeed)
{
    Campaign = &InCampaign;
    Seed = InSeed;
    CurrentNodeId = InCampaign.StartNodeId;
    Resources = InCampaign.InitialResources;
    ActiveCommitmentId.Empty();
    FailureReason.Empty();
    Flags.Empty();
    History.Empty();
    bCompleted = false;
}

bool FShiCampaignSession::CanChoose(const FShiChoiceData& Choice) const
{
    for (const TPair<FString, int32>& Minimum : Choice.Minimums)
        if (Resources.FindRef(Minimum.Key) < Minimum.Value) return false;
    for (const TPair<FString, int32>& Maximum : Choice.Maximums)
        if (Resources.FindRef(Maximum.Key) > Maximum.Value) return false;
    return true;
}

bool FShiCampaignSession::ResolveChoice(const FString& ChoiceId, FShiResolutionResult& OutResult, FString& OutError)
{
    OutError.Empty();
    if (!Campaign || bCompleted) { OutError = TEXT("Campaign session is unavailable or complete."); return false; }
    const FShiNodeData* Node = GetCurrentNode();
    const FShiChoiceData* Choice = Node ? Node->Choices.FindByPredicate([&](const FShiChoiceData& Item) { return Item.Id == ChoiceId; }) : nullptr;
    if (!Node || !Choice || !CanChoose(*Choice)) { OutError = FString::Printf(TEXT("Illegal choice %s at %s."), *ChoiceId, *CurrentNodeId); return false; }

    const FShiFieldConditionData* Condition = SelectFieldCondition(*Node);
    const FShiOppositionStageData* Opposition = SelectOppositionStage();
    const FShiMethodReadData* MethodRead = SelectMethodRead();
    const bool bMethodReadHit = MethodRead && !MethodRead->TargetMethodId.IsEmpty() && MethodRead->TargetMethodId == Choice->MethodId;
    const FShiCommitmentData* ActiveCommitment = GetActiveCommitment();
    const FShiCommitmentOutcomeData* CommitmentOutcome = ActiveCommitment
        ? ActiveCommitment->Outcomes.FindByPredicate([&](const FShiCommitmentOutcomeData& Item) { return Item.ChoiceId == Choice->Id; }) : nullptr;
    if (!Condition || !Opposition || !MethodRead) { OutError = TEXT("Campaign session could not select a deterministic resolution layer."); return false; }

    FShiDecisionRecord Record;
    Record.NodeId = Node->Id;
    Record.ChoiceId = Choice->Id;
    Record.ConditionId = Condition->Id;
    Record.OppositionStageId = Opposition->Id;
    Record.MethodId = Choice->MethodId;
    Record.MethodReadId = MethodRead->Id;
    Record.bMethodReadMatched = bMethodReadHit;
    Record.CommitmentId = CommitmentOutcome ? ActiveCommitment->Id : FString();
    Record.CommitmentOutcomeId = CommitmentOutcome ? CommitmentOutcome->Id : FString();
    Record.Before = Resources;
    ApplyEffects(Choice->Effects);
    Record.AfterChoice = Resources;
    if (CommitmentOutcome) ApplyEffects(CommitmentOutcome->Effects);
    Record.AfterCommitment = Resources;
    Record.CommitmentEffects = ResourceDeltas(Record.AfterChoice, Record.AfterCommitment);
    ApplyEffects(Choice->PressureEffects);
    Record.AfterPressure = Resources;
    Record.PressureEffects = ResourceDeltas(Record.AfterCommitment, Record.AfterPressure);
    ApplyEffects(Opposition->Effects);
    Record.AfterOpposition = Resources;
    Record.OppositionEffects = ResourceDeltas(Record.AfterPressure, Record.AfterOpposition);
    if (bMethodReadHit) ApplyEffects(MethodRead->Effects);
    Record.AfterMethodRead = Resources;
    Record.MethodReadEffects = ResourceDeltas(Record.AfterOpposition, Record.AfterMethodRead);
    ApplyEffects(Condition->Effects);
    Record.After = Resources;
    Record.ConditionEffects = ResourceDeltas(Record.AfterMethodRead, Record.After);

    if (CommitmentOutcome) ActiveCommitmentId.Empty();
    if (const FShiCommitmentData* Established = Campaign->FindEstablishedCommitment(Choice->Id)) ActiveCommitmentId = Established->Id;
    for (const FString& Flag : Choice->Flags) Flags.AddUnique(Flag);
    FailureReason = Resources.FindRef(TEXT("danger")) >= 100 ? TEXT("captured") : Resources.FindRef(TEXT("people")) <= 0 ? TEXT("scattered") : FString();
    bCompleted = Choice->Next.IsEmpty() || !FailureReason.IsEmpty();
    if (!bCompleted) CurrentNodeId = Choice->Next;
    History.Add(Record);

    OutResult.Record = Record;
    OutResult.Node = Node;
    OutResult.Choice = Choice;
    OutResult.Condition = Condition;
    OutResult.Opposition = Opposition;
    OutResult.MethodRead = MethodRead;
    OutResult.Commitment = ActiveCommitment;
    OutResult.CommitmentOutcome = CommitmentOutcome;
    return true;
}

void FShiCampaignSession::ApplyEffects(const TMap<FString, int32>& Effects)
{
    for (const TPair<FString, int32>& Effect : Effects)
    {
        int32& Value = Resources.FindOrAdd(Effect.Key);
        Value = FMath::Clamp(Value + Effect.Value, 0, 100);
    }
}

const FShiFieldConditionData* FShiCampaignSession::SelectFieldCondition(const FShiNodeData& Node) const
{
    int32 TotalWeight = 0;
    for (const FShiFieldConditionData& Condition : Node.Conditions) TotalWeight += Condition.Weight;
    if (TotalWeight <= 0 || !Campaign) return nullptr;
    const FString Key = FString::Printf(TEXT("%s|%u|%s|%d"), *Campaign->Id, Seed, *Node.Id, History.Num());
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

const FShiOppositionStageData* FShiCampaignSession::SelectOppositionStage() const
{
    if (!Campaign) return nullptr;
    const int32 Danger = Resources.FindRef(TEXT("danger"));
    return Campaign->OppositionStages.FindByPredicate([&](const FShiOppositionStageData& Stage) { return Danger >= Stage.MinDanger && Danger <= Stage.MaxDanger; });
}

const FShiMethodReadData* FShiCampaignSession::SelectMethodRead() const
{
    if (!Campaign) return nullptr;
    if (History.Num() < Campaign->MinimumMethodObservations) return &Campaign->NeutralMethodRead;
    TMap<FString, int32> Counts;
    for (const FString& MethodId : Campaign->MethodIds) Counts.Add(MethodId, 0);
    for (const FShiDecisionRecord& Record : History) Counts.FindOrAdd(Record.MethodId) += 1;
    int32 Highest = -1;
    FString Leader;
    bool bTie = false;
    for (const TPair<FString, int32>& Count : Counts)
    {
        if (Count.Value > Highest) { Highest = Count.Value; Leader = Count.Key; bTie = false; }
        else if (Count.Value == Highest) bTie = true;
    }
    if (bTie) return &Campaign->NeutralMethodRead;
    if (const FShiMethodReadData* Read = Campaign->MethodReads.FindByPredicate([&](const FShiMethodReadData& Item) { return Item.TargetMethodId == Leader; })) return Read;
    return &Campaign->NeutralMethodRead;
}

const FShiFieldConditionData* FShiCampaignSession::GetCurrentFieldCondition() const
{
    const FShiNodeData* Node = GetCurrentNode();
    return Node ? SelectFieldCondition(*Node) : nullptr;
}

const FShiOppositionStageData* FShiCampaignSession::GetCurrentOppositionStage() const { return SelectOppositionStage(); }
const FShiMethodReadData* FShiCampaignSession::GetCurrentMethodRead() const { return SelectMethodRead(); }
const FShiCommitmentData* FShiCampaignSession::GetActiveCommitment() const
{
    return Campaign ? Campaign->Commitments.FindByPredicate([&](const FShiCommitmentData& Item) { return Item.Id == ActiveCommitmentId; }) : nullptr;
}

bool FShiCampaignSession::ExportSaveJson(FString& OutJson, FString& OutError) const
{
    OutError.Empty();
    if (!Campaign) { OutError = TEXT("Cannot save an uninitialized campaign session."); return false; }
    TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
    Root->SetNumberField(TEXT("saveVersion"), 6);
    Root->SetNumberField(TEXT("legacyDecisionCount"), 0);
    Root->SetNumberField(TEXT("preMethodReadDecisionCount"), 0);
    Root->SetNumberField(TEXT("preCommitmentDecisionCount"), 0);
    Root->SetStringField(TEXT("campaignId"), Campaign->Id);
    Root->SetNumberField(TEXT("seed"), Seed);
    Root->SetStringField(TEXT("currentNodeId"), CurrentNodeId);
    Root->SetObjectField(TEXT("resources"), WriteResources(Resources));
    TArray<TSharedPtr<FJsonValue>> FlagValues;
    for (const FString& Flag : Flags) FlagValues.Add(MakeShared<FJsonValueString>(Flag));
    Root->SetArrayField(TEXT("flags"), FlagValues);
    Root->SetBoolField(TEXT("completed"), bCompleted);
    if (!FailureReason.IsEmpty()) Root->SetStringField(TEXT("failureReason"), FailureReason);
    TArray<TSharedPtr<FJsonValue>> Records;
    for (const FShiDecisionRecord& Record : History)
    {
        TSharedRef<FJsonObject> Object = MakeShared<FJsonObject>();
        Object->SetStringField(TEXT("nodeId"), Record.NodeId);
        Object->SetStringField(TEXT("choiceId"), Record.ChoiceId);
        Object->SetStringField(TEXT("conditionId"), Record.ConditionId);
        Object->SetStringField(TEXT("oppositionStageId"), Record.OppositionStageId);
        Object->SetStringField(TEXT("methodId"), Record.MethodId);
        Object->SetStringField(TEXT("methodReadId"), Record.MethodReadId);
        Object->SetBoolField(TEXT("methodReadMatched"), Record.bMethodReadMatched);
        if (!Record.CommitmentId.IsEmpty()) Object->SetStringField(TEXT("commitmentId"), Record.CommitmentId);
        if (!Record.CommitmentOutcomeId.IsEmpty()) Object->SetStringField(TEXT("commitmentOutcomeId"), Record.CommitmentOutcomeId);
        Object->SetObjectField(TEXT("before"), WriteResources(Record.Before));
        Object->SetObjectField(TEXT("afterChoice"), WriteResources(Record.AfterChoice));
        Object->SetObjectField(TEXT("commitmentEffects"), WriteEffects(Record.CommitmentEffects));
        Object->SetObjectField(TEXT("afterCommitment"), WriteResources(Record.AfterCommitment));
        Object->SetObjectField(TEXT("pressureEffects"), WriteEffects(Record.PressureEffects));
        Object->SetObjectField(TEXT("afterPressure"), WriteResources(Record.AfterPressure));
        Object->SetObjectField(TEXT("oppositionEffects"), WriteEffects(Record.OppositionEffects));
        Object->SetObjectField(TEXT("afterOpposition"), WriteResources(Record.AfterOpposition));
        Object->SetObjectField(TEXT("methodReadEffects"), WriteEffects(Record.MethodReadEffects));
        Object->SetObjectField(TEXT("afterMethodRead"), WriteResources(Record.AfterMethodRead));
        Object->SetObjectField(TEXT("conditionEffects"), WriteEffects(Record.ConditionEffects));
        Object->SetObjectField(TEXT("after"), WriteResources(Record.After));
        Records.Add(MakeShared<FJsonValueObject>(Object));
    }
    Root->SetArrayField(TEXT("history"), Records);
    OutJson.Empty();
    const TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutJson);
    if (!FJsonSerializer::Serialize(Root, Writer)) { OutError = TEXT("Campaign save could not be serialized."); return false; }
    return true;
}

bool FShiCampaignSession::ReplaySaveJson(const FShiCampaignModel& InCampaign, const FString& Json, FString& OutError)
{
    OutError.Empty();
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid()) { OutError = TEXT("Campaign save is not valid JSON."); return false; }
    double SaveVersion = 0;
    double SavedSeedNumber = 0;
    FString CampaignId;
    const TArray<TSharedPtr<FJsonValue>>* SavedHistory = nullptr;
    if (!Root->TryGetNumberField(TEXT("saveVersion"), SaveVersion) || SaveVersion != 6
        || !Root->TryGetStringField(TEXT("campaignId"), CampaignId) || CampaignId != InCampaign.Id
        || !Root->TryGetNumberField(TEXT("seed"), SavedSeedNumber) || !FMath::IsFinite(SavedSeedNumber)
        || SavedSeedNumber != FMath::FloorToDouble(SavedSeedNumber) || SavedSeedNumber < 0 || SavedSeedNumber > static_cast<double>(MAX_uint32)
        || !Root->TryGetArrayField(TEXT("history"), SavedHistory) || !SavedHistory)
    {
        OutError = TEXT("Campaign save header, seed, or history is unsupported.");
        return false;
    }

    FShiCampaignSession Candidate;
    Candidate.Initialize(InCampaign, static_cast<uint32>(SavedSeedNumber));
    for (const TSharedPtr<FJsonValue>& Value : *SavedHistory)
    {
        const TSharedPtr<FJsonObject>* ObjectPointer = nullptr;
        if (!Value.IsValid() || !Value->TryGetObject(ObjectPointer) || !ObjectPointer || !ObjectPointer->IsValid())
        {
            OutError = TEXT("Campaign save history contains a non-object record.");
            return false;
        }
        const TSharedPtr<FJsonObject> Object = *ObjectPointer;
        FString NodeId;
        FString ChoiceId;
        if (!ReadRequiredString(Object, TEXT("nodeId"), NodeId) || NodeId != Candidate.CurrentNodeId
            || !ReadRequiredString(Object, TEXT("choiceId"), ChoiceId) || Candidate.bCompleted)
        {
            OutError = TEXT("Campaign save route is impossible.");
            return false;
        }
        FShiResolutionResult Resolution;
        if (!Candidate.ResolveChoice(ChoiceId, Resolution, OutError)) return false;
        FString ConditionId;
        FString OppositionStageId;
        FString MethodId;
        FString MethodReadId;
        FString CommitmentId;
        FString CommitmentOutcomeId;
        bool bMethodReadMatched = false;
        TMap<FString, int32> SavedAfter;
        Object->TryGetStringField(TEXT("commitmentId"), CommitmentId);
        Object->TryGetStringField(TEXT("commitmentOutcomeId"), CommitmentOutcomeId);
        const FShiDecisionRecord& Record = Resolution.Record;
        if (!ReadRequiredString(Object, TEXT("conditionId"), ConditionId) || ConditionId != Record.ConditionId
            || !ReadRequiredString(Object, TEXT("oppositionStageId"), OppositionStageId) || OppositionStageId != Record.OppositionStageId
            || !ReadRequiredString(Object, TEXT("methodId"), MethodId) || MethodId != Record.MethodId
            || !ReadRequiredString(Object, TEXT("methodReadId"), MethodReadId) || MethodReadId != Record.MethodReadId
            || !Object->TryGetBoolField(TEXT("methodReadMatched"), bMethodReadMatched) || bMethodReadMatched != Record.bMethodReadMatched
            || CommitmentId != Record.CommitmentId || CommitmentOutcomeId != Record.CommitmentOutcomeId
            || !ReadRequiredResources(Object, TEXT("after"), SavedAfter) || !SameResources(SavedAfter, Record.After))
        { OutError = FString::Printf(TEXT("Campaign save decision identity mismatch at %s."), *Record.NodeId); return false; }
    }

    FString SavedNodeId;
    bool bSavedCompleted = false;
    TMap<FString, int32> SavedResources;
    const TArray<TSharedPtr<FJsonValue>>* SavedFlags = nullptr;
    FString SavedFailureReason;
    Root->TryGetStringField(TEXT("failureReason"), SavedFailureReason);
    if (!ReadRequiredString(Root, TEXT("currentNodeId"), SavedNodeId) || SavedNodeId != Candidate.CurrentNodeId
        || !ReadRequiredResources(Root, TEXT("resources"), SavedResources) || !SameResources(SavedResources, Candidate.Resources)
        || !Root->TryGetBoolField(TEXT("completed"), bSavedCompleted) || bSavedCompleted != Candidate.bCompleted
        || !Root->TryGetArrayField(TEXT("flags"), SavedFlags) || !SavedFlags || SavedFlags->Num() != Candidate.Flags.Num()
        || SavedFailureReason != Candidate.FailureReason)
    {
        OutError = TEXT("Campaign save final state does not match its authoritative replay.");
        return false;
    }
    for (int32 Index = 0; Index < SavedFlags->Num(); ++Index)
    {
        FString SavedFlag;
        if (!(*SavedFlags)[Index].IsValid() || !(*SavedFlags)[Index]->TryGetString(SavedFlag) || SavedFlag != Candidate.Flags[Index])
        {
            OutError = TEXT("Campaign save flags do not match its authoritative replay.");
            return false;
        }
    }
    *this = MoveTemp(Candidate);
    return true;
}
