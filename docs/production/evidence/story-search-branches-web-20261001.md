# Food promises and missing-person continuity

2026-10-01 HKT. Shared story unchanged from d29822c; visible harness extended from 48d1cbb. No production or store change.

Completed actual title-to-dispersal routes through visible controls:

- `node scripts/playtest-retreat-visible.mjs dispersed partner-search`: 28 checks passed. Voluntary-pots memory distinguishes the original gift from later agreements. Partners return limited search information; A Heng remains missing.
- `node scripts/playtest-retreat-visible.mjs dispersed loan-search`: 29 checks passed. Borrowed grain does not settle the missing-person search, and the new debt remains after dispersal.

Both routes use actual early chapter choices and send-support before requesting allied cooperation. The first partner-search attempt used keep-reserve and correctly refused commitment at allied support 1 / required 2. Failure evidence was retained; only the test itinerary changed, not game constraints or resources.

Private evidence directories under `.runtime/story-review/`:

- Initial blocked itinerary: `2026-09-30T19-45-10.811Z`.
- Partner-search pass: `2026-09-30T19-45-50.083Z`.
- Loan-search pass: `2026-09-30T19-46-30.693Z`.

Inspected initial failure screenshot, partner grain-promise and search screenshots, and loan search screenshot. At 390×844, text is readable and the final decision follows the reports rather than preceding them. Assertions verify no horizontal overflow, no invented reunion, correct ending forecast, custody memory and scroll restoration. No browser runtime exceptions. `npm run validate:story-draft` passes 20 tests and the 9,072-route authoring audit; this is not resource-balance or human story acceptance.

All three owned desktop stacks terminated. Verified final PIDs 2588333/2588390/2588391/2588392/2588393 absent and ports 4173/5921/6121/9321 closed; 49 GiB available RAM. No foreign processes touched.

These two branch samples close the named new-callback visual-review gap, not every permutation or native coverage. Next: prepare a coherent end-to-end human story readthrough, concentrating on viewpoint changes, motives, pacing and whether the endings feel earned. Do not claim the full story has passed human review.
