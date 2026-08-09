# SHI Unreal cinematic client

This is the priority Unreal Engine 5.8 C++ client for SHI. It consumes the same canonical schema-v7 campaign as Web and Unity. It is a real project boundary, but native compilation and play are not claimed until the official Linux installed build is present and the recorded gates pass.

## Current source slice

- `.uproject`, Game/Editor targets and runtime module;
- canonical JSON loaders with act/time/site/choice parsing, public-edition metadata, source/claim records and chronology/evidence validation;
- pure deterministic campaign session checked against a 46-route, fixed-seed cross-engine replay corpus;
- programmatic Daze command space, camera, fog, light and field markers;
- Slate command surface with visible resources, act/scene/site/date, reversible order selection, requirements, explicit issue-order progression, autosave state and guarded restart;
- non-mutating historical-basis panel for the active scene and wartable site, including evidence/reconstruction labels, exact locators, confidence, uncertainty, gameplay use and allowlisted public-edition links; `E`/Gamepad LB opens it and arrows/D-pad scroll it;
- deterministic choice, oath, pressure, pursuit, prepared-method-read and field-condition resolution in the canonical six-layer order;
- authoritative save-v6 export/replay, resume and atomic local writes that reject tampered routes without trusting stored totals;
- a canonical procedural-audio loader and modern `FSoundGenerator` renderer for the reviewed rain bed and seven semantic cues, with explicit opt-in, fade-safe shutdown and persistent rain/cue controls;
- mouse, keyboard and standard-gamepad command input;
- schema-v7, source/claim closure, procedural-audio, 46-route conformance and save-integrity automation source;
- content sync, static project validation and official editor/build/test/package wrapper.

The current source slice implements the canonical six-layer decision order, advances all six authored nodes and reads the same source/claim truth as the other clients. Its evidence validator rejects orphan records, claim/source drift, rights mismatch, private paths, unregistered public-link origins and reconstruction disguised as historical evidence. It also implements the first native sound path in source: sound starts silent, a remembered preference is only armed until a player command, `M`/Gamepad Y and the Slate control toggle it, and rain/cue levels persist independently. It does **not yet claim native execution**, film quality, a packaged player, audible Unreal output or human playability: the C++ suites are authored but cannot execute until the official engine is installed. Native evidence-panel interaction, audio capture/listening, deeper camera grammar, final asset import and art-direction parity remain open gates.

Runtime chronicles are written under Unreal's ignored `Saved/SaveGames/shi-chapter-01-v6.json`. A malformed or inconsistent file is left in place, gameplay enters a clearly labeled unsaved preview, and replacement requires pressing **New chronicle** twice.

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
