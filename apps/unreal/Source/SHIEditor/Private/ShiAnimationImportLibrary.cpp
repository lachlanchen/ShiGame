#include "ShiAnimationImportLibrary.h"

#include "Animation/AnimData/IAnimationDataController.h"
#include "Animation/AnimData/IAnimationDataModel.h"
#include "Animation/AnimSequence.h"
#include "Animation/Skeleton.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshSocket.h"
#include "Materials/Material.h"
#include "PhysicsEngine/BodySetup.h"
#include "UObject/UnrealType.h"
#include "UObject/UObjectGlobals.h"

namespace
{
    struct FShiRotationTrack
    {
        FName Name;
        FVector ReferenceTranslation = FVector::ZeroVector;
        FVector ReferenceScale = FVector::OneVector;
        TArray<FQuat> Rotations;
    };

    FString ValidateReviewSocketInputs(
        const TArray<FName>& Names,
        const TArray<FVector>& Locations,
        const TArray<FRotator>& Rotations,
        const TArray<FString>& Tags)
    {
        const int32 Count = Names.Num();
        if (Count != 3 || Locations.Num() != Count || Rotations.Num() != Count ||
            Tags.Num() != Count)
        {
            return TEXT("Exact review sockets require equal name, location, rotation and tag arrays with exactly three entries.");
        }

        TSet<FName> UniqueNames;
        TSet<FString> UniqueTags;
        UniqueNames.Reserve(Count);
        UniqueTags.Reserve(Count);
        for (int32 Index = 0; Index < Count; ++Index)
        {
            if (Names[Index].IsNone())
            {
                return FString::Printf(
                    TEXT("Exact review socket %d has an empty name."), Index);
            }
            if (UniqueNames.Contains(Names[Index]))
            {
                return FString::Printf(
                    TEXT("Exact review socket %d duplicates name %s."),
                    Index,
                    *Names[Index].ToString());
            }
            if (Tags[Index].IsEmpty())
            {
                return FString::Printf(
                    TEXT("Exact review socket %d has an empty tag."), Index);
            }
            if (UniqueTags.Contains(Tags[Index]))
            {
                return FString::Printf(
                    TEXT("Exact review socket %d duplicates tag %s."),
                    Index,
                    *Tags[Index]);
            }
            if (Locations[Index].ContainsNaN() || Rotations[Index].ContainsNaN())
            {
                return FString::Printf(
                    TEXT("Exact review socket %d contains a non-finite transform."),
                    Index);
            }
            UniqueNames.Add(Names[Index]);
            UniqueTags.Add(Tags[Index]);
        }

        return FString();
    }
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

FString UShiAnimationImportLibrary::PrepareCompressedSequence(UAnimSequence* Sequence)
{
    if (!Sequence)
    {
        return TEXT("Compressed animation preparation requires a sequence.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Compressed animation preparation must run on the game thread.");
    }
    if (!Sequence->GetSkeleton())
    {
        return TEXT("Compressed animation preparation requires an admitted Skeleton.");
    }
    if (!Sequence->CanBeCompressed())
    {
        return TEXT("The animation sequence cannot be compressed in its current package state.");
    }

    Sequence->CacheDerivedDataForCurrentPlatform();
    Sequence->WaitOnExistingCompression(true);
    if (!Sequence->IsBoneCompressedDataValid())
    {
        return FString::Printf(
            TEXT("Current-platform bone compression did not produce valid runtime data for %s."),
            *Sequence->GetPathName());
    }

    return FString();
}

FString UShiAnimationImportLibrary::PrepareCollisionlessReviewStaticMesh(UStaticMesh* StaticMesh)
{
    if (!StaticMesh)
    {
        return TEXT("Collisionless review preparation requires a static mesh.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Collisionless review preparation must run on the game thread.");
    }

    StaticMesh->Modify();
    StaticMesh->CreateBodySetup();
    UBodySetup* BodySetup = StaticMesh->GetBodySetup();
    if (!BodySetup)
    {
        return TEXT("Collisionless review preparation could not create a BodySetup.");
    }

    BodySetup->Modify();
    BodySetup->RemoveSimpleCollision();
    BodySetup->CollisionTraceFlag = CTF_UseSimpleAsComplex;
    StaticMesh->MarkAsNotHavingNavigationData();
    StaticMesh->MarkPackageDirty();
    StaticMesh->PostEditChange();

    BodySetup = StaticMesh->GetBodySetup();
    if (!BodySetup || BodySetup->AggGeom.GetElementCount() != 0)
    {
        return TEXT("Collisionless review preparation left simple collision geometry on the mesh.");
    }
    if (BodySetup->CollisionTraceFlag != CTF_UseSimpleAsComplex)
    {
        return TEXT("Collisionless review preparation did not disable per-poly collision.");
    }
    if (StaticMesh->bHasNavigationData || StaticMesh->GetNavCollision() != nullptr)
    {
        return TEXT("Collisionless review preparation left navigation collision data on the mesh.");
    }

    return FString();
}

FString UShiAnimationImportLibrary::ConfigureExactSingleMaterialBinding(
    UStaticMesh* StaticMesh, UMaterialInterface* Material, FName ExpectedSlot)
{
    if (!StaticMesh || !Material)
    {
        return TEXT("Exact material binding requires a static mesh and material.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Exact material binding must run on the game thread.");
    }
    if (ExpectedSlot.IsNone())
    {
        return TEXT("Exact material binding requires a non-empty expected slot name.");
    }
    if (StaticMesh->GetClass() != UStaticMesh::StaticClass() ||
        Material->GetClass() != UMaterial::StaticClass())
    {
        return TEXT("Exact material binding requires exact UStaticMesh and UMaterial classes.");
    }

    FProperty* StaticMaterialsProperty = FindFProperty<FProperty>(
        UStaticMesh::StaticClass(), UStaticMesh::GetStaticMaterialsName());
    if (!StaticMaterialsProperty)
    {
        return TEXT("Exact material binding could not resolve the StaticMaterials property.");
    }

    StaticMesh->Modify();
    StaticMesh->PreEditChange(StaticMaterialsProperty);
    TArray<FStaticMaterial> Materials;
    Materials.Emplace(Material, ExpectedSlot, ExpectedSlot);
    StaticMesh->SetStaticMaterials(Materials);
    StaticMesh->MarkPackageDirty();
    FPropertyChangedEvent MaterialChangeEvent(
        StaticMaterialsProperty, EPropertyChangeType::ValueSet);
    StaticMesh->PostEditChangeProperty(MaterialChangeEvent);

    return ValidateExactSingleMaterialBinding(StaticMesh, Material, ExpectedSlot);
}

FString UShiAnimationImportLibrary::ValidateExactSingleMaterialBinding(
    const UStaticMesh* StaticMesh,
    const UMaterialInterface* Material,
    FName ExpectedSlot)
{
    if (!StaticMesh || !Material)
    {
        return TEXT("Exact material binding validation requires a static mesh and material.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Exact material binding validation must run on the game thread.");
    }
    if (ExpectedSlot.IsNone())
    {
        return TEXT("Exact material binding validation requires a non-empty expected slot name.");
    }
    if (StaticMesh->GetClass() != UStaticMesh::StaticClass() ||
        Material->GetClass() != UMaterial::StaticClass())
    {
        return TEXT("Exact material binding validation requires exact UStaticMesh and UMaterial classes.");
    }

    const TArray<FStaticMaterial>& BoundMaterials = StaticMesh->GetStaticMaterials();
    if (BoundMaterials.Num() != 1)
    {
        return TEXT("Exact material binding validation requires exactly one static-material slot.");
    }

    const FStaticMaterial& BoundMaterial = BoundMaterials[0];
    if (BoundMaterial.MaterialInterface.Get() != Material)
    {
        return TEXT("Exact material binding validation found a different material interface.");
    }
    if (BoundMaterial.MaterialSlotName != ExpectedSlot ||
        BoundMaterial.ImportedMaterialSlotName != ExpectedSlot)
    {
        return TEXT("Exact material binding validation found drift in one or both admitted slot names.");
    }

    return FString();
}

FString UShiAnimationImportLibrary::ConfigureExactReviewSockets(
    UStaticMesh* StaticMesh,
    const TArray<FName>& Names,
    const TArray<FVector>& Locations,
    const TArray<FRotator>& Rotations,
    const TArray<FString>& Tags)
{
    if (!StaticMesh)
    {
        return TEXT("Exact review socket configuration requires a static mesh.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Exact review socket configuration must run on the game thread.");
    }
    if (const FString InputError =
            ValidateReviewSocketInputs(Names, Locations, Rotations, Tags);
        !InputError.IsEmpty())
    {
        return InputError;
    }

    FProperty* SocketsProperty = FindFProperty<FProperty>(
        UStaticMesh::StaticClass(), GET_MEMBER_NAME_CHECKED(UStaticMesh, Sockets));
    if (!SocketsProperty)
    {
        return TEXT("Exact review socket configuration could not resolve the Sockets property.");
    }

    StaticMesh->Modify();
    StaticMesh->PreEditChange(SocketsProperty);
    while (!StaticMesh->Sockets.IsEmpty())
    {
        StaticMesh->RemoveSocket(StaticMesh->Sockets.Last());
    }

    for (int32 Index = 0; Index < Names.Num(); ++Index)
    {
        UStaticMeshSocket* Socket = NewObject<UStaticMeshSocket>(
            StaticMesh, NAME_None, RF_Transactional);
        Socket->SocketName = Names[Index];
        Socket->RelativeLocation = Locations[Index];
        Socket->RelativeRotation = Rotations[Index];
        Socket->RelativeScale = FVector::OneVector;
        Socket->Tag = Tags[Index];
        StaticMesh->AddSocket(Socket);
    }

    StaticMesh->MarkPackageDirty();
    FPropertyChangedEvent SocketChangeEvent(
        SocketsProperty, EPropertyChangeType::ValueSet);
    StaticMesh->PostEditChangeProperty(SocketChangeEvent);

    return ValidateExactReviewSockets(
        StaticMesh, Names, Locations, Rotations, Tags);
}

FString UShiAnimationImportLibrary::ValidateExactReviewSockets(
    const UStaticMesh* StaticMesh,
    const TArray<FName>& Names,
    const TArray<FVector>& Locations,
    const TArray<FRotator>& Rotations,
    const TArray<FString>& Tags)
{
    if (!StaticMesh)
    {
        return TEXT("Exact review socket validation requires a static mesh.");
    }
    if (!IsInGameThread())
    {
        return TEXT("Exact review socket validation must run on the game thread.");
    }
    if (const FString InputError =
            ValidateReviewSocketInputs(Names, Locations, Rotations, Tags);
        !InputError.IsEmpty())
    {
        return InputError;
    }
    if (StaticMesh->Sockets.Num() != Names.Num())
    {
        return FString::Printf(
            TEXT("Exact review socket validation found %d sockets; expected %d."),
            StaticMesh->Sockets.Num(),
            Names.Num());
    }

    for (int32 Index = 0; Index < Names.Num(); ++Index)
    {
        const UStaticMeshSocket* Socket = StaticMesh->Sockets[Index];
        if (!Socket)
        {
            return FString::Printf(
                TEXT("Exact review socket %d is null."), Index);
        }
        if (Socket->GetClass() != UStaticMeshSocket::StaticClass() ||
            Socket->GetOuter() != StaticMesh)
        {
            return FString::Printf(
                TEXT("Exact review socket %d is not an exact mesh-owned UStaticMeshSocket."),
                Index);
        }
        if (Socket->SocketName != Names[Index])
        {
            return FString::Printf(
                TEXT("Exact review socket %d has name %s; expected %s."),
                Index,
                *Socket->SocketName.ToString(),
                *Names[Index].ToString());
        }
        if (StaticMesh->FindSocket(Names[Index]) != Socket)
        {
            return FString::Printf(
                TEXT("Exact review socket %d does not retain ordered lookup identity."),
                Index);
        }
        if (Socket->RelativeLocation.ContainsNaN() ||
            Socket->RelativeRotation.ContainsNaN() ||
            Socket->RelativeScale.ContainsNaN())
        {
            return FString::Printf(
                TEXT("Exact review socket %d contains a non-finite stored transform."),
                Index);
        }
        if (Socket->RelativeLocation != Locations[Index] ||
            Socket->RelativeRotation != Rotations[Index])
        {
            return FString::Printf(
                TEXT("Exact review socket %d location or rotation drifted."), Index);
        }
        if (Socket->RelativeScale != FVector::OneVector)
        {
            return FString::Printf(
                TEXT("Exact review socket %d does not retain unit scale."), Index);
        }
        if (Socket->Tag != Tags[Index])
        {
            return FString::Printf(
                TEXT("Exact review socket %d has tag %s; expected %s."),
                Index,
                *Socket->Tag,
                *Tags[Index]);
        }
    }

    return FString();
}
