#include "ShiSoundscapeComponent.h"

#include "Containers/Queue.h"
#include "Misc/ConfigCacheIni.h"
#include "Sound/SoundGenerator.h"

#include <atomic>

namespace
{
    const TCHAR* AudioSettingsSection = TEXT("/Script/SHI.ShiSoundscape");

    struct FShiLinearFader
    {
        float Current = 0.f;
        float Target = 0.f;
        float Step = 0.f;
        int32 RemainingFrames = 0;

        void SetTarget(float NewTarget, int32 FadeFrames)
        {
            if (FMath::IsNearlyEqual(Target, NewTarget)) return;
            Target = NewTarget;
            RemainingFrames = FMath::Max(1, FadeFrames);
            Step = (Target - Current) / RemainingFrames;
        }

        float Advance()
        {
            if (RemainingFrames > 0)
            {
                Current += Step;
                --RemainingFrames;
                if (RemainingFrames == 0) Current = Target;
            }
            return Current;
        }
    };
}

struct FShiSoundscapeControlState
{
    std::atomic<bool> bEnabled;
    std::atomic<bool> bAmbienceActive;
    std::atomic<float> Master;
    std::atomic<float> Ambience;
    std::atomic<float> Effects;
    TQueue<FName, EQueueMode::Mpsc> PendingCues;

    FShiSoundscapeControlState()
        : bEnabled(false), bAmbienceActive(false), Master(0.f), Ambience(0.f), Effects(0.f)
    {
    }
};

namespace
{
    class FShiSoundGenerator final : public ISoundGenerator
    {
    public:
        FShiSoundGenerator(const FShiAudioModel& InContract, const TSharedRef<FShiSoundscapeControlState, ESPMode::ThreadSafe>& InControl, float InOutputSampleRate)
            : Contract(InContract), Control(InControl), OutputSampleRate(FMath::Max(8000.f, InOutputSampleRate))
        {
            ActiveCues.Reserve(8);
            CueSamples.Reserve(Contract.Cues.Num());
            RainSamples = FShiAudioModel::CreateRainSamples(Contract.Ambience.SampleRate * Contract.Ambience.LoopSeconds, Contract.Ambience.Seed);
            RainIncrement = Contract.Ambience.SampleRate / static_cast<double>(OutputSampleRate);
            const float Dt = 1.f / OutputSampleRate;
            const float HighpassRc = 1.f / (2.f * PI * Contract.Ambience.HighpassHz);
            const float LowpassRc = 1.f / (2.f * PI * Contract.Ambience.LowpassHz);
            HighpassAlpha = HighpassRc / (HighpassRc + Dt);
            LowpassAlpha = Dt / (LowpassRc + Dt);
            for (const TPair<FName, TArray<FShiToneData>>& Cue : Contract.Cues)
                CueSamples.Add(Cue.Key, FShiAudioModel::CreateCueSamples(Cue.Value, Contract.Envelope, FMath::RoundToInt(OutputSampleRate)));
        }

