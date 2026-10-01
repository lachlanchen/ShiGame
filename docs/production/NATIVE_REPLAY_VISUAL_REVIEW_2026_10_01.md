# Native replay: end-to-end iPad simulator review

Verified the current SwiftUI QA app on the SHI-owned iPad Pro11-inch(M5)
simulator, iOS27.0/24A434. This uses the separate unsigned QA bundle and shared
canonical content, not the installed public app.

`testRetreatContinuationResumeEndingAndCancel` now follows the real opening,
Chen council and Fan Yang into retreat, checks cold resume, reaches an ending,
opens the decision record, cancels checkpoint replay, then confirms replay before
the records decision. It selects identity removal instead of carrying the full
records, finishes again, checks the replacement record and absence of the old
choice, cancels a full restart and returns to the unchanged Fan Yang outcome.

## Result and evidence

- Corrected run2: xcodebuild exit0; xcresult Passed,1test,0failures,0skips.
  Runner duration approximately372.5seconds including finalization.
-15attachments exported. Reviewed the replay confirmation, resulting ending and
  revised record screenshots. The alert displays the selected order, replacement
  warning, no-archive notice and separate confirm/cancel controls without clipping.
  Ending and changed identity-policy record are readable on the tested iPad.
- Private evidence `.runtime/native-replay-ui-20261001/replay-review-2/`.
  Manifest SHA-256:
  `e921c5aeb5c34197cb7550609b6b5a8d2201bceedae2a668c42275cf80268568`.
- Transferred source archive SHA-256:
  `65cfc287cdae2552dba8a59efc45836d99c276439732809c8f570a0d082a8a77`.
  Final corrected UI test SHA-256:
  `357fbc13feb7bb6fe900de5ff14b2f1015f89ab80c702f6a9c2ff308b2a62b7b`.
- Test/app process ended; exact simulator and all simulators observed Shutdown.
  Prior failed run and its evidence retained. No public/store/device/signing change.

## Failure and remaining limits

Run1 failed because this turn incorrectly substituted response text for an
ending-text assertion. Restored the actual canonical ending phrase; no game
content was changed to satisfy the test. Once the runner had failed and its log
was retained, stopped only its identified verbose diagnostic collector, allowing
Xcode to finalize exit65. Run2 used the locally documented
`-collect-test-diagnostics never`; assertions, result bundle and screenshots were
still collected. No duplicate build or simulator ran concurrently.

Xcode reports test-framework deployment-target linker warnings and an internal
QoS priority-inversion runtime warning. The alert's system secondary text is
visibly subdued; contrast and large-text/VoiceOver need separate review. This
pass is not physical-device testing, phone-layout acceptance, human fun review,
or release approval. It verifies the native replay interaction at the tested
simulator configuration, supplementing the earlier session/save checks.
