# Keep interlude headings inside the reading viewport

The signed Android8 continuation exposed a small but real clipping defect at
some Chen and Fan Yang transitions. A production-browser reproduction measured
the focused Chen question at **−4.828125 CSS pixels** after its entrance animation.
The title's glyphs touched/clipped the viewport edge. The existing effect scrolls
the heading during a 5px translated entrance, before that transform settles.

The shared interlude heading style now sets `scroll-margin-block-start: 3rem`.
This leaves room for the focused title and its preceding round/response label
after the animation. It does not change focus targets, motion preferences,
dialogue, rules, save formats or historical claims. Native SwiftUI is unaffected;
Android8's already-signed bytes are unchanged and do **not** contain this fix.

## Evidence

The new `interlude-arrival` route first failed against the previous production
payload, preserving the clipped frame. After correction, it passed **206 checks**
with no browser runtime exceptions. It exercises the actual UI from Chapter I
through all three Chen and all three Fan Yang orders, at:

- English 390px, normal motion;
- Simplified Chinese 320px, reduced motion;
- English 1280px, normal motion.

Each arrival is measured after animation without a corrective scroll. All **39
interlude arrivals** retained focused H3 headings inside the viewport with at
least an 8px inset; the smallest measured top was 42.640625px. Response
acknowledgement did not alter saved council/envoy decisions, and interludes
preserved the Chapter I save. The test replays/reset via UI, never save injection.
The six final interlude screenshots below were visually inspected. These checks
do not establish physical-device performance, all-locale acceptance or cinematic
asset quality.

| Layout | Council question | Fan Yang ending |
| --- | --- | --- |
| English phone | [Question](evidence/interlude-en-390-question-20261002.png) | [Ending](evidence/interlude-en-390-ending-20261002.png) |
| Chinese reduced-motion phone | [Question](evidence/interlude-zh-320-question-20261002.png) | [Ending](evidence/interlude-zh-320-ending-20261002.png) |
| English desktop | [Question](evidence/interlude-en-1280-question-20261002.png) | [Ending](evidence/interlude-en-1280-ending-20261002.png) |

`npm run build` passed validation, types, 85 core and 412 web tests, plus production
budgets (99.91KiB initial JS, 11.89KiB CSS, 27.30MiB deployment). Reproduce:

```bash
npm run build
SHI_PLAYTEST_PRODUCTION=1 node scripts/playtest-retreat-visible.mjs interlude-arrival
```

The one owned browser/desktop stack was stopped after capture. This is a source
and production-web correction, not a signed successor, beta upload or full-game
completion. Keep Android8's separate offline/upgrade evidence intact; qualify
the next numbered mobile artifact before claiming this correction on Android.

Follow-up: [signed Android9 qualification](ANDROID_READING_INSET_20261002.md)
now verifies the correction on an installed API34 app, with in-place save
preservation and a cold-restored newly committed council response. It has not
been uploaded; Android8's evidence and limitations remain unchanged.