        virtual int32 OnGenerateAudio(float* OutAudio, int32 NumSamples) override
        {
            if (!OutAudio || NumSamples <= 0) return 0;
            FName PendingCue;
            while (Control->PendingCues.Dequeue(PendingCue))
            {
                if (!CueSamples.Contains(PendingCue)) continue;
                if (ActiveCues.Num() >= 8) ActiveCues.RemoveAt(0, 1, EAllowShrinking::No);
                ActiveCues.Add({PendingCue, 0});
            }

            const bool bEnabled = Control->bEnabled.load(std::memory_order_acquire);
            const int32 FadeFrames = FMath::Max(1, FMath::RoundToInt(Contract.Mix.FadeSeconds * OutputSampleRate));
            MasterFader.SetTarget(bEnabled ? Control->Master.load(std::memory_order_acquire) : 0.f, FadeFrames);
            AmbienceFader.SetTarget(bEnabled && Control->bAmbienceActive.load(std::memory_order_acquire)
                ? Control->Ambience.load(std::memory_order_acquire) * Contract.Ambience.Gain : 0.f, FadeFrames);
            EffectsFader.SetTarget(bEnabled ? Control->Effects.load(std::memory_order_acquire) : 0.f, FadeFrames);

            const int32 NumFrames = NumSamples / 2;
            for (int32 Frame = 0; Frame < NumFrames; ++Frame)
            {
                const int32 LeftIndex = FMath::FloorToInt(RainPosition) % RainSamples.Num();
                const int32 RightIndex = (LeftIndex + 1) % RainSamples.Num();
                const float Fraction = static_cast<float>(RainPosition - FMath::FloorToDouble(RainPosition));
                const float RawRain = FMath::Lerp(RainSamples[LeftIndex], RainSamples[RightIndex], Fraction);
                RainPosition += RainIncrement;
                while (RainPosition >= RainSamples.Num()) RainPosition -= RainSamples.Num();

                const float Highpassed = HighpassAlpha * (PreviousHighpassed + RawRain - PreviousRain);
                PreviousRain = RawRain;
                PreviousHighpassed = Highpassed;
                Lowpassed += LowpassAlpha * (Highpassed - Lowpassed);

                float CueValue = 0.f;
                for (int32 CueIndex = ActiveCues.Num() - 1; CueIndex >= 0; --CueIndex)
                {
                    FActiveCue& Active = ActiveCues[CueIndex];
                    const TArray<float>* Samples = CueSamples.Find(Active.Name);
                    if (!Samples || !Samples->IsValidIndex(Active.SampleIndex))
                    {
                        ActiveCues.RemoveAtSwap(CueIndex, 1, EAllowShrinking::No);
                        continue;
                    }
                    CueValue += (*Samples)[Active.SampleIndex++];
                    if (Active.SampleIndex >= Samples->Num()) ActiveCues.RemoveAtSwap(CueIndex, 1, EAllowShrinking::No);
                }

                const float Master = MasterFader.Advance();
                const float Sample = FMath::Clamp((Lowpassed * AmbienceFader.Advance() + CueValue * EffectsFader.Advance()) * Master, -1.f, 1.f);
                OutAudio[Frame * 2] = Sample;
                OutAudio[Frame * 2 + 1] = Sample;
            }
            if ((NumSamples & 1) != 0) OutAudio[NumSamples - 1] = 0.f;
            return NumSamples;
        }

        virtual int32 GetNumChannels() const override { return 2; }
        virtual bool IsFinished() const override { return false; }

    private:
        struct FActiveCue
        {
            FName Name;
            int32 SampleIndex = 0;
        };

        FShiAudioModel Contract;
        TSharedRef<FShiSoundscapeControlState, ESPMode::ThreadSafe> Control;
        float OutputSampleRate = 48000.f;
        TArray<float> RainSamples;
        TMap<FName, TArray<float>> CueSamples;
        TArray<FActiveCue> ActiveCues;
        double RainPosition = 0.0;
        double RainIncrement = 1.0;
        float HighpassAlpha = 0.f;
        float LowpassAlpha = 0.f;
        float PreviousRain = 0.f;
        float PreviousHighpassed = 0.f;
        float Lowpassed = 0.f;
        FShiLinearFader MasterFader;
        FShiLinearFader AmbienceFader;
        FShiLinearFader EffectsFader;
    };
}

UShiSoundscapeComponent::UShiSoundscapeComponent(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    bAutoActivate = false;
    bStopWhenOwnerDestroyed = true;
    bIsUISound = true;
    PrimaryComponentTick.bCanEverTick = true;
    PrimaryComponentTick.bStartWithTickEnabled = false;
}

bool UShiSoundscapeComponent::LoadCanonical(FString& OutError)
{
    if (!Contract.LoadCanonical(OutError)) return false;
    ControlState = MakeShared<FShiSoundscapeControlState, ESPMode::ThreadSafe>();
    bContractReady = true;
    LoadPreferences();
    PushControlState();
    return true;
}

bool UShiSoundscapeComponent::Init(int32& SampleRate)
{
    if (!bContractReady || !ControlState.IsValid()) return false;
    SampleRate = Contract.Ambience.SampleRate;
    NumChannels = 2;
    return true;
}

ISoundGeneratorPtr UShiSoundscapeComponent::CreateSoundGenerator(const FSoundGeneratorInitParams& InParams)
{
    if (!bContractReady || !ControlState.IsValid()) return nullptr;
    return MakeShared<FShiSoundGenerator, ESPMode::ThreadSafe>(Contract, ControlState.ToSharedRef(), InParams.SampleRate);
}

