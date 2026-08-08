# SHI progress log

## 2026-08-09 · Persistent Qin pursuit checkpoint

- Added a readable persistent opponent to Chapter I. Current Exposure selects `scattered-watch`, `road-search` or `closing-cordon` before commitment; the UI discloses the exact modifier and an actionable threshold-based counterplay, then preserves the response in the result and decision record.
- Kept the historical boundary explicit. Qin pursuit is classified as dramatic reconstruction, cannot create claims or routes, and states that it does not assert a documented patrol itinerary.
- Upgraded the canonical campaign/schema and both engines to version 4. Resolution is now action → authored choice pressure → disclosed pursuit posture → disclosed seeded field condition, with all four layers separately recorded and identical TypeScript/C# ordering.
- Added legacy-safe replay with `legacyDecisionCount`. Version 1–3 decisions retain their original resources and endings after migration; only later decisions receive pursuit, while version-4 records verify both posture and field identities rather than trusting stored totals.
- Expanded validation to prove unique IDs, bilingual copy, effect direction/bounds, complete non-overlapping Exposure 0–99 coverage and reachability of every posture. Exhaustive traversal passes with all three endings, no deadlocks, 694 successful condition-routes and 82 capture/scattering routes.
- Added localized pursuit-interface text for all eleven UI locales, a responsive/RTL/forced-colors Web presentation, a scrollable Unity decision record and native preflight/tests. Unity runtime, editor and EditMode-test sources compile offline with warnings treated as errors; licensed native import/execution/build remain open.
- Kept the unchanged startup budgets by transporting only compact pursuit rules initially and lazy-loading the full multilingual presentation. The production build passes at 99.15 KiB initial JavaScript, 9.58 KiB CSS, 3.01 KiB pursuit UI, 178.95 KiB largest lazy JavaScript, 22.94 MiB complete fonts and 26.78 MiB deployable output.
- The first new visible-browser run correctly rejected an unsupported `aria-label` on the modifier container. Giving the modifier set explicit group semantics clears the finding; the complete rerun passes 186 checks, twenty-seven axe states, nineteen target states and eleven locale/font states with zero console errors, remote requests/resources or failed loads. Desktop, 390×844 mobile and the real `road-search` +2 Exposure result frames were visually reviewed.

Next gate: publish and replay this exact checkpoint on Pages, then continue the open licensed-Unity, human assistive-technology/zoom/high-contrast, physical-controller, observed-player, historical-specialist and audio-listening gates. Chapter II remains gated.

## 2026-08-09 · Objective audio-engineering checkpoint

