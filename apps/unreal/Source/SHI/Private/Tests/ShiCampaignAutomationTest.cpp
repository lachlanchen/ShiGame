#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "ShiAudioModel.h"
#include "ShiCampaignModel.h"
#include "ShiCampaignSession.h"

namespace
{
    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};

    FString OptionalString(const TSharedPtr<FJsonObject>& Object, const FString& Field)
    {
        FString Value;
        if (Object.IsValid()) Object->TryGetStringField(Field, Value);
        return Value;
    }

    bool CheckResources(FAutomationTestBase& Test, const FString& Context, const TMap<FString, int32>& Actual,
        const TSharedPtr<FJsonObject>& Parent, const FString& Field)
    {
        const TSharedPtr<FJsonObject>* Expected = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Expected) || !Expected || !Expected->IsValid())
        {
            Test.AddError(FString::Printf(TEXT("%s lacks resource snapshot %s."), *Context, *Field));
            return false;
        }
        bool bMatches = true;
        for (const FString& Key : ResourceKeys)
        {
            double ExpectedValue = 0;
            if (!(*Expected)->TryGetNumberField(Key, ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s lacks %s."), *Context, *Field, *Key));
                bMatches = false;
            }
            else if (Actual.FindRef(Key) != static_cast<int32>(ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s.%s expected %d, got %d."), *Context, *Field, *Key,
                    static_cast<int32>(ExpectedValue), Actual.FindRef(Key)));
                bMatches = false;
            }
        }
        return bMatches;
    }

    bool CheckDeltas(FAutomationTestBase& Test, const FString& Context, const TMap<FString, int32>& Actual,
        const TSharedPtr<FJsonObject>& Parent, const FString& Field)
    {
        const TSharedPtr<FJsonObject>* Expected = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Expected) || !Expected || !Expected->IsValid())
        {
            Test.AddError(FString::Printf(TEXT("%s lacks delta set %s."), *Context, *Field));
            return false;
        }
        bool bMatches = true;
        for (const FString& Key : ResourceKeys)
        {
            double ExpectedValue = 0;
            (*Expected)->TryGetNumberField(Key, ExpectedValue);
            if (Actual.FindRef(Key) != static_cast<int32>(ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s.%s expected %+d, got %+d."), *Context, *Field, *Key,
                    static_cast<int32>(ExpectedValue), Actual.FindRef(Key)));
                bMatches = false;
            }
        }
        return bMatches;
    }

    TMap<FString, int32> Deltas(const TMap<FString, int32>& Before, const TMap<FString, int32>& After)
    {
        TMap<FString, int32> Result;
        for (const FString& Key : ResourceKeys)
        {
            const int32 Delta = After.FindRef(Key) - Before.FindRef(Key);
            if (Delta != 0) Result.Add(Key, Delta);
        }
        return Result;
    }

    bool LoadConformance(TSharedPtr<FJsonObject>& OutRoot, FString& OutError)
    {
        FString Json;
        const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/chapter-01-replays.v1.json"));
        if (!FFileHelper::LoadFileToString(Json, *Path))
        {
            OutError = FString::Printf(TEXT("Could not read %s."), *Path);
            return false;
        }
        const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
        if (!FJsonSerializer::Deserialize(Reader, OutRoot) || !OutRoot.IsValid())
        {
            OutError = TEXT("Replay conformance fixture is invalid JSON.");
            return false;
        }
        return true;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignSchemaTest, "SHI.Campaign.SchemaV7Horizon", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignSchemaTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    TestTrue(TEXT("canonical campaign loads"), Campaign.LoadCanonical(Error));
    TestEqual(TEXT("schema version"), Campaign.SchemaVersion, 7);
    TestEqual(TEXT("authored acts"), Campaign.Acts.Num(), 3);
    const FShiNodeData* Start = Campaign.FindNode(Campaign.StartNodeId);
    TestNotNull(TEXT("start node"), Start);
    if (Start)
    {
        TestEqual(TEXT("opening has three orders"), Start->Choices.Num(), 3);
        TestEqual(TEXT("opening order advances"), Start->Choices[0].Next, FString(TEXT("open-council")));
    }
    TestEqual(TEXT("initial Exposure"), Campaign.InitialResources.FindRef(TEXT("danger")), 46);
    TestEqual(TEXT("canonical commitments"), Campaign.Commitments.Num(), 3);
    TestEqual(TEXT("pursuit stages"), Campaign.OppositionStages.Num(), 3);
    TestTrue(TEXT("act/time transitions validate"), Campaign.ValidateHorizon(Error));
    if (!Error.IsEmpty()) AddError(Error);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiHistoricalEvidenceTest, "SHI.History.SourceClaimClosureV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiHistoricalEvidenceTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TestEqual(TEXT("registered public/project editions"), Campaign.Editions.Num(), 5);
    TestEqual(TEXT("canonical public source records"), Campaign.Sources.Num(), 7);
    TestEqual(TEXT("canonical historical claims"), Campaign.Claims.Num(), 13);
    TestTrue(TEXT("source, edition, claim and scene closure validates"), Campaign.ValidateEvidence(Error));
    if (!Error.IsEmpty()) AddError(Error);

    const FShiNodeData* Opening = Campaign.FindNode(Campaign.StartNodeId);
    TestNotNull(TEXT("opening evidence boundary exists"), Opening);
    if (Opening)
    {
        TestEqual(TEXT("opening exposes four source records"), Opening->SourceRefs.Num(), 4);
        TestEqual(TEXT("opening exposes nine claim records"), Opening->ClaimRefs.Num(), 9);
    }
    const FShiSourceData* Sunzi = Campaign.FindSource(TEXT("sunzi-1-calculation"));
    TestNotNull(TEXT("Sunzi design lens is registered"), Sunzi);
    if (Sunzi) TestEqual(TEXT("Sunzi is not episode evidence"), Sunzi->ClaimStatus, FString(TEXT("strategic-text")));
    const FShiSourceData* Reconstruction = Campaign.FindSource(TEXT("dramatic-daze-keeper"));
    TestNotNull(TEXT("authored reconstruction is registered"), Reconstruction);
    if (Reconstruction)
    {
        TestEqual(TEXT("reconstruction rights are project-original"), Reconstruction->RightsStatus, FString(TEXT("project-original")));
        TestTrue(TEXT("reconstruction has no external URL"), Reconstruction->Url.IsEmpty());
    }
    const FShiClaimData* Penalty = Campaign.FindClaim(TEXT("daze-delay-penalty-account"));
    TestNotNull(TEXT("contested penalty claim is registered"), Penalty);
    if (Penalty)
    {
        TestEqual(TEXT("penalty claim remains specialist-gated"), Penalty->ReviewStatus, FString(TEXT("specialist-review-required")));
        TestEqual(TEXT("penalty claim confidence remains low"), Penalty->Confidence, FString(TEXT("low")));
    }

    FShiCampaignModel MissingSource = Campaign;
    MissingSource.Nodes[0].SourceRefs.Remove(TEXT("shiji-48-daze"));
    TestFalse(TEXT("a scene cannot expose a claim without all of its sources"), MissingSource.ValidateEvidence(Error));
    FShiCampaignModel PrivatePath = Campaign;
    PrivatePath.Sources[0].Url = TEXT("file:///private-source.pdf");
    TestFalse(TEXT("private/local source paths are rejected"), PrivatePath.ValidateEvidence(Error));
    FShiCampaignModel RightsDrift = Campaign;
    RightsDrift.Sources[0].RightsStatus = TEXT("project-original");
    TestFalse(TEXT("source rights must match its public edition"), RightsDrift.ValidateEvidence(Error));
    FShiCampaignModel OriginDrift = Campaign;
    OriginDrift.Sources[0].Url = TEXT("https://example.com/not-the-registered-edition");
    TestFalse(TEXT("public links must remain on the registered edition origin"), OriginDrift.ValidateEvidence(Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiAudioContractTest, "SHI.Audio.ProceduralContractV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiAudioContractTest::RunTest(const FString& Parameters)
{
    FShiAudioModel Audio;
    FString Error;
    TestTrue(TEXT("canonical audio loads"), Audio.LoadCanonical(Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("audio schema"), Audio.SchemaVersion, 1);
    TestEqual(TEXT("seven semantic cues"), Audio.Cues.Num(), 7);
    TestFalse(TEXT("sound defaults off"), Audio.Mix.bDefaultEnabled);
    TestTrue(TEXT("master cap is conservative"), Audio.Mix.MasterCap <= .8f);
    TestEqual(TEXT("rain synthesis rate"), Audio.Ambience.SampleRate, 24000);

    const TArray<float> FirstRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed);
    const TArray<float> RepeatedRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed);
    const TArray<float> OtherRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed + 1u);
    TestTrue(TEXT("rain is deterministic"), FirstRain == RepeatedRain);
    TestFalse(TEXT("rain seed changes output"), FirstRain == OtherRain);
    double RainSum = 0.0;
    float RainPeak = 0.f;
    for (const float Sample : FirstRain) { RainSum += Sample; RainPeak = FMath::Max(RainPeak, FMath::Abs(Sample)); }
    TestTrue(TEXT("raw rain is zero mean"), FMath::Abs(RainSum / FirstRain.Num()) <= 0.000001);
    TestTrue(TEXT("raw rain stays normalized"), RainPeak <= 1.f);

    const float CueAudibilityFloor = FMath::Pow(10.f, -42.f / 20.f);
    for (const TPair<FName, TArray<FShiToneData>>& Cue : Audio.Cues)
    {
        const TArray<float> Samples = FShiAudioModel::CreateCueSamples(Cue.Value, Audio.Envelope, Audio.Ambience.SampleRate);
        float Peak = 0.f;
        for (const float Sample : Samples) Peak = FMath::Max(Peak, FMath::Abs(Sample));
        TestTrue(*FString::Printf(TEXT("cue %s clears audibility floor"), *Cue.Key.ToString()), Peak >= CueAudibilityFloor);
        TestTrue(*FString::Printf(TEXT("cue %s remains brief"), *Cue.Key.ToString()), Samples.Num() <= FMath::CeilToInt(.5f * Audio.Ambience.SampleRate));
    }
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignReplayConformanceTest, "SHI.Campaign.CrossEngineReplayV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignReplayConformanceTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TSharedPtr<FJsonObject> Fixture;
    if (!LoadConformance(Fixture, Error)) { AddError(Error); return false; }
    TestEqual(TEXT("fixture version"), Fixture->GetIntegerField(TEXT("fixtureVersion")), 1);
    TestEqual(TEXT("fixture campaign"), Fixture->GetStringField(TEXT("campaignId")), Campaign.Id);
    TestEqual(TEXT("fixture route count"), Fixture->GetIntegerField(TEXT("routeCount")), 46);
    const uint32 Seed = static_cast<uint32>(Fixture->GetNumberField(TEXT("seed")));
    const TArray<TSharedPtr<FJsonValue>>& Routes = Fixture->GetArrayField(TEXT("routes"));
    TestEqual(TEXT("materialized route count"), Routes.Num(), 46);

    for (const TSharedPtr<FJsonValue>& RouteValue : Routes)
    {
        const TSharedPtr<FJsonObject> Route = RouteValue->AsObject();
        if (!Route.IsValid()) { AddError(TEXT("Conformance route is not an object.")); continue; }
        const FString RouteId = Route->GetStringField(TEXT("id"));
        FShiCampaignSession Session;
        Session.Initialize(Campaign, Seed);
        const TArray<TSharedPtr<FJsonValue>>& Turns = Route->GetArrayField(TEXT("turns"));
        for (int32 TurnIndex = 0; TurnIndex < Turns.Num(); ++TurnIndex)
        {
            const TSharedPtr<FJsonObject> Expected = Turns[TurnIndex]->AsObject();
            const FString Context = FString::Printf(TEXT("route %s turn %d"), *RouteId, TurnIndex + 1);
            if (!Expected.IsValid()) { AddError(Context + TEXT(" is not an object.")); break; }
            FShiResolutionResult Resolution;
            if (!Session.ResolveChoice(Expected->GetStringField(TEXT("choiceId")), Resolution, Error))
            {
                AddError(FString::Printf(TEXT("%s did not resolve: %s"), *Context, *Error));
                break;
            }
            const FShiDecisionRecord& Record = Resolution.Record;
            TestEqual(*FString::Printf(TEXT("%s node"), *Context), Record.NodeId, Expected->GetStringField(TEXT("nodeId")));
            TestEqual(*FString::Printf(TEXT("%s condition"), *Context), Record.ConditionId, Expected->GetStringField(TEXT("conditionId")));
            TestEqual(*FString::Printf(TEXT("%s pursuit"), *Context), Record.OppositionStageId, OptionalString(Expected, TEXT("oppositionStageId")));
            TestEqual(*FString::Printf(TEXT("%s method"), *Context), Record.MethodId, Expected->GetStringField(TEXT("methodId")));
            TestEqual(*FString::Printf(TEXT("%s method read"), *Context), Record.MethodReadId, OptionalString(Expected, TEXT("methodReadId")));
            TestEqual(*FString::Printf(TEXT("%s method match"), *Context), Record.bMethodReadMatched, Expected->GetBoolField(TEXT("methodReadMatched")));
            TestEqual(*FString::Printf(TEXT("%s commitment"), *Context), Record.CommitmentId, OptionalString(Expected, TEXT("commitmentId")));
            TestEqual(*FString::Printf(TEXT("%s commitment outcome"), *Context), Record.CommitmentOutcomeId, OptionalString(Expected, TEXT("commitmentOutcomeId")));
            CheckDeltas(*this, Context, Deltas(Record.Before, Record.AfterChoice), Expected, TEXT("playerDeltas"));
            CheckDeltas(*this, Context, Record.CommitmentEffects, Expected, TEXT("commitmentDeltas"));
            CheckDeltas(*this, Context, Record.PressureEffects, Expected, TEXT("pressureDeltas"));
            CheckDeltas(*this, Context, Record.OppositionEffects, Expected, TEXT("oppositionDeltas"));
            CheckDeltas(*this, Context, Record.MethodReadEffects, Expected, TEXT("methodReadDeltas"));
            CheckDeltas(*this, Context, Record.ConditionEffects, Expected, TEXT("fieldDeltas"));
            CheckResources(*this, Context, Record.AfterChoice, Expected, TEXT("afterChoice"));
            CheckResources(*this, Context, Record.AfterCommitment, Expected, TEXT("afterCommitment"));
            CheckResources(*this, Context, Record.AfterPressure, Expected, TEXT("afterPressure"));
            CheckResources(*this, Context, Record.AfterOpposition, Expected, TEXT("afterOpposition"));
            CheckResources(*this, Context, Record.AfterMethodRead, Expected, TEXT("afterMethodRead"));
            CheckResources(*this, Context, Record.After, Expected, TEXT("after"));
            TestEqual(*FString::Printf(TEXT("%s next node"), *Context), Session.GetCurrentNodeId(), Expected->GetStringField(TEXT("nextNodeId")));
            TestEqual(*FString::Printf(TEXT("%s completion"), *Context), Session.IsCompleted(), Expected->GetBoolField(TEXT("completed")));
            TestEqual(*FString::Printf(TEXT("%s failure"), *Context), Session.GetFailureReason(), OptionalString(Expected, TEXT("failureReason")));
            TestEqual(*FString::Printf(TEXT("%s active commitment"), *Context), Session.GetActiveCommitmentId(), OptionalString(Expected, TEXT("activeCommitmentId")));
        }

        const TSharedPtr<FJsonObject> Final = Route->GetObjectField(TEXT("final"));
        const FString FinalContext = FString::Printf(TEXT("route %s final"), *RouteId);
        TestEqual(*FString::Printf(TEXT("%s node"), *FinalContext), Session.GetCurrentNodeId(), Final->GetStringField(TEXT("currentNodeId")));
        CheckResources(*this, FinalContext, Session.GetResources(), Final, TEXT("resources"));
        TestEqual(*FString::Printf(TEXT("%s completion"), *FinalContext), Session.IsCompleted(), Final->GetBoolField(TEXT("completed")));
        TestEqual(*FString::Printf(TEXT("%s failure"), *FinalContext), Session.GetFailureReason(), OptionalString(Final, TEXT("failureReason")));
        const TArray<TSharedPtr<FJsonValue>>& ExpectedFlags = Final->GetArrayField(TEXT("flags"));
        TestEqual(*FString::Printf(TEXT("%s flags"), *FinalContext), Session.GetFlags().Num(), ExpectedFlags.Num());
        for (int32 Index = 0; Index < FMath::Min(Session.GetFlags().Num(), ExpectedFlags.Num()); ++Index)
            TestEqual(*FString::Printf(TEXT("%s flag %d"), *FinalContext, Index), Session.GetFlags()[Index], ExpectedFlags[Index]->AsString());
    }
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignSaveReplayTest, "SHI.Campaign.SaveReplayIntegrityV6", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignSaveReplayTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TSharedPtr<FJsonObject> Fixture;
    if (!LoadConformance(Fixture, Error)) { AddError(Error); return false; }
    const uint32 Seed = static_cast<uint32>(Fixture->GetNumberField(TEXT("seed")));
    const TSharedPtr<FJsonObject> Route = Fixture->GetArrayField(TEXT("routes"))[0]->AsObject();
    FShiCampaignSession Original;
    Original.Initialize(Campaign, Seed);
    for (const TSharedPtr<FJsonValue>& ChoiceValue : Route->GetArrayField(TEXT("choiceIds")))
    {
        FShiResolutionResult Resolution;
        if (!Original.ResolveChoice(ChoiceValue->AsString(), Resolution, Error)) { AddError(Error); return false; }
    }
    FString Save;
    TestTrue(TEXT("version-six save exports"), Original.ExportSaveJson(Save, Error));
    if (!Error.IsEmpty()) AddError(Error);
    FShiCampaignSession Replayed;
    TestTrue(TEXT("version-six save replays"), Replayed.ReplaySaveJson(Campaign, Save, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("replayed node"), Replayed.GetCurrentNodeId(), Original.GetCurrentNodeId());
    TestEqual(TEXT("replayed decisions"), Replayed.GetHistory().Num(), Original.GetHistory().Num());
    TestEqual(TEXT("replayed completion"), Replayed.IsCompleted(), Original.IsCompleted());
    for (const FString& Key : ResourceKeys) TestEqual(*FString::Printf(TEXT("replayed %s"), *Key), Replayed.GetResources().FindRef(Key), Original.GetResources().FindRef(Key));

    FString Tampered = Save;
    const FString OriginalCondition = Original.GetHistory()[0].ConditionId;
    Tampered.ReplaceInline(*OriginalCondition, TEXT("tampered-condition"), ESearchCase::CaseSensitive);
    FShiCampaignSession Protected;
    Protected.Initialize(Campaign, Seed);
    const FString ProtectedNode = Protected.GetCurrentNodeId();
    TestFalse(TEXT("tampered save is rejected"), Protected.ReplaySaveJson(Campaign, Tampered, Error));
    TestEqual(TEXT("rejected replay is atomic"), Protected.GetCurrentNodeId(), ProtectedNode);
    return !HasAnyErrors();
}

#endif
