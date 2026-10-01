# Native installed-container upgrade qualification

October 1, 2026. This checkpoint addresses a release blocker for the continuous
chapter: an app update must preserve a committed choice and its unread reaction.
It does not add a new story scene or admit cinematic media.

## Scope and reproducible method

The baseline is reconstructed from historical source commit
`f443d6a5be7ea3bc16bfe1aa39a28dcdbf79d960`, not the retained App Store binary.
Its original Swift app sources and canonical campaign are unchanged. Resources
are regenerated from that snapshot with the existing shared Node dependencies;
only the new simulator identity specification and UI-test harness are overlaid.
This is not a from-empty-cache historical build reproduction. Its campaign hash
is the verified release-format hash `445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c`.

The candidate app source is `45cf0f94a2a147fce0326a2c4ac9f0fd97d479f5`.
The new harness does not modify its rules or presentation. Both apps use
`art.lazying.shi.upgradeqa`, unsigned, with production gameplay flags. The only
`SHI_UPGRADE_QA` compile flag belongs to the UI-test target. No owner app, account,
save, signing setting or production store association is changed.

1. Build the historical app and exercise its ordinary UI to commit
   `hide-the-register`, stopping at its unread reaction.
2. Copy the resulting save into private evidence; do not inject a fixture.
3. Build and install the candidate over the same simulator identity, without
   uninstalling or erasing data.
4. Require the same data-container path and byte-identical save before launch.
5. Continue the saved reaction, commit `release-oldest`, cold-relaunch during
   that reaction, then finish with `cut-the-carts` and `race-for-chen`.
6. Cold-relaunch the completed chapter. Verify exactly four choices, the same
   original seed, no unread scene and the current reviewed campaign fingerprint.

The reusable runner is `scripts/test-ios-installed-upgrade.sh`; native setup is
in [the iOS guide](../../apps/mobile/ios/README.md). It requires a stopped,
explicitly named SHI simulator and shuts that exact device down on exit. Fresh
logs, result bundles, artifacts and save copies remain private under `.runtime`.
Generated project inspection checks all four app identities and test flags.

## Observed result

Both UI phases passed on the same iPhone SE (3rd generation) simulator,
iOS 26.3.1 / x86_64, using Xcode 26.3 on macOS 15.7.9. Each phase reports one
passed test, zero failures and zero skips. The historical and installed-but-not-
launched save hashes match exactly. The final file contains the same seed and
the four expected decisions, with the unread flag cleared and current campaign
hash. Three captures were inspected: historical reaction, identical restored
reaction, and the ending node's map/resources. The last image does not show the
below-fold ending text; the UI assertion and final file supply that check.

The wrapper's final copy initially failed because Xcode relocated the container
during its own test installation. The corrected reader re-resolved that path
and verified the same untouched final save, with no app relaunch or new choice.
This readback passed separately; do not describe the final corrected script as
having completed a single fresh uninterrupted run. Debug app code hashes refer
to `SHI.debug.dylib`, not just the shared launcher stub. Exact hashes and scoped
results are in the [receipt](evidence/native-installed-upgrade-20261001.json).

All owned simulators were confirmed shut down, with no remaining SHI test/build
process. The final check found 79% memory free and 267.50 MiB swap on the Mac.

## Harness corrections

The initial historical UI phase passed, but Xcode shut down the simulator before
the container readback. The runner now owns the boot explicitly. A subsequent
run encountered its previous unread save, which hides Settings; setup now
acknowledges that QA-only reaction through the UI before confirming a reset.
The successor compiled this change but ran stale unsigned test code. Explicit
installation of the built test runner corrected it; an independent readback
matched the installed and built test executable hashes. No app rule, assertion
or save was changed to manufacture a passing result. Failed evidence is retained.

## Remaining release gates

This does not qualify retained signed-binary upgrades, a real iPad/iPhone,
minimum iOS, real-device performance, TestFlight availability or human enjoyment.
It does not convert old chronicles into revised tactical crossing histories.
The revised crossing remains separately gated, and rights-reviewed Musia/video/
Blender media remains independent work. No new beta upload is implied.

Read-only coordination found the physical iPad available and the Android devices
authorized, but the Mi 10 Pro still had another project's active controller.
The established signing keychain still requires local owner authorization.
Other projects' controllers, shared services and keychain permissions were left
unchanged. The preceding `45cf0f9` GitHub validation and Pages runs both passed.
