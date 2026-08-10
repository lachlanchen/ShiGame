#pragma once

#include "CoreMinimal.h"

struct FShiCouncilSkinLookdevAssetData
{
    FString AssetId;
    FString AssetPath;
    FString AssetClass;
};

struct FShiCouncilSkinLookdevTextureData
{
    FString TextureId;
    FString AssetPath;
    FName MaterialParameter = NAME_None;
    FString Semantic;
    FString ChannelContract;
    FString SourceEncoding;
    FString EngineCompression;
    FString AddressMode;
    int32 Width = 0;
    int32 Height = 0;
    bool bSRGB = false;
    bool bNonTilingUv0 = false;
    bool bSeamless = false;
    bool bDirectXNormal = false;
    bool bFlipGreenChannel = false;
    bool bDerivedFromExternalCanonicalHeightSource = false;
};

struct FShiCouncilSkinLookdevMaterialData
{
    FString SubsurfaceProfilePath;
    FString MaterialPath;
    FName MaterialSlot = NAME_None;
    FString MaterialDomain;
    FString BlendMode;
    FString ShadingModel;
    FName MetallicParameter = NAME_None;
    FName SpecularParameter = NAME_None;
    FString SubsurfaceProfileOpacitySource;
    float Metallic = 0.f;
    float Specular = 0.f;
    float MaximumSpecular = 0.f;
    float SubsurfaceProfileOpacity = 0.f;
    float MaximumSubsurfaceProfileOpacity = 0.f;
    float SubsurfaceProfileOpacityThresholdExclusive = 0.f;
    float ProfileMeanFreePathDistance = 0.f;
    float EffectiveMeanFreePathDistance = 0.f;
    bool bSubsurfaceProfileAssigned = false;
    bool bOpacityConnected = false;
    bool bSubsurfaceColorConnected = false;
    bool bTangentSpaceNormal = false;
    bool bUsedWithSkeletalMesh = false;
    bool bUsedWithMorphTargets = false;
    bool bTwoSided = false;
    bool bRuntimeRandomness = false;
    bool bDynamicNetworkDependency = false;
    bool bRuntimeParameterMutation = false;
    bool bDefaultMaterialFallbackAllowed = false;
    bool bCanonicalHeightSourceKeptOutsideEngine = false;
};

struct FShiCouncilSkinLookdevAuthoringSourceData
{
    FString SourceId;
    FString SourceEncoding;
    int32 Width = 0;
    int32 Height = 0;
    int32 BitDepth = 0;
    bool bLinear = false;
    bool bSeamless = false;
    bool bImportedIntoEngine = false;
    bool bGeneratedImageDerived = false;
};

struct FShiCouncilSkinLookdevBaselineReceiptData
{
    FString EvidenceFile;
    FString EvidenceSha256;
    int64 EvidenceBytes = 0;
    FString SourceFbxFile;
    FString SourceFbxSha256;
    int64 SourceFbxBytes = 0;
    FString MeshPath;
    FString MeshUassetSha256;
    int64 MeshUassetBytes = 0;
    FString MaterialPath;
    FString MaterialUassetSha256;
    int64 MaterialUassetBytes = 0;
    FString SkeletonPath;
    FString SkeletonUassetSha256;
    int64 SkeletonUassetBytes = 0;
    FString SkeletonReferencePoseSha256;
    FString BodyUv0Sha256;
};

struct FShiCouncilSkinLookdevContractData
{
    FString AssetId;
    FString TargetCharacterId;
    FString ReviewModeId;
    FString IsolatedRootPath;
    FString HistoricalDisclosure;
    TArray<FShiCouncilSkinLookdevAssetData> AssetInventory;
    TArray<FShiCouncilSkinLookdevTextureData> TextureInventory;
    FShiCouncilSkinLookdevAuthoringSourceData DetailHeightSource;
    FShiCouncilSkinLookdevMaterialData Material;
    FShiCouncilSkinLookdevBaselineReceiptData Baseline;
    bool bReviewOnly = false;
    bool bChenOnly = false;
    bool bBaselineFallbackRequired = false;
    bool bDeterministic = false;
    bool bStandardMotionSupported = false;
    bool bReducedMotionSupported = false;
    bool bInteractionAuthority = false;
    bool bGameplayAuthority = false;
    bool bSaveAuthority = false;
    bool bReplicated = false;
    bool bIdentityAuthority = false;
    bool bHistoricalPortrait = false;
    bool bHistoricallyAttestedComplexion = false;
    bool bHumanHistoricalCulturalReviewApproved = false;
    bool bCloseCameraApproved = false;
    bool bFinalCharacterArt = false;
    bool bFinalSkin = false;
};

