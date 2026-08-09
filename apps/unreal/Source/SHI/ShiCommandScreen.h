#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"

class AShiGameMode;
class SScrollBox;
struct FShiNodeData;

class SShiCommandScreen : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SShiCommandScreen) {}
        SLATE_ARGUMENT(AShiGameMode*, GameMode)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    void Refresh();
    void ScrollEvidence(int32 Direction);

private:
    TWeakObjectPtr<AShiGameMode> GameMode;
    TSharedPtr<SScrollBox> EvidenceScroll;
    TSharedRef<SWidget> BuildLayout();
    TSharedRef<SWidget> BuildEvidenceLayout(AShiGameMode& Mode, const FShiNodeData& Node);
    TSharedRef<SWidget> BuildEngagementLayout(AShiGameMode& Mode);
    FReply Select(int32 Index);
    FReply Issue();
    FReply OpenEngagement();
    FReply CloseEngagement();
    FReply SelectEngagement(int32 Index);
    FReply IssueEngagement();
    FReply SkipCinematic();
    FReply NewChronicle();
    FReply ToggleEvidence();
    FReply CycleSite(int32 Direction);
    FReply CycleCommandSignal(int32 Direction);
    FReply ResetSiteFocus();
    FReply FocusCouncil();
    FReply OpenPublicEdition(FString Url);
    FReply ToggleSound();
    FReply ToggleReducedMotion();
    FReply AdjustAmbience(int32 Direction);
    FReply AdjustEffects(int32 Direction);
};
