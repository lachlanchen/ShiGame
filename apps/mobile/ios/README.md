# Native SHI

SwiftUI presentation, SceneKit schematic map and Foundation campaign rules.
No embedded browser. The canonical narrative remains in `content/campaigns`
and `content/councils`; SwiftUI does not maintain a separate translation/story.

## Source preparation

The native project specifications, privacy manifest, export options and reviewed
app icon are versioned. Generated Xcode projects, bundled resource copies,
provisioning profiles and archives are not. From a source checkout with the
locked Node dependencies installed, run:

```bash
npm run sync:ios
npm run validate:ios-content
```

The exporter creates `SHI/Resources` from canonical campaign/council data,
shared UI strings and reviewed title art. Validation checks exact data, text,
title-art and icon parity. Then generate `project.yml` for the formal app or
`project-qa.yml` for the separate unsigned simulator app using XcodeGen on a Mac.
The checked-in build number is not a release reservation; numbered beta archives
must use the explicit provider-verified build number described below.

The September 30 source-export check succeeded outside the working tree, using
only selected staged source files and shared installed third-party dependencies.
Its game-core import resolved inside that export. This proves content generation
without untracked source dependencies, not a fresh dependency install, a fresh
Xcode-generated build or reproducible signing. Those remain separate gates.

The subsequent committed-source checkpoint generated a new QA Xcode project from
commit `a5aec37`, transferred hash-verified resources and built it on Apple
Silicon with the existing SHI cache. Its iPad simulator run passed 24 unit tests
and one complete chapter/council UI route. See the scoped
[build receipt](../../../store/ios-committed-source-checkpoint-20260930.json).
This does not establish signed-archive reproducibility, minimum-OS support,
physical-device qualification or availability to TestFlight testers.

## Numbered beta archives

Use `scripts/build-ios.sh` on the qualified signing Mac after syncing a frozen
source snapshot and generated resources into an isolated SHI staging directory.
Set `SHI_ROOT` to that directory, `SHI_VERSION` (default1.0.0), and explicitly
set `SHI_BUILD` to a new build number verified against App Store Connect.
The script overrides Xcode's version settings, checks the archived bundle ID
and version, and refuses existing archives/exports. It never uploads.

Signing must already be prepared on the qualified Mac. The script uses the
existing shared release keychain by default; `SHI_SIGNING_KEYCHAIN` may select
another explicitly prepared keychain. It does not read shared password files,
unlock keychains or change key access permissions. If signing cannot access the
key, stop and coordinate with the signing-host owner rather than resetting its
permissions. A successful source/build preflight is not proof of signing access.

One `.shi-ios-build-lock` under the staging release directory protects concurrent
invocations there; shared-host preflight must still rule out builds in other
SHI workspaces. Failed archives remain for diagnosis. Reconcile live processes
and artifacts before clearing a stale lock or retrying; never delete build1.
Run `node --test scripts/test-ios-build-preflight.mjs` for local admission tests.
These tests do not establish signing, runtime quality or TestFlight readiness.

## Unread Chapter I reactions

New native chronicles save an optional `pendingAftermath` boolean alongside the
already committed choices. On relaunch, Continue restores the final unread
reaction by deterministic replay; it does not issue another order. The reaction's
Continue button atomically saves `false` before dismissing it. If that write
fails, the reaction stays open and the existing error UI explains the failure.

The chronicle remains version 1: missing metadata in older saves means already
acknowledged, and loading does not rewrite the file. A pending flag with no
decision is invalid and preserved for recovery. This is presentation metadata,
not another source of campaign rules or cached consequences. Older clients may
ignore it; downgrade preserves choices but does not promise unread-scene state.

Commit, acknowledgement and restart share a synchronous re-entry guard. A
published-state observer cannot restart while an order is being saved/published,
or issue an order from inside restart publication. Regression coverage compares
the live session with a new session restored from disk, including seed, choices,
resources and pending reaction. This protects against inconsistent save and UI
state; it does not replace the normal explicit restart confirmation.

From the repository root, refresh and check the bundled content before copying
sources to an isolated Mac development checkout:

```bash
npm run sync:ios
npm run validate:ios-content
```

## Isolated simulator QA

Use the installed shared Xcode and XcodeGen. Follow the workstation resource
policy and private runtime handoff before booting a simulator. Select one
SHI-owned simulator by its exact UUID; never use `booted` on a shared Mac or
erase a simulator. Shut down only that owned simulator after collecting evidence.

`project-qa.yml` creates **SHI QA**, bundle `art.lazying.shi.aftermathqa`, with
signing disabled. It must never be archived, uploaded or submitted. Keep the
formal store source/artifact directory separate and unchanged.

