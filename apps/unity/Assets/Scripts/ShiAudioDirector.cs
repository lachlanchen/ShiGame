using System;
using System.Collections;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;

namespace SHI
{
    [Serializable]
    public sealed class ShiAudioContract
    {
        [JsonProperty("schemaVersion")] public int SchemaVersion = 1;
        [JsonProperty("id")] public string Id = "";
        [JsonProperty("title")] public string Title = "";
        [JsonProperty("synthesis")] public string Synthesis = "";
        [JsonProperty("mix")] public ShiAudioMix Mix = new();
        [JsonProperty("envelope")] public ShiAudioEnvelope Envelope = new();
        [JsonProperty("ambience")] public ShiAmbienceContract Ambience = new();
        [JsonProperty("cues")] public Dictionary<string, List<ShiToneContract>> Cues = new();
        [JsonProperty("quality")] public ShiAudioQuality Quality = new();
    }

    [Serializable]
    public sealed class ShiAudioEnvelope
    {
        [JsonProperty("attackMs")] public float AttackMs = 12;
        [JsonProperty("releaseMs")] public float ReleaseMs = 25;
        [JsonProperty("curve")] public string Curve = "linear";
    }

    [Serializable]
    public sealed class ShiAudioMix
    {
        [JsonProperty("defaults")] public ShiAudioMixValues Defaults = new();
        [JsonProperty("caps")] public ShiAudioMixValues Caps = new();
        [JsonProperty("fadeSeconds")] public float FadeSeconds = .8f;
    }

    [Serializable]
    public sealed class ShiAudioMixValues
    {
        [JsonProperty("enabled")] public bool Enabled;
        [JsonProperty("master")] public float Master = .7f;
        [JsonProperty("ambience")] public float Ambience = .28f;
        [JsonProperty("effects")] public float Effects = .62f;
    }

    [Serializable]
    public sealed class ShiAmbienceContract
    {
        [JsonProperty("id")] public string Id = "daze-rain";
        [JsonProperty("seed")] public uint Seed = 1;
        [JsonProperty("sampleRate")] public int SampleRate = 24000;
        [JsonProperty("loopSeconds")] public int LoopSeconds = 8;
        [JsonProperty("highpassHz")] public float HighpassHz = 180;
        [JsonProperty("lowpassHz")] public float LowpassHz = 4200;
        [JsonProperty("gain")] public float Gain = .24f;
    }

    [Serializable]
    public sealed class ShiToneContract
    {
        [JsonProperty("offsetMs")] public int OffsetMs;
        [JsonProperty("frequencyHz")] public float FrequencyHz;
        [JsonProperty("endFrequencyHz")] public float EndFrequencyHz;
        [JsonProperty("durationMs")] public int DurationMs;
        [JsonProperty("gain")] public float Gain;
        [JsonProperty("wave")] public string Wave = "sine";
    }

    [Serializable]
    public sealed class ShiAudioQuality
    {
        [JsonProperty("reference")] public ShiAudioReference Reference = new();
        [JsonProperty("browserCapture")] public ShiAudioBrowserCapture BrowserCapture = new();
        [JsonProperty("limits")] public ShiAudioQualityLimits Limits = new();
    }

    [Serializable]
    public sealed class ShiAudioReference
    {
        [JsonProperty("sampleRate")] public int SampleRate = 48000;
        [JsonProperty("seconds")] public float Seconds = 18;
        [JsonProperty("cueSchedule")] public List<ShiScheduledCue> CueSchedule = new();
    }

    [Serializable]
    public sealed class ShiScheduledCue
    {
        [JsonProperty("cue")] public string Cue = "";
        [JsonProperty("atSeconds")] public float AtSeconds;
    }

    [Serializable]
    public sealed class ShiAudioBrowserCapture
    {
        [JsonProperty("sampleRate")] public int SampleRate = 48000;
        [JsonProperty("preConsentSeconds")] public float PreConsentSeconds = 2;
        [JsonProperty("activeSeconds")] public float ActiveSeconds = 16;
    }

