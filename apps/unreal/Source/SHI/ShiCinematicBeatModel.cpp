#include "ShiCinematicBeatModel.h"

#include "ShiWartableModel.h"

namespace
{
    constexpr float MaximumSequenceSeconds = 5.f;
    constexpr float MaximumEasedTranslation = 100.f;
    constexpr float MaximumEasedRotationDegrees = 6.f;
    const TArray<FString> ResourceKeys = {TEXT("grain"), TEXT("trust"), TEXT("momentum"), TEXT("people"), TEXT("danger")};
    const TArray<FString> StableBeatIds = {
        TEXT("resolution-order"), TEXT("resolution-commitment"), TEXT("resolution-pressure"),
        TEXT("resolution-pursuit"), TEXT("resolution-method-read"), TEXT("resolution-field"), TEXT("resolution-position")
    };

    FString EffectsSummary(const TMap<FString, int32>& Effects)
    {
        TArray<FString> Parts;
        for (const FString& Key : ResourceKeys)
        {
            if (const int32* Value = Effects.Find(Key); Value && *Value != 0)
                Parts.Add(FString::Printf(TEXT("%s %+d"), *Key.ToUpper(), *Value));
        }
        return Parts.IsEmpty() ? TEXT("NO RESOURCE CHANGE") : FString::Join(Parts, TEXT(" · "));
    }

    FString ResourceSummary(const TMap<FString, int32>& Resources)
    {
        TArray<FString> Parts;
        for (const FString& Key : ResourceKeys)
            Parts.Add(FString::Printf(TEXT("%s %d"), *Key.ToUpper(), Resources.FindRef(Key)));
        return FString::Join(Parts, TEXT(" · "));
    }

    TMap<FString, int32> ResourceDeltas(const TMap<FString, int32>& Before, const TMap<FString, int32>& After)
    {
        TMap<FString, int32> Deltas;
        for (const FString& Key : ResourceKeys)
        {
            const int32 Delta = After.FindRef(Key) - Before.FindRef(Key);
            if (Delta != 0) Deltas.Add(Key, Delta);
        }
        return Deltas;
    }

    FString DominantResourceSignal(const TMap<FString, int32>& Effects)
    {
        FString Dominant;
        int32 LargestMagnitude = 0;
        for (const FString& Key : ResourceKeys)
        {
            const int32 Magnitude = FMath::Abs(Effects.FindRef(Key));
            if (Magnitude > LargestMagnitude)
            {
                Dominant = FString::Printf(TEXT("resource-%s"), *Key);
                LargestMagnitude = Magnitude;
            }
        }
        return Dominant;
    }

    FShiCinematicBeatData SignalBeat(const FString& Id, const FString& Layer, const FString& Label,
        const FString& Detail, const FString& FocusId, float TransitionSeconds, float HoldSeconds)
    {
        FShiCinematicBeatData Beat;
        Beat.Id = Id;
        Beat.Layer = Layer;
        Beat.Label = Label;
        Beat.Detail = Detail;
        Beat.FocusKind = TEXT("signal");
        Beat.FocusId = FocusId;
        Beat.TransitionSeconds = TransitionSeconds;
        Beat.HoldSeconds = HoldSeconds;
        return Beat;
    }

    float FieldOfViewForBeat(const FString& BeatId)
    {
        if (BeatId == TEXT("resolution-order")) return 44.f;
        if (BeatId == TEXT("resolution-commitment")) return 48.f;
        if (BeatId == TEXT("resolution-pressure")) return 40.f;
        if (BeatId == TEXT("resolution-pursuit")) return 52.f;
        if (BeatId == TEXT("resolution-method-read")) return 43.f;
        if (BeatId == TEXT("resolution-field")) return 54.f;
        return BeatId == TEXT("resolution-position") ? 58.f : 0.f;
    }

    bool ResolveCameraTarget(const FShiCinematicBeatData& Beat, const TArray<FShiCommandSignalData>& Signals,
        const FShiSiteData* PositionSite, FTransform& OutTarget)
    {
        if (Beat.FocusKind == TEXT("signal"))
        {
            const FShiCommandSignalData* Signal = FShiCommandSignalModel::Find(Signals, Beat.FocusId);
            if (!Signal) return false;
            OutTarget = FShiCommandSignalModel::CameraTransform(*Signal);
            return true;
        }
        if (Beat.FocusKind == TEXT("site") && PositionSite && Beat.FocusId == PositionSite->Id)
        {
            OutTarget = FShiWartableModel::CameraTransform(*PositionSite);
            return true;
        }
        return false;
    }