In the isolated checkout's `ios` directory, with `SHI_SIMULATOR_UDID` set to the
verified SHI-owned simulator UUID, and `SHI_QA_RESULTS` set to a new result-bundle
path outside the source directory:

```bash
xcodegen generate --spec project-qa.yml
xcodebuild -project SHIAftermathQA.xcodeproj -scheme SHI \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$SHI_SIMULATOR_UDID" \
  -derivedDataPath ../qa-derived-data -resultBundlePath "$SHI_QA_RESULTS" \
  -jobs 2 -parallel-testing-enabled NO -collect-test-diagnostics never \
  test CODE_SIGNING_ALLOWED=NO
xcrun xcresulttool get test-results summary --path "$SHI_QA_RESULTS" --compact
```

Unit tests create uniquely named temporary saves and remove only those saves.
UI tests deliberately reset the isolated QA app through its normal confirmation
flow. Do not point them at an owner's existing store-app save.

The diagnostics flag avoids a lengthy shared-host system dump; it does not
disable assertions, result bundles or screenshots. For a suspected runtime crash,
collect targeted project-owned diagnostics separately. The UI harness restores
portrait orientation and terminates its QA app even after a failed test. It
requires compact controls to be fully visible and centers oversized Dynamic Type
choice cards in the unobscured viewport before tapping.

If a qualified Mac lacks XcodeGen, the existing generated **QA** project and its
generated Info.plist can be transferred from another SHI staging directory only
after checking that their specs and source/resource lists match this source set.
Regenerate when those inputs change. Do not substitute the signed store project.

Tests cover save-before-publish, invalid/repeated/reentrant orders, late Continue
callbacks, reload before Continue, final outcomes, complete chapter navigation,
largest Dynamic Type, Chinese/Arabic layout and rotation. Inspect the exported
screenshots as well as the result summary. Simulator automation does not prove
physical-device performance, VoiceOver usability, linguistic quality or film
decoder behavior.

## Tactical crossing foundation

`EngagementEngine.swift` now resolves the shared tactical crossing in native
Foundation: plan/field initialization, legal commands, player and opponent
metric layers, ordered outcomes and resulting campaign effects. It replays
saved identifiers and checks every derived value rather than trusting saved
metrics. Invalid orders leave the engine unchanged. It does not yet replace
the native chapter's abstract crossing choice or advance the campaign itself.

The canonical TypeScript generator exhausts all plan/condition paths into
`content/conformance/crossing-tactical-replays.v1.json`. Normal validation checks
that this versioned fixture still matches the authored definition and resolver.
The Swift checker verifies the definition SHA before comparing 122 checkpoints,
76 complete paths, legal-order lists, all intermediate layers, outcome effects
and 17 corrupted states. Extra top-level transport metadata follows the existing
canonical compatibility policy; altered history/metrics are rejected.

On the qualified Mac, with the source/fixture hashes verified:

```bash
bash scripts/test-native-crossing.sh
```

The runner uses the existing Xcode compiler in Swift 5 language mode and retains
a small CLI/log directory under `.runtime`; it neither installs nor signs an
app. On October 1, the actual Apple Silicon run passed all 122 checkpoints and
296 replayed commands. The complete current app source also type-checked for
the iOS 16 simulator target, in production and `SHI_RETREAT_PREVIEW` modes.
See the [scoped evidence](../../../docs/production/evidence/native-crossing-rules-20261001.json).

The `native-crossing-rules` CI job runs this same check on a standard hosted
Mac. The Linux content job independently regenerates and compares the canonical
fixtures. Neither job signs, installs or submits an iOS app.

The Foundation `CrossingCampaignEngine` now implements the revision-2 ledger
and personal reaction binding. Its 1,075 canonical checkpoints cover 210 legal
tactical paths under all three opening promises and both fields, 114 terminal
loss/recovery checkpoints and 504 rejected ledgers. It replaces the abstract
crossing effects once, preserves the other resource layers, derives promise
status and observed flags from actual orders, and retains the opening/seed on
explicit failed-crossing replay. Content hashes bind the campaign, encounter
and aftermath. The existing released choices-only save is not migrated.

```bash
npx vite-node scripts/crossing-campaign-conformance.ts --write
npm run validate:conformance
# On an existing Mac/Xcode installation:
bash scripts/test-native-crossing-campaign.sh
bash scripts/typecheck-native-ios.sh
```

Only regenerate after reviewed rule changes. The gzip fixture contains JSON;
validation compares decompressed canonical content rather than compressor
versions. The Mac runner also checks the existing 46 chapter routes. See the
[campaign ledger evidence](../../../docs/production/evidence/native-crossing-ledger-20261001.json).

