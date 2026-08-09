#include "ShiCampaignModel.h"

#include "Dom/JsonObject.h"
#include "HAL/FileManager.h"
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
        for (const TPair<FString, TSharedPtr<FJsonValue>>& Pair : Object->Values)
        {
            FString Value;
            if (Pair.Value.IsValid() && Pair.Value->TryGetString(Value)) Result.Values.Add(Pair.Key, Value);
        }
        return Result;
    }

    TMap<FString, int32> ReadEffects(const TSharedPtr<FJsonObject>& Object)
    {
        TMap<FString, int32> Result;
        if (!Object.IsValid()) return Result;
        for (const TPair<FString, TSharedPtr<FJsonValue>>& Pair : Object->Values)
        {
            double Number = 0;
            if (Pair.Value.IsValid() && Pair.Value->TryGetNumber(Number)) Result.Add(Pair.Key, FMath::RoundToInt(Number));
        }
        return Result;
    }
}

FString FShiLocalizedText::Resolve(const FString& Locale) const
{
    if (const FString* Exact = Values.Find(Locale)) return *Exact;
    if (const FString* English = Values.Find(TEXT("en"))) return *English;
    if (const FString* Chinese = Values.Find(TEXT("zh-Hans"))) return *Chinese;
    return Values.Num() > 0 ? Values.CreateConstIterator().Value() : FString();
}

