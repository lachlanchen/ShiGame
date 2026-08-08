using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SHI
{
    public sealed class ShiCampaign
    {
        public int SchemaVersion;
        public string Id = "";
        public JObject Title = new();
        public JObject Subtitle = new();
        public string StartNodeId = "";
        public Dictionary<string, int> InitialResources = new();
        public List<ShiSite> Sites = new();
        public List<ShiCharacter> Characters = new();
        public List<ShiSource> Sources = new();
        public List<ShiNode> Nodes = new();

        public static ShiCampaign Parse(string json)
        {
            var result = JsonConvert.DeserializeObject<ShiCampaign>(json) ?? throw new InvalidOperationException("Campaign JSON was empty.");
            if (result.SchemaVersion != 1) throw new InvalidOperationException($"Unsupported SHI campaign schema {result.SchemaVersion}.");
            if (result.Nodes.All(node => node.Id != result.StartNodeId)) throw new InvalidOperationException("Campaign start node is missing.");
            return result;
        }

        public ShiNode Node(string id) => Nodes.FirstOrDefault(node => node.Id == id) ?? throw new InvalidOperationException($"Unknown node {id}.");
        public ShiCharacter Character(string id) => Characters.FirstOrDefault(character => character.Id == id) ?? throw new InvalidOperationException($"Unknown character {id}.");
        public string Text(JObject value, string locale) => value.Value<string>(locale) ?? value.Value<string>("en") ?? value.Value<string>("zh-Hans") ?? "";
    }

    public sealed class ShiSite { public string Id = ""; public JObject Name = new(); public float X; public float Z; public string Status = ""; }
    public sealed class ShiCharacter { public string Id = ""; public JObject Name = new(); public JObject Role = new(); public bool Historical; }
    public sealed class ShiSource { public string Id = ""; public string Work = ""; public string Section = ""; public string Date = ""; public JObject Note = new(); public string ClaimStatus = ""; }
    public sealed class ShiNode { public string Id = ""; public JObject DateLabel = new(); public string SiteId = ""; public string SpeakerId = ""; public JObject Title = new(); public JObject Context = new(); public JObject Dialogue = new(); public List<string> SourceRefs = new(); public List<ShiChoice> Choices = new(); }
    public sealed class ShiChoice { public string Id = ""; public JObject Label = new(); public JObject Intent = new(); public JObject Consequence = new(); public JObject Strategy = new(); public Dictionary<string, int> Effects = new(); public ShiRequirements? Requirements; public ShiPressure? Pressure; public List<string> Flags = new(); public string? NextNodeId; }
    public sealed class ShiRequirements { public Dictionary<string, int> Min = new(); public Dictionary<string, int> Max = new(); }
    public sealed class ShiPressure { public string Kind = ""; public JObject Warning = new(); public JObject Reveal = new(); public Dictionary<string, int> Effects = new(); }

    [Serializable]
    public sealed class ShiState
    {
        public int SaveVersion = 2;
        public string CampaignId = "";
        public string CurrentNodeId = "";
        public Dictionary<string, int> Resources = new();
        public List<string> Flags = new();
        public List<ShiChoiceRecord> History = new();
        public bool Completed;
        public string? FailureReason;

        public static ShiState Create(ShiCampaign campaign) => new()
        {
            SaveVersion = 2,
            CampaignId = campaign.Id,
            CurrentNodeId = campaign.StartNodeId,
            Resources = new Dictionary<string, int>(campaign.InitialResources),
        };

        public bool CanChoose(ShiChoice choice)
        {
            if (choice.Requirements == null) return true;
            return choice.Requirements.Min.All(pair => Resources.GetValueOrDefault(pair.Key) >= pair.Value)
                && choice.Requirements.Max.All(pair => Resources.GetValueOrDefault(pair.Key) <= pair.Value);
        }

        public ShiResolution Resolve(ShiNode node, ShiChoice choice)
        {
            if (Completed || node.Id != CurrentNodeId || !CanChoose(choice)) throw new InvalidOperationException("Choice is unavailable.");
            var before = new Dictionary<string, int>(Resources);
            var afterChoice = ApplyEffects(before, choice.Effects);
            var after = ApplyEffects(afterChoice, choice.Pressure?.Effects ?? new Dictionary<string, int>());
            Resources = after;
            foreach (var flag in choice.Flags) if (!Flags.Contains(flag)) Flags.Add(flag);
            History.Add(new ShiChoiceRecord
            {
                NodeId = node.Id,
                ChoiceId = choice.Id,
                Before = before,
                AfterChoice = afterChoice,
                PressureEffects = Deltas(afterChoice, after),
                After = new Dictionary<string, int>(after),
            });
            FailureReason = after.GetValueOrDefault("danger") >= 100 ? "captured" : after.GetValueOrDefault("people") <= 0 ? "scattered" : null;
            if (string.IsNullOrEmpty(choice.NextNodeId) || FailureReason != null) Completed = true;
            else CurrentNodeId = choice.NextNodeId;
            return new ShiResolution
            {
                Choice = choice,
                PlayerDeltas = Deltas(before, afterChoice),
                PressureDeltas = Deltas(afterChoice, after),
            };
        }

        public static ShiState? Replay(ShiCampaign campaign, ShiState? saved)
        {
            if (saved == null || saved.CampaignId != campaign.Id || saved.History == null) return null;
            var replayed = Create(campaign);
            try
            {
                foreach (var record in saved.History)
                {
                    if (replayed.Completed || record.NodeId != replayed.CurrentNodeId) return null;
                    var node = campaign.Node(replayed.CurrentNodeId);
                    var choice = node.Choices.Find(candidate => candidate.Id == record.ChoiceId);
                    if (choice == null || !replayed.CanChoose(choice)) return null;
                    replayed.Resolve(node, choice);
                }
            }
            catch
            {
                return null;
            }
            return replayed;
        }

        private static Dictionary<string, int> ApplyEffects(IReadOnlyDictionary<string, int> resources, IReadOnlyDictionary<string, int> effects)
        {
            var result = new Dictionary<string, int>(resources);
            foreach (var effect in effects)
            {
                var current = resources.TryGetValue(effect.Key, out var value) ? value : 0;
                result[effect.Key] = Math.Clamp(current + effect.Value, 0, 100);
            }
            return result;
        }

        private static Dictionary<string, int> Deltas(IReadOnlyDictionary<string, int> before, IReadOnlyDictionary<string, int> after)
        {
            var result = new Dictionary<string, int>();
            foreach (var pair in after)
            {
                var previous = before.TryGetValue(pair.Key, out var value) ? value : 0;
                var delta = pair.Value - previous;
                if (delta != 0) result[pair.Key] = delta;
            }
            return result;
        }
    }

    [Serializable]
    public sealed class ShiChoiceRecord
    {
        public string NodeId = "";
        public string ChoiceId = "";
        public Dictionary<string, int> Before = new();
        public Dictionary<string, int> AfterChoice = new();
        public Dictionary<string, int> PressureEffects = new();
        public Dictionary<string, int> After = new();
    }

    public sealed class ShiResolution
    {
        public ShiChoice Choice = new();
        public Dictionary<string, int> PlayerDeltas = new();
        public Dictionary<string, int> PressureDeltas = new();
    }
}
