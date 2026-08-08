# Visible web playtesting

SHI browser QA uses a dedicated localhost-only Xvfb/noVNC/Chrome profile so tests can be watched and reproduced without touching the user's normal browser.

## Dedicated endpoints

| Service | Endpoint |
| --- | --- |
| Web preview | `127.0.0.1:4173` |
| X display | `:121` |
| VNC | `127.0.0.1:5921` |
| noVNC | `http://127.0.0.1:6121/vnc.html?host=127.0.0.1&port=6121` |
| Chrome DevTools | `127.0.0.1:9321` |

All bind to loopback. The reusable Chrome profile lives under ignored `.runtime/novnc/profile`.

## Gate command

```bash
npm run build
SHI_CDP_PORT=9321 node scripts/playtest-web.mjs
```

The script sends actual mouse and key events through the visible Chrome target, captures screenshots, and checks title metadata, WebGL canvas, opening content, five resources, three choices, source classifications, Arabic RTL, overflow, branch consequence, local persistence, resume, mobile layout, and console errors.

## Current result

2026-08-08: 21 checks passed; zero page console errors. Chrome used ANGLE/SwiftShader because the workstation NVIDIA driver mismatch blocklisted native WebGL. Evidence is in `docs/production/evidence/`.

Visual review after automation:

- Title composition: pass.
- Desktop map/story hierarchy: pass.
- Choice feedback and source drawer: pass.
- Arabic shell: pass after isolating untranslated English narrative as LTR.
- Mobile structure: pass; page scroll is intentional, horizontal overflow is zero.
- Small tactical copy: raised after screenshot review.

Evidence must be regenerated when layout, campaign content, localization direction, Three.js, or save behavior changes.
