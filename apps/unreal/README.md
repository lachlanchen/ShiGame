# SHI Unreal cinematic client

This is the priority Unreal Engine 5.8 C++ client for SHI. It consumes the same canonical schema-v7 campaign and Broken Crossing engagement contract as Web and Unity. Epic's official Linux `5.8.1` installed build generates the project, compiles/links `SHIEditor`, passes the exact eleven-suite `SHI.` native automation namespace and packages a normal-threaded Linux development player. The archived player is visibly playable through noVNC and independently meets the real-display performance gate; stable editor PIE and human-playability claims still require the recorded gates below.

## Current source slice

- `.uproject`, Game/Editor targets and runtime module;
- canonical JSON loaders with act/time/site/choice parsing, public-edition metadata, source/claim records and chronology/evidence validation;
- pure deterministic campaign session checked against a 46-route, fixed-seed cross-engine replay corpus;
- programmatic Daze command space, camera, fog, light and a bounded five-site 3D wartable driven by the canonical schematic coordinates;
- canonical character and per-node speaker loading, deterministic speaker/Keeper blocking, explicit historical-versus-reconstruction dialogue disclosure, two clickable multi-part performance proxies and a 44° council camera returned through `D`/Gamepad R3/Slate after each consequence;
- status-specific known/reported/reference geometry, selected-marker scale/color/stencil feedback and fail-closed spacing/bounds validation;
- nine live 3D command signals for exact grain/trust/momentum/people/exposure, current field, Qin pursuit, selected-order method read and carried oath state; stable shapes, positions, relative heights, text and selection feedback make color non-exclusive;
- a native three-pulse Broken Crossing exercise with exact 76-route/47-viable Web parity, strict save replay, three plans, two field conditions, nine commands, four outcomes and six bounded 3D metric pieces whose stable shape/order/height/stencil identities are framed beside the Slate order surface;
- a byte-for-byte campaign authority guard around that exercise: campaign save JSON is snapshotted on open, checked before every pulse and close, never written by the tactical resolver and exposed only as an effect preview until a later reviewed migration;
- pointer world-piece picking, `D`/Gamepad R3 council return, `Tab`/Gamepad RB site cycling, `C`/Gamepad L3 signal cycling, Shift reverse cycling, `Home` return to current ground, consequence-sequence skip through `Space`/`Escape`/Gamepad B and persistent cuts-only reduced motion through `V`/Gamepad Menu/Slate;
- Slate command surface with visible resources, act/scene/site/date, reversible order selection, requirements, explicit issue-order progression, autosave state and guarded restart;
- non-mutating historical-basis panel for the active scene and current wartable site, including evidence/reconstruction labels, exact locators, confidence, uncertainty, gameplay use and allowlisted public-edition links; remote-site inspection is deliberately site-only and labeled intelligence rather than a destination; `E`/Gamepad LB opens it and arrows/D-pad scroll it;
- deterministic choice, oath, pressure, pursuit, prepared-method-read and field-condition resolution in the canonical six-layer order;
- a fail-closed order transaction that resolves on a copied session, replays and exactly compares its rule record, post-order selection, all nine 3D signals, the next canonical council cast/blocking/disclosure and every cinematic field, checks live actors, writes the candidate save first and only then swaps active gameplay; invalid orders, presentation drift and write failures hold the order without changing the current chronicle;
- an atomic six-or-seven-beat consequence grammar that reads the exact resolved order/oath/pressure/pursuit/method/field/position record, targets only live world actors, chooses cut versus ease from a 100-unit/6° spatial bound, assigns fixed 40°–58° semantic lenses, stays below five seconds, locks other commands and hands control to the next canonical council speaker on completion or skip;
- authoritative save-v6 export/replay, resume and atomic local writes that reject tampered routes without trusting stored totals; two-step restart also preflights its fresh world and durably writes before replacing active memory;
- a canonical procedural-audio loader and modern `FSoundGenerator` renderer for the reviewed rain bed and seven semantic cues, with explicit opt-in, fade-safe shutdown and persistent rain/cue controls;
- mouse, keyboard and standard-gamepad command input;
- schema-v7, fail-closed order-transaction, spatial-wartable, live-command-signal, consequence-cinema, source/claim closure, procedural-audio, 46-route conformance and save-integrity automation source;
- content sync, static project validation and official editor/build/test/package wrapper.

