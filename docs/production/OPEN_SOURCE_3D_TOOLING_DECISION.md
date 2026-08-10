# Open-source 3D and environment tooling decision

Status: living production decision · reviewed 2026-08-10 · tools do not waive asset admission.

## Admitted now

- **Blender 4.0.2** remains SHI's pinned deterministic mesh/source/render tool. It is already exercised by clean GLB/FBX round trips, topology checks and Unreal package evidence.
- **Blender 4.5.12 LTS + MPFB 2.0.17** are admitted as an isolated skeletal-character authoring lane, not as a replacement for the established environment lane. Blender's official `377,902,364`-byte Linux archive passed its published SHA-256 (`95e3a2dfedba3bd32ca54fc355eac6b15a11986954ccb02815a07535d0120a25`). MPFB is pinned to Git commit `80919fa4682335c41847f761a4d79dcad4124732`, requires Blender 4.2 or newer, and runs offline in a dedicated user-resource/profile tree. Its GPL-3.0-or-later code stays outside Git; only output from the CC0 basemesh/rig assets may enter SHI. A clean trial preserved a 53-bone full-finger game rig and 26,756-triangle armature-bound body through FBX. Project-authored garment silhouettes and texture-free Unreal materials remain mandatory.
- **Material Maker 1.7** is installed outside Git in the user's local application-data directory (`.local/share/appautoaction/material-maker/1.7`). Upstream release: <https://github.com/RodZill4/material-maker/releases/tag/1.7>. It is MIT-licensed and can export PBR targets for Unreal. It is admitted as an optional inspected material authoring tool, not as a source of community-library assets with unknown individual provenance.
- **Unreal 5.8 PCG/Landscape/Niagara** remain preferred over another plugin when the bounded chapter scene can be expressed with engine-native systems and deterministic source assets.

## Evaluated, not yet admitted to packaged content

- **PCG Extended Toolkit** (<https://github.com/PCGEx/PCGExtendedToolkit>) is a useful MIT extension to Unreal PCG, but SHI's current 24 m command-space scene does not need its 200-plus-node dependency surface. Reconsider for large formation/settlement route generation only after a measured native-PCG limit.
- **Microsoft TRELLIS / TRELLIS.2** (<https://github.com/microsoft/TRELLIS>, <https://github.com/microsoft/TRELLIS.2>) and **Tencent Hunyuan3D 2** (<https://github.com/Tencent/Hunyuan3D-2>, <https://huggingface.co/tencent/Hunyuan3D-2>) can accelerate silhouette exploration. No generated mesh may enter the game directly. Character candidates still require input-rights records, model/dependency license review, historical item review, anatomy and clothing review, retopology, UVs, LODs, skinning and real deformation tests.
- **CharacterGen** (<https://github.com/zjp-shadow/CharacterGen>) is not admitted for the five-character council blockout. Its Apache-2.0 code does not remove the multi-stage image inference, raw-data redistribution, anatomy, invented-costume, topology, rigging or deformation gates. A deterministic CC0 body/rig baseline is smaller and more inspectable for this named use.

## Decision rule

Install or vendor a tool only when it removes a demonstrated production bottleneck, has a reviewable license, supports a pinned version, emits inspectable editable outputs and survives the same packaged-game evidence as hand-authored work. Popularity, model-card screenshots and repository stars are not asset approval.

For the wet-field environment gate, deterministic Blender geometry plus isolated Unreal PBR graphs are the source of truth. For the council-character gate, MPFB may reduce anatomy and skin-weight setup only; it does not author SHI's costume, hair, identity, material or performance. Material Maker is available for a later texture-set experiment, but no generated normal or albedo is admitted until full-resolution tiling, relighting, scale and baked-lighting checks pass.
