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

## Signed Android successor 8

The follow-up built version 1.0.0 (8) from clean commit
`cee416f452f4883fd8be75a35c8304cc00c565c2`. Release unit/lint, APK/AAB generation,
package identity and signing checks passed; the 348-file source inventory was
unchanged across the build. Full source validation previously passed 497 tests
at this commit, and both its GitHub CI and Pages runs completed successfully.
The Android packaging command itself is not a rerun of those 497 tests.
Immutable artifact details are in [the candidate receipt](../../store/beta-8-candidate.json).

On the retained API34 upgrade emulator, `adb install -r` changed 7 to 8 without
uninstalling or clearing data. The first-install timestamp stayed unchanged.
Seed `034BFA58`, Watchful Strategist, the kept concealment promise and all five
resources remained intact. Continue brought that ending into view.

A normal **New chronicle** then started seed `26DADE69`. Four actual UI orders—
read names, issue grain tallies, send households first, root in village covenants—
reached Deep Roots with the protection promise kept. Immediately after each
response's Continue, fresh accessibility bounds and screenshots showed the next
story heading or ending **without corrective scrolling**. Final resources were
52 grain / 100 trust / 18 momentum / 100 people / 97 exposure. A force-stop and
cold launch retained the ending, seed and resources. Chen entry showed its return
control in view. Eight recorded assertion groups passed.

Reviewed signed-app captures:

- [Restored pre-upgrade ending](evidence/android-beta8-restored-20261002.png)
- [Grain scene arrival](evidence/android-beta8-arrival1-20261002.png)
- [Crossing scene arrival](evidence/android-beta8-arrival2-20261002.png)
- [Final decision arrival](evidence/android-beta8-arrival3-20261002.png)
- [Fresh ending arrival](evidence/android-beta8-arrival4-20261002.png)
- [Chen entry](evidence/android-beta8-council-20261002.png)

These are captured SHI UI evidence, reviewed for this fix, not newly admitted game
art. Initial emulator boot/app readiness probes were not accepted as review
frames; one failed UI-dump process was discarded rather than reusing stale XML.
The emulator was stopped after evidence capture; its completed save is retained.

Build 8 is **not uploaded**. This checkpoint qualifies signed Android scene
arrival, 7-to-8 retained-save upgrade, a fresh opening route and cold recovery.
It does not establish physical-device acceptance, a Play-delivered signing-chain
upgrade, a complete council/Fan Yang route on 8, or human cinematic acceptance.
The earlier release1-to-7 upgrade and council/offline evidence remain separately
scoped to 7; do not relabel them as tests of 8. Finish the remaining beta gates
and reconcile provider state before distributing this exact candidate. No new
historical claims, dialogue, media or save schema were introduced here.

## Exact-build offline continuation follow-up

The same signed8 APK, without rebuilding or changing its save directly, completed
the remaining Chen and Fan Yang sequence on the retained API34 emulator. Airplane
mode was enabled before the six orders and confirmed still enabled at the ending.

Chen: crown → army rations → one command. The broken protection pledge was
explained in the response, and city support fell 7 → 2 (ordinary −2 plus pledge
penalty −3). The result was **Signatures without a common road**, with grain 2,
tempo 8, city 2, allies 0 and veterans 10. An offline force-stop/relaunch restored
the unread rations response; reopening its change details produced byte-identical
UI XML. The details expansion itself is not claimed to persist automatically.

Fan Yang: public protection → disciplined escort → accept surrender. Before the
escort, the allied-witness offer was selected despite insufficient allied backing.
Its Confirm control had `enabled="false"`; a real tap left the round and every
displayed text/resource unchanged. The raw XML comparison differed only in the
pressed button's small geometry shift, so that check uses semantic text plus the
disabled attribute, not a false claim of byte equality or private save inspection.

The gate preview and actual outcome both read **A gate opened by an enforceable
promise**. Final metrics were grain 1 / time 8 / civil 3 / allies 0 / soldiers 7 /
protection 9. The unread surrender response and reopened changes also survived
offline cold restart unchanged. Six continuation assertion groups passed.

Reviewed captures: [broken pledge](evidence/android-beta8-broken-pledge-20261002.png),
[disabled order](evidence/android-beta8-disabled-order-20261002.png),
[ending](evidence/android-beta8-fanyang-ending-20261002.png).

Visual review also found that some council/Fan Yang heading arrivals sit against
the upper viewport edge with slight glyph clipping. This is an open presentation
issue, not a failed save or blocked route. The new opening-story arrival correction
remains separately verified. No full visual acceptance or physical-device claim
is made. The exact candidate remains **not uploaded**; no production settings or
test-group membership changed. Airplane mode was restored and the owned emulator
stopped; the completed continuation remains in its retained save.
