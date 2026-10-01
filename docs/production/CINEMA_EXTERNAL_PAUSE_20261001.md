# Honour external cinematic pause

The silent scene player handled its own Pause button and lifecycle suspension but did not revoke playback intent when the video element reported an external pause. Two regression tests reproduced this: a pause during a pending play left the UI `starting`, and a later `playing` event resumed an externally paused scene.

`SilentFilm` now clears playback intent and invalidates the pending request on every video pause event. Both `starting` and `playing` become `paused`; terminal states remain terminal. Late promise completion or unsolicited playing events reassert pause. A fresh explicit Play action can resume. No campaign/save/content code changed.

Verification: both new tests failed before the fix; all 14 player tests and two private-film component tests passed afterward. The complete web suite passed 318 tests; TypeScript, production build and two build-validation tests passed. Initial JS99.41 KiB, CSS11.87 KiB, deployment26.98 MiB. A final focused run also verifies explicit restart after the externally paused pending request completes. Existing Vite extensionless-config-import warning remains.

This is a reproducible component regression, not evidence of physical-device interruption behaviour. No browser desktop, native build, store submission or public release was launched for this checkpoint. Existing moving footage remains private and unfinished; this fix improves player control without admitting new assets.
