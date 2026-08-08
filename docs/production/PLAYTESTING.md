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

The script sends actual mouse and key events through the visible Chrome target, captures screenshots, and checks title metadata, WebGL canvas, opening content, five resources, three choices, pressure warnings, `Shift+1–3` decisions, source/record shortcuts, source classifications, save format 2, response reveal and separated deltas, Arabic RTL, resume, desktop/mobile layout, scrolled mobile cards, and console errors.

## Current result

2026-08-09 local systems checkpoint: 31 checks passed with zero page console errors. Chrome used ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklisted native WebGL. Evidence is in `docs/production/evidence/`; the machine-readable status names the exact tested URL. The deployed URL must repeat the same suite after publication before this checkpoint is called public-verified.

Visual review after automation:

- Title composition: pass.
- Desktop map/story hierarchy: pass.
- Pressure warnings, two-stage choice feedback, source drawer and persistent decision record: pass.
- Arabic shell: pass after isolating untranslated English narrative as LTR.
- Keyboard contract: pass after replacing browser-reserved `Alt+1–3` with `Shift+1–3`.
- Mobile structure: pass after correcting the two-card selector; page scroll is intentional, full-width cards are readable, horizontal overflow is zero.
- Small tactical copy: monitored; secondary labels remain readable in the reviewed captures.

Evidence must be regenerated when layout, campaign content, localization direction, Three.js, or save behavior changes.

## Dedicated Unity desktop

Unity Hub is available on a separate localhost-only desktop so installation and licensing can be observed without touching the web test profile.

| Service | Endpoint |
| --- | --- |
| X display | `:123` |
| VNC | `127.0.0.1:5933` |
| noVNC | `http://127.0.0.1:6133/vnc.html?host=127.0.0.1&port=6133&autoconnect=1&resize=scale` |

Current evidence shows the installed editor and Linux/Web modules, followed by the login-required license boundary. No Unity gameplay result is claimed yet.
