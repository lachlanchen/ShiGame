#include "ShiCouncilFigure.h"

#include "ShiCouncilCharacterPresentationModel.h"
#include "ShiCouncilFacialPerformanceModel.h"
#include "ShiCouncilPerformancePresentationModel.h"

#include "Animation/AnimSequence.h"
#include "Components/PrimitiveComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"

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

    FigureRoot->SetMobility(EComponentMobility::Movable);
    Body->SetMobility(EComponentMobility::Movable);
    Head->SetMobility(EComponentMobility::Movable);
    Mantle->SetMobility(EComponentMobility::Movable);
    CharacterMesh->SetMobility(EComponentMobility::Movable);

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
    ConfigureCollision(*Body);
    ConfigureCollision(*Head);
    ConfigureCollision(*Mantle);
}

void AShiCouncilFigure::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!bUsingFacialPerformance || !bReviewVisible
        || !FMath::IsFinite(DeltaSeconds) || DeltaSeconds <= 0.f)
    {
        return;
    }
    FacialElapsedSeconds = bReducedMotion
        ? FMath::Min(
            FacialElapsedSeconds + DeltaSeconds,
            FShiCouncilFacialPerformanceModel::CycleDurationSeconds() - KINDA_SMALL_NUMBER)
        : FMath::Fmod(
            FacialElapsedSeconds + DeltaSeconds,
            FShiCouncilFacialPerformanceModel::CycleDurationSeconds());
    ApplyFacialFrame();
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

void AShiCouncilFigure::ApplyParticipant(const FShiCouncilParticipantData& Participant)
{
    SlotId = Participant.SlotId;
    CharacterId = Participant.CharacterId;
    bParticipantSpeaker = Participant.bSpeaker;
    bLoggedMorphSectionExercise = false;
    FacialElapsedSeconds = 0.f;
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
    PerformanceRoleId.Empty();

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

    if (bUsingSkeletalPresentation)
    {
        FShiCouncilPerformanceData Performance;
        FString PerformanceError;
        if (FShiCouncilPerformancePresentationModel::ForParticipant(
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
        if (!bUsingPerformance)
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

void AShiCouncilFigure::SetReducedMotion(bool bValue)
{
    if (bReducedMotion == bValue) return;
    bReducedMotion = bValue;
    FacialElapsedSeconds = 0.f;
    if (bUsingFacialPerformance) ApplyFacialFrame();
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
    CharacterMesh->bPauseAnims = !bVisible;
    CharacterMesh->SetComponentTickEnabled(bVisible && bUsingSkeletalPresentation && bUsingPerformance);
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
        UE_LOG(LogShiCouncilFigure, Display,
            TEXT("SHI_COUNCIL_FACIAL_MORPH_SECTIONS_EXERCISED character=%s role=%s state=object-glance skin=SkinClay eye=EyeBrown alpha=%.4f"),
            *CharacterId,
            bParticipantSpeaker ? TEXT("speaker") : TEXT("listener"),
            Frame.TargetAlpha);
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
    SetActorTickEnabled(bUsingFacialPerformance && bReviewVisible && !bReducedPassComplete);
}
