#include "ShiChenCouncilModel.h"
#include "ShiCampaignSession.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "IO/IoHash.h"

namespace
{
bool ChapterEntry(const FShiCampaignSession& Chapter, FString& Arrival, FString& Entry, FString& Error)
{
    Error = TEXT("Council requires a surviving completed chapter");
    if (!Chapter.GetCampaign() || !Chapter.IsCompleted() || !Chapter.GetFailureReason().IsEmpty()
        || Chapter.GetHistory().IsEmpty()) return false;
    // Length-prefixed fields avoid delimiter collisions. Sort maps/sets so replay
    // insertion order cannot change this engine-local chronicle identity.
    FString Identity = TEXT("shi.chen-entry.v1:");
    auto Add = [&Identity](const FString& Value) { Identity += FString::Printf(TEXT("%d:"), Value.Len()) + Value; };
    Add(Chapter.GetCampaign()->Id);
    Add(FString::Printf(TEXT("%u"), Chapter.GetSeed()));
    Add(Chapter.GetCurrentNodeId());
    Add(Chapter.GetActiveCommitmentId());
    Add(FString::FromInt(Chapter.GetHistory().Num()));
    for (const auto& Turn : Chapter.GetHistory())
    {
        Add(Turn.NodeId); Add(Turn.ChoiceId); Add(Turn.ConditionId);
        Add(Turn.OppositionStageId); Add(Turn.MethodId); Add(Turn.MethodReadId);
        Add(Turn.bMethodReadMatched ? TEXT("1") : TEXT("0"));
        Add(Turn.CommitmentId); Add(Turn.CommitmentOutcomeId);
    }
    TArray<FString> ResourceKeys;
    Chapter.GetResources().GetKeys(ResourceKeys);
    ResourceKeys.Sort();
    Add(FString::FromInt(ResourceKeys.Num()));
    for (const auto& Key : ResourceKeys) { Add(Key); Add(FString::FromInt(Chapter.GetResources().FindRef(Key))); }
    TArray<FString> Flags = Chapter.GetFlags();
    Flags.Sort();
    Add(FString::FromInt(Flags.Num()));
    for (const auto& Flag : Flags) Add(Flag);
    FTCHARToUTF8 Utf8(*Identity);
    Entry = TEXT("chapter-blake3-160:") + LexToString(FIoHash::HashBuffer(Utf8.Get(), Utf8.Length()));
    Arrival = Chapter.GetResources().FindRef(TEXT("grain")) >= 45 ? TEXT("supplied")
        : Chapter.GetResources().FindRef(TEXT("danger")) >= 65 ? TEXT("pressed") : TEXT("divided");
    Error.Reset();
    return true;
}
const TArray<FString> Keys = { TEXT("grain"), TEXT("tempo"), TEXT("city"), TEXT("allies"), TEXT("veterans") };
bool ReadMetrics(const TSharedPtr<FJsonObject>& Parent, const TCHAR* Field, TMap<FString, int32>& Out, bool bOptional, bool bPositive)
{
    if (!Parent.IsValid()) return false;
    if (!Parent->HasField(Field)) return bOptional;
    const TSharedPtr<FJsonObject>* Object = nullptr;
    if (!Parent->TryGetObjectField(Field, Object) || !Object || !Object->IsValid()) return false;
    for (const auto& Pair : (*Object)->Values)
    {
        const FString Key(Pair.Key);
        double Value = 0;
        if (!Keys.Contains(Key) || !Pair.Value->TryGetNumber(Value) || !FMath::IsFinite(Value)
            || Value != FMath::FloorToDouble(Value) || Value > 10 || Value < (bPositive ? 0 : -10)) return false;
        Out.Add(Key, static_cast<int32>(Value));
    }
    return true;
}
void Apply(TMap<FString, int32>& Metrics, const TMap<FString, int32>& Effects)
{
    // Clamp each authored effect block in order, exactly like TypeScript/Swift.
    for (const FString& Key : Keys) Metrics[Key] = FMath::Clamp(Metrics.FindRef(Key) + Effects.FindRef(Key), 0, 10);
}
}

bool FShiChenCouncilModel::InitializeFromChapter(const FString& Json, const FShiCampaignSession& Chapter, FString& Error)
{
    FString Arrival, Entry;
    return ChapterEntry(Chapter, Arrival, Entry, Error) && Initialize(Json, Arrival, Error, Entry);
}

bool FShiChenCouncilModel::ReplayFromChapter(const FString& Definition, const FShiCampaignSession& Chapter,
    const FString& Json, FString& Error)
{
    FString Arrival, Entry;
    return ChapterEntry(Chapter, Arrival, Entry, Error) && ReplaySaveJson(Definition, Arrival, Entry, Json, Error);
}

