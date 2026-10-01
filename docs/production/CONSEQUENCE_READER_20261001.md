# Immediate readable consequences

October 1, 2026. This checkpoint closes an interruption between a committed
choice and its matching reaction in the production web client.

Previously the lazy consequence view displayed an empty panel with only Continue
while downloading. A failed presentation import had no local recovery. The new
reader immediately displays the selected title and complete canonical consequence,
with a reconstruction label, keyboard focus, scroll containment and Continue.
If the richer view cannot download, that written outcome remains usable. A late
download after continuation cannot reopen the reaction or repeat a decision.
Once loaded, the richer component is reused for subsequent turns without another
placeholder transition. No new historical claims or narrative branches are added.

The view receives an already resolved result and never issues an order. Failed
save acknowledgments keep Continue retryable. Pending reactions survive reload
with the exact same saved history and consequence. The existing chronology and
decision record remain the authority when optional presentation is unavailable.

## Verification

The production browser route holds the actual consequence JavaScript request,
continues through the readable view, then lets the late request finish. It commits
a second decision, reloads, aborts its presentation request and continues from the
same saved reaction. The route passed in English, Simplified Chinese and Arabic:
19, 19 and 20 checks respectively. Nine desktop/phone frames were visually reviewed.
Arabic interface controls retain RTL, with LTR for the existing English story
fallback. Keyboard navigation, phone containment and restoration of page scrolling
passed. The isolated visible-browser workflow used one desktop at a time and
terminated each owned process after capture.

Full build passed: 83 core tests and 380 web/UI tests, including four new delayed
loading, failure, acknowledgment and direction tests. The accessibility scan now
waits for the actual optional details control before inspecting it. Static checks
also cover the immediate reader's text contrast and Continue target size.

Consequence-only CSS moved into the existing lazy stylesheet. Initial compressed
JavaScript is 99.79 KiB and CSS 11.89 KiB, within the unchanged 100/12 KiB limits.
The complete deployment payload is 26.99 MiB. Measurements are payload sizes;
this review does not establish physical-device frame rates or cinematic art quality.

See the [source hashes and run evidence](evidence/consequence-reader-20261001.json)
and reviewed phone captures: [English](evidence/consequence-reader-en-20261001.png),
[Arabic](evidence/consequence-reader-ar-20261001.png),
[Chinese](evidence/consequence-reader-zh-20261001.png).

Reproduce after `npm run build` with `SHI_PLAYTEST_PRODUCTION=1 node
scripts/playtest-retreat-visible.mjs consequence-loading`. Set
`SHI_PLAYTEST_LOCALE=ar` or `zh-Hans` for those cases. An existing SHI profile can
be selected through `SHI_BROWSER_PROFILE`; the controller checks its dedicated
ports/display and uses an incognito app window. Source is shared with Android;
this checkpoint does not claim a newly signed Android or native iOS package.

## Follow-up: preserve the player's place during loading

The next review reproduced a keyboard interruption: tabbing to Continue while
the detailed scene downloaded was followed by an unwanted focus reset to the
heading. A failing regression test captured that behavior. The presentation
handoff now retains Continue focus if the player has already reached it, without
acknowledging the reaction or issuing an order. Otherwise the heading retains
its normal initial focus. The written and detailed outcome also use the same
locale-aware typeface, avoiding a sans/serif switch during reading.

The final production bundle passed 24 English, 24 Simplified Chinese and 25 Arabic
visible-browser checks. The route now cold-resumes a saved reaction, holds the
real JavaScript download, tabs to Continue, releases the download, verifies the
same focus/typeface and byte-identical save, then separately tests failed loading.
Nine final phone screenshots were reviewed across loading, handoff and offline
resume. All dedicated desktop processes were terminated after the serial runs.

Full build: 83 core + 381 web tests. Final style rebuild and static accessibility,
repository and payload validation pass: initial JS 99.84 KiB, CSS 11.89 KiB,
deployment 26.99 MiB. This is a bounded continuity fix, not a new story scene or
physical-device performance claim. Raw evidence remains in the private runtime
handoff; no existing public screenshots or historical receipts were overwritten.
