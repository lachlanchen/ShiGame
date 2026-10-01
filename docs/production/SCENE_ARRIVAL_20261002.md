# Story arrival after a saved consequence

## Player-visible defect

A fresh campaign on the exact signed Android candidate 7 played concealment,
courier negotiation, abandoned carts and quiet envoys. Seed `034BFA58` reached
Watchful Strategist with the concealment promise kept and final resources
10 grain / 27 trust / 36 momentum / 55 people / 9 exposure. This establishes a
fresh four-decision route on 7, not full release acceptance.

The route exposed a continuity defect: after Continue, the viewport could stay
at the previous order's page offset, showing the next choices while its situation
and dialogue remained above the screen. Keyboard focus alone did not fix this
because the arrival code explicitly prevented scrolling. See the
[signed Android failure capture](evidence/scene-arrival-android-before-20261002.png).
Candidate 7 is held; its already-recorded save and offline passes remain valid
within their scopes but do not override this presentation failure.

## Correction

After a response is acknowledged, the next story article receives focus and an
instant scroll into view. Successful completion targets the ending panel below
the last scene. Defeat retains its established story-article focus target, since
the defeat replaces that article's contents. Closing an ordinary drawer still
returns focus to its invoker. A newly opened modal prevents delayed arrival work
from stealing focus or scrolling the background.

The reaction's old return-focus callback no longer competes with scene arrival.
No rules, dialogue, historical claims, media, localization strings or save schema
changed. Instant scrolling applies in both motion modes.

## Verified scope

- Four new English/Chinese × full/reduced-motion regression cases failed on the
  old implementation and passed after correction. The existing council-race test
  also checks that the ending does not scroll behind an opened council.
- The first full build caught an introduced defeat-focus regression in eleven
  locale cases. The correction preserves their original focus contract; those
  assertions were not weakened. The subsequent full build passed 85 core and
  412 web tests, validators and production budgets.
- The reusable visible production route passed 68 checks: four actual UI orders
  each at 390-pixel English, 320-pixel Chinese reduced motion and 390-pixel Arabic.
  After Continue it measured heading visibility **without corrective scrolling**,
  checked focus, unchanged committed history, acknowledgement and overflow.
  No browser runtime exceptions were recorded.
- All six story/ending captures were visually reviewed. They verify this arrival
  correction, not cinematic art quality, complete translation, physical-device
  behavior or a full accessibility audit. The compact decision hint at 320 pixels
  still needs a wrapping review in the broader phone-layout pass.

The first browser attempt raced the lazy first-launch guide and tried to click
an inert order behind it. That attempt is rejected. The harness now waits for
the actual guide control; the complete three-layout rerun passed. No UI action
was replaced with a direct save mutation.

| Layout | Story arrival | Ending arrival |
| --- | --- | --- |
| English, 390 px | [Story](evidence/scene-arrival-en-story-20261002.png) | [Ending](evidence/scene-arrival-en-ending-20261002.png) |
| Chinese reduced motion, 320 px | [Story](evidence/scene-arrival-zh-Hans-story-20261002.png) | [Ending](evidence/scene-arrival-zh-Hans-ending-20261002.png) |
| Arabic shell, 390 px | [Story](evidence/scene-arrival-ar-story-20261002.png) | [Ending](evidence/scene-arrival-ar-ending-20261002.png) |

Reproduce with no other SHI heavy job or desktop running:

```bash
npm run build
SHI_PLAYTEST_PRODUCTION=1 node scripts/playtest-retreat-visible.mjs scene-arrival
```

The runner reuses the isolated profile, records its owned children and terminates
them in cleanup. The reviewed run's ports were closed afterward. The Android test
emulator was also stopped; its save remains retained. This checkpoint is a source
and production-web correction. A successor signed Android artifact, upgrade
verification and actual mobile arrival review are still required before upload.
