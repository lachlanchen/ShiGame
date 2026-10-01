# Council gusset and bounded cloth bake

This checkpoint advances the named council offering-gesture blocker from a
straight armhole join to an eased transition and an actual cloth simulation.
Neither candidate is admitted to the game. Existing body, morphs, rig, gesture
and distal sleeve bind data are preserved. Geometry/motion recipes are original
SHI work on the existing MPFB carrier; no new historical costume or likeness
claim is made. No private book passage or public narrative was changed.

## Curved transition candidate

`scripts/build-council-gusset-garment-study.py` wraps the independent pattern
recipe without modifying it. It pulls the lower side panel inward with a
bounded30% falloff and adds three24-vertex transition rings per arm, with up
to25mm radial ease. Original distal sleeves are reordered to the final816
vertices for exact independent comparison. The result has1,204 vertices and
1,184 faces, one manifold surface and four boundaries32/32/24/24.

Builder84904 exit0; checker65454 exit1. All four saved frames1/46/61/121 were
viewed. The join is more cloth-like at rest, but exposed skin remains in the
offering pose. Minimum sampled clearance improves from the straight pattern's
−34.10mm to **−7.24mm**, frame61. Edge change factor**4.515** still fails, largely
through compression at frame47, edge248–272. **Reject; no runtime admission.**

Evidence: `.runtime/council-gusset-garment-20261001-v1`.

- Gusset builder: `25eeca407e1e1357fe01a9778835d6421f311c5cc122238c7dd7457821716a41`
- Blend: `4a41a5dcaa964e7d6e3f1ead5652aed2352b8548b7f86e1194cb4576d51423de`
- Report: `7ff84720e68a1b29c299ad10d34b9da197cfeaabfb1cd42ea85c7a62045b7656`

## Actual cloth simulation, reopened and checked

`scripts/build-council-cloth-garment-study.py` loads that saved gusset, adds a
cloth modifier after armature skinning and a body collision modifier in the
private study. Neck, waist and distal sleeves are pinned to the existing
animated target. The remaining cloth is free to resolve contact and gravity.
The original accepted source file is never edited.

Solver quality8, collision quality4, mass0.20kg, tension/compression stiffness15,
shear5 and bending0.5. Contact distance8mm/body outer thickness6mm, self-distance
5mm. These are experimental settings, not measured fabric properties. All121
frames were actually baked to121 local `.bphys` files, each included by hash in
the receipt. A new saved blend and four actual rendered stills were produced.
This is not a claim based on enabling a modifier or naming a tool.

Builder84686 finished exit0. Checker94261 reopened the blend, required a baked
cloth cache, verified all121 cache hashes and re-evaluated the121 gesture
frames. It treats the explicit cloth pin group separately from bone influences;
all skinning influences must still normalize and use known bones. Each retained
distal sleeve vertex must have exactly1.0 pin weight. Body basis/influences,
all shape-key data, distal bind geometry/influences and all53 bone poses remain
unchanged. Actual simulated positions are independently measured, not assumed
to match those binds.

- Minimum sampled clearance **−1.98mm**, frame1, sample1357.
- Frames2–121 all have positive sampled clearance; their worst is **+3.19mm**,
  frame2. This does not prove exact triangle or self-collision safety.
- Maximum edge change factor **4.576**, frame2, edge133–334; compression fails
  the unchanged3× bound. Minimum face area0.000007584m².
- Checker correctly exits1 and records rejection. Startup is not waived or
  silently skipped.

Agent inspected all four cloth stills. The earlier exposed underarm gap is no
longer apparent in the offering captures, but collar/belt components intersect
or detach as the torso cloth moves. No continuous-film, human acting, fabric,
historical or cinematic acceptance is claimed from these four stills.
**Keep private and rejected.**

Evidence: `.runtime/council-cloth-garment-20261001-v1` (about57MiB, including
editable source and cache).

- Cloth builder: `fd5ee8a88c1ee18d0b386127adceda03ba0eb6719e9c72d9130442d5e07e712d`
- Extended checker: `20a812f4570e4b4bb3935ad5e19e358f3c3c4ad0052e1bceab798b42b2f8faf5`
- Blend: `e6a9a690d3160ab05c5d7c9f5d8eac579b2b975958476edd18af9f34a2540eba`
- Report: `da7c72b4817daadc070b6383f4946b2d004e65b6ad599fd4b1fca7e96581c2f6`

## Next blocker and cleanup

Add a stationary pre-roll so cloth can settle before the first visible frame,
then inspect the compressed transition edge and adjust the rest pattern if
necessary. Keep evaluating every visible frame including frame1. Collar and
waist trims need a coherent attachment/drape solution, not removal of visible
body or cropping. After numerical qualification, review continuous motion,
materials and researched costume before any movie/game integration.

All Blender jobs were serial/background/two-thread and are terminal. No SHI
GUI, player or noVNC stack was launched.55GiB RAM available, swap56/71GiB at
postcheck; no obsolete SHI runtime was available to reclaim and foreign
services were untouched. No paid generation, public push/deployment or store
submission occurred. Inherited dirty paths were not edited or staged.
