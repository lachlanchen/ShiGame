# SHI Unity client

This is a Unity 6 LTS project, pinned to `6000.0.80f1`. It is a real second client for the same campaign JSON used by the web build.

## Open and run

1. Install Unity `6000.0.80f1` with Linux Build Support and WebGL Build Support.
2. Run `npm run sync:content` at the repository root.
3. Open this directory in Unity Hub and load `Assets/Scenes/Boot.unity`.
4. Press Play. `ShiBootstrap` creates the 3D wartable, rain field, map markers, and game UI at runtime.

The project currently uses a code-built scene so campaign iteration does not depend on opaque binary assets. A later art pass will replace the immediate-mode UI with reviewed UI Toolkit documents while retaining the deterministic campaign rules.

## Current environment note

The official Unity Hub and experimental Unity CLI are installed on the development workstation. On 2026-08-08, official Linux editor requests were redirected to an incomplete regional mirror and returned HTTP 404, so the editor import/build has not yet passed its required gate. Do not describe the Unity client as verified until `docs/production/ENGINE_STATUS.md` records a successful editor import and player build.