struct FShiCouncilSkinLookdevFrameRequest
{
    FString CharacterId;
    FString ReviewModeId;
    bool bDevelopmentReviewAuthorized = false;
    bool bLookdevInventoryReady = false;
    bool bReducedMotion = false;
};

struct FShiCouncilSkinLookdevFrameData
{
    FString CharacterId;
    FString ReviewModeId;
    FString RouteId;
    FString ActiveMaterialPath;
    FString BaselineFallbackMaterialPath;
    FName MaterialSlot = NAME_None;
    bool bDevelopmentReviewAuthorized = false;
    bool bLookdevInventoryReady = false;
    bool bLookdevActive = false;
    bool bUsingBaselineFallback = true;
    bool bReducedMotion = false;
    bool bMotionIndependent = false;
    bool bStandardMotionCompatible = false;
    bool bReducedMotionCompatible = false;
    bool bDeterministic = false;
    bool bInteractionAuthority = false;
    bool bGameplayAuthority = false;
    bool bSaveAuthority = false;
    bool bReplicated = false;
    bool bIdentityAuthority = false;
    bool bHistoricalPortrait = false;
    bool bHistoricallyAttestedComplexion = false;
    bool bHumanHistoricalCulturalReviewApproved = false;
    bool bCloseCameraApproved = false;
    bool bFinalCharacterArt = false;
    bool bFinalSkin = false;
};

class FShiCouncilSkinLookdevModel
{
public:
    static constexpr int32 AssetInventoryCount() { return 5; }
    static constexpr int32 TextureInventoryCount() { return 3; }
    static constexpr int32 BaseTextureSize() { return 2048; }
    static constexpr int32 DetailTextureSize() { return 1024; }
    static constexpr float SpecularScalar() { return .25f; }
    static constexpr float MaximumSpecularScalar() { return .35f; }
    static constexpr int32 SubsurfaceProfileOpacityByte() { return 89; }
    static constexpr float SubsurfaceProfileOpacityScalar()
    {
        return static_cast<float>(SubsurfaceProfileOpacityByte()) / 255.f;
    }
    static constexpr float MaximumSubsurfaceProfileOpacityScalar()
    {
        return SubsurfaceProfileOpacityScalar();
    }
    static constexpr float SubsurfaceProfileOpacityThresholdExclusive() { return .10f; }
    static constexpr float ProfileMeanFreePathDistance() { return 2.6748f; }
    static constexpr float EffectiveMeanFreePathDistance()
    {
        return ProfileMeanFreePathDistance() * SubsurfaceProfileOpacityScalar();
    }

    static const FString& CanonicalAssetId();
    static const FString& CanonicalTargetCharacterId();
    static const FString& CanonicalReviewModeId();
    static const FString& CanonicalIsolatedRootPath();
    static const FString& CanonicalBaselineMaterialPath();
    static const FString& CanonicalLookdevMaterialPath();
    static const TArray<FString>& CanonicalCharacterIds();

    static bool BuildContract(FShiCouncilSkinLookdevContractData& OutContract,
        FString& OutError);
    static bool ValidateContract(const FShiCouncilSkinLookdevContractData& Contract,
        FString& OutError);

    static bool EvaluateFrame(const FShiCouncilSkinLookdevFrameRequest& Request,
        FShiCouncilSkinLookdevFrameData& OutFrame, FString& OutError);
    static bool ValidateFrame(const FShiCouncilSkinLookdevFrameData& Frame,
        FString& OutError);
};
