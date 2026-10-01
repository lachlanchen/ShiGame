# Council costume: torso-owned trim checkpoint

October 1, 2026. This removes a specific deformation defect in the upcoming
council offering gesture. It is a private engineering study, not a new playable
scene, final character, historically approved costume, or store update.

## Defect and correction

The first attachment experiment cast waist rays against the whole garment.
Lowered sleeves intercepted some rays before the torso, so raising a hand
pulled the belt toward the forearm. Surface proximity alone was insufficient.

The corrected builder restricts candidate triangles to the authored torso:
244 vertices and 400 evaluated triangles, derived from the hash-checked pattern
and gusset recipe. Collar and belt vertices use fixed barycentric anchors with
3/5/4 mm normal offsets. No per-frame nearest-point switching is used. The
qualified cloth cache is shared by a symlink, not copied, freed or resimulated.

## Reopened checks

The independent checker imports no builder code. It opens the qualified cloth
source and candidate separately, evaluates all 121 visible frames, and checks:

- Every anchor belongs to a real authored torso triangle, never a sleeve/gusset.
- Finite normalized weights and expected object/vertex/face inventories.
- Exact evaluated cloth, body and 53-bone pose hashes against the source.
- All 151 shared cache files and source/report/recipe hashes.
- Maximum attachment error below 0.01 mm, noncollapsed trim triangles and
  edge-length change below a factor of 3.

Candidate v3 passed with maximum attachment error `9.313225746154785e-10 m`,
edge-length change factor `1.8053115901569874`, and minimum evaluated triangle
area `0.00012422177410054052 m²`. The previous v2 candidate exits 1 with
`Anchor targets sleeve/gusset instead of authored torso`, providing a regression
test of the actual defect rather than merely its metadata.

## Render review and remaining work

The updated renderer accepts either the existing qualified cloth report or the
distinct qualified trim report. It checks the relevant checker, blend, source
and cache hashes before rendering into a fresh directory.

All 121 frames were rendered and encoded as a silent 1280×720 H.264 preview at
30 fps, 4.033333 seconds, verified with ffprobe. Agent review of the supplied
four poses and additional frames 31/91 confirms the belt no longer stretches
to the wrist. The satchel strap still protrudes through the torso; trim ends
show apparent occlusion in later poses. Vertex attachment does not certify
whole-face clearance or self-collision. Materials, silhouette, period costume,
character identity and acting are not final.

Producing a continuous file and inspecting individual frames is not continuous
playback or human acceptance. No study asset was admitted to game content or
published media. Next address strap/trim surface fit, then review movement and
art direction before scene integration. Preserve the qualified underlying
movement and cache rather than restarting simulation without evidence.

## Reproduction

Use the existing Blender 4.5.12 installation with `--background`,
`--disable-autoexec`, `--threads 2`, and `--python-exit-code 1`. After the shared
workstation preflight, run these scripts serially:

1. `scripts/build-council-attached-trim-study.py -- --study <qualified-cloth> --output <fresh-trim-study>`
2. `scripts/test-council-attached-trim-study.py -- --study <fresh-trim-study>`
3. `scripts/render-council-cloth-motion-review.py -- --study <fresh-trim-study> --output <fresh-preview>`

Run the checker against a rejected study with `--report <fresh-report.json>`
to retain negative evidence. Never overwrite earlier reports. Original private
studies and linked cache dependencies remain outside Git; source scripts and
this bounded record are the publication checkpoint.

## Evidence identity

| Item | SHA-256 |
| --- | --- |
| Qualified cloth blend | `85d99af3e36a48e83b685b1ef598229dbb5c218611b47b0a068a1cbde8257164` |
| Corrected trim blend | `b723d1e6a0191dbdf32f4fc41f9df5630bc6d977c8b2f1ca82fe5b8ba9791355` |
| Builder | `4c251e2a58ec38e81ece1fa0034db1e5df05d695cc62bae442ab422af647bdc3` |
| Independent checker | `6c6315942a28d86be877a069ed706ad5811121cb0cc5694f87744e03332ec597` |
| Passing report | `0e69268f446ddba5053324f43b41cb614d5b997c0d14cd5e2f7d3a0aff3fa54a` |
| Frame receipt | `0da2362e7b6df91206d4ed3345f8add632a3254c2003d15588bcf95bacc1aef0` |
| Private MP4 | `749daf4395a7794c9057d4eb7c43818d850f31338e522a2b8cbbba3bc15e858b` |

No history, shared narrative, localization, public asset admission or mobile
signing state changed. The live game remains the previously validated release.
