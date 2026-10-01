"""Private bounded cloth bake on a reviewed (rejected) gusset candidate.

Body/rig/gesture and skinning are unchanged. Cloth is a second deformation
stage, pinned at neck/waist and retained distal sleeves, not asset admission.
Creates a fresh editable study and hashed local simulation cache only.
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
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source = args.input.resolve(); output = args.output.resolve()
    receipt = json.loads((source / "receipt.json").read_text())
    assert receipt.get("gussetTransition"), "Require the explicit gusset recipe"
    assert sha(source / "garment-study.blend") == receipt["blendSHA256"]
    for capture in receipt["rendered"]: assert sha(source / capture["file"]) == capture["sha256"]
    output.mkdir(parents=True, exist_ok=False)
    bpy.ops.wm.open_mainfile(filepath=str(source / "garment-study.blend"))
    scene = bpy.context.scene
    obj = bpy.data.objects["SKM_SHI_keeper_ConnectedGarmentStudy"]
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    assert not body.hide_render
    collider = body.modifiers.new("SHI_ClothBodyCollider", "COLLISION")
    body.collision.thickness_outer = .006
    body.collision.thickness_inner = .001
    pins = obj.vertex_groups.new(name="SHI_ClothPins")
    distal_start = len(obj.data.vertices) - 816
    for vertex in obj.data.vertices:
        # Distal sleeves follow the existing target without a new elbow solve.
        # Torso rings can relax, but neck/waist keep the garment on the actor.
        pin = 1.0 if vertex.index >= distal_start or vertex.co.z > 1.425 or vertex.co.z < .85 else 0.0
        if pin: pins.add([vertex.index], pin, "REPLACE")
    cloth = obj.modifiers.new("SHI_GarmentCloth", "CLOTH")
    settings = cloth.settings
    settings.vertex_group_mass = pins.name
    settings.quality = 8; settings.mass = .20; settings.air_damping = 5
    settings.tension_stiffness = 15; settings.compression_stiffness = 15
    settings.shear_stiffness = 5; settings.bending_stiffness = .5
    settings.pin_stiffness = 1
    collision = cloth.collision_settings
    collision.use_collision = True; collision.distance_min = .008
    collision.collision_quality = 4
    collision.use_self_collision = True; collision.self_distance_min = .005
    scene.frame_start = 1; scene.frame_end = 121
    cache = cloth.point_cache
    cache.frame_start = 1; cache.frame_end = 121
    cache.name = "SHICouncilCloth"
    cache.use_disk_cache = True
    scene.frame_set(1)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    blend = output / "garment-study.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    with bpy.context.temp_override(scene=scene, object=obj, active_object=obj, point_cache=cache):
        result = bpy.ops.ptcache.bake(bake=True)
    assert result == {"FINISHED"} and cache.is_baked, "Simulation must finish; never substitute uncached frames"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    cache_files = sorted(output.rglob("*.bphys"))
    assert len(cache_files) == 121, f"Require all121 cache frames, got {len(cache_files)}"
    rendered = []
    for frame in (1, 46, 61, 121):
        scene.frame_set(frame); path = output / f"frame-{frame:03d}.png"
        scene.render.filepath = str(path); bpy.ops.render.render(write_still=True)
        rendered.append({"frame": frame, "file": path.name, "sha256": sha(path)})
    receipt["parentGussetBlendSHA256"] = receipt["blendSHA256"]
    receipt["blendSHA256"] = sha(blend); receipt["rendered"] = rendered
    receipt["clothSimulation"] = {
        "authorSHA256": sha(Path(__file__)), "frames": 121,
        "pinGroup": pins.name, "distalPinWeight": 1,
        "quality": 8, "collisionQuality": 4, "massKilograms": .20,
        "contactDistanceMetres": .008, "bodyOuterThicknessMetres": .006,
        "selfDistanceMetres": .005, "selfCollisionEnabled": True,
        "cache": [{"file": str(path.relative_to(output)), "sha256": sha(path)} for path in cache_files],
        "boundary": "Baked private cloth experiment; source skinning unchanged, simulated positions need independent evaluation and visual review"}
    receipt["boundary"] = "Private121-frame cloth bake, not historical costume, collision acceptance or movie admission. No engine export."
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print("SHI_COUNCIL_CLOTH", json.dumps({"blendSHA256": receipt["blendSHA256"], "cacheFrames": len(cache_files), "status": "private-unqualified-cloth-study"}))


if __name__ == "__main__": main()