void UShiSoundscapeComponent::SetSoundEnabled(bool bEnabled)
{
    if (!bContractReady || (bSoundEnabled == bEnabled && bPreferredEnabled == bEnabled)) return;
    bSoundEnabled = bEnabled;
    bPreferredEnabled = bEnabled;
    StopCountdown = -1.f;
    PushControlState();
    SavePreferences();
    if (bEnabled)
    {
        SetComponentTickEnabled(false);
        if (!IsPlaying()) Start();
    }
    else
    {
        StopCountdown = Contract.Mix.FadeSeconds;
        SetComponentTickEnabled(true);
    }
}

bool UShiSoundscapeComponent::ResumePreferredFromGesture()
{
    if (!bContractReady || !bPreferredEnabled || bSoundEnabled) return false;
    bSoundEnabled = true;
    StopCountdown = -1.f;
    PushControlState();
    SetComponentTickEnabled(false);
    if (!IsPlaying()) Start();
    return true;
}

void UShiSoundscapeComponent::SetAmbienceActive(bool bActive)
{
    bAmbienceActive = bActive;
    PushControlState();
}

void UShiSoundscapeComponent::SetAmbienceLevel(float Value)
{
    if (!bContractReady) return;
    AmbienceLevel = FMath::Clamp(Value, 0.f, Contract.Mix.AmbienceCap);
    PushControlState();
    SavePreferences();
}

void UShiSoundscapeComponent::SetEffectsLevel(float Value)
{
    if (!bContractReady) return;
    EffectsLevel = FMath::Clamp(Value, 0.f, Contract.Mix.EffectsCap);
    PushControlState();
    SavePreferences();
}

void UShiSoundscapeComponent::PlayCue(FName Cue)
{
    if (bContractReady && bSoundEnabled && Contract.Cues.Contains(Cue) && ControlState.IsValid())
        ControlState->PendingCues.Enqueue(Cue);
}

void UShiSoundscapeComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    if (StopCountdown < 0.f) return;
    StopCountdown -= DeltaTime;
    if (StopCountdown <= 0.f)
    {
        Stop();
        StopCountdown = -1.f;
        SetComponentTickEnabled(false);
    }
}

void UShiSoundscapeComponent::LoadPreferences()
{
    bPreferredEnabled = Contract.Mix.bDefaultEnabled;
    bSoundEnabled = false;
    AmbienceLevel = Contract.Mix.DefaultAmbience;
    EffectsLevel = Contract.Mix.DefaultEffects;
    if (GConfig)
    {
        GConfig->GetBool(AudioSettingsSection, TEXT("Enabled"), bPreferredEnabled, GGameUserSettingsIni);
        GConfig->GetFloat(AudioSettingsSection, TEXT("Ambience"), AmbienceLevel, GGameUserSettingsIni);
        GConfig->GetFloat(AudioSettingsSection, TEXT("Effects"), EffectsLevel, GGameUserSettingsIni);
    }
    AmbienceLevel = FMath::Clamp(AmbienceLevel, 0.f, Contract.Mix.AmbienceCap);
    EffectsLevel = FMath::Clamp(EffectsLevel, 0.f, Contract.Mix.EffectsCap);
}

void UShiSoundscapeComponent::SavePreferences() const
{
    if (!GConfig) return;
    GConfig->SetBool(AudioSettingsSection, TEXT("Enabled"), bPreferredEnabled, GGameUserSettingsIni);
    GConfig->SetFloat(AudioSettingsSection, TEXT("Ambience"), AmbienceLevel, GGameUserSettingsIni);
    GConfig->SetFloat(AudioSettingsSection, TEXT("Effects"), EffectsLevel, GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);
}

void UShiSoundscapeComponent::PushControlState()
{
    if (!ControlState.IsValid()) return;
    ControlState->bEnabled.store(bSoundEnabled, std::memory_order_release);
    ControlState->bAmbienceActive.store(bAmbienceActive, std::memory_order_release);
    ControlState->Master.store(FMath::Clamp(Contract.Mix.DefaultMaster, 0.f, Contract.Mix.MasterCap), std::memory_order_release);
    ControlState->Ambience.store(AmbienceLevel, std::memory_order_release);
    ControlState->Effects.store(EffectsLevel, std::memory_order_release);
}
