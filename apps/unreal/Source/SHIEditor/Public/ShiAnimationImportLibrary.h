#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "ShiAnimationImportLibrary.generated.h"

class UAnimSequence;

/** Editor-only normalization for reviewed rotation-only SHI animation imports. */
UCLASS()
class SHIEDITOR_API UShiAnimationImportLibrary : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString NormalizeRotationOnlySequence(
        UAnimSequence* Sequence, int32 ExpectedSampleCount);
};
