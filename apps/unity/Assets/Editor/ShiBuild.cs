using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using Newtonsoft.Json;

namespace SHI.Editor
{
    /// <summary>
    /// Reproducible preflight and player-build entry points for menus and batch mode.
    /// Keep these methods argument-free so Unity can invoke them with -executeMethod.
    /// </summary>
    public static class ShiBuild
    {
        private const string CampaignFile = "chapter-01-daze.json";
        private const string AudioFile = "chapter-01-audio.json";
        private const string BootScene = "Assets/Scenes/Boot.unity";
        private static readonly string[] BaselineLocales = { "en", "zh-Hans" };
        private static readonly string[] ResourceKeys = { "grain", "trust", "momentum", "people", "danger" };
        private static readonly string[] ClaimStatuses = { "received-account", "later-compilation", "strategic-text", "dramatic-reconstruction" };
        private static readonly string[] ClaimKinds = { "chronology", "event", "institution", "person", "geography", "strategic-lens", "reconstruction" };
        private static readonly string[] ClaimReviewStatuses = { "evidence-located", "specialist-review-required", "authored-reconstruction" };
        private static readonly string[] ClaimConfidences = { "high", "medium", "low", "not-applicable" };
        private static readonly string[] RightsStatuses = { "public-link-metadata-only", "project-original" };
        private static readonly string[] SiteStatuses = { "known", "reported", "reference" };
        private static readonly string[] PressureKinds = { "state", "terrain", "supply", "network" };

        [MenuItem("SHI/Validate Production Content")]
        public static void Preflight()
        {
            var campaign = ReadCampaign();
            var errors = Validate(campaign).ToList();
            var audio = ReadAudio();
            errors.AddRange(Validate(audio));
            if (errors.Count > 0)
                throw new InvalidOperationException("SHI preflight failed:\n- " + string.Join("\n- ", errors));

            Debug.Log($"SHI preflight passed: {campaign.Nodes.Count} nodes, " +
                      $"{campaign.Nodes.Sum(node => node.Choices.Count)} choices, " +
                      $"{campaign.Nodes.Sum(node => node.Conditions.Count)} field conditions, " +
                      $"{campaign.Opposition.Stages.Count} opponent postures, " +
                      $"{campaign.Sources.Count} sources, {campaign.Claims.Count} claim records, " +
                      $"{audio.Cues.Count} procedural audio cues.");
        }

        [MenuItem("SHI/Build/Linux Player")]
        public static void BuildLinux()
        {
            Build(BuildTargetGroup.Standalone, BuildTarget.StandaloneLinux64, Path.Combine(BuildRoot(), "linux", "shi"));
        }

        [MenuItem("SHI/Build/Web Player")]
        public static void BuildWeb()
        {
            Build(BuildTargetGroup.WebGL, BuildTarget.WebGL, Path.Combine(BuildRoot(), "web"));
        }

