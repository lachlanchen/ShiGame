# Retreat checkpoint replay

The completed development-web retreat now lets the player return before any
recorded order. Open “回看这一路的决定”, choose an order's retry control, then
explicitly confirm replacement. The confirmation explains that this is replay,
not time travel; it removes that order and subsequent decisions/ending, retains
the earlier history, and does not archive the original ending. Cancel changes
nothing. Earlier chapters, Chen council and Fan Yang are untouched.

The checkpoint is reconstructed through existing deterministic rules from the
original entry and earlier choices—not by copying today's resources backwards.
Thus existing debts, commitments and resource costs survive when they precede
the checkpoint. No narrative/rule changes or new save schema are introduced.
Persistence uses the existing durable transaction and rollback path. Successful
confirmation opens the selected decision directly, without replaying its previous
order's reaction; a cold resume still presents the last saved reaction normally.

## Verified evidence

- Web suite: 330 tests in28files passed, including59 retreat checks.
- New tests cover initial/middle/final checkpoints, cancellation, save failure
  and retry, exact replay/restoration, unchanged upstream slots, and retained
  grain debt in a namespaced save without touching the older edition slot.
- Typecheck, production build and build-budget validation passed. Production
  gating is unchanged; building production does not publish the draft retreat.
- Visible title-to-dispersal route then replay before evacuation, choose household
  escort, carry records and stay together:71checks/21screens, no browser errors.
  Both upstream saved slots unchanged. Phone screenshots reviewed for confirmation
  readability and the different earned ending.
- Private evidence `.runtime/story-review/2026-10-01T03-41-49.346Z/status.json`,
  SHA-256 `22e1e771b989f74de2bf36b4c847ae7d09559241ce16b9820b284258c1be271e`.
  Exact runtime processes and ports verified absent after cleanup.

The first typecheck caught two unchecked array indexes and later a missing
Fan Yang assurance field in a test fixture; corrected before the final passing
typecheck/build. Existing Vite future-config-loader warnings remain unchanged.

Native iOS needs the equivalent interaction and device QA. This is not an
in-story recovery episode, new story content, human fun acceptance, or a store
submission. A later continuation must still preserve unresolved people/debts.
