# SHI — workable production goal

Optimized from the full owner conversation on 2026-10-03. Canonical design: [Game design](../design/GAME_DESIGN_DOCUMENT.md). Technical adoption plan: [Unified workflow](../technical/UNIFIED_GAME_WORKFLOW.md). This current brief supersedes older priorities in the dated checkpoint history below; it does not discard completed work.

## The goal in one sentence

**Deliver a beautiful, understandable and replayable Jinyang chapter that the owner can actually explore and play on iPhone/iPad and Android (Google Play): choose whom to trust and where to commit scarce people and supplies, see those orders performed in a continuous audiovisual world, and carry the resulting power, losses and obligations into the next chapter.** A standalone macOS release is optional later; Macs remain the iOS development and testing infrastructure.

## What the complete conversation asks us to preserve

1. **History supplies the conflict, not a script the player must obey.** Read the actual local Tongjian original and supplied translation; use Shiji, Zuozhuan, Hanshu and Hou Hanshu for the relevant period. Show competing interests, institutions, information, timing and consequences. Keep sources, commentary and authored counterfactuals distinct. Do not replace the supplied translations with shallow invented dialogue.
2. **A real game, not a reading application.** The player explores, assigns, negotiates, prepares and acts. Moving people, changing routes and formations, sound and legible spatial feedback carry the normal experience. Optional journals explain history and game theory. A cinematic must lead into or pay off a decision, not hide a missing mechanic.
3. **One continuous, consistent world.** Original cast chosen by the developer; stable faces, bodies, clothes, props and relationships across Blender animation, engine scenes, images and film. Use reviewed Musia music and useful LocalVideoGen/MiniMax clips in the running game, not merely in an asset folder. Start video at the fastest suitable low-resolution reference-locked preview; approve continuity before final rendering. Keep music alternatives. No need for the owner's likeness.
4. **Meaningful progression, volume by volume.** Finish Jinyang, then settlement and household/succession within volume I. Maintain land/control claims, wealth, office, diplomatic contacts and obligations. Later adult spouses/concubines are named people with political and succession consequences, not anonymous victory rewards. The 403 BCE–959 CE master arc guides later volumes; it is not a reason to leave the first one unfinished.
5. **Native, playable delivery.** iOS/iPadOS and Google Play are the first release targets. iOS remains native; qualify real 3D Android as well. A standalone macOS game is optional follow-on scope, not a mobile acceptance gate. Share versioned narrative/rules and replay conformance, not separate rewritten stories. Preserve existing Qin/web/mobile releases and saves. Several hundred megabytes is acceptable for coherent content; file size is not a quality target.
6. **Patient quality with visible advancement.** Reuse the installed Unreal/Blender framework, Musia, LocalVideoGen and suitable image generation/OpenSCAD. Use targeted official/GitHub/Hugging Face research to solve a concrete bottleneck. Do not repeatedly redesign, research the same stack, polish a single prop, or promise a model/tool was used without evidence.
7. **Regular trustworthy handoffs.** Publish scoped tested source checkpoints and prepare meaningful native beta upgrades. With explicit visible submission authorization, upload qualified TestFlight and Google internal builds and verify their processed availability. Retain US$0.99/all-eligible-markets direction; testing is not public rollout. Protect the owner's normal desktop and coordinate shared Mac mini/7050/3040/KVM, iPad and Mi 10 Pro resources.

## Current truth and next outcome — 2026-10-03

- Published source checkpoint: `c05d65f`. An explorable Linux Unreal Jinyang world and approximately five-minute automated decision/operation route exist. The art and animation remain developmental; this is not a finished cinematic chapter.
- Existing native Qin iPhone/iPad compatibility tests passed on the Mac mini. They are **not** a Jinyang mobile beta. Jinyang touch controls, native mobile delivery, final cast, accepted Musia score and integrated film remain open. Standalone macOS delivery is optional later.
- **Next player-visible outcome:** at the defense position, inspect competing wall, diversion and escape work, understand their time/supply trade-offs, dispatch people and see the changed preparation carried into the existing liaison and operation. Implement and test the complete interaction, rather than another disconnected asset.
- Qualify native/touch delivery during this opening encounter: reuse the selected framework, identify required platform/toolchain gaps and run the same decision/resume path on the next available native target. Do not wait for all desktop art to be final, and do not substitute another unchanged Qin compatibility run.
- The Codex controller was read back as **active**, not complete. Dated blocked-status notes below describe earlier controller states.

