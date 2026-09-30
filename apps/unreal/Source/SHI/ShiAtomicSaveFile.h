#pragma once
#include "CoreMinimal.h"

/** Single-writer, same-directory atomic replacement. No power-loss guarantee. */
class FShiAtomicSaveFile
{
public:
    static bool WriteUtf8(const FString& Path, const FString& Json, FString& Error);
#if WITH_DEV_AUTOMATION_TESTS
    static bool WriteWithReplacementForTest(const FString& Path, const FString& Json, FString& Error,
        TFunctionRef<bool(const FString& Destination, const FString& Temporary)> Replace);
#endif
};
