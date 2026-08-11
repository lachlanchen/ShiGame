#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "ShiAnimationImportLibrary.generated.h"

class UAnimSequence;
class UMaterialInterface;
class UStaticMesh;

/** Editor-only normalization for reviewed rotation-only SHI animation imports. */
UCLASS()
class SHIEDITOR_API UShiAnimationImportLibrary : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString NormalizeRotationOnlySequence(
        UAnimSequence* Sequence, int32 ExpectedSampleCount);

    /** Synchronously prepares current-platform bone compression for runtime-pose inspection. */
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString PrepareCompressedSequence(UAnimSequence* Sequence);

    /** Removes collision and navigation authority from a review-only static mesh. */
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString PrepareCollisionlessReviewStaticMesh(UStaticMesh* StaticMesh);

    /** Configures one exact native material binding for an engineering-review mesh. */
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString ConfigureExactSingleMaterialBinding(
        UStaticMesh* StaticMesh, UMaterialInterface* Material, FName ExpectedSlot);

    /** Validates one exact native material binding without mutation. */
    UFUNCTION(BlueprintPure, Category = "SHI|Animation Import")
    static FString ValidateExactSingleMaterialBinding(
        const UStaticMesh* StaticMesh,
        const UMaterialInterface* Material,
        FName ExpectedSlot);

    /** Replaces every socket with an exact ordered review-only socket contract. */
    UFUNCTION(BlueprintCallable, Category = "SHI|Animation Import")
    static FString ConfigureExactReviewSockets(
        UStaticMesh* StaticMesh,
        const TArray<FName>& Names,
        const TArray<FVector>& Locations,
        const TArray<FRotator>& Rotations,
        const TArray<FString>& Tags);

    /** Validates the exact ordered review-only socket contract without mutation. */
    UFUNCTION(BlueprintPure, Category = "SHI|Animation Import")
    static FString ValidateExactReviewSockets(
        const UStaticMesh* StaticMesh,
        const TArray<FName>& Names,
        const TArray<FVector>& Locations,
        const TArray<FRotator>& Rotations,
        const TArray<FString>& Tags);
};