    FString CameraMotionBetween(const FTransform* Previous, const FTransform& Current)
    {
        if (!Previous) return TEXT("cut");
        const float Translation = FVector::Distance(Previous->GetLocation(), Current.GetLocation());
        const float RotationDegrees = FMath::RadiansToDegrees(Previous->GetRotation().AngularDistance(Current.GetRotation()));
        return Translation <= MaximumEasedTranslation && RotationDegrees <= MaximumEasedRotationDegrees
            ? TEXT("ease") : TEXT("cut");
    }
}

bool FShiCinematicBeatModel::Build(const FShiResolutionResult& Resolution, const FShiCommitmentData* CurrentCommitment,
    const TMap<FString, int32>& FinalResources, const FShiSiteData* PositionSite, bool bCompleted,
    const FString& FailureReason, const TArray<FShiCommandSignalData>& Signals, const FString& Locale,
    TArray<FShiCinematicBeatData>& OutBeats, FString& OutError)
{
    if (!Resolution.Node || !Resolution.Choice || !Resolution.Condition || !Resolution.Opposition || !Resolution.MethodRead || !PositionSite)
    {
        OutError = TEXT("Cinematic consequence planning requires every resolved layer and the final position site.");
        return false;
    }
    if (!FailureReason.IsEmpty() && (!bCompleted || (FailureReason != TEXT("captured") && FailureReason != TEXT("scattered"))))
    {
        OutError = TEXT("Cinematic consequence failure state is unsupported or nonterminal.");
        return false;
    }
    for (const FString& Key : ResourceKeys)
    {
        const int32* Value = FinalResources.Find(Key);
        const int32* RecordedValue = Resolution.Record.After.Find(Key);
        const FShiCommandSignalData* Signal = FShiCommandSignalModel::Find(Signals, FString::Printf(TEXT("resource-%s"), *Key));
        if (!Value || !RecordedValue || *Value < 0 || *Value > 100 || *RecordedValue != *Value
            || !Signal || Signal->NumericValue != *Value)
        {
            OutError = FString::Printf(TEXT("Cinematic final resource %s does not match the resolution record and live world."), *Key);
            return false;
        }
    }

    TArray<FShiCinematicBeatData> BuiltBeats;
    const TMap<FString, int32> OrderEffects = ResourceDeltas(Resolution.Record.Before, Resolution.Record.AfterChoice);
    const FString OrderFocus = DominantResourceSignal(OrderEffects);
    FShiCinematicBeatData Order = SignalBeat(TEXT("resolution-order"), TEXT("order"),
        FString::Printf(TEXT("ORDER RESOLVED · %s"), *Resolution.Choice->Label.Resolve(Locale).ToUpper()),
        FString::Printf(TEXT("%s\n%s"), *Resolution.Choice->Consequence.Resolve(Locale), *EffectsSummary(OrderEffects)),
        OrderFocus, .34f, .22f);
    if (OrderFocus.IsEmpty())
    {
        Order.FocusKind = TEXT("site");
        Order.FocusId = PositionSite->Id;
    }
    BuiltBeats.Add(MoveTemp(Order));

    if (Resolution.CommitmentOutcome)
    {
        BuiltBeats.Add(SignalBeat(TEXT("resolution-commitment"), TEXT("commitment"),
            FString::Printf(TEXT("OATH %s"), *Resolution.CommitmentOutcome->Status.ToUpper()),
            FString::Printf(TEXT("%s\n%s"), *Resolution.CommitmentOutcome->Response.Resolve(Locale),
                *EffectsSummary(Resolution.Record.CommitmentEffects)),
            TEXT("layer-commitment"), .32f, .24f));
    }
    else if (!Resolution.Commitment && CurrentCommitment)
    {
        BuiltBeats.Add(SignalBeat(TEXT("resolution-commitment"), TEXT("commitment"), TEXT("OATH ESTABLISHED"),
            FString::Printf(TEXT("%s\n%s"), *CurrentCommitment->Title.Resolve(Locale), *CurrentCommitment->Promise.Resolve(Locale)),
            TEXT("layer-commitment"), .32f, .24f));
    }

    FString PressureFocus = DominantResourceSignal(Resolution.Record.PressureEffects);
    if (PressureFocus.IsEmpty()) PressureFocus = TEXT("resource-danger");
    BuiltBeats.Add(SignalBeat(TEXT("resolution-pressure"), TEXT("pressure"), TEXT("EXPOSED ANSWER"),
        FString::Printf(TEXT("%s\n%s"), *Resolution.Choice->PressureReveal.Resolve(Locale),
            *EffectsSummary(Resolution.Record.PressureEffects)), PressureFocus, .32f, .22f));

    BuiltBeats.Add(SignalBeat(TEXT("resolution-pursuit"), TEXT("pursuit"),
        FString::Printf(TEXT("QIN RESPONSE · %s"), *Resolution.Opposition->Title.Resolve(Locale).ToUpper()),
        FString::Printf(TEXT("%s\n%s"), *Resolution.Opposition->Response.Resolve(Locale),
            *EffectsSummary(Resolution.Record.OppositionEffects)), TEXT("layer-pursuit"), .36f, .24f));

    const bool bNeutralRead = Resolution.MethodRead->TargetMethodId.IsEmpty();
    const FString MethodState = bNeutralRead ? TEXT("NEUTRAL") : Resolution.Record.bMethodReadMatched ? TEXT("HIT") : TEXT("MISSED");
    const FString MethodResponse = bNeutralRead ? Resolution.MethodRead->Forecast.Resolve(Locale)
        : Resolution.Record.bMethodReadMatched ? Resolution.MethodRead->HitResponse.Resolve(Locale) : Resolution.MethodRead->MissResponse.Resolve(Locale);
    const FString MethodEffects = EffectsSummary(Resolution.Record.MethodReadEffects);
    BuiltBeats.Add(SignalBeat(TEXT("resolution-method-read"), TEXT("method-read"),
        FString::Printf(TEXT("METHOD READ · %s"), *MethodState),
        FString::Printf(TEXT("%s\n%s"), *MethodResponse, *MethodEffects),
        TEXT("layer-method-read"), .32f, .20f));

    BuiltBeats.Add(SignalBeat(TEXT("resolution-field"), TEXT("field"),
        FString::Printf(TEXT("FIELD · %s"), *Resolution.Condition->Title.Resolve(Locale).ToUpper()),
        FString::Printf(TEXT("%s\n%s"), *Resolution.Condition->Signal.Resolve(Locale),
            *EffectsSummary(Resolution.Record.ConditionEffects)), TEXT("layer-field"), .32f, .20f));

    FShiCinematicBeatData Position;
    Position.Id = TEXT("resolution-position");
    Position.Layer = TEXT("position");
    Position.Label = !FailureReason.IsEmpty() ? FString::Printf(TEXT("POSITION LOST · %s"), *FailureReason.ToUpper())
        : bCompleted ? TEXT("CHAPTER POSITION COMPLETE") : FString::Printf(TEXT("POSITION ADVANCES · %s"), *PositionSite->Name.Resolve(Locale).ToUpper());
    Position.Detail = ResourceSummary(FinalResources);
    Position.FocusKind = TEXT("site");
    Position.FocusId = PositionSite->Id;
    Position.TransitionSeconds = .44f;
    Position.HoldSeconds = .34f;
    BuiltBeats.Add(MoveTemp(Position));

    FTransform PreviousCameraTarget;
    bool bHasPreviousCameraTarget = false;
    for (FShiCinematicBeatData& Beat : BuiltBeats)
    {
        FTransform CameraTarget;
        if (!ResolveCameraTarget(Beat, Signals, PositionSite, CameraTarget))
        {
            OutError = FString::Printf(TEXT("Cinematic beat %s has no deterministic camera target."), *Beat.Id);
            return false;
        }
        Beat.CameraMotion = CameraMotionBetween(bHasPreviousCameraTarget ? &PreviousCameraTarget : nullptr, CameraTarget);
        Beat.FieldOfViewDegrees = FieldOfViewForBeat(Beat.Id);
        PreviousCameraTarget = CameraTarget;
        bHasPreviousCameraTarget = true;
    }

    if (!Validate(BuiltBeats, Signals, PositionSite, OutError)) return false;
    OutBeats = MoveTemp(BuiltBeats);
    return true;
}

