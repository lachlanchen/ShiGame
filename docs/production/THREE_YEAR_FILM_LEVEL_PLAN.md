# Film-level production charter

Status: active quality charter · no fixed completion deadline · reviewed 2026-08-10

The earlier “three-year” wording expressed permission to work patiently, day by day; it was never a deadline, release promise or reason to compromise. This charter turns SHI's uncompromised long-term ambition into ordered, testable quality gates. A gate takes as long as its evidence requires, and calendar time alone never advances it. The filename is retained for stable links.

This charter does not declare the current blockout film quality, promise that every desired tool or classical text will ship, or replace the detailed [`ROADMAP.md`](ROADMAP.md). The roadmap is the synchronized near-term gate sequence for this charter's foundation phase; neither document may silently promise a broader release or campaign horizon than the other.

## Product promise

SHI should make the player feel responsible for people, information, supply, terrain, trust and irreversible command—not merely choose dialogue beside a decorative battle. Its historical martial drama begins with late-Qin Daze and grows toward the Chu–Han struggle while preserving room for plausible player divergence. The experience must remain:

- **playable first:** observation, deliberation, order, consequence and recovery form a readable, repeatable loop with materially different strategies;
- **historically accountable:** sourced claims, uncertainty and dramatization are distinguishable, while adaptation serves play without presenting invention as fact;
- **cinematic through performance:** composition, faces, hands, bodies, voice, weather, light and sound express a decision and its cost; spectacle never substitutes for agency;
- **one game across clients:** canonical campaign content and deterministic rules remain shared; Web is the fast playable reference, Unreal is the priority cinematic client, and Unity is a maintained compatibility baseline rather than a separate narrative;
- **inclusive by construction:** input, reading, motion, contrast, audio and localization requirements enter each feature's definition of done;
- **evidence-led:** a build, capture, source review and observed play session carry more weight than an attractive still or a generated demo.

“Film level” is an acceptance state, not a style label. It requires final assets working at normal speed in the playable camera, stable frame pacing, intelligible performance, historical and cultural review, accessibility alternatives, and observed-player evidence. A close-up render or AI candidate cannot close that gate.

The primary work is story, player consequence and film design. Characters, assets, shots, systems and tools exist to make a dramatic decision more legible, embodied and consequential. Open-source projects, online sources and AI services should remove repetitive toil and shorten iteration where they can do so safely; accumulating tools or generating volume is not progress.

## Current boundary

As of 2026-08-11, the Web campaign and packaged Unreal route are genuinely interactive, and shared deterministic rules, source ledgers, localization infrastructure and bounded accessibility checks exist. Unreal passes twenty-one native `SHI.` suites. The accepted council facial v2 package proves five shared-skeleton engineering figures, an exact 21-control silent-intent contract and corrected morph-capable materials; the isolated Chen Sheng skin route proves a privacy-bounded, path-sanitized five-asset material pipeline while leaving its watched visual-art gate explicitly rejected.

That evidence is a production foundation, not final character work. The current faces are generic non-portrait blockouts. Interaction hands, final mouth anatomy, voice/lip synchronization, close framing, identity-specific art and acting, final light/material response, broad performance capture and human historical, cultural, accessibility and player review remain open. The prior accepted body-performance package remains the latest input-driven story-progression and headless-smoke proof for that lane.

## Production architecture

1. `content/` is the authority for campaign facts, classifications, localization keys and versioned state. `packages/game-core/` is the authority for deterministic rules.
2. Web, Unreal and Unity consume the same versioned exports. A client can add presentation and platform integration but cannot silently change choices, outcomes, chronology or source classifications.
3. Editable source, provenance and review records precede engine imports. Generated mirrors, caches, cooked data and package trees are reproducible outputs, never source authority.
4. A cinematic sequence may frame, pace or hand off a decision; it cannot make the decision for the player or hide required state.
5. Every asset, shot, system and tool task starts from an authored player/story beat and names the change it should create in player understanding, choice, emotion or consequence.
6. Each production increment must be narrow enough to validate in source, engine, package and visible play before the same pipeline scales.
7. Open-source, online or AI tooling is admitted only for a demonstrated bottleneck, pinned/versioned where possible, license-reviewed, locally inspectable and replaceable. Prefer a proven reusable tool over bespoke toil when it preserves control and quality. Tool popularity, novelty and output volume are not quality gates.

