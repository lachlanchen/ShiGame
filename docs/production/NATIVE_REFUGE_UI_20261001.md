# Native refuge scenes: QA integration

The native retreat conclusion can now open shelter → morning → contact,
after its last saved response has been read. `NativeRefugeView` uses the same
Chinese authored story records and deterministic continuation session as the
web campaign. No duplicate narrative or resource effects are authored in the
view. This is an unsigned development preview, not a submitted build.

## Playable behavior

- Select a choice, read its intention, then explicitly confirm. Unavailable
  grain or record choices remain visible with reasons; they cannot commit.
- Saving precedes the matching character reaction. Continue is a separate
  action; a response never automatically chooses the next order.
- A morning promise is kept or broken only if it was made during the night.
  Contact scenes follow the actual household/river branch. Record privacy and
  surviving public inventory are retained from the retreat, not recreated.
- Returning to the retreat and reopening the continuation replays the saved
  latest response. Incompatible progress blocks decisions and requires explicit
  replacement; corruption recovery preserves the original file first.
- Grain, debts and promise/contact results remain readable. The conclusion
  does not claim message delivery, a reunion or discharged debts.
- Scrollable single-column reading, Dynamic Type, accessible control IDs,
  selected traits and heading focus are provided. No automatic media/motion
  occurs. Screen evidence and actual assistive-technology qualification are
  separate from these implementation properties.

## Historical boundary

The cited local Tongjian passage, volume eight, lines 2791–2801, was reread:
Chen Sheng's defeat/death, alienation of followers, Lü Chen's recovery of Chen
and Song Liu's surrender/execution establish the surrounding situation. It
does not attest these household conversations, their dates, messages or
counterfactual outcomes. Source prose and private books were not transferred.
The native source drawer preserves the shared story's explicit boundary.

## Verified before simulator execution

- Full native SwiftUI source set passed iOS16 arm64 typecheck on the existing
  Mac mini SDK. No new SDK/tool installation.
- Existing XcodeGen2.46 on KVM generated both actual projects. The build-phase
  validator passed: retreat and four refuge draft resources and the compilation
  gate are present only in unsigned QA; all absent from production Debug/Release.
- Source v2 transfer SHA:
  `7ebd6e457d5591a925bd5f71388cfbed6c00c90aa255ab6185c1dbe95731a3f2`.
- Generated source/project transfer SHA:
  `0e14510066a7724c186d96dc5545b7e2135091633f331bda41a4ce975c669b07`.
- QA bundle resource unit test expanded; full-route UI test expanded to cover
  night labour, kept promise, unavailable stripped record, entrusted route,
  reopened response and conclusion. These are test definitions until run.

## V1 failure and correction history

The first full-route test reached the refuge and failed at its saved-label
accessibility assertion after 386 seconds. A read-only inspection of the actual
simulator chronicle confirmed `orders: ["offer-labour"]`; the decision persisted.
The response container lacked the explicit `.accessibilityElement(children:
.contain)` used by the native retreat. A local follow-up adds that containment
and checks the response container plus its Continue control, rather than relying
on a leaf label beneath an identified container. This is a proposed correction,
not a verified fix; screenshots and a rerun remain required.

The first Xcode job finalized with exit65 after the diagnostic child reached its
600-second timeout. Final xcresult: one passing resource-isolation test and one
failing UI test. No simulator remained booted and the exact compiler/diagnostic
processes were absent. The exported accessibility hierarchy confirms all the
response children, including Continue, inherited `refuge-response`, replacing
their own IDs. This is direct evidence for the containment correction.

Agent reviewed one unaltered frame extracted from the test recording using
`scripts/extract-native-recording-frame.swift`: 1668×2420, actual recorded time
373.8767 seconds (requested380). It shows readable night response, saved status,
Continue, zero public grain and the reconstruction boundary. It is evidence of
v1's rendered response, not proof of v2's corrected accessibility tree.
Frame SHA: `66b8b63674a1a162f42ddcececa7271187d0f1179107bbd47c6e5ef350e82319`.
Hierarchy SHA: `cb19abeea91e82159f9a652f7bb63c7f9e047e18d2556dd6424bf082a79e8160`.
The full recording/diagnostic archive remains on the owning Mac; only selected
evidence was needed locally. A bulk transfer was stopped, not the source asset.

Correction overlay SHA:
`8c3996d71cc49148d2b9188e41ed0977ac54fba40654c0fbec92715cd9f7fc33`.
Corrected full native sources passed iOS16 arm64 typecheck. Expanded session
checker passed56 checkpoint groups across four completed retreat entries,
including failures overwriting existing progress and failed recovery writes.
One initial checker invocation used an incomplete QA content directory and
failed for missing chapter data; rerun used the retained parity fixture and
complete content root, without changing model/session implementation.