bool FShiCampaignModel::LoadCanonical(FString& OutError)
{
    const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/chapter-01-daze.json"));
    FString Json;
    if (!FFileHelper::LoadFileToString(Json, *Path))
    {
        OutError = FString::Printf(TEXT("Canonical campaign missing: %s. Run npm run sync:content."), *Path);
        return false;
    }

    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
    {
        OutError = TEXT("Canonical campaign JSON could not be parsed.");
        return false;
    }

    SchemaVersion = Root->GetIntegerField(TEXT("schemaVersion"));
    Id = Root->GetStringField(TEXT("id"));
    StartNodeId = Root->GetStringField(TEXT("startNodeId"));
    InitialResources = ReadEffects(Root->GetObjectField(TEXT("initialResources")));

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("acts")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiActData& Act = Acts.AddDefaulted_GetRef();
        Act.Id = Object->GetStringField(TEXT("id"));
        Act.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Act.Objective = ReadLocalized(Object->GetObjectField(TEXT("objective")));
    }

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("sites")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiSiteData& Site = Sites.AddDefaulted_GetRef();
        Site.Id = Object->GetStringField(TEXT("id"));
        Site.Name = ReadLocalized(Object->GetObjectField(TEXT("name")));
    }

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("nodes")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiNodeData& Node = Nodes.AddDefaulted_GetRef();
        Node.Id = Object->GetStringField(TEXT("id"));
        Node.ActId = Object->GetStringField(TEXT("actId"));
        Node.TimeIndex = Object->GetIntegerField(TEXT("timeIndex"));
        Node.SiteId = Object->GetStringField(TEXT("siteId"));
        Node.DateLabel = ReadLocalized(Object->GetObjectField(TEXT("dateLabel")));
        Node.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Node.Context = ReadLocalized(Object->GetObjectField(TEXT("context")));
        Node.Dialogue = ReadLocalized(Object->GetObjectField(TEXT("dialogue")));
        for (const TSharedPtr<FJsonValue>& ConditionValue : Object->GetArrayField(TEXT("conditions")))
        {
            const TSharedPtr<FJsonObject> ConditionObject = ConditionValue->AsObject();
            FShiFieldConditionData& Condition = Node.Conditions.AddDefaulted_GetRef();
            Condition.Id = ConditionObject->GetStringField(TEXT("id"));
            Condition.Title = ReadLocalized(ConditionObject->GetObjectField(TEXT("title")));
            Condition.Signal = ReadLocalized(ConditionObject->GetObjectField(TEXT("signal")));
            Condition.Weight = ConditionObject->GetIntegerField(TEXT("weight"));
            Condition.Effects = ReadEffects(ConditionObject->GetObjectField(TEXT("effects")));
        }
        for (const TSharedPtr<FJsonValue>& ChoiceValue : Object->GetArrayField(TEXT("choices")))
        {
            const TSharedPtr<FJsonObject> ChoiceObject = ChoiceValue->AsObject();
            FShiChoiceData& Choice = Node.Choices.AddDefaulted_GetRef();
            Choice.Id = ChoiceObject->GetStringField(TEXT("id"));
            Choice.Label = ReadLocalized(ChoiceObject->GetObjectField(TEXT("label")));
            Choice.Intent = ReadLocalized(ChoiceObject->GetObjectField(TEXT("intent")));
            Choice.Strategy = ReadLocalized(ChoiceObject->GetObjectField(TEXT("strategy")));
            Choice.Consequence = ReadLocalized(ChoiceObject->GetObjectField(TEXT("consequence")));
            Choice.MethodId = ChoiceObject->GetStringField(TEXT("methodId"));
            Choice.Effects = ReadEffects(ChoiceObject->GetObjectField(TEXT("effects")));
            if (ChoiceObject->HasTypedField<EJson::Object>(TEXT("requirements")))
            {
                const TSharedPtr<FJsonObject> Requirements = ChoiceObject->GetObjectField(TEXT("requirements"));
                if (Requirements->HasTypedField<EJson::Object>(TEXT("min"))) Choice.Minimums = ReadEffects(Requirements->GetObjectField(TEXT("min")));
                if (Requirements->HasTypedField<EJson::Object>(TEXT("max"))) Choice.Maximums = ReadEffects(Requirements->GetObjectField(TEXT("max")));
            }
            if (ChoiceObject->HasTypedField<EJson::Object>(TEXT("pressure")))
            {
                const TSharedPtr<FJsonObject> Pressure = ChoiceObject->GetObjectField(TEXT("pressure"));
                Choice.PressureWarning = ReadLocalized(Pressure->GetObjectField(TEXT("warning")));
                Choice.PressureReveal = ReadLocalized(Pressure->GetObjectField(TEXT("reveal")));
                Choice.PressureEffects = ReadEffects(Pressure->GetObjectField(TEXT("effects")));
            }
            if (ChoiceObject->HasTypedField<EJson::Array>(TEXT("flags")))
                for (const TSharedPtr<FJsonValue>& Flag : ChoiceObject->GetArrayField(TEXT("flags"))) Choice.Flags.Add(Flag->AsString());
            ChoiceObject->TryGetStringField(TEXT("nextNodeId"), Choice.Next);
        }
    }

    const TSharedPtr<FJsonObject> Opposition = Root->GetObjectField(TEXT("opposition"));
    for (const TSharedPtr<FJsonValue>& Value : Opposition->GetArrayField(TEXT("methods")))
        MethodIds.Add(Value->AsObject()->GetStringField(TEXT("id")));
    const TSharedPtr<FJsonObject> MethodRead = Opposition->GetObjectField(TEXT("methodRead"));
    MinimumMethodObservations = MethodRead->GetIntegerField(TEXT("minimumObservations"));
    {
        const TSharedPtr<FJsonObject> Neutral = MethodRead->GetObjectField(TEXT("neutral"));
        NeutralMethodRead.Id = Neutral->GetStringField(TEXT("id"));
        NeutralMethodRead.Title = ReadLocalized(Neutral->GetObjectField(TEXT("title")));
        NeutralMethodRead.Forecast = ReadLocalized(Neutral->GetObjectField(TEXT("forecast")));
    }
    for (const TSharedPtr<FJsonValue>& Value : MethodRead->GetArrayField(TEXT("countermeasures")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiMethodReadData& Read = MethodReads.AddDefaulted_GetRef();
        Read.Id = Object->GetStringField(TEXT("id"));
        Read.TargetMethodId = Object->GetStringField(TEXT("targetMethodId"));
        Read.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Read.Forecast = ReadLocalized(Object->GetObjectField(TEXT("forecast")));
        Read.HitResponse = ReadLocalized(Object->GetObjectField(TEXT("hitResponse")));
        Read.MissResponse = ReadLocalized(Object->GetObjectField(TEXT("missResponse")));
        Read.Effects = ReadEffects(Object->GetObjectField(TEXT("effects")));
    }
    for (const TSharedPtr<FJsonValue>& Value : Opposition->GetArrayField(TEXT("stages")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiOppositionStageData& Stage = OppositionStages.AddDefaulted_GetRef();
        Stage.Id = Object->GetStringField(TEXT("id"));
        Stage.MinDanger = Object->GetIntegerField(TEXT("minDanger"));
        Stage.MaxDanger = Object->GetIntegerField(TEXT("maxDanger"));
        Stage.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Stage.Forecast = ReadLocalized(Object->GetObjectField(TEXT("forecast")));
        Stage.Response = ReadLocalized(Object->GetObjectField(TEXT("response")));
        Stage.Counterplay = ReadLocalized(Object->GetObjectField(TEXT("counterplay")));
        Stage.Effects = ReadEffects(Object->GetObjectField(TEXT("effects")));
    }

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("commitments")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiCommitmentData& Commitment = Commitments.AddDefaulted_GetRef();
        Commitment.Id = Object->GetStringField(TEXT("id"));
        Commitment.EstablishedByChoiceId = Object->GetStringField(TEXT("establishedByChoiceId"));
        Commitment.Title = ReadLocalized(Object->GetObjectField(TEXT("title")));
        Commitment.Promise = ReadLocalized(Object->GetObjectField(TEXT("promise")));
        for (const TSharedPtr<FJsonValue>& OutcomeValue : Object->GetArrayField(TEXT("outcomes")))
        {
            const TSharedPtr<FJsonObject> OutcomeObject = OutcomeValue->AsObject();
            FShiCommitmentOutcomeData& Outcome = Commitment.Outcomes.AddDefaulted_GetRef();
            Outcome.Id = OutcomeObject->GetStringField(TEXT("id"));
            Outcome.ChoiceId = OutcomeObject->GetStringField(TEXT("choiceId"));
            Outcome.Status = OutcomeObject->GetStringField(TEXT("status"));
            Outcome.Response = ReadLocalized(OutcomeObject->GetObjectField(TEXT("response")));
            Outcome.Effects = ReadEffects(OutcomeObject->GetObjectField(TEXT("effects")));
        }
    }

    return ValidateHorizon(OutError);
}

