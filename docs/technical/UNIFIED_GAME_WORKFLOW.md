# SHI — unified production workflow

Researched 2026-10-02 against official sources and the local repositories. Applies the [master design](../design/GAME_DESIGN_DOCUMENT.md) and [bounded goal](../production/SHI_WORKABLE_GOAL.md). “Available”, “trial planned”, “integrated” and “device verified” are different states.

## What the live research changes

| Evidence | Adoption for SHI | Actual status / limit |
| --- | --- | --- |
| OpenAI's [Building games with Astra](https://developers.openai.com/blog/how-to-build-games-with-astra), 2026-09-04: experience-first specification, visual targets and input-driven testing alongside deterministic tests | Describe and test what the player does from entry through consequence; keep simulation independent of renderer changes | Workflow adopted. No claim that this session has silently changed models or that speed/quality is guaranteed |
| OpenAI's [Architectural visualization with Astra](https://developers.openai.com/blog/architectural-visualization-with-astra), 2026-09-04: editable Blender/Python scene construction and visual iteration | Build spatially coherent, reusable terrain/architecture; inspect renders, then transfer the approved scene into Unreal | Existing Blender/Unreal route retained; no new Jinyang scene rendered yet |
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

Order: chapter causal design → shared-rule experiment → complete engine blockout with audio → novice playtest → character/action polish → short local video previews → final media → device qualification → reproducible test release.

One current SHI runtime and one heavy job. Preserve other projects, pinned device routes and shared reservations. Use the Mac mini/7050/3040/KVM routes according to the current private handoff and actual availability; do not occupy every machine. Capture evidence, then stop this session's unused runtime.

Preserve the existing released native iOS, Android, web and Unity compatibility paths while qualifying the new encounter. Do not claim G1 is done because a headless simulator passes. Do not count a TestFlight receipt for an old text-heavy build as delivery of the redesign.

Commit/push meaningful verified checkpoints with deliberate staging. Submission and public rollout are separate recorded actions under their confirmation boundary. Source documents and obsolete runtime processes are not milestone builds.
