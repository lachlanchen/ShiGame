# Native SHI

SwiftUI presentation, SceneKit schematic map and Foundation campaign rules.
No embedded browser. The canonical narrative remains in `content/campaigns`
and `content/councils`; SwiftUI does not maintain a separate translation/story.

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
The September 27 development checkpoint is documented in
[`CONSEQUENCE_PRESENTATION_2026_09_27.md`](../../../docs/production/CONSEQUENCE_PRESENTATION_2026_09_27.md).
