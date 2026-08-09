# Engine and workstation status

Last checked: 2026-08-09, Asia/Hong_Kong.

## Selected engines

Unreal Engine 5.8 is now the priority cinematic/3D client by explicit product decision. The Web client remains the playable reference and first-class shipping client. Unity 6 LTS (`6000.0.80f1`, `2dfd32957da2`) remains a maintained shared-schema baseline; it is not the feature-first 3D track.

## Installed and verified

- Node.js 22.21, npm, Git, GitHub CLI.
- Blender 4.0.2; headless render succeeded.
- AgenticApp/LabCanvas scene renderer; PNG and `.blend` generation succeeded.
- Blender GLB and FBX export; GLB re-import succeeded with 19 meshes.
- Xvfb, x11vnc, websockify/noVNC and Chrome/CDP visible playtest stack.
- Unity experimental CLI `0.1.0-beta.3` in the user environment.
- Official Unity Hub AppImage at `~/.local/share/unityhub/UnityHub.AppImage`.
- Unity `2022.3.62f3c1` compatibility editor at `~/Unity/Hub/Editor/2022.3.62f3c1`, registered in Hub with Linux and Web build support plus offline documentation.
- Dedicated Unity desktop: display `:123`, VNC `127.0.0.1:5934`, noVNC `http://127.0.0.1:6134/vnc.html?host=127.0.0.1&port=6134&autoconnect=1&resize=scale`.
- Verified compatibility editor archive: 4,153,503,732 bytes; XZ integrity passed; SHA-256 `ee060f7d5f4753db2154eccb549ef283a08bfa36069178274165074d333f47c1`.

## Open blockers

### Unreal Editor acquisition and native proof

The committed Unreal project now includes a runtime module, canonical schema-v7, character, per-node speaker and edition-registry loaders, act/time/site/speaker and source/claim/rights validation, presentation-independent deterministic campaign session, full six-layer decision resolution, detailed intermediate history, fail-closed save-v6 export/replay, durable-first order/restart transactions, keyboard/controller input, reversible Slate order UI, requirements, all-six-scene progression, a runtime Daze command space, a bounded five-site 3D wartable, nine authoritative command-state signals, deterministic speaker/Keeper council staging, a consequence-cinema grammar, an inspectable historical-basis panel and a canonical procedural soundscape. `FShiOrderTransactionModel` copies the active session, resolves exactly one decision, builds the next briefing, all nine signals, canonical council cast/blocking/disclosure and the complete camera sentence, independently recomputes and exactly compares every field, and leaves active state immutable. GameMode then proves the camera, signal/site actors and both persistent council figures exist and writes the candidate save before it swaps session/world/selection/stage and starts the prepared cinema; write or presentation failure holds the order. Two-step restart prepares and writes its fresh world/stage before replacing the current run. Known/reported/reference sites use distinct cylinder/sphere/cone geometry. Five resource tallies expose exact grain/trust/momentum/people/exposure through text and anchored height; four tactical pieces expose field, pursuit, selected-order method read and carried oath. The speaker and Keeper use explicitly movable multi-part body/head/mantle performance proxies with stable non-color-only slots; name, role and historical/reconstruction provenance remain textual. Figure click, `D`/Gamepad R3/Slate council return, `Tab`/Gamepad RB sites, `C`/Gamepad L3 signals, Shift reverse and `Home` ground return share one reversible inspection model; remote evidence remains site-only with a non-destination boundary. The prepared consequence model binds actual order/oath/pressure/pursuit/method/field/position records to live actors in a 3.52–4.08-second sentence. The first/unknown view and any target beyond 100 Unreal units or 6° cut, bounded neighbors ease through position/rotation/FOV, and each semantic layer owns one exact 40°–58° lens; completion or skip then hands control to the next exact 44° speaker shot. A user-setting-backed **Reduced motion · cuts only** mode is available through Slate, `V` and Gamepad Menu and applies to inspection, consequence travel and speaker handoff without dropping reading time or waking audio. The sound path uses Unreal's current `CreateSoundGenerator`/`ISoundGenerator` boundary, starts silent, arms rather than autoplays a remembered preference, persists independent rain/cue levels, emits semantic select/commit/ending/failure cues and has native contract/determinism/audibility automation source. The Web oracle emits a campaign-hash-bound corpus of all 46 legal fixed-seed terminal routes; Unreal automation now routes every turn through immutable transaction preflight and exact replay before commit, requires the prepared council node to equal the authoritative post-order position, and attacks hidden extra decisions plus resolution/world/selection/council/cinema drift. Separate historical, council, spatial, signal, cinema, save and audio suites retain their coverage. Exact source implementation `5764a2dc7071ea2355214ae1aec6f9922e1a2a65` passes the complete local repository build, and documented boundary `3684bf22dc72770ff4f1f4ad38748ad8a4ceba76` passes `npm ci` with zero vulnerabilities plus the full build from a detached clean worktree. Hosted validation `31303607722` and Pages `31303607727` pass on that exact SHA. These proofs do not compile Unreal headers, execute native tests, inject PIE figure/actor/write failures, observe camera/handoff/lens/reduced-motion behavior, prove final character art or prove audible native output.

