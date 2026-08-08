# Technical architecture

## Decision

SHI uses one authored campaign payload with two clients:

```text
content/research/editions.json + content/campaigns/*.json
        │ rights/claim validation + SHA-256
        ├── packages/game-core (deterministic TypeScript rules)
        ├── apps/web (React + Vite + lazy Three.js atmosphere)
        └── apps/unity (Unity 6 + Newtonsoft JSON + 3D wartable)
```

The web client is the fastest playable delivery path. Unity 6 LTS is the selected 3D engine because the workstation runs Ubuntu 24.04, which Unity 6 documents as supported, while the current Unreal Linux guidance targets Ubuntu 22.04. This is a platform decision for the first year, not a judgment that Unreal is unsuitable in general.

## Shared-content contract

- `content/campaigns/chapter-01-daze.json` is narrative truth; `content/research/editions.json` is the edition/rights metadata authority.
- Schema v3 binds each playable node and wartable site to source records and inspectable historical/reconstruction claims. Sites add a `known`/`reported`/`reference` intelligence state, bounded summary, uncertainty and schematic coordinates; claims retain locators, review state, confidence and game use without embedding source books.
- `scripts/validate-content.mjs` checks edition/right pairings, HTTPS public links, identifiers, claim/source/node/site closure, site coordinate/status bounds, reconstruction boundaries, translations, action/pressure/field effects, requirements, reachability, cycles, deadlocks, every field-condition branch, real failure reachability, and all three conclusions.
- `scripts/sync-unity-content.mjs` copies the canonical bytes to Unity and a full browser mirror, writes a SHA-256 record, and emits lossless gameplay/claim browser slices. The claim slice is loaded with the evidence drawer so the release stays inside its initial-JavaScript budget; repository validation proves that recombining both slices exactly reconstructs the canonical JSON object.
- Client-specific code may format or animate content; it may not silently change narrative outcomes.
- Schema changes require a migration, updated validator, both clients, and tests.

## Seed-reproducible resolution

Each chronicle records an unsigned 32-bit seed. FNV-1a over `campaignId|seed|nodeId|turn` selects one weighted authored field condition; the signal and exact effects are visible before commitment. The engine applies player effects, authored pressure effects, then field effects and records all three stages separately before checking capture/scattering. Identical campaign data, seed and decision history therefore reconstruct the identical result in TypeScript and C#. Field conditions are classified as dramatic reconstruction and cannot alter routes, requirements, flags or prose at runtime.

## Web client

- React for stateful accessible UI.
- Vite production build with sourcemaps.
- Three.js is loaded asynchronously; the image/CSS composition remains usable if WebGL is unavailable.
- Browser state is namespaced in `localStorage`. Save format 3 rebuilds state from decision history, migrates version-1 and version-2 histories under documented legacy seed zero, and rejects impossible or seed-inconsistent sequences rather than trusting stored totals.
- All eleven UI locales are compile-time/test validated. Narrative falls back to English or Simplified Chinese and preserves LTR direction inside Arabic layouts.
- A pure standard-gamepad adapter edge-detects buttons/axes; the polling hook resets on disconnect. Commands call the same React actions as pointer/keyboard input. Onboarding preference is namespaced separately from campaign state.
- The strategic map and detail inspector are lazy chunks. Pointer, keyboard and standard-gamepad selection open status/uncertainty and site-filtered evidence without changing deterministic game state.
- Modal drawers use native dialog semantics plus an inert game-stage boundary, explicit focus containment and invoker/story focus restoration. Consequence presentation independently makes the choice region inert and the shared action guard rejects re-entry.
- Accessibility is a build input: a static validator enforces curated contrast/microtype/target contracts, jsdom runs axe against representative components, and the visible Chrome gate repeats axe plus real focus, target geometry, 200% text and reduced-motion checks. Human assistive-technology certification remains a release gate.

## Unity client

- Pin: Unity `6000.0.80f1`.
- Code-built bootstrap scene keeps the initial client diffable.
- Newtonsoft JSON reads the shared payload without renaming locale keys.
- PlayerPrefs stores the pre-alpha state in the same replayable save format 3 contract; production saves will later move to signed files without changing decision-history authority.
- A 3D wartable, status-specific site markers, lighting and rain are built at runtime. Marker colliders feed the same inspected-site/evidence state used by keyboard and controller navigation.
- The immediate-mode UI is a functional import baseline, not final presentation. UI Toolkit replacement is scheduled before alpha.
- The committed input-axis map and runtime controller layer provide selected-choice feedback, field guide, source/record overlays and shared commit/close commands; physical-device proof remains an observed-player gate.
- Runtime, editor and EditMode-test sources pass an offline Roslyn type compile against installed Unity/NUnit reference assemblies. This narrows source-level risk but does not replace the license-gated Unity import, EditMode execution and player-build gates.

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

The current web build is 99.74 KiB gzip initial JavaScript, 2.36 KiB gzip lazy strategic map, 0.59 KiB gzip lazy map inspector, 7.44 KiB gzip lazy evidence/claim UI, 0.62 KiB gzip lazy field guide, and 184.72 KiB gzip lazy Three.js. Axe-core is development-only and does not enter the player bundle.
