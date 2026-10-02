#include "ShiJinyangGameMode.h"
#include "ShiJinyangFigure.h"
#include "ShiSoundscapeComponent.h"
#include "ShiAtomicSaveFile.h"
#include "AudioMixerBlueprintLibrary.h"
#include "Components/AudioComponent.h"
#include "Camera/CameraActor.h"
#include "Camera/CameraComponent.h"
#include "Components/LightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SkyLightComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/SkyLight.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "Engine/HitResult.h"
#include "GameFramework/PlayerController.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Misc/Guid.h"
#include "Misc/App.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "InputCoreTypes.h"
#include "Widgets/SOverlay.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Styling/CoreStyle.h"

AShiJinyangGameMode::AShiJinyangGameMode()
{
    PrimaryActorTick.bCanEverTick = true; DefaultPawnClass = nullptr;
}
FString AShiJinyangGameMode::Text(const TCHAR* En, const TCHAR* Zh) const { return bChinese ? Zh : En; }
void AShiJinyangGameMode::BeginPlay()
{
    Super::BeginPlay();
    FString Locale; FParse::Value(FCommandLine::Get(), TEXT("ShiLocale="), Locale);
    bChinese = Locale == TEXT("zh-Hans") || Locale == TEXT("zh");
    bReducedMotion = FParse::Param(FCommandLine::Get(), TEXT("ShiReducedMotion"));
    bAudioReview = FParse::Param(FCommandLine::Get(), TEXT("ShiAudioReview"));
    int32 Version = FParse::Param(FCommandLine::Get(),TEXT("ShiJinyangLegacy")) ? 1 : 2;
    SavePath = FPaths::ProjectSavedDir() / FString::Printf(TEXT("Jinyang/chronicle.v%d.json"),Version);
    FString Override;
    if (FParse::Value(FCommandLine::Get(), TEXT("ShiJinyangSave="), Override))
        SavePath = FPaths::ConvertRelativePathToFull(Override);
    FString Error;
    // Replay a supplied legacy chronicle under its original rules; never append a new battle to an earned ending.
    if (FPaths::FileExists(SavePath) && FFileHelper::LoadFileToString(LastSaved,*SavePath))
    {
        TSharedPtr<FJsonObject> Saved; double SavedVersion=0;
        if (FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(LastSaved),Saved) && Saved
            && Saved->TryGetNumberField(TEXT("revision"),SavedVersion) && (SavedVersion==1 || SavedVersion==2))
            Version=static_cast<int32>(SavedVersion);
    }
    if (!FFileHelper::LoadFileToString(DefinitionText, *(FPaths::ProjectContentDir() / FString::Printf(TEXT("StreamingAssets/jinyang.v%d.json"),Version)))
        || !Model.Initialize(DefinitionText, Error))
    { Note = TEXT("Jinyang definition unavailable: ") + Error; bSaveBlocked = true; RefreshScreen(); return; }
    if (FPaths::FileExists(SavePath))
    {
        if (!FFileHelper::LoadFileToString(LastSaved, *SavePath) || !Model.Restore(LastSaved, Error))
        { bSaveBlocked = true; Note = Text(TEXT("Save cannot be restored. File preserved. Choose a separate chronicle path."), TEXT("无法恢复存档。原文件已保留，请使用独立的纪事文件。")); }
    }
    else
    {
        LastSaved = Model.ExportSave();
        if (!FShiAtomicSaveFile::WriteUtf8(SavePath, LastSaved, Error))
        { bSaveBlocked = true; Note = Error; }
    }
    CreateWorld(); ApplySettledVisuals(true);
    Sound = NewObject<UShiSoundscapeComponent>(this);
    Sound->RegisterComponent();
    if (Sound->LoadCanonical(Error)) Sound->SetAmbienceActive(true);
    else Note = Text(TEXT("Provisional sound unavailable; orders remain playable."), TEXT("临时音效不可用，仍可继续操作。"));
    SelectSite(TEXT("wall"));
    if (!Model.GetState().Operation.Phase.IsEmpty()) SetOperationVisuals(true);
    if (!Model.GetState().Outcome.IsEmpty()) SetOutcomeCamera();
    RefreshScreen();
    UE_LOG(LogTemp, Display, TEXT("SHI_JINYANG_READY history=%d save=%s blockout=true"), Model.GetState().History.Num(), *SavePath);
}
AStaticMeshActor* AShiJinyangGameMode::Box(const FVector& P, const FVector& Scale, const FLinearColor& Color)
{
    auto* A = GetWorld()->SpawnActor<AStaticMeshActor>(P, FRotator::ZeroRotator);
    auto* Mesh = A->GetStaticMeshComponent(); Mesh->SetMobility(EComponentMobility::Movable);
    Mesh->SetStaticMesh(Cube); A->SetActorScale3D(Scale);
    auto* M = UMaterialInstanceDynamic::Create(BasicMaterial, this);
    M->SetVectorParameterValue(TEXT("Color"), Color); Mesh->SetMaterial(0, M);
    return A;
}
AShiJinyangFigure* AShiJinyangGameMode::Figure(const FVector& P, const FLinearColor& Color)
{
    auto* A = GetWorld()->SpawnActor<AShiJinyangFigure>(FVector(P.X, P.Y, 2), FRotator::ZeroRotator);
    A->Initialize(Cube, Sphere, Cylinder, BasicMaterial, Color); Figures.Add(A); return A;
}
void AShiJinyangGameMode::CreateWorld()
{
    Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    Sphere = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    Cylinder = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    BasicMaterial = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    if (!Cube || !Sphere || !Cylinder || !BasicMaterial)
    { bSaveBlocked = true; Note = TEXT("Required engine blockout meshes are unavailable."); return; }
    for (const auto& Raw : Model.GetDefinition()->GetArrayField(TEXT("sites")))
    {
        const auto S = Raw->AsObject(); const auto P = S->GetArrayField(TEXT("position"));
        Sites.Add(S->GetStringField(TEXT("id")), FVector(P[0]->AsNumber(), P[1]->AsNumber(), P[2]->AsNumber()));
    }
    // Deliberately compressed schematic terrain, not archaeological measurement.
    Box(FVector(400, 200, -75), FVector(38, 31, 1.5), FLinearColor(.15, .12, .075));
    Water = Box(FVector(450, 150, -.5), FVector(23, 23, .02), FLinearColor(.055, .18, .23));
    Box(FVector(-650, -300, -18), FVector(12, 12, .4), FLinearColor(.28, .23, .15));
    Box(FVector(-240, -140, 100), FVector(.55, 6.2, 2), FLinearColor(.30, .24, .15));
    Box(FVector(-240, -750, 100), FVector(.55, 1.4, 2), FLinearColor(.30, .24, .15));
    Box(FVector(-850, 160, 100), FVector(4.7, .55, 2), FLinearColor(.30, .24, .15));
    Box(FVector(-320, 160, 100), FVector(1.7, .55, 2), FLinearColor(.30, .24, .15));
    Box(FVector(-500, 650, -18), FVector(2, 14, .4), FLinearColor(.31, .27, .18));
    Box(FVector(300, 900, -18), FVector(18, 2, .4), FLinearColor(.31, .27, .18));
    Box(FVector(700, 500, -18), FVector(2, 7, .4), FLinearColor(.27, .24, .14));
    Box(FVector(850, -580, -18), FVector(13, 2, .4), FLinearColor(.31, .27, .18));
    // Raised lanes connect the same routes used by the figures. No walking across floodwater.
    Box(FVector(1100, 160, -18), FVector(2.6, 17, .4), FLinearColor(.31, .27, .18));
    Box(FVector(700, -210, -18), FVector(2, 9, .4), FLinearColor(.31, .27, .18));
    Box(FVector(900, 140, -18), FVector(4, 1.5, .4), FLinearColor(.31,.27,.18));
    Box(FVector(1260, 450, -18), FVector(3.6, 4.5, .4), FLinearColor(.31, .27, .18));
    Box(FVector(1850, 450, -18), FVector(7.8, 4.5, .4), FLinearColor(.31, .27, .18));
    Box(FVector(720, 250, 35), FVector(5, 1, .7), FLinearColor(.26, .21, .14));
    for (const auto& Pair : Sites)
    {
        const FLinearColor C = Pair.Key == TEXT("han") ? FLinearColor(.58, .34, .18)
            : Pair.Key == TEXT("wei") ? FLinearColor(.23, .46, .30)
            : Pair.Key == TEXT("zhi") ? FLinearColor(.42, .19, .17) : FLinearColor(.14, .32, .45);
        const FVector P = Pair.Value;
        auto* Marker = Box(P + FVector(0, 0, 18), FVector(.45, .45, .36), C);
        Marker->Tags.Add(FName(*Pair.Key)); Markers.Add(Pair.Key, Marker);
        if (Pair.Key == TEXT("han") || Pair.Key == TEXT("wei") || Pair.Key == TEXT("zhi"))
        {
            Box(P + FVector(0, 0, -18), FVector(5.2, 4.5, .4), FLinearColor(.3, .26, .17));
            Box(P + FVector(100, 0, 65), FVector(1.4, 1.7, 1.3), C);
            if (Pair.Key != TEXT("zhi"))
            {
                Box(P + FVector(-140, 100, 90), FVector(.035,.035,1.8), FLinearColor(.22,.13,.06));
                Signals.Add(Pair.Key, Box(P + FVector(-140,100,65), FVector(.7,.035,.35), C));
            }
        }
    }
    CreateFigures();
    auto* Sun = GetWorld()->SpawnActor<ADirectionalLight>(FVector(0, 0, 1400), FRotator(-38, -32, 0));
    Sun->GetLightComponent()->SetIntensity(4.f);
    Sun->GetLightComponent()->SetLightColor(FLinearColor(1.f, .89f, .71f));
    auto* Sky = GetWorld()->SpawnActor<ASkyLight>();
    Sky->GetLightComponent()->SetMobility(EComponentMobility::Movable);
    Sky->GetLightComponent()->SetIntensity(.7f);
    Sky->GetLightComponent()->RecaptureSky();
    Camera = GetWorld()->SpawnActor<ACameraActor>();
    Camera->GetCameraComponent()->FieldOfView = 60;
    if (auto* PC = GetWorld()->GetFirstPlayerController())
    {
        PC->bShowMouseCursor = true; PC->SetViewTarget(Camera.Get());
        FInputModeGameAndUI Mode; Mode.SetHideCursorDuringCapture(false);
        Mode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock); PC->SetInputMode(Mode);
    }
}
void AShiJinyangGameMode::CreateFigures()
{
    // Explicit role order; never rely on TMap iteration for who joins an operation.
    const FLinearColor Colors[] = {FLinearColor(.58,.34,.18), FLinearColor(.23,.46,.30), FLinearColor(.42,.19,.17)};
    const FString CampIds[] = {TEXT("han"), TEXT("wei"), TEXT("zhi")};
    for (int32 C = 0; C < 3; ++C) for (int32 I = 0; I < 4; ++I)
        Figure(Sites[CampIds[C]] + FVector(-80 + I * 60, -150, 0), Colors[C]);
    for (int32 I = 0; I < 4; ++I) Figure(FVector(-700 + I * 65, -270, 0), FLinearColor(.13,.29,.39));
    Figure(FVector(-430,-100,0), FLinearColor(.34,.31,.23));
    Figure(FVector(-480,-130,0), FLinearColor(.39,.35,.26));
    Envoy = Figure(Sites[TEXT("zhao")] + FVector(90,70,0), FLinearColor(.37,.31,.22));
}
FVector AShiJinyangGameMode::ForceDestination(int32 I) const
{
    const auto& S = Model.GetState();
    if (S.Outcome == TEXT("costly-withdrawal") && I >= 12)
        return FVector(-550, 530 + (I - 12) * 80, 0);
    const int32 Slot = I % 4;
    if (S.Outcome == TEXT("coordinated-reversal"))
        return FVector(I < 4 ? 1320 : I < 8 ? 1400 : I < 12 ? 1930 : 1480, 280 + Slot * 65, 0);
    if (S.Outcome == TEXT("isolated-defeat") && !S.Operation.Phase.IsEmpty() && I>=12)
        return FVector(1260,280+Slot*65,0);
    if (I >= 8 && I < 12) return FVector(1100, 280 + Slot * 65, 0);
    return FVector(I < 4 ? 1300 : I < 8 ? 1380 : 1100, 280 + Slot * 65, 0);
}
TArray<FVector> AShiJinyangGameMode::ForceRoute(int32 I) const
{
    const FVector End = ForceDestination(I);
    const float Lane = 1020 + (I % 4) * 52;
    const float Lower = -646 + (I % 4) * 44;
    const float Upper = 842 + (I % 4) * 38;
    if (Model.GetState().Outcome == TEXT("costly-withdrawal"))
        return {FVector(-568 + (I - 12) * 18, -100, 0), End};
    if (I < 4) return {FVector(Figures[I]->GetActorLocation().X, Upper, 0), FVector(Lane, Upper, 0), FVector(Lane, End.Y, 0), End};
    if (I < 8) return {FVector(Figures[I]->GetActorLocation().X, Lower, 0), FVector(Lane, Lower, 0), FVector(Lane, End.Y, 0), End};
    if (I < 12) return {End};
    return {FVector(-540 + (I % 4) * 30, Lower, 0), FVector(Lane, Lower, 0), FVector(Lane, End.Y, 0), End};
}
FString AShiJinyangGameMode::Objective() const
{
    if (!Model.GetDefinition()) return Note;
    if (BusyTime > 0) return Text(TEXT("The order is underway. Follow the movement or pause to inspect."), TEXT("命令正在执行。观察行动，或暂停查看局势。"));
    const auto& S = Model.GetState();
    if (!S.Outcome.IsEmpty()) return Text(TEXT("Review what survived and what the settlement will owe."), TEXT("查看留下的力量，以及分配时需要兑现的承诺。"));
    if (!S.Operation.Phase.IsEmpty())
        return S.Operation.Phase==TEXT("deployment") ? Text(TEXT("Secure the embankment. Choose a screen or a rush."),TEXT("夺取堤道。选择分兵掩护，或直接突进。"))
            : S.Operation.Phase==TEXT("breach") ? Text(TEXT("Your force is in position. Order the breach opened."),TEXT("队伍已就位。下令打开缺口。"))
            : S.Operation.Phase==TEXT("disrupted") ? (S.Exit
                ? Text(TEXT("The guard stopped the breach. Commit the reserve or use the prepared exit."),TEXT("守军阻断了决水。投入后队，或按预案撤离。"))
                : Text(TEXT("The guard stopped the breach. Send the reserve before attacking the front."),TEXT("守军阻断了决水。先投入后队夺回堤口，再攻正面。")))
            : Text(TEXT("The water is through. Hold for the allied flanks or advance now."),TEXT("水已冲入敌营。等待两翼合击，或立即进攻。"));
    if (S.Window >= 0) return Text(TEXT("Compare the agreed date with force readiness. Act, reschedule or withdraw."), TEXT("核对约定日期与集结进度，再行动、改期或撤离。"));
    if (S.Relayed) return Text(TEXT("Both sides received the pledges. Agree on a date they can meet."), TEXT("双方已收到承诺。约定能够共同赴约的日期。"));
    if (!S.Allies[TEXT("han")].Mission.IsEmpty() || !S.Allies[TEXT("wei")].Mission.IsEmpty())
        return Text(TEXT("Contact the other camp, then relay their conditional pledges."), TEXT("联络另一座营地，再转达双方附有条件的承诺。"));
    return Text(TEXT("Keep the city usable. Prepare an operation or a way out."), TEXT("守住可用的阵地，准备行动，或留出退路。"));
}
FString AShiJinyangGameMode::SiteReport() const
{
    if (!Model.GetDefinition()) return Note;
    if (BusyTime > 0) return Text(TEXT("The people are carrying out the saved order."), TEXT("人们正在执行已存档的命令。"));
    const auto& S = Model.GetState();
    if (!S.Operation.Phase.IsEmpty() && S.Outcome.IsEmpty()) return OperationReport();
    if (SelectedSite == TEXT("han") || SelectedSite == TEXT("wei"))
    {
        const auto& A = S.Allies[SelectedSite];
        if (!A.Proposal)
        {
            const int32 Escort=static_cast<int32>(Model.GetDefinition()->GetObjectField(TEXT("parameters"))->GetNumberField(TEXT("escortForce")));
            return bChinese ? FString::Printf(TEXT("尚未联络。秘密出使较慢；护卫随行较快，但需抽调 %d 兵力，并会引起敌军注意。"),Escort)
                : FString::Printf(TEXT("No contact yet. Quiet travel is slower. An escort arrives sooner, ties up %d troops and attracts enemy attention."),Escort);
        }
        const FString Date = A.AgreedWindow < 0 ? Text(TEXT("not yet"), TEXT("尚未")) : FString::FromInt(A.AgreedWindow);
        const FString Decision = Model.AllyResponse(SelectedSite)->GetStringField(TEXT("decision"));
        const FString Reply = Decision == TEXT("stay") ? Text(TEXT("The camp declines: the exposed plan is too risky."), TEXT("营中拒绝：计划暴露的风险太大。"))
            : Decision == TEXT("withhold") ? Text(TEXT("Troops held: the other camp's pledge is missing."), TEXT("按兵不动：尚无另一方的承诺。"))
            : A.AgreedWindow < 0 ? Text(TEXT("Both pledges received. A date is still needed."), TEXT("已收到双方承诺，仍须约定日期。"))
            : A.AgreedWindow < A.ReadyAt ? Text(TEXT("Date acknowledged, but the force cannot assemble in time."), TEXT("已确认日期，但军队来不及集结。"))
            : Text(TEXT("Agreed date allows assembly. Raised signal, troops still held."), TEXT("约定日期容得下集结。信号升起，军队仍待行动。"));
        return Reply + (bChinese ? FString::Printf(TEXT("\n集结时段：%d · 已确认日期：%s。"), A.ReadyAt, *Date)
            : FString::Printf(TEXT("\nAssembly: window %d · acknowledged date: %s."), A.ReadyAt, *Date));
    }
    if (SelectedSite == TEXT("zhi")) return Text(TEXT("The opposing camp watches exposed preparations. You cannot order its forces."), TEXT("敌营会注意暴露的准备。你无权指挥其军队。"));
    if (SelectedSite == TEXT("route")) return S.Exit
        ? Text(TEXT("The exit is prepared, with room for only part of the force."), TEXT("退路已经准备，只能带走一部分力量。"))
        : Text(TEXT("A withdrawal needs preparation before the position is lost."), TEXT("必须在阵地失守前准备撤离。"));
    const int32 DisplayForce = S.Estate ? static_cast<int32>(S.Estate->GetNumberField(TEXT("survivingForce"))) : S.Force;
    const int32 DisplayTreasury = S.Estate ? static_cast<int32>(S.Estate->GetNumberField(TEXT("treasury"))) : S.Treasury;
    FString Report = bChinese ? FString::Printf(TEXT("当前时段 %d · 阵地可维持至 %d · 储备 %d · 可调兵力 %d"), S.Tick, S.Deadline, DisplayTreasury, DisplayForce)
        : FString::Printf(TEXT("Current window %d · city holds through %d · reserves %d · available force %d"), S.Tick, S.Deadline, DisplayTreasury, DisplayForce);
    if (SelectedSite == TEXT("zhao") && S.Window >= 0)
        Report += bChinese ? FString::Printf(TEXT("\n约定行动：%d · 韩集结：%d · 魏集结：%d"), S.Window, S.Allies[TEXT("han")].ReadyAt, S.Allies[TEXT("wei")].ReadyAt)
            : FString::Printf(TEXT("\nAgreed operation: %d · Han ready: %d · Wei ready: %d"), S.Window, S.Allies[TEXT("han")].ReadyAt, S.Allies[TEXT("wei")].ReadyAt);
    return Report;
}
TArray<FString> AShiJinyangGameMode::ContextCommands() const
{
    TArray<FString> Out;
    for (const auto& Id : Model.Available()) if (Model.GetCommands()[Id].Site == SelectedSite) Out.Add(Id);
    return Out;
}
int32 AShiJinyangGameMode::CommandKey(const FString& Id) const
{
    // A command keeps its key when another command becomes unavailable.
    if (Id == TEXT("withdraw") || Id.StartsWith(TEXT("escort-")) || Id == TEXT("early-date")
        || Id==TEXT("rush-embankment") || Id==TEXT("press-attack")) return 2;
    if (Id == TEXT("aligned-date")) return 3;
    if (Id == TEXT("wait")) return 4;
    if (Id == TEXT("execute")) return 5;
    return 1;
}
void AShiJinyangGameMode::SelectSite(const FString& Id)
{
    if (!Sites.Contains(Id)) return;
    bFollowingEnvoy = false;
    SelectedSite = Id;
    UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_SITE site=%s"),*Id);
    const FVector P = Sites[Id];
    CameraTarget = bPaused ? FVector(450, -1650, 1950) : P + FVector(-480, -620, 520);
    RotationTarget = (P + FVector(0, 0, 60) - CameraTarget).Rotation();
    if (bReducedMotion && Camera.IsValid()) Camera->SetActorLocationAndRotation(CameraTarget, RotationTarget);
    RefreshScreen();
}
void AShiJinyangGameMode::RefreshScreen()
{
    if (!GEngine || !GEngine->GameViewport) return;
    if (Screen) GEngine->GameViewport->RemoveViewportWidgetContent(Screen.ToSharedRef());
    auto Top = SNew(SVerticalBox);
    Top->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(Text(TEXT("JINYANG · ZHAO COMMAND"), TEXT("晋阳 · 赵氏指挥")))).Font(FCoreStyle::GetDefaultFontStyle("Bold", 24))];
    Top->AddSlot().AutoHeight().Padding(0, 8)[SNew(STextBlock).Text(FText::FromString(Objective())).Font(FCoreStyle::GetDefaultFontStyle("Regular", 18)).WrapTextAt(650)];
    Top->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(Text(TEXT("Development motion blockout · earlier Tongjian flashback · reconstructed orders"), TEXT("动作灰盒开发版 · 通鉴前史 · 操作属游戏重构")))).Font(FCoreStyle::GetDefaultFontStyle("Regular", 12))];
    auto SitesBar = SNew(SHorizontalBox);
    if (Model.GetDefinition()) for (const auto& Raw : Model.GetDefinition()->GetArrayField(TEXT("sites")))
    {
        const auto Object = Raw->AsObject(); const FString Id = Object->GetStringField(TEXT("id"));
        const TMap<FString, FString> ShortEn = {{TEXT("wall"),TEXT("Wall")},{TEXT("embankment"),TEXT("Dam")},{TEXT("route"),TEXT("Exit")},{TEXT("han"),TEXT("Han")},{TEXT("wei"),TEXT("Wei")},{TEXT("zhi"),TEXT("Zhi")},{TEXT("zhao"),TEXT("Zhao")}};
        const TMap<FString, FString> ShortZh = {{TEXT("wall"),TEXT("防线")},{TEXT("embankment"),TEXT("堤道")},{TEXT("route"),TEXT("退路")},{TEXT("han"),TEXT("韩营")},{TEXT("wei"),TEXT("魏营")},{TEXT("zhi"),TEXT("智营")},{TEXT("zhao"),TEXT("指挥")}};
        const FString Label = (Id == SelectedSite ? TEXT("[") : TEXT(""))
            + (bChinese ? ShortZh[Id] : ShortEn[Id]) + (Id == SelectedSite ? TEXT("]") : TEXT(""));
        SitesBar->AddSlot().AutoWidth().Padding(2)[SNew(SBox).WidthOverride(68).HeightOverride(44)
            [SNew(SButton).ContentPadding(FMargin(4)).HAlign(HAlign_Center).VAlign(VAlign_Center).Text(FText::FromString(Label))
            .OnClicked_Lambda([this, Id]() { SelectSite(Id); return FReply::Handled(); })]];
    }
    auto Context = SNew(SVerticalBox);
    Context->AddSlot().AutoHeight().Padding(0, 8)[SNew(STextBlock).Text(FText::FromString(SiteReport())).WrapTextAt(430).Font(FCoreStyle::GetDefaultFontStyle("Regular", 16))];
    const auto Actions = ContextCommands();
    for (int32 I = 0; I < Actions.Num(); ++I)
    {
        const FString Id = Actions[I]; const auto& C = Model.GetCommands()[Id];
        FString Label = bChinese
            ? FString::Printf(TEXT("%d  %s · %d 时段 / %d 储备"), CommandKey(Id), *C.Chinese, C.Time, C.Cost)
            : FString::Printf(TEXT("%d  %s · %d windows / %d reserves"), CommandKey(Id), *C.English, C.Time, C.Cost);
        if (!Model.GetState().Operation.Phase.IsEmpty()) Label=bChinese
            ? FString::Printf(TEXT("%d  %s · 储备 %d"),CommandKey(Id),*C.Chinese,C.Cost)
            : FString::Printf(TEXT("%d  %s · reserves %d"),CommandKey(Id),*C.English,C.Cost);
        Context->AddSlot().AutoHeight().Padding(0, 3)[SNew(SButton).ContentPadding(FMargin(8,7))
            .IsEnabled(!bSaveBlocked && !bPaused && BusyTime <= 0)
            .OnClicked_Lambda([this, Id]() { Issue(Id); return FReply::Handled(); })
            [SNew(STextBlock).Text(FText::FromString(Label)).WrapTextAt(408)]];
    }
    if (!Model.GetState().Outcome.IsEmpty() && BusyTime <= 0)
    {
        const FString Outcome = Model.GetState().Outcome;
        const FString Ending = Outcome == TEXT("coordinated-reversal") ? Text(TEXT("The alliance turns the siege"), TEXT("联盟扭转围城"))
            : Outcome == TEXT("costly-withdrawal") ? Text(TEXT("A remnant gets out"), TEXT("带着余部撤离")) : Text(TEXT("The position is lost"), TEXT("阵地失守"));
        Context->AddSlot().AutoHeight().Padding(0, 6)[SNew(STextBlock).Text(FText::FromString(Ending)).Font(FCoreStyle::GetDefaultFontStyle("Bold", 20)).WrapTextAt(430)];
        if (Model.GetState().Estate)
        {
            const auto E = Model.GetState().Estate;
            const int32 Force = static_cast<int32>(E->GetNumberField(TEXT("survivingForce")));
            const int32 Treasury = static_cast<int32>(E->GetNumberField(TEXT("treasury")));
            const FString OfficeId = E->GetStringField(TEXT("office"));
            const FString Office = OfficeId == TEXT("zhao-command") ? Text(TEXT("Zhao command retained"), TEXT("保有赵氏指挥权"))
                : OfficeId == TEXT("displaced-command") ? Text(TEXT("Displaced command"), TEXT("流亡指挥")) : Text(TEXT("Command lost"), TEXT("指挥权丧失"));
            const FString Summary = bChinese
                ? FString::Printf(TEXT("可调兵力 %d · 储备 %d · %s\n权利主张与义务已存档。分配章节正在制作。"), Force, Treasury, *Office)
                : FString::Printf(TEXT("Available remnant %d · reserves %d · %s\nClaims and obligations saved. Settlement chapter is in development."), Force, Treasury, *Office);
            Context->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(Summary)).WrapTextAt(430)];
        }
        Context->AddSlot().AutoHeight().Padding(0, 8)[SNew(SButton)
            .Text(FText::FromString(bRestartArmed ? Text(TEXT("Confirm: archive and start again · R"), TEXT("确认：保留纪事，重新开始 · R")) : Text(TEXT("Try a different plan · R"), TEXT("尝试另一种方案 · R"))))
            .IsEnabled(!bSaveBlocked && BusyTime <= 0).OnClicked_Lambda([this]() { Restart(); return FReply::Handled(); })];
        if (bRestartArmed) Context->AddSlot().AutoHeight()[SNew(SButton).Text(FText::FromString(Text(TEXT("Cancel"), TEXT("取消"))))
            .OnClicked_Lambda([this]() { bRestartArmed = false; RefreshScreen(); return FReply::Handled(); })];
    }
    Context->AddSlot().AutoHeight().Padding(0, 7)[SNew(STextBlock).Text(FText::FromString(Note)).WrapTextAt(430)];
    if (BusyTime > 0) Context->AddSlot().AutoHeight()[SNew(SButton).Text(FText::FromString(Text(TEXT("Skip movement · keeps this order"), TEXT("跳过动作 · 保留本次命令"))))
        .OnClicked_Lambda([this]() { SkipMovement(); return FReply::Handled(); })];
    auto Tools = SNew(SHorizontalBox);
    Tools->AddSlot().AutoWidth()[SNew(SButton).Text(FText::FromString(Sound && Sound->IsSoundEnabled() ? Text(TEXT("Sound on · M"), TEXT("声音已开启 · M")) : Text(TEXT("Enable sound · M"), TEXT("开启声音 · M"))))
        .OnClicked_Lambda([this]() { if (Sound) Sound->SetSoundEnabled(!Sound->IsSoundEnabled()); RefreshScreen(); return FReply::Handled(); })];
    Tools->AddSlot().AutoWidth().Padding(5, 0)[SNew(SButton).Text(FText::FromString(bPaused ? Text(TEXT("Resume · Space"), TEXT("继续 · 空格")) : Text(TEXT("Pause / overview · Space"), TEXT("暂停 / 全局视图 · 空格"))))
        .OnClicked_Lambda([this]() { TogglePause(); return FReply::Handled(); })];
    Tools->AddSlot().AutoWidth()[SNew(SButton).Text(FText::FromString(bReducedMotion ? Text(TEXT("Reduced camera motion"), TEXT("减少镜头运动")) : Text(TEXT("Reduce camera motion"), TEXT("减少镜头运动"))))
        .OnClicked_Lambda([this]() { bReducedMotion = !bReducedMotion; SelectSite(SelectedSite); return FReply::Handled(); })];
    Screen = SNew(SOverlay)
        + SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Top).Padding(22)[SNew(SBorder).BorderImage(FCoreStyle::Get().GetBrush(TEXT("WhiteBrush"))).BorderBackgroundColor(FLinearColor(.018,.027,.04,.96)).ForegroundColor(FLinearColor::White).Padding(15)[Top]]
        + SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Bottom).Padding(22,22,22,86)[SNew(SBox).WidthOverride(460)[SNew(SBorder).BorderImage(FCoreStyle::Get().GetBrush(TEXT("WhiteBrush"))).BorderBackgroundColor(FLinearColor(.018,.027,.04,.96)).ForegroundColor(FLinearColor::White).Padding(15)[Context]]]
        + SOverlay::Slot().HAlign(HAlign_Left).VAlign(VAlign_Bottom).Padding(22)[SNew(SBorder).BorderImage(FCoreStyle::Get().GetBrush(TEXT("WhiteBrush"))).BorderBackgroundColor(FLinearColor(.018,.027,.04,.96)).ForegroundColor(FLinearColor::White).Padding(12)[SitesBar]]
        + SOverlay::Slot().HAlign(HAlign_Right).VAlign(VAlign_Top).Padding(22)[Tools];
    GEngine->GameViewport->AddViewportWidgetContent(Screen.ToSharedRef(), 100);
    Screen->SetVisibility(bHideHud ? EVisibility::Collapsed : EVisibility::SelfHitTestInvisible);
}
void AShiJinyangGameMode::Issue(const FString& Id)
{
    UE_LOG(LogTemp, Display, TEXT("SHI_JINYANG_INPUT id=%s blocked=%d paused=%d busy=%.2f restart=%d"), *Id, bSaveBlocked, bPaused, BusyTime, bRestartArmed);
    if (bSaveBlocked || bPaused || BusyTime > 0 || bRestartArmed) return;
    FShiJinyangModel Candidate = Model; FString Error;
    if (!Candidate.Commit(Id, Error)) { Note = Error; RefreshScreen(); return; }
    FString Current;
    if (!FFileHelper::LoadFileToString(Current, *SavePath) || Current != LastSaved)
    { bSaveBlocked = true; Note = Text(TEXT("Save changed outside this session. Reload before issuing more orders."), TEXT("存档已被其他会话修改。请重新载入后操作。")); RefreshScreen(); return; }
    const FString NewSave = Candidate.ExportSave();
    if (!FShiAtomicSaveFile::WriteUtf8(SavePath, NewSave, Error)) { Note = Error; RefreshScreen(); return; }
    Model = MoveTemp(Candidate); LastSaved = NewSave;
    if (Sound) { Sound->ResumePreferredFromGesture(); Sound->PlayCue(FName(TEXT("commit"))); }
    Present(Id);
    UE_LOG(LogTemp, Display, TEXT("SHI_JINYANG_ORDER id=%s tick=%d history=%d outcome=%s"), *Id,
        Model.GetState().Tick, Model.GetState().History.Num(), *Model.GetState().Outcome);
    RefreshScreen();
}
void AShiJinyangGameMode::Present(const FString& Id)
{
    BusyTime = .5f;
    Beats.Empty(); BeatIndex = -1; BeatHold = 0.f;
    ActivePresentation = Id;
    Note = Text(TEXT("Order saved. Watch the people carry it out."), TEXT("命令已存档。观察人们执行。"));
    if (!Model.GetState().Operation.Phase.IsEmpty())
    {
        SetOperationVisuals(false);
        UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_OPERATION phase=%s enemy=%s water=%d losses=%d force=%d round=%d"),
            *Model.GetState().Operation.Phase,*Model.GetState().Operation.Enemy,Model.GetState().Operation.WaterOpen,
            Model.GetState().Operation.Losses,Model.GetState().Force,Model.GetState().Operation.Round);
        return;
    }
    if (Id == TEXT("brace") && Figures.IsValidIndex(16))
        Figures[16]->MoveAlong({Sites[TEXT("wall")] + FVector(-80, 0, 0)}, true);
    if (Id == TEXT("diversion") && Figures.IsValidIndex(17))
        Figures[17]->MoveAlong({FVector(-500, -580, 0), FVector(700, -580, 0), FVector(700, 166, 0)}, true);
    if (Id == TEXT("escape"))
        for (int32 I = 12; I < 14; ++I) Figures[I]->MoveAlong({FVector(-550, -100, 0), FVector(-550, 530 + (I - 12) * 80, 0)}, true);
    const bool Han = Id.EndsWith(TEXT("-han")), Wei = Id.EndsWith(TEXT("-wei"));
    if ((Han || Wei) && Envoy.IsValid())
    {
        bFollowingEnvoy = true;
        const FString Camp = Han ? TEXT("han") : TEXT("wei");
        const FVector P = Sites[Camp] + FVector(-170, -20, 0);
        const FVector Start = Sites[TEXT("zhao")] + FVector(90, 70, 0);
        if (Han)
        {
            Beats.Add({{FVector(-550,650,0), FVector(-550,900,0), FVector(P.X,900,0), P}, Camp, 4.f});
            Beats.Add({{FVector(P.X,900,0), FVector(-550,900,0), FVector(-550,650,0), Start}, TEXT(""), 0.f});
        }
        else
        {
            Beats.Add({{FVector(-500,-580,0), FVector(P.X,-580,0), P}, Camp, 4.f});
            Beats.Add({{FVector(P.X,-580,0), FVector(-500,-580,0), Start}, TEXT(""), 0.f});
        }
        BeginNextBeat();
    }
    if (Id == TEXT("relay") && Envoy.IsValid())
    {
        bFollowingEnvoy = true;
        Beats.Add({{FVector(-550,650,0), FVector(-550,900,0), FVector(430,900,0), FVector(430,880,0)}, TEXT("han"), 4.f});
        Beats.Add({{FVector(430,900,0), FVector(1100,900,0), FVector(1100,-580,0), FVector(830,-580,0), FVector(830,-620,0)}, TEXT("wei"), 4.f});
        Beats.Add({{FVector(830,-580,0), FVector(-500,-580,0), Sites[TEXT("zhao")] + FVector(90,70,0)}, TEXT(""), 0.f});
        BeginNextBeat();
    }
    if (Id == TEXT("early-date") || Id == TEXT("aligned-date"))
    {
        Beats.Add({{}, TEXT("han"), 4.f}); Beats.Add({{}, TEXT("wei"), 4.f});
        BeginNextBeat();
    }
    if (!Model.GetState().Outcome.IsEmpty())
    {
        const auto& S = Model.GetState();
        Beats.Empty(); BeatIndex = -1; bFollowingEnvoy = false;
        SetOutcomeCamera();
        if (S.Outcome == TEXT("coordinated-reversal"))
        {
            for (int32 I = 0; I < 16; ++I) Figures[I]->MoveAlong(ForceRoute(I));
        }
        else if (S.Outcome == TEXT("costly-withdrawal"))
            for (int32 I = 12; I < 16; ++I) Figures[I]->MoveAlong(ForceRoute(I));
        else
        {
            if (S.Result && S.Result->GetBoolField(TEXT("diversionExecuted")))
            {
                for (int32 Ally = 0; Ally < 2; ++Ally)
                {
                    const TCHAR* AllyId = Ally == 0 ? TEXT("han") : TEXT("wei");
                    if (S.Result->GetObjectField(TEXT("allies"))->GetObjectField(AllyId)->GetBoolField(TEXT("participates")))
                        for (int32 I = Ally * 4; I < Ally * 4 + 4; ++I)
                            Figures[I]->MoveAlong(ForceRoute(I));
                }
                for (int32 I = 12; I < 16; ++I)
                    Figures[I]->MoveAlong(ForceRoute(I));
            }
            for (int32 I = 8; I < 12; ++I)
                Figures[I]->MoveAlong(ForceRoute(I));
        }
    }
}
void AShiJinyangGameMode::BeginNextBeat()
{
    ++BeatIndex; bBeatResponseStarted = false; BeatHold = 0.f;
    if (!Beats.IsValidIndex(BeatIndex)) return;
    const auto& Beat = Beats[BeatIndex];
    if (Beat.Route.Num() && Envoy.IsValid()) Envoy->MoveAlong(Beat.Route);
    if (!Beat.Route.Num() && Sites.Contains(Beat.Camp))
    {
        const FVector P = Sites[Beat.Camp];
        CameraTarget = P + FVector(-480,-620,520);
        RotationTarget = (P + FVector(0,0,90) - CameraTarget).Rotation();
    }
}
void AShiJinyangGameMode::SetDiplomaticVisuals(const FString& Camp, bool Instant)
{
    if (!Model.GetState().Allies.Contains(Camp)) return;
    const auto& A = Model.GetState().Allies[Camp];
    const int32 Captain = Camp == TEXT("han") ? 0 : 4;
    const FVector Contact = Sites[Camp] + FVector(-100,-20,0);
    if (Figures.IsValidIndex(Captain) && A.Proposal)
    {
        if (Instant) Figures[Captain]->SetSettledPose(Contact, 180);
        else Figures[Captain]->MoveAlong({Contact});
        Figures[Captain]->FaceAtRest(180);
        Figures[Captain]->SetReceiving(true);
    }
    const bool ReadyDate = A.AgreedWindow >= 0 && A.AgreedWindow >= A.ReadyAt;
    if (Signals.Contains(Camp) && Signals[Camp].IsValid())
        Signals[Camp]->SetActorLocation(Sites[Camp] + FVector(-140,100,ReadyDate ? 170 : 65));
}
void AShiJinyangGameMode::SetOutcomeCamera()
{
    CameraTarget = FVector(600,-1700,1950);
    RotationTarget = (FVector(900,200,60) - CameraTarget).Rotation();
    if (bReducedMotion && Camera.IsValid()) Camera->SetActorLocationAndRotation(CameraTarget,RotationTarget);
}
FString AShiJinyangGameMode::OperationReport() const
{
    const auto& S=Model.GetState(); const auto& O=S.Operation;
    FString Report;
    if (O.Phase==TEXT("deployment") || O.Phase==TEXT("breach"))
        Report=O.Enemy==TEXT("reinforced")
            ? Text(TEXT("The exposed approach drew extra guards. A screen protects the workers; a rush risks being driven back."),TEXT("先前的行动暴露了路线，敌军已增派守卫。分兵可掩护作业，突进可能被击退。"))
            : Text(TEXT("Only the usual guard holds the embankment. A rush keeps the reserve available; screening commits it here."),TEXT("堤口仍是原有守卫。突进可保留后队，分兵掩护则须将后队投入此处。"));
    else if (O.Phase==TEXT("disrupted"))
        Report=Text(TEXT("The workers were driven back; the water is still held. The reserve can recover the breach. Attacking the intact front loses the position."),TEXT("作业队被逼退，水尚未放出。后队可以夺回堤口。此时强攻正面将失去阵地。"));
    else if (O.FrontHeld)
        Report=Text(TEXT("Han and Wei have closed on the flanks. Zhao can now advance with fewer losses."),TEXT("韩、魏已合击两翼。赵军此时进攻，损失较小。"));
    else
        Report=Text(TEXT("Zhi's force turns to the flooding camp. Han and Wei are moving under their own commitments. Holding the front costs supplies and reduces assault losses."),TEXT("智军转身救水。韩、魏正按约行动。稳住正面要消耗储备，但可减少进攻损失。"));
    return Report+(bChinese ? FString::Printf(TEXT("\n赵军 %d · 本次减员 %d · 储备 %d"),S.Force,O.Losses,S.Treasury)
        : FString::Printf(TEXT("\nZhao force %d · losses %d · reserves %d"),S.Force,O.Losses,S.Treasury));
}
TArray<FVector> AShiJinyangGameMode::OperationRoute(int32 I,const FVector& End) const
{
    const FVector Start=Figures[I]->GetActorLocation();
    if (End.X<0) return {FVector(Start.X<900 ? 700 : 1100,-580,0),FVector(-500,-580,0),FVector(-500,End.Y,0),End};
    if (I<8 && Start.X<970)
    {
        const float Lane=I<4 ? 850+(I%4)*25 : -620+(I%4)*24;
        return {FVector(Start.X,Lane,0),FVector(1100,Lane,0),FVector(1100,End.Y,0),End};
    }
    TArray<FVector> Route;
    if (Start.X<0) { Route.Add(FVector(-500,-580,0)); Route.Add(FVector(700,-580,0)); }
    else if (Start.X<900) Route.Add(FVector(700,Start.Y,0));
    else Route.Add(FVector(1100,Start.Y,0));
    const bool West=Start.X<900, EndWest=End.X<900;
    if (West!=EndWest)
    {
        Route.Add(FVector(West ? 700 : 1100,140,0));
        Route.Add(FVector(EndWest ? 700 : 1100,140,0));
    }
    Route.Add(FVector(EndWest ? 700 : 1100,End.Y,0)); Route.Add(End);
    return Route;
}
void AShiJinyangGameMode::SetOperationVisuals(bool Instant)
{
    const auto& S=Model.GetState(); const auto& O=S.Operation;
    if (O.Phase.IsEmpty() || Figures.Num()<19) return;
    const bool Resolved=!S.Outcome.IsEmpty();
    SelectedSite=(O.Phase==TEXT("deployment") || O.Phase==TEXT("breach")) ? TEXT("embankment") : TEXT("zhao");
    UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_SITE site=%s"),*SelectedSite);
    CameraTarget=FVector(1150,-1050,1450);
    RotationTarget=(FVector(1050,230,70)-CameraTarget).Rotation();
    if (Resolved) SetOutcomeCamera();
    if (bReducedMotion && Camera.IsValid()) Camera->SetActorLocationAndRotation(CameraTarget,RotationTarget);
    for (int32 I=0; I<18; ++I)
    {
        if (I==16) continue;
        FVector End=Figures[I]->GetActorLocation();
        float Yaw=I>=8 && I<12 ? 180.f : 0.f;
        if (I<8)
        {
            if (!O.WaterOpen) continue;
            End=O.FrontHeld ? FVector(I<4 ? 1260 : 1380,280+(I%4)*65,0)
                : FVector(1100,I<4 ? 640+(I%4)*65 : -460+(I%4)*65,0);
        }
        else if (I<12)
        {
            if (O.WaterOpen) End=FVector(1810,290+(I-8)*65,0);
            else if (O.Phase==TEXT("disrupted")) End=I<10 ? FVector(700,20+(I-8)*70,0) : FVector(1100,300+(I-10)*70,0);
            else if (I==8 || (I==9 && O.Enemy==TEXT("reinforced"))) End=FVector(1100,220+(I-8)*80,0);
            else End=Sites[TEXT("zhi")]+FVector(-80+(I-8)*60,-150,0);
        }
        else if (I<16)
        {
            if (I<14) End=FVector(700,O.Phase==TEXT("deployment") ? -380+(I-12)*70
                : O.Phase==TEXT("disrupted") ? -200+(I-12)*70 : O.WaterOpen ? -100+(I-12)*70 : 20+(I-12)*70,0);
            else End=O.Reserve==TEXT("committed") ? FVector(1100,20+(I-14)*70,0) : FVector(700,-560+(I-14)*70,0);
            if (O.WaterOpen && I<14) End=FVector(1100,280+(I-12)*75,0);
            Yaw=90;
        }
        else End=FVector(700,O.Phase==TEXT("disrupted") ? -290 : 166,0);
        if (Resolved && I<16)
        {
            if (S.Outcome==TEXT("costly-withdrawal") && I<12) continue;
            End=ForceDestination(I);
        }
        const bool Working=I==17 && !O.WaterOpen && O.Phase!=TEXT("disrupted");
        if (Instant || FVector::Dist2D(Figures[I]->GetActorLocation(),End)<2)
            Figures[I]->SetSettledPose(End,Yaw,Working);
        else { Figures[I]->MoveAlong(OperationRoute(I,End),I==17); Figures[I]->FaceAtRest(Yaw); }
    }
    if (Water.IsValid() && O.WaterOpen) Water->SetActorLocation(FVector(1150,420,-.5));
    if (!Resolved) Note=Text(TEXT("The agreed date is fixed. These orders command Zhao's force within the operation."),TEXT("约定日期已经确定。这里的命令调动赵军，处理行动中的变化。"));
}
void AShiJinyangGameMode::ApplySettledVisuals(bool Resume)
{
    if (Figures.Num() < 19) return;
    const auto& S = Model.GetState();
    // Natural completion, skip and cold resume share the same location, facing and pose.
    if (S.Braced) Figures[16]->SetSettledPose(Sites[TEXT("wall")] + FVector(-80,0,0), 0, true);
    if (S.Diversion) Figures[17]->SetSettledPose(FVector(700,166,0), 90, true);
    if (S.Exit && S.Outcome.IsEmpty()) for (int32 I = 12; I < 14; ++I)
        Figures[I]->SetSettledPose(FVector(-550,530 + (I-12)*80,0),90);
    for (const FString& Camp : {FString(TEXT("han")),FString(TEXT("wei"))}) SetDiplomaticVisuals(Camp,true);
    if (Envoy.IsValid()) Envoy->SetSettledPose(Sites[TEXT("zhao")] + FVector(90,70,0),0);
    if (Water.IsValid() && S.Result && S.Result->GetBoolField(TEXT("diversionExecuted")))
        Water->SetActorLocation(FVector(1150, 420, -.5));
    if (!S.Outcome.IsEmpty())
    {
        if (S.Outcome == TEXT("coordinated-reversal")) for (int32 I = 0; I < 16; ++I)
            Figures[I]->SetSettledPose(ForceDestination(I),0);
        if (S.Outcome == TEXT("costly-withdrawal")) for (int32 I = 12; I < 16; ++I)
            Figures[I]->SetSettledPose(ForceDestination(I),90);
        if (S.Outcome == TEXT("isolated-defeat"))
        {
            for (int32 I = 8; I < 12; ++I) Figures[I]->SetSettledPose(ForceDestination(I),180);
            if (S.Result && S.Result->GetBoolField(TEXT("diversionExecuted")))
            {
                for (int32 Ally = 0; Ally < 2; ++Ally)
                    if (S.Result->GetObjectField(TEXT("allies"))->GetObjectField(Ally == 0 ? TEXT("han") : TEXT("wei"))->GetBoolField(TEXT("participates")))
                        for (int32 I = Ally*4; I < Ally*4+4; ++I) Figures[I]->SetSettledPose(ForceDestination(I),0);
                for (int32 I = 12; I < 16; ++I) Figures[I]->SetSettledPose(ForceDestination(I),0);
            }
        }
    }
    if (!S.Operation.Phase.IsEmpty()) SetOperationVisuals(true);
    if (S.Result)
    {
        const TMap<FString,FString> ReasonsMap = {
            {TEXT("city-deadline-missed"), Text(TEXT("The city could not hold until the operation."),TEXT("阵地无法维持至行动时刻。"))},
            {TEXT("diversion-unavailable"), Text(TEXT("The flood diversion did not operate."),TEXT("未能实施决水行动。"))},
            {TEXT("han:not-committed"), Text(TEXT("Han withheld its forces."),TEXT("韩氏没有出兵。"))},
            {TEXT("wei:not-committed"), Text(TEXT("Wei withheld its forces."),TEXT("魏氏没有出兵。"))},
            {TEXT("han:not-ready"), Text(TEXT("Han had not assembled."),TEXT("韩军尚未集结。"))},
            {TEXT("wei:not-ready"), Text(TEXT("Wei had not assembled."),TEXT("魏军尚未集结。"))},
            {TEXT("han:wrong-window"), Text(TEXT("Han did not acknowledge this date."),TEXT("韩氏未确认这一日期。"))},
            {TEXT("wei:wrong-window"), Text(TEXT("Wei did not acknowledge this date."),TEXT("魏氏未确认这一日期。"))},
            {TEXT("prepared-withdrawal-used"), Text(TEXT("The prepared exit saved a limited remnant."),TEXT("预备退路保住了有限的余部。"))},
            {TEXT("operation-withdrawal"),Text(TEXT("You broke contact using the prepared route."),TEXT("你按预备路线脱离了战场。"))},
            {TEXT("breach-not-open"),Text(TEXT("The breach stayed closed. The frontal attack was isolated."),TEXT("决口未能打开，正面进攻陷入孤立。"))},
            {TEXT("flanks-arrived"),Text(TEXT("Holding the front let the allied flanks close in."),TEXT("稳住正面，使盟军得以合击两翼。"))},
            {TEXT("front-rushed"),Text(TEXT("The early frontal attack won at a higher force cost."),TEXT("提前进攻取得胜利，但付出了更多兵力。"))}};
        FString Reasons;
        for (const auto& R : S.Result->GetArrayField(TEXT("reasons")))
        { if (!Reasons.IsEmpty()) Reasons += TEXT(" "); Reasons += ReasonsMap.FindRef(R->AsString()); }
        if (Reasons.IsEmpty() && S.Outcome == TEXT("coordinated-reversal"))
            Reasons = Text(TEXT("Han and Wei joined. Their settlement claims remain obligations, not permanent loyalty."),TEXT("韩、魏共同参战。分配时仍须兑现承诺，并不等于永久忠诚。"));
        Note = Reasons;
    }
}
void AShiJinyangGameMode::TogglePause()
{
    bPaused = !bPaused;
    for (const auto& F : Figures) if (F.IsValid()) F->SetActorTickEnabled(!bPaused);
    SelectSite(SelectedSite);
}
void AShiJinyangGameMode::SkipMovement()
{
    if (BusyTime <= 0) return;
    for (const auto& F : Figures) if (F.IsValid()) F->FinishMotion();
    BusyTime = 0; bFollowingEnvoy = false;
    Beats.Empty(); BeatIndex = -1;
    ApplySettledVisuals(false); SelectSite(SelectedSite);
    if (!Model.GetState().Outcome.IsEmpty()) SetOutcomeCamera();
    UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_SETTLED history=%d skipped=true outcome=%s"),Model.GetState().History.Num(),*Model.GetState().Outcome);
}
void AShiJinyangGameMode::Restart()
{
    if (!bRestartArmed) { bRestartArmed = true; RefreshScreen(); return; }
    FString Error, Current;
    if (!FFileHelper::LoadFileToString(Current, *SavePath) || Current != LastSaved)
    { bSaveBlocked = true; Note = TEXT("Save changed; restart not applied."); RefreshScreen(); return; }
    FShiJinyangModel Fresh;
    const FString Archive = FPaths::GetPath(SavePath) / TEXT("routes") / (FGuid::NewGuid().ToString(EGuidFormats::Digits) + TEXT(".json"));
    if (!Fresh.Initialize(DefinitionText, Error) || !FShiAtomicSaveFile::WriteUtf8(Archive, LastSaved, Error)
        || !FShiAtomicSaveFile::WriteUtf8(SavePath, Fresh.ExportSave(), Error))
    { Note = Error; RefreshScreen(); return; }
    Model = MoveTemp(Fresh); LastSaved = Model.ExportSave(); bRestartArmed = false; bPaused = false;
    Beats.Empty(); BeatIndex = -1; BusyTime = 0; bFollowingEnvoy = false;
    // Recreate only this chapter's figures; prior chronicle stays in the route archive.
    for (const auto& F : Figures) if (F.IsValid()) F->Destroy();
    Figures.Empty(); Envoy.Reset();
    CreateFigures();
    ApplySettledVisuals(true);
    if (Water.IsValid()) Water->SetActorLocation(FVector(450,150,-.5));
    Note = Text(TEXT("Previous route archived. New plan ready."), TEXT("上一条路线已保留。可以尝试新方案。"));
    SelectSite(TEXT("wall"));
}
void AShiJinyangGameMode::Tick(float Dt)
{
    Super::Tick(Dt);
    auto* PC = GetWorld()->GetFirstPlayerController();
    if (!PC || !Camera.IsValid()) return;
    if (PC->WasInputKeyJustPressed(EKeys::H) && Screen)
    {
        bHideHud = !bHideHud;
        Screen->SetVisibility(bHideHud ? EVisibility::Collapsed : EVisibility::SelfHitTestInvisible);
    }
    if (PC->WasInputKeyJustPressed(EKeys::SpaceBar)) TogglePause();
    if (PC->WasInputKeyJustPressed(EKeys::R) && !Model.GetState().Outcome.IsEmpty()
        && BusyTime <= 0 && !bSaveBlocked && !bPaused) Restart();
    if (PC->WasInputKeyJustPressed(EKeys::M) && Sound)
    { Sound->SetSoundEnabled(!Sound->IsSoundEnabled()); RefreshScreen(); }
    if (bAudioReview && PC->WasInputKeyJustPressed(EKeys::F8) && Sound)
    {
        const auto Stats = Sound->GetRenderStats();
        const auto* Audio = Sound->GetAudioComponent();
        UE_LOG(LogTemp, Display, TEXT("SHI_JINYANG_AUDIO enabled=%d playing=%d samples=%llu peak=%.6f app=%.3f focus=%d component=%.3f"),
            Sound->IsSoundEnabled(), Sound->IsPlaying(), Stats.GeneratedSamples, Stats.Peak,
            FApp::GetVolumeMultiplier(), FApp::HasFocus(), Audio ? Audio->VolumeMultiplier : -1.f);
    }
    if (bAudioReview && PC->WasInputKeyJustPressed(EKeys::F9))
    {
        bAudioRecording = !bAudioRecording;
        if (bAudioRecording) UAudioMixerBlueprintLibrary::StartRecordingOutput(this,60);
        else UAudioMixerBlueprintLibrary::StopRecordingOutput(this,EAudioRecordingExportType::WavFile,
            TEXT("jinyang-mixer"),FPaths::GetPath(SavePath));
        UE_LOG(LogTemp, Display, TEXT("SHI_JINYANG_AUDIO_RECORD active=%d"), bAudioRecording);
    }
    if (PC->WasInputKeyJustPressed(EKeys::Escape) && bRestartArmed)
    { bRestartArmed = false; RefreshScreen(); }
    else if (PC->WasInputKeyJustPressed(EKeys::Escape) && BusyTime > 0) SkipMovement();
    if (PC->WasInputKeyJustPressed(EKeys::Tab))
    {
        const TArray<FString> Order = {TEXT("wall"),TEXT("embankment"),TEXT("route"),TEXT("han"),TEXT("wei"),TEXT("zhi"),TEXT("zhao")};
        SelectSite(Order[(Order.IndexOfByKey(SelectedSite) + 1) % Order.Num()]);
    }
    const FKey Digit[] = {EKeys::One, EKeys::Two, EKeys::Three, EKeys::Four,EKeys::Five};
    const auto Actions = ContextCommands();
    for (const FString& Id : Actions) if (PC->WasInputKeyJustPressed(Digit[CommandKey(Id)-1])) Issue(Id);
    if (PC->WasInputKeyJustPressed(EKeys::LeftMouseButton))
    {
        FHitResult Hit;
        if (PC->GetHitResultUnderCursor(ECC_Visibility, false, Hit) && Hit.GetActor() && Hit.GetActor()->Tags.Num())
            SelectSite(Hit.GetActor()->Tags[0].ToString());
    }
    FVector Pan = FVector::ZeroVector;
    if (PC->IsInputKeyDown(EKeys::W)) Pan.X += 1;
    if (PC->IsInputKeyDown(EKeys::S)) Pan.X -= 1;
    if (PC->IsInputKeyDown(EKeys::D)) Pan.Y += 1;
    if (PC->IsInputKeyDown(EKeys::A)) Pan.Y -= 1;
    CameraTarget += Pan * Dt * 450;
    if (bFollowingEnvoy && !bPaused && Envoy.IsValid() && Envoy->IsMoving())
    {
        CameraTarget = Envoy->GetActorLocation() + FVector(-480, -500, 380);
        RotationTarget = (Envoy->GetActorLocation() + FVector(0, 0, 100) - CameraTarget).Rotation();
    }
    Camera->SetActorLocation(FMath::VInterpTo(Camera->GetActorLocation(), CameraTarget, Dt, bReducedMotion ? 1000.f : 3.f));
    Camera->SetActorRotation(FMath::RInterpTo(Camera->GetActorRotation(), RotationTarget, Dt, bReducedMotion ? 1000.f : 3.f));
    if (!bPaused && BusyTime > 0)
    {
        if (Beats.IsValidIndex(BeatIndex) && Envoy.IsValid() && !Envoy->IsMoving())
        {
            if (!bBeatResponseStarted)
            {
                bBeatResponseStarted = true; BeatHold = Beats[BeatIndex].HoldSeconds;
                const FString Camp = Beats[BeatIndex].Camp;
                if (!Camp.IsEmpty())
                {
                    SetDiplomaticVisuals(Camp,false);
                    Envoy->FaceAtRest(0); Envoy->SetReceiving(true);
                    const FString Decision = Model.AllyResponse(Camp)->GetStringField(TEXT("decision"));
                    Note = Decision == TEXT("stay") ? Text(TEXT("The camp declines the exposed plan."),TEXT("营中拒绝了暴露的计划。"))
                        : Decision == TEXT("withhold") ? Text(TEXT("The commander receives the envoy, but holds the troops until the other camp pledges."),TEXT("主将接见使者，但要等另一方承诺才肯出兵。"))
                        : Text(TEXT("The partner's pledge is received. The troops still wait for the agreed operation."),TEXT("已收到另一方的承诺。军队仍须等待约定的行动。"));
                    if (Sound) Sound->PlayCue(FName(TEXT("inspect")));
                    RefreshScreen();
                    UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_REPLY camp=%s decision=%s ready=%d agreed=%d"),*Camp,*Decision,
                        Model.GetState().Allies[Camp].ReadyAt,Model.GetState().Allies[Camp].AgreedWindow);
                }
            }
            else { BeatHold -= Dt; if (BeatHold <= 0) BeginNextBeat(); }
        }
        BusyTime = FMath::Max(0.f, BusyTime - Dt);
        if (Beats.IsValidIndex(BeatIndex)) BusyTime = FMath::Max(BusyTime,.1f);
        for (const auto& F : Figures) if (F.IsValid() && F->IsMoving()) BusyTime = FMath::Max(BusyTime, .1f);
        if (BusyTime <= 0)
        {
            ApplySettledVisuals(false); Beats.Empty(); BeatIndex = -1; bFollowingEnvoy = false;
            if (!Model.GetState().Outcome.IsEmpty()) SetOutcomeCamera();
            RefreshScreen();
            UE_LOG(LogTemp,Display,TEXT("SHI_JINYANG_SETTLED history=%d skipped=false outcome=%s"),Model.GetState().History.Num(),*Model.GetState().Outcome);
        }
    }
}
void AShiJinyangGameMode::EndPlay(const EEndPlayReason::Type Reason)
{
    if (Sound) Sound->Stop();
    if (bAudioRecording) UAudioMixerBlueprintLibrary::StopRecordingOutput(this,EAudioRecordingExportType::WavFile,
        TEXT("jinyang-mixer-interrupted"),FPaths::GetPath(SavePath));
    if (Screen && GEngine && GEngine->GameViewport) GEngine->GameViewport->RemoveViewportWidgetContent(Screen.ToSharedRef());
    Screen.Reset(); Super::EndPlay(Reason);
}