## Quality-gated production sequence

These phases describe dependency order, not dates. Work proceeds in steady, reviewable daily increments. A phase advances only when its exit evidence passes; unfinished gates remain open for as long as necessary instead of being relabeled complete or weakened to fit a schedule.

### Phase 1 — foundation and two production vertical slices

**Intent:** prove the entire route from research and deterministic play through final-camera character performance, packaging and observed play before multiplying chapters.

#### Gate 1A: Daze foundation

- Stabilize the observe → inspect → deliberate → issue → resolve → recover loop in Web and Unreal using one canonical state transaction.
- Complete the Daze council and Broken Crossing interaction grammar with mouse, keyboard and controller-equivalent automation, save/reload, hostile/tampered-state rejection and visible consequence handoff.
- Maintain source/claim closure for the active scene, including exact editions/locators, uncertainty, fictional characters and reconstructed dialogue labels.
- Establish one reproducible asset intake lane for mesh, texture, material, animation, audio and cinematic evidence.
- Replace the shared facial engineering blockout in only one close-dialogue test shot after identity design, skin, eyes, hair, mouth, hands, clothing and deformation each pass their component gate.

#### Gate 1B: first final-camera Daze slice

- Author interaction-specific hand poses and object contacts for the wartable/document/order moment; validate both hands, held props and release transitions at normal speed.
- Add final inner-mouth anatomy and a bounded viseme/expressive facial rig. Prove neutral, blink, gaze, interruption, breath and speech transitions without tears, residual morphs or comic overstatement.
- Produce an audition-quality voice and pronunciation test for one bounded scene, with transcript authority, subtitle coexistence, loudness, consent/rights and replaceability documented.
- Lock a restrained close-dialogue camera, lighting and material study that remains legible in standard and reduced-motion presentation.
- Run human historical/cultural, character-art, animation, audio and accessibility reviews before calling the shot final.

#### Gate 1C: second slice and pipeline repeatability

- Apply the proven pipeline to a contrasting field-command slice with formations, terrain, weather, supply and aftermath rather than cloning the council scene.
- Integrate the next authored late-Qin chapter unit only after its player decisions and historical claim matrix close.
- Demonstrate that a second character/scene can pass the same source-to-package gates without private paths, manual one-off fixes or narrative forks.
- Conduct observed first-time playtests on the complete slice, address the highest-severity comprehension and enjoyment failures, and publish an internal green/red gate report.

**Phase 1 exit gate:** one coherent, replayable Daze-to-next-chapter vertical slice reaches an authored ending; at least one council close-dialogue scene and one field-command sequence pass final-camera candidate review; Web and Unreal resolve the same canonical routes; the package launches from a clean output; and human reviewers accept the bounded slice for history/culture, art/performance, audio, accessibility and first-time comprehension. “Candidate” does not mean public release.

### Phase 2 — campaign content and cinematic scale

**Intent:** turn the repeatable vertical-slice pipeline into a game-sized production system without lowering the gate or producing disconnected spectacle.

#### Gate 2A: chapter pods and systemic depth

- Build chapter pods around Chen, Pei and Kuaiji networks, with authored political, logistical and martial pressures that reuse rules while changing decisions.
- Expand opponent intent, officer relationships, information reliability, population/supply consequences and campaign aftermath through deterministic, testable systems.
- Introduce historical figures without hindsight omniscience and fictional connectors only when clearly classified.
- Grow the source register by scene need; reject undirected ingestion of entire books into player-facing text.
- Establish encounter and cinematic templates whose timing, lenses, input handoff, reduced-motion path and source disclosures are testable rather than copied by eye.

#### Gate 2B: cinematic and content production

