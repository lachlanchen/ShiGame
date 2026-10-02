#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Dom/JsonObject.h"
#include "ShiJinyangModel.h"

namespace
{
bool Same(const TSharedPtr<FJsonValue>& A, const TSharedPtr<FJsonValue>& B)
{
    if (!A || !B || A->Type != B->Type) return false;
    switch (A->Type)
    {
    case EJson::Null: return true;
    case EJson::String: return A->AsString() == B->AsString();
    case EJson::Number: return A->AsNumber() == B->AsNumber();
    case EJson::Boolean: return A->AsBool() == B->AsBool();
    case EJson::Array:
    {
        const auto& X = A->AsArray(); const auto& Y = B->AsArray();
        if (X.Num() != Y.Num()) return false;
        for (int32 I = 0; I < X.Num(); ++I) if (!Same(X[I], Y[I])) return false;
        return true;
    }
    case EJson::Object:
    {
        const auto X = A->AsObject(), Y = B->AsObject();
        if (X->Values.Num() != Y->Values.Num()) return false;
        for (const auto& Pair : X->Values)
        {
            const auto* Value = Y->Values.Find(Pair.Key);
            if (!Value || !Same(Pair.Value, *Value)) return false;
        }
        return true;
    }
    default: return false;
    }
}
}
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiJinyangReplayParity, "SHI.Jinyang.PerformedOrderParity",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FShiJinyangReplayParity::RunTest(const FString& Arguments)
{
    FString Definition, Fixture, Error;
    for (int32 Version : {1,2})
    {
    if (!FFileHelper::LoadFileToString(Definition, *(FPaths::ProjectContentDir() / FString::Printf(TEXT("StreamingAssets/jinyang.v%d.json"),Version)))
        || !FFileHelper::LoadFileToString(Fixture, *(FPaths::ProjectDir() / FString::Printf(TEXT("../../content/conformance/jinyang-replays.v%d.json"),Version))))
    { AddError(TEXT("Missing Jinyang shared definition/fixture")); return false; }
    TSharedPtr<FJsonObject> Root;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Fixture), Root)) return false;
    int32 Checkpoints = 0;
    for (const auto& Raw : Root->GetArrayField(TEXT("routes")))
    {
        const auto Route = Raw->AsObject();
        const FString Name = Route->GetStringField(TEXT("id"));
        FShiJinyangModel Model;
        if (!TestTrue(Name + TEXT(" initialize"), Model.Initialize(Definition, Error))) return false;
        TestEqual(TEXT("Exact rule/cost fingerprint"), Model.GetFingerprint(), Root->GetStringField(TEXT("definitionFingerprint")));
        const auto& Commands = Route->GetArrayField(TEXT("commands"));
        const auto& Expected = Route->GetArrayField(TEXT("checkpoints"));
        TestEqual(Name + TEXT(" checkpoint count"), Expected.Num(), Commands.Num() + 1);
        for (int32 I = 0; I < Expected.Num(); ++I)
        {
            if (I && !TestTrue(Name + TEXT(" performed order"), Model.Commit(Commands[I - 1]->AsString(), Error))) return false;
            auto Actual = MakeShared<FJsonValueObject>(Model.StateObject());
            if (!TestTrue(Name + FString::Printf(TEXT(" complete state %d"), I), Same(Actual, Expected[I]))) return false;
            FShiJinyangModel Resume;
            if (!Resume.Initialize(Definition, Error) || !Resume.Restore(Model.ExportSave(), Error)) { AddError(Error); return false; }
            TestTrue(Name + TEXT(" complete state after resume"), Same(MakeShared<FJsonValueObject>(Resume.StateObject()), Expected[I]));
            ++Checkpoints;
        }
        TestEqual(Name + TEXT(" completed"), Model.Available().Num(), 0);
        const FString Before = Model.ExportSave();
        TestFalse(TEXT("Reject duplicate final order"), Model.Commit(TEXT("execute"), Error));
        TestEqual(TEXT("Rejected order preserves ledger"), Model.ExportSave(), Before);
        TestFalse(TEXT("Reject foreign version without modifying model"), Model.Restore(TEXT("{\"revision\":2,\"definitionFingerprint\":\"bad\",\"history\":[]}"), Error));
        TestEqual(TEXT("Rejected restore preserves ledger"), Model.ExportSave(), Before);
    }
    AddInfo(FString::Printf(TEXT("Jinyang v%d full-state TS/C++ replay parity: %d checkpoints."), Version, Checkpoints));
    }
    if (!FFileHelper::LoadFileToString(Definition, *(FPaths::ProjectContentDir() / TEXT("StreamingAssets/jinyang.v1.json")))) return false;
    FShiJinyangModel Guard;
    TestTrue(TEXT("Geography guard baseline"), Guard.Initialize(Definition, Error));
    const FString Before = Guard.ExportSave();
    TSharedPtr<FJsonObject> Malformed;
    FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Definition), Malformed);
    Malformed->RemoveField(TEXT("sites"));
    FString BadDefinition;
    FJsonSerializer::Serialize(Malformed.ToSharedRef(), TJsonWriterFactory<>::Create(&BadDefinition));
    TestFalse(TEXT("Missing geography fails before creating scene"), Guard.Initialize(BadDefinition, Error));
    TestEqual(TEXT("Failed definition preserves prior model"), Guard.ExportSave(), Before);
    FShiJinyangModel Replies;
    TestTrue(TEXT("Reply model initialized"),Replies.Initialize(Definition,Error));
    for (const FString& Id : {FString(TEXT("brace")),FString(TEXT("diversion")),FString(TEXT("quiet-han"))})
        TestTrue(TEXT("Reply setup order"),Replies.Commit(Id,Error));
    TestEqual(TEXT("Contact alone does not command Han"),Replies.AllyResponse(TEXT("han"))->GetStringField(TEXT("decision")),FString(TEXT("withhold")));
    TestEqual(TEXT("Uncontacted Wei stays"),Replies.AllyResponse(TEXT("wei"))->GetStringField(TEXT("decision")),FString(TEXT("stay")));
    TestTrue(TEXT("Second contact"),Replies.Commit(TEXT("quiet-wei"),Error));
    TestEqual(TEXT("Two unrelayed contacts still withhold"),Replies.AllyResponse(TEXT("wei"))->GetStringField(TEXT("decision")),FString(TEXT("withhold")));
    TestTrue(TEXT("Pledges relayed"),Replies.Commit(TEXT("relay"),Error));
    TestEqual(TEXT("Received partner pledge gives conditional agreement"),Replies.AllyResponse(TEXT("wei"))->GetStringField(TEXT("decision")),FString(TEXT("conditional")));
    TestTrue(TEXT("Early date"),Replies.Commit(TEXT("early-date"),Error));
    TestEqual(TEXT("Acknowledged date is not force readiness"),Replies.AllyResponse(TEXT("wei"))->GetStringField(TEXT("executionIssue")),FString(TEXT("not-ready")));
    TestTrue(TEXT("Reschedule recovery"),Replies.Commit(TEXT("aligned-date"),Error));
    TestTrue(TEXT("Later matching date permits Wei participation"),Replies.AllyResponse(TEXT("wei"))->GetBoolField(TEXT("participates")));
    TestFalse(TEXT("No manufactured reply for an unknown camp"),Replies.AllyResponse(TEXT("unknown")).IsValid());
    return true;
}
#endif