## Objective

Deliver a genuinely playable, cinematic historical strategy chapter for SHI（《势》）that proves a reusable framework for the full 《资治通鉴》 arc, 403 BCE–959 CE. Use the owner's 《资治通鉴》《史记》《左传》《汉书》《后汉书》 and their supplied translations as the historical foundation. Make power relationships, decisions, counterplay and consequences visible through people, maps, animation, music and short films—not pages of choices.

**Finish Jinyang as one complete 15–20 minute chapter before expanding production to another era.** The siege is an explicitly marked earlier flashback in Tongjian volume 1, not an event dated 403 BCE. Preserve useful Qin work for campaign II and all current releases/saves. Redesign does not authorize deleting or rewriting the repository from scratch.

The whole-history map guides selection and continuity; it is not an unbounded requirement to simulate thirteen centuries before shipping anything.

Owner steering, 2026-10-02: develop complete volumes one by one. The player's continuing record includes land/control rights, gold/wealth, offices and position, diplomacy/liaison networks and adult spouse/concubine household relationships. Volume I connects Jinyang to settlement and household/succession. The current first-chapter gate includes an initial estate/career record; settlement and household chapters complete the volume before a new volume begins production.

Owner steering, 2026-10-03, latest priority: enter and explore a carefully made 3D world. **First focus on iOS/iPadOS and Google Play; macOS is a possible later release.** Animation, sound, music and selected video remain essential—not a text-led substitute. Several hundred megabytes is acceptable when it serves coherent quality. Reuse the Mac mini and existing Mac simulator/device lanes for mobile development and testing through pinned LazyTunnel routes, sequentially and without taking over the owner's physical desktop. Isolated noVNC is the local review surface.

## Acceptance gates

These describe acceptance, not a waterfall that postpones mobile work. G1 is the current content priority; native/touch feasibility and build qualification start alongside it. G2 media is integrated scene by scene. G3 findings feed back into both. Only passed gates count toward completion.

| Gate | Deliverable | Evidence needed to pass |
| --- | --- | --- |
| G0 — whole game and chapter design | Era map, player role, source-linked conflict, three linked decision phases, alternate endings and one production framework | Read actual source/translation units; distinguish history, commentary and reconstruction; design covers entry through ending |
| G1 — end-to-end playable chapter | One Unreal location with controllable/commandable moving figures, readable map relationships, independent responses, provisional audio, all three ending families and an initial estate/career record | A recorded complete playthrough and replay with materially different consequences; shared rules tests; persistent earned claims/resources/contacts; no unimplemented Continue button |
| G2 — cinematic quality | Consistent cast, reviewed animation/contact, Musia thematic score, local MiniMax/LocalVideoGen shots where useful, blended cameras and audio | Review actual in-game motion and sound; identity/continuity checks; skip, missing-video and reduced-motion paths preserve outcomes |
| G3 — understanding, agency and performance | Revised onboarding, meaningful alternate plans, recovery, persistence and mobile controls | Three independent first-time playtests; at least two finish without external explanation; fix observed blockers; measured tests on iPad and Mi 10 Pro; platform-specific profiling |
| G4 — verified beta delivery | Reproducible native iPhone/iPad and Android test builds, web preview, scoped Git commits and release notes tied to the same content version; macOS is optional later | Installed-device launch/resume evidence; TestFlight and Google internal-track receipts when submission is explicitly authorized; no critical known defects; no separate Mac-release prerequisite |
| G5 — checkpoint closure | Owner can play the upgraded chapter, review its new audiovisual content and compare alternate routes | Confirm delivered build identifiers and remaining issues; nominate the next whole chapter from campaign I rather than restart this design |

Passing automated tests alone never passes G1–G5. Design documents, source indexes, asset generation, a beautiful screenshot, video without interaction, or an upload without an installed playable build are not substitutes.

