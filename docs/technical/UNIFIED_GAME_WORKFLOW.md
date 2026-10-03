# SHI — unified production workflow

Researched 2026-10-02 against official sources and the local repositories. Applies the [master design](../design/GAME_DESIGN_DOCUMENT.md) and [bounded goal](../production/SHI_WORKABLE_GOAL.md). “Available”, “trial planned”, “integrated” and “device verified” are different states.

## What the live research changes

| Evidence | Adoption for SHI | Actual status / limit |
| --- | --- | --- |
| OpenAI's [Building games with Astra](https://developers.openai.com/blog/how-to-build-games-with-astra), 2026-09-04: experience-first specification, visual targets and input-driven testing alongside deterministic tests | Describe and test what the player does from entry through consequence; keep simulation independent of renderer changes | Workflow adopted. No claim that this session has silently changed models or that speed/quality is guaranteed |
| OpenAI's [Architectural visualization with Astra](https://developers.openai.com/blog/architectural-visualization-with-astra), 2026-09-04: editable Blender/Python scene construction and visual iteration | Build spatially coherent, reusable terrain/architecture; inspect renders, then transfer the approved scene into Unreal | October 3: editable Jinyang scene imported and walked in a packaged Unreal player; final visual quality remains open |
| Epic's [UE 5.8 Game Animation Sample update](https://www.unrealengine.com/tech-blog/download-the-latest-game-animation-sample-project-now-updated-for-ue-5-8), 2026-08-12: motion matching, paired interactions, physics control and object interaction examples | Trial one period-costumed character walking, stopping, turning and helping another; use contact/retarget tests before expanding | UE 5.8.1 exists locally. Sample integration is unverified. Experimental look-at is optional, not a dependency |
| Epic's [MetaHuman 5.8 notes](https://dev.epicgames.com/documentation/metahuman/metahuman-5-8-release-notes-in-unreal-engine): full-body mesh conforming, batch facial workflow, platform limits | Compare one canonical-cast rig against existing Blender rigs; adopt only if export, identity and mobile cost pass | Research only. Facial authoring is supported on Linux/macOS; new body-capture features require Windows. Do not schedule Mac body capture as if supported |
| Epic's [Sequencer/Animation Blueprint blending](https://dev.epicgames.com/documentation/en-us/unreal-engine/blending-animation-blueprints-with-sequencer-in-unreal-engine) | Blend gameplay and authored performance on the same actors; restore the same situation and input ownership | Trial required. The documented slot/weight mechanism is not by itself a finished scene director |
| Epic's [Lyra sample architecture](https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine?lang=en-US) | Separate encounter content, input, presentation and platform profiles; use a narrow encounter feature boundary | Architectural reference, not an instruction to import a multiplayer shooter or rewrite the entire application |
| Epic's [Movie Render Pipeline](https://dev.epicgames.com/documentation/en-us/unreal-engine/movie-render-pipeline-in-unreal-engine) | Render reproducible establishing shots and review cameras from the same authored scene | Offline render quality never proves runtime frame rate |
| Epic's [mobile rendering features](https://dev.epicgames.com/documentation/unreal-engine/mobile-rendering-features-in-unreal-engine) | Separate mobile quality profiles, light/mesh budgets, LOD and texture limits; profile the iPad and Mi 10 Pro early | No promise that desktop Lumen/Nanite quality transfers unchanged to both devices |
| ACE-Step's [official musicians guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/ace_step_musicians_guide.md) | In Musia, create a thematic family using appropriate reference/remix/repaint tools, then edit real transitions | Route capabilities differ; Lego/Extract/Complete are not turbo features. Unrelated tracks are not synchronized stems |
| MiniMax's [H3 model card](https://huggingface.co/MiniMaxAI/MiniMax-H3) and [video API guide](https://platform.minimax.io/docs/guides/video-generation) | Use the existing local adapter and its measured capabilities for reference-driven shots; keep cloud API specs separate | LocalVideoGen source/presets inspected. Studio was not listening at the inspection; no render-ready or new clip claim. No paid cloud call made |

These are selected techniques that address SHI's observed failures, not a mandate to adopt every recent feature.

## One encounter is the unit of work

Author one versioned encounter contract with:

- historical situation, source anchors and classification of each claim;
- player role, authority and objective;
- geography, participants, legal actions, actor information and response rules;
- state transitions, commitments, ending families and continuation links;
- character/prop identities, action/performance bindings and camera beats;
- sound, music and optional movie bindings;
- save checkpoints, accessibility alternatives and acceptance routes.

Use existing content validation and deterministic game-core patterns. Do not invent a separate story inside a video prompt, a Swift screen or an Unreal level. The new Jinyang encounter is not silently inserted into the existing Qin release schema. Version and migrate deliberately after the end-to-end development route works.

The TypeScript model is the fast reference. C++/Swift implementations need matching fixtures and explicit version checks; sharing JSON alone does not prove behavior parity.

## Source to scene

