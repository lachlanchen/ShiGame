# SHI progress log

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

Next gate: activate Unity licensing and pass native import, official C# compilation, EditMode tests, Linux/Web builds and observed player sessions; in parallel, start the reviewed seeded-uncertainty and gamepad-accessibility design gates before Chapter II expansion.

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
