# Native continuation of the refuge inquiry

October 2, 2026. Native SwiftUI integration in the unsigned aftermath QA app;
not a TestFlight upload or public release.

## What the player can do

After the saved contact response, continue into the same sunset-household,
independent reed-bank or guided-ferry encounter as the development Web game.
Inspect the food and search trade-off before confirming. The guided route uses
the shared shore-to-boat dialogue, not the superseded generic journey text.
The native view also preserves the broken roof promise, existing grain debts,
record custody, previous disclosures and uncertainty about missing companions.

Story, choice costs and outcome fields come directly from
[the shared scene](../../content/story-drafts/refuge-followup.v1.json).
Its existing [historical/editorial review](../../content/research/refuge-followup-review.v1.json)
continues to apply; this port creates no new historical events or dialogue.

## Save and release boundaries

The frozen three-order `RefugeContinuationEngine` and session are unchanged.
The follow-up has a separate chronicle keyed by the completed refuge branch,
its six source fingerprints and the new story revision. Loading or inspecting
does not write. A choice is presented only after persistence succeeds. Reload
replays the identifier-only decision instead of deducting food again. Existing
night/morning/contact files are not rewritten to make room for the new scene.

Incompatible/corrupt files remain intact. Explicitly confirmed recovery first
copies the original before replacement. Restarting this encounter does not
rewind the earlier chapters or repair an unpaid debt or broken promise.

The new JSON is loaded behind the existing compile-time and exact-bundle-ID
gates and appears only in the aftermath QA project. Four actual generated PBX
projects were checked: production, crossing QA and upgrade QA exclude it, while
all configurations retain the required Swift sources. No signing settings,
physical-device apps, store state or another project's services were changed.

## Executed verification

The existing Mac's native Foundation executable passed **44 outcomes across
30 completed contact branches**, with **138 rejected operations**. Inputs come
from actual chapter → council → Fan Yang → retreat → night → morning → contact
replays, covering four retreat endings and three record-custody modes. It
compares native results to TypeScript results, checks the zero-food fallback,
distinct branch identities, failed writes, cold reload, byte-preserved prior
records, foreign/stale rejection and explicit corrupt-save recovery.

All app sources typechecked for production, retreat QA and crossing QA. This
is separate from the full simulator UI test and does not imply physical-device,
human enjoyment, assistive-technology or final cinematic acceptance.

Reproduce the deterministic check using the existing toolchains:

```bash
npx vite-node scripts/refuge-conformance.ts .runtime/refuge-followup-fixture.json --followup
# On the existing Mac, using that fixture and matching content/source bytes:
bash scripts/test-native-refuge-followup.sh .runtime/refuge-followup-fixture.json
```

The compressed canonical fixture is also checked against current TypeScript
rules during `validate:conformance`; Mac CI runs the native executable against
it without downloading another Node toolchain. The no-argument shell command
uses that bundled fixture.

