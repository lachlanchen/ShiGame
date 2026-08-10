#include "ShiCouncilCharacterPresentationModel.h"

#include "Animation/Skeleton.h"
#include "Engine/SkeletalMesh.h"
#include "Rendering/SkeletalMeshRenderData.h"

namespace
{
    const TCHAR* SharedSkeletonPath = TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton");
    const TCHAR* Disclosure = TEXT("SKELETAL COUNCIL CHARACTER PRODUCTION BLOCKOUT · GENERIC PRACTICAL LAYERS · NOT AN EXACT 209 BCE COSTUME OR PORTRAIT RECONSTRUCTION");
    const TArray<FString> CharacterIds = {
        TEXT("keeper"), TEXT("chen-sheng"), TEXT("wu-guang"), TEXT("yu-mu"), TEXT("qin-courier")
    };
    const TArray<FName> BoneNames = {
        TEXT("Root"), TEXT("pelvis"), TEXT("spine_01"), TEXT("spine_02"), TEXT("spine_03"),
        TEXT("clavicle_l"), TEXT("upperarm_l"), TEXT("lowerarm_l"), TEXT("hand_l"),
        TEXT("index_01_l"), TEXT("index_02_l"), TEXT("index_03_l"),
        TEXT("middle_01_l"), TEXT("middle_02_l"), TEXT("middle_03_l"),
        TEXT("pinky_01_l"), TEXT("pinky_02_l"), TEXT("pinky_03_l"),
        TEXT("ring_01_l"), TEXT("ring_02_l"), TEXT("ring_03_l"),
        TEXT("thumb_01_l"), TEXT("thumb_02_l"), TEXT("thumb_03_l"),
        TEXT("clavicle_r"), TEXT("upperarm_r"), TEXT("lowerarm_r"), TEXT("hand_r"),
        TEXT("index_01_r"), TEXT("index_02_r"), TEXT("index_03_r"),
        TEXT("middle_01_r"), TEXT("middle_02_r"), TEXT("middle_03_r"),
        TEXT("pinky_01_r"), TEXT("pinky_02_r"), TEXT("pinky_03_r"),
        TEXT("ring_01_r"), TEXT("ring_02_r"), TEXT("ring_03_r"),
        TEXT("thumb_01_r"), TEXT("thumb_02_r"), TEXT("thumb_03_r"),
        TEXT("neck_01"), TEXT("head"), TEXT("thigh_l"), TEXT("calf_l"), TEXT("foot_l"),
        TEXT("ball_l"), TEXT("thigh_r"), TEXT("calf_r"), TEXT("foot_r"), TEXT("ball_r")
    };

    struct FContract
    {
        const TCHAR* CharacterId;
        const TCHAR* MeshName;
        const TCHAR* RoleSilhouette;
        float AssetLocalHeight;
        int32 Triangles;
        TArray<FName> Materials;
    };

    const TArray<FContract> Contracts = {
        {
            TEXT("keeper"), TEXT("SKM_SHI_DazeCouncil_Keeper_01"), TEXT("document-satchel · low-knot"),
            1.69651747f, 27668,
            {TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_Character_BindingClay"),
             TEXT("M_SHI_Character_RolePropClay"), TEXT("M_SHI_Character_HairClay"),
             TEXT("M_SHI_keeper_ClothOuter"), TEXT("M_SHI_keeper_ClothBase")}
        },
        {
            TEXT("chen-sheng"), TEXT("SKM_SHI_DazeCouncil_ChenSheng_01"), TEXT("long-weather-layer · tied-knot"),
            1.72401750f, 27664,
            {TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_Character_BindingClay"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_chen-sheng_ClothOuter"),
             TEXT("M_SHI_chen-sheng_ClothBase")}
        },
        {
            TEXT("wu-guang"), TEXT("SKM_SHI_DazeCouncil_WuGuang_01"), TEXT("asymmetric-wrap · cropped-cap"),
            1.69651747f, 27508,
            {TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_Character_BindingClay"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_wu-guang_ClothOuter"),
             TEXT("M_SHI_wu-guang_ClothBase")}
        },
        {
            TEXT("yu-mu"), TEXT("SKM_SHI_DazeCouncil_YuMu_01"), TEXT("work-apron · broad-low-knot"),
            1.69651747f, 27656,
            {TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_Character_BindingClay"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_yu-mu_ClothOuter"),
             TEXT("M_SHI_yu-mu_ClothBase")}
        },
        {
            TEXT("qin-courier"), TEXT("SKM_SHI_DazeCouncil_QinCourier_01"), TEXT("relay-satchel · high-tie"),
            1.74601746f, 27668,
            {TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_Character_BindingClay"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_qin-courier_ClothOuter"),
             TEXT("M_SHI_qin-courier_ClothBase"), TEXT("M_SHI_Character_RolePropClay")}
        },
    };

    const FContract* FindContract(const FString& CharacterId)
    {
        return Contracts.FindByPredicate([&](const FContract& Contract)
        {
            return CharacterId == Contract.CharacterId;
        });
    }
}