- Replaced the former endpoint-matching rain workaround after reference rendering showed it introduced a −0.232 raw DC bias. Both engines and the deterministic renderer now subtract the seeded signal mean and judge the loop boundary against the ordinary 99th-percentile rain transient; the resulting DC is zero and boundary ratio 0.6029 against a 0.8 ceiling.
- Promoted cue attack/release and objective quality bounds into the shared Web/Unity contract. Web Audio and Unity now implement the same bounded linear envelope; Unity preflight and EditMode source tests enforce quality dimensions, reconstructed rain behavior and cue audibility.
- Added a reproducible 18-second, 48 kHz/24-bit reference renderer with FFmpeg EBU R128, sample/DC/channel/cue analysis and spectrogram evidence. All nine gates pass at −36.7 LUFS, −23.0 dBTP and −22.96 dBFS; every cue is above −42 dBFS and no generated WAV is committed.
- Added a second localhost-only visible Chrome/noVNC desktop and a named PipeWire capture sink. The controller proves two seconds of exact pre-consent digital silence and records sixteen seconds of the actual Web Audio path while visible pointer/keyboard actions trigger six ordered semantic cues.
- Rejected the first actual-browser recording at −4.7 dBTP. It exposed a real startup defect: a fade read the `GainNode` intrinsic full-scale value before the initial mute. The engine now pins immediate gain values, holds the current automation value before ramping and includes a focused regression test.
- The corrected exact-implementation localhost recording passes all eight browser checks at −35.7 LUFS, −22.7 dBTP and −22.69 dBFS with negligible DC, exact channel parity and zero console errors. Screenshot and spectrogram inspection confirm that the startup broadband burst is gone; the later deployed-build recording is reported separately below.
- Expanded `npm run validate:audio` to fresh-render and compare deterministic evidence, validate the visible capture format/sequence/limits, require traceable review boundaries and keep all full WAVs/browser state reproducible but ignored.
- Exact implementation `4dd6a520fe7194c2d57124e8eebf1b68583395b6` passes a detached clean install/build, the complete 177-check visible-browser suite and the independent actual-output capture on localhost with zero console errors.
- A detached clean-install rehearsal exposed a Node 22.21/npm workspace-hoisting defect: Vitest resolved from the root while its optional latest `jsdom` peer was engine-incompatible and the compatible workspace copy was nested. Root-pinning `jsdom` 26.1.0 makes `npm ci` deterministic across the supported Node 22 range; the audited dependency tree reports zero vulnerabilities.
- The first hosted evidence-boundary build was rejected because the runner had no `/usr/bin/ffmpeg`. The renderer now prefers reviewed system binaries and falls back to `PATH` with explicit environment overrides, while both validation and Pages workflows install the required audio measurement toolchain before building; no audio gate was bypassed.
- Hosted validation and Pages deployment pass at `55dab445f200f958cbbbe39d0cb58053f924326c`. The deployed game returns HTTP 200 and repeats all 177 visible checks, twenty-six axe states, eighteen target states, eleven locale-font states and three UI-audio audits with zero console errors, remote requests/resources or failed loads.
- The independent public-output recording also passes: exact pre-consent digital silence and a sixteen-second six-event programme at −35.7 LUFS, −22.4 dBTP and −22.49 dBFS with negligible DC and exact channel parity. The committed status and spectrogram now identify the deployed URL and tested boundary.

Next gate: human listening, sensory-load, physical-device and native Unity audio review remain open after objective engineering measurement; the existing licensed-Unity, assistive-technology, physical-controller and observed-player gates remain open. Chapter II remains gated.

## 2026-08-09 · Shared procedural soundscape checkpoint

- Added one versioned Web/Unity audio contract with opt-in defaults, conservative master/bus caps, deterministic eight-second rain, seven semantic interaction cues and project-original provenance. No recording, sample pack, generated song or historical-authenticity claim enters the build.
- Added a lazy Web Audio runtime and eleven-locale mixer. Sound begins only after a player gesture; ambience and effects persist independently; UI state, focus, consequence and failure remain complete when sound is disabled. The initial player bundle remains below the unchanged 100 KiB hard cap.
- Added native Unity parity with deterministic rain `AudioClip` construction, filtered ambience/effects buses, semantic cue synthesis, versioned `PlayerPrefs`, localized immediate-mode mixer UI and production preflight checks. Runtime, editor and EditMode-test assemblies compile offline with warnings treated as errors; licensed import, execution and device listening remain open.
- Expanded repository validation to an exact audio schema/provenance/synchronization gate and 33 automated TypeScript/web tests. The static accessibility contract now covers 22 contrast pairs, 30 microtype floors, 14 target dimensions and 14 forced-colors selectors.
- Expanded the dedicated visible-Chrome run to 177 checks, twenty-six axe states, eighteen target states, eleven locale-font states and three audio audits. Localhost proves first-launch silence, gesture consent, lazy engine loading, independent bus extremes, persistence, semantic preview, focus return and desktop/mobile fit with zero console errors, cross-origin requests/resources or non-cancelled network failures.
- Visually reviewed the 1600×1000 and 390×844 mixer captures. An initial geometry failure was preserved and diagnosed as sampling during the 300 ms entrance transform; the gate now waits for the settled painted state without weakening its viewport assertion.
- The production build passes at 98.41 KiB initial JavaScript, 9.20 KiB initial CSS, 178.95 KiB largest lazy JavaScript, 22.94 MiB complete fonts and 26.76 MiB total deployable output.
- Exact implementation `d248166068140b9ce74147e27f9b50def098cc94` passes three visible-browser repeatability runs and a final exact-boundary run at 177 checks with zero console errors. The close transition gate now waits for the complete drawer/focus/cue state and preserves stable machine-report labels.
- Passed clean-checkout GitHub validation and Pages deployment at evidence boundary `e83be73fd85bdab75552b18e4be73f05ff38341d`, then repeated all 177 checks on the public build with twenty-six axe, eighteen target, eleven locale-font and three audio audits, zero console errors, zero remote HTTP(S) requests/resources and zero non-cancelled failures.

