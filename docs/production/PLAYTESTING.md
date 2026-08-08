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

The script sends actual mouse/key events and a synthetic standards-shaped `navigator.getGamepads()` device through the visible Chrome target. It captures screenshots and checks title metadata, WebGL canvas, first-run guide isolation/persistence/reopen, controller detection/D-pad/face/shoulder/Start commands, opening content, five resources, choices, pressure warnings, keyboard decisions, source classifications, exact locators, public-edition links, claim counts, unresolved specialist states, authored-reconstruction boundaries, save format 3, disclosed field signal/classification/effects, fixed-seed selection, three-stage response deltas, seed persistence, Arabic RTL, resume, desktop/mobile layout, scrolled mobile cards, and console errors.

## Current result

2026-08-09 historical-production-cell checkpoint: localhost passes all 56 checks with fixed seed `5EED2026` and zero page console errors against implementation commit `1e89bec0fb0dba6d33bd898e3c34746f14e99135`. Clean-checkout validation and Pages deployment then passed, and the public build passed the same 56 checks with zero console errors at deployment/evidence boundary `c70972634e4e9e0228228df3a734bce74905adf2`. Chrome uses ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklists native WebGL. Evidence is in `docs/production/evidence/`; the machine-readable status names the exact tested URL and commit boundary.

Visual review after automation:

- Title composition: pass.
- Desktop map/story hierarchy: pass.
- Pressure warnings, disclosed reconstruction-classified field signal, three-stage choice feedback, source drawer and persistent decision record: pass.
- Source/claim ledger: pass for four opening records, exact locators, three public links, nine active claims, two unresolved specialist states, and three authored-reconstruction boundaries.
- Arabic shell: pass after isolating untranslated English narrative as LTR.
- Keyboard contract: pass after replacing browser-reserved `Alt+1–3` with `Shift+1–3`.
- First-run guide: pass on desktop/mobile; copy hierarchy is readable, dismissal changes no campaign state, and the guide remains available from the header/Start button.
- Synthetic standard gamepad: pass for title confirm, D-pad selection, face-button close/commit, shoulders and Start. This is API-path evidence, not physical-controller certification.
- Fixed-seed contract: pass for pre-choice condition/effects, post-choice field delta, save-v3 seed persistence, and decision-record condition retention.
- Mobile structure: pass after correcting the two-card selector; page scroll is intentional, full-width cards are readable, horizontal overflow is zero.
- Small tactical copy: monitored; secondary labels remain readable in the reviewed captures.

Evidence must be regenerated when layout, campaign content, localization direction, Three.js, input mapping, onboarding or save behavior changes.

## Dedicated Unity desktop

Unity Hub is available on a separate localhost-only desktop so installation and licensing can be observed without touching the web test profile.

| Service | Endpoint |
| --- | --- |
| X display | `:123` |
| VNC | `127.0.0.1:5933` |
| noVNC | `http://127.0.0.1:6133/vnc.html?host=127.0.0.1&port=6133&autoconnect=1&resize=scale` |

Current evidence shows the installed editor and Linux/Web modules, followed by the login-required license boundary. No Unity gameplay result is claimed yet.
