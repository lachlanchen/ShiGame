# Release checklist

## Product

- [x] Chapter has an authored tension/recovery arc and at least three meaningful strategies.
- [ ] New player can finish without external explanation.
- [x] Failure explains state and supports immediate recovery/restart.
- [x] Save migrations tested from every published version.

## History and narrative

- [ ] P0 claims have edition, locator, classification, uncertainty and reviewer.
- [x] Fictional dialogue/characters are marked.
- [x] No copyrighted source text or private notes are packaged.
- [ ] Names, titles, dates and geography pass consistency review.

## Localization/accessibility

- [ ] Every supported locale passes missing-string and overflow tests.
- [ ] Arabic RTL and bidi isolation are screenshot reviewed.
- [ ] Keyboard, touch, gamepad and screen reader paths pass.
- [ ] Reduced motion, contrast, scaling and color-independent feedback pass.

The web pre-alpha automated subset currently passes semantic axe scans, conservative contrast/microtype contracts, 24 CSS pixel target geometry, modal and consequence isolation, 200% text, 320 CSS pixel 400%-equivalent reflow, a real Chrome `Ctrl++` 400% page-zoom path with verified reset, reduced motion, forced-colors structure/non-color cues, desktop/mobile reflow, and self-hosted face/direction/header-fit checks across all eleven desktop locale shells. These boxes remain open until every locale completes native linguistic and mobile release-candidate review, human screen-reader/keyboard paths pass, physical input paths pass, human-observed zoom/magnifier/Windows-high-contrast sessions pass and the licensed Unity runtime passes the observed gates in [`ACCESSIBILITY.md`](ACCESSIBILITY.md).

## Art/audio

- [x] Every currently packaged asset has provenance, rights, intended use and review state.
- [ ] Historical objects pass review; AI artifacts/anachronisms removed.
- [ ] 3D assets pass scale, normals, LOD, collision, UV and memory checks.
- [x] Procedural Chapter I audio passes rights, peak, EBU R128 loudness, DC, loop-boundary, cue audibility, pre-consent silence and channel-parity engineering gates.
- [ ] Human listening, sensory-load, mono perception, physical-device and native Unity audio review pass.

Four authored Unreal blocks now close a bounded runtime subset. `shi-command-weight-v1`, `shi-command-surface-v1`, `shi-wet-field-environment-v1` and `shi-daze-field-shelter-v1` pass deterministic source/interchange validation, explicit LOD/UV/material/collision contracts, UE 5.8.1 admission, compile-clean blockout PBR graphs, forced cook, clean archived-player launch and visible story/engagement use. The shelter package cooks 509 packages—exactly the accepted 505 baseline plus its four assets—and visibly completes Broken Crossing before returning the canonical campaign unchanged. The project-wide 3D box stays open because rain/vegetation, formations, period-reviewed characters/interaction hands, final materials/sky/lighting, physical final-scene performance/accessibility and human art/cinematic/historical review remain incomplete. See [`unreal-daze-field-shelter-presentation-status.json`](evidence/unreal-daze-field-shelter-presentation-status.json) and [`unreal-daze-field-shelter-import-status.json`](evidence/unreal-daze-field-shelter-import-status.json).

Chapter I now has a shared opt-in procedural rain/effects contract, independent ambience/effects controls, deterministic source synthesis and project-original provenance. No third-party or AI-generated audio media is packaged. The deterministic reference passes at −36.7 LUFS/−23.0 dBTP; the deployed visible Chrome path proves digital silence before consent and passes at −35.7 LUFS/−22.4 dBTP. Direct packaged-Unreal SDL/PipeWire capture independently proves 4.01 seconds of pre-consent and 3.97 seconds of post-disable digital silence, plus a 16.13-second opted-in programme at −39.7 LUFS and −27.7 dBFS peak. These measurements close the Web and priority-native objective engineering subset only; human perception, physical devices and the maintained Unity runtime remain open in [`AUDIO_DIRECTION.md`](../art/AUDIO_DIRECTION.md).

## Engineering

- [x] Clean checkout installs, validates and builds.
- [x] Content hash matches Web, Unreal and Unity staging; packaged Unreal bytes match canonical content.
- [x] Web console/network tests pass; performance budgets pass.
- [ ] Unity import, EditMode/PlayMode tests and target builds pass.
- [ ] Security, dependency, privacy and secret scans pass.
- [ ] Signed artifact hashes and rollback instructions recorded.

The current web checkpoint passes exact font-license/provenance validation, a restrictive same-origin CSP, an eleven-locale visible network run with no cross-origin HTTP(S) traffic, and hard initial/lazy/font/deployment size budgets. Those are pre-alpha evidence, not a substitute for the final clean release candidate, dependency/security review and rollback record.

## Release authority

Public repository publication is authorized by the current project request. Paid generation, store submission, analytics activation, account/email collection, and commercial launch require separate explicit approval.