Next gate: complete human listening/mono/loudness/device/sensory-load review alongside the existing Unity-license, assistive-technology, physical-controller and observed-player gates. Chapter II remains gated.

## 2026-08-09 · Actual Chrome 400% page-zoom checkpoint

- Added a browser-level zoom gate to the dedicated visible desktop. It brings the real Chrome window forward and sends `Ctrl+0`/`Ctrl++` through `xdotool`, rather than substituting a device-metric override for browser zoom.
- Proved a measured DPR 1/1600 CSS pixel baseline, eight Chrome increments to DPR 4/400×228 CSS pixels, and a return to the exact baseline in a guarded `finally` path. A failing assertion cannot leave the QA profile magnified.
- Added actual-zoom geometry, axe and target checks for the gameplay header/wartable/story/decisions and title promise/action/footer. Four reviewed full-resolution frames cover gameplay overview, selected decision, title overview and the primary title action.
- Exact implementation `99c7e8a23df39bc91e7d55afcbd6fa4f1dcd6e03` passes 158 checks, twenty-three axe states, fifteen target states and eleven locale-font states with zero horizontal overflow, console errors, remote requests/resources or non-cancelled failures.
- The 320 CSS pixel equivalent-reflow and forced-colors contracts remain intact. This closes an agent-observed actual-Chrome engineering gate, not the human zoom/magnifier, Windows High Contrast or disabled-player review gates.
- Passed clean-checkout GitHub validation and Pages deployment at evidence boundary `7e4bd05777bbc0bdbf32198add872cdc89d387b9`, then repeated all 158 checks on the public build with twenty-three axe, eleven locale-font and fifteen target audits, zero console errors, zero remote HTTP(S) requests/resources and zero non-cancelled network failures.

Next gate: continue human screen-reader/zoom/high-contrast, physical-controller, Unity-license and observed first-time-player sessions. Chapter II remains gated.

## 2026-08-09 · 400%-equivalent reflow and forced-colors checkpoint

- Added a deterministic 320×800 layout gate, corresponding to a 1280 CSS pixel viewport at 400% for WCAG reflow testing. Visible review caught a clipped language selector and Kuaiji marker; the ultra-narrow header and map labels were corrected before acceptance.
- Added a deliberate forced-colors rendering contract: decorative Three.js/art/texture layers disappear, operating-system colors replace the art palette, meters keep bordered structure, and danger, selection, disabled actions and known/reported/reference/active wartable sites retain non-color shape cues.
- Expanded the static contract to require twelve forced-colors selectors and the `Canvas`, `CanvasText`, `Highlight`, `HighlightText` and `GrayText` system colors. The first dynamic run rejected descendant colors that overrode the system palette; the correction now passes axe rather than suppressing the violation.
- Hardened the visible harness against leaked diagnostic viewports by restoring an explicit 1600×1000 desktop metric. Exact implementation `73792273c6cc2bb2f55378591af2147908a9d4fd` passes 147 checks, twenty-one axe states, thirteen target states and eleven locale-font states with zero console errors, remote requests/resources or non-cancelled failures.
- Visually approved the title/gameplay 320px and forced-colors overview/decision frames. The full production build remains within budget at 96.68 KiB initial JavaScript, 8.83 KiB initial CSS, 178.95 KiB largest lazy JavaScript, 22.94 MiB complete font coverage and 26.75 MiB deployed output.
- Re-audited Unity Hub and corrected the documented VNC/noVNC pair to `5934`/`6134` for display `:123`. The refreshed compatibility preflight still stops before import with no account token, entitlement or valid license; the pinned project remains untouched and the native gates remain red.
- Passed clean-checkout GitHub validation and Pages deployment at evidence boundary `267f96d78fdfaf1b39b515f09bd3a1fbe0a6fd30`, then repeated all 147 checks on the public build with twenty-one axe, eleven locale-font and thirteen target audits, zero console errors, zero remote HTTP(S) requests/resources and zero non-cancelled network failures.

