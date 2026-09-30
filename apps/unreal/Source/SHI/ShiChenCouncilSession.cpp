#include "ShiChenCouncilSession.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/FileHelper.h"
#include "Misc/Guid.h"
#include "Misc/Paths.h"
#if PLATFORM_WINDOWS
#include "Windows/WindowsHWrapper.h"
#elif PLATFORM_UNIX || PLATFORM_MAC
#include <stdio.h>
#endif

bool FShiChenCouncilSession::WriteReplacement(const FString& Path, const FString& Json, FString& Error)
{
    auto& Files = FPlatformFileManager::Get().GetPlatformFile();
    const FString Directory = FPaths::GetPath(Path);
    if (!Files.CreateDirectoryTree(*Directory) || !Files.DirectoryExists(*Directory))
    { Error = TEXT("Cannot create council save directory"); return false; }
    const FString Temporary = Path + TEXT(".") + FGuid::NewGuid().ToString(EGuidFormats::Digits) + TEXT(".tmp");
    TUniquePtr<IFileHandle> Handle(Files.OpenWrite(*Temporary));
    FTCHARToUTF8 Utf8(*Json);
    const bool Written = Handle && Handle->Write(reinterpret_cast<const uint8*>(Utf8.Get()), Utf8.Length()) && Handle->Flush(true);
    Handle.Reset();
    if (!Written)
    {
        Files.DeleteFile(*Temporary);
        Error = TEXT("Council save could not be written; decision not applied");
        return false;
    }
    // Same-directory replacement, without IFileManager::Move's delete-first
    // behavior. File data is flushed; this is not a power-loss durability claim.
    bool Replaced = false;
#if PLATFORM_WINDOWS
    Replaced = !!MoveFileExW(*Temporary, *Path, MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH);
#elif PLATFORM_UNIX || PLATFORM_MAC
    Replaced = rename(TCHAR_TO_UTF8(*Temporary), TCHAR_TO_UTF8(*Path)) == 0;
#endif
    if (!Replaced)
    {
        Files.DeleteFile(*Temporary);
        Error = TEXT("Council save could not replace the prior file; decision not applied");
        return false;
    }
    Error.Reset();
    return true;
}

bool FShiChenCouncilSession::Open(const FString& Definition, const FShiCampaignSession& Chapter,
    const FString& Path, FString& Error)
{
    if (Path.IsEmpty()) { Error = TEXT("Council save path is empty"); return false; }
    const FString Absolute = FPaths::ConvertRelativePathToFull(Path);
    auto& Files = FPlatformFileManager::Get().GetPlatformFile();
    FShiChenCouncilModel Candidate;
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
            || !Candidate.ExportSaveJson(Saved, Error) || !WriteReplacement(Absolute, Saved, Error)) return false;
    }
    Model = MoveTemp(Candidate);
    SavePath = Absolute;
    LastSavedJson = MoveTemp(Saved);
    Error.Reset();
    return true;
}

bool FShiChenCouncilSession::Commit(const FString& ChoiceId, FString& Error)
{
    if (!IsOpen()) { Error = TEXT("Council save is not open"); return false; }
    // Detect another session's completed write. This is not a multi-process lock.
    FString Current;
    if (!FFileHelper::LoadFileToString(Current, *SavePath) || Current != LastSavedJson)
    { Error = TEXT("Council save changed or became unavailable; reopen before deciding"); return false; }
    FShiChenCouncilModel Candidate = Model;
    if (!Candidate.Commit(ChoiceId)) { Error = TEXT("Council choice is unavailable"); return false; }
    FString Saved;
    if (!Candidate.ExportSaveJson(Saved, Error) || !WriteReplacement(SavePath, Saved, Error)) return false;
    Model = MoveTemp(Candidate);
    LastSavedJson = MoveTemp(Saved);
    Error.Reset();
    return true;
}
