using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NUnit.Framework;
using UnityEngine;
using Newtonsoft.Json;

namespace SHI.Tests
{
    public sealed class ShiCampaignTests
    {
        [Test]
        public void ResolveClampsResourcesAndRecordsHistory()
        {
            var campaign = ShiCampaign.Parse("{\"schemaVersion\":4,\"id\":\"test\",\"title\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"subtitle\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"startNodeId\":\"start\",\"initialResources\":{\"grain\":95},\"opposition\":{\"id\":\"watch\",\"stages\":[{\"id\":\"watch\",\"minDanger\":0,\"maxDanger\":99,\"effects\":{}}]},\"sites\":[],\"characters\":[],\"sources\":[],\"claims\":[],\"nodes\":[{\"id\":\"start\",\"conditions\":[{\"id\":\"clear\",\"weight\":1,\"effects\":{\"grain\":0}}],\"choices\":[{\"id\":\"go\",\"effects\":{\"grain\":20},\"flags\":[\"done\"]}]}]}");
            var state = ShiState.Create(campaign);
            var node = campaign.Node("start");

            state.Resolve(campaign, node, node.Choices[0]);

            Assert.That(state.Resources["grain"], Is.EqualTo(100));
            Assert.That(state.History, Has.Count.EqualTo(1));
            Assert.That(state.Completed, Is.True);
        }

        [Test]
        public void ResolveAppliesPressureAfterThePlayerAction()
        {
            var campaign = ShiCampaign.Parse("{\"schemaVersion\":4,\"id\":\"test\",\"title\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"subtitle\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"startNodeId\":\"start\",\"initialResources\":{\"grain\":50,\"trust\":50,\"momentum\":50,\"people\":50,\"danger\":50},\"opposition\":{\"id\":\"watch\",\"stages\":[{\"id\":\"watch\",\"minDanger\":0,\"maxDanger\":99,\"effects\":{}}]},\"sites\":[],\"characters\":[],\"sources\":[],\"claims\":[],\"nodes\":[{\"id\":\"start\",\"conditions\":[{\"id\":\"clear\",\"weight\":1,\"effects\":{\"grain\":0}}],\"choices\":[{\"id\":\"go\",\"effects\":{\"grain\":80,\"danger\":-80},\"pressure\":{\"kind\":\"state\",\"warning\":{\"en\":\"Warning\",\"zh-Hans\":\"预兆\"},\"reveal\":{\"en\":\"Reply\",\"zh-Hans\":\"回应\"},\"effects\":{\"grain\":-10,\"danger\":25}}}]}]}" );
            var state = ShiState.Create(campaign);

            var result = state.Resolve(campaign, campaign.Node("start"), campaign.Node("start").Choices[0]);

            Assert.That(state.History[0].AfterChoice["grain"], Is.EqualTo(100));
            Assert.That(state.Resources["grain"], Is.EqualTo(90));
            Assert.That(state.Resources["danger"], Is.EqualTo(25));
            Assert.That(result.PressureDeltas["danger"], Is.EqualTo(25));
        }

        [Test]
        public void ReplayMigratesLegacyHistoryAndRejectsImpossibleRoutes()
        {
            var campaign = LoadProductionCampaign();
            var legacy = new ShiState
            {
                CampaignId = campaign.Id,
                CurrentNodeId = "tampered",
                Resources = new Dictionary<string, int> { ["grain"] = 0, ["trust"] = 0, ["momentum"] = 0, ["people"] = 0, ["danger"] = 100 },
                History = new List<ShiChoiceRecord> { new() { NodeId = "rain-order", ChoiceId = "read-the-names" } },
            };

            var replayed = ShiState.Replay(campaign, legacy);

            Assert.That(replayed, Is.Not.Null);
            Assert.That(replayed!.SaveVersion, Is.EqualTo(4));
            Assert.That(replayed.LegacyDecisionCount, Is.EqualTo(1));
            Assert.That(replayed.Seed, Is.Zero);
            Assert.That(replayed.CurrentNodeId, Is.EqualTo("open-council"));
            Assert.That(replayed.Resources["danger"], Is.EqualTo(61));
            Assert.That(replayed.History[0].ConditionId, Is.EqualTo("water-over-axle"));
            legacy.SaveVersion = 3;
            legacy.Seed = 0;
            legacy.History[0].ConditionId = "water-over-axle";
            var versionThree = ShiState.Replay(campaign, legacy);
            Assert.That(versionThree, Is.Not.Null);
            Assert.That(versionThree!.LegacyDecisionCount, Is.EqualTo(1));
            Assert.That(versionThree.History[0].OppositionStageId, Is.Null.Or.Empty);
            legacy.SaveVersion = 99;
            Assert.That(ShiState.Replay(campaign, legacy), Is.Null);
            legacy.SaveVersion = 0;
            legacy.History[0].NodeId = "impossible";
            Assert.That(ShiState.Replay(campaign, legacy), Is.Null);
        }

