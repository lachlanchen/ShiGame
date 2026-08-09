#include "ShiEngagementSignalModel.h"

#include "ShiEngagementModel.h"

namespace
{
    constexpr float TableSurfaceZ = 14.f;
    constexpr float SignalHalfWidth = 210.f;
    constexpr float SignalHalfDepth = 110.f;
    constexpr float MinimumPointerSpacing = 64.f;

    float HeightScale(const int32 Value)
    {
        return .10f + FMath::Clamp(Value, 0, 100) * .0035f;
    }

    FShiEngagementSignalData MakeSignal(const FString& MetricId, const int32 Value, const int32 Index)
    {
        static const TArray<FString> Labels = {
            TEXT("CROSSING"), TEXT("REAR"), TEXT("RESERVE"), TEXT("SUPPLIES"), TEXT("PURSUIT"), TEXT("SIGNALS")
        };
        static const TArray<FString> MeshPaths = {
            TEXT("/Engine/BasicShapes/Cone.Cone"), TEXT("/Engine/BasicShapes/Cylinder.Cylinder"),
            TEXT("/Engine/BasicShapes/Sphere.Sphere"), TEXT("/Engine/BasicShapes/Cube.Cube"),
            TEXT("/Engine/BasicShapes/Cone.Cone"), TEXT("/Engine/BasicShapes/Sphere.Sphere")
        };
        static const TArray<FLinearColor> Colors = {
            FLinearColor(.18f, .52f, .66f), FLinearColor(.72f, .36f, .12f), FLinearColor(.54f, .42f, .16f),
            FLinearColor(.34f, .48f, .24f), FLinearColor(.66f, .10f, .08f), FLinearColor(.38f, .30f, .62f)
        };
        FShiEngagementSignalData Signal;
        Signal.MetricId = MetricId;
        Signal.Label = Labels[Index];
        Signal.Value = Value;
        Signal.MeshPath = MeshPaths[Index];
        Signal.Location.X = -150.f + (Index % 3) * 150.f;
        Signal.Location.Y = Index < 3 ? -72.f : 72.f;
        Signal.Scale = FVector(.22f, .22f, HeightScale(Value));
        if (MetricId == TEXT("supplyLoads"))
        {
            Signal.Scale.X = .24f;
            Signal.Scale.Y = .20f;
        }
        Signal.Location.Z = TableSurfaceZ + Signal.Scale.Z * 50.f;
        Signal.Color = Colors[Index];
        Signal.StencilValue = 21 + Index;
        return Signal;
    }
}

bool FShiEngagementSignalModel::Build(const TMap<FString, int32>& Metrics,
    TArray<FShiEngagementSignalData>& OutSignals, FString& OutError)
{
    TArray<FShiEngagementSignalData> Candidate;
    for (int32 Index = 0; Index < FShiEngagementModel::MetricKeys().Num(); ++Index)
    {
        const FString& MetricId = FShiEngagementModel::MetricKeys()[Index];
        const int32* Value = Metrics.Find(MetricId);
        if (!Value || *Value < 0 || *Value > 100)
        {
            OutError = FString::Printf(TEXT("Engagement signal input %s is missing or outside 0-100."), *MetricId);
            return false;
        }
        Candidate.Add(MakeSignal(MetricId, *Value, Index));
    }
    if (!Validate(Candidate, OutError)) return false;
    OutSignals = MoveTemp(Candidate);
    return true;
}

bool FShiEngagementSignalModel::Validate(const TArray<FShiEngagementSignalData>& Signals, FString& OutError)
{
    if (Signals.Num() != FShiEngagementModel::MetricKeys().Num())
    {
        OutError = TEXT("The engagement command space requires exactly six live metric signals.");
        return false;
    }
    TSet<FString> Ids;
    TSet<int32> Stencils;
    TArray<FVector> Positions;
    for (int32 Index = 0; Index < Signals.Num(); ++Index)
    {
        const FShiEngagementSignalData& Signal = Signals[Index];
        const float BaseZ = Signal.Location.Z - Signal.Scale.Z * 50.f;
        if (Signal.MetricId != FShiEngagementModel::MetricKeys()[Index] || Ids.Contains(Signal.MetricId)
            || Signal.Label.IsEmpty() || Signal.Value < 0 || Signal.Value > 100
            || !Signal.MeshPath.StartsWith(TEXT("/Engine/BasicShapes/")) || Signal.Scale.GetMin() <= 0.f
            || !FMath::IsFinite(Signal.Location.X) || !FMath::IsFinite(Signal.Location.Y) || !FMath::IsFinite(Signal.Location.Z)
            || FMath::Abs(Signal.Location.X) > SignalHalfWidth || FMath::Abs(Signal.Location.Y) > SignalHalfDepth
            || !FMath::IsNearlyEqual(BaseZ, TableSurfaceZ, .01f)
            || !FMath::IsNearlyEqual(Signal.Scale.Z, HeightScale(Signal.Value), .0001f)
            || Signal.StencilValue != 21 + Index || Stencils.Contains(Signal.StencilValue))
        {
            OutError = FString::Printf(TEXT("Engagement signal %s cannot be represented safely."), *Signal.MetricId);
            return false;
        }
        for (const FVector& Existing : Positions)
        {
            if (FVector::Dist2D(Existing, Signal.Location) < MinimumPointerSpacing)
            {
                OutError = FString::Printf(TEXT("Engagement signal %s overlaps another pointer target."), *Signal.MetricId);
                return false;
            }
        }
        Ids.Add(Signal.MetricId);
        Stencils.Add(Signal.StencilValue);
        Positions.Add(Signal.Location);
    }
    OutError.Empty();
    return true;
}

FTransform FShiEngagementSignalModel::CameraTransform()
{
    // Keep the six-piece formation centered in the unobstructed right-hand stage,
    // rather than geometrically centered behind the left Slate command surface.
    const FVector Target(150.f, 140.f, 40.f);
    const FVector Location(610.f, -370.f, 360.f);
    return FTransform((Target - Location).Rotation(), Location);
}
