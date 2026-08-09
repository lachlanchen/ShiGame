#include "ShiCommandScreen.h"

#include "ShiGameMode.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Layout/SSeparator.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/SNullWidget.h"
#include "Widgets/Text/STextBlock.h"

void SShiCommandScreen::Construct(const FArguments& InArgs)
{
    GameMode = InArgs._GameMode;
    ChildSlot[BuildLayout()];
}

void SShiCommandScreen::Refresh()
{
    ChildSlot.AttachWidget(BuildLayout());
}

TSharedRef<SWidget> SShiCommandScreen::BuildLayout()
{
    AShiGameMode* Mode = GameMode.Get();
    if (!Mode || !Mode->GetLoadError().IsEmpty())
    {
        const FString Error = Mode ? Mode->GetLoadError() : TEXT("SHI game mode is unavailable.");
        return SNew(SBorder).Padding(40)[SNew(STextBlock).Text(FText::FromString(Error))];
    }

    const FShiNodeData* Node = Mode->GetCurrentNode();
    if (!Node) return SNew(STextBlock).Text(FText::FromString(TEXT("Campaign node is unavailable.")));
    const FString Locale = Mode->GetLocale();
    const FShiActData* Act = Mode->GetCampaign().FindAct(Node->ActId);
    const FShiSiteData* Site = Mode->GetCampaign().FindSite(Node->SiteId);
    const int32 ActIndex = Mode->GetCampaign().Acts.IndexOfByPredicate([&](const FShiActData& Item) { return Act && Item.Id == Act->Id; });
    const int32 SceneIndex = Mode->GetCampaign().Nodes.IndexOfByPredicate([&](const FShiNodeData& Item) { return Item.Id == Node->Id; });

    TSharedRef<SVerticalBox> Root = SNew(SVerticalBox);
    Root->AddSlot().AutoHeight().Padding(28, 20, 28, 6)[
        SNew(STextBlock).Text(FText::FromString(TEXT("勢  SHI · CINEMATIC COMMAND SPACE")))
    ];
    Root->AddSlot().AutoHeight().Padding(28, 6)[
        SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("ACT %d/%d · %s    SCENE %d/%d · %s · %s"),
            ActIndex + 1, Mode->GetCampaign().Acts.Num(), Act ? *Act->Title.Resolve(Locale) : TEXT("?"),
            SceneIndex + 1, Mode->GetCampaign().Nodes.Num(), Site ? *Site->Name.Resolve(Locale) : TEXT("?"), *Node->DateLabel.Resolve(Locale))))
    ];

    FString ResourceLine;
    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};
    for (const FString& Key : ResourceKeys)
        ResourceLine += FString::Printf(TEXT("%s %d    "), *Key.ToUpper(), Mode->GetResources().FindRef(Key));
    Root->AddSlot().AutoHeight().Padding(28, 5)[SNew(STextBlock).Text(FText::FromString(ResourceLine))];
    Root->AddSlot().AutoHeight().Padding(28, 14, 28, 4)[SNew(STextBlock).Text(FText::FromString(Node->Title.Resolve(Locale)))];
    Root->AddSlot().AutoHeight().Padding(28, 4)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Node->Context.Resolve(Locale)))];
    Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(SBorder).Padding(16)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Node->Dialogue.Resolve(Locale)))]];

    TSharedRef<SHorizontalBox> Choices = SNew(SHorizontalBox);
    for (int32 Index = 0; Index < Node->Choices.Num(); ++Index)
    {
        const FShiChoiceData& Choice = Node->Choices[Index];
        const bool bSelected = Index == Mode->GetSelectedChoiceIndex();
        const bool bAvailable = Mode->CanChoose(Choice);
        const FString Copy = FString::Printf(TEXT("%s%s%s\n%s\n\n%s\n\nMETHOD · %s"),
            bSelected ? TEXT("◆ SELECTED ORDER\n") : TEXT(""), bAvailable ? TEXT("") : TEXT("LOCKED · REQUIREMENTS NOT MET\n"),
            *Choice.Label.Resolve(Locale), *Choice.Intent.Resolve(Locale), *Choice.Strategy.Resolve(Locale), *Choice.MethodId.ToUpper());
        Choices->AddSlot().FillWidth(1).Padding(7)[
            SNew(SButton).IsEnabled(bAvailable).OnClicked(this, &SShiCommandScreen::Select, Index).ContentPadding(14)[
                SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Copy))
            ]
        ];
    }
    Root->AddSlot().AutoHeight().Padding(21, 10)[Choices];

    const FShiChoiceData& Selected = Node->Choices[Mode->GetSelectedChoiceIndex()];
    FString OrderReading;
    if (const FShiFieldConditionData* Field = Mode->GetCurrentFieldCondition())
        OrderReading += FString::Printf(TEXT("FIELD · %s\n%s"), *Field->Title.Resolve(Locale), *Field->Signal.Resolve(Locale));
    if (const FShiOppositionStageData* Pursuit = Mode->GetCurrentOppositionStage())
        OrderReading += FString::Printf(TEXT("\n\nQIN PURSUIT · %s\n%s\nCOUNTERPLAY · %s"), *Pursuit->Title.Resolve(Locale), *Pursuit->Forecast.Resolve(Locale), *Pursuit->Counterplay.Resolve(Locale));
    if (const FShiMethodReadData* Read = Mode->GetCurrentMethodRead())
    {
        const bool bHit = !Read->TargetMethodId.IsEmpty() && Read->TargetMethodId == Selected.MethodId;
        const TCHAR* ReadState = Read->TargetMethodId.IsEmpty() ? TEXT("NEUTRAL") : bHit ? TEXT("WILL HIT") : TEXT("WILL MISS");
        OrderReading += FString::Printf(TEXT("\n\nMETHOD READ · %s · %s\n%s"), *Read->Title.Resolve(Locale), ReadState, *Read->Forecast.Resolve(Locale));
    }
    if (const FShiCommitmentData* Commitment = Mode->GetActiveCommitment())
        OrderReading += FString::Printf(TEXT("\n\nACTIVE OATH · %s\n%s"), *Commitment->Title.Resolve(Locale), *Commitment->Promise.Resolve(Locale));
    if (!Selected.PressureWarning.Resolve(Locale).IsEmpty())
        OrderReading += FString::Printf(TEXT("\n\nEXPOSED ANSWER · %s"), *Selected.PressureWarning.Resolve(Locale));
    if (!OrderReading.IsEmpty())
        Root->AddSlot().AutoHeight().Padding(28, 4)[SNew(SBorder).Padding(14)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(OrderReading))]];
    Root->AddSlot().AutoHeight().Padding(28, 4)[
        SNew(SButton).IsEnabled(Mode->CanChoose(Selected)).OnClicked(this, &SShiCommandScreen::Issue).ContentPadding(16)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("ISSUE ORDER · %s"), *Selected.Label.Resolve(Locale))))
        ]
    ];
    if (!Mode->GetLastConsequence().IsEmpty())
        Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(SBorder).Padding(14)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Mode->GetLastConsequence()))]];
    if (Mode->IsCompleted())
        Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(STextBlock).Text(FText::FromString(TEXT("CHAPTER POSITION COMPLETE · RECONSTRUCTION CONTINUES")))];

    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot().FillWidth(0.48f)[
            SNew(SBorder).Padding(4).BorderBackgroundColor(FLinearColor(0.025f, 0.03f, 0.025f, 0.91f))[
                SNew(SScrollBox) + SScrollBox::Slot()[Root]
            ]
        ]
        + SHorizontalBox::Slot().FillWidth(0.52f)[SNullWidget::NullWidget];
}

FReply SShiCommandScreen::Select(int32 Index)
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->SelectChoice(Index);
    return FReply::Handled();
}

FReply SShiCommandScreen::Issue()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->IssueSelectedOrder();
    return FReply::Handled();
}
