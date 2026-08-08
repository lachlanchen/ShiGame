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
SHI_CDP_PORT=9321 node scripts/playtest-web.mjs
```

The script sends actual mouse/key events and a synthetic standards-shaped `navigator.getGamepads()` device through the visible Chrome target. It captures screenshots and checks title metadata, WebGL canvas, first-run guide isolation/persistence/reopen, modal focus wrap/return, controller detection/D-pad/face/shoulder/Start/Y commands, opening content, five resources, choices, consequence-time decision isolation, pressure warnings, keyboard decisions, known/reported/reference wartable states, selected-marker semantics, hindsight boundaries, no-state-mutation, site-filtered evidence and return behavior, source classifications, exact locators, public-edition links, claim counts, unresolved specialist states, authored-reconstruction boundaries, save format 3, disclosed field signal/classification/effects, fixed-seed selection, three-stage response deltas, seed persistence, all eleven locale/script/font/direction/header-fit contracts, Arabic RTL, resume, desktop/mobile layout and map containment, scrolled mobile cards, axe WCAG 2.2 AA scans, 24 CSS pixel control geometry, title/gameplay text at 200%, 320 CSS pixel 400%-equivalent reflow, operating-system reduced motion, forced-colors structure and non-color state cues, CSP, remote network/resource absence, network failures and console errors. Every desktop restore uses an explicit 1600×1000 metric override so a prior diagnostic viewport cannot leak into a later run.

## Current result

2026-08-09 accessibility-resilience checkpoint: localhost passes all 147 checks with fixed seed `5EED2026` and zero page console errors for exact implementation `73792273c6cc2bb2f55378591af2147908a9d4fd`. The report records axe-core 4.12.1, twenty-one live semantic audits, thirteen live control-target audits and eleven locale-font audits. The new 320×800 title/gameplay frames have zero horizontal overflow, keep every checked region/control inside the viewport and retain vertical reachability; this is the automated 1280-at-400%-equivalent layout gate, not an observed browser-zoom session. Emulated forced colors removes decorative layers while retaining system-color text, four-pixel bordered meters, a dashed danger outline, a system selection outline, and dashed/square/double marker distinctions. The cache-disabled eleven-locale traversal records 204 requests, including 148 unique Unicode-range font slices, with zero remote HTTP(S) requests, zero remote resources and zero non-cancelled failures. These cumulative traversals are coverage stress runs, not normal one-locale startup profiles. Axe reports no violations; its layered-background contrast queue remains explicitly incomplete and is covered by the conservative 16-pair static contract plus screenshot review. Chrome uses ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklists native WebGL. Evidence is in `docs/production/evidence/`; public replay and the final deployed evidence hash are recorded after Pages publishes this checkpoint.

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
- Accessibility automation: pass for axe semantic checks in twenty-one live states, thirteen target-geometry states, eleven locale-font states, 200% title/gameplay text, 320 CSS pixel 400%-equivalent reflow, forced-colors structure/non-color cues and reduced-motion suppression. Human screen-reader, actual browser-zoom/magnifier/Windows-high-contrast and physical-device gates remain open.
- 400%-equivalent reflow: pass after visible 320px review found and corrected a clipped language selector and Kuaiji marker. Title promise/action/footer and gameplay header/wartable/story/decisions all fit horizontally and remain vertically reachable.
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
