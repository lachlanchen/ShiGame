# SHI mobile Chapter I — 2026-09-26

The owner requested mobile development/test/review, a paid USD0.99 release,
and genuinely native iOS. Public release is a separate gate.

## Architecture

iOS is a SwiftUI application with a Foundation deterministic campaign engine,
SceneKit schematic war table, native local-save transactions, Dynamic Type,
right-to-left layout and reduced motion. It embeds no browser or Capacitor.
The rejected wrapper scaffold is retained only in ignored scratch storage.

Android bundles the existing React/Three.js campaign in Capacitor8. It has native
lifecycle/back handling and a serialized Preferences save mirror. Runtime
failures are visible rather than silently claiming a successful native save.

Neither mobile client contains the separate Unreal desktop combat scene. Both
ship the same canonical Chapter I JSON; the native engine must pass all46shared
replay routes,183turns and every final-state assertion. Narrative is English and
Simplified Chinese, with eleven-language labels and disclosed English fallback.

## Current evidence

- Canonical campaign SHA256:
  `445974ec77d789adc0bd54b147c924fffd1fc440668f900667b1086341a2ef0c`.
- All65web/core tests and full repository validation passed.
- Standard web build remains below unchanged budgets:99.91KiB initial JS gzip,
  11.78KiB CSS,26.88MiB deployable payload. No forced dependency upgrade.
- iPhone17ProMax/iOS26.3.1 simulator: full chapter and terminate/resume passed.
- iPadPro13M4/iOS26.3.1 simulator: full chapter/resume, largest Dynamic Type
  Chinese and Arabic/RTL tests passed. No skipped tests, no physical-device claim.
- App Store delivery validated, processed VALID, TestFlight IN_BETA_TESTING with
  the owner invited, App Review WAITING_FOR_REVIEW. Exact artifact/provider IDs
  are in `store/release.json`. Release mode is MANUAL.
- Six actual native screenshots were reviewed and accepted by Apple's asset
  service; they do not claim a rendered or future combat feature.
- Android's initial API36.1 emulator had an OS graphics startup crash in
  `mapper.ranchu`, before app installation. Retrying with Vulkan/GLDMA disabled
  did not resolve it; that runtime was stopped. API34 boots and launches the
  signed app. Current-OS Android qualification must remain distinct from this
  fallback test, and can be extended through Play's pre-launch testing.
- Android API34 signed-release QA passed a full four-decision route to Deep
  Roots, including offline restart/resume at intermediate and completed states,
  native Back dismissal of source/command/resolution panels, and preserving
  progress across a signed update. Seed954EF34F: hide register, recruit courier,
  households first, village covenants. System bars and scroll-reachable privacy
  links were visually checked; the privacy link dispatches the correct external
  HTTPS intent. Release lint/unit checks passed. The SHI emulator was stopped.
- Android final APK SHA256:
  `ae70607f1efb7cf3a4ef3c27aaafcac12d8ebdfe5d04a1e51ff0fa484c48f653`;
  AAB `078fefba517e934b8f1c563760eca0a23eb634a0a75d024d9eef7e31e56e0df4`.
  These runtime checks do not replace physical-device or current-OS qualification.
- Google internal test is available to the selected owner account. Restricted
  Alpha review was submitted at2026-09-26T11:18:08Z with13changes. These are now
  ready to publish but held. Two later territory changes are in review.
  Managed publishing ON; no production rollout. A DNS precheck warning was explicitly overridden only
  after verifying the public DNS and successful HTTPS privacy-page response.

## Release boundaries

The owner selected all eligible markets. Apple has 173 territories selected;
mainland China and Vietnam remain excluded pending game licences. Google has
169 markets configured in closed Alpha and inactive production, excluding its
disabled paid markets, Russia/Belarus paid-download restrictions, and Vietnam
pending licensing clarification. Country-setting changes do not authorize a
production release. Exact lists, readback states, and official references are
in [the territory manifest](../../store/territories-2026-09-26.json).
Future-territory autoavailability and automatic Mac/Vision storefront
distribution are off. The existing title concept art's
specialist-review caveat is preserved; store marketing uses actual game UI and
an original typographic/vector identity, not that concept-art image.

No new paid generation, cloud compute, AI dependency, analytics, account system,
advertising SDK or in-app purchase has been introduced. No sibling repository,
store app, active runtime or signing identity was modified. Shared installed
SDKs, signing infrastructure and pinned remote access were reused.

## Working tree

Earlier Unreal, cinematic, game-core/campaign and web refinements were already
dirty when this mobile task began. They remain intact. Do not stage the entire
worktree as a mobile commit. The legal/support page deployment is isolated in
commit2b69601; current native/mobile source and shared-content inputs are retained
in this worktree and bound by artifact/source hashes, not misrepresented as an
otherwise-clean Git commit. Private receipts and runtime ownership stay ignored.
`store/mobile-source-manifest-1.json` binds the public source input snapshot;
`scripts/mobile-source-manifest.mjs` can regenerate it without packaging secrets
or generated build trees.
