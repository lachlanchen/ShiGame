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
    public sealed class ShiChoice { public string Id = ""; public JObject Label = new(); public JObject Intent = new(); public JObject Consequence = new(); public JObject Strategy = new(); public Dictionary<string, int> Effects = new(); public ShiRequirements? Requirements; public List<string> Flags = new(); public string? NextNodeId; }
    public sealed class ShiRequirements { public Dictionary<string, int> Min = new(); public Dictionary<string, int> Max = new(); }

    [Serializable]
    public sealed class ShiState
    {
        public string CampaignId = "";
        public string CurrentNodeId = "";
        public Dictionary<string, int> Resources = new();
        public List<string> Flags = new();
        public List<ShiChoiceRecord> History = new();
        public bool Completed;

        public static ShiState Create(ShiCampaign campaign) => new()
        {
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

        public void Resolve(ShiNode node, ShiChoice choice)
        {
            if (Completed || !CanChoose(choice)) throw new InvalidOperationException("Choice is unavailable.");
            var before = new Dictionary<string, int>(Resources);
            foreach (var effect in choice.Effects) Resources[effect.Key] = Math.Clamp(Resources.GetValueOrDefault(effect.Key) + effect.Value, 0, 100);
            foreach (var flag in choice.Flags) if (!Flags.Contains(flag)) Flags.Add(flag);
            History.Add(new ShiChoiceRecord { NodeId = node.Id, ChoiceId = choice.Id, Before = before, After = new Dictionary<string, int>(Resources) });
            if (string.IsNullOrEmpty(choice.NextNodeId)) Completed = true;
            else CurrentNodeId = choice.NextNodeId;
        }
    }

    [Serializable]
    public sealed class ShiChoiceRecord
    {
        public string NodeId = "";
        public string ChoiceId = "";
        public Dictionary<string, int> Before = new();
        public Dictionary<string, int> After = new();
    }
}