- Scale identity-specific characters, costumes, props, settlements, routes and battle spaces from approved modular kits, with LOD/HLOD, collision, material and memory budgets.
- Produce performance through authored or rights-cleared body/facial reference, shot-specific animation and human direction. Procedural layers may add restrained variation but may not determine story intent.
- Build adaptive score, ambience and semantic effects around game state; preserve silence, dialogue intelligibility, independent controls and non-audio information parity.
- Complete a representative low/medium/high hardware performance matrix and optimize measured bottlenecks before raising visual complexity.
- Expand full narrative localization in controlled waves. Each wave includes terminology, names, typography, subtitle timing, overflow, bidi and native-speaker review.

**Phase 2 exit gate:** the campaign has multiple connected, replayable chapter pods and a complete internal beginning-to-end route; every shipping scene has source and dramatization closure; representative council, travel, settlement and battle sequences pass the cinematic scorecard; Web/Unreal rule parity and save migration pass the complete replay corpus; content fits declared CPU/GPU/memory/storage budgets; and an external closed-alpha cohort can understand, complete and meaningfully disagree about strategies without developer coaching.

### Phase 3 — content lock, polish and release readiness

**Intent:** finish, stabilize and prove the game rather than turn the final phase into uncontrolled feature expansion.

#### Gate 3A: content complete

- Close the authored campaign, endings, continuity, relationship memory and source matrix. Remove unfinished branches instead of masking them with generated filler.
- Replace or explicitly approve every placeholder; close final character, environment, animation, VFX, audio and localization asset reviews.
- Perform complete playthrough checks for choice reachability, deadlocks, economy/resource curves, difficulty, recovery, save migration and ending coherence.
- Freeze the announced language/platform scope. Anything not supportable to the same quality moves to a later release rather than shipping partially reviewed.

#### Gate 3B: alpha, beta and optimization

- Run structured alpha and beta cohorts across experience levels, control modes, languages and accessibility needs, with informed consent for any telemetry.
- Tune from observed confusion, frustration, strategy diversity, pacing and replay behavior; do not optimize only for completion rate.
- Complete frame-time, loading, memory, package-size, crash, input-latency, subtitle/audio and long-session soak matrices on declared reference and minimum hardware.
- Lock camera, grade, mix and master only after gameplay timing is stable. Revalidate reduced motion, skip, pause and save/recovery after every cinematic change.

#### Gate 3C: release candidate

- Branch from a clean, reproducible content/build commit; generate signed candidates, hashes, dependency/security/privacy reports, rollback instructions and support runbooks.
- Complete legal/rights, credits, data/privacy, age-rating, historical/cultural, accessibility and localization sign-off.
- Admit no new feature after release-candidate lock without an explicit severity/benefit decision and a full affected-gate rerun.
- Seek separate explicit authorization before public release, store submission, analytics/account collection, commercial launch or paid external generation.

**Phase 3 exit gate:** the release candidate is feature- and content-complete, critical defects are zero, deterministic replays and save migrations pass, announced locales and input/accessibility paths pass human review, declared hardware meets performance budgets, all assets and voices have auditable rights, and at least two clean-machine installs complete representative beginning-to-end playthroughs. Public launch remains a separate user decision.

## Measurable discipline gates

These are minimum gates for a release candidate. Each production gate narrows them to its current scene or chapter; “not applicable” requires a written reason.

### Gameplay and player experience

- Every command encounter exposes at least three meaningfully different plans and at least two viable plans under each admitted starting condition; exhaustive deterministic tests prove reachability, termination and no deadlock.
- Canonical input produces the same intermediate resources, outcome identity and save delta in shared core, Web and Unreal. Any deliberate presentation-only difference is documented.
- A decision discloses enough state to reason, never requires color or audio alone, and provides an immediate recovery/restart path after failure.
- A milestone is not accepted on developer play alone. At least five first-time observed players test a vertical slice and at least twenty test a release-candidate chapter set; raw notes, comprehension failures, abandoned runs and changes are retained privately.
- Release-candidate critical defects, save corruption, progression blockers and unrecoverable input traps are zero. Lower-severity thresholds are set before each alpha/beta rather than after seeing the results.
- Enjoyment is assessed through strategy disagreement, voluntary replay, perceived consequence and pacing interviews—not a single aggregate score.

