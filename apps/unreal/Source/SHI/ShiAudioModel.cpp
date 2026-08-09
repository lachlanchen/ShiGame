#include "ShiAudioModel.h"

#include "Dom/JsonObject.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
    bool ReadObject(const TSharedPtr<FJsonObject>& Parent, const FString& Field, TSharedPtr<FJsonObject>& OutObject)
    {
        const TSharedPtr<FJsonObject>* Value = nullptr;
        if (!Parent.IsValid() || !Parent->TryGetObjectField(Field, Value) || !Value || !Value->IsValid()) return false;
        OutObject = *Value;
        return true;
    }

    bool ReadFloat(const TSharedPtr<FJsonObject>& Parent, const FString& Field, float& OutValue)
    {
        double Number = 0;
        if (!Parent.IsValid() || !Parent->TryGetNumberField(Field, Number) || !FMath::IsFinite(Number)) return false;
        OutValue = static_cast<float>(Number);
        return true;
    }

    bool ReadInteger(const TSharedPtr<FJsonObject>& Parent, const FString& Field, int32& OutValue)
    {
        double Number = 0;
        if (!Parent.IsValid() || !Parent->TryGetNumberField(Field, Number) || !FMath::IsFinite(Number)
            || Number != FMath::FloorToDouble(Number) || Number < static_cast<double>(MIN_int32) || Number > static_cast<double>(MAX_int32)) return false;
        OutValue = static_cast<int32>(Number);
        return true;
    }
}

bool FShiAudioModel::LoadCanonical(FString& OutError)
{
    OutError.Empty();
    SchemaVersion = 0;
    Id.Empty();
    Synthesis.Empty();
    Mix = FShiAudioMixData();
    Envelope = FShiAudioEnvelopeData();
    Ambience = FShiAmbienceData();
    Cues.Empty();

    const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("StreamingAssets/chapter-01-audio.json"));
    FString Json;
    if (!FFileHelper::LoadFileToString(Json, *Path))
    {
        OutError = FString::Printf(TEXT("Canonical audio contract missing: %s. Run npm run sync:content."), *Path);
        return false;
    }
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
    {
        OutError = TEXT("Canonical audio contract is not valid JSON.");
        return false;
    }

    TSharedPtr<FJsonObject> MixObject;
    TSharedPtr<FJsonObject> Defaults;
    TSharedPtr<FJsonObject> Caps;
    TSharedPtr<FJsonObject> EnvelopeObject;
    TSharedPtr<FJsonObject> AmbienceObject;
    TSharedPtr<FJsonObject> CuesObject;
    double SeedNumber = 0;
    FString EnvelopeCurve;
    if (!ReadInteger(Root, TEXT("schemaVersion"), SchemaVersion)
        || !Root->TryGetStringField(TEXT("id"), Id) || !Root->TryGetStringField(TEXT("synthesis"), Synthesis)
        || !ReadObject(Root, TEXT("mix"), MixObject) || !ReadObject(MixObject, TEXT("defaults"), Defaults)
        || !ReadObject(MixObject, TEXT("caps"), Caps) || !Defaults->TryGetBoolField(TEXT("enabled"), Mix.bDefaultEnabled)
        || !ReadFloat(Defaults, TEXT("master"), Mix.DefaultMaster) || !ReadFloat(Defaults, TEXT("ambience"), Mix.DefaultAmbience)
        || !ReadFloat(Defaults, TEXT("effects"), Mix.DefaultEffects) || !ReadFloat(Caps, TEXT("master"), Mix.MasterCap)
        || !ReadFloat(Caps, TEXT("ambience"), Mix.AmbienceCap) || !ReadFloat(Caps, TEXT("effects"), Mix.EffectsCap)
        || !ReadFloat(MixObject, TEXT("fadeSeconds"), Mix.FadeSeconds) || !ReadObject(Root, TEXT("envelope"), EnvelopeObject)
        || !ReadFloat(EnvelopeObject, TEXT("attackMs"), Envelope.AttackMs) || !ReadFloat(EnvelopeObject, TEXT("releaseMs"), Envelope.ReleaseMs)
        || !EnvelopeObject->TryGetStringField(TEXT("curve"), EnvelopeCurve)
        || !ReadObject(Root, TEXT("ambience"), AmbienceObject) || !AmbienceObject->TryGetStringField(TEXT("id"), Ambience.Id)
        || !AmbienceObject->TryGetNumberField(TEXT("seed"), SeedNumber) || !FMath::IsFinite(SeedNumber)
        || SeedNumber != FMath::FloorToDouble(SeedNumber) || SeedNumber < 0 || SeedNumber > static_cast<double>(MAX_uint32)
        || !ReadInteger(AmbienceObject, TEXT("sampleRate"), Ambience.SampleRate) || !ReadInteger(AmbienceObject, TEXT("loopSeconds"), Ambience.LoopSeconds)
        || !ReadFloat(AmbienceObject, TEXT("highpassHz"), Ambience.HighpassHz) || !ReadFloat(AmbienceObject, TEXT("lowpassHz"), Ambience.LowpassHz)
        || !ReadFloat(AmbienceObject, TEXT("gain"), Ambience.Gain) || !ReadObject(Root, TEXT("cues"), CuesObject))
    {
        OutError = TEXT("Canonical audio contract is missing a required typed field.");
        return false;
    }
    Ambience.Seed = static_cast<uint32>(SeedNumber);
    Envelope.Curve = FName(*EnvelopeCurve);

    for (const TPair<FString, TSharedPtr<FJsonValue>>& CuePair : CuesObject->Values)
    {
        const TArray<TSharedPtr<FJsonValue>>* ToneValues = nullptr;
        if (!CuePair.Value.IsValid() || !CuePair.Value->TryGetArray(ToneValues) || !ToneValues)
        {
            OutError = FString::Printf(TEXT("Audio cue %s is not an array."), *CuePair.Key);
            return false;
        }
        TArray<FShiToneData>& Tones = Cues.Add(FName(*CuePair.Key));
        for (const TSharedPtr<FJsonValue>& ToneValue : *ToneValues)
        {
            const TSharedPtr<FJsonObject>* TonePointer = nullptr;
            if (!ToneValue.IsValid() || !ToneValue->TryGetObject(TonePointer) || !TonePointer || !TonePointer->IsValid())
            {
                OutError = FString::Printf(TEXT("Audio cue %s contains a non-object tone."), *CuePair.Key);
                return false;
            }
            const TSharedPtr<FJsonObject> ToneObject = *TonePointer;
            FShiToneData& Tone = Tones.AddDefaulted_GetRef();
            FString Wave;
            if (!ReadInteger(ToneObject, TEXT("offsetMs"), Tone.OffsetMs) || !ReadFloat(ToneObject, TEXT("frequencyHz"), Tone.FrequencyHz)
                || !ReadFloat(ToneObject, TEXT("endFrequencyHz"), Tone.EndFrequencyHz) || !ReadInteger(ToneObject, TEXT("durationMs"), Tone.DurationMs)
                || !ReadFloat(ToneObject, TEXT("gain"), Tone.Gain) || !ToneObject->TryGetStringField(TEXT("wave"), Wave))
            {
                OutError = FString::Printf(TEXT("Audio cue %s has an incomplete tone."), *CuePair.Key);
                return false;
            }
            Tone.Wave = FName(*Wave);
        }
    }
    return Validate(OutError);
}

