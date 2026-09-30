# Chen council keyboard review

Development checkpoint, 2026-09-30. Not human playtest acceptance or release approval.

## Behavior

Tab and Shift+Tab navigate buttons; Enter activates the focused button. Focused
controls scroll into view without animation. Selecting an offer keeps focus on
that offer, not the commit button: selection alone never writes a decision.
Successful commit focuses the reaction's Continue button. The ending starts at
its text; Tab then reaches the footer actions. Replay confirmation initially
focuses **Keep this council**, not the destructive action.

Escape cancels an armed replay, otherwise dismisses an uncommitted proposal,
otherwise returns to Chapter I. Repeated Escape keydown events are ignored so
holding Escape cannot cascade through multiple screens. Existing disk-session
guards remain the only authority for writing choices.

## Repeatable manual regression

Use a dedicated review user directory and a surviving completed Chapter I;
never replace the owner's save. Start only one SHI desktop, follow workstation
resource limits, and stop its exact processes after capture.

1. Open a completed council, continue to its ending and Tab to Reconsider.
   Confirm the focused action is visible before activating it.
2. Verify Keep is focused. Enter must retain progress; repeat and use Escape.
   Compare save bytes before and after both cancellation paths.
3. Reopen the prompt, deliberately Shift+Tab to Restart and confirm. Only the
   isolated council resets; Chapter I remains byte-identical.
4. Select an offer, press Escape, and verify that no choice was saved.
5. Using Tab/Shift+Tab/Enter, choose `defer-title`, then `joint-ledger`, then
   `one-command`. Inspect each offer and separately activate its commit button.
6. After the first commit, leave and reopen the council. It must restore that
   reaction with exactly one saved choice. Continue without duplicating it.
7. Finish and inspect the common-front ending and its support/food/tempo checks.
   Verify exactly the three chosen IDs, in order, and unchanged Chapter I bytes.

Wait for the rendered focus indicator before the next action. In this desktop,
rapid synthetic key bursts produced misleading intermediate captures; the final
route used one-second event spacing and observed screen states. This does not
establish a general input-latency or performance result.

## Evidence and limits

Baseline reproduced keyboard focus on an off-screen footer. The final review
verified visible focus, safe default, Escape cancellation, saved reaction resume,
three keyboard-committed choices and the common-front ending at 1600×1000 in
English. Chapter I SHA-256 remained
`a554849a98537dce4a7a3852154b6a1e1993b4d02422988d17fb5143b2e53dc3`.

Private evidence directory: `.runtime/council-20260930/`. Relevant captures:
`keyboard-footer-final.png`, `keyboard-cancel-focused.png`,
`keyboard-escape-cancel.png`, `keyboard-proposal-confirm.png`,
`keyboard-resumed-response1.png`, `keyboard-round2-confirm-stable.png`,
`keyboard-round3-stable.png`, `keyboard-ending-final.png`.
Final build: `unreal-keyboard-build-3.log`; final full automation
`unreal-keyboard-full-2/index.json` passed 28/28. Rule/save automation is separate from
this visual review; screenshots, not headless model tests, support the UI claims.

Entry/re-entry from the Chapter I panel used the mouse; council decisions used
keyboard. Whole-application keyboard-only entry, gamepad, Chinese, narrow layout,
screen readers and human usability feedback are not newly verified here.
