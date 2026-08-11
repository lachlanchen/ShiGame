#include "ShiCouncilFigure.h"

#include "ShiCouncilCharacterPresentationModel.h"
#include "ShiCouncilFacialPerformanceModel.h"
#include "ShiCouncilPerformancePresentationModel.h"
#include "ShiCouncilSkinLookdevModel.h"
#include "ShiCouncilWetRegisterInteractionModel.h"

#include "Animation/AnimSequence.h"
#include "Animation/Skeleton.h"
#include "Components/PrimitiveComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshSocket.h"
#include "Engine/SubsurfaceProfile.h"
#include "Engine/Texture2D.h"
#include "Materials/Material.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "Materials/MaterialParameters.h"
#include "MaterialDomain.h"
#include "PhysicsEngine/BodySetup.h"

namespace
{
    DEFINE_LOG_CATEGORY_STATIC(LogShiCouncilFigure, Log, All);

    void ConfigureCollision(UStaticMeshComponent& Component)
    {
        Component.SetCollisionEnabled(ECollisionEnabled::QueryOnly);
        Component.SetCollisionResponseToAllChannels(ECR_Ignore);
        Component.SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
    }

    void ApplyStencil(UPrimitiveComponent& Component, int32 StencilValue, bool bSpeaker)
    {
        Component.SetRenderCustomDepth(bSpeaker);
        Component.SetCustomDepthStencilValue(StencilValue);
    }

    bool ValidateSkinTexture(const UTexture2D* Texture,
        const FShiCouncilSkinLookdevTextureData& Contract, FString& OutError)
    {
        const bool bKnownAddress = Contract.AddressMode == TEXT("Clamp")
            || Contract.AddressMode == TEXT("Wrap");
        const bool bKnownCompression = Contract.EngineCompression == TEXT("BC7")
            || Contract.EngineCompression == TEXT("Masks")
            || Contract.EngineCompression == TEXT("BC5");
        const TextureAddress ExpectedAddress = Contract.AddressMode == TEXT("Clamp")
            ? TA_Clamp : TA_Wrap;
        const TextureCompressionSettings ExpectedCompression = Contract.EngineCompression == TEXT("BC7")
            ? TC_BC7
            : Contract.EngineCompression == TEXT("Masks") ? TC_Masks : TC_Normalmap;
        bool bFlipGreenChannelMatches = true;
#if WITH_EDITORONLY_DATA
        bFlipGreenChannelMatches = Texture
            && Texture->bFlipGreenChannel == Contract.bFlipGreenChannel;
#endif
        const FIntPoint ImportedSize = Texture ? Texture->GetImportedSize() : FIntPoint::ZeroValue;
        if (!bKnownAddress || !bKnownCompression
            || !Texture || Texture->GetClass() != UTexture2D::StaticClass()
            || Texture->GetPathName() != Contract.AssetPath
            || ImportedSize.X != Contract.Width || ImportedSize.Y != Contract.Height
            || Texture->SRGB != Contract.bSRGB
            || Texture->CompressionSettings != ExpectedCompression
            || Texture->AddressX != ExpectedAddress || Texture->AddressY != ExpectedAddress
            || !bFlipGreenChannelMatches)
        {
            OutError = FString::Printf(TEXT("Skin lookdev texture contract drifted for %s."),
                *Contract.TextureId);
            return false;
        }
        return true;
    }

    bool ValidateWetRegisterSocket(const UStaticMesh& Mesh, const FName SocketName,
        const FTransform& ExpectedTransform, FString& OutError)
    {
        const UStaticMeshSocket* Socket = Mesh.FindSocket(SocketName);
        const FTransform ActualTransform = Socket
            ? FTransform(Socket->RelativeRotation, Socket->RelativeLocation,
                Socket->RelativeScale)
            : FTransform::Identity;
        if (!Socket || !ActualTransform.Equals(ExpectedTransform, .0001f))
        {
            OutError = FString::Printf(
                TEXT("Wet-register marker socket %s is missing or drifted."),
                *SocketName.ToString());
            return false;
        }
        return true;
    }

