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

The web pre-alpha automated subset currently passes semantic axe scans, conservative contrast/microtype contracts, 24 CSS pixel target geometry, modal and consequence isolation, 200% text, Arabic RTL, reduced motion and desktop/mobile reflow. These boxes remain open until every locale, human screen-reader/keyboard path, physical input path, 400%/forced-colors review and the licensed Unity runtime pass the observed gates in [`ACCESSIBILITY.md`](ACCESSIBILITY.md).

## Art/audio

- [ ] Every asset has provenance, rights, intended use and review state.
- [ ] Historical objects pass review; AI artifacts/anachronisms removed.
- [ ] 3D assets pass scale, normals, LOD, collision, UV and memory checks.
- [ ] Music/SFX licenses and loudness/loop checks pass.

## Engineering

- [ ] Clean checkout installs, validates and builds.
- [ ] Content hash matches both clients.
- [ ] Web console/network tests pass; performance budgets pass.
- [ ] Unity import, EditMode/PlayMode tests and target builds pass.
- [ ] Security, dependency, privacy and secret scans pass.
- [ ] Signed artifact hashes and rollback instructions recorded.

## Release authority

Public repository publication is authorized by the current project request. Paid generation, store submission, analytics activation, account/email collection, and commercial launch require separate explicit approval.
