#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Engine/World.h"
#include "ShiJinyangFigure.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiJinyangMotionEndpoints, "SHI.Jinyang.MotionEndpoints",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FShiJinyangMotionEndpoints::RunTest(const FString& Arguments)
{
    const auto Initialization = UWorld::InitializationValues().AllowAudioPlayback(false)
        .CreatePhysicsScene(false).CreateNavigation(false).CreateAISystem(false);
    UWorld* World = UWorld::CreateWorld(EWorldType::Game,false,TEXT("JinyangMotionTest"),
        nullptr,true,ERHIFeatureLevel::Num,&Initialization);
    auto* Natural = World->SpawnActor<AShiJinyangFigure>();
    auto* Skipped = World->SpawnActor<AShiJinyangFigure>();
    auto* Resumed = World->SpawnActor<AShiJinyangFigure>();
    const TArray<FVector> Route = {FVector(100,0,0),FVector(100,200,0),FVector(-300,200,0)};
    Natural->SetSettledPose(FVector::ZeroVector,90);
    Skipped->SetSettledPose(FVector::ZeroVector,90);
    Natural->MoveAlong(Route); Skipped->MoveAlong(Route);
    for (int32 I=0; I<1200; ++I) Natural->Tick(1.f/60.f);
    Skipped->Tick(.1f); Skipped->FinishMotion();
    Resumed->SetSettledPose(Route.Last(),180);
    TestFalse(TEXT("Natural route completes"),Natural->IsMoving());
    TestFalse(TEXT("Skip completes route"),Skipped->IsMoving());
    TestTrue(TEXT("Skip matches natural location"),Skipped->GetActorLocation().Equals(Natural->GetActorLocation(),.01f));
    TestTrue(TEXT("Skip matches natural final facing"),Skipped->GetActorRotation().Equals(Natural->GetActorRotation(),.01f));
    TestTrue(TEXT("Cold pose matches natural transform"),Resumed->GetActorTransform().Equals(Natural->GetActorTransform(),.01f));
    // Work stations use a canonical facing, not whichever segment was last seen.
    for (auto* Actor : {Natural,Skipped,Resumed}) Actor->SetSettledPose(FVector(700,166,0),90,true);
    TestTrue(TEXT("Workstation skip/resume facing"),Natural->GetActorTransform().Equals(Skipped->GetActorTransform(),.01f)
        && Natural->GetActorTransform().Equals(Resumed->GetActorTransform(),.01f));
    World->DestroyWorld(false);
    return true;
}
#endif
