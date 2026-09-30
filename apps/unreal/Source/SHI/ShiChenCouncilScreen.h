#pragma once
#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"
#include "ShiChenCouncilSession.h"

class FJsonObject;
class SShiChenCouncilScreen : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SShiChenCouncilScreen) {}
        SLATE_ARGUMENT(const FShiCampaignSession*, Chapter)
        SLATE_ARGUMENT(FString, Locale)
        SLATE_EVENT(FSimpleDelegate, OnClose)
    SLATE_END_ARGS()
    void Construct(const FArguments& Args);
    virtual bool SupportsKeyboardFocus() const override { return true; }
    virtual FReply OnKeyDown(const FGeometry& Geometry, const FKeyEvent& Event) override;
private:
    FShiChenCouncilSession Session;
    TSharedPtr<FJsonObject> Definition;
    FString Locale, Error, Selected, Arrival;
    bool bResponse = false;
    TSharedPtr<SWidget> PreferredFocus;
    FReply FocusReply();
    FSimpleDelegate Close;
    void Refresh();
    FString Text(const TSharedPtr<FJsonObject>& Object, const TCHAR* Field) const;
    TSharedPtr<FJsonObject> Choice(const FString& Id) const;
    FString Metrics(const TMap<FString, int32>& Values) const;
    FReply Select(FString Id);
    FReply Commit();
    FReply Continue();
    FReply ArmRestart();
    FReply ConfirmRestart();
    FReply CancelRestart();
};
