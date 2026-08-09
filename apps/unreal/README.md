# SHI Unreal cinematic client

This is the priority Unreal Engine 5.8 C++ client for SHI. It consumes the same canonical schema-v7 campaign as Web and Unity. It is a real project boundary, but native compilation and play are not claimed until the official Linux installed build is present and the recorded gates pass.

## Current source slice

- `.uproject`, Game/Editor targets and runtime module;
- canonical JSON loader with act/time/site/choice parsing and chronology validation;
- pure deterministic campaign session checked against a 46-route, fixed-seed cross-engine replay corpus;
- programmatic Daze command space, camera, fog, light and field markers;
- Slate command surface with visible resources, act/scene/site/date, reversible order selection, requirements, explicit issue-order progression, autosave state and guarded restart;
- deterministic choice, oath, pressure, pursuit, prepared-method-read and field-condition resolution in the canonical six-layer order;
- authoritative save-v6 export/replay, resume and atomic local writes that reject tampered routes without trusting stored totals;
- mouse, keyboard and standard-gamepad command input;
- schema-v7, 46-route conformance and save-integrity automation source;
- content sync, static project validation and official editor/build/test/package wrapper.

The current source slice implements the canonical six-layer decision order, advances all six authored nodes and defines exact Web-parity evidence. It does **not yet claim native execution**, film quality, a packaged player or human playability: the 46-route C++ suite has been authored but cannot be executed until the official engine is installed. Audio, source-ledger, deeper camera grammar, final asset import and art-direction parity remain native implementation gates.

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
