# Jinyang native QA preparation

2026-10-03. This is **configuration and SDK qualification**, not a compiled mobile application or store submission. It follows the [defense review and touch repairs](JINYANG_DEFENSE_BUILD_20261003.md).

## Player-facing purpose

A native test app must open the explorable Jinyang chapter from its icon, without desktop command-line switches. `ShiJinyangGameMode` now reads `StartInExploration` and `InitialLocale` from `[SHI.Jinyang]` in game configuration. Explicit desktop `ShiExplore` and `ShiLocale` arguments remain supported. The canonical default game mode and existing Qin release configurations are unchanged.

The isolated profile uses application identifier `art.lazying.shi.jinyangqa`, display name **SHI Jinyang QA**, development packaging and Simplified Chinese. It is not an upgrade to either current store application. Mobile profiles select landscape, conventional mobile rendering, the Jinyang world and required primitive/touch assets. Canonical non-UFS content remains staged. Android includes offline data inside the APK and uses app-scoped external files; no Google Play services or advertising is enabled. The Mac profile preserves the desktop renderer and is an optional development target, not a mobile-release prerequisite.

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

- Six configuration tests pass: isolated identity/entry, renderer/orientation scope, cook closure, INI merging, exclusive/hash-receipted preparation with symlink protection, and static native-entry wiring.
- The combined Jinyang checks pass twelve Node tests, 52 legacy and 109 current replay checkpoints, and the exact standalone C++ input/layout checks. The new configuration entry code and earlier touch fixes still need native compilation and runtime verification.
- Unreal's installed **5.8.1** `UnrealBuildTool -Mode=ValidatePlatforms -Platforms=Android -OutputSDKs` completed with explicit `##PlatformValidate: Android VALID r27c`. This mode only qualifies SDK discovery; exit zero alone would not establish validity.
- The process selected the existing NDK **28.2.13676358** and JDK **21** through per-command environment. The printed `r27c` is the engine's preferred version, **not** a measurement of the selected NDK. No SDK was downloaded or globally reconfigured. This is not Gradle, cook, signing, target-API/store-policy or installed-device qualification.
- The Mac mini's one official Unreal 5.8.3 installation is still constructing files. The compatible Xcode 26.6 Metal compiler separately passed a real compile/link probe. No Mac game build has begun; inspect the installed engine's actual SDK range before selecting the toolchain.

## Next acceptance gate

Compile the latest source, run the four native Jinyang suites, and confirm effective game mode, locale, landscape and application identity in an actual package. Launch from the icon, verify readable controls and upward touch look, then play defense → liaison → operation plus withdrawal. Test pause/background/cold resume, scrolling, audio and save failure/retry. Desktop touch emulation is not physical iPad/Mi 10 Pro qualification.

Only after installed-device and audiovisual review should a signed beta be prepared for explicitly authorized submission. Existing store apps, saved games and the previous verified Linux player remain intact. Final cast/animation, accepted Musia score, integrated film and the complete cinematic chapter remain open.