bool FShiCinematicBeatModel::Validate(const TArray<FShiCinematicBeatData>& Beats,
    const TArray<FShiCommandSignalData>& Signals, const FShiSiteData* PositionSite, FString& OutError)
{
    if (!FShiCommandSignalModel::Validate(Signals, OutError)) return false;
    if (!PositionSite || Beats.Num() < 6 || Beats.Num() > StableBeatIds.Num())
    {
        OutError = TEXT("Cinematic consequence grammar requires six beats plus at most one oath beat.");
        return false;
    }
    int32 StableIndex = 0;
    TSet<FString> BeatIds;
    FTransform PreviousCameraTarget;
    bool bHasPreviousCameraTarget = false;
    for (const FShiCinematicBeatData& Beat : Beats)
    {
        while (StableIndex < StableBeatIds.Num() && StableBeatIds[StableIndex] != Beat.Id) ++StableIndex;
        const bool bSignalFocus = Beat.FocusKind == TEXT("signal");
        const bool bSiteFocus = Beat.FocusKind == TEXT("site");
        const FString ExpectedLayer = Beat.Id.StartsWith(TEXT("resolution-")) ? Beat.Id.RightChop(11) : FString();
        FTransform CameraTarget;
        const bool bCameraTargetValid = ResolveCameraTarget(Beat, Signals, PositionSite, CameraTarget);
        const FString ExpectedCameraMotion = bCameraTargetValid
            ? CameraMotionBetween(bHasPreviousCameraTarget ? &PreviousCameraTarget : nullptr, CameraTarget) : FString();
        if (StableIndex >= StableBeatIds.Num() || BeatIds.Contains(Beat.Id) || Beat.Layer != ExpectedLayer || Beat.Label.IsEmpty()
            || Beat.Detail.IsEmpty() || (!bSignalFocus && !bSiteFocus) || Beat.FocusId.IsEmpty()
            || !bCameraTargetValid || Beat.CameraMotion != ExpectedCameraMotion
            || !FMath::IsFinite(Beat.FieldOfViewDegrees)
            || !FMath::IsNearlyEqual(Beat.FieldOfViewDegrees, FieldOfViewForBeat(Beat.Id), .001f)
            || Beat.FieldOfViewDegrees < 40.f || Beat.FieldOfViewDegrees > 58.f
            || !FMath::IsFinite(Beat.TransitionSeconds) || !FMath::IsFinite(Beat.HoldSeconds)
            || Beat.TransitionSeconds < .20f || Beat.TransitionSeconds > .60f
            || Beat.HoldSeconds < .12f || Beat.HoldSeconds > .50f
            || (bSignalFocus && !FShiCommandSignalModel::Find(Signals, Beat.FocusId))
            || (bSiteFocus && Beat.FocusId != PositionSite->Id))
        {
            OutError = FString::Printf(TEXT("Cinematic beat %s cannot be represented safely."), *Beat.Id);
            return false;
        }
        BeatIds.Add(Beat.Id);
        PreviousCameraTarget = CameraTarget;
        bHasPreviousCameraTarget = true;
        ++StableIndex;
    }
    if (Beats[0].Id != TEXT("resolution-order") || Beats.Last().Id != TEXT("resolution-position")
        || !BeatIds.Contains(TEXT("resolution-pressure")) || !BeatIds.Contains(TEXT("resolution-pursuit"))
        || !BeatIds.Contains(TEXT("resolution-method-read")) || !BeatIds.Contains(TEXT("resolution-field"))
        || TotalDuration(Beats) > MaximumSequenceSeconds)
    {
        OutError = TEXT("Cinematic consequence order, required layers, or five-second ceiling is invalid.");
        return false;
    }
    OutError.Empty();
    return true;
}

float FShiCinematicBeatModel::TotalDuration(const TArray<FShiCinematicBeatData>& Beats)
{
    float Total = 0.f;
    for (const FShiCinematicBeatData& Beat : Beats) Total += Beat.TransitionSeconds + Beat.HoldSeconds;
    return Total;
}
