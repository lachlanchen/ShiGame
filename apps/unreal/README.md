# SHI Unreal cinematic client

This is the priority Unreal Engine 5.8 C++ client for SHI. It consumes the same canonical schema-v7 campaign as Web and Unity. It is a real project boundary, but native compilation and play are not claimed until the official Linux installed build is present and the recorded gates pass.

## Current source slice

- `.uproject`, Game/Editor targets and runtime module;
- canonical JSON loader with act/time/site/choice parsing and chronology validation;
- programmatic Daze command space, camera, fog, light and field markers;
- Slate command surface with visible resources, act/scene/site/date, reversible order selection, requirements and explicit issue-order progression;
- deterministic choice, oath, pressure, pursuit, prepared-method-read and field-condition resolution in the canonical six-layer order;
- schema-v7 automation test;
- content sync, static project validation and official editor/build/test/package wrapper.

The current source slice implements the canonical six-layer decision order and advances all six authored nodes. It does **not yet claim exact Web parity**, native execution, film quality, a packaged player or human playability. Detailed resolution records, save/replay, controller, audio, source-ledger, camera grammar and art-direction parity are the next native implementation gates.

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