### Story, history and adaptation

- Every P0 player-facing historical claim has a registered edition, exact locator, classification, uncertainty and named human reviewer before content lock.
- Reconstructed dialogue, composite scenes and fictional characters remain machine-verifiable and visibly distinguishable from direct historical claims.
- Names, titles, dates, geography, institutions, material culture and military practice pass consistency and domain review for their actual scene context.
- Classical works are selected by relevance and rights status. No private book, OCR dump, generated paraphrase or long source quotation enters the build merely because it exists in the research library.
- Alternate history begins at disclosed player agency and propagates through explicit state. It does not retroactively rewrite established evidence or present counterfactual outcomes as the historical record.
- A chapter has an authored dramatic question, setup, reversal, consequence and recovery/ending; generated filler cannot be used to claim narrative completion.

### Web, Unreal and Unity parity

- All clients validate the same schema version and canonical-content hash. Packaging fails closed on drift, missing content or incompatible save versions.
- The shared deterministic replay corpus covers every published rule version, choice route, engagement condition and migration boundary. Web and Unreal must match exact state deltas before a cinematic presentation can certify the route.
- Unreal owns the priority 3D presentation, performance, camera, lighting and platform integration. Web remains the quick, deployable reference for the complete playable rules and story. Unity stays buildable against the shared schema but receives no independent story/rule fork.
- A final milestone requires clean-package launch, real input through representative story progression, save/reload, return from an encounter, source/evidence access and controlled shutdown—not only automation or editor play.

### Characters, skin and materials

- Every named shipping character has an identity sheet separating sourced period constraints, artistic reconstruction, fictional choices and prohibited stereotypes. Named historical figures are not presented as verified likenesses.
- A skin candidate must have an auditable source/generation record and a human-approved design target. Final albedo contains no baked lighting, specular highlight, eyelashes, facial hair or beauty-filter artifacts; roughness, normal and subsurface response are separately authored and inspected.
- Face/skin is reviewed under at least neutral daylight, warm interior key, cold/wet exterior and high-contrast rim conditions at gameplay and intended closest-camera distance. Hue, value, pores, age, weathering and wetness must remain physically coherent without plastic or wax response.
- Final texture resolution and shader features are chosen from measured camera and memory needs, not an automatic 4K/8K rule. LOD transitions, mip behavior, shader complexity and fallback materials pass in the packaged build.
- Eyes maintain corneal aim, sclera/iris scale, wetline and lid contact without piercing or dead fixed gaze. Hair, brows and lashes pass aliasing, transparency, shadow and motion review at target resolution.
- AI-generated bitmap work remains a candidate/reference until projection cleanup, seam repair, channel separation, relighting, identity/historical review and packaged-engine inspection pass.

### Hands, mouth, voice and animation

- Every close interaction has authored contact points, grip/release phases and left/right finger poses. No visible object penetration, floating grip, wrist collapse or contact sliding survives final-camera review at normal and half speed.
- A close-speaking character has modeled teeth, gums/tongue and inner mouth; jaw, lip, cheek, tongue, neck and breath deformation are tested at rig extremes and in every admitted shot. Neutral restoration leaves no residual controls.
- Viseme timing derives from the approved performance and transcript, not an unreviewed emotion or amplitude classifier. Expressive facial controls remain separable from speech and preserve identity.
- Every shipping voice records performer/model rights, consent, language/accent, pronunciation authority, processing chain and replacement terms. Synthetic or cloned identity without explicit rights is prohibited.
- Dialogue passes intelligibility, plosive/sibilance, room continuity, peak/loudness, subtitle timing, rapid-skip and mono/downmix checks. Required information remains available without audio.
- Body, face, cloth, hair and props are reviewed together at normal speed. Foot plants, weight shifts, eyelines, breath, interruption and settle must support the authored beat rather than add perpetual ambient motion.

### Camera, lighting, environments and VFX

