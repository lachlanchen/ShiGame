#include "ShiJinyangExplorer.h"
#include "ShiJinyangFigure.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "Materials/MaterialInterface.h"

AShiJinyangExplorer::AShiJinyangExplorer()
{
    PrimaryActorTick.bCanEverTick=true;
    GetCapsuleComponent()->InitCapsuleSize(25,88);
    bUseControllerRotationYaw=false;
    auto* Move=GetCharacterMovement();
    Move->bOrientRotationToMovement=true;Move->RotationRate=FRotator(0,480,0);
    Move->MaxWalkSpeed=190;Move->MaxStepHeight=28;Move->bCanWalkOffLedges=false;
    Move->BrakingDecelerationWalking=900;
    Boom=CreateDefaultSubobject<USpringArmComponent>(TEXT("Walking camera boom"));
    Boom->SetupAttachment(GetRootComponent());Boom->TargetArmLength=360;
    Boom->SocketOffset=FVector(0,45,75);Boom->bUsePawnControlRotation=true;
    Boom->bEnableCameraLag=true;Boom->CameraLagSpeed=8;Boom->ProbeSize=15;
    View=CreateDefaultSubobject<UCameraComponent>(TEXT("Walking camera"));
    View->SetupAttachment(Boom);View->FieldOfView=68;
}
void AShiJinyangExplorer::BeginPlay()
{
    Super::BeginPlay();LastDryPosition=GetActorLocation();
    Body=GetWorld()->SpawnActor<AShiJinyangFigure>();
    Body->Initialize(LoadObject<UStaticMesh>(nullptr,TEXT("/Engine/BasicShapes/Cube.Cube")),
        LoadObject<UStaticMesh>(nullptr,TEXT("/Engine/BasicShapes/Sphere.Sphere")),
        LoadObject<UStaticMesh>(nullptr,TEXT("/Engine/BasicShapes/Cylinder.Cylinder")),
        LoadObject<UMaterialInterface>(nullptr,TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")),
        FLinearColor(.07,.17,.20));
    Body->AttachToActor(this,FAttachmentTransformRules::SnapToTargetNotIncludingScale);
    Body->SetActorRelativeLocation(FVector(0,0,-88));
    Body->SetExternalLocomotion(true,0,0);
}
void AShiJinyangExplorer::Drive(float Forward,float Side,float Yaw,float Pitch,bool Sprint,float Dt)
{
    if (!Controller || !bWalkingEnabled) return;
    FRotator R=Controller->GetControlRotation();R.Yaw+=Yaw;R.Pitch=FMath::Clamp(FRotator::NormalizeAxis(R.Pitch)+Pitch,-50.f,12.f);R.Roll=0;
    Controller->SetControlRotation(R);
    GetCharacterMovement()->MaxWalkSpeed=Sprint ? 300.f : 190.f;
    const FRotator Flat(0,R.Yaw,0);
    AddMovementInput(Flat.Vector(),Forward);
    AddMovementInput(FRotationMatrix(Flat).GetUnitAxis(EAxis::Y),Side);
}
void AShiJinyangExplorer::SetWalkingEnabled(bool Enabled)
{
    bWalkingEnabled=Enabled;
    if (!Enabled) GetCharacterMovement()->StopMovementImmediately();
}
void AShiJinyangExplorer::SetEyeLevel(bool Enabled)
{
    bEyeLevel=Enabled;
    Boom->TargetArmLength=Enabled ? 0.f : 360.f;
    Boom->SocketOffset=Enabled ? FVector(0,0,72) : FVector(0,45,75);
    if (Body.IsValid()) Body->SetActorHiddenInGame(Enabled);
}
void AShiJinyangExplorer::SetReducedMotion(bool Enabled)
{
    Boom->bEnableCameraLag=!Enabled;
}
void AShiJinyangExplorer::Tick(float Dt)
{
    Super::Tick(Dt);
    // Floodwater is not a hidden walking floor. Recover safely if a malformed edge is reached.
    if (GetActorLocation().Z < 60 || GetActorLocation().ContainsNaN())
    { SetActorLocation(LastDryPosition);GetCharacterMovement()->StopMovementImmediately(); }
    else if (GetCharacterMovement()->IsMovingOnGround()) LastDryPosition=GetActorLocation();
    if (Body.IsValid()) Body->SetExternalLocomotion(true,GetVelocity().Size2D(),Dt);
}
