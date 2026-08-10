#include "ShiCouncilFigure.h"

#include "ShiCouncilCharacterPresentationModel.h"

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
    PrimaryActorTick.bCanEverTick = false;
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
    OutError.Empty();
    return true;
}

void AShiCouncilFigure::ApplyParticipant(const FShiCouncilParticipantData& Participant)
{
    SlotId = Participant.SlotId;
    CharacterId = Participant.CharacterId;
    SetActorTransform(Participant.Transform);
    Tags.Empty();
    Tags.Add(FName(*FString::Printf(TEXT("ShiCharacter:%s"), *Participant.CharacterId)));
    Tags.Add(FName(*FString::Printf(TEXT("ShiCouncilSlot:%s"), *Participant.SlotId)));
    if (Participant.bSpeaker) Tags.Add(FName(TEXT("ShiCouncilSpeaker")));

    const TObjectPtr<USkeletalMesh>* AdmittedMesh = CharacterMeshes.Find(Participant.CharacterId);
    bUsingSkeletalPresentation = AdmittedMesh && AdmittedMesh->Get();
    CharacterMesh->SetSkeletalMeshAsset(bUsingSkeletalPresentation ? AdmittedMesh->Get() : nullptr);
    CharacterMesh->SetRelativeScale3D(FVector(FShiCouncilCharacterPresentationModel::PresentationScale()));
    CharacterMesh->SetVisibility(bUsingSkeletalPresentation, true);
    CharacterMesh->SetHiddenInGame(!bUsingSkeletalPresentation, true);
    Body->SetVisibility(!bUsingSkeletalPresentation, true);
    Head->SetVisibility(!bUsingSkeletalPresentation, true);
    Mantle->SetVisibility(!bUsingSkeletalPresentation, true);
    Body->SetHiddenInGame(bUsingSkeletalPresentation, true);
    Head->SetHiddenInGame(bUsingSkeletalPresentation, true);
    Mantle->SetHiddenInGame(bUsingSkeletalPresentation, true);
    Tags.Add(FName(bUsingSkeletalPresentation
        ? TEXT("ShiArtStatus:SkeletalProductionBlockout")
        : TEXT("ShiArtFallback:EnginePrimitive")));

    const FLinearColor HeadColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.60f, .46f, .32f), .18f);
    const FLinearColor MantleColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.04f, .05f, .05f), .34f);
    if (BodyMaterial) BodyMaterial->SetVectorParameterValue(FName(TEXT("Color")), Participant.Color);
    if (HeadMaterial) HeadMaterial->SetVectorParameterValue(FName(TEXT("Color")), HeadColor);
    if (MantleMaterial) MantleMaterial->SetVectorParameterValue(FName(TEXT("Color")), MantleColor);
    ApplyStencil(*Body, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Head, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Mantle, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*CharacterMesh, Participant.StencilValue, Participant.bSpeaker);
}

void AShiCouncilFigure::SetReviewVisible(bool bVisible)
{
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
}
