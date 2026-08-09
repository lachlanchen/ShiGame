#include "ShiCommandSignalModel.h"

#include "ShiWartableModel.h"

namespace
{
    constexpr float TableSurfaceZ = 14.f;
    constexpr float SignalHalfWidth = 220.f;
    constexpr float SignalHalfDepth = 150.f;
    constexpr float MinimumPointerSpacing = 42.f;

    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};
    const TArray<FString> RequiredSignalIds = {
        TEXT("resource-grain"), TEXT("resource-trust"), TEXT("resource-momentum"), TEXT("resource-people"), TEXT("resource-danger"),
        TEXT("layer-field"), TEXT("layer-pursuit"), TEXT("layer-method-read"), TEXT("layer-commitment")
    };

    float HeightScale(int32 Value)
    {
        return .10f + FMath::Clamp(Value, 0, 100) * .0032f;
    }

    FShiCommandSignalData ResourceSignal(const FString& Key, int32 Value, int32 Index)
    {
        FShiCommandSignalData Signal;
        Signal.Id = FString::Printf(TEXT("resource-%s"), *Key);
        Signal.Category = TEXT("resource");
        Signal.Label = Key.ToUpper();
        Signal.State = FString::Printf(TEXT("%d / 100"), Value);
        Signal.Detail = FString::Printf(TEXT("EXACT CURRENT %s STATE · READ ONLY"), *Key.ToUpper());
        Signal.NumericValue = Value;
        Signal.StencilValue = 11 + Index;
        Signal.Location.X = -180.f + Index * 90.f;
        Signal.Location.Y = -125.f;
        Signal.Scale.Z = HeightScale(Value);
        Signal.Location.Z = TableSurfaceZ + Signal.Scale.Z * 50.f;

        if (Key == TEXT("grain"))
        {
            Signal.MeshPath = TEXT("/Engine/BasicShapes/Cylinder.Cylinder");
            Signal.Scale.X = Signal.Scale.Y = .14f;
            Signal.Color = FLinearColor(.58f, .38f, .12f);
        }
        else if (Key == TEXT("trust"))
        {
            Signal.MeshPath = TEXT("/Engine/BasicShapes/Sphere.Sphere");
            Signal.Scale.X = Signal.Scale.Y = .14f;
            Signal.Color = FLinearColor(.20f, .48f, .42f);
        }
        else if (Key == TEXT("momentum"))
        {
            Signal.MeshPath = TEXT("/Engine/BasicShapes/Cone.Cone");
            Signal.Scale.X = Signal.Scale.Y = .14f;
            Signal.Color = FLinearColor(.72f, .52f, .12f);
        }
        else if (Key == TEXT("people"))
        {
            Signal.MeshPath = TEXT("/Engine/BasicShapes/Cube.Cube");
            Signal.Scale.X = .16f;
            Signal.Scale.Y = .12f;
            Signal.Color = FLinearColor(.28f, .40f, .52f);
        }
        else
        {
            Signal.MeshPath = TEXT("/Engine/BasicShapes/Cone.Cone");
            Signal.Scale.X = Signal.Scale.Y = .10f;
            Signal.Color = FLinearColor(.62f, .12f, .08f);
        }
        return Signal;
    }

    FShiCommandSignalData LayerSignal(const FString& Id, const FString& Label, const FString& State, const FString& Detail,
        const FString& MeshPath, const FVector& Location, const FVector& Scale, const FLinearColor& Color, int32 StencilValue)
    {
        FShiCommandSignalData Signal;
        Signal.Id = Id;
        Signal.Category = TEXT("layer");
        Signal.Label = Label;
        Signal.State = State;
        Signal.Detail = Detail;
        Signal.MeshPath = MeshPath;
        Signal.Location = Location;
        Signal.Scale = Scale;
        Signal.Color = Color;
        Signal.StencilValue = StencilValue;
        return Signal;
    }
}