1. Read the exact local original and supplied translation, not only a manifest or search hit. Use targeted ignored-directory searches for work/interlinear outputs.
2. Record book, volume, paragraph/chunk identifier, hash and the specific historical claim privately. Public game metadata contains citations and bounded summaries, not copied private books.
3. Separate main text, later commentary, edition notes, modern translation and game reconstruction. Preserve disagreements.
4. Express the historical constraint as a player verb, opposing incentive and observable consequence. Write only the short performance needed to make those clear.
5. Review the full chapter's causal structure before ordering detailed art. Every scene must change available power, information, commitments or position.

The current Jinyang passage contains a usable coordination problem. Normalize the game's proper-name glossary against the original during localization review; specific discrepancies belong in the private source record. The supplied modern Chinese passage remains the writing reference.

## Editable, consistent assets

Define the cast sheet and costume variants once. Use image generation for approved face/environment targets. Build/retarget in Blender; preserve the editable source and named actions. Keep coordinate scale, skeleton version, contact markers and export settings in the asset manifest. OpenSCAD may help repeatable geometry; it is not a character-animation system.

Prove a walk/stop/turn, a hand/prop action and one paired interaction in the actual engine before making dozens of shots. Inspect from the playable camera, not only close-up turntables. Reject foot sliding, floating contact, implausible reach, clipping and facial identity drift. Keep lower-cost mobile variants from the same source.

Unreal reuses these characters for both real-time action and Sequencer. Use state-driven shots, not long uninterruptible films over a frozen rules engine. No model generation runs in the player's critical path.

## LocalVideoGen / MiniMax

Reuse ../LocalVideoGen and installed weights; do not duplicate model directories. Follow its local-series API and capability/health checks before generation. Submit only one SHI GPU job at a time. Existing fast preview options differ in resolution and route; begin with the documented short 864×480 preview where supported, not a cloud 2K request advertised as “fast local”.

A shot packet includes encounter/beat/state IDs, canonical cast images, place/style reference, camera, action, first frame and expected exit state. For continuation, retain canonical references plus the preceding last frame/short tail supported by the route. Continuity cannot rely only on prompting “same face”.

Decode and watch the entire preview, inspect identity/contact/geography and entry/exit frames, then approve or revise. Only approved shots receive final rendering and game integration. Record job/preset/seed/input/output hashes and the review. If the service is unavailable, implement the same beat in-engine and continue G1.

## Musia and continuous sound

Reuse ../Musia. Create a modest thematic family: sustained pressure, cooperation/action and aftermath, with space for ambient sound and speech. Existing A–F cues remain available; B stays the provisional Qin shelter choice. Do not call it listened-to or impose it on Jinyang without audition.

Use real arrangement/transition work for related variants; verify tempo/key/phrase compatibility before crossfading. Preserve ambience across camera cuts; switch intensity on state transitions, not button clicks. Listen through headphones/speakers in the actual game, check peaks/ducking/repetition and retain silence where useful. A loudness report is not listening evidence.

## End-to-end production and release

Content loop: chapter causal design → shared-rule experiment → complete engine encounter with audio → novice playtest → integrated character/action and short-film refinement → qualified test release. Native/touch feasibility and target-device builds start alongside the first complete encounter, not after final media. Repeat device profiling as assets mature; simulator compatibility of the old client does not qualify the new chapter.

One current SHI runtime and one heavy job. Preserve other projects, pinned device routes and shared reservations. Use the Mac mini/7050/3040/KVM routes according to the current private handoff and actual availability; do not occupy every machine. Capture evidence, then stop this session's unused runtime.

Preserve the existing released native iOS, Android, web and Unity compatibility paths while qualifying the new encounter. Do not claim G1 is done because a headless simulator passes. Do not count a TestFlight receipt for an old text-heavy build as delivery of the redesign.

Commit/push meaningful verified checkpoints with deliberate staging. Submission and public rollout are separate recorded actions under their confirmation boundary. Source documents and obsolete runtime processes are not milestone builds.

## October 3 research applied to the explorable world

Official sources were reopened, not just collected as search links. Adopt the useful technique without replacing the whole stack:

