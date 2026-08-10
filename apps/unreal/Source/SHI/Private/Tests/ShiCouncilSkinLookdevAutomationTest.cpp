#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "ShiCouncilSkinLookdevModel.h"

namespace
{
    bool FramesEqual(const FShiCouncilSkinLookdevFrameData& Left,
        const FShiCouncilSkinLookdevFrameData& Right)
    {
        return Left.CharacterId == Right.CharacterId
            && Left.ReviewModeId == Right.ReviewModeId
            && Left.RouteId == Right.RouteId
            && Left.ActiveMaterialPath == Right.ActiveMaterialPath
            && Left.BaselineFallbackMaterialPath == Right.BaselineFallbackMaterialPath
            && Left.MaterialSlot == Right.MaterialSlot
            && Left.bDevelopmentReviewAuthorized == Right.bDevelopmentReviewAuthorized
            && Left.bLookdevInventoryReady == Right.bLookdevInventoryReady
            && Left.bLookdevActive == Right.bLookdevActive
            && Left.bUsingBaselineFallback == Right.bUsingBaselineFallback
            && Left.bReducedMotion == Right.bReducedMotion
            && Left.bMotionIndependent == Right.bMotionIndependent
            && Left.bStandardMotionCompatible == Right.bStandardMotionCompatible
            && Left.bReducedMotionCompatible == Right.bReducedMotionCompatible
            && Left.bDeterministic == Right.bDeterministic
            && Left.bInteractionAuthority == Right.bInteractionAuthority
            && Left.bGameplayAuthority == Right.bGameplayAuthority
            && Left.bSaveAuthority == Right.bSaveAuthority
            && Left.bReplicated == Right.bReplicated
            && Left.bIdentityAuthority == Right.bIdentityAuthority
            && Left.bHistoricalPortrait == Right.bHistoricalPortrait
            && Left.bHistoricallyAttestedComplexion
                == Right.bHistoricallyAttestedComplexion
            && Left.bHumanHistoricalCulturalReviewApproved
                == Right.bHumanHistoricalCulturalReviewApproved
            && Left.bCloseCameraApproved == Right.bCloseCameraApproved
            && Left.bFinalCharacterArt == Right.bFinalCharacterArt
            && Left.bFinalSkin == Right.bFinalSkin;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCouncilSkinLookdevAutomationTest,
    "SHI.Cinematic.CouncilSkinLookdevV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCouncilSkinLookdevAutomationTest::RunTest(const FString& Parameters)
{
    FString Error;
    FShiCouncilSkinLookdevContractData Contract;
    TestTrue(TEXT("Chen Sheng skin lookdev contract builds"),
        FShiCouncilSkinLookdevModel::BuildContract(Contract, Error));
    TestTrue(TEXT("canonical skin lookdev contract validates"),
        FShiCouncilSkinLookdevModel::ValidateContract(Contract, Error));
    TestEqual(TEXT("skin lookdev has exactly five isolated engine assets"),
        Contract.AssetInventory.Num(), FShiCouncilSkinLookdevModel::AssetInventoryCount());
    TestEqual(TEXT("skin lookdev has exactly three admitted engine textures"),
        Contract.TextureInventory.Num(), FShiCouncilSkinLookdevModel::TextureInventoryCount());
    TestTrue(TEXT("lookdev contract uses the exact isolated root and Chen-only command-line gate"),
        Contract.AssetId == FShiCouncilSkinLookdevModel::CanonicalAssetId()
        && Contract.TargetCharacterId
            == FShiCouncilSkinLookdevModel::CanonicalTargetCharacterId()
        && Contract.ReviewModeId == TEXT("-ShiCouncilSkinLookdevReview")
        && Contract.IsolatedRootPath
            == TEXT("/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1"));
    TestTrue(TEXT("lookdev engine inventory excludes the canonical height source"),
        Contract.AssetInventory.Num() == 5
        && Contract.AssetInventory[0].AssetClass == TEXT("SubsurfaceProfile")
        && Contract.AssetInventory[1].AssetClass == TEXT("Material")
        && Contract.AssetInventory[2].AssetClass == TEXT("Texture2D")
        && Contract.AssetInventory[3].AssetClass == TEXT("Texture2D")
        && Contract.AssetInventory[4].AssetClass == TEXT("Texture2D")
        && Contract.DetailHeightSource.Width == 1024
        && Contract.DetailHeightSource.Height == 1024
        && Contract.DetailHeightSource.BitDepth == 16
        && Contract.DetailHeightSource.SourceEncoding == TEXT("grayscale16 linear")
        && Contract.DetailHeightSource.bLinear
        && Contract.DetailHeightSource.bSeamless
        && !Contract.DetailHeightSource.bImportedIntoEngine
        && !Contract.DetailHeightSource.bGeneratedImageDerived);
    TestTrue(TEXT("base color is exact 2K sRGB BC7 non-tiling UV0"),
        Contract.TextureInventory[0].Width == 2048
        && Contract.TextureInventory[0].Height == 2048
        && Contract.TextureInventory[0].bSRGB
        && Contract.TextureInventory[0].bNonTilingUv0
        && !Contract.TextureInventory[0].bSeamless
        && Contract.TextureInventory[0].SourceEncoding == TEXT("RGB8 sRGB")
        && Contract.TextureInventory[0].AddressMode == TEXT("Clamp")
        && Contract.TextureInventory[0].EngineCompression == TEXT("BC7"));
    TestTrue(TEXT("packed masks are exact 2K linear non-tiling UV0"),
        Contract.TextureInventory[1].Width == 2048
        && Contract.TextureInventory[1].Height == 2048
        && !Contract.TextureInventory[1].bSRGB
        && Contract.TextureInventory[1].bNonTilingUv0
        && Contract.TextureInventory[1].SourceEncoding == TEXT("RGBA8 linear")
        && Contract.TextureInventory[1].AddressMode == TEXT("Clamp")
        && Contract.TextureInventory[1].EngineCompression == TEXT("Masks")
        && Contract.TextureInventory[1].ChannelContract
            == TEXT("R=neutral AO; G=roughness; B=Subsurface Profile opacity/radius scale 89/255 via MP_OPACITY only; A=unused opaque"));
    TestTrue(TEXT("detail normal is exact 1K linear seamless DirectX BC5 derivative"),
        Contract.TextureInventory[2].Width == 1024
        && Contract.TextureInventory[2].Height == 1024
        && !Contract.TextureInventory[2].bSRGB
        && Contract.TextureInventory[2].bSeamless
        && Contract.TextureInventory[2].bDirectXNormal
        && Contract.TextureInventory[2].SourceEncoding
            == TEXT("RGB8 linear derived from external 16-bit linear height")
        && !Contract.TextureInventory[2].bFlipGreenChannel
        && Contract.TextureInventory[2].bDerivedFromExternalCanonicalHeightSource
        && Contract.TextureInventory[2].AddressMode == TEXT("Wrap")
        && Contract.TextureInventory[2].EngineCompression == TEXT("BC5"));
    TestTrue(TEXT("skin material is an opaque skeletal morph-compatible Subsurface Profile material"),
        Contract.Material.MaterialPath
            == FShiCouncilSkinLookdevModel::CanonicalLookdevMaterialPath()
        && Contract.Material.MaterialSlot == FName(TEXT("M_SHI_Character_SkinClay"))
        && Contract.Material.MaterialDomain == TEXT("Surface")
        && Contract.Material.BlendMode == TEXT("Opaque")
        && Contract.Material.ShadingModel == TEXT("SubsurfaceProfile")
        && Contract.Material.Metallic == 0.f
        && Contract.Material.Specular == .25f
        && Contract.Material.MaximumSpecular == .35f
        && Contract.Material.bSubsurfaceProfileAssigned
        && Contract.Material.bTangentSpaceNormal
        && Contract.Material.bUsedWithSkeletalMesh
        && Contract.Material.bUsedWithMorphTargets
        && !Contract.Material.bTwoSided
        && !Contract.Material.bRuntimeRandomness
        && !Contract.Material.bDynamicNetworkDependency
        && !Contract.Material.bRuntimeParameterMutation
        && !Contract.Material.bDefaultMaterialFallbackAllowed
        && Contract.Material.bCanonicalHeightSourceKeptOutsideEngine);
    TestTrue(TEXT("skin material binds bounded MaterialMasks2K.B only to Subsurface Profile Opacity"),
        Contract.Material.SubsurfaceProfileOpacitySource == TEXT("MaterialMasks2K.B")
        && FMath::IsNearlyEqual(Contract.Material.SubsurfaceProfileOpacity, 89.f / 255.f)
        && FMath::IsNearlyEqual(
            Contract.Material.MaximumSubsurfaceProfileOpacity, 89.f / 255.f)
        && FMath::IsNearlyEqual(
            Contract.Material.SubsurfaceProfileOpacityThresholdExclusive, .10f)
        && Contract.Material.SubsurfaceProfileOpacity
            > Contract.Material.SubsurfaceProfileOpacityThresholdExclusive
        && Contract.Material.SubsurfaceProfileOpacity
            <= Contract.Material.MaximumSubsurfaceProfileOpacity
        && FMath::IsNearlyEqual(Contract.Material.ProfileMeanFreePathDistance, 2.6748f)
        && FMath::IsNearlyEqual(Contract.Material.EffectiveMeanFreePathDistance,
            2.6748f * (89.f / 255.f))
        && Contract.Material.bOpacityConnected
        && !Contract.Material.bSubsurfaceColorConnected);
    TestTrue(TEXT("skin fallback binds exact accepted Chen mesh, SkinClay, rig, source and UV receipts"),
        Contract.Baseline.MeshUassetSha256
            == TEXT("fc07683b48b1b43f5f189396cbc229449b66c5607a3772d3e8933103a88cbcd1")
        && Contract.Baseline.MaterialUassetSha256
            == TEXT("b7ec2a89a11a9b03127e622c90c1d58d0c7ee3c338d6e2925636893e5ee9d160")
        && Contract.Baseline.SourceFbxSha256
            == TEXT("febf45db1a7e2d1dfeea4c845b22207237e4a38c73b05733449585f768739688")
        && Contract.Baseline.SkeletonReferencePoseSha256
            == TEXT("339840849171114b7a814163acde2c0c5331043c477e7e4171e1bd5f2b2c704d")
        && Contract.Baseline.BodyUv0Sha256
            == TEXT("f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6"));
    TestTrue(TEXT("lookdev contract remains review-only and non-authoritative"),
        Contract.bReviewOnly && Contract.bChenOnly
        && Contract.bBaselineFallbackRequired && Contract.bDeterministic
        && Contract.bStandardMotionSupported && Contract.bReducedMotionSupported
        && !Contract.bInteractionAuthority && !Contract.bGameplayAuthority
        && !Contract.bSaveAuthority && !Contract.bReplicated
        && !Contract.bIdentityAuthority && !Contract.bHistoricalPortrait
        && !Contract.bHistoricallyAttestedComplexion
        && !Contract.bHumanHistoricalCulturalReviewApproved
        && !Contract.bCloseCameraApproved && !Contract.bFinalCharacterArt
        && !Contract.bFinalSkin);

    FShiCouncilSkinLookdevContractData ContractDrift = Contract;
    ContractDrift.IsolatedRootPath = TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial");
    TestFalse(TEXT("legacy-root overwrite is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.AssetInventory.Swap(0, 1);
    TestFalse(TEXT("engine inventory reorder is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.AssetInventory.Add(Contract.AssetInventory.Last());
    TestFalse(TEXT("extra engine asset is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.TextureInventory[0].Width = 4096;
    TestFalse(TEXT("unreviewed base-color resolution drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.TextureInventory[1].bSRGB = true;
    TestFalse(TEXT("sRGB packed masks are rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.TextureInventory[2].bDirectXNormal = false;
    TestFalse(TEXT("unspecified detail-normal convention is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.TextureInventory[2].bFlipGreenChannel = true;
    TestFalse(TEXT("detail-normal green-channel flip drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.TextureInventory[2].AddressMode = TEXT("Clamp");
    TestFalse(TEXT("non-wrapping detail normal is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.DetailHeightSource.bImportedIntoEngine = true;
    TestFalse(TEXT("imported canonical height source is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.DetailHeightSource.bGeneratedImageDerived = true;
    TestFalse(TEXT("generated-luminance height source is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.ShadingModel = TEXT("DefaultLit");
    TestFalse(TEXT("Default Lit lookdev material drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.SubsurfaceProfileOpacitySource = TEXT("MaterialMasks2K.R");
    TestFalse(TEXT("wrong packed-mask source for profile Opacity is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.SubsurfaceProfileOpacity = .10f;
    TestFalse(TEXT("profile Opacity at the exclusive UE 0.10 threshold is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.SubsurfaceProfileOpacity =
        Contract.Material.MaximumSubsurfaceProfileOpacity + (1.f / 255.f);
    TestFalse(TEXT("profile Opacity above the exact 89/255 maximum is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.MaximumSubsurfaceProfileOpacity = 1.f;
    TestFalse(TEXT("widened profile Opacity maximum is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.SubsurfaceProfileOpacityThresholdExclusive = 0.f;
    TestFalse(TEXT("weakened profile Opacity threshold is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.ProfileMeanFreePathDistance += .01f;
    TestFalse(TEXT("Subsurface Profile mean-free-path drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.EffectiveMeanFreePathDistance += .01f;
    TestFalse(TEXT("effective mean-free-path product drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.bOpacityConnected = false;
    TestFalse(TEXT("unconnected Subsurface Profile Opacity is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.bSubsurfaceColorConnected = true;
    TestFalse(TEXT("connected Subsurface Color is rejected for the profile contract"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.bUsedWithMorphTargets = false;
    TestFalse(TEXT("material without morph usage is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Material.bDefaultMaterialFallbackAllowed = true;
    TestFalse(TEXT("Unreal Default Material substitution is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Baseline.MeshUassetSha256[0] = TCHAR('0');
    TestFalse(TEXT("accepted Chen mesh receipt drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.Baseline.BodyUv0Sha256[0] = TCHAR('0');
    TestFalse(TEXT("accepted body UV0 receipt drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.bIdentityAuthority = true;
    TestFalse(TEXT("skin lookdev cannot acquire identity authority"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.bHumanHistoricalCulturalReviewApproved = true;
    TestFalse(TEXT("native contract cannot manufacture human approval"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));
    ContractDrift = Contract;
    ContractDrift.bFinalSkin = true;
    TestFalse(TEXT("review candidate cannot become final skin by flag drift"),
        FShiCouncilSkinLookdevModel::ValidateContract(ContractDrift, Error));

    FShiCouncilSkinLookdevFrameRequest BaselineRequest;
    BaselineRequest.CharacterId = TEXT("chen-sheng");
    FShiCouncilSkinLookdevFrameData BaselineFrame;
    TestTrue(TEXT("default Chen frame resolves"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(BaselineRequest, BaselineFrame, Error));
    TestTrue(TEXT("default Chen frame uses the accepted SkinClay fallback"),
        !BaselineFrame.bLookdevActive && BaselineFrame.bUsingBaselineFallback
        && BaselineFrame.ActiveMaterialPath
            == FShiCouncilSkinLookdevModel::CanonicalBaselineMaterialPath());

    FShiCouncilSkinLookdevFrameRequest ReviewRequest;
    ReviewRequest.CharacterId = TEXT("chen-sheng");
    ReviewRequest.ReviewModeId = FShiCouncilSkinLookdevModel::CanonicalReviewModeId();
    ReviewRequest.bDevelopmentReviewAuthorized = true;
    ReviewRequest.bLookdevInventoryReady = true;
    FShiCouncilSkinLookdevFrameData StandardFrame;
    TestTrue(TEXT("exact authorized Chen review frame resolves"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(ReviewRequest, StandardFrame, Error));
    TestTrue(TEXT("exact authorized ready Chen review activates only the isolated material"),
        StandardFrame.bLookdevActive && !StandardFrame.bUsingBaselineFallback
        && StandardFrame.ActiveMaterialPath
            == FShiCouncilSkinLookdevModel::CanonicalLookdevMaterialPath()
        && StandardFrame.BaselineFallbackMaterialPath
            == FShiCouncilSkinLookdevModel::CanonicalBaselineMaterialPath()
        && StandardFrame.MaterialSlot == FName(TEXT("M_SHI_Character_SkinClay")));

    ReviewRequest.bReducedMotion = true;
    FShiCouncilSkinLookdevFrameData ReducedFrame;
    TestTrue(TEXT("reduced-motion Chen review frame resolves"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(ReviewRequest, ReducedFrame, Error));
    TestTrue(TEXT("standard and reduced-motion routes use the identical static material"),
        ReducedFrame.bReducedMotion && ReducedFrame.bMotionIndependent
        && ReducedFrame.bStandardMotionCompatible && ReducedFrame.bReducedMotionCompatible
        && ReducedFrame.RouteId == StandardFrame.RouteId
        && ReducedFrame.ActiveMaterialPath == StandardFrame.ActiveMaterialPath
        && ReducedFrame.BaselineFallbackMaterialPath
            == StandardFrame.BaselineFallbackMaterialPath);

    ReviewRequest.bReducedMotion = false;
    ReviewRequest.bLookdevInventoryReady = false;
    FShiCouncilSkinLookdevFrameData MissingInventoryFrame;
    TestTrue(TEXT("missing lookdev inventory resolves without a broken material"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(
            ReviewRequest, MissingInventoryFrame, Error));
    TestTrue(TEXT("missing lookdev inventory fails closed to accepted SkinClay"),
        !MissingInventoryFrame.bLookdevActive
        && MissingInventoryFrame.bUsingBaselineFallback
        && MissingInventoryFrame.ActiveMaterialPath
            == FShiCouncilSkinLookdevModel::CanonicalBaselineMaterialPath());

    ReviewRequest.bLookdevInventoryReady = true;
    for (const FString& CharacterId : FShiCouncilSkinLookdevModel::CanonicalCharacterIds())
    {
        if (CharacterId == TEXT("chen-sheng")) continue;
        ReviewRequest.CharacterId = CharacterId;
        FShiCouncilSkinLookdevFrameData OtherCharacterFrame;
        const bool bResolved = FShiCouncilSkinLookdevModel::EvaluateFrame(
            ReviewRequest, OtherCharacterFrame, Error);
        TestTrue(*FString::Printf(TEXT("%s remains on baseline during Chen-only review"),
            *CharacterId), bResolved && !OtherCharacterFrame.bLookdevActive
            && OtherCharacterFrame.bUsingBaselineFallback
            && OtherCharacterFrame.ActiveMaterialPath
                == FShiCouncilSkinLookdevModel::CanonicalBaselineMaterialPath());
    }

    const FShiCouncilSkinLookdevFrameData StableFrame = StandardFrame;
    FShiCouncilSkinLookdevFrameRequest InvalidRequest = ReviewRequest;
    InvalidRequest.CharacterId = TEXT("invented-general");
    TestFalse(TEXT("unknown identity is rejected"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(InvalidRequest, StandardFrame, Error));
    TestTrue(TEXT("failed unknown-identity evaluation is atomic"),
        FramesEqual(StandardFrame, StableFrame));
    InvalidRequest = FShiCouncilSkinLookdevFrameRequest();
    InvalidRequest.CharacterId = TEXT("chen-sheng");
    InvalidRequest.ReviewModeId = TEXT("-ShiCouncilSkinLookdevFinal");
    InvalidRequest.bDevelopmentReviewAuthorized = true;
    TestFalse(TEXT("unknown skin review token is rejected"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(InvalidRequest, StandardFrame, Error));
    TestTrue(TEXT("failed token evaluation is atomic"), FramesEqual(StandardFrame, StableFrame));
    InvalidRequest.ReviewModeId = FShiCouncilSkinLookdevModel::CanonicalReviewModeId();
    InvalidRequest.bDevelopmentReviewAuthorized = false;
    TestFalse(TEXT("review token without development authorization is rejected"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(InvalidRequest, StandardFrame, Error));
    InvalidRequest.ReviewModeId.Empty();
    InvalidRequest.bDevelopmentReviewAuthorized = true;
    TestFalse(TEXT("development authorization without exact review token is rejected"),
        FShiCouncilSkinLookdevModel::EvaluateFrame(InvalidRequest, StandardFrame, Error));

    FShiCouncilSkinLookdevFrameData FrameDrift = StableFrame;
    FrameDrift.CharacterId = TEXT("keeper");
    TestFalse(TEXT("active skin frame cannot drift to another identity"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.RouteId = TEXT("final-skin");
    TestFalse(TEXT("skin frame route drift is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.ActiveMaterialPath = TEXT("/Engine/EngineMaterials/DefaultMaterial.DefaultMaterial");
    TestFalse(TEXT("Default Material frame substitution is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.BaselineFallbackMaterialPath = FrameDrift.ActiveMaterialPath;
    TestFalse(TEXT("missing accepted SkinClay fallback path is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.MaterialSlot = FName(TEXT("M_SHI_chen-sheng_ClothBase"));
    TestFalse(TEXT("skin lookdev cannot override a costume slot"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bLookdevInventoryReady = false;
    TestFalse(TEXT("active route cannot outlive ready inventory"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bUsingBaselineFallback = true;
    TestFalse(TEXT("active and baseline routes cannot both claim selection"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bMotionIndependent = false;
    TestFalse(TEXT("skin frame cannot acquire motion behavior"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bReducedMotionCompatible = false;
    TestFalse(TEXT("skin frame cannot discard reduced-motion compatibility"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bGameplayAuthority = true;
    TestFalse(TEXT("skin frame gameplay authority is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bSaveAuthority = true;
    TestFalse(TEXT("skin frame save authority is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bReplicated = true;
    TestFalse(TEXT("skin frame replication is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bIdentityAuthority = true;
    TestFalse(TEXT("skin frame identity authority is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bHistoricalPortrait = true;
    TestFalse(TEXT("skin frame historical portrait claim is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bHistoricallyAttestedComplexion = true;
    TestFalse(TEXT("skin frame historical complexion claim is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bHumanHistoricalCulturalReviewApproved = true;
    TestFalse(TEXT("skin frame cannot manufacture human review approval"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bCloseCameraApproved = true;
    TestFalse(TEXT("skin frame close-camera approval is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bFinalCharacterArt = true;
    TestFalse(TEXT("skin frame final-character claim is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));
    FrameDrift = StableFrame;
    FrameDrift.bFinalSkin = true;
    TestFalse(TEXT("skin frame final-skin claim is rejected"),
        FShiCouncilSkinLookdevModel::ValidateFrame(FrameDrift, Error));

    return !HasAnyErrors();
}

#endif