The preceding Pages run was cancelled at its 15-minute job limit, confirmed by
GitHub's failure annotation. FFmpeg installation consumed about 13 minutes and
the game build then passed, but deployment had no time left. Pages and Linux
validation now allow 30 minutes; no test, audio check or release gate was removed.
The separate release-record checkpoint `c020099` subsequently passed both
[CI](https://github.com/lachlanchen/ShiGame/actions/runs/36908633395) and
[Pages deployment](https://github.com/lachlanchen/ShiGame/actions/runs/36908633448).
The canonical site returned HTTP 200 after deployment. That deployment does not
contain this still-unpublished native follow-up.

## First simulator run: failure retained

The full iPhone SE route reached the new household encounter after exercising
the opening, council, Fan Yang, retreat replay, night, morning and contact.
It failed at the `followup-grain` accessibility lookup after explicitly
restarting the encounter: **0 passed, 1 failed, 0 skipped**, 1,880.911 seconds.
The wrapper shut down the owned simulator; no test runner remained.

A frame extracted from the original recording at 1,869.643 seconds visibly
shows zero available grain, the disabled sharing choice, the available escort
choice and the source/reconstruction disclosure. There is no evidence here of
an incorrect inventory value. The status stack had a parent identifier without
explicit child containment, matching the identifier-propagation problem found
in the earlier native refuge response. The correction adds
`.accessibilityElement(children: .contain)` without changing food, story or save
rules. The focused successor below verifies the correction; full-route
qualification still requires its own result.

An opt-in `SHI_RETAINED_REFUGE_REVIEW` test navigates the actual retained campaign
save to this encounter, checks zero-food availability, commits the escort, and
compares reaction text and grain after a cold app relaunch. It injects no state
and is not a clean-install/full-campaign test. The original full-route assertion
remains in place.

## Focused successor: passed and visually reviewed

On the same iPhone SE (3rd generation), iOS 26.3.1 simulator, the opt-in retained
campaign test passed **1 test, 0 failures, 0 skipped**. The native fixture helper
also passed in its no-argument mode, and all three production/QA source
configurations typechecked again. The unsigned simulator build passed.

The test found the zero-grain label after explicit restart, confirmed sharing
was disabled, committed the escort, and matched every saved reaction line and
the same zero-grain count after terminating and relaunching the app. The
commit control was absent after restoration. No fixture was injected into the
app and no earlier campaign was reset for this focused check.

All three captured screens were visually inspected: choice, saved response and
cold-resumed response. Chinese text wraps without horizontal clipping; the
navigation bar stays opaque and distinct. The choice capture is deliberately
scrolled to show both actions and available grain. The resumed response remains
scrollable; the capture alone does not show all lower status text. This is not
VoiceOver, large-type, landscape, physical-device or human-enjoyment acceptance.

[Zero-food choice](evidence/native-followup-choice-20261002.png) ·
[Cold-resumed consequence](evidence/native-followup-resume-20261002.png).

| Evidence | SHA-256 |
| --- | --- |
| Choice PNG | `a6c99efa67c10190939cfbd7cd4a71bbcd92872b4ed5e0542e0762aac6210053` |
| Resumed PNG | `8e80c2c476cf3e1057d22d0a9a09eb32baf3ae8594b43cd3410f3a0c2af66eea` |
| Retained first-run diagnostic frame | `65de0413f62ea68e37243fefe6437e1428f05a28e78f616b317aff14a1a93231` |

All SHI simulators were confirmed shut down and no build/test runner remained
after the focused run. This narrower success did not turn the first failed full
run into a pass; the independent full successor is recorded below.

The subsequent full repository build passed **85 core and 404 Web tests**, all
validation steps and release bundle budgets. The canonical native fixture check
ran as part of validation. These checks do not themselves replace native UI
testing or authorize a signed mobile upload.

## Complete successor: passed

The unchanged corrected binary passed
`testRetreatContinuationResumeEndingAndCancel` on the same iPhone SE simulator:
**1 passed, 0 failed, 0 skipped**, 2,370.781 seconds for the test case. The result
bundle independently reports `Passed`, with no expected failures. This route
plays the opening, council, Fan Yang and retreat before the refuge encounters;
it does not inject a completed story fixture.

The run checks ending/replay/cancel behavior, the household continuation,
zero-food availability, saved escort response and reopening that encounter.
It then replays only the refuge decisions, follows the independent river lead,
retains the broken roof promise and verifies the contact response after a cold
launch. The river follow-up is committed separately. A second cold launch
restores the exact follow-up response and grain count without another commit,
then returns to the earlier withdrawn outcome.

All three new follow-up captures were visually inspected. Chinese text wraps
without horizontal clipping and the opaque navigation bar remains separate.
The first two captures show the zero-grain status; the cold-resumed capture is
at the top, with lower status available by scrolling and verified by the test.
These remain text-heavy development screens, not final cinematic acceptance.

[Full-route household consequence](evidence/native-followup-full-household-20261002.png) ·
[Full-route cold-resumed consequence](evidence/native-followup-full-resume-20261002.png).

| Full-route capture | SHA-256 |
| --- | --- |
| Household | `5ed83d5f7cd5fd1fdcc0feb17bd7c1c438e6d2f2b7b6e934ac1ebbc1ab0c73b6` |
| River before relaunch | `bca0ebe865415f9ff28b50fc0c53c3203d4fbc084c6b5819641a29136f5a2dae` |
| River after relaunch | `bd2e2e54fc731e3db454cd32df10a665e6e23caa06fa6752799faa3325ed4a8b` |

The wrapper exited successfully and shut down its simulator. All three existing
SHI review simulators were confirmed shut down, with no Xcode build/test runner
remaining. No new physical-device, signed-upgrade, VoiceOver, localization,
human-enjoyment or media-quality acceptance is claimed. No new TestFlight or
Google internal build was uploaded. This closes the native full-route blocker
for this source checkpoint, not the remaining beta or cinematic quality gates.
