#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "ShiChenCouncilModel.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiChenCouncilConformanceTest, "SHI.ChenCouncil.SharedRoutes",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiChenCouncilConformanceTest::RunTest(const FString& Parameters)
{
    FString Definition, Fixture;
    if (!FFileHelper::LoadFileToString(Definition, *(FPaths::ProjectContentDir() / TEXT("StreamingAssets/chen-council.v1.json")))
        || !FFileHelper::LoadFileToString(Fixture, *(FPaths::ProjectDir() / TEXT("../../content/conformance/chen-council-replays.v1.json"))))
    { AddError(TEXT("Missing shared council definition/fixtures")); return false; }
    FString Canonical;
    if (!FFileHelper::LoadFileToString(Canonical, *(FPaths::ProjectDir() / TEXT("../../content/councils/chen-council.v1.json")))) return false;
    if (!TestEqual(TEXT("Unreal uses the exact canonical narrative"), Definition, Canonical)) return false;
    TSharedPtr<FJsonObject> Root;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Fixture), Root) || !Root.IsValid()) return false;
    const auto& Routes = Root->GetArrayField(TEXT("routes"));
    TestEqual(TEXT("All shared routes"), Routes.Num(), 77);
    int32 Turns = 0;
    for (const auto& Raw : Routes)
    {
        const auto Route = Raw->AsObject();
        FShiChenCouncilModel Model;
        FString Error;
        if (!TestTrue(TEXT("Initialize"), Model.Initialize(Definition, Route->GetStringField(TEXT("arrival")), Error))) return false;
        TestFalse(TEXT("Reject wrong round"), Model.Commit(TEXT("one-command")));
        for (const auto& RawTurn : Route->GetArrayField(TEXT("turns")))
        {
            const auto Expected = RawTurn->AsObject();
            const FString Id = Expected->GetStringField(TEXT("choiceId"));
            const int32 BeforeCount = Model.GetHistory().Num();
            FShiChenTurn Preview;
            TestTrue(TEXT("Preview"), Model.Preview(Id, Preview));
            TestEqual(TEXT("Preview does not commit"), Model.GetHistory().Num(), BeforeCount);
            for (const TCHAR* Key : { TEXT("grain"), TEXT("tempo"), TEXT("city"), TEXT("allies"), TEXT("veterans") })
            {
                TestEqual(TEXT("Before parity"), Preview.Before.FindRef(Key), static_cast<int32>(Expected->GetObjectField(TEXT("before"))->GetNumberField(Key)));
                TestEqual(TEXT("After parity"), Preview.After.FindRef(Key), static_cast<int32>(Expected->GetObjectField(TEXT("after"))->GetNumberField(Key)));
            }
            TestTrue(TEXT("Commit"), Model.Commit(Id));
            TestTrue(TEXT("Preview equals committed totals"), Model.GetMetrics().OrderIndependentCompareEqual(Preview.After));
            TestFalse(TEXT("Duplicate commitment rejected"), Model.Commit(Id));
            ++Turns;
        }
        TestTrue(TEXT("Completed"), Model.IsCompleted());
        TestEqual(TEXT("Ending parity"), Model.GetOutcome(), Route->GetStringField(TEXT("outcome")));
        TestTrue(TEXT("No offers after ending"), Model.GetChoices().IsEmpty());
        TestFalse(TEXT("Reject invalid reinitialization"), Model.Initialize(TEXT("{}"), TEXT("divided"), Error));
        TestEqual(TEXT("Invalid definition preserves history"), Model.GetHistory().Num(), 3);
    }
    TestEqual(TEXT("All intermediate turns"), Turns, 231);
    FShiChenCouncilModel Pressed;
    FString Error;
    TestTrue(TEXT("Pressed arrival"), Pressed.Initialize(Definition, TEXT("pressed"), Error));
    TestTrue(TEXT("League"), Pressed.Commit(TEXT("recognize-allies")));
    TestTrue(TEXT("Rations"), Pressed.Commit(TEXT("army-rations")));
    TestFalse(TEXT("Unaffordable command"), Pressed.Commit(TEXT("one-command")));
    TestEqual(TEXT("Rejection preserves history"), Pressed.GetHistory().Num(), 2);
    const auto RetainedMetrics = Pressed.GetMetrics();
    TestFalse(TEXT("Unknown arrival rejected"), Pressed.Initialize(Definition, TEXT("unknown"), Error));
    TSharedPtr<FJsonObject> Mutated;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Definition), Mutated)) return false;
    Mutated->GetArrayField(TEXT("rounds"))[0]->AsObject()->GetArrayField(TEXT("choices"))[0]->AsObject()
        ->GetObjectField(TEXT("effects"))->SetNumberField(TEXT("grain"), 1.5);
    FString Invalid;
    FJsonSerializer::Serialize(Mutated.ToSharedRef(), TJsonWriterFactory<>::Create(&Invalid));
    TestFalse(TEXT("Fractional effect rejected"), Pressed.Initialize(Invalid, TEXT("pressed"), Error));
    TestTrue(TEXT("Rejected definition preserves totals"), Pressed.GetMetrics().OrderIndependentCompareEqual(RetainedMetrics));
    FShiChenTurn Untouched;
    Untouched.ChoiceId = TEXT("sentinel");
    TestFalse(TEXT("Invalid preview rejected"), Pressed.Preview(TEXT("missing"), Untouched));
    TestEqual(TEXT("Failed preview preserves output"), Untouched.ChoiceId, FString(TEXT("sentinel")));
    return !HasAnyErrors();
}
#endif
