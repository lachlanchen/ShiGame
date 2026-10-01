# Keeper offering-hand diagnostic

Named scene blocker: the keeper's council offering gesture reads as a drooping hand in the existing whole-body study. Before changing animation, isolate whether wrist orientation or finger articulation is responsible.

`scripts/render-council-wrist-review.py` reproduces the existing relaxed-arm pose at frame 46 and renders three close-up axial wrist rolls: 0°, −90°, +90°. It requires the unchanged accepted carrier and Blender 4.5, creates only a new private output directory, and never saves the character source. The source action is copied/authored in memory. This is neither historical gesture evidence nor a shipping asset.

## Reviewed result

The three v2 images were visually inspected. Neutral is edge-on with fingers pointing downward; −90° exposes the back of the hand; +90° exposes the palm and provides the better starting orientation for an offering beat. Fingers are still conspicuously spread and the sleeve remains a rigid blockout. Do not mistake this finding for approved hand acting, prop contact or final costume.

The final v5 render hashes match the inspected v2 images exactly. Receipt: `.runtime/council-wrist-review-20261001-v5/receipt.json`, SHA-256 `df5513c554bae4ee466a8c0f3c39bd13a9b4a722e4cb487806c6028f55794868`.

- Neutral: `e615c999906aa2d02594a1cf76ac6b70640baba0706cb28d74d08669259a6a0a`.
- −90°: `ae0b7639e5615092f0ab82ae025c01ba298084c01f538b3408c1cfc5a63a98a7`.
- +90°: `9d55e084bf1d42305229525670f89f0838dc00dcd8a5117b24497af4f96b5ece`.

Final script SHA-256: `b9c8ac344a2ec9a9779565c6d123580dbe6cd6254c89509f6970e6b4208942c8`. Blender 4.5.12 LTS, two threads, `--disable-autoexec --python-exit-code 1`. Final job exited zero. Requested/evaluated orientation errors were 0, 1.75e−7 and 0 radians; hand origins remained within 1 µm. Three output images must have distinct hashes.

## Diagnostic fixes and boundaries

The first comparison was invalid: render evaluation restored the animation key, making all images identical. The script now keys the sampled wrist pose before rendering and rejects duplicate images. A subsequent orientation assertion falsely rejected equivalent quaternion signs as a 2π difference; it now measures the equivalent shortest rotation. Those failed outputs are not review evidence. Use `--python-exit-code 1`: Blender otherwise exits zero on a script exception.

The next animation change should blend the +90° orientation with the offering envelope, return to the original wrist at rest, and relax finger spread. Review that complete temporal gesture, sleeve intersections and hand weight before replacing the private movie. No game media, content, saves, native builds, store submissions or public releases changed here. This checkpoint removes the wrist-direction uncertainty, not the remaining cinematic-quality gates.