bool FShiCommandSignalModel::Build(const TMap<FString, int32>& Resources, const FShiFieldConditionData* Field,
    const FShiOppositionStageData* Pursuit, const FShiMethodReadData* MethodRead,
    const FShiCommitmentData* Commitment, const FShiChoiceData* SelectedChoice, const FString& Locale,
    TArray<FShiCommandSignalData>& OutSignals, FString& OutError)
{
    TArray<FShiCommandSignalData> BuiltSignals;
    for (const FString& Key : ResourceKeys)
    {
        const int32* Value = Resources.Find(Key);
        if (!Value || *Value < 0 || *Value > 100)
        {
            OutError = FString::Printf(TEXT("Command signal input %s is missing or outside 0-100."), *Key);
            return false;
        }
        BuiltSignals.Add(ResourceSignal(Key, *Value, BuiltSignals.Num()));
    }
    const bool bCaptured = Resources.FindRef(TEXT("danger")) >= 100;
    if (!Field || (!Pursuit && !bCaptured) || !MethodRead || !SelectedChoice)
    {
        OutError = TEXT("Command signals require the current field, pursuit, method read and selected order.");
        return false;
    }

    BuiltSignals.Add(LayerSignal(TEXT("layer-field"), TEXT("FIELD"), Field->Title.Resolve(Locale), Field->Signal.Resolve(Locale),
        TEXT("/Engine/BasicShapes/Cylinder.Cylinder"), FVector(-135.f, 105.f, 18.f), FVector(.18f, .18f, .08f),
        FLinearColor(.24f, .35f, .42f), 16));

    FShiCommandSignalData PursuitSignal = LayerSignal(TEXT("layer-pursuit"), TEXT("QIN PURSUIT"),
        Pursuit ? Pursuit->Title.Resolve(Locale) : TEXT("PURSUIT CLOSED · CAPTURED"),
        Pursuit ? FString::Printf(TEXT("%s\n\nCOUNTERPLAY · %s"), *Pursuit->Forecast.Resolve(Locale), *Pursuit->Counterplay.Resolve(Locale))
            : TEXT("EXPOSURE 100 / 100 · THE CHRONICLE RECORDS THIS POSITION AS CAPTURED"),
        TEXT("/Engine/BasicShapes/Cone.Cone"), FVector(-45.f, 105.f, 24.f), FVector(.14f, .14f, .20f),
        FLinearColor(.55f, .10f, .08f), 17);
    PursuitSignal.NumericValue = Resources.FindRef(TEXT("danger"));
    BuiltSignals.Add(MoveTemp(PursuitSignal));

    const bool bNeutralRead = MethodRead->TargetMethodId.IsEmpty();
    const bool bReadHits = !bNeutralRead && MethodRead->TargetMethodId == SelectedChoice->MethodId;
    const FString ReadState = bNeutralRead ? TEXT("NEUTRAL") : bReadHits ? TEXT("COUNTER WOULD HIT") : TEXT("COUNTER MISSES THIS ORDER");
    FShiCommandSignalData MethodSignal = LayerSignal(TEXT("layer-method-read"), TEXT("METHOD READ"),
        FString::Printf(TEXT("%s · %s"), *MethodRead->Title.Resolve(Locale), *ReadState), MethodRead->Forecast.Resolve(Locale),
        TEXT("/Engine/BasicShapes/Cube.Cube"), FVector(45.f, 105.f, 21.f), FVector(.14f, .14f, .14f),
        FLinearColor(.38f, .24f, .50f), 18);
    MethodSignal.Rotation = FRotator(0.f, 45.f, 0.f);
    BuiltSignals.Add(MoveTemp(MethodSignal));

    const bool bOathActive = Commitment != nullptr;
    FShiCommandSignalData OathSignal = LayerSignal(TEXT("layer-commitment"), TEXT("ACTIVE OATH"),
        bOathActive ? Commitment->Title.Resolve(Locale) : TEXT("NO CARRIED OATH"),
        bOathActive ? Commitment->Promise.Resolve(Locale) : TEXT("No carried promise currently awaits an answer."),
        TEXT("/Engine/BasicShapes/Sphere.Sphere"), FVector(135.f, 105.f, bOathActive ? 22.5f : 19.5f),
        bOathActive ? FVector(.17f) : FVector(.11f), bOathActive ? FLinearColor(.65f, .42f, .14f) : FLinearColor(.20f, .22f, .22f), 19);
    OathSignal.bActive = bOathActive;
    BuiltSignals.Add(MoveTemp(OathSignal));

    if (!Validate(BuiltSignals, OutError)) return false;
    OutSignals = MoveTemp(BuiltSignals);
    return true;
}

const FShiCommandSignalData* FShiCommandSignalModel::Find(const TArray<FShiCommandSignalData>& Signals, const FString& SignalId)
{
    return Signals.FindByPredicate([&](const FShiCommandSignalData& Signal) { return Signal.Id == SignalId; });
}

FString FShiCommandSignalModel::CycleSignal(const TArray<FShiCommandSignalData>& Signals, const FString& CurrentSignalId, int32 Direction)
{
    if (Signals.IsEmpty() || Direction == 0) return CurrentSignalId;
    const int32 CurrentIndex = Signals.IndexOfByPredicate([&](const FShiCommandSignalData& Signal) { return Signal.Id == CurrentSignalId; });
    const int32 Step = Direction < 0 ? -1 : 1;
    const int32 BaseIndex = CurrentIndex == INDEX_NONE ? (Step > 0 ? -1 : 0) : CurrentIndex;
    return Signals[(BaseIndex + Step + Signals.Num()) % Signals.Num()].Id;
}

