#include "ShiJinyangModel.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
const TArray<FString> Keys = {
    TEXT("cityDeadline"), TEXT("people"), TEXT("treasury"), TEXT("force"), TEXT("braceExtension"),
    TEXT("withdrawalCapacity"), TEXT("escortForce"), TEXT("hanThreat"), TEXT("weiThreat"),
    TEXT("hanRisk"), TEXT("weiRisk"), TEXT("unilateralRisk"), TEXT("hanPreparation"), TEXT("weiPreparation")
};
const TArray<FString> Ids = {
    TEXT("brace"), TEXT("diversion"), TEXT("escape"), TEXT("quiet-han"), TEXT("quiet-wei"),
    TEXT("escort-han"), TEXT("escort-wei"), TEXT("relay"), TEXT("early-date"),
    TEXT("aligned-date"), TEXT("wait"), TEXT("execute"), TEXT("withdraw")
};
const TArray<FString> Allies = {TEXT("han"), TEXT("wei")};
const TArray<FString> OperationKeys = {TEXT("watchThreshold"),TEXT("screenLoss"),TEXT("disruptedLoss"),TEXT("reserveLoss"),
    TEXT("quickAssaultLoss"),TEXT("heldAssaultLoss"),TEXT("minimumReserve")};
const TArray<FString> OperationIds = {TEXT("screen-embankment"),TEXT("rush-embankment"),TEXT("open-water"),
    TEXT("commit-reserve"),TEXT("hold-front"),TEXT("press-attack")};
