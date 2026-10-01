# Council palm-up temporal candidate

The keeper's offering-hand blocker identified by the wrist close-ups now has a reproducible moving candidate. `scripts/render-council-palm-gesture-study.py` builds the relaxed gesture in memory, snapshots its wrist matrices, and blends the reviewed +90° axial roll through the existing cubic offering envelope. Frames 1–16 remain neutral; 46–61 hold palm-up; 101–121 return to neutral. It keys the rotation before render evaluation. Neither accepted source nor previous study is overwritten.

Run with the verified Blender 4.5.12 installation, `--background --disable-autoexec --python-exit-code 1 --threads 2`, the accepted council performance blend, and `-- --output` pointing to a new private directory. The reference output is `.runtime/council-palm-gesture-20261001`. Encode its 48 PNG frames at 12 fps with H.264, yuv420p and faststart.

## Evidence

- Blender execution 73016 exited zero; 48 images rendered.
- FFprobe: silent H.264, 640×360, 48 frames, four seconds. Full FFmpeg decode exited zero.
- Movie SHA-256: `b29315db772204634c5d6e7309562c76e846cef485f9dd2e4cde576eda59650d`.
- Receipt SHA-256: `292da1b91c29351a0add777cadf5ce76bdfcff435004848a1996402f703892db`.
- `node --test scripts/test-council-palm-gesture.mjs`: four tests passed. All 121 wrist samples retain their requested rotations, endpoints return to neutral, and root/feet/hand origins match the prior relaxed study within 1 µm. Author and frame hashes bind the current output. Negative checks reject lost rotations, drift and nonfinite values. These are local artifact tests and require the named generated studies; they are not portable CI substitutes.
- Beginning, peak and final render frames were visually inspected. The peak reads as an open palm rather than a dropped edge-on hand; the final pose returns to rest. Static sampling and decoding do **not** establish a complete temporal/human acting review.

The source carrier SHA remains `feb52d4080cdfd0cdfa212fb4ec92a427ba676a6fba84fe74f3ac0f165eab743`. Blender ran serially as the only SHI heavy job after a 56 GiB available-memory preflight; no GUI stack or foreign process was used or stopped.

## Admission boundary and next work

### Finger-spread refinement

The current author now converges index/ring/pinky proximal directions toward the middle finger by `0.65 × envelope(frame)`, leaving the thumb and middle-finger pose unchanged. This reduces splay without inventing a grip. The wrist diagnostic accepts bounded `--finger-closure` values from 0 to 0.75 for reproducible close-up comparison. The +90° close-up at 0.65 was inspected; finger spacing is reduced, although the palm remains flat and no prop contact is established.

Current generated candidate: `.runtime/council-palm-fingers-20261001`; movie SHA-256 `149d0d7bf2974bc17693852a4207613eec88ea0cd09351cafdded96267b7daad`. Close-up: `.runtime/council-finger-closure-20261001/wrist-+90.png`, SHA-256 `8545a72cb4115c4194924c7e97834168941eb4af885878414889a5721b7d37d4`. The movie has 48 H.264 frames, 640×360, four seconds, no audio, and fully decodes. Both Blender jobs exited zero; no overlapping SHI render job or GUI stack was launched. Memory preflight was 67 GiB available with high swap; no obsolete SHI process was found or foreign process stopped.

All six artifact tests pass against the new candidate, now the test's default directory (`SHI_PALM_STUDY` overrides it). They also check the requested convergence envelope and its return to zero. They do not measure actual finger-joint angles or certify collision-free fingers; the close-up and sampled peak provide limited visual evidence only. The earlier candidate and its evidence remain historical, not current-author hash matches. No private game film was replaced and no release asset was admitted. Remaining work includes finger curl/weight, sleeve deformation, complete temporal review and actual scene staging.

### Temporal curve follow-up

The local artifact suite now has six passing tests. It independently checks every requested roll against the specified cubic envelope, not only the four phase endpoints. Measured peak roll speed is 134.8°/s; finite-difference peak acceleration is 504°/s² at 30 source frames/s. Diagnostic bounds are 140°/s and 600°/s², respectively. These are bounds for this authored study, not biological or historical standards. Negative tests inject a mid-gesture snap and movement during settle, hold and return; all are rejected even though endpoint checks alone would accept them. The existing per-frame evaluated-pose error and render hashes remain separately checked. This closes a numerical continuity gap; it does not replace viewing the complete motion or checking cloth/skin deformation.

This advances the named keeper/council animation, but remains private engineering footage. The original finger spread, rigid sleeves, simplified costume, facial performance and absence of narrative staging still prevent shipping admission. The game continues serving the previously pinned private study; no automatic replacement, media provenance approval, native export, store submission or public release occurred. Next: relax finger articulation and review the complete motion and sleeve deformation, then stage the matching saved-consequence reaction before replacing the review film.