    bool ValidateWetRegisterAnimationSamples(const UAnimSequence& Sequence,
        const USkeleton& Skeleton,
        const FShiCouncilWetRegisterInteractionContractData& Contract,
        FString& OutError)
    {
        const FReferenceSkeleton& Reference = Skeleton.GetReferenceSkeleton();
        const TArray<FTransform>& ReferencePose = Reference.GetRefBonePose();
        if (Reference.GetNum() != Contract.BoneCount
            || ReferencePose.Num() != Contract.BoneCount
            || !Sequence.IsBoneCompressedDataValid())
        {
            OutError = TEXT("Wet-register clip requires exact 53-bone reference data and valid platform-compressed bone data.");
            return false;
        }

        const TSet<FName> ArmBones = {
            FName(TEXT("clavicle_l")), FName(TEXT("upperarm_l")),
            FName(TEXT("lowerarm_l")), FName(TEXT("hand_l")),
            FName(TEXT("clavicle_r")), FName(TEXT("upperarm_r")),
            FName(TEXT("lowerarm_r")), FName(TEXT("hand_r"))
        };
        if (Reference.GetBoneName(0) != FName(TEXT("Root"))
            || Reference.GetParentIndex(0) != INDEX_NONE)
        {
            OutError = TEXT("Wet-register compressed clip no longer has the exact Root hierarchy.");
            return false;
        }
        for (const FName ArmBone : ArmBones)
        {
            if (Reference.FindBoneIndex(ArmBone) == INDEX_NONE)
            {
                OutError = FString::Printf(
                    TEXT("Wet-register compressed clip is missing exact arm bone %s."),
                    *ArmBone.ToString());
                return false;
            }
        }
        const FTransform ExpectedRoot = ReferencePose[0];
        if (ExpectedRoot.ContainsNaN())
        {
            OutError = TEXT("Wet-register shared reference Root is non-finite.");
            return false;
        }

        for (int32 SampleIndex = 0; SampleIndex < Contract.ExpectedSamples; ++SampleIndex)
        {
            const double SampleTime = static_cast<double>(SampleIndex)
                / static_cast<double>(Contract.ExpectedFramesPerSecond);
            const FAnimExtractContext ExtractContext(SampleTime, false, {}, false);
            for (int32 BoneIndex = 0; BoneIndex < Reference.GetNum(); ++BoneIndex)
            {
                FTransform BoneTransform = ReferencePose[BoneIndex];
                Sequence.GetBoneTransform(BoneTransform,
                    FSkeletonPoseBoneIndex(BoneIndex), ExtractContext, false);
                const FVector Scale = BoneTransform.GetScale3D();
                if (BoneTransform.ContainsNaN()
                    || Scale.X <= 0.f || Scale.Y <= 0.f || Scale.Z <= 0.f)
                {
                    OutError = FString::Printf(
                        TEXT("Wet-register compressed transform is non-finite or non-positive at sample %d bone %s."),
                        SampleIndex, *Reference.GetBoneName(BoneIndex).ToString());
                    return false;
                }
                if (ArmBones.Contains(Reference.GetBoneName(BoneIndex))
                    && !Scale.Equals(FVector::OneVector, .0001f))
                {
                    OutError = FString::Printf(
                        TEXT("Wet-register compressed arm scale drifted at sample %d bone %s."),
                        SampleIndex, *Reference.GetBoneName(BoneIndex).ToString());
                    return false;
                }
                if (BoneIndex == 0)
                {
                    const FVector WorldTranslationDeltaCentimeters =
                        (BoneTransform.GetTranslation() - ExpectedRoot.GetTranslation())
                        * Contract.CharacterComponentScale;
                    const float TranslationDriftCentimeters =
                        WorldTranslationDeltaCentimeters.Size();
                    const float RotationDriftDegrees = FMath::RadiansToDegrees(
                        ExpectedRoot.GetRotation().AngularDistance(BoneTransform.GetRotation()));
                    if (TranslationDriftCentimeters
                            > FShiCouncilWetRegisterInteractionModel::RootTranslationToleranceCentimeters()
                        || RotationDriftDegrees
                            > FShiCouncilWetRegisterInteractionModel::RootYawToleranceDegrees())
                    {
                        OutError = FString::Printf(
                            TEXT("Wet-register compressed Root drifted at sample %d (%.4f cm, %.4f deg)."),
                            SampleIndex, TranslationDriftCentimeters, RotationDriftDegrees);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    bool ValidateWetRegisterSharedReference(const USkeletalMesh& Mesh,
        const USkeleton& Skeleton, int32 ExpectedBoneCount, FString& OutError)
    {
        const FReferenceSkeleton& MeshReference = Mesh.GetRefSkeleton();
        const FReferenceSkeleton& SkeletonReference = Skeleton.GetReferenceSkeleton();
        if (MeshReference.GetRawBoneNum() != ExpectedBoneCount
            || SkeletonReference.GetRawBoneNum() != ExpectedBoneCount
            || MeshReference.GetRefBonePose().Num() != ExpectedBoneCount
            || SkeletonReference.GetRefBonePose().Num() != ExpectedBoneCount)
        {
            OutError = TEXT("Wet-register mesh and shared Skeleton no longer expose the exact 53-bone reference pose.");
            return false;
        }
        for (int32 BoneIndex = 0; BoneIndex < ExpectedBoneCount; ++BoneIndex)
        {
            if (MeshReference.GetBoneName(BoneIndex)
                    != SkeletonReference.GetBoneName(BoneIndex)
                || MeshReference.GetParentIndex(BoneIndex)
                    != SkeletonReference.GetParentIndex(BoneIndex)
                || !MeshReference.GetRefBonePose()[BoneIndex].Equals(
                    SkeletonReference.GetRefBonePose()[BoneIndex], .0001f))
            {
                OutError = FString::Printf(
                    TEXT("Wet-register shared Skeleton hierarchy or local bind drifted at bone %d."),
                    BoneIndex);
                return false;
            }
        }
        return true;
    }
}

AShiCouncilFigure::AShiCouncilFigure()
{
    PrimaryActorTick.bCanEverTick = true;
    PrimaryActorTick.bStartWithTickEnabled = false;
    FigureRoot = CreateDefaultSubobject<USceneComponent>(TEXT("FigureRoot"));
    SetRootComponent(FigureRoot);
    Body = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Body"));
    Body->SetupAttachment(FigureRoot);
    Head = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Head"));
    Head->SetupAttachment(FigureRoot);
    Mantle = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mantle"));
    Mantle->SetupAttachment(FigureRoot);
    CharacterMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("CharacterMesh"));
    CharacterMesh->SetupAttachment(FigureRoot);
    WetRegisterProp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("WetRegisterProp"));
    WetRegisterProp->SetupAttachment(CharacterMesh, FName(TEXT("hand_l")));

    FigureRoot->SetMobility(EComponentMobility::Movable);
    Body->SetMobility(EComponentMobility::Movable);
    Head->SetMobility(EComponentMobility::Movable);
    Mantle->SetMobility(EComponentMobility::Movable);
    CharacterMesh->SetMobility(EComponentMobility::Movable);
    WetRegisterProp->SetMobility(EComponentMobility::Movable);

    Body->SetRelativeLocation(FVector(0.f, 0.f, 68.f));
    Body->SetRelativeScale3D(FVector(.42f, .31f, 1.08f));
    Head->SetRelativeLocation(FVector(0.f, 0.f, 139.f));
    Head->SetRelativeScale3D(FVector(.27f, .27f, .27f));
    Mantle->SetRelativeLocation(FVector(0.f, 0.f, 105.f));
    Mantle->SetRelativeScale3D(FVector(.56f, .19f, .07f));
    CharacterMesh->SetRelativeScale3D(FVector(FShiCouncilCharacterPresentationModel::PresentationScale()));
    CharacterMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    CharacterMesh->SetGenerateOverlapEvents(false);
    CharacterMesh->SetCanEverAffectNavigation(false);
    CharacterMesh->SetVisibility(false, true);
    CharacterMesh->SetHiddenInGame(true, true);
    CharacterMesh->SetComponentTickEnabled(false);
    WetRegisterProp->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    WetRegisterProp->SetGenerateOverlapEvents(false);
    WetRegisterProp->SetCanEverAffectNavigation(false);
    WetRegisterProp->SetVisibility(false, true);
    WetRegisterProp->SetHiddenInGame(true, true);
    WetRegisterProp->SetComponentTickEnabled(false);
    ConfigureCollision(*Body);
    ConfigureCollision(*Head);
    ConfigureCollision(*Mantle);
}

void AShiCouncilFigure::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if ((!bUsingFacialPerformance && !bUsingWetRegisterInteraction) || !bReviewVisible
        || !FMath::IsFinite(DeltaSeconds) || DeltaSeconds <= 0.f)
    {
        return;
    }
    if (bUsingWetRegisterInteraction)
    {
        WetRegisterElapsedSeconds = FMath::Min(
            WetRegisterElapsedSeconds + DeltaSeconds,
            FShiCouncilWetRegisterInteractionModel::ExpectedDurationSeconds());
        ApplyWetRegisterInteractionFrame();
    }
    if (bUsingFacialPerformance)
    {
        if (bUsingWetRegisterInteraction)
        {
            FacialElapsedSeconds = FMath::Min(WetRegisterElapsedSeconds,
                FShiCouncilFacialPerformanceModel::CycleDurationSeconds()
                    - KINDA_SMALL_NUMBER);
        }
        else
        {
            FacialElapsedSeconds = bReducedMotion
                ? FMath::Min(
                    FacialElapsedSeconds + DeltaSeconds,
                    FShiCouncilFacialPerformanceModel::CycleDurationSeconds()
                        - KINDA_SMALL_NUMBER)
                : FMath::Fmod(
                    FacialElapsedSeconds + DeltaSeconds,
                    FShiCouncilFacialPerformanceModel::CycleDurationSeconds());
        }
        ApplyFacialFrame();
        if (bUsingWetRegisterInteraction)
        {
            // The manual clip refresh above establishes the arm pose. Facial
            // morph overrides are consumed by a subsequent refresh so the
            // terminal wet-register frame cannot retain the prior face.
            CharacterMesh->RefreshBoneTransforms();
        }
    }
    RefreshActorTick();
}

bool AShiCouncilFigure::InitializeFigure(UStaticMesh* Cylinder, UStaticMesh* Sphere, UStaticMesh* Cube,
    UMaterialInterface* BasicMaterial, FString& OutError)
{
    if (!Cylinder || !Sphere || !Cube || !BasicMaterial)
    {
        OutError = TEXT("Council figure requires engine-native body, head, mantle and material assets.");
        return false;
    }
    Body->SetStaticMesh(Cylinder);
    Head->SetStaticMesh(Sphere);
    Mantle->SetStaticMesh(Cube);
    BodyMaterial = Body->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
    HeadMaterial = Head->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
    MantleMaterial = Mantle->CreateDynamicMaterialInstance(0, BasicMaterial, NAME_None);
    if (!BodyMaterial || !HeadMaterial || !MantleMaterial)
    {
        OutError = TEXT("Council figure materials could not initialize.");
        return false;
    }
    SkinLookdevMaterial = nullptr;
    SkinLookdevBaselineMaterial = nullptr;
    SkinLookdevMaterialIndex = INDEX_NONE;
    bSkinLookdevInventoryReady = false;
    if (bSkinLookdevReviewEnabled)
    {
        FString SkinError;
        bSkinLookdevInventoryReady = LoadSkinLookdevInventory(SkinError);
        if (!bSkinLookdevInventoryReady)
        {
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council skin lookdev remains on the accepted SkinClay fallback: %s"),
                *SkinError);
        }
    }
    WetRegisterMesh = nullptr;
    WetRegisterMaterial = nullptr;
    WetRegisterInteractionClip = nullptr;
    bWetRegisterInteractionInventoryReady = false;
    ClearWetRegisterInteraction();
    if (bWetRegisterInteractionReviewEnabled)
    {
        FString InteractionError;
        bWetRegisterInteractionInventoryReady =
            LoadWetRegisterInteractionInventory(InteractionError);
        if (!bWetRegisterInteractionInventoryReady)
        {
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council wet-register interaction remains on the accepted neutral fallback: %s"),
                *InteractionError);
        }
    }
    FacialCharacterMeshes.Empty();
    for (const FString& CouncilCharacterId : FShiCouncilFacialPerformanceModel::CanonicalCharacterIds())
    {
        FShiCouncilFacialMeshData Presentation;
        FString FacialError;
        if (!FShiCouncilFacialPerformanceModel::Build(CouncilCharacterId, Presentation, FacialError))
        {
            UE_LOG(LogShiCouncilFigure, Warning, TEXT("Council facial contract rejected for %s: %s"),
                *CouncilCharacterId, *FacialError);
            continue;
        }
        USkeletalMesh* Mesh = LoadObject<USkeletalMesh>(nullptr, *Presentation.MeshPath);
        if (!Mesh || !FShiCouncilFacialPerformanceModel::ValidateMesh(Presentation, *Mesh, FacialError))
        {
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council facial performance %s remains on the accepted neutral-face fallback: %s"),
                *CouncilCharacterId, Mesh ? *FacialError : TEXT("facial skeletal asset is unavailable"));
            continue;
        }
        FacialCharacterMeshes.Add(CouncilCharacterId, Mesh);
    }
    CharacterMeshes.Empty();
    for (const FString& CouncilCharacterId : FShiCouncilCharacterPresentationModel::CanonicalCharacterIds())
    {
        FShiCouncilCharacterPresentationData Presentation;
        FString CharacterError;
        if (!FShiCouncilCharacterPresentationModel::Build(CouncilCharacterId, Presentation, CharacterError))
        {
            UE_LOG(LogShiCouncilFigure, Warning, TEXT("Council character contract rejected for %s: %s"),
                *CouncilCharacterId, *CharacterError);
            continue;
        }
        USkeletalMesh* Mesh = LoadObject<USkeletalMesh>(nullptr, *Presentation.MeshPath);
        if (!Mesh || !FShiCouncilCharacterPresentationModel::ValidateMesh(Presentation, *Mesh, CharacterError))
        {
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council character %s remains on the fail-closed primitive fallback: %s"),
                *CouncilCharacterId, Mesh ? *CharacterError : TEXT("skeletal asset is unavailable"));
            continue;
        }
        CharacterMeshes.Add(CouncilCharacterId, Mesh);
    }
    PerformanceClips.Empty();
    for (const FString& RoleId : FShiCouncilPerformancePresentationModel::CanonicalRoleIds())
    {
        FShiCouncilPerformanceData Performance;
        FString PerformanceError;
        if (!FShiCouncilPerformancePresentationModel::Build(RoleId, Performance, PerformanceError))
        {
            UE_LOG(LogShiCouncilFigure, Warning, TEXT("Council performance contract rejected for %s: %s"),
                *RoleId, *PerformanceError);
            continue;
        }
        UAnimSequence* Sequence = LoadObject<UAnimSequence>(nullptr, *Performance.AnimationPath);
        USkeleton* Skeleton = Sequence ? Sequence->GetSkeleton() : nullptr;
        if (!Sequence || !Skeleton
            || !FShiCouncilPerformancePresentationModel::ValidateSequence(
                Performance, *Sequence, *Skeleton, PerformanceError))
        {
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council performance %s remains on the fail-closed reference-pose fallback: %s"),
                *RoleId, Sequence && Skeleton ? *PerformanceError : TEXT("animation or Skeleton is unavailable"));
            continue;
        }
        PerformanceClips.Add(RoleId, Sequence);
    }
    OutError.Empty();
    return true;
}

