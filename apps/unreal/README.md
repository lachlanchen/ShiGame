# SHI Unreal cinematic client

This is the priority Unreal Engine 5.8 C++ client for SHI. It consumes the same canonical schema-v7 campaign as Web and Unity. It is a real project boundary, but native compilation and play are not claimed until the official Linux installed build is present and the recorded gates pass.

## Current source slice

- `.uproject`, Game/Editor targets and runtime module;
- canonical JSON loaders with act/time/site/choice parsing, public-edition metadata, source/claim records and chronology/evidence validation;
- pure deterministic campaign session checked against a 46-route, fixed-seed cross-engine replay corpus;
- programmatic Daze command space, camera, fog, light and a bounded five-site 3D wartable driven by the canonical schematic coordinates;
- status-specific known/reported/reference geometry, selected-marker scale/color/stencil feedback and fail-closed spacing/bounds validation;
- nine live 3D command signals for exact grain/trust/momentum/people/exposure, current field, Qin pursuit, selected-order method read and carried oath state; stable shapes, positions, relative heights, text and selection feedback make color non-exclusive;
- pointer world-piece picking, `Tab`/Gamepad RB site cycling, `C`/Gamepad L3 signal cycling, Shift reverse cycling, `Home` return to current ground, consequence-sequence skip through `Space`/`Escape`/Gamepad B and persistent cuts-only reduced motion through `V`/Gamepad Menu/Slate;
- Slate command surface with visible resources, act/scene/site/date, reversible order selection, requirements, explicit issue-order progression, autosave state and guarded restart;
- non-mutating historical-basis panel for the active scene and current wartable site, including evidence/reconstruction labels, exact locators, confidence, uncertainty, gameplay use and allowlisted public-edition links; remote-site inspection is deliberately site-only and labeled intelligence rather than a destination; `E`/Gamepad LB opens it and arrows/D-pad scroll it;
- deterministic choice, oath, pressure, pursuit, prepared-method-read and field-condition resolution in the canonical six-layer order;
- a fail-closed order transaction that resolves on a copied session, replays and exactly compares its rule record, post-order selection, all nine 3D signals and every cinematic field, checks live actors, writes the candidate save first and only then swaps active gameplay; invalid orders, presentation drift and write failures hold the order without changing the current chronicle;
- an atomic six-or-seven-beat consequence grammar that reads the exact resolved order/oath/pressure/pursuit/method/field/position record, targets only live world actors, chooses cut versus ease from a 100-unit/6° spatial bound, assigns fixed 40°–58° semantic lenses, stays below five seconds, locks other commands and returns exactly to current ground on completion or skip;
- authoritative save-v6 export/replay, resume and atomic local writes that reject tampered routes without trusting stored totals; two-step restart also preflights its fresh world and durably writes before replacing active memory;
- a canonical procedural-audio loader and modern `FSoundGenerator` renderer for the reviewed rain bed and seven semantic cues, with explicit opt-in, fade-safe shutdown and persistent rain/cue controls;
- mouse, keyboard and standard-gamepad command input;
- schema-v7, fail-closed order-transaction, spatial-wartable, live-command-signal, consequence-cinema, source/claim closure, procedural-audio, 46-route conformance and save-integrity automation source;
- content sync, static project validation and official editor/build/test/package wrapper.

The current source slice implements the canonical six-layer decision order, advances all six authored nodes and reads the same source/claim truth as the other clients. Its evidence validator rejects orphan records, claim/source drift, rights mismatch, private paths, unregistered public-link origins and reconstruction disguised as historical evidence. `FShiOrderTransactionModel` prepares an order without touching the active session, then independently recomputes and compares the serialized session, complete resolution, selected briefing, signal snapshot and camera sentence; all 46 golden routes now cross that boundary turn by turn. `FShiCommandSignalModel` rejects missing resources/layers, invalid table anchoring, identity drift, unsafe bounds and pointer overlap before any live actor update. `FShiCinematicBeatModel` accepts only order → optional oath → pressure → pursuit → method read → field → position with exact deltas/totals, live focus closure, bounded motion, semantic lenses and the five-second ceiling. GameMode verifies the camera and actors, writes the prepared save, commits the prepared session/world, then isolates input and plays the prepared sentence. Engine-native marker assets are explicitly cooked and stencil rendering is configured. The first native sound path also exists in source: sound starts silent, a remembered preference is only armed until a player command, `M`/Gamepad Y and the Slate control toggle it, and rain/cue levels persist independently. It does **not yet claim native execution**, film quality, a packaged player, audible Unreal output or human playability: the C++ suites are authored but cannot execute until the official engine is installed. Native transaction failure injection, site/signal/evidence interaction, consequence motion/lens/reduced-motion review, audio capture/listening, final asset import and art-direction parity remain open gates. See the [order-transaction contract](../../docs/design/UNREAL_ORDER_TRANSACTION.md), [command-space signal contract](../../docs/design/COMMAND_SPACE_SIGNALS.md) and [consequence-cinema contract](../../docs/design/UNREAL_CONSEQUENCE_CINEMA.md).

Runtime chronicles are written under Unreal's ignored `Saved/SaveGames/shi-chapter-01-v6.json`. With healthy persistence, each prepared order and two-step restart writes its verified candidate before active memory changes; a failed write holds the action and preserves the current run. A malformed or inconsistent existing file is left in place, gameplay enters a clearly labeled unsaved preview, and replacement requires pressing **New chronicle** twice.

## Prepare and validate

```bash
npm run sync:content
./scripts/unreal-pipeline.sh preflight
```

Obtain Unreal only through Epic’s official Linux installed-build ZIP or linked private source repository. Then point `SHI_UNREAL_ROOT` at the extracted/built root:

```bash
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh projectfiles
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh build
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh test
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh editor
SHI_UNREAL_ROOT=/path/to/UnrealEngine ./scripts/unreal-pipeline.sh linux
```

Engine binaries, generated maps, derived data, intermediates and packaged builds remain outside Git.
