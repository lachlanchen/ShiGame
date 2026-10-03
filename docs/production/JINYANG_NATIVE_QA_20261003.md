# Jinyang native QA preparation

2026-10-03. This records **configuration, SDK qualification, four passing native Jinyang suites and a packaged arm64 Mac development app that launches into exploration**, not a qualified mobile application or store submission. It follows the [defense review and touch repairs](JINYANG_DEFENSE_BUILD_20261003.md).

## Player-facing purpose

A native test app must open the explorable Jinyang chapter from its icon, without desktop command-line switches. `ShiJinyangGameMode` now reads `StartInExploration` and `InitialLocale` from `[SHI.Jinyang]` in game configuration. Explicit desktop `ShiExplore` and `ShiLocale` arguments remain supported. The canonical default game mode and existing Qin release configurations are unchanged.

The isolated profile uses application identifier `art.lazying.shi.jinyangqa`, display name **SHI Jinyang QA**, development packaging and Simplified Chinese. It is not an upgrade to either current store application. Mobile profiles select landscape, conventional mobile rendering, the Jinyang world and required primitive/touch assets. Canonical non-UFS content remains staged. Android includes offline data inside the APK and uses app-scoped external files; no Google Play services or advertising is enabled. The Mac profile preserves the desktop renderer for the requested native macOS version; it is a separate package, not proof of iOS delivery. The active goal includes all three platforms, superseding earlier optional-Mac milestone wording.

Profile **v2** explicitly selects `EFIGSCJK` internationalization data and stages `en` and `zh-Hans`. The installed engine's `BaseGame.ini` otherwise inherits `English`/`en`; its AutomationTool uses these settings to select ICU data and localization resources. This packaging correction supports the two current QA UI lanes. It does not establish glyph/layout acceptance or claim that the Jinyang scene is translated into all eleven planned languages. Generate a new v2 directory; preserve the earlier v1 receipt rather than overwrite it.

Profile **v3** retains that language-data correction and fixes modern Apple project generation. Both Apple profiles now set the QA bundle identity and display name in `/Script/MacTargetPlatform.XcodeProjectSettings`, disable automatic signing/App Store Connect, clear inherited iOS signing selections, and select local ad-hoc signing for Mac. The earlier iOS-only identity setting did not establish the identity of the modern Xcode project. Canonical release configuration remains unchanged; a local Mac signature is not notarization or distribution approval.

Profile **v4** fixes a defect found by the actual cooker: `IOSProvisioningProfile` is Unreal's reflected `FFilePath` struct, not a plain string. It must be cleared as `(FilePath="")`. V3's empty right-hand side passed Xcode generation but caused a `LoadConfig` error and failed the cook. Both Apple profiles now emit the struct representation, covered by the existing manual-signing regression test. This does not select a real profile or change signing authority.

## Reproduce without changing release configuration

From a source checkout, with an existing parent directory:

```bash
node scripts/jinyang-native-qa-config.mjs IOS /absolute/new-ios-config-directory
node scripts/jinyang-native-qa-config.mjs Android /absolute/new-android-config-directory
node scripts/jinyang-native-qa-config.mjs Mac /absolute/new-mac-config-directory
npm run validate:jinyang
```

The generator exclusively creates a new directory containing two INI files and a SHA-256 receipt; IOS v3/v4 additionally contains `UnsignedIOS.xcconfig`. It rejects existing destinations and paths inside the canonical Unreal project, including symlinked parents. Apply its output **only to a dedicated staging checkout**, after recording source commit and preimage hashes and preserving original configuration. Do not overwrite a working release checkout or apply multiple platform profiles simultaneously. Generate a fresh v4 directory rather than modifying earlier profile evidence. Generated profiles are private build inputs, not tracked source or build evidence.

SDK paths, signing identities, provisioning profiles, credentials and shared Xcode selection are deliberately absent. Use the installed engine's SDK metadata and per-command environment. Do not force an installed-engine rebuild through an unsupported custom target merely to choose this configuration.

## Checks actually performed

