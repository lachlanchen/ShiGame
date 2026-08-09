#pragma once

#include "CoreMinimal.h"

struct FShiAudioMixData
{
    bool bDefaultEnabled = false;
    float DefaultMaster = 0.f;
    float DefaultAmbience = 0.f;
    float DefaultEffects = 0.f;
    float MasterCap = 0.f;
    float AmbienceCap = 0.f;
    float EffectsCap = 0.f;
    float FadeSeconds = 0.f;
};

struct FShiAudioEnvelopeData
{
    float AttackMs = 0.f;
    float ReleaseMs = 0.f;
    FName Curve;
};

struct FShiAmbienceData
{
    FString Id;
    uint32 Seed = 0;
    int32 SampleRate = 0;
    int32 LoopSeconds = 0;
    float HighpassHz = 0.f;
    float LowpassHz = 0.f;
    float Gain = 0.f;
};

struct FShiToneData
{
    int32 OffsetMs = 0;
    float FrequencyHz = 0.f;
    float EndFrequencyHz = 0.f;
    int32 DurationMs = 0;
    float Gain = 0.f;
    FName Wave;
};

class FShiAudioModel
{
public:
    int32 SchemaVersion = 0;
    FString Id;
    FString Synthesis;
    FShiAudioMixData Mix;
    FShiAudioEnvelopeData Envelope;
    FShiAmbienceData Ambience;
    TMap<FName, TArray<FShiToneData>> Cues;

    bool LoadCanonical(FString& OutError);
    bool Validate(FString& OutError) const;
    static TArray<float> CreateRainSamples(int32 Length, uint32 Seed);
    static TArray<float> CreateCueSamples(const TArray<FShiToneData>& Tones, const FShiAudioEnvelopeData& Envelope, int32 SampleRate);
};
