# Visible web playtesting

SHI browser QA uses a dedicated localhost-only Xvfb/noVNC/Chrome profile so tests can be watched and reproduced without touching the user's normal browser.

## Dedicated endpoints

| Service | Endpoint |
| --- | --- |
| Web preview | `127.0.0.1:4173` |
| X display | `:121` |
| VNC | `127.0.0.1:5921` |
| noVNC | `http://127.0.0.1:6121/vnc.html?host=127.0.0.1&port=6121&autoconnect=1&resize=scale` |
| Chrome DevTools | `127.0.0.1:9321` |

All bind to loopback. The reusable Chrome profile lives under ignored `.runtime/novnc/profile`.

## Gate command

```bash
npm run build
SHI_X_DISPLAY=:121 SHI_CDP_PORT=9321 node scripts/playtest-web.mjs
```

The script sends actual mouse/key events and a synthetic standards-shaped `navigator.getGamepads()` device through the visible Chrome target. It captures screenshots and checks title metadata, WebGL canvas, first-run guide isolation/persistence/reopen, modal focus wrap/return, controller detection/D-pad/face/shoulder/Start/Y commands, opening content, five resources, choices, consequence-time decision isolation, pressure warnings, keyboard decisions, known/reported/reference wartable states, selected-marker semantics, hindsight boundaries, no-state-mutation, site-filtered evidence and return behavior, source classifications, exact locators, public-edition links, claim counts, unresolved specialist states, authored-reconstruction boundaries, save format 3, disclosed field signal/classification/effects, fixed-seed selection, three-stage response deltas, seed persistence, all eleven locale/script/font/direction/header-fit contracts, Arabic RTL, resume, desktop/mobile layout and map containment, scrolled mobile cards, axe WCAG 2.2 AA scans, 24 CSS pixel control geometry, title/gameplay text at 200%, 320 CSS pixel 400%-equivalent reflow, actual Chrome 400% page zoom, operating-system reduced motion, forced-colors structure and non-color state cues, CSP, remote network/resource absence, network failures and console errors. The actual-zoom path brings Chrome to the front, uses `xdotool` on the isolated X display to send browser-level `Ctrl+0`/`Ctrl++`, records DPR/viewport geometry, captures overview and action frames, and resets to the measured DPR 1 baseline in `finally`. Every other desktop restore uses an explicit 1600×1000 metric override so diagnostic state cannot leak into a later run.

## Current result

2026-08-09 actual Chrome zoom checkpoint: localhost passes all 158 checks with fixed seed `5EED2026` and zero page console errors for exact implementation `99c7e8a23df39bc91e7d55afcbd6fa4f1dcd6e03`. The report records axe-core 4.12.1, twenty-three live semantic audits, fifteen live control-target audits and eleven locale-font audits. Browser-level zoom begins at DPR 1/1600 CSS pixels, reaches DPR 4/400×228 CSS pixels after eight Chrome increments, keeps the title/gameplay/action surfaces free of horizontal overflow and returns to the DPR 1 baseline after capture. The existing 320×800 equivalent-reflow and forced-colors gates remain intact. The cache-disabled local eleven-locale traversal records 203 requests and 147 unique Unicode-range font slices with zero remote HTTP(S) requests, zero remote resources and zero non-cancelled failures. These cumulative traversals are coverage stress runs, not normal one-locale startup profiles. Axe reports no violations; its layered-background contrast queue remains explicitly incomplete and is covered by the conservative 16-pair static contract plus screenshot review. Chrome uses ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklists native WebGL. Evidence is in `docs/production/evidence/`; public replay and the final deployed evidence hash follow Pages publication of this checkpoint.

Visual review after automation:

- Title composition: pass.
- Desktop map/story hierarchy: pass.
- Pressure warnings, disclosed reconstruction-classified field signal, three-stage choice feedback, source drawer and persistent decision record: pass.
- Source/claim ledger: pass for four opening records, exact locators, three public links, nine active claims, two unresolved specialist states, and three authored-reconstruction boundaries.
- Arabic shell: pass after isolating untranslated English narrative as LTR.
- Multilingual typography: pass for real glyph availability and reviewed 800×650 captures in English, Arabic, German, Spanish, French, Japanese, Korean, Russian, Vietnamese, Simplified Chinese and Traditional Chinese. A compositor/scroll race that cropped the first French evidence frame was rejected; the harness now waits for two painted frames and validates every header child before capture.
- Font privacy/security: pass for eight exact OFL packages, same-origin runtime delivery, eleven locale routes, CSP enforcement and zero cross-origin HTTP(S) requests/resources.
- Keyboard contract: pass after replacing browser-reserved `Alt+1–3` with `Shift+1–3`.
- First-run guide: pass on desktop/mobile; copy hierarchy is readable, dismissal changes no campaign state, and the guide remains available from the header/Start button.
- Modal/decision isolation: pass for inert game background, forward/reverse focus wrapping, keyboard-invoker return, controller-to-story fallback and rejection of pointer re-entry while a consequence is open.
- Synthetic standard gamepad: pass for title confirm, D-pad selection, face-button close/commit, shoulders and Start. This is API-path evidence, not physical-controller certification.
- Fixed-seed contract: pass for pre-choice condition/effects, post-choice field delta, save-v3 seed persistence, and decision-record condition retention.
- Wartable intelligence: pass for two known, two reported and one reference-only site; D-pad cycling; textual/shape status; no campaign mutation; Pei hindsight boundary; five-source/three-claim filtered evidence; and return to the same inspected place.
- Mobile structure: pass after correcting the two-card selector; page scroll is intentional, full-width cards are readable, horizontal overflow is zero.
- Mobile wartable: pass at 390×844; the map expands to contain the full inspector and retains zero horizontal overflow.
- Accessibility automation: pass for axe semantic checks in twenty-three live states, fifteen target-geometry states, eleven locale-font states, 200% title/gameplay text, 320 CSS pixel 400%-equivalent reflow, actual Chrome 400% page zoom/reset, forced-colors structure/non-color cues and reduced-motion suppression. Human screen-reader, human-observed zoom/magnifier/Windows-high-contrast and physical-device gates remain open.
- 400%-equivalent reflow: pass after visible 320px review found and corrected a clipped language selector and Kuaiji marker. Title promise/action/footer and gameplay header/wartable/story/decisions all fit horizontally and remain vertically reachable.
- Actual Chrome 400% zoom: pass for the visible 1600-pixel desktop at DPR 4. Gameplay overview/selected decision and title overview/primary action are separately captured; the harness proves the browser returns to DPR 1 afterward. This is agent-observed engineering evidence, not disabled-player certification.
- Forced colors: pass for automated emulation and screenshot review. Decorative texture is suppressed; danger, selection and intelligence category remain shape-distinct. This is not human Windows High Contrast certification.
- Small tactical copy: static floors and reviewed captures pass; secondary labels remain monitored as localization expands.

Evidence must be regenerated when layout, campaign content, localization direction, Three.js, input mapping, onboarding or save behavior changes.

## Dedicated Unity desktop

Unity Hub is available on a separate localhost-only desktop so installation and licensing can be observed without touching the web test profile.

| Service | Endpoint |
| --- | --- |
| X display | `:123` |
| VNC | `127.0.0.1:5934` |
| noVNC | `http://127.0.0.1:6134/vnc.html?host=127.0.0.1&port=6134&autoconnect=1&resize=scale` |

Current evidence shows the installed editor and Linux/Web modules, followed by the login-required license boundary. The endpoint pair was corrected on 2026-08-09 after re-audit found the former documented ports attached to another X display; the replacement was verified directly against Unity Hub on `:123` without stopping that unrelated desktop. No Unity gameplay result is claimed yet.