        [Test]
        public void TextFallsBackToEnglish()
        {
            var campaign = ShiCampaign.Parse("{\"schemaVersion\":4,\"id\":\"test\",\"title\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"subtitle\":{\"en\":\"Test\",\"zh-Hans\":\"测试\"},\"startNodeId\":\"start\",\"initialResources\":{},\"opposition\":{\"id\":\"watch\",\"stages\":[]},\"sites\":[],\"characters\":[],\"sources\":[],\"claims\":[],\"nodes\":[{\"id\":\"start\",\"choices\":[]}]}");
            Assert.That(campaign.Text(campaign.Title, "fr"), Is.EqualTo("Test"));
        }

        [Test]
        public void SeedHashMatchesTheSharedTypeScriptVector()
        {
            Assert.That(ShiState.HashSeedKey("chapter|0|node|0"), Is.EqualTo(918888254u));
            Assert.That(ShiState.FormatSeed(0x001a2b3c), Is.EqualTo("001A2B3C"));
            var campaign = LoadProductionCampaign();
            Assert.That(ShiState.Create(campaign).ActiveCondition(campaign.Node("rain-order")).Id, Is.EqualTo("water-over-axle"));
        }

        [Test]
        public void ProductionCampaignReferencesAreConsistentAndReachable()
        {
            var campaign = LoadProductionCampaign();
            var sites = campaign.Sites.Select(site => site.Id).ToHashSet();
            var speakers = campaign.Characters.Select(character => character.Id).ToHashSet();
            var sources = campaign.Sources.Select(source => source.Id).ToHashSet();
            var claims = campaign.Claims.Select(claim => claim.Id).ToHashSet();
            var nodes = campaign.Nodes.Select(node => node.Id).ToHashSet();
            var reachable = new HashSet<string>();
            var pending = new Queue<string>();
            pending.Enqueue(campaign.StartNodeId);

            foreach (var site in campaign.Sites)
            {
                Assert.That(site.SourceRefs.All(sources.Contains), Is.True, $"Unknown source on site {site.Id}");
                Assert.That(site.ClaimRefs.All(claims.Contains), Is.True, $"Unknown claim on site {site.Id}");
                foreach (var claimRef in site.ClaimRefs)
                    Assert.That(campaign.Claims.First(claim => claim.Id == claimRef).SourceRefs.All(site.SourceRefs.Contains), Is.True, $"Claim source is not exposed on site {site.Id}");
                Assert.That(site.Status, Is.AnyOf("known", "reported", "reference"));
            }

            while (pending.Count > 0)
            {
                var id = pending.Dequeue();
                if (!reachable.Add(id)) continue;
                var node = campaign.Node(id);
                Assert.That(sites, Does.Contain(node.SiteId), $"Unknown site on {node.Id}");
                Assert.That(speakers, Does.Contain(node.SpeakerId), $"Unknown speaker on {node.Id}");
                Assert.That(node.SourceRefs.All(sources.Contains), Is.True, $"Unknown source on {node.Id}");
                Assert.That(node.ClaimRefs.All(claims.Contains), Is.True, $"Unknown claim on {node.Id}");
                foreach (var claimRef in node.ClaimRefs)
                    Assert.That(campaign.Claims.First(claim => claim.Id == claimRef).SourceRefs.All(node.SourceRefs.Contains), Is.True, $"Claim source is not exposed on {node.Id}");
                Assert.That(node.Conditions, Has.Count.GreaterThanOrEqualTo(2), $"Missing field conditions on {node.Id}");
                foreach (var next in node.Choices.Select(choice => choice.NextNodeId).Where(next => !string.IsNullOrEmpty(next)))
                {
                    Assert.That(nodes, Does.Contain(next));
                    pending.Enqueue(next!);
                }
            }

            Assert.That(reachable, Is.EquivalentTo(nodes));
        }

