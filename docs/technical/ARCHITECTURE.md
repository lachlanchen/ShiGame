# Technical architecture

## Decision

SHI uses one authored campaign payload with three clients. Unreal is feature-first for cinematic 3D; Web is the fastest playable reference; Unity remains a maintained compatibility baseline:

```text
content/research/editions.json + content/campaigns/*.json + content/audio/*.json
        │ rights/claim/audio validation + SHA-256
        ├── packages/game-core (deterministic TypeScript rules)
        ├── apps/web (React + Vite + lazy Three.js atmosphere)
        ├── apps/unreal (Unreal 5.8 + C++ + Slate cinematic command space)
        └── apps/unity (Unity 6 + Newtonsoft JSON + maintained 3D baseline)
```

The user has explicitly prioritized Unreal 5.8 for the difficult cinematic 3D work now. The workstation exceeds Epic's hardware recommendation but runs Ubuntu 24.04 rather than the recommended Ubuntu 22.04/Rocky Linux 8 baseline; native evidence is therefore mandatory and compatibility is never assumed. Unity is preserved without accepting a divergent gameplay fork.

## Shared-content contract

- `content/campaigns/chapter-01-daze.json` is narrative truth; `content/research/editions.json` is the edition/rights metadata authority.
- `content/audio/chapter-01-audio.json` is the Web/Unreal/Unity sound truth. It fixes opt-in defaults, mix caps, deterministic rain synthesis and the seven semantic cue envelopes; its provenance record contains no source media and keeps human listening review open.
- `content/engagements/chapter-01-broken-crossing.v1.json` is the first shared encounter contract. It remains explicitly non-authoritative, resolves six local metrics across three pulses and may preview—but never silently apply—campaign effects.
- Schema v7 adds exactly three authored acts plus monotonic `timeIndex` progression to the schema-v6 evidence, commitment, opposition and uncertainty contract. Every playable transition moves forward in time, stays within its act or advances one act, and closes on a registered site.
- `scripts/validate-content.mjs` checks edition/right pairings, HTTPS public links constrained to each registered edition origin, identifiers, claim/source/node/site closure, site coordinate/status bounds, reconstruction boundaries, translations, action/commitment/pressure/pursuit/method-read/field effects, commitment resolution and outcome reachability, opponent-band coverage, method/read closure and hit reachability, requirements, cycles, deadlocks, every field-condition branch, real failure reachability, and all three conclusions.
- `scripts/generate-conformance-fixtures.ts` exhaustively materializes all 46 legal fixed-seed terminal routes with every six-layer intermediate state. The fixture carries the campaign SHA-256; validation regenerates and byte-compares it before native clients receive it.
- `scripts/sync-unity-content.mjs` copies canonical campaign/audio bytes and the reviewed conformance corpus to Unreal, Unity and browser mirrors, writes the campaign SHA-256 record, and emits lossless gameplay/horizon/claim/commitment/opposition browser slices. Repository validation reassembles and compares the exact campaign.
- Client-specific code may format or animate content; it may not silently change narrative outcomes.
- Schema changes require a migration, updated validator, all three clients, and tests.

## Seed-reproducible resolution

Each chronicle records an unsigned 32-bit seed. FNV-1a over `campaignId|seed|nodeId|turn` selects one weighted authored field condition; the signal and exact effects are visible before commitment. Opening history independently selects one active player promise, and the authored ford outcome determines whether the pending choice keeps, strains or breaks it. Current Exposure selects a disclosed Qin-pursuit posture. Prior choices select a method read: fewer than two observations or a leading-count tie is neutral, while a unique leader prepares one counter that applies only if the pending choice uses its target method. The engine applies player effects, commitment answer, authored pressure, pursuit, method read and field condition in that order, recording all applicable layers separately before checking capture/scattering. Identical campaign data, seed and decision history must reconstruct the identical result in TypeScript, Unreal C++ and Unity C#. Commitment, pursuit, method-read and field content is classified as dramatic reconstruction and cannot alter routes, requirements, flags or prose at runtime.

