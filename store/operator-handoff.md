# SHI mobile publication

## Apple public release accepted — 2026-09-30

The owner explicitly requested post-processing and listing the Apple game online.
Live readback confirmed version1.0.0, retained build1, VALID, with status
PENDING_DEVELOPER_RELEASE: Apple review had passed. Reverified USD0.99 base price
and the exact173 authorized markets, with no preorders. Mainland China/Vietnam
remain excluded. No build substitution, new upload or review withdrawal.

Sent one appStoreVersionReleaseRequests POST for version
ef1a86c7-68f4-4eb5-bc2e-e3c3d3c39e8c. Apple accepted it and readback now reports
READY_FOR_SALE / READY_FOR_DISTRIBUTION. All173 selected territories report
PROCESSING_TO_AVAILABLE; the first public US page probe remains HTTP404.
This supersedes historical Apple hold instructions, but does not prove storefront
propagation. Next step is read-only availability/listing verification, not another
release request. New beta development remains separate from this approved build.

Public destination: https://apps.apple.com/us/app/id6816377548
Private receipt, intent, exact preflight and readbacks are in
.runtime/native-council-20260930/apple-*-release*.json and
apple-public-release-{intent,receipt}.json. No Google state was changed here.

## Recurring beta authorization — 2026-09-30

The owner explicitly requested regular TestFlight and Google Play internal-test
upgrades so they can test ongoing development. Use the existing SHI owner tester
groups after each meaningful, qualified mobile checkpoint. This is standing
authorization for those beta uploads/distributions, not a request to upload
every edit or to widen tester access. See [beta workflow](BETA_WORKFLOW.md).
It does not authorize replacing a build under formal review or publicly releasing
new development builds. The existing Android build1 authorization below remains
separate. Do not infer provider availability from a successful upload alone.

## Android public-release authorization — 2026-09-30

The owner explicitly approved promoting the retained tested Android 1.0.0 (1)
to Production, submitting it for review, and publishing once approved at the
US$0.99 base price in all eligible markets (the existing 169-market selection).
This supersedes the Android public-release hold in historical notes below;
Apple remains on manual hold and was not touched.

The earlier September 30 live audit found 14 approved changes held by managed
publishing, including the closed Alpha build and country settings. Production
was INACTIVE with no release. The Production row in Publishing overview was
only a country-setting change, not approval of a Production build.

The owner restored Console login. The exact retained AAB and paired APK hashes
match `release.json`; the price is Paid / United States USD0.99, and all 169
targeted countries match the territory manifest. Used Add from library for
versionCode 1; no new upload or build. Release `1.0.0 (1) - Chapter I` passed
the preview as Ready to release. No blocking errors; the subsequent track
dashboard recommends R8 optimization, which is not a reason to replace this
tested release during review.

Confirmed submission once at **2026-09-30 07:47 HKT** (23:47 UTC September 29).
Submission activity identifies **submission 3, Production, In review**.
Production track `4698739578429753044`, release `1`, shows Active with this
release **in review** and 169 countries. Active does not mean publicly live.
Managed publishing stays ON. The earlier 14 approved changes remain held;
the new Production release is a separate change undergoing review.
Automatic pre-review checks subsequently completed; the Console explicitly
reports **Your changes are now in review**. Public US listing still returned
HTTP404. The full local repository validation also passed (76 core/web tests);
that checks the development worktree, not a replacement for the retained
signed artifact's original qualification.

Next: re-read the exact release and Publishing overview after approval, then
publish the authorized candidate and its reviewed launch settings. Preserve
unrelated changes and stop if a different build or scope appears. Do not
resubmit, rebuild or substitute the newer development worktree. Verify the
public listing separately after Google accepts publication. The owner's
authorization already covers this final Android step; no repeat confirmation
is needed. Apple was not rechecked or changed. No background polling job is
running; review completion requires a later status check.

## Historical qualification and submissions

Owner authorized iOS/Android testing and review on 2026-09-26, specified genuinely
native iOS, and selected **US$0.99 paid up front**. Do not create a free Play app.
Apple first release is manual. Testing, submission, approval, and public release
must be recorded separately. Native iOS1.0.0(1) is **WAITING_FOR_REVIEW** as of
2026-09-26T10:39:46Z; it is not approved or publicly released. TestFlight internal
build state is **IN_BETA_TESTING**. A fresh September 27 audit found the existing
owner tester still **NOT_INVITED**, correcting the earlier invitation claim.
One invitation was then accepted by Apple and read back as **INVITED**. A later
tester readback reports **INSTALLED**; this is not a SHI-specific physical-device
launch, gameplay or save-recovery QA receipt.

iOS uses SwiftUI, SceneKit and a Foundation campaign engine, not a web wrapper.
Android bundles the existing offline game with Capacitor. Both use the versioned
canonical chapter, and iOS must pass the shared 46-route conformance corpus.
The Unreal desktop field/combat scene is not in these mobile builds.

Learned from current sibling repositories:

- L & N: exact build hashes, same marketing version in archive and store, manual
  first Apple release, isolated provider tabs and same-session signing unlock.
- Bunko: native upgrades must not retain obsolete service-worker app shells;
  Preferences requires an Apple privacy manifest (Android only in SHI).
- AiMemo: native SwiftUI/XcodeGen layout; testing and each platform's submission
  proceed independently. Do not copy its account/AI/privacy declarations.
- EchoMind: preserve live reviews; source-bound qualification and exact receipts.
- LazyEdge: reuse pinned SSH/access paths; never expose CDP or raw worker ports,
  change a sibling service, or publish credential/browser material.

Private runtime, signing/profile locations, and provider receipts are recorded
under `references/private/mobile-publication.md`. No sibling files are modified.

Current official references checked 2026-09-26:

- [Capacitor 8](https://capacitorjs.com/docs): Android packaging only.
- [Google target SDK](https://developer.android.com/google/play/requirements/target-sdk): API 36.
- [Apple testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/): internal testing is not App Review approval.

Qualification and provider results will be appended to exact artifact records.

## Native iOS qualification and submission

- Foundation rules:46canonical routes,183turns and all final states match.
- iPhone17ProMax/iOS26.3.1: full chapter and force-close/resume test passed.
- iPadPro13M4/iOS26.3.1: full chapter/resume plus largest-text Chinese and
  Arabic-layout tests passed. All tests non-skipped. Simulators were shut down.
- Full repo validation:65core/web tests; shared-content, provenance, font/privacy,
  contrast and web payload budgets pass. Physical-device performance remains
  unqualified; simulator screenshots are not physical-device evidence.
- Signed IPA SHA256, provider build/review IDs and manual release are in
  `release.json`. Six unaltered native screenshots have COMPLETE delivery state.
- Owner selected all eligible markets. Apple now has 173 territories selected;
  mainland China and Vietnam are excluded pending game licences.
  Future-territory autoavailability is off. Exact lists and official references
  are in [the territory manifest](territories-2026-09-26.json).
- Automatic Mac/Vision storefront availability is disabled pending testing.
- Android full offline Chapter I and force-close recovery passed on API34,
  including the completed ending. Release unit/lint and final65core/web tests
  passed. The final web build still passes unchanged payload budgets.
- Google accepted AAB1(1.0.0), target36, min24. Internal release is available to
  the one owner tester; it is not yet reviewed. Test URL is in `release.json`.
  No public production rollout has been made. The API36.1 emulator fault and
  physical-device qualification limits remain recorded in MOBILE_RELEASE_1.md.
- Android Alpha closed review was submitted at2026-09-26T11:18:08Z with13changes
  and the SHI owner list. Those 13 changes are now ready to publish but held.
  Closed Alpha and inactive production have 169-market targeting saved; the two
  country-setting changes are in review. Managed publishing is ON. No production
  release or bundle was added. Keep the submitted bundle unchanged and do not
  click Publish without separate visible release authorization.
- Google reported a privacy-URL DNS failure. Public resolvers8.8.8.8/1.1.1.1
  returned GitHub Pages addresses and HTTPS returned200. Used Google's explicit
  Proceed anyway workflow for the apparent false positive, not a false claim of
  fixing DNS. Monitor review feedback; do not edit sibling DNS infrastructure.

## Territory and shared-device follow-up

- USD0.99 US pricing retained, with existing local currency prices. Apple is
  still Waiting for Review with MANUAL release; no review was withdrawn.
- Google excludes its five disabled paid-app entries, Russia and Belarus for
  paid-download restrictions, and Vietnam pending licensing clarification.
  The latter is a conservative hold, not a finding that an offline game is
  prohibited. Recheck before public release.
- The owner's canonical shared-device handoff path is recorded only in the
  private mobile-publication note. Read it before reserving physical devices;
  receiving the note does not establish physical-device QA. No device was used
  and no other project's runtime or session was changed for this follow-up.

## Testing follow-up — 2026-09-27

- Owner again requested test submission. Reconciled exact existing build 1 on
  both platforms instead of uploading or submitting a duplicate.
- Apple: native 1.0.0(1) is VALID, not expired, attached to SHI Internal and
  IN_BETA_TESTING. App Review remains WAITING_FOR_REVIEW with MANUAL release.
  Only the already configured owner tester received the missing invitation;
  no external/public beta group, new tester, review withdrawal or release.
- Google: 1.0.0(1) is Active and Available to internal testers. Only SHI Internal
  Owner is selected. Other apps' email lists remain unselected and unchanged.
  Install through the internal-test link in release.json with that account.
  The latest Publishing overview now consolidates 14 changes as ready to publish,
  including both country settings. All remain held; Managed publishing stays ON.
  No Changes in review section remains. No publication action was taken.
- Current source snapshot still matches the retained 170-file build manifest.
  No cinematic/music candidates entered these signed or submitted artifacts.
- Continue media work in the separate
  [Part 01 production packet](../docs/production/CINEMA_PART_01.md).
