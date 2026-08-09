#include "ShiCommandScreen.h"

#include "HAL/PlatformProcess.h"
#include "ShiGameMode.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Layout/SSeparator.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/SNullWidget.h"
#include "Widgets/Text/STextBlock.h"

namespace
{
    FString SourceStatusLabel(const FString& Status)
    {
        if (Status == TEXT("received-account")) return TEXT("RECEIVED ACCOUNT");
        if (Status == TEXT("later-compilation")) return TEXT("LATER COMPILATION · NOT AN EYEWITNESS RECORD");
        if (Status == TEXT("strategic-text")) return TEXT("STRATEGIC TEXT · DESIGN LENS, NOT EPISODE EVIDENCE");
        return TEXT("PROJECT-AUTHORED DRAMATIC RECONSTRUCTION");
    }

    FString ClaimReviewLabel(const FString& Status)
    {
        if (Status == TEXT("specialist-review-required")) return TEXT("SPECIALIST REVIEW REQUIRED");
        if (Status == TEXT("authored-reconstruction")) return TEXT("AUTHORED RECONSTRUCTION");
        return TEXT("EVIDENCE LOCATED · REVIEW OPEN");
    }
}

void SShiCommandScreen::Construct(const FArguments& InArgs)
{
    GameMode = InArgs._GameMode;
    ChildSlot[BuildLayout()];
}

void SShiCommandScreen::Refresh()
{
    ChildSlot.AttachWidget(BuildLayout());
}