The current slice implements the canonical six-layer decision order, advances all six authored nodes and reads the same source/claim/character truth as the other clients. Its evidence validator rejects orphan records, claim/source drift, rights mismatch, private paths, unregistered public-link origins and reconstruction disguised as historical evidence. Its council model rejects unknown speakers, cast/disclosure/blocking/lens drift and historical dialogue presented as transcript. `FShiOrderTransactionModel` prepares an order without touching the active session, then independently recomputes and compares the serialized session, complete resolution, selected briefing, signal snapshot, next council stage and camera sentence; all 46 golden routes cross that boundary turn by turn. `FShiCommandSignalModel` rejects missing resources/layers, invalid table anchoring, identity drift, unsafe bounds and pointer overlap before any live actor update. `FShiCinematicBeatModel` accepts only order → optional oath → pressure → pursuit → method read → field → position with exact deltas/totals, live focus closure, bounded motion, semantic lenses and the five-second ceiling. GameMode verifies the camera, signal/site actors and both persistent council figures, writes the prepared save, commits the prepared session/world/stage, then isolates input and plays the prepared sentence before handing control to the next speaker. Engine-native marker and figure assets are explicitly cooked and stencil rendering is configured. The multi-part figures are behavior/eyeline/asset-swap proxies, not final character art. The native sound path starts silent, arms rather than auto-playing a remembered preference, and persists independent rain/cue levels.

Official UE `5.8.1` changelist `56057345` project generation and `SHIEditor` compilation/linking pass on this workstation. An exact `SHI.` run discovers eleven suites and passes all eleven: procedural audio, 46-route campaign replay, fail-closed order transaction, save/replay integrity, schema-v7 horizon, council staging, consequence grammar, live command signals, native Broken Crossing parity, historical source/claim closure and wartable spatial intelligence. Tests run with `-nowrite` so commandlets cannot modify tracked project configuration. The official Linux package path exits 0 after compile/cook/stage/archive; its campaign and engagement StreamingAssets exactly match the canonical hashes. The archived normal-thread player visibly advances to Broken Crossing, completes all three tactical pulses, shows six simultaneous 3D tallies, reaches an outcome, returns to council and preserves the packaged campaign save hash before/during/after the preview. A real 60 Hz display FPS chart records 195.18 FPS average, 2.73 ms GPU, 4.11 ms render thread, 1.62 ms game thread and zero hitches; the slower noVNC rate is isolated to Xvfb/capture presentation. Editor PIE still hits an NVIDIA Vulkan outdated-swapchain crash, so stable PIE, film quality, audible device output and human playability remain red. Transaction failure injection, full site/signal/figure/evidence/controller review, consequence motion/lens/reduced-motion review, audio capture/listening, final asset import and art-direction parity also remain open. See the [package evidence](../../docs/production/evidence/unreal-linux-package-status.json), [engagement command-space contract](../../docs/design/UNREAL_ENGAGEMENT_COMMAND_SPACE.md), [order-transaction contract](../../docs/design/UNREAL_ORDER_TRANSACTION.md), [canonical council-staging contract](../../docs/design/UNREAL_COUNCIL_STAGING.md), [command-space signal contract](../../docs/design/COMMAND_SPACE_SIGNALS.md) and [consequence-cinema contract](../../docs/design/UNREAL_CONSEQUENCE_CINEMA.md).

Runtime chronicles are written under Unreal's ignored `Saved/SaveGames/shi-chapter-01-v6.json`. With healthy persistence, each prepared order and two-step restart writes its verified candidate before active memory changes; a failed write holds the action and preserves the current run. A malformed or inconsistent existing file is left in place, gameplay enters a clearly labeled unsaved preview, and replacement requires pressing **New chronicle** twice.

## Prepare and validate

```bash
npm run sync:content
./scripts/unreal-pipeline.sh preflight
```

Obtain Unreal only through Epic’s official Linux installed-build ZIP or linked private source repository. Verify and stage the official archive into an explicit outside-Git destination; the installer refuses unsafe ZIP paths, non-5.8 metadata, incomplete engine roots, an existing destination and any path inside this repository:

```bash
./scripts/install-official-unreal-linux.sh verify /path/to/Linux_Unreal_Engine_5.8.x.zip
./scripts/install-official-unreal-linux.sh install /path/to/Linux_Unreal_Engine_5.8.x.zip /outside/git/UE_5.8.x
```

Then point `SHI_UNREAL_ROOT` at the installed root. `SHI_UNREAL_DERIVED_DATA` is optional but, when set, must be an absolute outside-Git cache directory. Linux packaging also requires an explicit outside-Git `SHI_UNREAL_PACKAGE_ROOT`:

```bash
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh projectfiles
SHI_UNREAL_ROOT=/path/to/UnrealEngine SHI_UNREAL_DERIVED_DATA=/outside/git/SHI-DDC ./scripts/unreal-pipeline.sh build
SHI_UNREAL_ROOT=/path/to/UnrealEngine SHI_UNREAL_DERIVED_DATA=/outside/git/SHI-DDC ./scripts/unreal-pipeline.sh test
SHI_UNREAL_ROOT=/path/to/UnrealEngine SHI_UNREAL_DERIVED_DATA=/outside/git/SHI-DDC ./scripts/unreal-pipeline.sh editor
SHI_UNREAL_ROOT=/path/to/UnrealEngine SHI_UNREAL_DERIVED_DATA=/outside/git/SHI-DDC SHI_UNREAL_PACKAGE_ROOT=/outside/git/SHI-Builds ./scripts/unreal-pipeline.sh linux
```

Engine binaries, generated maps, derived data, intermediates and packaged builds remain outside Git.
