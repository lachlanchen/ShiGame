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

The script sends actual mouse/key events and a synthetic standards-shaped `navigator.getGamepads()` device through the visible Chrome target. It captures screenshots and checks title metadata, WebGL canvas, first-run guide isolation/persistence/reopen, modal focus wrap/return, controller detection/D-pad/face/shoulder/Start/Y commands, opening content, five resources, choices, consequence-time decision isolation, pressure warnings, keyboard decisions, known/reported/reference wartable states, selected-marker semantics, hindsight boundaries, no-state-mutation, site-filtered evidence and return behavior, source classifications, exact locators, public-edition links, claim counts, unresolved specialist states, authored-reconstruction boundaries, save format 3, disclosed field signal/classification/effects, fixed-seed selection, three-stage response deltas, seed persistence, all eleven locale/script/font/direction/header-fit contracts, Arabic RTL, resume, desktop/mobile layout and map containment, scrolled mobile cards, axe WCAG 2.2 AA scans, 24 CSS pixel control geometry, title/gameplay text at 200%, operating-system reduced motion, CSP, remote network/resource absence, network failures and console errors.

## Current result

2026-08-09 self-hosted multilingual typography checkpoint: localhost passes all 132 checks with fixed seed `5EED2026` and zero page console errors for exact implementation `320fbde42eaf239cf6d0ed38b311b649549410cd`. The report records axe-core 4.12.1, eighteen live semantic audits, ten live control-target audits and eleven locale-font audits. All required script samples resolve to their pinned same-origin face; every localized header is fully painted, separated, contained and free of horizontal overflow. The cache-disabled eleven-locale traversal records 203 requests, including 147 unique Unicode-range font slices across the complete traversal, with zero remote HTTP(S) requests, zero remote resources and zero non-cancelled failures. This cumulative traversal is a coverage stress run, not a normal one-locale startup profile. Axe reports no violations; its layered-background contrast queue remains explicitly incomplete and is covered by the conservative 16-pair static contract plus screenshot review. Clean-checkout CI, Pages deployment and the exact public replay are the next publication gates. Chrome uses ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklists native WebGL. Evidence is in `docs/production/evidence/`; the machine-readable status names the exact implementation commit and localhost target.

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
- Accessibility automation: pass for axe semantic checks in eighteen live states, ten target-geometry states, eleven locale-font states, 200% title/gameplay text and reduced-motion suppression. Human screen-reader, forced-colors, 400% and physical-device gates remain open.
- Small tactical copy: static floors and reviewed captures pass; secondary labels remain monitored as localization expands.

Evidence must be regenerated when layout, campaign content, localization direction, Three.js, input mapping, onboarding or save behavior changes.

## Dedicated Unity desktop

Unity Hub is available on a separate localhost-only desktop so installation and licensing can be observed without touching the web test profile.

| Service | Endpoint |
| --- | --- |
| X display | `:123` |
| VNC | `127.0.0.1:5933` |
| noVNC | `http://127.0.0.1:6133/vnc.html?host=127.0.0.1&port=6133&autoconnect=1&resize=scale` |

Current evidence shows the installed editor and Linux/Web modules, followed by the login-required license boundary. No Unity gameplay result is claimed yet.
