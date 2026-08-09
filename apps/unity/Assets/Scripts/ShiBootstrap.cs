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
        private const string SaveKey = "shi.chapter-01.state.v5";
        private const string LegacySaveKeyV4 = "shi.chapter-01.state.v4";
        private const string LegacySaveKeyV3 = "shi.chapter-01.state.v3";
        private const string LegacySaveKeyV2 = "shi.chapter-01.state.v2";
        private const string LegacySaveKeyV1 = "shi.chapter-01.state.v1";
        private const string DraftSeedKey = "shi.chapter-01.seed.v1";
        private const string GuideKey = "shi.onboarding.field-guide.v1";
        private readonly string[] locales = { "en", "zh-Hans", "zh-Hant", "ja", "ko", "vi", "ar", "fr", "es", "ru", "de" };
        private readonly string[] resources = { "grain", "trust", "momentum", "people", "danger" };
        private ShiCampaign? campaign;
        private ShiState? state;
        private ShiAudioDirector? audioDirector;
        private WarTableWorld? world;
        private Texture2D? keyArt;
        private string locale = "en";
        private bool title = true;
        private bool sourcesOpen;
        private bool recordOpen;
        private bool guideOpen;
        private bool audioOpen;
        private bool showGuideOnEntry;
        private string inspectedSiteId = "";
        private string sourceSiteId = "";
        private int selectedChoiceIndex;
        private float previousHorizontal;
        private float previousVertical;
        private string error = "";
        private ShiResolution? resolution;
        private Vector2 sourceScroll;
        private Vector2 recordScroll;
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
            ShiAudioContract? audioContract = null;
            yield return LoadText("chapter-01-audio.json", text => audioContract = JsonConvert.DeserializeObject<ShiAudioContract>(text));
            yield return LoadTexture("daze-village-rain-v1.png", texture => keyArt = texture);
            if (campaign == null) yield break;
            if (audioContract != null)
            {
                audioDirector = gameObject.AddComponent<ShiAudioDirector>();
                audioDirector.Initialize(audioContract);
            }
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
            if (back && (guideOpen || sourcesOpen || recordOpen || audioOpen || resolution != null))
            {
                CloseTransient();
                return;
            }
            if (back && !string.IsNullOrEmpty(inspectedSiteId))
            {
                ClearMapInspection();
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
            if (Input.GetKeyDown(KeyCode.M) || Input.GetKeyDown(KeyCode.JoystickButton3)) { ToggleMapInspection(); return; }
            if (guideOpen || sourcesOpen || recordOpen || audioOpen)
            {
                if (confirm && guideOpen) CloseGuide();
                return;
            }
            if (resolution != null)
            {
                if (confirm) resolution = null;
                return;
            }
            if (Input.GetMouseButtonDown(0)
                && Input.mousePosition.x < Screen.width * .43f
                && Input.mousePosition.y > 240
                && Input.mousePosition.y < Screen.height - 130
                && world != null
                && world.TryPickSite(Input.mousePosition, out var pickedSiteId))
            {
                InspectSite(pickedSiteId);
                return;
            }
            if (!string.IsNullOrEmpty(inspectedSiteId))
            {
                if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.JoystickButton12) || Input.GetKeyDown(KeyCode.JoystickButton14)) CycleMapInspection(-1);
                else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.DownArrow) || Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.JoystickButton13) || Input.GetKeyDown(KeyCode.JoystickButton15)) CycleMapInspection(1);
                else if (Mathf.Abs(horizontal) >= .65f && Mathf.Abs(lastHorizontal) <= .35f) CycleMapInspection(horizontal > 0 ? 1 : -1);
                else if (Mathf.Abs(vertical) >= .65f && Mathf.Abs(lastVertical) <= .35f) CycleMapInspection(vertical > 0 ? 1 : -1);
                if (confirm) OpenInspectedSources();
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
            foreach (var key in new[] { SaveKey, LegacySaveKeyV4, LegacySaveKeyV3, LegacySaveKeyV2, LegacySaveKeyV1 })
            {
                if (!PlayerPrefs.HasKey(key)) continue;
                try
                {
                    var loaded = JsonConvert.DeserializeObject<ShiState>(PlayerPrefs.GetString(key));
                    var replayed = campaign == null ? null : ShiState.Replay(campaign, loaded);
                    if (replayed == null || replayed.History.Count == 0) continue;
                    PlayerPrefs.SetString(SaveKey, JsonConvert.SerializeObject(replayed));
                    PlayerPrefs.DeleteKey(LegacySaveKeyV4);
                    PlayerPrefs.DeleteKey(LegacySaveKeyV3);
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
            if (audioDirector != null && GUI.Button(new Rect(panel.x + 330, panel.y + 360, 175, 32), audioDirector.Enabled ? T("soundOn") : T("soundOff")))
            {
                audioDirector.SetEnabled(!audioDirector.Enabled);
                if (audioDirector.Enabled) audioDirector.PlayCue("drawer");
            }
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
            var oppositionStage = state.ActiveOppositionStage(campaign);
            var methodRead = state.ActiveMethodRead(campaign);
            GUI.Box(new Rect(0, 0, Screen.width, 74), "");
            if (GUI.Button(new Rect(32, 16, 205, 40), "勢  SHI", GUI.skin.button)) { title = true; audioDirector?.SetAmbienceActive(false); }
            if (GUI.Button(new Rect(260, 20, 105, 30), T("guide"))) ToggleGuide();
            if (GUI.Button(new Rect(375, 20, 105, 30), T("record") + $"  {state.History.Count}")) ToggleRecord();
            if (GUI.Button(new Rect(490, 20, 105, 30), T("sources") + $"  {node.SourceRefs.Count}")) ToggleSources();
            if (GUI.Button(new Rect(605, 20, 130, 30), T("inspectMap"))) ToggleMapInspection();
            if (GUI.Button(new Rect(745, 20, 100, 30), T("sound"))) ToggleAudio();
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
            GUI.Box(new Rect(32, 286, storyX - 64, 142), "");
            GUI.Label(new Rect(48, 296, storyX - 96, 18), T("opponentPosture") + " · " + T("reconstruction"), smallStyle);
            GUI.Label(new Rect(48, 317, storyX - 96, 25), campaign.Text(campaign.Opposition.Title, locale) + " · " + campaign.Text(oppositionStage.Title, locale), bodyStyle);
            GUI.Label(new Rect(48, 344, storyX - 96, 36), campaign.Text(oppositionStage.Forecast, locale), smallStyle);
            GUI.Label(new Rect(48, 382, storyX - 96, 18), oppositionStage.Effects.Count == 0 ? T("noAddedPressure") : EffectsText(oppositionStage.Effects), smallStyle);
            GUI.Label(new Rect(48, 403, storyX - 96, 20), T("counterplay") + ": " + campaign.Text(oppositionStage.Counterplay, locale), smallStyle);
            var methodReadTitle = methodRead.Countermeasure?.Title ?? methodRead.Neutral!.Title;
            var methodReadForecast = methodRead.Countermeasure?.Forecast ?? methodRead.Neutral!.Forecast;
            var methodReadCounterplay = methodRead.Countermeasure?.Counterplay ?? methodRead.Neutral!.Counterplay;
            var methodCounts = string.Join(" · ", campaign.Opposition.Methods.ConvertAll(method => $"{campaign.Text(method.Title, locale)} {methodRead.Counts.GetValueOrDefault(method.Id)}"));
            GUI.Box(new Rect(32, 438, storyX - 64, 164), "");
            GUI.Label(new Rect(48, 448, storyX - 96, 18), T("methodRead") + " · " + T("reconstruction"), smallStyle);
            GUI.Label(new Rect(48, 469, storyX - 96, 24), campaign.Text(campaign.Opposition.MethodRead.Title, locale) + " · " + campaign.Text(methodReadTitle, locale), bodyStyle);
            GUI.Label(new Rect(48, 495, storyX - 96, 35), methodCounts, smallStyle);
            GUI.Label(new Rect(48, 531, storyX - 96, 34), campaign.Text(methodReadForecast, locale), smallStyle);
            GUI.Label(new Rect(48, 566, storyX - 96, 17), methodRead.Effects.Count == 0 ? T("noAddedPressure") : EffectsText(methodRead.Effects), smallStyle);
            GUI.Label(new Rect(48, 584, storyX - 96, 17), T("counterplay") + ": " + campaign.Text(methodReadCounterplay, locale), smallStyle);
            GUI.Label(new Rect(storyX, 145, storyWidth, 28), campaign.Text(node.DateLabel, locale).ToUpperInvariant(), smallStyle);
            GUI.Label(new Rect(storyX, 177, storyWidth, 75), campaign.Text(node.Title, locale), titleStyle);
            GUI.Label(new Rect(storyX, 258, storyWidth, 110), campaign.Text(node.Context, locale), bodyStyle);
            GUI.Box(new Rect(storyX, 380, storyWidth, 105), "");
            GUI.Label(new Rect(storyX + 18, 394, storyWidth - 36, 76), campaign.Text(node.Dialogue, locale), bodyStyle);
            if (GUI.Button(new Rect(storyX, 495, 180, 32), $"{T("sources")} · {node.SourceRefs.Count}")) ToggleSources();

            if (!state.Completed)
            {
                var choiceY = Screen.height - 255;
                var choiceWidth = (Screen.width - 64f - 14f * (node.Choices.Count - 1)) / node.Choices.Count;
                for (var index = 0; index < node.Choices.Count; index++)
                {
                    var choice = node.Choices[index];
                    var method = campaign.Method(choice.MethodId);
                    var readMatched = methodRead.TargetMethodId == method.Id;
                    GUI.enabled = state.CanChoose(choice);
                    var text = $"{(char)('A' + index)}   {campaign.Text(choice.Label, locale)}\n<size=13>{campaign.Text(choice.Intent, locale)}</size>";
                    text += $"\n<size=12><color=#78AAA0>{T("method")}: {campaign.Text(method.Title, locale)} · {T(readMatched ? "readHits" : "readMisses")} · {(readMatched ? EffectsText(methodRead.Effects) : T("noAddedPressure"))}</color></size>";
                    if (choice.Pressure != null)
                        text += $"\n<size=12><color=#B88976>{T("pressureForecast")}: {campaign.Text(choice.Pressure.Warning, locale)}</color></size>";
                    var style = index == selectedChoiceIndex ? selectedButtonStyle : buttonStyle;
                    if (GUI.Button(new Rect(32 + index * (choiceWidth + 14), choiceY, choiceWidth, 200), text, style))
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

            if (!string.IsNullOrEmpty(inspectedSiteId)) DrawSiteInspector();
            if (resolution != null) DrawResolution();
            if (sourcesOpen) DrawSources(node);
            if (recordOpen) DrawRecord();
            if (guideOpen) DrawGuide();
            if (audioOpen) DrawAudio();
        }

        private void DrawResolution()
        {
            if (campaign == null || resolution == null) return;
            var width = Mathf.Min(940, Screen.width - 80);
            var oppositionY = resolution.Choice.Pressure == null ? 80 : 142;
            var methodReadY = oppositionY + 62;
            var fieldY = methodReadY + 62;
            var rect = new Rect((Screen.width - width) / 2, 125, width, fieldY + 52);
            GUI.Box(rect, "");
            GUI.Label(new Rect(rect.x + 18, rect.y + 12, width - 80, 22), T("consequence"), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + 35, width - 50, 42), campaign.Text(resolution.Choice.Consequence, locale), bodyStyle);
            if (resolution.Choice.Pressure != null)
            {
                GUI.Label(new Rect(rect.x + 18, rect.y + 80, width - 80, 20), T("pressureResponse"), smallStyle);
                GUI.Label(new Rect(rect.x + 18, rect.y + 101, width - 50, 38), campaign.Text(resolution.Choice.Pressure.Reveal, locale), smallStyle);
            }
            if (resolution.OppositionStage != null)
            {
                GUI.Label(new Rect(rect.x + 18, rect.y + oppositionY, width - 80, 20), T("opponentResponse") + " · " + campaign.Text(resolution.OppositionStage.Title, locale), smallStyle);
                var effects = resolution.OppositionDeltas.Count == 0 ? T("noAddedPressure") : EffectsText(resolution.OppositionDeltas);
                GUI.Label(new Rect(rect.x + 18, rect.y + oppositionY + 21, width - 50, 38), campaign.Text(resolution.OppositionStage.Response, locale) + " · " + effects, smallStyle);
            }
            if (resolution.MethodRead != null)
            {
                var read = resolution.MethodRead;
                var readTitle = read.Countermeasure?.Title ?? read.Neutral!.Title;
                var response = read.Countermeasure == null ? read.Neutral!.Response : resolution.MethodReadMatched ? read.Countermeasure.HitResponse : read.Countermeasure.MissResponse;
                var effects = resolution.MethodReadDeltas.Count == 0 ? T("noAddedPressure") : EffectsText(resolution.MethodReadDeltas);
                GUI.Label(new Rect(rect.x + 18, rect.y + methodReadY, width - 80, 20), T(resolution.MethodReadMatched ? "readHits" : "readMisses") + " · " + campaign.Text(readTitle, locale), smallStyle);
                GUI.Label(new Rect(rect.x + 18, rect.y + methodReadY + 21, width - 50, 38), campaign.Text(response, locale) + " · " + campaign.Text(resolution.Method.Title, locale) + " · " + effects, smallStyle);
            }
            GUI.Label(new Rect(rect.x + 18, rect.y + fieldY, width - 80, 20), T("fieldApplied"), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + fieldY + 21, width - 50, 26), campaign.Text(resolution.Condition.Title, locale) + " · " + EffectsText(resolution.FieldDeltas), smallStyle);
            if (GUI.Button(new Rect(rect.x + width - 38, rect.y + 8, 28, 28), "×")) resolution = null;
        }

        private void DrawSiteInspector()
        {
            if (campaign == null) return;
            var site = campaign.Sites.Find(candidate => candidate.Id == inspectedSiteId);
            if (site == null) return;
            var storyX = Screen.width * .43f;
            var height = Mathf.Clamp(Screen.height - 688, 140, 320);
            var rect = new Rect(32, 438, storyX - 64, height);
            GUI.Box(rect, "");
            GUI.Label(new Rect(rect.x + 18, rect.y + 13, rect.width - 64, 20), SiteStatus(site).ToUpperInvariant(), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + 38, rect.width - 58, 36), campaign.Text(site.Name, locale), bodyStyle);
            if (GUI.Button(new Rect(rect.x + rect.width - 38, rect.y + 10, 27, 27), "×")) { ClearMapInspection(); return; }
            GUI.Label(new Rect(rect.x + 18, rect.y + 79, rect.width - 36, 64), campaign.Text(site.Summary, locale), bodyStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + 147, rect.width - 36, 18), T("uncertainty").ToUpperInvariant(), smallStyle);
            GUI.Label(new Rect(rect.x + 18, rect.y + 168, rect.width - 36, 50), campaign.Text(site.Uncertainty, locale), smallStyle);
            var buttonY = rect.y + rect.height - 46;
            if (GUI.Button(new Rect(rect.x + 18, buttonY, 210, 30), T("sources") + $"  {site.SourceRefs.Count}")) OpenInspectedSources();
            var index = campaign.Sites.FindIndex(candidate => candidate.Id == site.Id) + 1;
            GUI.Label(new Rect(rect.x + 240, buttonY + 6, rect.width - 258, 23), $"← → · Enter / A · {index}/{campaign.Sites.Count}", smallStyle);
        }

        private void DrawSources(ShiNode node)
        {
            if (campaign == null) return;
            var site = string.IsNullOrEmpty(sourceSiteId) ? null : campaign.Sites.Find(candidate => candidate.Id == sourceSiteId);
            var sourceIds = site == null ? node.SourceRefs : site.SourceRefs;
            var claimIds = site == null ? node.ClaimRefs : site.ClaimRefs;
            var width = Mathf.Min(640, Screen.width * 0.62f);
            GUI.Box(new Rect(Screen.width - width, 0, width, Screen.height), "");
            GUI.Label(new Rect(Screen.width - width + 25, 22, width - 90, 50), T("sources"), titleStyle);
            if (site != null) GUI.Label(new Rect(Screen.width - width + 27, 65, width - 86, 22), campaign.Text(site.Name, locale) + " · " + T("publicSource"), smallStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) CloseSources();
            var sources = sourceIds
                .ConvertAll(id => campaign.Sources.Find(item => item.Id == id))
                .FindAll(source => source != null);
            var claims = claimIds
                .ConvertAll(id => campaign.Claims.Find(item => item.Id == id))
                .FindAll(claim => claim != null);
            var contentHeight = sources.Count * 168 + claims.Count * 174 + 135;
            var viewport = new Rect(Screen.width - width + 18, site == null ? 82 : 92, width - 30, Screen.height - (site == null ? 94 : 104));
            sourceScroll = GUI.BeginScrollView(viewport, sourceScroll, new Rect(0, 0, width - 55, contentHeight));
            var y = 8f;
            foreach (var source in sources)
            {
                if (source == null) continue;
                GUI.Box(new Rect(5, y, width - 80, 155), "");
                GUI.Label(new Rect(18, y + 10, width - 110, 20), SourceStatus(source), smallStyle);
                GUI.Label(new Rect(18, y + 31, width - 110, 28), source.Work, bodyStyle);
                GUI.Label(new Rect(18, y + 60, width - 110, 23), source.Locator, smallStyle);
                GUI.Label(new Rect(18, y + 84, width - 110, 43), campaign.Text(source.Note, locale), smallStyle);
                if (!string.IsNullOrWhiteSpace(source.Url) && GUI.Button(new Rect(18, y + 127, 180, 22), T("openEdition") + "  ↗")) Application.OpenURL(source.Url);
                y += 168;
            }
            GUI.Label(new Rect(8, y + 6, width - 90, 32), T("claimRegister"), titleStyle);
            GUI.Label(new Rect(8, y + 38, width - 90, 22), T("publicSource"), smallStyle);
            y += 66;
            foreach (var claim in claims)
            {
                if (claim == null) continue;
                GUI.Box(new Rect(5, y, width - 80, 161), "");
                GUI.Label(new Rect(18, y + 10, width - 110, 20), ClaimStatus(claim) + " · " + claim.Confidence, smallStyle);
                GUI.Label(new Rect(18, y + 32, width - 110, 45), campaign.Text(claim.Statement, locale), bodyStyle);
                GUI.Label(new Rect(18, y + 80, width - 110, 42), campaign.Text(claim.Uncertainty, locale), smallStyle);
                GUI.Label(new Rect(18, y + 124, width - 110, 32), campaign.Text(claim.GameUse, locale), smallStyle);
                y += 174;
            }
            GUI.EndScrollView();
        }

        private string SourceStatus(ShiSource source) => source.ClaimStatus switch
        {
            "dramatic-reconstruction" => T("reconstruction"),
            "later-compilation" => T("later"),
            "strategic-text" => T("strategicText"),
            _ => T("received"),
        };

        private string ClaimStatus(ShiClaim claim) => claim.ReviewStatus switch
        {
            "specialist-review-required" => T("specialistReview"),
            "authored-reconstruction" => T("authoredClaim"),
            _ => T("evidenceLocated"),
        };

        private string SiteStatus(ShiSite site) => site.Status switch
        {
            "known" => T("knownGround"),
            "reported" => T("reportedGround"),
            _ => T("referenceOnly"),
        };

        private void DrawRecord()
        {
            if (campaign == null || state == null) return;
            var width = Mathf.Min(540, Screen.width * 0.58f);
            var x = Screen.width - width;
            GUI.Box(new Rect(Screen.width - width, 0, width, Screen.height), "");
            GUI.Label(new Rect(x + 25, 22, width - 90, 50), T("record"), titleStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) CloseTransient();
            if (state.History.Count == 0)
            {
                GUI.Label(new Rect(x + 25, 95, width - 50, 90), T("recordEmpty"), bodyStyle);
                return;
            }
            var contentHeight = state.History.Count * 260 + 70;
            recordScroll = GUI.BeginScrollView(new Rect(x + 18, 82, width - 30, Screen.height - 94), recordScroll, new Rect(0, 0, width - 55, contentHeight));
            var y = 8f;
            for (var index = 0; index < state.History.Count; index++)
            {
                var entry = state.History[index];
                var pastNode = campaign.Node(entry.NodeId);
                var choice = pastNode.Choices.Find(candidate => candidate.Id == entry.ChoiceId);
                var condition = pastNode.Conditions.Find(candidate => candidate.Id == entry.ConditionId);
                if (choice == null || condition == null) continue;
                var opposition = string.IsNullOrEmpty(entry.OppositionStageId) ? null : campaign.Opposition.Stages.Find(stage => stage.Id == entry.OppositionStageId);
                var method = string.IsNullOrEmpty(entry.MethodId) ? null : campaign.Opposition.Methods.Find(candidate => candidate.Id == entry.MethodId);
                var methodCounter = string.IsNullOrEmpty(entry.MethodReadId) ? null : campaign.Opposition.MethodRead.Countermeasures.Find(candidate => candidate.Id == entry.MethodReadId);
                var neutralRead = entry.MethodReadId == campaign.Opposition.MethodRead.Neutral.Id ? campaign.Opposition.MethodRead.Neutral : null;
                GUI.Label(new Rect(7, y, 32, 24), (index + 1).ToString("00"), smallStyle);
                GUI.Label(new Rect(44, y, width - 99, 28), campaign.Text(choice.Label, locale), bodyStyle);
                GUI.Label(new Rect(44, y + 30, width - 99, 42), campaign.Text(choice.Consequence, locale), smallStyle);
                var detailY = y + 72;
                if (choice.Pressure != null)
                {
                    GUI.Label(new Rect(44, detailY, width - 99, 40), T("pressureResponse") + ": " + campaign.Text(choice.Pressure.Reveal, locale), smallStyle);
                    detailY += 42;
                }
                if (opposition != null)
                {
                    var effects = entry.OppositionEffects.Count == 0 ? T("noAddedPressure") : EffectsText(entry.OppositionEffects);
                    GUI.Label(new Rect(44, detailY, width - 99, 40), T("opponentResponse") + ": " + campaign.Text(opposition.Title, locale) + " · " + effects, smallStyle);
                    detailY += 42;
                }
                if (method != null && (methodCounter != null || neutralRead != null))
                {
                    var readTitle = methodCounter?.Title ?? neutralRead!.Title;
                    var effects = entry.MethodReadEffects.Count == 0 ? T("noAddedPressure") : EffectsText(entry.MethodReadEffects);
                    GUI.Label(new Rect(44, detailY, width - 99, 40), T(entry.MethodReadMatched == true ? "readHits" : "readMisses") + ": " + campaign.Text(readTitle, locale) + " · " + campaign.Text(method.Title, locale) + " · " + effects, smallStyle);
                    detailY += 42;
                }
                GUI.Label(new Rect(44, detailY, width - 99, 40), T("fieldApplied") + ": " + campaign.Text(condition.Title, locale) + " · " + EffectsText(entry.ConditionEffects), smallStyle);
                y = detailY + 54;
            }
            if (GUI.Button(new Rect(44, y + 2, 190, 32), T("restart") + "  ↺")) Restart();
            GUI.EndScrollView();
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
            GUI.Label(new Rect(x + 43, y + 32, width - 86, 35), T("controllerHint") + " · Y/△ " + T("inspectMap"), smallStyle);
            if (GUI.Button(new Rect(x + 28, Screen.height - 78, width - 56, 50), T("guideContinue") + "  →", buttonStyle)) CloseGuide();
        }

        private void DrawAudio()
        {
            if (audioDirector == null) return;
            var width = Mathf.Min(500, Screen.width * .64f);
            var x = Screen.width - width;
            GUI.Box(new Rect(x, 0, width, Screen.height), "");
            GUI.Label(new Rect(x + 28, 24, width - 95, 55), T("audioTitle"), titleStyle);
            if (GUI.Button(new Rect(Screen.width - 55, 22, 32, 32), "×")) { audioOpen = false; audioDirector.PlayCue("close"); return; }
            GUI.Label(new Rect(x + 28, 90, width - 56, 65), T("audioIntro"), bodyStyle);

            var enabled = GUI.Toggle(new Rect(x + 28, 170, width - 56, 38), audioDirector.Enabled, T("enableSound"));
            if (enabled != audioDirector.Enabled)
            {
                audioDirector.SetEnabled(enabled);
                if (enabled) audioDirector.PlayCue("drawer");
            }

            GUI.enabled = audioDirector.Enabled;
            GUI.Label(new Rect(x + 28, 235, width - 56, 28), T("ambience") + $"  {Mathf.RoundToInt(audioDirector.Ambience / audioDirector.AmbienceCap * 100)}%", bodyStyle);
            var ambience = GUI.HorizontalSlider(new Rect(x + 28, 272, width - 56, 28), audioDirector.Ambience, 0, audioDirector.AmbienceCap);
            if (!Mathf.Approximately(ambience, audioDirector.Ambience)) audioDirector.SetAmbience(ambience);
            GUI.Label(new Rect(x + 28, 325, width - 56, 28), T("effects") + $"  {Mathf.RoundToInt(audioDirector.Effects / audioDirector.EffectsCap * 100)}%", bodyStyle);
            var effects = GUI.HorizontalSlider(new Rect(x + 28, 362, width - 56, 28), audioDirector.Effects, 0, audioDirector.EffectsCap);
            if (!Mathf.Approximately(effects, audioDirector.Effects)) audioDirector.SetEffects(effects);
            if (GUI.Button(new Rect(x + 28, 415, width - 56, 46), T("preview"))) audioDirector.PlayCue("commit");
            GUI.enabled = true;
            GUI.Label(new Rect(x + 28, 482, width - 56, 48), T("audioReview"), smallStyle);
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
            audioDirector?.SetAmbienceActive(true);
            audioDirector?.PlayCue("drawer");
            if (!showGuideOnEntry) return;
            showGuideOnEntry = false;
            guideOpen = true;
            sourcesOpen = false;
            recordOpen = false;
            audioOpen = false;
        }

        private void ToggleGuide()
        {
            if (guideOpen) { CloseGuide(); return; }
            ClearMapInspection();
            guideOpen = true;
            sourcesOpen = false;
            sourceSiteId = "";
            recordOpen = false;
            audioOpen = false;
            audioDirector?.PlayCue("drawer");
        }

        private void ToggleRecord()
        {
            if (guideOpen) CloseGuide();
            recordOpen = !recordOpen;
            if (!recordOpen) return;
            recordScroll = Vector2.zero;
            ClearMapInspection();
            sourcesOpen = false;
            sourceSiteId = "";
            guideOpen = false;
            audioOpen = false;
            audioDirector?.PlayCue("drawer");
        }

        private void ToggleSources()
        {
            if (guideOpen) CloseGuide();
            sourcesOpen = !sourcesOpen;
            if (!sourcesOpen) { sourceSiteId = ""; return; }
            ClearMapInspection();
            sourceSiteId = "";
            sourceScroll = Vector2.zero;
            recordOpen = false;
            guideOpen = false;
            audioOpen = false;
            audioDirector?.PlayCue("drawer");
        }

        private void ToggleAudio()
        {
            if (audioDirector == null) return;
            if (audioOpen) { audioOpen = false; audioDirector.PlayCue("close"); return; }
            ClearMapInspection();
            audioOpen = true;
            sourcesOpen = false;
            sourceSiteId = "";
            recordOpen = false;
            guideOpen = false;
            resolution = null;
            audioDirector.PlayCue("drawer");
        }

        private void ToggleMapInspection()
        {
            if (campaign == null || state == null) return;
            if (!string.IsNullOrEmpty(inspectedSiteId)) { ClearMapInspection(); return; }
            CloseTransient();
            InspectSite(campaign.Node(state.CurrentNodeId).SiteId);
        }

        private void InspectSite(string siteId)
        {
            if (campaign == null || campaign.Sites.Find(candidate => candidate.Id == siteId) == null) return;
            inspectedSiteId = siteId;
            sourceSiteId = "";
            world?.SetInspectedSite(siteId);
            audioDirector?.PlayCue("inspect");
        }

        private void ClearMapInspection()
        {
            inspectedSiteId = "";
            sourceSiteId = "";
            world?.SetInspectedSite(null);
        }

        private void CycleMapInspection(int step)
        {
            if (campaign == null || campaign.Sites.Count == 0) return;
            var index = campaign.Sites.FindIndex(candidate => candidate.Id == inspectedSiteId);
            var next = index < 0 ? 0 : (index + step + campaign.Sites.Count) % campaign.Sites.Count;
            InspectSite(campaign.Sites[next].Id);
        }

        private void OpenInspectedSources()
        {
            if (string.IsNullOrEmpty(inspectedSiteId)) return;
            sourceSiteId = inspectedSiteId;
            sourceScroll = Vector2.zero;
            sourcesOpen = true;
            recordOpen = false;
            guideOpen = false;
            audioOpen = false;
            audioDirector?.PlayCue("drawer");
        }

        private void CloseSources()
        {
            sourcesOpen = false;
            sourceSiteId = "";
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
            sourceSiteId = "";
            recordOpen = false;
            audioOpen = false;
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
            audioDirector?.PlayCue("select");
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
            ClearMapInspection();
            resolution = state.Resolve(campaign, node, choice);
            Save();
            audioDirector?.PlayCue(state.Completed ? (state.FailureReason != null ? "failure" : "ending") : "commit");
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
            PlayerPrefs.DeleteKey(LegacySaveKeyV4);
            PlayerPrefs.DeleteKey(LegacySaveKeyV3);
            PlayerPrefs.DeleteKey(LegacySaveKeyV2);
            PlayerPrefs.DeleteKey(LegacySaveKeyV1);
            PlayerPrefs.SetString(DraftSeedKey, state.Seed.ToString());
            PlayerPrefs.Save();
            state = ShiState.Create(campaign, state.Seed);
            resolution = null;
            sourcesOpen = false;
            recordOpen = false;
            guideOpen = false;
            audioOpen = false;
            ClearMapInspection();
            selectedChoiceIndex = 0;
            world?.SetActiveSite(campaign.Node(campaign.StartNodeId).SiteId);
        }

        private void NewChronicle()
        {
            if (campaign == null) return;
            PlayerPrefs.DeleteKey(SaveKey);
            PlayerPrefs.DeleteKey(LegacySaveKeyV4);
            PlayerPrefs.DeleteKey(LegacySaveKeyV3);
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
            audioOpen = false;
            ClearMapInspection();
            selectedChoiceIndex = 0;
            world?.SetActiveSite(campaign.Node(campaign.StartNodeId).SiteId);
        }

        private string EffectsText(IReadOnlyDictionary<string, int> effects)
        {
            var parts = new List<string>();
            foreach (var pair in effects) parts.Add((pair.Value > 0 ? "+" : "") + pair.Value + " " + T(pair.Key));
            return string.Join(" · ", parts);
        }

        private string T(string key) => ShiAudioUiText.Get(locale, key) ?? ShiUiText.Get(locale, key);

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
