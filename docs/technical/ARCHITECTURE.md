# Technical architecture

## Decision

SHI uses one authored campaign payload with two clients:

```text
content/campaigns/*.json
        │ validate + SHA-256
        ├── packages/game-core (deterministic TypeScript rules)
        ├── apps/web (React + Vite + lazy Three.js atmosphere)
        └── apps/unity (Unity 6 + Newtonsoft JSON + 3D wartable)
```

The web client is the fastest playable delivery path. Unity 6 LTS is the selected 3D engine because the workstation runs Ubuntu 24.04, which Unity 6 documents as supported, while the current Unreal Linux guidance targets Ubuntu 22.04. This is a platform decision for the first year, not a judgment that Unreal is unsuitable in general.

## Shared-content contract

- `content/campaigns/chapter-01-daze.json` is narrative truth.
- `scripts/validate-content.mjs` checks identifiers, links, translations, action/pressure effects, requirements, reachability, cycles, deadlocks, all playable routes, real failure reachability, and all three conclusions.
- `scripts/sync-unity-content.mjs` copies the same bytes to web and Unity and writes a SHA-256 record.
- Client-specific code may format or animate content; it may not silently change narrative outcomes.
- Schema changes require a migration, updated validator, both clients, and tests.

## Determinism

Choice resolution contains no random number generator. A campaign id, state, and choice id produce the same next state. The engine applies visible player effects, then the choice's authored pressure effects, then checks capture/scattering. Both stages are recorded separately. Future uncertainty mechanics must use a recorded seed and expose the distribution before commitment.

## Web client

- React for stateful accessible UI.
- Vite production build with sourcemaps.
- Three.js is loaded asynchronously; the image/CSS composition remains usable if WebGL is unavailable.
- Browser state is namespaced in `localStorage`. Save format 2 rebuilds state from decision history, migrates version-1 histories, and rejects impossible sequences rather than trusting stored totals.
- All eleven UI locales are compile-time/test validated. Narrative falls back to English or Simplified Chinese and preserves LTR direction inside Arabic layouts.

## Unity client

- Pin: Unity `6000.0.80f1`.
- Code-built bootstrap scene keeps the initial client diffable.
- Newtonsoft JSON reads the shared payload without renaming locale keys.
- PlayerPrefs stores the pre-alpha state in the same replayable save format 2 contract; production saves will later move to signed files without changing decision-history authority.
- A 3D wartable, site markers, lighting and rain are built at runtime.
- The immediate-mode UI is a functional import baseline, not final presentation. UI Toolkit replacement is scheduled before alpha.
- Runtime and editor scripts pass an offline Roslyn type compile against installed Unity reference assemblies. This narrows source-level risk but does not replace the license-gated Unity import, EditMode and player-build gates.

## Asset pipeline

- Original concept art has provenance and visual/historical review records.
- AgenticApp/LabCanvas converts an editable scene spec to `.blend` and PNG.
- Blender exports GLB for web/tooling and FBX for Unity.
- GLB round-trip import is a required check; current export returns 19 meshes.
- Paid Xiaoyunque/LALACHAN generation is optional and begins only after a visible cost/creative approval.

## Security and privacy

- Private references, source books, chat histories, credentials, browser profiles and runtime logs are ignored.
- Web content contains no remote analytics or account system.
- Google Fonts currently load at runtime but fall back safely; self-hosted reviewed font subsets are a pre-alpha release gate.
- Dependencies are locked and audited. CI runs validation and build from a clean checkout.

## Performance budgets

| Budget | Web pre-alpha | Unity desktop alpha |
| --- | --- | --- |
| Initial JS (gzip, excluding lazy 3D) | ≤ 100 KiB | n/a |
| Lazy 3D JS (gzip) | ≤ 220 KiB | n/a |
| Largest reviewed texture | ≤ 4 MiB | ≤ 8 MiB per tier |
| Frame time | 16.7 ms target, 33 ms floor | 16.7 ms target |
| Input-to-feedback | < 100 ms | < 100 ms |
| Save operation | < 50 ms | < 50 ms |

The current web build is 89 KiB gzip initial JavaScript and 185 KiB gzip lazy Three.js.
