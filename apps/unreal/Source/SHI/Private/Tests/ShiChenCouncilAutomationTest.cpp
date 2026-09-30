#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "ShiChenCouncilModel.h"
#include "ShiCampaignSession.h"
#include "ShiChenCouncilSession.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/Guid.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiChenChapterEntryTest, "SHI.ChenCouncil.ChapterEntry",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiChenChapterEntryTest::RunTest(const FString& Parameters)
{
    FString Definition, Fixture, Error;
    FShiCampaignModel Campaign;
    if (!Campaign.LoadCanonical(Error)
        || !FFileHelper::LoadFileToString(Definition, *(FPaths::ProjectContentDir() / TEXT("StreamingAssets/chen-council.v1.json")))
        || !FFileHelper::LoadFileToString(Fixture, *(FPaths::ProjectDir() / TEXT("../../content/conformance/chapter-01-replays.v1.json"))))
    { AddError(TEXT("Missing chapter/council fixtures: ") + Error); return false; }
    TSharedPtr<FJsonObject> Root;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Fixture), Root)) return false;
    FShiChenCouncilModel Council;
    TestTrue(TEXT("Retained council"), Council.Initialize(Definition, TEXT("divided"), Error, TEXT("retained")));
    TestTrue(TEXT("Retained decision"), Council.Commit(TEXT("defer-title")));
    FString Retained;
    Council.ExportSaveJson(Retained, Error);
    FShiCampaignSession Uninitialized;
    TestFalse(TEXT("Uninitialized chapter rejected"), Council.InitializeFromChapter(Definition, Uninitialized, Error));
    TSet<FString> Entries;
    int32 Survivors = 0, Failures = 0;
    for (const auto& Raw : Root->GetArrayField(TEXT("routes")))
    {
        FShiCampaignSession Chapter;
        Chapter.Initialize(Campaign, static_cast<uint32>(Root->GetNumberField(TEXT("seed"))));
        TestFalse(TEXT("Unfinished chapter rejected"), Council.InitializeFromChapter(Definition, Chapter, Error));
        for (const auto& RawTurn : Raw->AsObject()->GetArrayField(TEXT("turns")))
        {
            FShiResolutionResult Resolution;
            if (!TestTrue(TEXT("Chapter choice resolves"), Chapter.ResolveChoice(RawTurn->AsObject()->GetStringField(TEXT("choiceId")), Resolution, Error))) return false;
        }
        FString Before, After;
        TestTrue(TEXT("Chapter export"), Chapter.ExportSaveJson(Before, Error));
        const bool Eligible = Chapter.IsCompleted() && Chapter.GetFailureReason().IsEmpty();
        FShiChenCouncilModel Next;
        TestEqual(TEXT("Entry follows chapter survival"), Next.InitializeFromChapter(Definition, Chapter, Error), Eligible);
        if (!Eligible)
        {
            ++Failures;
            TestFalse(TEXT("Failed chapter preserves existing council"), Council.InitializeFromChapter(Definition, Chapter, Error));
            TestFalse(TEXT("Failed chapter cannot restore council"), Council.ReplayFromChapter(Definition, Chapter, Retained, Error));
        }
        else
        {
            ++Survivors;
            if (Survivors == 1)
            {
                auto& Files = FPlatformFileManager::Get().GetPlatformFile();
                const FString Directory = FPaths::ProjectSavedDir() / TEXT("Automation/Council") / FGuid::NewGuid().ToString(EGuidFormats::Digits);
                const FString Path = Directory / TEXT("council.json");
                FShiChenCouncilSession Disk, Stale;
                TestFalse(TEXT("Unopened disk session rejects choice"), Disk.Commit(TEXT("defer-title"), Error));
                TestTrue(TEXT("Create real disk save"), Disk.Open(Definition, Chapter, Path, Error));
                TestTrue(TEXT("Open second snapshot"), Stale.Open(Definition, Chapter, Path, Error));
                TestTrue(TEXT("Disk-backed decision"), Disk.Commit(TEXT("defer-title"), Error));
                TestFalse(TEXT("Stale session cannot overwrite newer decision"), Stale.Commit(TEXT("defer-title"), Error));
                TestEqual(TEXT("Stale model does not advance"), Stale.GetModel().GetHistory().Num(), 0);
                TestTrue(TEXT("Resume real disk save"), Stale.Open(Definition, Chapter, Path, Error));
                TestEqual(TEXT("Resume retains saved choice"), Stale.GetModel().GetHistory().Num(), 1);
                TestFalse(TEXT("Duplicate disk decision rejected"), Stale.Commit(TEXT("defer-title"), Error));
                while (!Stale.GetModel().IsCompleted())
                {
                    bool Advanced = false;
                    for (const auto& Choice : Stale.GetModel().GetChoices())
                    {
                        FShiChenTurn Preview;
                        if (Stale.GetModel().Preview(Choice, Preview))
                        { Advanced = Stale.Commit(Choice, Error); break; }
                    }
                    if (!TestTrue(TEXT("Save next council round"), Advanced)) break;
                }
                FShiChenCouncilSession Finished;
                TestTrue(TEXT("Reopen completed disk council"), Finished.Open(Definition, Chapter, Path, Error));
                TestTrue(TEXT("Disk completion survives reopen"), Finished.GetModel().IsCompleted());
                TestEqual(TEXT("Disk ending survives reopen"), Finished.GetModel().GetOutcome(), Stale.GetModel().GetOutcome());
                const FString Corrupt = TEXT("{preserve damaged save");
                TestTrue(TEXT("Install corrupt test fixture"), FFileHelper::SaveStringToFile(Corrupt, *Path));
                TestFalse(TEXT("Corruption rejects further decision"), Disk.Commit(TEXT("army-rations"), Error));
                TestEqual(TEXT("Failed disk save does not advance"), Disk.GetModel().GetHistory().Num(), 1);
                TestFalse(TEXT("Corrupt save not replaced on open"), Finished.Open(Definition, Chapter, Path, Error));
                TestTrue(TEXT("Failed open retains prior live model"), Finished.GetModel().IsCompleted());
                FString PreservedFile;
                FFileHelper::LoadFileToString(PreservedFile, *Path);
                TestEqual(TEXT("Corrupt bytes preserved"), PreservedFile, Corrupt);
                TestFalse(TEXT("Unwritable destination rejects fresh session"), Finished.Open(Definition, Chapter, Path / TEXT("child.json"), Error));
                TestTrue(TEXT("Failed create preserves live ending"), Finished.GetModel().IsCompleted());
                TestTrue(TEXT("Remove exact generated fixture"), Files.DeleteFile(*Path));
                TestTrue(TEXT("No temporary council file remains"), Files.DeleteDirectory(*Directory));
            }
            FString Save;
            TestTrue(TEXT("Chapter-bound export"), Next.ExportSaveJson(Save, Error));
            TSharedPtr<FJsonObject> Saved;
            if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Save), Saved)) return false;
            const FString Entry = Saved->GetStringField(TEXT("entryId"));
            TestFalse(TEXT("Distinct route identity"), Entries.Contains(Entry));
            Entries.Add(Entry);
            const FString Arrival = Chapter.GetResources().FindRef(TEXT("grain")) >= 45 ? TEXT("supplied")
                : Chapter.GetResources().FindRef(TEXT("danger")) >= 65 ? TEXT("pressed") : TEXT("divided");
            TestEqual(TEXT("Shared arrival thresholds"), Saved->GetStringField(TEXT("arrival")), Arrival);
            TestTrue(TEXT("Council decision"), Next.Commit(TEXT("defer-title")));
            Next.ExportSaveJson(Save, Error);
            FShiCampaignSession Replayed;
            TestTrue(TEXT("Restore actual chapter"), Replayed.ReplaySaveJson(Campaign, Before, Error));
            FShiChenCouncilModel Restored;
            TestTrue(TEXT("Chapter replay preserves council identity"), Restored.ReplayFromChapter(Definition, Replayed, Save, Error));
            TestEqual(TEXT("Council decision restored"), Restored.GetHistory().Num(), 1);
            TestFalse(TEXT("Foreign entry rejected"), Restored.ReplayFromChapter(Definition, Replayed, Retained, Error));
            TestEqual(TEXT("Bad replay retains decision"), Restored.GetHistory().Num(), 1);
        }
        TestTrue(TEXT("Chapter still exportable"), Chapter.ExportSaveJson(After, Error));
        TestEqual(TEXT("Council never mutates chapter"), After, Before);
        FString Preserved;
        Council.ExportSaveJson(Preserved, Error);
        TestEqual(TEXT("Rejected entry preserves council"), Preserved, Retained);
    }
    TestTrue(TEXT("Survivor coverage"), Survivors > 0);
    TestTrue(TEXT("Failure coverage"), Failures > 0);
    return !HasAnyErrors();
}

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
        const FString Arrival = Route->GetStringField(TEXT("arrival"));
        const FString EntryId = FString::Printf(TEXT("chronicle-%d"), Turns);
        if (!TestTrue(TEXT("Initialize"), Model.Initialize(Definition, Arrival, Error, EntryId))) return false;
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
            FString Saved;
            TestTrue(TEXT("Export bound save"), Model.ExportSaveJson(Saved, Error));
            FShiChenCouncilModel Restored;
            TestTrue(TEXT("Replay every partial/full save"), Restored.ReplaySaveJson(Definition, Arrival, EntryId, Saved, Error));
            TestTrue(TEXT("Replay totals"), Restored.GetMetrics().OrderIndependentCompareEqual(Model.GetMetrics()));
            TestEqual(TEXT("Replay history length"), Restored.GetHistory().Num(), Model.GetHistory().Num());
            TestEqual(TEXT("Replay outcome"), Restored.GetOutcome(), Model.GetOutcome());
            for (int32 Index = 0; Index < Model.GetHistory().Num(); ++Index)
            {
                TestTrue(TEXT("Replay before"), Restored.GetHistory()[Index].Before.OrderIndependentCompareEqual(Model.GetHistory()[Index].Before));
                TestTrue(TEXT("Replay after"), Restored.GetHistory()[Index].After.OrderIndependentCompareEqual(Model.GetHistory()[Index].After));
            }
            TestFalse(TEXT("Other chronicle rejected"), Restored.ReplaySaveJson(Definition, Arrival, EntryId + TEXT("-other"), Saved, Error));
            TestFalse(TEXT("Changed revision rejected"), Restored.ReplaySaveJson(Definition + TEXT("\n"), Arrival, EntryId, Saved, Error));
            FString Preserved;
            TestTrue(TEXT("Export retained state"), Restored.ExportSaveJson(Preserved, Error));
            TestEqual(TEXT("Failed replay leaves state unchanged"), Preserved, Saved);
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
    FString Unbound = TEXT("sentinel");
    TestFalse(TEXT("Cannot save an unbound model"), Pressed.ExportSaveJson(Unbound, Error));
    TestEqual(TEXT("Failed export preserves output"), Unbound, FString(TEXT("sentinel")));
    FShiChenCouncilModel Bound;
    TestTrue(TEXT("Initialize save negatives"), Bound.Initialize(Definition, TEXT("divided"), Error, TEXT("negative-save")));
    TestTrue(TEXT("Commit first choice"), Bound.Commit(TEXT("defer-title")));
    FString ValidSave;
    TestTrue(TEXT("Encode first choice"), Bound.ExportSaveJson(ValidSave, Error));
    TSharedPtr<FJsonObject> SavedRoot;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(ValidSave), SavedRoot)) return false;
    SavedRoot->SetBoolField(TEXT("completed"), true);
    SavedRoot->SetStringField(TEXT("outcome"), TEXT("common-front"));
    FString Tampered;
    FJsonSerializer::Serialize(SavedRoot.ToSharedRef(), TJsonWriterFactory<>::Create(&Tampered));
    TestTrue(TEXT("Ignore cached outcome claims"), Bound.ReplaySaveJson(Definition, TEXT("divided"), TEXT("negative-save"), Tampered, Error));
    TestFalse(TEXT("Replay computes actual completion"), Bound.IsCompleted());
    SavedRoot->SetArrayField(TEXT("choices"), { MakeShared<FJsonValueString>(TEXT("defer-title")), MakeShared<FJsonValueString>(TEXT("defer-title")) });
    FJsonSerializer::Serialize(SavedRoot.ToSharedRef(), TJsonWriterFactory<>::Create(&Tampered));
    TestFalse(TEXT("Duplicate save choices rejected"), Bound.ReplaySaveJson(Definition, TEXT("divided"), TEXT("negative-save"), Tampered, Error));
    TestFalse(TEXT("Other arrival rejected"), Bound.ReplaySaveJson(Definition, TEXT("pressed"), TEXT("negative-save"), ValidSave, Error));
    TestFalse(TEXT("Corrupt JSON rejected"), Bound.ReplaySaveJson(Definition, TEXT("divided"), TEXT("negative-save"), TEXT("{"), Error));
    TestEqual(TEXT("Failed imports keep original turn"), Bound.GetHistory().Num(), 1);
    return !HasAnyErrors();
}
#endif
