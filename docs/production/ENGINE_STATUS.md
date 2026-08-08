# Engine and workstation status

Last checked: 2026-08-08, Asia/Hong_Kong.

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

## Open blockers

### Unity Editor import/build

The workstation is not authenticated to Unity. On 2026-08-08, Unity CLI installs for available 6000.x releases and direct official archive links redirected to `download.unitychina.cn` paths that returned HTTP 404. Hub headless mode also did not complete successfully. The repository contains a real pinned Unity project, but it has **not** passed editor import, C# compilation, test runner, or player build. That gate stays red.

Resolution path:

1. Use the visible dedicated desktop to sign in to Unity Hub if licensing requires it.
2. Install the pinned editor plus Linux and WebGL build support from a working official endpoint.
3. Open `apps/unity`, allow package import, fix version migrations intentionally.
4. Run EditMode tests, play the Boot scene, build Linux/WebGL players, and record hashes/screenshots here.

### NVIDIA

The loaded NVIDIA kernel module is `595.71.05` while installed userspace reports `595.84`; `nvidia-smi` fails with an NVML mismatch. Chrome WebGL was blocklisted in the first visible test. The noVNC test passed with ANGLE/SwiftShader software WebGL. Blender CPU rendering is unaffected.

Do not reboot or reload production GPU modules without an explicit maintenance window. After maintenance, verify `nvidia-smi`, native Chrome WebGL, Blender CUDA/OptiX, and Unity Vulkan.

## Unreal and Unity coexistence

No Unreal project is created at this checkpoint. Current Unreal Linux documentation recommends Ubuntu 22.04 while this host is Ubuntu 24.04, and installing both full editors before the Unity vertical slice passes would add many gigabytes and split validation. Re-evaluate Unreal for a cinematic/tooling spike at month 6; do not maintain two divergent gameplay clients.