void AShiCouncilFigure::SetSkinLookdevReviewEnabled(bool bEnabled)
{
#if UE_BUILD_SHIPPING
    bSkinLookdevReviewEnabled = false;
#else
    bSkinLookdevReviewEnabled = bEnabled;
#endif
}

void AShiCouncilFigure::SetWetRegisterInteractionReviewEnabled(
    bool bEnabled, const FString& NodeId)
{
#if UE_BUILD_SHIPPING
    bWetRegisterInteractionReviewEnabled = false;
    WetRegisterNodeId.Empty();
#else
    bWetRegisterInteractionReviewEnabled = bEnabled;
    WetRegisterNodeId = bEnabled ? NodeId : FString();
#endif
}

bool AShiCouncilFigure::LoadWetRegisterInteractionInventory(FString& OutError)
{
    FShiCouncilWetRegisterInteractionContractData Contract;
    if (!FShiCouncilWetRegisterInteractionModel::BuildContract(Contract, OutError))
    {
        return false;
    }
    UStaticMesh* PropMesh = LoadObject<UStaticMesh>(
        nullptr, *FShiCouncilWetRegisterInteractionModel::CanonicalPropMeshPath());
    UMaterialInterface* PropMaterial = LoadObject<UMaterialInterface>(
        nullptr, *FShiCouncilWetRegisterInteractionModel::CanonicalPropMaterialPath());
    UAnimSequence* InteractionClip = LoadObject<UAnimSequence>(
        nullptr, *FShiCouncilWetRegisterInteractionModel::CanonicalAnimationPath());
    USkeleton* ClipSkeleton = InteractionClip ? InteractionClip->GetSkeleton() : nullptr;
    UMaterial* BaseMaterial = PropMaterial ? PropMaterial->GetMaterial() : nullptr;
    if (!PropMesh || PropMesh->GetClass() != UStaticMesh::StaticClass()
        || PropMesh->GetPathName()
            != FShiCouncilWetRegisterInteractionModel::CanonicalPropMeshPath()
        || !PropMaterial || PropMaterial->GetClass() != UMaterial::StaticClass()
        || PropMaterial->GetPathName()
            != FShiCouncilWetRegisterInteractionModel::CanonicalPropMaterialPath()
        || !BaseMaterial || BaseMaterial->MaterialDomain != MD_Surface
        || PropMaterial->GetBlendMode() != BLEND_Opaque
        || !PropMaterial->GetShadingModels().HasOnlyShadingModel(MSM_DefaultLit)
        || PropMaterial->IsTwoSided())
    {
        OutError = TEXT("Wet-register exact prop or opaque one-sided clay material is unavailable or drifted.");
        return false;
    }
    const FVector PropDimensions = PropMesh->GetBounds().BoxExtent * 2.f;
    const TArray<FStaticMaterial>& StaticMaterials = PropMesh->GetStaticMaterials();
    const UBodySetup* BodySetup = PropMesh->GetBodySetup();
    if (!PropDimensions.Equals(Contract.PropWorldDimensionsCentimeters, .05f)
        || StaticMaterials.Num() != 1
        || StaticMaterials[0].MaterialInterface != PropMaterial
        || !BodySetup || BodySetup->AggGeom.GetElementCount() != 0
        || BodySetup->CollisionTraceFlag != CTF_UseSimpleAsComplex
        || PropMesh->IsNavigationRelevant() || PropMesh->GetNavCollision() != nullptr
        || PropMesh->Sockets.Num() != Contract.MarkerSocketNames.Num()
        || Contract.MarkerLocalTransformsCentimeters.Num()
            != Contract.MarkerSocketNames.Num())
    {
        OutError = TEXT("Wet-register dimensions, single material, collision/navigation-free body or marker inventory drifted.");
        return false;
    }
    for (int32 MarkerIndex = 0; MarkerIndex < Contract.MarkerSocketNames.Num(); ++MarkerIndex)
    {
        if (!ValidateWetRegisterSocket(*PropMesh,
                FName(*Contract.MarkerSocketNames[MarkerIndex]),
                Contract.MarkerLocalTransformsCentimeters[MarkerIndex], OutError))
        {
            return false;
        }
    }
    if (!InteractionClip || InteractionClip->GetClass() != UAnimSequence::StaticClass()
        || InteractionClip->GetPathName()
            != FShiCouncilWetRegisterInteractionModel::CanonicalAnimationPath()
        || !ClipSkeleton || ClipSkeleton->GetPathName()
            != FShiCouncilWetRegisterInteractionModel::CanonicalSkeletonPath()
        || InteractionClip->GetNumberOfSampledKeys() != Contract.ExpectedSamples
        || !FMath::IsNearlyEqual(InteractionClip->GetPlayLength(),
            Contract.ExpectedDurationSeconds, .0001f)
        || !FMath::IsNearlyEqual(
            static_cast<float>(InteractionClip->GetSamplingFrameRate().AsDecimal()),
            Contract.ExpectedFramesPerSecond, .0001f)
        || InteractionClip->HasRootMotion() || InteractionClip->IsValidAdditive()
        || !InteractionClip->Notifies.IsEmpty())
    {
        OutError = TEXT("Wet-register exact non-additive, notify-free, root-stationary 121-sample clip or shared Skeleton drifted.");
        return false;
    }
    if (!ValidateWetRegisterAnimationSamples(
            *InteractionClip, *ClipSkeleton, Contract, OutError))
    {
        return false;
    }
    WetRegisterMesh = PropMesh;
    WetRegisterMaterial = PropMaterial;
    WetRegisterInteractionClip = InteractionClip;
    OutError.Empty();
    return true;
}