        [Test]
        public void ProductionCampaignHasPlayableScopeAndEndings()
        {
            var campaign = LoadProductionCampaign();
            Assert.That(campaign.Nodes, Has.Count.GreaterThanOrEqualTo(6));
            Assert.That(campaign.Nodes.Sum(node => node.Choices.Count), Is.GreaterThanOrEqualTo(15));
            Assert.That(campaign.Sources, Has.Count.EqualTo(7));
            Assert.That(campaign.Claims, Has.Count.EqualTo(13));
            Assert.That(campaign.Claims.Count(claim => claim.ReviewStatus == "specialist-review-required"), Is.EqualTo(2));
            Assert.That(campaign.SchemaVersion, Is.EqualTo(4));
            Assert.That(campaign.Opposition.ClaimStatus, Is.EqualTo("dramatic-reconstruction"));
            Assert.That(campaign.Opposition.Stages.Select(stage => stage.Id), Is.EquivalentTo(new[] { "scattered-watch", "road-search", "closing-cordon" }));
            Assert.That(campaign.Nodes.SelectMany(node => node.Choices).Count(choice => string.IsNullOrEmpty(choice.NextNodeId)), Is.GreaterThanOrEqualTo(3));
            Assert.That(global::SHI.Editor.ShiBuild.Validate(campaign), Is.Empty);
        }

        [Test]
        public void ProductionOppositionPostureIsVisibleDeterministicAndCounterable()
        {
            var campaign = LoadProductionCampaign();
            var state = ShiState.Create(campaign);
            state.Resources["danger"] = 60;
            var node = campaign.Node("rain-order");
            var choice = node.Choices.Find(candidate => candidate.Id == "hide-the-register")!;

            Assert.That(state.ActiveOppositionStage(campaign).Id, Is.EqualTo("road-search"));
            var result = state.Resolve(campaign, node, choice);

            Assert.That(result.OppositionStage, Is.Not.Null);
            Assert.That(result.OppositionStage!.Id, Is.EqualTo("road-search"));
            Assert.That(result.OppositionDeltas["danger"], Is.EqualTo(2));
            Assert.That(state.History[0].OppositionStageId, Is.EqualTo("road-search"));
            state.Resources["danger"] = 54;
            Assert.That(state.ActiveOppositionStage(campaign).Id, Is.EqualTo("scattered-watch"));
        }

        [Test]
        public void EveryAdvertisedLocaleHasNativeInterfaceText()
        {
            var locales = new[] { "en", "zh-Hans", "zh-Hant", "ja", "ko", "vi", "ar", "fr", "es", "ru", "de" };
            var keys = new[]
            {
                "begin", "continue", "language", "sources", "restart",
                "grain", "trust", "momentum", "people", "danger",
                "endingWildfire", "endingRoots", "endingWatchful", "opening",
                "consequence", "pressureForecast", "pressureResponse", "failed", "captured", "scattered",
                "guide", "guideTitle", "guideIntro", "guideFieldTitle", "guideFieldText", "guideMoveTitle", "guideMoveText",
                "guideReplyTitle", "guideReplyText", "controllerReady", "controllerOptional", "controllerHint", "guideContinue", "recordEmpty",
                "newGame", "fieldSignal", "chronicleSeed", "fieldApplied",
                "reconstruction", "later", "strategicText", "received", "claimRegister", "evidenceLocated",
                "specialistReview", "authoredClaim", "openEdition", "publicSource",
                "mapIntel", "inspectMap", "knownGround", "reportedGround", "referenceOnly", "uncertainty",
                "opponentPosture", "opponentResponse", "counterplay", "noAddedPressure",
            };

            foreach (var locale in locales)
            foreach (var key in keys)
            {
                Assert.That(ShiUiText.Get(locale, key), Is.Not.Empty, $"Missing Unity UI text: {locale}.{key}");
                Assert.That(ShiUiText.Get(locale, key), Is.Not.EqualTo(key), $"Unity UI text fell through: {locale}.{key}");
            }

            var audioKeys = new[] { "sound", "soundOn", "soundOff", "audioTitle", "audioIntro", "enableSound", "ambience", "effects", "preview", "audioReview" };
            foreach (var locale in locales)
            foreach (var key in audioKeys)
            {
                Assert.That(ShiAudioUiText.Get(locale, key), Is.Not.Null.And.Not.Empty, $"Missing Unity audio UI text: {locale}.{key}");
                Assert.That(ShiAudioUiText.Get(locale, key), Is.Not.EqualTo(key), $"Unity audio UI text fell through: {locale}.{key}");
            }
        }

