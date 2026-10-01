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

## Active-rest-shape correction, v2

Inspection found nine source shape-key blocks, including the basis, with eight
active keys. The first connected recipe fitted the unmorphed basis while the
visible body used those active morphs. Evaluated rest vertices differ from the
basis by up to62.08mm—larger than the18mm shell offset. The body already uses
dual-quaternion skinning, so a linear-versus-DQ mismatch was not the cause.

`scripts/build-council-morphed-garment-study.py` now supplies the actual evaluated
rest shape to the unchanged connected recipe. It checks identical vertex/face
topology and vertex influence data, temporarily uses that mesh for fitting, and
restores the original body datablock and pose mode in `finally` before save and
render. No morph value, body vertex, skeleton or gesture is edited. This is not
nearest-surface projection, body masking or changing the character to fit cloth.

Actual v2 carrier:2,669 vertices/2,652 faces,38 vertices per armhole. The independent
checker now compares **all body shape-key values and coordinates** in addition
to its previous basis, influence, distal sleeve and121-frame/53-bone checks.
All those preservation checks pass. The candidate still rejects with exit1:

- Minimum sampled clearance**−13.98mm**, worst frame75, vertex1167.
- Maximum edge change factor**3.360**, worst frame46 at armpit edge119–120.
- Four boundary loops56/50/24/24; one connected surface, no collapsed rest edges.

The correction reduced stretching from7.179× to3.360× but did not clear the3×
bound or remove penetration. Agent inspected all four v2 renders: the armpit
opening is smaller, but the shell remains too anatomical/tight and trims still
do not follow it as convincing cloth. **Do not admit this candidate.** V1 and
its original reports are preserved; the extended checker also rechecked v1
into a fresh shape-regression report with the same numerical rejection.

V2 files remain in `.runtime/council-connected-garment-20261001-v2`:

- Morph-fit builder: `7b9214b1d66f8f5f45988cb72b27c31ebbe01f4ecb50250e7d3b5b3b10a60c67`
- Extended checker: `0c04f61381689c628793810347df83ca6943bcde763493fd1de7cb832d49ee8a`
- Blend: `a80111ddacad7775953df8d3b45f67e2211d346bcfdf59584a5166c9f887a2db`
- Report: `f5f385aebe5083c9c290c7b4d1c30d3e06f094597a1aa90f03352ae5dec87c67`

Fit against the active rest body in subsequent pattern work. The remaining task
is cloth allowance and the underarm weight transition, with the same collision/
strain limits and a convincing silhouette—not more basis-shape shells or a
relaxed acceptance threshold. No new historical, cinematic or release claim.