Next gate: continue human screen-reader, actual browser-zoom/high-contrast, physical-controller, Unity-license and observed first-time-player sessions. Chapter II remains gated.

## 2026-08-09 · Self-hosted multilingual typography and web-boundary checkpoint

- Removed the runtime Google Fonts dependency. Eight exact Fontsource variable packages are pinned at `5.3.0`, registered with their OFL-1.1 rights and served from the SHI origin; the CSP permits no remote font, script or connection origin.
- Kept Inter/Cormorant as the small baseline and moved Arabic, Japanese, Korean, Simplified Chinese, Traditional Chinese and the Chinese seal/serif layer behind locale-aware imports. The app waits for real script samples and exposes a hard loading/ready/error contract.
- Added unit and repository validation for all eleven locale routes, required package/version/license metadata, notice coverage, forbidden Google/CDN URLs and CSP directives. The complete suite is now 29 tests.
- Added deterministic built-artifact budgets: 96.67 KiB initial JavaScript, 8.38 KiB initial CSS, 178.95 KiB largest lazy JavaScript, 43.14 KiB largest locale CSS, 22.94 MiB/565 files of complete font coverage and a 26.74 MiB deployable site all pass their hard limits. Public builds omit source maps; internal hidden maps remain opt-in.
- Expanded visible noVNC QA to 132 checks and eighteen axe states. All eleven locale captures prove the required face, direction, localized control labels, complete painted header geometry and zero horizontal overflow. Cache-disabled traversal records zero remote HTTP(S) requests/resources, zero non-cancelled failures and zero console errors.
- Rejected an initially cropped French evidence frame even though the coarse box check passed. The harness now settles two painted frames and validates each header child before capture. Exact localhost evidence is pinned to implementation `320fbde42eaf239cf6d0ed38b311b649549410cd`.
- Passed clean-checkout GitHub validation and Pages deployment at `44bc2e4908a61e58889c180cc7e2b7bc4191019b`, then repeated all 132 checks on the public build with eighteen axe, eleven locale-font and ten target audits, zero console errors, zero remote HTTP(S) requests/resources and zero non-cancelled network failures.

Next gate: continue the licensed Unity, human screen-reader, physical-controller, forced-colors/400% and observed first-time-player gates. Chapter II remains gated.

## 2026-08-09 · Accessibility and presentation-resilience checkpoint

- Made modal behavior an enforced game-state boundary: drawers now make the game stage inert, trap forward/reverse focus, restore a connected invoker and fall back from controller/body activation to the current narrative.
- Made the three-stage consequence a real input lock. The choice region is inert and the shared action guard rejects pointer, keyboard or controller re-entry until the consequence closes.
- Added axe-core 4.12.1 as a development-only dependency, representative jsdom semantic scans and eight visible-Chrome WCAG 2.0/2.1/2.2 A/AA audits. No automatic violations remain; layered contrast is explicitly retained as a manual/static-review boundary.
- Added a reproducible static accessibility contract covering 16 conservative contrast pairs, 24 microtype floors and 11 authored dimensions, integrated into `npm run validate` and CI.
- Raised low-contrast tactical copy, removed opacity-based status contrast loss, increased small control targets and corrected title/game seal frames so 200% text scales without overlap. The default art direction and information hierarchy were preserved.
- Expanded visible noVNC QA to 94 checks with zero console errors: ten live target audits, title and active gameplay at 200% text, 390×844 mobile/guide/wartable, Arabic RTL, OS reduced motion, focus wrapping/restoration and duplicate-choice rejection. Exact local evidence is pinned to gameplay implementation `303f6d4687b5d08147d0ced7218635dc1928f854` and stable navigation harness `c19ca9e0e8552982a6add6b8df6fdd4b3969fc9c`.
- Passed clean-checkout GitHub validation and Pages deployment, then repeated all 94 checks on the public build with zero console errors at deployed evidence boundary `3ae2371e0ccf5eebb2c7da7e14cc3ba7cea3001d`. The first remote run exposed and rejected a stale-document reload race; document-identity waits fixed the harness without weakening a gameplay assertion.
- Kept the player bundle inside the 100 KiB initial budget at 99.74 KiB gzip; axe remains outside production output. Added the comprehensive automated/manual boundary in `docs/production/ACCESSIBILITY.md`.

