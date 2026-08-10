#include "ShiCouncilStagingModel.h"

namespace
{
    const FVector SpeakerFloor(136.f, 242.f, 0.f);
    const FVector KeeperFloor(-132.f, -238.f, 0.f);
    constexpr float CouncilFieldOfViewDegrees = 44.f;
    constexpr float CouncilFocusHeight = 95.f;
    const FVector SpeakerKeyOffset(150.f, -175.f, 195.f);
    const FVector SpeakerFillOffset(-125.f, -150.f, 165.f);
    const FVector KeeperKeyOffset(-150.f, 175.f, 195.f);
    const FVector KeeperFillOffset(125.f, 150.f, 165.f);
    constexpr float ParticipantLightSourceRadiusCentimeters = 0.f;

    FTransform FacingTable(const FVector& Floor)
    {
        const FRotator Rotation = (FVector(0.f, 0.f, 78.f) - (Floor + FVector(0.f, 0.f, 78.f))).Rotation();
        return FTransform(Rotation, Floor);
    }

    FTransform ParticipantCamera(const FVector& ParticipantFloor, bool bSpeaker)
    {
        const FVector Target = ParticipantFloor + FVector(0.f, 0.f, CouncilFocusHeight);
        const FVector Location = Target + (bSpeaker
            ? FVector(330.f, -390.f, 105.f)
            : FVector(-330.f, 390.f, 105.f));
        return FTransform((Target - Location).Rotation(), Location);
    }

    FTransform SpeakerCamera()
    {
        return ParticipantCamera(SpeakerFloor, true);
    }

    bool SameParticipant(const FShiCouncilParticipantData& Actual, const FString& SlotId,
        const FShiCharacterData& Character, const FString& Locale, bool bSpeaker)
    {
        const FTransform ExpectedTransform = FacingTable(bSpeaker ? SpeakerFloor : KeeperFloor);
        const FLinearColor ExpectedColor = bSpeaker
            ? Character.bHistorical ? FLinearColor(.58f, .25f, .07f) : FLinearColor(.46f, .16f, .10f)
            : FLinearColor(.10f, .21f, .25f);
        const FString ExpectedProvenance = Character.bHistorical ? TEXT("HISTORICAL FIGURE") : TEXT("DRAMATIC RECONSTRUCTION");
        return Actual.SlotId == SlotId && Actual.CharacterId == Character.Id
            && Actual.Name == Character.Name.Resolve(Locale) && Actual.Role == Character.Role.Resolve(Locale)
            && Actual.ProvenanceLabel == ExpectedProvenance && Actual.bHistorical == Character.bHistorical
            && Actual.bSpeaker == bSpeaker && Actual.Transform.Equals(ExpectedTransform, .0001f)
            && Actual.Color.Equals(ExpectedColor, .0001f) && Actual.StencilValue == (bSpeaker ? 4 : 5);
    }
}

const FShiCouncilParticipantData* FShiCouncilStagingModel::FindParticipant(
    const FShiCouncilStageData& Stage, const FString& SlotId)
{
    return Stage.Participants.FindByPredicate([&](const FShiCouncilParticipantData& Participant)
    {
        return Participant.SlotId == SlotId;
    });
}

bool FShiCouncilStagingModel::BuildParticipantReviewCamera(const FShiCouncilStageData& Stage,
    const FString& SlotId, FTransform& OutCamera, float& OutFieldOfViewDegrees, FString& OutError)
{
    if (SlotId != TEXT("speaker") && SlotId != TEXT("keeper"))
    {
        OutError = FString::Printf(TEXT("Council character review rejects unknown slot: %s."), *SlotId);
        return false;
    }
    const FShiCouncilParticipantData* Participant = FindParticipant(Stage, SlotId);
    if (!Participant || Participant->SlotId != SlotId)
    {
        OutError = FString::Printf(TEXT("Council character review cannot find exact slot: %s."), *SlotId);
        return false;
    }
    const FTransform Candidate = ParticipantCamera(Participant->Transform.GetLocation(), SlotId == TEXT("speaker"));
    const FVector Target = Participant->Transform.GetLocation() + FVector(0.f, 0.f, CouncilFocusHeight);
    const FVector Direction = (Target - Candidate.GetLocation()).GetSafeNormal();
    if (FVector::DotProduct(Candidate.GetRotation().GetForwardVector(), Direction) < .9999f)
    {
        OutError = TEXT("Council character review camera does not preserve the exact participant focus.");
        return false;
    }
    OutCamera = Candidate;
    OutFieldOfViewDegrees = CouncilFieldOfViewDegrees;
    OutError.Empty();
    return true;
}