        [Test]
        public void ProductionAudioContractIsOptInAndDeterministic()
        {
            var path = Path.Combine(Application.streamingAssetsPath, "chapter-01-audio.json");
            Assert.That(File.Exists(path), Is.True, "Run npm run sync:content before the Unity tests.");
            var audio = JsonConvert.DeserializeObject<ShiAudioContract>(File.ReadAllText(path));
            Assert.That(audio, Is.Not.Null);
            Assert.That(audio!.Synthesis, Is.EqualTo("project-original-procedural"));
            Assert.That(audio.Mix.Defaults.Enabled, Is.False);
            Assert.That(audio.Envelope.Curve, Is.EqualTo("linear"));
            Assert.That(audio.Cues.Keys, Is.EquivalentTo(new[] { "select", "inspect", "drawer", "close", "commit", "ending", "failure" }));
            Assert.That(audio.Quality.Reference.CueSchedule.Select(item => item.Cue), Is.EquivalentTo(audio.Cues.Keys));
            Assert.That(global::SHI.Editor.ShiBuild.Validate(audio), Is.Empty);

            var first = ShiAudioDirector.CreateRainSamples(24000, audio.Ambience.Seed);
            var repeated = ShiAudioDirector.CreateRainSamples(24000, audio.Ambience.Seed);
            var other = ShiAudioDirector.CreateRainSamples(24000, audio.Ambience.Seed + 1);
            Assert.That(first, Is.EqualTo(repeated));
            Assert.That(first, Is.Not.EqualTo(other));
            Assert.That(first.All(sample => !float.IsNaN(sample) && sample >= -1 && sample <= 1), Is.True);
            Assert.That(Math.Abs(first.Average(sample => (double)sample)), Is.LessThanOrEqualTo(audio.Quality.Limits.RawAmbienceDcOffsetAbsoluteMax));
            var jumps = Enumerable.Range(1, first.Length - 1).Select(index => Math.Abs(first[index] - first[index - 1])).OrderBy(value => value).ToArray();
            var boundary = Math.Abs(first[^1] - first[0]);
            var jumpRatio = boundary / jumps[(int)Math.Floor(jumps.Length * .99)];
            Assert.That(jumpRatio, Is.LessThanOrEqualTo(audio.Quality.Limits.LoopBoundaryJumpRatioMax));

            var effectsGain = audio.Mix.Defaults.Master * audio.Mix.Defaults.Effects;
            foreach (var cue in audio.Cues)
            {
                var samples = ShiAudioDirector.CreateCueSamples(cue.Value, audio.Envelope, audio.Quality.Reference.SampleRate);
                var peak = samples.Max(sample => Math.Abs(sample)) * effectsGain;
                Assert.That(20 * Math.Log10(peak), Is.GreaterThanOrEqualTo(audio.Quality.Limits.CuePeakDbfsMin), cue.Key);
            }
        }

        [Test]
        public void ProductionCampaignCanReachAllThreeAuthoredEndings()
        {
            var campaign = LoadProductionCampaign();
            var endings = new HashSet<string>();
            var completedRoutes = 0;

            Explore(campaign, ShiState.Create(campaign), endings, ref completedRoutes);

            Assert.That(completedRoutes, Is.GreaterThanOrEqualTo(3));
            Assert.That(endings, Is.EquivalentTo(new[] { "ending-wildfire", "ending-deep-roots", "ending-watchful" }));
        }

        private static ShiCampaign LoadProductionCampaign()
        {
            var path = Path.Combine(Application.streamingAssetsPath, "chapter-01-daze.json");
            Assert.That(File.Exists(path), Is.True, "Run npm run sync:content before the Unity tests.");
            return ShiCampaign.Parse(File.ReadAllText(path));
        }

        private static void Explore(ShiCampaign campaign, ShiState state, ISet<string> endings, ref int completedRoutes)
        {
            var node = campaign.Node(state.CurrentNodeId);
            foreach (var choice in node.Choices.Where(state.CanChoose))
            {
                var branch = Clone(state);
                branch.Resolve(campaign, node, choice);
                if (branch.Completed)
                {
                    completedRoutes++;
                    foreach (var flag in branch.Flags.Where(flag => flag.StartsWith("ending-"))) endings.Add(flag);
                }
                else
                {
                    Explore(campaign, branch, endings, ref completedRoutes);
                }
            }
        }

        private static ShiState Clone(ShiState state) => new()
        {
            CampaignId = state.CampaignId,
            Seed = state.Seed,
            CurrentNodeId = state.CurrentNodeId,
            Resources = new Dictionary<string, int>(state.Resources),
            Flags = new List<string>(state.Flags),
            History = new List<ShiChoiceRecord>(state.History),
            Completed = state.Completed,
            SaveVersion = state.SaveVersion,
            LegacyDecisionCount = state.LegacyDecisionCount,
            FailureReason = state.FailureReason,
        };
    }
}