- Seven configuration tests pass: isolated identity/entry, renderer/orientation scope, cook closure, explicit bilingual language-data packaging, INI merging, exclusive/hash-receipted preparation with symlink protection, and static native-entry wiring.
- V3 adds two passing cases for modern Apple identity/manual-signing isolation and an iPhoneOS-only unsigned companion: **nine configuration cases**. These are generator tests, not native build/signing results.
- The initial combined Jinyang checks passed thirteen Node tests, 52 legacy and 109 current replay checkpoints, and the exact standalone C++ input/layout checks. The later compilation/native-test results below supersede this source-only checkpoint; actual visual/input verification remains open.
- Unreal's installed **5.8.1** `UnrealBuildTool -Mode=ValidatePlatforms -Platforms=Android -OutputSDKs` completed with explicit `##PlatformValidate: Android VALID r27c`. This mode only qualifies SDK discovery; exit zero alone would not establish validity.
- The process selected the existing NDK **28.2.13676358** and JDK **21** through per-command environment. The printed `r27c` is the engine's preferred version, **not** a measurement of the selected NDK. No SDK was downloaded or globally reconfigured. This is not Gradle, cook, signing, target-API/store-policy or installed-device qualification.
- During installation, completed staging metadata identified **5.8.3, changelist 58210709** and an Apple SDK range of **15.2.0–27.9.0** (preferred 26.1.1); both Mac and iOS inherit this range. This differs from the older Linux 5.8.1 metadata and admits the mini's existing **Xcode 27.0 / 27A266a**. Installation and final-file verification subsequently completed, as recorded below.
- Xcode 27's first-launch check passed. Its Mac, iPhoneOS and iPhoneSimulator SDKs each report 27.0. The actual Metal compiler **32023.921** compiled and linked the same small compute shader separately for all three targets, exit zero. This proves tool execution, not Unreal shader compatibility, a running simulator app or a native SHI build. Xcode 26.6's earlier Mac probe remains valid but is no longer the preferred next attempt; no shared Xcode selection or system package was changed.

### Apple toolchain evidence

The download's `Build.version` SHA-256 is `eab58750e84719489f3ee0d42d05a533ceb357eb3ee511777e9408d27a85f43c`; `Apple_SDK.json` is `860167ec94a1979927272b03c28f0771dcfddd688fe60d58b405183459428ab8`. The probe source hash is `246043d1e274b8d8de0c90829fa8d42a4f0a11f37da4648dda840398dbf93bb4`.

| Compiled target | Linked Metal library SHA-256 |
| --- | --- |
| macOS | `d19f9e3a385befe09c47dd354d807fa6d7b5c7343161740c3db420b92dca1e7b` |
| iPhoneOS | `cfc176314df213ca0e5f21e6318761fd3211e7d0cfdd859b7a0846a15f0f0401` |
| iPhoneSimulator | `b32cb50aff24afbfa19373ccca5bc9df9cd0f34ec5fcc6422f106697ca5261b8` |

Next use the existing Xcode 27 path through per-command `DEVELOPER_DIR`, subject to final installed-engine SDK validation. Do not install older shared first-launch components to work around a version limit that does not apply to this candidate.

### Installed-package architecture evidence

The exact pending 5.8.3 manifest was decoded with the existing official BuildPatchTool 1.9.0. Its SHA-256 is `a32b6361640dd02a936342d3b0bb4bfefb04d37b475867a7d4fcfd774c5df2eb`. The launcher's recorded selection is core, engine source, Android and iOS: **58,547,965,677 installed bytes**, independently matched by filtering the manifest. Its much larger all-components size includes unselected editor symbols; it is not the chosen installation workload. Allocated staging-disk usage is not an exact completion percentage.

The completed staged `BaseEngine.ini` matches the manifest SHA-256 `3852b5278529a5ea48a6b91928713a30d902f7d6553aac785959123f84590f91`. Its declared installed configurations are:

| Requested target | Declared architectures | Next qualification |
| --- | --- | --- |
| Mac editor/game | `arm64`, `x64` | Compile the current module and run the native suites on Apple Silicon, then package/playtest |
| Android game | `arm64`, `x64` | Use the QA profile's `arm64` selection and qualify the real phone build |
| iOS game | Device `arm64` only | Build a device candidate and test on the paired iPad |

The manifest contains no `Engine/Intermediate/Build/IOS/iossimulator` objects, and the installed-platform configuration declares no `iossimulator` target. A few third-party simulator libraries do not qualify a complete simulator engine. This is evidence about **this downloaded package**, not a claim that Unreal never supports iOS simulators. Do not force a simulator target or rebuild the whole engine merely to avoid the available physical-device route. Existing SwiftUI-client simulator results remain separate from the new Unreal chapter.

