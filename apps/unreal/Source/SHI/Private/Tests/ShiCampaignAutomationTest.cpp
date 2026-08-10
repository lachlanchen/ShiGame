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
#include "ShiCouncilCharacterPresentationModel.h"
#include "ShiCouncilFacialPerformanceModel.h"
#include "ShiCouncilPerformancePresentationModel.h"
#include "ShiOrderTransactionModel.h"
#include "ShiRainPresentationModel.h"
#include "ShiWetFieldVegetationPresentationModel.h"
#include "ShiWartableModel.h"
#include "Engine/SkeletalMesh.h"
#include "Animation/AnimSequence.h"
#include "Animation/Skeleton.h"
#include <limits>
#if WITH_EDITOR
#include "Animation/AnimData/IAnimationDataModel.h"
#endif

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

    FTransform SpeakerReviewCamera;
    float SpeakerReviewFieldOfView = 0.f;
    TestTrue(TEXT("dedicated speaker review camera is admitted"),
        FShiCouncilStagingModel::BuildParticipantReviewCamera(
            Stage, TEXT("speaker"), SpeakerReviewCamera, SpeakerReviewFieldOfView, Error));
    TestTrue(TEXT("speaker review exactly preserves the authored dialogue camera"),
        SpeakerReviewCamera.Equals(Stage.CameraTransform, .0001f));
    TestEqual(TEXT("speaker review preserves the restrained 44-degree lens"),
        SpeakerReviewFieldOfView, Stage.FieldOfViewDegrees);
    FTransform KeeperReviewCamera;
    float KeeperReviewFieldOfView = 0.f;
    TestTrue(TEXT("dedicated keeper review camera is admitted"),
        FShiCouncilStagingModel::BuildParticipantReviewCamera(
            Stage, TEXT("keeper"), KeeperReviewCamera, KeeperReviewFieldOfView, Error));
    TestFalse(TEXT("keeper review cannot silently reuse the speaker position"),
        KeeperReviewCamera.Equals(SpeakerReviewCamera, .0001f));
    TestTrue(TEXT("keeper review mirrors the speaker camera across the council table"), Keeper
        && KeeperReviewCamera.GetLocation().Equals(
            Keeper->Transform.GetLocation() + FVector(-330.f, 390.f, 200.f), .0001f));
    const FTransform StableReviewCamera = KeeperReviewCamera;
    const float StableReviewFieldOfView = KeeperReviewFieldOfView;
    TestFalse(TEXT("unknown council review slot is rejected"),
        FShiCouncilStagingModel::BuildParticipantReviewCamera(
            Stage, TEXT("generated-extra"), KeeperReviewCamera, KeeperReviewFieldOfView, Error));
    TestTrue(TEXT("failed council review camera build is atomic"),
        KeeperReviewCamera.Equals(StableReviewCamera, .0001f)
        && FMath::IsNearlyEqual(KeeperReviewFieldOfView, StableReviewFieldOfView));

    TArray<FShiCouncilParticipantLightData> ParticipantLights;
    TestTrue(TEXT("four authored participant key and fill lights are admitted"),
        FShiCouncilStagingModel::BuildParticipantLights(Stage, ParticipantLights, Error));
    TestEqual(TEXT("speaker and keeper each receive one key and one restrained fill"), ParticipantLights.Num(), 4);
    if (ParticipantLights.Num() == 4 && Speaker && Keeper)
    {
        TestTrue(TEXT("speaker key and fill remain uniquely bound to the speaker slot"),
            ParticipantLights[0].LightId == TEXT("speaker-key") && ParticipantLights[0].SlotId == TEXT("speaker")
            && ParticipantLights[1].LightId == TEXT("speaker-fill") && ParticipantLights[1].SlotId == TEXT("speaker"));
        TestTrue(TEXT("keeper key and fill remain uniquely bound to the keeper slot"),
            ParticipantLights[2].LightId == TEXT("keeper-key") && ParticipantLights[2].SlotId == TEXT("keeper")
            && ParticipantLights[3].LightId == TEXT("keeper-fill") && ParticipantLights[3].SlotId == TEXT("keeper"));
        TestTrue(TEXT("speaker key and opposite fill preserve the reviewed face-lighting positions"),
            ParticipantLights[0].Location.Equals(Speaker->Transform.GetLocation() + FVector(150.f, -175.f, 195.f), .0001f)
            && ParticipantLights[1].Location.Equals(Speaker->Transform.GetLocation() + FVector(-125.f, -150.f, 165.f), .0001f));
        TestTrue(TEXT("keeper key and opposite fill mirror the reviewed face-lighting positions"),
            ParticipantLights[2].Location.Equals(Keeper->Transform.GetLocation() + FVector(-150.f, 175.f, 195.f), .0001f)
            && ParticipantLights[3].Location.Equals(Keeper->Transform.GetLocation() + FVector(125.f, 150.f, 165.f), .0001f));
        TestTrue(TEXT("participant key and fill levels remain local, restrained and non-flat"),
            ParticipantLights[0].IntensityLumens == 2600.f && ParticipantLights[1].IntensityLumens == 1800.f
            && ParticipantLights[2].IntensityLumens == 2300.f && ParticipantLights[3].IntensityLumens == 1700.f
            && ParticipantLights[0].AttenuationRadiusCentimeters == 520.f
            && ParticipantLights[1].AttenuationRadiusCentimeters == 430.f
            && ParticipantLights[2].AttenuationRadiusCentimeters == 520.f
            && ParticipantLights[3].AttenuationRadiusCentimeters == 430.f);
    }
    const TArray<FShiCouncilParticipantLightData> StableParticipantLights = ParticipantLights;
    FShiCouncilStageData MissingKeeperLightStage = Stage;
    MissingKeeperLightStage.Participants.RemoveAll([](const FShiCouncilParticipantData& Participant)
    {
        return Participant.SlotId == TEXT("keeper");
    });
    TestFalse(TEXT("missing keeper cannot produce partial participant lighting"),
        FShiCouncilStagingModel::BuildParticipantLights(MissingKeeperLightStage, ParticipantLights, Error));
    TestTrue(TEXT("failed participant lighting build is atomic"),
        ParticipantLights.Num() == StableParticipantLights.Num()
        && ParticipantLights[0].LightId == StableParticipantLights[0].LightId
        && ParticipantLights[3].LightId == StableParticipantLights[3].LightId);

    const FString StableStageNode = Stage.NodeId;
    FShiNodeData MissingSpeaker = *Opening;
    MissingSpeaker.SpeakerId = TEXT("unknown-person");
    TestFalse(TEXT("missing canonical speaker cannot replace an accepted stage"),
        FShiCouncilStagingModel::Build(Campaign, MissingSpeaker, TEXT("en"), Stage, Error));
    TestEqual(TEXT("failed council rebuild is atomic"), Stage.NodeId, StableStageNode);
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCouncilCharacterPresentationTest,
    "SHI.Cinematic.CouncilCharacterPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCouncilCharacterPresentationTest::RunTest(const FString& Parameters)
{
    const TArray<FString>& CharacterIds = FShiCouncilCharacterPresentationModel::CanonicalCharacterIds();
    TestEqual(TEXT("five exact council character identities are admitted"), CharacterIds.Num(), 5);
    const TArray<FString> ExpectedIds = {
        TEXT("keeper"), TEXT("chen-sheng"), TEXT("wu-guang"), TEXT("yu-mu"), TEXT("qin-courier")
    };
    TestTrue(TEXT("council character order remains canonical"), CharacterIds == ExpectedIds);

    FString Error;
    TSet<const USkeleton*> Skeletons;
    for (const FString& CharacterId : CharacterIds)
    {
        FShiCouncilCharacterPresentationData Presentation;
        TestTrue(*FString::Printf(TEXT("%s presentation builds"), *CharacterId),
            FShiCouncilCharacterPresentationModel::Build(CharacterId, Presentation, Error));
        if (!Error.IsEmpty()) AddError(Error);
        TestTrue(*FString::Printf(TEXT("%s presentation validates"), *CharacterId),
            FShiCouncilCharacterPresentationModel::Validate(Presentation, Error));
        TestEqual(*FString::Printf(TEXT("%s uses the exact x100 component scale"), *CharacterId),
            Presentation.ComponentScale, FVector(100.f));
        TestTrue(*FString::Printf(TEXT("%s remains a disclosed non-final neutral blockout"), *CharacterId),
            !Presentation.bFinalArt && !Presentation.bExactCostumeReconstruction
            && !Presentation.bHistoricalPortrait && !Presentation.bAnimated
            && !Presentation.bCollisionEnabled && !Presentation.bSkeletalMeshIsInteractionAuthority
            && Presentation.bPrimitiveInteractionFallback && Presentation.bWideAndMediumFramingOnly);

        USkeletalMesh* Mesh = LoadObject<USkeletalMesh>(nullptr, *Presentation.MeshPath);
        TestNotNull(*FString::Printf(TEXT("%s exact SkeletalMesh loads"), *CharacterId), Mesh);
        if (Mesh)
        {
            TestTrue(*FString::Printf(TEXT("%s engine asset passes bones, materials, bounds and topology"), *CharacterId),
                FShiCouncilCharacterPresentationModel::ValidateMesh(Presentation, *Mesh, Error));
            if (!Error.IsEmpty()) AddError(Error);
            const USkeleton* SharedSkeleton = Mesh->GetSkeleton();
            bool bReferencePoseMatchesSharedSkeleton = SharedSkeleton != nullptr;
            if (SharedSkeleton)
            {
                const FReferenceSkeleton& MeshReference = Mesh->GetRefSkeleton();
                const FReferenceSkeleton& SkeletonReference = SharedSkeleton->GetReferenceSkeleton();
                bReferencePoseMatchesSharedSkeleton =
                    MeshReference.GetRawBoneNum() == SkeletonReference.GetRawBoneNum();
                for (int32 BoneIndex = 0;
                    bReferencePoseMatchesSharedSkeleton && BoneIndex < MeshReference.GetRawBoneNum();
                    ++BoneIndex)
                {
                    bReferencePoseMatchesSharedSkeleton =
                        MeshReference.GetBoneName(BoneIndex) == SkeletonReference.GetBoneName(BoneIndex)
                        && MeshReference.GetRefBonePose()[BoneIndex].Equals(
                            SkeletonReference.GetRefBonePose()[BoneIndex], .0001f);
                }
                bReferencePoseMatchesSharedSkeleton &=
                    !SkeletonReference.GetRefBonePose().IsEmpty()
                    && SkeletonReference.GetRefBonePose()[0].GetScale3D().Equals(FVector::OneVector, .0001f);
            }
            TestTrue(*FString::Printf(
                TEXT("%s mesh and shared Skeleton retain one exact local reference pose with identity Root scale"),
                *CharacterId),
                bReferencePoseMatchesSharedSkeleton);
            Skeletons.Add(Mesh->GetSkeleton());
        }
    }
    TestEqual(TEXT("all five figures use one exact engine Skeleton"), Skeletons.Num(), 1);

    FShiCouncilCharacterPresentationData Stable;
    TestTrue(TEXT("stable keeper contract builds"),
        FShiCouncilCharacterPresentationModel::Build(TEXT("keeper"), Stable, Error));
    const FString StablePath = Stable.MeshPath;
    TestFalse(TEXT("unknown generated identity is rejected"),
        FShiCouncilCharacterPresentationModel::Build(TEXT("invented-general"), Stable, Error));
    TestEqual(TEXT("failed identity build is atomic"), Stable.MeshPath, StablePath);

    FShiCouncilCharacterPresentationData ScaleDrift = Stable;
    ScaleDrift.ComponentScale = FVector(1.f);
    TestFalse(TEXT("metre-valued asset cannot silently shrink to centimetres"),
        FShiCouncilCharacterPresentationModel::Validate(ScaleDrift, Error));
    FShiCouncilCharacterPresentationData CostumeOverclaim = Stable;
    CostumeOverclaim.bExactCostumeReconstruction = true;
    TestFalse(TEXT("generic layers cannot be promoted to exact 209 BCE costume"),
        FShiCouncilCharacterPresentationModel::Validate(CostumeOverclaim, Error));
    FShiCouncilCharacterPresentationData CollisionDrift = Stable;
    CollisionDrift.bCollisionEnabled = true;
    TestFalse(TEXT("skeletal blockout cannot replace primitive interaction authority"),
        FShiCouncilCharacterPresentationModel::Validate(CollisionDrift, Error));
    FShiCouncilCharacterPresentationData AssetDrift = Stable;
    AssetDrift.MeshPath = TEXT("/Game/Generated/WrongIdentity.WrongIdentity");
    TestFalse(TEXT("wrong or generated character asset is rejected"),
        FShiCouncilCharacterPresentationModel::Validate(AssetDrift, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCouncilPerformancePresentationTest,
    "SHI.Cinematic.CouncilPerformancePresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCouncilPerformancePresentationTest::RunTest(const FString& Parameters)
{
    const TArray<FString>& RoleIds = FShiCouncilPerformancePresentationModel::CanonicalRoleIds();
    const TArray<FString> ExpectedRoleIds = {TEXT("attentive-idle"), TEXT("speaker-measured")};
    TestTrue(TEXT("two exact council body-performance roles remain canonical"), RoleIds == ExpectedRoleIds);

    FString Error;
    TSet<const USkeleton*> Skeletons;
    for (const FString& RoleId : RoleIds)
    {
        FShiCouncilPerformanceData Performance;
        TestTrue(*FString::Printf(TEXT("%s performance builds"), *RoleId),
            FShiCouncilPerformancePresentationModel::Build(RoleId, Performance, Error));
        if (!Error.IsEmpty()) AddError(Error);
        TestTrue(*FString::Printf(TEXT("%s performance contract validates"), *RoleId),
            FShiCouncilPerformancePresentationModel::Validate(Performance, Error));
        TestEqual(*FString::Printf(TEXT("%s keeps 121 target samples"), *RoleId),
            Performance.ExpectedSamples, 121);
        TestTrue(*FString::Printf(TEXT("%s remains a disclosed body-only non-authoritative blockout"), *RoleId),
            Performance.bLooping && Performance.bBodyOnly && Performance.bSharedSkeleton
            && !Performance.bRootMotion && !Performance.bFacialPerformance
            && !Performance.bInteractionAuthority && !Performance.bGameplayAuthority
            && !Performance.bSaveAuthority && !Performance.bReplicated
            && !Performance.bHistoricallyReconstructedEtiquette && !Performance.bFinalPerformance
            && Performance.bWideAndMediumFramingOnly);

        UAnimSequence* Sequence = LoadObject<UAnimSequence>(nullptr, *Performance.AnimationPath);
        TestNotNull(*FString::Printf(TEXT("%s exact AnimSequence loads"), *RoleId), Sequence);
        if (Sequence)
        {
#if WITH_EDITOR
            TArray<FName> TrackNames;
            IAnimationDataModel* DataModel = Sequence->GetDataModel();
            TestNotNull(*FString::Printf(TEXT("%s exposes editor animation data"), *RoleId), DataModel);
            if (DataModel) DataModel->GetBoneTrackNames(TrackNames);
            TestEqual(*FString::Printf(TEXT("%s retains exactly 52 child-body tracks"), *RoleId),
                TrackNames.Num(), 52);
            TestFalse(*FString::Printf(TEXT("%s cannot override the admitted reference Root"), *RoleId),
                TrackNames.Contains(FName(TEXT("Root"))));
            TestTrue(*FString::Printf(TEXT("%s retains the pelvis/body animation chain"), *RoleId),
                TrackNames.Contains(FName(TEXT("pelvis"))) && TrackNames.Contains(FName(TEXT("hand_r"))));
            bool bRotationOnlyChannels = DataModel != nullptr;
            if (DataModel && Sequence->GetSkeleton())
            {
                const FReferenceSkeleton& ReferenceSkeleton = Sequence->GetSkeleton()->GetReferenceSkeleton();
                const TArray<FTransform>& ReferencePose = ReferenceSkeleton.GetRefBonePose();
                for (const FName TrackName : TrackNames)
                {
                    const int32 BoneIndex = ReferenceSkeleton.FindBoneIndex(TrackName);
                    TArray<FTransform> Transforms;
                    DataModel->GetBoneTrackTransforms(TrackName, Transforms);
                    bRotationOnlyChannels &= ReferencePose.IsValidIndex(BoneIndex)
                        && Transforms.Num() == Performance.ExpectedSamples;
                    if (!bRotationOnlyChannels) break;
                    for (const FTransform& Transform : Transforms)
                    {
                        if (!Transform.GetTranslation().Equals(
                                ReferencePose[BoneIndex].GetTranslation(), .0001f)
                            || !Transform.GetScale3D().Equals(
                                ReferencePose[BoneIndex].GetScale3D(), .0001f))
                        {
                            bRotationOnlyChannels = false;
                            break;
                        }
                    }
                    if (!bRotationOnlyChannels) break;
                }
            }
            TestTrue(*FString::Printf(
                TEXT("%s child positions/scales remain the exact shared reference pose"), *RoleId),
                bRotationOnlyChannels);
#endif
            USkeleton* Skeleton = Sequence->GetSkeleton();
            TestNotNull(*FString::Printf(TEXT("%s retains the admitted shared Skeleton"), *RoleId), Skeleton);
            if (Skeleton)
            {
                TestTrue(*FString::Printf(TEXT("%s engine asset passes identity, timing and authority"), *RoleId),
                    FShiCouncilPerformancePresentationModel::ValidateSequence(
                        Performance, *Sequence, *Skeleton, Error));
                if (!Error.IsEmpty()) AddError(Error);
                Skeletons.Add(Skeleton);
            }
        }
    }
    TestEqual(TEXT("both body performances use one exact engine Skeleton"), Skeletons.Num(), 1);

    FShiCouncilPerformanceData Listener;
    FShiCouncilPerformanceData Speaker;
    TestTrue(TEXT("non-speaker maps to attentive performance"),
        FShiCouncilPerformancePresentationModel::ForParticipant(false, Listener, Error));
    TestTrue(TEXT("speaker maps to measured performance"),
        FShiCouncilPerformancePresentationModel::ForParticipant(true, Speaker, Error));
    TestEqual(TEXT("listener role remains exact"), Listener.RoleId, FString(TEXT("attentive-idle")));
    TestEqual(TEXT("speaker role remains exact"), Speaker.RoleId, FString(TEXT("speaker-measured")));

    const FString StablePath = Listener.AnimationPath;
    TestFalse(TEXT("unknown generated performance role is rejected"),
        FShiCouncilPerformancePresentationModel::Build(TEXT("heroic-flourish"), Listener, Error));
    TestEqual(TEXT("failed performance build is atomic"), Listener.AnimationPath, StablePath);

    FShiCouncilPerformanceData PathDrift = Speaker;
    PathDrift.AnimationPath = TEXT("/Game/Generated/Unreviewed.Unreviewed");
    TestFalse(TEXT("unreviewed generated animation path is rejected"),
        FShiCouncilPerformancePresentationModel::Validate(PathDrift, Error));
    FShiCouncilPerformanceData TimingDrift = Speaker;
    TimingDrift.ExpectedSamples = 120;
    TestFalse(TEXT("sample-count drift is rejected"),
        FShiCouncilPerformancePresentationModel::Validate(TimingDrift, Error));
    FShiCouncilPerformanceData RateDrift = Speaker;
    RateDrift.ExpectedFramesPerSecond = 60.f;
    TestFalse(TEXT("frame-rate drift is rejected"),
        FShiCouncilPerformancePresentationModel::Validate(RateDrift, Error));
    FShiCouncilPerformanceData RootMotionDrift = Speaker;
    RootMotionDrift.bRootMotion = true;
    TestFalse(TEXT("root-motion authority is rejected"),
        FShiCouncilPerformancePresentationModel::Validate(RootMotionDrift, Error));
    FShiCouncilPerformanceData HistoricalOverclaim = Speaker;
    HistoricalOverclaim.bHistoricallyReconstructedEtiquette = true;
    TestFalse(TEXT("generic gesture cannot become reconstructed 209 BCE etiquette"),
        FShiCouncilPerformancePresentationModel::Validate(HistoricalOverclaim, Error));
    FShiCouncilPerformanceData FinalOverclaim = Speaker;
    FinalOverclaim.bFinalPerformance = true;
    TestFalse(TEXT("body blockout cannot become final acting without review"),
        FShiCouncilPerformancePresentationModel::Validate(FinalOverclaim, Error));
    FShiCouncilPerformanceData AuthorityDrift = Speaker;
    AuthorityDrift.bGameplayAuthority = true;
    TestFalse(TEXT("visual performance cannot acquire gameplay authority"),
        FShiCouncilPerformancePresentationModel::Validate(AuthorityDrift, Error));
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiCouncilFacialPerformanceTest,
    "SHI.Cinematic.CouncilFacialPerformanceV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiCouncilFacialPerformanceTest::RunTest(const FString& Parameters)
{
    const TArray<FString> ExpectedCharacterIds = {
        TEXT("keeper"), TEXT("chen-sheng"), TEXT("wu-guang"), TEXT("yu-mu"), TEXT("qin-courier")
    };
    const TArray<FString> ExpectedRoleIds = {TEXT("listener"), TEXT("speaker")};
    const TArray<FString> ExpectedStateIds = {
        TEXT("neutral"), TEXT("blink"), TEXT("object-glance"),
        TEXT("interrupted-return"), TEXT("silent-speech"), TEXT("held-breath")
    };
    const TArray<FName> ExpectedMorphTargets = {
        TEXT("eyeBlinkLeft"), TEXT("eyeBlinkRight"),
        TEXT("eyeLookDownLeft"), TEXT("eyeLookDownRight"),
        TEXT("eyeLookInLeft"), TEXT("eyeLookInRight"),
        TEXT("eyeLookOutLeft"), TEXT("eyeLookOutRight"),
        TEXT("eyeLookUpLeft"), TEXT("eyeLookUpRight"),
        TEXT("browInnerUp"), TEXT("browDownLeft"), TEXT("browDownRight"),
        TEXT("cheekSquintLeft"), TEXT("cheekSquintRight"),
        TEXT("jawOpen"), TEXT("mouthFunnel"),
        TEXT("mouthPressLeft"), TEXT("mouthPressRight"),
        TEXT("mouthUpperUpLeft"), TEXT("mouthUpperUpRight")
    };
    const TArray<FString> ExpectedMeshPaths = {
        TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_Keeper_Facial_01.SKM_SHI_DazeCouncil_Keeper_Facial_01"),
        TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_ChenSheng_Facial_01.SKM_SHI_DazeCouncil_ChenSheng_Facial_01"),
        TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_WuGuang_Facial_01.SKM_SHI_DazeCouncil_WuGuang_Facial_01"),
        TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_YuMu_Facial_01.SKM_SHI_DazeCouncil_YuMu_Facial_01"),
        TEXT("/Game/SHI/Art/Characters/DazeCouncilFacial/SKM_SHI_DazeCouncil_QinCourier_Facial_01.SKM_SHI_DazeCouncil_QinCourier_Facial_01")
    };
    const TArray<int32> ExpectedTriangles = {27840, 27836, 27680, 27828, 27840};
    const TArray<int32> ExpectedMaterialCounts = {7, 6, 6, 6, 7};
    const FString ExpectedSkeletonPath =
        TEXT("/Game/SHI/Art/Characters/DazeCouncil/SK_SHI_DazeCouncil_Skeleton.SK_SHI_DazeCouncil_Skeleton");

    TestTrue(TEXT("five exact facial identities remain canonical and ordered"),
        FShiCouncilFacialPerformanceModel::CanonicalCharacterIds() == ExpectedCharacterIds);
    TestTrue(TEXT("listener and speaker roles remain exact and ordered"),
        FShiCouncilFacialPerformanceModel::CanonicalRoleIds() == ExpectedRoleIds);
    TestTrue(TEXT("six reviewed silent-intent states remain exact and ordered"),
        FShiCouncilFacialPerformanceModel::CanonicalStateIds() == ExpectedStateIds);
    TestTrue(TEXT("the facial rig exposes exactly the admitted 21 morphs in canonical order"),
        FShiCouncilFacialPerformanceModel::CanonicalMorphTargets() == ExpectedMorphTargets);
    TestEqual(TEXT("the morph contract admits no extra controls"),
        FShiCouncilFacialPerformanceModel::CanonicalMorphTargets().Num(), 21);
    TestEqual(TEXT("the facial meshes retain the exact shared bone count"),
        FShiCouncilFacialPerformanceModel::BoneCount(), 53);
    TestEqual(TEXT("metre-valued facial assets retain the x100 presentation scale"),
        FShiCouncilFacialPerformanceModel::PresentationScale(), 100.f);

    FString Error;
    TSet<const USkeleton*> Skeletons;
    FShiCouncilFacialMeshData Stable;
    for (int32 IdentityIndex = 0; IdentityIndex < ExpectedCharacterIds.Num(); ++IdentityIndex)
    {
        const FString& CharacterId = ExpectedCharacterIds[IdentityIndex];
        FShiCouncilFacialMeshData Presentation;
        TestTrue(*FString::Printf(TEXT("%s facial presentation builds"), *CharacterId),
            FShiCouncilFacialPerformanceModel::Build(CharacterId, Presentation, Error));
        if (!Error.IsEmpty()) AddError(Error);
        TestTrue(*FString::Printf(TEXT("%s facial presentation validates"), *CharacterId),
            FShiCouncilFacialPerformanceModel::Validate(Presentation, Error));
        if (!Error.IsEmpty()) AddError(Error);
        TestEqual(*FString::Printf(TEXT("%s uses its exact isolated facial mesh path"), *CharacterId),
            Presentation.MeshPath, ExpectedMeshPaths[IdentityIndex]);
        TestEqual(*FString::Printf(TEXT("%s uses the exact accepted shared Skeleton"), *CharacterId),
            Presentation.SkeletonPath, ExpectedSkeletonPath);
        TestTrue(*FString::Printf(TEXT("%s retains the exact 21-control order with no extras"), *CharacterId),
            Presentation.MorphTargets == ExpectedMorphTargets);
        TestTrue(*FString::Printf(TEXT("%s remains a disclosed generic engineering blockout"), *CharacterId),
            Presentation.bEngineeringBlockout && Presentation.bGenericNonPortraitFace
            && Presentation.bDeterministic && Presentation.bLanguageNeutral
            && Presentation.bSilentIntentCadence && Presentation.bReducedMotionSupported
            && Presentation.bWideAndMediumFramingOnly
            && Presentation.HistoricalDisclosure.Contains(TEXT("GENERIC NON-PORTRAIT FACE"))
            && Presentation.HistoricalDisclosure.Contains(TEXT("NOT FINAL ACTING")));
        TestTrue(*FString::Printf(TEXT("%s cannot claim voice, transcript, randomness or authority"), *CharacterId),
            !Presentation.bAudioDriven && !Presentation.bTranscriptDriven
            && !Presentation.bPhonemeDriven && !Presentation.bRandomized
            && !Presentation.bInteractionAuthority && !Presentation.bGameplayAuthority
            && !Presentation.bSaveAuthority && !Presentation.bReplicated);
        TestTrue(*FString::Printf(TEXT("%s cannot claim close framing or final face/acting/voice"), *CharacterId),
            !Presentation.bCloseFramingApproved && !Presentation.bFinalFace
            && !Presentation.bFinalActing && !Presentation.bFinalVoice);
        TestTrue(*FString::Printf(TEXT("%s stays inside topology, material and physical-height admission"), *CharacterId),
            Presentation.SourceTriangles > 0
            && Presentation.SourceTriangles <= FShiCouncilFacialPerformanceModel::MaximumTriangles()
            && Presentation.BoneCount == FShiCouncilFacialPerformanceModel::BoneCount()
            && Presentation.MaterialSlots.Num() >= 6
            && Presentation.MaterialSlots.Num() <= FShiCouncilFacialPerformanceModel::MaximumMaterialSlots()
            && Presentation.MaterialSlots.Contains(FName(TEXT("M_SHI_Character_EyeBrown")))
            && Presentation.AssetLocalDimensions.Z * Presentation.ComponentScale.Z
                >= FShiCouncilFacialPerformanceModel::MinimumPresentedHeight()
            && Presentation.AssetLocalDimensions.Z * Presentation.ComponentScale.Z
                <= FShiCouncilFacialPerformanceModel::MaximumPresentedHeight());
        TestEqual(*FString::Printf(TEXT("%s preserves its exact reviewed triangle receipt"), *CharacterId),
            Presentation.SourceTriangles, ExpectedTriangles[IdentityIndex]);
        TestEqual(*FString::Printf(TEXT("%s preserves its exact reviewed material count"), *CharacterId),
            Presentation.MaterialSlots.Num(), ExpectedMaterialCounts[IdentityIndex]);

        USkeletalMesh* Mesh = LoadObject<USkeletalMesh>(nullptr, *Presentation.MeshPath);
        TestNotNull(*FString::Printf(TEXT("%s exact facial SkeletalMesh loads"), *CharacterId), Mesh);
        if (Mesh)
        {
            TestTrue(*FString::Printf(
                TEXT("%s live mesh passes exact bones, materials, bounds, topology and morph admission"),
                *CharacterId),
                FShiCouncilFacialPerformanceModel::ValidateMesh(Presentation, *Mesh, Error));
            if (!Error.IsEmpty()) AddError(Error);
            TestNotNull(*FString::Printf(TEXT("%s live mesh retains the shared Skeleton"), *CharacterId),
                Mesh->GetSkeleton());
            if (Mesh->GetSkeleton()) Skeletons.Add(Mesh->GetSkeleton());
        }
        if (IdentityIndex == 0) Stable = Presentation;
    }
    TestEqual(TEXT("all five live facial meshes use one exact Skeleton object"), Skeletons.Num(), 1);
    if (Stable.MaterialSlots.Num() < 2 || Stable.MorphTargets.Num() != ExpectedMorphTargets.Num())
    {
        AddError(TEXT("Canonical keeper facial admission did not build; drift attacks cannot run safely."));
        return false;
    }

    const FString StablePath = Stable.MeshPath;
    const TArray<FName> StableMorphTargets = Stable.MorphTargets;
    TestFalse(TEXT("unknown facial identity is rejected"),
        FShiCouncilFacialPerformanceModel::Build(TEXT("invented-general"), Stable, Error));
    TestTrue(TEXT("failed facial identity build is atomic"),
        Stable.CharacterId == TEXT("keeper") && Stable.MeshPath == StablePath
        && Stable.MorphTargets == StableMorphTargets);

    FShiCouncilFacialMeshData PathDrift = Stable;
    PathDrift.MeshPath = TEXT("/Game/Generated/Unreviewed.Unreviewed");
    TestFalse(TEXT("facial mesh path drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(PathDrift, Error));
    FShiCouncilFacialMeshData SkeletonDrift = Stable;
    SkeletonDrift.SkeletonPath = TEXT("/Game/Generated/WrongSkeleton.WrongSkeleton");
    TestFalse(TEXT("facial shared-Skeleton path drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(SkeletonDrift, Error));
    FShiCouncilFacialMeshData ScaleDrift = Stable;
    ScaleDrift.ComponentScale = FVector::OneVector;
    TestFalse(TEXT("facial metre-to-centimetre scale drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(ScaleDrift, Error));
    FShiCouncilFacialMeshData MaterialOrderDrift = Stable;
    MaterialOrderDrift.MaterialSlots.Swap(0, 1);
    TestFalse(TEXT("facial material order drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(MaterialOrderDrift, Error));
    FShiCouncilFacialMeshData ExtraMaterial = Stable;
    ExtraMaterial.MaterialSlots.Add(FName(TEXT("M_SHI_UnreviewedExtra")));
    TestFalse(TEXT("extra facial material binding is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(ExtraMaterial, Error));
    FShiCouncilFacialMeshData MorphOrderDrift = Stable;
    MorphOrderDrift.MorphTargets.Swap(0, 1);
    TestFalse(TEXT("facial morph order drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(MorphOrderDrift, Error));
    FShiCouncilFacialMeshData ExtraMorph = Stable;
    ExtraMorph.MorphTargets.Add(FName(TEXT("generatedSmile")));
    TestFalse(TEXT("extra facial morph control is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(ExtraMorph, Error));
    FShiCouncilFacialMeshData TriangleDrift = Stable;
    ++TriangleDrift.SourceTriangles;
    TestFalse(TEXT("facial triangle receipt drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(TriangleDrift, Error));
    FShiCouncilFacialMeshData BoneDrift = Stable;
    --BoneDrift.BoneCount;
    TestFalse(TEXT("facial bone-count drift is rejected"),
        FShiCouncilFacialPerformanceModel::Validate(BoneDrift, Error));
    FShiCouncilFacialMeshData AuthorityDrift = Stable;
    AuthorityDrift.bInteractionAuthority = true;
    TestFalse(TEXT("facial presentation cannot acquire interaction authority"),
        FShiCouncilFacialPerformanceModel::Validate(AuthorityDrift, Error));
    AuthorityDrift = Stable;
    AuthorityDrift.bGameplayAuthority = true;
    TestFalse(TEXT("facial presentation cannot acquire gameplay authority"),
        FShiCouncilFacialPerformanceModel::Validate(AuthorityDrift, Error));
    AuthorityDrift = Stable;
    AuthorityDrift.bSaveAuthority = true;
    TestFalse(TEXT("facial presentation cannot acquire save authority"),
        FShiCouncilFacialPerformanceModel::Validate(AuthorityDrift, Error));
    AuthorityDrift = Stable;
    AuthorityDrift.bReplicated = true;
    TestFalse(TEXT("facial presentation cannot acquire replication authority"),
        FShiCouncilFacialPerformanceModel::Validate(AuthorityDrift, Error));
    FShiCouncilFacialMeshData AdmissionFlagDrift = Stable;
    AdmissionFlagDrift.bEngineeringBlockout = false;
    TestFalse(TEXT("facial presentation cannot discard its engineering-blockout disclosure"),
        FShiCouncilFacialPerformanceModel::Validate(AdmissionFlagDrift, Error));
    FShiCouncilFacialMeshData AudioDrift = Stable;
    AudioDrift.bAudioDriven = true;
    TestFalse(TEXT("silent intent cadence cannot become audio driven"),
        FShiCouncilFacialPerformanceModel::Validate(AudioDrift, Error));
    FShiCouncilFacialMeshData TranscriptDrift = Stable;
    TranscriptDrift.bTranscriptDriven = true;
    TestFalse(TEXT("silent intent cadence cannot become transcript driven"),
        FShiCouncilFacialPerformanceModel::Validate(TranscriptDrift, Error));
    FShiCouncilFacialMeshData PhonemeDrift = Stable;
    PhonemeDrift.bPhonemeDriven = true;
    TestFalse(TEXT("silent intent cadence cannot become phoneme driven"),
        FShiCouncilFacialPerformanceModel::Validate(PhonemeDrift, Error));
    FShiCouncilFacialMeshData RandomDrift = Stable;
    RandomDrift.bRandomized = true;
    TestFalse(TEXT("deterministic facial presentation cannot acquire randomness"),
        FShiCouncilFacialPerformanceModel::Validate(RandomDrift, Error));
    FShiCouncilFacialMeshData CloseFramingDrift = Stable;
    CloseFramingDrift.bCloseFramingApproved = true;
    TestFalse(TEXT("engineering face cannot acquire close-framing approval"),
        FShiCouncilFacialPerformanceModel::Validate(CloseFramingDrift, Error));
    FShiCouncilFacialMeshData FinalFaceDrift = Stable;
    FinalFaceDrift.bFinalFace = true;
    TestFalse(TEXT("generic facial blockout cannot become final face art"),
        FShiCouncilFacialPerformanceModel::Validate(FinalFaceDrift, Error));
    FShiCouncilFacialMeshData FinalActingDrift = Stable;
    FinalActingDrift.bFinalActing = true;
    TestFalse(TEXT("silent intent cadence cannot become final acting"),
        FShiCouncilFacialPerformanceModel::Validate(FinalActingDrift, Error));
    FShiCouncilFacialMeshData VoiceDrift = Stable;
    VoiceDrift.bFinalVoice = true;
    TestFalse(TEXT("silent facial blockout cannot claim final voice"),
        FShiCouncilFacialPerformanceModel::Validate(VoiceDrift, Error));
    FShiCouncilFacialMeshData FramingDrift = Stable;
    FramingDrift.bWideAndMediumFramingOnly = false;
    TestFalse(TEXT("engineering face cannot silently remove its framing restriction"),
        FShiCouncilFacialPerformanceModel::Validate(FramingDrift, Error));

    auto FramesEqual = [](const FShiCouncilFacialFrameData& Left,
                          const FShiCouncilFacialFrameData& Right)
    {
        if (Left.RoleId != Right.RoleId || Left.StateId != Right.StateId
            || Left.CycleSeconds != Right.CycleSeconds || Left.TargetAlpha != Right.TargetAlpha
            || Left.bSpeaker != Right.bSpeaker || Left.bReducedMotion != Right.bReducedMotion
            || Left.bMotionSuppressed != Right.bMotionSuppressed
            || Left.bDeterministic != Right.bDeterministic
            || Left.bLanguageNeutral != Right.bLanguageNeutral
            || Left.bSilentIntentCadence != Right.bSilentIntentCadence
            || Left.bAudioDriven != Right.bAudioDriven
            || Left.bTranscriptDriven != Right.bTranscriptDriven
            || Left.bPhonemeDriven != Right.bPhonemeDriven
            || Left.bRandomized != Right.bRandomized
            || Left.bInteractionAuthority != Right.bInteractionAuthority
            || Left.bGameplayAuthority != Right.bGameplayAuthority
            || Left.bSaveAuthority != Right.bSaveAuthority
            || Left.bReplicated != Right.bReplicated
            || Left.MorphWeights.Num() != Right.MorphWeights.Num())
        {
            return false;
        }
        for (int32 Index = 0; Index < Left.MorphWeights.Num(); ++Index)
        {
            if (Left.MorphWeights[Index].MorphTarget != Right.MorphWeights[Index].MorphTarget
                || Left.MorphWeights[Index].Weight != Right.MorphWeights[Index].Weight)
            {
                return false;
            }
        }
        return true;
    };

    FShiCouncilFacialFrameData SpeakerFrame;
    FShiCouncilFacialFrameData RepeatedSpeakerFrame;
    TestTrue(TEXT("speaker silent-speech state evaluates"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, .48f, false, SpeakerFrame, Error));
    TestTrue(TEXT("identical speaker input evaluates repeatedly"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, .48f, false, RepeatedSpeakerFrame, Error));
    TestTrue(TEXT("facial evaluator is exactly deterministic for repeated input"),
        FramesEqual(SpeakerFrame, RepeatedSpeakerFrame));
    TestTrue(TEXT("speaker state has exact silent, language-neutral role flags"),
        SpeakerFrame.RoleId == TEXT("speaker") && SpeakerFrame.bSpeaker
        && SpeakerFrame.StateId == TEXT("silent-speech")
        && SpeakerFrame.bDeterministic && SpeakerFrame.bLanguageNeutral
        && SpeakerFrame.bSilentIntentCadence && !SpeakerFrame.bAudioDriven
        && !SpeakerFrame.bTranscriptDriven && !SpeakerFrame.bPhonemeDriven
        && !SpeakerFrame.bRandomized && !SpeakerFrame.bInteractionAuthority
        && !SpeakerFrame.bGameplayAuthority && !SpeakerFrame.bSaveAuthority
        && !SpeakerFrame.bReplicated);
    float Weight = -1.f;
    TestTrue(TEXT("speaker silent speech reaches its exact jaw-open peak"),
        FShiCouncilFacialPerformanceModel::TryGetWeight(
            SpeakerFrame, FName(TEXT("jawOpen")), Weight)
        && Weight == .28f);
    TestTrue(TEXT("speaker silent speech reaches its exact mouth-funnel peak"),
        FShiCouncilFacialPerformanceModel::TryGetWeight(
            SpeakerFrame, FName(TEXT("mouthFunnel")), Weight)
        && Weight == .10f);

    FShiCouncilFacialFrameData SpeakerGlance;
    FShiCouncilFacialFrameData SpeakerReturn;
    FShiCouncilFacialFrameData SpeakerBlink;
    TestTrue(TEXT("speaker object glance evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, 1.24f, false, SpeakerGlance, Error)
        && SpeakerGlance.StateId == TEXT("object-glance") && SpeakerGlance.TargetAlpha == 1.f);
    TestTrue(TEXT("speaker interrupted return evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, 1.96f, false, SpeakerReturn, Error)
        && SpeakerReturn.StateId == TEXT("interrupted-return") && SpeakerReturn.TargetAlpha == 1.f);
    TestTrue(TEXT("speaker blink evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, 2.68f, false, SpeakerBlink, Error)
        && SpeakerBlink.StateId == TEXT("blink") && SpeakerBlink.TargetAlpha == 1.f);
    TestTrue(TEXT("speaker blink uses the reviewed bilateral peak"),
        FShiCouncilFacialPerformanceModel::TryGetWeight(
            SpeakerBlink, FName(TEXT("eyeBlinkLeft")), Weight)
        && Weight == .82f
        && FShiCouncilFacialPerformanceModel::TryGetWeight(
            SpeakerBlink, FName(TEXT("eyeBlinkRight")), Weight)
        && Weight == .82f);

    FShiCouncilFacialFrameData ListenerGlance;
    FShiCouncilFacialFrameData ListenerBlink;
    FShiCouncilFacialFrameData ListenerBreath;
    TestTrue(TEXT("listener object glance evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(false, .78f, false, ListenerGlance, Error)
        && ListenerGlance.RoleId == TEXT("listener") && !ListenerGlance.bSpeaker
        && ListenerGlance.StateId == TEXT("object-glance") && ListenerGlance.TargetAlpha == 1.f);
    TestTrue(TEXT("listener blink evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(false, 1.64f, false, ListenerBlink, Error)
        && ListenerBlink.StateId == TEXT("blink") && ListenerBlink.TargetAlpha == 1.f);
    TestTrue(TEXT("listener held breath evaluates at its exact peak"),
        FShiCouncilFacialPerformanceModel::Evaluate(false, 2.76f, false, ListenerBreath, Error)
        && ListenerBreath.StateId == TEXT("held-breath") && ListenerBreath.TargetAlpha == 1.f);
    TestTrue(TEXT("listener held breath reaches the exact bilateral mouth-press peak"),
        FShiCouncilFacialPerformanceModel::TryGetWeight(
            ListenerBreath, FName(TEXT("mouthPressLeft")), Weight)
        && Weight == .16f
        && FShiCouncilFacialPerformanceModel::TryGetWeight(
            ListenerBreath, FName(TEXT("mouthPressRight")), Weight)
        && Weight == .16f);

    bool bAllSampledFramesRemainBounded = true;
    for (int32 Sample = 0; Sample <= 400 && bAllSampledFramesRemainBounded; Sample += 5)
    {
        for (int32 SpeakerIndex = 0; SpeakerIndex < 2 && bAllSampledFramesRemainBounded; ++SpeakerIndex)
        {
            FShiCouncilFacialFrameData SampledFrame;
            bAllSampledFramesRemainBounded = FShiCouncilFacialPerformanceModel::Evaluate(
                SpeakerIndex == 1, static_cast<float>(Sample) / 100.f, false, SampledFrame, Error)
                && SampledFrame.MorphWeights.Num() == ExpectedMorphTargets.Num();
            for (int32 MorphIndex = 0;
                bAllSampledFramesRemainBounded && MorphIndex < SampledFrame.MorphWeights.Num();
                ++MorphIndex)
            {
                const FShiCouncilFacialMorphWeight& SampledWeight = SampledFrame.MorphWeights[MorphIndex];
                bAllSampledFramesRemainBounded =
                    SampledWeight.MorphTarget == ExpectedMorphTargets[MorphIndex]
                    && FMath::IsFinite(SampledWeight.Weight) && SampledWeight.Weight >= 0.f
                    && SampledWeight.Weight <= FShiCouncilFacialPerformanceModel::MaximumWeightForMorphTarget(
                        SampledWeight.MorphTarget) + KINDA_SMALL_NUMBER;
            }
        }
    }
    TestTrue(TEXT("all listener and speaker timeline samples preserve exact morph order and bounds"),
        bAllSampledFramesRemainBounded);

    FShiCouncilFacialFrameData ReducedCut;
    FShiCouncilFacialFrameData ReducedNeutral;
    TestTrue(TEXT("reduced-motion speaker state uses one exact held cut without smoothing"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, .19f, true, ReducedCut, Error)
        && ReducedCut.StateId == TEXT("silent-speech") && ReducedCut.TargetAlpha == 1.f
        && ReducedCut.bReducedMotion && ReducedCut.bMotionSuppressed);
    TestTrue(TEXT("reduced-motion held cut preserves the reviewed complete named-state weights"),
        FShiCouncilFacialPerformanceModel::TryGetWeight(ReducedCut, FName(TEXT("jawOpen")), Weight)
        && Weight == .28f
        && FShiCouncilFacialPerformanceModel::TryGetWeight(
            ReducedCut, FName(TEXT("mouthFunnel")), Weight)
        && Weight == .10f);
    TestTrue(TEXT("reduced-motion pass settles to an exact neutral frame"),
        FShiCouncilFacialPerformanceModel::Evaluate(false, 10.f, true, ReducedNeutral, Error)
        && ReducedNeutral.StateId == TEXT("neutral") && ReducedNeutral.TargetAlpha == 0.f
        && ReducedNeutral.bReducedMotion && ReducedNeutral.bMotionSuppressed
        && ReducedNeutral.CycleSeconds < FShiCouncilFacialPerformanceModel::CycleDurationSeconds()
        && ReducedNeutral.CycleSeconds
            > FShiCouncilFacialPerformanceModel::CycleDurationSeconds() - .001f);
    bool bReducedNeutralIsExact = ReducedNeutral.MorphWeights.Num() == ExpectedMorphTargets.Num();
    for (int32 Index = 0; bReducedNeutralIsExact && Index < ReducedNeutral.MorphWeights.Num(); ++Index)
    {
        bReducedNeutralIsExact = ReducedNeutral.MorphWeights[Index].MorphTarget == ExpectedMorphTargets[Index]
            && ReducedNeutral.MorphWeights[Index].Weight == 0.f;
    }
    TestTrue(TEXT("reduced-motion neutral contains all 21 canonical controls at exact zero"),
        bReducedNeutralIsExact);
    FShiCouncilFacialFrameData WouldHaveLooped;
    TestTrue(TEXT("reduced-motion cadence is a single clamped pass and cannot loop after four seconds"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, 4.48f, true, WouldHaveLooped, Error)
        && WouldHaveLooped.StateId == TEXT("neutral") && WouldHaveLooped.TargetAlpha == 0.f
        && WouldHaveLooped.CycleSeconds
            > FShiCouncilFacialPerformanceModel::CycleDurationSeconds() - .001f);

    const FShiCouncilFacialFrameData StableFrame = SpeakerFrame;
    if (StableFrame.MorphWeights.Num() != ExpectedMorphTargets.Num())
    {
        AddError(TEXT("Canonical speaker facial frame did not evaluate; frame drift attacks cannot run safely."));
        return false;
    }
    TestFalse(TEXT("negative facial evaluation time is rejected"),
        FShiCouncilFacialPerformanceModel::Evaluate(true, -KINDA_SMALL_NUMBER, false, SpeakerFrame, Error));
    TestTrue(TEXT("failed negative-time evaluation is atomic"), FramesEqual(SpeakerFrame, StableFrame));
    TestFalse(TEXT("NaN facial evaluation time is rejected"),
        FShiCouncilFacialPerformanceModel::Evaluate(true,
            std::numeric_limits<float>::quiet_NaN(), false, SpeakerFrame, Error));
    TestTrue(TEXT("failed NaN-time evaluation is atomic"), FramesEqual(SpeakerFrame, StableFrame));
    TestFalse(TEXT("infinite facial evaluation time is rejected"),
        FShiCouncilFacialPerformanceModel::Evaluate(true,
            std::numeric_limits<float>::infinity(), false, SpeakerFrame, Error));
    TestTrue(TEXT("failed infinite-time evaluation is atomic"), FramesEqual(SpeakerFrame, StableFrame));

    FShiCouncilFacialFrameData FrameOrderDrift = StableFrame;
    FrameOrderDrift.MorphWeights.Swap(0, 1);
    TestFalse(TEXT("facial frame morph reordering is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(FrameOrderDrift, Error));
    FShiCouncilFacialFrameData ExtraFrameMorph = StableFrame;
    FShiCouncilFacialMorphWeight GeneratedExtraMorph;
    GeneratedExtraMorph.MorphTarget = FName(TEXT("generatedSmile"));
    ExtraFrameMorph.MorphWeights.Add(GeneratedExtraMorph);
    TestFalse(TEXT("facial frame extra morph control is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(ExtraFrameMorph, Error));
    FShiCouncilFacialFrameData OverweightFrame = StableFrame;
    OverweightFrame.MorphWeights[0].Weight =
        FShiCouncilFacialPerformanceModel::MaximumWeightForMorphTarget(
            OverweightFrame.MorphWeights[0].MorphTarget) + .01f;
    TestFalse(TEXT("facial frame overweight control is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(OverweightFrame, Error));
    FShiCouncilFacialFrameData ValueDriftFrame = StableFrame;
    ValueDriftFrame.MorphWeights[0].Weight = .01f;
    TestFalse(TEXT("facial frame rejects an in-range control outside its complete named state"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(ValueDriftFrame, Error));
    FShiCouncilFacialFrameData RandomFrame = StableFrame;
    RandomFrame.bRandomized = true;
    TestFalse(TEXT("facial frame randomness is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(RandomFrame, Error));
    FShiCouncilFacialFrameData AudioFrame = StableFrame;
    AudioFrame.bAudioDriven = true;
    TestFalse(TEXT("facial frame audio authority is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(AudioFrame, Error));
    FShiCouncilFacialFrameData TranscriptFrame = StableFrame;
    TranscriptFrame.bTranscriptDriven = true;
    TestFalse(TEXT("facial frame transcript input is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(TranscriptFrame, Error));
    FShiCouncilFacialFrameData PhonemeFrame = StableFrame;
    PhonemeFrame.bPhonemeDriven = true;
    TestFalse(TEXT("facial frame phoneme input is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(PhonemeFrame, Error));
    FShiCouncilFacialFrameData SaveFrame = StableFrame;
    SaveFrame.bSaveAuthority = true;
    TestFalse(TEXT("facial frame save authority is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(SaveFrame, Error));
    FShiCouncilFacialFrameData GameplayFrame = StableFrame;
    GameplayFrame.bGameplayAuthority = true;
    TestFalse(TEXT("facial frame gameplay authority is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(GameplayFrame, Error));
    FShiCouncilFacialFrameData InteractionFrame = StableFrame;
    InteractionFrame.bInteractionAuthority = true;
    TestFalse(TEXT("facial frame interaction authority is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(InteractionFrame, Error));
    FShiCouncilFacialFrameData ReplicatedFrame = StableFrame;
    ReplicatedFrame.bReplicated = true;
    TestFalse(TEXT("facial frame replication authority is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(ReplicatedFrame, Error));
    FShiCouncilFacialFrameData RoleFrame = StableFrame;
    RoleFrame.RoleId = TEXT("narrator");
    TestFalse(TEXT("facial frame role drift is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(RoleFrame, Error));
    FShiCouncilFacialFrameData StateFrame = StableFrame;
    StateFrame.StateId = TEXT("generated-smile");
    TestFalse(TEXT("facial frame state drift is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(StateFrame, Error));
    FShiCouncilFacialFrameData CycleFrame = StableFrame;
    CycleFrame.CycleSeconds = FShiCouncilFacialPerformanceModel::CycleDurationSeconds();
    TestFalse(TEXT("facial frame cycle overflow is rejected"),
        FShiCouncilFacialPerformanceModel::ValidateFrame(CycleFrame, Error));
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

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiWetFieldVegetationPresentationTest,
    "SHI.Cinematic.WetFieldVegetationPresentationV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiWetFieldVegetationPresentationTest::RunTest(const FString& Parameters)
{
    const FShiWetFieldVegetationPresentationData Presentation =
        FShiWetFieldVegetationPresentationModel::Build();
    FString Error;
    TestTrue(TEXT("reviewed generic wet-field vegetation passes its disclosed presentation contract"),
        FShiWetFieldVegetationPresentationModel::Validate(Presentation, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestTrue(TEXT("vegetation retains exact deterministic HISM budgets"),
        Presentation.StalkInstanceCount == 42 && Presentation.TuftInstanceCount == 64
        && Presentation.Seed == FShiWetFieldVegetationPresentationModel::Seed());
    TestTrue(TEXT("material wind is bounded, horizontal and GPU-only"),
        Presentation.bMaterialWindOnly && !Presentation.bCpuAnimated
        && Presentation.WindDirection.Equals(FVector(1.f, .35f, 0.f), .001f)
        && FMath::IsNearlyEqual(Presentation.WindSpeed, .38f, .001f)
        && FMath::IsNearlyEqual(Presentation.WindAmplitude, 2.4f, .001f));
    TestFalse(TEXT("generic forms are not presented as an exact botanical reconstruction"),
        Presentation.bExactBotanicalReconstruction);
    TestFalse(TEXT("vegetation remains explicitly below final-art status"), Presentation.bFinalArt);
    TestFalse(TEXT("vegetation is not interactive"), Presentation.bInteractive);
    TestFalse(TEXT("vegetation collision is disabled"), Presentation.bCollisionEnabled);
    TestFalse(TEXT("vegetation does not affect navigation"), Presentation.bAffectsNavigation);
    TestFalse(TEXT("vegetation does not affect campaign or engagement authority"), Presentation.bAffectsGameplay);
    TestFalse(TEXT("vegetation state is never serialized"), Presentation.bSerialized);
    TestFalse(TEXT("vegetation does not replicate"), Presentation.bReplicated);
    TestTrue(TEXT("vegetation persists through the Broken Crossing exercise"), Presentation.bVisibleDuringEngagement);

    TestFalse(TEXT("the shelter and command work area remain clear"),
        FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D::ZeroVector));
    TestFalse(TEXT("the compacted approach corridor remains clear"),
        FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(500.f, 140.f)));
    TestFalse(TEXT("the wet-field edge margin remains clear"),
        FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(1126.f, 0.f)));
    TestTrue(TEXT("an admitted peripheral field root remains available"),
        FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(800.f, -650.f)));

    const TArray<FTransform> Stalks =
        FShiWetFieldVegetationPresentationModel::BuildStalkTransforms(Presentation);
    const TArray<FTransform> RepeatedStalks =
        FShiWetFieldVegetationPresentationModel::BuildStalkTransforms(Presentation);
    const TArray<FTransform> Tufts =
        FShiWetFieldVegetationPresentationModel::BuildTuftTransforms(Presentation);
    TestTrue(TEXT("deterministic placement fills exactly 42 stalks and 64 low tufts"),
        Stalks.Num() == 42 && Tufts.Num() == 64 && RepeatedStalks.Num() == Stalks.Num());
    bool bRepeatedExactly = RepeatedStalks.Num() == Stalks.Num();
    bool bAllRootsAndScalesAdmitted = true;
    for (int32 Index = 0; Index < Stalks.Num(); ++Index)
    {
        bRepeatedExactly &= Stalks[Index].Equals(RepeatedStalks[Index], .0001f);
        const FVector Location = Stalks[Index].GetLocation();
        const float Scale = Stalks[Index].GetScale3D().X;
        bAllRootsAndScalesAdmitted &=
            FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(Location.X, Location.Y))
            && FMath::IsNearlyEqual(Location.Z, -7.6f, .001f)
            && Scale >= .72f && Scale <= 1.06f;
    }
    for (const FTransform& Transform : Tufts)
    {
        const FVector Location = Transform.GetLocation();
        const float Scale = Transform.GetScale3D().X;
        bAllRootsAndScalesAdmitted &=
            FShiWetFieldVegetationPresentationModel::IsRootAdmitted(FVector2D(Location.X, Location.Y))
            && FMath::IsNearlyEqual(Location.Z, -7.6f, .001f)
            && Scale >= .70f && Scale <= 1.12f;
    }
    TestTrue(TEXT("placement repeats bit-for-bit for the reviewed seed"), bRepeatedExactly);
    TestTrue(TEXT("every generated root preserves edge, shelter, route and scale bounds"),
        bAllRootsAndScalesAdmitted);

    const FTransform ReviewCamera = FShiWetFieldVegetationPresentationModel::ReviewCameraTransform();
    const FVector ReviewTarget(0.f, 0.f, 55.f);
    TestTrue(TEXT("vegetation review camera holds both field edges and the protected center"),
        FVector::DotProduct(ReviewCamera.GetRotation().GetForwardVector(),
            (ReviewTarget - ReviewCamera.GetLocation()).GetSafeNormal()) > .9999f
        && FVector::Dist(ReviewCamera.GetLocation(), ReviewTarget) > 2300.f
        && FMath::IsNearlyEqual(FShiWetFieldVegetationPresentationModel::ReviewFieldOfViewDegrees(), 52.f));

    FShiWetFieldVegetationPresentationData Scaled = Presentation;
    Scaled.Transform.SetScale3D(FVector(1.01f));
    TestFalse(TEXT("unreviewed vegetation-field scaling is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(Scaled, Error));
    FShiWetFieldVegetationPresentationData Oversubscribed = Presentation;
    Oversubscribed.TuftInstanceCount += 1;
    TestFalse(TEXT("an oversized vegetation budget is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(Oversubscribed, Error));
    FShiWetFieldVegetationPresentationData ClearanceDrift = Presentation;
    ClearanceDrift.CentralExclusionHalfExtent.X = 419.f;
    TestFalse(TEXT("vegetation entering the shelter envelope is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(ClearanceDrift, Error));
    FShiWetFieldVegetationPresentationData CpuSway = Presentation;
    CpuSway.bCpuAnimated = true;
    TestFalse(TEXT("CPU per-instance vegetation sway is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(CpuSway, Error));
    FShiWetFieldVegetationPresentationData WindDrift = Presentation;
    WindDrift.WindAmplitude = 12.f;
    TestFalse(TEXT("storm-thrashing wind amplitude is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(WindDrift, Error));
    FShiWetFieldVegetationPresentationData Colliding = Presentation;
    Colliding.bCollisionEnabled = true;
    TestFalse(TEXT("vegetation collision authority is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(Colliding, Error));
    FShiWetFieldVegetationPresentationData Authoritative = Presentation;
    Authoritative.bAffectsGameplay = true;
    TestFalse(TEXT("hidden vegetation gameplay authority is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(Authoritative, Error));
    FShiWetFieldVegetationPresentationData Replicated = Presentation;
    Replicated.bReplicated = true;
    TestFalse(TEXT("replicated cosmetic vegetation is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(Replicated, Error));
    FShiWetFieldVegetationPresentationData FalseHistory = Presentation;
    FalseHistory.bExactBotanicalReconstruction = true;
    TestFalse(TEXT("an unsupported exact botanical claim is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(FalseHistory, Error));
    FShiWetFieldVegetationPresentationData PrematureFinal = Presentation;
    PrematureFinal.bFinalArt = true;
    TestFalse(TEXT("premature final-vegetation status is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(PrematureFinal, Error));
    FShiWetFieldVegetationPresentationData HiddenExercise = Presentation;
    HiddenExercise.bVisibleDuringEngagement = false;
    TestFalse(TEXT("vegetation disappearing during the engagement is rejected"),
        FShiWetFieldVegetationPresentationModel::Validate(HiddenExercise, Error));
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