bool AShiCouncilFigure::LoadSkinLookdevInventory(FString& OutError)
{
    FShiCouncilSkinLookdevContractData Contract;
    if (!FShiCouncilSkinLookdevModel::BuildContract(Contract, OutError)) return false;

    USubsurfaceProfile* Profile = LoadObject<USubsurfaceProfile>(
        nullptr, *Contract.Material.SubsurfaceProfilePath);
    UMaterialInterface* Material = LoadObject<UMaterialInterface>(
        nullptr, *Contract.Material.MaterialPath);
    UTexture2D* BaseColor = LoadObject<UTexture2D>(
        nullptr, *Contract.TextureInventory[0].AssetPath);
    UTexture2D* Masks = LoadObject<UTexture2D>(
        nullptr, *Contract.TextureInventory[1].AssetPath);
    UTexture2D* DetailNormal = LoadObject<UTexture2D>(
        nullptr, *Contract.TextureInventory[2].AssetPath);
    UMaterialInterface* AcceptedBaselineMaterial = LoadObject<UMaterialInterface>(
        nullptr, *Contract.Baseline.MaterialPath);
    UMaterial* BaseMaterial = Material ? Material->GetMaterial() : nullptr;
    if (!AcceptedBaselineMaterial
        || AcceptedBaselineMaterial->GetClass() != UMaterial::StaticClass()
        || AcceptedBaselineMaterial->GetPathName() != Contract.Baseline.MaterialPath)
    {
        OutError = TEXT("Accepted SkinClay fallback material is unavailable or drifted.");
        return false;
    }
    SkinLookdevBaselineMaterial = AcceptedBaselineMaterial;
    if (!Profile || Profile->GetClass() != USubsurfaceProfile::StaticClass()
        || Profile->GetPathName() != Contract.Material.SubsurfaceProfilePath
        || !Material || Material->GetClass() != UMaterial::StaticClass()
        || Material->GetPathName() != Contract.Material.MaterialPath
        || !BaseMaterial || BaseMaterial->MaterialDomain != MD_Surface
        || Material->GetBlendMode() != BLEND_Opaque
        || !Material->GetShadingModels().HasOnlyShadingModel(MSM_SubsurfaceProfile)
        || Material->IsTwoSided()
        || Material->SubsurfaceProfile != Profile
        || !Material->GetUsageByFlag(MATUSAGE_SkeletalMesh)
        || !Material->GetUsageByFlag(MATUSAGE_MorphTargets))
    {
        OutError = TEXT("Skin lookdev profile or skeletal morph-capable material contract drifted.");
        return false;
    }
    if (!ValidateSkinTexture(BaseColor, Contract.TextureInventory[0], OutError)
        || !ValidateSkinTexture(Masks, Contract.TextureInventory[1], OutError)
        || !ValidateSkinTexture(DetailNormal, Contract.TextureInventory[2], OutError))
    {
        return false;
    }
    TArray<FMaterialParameterInfo> TextureParameterInfo;
    TArray<FGuid> TextureParameterIds;
    Material->GetAllTextureParameterInfo(TextureParameterInfo, TextureParameterIds);
    TSet<FName> ActualTextureParameters;
    bool bTextureParameterContractMatches = TextureParameterInfo.Num()
        == FShiCouncilSkinLookdevModel::TextureInventoryCount();
    for (const FMaterialParameterInfo& ParameterInfo : TextureParameterInfo)
    {
        if (ParameterInfo.Association != GlobalParameter
            || ParameterInfo.Index != INDEX_NONE)
        {
            bTextureParameterContractMatches = false;
        }
        ActualTextureParameters.Add(ParameterInfo.Name);
    }
    const UTexture* ExpectedTextures[] = {BaseColor, Masks, DetailNormal};
    for (int32 TextureIndex = 0; TextureIndex < Contract.TextureInventory.Num(); ++TextureIndex)
    {
        const FName ParameterName = Contract.TextureInventory[TextureIndex].MaterialParameter;
        UTexture* ActualTexture = nullptr;
        if (!ActualTextureParameters.Contains(ParameterName)
            || !Material->GetTextureParameterValue(
                FHashedMaterialParameterInfo(ParameterName), ActualTexture)
            || ActualTexture != ExpectedTextures[TextureIndex])
        {
            bTextureParameterContractMatches = false;
        }
    }
    if (!bTextureParameterContractMatches
        || ActualTextureParameters.Num() != FShiCouncilSkinLookdevModel::TextureInventoryCount())
    {
        OutError = TEXT("Skin lookdev material must expose exactly the three admitted global texture parameters and values.");
        return false;
    }
    TArray<FMaterialParameterInfo> ScalarParameterInfo;
    TArray<FGuid> ScalarParameterIds;
    Material->GetAllScalarParameterInfo(ScalarParameterInfo, ScalarParameterIds);
    TSet<FName> ActualScalarParameters;
    bool bScalarParameterContractMatches = ScalarParameterInfo.Num() == 2;
    for (const FMaterialParameterInfo& ParameterInfo : ScalarParameterInfo)
    {
        if (ParameterInfo.Association != GlobalParameter || ParameterInfo.Index != INDEX_NONE)
        {
            bScalarParameterContractMatches = false;
        }
        ActualScalarParameters.Add(ParameterInfo.Name);
    }
    float Metallic = -1.f;
    float Specular = -1.f;
    if (!ActualScalarParameters.Contains(Contract.Material.MetallicParameter)
        || !ActualScalarParameters.Contains(Contract.Material.SpecularParameter)
        || !Material->GetScalarParameterValue(
            FHashedMaterialParameterInfo(Contract.Material.MetallicParameter), Metallic)
        || !Material->GetScalarParameterValue(
            FHashedMaterialParameterInfo(Contract.Material.SpecularParameter), Specular)
        || !FMath::IsNearlyEqual(Metallic, Contract.Material.Metallic)
        || !FMath::IsNearlyEqual(Specular, Contract.Material.Specular)
        || Specular > Contract.Material.MaximumSpecular)
    {
        bScalarParameterContractMatches = false;
    }
    if (!bScalarParameterContractMatches || ActualScalarParameters.Num() != 2)
    {
        OutError = TEXT("Skin lookdev material must expose exactly the admitted bounded Metallic and Specular parameters.");
        return false;
    }
    SkinLookdevMaterial = Material;
    OutError.Empty();
    return true;
}

bool AShiCouncilFigure::ActivateWetRegisterInteraction(
    const FShiCouncilParticipantData& Participant, FString& OutError)
{
    FShiCouncilWetRegisterInteractionContractData Contract;
    if (!FShiCouncilWetRegisterInteractionModel::BuildContract(Contract, OutError))
    {
        return false;
    }
    USkeletalMesh* AdmittedMesh = CharacterMesh->GetSkeletalMeshAsset();
    USkeleton* MeshSkeleton = AdmittedMesh ? AdmittedMesh->GetSkeleton() : nullptr;
    USkeleton* ClipSkeleton = WetRegisterInteractionClip
        ? WetRegisterInteractionClip->GetSkeleton() : nullptr;
    FShiCouncilFacialMeshData FacialPresentation;
    FString FacialError;
    const bool bExactFacialHierarchy = AdmittedMesh
        && FShiCouncilFacialPerformanceModel::Build(
            Contract.SpeakerCharacterId, FacialPresentation, FacialError)
        && FShiCouncilFacialPerformanceModel::ValidateMesh(
            FacialPresentation, *AdmittedMesh, FacialError);
    FString SharedReferenceError;
    const bool bExactSharedReference = AdmittedMesh && MeshSkeleton
        && ValidateWetRegisterSharedReference(*AdmittedMesh, *MeshSkeleton,
            Contract.BoneCount, SharedReferenceError);
    if (!bWetRegisterInteractionInventoryReady || !WetRegisterMesh
        || !WetRegisterMaterial || !WetRegisterInteractionClip
        || WetRegisterNodeId != Contract.NodeId
        || Participant.CharacterId != Contract.SpeakerCharacterId
        || Participant.SlotId != Contract.ParticipantSlotId || !Participant.bSpeaker
        || !bUsingFacialPerformance || !bExactFacialHierarchy
        || !bExactSharedReference || !AdmittedMesh
        || AdmittedMesh->GetPathName() != Contract.CharacterMeshPath
        || !MeshSkeleton || MeshSkeleton->GetPathName() != Contract.SkeletonPath
        || ClipSkeleton != MeshSkeleton
        || MeshSkeleton->GetReferenceSkeleton().GetNum() != Contract.BoneCount
        || MeshSkeleton->GetReferenceSkeleton().FindBoneIndex(FName(TEXT("hand_l"))) == INDEX_NONE
        || MeshSkeleton->GetReferenceSkeleton().FindBoneIndex(FName(TEXT("hand_r"))) == INDEX_NONE
        || !CharacterMesh->GetRelativeScale3D().Equals(Contract.CharacterComponentScale, .0001f))
    {
        if (!FacialError.IsEmpty())
        {
            OutError = FString::Printf(TEXT("Wet-register accepted facial hierarchy drifted: %s"),
                *FacialError);
        }
        else if (!SharedReferenceError.IsEmpty())
        {
            OutError = SharedReferenceError;
        }
        else
        {
            OutError = TEXT("Wet-register route requires its exact rain-order speaker, facial mesh, shared 53-bone Skeleton and admitted three-asset inventory.");
        }
        return false;
    }

    FTransform LeftSupportMarker;
    if (!FShiCouncilWetRegisterInteractionModel::TryGetMarkerLocalTransform(
            Contract.MarkerIds[0], LeftSupportMarker))
    {
        OutError = TEXT("Wet-register left-support marker contract is unavailable.");
        return false;
    }
    FTransform AttachmentTransform = LeftSupportMarker.Inverse();
    AttachmentTransform.SetTranslation(
        AttachmentTransform.GetTranslation()
            * Contract.PropAttachmentRelativeScale.X);
    AttachmentTransform.SetScale3D(Contract.PropAttachmentRelativeScale);

    WetRegisterProp->SetStaticMesh(WetRegisterMesh);
    WetRegisterProp->SetMaterial(0, WetRegisterMaterial);
    WetRegisterProp->AttachToComponent(CharacterMesh,
        FAttachmentTransformRules::KeepRelativeTransform, FName(TEXT("hand_l")));
    WetRegisterProp->SetRelativeTransform(AttachmentTransform);
    WetRegisterProp->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    WetRegisterProp->SetGenerateOverlapEvents(false);
    WetRegisterProp->SetCanEverAffectNavigation(false);
    if (WetRegisterProp->GetStaticMesh() != WetRegisterMesh
        || WetRegisterProp->GetMaterial(0) != WetRegisterMaterial
        || WetRegisterProp->GetAttachParent() != CharacterMesh
        || WetRegisterProp->GetAttachSocketName() != FName(TEXT("hand_l"))
        || !WetRegisterProp->GetRelativeScale3D().Equals(
            Contract.PropAttachmentRelativeScale, .000001f))
    {
        OutError = TEXT("Wet-register prop could not bind exactly to the left hand with x100 scale compensation.");
        ClearWetRegisterInteraction();
        return false;
    }

    CharacterMesh->SetForceRefPose(false);
    CharacterMesh->OverrideAnimationData(
        WetRegisterInteractionClip, false, false, 0.f, 0.f);
    CharacterMesh->SetComponentTickEnabled(false);
    bUsingWetRegisterInteraction = true;
    bUsingPerformance = true;
    PerformanceRoleId = Contract.AssetId;
    WetRegisterElapsedSeconds = 0.f;
    WetRegisterStateId.Empty();
    Tags.Add(FName(TEXT("ShiArtStatus:WetRegisterInteractionEngineeringBlockout")));
    Tags.Add(FName(TEXT("ShiWetRegisterInteraction:ChenShengV1")));
    Tags.Add(FName(TEXT("ShiHistoricalStatus:DramaticReconstructionNotSurvivingRegister")));
    Tags.Add(FName(TEXT("ShiFraming:WideMediumOnly")));
    ApplyWetRegisterInteractionFrame();
    if (!bUsingWetRegisterInteraction)
    {
        OutError = TEXT("Wet-register initial frame failed its runtime contact admission.");
        return false;
    }
    OutError.Empty();
    return true;
}

