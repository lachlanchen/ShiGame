#if WITH_DEV_AUTOMATION_TESTS
#include "Misc/AutomationTest.h"
#include "Engine/World.h"
#include "ShiJinyangFigure.h"
#include "ShiJinyangGameMode.h"
#include "ShiJinyangWorldSave.h"
#include "GameFramework/TouchInterface.h"
#include "InputCoreTypes.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiJinyangExplorationInterface, "SHI.Jinyang.ExplorationInterface",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FShiJinyangExplorationInterface::RunTest(const FString& Arguments)
{
    for(int32 Mask=0;Mask<16;++Mask)
    {
        const bool Hide=Mask&1,Intro=Mask&2,Inspect=Mask&4,Paused=Mask&8;
        TestEqual(TEXT("Only unmodal scenic mode can hide the interface"),
            AShiJinyangGameMode::IsExplorationInterfaceVisible(Hide,Intro,Inspect,Paused),Mask!=1);
    }
    auto* Touch=NewObject<UTouchInterface>();
    AShiJinyangGameMode::NormalizeTouchAxes(nullptr);
    AShiJinyangGameMode::NormalizeTouchAxes(Touch);
    Touch->Controls.SetNum(2);
    Touch->Controls[0].InputScale=FVector2D(-1,-1);
    Touch->Controls[1].InputScale=FVector2D(1,-1);
    AShiJinyangGameMode::NormalizeTouchAxes(Touch);
    TestEqual(TEXT("Moving stick has explicit non-inverted scale"),Touch->Controls[0].InputScale,FVector2D(1,1));
    TestEqual(TEXT("Look stick overrides inverted template pitch"),Touch->Controls[1].InputScale,FVector2D(1,1));
    TestTrue(TEXT("Look maps to the direct-pitch input adapter"),Touch->Controls[1].AltInputKey==EKeys::Gamepad_RightY);
    TestTrue(TEXT("Walking maps to the movement input adapter"),Touch->Controls[0].AltInputKey==EKeys::Gamepad_LeftY);
    return true;
}

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
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiJinyangExplorationSave, "SHI.Jinyang.ExplorationSave",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)
bool FShiJinyangExplorationSave::RunTest(const FString& Arguments)
{
    const TSet<FString> Known={TEXT("quarter"),TEXT("watch")};
    FShiJinyangWorldSave A;A.Position=FVector(-870,-20,210);A.Look=FRotator(-15,95,0);
    A.bEyeLevel=true;A.Visited={TEXT("watch"),TEXT("quarter")};
    FShiJinyangWorldSave B;
    TestTrue(TEXT("Exploration roundtrip parses"),FShiJinyangWorldSave::Read(A.Write(),Known,B));
    TestEqual(TEXT("View, visits and location roundtrip exactly"),B.Write(),A.Write());
    TestFalse(TEXT("Cosmetic save has no campaign history"),A.Write().Contains(TEXT("history")));
    const FString Before=B.Write();
    for(const FString Bad:{TEXT("{\"revision\":1,\"position\":[false,0,100]}"),
        TEXT("{\"revision\":1,\"position\":[-1840,-550,\"100\"]}"),
        TEXT("{\"revision\":2,\"position\":[-1840,-550,100]}"),
        TEXT("{\"revision\":1,\"position\":[90000,0,100]}"),
        TEXT("{\"revision\":1,\"position\":[-1840,-550,100],\"look\":[false,0]}"),
        TEXT("{\"revision\":1,\"position\":[-1840,-550,-100]}"),TEXT("null")})
    {
        TestFalse(TEXT("Malformed/out-of-bounds cosmetic state rejected"),FShiJinyangWorldSave::Read(Bad,Known,B));
        TestEqual(TEXT("Rejected state never partially mutates accepted location"),B.Write(),Before);
    }
    TestTrue(TEXT("Old exploration save remains compatible"),FShiJinyangWorldSave::Read(
        TEXT("{\"revision\":1,\"position\":[-1840,-550,100],\"visited\":[\"quarter\",\"invented\",42]}"),Known,B));
    TestEqual(TEXT("Only known places retained"),B.Visited.Num(),1);
    TestEqual(TEXT("Old save receives default view"),B.Look,FRotator(-12,0,0));
    TestTrue(TEXT("Eye-level default stays off"),!B.bEyeLevel);
    return true;
}
#endif
