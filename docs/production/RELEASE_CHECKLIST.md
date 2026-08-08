# Release checklist

## Product

- [ ] Chapter has an authored tension/recovery arc and at least three meaningful strategies.
- [ ] New player can finish without external explanation.
- [ ] Failure explains state and supports immediate recovery/restart.
- [ ] Save migrations tested from every published version.

## History and narrative

- [ ] P0 claims have edition, locator, classification, uncertainty and reviewer.
- [ ] Fictional dialogue/characters are marked.
- [ ] No copyrighted source text or private notes are packaged.
- [ ] Names, titles, dates and geography pass consistency review.

## Localization/accessibility

- [ ] Every supported locale passes missing-string and overflow tests.
- [ ] Arabic RTL and bidi isolation are screenshot reviewed.
- [ ] Keyboard, touch, gamepad and screen reader paths pass.
- [ ] Reduced motion, contrast, scaling and color-independent feedback pass.

The web pre-alpha automated subset currently passes semantic axe scans, conservative contrast/microtype contracts, 24 CSS pixel target geometry, modal and consequence isolation, 200% text, 320 CSS pixel 400%-equivalent reflow, a real Chrome `Ctrl++` 400% page-zoom path with verified reset, reduced motion, forced-colors structure/non-color cues, desktop/mobile reflow, and self-hosted face/direction/header-fit checks across all eleven desktop locale shells. These boxes remain open until every locale completes native linguistic and mobile release-candidate review, human screen-reader/keyboard paths pass, physical input paths pass, human-observed zoom/magnifier/Windows-high-contrast sessions pass and the licensed Unity runtime passes the observed gates in [`ACCESSIBILITY.md`](ACCESSIBILITY.md).

## Art/audio

- [ ] Every asset has provenance, rights, intended use and review state.
- [ ] Historical objects pass review; AI artifacts/anachronisms removed.
- [ ] 3D assets pass scale, normals, LOD, collision, UV and memory checks.
- [x] Procedural Chapter I audio passes rights, peak, EBU R128 loudness, DC, loop-boundary, cue audibility, pre-consent silence and channel-parity engineering gates.
- [ ] Human listening, sensory-load, mono perception, physical-device and native Unity audio review pass.

Chapter I now has a shared opt-in procedural rain/effects contract, independent ambience/effects controls, deterministic source synthesis and project-original provenance. No third-party or AI-generated audio media is packaged. The deterministic reference passes at −36.7 LUFS/−23.0 dBTP; the exact-implementation visible Chrome path proves digital silence before consent and passes at −35.7 LUFS/−21.7 dBTP. These measurements close the objective engineering subset only; the human and native-client box remains open in [`AUDIO_DIRECTION.md`](../art/AUDIO_DIRECTION.md).

## Engineering

- [ ] Clean checkout installs, validates and builds.
- [ ] Content hash matches both clients.
- [ ] Web console/network tests pass; performance budgets pass.
- [ ] Unity import, EditMode/PlayMode tests and target builds pass.
- [ ] Security, dependency, privacy and secret scans pass.
- [ ] Signed artifact hashes and rollback instructions recorded.

The current web checkpoint passes exact font-license/provenance validation, a restrictive same-origin CSP, an eleven-locale visible network run with no cross-origin HTTP(S) traffic, and hard initial/lazy/font/deployment size budgets. Those are pre-alpha evidence, not a substitute for the final clean release candidate, dependency/security review and rollback record.

## Release authority

Public repository publication is authorized by the current project request. Paid generation, store submission, analytics activation, account/email collection, and commercial launch require separate explicit approval.