A fresh read-only device check found the iPad paired and available. Its USB host has a matching development provisioning profile for the isolated QA identifier, includes that device, and lists a certificate also present in the host's valid signing-identity inventory. The mini's default keychain search reported no valid signing identities. The intended split is therefore compilation on the roomy mini, followed by signing/device installation on the existing signing host, after validating the supported unsigned-build path, actual key access, bundle entitlements and free space. Do not copy private keys, modify shared keychains or overwrite the installed store app. No signing operation, installation, UI automation or device playtest has been performed by this inventory.

### Unsigned intermediate preparation — not device acceptance

The pending 5.8.3 manifest exactly matches the locally inspected `AppleExports.cs`, `XcodeProject.cs` and `ApplePlatform.Automation.cs` hashes. These files confirm the modern configuration section, automatic provisioning flag and additional Xcode options at staging/packaging. `AppleToolChain.cs` differs between the two versions: its final installed implementation still needs inspection before the native build. Do not assume that AutomationTool's `-NoCodeSign` flag alone disables every modern Xcode signing step, or skip post-build finalization by pretending the build originated in Xcode.

The installed Xcode manual on an existing Mac confirms that per-process `XCODE_XCCONFIG_FILE` overrides build settings, including command-line settings. Apple's [configuration-file reference](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project) describes SDK-conditional settings. IOS v3 supplies an unsigned-device override using `[sdk=iphoneos*]` for every setting so a host Mac editor/helper retains its signing behavior. Apply the absolute companion path **only to the unsigned iOS build command**, not a shell profile, service or shared environment. Do not use automatic provisioning, portal updates or credentials on the unsigned build host.

This file prepares a candidate path; it has **not** yet produced a compiled Unreal application. Before transfer, check the actual bundle identifier, architecture, staged content, entitlements and nested executable inventory. Unset `XCODE_XCCONFIG_FILE` before signing on the existing signing host. A valid development profile and actual successful signing/verification are required before installing the separate QA app. Neither the unsigned artifact nor local Mac ad-hoc signing qualifies a TestFlight upload.

## Native Mac compilation — October 3 evening

The official **5.8.3 / 58210709** installation completed file relocation and verification successfully; the staging area was removed. Final `Build.version`, `Apple_SDK.json` and Apple build-tool source match the previously pinned manifest hashes. The temporary download-network changes were rolled back, and the completed frozen launcher was closed before building. The GUI's missing completion statistics did not override the worker's successful verification and installed-file evidence.

The first actual Mac compilation exposed a defect that the small standalone input/layout tests could not detect: `.DPIScale(this, ...)` selected a Slate shared-pointer delegate, but its owner is an Unreal actor. Both walking and command touch overlays now use `.DPIScale_UObject(this, ...)`, retaining dynamic scaling with the correct owner lifetime. The static wiring check guards this binding; native compilation is the authoritative API/template check.

Source **`17f6c6100855b662facb57af1f6826bd2519e8a1`**, Mac QA v3, bundled .NET 10 and Xcode 27 successfully compiled the **arm64 SHIEditor module** with a four-action parallelism limit. The corrected incremental build finished with exit zero in **6.67 seconds**. `libUnrealEditor-SHI.dylib` is Mach-O arm64, SHA-256 **`319fc2ec1544bb02893c8ba47e6be286c090ecc78ee23e69587e7d60ae573092`**. This compiles the touch/layout entry changes and worker-camera policy; it is not a packaged game or observed visual behavior.

Fifteen combined QA/viewport/resource checks, 52 legacy plus 109 current replay checkpoints, standalone C++ input/layout/camera checks, Unreal static validation and repository/story/profile checks pass.

The **native Mac automation report also passes all four suites**, with zero warnings, failures or unrun tests: `SHI.Jinyang.ExplorationInterface`, `ExplorationSave`, `MotionEndpoints` and `PerformedOrderParity`. These ran in the actual arm64 editor commandlet with `NullRHI` and sound disabled, against the module above. Report SHA-256: **`4aadebefe163ef16139687737c9dc1d321b0362fb6fdbd68265d7042d0982388`**. This exercises the native interface/camera policy, saved exploration, motion endpoints and replay-conformant orders. It does not render the scene, listen to its audio or establish player comprehension. The reported 0.064-second test-body duration excludes startup and is not a frame-time measurement.

