# Jinyang defense and touch — native build checkpoint

2026-10-03. Source: `1b8c8ad7b8bba5ee9ab814e387e0a7732ae5e716` on `work/jinyang-defense-20261003`. This qualifies the previously committed defense/forecast and touch-input implementation for compilation, not for finished gameplay or mobile delivery.

## What is now built

The opening defense interaction is compiled into a new Linux development package: inspect a work location, preview the actual rules' costs without committing, cancel or dispatch an order, and remain in the walking world while its presentation proceeds. The source also includes touch-oriented exploration controls and shared pause/skip/save handling. Their runtime usability still needs the complete input-driven review below.

The previous verified world package is preserved. No new campaign rules, historical claims, art, dialogue or saves were authored in this build checkpoint.

## Verified results

- Official installed Unreal **5.8.1**, changelist **56057345**: `SHIEditor Linux Development` compiled and linked successfully, exit 0. Concurrency was capped at four build actions.
- Fresh native `SHI.Jinyang.` run: **four successful suites**, exit 0 — `ExplorationInterface`, `ExplorationSave`, `MotionEndpoints`, `PerformedOrderParity`. Rules parity covers **52 revision-1 and 109 revision-2 complete-state checkpoints**; the latter suite includes the new forecast assertions.
- The test run retains warnings about headless SDL/Wayland initialization. The engine's Dataflow plugin also reports an uninitialized `FDataflowToolNodeSnapshot::Date` during editor startup; it did not fail the four suites. This is not an error-free engine-startup claim.
- `BuildCookRun` completed build, cook, stage, pak and archive successfully, exit 0. Packaged executable SHA-256: `df74c344081bec935847739ea16123ec59eabc448a5b7408681368b9c0b55fce`.
- Package directory: **1.1 GiB** as measured by `du -sh`, including development/debug artifacts. This is neither a mobile download-size measurement nor acceptance of the intended mobile content budget.
- Content sync, Unreal project contract, Jinyang content validation, both replay fixtures and standalone native input checks passed. No rule/source changes occurred during those checks.

Raw logs, the native automation report, build artifacts and machine-control details remain in the private runtime record. They are not committed as source.

## Mac development setup

The Mac mini now has a working authenticated SSH route and an isolated, loopback-only remote console. UU Remote remains an allowed temporary GUI route; SSH is preferred, and the owner's normal desktop is not a review surface.

Epic sign-in was observed in the native launcher. Official **5.8.3** installation was started with core/source/iOS/Android components. Its download encountered DNS timeouts and is not yet installed or qualified. A hash-verified copy of the same game source, generated content and native replay fixtures is staged for the Mac build.

The existing Xcode 27 Metal compiler runs. The separate Xcode 26.6 installation still lacks its compatible Metal component and has pending first-launch packages; the attempted Metal catalog fetch failed. Shared default Xcode selection was not changed. Qualify the installed engine's actual Apple SDK range before choosing the final toolchain; Linux qualification is not Mac or iOS qualification.

## Remaining acceptance

The build used a resource-admitted interval. Swap subsequently rose above the shared-workstation launch threshold, so **this new package has not yet been launched for visual review**. No foreign process was stopped to force admission.

Next, in one admitted isolated review runtime:

1. Walk to the defense position; inspect, preview, cancel and dispatch. Verify that preview/cancellation preserve the ledger and dispatch charges exactly once.
2. Walk alongside the performed response, pause/resume and skip, then cold restore. Continue into liaison and the operation with the earned preparation intact.
3. Play a materially different escape/withdrawal route. Check failed-save feedback, touch controls and small-window layout through actual input.

The isolated review launcher accepts `--viewport=844x390` (or `--viewport=390x844`) with `--explore --touch --zh`. Use a separate evidence directory for each run and stop the previous owned stack first. X display, game resolution and the fit guard use the same bounded dimensions; the recorder verifies them and preserves the aspect ratio rather than forcing a desktop-sized capture. Missing legacy viewport metadata means the original 1920×1080 default; malformed metadata is rejected. Viewport/parser and resource-gate tests do not count as an observed phone-layout pass, and desktop touch emulation does not replace physical-device testing.

G1–G4 remain open. This checkpoint is not final character/animation quality, accepted Musia music or LocalVideoGen film, a finished chapter, a physical-device test, a new TestFlight build, a Google internal update or a public release.
