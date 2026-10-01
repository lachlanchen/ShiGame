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
Build 6 is held for the demonstrated defect. The initial build 7 check was a focused signed-runtime
pass, not a complete fresh route, offline campaign, distributed-build-1 upgrade,
physical-device or human-enjoyment pass. No choice was made in Chen during this
check. The broader beta workflow remains open; preserve the retained chronicle
for continuation and do not rebuild unchanged candidate 7 merely to resume QA.

Google's read-only bundle list showed only uploaded version 1, with pagination
1–1 of 1, before these builds. That is not a reservation or upload receipt.
The native iOS signing session still required keychain authorization; the Mi 10
Pro still had another project's active controller. Neither was bypassed.

## Subsequent offline continuation: passed

The same signed candidate 7 APK was reused, not rebuilt. On the existing API 34
emulator, airplane mode was enabled while Wi-Fi remained disabled. Android
reported **Active default network: none** before play, after the first cold
restart and after the final outcome. No physical device or host network changed.

Starting from the retained Chapter I conclusion, the actual UI route chose:

- Chen: accept the crown → feed the marching ranks first → march under one command.
  The broken store-protection promise appeared in the preview and response.
  The resulting fragile coalition matched the preview, with metrics 2/8/2/0/10.
- Fan Yang: public protection → disciplined escort → accept surrender.
  The final guaranteed outcome matched its preview, with grain 1, tempo 8,
  civil backing 3, allied backing 0, soldiers' backing 7 and credibility 9.

The app was force-stopped before acknowledging the first council response and
again before acknowledging the final Fan Yang response. Each was restored
through ordinary title/chapter/council navigation. The full UI XML for each
response with its expanded changes matched byte-for-byte before and after the
restart. No new order was confirmed during restoration. The original chapter
seed `CB918329`, Deep Roots, kept commitment and five resource labels stayed
unchanged. Cancelling council replay also preserved every text/accessible
description; its capture bounds differed slightly during presentation.

The witness and reserve offers displayed unmet-requirement warnings. They
remain inspectable, and this run did **not** select them to exercise the disabled
commit control. Do not describe their offer buttons as disabled or this guard
as device-tested. Eight evidence assertions checked the captured state,
continuity, warnings, outcome and retained APK hash; this is not eight separate
full playthroughs.

Three route screens were visually inspected: restored council changes, broken
promise and the reached Fan Yang ending. Text and controls wrap readably, but
these remain text-heavy scenes rather than cinematic-quality acceptance.

[Restored council response](evidence/android-beta7-offline-resume-20261002.png) ·
[Reached Fan Yang outcome](evidence/android-beta7-offline-outcome-20261002.png).

| Route capture | SHA-256 |
| --- | --- |
| Restored council | `ec4f9e238c42b308a6b46cc8068008b0f58415277122e29bfabf1fe14a349fbf` |
| Broken promise, retained privately | `043686d6fcd42a055e925252a78c8bbaf2a63b4809e48651ba64b5b5be7b6a1f` |
| Final outcome | `1a514ee914466be08ad2b29382a730647448a2424b49a29803c1b61f22e513de` |

Airplane mode was restored to its original disabled state, Wi-Fi remained
disabled, and the exact owned emulator stopped. Its ports were confirmed closed.
This advances the signed offline continuation/lifecycle gate. A fresh Chapter I
route, distributed-build-1 upgrade, remaining navigation/source checks, physical
devices and human feedback are still required. No store upload occurred.
