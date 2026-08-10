#include "ShiRainField.h"

#include "Components/InstancedStaticMeshComponent.h"
#include "Components/SceneComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"

AShiRainField::AShiRainField()
{
    PrimaryActorTick.bCanEverTick = true;
    PrimaryActorTick.bStartWithTickEnabled = false;
    bReplicates = false;
    USceneComponent* Root = CreateDefaultSubobject<USceneComponent>(TEXT("RainRoot"));
    SetRootComponent(Root);
    StreakInstances = CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("RainStreakInstances"));
    RippleInstances = CreateDefaultSubobject<UInstancedStaticMeshComponent>(TEXT("RainRippleInstances"));
    StreakInstances->SetupAttachment(Root);
    RippleInstances->SetupAttachment(Root);
    for (UInstancedStaticMeshComponent* Component : {StreakInstances.Get(), RippleInstances.Get()})
    {
        Component->SetMobility(EComponentMobility::Movable);
        Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Component->SetGenerateOverlapEvents(false);
        Component->SetCanEverAffectNavigation(false);
        Component->SetCastShadow(false);
        Component->SetReceivesDecals(false);
        Component->SetCullDistances(0, 6500);
    }
    SetActorEnableCollision(false);
}

bool AShiRainField::Initialize(const FShiRainPresentationData& InPresentation, FString& OutError)
{
    if (bPresentationReady)
    {
        OutError = TEXT("Rain field was already initialized.");
        return false;
    }
    if (!FShiRainPresentationModel::Validate(InPresentation, OutError)) return false;
    UStaticMesh* StreakMesh = LoadObject<UStaticMesh>(nullptr, *InPresentation.StreakMeshPath);
    UStaticMesh* RippleMesh = LoadObject<UStaticMesh>(nullptr, *InPresentation.RippleMeshPath);
    UMaterialInterface* StreakMaterial = LoadObject<UMaterialInterface>(nullptr, *InPresentation.StreakMaterialPath);
    UMaterialInterface* RippleMaterial = LoadObject<UMaterialInterface>(nullptr, *InPresentation.RippleMaterialPath);
    if (!StreakMesh || !RippleMesh || !StreakMaterial || !RippleMaterial)
    {
        OutError = TEXT("One or more admitted rain meshes or materials are unavailable.");
        return false;
    }
    Presentation = InPresentation;
    RandomStream.Initialize(Presentation.Seed);
    StreakInstances->SetStaticMesh(StreakMesh);
    StreakInstances->SetMaterial(0, StreakMaterial);
    RippleInstances->SetStaticMesh(RippleMesh);
    RippleInstances->SetMaterial(0, RippleMaterial);
    StreakStates.SetNum(Presentation.StreakInstanceCount);
    RippleStates.SetNum(Presentation.RipplePoolInstanceCount);
    StreakTransforms.SetNum(Presentation.StreakInstanceCount);
    RippleTransforms.SetNum(Presentation.RipplePoolInstanceCount);
    for (int32 Index = 0; Index < StreakStates.Num(); ++Index)
    {
        ResetStreak(Index, true);
        StreakTransforms[Index] = BuildStreakTransform(StreakStates[Index]);
    }
    for (int32 Index = 0; Index < RippleStates.Num(); ++Index)
        RippleTransforms[Index] = BuildRippleTransform(RippleStates[Index]);
    StreakInstances->AddInstances(StreakTransforms, false, false, false);
    RippleInstances->AddInstances(RippleTransforms, false, false, false);
    if (StreakInstances->GetInstanceCount() != Presentation.StreakInstanceCount
        || RippleInstances->GetInstanceCount() != Presentation.RipplePoolInstanceCount)
    {
        OutError = TEXT("Bounded rain instance pools did not initialize exactly.");
        return false;
    }
    bPresentationReady = true;
    SetActorTickEnabled(true);
    OutError.Empty();
    return true;
}