## Definition of playable and cinematic

- The player understands their role and immediate objective within 30 seconds, and makes a meaningful assignment within 60 seconds in the tested onboarding.
- The normal scene is understandable with the journal closed. Text supports action; it does not constitute the action.
- At least two plans can succeed across disclosed conditions; success has costs. A recoverable setback and an intelligible failure ending exist.
- Earlier commitments alter later cooperation, available actions or outcomes. Opponents have their own interests; historical conformity is not the scoring rule.
- Characters move and interact with supported feet, credible weight and correct hand/prop contact. A 60-second minimized-interface recording shows consequential action, not static portraits and rain.
- Music, effects and optional voice are audible after the player's sound choice; transitions do not restart a track on every input. Muting sound does not remove essential information.
- Pause, skip, interruption, missing media, offline launch and save/resume preserve committed decisions exactly once.
- Record frame times, memory and thermal behavior on target devices. Initial sustained target is 30 fps on supported mobile hardware and 60 fps on the desktop reference, measured after warm-up, not inferred from an offline render.
- Preserve native iOS, Android and web compatibility while qualifying Unreal's mobile delivery. Shared content and replay fixtures keep narrative outcomes aligned; no parallel rewritten story.

## Daily working rule

At the start of a work session read the latest checkpoint and select **one player-visible outcome** needed for the next gate. Work on the entire decision-to-consequence sequence. End with the artifact/build, test evidence, what changed for the player, the unmet gate and the exact next action.

Use the loop **source-backed conflict → playable decision → performed response → lasting consequence → observed playtest → qualified build**. Keep one current chapter and one next encounter. If the selected outcome cannot be completed in the session, preserve the implementation and state the specific missing part; do not rename it a finished feature.

At every meaningful checkpoint, record a compact delivery receipt: source commit, campaign/schema version, exact artifact and platform, new player-visible behavior, observed route and alternative, save/skip/interruption checks, audiovisual review status and remaining blockers. Push scoped validated changes when ready; prepare beta candidates at whole-encounter/chapter boundaries. Do not repeatedly upload unchanged builds or count website deployment of the old chapter as delivery of the new one.

Completion requires the owner's first enjoyable, coherent chapter, not completion of every possible tool experiment. Duration is a human-play target, not permission to pad with walking, text or unskippable footage. Independent first-time playtests must inform whether the chapter is understandable and worth replaying.

Spend at most two isolated polish passes on one asset before reintegrating and testing the complete scene. If a model or tool fails, record the concrete failure once, use a temporary engine-native presentation, and continue the sequence. Return for final media at G2. Do not research the same stack or rebuild scaffolding every session.

One active chapter and one heavy SHI job at a time. Check workstation memory/process ownership before builds or generation. Use the available Mac/iPad/Android machines according to their shared handoffs when the relevant gate needs them, not all machines simultaneously for activity's sake.

## Tool responsibilities and authority

Codex/Astra assists design, implementation, spatial reasoning and visual review. Blender produces editable assets and animation; OpenSCAD is optional for appropriate repeated geometric props. Unreal runs the interactive scenes. Musia produces music. LocalVideoGen with the installed MiniMax route produces selected reference-locked shots; start with fast low-resolution previews before final renders. Do not claim model use, listening review or integration without evidence.

The developer chooses original consistent character casting, music candidates and routine shot decisions within this brief. Keep alternate Musia candidates. Company licensing coordination is not a recurring design task; retain lightweight provenance. Preserve private books and user work. Paid generation, store submissions and public release require explicit visible confirmation. Retain US$0.99/all-eligible-markets direction.

## Completion boundary

This goal is complete only when G0–G5 are evidenced for the first chapter. It does **not** claim completion of the entire historical series. Set the next bounded chapter goal after this one, carrying the master design and validated pipeline forward.

The Codex goal controller's status must be reported honestly. Editing the objective file does not itself resume a paused controller.

## Current implementation follow-through — 2026-10-03

