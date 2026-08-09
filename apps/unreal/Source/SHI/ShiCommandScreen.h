#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"

class AShiGameMode;

class SShiCommandScreen : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SShiCommandScreen) {}
        SLATE_ARGUMENT(AShiGameMode*, GameMode)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    void Refresh();

private:
    TWeakObjectPtr<AShiGameMode> GameMode;
    TSharedRef<SWidget> BuildLayout();
    FReply Select(int32 Index);
    FReply Issue();
};
