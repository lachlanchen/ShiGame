#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "ShiCampaignModel.h"

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
    TestEqual(TEXT("pursuit stages"), Campaign.OppositionStages.Num(), 3);
    TestTrue(TEXT("act/time transitions validate"), Campaign.ValidateHorizon(Error));
    if (!Error.IsEmpty()) AddError(Error);
    return !HasAnyErrors();
}

#endif
