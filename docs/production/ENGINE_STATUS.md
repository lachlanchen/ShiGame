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

The committed Unreal project now includes a runtime module, canonical schema-v7 and edition-registry loaders, act/time/site and source/claim/rights validation, presentation-independent deterministic campaign session, full six-layer decision resolution, detailed intermediate history, fail-closed save-v6 export/replay, atomic autosave/resume, protected restart, keyboard/controller input, reversible Slate order UI, requirements, all-six-scene progression, a runtime Daze command space, a bounded five-site 3D wartable, motivated non-drifting camera beats, an inspectable historical-basis panel and a canonical procedural soundscape. Known/reported/reference sites use distinct cylinder/sphere/cone geometry; pointer, `Tab`/Gamepad RB, `Shift+Tab` and `Home` share one focus state, selected markers scale/recolor/use a stencil, and remote evidence is site-only with a non-destination boundary. Layout validation rejects invalid status, bounds and pointer overlap; engine-native shape packages are explicitly cooked. The sound path uses Unreal's current `CreateSoundGenerator`/`ISoundGenerator` boundary, starts silent, arms rather than autoplays a remembered preference, persists independent rain/cue levels, emits semantic select/commit/ending/failure cues and has native contract/determinism/audibility automation source. The Web oracle emits a campaign-hash-bound corpus of all 46 legal fixed-seed terminal routes; Unreal automation is authored to compare every identity, delta and intermediate resource state plus save round-trip/tamper behavior, while separate historical and spatial suites attack evidence drift and unsafe wartable representations. `npm run unreal:preflight` proves project closure and exact canonical/edition/audio/conformance staging; it does not compile Unreal headers, execute those tests, click a marker in PIE or prove audible native output.

No official Unreal installed build is present. Epic's Linux route requires an Epic-account sign-in for the precompiled installed-build ZIP, or an Epic-linked GitHub account for the private source repository. The active GitHub account cannot currently read `EpicGames/UnrealEngine`, so the source route is unavailable. Do not substitute an unofficial engine archive.

Host audit: Ubuntu 24.04, 125 GiB RAM, 28 logical CPUs, two 24 GiB RTX 4090 D GPUs, NVIDIA 595.84 userspace and sufficient free home storage. Epic's current Unreal 5.8 Linux requirements recommend Ubuntu 22.04 or Rocky Linux 8, 32 GiB RAM, 8 GiB VRAM, NVIDIA 570+ and the versioned clang toolchain. Hardware exceeds the baseline; the distribution mismatch and NVIDIA kernel/userspace state keep native import, PIE, Vulkan performance and packaging red until measured.

Resolution path:

1. In the dedicated localhost-only noVNC desktop, sign in at Epic's official Linux download page and download the Unreal 5.8 installed build outside Git.
2. Set `SHI_UNREAL_ROOT`, then run `./scripts/unreal-pipeline.sh projectfiles`, `build`, and `test`; spatial-wartable, source/claim closure, 46-route replay and procedural-audio suites are the first native behavior gates.
3. Open the project through `./scripts/unreal-pipeline.sh editor`; fix API/import issues under native compiler evidence.
4. Run the complete visible marker click/cycle → site evidence → return to current ground → select → issue → consequence → act/time progression route and review camera/lighting/UI/audio together, including exact camera return, silence before opt-in, mixer persistence, rapid cues and stop/resume.
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
