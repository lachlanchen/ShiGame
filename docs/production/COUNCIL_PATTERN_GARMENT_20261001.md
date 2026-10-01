# Council independent torso pattern: deformation still rejected

This checkpoint stops deriving cloth shape from anatomical body normals.
`scripts/build-council-pattern-garment-study.py` constructs eight32-point
elliptical torso rings, removes two side panels to create dropped armholes,
then connects them to the unchanged408 distal sleeve vertices per arm. The
result is one1,060-vertex/1,040-face surface. Its silhouette and skinning are
original SHI engineering choices, not a researched Qin costume or simulated
fabric. Existing MPFB carrier provenance still applies to the body and rig.
No accepted source, runtime export or player-facing media was overwritten.

## Binding failure caught before admission

Initial candidate v1 completed its four renders, but qualification stopped on
an unknown vertex group: the recipe used `spine03`; the actual rig uses
`spine_03`. This invalid candidate remains private evidence, not an accepted
asset or a fully evaluated collision result. The corrected builder now checks
all intended torso skinning names against the source skeleton **before**
constructing the mesh. Its shoulder height and front depth were also revised
after examining the active rest body's coordinate bands. The original body
and all shape-key values remain unchanged.

## Corrected v2: actual results

Builder83772 finished with exit0; independent checker98321 finished with exit1
using `--python-exit-code 1`. The saved file was reopened separately to locate
the worst triangle. All four1280×720 frames1/46/61/121 were viewed.

- Body basis, influences, all shape-key values/coordinates, distal sleeve
  geometry/influences and53 bone matrices over121 frames remain unchanged.
- Single connected manifold surface, boundary loops32/32/24/24.
- Minimum sampled clearance **−34.10mm**, frame2, sample2089.
- Maximum edge change factor **3.581**, frame97, edge116–244.
- Minimum face area0.00018492m²; topology is not the acceptance blocker.

The torso reads less anatomically than the rejected offset shells, but the
offering pose exposes skin at the arm join and existing collar/waist trim no
longer fits. **Visually and numerically reject.** No fabric motion, historical
approval, final character identity or cinematic acceptance is implied.

The worst sample is face1029, vertices131/132/669, on the right lower armhole
join. Its two torso-bound endpoints remain mostly on `spine_03`; the sleeve
endpoint is wholly on `upperarm_r`. At frame2 their posed coordinates are
approximately(−.223,.017,1.137), (−.227,−.016,1.137) and
(−.192,−.097,1.171)m. This triangle crosses the arm rather than providing an
underarm path. The worst strained edge similarly joins the left lower armhole
to the retained sleeve. These are local join/pattern failures, not a reason to
change the established body or gesture.

Next revise the lower armhole inward toward the torso, outside the arm's sweep,
and construct an intentional gusset/transition region instead of a single
straight zipper span. Keep the accepted distal sleeve data and source motion.
Qualify rest silhouette and then all gesture frames; do not hide the body,
relax thresholds or mistake a smoother silhouette for usable cloth.

## Evidence and resource boundary

Private editable source, four captures and report:
`.runtime/council-pattern-garment-20261001-v2`.

- Pattern builder: `0db8a9137f33ca87e4c32c212df0942bd9727146d3c7dbb36e45a0803c39fd1f`
- Checker: `e1e6f77c7bb5bef6a96d5a81e54338b5fea67082db3034d1429cb2925d0f530c`
- Blend: `ba44778ead77ddf5f63c3cffded898614babc4204c183eaddbb713e229acc484`
- Report: `1324566589a1b57749c284ab7c4ceeb53744c4307ed4d01cfcdc7d4decb98708`

The wrapper corrects the parent receipt's generic body-shell boundary in the
saved receipt; the parent's console line predates that correction. Use the
saved receipt's `independentPattern` section and hashes for this candidate.
Vertex/face-centre sampling is not exact triangle or self-collision proof.

Python compilation and repository validation pass; these are tooling checks,
not asset approval. Every Blender operation was serial, background and limited
to two threads. No SHI heavy job or GUI remained after review;56GiB RAM was
available, swap57/71GiB. No obsolete SHI runtime existed to reclaim, and other
projects were untouched. No generation payment, GitHub push, deployment or
store submission occurred.
