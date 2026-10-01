# Council reaction reading checkpoint

2026-10-01. Verified web presentation improvement, not human emotional acceptance.

The council's saved character response now occupies a single, centered reading
card. Promise callbacks remain in the primary scene. The five saved metric
changes move into an initially collapsed, localized “What changed” disclosure;
the competing arrival/resource sidebar returns for decisions, reset confirmation
and the conclusion. Previewed choice costs and coalition readiness are unchanged.
No dialogue, historical claim, canonical content, rules or save schema changed.

The goal is to let players read the answer to their decision before studying its
accounting. Disclosure and Continue do not commit a choice or play another cue.
A cold resume restores the same response with its details collapsed. All 11
supported locales use existing cinema labels. Reduced motion, focus transfer and
forced-colors presentation remain supported.

## Evidence

- Full web suite: 290 tests passing. Focused council suite: 48 tests, including
  all-locales disclosure/resume and closed/open reaction semantic checks.
- Web TypeScript and accessibility contract pass. Production build and asset
  budget tests pass: initial JS 99.40/100 KiB; initial CSS 11.87/12 KiB;
  deployment 26.98/30 MiB. No new media asset is bundled.
- Pointer-driven visible development playtest: 61 checks, 20 screenshots, no
  browser exceptions. It completes crossing-v2 → three Chen decisions → three
  Fan Yang decisions → five retreat decisions → together ending. It checks
  crossing, council and retreat cold resume, optional ledger inspection, exact
  saved bytes and unchanged older release/interlude slots.
- Reviewed desktop reaction, phone reaction and phone cold-resume screenshots.
  Text, disclosure and Continue are readable without horizontal overflow. This
  is a 390×844 browser viewport, not a physical phone test.

Evidence manifest: `docs/production/evidence/council-reaction-reading-20261001.json`.
Private captures: `.runtime/story-review/2026-10-01T02-03-22.629Z/`.

Two earlier visible runs stopped on controller assertions, not application
exceptions: the first expected six metrics instead of the actual five; the
second also counted copies in the collapsed journal. The final check derives
metric count from canonical council content and scopes inspection to the active
response disclosure. Failed evidence is retained; the app was not altered to
satisfy an incorrect count.

All three temporary browser stacks were cleaned up. Final owned PIDs
1311567/1311644/1311645/1311646/1311647 and ports 4173/5921/6121/9321 were verified
absent. No current noVNC URL. Available memory after review: 61 GiB; swap 64/71 GiB.
No other project's process was stopped. Inherited dirty work was preserved.

## Remaining production work

This improves an existing playable scene; it is not a new historical episode or
cinematic asset admission. The private relaxed-gesture study still needs hand,
costume, acting and temporal review. Music needs listening acceptance. Reviewed
moving imagery, native SwiftUI parity, physical devices, human playtests and
publication remain required. No store submission or website update occurred.