bool FShiAudioModel::Validate(FString& OutError) const
{
    static const TSet<FName> RequiredCues = {
        FName(TEXT("select")), FName(TEXT("inspect")), FName(TEXT("drawer")), FName(TEXT("close")),
        FName(TEXT("commit")), FName(TEXT("ending")), FName(TEXT("failure"))
    };
    if (SchemaVersion != 1 || Id != TEXT("chapter-01-daze-audio") || Synthesis != TEXT("project-original-procedural") || Mix.bDefaultEnabled)
    {
        OutError = TEXT("Unreal requires the reviewed opt-in procedural audio schema v1 contract.");
        return false;
    }
    if (Mix.DefaultMaster < 0.f || Mix.DefaultMaster > Mix.MasterCap || Mix.MasterCap > .8f
        || Mix.DefaultAmbience < 0.f || Mix.DefaultAmbience > Mix.AmbienceCap || Mix.AmbienceCap > .5f
        || Mix.DefaultEffects < 0.f || Mix.DefaultEffects > Mix.EffectsCap || Mix.EffectsCap > .8f
        || Mix.FadeSeconds < .05f || Mix.FadeSeconds > 3.f || Envelope.AttackMs < 1.f || Envelope.ReleaseMs < 1.f
        || Envelope.Curve != FName(TEXT("linear")))
    {
        OutError = TEXT("Audio mix, cap, fade, or envelope values are unsafe.");
        return false;
    }
    if (Ambience.Id != TEXT("daze-rain") || Ambience.SampleRate < 8000 || Ambience.SampleRate > 48000
        || Ambience.LoopSeconds < 2 || Ambience.LoopSeconds > 30 || Ambience.HighpassHz < 20.f
        || Ambience.LowpassHz > 12000.f || Ambience.HighpassHz >= Ambience.LowpassHz || Ambience.Gain < 0.f || Ambience.Gain > .5f)
    {
        OutError = TEXT("Audio ambience identity, rate, loop, filter band, or gain is unsafe.");
        return false;
    }
    TSet<FName> ActualCues;
    for (const TPair<FName, TArray<FShiToneData>>& Cue : Cues)
    {
        ActualCues.Add(Cue.Key);
        if (Cue.Value.IsEmpty() || Cue.Value.Num() > 4)
        {
            OutError = FString::Printf(TEXT("Audio cue %s has an invalid tone count."), *Cue.Key.ToString());
            return false;
        }
        for (const FShiToneData& Tone : Cue.Value)
        {
            if (Tone.OffsetMs < 0 || Tone.OffsetMs > 1000 || Tone.DurationMs < 20 || Tone.DurationMs > 1000
                || Tone.FrequencyHz < 80.f || Tone.FrequencyHz > 1600.f || Tone.EndFrequencyHz < 80.f || Tone.EndFrequencyHz > 1600.f
                || Tone.Gain < .001f || Tone.Gain > .15f || (Tone.Wave != FName(TEXT("sine")) && Tone.Wave != FName(TEXT("triangle"))))
            {
                OutError = FString::Printf(TEXT("Audio cue %s contains an unsafe tone."), *Cue.Key.ToString());
                return false;
            }
        }
    }
    bool bCueSetMatches = ActualCues.Num() == RequiredCues.Num();
    for (const FName Cue : RequiredCues) bCueSetMatches = bCueSetMatches && ActualCues.Contains(Cue);
    if (!bCueSetMatches)
    {
        OutError = TEXT("Audio cue identity set drifted from the seven reviewed semantic cues.");
        return false;
    }
    OutError.Empty();
    return true;
}

