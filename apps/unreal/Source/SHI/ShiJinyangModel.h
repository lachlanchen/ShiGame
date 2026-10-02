#pragma once
#include "CoreMinimal.h"
#include "Dom/JsonObject.h"

/** Experimental chapter, separate from released Qin saves and authority. */
struct FShiJinyangCommand
{
    FString Id, Site, English, Chinese;
    int32 Time = 0, Cost = 0, Watch = 0;
};
struct FShiJinyangAlly
{
    int32 Threat = 0, Risk = 0, UnilateralRisk = 0, ReadyAt = 1000, AgreedWindow = -1;
    bool Proposal = false, Partner = false;
    FString Mission;
};
struct FShiJinyangState
{
    TArray<FString> History;
    int32 Tick = 0, Treasury = 0, Force = 0, Deadline = 0, Watch = 0;
    int32 Window = -1, OperationWindow = 0, DiversionReady = -1, ExitReady = -1, ExitCapacity = 0;
    bool Braced = false, Diversion = false, Exit = false, Relayed = false;
    TMap<FString, FShiJinyangAlly> Allies;
    FString Outcome;
    TSharedPtr<FJsonObject> Result, Estate;
};
class FShiJinyangModel
{
public:
    bool Initialize(const FString& Definition, FString& Error);
    bool Commit(const FString& Id, FString& Error);
    bool Restore(const FString& Save, FString& Error);
    FString ExportSave() const;
    TSharedPtr<FJsonObject> StateObject() const;
    TArray<FString> Available() const;
    const FShiJinyangState& GetState() const { return State; }
    const TMap<FString, FShiJinyangCommand>& GetCommands() const { return Commands; }
    const TSharedPtr<FJsonObject>& GetDefinition() const { return Definition; }
    const FString& GetFingerprint() const { return Fingerprint; }
private:
    TSharedPtr<FJsonObject> Definition;
    TMap<FString, int32> Parameters;
    TMap<FString, FShiJinyangCommand> Commands;
    FString Fingerprint;
    FShiJinyangState State;
    void Reset();
    void Resolve();
    TSharedPtr<FJsonObject> Respond(const FString& Ally) const;
};
