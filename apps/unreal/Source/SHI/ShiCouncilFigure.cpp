#include "ShiCouncilFigure.h"

#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"

namespace
{
    void ConfigureCollision(UStaticMeshComponent& Component)
    {
        Component.SetCollisionEnabled(ECollisionEnabled::QueryOnly);
        Component.SetCollisionResponseToAllChannels(ECR_Ignore);
        Component.SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
    }

    void ApplyStencil(UStaticMeshComponent& Component, int32 StencilValue, bool bSpeaker)
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

    FigureRoot->SetMobility(EComponentMobility::Movable);
    Body->SetMobility(EComponentMobility::Movable);
    Head->SetMobility(EComponentMobility::Movable);
    Mantle->SetMobility(EComponentMobility::Movable);

    Body->SetRelativeLocation(FVector(0.f, 0.f, 68.f));
    Body->SetRelativeScale3D(FVector(.42f, .31f, 1.08f));
    Head->SetRelativeLocation(FVector(0.f, 0.f, 139.f));
    Head->SetRelativeScale3D(FVector(.27f, .27f, .27f));
    Mantle->SetRelativeLocation(FVector(0.f, 0.f, 105.f));
    Mantle->SetRelativeScale3D(FVector(.56f, .19f, .07f));
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
    OutError.Empty();
    return true;
}

void AShiCouncilFigure::ApplyParticipant(const FShiCouncilParticipantData& Participant)
{
    SlotId = Participant.SlotId;
    SetActorTransform(Participant.Transform);
    Tags.Empty();
    Tags.Add(FName(*FString::Printf(TEXT("ShiCharacter:%s"), *Participant.CharacterId)));
    Tags.Add(FName(*FString::Printf(TEXT("ShiCouncilSlot:%s"), *Participant.SlotId)));
    if (Participant.bSpeaker) Tags.Add(FName(TEXT("ShiCouncilSpeaker")));

    const FLinearColor HeadColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.60f, .46f, .32f), .18f);
    const FLinearColor MantleColor = FLinearColor::LerpUsingHSV(Participant.Color, FLinearColor(.04f, .05f, .05f), .34f);
    if (BodyMaterial) BodyMaterial->SetVectorParameterValue(FName(TEXT("Color")), Participant.Color);
    if (HeadMaterial) HeadMaterial->SetVectorParameterValue(FName(TEXT("Color")), HeadColor);
    if (MantleMaterial) MantleMaterial->SetVectorParameterValue(FName(TEXT("Color")), MantleColor);
    ApplyStencil(*Body, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Head, Participant.StencilValue, Participant.bSpeaker);
    ApplyStencil(*Mantle, Participant.StencilValue, Participant.bSpeaker);
}
