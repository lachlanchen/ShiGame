#include "ShiCouncilFacialPerformanceModel.h"

#include "Animation/MorphTarget.h"
#include "Animation/Skeleton.h"
#include "Engine/SkeletalMesh.h"
#include "Rendering/SkeletalMeshRenderData.h"

namespace
{
    const TCHAR* SharedSkeletonPath = TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton");
    const TCHAR* Disclosure = TEXT("FACIAL PERFORMANCE ENGINEERING BLOCKOUT · SILENT INTENT CADENCE · GENERIC NON-PORTRAIT FACE · NOT FINAL ACTING, LIP SYNC OR VOICE");
    const TArray<FString> CharacterIds = {
        TEXT("keeper"), TEXT("chen-sheng"), TEXT("wu-guang"), TEXT("yu-mu"), TEXT("qin-courier")
    };
    const TArray<FString> RoleIds = {TEXT("listener"), TEXT("speaker")};
    const TArray<FString> StateIds = {
        TEXT("neutral"), TEXT("blink"), TEXT("object-glance"),
        TEXT("interrupted-return"), TEXT("silent-speech"), TEXT("held-breath")
    };
    const TArray<FName> MorphTargetNames = {
        TEXT("eyeBlinkLeft"), TEXT("eyeBlinkRight"),
        TEXT("eyeLookDownLeft"), TEXT("eyeLookDownRight"),
        TEXT("eyeLookInLeft"), TEXT("eyeLookInRight"),
        TEXT("eyeLookOutLeft"), TEXT("eyeLookOutRight"),
        TEXT("eyeLookUpLeft"), TEXT("eyeLookUpRight"),
        TEXT("browInnerUp"), TEXT("browDownLeft"), TEXT("browDownRight"),
        TEXT("cheekSquintLeft"), TEXT("cheekSquintRight"),
        TEXT("jawOpen"), TEXT("mouthFunnel"),
        TEXT("mouthPressLeft"), TEXT("mouthPressRight"),
        TEXT("mouthUpperUpLeft"), TEXT("mouthUpperUpRight")
    };
    const TArray<float> MaximumMorphWeights = {
        .82f, .82f,
        .18f, .18f, .18f, .18f, .18f, .18f, .18f, .18f,
        .12f, .05f, .05f,
        .08f, .08f,
        .28f, .10f,
        .16f, .16f,
        .06f, .06f
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
    const TArray<int32> BoneParents = {
        INDEX_NONE, 0, 1, 2, 3,
        4, 5, 6, 7, 8, 9, 10, 8, 12, 13, 8, 15, 16, 8, 18, 19, 8, 21, 22,
        4, 24, 25, 26, 27, 28, 29, 27, 31, 32, 27, 34, 35, 27, 37, 38, 27, 40, 41,
        4, 43, 1, 45, 46, 47, 1, 49, 50, 51
    };

    struct FStateWeight
    {
        FName MorphTarget;
        float Weight;
    };

    struct FStateContract
    {
        const TCHAR* StateId;
        TArray<FStateWeight> Weights;
    };

    const TArray<FStateContract> StateContracts = {
        {TEXT("neutral"), {}},
        {TEXT("blink"), {{TEXT("eyeBlinkLeft"), .82f}, {TEXT("eyeBlinkRight"), .82f}}},
        {TEXT("object-glance"), {
            {TEXT("eyeLookOutLeft"), .18f}, {TEXT("eyeLookInRight"), .18f}}},
        {TEXT("interrupted-return"), {
            {TEXT("browInnerUp"), .12f},
            {TEXT("mouthPressLeft"), .06f}, {TEXT("mouthPressRight"), .06f},
            {TEXT("cheekSquintLeft"), .04f}, {TEXT("cheekSquintRight"), .04f}}},
        {TEXT("silent-speech"), {
            {TEXT("jawOpen"), .28f}, {TEXT("mouthFunnel"), .10f},
            {TEXT("mouthUpperUpLeft"), .06f}, {TEXT("mouthUpperUpRight"), .06f}}},
        {TEXT("held-breath"), {
            {TEXT("browDownLeft"), .05f}, {TEXT("browDownRight"), .05f},
            {TEXT("cheekSquintLeft"), .08f}, {TEXT("cheekSquintRight"), .08f},
            {TEXT("mouthPressLeft"), .16f}, {TEXT("mouthPressRight"), .16f}}},
    };

    struct FContract
    {
        const TCHAR* CharacterId;
        const TCHAR* MeshName;
        FVector AssetLocalOrigin;
        FVector AssetLocalDimensions;
        int32 Triangles;
        TArray<FName> Materials;
    };

    const TArray<FContract> Contracts = {
        {
            TEXT("keeper"), TEXT("SKM_SHI_DazeCouncil_Keeper_Facial_01"),
            FVector(0.f, .06573503f, .84924126f),
            FVector(.99254024f, .51147005f, 1.69651747f), 27840,
            {TEXT("M_SHI_Character_BindingClay"), TEXT("M_SHI_Character_EyeBrown"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_Character_RolePropClay"),
             TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_keeper_ClothBase"),
             TEXT("M_SHI_keeper_ClothOuter")}
        },
        {
            TEXT("chen-sheng"), TEXT("SKM_SHI_DazeCouncil_ChenSheng_Facial_01"),
            FVector(0.f, .06073505f, .86299133f),
            FVector(.99254018f, .52147011f, 1.72401762f), 27836,
            {TEXT("M_SHI_Character_BindingClay"), TEXT("M_SHI_Character_EyeBrown"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_Character_SkinClay"),
             TEXT("M_SHI_chen-sheng_ClothBase"), TEXT("M_SHI_chen-sheng_ClothOuter")}
        },
        {
            TEXT("wu-guang"), TEXT("SKM_SHI_DazeCouncil_WuGuang_Facial_01"),
            FVector(0.f, .06573506f, .84924132f),
            FVector(.99254018f, .51147011f, 1.69651759f), 27680,
            {TEXT("M_SHI_Character_BindingClay"), TEXT("M_SHI_Character_EyeBrown"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_Character_SkinClay"),
             TEXT("M_SHI_wu-guang_ClothBase"), TEXT("M_SHI_wu-guang_ClothOuter")}
        },
        {
            TEXT("yu-mu"), TEXT("SKM_SHI_DazeCouncil_YuMu_Facial_01"),
            FVector(0.f, .06573506f, .84924132f),
            FVector(.99254018f, .51147011f, 1.69651759f), 27828,
            {TEXT("M_SHI_Character_BindingClay"), TEXT("M_SHI_Character_EyeBrown"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_Character_SkinClay"),
             TEXT("M_SHI_yu-mu_ClothBase"), TEXT("M_SHI_yu-mu_ClothOuter")}
        },
        {
            TEXT("qin-courier"), TEXT("SKM_SHI_DazeCouncil_QinCourier_Facial_01"),
            FVector(0.f, .06573506f, .87399131f),
            FVector(.99254018f, .51147011f, 1.74601758f), 27840,
            {TEXT("M_SHI_Character_BindingClay"), TEXT("M_SHI_Character_EyeBrown"),
             TEXT("M_SHI_Character_HairClay"), TEXT("M_SHI_Character_RolePropClay"),
             TEXT("M_SHI_Character_SkinClay"), TEXT("M_SHI_qin-courier_ClothBase"),
             TEXT("M_SHI_qin-courier_ClothOuter")}
        },
    };

    const FContract* FindContract(const FString& CharacterId)
    {
        return Contracts.FindByPredicate([&](const FContract& Contract)
        {
            return CharacterId == Contract.CharacterId;
        });
    }

    const FStateContract* FindStateContract(const FString& StateId)
    {
        return StateContracts.FindByPredicate([&](const FStateContract& State)
        {
            return StateId == State.StateId;
        });
    }

    FString MeshPath(const FContract& Contract)
    {
        return FString::Printf(
            TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/%s.%s"),
            Contract.MeshName, Contract.MeshName);
    }

    float SmoothStep01(float Value)
    {
        const float Clamped = FMath::Clamp(Value, 0.f, 1.f);
        return Clamped * Clamped * (3.f - 2.f * Clamped);
    }

    float SmoothPulse(float Time, float Start, float Peak, float End)
    {
        if (Time <= Start || Time >= End || Peak <= Start || End <= Peak) return 0.f;
        return Time <= Peak
            ? SmoothStep01((Time - Start) / (Peak - Start))
            : SmoothStep01((End - Time) / (End - Peak));
    }

    void InitializeWeights(FShiCouncilFacialFrameData& Frame)
    {
        Frame.MorphWeights.Reset(MorphTargetNames.Num());
        for (const FName& MorphTarget : MorphTargetNames)
        {
            FShiCouncilFacialMorphWeight Weight;
            Weight.MorphTarget = MorphTarget;
            Frame.MorphWeights.Add(Weight);
        }
    }

    void SetWeight(FShiCouncilFacialFrameData& Frame, const FName& MorphTarget, float Weight)
    {
        const int32 Index = MorphTargetNames.IndexOfByKey(MorphTarget);
        if (Index == INDEX_NONE || !MaximumMorphWeights.IsValidIndex(Index)) return;
        Frame.MorphWeights[Index].Weight = FMath::Clamp(Weight, 0.f, MaximumMorphWeights[Index]);
    }

    void ApplyCompleteState(FShiCouncilFacialFrameData& Frame, const TCHAR* StateId, float Alpha)
    {
        Frame.StateId = StateId;
        Frame.TargetAlpha = FMath::Clamp(Alpha, 0.f, 1.f);
        const FStateContract* State = FindStateContract(Frame.StateId);
        if (!State) return;
        for (const FStateWeight& Weight : State->Weights)
        {
            SetWeight(Frame, Weight.MorphTarget, Weight.Weight * Frame.TargetAlpha);
        }
    }

    bool HasExactNameSet(const TArray<FName>& Actual, const TArray<FName>& Expected)
    {
        if (Actual.Num() != Expected.Num()) return false;
        TSet<FName> Seen;
        for (const FName& Name : Actual)
        {
            if (Name.IsNone() || Seen.Contains(Name) || !Expected.Contains(Name)) return false;
            Seen.Add(Name);
        }
        return Seen.Num() == Expected.Num();
    }
}

const TArray<FString>& FShiCouncilFacialPerformanceModel::CanonicalCharacterIds()
{
    return CharacterIds;
}

const TArray<FString>& FShiCouncilFacialPerformanceModel::CanonicalRoleIds()
{
    return RoleIds;
}

const TArray<FString>& FShiCouncilFacialPerformanceModel::CanonicalStateIds()
{
    return StateIds;
}

const TArray<FName>& FShiCouncilFacialPerformanceModel::CanonicalMorphTargets()
{
    return MorphTargetNames;
}

float FShiCouncilFacialPerformanceModel::MaximumWeightForMorphTarget(const FName& MorphTarget)
{
    const int32 Index = MorphTargetNames.IndexOfByKey(MorphTarget);
    return MaximumMorphWeights.IsValidIndex(Index) ? MaximumMorphWeights[Index] : 0.f;
}

bool FShiCouncilFacialPerformanceModel::Build(const FString& CharacterId,
    FShiCouncilFacialMeshData& OutPresentation, FString& OutError)
{
    const FContract* Contract = FindContract(CharacterId);
    if (!Contract)
    {
        OutError = FString::Printf(TEXT("Unknown Daze council facial identity: %s."), *CharacterId);
        return false;
    }

    FShiCouncilFacialMeshData Candidate;
    Candidate.CharacterId = CharacterId;
    Candidate.MeshPath = ::MeshPath(*Contract);
    Candidate.SkeletonPath = SharedSkeletonPath;
    Candidate.HistoricalDisclosure = Disclosure;
    Candidate.MaterialSlots = Contract->Materials;
    Candidate.MorphTargets = MorphTargetNames;
    Candidate.AssetLocalOrigin = Contract->AssetLocalOrigin;
    Candidate.AssetLocalDimensions = Contract->AssetLocalDimensions;
    Candidate.ComponentScale = FVector(PresentationScale());
    Candidate.SourceTriangles = Contract->Triangles;
    Candidate.BoneCount = BoneCount();
    Candidate.bEngineeringBlockout = true;
    Candidate.bGenericNonPortraitFace = true;
    Candidate.bDeterministic = true;
    Candidate.bLanguageNeutral = true;
    Candidate.bSilentIntentCadence = true;
    Candidate.bReducedMotionSupported = true;
    if (!Validate(Candidate, OutError)) return false;
    OutPresentation = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilFacialPerformanceModel::Validate(
    const FShiCouncilFacialMeshData& Presentation, FString& OutError)
{
    const FContract* Contract = FindContract(Presentation.CharacterId);
    if (!Contract || Presentation.MeshPath != ::MeshPath(*Contract)
        || Presentation.SkeletonPath != SharedSkeletonPath
        || Presentation.HistoricalDisclosure != Disclosure
        || Presentation.MaterialSlots != Contract->Materials
        || Presentation.MorphTargets != MorphTargetNames)
    {
        OutError = TEXT("Council facial identity, asset, Skeleton, material, morph or disclosure drifted from admission.");
        return false;
    }
    const FVector PresentedDimensions = Presentation.AssetLocalDimensions * Presentation.ComponentScale;
    if (!Presentation.AssetLocalOrigin.Equals(Contract->AssetLocalOrigin, .00001f)
        || !Presentation.AssetLocalDimensions.Equals(Contract->AssetLocalDimensions, .00001f)
        || !Presentation.ComponentScale.Equals(FVector(PresentationScale()), .0001f)
        || PresentedDimensions.Z < MinimumPresentedHeight()
        || PresentedDimensions.Z > MaximumPresentedHeight()
        || Presentation.SourceTriangles != Contract->Triangles
        || Presentation.SourceTriangles <= 0
        || Presentation.SourceTriangles > MaximumTriangles()
        || Presentation.MaterialSlots.Num() < 6
        || Presentation.MaterialSlots.Num() > MaximumMaterialSlots()
        || Presentation.MorphTargets.Num() != MorphTargetCount()
        || Presentation.BoneCount != BoneCount())
    {
        OutError = TEXT("Council facial scale, bounds, topology, materials, morph count or skeleton budget drifted from admission.");
        return false;
    }
    if (!Presentation.bEngineeringBlockout || !Presentation.bGenericNonPortraitFace
        || !Presentation.bDeterministic || !Presentation.bLanguageNeutral
        || !Presentation.bSilentIntentCadence || !Presentation.bReducedMotionSupported
        || Presentation.bAudioDriven || Presentation.bTranscriptDriven
        || Presentation.bPhonemeDriven || Presentation.bRandomized
        || Presentation.bInteractionAuthority || Presentation.bGameplayAuthority
        || Presentation.bSaveAuthority || Presentation.bReplicated
        || !Presentation.bWideAndMediumFramingOnly || Presentation.bCloseFramingApproved
        || Presentation.bFinalFace || Presentation.bFinalActing || Presentation.bFinalVoice)
    {
        OutError = TEXT("Council facial blockout cannot claim close framing, final face, voice, randomness or authoritative state.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilFacialPerformanceModel::ValidateMesh(
    const FShiCouncilFacialMeshData& Presentation, const USkeletalMesh& Mesh, FString& OutError)
{
    if (!Validate(Presentation, OutError)) return false;
    if (Mesh.GetPathName() != Presentation.MeshPath
        || !Mesh.GetSkeleton() || Mesh.GetSkeleton()->GetPathName() != Presentation.SkeletonPath)
    {
        OutError = TEXT("Council facial mesh or exact shared Skeleton path does not match its identity.");
        return false;
    }

    const FReferenceSkeleton& Reference = Mesh.GetRefSkeleton();
    if (Reference.GetRawBoneNum() != BoneNames.Num() || BoneNames.Num() != BoneParents.Num())
    {
        OutError = TEXT("Council facial mesh does not contain the exact 53-bone reference hierarchy.");
        return false;
    }
    for (int32 Index = 0; Index < BoneNames.Num(); ++Index)
    {
        if (Reference.GetBoneName(Index) != BoneNames[Index]
            || Reference.GetParentIndex(Index) != BoneParents[Index])
        {
            OutError = TEXT("Council facial bone order, names or parent hierarchy drifted from the shared rig.");
            return false;
        }
    }

    const TArray<FSkeletalMaterial>& Materials = Mesh.GetMaterials();
    TArray<FName> ActualMaterialSlots;
    ActualMaterialSlots.Reserve(Materials.Num());
    for (const FSkeletalMaterial& Material : Materials)
    {
        if (!Material.MaterialInterface)
        {
            OutError = TEXT("Council facial material binding is incomplete.");
            return false;
        }
        ActualMaterialSlots.Add(Material.MaterialSlotName);
    }
    if (!HasExactNameSet(ActualMaterialSlots, Presentation.MaterialSlots))
    {
        OutError = TEXT("Council facial material identities or count drifted from admission.");
        return false;
    }

    const FVector LocalDimensions = Mesh.GetBounds().BoxExtent * 2.f;
    if (!Mesh.GetBounds().Origin.Equals(Presentation.AssetLocalOrigin, .004f)
        || !LocalDimensions.Equals(Presentation.AssetLocalDimensions, .004f)
        || LocalDimensions.Z * Presentation.ComponentScale.Z < MinimumPresentedHeight()
        || LocalDimensions.Z * Presentation.ComponentScale.Z > MaximumPresentedHeight())
    {
        OutError = TEXT("Council facial local bounds or presented physical height drifted from admission.");
        return false;
    }
    if (Mesh.GetPhysicsAsset())
    {
        OutError = TEXT("Council facial presentation unexpectedly acquired physics authority.");
        return false;
    }

    TArray<FName> ActualMorphTargets;
    ActualMorphTargets.Reserve(Mesh.GetMorphTargets().Num());
    for (const TObjectPtr<UMorphTarget>& MorphTarget : Mesh.GetMorphTargets())
    {
        if (!MorphTarget)
        {
            OutError = TEXT("Council facial mesh contains an invalid morph target binding.");
            return false;
        }
        ActualMorphTargets.Add(MorphTarget->GetFName());
    }
    if (!HasExactNameSet(ActualMorphTargets, Presentation.MorphTargets))
    {
        OutError = TEXT("Council facial mesh must contain exactly the 21 admitted morph targets and no extras.");
        return false;
    }

    const FSkeletalMeshRenderData* RenderData = Mesh.GetResourceForRendering();
    if (!RenderData || RenderData->LODRenderData.IsEmpty()
        || static_cast<int32>(RenderData->LODRenderData[0].GetTotalFaces()) != Presentation.SourceTriangles)
    {
        OutError = TEXT("Council facial LOD0 triangle receipt drifted from the validated source.");
        return false;
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilFacialPerformanceModel::Evaluate(bool bSpeaker, float ElapsedSeconds,
    bool bReducedMotion, FShiCouncilFacialFrameData& OutFrame, FString& OutError)
{
    if (!FMath::IsFinite(ElapsedSeconds) || ElapsedSeconds < 0.f)
    {
        OutError = TEXT("Council facial evaluation requires a finite non-negative elapsed time.");
        return false;
    }

    FShiCouncilFacialFrameData Candidate;
    Candidate.RoleId = bSpeaker ? TEXT("speaker") : TEXT("listener");
    Candidate.bSpeaker = bSpeaker;
    Candidate.bReducedMotion = bReducedMotion;
    Candidate.bMotionSuppressed = bReducedMotion;
    Candidate.bDeterministic = true;
    Candidate.bLanguageNeutral = true;
    Candidate.bSilentIntentCadence = true;
    Candidate.CycleSeconds = bReducedMotion
        ? FMath::Min(ElapsedSeconds, CycleDurationSeconds() - KINDA_SMALL_NUMBER)
        : FMath::Fmod(ElapsedSeconds, CycleDurationSeconds());
    InitializeWeights(Candidate);
    ApplyCompleteState(Candidate, TEXT("neutral"), 0.f);

    const float Time = Candidate.CycleSeconds;
    if (bSpeaker)
    {
        if (Time > .18f && Time < .78f)
        {
            ApplyCompleteState(Candidate, TEXT("silent-speech"),
                bReducedMotion ? 1.f : SmoothPulse(Time, .18f, .48f, .78f));
        }
        else if (Time > 1.02f && Time < 1.48f)
        {
            ApplyCompleteState(Candidate, TEXT("object-glance"),
                bReducedMotion ? 1.f : SmoothPulse(Time, 1.02f, 1.24f, 1.48f));
        }
        else if (Time > 1.72f && Time < 2.22f)
        {
            ApplyCompleteState(Candidate, TEXT("interrupted-return"),
                bReducedMotion ? 1.f : SmoothPulse(Time, 1.72f, 1.96f, 2.22f));
        }
        else if (!bReducedMotion && Time > 2.58f && Time < 2.82f)
        {
            ApplyCompleteState(Candidate, TEXT("blink"),
                SmoothPulse(Time, 2.58f, 2.68f, 2.82f));
        }
    }
    else
    {
        if (Time > .52f && Time < 1.12f)
        {
            ApplyCompleteState(Candidate, TEXT("object-glance"),
                bReducedMotion ? 1.f : SmoothPulse(Time, .52f, .78f, 1.12f));
        }
        else if (!bReducedMotion && Time > 1.54f && Time < 1.78f)
        {
            ApplyCompleteState(Candidate, TEXT("blink"),
                SmoothPulse(Time, 1.54f, 1.64f, 1.78f));
        }
        else if (Time > 2.24f && Time < 3.30f)
        {
            ApplyCompleteState(Candidate, TEXT("held-breath"),
                bReducedMotion ? 1.f : SmoothPulse(Time, 2.24f, 2.76f, 3.30f));
        }
    }

    if (!ValidateFrame(Candidate, OutError)) return false;
    OutFrame = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilFacialPerformanceModel::ValidateFrame(
    const FShiCouncilFacialFrameData& Frame, FString& OutError)
{
    const FString ExpectedRole = Frame.bSpeaker ? TEXT("speaker") : TEXT("listener");
    const FStateContract* State = FindStateContract(Frame.StateId);
    if (Frame.RoleId != ExpectedRole || !RoleIds.Contains(Frame.RoleId) || !State
        || !FMath::IsFinite(Frame.CycleSeconds)
        || Frame.CycleSeconds < 0.f || Frame.CycleSeconds >= CycleDurationSeconds()
        || !FMath::IsFinite(Frame.TargetAlpha)
        || Frame.TargetAlpha < 0.f || Frame.TargetAlpha > 1.f
        || (Frame.StateId == TEXT("neutral") && !FMath::IsNearlyZero(Frame.TargetAlpha))
        || (Frame.StateId != TEXT("neutral") && Frame.TargetAlpha <= 0.f)
        || (Frame.bReducedMotion && Frame.StateId != TEXT("neutral")
            && !FMath::IsNearlyEqual(Frame.TargetAlpha, 1.f, KINDA_SMALL_NUMBER)))
    {
        OutError = TEXT("Council facial role or deterministic cycle phase is invalid.");
        return false;
    }
    if (!Frame.bDeterministic || !Frame.bLanguageNeutral || !Frame.bSilentIntentCadence
        || Frame.bMotionSuppressed != Frame.bReducedMotion
        || Frame.bAudioDriven || Frame.bTranscriptDriven || Frame.bPhonemeDriven
        || Frame.bRandomized || Frame.bInteractionAuthority || Frame.bGameplayAuthority
        || Frame.bSaveAuthority || Frame.bReplicated
        || Frame.MorphWeights.Num() != MorphTargetCount())
    {
        OutError = TEXT("Council facial frame acquired unsupported motion source or authoritative state.");
        return false;
    }
    for (int32 Index = 0; Index < MorphTargetNames.Num(); ++Index)
    {
        const FShiCouncilFacialMorphWeight& Weight = Frame.MorphWeights[Index];
        const FStateWeight* StateWeight = State->Weights.FindByPredicate([&](const FStateWeight& Candidate)
        {
            return Candidate.MorphTarget == Weight.MorphTarget;
        });
        const float ExpectedWeight = StateWeight ? StateWeight->Weight * Frame.TargetAlpha : 0.f;
        if (Weight.MorphTarget != MorphTargetNames[Index]
            || !FMath::IsFinite(Weight.Weight)
            || Weight.Weight < 0.f || Weight.Weight > MaximumMorphWeights[Index] + KINDA_SMALL_NUMBER
            || !FMath::IsNearlyEqual(Weight.Weight, ExpectedWeight, KINDA_SMALL_NUMBER))
        {
            OutError = TEXT("Council facial morph identity, order, bound or complete named-state value is invalid.");
            return false;
        }
    }
    OutError.Empty();
    return true;
}

bool FShiCouncilFacialPerformanceModel::TryGetWeight(
    const FShiCouncilFacialFrameData& Frame, const FName& MorphTarget, float& OutWeight)
{
    const int32 Index = MorphTargetNames.IndexOfByKey(MorphTarget);
    if (!Frame.MorphWeights.IsValidIndex(Index)
        || Frame.MorphWeights[Index].MorphTarget != MorphTarget)
    {
        return false;
    }
    OutWeight = Frame.MorphWeights[Index].Weight;
    return true;
}
