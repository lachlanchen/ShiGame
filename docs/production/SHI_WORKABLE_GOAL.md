# SHI — workable production goal

Adopted from the owner's direction on 2026-10-02. Canonical design: [Game design](../design/GAME_DESIGN_DOCUMENT.md). Technical adoption plan: [Unified workflow](../technical/UNIFIED_GAME_WORKFLOW.md).

## Objective

Deliver a genuinely playable, cinematic historical strategy chapter for SHI（《势》）that proves a reusable framework for the full 《资治通鉴》 arc, 403 BCE–959 CE. Use the owner's 《资治通鉴》《史记》《左传》《汉书》《后汉书》 and their supplied translations as the historical foundation. Make power relationships, decisions, counterplay and consequences visible through people, maps, animation, music and short films—not pages of choices.

**Finish Jinyang as one complete 15–20 minute chapter before expanding production to another era.** The siege is an explicitly marked earlier flashback in Tongjian volume 1, not an event dated 403 BCE. Preserve useful Qin work for campaign II and all current releases/saves. Redesign does not authorize deleting or rewriting the repository from scratch.

The whole-history map guides selection and continuity; it is not an unbounded requirement to simulate thirteen centuries before shipping anything.

Owner steering, 2026-10-02: develop complete volumes one by one. The player's continuing record includes land/control rights, gold/wealth, offices and position, diplomacy/liaison networks and adult spouse/concubine household relationships. Volume I connects Jinyang to settlement and household/succession. The current first-chapter gate includes an initial estate/career record; settlement and household chapters complete the volume before a new volume begins production.

## Checkpoints, in order

| Gate | Deliverable | Evidence needed to pass |
| --- | --- | --- |
| G0 — whole game and chapter design | Era map, player role, source-linked conflict, three linked decision phases, alternate endings and one production framework | Read actual source/translation units; distinguish history, commentary and reconstruction; design covers entry through ending |
| G1 — end-to-end playable chapter | One Unreal location with controllable/commandable moving figures, readable map relationships, independent responses, provisional audio, all three ending families and an initial estate/career record | A recorded complete playthrough and replay with materially different consequences; shared rules tests; persistent earned claims/resources/contacts; no unimplemented Continue button |
| G2 — cinematic quality | Consistent cast, reviewed animation/contact, Musia thematic score, local MiniMax/LocalVideoGen shots where useful, blended cameras and audio | Review actual in-game motion and sound; identity/continuity checks; skip, missing-video and reduced-motion paths preserve outcomes |
| G3 — understanding, agency and performance | Revised onboarding, meaningful alternate plans, recovery, persistence and mobile controls | Three independent first-time playtests; at least two finish without external explanation; fix observed blockers; measured tests on iPad and Mi 10 Pro; platform-specific profiling |
| G4 — verified beta delivery | Reproducible native iOS and Android test builds, web preview, scoped Git commits and release notes tied to the same content version | Installed-device launch/resume evidence; TestFlight and Google internal-track receipts when submission is explicitly authorized; no critical known defects |
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

Spend at most two isolated polish passes on one asset before reintegrating and testing the complete scene. If a model or tool fails, record the concrete failure once, use a temporary engine-native presentation, and continue the sequence. Return for final media at G2. Do not research the same stack or rebuild scaffolding every session.

One active chapter and one heavy SHI job at a time. Check workstation memory/process ownership before builds or generation. Use the available Mac/iPad/Android machines according to their shared handoffs when the relevant gate needs them, not all machines simultaneously for activity's sake.

## Tool responsibilities and authority

Codex/Astra assists design, implementation, spatial reasoning and visual review. Blender produces editable assets and animation; OpenSCAD is optional for appropriate repeated geometric props. Unreal runs the interactive scenes. Musia produces music. LocalVideoGen with the installed MiniMax route produces selected reference-locked shots; start with fast low-resolution previews before final renders. Do not claim model use, listening review or integration without evidence.

The developer chooses original consistent character casting, music candidates and routine shot decisions within this brief. Keep alternate Musia candidates. Company licensing coordination is not a recurring design task; retain lightweight provenance. Preserve private books and user work. Paid generation, store submissions and public release require explicit visible confirmation. Retain US$0.99/all-eligible-markets direction.

## Completion boundary

This goal is complete only when G0–G5 are evidenced for the first chapter. It does **not** claim completion of the entire historical series. Set the next bounded chapter goal after this one, carrying the master design and validated pipeline forward.

The Codex goal controller's status must be reported honestly. Editing the objective file does not itself resume a paused controller.

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
