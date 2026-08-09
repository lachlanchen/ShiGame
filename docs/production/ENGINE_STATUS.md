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
- Epic official Unreal Engine `5.8.1` installed build (changelist `56057345`); archive integrity, staged extraction and atomic outside-Git installation passed.
- Unreal project-file generation, `SHIEditor` compilation/linking with bundled Clang 20.1.8, and the exact eleven-suite `SHI.` native automation run; all eleven suites pass with exit code 0, including the 76-route Broken Crossing parity and bounded six-piece spatial contract.
- Stable visible fixed-window Unreal standalone route on the localhost-only `:121` noVNC desktop: canonical council, three tactical pulses, separate field answers, terminal outcome, six simultaneous 3D tallies and exact campaign-save preservation all observed.
- Official UE 5.8.1 Linux development package: BuildCookRun exits 0, cooks 496 packages, archives a 1,099,965,122-byte outside-Git player, and preserves byte-identical campaign and engagement StreamingAssets.
- Normal-thread packaged Vulkan player: complete Broken Crossing route and exact save isolation observed. A real 60 Hz display FPS chart records 195.18 FPS average with zero hitches and zero missed 30/60/120-FPS targets; Xvfb/noVNC remains capture/presentation-limited and is not used as the product performance result.
- Unity experimental CLI `0.1.0-beta.3` in the user environment.
- Official Unity Hub AppImage at `~/.local/share/unityhub/UnityHub.AppImage`.
- Unity `2022.3.62f3c1` compatibility editor at `~/Unity/Hub/Editor/2022.3.62f3c1`, registered in Hub with Linux and Web build support plus offline documentation.
- Dedicated Unity desktop: display `:123`, VNC `127.0.0.1:5934`, noVNC `http://127.0.0.1:6134/vnc.html?host=127.0.0.1&port=6134&autoconnect=1&resize=scale`.
- Verified compatibility editor archive: 4,153,503,732 bytes; XZ integrity passed; SHA-256 `ee060f7d5f4753db2154eccb549ef283a08bfa36069178274165074d333f47c1`.

## Open blockers

### Unreal visible-play, package and remaining runtime proof

The official installed build now compiles the committed Unreal runtime and executes the project automation. Project generation uses Epic's Linux batch script; targets use Unreal 5.8's `BuildSettingsVersion.V7`; `SHIEditor` compiles and links with bundled Clang 20.1.8. The exact `SHI.` namespace discovers eleven—not similarly named engine—suites. Audio, all 46 campaign replays, immutable order transaction, save integrity, schema horizon, canonical council staging, consequence grammar, nine campaign signals, 76-route Broken Crossing parity with six bounded spatial tallies, historical source/claim closure and wartable spatial intelligence all pass with exit code 0. Native execution also exposed and drove correction of a Keeper self-speaker defect in `broken-crossing`; regenerated fixtures now bind campaign SHA-256 `a82ab2f28809b46fb780074cce8acb96a7eb0b7cd608868f03b1888b64acf1f0`. Tests use `-nowrite`, and tracked Unreal configuration remains byte-identical across the run.

The three-pulse exercise now passes both visible standalone and archived-package routes on display `:121`. The actual packaged player advanced through two durable campaign decisions, selected and issued three tactical orders, received three separate authored field answers, reached **Costly success · Crossing under pressure**, saw all six metric pieces together and returned to the canonical council. The packaged on-disk campaign save SHA-256 was exactly `e9cbb4c857005fc04ac3dfe63b735296566655e0675e12c8045e8ccede2f42e8` before the first pulse, after the outcome and after close. The first standalone camera composition hid five pieces behind Slate; visible review caught it and the framing was corrected before package acceptance.