The goal optimization also starts the selected encounter, not a new design restart. Development source now lets a player inspect the wall/storehouse, compare the existing three preparation jobs, explicitly dispatch one and stay in the walking world while its people move. Forecasts run the actual versioned rules; previews spend nothing. The common presentation tick, world pause, movement skip and sole atomic order-write path are wired together. Existing command mode, rule fingerprints and v1/v2 saves are preserved.

**Qualification: source checkpoint only.** All 123 shared-core tests pass, including ten new preview/cost/immutability/deadline/resume checks; TypeScript checking and both replay fixtures (52 + 109 states) pass. Native preview assertions were added but have not run in a newly compiled Unreal binary. The workstation remained above its swap admission limit, with no obsolete SHI runtime to clean. No new build, visual acceptance, music/video integration, mobile beta or finite crew-allocation system is claimed. The existing verified package remains unchanged.

The immediate next action is to compile this source in an admitted resource lane, run native replay/preview tests, then play wall → preview/cancel → dispatch → walk alongside → pause/resume/skip → cold restore → diplomacy/operation. Check an alternative exit route, failed-save feedback and the small-window scroll layout. This step must become observed gameplay before expanding its crew allocation or cinematic performance. Native/touch qualification proceeds alongside, not as another unchanged Qin compatibility run.

## Native qualification follow-through — 2026-10-03

The previously source-only defense and touch work now compiles in Unreal 5.8.1. Four native Jinyang suites pass, including 52 + 109 replay checkpoints and forecast assertions; a new Linux development package was built successfully. [Build receipt and remaining review](JINYANG_DEFENSE_BUILD_20261003.md). The post-build swap gate prevents a new GUI launch at this checkpoint, so actual-input/visual qualification remains the next action. Mac mini console/login setup works and official engine installation has started, but its DNS/download and compatible Apple toolchain qualification are not complete. No mobile beta or finished chapter is claimed.

## Initial checkpoint — 2026-10-02

G0 design is written. Local Tongjian main text and supplied modern Chinese translation for the Jinyang coordination passage have been read and pinned privately. The whole-history campaign map and source separation are established. Remaining G0 work: reconcile parallel source wording/date and complete the chapter's cast/geography packet; other periods are roadmap, not fully researched scripts.

G1 is the next delivery target. No new Jinyang build, finished animation, final music review or store upload is claimed by this design checkpoint.

G1 technical work started: the isolated Jinyang coordination experiment now distinguishes shared interest, received commitments, disclosure risk, readiness and synchronized execution, with bounded withdrawal and deadline handling. Its 10 tests and the full 93-test shared-core suite pass; TypeScript checking passes. It is not exported into the released campaign and is not an interactive scene. Next: finish the cast/geography source packet and implement the full Unreal decision-to-ending blockout with moving figures and provisional audio.

## Volume-design checkpoint — 2026-10-02

G0 now has a source/cast/geography baseline for the opening: local Tongjian and Shiji originals, supplied translation units, chronology framing, named actor interests, complete action-to-ending design and a reviewed visual concept. See docs/design/JINYANG_CHAPTER_DESIGN.md. Chapter 2 and 3 remain design scope with their own source/branch packets required.

The owner confirmed sequential complete volumes with diplomacy/liaison and land, wealth, position and adult spouse/concubine progression. These requirements are recorded in the master design, volume specification and production skill. G1 remains open: implement the complete moving, audible Unreal encounter, bind actual actions and received messages to the rules, and save the initial estate record with all three endings.

Publication checkpoint validation: `npm run validate` passed in an isolated checkout based on the current remote main: 95 shared-core tests, including 10 Jinyang experiment tests, and 416 web tests, plus native-content, source, replay-conformance, audio, accessibility, font and repository checks. All 11 profile READMEs passed. These checks qualify this design/code checkpoint; they do not establish Jinyang runtime, animation, listening or device acceptance. No new store build or upload accompanies it.

## Performed-order Unreal checkpoint — 2026-10-02

Jinyang now has an interactive Unreal motion blockout, 13 actual orders, independent Han/Wei coordination, three observed ending families and a replay-derived estate/career record. The repaired scene repeated the quiet win and cold-restored its seven orders without recharging reserves. Full validation passed: 105 core / 416 web tests; native parity passed 7 routes / 52 complete-state checkpoints. See [development review](JINYANG_BLOCKOUT_20261002.md) for artifacts, observed routes, exact limitations and reproduction.

