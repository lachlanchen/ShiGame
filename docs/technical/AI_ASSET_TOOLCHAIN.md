# AI-assisted asset and cinematic toolchain

Status: controlled evaluation lane · offline authoring only · 2026-08-10

## Boundary

SHI can use open-source and open-weight tools to shorten look development, prop ideation, geometry reconstruction, retopology preparation, rigging and cinematic authoring. These tools do not become runtime game authority. They cannot invent historical facts, write directly into the canonical campaign, bypass source review or promote an asset without visual, historical, technical, licensing and in-engine review.

The adoption unit is one usable SHI object or shot, not one installed repository. Each trial must be pinned, isolated outside Git, locally reproducible, reversible and measured against the existing Unreal package rather than judged from a vendor demo.

## Evaluation gates

1. Record the official repository/model card, exact code and weight revisions, license, required services and download footprint.
2. Inspect installers before execution. Reject `sudo`, moving Git branches, unpinned packages, telemetry and remote inference from the production path.
3. Install into a named outside-Git environment with an explicit cache; never vendor model weights or third-party repositories into SHI.
4. Generate one bounded non-authoritative candidate with seed/input/output hashes and no private source material.
5. Inspect silhouette, topology, normals, manifold state, UVs, PBR maps, texture artifacts, scale, pivot, collision, LOD/draw-call budget and license/provenance.
6. Clean and retopologize in Blender. Generated topology is never presumed game-ready.
7. Import into an isolated Unreal asset path, package it, compare frame timing and memory, and verify gameplay/camera/stencil/reduced-motion behavior.
8. Accept, revise or reject it in `assets/provenance/`. Only accepted, independently reviewed output can enter a shipping content path.

## Current workstation fit

- Two NVIDIA GeForce RTX 4090 D GPUs, each 24,564 MiB total VRAM; other user/game workloads currently consume part of both cards.
- NVIDIA driver `595.84`, compute capability `8.9`.
- System CUDA toolkit `13.0`; candidate repositories below were tested upstream primarily with CUDA `12.4`, so extension compilation needs an isolated matching toolkit rather than mutating the host default.
- Blender `4.0.2` for the established environment pipeline; isolated Blender `4.5.12 LTS` for MPFB skeletal trials; priority engine Epic UE `5.8.1`.
- The Projects LVM volume has about 236 GiB free after the isolated CUDA environment was created. That is sufficient for the revised pinned trial; repartitioning is neither required nor justified.

## Decision matrix