void AShiRainField::ResetStreak(int32 Index, bool bInitial)
{
    FShiRainStreakState& State = StreakStates[Index];
    State.Position.X = RandomStream.FRandRange(-Presentation.FieldHalfExtent.X, Presentation.FieldHalfExtent.X);
    State.Position.Y = RandomStream.FRandRange(-Presentation.FieldHalfExtent.Y, Presentation.FieldHalfExtent.Y);
    const float Impact = FShiRainPresentationModel::ImpactHeightAt(FVector2D(State.Position.X, State.Position.Y));
    State.Position.Z = bInitial
        ? RandomStream.FRandRange(Impact + 2.f, Presentation.SpawnCeiling)
        : Presentation.SpawnCeiling;
    State.WidthScale = RandomStream.FRandRange(.72f, 1.20f);
    State.LengthScale = RandomStream.FRandRange(.58f, 1.08f);
    State.SpeedScale = RandomStream.FRandRange(.88f, 1.12f);
}

void AShiRainField::ActivateRipple(const FVector2D& Position)
{
    FShiRainRippleState& Ripple = RippleStates[NextRippleIndex];
    Ripple.Position = FVector(Position.X, Position.Y, Presentation.GroundIntercept + 1.0f);
    Ripple.AgeSeconds = 0.f;
    Ripple.bActive = true;
    NextRippleIndex = (NextRippleIndex + 1) % RippleStates.Num();
}

FTransform AShiRainField::BuildStreakTransform(const FShiRainStreakState& State) const
{
    const FQuat Rotation = FQuat::FindBetweenNormals(FVector::UpVector,
        -Presentation.Velocity.GetSafeNormal());
    return FTransform(Rotation, State.Position,
        FVector(State.WidthScale, State.WidthScale, State.LengthScale));
}

FTransform AShiRainField::BuildRippleTransform(const FShiRainRippleState& State) const
{
    if (!State.bActive)
        return FTransform(FQuat::Identity, FVector(0.f, 0.f, -10000.f), FVector(.001f));
    const float Progress = FMath::Clamp(State.AgeSeconds / Presentation.RippleLifetimeSeconds, 0.f, 1.f);
    const float Scale = .08f + FMath::Sin(Progress * PI) * .62f;
    return FTransform(FQuat::Identity, State.Position, FVector(Scale, Scale, 1.f));
}

void AShiRainField::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!bPresentationReady) return;
    const float Step = FMath::Clamp(DeltaSeconds, 0.f, Presentation.MaximumDeltaSeconds);
    for (int32 Index = 0; Index < StreakStates.Num(); ++Index)
    {
        FShiRainStreakState& State = StreakStates[Index];
        State.Position += Presentation.Velocity * State.SpeedScale * Step;
        const FVector2D Position(State.Position.X, State.Position.Y);
        if (FMath::Abs(Position.X) > Presentation.FieldHalfExtent.X
            || FMath::Abs(Position.Y) > Presentation.FieldHalfExtent.Y)
        {
            ResetStreak(Index, false);
        }
        else if (State.Position.Z <= FShiRainPresentationModel::ImpactHeightAt(Position))
        {
            if (FShiRainPresentationModel::CanSpawnGroundRipple(Position)) ActivateRipple(Position);
            ResetStreak(Index, false);
        }
        StreakTransforms[Index] = BuildStreakTransform(State);
    }
    for (int32 Index = 0; Index < RippleStates.Num(); ++Index)
    {
        FShiRainRippleState& State = RippleStates[Index];
        if (State.bActive)
        {
            State.AgeSeconds += Step;
            if (State.AgeSeconds >= Presentation.RippleLifetimeSeconds) State.bActive = false;
        }
        RippleTransforms[Index] = BuildRippleTransform(State);
    }
    StreakInstances->BatchUpdateInstancesTransforms(0, StreakTransforms, false, true, true);
    RippleInstances->BatchUpdateInstancesTransforms(0, RippleTransforms, false, true, true);
}

int32 AShiRainField::GetStreakInstanceCount() const
{
    return StreakInstances ? StreakInstances->GetInstanceCount() : 0;
}

int32 AShiRainField::GetRippleInstanceCount() const
{
    return RippleInstances ? RippleInstances->GetInstanceCount() : 0;
}
