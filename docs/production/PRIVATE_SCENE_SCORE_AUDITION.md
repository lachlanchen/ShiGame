# Private in-game Musia score audition

2026-10-01. Review tooling, not release asset admission.

The owner-selected working candidate B (seed 926102) can now be auditioned alongside the real web campaign. This removes the need to judge its scene fit on an unrelated listening page. The Musia production skill's listening and licensing gates remain intact: neither automated aesthetic ranking nor these playback tests count as human listening approval.

## Run locally

```bash
VITE_SHI_NATIVE=0 VITE_SHI_PRIVATE_SCORE_AUDITION=1 npm --workspace @shi/web run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/?seed=00000000&crossing=campaign-v2&score=audition`. Use the private audition disclosure and Play explicitly. Keep the server bound to loopback; do not expose it through a public proxy. The editor-style overlay is not shipping game UI.

The separate visible review harness supports:

```bash
SHI_PLAYTEST_SCORE=1 node scripts/playtest-retreat-visible.mjs crossing-v2
```

Before running it, apply the shared-workstation preflight and single-stack policy. The music-enabled branch now has one complete passing development route; see the review below.

## Identity and behavior

- Reads only the retained private `preview-926102.mp3`, without copying it into public/assets or Git. All six originals and alternatives remain unchanged.
- Listening-copy SHA-256: `7d28d185acd999637b19fd9eb0eb1bec778eff9f17c9507fff92519643cdada4`.
- Original WAV SHA-256: `f99feef979fa87a07d9bdc041d676ee34708663009045b8b3230d2a601aee8e1`.
- Server and client both verify identity. The endpoint is opt-in development-only, fixed-path, no-store, and rejects non-loopback requests, foreign hostnames, arbitrary file paths and non-read methods. Missing or changed bytes fail closed.
- No fetch/autoplay until Play. One 45-second recording, no looping, initial audition volume 0.2 and maximum 0.35. This is a provisional mix, not a reviewed final loudness target.
- One player persists across scene cuts. Backgrounding/page hide pauses without automatic resume. Pausing while loading cancels the pending play. Playback/end/error never writes a campaign save or chooses an action.
- An unavailable cue does not stop the game. Production build validation rejects the private endpoint/hash markers; no generated media is packaged.

## Evidence and remaining review

Fourteen focused tests pass, including isolation, hash rejection, pause during download, background pause and continuity across renders. Full web suite: 276 tests passed. Web TypeScript and production build/budgets pass (99.39 KiB initial JavaScript).

An actual bounded loopback Vite request returned the exact 1,081,197-byte MP3, audio/mpeg, no-store, and expected SHA-256; a request for another private file returned 404. ffprobe reports 45.024 seconds. The server was then terminated and its port verified absent. This verifies delivery, not audible scene quality or real-browser playback.

The initial GUI review was deferred when shared swap reached 69–70/71 GiB despite 63–66 GiB available RAM. A subsequent bounded browser-only review used one stack, with no obsolete SHI runtime to reclaim and no model/cook/editor work. No other project was interrupted. LocalVideoGen Studio8190 was confirmed offline; no new model or media-generation job was launched.

The current official [XL Turbo model card](https://huggingface.co/ACE-Step/acestep-v15-xl-turbo) identifies MIT licensing and states that generated music may be used commercially; the [ACE-Step code license](https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE) is recorded separately. These are upstream statements, not an assurance about every generated output or all pipeline dependencies. Final admission still needs pinned component/license review, full listening for unwanted voice or similarity, motif and rain/dialogue scene-fit review, and human acceptance. Do not mark the cue shipped or approved yet.

## Real-browser repair and review

The first real play attempt exposed a CSP mismatch: blob media was blocked by the existing `media-src 'self'`. The player now uses the same-origin fixed endpoint after its client hash check; the server independently verifies the same pinned hash for every subsequent media request. Production CSP was not broadened.

Two subsequent phone checks exposed review-overlay collisions with differently placed crossing and chronicle close buttons. A development-only 64px toolbar strip now reserves space above drawers and aftermath dialogs. The music control remains available without hiding the tested close/continue controls. Its layout class is removed on unmount. Volume changes during loading and delayed play promises after Pause are covered by regression tests.

Final visible run: `.runtime/story-review/2026-10-01T01-34-06.594Z`, 58 passing checks, 18 screenshots and no browser exceptions. Chrome reports duration45 seconds, loopfalse, volume0.2, pausedfalse and advancing currentTime. The same player survives scene transitions; reload starts silent, and explicit replay leaves the saved field command unchanged. The route completes crossing → Chen → Fan Yang → retreat together ending with resume and preserved old saves. Playing-desktop, crossing-phone and primary-reaction-phone screenshots were inspected.

This is browser decoding/playback and layout evidence, not verification of physical speakers or a full listening pass. Soundtrack emotional fit and admission remain open. Exact owned children and ports were verified absent after cleanup. Evidence summary: `docs/production/evidence/private-score-playback-web-20261001.json`.

After the repairs, all 278 web tests, web TypeScript checks and production build/budget checks pass. The private score remains excluded from the production bundle.
