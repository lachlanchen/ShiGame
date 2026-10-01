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
    parser.add_argument("--settle-frames", type=int, default=0, help="Stationary pre-roll before visible frame1, maximum60 frames")
    parser.add_argument("--compression-stiffness", type=float, default=15, help="Bounded compression resistance15..30; not a gate change")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    assert 0 <= args.settle_frames <= 60
    assert 15 <= args.compression_stiffness <= 30
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
    settings.tension_stiffness = 15; settings.compression_stiffness = args.compression_stiffness
    settings.shear_stiffness = 5; settings.bending_stiffness = .5
    settings.pin_stiffness = 1
    collision = cloth.collision_settings
    collision.use_collision = True; collision.distance_min = .008
    collision.collision_quality = 4
    collision.use_self_collision = True; collision.self_distance_min = .005
    start_frame = 1
    end_frame = 121 + args.settle_frames
    scene.frame_start = start_frame; scene.frame_end = end_frame
    cache = cloth.point_cache
    cache.frame_start = start_frame; cache.frame_end = end_frame
    cache.name = "SHICouncilCloth"
    cache.use_disk_cache = True
    scene.frame_set(1)
    rig = obj.modifiers["GarmentSkin"].object
    first_pose = {bone.name: bone.matrix.copy() for bone in rig.pose.bones}
    if args.settle_frames:
        # Offset only the private simulation timeline. Visible frameN is
        # simulation frameN+settle_frames; the original file/timing is intact.
        action = rig.animation_data.action
        for curve in action.fcurves:
            for key in curve.keyframe_points:
                key.co.x += args.settle_frames
                key.handle_left.x += args.settle_frames
                key.handle_right.x += args.settle_frames
            curve.update()
    preroll_error = 0
    for frame in range(start_frame, 1 + args.settle_frames):
        scene.frame_set(frame); bpy.context.view_layer.update()
        preroll_error = max(preroll_error, max(abs(bone.matrix[r][c] - first_pose[bone.name][r][c])
                                            for bone in rig.pose.bones for r in range(4) for c in range(4)))
    assert preroll_error < 1e-6, "Pre-roll must hold the existing first pose, not change the authored gesture"
    scene.frame_set(start_frame)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    blend = output / "garment-study.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    with bpy.context.temp_override(scene=scene, object=obj, active_object=obj, point_cache=cache):
        result = bpy.ops.ptcache.bake(bake=True)
    assert result == {"FINISHED"} and cache.is_baked, "Simulation must finish; never substitute uncached frames"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    cache_files = sorted(output.rglob("*.bphys"))
    expected_frames = 121 + args.settle_frames
    assert len(cache_files) == expected_frames, f"Require all{expected_frames} cache frames, got {len(cache_files)}"
    rendered = []
    for frame in (1, 46, 61, 121):
        scene.frame_set(frame + args.settle_frames); path = output / f"frame-{frame:03d}.png"
        scene.render.filepath = str(path); bpy.ops.render.render(write_still=True)
        rendered.append({"frame": frame, "simulationFrame": frame + args.settle_frames, "file": path.name, "sha256": sha(path)})
    receipt["parentGussetBlendSHA256"] = receipt["blendSHA256"]
    receipt["blendSHA256"] = sha(blend); receipt["rendered"] = rendered
    receipt["clothSimulation"] = {
        "authorSHA256": sha(Path(__file__)), "frames": 121,
        "cacheFrameStart": start_frame, "cacheFrameEnd": end_frame,
        "visibleFrameOffset": args.settle_frames,
        "settleFrames": args.settle_frames, "maximumPrerollBoneMatrixError": preroll_error,
        "pinGroup": pins.name, "distalPinWeight": 1,
        "quality": 8, "collisionQuality": 4, "massKilograms": .20,
        "compressionStiffness": args.compression_stiffness,
        "contactDistanceMetres": .008, "bodyOuterThicknessMetres": .006,
        "selfDistanceMetres": .005, "selfCollisionEnabled": True,
        "cache": [{"file": str(path.relative_to(output)), "sha256": sha(path)} for path in cache_files],
        "boundary": "Baked private cloth experiment; source skinning unchanged, simulated positions need independent evaluation and visual review"}
    receipt["boundary"] = "Private121-frame cloth bake, not historical costume, collision acceptance or movie admission. No engine export."
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print("SHI_COUNCIL_CLOTH", json.dumps({"blendSHA256": receipt["blendSHA256"], "cacheFrames": len(cache_files), "status": "private-unqualified-cloth-study"}))


if __name__ == "__main__": main()