FShiCommandSignalData FShiCommandSignalModel::SelectedStyle(const FShiCommandSignalData& Signal, bool bSelected)
{
    FShiCommandSignalData Styled = Signal;
    if (bSelected)
    {
        const float BaseZ = Signal.Location.Z - Signal.Scale.Z * 50.f;
        Styled.Scale *= 1.18f;
        Styled.Location.Z = BaseZ + Styled.Scale.Z * 50.f;
        Styled.Color = FLinearColor::LerpUsingHSV(Styled.Color, FLinearColor(.96f, .78f, .36f), .44f);
    }
    return Styled;
}

FTransform FShiCommandSignalModel::CameraTransform(const FShiCommandSignalData& Signal)
{
    const FVector Target = Signal.Location + FVector(0.f, 0.f, 10.f);
    const FVector Location = Target + FVector(330.f, -365.f, 245.f);
    return FTransform((Target - Location).Rotation(), Location);
}

bool FShiCommandSignalModel::Validate(const TArray<FShiCommandSignalData>& Signals, FString& OutError)
{
    if (Signals.Num() != RequiredSignalIds.Num())
    {
        OutError = FString::Printf(TEXT("Command space requires exactly %d signals."), RequiredSignalIds.Num());
        return false;
    }
    TSet<FString> Ids;
    TSet<int32> Stencils;
    TArray<FVector> Positions;
    for (int32 Index = 0; Index < Signals.Num(); ++Index)
    {
        const FShiCommandSignalData& Signal = Signals[Index];
        const bool bResource = Signal.Category == TEXT("resource");
        const float BaseZ = Signal.Location.Z - Signal.Scale.Z * 50.f;
        if (Signal.Id.IsEmpty() || Signal.Id != RequiredSignalIds[Index] || Ids.Contains(Signal.Id)
            || (!bResource && Signal.Category != TEXT("layer")) || Signal.Label.IsEmpty() || Signal.State.IsEmpty() || Signal.Detail.IsEmpty()
            || !Signal.MeshPath.StartsWith(TEXT("/Engine/BasicShapes/")) || Signal.Scale.GetMin() <= 0.f
            || !FMath::IsFinite(Signal.Location.X) || !FMath::IsFinite(Signal.Location.Y) || !FMath::IsFinite(Signal.Location.Z)
            || FMath::Abs(Signal.Location.X) > SignalHalfWidth || FMath::Abs(Signal.Location.Y) > SignalHalfDepth
            || Signal.Location.Z < TableSurfaceZ || Signal.Location.Z > 80.f || !FMath::IsNearlyEqual(BaseZ, TableSurfaceZ, .01f)
            || Signal.StencilValue < 11 || Signal.StencilValue > 19 || Stencils.Contains(Signal.StencilValue)
            || (bResource && (Signal.NumericValue < 0 || Signal.NumericValue > 100
                || !FMath::IsNearlyEqual(Signal.Scale.Z, HeightScale(Signal.NumericValue), .0001f)
                || Signal.State != FString::Printf(TEXT("%d / 100"), Signal.NumericValue))))
        {
            OutError = FString::Printf(TEXT("Command signal %s cannot be represented safely."), *Signal.Id);
            return false;
        }
        for (const FVector& Existing : Positions)
        {
            if (FVector::Dist2D(Existing, Signal.Location) < MinimumPointerSpacing)
            {
                OutError = FString::Printf(TEXT("Command signal %s overlaps another pointer target."), *Signal.Id);
                return false;
            }
        }
        Ids.Add(Signal.Id);
        Stencils.Add(Signal.StencilValue);
        Positions.Add(Signal.Location);
    }
    for (const FString& RequiredId : RequiredSignalIds)
    {
        if (!Ids.Contains(RequiredId))
        {
            OutError = FString::Printf(TEXT("Command signal %s is missing."), *RequiredId);
            return false;
        }
    }
    OutError.Empty();
    return true;
}

bool FShiCommandSignalModel::ValidateAgainstSites(const TArray<FShiCommandSignalData>& Signals, const TArray<FShiSiteData>& Sites, FString& OutError)
{
    if (!Validate(Signals, OutError) || !FShiWartableModel::Validate(Sites, OutError)) return false;
    for (const FShiCommandSignalData& Signal : Signals)
    {
        for (const FShiSiteData& Site : Sites)
        {
            if (FVector::Dist2D(Signal.Location, FShiWartableModel::ProjectSite(Site)) < MinimumPointerSpacing)
            {
                OutError = FString::Printf(TEXT("Command signal %s overlaps wartable site %s."), *Signal.Id, *Site.Id);
                return false;
            }
        }
    }
    OutError.Empty();
    return true;
}