Next gate: continue the licensed Unity, human screen-reader, physical-controller, forced-colors/400% and observed first-time-player gates. Chapter II remains gated.

## 2026-08-09 · Wartable intelligence interaction checkpoint

- Replaced the decorative site layer with an authored intelligence model shared by web and Unity: `known`, `reported` and `reference` sites now carry bounded summaries, explicit uncertainty, schematic coordinates, source records and claim records.
- Preserved Chapter I's information horizon. Pei and Kuaiji explicitly reject retroactive knowledge of Liu Bang's or Xiang Yu's later victory; Xianyang remains orientation only; no route, distance, scale or historical-GIS precision is asserted.
- Added pointer, keyboard and standard-gamepad inspection to the web wartable, including site cycling, selected-state semantics, filtered evidence, evidence-to-map return and zero campaign-state mutation. Desktop and 390×844 layouts were visually reviewed.
- Added the equivalent Unity baseline: status-specific 3D marker materials, camera raycasting, inspected-marker feedback, keyboard/controller cycling, localized uncertainty panel and filtered source/claim drawer. Runtime, editor and EditMode-test sources compile offline with warnings as errors; licensed Editor execution remains open.
- Expanded schema, JavaScript validation, Unity preflight and tests to reject invalid statuses, out-of-bounds schematic coordinates, missing site text, unknown references and claims whose required source is not exposed on the site.
- Kept startup performance inside budget by loading the map and detail inspector on demand. The production build measures 99.38 KiB gzip initial JavaScript, 2.36 KiB map, 0.59 KiB inspector, 7.44 KiB evidence UI and 184.72 KiB Three.js.
- Expanded dedicated visible-browser QA to 68 checks with zero console errors, including known/reported/reference rendering, controller navigation, no-state-mutation, hindsight-boundary copy, site-filtered evidence and mobile panel containment. Local evidence is pinned to implementation `f99143d`; clean-checkout validation, Pages deployment and the public replay pass at evidence boundary `48e2df9`.

Next gate: complete licensed Unity import/execution and observed physical-controller/player sessions, then obtain Qin-law and historical-GIS specialist decisions. Chapter II remains gated.

## 2026-08-09 · Historical production cell checkpoint

- Upgraded the canonical campaign to schema v3 with a five-edition rights-aware register, seven source records and thirteen stable claim records. Every claim carries a precise locator, evidence/review state, bounded confidence, uncertainty, gameplay use and pending/completed review role.
- Located and compared the Chapter I narrative in public *Shiji* 48/7/8, *Hanshu* 31 and *Zizhi Tongjian* 7 pages, and isolated *Sunzi* 1 as a strategic design lens rather than episode evidence. Local discovery-mirror hashes are documented without publishing private books or copied source prose.
- Bound every claim to at least one playable scene and every active claim to its required sources. Validators reject unknown editions, rights mismatches, non-HTTPS public links, orphan claims, missing claim sources, and historical claims disguised as authored reconstruction.
- Kept the Qin delayed-duty penalty and Daze geography/map implications visibly marked `specialist-review-required`; no historical claim is represented as specialist-approved.
- Added multilingual evidence labels, exact locators, public-edition links, uncertainty cards and authored-reconstruction boundaries to the web and Unity source ledgers. Unity runtime/editor/EditMode-test assemblies pass the offline reference compile; licensed import/execution/build gates remain open.
- Split the browser transport losslessly so the evidence payload loads on demand. Repository validation reconstructs the canonical object from both slices; the initial JavaScript remains within budget at 98.53 KiB gzip.
- Expanded dedicated visible-browser QA to 56 checks. Localhost passes implementation commit `1e89bec` with zero console errors; clean-checkout validation and Pages deployment pass; and the public build passes the same gate with zero console errors at evidence boundary `c709726`. The source/claim screenshots were visually inspected at full resolution.

