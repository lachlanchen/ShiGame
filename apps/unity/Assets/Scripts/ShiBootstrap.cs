using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
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
        private const string SaveKey = "shi.chapter-01.state.v3";
        private const string LegacySaveKeyV2 = "shi.chapter-01.state.v2";
        private const string LegacySaveKeyV1 = "shi.chapter-01.state.v1";
        private const string DraftSeedKey = "shi.chapter-01.seed.v1";
        private const string GuideKey = "shi.onboarding.field-guide.v1";
        private readonly string[] locales = { "en", "zh-Hans", "zh-Hant", "ja", "ko", "vi", "ar", "fr", "es", "ru", "de" };
        private readonly string[] resources = { "grain", "trust", "momentum", "people", "danger" };
        private ShiCampaign? campaign;
        private ShiState? state;
        private WarTableWorld? world;
        private Texture2D? keyArt;
        private string locale = "en";
        private bool title = true;
        private bool sourcesOpen;
        private bool recordOpen;
        private bool guideOpen;
        private bool showGuideOnEntry;
        private int selectedChoiceIndex;
        private float previousHorizontal;
        private float previousVertical;
        private string error = "";
        private ShiResolution? resolution;
        private GUIStyle? titleStyle;
        private GUIStyle? bodyStyle;
        private GUIStyle? smallStyle;
        private GUIStyle? buttonStyle;
        private GUIStyle? selectedButtonStyle;
        private GUIStyle? overlayStyle;

        private IEnumerator Start()
        {
            Application.targetFrameRate = 60;
            yield return LoadText("chapter-01-daze.json", text => campaign = ShiCampaign.Parse(text));
            yield return LoadTexture("daze-village-rain-v1.png", texture => keyArt = texture);
            if (campaign == null) yield break;
            state = LoadState() ?? ShiState.Create(campaign, LoadOrCreateSeed());
            showGuideOnEntry = state.History.Count == 0 && PlayerPrefs.GetInt(GuideKey, 0) == 0;
            world = gameObject.AddComponent<WarTableWorld>();
            world.Build(campaign);
            world.SetActiveSite(campaign.Node(state.CurrentNodeId).SiteId);
        }

        private void Update()
        {
            if (campaign == null || state == null) return;
            var horizontal = Input.GetAxisRaw("Horizontal");
            var vertical = Input.GetAxisRaw("Vertical");
            var lastHorizontal = previousHorizontal;
            var lastVertical = previousVertical;
            previousHorizontal = horizontal;
            previousVertical = vertical;
            var confirm = Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.JoystickButton0);
            var back = Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.JoystickButton1);
            if (back && (guideOpen || sourcesOpen || recordOpen || resolution != null))
            {
                CloseTransient();
                return;
            }
            if (title)
            {
                if (confirm) EnterPlay();
                return;
            }
            if (Input.GetKeyDown(KeyCode.JoystickButton9)) { ToggleGuide(); return; }
            if (Input.GetKeyDown(KeyCode.JoystickButton4)) { ToggleRecord(); return; }
            if (Input.GetKeyDown(KeyCode.JoystickButton5)) { ToggleSources(); return; }
            if (guideOpen || sourcesOpen || recordOpen)
            {
                if (confirm && guideOpen) CloseGuide();
                return;
            }
            if (resolution != null)
            {
                if (confirm) resolution = null;
                return;
            }
            if (state.Completed)
            {
                if (confirm) Restart();
                return;
            }

            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.JoystickButton12) || Input.GetKeyDown(KeyCode.JoystickButton14)) MoveSelection(-1);
            else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.JoystickButton13) || Input.GetKeyDown(KeyCode.JoystickButton15)) MoveSelection(1);
            else if (Mathf.Abs(horizontal) >= .65f && Mathf.Abs(lastHorizontal) <= .35f) MoveSelection(horizontal > 0 ? 1 : -1);
            else if (Mathf.Abs(vertical) >= .65f && Mathf.Abs(lastVertical) <= .35f) MoveSelection(vertical > 0 ? 1 : -1);
            if (confirm) CommitSelectedChoice();
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
            foreach (var key in new[] { SaveKey, LegacySaveKeyV2, LegacySaveKeyV1 })
            {
                if (!PlayerPrefs.HasKey(key)) continue;
                try
                {
                    var loaded = JsonConvert.DeserializeObject<ShiState>(PlayerPrefs.GetString(key));
                    var replayed = campaign == null ? null : ShiState.Replay(campaign, loaded);
                    if (replayed == null || replayed.History.Count == 0) continue;
                    PlayerPrefs.SetString(SaveKey, JsonConvert.SerializeObject(replayed));
                    PlayerPrefs.SetString(DraftSeedKey, replayed.Seed.ToString());
                    PlayerPrefs.DeleteKey(LegacySaveKeyV2);
                    PlayerPrefs.DeleteKey(LegacySaveKeyV1);
                    return replayed;
                }
                catch { /* Try the next known save version. */ }
            }
            return null;
        }

        private static uint NewSeed()
        {
            var bytes = new byte[4];
            using var generator = RandomNumberGenerator.Create();
            generator.GetBytes(bytes);
            return System.BitConverter.ToUInt32(bytes, 0);
        }

        private static uint LoadOrCreateSeed()
        {
            if (PlayerPrefs.HasKey(DraftSeedKey) && uint.TryParse(PlayerPrefs.GetString(DraftSeedKey), out var stored)) return stored;
            var seed = NewSeed();
            PlayerPrefs.SetString(DraftSeedKey, seed.ToString());
            PlayerPrefs.Save();
            return seed;
        }

        private void Save()
        {
            if (state == null) return;
            PlayerPrefs.SetString(SaveKey, JsonConvert.SerializeObject(state));
            PlayerPrefs.SetString(DraftSeedKey, state.Seed.ToString());
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
            buttonStyle = new GUIStyle(GUI.skin.button) { alignment = TextAnchor.MiddleLeft, fontSize = 17, wordWrap = true, richText = true, padding = new RectOffset(18, 18, 12, 12) };
            buttonStyle.normal.textColor = new Color(0.9f, 0.86f, 0.78f);
            buttonStyle.normal.background = Solid(new Color(0.12f, 0.12f, 0.1f, 0.94f));
            buttonStyle.hover.background = Solid(new Color(0.22f, 0.19f, 0.13f, 0.97f));
            selectedButtonStyle = new GUIStyle(buttonStyle);
            selectedButtonStyle.normal.background = Solid(new Color(0.25f, 0.22f, 0.15f, 0.98f));
            selectedButtonStyle.normal.textColor = new Color(0.98f, 0.91f, 0.76f);
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
            GUI.Label(new Rect(panel.x, panel.y + 75, panel.width, 45), campaign!.Text(campaign.Subtitle, locale), bodyStyle);
            GUI.Label(new Rect(panel.x, panel.y + 145, panel.width, 110), T("opening"), bodyStyle);
            if (GUI.Button(new Rect(panel.x, panel.y + 280, 250, 58), (state!.History.Count > 0 ? T("continue") : T("begin")) + "  →", buttonStyle)) EnterPlay();
            if (state.History.Count > 0 && GUI.Button(new Rect(panel.x + 270, panel.y + 280, 220, 58), T("newGame"), buttonStyle)) NewChronicle();
            DrawLocale(new Rect(panel.x, panel.y + 360, 310, 32));
            GUI.Label(new Rect(panel.x, panel.y + 410, panel.width, 44), (ControllerConnected ? T("controllerReady") : T("controllerOptional")) + " · A / Cross · " + T("chronicleSeed") + " " + ShiState.FormatSeed(state.Seed), smallStyle);
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
            var condition = state.ActiveCondition(node);
            GUI.Box(new Rect(0, 0, Screen.width, 74), "");
            if (GUI.Button(new Rect(32, 16, 205, 40), "勢  SHI", GUI.skin.button)) title = true;
            if (GUI.Button(new Rect(260, 20, 105, 30), T("guide"))) ToggleGuide();
            if (GUI.Button(new Rect(375, 20, 105, 30), T("record") + $"  {state.History.Count}")) ToggleRecord();
            if (GUI.Button(new Rect(490, 20, 105, 30), T("sources") + $"  {node.SourceRefs.Count}")) ToggleSources();
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
            GUI.Box(new Rect(32, 145, storyX - 64, 132), "");
            GUI.Label(new Rect(48, 157, storyX - 96, 20), T("fieldSignal") + " · " + T("reconstruction") + " · " + T("chronicleSeed") + " " + ShiState.FormatSeed(state.Seed), smallStyle);
            GUI.Label(new Rect(48, 181, storyX - 96, 28), campaign.Text(condition.Title, locale), bodyStyle);
            GUI.Label(new Rect(48, 211, storyX - 96, 42), campaign.Text(condition.Signal, locale), smallStyle);
            GUI.Label(new Rect(48, 251, storyX - 96, 20), EffectsText(condition.Effects), smallStyle);
            GUI.Label(new Rect(storyX, 145, storyWidth, 28), campaign.Text(node.DateLabel, locale).ToUpperInvariant(), smallStyle);
            GUI.Label(new Rect(storyX, 177, storyWidth, 75), campaign.Text(node.Title, locale), titleStyle);
            GUI.Label(new Rect(storyX, 258, storyWidth, 110), campaign.Text(node.Context, locale), bodyStyle);
            GUI.Box(new Rect(storyX, 380, storyWidth, 105), "");
            GUI.Label(new Rect(storyX + 18, 394, storyWidth - 36, 76), campaign.Text(node.Dialogue, locale), bodyStyle);
            if (GUI.Button(new Rect(storyX, 495, 180, 32), $"{T("sources")} · {node.SourceRefs.Count}")) ToggleSources();

            if (!state.Completed)
            {
                var choiceY = Screen.height - 230;
                var choiceWidth = (Screen.width - 64f - 14f * (node.Choices.Count - 1)) / node.Choices.Count;
                for (var index = 0; index < node.Choices.Count; index++)
                {
                    var choice = node.Choices[index];
                    GUI.enabled = state.CanChoose(choice);
                    var text = $"{(char)('A' + index)}   {campaign.Text(choice.Label, locale)}\n<size=13>{campaign.Text(choice.Intent, locale)}</size>";
                    if (choice.Pressure != null)
                        text += $"\n<size=12><color=#B88976>{T("pressureForecast")}: {campaign.Text(choice.Pressure.Warning, locale)}</color></size>";
                    var style = index == selectedChoiceIndex ? selectedButtonStyle : buttonStyle;
                    if (GUI.Button(new Rect(32 + index * (choiceWidth + 14), choiceY, choiceWidth, 175), text, style))
                    {
                        selectedChoiceIndex = index;
                        CommitChoice(node, choice);
                    }
                }
                GUI.enabled = true;
            }
            else
            {
                GUI.Box(new Rect(storyX, Screen.height - 190, storyWidth, 135), "");
                var ending = state.FailureReason != null ? T("failed") : state.Flags.Contains("ending-wildfire") ? T("endingWildfire") : state.Flags.Contains("ending-deep-roots") ? T("endingRoots") : T("endingWatchful");
                GUI.Label(new Rect(storyX + 20, Screen.height - 175, storyWidth - 200, 60), ending, titleStyle);
                if (state.FailureReason != null)
                    GUI.Label(new Rect(storyX + 20, Screen.height - 115, storyWidth - 220, 48), T(state.FailureReason!), smallStyle);
                if (GUI.Button(new Rect(storyX + storyWidth - 180, Screen.height - 150, 150, 50), T("restart") + "  ↺")) Restart();
            }

            if (resolution != null) DrawResolution();
            if (sourcesOpen) DrawSources(node);
            if (recordOpen) DrawRecord();
            if (guideOpen) DrawGuide();
        }

        private void DrawResolution()
        {
            if (campaign == null || resolution == null) return;
            var width = Mathf.Min(940, Screen.width - 80);
            var fieldY = resolution.Choice.Pressure == null ? 80 : 142;
            var rect = new Rect((Screen.width - width) / 2, 125, width, fieldY + 52);
            GUI.Box(rect, "");
            GUI.Label(new Rect(rect.x + 18, rect.y + 12, width - 80, 22), T("consequence"), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + 35, width - 50, 42), campaign.Text(resolution.Choice.Consequence, locale), bodyStyle);
            if (resolution.Choice.Pressure != null)
            {
                GUI.Label(new Rect(rect.x + 18, rect.y + 80, width - 80, 20), T("pressureResponse"), smallStyle);
                GUI.Label(new Rect(rect.x + 18, rect.y + 101, width - 50, 38), campaign.Text(resolution.Choice.Pressure.Reveal, locale), smallStyle);
            }
            GUI.Label(new Rect(rect.x + 18, rect.y + fieldY, width - 80, 20), T("fieldApplied"), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + fieldY + 21, width - 50, 26), campaign.Text(resolution.Condition.Title, locale) + " · " + EffectsText(resolution.FieldDeltas), smallStyle);
            if (GUI.Button(new Rect(rect.x + width - 38, rect.y + 8, 28, 28), "×")) resolution = null;
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

        private void DrawRecord()
        {
            if (campaign == null || state == null) return;
            var width = Mathf.Min(540, Screen.width * 0.58f);
            GUI.Box(new Rect(Screen.width - width, 0, width, Screen.height), "");
            GUI.Label(new Rect(Screen.width - width + 25, 22, width - 90, 50), T("record"), titleStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) CloseTransient();
            if (state.History.Count == 0)
            {
                GUI.Label(new Rect(Screen.width - width + 25, 95, width - 50, 90), T("recordEmpty"), bodyStyle);
                return;
            }
            var y = 92f;
            for (var index = 0; index < state.History.Count; index++)
            {
                var entry = state.History[index];
                var pastNode = campaign.Node(entry.NodeId);
                var choice = pastNode.Choices.Find(candidate => candidate.Id == entry.ChoiceId);
                var condition = pastNode.Conditions.Find(candidate => candidate.Id == entry.ConditionId);
                if (choice == null || condition == null) continue;
                GUI.Label(new Rect(Screen.width - width + 25, y, 32, 24), (index + 1).ToString("00"), smallStyle);
                GUI.Label(new Rect(Screen.width - width + 62, y, width - 87, 28), campaign.Text(choice.Label, locale), bodyStyle);
                GUI.Label(new Rect(Screen.width - width + 62, y + 30, width - 87, 42), campaign.Text(choice.Consequence, locale), smallStyle);
                if (choice.Pressure != null)
                    GUI.Label(new Rect(Screen.width - width + 62, y + 72, width - 87, 45), T("pressureResponse") + ": " + campaign.Text(choice.Pressure.Reveal, locale), smallStyle);
                var fieldY = choice.Pressure == null ? y + 72 : y + 116;
                GUI.Label(new Rect(Screen.width - width + 62, fieldY, width - 87, 42), T("fieldApplied") + ": " + campaign.Text(condition.Title, locale) + " · " + EffectsText(entry.ConditionEffects), smallStyle);
                y += choice.Pressure == null ? 124 : 168;
            }
        }

        private void DrawGuide()
        {
            var width = Mathf.Min(610, Screen.width * 0.62f);
            var x = Screen.width - width;
            GUI.Box(new Rect(x, 0, width, Screen.height), "");
            GUI.Label(new Rect(x + 28, 24, width - 95, 55), T("guideTitle"), titleStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) CloseGuide();
            GUI.Label(new Rect(x + 28, 86, width - 56, 62), T("guideIntro"), bodyStyle);
            var y = 160f;
            DrawGuideStep(new Rect(x + 28, y, width - 56, 112), "一", T("guideFieldTitle"), T("guideFieldText"));
            y += 124;
            DrawGuideStep(new Rect(x + 28, y, width - 56, 112), "二", T("guideMoveTitle"), T("guideMoveText"));
            y += 124;
            DrawGuideStep(new Rect(x + 28, y, width - 56, 112), "三", T("guideReplyTitle"), T("guideReplyText"));
            y += 128;
            GUI.Box(new Rect(x + 28, y, width - 56, 74), "");
            GUI.Label(new Rect(x + 43, y + 10, width - 86, 22), ControllerConnected ? T("controllerReady") : T("controllerOptional"), smallStyle);
            GUI.Label(new Rect(x + 43, y + 32, width - 86, 35), T("controllerHint"), smallStyle);
            if (GUI.Button(new Rect(x + 28, Screen.height - 78, width - 56, 50), T("guideContinue") + "  →", buttonStyle)) CloseGuide();
        }

        private void DrawGuideStep(Rect rect, string number, string heading, string copy)
        {
            GUI.Box(rect, "");
            GUI.Label(new Rect(rect.x + 14, rect.y + 13, 35, 35), number, bodyStyle);
            GUI.Label(new Rect(rect.x + 58, rect.y + 12, rect.width - 74, 26), heading, bodyStyle);
            GUI.Label(new Rect(rect.x + 58, rect.y + 43, rect.width - 74, rect.height - 50), copy, smallStyle);
        }

        private bool ControllerConnected => System.Array.Exists(Input.GetJoystickNames(), name => !string.IsNullOrWhiteSpace(name));

        private void EnterPlay()
        {
            title = false;
            if (!showGuideOnEntry) return;
            showGuideOnEntry = false;
            guideOpen = true;
            sourcesOpen = false;
            recordOpen = false;
        }

        private void ToggleGuide()
        {
            if (guideOpen) { CloseGuide(); return; }
            guideOpen = true;
            sourcesOpen = false;
            recordOpen = false;
        }

        private void ToggleRecord()
        {
            if (guideOpen) CloseGuide();
            recordOpen = !recordOpen;
            if (!recordOpen) return;
            sourcesOpen = false;
            guideOpen = false;
        }

        private void ToggleSources()
        {
            if (guideOpen) CloseGuide();
            sourcesOpen = !sourcesOpen;
            if (!sourcesOpen) return;
            recordOpen = false;
            guideOpen = false;
        }

        private void CloseGuide()
        {
            guideOpen = false;
            showGuideOnEntry = false;
            PlayerPrefs.SetInt(GuideKey, 1);
            PlayerPrefs.Save();
        }

        private void CloseTransient()
        {
            if (guideOpen) CloseGuide();
            sourcesOpen = false;
            recordOpen = false;
            resolution = null;
        }

        private void MoveSelection(int step)
        {
            if (campaign == null || state == null || state.Completed) return;
            var node = campaign.Node(state.CurrentNodeId);
            var available = new List<int>();
            for (var index = 0; index < node.Choices.Count; index++) if (state.CanChoose(node.Choices[index])) available.Add(index);
            if (available.Count == 0) return;
            var current = available.IndexOf(selectedChoiceIndex);
            selectedChoiceIndex = current < 0 ? available[0] : available[(current + step + available.Count) % available.Count];
        }

        private void CommitSelectedChoice()
        {
            if (campaign == null || state == null || state.Completed) return;
            var node = campaign.Node(state.CurrentNodeId);
            if (selectedChoiceIndex < 0 || selectedChoiceIndex >= node.Choices.Count || !state.CanChoose(node.Choices[selectedChoiceIndex]))
            {
                SelectFirstAvailable();
                return;
            }
            CommitChoice(node, node.Choices[selectedChoiceIndex]);
        }

        private void CommitChoice(ShiNode node, ShiChoice choice)
        {
            if (campaign == null || state == null || !state.CanChoose(choice)) return;
            resolution = state.Resolve(node, choice);
            Save();
            if (!state.Completed)
            {
                world?.SetActiveSite(campaign.Node(state.CurrentNodeId).SiteId);
                SelectFirstAvailable();
            }
        }

        private void SelectFirstAvailable()
        {
            if (campaign == null || state == null || state.Completed) { selectedChoiceIndex = 0; return; }
            var node = campaign.Node(state.CurrentNodeId);
            selectedChoiceIndex = node.Choices.FindIndex(state.CanChoose);
            if (selectedChoiceIndex < 0) selectedChoiceIndex = 0;
        }

        private void Restart()
        {
            if (campaign == null || state == null) return;
            PlayerPrefs.DeleteKey(SaveKey);
            PlayerPrefs.DeleteKey(LegacySaveKeyV2);
            PlayerPrefs.DeleteKey(LegacySaveKeyV1);
            PlayerPrefs.SetString(DraftSeedKey, state.Seed.ToString());
            PlayerPrefs.Save();
            state = ShiState.Create(campaign, state.Seed);
            resolution = null;
            sourcesOpen = false;
            recordOpen = false;
            guideOpen = false;
            selectedChoiceIndex = 0;
            world?.SetActiveSite(campaign.Node(campaign.StartNodeId).SiteId);
        }

        private void NewChronicle()
        {
            if (campaign == null) return;
            PlayerPrefs.DeleteKey(SaveKey);
            PlayerPrefs.DeleteKey(LegacySaveKeyV2);
            PlayerPrefs.DeleteKey(LegacySaveKeyV1);
            var seed = NewSeed();
            PlayerPrefs.SetString(DraftSeedKey, seed.ToString());
            PlayerPrefs.Save();
            state = ShiState.Create(campaign, seed);
            title = false;
            resolution = null;
            sourcesOpen = false;
            recordOpen = false;
            guideOpen = false;
            selectedChoiceIndex = 0;
            world?.SetActiveSite(campaign.Node(campaign.StartNodeId).SiteId);
        }

        private string EffectsText(IReadOnlyDictionary<string, int> effects)
        {
            var parts = new List<string>();
            foreach (var pair in effects) parts.Add((pair.Value > 0 ? "+" : "") + pair.Value + " " + T(pair.Key));
            return string.Join(" · ", parts);
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