The vendor's editor wrapper has an ad-hoc signature whose nested Steam-library check reports a mismatch. The library, main executable and signature record each match the official download manifest. No macOS security policy was disabled and no vendor binary was re-signed to conceal the warning. Compilation and headless native automation execute successfully; graphical execution and packaging remain separate checks.

### Native game build and packaging follow-through

The standalone game also compiles and links, but the normal build runner repeatedly failed Xcode's generated `Touch UBT generated tiles` pre-action. Replaying the same Xcode finalization directly succeeded with zero reported errors or warnings. Both `-NoUBA` and `-UBANoDetour` were tested; neither resolved this run's failure, whose environment still included `UBA_DETOURED=1`. This bounds the failing execution path; it does not establish a general vendor root cause.

The verified workaround uses UnrealBuildTool's `-WriteOutdatedActions=<private-actions.json>` export, then executes **all 52 exported actions directly in dependency order**, including compilation, linking, `ApplePostBuildSync`, version updating and `WriteMetadata`. The pinned graph SHA-256 is `724f08b5c73ddc4b1943e97554974c1f922164fd80431c5d1673f874fac561e2`. All actions passed in 105.298 seconds with one compiler process at a time. Commands and response files remain engine-generated; no engine file, shared configuration or security policy was modified, and no build receipt was fabricated or finalization skipped.

The resulting **arm64 Development game executable** has SHA-256 `517c0d9c2fab5b9048ecff6e7656fc018e88de6d160c3587d70122384b0449c4`; its generated `SHI.target` receipt is `ce3b22dc5a9cbdb57027674e6efa6364e7b5c2bf642f572288b35ae586ad9e4d`. The game's local ad-hoc `.app` passes strict/deep code-signature verification and has identifier `art.lazying.shi.jinyangqa`. This is distinct from the vendor-editor signature caveat above.

Cooking/staging/packaging used `BuildCookRun -skipbuild -cook -stage -pak -package -archive` only after the successful 52-action receipt and actual target receipt were checked. The first cook completed asset processing but exited with one configuration-import error, fixed by QA v4 above; it was not accepted as a package. The cooker used a per-command shader configuration override; four real shader-worker processes were observed on the 18-core mini.

The QA v4 retry **completed cook, stage, pak, package and archive successfully** at 21:35 HKT. RunUAT took 77.84 seconds; the cook reported zero errors and zero warnings. The self-contained `archive/Mac/SHI.app` contains the cooked world, PAK/IoStore data and both non-UFS Jinyang definitions. Its packaged arm64 executable SHA-256 is `1ae4a1b8d65b76f0a2768a094f21869f45edab36e061350224260bcaf2c328d0`; `Info.plist` is `5456a4e4469b992d515b327b257e37f9c2c4cb3a12ebeec46f0496c377f62b98`. Strict/deep signature verification passes. Allocated development-app size was 920,632 KiB; this is not a mobile download-size measurement.

LaunchServices successfully opened that app. The observed Metal SM6 player entered the Chinese Jinyang world from packaged game-mode/locale configuration, without a map, locale or exploration override. Its window title is **SHI Jinyang QA**; the bundle name still reads `SHI`. Walking-mode figures and touch-control overlays render. This is native graphical launch evidence, not a complete route, final character animation, audio listening or physical-device acceptance.

The Mac QA app is sandboxed. The initial review's external command-line save/log directory was not writable by the app; no save was produced there. A subsequent review uses a distinct directory inside the QA app's own container, and actual chronicle/log files are present. Keep test overrides inside the sandbox; do not disable sandboxing or use another application's container. Default icon-launch persistence and full cold-resume acceptance remain to be tested. GUI review runs in the project's isolated local virtual desktop, never the owner's normal desktop or shared UU relay.

## Next acceptance gate

The Mac package now exists and launches. Verify readable controls and upward touch look, then play defense → liaison → operation plus withdrawal. Test pause/background/cold resume, default sandbox persistence, scrolling, audio and save failure/retry. Continue native iOS/Android qualification from the same scene and rules; desktop touch emulation is not physical iPad/Mi 10 Pro qualification.

Only after installed-device and audiovisual review should a signed beta be prepared for explicitly authorized submission. Existing store apps, saved games and the previous verified Linux player remain intact. Final cast/animation, accepted Musia score, integrated film and the complete cinematic chapter remain open.
