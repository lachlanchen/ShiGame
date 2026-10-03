# Jinyang native QA preparation

2026-10-03. This is **configuration and SDK qualification**, not a compiled mobile application or store submission. It follows the [defense review and touch repairs](JINYANG_DEFENSE_BUILD_20261003.md).

## Player-facing purpose

A native test app must open the explorable Jinyang chapter from its icon, without desktop command-line switches. `ShiJinyangGameMode` now reads `StartInExploration` and `InitialLocale` from `[SHI.Jinyang]` in game configuration. Explicit desktop `ShiExplore` and `ShiLocale` arguments remain supported. The canonical default game mode and existing Qin release configurations are unchanged.

The isolated profile uses application identifier `art.lazying.shi.jinyangqa`, display name **SHI Jinyang QA**, development packaging and Simplified Chinese. It is not an upgrade to either current store application. Mobile profiles select landscape, conventional mobile rendering, the Jinyang world and required primitive/touch assets. Canonical non-UFS content remains staged. Android includes offline data inside the APK and uses app-scoped external files; no Google Play services or advertising is enabled. The Mac profile preserves the desktop renderer and is an optional development target, not a mobile-release prerequisite.

Profile **v2** explicitly selects `EFIGSCJK` internationalization data and stages `en` and `zh-Hans`. The installed engine's `BaseGame.ini` otherwise inherits `English`/`en`; its AutomationTool uses these settings to select ICU data and localization resources. This packaging correction supports the two current QA UI lanes. It does not establish glyph/layout acceptance or claim that the Jinyang scene is translated into all eleven planned languages. Generate a new v2 directory; preserve the earlier v1 receipt rather than overwrite it.

## Reproduce without changing release configuration

From a source checkout, with an existing parent directory:

```bash
node scripts/jinyang-native-qa-config.mjs IOS /absolute/new-ios-config-directory
node scripts/jinyang-native-qa-config.mjs Android /absolute/new-android-config-directory
node scripts/jinyang-native-qa-config.mjs Mac /absolute/new-mac-config-directory
npm run validate:jinyang
```

The generator exclusively creates a new directory containing two INI files and a SHA-256 receipt. It rejects existing destinations and paths inside the canonical Unreal project, including symlinked parents. Apply its output **only to a dedicated staging checkout**, after recording source commit and preimage hashes and preserving original configuration. Do not overwrite a working release checkout or apply multiple platform profiles simultaneously. Generated profiles are private build inputs, not tracked source or build evidence.

SDK paths, signing identities, provisioning profiles, credentials and shared Xcode selection are deliberately absent. Use the installed engine's SDK metadata and per-command environment. Do not force an installed-engine rebuild through an unsupported custom target merely to choose this configuration.

## Checks actually performed

- Seven configuration tests pass: isolated identity/entry, renderer/orientation scope, cook closure, explicit bilingual language-data packaging, INI merging, exclusive/hash-receipted preparation with symlink protection, and static native-entry wiring.
- The combined Jinyang checks pass thirteen Node tests, 52 legacy and 109 current replay checkpoints, and the exact standalone C++ input/layout checks. The new configuration entry code and earlier touch fixes still need native compilation and runtime verification.
- Unreal's installed **5.8.1** `UnrealBuildTool -Mode=ValidatePlatforms -Platforms=Android -OutputSDKs` completed with explicit `##PlatformValidate: Android VALID r27c`. This mode only qualifies SDK discovery; exit zero alone would not establish validity.
- The process selected the existing NDK **28.2.13676358** and JDK **21** through per-command environment. The printed `r27c` is the engine's preferred version, **not** a measurement of the selected NDK. No SDK was downloaded or globally reconfigured. This is not Gradle, cook, signing, target-API/store-policy or installed-device qualification.
- The Mac mini's one official Unreal installation is still constructing files. Reading its completed staging metadata identifies **5.8.3, changelist 58210709** and an Apple SDK range of **15.2.0–27.9.0** (preferred 26.1.1); both Mac and iOS inherit this range. This differs from the older Linux 5.8.1 metadata and admits the mini's existing **Xcode 27.0 / 27A266a**. Staging metadata is not completed installation: verify the final installed files before building.
- Xcode 27's first-launch check passed. Its Mac, iPhoneOS and iPhoneSimulator SDKs each report 27.0. The actual Metal compiler **32023.921** compiled and linked the same small compute shader separately for all three targets, exit zero. This proves tool execution, not Unreal shader compatibility, a running simulator app or a native SHI build. Xcode 26.6's earlier Mac probe remains valid but is no longer the preferred next attempt; no shared Xcode selection or system package was changed.

### Apple toolchain evidence

The download's `Build.version` SHA-256 is `eab58750e84719489f3ee0d42d05a533ceb357eb3ee511777e9408d27a85f43c`; `Apple_SDK.json` is `860167ec94a1979927272b03c28f0771dcfddd688fe60d58b405183459428ab8`. The probe source hash is `246043d1e274b8d8de0c90829fa8d42a4f0a11f37da4648dda840398dbf93bb4`.

| Compiled target | Linked Metal library SHA-256 |
| --- | --- |
| macOS | `d19f9e3a385befe09c47dd354d807fa6d7b5c7343161740c3db420b92dca1e7b` |
| iPhoneOS | `cfc176314df213ca0e5f21e6318761fd3211e7d0cfdd859b7a0846a15f0f0401` |
| iPhoneSimulator | `b32cb50aff24afbfa19373ccca5bc9df9cd0f34ec5fcc6422f106697ca5261b8` |

Next use the existing Xcode 27 path through per-command `DEVELOPER_DIR`, subject to final installed-engine SDK validation. Do not install older shared first-launch components to work around a version limit that does not apply to this candidate.

## Next acceptance gate

Compile the latest source, run the four native Jinyang suites, and confirm effective game mode, locale, landscape and application identity in an actual package. Launch from the icon, verify readable controls and upward touch look, then play defense → liaison → operation plus withdrawal. Test pause/background/cold resume, scrolling, audio and save failure/retry. Desktop touch emulation is not physical iPad/Mi 10 Pro qualification.

Only after installed-device and audiovisual review should a signed beta be prepared for explicitly authorized submission. Existing store apps, saved games and the previous verified Linux player remain intact. Final cast/animation, accepted Musia score, integrated film and the complete cinematic chapter remain open.
