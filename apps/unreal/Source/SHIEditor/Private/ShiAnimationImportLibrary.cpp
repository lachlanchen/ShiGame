#include "ShiAnimationImportLibrary.h"

#include "Animation/AnimData/IAnimationDataController.h"
#include "Animation/AnimData/IAnimationDataModel.h"
#include "Animation/AnimSequence.h"
#include "Animation/Skeleton.h"

namespace
{
    struct FShiRotationTrack
    {
        FName Name;
        FVector ReferenceTranslation = FVector::ZeroVector;
        FVector ReferenceScale = FVector::OneVector;
        TArray<FQuat> Rotations;
    };
}

FString UShiAnimationImportLibrary::NormalizeRotationOnlySequence(
    UAnimSequence* Sequence, int32 ExpectedSampleCount)
{
    if (!Sequence || ExpectedSampleCount <= 1)
    {
        return TEXT("Rotation-only normalization requires a sequence and at least two samples.");
    }
    USkeleton* Skeleton = Sequence->GetSkeleton();
    IAnimationDataModel* Model = Sequence->GetDataModel();
    if (!Skeleton || !Model || Model->GetNumberOfKeys() != ExpectedSampleCount)
    {
        return TEXT("Rotation-only normalization requires the admitted Skeleton and exact sample count.");
    }

    TArray<FName> TrackNames;
    Model->GetBoneTrackNames(TrackNames);
    if (TrackNames.Num() != 53 || !TrackNames.Contains(FName(TEXT("Root"))))
    {
        return TEXT("Rotation-only normalization requires the exact imported 53-track hierarchy.");
    }

    const FReferenceSkeleton& ReferenceSkeleton = Skeleton->GetReferenceSkeleton();
    const TArray<FTransform>& ReferencePose = ReferenceSkeleton.GetRefBonePose();
    TArray<FShiRotationTrack> Tracks;
    Tracks.Reserve(52);
    for (const FName TrackName : TrackNames)
    {
        if (TrackName.IsEqual(FName(TEXT("Root")), ENameCase::IgnoreCase)) continue;
        const int32 BoneIndex = ReferenceSkeleton.FindBoneIndex(TrackName);
        if (!ReferencePose.IsValidIndex(BoneIndex))
        {
            return FString::Printf(TEXT("Imported animation track %s is not in the admitted Skeleton."), *TrackName.ToString());
        }
        TArray<FTransform> ImportedTransforms;
        Model->GetBoneTrackTransforms(TrackName, ImportedTransforms);
        if (ImportedTransforms.Num() != ExpectedSampleCount)
        {
            return FString::Printf(TEXT("Imported animation track %s does not contain %d samples."),
                *TrackName.ToString(), ExpectedSampleCount);
        }
        FShiRotationTrack& Track = Tracks.AddDefaulted_GetRef();
        Track.Name = TrackName;
        Track.ReferenceTranslation = ReferencePose[BoneIndex].GetTranslation();
        Track.ReferenceScale = ReferencePose[BoneIndex].GetScale3D();
        Track.Rotations.Reserve(ExpectedSampleCount);
        for (const FTransform& Imported : ImportedTransforms)
        {
            const FQuat Rotation = Imported.GetRotation().GetNormalized();
            if (Rotation.ContainsNaN())
            {
                return FString::Printf(TEXT("Imported animation track %s contains a non-finite rotation."),
                    *TrackName.ToString());
            }
            Track.Rotations.Add(Rotation);
        }
    }
    if (Tracks.Num() != 52)
    {
        return TEXT("Rotation-only normalization did not isolate exactly 52 child-body tracks.");
    }

    IAnimationDataController& Controller = Sequence->GetController();
    IAnimationDataController::FScopedBracket Bracket(
        Controller, NSLOCTEXT("SHI", "NormalizeRotationOnlySequence", "Normalize SHI rotation-only animation"), false);
    if (!Controller.RemoveBoneTrack(FName(TEXT("Root")), false))
    {
        return TEXT("Rotation-only normalization could not remove the imported Root track.");
    }
    for (const FShiRotationTrack& Track : Tracks)
    {
        TArray<FVector> Positions;
        TArray<FVector> Scales;
        Positions.Init(Track.ReferenceTranslation, ExpectedSampleCount);
        Scales.Init(Track.ReferenceScale, ExpectedSampleCount);
        if (!Controller.SetBoneTrackKeys(Track.Name, Positions, Track.Rotations, Scales, false))
        {
            return FString::Printf(TEXT("Rotation-only normalization could not rewrite %s."),
                *Track.Name.ToString());
        }
    }

    Sequence->MarkPackageDirty();
    return FString();
}
