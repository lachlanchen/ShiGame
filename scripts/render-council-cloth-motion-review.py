"""Render a fresh continuous private preview from a qualified baked study.

Never substitutes rig animation or simulation, overwrites assets or claims
cinematic approval. The input receipt, report, cache and blend are hash-checked.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy


def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    study = args.study.resolve(); output = args.output.resolve()
    receipt = json.loads((study / "receipt.json").read_text())
    report = json.loads((study / "verification.json").read_text())
    blend = study / "garment-study.blend"
    assert report["status"] == "sampled-connected-garment-checks-passed"
    assert sha(blend) == receipt["blendSHA256"] == report["blendSHA256"]
    assert sha(Path(__file__).with_name("test-council-connected-garment.py")) == report["checkerSHA256"]
    cloth_receipt = receipt["clothSimulation"]
    for cache in cloth_receipt["cache"]:
        path = (study / cache["file"]).resolve()
        assert path.is_relative_to(study) and sha(path) == cache["sha256"]
    output.mkdir(parents=True, exist_ok=False)
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    scene = bpy.context.scene
    cloth = bpy.data.objects["SKM_SHI_keeper_ConnectedGarmentStudy"].modifiers["SHI_GarmentCloth"]
    assert cloth.point_cache.is_baked
    offset = cloth_receipt.get("visibleFrameOffset", 0)
    rendered = []
    for frame in range(1, 122):
        scene.frame_set(frame + offset)
        path = output / f"frame-{frame:03d}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        rendered.append({"frame": frame, "simulationFrame": frame + offset, "file": path.name, "sha256": sha(path)})
    assert sha(blend) == receipt["blendSHA256"], "Review must not modify input"
    (output / "receipt.json").write_text(json.dumps({
        "status": "private-continuous-motion-preview-not-admitted",
        "authorSHA256": sha(Path(__file__)), "blendSHA256": sha(blend),
        "verificationSHA256": sha(study / "verification.json"), "fps": 30,
        "frames": rendered,
        "boundary": "Full121-frame workbench cloth review, not final materials, period costume, acting or movie approval; collar/waist trim fit remains unresolved"
    }, indent=2) + "\n")
    print("SHI_CLOTH_MOTION_REVIEW", json.dumps({"frames": len(rendered), "fps": 30, "output": str(output)}))


if __name__ == "__main__": main()
