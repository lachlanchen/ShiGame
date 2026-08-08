using System.Collections;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace SHI
{
    public static class ShiBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Start()
        {
            if (Object.FindFirstObjectByType<ShiGameController>() != null) return;
            var root = new GameObject("SHI Runtime");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<ShiGameController>();
        }
    }

    public sealed class ShiGameController : MonoBehaviour
    {
        private const string SaveKey = "shi.chapter-01.state.v1";
        private readonly string[] locales = { "en", "zh-Hans", "zh-Hant", "ja", "ko", "vi", "ar", "fr", "es", "ru", "de" };
        private readonly string[] resources = { "grain", "trust", "momentum", "people", "danger" };
        private ShiCampaign? campaign;
        private ShiState? state;
        private WarTableWorld? world;
        private Texture2D? keyArt;
        private string locale = "en";
        private bool title = true;
        private bool sourcesOpen;
        private string error = "";
        private GUIStyle? titleStyle;
        private GUIStyle? bodyStyle;
        private GUIStyle? smallStyle;
        private GUIStyle? buttonStyle;
        private GUIStyle? overlayStyle;

        private IEnumerator Start()
        {
            Application.targetFrameRate = 60;
            yield return LoadText("chapter-01-daze.json", text => campaign = ShiCampaign.Parse(text));
            yield return LoadTexture("daze-village-rain-v1.png", texture => keyArt = texture);
            if (campaign == null) yield break;
            state = LoadState() ?? ShiState.Create(campaign);
            world = gameObject.AddComponent<WarTableWorld>();
            world.Build(campaign);
            world.SetActiveSite(campaign.Node(state.CurrentNodeId).SiteId);
        }

        private IEnumerator LoadText(string fileName, System.Action<string> receive)
        {
            var path = Path.Combine(Application.streamingAssetsPath, fileName);
            using var request = UnityWebRequest.Get(path);
            yield return request.SendWebRequest();
            if (request.result != UnityWebRequest.Result.Success) error = $"Cannot load {fileName}: {request.error}";
            else
            {
                try { receive(request.downloadHandler.text); }
                catch (System.Exception exception) { error = exception.Message; }
            }
        }

        private IEnumerator LoadTexture(string fileName, System.Action<Texture2D> receive)
        {
            var path = Path.Combine(Application.streamingAssetsPath, fileName);
            using var request = UnityWebRequestTexture.GetTexture(path);
            yield return request.SendWebRequest();
            if (request.result == UnityWebRequest.Result.Success) receive(DownloadHandlerTexture.GetContent(request));
        }

        private ShiState? LoadState()
        {
            if (!PlayerPrefs.HasKey(SaveKey)) return null;
            try
            {
                var loaded = JsonConvert.DeserializeObject<ShiState>(PlayerPrefs.GetString(SaveKey));
                return loaded?.CampaignId == campaign?.Id ? loaded : null;
            }
            catch { return null; }
        }

        private void Save()
        {
            if (state == null) return;
            PlayerPrefs.SetString(SaveKey, JsonConvert.SerializeObject(state));
            PlayerPrefs.Save();
        }

        private void PrepareStyles()
        {
            if (titleStyle != null) return;
            titleStyle = new GUIStyle(GUI.skin.label) { fontSize = 48, fontStyle = FontStyle.Normal, wordWrap = true };
            titleStyle.normal.textColor = new Color(0.93f, 0.89f, 0.8f);
            bodyStyle = new GUIStyle(GUI.skin.label) { fontSize = 18, wordWrap = true, richText = true };
            bodyStyle.normal.textColor = new Color(0.77f, 0.75f, 0.69f);
            smallStyle = new GUIStyle(bodyStyle) { fontSize = 13 };
            smallStyle.normal.textColor = new Color(0.64f, 0.62f, 0.56f);
            buttonStyle = new GUIStyle(GUI.skin.button) { alignment = TextAnchor.MiddleLeft, fontSize = 17, wordWrap = true, padding = new RectOffset(18, 18, 12, 12) };
            buttonStyle.normal.textColor = new Color(0.9f, 0.86f, 0.78f);
            buttonStyle.normal.background = Solid(new Color(0.12f, 0.12f, 0.1f, 0.94f));
            buttonStyle.hover.background = Solid(new Color(0.22f, 0.19f, 0.13f, 0.97f));
            overlayStyle = new GUIStyle();
            overlayStyle.normal.background = Solid(new Color(0.03f, 0.035f, 0.027f, 0.63f));
        }

        private static Texture2D Solid(Color color)
        {
            var texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, color);
            texture.Apply();
            return texture;
        }

        private void OnGUI()
        {
            PrepareStyles();
            ApplyDirection();
            if (!string.IsNullOrEmpty(error)) { GUI.Label(new Rect(40, 40, Screen.width - 80, 100), error, bodyStyle); return; }
            if (campaign == null || state == null) { GUI.Label(new Rect(40, 40, 400, 50), "Loading SHI…", bodyStyle); return; }
            if (title) DrawTitle(); else DrawGame();
        }

        private void DrawTitle()
        {
            if (keyArt != null) GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), keyArt, ScaleMode.ScaleAndCrop);
            GUI.Box(new Rect(0, 0, Screen.width, Screen.height), "", overlayStyle);
            var panel = new Rect(Screen.width * 0.08f, Screen.height * 0.2f, Mathf.Min(650, Screen.width * 0.62f), Screen.height * 0.62f);
            GUI.Label(new Rect(panel.x, panel.y, panel.width, 70), "勢  /  SHI", titleStyle);
            GUI.Label(new Rect(panel.x, panel.y + 75, panel.width, 45), campaign.Text(campaign.Subtitle, locale), bodyStyle);
            GUI.Label(new Rect(panel.x, panel.y + 145, panel.width, 110), T("opening"), bodyStyle);
            if (GUI.Button(new Rect(panel.x, panel.y + 280, 250, 58), (state.History.Count > 0 ? T("continue") : T("begin")) + "  →", buttonStyle)) title = false;
            DrawLocale(new Rect(panel.x, panel.y + 360, 310, 32));
        }

        private void DrawLocale(Rect rect)
        {
            var index = System.Array.IndexOf(locales, locale);
            var previous = locales[(index - 1 + locales.Length) % locales.Length];
            var next = locales[(index + 1) % locales.Length];
            GUI.Label(new Rect(rect.x, rect.y, 90, rect.height), T("language").ToUpperInvariant(), smallStyle);
            if (GUI.Button(new Rect(rect.x + 92, rect.y, 105, rect.height), "‹ " + ShiUiText.LocaleName(previous), GUI.skin.button)) locale = previous;
            if (GUI.Button(new Rect(rect.x + 205, rect.y, 105, rect.height), ShiUiText.LocaleName(next) + " ›", GUI.skin.button)) locale = next;
        }

        private void DrawGame()
        {
            var node = campaign!.Node(state!.CurrentNodeId);
            GUI.Box(new Rect(0, 0, Screen.width, 74), "");
            GUI.Label(new Rect(32, 15, 220, 48), "勢  SHI", titleStyle);
            DrawLocale(new Rect(Screen.width - 355, 20, 320, 30));
            var railWidth = (Screen.width - 64f) / resources.Length;
            for (var index = 0; index < resources.Length; index++)
            {
                var x = 32 + railWidth * index;
                var key = resources[index];
                GUI.Label(new Rect(x, 84, railWidth - 12, 22), T(key).ToUpperInvariant() + $"  {state.Resources.GetValueOrDefault(key)}", smallStyle);
                GUI.Box(new Rect(x, 108, (railWidth - 18) * state.Resources.GetValueOrDefault(key) / 100f, 3), "");
            }
            var storyX = Screen.width * 0.43f;
            var storyWidth = Screen.width - storyX - 45;
            GUI.Label(new Rect(storyX, 145, storyWidth, 28), campaign.Text(node.DateLabel, locale).ToUpperInvariant(), smallStyle);
            GUI.Label(new Rect(storyX, 177, storyWidth, 75), campaign.Text(node.Title, locale), titleStyle);
            GUI.Label(new Rect(storyX, 258, storyWidth, 110), campaign.Text(node.Context, locale), bodyStyle);
            GUI.Box(new Rect(storyX, 380, storyWidth, 105), "");
            GUI.Label(new Rect(storyX + 18, 394, storyWidth - 36, 76), campaign.Text(node.Dialogue, locale), bodyStyle);
            if (GUI.Button(new Rect(storyX, 495, 180, 32), $"{T("sources")} · {node.SourceRefs.Count}")) sourcesOpen = !sourcesOpen;

            if (!state.Completed)
            {
                var choiceY = Screen.height - 190;
                var choiceWidth = (Screen.width - 64f - 14f * (node.Choices.Count - 1)) / node.Choices.Count;
                for (var index = 0; index < node.Choices.Count; index++)
                {
                    var choice = node.Choices[index];
                    GUI.enabled = state.CanChoose(choice);
                    var text = $"{(char)('A' + index)}   {campaign.Text(choice.Label, locale)}\n<size=13>{campaign.Text(choice.Intent, locale)}</size>";
                    if (GUI.Button(new Rect(32 + index * (choiceWidth + 14), choiceY, choiceWidth, 135), text, buttonStyle))
                    {
                        state.Resolve(node, choice);
                        Save();
                        if (!state.Completed) world?.SetActiveSite(campaign.Node(state.CurrentNodeId).SiteId);
                    }
                }
                GUI.enabled = true;
            }
            else
            {
                GUI.Box(new Rect(storyX, Screen.height - 190, storyWidth, 135), "");
                var ending = state.Flags.Contains("ending-wildfire") ? T("endingWildfire") : state.Flags.Contains("ending-deep-roots") ? T("endingRoots") : T("endingWatchful");
                GUI.Label(new Rect(storyX + 20, Screen.height - 175, storyWidth - 200, 60), ending, titleStyle);
                if (GUI.Button(new Rect(storyX + storyWidth - 180, Screen.height - 150, 150, 50), T("restart") + "  ↺")) Restart();
            }

            if (sourcesOpen) DrawSources(node);
        }

        private void DrawSources(ShiNode node)
        {
            var width = Mathf.Min(520, Screen.width * 0.55f);
            GUI.Box(new Rect(Screen.width - width, 0, width, Screen.height), "");
            GUI.Label(new Rect(Screen.width - width + 25, 22, width - 90, 50), T("sources"), titleStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) sourcesOpen = false;
            var y = 90f;
            foreach (var id in node.SourceRefs)
            {
                var source = campaign!.Sources.Find(item => item.Id == id);
                if (source == null) continue;
                GUI.Label(new Rect(Screen.width - width + 25, y, width - 50, 30), source.Work, bodyStyle);
                GUI.Label(new Rect(Screen.width - width + 25, y + 34, width - 50, 90), campaign.Text(source.Note, locale), smallStyle);
                y += 140;
            }
        }

        private void Restart()
        {
            if (campaign == null) return;
            PlayerPrefs.DeleteKey(SaveKey);
            state = ShiState.Create(campaign);
            sourcesOpen = false;
            world?.SetActiveSite(campaign.Node(campaign.StartNodeId).SiteId);
        }

        private string T(string key) => ShiUiText.Get(locale, key);

        private void ApplyDirection()
        {
            var rtl = locale == "ar";
            titleStyle!.alignment = rtl ? TextAnchor.UpperRight : TextAnchor.UpperLeft;
            bodyStyle!.alignment = rtl ? TextAnchor.UpperRight : TextAnchor.UpperLeft;
            smallStyle!.alignment = rtl ? TextAnchor.UpperRight : TextAnchor.UpperLeft;
            buttonStyle!.alignment = rtl ? TextAnchor.MiddleRight : TextAnchor.MiddleLeft;
        }
    }
}
