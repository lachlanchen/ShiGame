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

## Stationary pre-roll: sampled startup contact resolved

The builder now supports a bounded0–60-frame stationary pre-roll. An initial
negative-timeline attempt (v2, handle42834) stopped with exit1: it produced149
cache files where151 were required, with the initial negative frame and frame0
absent. Preserve that incomplete private bake; it has no qualification receipt
or rendered acceptance claim. The cache-count gate was not reduced to match it.

The successor uses only positive simulation frames. In its private copy, every
rig key and interpolation handle is offset by30 frames. Visible frameN maps to
simulation frameN+30, so the displayed gesture has its original timing; the
accepted source action/file is never modified. The builder verifies that the
pre-roll holds the original first pose. The independent checker also verifies
that stationary hold after reopening and compares every visible pose to the
original121-frame/53-bone baseline. No first visible frame is omitted.

V3 builder42642 exit0 produced all151 cache files and four reviewed captures.
Checker30391 exit1: minimum sampled clearance**+5.685mm** across all121 visible
frames; maximum bone matrix error0; edge change factor**3.158** still fails at
visible frame32, edge134–336. Thus the startup sampled contact blocker is removed,
not the full garment acceptance blocker.

V4 tests compression stiffness30 instead of15, with the same geometry, gesture,
30-frame pre-roll and unchanged3× acceptance bound. Builder39526 exit0 and
checker20974 exit1. All151 cache hashes were verified; the reopened pre-roll
and all visible poses match the original first pose/baseline as applicable.

- Minimum sampled body clearance**+5.685mm**, worst visible frame46.
- Maximum edge change factor**3.148**, worst visible frame39, edge134–336.
- Minimum face area0.000032193m²; original body/morphs/distal binds unchanged.

The stiffness change does not materially resolve the compressed join. **Do not
continue increasing solver stiffness to force this pattern through the gate.**
Revise the underarm transition rest shape/ease and inspect that specific edge.
It spans approximately(−.170,−.079,1.140) to(−.198,−.080,1.147)m at rest;
simulation shortens it to about31.8% of rest length. Keep the positive-timeline
pre-roll and unchanged original gesture for the next pattern test.

All four v3 and four v4 stills were viewed. Skin exposure is no longer apparent
at the earlier gap in these views, but collar/belt pieces still detach/intersect
and the costume remains an untextured engineering carrier. There is no exact
triangle/self-collision proof, continuous-motion review or cinematic admission.

V3 evidence: `.runtime/council-cloth-garment-20261001-v3`.

- Blend: `37eab028f9aaa07b97383b422a69e06fb3f018d6e80151d41a1ae9ee142ced78`
- Report: `aa5d9fbe1b6c694ff65cc775d533be33ed5d43fb7c05b1634a8ab899bf925b91`

V4 evidence: `.runtime/council-cloth-garment-20261001-v4`.

- Builder: `04ae813064692bf7c1ee062b74a0b18842dc6ce7e2ef22b26b28a5f4f4b4dcb0`
- Checker: `804905cfcc6ad6ecd65792fa89096571ae7176e591c1ecb7bf18f8b912cb4c87`
- Blend: `6538275f390e6de826bb93e256e6b0e73312161761742bee672956c9a3a04326`
- Report: `8776247afb6f3a4389f9162356661cc026e06710b4b242276c0ce75045730355`

Earlier receipts/reports remain untouched and identify their historical recipe
hashes; the pre-roll builder has evolved since v1. Commit888b9e9 retains the v1
recipe/checker for historical reproduction. Current builder defaults preserve
the no-pre-roll/stiffness15 settings but produce new source hashes.

All owned jobs are terminal, with no GUI or noVNC launched.54GiB RAM available,
swap56/71GiB at postcheck; other projects and inherited dirty work untouched.

## Rest-ease correction: sampled engineering checks pass

`scripts/build-council-fitted-gusset-study.py` changes only the144 transition
vertices, reducing radial ease about each ring centre by a tapered maximum5mm.
It does not project onto the body, change weights/topology, alter the original
gesture or change the816 retained distal sleeve vertices. The parent recipes
are unchanged and their hashes remain in the layered receipt. The checker
also verifies the new fit wrapper's source hash.