Next gate: obtain Qin-law and historical-GIS specialist decisions while the physical-controller, observed-player and Unity-license gates remain open. Chapter II still does not expand before the player-evidence gates.

## 2026-08-09 · Seeded uncertainty checkpoint

- Added the reviewed authored-field contract: a recorded uint32 chronicle seed selects one weighted condition using identical FNV-1a logic in TypeScript and C#, while the complete signal and exact effects are disclosed before commitment.
- Classified every field condition as dramatic reconstruction in the payload, schema, validator, both clients and native preflight. Conditions cannot change routes, flags or requirements and Chapter I effects are capped at ±6.
- Authored twelve English/Simplified-Chinese rain, road, supply, rumor and observation conditions across all six scenes. Resolution and the decision ledger now preserve player move → pressure response → field condition as three distinct stages.
- Upgraded browser and Unity persistence to save format 3. New chronicle, same-seed restart, hexadecimal URL sharing, v1/v2 replay under legacy seed zero, v3 seed/condition tamper rejection, and unknown-version rejection are implemented in both engines. Runtime, editor and EditMode-test sources pass offline type compilation; official test execution remains license-gated.
- Expanded shared core coverage to 11 tests while retaining 12 web integration tests. Content validation explores every condition at every reachable decision: 722 successful routes and 54 capture/scattering routes, with no deadlock and all three conclusions retained.
- Expanded dedicated visible-browser QA from 43 to 50 checks. Localhost and the public Pages build pass at `?seed=5EED2026` with zero console errors; desktop, Arabic RTL, 390×844 mobile, response and record captures were visually reviewed. GitHub validation and Pages deployment are green for implementation commit `f17b923` and its exact-local evidence boundary.

Next gate: conduct physical-controller and first-time-player sessions while resolving the Unity account license gate; Chapter II content does not expand before those player-evidence gates.

## 2026-08-09 · Input and first-minute checkpoint

- Added a one-time but permanently replayable field guide that teaches field → move → answer over the live opening position without changing resources, decision history or save format.
- Localized the complete guide and controller feedback across all eleven UI languages; reviewed English desktop and 390×844 mobile captures preserve the restrained wartable hierarchy.
- Added a pure standard-gamepad command adapter, held-axis dead-zone gating, disconnect/reconnect polling, visible enabled-choice selection, controller-aware scrolling, title/ending confirm, face-button close, shoulder ledgers and Start/Menu guide access.
- Carried equivalent choice selection, commit/close, guide, source and decision-record controls into Unity with a committed input-axis map. Runtime/editor source assemblies pass the offline Unity reference compile; official import and execution remain license-gated.
- Expanded web coverage to 12 tests and visible noVNC QA to 43 checks with zero console errors. The first 90 ms synthetic-button cadence was rejected after visible evidence showed a missed release edge; a final busy-frame rerun also rejected 250 ms and added an explicit close assertion. The synthetic harness now holds and releases each edge for 500 ms.
- Preserved the distinction between synthetic Gamepad API validation and physical hardware certification. Xbox/PlayStation-layout reconnect and focus-loss sessions remain open alongside external player observation.
- Published implementation commit `8f31ee8`; both GitHub validation and Pages deployment passed, then the dedicated visible browser repeated all 43 checks on the public build with zero console errors.

Next gate at that checkpoint: conduct physical-controller and first-time-player sessions while progressing the reviewed seeded-uncertainty contract and Unity license activation.

## 2026-08-09 · Systems proof checkpoint