- Every cinematic beat has a written subject, player-state transition, target, lens, duration, input handoff and reduced-motion equivalent. One highlighted subject remains readable; required evidence stays in frame or accessible.
- Camera movement is motivated by command scale or consequence, respects the established movement/lens bounds, can be skipped, and hands control back to the exact canonical state. Motion-comfort review includes reduced-motion cuts/holds.
- Lighting preserves faces, hands, required objects and navigation at declared display settings. Exposure, grade and weather never conceal state or turn color into the sole signal.
- Each environment kit has period/geographic references, scale, traversal/collision, modularity, material, lightmap/virtual-texture, LOD/HLOD and memory review. A beautiful background that cannot support play is not complete.
- Rain, mud, fog, fire, dust and crowds must affect or clearly support game state, depth and sound; they are bounded by overdraw, particle, simulation and visibility budgets and expose a low-cost/reduced-sensory path.
- Final packaged scenes are reviewed for temporal artifacts, ghosting, texture streaming, shadow instability, foliage shimmer and VFX discontinuity during actual interaction and camera cuts.

### Music, sound and Musia

- Each chapter receives a music brief defining dramatic function, motifs, instrumentation constraints, silence, transition states and source/cultural questions before track generation or composition.
- Musia may produce original composition auditions, arrangement variations and stems. A candidate does not enter the game until ownership/model terms, prompt/input rights, similarity/plagiarism risk, human musical and cultural review, editability and mix fitness are recorded.
- Adaptive music transitions are driven by explicit game state, remain deterministic where rules require it, and avoid announcing hidden information. Stems loop and transition without clicks, phase/DC faults or loudness jumps.
- Ambience and effects retain provenance and are checked against picture, gameplay frequency, dialogue, sensory load, mono perception and physical output devices. Independent ambience/effects/music/voice controls persist.
- The final mix includes calibrated loudness/peak evidence and human listening on headphones, speakers and at least one modest consumer device; objective measurements do not replace listening review.

### Localization and accessibility

- The intended release set is English, Japanese, Korean, Vietnamese, Arabic, French, Spanish, Russian, German, Simplified Chinese and Traditional Chinese. Scope may be reduced transparently if full review cannot be funded; an unreviewed machine translation is never labeled supported.
- Each announced locale passes missing strings, terminology/names, linguistic review, subtitle timing, text expansion/overflow, font coverage, line breaking and representative desktop/mobile screenshots. Arabic additionally passes RTL, bidi isolation and mirrored-flow review.
- Keyboard, pointer, touch and supported physical-controller paths pass; focus, prompts and remapping remain coherent. Screen reader, 200% text, 400%-equivalent reflow, contrast, forced colors, non-color cues, reduced motion, subtitle/caption and audio-control paths receive human review.
- Cinematic accessibility includes pause, skip, replayable context, subtitles, speaker identity, non-audio equivalents and a reduced-motion version with the same narrative and decision information.
- No accessibility box closes solely from static analysis or synthetic input. Named testers/reviewers, environment and evidence are recorded.

### Performance, build and release

- Each target milestone declares reference/minimum hardware, resolution, quality setting and a frame-time budget before optimization. The primary cinematic target is paced 60 Hz where declared; a lower tier is admitted only with an explicitly tested 30 Hz profile and unchanged gameplay readability.
- CPU, GPU, draw-call/triangle, material, texture/streaming, animation, audio, memory, loading, package-size and input-latency budgets have capture receipts for representative council, settlement and battle worst cases. Averages cannot hide hitch percentiles or shader-compilation stalls.
- Automated validation, native tests and client builds run from a clean checkout. Current and immediately previous reproducible packages are retained; caches, credentials, browser profiles, user directories and package trees remain outside Git.
- Release candidates pass clean-machine install/launch, beginning-to-end progression, save/reload/migration, offline/network expectations, long-session soak, controlled exit, crash recovery, dependency/secret/security/privacy scans and rollback rehearsal.
- Artifact manifests include commit/content hashes, tool/engine versions, build command, files, sizes and SHA-256 receipts. Store/public actions occur only after explicit authorization.

### Human review and release authority

