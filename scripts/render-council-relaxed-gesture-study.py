"""Private relaxed-arm council gesture study, never an accepted-source overwrite.

Use the same verified source and CLI as render-council-motion-film.py, with a
new output directory. Authored FK is baked per frame; no retargeting or IK solver
is assumed. The accepted action and meshes remain untouched on disk.
"""
import importlib.util
import json
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve()
spec = importlib.util.spec_from_file_location("shi_motion_review", HERE.with_name("render-council-motion-film.py"))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
CANDIDATE = "AN_SHI_PrivateCouncil_RelaxedGesture_Study01"


def aim(rig, name, direction):
    """Swing the bone's existing local Y axis to a bounded rig-space direction.

    Preserve roll from the original frame rather than guess mirrored Euler signs.
    Refresh dependency evaluation before aligning a child bone.
    """
    bone = rig.pose.bones[name]
    matrix = bone.matrix.copy()
    current = (matrix.to_3x3() @ Vector((0, 1, 0))).normalized()
    rotation = current.rotation_difference(Vector(direction).normalized())
    bone.matrix = Matrix.LocRotScale(matrix.translation, rotation @ matrix.to_quaternion(), matrix.to_scale())
    bpy.context.view_layer.update()


def envelope(frame):
    # A deliberate, non-looping explain-and-return gesture: settle, offer, hold,
    # retract. Cubic easing keeps velocity zero at each phase boundary.
    keys = [(1, 0), (16, 0), (46, 1), (61, 1), (101, 0), (121, 0)]
    for (a, start), (b, end) in zip(keys, keys[1:]):
        if a <= frame <= b:
            t = (frame - a) / (b - a)
            return start + (end - start) * t * t * (3 - 2 * t)
    raise ValueError("Frame outside reviewed interval")


def author(rig, scene):
    original = rig.animation_data.action
    basis = []
    for frame in range(1, 122):
        scene.frame_set(frame)
        basis.append({bone.name: bone.matrix_basis.copy() for bone in rig.pose.bones})
    action = bpy.data.actions.new(CANDIDATE)
    action["shi_status"] = "private-pose-study-not-runtime-admitted"
    action["shi_source_action"] = original.name
    rig.animation_data.action = action
    for frame in range(1, 122):
        scene.frame_set(frame)
        for bone in rig.pose.bones:
            bone.rotation_mode = "QUATERNION"
            bone.matrix_basis = basis[frame - 1][bone.name]
        bpy.context.view_layer.update()
        weight = envelope(frame)
        # Rig-space left is +X; forward is -Y in this exact carrier.
        aim(rig, "upperarm_l", (0.28, -0.08, -1))
        aim(rig, "lowerarm_l", (0.10, -0.16, -1))
        aim(rig, "upperarm_r", (-0.28 - 0.12 * weight, -0.08 - 0.40 * weight, -1))
        aim(rig, "lowerarm_r", (-0.10 - 0.12 * weight, -0.16 - 0.75 * weight, -1 + 0.72 * weight))
        # Continue the forearm line through the wrist instead of preserving a
        # reference-pose wrist angle that makes the offering hand droop.
        aim(rig, "hand_l", (0.10, -0.16, -1))
        aim(rig, "hand_r", (-0.10 - 0.12 * weight, -0.16 - 0.75 * weight, -1 + 0.72 * weight))
        for bone in rig.pose.bones:
            bone.keyframe_insert(data_path="location", frame=frame, group=bone.name)
            bone.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=bone.name)
            bone.keyframe_insert(data_path="scale", frame=frame, group=bone.name)
    for curve in action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "LINEAR"
    return action


def main():
    source = Path(bpy.data.filepath)
    if review.digest(source) != review.SOURCE_SHA or bpy.app.version[:2] != (4, 5):
        raise ValueError("Require accepted source and verified Blender 4.5")
    rig = bpy.data.objects[review.RIG]
    if rig.animation_data.action.name != review.ACTION:
        raise ValueError("Unexpected source action")
    bone_names = [bone.name for bone in rig.data.bones]
    if len(bone_names) != 53:
        raise ValueError("Unexpected skeleton")
    action = author(rig, bpy.context.scene)
    review.ACTION = action.name
    review.main()
    # The reusable renderer binds its own script; also bind this pose author.
    import sys
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    path = output / "receipt.json"
    receipt = json.loads(path.read_text())
    receipt["poseAuthorSha256"] = review.digest(HERE)
    receipt["skeletonBones"] = bone_names
    receipt["envelope"] = [{"frame": frame, "weight": envelope(frame)} for frame in range(1, 122)]
    path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