No official Unreal installed build is present. Epic's Linux route requires an Epic-account sign-in for the precompiled installed-build ZIP, or an Epic-linked GitHub account for the private source repository. The active GitHub account cannot currently read `EpicGames/UnrealEngine`, so the source route is unavailable. Do not substitute an unofficial engine archive.

Host audit: Ubuntu 24.04, 125 GiB RAM, 28 logical CPUs, two 24 GiB RTX 4090 D GPUs, NVIDIA 595.84 userspace and sufficient free home storage. Epic's current Unreal 5.8 Linux requirements recommend Ubuntu 22.04 or Rocky Linux 8, 32 GiB RAM, 8 GiB VRAM, NVIDIA 570+ and the versioned clang toolchain. Hardware exceeds the baseline; the distribution mismatch and NVIDIA kernel/userspace state keep native import, PIE, Vulkan performance and packaging red until measured.

Resolution path:

1. In the dedicated localhost-only noVNC desktop, sign in at Epic's official Linux download page and download the Unreal 5.8 installed build outside Git.
2. Set `SHI_UNREAL_ROOT`, then run `./scripts/unreal-pipeline.sh projectfiles`, `build`, and `test`; canonical council-staging, fail-closed order-transaction, spatial-wartable, live-command-signal, consequence-cinema, source/claim closure, 46-route replay and procedural-audio suites are the first native behavior gates.
3. Open the project through `./scripts/unreal-pipeline.sh editor`; fix API/import issues under native compiler evidence.
4. Run the complete visible opening speaker/Keeper shot → figure click plus `D`/R3/Slate return → site/signal click and cycle → inspect all nine states → site evidence → council/current ground → select and observe method-read change → issue → verified save/commit → six/seven consequence beats → exact next-speaker handoff → act/time progression route. Inject one missing focus actor, one missing council figure and one candidate-save write failure and prove each holds the order/history/world/cast; repeat for failed two-step restart. Capture natural completion and mid-beat skip in restrained mode, then repeat inspection and one consequence/handoff in persisted cuts-only mode. Confirm exact deltas/text, correct named speaker/provenance, one highlighted target, cut/ease threshold behavior, semantic lenses, input isolation, unchanged history on held actions and no accessibility-to-audio side effect while also reviewing collision, silhouettes, eyelines, lighting/UI/audio, silence before opt-in, mixer persistence, rapid cues and stop/resume.
5. Package Linux, launch from clean output, record receipts, hashes, frame timing and screenshots.

### Unity Editor import/build

The workstation is not authenticated to Unity. On 2026-08-08, Unity CLI installs for available 6000.x releases and direct official archive links redirected to `download.unitychina.cn` paths that returned HTTP 404. The Hub-visible 2022 LTS compatibility build did download from the regional service; its interrupted main transfer was reconstructed from exact HTTP ranges, checked for byte count and XZ integrity, installed, and detected automatically by Hub with Linux and Web modules.