- A bounded slice needs named owners or reviewers for gameplay, history/culture, narrative, character art, technical art, animation/cinematics, audio, localization, accessibility and release engineering. One person may hold multiple roles, but no discipline may be silently omitted.
- AI self-review can find defects and prepare evidence; it cannot impersonate native-speaker, disabled-user, historical-domain, performance-directing or legal approval.
- Rejected candidates and the reason for rejection remain in a lightweight decision log. Only accepted source and compact evidence enter the production history.
- Paid generation, external account purchases, public publication, store submission, analytics activation, account/email collection and commercial launch require separate explicit visible confirmation.

## Story-and-film decision rubric

Before starting an asset, shot, system, research or tool task, its brief must answer all of these questions. A task that cannot answer them is narrowed, deferred or rejected.

| Decision | Required answer |
| --- | --- |
| Story beat | Which authored dramatic question, reversal, relationship or consequence does this serve? |
| Player agency | What does the player learn, choose, risk or carry forward, and how is that visible in canonical state? |
| Film purpose | Why are performance, framing, lens, blocking, light, sound and duration the clearest expression of that beat? |
| Historical boundary | What is sourced, uncertain, reconstructed or fictional, and what human review remains open? |
| Play context | How does the work enter and return control, including skip, pause, reduced motion, subtitles and non-audio/non-color equivalents? |
| Cross-client truth | Which shared content/rule state does it present, and how will Web and Unreal parity remain provable while Unity stays schema-compatible? |
| Production leverage | Which measured bottleneck does the chosen tool or reuse remove, what editable artifact does it leave, and why is that safer or faster than the available alternative? |
| Acceptance evidence | What packaged capture, deterministic test, performance budget, provenance/license record, observed play and named human review can make it green? |

An impressive asset that has no player/story beat is not backlog. A cinematic that does not change understanding or embody consequence is not film design. A tool task that cannot name saved toil and a reviewable production output is tool accumulation.

## Tool-role and admission boundaries

Tools accelerate candidate creation, iteration and inspection; they do not own story truth, direct performance or approve their own output. Search for maintained, rights-compatible open-source and online capabilities before writing bespoke infrastructure, but adopt only the smallest lane that improves a brief already admitted by the story-and-film rubric.

| Tool or lane | Admitted role | Must not do | Admission evidence before shipping |
| --- | --- | --- | --- |
| Codex image generation | Produce skin/material/identity mood studies, orthographic references, decal or texture candidates when a bitmap is the correct artifact | Declare a historical likeness; directly overwrite a reviewed final asset; convert a pretty render into approval | Prompt/input rights, generated-file provenance, model/tool record when available, visual defect review, material-channel cleanup, human identity/history/art approval and packaged-engine relighting evidence |
| Blender, Material Maker and `../AgenticApp` | Editable modeling, sculpt/retopology, UV, rigging, baking, procedural PBR material preparation, blend-shape, LOD and reproducible renders; AgenticApp may assist bounded supported tasks | Ship opaque generated geometry; treat community-library material assets as automatically cleared; bypass anatomy/costume review; hide dependencies or private source paths | Editable source, script/version receipt, topology/UV/scale/rig/deformation/LOD checks, dependency and library-asset licenses, export equivalence and Unreal package review |
| `../Agent` / AgInTiFlow | Orchestrate bounded research, image-candidate, validation and handoff jobs with durable manifests | Autonomously publish, purchase, ingest private corpora into builds, or mark a human gate passed | Scoped task contract, input/output manifest, provenance, reproducible validation, secret/private-data scan and responsible human/lead acceptance |
| `../Musia` | Original music auditions, motif/arrangement exploration, stems and revision candidates | Claim cultural/authorship clearance; imitate a living artist; ship an unchecked generated mix | Prompt/source/rights record, model/tool terms, similarity and cultural review, editable stems, objective audio checks, human listening and integration proof |
| `../LALACHAN` / Xiaoyunque | Storyboards, previsualization, animatics, shot and trailer candidates after story approval | Replace in-engine gameplay evidence; establish historical truth; submit paid jobs or publish without confirmation | Approved script/shot brief, uploaded-input rights, generation receipt, artifact provenance, human story/cultural/visual review and a clear label separating previsualization from captured gameplay |
| Unreal Engine | Priority playable cinematic runtime, camera, lighting, animation, VFX, world interaction and packaged desktop evidence | Fork canonical narrative/rules; treat editor screenshots as package acceptance | Native automation, content hash, clean cook/package, real-input play, performance capture, accessibility path and final-camera review |
| Web client | Complete rapid playable reference, accessibility/localization proving ground and deterministic comparison client | Become a simplified alternate story or silently omit campaign consequences | Shared hash/replay closure, browser/network/accessibility checks, desktop/mobile visible play and deploy budgets |
| Unity client | Maintained shared-schema compatibility baseline | Compete as a third independent content pipeline during Unreal priority | Sync receipt, compile/import/build status and explicit documented parity boundary |

