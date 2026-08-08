# Engine and workstation status

Last checked: 2026-08-09, Asia/Hong_Kong.

## Selected engine

Unity 6 LTS is selected for the first production year. Project pin: `6000.0.80f1` (`2dfd32957da2`). The web client remains a first-class shipping client.

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

### Unity Editor import/build

The workstation is not authenticated to Unity. On 2026-08-08, Unity CLI installs for available 6000.x releases and direct official archive links redirected to `download.unitychina.cn` paths that returned HTTP 404. The Hub-visible 2022 LTS compatibility build did download from the regional service; its interrupted main transfer was reconstructed from exact HTTP ranges, checked for byte count and XZ integrity, installed, and detected automatically by Hub with Linux and Web modules.

The compatibility executable reports `2022.3.62f3c1` and its licensing client launches successfully. A refreshed 2026-08-09 batch preflight against an ignored compatibility copy again exits with code 1 before project import because no access token, license file or entitlement is available and Unity reports “No valid Unity Editor license found.” Hub's visible license panel says sign-in is required and that no licenses are present. A re-audit also found the former documented VNC/noVNC pair attached to an unrelated older X display; the new `5934`/`6134` pair was verified against Unity Hub on `:123` without disrupting that desktop. A private `.alf` request exists only under ignored `.runtime/`. No credentials, machine identifiers, tokens or license files are committed. The pinned Unity project has therefore **not** passed editor import, C# compilation, test runner, or player build. That gate stays red.

As of 2026-08-09, the expanded runtime, editor and EditMode-test sources—including wartable marker picking, inspected-site state, localized intelligence UI and site closure validation—compile with warnings treated as errors against the installed Unity/Newtonsoft/NUnit reference assemblies. This is an offline source-type check, not an Editor import or test run, and does not change the red gate above.

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

No Unreal project is created at this checkpoint. Current Unreal Linux documentation recommends Ubuntu 22.04 while this host is Ubuntu 24.04, and installing both full editors before the Unity vertical slice passes would add many gigabytes and split validation. Re-evaluate Unreal for a cinematic/tooling spike at month 6; do not maintain two divergent gameplay clients.