void AShiCouncilFigure::ApplyWetRegisterInteractionFrame()
{
    if (!bUsingWetRegisterInteraction) return;
    const auto FailClosed = [this](const FString& Error)
    {
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council wet-register runtime failed closed: %s"), *Error);
        ClearWetRegisterInteraction();
        Tags.Add(FName(TEXT("ShiWetRegisterInteractionFallback:NeutralReferencePose")));
        ClearFacialFrame();
        bUsingFacialPerformance = false;
        FacialElapsedSeconds = 0.f;
        CharacterMesh->Stop();
        CharacterMesh->SetAnimation(nullptr);
        CharacterMesh->SetForceRefPose(true);
        CharacterMesh->RefreshBoneTransforms();
        CharacterMesh->SetComponentTickEnabled(false);
    };

    FShiCouncilWetRegisterInteractionContractData Contract;
    FString Error;
    if (!FShiCouncilWetRegisterInteractionModel::BuildContract(Contract, Error)
        || !bWetRegisterInteractionInventoryReady || !WetRegisterMesh
        || !WetRegisterMaterial || !WetRegisterInteractionClip
        || CharacterMesh->GetSkeletalMeshAsset() == nullptr
        || CharacterMesh->GetSkeletalMeshAsset()->GetPathName()
            != Contract.CharacterMeshPath
        || WetRegisterProp->GetStaticMesh() != WetRegisterMesh
        || WetRegisterProp->GetMaterial(0) != WetRegisterMaterial)
    {
        FailClosed(Error.IsEmpty()
            ? TEXT("the exact runtime inventory or Chen mesh drifted") : Error);
        return;
    }

    FShiCouncilWetRegisterInteractionFrameRequest Request;
    Request.Contract = Contract;
    Request.NodeId = WetRegisterNodeId;
    Request.SpeakerCharacterId = CharacterId;
    Request.ParticipantSlotId = SlotId;
    Request.ReviewModeId = bWetRegisterInteractionReviewEnabled
        ? FShiCouncilWetRegisterInteractionModel::CanonicalReviewModeId() : FString();
    Request.ElapsedSeconds = WetRegisterElapsedSeconds;
    Request.bDevelopmentReviewAuthorized = bWetRegisterInteractionReviewEnabled;
    Request.bReducedMotion = bReducedMotion;
    FShiCouncilWetRegisterInteractionFrameData Frame;
    if (!FShiCouncilWetRegisterInteractionModel::Evaluate(Request, Frame, Error))
    {
        FailClosed(Error);
        return;
    }

    CharacterMesh->SetPosition(Frame.PoseSeconds, false);
    CharacterMesh->TickAnimation(0.f, false);
    CharacterMesh->RefreshBoneTransforms();
    WetRegisterProp->UpdateComponentToWorld();
    WetRegisterProp->SetVisibility(bReviewVisible, true);
    WetRegisterProp->SetHiddenInGame(!bReviewVisible, true);

    const FVector ComponentScale = WetRegisterProp->GetComponentScale().GetAbs();
    const FVector WorldDimensions = WetRegisterMesh->GetBounds().BoxExtent
        * 2.f * ComponentScale;
    const FTransform LeftHand = CharacterMesh->GetSocketTransform(
        FName(TEXT("hand_l")), RTS_World);
    const FTransform LeftMarker = WetRegisterProp->GetSocketTransform(
        FName(*Contract.MarkerSocketNames[0]), RTS_World);
    const float LeftTranslationDrift = FVector::Distance(
        LeftHand.GetTranslation(), LeftMarker.GetTranslation());
    const float LeftDot = FMath::Clamp(FMath::Abs(LeftHand.GetRotation()
        | LeftMarker.GetRotation()), 0.f, 1.f);
    const float LeftRotationDriftDegrees = FMath::RadiansToDegrees(
        2.f * FMath::Acos(LeftDot));
    bool bContactMatches = WorldDimensions.Equals(
        Frame.PropWorldDimensionsCentimeters, .05f)
        && FMath::IsFinite(LeftTranslationDrift)
        && FMath::IsFinite(LeftRotationDriftDegrees)
        && LeftTranslationDrift
            <= FShiCouncilWetRegisterInteractionModel::LeftSupportTranslationToleranceCentimeters()
        && LeftRotationDriftDegrees
            <= FShiCouncilWetRegisterInteractionModel::LeftSupportRotationToleranceDegrees();
    float RightFloatingDistance = 0.f;
    if (bContactMatches && Frame.bRightContact)
    {
        const FTransform RightHand = CharacterMesh->GetSocketTransform(
            FName(TEXT("hand_r")), RTS_World);
        const FTransform RightMarker = WetRegisterProp->GetSocketTransform(
            FName(*Contract.MarkerSocketNames[1]), RTS_World);
        RightFloatingDistance = FVector::Distance(
            RightHand.GetTranslation(), RightMarker.GetTranslation());
        bContactMatches = FMath::IsFinite(RightFloatingDistance)
            && RightFloatingDistance
                <= FShiCouncilWetRegisterInteractionModel::RightFloatingToleranceCentimeters();
    }
    if (!bContactMatches)
    {
        FailClosed(FString::Printf(
            TEXT("live prop/contact drift exceeded admission (left=%.4f cm, left-rotation=%.4f deg, right=%.4f cm)"),
            LeftTranslationDrift, LeftRotationDriftDegrees, RightFloatingDistance));
        return;
    }

    WetRegisterStateId = Frame.StateId;
    if (!bLoggedWetRegisterAdmission)
    {
        bLoggedWetRegisterAdmission = true;
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_WET_REGISTER_INTERACTION_RUNTIME_ADMITTED asset=%s node=%s character=%s role=speaker prop=%s material=%s clip=%s samples=%d fps=30.0000 duration=4.0000 dimensions_cm=32.0000,14.0000,2.0000 left_owner=hand_l relative_scale=0.0100 source_contact=conservative-mesh-sampled source_max_penetration_cm=%.4f source_left_support_max_floating_cm=%.4f source_right_hold_max_floating_cm=%.4f runtime_contact=wrist-marker motion=%s visible_mesh_review=false anatomy_review=false final_hand=false final_prop=false historical_object=false player_ownership_continuity=false human_historical_cultural_review=false"),
            *Contract.AssetId, *Frame.NodeId, *Frame.SpeakerCharacterId,
            *Frame.PropMeshPath, *Frame.PropMaterialPath, *Frame.AnimationPath,
            Contract.ExpectedSamples,
            Frame.MaximumObservedHandPenetrationCentimeters,
            Frame.MaximumObservedLeftSupportFloatingCentimeters,
            Frame.MaximumObservedRightFloatingCentimeters,
            Frame.bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
    if (!bLoggedWetRegisterBilateralContact
        && Frame.StateId == TEXT("bilateral-contact") && Frame.bRightContact)
    {
        bLoggedWetRegisterBilateralContact = true;
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_WET_REGISTER_INTERACTION_BILATERAL_CONTACT state=bilateral-contact semantic_sample=30 pose_sample=%d left_drift_cm=%.4f right_float_cm=%.4f runtime_contact=wrist-marker visible_mesh_review=false motion=%s"),
            Frame.PoseSampleIndex, LeftTranslationDrift, RightFloatingDistance,
            Frame.bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
    if (!bLoggedWetRegisterHeldQuestion
        && Frame.StateId == TEXT("held-question")
        && Frame.bLeftSupport && Frame.bRightContact)
    {
        bLoggedWetRegisterHeldQuestion = true;
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_WET_REGISTER_INTERACTION_HELD_QUESTION state=held-question semantic_sample=60 pose_sample=%d left_owner=true right_contact=true player_ownership_continuity=false human_historical_cultural_review=false motion=%s"),
            Frame.PoseSampleIndex,
            Frame.bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
    if (!bLoggedWetRegisterOrderedRelease
        && Frame.StateId == TEXT("ordered-release") && Frame.bRightReleasing)
    {
        bLoggedWetRegisterOrderedRelease = true;
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_WET_REGISTER_INTERACTION_ORDERED_RELEASE state=ordered-release semantic_sample=90 pose_sample=%d left_owner=true right_contact=false motion=%s"),
            Frame.PoseSampleIndex,
            Frame.bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
    if (!bLoggedWetRegisterTerminalClamp && Frame.bTerminalClamp
        && Frame.StateId == TEXT("settle") && Frame.PoseSampleIndex == 120)
    {
        bLoggedWetRegisterTerminalClamp = true;
        CharacterMesh->SetComponentTickEnabled(false);
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_WET_REGISTER_INTERACTION_TERMINAL_CLAMP state=settle sample=120 seconds=4.0000 left_owner=true loop=false motion=%s"),
            Frame.bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
}

void AShiCouncilFigure::ClearWetRegisterInteraction()
{
    const bool bWasUsingWetRegisterInteraction = bUsingWetRegisterInteraction;
    bUsingWetRegisterInteraction = false;
    if (bWasUsingWetRegisterInteraction)
    {
        bUsingPerformance = false;
        PerformanceRoleId.Empty();
    }
    WetRegisterStateId.Empty();
    WetRegisterElapsedSeconds = 0.f;
    WetRegisterProp->SetVisibility(false, true);
    WetRegisterProp->SetHiddenInGame(true, true);
    WetRegisterProp->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    WetRegisterProp->SetGenerateOverlapEvents(false);
    Tags.Remove(FName(TEXT("ShiArtStatus:WetRegisterInteractionEngineeringBlockout")));
    Tags.Remove(FName(TEXT("ShiWetRegisterInteraction:ChenShengV1")));
    Tags.Remove(FName(TEXT("ShiHistoricalStatus:DramaticReconstructionNotSurvivingRegister")));
    Tags.Remove(FName(TEXT("ShiWetRegisterInteractionFallback:NeutralReferencePose")));
}

void AShiCouncilFigure::ApplyParticipant(const FShiCouncilParticipantData& Participant)
{
    SlotId = Participant.SlotId;
    CharacterId = Participant.CharacterId;
    bParticipantSpeaker = Participant.bSpeaker;
    bLoggedMorphSectionExercise = false;
    bLoggedSkinLookdevAdmission = false;
    bLoggedWetRegisterAdmission = false;
    bLoggedWetRegisterBilateralContact = false;
    bLoggedWetRegisterHeldQuestion = false;
    bLoggedWetRegisterOrderedRelease = false;
    bLoggedWetRegisterTerminalClamp = false;
    FacialElapsedSeconds = 0.f;
    WetRegisterElapsedSeconds = 0.f;
    SetActorTransform(Participant.Transform);
    Tags.Empty();
    Tags.Add(FName(*FString::Printf(TEXT("ShiCharacter:%s"), *Participant.CharacterId)));
    Tags.Add(FName(*FString::Printf(TEXT("ShiCouncilSlot:%s"), *Participant.SlotId)));
    if (Participant.bSpeaker) Tags.Add(FName(TEXT("ShiCouncilSpeaker")));

    CharacterMesh->Stop();
    CharacterMesh->SetAnimation(nullptr);
    ClearFacialFrame();
    CharacterMesh->SetForceRefPose(true);
    CharacterMesh->bPauseAnims = false;
    CharacterMesh->SetComponentTickEnabled(false);
    bUsingPerformance = false;
    bUsingFacialPerformance = false;
    bUsingSkinLookdev = false;
    SkinLookdevMaterialIndex = INDEX_NONE;
    PerformanceRoleId.Empty();
    CharacterMesh->EmptyOverrideMaterials();
    ClearWetRegisterInteraction();

    const TObjectPtr<USkeletalMesh>* FacialMesh = FacialCharacterMeshes.Find(Participant.CharacterId);
    const TObjectPtr<USkeletalMesh>* NeutralMesh = CharacterMeshes.Find(Participant.CharacterId);
    const TObjectPtr<USkeletalMesh>* AdmittedMesh = FacialMesh && FacialMesh->Get()
        ? FacialMesh : NeutralMesh;
    bUsingFacialPerformance = FacialMesh && FacialMesh->Get();
    bUsingSkeletalPresentation = AdmittedMesh && AdmittedMesh->Get();
    CharacterMesh->SetSkeletalMeshAsset(bUsingSkeletalPresentation ? AdmittedMesh->Get() : nullptr);
    CharacterMesh->SetRelativeScale3D(FVector(bUsingFacialPerformance
        ? FShiCouncilFacialPerformanceModel::PresentationScale()
        : FShiCouncilCharacterPresentationModel::PresentationScale()));
    CharacterMesh->SetVisibility(bUsingSkeletalPresentation, true);
    CharacterMesh->SetHiddenInGame(!bUsingSkeletalPresentation, true);
    Body->SetVisibility(!bUsingSkeletalPresentation, true);
    Head->SetVisibility(!bUsingSkeletalPresentation, true);
    Mantle->SetVisibility(!bUsingSkeletalPresentation, true);
    Body->SetHiddenInGame(bUsingSkeletalPresentation, true);
    Head->SetHiddenInGame(bUsingSkeletalPresentation, true);
    Mantle->SetHiddenInGame(bUsingSkeletalPresentation, true);
    if (bUsingFacialPerformance)
    {
        Tags.Add(FName(TEXT("ShiArtStatus:FacialPerformanceEngineeringBlockout")));
        Tags.Add(FName(TEXT("ShiFacialPerformance:SilentIntentCadence")));
        Tags.Add(FName(TEXT("ShiFraming:WideMediumOnly")));
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_FACIAL_RUNTIME_ADMITTED character=%s role=%s mesh=%s morph_controls=%d"),
            *Participant.CharacterId,
            Participant.bSpeaker ? TEXT("speaker") : TEXT("listener"),
            *AdmittedMesh->Get()->GetPathName(),
            FShiCouncilFacialPerformanceModel::MorphTargetCount());
    }
    else
    {
        Tags.Add(FName(bUsingSkeletalPresentation
            ? TEXT("ShiArtStatus:SkeletalProductionBlockout")
            : TEXT("ShiArtFallback:EnginePrimitive")));
    }

    ApplySkinLookdevFrame();

    if (bUsingSkeletalPresentation)
    {
        FShiCouncilPerformanceData Performance;
        FString PerformanceError;
        if (bWetRegisterInteractionReviewEnabled)
        {
            if (!ActivateWetRegisterInteraction(Participant, PerformanceError))
            {
                ClearFacialFrame();
                bUsingFacialPerformance = false;
                FacialElapsedSeconds = 0.f;
                CharacterMesh->Stop();
                CharacterMesh->SetAnimation(nullptr);
                CharacterMesh->SetForceRefPose(true);
                CharacterMesh->RefreshBoneTransforms();
                CharacterMesh->SetComponentTickEnabled(false);
                Tags.Add(FName(TEXT("ShiWetRegisterInteractionFallback:NeutralReferencePose")));
                UE_LOG(LogShiCouncilFigure, Error,
                    TEXT("Council wet-register interaction failed closed for %s: %s"),
                    *Participant.CharacterId,
                    PerformanceError.IsEmpty()
                        ? TEXT("interaction inventory is unavailable") : *PerformanceError);
            }
        }
        else if (FShiCouncilPerformancePresentationModel::ForParticipant(
                Participant.bSpeaker, Performance, PerformanceError))
        {
            const TObjectPtr<UAnimSequence>* AdmittedSequence = PerformanceClips.Find(Performance.RoleId);
            UAnimSequence* Sequence = AdmittedSequence ? AdmittedSequence->Get() : nullptr;
            USkeleton* MeshSkeleton = AdmittedMesh->Get()->GetSkeleton();
            if (Sequence && MeshSkeleton
                && FShiCouncilPerformancePresentationModel::ValidateSequence(
                    Performance, *Sequence, *MeshSkeleton, PerformanceError))
            {
                CharacterMesh->SetForceRefPose(false);
                CharacterMesh->PlayAnimation(Sequence, Performance.bLooping);
                const float DeterministicStartSeconds = Participant.bSpeaker
                    ? 0.f
                    : static_cast<float>(GetTypeHash(Participant.SlotId) % 120u) / 30.f;
                CharacterMesh->SetPosition(DeterministicStartSeconds, false);
                CharacterMesh->SetComponentTickEnabled(true);
                PerformanceRoleId = Performance.RoleId;
                bUsingPerformance = true;
                Tags.Add(FName(*FString::Printf(TEXT("ShiPerformance:%s"), *Performance.RoleId)));
                Tags.Add(FName(TEXT("ShiPerformanceStatus:SharedSkeletonBodyBlockout")));
            }
        }
        if (!bUsingPerformance && !bWetRegisterInteractionReviewEnabled)
        {
            CharacterMesh->Stop();
            CharacterMesh->SetAnimation(nullptr);
            CharacterMesh->SetForceRefPose(true);
            CharacterMesh->SetComponentTickEnabled(false);
            Tags.Add(FName(TEXT("ShiPerformanceFallback:ReferencePose")));
            UE_LOG(LogShiCouncilFigure, Warning,
                TEXT("Council character %s uses the reference-pose fallback: %s"),
                *Participant.CharacterId,
                PerformanceError.IsEmpty() ? TEXT("performance clip is unavailable") : *PerformanceError);
        }
    }

    if (bUsingFacialPerformance)
    {
        ApplyFacialFrame();
        if (bUsingWetRegisterInteraction)
        {
            CharacterMesh->RefreshBoneTransforms();
        }
    }

    const FLinearColor HeadColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.60f, .46f, .32f), .18f);
    const FLinearColor MantleColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.04f, .05f, .05f), .34f);
    if (BodyMaterial) BodyMaterial->SetVectorParameterValue(FName(TEXT("Color")), Participant.Color);
    if (HeadMaterial) HeadMaterial->SetVectorParameterValue(FName(TEXT("Color")), HeadColor);
    if (MantleMaterial) MantleMaterial->SetVectorParameterValue(FName(TEXT("Color")), MantleColor);
    ApplyStencil(*Body, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Head, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Mantle, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*CharacterMesh, Participant.StencilValue, Participant.bSpeaker);
    RefreshActorTick();
}

