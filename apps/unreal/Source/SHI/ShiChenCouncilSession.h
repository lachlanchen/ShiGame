#pragma once

#include "ShiChenCouncilModel.h"

/** Single-writer local council session. Publish choices only after saving. */
class FShiChenCouncilSession
{
public:
    bool Open(const FString& Definition, const FShiCampaignSession& Chapter, const FString& Path, FString& Error);
    bool Commit(const FString& ChoiceId, FString& Error);
    bool ArmRestart();
    void CancelRestart() { bRestartArmed = false; }
    bool ConfirmRestart(FString& Error);
    bool IsRestartArmed() const { return bRestartArmed; }
    const FShiChenCouncilModel& GetModel() const { return Model; }
    bool IsOpen() const { return !SavePath.IsEmpty(); }

private:
    FShiChenCouncilModel Model;
    FShiChenCouncilModel InitialModel;
    bool bRestartArmed = false;
    FString SavePath;
    FString LastSavedJson;
    bool Publish(FShiChenCouncilModel Candidate, FString& Error);
};