void SShiCommandScreen::ScrollEvidence(int32 Direction)
{
    if (!EvidenceScroll.IsValid() || Direction == 0) return;
    const float Target = EvidenceScroll->GetScrollOffset() + Direction * 280.f;
    EvidenceScroll->SetScrollOffset(FMath::Clamp(Target, 0.f, EvidenceScroll->GetScrollOffsetOfEnd()));
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
    if (Mode->IsEvidenceOpen()) return BuildEvidenceLayout(*Mode, *Node);
    EvidenceScroll.Reset();
    const FShiActData* Act = Mode->GetCampaign().FindAct(Node->ActId);
    const FShiSiteData* Site = Mode->GetCampaign().FindSite(Node->SiteId);
    const FShiSiteData* InspectedSite = Mode->GetInspectedSite();
    const FShiCommandSignalData* InspectedSignal = Mode->GetInspectedCommandSignal();
    const FShiCinematicBeatData* CinematicBeat = Mode->GetActiveCinematicBeat();
    const FShiCouncilStageData& CouncilStage = Mode->GetCouncilStage();
    const FShiCouncilParticipantData* CouncilSpeaker = Mode->GetCouncilSpeaker();
    TArray<FString> ActiveSourceRefs = Mode->IsInspectingRemoteSite() ? TArray<FString>() : Node->SourceRefs;
    TArray<FString> ActiveClaimRefs = Mode->IsInspectingRemoteSite() ? TArray<FString>() : Node->ClaimRefs;
    if (InspectedSite)
    {
        for (const FString& SourceRef : InspectedSite->SourceRefs) ActiveSourceRefs.AddUnique(SourceRef);
        for (const FString& ClaimRef : InspectedSite->ClaimRefs) ActiveClaimRefs.AddUnique(ClaimRef);
    }
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
    Root->AddSlot().AutoHeight().Padding(28, 2, 28, 7)[
        SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("TURN %d · %s"), Mode->GetDecisionCount() + 1, *Mode->GetSaveStatus())))
    ];
    Root->AddSlot().AutoHeight().Padding(28, 2, 28, 7)[
        SNew(SButton).IsEnabled(!Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::ToggleEvidence).ContentPadding(10)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("HISTORICAL BASIS · %s · %d SOURCES · %d CLAIMS"),
                InspectedSite ? *InspectedSite->Name.Resolve(Locale) : TEXT("?"), ActiveSourceRefs.Num(), ActiveClaimRefs.Num())))
        ]
    ];
    Root->AddSlot().AutoHeight().Padding(28, 2, 28, 7)[
        SNew(SButton).IsEnabled(!Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::FocusCouncil).ContentPadding(10)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("RETURN TO COUNCIL · %s · D / R3"),
                CouncilSpeaker ? *CouncilSpeaker->Name : TEXT("?"))))
        ]
    ];
    if (CinematicBeat)
    {
        TSharedRef<SVerticalBox> ConsequenceBeat = SNew(SVerticalBox);
        ConsequenceBeat->AddSlot().AutoHeight()[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("CONSEQUENCE %d / %d · %s"),
                Mode->GetCinematicBeatIndex() + 1, Mode->GetCinematicBeatCount(), *CinematicBeat->Label)))
        ];
        ConsequenceBeat->AddSlot().AutoHeight().Padding(0, 7, 0, 5)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(CinematicBeat->Detail))
        ];
        ConsequenceBeat->AddSlot().AutoHeight().Padding(0, 2, 0, 7)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(TEXT("CAMERA ONLY · THE GAMEPLAY RESULT IS ALREADY RESOLVED · PRESENTATION CANNOT CHANGE THE CHRONICLE")))
        ];
        ConsequenceBeat->AddSlot().AutoHeight()[
            SNew(SButton).OnClicked(this, &SShiCommandScreen::SkipCinematic).ContentPadding(9)[
                SNew(STextBlock).Text(FText::FromString(TEXT("SKIP CONSEQUENCE CAMERA · SPACE / GAMEPAD B")))
            ]
        ];
        Root->AddSlot().AutoHeight().Padding(28, 2, 28, 9)[SNew(SBorder).Padding(12)[ConsequenceBeat]];
    }
    if (!CinematicBeat && Mode->IsCouncilFocused() && CouncilSpeaker)
    {
        TSharedRef<SVerticalBox> CouncilCard = SNew(SVerticalBox);
        CouncilCard->AddSlot().AutoHeight()[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("COUNCIL SPEAKER · %s"), *CouncilSpeaker->ProvenanceLabel)))
        ];
        CouncilCard->AddSlot().AutoHeight().Padding(0, 7, 0, 2)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%s · %s"), *CouncilSpeaker->Name, *CouncilSpeaker->Role)))
        ];
        CouncilCard->AddSlot().AutoHeight().Padding(0, 2, 0, 7)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(CouncilStage.Disclosure))
        ];
        CouncilCard->AddSlot().AutoHeight()[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(TEXT("CLICK A FIGURE OR PRESS D / R3 TO RESTORE THIS BLOCKED DIALOGUE SHOT · CAMERA FOCUS NEVER ISSUES AN ORDER")))
        ];
        Root->AddSlot().AutoHeight().Padding(28, 2, 28, 9)[SNew(SBorder).Padding(12)[CouncilCard]];
    }
    else if (!CinematicBeat && InspectedSignal)
    {
        TSharedRef<SVerticalBox> SignalCard = SNew(SVerticalBox);
        SignalCard->AddSlot().AutoHeight()[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("COMMAND SIGNAL · %s · %s"),
                *InspectedSignal->Category.ToUpper(), *InspectedSignal->Label)))
        ];
        SignalCard->AddSlot().AutoHeight().Padding(0, 6, 0, 2)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(InspectedSignal->State))
        ];
        SignalCard->AddSlot().AutoHeight().Padding(0, 2, 0, 4)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(InspectedSignal->Detail))
        ];
        SignalCard->AddSlot().AutoHeight().Padding(0, 2, 0, 7)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(TEXT("READ-ONLY 3D TALLY · INSPECTION NEVER ISSUES AN ORDER OR CHANGES THE CHRONICLE")))
        ];
        SignalCard->AddSlot().AutoHeight()[
            SNew(SHorizontalBox)
            + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 7, 0)[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::CycleCommandSignal, -1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("← PREVIOUS SIGNAL")))]
            ]
            + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 7, 0)[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::CycleCommandSignal, 1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("NEXT SIGNAL →")))]
            ]
            + SHorizontalBox::Slot().AutoWidth()[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::ResetSiteFocus).ContentPadding(7)[
                    SNew(STextBlock).Text(FText::FromString(TEXT("CURRENT GROUND")))
                ]
            ]
        ];
        Root->AddSlot().AutoHeight().Padding(28, 2, 28, 9)[SNew(SBorder).Padding(12)[SignalCard]];
    }
    else if (!CinematicBeat && InspectedSite)
    {
        TSharedRef<SVerticalBox> IntelCard = SNew(SVerticalBox);
        IntelCard->AddSlot().AutoHeight()[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("WARTABLE FOCUS · %s · %s"), *InspectedSite->Status.ToUpper(), *InspectedSite->Name.Resolve(Locale))))
        ];
        IntelCard->AddSlot().AutoHeight().Padding(0, 6, 0, 2)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(InspectedSite->Summary.Resolve(Locale)))
        ];
        IntelCard->AddSlot().AutoHeight().Padding(0, 2, 0, 7)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("%s · %s"),
                Mode->IsInspectingRemoteSite() ? TEXT("INTELLIGENCE ONLY · NOT A DESTINATION") : TEXT("CURRENT PLAYABLE GROUND"),
                *InspectedSite->Uncertainty.Resolve(Locale))))
        ];
        IntelCard->AddSlot().AutoHeight()[
            SNew(SHorizontalBox)
            + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 7, 0)[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::CycleSite, -1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("← PREVIOUS SITE")))]
            ]
            + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 7, 0)[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::CycleSite, 1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("NEXT SITE →")))]
            ]
            + SHorizontalBox::Slot().AutoWidth()[
                SNew(SButton).IsEnabled(Mode->IsInspectingRemoteSite()).OnClicked(this, &SShiCommandScreen::ResetSiteFocus).ContentPadding(7)[
                    SNew(STextBlock).Text(FText::FromString(TEXT("CURRENT GROUND")))
                ]
            ]
        ];
        Root->AddSlot().AutoHeight().Padding(28, 2, 28, 9)[SNew(SBorder).Padding(12)[IntelCard]];
    }
    Root->AddSlot().AutoHeight().Padding(28, 2, 28, 4)[
        SNew(SHorizontalBox)
        + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 10, 0)[
            SNew(SButton).IsEnabled(Mode->IsAudioReady() && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::ToggleSound).ContentPadding(8)[
                SNew(STextBlock).Text(FText::FromString(Mode->IsSoundEnabled() ? TEXT("SOUND ON")
                    : Mode->IsSoundPreferred() ? TEXT("SOUND ARMED") : TEXT("SOUND OFF")))
            ]
        ]
        + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 10, 0)[
            SNew(SButton).IsEnabled(!Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::ToggleReducedMotion).ContentPadding(8)[
                SNew(STextBlock).Text(FText::FromString(Mode->IsReducedMotion()
                    ? TEXT("REDUCED MOTION · CUTS ONLY") : TEXT("CAMERA MOTION · RESTRAINED")))
            ]
        ]
        + SHorizontalBox::Slot().FillWidth(1).VAlign(VAlign_Center)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Mode->GetAudioStatus()))
        ]
    ];
    Root->AddSlot().AutoHeight().Padding(28, 2, 28, 7)[
        SNew(SHorizontalBox)
        + SHorizontalBox::Slot().AutoWidth()[SNew(SButton).IsEnabled(Mode->IsAudioReady() && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::AdjustAmbience, -1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("RAIN −")))]]
        + SHorizontalBox::Slot().AutoWidth().VAlign(VAlign_Center).Padding(8, 0)[SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%d%%"), FMath::RoundToInt(Mode->GetAmbienceLevel() * 100.f))))]
        + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 18, 0)[SNew(SButton).IsEnabled(Mode->IsAudioReady() && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::AdjustAmbience, 1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("RAIN +")))]]
        + SHorizontalBox::Slot().AutoWidth()[SNew(SButton).IsEnabled(Mode->IsAudioReady() && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::AdjustEffects, -1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("CUES −")))]]
        + SHorizontalBox::Slot().AutoWidth().VAlign(VAlign_Center).Padding(8, 0)[SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%d%%"), FMath::RoundToInt(Mode->GetEffectsLevel() * 100.f))))]
        + SHorizontalBox::Slot().AutoWidth()[SNew(SButton).IsEnabled(Mode->IsAudioReady() && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::AdjustEffects, 1).ContentPadding(7)[SNew(STextBlock).Text(FText::FromString(TEXT("CUES +")))]]
    ];
    Root->AddSlot().AutoHeight().Padding(28, 14, 28, 4)[SNew(STextBlock).Text(FText::FromString(Node->Title.Resolve(Locale)))];
    Root->AddSlot().AutoHeight().Padding(28, 4)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Node->Context.Resolve(Locale)))];
    TSharedRef<SVerticalBox> DialogueCard = SNew(SVerticalBox);
    if (CouncilSpeaker)
    {
        DialogueCard->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%s · %s"),
            *CouncilSpeaker->Name, *CouncilSpeaker->ProvenanceLabel)))];
        DialogueCard->AddSlot().AutoHeight().Padding(0, 4, 0, 8)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(CouncilSpeaker->Role))];
    }
    DialogueCard->AddSlot().AutoHeight()[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Node->Dialogue.Resolve(Locale)))];
    DialogueCard->AddSlot().AutoHeight().Padding(0, 8, 0, 0)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(CouncilStage.Disclosure))];
    Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(SBorder).Padding(16)[DialogueCard]];

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
            SNew(SButton).IsEnabled(bAvailable && !Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::Select, Index).ContentPadding(14)[
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
        SNew(SButton).IsEnabled(!Mode->IsCinematicSequenceActive() && !Mode->IsCompleted() && Mode->CanChoose(Selected)).OnClicked(this, &SShiCommandScreen::Issue).ContentPadding(16)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("ISSUE ORDER · %s"), *Selected.Label.Resolve(Locale))))
        ]
    ];
    if (!Mode->GetLastConsequence().IsEmpty())
        Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(SBorder).Padding(14)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Mode->GetLastConsequence()))]];
    if (Mode->IsCompleted())
    {
        const FString Completion = Mode->GetFailureReason().IsEmpty()
            ? TEXT("CHAPTER POSITION COMPLETE · YOUR CHRONICLE IS SEALED")
            : FString::Printf(TEXT("CHAPTER POSITION LOST · %s · THE CHRONICLE REMAINS REVIEWABLE"), *Mode->GetFailureReason().ToUpper());
        Root->AddSlot().AutoHeight().Padding(28, 10)[SNew(STextBlock).Text(FText::FromString(Completion))];
    }
    Root->AddSlot().AutoHeight().Padding(28, 8, 28, 4)[
        SNew(SHorizontalBox)
        + SHorizontalBox::Slot().AutoWidth().Padding(0, 0, 12, 0)[
            SNew(SButton).IsEnabled(!Mode->IsCinematicSequenceActive()).OnClicked(this, &SShiCommandScreen::NewChronicle).ContentPadding(10)[
                SNew(STextBlock).Text(FText::FromString(Mode->IsRestartArmed() ? TEXT("CONFIRM NEW CHRONICLE") : TEXT("NEW CHRONICLE")))
            ]
        ]
        + SHorizontalBox::Slot().FillWidth(1).VAlign(VAlign_Center)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(TEXT("CLICK 3D PIECE · D / R3 COUNCIL · TAB / RB SITES · C / L3 SIGNALS · SHIFT REVERSES · HOME CURRENT GROUND · SPACE / B SKIPS CONSEQUENCE · E / LB EVIDENCE · V / MENU MOTION · 1–3 SELECT · ←/→ ORDER · ENTER / GAMEPAD A ISSUE · M / GAMEPAD Y SOUND")))
        ]
    ];

    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot().FillWidth(0.48f)[
            SNew(SBorder).Padding(4).BorderBackgroundColor(FLinearColor(0.025f, 0.03f, 0.025f, 0.91f))[
                SNew(SScrollBox) + SScrollBox::Slot()[Root]
            ]
        ]
        + SHorizontalBox::Slot().FillWidth(0.52f)[SNullWidget::NullWidget];
}