const TArray<FString>& FShiCouncilCharacterPresentationModel::CanonicalCharacterIds()
{
    return CharacterIds;
}

bool FShiCouncilCharacterPresentationModel::Build(const FString& CharacterId,
    FShiCouncilCharacterPresentationData& OutPresentation, FString& OutError)
{
    const FContract* Contract = FindContract(CharacterId);
    if (!Contract)
    {
        OutError = FString::Printf(TEXT("Unknown Daze council character identity: %s."), *CharacterId);
        return false;
    }
    FShiCouncilCharacterPresentationData Candidate;
    Candidate.CharacterId = CharacterId;
    Candidate.MeshPath = FString::Printf(TEXT("/Game/SHI/Art/Characters/DazeCouncil/%s.%s"),
        Contract->MeshName, Contract->MeshName);
    Candidate.SkeletonPath = SharedSkeletonPath;
    Candidate.RoleSilhouette = Contract->RoleSilhouette;
    Candidate.HistoricalDisclosure = Disclosure;
    Candidate.MaterialSlots = Contract->Materials;
    Candidate.ComponentScale = FVector(PresentationScale());
    Candidate.AssetLocalHeight = Contract->AssetLocalHeight;
    Candidate.SourceTriangles = Contract->Triangles;
    Candidate.BoneCount = BoneCount();
    if (!Validate(Candidate, OutError)) return false;
    OutPresentation = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilCharacterPresentationModel::Validate(
    const FShiCouncilCharacterPresentationData& Presentation, FString& OutError)
{
    const FContract* Contract = FindContract(Presentation.CharacterId);
    const FString ExpectedMeshPath = Contract
        ? FString::Printf(TEXT("/Game/SHI/Art/Characters/DazeCouncil/%s.%s"),
            Contract->MeshName, Contract->MeshName)
        : FString();
    if (!Contract || Presentation.MeshPath != ExpectedMeshPath
        || Presentation.SkeletonPath != SharedSkeletonPath
        || Presentation.RoleSilhouette != Contract->RoleSilhouette
        || Presentation.HistoricalDisclosure != Disclosure
        || Presentation.MaterialSlots != Contract->Materials)
    {
        OutError = TEXT("Council character identity, asset, skeleton, silhouette, material or disclosure drifted from admission.");
        return false;
    }
    const float PresentedHeight = Presentation.AssetLocalHeight * Presentation.ComponentScale.Z;
    if (!Presentation.ComponentScale.Equals(FVector(PresentationScale()), .0001f)
        || !FMath::IsNearlyEqual(Presentation.AssetLocalHeight, Contract->AssetLocalHeight, .00001f)
        || PresentedHeight < MinimumPresentedHeight() || PresentedHeight > MaximumPresentedHeight()
        || Presentation.SourceTriangles != Contract->Triangles
        || Presentation.SourceTriangles <= 0 || Presentation.SourceTriangles > MaximumTriangles()
        || Presentation.MaterialSlots.Num() < 4
        || Presentation.MaterialSlots.Num() > MaximumMaterialSlots()
        || Presentation.BoneCount != BoneCount())
    {
        OutError = TEXT("Council character scale, physical height, topology, materials or skeleton budget drifted from admission.");
        return false;
    }
    if (Presentation.bExactCostumeReconstruction || Presentation.bHistoricalPortrait
        || Presentation.bFinalArt || Presentation.bAnimated || Presentation.bCollisionEnabled
        || Presentation.bSkeletalMeshIsInteractionAuthority
        || !Presentation.bPrimitiveInteractionFallback || !Presentation.bWideAndMediumFramingOnly)
    {
        OutError = TEXT("Council skeletal figures are disclosed neutral blockouts; primitive click fallback and restrained framing remain mandatory.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilCharacterPresentationModel::ValidateMesh(
    const FShiCouncilCharacterPresentationData& Presentation, const USkeletalMesh& Mesh, FString& OutError)
{
    if (!Validate(Presentation, OutError)) return false;
    if (Mesh.GetPathName() != Presentation.MeshPath
        || !Mesh.GetSkeleton() || Mesh.GetSkeleton()->GetPathName() != Presentation.SkeletonPath)
    {
        OutError = TEXT("Council skeletal asset or shared Skeleton path does not match the exact character identity.");
        return false;
    }
    const FReferenceSkeleton& Reference = Mesh.GetRefSkeleton();
    if (Reference.GetRawBoneNum() != BoneNames.Num())
    {
        OutError = TEXT("Council skeletal asset does not contain the exact 53-bone reference hierarchy.");
        return false;
    }
    for (int32 Index = 0; Index < BoneNames.Num(); ++Index)
    {
        if (Reference.GetBoneName(Index) != BoneNames[Index]
            || (Index == 0 && Reference.GetParentIndex(Index) != INDEX_NONE))
        {
            OutError = TEXT("Council skeletal bone order, names or sole Root drifted from the admitted hierarchy.");
            return false;
        }
    }
    const int32 PelvisIndex = Reference.FindBoneIndex(FName(TEXT("pelvis")));
    if (PelvisIndex == INDEX_NONE || Reference.GetBoneName(Reference.GetParentIndex(PelvisIndex)) != FName(TEXT("Root")))
    {
        OutError = TEXT("Council skeleton no longer binds pelvis directly beneath its sole Root.");
        return false;
    }
    const TArray<FSkeletalMaterial>& Materials = Mesh.GetMaterials();
    if (Materials.Num() != Presentation.MaterialSlots.Num())
    {
        OutError = TEXT("Council skeletal material-slot count drifted from the character contract.");
        return false;
    }
    for (int32 Index = 0; Index < Materials.Num(); ++Index)
    {
        if (!Materials[Index].MaterialInterface
            || Materials[Index].MaterialSlotName != Presentation.MaterialSlots[Index])
        {
            OutError = TEXT("Council skeletal material identity or binding is incomplete.");
            return false;
        }
    }
    const float LocalHeight = Mesh.GetBounds().BoxExtent.Z * 2.f;
    if (!FMath::IsNearlyEqual(LocalHeight, Presentation.AssetLocalHeight, .003f)
        || LocalHeight * Presentation.ComponentScale.Z < MinimumPresentedHeight()
        || LocalHeight * Presentation.ComponentScale.Z > MaximumPresentedHeight())
    {
        OutError = TEXT("Council skeletal local bounds or presented physical height drifted from admission.");
        return false;
    }
    if (Mesh.GetPhysicsAsset() || !Mesh.GetMorphTargets().IsEmpty())
    {
        OutError = TEXT("Council skeletal neutral blockout unexpectedly acquired physics or morph-target authority.");
        return false;
    }
    const FSkeletalMeshRenderData* RenderData = Mesh.GetResourceForRendering();
    if (!RenderData || RenderData->LODRenderData.IsEmpty()
        || static_cast<int32>(RenderData->LODRenderData[0].GetTotalFaces()) != Presentation.SourceTriangles)
    {
        OutError = TEXT("Council skeletal LOD0 triangle receipt drifted from the validated source.");
        return false;
    }
    OutError.Empty();
    return true;
}
