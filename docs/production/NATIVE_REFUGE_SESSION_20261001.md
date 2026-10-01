# Native refuge continuation: durable session

The native rules already agree with the web continuation. This checkpoint adds
the missing durable session for the named shelter → morning → contact sequence.
It is not yet connected to SwiftUI or shipped in a store build.

`RefugeContinuationSession` consumes six explicitly supplied content byte sets:
retreat rules/story, night rules/story, morning and contact. It verifies the
retreat definition, development-only story boundaries and night choice IDs;
the pure engine additionally verifies supported continuation definitions.
All six raw-byte fingerprints and the completed retreat's entry/choice identity
bind the chronicle. A foreign route or even a changed story fingerprint requires
explicit recovery rather than silently reinterpreting progress.

Choices persist before becoming visible. Failed writes leave the engine and
reaction unchanged. A pending reaction blocks repeated decisions; only its
current token dismisses it. Cold resume does not write and presents the latest
recorded response again, as in the existing retreat session. Corrupt/foreign
saves remain untouched until a caller obtains explicit restart confirmation;
recovery copies the original before replacement. Earlier chapter and retreat
files are never written by this session.

## Executed evidence

- Existing Mac mini: Xcode 27.0 / 27A266a. Existing SDK reused; no simulator,
  physical device, signing, keychain or store state changed.
- Native `swiftc` compile and executable: passed **44 checkpoint checks across
  four completed retreat entries**, including no-write opening, invalid orders,
  injected out-of-space failure, durable decisions, duplicate/reaction lock,
  cold resume, completion lock, corrupt-save backup, stale revision refusal,
  missing content refusal and unchanged retreat history.
- `swiftc -typecheck -target arm64-apple-ios16.0` against the installed iPhoneOS
  SDK: passed for the complete session dependency set.
- Transferred source archive verified locally and remotely with SHA-256
  `9aff304574494119ab841bf8511357196736e4743e579ca170af48e0d18457ef`.
- Source test: `apps/mobile/ios/Tests/RefugeContinuationSessionChecks.swift`.
  It uses the existing shared parity fixture rather than invented resources.

The session introduces no new historical claims or prose. The authored refuge
scene records its Tongjian volume-eight source boundary; its householder,
personal promises, contact and alternate outcomes remain original dramatization.

## Remaining playable integration

Add the native shelter/morning/contact presentation using these shared story
records; explicitly admit the four refuge resources only to the existing
unsigned QA project and gate loader. Connect the retreat conclusion without
skipping its unread response. Verify resource isolation in generated production
and QA projects, then run full-route simulator/device UI tests with cold resume,
accessibility, unavailable record choices and write-error feedback. No native
scene, media playback or player emotional-quality acceptance is claimed here.