## Unreal cinematic client

- Pin: Unreal Engine 5.8; engine binaries and generated state stay outside Git.
- C++ parses the canonical schema-v7 payload plus the registered edition metadata and character register, validates act/time/site/speaker transitions plus source → claim → scene/site closure, and resolves order → oath → pressure → pursuit → prepared method read → deterministic field condition.
- A presentation-independent `FShiCampaignSession` owns deterministic state, detailed intermediate records, legal decisions and fail-closed save-v6 replay. Runtime state is never reconstructed from trusted resource totals.
- `FShiOrderTransactionModel` resolves on a copied session, builds the post-order selection/signals/canonical council/cinema, independently recomputes and exactly compares every gameplay and presentation field, and leaves the active session immutable until runtime actor/figure and durable-save preflight pass. Every golden-route turn uses this boundary.
- A programmatic Slate command surface keeps selection reversible, discloses field/pursuit/method/oath/pressure before commitment and exposes one explicit issue-order boundary.
- `FShiWartableModel` projects the five canonical schematic site coordinates into a bounded runtime table, rejects invalid status geometry, non-finite/out-of-bounds positions and pointer-target overlap, and assigns non-color-only geometry/stencil identities to known, reported and reference intelligence.
- `FShiCommandSignalModel` derives a stable five-resource/four-tactical-piece snapshot from current session state. It preserves exact 0–100 values, base anchoring, stable order/shape/stencil identity and an explicit capture terminal; atomic validation rejects missing layers, unsafe bounds and both intra-signal and signal-to-site pointer overlap before the live world updates.
- `FShiEngagementModel` and `FShiEngagementSession` independently load and replay the exact shared Broken Crossing contract. They derive the complete 76-route matrix from plan, condition and command identities, apply the player effect before the authored response, reject stored-state drift and never receive mutable campaign authority. `FShiEngagementSignalModel` maps all six exact 0–100 values into stable bounded shape/order/height/stencil pieces.
- GameMode opens the encounter only from the matching selected campaign plan and disclosed condition, snapshots the canonical campaign save bytes and checks exact equality before every pulse and close. Pulse resolution occurs on a copied engagement session and all six live actors must preflight before replacement. Ordinary campaign actors/collision are isolated while open; closing restores them and the council without writing the campaign save.
- The shared node `speakerId` feeds `FShiCouncilStagingModel`; exact speaker/Keeper identity, localized name/role/dialogue, historical/reconstruction disclosure, transforms, stencil style and 44° camera are deterministic presentation data. Two persistent explicitly movable `AShiCouncilFigure` actors expose separate body/head/mantle geometry and click collision as a performance/eyeline/final-asset swap boundary, not final character art.
- Pointer picking plus `D`/Gamepad R3/Slate council return, `Tab`/Gamepad RB sites, `C`/Gamepad L3 signals, Shift reverse and `Home` current ground focus one inspected world object without mutating campaign state. A non-mutating historical-basis mode merges scene + site only on current ground; a remote site exposes only its own evidence and is explicitly labeled intelligence rather than a destination. Signal/council focus restores current-site evidence scope, so gameplay/reconstruction state never masquerades as historical evidence. Private file paths and invented quotations are not packaged, and inspection cannot issue orders.
- Autosave/resume writes through a temporary file, rejects altered decision identities atomically, preserves an incompatible save until explicit two-step restart, and exposes its state in the command surface. Healthy-persistence orders and restarts write the fully prepared candidate before swapping active memory; failed writes leave the current session/world untouched. Number/arrows/Enter and standard-gamepad controls call the same commands as pointer UI.
- The runtime builds a Daze command space with directional moonlight, motivated fire light, fog, ground and the five-site wartable. Within the prepared transaction, `FShiCinematicBeatModel` derives a stable order → optional oath → pressure → pursuit → method read → field → position sequence from actual intermediate records and exact final resources, then GameMode proves every focus and both council slots have live actors before durable commit. The first/unknown shot and any move beyond 100 Unreal units or 6° cut; only bounded neighbors ease through translation, quaternion rotation and a fixed semantic 40°–58° FOV grammar. The six-or-seven-beat sequence lasts 3.52–4.08 seconds, blocks unrelated commands, and completion or `Space`/`Escape`/Gamepad B skip hands control to the exact next speaker without campaign mutation or cumulative drift. A separately persisted `V`/Gamepad Menu/Slate reduced-motion setting makes inspection, consequence travel and speaker handoff cuts-only while retaining reading time and lens meaning. Engine basic-shape packages are explicitly cooked and selected-marker/figure stencils are enabled.
- `UShiSoundscapeComponent` keeps audio off until an explicit player gesture, persists preference and independent rain/cue levels, and hands render work to an `ISoundGenerator` through `CreateSoundGenerator`. Its MPSC cue handoff, bounded active voices, atomic controls, dual-mono render, deterministic rain and semantic tone synthesis avoid UObject work on the render thread.
- Static repository validation is green. Official UE 5.8.1 project generation and `SHIEditor` compile/link pass, and an exact `SHI.` filter discovers and passes eleven native automation suites. Coverage includes immutable order preflight and all 46 campaign routes; exact 76-route Broken Crossing parity, six-piece spatial rebuilds and hostile replay/authority attacks; canonical speaker/Keeper occupancy and evidence classification; wartable bounds; exact live campaign signals; consequence order/timing/world/motion/lens closure; source/claim/rights closure; save replay/tamper rejection; and procedural audio. The official Linux package passes compile/cook/stage/archive, and its normal-thread player visibly completes three tactical pulses while preserving the packaged campaign save hash. A real-display chart records 195.18 FPS average and zero hitches; Xvfb/noVNC is separately presentation-limited. Stable editor PIE remains red after an NVIDIA Vulkan outdated-swapchain userspace crash; real figure/actor/write failure injection, full controller/accessibility/audio review, final assets and human cinematic/playability review remain open.