    [Serializable]
    public sealed class ShiAudioQualityLimits
    {
        [JsonProperty("samplePeakDbfsMax")] public float SamplePeakDbfsMax = -12;
        [JsonProperty("truePeakDbtpMax")] public float TruePeakDbtpMax = -10;
        [JsonProperty("integratedLufsMin")] public float IntegratedLufsMin = -45;
        [JsonProperty("integratedLufsMax")] public float IntegratedLufsMax = -24;
        [JsonProperty("cuePeakDbfsMin")] public float CuePeakDbfsMin = -42;
        [JsonProperty("dcOffsetAbsoluteMax")] public float DcOffsetAbsoluteMax = .001f;
        [JsonProperty("rawAmbienceDcOffsetAbsoluteMax")] public float RawAmbienceDcOffsetAbsoluteMax = .001f;
        [JsonProperty("loopBoundaryJumpRatioMax")] public float LoopBoundaryJumpRatioMax = .8f;
        [JsonProperty("stereoDifferenceRmsMax")] public float StereoDifferenceRmsMax = .000001f;
    }

    public sealed class ShiAudioDirector : MonoBehaviour
    {
        private const string EnabledKey = "shi.audio.v1.enabled";
        private const string AmbienceKey = "shi.audio.v1.ambience";
        private const string EffectsKey = "shi.audio.v1.effects";
        private ShiAudioContract? contract;
        private AudioSource? ambienceSource;
        private AudioSource? effectsSource;
        private AudioClip? ambienceClip;
        private readonly Dictionary<string, AudioClip> cueClips = new();
        private Coroutine? mixFade;
        private Coroutine? ambienceStop;
        private bool ambienceActive;

        public bool Enabled { get; private set; }
        public float Ambience { get; private set; }
        public float Effects { get; private set; }
        public float AmbienceCap => contract?.Mix.Caps.Ambience ?? .5f;
        public float EffectsCap => contract?.Mix.Caps.Effects ?? .8f;
        public bool Ready => contract != null && ambienceSource != null && effectsSource != null;

        public void Initialize(ShiAudioContract audioContract)
        {
            if (Ready) return;
            if (audioContract.SchemaVersion != 1) throw new InvalidOperationException($"Unsupported audio schema {audioContract.SchemaVersion}");
            contract = audioContract;
            Enabled = PlayerPrefs.GetInt(EnabledKey, audioContract.Mix.Defaults.Enabled ? 1 : 0) == 1;
            Ambience = Mathf.Clamp(PlayerPrefs.GetFloat(AmbienceKey, audioContract.Mix.Defaults.Ambience), 0, audioContract.Mix.Caps.Ambience);
            Effects = Mathf.Clamp(PlayerPrefs.GetFloat(EffectsKey, audioContract.Mix.Defaults.Effects), 0, audioContract.Mix.Caps.Effects);

            var ambienceObject = new GameObject("SHI Ambience Bus");
            ambienceObject.transform.SetParent(transform, false);
            ambienceSource = ambienceObject.AddComponent<AudioSource>();
            ambienceSource.playOnAwake = false;
            ambienceSource.loop = true;
            ambienceSource.spatialBlend = 0;
            var highpass = ambienceObject.AddComponent<AudioHighPassFilter>();
            highpass.cutoffFrequency = audioContract.Ambience.HighpassHz;
            var lowpass = ambienceObject.AddComponent<AudioLowPassFilter>();
            lowpass.cutoffFrequency = audioContract.Ambience.LowpassHz;

            var effectsObject = new GameObject("SHI Effects Bus");
            effectsObject.transform.SetParent(transform, false);
            effectsSource = effectsObject.AddComponent<AudioSource>();
            effectsSource.playOnAwake = false;
            effectsSource.loop = false;
            effectsSource.spatialBlend = 0;

            ambienceClip = BuildRain(audioContract.Ambience);
            ambienceSource.clip = ambienceClip;
            ApplyMix(true);
        }