bool FShiChenCouncilModel::Initialize(const FString& Json, const FString& Arrival, FString& Error, const FString& EntryId)
{
    Error = TEXT("Invalid council definition or arrival");
    TSharedPtr<FJsonObject> Root;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Json), Root) || !Root.IsValid()) return false;
    FString Id;
    double Version = 0;
    if (!Root->TryGetStringField(TEXT("id"), Id) || Id != TEXT("chen-council.v1")
        || !Root->TryGetNumberField(TEXT("schemaVersion"), Version) || Version != 1) return false;
    const TSharedPtr<FJsonObject>* Arrivals = nullptr;
    const TSharedPtr<FJsonObject>* Entry = nullptr;
    const TArray<TSharedPtr<FJsonValue>>* RawRounds = nullptr;
    if (!Root->TryGetObjectField(TEXT("arrivals"), Arrivals) || !Arrivals || !Arrivals->IsValid()
        || !(*Arrivals)->TryGetObjectField(Arrival, Entry) || !Entry || !Entry->IsValid()
        || !Root->TryGetArrayField(TEXT("rounds"), RawRounds) || !RawRounds || RawRounds->Num() != 3) return false;
    FShiChenCouncilModel Next;
    if (!ReadMetrics(*Entry, TEXT("metrics"), Next.Metrics, false, true) || Next.Metrics.Num() != Keys.Num()) return false;
    TSet<FString> Seen;
    for (const auto& RawRound : *RawRounds)
    {
        const TSharedPtr<FJsonObject>* Round = nullptr;
        const TArray<TSharedPtr<FJsonValue>>* RawChoices = nullptr;
        if (!RawRound->TryGetObject(Round) || !Round || !Round->IsValid()
            || !(*Round)->TryGetArrayField(TEXT("choices"), RawChoices) || !RawChoices || RawChoices->Num() != 3) return false;
        const TSet<FString> Earlier = Seen;
        TArray<FChoice> Choices;
        for (const auto& RawChoice : *RawChoices)
        {
            const TSharedPtr<FJsonObject>* Choice = nullptr;
            FChoice Parsed;
            if (!RawChoice->TryGetObject(Choice) || !Choice || !Choice->IsValid()
                || !(*Choice)->TryGetStringField(TEXT("id"), Parsed.Id) || Parsed.Id.IsEmpty() || Seen.Contains(Parsed.Id)
                || !ReadMetrics(*Choice, TEXT("effects"), Parsed.Effects, false, false)
                || !ReadMetrics(*Choice, TEXT("requires"), Parsed.Requires, true, true)) return false;
            Seen.Add(Parsed.Id);
            if ((*Choice)->HasField(TEXT("answers")))
            {
                const TArray<TSharedPtr<FJsonValue>>* Answers = nullptr;
                if (!(*Choice)->TryGetArrayField(TEXT("answers"), Answers) || !Answers) return false;
                for (const auto& RawAnswer : *Answers)
                {
                    const TSharedPtr<FJsonObject>* Answer = nullptr;
                    FAnswer ParsedAnswer;
                    if (!RawAnswer->TryGetObject(Answer) || !Answer || !Answer->IsValid()
                        || !(*Answer)->TryGetStringField(TEXT("afterChoice"), ParsedAnswer.AfterChoice)
                        || !Earlier.Contains(ParsedAnswer.AfterChoice)
                        || !ReadMetrics(*Answer, TEXT("effects"), ParsedAnswer.Effects, false, false)) return false;
                    Parsed.Answers.Add(MoveTemp(ParsedAnswer));
                }
            }
            Choices.Add(MoveTemp(Parsed));
        }
        Next.Rounds.Add(MoveTemp(Choices));
    }
    const FTCHARToUTF8 Utf8(*Json);
    // Engine-local compatibility fingerprint, not authentication or the
    // SHA256 wire format used by other clients. The algorithm is explicit.
    Next.DefinitionFingerprint = TEXT("blake3-160:") + LexToString(FIoHash::HashBuffer(Utf8.Get(), Utf8.Length()));
    Next.ArrivalId = Arrival;
    Next.ChronicleEntryId = EntryId;
    *this = MoveTemp(Next);
    Error.Reset();
    return true;
}

