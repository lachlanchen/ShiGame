#include "ShiChenCouncilSession.h"
#include "ShiAtomicSaveFile.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

bool FShiChenCouncilSession::Open(const FString& Definition, const FShiCampaignSession& Chapter,
    const FString& Path, FString& Error)
{
    if (Path.IsEmpty()) { Error = TEXT("Council save path is empty"); return false; }
    const FString Absolute = FPaths::ConvertRelativePathToFull(Path);
    auto& Files = FPlatformFileManager::Get().GetPlatformFile();
    FShiChenCouncilModel Candidate;
    FShiChenCouncilModel Initial;
    if (!Initial.InitializeFromChapter(Definition, Chapter, Error)) return false;
    FString Saved;
    if (Files.FileExists(*Absolute))
    {
        if (Files.FileSize(*Absolute) > 1024 * 1024 || !FFileHelper::LoadFileToString(Saved, *Absolute))
        { Error = TEXT("Council save cannot be read; existing file preserved"); return false; }
        if (!Candidate.ReplayFromChapter(Definition, Chapter, Saved, Error)) return false;
    }
    else
    {
        if (Files.DirectoryExists(*Absolute)) { Error = TEXT("Council save path is a directory"); return false; }
        if (!Candidate.InitializeFromChapter(Definition, Chapter, Error)
            || !Candidate.ExportSaveJson(Saved, Error) || !FShiAtomicSaveFile::WriteUtf8(Absolute, Saved, Error)) return false;
    }
    Model = MoveTemp(Candidate);
    InitialModel = MoveTemp(Initial);
    bRestartArmed = false;
    SavePath = Absolute;
    LastSavedJson = MoveTemp(Saved);
    Error.Reset();
    return true;
}

bool FShiChenCouncilSession::Commit(const FString& ChoiceId, FString& Error)
{
    if (!IsOpen()) { Error = TEXT("Council save is not open"); return false; }
    if (bRestartArmed) { Error = TEXT("Confirm or cancel the council restart first"); return false; }
    FShiChenCouncilModel Candidate = Model;
    if (!Candidate.Commit(ChoiceId)) { Error = TEXT("Council choice is unavailable"); return false; }
    return Publish(MoveTemp(Candidate), Error);
}

bool FShiChenCouncilSession::ArmRestart()
{
    bRestartArmed = IsOpen() && !Model.GetHistory().IsEmpty();
    return bRestartArmed;
}

bool FShiChenCouncilSession::ConfirmRestart(FString& Error)
{
    if (!IsOpen() || !bRestartArmed) { Error = TEXT("Council restart needs confirmation"); return false; }
    if (!Publish(InitialModel, Error)) return false;
    bRestartArmed = false;
    return true;
}

bool FShiChenCouncilSession::Publish(FShiChenCouncilModel Candidate, FString& Error)
{
    // Detect another session's completed write. This is not a multi-process lock.
    FString Current;
    if (FPlatformFileManager::Get().GetPlatformFile().FileSize(*SavePath) > 1024 * 1024
        || !FFileHelper::LoadFileToString(Current, *SavePath) || Current != LastSavedJson)
    { Error = TEXT("Council save changed or became unavailable; reopen before deciding"); return false; }
    FString Saved;
    if (!Candidate.ExportSaveJson(Saved, Error) || !FShiAtomicSaveFile::WriteUtf8(SavePath, Saved, Error)) return false;
    Model = MoveTemp(Candidate);
    LastSavedJson = MoveTemp(Saved);
    Error.Reset();
    return true;
}
