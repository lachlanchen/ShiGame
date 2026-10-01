# Council connected shoulder carrier: rejected fit

This checkpoint replaces independent shoulder projection with an actual
connected torso/armhole mesh for the keeper's council offering gesture. It is
private engineering work, not finished cloth or a shipping cinematic asset.
No accepted game asset, source body, motion, character identity or engine export
was overwritten.

## Produced and reviewed

`scripts/build-council-connected-garment-study.py` copies a coherent upper-body
surface with an18mm rest offset, clips neck/waist/armholes and joins each40-vertex
armhole to the retained24-vertex sleeve section using a monotone zipper. It does
not collapse the armhole vertices onto nearest body points. The original distal
17 sleeve rows per arm remain unchanged. The source body stays visible; no body
mask conceals collisions.

Actual saved candidate:2,721 vertices,2,696 faces; one connected manifold surface
with only neck, waist and two cuff boundaries. It is a skin-weighted fitting
carrier, not a historically authenticated garment pattern or cloth simulation.
Body/rig derive from the existing MPFB carrier with the existing provenance;
mesh procedure and motion are original SHI work. This does not admit a final
costume, likeness, material or historically justified shape.

Private editable blend and four1280×720 renders are retained in
`.runtime/council-connected-garment-20261001-v1`. Agent inspected all four frames
(1,46,61,121). Shoulder continuity is improved, but the torso is conspicuously
skin-tight, the armpit exposes penetration, and the existing costume trims do
not fit the new carrier. **Visually reject; no movie integration or asset admission.**

## Independent measurements

`scripts/test-council-connected-garment.py` reopened both source and saved study,
compared all53 bone matrices across121 frames, checked body basis/weights and
retained distal sleeve basis/weights, verified topology and normalized weights,
then sampled all vertices and face centers against the posed body.

- Body and distal sleeves unchanged; maximum bone matrix error0.
- Boundary loops56/46/24/24, Euler characteristic−2, single connected component.
- Minimum sampled body clearance**−16.38mm**, worst frame48.
- Maximum edge length change factor**7.179**, worst frame46 at armpit edge96–266.
- Minimum face area0.00000003236m²; no collapsed rest edges.

Both penetration and strain exceed the candidate engineering gate. Preserving
the topology and gesture does not make this a suitable costume. Vertex/face
sampling also does not establish exact triangle or self-collision safety.

The first checker correctly wrote a rejected report but Blender's default
process exit remained0 after the Python exception. The explicit successor used
`--python-exit-code 1`, wrote a separate fresh `verification-rejection.json`, and
returned**exit1**. Retain this flag for unattended Blender qualification; never
interpret process exit0 alone as asset acceptance. No earlier report was replaced.

Hashes:

- Builder: `320a1d1137db463d03ac50cf9800c66984b8e12c52e1e650a48dec4fcc6e5119`
- Checker: `005f2ae2629d170c2e1f1c79dc2f70dbc55e1f7a45fa42e0ad9128e342943621`
- Blend: `4b38344db70342756b57cfb9deb67a597004e41f025b777c71ca0d06f9373043`
- Rejection report: `8b6a4751be416fb63eff3290dbdc14c4ad803c0df294afa4d0471653417ccad1`

## Next named blocker

The connected mesh solves the separate-piece topology, not the armpit deformation
or drape. The worst edge is a roughly1.36mm rest edge near the upper-arm/torso
weight transition; it grows about7.2× in the offering pose. Next revise the
armhole/underarm pattern and local weight transition, with real cloth allowance,
while retaining the known elbow solution. Do not relax the collision/strain gate,
hide the body, crop the failure or call the skin-shell a finished period costume.

One serial background Blender job ran at a time, two threads. No GUI/noVNC,
model generation or store/publication action. Post-check no SHI Blender process
remained;56GiB available RAM,57/71GiB swap. The high shared swap was observed;
no obsolete SHI-owned runtime was present and no other project's service was
stopped. Original source and all rejected evidence are preserved.
