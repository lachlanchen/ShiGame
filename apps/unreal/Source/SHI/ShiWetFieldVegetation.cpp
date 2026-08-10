#include "ShiWetFieldVegetation.h"

#include "Components/HierarchicalInstancedStaticMeshComponent.h"
#include "Components/SceneComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"

AShiWetFieldVegetation::AShiWetFieldVegetation()
{
    PrimaryActorTick.bCanEverTick = false;
    bReplicates = false;
    USceneComponent* Root = CreateDefaultSubobject<USceneComponent>(TEXT("WetFieldVegetationRoot"));
    SetRootComponent(Root);
    StalkInstances = CreateDefaultSubobject<UHierarchicalInstancedStaticMeshComponent>(TEXT("FieldStalkInstances"));
    TuftInstances = CreateDefaultSubobject<UHierarchicalInstancedStaticMeshComponent>(TEXT("LowBladeTuftInstances"));
    StalkInstances->SetupAttachment(Root);
    TuftInstances->SetupAttachment(Root);
    for (UHierarchicalInstancedStaticMeshComponent* Component : {StalkInstances.Get(), TuftInstances.Get()})
    {
        Component->SetMobility(EComponentMobility::Movable);
        Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Component->SetGenerateOverlapEvents(false);
        Component->SetCanEverAffectNavigation(false);
        Component->SetCastShadow(false);
        Component->SetReceivesDecals(false);
        Component->SetCullDistances(400, 5000);
    }
    SetActorEnableCollision(false);
}

bool AShiWetFieldVegetation::Initialize(
    const FShiWetFieldVegetationPresentationData& InPresentation, FString& OutError)
{
    if (bPresentationReady)
    {
        OutError = TEXT("Wet-field vegetation was already initialized.");
        return false;
    }
    if (!FShiWetFieldVegetationPresentationModel::Validate(InPresentation, OutError)) return false;
    UStaticMesh* StalkMesh = LoadObject<UStaticMesh>(nullptr, *InPresentation.StalkMeshPath);
    UStaticMesh* TuftMesh = LoadObject<UStaticMesh>(nullptr, *InPresentation.TuftMeshPath);
    UMaterialInterface* Material = LoadObject<UMaterialInterface>(nullptr, *InPresentation.MaterialPath);
    if (!StalkMesh || !TuftMesh || !Material)
    {
        OutError = TEXT("One or more admitted wet-field vegetation assets are unavailable.");
        return false;
    }
    const FBox StalkBounds = StalkMesh->GetBoundingBox();
    const FBox TuftBounds = TuftMesh->GetBoundingBox();
    const bool bStalkMaterialExact = StalkMesh->GetStaticMaterials().Num() == 1
        && StalkMesh->GetStaticMaterials()[0].MaterialSlotName == FName(TEXT("M_SHI_RainDarkenedFieldPlant"));
    const bool bTuftMaterialExact = TuftMesh->GetStaticMaterials().Num() == 1
        && TuftMesh->GetStaticMaterials()[0].MaterialSlotName == FName(TEXT("M_SHI_RainDarkenedFieldPlant"));
    if (!StalkBounds.Min.Equals(FVector(-34.f, -31.f, 0.f), .08f)
        || !StalkBounds.Max.Equals(FVector(34.f, 30.f, 135.f), .08f)
        || !TuftBounds.Min.Equals(FVector(-45.f, -45.f, 0.f), .08f)
        || !TuftBounds.Max.Equals(FVector(45.f, 45.f, 52.f), .08f)
        || !bStalkMaterialExact || !bTuftMaterialExact)
    {
        OutError = TEXT("Wet-field vegetation runtime bounds or material slots drifted from the admitted meshes.");
        return false;
    }

    const TArray<FTransform> StalkTransforms =
        FShiWetFieldVegetationPresentationModel::BuildStalkTransforms(InPresentation);
    const TArray<FTransform> TuftTransforms =
        FShiWetFieldVegetationPresentationModel::BuildTuftTransforms(InPresentation);
    if (StalkTransforms.Num() != InPresentation.StalkInstanceCount
        || TuftTransforms.Num() != InPresentation.TuftInstanceCount)
    {
        OutError = TEXT("Deterministic wet-field vegetation placement could not fill the exact admitted budget.");
        return false;
    }
    auto ValidateTransforms = [](const TArray<FTransform>& Transforms, float MinimumScale, float MaximumScale)
    {
        for (const FTransform& Transform : Transforms)
        {
            const FVector Location = Transform.GetLocation();
            const FVector Scale = Transform.GetScale3D();
            if (!FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(Location.X, Location.Y))
                || !FMath::IsNearlyEqual(Location.Z, FShiWetFieldVegetationPresentationModel::RootZ(), .001f)
                || !FMath::IsNearlyEqual(Scale.X, Scale.Y, .001f)
                || !FMath::IsNearlyEqual(Scale.Y, Scale.Z, .001f)
                || Scale.X < MinimumScale || Scale.X > MaximumScale)
                return false;
        }
        return true;
    };
    if (!ValidateTransforms(StalkTransforms, InPresentation.StalkMinimumScale, InPresentation.StalkMaximumScale)
        || !ValidateTransforms(TuftTransforms, InPresentation.TuftMinimumScale, InPresentation.TuftMaximumScale))
    {
        OutError = TEXT("Generated wet-field vegetation violated its root clearance or scale envelope.");
        return false;
    }

    Presentation = InPresentation;
    StalkInstances->SetStaticMesh(StalkMesh);
    StalkInstances->SetMaterial(0, Material);
    TuftInstances->SetStaticMesh(TuftMesh);
    TuftInstances->SetMaterial(0, Material);
    StalkInstances->AddInstances(StalkTransforms, false, false, false);
    TuftInstances->AddInstances(TuftTransforms, false, false, false);
    if (StalkInstances->GetInstanceCount() != Presentation.StalkInstanceCount
        || TuftInstances->GetInstanceCount() != Presentation.TuftInstanceCount)
    {
        OutError = TEXT("Hierarchical wet-field vegetation instance counts drifted during initialization.");
        return false;
    }
    bPresentationReady = true;
    OutError.Empty();
    return true;
}

int32 AShiWetFieldVegetation::GetStalkInstanceCount() const
{
    return StalkInstances ? StalkInstances->GetInstanceCount() : 0;
}

int32 AShiWetFieldVegetation::GetTuftInstanceCount() const
{
    return TuftInstances ? TuftInstances->GetInstanceCount() : 0;
}