## Playable crossing QA

The separate `project-crossing-qa.yml` now provides a native opening → three-order
crossing → personal consequence → chapter ending → Chen route. Generate it with
XcodeGen to create `SHICrossingQA.xcodeproj`. It is unsigned and simulator-only:
both `SHI_CROSSING_PREVIEW` and bundle `art.lazying.shi.crossingqa` are required.
Never archive, sign or upload this specification. The formal app keeps its
existing root screen and excludes the three development crossing resources.

`CrossingCampaignSession` atomically saves the replayable ledger and unread
reaction before publishing either. A separate development save preserves the
released chronicle. Failed writes leave the current scene in place; corrupt
saves require confirmed backup/restart. Failed crossings can be reconsidered
only after confirmation, preserving the opening and field conditions. Council
save identity includes the rules hash and full tactical history, so two
different crossings cannot silently share a council continuation.

```bash
npm run sync:ios
npm run validate:ios-content
# On the verified Mac, serially:
bash scripts/test-native-crossing-session.sh
bash scripts/typecheck-native-ios.sh
cd apps/mobile/ios
xcodegen generate --spec project-crossing-qa.yml
```

Use the resource/ownership checks above and a fresh result bundle for the
explicit SHI-owned simulator. Select
`-only-testing:SHIUITests/SHIUITests/testCrossingCampaignColdResumeAndChen`
with the crossing project; the ordinary app's UI tests target its different
root screen. The October 1 iPad simulator test completed the route and resumed
three times, including an unread field response and council response. All eight
captured screens received an agent visual review. See the
[checkpoint and remaining gates](../../../docs/production/NATIVE_CROSSING_PLAYABLE_20261001.md).

This preview supports English and Simplified Chinese, with explicit English
fallback elsewhere. Shared metric labels retain all eleven translations, but
this does not qualify eleven-language UI coverage. Phone/large-type/Chinese
visual checks, failed-route UI, physical devices, retained-save upgrades, signing
and beta distribution remain separate gates. The presentation remains primarily
text and a schematic map, not approved cinematic art or music.

## Chen council

A surviving Chapter I exposes the optional council on its ending screen. Three
rounds use the shared bilingual definition, with explicit English fallback for
other locales. Inspecting an offer is save-inert; confirming writes the council
atomically before showing its response. Continue cannot commit another order.
Restart has a separate confirmation and never resets Chapter I.

The council has its own Application Support save, `SHI/chen-council-v1.json`.
Its schema version, definition SHA-256 and complete originating chapter identity
must match before replaying choices. Derived metrics are recomputed, not trusted
from disk. Invalid saves are preserved; explicit recovery makes a backup first.
These are platform-local saves, not a promise of web/iOS save interchange.

Regenerate or verify canonical replay fixtures on Linux from the repository root:

```bash
npx vite-node scripts/council-conformance.ts --write
npm run validate:conformance
```

Only regenerate after reviewing intentional rule/content changes. On a Mac with
the canonical files and native sources, compile the Foundation-only checks from
the repository root (choose a project-owned output directory):

```bash
mkdir -p .runtime/native-council-check
xcrun swiftc apps/mobile/ios/SHI/CampaignEngine.swift \
  apps/mobile/ios/SHI/CouncilEngine.swift \
  apps/mobile/ios/Tests/CouncilConformance.swift \
  -o .runtime/native-council-check/council-conformance
.runtime/native-council-check/council-conformance content/councils/chen-council.v1.json \
  content/conformance/chen-council-replays.v1.json
```

Coverage is all77 legal council routes/231turns, intermediate metrics, previews,
saved replay and four outcomes. Eight council unit tests also cover durable save
failure, corruption recovery, chapter isolation and stale/reentrant callbacks.
The UI suite plays the chapter and council through normal controls, checks
background/termination resume, cancelled restart, largest text and rotation.
Human historical/prose/fun review and engine-client council presentation remain
separate quality gates; passing native tests does not approve store publication.

The qualified shared-machine roles and exact simulator ownership live in the
ignored runtime handoff. Prefer the Apple Silicon mini for current-toolchain QA,
the existing KVM Mac for older-runtime regression, and the physical-device hosts
for coordinated device tests. Never assume every reachable Mac has a simulator
toolchain or enough free storage for a build.

Use `Tests/Conformance.swift` separately with the unchanged `CampaignEngine.swift`
to compare the native rules against `content/conformance/chapter-01-replays.v1.json`.
The development continuation and its QA-only boundaries are documented in
[`NATIVE_REFUGE_UI_20261001.md`](../../../docs/production/NATIVE_REFUGE_UI_20261001.md).
