#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Guid.h"
#include "Misc/Paths.h"
#include "HAL/PlatformFileManager.h"
#include "ShiAtomicSaveFile.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiAtomicSaveTest, "SHI.Persistence.AtomicReplacement",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiAtomicSaveTest::RunTest(const FString& Parameters)
{
    auto& Files = FPlatformFileManager::Get().GetPlatformFile();
    const FString Directory = FPaths::ProjectSavedDir() / TEXT("Automation/AtomicSave") / FGuid::NewGuid().ToString(EGuidFormats::Digits);
    const FString Path = Directory / TEXT("chronicle.json");
    const FString Old = TEXT("{\"chapter\":\"第一章\",\"turn\":1}");
    const FString New = TEXT("{\"chapter\":\"陈地议事\",\"turn\":2}");
    FString Error, Actual, TemporarySeen;
    TestFalse(TEXT("Empty path rejected"), FShiAtomicSaveFile::WriteUtf8(TEXT(""), New, Error));
    if (!TestTrue(TEXT("Create original save"), FShiAtomicSaveFile::WriteUtf8(Path, Old, Error))) return false;
    bool ReplacementReached = false;
    TestFalse(TEXT("Injected replacement failure reported"), FShiAtomicSaveFile::WriteWithReplacementForTest(Path, New, Error,
        [&](const FString& Destination, const FString& Temporary)
        {
            ReplacementReached = true;
            TemporarySeen = Temporary;
            FString Existing, Candidate;
            TestTrue(TEXT("Old save still exists at replacement boundary"), FFileHelper::LoadFileToString(Existing, *Destination));
            TestEqual(TEXT("No delete-first window"), Existing, Old);
            TestTrue(TEXT("Candidate fully written before replacement"), FFileHelper::LoadFileToString(Candidate, *Temporary));
            TestEqual(TEXT("UTF8 candidate roundtrip"), Candidate, New);
            TestEqual(TEXT("Temporary stays on same directory/filesystem"), FPaths::GetPath(Temporary), FPaths::GetPath(Destination));
            return false;
        }));
    TestTrue(TEXT("Replacement boundary exercised"), ReplacementReached);
    TestFalse(TEXT("Failed temporary cleaned"), Files.FileExists(*TemporarySeen));
    FFileHelper::LoadFileToString(Actual, *Path);
    TestEqual(TEXT("Failed replacement retains exact old save"), Actual, Old);
    TestTrue(TEXT("Real replacement succeeds"), FShiAtomicSaveFile::WriteUtf8(Path, New, Error));
    TestTrue(TEXT("Success clears prior error"), Error.IsEmpty());
    FFileHelper::LoadFileToString(Actual, *Path);
    TestEqual(TEXT("New save is readable"), Actual, New);
    const FString FailedNew = Directory / TEXT("new.json");
    TestFalse(TEXT("Failed first save does not publish"), FShiAtomicSaveFile::WriteWithReplacementForTest(FailedNew, Old, Error,
        [](const FString&, const FString&) { return false; }));
    TestFalse(TEXT("Failed first destination absent"), Files.FileExists(*FailedNew));
    const FString Blocked = Directory / TEXT("blocked.json");
    const FString Sentinel = Blocked / TEXT("keep.txt");
    Files.CreateDirectoryTree(*Blocked);
    TestTrue(TEXT("Create directory sentinel"), FFileHelper::SaveStringToFile(Old, *Sentinel));
    TestFalse(TEXT("Real rename failure reported"), FShiAtomicSaveFile::WriteUtf8(Blocked, New, Error));
    TestTrue(TEXT("Destination directory preserved"), Files.DirectoryExists(*Blocked));
    FFileHelper::LoadFileToString(Actual, *Sentinel);
    TestEqual(TEXT("Destination contents preserved"), Actual, Old);
    TestFalse(TEXT("Parent occupied by file rejected"), FShiAtomicSaveFile::WriteUtf8(Path / TEXT("nested.json"), New, Error));
    TestTrue(TEXT("Cleanup test sentinel"), Files.DeleteFile(*Sentinel));
    TestTrue(TEXT("Cleanup test directory"), Files.DeleteDirectory(*Blocked));
    TestTrue(TEXT("Cleanup test save"), Files.DeleteFile(*Path));
    TestTrue(TEXT("No temporary files leaked"), Files.DeleteDirectory(*Directory));
    return !HasAnyErrors();
}
#endif
