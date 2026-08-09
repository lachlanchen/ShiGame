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

    bool HasUniqueNonEmptyValues(const TArray<FString>& Values)
    {
        TSet<FString> Unique;
        for (const FString& Value : Values)
        {
            if (Value.IsEmpty() || Unique.Contains(Value)) return false;
            Unique.Add(Value);
        }
        return Unique.Num() == Values.Num();
    }

    FString HttpsAuthority(const FString& Url)
    {
        if (!Url.StartsWith(TEXT("https://"), ESearchCase::CaseSensitive)) return FString();
        FString AuthorityAndPath = Url.RightChop(8);
        int32 Boundary = INDEX_NONE;
        if (AuthorityAndPath.FindChar(TEXT('/'), Boundary)) AuthorityAndPath.LeftInline(Boundary);
        if (AuthorityAndPath.IsEmpty() || AuthorityAndPath.Contains(TEXT("@"))) return FString();
        return AuthorityAndPath.ToLower();
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
    OutError.Empty();
    SchemaVersion = 0;
    Id.Empty();
    StartNodeId.Empty();
    InitialResources.Empty();
    Acts.Empty();
    Nodes.Empty();
    Sites.Empty();
    Editions.Empty();
    Sources.Empty();
    Claims.Empty();
    MethodIds.Empty();
    MinimumMethodObservations = 0;
    NeutralMethodRead = FShiMethodReadData();
    MethodReads.Empty();
    OppositionStages.Empty();
    Commitments.Empty();

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

    const FString EditionPath = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/editions.json"));
    FString EditionJson;
    TSharedPtr<FJsonObject> EditionRoot;
    if (!FFileHelper::LoadFileToString(EditionJson, *EditionPath))
    {
        OutError = FString::Printf(TEXT("Public edition registry missing: %s. Run npm run sync:content."), *EditionPath);
        return false;
    }
    const TSharedRef<TJsonReader<>> EditionReader = TJsonReaderFactory<>::Create(EditionJson);
    if (!FJsonSerializer::Deserialize(EditionReader, EditionRoot) || !EditionRoot.IsValid() || EditionRoot->GetIntegerField(TEXT("schemaVersion")) != 1)
    {
        OutError = TEXT("Public edition registry is not valid schema v1 JSON.");
        return false;
    }
    for (const TSharedPtr<FJsonValue>& Value : EditionRoot->GetArrayField(TEXT("editions")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiEditionData& Edition = Editions.AddDefaulted_GetRef();
        Edition.Id = Object->GetStringField(TEXT("id"));
        Object->TryGetStringField(TEXT("sourceUrl"), Edition.SourceUrl);
        Edition.RightsStatus = Object->GetStringField(TEXT("rightsStatus"));
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
        Site.X = static_cast<float>(Object->GetNumberField(TEXT("x")));
        Site.Z = static_cast<float>(Object->GetNumberField(TEXT("z")));
        Site.Status = Object->GetStringField(TEXT("status"));
        Site.Summary = ReadLocalized(Object->GetObjectField(TEXT("summary")));
        Site.Uncertainty = ReadLocalized(Object->GetObjectField(TEXT("uncertainty")));
        Site.SourceRefs = ReadStrings(Object->GetArrayField(TEXT("sourceRefs")));
        Site.ClaimRefs = ReadStrings(Object->GetArrayField(TEXT("claimRefs")));
    }

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("sources")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiSourceData& Source = Sources.AddDefaulted_GetRef();
        Source.Id = Object->GetStringField(TEXT("id"));
        Source.EditionId = Object->GetStringField(TEXT("editionId"));
        Source.Work = Object->GetStringField(TEXT("work"));
        Source.Section = Object->GetStringField(TEXT("section"));
        Source.Locator = Object->GetStringField(TEXT("locator"));
        Object->TryGetStringField(TEXT("url"), Source.Url);
        Object->TryGetStringField(TEXT("author"), Source.Author);
        Object->TryGetStringField(TEXT("date"), Source.Date);
        Source.Note = ReadLocalized(Object->GetObjectField(TEXT("note")));
        Source.ClaimStatus = Object->GetStringField(TEXT("claimStatus"));
        Source.RightsStatus = Object->GetStringField(TEXT("rightsStatus"));
    }

    for (const TSharedPtr<FJsonValue>& Value : Root->GetArrayField(TEXT("claims")))
    {
        const TSharedPtr<FJsonObject> Object = Value->AsObject();
        FShiClaimData& Claim = Claims.AddDefaulted_GetRef();
        Claim.Id = Object->GetStringField(TEXT("id"));
        Claim.Kind = Object->GetStringField(TEXT("kind"));
        Claim.Statement = ReadLocalized(Object->GetObjectField(TEXT("statement")));
        Claim.SourceRefs = ReadStrings(Object->GetArrayField(TEXT("sourceRefs")));
        Claim.ReviewStatus = Object->GetStringField(TEXT("reviewStatus"));
        Claim.Confidence = Object->GetStringField(TEXT("confidence"));
        Claim.Uncertainty = ReadLocalized(Object->GetObjectField(TEXT("uncertainty")));
        Claim.GameUse = ReadLocalized(Object->GetObjectField(TEXT("gameUse")));
        Claim.Reviewer = Object->GetStringField(TEXT("reviewer"));
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
        Node.SourceRefs = ReadStrings(Object->GetArrayField(TEXT("sourceRefs")));
        Node.ClaimRefs = ReadStrings(Object->GetArrayField(TEXT("claimRefs")));
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
const FShiEditionData* FShiCampaignModel::FindEdition(const FString& EditionId) const { return Editions.FindByPredicate([&](const FShiEditionData& Edition) { return Edition.Id == EditionId; }); }
const FShiSourceData* FShiCampaignModel::FindSource(const FString& SourceId) const { return Sources.FindByPredicate([&](const FShiSourceData& Source) { return Source.Id == SourceId; }); }
const FShiClaimData* FShiCampaignModel::FindClaim(const FString& ClaimId) const { return Claims.FindByPredicate([&](const FShiClaimData& Claim) { return Claim.Id == ClaimId; }); }
const FShiCommitmentData* FShiCampaignModel::FindEstablishedCommitment(const FString& ChoiceId) const { return Commitments.FindByPredicate([&](const FShiCommitmentData& Commitment) { return Commitment.EstablishedByChoiceId == ChoiceId; }); }

bool FShiCampaignModel::ValidateEvidence(FString& OutError) const
{
    static const TSet<FString> SourceStatuses = {
        TEXT("received-account"), TEXT("later-compilation"), TEXT("strategic-text"), TEXT("dramatic-reconstruction")
    };
    static const TSet<FString> RightsStatuses = {TEXT("public-link-metadata-only"), TEXT("project-original")};
    static const TSet<FString> ClaimKinds = {
        TEXT("chronology"), TEXT("event"), TEXT("institution"), TEXT("person"), TEXT("geography"), TEXT("strategic-lens"), TEXT("reconstruction")
    };
    static const TSet<FString> ReviewStatuses = {
        TEXT("evidence-located"), TEXT("specialist-review-required"), TEXT("authored-reconstruction")
    };
    static const TSet<FString> ConfidenceLevels = {TEXT("high"), TEXT("medium"), TEXT("low"), TEXT("not-applicable")};
    static const TSet<FString> SiteStatuses = {TEXT("known"), TEXT("reported"), TEXT("reference")};

    if (Editions.IsEmpty() || Sources.IsEmpty() || Claims.IsEmpty())
    {
        OutError = TEXT("Historical evidence requires a public edition registry plus non-empty source and claim registers.");
        return false;
    }

    TSet<FString> EditionIds;
    for (const FShiEditionData& Edition : Editions)
    {
        if (Edition.Id.IsEmpty() || EditionIds.Contains(Edition.Id) || !RightsStatuses.Contains(Edition.RightsStatus)
            || (Edition.RightsStatus == TEXT("public-link-metadata-only") && HttpsAuthority(Edition.SourceUrl).IsEmpty())
            || (Edition.RightsStatus == TEXT("project-original") && !Edition.SourceUrl.IsEmpty()))
        {
            OutError = FString::Printf(TEXT("Invalid or duplicate public edition record %s."), *Edition.Id);
            return false;
        }
        EditionIds.Add(Edition.Id);
    }

    TSet<FString> SourceIds;
    TSet<FString> UsedEditions;
    for (const FShiSourceData& Source : Sources)
    {
        const FShiEditionData* Edition = FindEdition(Source.EditionId);
        const bool bPublicMetadata = Source.RightsStatus == TEXT("public-link-metadata-only");
        if (Source.Id.IsEmpty() || SourceIds.Contains(Source.Id) || !Edition || Source.Work.IsEmpty() || Source.Section.IsEmpty()
            || Source.Locator.IsEmpty() || Source.Note.Resolve(TEXT("en")).IsEmpty() || !SourceStatuses.Contains(Source.ClaimStatus)
            || !RightsStatuses.Contains(Source.RightsStatus) || Edition->RightsStatus != Source.RightsStatus
            || (bPublicMetadata && (HttpsAuthority(Source.Url).IsEmpty() || HttpsAuthority(Source.Url) != HttpsAuthority(Edition->SourceUrl)))
            || (!bPublicMetadata && !Source.Url.IsEmpty())
            || ((Source.ClaimStatus == TEXT("dramatic-reconstruction")) != (Source.RightsStatus == TEXT("project-original"))))
        {
            OutError = FString::Printf(TEXT("Invalid source, edition, rights, locator, or URL boundary at %s."), *Source.Id);
            return false;
        }
        SourceIds.Add(Source.Id);
        UsedEditions.Add(Source.EditionId);
    }

    TSet<FString> ClaimIds;
    for (const FShiClaimData& Claim : Claims)
    {
        const bool bReconstruction = Claim.Kind == TEXT("reconstruction");
        if (Claim.Id.IsEmpty() || ClaimIds.Contains(Claim.Id) || !ClaimKinds.Contains(Claim.Kind)
            || !ReviewStatuses.Contains(Claim.ReviewStatus) || !ConfidenceLevels.Contains(Claim.Confidence)
            || Claim.Statement.Resolve(TEXT("en")).IsEmpty() || Claim.Uncertainty.Resolve(TEXT("en")).IsEmpty()
            || Claim.GameUse.Resolve(TEXT("en")).IsEmpty() || Claim.Reviewer.IsEmpty() || Claim.SourceRefs.IsEmpty()
            || !HasUniqueNonEmptyValues(Claim.SourceRefs)
            || (bReconstruction != (Claim.ReviewStatus == TEXT("authored-reconstruction")))
            || (bReconstruction != (Claim.Confidence == TEXT("not-applicable"))))
        {
            OutError = FString::Printf(TEXT("Invalid claim status, confidence, review, or prose boundary at %s."), *Claim.Id);
            return false;
        }
        for (const FString& SourceId : Claim.SourceRefs)
        {
            if (!FindSource(SourceId))
            {
                OutError = FString::Printf(TEXT("Claim %s references unknown source %s."), *Claim.Id, *SourceId);
                return false;
            }
        }
        ClaimIds.Add(Claim.Id);
    }

    TSet<FString> UsedSources;
    TSet<FString> UsedClaims;
    const auto ValidateReferenceBoundary = [&](const FString& Context, const TArray<FString>& SourceRefs, const TArray<FString>& ClaimRefs) -> bool
    {
        if (SourceRefs.IsEmpty() || ClaimRefs.IsEmpty() || !HasUniqueNonEmptyValues(SourceRefs) || !HasUniqueNonEmptyValues(ClaimRefs))
        {
            OutError = FString::Printf(TEXT("%s lacks a unique non-empty source/claim boundary."), *Context);
            return false;
        }
        for (const FString& SourceId : SourceRefs)
        {
            if (!FindSource(SourceId))
            {
                OutError = FString::Printf(TEXT("%s references unknown source %s."), *Context, *SourceId);
                return false;
            }
            UsedSources.Add(SourceId);
        }
        for (const FString& ClaimId : ClaimRefs)
        {
            const FShiClaimData* Claim = FindClaim(ClaimId);
            if (!Claim)
            {
                OutError = FString::Printf(TEXT("%s references unknown claim %s."), *Context, *ClaimId);
                return false;
            }
            for (const FString& SourceId : Claim->SourceRefs)
            {
                if (!SourceRefs.Contains(SourceId))
                {
                    OutError = FString::Printf(TEXT("%s exposes claim %s without its source %s."), *Context, *ClaimId, *SourceId);
                    return false;
                }
            }
            UsedClaims.Add(ClaimId);
        }
        return true;
    };

    for (const FShiNodeData& Node : Nodes)
        if (!ValidateReferenceBoundary(FString::Printf(TEXT("Node %s"), *Node.Id), Node.SourceRefs, Node.ClaimRefs)) return false;
    for (const FShiSiteData& Site : Sites)
    {
        if (!SiteStatuses.Contains(Site.Status) || Site.Summary.Resolve(TEXT("en")).IsEmpty() || Site.Uncertainty.Resolve(TEXT("en")).IsEmpty()
            || !FMath::IsFinite(Site.X) || !FMath::IsFinite(Site.Z) || Site.X < 0.f || Site.X > 100.f || Site.Z < 0.f || Site.Z > 100.f)
        {
            OutError = FString::Printf(TEXT("Site %s has an invalid intelligence status, schematic position, or uncertainty statement."), *Site.Id);
            return false;
        }
        if (!ValidateReferenceBoundary(FString::Printf(TEXT("Site %s"), *Site.Id), Site.SourceRefs, Site.ClaimRefs)) return false;
    }
    if (UsedEditions.Num() != Editions.Num() || UsedSources.Num() != Sources.Num() || UsedClaims.Num() != Claims.Num())
    {
        OutError = TEXT("Every public edition, source and claim must be reachable from a playable node or wartable site.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCampaignModel::ValidateHorizon(FString& OutError) const
{
    if (!ValidateEvidence(OutError)) return false;
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