        public void SetEnabled(bool enabled)
        {
            Enabled = enabled;
            PlayerPrefs.SetInt(EnabledKey, enabled ? 1 : 0);
            PlayerPrefs.Save();
            if (enabled && ambienceActive)
            {
                CancelAmbienceStop();
                StartAmbience();
            }
            ApplyMix(false);
            if (!enabled) QueueAmbienceStop();
        }

        public void SetAmbience(float value)
        {
            Ambience = Mathf.Clamp(value, 0, AmbienceCap);
            PlayerPrefs.SetFloat(AmbienceKey, Ambience);
            PlayerPrefs.Save();
            ApplyMix(false);
        }

        public void SetEffects(float value)
        {
            Effects = Mathf.Clamp(value, 0, EffectsCap);
            PlayerPrefs.SetFloat(EffectsKey, Effects);
            PlayerPrefs.Save();
            ApplyMix(false);
        }

        public void SetAmbienceActive(bool active)
        {
            ambienceActive = active;
            if (active && Enabled)
            {
                CancelAmbienceStop();
                StartAmbience();
            }
            ApplyMix(false);
            if (!active) QueueAmbienceStop();
        }

        public void PlayCue(string cue)
        {
            if (!Enabled || contract == null || effectsSource == null || !contract.Cues.ContainsKey(cue)) return;
            if (!cueClips.TryGetValue(cue, out var clip))
            {
                clip = BuildCue(cue, contract.Cues[cue], contract.Envelope, contract.Ambience.SampleRate);
                cueClips.Add(cue, clip);
            }
            effectsSource.PlayOneShot(clip);
        }

        private void ApplyMix(bool immediate)
        {
            if (contract == null) return;
            var master = Enabled ? contract.Mix.Defaults.Master : 0;
            var ambienceTarget = ambienceActive ? master * Ambience * contract.Ambience.Gain : 0;
            var effectsTarget = master * Effects;
            if (mixFade != null) StopCoroutine(mixFade);
            mixFade = null;
            if (immediate)
            {
                if (ambienceSource != null) ambienceSource.volume = ambienceTarget;
                if (effectsSource != null) effectsSource.volume = effectsTarget;
                return;
            }
            mixFade = StartCoroutine(FadeMix(ambienceTarget, effectsTarget, contract.Mix.FadeSeconds));
        }

        private IEnumerator FadeMix(float ambienceTarget, float effectsTarget, float seconds)
        {
            var startAmbience = ambienceSource?.volume ?? 0;
            var startEffects = effectsSource?.volume ?? 0;
            var duration = Mathf.Max(.01f, seconds);
            var elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                var progress = Mathf.Clamp01(elapsed / duration);
                if (ambienceSource != null) ambienceSource.volume = Mathf.Lerp(startAmbience, ambienceTarget, progress);
                if (effectsSource != null) effectsSource.volume = Mathf.Lerp(startEffects, effectsTarget, progress);
                yield return null;
            }
            if (ambienceSource != null) ambienceSource.volume = ambienceTarget;
            if (effectsSource != null) effectsSource.volume = effectsTarget;
            mixFade = null;
        }

        private void StartAmbience()
        {
            if (ambienceSource != null && ambienceClip != null && !ambienceSource.isPlaying) ambienceSource.Play();
        }

        private void StopAmbience()
        {
            if (ambienceSource != null && ambienceSource.isPlaying) ambienceSource.Stop();
        }

        private void QueueAmbienceStop()
        {
            CancelAmbienceStop();
            if (ambienceSource != null && ambienceSource.isPlaying) ambienceStop = StartCoroutine(StopAmbienceAfterFade());
        }

