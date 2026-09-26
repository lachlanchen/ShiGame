# SHI mobile publication

Owner authorized iOS/Android testing and review on 2026-09-26, specified genuinely
native iOS, and selected **US$0.99 paid up front**. Do not create a free Play app.
Apple first release is manual. Testing, submission, approval, and public release
must be recorded separately. Native iOS1.0.0(1) is **WAITING_FOR_REVIEW** as of
2026-09-26T10:39:46Z; it is not approved or publicly released. TestFlight internal
build state is **IN_BETA_TESTING**, with the existing owner account invited.

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
