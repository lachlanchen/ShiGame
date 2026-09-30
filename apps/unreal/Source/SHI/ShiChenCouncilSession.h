#pragma once

#include "ShiChenCouncilModel.h"

/** Single-writer local council session. Publish choices only after saving. */
class FShiChenCouncilSession
{
public:
    bool Open(const FString& Definition, const FShiCampaignSession& Chapter, const FString& Path, FString& Error);
    bool Commit(const FString& ChoiceId, FString& Error);
    const FShiChenCouncilModel& GetModel() const { return Model; }
    bool IsOpen() const { return !SavePath.IsEmpty(); }

private:
    FShiChenCouncilModel Model;
    FString SavePath;
    FString LastSavedJson;
    static bool WriteReplacement(const FString& Path, const FString& Json, FString& Error);
};