**G1 remained open at this checkpoint.** External provisional audio captures were silent, there was no accepted uninterrupted 15–20-minute recording, movement/skip/contact and navigation needed repair, and no new Jinyang mobile beta had been delivered. The next task was the complete interaction/presentation sequence with fixed navigation and verified sound, then normal-paced winning and materially different routes; the successor below records that work and its remaining limits. Do not expand eras or restart G0. Land/office settlement and adult household chapters follow this opening; current victory earns claims/obligations, not granted land or partners.


## Diplomacy interaction checkpoint — 2026-10-02

The Unreal blockout now performs independent camp-receiving beats and date signals, with stable command keys, fixed navigation and shared motion endpoints. Two real-input, unskipped routes were recorded: coordination with early-date recovery (255.67 seconds, reserves19/force100/claim/two obligations) and withdrawal (45.41 seconds, reserves36/remnant60/displaced office). Cold withdrawal restore preserves identical save bytes. Native motion and intermediate-response tests pass with 52-state parity. Own-game mixer output is nonzero; physical listening/device audibility remain unqualified. See [interaction review](https://github.com/lachlanchen/ShiGame/blob/main/docs/production/JINYANG_BLOCKOUT_20261002.md).

**G1 remains open: the blockout is approximately four minutes, not a finished 15–20-minute chapter.** Next implement the designed interactive operation with limited force orders, an opposing response and recoverable disruption, honoring the existing commitments and earned estate. Do not pad duration, repeat navigation-only reviews, start another era, or count procedural sound as a finished Musia score. Final cast/film/music, novice/device tests and new beta delivery remain open. The controller is active and incomplete.

## Interactive operation checkpoint — 2026-10-02

Revision 2 now carries the prepared alliance into a playable operation: screen or rush the breach, meet an exposure-driven guard response, recover with the reserve, hold for allied flanks or advance, then retain the resulting estate. An actual uninterrupted recovery route finished in 292.07 seconds with force 56 / reserves 18 and two obligations. An eight-order disruption survived pause/cold restart byte-for-byte; attacking its intact front then produced defeat. A separate 45.27-second withdrawal preserved force 60 / reserves 36. Native rules matched 109 new and 52 legacy states; full validation passed 113 core / 416 web tests. Final defeat formation overlap was corrected and the actual saved ending rechecked. See [operation review](https://github.com/lachlanchen/ShiGame/blob/main/docs/production/JINYANG_BLOCKOUT_20261002.md).

**G1 remains open.** The five-minute automated route does not establish the intended 15–20-minute human chapter or finished cinematic quality. Next develop the opening/defense phase into direct work-party assignments with competing jobs, visible routes/consequences and brief source-grounded performance, then play it through the existing liaison and operation. Preserve both save versions; continue within Jinyang. Final cast, contact/animation, Musia/local video, listening, novice/device and beta gates remain incomplete. All review runtimes are closed. The final controller readback reports `blocked`, contrary to the earlier active-status note; this requested work has continued, but automatic goal resumption must not be claimed.

## Explorable-world checkpoint — 2026-10-03

The owner's new spatial request now has an actual packaged Unreal implementation: walkable gate quarter, houses, storehouse, watch stairs and levees; eleven inspectable landmarks; moving residents; first/third-person view; navigation bearings; collision, pause and separate cosmetic save/resume. The existing command scene remains reachable and a real defense order was issued and cold-restored without duplication. Editable original Blender assets and import scripts are retained. See [exploration receipt](JINYANG_EXPLORATION_20261003.md).

The full validation passed 113 core / 416 web tests, with native rules matching 52 legacy + 109 revision-2 states. This expands the playable space; it does not finish G1/G2, final cast/animation, accepted Musia/video, touch controls or mobile/macOS beta delivery. Current art remains visibly developmental. The next whole encounter is the work-party assignment sequence in this world, carried through liaison and operation. The newly checked Mac mini simulator lane supports the native follow-through; unchanged old-client tests must not be presented as a Jinyang mobile build. No goal-controller resumption or completion is claimed.
