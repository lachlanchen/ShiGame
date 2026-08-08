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

The script sends actual mouse/key events and a synthetic standards-shaped `navigator.getGamepads()` device through the visible Chrome target. It captures screenshots and checks title metadata, WebGL canvas, first-run guide isolation/persistence/reopen, modal focus wrap/return, controller detection/D-pad/face/shoulder/Start/Y commands, opening content, five resources, choices, consequence-time decision isolation, pressure warnings, keyboard decisions, known/reported/reference wartable states, selected-marker semantics, hindsight boundaries, no-state-mutation, site-filtered evidence and return behavior, source classifications, exact locators, public-edition links, claim counts, unresolved specialist states, authored-reconstruction boundaries, save format 3, disclosed field signal/classification/effects, fixed-seed selection, three-stage response deltas, seed persistence, Arabic RTL, resume, desktop/mobile layout and map containment, scrolled mobile cards, axe WCAG 2.2 AA scans, 24 CSS pixel control geometry, title/gameplay text at 200%, operating-system reduced motion, and console errors.

## Current result

2026-08-09 accessibility-resilience checkpoint: localhost passes all 94 checks with fixed seed `5EED2026` and zero page console errors for gameplay implementation `303f6d4687b5d08147d0ced7218635dc1928f854` through exact QA-harness boundary `c19ca9e0e8552982a6add6b8df6fdd4b3969fc9c`. The report records axe-core 4.12.1, eight live semantic audits and ten live control-target audits. Axe reports no violations; its layered-background contrast queue remains explicitly incomplete and is covered by the conservative 16-pair static contract plus screenshot review. The first public replay was rejected when an asynchronous reload let the remote title's old DOM satisfy a readiness check and consume a click during navigation. The harness now marks each navigation/reload and waits for a new, complete document instead of increasing a gameplay timeout. Clean-checkout, Pages and the final public replay are appended only after the next evidence boundary deploys. Chrome uses ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklists native WebGL. Evidence is in `docs/production/evidence/`; the machine-readable status names the exact tested commit and URL.

Visual review after automation:

- Title composition: pass.
- Desktop map/story hierarchy: pass.
- Pressure warnings, disclosed reconstruction-classified field signal, three-stage choice feedback, source drawer and persistent decision record: pass.
- Source/claim ledger: pass for four opening records, exact locators, three public links, nine active claims, two unresolved specialist states, and three authored-reconstruction boundaries.
- Arabic shell: pass after isolating untranslated English narrative as LTR.
- Keyboard contract: pass after replacing browser-reserved `Alt+1–3` with `Shift+1–3`.
- First-run guide: pass on desktop/mobile; copy hierarchy is readable, dismissal changes no campaign state, and the guide remains available from the header/Start button.
- Modal/decision isolation: pass for inert game background, forward/reverse focus wrapping, keyboard-invoker return, controller-to-story fallback and rejection of pointer re-entry while a consequence is open.
- Synthetic standard gamepad: pass for title confirm, D-pad selection, face-button close/commit, shoulders and Start. This is API-path evidence, not physical-controller certification.
- Fixed-seed contract: pass for pre-choice condition/effects, post-choice field delta, save-v3 seed persistence, and decision-record condition retention.
- Wartable intelligence: pass for two known, two reported and one reference-only site; D-pad cycling; textual/shape status; no campaign mutation; Pei hindsight boundary; five-source/three-claim filtered evidence; and return to the same inspected place.
- Mobile structure: pass after correcting the two-card selector; page scroll is intentional, full-width cards are readable, horizontal overflow is zero.
- Mobile wartable: pass at 390×844; the map expands to contain the full inspector and retains zero horizontal overflow.
- Accessibility automation: pass for axe semantic checks in eight live states, ten target-geometry states, 200% title/gameplay text and reduced-motion suppression. Human screen-reader, forced-colors, 400% and physical-device gates remain open.
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
