#include "ShiAtomicSaveFile.h"
#include "HAL/PlatformFileManager.h"
#include "Misc/Guid.h"
#include "Misc/Paths.h"
#if PLATFORM_WINDOWS
#include "Windows/WindowsHWrapper.h"
#elif PLATFORM_UNIX || PLATFORM_MAC || PLATFORM_IOS || PLATFORM_ANDROID
#include <stdio.h>
#endif

namespace
{
bool WriteSave(const FString& InputPath, const FString& Json, FString& Error,
    TFunctionRef<bool(const FString&, const FString&)> Replace)
{
    if (InputPath.IsEmpty()) { Error = TEXT("Save path is empty"); return false; }
    const FString Path = FPaths::ConvertRelativePathToFull(InputPath);
    auto& Files = FPlatformFileManager::Get().GetPlatformFile();
    const FString Directory = FPaths::GetPath(Path);
    if (!Files.CreateDirectoryTree(*Directory) || !Files.DirectoryExists(*Directory))
    { Error = TEXT("Cannot create save directory"); return false; }
    const FString Temporary = Path + TEXT(".") + FGuid::NewGuid().ToString(EGuidFormats::Digits) + TEXT(".tmp");
    TUniquePtr<IFileHandle> Handle(Files.OpenWrite(*Temporary));
    FTCHARToUTF8 Utf8(*Json);
    const bool Written = Handle && Handle->Write(reinterpret_cast<const uint8*>(Utf8.Get()), Utf8.Length()) && Handle->Flush(true);
    Handle.Reset();
    if (!Written)
    {
        Files.DeleteFile(*Temporary);
        Error = TEXT("Save could not be written; decision not applied");
        return false;
    }
    if (!Replace(Path, Temporary))
    {
        Files.DeleteFile(*Temporary);
        Error = TEXT("Save could not replace the prior file; decision not applied");
        return false;
    }
    Error.Reset();
    return true;
}
}

bool FShiAtomicSaveFile::WriteUtf8(const FString& Path, const FString& Json, FString& Error)
{
    return WriteSave(Path, Json, Error, [](const FString& Destination, const FString& Temporary)
    {
        // Do not use IFileManager::Move: its replacement path deletes the old
        // save before moving the new one. Keep both paths on one filesystem.
        // OpenWrite resolves Unreal paths through the platform's writable
        // container. Native rename must use those SAME physical paths: on iOS
        // ProjectSavedDir is not itself an absolute POSIX Documents path.
        auto& Files = FPlatformFileManager::Get().GetPlatformFile();
        const FString NativeDestination = Files.ConvertToAbsolutePathForExternalAppForWrite(*Destination);
        const FString NativeTemporary = Files.ConvertToAbsolutePathForExternalAppForWrite(*Temporary);
        if (NativeDestination.IsEmpty() || NativeTemporary.IsEmpty()
            || FPaths::GetPath(NativeDestination) != FPaths::GetPath(NativeTemporary)) return false;
#if PLATFORM_WINDOWS
        return !!MoveFileExW(*NativeTemporary, *NativeDestination, MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH);
#elif PLATFORM_UNIX || PLATFORM_MAC || PLATFORM_IOS || PLATFORM_ANDROID
        return rename(TCHAR_TO_UTF8(*NativeTemporary), TCHAR_TO_UTF8(*NativeDestination)) == 0;
#else
        return false;
#endif
    });
}

#if WITH_DEV_AUTOMATION_TESTS
bool FShiAtomicSaveFile::WriteWithReplacementForTest(const FString& Path, const FString& Json, FString& Error,
    TFunctionRef<bool(const FString&, const FString&)> Replace)
{
    return WriteSave(Path, Json, Error, Replace);
}
#endif
