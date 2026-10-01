# Native retreat checkpoint replay

Adds the web checkpoint-replay interaction to the gated SwiftUI retreat preview.
Each ending decision record offers replay before that order. A destructive-style
native confirmation names the order and explains replacement, removal of later
decisions/ending, preservation of earlier commitments, unchanged prior chapters,
and that the original ending is not separately archived. Cancel has no session
mutation. No store resources or canonical story/rule bytes changed.

`RetreatSession.rewind(before:)` accepts only a completed compatible session whose
last response has been acknowledged. It rebuilds from the original entry through
the earlier orders, persists atomically before publishing state, then returns to
the decision with no pending response. Unknown orders, incomplete sessions,
duplicate confirmations and observer reentry are rejected. On failed persistence,
the existing engine, debt and save remain unchanged. Uses the existing designated
save URL; no upstream campaign save is rewritten.

## Verified on the shared Apple Silicon Mac

- Xcode27.0/27A266a. Fresh isolated SHI stage; no simulator, signing, device,
  foreign checkout or store changes. AgentLink contract recorded privately.
- Verified transferred archive SHA-256 before extraction:
  `6299c9e4c4864dd118acd22855e34d276796964e6b223b1eeecfbe772d8e4160`.
- Foundation/Combine session checker:11 check groups passed. New loop exercises
  all five checkpoints from a real chapter→council→Fan Yang→retreat route with a
  grain loan. Compares replayed history, resources and debt to independent replay;
  verifies unchanged original bytes on invalid/failed calls, reload and completion
  from each checkpoint, and reentrant/duplicate rejection. Test saves retained.
- Full app sources typechecked serially for arm64 iOS16 simulator in production
  and `SHI_RETREAT_PREVIEW` configurations. Combined remote command exited0.
- Scoped whitespace validation passed. Unrelated inherited changes preserved.

Still required: device/simulator visual interaction, cancellation and VoiceOver
review. Foundation tests and typechecking do not prove the alert's actual layout
or touch behavior. This is a replay mechanic, not an in-story reversal of history
or a new continuation episode; no public release or store submission occurred.