bool FShiChenCouncilModel::ExportSaveJson(FString& Json, FString& Error) const
{
    Error = TEXT("Council is not bound to a chapter chronicle");
    if (Rounds.Num() != 3 || ChronicleEntryId.IsEmpty()) return false;
    TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
    Root->SetStringField(TEXT("format"), TEXT("shi.chen-council.unreal"));
    Root->SetNumberField(TEXT("version"), 1);
    Root->SetStringField(TEXT("definitionFingerprint"), DefinitionFingerprint);
    Root->SetStringField(TEXT("arrival"), ArrivalId);
    Root->SetStringField(TEXT("entryId"), ChronicleEntryId);
    TArray<TSharedPtr<FJsonValue>> Choices;
    for (const auto& Turn : History) Choices.Add(MakeShared<FJsonValueString>(Turn.ChoiceId));
    Root->SetArrayField(TEXT("choices"), Choices);
    FString Encoded;
    if (!FJsonSerializer::Serialize(Root, TJsonWriterFactory<>::Create(&Encoded))) return false;
    Json = MoveTemp(Encoded);
    Error.Reset();
    return true;
}

bool FShiChenCouncilModel::ReplaySaveJson(const FString& DefinitionJson, const FString& Arrival, const FString& EntryId,
    const FString& Json, FString& Error)
{
    Error = TEXT("Council save does not match this chronicle and definition");
    if (EntryId.IsEmpty() || Json.Len() > 1024 * 1024) return false;
    TSharedPtr<FJsonObject> Root;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Json), Root) || !Root.IsValid()) return false;
    FString Format, Fingerprint, SavedArrival, SavedEntry;
    double Version = 0;
    const TArray<TSharedPtr<FJsonValue>>* Choices = nullptr;
    if (!Root->TryGetStringField(TEXT("format"), Format) || Format != TEXT("shi.chen-council.unreal")
        || !Root->TryGetNumberField(TEXT("version"), Version) || Version != 1
        || !Root->TryGetStringField(TEXT("definitionFingerprint"), Fingerprint)
        || !Root->TryGetStringField(TEXT("arrival"), SavedArrival) || SavedArrival != Arrival
        || !Root->TryGetStringField(TEXT("entryId"), SavedEntry) || SavedEntry != EntryId
        || !Root->TryGetArrayField(TEXT("choices"), Choices) || !Choices || Choices->Num() > 3) return false;
    FShiChenCouncilModel Next;
    FString DefinitionError;
    if (!Next.Initialize(DefinitionJson, Arrival, DefinitionError, EntryId) || Next.DefinitionFingerprint != Fingerprint) return false;
    for (const auto& RawChoice : *Choices)
    {
        FString Id;
        if (!RawChoice->TryGetString(Id) || !Next.Commit(Id)) return false;
    }
    *this = MoveTemp(Next);
    Error.Reset();
    return true;
}

TArray<FString> FShiChenCouncilModel::GetChoices() const
{
    TArray<FString> Result;
    if (Rounds.IsValidIndex(History.Num())) for (const auto& Choice : Rounds[History.Num()]) Result.Add(Choice.Id);
    return Result;
}

bool FShiChenCouncilModel::Preview(const FString& Id, FShiChenTurn& Turn) const
{
    if (!Rounds.IsValidIndex(History.Num())) return false;
    const FChoice* Choice = Rounds[History.Num()].FindByPredicate([&](const FChoice& Item) { return Item.Id == Id; });
    if (!Choice) return false;
    for (const auto& Requirement : Choice->Requires) if (Metrics.FindRef(Requirement.Key) < Requirement.Value) return false;
    FShiChenTurn Next { Id, Metrics, Metrics, {} };
    Apply(Next.After, Choice->Effects);
    for (const FAnswer& Answer : Choice->Answers)
        if (History.ContainsByPredicate([&](const FShiChenTurn& Past) { return Past.ChoiceId == Answer.AfterChoice; }))
        {
            Apply(Next.After, Answer.Effects);
            Next.AnsweredPromises.Add(Answer.AfterChoice);
        }
    Turn = MoveTemp(Next);
    return true;
}

bool FShiChenCouncilModel::Commit(const FString& Id)
{
    FShiChenTurn Turn;
    if (!Preview(Id, Turn)) return false;
    Metrics = Turn.After;
    History.Add(MoveTemp(Turn));
    return true;
}

FString FShiChenCouncilModel::GetOutcome() const
{
    if (!IsCompleted()) return {};
    if (Metrics.FindRef(TEXT("grain")) <= 0) return TEXT("empty-granaries");
    int32 Supporters = 0;
    for (const TCHAR* Key : { TEXT("city"), TEXT("allies"), TEXT("veterans") }) if (Metrics.FindRef(Key) >= 6) ++Supporters;
    if (Supporters >= 2 && Metrics.FindRef(TEXT("grain")) >= 2 && Metrics.FindRef(TEXT("tempo")) >= 3) return TEXT("common-front");
    if (Metrics.FindRef(TEXT("city")) >= 6 && Metrics.FindRef(TEXT("veterans")) >= 6) return TEXT("city-stronghold");
    return TEXT("fragile-coalition");
}
