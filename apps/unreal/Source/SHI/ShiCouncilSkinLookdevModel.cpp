#include "ShiCouncilSkinLookdevModel.h"

namespace
{
    const FString AssetId(TEXT("shi-daze-council-skin-lookdev-v1"));
    const FString TargetCharacterId(TEXT("chen-sheng"));
    const FString ReviewModeId(TEXT("-ShiCouncilSkinLookdevReview"));
    const FString IsolatedRootPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1"));
    const FString BaselineMaterialPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/M_SHI_Character_SkinClay.M_SHI_Character_SkinClay"));
    const FString BaselineMeshPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.SKM_SHI_DazeCouncil_ChenSheng_Facial_01"));
    const FString SharedSkeletonPath(TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton"));
    const FString SubsurfaceProfilePath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1/SP_SHI_ChenSheng_SkinLookdevV1.SP_SHI_ChenSheng_SkinLookdevV1"));
    const FString LookdevMaterialPath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1/M_SHI_ChenSheng_SkinLookdevV1.M_SHI_ChenSheng_SkinLookdevV1"));
    const FString BaseColorTexturePath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_BaseColor_2K.T_SHI_ChenSheng_Skin_BaseColor_2K"));
    const FString MasksTexturePath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_Masks_2K.T_SHI_ChenSheng_Skin_Masks_2K"));
    const FString DetailNormalTexturePath(TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1/T_SHI_ChenSheng_Skin_DetailNormal_1K.T_SHI_ChenSheng_Skin_DetailNormal_1K"));
    const FString HistoricalDisclosure(TEXT("CHEN SHENG SKIN LOOKDEV V1 · DRAMATIC CASTING, NOT A HISTORICAL LIKENESS OR COMPLEXION CLAIM · NOT HUMAN-APPROVED FINAL ART OR CLOSE-CAMERA AUTHORITY"));
    const FString LookdevRouteId(TEXT("chen-sheng-skin-lookdev-v1"));
    const FString BaselineRouteId(TEXT("accepted-skin-clay-baseline"));
    const TArray<FString> CharacterIds = {
        TEXT("keeper"), TEXT("chen-sheng"), TEXT("wu-guang"), TEXT("yu-mu"),
        TEXT("qin-courier")
    };

    FShiCouncilSkinLookdevAssetData MakeAsset(
        const TCHAR* InAssetId, const FString& InPath, const TCHAR* InClass)
    {
        FShiCouncilSkinLookdevAssetData Asset;
        Asset.AssetId = InAssetId;
        Asset.AssetPath = InPath;
        Asset.AssetClass = InClass;
        return Asset;
    }

    FShiCouncilSkinLookdevTextureData MakeTexture(const TCHAR* InTextureId,
        const FString& InPath, const TCHAR* InMaterialParameter,
        const TCHAR* InSemantic, const TCHAR* InChannels,
        const TCHAR* InSourceEncoding, const TCHAR* InEngineCompression,
        const TCHAR* InAddressMode, int32 InSize, bool bInSRGB,
        bool bInNonTilingUv0, bool bInSeamless, bool bInDirectXNormal,
        bool bInFlipGreenChannel,
        bool bInDerivedFromExternalCanonicalHeightSource)
    {
        FShiCouncilSkinLookdevTextureData Texture;
        Texture.TextureId = InTextureId;
        Texture.AssetPath = InPath;
        Texture.MaterialParameter = FName(InMaterialParameter);
        Texture.Semantic = InSemantic;
        Texture.ChannelContract = InChannels;
        Texture.SourceEncoding = InSourceEncoding;
        Texture.EngineCompression = InEngineCompression;
        Texture.AddressMode = InAddressMode;
        Texture.Width = InSize;
        Texture.Height = InSize;
        Texture.bSRGB = bInSRGB;
        Texture.bNonTilingUv0 = bInNonTilingUv0;
        Texture.bSeamless = bInSeamless;
        Texture.bDirectXNormal = bInDirectXNormal;
        Texture.bFlipGreenChannel = bInFlipGreenChannel;
        Texture.bDerivedFromExternalCanonicalHeightSource =
            bInDerivedFromExternalCanonicalHeightSource;
        return Texture;
    }

    FShiCouncilSkinLookdevContractData MakeExpectedContract()
    {
        FShiCouncilSkinLookdevContractData Contract;
        Contract.AssetId = AssetId;
        Contract.TargetCharacterId = TargetCharacterId;
        Contract.ReviewModeId = ReviewModeId;
        Contract.IsolatedRootPath = IsolatedRootPath;
        Contract.HistoricalDisclosure = HistoricalDisclosure;
        Contract.AssetInventory = {
            MakeAsset(TEXT("subsurface-profile"), SubsurfaceProfilePath,
                TEXT("SubsurfaceProfile")),
            MakeAsset(TEXT("skin-material"), LookdevMaterialPath, TEXT("Material")),
            MakeAsset(TEXT("base-color-2k"), BaseColorTexturePath, TEXT("Texture2D")),
            MakeAsset(TEXT("material-masks-2k"), MasksTexturePath, TEXT("Texture2D")),
            MakeAsset(TEXT("detail-normal-1k"), DetailNormalTexturePath, TEXT("Texture2D"))
        };
        Contract.TextureInventory = {
            MakeTexture(TEXT("base-color-2k"), BaseColorTexturePath,
                TEXT("BaseColor2K"),
                TEXT("whole-body base color on UV0"),
                TEXT("RGB=reviewed base color; no alpha channel"), TEXT("RGB8 sRGB"),
                TEXT("BC7"), TEXT("Clamp"),
                FShiCouncilSkinLookdevModel::BaseTextureSize(), true,
                true, false, false, false, false),
            MakeTexture(TEXT("material-masks-2k"), MasksTexturePath,
                TEXT("MaterialMasks2K"),
                TEXT("whole-body packed material response on UV0"),
                TEXT("R=neutral AO; G=roughness; B=Subsurface Profile opacity/radius scale 89/255 via MP_OPACITY only; A=unused opaque"),
                TEXT("RGBA8 linear"), TEXT("Masks"), TEXT("Clamp"),
                FShiCouncilSkinLookdevModel::BaseTextureSize(), false,
                true, false, false, false, false),
            MakeTexture(TEXT("detail-normal-1k"), DetailNormalTexturePath,
                TEXT("DetailNormal1K"),
                TEXT("repeating skin microdetail normal"),
                TEXT("RGB=DirectX/Unreal tangent-space detail normal; R/G authoritative; Z reconstructable; green preserved"),
                TEXT("RGB8 linear derived from external 16-bit linear height"),
                TEXT("BC5"), TEXT("Wrap"),
                FShiCouncilSkinLookdevModel::DetailTextureSize(), false,
                false, true, true, false, true)
        };

        Contract.DetailHeightSource.SourceId = TEXT("canonical-detail-height-1k");
        Contract.DetailHeightSource.SourceEncoding = TEXT("grayscale16 linear");
        Contract.DetailHeightSource.Width = FShiCouncilSkinLookdevModel::DetailTextureSize();
        Contract.DetailHeightSource.Height = FShiCouncilSkinLookdevModel::DetailTextureSize();
        Contract.DetailHeightSource.BitDepth = 16;
        Contract.DetailHeightSource.bLinear = true;
        Contract.DetailHeightSource.bSeamless = true;
        Contract.DetailHeightSource.bImportedIntoEngine = false;
        Contract.DetailHeightSource.bGeneratedImageDerived = false;

        Contract.Material.SubsurfaceProfilePath = SubsurfaceProfilePath;
        Contract.Material.MaterialPath = LookdevMaterialPath;
        Contract.Material.MaterialSlot = FName(TEXT("M_SHI_Character_SkinClay"));
        Contract.Material.MaterialDomain = TEXT("Surface");
        Contract.Material.BlendMode = TEXT("Opaque");
        Contract.Material.ShadingModel = TEXT("SubsurfaceProfile");
        Contract.Material.MetallicParameter = FName(TEXT("Metallic"));
        Contract.Material.SpecularParameter = FName(TEXT("Specular"));
        Contract.Material.SubsurfaceProfileOpacitySource = TEXT("MaterialMasks2K.B");
        Contract.Material.Metallic = 0.f;
        Contract.Material.Specular = FShiCouncilSkinLookdevModel::SpecularScalar();
        Contract.Material.MaximumSpecular =
            FShiCouncilSkinLookdevModel::MaximumSpecularScalar();
        Contract.Material.SubsurfaceProfileOpacity =
            FShiCouncilSkinLookdevModel::SubsurfaceProfileOpacityScalar();
        Contract.Material.MaximumSubsurfaceProfileOpacity =
            FShiCouncilSkinLookdevModel::MaximumSubsurfaceProfileOpacityScalar();
        Contract.Material.SubsurfaceProfileOpacityThresholdExclusive =
            FShiCouncilSkinLookdevModel::SubsurfaceProfileOpacityThresholdExclusive();
        Contract.Material.ProfileMeanFreePathDistance =
            FShiCouncilSkinLookdevModel::ProfileMeanFreePathDistance();
        Contract.Material.EffectiveMeanFreePathDistance =
            FShiCouncilSkinLookdevModel::EffectiveMeanFreePathDistance();
        Contract.Material.bSubsurfaceProfileAssigned = true;
        Contract.Material.bOpacityConnected = true;
        Contract.Material.bSubsurfaceColorConnected = false;
        Contract.Material.bTangentSpaceNormal = true;
        Contract.Material.bUsedWithSkeletalMesh = true;
        Contract.Material.bUsedWithMorphTargets = true;
        Contract.Material.bTwoSided = false;
        Contract.Material.bRuntimeRandomness = false;
        Contract.Material.bDynamicNetworkDependency = false;
        Contract.Material.bRuntimeParameterMutation = false;
        Contract.Material.bDefaultMaterialFallbackAllowed = false;
        Contract.Material.bCanonicalHeightSourceKeptOutsideEngine = true;

        Contract.Baseline.EvidenceFile =
            TEXT("docs/production/evidence/unreal-daze-council-facial-performance-import-status.json");
        Contract.Baseline.EvidenceSha256 =
            TEXT("5a4a8d1136ecf3200b844313470585c8c90fb45e8e719d20ca99e58d60db0655");
        Contract.Baseline.EvidenceBytes = 51449;
        Contract.Baseline.SourceFbxFile =
            TEXT("assets/3d/export/shi-daze-council-facial-performance-v1-chen-sheng.fbx");
        Contract.Baseline.SourceFbxSha256 =
            TEXT("febf45db1a7e2d1dfeea4c845b22207237e4a38c73b05733449585f768739688");
        Contract.Baseline.SourceFbxBytes = 2621036;
        Contract.Baseline.MeshPath = BaselineMeshPath;
        Contract.Baseline.MeshUassetSha256 =
            TEXT("fc07683b48b1b43f5f189396cbc229449b66c5607a3772d3e8933103a88cbcd1");
        Contract.Baseline.MeshUassetBytes = 4430335;
        Contract.Baseline.MaterialPath = BaselineMaterialPath;
        Contract.Baseline.MaterialUassetSha256 =
            TEXT("b7ec2a89a11a9b03127e622c90c1d58d0c7ee3c338d6e2925636893e5ee9d160");
        Contract.Baseline.MaterialUassetBytes = 5162;
        Contract.Baseline.SkeletonPath = SharedSkeletonPath;
        Contract.Baseline.SkeletonUassetSha256 =
            TEXT("b0fd0004826603eb3af8f8f8bb261ce87c5ef46da0347b5003fc04e89cd807f1");
        Contract.Baseline.SkeletonUassetBytes = 12278;
        Contract.Baseline.SkeletonReferencePoseSha256 =
            TEXT("339840849171114b7a814163acde2c0c5331043c477e7e4171e1bd5f2b2c704d");
        Contract.Baseline.BodyUv0Sha256 =
            TEXT("f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6");

        Contract.bReviewOnly = true;
        Contract.bChenOnly = true;
        Contract.bBaselineFallbackRequired = true;
        Contract.bDeterministic = true;
        Contract.bStandardMotionSupported = true;
        Contract.bReducedMotionSupported = true;
        return Contract;
    }

    bool AssetMatches(const FShiCouncilSkinLookdevAssetData& Actual,
        const FShiCouncilSkinLookdevAssetData& Expected)
    {
        return Actual.AssetId == Expected.AssetId
            && Actual.AssetPath == Expected.AssetPath
            && Actual.AssetClass == Expected.AssetClass;
    }

    bool TextureMatches(const FShiCouncilSkinLookdevTextureData& Actual,
        const FShiCouncilSkinLookdevTextureData& Expected)
    {
        return Actual.TextureId == Expected.TextureId
            && Actual.AssetPath == Expected.AssetPath
            && Actual.MaterialParameter == Expected.MaterialParameter
            && Actual.Semantic == Expected.Semantic
            && Actual.ChannelContract == Expected.ChannelContract
            && Actual.SourceEncoding == Expected.SourceEncoding
            && Actual.EngineCompression == Expected.EngineCompression
            && Actual.AddressMode == Expected.AddressMode
            && Actual.Width == Expected.Width && Actual.Height == Expected.Height
            && Actual.bSRGB == Expected.bSRGB
            && Actual.bNonTilingUv0 == Expected.bNonTilingUv0
            && Actual.bSeamless == Expected.bSeamless
            && Actual.bDirectXNormal == Expected.bDirectXNormal
            && Actual.bFlipGreenChannel == Expected.bFlipGreenChannel
            && Actual.bDerivedFromExternalCanonicalHeightSource
                == Expected.bDerivedFromExternalCanonicalHeightSource;
    }

    bool AuthoringSourceMatches(const FShiCouncilSkinLookdevAuthoringSourceData& Actual,
        const FShiCouncilSkinLookdevAuthoringSourceData& Expected)
    {
        return Actual.SourceId == Expected.SourceId
            && Actual.SourceEncoding == Expected.SourceEncoding
            && Actual.Width == Expected.Width && Actual.Height == Expected.Height
            && Actual.BitDepth == Expected.BitDepth
            && Actual.bLinear == Expected.bLinear
            && Actual.bSeamless == Expected.bSeamless
            && Actual.bImportedIntoEngine == Expected.bImportedIntoEngine
            && Actual.bGeneratedImageDerived == Expected.bGeneratedImageDerived;
    }

    bool MaterialMatches(const FShiCouncilSkinLookdevMaterialData& Actual,
        const FShiCouncilSkinLookdevMaterialData& Expected)
    {
        return Actual.SubsurfaceProfilePath == Expected.SubsurfaceProfilePath
            && Actual.MaterialPath == Expected.MaterialPath
            && Actual.MaterialSlot == Expected.MaterialSlot
            && Actual.MaterialDomain == Expected.MaterialDomain
            && Actual.BlendMode == Expected.BlendMode
            && Actual.ShadingModel == Expected.ShadingModel
            && Actual.MetallicParameter == Expected.MetallicParameter
            && Actual.SpecularParameter == Expected.SpecularParameter
            && Actual.SubsurfaceProfileOpacitySource
                == Expected.SubsurfaceProfileOpacitySource
            && Actual.Metallic == Expected.Metallic
            && Actual.Specular == Expected.Specular
            && Actual.MaximumSpecular == Expected.MaximumSpecular
            && Actual.SubsurfaceProfileOpacity == Expected.SubsurfaceProfileOpacity
            && Actual.MaximumSubsurfaceProfileOpacity
                == Expected.MaximumSubsurfaceProfileOpacity
            && Actual.SubsurfaceProfileOpacityThresholdExclusive
                == Expected.SubsurfaceProfileOpacityThresholdExclusive
            && Actual.ProfileMeanFreePathDistance
                == Expected.ProfileMeanFreePathDistance
            && Actual.EffectiveMeanFreePathDistance
                == Expected.EffectiveMeanFreePathDistance
            && Actual.bSubsurfaceProfileAssigned == Expected.bSubsurfaceProfileAssigned
            && Actual.bOpacityConnected == Expected.bOpacityConnected
            && Actual.bSubsurfaceColorConnected == Expected.bSubsurfaceColorConnected
            && Actual.bTangentSpaceNormal == Expected.bTangentSpaceNormal
            && Actual.bUsedWithSkeletalMesh == Expected.bUsedWithSkeletalMesh
            && Actual.bUsedWithMorphTargets == Expected.bUsedWithMorphTargets
            && Actual.bTwoSided == Expected.bTwoSided
            && Actual.bRuntimeRandomness == Expected.bRuntimeRandomness
            && Actual.bDynamicNetworkDependency == Expected.bDynamicNetworkDependency
            && Actual.bRuntimeParameterMutation == Expected.bRuntimeParameterMutation
            && Actual.bDefaultMaterialFallbackAllowed
                == Expected.bDefaultMaterialFallbackAllowed
            && Actual.bCanonicalHeightSourceKeptOutsideEngine
                == Expected.bCanonicalHeightSourceKeptOutsideEngine;
    }

    bool BaselineMatches(const FShiCouncilSkinLookdevBaselineReceiptData& Actual,
        const FShiCouncilSkinLookdevBaselineReceiptData& Expected)
    {
        return Actual.EvidenceFile == Expected.EvidenceFile
            && Actual.EvidenceSha256 == Expected.EvidenceSha256
            && Actual.EvidenceBytes == Expected.EvidenceBytes
            && Actual.SourceFbxFile == Expected.SourceFbxFile
            && Actual.SourceFbxSha256 == Expected.SourceFbxSha256
            && Actual.SourceFbxBytes == Expected.SourceFbxBytes
            && Actual.MeshPath == Expected.MeshPath
            && Actual.MeshUassetSha256 == Expected.MeshUassetSha256
            && Actual.MeshUassetBytes == Expected.MeshUassetBytes
            && Actual.MaterialPath == Expected.MaterialPath
            && Actual.MaterialUassetSha256 == Expected.MaterialUassetSha256
            && Actual.MaterialUassetBytes == Expected.MaterialUassetBytes
            && Actual.SkeletonPath == Expected.SkeletonPath
            && Actual.SkeletonUassetSha256 == Expected.SkeletonUassetSha256
            && Actual.SkeletonUassetBytes == Expected.SkeletonUassetBytes
            && Actual.SkeletonReferencePoseSha256
                == Expected.SkeletonReferencePoseSha256
            && Actual.BodyUv0Sha256 == Expected.BodyUv0Sha256;
    }
}

const FString& FShiCouncilSkinLookdevModel::CanonicalAssetId()
{
    return AssetId;
}

const FString& FShiCouncilSkinLookdevModel::CanonicalTargetCharacterId()
{
    return TargetCharacterId;
}

const FString& FShiCouncilSkinLookdevModel::CanonicalReviewModeId()
{
    return ReviewModeId;
}

const FString& FShiCouncilSkinLookdevModel::CanonicalIsolatedRootPath()
{
    return IsolatedRootPath;
}

const FString& FShiCouncilSkinLookdevModel::CanonicalBaselineMaterialPath()
{
    return BaselineMaterialPath;
}

const FString& FShiCouncilSkinLookdevModel::CanonicalLookdevMaterialPath()
{
    return LookdevMaterialPath;
}

const TArray<FString>& FShiCouncilSkinLookdevModel::CanonicalCharacterIds()
{
    return CharacterIds;
}

bool FShiCouncilSkinLookdevModel::BuildContract(
    FShiCouncilSkinLookdevContractData& OutContract, FString& OutError)
{
    FShiCouncilSkinLookdevContractData Candidate = MakeExpectedContract();
    if (!ValidateContract(Candidate, OutError)) return false;
    OutContract = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilSkinLookdevModel::ValidateContract(
    const FShiCouncilSkinLookdevContractData& Contract, FString& OutError)
{
    const FShiCouncilSkinLookdevContractData Expected = MakeExpectedContract();
    if (Contract.AssetId != Expected.AssetId
        || Contract.TargetCharacterId != Expected.TargetCharacterId
        || Contract.ReviewModeId != Expected.ReviewModeId
        || Contract.IsolatedRootPath != Expected.IsolatedRootPath
        || Contract.HistoricalDisclosure != Expected.HistoricalDisclosure)
    {
        OutError = TEXT("Council skin lookdev identity, gate, isolated root or disclosure drifted.");
        return false;
    }
    if (Contract.AssetInventory.Num() != AssetInventoryCount()
        || Contract.AssetInventory.Num() != Expected.AssetInventory.Num())
    {
        OutError = TEXT("Council skin lookdev engine inventory must contain exactly five isolated assets.");
        return false;
    }
    for (int32 Index = 0; Index < Contract.AssetInventory.Num(); ++Index)
    {
        if (!AssetMatches(Contract.AssetInventory[Index], Expected.AssetInventory[Index]))
        {
            OutError = TEXT("Council skin lookdev engine asset name, class, path or order drifted.");
            return false;
        }
    }
    if (Contract.TextureInventory.Num() != TextureInventoryCount()
        || Contract.TextureInventory.Num() != Expected.TextureInventory.Num())
    {
        OutError = TEXT("Council skin lookdev must contain exactly three admitted engine textures.");
        return false;
    }
    for (int32 Index = 0; Index < Contract.TextureInventory.Num(); ++Index)
    {
        if (!TextureMatches(Contract.TextureInventory[Index], Expected.TextureInventory[Index]))
        {
            OutError = TEXT("Council skin texture dimension, color space, encoding, channel or path drifted.");
            return false;
        }
    }
    if (!AuthoringSourceMatches(Contract.DetailHeightSource, Expected.DetailHeightSource)
        || !MaterialMatches(Contract.Material, Expected.Material))
    {
        OutError = TEXT("Council skin canonical height source or fail-closed material contract drifted.");
        return false;
    }
    if (Contract.Material.SubsurfaceProfileOpacity
            <= Contract.Material.SubsurfaceProfileOpacityThresholdExclusive
        || Contract.Material.SubsurfaceProfileOpacity
            > Contract.Material.MaximumSubsurfaceProfileOpacity
        || !FMath::IsNearlyEqual(Contract.Material.EffectiveMeanFreePathDistance,
            Contract.Material.ProfileMeanFreePathDistance
                * Contract.Material.SubsurfaceProfileOpacity)
        || !Contract.Material.bOpacityConnected
        || Contract.Material.bSubsurfaceColorConnected)
    {
        OutError = TEXT("Council skin Subsurface Profile opacity must remain above 0.10, bounded to 89/255, connected only through Opacity, and scaled to the admitted effective mean free path.");
        return false;
    }
    if (!BaselineMatches(Contract.Baseline, Expected.Baseline))
    {
        OutError = TEXT("Council skin accepted mesh, material, Skeleton, UV0 or evidence receipt drifted.");
        return false;
    }
    if (!Contract.bReviewOnly || !Contract.bChenOnly
        || !Contract.bBaselineFallbackRequired || !Contract.bDeterministic
        || !Contract.bStandardMotionSupported || !Contract.bReducedMotionSupported
        || Contract.bInteractionAuthority || Contract.bGameplayAuthority
        || Contract.bSaveAuthority || Contract.bReplicated || Contract.bIdentityAuthority
        || Contract.bHistoricalPortrait || Contract.bHistoricallyAttestedComplexion
        || Contract.bHumanHistoricalCulturalReviewApproved || Contract.bCloseCameraApproved
        || Contract.bFinalCharacterArt || Contract.bFinalSkin)
    {
        OutError = TEXT("Council skin lookdev cannot claim authority, historical truth, human approval, close camera or final art.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilSkinLookdevModel::EvaluateFrame(
    const FShiCouncilSkinLookdevFrameRequest& Request,
    FShiCouncilSkinLookdevFrameData& OutFrame, FString& OutError)
{
    if (!CharacterIds.Contains(Request.CharacterId))
    {
        OutError = FString::Printf(
            TEXT("Unknown Daze council identity for skin routing: %s."), *Request.CharacterId);
        return false;
    }
    if (!Request.ReviewModeId.IsEmpty() && Request.ReviewModeId != ReviewModeId)
    {
        OutError = TEXT("Council skin review mode token is not admitted.");
        return false;
    }
    const bool bExactReviewGate = Request.ReviewModeId == ReviewModeId;
    if (Request.bDevelopmentReviewAuthorized != bExactReviewGate)
    {
        OutError = TEXT("Council skin review mode requires the exact command-line token and explicit development authorization together.");
        return false;
    }

    FShiCouncilSkinLookdevFrameData Candidate;
    Candidate.CharacterId = Request.CharacterId;
    Candidate.ReviewModeId = Request.ReviewModeId;
    Candidate.bDevelopmentReviewAuthorized = Request.bDevelopmentReviewAuthorized;
    Candidate.bLookdevInventoryReady = Request.bLookdevInventoryReady;
    Candidate.bReducedMotion = Request.bReducedMotion;
    Candidate.bLookdevActive = Request.CharacterId == TargetCharacterId
        && bExactReviewGate && Request.bLookdevInventoryReady;
    Candidate.bUsingBaselineFallback = !Candidate.bLookdevActive;
    Candidate.RouteId = Candidate.bLookdevActive ? LookdevRouteId : BaselineRouteId;
    Candidate.ActiveMaterialPath = Candidate.bLookdevActive
        ? LookdevMaterialPath : BaselineMaterialPath;
    Candidate.BaselineFallbackMaterialPath = BaselineMaterialPath;
    Candidate.MaterialSlot = FName(TEXT("M_SHI_Character_SkinClay"));
    Candidate.bMotionIndependent = true;
    Candidate.bStandardMotionCompatible = true;
    Candidate.bReducedMotionCompatible = true;
    Candidate.bDeterministic = true;
    if (!ValidateFrame(Candidate, OutError)) return false;
    OutFrame = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilSkinLookdevModel::ValidateFrame(
    const FShiCouncilSkinLookdevFrameData& Frame, FString& OutError)
{
    if (!CharacterIds.Contains(Frame.CharacterId)
        || (!Frame.ReviewModeId.IsEmpty() && Frame.ReviewModeId != ReviewModeId)
        || Frame.bDevelopmentReviewAuthorized != (Frame.ReviewModeId == ReviewModeId))
    {
        OutError = TEXT("Council skin frame identity or exact review-mode gate is invalid.");
        return false;
    }
    const bool bExpectedLookdev = Frame.CharacterId == TargetCharacterId
        && Frame.ReviewModeId == ReviewModeId
        && Frame.bDevelopmentReviewAuthorized && Frame.bLookdevInventoryReady;
    const FString& ExpectedRoute = bExpectedLookdev ? LookdevRouteId : BaselineRouteId;
    const FString& ExpectedMaterial = bExpectedLookdev
        ? LookdevMaterialPath : BaselineMaterialPath;
    if (Frame.RouteId != ExpectedRoute || Frame.ActiveMaterialPath != ExpectedMaterial
        || Frame.BaselineFallbackMaterialPath != BaselineMaterialPath
        || Frame.MaterialSlot != FName(TEXT("M_SHI_Character_SkinClay"))
        || Frame.bLookdevActive != bExpectedLookdev
        || Frame.bUsingBaselineFallback == bExpectedLookdev)
    {
        OutError = TEXT("Council skin frame did not resolve exactly to Chen lookdev or the accepted SkinClay fallback.");
        return false;
    }
    if (!Frame.bMotionIndependent || !Frame.bStandardMotionCompatible
        || !Frame.bReducedMotionCompatible || !Frame.bDeterministic
        || Frame.bInteractionAuthority || Frame.bGameplayAuthority
        || Frame.bSaveAuthority || Frame.bReplicated || Frame.bIdentityAuthority
        || Frame.bHistoricalPortrait || Frame.bHistoricallyAttestedComplexion
        || Frame.bHumanHistoricalCulturalReviewApproved || Frame.bCloseCameraApproved
        || Frame.bFinalCharacterArt || Frame.bFinalSkin)
    {
        OutError = TEXT("Council skin frame cannot affect motion or claim authority, history, human approval, close camera or final art.");
        return false;
    }
    OutError.Empty();
    return true;
}
