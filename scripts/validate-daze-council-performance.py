"""Validate SHI's source and clean-interchange council performance blockout."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import sys

import bpy
from mathutils import Matrix, Vector


ASSET_ID = "shi-daze-council-performance-v1"
FPS = 30
SAMPLE_COUNT = 121
DURATION_SECONDS = 4.0
CLIPS = {
    "attentive-idle": "AN_SHI_DazeCouncil_AttentiveIdle_01",
    "speaker-measured": "AN_SHI_DazeCouncil_SpeakerMeasured_01",
}
BONE_NAMES = [
    "Root", "pelvis", "spine_01", "spine_02", "spine_03",
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "index_01_l", "index_02_l", "index_03_l",
    "middle_01_l", "middle_02_l", "middle_03_l",
    "pinky_01_l", "pinky_02_l", "pinky_03_l",
    "ring_01_l", "ring_02_l", "ring_03_l",
    "thumb_01_l", "thumb_02_l", "thumb_03_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
    "index_01_r", "index_02_r", "index_03_r",
    "middle_01_r", "middle_02_r", "middle_03_r",
    "pinky_01_r", "pinky_02_r", "pinky_03_r",
    "ring_01_r", "ring_02_r", "ring_03_r",
    "thumb_01_r", "thumb_02_r", "thumb_03_r",
    "neck_01", "head", "thigh_l", "calf_l", "foot_l", "ball_l",
    "thigh_r", "calf_r", "foot_r", "ball_r",
]
TORSO_BONES = {"pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head"}
ARM_BONES = {
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
}
FINGER_BONES = {name for name in BONE_NAMES if any(
    name.startswith(prefix) for prefix in ("index_", "middle_", "ring_", "pinky_", "thumb_")
)}
BONE_PATH = re.compile(r'^pose\.bones\["([^"]+)"\]\.(location|rotation_euler|scale)$')


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def receipt(path: Path) -> dict:
    return {
        "file": path.as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def set_frame(frame: float) -> None:
    whole = math.floor(frame)
    bpy.context.scene.frame_set(whole, subframe=frame - whole)
    bpy.context.view_layer.update()


def vector_distance(a: Vector, b: Vector) -> float:
    return (a - b).length


def matrix_difference(a: Matrix, b: Matrix) -> float:
    return max(abs(a[row][column] - b[row][column]) for row in range(4) for column in range(4))


def exact_armature() -> bpy.types.Object:
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one performance armature, found {len(armatures)}")
    rig = armatures[0]
    bones = [bone.name for bone in rig.data.bones]
    if bones != BONE_NAMES:
        raise RuntimeError(f"Performance hierarchy drifted: expected exact 53 bones, found {bones}")
    roots = [bone.name for bone in rig.data.bones if bone.parent is None]
    if roots != ["Root"] or rig.data.bones["pelvis"].parent.name != "Root":
        raise RuntimeError(f"Performance root/pelvis hierarchy drifted: {roots}")
    return rig


def carrier_meshes(rig: bpy.types.Object) -> list[bpy.types.Object]:
    meshes = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.name == "Icosphere":
            continue
        modifiers = [modifier for modifier in obj.modifiers if modifier.type == "ARMATURE"]
        if modifiers and modifiers[0].object == rig:
            meshes.append(obj)
    return meshes


def validate_source_curves(action: bpy.types.Action) -> dict:
    keyed_bones = set()
    maximum_rotation = {"torsoDegrees": 0.0, "armDegrees": 0.0, "fingerDegrees": 0.0}
    for curve in action.fcurves:
        match = BONE_PATH.match(curve.data_path)
        if not match:
            raise RuntimeError(f"{action.name}: unauthorised object/control curve {curve.data_path}")
        bone, channel = match.groups()
        if bone not in BONE_NAMES:
            raise RuntimeError(f"{action.name}: unknown animated bone {bone}")
        keyed_bones.add(bone)
        values = [float(point.co[1]) for point in curve.keyframe_points]
        if channel == "location" and any(abs(value) > 1.0e-7 for value in values):
            raise RuntimeError(f"{action.name}: bone translation entered the body-only rotation clip ({bone})")
        if channel == "scale" and any(abs(value - 1.0) > 1.0e-7 for value in values):
            raise RuntimeError(f"{action.name}: bone scale entered the clip ({bone})")
        if channel == "rotation_euler":
            degrees = max((abs(math.degrees(value)) for value in values), default=0.0)
            if bone == "Root" and degrees > 1.0e-7:
                raise RuntimeError(f"{action.name}: root rotation entered the clip")
            if bone in TORSO_BONES:
                maximum_rotation["torsoDegrees"] = max(maximum_rotation["torsoDegrees"], degrees)
            elif bone in ARM_BONES:
                maximum_rotation["armDegrees"] = max(maximum_rotation["armDegrees"], degrees)
            elif bone in FINGER_BONES:
                maximum_rotation["fingerDegrees"] = max(maximum_rotation["fingerDegrees"], degrees)
    if keyed_bones != set(BONE_NAMES):
        raise RuntimeError(f"{action.name}: source action is not self-contained across the exact skeleton")
    if maximum_rotation["torsoDegrees"] > 4.0 + 1.0e-5:
        raise RuntimeError(f"{action.name}: torso/head rotation exceeds 4 degrees")
    if maximum_rotation["armDegrees"] > 16.0 + 1.0e-5:
        raise RuntimeError(f"{action.name}: arm/wrist rotation exceeds 16 degrees")
    if maximum_rotation["fingerDegrees"] > 10.0 + 1.0e-5:
        raise RuntimeError(f"{action.name}: finger rotation exceeds 10 degrees")
    return {"fcurves": len(action.fcurves), "keyedBones": len(keyed_bones), **maximum_rotation}


def evaluated_mesh_state(meshes: list[bpy.types.Object]) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    minimum = [float("inf")] * 3
    maximum = [float("-inf")] * 3
    minimum_triangle_area = float("inf")
    vertex_count = 0
    triangle_count = 0
    for obj in meshes:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
            vertex_count += len(points)
            for point in points:
                if not all(math.isfinite(value) for value in point):
                    raise RuntimeError(f"{obj.name}: non-finite animated vertex")
                for axis in range(3):
                    minimum[axis] = min(minimum[axis], point[axis])
                    maximum[axis] = max(maximum[axis], point[axis])
            for triangle in mesh.loop_triangles:
                a, b, c = (points[index] for index in triangle.vertices)
                area = (b - a).cross(c - a).length * 0.5
                minimum_triangle_area = min(minimum_triangle_area, area)
                triangle_count += 1
        finally:
            evaluated.to_mesh_clear()
    if not meshes or vertex_count == 0 or triangle_count == 0:
        raise RuntimeError("Animated deformation carrier has no evaluated mesh payload")
    if minimum_triangle_area <= 1.0e-12:
        raise RuntimeError(f"Animated deformation produced a zero-area triangle ({minimum_triangle_area})")
    dimensions = [maximum[axis] - minimum[axis] for axis in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": dimensions,
        "vertices": vertex_count,
        "triangles": triangle_count,
        "minimumTriangleArea": minimum_triangle_area,
    }


def inspect_motion(rig: bpy.types.Object, action: bpy.types.Action, role: str,
                   start: float, end: float, unit_to_metres: float,
                   meshes: list[bpy.types.Object] | None) -> dict:
    rig.animation_data_create()
    rig.animation_data.action = action
    sample_frames = [start + (end - start) * index / 8.0 for index in range(9)]
    bone_samples = []
    mesh_samples = []
    for frame in sample_frames:
        set_frame(frame)
        bone_samples.append({
            bone: (rig.matrix_world @ rig.pose.bones[bone].head) * unit_to_metres
            for bone in ("Root", "pelvis", "head", "hand_l", "hand_r")
        })
        if meshes:
            mesh_samples.append(evaluated_mesh_state(meshes))

    first = bone_samples[0]
    root_displacement = max(vector_distance(sample["Root"], first["Root"]) for sample in bone_samples)
    pelvis_displacement = max(vector_distance(sample["pelvis"], first["pelvis"]) for sample in bone_samples)
    right_hand_displacement = max(vector_distance(sample["hand_r"], first["hand_r"]) for sample in bone_samples)
    left_hand_displacement = max(vector_distance(sample["hand_l"], first["hand_l"]) for sample in bone_samples)
    head_displacement = max(vector_distance(sample["head"], first["head"]) for sample in bone_samples)

    set_frame(start)
    start_matrices = {bone.name: bone.matrix_basis.copy() for bone in rig.pose.bones}
    set_frame(end)
    end_matrices = {bone.name: bone.matrix_basis.copy() for bone in rig.pose.bones}
    loop_error = max(matrix_difference(start_matrices[name], end_matrices[name]) for name in BONE_NAMES)
    if root_displacement > 1.0e-6 or pelvis_displacement > 1.0e-6:
        raise RuntimeError(f"{role}: root/pelvis translation drifted ({root_displacement}, {pelvis_displacement})")
    if loop_error > 1.0e-5:
        raise RuntimeError(f"{role}: first/last pose does not close ({loop_error})")
    if role == "attentive-idle" and max(left_hand_displacement, right_hand_displacement) > 0.06:
        raise RuntimeError(f"{role}: listener hand motion exceeds 6 cm")
    if role == "speaker-measured" and not 0.03 <= right_hand_displacement <= 0.18:
        raise RuntimeError(f"{role}: measured emphasis is not visible and contained ({right_hand_displacement})")

    mesh_summary = None
    if mesh_samples:
        source_scale = unit_to_metres
        heights = [sample["dimensions"][2] * source_scale for sample in mesh_samples]
        if min(heights) < 1.55 or max(heights) > 1.83:
            raise RuntimeError(f"{role}: deformed physical height leaves the admitted envelope ({heights})")
        mesh_summary = {
            "sampledFrames": len(mesh_samples),
            "verticesPerSample": sorted({sample["vertices"] for sample in mesh_samples}),
            "trianglesPerSample": sorted({sample["triangles"] for sample in mesh_samples}),
            "physicalHeightMetres": [min(heights), max(heights)],
            "minimumTriangleAreaPayloadUnits": min(sample["minimumTriangleArea"] for sample in mesh_samples),
        }
    return {
        "sampledPoses": len(sample_frames),
        "rootDisplacementMetres": root_displacement,
        "pelvisDisplacementMetres": pelvis_displacement,
        "rightHandDisplacementMetres": right_hand_displacement,
        "leftHandDisplacementMetres": left_hand_displacement,
        "headDisplacementMetres": head_displacement,
        "loopClosureMatrixError": loop_error,
        "deformation": mesh_summary,
    }


def glb_manifest(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"glTF" or len(data) < 20 or data[16:20] != b"JSON":
        raise RuntimeError(f"Invalid GLB animation payload: {path}")
    json_size = struct.unpack_from("<I", data, 12)[0]
    manifest = json.loads(data[20:20 + json_size].rstrip(b"\x00 \t\r\n").decode("utf-8"))
    animations = manifest.get("animations", [])
    if len(animations) != 1:
        raise RuntimeError(f"{path.name}: expected one GLB animation, found {len(animations)}")
    animation = animations[0]
    target_paths = [channel.get("target", {}).get("path") for channel in animation.get("channels", [])]
    if not target_paths or any(path_name not in {"translation", "rotation", "scale"} for path_name in target_paths):
        raise RuntimeError(f"{path.name}: morph/unsupported GLB animation channel entered the payload")
    input_accessors = [manifest["accessors"][sampler["input"]] for sampler in animation.get("samplers", [])]
    sample_counts = sorted({int(accessor.get("count", 0)) for accessor in input_accessors})
    # Blender keeps every changing curve at the exact 121 source samples and
    # losslessly reduces constant translation/scale tracks to their two equal
    # endpoints. Any other count would be an unreviewed resample/simplification.
    if not input_accessors or not set(sample_counts).issubset({2, SAMPLE_COUNT}) or SAMPLE_COUNT not in sample_counts:
        raise RuntimeError(f"{path.name}: GLB animation sample boundary drifted ({sample_counts})")
    spans = [float(accessor["max"][0]) - float(accessor["min"][0]) for accessor in input_accessors]
    if any(abs(span - DURATION_SECONDS) > 1.0e-4 for span in spans):
        raise RuntimeError(f"{path.name}: GLB duration drifted ({spans})")
    skin_joint_counts = [len(skin.get("joints", [])) for skin in manifest.get("skins", [])]
    if skin_joint_counts != [53] or manifest.get("images") or manifest.get("textures"):
        raise RuntimeError(f"{path.name}: GLB skeleton or texture boundary drifted")
    return {
        "animationName": animation.get("name"),
        "channels": len(target_paths),
        "targetPaths": sorted(set(target_paths)),
        "samplers": len(input_accessors),
        "samplesPerCurve": sample_counts,
        "durationSeconds": [min(spans), max(spans)],
        "skinJointCounts": skin_joint_counts,
        "meshCount": len(manifest.get("meshes", [])),
        "images": len(manifest.get("images", [])),
        "textures": len(manifest.get("textures", [])),
    }


def validate_source(source_path: Path) -> dict:
    if not source_path.is_file():
        raise RuntimeError(f"Missing editable performance source: {source_path}")
    bpy.ops.wm.open_mainfile(filepath=str(source_path))
    rig = bpy.data.objects.get("SK_SHI_keeper_Rig")
    if not rig or rig.type != "ARMATURE" or [bone.name for bone in rig.data.bones] != BONE_NAMES:
        raise RuntimeError("Editable performance source lost the exact keeper carrier skeleton")
    meshes = []
    for obj in bpy.data.objects:
        if obj.type == "MESH" and any(
            modifier.type == "ARMATURE" and modifier.object == rig for modifier in obj.modifiers
        ):
            meshes.append(obj)
    if len(meshes) != 18:
        raise RuntimeError(f"Editable performance source expected 18 keeper deformation meshes, found {len(meshes)}")
    clips = {}
    for role, action_name in CLIPS.items():
        action = bpy.data.actions.get(action_name)
        if not action or [round(value, 6) for value in action.frame_range] != [1.0, 121.0]:
            raise RuntimeError(f"Editable source is missing exact action/range {action_name}")
        clips[role] = {
            "action": action.name,
            "curveContract": validate_source_curves(action),
            "motion": inspect_motion(rig, action, role, 1.0, 121.0, 1.0, meshes),
        }
    return {**receipt(source_path), "carrierRig": rig.name, "meshCount": len(meshes), "clips": clips}


def validate_fbx(path: Path, role: str) -> dict:
    if not path.is_file():
        raise RuntimeError(f"Missing FBX animation carrier: {path}")
    reset_scene()
    bpy.ops.import_scene.fbx(filepath=str(path))
    rig = exact_armature()
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(meshes) != 18:
        raise RuntimeError(
            f"{path.name}: FBX bind-space calibration expected 18 keeper meshes, found {len(meshes)}"
        )
    actions = list(bpy.data.actions)
    action = rig.animation_data.action if rig.animation_data else None
    auxiliary_actions = [candidate for candidate in actions if candidate != action]
    if not action or len(auxiliary_actions) != 1 or any(
        slot.target_id_type != "KEY"
        for candidate in auxiliary_actions
        for slot in candidate.slots
    ):
        raise RuntimeError(
            f"{path.name}: FBX expected one rig action and one ignored shape-key carrier action"
        )
    start, end = map(float, action.frame_range)
    duration = (end - start) / float(bpy.context.scene.render.fps)
    if bpy.context.scene.render.fps != FPS or abs(duration - DURATION_SECONDS) > 1.0e-5:
        raise RuntimeError(f"{path.name}: FBX sampling/duration drifted ({duration})")
    return {
        **receipt(path),
        "armature": rig.name,
        "boneCount": len(rig.data.bones),
        "meshCount": len(meshes),
        "actions": len(actions),
        "auxiliaryShapeKeyActions": [candidate.name for candidate in auxiliary_actions],
        "importedAction": action.name,
        "frameRange": [start, end],
        "sampleCount": int(round(end - start)) + 1,
        "fps": bpy.context.scene.render.fps,
        "durationSeconds": duration,
        "motion": inspect_motion(rig, action, role, start, end, 0.01, None),
    }


def validate_glb(path: Path, role: str) -> dict:
    if not path.is_file():
        raise RuntimeError(f"Missing GLB deformation carrier: {path}")
    payload = glb_manifest(path)
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    rig = exact_armature()
    meshes = carrier_meshes(rig)
    if len(meshes) != 18:
        raise RuntimeError(f"{path.name}: clean GLB expected 18 bound meshes, found {len(meshes)}")
    actions = list(bpy.data.actions)
    if len(actions) != 1:
        raise RuntimeError(f"{path.name}: clean GLB expected one action, found {len(actions)}")
    action = actions[0]
    start, end = map(float, action.frame_range)
    duration = (end - start) / float(bpy.context.scene.render.fps)
    if abs(duration - DURATION_SECONDS) > 1.0e-4:
        raise RuntimeError(f"{path.name}: clean GLB imported duration drifted ({duration})")
    texture_nodes = [
        node.name for material in bpy.data.materials if material.use_nodes and material.node_tree
        for node in material.node_tree.nodes if node.type == "TEX_IMAGE"
    ]
    if texture_nodes:
        raise RuntimeError(f"{path.name}: clean GLB gained texture dependencies")
    return {
        **receipt(path),
        "armature": rig.name,
        "boneCount": len(rig.data.bones),
        "meshCount": len(meshes),
        "actions": 1,
        "importedAction": action.name,
        "frameRange": [start, end],
        "importedFps": bpy.context.scene.render.fps,
        "durationSeconds": duration,
        "textureDependencies": 0,
        "payload": payload,
        "motion": inspect_motion(rig, action, role, start, end, 1.0, meshes),
    }


def portable_paths(value, repository_root: Path):
    if isinstance(value, dict):
        return {key: portable_paths(child, repository_root) for key, child in value.items()}
    if isinstance(value, list):
        return [portable_paths(child, repository_root) for child in value]
    if isinstance(value, str) and value.startswith("/"):
        try:
            return Path(value).relative_to(repository_root).as_posix()
        except ValueError:
            return value
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent
    source_path = asset_root / "rendered" / f"{ASSET_ID}.blend"
    source_result = validate_source(source_path)
    formats = {"fbx": {}, "glb": {}}
    for role in CLIPS:
        formats["fbx"][role] = validate_fbx(asset_root / "export" / f"{ASSET_ID}-{role}.fbx", role)
        formats["glb"][role] = validate_glb(asset_root / "export" / f"{ASSET_ID}-{role}.glb", role)
    report = portable_paths({
        "assetId": ASSET_ID,
        "validator": "editable source plus clean FBX/GLB exact-skeleton, duration, root closure, bounded hand motion and finite deformation inspection",
        "blenderVersion": bpy.app.version_string,
        "status": "pass",
        "fps": FPS,
        "sampleCount": SAMPLE_COUNT,
        "durationSeconds": DURATION_SECONDS,
        "boneCount": len(BONE_NAMES),
        "rootMotion": False,
        "source": source_result,
        "formats": formats,
        "limitations": [
            "shared body-performance blockout only; no facial, speech, interaction, cloth or hair performance",
            "not reconstructed late-Qin etiquette or final acting",
            "physical-display and human animation/cultural review remain open",
        ],
    }, repository_root)
    output_path = asset_root / "source" / f"{ASSET_ID}.validation.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "status": report["status"],
        "sourceHandMotion": {
            role: round(data["motion"]["rightHandDisplacementMetres"], 6)
            for role, data in report["source"]["clips"].items()
        },
        "fbxSamples": {role: data["sampleCount"] for role, data in report["formats"]["fbx"].items()},
        "glbSamples": {role: data["payload"]["samplesPerCurve"] for role, data in report["formats"]["glb"].items()},
        "report": output_path.as_posix(),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