bool Integer(const TSharedPtr<FJsonObject>& Object, const TCHAR* Key, int32& Out)
{
    double N = 0;
    if (!Object || !Object->TryGetNumberField(Key, N) || !FMath::IsFinite(N)
        || N < 0 || N > 1000 || N != FMath::FloorToDouble(N)) return false;
    Out = static_cast<int32>(N); return true;
}
TArray<TSharedPtr<FJsonValue>> Strings(const TArray<FString>& Values)
{
    TArray<TSharedPtr<FJsonValue>> Out;
    for (const auto& Value : Values) Out.Add(MakeShared<FJsonValueString>(Value));
    return Out;
}
void NullableNumber(const TSharedPtr<FJsonObject>& Object, const TCHAR* Key, int32 Value)
{
    if (Value < 0) Object->SetField(Key, MakeShared<FJsonValueNull>());
    else Object->SetNumberField(Key, Value);
}
FString Serialize(const TSharedPtr<FJsonObject>& Object)
{
    FString Out; FJsonSerializer::Serialize(Object.ToSharedRef(), TJsonWriterFactory<>::Create(&Out)); return Out;
}
}
bool FShiJinyangModel::Initialize(const FString& Json, FString& Error)
{
    FShiJinyangModel Candidate;
    TSharedPtr<FJsonObject> Root;
    int32 SchemaVersion = 0;
    FString Id;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Json), Root) || !Root
        || !Integer(Root, TEXT("schemaVersion"), SchemaVersion) || (SchemaVersion != 1 && SchemaVersion != 2)
        || !Root->TryGetStringField(TEXT("id"), Id) || Id != FString::Printf(TEXT("jinyang-encounter-v%d"),SchemaVersion))
    { Error = TEXT("Unsupported Jinyang definition"); return false; }
    Candidate.Version = SchemaVersion; Candidate.CommandIds = Ids;
    if (SchemaVersion == 2) Candidate.CommandIds.Append(OperationIds);
    const TSharedPtr<FJsonObject>* P = nullptr;
    const TArray<TSharedPtr<FJsonValue>>* RawCommands = nullptr;
    if (!Root->TryGetObjectField(TEXT("parameters"), P) || !P || !*P
        || !Root->TryGetArrayField(TEXT("commands"), RawCommands) || !RawCommands
        || RawCommands->Num() != Candidate.CommandIds.Num())
    { Error = TEXT("Missing Jinyang parameters or commands"); return false; }
    Candidate.Fingerprint = Id + FString::Printf(TEXT("|%d"),SchemaVersion);
    for (const auto& Key : Keys)
    {
        int32 Value = 0;
        if (!Integer(*P, *Key, Value)) { Error = TEXT("Invalid Jinyang parameter: ") + Key; return false; }
        Candidate.Parameters.Add(Key, Value);
        Candidate.Fingerprint += FString::Printf(TEXT("|%s=%d"), *Key, Value);
    }
    if (Candidate.Parameters[TEXT("people")] < 1 || Candidate.Parameters[TEXT("force")] < 1)
    { Error = TEXT("Jinyang requires people and force"); return false; }
    if (SchemaVersion == 2)
    {
        const TSharedPtr<FJsonObject>* Operation = nullptr;
        if (!Root->TryGetObjectField(TEXT("operation"),Operation)) { Error=TEXT("Missing operation rules"); return false; }
        for (const auto& Key : OperationKeys)
        {
            int32 Value = 0;
            if (!Integer(*Operation,*Key,Value)) { Error=TEXT("Invalid operation parameter"); return false; }
            Candidate.Parameters.Add(Key,Value);
            Candidate.Fingerprint += FString::Printf(TEXT("|%s=%d"),*Key,Value);
        }
    }
    const TArray<TSharedPtr<FJsonValue>>* RawSites = nullptr;
    const TArray<FString> RequiredSites = {TEXT("wall"),TEXT("embankment"),TEXT("route"),TEXT("han"),TEXT("wei"),TEXT("zhi"),TEXT("zhao")};
    TSet<FString> SiteIds;
    if (!Root->TryGetArrayField(TEXT("sites"), RawSites) || !RawSites || RawSites->Num() != RequiredSites.Num())
    { Error = TEXT("Missing Jinyang geography"); return false; }
    for (const auto& RawSite : *RawSites)
    {
        const TSharedPtr<FJsonObject>* Site = nullptr;
        const TSharedPtr<FJsonObject>* Label = nullptr;
        const TArray<TSharedPtr<FJsonValue>>* Position = nullptr;
        FString SiteId, English, Chinese;
        if (!RawSite || !RawSite->TryGetObject(Site) || !Site || !*Site
            || !(*Site)->TryGetStringField(TEXT("id"), SiteId) || !RequiredSites.Contains(SiteId) || SiteIds.Contains(SiteId)
            || !(*Site)->TryGetArrayField(TEXT("position"), Position) || !Position || Position->Num() != 3
            || !(*Site)->TryGetObjectField(TEXT("label"), Label) || !Label || !*Label
            || !(*Label)->TryGetStringField(TEXT("en"), English) || English.IsEmpty() || English.Len() > 160
            || !(*Label)->TryGetStringField(TEXT("zh-Hans"), Chinese) || Chinese.IsEmpty() || Chinese.Len() > 160)
        { Error = TEXT("Invalid Jinyang site"); return false; }
        for (const auto& Coordinate : *Position)
        {
            double Number = 0;
            if (!Coordinate || !Coordinate->TryGetNumber(Number) || !FMath::IsFinite(Number) || FMath::Abs(Number) > 5000)
            { Error = TEXT("Invalid Jinyang coordinate"); return false; }
        }
        SiteIds.Add(SiteId);
    }
    for (const auto& Raw : *RawCommands)
    {
        const TSharedPtr<FJsonObject>* Object = nullptr;
        const TSharedPtr<FJsonObject>* Label = nullptr;
        FShiJinyangCommand C;
        if (!Raw || !Raw->TryGetObject(Object) || !Object || !*Object
            || !(*Object)->TryGetStringField(TEXT("id"), C.Id) || !Candidate.CommandIds.Contains(C.Id)
            || Candidate.Commands.Contains(C.Id) || !(*Object)->TryGetStringField(TEXT("site"), C.Site) || !SiteIds.Contains(C.Site)
            || !Integer(*Object, TEXT("time"), C.Time) || !Integer(*Object, TEXT("cost"), C.Cost)
            || !Integer(*Object, TEXT("watch"), C.Watch)
            || !(*Object)->TryGetObjectField(TEXT("label"), Label) || !Label || !*Label
            || !(*Label)->TryGetStringField(TEXT("en"), C.English)
            || !(*Label)->TryGetStringField(TEXT("zh-Hans"), C.Chinese)
            || C.English.IsEmpty() || C.English.Len() > 160 || C.Chinese.IsEmpty() || C.Chinese.Len() > 160)
        { Error = TEXT("Invalid Jinyang command"); return false; }
        if (OperationIds.Contains(C.Id) && (C.Time || C.Watch))
        { Error=TEXT("Operation rounds cannot alter the agreed window"); return false; }
        Candidate.Commands.Add(C.Id, C);
    }
    for (const auto& CommandId : Candidate.CommandIds)
    {
        const auto& C = Candidate.Commands[CommandId];
        Candidate.Fingerprint += FString::Printf(TEXT("|%s=%d,%d,%d"), *CommandId, C.Time, C.Cost, C.Watch);
    }
    Candidate.Definition = Root; Candidate.Reset(); *this = MoveTemp(Candidate); Error.Reset(); return true;
}
void FShiJinyangModel::Reset()
{
    State = FShiJinyangState();
    State.Treasury = Parameters[TEXT("treasury")]; State.Force = Parameters[TEXT("force")];
    State.Deadline = Parameters[TEXT("cityDeadline")];
    for (const auto& Id : Allies)
    {
        FShiJinyangAlly A;
        A.Threat = Parameters[Id + TEXT("Threat")]; A.Risk = Parameters[Id + TEXT("Risk")];
        A.UnilateralRisk = Parameters[TEXT("unilateralRisk")];
        State.Allies.Add(Id, A);
    }
}
TArray<FString> FShiJinyangModel::Available() const
{
    TArray<FString> Out;
    if (!Definition || !State.Outcome.IsEmpty() || State.History.Num() >= 32) return Out;
    for (const auto& Id : CommandIds)
    {
        const auto& C = Commands[Id]; bool Allowed = false;
        if (C.Cost > State.Treasury || (Id.StartsWith(TEXT("escort-"))
            && State.Force < Parameters[TEXT("escortForce")])) continue;
        const auto& O = State.Operation;
        if (!O.Phase.IsEmpty())
        {
            if (Id == TEXT("withdraw")) Allowed=State.Exit;
            else if (O.Phase == TEXT("deployment")) Allowed=Id==TEXT("rush-embankment")
                || (Id==TEXT("screen-embankment") && State.Force>=Parameters[TEXT("minimumReserve")]);
            else if (O.Phase == TEXT("breach")) Allowed=Id==TEXT("open-water");
            else if (O.Phase == TEXT("disrupted")) Allowed=Id==TEXT("press-attack")
                || (Id==TEXT("commit-reserve") && O.Reserve==TEXT("ready") && State.Force>=Parameters[TEXT("minimumReserve")]);
            else if (O.Phase == TEXT("assault")) Allowed=Id==TEXT("press-attack") || (Id==TEXT("hold-front") && !O.FrontHeld);
            if (Allowed) Out.Add(Id);
            continue;
        }
        if (!Ids.Contains(Id)) continue;
        if (Id == TEXT("execute")) Allowed = State.Window >= 0;
        else if (Id == TEXT("withdraw")) Allowed = State.Exit;
        else if (State.Tick > State.Deadline) continue;
        else if (Id == TEXT("brace")) Allowed = !State.Braced && State.Window < 0;
        else if (Id == TEXT("diversion")) Allowed = !State.Diversion && State.Window < 0;
        else if (Id == TEXT("escape")) Allowed = !State.Exit && State.Window < 0;
        else if (Id.EndsWith(TEXT("-han"))) Allowed = State.Allies[TEXT("han")].Mission.IsEmpty() && State.Window < 0;
        else if (Id.EndsWith(TEXT("-wei"))) Allowed = State.Allies[TEXT("wei")].Mission.IsEmpty() && State.Window < 0;
        else if (Id == TEXT("relay")) Allowed = !State.Allies[TEXT("han")].Mission.IsEmpty()
            && !State.Allies[TEXT("wei")].Mission.IsEmpty() && !State.Relayed;
        else if (Id == TEXT("early-date") || Id == TEXT("aligned-date")) Allowed = State.Relayed && !State.History.Contains(Id);
        else if (Id == TEXT("wait")) Allowed = State.Window >= 0
            && State.History.FilterByPredicate([](const FString& V) { return V == TEXT("wait"); }).Num() < 2;
        if (Allowed) Out.Add(Id);
    }
    return Out;
}
TSharedPtr<FJsonObject> FShiJinyangModel::Respond(const FString& Id) const
{
    const auto& A = State.Allies[Id];
    FString Reason = !A.Proposal ? TEXT("no-contact")
        : A.Threat <= A.Risk + State.Watch ? TEXT("exposure-outweighs-interest")
        : !A.Partner && A.Threat <= A.UnilateralRisk ? TEXT("unsupported-risk") : TEXT("conditional-agreement");
    FString Decision = Reason == TEXT("no-contact") || Reason == TEXT("exposure-outweighs-interest")
        ? TEXT("stay") : Reason == TEXT("unsupported-risk") ? TEXT("withhold") : TEXT("conditional");
    FString Issue = Decision != TEXT("conditional") ? TEXT("not-committed")
        : A.AgreedWindow != State.OperationWindow ? TEXT("wrong-window")
        : A.ReadyAt > State.OperationWindow ? TEXT("not-ready") : TEXT("");
    auto Out = MakeShared<FJsonObject>();
    Out->SetStringField(TEXT("decision"), Decision); Out->SetStringField(TEXT("reason"), Reason);
    Out->SetBoolField(TEXT("participates"), Issue.IsEmpty());
    if (Issue.IsEmpty()) Out->SetField(TEXT("executionIssue"), MakeShared<FJsonValueNull>());
    else Out->SetStringField(TEXT("executionIssue"), Issue);
    return Out;
}
bool FShiJinyangModel::PreviewDefense(const FString& Id, FShiJinyangState& After) const
{
    if (Id != TEXT("brace") && Id != TEXT("diversion") && Id != TEXT("escape")) return false;
    FShiJinyangModel Candidate = *this;
    FString Error;
    if (!Candidate.Commit(Id, Error)) return false;
    After = Candidate.GetState();
    return true;
}
bool FShiJinyangModel::Commit(const FString& Id, FString& Error)
{
    if (!Available().Contains(Id)) { Error = TEXT("Unavailable Jinyang order: ") + Id; return false; }
    const auto& C = Commands[Id];
    State.History.Add(Id); State.Tick += C.Time; State.Treasury -= C.Cost; State.Watch += C.Watch;
    if (!State.Operation.Phase.IsEmpty()) { PerformOperation(Id); Error.Reset(); return true; }
    if (Id == TEXT("brace")) { State.Braced = true; State.Deadline += Parameters[TEXT("braceExtension")]; }
    if (Id == TEXT("diversion")) { State.Diversion = true; State.DiversionReady = State.Tick; }
    if (Id == TEXT("escape"))
    { State.Exit = true; State.ExitReady = State.Tick; State.ExitCapacity = Parameters[TEXT("withdrawalCapacity")]; }
    for (const auto& Ally : Allies)
    {
        if (Id == TEXT("quiet-") + Ally || Id == TEXT("escort-") + Ally)
        {
            const bool Escort = Id.StartsWith(TEXT("escort-"));
            auto& A = State.Allies[Ally]; A.Mission = Escort ? TEXT("escort") : TEXT("quiet");
            if (Escort) State.Force -= Parameters[TEXT("escortForce")];
            A.Proposal = true; A.ReadyAt = State.Tick + Parameters[Ally + TEXT("Preparation")];
        }
    }
    if (Id == TEXT("relay"))
    {
        State.Relayed = true;
        for (const auto& Ally : Allies) State.Allies[Ally].Partner = true;
    }
    if (Id == TEXT("early-date") || Id == TEXT("aligned-date"))
    {
        State.Window = State.Tick + (Id == TEXT("early-date") ? 1 : 3);
        State.OperationWindow = State.Window;
        for (const auto& Ally : Allies)
            State.Allies[Ally].AgreedWindow =
                Respond(Ally)->GetStringField(TEXT("decision")) == TEXT("conditional") ? State.Window : -1;
    }
    if (Id == TEXT("execute") || Id == TEXT("withdraw") || State.Tick > State.Deadline)
    {
        State.OperationWindow = FMath::Max(State.Tick, State.Window < 0 ? State.Tick : State.Window);
        State.Tick = State.OperationWindow;
        if (Id == TEXT("withdraw")) State.DiversionReady = -1;
        Resolve();
        if (Version == 2 && Id == TEXT("execute") && State.Outcome == TEXT("coordinated-reversal"))
        {
            State.Operation.Phase=TEXT("deployment");
            State.Operation.Enemy=State.Watch>=Parameters[TEXT("watchThreshold")] ? TEXT("reinforced") : TEXT("guard");
            State.Result.Reset(); State.Estate.Reset(); State.Outcome.Reset();
        }
    }
    Error.Reset(); return true;
}
void FShiJinyangModel::PerformOperation(const FString& Id)
{
    auto& O = State.Operation; ++O.Round;
    auto Lose = [this,&O](int32 Amount) { const int32 N=FMath::Min(State.Force,Amount); State.Force-=N; O.Losses+=N; };
    if (Id==TEXT("screen-embankment") || Id==TEXT("rush-embankment"))
    {
        O.Approach=Id==TEXT("screen-embankment") ? TEXT("screen") : TEXT("rush");
        O.Reserve=O.Approach==TEXT("screen") ? TEXT("committed") : TEXT("ready"); O.Phase=TEXT("breach");
    }
    else if (Id==TEXT("open-water"))
    {
        if (O.Approach==TEXT("rush") && O.Enemy==TEXT("reinforced"))
        { Lose(Parameters[TEXT("disruptedLoss")]); O.Phase=TEXT("disrupted"); O.Enemy=TEXT("counterattack"); }
        else
        {
            if (O.Approach==TEXT("screen")) Lose(Parameters[TEXT("screenLoss")]);
            O.WaterOpen=true; O.Phase=TEXT("assault"); O.Enemy=TEXT("disordered");
        }
    }
    else if (Id==TEXT("commit-reserve"))
    { Lose(Parameters[TEXT("reserveLoss")]); O.Reserve=TEXT("committed"); O.WaterOpen=true; O.Phase=TEXT("assault"); O.Enemy=TEXT("disordered"); }
    else if (Id==TEXT("hold-front")) { O.FrontHeld=true; O.Enemy=TEXT("encircled"); }
    else if (Id==TEXT("press-attack") || Id==TEXT("withdraw"))
    {
        if (Id==TEXT("press-attack") && O.WaterOpen)
            Lose(Parameters[O.FrontHeld ? TEXT("heldAssaultLoss") : TEXT("quickAssaultLoss")]);
        Resolve(Id==TEXT("press-attack") && !O.WaterOpen,Id==TEXT("withdraw"));
        auto Reasons=State.Result->GetArrayField(TEXT("reasons"));
        if (O.WaterOpen)
        {
            State.Result->SetBoolField(TEXT("diversionExecuted"),true);
            Reasons.RemoveAll([](const TSharedPtr<FJsonValue>& Reason) { return Reason->AsString()==TEXT("diversion-unavailable"); });
        }
        Reasons.Add(MakeShared<FJsonValueString>(Id==TEXT("withdraw") ? TEXT("operation-withdrawal")
            : !O.WaterOpen ? TEXT("breach-not-open") : O.FrontHeld ? TEXT("flanks-arrived") : TEXT("front-rushed")));
        State.Result->SetArrayField(TEXT("reasons"),Reasons); O.Phase=TEXT("resolved");
    }
}
void FShiJinyangModel::Resolve(bool AttackingIntact, bool ForcedExit)
{
    const bool City = State.OperationWindow <= State.Deadline;
    const bool Diversion = City && State.DiversionReady >= 0 && State.DiversionReady <= State.OperationWindow
        && (State.Operation.Phase.IsEmpty() || State.Operation.WaterOpen) && !ForcedExit;
    auto Responses = MakeShared<FJsonObject>();
    bool Coordinated = Diversion;
    TArray<FString> Reasons, Obligations, Contacts;
    if (!City) Reasons.Add(TEXT("city-deadline-missed"));
    if (!Diversion) Reasons.Add(TEXT("diversion-unavailable"));
    for (const auto& Ally : Allies)
    {
        const auto Response = Respond(Ally); Responses->SetObjectField(Ally, Response);
        if (!Response->GetBoolField(TEXT("participates")))
        {
            Coordinated = false;
            Reasons.Add(Ally + TEXT(":") + Response->GetStringField(TEXT("executionIssue")));
        }
        if (!State.Allies[Ally].Mission.IsEmpty()) Contacts.Add(Ally);
    }
    const bool Withdrawal = !Coordinated && !AttackingIntact && City && State.ExitReady >= 0
        && State.ExitReady <= State.OperationWindow && State.ExitCapacity > 0;
    const int32 Evacuated = Withdrawal ? FMath::Min(Parameters[TEXT("people")], State.ExitCapacity) : 0;
    State.Outcome = Coordinated ? TEXT("coordinated-reversal")
        : Evacuated > 0 ? TEXT("costly-withdrawal") : TEXT("isolated-defeat");
    if (Coordinated) Obligations = Allies;
    if (Withdrawal) Reasons.Add(TEXT("prepared-withdrawal-used"));
    State.Result = MakeShared<FJsonObject>();
    State.Result->SetStringField(TEXT("outcome"), State.Outcome);
    State.Result->SetObjectField(TEXT("allies"), Responses);
    State.Result->SetBoolField(TEXT("cityHeld"), City);
    State.Result->SetBoolField(TEXT("diversionExecuted"), Diversion);
    State.Result->SetNumberField(TEXT("evacuated"), Evacuated);
    State.Result->SetNumberField(TEXT("leftBehind"), Coordinated ? 0 : Parameters[TEXT("people")] - Evacuated);
    State.Result->SetArrayField(TEXT("settlementObligations"), Strings(Obligations));
    State.Result->SetArrayField(TEXT("reasons"), Strings(Reasons));
    State.Estate = MakeShared<FJsonObject>();
    State.Estate->SetArrayField(TEXT("landClaims"), Strings(Coordinated ? TArray<FString>{TEXT("zhi-settlement-claim")} : TArray<FString>{}));
    State.Estate->SetNumberField(TEXT("treasury"), Coordinated || Evacuated > 0 ? State.Treasury : 0);
    State.Estate->SetNumberField(TEXT("survivingForce"), Coordinated ? State.Force : FMath::Min(State.Force, Evacuated));
    State.Estate->SetStringField(TEXT("office"), Coordinated ? TEXT("zhao-command") : Evacuated > 0 ? TEXT("displaced-command") : TEXT("lost-command"));
    State.Estate->SetArrayField(TEXT("contacts"), Strings(Contacts));
    State.Estate->SetArrayField(TEXT("obligations"), Strings(Obligations));
    State.Estate->SetArrayField(TEXT("household"), {});
}
FString FShiJinyangModel::ExportSave() const
{
    auto Root = MakeShared<FJsonObject>(); Root->SetNumberField(TEXT("revision"), Version);
    Root->SetStringField(TEXT("definitionFingerprint"), Fingerprint);
    Root->SetArrayField(TEXT("history"), Strings(State.History)); return Serialize(Root);
}
bool FShiJinyangModel::Restore(const FString& Save, FString& Error)
{
    TSharedPtr<FJsonObject> Root; const TArray<TSharedPtr<FJsonValue>>* History = nullptr;
    int32 Revision = 0; FString SavedFingerprint;
    if (!Definition || Save.Len() > 16384
        || !FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Save), Root) || !Root
        || Root->Values.Num() != 3 || !Integer(Root, TEXT("revision"), Revision) || Revision != Version
        || !Root->TryGetStringField(TEXT("definitionFingerprint"), SavedFingerprint) || SavedFingerprint != Fingerprint
        || !Root->TryGetArrayField(TEXT("history"), History) || !History || History->Num() > 32)
    { Error = TEXT("Incompatible or malformed Jinyang save"); return false; }
    FShiJinyangModel Candidate = *this; Candidate.Reset();
    for (const auto& Raw : *History)
    {
        FString Id;
        if (!Raw || !Raw->TryGetString(Id) || !Candidate.Commit(Id, Error)) return false;
    }
    *this = MoveTemp(Candidate); Error.Reset(); return true;
}
TSharedPtr<FJsonObject> FShiJinyangModel::StateObject() const
{
    auto Root = MakeShared<FJsonObject>(), Situation = MakeShared<FJsonObject>();
    Root->SetNumberField(TEXT("revision"), Version); Root->SetStringField(TEXT("definitionFingerprint"), Fingerprint);
    Root->SetArrayField(TEXT("history"), Strings(State.History)); Root->SetNumberField(TEXT("tick"), State.Tick);
    Root->SetNumberField(TEXT("treasury"), State.Treasury); Root->SetNumberField(TEXT("force"), State.Force);
    Root->SetBoolField(TEXT("braced"), State.Braced); Root->SetBoolField(TEXT("diversion"), State.Diversion);
    Root->SetBoolField(TEXT("exit"), State.Exit); Root->SetBoolField(TEXT("relayed"), State.Relayed);
    NullableNumber(Root, TEXT("window"), State.Window);
    auto Missions = MakeShared<FJsonObject>(), AllyObjects = MakeShared<FJsonObject>();
    for (const auto& Id : Allies)
    {
        const auto& A = State.Allies[Id];
        if (A.Mission.IsEmpty()) Missions->SetField(Id, MakeShared<FJsonValueNull>());
        else Missions->SetStringField(Id, A.Mission);
        auto O = MakeShared<FJsonObject>();
        O->SetNumberField(TEXT("futureThreat"), A.Threat); O->SetNumberField(TEXT("disclosureRisk"), A.Risk);
        O->SetNumberField(TEXT("unilateralRisk"), A.UnilateralRisk);
        O->SetBoolField(TEXT("receivedProposal"), A.Proposal); O->SetBoolField(TEXT("receivedPartnerCommitment"), A.Partner);
        NullableNumber(O, TEXT("agreedWindow"), A.AgreedWindow); O->SetNumberField(TEXT("forceReadyAt"), A.ReadyAt);
        AllyObjects->SetObjectField(Id, O);
    }
    Root->SetObjectField(TEXT("missions"), Missions);
    Situation->SetNumberField(TEXT("version"), 1); Situation->SetNumberField(TEXT("operationWindow"), State.OperationWindow);
    Situation->SetNumberField(TEXT("cityHoldsUntil"), State.Deadline); NullableNumber(Situation, TEXT("diversionReadyAt"), State.DiversionReady);
    Situation->SetNumberField(TEXT("enemyWatch"), State.Watch); Situation->SetNumberField(TEXT("peopleAtRisk"), Parameters[TEXT("people")]);
    if (State.ExitReady < 0) Situation->SetField(TEXT("withdrawal"), MakeShared<FJsonValueNull>());
    else
    {
        auto W = MakeShared<FJsonObject>(); W->SetNumberField(TEXT("readyAt"), State.ExitReady);
        W->SetNumberField(TEXT("capacity"), State.ExitCapacity); Situation->SetObjectField(TEXT("withdrawal"), W);
    }
    Situation->SetObjectField(TEXT("allies"), AllyObjects); Root->SetObjectField(TEXT("situation"), Situation);
    if (State.Result) Root->SetObjectField(TEXT("result"), State.Result); else Root->SetField(TEXT("result"), MakeShared<FJsonValueNull>());
    if (State.Estate) Root->SetObjectField(TEXT("estate"), State.Estate); else Root->SetField(TEXT("estate"), MakeShared<FJsonValueNull>());
    if (Version == 2)
    {
        const auto& O=State.Operation;
        if (O.Phase.IsEmpty()) Root->SetField(TEXT("operation"),MakeShared<FJsonValueNull>());
        else
        {
            auto Op=MakeShared<FJsonObject>();
            Op->SetStringField(TEXT("phase"),O.Phase); Op->SetStringField(TEXT("approach"),O.Approach);
            Op->SetStringField(TEXT("enemy"),O.Enemy); Op->SetStringField(TEXT("reserve"),O.Reserve);
            Op->SetBoolField(TEXT("waterOpen"),O.WaterOpen); Op->SetBoolField(TEXT("frontHeld"),O.FrontHeld);
            Op->SetNumberField(TEXT("losses"),O.Losses); Op->SetNumberField(TEXT("round"),O.Round);
            Root->SetObjectField(TEXT("operation"),Op);
        }
    }
    return Root;
}
