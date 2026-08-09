#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "ShiCampaignModel.h"
#include "ShiEngagementModel.h"
#include "ShiEngagementSession.h"

namespace
{
    struct FRouteStats
    {
        int32 Routes = 0;
        int32 Viable = 0;
        TSet<FString> Outcomes;
        TSet<FString> Commands;
    };

    bool Export(const FShiEngagementSession& Session, FString& OutJson, FAutomationTestBase& Test, const FString& Label)
    {
        FString Error;
        if (!Session.ExportSaveJson(OutJson, Error))
        {
            Test.AddError(Label + TEXT(": ") + Error);
            return false;
        }
        return true;
    }

    void VisitRoutes(const FShiEngagementModel& Model, const FShiEngagementSession& Session, FRouteStats& Stats,
        FAutomationTestBase& Test)
    {
        if (Session.IsCompleted())
        {
            ++Stats.Routes;
            Test.TestEqual(TEXT("completed route owns exactly one record per pulse"), Session.GetHistory().Num(), Model.Pulses.Num());
            const FShiEngagementOutcomeData* Outcome = Model.FindOutcome(Session.GetOutcomeId());
            Test.TestNotNull(TEXT("completed route selects an authored outcome"), Outcome);
            if (Outcome)
            {
                Stats.Outcomes.Add(Outcome->Id);
                if (Outcome->Status == TEXT("success") || Outcome->Status == TEXT("costly-success")) ++Stats.Viable;
            }
            for (const FShiEngagementCommandRecord& Record : Session.GetHistory()) Stats.Commands.Add(Record.CommandId);
            FString Save;
            if (Export(Session, Save, Test, TEXT("terminal route save")))
            {
                FShiEngagementSession Replayed;
                FString Error;
                Test.TestTrue(TEXT("terminal route replays only from plan, condition and command identifiers"),
                    Replayed.ReplaySaveJson(Model, Save, Error));
                FString ReplayedSave;
                if (Replayed.GetModel() && Export(Replayed, ReplayedSave, Test, TEXT("replayed route save")))
                    Test.TestEqual(TEXT("engagement replay reconstructs the exact canonical state"), ReplayedSave, Save);
                if (!Error.IsEmpty()) Test.AddError(Error);
            }
            return;
        }

        TArray<const FShiEngagementCommandData*> Legal;
        FString Error;
        Session.AvailableCommands(Legal, Error);
        if (!Error.IsEmpty()) Test.AddError(Error);
        Test.TestTrue(TEXT("every nonterminal engagement position has legal counterplay"), Legal.Num() > 0);
        for (const FShiEngagementCommandData* Command : Legal)
        {
            if (!Command) continue;
            FString Before;
            if (!Export(Session, Before, Test, TEXT("pre-command save"))) continue;
            FShiEngagementSession First = Session;
            FShiEngagementSession Second = Session;
            FShiEngagementCommandRecord FirstRecord;
            FShiEngagementCommandRecord SecondRecord;
            FString FirstError;
            FString SecondError;
            Test.TestTrue(TEXT("legal command resolves on the first copy"), First.ResolveCommand(Command->Id, FirstRecord, FirstError));
            Test.TestTrue(TEXT("legal command resolves on the second copy"), Second.ResolveCommand(Command->Id, SecondRecord, SecondError));
            if (!FirstError.IsEmpty()) Test.AddError(FirstError);
            if (!SecondError.IsEmpty()) Test.AddError(SecondError);
            FString FirstSave;
            FString SecondSave;
            FString StillBefore;
            if (Export(First, FirstSave, Test, TEXT("first deterministic result"))
                && Export(Second, SecondSave, Test, TEXT("second deterministic result")))
                Test.TestEqual(TEXT("same command from the same state is deterministic"), FirstSave, SecondSave);
            if (Export(Session, StillBefore, Test, TEXT("immutable source state")))
                Test.TestEqual(TEXT("copy resolution never mutates the source position"), StillBefore, Before);
            VisitRoutes(Model, First, Stats, Test);
        }
    }

