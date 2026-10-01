# Council relaxed-gesture study

2026-10-01. Private engineering candidate, not an admitted game asset.

The previous motion review rejected the reference-like arm silhouette. This
checkpoint authors a separate FK pose study on the same accepted 53-bone keeper
carrier: arms down at rest, a right-arm explanatory gesture, a short hold, and a
return to rest. Cubic easing defines the phase envelope; all 121 source frames
are baked to a new in-memory action. Original torso/finger animation is retained.
Bone aiming preserves the original roll instead of guessing mirrored Euler
signs. The second revision aligns the wrist with the forearm as well.

The source blend, accepted actions on disk, meshes, character identity and
campaign state are not overwritten. The study is reproduced procedurally rather
than committed as an unreviewed binary. No historical etiquette claim is made.

## Observed result and limits

Inspected first/peak frames of revision 1, peak frame of revision 2, and revision
2's eight-frame contact sheet. The resting silhouette is less reference-like,
and the arm gesture is visibly distinguishable from rest and return. Revision 2
still has a somewhat downward-looking hand/finger silhouette. Blocky clothing,
facial acting, sleeve deformation/contact, full temporal performance and council
staging remain unaccepted. Static inspection cannot establish natural movement
or emotional resonance. Do not ship or automatically substitute this footage.

The complete 48-frame silent H.264 movie decodes successfully. Across all 121
source samples, root and both feet match the accepted-action review within one
micrometre; sampled foot displacement is zero. The gesture hand travels
0.326835 metres from rest with maximum sampled speed 0.558567 metres/second and
returns within one millimetre. These are bounded motion diagnostics, not acting
approval or a mesh-intersection test.

Eight local artifact regression tests pass, including rejection of wrong author
identity, root drift, feet shifted together without sliding, removed gesture,
false hold phase, frame hash mismatch and nonfinite landmarks. The first fixture
attempt hit a cross-filesystem hard-link error; generated fixtures now use copies
and are cleaned from their exact temporary directories. No user files removed.

This advances the named council performance blocker, not a new playable beat.
The movie remains unused engineering evidence and is not counted as finished
game content. Next: wrist/finger expressiveness and costume deformation review,
then temporal review, council scene staging and shared-engine integration.

## Reproduction

First reproduce the accepted-action baseline using
`COUNCIL_MOTION_FILM_REVIEW_20261001.md`. Set `SHI_BLENDER_BIN` to the verified
shared Blender 4.5.12 executable, then use a new study output directory:

```bash
"${SHI_BLENDER_BIN:?Set the shared Blender executable}" \
  --background --disable-autoexec --threads 2 \
  assets/3d/rendered/shi-daze-council-performance-v1.blend \
  --python scripts/render-council-relaxed-gesture-study.py -- \
  --output .runtime/council-relaxed-gesture-20261001-v2
ffmpeg -nostdin -v error -framerate 12 \
  -i .runtime/council-relaxed-gesture-20261001-v2/frame-%03d.png \
  -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -movflags +faststart \
  .runtime/council-relaxed-gesture-20261001-v2/speaker-study.mp4
node scripts/validate-council-motion-film.mjs \
  .runtime/council-relaxed-gesture-20261001-v2 --relaxed-gesture
node --test scripts/test-council-motion-film.mjs
```

Both Blender sessions (94754, 77045) exited 0, serially. Current private study is
revision 2; revision 1 is retained as the immediately previous comparison. No GUI,
noVNC or player was started. Post-run memory: 62 GiB available, 64/71 GiB swap;
no owned Blender process remains. Existing dirty paths and other projects were
preserved. No gameplay, save, release, store or public website changes occurred.
