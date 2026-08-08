# SHI Unity client

This is a Unity 6 LTS project, pinned to `6000.0.80f1`. It is a real second client for the same campaign JSON used by the web build.

## Open and run

1. Install Unity `6000.0.80f1` with Linux Build Support and WebGL Build Support.
2. Run `npm run sync:content` at the repository root.
3. Open this directory in Unity Hub and load `Assets/Scenes/Boot.unity`.
4. Press Play. `ShiBootstrap` creates the 3D wartable, rain field, map markers, and game UI at runtime.

The native input baseline uses the committed legacy-input axis map for broad compatibility: arrows or left stick/D-pad move across enabled decisions, Enter/Space or the south face button commits, Escape/east face button closes, shoulders open record/sources, and Start/Menu opens the field guide. `M` or Y/Triangle enters wartable inspection; arrows/D-pad/stick cycle known, reported and reference-only sites; confirm opens that site's evidence; and clicking a 3D marker uses camera raycasting. The one-time guide preference is separate from campaign saves, and guide/record/controller/map text exists in all eleven UI locales.

## Reproducible verification and builds

Set `UNITY_EDITOR` when the pinned editor is outside Unity Hub's default location, then use the repository wrapper:

```bash
./scripts/unity-pipeline.sh preflight
./scripts/unity-pipeline.sh test
./scripts/unity-pipeline.sh linux
./scripts/unity-pipeline.sh web
```

`SHI/Validate Production Content` exposes the same preflight in the editor. It checks cross-engine ASCII IDs, cycles and reachability, site/speaker/source references, intelligence status and coordinate bounds, site claim/source closure, source and field classifications, resource and requirement bounds, pressure responses, bounded field effects, baseline English and Simplified Chinese text, and three authored endings. The runtime uses the shared FNV-1a seed contract, applies action → pressure → disclosed field effects, replays save-v3 history (including v1/v2 migration), records failure consistently with the TypeScript core, and routes pointer/keyboard/controller commitment through the same resolver. Successful player builds write a receipt under `apps/unity/Builds/`; local builds and test output remain ignored by Git.

The project currently uses a code-built scene so campaign iteration does not depend on opaque binary assets. A later art pass will replace the immediate-mode UI with reviewed UI Toolkit documents while retaining the deterministic campaign rules.

## Current environment note

The official Unity Hub and experimental Unity CLI are installed on the development workstation. A compatibility editor (`2022.3.62f3c1`) with Linux and Web support is also installed and registered in Hub. The committed project stays pinned to Unity `6000.0.80f1`: that exact artifact still redirects to a missing regional CDN object. A disposable 2022 compatibility copy reaches the editor licensing client, but Unity refuses project import before compilation because this workstation has no account entitlement or license. The runtime, editor and EditMode-test sources pass a separate offline Roslyn type compile against the installed Unity/NUnit reference assemblies; this is not a Unity import, EditMode run or player build. Do not describe the Unity project/player as editor-compiled or build-verified until `docs/production/ENGINE_STATUS.md` records a successful import, tests and player build.
