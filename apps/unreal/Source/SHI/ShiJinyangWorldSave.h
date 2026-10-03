#pragma once
#include "CoreMinimal.h"

/** Cosmetic exploration state, deliberately independent of the performed-order ledger. */
struct SHI_API FShiJinyangWorldSave
{
    FVector Position=FVector(-1840,-550,100);
    FRotator Look=FRotator(-12,0,0);
    bool bEyeLevel=false;
    TSet<FString> Visited;
    static bool Read(const FString& Text,const TSet<FString>& KnownPlaces,FShiJinyangWorldSave& Out);
    FString Write() const;
};