    bool CompleteFirstLegalRoute(const FShiEngagementModel& Model, FShiEngagementSession& Session, FString& OutError)
    {
        while (!Session.IsCompleted())
        {
            TArray<const FShiEngagementCommandData*> Legal;
            Session.AvailableCommands(Legal, OutError);
            if (!OutError.IsEmpty() || Legal.IsEmpty() || !Legal[0]) return false;
            FShiEngagementCommandRecord Record;
            if (!Session.ResolveCommand(Legal[0]->Id, Record, OutError)) return false;
        }
        return true;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FShiBrokenCrossingEngagementTest, "SHI.Engagement.BrokenCrossingParityV1",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FShiBrokenCrossingEngagementTest::RunTest(const FString& Parameters)
{
    FShiCampaignModel Campaign;
    FString Error;
    if (!Campaign.LoadCanonical(Error)) { AddError(Error); return false; }
    FShiEngagementModel Model;
    TestTrue(TEXT("canonical broken-crossing engagement loads and closes to campaign truth"), Model.LoadCanonical(Campaign, Error));
    if (!Error.IsEmpty()) AddError(Error);
    TestEqual(TEXT("shared engagement remains explicitly non-authoritative"), Model.DeliveryStatus,
        FString(TEXT("validated-shared-contract-not-campaign-authority")));
    TestEqual(TEXT("engagement carries six local command metrics"), Model.Metrics.Num(), 6);
    TestEqual(TEXT("engagement carries three campaign plans"), Model.Plans.Num(), 3);
    TestEqual(TEXT("engagement carries two seeded field conditions"), Model.Conditions.Num(), 2);
    TestEqual(TEXT("engagement carries three command pulses"), Model.Pulses.Num(), 3);
    TestEqual(TEXT("engagement carries nine distinct commands"), Model.Commands.Num(), 9);
    TestEqual(TEXT("engagement carries four ordered outcomes"), Model.Outcomes.Num(), 4);

    const TMap<FString, TPair<int32, int32>> ExpectedMatrix = {
        {TEXT("families-first/ford-rises"), {12, 3}},
        {TEXT("families-first/rope-ferry-returns"), {12, 11}},
        {TEXT("repair-the-ford/ford-rises"), {18, 4}},
        {TEXT("repair-the-ford/rope-ferry-returns"), {18, 15}},
        {TEXT("cut-the-carts/ford-rises"), {8, 6}},
        {TEXT("cut-the-carts/rope-ferry-returns"), {8, 8}},
    };
    FRouteStats Aggregate;
    TMap<FString, int32> ViablePlansPerCondition;
    for (const FShiEngagementPlanData& Plan : Model.Plans)
    {
        for (const FShiEngagementConditionData& Condition : Model.Conditions)
        {
            FShiEngagementSession Session;
            TestTrue(TEXT("every plan/condition pair initializes"), Session.Initialize(Model, Plan.Id, Condition.Id, Error));
            if (!Error.IsEmpty()) AddError(Error);
            FRouteStats Stats;
            VisitRoutes(Model, Session, Stats, *this);
            const FString Key = Plan.Id + TEXT("/") + Condition.Id;
            const TPair<int32, int32>* Expected = ExpectedMatrix.Find(Key);
            TestNotNull(TEXT("route matrix contains the plan/condition pair"), Expected);
            if (Expected)
            {
                TestEqual(*FString::Printf(TEXT("%s exact legal routes"), *Key), Stats.Routes, Expected->Key);
                TestEqual(*FString::Printf(TEXT("%s exact viable routes"), *Key), Stats.Viable, Expected->Value);
            }
            if (Stats.Viable > 0) ViablePlansPerCondition.FindOrAdd(Condition.Id) += 1;
            Aggregate.Routes += Stats.Routes;
            Aggregate.Viable += Stats.Viable;
            Aggregate.Outcomes.Append(Stats.Outcomes);
            Aggregate.Commands.Append(Stats.Commands);
        }
    }
    TestEqual(TEXT("native exhaustive traversal matches Web route count"), Aggregate.Routes, 76);
    TestEqual(TEXT("native exhaustive traversal matches Web viable count"), Aggregate.Viable, 47);
    TestEqual(TEXT("every authored outcome is reachable"), Aggregate.Outcomes.Num(), 4);
    TestEqual(TEXT("every authored command is reachable"), Aggregate.Commands.Num(), 9);
    for (const FShiEngagementConditionData& Condition : Model.Conditions)
        TestTrue(TEXT("each field condition preserves at least two viable plans"), ViablePlansPerCondition.FindRef(Condition.Id) >= 2);

    FShiEngagementSession Stable;
    TestTrue(TEXT("stable route initializes"), Stable.Initialize(Model, TEXT("families-first"), TEXT("ford-rises"), Error));
    FString BeforeIllegal;
    Export(Stable, BeforeIllegal, *this, TEXT("before illegal command"));
    FShiEngagementCommandRecord IllegalRecord;
    TestFalse(TEXT("command outside the active pulse is rejected"), Stable.ResolveCommand(TEXT("release-the-reserve"), IllegalRecord, Error));
    FString AfterIllegal;
    Export(Stable, AfterIllegal, *this, TEXT("after illegal command"));
    TestEqual(TEXT("illegal command rejection is atomic"), AfterIllegal, BeforeIllegal);

    FShiEngagementSession Completed;
    TestTrue(TEXT("tamper-test route initializes"), Completed.Initialize(Model, TEXT("families-first"), TEXT("ford-rises"), Error));
    TestTrue(TEXT("tamper-test route completes"), CompleteFirstLegalRoute(Model, Completed, Error));
    FString ExactSave;
    Export(Completed, ExactSave, *this, TEXT("exact completed save"));
    FString TamperedSave = ExactSave;
    const FString AuthoredResponse = Completed.GetHistory().IsEmpty() ? FString() : Completed.GetHistory()[0].ResponseId;
    TestTrue(TEXT("tamper fixture owns an authored response"), !AuthoredResponse.IsEmpty());
    TestTrue(TEXT("tamper fixture changes the stored response"), TamperedSave.ReplaceInline(*AuthoredResponse, TEXT("invented-response")) > 0);
    FShiEngagementSession Accepted = Completed;
    TestFalse(TEXT("engagement replay rejects an invented authored response"), Accepted.ReplaySaveJson(Model, TamperedSave, Error));
    FString Preserved;
    Export(Accepted, Preserved, *this, TEXT("preserved accepted state"));
    TestEqual(TEXT("failed replay cannot mutate the accepted engagement"), Preserved, ExactSave);

    FShiEngagementModel AuthorityDrift = Model;
    AuthorityDrift.DeliveryStatus = TEXT("campaign-authority");
    TestFalse(TEXT("native model rejects premature campaign authority"), AuthorityDrift.Validate(Campaign, Error));
    FShiCampaignModel MissingCondition = Campaign;
    const int32 NodeIndex = MissingCondition.Nodes.IndexOfByPredicate(
        [](const FShiNodeData& Node) { return Node.Id == TEXT("broken-crossing"); });
    if (MissingCondition.Nodes.IsValidIndex(NodeIndex)) MissingCondition.Nodes[NodeIndex].Conditions.Pop();
    TestFalse(TEXT("native model rejects campaign condition drift"), Model.Validate(MissingCondition, Error));
    return !HasAnyErrors();
}

#endif