## Web client

- React for stateful accessible UI.
- Vite production build without publicly deployed source maps. An internal diagnostic build can opt into hidden maps with `SHI_SOURCEMAP=1`; those maps are not part of the player-artifact budget.
- Three.js is loaded asynchronously; the image/CSS composition remains usable if WebGL is unavailable.
- Browser state is namespaced in `localStorage`. Save format 6 rebuilds state from decision history; `legacyDecisionCount`, `preMethodReadDecisionCount` and `preCommitmentDecisionCount` preserve the v1–v3 pre-pursuit, v1–v4 pre-read and v1–v5 pre-commitment boundaries. Replay rejects impossible seed, posture, method, read, commitment, outcome or effect identities rather than trusting stored totals.
- All eleven UI locales are compile-time/test validated. Narrative falls back to English or Simplified Chinese and preserves LTR direction inside Arabic layouts.
- Inter and Cormorant Garamond are the self-hosted baseline faces. A lazy locale-font boundary loads Noto Sans Arabic/JP/KR/SC/TC only for the active script, while the seal/Chinese narrative layer loads Noto Serif SC. The app exposes loading/ready/error state and treats a missing required face as a visible runtime error rather than silently certifying a fallback.
- A pure standard-gamepad adapter edge-detects buttons/axes; the polling hook resets on disconnect. Commands call the same React actions as pointer/keyboard input. Onboarding preference is namespaced separately from campaign state.
- Compact decision cards update selection only. A lazy `DecisionInspector` assembles the selected order's complete strategy, method hit/miss, commitment answer, pressure and exact effects, while a separate order-named confirmation is the pointer/keyboard mutation boundary.
- The strategic map and detail inspector are lazy chunks. Pointer, keyboard and standard-gamepad selection open status/uncertainty and site-filtered evidence without changing deterministic game state.
- The procedural audio engine and detailed eleven-locale mixer are separate lazy chunks. Web Audio is created only from a player gesture; ambience/effects buses persist independently, respect shared caps and never replace visual/text feedback.
- Modal drawers use native dialog semantics plus an inert game-stage boundary, explicit focus containment and invoker/story focus restoration. Consequence presentation independently makes the choice region inert and the shared action guard rejects re-entry.
- Accessibility is a build input: a static validator enforces curated contrast/microtype/target contracts, jsdom runs axe against representative components, and the visible Chrome gate repeats axe plus real focus, target geometry, 200% text and reduced-motion checks. Human assistive-technology certification remains a release gate.

