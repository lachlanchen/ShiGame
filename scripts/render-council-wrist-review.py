"""Render three private wrist-roll comparisons for the keeper's offering gesture.

Uses the verified Blender 4.5 carrier without saving it. This is a diagnostic
comparison, not a shipping animation or a historical gesture claim.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    here = Path(__file__).resolve()
    spec = importlib.util.spec_from_file_location("keeper_pose", here.with_name("render-council-relaxed-gesture-study.py"))
    pose = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pose)
    source = Path(bpy.data.filepath)
    if bpy.app.version[:2] != (4, 5) or pose.review.digest(source) != pose.review.SOURCE_SHA:
        raise ValueError("Require unchanged accepted carrier and Blender 4.5")
    rig = bpy.data.objects[pose.review.RIG]
    if rig.animation_data.action.name != pose.review.ACTION:
        raise ValueError("Unexpected source action")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    scene = bpy.context.scene
    pose.author(rig, scene)
    scene.frame_set(46)
    bpy.context.view_layer.update()
    hand = rig.pose.bones["hand_r"]
    original = hand.matrix.copy()
    axis = (original.to_3x3() @ Vector((0, 1, 0))).normalized()
    target = rig.matrix_world @ hand.head
    data = bpy.data.cameras.new("SHI_PrivateWristReview")
    camera = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(camera)
    data.type, data.ortho_scale = "ORTHO", 0.65
    camera.location = target + Vector((0.25, -1, 0.35)).normalized() * 2
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    meshes = [obj for obj in scene.objects if obj.type == "MESH" and pose.review.belongs(obj, rig)]
    for obj in scene.objects:
        if obj.type in {"MESH", "CURVE", "SURFACE", "META", "FONT", "VOLUME"}:
            obj.hide_render = obj not in meshes
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = 640, 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.use_compositing = scene.render.use_sequencer = False
    shading = scene.display.shading
    shading.light, shading.color_type = "STUDIO", "MATERIAL"
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.055, 0.055, 0.065)
    shading.show_shadows, shading.show_cavity = False, True
    samples = []
    for degrees in (0, -90, 90):
        rotation = Quaternion(axis, math.radians(degrees)) @ original.to_quaternion()
        hand.matrix = Matrix.LocRotScale(original.translation, rotation, original.to_scale())
        # Rendering reevaluates the action: bake this diagnostic pose at the
        # sampled frame instead of letting its existing key overwrite the edit.
        hand.keyframe_insert(data_path="rotation_quaternion", frame=46, group=hand.name)
        scene.frame_set(46)
        bpy.context.view_layer.update()
        actual = hand.matrix.to_quaternion()
        raw_error = actual.rotation_difference(rotation).angle
        # q and -q represent the same rotation; Blender may return 2*pi for
        # that equivalent pair instead of zero.
        error = min(raw_error, abs(2 * math.pi - raw_error))
        # Blender's single-precision matrix/quaternion round trip can exceed
        # 1e-4 radians. Half a degree still detects a lost 90-degree edit.
        if error > math.radians(0.5):
            raise ValueError(f"Evaluated wrist lost requested roll: {error} radians")
        if (hand.matrix.translation - original.translation).length > 0.000001:
            raise ValueError("Wrist roll moved the hand origin")
        path = output / f"wrist-{degrees:+d}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        samples.append({"rollDegrees": degrees, "file": path.name, "sha256": pose.review.digest(path),
                        "evaluatedQuaternion": list(actual),
                        "rotationErrorRadians": error,
                        "handHeadMetres": list(rig.matrix_world @ hand.head),
                        "handTailMetres": list(rig.matrix_world @ hand.tail)})
    if len({sample["sha256"] for sample in samples}) != 3:
        raise ValueError("Wrist variants must produce distinct rendered images")
    if pose.review.digest(source) != pose.review.SOURCE_SHA:
        raise ValueError("Source changed")
    receipt = {"status": "private-wrist-diagnostic-not-shipping", "sourceSha256": pose.review.SOURCE_SHA,
               "scriptSha256": pose.review.digest(here),
               "poseAuthorSha256": pose.review.digest(Path(pose.__file__)),
               "frame": 46, "blender": bpy.app.version_string, "samples": samples,
               "boundary": "Static roll comparisons; no motion, palm-contact or historical-etiquette approval."}
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
