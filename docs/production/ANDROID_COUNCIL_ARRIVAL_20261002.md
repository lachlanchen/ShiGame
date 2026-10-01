# Signed Android council arrival correction

October 2, 2026. Local signed candidates only; no upload or new beta availability.

## Player-visible improvement

Opening Chen on the signed Android build scrolled the title into view but hid
the earlier return button. Build 6 reproduced this twice: its accessible bounds
were `[918,74][1036,74]`, with zero visible height. Scrolling upward recovered
the button, but a new player should not have to discover that workaround.

The correction focuses the title without moving the viewport, then brings the
whole header into view. Saved reactions and subsequent questions still scroll
to their own headings. No dialogue, choice, resource or save schema changed.

## Executed evidence

- Candidate 6 was built from clean `efd1858`; candidate 7 from clean `17d1dad`.
  Both signed release builds passed Gradle lint, unit smoke and packaging,
  identity/version/signature checks and before/after source-fingerprint equality.
  Their source manifests differ only in `ChenCouncil.tsx` and its tests.
- The existing API 34 SHI emulator retained candidate 4. Installation used
  in-place upgrades 4 → 6 → 7, without clearing or uninstalling the app. Seed
  `CB918329`, Deep Roots, the kept commitment and resources 45/100/3/100/93
  remained visible after each upgrade. The original install timestamp remained.
- Candidate 7 opened Chen with return-button bounds `[918,74][1036,192]`.
  The control was tapped successfully without an upward swipe; reopening Chen
  again showed the same visible bounds. The final screenshot was inspected.
- All 52 council component tests passed, including new English/Chinese and
  reduced-motion header-anchor checks and existing saved-reaction tests.
- The subsequent full repository build passed 85 core and 408 Web tests,
  content/repository validation and bundle budgets. The final evidence document
  and all 11 README profiles were validated separately after recording results.
- Both owned emulator runs terminated and their ports were verified closed.
  No physical device, shared controller, store track or signing-Mac setting changed.

[Before](evidence/android-council-arrival-before-20261002.png) ·
[After](evidence/android-council-arrival-after-20261002.png).

| Screenshot | SHA-256 |
| --- | --- |
| Before | `e55757c1e959298618604f4d9899729d311d6208378b150a3a6d09e963cf7830` |
| After | `909fe914d2317c62d9a20a2118072d96cabdb2edd85013299b51c7fe9b24b34a` |

## Qualification boundary

The [candidate receipt](../../store/beta-7-candidate.json) records both packages.
Build 6 is held for the demonstrated defect. Build 7 has a focused signed-runtime
pass, not a complete fresh route, offline campaign, distributed-build-1 upgrade,
physical-device or human-enjoyment pass. No choice was made in Chen during this
check. The broader beta workflow remains open; preserve the retained chronicle
for continuation and do not rebuild unchanged candidate 7 merely to resume QA.

Google's read-only bundle list showed only uploaded version 1, with pagination
1–1 of 1, before these builds. That is not a reservation or upload receipt.
The native iOS signing session still required keychain authorization; the Mi 10
Pro still had another project's active controller. Neither was bypassed.