## Unity client

- Pin: Unity `6000.0.80f1`.
- Code-built bootstrap scene keeps the initial client diffable.
- Newtonsoft JSON reads the shared payload without renaming locale keys.
- PlayerPrefs stores the pre-alpha state in the same replayable save format 6 contract; production saves will later move to signed files without changing decision-history authority.
- A 3D wartable, status-specific site markers, lighting and rain are built at runtime. Marker colliders feed the same inspected-site/evidence state used by keyboard and controller navigation.
- `ShiAudioDirector` reconstructs the shared seeded rain loop and semantic tones with native `AudioSource`, filter and generated `AudioClip` primitives. PlayerPrefs stores opt-in ambience/effects values under a versioned key; the localized immediate-mode mixer exposes the same bus contract as the web client.
- The immediate-mode UI is a functional import baseline, not final presentation. It mirrors select-only compact orders, a complete selected-order reading and separate confirmation; UI Toolkit replacement is scheduled before alpha.
- The committed input-axis map and runtime controller layer provide selected-choice feedback, field guide, source/record overlays and shared commit/close commands through the same resolver; physical-device proof remains an observed-player gate.
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
- Eight exact Fontsource variable packages are pinned at `5.3.0`, licensed OFL-1.1, registered in `docs/production/THIRD_PARTY_NOTICES.md`, built into the release and served from the same origin. Runtime Google/Fontsource/CDN requests are forbidden.
- The document CSP restricts scripts, connections, fonts, images, media, workers, forms and objects to the minimum same-origin/data/blob surfaces required by this client. The visible network gate traverses all eleven locales and rejects any cross-origin HTTP(S) request or resource.
- Dependencies are locked and audited. CI runs validation and build from a clean checkout.

## Performance budgets

| Budget | Web pre-alpha | Unity desktop alpha |
| --- | --- | --- |
| Initial JS (gzip, excluding lazy 3D) | ≤ 100 KiB | n/a |
| Initial CSS (gzip) | ≤ 12 KiB | n/a |
| Largest lazy JS (gzip) | ≤ 200 KiB | n/a |
| Largest on-demand locale-font CSS (gzip) | ≤ 50 KiB | n/a |
| Complete self-hosted font artifact | ≤ 24 MiB | n/a |
| Deployable web artifact, excluding optional private maps | ≤ 30 MiB | n/a |
| Largest reviewed texture | ≤ 4 MiB | ≤ 8 MiB per tier |
| Frame time | 16.7 ms target, 33 ms floor | 16.7 ms target |
| Input-to-feedback | < 100 ms | < 100 ms |
| Save operation | < 50 ms | < 50 ms |

`scripts/validate-web-build.mjs` measures the built bytes with one deterministic gzip implementation and fails the build on regression. The current build is 99.32 KiB initial JavaScript, 11.94 KiB initial CSS, 1.91 KiB deliberate decision inspector, 2.33 KiB strategic map, 5.82 KiB commitment presentation, 6.58 KiB opponent presentation, 7.41 KiB evidence/claim UI, 4.48 KiB field guide, 4.08 KiB detailed audio settings, 1.24 KiB audio engine, 0.93 KiB font loader and 178.95 KiB Three.js, all gzip. The complete 565-file Unicode-range font artifact is 22.94 MiB and the source-map-free deployable site is 26.83 MiB. That artifact size is not an initial player transfer: browser requests are limited by active locale, visible glyph ranges and invoked feature boundaries. Axe-core is development-only and does not enter the player bundle.