bool FShiCouncilStagingModel::BuildParticipantLights(const FShiCouncilStageData& Stage,
    TArray<FShiCouncilParticipantLightData>& OutLights, FString& OutError)
{
    TArray<FShiCouncilParticipantLightData> Candidate;
    Candidate.Reserve(4);
    for (const FString& SlotId : { FString(TEXT("speaker")), FString(TEXT("keeper")) })
    {
        const FShiCouncilParticipantData* Participant = FindParticipant(Stage, SlotId);
        if (!Participant || Participant->SlotId != SlotId)
        {
            OutError = FString::Printf(TEXT("Council participant lighting cannot find exact slot: %s."), *SlotId);
            return false;
        }
        const auto AddLight = [&](const FString& LightId, const FVector& Offset,
            const FLinearColor& Color, float IntensityLumens, float RadiusCentimeters)
        {
            FShiCouncilParticipantLightData& Light = Candidate.AddDefaulted_GetRef();
            Light.LightId = LightId;
            Light.SlotId = SlotId;
            Light.Location = Participant->Transform.GetLocation() + Offset;
            Light.Color = Color;
            Light.IntensityLumens = IntensityLumens;
            Light.AttenuationRadiusCentimeters = RadiusCentimeters;
            Light.SourceRadiusCentimeters = ParticipantLightSourceRadiusCentimeters;
        };
        if (SlotId == TEXT("speaker"))
        {
            AddLight(TEXT("speaker-key"), SpeakerKeyOffset, FLinearColor(1.f, .76f, .54f), 2600.f, 520.f);
            AddLight(TEXT("speaker-fill"), SpeakerFillOffset, FLinearColor(.42f, .50f, .62f), 1800.f, 430.f);
        }
        else
        {
            AddLight(TEXT("keeper-key"), KeeperKeyOffset, FLinearColor(.36f, .52f, .72f), 2300.f, 520.f);
            AddLight(TEXT("keeper-fill"), KeeperFillOffset, FLinearColor(.90f, .66f, .46f), 1700.f, 430.f);
        }
    }
    TSet<FString> LightIds;
    for (const FShiCouncilParticipantLightData& Light : Candidate)
    {
        LightIds.Add(Light.LightId);
    }
    if (Candidate.Num() != 4 || LightIds.Num() != Candidate.Num()
        || Candidate[0].SlotId != TEXT("speaker") || Candidate[1].SlotId != TEXT("speaker")
        || Candidate[2].SlotId != TEXT("keeper") || Candidate[3].SlotId != TEXT("keeper")
        || FVector::Dist(Candidate[0].Location, Candidate[1].Location) < 250.f
        || FVector::Dist(Candidate[2].Location, Candidate[3].Location) < 250.f)
    {
        OutError = TEXT("Council participant lighting does not preserve four unique, separated key/fill sources.");
        return false;
    }
    OutLights = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilStagingModel::Build(const FShiCampaignModel& Campaign, const FShiNodeData& Node,
    const FString& Locale, FShiCouncilStageData& OutStage, FString& OutError)
{
    const FShiCharacterData* Speaker = Campaign.FindCharacter(Node.SpeakerId);
    const FShiCharacterData* Keeper = Campaign.FindCharacter(TEXT("keeper"));
    if (!Speaker || !Keeper || Speaker == Keeper)
    {
        OutError = TEXT("Council staging requires one canonical non-player speaker and the keeper viewpoint.");
        return false;
    }

    FShiCouncilStageData Candidate;
    Candidate.NodeId = Node.Id;
    Candidate.SpeakerId = Speaker->Id;
    Candidate.Dialogue = Node.Dialogue.Resolve(Locale);
    Candidate.Disclosure = Speaker->bHistorical
        ? TEXT("HISTORICAL FIGURE · WORDS ARE AUTHORED DRAMATIZATION, NOT TRANSCRIPT")
        : TEXT("FICTIONAL CHARACTER · PROJECT-AUTHORED DRAMATIC RECONSTRUCTION");
    Candidate.CameraTransform = SpeakerCamera();
    Candidate.FieldOfViewDegrees = CouncilFieldOfViewDegrees;

    FShiCouncilParticipantData& SpeakerParticipant = Candidate.Participants.AddDefaulted_GetRef();
    SpeakerParticipant.SlotId = TEXT("speaker");
    SpeakerParticipant.CharacterId = Speaker->Id;
    SpeakerParticipant.Name = Speaker->Name.Resolve(Locale);
    SpeakerParticipant.Role = Speaker->Role.Resolve(Locale);
    SpeakerParticipant.ProvenanceLabel = Speaker->bHistorical ? TEXT("HISTORICAL FIGURE") : TEXT("DRAMATIC RECONSTRUCTION");
    SpeakerParticipant.bHistorical = Speaker->bHistorical;
    SpeakerParticipant.bSpeaker = true;
    SpeakerParticipant.Transform = FacingTable(SpeakerFloor);
    SpeakerParticipant.Color = Speaker->bHistorical ? FLinearColor(.58f, .25f, .07f) : FLinearColor(.46f, .16f, .10f);
    SpeakerParticipant.StencilValue = 4;

    FShiCouncilParticipantData& KeeperParticipant = Candidate.Participants.AddDefaulted_GetRef();
    KeeperParticipant.SlotId = TEXT("keeper");
    KeeperParticipant.CharacterId = Keeper->Id;
    KeeperParticipant.Name = Keeper->Name.Resolve(Locale);
    KeeperParticipant.Role = Keeper->Role.Resolve(Locale);
    KeeperParticipant.ProvenanceLabel = TEXT("DRAMATIC RECONSTRUCTION");
    KeeperParticipant.bHistorical = false;
    KeeperParticipant.bSpeaker = false;
    KeeperParticipant.Transform = FacingTable(KeeperFloor);
    KeeperParticipant.Color = FLinearColor(.10f, .21f, .25f);
    KeeperParticipant.StencilValue = 5;

    if (!Validate(Campaign, Node, Locale, Candidate, OutError)) return false;
    OutStage = MoveTemp(Candidate);
    OutError.Empty();
    return true;
}

bool FShiCouncilStagingModel::Validate(const FShiCampaignModel& Campaign, const FShiNodeData& Node,
    const FString& Locale, const FShiCouncilStageData& Stage, FString& OutError)
{
    const FShiCharacterData* Speaker = Campaign.FindCharacter(Node.SpeakerId);
    const FShiCharacterData* Keeper = Campaign.FindCharacter(TEXT("keeper"));
    const FShiCouncilParticipantData* SpeakerParticipant = FindParticipant(Stage, TEXT("speaker"));
    const FShiCouncilParticipantData* KeeperParticipant = FindParticipant(Stage, TEXT("keeper"));
    const FTransform ExpectedCamera = SpeakerCamera();
    const FVector SpeakerTarget = SpeakerFloor + FVector(0.f, 0.f, CouncilFocusHeight);
    const FVector CameraDirection = (SpeakerTarget - Stage.CameraTransform.GetLocation()).GetSafeNormal();
    const bool bCameraLooksAtSpeaker = FVector::DotProduct(Stage.CameraTransform.GetRotation().GetForwardVector(), CameraDirection) > .9999f;
    if (!Speaker || !Keeper || Speaker == Keeper || Stage.NodeId != Node.Id || Stage.SpeakerId != Node.SpeakerId
        || Stage.Dialogue.IsEmpty() || Stage.Dialogue != Node.Dialogue.Resolve(Locale)
        || Stage.Participants.Num() != 2 || !SpeakerParticipant || !KeeperParticipant
        || !SameParticipant(*SpeakerParticipant, TEXT("speaker"), *Speaker, Locale, true)
        || !SameParticipant(*KeeperParticipant, TEXT("keeper"), *Keeper, Locale, false)
        || Stage.Disclosure != (Speaker->bHistorical
            ? TEXT("HISTORICAL FIGURE · WORDS ARE AUTHORED DRAMATIZATION, NOT TRANSCRIPT")
            : TEXT("FICTIONAL CHARACTER · PROJECT-AUTHORED DRAMATIC RECONSTRUCTION"))
        || !Stage.CameraTransform.Equals(ExpectedCamera, .0001f)
        || !FMath::IsNearlyEqual(Stage.FieldOfViewDegrees, CouncilFieldOfViewDegrees, .0001f)
        || !bCameraLooksAtSpeaker || FVector::Dist2D(SpeakerFloor, KeeperFloor) < 400.f)
    {
        OutError = FString::Printf(TEXT("Council stage %s cannot preserve canonical cast, disclosure, blocking and camera authorship."), *Node.Id);
        return false;
    }
    OutError.Empty();
    return true;
}