Any open-source repository, model, public research source or hosted service is evaluated before installation or reliance against authority, license, provenance, security, maintenance, hardware/storage cost, editability and the specific bottleneck it removes. Prefer primary or authoritative online sources for factual claims, and capture stable locators and access dates. A downloaded or generated artifact stays quarantined outside shipping paths until its admission record is green. Existing verified SDKs, weights and profiles are reused instead of duplicated. Tool discovery and setup are time-boxed; if integration costs more than the bounded toil it removes or weakens authorial control, return to the simpler lane.

## Asset and shot definition of done

An asset is done only when its editable source, provenance, rights, intended use, scale, topology or media integrity, engine import, performance budget, accessibility implications and human review are recorded. A generated asset additionally needs generation/input records and artifact review. “Looks good” is a review note, not a receipt.

A cinematic shot is done only when:

1. its story beat and historical/reconstruction boundary are approved;
2. its player entry/exit state and skip/pause/reduced-motion behavior are deterministic;
3. final-intent character, environment, animation, camera, light, VFX, voice/music/effects and subtitles are integrated;
4. it passes packaged playback at normal speed on declared hardware without visible fallback, collision, material, streaming or temporal defects;
5. required gameplay information remains perceivable without color, motion or audio alone;
6. discipline reviewers accept the captured shot in context, and any remaining exception is explicit and release-blocking where appropriate.

## Operating cadence and evidence

- **Daily:** choose the highest-leverage open story/player problem, complete the smallest durable increment that moves it, and leave source, evidence and handoff state clean enough to continue tomorrow.
- **Weekly:** review the current beat through playable context, integrate one bounded gameplay or film increment, run automated and visible checks, triage defects and update truth-bearing docs.
- **Monthly:** review scope, player evidence, historical/review capacity, asset throughput, build health, performance trend and resource use; stop or narrow weak work.
- **Quarterly:** play the game beginning to current ending from a clean package, compare Web/Unreal outcomes, review the red-gate register and make a continue/change/cut decision.
- **At each phase transition:** accept the exit gate only with a named evidence packet. Time spent and schedule progress cannot make it green.

Minimum gate evidence includes the source/content commit, validation commands and results, package manifest/hashes, representative unedited captures, performance capture, asset/provenance changes, observed-play notes, human-review decisions and a concise list of still-red gates. Private notes, credentials and licensed source books stay outside Git.

## Scope and stop rules

- Finish the strongest complete campaign before expanding to every period, battle or classical work.
- Do not create assets faster than art, historical, licensing and technical review can admit them.
- Do not open close framing until skin, eyes, mouth, hands, performance, lighting, audio/subtitles and accessibility pass together.
- Do not add a tool, model or plugin without a specific bottleneck, owner, license decision, version pin, test asset and removal plan.
- Do not keep a cinematic that weakens agency, readability, comfort, frame pacing or historical honesty, regardless of production cost.
- Do not call an internal build alpha, beta, content-complete, film-level or release-ready until the corresponding gates in this charter have evidence.
- Protect sustainable work: preserve source and decisions, keep bounded current runtimes/builds, and prefer steady reviewed increments over mass generation.

This charter is deliberately demanding and revisable. There is no reward for filling a calendar or repository. The goal is to make each reviewed day leave behind a more coherent, playable, affecting and trustworthy game without trading away the final standard.
