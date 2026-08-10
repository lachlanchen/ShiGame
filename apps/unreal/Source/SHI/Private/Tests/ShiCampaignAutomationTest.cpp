#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "ShiAudioModel.h"
#include "ShiCampaignModel.h"
#include "ShiCampaignSession.h"
#include "ShiCinematicBeatModel.h"
#include "ShiCommandSignalModel.h"
#include "ShiCommandSurfacePresentationModel.h"
#include "ShiCommandWeightPresentationModel.h"
#include "ShiDazeFieldShelterPresentationModel.h"
#include "ShiWetFieldEnvironmentPresentationModel.h"
#include "ShiCouncilStagingModel.h"
#include "ShiOrderTransactionModel.h"
#include "ShiRainPresentationModel.h"
#include "ShiWartableModel.h"

namespace
{
    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};

    FString OptionalString(const TSharedPtr<FJsonObject>& Object, const FString& Field)
    {
        FString Value;
        if (Object.IsValid()) Object->TryGetStringField(Field, Value);
        return Value;
    }

    bool CheckResources(FAutomationTestBase& Test, const FString& Context, const TMap<FString, int32>& Actual,
        const TSharedPtr<FJsonObject>& Parent, const FString& Field)
    {
        const TSharedPtr<FJsonObject>* Expected = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Expected) || !Expected || !Expected->IsValid())
        {
            Test.AddError(FString::Printf(TEXT("%s lacks resource snapshot %s."), *Context, *Field));
            return false;
        }
        bool bMatches = true;
        for (const FString& Key : ResourceKeys)
        {
            double ExpectedValue = 0;
            if (!(*Expected)->TryGetNumberField(Key, ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s lacks %s."), *Context, *Field, *Key));
                bMatches = false;
            }
            else if (Actual.FindRef(Key) != static_cast<int32>(ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s.%s expected %d, got %d."), *Context, *Field, *Key,
                    static_cast<int32>(ExpectedValue), Actual.FindRef(Key)));
                bMatches = false;
            }
        }
        return bMatches;
    }

    bool CheckDeltas(FAutomationTestBase& Test, const FString& Context, const TMap<FString, int32>& Actual,
        const TSharedPtr<FJsonObject>& Parent, const FString& Field)
    {
        const TSharedPtr<FJsonObject>* Expected = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Expected) || !Expected || !Expected->IsValid())
        {
            Test.AddError(FString::Printf(TEXT("%s lacks delta set %s."), *Context, *Field));
            return false;
        }
        bool bMatches = true;
        for (const FString& Key : ResourceKeys)
        {
            double ExpectedValue = 0;
            (*Expected)->TryGetNumberField(Key, ExpectedValue);
            if (Actual.FindRef(Key) != static_cast<int32>(ExpectedValue))
            {
                Test.AddError(FString::Printf(TEXT("%s.%s.%s expected %+d, got %+d."), *Context, *Field, *Key,
                    static_cast<int32>(ExpectedValue), Actual.FindRef(Key)));
                bMatches = false;
            }
        }
        return bMatches;
    }

    TMap<FString, int32> Deltas(const TMap<FString, int32>& Before, const TMap<FString, int32>& After)
    {
        TMap<FString, int32> Result;
        for (const FString& Key : ResourceKeys)
        {
            const int32 Delta = After.FindRef(Key) - Before.FindRef(Key);
            if (Delta != 0) Result.Add(Key, Delta);
        }
        return Result;
    }

    bool LoadConformance(TSharedPtr<FJsonObject>& OutRoot, FString& OutError)
    {
        FString Json;
        const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/chapter-01-replays.v1.json"));
        if (!FFileHelper::LoadFileToString(Json, *Path))
        {
            OutError = FString::Printf(TEXT("Could not read %s."), *Path);
            return false;
        }
        const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
        if (!FJsonSerializer::Deserialize(Reader, OutRoot) || !OutRoot.IsValid())
        {
            OutError = TEXT("Replay conformance fixture is invalid JSON.");
            return false;
        }
        return true;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignSchemaTest, "SHI.Campaign.SchemaV7Horizon", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignSchemaTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    TestTrue(TEXT("canonical campaign loads"), Campaign.LoadCanonical(Error));
    TestEqual(TEXT("schema version"), Campaign.SchemaVersion, 7);
    TestEqual(TEXT("authored acts"), Campaign.Acts.Num(), 3);
    const FShiNodeData* Start = Campaign.FindNode(Campaign.StartNodeId);
    TestNotNull(TEXT("start node"), Start);
    if (Start)
    {
        TestEqual(TEXT("opening has three orders"), Start->Choices.Num(), 3);
        TestEqual(TEXT("opening order advances"), Start->Choices[0].Next, FString(TEXT("open-council")));
    }
    TestEqual(TEXT("initial Exposure"), Campaign.InitialResources.FindRef(TEXT("danger")), 46);
    TestEqual(TEXT("canonical commitments"), Campaign.Commitments.Num(), 3);
    TestEqual(TEXT("canonical council cast"), Campaign.Characters.Num(), 5);
    TestEqual(TEXT("opening canonical speaker"), Start ? Start->SpeakerId : FString(), FString(TEXT("chen-sheng")));
    TestEqual(TEXT("pursuit stages"), Campaign.OppositionStages.Num(), 3);
    TestTrue(TEXT("act/time transitions validate"), Campaign.ValidateHorizon(Error));
    if (!Error.IsEmpty()) AddError(Error);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCouncilStagingTest, "SHI.Cinematic.CouncilStagingV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCouncilStagingTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    const FShiNodeData* Opening = Campaign.FindNode(Campaign.StartNodeId);
    TestNotNull(TEXT("opening council node exists"), Opening);
    if (!Opening) return false;

    FShiCouncilStageData Stage;
    TestTrue(TEXT("opening council blocks from canonical speaker data"),
        FShiCouncilStagingModel::Build(Campaign, *Opening, TEXT("en"), Stage, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("council stage binds its exact node"), Stage.NodeId, Opening->Id);
    TestEqual(TEXT("council stage binds Chen Sheng"), Stage.SpeakerId, FString(TEXT("chen-sheng")));
    TestEqual(TEXT("speaker and keeper occupy the scene"), Stage.Participants.Num(), 2);
    TestEqual(TEXT("authored dialogue shot uses a restrained lens"), Stage.FieldOfViewDegrees, 44.f);
    TestTrue(TEXT("historical dialogue is explicitly not a transcript"), Stage.Disclosure.Contains(TEXT("NOT TRANSCRIPT")));
    const FShiCouncilParticipantData* Speaker = FShiCouncilStagingModel::FindParticipant(Stage, TEXT("speaker"));
    const FShiCouncilParticipantData* Keeper = FShiCouncilStagingModel::FindParticipant(Stage, TEXT("keeper"));
    TestTrue(TEXT("historical speaker provenance survives staging"), Speaker && Speaker->bHistorical && Speaker->CharacterId == TEXT("chen-sheng"));
    TestTrue(TEXT("player viewpoint remains an identified reconstruction"), Keeper && !Keeper->bHistorical && Keeper->CharacterId == TEXT("keeper"));
    TestTrue(TEXT("canonical council stage validates"), FShiCouncilStagingModel::Validate(Campaign, *Opening, TEXT("en"), Stage, Error));

    const FTransform Camera = Stage.CameraTransform;
    const FVector SpeakerFocus = Speaker ? Speaker->Transform.GetLocation() + FVector(0.f, 0.f, 95.f) : FVector::ZeroVector;
    const FVector SpeakerDirection = (SpeakerFocus - Camera.GetLocation()).GetSafeNormal();
    TestTrue(TEXT("dialogue camera looks at the speaking figure and physical decision plane"),
        FVector::DotProduct(Camera.GetRotation().GetForwardVector(), SpeakerDirection) > .9999f);

    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    FShiResolutionResult Resolution;
    TestTrue(TEXT("opening order reaches the fictional household council"), Session.ResolveChoice(TEXT("read-the-names"), Resolution, Error));
    const FShiNodeData* HouseholdCouncil = Session.GetCurrentNode();
    FShiCouncilStageData FictionalStage;
    TestTrue(TEXT("next council restages from the new canonical node"), HouseholdCouncil
        && FShiCouncilStagingModel::Build(Campaign, *HouseholdCouncil, TEXT("en"), FictionalStage, Error));
    const FShiCouncilParticipantData* FictionalSpeaker = FShiCouncilStagingModel::FindParticipant(FictionalStage, TEXT("speaker"));
    TestTrue(TEXT("Aunt Yu is never presented as a historical person"), FictionalSpeaker
        && FictionalSpeaker->CharacterId == TEXT("yu-mu") && !FictionalSpeaker->bHistorical
        && FictionalStage.Disclosure.Contains(TEXT("FICTIONAL CHARACTER")));

    FShiCouncilStageData CastDrift = Stage;
    CastDrift.Participants[0].CharacterId = TEXT("wu-guang");
    TestFalse(TEXT("cast identity drift is rejected"), FShiCouncilStagingModel::Validate(Campaign, *Opening, TEXT("en"), CastDrift, Error));
    FShiCouncilStageData DialogueDrift = Stage;
    DialogueDrift.Dialogue = TEXT("Invented transcript");
    TestFalse(TEXT("dialogue drift is rejected"), FShiCouncilStagingModel::Validate(Campaign, *Opening, TEXT("en"), DialogueDrift, Error));
    FShiCouncilStageData CameraDrift = Stage;
    CameraDrift.CameraTransform.AddToTranslation(FVector(60.f, 0.f, 0.f));
    TestFalse(TEXT("unauthored dialogue camera drift is rejected"), FShiCouncilStagingModel::Validate(Campaign, *Opening, TEXT("en"), CameraDrift, Error));

    const FString StableStageNode = Stage.NodeId;
    FShiNodeData MissingSpeaker = *Opening;
    MissingSpeaker.SpeakerId = TEXT("unknown-person");
    TestFalse(TEXT("missing canonical speaker cannot replace an accepted stage"),
        FShiCouncilStagingModel::Build(Campaign, MissingSpeaker, TEXT("en"), Stage, Error));
    TestEqual(TEXT("failed council rebuild is atomic"), Stage.NodeId, StableStageNode);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCommandSurfacePresentationTest, "SHI.Cinematic.CommandSurfacePresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCommandSurfacePresentationTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    const FShiNodeData* Node = Session.GetCurrentNode();
    if (!Node || Node->Choices.IsEmpty())
    {
        AddError(TEXT("Opening command-surface composition has no node or order."));
        return false;
    }
    TArray<FShiCommandSignalData> Signals;
    TestTrue(TEXT("opening signals build for command-ground admission"),
        FShiCommandSignalModel::Build(Session.GetResources(), Session.GetCurrentFieldCondition(),
            Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(), Session.GetActiveCommitment(),
            &Node->Choices[0], TEXT("en"), Signals, Error));

    const FShiCommandSurfacePresentationData Presentation = FShiCommandSurfacePresentationModel::Build();
    TestTrue(TEXT("reviewed command ground contains every site and live signal"),
        FShiCommandSurfacePresentationModel::Validate(Presentation, Campaign.Sites, Signals, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestTrue(TEXT("command ground has identity world placement and exact top plane"),
        Presentation.Transform.Equals(FTransform::Identity, .0001f)
        && FMath::IsNearlyEqual(Presentation.BoundsMaximum.Z,
            FShiCommandSurfacePresentationModel::SurfaceTopZ(), .001f));
    TestFalse(TEXT("command ground is not an interaction target"), Presentation.bInteractive);
    TestFalse(TEXT("command ground has no runtime collision"), Presentation.bCollisionEnabled);
    TestTrue(TEXT("command ground remains beneath the non-authoritative engagement exercise"),
        Presentation.bVisibleDuringEngagement);

    const FTransform ReviewCamera = FShiCommandSurfacePresentationModel::ReviewCameraTransform();
    const FVector ReviewTarget(0.f, 0.f, 18.f);
    TestTrue(TEXT("surface review camera sees the whole authored command field"),
        FVector::DotProduct(ReviewCamera.GetRotation().GetForwardVector(),
            (ReviewTarget - ReviewCamera.GetLocation()).GetSafeNormal()) > .9999f
        && FVector::Dist(ReviewCamera.GetLocation(), ReviewTarget) > 900.f
        && FMath::IsNearlyEqual(FShiCommandSurfacePresentationModel::ReviewFieldOfViewDegrees(), 48.f));

    FShiCommandSurfacePresentationData Scaled = Presentation;
    Scaled.Transform.SetScale3D(FVector(1.01f));
    TestFalse(TEXT("unreviewed surface scaling is rejected"),
        FShiCommandSurfacePresentationModel::Validate(Scaled, Campaign.Sites, Signals, Error));
    FShiCommandSurfacePresentationData Colliding = Presentation;
    Colliding.bCollisionEnabled = true;
    TestFalse(TEXT("runtime surface collision is rejected"),
        FShiCommandSurfacePresentationModel::Validate(Colliding, Campaign.Sites, Signals, Error));
    FShiCommandSurfacePresentationData HiddenExercise = Presentation;
    HiddenExercise.bVisibleDuringEngagement = false;
    TestFalse(TEXT("a disappearing engagement ground is rejected"),
        FShiCommandSurfacePresentationModel::Validate(HiddenExercise, Campaign.Sites, Signals, Error));
    TArray<FShiCommandSignalData> EscapedSignals = Signals;
    EscapedSignals[0].Location.X = FShiCommandSurfacePresentationModel::HalfWidth() + 1.f;
    TestFalse(TEXT("a signal outside the safe command field is rejected"),
        FShiCommandSurfacePresentationModel::Validate(Presentation, Campaign.Sites, EscapedSignals, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiWetFieldEnvironmentPresentationTest, "SHI.Cinematic.WetFieldEnvironmentPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiWetFieldEnvironmentPresentationTest::RunTest(const FString& Parameters)
{
    const FShiWetFieldEnvironmentPresentationData Presentation = FShiWetFieldEnvironmentPresentationModel::Build();
    FString Error;
    TestTrue(TEXT("reviewed wet-field environment passes its presentation contract"),
        FShiWetFieldEnvironmentPresentationModel::Validate(Presentation, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestTrue(TEXT("wet field is a bounded identity-root environment below the command surface"),
        Presentation.Transform.Equals(FTransform::Identity, .0001f)
        && FMath::IsNearlyEqual(Presentation.BoundsMinimum.X, -FShiWetFieldEnvironmentPresentationModel::HalfExtent())
        && FMath::IsNearlyEqual(Presentation.BoundsMaximum.Y, FShiWetFieldEnvironmentPresentationModel::HalfExtent())
        && Presentation.BoundsMaximum.Z <= FShiCommandSurfacePresentationModel::Build().BoundsMinimum.Z
            - FShiWetFieldEnvironmentPresentationModel::MinimumCommandSurfaceClearance());
    TestFalse(TEXT("wet field is not an interaction target"), Presentation.bInteractive);
    TestFalse(TEXT("wet field collision is disabled"), Presentation.bCollisionEnabled);
    TestFalse(TEXT("wet field does not affect navigation"), Presentation.bAffectsNavigation);
    TestTrue(TEXT("wet field persists beneath Broken Crossing"), Presentation.bVisibleDuringEngagement);

    const FTransform ReviewCamera = FShiWetFieldEnvironmentPresentationModel::ReviewCameraTransform();
    const FVector ReviewTarget(0.f, 0.f, -10.f);
    TestTrue(TEXT("environment review camera sees the whole bounded field"),
        FVector::DotProduct(ReviewCamera.GetRotation().GetForwardVector(),
            (ReviewTarget - ReviewCamera.GetLocation()).GetSafeNormal()) > .9999f
        && FVector::Dist(ReviewCamera.GetLocation(), ReviewTarget) > 2400.f
        && FMath::IsNearlyEqual(FShiWetFieldEnvironmentPresentationModel::ReviewFieldOfViewDegrees(), 52.f)
        && FMath::IsNearlyEqual(FShiWetFieldEnvironmentPresentationModel::ExposureCompensation(), -1.5f));

    FShiWetFieldEnvironmentPresentationData Scaled = Presentation;
    Scaled.Transform.SetScale3D(FVector(1.01f));
    TestFalse(TEXT("unreviewed field scaling is rejected"),
        FShiWetFieldEnvironmentPresentationModel::Validate(Scaled, Error));
    FShiWetFieldEnvironmentPresentationData Colliding = Presentation;
    Colliding.bCollisionEnabled = true;
    TestFalse(TEXT("runtime field collision is rejected"),
        FShiWetFieldEnvironmentPresentationModel::Validate(Colliding, Error));
    FShiWetFieldEnvironmentPresentationData Navigable = Presentation;
    Navigable.bAffectsNavigation = true;
    TestFalse(TEXT("runtime field navigation authority is rejected"),
        FShiWetFieldEnvironmentPresentationModel::Validate(Navigable, Error));
    FShiWetFieldEnvironmentPresentationData HiddenExercise = Presentation;
    HiddenExercise.bVisibleDuringEngagement = false;
    TestFalse(TEXT("a disappearing engagement environment is rejected"),
        FShiWetFieldEnvironmentPresentationModel::Validate(HiddenExercise, Error));
    FShiWetFieldEnvironmentPresentationData Raised = Presentation;
    Raised.BoundsMaximum.Z = -5.f;
    TestFalse(TEXT("terrain that violates command-surface clearance is rejected"),
        FShiWetFieldEnvironmentPresentationModel::Validate(Raised, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiDazeFieldShelterPresentationTest,
    "SHI.Cinematic.DazeFieldShelterPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiDazeFieldShelterPresentationTest::RunTest(const FString& Parameters)
{
    const FShiDazeFieldShelterPresentationData Presentation =
        FShiDazeFieldShelterPresentationModel::Build();
    FString Error;
    TestTrue(TEXT("reviewed Daze field shelter passes its disclosed blockout contract"),
        FShiDazeFieldShelterPresentationModel::Validate(Presentation, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestTrue(TEXT("shelter is identity-rooted around rather than on the command surface"),
        Presentation.Transform.Equals(FTransform::Identity, .0001f)
        && Presentation.PostCenters.Num() == 4
        && FMath::IsNearlyEqual(Presentation.BoundsMaximum.Z,
            FShiDazeFieldShelterPresentationModel::MaximumZ(), .001f)
        && Presentation.MinimumEaveHeight >= 250.f);
    for (const FVector2D& Post : Presentation.PostCenters)
    {
        TestTrue(TEXT("each shelter post clears both command-surface axes"),
            FMath::Abs(Post.X) - Presentation.ConservativePostRadius
                >= FShiCommandSurfacePresentationModel::HalfWidth()
                    + FShiDazeFieldShelterPresentationModel::MinimumPostClearance()
            && FMath::Abs(Post.Y) - Presentation.ConservativePostRadius
                >= FShiCommandSurfacePresentationModel::HalfDepth()
                    + FShiDazeFieldShelterPresentationModel::MinimumPostClearance());
    }
    TestFalse(TEXT("shelter is not presented as an attested Daze reconstruction"),
        Presentation.bHistoricallyAttested);
    TestFalse(TEXT("shelter remains explicitly below final-art status"), Presentation.bFinalArt);
    TestFalse(TEXT("shelter is not an interaction target"), Presentation.bInteractive);
    TestFalse(TEXT("shelter collision is disabled"), Presentation.bCollisionEnabled);
    TestFalse(TEXT("shelter does not affect navigation"), Presentation.bAffectsNavigation);
    TestTrue(TEXT("shelter persists around the Broken Crossing exercise"),
        Presentation.bVisibleDuringEngagement);

    const FTransform ReviewCamera = FShiDazeFieldShelterPresentationModel::ReviewCameraTransform();
    const FVector ReviewTarget(0.f, 0.f, 150.f);
    TestTrue(TEXT("shelter review camera holds the roof and council clearance envelope"),
        FVector::DotProduct(ReviewCamera.GetRotation().GetForwardVector(),
            (ReviewTarget - ReviewCamera.GetLocation()).GetSafeNormal()) > .9999f
        && FVector::Dist(ReviewCamera.GetLocation(), ReviewTarget) > 1500.f
        && FMath::IsNearlyEqual(FShiDazeFieldShelterPresentationModel::ReviewFieldOfViewDegrees(), 52.f));

    FShiDazeFieldShelterPresentationData Scaled = Presentation;
    Scaled.Transform.SetScale3D(FVector(1.01f));
    TestFalse(TEXT("unreviewed shelter scaling is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(Scaled, Error));
    FShiDazeFieldShelterPresentationData Colliding = Presentation;
    Colliding.bCollisionEnabled = true;
    TestFalse(TEXT("runtime shelter collision is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(Colliding, Error));
    FShiDazeFieldShelterPresentationData Navigable = Presentation;
    Navigable.bAffectsNavigation = true;
    TestFalse(TEXT("runtime shelter navigation authority is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(Navigable, Error));
    FShiDazeFieldShelterPresentationData HiddenExercise = Presentation;
    HiddenExercise.bVisibleDuringEngagement = false;
    TestFalse(TEXT("a disappearing engagement shelter is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(HiddenExercise, Error));
    FShiDazeFieldShelterPresentationData FalseHistory = Presentation;
    FalseHistory.bHistoricallyAttested = true;
    TestFalse(TEXT("an unsupported reconstruction claim is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(FalseHistory, Error));
    FShiDazeFieldShelterPresentationData PrematureFinal = Presentation;
    PrematureFinal.bFinalArt = true;
    TestFalse(TEXT("premature final-art status is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(PrematureFinal, Error));
    FShiDazeFieldShelterPresentationData IntrudingPost = Presentation;
    IntrudingPost.PostCenters[0] = FVector2D(-330.f, -230.f);
    TestFalse(TEXT("a post entering command clearance is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(IntrudingPost, Error));
    FShiDazeFieldShelterPresentationData LowEave = Presentation;
    LowEave.MinimumEaveHeight = 240.f;
    TestFalse(TEXT("a shelter that compromises the council sightline is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(LowEave, Error));
    FShiDazeFieldShelterPresentationData TooTall = Presentation;
    TooTall.BoundsMaximum.Z = FShiDazeFieldShelterPresentationModel::MaximumAllowedHeight() + 1.f;
    TestFalse(TEXT("a shelter outside the reviewed vertical envelope is rejected"),
        FShiDazeFieldShelterPresentationModel::Validate(TooTall, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiDazeRainPresentationTest,
    "SHI.Cinematic.DazeRainPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiDazeRainPresentationTest::RunTest(const FString& Parameters)
{
    const FShiRainPresentationData Presentation = FShiRainPresentationModel::Build();
    FString Error;
    TestTrue(TEXT("reviewed Daze rain passes its disclosed presentation contract"),
        FShiRainPresentationModel::Validate(Presentation, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestTrue(TEXT("rain uses exactly two bounded instanced pools"),
        Presentation.StreakInstanceCount == FShiRainPresentationModel::StreakInstanceCount()
        && Presentation.RipplePoolInstanceCount == FShiRainPresentationModel::RipplePoolInstanceCount()
        && Presentation.StreakInstanceCount == 384
        && Presentation.RipplePoolInstanceCount == 72);
    TestTrue(TEXT("rain is deterministic and bounded to the admitted wet field"),
        Presentation.Seed == FShiRainPresentationModel::Seed()
        && Presentation.Transform.Equals(FTransform::Identity, .0001f)
        && Presentation.FieldHalfExtent.Equals(FVector2D(1200.f), .001f)
        && Presentation.Velocity.Equals(FVector(130.f, 45.f, -1900.f), .001f)
        && FMath::IsNearlyEqual(Presentation.MaximumDeltaSeconds, .05f, .001f));
    TestFalse(TEXT("rain is not presented as attested Daze weather"),
        Presentation.bHistoricallyAttestedWeather);
    TestFalse(TEXT("rain remains explicitly below final-art status"), Presentation.bFinalArt);
    TestFalse(TEXT("rain is not an interaction target"), Presentation.bInteractive);
    TestFalse(TEXT("rain collision is disabled"), Presentation.bCollisionEnabled);
    TestFalse(TEXT("rain does not affect navigation"), Presentation.bAffectsNavigation);
    TestFalse(TEXT("rain does not affect campaign or engagement rules"), Presentation.bAffectsGameplay);
    TestFalse(TEXT("rain visual state is never serialized"), Presentation.bSerialized);
    TestFalse(TEXT("visible rain is independent of the opt-in audio control"), Presentation.bTiedToRainAudio);
    TestTrue(TEXT("rain persists through the Broken Crossing exercise"), Presentation.bVisibleDuringEngagement);

    TestTrue(TEXT("the exact shelter footprint intercepts rain at the roof"),
        FShiRainPresentationModel::IsInsideShelterFootprint(FVector2D::ZeroVector)
        && FShiRainPresentationModel::IsInsideShelterFootprint(FVector2D(420.f, 336.7437f))
        && FMath::IsNearlyEqual(FShiRainPresentationModel::ImpactHeightAt(FVector2D::ZeroVector), 340.f));
    TestTrue(TEXT("exposed field rain reaches the admitted wet ground"),
        !FShiRainPresentationModel::IsInsideShelterFootprint(FVector2D(421.f, 0.f))
        && FMath::IsNearlyEqual(FShiRainPresentationModel::ImpactHeightAt(FVector2D(421.f, 0.f)), -5.f));
    TestFalse(TEXT("no ground ripple can spawn beneath the shelter"),
        FShiRainPresentationModel::CanSpawnGroundRipple(FVector2D(0.f, 0.f)));
    TestTrue(TEXT("an exposed ground impact may use the bounded ripple pool"),
        FShiRainPresentationModel::CanSpawnGroundRipple(FVector2D(600.f, 0.f)));

    const FTransform ReviewCamera = FShiRainPresentationModel::ReviewCameraTransform();
    const FVector ReviewTarget(0.f, 0.f, 175.f);
    TestTrue(TEXT("rain review camera holds exposed field, roof edge and command shelter"),
        FVector::DotProduct(ReviewCamera.GetRotation().GetForwardVector(),
            (ReviewTarget - ReviewCamera.GetLocation()).GetSafeNormal()) > .9999f
        && FVector::Dist(ReviewCamera.GetLocation(), ReviewTarget) > 1500.f
        && FMath::IsNearlyEqual(FShiRainPresentationModel::ReviewFieldOfViewDegrees(), 50.f));

    FShiRainPresentationData Scaled = Presentation;
    Scaled.Transform.SetScale3D(FVector(1.01f));
    TestFalse(TEXT("unreviewed rain-field scaling is rejected"),
        FShiRainPresentationModel::Validate(Scaled, Error));
    FShiRainPresentationData Oversubscribed = Presentation;
    Oversubscribed.StreakInstanceCount += 1;
    TestFalse(TEXT("a per-drop or oversized rain pool is rejected"),
        FShiRainPresentationModel::Validate(Oversubscribed, Error));
    FShiRainPresentationData Colliding = Presentation;
    Colliding.bCollisionEnabled = true;
    TestFalse(TEXT("runtime rain collision is rejected"),
        FShiRainPresentationModel::Validate(Colliding, Error));
    FShiRainPresentationData Navigable = Presentation;
    Navigable.bAffectsNavigation = true;
    TestFalse(TEXT("runtime rain navigation authority is rejected"),
        FShiRainPresentationModel::Validate(Navigable, Error));
    FShiRainPresentationData Authoritative = Presentation;
    Authoritative.bAffectsGameplay = true;
    TestFalse(TEXT("hidden gameplay weather authority is rejected"),
        FShiRainPresentationModel::Validate(Authoritative, Error));
    FShiRainPresentationData Serialized = Presentation;
    Serialized.bSerialized = true;
    TestFalse(TEXT("serialized cosmetic rain state is rejected"),
        FShiRainPresentationModel::Validate(Serialized, Error));
    FShiRainPresentationData AudioCoupled = Presentation;
    AudioCoupled.bTiedToRainAudio = true;
    TestFalse(TEXT("audio-coupled rain visibility is rejected"),
        FShiRainPresentationModel::Validate(AudioCoupled, Error));
    FShiRainPresentationData FalseHistory = Presentation;
    FalseHistory.bHistoricallyAttestedWeather = true;
    TestFalse(TEXT("an unsupported exact-weather claim is rejected"),
        FShiRainPresentationModel::Validate(FalseHistory, Error));
    FShiRainPresentationData PrematureFinal = Presentation;
    PrematureFinal.bFinalArt = true;
    TestFalse(TEXT("premature final-weather status is rejected"),
        FShiRainPresentationModel::Validate(PrematureFinal, Error));
    FShiRainPresentationData HiddenExercise = Presentation;
    HiddenExercise.bVisibleDuringEngagement = false;
    TestFalse(TEXT("rain disappearing from the engagement is rejected"),
        FShiRainPresentationModel::Validate(HiddenExercise, Error));
    FShiRainPresentationData RoofLeak = Presentation;
    RoofLeak.ShelterRoofIntercept = Presentation.GroundIntercept;
    TestFalse(TEXT("a rain field that leaks through the shelter is rejected"),
        FShiRainPresentationModel::Validate(RoofLeak, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCommandWeightPresentationTest, "SHI.Cinematic.CommandWeightPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCommandWeightPresentationTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    const FShiNodeData* Node = Session.GetCurrentNode();
    if (!Node || Node->Choices.IsEmpty()) { AddError(TEXT("Opening command-weight composition has no node or order.")); return false; }

    TArray<FShiCommandSignalData> Signals;
    TestTrue(TEXT("opening signals build for prop clearance"), FShiCommandSignalModel::Build(Session.GetResources(),
        Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(),
        Session.GetActiveCommitment(), &Node->Choices[0], TEXT("en"), Signals, Error));
    FShiCouncilStageData Stage;
    TestTrue(TEXT("opening council builds for prop composition"),
        FShiCouncilStagingModel::Build(Campaign, *Node, TEXT("en"), Stage, Error));
    const FShiCommandWeightPresentationData Presentation = FShiCommandWeightPresentationModel::Build();
    TestTrue(TEXT("command weight preserves contact, pointer clearance and the 44-degree safe frame"),
        FShiCommandWeightPresentationModel::Validate(Presentation, Campaign.Sites, Signals, Stage, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestFalse(TEXT("command weight is not a gameplay interaction target"), Presentation.bInteractive);
    TestFalse(TEXT("command weight leaves the non-authoritative engagement exercise"), Presentation.bVisibleDuringEngagement);
    TestTrue(TEXT("command weight retains exact centimeter scale"),
        Presentation.Transform.GetScale3D().Equals(FVector::OneVector, .0001f));

    FVector2D FramePoint;
    float Depth = 0.f;
    const FVector WorldCenter = Presentation.Transform.TransformPosition(
        (Presentation.BoundsMinimum + Presentation.BoundsMaximum) * .5f);
    TestTrue(TEXT("command weight projects in front of the council camera"),
        FShiCommandWeightPresentationModel::ProjectToCouncilFrame(Stage, WorldCenter, FramePoint, Depth) && Depth > 0.f);
    TestTrue(TEXT("command weight occupies the lower decision-object field without covering the speaker"),
        FMath::Abs(FramePoint.X) > .05f && FMath::Abs(FramePoint.X) < .75f
        && FramePoint.Y > -.82f && FramePoint.Y < -.45f);

    const FTransform FrontReview = FShiCommandWeightPresentationModel::ReviewCameraTransform(Presentation, false);
    const FTransform BackReview = FShiCommandWeightPresentationModel::ReviewCameraTransform(Presentation, true);
    const FVector ReviewTarget = WorldCenter;
    const FVector FrontDirection = (ReviewTarget - FrontReview.GetLocation()).GetSafeNormal();
    const FVector BackDirection = (ReviewTarget - BackReview.GetLocation()).GetSafeNormal();
    TestTrue(TEXT("development front review camera looks exactly at the admitted prop"),
        FVector::DotProduct(FrontReview.GetRotation().GetForwardVector(), FrontDirection) > .9999f);
    TestTrue(TEXT("development back review camera looks exactly at the admitted prop"),
        FVector::DotProduct(BackReview.GetRotation().GetForwardVector(), BackDirection) > .9999f);
    TestTrue(TEXT("front and back review cameras preserve opposite material/contact evidence"),
        FVector::DotProduct(FrontDirection, BackDirection) < -.55f
        && FVector::Dist(FrontReview.GetLocation(), ReviewTarget) > 70.f
        && FVector::Dist(FrontReview.GetLocation(), ReviewTarget) < 90.f
        && FMath::IsNearlyEqual(FShiCommandWeightPresentationModel::ReviewFieldOfViewDegrees(), 28.f));

    FShiCommandWeightPresentationData Crowded = Presentation;
    Crowded.Transform.SetLocation(Signals.Last().Location);
    TestFalse(TEXT("a prop that crowds a live signal is rejected"),
        FShiCommandWeightPresentationModel::Validate(Crowded, Campaign.Sites, Signals, Stage, Error));
    FShiCommandWeightPresentationData Floating = Presentation;
    Floating.Transform.AddToTranslation(FVector(0.f, 0.f, 20.f));
    TestFalse(TEXT("a floating command weight is rejected"),
        FShiCommandWeightPresentationModel::Validate(Floating, Campaign.Sites, Signals, Stage, Error));
    FShiCouncilStageData LensDrift = Stage;
    LensDrift.FieldOfViewDegrees = 58.f;
    TestFalse(TEXT("an unauthored council lens cannot admit the prop"),
        FShiCommandWeightPresentationModel::Validate(Presentation, Campaign.Sites, Signals, LensDrift, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiHistoricalEvidenceTest, "SHI.History.SourceClaimClosureV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiHistoricalEvidenceTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TestEqual(TEXT("registered public/project editions"), Campaign.Editions.Num(), 5);
    TestEqual(TEXT("canonical public source records"), Campaign.Sources.Num(), 7);
    TestEqual(TEXT("canonical historical claims"), Campaign.Claims.Num(), 13);
    TestTrue(TEXT("source, edition, claim and scene closure validates"), Campaign.ValidateEvidence(Error));
    if (!Error.IsEmpty()) AddError(Error);

    const FShiNodeData* Opening = Campaign.FindNode(Campaign.StartNodeId);
    TestNotNull(TEXT("opening evidence boundary exists"), Opening);
    if (Opening)
    {
        TestEqual(TEXT("opening exposes four source records"), Opening->SourceRefs.Num(), 4);
        TestEqual(TEXT("opening exposes nine claim records"), Opening->ClaimRefs.Num(), 9);
    }
    const FShiSourceData* Sunzi = Campaign.FindSource(TEXT("sunzi-1-calculation"));
    TestNotNull(TEXT("Sunzi design lens is registered"), Sunzi);
    if (Sunzi) TestEqual(TEXT("Sunzi is not episode evidence"), Sunzi->ClaimStatus, FString(TEXT("strategic-text")));
    const FShiSourceData* Reconstruction = Campaign.FindSource(TEXT("dramatic-daze-keeper"));
    TestNotNull(TEXT("authored reconstruction is registered"), Reconstruction);
    if (Reconstruction)
    {
        TestEqual(TEXT("reconstruction rights are project-original"), Reconstruction->RightsStatus, FString(TEXT("project-original")));
        TestTrue(TEXT("reconstruction has no external URL"), Reconstruction->Url.IsEmpty());
    }
    const FShiClaimData* Penalty = Campaign.FindClaim(TEXT("daze-delay-penalty-account"));
    TestNotNull(TEXT("contested penalty claim is registered"), Penalty);
    if (Penalty)
    {
        TestEqual(TEXT("penalty claim remains specialist-gated"), Penalty->ReviewStatus, FString(TEXT("specialist-review-required")));
        TestEqual(TEXT("penalty claim confidence remains low"), Penalty->Confidence, FString(TEXT("low")));
    }

    FShiCampaignModel MissingSource = Campaign;
    MissingSource.Nodes[0].SourceRefs.Remove(TEXT("shiji-48-daze"));
    TestFalse(TEXT("a scene cannot expose a claim without all of its sources"), MissingSource.ValidateEvidence(Error));
    FShiCampaignModel PrivatePath = Campaign;
    PrivatePath.Sources[0].Url = TEXT("file:///private-source.pdf");
    TestFalse(TEXT("private/local source paths are rejected"), PrivatePath.ValidateEvidence(Error));
    FShiCampaignModel RightsDrift = Campaign;
    RightsDrift.Sources[0].RightsStatus = TEXT("project-original");
    TestFalse(TEXT("source rights must match its public edition"), RightsDrift.ValidateEvidence(Error));
    FShiCampaignModel OriginDrift = Campaign;
    OriginDrift.Sources[0].Url = TEXT("https://example.com/not-the-registered-edition");
    TestFalse(TEXT("public links must remain on the registered edition origin"), OriginDrift.ValidateEvidence(Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiWartableSpatialIntelligenceTest, "SHI.Wartable.SpatialIntelligenceV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiWartableSpatialIntelligenceTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TestEqual(TEXT("five inspectable intelligence sites"), Campaign.Sites.Num(), 5);
    TestTrue(TEXT("canonical sites fit the bounded wartable"), FShiWartableModel::Validate(Campaign.Sites, Error));
    if (!Error.IsEmpty()) AddError(Error);

    const FShiSiteData* Daze = Campaign.FindSite(TEXT("daze"));
    TestNotNull(TEXT("Daze marker exists"), Daze);
    if (Daze)
    {
        TestTrue(TEXT("Daze projection is deterministic"), FShiWartableModel::ProjectSite(*Daze).Equals(FVector(82.8f, 33.6f, 28.f), .001f));
        const FTransform Camera = FShiWartableModel::CameraTransform(*Daze);
        const FVector TargetDirection = (FShiWartableModel::ProjectSite(*Daze) + FVector(0.f, 0.f, 12.f) - Camera.GetLocation()).GetSafeNormal();
        TestTrue(TEXT("site camera looks at its intelligence marker"), FVector::DotProduct(Camera.GetRotation().GetForwardVector(), TargetDirection) > .9999f);
    }

    const FShiWartableMarkerStyle Known = FShiWartableModel::MarkerStyle(TEXT("known"), false);
    const FShiWartableMarkerStyle Reported = FShiWartableModel::MarkerStyle(TEXT("reported"), false);
    const FShiWartableMarkerStyle Reference = FShiWartableModel::MarkerStyle(TEXT("reference"), false);
    const FShiWartableMarkerStyle Selected = FShiWartableModel::MarkerStyle(TEXT("known"), true);
    TestTrue(TEXT("known/reported/reference use non-color-distinct geometry"), Known.MeshPath != Reported.MeshPath && Known.MeshPath != Reference.MeshPath && Reported.MeshPath != Reference.MeshPath);
    TestTrue(TEXT("selected geometry enlarges visibly"), Selected.Scale.GetMin() > Known.Scale.GetMin());
    TestTrue(TEXT("statuses have distinct stencil identities"), Known.StencilValue != Reported.StencilValue && Known.StencilValue != Reference.StencilValue && Reported.StencilValue != Reference.StencilValue);

    FString Cursor = Campaign.Sites[0].Id;
    for (int32 Index = 0; Index < Campaign.Sites.Num(); ++Index) Cursor = FShiWartableModel::CycleSite(Campaign.Sites, Cursor, 1);
    TestEqual(TEXT("forward site inspection wraps exactly"), Cursor, Campaign.Sites[0].Id);
    TestEqual(TEXT("reverse site inspection wraps to the final site"), FShiWartableModel::CycleSite(Campaign.Sites, Campaign.Sites[0].Id, -1), Campaign.Sites.Last().Id);
    TestEqual(TEXT("unknown forward focus starts at the first site"), FShiWartableModel::CycleSite(Campaign.Sites, TEXT("unknown"), 1), Campaign.Sites[0].Id);

    TArray<FShiSiteData> Overlap = Campaign.Sites;
    Overlap[1].X = Overlap[0].X;
    Overlap[1].Z = Overlap[0].Z;
    TestFalse(TEXT("overlapping pointer targets are rejected"), FShiWartableModel::Validate(Overlap, Error));
    TArray<FShiSiteData> UnknownStatus = Campaign.Sites;
    UnknownStatus[0].Status = TEXT("prophecy");
    TestFalse(TEXT("unsupported hindsight marker status is rejected"), FShiWartableModel::Validate(UnknownStatus, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCommandSpaceLiveSignalsTest, "SHI.CommandSpace.LiveSignalsV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCommandSpaceLiveSignalsTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    const FShiNodeData* Node = Session.GetCurrentNode();
    TestNotNull(TEXT("signal scene exists"), Node);
    if (!Node || Node->Choices.IsEmpty()) return false;

    TArray<FShiCommandSignalData> Signals;
    TestTrue(TEXT("initial live command signals build"), FShiCommandSignalModel::Build(Session.GetResources(),
        Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(),
        Session.GetActiveCommitment(), &Node->Choices[0], TEXT("en"), Signals, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("five resources and four tactical layers are visible"), Signals.Num(), 9);
    TestTrue(TEXT("live command signals pass bounded spatial validation"), FShiCommandSignalModel::Validate(Signals, Error));
    TestTrue(TEXT("site and command pointer targets remain jointly separated"), FShiCommandSignalModel::ValidateAgainstSites(Signals, Campaign.Sites, Error));

    const FShiCommandSignalData* Grain = FShiCommandSignalModel::Find(Signals, TEXT("resource-grain"));
    const FShiCommandSignalData* Danger = FShiCommandSignalModel::Find(Signals, TEXT("resource-danger"));
    const FShiCommandSignalData* Pursuit = FShiCommandSignalModel::Find(Signals, TEXT("layer-pursuit"));
    const FShiCommandSignalData* Method = FShiCommandSignalModel::Find(Signals, TEXT("layer-method-read"));
    const FShiCommandSignalData* Oath = FShiCommandSignalModel::Find(Signals, TEXT("layer-commitment"));
    TestNotNull(TEXT("grain tally exists"), Grain);
    TestNotNull(TEXT("danger tally exists"), Danger);
    TestNotNull(TEXT("pursuit signal exists"), Pursuit);
    TestNotNull(TEXT("method-read signal exists"), Method);
    TestNotNull(TEXT("oath signal exists even before an oath is active"), Oath);
    if (Grain)
    {
        TestEqual(TEXT("grain tally carries the exact initial value"), Grain->NumericValue, 42);
        TestTrue(TEXT("resource height remains anchored to the table"), FMath::IsNearlyEqual(Grain->Location.Z - Grain->Scale.Z * 50.f, 14.f, .001f));
        const FShiCommandSignalData Selected = FShiCommandSignalModel::SelectedStyle(*Grain, true);
        TestTrue(TEXT("selected tally grows visibly"), Selected.Scale.GetMin() > Grain->Scale.GetMin());
        TestTrue(TEXT("selected tally remains anchored"), FMath::IsNearlyEqual(Selected.Location.Z - Selected.Scale.Z * 50.f, 14.f, .001f));
        const FTransform Camera = FShiCommandSignalModel::CameraTransform(*Grain);
        const FVector TargetDirection = (Grain->Location + FVector(0.f, 0.f, 10.f) - Camera.GetLocation()).GetSafeNormal();
        TestTrue(TEXT("signal camera looks at the inspected tally"), FVector::DotProduct(Camera.GetRotation().GetForwardVector(), TargetDirection) > .9999f);
    }
    if (Danger) TestEqual(TEXT("danger tally carries exact Exposure"), Danger->NumericValue, Session.GetResources().FindRef(TEXT("danger")));
    if (Pursuit) TestTrue(TEXT("pursuit signal names the active stage"), Pursuit->State.Contains(TEXT("Scattered watch")));
    if (Method) TestTrue(TEXT("opening method signal discloses a neutral read"), Method->State.Contains(TEXT("NEUTRAL")));
    if (Oath) TestFalse(TEXT("opening oath piece is visibly inactive"), Oath->bActive);

    TMap<FString, int32> CapturedResources = Session.GetResources();
    CapturedResources.FindOrAdd(TEXT("danger")) = 100;
    TArray<FShiCommandSignalData> CapturedSignals;
    TestTrue(TEXT("captured terminal state has an exact pursuit-closed signal"), FShiCommandSignalModel::Build(CapturedResources,
        Session.GetCurrentFieldCondition(), nullptr, Session.GetCurrentMethodRead(), Session.GetActiveCommitment(),
        &Node->Choices[0], TEXT("en"), CapturedSignals, Error));
    const FShiCommandSignalData* CapturedPursuit = FShiCommandSignalModel::Find(CapturedSignals, TEXT("layer-pursuit"));
    TestTrue(TEXT("captured signal discloses the terminal Exposure value"), CapturedPursuit
        && CapturedPursuit->State.Contains(TEXT("CAPTURED")) && CapturedPursuit->Detail.Contains(TEXT("100 / 100")));

    FString Cursor = Signals[0].Id;
    for (int32 Index = 0; Index < Signals.Num(); ++Index) Cursor = FShiCommandSignalModel::CycleSignal(Signals, Cursor, 1);
    TestEqual(TEXT("command signal cycling wraps exactly"), Cursor, Signals[0].Id);
    TestEqual(TEXT("reverse signal cycling wraps to the final layer"),
        FShiCommandSignalModel::CycleSignal(Signals, Signals[0].Id, -1), Signals.Last().Id);

    FShiResolutionResult Resolution;
    TestTrue(TEXT("opening order resolves before live-signal refresh"), Session.ResolveChoice(TEXT("read-the-names"), Resolution, Error));
    const FShiNodeData* NextNode = Session.GetCurrentNode();
    TestNotNull(TEXT("next signal scene exists"), NextNode);
    if (NextNode && !NextNode->Choices.IsEmpty())
    {
        TestTrue(TEXT("post-order signals rebuild from authoritative state"), FShiCommandSignalModel::Build(Session.GetResources(),
            Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(),
            Session.GetActiveCommitment(), &NextNode->Choices[0], TEXT("en"), Signals, Error));
        Oath = FShiCommandSignalModel::Find(Signals, TEXT("layer-commitment"));
        TestTrue(TEXT("the carried oath becomes a live world signal"), Oath && Oath->bActive && Oath->State.Contains(TEXT("Names under protection")));
        Grain = FShiCommandSignalModel::Find(Signals, TEXT("resource-grain"));
        TestTrue(TEXT("resource tallies refresh from authoritative post-order values"), Grain && Grain->NumericValue == Session.GetResources().FindRef(TEXT("grain")));
    }

    TArray<FShiCommandSignalData> Overlap = Signals;
    Overlap[1].Location = Overlap[0].Location;
    TestFalse(TEXT("overlapping live command signals are rejected"), FShiCommandSignalModel::Validate(Overlap, Error));
    TArray<FShiCommandSignalData> Floating = Signals;
    Floating[0].Location.Z += 4.f;
    TestFalse(TEXT("floating resource tallies are rejected"), FShiCommandSignalModel::Validate(Floating, Error));
    TArray<FShiSiteData> SiteCollision = Campaign.Sites;
    SiteCollision[0].X = (Signals[0].Location.X / 4.6f) + 50.f;
    SiteCollision[0].Z = (Signals[0].Location.Y / 2.8f) + 50.f;
    TestFalse(TEXT("cross-family pointer overlap is rejected"), FShiCommandSignalModel::ValidateAgainstSites(Signals, SiteCollision, Error));
    TMap<FString, int32> MissingResource = Session.GetResources();
    MissingResource.Remove(TEXT("grain"));
    const int32 StableSignalCount = Signals.Num();
    const FString StableFirstSignalId = Signals[0].Id;
    TestFalse(TEXT("missing authoritative resources reject the signal snapshot"), FShiCommandSignalModel::Build(MissingResource,
        Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(),
        Session.GetActiveCommitment(), NextNode && !NextNode->Choices.IsEmpty() ? &NextNode->Choices[0] : nullptr,
        TEXT("en"), Signals, Error));
    TestTrue(TEXT("failed signal rebuild is atomic"), Signals.Num() == StableSignalCount && Signals[0].Id == StableFirstSignalId);
    TestFalse(TEXT("nonterminal state cannot omit its pursuit band"), FShiCommandSignalModel::Build(Session.GetResources(),
        Session.GetCurrentFieldCondition(), nullptr, Session.GetCurrentMethodRead(), Session.GetActiveCommitment(),
        NextNode && !NextNode->Choices.IsEmpty() ? &NextNode->Choices[0] : nullptr, TEXT("en"), Signals, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiOrderTransactionTest, "SHI.Campaign.OrderTransactionV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiOrderTransactionTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    FString BeforeSave;
    TestTrue(TEXT("pre-order session exports for immutability proof"), Session.ExportSaveJson(BeforeSave, Error));

    FShiOrderTransactionData Transaction;
    TestTrue(TEXT("one order preflights rule, world and cinema together"), FShiOrderTransactionModel::Build(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), Transaction, Error));
    if (!Error.IsEmpty()) AddError(Error);
    FString UnchangedSave;
    TestTrue(TEXT("preflight source session still exports"), Session.ExportSaveJson(UnchangedSave, Error));
    TestEqual(TEXT("order preflight never mutates the active chronicle"), UnchangedSave, BeforeSave);
    TestEqual(TEXT("prepared transaction appends exactly one decision"), Transaction.Session.GetHistory().Num(), 1);
    TestEqual(TEXT("prepared transaction advances to organization"), Transaction.Session.GetCurrentNodeId(), FString(TEXT("open-council")));
    TestEqual(TEXT("prepared world contains five resources and four tactical layers"), Transaction.CommandSignals.Num(), 9);
    TestEqual(TEXT("prepared opening cinema retains its oath beat"), Transaction.CinematicBeats.Num(), 7);
    TestEqual(TEXT("prepared post-order council binds its exact scene"), Transaction.CouncilStage.NodeId, FString(TEXT("open-council")));
    TestEqual(TEXT("prepared post-order council binds Aunt Yu"), Transaction.CouncilStage.SpeakerId, FString(TEXT("yu-mu")));
    TestEqual(TEXT("prepared post-order council contains speaker and keeper"), Transaction.CouncilStage.Participants.Num(), 2);
    TestTrue(TEXT("prepared selection is valid in the post-order node"),
        Transaction.Session.GetCurrentNode() && Transaction.Session.GetCurrentNode()->Choices.IsValidIndex(Transaction.SelectedChoiceIndex));
    TestTrue(TEXT("complete order transaction revalidates from the unchanged source"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), Transaction, Error));

    FShiOrderTransactionData DriftedResolution = Transaction;
    DriftedResolution.Resolution.Record.AfterChoice.FindOrAdd(TEXT("grain")) += 1;
    TestFalse(TEXT("resolution drift rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedResolution, Error));
    FShiOrderTransactionData DriftedWorld = Transaction;
    DriftedWorld.CommandSignals[0].NumericValue += 1;
    TestFalse(TEXT("world drift rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedWorld, Error));
    FShiOrderTransactionData DriftedCinema = Transaction;
    DriftedCinema.CinematicBeats[0].Label = TEXT("UNBOUND SPECTACLE");
    TestFalse(TEXT("cinematic drift rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedCinema, Error));
    FShiOrderTransactionData DriftedCouncil = Transaction;
    DriftedCouncil.CouncilStage.Participants[0].Name = TEXT("False speaker");
    TestFalse(TEXT("council staging drift rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedCouncil, Error));
    FShiOrderTransactionData DriftedSelection = Transaction;
    DriftedSelection.SelectedChoiceIndex = 99;
    TestFalse(TEXT("post-order briefing drift rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedSelection, Error));
    FShiOrderTransactionData DriftedSession = Transaction;
    FShiResolutionResult ExtraResolution;
    TestTrue(TEXT("hostile transaction can be advanced for state-drift attack"),
        DriftedSession.Session.ResolveChoice(TEXT("issue-grain-tallies"), ExtraResolution, Error));
    TestFalse(TEXT("extra hidden decision rejects the entire prepared transaction"), FShiOrderTransactionModel::Validate(
        Session, Campaign, TEXT("read-the-names"), TEXT("en"), DriftedSession, Error));

    FShiOrderTransactionData AtomicOutput = Transaction;
    const FString StableFirstBeat = AtomicOutput.CinematicBeats[0].Id;
    TestFalse(TEXT("illegal order cannot replace an accepted transaction"), FShiOrderTransactionModel::Build(
        Session, Campaign, TEXT("invented-order"), TEXT("en"), AtomicOutput, Error));
    TestTrue(TEXT("failed order transaction build is atomic"), AtomicOutput.Session.GetHistory().Num() == 1
        && AtomicOutput.CommandSignals.Num() == 9 && AtomicOutput.CinematicBeats[0].Id == StableFirstBeat
        && AtomicOutput.CouncilStage.NodeId == TEXT("open-council"));
    TestTrue(TEXT("hostile validation never mutates the active chronicle"), Session.ExportSaveJson(UnchangedSave, Error));
    TestEqual(TEXT("active chronicle remains byte-identical after every attack"), UnchangedSave, BeforeSave);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCinematicResolutionGrammarTest, "SHI.Cinematic.ResolutionGrammarV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCinematicResolutionGrammarTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiCampaignSession Session;
    Session.Initialize(Campaign, 0x5EED2026u);
    FShiResolutionResult Resolution;
    TestTrue(TEXT("opening order resolves before cinematic planning"), Session.ResolveChoice(TEXT("read-the-names"), Resolution, Error));
    const FShiNodeData* PositionNode = Session.GetCurrentNode();
    const FShiSiteData* PositionSite = PositionNode ? Campaign.FindSite(PositionNode->SiteId) : nullptr;
    TestNotNull(TEXT("cinematic final position site exists"), PositionSite);
    if (!PositionNode || PositionNode->Choices.IsEmpty() || !PositionSite) return false;

    TArray<FShiCommandSignalData> Signals;
    TestTrue(TEXT("cinematic world snapshot builds from post-order state"), FShiCommandSignalModel::Build(Session.GetResources(),
        Session.GetCurrentFieldCondition(), Session.GetCurrentOppositionStage(), Session.GetCurrentMethodRead(),
        Session.GetActiveCommitment(), &PositionNode->Choices[0], TEXT("en"), Signals, Error));
    const int32 StableHistoryCount = Session.GetHistory().Num();
    TMap<FString, int32> StableResources = Session.GetResources();

    TArray<FShiCinematicBeatData> Beats;
    TestTrue(TEXT("resolution layers build one deterministic cinematic plan"), FShiCinematicBeatModel::Build(Resolution,
        Session.GetActiveCommitment(), Session.GetResources(), PositionSite, Session.IsCompleted(), Session.GetFailureReason(),
        Signals, TEXT("en"), Beats, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("opening sequence includes order, established oath, four response layers and position"), Beats.Num(), 7);
    TestTrue(TEXT("cinematic plan passes world-target validation"), FShiCinematicBeatModel::Validate(Beats, Signals, PositionSite, Error));
    TestTrue(TEXT("complete consequence sequence stays below five seconds"), FShiCinematicBeatModel::TotalDuration(Beats) <= 5.f);
    TestEqual(TEXT("first consequence shot cuts from unknowable prior inspection"), Beats[0].CameraMotion, FString(TEXT("cut")));
    TestEqual(TEXT("near pursuit-to-method translation uses one restrained ease"), Beats[4].CameraMotion, FString(TEXT("ease")));
    TestEqual(TEXT("pressure close reading has the narrowest authored lens"), Beats[2].FieldOfViewDegrees, 40.f);
    TestEqual(TEXT("position resolves through the widest authored lens"), Beats.Last().FieldOfViewDegrees, 58.f);
    const TArray<FString> ExpectedIds = {
        TEXT("resolution-order"), TEXT("resolution-commitment"), TEXT("resolution-pressure"), TEXT("resolution-pursuit"),
        TEXT("resolution-method-read"), TEXT("resolution-field"), TEXT("resolution-position")
    };
    for (int32 Index = 0; Index < ExpectedIds.Num() && Beats.IsValidIndex(Index); ++Index)
        TestEqual(*FString::Printf(TEXT("cinematic beat %d keeps canonical order"), Index), Beats[Index].Id, ExpectedIds[Index]);
    TestTrue(TEXT("opening oath establishment is narrated"), Beats[1].Label.Contains(TEXT("OATH ESTABLISHED")));
    TestTrue(TEXT("neutral method read remains an explicit beat"), Beats[4].Label.Contains(TEXT("NEUTRAL")));
    TestEqual(TEXT("final beat returns to the authoritative position site"), Beats.Last().FocusId, PositionSite->Id);
    TestEqual(TEXT("cinematic planning never appends campaign history"), Session.GetHistory().Num(), StableHistoryCount);
    for (const TPair<FString, int32>& Resource : StableResources)
        TestEqual(*FString::Printf(TEXT("cinematic planning preserves %s"), *Resource.Key), Session.GetResources().FindRef(Resource.Key), Resource.Value);

    TArray<FShiCinematicBeatData> InvalidFocus = Beats;
    InvalidFocus[0].FocusKind = TEXT("signal");
    InvalidFocus[0].FocusId = TEXT("resource-imperial-favor");
    TestFalse(TEXT("unbound cinematic world targets are rejected"), FShiCinematicBeatModel::Validate(InvalidFocus, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> Slow = Beats;
    Slow[0].TransitionSeconds = 1.2f;
    TestFalse(TEXT("overlong cinematic shots are rejected"), FShiCinematicBeatModel::Validate(Slow, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> MissingPosition = Beats;
    MissingPosition.Pop();
    TestFalse(TEXT("cinematic plan cannot omit its final position"), FShiCinematicBeatModel::Validate(MissingPosition, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> Reordered = Beats;
    Swap(Reordered[2], Reordered[3]);
    TestFalse(TEXT("cinematic layer reordering is rejected"), FShiCinematicBeatModel::Validate(Reordered, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> Relabeled = Beats;
    Relabeled[2].Layer = TEXT("spectacle");
    TestFalse(TEXT("cinematic layer identity drift is rejected"), FShiCinematicBeatModel::Validate(Relabeled, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> UnsafeMotion = Beats;
    UnsafeMotion[4].CameraMotion = TEXT("cut");
    TestFalse(TEXT("cinematic cut/ease authorship cannot drift from spatial bounds"), FShiCinematicBeatModel::Validate(UnsafeMotion, Signals, PositionSite, Error));
    TArray<FShiCinematicBeatData> UnsafeLens = Beats;
    UnsafeLens[2].FieldOfViewDegrees = 72.f;
    TestFalse(TEXT("cinematic lens grammar rejects disorienting drift"), FShiCinematicBeatModel::Validate(UnsafeLens, Signals, PositionSite, Error));

    FShiCampaignSession CapturedSession;
    CapturedSession.Initialize(Campaign, 0x5EED2026u);
    FShiResolutionResult CapturedResolution;
    const TArray<FString> CaptureRoute = {
        TEXT("read-the-names"), TEXT("issue-grain-tallies"), TEXT("families-first"), TEXT("race-for-chen")
    };
    for (const FString& ChoiceId : CaptureRoute)
        TestTrue(*FString::Printf(TEXT("capture route resolves %s"), *ChoiceId), CapturedSession.ResolveChoice(ChoiceId, CapturedResolution, Error));
    TestTrue(TEXT("capture route reaches its exact terminal state"), CapturedSession.IsCompleted()
        && CapturedSession.GetFailureReason() == TEXT("captured") && CapturedSession.GetResources().FindRef(TEXT("danger")) == 100);
    const FShiNodeData* CapturedNode = CapturedSession.GetCurrentNode();
    const FShiSiteData* CapturedSite = CapturedNode ? Campaign.FindSite(CapturedNode->SiteId) : nullptr;
    TestNotNull(TEXT("captured route retains a position site"), CapturedSite);
    TArray<FShiCommandSignalData> CapturedSignals;
    TestTrue(TEXT("captured world snapshot remains cinematic-readable"), CapturedNode && !CapturedNode->Choices.IsEmpty()
        && FShiCommandSignalModel::Build(CapturedSession.GetResources(), CapturedSession.GetCurrentFieldCondition(), nullptr,
            CapturedSession.GetCurrentMethodRead(), CapturedSession.GetActiveCommitment(), &CapturedNode->Choices[0],
            TEXT("en"), CapturedSignals, Error));
    TArray<FShiCinematicBeatData> CapturedBeats;
    TestTrue(TEXT("captured terminal position has a bounded consequence plan"), CapturedSite
        && FShiCinematicBeatModel::Build(CapturedResolution, CapturedSession.GetActiveCommitment(), CapturedSession.GetResources(),
            CapturedSite, CapturedSession.IsCompleted(), CapturedSession.GetFailureReason(), CapturedSignals,
            TEXT("en"), CapturedBeats, Error));
    TestTrue(TEXT("captured plan ends on an exact lost-position beat"),
        !CapturedBeats.IsEmpty() && CapturedBeats.Last().Label.Contains(TEXT("POSITION LOST · CAPTURED")));

    const int32 StableBeatCount = Beats.Num();
    const FString StableFirstBeatId = Beats[0].Id;
    TestFalse(TEXT("cinematic failure label cannot appear on a nonterminal position"), FShiCinematicBeatModel::Build(Resolution,
        Session.GetActiveCommitment(), Session.GetResources(), PositionSite, false, TEXT("captured"), Signals,
        TEXT("en"), Beats, Error));
    TestTrue(TEXT("invalid failure state cannot replace the accepted cinematic plan"), Beats.Num() == StableBeatCount && Beats[0].Id == StableFirstBeatId);
    TMap<FString, int32> DriftedResources = Session.GetResources();
    DriftedResources.FindOrAdd(TEXT("grain")) += 1;
    TestFalse(TEXT("cinematic final resources must match resolution and world snapshots"), FShiCinematicBeatModel::Build(Resolution,
        Session.GetActiveCommitment(), DriftedResources, PositionSite, Session.IsCompleted(), Session.GetFailureReason(),
        Signals, TEXT("en"), Beats, Error));
    TestTrue(TEXT("resource drift cannot replace the accepted cinematic plan"), Beats.Num() == StableBeatCount && Beats[0].Id == StableFirstBeatId);
    FShiResolutionResult BrokenResolution = Resolution;
    BrokenResolution.Choice = nullptr;
    TestFalse(TEXT("incomplete resolution cannot replace the cinematic plan"), FShiCinematicBeatModel::Build(BrokenResolution,
        Session.GetActiveCommitment(), Session.GetResources(), PositionSite, Session.IsCompleted(), Session.GetFailureReason(),
        Signals, TEXT("en"), Beats, Error));
    TestTrue(TEXT("failed cinematic rebuild is atomic"), Beats.Num() == StableBeatCount && Beats[0].Id == StableFirstBeatId);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiAudioContractTest, "SHI.Audio.ProceduralContractV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiAudioContractTest::RunTest(const FString& Parameters)
{
    FShiAudioModel Audio;
    FString Error;
    TestTrue(TEXT("canonical audio loads"), Audio.LoadCanonical(Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("audio schema"), Audio.SchemaVersion, 1);
    TestEqual(TEXT("seven semantic cues"), Audio.Cues.Num(), 7);
    TestFalse(TEXT("sound defaults off"), Audio.Mix.bDefaultEnabled);
    TestTrue(TEXT("master cap is conservative"), Audio.Mix.MasterCap <= .8f);
    TestEqual(TEXT("rain synthesis rate"), Audio.Ambience.SampleRate, 24000);

    const TArray<float> FirstRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed);
    const TArray<float> RepeatedRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed);
    const TArray<float> OtherRain = FShiAudioModel::CreateRainSamples(24000, Audio.Ambience.Seed + 1u);
    TestTrue(TEXT("rain is deterministic"), FirstRain == RepeatedRain);
    TestFalse(TEXT("rain seed changes output"), FirstRain == OtherRain);
    double RainSum = 0.0;
    float RainPeak = 0.f;
    for (const float Sample : FirstRain) { RainSum += Sample; RainPeak = FMath::Max(RainPeak, FMath::Abs(Sample)); }
    TestTrue(TEXT("raw rain is zero mean"), FMath::Abs(RainSum / FirstRain.Num()) <= 0.000001);
    TestTrue(TEXT("raw rain stays normalized"), RainPeak <= 1.f);

    const float CueAudibilityFloor = FMath::Pow(10.f, -42.f / 20.f);
    for (const TPair<FName, TArray<FShiToneData>>& Cue : Audio.Cues)
    {
        const TArray<float> Samples = FShiAudioModel::CreateCueSamples(Cue.Value, Audio.Envelope, Audio.Ambience.SampleRate);
        float Peak = 0.f;
        for (const float Sample : Samples) Peak = FMath::Max(Peak, FMath::Abs(Sample));
        TestTrue(*FString::Printf(TEXT("cue %s clears audibility floor"), *Cue.Key.ToString()), Peak >= CueAudibilityFloor);
        TestTrue(*FString::Printf(TEXT("cue %s remains brief"), *Cue.Key.ToString()), Samples.Num() <= FMath::CeilToInt(.5f * Audio.Ambience.SampleRate));
    }
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignReplayConformanceTest, "SHI.Campaign.CrossEngineReplayV1", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignReplayConformanceTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TSharedPtr<FJsonObject> Fixture;
    if (!LoadConformance(Fixture, Error)) { AddError(Error); return false; }
    TestEqual(TEXT("fixture version"), Fixture->GetIntegerField(TEXT("fixtureVersion")), 1);
    TestEqual(TEXT("fixture campaign"), Fixture->GetStringField(TEXT("campaignId")), Campaign.Id);
    TestEqual(TEXT("fixture route count"), Fixture->GetIntegerField(TEXT("routeCount")), 46);
    const uint32 Seed = static_cast<uint32>(Fixture->GetNumberField(TEXT("seed")));
    const TArray<TSharedPtr<FJsonValue>>& Routes = Fixture->GetArrayField(TEXT("routes"));
    TestEqual(TEXT("materialized route count"), Routes.Num(), 46);

    for (const TSharedPtr<FJsonValue>& RouteValue : Routes)
    {
        const TSharedPtr<FJsonObject> Route = RouteValue->AsObject();
        if (!Route.IsValid()) { AddError(TEXT("Conformance route is not an object.")); continue; }
        const FString RouteId = Route->GetStringField(TEXT("id"));
        FShiCampaignSession Session;
        Session.Initialize(Campaign, Seed);
        const TArray<TSharedPtr<FJsonValue>>& Turns = Route->GetArrayField(TEXT("turns"));
        for (int32 TurnIndex = 0; TurnIndex < Turns.Num(); ++TurnIndex)
        {
            const TSharedPtr<FJsonObject> Expected = Turns[TurnIndex]->AsObject();
            const FString Context = FString::Printf(TEXT("route %s turn %d"), *RouteId, TurnIndex + 1);
            if (!Expected.IsValid()) { AddError(Context + TEXT(" is not an object.")); break; }
            const int32 StableHistoryCount = Session.GetHistory().Num();
            const FString StableNodeId = Session.GetCurrentNodeId();
            FShiOrderTransactionData Transaction;
            const FString ChoiceId = Expected->GetStringField(TEXT("choiceId"));
            if (!FShiOrderTransactionModel::Build(Session, Campaign, ChoiceId, TEXT("en"), Transaction, Error))
            {
                AddError(FString::Printf(TEXT("%s transaction did not preflight: %s"), *Context, *Error));
                break;
            }
            TestEqual(*FString::Printf(TEXT("%s preflight history is immutable"), *Context), Session.GetHistory().Num(), StableHistoryCount);
            TestEqual(*FString::Printf(TEXT("%s preflight position is immutable"), *Context), Session.GetCurrentNodeId(), StableNodeId);
            TestTrue(*FString::Printf(TEXT("%s full transaction revalidates"), *Context), FShiOrderTransactionModel::Validate(
                Session, Campaign, ChoiceId, TEXT("en"), Transaction, Error));
            FShiResolutionResult Resolution = Transaction.Resolution;
            TArray<FShiCommandSignalData> Signals = MoveTemp(Transaction.CommandSignals);
            TArray<FShiCinematicBeatData> Beats = MoveTemp(Transaction.CinematicBeats);
            Session = MoveTemp(Transaction.Session);
            const FShiDecisionRecord& Record = Resolution.Record;
            TestEqual(*FString::Printf(TEXT("%s node"), *Context), Record.NodeId, Expected->GetStringField(TEXT("nodeId")));
            TestEqual(*FString::Printf(TEXT("%s condition"), *Context), Record.ConditionId, Expected->GetStringField(TEXT("conditionId")));
            TestEqual(*FString::Printf(TEXT("%s pursuit"), *Context), Record.OppositionStageId, OptionalString(Expected, TEXT("oppositionStageId")));
            TestEqual(*FString::Printf(TEXT("%s method"), *Context), Record.MethodId, Expected->GetStringField(TEXT("methodId")));
            TestEqual(*FString::Printf(TEXT("%s method read"), *Context), Record.MethodReadId, OptionalString(Expected, TEXT("methodReadId")));
            TestEqual(*FString::Printf(TEXT("%s method match"), *Context), Record.bMethodReadMatched, Expected->GetBoolField(TEXT("methodReadMatched")));
            TestEqual(*FString::Printf(TEXT("%s commitment"), *Context), Record.CommitmentId, OptionalString(Expected, TEXT("commitmentId")));
            TestEqual(*FString::Printf(TEXT("%s commitment outcome"), *Context), Record.CommitmentOutcomeId, OptionalString(Expected, TEXT("commitmentOutcomeId")));
            CheckDeltas(*this, Context, Deltas(Record.Before, Record.AfterChoice), Expected, TEXT("playerDeltas"));
            CheckDeltas(*this, Context, Record.CommitmentEffects, Expected, TEXT("commitmentDeltas"));
            CheckDeltas(*this, Context, Record.PressureEffects, Expected, TEXT("pressureDeltas"));
            CheckDeltas(*this, Context, Record.OppositionEffects, Expected, TEXT("oppositionDeltas"));
            CheckDeltas(*this, Context, Record.MethodReadEffects, Expected, TEXT("methodReadDeltas"));
            CheckDeltas(*this, Context, Record.ConditionEffects, Expected, TEXT("fieldDeltas"));
            CheckResources(*this, Context, Record.AfterChoice, Expected, TEXT("afterChoice"));
            CheckResources(*this, Context, Record.AfterCommitment, Expected, TEXT("afterCommitment"));
            CheckResources(*this, Context, Record.AfterPressure, Expected, TEXT("afterPressure"));
            CheckResources(*this, Context, Record.AfterOpposition, Expected, TEXT("afterOpposition"));
            CheckResources(*this, Context, Record.AfterMethodRead, Expected, TEXT("afterMethodRead"));
            CheckResources(*this, Context, Record.After, Expected, TEXT("after"));
            TestEqual(*FString::Printf(TEXT("%s next node"), *Context), Session.GetCurrentNodeId(), Expected->GetStringField(TEXT("nextNodeId")));
            TestEqual(*FString::Printf(TEXT("%s completion"), *Context), Session.IsCompleted(), Expected->GetBoolField(TEXT("completed")));
            TestEqual(*FString::Printf(TEXT("%s failure"), *Context), Session.GetFailureReason(), OptionalString(Expected, TEXT("failureReason")));
            TestEqual(*FString::Printf(TEXT("%s active commitment"), *Context), Session.GetActiveCommitmentId(), OptionalString(Expected, TEXT("activeCommitmentId")));

            TestEqual(*FString::Printf(TEXT("%s prepared world signal count"), *Context), Signals.Num(), 9);
            TestEqual(*FString::Printf(TEXT("%s prepared council follows position"), *Context),
                Transaction.CouncilStage.NodeId, Session.GetCurrentNodeId());
            TestEqual(*FString::Printf(TEXT("%s prepared council participant count"), *Context),
                Transaction.CouncilStage.Participants.Num(), 2);
            TestTrue(*FString::Printf(TEXT("%s cinematic ceiling"), *Context), FShiCinematicBeatModel::TotalDuration(Beats) <= 5.f);
        }

        const TSharedPtr<FJsonObject> Final = Route->GetObjectField(TEXT("final"));
        const FString FinalContext = FString::Printf(TEXT("route %s final"), *RouteId);
        TestEqual(*FString::Printf(TEXT("%s node"), *FinalContext), Session.GetCurrentNodeId(), Final->GetStringField(TEXT("currentNodeId")));
        CheckResources(*this, FinalContext, Session.GetResources(), Final, TEXT("resources"));
        TestEqual(*FString::Printf(TEXT("%s completion"), *FinalContext), Session.IsCompleted(), Final->GetBoolField(TEXT("completed")));
        TestEqual(*FString::Printf(TEXT("%s failure"), *FinalContext), Session.GetFailureReason(), OptionalString(Final, TEXT("failureReason")));
        const TArray<TSharedPtr<FJsonValue>>& ExpectedFlags = Final->GetArrayField(TEXT("flags"));
        TestEqual(*FString::Printf(TEXT("%s flags"), *FinalContext), Session.GetFlags().Num(), ExpectedFlags.Num());
        for (int32 Index = 0; Index < FMath::Min(Session.GetFlags().Num(), ExpectedFlags.Num()); ++Index)
            TestEqual(*FString::Printf(TEXT("%s flag %d"), *FinalContext, Index), Session.GetFlags()[Index], ExpectedFlags[Index]->AsString());
    }
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCampaignSaveReplayTest, "SHI.Campaign.SaveReplayIntegrityV6", EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCampaignSaveReplayTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    TSharedPtr<FJsonObject> Fixture;
    if (!LoadConformance(Fixture, Error)) { AddError(Error); return false; }
    const uint32 Seed = static_cast<uint32>(Fixture->GetNumberField(TEXT("seed")));
    const TSharedPtr<FJsonObject> Route = Fixture->GetArrayField(TEXT("routes"))[0]->AsObject();
    FShiCampaignSession Original;
    Original.Initialize(Campaign, Seed);
    for (const TSharedPtr<FJsonValue>& ChoiceValue : Route->GetArrayField(TEXT("choiceIds")))
    {
        FShiResolutionResult Resolution;
        if (!Original.ResolveChoice(ChoiceValue->AsString(), Resolution, Error)) { AddError(Error); return false; }
    }
    FString Save;
    TestTrue(TEXT("version-six save exports"), Original.ExportSaveJson(Save, Error));
    if (!Error.IsEmpty()) AddError(Error);
    FShiCampaignSession Replayed;
    TestTrue(TEXT("version-six save replays"), Replayed.ReplaySaveJson(Campaign, Save, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("replayed node"), Replayed.GetCurrentNodeId(), Original.GetCurrentNodeId());
    TestEqual(TEXT("replayed decisions"), Replayed.GetHistory().Num(), Original.GetHistory().Num());
    TestEqual(TEXT("replayed completion"), Replayed.IsCompleted(), Original.IsCompleted());
    for (const FString& Key : ResourceKeys) TestEqual(*FString::Printf(TEXT("replayed %s"), *Key), Replayed.GetResources().FindRef(Key), Original.GetResources().FindRef(Key));

    FString Tampered = Save;
    const FString OriginalCondition = Original.GetHistory()[0].ConditionId;
    Tampered.ReplaceInline(*OriginalCondition, TEXT("tampered-condition"), ESearchCase::CaseSensitive);
    FShiCampaignSession Protected;
    Protected.Initialize(Campaign, Seed);
    const FString ProtectedNode = Protected.GetCurrentNodeId();
    TestFalse(TEXT("tampered save is rejected"), Protected.ReplaySaveJson(Campaign, Tampered, Error));
    TestEqual(TEXT("rejected replay is atomic"), Protected.GetCurrentNodeId(), ProtectedNode);
    return !HasAnyErrors();
}

#endif