        public static IReadOnlyList<string> Validate(ShiCampaign campaign)
        {
            var errors = new List<string>();
            var nodeIds = campaign.Nodes.Select(node => node.Id).ToHashSet();
            var siteIds = campaign.Sites.Select(site => site.Id).ToHashSet();
            var characterIds = campaign.Characters.Select(character => character.Id).ToHashSet();
            var sourceIds = campaign.Sources.Select(source => source.Id).ToHashSet();
            var claimIds = campaign.Claims.Select(claim => claim.Id).ToHashSet();
            var choiceIds = new HashSet<string>();
            var referencedClaimIds = new HashSet<string>();

            if (campaign.SchemaVersion != 4) errors.Add($"Campaign schema must be 4; found {campaign.SchemaVersion}.");
            if (!Regex.IsMatch(campaign.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add("Campaign id must use ASCII kebab-case.");

            RequireUnique(campaign.Nodes.Select(node => node.Id), "node", errors);
            RequireUnique(campaign.Sites.Select(site => site.Id), "site", errors);
            RequireUnique(campaign.Characters.Select(character => character.Id), "character", errors);
            RequireUnique(campaign.Sources.Select(source => source.Id), "source", errors);
            RequireUnique(campaign.Claims.Select(claim => claim.Id), "claim", errors);
            RequireUnique(campaign.Nodes.SelectMany(node => node.Conditions).Select(condition => condition.Id), "field condition", errors);

            if (!nodeIds.Contains(campaign.StartNodeId)) errors.Add($"Start node '{campaign.StartNodeId}' does not exist.");
            foreach (var key in ResourceKeys)
            {
                if (!campaign.InitialResources.ContainsKey(key)) errors.Add($"Initial resource '{key}' is missing.");
            }
            foreach (var resource in campaign.InitialResources)
            {
                if (!ResourceKeys.Contains(resource.Key)) errors.Add($"Unknown initial resource '{resource.Key}'.");
                if (resource.Value < 0 || resource.Value > 100) errors.Add($"Initial resource '{resource.Key}' is outside 0–100.");
            }

            if (!Regex.IsMatch(campaign.Opposition.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add("Opposition id must use ASCII kebab-case.");
            if (campaign.Opposition.ClaimStatus != "dramatic-reconstruction") errors.Add("Opposition must be classified as dramatic-reconstruction.");
            RequireText(campaign.Opposition.Title, "opposition title", errors);
            RequireText(campaign.Opposition.Description, "opposition description", errors);
            if (campaign.Opposition.Stages.Count < 2) errors.Add("Opposition requires at least two postures.");
            RequireUnique(campaign.Opposition.Stages.Select(stage => stage.Id), "opposition stage", errors);
            var dangerCoverage = new int[100];
            foreach (var stage in campaign.Opposition.Stages)
            {
                if (!Regex.IsMatch(stage.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Opposition stage '{stage.Id}' must use an ASCII kebab-case id.");
                if (stage.MinDanger < 0 || stage.MinDanger > 99 || stage.MaxDanger < 0 || stage.MaxDanger > 99 || stage.MinDanger > stage.MaxDanger)
                    errors.Add($"Opposition stage '{stage.Id}' has an invalid Exposure range.");
                RequireText(stage.Title, $"opposition stage '{stage.Id}' title", errors);
                RequireText(stage.Forecast, $"opposition stage '{stage.Id}' forecast", errors);
                RequireText(stage.Response, $"opposition stage '{stage.Id}' response", errors);
                RequireText(stage.Counterplay, $"opposition stage '{stage.Id}' counterplay", errors);
                ValidateEffects(stage.Effects, $"Opposition stage '{stage.Id}'", errors);
                foreach (var effect in stage.Effects)
                {
                    if (effect.Value < -4 || effect.Value > 4) errors.Add($"Opposition stage '{stage.Id}' effect '{effect.Key}' is outside -4–4.");
                    if (effect.Key == "danger" ? effect.Value < 0 : effect.Value > 0) errors.Add($"Opposition stage '{stage.Id}' effect '{effect.Key}' benefits the player.");
                }
                for (var danger = Math.Max(0, stage.MinDanger); danger <= Math.Min(99, stage.MaxDanger); danger++) dangerCoverage[danger]++;
            }
            for (var danger = 0; danger <= 99; danger++)
                if (dangerCoverage[danger] != 1) errors.Add($"Opposition stages must cover Exposure {danger} exactly once.");

            RequireText(campaign.Title, "campaign title", errors);
            RequireText(campaign.Subtitle, "campaign subtitle", errors);
            foreach (var source in campaign.Sources)
            {
                if (!Regex.IsMatch(source.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Source '{source.Id}' must use an ASCII kebab-case id.");
                if (string.IsNullOrWhiteSpace(source.EditionId)) errors.Add($"Source '{source.Id}' has no edition id.");
                if (string.IsNullOrWhiteSpace(source.Work)) errors.Add($"Source '{source.Id}' has no work title.");
                if (string.IsNullOrWhiteSpace(source.Section)) errors.Add($"Source '{source.Id}' has no locator.");
                if (string.IsNullOrWhiteSpace(source.Locator)) errors.Add($"Source '{source.Id}' has no exact locator.");
                if (!ClaimStatuses.Contains(source.ClaimStatus)) errors.Add($"Source '{source.Id}' has invalid classification '{source.ClaimStatus}'.");
                if (!RightsStatuses.Contains(source.RightsStatus)) errors.Add($"Source '{source.Id}' has invalid rights status '{source.RightsStatus}'.");
                if (source.RightsStatus == "public-link-metadata-only" && (!Uri.TryCreate(source.Url, UriKind.Absolute, out var sourceUrl) || sourceUrl.Scheme != Uri.UriSchemeHttps))
                    errors.Add($"Public source '{source.Id}' requires an HTTPS URL.");
                if (source.RightsStatus == "project-original" && !string.IsNullOrWhiteSpace(source.Url)) errors.Add($"Project source '{source.Id}' must not claim a public URL.");
                RequireText(source.Note, $"source '{source.Id}' note", errors);
            }
            foreach (var claim in campaign.Claims)
            {
                if (!Regex.IsMatch(claim.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Claim '{claim.Id}' must use an ASCII kebab-case id.");
                if (!ClaimKinds.Contains(claim.Kind)) errors.Add($"Claim '{claim.Id}' has invalid kind '{claim.Kind}'.");
                if (!ClaimReviewStatuses.Contains(claim.ReviewStatus)) errors.Add($"Claim '{claim.Id}' has invalid review status '{claim.ReviewStatus}'.");
                if (!ClaimConfidences.Contains(claim.Confidence)) errors.Add($"Claim '{claim.Id}' has invalid confidence '{claim.Confidence}'.");
                if (claim.SourceRefs.Count == 0) errors.Add($"Claim '{claim.Id}' requires at least one source.");
                foreach (var sourceRef in claim.SourceRefs.Where(sourceRef => !sourceIds.Contains(sourceRef))) errors.Add($"Claim '{claim.Id}' references unknown source '{sourceRef}'.");
                if (string.IsNullOrWhiteSpace(claim.Reviewer)) errors.Add($"Claim '{claim.Id}' requires a reviewer or pending review role.");
                RequireText(claim.Statement, $"claim '{claim.Id}' statement", errors);
                RequireText(claim.Uncertainty, $"claim '{claim.Id}' uncertainty", errors);
                RequireText(claim.GameUse, $"claim '{claim.Id}' game use", errors);
                if (claim.Kind == "reconstruction")
                {
                    if (claim.ReviewStatus != "authored-reconstruction") errors.Add($"Reconstruction claim '{claim.Id}' must be explicitly authored.");
                    if (claim.Confidence != "not-applicable") errors.Add($"Reconstruction claim '{claim.Id}' must use not-applicable confidence.");
                }
                else
                {
                    if (claim.ReviewStatus == "authored-reconstruction") errors.Add($"Historical claim '{claim.Id}' cannot be classified as authored reconstruction.");
                    if (claim.Confidence == "not-applicable") errors.Add($"Historical claim '{claim.Id}' requires a confidence assessment.");
                }
            }
            foreach (var site in campaign.Sites)
            {
                if (!Regex.IsMatch(site.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Site '{site.Id}' must use an ASCII kebab-case id.");
                if (!SiteStatuses.Contains(site.Status)) errors.Add($"Site '{site.Id}' has invalid intelligence status '{site.Status}'.");
                if (site.X < 0 || site.X > 100 || site.Z < 0 || site.Z > 80) errors.Add($"Site '{site.Id}' is outside the schematic coordinate bounds.");
                RequireText(site.Name, $"site '{site.Id}' name", errors);
                RequireText(site.Summary, $"site '{site.Id}' summary", errors);
                RequireText(site.Uncertainty, $"site '{site.Id}' uncertainty", errors);
                if (site.SourceRefs.Count == 0) errors.Add($"Site '{site.Id}' must cite at least one source record.");
                if (site.ClaimRefs.Count == 0) errors.Add($"Site '{site.Id}' must expose at least one claim record.");
                foreach (var sourceRef in site.SourceRefs.Where(sourceRef => !sourceIds.Contains(sourceRef))) errors.Add($"Site '{site.Id}' references unknown source '{sourceRef}'.");
                foreach (var claimRef in site.ClaimRefs)
                {
                    if (!claimIds.Contains(claimRef))
                    {
                        errors.Add($"Site '{site.Id}' references unknown claim '{claimRef}'.");
                        continue;
                    }
                    var claim = campaign.Claims.First(candidate => candidate.Id == claimRef);
                    foreach (var sourceRef in claim.SourceRefs.Where(sourceRef => !site.SourceRefs.Contains(sourceRef)))
                        errors.Add($"Site '{site.Id}' claim '{claimRef}' requires missing source '{sourceRef}'.");
                }
            }

            foreach (var node in campaign.Nodes)
            {
                if (!Regex.IsMatch(node.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Node '{node.Id}' must use an ASCII kebab-case id.");
                if (!siteIds.Contains(node.SiteId)) errors.Add($"Node '{node.Id}' references unknown site '{node.SiteId}'.");
                if (!characterIds.Contains(node.SpeakerId)) errors.Add($"Node '{node.Id}' references unknown speaker '{node.SpeakerId}'.");
                if (node.Choices.Count < 2) errors.Add($"Node '{node.Id}' must offer at least two decisions.");
                if (node.Conditions.Count < 2) errors.Add($"Node '{node.Id}' must define at least two field conditions.");
                RequireText(node.DateLabel, $"node '{node.Id}' date", errors);
                RequireText(node.Title, $"node '{node.Id}' title", errors);
                RequireText(node.Context, $"node '{node.Id}' context", errors);
                RequireText(node.Dialogue, $"node '{node.Id}' dialogue", errors);

                foreach (var sourceRef in node.SourceRefs)
                {
                    if (!sourceIds.Contains(sourceRef)) errors.Add($"Node '{node.Id}' references unknown source '{sourceRef}'.");
                }
                if (node.SourceRefs.Count == 0) errors.Add($"Node '{node.Id}' must cite at least one source record.");
                if (node.ClaimRefs.Count == 0) errors.Add($"Node '{node.Id}' must expose at least one claim record.");
                foreach (var claimRef in node.ClaimRefs)
                {
                    if (!claimIds.Contains(claimRef))
                    {
                        errors.Add($"Node '{node.Id}' references unknown claim '{claimRef}'.");
                        continue;
                    }
                    referencedClaimIds.Add(claimRef);
                    var claim = campaign.Claims.First(candidate => candidate.Id == claimRef);
                    foreach (var sourceRef in claim.SourceRefs.Where(sourceRef => !node.SourceRefs.Contains(sourceRef)))
                        errors.Add($"Node '{node.Id}' claim '{claimRef}' requires missing source '{sourceRef}'.");
                }

                foreach (var condition in node.Conditions)
                {
                    if (!Regex.IsMatch(condition.Id, "^[a-z0-9]+(?:-[a-z0-9]+)*$")) errors.Add($"Field condition '{condition.Id}' must use an ASCII kebab-case id.");
                    if (condition.ClaimStatus != "dramatic-reconstruction") errors.Add($"Field condition '{condition.Id}' must be classified as dramatic-reconstruction.");
                    RequireText(condition.Title, $"field condition '{condition.Id}' title", errors);
                    RequireText(condition.Signal, $"field condition '{condition.Id}' signal", errors);
                    if (condition.Weight < 1 || condition.Weight > 100) errors.Add($"Field condition '{condition.Id}' weight is outside 1–100.");
                    if (condition.Effects.Count == 0 || condition.Effects.Values.All(value => value == 0)) errors.Add($"Field condition '{condition.Id}' must change the position.");
                    ValidateEffects(condition.Effects, $"Field condition '{condition.Id}'", errors);
                    foreach (var effect in condition.Effects.Where(effect => effect.Value < -6 || effect.Value > 6))
                        errors.Add($"Field condition '{condition.Id}' effect '{effect.Key}' is outside the Chapter I cap of -6–6.");
                }

                foreach (var choice in node.Choices)
                {
                    if (!choiceIds.Add(choice.Id)) errors.Add($"Duplicate choice id '{choice.Id}'.");
                    if (!string.IsNullOrEmpty(choice.NextNodeId) && !nodeIds.Contains(choice.NextNodeId!))
                        errors.Add($"Choice '{choice.Id}' references unknown next node '{choice.NextNodeId}'.");
                    ValidateEffects(choice.Effects, $"Choice '{choice.Id}'", errors);
                    if (!string.IsNullOrEmpty(choice.NextNodeId) && choice.Pressure == null)
                        errors.Add($"Nonterminal choice '{choice.Id}' requires a pressure response.");
                    if (string.IsNullOrEmpty(choice.NextNodeId) && choice.Pressure != null)
                        errors.Add($"Terminal choice '{choice.Id}' must not add unresolved pressure.");
                    if (choice.Pressure != null)
                    {
                        if (!PressureKinds.Contains(choice.Pressure.Kind))
                            errors.Add($"Choice '{choice.Id}' has invalid pressure kind '{choice.Pressure.Kind}'.");
                        RequireText(choice.Pressure.Warning, $"choice '{choice.Id}' pressure warning", errors);
                        RequireText(choice.Pressure.Reveal, $"choice '{choice.Id}' pressure reveal", errors);
                        if (choice.Pressure.Effects.Count == 0) errors.Add($"Choice '{choice.Id}' pressure has no effects.");
                        ValidateEffects(choice.Pressure.Effects, $"Choice '{choice.Id}' pressure", errors);
                    }
                    ValidateRequirements(choice, errors);
                    RequireText(choice.Label, $"choice '{choice.Id}' label", errors);
                    RequireText(choice.Intent, $"choice '{choice.Id}' intent", errors);
                    RequireText(choice.Consequence, $"choice '{choice.Id}' consequence", errors);
                    RequireText(choice.Strategy, $"choice '{choice.Id}' strategy", errors);
                }
            }

            foreach (var unreferenced in claimIds.Except(referencedClaimIds)) errors.Add($"Claim '{unreferenced}' is not exposed by a playable node.");

            var reachable = ReachableNodes(campaign);
            foreach (var unreachable in nodeIds.Except(reachable)) errors.Add($"Node '{unreachable}' is unreachable.");
            var endingCount = campaign.Nodes.SelectMany(node => node.Choices).Count(choice => string.IsNullOrEmpty(choice.NextNodeId));
            if (endingCount < 3) errors.Add($"Campaign needs at least three endings; found {endingCount}.");
            if (HasCycle(campaign, campaign.StartNodeId, new HashSet<string>(), new HashSet<string>()))
                errors.Add("Campaign graph contains a cycle.");

            return errors;
        }

        public static IReadOnlyList<string> Validate(ShiAudioContract audio)
        {
            var errors = new List<string>();
            var cues = new[] { "select", "inspect", "drawer", "close", "commit", "ending", "failure" };
            if (audio.SchemaVersion != 1) errors.Add($"Audio schema must be 1; found {audio.SchemaVersion}.");
            if (audio.Id != "chapter-01-daze-audio") errors.Add($"Unexpected audio contract id '{audio.Id}'.");
            if (string.IsNullOrWhiteSpace(audio.Title)) errors.Add("Audio title is missing.");
            if (audio.Synthesis != "project-original-procedural") errors.Add($"Unsupported audio synthesis '{audio.Synthesis}'.");
            if (audio.Mix.Defaults.Enabled) errors.Add("Audio must remain opt-in.");
            foreach (var bus in new[]
            {
                ("master", audio.Mix.Defaults.Master, audio.Mix.Caps.Master),
                ("ambience", audio.Mix.Defaults.Ambience, audio.Mix.Caps.Ambience),
                ("effects", audio.Mix.Defaults.Effects, audio.Mix.Caps.Effects),
            })
            {
                if (bus.Item2 < 0 || bus.Item2 > bus.Item3 || bus.Item3 > 1) errors.Add($"Audio {bus.Item1} default/cap is unsafe.");
            }
            if (audio.Mix.FadeSeconds < .05f || audio.Mix.FadeSeconds > 3) errors.Add("Audio fade is outside 0.05–3 seconds.");
            if (audio.Envelope.AttackMs < 1 || audio.Envelope.AttackMs > 50 || audio.Envelope.ReleaseMs < 1 || audio.Envelope.ReleaseMs > 100 || audio.Envelope.Curve != "linear") errors.Add("Audio envelope must use the bounded linear contract.");
            if (audio.Ambience.Seed == 0) errors.Add("Audio ambience seed must be nonzero.");
            if (audio.Ambience.SampleRate < 16000 || audio.Ambience.SampleRate > 48000) errors.Add("Audio sample rate is outside 16000–48000.");
            if (audio.Ambience.LoopSeconds < 2 || audio.Ambience.LoopSeconds > 30) errors.Add("Audio loop is outside 2–30 seconds.");
            if (audio.Ambience.HighpassHz < 20 || audio.Ambience.HighpassHz > 1000 || audio.Ambience.LowpassHz < 1000 || audio.Ambience.LowpassHz > 12000 || audio.Ambience.HighpassHz >= audio.Ambience.LowpassHz) errors.Add("Audio filter band is unsafe.");
            if (audio.Ambience.Gain < 0 || audio.Ambience.Gain > .5f) errors.Add("Audio ambience gain is unsafe.");
            if (!audio.Cues.Keys.OrderBy(value => value).SequenceEqual(cues.OrderBy(value => value))) errors.Add("Audio cue set drifted from version 1.");
            foreach (var cue in audio.Cues)
            {
                if (cue.Value.Count < 1 || cue.Value.Count > 4) errors.Add($"Audio cue '{cue.Key}' must contain 1–4 tones.");
                foreach (var tone in cue.Value)
                {
                    if (tone.OffsetMs < 0 || tone.OffsetMs > 1000 || tone.DurationMs < 20 || tone.DurationMs > 1000) errors.Add($"Audio cue '{cue.Key}' timing is unsafe.");
                    if (tone.FrequencyHz < 80 || tone.FrequencyHz > 1600 || tone.EndFrequencyHz < 80 || tone.EndFrequencyHz > 1600) errors.Add($"Audio cue '{cue.Key}' frequency is unsafe.");
                    if (tone.Gain < .001f || tone.Gain > .15f) errors.Add($"Audio cue '{cue.Key}' gain is unsafe.");
                    if (tone.Wave != "sine" && tone.Wave != "triangle") errors.Add($"Audio cue '{cue.Key}' waveform is unsupported.");
                }
            }
            if (audio.Quality.Reference.SampleRate < 44100 || audio.Quality.Reference.SampleRate > 96000 || audio.Quality.Reference.Seconds < 10 || audio.Quality.Reference.Seconds > 60) errors.Add("Audio reference programme dimensions are unsafe.");
            if (!audio.Quality.Reference.CueSchedule.Select(item => item.Cue).OrderBy(value => value).SequenceEqual(cues.OrderBy(value => value))) errors.Add("Audio reference schedule must contain every cue exactly once.");
            foreach (var item in audio.Quality.Reference.CueSchedule)
            {
                if (item.AtSeconds < 0 || item.AtSeconds > audio.Quality.Reference.Seconds) errors.Add($"Audio reference cue '{item.Cue}' is outside the programme.");
            }
            var browserCapture = audio.Quality.BrowserCapture;
            if (browserCapture.SampleRate < 44100 || browserCapture.SampleRate > 96000 || browserCapture.PreConsentSeconds < 1 || browserCapture.PreConsentSeconds > 10 || browserCapture.ActiveSeconds < 14 || browserCapture.ActiveSeconds > 60) errors.Add("Audio visible-browser capture dimensions are unsafe.");
            var limits = audio.Quality.Limits;
            if (limits.SamplePeakDbfsMax < -30 || limits.SamplePeakDbfsMax > -1 || limits.TruePeakDbtpMax < -30 || limits.TruePeakDbtpMax > -1) errors.Add("Audio peak limits are unsafe.");
            if (limits.IntegratedLufsMin < -60 || limits.IntegratedLufsMax > -10 || limits.IntegratedLufsMin >= limits.IntegratedLufsMax) errors.Add("Audio loudness window is invalid.");
            if (limits.CuePeakDbfsMin < -60 || limits.CuePeakDbfsMin > -10 || limits.DcOffsetAbsoluteMax < 0 || limits.DcOffsetAbsoluteMax > .01f || limits.RawAmbienceDcOffsetAbsoluteMax < 0 || limits.RawAmbienceDcOffsetAbsoluteMax > .01f || limits.LoopBoundaryJumpRatioMax < 0 || limits.LoopBoundaryJumpRatioMax > 2 || limits.StereoDifferenceRmsMax < 0 || limits.StereoDifferenceRmsMax > .01f) errors.Add("Audio engineering limits are invalid.");
            var rain = ShiAudioDirector.CreateRainSamples(audio.Ambience.SampleRate * audio.Ambience.LoopSeconds, audio.Ambience.Seed);
            var dcOffset = Math.Abs(rain.Average(sample => (double)sample));
            var jumps = Enumerable.Range(1, rain.Length - 1).Select(index => Math.Abs(rain[index] - rain[index - 1])).OrderBy(value => value).ToArray();
            var boundaryJumpRatio = Math.Abs(rain[^1] - rain[0]) / jumps[(int)Math.Floor(jumps.Length * .99)];
            if (dcOffset > limits.RawAmbienceDcOffsetAbsoluteMax) errors.Add($"Audio raw ambience DC offset {dcOffset:F8} exceeds its limit.");
            if (boundaryJumpRatio > limits.LoopBoundaryJumpRatioMax) errors.Add($"Audio loop boundary ratio {boundaryJumpRatio:F4} exceeds normal rain transients.");
            return errors;
        }

        private static ShiCampaign ReadCampaign()
        {
            var path = Path.Combine(Application.streamingAssetsPath, CampaignFile);
            if (!File.Exists(path)) throw new FileNotFoundException("Run npm run sync:content before opening Unity.", path);
            return ShiCampaign.Parse(File.ReadAllText(path));
        }

        private static ShiAudioContract ReadAudio()
        {
            var path = Path.Combine(Application.streamingAssetsPath, AudioFile);
            if (!File.Exists(path)) throw new FileNotFoundException("Run npm run sync:content before opening Unity.", path);
            return JsonConvert.DeserializeObject<ShiAudioContract>(File.ReadAllText(path))
                   ?? throw new InvalidDataException("Audio contract did not deserialize.");
        }

        private static void Build(BuildTargetGroup group, BuildTarget target, string location)
        {
            Preflight();
            if (!BuildPipeline.IsBuildTargetSupported(group, target))
                throw new InvalidOperationException($"Unity module for {target} is not installed.");

            var parent = target == BuildTarget.WebGL ? location : Path.GetDirectoryName(location)!;
            Directory.CreateDirectory(parent);
            if (!EditorUserBuildSettings.SwitchActiveBuildTarget(group, target))
                throw new InvalidOperationException($"Could not switch active build target to {target}.");

            var scenes = EditorBuildSettings.scenes
                .Where(scene => scene.enabled)
                .Select(scene => scene.path)
                .ToArray();
            if (!scenes.Contains(BootScene)) throw new InvalidOperationException($"Build settings must include {BootScene}.");

            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = location,
                target = target,
                options = BuildOptions.StrictMode,
            });
            if (report.summary.result != BuildResult.Succeeded)
                throw new InvalidOperationException($"{target} build failed: {report.summary.totalErrors} errors.");

            var receipt = Path.Combine(BuildRoot(), $"receipt-{target}.txt");
            File.WriteAllLines(receipt, new[]
            {
                $"product={Application.productName}",
                $"unity={Application.unityVersion}",
                $"target={target}",
                $"output={location}",
                $"bytes={report.summary.totalSize}",
                $"duration={report.summary.totalTime}",
                $"completedUtc={DateTime.UtcNow:O}",
            });
            Debug.Log($"SHI {target} build passed: {report.summary.totalSize} bytes at {location}");
        }

        private static string BuildRoot()
        {
            var configured = Environment.GetEnvironmentVariable("SHI_BUILD_ROOT");
            return string.IsNullOrWhiteSpace(configured)
                ? Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Builds"))
                : Path.GetFullPath(configured);
        }

        private static void RequireUnique(IEnumerable<string> values, string kind, ICollection<string> errors)
        {
            foreach (var duplicate in values.GroupBy(value => value).Where(group => group.Count() > 1))
                errors.Add($"Duplicate {kind} id '{duplicate.Key}'.");
        }

        private static void RequireText(Newtonsoft.Json.Linq.JObject localized, string field, ICollection<string> errors)
        {
            foreach (var locale in BaselineLocales)
            {
                if (string.IsNullOrWhiteSpace(localized.Value<string>(locale))) errors.Add($"{field} is missing locale '{locale}'.");
            }
        }

        private static void ValidateRequirements(ShiChoice choice, ICollection<string> errors)
        {
            if (choice.Requirements == null) return;
            foreach (var requirement in choice.Requirements.Min.Concat(choice.Requirements.Max))
            {
                if (!ResourceKeys.Contains(requirement.Key)) errors.Add($"Choice '{choice.Id}' requires unknown resource '{requirement.Key}'.");
                if (requirement.Value < 0 || requirement.Value > 100) errors.Add($"Choice '{choice.Id}' requirement '{requirement.Key}' is outside 0–100.");
            }
        }

        private static void ValidateEffects(IReadOnlyDictionary<string, int> effects, string label, ICollection<string> errors)
        {
            foreach (var effect in effects)
            {
                if (!ResourceKeys.Contains(effect.Key)) errors.Add($"{label} changes unknown resource '{effect.Key}'.");
                if (effect.Value < -100 || effect.Value > 100) errors.Add($"{label} effect '{effect.Key}' is outside -100–100.");
            }
        }

        private static bool HasCycle(ShiCampaign campaign, string id, ISet<string> visiting, ISet<string> visited)
        {
            if (visiting.Contains(id)) return true;
            if (visited.Contains(id)) return false;
            visiting.Add(id);
            var node = campaign.Nodes.FirstOrDefault(candidate => candidate.Id == id);
            if (node != null)
            {
                foreach (var next in node.Choices.Select(choice => choice.NextNodeId).Where(next => !string.IsNullOrEmpty(next)))
                {
                    if (HasCycle(campaign, next!, visiting, visited)) return true;
                }
            }
            visiting.Remove(id);
            visited.Add(id);
            return false;
        }

        private static HashSet<string> ReachableNodes(ShiCampaign campaign)
        {
            var reachable = new HashSet<string>();
            var pending = new Queue<string>();
            pending.Enqueue(campaign.StartNodeId);
            while (pending.Count > 0)
            {
                var id = pending.Dequeue();
                if (!reachable.Add(id)) continue;
                var node = campaign.Nodes.FirstOrDefault(candidate => candidate.Id == id);
                if (node == null) continue;
                foreach (var next in node.Choices.Select(choice => choice.NextNodeId).Where(next => !string.IsNullOrEmpty(next)))
                    pending.Enqueue(next!);
            }
            return reachable;
        }
    }
}
