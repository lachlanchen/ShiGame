#pragma once

#include "CoreMinimal.h"
#include "Components/SynthComponent.h"
#include "ShiAudioModel.h"
#include "ShiSoundscapeComponent.generated.h"

struct FShiSoundscapeControlState;

UCLASS(ClassGroup=(Audio), Meta=(BlueprintSpawnableComponent))
class SHI_API UShiSoundscapeComponent : public USynthComponent
{
    GENERATED_BODY()

public:
    UShiSoundscapeComponent(const FObjectInitializer& ObjectInitializer);

    bool LoadCanonical(FString& OutError);
    void SetSoundEnabled(bool bEnabled);
    bool ResumePreferredFromGesture();
    void SetAmbienceActive(bool bActive);
    void SetAmbienceLevel(float Value);
    void SetEffectsLevel(float Value);
    void PlayCue(FName Cue);

    bool IsContractReady() const { return bContractReady; }
    bool IsSoundEnabled() const { return bSoundEnabled; }
    bool IsSoundPreferred() const { return bPreferredEnabled; }
    float GetAmbienceLevel() const { return AmbienceLevel; }
    float GetEffectsLevel() const { return EffectsLevel; }
    float GetAmbienceCap() const { return Contract.Mix.AmbienceCap; }
    float GetEffectsCap() const { return Contract.Mix.EffectsCap; }
    int32 GetContractSampleRate() const { return Contract.Ambience.SampleRate; }
    const FString& GetContractId() const { return Contract.Id; }

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

protected:
    virtual bool Init(int32& SampleRate) override;
    virtual ISoundGeneratorPtr CreateSoundGenerator(const FSoundGeneratorInitParams& InParams) override;

private:
    FShiAudioModel Contract;
    TSharedPtr<FShiSoundscapeControlState, ESPMode::ThreadSafe> ControlState;
    bool bContractReady = false;
    bool bSoundEnabled = false;
    bool bPreferredEnabled = false;
    bool bAmbienceActive = false;
    float AmbienceLevel = 0.f;
    float EffectsLevel = 0.f;
    float StopCountdown = -1.f;

    void LoadPreferences();
    void SavePreferences() const;
    void PushControlState();
};