        private IEnumerator StopAmbienceAfterFade()
        {
            yield return new WaitForSecondsRealtime(Mathf.Max(.01f, contract?.Mix.FadeSeconds ?? .01f));
            StopAmbience();
            ambienceStop = null;
        }

        private void CancelAmbienceStop()
        {
            if (ambienceStop == null) return;
            StopCoroutine(ambienceStop);
            ambienceStop = null;
        }

        private static AudioClip BuildRain(ShiAmbienceContract settings)
        {
            var length = settings.SampleRate * settings.LoopSeconds;
            var samples = CreateRainSamples(length, settings.Seed);
            var clip = AudioClip.Create($"SHI {settings.Id}", length, 1, settings.SampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        public static float[] CreateRainSamples(int length, uint seed)
        {
            var sampleCount = Mathf.Max(1, length);
            var samples = new float[sampleCount];
            var state = seed == 0 ? 1u : seed;
            var slow = 0f;
            double sum = 0;
            unchecked
            {
                for (var index = 0; index < samples.Length; index++)
                {
                    state ^= state << 13;
                    state ^= state >> 17;
                    state ^= state << 5;
                    var white = state / (float)uint.MaxValue * 2f - 1f;
                    slow = slow * .985f + white * .015f;
                    var grain = (state & 0x7ff) < 3 ? white * .22f : 0;
                    samples[index] = Mathf.Clamp(white * .42f + slow * .82f + grain, -1, 1);
                    sum += samples[index];
                }
            }
            var mean = (float)(sum / samples.Length);
            for (var index = 0; index < samples.Length; index++) samples[index] = Mathf.Clamp(samples[index] - mean, -1, 1);
            return samples;
        }

        private static AudioClip BuildCue(string cue, IReadOnlyList<ShiToneContract> tones, ShiAudioEnvelope envelope, int sampleRate)
        {
            var samples = CreateCueSamples(tones, envelope, sampleRate);
            var clip = AudioClip.Create($"SHI cue {cue}", samples.Length, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        public static float[] CreateCueSamples(IReadOnlyList<ShiToneContract> tones, ShiAudioEnvelope envelope, int sampleRate)
        {
            var durationMs = 0;
            foreach (var tone in tones) durationMs = Mathf.Max(durationMs, tone.OffsetMs + tone.DurationMs);
            var samples = new float[Mathf.CeilToInt((durationMs + envelope.ReleaseMs) / 1000f * sampleRate)];
            var attackSamples = Mathf.Max(1, envelope.AttackMs / 1000f * sampleRate);
            var releaseSamples = Mathf.Max(1, envelope.ReleaseMs / 1000f * sampleRate);
            foreach (var tone in tones)
            {
                var start = Mathf.RoundToInt(tone.OffsetMs / 1000f * sampleRate);
                var count = Mathf.Max(1, Mathf.RoundToInt(tone.DurationMs / 1000f * sampleRate));
                var phase = 0f;
                for (var index = 0; index < count && start + index < samples.Length; index++)
                {
                    var progress = index / (float)Mathf.Max(1, count - 1);
                    var frequency = tone.FrequencyHz * Mathf.Pow(tone.EndFrequencyHz / tone.FrequencyHz, progress);
                    phase += 2 * Mathf.PI * frequency / sampleRate;
                    var wave = tone.Wave == "triangle" ? 2 / Mathf.PI * Mathf.Asin(Mathf.Sin(phase)) : Mathf.Sin(phase);
                    var attack = Mathf.Clamp01(index / attackSamples);
                    var release = Mathf.Clamp01((count - index - 1) / releaseSamples);
                    samples[start + index] = Mathf.Clamp(samples[start + index] + wave * tone.Gain * Mathf.Min(attack, release), -1, 1);
                }
            }
            return samples;
        }

        private void OnDestroy()
        {
            if (ambienceClip != null) Destroy(ambienceClip);
            foreach (var clip in cueClips.Values) if (clip != null) Destroy(clip);
            cueClips.Clear();
        }
    }
}