The v2 successor executed the same complete route and resource test into
`refuge-ipad-2.xcresult`. Its full UI route reported **passed in 410.782 seconds**,
with no failures:
night response, kept promise, unavailable record option, entrusted route,
reopened response and conclusion were exercised. Xcode then spent 600 seconds
collecting diagnostics before finalizing the result bundle. That intermediate
log-level pass was not treated as visual acceptance; final review follows below.
Read-only inspection of the actual v2 QA app chronicle confirmed the complete
saved route `offer-labour → repair-roof → leave-route`, SHA
`2c7d5a1cea9046a0f4e2b0d2a1757873e3137b8759059b77c5e63899d9996a7b`.
This complements the executed UI assertions; it is not a replacement for
rendered-screen review or the final result bundle.

## V2 final result and visual-review defect

V2 finalized with exit0, **two passed tests, zero failures**, result summary SHA
`ea1e76ba09038f07e672b762a35f57dc89c8669065e74853ffc31216eec09062`.
The exact simulator was shut down and owned test/diagnostic processes were absent.
The internal QoS warning remains a performance-investigation item; a successful
route does not imply zero runtime warnings or physical-device qualification.

Agent inspected all four native refuge PNG captures. The night and kept-promise
responses are readable, but the message response and conclusion still show the
morning label saying its specific wording has not been entrusted, alongside the
correct later entrusted-message result. **This inconsistency is not accepted.**
The source now omits that stale pending label only after a completed household
contact, retaining the actual contact outcome and its no-delivery-evidence
boundary. River-path relationship labels remain unchanged. A new UI assertion
checks that the stale wording is absent in the response and reopened conclusion.
This correction requires a successor verification; do not relabel v2 captures
as corrected visuals.

Selected v2 capture/summary transfer SHA:
`76cc46ce8050fd09cc69829f54094bb643a84cb0ae98154452d5a38954723ffb`.
The original source recording and full diagnostics remain on the owning Mac.

The installed Xcode 27 CLI documents `-collect-test-diagnostics on-failure|never`
as controlling verbose system diagnostics. The v3 run uses the per-command
`never` option to avoid repeated 600-second system collection while retaining
test assertions, result bundles, app logs, explicit screenshots and recordings.
No global Xcode settings changed; runtime issues remain separate investigations.
The option's successful SHI execution remains pending the v3 terminal result.
Phone/large-text and river-branch UI routes remain additional qualification.
No store upload, physical-device test, human emotional review or public release
is claimed. Music/video and costume work retain their existing review gates.

## V3 correction verification history

The corrected view and absence assertions were transferred to the same owned
Mac mini stage. Overlay SHA:
`1a1640d10ad9099913c4e7e11daf2fee422a5834e93489eba6bd80c3f856509a`.
The remote wrapper verified that hash before extracting and starting a single
successor into fresh `refuge-ipad-3.xcresult` and log. The resource-isolation unit
test passed; the full-route UI test and new screenshots remain pending.
The per-command diagnostics option is now used, with assertions, result bundle,
screenshots and recording retained. No global Xcode configuration changed.

Local shared-core regression: **83 tests passed** across ten files; web regression
also passed **376 tests** across 32 files. The retreat
audit exercised 993 inherited entries and 117,671 complete routes, including
loan-supported recovery. Actual generated QA/production project resource and
source boundaries were revalidated. Neither check proves the corrected native
screen, physical-device behavior or publication readiness.

## V3 accepted development checkpoint

V3 finished with exit0: **two tests passed, zero failures/skips**. Full native
route duration410.807 seconds; Xcode finished without the earlier extra
600-second diagnostics collection. Summary SHA:
`d165749e760413a3ab27737cba364ec1d2c2864ca80cc63468b104af38562e01`.
The runtime QoS warning remains recorded, not waived as a performance pass.

Agent viewed all four unaltered selected PNG captures. The night reaction,
kept promise, entrusted-message reaction and reopened conclusion are readable
in the tested iPad portrait layout. The pending-message label is correctly
present before contact and absent after contact; both final screens retain
“尚无送达或回信证据” and do not assert a reunion. This is a reviewed native
reading/continuity checkpoint, **not cinematic or human playtest acceptance**.

Selected transfer SHA (matched on both hosts before extraction):
`e4a553f2787e3f229d6d8a869a9743dedd60c21b24922860feeb61dc90d10a17`.
Capture hashes, in night/promise/message/conclusion order:

- `7e224f867d4cb28f2a6964eee9e94cfbd6a77144efae1750bb1e69593e01ba8b`
- `b129fe3262e4fd5494bdf75c2b03e236efdb08dc94a038a39c542328d9e71a6d`
- `bbebc9a0d8e663aec784301aa78418eb6943b730784b15488bc5c646c67a2cdb`
- `8a6660685d88e806a8e54ee88e8ac8668a2e913e17f1ac9b0efd35de09699dec`

Exact wrapper/compiler processes are absent and no simulator remains booted;
swap1.88MiB after cleanup. Original xcresult/recordings remain on the owning Mac.
Additional phone/large-text/river-route tests, actual device tests, localization,
reviewed moving imagery/music and user playtesting are still required.

Full `npm run validate` completed with exit0 after this checkpoint: content
sync/parity, repository/source contracts, story readthrough, Unreal project and
installer contracts, engagement/conformance, audio/accessibility/fonts,
TypeScript checks and both regression suites. This validates contracts and
tested behavior, not an Unreal rendered playtest or store-ready mobile build.
