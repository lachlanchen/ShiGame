# Unreal cinematic priority plan

Decision date: 2026-08-09. Unreal is now the priority 3D/cinematic delivery track for SHI. The Web client remains the rapid playable reference. The existing Unity client is preserved as a shared-schema baseline, but new 3D feature work goes to Unreal until its vertical slice passes native play evidence.

## Non-negotiable architecture

- One canonical campaign JSON, one chronology/source ledger and one rule contract feed all clients.
- Unreal may own presentation, camera, world interaction, animation and platform integration; it may not fork story facts, choice effects or historical classifications.
- Generated engine mirrors are disposable. The canonical payload remains under `content/` and is byte/hash validated.
- C++ owns deterministic loading, state and tests. Blueprints may author staging and presentation against stable C++ interfaces.
- Every rules change regenerates a hash-bound exhaustive replay corpus; native automation must match all identities, deltas and intermediate resources before presentation work can certify a checkpoint.
- Sequencer supports transitions and performance beats; it never replaces player agency.
- Every imported/generated asset has provenance, license, scale, LOD, collision, performance and visual-review status.

## First vertical slice

The first native gate is one high-quality Daze order, not a vast empty map:

1. Rain-soaked Daze command space with an explorable wartable/assembly composition.
2. Inspectable route/intelligence ground and command state are source-authored as five bounded canonical 3D sites plus nine live grain/trust/momentum/people/exposure/field/pursuit/method/oath signals with pointer/keyboard/gamepad focus, non-color-only shape/height/text grammar and scoped evidence. Native staging and review remain open.
3. Three selectable orders and one complete, readable selected-order briefing.
4. Explicit issue-order input from mouse, keyboard and controller.
5. In-world and UI feedback for resource/commitment/enemy/field state is source-authored and refreshes after order resolution; a deterministic consequence plan then binds the actual order/oath/pressure/pursuit/method/field/position record to those live actors. Native execution and review remain open.
6. Act, scene, site and date advance from the register into organization.
7. A 3.52–4.08-second six-or-seven-beat camera sentence with a five-second hard ceiling, one highlighted world target, exact Slate readout, complete command isolation and whole-sequence skip back to authoritative ground. Source and hostile automation are authored; native motion/input acceptance remains open.
8. Opt-in rain and semantic order/consequence sound with independent persistent controls and no exclusive information.
9. Save/reload and source/evidence access. The source slice is authored; native interaction proof remains open.
10. Linux Development and packaged builds, automation tests and visible noVNC play evidence.

## Film-feel principles

- Compose around human decisions: eyes, hands, wet documents, food, distance and exhausted bodies—not generic armies posing in fog.
- Use restrained lenses and motivated camera movement. Camera motion signals a change in command scale or consequence.
- Rain affects sound, visibility, ground, supply and movement; it is not a particle-system wallpaper.
- Lighting distinguishes public order, private doubt and field danger without making required information color-only.
- Dialogue blocking gives advisers competing spatial claims around the player rather than turning every scene into a cutscene.
- Performance budgets, readable interaction states and input latency outrank maximum settings.

## Engine acquisition and host facts

Epic’s current Linux quickstart supports a precompiled installed-build ZIP after Epic-account sign-in, or a source build after Epic/GitHub account linking. The official Unreal 5.8 Linux requirements recommend Ubuntu 22.04 or Rocky Linux 8, 32 GB RAM, high-VRAM Vulkan hardware, NVIDIA 570+ and the versioned clang toolchain. This workstation is Ubuntu 24.04 with 125 GiB RAM, 28 logical CPUs, two 24 GiB RTX 4090 D GPUs and NVIDIA 595.84. It exceeds the hardware baseline but is outside the recommended distribution, so native import/package evidence must remain explicit.

At the decision boundary, the active GitHub account cannot read EpicGames/UnrealEngine. Use the official precompiled Linux ZIP route or complete Epic↔GitHub linking; do not download unofficial engine archives. Storage has been measured before installation. Engine binaries, derived data and builds must live outside Git and must not consume the high-usage project volume without a budget check.

Official references:

- [Linux Development Quickstart](https://dev.epicgames.com/documentation/unreal-engine/linux-development-quickstart-for-unreal-engine)
- [Linux Development Requirements](https://dev.epicgames.com/documentation/unreal-engine/linux-development-requirements-for-unreal-engine)
- [Creating a New Project](https://dev.epicgames.com/documentation/unreal-engine/creating-a-new-project-in-unreal-engine)

## Acceptance sequence

| Gate | Proof |
| --- | --- |
| Project truth | `.uproject`, targets/modules/config and canonical-content sync validate in Git |
| Engine truth | official UnrealEditor version recorded; project files generate; C++ editor target compiles |
| Rule truth | Unreal automation tests parse schema v7 and prove act/time/choice/effect closure |
| Historical truth | edition rights, source/claim closure, exact locators, reconstruction labels, current scene/site scope and remote site-only scope pass native automation and visible interaction |
| Replay truth | all 46 golden routes, six intermediate gameplay-layer states, post-turn consequence-plan closure, save round-trip and tamper rejection pass natively |
| Interaction truth | visible PIE route performs site/signal click and cycle → exact state read → evidence → current-ground return → select/method-read refresh → issue → world-state refresh → natural consequence sequence plus mid-beat skip → progression without campaign-state mutation during inspection or presentation |
| Audio truth | pre-consent silence, native output capture, mixer persistence, rapid-input fatigue and human listening review pass |
| Presentation truth | reviewed desktop capture proves exact beat text/target closure, one highlighted focus, natural completion, immediate authoritative skip return, camera/lighting legibility, restrained motion, frame timing and provenance review |
| Build truth | Development and packaged Linux builds launch from clean output with receipts/hashes |
| Player truth | observed first-time players understand and enjoy the loop without developer coaching |

Unreal is not called “playable” before the interaction gate and not called “film quality” before presentation, performance and human review pass.