- Added a shared deterministic pressure-response contract: every nonterminal choice exposes a qualitative warning, then applies and records an authored state, terrain, supply or network countermove after the player's immediate effects.
- Authored and reviewed twelve English/Simplified-Chinese responses as dramatic reconstruction; no new historical claims were introduced.
- Upgraded saves to format 2. Both TypeScript and Unity rebuild state from authoritative decision history, migrate version-1 histories, and reject impossible sequences instead of trusting stored resource totals.
- Expanded content validation to cover pressure kinds/text/effects, exact resource keys and bounds, global choice IDs, requirements, deadlocks, every playable route, all three endings, and real failure reachability. Current balance: 51 successful routes and 1 capture route.
- Added full keyboard operation (`Shift+1–3`, `Alt+S`, `Alt+R`, `Escape`), accessible modal semantics, focus movement, stable test selectors, and five web-shell integration tests across keyboard, drawers, pressure reveal and save migration.
- Carried pressure resolution, failure state, save replay, validation, tests and twenty native UI strings across all eleven locales into the Unity project. Runtime and editor source assemblies pass an offline Roslyn type compile against the installed Unity assemblies; project import, official Editor compilation, EditMode execution and player builds remain account-license gated.
- Standardized pressure-caused failure on the decision scene in both engines, preventing a captured/scattered run from revealing its unearned next scene.
- Reworked response/ledger visuals and reviewed desktop English, Arabic RTL, and 390×844 mobile captures. The first `Alt+1` design was rejected after Chrome consumed it; the first mobile two-card layout was rejected after screenshot review.
- Visible localhost and public GitHub Pages noVNC QA pass 31 checks with zero console errors, including pressure warnings/reveal/deltas, save-v2 persistence, keyboard paths, record retention, and scrolled mobile-card readability. Public gameplay commit: `ecdc9fe`.

Next gate at that checkpoint: activate Unity licensing and pass native import, official C# compilation, EditMode tests, Linux/Web builds and observed player sessions; in parallel, start the reviewed seeded-uncertainty and gamepad-accessibility design gates before Chapter II expansion.

## 2026-08-08 · Foundation checkpoint

- Preserved the complete private memo and mixed archives under ignored `references/private/`.
- Created the durable production goal and one-year gate roadmap.
- Initialized Git with explicit private/generated boundaries.
- Selected Unity 6 LTS alongside the first-class web client; installed Unity CLI and official Hub, with editor mirror/auth blocker documented.
- Authored shared Chapter I JSON: six scenes, fifteen choices, five strategic resources, recovery turn, three conclusions and six source records.
- Added deterministic TypeScript rules, requirements, failure thresholds, save/resume, tests and schema/content validation.
- Built the React/Three.js web client with eleven UI languages, Arabic RTL, responsive mobile layout, source and decision ledgers, and reduced motion.
- Generated and reviewed the Daze key art; rejected/corrected a glass-lantern anachronism.
- Used AgenticApp + Blender for a wartable source spec, rejected the first render, approved revision 2 as a blockout, exported GLB/FBX, and verified a 19-mesh GLB round trip.
- Created a real pinned Unity project that consumes the same campaign payload; editor compile/build remains unverified.
- Completed visible noVNC Chrome QA: 21 checks, zero page console errors; screenshots recorded.
- Published the clean repository and playable GitHub Pages build, then repeated the visible QA suite against the public URL.
- Opened Unity Hub in a dedicated localhost-only noVNC desktop and installed/registered Unity `2022.3.62f3c1` with Linux, Web and offline documentation support after verifying the reconstructed official archive byte-for-byte and with `xz -t`.
- Added Unity batch preflight/build commands, real-campaign EditMode coverage, exhaustive ending traversal, eleven-locale native UI controls, Arabic alignment, and native compile/memory fixes.
- Confirmed the editor executable launches; import stops before compilation at Unity's account-owned license boundary. A private offline activation request is prepared and no license identifier is committed.

Next gate: sign in to Unity Hub and obtain/activate an eligible license, install the exact pinned Unity 6 build when its regional object is available, pass C# import/EditMode tests/Linux and Web builds, and run observed player sessions before expanding Chapter II.