The compatibility executable reports `2022.3.62f3c1` and its licensing client launches successfully. A refreshed 2026-08-09 batch preflight against an ignored compatibility copy again exits with code 1 before project import because no access token, license file or entitlement is available and Unity reports “No valid Unity Editor license found.” Hub's visible license panel says sign-in is required and that no licenses are present. A re-audit also found the former documented VNC/noVNC pair attached to an unrelated older X display; the new `5934`/`6134` pair was verified against Unity Hub on `:123` without disrupting that desktop. A private `.alf` request exists only under ignored `.runtime/`. No credentials, machine identifiers, tokens or license files are committed. The pinned Unity project has therefore **not** passed editor import, C# compilation, test runner, or player build. That gate stays red.

As of 2026-08-09, the expanded runtime, editor and EditMode-test sources—including deliberate select-only order cards, a complete selected-order reading, separate confirmation and eleven-locale decision labels, wartable marker picking, inspected-site state, localized intelligence UI, shared audio contract loading/validation, zero-mean deterministic rain, shared cue envelopes, peak/loudness/DC/loop/channel quality bounds, localized mixer UI, three carried player commitments with nine outcomes, three Qin pursuit postures, three strategic methods, neutral/unique-leader method-read selection, exact hit/miss counterplay, six-layer resolution, save-v6 identity checks, v1–v5 legacy replay and site closure validation—compile as separate assemblies with warnings treated as errors against the installed Unity 2022.3/Newtonsoft/NUnit reference set. Unity preflight independently reconstructs the raw rain and rejects excessive DC offset or a loop-boundary transient outside the shared limit; EditMode source tests also calculate cue peaks and commitment/pursuit/method/save behavior. The deterministic FFmpeg reference and actual-Chrome measurements prove the common authored contract and web path, not Unity's native mixer/output. This remains an offline source-type check, not an Editor import, audio-device review or test run, and does not change the red gate above.

Visible evidence:

- [`unity-01-editor-installed.png`](evidence/unity-01-editor-installed.png): Hub detects the editor with Linux and WebGL modules.
- [`unity-02-license-signin-required.png`](evidence/unity-02-license-signin-required.png): Hub requires account login to manage licenses.
- [`unity-engine-status.json`](evidence/unity-engine-status.json): machine-readable versions, module checks, archive integrity and the exact red gate; it contains no credentials or license material.

Resolution path:

1. Use the visible dedicated desktop to sign in to Unity Hub and activate an eligible Unity license. This is an account-owned action and cannot be fabricated by the build agent.
2. Re-run the compatibility-copy preflight to obtain a compiler result without allowing an older editor to rewrite the Unity 6 project.
3. Install the exact pinned editor plus Linux and Web build support when its official regional object becomes available.
4. Open `apps/unity`, allow package import, and fix migrations intentionally.
5. Run `./scripts/unity-pipeline.sh preflight`, `test`, `linux`, and `web`; then play the Boot scene and record artifact hashes/screenshots here.

### NVIDIA

The loaded NVIDIA kernel module is `595.71.05` while installed userspace reports `595.84`; `nvidia-smi` fails with an NVML mismatch. Chrome WebGL was blocklisted in the first visible test. The noVNC test passed with ANGLE/SwiftShader software WebGL. Blender CPU rendering is unaffected.

Do not reboot or reload production GPU modules without an explicit maintenance window. After maintenance, verify `nvidia-smi`, native Chrome WebGL, Blender CUDA/OptiX, and Unity Vulkan.

## Unreal and Unity coexistence

Both project boundaries consume one canonical payload. New cinematic/3D feature work goes to Unreal; Unity remains buildable reference code while its account license gate is unresolved. The Web TypeScript engine remains the behavioral oracle until cross-engine replay fixtures prove Unreal and Unity parity. Story, effects, chronology and historical classification may never fork between clients.
