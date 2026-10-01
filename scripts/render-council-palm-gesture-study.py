"""Private palm-up council gesture using the reviewed wrist-roll direction.

Same CLI as the relaxed-gesture renderer. Never saves the accepted carrier.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

HERE = Path(__file__).resolve()
spec = importlib.util.spec_from_file_location("shi_relaxed_pose", HERE.with_name("render-council-relaxed-gesture-study.py"))
pose = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pose)
relaxed_author = pose.author
checks = []


def author(rig, scene):
    action = relaxed_author(rig, scene)
    action.name = "AN_SHI_PrivateCouncil_PalmGesture_Study01"
    originals = []
    for frame in range(1, 122):
        scene.frame_set(frame)
        originals.append(rig.pose.bones["hand_r"].matrix.copy())
    for frame, matrix in enumerate(originals, 1):
        scene.frame_set(frame)
        hand = rig.pose.bones["hand_r"]
        axis = (matrix.to_3x3() @ Vector((0, 1, 0))).normalized()
        degrees = 90 * pose.envelope(frame)
        rotation = Quaternion(axis, math.radians(degrees)) @ matrix.to_quaternion()
        hand.matrix = Matrix.LocRotScale(matrix.translation, rotation, matrix.to_scale())
        hand.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=hand.name)
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        raw_error = hand.matrix.to_quaternion().rotation_difference(rotation).angle
        error = min(raw_error, abs(2 * math.pi - raw_error))
        drift = (hand.matrix.translation - matrix.translation).length
        if error > math.radians(0.5) or drift > 0.000001:
            raise ValueError("Wrist bake did not retain the requested pose")
        checks.append({"frame": frame, "rollDegrees": degrees,
                       "rotationErrorRadians": error, "originDriftMetres": drift})
    return action


def main():
    pose.author = author
    pose.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    path = output / "receipt.json"
    receipt = json.loads(path.read_text())
    receipt["wristAuthorSha256"] = pose.review.digest(HERE)
    receipt["wristChecks"] = checks
    if checks[0]["rollDegrees"] != 0 or checks[-1]["rollDegrees"] != 0:
        raise ValueError("Wrist must return to neutral")
    path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