The official UE 5.8.1 package command completed compile, cook, stage and archive with exit code 0 in 102.32 seconds. It cooked 496 packages into a 1,099,965,122-byte outside-Git archive. The canonical, staged and packaged campaign payloads are byte-identical at SHA-256 `a82ab2f28809b46fb780074cce8acb96a7eb0b7cd608868f03b1888b64acf1f0`; the corresponding engagement payloads are byte-identical at `e5e7d40076e456c4044ab92f04209095af13fa5ff9599a66601f030b15133b8c`. Exact artifact hashes and performance receipts are recorded in [`unreal-linux-package-status.json`](evidence/unreal-linux-package-status.json).

Normal render and RHI threads are green for the packaged fixed-window route. The player recovered from one startup outdated-swapchain notification, remained stable through the complete engagement and preserved the save. Unreal's built-in physical-display chart collected 4,180 frames over 21.42 seconds at 195.18 FPS average, 2.73 ms GPU, 4.11 ms render thread and 1.62 ms game thread, with zero hitches and zero missed 30/60/120-FPS targets. The same package averaged 24.57 FPS under active Xvfb/noVNC and 30.43 FPS with VNC capture paused while GPU/game work remained near 2 ms, proving a virtual-presentation limit rather than a content or GPU bottleneck. noVNC remains the interaction/review route, not the product frame-rate benchmark.

Stable editor PIE is still red. The official editor rendered the real 33-actor command space and entered PIE, then Vulkan reported `AcquireNextImage() failed due to the outdated swapchain` and crashed in NVIDIA userspace (`libnvidia-glcore.so.595.84`). Real file-write/actor/figure fault injection, camera/handoff/lens/reduced-motion review, audible native device output, reviewed final assets, film quality and observed human playability remain open rather than inferred from package stability.

Host audit: Ubuntu 24.04, 125 GiB RAM, 28 logical CPUs, two 24 GiB RTX 4090 D GPUs, NVIDIA 595.84 userspace and sufficient free home storage. Epic's current Unreal 5.8 Linux requirements recommend Ubuntu 22.04 or Rocky Linux 8, 32 GiB RAM, 8 GiB VRAM, NVIDIA 570+ and the versioned clang toolchain. Hardware exceeds the baseline. The Ubuntu-version difference and editor-only NVIDIA swapchain failure remain compatibility risks, but Linux packaging and normal-thread packaged performance are now directly measured green.

Resolution path:

1. Inject one missing focus actor, one missing council figure and one candidate-save write failure and prove each holds order/history/world/cast; repeat for failed restart and the engagement campaign-byte guard.
2. Complete the remaining visible council/site/signal/evidence route plus natural and skipped consequences in restrained and cuts-only modes. Review exact deltas/text, speaker provenance, highlights, lenses, isolation, collision, silhouettes, eyelines, lighting/UI/audio and physical-controller feel.
3. Capture native audio output and perform human listening review for silence before opt-in, mixer persistence, rapid cues and stop/resume.
4. Replace proxy shapes with reviewed terrain, formation and character assets without changing the accepted deterministic command boundaries; repeat visual, performance and observed-player gates.

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

The kernel/userspace update is now aligned at NVIDIA `595.84`; `nvidia-smi` succeeds and reports both RTX 4090 D GPUs, and official Unreal Vulkan initialized a real GPU. This resolves the earlier NVML mismatch. The normal-thread packaged player is stable and fast on the real 60 Hz display, but the editor-PIE presentation failure remains: PIE crashed in NVIDIA userspace after an outdated-swapchain acquire. Chrome WebGL was blocklisted in the first Web-visible test, whose accepted route therefore still uses ANGLE/SwiftShader. Blender CPU rendering is unaffected.

Do not reboot or reload production GPU modules without an explicit maintenance window. Packaged Unreal normal-thread Vulkan is accepted only for the measured fixed-window path; re-test full-screen, editor PIE and future high-fidelity asset loads separately rather than generalizing from this result.

## Unreal and Unity coexistence

Both project boundaries consume one canonical payload. New cinematic/3D feature work goes to Unreal; Unity remains buildable reference code while its account license gate is unresolved. The Web TypeScript engine remains the behavioral oracle until cross-engine replay fixtures prove Unreal and Unity parity. Story, effects, chronology and historical classification may never fork between clients.