const FShiNodeData* FShiCampaignModel::FindNode(const FString& NodeId) const { return Nodes.FindByPredicate([&](const FShiNodeData& Node) { return Node.Id == NodeId; }); }
const FShiActData* FShiCampaignModel::FindAct(const FString& ActId) const { return Acts.FindByPredicate([&](const FShiActData& Act) { return Act.Id == ActId; }); }
const FShiSiteData* FShiCampaignModel::FindSite(const FString& SiteId) const { return Sites.FindByPredicate([&](const FShiSiteData& Site) { return Site.Id == SiteId; }); }
const FShiCommitmentData* FShiCampaignModel::FindEstablishedCommitment(const FString& ChoiceId) const { return Commitments.FindByPredicate([&](const FShiCommitmentData& Commitment) { return Commitment.EstablishedByChoiceId == ChoiceId; }); }

bool FShiCampaignModel::ValidateHorizon(FString& OutError) const
{
    if (SchemaVersion != 7 || Acts.Num() != 3 || !FindNode(StartNodeId))
    {
        OutError = TEXT("Unreal requires schema v7, exactly three authored acts and a valid start node.");
        return false;
    }
    for (const FShiNodeData& Node : Nodes)
    {
        const int32 ActIndex = Acts.IndexOfByPredicate([&](const FShiActData& Act) { return Act.Id == Node.ActId; });
        if (ActIndex == INDEX_NONE || Node.TimeIndex < 0 || !FindSite(Node.SiteId) || Node.Conditions.IsEmpty() || Node.Choices.IsEmpty())
        {
            OutError = FString::Printf(TEXT("Invalid act/time/site closure at node %s."), *Node.Id);
            return false;
        }
        for (const FShiChoiceData& Choice : Node.Choices)
        {
            if (!MethodIds.Contains(Choice.MethodId))
            {
                OutError = FString::Printf(TEXT("Unknown strategic method %s at node %s."), *Choice.MethodId, *Node.Id);
                return false;
            }
            if (Choice.Next.IsEmpty()) continue;
            const FShiNodeData* Next = FindNode(Choice.Next);
            const int32 NextActIndex = Next ? Acts.IndexOfByPredicate([&](const FShiActData& Act) { return Act.Id == Next->ActId; }) : INDEX_NONE;
            if (!Next || Next->TimeIndex <= Node.TimeIndex || NextActIndex < ActIndex || NextActIndex > ActIndex + 1)
            {
                OutError = FString::Printf(TEXT("Invalid horizon transition %s -> %s."), *Node.Id, *Choice.Next);
                return false;
            }
        }
    }
    return true;
}