TSharedRef<SWidget> SShiCommandScreen::BuildEvidenceLayout(AShiGameMode& Mode, const FShiNodeData& Node)
{
    const FShiCampaignModel& Campaign = Mode.GetCampaign();
    const FString Locale = Mode.GetLocale();
    const bool bRemoteSite = Mode.IsInspectingRemoteSite();
    const FShiSiteData* Site = Mode.GetInspectedSite();
    TArray<FString> ActiveSourceRefs = bRemoteSite ? TArray<FString>() : Node.SourceRefs;
    TArray<FString> ActiveClaimRefs = bRemoteSite ? TArray<FString>() : Node.ClaimRefs;
    if (Site)
    {
        for (const FString& SourceRef : Site->SourceRefs) ActiveSourceRefs.AddUnique(SourceRef);
        for (const FString& ClaimRef : Site->ClaimRefs) ActiveClaimRefs.AddUnique(ClaimRef);
    }
    TSharedRef<SVerticalBox> Root = SNew(SVerticalBox);

    Root->AddSlot().AutoHeight().Padding(28, 20, 28, 8)[
        SNew(SHorizontalBox)
        + SHorizontalBox::Slot().FillWidth(1).VAlign(VAlign_Center)[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("HISTORICAL BASIS · %s"),
                bRemoteSite && Site ? *Site->Name.Resolve(Locale) : *Node.Title.Resolve(Locale))))
        ]
        + SHorizontalBox::Slot().AutoWidth()[
            SNew(SButton).OnClicked(this, &SShiCommandScreen::ToggleEvidence).ContentPadding(10)[
                SNew(STextBlock).Text(FText::FromString(TEXT("RETURN TO COMMAND")))
            ]
        ]
    ];
    Root->AddSlot().AutoHeight().Padding(28, 4, 28, 10)[
        SNew(SBorder).Padding(14)[
            SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(bRemoteSite
                ? TEXT("SITE INTELLIGENCE ONLY · THIS IS NOT A DESTINATION OR FUTURE-VICTORY PROMISE · PUBLIC EDITION METADATA + PROJECT-AUTHORED NOTES ONLY · NO PRIVATE BOOK FILES OR INVENTED QUOTATIONS ARE PACKAGED")
                : TEXT("CURRENT SCENE + SITE BOUNDARY · PUBLIC EDITION METADATA + PROJECT-AUTHORED NOTES ONLY · NO PRIVATE BOOK FILES OR INVENTED QUOTATIONS ARE PACKAGED · LOCATORS IDENTIFY THE REVIEWABLE PASSAGE")))
        ]
    ];

    if (Site)
    {
        TSharedRef<SVerticalBox> SiteCard = SNew(SVerticalBox);
        SiteCard->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("WARTABLE INTELLIGENCE · %s · %s"), *Site->Status.ToUpper(), *Site->Name.Resolve(Locale))))];
        SiteCard->AddSlot().AutoHeight().Padding(0, 7)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Site->Summary.Resolve(Locale)))];
        SiteCard->AddSlot().AutoHeight()[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("UNCERTAINTY · %s"), *Site->Uncertainty.Resolve(Locale))))];
        Root->AddSlot().AutoHeight().Padding(28, 2, 28, 12)[SNew(SBorder).Padding(16)[SiteCard]];
    }

    Root->AddSlot().AutoHeight().Padding(28, 6, 28, 4)[
        SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("SOURCE REGISTER · %d ACTIVE"), ActiveSourceRefs.Num())))
    ];
    for (const FString& SourceId : ActiveSourceRefs)
    {
        const FShiSourceData* Source = Campaign.FindSource(SourceId);
        if (!Source) continue;
        FString Metadata = Source->Section;
        if (!Source->Author.IsEmpty()) Metadata += FString::Printf(TEXT("\n%s"), *Source->Author);
        if (!Source->Date.IsEmpty()) Metadata += FString::Printf(TEXT(" · %s"), *Source->Date);
        TSharedRef<SVerticalBox> SourceCard = SNew(SVerticalBox);
        SourceCard->AddSlot().AutoHeight()[SNew(STextBlock).Text(FText::FromString(SourceStatusLabel(Source->ClaimStatus)))];
        SourceCard->AddSlot().AutoHeight().Padding(0, 6, 0, 2)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Source->Work))];
        SourceCard->AddSlot().AutoHeight()[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Metadata))];
        SourceCard->AddSlot().AutoHeight().Padding(0, 8, 0, 2)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("EXACT LOCATOR · %s"), *Source->Locator)))];
        SourceCard->AddSlot().AutoHeight().Padding(0, 4)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Source->Note.Resolve(Locale)))];
        if (!Source->Url.IsEmpty())
        {
            SourceCard->AddSlot().AutoHeight().Padding(0, 7, 0, 0)[
                SNew(SButton).OnClicked(this, &SShiCommandScreen::OpenPublicEdition, Source->Url).ContentPadding(8)[
                    SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("OPEN PUBLIC EDITION · %s"), *Source->EditionId)))
                ]
            ];
        }
        else
        {
            SourceCard->AddSlot().AutoHeight().Padding(0, 7, 0, 0)[
                SNew(STextBlock).Text(FText::FromString(TEXT("PROJECT-ORIGINAL REGISTER · NO EXTERNAL SOURCE")))
            ];
        }
        Root->AddSlot().AutoHeight().Padding(28, 4)[SNew(SBorder).Padding(14)[SourceCard]];
    }

    Root->AddSlot().AutoHeight().Padding(28, 18, 28, 4)[
        SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("CLAIM REGISTER · %d ACTIVE"), ActiveClaimRefs.Num())))
    ];
    for (const FString& ClaimId : ActiveClaimRefs)
    {
        const FShiClaimData* Claim = Campaign.FindClaim(ClaimId);
        if (!Claim) continue;
        TSharedRef<SVerticalBox> ClaimCard = SNew(SVerticalBox);
        ClaimCard->AddSlot().AutoHeight()[
            SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%s · CONFIDENCE %s · %s"),
                *ClaimReviewLabel(Claim->ReviewStatus), *Claim->Confidence.ToUpper(), *Claim->Kind.ToUpper())))
        ];
        ClaimCard->AddSlot().AutoHeight().Padding(0, 7, 0, 4)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(Claim->Statement.Resolve(Locale)))];
        ClaimCard->AddSlot().AutoHeight().Padding(0, 2)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("UNCERTAINTY · %s"), *Claim->Uncertainty.Resolve(Locale))))];
        ClaimCard->AddSlot().AutoHeight().Padding(0, 2)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("GAME USE · %s"), *Claim->GameUse.Resolve(Locale))))];
        ClaimCard->AddSlot().AutoHeight().Padding(0, 5, 0, 0)[SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(FString::Printf(TEXT("SOURCE IDS · %s"), *FString::Join(Claim->SourceRefs, TEXT(" · ")))))];
        Root->AddSlot().AutoHeight().Padding(28, 4)[SNew(SBorder).Padding(14)[ClaimCard]];
    }
    Root->AddSlot().AutoHeight().Padding(28, 14, 28, 22)[
        SNew(STextBlock).AutoWrapText(true).Text(FText::FromString(TEXT("↑/↓ OR DPAD SCROLL · E / LEFT SHOULDER TO RETURN · ESC / GAMEPAD B ALSO CLOSES · OPENING THIS REGISTER NEVER CHANGES THE CHRONICLE")))
    ];

    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot().FillWidth(0.64f)[
            SNew(SBorder).Padding(4).BorderBackgroundColor(FLinearColor(0.025f, 0.03f, 0.025f, 0.95f))[
                SAssignNew(EvidenceScroll, SScrollBox) + SScrollBox::Slot()[Root]
            ]
        ]
        + SHorizontalBox::Slot().FillWidth(0.36f)[SNullWidget::NullWidget];
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

