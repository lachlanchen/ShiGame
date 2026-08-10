#pragma once

#include "CoreMinimal.h"
#include "ShiCampaignModel.h"

struct FShiCouncilParticipantData
{
    FString SlotId;
    FString CharacterId;
    FString Name;
    FString Role;
    FString ProvenanceLabel;
    bool bHistorical = false;
    bool bSpeaker = false;
    FTransform Transform;
    FLinearColor Color = FLinearColor::Black;
    int32 StencilValue = 0;
};

struct FShiCouncilStageData
{
    FString NodeId;
    FString SpeakerId;
    FString Dialogue;
    FString Disclosure;
    TArray<FShiCouncilParticipantData> Participants;
    FTransform CameraTransform;
    float FieldOfViewDegrees = 44.f;
};

struct FShiCouncilParticipantLightData
{
    FString LightId;
    FString SlotId;
    FVector Location = FVector::ZeroVector;
    FLinearColor Color = FLinearColor::Black;
    float IntensityLumens = 0.f;
    float AttenuationRadiusCentimeters = 0.f;
    float SourceRadiusCentimeters = 0.f;
};

class FShiCouncilStagingModel
{
public:
    static bool Build(const FShiCampaignModel& Campaign, const FShiNodeData& Node, const FString& Locale,
        FShiCouncilStageData& OutStage, FString& OutError);
    static bool Validate(const FShiCampaignModel& Campaign, const FShiNodeData& Node, const FString& Locale,
        const FShiCouncilStageData& Stage, FString& OutError);
    static const FShiCouncilParticipantData* FindParticipant(const FShiCouncilStageData& Stage, const FString& SlotId);
    static bool BuildParticipantReviewCamera(const FShiCouncilStageData& Stage, const FString& SlotId,
        FTransform& OutCamera, float& OutFieldOfViewDegrees, FString& OutError);
    static bool BuildParticipantLights(const FShiCouncilStageData& Stage,
        TArray<FShiCouncilParticipantLightData>& OutLights, FString& OutError);
};