| Candidate | Verified upstream boundary | Decision | SHI use and reason |
| --- | --- | --- | --- |
| [VAST AI Research TripoSR](https://github.com/VAST-AI-Research/TripoSR) + [Stability AI model](https://huggingface.co/stabilityai/TripoSR) | Code `107cefdc244c39106fa830359024f6a2f1c78871`; model `5b521936b01fbe1890f6f9baed0254ab6351c04a`; code and pretrained model MIT; public 1,677,246,742-byte checkpoint; Apache-2.0 DINO v1 config `f205d5d8e640a89a2b8ef0369670dfc37cc07fc2`; upstream reports about 6 GB VRAM | **One trial complete; output rejected; not admitted** | The fully offline proof worked technically, but the generated geometry and material interchange failed the named asset gate. Keep it available only as an evaluated look-development tool; do not add it to SHI's required pipeline. |
| [Microsoft TRELLIS.2](https://github.com/microsoft/TRELLIS.2) + [TRELLIS.2-4B](https://huggingface.co/microsoft/TRELLIS.2-4B) | Code `75fbf0183001ed9876c8dbb35de6b68552ee08bd`; model `af44b45f2e35a493886929c6d786e563ec68364d`; outer code/model card MIT; pipeline requires gated `facebook/dinov3-vitl16-pretrain-lvd1689m` under the separate [DINOv3 License](https://ai.meta.com/resources/models-and-libraries/dinov3-license/) | **Paused before weight download; not admitted to production** | The repository itself is strong, but its setup script is unpinned and invokes `sudo`, its pipeline follows additional moving model references, and DINOv3's custom terms require an acceptance and legal interpretation for a warfare-themed commercial game. The isolated CUDA environment is evidence only; no TRELLIS or DINO weights were downloaded. |
| [Tencent Hunyuan3D 2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1) + [model card](https://huggingface.co/tencent/Hunyuan3D-2.1) | Upstream reports 10 GB shape, 21 GB texture and 29 GB combined VRAM; model uses Tencent Hunyuan Community License | **Deferred** | PBR output is relevant, but the full combined path exceeds one local GPU and the custom model license requires separate review. TRELLIS is the cleaner first proof. |
| [Epic Blender Tools](https://github.com/EpicGames/BlenderTools) | MIT; main `4b42ee3f639393ccb377f5c896b88d1bc996b939`; latest Send to Unreal release 2.4.3 was tested on Blender 3.3/3.6 and UE 5.3 | **Compatibility trial required before adoption** | One-click static/skeletal/groom transfer and UE-to-Rigify could help, but there is no UE 5.8/Blender 4 evidence. Test only in a copied Blender profile and throwaway UE asset path. |
| [NVIDIA Audio2Face-3D](https://github.com/NVIDIA/Audio2Face-3D) | Collection documents an MIT UE plugin for UE 5.5/5.6 plus separately licensed models | **Deferred** | Facial performance could help later cinematics, but forcing an unsupported binary/plugin into UE 5.8 would weaken the already stable package. Re-evaluate when an official 5.8 build exists and voiced dialogue is approved. |
| [Epic MetaHuman DNA Calibration](https://github.com/EpicGames/MetaHuman-DNA-Calibration) | Upstream explicitly says it does not support MetaHumans created in UE 5.6 and directs users to a Maya plugin | **Rejected for the current pipeline** | Stale engine boundary plus Maya dependency; it does not simplify the Blender/UE 5.8 production route. |
| [MPFB 2.0.17](https://github.com/makehumancommunity/mpfb2) + [MakeHuman system assets](https://static.makehumancommunity.org/asset_packs/makehuman_system_assets.html) | Code `80919fa4682335c41847f761a4d79dcad4124732`; Blender extension GPL-3.0-or-later; bundled assets and official system pack CC0; exact local system-pack SHA-256 `b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107` | **Admitted only as offline body/rig authoring baseline** | Blender 4.5.12 creates a clean 53-bone full-finger game rig and preserves armature binding through FBX. Do not use bundled modern casual clothing/hair as SHI costume, do not use community assets, and do not rely on the sample's broken absolute texture paths. SHI authors garment silhouettes and Unreal materials; all historical/facial/deformation gates remain. |
| [CharacterGen](https://github.com/zjp-shadow/CharacterGen) | Apache-2.0 code; multi-stage image pipeline and separately bounded training/raw assets | **Rejected for the current named-character blockout** | It would infer anatomy and costume from images without solving historical evidence, retopology, rig compatibility, finger deformation or data-rights review. The deterministic MPFB baseline is the smaller controlled solution for five canonical identities. |

Verified dates and compatibility statements above were checked against the official GitHub repositories, model cards and Meta license on 2026-08-10. Popularity, download count and “production-ready” marketing are not acceptance evidence.

## Skeletal baseline checkpoint

Blender `4.5.12 LTS` was installed alongside, not over, the accepted Blender `4.0.2` environment lane. Its official Linux archive is `377,902,364` bytes and passed the published SHA-256 `95e3a2dfedba3bd32ca54fc355eac6b15a11986954ccb02815a07535d0120a25`. MPFB `2.0.17` was built from exact commit `80919fa4682335c41847f761a4d79dcad4124732` into a dedicated extension profile; network access is disabled. The official `280,737,770`-byte CC0 system pack is isolated outside Git at SHA-256 `b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107`.

The neutral game-engine trial exported a 53-bone skeleton with complete three-segment thumb and finger chains on both hands. A factory-clean Blender import retained one armature, one armature-bound body, 26,756 body triangles and `1.051 × 0.430 × 1.659 m` bounds. The broader upstream sample also proved why SHI must own the presentation path: it included modern casual clothing and wrote nonportable absolute texture paths. Those assets and paths are rejected. The accepted boundary is CC0 body topology/weights plus built-in rig only, followed by project-authored garments, hair mass, role props, material graphs, pose/deformation checks and Unreal fail-closed mapping under [`DAZE_COUNCIL_CHARACTER_BLOCKOUT_BRIEF.md`](../art/DAZE_COUNCIL_CHARACTER_BLOCKOUT_BRIEF.md).

## License discovery checkpoint

The TRELLIS repository and its principal Hugging Face card both say MIT, but that is not the whole executable pipeline. Its pinned `pipeline.json` names Meta DINOv3 as the image conditioner and also names external sparse-decoder and background-removal models without revisions. DINOv3 access is manually gated and its separate agreement governs the model and weights. That agreement grants use rights but adds redistribution attribution and trade-control/end-use terms whose “military or warfare purposes” wording should not be interpreted by the art pipeline itself for a historical war game.

The controlled setup therefore stopped before any TRELLIS, DINOv3 or RMBG weights were downloaded. No login, token or license acceptance was automated. TripoSR replaces it for this proof because its official code and official Stability AI checkpoint both state MIT and the checkpoint can be fetched at the exact recorded revision without gated acceptance.

## First trial: abstract command weight

The first TripoSR candidate was a small abstract oxidized-bronze-and-stone command weight, not a claimed historical object or character. This limited historical risk and exercised the image → raw mesh/color gate before any Blender cleanup, material authorship or Unreal import. Acceptance required:

- a clean, isolated single-object input with no writing or copyrighted reference;
- a pinned model revision and hashed input; TripoSR is feed-forward, so there is no sampling seed to invent;
- retained raw GLB outside Git and a reviewed, optimized derivative only if it passes;
- no more than 20k triangles for the first in-engine LOD0 after cleanup, with lower LODs and simple collision;
- correct meter scale, origin/pivot, normals, UVs and material channels;
- no holes, floating fragments, fused background or image lighting presented as physically based material response;
- a visible Unreal package comparison with no material gameplay or performance regression.

Failure is useful evidence. A poor mesh will be rejected and documented; it will not be repaired indefinitely merely to justify the tool installation.

### Trial result — rejected before cleanup or Unreal import

The pinned TripoSR run completed on physical GPU 0 with Torch `2.6.0+cu124`. The source alpha was composited onto a neutral gray input locally; the proof replaced TripoSR's unconditional Hugging Face config lookup with a strict resolver that permitted only the hashed local DINO v1 config. The DINO tensors used at runtime were already carried by the hashed TripoSR checkpoint. No network, background-removal model, credentials or private material participated in inference.

The feed-forward reconstruction took `0.714` seconds, a 24-view neural inspection turntable took `15.516` seconds and 256³ mesh extraction took `1.271` seconds on an RTX 4090 D. Speed did not make the result usable:

- the unseen side was invented as a quilted pouch-like volume, changing the command weight's identity;
- the stone/bronze separation collapsed into rubbery relief and seam noise;
- the raw mesh had 66,041 vertices, 131,858 faces, seven components and was not watertight;
- its color/material representation did not survive a clean Blender 4.0.2 glTF inspection import;
- reducing this to the 20k-face gate would still require redesign, retopology and complete material authorship rather than bounded cleanup.

The raw GLB (`557aa17eaa5b970512b2d6c1fdf8b725c0eede1cccc8045778e748960e8923b1`) and inspection renders remain outside Git for reproducibility. They are not game assets. The result stops at the visual/topology gate and will not be imported into Unreal. The next command-weight pass is deterministic Blender authorship through AgenticApp's pinned portable Blender, using the generated input only as already-reviewed silhouette intent—not as mesh source or historical evidence.

### Deterministic replacement — production blockout accepted

The replacement was built from explicit geometry code in AgenticApp's portable Blender 4.0.2. It does not derive vertices, textures or an unseen side from the rejected neural mesh. Its 3,256-triangle LOD0, 1,384-triangle LOD1 and named 80-triangle collision hull preserve four separately named closed components and two material identities at an `84.78 × 55.52 × 34.25 mm` clean-import extent.

The review was iterative and evidence-led. A back view rejected the first ribbon because it floated over the irregular core; the path was tightened and extended beneath the stone. The first clean GLB render then exposed white material fallbacks despite a correct authored `.blend`; export now disconnects unsupported procedural color/normal links only after saving the editable source and writes explicit dark stone/bronze interchange values. A clean Blender import welds only normal-split duplicate vertices for inspection and passes manifold, winding, positive-volume, component-name, material-slot, scale, pivot, LOD and FBX collision checks.

This is the first usable object from the evaluated lane, but its status remains deliberately narrow: **approved packaged Unreal production blockout, not final art**. It is neither a TripoSR success nor a final/shipping asset. Exact Blender generation and clean-import checks are followed by an isolated UE 5.8.1 import that preserves centimeter scale, two LODs, two UV channels, two material slots and one convex hull. Forced cooking adds exactly the mesh and two materials to the accepted 496-package baseline; the resulting 499-package IoStore archive names all four cooked records and launches `ShiGameMode` cleanly in an isolated headless smoke test.

This closes the technical engine-admission loop for one object without adopting a neural repository as production infrastructure. Runtime placement, authored final Unreal PBR materials, a visible 44° council-lens inspection, scene-level performance measurement and human cinematic review remain mandatory. The repeatable generator, validator, importer, renders, exports, Unreal assets, provenance and package receipts live in the repository.

## Deterministic vegetation checkpoint

The next usable scene object deliberately bypassed neural generation. Two simple wet-field silhouette families were authored by deterministic Blender Python, inspected through clean GLB/FBX round trips, and imported as exact low-cost Unreal LODs. A texture-free 15-node engine material uses authored vertex alpha for `2.4 cm` maximum GPU-only wind; native HISM placement fixes 42 taller clumps and 64 low tufts while excluding the shelter/command center and diagonal approach.

This route was selected because an open-source image-to-3D model offered no advantage for sparse planar vegetation and would introduce invented species detail, retopology burden and material uncertainty. The result is still only a production vegetation blockout. It is useful evidence for the tool policy: choose the smallest controlled production method object by object, and accept an external AI repository only when it improves the reviewed result rather than merely adding sophistication. The exact source, clean-import validation, Unreal graphs, native hostile tests, 516-package cook and full playable-route evidence are hash-bound in `assets/provenance/shi-daze-wet-field-vegetation-v1.json`.

## Runtime game-AI policy

No external generative agent is accepted into the runtime campaign. SHI's player-visible choices, opponent reads, uncertainty, engagement commands, save/replay and historical disclosures remain deterministic and testable. Offline AI may propose prose, poses, props or shots, but canonical story and gameplay change only through the same authored schema, source-claim closure, replay corpus and review gates used today.