void AShiCouncilFigure::ApplySkinLookdevFrame()
{
    if (!bSkinLookdevReviewEnabled) return;

    FShiCouncilSkinLookdevContractData Contract;
    FString Error;
    if (!FShiCouncilSkinLookdevModel::BuildContract(Contract, Error))
    {
        CharacterMesh->EmptyOverrideMaterials();
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council skin lookdev contract failed closed: %s"), *Error);
        return;
    }
    if (CharacterId != FShiCouncilSkinLookdevModel::CanonicalTargetCharacterId()) return;

    const bool bExactBaselineMesh = CharacterMesh->GetSkeletalMeshAsset()
        && CharacterMesh->GetSkeletalMeshAsset()->GetPathName() == Contract.Baseline.MeshPath;
    int32 SkinMaterialIndex = INDEX_NONE;
    int32 SkinMaterialSlotCount = 0;
    UMaterialInterface* MeshDefaultMaterial = nullptr;
    if (const USkeletalMesh* SkeletalMesh = CharacterMesh->GetSkeletalMeshAsset())
    {
        const TArray<FSkeletalMaterial>& Materials = SkeletalMesh->GetMaterials();
        for (int32 MaterialIndex = 0; MaterialIndex < Materials.Num(); ++MaterialIndex)
        {
            if (Materials[MaterialIndex].MaterialSlotName != Contract.Material.MaterialSlot) continue;
            ++SkinMaterialSlotCount;
            SkinMaterialIndex = MaterialIndex;
            MeshDefaultMaterial = Materials[MaterialIndex].MaterialInterface;
        }
    }
    if (!bExactBaselineMesh || SkinMaterialSlotCount != 1 || SkinMaterialIndex == INDEX_NONE)
    {
        UseSkinLookdevPrimitiveFallback();
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council skin lookdev rejected an unsafe Chen mesh or SkinClay slot and used the primitive fallback."));
        return;
    }
    SkinLookdevMaterialIndex = SkinMaterialIndex;
    const bool bExactBaselineMaterial = MeshDefaultMaterial
        && MeshDefaultMaterial->GetPathName() == Contract.Baseline.MaterialPath;
    if (!bExactBaselineMaterial)
    {
        if (!RestoreSkinLookdevBaseline())
        {
            UseSkinLookdevPrimitiveFallback();
            UE_LOG(LogShiCouncilFigure, Error,
                TEXT("Council skin lookdev could not restore the accepted SkinClay fallback and hid the skeletal presentation."));
            return;
        }
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council skin lookdev rejected a drifted default binding and restored the accepted SkinClay fallback."));
        return;
    }
    const bool bRuntimeInventoryReady = bSkinLookdevInventoryReady && SkinLookdevMaterial
        && SkinLookdevMaterial->GetPathName() == Contract.Material.MaterialPath
        && bUsingFacialPerformance && bExactBaselineMesh && bExactBaselineMaterial;

    FShiCouncilSkinLookdevFrameRequest Request;
    Request.CharacterId = CharacterId;
    Request.ReviewModeId = bSkinLookdevReviewEnabled
        ? FShiCouncilSkinLookdevModel::CanonicalReviewModeId() : FString();
    Request.bDevelopmentReviewAuthorized = bSkinLookdevReviewEnabled;
    Request.bLookdevInventoryReady = bRuntimeInventoryReady;
    Request.bReducedMotion = bReducedMotion;
    FShiCouncilSkinLookdevFrameData Frame;
    if (!FShiCouncilSkinLookdevModel::EvaluateFrame(Request, Frame, Error))
    {
        CharacterMesh->EmptyOverrideMaterials();
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council skin lookdev routing failed closed for %s: %s"), *CharacterId, *Error);
        return;
    }
    if (!Frame.bLookdevActive) return;

    CharacterMesh->SetMaterial(SkinMaterialIndex, SkinLookdevMaterial);
    if (CharacterMesh->GetMaterial(SkinMaterialIndex) != SkinLookdevMaterial)
    {
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council skin lookdev override failed closed for %s."), *CharacterId);
        if (!RestoreSkinLookdevBaseline()) UseSkinLookdevPrimitiveFallback();
        return;
    }
    bUsingSkinLookdev = true;
    Tags.Add(FName(TEXT("ShiArtStatus:SkinMaterialLookdevCandidate")));
    Tags.Add(FName(TEXT("ShiSkinLookdev:ChenShengV1")));
    Tags.Add(FName(TEXT("ShiFraming:MaterialQAOnly")));
    Tags.Add(FName(TEXT("ShiHistoricalStatus:DramaticCastingNotLikeness")));
    Tags.Add(FName(TEXT("ShiHumanReview:Open")));
    if (!bLoggedSkinLookdevAdmission)
    {
        bLoggedSkinLookdevAdmission = true;
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_SKIN_LOOKDEV_RUNTIME_ADMITTED character=%s role=%s mesh=%s slot=%s material=%s route=%s textures=%d parameters=BaseColor2K,MaterialMasks2K,DetailNormal1K metallic=0.0000 specular=0.2500 profile_opacity_source=MaterialMasks2K.B profile_opacity=0.3490 effective_mfp=0.9336 subsurface_color=unconnected motion=%s final_skin=false close_camera=false human_review=false"),
            *CharacterId, bParticipantSpeaker ? TEXT("speaker") : TEXT("listener"),
            *Contract.Baseline.MeshPath, *Contract.Material.MaterialSlot.ToString(),
            *Frame.ActiveMaterialPath, *Frame.RouteId,
            FShiCouncilSkinLookdevModel::TextureInventoryCount(),
            bReducedMotion ? TEXT("reduced") : TEXT("normal"));
    }
}

