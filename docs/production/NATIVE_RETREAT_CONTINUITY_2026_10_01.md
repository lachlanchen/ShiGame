# Native retreat: remembered responses

The October 1 checkpoint brings the native retreat presentation closer to the
web chapter without changing canonical story, rules, fingerprints or save format.

## Player-facing changes

- Read the character response before optional resource accounting. Outstanding
  debts and witnessed encounters remain visible; statistics move into a disclosure.
- Show the shared rule explanation when an earlier promise affects an order.
- At the ending, reopen each order's authored response, explicitly labelled
  dramatization. The final scattered response uses the actual outcome, not the
  nominal success response. Restoring a save preserves these recalled responses.
- Keep the final scene's historical source references at the ending.
- When an inspected order is unavailable, offer feasible alternatives for inspection.
  Inspecting an alternative does not commit an order.

These are presentation changes to the gated native retreat preview, not a new
store release or evidence that players find the story moving.

## Verification

On the shared Apple Silicon Mac, Xcode 27.0 (27A266a):

- Transferred source archive SHA-256:
  `c11cde2ac7719e8de1cb7c01a8a9ce7ffeace7bd4d2b59629e9f28de9b594276`.
  Verified before extraction into a fresh SHI-owned staging directory.
- Foundation `RetreatPresentationChecks`: passed 50 decision/reaction/ending
  phases across together, remnant, dispersed and scattered outcomes, plus scoped
  companion callbacks. Assertions include promise answers, feasible choices,
  ending source retention, actual response recall, replay equality and unchanged
  serialized state while reading the ending record.
- All app Swift sources typechecked for arm64 iOS 16 simulator, in production
  and `SHI_RETREAT_PREVIEW` configurations, serially; terminal exit 0.
- Scoped whitespace check passed. No simulator, signing, device, store submission,
  public deployment or foreign service changes.

## Next acceptance gate

Review the native screen on device at large text sizes and with VoiceOver;
compilation does not establish layout, focus or touch usability. Playtest the
sequence for emotional clarity: can a player recall who depended on their order,
what earlier promise mattered, and why their ending followed? Do not manufacture
an emotional-impact score from automated checks.

Keep 《资治通鉴》 as the historical circumstance, distinguish invented personal
dialogue and counterfactual outcomes, and let people react to player actions.
Resonance should come from understandable human stakes and remembered decisions,
not mandatory tragedy or extra exposition.
