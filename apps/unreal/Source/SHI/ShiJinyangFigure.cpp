#include "ShiJinyangFigure.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/CapsuleComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "Engine/StaticMesh.h"

AShiJinyangFigure::AShiJinyangFigure()
{
    PrimaryActorTick.bCanEverTick = true;
    SetRootComponent(CreateDefaultSubobject<USceneComponent>(TEXT("FigureRoot")));
    WalkObstacle=CreateDefaultSubobject<UCapsuleComponent>(TEXT("Walking clearance"));
    WalkObstacle->SetupAttachment(GetRootComponent());WalkObstacle->InitCapsuleSize(27,87);
    WalkObstacle->SetRelativeLocation(FVector(0,0,87));
    WalkObstacle->SetCollisionObjectType(ECC_WorldDynamic);
    WalkObstacle->SetCollisionResponseToAllChannels(ECR_Ignore);
    WalkObstacle->SetCollisionResponseToChannel(ECC_Pawn,ECR_Block);
    WalkObstacle->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    WalkObstacle->SetGenerateOverlapEvents(false);WalkObstacle->SetCanEverAffectNavigation(false);
}
void AShiJinyangFigure::SetWalkCollision(bool Enabled)
{
    WalkObstacle->SetCollisionEnabled(Enabled?ECollisionEnabled::QueryOnly:ECollisionEnabled::NoCollision);
}
void AShiJinyangFigure::Initialize(UStaticMesh* Cube, UStaticMesh* Sphere, UStaticMesh* Cylinder,
    UMaterialInterface* Material, const FLinearColor& Color)
{
    // Articulated under-rig plus original wrapped clothing and a consistent readable face.
    auto* Tunic=LoadObject<UStaticMesh>(nullptr,TEXT("/Game/SHI/Art/JinyangWorld/SM_Jinyang_Tunic.SM_Jinyang_Tunic"));
    auto* Robe=LoadObject<UStaticMesh>(nullptr,TEXT("/Game/SHI/Art/JinyangWorld/SM_Jinyang_Robe.SM_Jinyang_Robe"));
    for (int32 I = 0; I < 32; ++I)
    {
        auto* Part = NewObject<UStaticMeshComponent>(this);
        Part->SetupAttachment(GetRootComponent());
        Part->SetStaticMesh(I == 1 || I == 2 || I == 13 || I == 14 || (I>=20 && I<=22) || (I>=25 && I<=27) || I==29 ? Sphere
            : (I==0 || I==16 || I==17 || I==28 || (I >= 3 && I <= 6) || (I >= 9 && I <= 12)) ? Cylinder : Cube);
        Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        if (I==0 && Tunic) Part->SetStaticMesh(Tunic);
        if (I==16 && Robe) Part->SetStaticMesh(Robe);
        Part->RegisterComponent(); Parts.Add(Part);
        auto* Mat = UMaterialInstanceDynamic::Create(Material, this);
        FLinearColor C = Color;
        if (I == 1 || I == 13 || I == 14) C = FLinearColor(.55f, .37f, .25f);
        if (I == 2 || I == 7 || I == 8) C = FLinearColor(.035f, .03f, .024f);
        if (I == 15) C = FLinearColor(.26f, .13f, .045f);
        if (I==17 || I==28 || I==31) C=FLinearColor(.055,.039,.024);
        if (I==18 || I==19 || I==30) C=FLinearColor(.54,.46,.31);
        if (I==20 || I==25 || I==26) C=FLinearColor(.55,.37,.25);
        if (I==21 || I==22 || I==23 || I==24 || I==27 || I==29) C=FLinearColor(.026,.021,.018);
        Mat->SetVectorParameterValue(TEXT("Color"), C);
        Part->SetMaterial(0, Mat);
    }
    Pose();
}
void AShiJinyangFigure::MoveAlong(const TArray<FVector>& Route, bool Carry)
{
    Waypoints = Route; bCarrying = Carry; bWorking = false; bReceiving = false;
    FVector Previous = GetActorLocation();
    FinalYaw = GetActorRotation().Yaw;
    for (const FVector& Point : Route)
    {
        FVector Delta = Point - Previous; Delta.Z = 0;
        if (!Delta.IsNearlyZero()) FinalYaw = Delta.Rotation().Yaw;
        Previous = Point;
    }
}
void AShiJinyangFigure::SetWorking(bool Working)
{
    bWorking = Working; bCarrying = Working; WorkTime = 0.f;
}
void AShiJinyangFigure::SetReceiving(bool Receiving)
{
    bReceiving = Receiving; Pose();
}
void AShiJinyangFigure::SetSettledPose(const FVector& Location, float Yaw, bool Working)
{
    Waypoints.Empty(); Distance = 0.f; bReceiving = false;
    FinalYaw = Yaw;
    SetActorLocationAndRotation(FVector(Location.X, Location.Y, 2), FRotator(0, Yaw, 0));
    SetWorking(Working); Pose();
}
void AShiJinyangFigure::FinishMotion()
{
    if (Waypoints.Num())
        SetActorLocationAndRotation(FVector(Waypoints.Last().X, Waypoints.Last().Y, 2), FRotator(0, FinalYaw, 0));
    Waypoints.Empty(); Distance = 0.f; Pose();
}
void AShiJinyangFigure::SetExternalLocomotion(bool Enabled, float Speed, float Dt)
{
    bExternal=Enabled;bExternalMoving=Speed>2.f;
    Distance=bExternalMoving ? Distance+Speed*Dt : 0.f;
    Pose();
}
void AShiJinyangFigure::Tick(float Dt)
{
    Super::Tick(Dt);
    if (bExternal) { Pose(); return; }
    if (Waypoints.Num())
    {
        FVector Delta = Waypoints[0] - GetActorLocation(); Delta.Z = 0;
        const float Travel = FMath::Min(Delta.Size(), Dt * (bCarrying ? 85.f : 125.f));
        if (Delta.Size() < 1.f) Waypoints.RemoveAt(0);
        else
        {
            const FVector Direction = Delta.GetSafeNormal();
            SetActorRotation(FMath::RInterpConstantTo(GetActorRotation(), FRotator(0, Direction.Rotation().Yaw, 0), Dt, 180.f));
            SetActorLocation(GetActorLocation() + Direction * Travel);
            Distance += Travel;
            if (Delta.Size() <= Travel + .1f) Waypoints.RemoveAt(0);
        }
    }
    if (!Waypoints.Num())
    {
        Distance = 0.f;
        SetActorRotation(FMath::RInterpConstantTo(GetActorRotation(), FRotator(0, FinalYaw, 0), Dt, 180.f));
    }
    if (bWorking) WorkTime += Dt;
    Pose();
}
void AShiJinyangFigure::Rod(int32 I, const FVector& A, const FVector& B, float Width)
{
    const FVector Delta = B - A;
    Parts[I]->SetRelativeLocation((A + B) * .5f);
    Parts[I]->SetRelativeRotation(FRotationMatrix::MakeFromZ(Delta).Rotator());
    Parts[I]->SetRelativeScale3D(FVector(Width / 100.f, Width / 100.f, Delta.Size() / 100.f));
}
void AShiJinyangFigure::Pose()
{
    if (Parts.Num() != 32) return;
    Parts[0]->SetRelativeLocation(FVector(0, 0, 117));
    Parts[0]->SetRelativeScale3D(FVector(.32, .47, .56));
    Parts[1]->SetRelativeLocation(FVector(0, 0, 160));
    Parts[1]->SetRelativeScale3D(FVector(.28, .26, .32));
    Parts[2]->SetRelativeLocation(FVector(-3, 0, 172));
    Parts[2]->SetRelativeScale3D(FVector(.21, .25, .15));
    const bool Moving = Waypoints.Num() > 0 || bExternalMoving;
    for (int32 Side = 0; Side < 2; ++Side)
    {
        const float Y = Side == 0 ? -12.f : 12.f;
        const float Phase = FMath::Fmod(Distance / 80.f + Side * .5f, 1.f);
        const float Swing = Moving && Phase > .5f ? (Phase - .5f) * 2.f : 0.f;
        const float X = !Moving ? 0.f : Phase <= .5f ? 20.f - Phase * 80.f
            : -20.f + 40.f * Swing;
        const FVector Foot(X, Y, 7.f + (Moving && Phase > .5f ? FMath::Sin(Swing * PI) * 14.f : 0.f));
        const FVector Hip(0, Y, 90);
        const FVector D = Foot - Hip;
        const float Bend = FMath::Sqrt(FMath::Max(0.f, 43.f * 43.f - D.SizeSquared() * .25f));
        const FVector Knee = (Hip + Foot) * .5f + FVector::CrossProduct(D.GetSafeNormal(), FVector(0, 1, 0)).GetSafeNormal() * Bend;
        Rod(3 + Side * 2, Hip, Knee, 13.f); Rod(4 + Side * 2, Knee, Foot, 11.f);
        Parts[7 + Side]->SetRelativeLocation(Foot - FVector(0, 0, 3));
        Parts[7 + Side]->SetRelativeScale3D(FVector(.24, .14, .08));
        const float Sign = Side == 0 ? -1.f : 1.f;
        const FVector Shoulder(0, 24.f * Sign, 137);
        const float Work = bWorking ? FMath::Sin(WorkTime * 2.f) * 2.f : 0.f;
        const FVector Hand = bReceiving && Side == 1 ? FVector(36, 25, 120)
            : bCarrying ? FVector(30.f + Work, 36.f * Sign, 111)
            : FVector(Moving ? FMath::Sin(Phase * 2.f * PI) * 13.f : 2.f, 24.f * Sign, 84);
        const FVector Elbow = bReceiving && Side == 1 ? FVector(12, 30, 118)
            : bCarrying ? FVector(10.f + Work, 32.f * Sign, 112)
            : (Shoulder + Hand) * .5f + FVector(-7, 0, 0);
        Rod(9 + Side * 2, Shoulder, Elbow, 11.f); Rod(10 + Side * 2, Elbow, Hand, 9.f);
        Parts[13 + Side]->SetRelativeLocation(Hand);
        Parts[13 + Side]->SetRelativeScale3D(FVector(.08));
    }
    Parts[15]->SetVisibility(bCarrying);
    Parts[15]->SetRelativeLocation(FVector(30.f + (bWorking ? FMath::Sin(WorkTime * 2.f) * 2.f : 0), 0, 111));
    Parts[15]->SetRelativeScale3D(FVector(.08, .64, .08));
    auto Detail=[this](int32 I,FVector P,FVector Scale,FRotator R=FRotator::ZeroRotator)
    { Parts[I]->SetRelativeLocation(P);Parts[I]->SetRelativeScale3D(Scale);Parts[I]->SetRelativeRotation(R); };
    Detail(16,FVector(0,0,77),FVector(.39,.49,.42));
    Detail(17,FVector(0,0,98),FVector(.35,.48,.06));
    Detail(18,FVector(17,-7,139),FVector(.045,.055,.30),FRotator(0,0,-30));
    Detail(19,FVector(17,7,139),FVector(.045,.055,.30),FRotator(0,0,30));
    Detail(20,FVector(14,0,160),FVector(.065,.05,.08));
    Detail(21,FVector(12,-7,165),FVector(.027,.025,.021));
    Detail(22,FVector(12,7,165),FVector(.027,.025,.021));
    Detail(23,FVector(12,-7,167),FVector(.025,.067,.012));
    Detail(24,FVector(12,7,167),FVector(.025,.067,.012));
    Detail(25,FVector(0,-13,160),FVector(.065,.04,.10));
    Detail(26,FVector(0,13,160),FVector(.065,.04,.10));
    Detail(27,FVector(-5,0,181),FVector(.12,.11,.105));
    Detail(28,FVector(-1,0,172),FVector(.275,.265,.028));
    Detail(29,FVector(10,0,149),FVector(.09,.15,.09));
    Detail(30,FVector(16,5,119),FVector(.038,.065,.35));
    Detail(31,FVector(20,6,76),FVector(.035,.065,.37),FRotator(0,0,Moving ? FMath::Sin(Distance/30)*5 : 0));
}