bool AShiCouncilFigure::RestoreSkinLookdevBaseline()
{
    ClearSkinLookdevPresentationState();
    if (!SkinLookdevBaselineMaterial || SkinLookdevMaterialIndex == INDEX_NONE) return false;
    CharacterMesh->SetMaterial(SkinLookdevMaterialIndex, SkinLookdevBaselineMaterial);
    return CharacterMesh->GetMaterial(SkinLookdevMaterialIndex) == SkinLookdevBaselineMaterial;
}

void AShiCouncilFigure::ClearSkinLookdevPresentationState()
{
    bUsingSkinLookdev = false;
    Tags.Remove(FName(TEXT("ShiArtStatus:SkinMaterialLookdevCandidate")));
    Tags.Remove(FName(TEXT("ShiSkinLookdev:ChenShengV1")));
    Tags.Remove(FName(TEXT("ShiFraming:MaterialQAOnly")));
    Tags.Remove(FName(TEXT("ShiHistoricalStatus:DramaticCastingNotLikeness")));
    Tags.Remove(FName(TEXT("ShiHumanReview:Open")));
}

void AShiCouncilFigure::UseSkinLookdevPrimitiveFallback()
{
    ClearSkinLookdevPresentationState();
    CharacterMesh->Stop();
    CharacterMesh->SetAnimation(nullptr);
    CharacterMesh->SetComponentTickEnabled(false);
    CharacterMesh->EmptyOverrideMaterials();
    CharacterMesh->SetVisibility(false, true);
    CharacterMesh->SetHiddenInGame(true, true);
    Body->SetVisibility(true, true);
    Head->SetVisibility(true, true);
    Mantle->SetVisibility(true, true);
    Body->SetHiddenInGame(false, true);
    Head->SetHiddenInGame(false, true);
    Mantle->SetHiddenInGame(false, true);
    bUsingSkeletalPresentation = false;
    bUsingPerformance = false;
    bUsingFacialPerformance = false;
    PerformanceRoleId.Empty();
    SkinLookdevMaterialIndex = INDEX_NONE;
    Tags.Remove(FName(TEXT("ShiArtStatus:FacialPerformanceEngineeringBlockout")));
    Tags.Remove(FName(TEXT("ShiFacialPerformance:SilentIntentCadence")));
    Tags.Remove(FName(TEXT("ShiFraming:WideMediumOnly")));
    Tags.AddUnique(FName(TEXT("ShiArtFallback:EnginePrimitive")));
    RefreshActorTick();
}