Pattern builder17602 exit0 produced a fresh source and four inspected stills.
They retain the known skin exposure before cloth simulation; this unbaked
candidate is not admitted or independently collision-qualified. Cloth
builder11320 exit0 then baked151 frames with the30-frame stationary pre-roll
and original compression stiffness15, not the ineffective30-stiffness variant.
All four resulting cloth stills were inspected.

Checker78714 reopened the fitted cloth and completed with **exit0**:

- Minimum sampled body clearance**+5.685mm** over all121 visible frames.
- Maximum edge change factor**2.557**, below the unchanged3× gate.
- Minimum face area0.000005055m², above the unchanged lower bound.
- Body basis/influences/morphs and distal binds unchanged; all53 original bone
  poses match exactly after the explicit visible-frame mapping, error0.
-151 cache files hash-verified; reopened pre-roll holds the original first pose.
- Single manifold surface, boundaries32/32/24/24.

This resolves the previously identified **sampled contact/compression engineering
blocker** for the council offering gesture. It does not prove exact triangle
or self-collision safety, historical dress, acting, final likeness or cinematic
quality. Collar and waist trims still intersect/detach, and the workbench
materials are not a finished costume. **No game/movie admission yet.**

Fitted source `.runtime/council-fitted-gusset-20261001-v1`; fitted bake
`.runtime/council-fitted-cloth-20261001-v1`:

- Fit wrapper: `128aa8795fc535c8dac319f69e86660bc9d2dc97d523b3234fcf24086b702c55`
- Checker: `873dca54780282f4678e220a63a2129b5aef20891b5eef516f630a5d18b949e3`
- Unbaked blend: `476278ea31424ca6ccc026a01d61a9bde37a603899be51feda6201b6d6a2eb26`
- Baked blend: `85d99af3e36a48e83b685b1ef598229dbb5c218611b47b0a068a1cbde8257164`
- Passing report: `fd694e5e43d9c5ac3770fe3d62b2007f8c2fbeb5e4ee0bafd336b090539e177e`

## Full motion preview produced, not yet accepted

`scripts/render-council-cloth-motion-review.py` requires the passing report,
its current checker hash, matching input blend and every cache hash. Renderer
99296 exit0 rendered **all121 visible frames** from the reopened bake, without
changing action, solver or input file. Its frame receipt records every PNG hash.
Serial ffmpeg encoder77577 exit0 produced a private silent1280×720 H.264 preview,
30fps/121 frames/4.033333s, verified by ffprobe. A13-frame overview sampling
frames1/11/…/121 was inspected; collar/waist mismatch remains apparent.

Preview: `.runtime/council-fitted-cloth-20261001-v1/motion-review/council-cloth-motion.mp4`.

- Renderer: `a006f759a585ea76df3e05af00e57f0a1e0f64c7f57db5ff906b9832ee9ef19a`
- Frame receipt: `3ef55707eeb9ffaeed819d004432b81486efd6fc29537f864184a37bca31f99e`
- MP4: `1a4f176046a4d90455e9df096f5f6418ce9dd30450bf1767b95d1a404c8abd5b`

Producing the movie and viewing sampled stills is **not** continuous playback
or human motion acceptance. Next solve trim attachment and inspect continuous
motion, then refine materials and period costume before integrating council
media. No audio, store build or public deployment was changed.

All owned Blender/encoding jobs are terminal.56GiB available RAM, swap56/71GiB
at postcheck. No SHI GUI/noVNC stack, obsolete owned runtime or foreign cleanup.

## Follow-up: trim ownership

The [torso-owned trim checkpoint](COUNCIL_TORSO_TRIM_20261001.md) fixes waist
anchors accidentally attached to sleeves, with independent 121-frame checks
and a rendered preview. Strap clipping and final visual approval remain open;
the follow-up does not change this cloth qualification or admit a game asset.
