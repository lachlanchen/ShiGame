# SHI command weight prop brief

Status: packaged Unreal production blockout accepted · final PBR/council-lens/human review open · original fictional interface prop · not historical reconstruction.

## Purpose

The command weight is a palm-sized tactile signal used in SHI's command-space grammar. It lets the player place commitment into matter without introducing paper-map spectacle, pseudo-calligraphy or an unsupported late-Qin artifact. In Chapter I it may appear as a restrained interface/diegetic-adjacent marker beside tally slips; no character should identify it as an attested object.

The prop must read in this order:

1. one dark, weighty river-stone core;
2. one hand-worked bronze staple wrapping and gripping the stone;
3. one small integrated cord eye that makes lifting and placement legible;
4. asymmetry and wear from handling, without ornament or mystical coding.

## Form and scale

- Overall target: approximately `84 × 60 × 45 mm`, including the eye; stone core approximately `74 × 56 × 34 mm`.
- The lowest contact area sits on local `Z = 0`; the root pivot is bottom-center.
- The stone is squat and stable rather than gem-like, coin-like, pouch-like or weapon-like.
- The bronze element is a functional forged staple/brace. It may overlap the stone and itself where a real binding would grip, but it cannot float.
- The cord eye remains large enough to read at the 44° council lens and small enough not to become jewelry.

## Material direction

- **Stone:** charcoal-brown river stone, high roughness, broad shallow variation, no scales, quilting, leather pores, writing or baked studio highlight.
- **Bronze:** dark worked bronze with restrained green oxidation in recesses, metallic response and hammered irregularity; no polished fantasy gold.
- Materials remain separate and authored. A generated color field is not accepted as a PBR material.

## Technical contract

- Editable `.blend` source plus GLB LOD0/LOD1 and FBX LOD0/LOD1; Unreal LOD0 uses one render node named `SM_SHI_CommandWeight_01` plus convex hull `UCX_SM_SHI_CommandWeight_01_01`.
- LOD0 under 20k triangles; LOD1 materially lower; every intended component closed, consistently wound and explicitly named.
- Meter units, applied transforms, deterministic generation, root at bottom-center and no cameras/lights/floor in exports; both render LODs require UV0 plus non-overlapping lightmap UV1.
- Clean import must preserve separate stone and bronze material slots.
- Rendered inspection must show front three-quarter, back and eye attachment. Beauty lighting cannot hide geometry.
- Unreal admission requires exact centimeter scale, both LODs, material slots, UV channels, collision, lightmap settings, forced cook, package-content proof and a clean isolated launch. Final approval separately requires authored PBR materials and visible council-lens review.

## Reproduce and inspect

Use the pinned Blender version recorded in provenance. Normal validation does not replace the accepted visual-review PNG; add `--render-preview` only when deliberately creating a new image for human review and then refresh its receipt.

```bash
/path/to/blender --background --factory-startup \
  --python scripts/build-command-weight.py -- \
  --output-root "$PWD/assets/3d"

/path/to/blender --background --factory-startup \
  --python scripts/validate-command-weight.py -- \
  --asset-root "$PWD/assets/3d"
```

With the official UE 5.8.1 build, the default importer mode inspects the existing isolated asset without saving it:

```bash
/path/to/UE_5.8.1/Engine/Binaries/Linux/UnrealEditor-Cmd \
  "$PWD/apps/unreal/SHI.uproject" /Engine/Maps/Entry \
  -unattended -nop4 -nosplash -nullrhi -NoSound -nowrite \
  -ExecutePythonScript="$PWD/scripts/import-command-weight-unreal.py"
```

Only an intentional source replacement should set `SHI_COMMAND_WEIGHT_REIMPORT=1`; that mode deletes and recreates only `/Game/SHI/Art/Props/CommandWeight`. Routine inspection must omit it. The accepted read-only run exited 0 in `inspect-only` mode and left all three tracked `.uasset` hashes unchanged.

## Rejection list

Reject pouch, purse, tag, amulet, seal, pendant, crown, animal, weapon or magical reads; written marks; regular industrial machining; noisy generated relief; fused background; unreviewed historical claims; floating eye or band; non-watertight production geometry; and cleanup whose cost exceeds deterministic re-authoring.

The preceding TripoSR trial failed this brief by inventing a quilted pouch-like unseen side and unusable topology. Its raw mesh is not a source asset. The deterministic Blender pass may use only the already-approved high-level silhouette intent: dark stone, bronze grip and one cord eye.

## Blockout review result

The deterministic Blender 4.0.2 pass is accepted as a production blockout, not final art. Clean re-import of both GLBs and the FBX verifies an `84.78 × 55.52 × 34.25 mm` rendered extent, four closed consistently outward-wound render components, separate stone/bronze material slots and the named 80-triangle UCX collision hull. LOD0 is 3,256 triangles; LOD1 is 1,384 triangles. The back inspection caught a floating first band arc, and the first clean GLB inspection caught white interchange materials; both source defects were corrected before acceptance.

The editable `.blend` retains the authored procedural lookdev materials. GLB/FBX exports deliberately carry explicit dark stone and bronze fallback values because procedural Blender nodes are not a portable PBR contract. The clean-import render proves that fallback path. Machine results live in `assets/3d/source/shi-command-weight-v1.validation.json`; complete hashes and remaining Unreal/final-art gates live in `assets/provenance/shi-command-weight-v1.json`.

Isolated Unreal 5.8.1 admission now passes. The imported static mesh preserves the `8.478 × 5.552 × 3.425 cm` bounds, 3,256/1,384-triangle LODs, two UV channels on both LODs, two exact material slots, one convex collision hull, 64-pixel lightmap resolution and UV1 lightmap coordinate. Nanite remains deliberately off for this 3,256-triangle palm-sized object. A clean Linux BuildCookRun produced 499 packages—exactly the accepted 496-package baseline plus the mesh and two materials—and the IoStore response names the mesh, bulk geometry and both materials. The isolated archived player mounted all 499 packages, initialized `ShiGameMode`, loaded the entry map and exited by command with code 0.

This result is technical and deliberately narrow. The object is not yet placed in the council runtime, its Unreal materials are production-blockout fallbacks, and no packaged visible frame proves contact, response or readability through the canonical 44° lens. Those material, scene-performance and human cinematic gates remain red. The import/package receipts are recorded in `docs/production/evidence/unreal-command-weight-import-status.json`.
