using System;
using System.Collections.Generic;
using System.Globalization;
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
        public List<ShiClaim> Claims = new();
        public List<ShiNode> Nodes = new();

        public static ShiCampaign Parse(string json)
        {
            var result = JsonConvert.DeserializeObject<ShiCampaign>(json) ?? throw new InvalidOperationException("Campaign JSON was empty.");
            if (result.SchemaVersion != 3) throw new InvalidOperationException($"Unsupported SHI campaign schema {result.SchemaVersion}.");
            if (result.Nodes.All(node => node.Id != result.StartNodeId)) throw new InvalidOperationException("Campaign start node is missing.");
            return result;
        }

        public ShiNode Node(string id) => Nodes.FirstOrDefault(node => node.Id == id) ?? throw new InvalidOperationException($"Unknown node {id}.");
        public ShiCharacter Character(string id) => Characters.FirstOrDefault(character => character.Id == id) ?? throw new InvalidOperationException($"Unknown character {id}.");
        public string Text(JObject value, string locale) => value.Value<string>(locale) ?? value.Value<string>("en") ?? value.Value<string>("zh-Hans") ?? "";
    }

    public sealed class ShiSite { public string Id = ""; public JObject Name = new(); public float X; public float Z; public string Status = ""; }
    public sealed class ShiCharacter { public string Id = ""; public JObject Name = new(); public JObject Role = new(); public bool Historical; }
    public sealed class ShiSource { public string Id = ""; public string EditionId = ""; public string Work = ""; public string Section = ""; public string Locator = ""; public string Url = ""; public string Author = ""; public string Date = ""; public JObject Note = new(); public string ClaimStatus = ""; public string RightsStatus = ""; }
    public sealed class ShiClaim { public string Id = ""; public string Kind = ""; public JObject Statement = new(); public List<string> SourceRefs = new(); public string ReviewStatus = ""; public string Confidence = ""; public JObject Uncertainty = new(); public JObject GameUse = new(); public string Reviewer = ""; }
    public sealed class ShiNode { public string Id = ""; public JObject DateLabel = new(); public string SiteId = ""; public string SpeakerId = ""; public JObject Title = new(); public JObject Context = new(); public JObject Dialogue = new(); public List<string> SourceRefs = new(); public List<string> ClaimRefs = new(); public List<ShiFieldCondition> Conditions = new(); public List<ShiChoice> Choices = new(); }
    public sealed class ShiFieldCondition { public string Id = ""; public string ClaimStatus = ""; public JObject Title = new(); public JObject Signal = new(); public int Weight; public Dictionary<string, int> Effects = new(); }
    public sealed class ShiChoice { public string Id = ""; public JObject Label = new(); public JObject Intent = new(); public JObject Consequence = new(); public JObject Strategy = new(); public Dictionary<string, int> Effects = new(); public ShiRequirements? Requirements; public ShiPressure? Pressure; public List<string> Flags = new(); public string? NextNodeId; }
    public sealed class ShiRequirements { public Dictionary<string, int> Min = new(); public Dictionary<string, int> Max = new(); }
    public sealed class ShiPressure { public string Kind = ""; public JObject Warning = new(); public JObject Reveal = new(); public Dictionary<string, int> Effects = new(); }

    [Serializable]
    public sealed class ShiState
    {
        // Zero means a legacy JSON payload omitted this field; Create always writes v3.
        public int SaveVersion;
        public string CampaignId = "";
        public uint Seed;
        public string CurrentNodeId = "";
        public Dictionary<string, int> Resources = new();
        public List<string> Flags = new();
        public List<ShiChoiceRecord> History = new();
        public bool Completed;
        public string? FailureReason;

        public static ShiState Create(ShiCampaign campaign, uint seed = 0) => new()
        {
            SaveVersion = 3,
            CampaignId = campaign.Id,
            Seed = seed,
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
            var condition = ActiveCondition(node);
            var before = new Dictionary<string, int>(Resources);
            var afterChoice = ApplyEffects(before, choice.Effects);
            var afterPressure = ApplyEffects(afterChoice, choice.Pressure?.Effects ?? new Dictionary<string, int>());
            var after = ApplyEffects(afterPressure, condition.Effects);
            Resources = after;
            foreach (var flag in choice.Flags) if (!Flags.Contains(flag)) Flags.Add(flag);
            History.Add(new ShiChoiceRecord
            {
                NodeId = node.Id,
                ChoiceId = choice.Id,
                ConditionId = condition.Id,
                Before = before,
                AfterChoice = afterChoice,
                PressureEffects = Deltas(afterChoice, afterPressure),
                AfterPressure = afterPressure,
                ConditionEffects = Deltas(afterPressure, after),
                After = new Dictionary<string, int>(after),
            });
            FailureReason = after.GetValueOrDefault("danger") >= 100 ? "captured" : after.GetValueOrDefault("people") <= 0 ? "scattered" : null;
            if (string.IsNullOrEmpty(choice.NextNodeId) || FailureReason != null) Completed = true;
            else CurrentNodeId = choice.NextNodeId!;
            return new ShiResolution
            {
                Choice = choice,
                Condition = condition,
                PlayerDeltas = Deltas(before, afterChoice),
                PressureDeltas = Deltas(afterChoice, afterPressure),
                FieldDeltas = Deltas(afterPressure, after),
            };
        }

        public ShiFieldCondition ActiveCondition(ShiNode node)
        {
            if (node.Conditions.Count == 0) throw new InvalidOperationException($"Node {node.Id} has no field conditions.");
            var totalWeight = node.Conditions.Sum(condition => condition.Weight);
            if (totalWeight <= 0) throw new InvalidOperationException($"Node {node.Id} has invalid field-condition weights.");
            var key = CampaignId + "|" + Seed.ToString(CultureInfo.InvariantCulture) + "|" + node.Id + "|" + History.Count.ToString(CultureInfo.InvariantCulture);
            var roll = (int)(HashSeedKey(key) % (uint)totalWeight);
            foreach (var condition in node.Conditions)
            {
                if (roll < condition.Weight) return condition;
                roll -= condition.Weight;
            }
            throw new InvalidOperationException($"Node {node.Id} field-condition selection overflowed.");
        }

        public static uint HashSeedKey(string value)
        {
            unchecked
            {
                uint hash = 2166136261;
                foreach (var character in value)
                {
                    hash ^= character;
                    hash *= 16777619;
                }
                return hash;
            }
        }

        public static string FormatSeed(uint seed) => seed.ToString("X8", CultureInfo.InvariantCulture);

        public static ShiState? Replay(ShiCampaign campaign, ShiState? saved)
        {
            if (saved == null || saved.CampaignId != campaign.Id || saved.History == null) return null;
            if (saved.SaveVersion < 0 || saved.SaveVersion > 3) return null;
            var modern = saved.SaveVersion == 3;
            var replayed = Create(campaign, modern ? saved.Seed : 0);
            try
            {
                foreach (var record in saved.History)
                {
                    if (replayed.Completed || record.NodeId != replayed.CurrentNodeId) return null;
                    var node = campaign.Node(replayed.CurrentNodeId);
                    var choice = node.Choices.Find(candidate => candidate.Id == record.ChoiceId);
                    if (choice == null || !replayed.CanChoose(choice)) return null;
                    var result = replayed.Resolve(node, choice);
                    if (modern && record.ConditionId != result.Condition.Id) return null;
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
        public string ConditionId = "";
        public Dictionary<string, int> Before = new();
        public Dictionary<string, int> AfterChoice = new();
        public Dictionary<string, int> PressureEffects = new();
        public Dictionary<string, int> AfterPressure = new();
        public Dictionary<string, int> ConditionEffects = new();
        public Dictionary<string, int> After = new();
    }

    public sealed class ShiResolution
    {
        public ShiChoice Choice = new();
        public ShiFieldCondition Condition = new();
        public Dictionary<string, int> PlayerDeltas = new();
        public Dictionary<string, int> PressureDeltas = new();
        public Dictionary<string, int> FieldDeltas = new();
    }
}