TArray<float> FShiAudioModel::CreateRainSamples(int32 Length, uint32 Seed)
{
    TArray<float> Samples;
    Samples.SetNumUninitialized(FMath::Max(1, Length));
    uint32 State = Seed == 0 ? 1u : Seed;
    float Slow = 0.f;
    double Sum = 0.0;
    for (float& Sample : Samples)
    {
        State ^= State << 13;
        State ^= State >> 17;
        State ^= State << 5;
        const float White = static_cast<float>(static_cast<double>(State) / static_cast<double>(MAX_uint32) * 2.0 - 1.0);
        Slow = Slow * .985f + White * .015f;
        const float Grain = (State & 0x7ffu) < 3u ? White * .22f : 0.f;
        Sample = FMath::Clamp(White * .42f + Slow * .82f + Grain, -1.f, 1.f);
        Sum += Sample;
    }
    const float Mean = static_cast<float>(Sum / Samples.Num());
    for (float& Sample : Samples) Sample = FMath::Clamp(Sample - Mean, -1.f, 1.f);
    return Samples;
}

TArray<float> FShiAudioModel::CreateCueSamples(const TArray<FShiToneData>& Tones, const FShiAudioEnvelopeData& InEnvelope, int32 SampleRate)
{
    int32 DurationMs = 0;
    for (const FShiToneData& Tone : Tones) DurationMs = FMath::Max(DurationMs, Tone.OffsetMs + Tone.DurationMs);
    TArray<float> Samples;
    Samples.Init(0.f, FMath::Max(1, FMath::CeilToInt((DurationMs + InEnvelope.ReleaseMs) / 1000.f * SampleRate)));
    const float AttackSamples = FMath::Max(1.f, InEnvelope.AttackMs / 1000.f * SampleRate);
    const float ReleaseSamples = FMath::Max(1.f, InEnvelope.ReleaseMs / 1000.f * SampleRate);
    for (const FShiToneData& Tone : Tones)
    {
        const int32 Start = FMath::RoundToInt(Tone.OffsetMs / 1000.f * SampleRate);
        const int32 Count = FMath::Max(1, FMath::RoundToInt(Tone.DurationMs / 1000.f * SampleRate));
        float Phase = 0.f;
        for (int32 Index = 0; Index < Count && Start + Index < Samples.Num(); ++Index)
        {
            const float Progress = Index / static_cast<float>(FMath::Max(1, Count - 1));
            const float Frequency = Tone.FrequencyHz * FMath::Pow(Tone.EndFrequencyHz / Tone.FrequencyHz, Progress);
            Phase += 2.f * PI * Frequency / SampleRate;
            const float Wave = Tone.Wave == FName(TEXT("triangle")) ? 2.f / PI * FMath::Asin(FMath::Sin(Phase)) : FMath::Sin(Phase);
            const float Attack = FMath::Clamp(Index / AttackSamples, 0.f, 1.f);
            const float Release = FMath::Clamp((Count - Index - 1) / ReleaseSamples, 0.f, 1.f);
            Samples[Start + Index] = FMath::Clamp(Samples[Start + Index] + Wave * Tone.Gain * FMath::Min(Attack, Release), -1.f, 1.f);
        }
    }
    return Samples;
}