void AShiCouncilFigure::SetReducedMotion(bool bValue)
{
    if (bReducedMotion == bValue) return;
    bReducedMotion = bValue;
    FacialElapsedSeconds = 0.f;
    WetRegisterElapsedSeconds = 0.f;
    if (bUsingWetRegisterInteraction) ApplyWetRegisterInteractionFrame();
    if (bUsingFacialPerformance) ApplyFacialFrame();
    if (bUsingWetRegisterInteraction && bUsingFacialPerformance)
    {
        CharacterMesh->RefreshBoneTransforms();
    }
    RefreshActorTick();
}

void AShiCouncilFigure::SetReviewVisible(bool bVisible)
{
    bReviewVisible = bVisible;
    SetActorHiddenInGame(!bVisible);
    SetActorEnableCollision(false);
    CharacterMesh->SetVisibility(bVisible && bUsingSkeletalPresentation, true);
    CharacterMesh->SetHiddenInGame(!bVisible || !bUsingSkeletalPresentation, true);
    Body->SetVisibility(bVisible && !bUsingSkeletalPresentation, true);
    Head->SetVisibility(bVisible && !bUsingSkeletalPresentation, true);
    Mantle->SetVisibility(bVisible && !bUsingSkeletalPresentation, true);
    Body->SetHiddenInGame(!bVisible || bUsingSkeletalPresentation, true);
    Head->SetHiddenInGame(!bVisible || bUsingSkeletalPresentation, true);
    Mantle->SetHiddenInGame(!bVisible || bUsingSkeletalPresentation, true);
    WetRegisterProp->SetVisibility(bVisible && bUsingWetRegisterInteraction, true);
    WetRegisterProp->SetHiddenInGame(!bVisible || !bUsingWetRegisterInteraction, true);
    CharacterMesh->bPauseAnims = !bVisible;
    CharacterMesh->SetComponentTickEnabled(bVisible && bUsingSkeletalPresentation
        && bUsingPerformance && !bUsingWetRegisterInteraction);
    RefreshActorTick();
}

void AShiCouncilFigure::ApplyFacialFrame()
{
    if (!bUsingFacialPerformance || !CharacterMesh->GetSkeletalMeshAsset()) return;
    FShiCouncilFacialFrameData Frame;
    FString Error;
    if (!FShiCouncilFacialPerformanceModel::Evaluate(
            bParticipantSpeaker, FacialElapsedSeconds, bReducedMotion, Frame, Error))
    {
        ClearFacialFrame();
        if (bUsingSkinLookdev && !RestoreSkinLookdevBaseline())
        {
            UseSkinLookdevPrimitiveFallback();
        }
        bUsingFacialPerformance = false;
        RefreshActorTick();
        UE_LOG(LogShiCouncilFigure, Error,
            TEXT("Council facial cadence failed closed for %s: %s"), *CharacterId, *Error);
        return;
    }
    for (const FShiCouncilFacialMorphWeight& Weight : Frame.MorphWeights)
    {
        CharacterMesh->SetMorphTarget(Weight.MorphTarget, Weight.Weight, false);
    }
    float EyeOutLeft = 0.f;
    float EyeInRight = 0.f;
    if (!bLoggedMorphSectionExercise
        && Frame.StateId == TEXT("object-glance")
        && FShiCouncilFacialPerformanceModel::TryGetWeight(
            Frame, FName(TEXT("eyeLookOutLeft")), EyeOutLeft)
        && FShiCouncilFacialPerformanceModel::TryGetWeight(
            Frame, FName(TEXT("eyeLookInRight")), EyeInRight)
        && EyeOutLeft > KINDA_SMALL_NUMBER && EyeInRight > KINDA_SMALL_NUMBER)
    {
        bLoggedMorphSectionExercise = true;
        if (bUsingSkinLookdev)
        {
            UE_LOG(LogShiCouncilFigure, Display,
                TEXT("SHI_COUNCIL_SKIN_LOOKDEV_MORPH_SECTIONS_EXERCISED character=%s role=%s state=object-glance slot=M_SHI_Character_SkinClay material=%s eye=EyeBrown motion=%s alpha=%.4f"),
                *CharacterId, bParticipantSpeaker ? TEXT("speaker") : TEXT("listener"),
                *FShiCouncilSkinLookdevModel::CanonicalLookdevMaterialPath(),
                bReducedMotion ? TEXT("reduced") : TEXT("normal"), Frame.TargetAlpha);
        }
        else
        {
            UE_LOG(LogShiCouncilFigure, Display,
                TEXT("SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED character=%s role=%s state=object-glance skin=SkinClay eye=EyeBrown alpha=%.4f"),
                *CharacterId,
                bParticipantSpeaker ? TEXT("speaker") : TEXT("listener"),
                Frame.TargetAlpha);
        }
    }
}

void AShiCouncilFigure::ClearFacialFrame()
{
    CharacterMesh->ClearMorphTargets();
}

void AShiCouncilFigure::RefreshActorTick()
{
    const bool bReducedPassComplete = bReducedMotion
        && FacialElapsedSeconds >= FShiCouncilFacialPerformanceModel::CycleDurationSeconds()
            - 2.f * KINDA_SMALL_NUMBER;
    const bool bWetRegisterPassComplete = bUsingWetRegisterInteraction
        && WetRegisterElapsedSeconds
            >= FShiCouncilWetRegisterInteractionModel::ExpectedDurationSeconds()
                - KINDA_SMALL_NUMBER;
    const bool bTickFacial = bUsingFacialPerformance
        && (bUsingWetRegisterInteraction ? !bWetRegisterPassComplete : !bReducedPassComplete);
    const bool bTickWetRegister = bUsingWetRegisterInteraction
        && !bWetRegisterPassComplete;
    SetActorTickEnabled(bReviewVisible && (bTickFacial || bTickWetRegister));
}
