# Reset presentation between cinematic clips

Two tests reproduced a reusable-player blocker: after a clip ended or failed, changing the supplied asset retained `ended`/`unavailable`, making the next scene unplayable. `SilentFilm` now replaces the video element when its source or caption identity changes, cancels the preceding request and resets presentation to `ready`. It does not autoplay, resolve a choice or touch campaign storage.

Lifecycle activity permissions stay in the parent player rather than resetting with the video. A scene change while native-inactive therefore still refuses playback. If an old detached video's pending play promise completes after the new clip begins, the old video is paused without stopping or changing the current scene.

Evidence: ended/error transition tests failed before the fix. All 18 player tests and the full 322-test web suite pass afterward, including late old completion and preserved native inactivity. TypeScript, production build and two build-validator tests pass. Initial JS99.40 KiB, CSS11.87 KiB, deployment26.98 MiB. The existing Vite extensionless-config-import warning remains.

These are component-level synthetic assets, not a second admitted cinematic scene or physical-device proof. No footage, historical content, saved choice, native build, store submission or public release changed. This removes a player transition blocker for a multi-clip council sequence; reviewed scene-specific acting, audio and complete real-media/device transitions remain required.