FReply SShiCommandScreen::SkipCinematic()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->SkipCinematicSequence();
    return FReply::Handled();
}

FReply SShiCommandScreen::NewChronicle()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->RequestNewChronicle();
    return FReply::Handled();
}

FReply SShiCommandScreen::ToggleEvidence()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->ToggleEvidence();
    return FReply::Handled();
}

FReply SShiCommandScreen::CycleSite(int32 Direction)
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->CycleInspectedSite(Direction);
    return FReply::Handled();
}

FReply SShiCommandScreen::CycleCommandSignal(int32 Direction)
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->CycleInspectedCommandSignal(Direction);
    return FReply::Handled();
}

FReply SShiCommandScreen::ResetSiteFocus()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->ResetInspectedSite();
    return FReply::Handled();
}

FReply SShiCommandScreen::FocusCouncil()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->PresentCouncil();
    return FReply::Handled();
}

FReply SShiCommandScreen::OpenPublicEdition(FString Url)
{
    if (Url.StartsWith(TEXT("https://"), ESearchCase::CaseSensitive)) FPlatformProcess::LaunchURL(*Url, nullptr, nullptr);
    return FReply::Handled();
}

FReply SShiCommandScreen::ToggleSound()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->ToggleSound();
    return FReply::Handled();
}

FReply SShiCommandScreen::ToggleReducedMotion()
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->ToggleReducedMotion();
    return FReply::Handled();
}

FReply SShiCommandScreen::AdjustAmbience(int32 Direction)
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->AdjustAmbience(Direction);
    return FReply::Handled();
}

FReply SShiCommandScreen::AdjustEffects(int32 Direction)
{
    if (AShiGameMode* Mode = GameMode.Get()) Mode->AdjustEffects(Direction);
    return FReply::Handled();
}
