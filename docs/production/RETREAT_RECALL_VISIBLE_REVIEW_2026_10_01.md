# Retreat response recall: visible review

October 1 development-web checkpoint. Extends the actual title-to-retreat browser
route, not a preloaded ending or an API-created save.

The harness now opens the final order's remembered response, checks it against
the shared story's actual outcome, opens ending source references, reloads the
application and returns through each saved reaction using visible controls.
The remembered text and serialized retreat save must remain identical.

## Verified runs

| Route | Checks | Screenshots | Status SHA-256 |
| --- | ---: | ---: | --- |
| Scattered | 63 | 20 | `d2aaadc4a9e0b3c05ddabe10f0cbc01122c98667a200da8f60b235802305594f` |
| Orderly dispersal | 63 | 19 | `daabb0f27a2c42915a5dcbd4c030714b6af26dc3082eadc8a5ef14bcb17588d2` |

Private evidence directories under `.runtime/story-review/`:
`2026-10-01T03-35-18.268Z` and `2026-10-01T03-36-11.581Z`.
Both exited 0 without browser runtime exceptions. Exact owned processes and
ports were verified absent after cleanup; no idle desktop retained.

Visually inspected the scattered response and the restored orderly response at
390px width: readable text, separate speaker labels, no horizontal overflow.
The orderly-dispersal source screenshot visibly includes the volume-eight
anchors, local lines2791–2793/2799, edition limitation, and the boundary against
claiming the player witnessed or participated in the recorded historical events.

The first run, `2026-10-01T03-34-03.997Z`, failed because test navigation omitted
the saved council response's Continue control after reload. It was retained;
the corrected harness acknowledges council, Fan Yang and retreat responses.
The source screenshot was subsequently improved to scroll the actual citation
into view, rather than treating its presence below the fold as visual evidence.

Run serially on the SHI-owned isolated desktop:

```bash
node scripts/playtest-retreat-visible.mjs scattered
node scripts/playtest-retreat-visible.mjs dispersed
```

This establishes browser continuity and readable outcome-specific recall. It is
not human fun/emotional-impact acceptance, a native device review, media acting
approval, production deployment, or a store submission. Other inherited worktree
changes were preserved and excluded from this checkpoint.
