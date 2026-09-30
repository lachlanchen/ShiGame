# SHI beta upgrade workflow

Owner authorization: September30,2026 — regularly submit development upgrades
to TestFlight and Google Play internal testing so the owner can try them.

## Cadence and scope

Distribute after a meaningful playable improvement or important fix passes its
mobile quality gates. Batch small edits. When actively developing, aim for one
useful beta per completed checkpoint; do not force a broken build to meet a date.
This is checkpoint-driven work, not an installed scheduler or a promise of
unattended daily uploads. Platform readiness is independent: one platform's
failure must not be described as successful distribution to both.

Use only the existing SHI internal groups and tester membership. No new public
beta, external tester invitation, price/territory change, review withdrawal or
production promotion is implied. Preserve the separately authorized Android
build1 production workflow. Apple build1 was separately authorized and released
on September30; new betas do not inherit public-release authorization.

## Before each upload

1. Read back provider builds and test-track state. Reconcile any in-flight
   upload before retrying; choose a new unused, increasing build number.
2. Freeze an exact source manifest and identify the changes since the prior
   distributed beta. Keep existing production artifacts and receipts intact.
3. Validate shared content/rules, localization coverage, types and tests. Build
   native SwiftUI iOS and Android independently, from the same narrative data.
4. Test a complete playable route, council continuation where applicable,
   lifecycle and saved-progress recovery. Test upgrade from the prior distributed
   app without erasing its save. Inspect actual screenshots and mobile layout.
5. Keep unreviewed Musia/video candidates out. Candidate B is a private working
   selection, not a release-admitted soundtrack. No implied cinematic-asset claim.
6. Build signed release artifacts in a distinct versioned staging path. Never
   upload the unsigned art.lazying.shi.aftermathqa simulator project. Verify bundle
   identity, version, signature, content fingerprint, artifact hash and source
   manifest. Respect the single-heavy-job/shared-host resource limits.

## Distribution and evidence

- Apple: upload once, wait for VALID processing, associate with the existing
  internal group, and verify beta availability. Do not change the formal App
  Review build association. Add concise localized testing notes as supported.
- Google: upload once to Internal testing, inspect the release, and distribute
  only to the existing owner list. Read back track/version and availability.
  Do not publish unrelated queued changes or alter Production/closed tracks.
- Record per-platform build number, immutable artifact/source hashes, provider
  receipt/state, time and tester access. Uploaded, processing and available are
  distinct states. Never call a pending or rejected build ready to install.
- Tell the owner what changed, what to test, known limitations and where to
  install. Use the existing TestFlight app/group and the internal Play link in
  release.json. Preserve a private detailed operator log without credentials.

## Next candidate

Prepare the accumulated saved-consequence, lifecycle and Chen council work as
the next mobile beta. Build2 is only a tentative next number until live provider
readback. The current unsigned iPad QA result passed25/25 and has reviewed
relaunch/ending screenshots; that is not a signed package, upgrade test or upload.
Retained release1.0.0(1) must not be overwritten. The iOS script now requires an
explicit SHI_BUILD and refuses existing archives/exports; Android still needs
numbered staging before its next release build.

September30 readiness probe: Apple lists only build1, VALID and not expired.
The established signing Mac is reachable with the existing SHI workspace,
profile, signing keychain and XcodeGen present (Xcode26.3). File presence does
not prove unlocked signing or a valid new archive. No upload has been performed.

## Incremental media direction

The owner reaffirmed use of image generation, Musia, LocalVideoGen and Blender
for game materials. Use an original, consistent cast rather than the owner's
likeness. Reuse reviewed character references and rigs across images and shots;
record costume, weather, geography, props and music motifs. Tie each asset to a
specific playable scene and preserve subtitles, readable outcomes, pause/skip
and reduced motion. Small reviewed additions can join successive betas without
waiting for all cinematics to be complete. Tool availability alone is not asset
approval; paid generation still needs explicit approval.

## Provider references

- [Apple internal testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)
- [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Google internal testing](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en-EN)

Checked September30,2026. These describe provider workflow, not SHI's live state.