| Source | Practical decision |
| --- | --- |
| [OpenAI game workflow](https://developers.openai.com/blog/how-to-build-games-with-astra) | Preserve deterministic simulation while changing presentation. Keep repeatable starting states and real-input journeys separate. Applied: independent exploration save plus actual walking/order/cold-resume tests, with existing 161-state native replay parity. No claim of switching this session's model. |
| [OpenAI Blender/Unreal workflow](https://developers.openai.com/blog/architectural-visualization-with-astra) | Retain editable geometry, explicit units/axes, inspectable routes/collision, and real engine review. Applied: six source FBX layers, Blender source, import script and an actual packaged walking scene. Further adoption: matched review cameras and authored contact/rig checks for the next work-party sequence. |
| [Tencent Hunyuan3D-2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) | Candidate for reference-driven static props and PBR texture work, not an assumed animation/rig solution. Its documented 10 GB shape / 21 GB texture / 29 GB combined VRAM requirements imply staged/offloaded trials on a single 24 GB card. Not installed or used here; no duplicate weight download. |
| [LTX-2.3 model card](https://huggingface.co/Lightricks/LTX-2.3) and [current official LTX repository](https://github.com/Lightricks/LTX-2) | The card documents an eight-step distilled route. The live repository now also documents 2.5 and warns that its encoder/checkpoint components are not interchangeable with 2.3. Candidate research, not an installed SHI dependency or a claim that 2.3 is newest. Reuse LocalVideoGen first; do not migrate a working pipeline solely for a version number. |
| [Epic hierarchical PCG](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-pcg-generation-modes-in-unreal-engine) | When the world grows, distribute decorative detail at appropriate grid scales. Keep authored walkable routes and campaign geography authoritative. A small current scene does not justify a World Partition rewrite. Trial only, not integrated PCG. |

LocalVideoGen's current README and September-update note were also read. Its documented initial route is a two-second 864×480 preview. Optional installed-adapter records distinguish FL2V four-step v1.2 from reference-mode eight-step generation; this is not evidence of a freshly completed render. Start a reference-locked establishing insert only after live service/capability and shared-GPU checks. Review the complete clip and both transition frames; retain an engine-shot fallback. Musia remains the thematic score source, with actual listening required before admission.

### Native phone/tablet and macOS contract

Owner-confirmed targets now explicitly include **iPhone, iPad, Android phones and macOS**. Several hundred megabytes is acceptable: use an initial **300–600 MB installed-content planning envelope**, not a store limit or a measurement of today's build. Reserve space for reusable geometry/textures, related music cues, effects and short clips. Measure per-platform cooked/download/installed sizes separately; do not bake repeated copies of the same cast or long movies into each branch.

Native iOS remains SwiftUI/SceneKit today; the current Android release is an offline-web packaged client. Neither is the new native 3D Jinyang build. Qualify the Unreal native mobile/macOS lane using the same scene and rules, with touch controls, appropriate lighting/LOD and actual device profiling; preserve existing installed apps/saves until replacement and migration are verified. A macOS native player and an iPad app running on Apple Silicon are different delivery targets.

The Mac mini was freshly reached through the existing pinned LazyTunnel route with Xcode 27 and an iOS 27 runtime; existing SHI iPhone/iPad simulators were found shut down. This is a usable simulator lane, not proof of physical-device performance. [Apple's simulator guidance](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices) distinguishes simulated and physical execution. Other Mac routes are checked and recorded privately; use one heavy SHI test at a time, no shared Xcode selection changes or duplicate SDK installs. Never disturb the owner's physical desktop to show a review.

### Native qualification findings — October 3 follow-through

Xcode availability alone does not qualify the new Unreal chapter. The installed **5.8.1** engine's `Engine/Config/Apple/Apple_SDK.json` declares Xcode minimum 15.2, preferred 26.1.1 and maximum 26.9; its Mac and iOS SDK files inherit that range. The mini's observed Xcode 27 is outside this engine's declared range. Do not raise the engine limit or replace a shared Xcode selection just to force a pass. Qualify a compatible engine/toolchain pairing. Epic's [Apple-platform quick start](https://dev.epicgames.com/documentation/unreal-engine/ios-ipados-tvos-quick-start-guide-for-unreal-engine?lang=en-US) requires Unreal on the Mac and a compatible Xcode.

No Mac Unreal installation was found in the checked standard paths/index on the mini or KVM; this is a bounded inventory, not proof about every disk. The current GitHub account returned 404 for Epic's source repository. [Epic's offline installer](https://dev.epicgames.com/documentation/en-us/unreal-engine/offline-installer-of-unreal-engine) is an organization-entitled route, not an assumed public download. Requested an existing authorized installer/installation path from the owner. Do not use unofficial mirrors or repeat unchanged native Qin tests as a substitute.

Meanwhile the actual Unreal Jinyang scene now has development touch-control wiring: two engine virtual sticks, rate-independent walking/look input, on-screen walking actions, modal axis reset, safe-area wrapping and bounded scroll cards. Keyboard input remains; upward mouse/arrow/stick movement shares the engine's positive-pitch convention. Background/deactivation cancels uncommitted selection, saves location and pauses for explicit resume. `--touch --explore` in the isolated review launcher selects touch emulation. `npm run test:jinyang-input` compiles and executes the exact small C++ input header without starting Unreal; it covers dead zones, diagonal/mixed-input limits, 30/60/120 Hz camera rates, invalid values and resume clamps. The template joystick UI comes from the installed engine; it is not a new SHI character/art asset.

These are **input-source checks, not native app or visual acceptance**. Compile the Unreal module and inspect actual touch/mouse behavior, modal cancellation, safe areas and small-window layout before packaging a mobile candidate. The current shipped apps, Linux review package and main branch remain unchanged by this development branch.
