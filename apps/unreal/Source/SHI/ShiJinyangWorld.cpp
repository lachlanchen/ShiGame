#include "ShiJinyangGameMode.h"
#include "ShiJinyangExplorer.h"
#include "ShiJinyangFigure.h"
#include "ShiJinyangWorldSave.h"
#include "ShiAtomicSaveFile.h"
#include "ShiSoundscapeComponent.h"
#include "Camera/CameraActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/StaticMesh.h"
#include "Engine/ExponentialHeightFog.h"
#include "Engine/PostProcessVolume.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "Materials/MaterialInterface.h"
#include "Misc/FileHelper.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "InputCoreTypes.h"
#include "Kismet/KismetSystemLibrary.h"
#include "Widgets/SOverlay.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Styling/CoreStyle.h"

bool AShiJinyangGameMode::CreateExplorationWorld()
{
    const FString Base=TEXT("/Game/SHI/Art/JinyangWorld/");
    TArray<UStaticMesh*> Meshes;
    for (const FString Layer : {TEXT("Ground"),TEXT("Architecture"),TEXT("Details"),TEXT("Horizon")})
    {
        const FString N=TEXT("SM_Jinyang_")+Layer;
        auto* Mesh=LoadObject<UStaticMesh>(nullptr,*(Base+N+TEXT(".")+N));
        if (!Mesh) { UE_LOG(LogTemp,Error,TEXT("SHI_WORLD_MISSING %s"),*N);return false; }
        Meshes.Add(Mesh);
    }
    for (int32 I=0;I<Meshes.Num();++I)
    {
        auto* A=GetWorld()->SpawnActor<AStaticMeshActor>();auto* C=A->GetStaticMeshComponent();
        C->SetMobility(EComponentMobility::Movable);C->SetStaticMesh(Meshes[I]);
        // FBX's Blender-to-Unreal handedness flips Y; preserve the canonical site's coordinates.
        A->SetActorScale3D(FVector(1,-1,1));
        C->SetMobility(EComponentMobility::Static);
        C->SetCollisionEnabled(I<2 ? ECollisionEnabled::QueryAndPhysics : ECollisionEnabled::NoCollision);
        C->SetCollisionResponseToAllChannels(ECR_Block);
        if (I>=2) C->SetCollisionResponseToAllChannels(ECR_Ignore);
    }
    // Geometry shares the simulation's sites. The broad water surface is visual, never a floor.
    Water=Box(FVector(450,150,-2),FVector(23,23,.02),FLinearColor(.025,.10,.13));
    Water->SetActorEnableCollision(false);
    auto* Mat=LoadObject<UMaterialInterface>(nullptr,*(Base+TEXT("M_Jinyang_Water.M_Jinyang_Water")));
    if (Mat) Water->GetStaticMeshComponent()->SetMaterial(0,Mat);
    auto* OuterWater=Box(FVector(0,0,-85),FVector(330,330,.02),FLinearColor(.02,.09,.12));
    OuterWater->SetActorEnableCollision(false);
    if (Mat) OuterWater->GetStaticMeshComponent()->SetMaterial(0,Mat);
    GetWorld()->SpawnActor<ASkyAtmosphere>();
    auto* Fog=GetWorld()->SpawnActor<AExponentialHeightFog>(FVector(0,0,-100),FRotator::ZeroRotator);
    Fog->GetComponent()->SetFogDensity(.015f);
    Fog->GetComponent()->SetFogHeightFalloff(.22f);
    Fog->GetComponent()->SetFogInscatteringColor(FLinearColor(.32,.39,.40));
    Fog->GetComponent()->SetStartDistance(1400);
    auto* Post=GetWorld()->SpawnActor<APostProcessVolume>();Post->bUnbound=true;
    Post->Settings.bOverride_AutoExposureMinBrightness=true;Post->Settings.AutoExposureMinBrightness=0;
    Post->Settings.bOverride_AutoExposureMaxBrightness=true;Post->Settings.AutoExposureMaxBrightness=0;
    Post->Settings.bOverride_BloomIntensity=true;Post->Settings.BloomIntensity=.18;
    Post->Settings.bOverride_VignetteIntensity=true;Post->Settings.VignetteIntensity=.22;
    WorldPlaces={{TEXT("quarter"),FVector(-1830,-530,0)},{TEXT("stores"),FVector(-1100,-1280,0)},
        {TEXT("watch"),FVector(-870,-90,0)},{TEXT("flood"),FVector(-520,340,0)}};
    for (const auto& Pair:Sites) WorldPlaces.Add(Pair.Key,Pair.Value);
    GuidePlaces={TEXT("quarter"),TEXT("stores"),TEXT("watch"),TEXT("wall"),TEXT("flood"),
        TEXT("route"),TEXT("han"),TEXT("wei"),TEXT("embankment"),TEXT("zhao"),TEXT("zhi")};
    // Local life is presentation only: residents never create supplies, promises or orders.
    ResidentRoutes={
        {FVector(-2040,-720,2),FVector(-1800,-720,2),FVector(-1320,-720,2)},
        {FVector(-2300,-350,2),FVector(-1960,-350,2),FVector(-1850,-600,2)},
        {FVector(-970,-890,2),FVector(-970,-610,2),FVector(-1350,-610,2)}};
    const FLinearColor Colors[]={FLinearColor(.32,.23,.14),FLinearColor(.25,.30,.23),FLinearColor(.40,.30,.22)};
    for (int32 I=0;I<ResidentRoutes.Num();++I)
    {
        auto* Person=GetWorld()->SpawnActor<AShiJinyangFigure>();
        Person->Initialize(Cube,Sphere,Cylinder,BasicMaterial,Colors[I]);
        Person->SetWalkCollision(true);
        Person->SetSettledPose(ResidentRoutes[I][0],0);
        Residents.Add(Person);ResidentGoingOut.Add(true);ResidentWait.Add(2.f+I*2.f);
    }
    return true;
}
void AShiJinyangGameMode::StartExploration()
{
    auto* PC=GetWorld()->GetFirstPlayerController();if (!PC) return;
    FShiJinyangWorldSave State;FString Saved;TSet<FString> KnownPlaces;
    for (const auto& Pair:WorldPlaces) KnownPlaces.Add(Pair.Key);
    if (FFileHelper::LoadFileToString(Saved,*(SavePath+TEXT(".world.json"))))
    {
        if (!FShiJinyangWorldSave::Read(Saved,KnownPlaces,State))
            UE_LOG(LogTemp,Warning,TEXT("SHI_WORLD_SAVE_IGNORED invalid cosmetic state; campaign untouched"));
    }
    // Old geometry or a malformed cosmetic save cannot strand a player over water.
    FHitResult Floor;
    if (!GetWorld()->LineTraceSingleByChannel(Floor,State.Position,State.Position-FVector(0,0,150),ECC_Visibility)
        || Floor.ImpactNormal.Z<.7f) State.Position=FShiJinyangWorldSave().Position;
    VisitedPlaces=State.Visited;
    FActorSpawnParameters Spawn;Spawn.SpawnCollisionHandlingOverride=ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;
    Explorer=GetWorld()->SpawnActor<AShiJinyangExplorer>(State.Position,FRotator(0,State.Look.Yaw,0),Spawn);
    PC->Possess(Explorer.Get());PC->SetControlRotation(State.Look);PC->SetViewTarget(Explorer.Get());
    Explorer->SetEyeLevel(State.bEyeLevel);Explorer->SetReducedMotion(bReducedMotion);
    bExploring=true;bExploreIntro=true;Explorer->SetWalkingEnabled(false);
    UE_LOG(LogTemp,Display,TEXT("SHI_WORLD_READY position=%s yaw=%.2f eyeLevel=%d visited=%d"),
        *State.Position.ToString(),State.Look.Yaw,State.bEyeLevel,VisitedPlaces.Num());
}
void AShiJinyangGameMode::SaveExploration() const
{
    if (!Explorer.IsValid()) return;
    FShiJinyangWorldSave State;State.Position=Explorer->GetActorLocation();State.Visited=VisitedPlaces;
    State.bEyeLevel=Explorer->IsEyeLevel();
    if (auto* PC=GetWorld()->GetFirstPlayerController())State.Look=PC->GetControlRotation();
    FString Error;
    if (!FShiAtomicSaveFile::WriteUtf8(SavePath+TEXT(".world.json"),State.Write(),Error)) UE_LOG(LogTemp,Warning,TEXT("SHI_WORLD_SAVE %s"),*Error);
}
void AShiJinyangGameMode::ToggleExploration()
{
    if (!Explorer.IsValid() || BusyTime>0 || bExploreIntro || bWorldPaused) return;
    if (bPaused) TogglePause();
    auto* PC=GetWorld()->GetFirstPlayerController();
    bExploring=!bExploring;bWorldInspect=false;
    Explorer->SetWalkingEnabled(bExploring);
    for(const auto& Pair:Markers)if(Pair.Value.IsValid())
    {Pair.Value->SetActorHiddenInGame(bExploring);Pair.Value->SetActorEnableCollision(!bExploring);}
    if (PC) PC->SetViewTarget(bExploring ? static_cast<AActor*>(Explorer.Get()) : static_cast<AActor*>(Camera.Get()));
    if (!bExploring) { SaveExploration();SelectSite(SelectedSite); }
    RefreshScreen();
}
void AShiJinyangGameMode::TickResidents(float Dt)
{
    if (bWorldPaused || bPaused || bExploreIntro) return;
    for (int32 I=0;I<Residents.Num();++I) if (Residents[I].IsValid())
    {
        const bool PlayerNear=bExploring && Explorer.IsValid()
            && FVector::Dist2D(Explorer->GetActorLocation(),Residents[I]->GetActorLocation())<125.f;
        Residents[I]->SetActorTickEnabled(!PlayerNear);
        if(PlayerNear || Residents[I]->IsMoving())continue;
        ResidentWait[I]-=Dt;if (ResidentWait[I]>0)continue;
        TArray<FVector> Route;
        if (ResidentGoingOut[I]) for (int32 J=1;J<ResidentRoutes[I].Num();++J)Route.Add(ResidentRoutes[I][J]);
        else for (int32 J=ResidentRoutes[I].Num()-2;J>=0;--J)Route.Add(ResidentRoutes[I][J]);
        Residents[I]->MoveAlong(Route,I!=1);ResidentGoingOut[I]=!ResidentGoingOut[I];ResidentWait[I]=4.f+I*2.f;
    }
}
void AShiJinyangGameMode::PauseExploration(bool Pause)
{
    bWorldPaused=Pause;Explorer->SetWalkingEnabled(!Pause);
    for (const auto& F:Figures)if(F.IsValid())F->SetActorTickEnabled(!Pause);
    for (const auto& F:Residents)if(F.IsValid())F->SetActorTickEnabled(!Pause);
    if(Pause)SaveExploration();RefreshScreen();
}
FString AShiJinyangGameMode::ExplorationGuide() const
{
    if (!Explorer.IsValid() || GuidePlaces.IsEmpty()) return FString();
    const FString Id=GuidePlaces[GuideIndex];const FVector Delta=WorldPlaces[Id]-Explorer->GetActorLocation();
    const auto* PC=GetWorld()->GetFirstPlayerController();
    const float Relative=FRotator::NormalizeAxis(Delta.Rotation().Yaw-(PC?PC->GetControlRotation().Yaw:0.f));
    const FString Direction=FMath::Abs(Relative)<25 ? Text(TEXT("ahead"),TEXT("前方"))
        : FMath::Abs(Relative)>150 ? Text(TEXT("behind"),TEXT("身后"))
        : Relative>0 ? Text(TEXT("right"),TEXT("右侧")) : Text(TEXT("left"),TEXT("左侧"));
    return FString::Printf(TEXT("%s  ·  %.0f m %s  ·  G"),*PlaceName(Id),Delta.Size2D()/100,*Direction);
}
FString AShiJinyangGameMode::PlaceName(const FString& Id) const
{
    const TMap<FString,FString> En={{TEXT("quarter"),TEXT("The gate quarter")},{TEXT("stores"),TEXT("Raised storehouse")},
        {TEXT("watch"),TEXT("The watch platform")},{TEXT("flood"),TEXT("Water against the city")},
        {TEXT("wall"),TEXT("The defense work party")},{TEXT("embankment"),TEXT("The embankment")},
        {TEXT("route"),TEXT("The northern levee")},{TEXT("han"),TEXT("Han's camp")},
        {TEXT("wei"),TEXT("Wei's camp")},{TEXT("zhi"),TEXT("Zhi's siege line")},{TEXT("zhao"),TEXT("Zhao command")}};
    const TMap<FString,FString> Zh={{TEXT("quarter"),TEXT("城门里坊")},{TEXT("stores"),TEXT("高地仓舍")},
        {TEXT("watch"),TEXT("瞭望台")},{TEXT("flood"),TEXT("水临城下")},{TEXT("wall"),TEXT("守城役夫")},
        {TEXT("embankment"),TEXT("堤口")},{TEXT("route"),TEXT("北侧堤道")},{TEXT("han"),TEXT("韩氏营地")},
        {TEXT("wei"),TEXT("魏氏营地")},{TEXT("zhi"),TEXT("智氏围城军")},{TEXT("zhao"),TEXT("赵氏指挥所")}};
    return (bChinese ? Zh : En).FindRef(Id);
}
FString AShiJinyangGameMode::PlaceStory(const FString& Id) const
{
    if (Id==TEXT("quarter")) return Text(TEXT("Zhao has taken refuge at Jinyang. The people have not abandoned the city, even as the flood reaches their homes. Walk east to meet the defense work party."),TEXT("赵氏退守晋阳。水已入城，百姓仍未离心。沿街向东，可到守城役夫所在的防线。"));
    if (Id==TEXT("stores")) return Text(TEXT("A siege is sustained by what can still be moved and used. In this game, supplies pay for defenses, messengers and an escape route. The storehouse and its contents are a spatial reconstruction."),TEXT("围城之中，物资能否搬运、还能否使用，关系到下一步行动。游戏中，储备用于守城、出使与备好退路。此处仓舍及陈设为场景重构。"));
    if (Id==TEXT("watch")) return Text(TEXT("Three forces surround Zhao. Han and Wei march with Zhi, but their interests are not identical. Climb the short timber stair to read the camps and waterways together."),TEXT("三家之兵围赵。韩、魏虽随智氏出兵，利益却并不相同。登上木阶，可一并观察营地与水道。"));
    if (Id==TEXT("flood")) return Text(TEXT("Tongjian describes flooded hearths and only the upper courses of the wall remaining above water. These walkable levees compress the geography for play; they are not a surveyed reconstruction."),TEXT("《通鉴》记载，灶被淹没，城墙露出水面的只剩三版。眼前堤道为游戏压缩的空间，并非考古复原图。"));
    return SiteReport();
}
void AShiJinyangGameMode::InspectNearby()
{
    if (NearbyPlace.IsEmpty() || bWorldPaused || bExploreIntro) return;
    DefenseChoice.Reset();DefenseError.Reset();
    InspectedPlace=NearbyPlace;VisitedPlaces.Add(NearbyPlace);bWorldInspect=true;
    if (GuidePlaces.IsValidIndex(GuideIndex) && GuidePlaces[GuideIndex]==NearbyPlace)
    { for(int32 I=1;I<=GuidePlaces.Num();++I)if(!VisitedPlaces.Contains(GuidePlaces[(GuideIndex+I)%GuidePlaces.Num()])){GuideIndex=(GuideIndex+I)%GuidePlaces.Num();break;} }
    if (Sites.Contains(NearbyPlace)) SelectedSite=NearbyPlace;
    Explorer->SetWalkingEnabled(false);SaveExploration();RefreshScreen();
    UE_LOG(LogTemp,Display,TEXT("SHI_WORLD_INSPECT place=%s history=%d"),*NearbyPlace,Model.GetState().History.Num());
}
bool AShiJinyangGameMode::IsDefenseStation() const
{
    return bExploring && bWorldInspect
        && (InspectedPlace==TEXT("wall") || InspectedPlace==TEXT("stores"));
}
void AShiJinyangGameMode::ChooseDefenseWork(const FString& Id)
{
    FShiJinyangState After;
    if (!IsDefenseStation() || bWorldPaused || bPaused || BusyTime>0 || bSaveBlocked
        || !Model.PreviewDefense(Id,After)) return;
    DefenseChoice=Id;DefenseError.Reset();RefreshScreen();
    UE_LOG(LogTemp,Display,TEXT("SHI_WORLD_DEFENSE_PREVIEW id=%s history=%d"),*Id,Model.GetState().History.Num());
}
FString AShiJinyangGameMode::DefenseForecast(const FString& Id) const
{
    FShiJinyangState After;
    if (!Model.PreviewDefense(Id,After)) return FString();
    const auto& Before=Model.GetState();
    const auto& Command=Model.GetCommands()[Id];
    FString Summary=bChinese
        ? FString::Printf(TEXT("用时 %d · 消耗储备 %d\n余下时段 %d → %d · 储备 %d → %d"),
            Command.Time,Command.Cost,Before.Deadline-Before.Tick,After.Deadline-After.Tick,Before.Treasury,After.Treasury)
        : FString::Printf(TEXT("%d windows · %d supplies\nTime remaining %d → %d · Supplies %d → %d"),
            Command.Time,Command.Cost,Before.Deadline-Before.Tick,After.Deadline-After.Tick,Before.Treasury,After.Treasury);
    if (Id==TEXT("brace")) Summary+=Text(TEXT("\nShore up the wall: buy time for the envoys."),
        TEXT("\n加固防线，为出使争取时间。"));
    else if (Id==TEXT("diversion")) Summary+=Text(TEXT("\nPrepare the breach. The water stays closed until the operation."),
        TEXT("\n准备堤口；到行动时才决水。"));
    else Summary+=bChinese
        ? FString::Printf(TEXT("\n准备退路，最多容纳 %d 人；不是全军撤离。"),After.ExitCapacity)
        : FString::Printf(TEXT("\nPrepare an exit for at most %d people, not the whole force."),After.ExitCapacity);
    if (After.Watch>Before.Watch) Summary+=bChinese
        ? FString::Printf(TEXT("\n敌军警戒 +%d；可能影响后续行动。"),After.Watch-Before.Watch)
        : FString::Printf(TEXT("\nEnemy watch +%d; later operations may be harder."),After.Watch-Before.Watch);
    if (!After.Outcome.IsEmpty()) Summary+=Text(TEXT("\nWARNING: this order passes the city's deadline and ends the position."),
        TEXT("\n注意：这道命令超过守城期限，将结束当前局势。"));
    return Summary;
}
void AShiJinyangGameMode::DispatchDefenseWork()
{
    FShiJinyangState After;
    if (!IsDefenseStation() || bWorldPaused || bPaused || BusyTime>0 || bSaveBlocked
        || !Model.PreviewDefense(DefenseChoice,After)) return;
    const int32 Before=Model.GetState().History.Num();
    const FString Id=DefenseChoice;
    Issue(Id); // Sole campaign write: validates availability and external save changes.
    if (Model.GetState().History.Num()!=Before+1)
    { DefenseError=Note;RefreshScreen();return; }
    bWorldInspect=false;DefenseChoice.Reset();Explorer->SetWalkingEnabled(true);
    const FString Site=Model.GetCommands()[Id].Site;
    const int32 Destination=GuidePlaces.IndexOfByKey(Site);
    if (Destination!=INDEX_NONE)GuideIndex=Destination;
    RefreshScreen();
    UE_LOG(LogTemp,Display,TEXT("SHI_WORLD_DEFENSE_DISPATCH id=%s history=%d"),*Id,Model.GetState().History.Num());
}
void AShiJinyangGameMode::TickExploration(float Dt)
{
    auto* PC=GetWorld()->GetFirstPlayerController();if (!PC || !Explorer.IsValid()) return;
    if (PC->WasInputKeyJustPressed(EKeys::M) && Sound) {Sound->SetSoundEnabled(!Sound->IsSoundEnabled());RefreshScreen();}
    if (bExploreIntro)
    {
        if (PC->WasInputKeyJustPressed(EKeys::Enter))
        {bExploreIntro=false;Explorer->SetWalkingEnabled(true);if(Sound)Sound->ResumePreferredFromGesture();RefreshScreen();}
        return;
    }
    if (bWorldInspect)
    {
        if (IsDefenseStation())
        {
            if (PC->WasInputKeyJustPressed(EKeys::One))ChooseDefenseWork(TEXT("brace"));
            if (PC->WasInputKeyJustPressed(EKeys::Two))ChooseDefenseWork(TEXT("diversion"));
            if (PC->WasInputKeyJustPressed(EKeys::Three))ChooseDefenseWork(TEXT("escape"));
            if (PC->WasInputKeyJustPressed(EKeys::Enter)){DispatchDefenseWork();return;}
        }
        if (PC->WasInputKeyJustPressed(EKeys::Escape) || PC->WasInputKeyJustPressed(EKeys::E))
        {bWorldInspect=false;Explorer->SetWalkingEnabled(true);RefreshScreen();}
        return;
    }
    if (PC->WasInputKeyJustPressed(EKeys::Escape)) {PauseExploration(!bWorldPaused);return;}
    if (bWorldPaused)
    {
        if(PC->WasInputKeyJustPressed(EKeys::R))
        {bReducedMotion=!bReducedMotion;Explorer->SetReducedMotion(bReducedMotion);RefreshScreen();}
        if(PC->WasInputKeyJustPressed(EKeys::Q))
        {SaveExploration();UKismetSystemLibrary::QuitGame(this,PC,EQuitPreference::Quit,false);}
        return;
    }
    if (PC->WasInputKeyJustPressed(EKeys::BackSpace) && BusyTime>0)SkipMovement();
    if (PC->WasInputKeyJustPressed(EKeys::C)) {Explorer->SetEyeLevel(!Explorer->IsEyeLevel());SaveExploration();}
    if (PC->WasInputKeyJustPressed(EKeys::G)) {GuideIndex=(GuideIndex+1)%GuidePlaces.Num();}
    if (PC->WasInputKeyJustPressed(EKeys::H) && Screen)
    {bHideHud=!bHideHud;Screen->SetVisibility(bHideHud ? EVisibility::Collapsed : EVisibility::SelfHitTestInvisible);}
    if (PC->WasInputKeyJustPressed(EKeys::E)) {InspectNearby();return;}
    const float Forward=(PC->IsInputKeyDown(EKeys::W)?1.f:0.f)-(PC->IsInputKeyDown(EKeys::S)?1.f:0.f);
    const float Side=(PC->IsInputKeyDown(EKeys::D)?1.f:0.f)-(PC->IsInputKeyDown(EKeys::A)?1.f:0.f);
    float MX=0,MY=0;if (PC->IsInputKeyDown(EKeys::RightMouseButton))PC->GetInputMouseDelta(MX,MY);
    const float Turn=(PC->IsInputKeyDown(EKeys::Right)?1.f:0.f)-(PC->IsInputKeyDown(EKeys::Left)?1.f:0.f);
    const float Tilt=(PC->IsInputKeyDown(EKeys::Down)?1.f:0.f)-(PC->IsInputKeyDown(EKeys::Up)?1.f:0.f);
    Explorer->Drive(Forward,Side,MX*.18f+Turn*65.f*Dt,-MY*.16f+Tilt*45.f*Dt,PC->IsInputKeyDown(EKeys::LeftShift),Dt);
    FString Nearest;float Best=240.f;
    for (const auto& Pair:WorldPlaces)
    {
        const float D=FVector::Dist2D(Explorer->GetActorLocation(),Pair.Value);
        if (D<Best) {Best=D;Nearest=Pair.Key;}
    }
    if (Nearest!=NearbyPlace){NearbyPlace=Nearest;RefreshScreen();}
}
void AShiJinyangGameMode::RefreshExplorationScreen()
{
    if (!GEngine || !GEngine->GameViewport)return;
    if (Screen)GEngine->GameViewport->RemoveViewportWidgetContent(Screen.ToSharedRef());
    const FLinearColor Ink(.014,.022,.025,.91),Gold(.76,.58,.30),Paper(.91,.87,.76);
    auto Label=[&](FString S,int32 Size,bool Bold=false)
    {return SNew(STextBlock).Text(FText::FromString(S)).Font(FCoreStyle::GetDefaultFontStyle(Bold?"Bold":"Regular",Size)).ColorAndOpacity(Paper).WrapTextAt(500);};
    auto Panel=[&](TSharedRef<SWidget> Child)
    {return SNew(SBorder).BorderImage(FCoreStyle::Get().GetBrush(TEXT("WhiteBrush"))).BorderBackgroundColor(Ink).Padding(24)[Child];};
    auto Top=SNew(SVerticalBox);
    Top->AddSlot().AutoHeight()[Label(Text(TEXT("SHI  /  JINYANG"),TEXT("势  /  晋阳")),25,true)];
    Top->AddSlot().AutoHeight().Padding(0,7)[Label(Objective(),14)];
    Top->AddSlot().AutoHeight().Padding(0,3)[SNew(STextBlock).Text_Lambda([this](){return FText::FromString(ExplorationGuide());})
        .Font(FCoreStyle::GetDefaultFontStyle("Regular",14)).ColorAndOpacity(Gold)];
    Top->AddSlot().AutoHeight().Padding(0,3)[Label(bChinese
        ? FString::Printf(TEXT("已查看 %d / %d 处 · 步行不消耗回合"),VisitedPlaces.Num(),WorldPlaces.Num())
        : FString::Printf(TEXT("%d / %d places inspected · Walking spends no turn"),VisitedPlaces.Num(),WorldPlaces.Num()),12)];
    const auto& State=Model.GetState();
    if (State.Outcome.IsEmpty())Top->AddSlot().AutoHeight().Padding(0,3)[Label(bChinese
        ? FString::Printf(TEXT("储备 %d · 守城余下 %d 时段"),State.Treasury,FMath::Max(0,State.Deadline-State.Tick))
        : FString::Printf(TEXT("Supplies %d · %d windows before the deadline"),State.Treasury,FMath::Max(0,State.Deadline-State.Tick)),13)];
    auto Controls=SNew(SVerticalBox);
    Controls->AddSlot().AutoHeight()[Label(Text(TEXT("WASD  Walk     Shift  Jog     Right-drag / arrows  Look"),TEXT("WASD 行走    Shift 快步    右键拖动 / 方向键 环视")),13)];
    Controls->AddSlot().AutoHeight().Padding(0,5)[Label(Text(TEXT("E Inspect   V Command   C Eye-level   G Landmark\nEsc Pause   M Sound   H Hide interface"),TEXT("E 查看   V 指挥   C 眼平视角   G 地标\nEsc 暂停   M 声音   H 隐藏界面")),13)];
    auto Overlay=SNew(SOverlay)
        +SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Top).Padding(28)[Panel(Top)]
        +SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Bottom).Padding(28)[Panel(Controls)];
    if (BusyTime>0 && !bWorldInspect && !bWorldPaused)
    {
        auto Work=SNew(SVerticalBox);
        Work->AddSlot().AutoHeight()[Label(Text(TEXT("Order committed · work underway"),TEXT("命令已下达 · 正在执行")),18,true)];
        Work->AddSlot().AutoHeight().Padding(0,7)[Label(Text(TEXT("Follow the workers, or keep exploring. Skipping movement never repeats the order."),
            TEXT("可跟随队伍，也可继续查看城内。略过动作不会重复下令。")),14)];
        Work->AddSlot().AutoHeight().Padding(0,6)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(16,10))
            .Text(FText::FromString(Text(TEXT("Skip movement · Backspace"),TEXT("略过动作 · Backspace"))))
            .OnClicked_Lambda([this](){SkipMovement();return FReply::Handled();})];
        Overlay->AddSlot().HAlign(HAlign_Right).VAlign(VAlign_Top).Padding(28)[SNew(SBox).WidthOverride(400)[Panel(Work)]];
    }
    if (!NearbyPlace.IsEmpty() && !bExploreIntro && !bWorldInspect && !bWorldPaused)
    {
        auto Prompt=SNew(SVerticalBox);Prompt->AddSlot().AutoHeight()[Label(PlaceName(NearbyPlace),22,true)];
        Prompt->AddSlot().AutoHeight().Padding(0,6)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(15,9))
            .Text(FText::FromString(Text(TEXT("Inspect · E"),TEXT("查看 · E"))))
            .OnClicked_Lambda([this](){InspectNearby();return FReply::Handled();})];
        Overlay->AddSlot().HAlign(HAlign_Center).VAlign(VAlign_Bottom).Padding(0,0,0,130)[Panel(Prompt)];
    }
    if (bExploreIntro || bWorldInspect)
    {
        auto Card=SNew(SVerticalBox);
        Card->AddSlot().AutoHeight()[Label(bExploreIntro?Text(TEXT("AN ALLIANCE CAN TURN"),TEXT("合纵之间")):PlaceName(InspectedPlace),28,true)];
        Card->AddSlot().AutoHeight().Padding(0,18)[Label(bExploreIntro?
            Text(TEXT("Jinyang. An earlier flashback in Tongjian's first volume.\n\nZhi's army has brought the water against Zhao. Han and Wei stand with the besiegers—for now. Enter the city, meet its people, and decide where to commit your strength."),
                 TEXT("晋阳。《资治通鉴》卷一追叙的前史。\n\n智氏引水围赵，韩、魏也在围城军中——但他们各有打算。走入城内，查看防线，再决定把力量用在哪里。")):
            IsDefenseStation()?Text(TEXT("Choose the next job. All three draw from the supplies and time you also need for diplomacy."),
                TEXT("先做哪一件？守城、备战与退路，都要用去出使也需要的储备和时间。")):PlaceStory(InspectedPlace),18)];
        if (IsDefenseStation())
        {
            const TArray<FString> Jobs={TEXT("brace"),TEXT("diversion"),TEXT("escape")};
            for (int32 I=0;I<Jobs.Num();++I)
            {
                const FString Id=Jobs[I];const auto& Job=Model.GetCommands()[Id];
                FShiJinyangState Forecast;
                const bool Available=Model.PreviewDefense(Id,Forecast);
                const FString Status=State.History.Contains(Id)?Text(TEXT(" · ordered"),TEXT(" · 已下令")):
                    !Available?Text(TEXT(" · unavailable"),TEXT(" · 当前不可用")):TEXT("");
                const FString Caption=FString::Printf(TEXT("%s%d  %s%s"),DefenseChoice==Id?TEXT("› "):TEXT(""),
                    I+1,*(bChinese?Job.Chinese:Job.English),*Status);
                Card->AddSlot().AutoHeight().Padding(0,4)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(16,10))
                    .IsEnabled(Available && BusyTime<=0 && !bSaveBlocked && !bWorldPaused && !bPaused)
                    .Text(FText::FromString(Caption))
                    .OnClicked_Lambda([this,Id](){ChooseDefenseWork(Id);return FReply::Handled();})];
            }
            if (!DefenseChoice.IsEmpty())
            {
                Card->AddSlot().AutoHeight().Padding(0,8)[Label(DefenseForecast(DefenseChoice),15)];
                Card->AddSlot().AutoHeight().Padding(0,6)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(18,12))
                    .IsEnabled(BusyTime<=0 && !bSaveBlocked && !bWorldPaused && !bPaused)
                    .Text(FText::FromString(Text(TEXT("Dispatch this work · Enter"),TEXT("下令执行 · Enter"))))
                    .OnClicked_Lambda([this](){DispatchDefenseWork();return FReply::Handled();})];
            }
            if (bSaveBlocked)Card->AddSlot().AutoHeight().Padding(0,6)[Label(Note,14)];
            else if (!DefenseError.IsEmpty())Card->AddSlot().AutoHeight().Padding(0,6)[Label(DefenseError,14)];
        }
        Card->AddSlot().AutoHeight().Padding(0,8)[Label(Text(TEXT("Historical situation: Tongjian I. Walkable geography, dress and dialogue are reconstruction."),TEXT("史事依据《通鉴》卷一；可行走地形、衣着及场景表演属重构。")),12)];
        Card->AddSlot().AutoHeight().Padding(0,15)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(20,13))
            .Text(FText::FromString(bExploreIntro?Text(TEXT("Enter the world · Enter"),TEXT("走入世界 · Enter")):Text(TEXT("Return to the world · E"),TEXT("继续行走 · E"))))
            .OnClicked_Lambda([this](){bExploreIntro=false;bWorldInspect=false;Explorer->SetWalkingEnabled(true);if(Sound)Sound->ResumePreferredFromGesture();RefreshScreen();return FReply::Handled();})];
        if (bWorldInspect && Sites.Contains(InspectedPlace))Card->AddSlot().AutoHeight()[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(20,12))
            .Text(FText::FromString(Text(TEXT("Consider orders here · V"),TEXT("在此筹划命令 · V"))))
            .OnClicked_Lambda([this](){ToggleExploration();return FReply::Handled();})];
        Overlay->AddSlot().HAlign(HAlign_Right).VAlign(VAlign_Center).Padding(35)
            [SNew(SBox).WidthOverride(560).MaxDesiredHeight(640)[Panel(SNew(SScrollBox)+SScrollBox::Slot()[Card])]];
    }
    if (bWorldPaused)
    {
        auto Menu=SNew(SVerticalBox);Menu->AddSlot().AutoHeight()[Label(Text(TEXT("Rest a moment"),TEXT("暂歇")),28,true)];
        Menu->AddSlot().AutoHeight().Padding(0,14)[Label(Text(TEXT("Your decisions and position are saved locally."),TEXT("已在本机保留决策与行走位置。")),17)];
        Menu->AddSlot().AutoHeight().Padding(0,8)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(20,14))
            .Text(FText::FromString(Text(TEXT("Return to the world · Esc"),TEXT("继续行走 · Esc"))))
            .OnClicked_Lambda([this](){PauseExploration(false);return FReply::Handled();})];
        Menu->AddSlot().AutoHeight().Padding(0,8)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(20,14))
            .Text(FText::FromString(Text(TEXT("Reduced camera motion · R"),TEXT("减弱镜头运动 · R"))))
            .OnClicked_Lambda([this](){bReducedMotion=!bReducedMotion;Explorer->SetReducedMotion(bReducedMotion);RefreshScreen();return FReply::Handled();})];
        Menu->AddSlot().AutoHeight().Padding(0,8)[Label(bReducedMotion?Text(TEXT("Reduced motion is on"),TEXT("已开启减弱运动")):Text(TEXT("Reduced motion is off"),TEXT("未开启减弱运动")),13)];
        Menu->AddSlot().AutoHeight().Padding(0,8)[SNew(SButton).IsFocusable(false).ContentPadding(FMargin(20,14))
            .Text(FText::FromString(Text(TEXT("Save and leave · Q"),TEXT("保存并退出 · Q"))))
            .OnClicked_Lambda([this](){SaveExploration();UKismetSystemLibrary::QuitGame(this,GetWorld()->GetFirstPlayerController(),EQuitPreference::Quit,false);return FReply::Handled();})];
        Overlay->AddSlot().HAlign(HAlign_Center).VAlign(VAlign_Center)[SNew(SBox).WidthOverride(560)[Panel(Menu)]];
    }
    Screen=Overlay;GEngine->GameViewport->AddViewportWidgetContent(Screen.ToSharedRef(),100);
    Screen->SetVisibility(IsExplorationInterfaceVisible(bHideHud,bExploreIntro,bWorldInspect,bWorldPaused)
        ? EVisibility::SelfHitTestInvisible : EVisibility::Collapsed);
}
