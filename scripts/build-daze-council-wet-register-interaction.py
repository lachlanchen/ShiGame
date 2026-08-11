"""Author the bounded Gate 5A wet-register interaction source candidate.

Run with the pinned Blender 4.5.12 LTS binary and the admitted facial source:

  blender assets/3d/rendered/shi-daze-council-facial-performance-v1.blend \
    --background --python scripts/build-daze-council-wet-register-interaction.py -- \
    --asset-root assets/3d

The script isolates the accepted Chen Sheng mesh and exact 53-bone rig, authors
one texture-free abstract prop and one deterministic, non-looping 121-frame
interaction action, exports review-only FBX/GLB interchange, and writes portable
source receipts. It does not launch Unreal or alter campaign authority.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Euler, Matrix, Quaternion, Vector


ASSET_ID = "shi-daze-council-wet-register-interaction-v1"
SOURCE_CHARACTER_ASSET_ID = "shi-daze-council-facial-performance-v1"
SOURCE_BLEND_NAME = f"{SOURCE_CHARACTER_ASSET_ID}.blend"
RIG_NAME = "SK_SHI_chen-sheng_Rig"
SKELETON_NAME = "SK_SHI_DazeCouncil_Skeleton"
PROP_NAME = "SM_SHI_DazeCouncil_WetRegister_Blockout_01"
MATERIAL_NAME = "M_SHI_DazeCouncil_WetRegister_Clay_01"
ACTION_NAME = "A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01"

FPS = 30
START_FRAME = 1
END_FRAME = 121
SAMPLE_COUNT = 121
DURATION_SECONDS = 4.0
COUNCIL_HORIZONTAL_FOV_DEGREES = 44.0
COUNCIL_SENSOR_WIDTH_MILLIMETRES = 36.0
COUNCIL_LENS_MILLIMETRES = COUNCIL_SENSOR_WIDTH_MILLIMETRES / (
    2.0 * math.tan(math.radians(COUNCIL_HORIZONTAL_FOV_DEGREES * 0.5))
)
COUNCIL_RENDER_RESOLUTION = [1600, 1000]
COUNCIL_CAMERA_POSITION_METRES = [3.30, -3.90, 2.05]
COUNCIL_CAMERA_TARGET_METRES = [0.0, -0.15, 0.95]
SEMANTIC_SAMPLES = [
    {"sourceFrame": 1, "unrealSample": 0, "timeSeconds": 0.0, "state": "start"},
    {
        "sourceFrame": 31,
        "unrealSample": 30,
        "timeSeconds": 1.0,
        "state": "bilateral-contact",
    },
    {
        "sourceFrame": 61,
        "unrealSample": 60,
        "timeSeconds": 2.0,
        "state": "held-question",
    },
    {
        "sourceFrame": 91,
        "unrealSample": 90,
        "timeSeconds": 3.0,
        "state": "ordered-release",
    },
    {"sourceFrame": 121, "unrealSample": 120, "timeSeconds": 4.0, "state": "settle"},
]
TECHNICAL_CONTINUITY_FRAMES = [24, 30, 84, 90, 92, 105]

BONE_NAMES = [
    "Root",
    "pelvis",
    "spine_01",
    "spine_02",
    "spine_03",
    "clavicle_l",
    "upperarm_l",
    "lowerarm_l",
    "hand_l",
    "index_01_l",
    "index_02_l",
    "index_03_l",
    "middle_01_l",
    "middle_02_l",
    "middle_03_l",
    "pinky_01_l",
    "pinky_02_l",
    "pinky_03_l",
    "ring_01_l",
    "ring_02_l",
    "ring_03_l",
    "thumb_01_l",
    "thumb_02_l",
    "thumb_03_l",
    "clavicle_r",
    "upperarm_r",
    "lowerarm_r",
    "hand_r",
    "index_01_r",
    "index_02_r",
    "index_03_r",
    "middle_01_r",
    "middle_02_r",
    "middle_03_r",
    "pinky_01_r",
    "pinky_02_r",
    "pinky_03_r",
    "ring_01_r",
    "ring_02_r",
    "ring_03_r",
    "thumb_01_r",
    "thumb_02_r",
    "thumb_03_r",
    "neck_01",
    "head",
    "thigh_l",
    "calf_l",
    "foot_l",
    "ball_l",
    "thigh_r",
    "calf_r",
    "foot_r",
    "ball_r",
]

PROP_DIMENSIONS_METRES = Vector((0.32, 0.14, 0.02))
PROP_DIMENSIONS_CENTIMETRES = [32.0, 14.0, 2.0]
PROP_CENTER_WORLD = Vector((0.0, -0.26, 0.98))
PROP_ROTATION_WORLD = Euler((math.radians(18.0), 0.0, 0.0), "XYZ").to_matrix().to_4x4()

MARKERS = {
    "wet-register-left-support": {
        "sourcePositionMetres": [0.11, 0.055, -0.0335],
        "sourcePositionXYZCentimeters": [11.0, 5.5, -3.35],
        "unrealPositionXYZCentimeters": [11.0, -5.5, -3.35],
        "sourceRotationXYZDegrees": [180.0, 0.0, 0.0],
        "sourceQuaternionWXYZ": [0.0, 1.0, 0.0, 0.0],
        "rotationDegrees": [0.0, 0.0, 180.0],
        "rotationOrder": "Unreal-FRotator-Pitch-Yaw-Roll",
        "unrealQuaternionXYZW": [1.0, 0.0, 0.0, 0.0],
        "frameKind": "external-wrist-alignment",
    },
    "wet-register-right-contact": {
        "sourcePositionMetres": [-0.11, -0.055, 0.0335],
        "sourcePositionXYZCentimeters": [-11.0, -5.5, 3.35],
        "unrealPositionXYZCentimeters": [-11.0, 5.5, 3.35],
        "sourceRotationXYZDegrees": [0.0, 0.0, -90.0],
        "sourceQuaternionWXYZ": [0.7071067811865476, 0.0, 0.0, -0.7071067811865475],
        "rotationDegrees": [0.0, 90.0, 0.0],
        "rotationOrder": "Unreal-FRotator-Pitch-Yaw-Roll",
        "unrealQuaternionXYZW": [0.0, 0.0, 0.7071067811865475, 0.7071067811865476],
        "frameKind": "external-wrist-alignment",
    },
    "wet-register-camera-readability": {
        "sourcePositionMetres": [0.0, 0.0, 0.01],
        "sourcePositionXYZCentimeters": [0.0, 0.0, 1.0],
        "unrealPositionXYZCentimeters": [0.0, 0.0, 1.0],
        "sourceRotationXYZDegrees": [0.0, 0.0, 0.0],
        "sourceQuaternionWXYZ": [1.0, 0.0, 0.0, 0.0],
        "rotationDegrees": [0.0, 0.0, 0.0],
        "rotationOrder": "Unreal-FRotator-Pitch-Yaw-Roll",
        "unrealQuaternionXYZW": [0.0, 0.0, 0.0, 1.0],
        "frameKind": "camera-readability",
    },
}

# Right-hand target offsets are expressed in prop-local metres from the exact
# right-contact wrist frame. Source frames 90-91 / Unreal samples 89-90 stay at
# the marker centre through the exact t=3.0 ordered-release phase onset. Source
# frame 92 / sample 91 is the first measured exit from the 0.8 cm contact
# envelope. This reserve is intentional: Unreal blends adjacent compressed
# samples, so the entire held side of the exact time boundary must remain below
# the stricter authoring reserve rather than merely passing at integer samples.
RIGHT_OFFSETS = {
    1: Vector((-0.015, 0.140, 0.100)),
    24: Vector((-0.035, 0.055, 0.055)),
    30: Vector((-0.0086, 0.0, 0.0)),
    31: Vector((0.0, 0.0, 0.0)),
    61: Vector((0.0, 0.0, 0.0)),
    84: Vector((0.0, 0.0, 0.0)),
    90: Vector((0.0, 0.0, 0.0)),
    91: Vector((0.0, 0.0, 0.0)),
    92: Vector((-0.010, 0.0, 0.0)),
    105: Vector((-0.040, 0.060, 0.060)),
    121: Vector((-0.015, 0.140, 0.100)),
}
LEFT_FINGER_JOINT_DEGREES = {
    "index": (-49.2, -30.504, -16.728),
    "middle": (-60.0, -37.2, -20.4),
    "ring": (-55.2, -34.224, -18.768),
    "pinky": (-44.4, -27.528, -15.096),
}
RIGHT_FINGER_JOINT_DEGREES = {
    1: {
        "index": (-5.0, 0.0, 0.0),
        "middle": (-5.0, 0.0, 0.0),
        "ring": (4.0, 3.0, 1.0),
        "pinky": (8.0, 5.0, 2.0),
    },
    24: {
        "index": (-12.0, 0.0, 0.0),
        "middle": (-12.0, 0.0, 0.0),
        "ring": (6.0, 4.0, 2.0),
        "pinky": (10.0, 6.0, 3.0),
    },
    30: {
        "index": (-18.0, 0.0, 0.0),
        "middle": (-18.0, 0.0, 0.0),
        "ring": (8.0, 5.0, 2.0),
        "pinky": (12.0, 7.0, 3.0),
    },
    31: {
        "index": (-20.0, 0.0, 0.0),
        "middle": (-20.0, 0.0, 0.0),
        "ring": (9.0, 6.0, 3.0),
        "pinky": (13.0, 8.0, 4.0),
    },
    61: {
        "index": (-20.0, 0.0, 0.0),
        "middle": (-20.0, 0.0, 0.0),
        "ring": (10.0, 6.0, 3.0),
        "pinky": (14.0, 8.0, 4.0),
    },
    84: {
        "index": (-20.0, 0.0, 0.0),
        "middle": (-20.0, 0.0, 0.0),
        "ring": (10.0, 6.0, 3.0),
        "pinky": (14.0, 8.0, 4.0),
    },
    90: {
        "index": (-20.0, 0.0, 0.0),
        "middle": (-20.0, 0.0, 0.0),
        "ring": (9.0, 6.0, 3.0),
        "pinky": (13.0, 8.0, 4.0),
    },
    91: {
        "index": (-20.0, 0.0, 0.0),
        "middle": (-20.0, 0.0, 0.0),
        "ring": (9.0, 6.0, 3.0),
        "pinky": (13.0, 8.0, 4.0),
    },
    92: {
        "index": (-10.0, 0.0, 0.0),
        "middle": (-10.0, 0.0, 0.0),
        "ring": (5.0, 3.0, 1.0),
        "pinky": (8.0, 5.0, 2.0),
    },
    105: {
        "index": (-3.0, 0.0, 0.0),
        "middle": (-3.0, 0.0, 0.0),
        "ring": (4.0, 3.0, 1.0),
        "pinky": (7.0, 4.0, 2.0),
    },
    121: {
        "index": (-2.0, 0.0, 0.0),
        "middle": (-2.0, 0.0, 0.0),
        "ring": (4.0, 3.0, 1.0),
        "pinky": (7.0, 4.0, 2.0),
    },
}
RIGHT_THUMB_CURL_DEGREES = {
    1: 20.0,
    24: 45.0,
    30: 70.0,
    31: 80.0,
    61: 80.0,
    84: 80.0,
    90: 80.0,
    91: 80.0,
    92: 55.0,
    105: 30.0,
    121: 20.0,
}
HEAD_ROTATION_DEGREES = {
    1: (-4.0, 0.0, 0.0),
    24: (-4.0, 0.0, 0.0),
    30: (-3.5, 0.5, 0.0),
    31: (-3.5, 1.0, 0.0),
    61: (-2.0, 4.0, 0.0),
    84: (-1.8, 4.5, 0.0),
    90: (-1.5, 4.8, 0.0),
    91: (-1.5, 5.0, 0.0),
    92: (-1.5, 5.0, 0.0),
    105: (-2.0, 4.0, 0.0),
    121: (-2.5, 3.0, 0.0),
}
KEY_FRAMES = sorted(RIGHT_OFFSETS)
CONTACT_THRESHOLD_METRES = 0.008
HELD_BOUNDARY_AUTHORING_RESERVE_METRES = 0.0065
HELD_BOUNDARY_FIRST_SOURCE_FRAME = 90.0
HELD_BOUNDARY_LAST_SOURCE_FRAME = 91.0
HELD_BOUNDARY_SUBDIVISIONS = 64


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def canonical_json(value) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def receipt(path: Path, repository_root: Path) -> dict:
    return {
        "file": path.resolve().relative_to(repository_root).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def sanitize_private_binary_paths(path: Path) -> int:
    """Replace the current user-root marker byte-for-byte in portable binaries.

    Blender records its native source filename in FBX metadata and can retain a
    UI/operator path in an editable .blend. Equal-length replacement preserves
    binary offsets while preventing workstation identity from entering Git.
    """
    private_root = Path.home().as_posix().encode("utf-8")
    replacement = b"SHI_USER_ROOT"
    if len(replacement) > len(private_root):
        raise RuntimeError(
            "Portable binary marker is longer than the current user root"
        )
    replacement = replacement.ljust(len(private_root), b"_")
    data = path.read_bytes()
    occurrences = data.count(private_root)
    if occurrences:
        data = data.replace(private_root, replacement)
        path.write_bytes(data)
    if private_root in path.read_bytes():
        raise RuntimeError(
            f"Private user-root marker survived binary sanitization: {path.name}"
        )
    return occurrences


def sanitize_review_png(path: Path) -> dict:
    """Drop nondeterministic/private Blender PNG metadata without touching pixels."""
    data = path.read_bytes()
    signature = b"\x89PNG\r\n\x1a\n"
    if not data.startswith(signature):
        raise RuntimeError(f"Invalid review PNG: {path.name}")
    allowed = {b"IHDR", b"PLTE", b"tRNS", b"IDAT", b"IEND"}
    output = bytearray(signature)
    offset = len(signature)
    kept_types = []
    while offset < len(data):
        if offset + 12 > len(data):
            raise RuntimeError(f"Truncated PNG chunk header: {path.name}")
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        end = offset + 12 + length
        if end > len(data):
            raise RuntimeError(f"Truncated PNG chunk payload: {path.name}")
        chunk_type = data[offset + 4 : offset + 8]
        if chunk_type in allowed:
            output.extend(data[offset:end])
            kept_types.append(chunk_type.decode("ascii"))
        offset = end
        if chunk_type == b"IEND":
            break
    if (
        kept_types[:1] != ["IHDR"]
        or "IDAT" not in kept_types
        or kept_types[-1:] != ["IEND"]
    ):
        raise RuntimeError(
            f"PNG critical chunk contract failed: {path.name}: {kept_types}"
        )
    path.write_bytes(output)
    private_root = Path.home().as_posix().encode("utf-8")
    if private_root in output:
        raise RuntimeError(
            f"Private user-root marker survived PNG metadata sanitization: {path.name}"
        )
    return {
        "metadataSanitized": True,
        "metadataPolicy": "retain-only-IHDR-PLTE-tRNS-IDAT-IEND",
    }


def review_render_receipt(path: Path, repository_root: Path) -> dict:
    metadata = sanitize_review_png(path)
    return {**receipt(path, repository_root), **metadata}


def finite_vector(values) -> bool:
    return all(math.isfinite(float(value)) for value in values)


def matrix_values(matrix: Matrix) -> list[float]:
    return [float(matrix[row][column]) for row in range(4) for column in range(4)]


def transform_from_marker(marker: dict) -> Matrix:
    rotation = Euler(
        tuple(math.radians(value) for value in marker["sourceRotationXYZDegrees"]),
        "XYZ",
    )
    return (
        Matrix.Translation(Vector(marker["sourcePositionMetres"]))
        @ rotation.to_matrix().to_4x4()
    )


def prop_world_matrix() -> Matrix:
    return Matrix.Translation(PROP_CENTER_WORLD) @ PROP_ROTATION_WORLD


def exact_rig() -> bpy.types.Object:
    rig = bpy.data.objects.get(RIG_NAME)
    if not rig or rig.type != "ARMATURE":
        raise RuntimeError(f"Accepted source is missing exact rig {RIG_NAME}")
    if not rig.data.name.startswith(SKELETON_NAME):
        raise RuntimeError(f"Skeleton data drifted: {rig.data.name}")
    if [bone.name for bone in rig.data.bones] != BONE_NAMES:
        raise RuntimeError(
            "Accepted source no longer carries the exact ordered 53-bone hierarchy"
        )
    roots = [bone.name for bone in rig.data.bones if bone.parent is None]
    if roots != ["Root"] or rig.data.bones["pelvis"].parent.name != "Root":
        raise RuntimeError(f"Skeleton root contract drifted: {roots}")
    return rig


def rig_meshes(rig: bpy.types.Object) -> list[bpy.types.Object]:
    meshes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.parent == rig or any(
            mod.type == "ARMATURE" and mod.object == rig for mod in obj.modifiers
        ):
            meshes.append(obj)
    meshes.sort(key=lambda obj: obj.name)
    if len(meshes) != 18 or not any(
        obj.name == "SKM_SHI_chen-sheng_Body" for obj in meshes
    ):
        raise RuntimeError(
            f"Expected the accepted 18-mesh Chen Sheng facial carrier, found {len(meshes)}"
        )
    return meshes


def skeleton_receipt(rig: bpy.types.Object) -> dict:
    bones = []
    for bone in rig.data.bones:
        bones.append(
            {
                "name": bone.name,
                "parent": bone.parent.name if bone.parent else None,
                "matrixLocal": [
                    round(value, 12) for value in matrix_values(bone.matrix_local)
                ],
                "lengthMetres": round(float(bone.length), 12),
            }
        )
    return {
        "name": rig.data.name,
        "boneCount": len(bones),
        "boneNames": [row["name"] for row in bones],
        "hierarchyAndBindSha256": sha256_bytes(canonical_json(bones)),
        "objectTransform": {
            "location": [float(value) for value in rig.location],
            "rotationEulerRadians": [float(value) for value in rig.rotation_euler],
            "scale": [float(value) for value in rig.scale],
        },
    }


def isolate_chen_sheng(rig: bpy.types.Object, meshes: list[bpy.types.Object]) -> None:
    keep = {rig, *meshes}
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    for armature in list(bpy.data.armatures):
        if armature != rig.data:
            bpy.data.armatures.remove(armature)
    rig.data.name = SKELETON_NAME
    rig.location = Vector((0.0, 0.0, 0.0))
    rig.rotation_mode = "QUATERNION"
    rig.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
    rig.scale = Vector((1.0, 1.0, 1.0))
    for mesh in meshes:
        mesh.hide_render = False
        mesh.hide_viewport = False
        if mesh.animation_data:
            mesh.animation_data_clear()
        if mesh.data.shape_keys and mesh.data.shape_keys.animation_data:
            mesh.data.shape_keys.animation_data_clear()
    if rig.animation_data:
        rig.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)

    # The interaction interchange is intentionally texture-free. The original
    # admitted facial source is not modified on disk; this isolated derivative
    # removes image nodes and paths while retaining mesh, morph and material-slot
    # identity for animation-carrier calibration.
    for material in bpy.data.materials:
        if material.use_nodes and material.node_tree:
            for node in list(material.node_tree.nodes):
                if node.type == "TEX_IMAGE":
                    material.node_tree.nodes.remove(node)
    for image in list(bpy.data.images):
        bpy.data.images.remove(image)


def create_clay_material() -> bpy.types.Material:
    material = bpy.data.materials.get(MATERIAL_NAME) or bpy.data.materials.new(
        MATERIAL_NAME
    )
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    principled.inputs["Base Color"].default_value = (0.19, 0.155, 0.115, 1.0)
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = 0.94
    if "IOR Level" in principled.inputs:
        principled.inputs["IOR Level"].default_value = 0.16
    if "Emission Color" in principled.inputs:
        principled.inputs["Emission Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        principled.inputs["Emission Strength"].default_value = 0.0
    material.node_tree.links.new(principled.outputs["BSDF"], output.inputs["Surface"])
    material.diffuse_color = (0.19, 0.155, 0.115, 1.0)
    material.metallic = 0.0
    material.roughness = 0.94
    material["shi_asset_id"] = ASSET_ID
    material["shi_status"] = "texture-free-muted-clay-engineering-only"
    return material


def create_prop(
    material: bpy.types.Material,
) -> tuple[bpy.types.Object, dict[str, bpy.types.Object]]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    prop = bpy.context.object
    prop.name = PROP_NAME
    prop.data.name = f"{PROP_NAME}_Mesh"
    prop.dimensions = PROP_DIMENSIONS_METRES
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    prop.data.materials.clear()
    prop.data.materials.append(material)
    for layer in list(prop.data.uv_layers):
        prop.data.uv_layers.remove(layer)
    bevel = prop.modifiers.new("RoundedSafeEdges_4mm", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 4
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(30.0)
    bpy.context.view_layer.objects.active = prop
    prop.select_set(True)
    bpy.ops.object.shade_smooth_by_angle()
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    prop.location = Vector((0.0, 0.0, 0.0))
    prop.rotation_mode = "QUATERNION"
    prop.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
    prop.scale = Vector((1.0, 1.0, 1.0))
    prop["shi_asset_id"] = ASSET_ID
    prop["shi_status"] = "project-original-wet-register-interaction-blockout"
    prop["shi_origin"] = "center"
    prop["shi_dimensions_centimetres"] = PROP_DIMENSIONS_CENTIMETRES
    prop["shi_collision"] = False
    prop["shi_navigation"] = False
    prop["shi_physics"] = False
    prop["shi_input"] = False
    prop["shi_historical_authentication"] = False

    marker_objects = {}
    for marker_id, marker in MARKERS.items():
        empty = bpy.data.objects.new(marker_id, None)
        bpy.context.scene.collection.objects.link(empty)
        empty.empty_display_type = "ARROWS"
        empty.empty_display_size = 0.018
        empty.parent = prop
        empty.location = Vector(marker["sourcePositionMetres"])
        empty.rotation_mode = "XYZ"
        empty.rotation_euler = Euler(
            tuple(math.radians(value) for value in marker["sourceRotationXYZDegrees"]),
            "XYZ",
        )
        empty.scale = Vector((1.0, 1.0, 1.0))
        empty["shi_marker_id"] = marker_id
        empty["shi_frame_kind"] = marker["frameKind"]
        marker_objects[marker_id] = empty
    return prop, marker_objects


def reset_pose(rig: bpy.types.Object) -> None:
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.location = Vector((0.0, 0.0, 0.0))
        bone.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
        bone.scale = Vector((1.0, 1.0, 1.0))
        for constraint in list(bone.constraints):
            bone.constraints.remove(constraint)


def set_rotation_degrees(
    bone: bpy.types.PoseBone, xyz: tuple[float, float, float]
) -> None:
    bone.rotation_mode = "QUATERNION"
    bone.rotation_quaternion = Euler(
        tuple(math.radians(value) for value in xyz), "XYZ"
    ).to_quaternion()


def apply_body_baseline(rig: bpy.types.Object) -> None:
    # A fixed restrained regard is shared by every frame. It carries no second
    # semantic beat and keeps the root, pelvis and shoulders quiet.
    set_rotation_degrees(rig.pose.bones["spine_02"], (-0.8, 0.0, 0.0))
    set_rotation_degrees(rig.pose.bones["spine_03"], (1.2, 0.0, 0.0))
    set_rotation_degrees(rig.pose.bones["neck_01"], (1.4, 0.0, 0.0))
    set_rotation_degrees(rig.pose.bones["head"], (-3.0, 0.0, 0.0))
    set_rotation_degrees(rig.pose.bones["clavicle_l"], (1.5, 0.0, -1.0))
    set_rotation_degrees(rig.pose.bones["clavicle_r"], (1.0, 0.0, 1.0))


def apply_frame_regard(rig: bpy.types.Object, frame: int) -> None:
    head_rotation = HEAD_ROTATION_DEGREES[frame]
    set_rotation_degrees(rig.pose.bones["head"], head_rotation)
    set_rotation_degrees(
        rig.pose.bones["neck_01"],
        (1.4, head_rotation[1] * 0.35, 0.0),
    )


def create_target(name: str, matrix_world: Matrix) -> bpy.types.Object:
    target = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(target)
    target.matrix_world = matrix_world
    target.empty_display_type = "PLAIN_AXES"
    target.empty_display_size = 0.03
    target.hide_render = True
    return target


def solve_hand_ik(
    rig: bpy.types.Object,
    side: str,
    desired_head_matrix: Matrix,
    pole_world: Vector,
) -> tuple[list[str], dict[str, Matrix], list[bpy.types.Object]]:
    hand = rig.pose.bones[f"hand_{side}"]
    chain = [f"upperarm_{side}", f"lowerarm_{side}", f"hand_{side}"]
    desired_rotation = desired_head_matrix.to_3x3()
    desired_head = desired_head_matrix.translation
    desired_tail = desired_head + desired_rotation @ Vector(
        (0.0, hand.bone.length, 0.0)
    )
    target_matrix = desired_rotation.to_4x4()
    target_matrix.translation = desired_tail
    target = create_target(f"TMP_IK_Target_{side}", rig.matrix_world @ target_matrix)
    pole = create_target(f"TMP_IK_Pole_{side}", Matrix.Translation(pole_world))
    constraint = hand.constraints.new("IK")
    constraint.name = f"TMP_WetRegister_IK_{side}"
    constraint.target = target
    constraint.pole_target = pole
    constraint.chain_count = 3
    constraint.iterations = 128
    constraint.use_stretch = False
    constraint.use_rotation = True
    constraint.weight = 1.0
    constraint.orient_weight = 1.0
    # The supporting elbow uses a half turn to stay outside the torso. The
    # contacting elbow stays in the pole plane: this moves the sleeve/cuff
    # silhouette outboard and leaves the top-face fingers readable.
    constraint.pole_angle = math.radians(-90.0 if side == "l" else 0.0)
    bpy.context.view_layer.update()
    visual = {name: rig.pose.bones[name].matrix.copy() for name in chain}
    return chain, visual, [target, pole]


def apply_visual_chain(
    rig: bpy.types.Object, chain: list[str], matrices: dict[str, Matrix]
) -> None:
    for name in chain:
        rig.pose.bones[name].matrix = matrices[name]
        bpy.context.view_layer.update()


def apply_hand_shape(
    rig: bpy.types.Object,
    side: str,
    finger_joint_degrees: dict[str, tuple[float, float, float]],
    thumb_amount: float,
) -> None:
    for finger in ("index", "middle", "ring", "pinky"):
        values = finger_joint_degrees[finger]
        for segment, value in enumerate(values, start=1):
            set_rotation_degrees(
                rig.pose.bones[f"{finger}_{segment:02d}_{side}"], (value, 0.0, 0.0)
            )
    thumb_z_sign = -1.0 if side == "l" else 1.0
    set_rotation_degrees(
        rig.pose.bones[f"thumb_01_{side}"],
        (thumb_amount * 0.80, 0.0, thumb_z_sign * thumb_amount * 0.10),
    )
    set_rotation_degrees(
        rig.pose.bones[f"thumb_02_{side}"], (thumb_amount * 0.65, 0.0, 0.0)
    )
    set_rotation_degrees(
        rig.pose.bones[f"thumb_03_{side}"], (thumb_amount * 0.45, 0.0, 0.0)
    )


def author_pose(rig: bpy.types.Object, frame: int) -> None:
    reset_pose(rig)
    apply_body_baseline(rig)
    apply_frame_regard(rig, frame)
    bpy.context.view_layer.update()
    prop_matrix = prop_world_matrix()
    left_matrix = prop_matrix @ transform_from_marker(
        MARKERS["wet-register-left-support"]
    )
    right_matrix = prop_matrix @ (
        Matrix.Translation(RIGHT_OFFSETS[frame])
        @ transform_from_marker(MARKERS["wet-register-right-contact"])
    )
    chains = []
    targets = []
    chain, visual, created = solve_hand_ik(
        rig, "l", left_matrix, Vector((0.58, -0.10, 1.08))
    )
    chains.append((chain, visual))
    targets.extend(created)
    chain, visual, created = solve_hand_ik(
        rig, "r", right_matrix, Vector((-0.58, -0.10, 1.12))
    )
    chains.append((chain, visual))
    targets.extend(created)
    bpy.context.view_layer.update()
    # Capture the evaluated rotations, then remove all temporary IK machinery.
    evaluated = [
        (chain, {name: rig.pose.bones[name].matrix.copy() for name in chain})
        for chain, _ in chains
    ]
    for side in ("l", "r"):
        hand = rig.pose.bones[f"hand_{side}"]
        for constraint in list(hand.constraints):
            hand.constraints.remove(constraint)
    for target in targets:
        bpy.data.objects.remove(target, do_unlink=True)
    reset_pose(rig)
    apply_body_baseline(rig)
    apply_frame_regard(rig, frame)
    bpy.context.view_layer.update()
    for chain, matrices in evaluated:
        apply_visual_chain(rig, chain, matrices)
    for side in ("l", "r"):
        for bone_name in (f"upperarm_{side}", f"lowerarm_{side}", f"hand_{side}"):
            bone = rig.pose.bones[bone_name]
            bone.location = Vector((0.0, 0.0, 0.0))
            bone.scale = Vector((1.0, 1.0, 1.0))
    # The left four fingers curl from the underside around the near edge; the
    # opposed thumb tucks against the underside instead of hanging vertically.
    # The right fingers stay nearly flat over the upper face while the thumb
    # closes gently at acquisition and opens again at release.
    apply_hand_shape(rig, "l", LEFT_FINGER_JOINT_DEGREES, -100.0)
    apply_hand_shape(
        rig,
        "r",
        RIGHT_FINGER_JOINT_DEGREES[frame],
        RIGHT_THUMB_CURL_DEGREES[frame],
    )
    bpy.context.view_layer.update()


def author_action(rig: bpy.types.Object) -> bpy.types.Action:
    action = bpy.data.actions.new(ACTION_NAME)
    action.use_fake_user = True
    action["shi_asset_id"] = ASSET_ID
    action["shi_status"] = "engineering-hand-interaction-candidate-not-final-acting"
    action["shi_non_looping"] = True
    action["shi_root_motion"] = False
    action["shi_gameplay_authority"] = False
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame in KEY_FRAMES:
        author_pose(rig, frame)
        for bone_name in BONE_NAMES:
            bone = rig.pose.bones[bone_name]
            bone.keyframe_insert(data_path="location", frame=frame, group=bone_name)
            bone.keyframe_insert(
                data_path="rotation_quaternion", frame=frame, group=bone_name
            )
            bone.keyframe_insert(data_path="scale", frame=frame, group=bone_name)
    for curve in action.fcurves:
        for key in curve.keyframe_points:
            key.interpolation = "BEZIER"
            key.handle_left_type = "AUTO_CLAMPED"
            key.handle_right_type = "AUTO_CLAMPED"
    bpy.context.scene.frame_start = START_FRAME
    bpy.context.scene.frame_end = END_FRAME
    bpy.context.scene.frame_set(START_FRAME)
    return action


def attach_prop_to_left_hand(
    rig: bpy.types.Object,
    prop: bpy.types.Object,
    marker_objects: dict[str, bpy.types.Object],
) -> dict:
    bpy.context.scene.frame_set(START_FRAME)
    bpy.context.view_layer.update()
    desired_world = prop_world_matrix()
    prop.parent = rig
    prop.parent_type = "BONE"
    prop.parent_bone = "hand_l"
    prop.matrix_world = desired_world
    bpy.context.view_layer.update()
    marker = marker_objects["wet-register-left-support"]
    hand_world = rig.matrix_world @ rig.pose.bones["hand_l"].matrix
    position_error = (marker.matrix_world.translation - hand_world.translation).length
    angular_error = math.degrees(
        marker.matrix_world.to_quaternion()
        .rotation_difference(hand_world.to_quaternion())
        .angle
    )
    if position_error > 1.0e-4 or angular_error > 1.0e-2:
        raise RuntimeError(
            f"Left attachment did not close at frame 1 ({position_error} m, {angular_error} degrees)"
        )
    return {
        "parentType": "bone",
        "parentBone": "hand_l",
        "markerId": "wet-register-left-support",
        "sourceObjectScale": [1.0, 1.0, 1.0],
        "unrealCouncilComponentScale": [100.0, 100.0, 100.0],
        "requiredUnrealRelativeScaleCompensation": [0.01, 0.01, 0.01],
        "frameOnePositionErrorCentimeters": position_error * 100.0,
        "frameOneAngularErrorDegrees": angular_error,
    }


def select_only(objects: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def export_prop(
    prop: bpy.types.Object,
    marker_objects: dict[str, bpy.types.Object],
    source_root: Path,
    repository_root: Path,
) -> dict:
    fbx_path = source_root / f"{ASSET_ID}-prop.fbx"
    glb_path = source_root / f"{ASSET_ID}-prop.glb"
    duplicate = prop.copy()
    duplicate.data = prop.data.copy()
    duplicate.name = PROP_NAME
    bpy.context.scene.collection.objects.link(duplicate)
    duplicate.parent = None
    duplicate.matrix_world = Matrix.Identity(4)
    marker_duplicates = []
    for marker_id, marker in marker_objects.items():
        child = marker.copy()
        child.name = marker_id
        bpy.context.scene.collection.objects.link(child)
        child.parent = duplicate
        child.matrix_parent_inverse = Matrix.Identity(4)
        child.location = marker.location.copy()
        child.rotation_mode = "XYZ"
        child.rotation_euler = marker.rotation_euler.copy()
        child.scale = Vector((1.0, 1.0, 1.0))
        marker_duplicates.append(child)
    select_only([duplicate, *marker_duplicates])
    bpy.ops.export_scene.fbx(
        filepath=str(fbx_path),
        use_selection=True,
        object_types={"MESH", "EMPTY"},
        global_scale=100.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_ALL",
        axis_forward="-Z",
        axis_up="Y",
        bake_anim=False,
        mesh_smooth_type="FACE",
        use_tspace=False,
        path_mode="STRIP",
    )
    select_only([duplicate, *marker_duplicates])
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_apply=False,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
    )
    fbx_sanitized = sanitize_private_binary_paths(fbx_path)
    glb_sanitized = sanitize_private_binary_paths(glb_path)
    for child in marker_duplicates:
        bpy.data.objects.remove(child, do_unlink=True)
    bpy.data.objects.remove(duplicate, do_unlink=True)
    return {
        "fbx": {
            **receipt(fbx_path, repository_root),
            "sanitizedPrivatePathOccurrences": fbx_sanitized,
        },
        "glb": {
            **receipt(glb_path, repository_root),
            "sanitizedPrivatePathOccurrences": glb_sanitized,
        },
    }


def export_animation(
    rig: bpy.types.Object,
    meshes: list[bpy.types.Object],
    action: bpy.types.Action,
    source_root: Path,
    repository_root: Path,
) -> dict:
    fbx_path = source_root / f"{ASSET_ID}-chen-sheng.fbx"
    glb_path = source_root / f"{ASSET_ID}-chen-sheng.glb"
    rig.animation_data.action = action
    bpy.context.scene.frame_set(START_FRAME)
    original_name = rig.name
    try:
        rig.name = "Armature"
        select_only([rig, *meshes])
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path),
            use_selection=True,
            object_types={"ARMATURE", "MESH"},
            global_scale=100.0,
            apply_unit_scale=True,
            apply_scale_options="FBX_SCALE_ALL",
            axis_forward="-Z",
            axis_up="Y",
            add_leaf_bones=False,
            bake_anim=True,
            bake_anim_use_all_bones=True,
            bake_anim_use_nla_strips=False,
            bake_anim_use_all_actions=False,
            bake_anim_force_startend_keying=True,
            bake_anim_step=1.0,
            bake_anim_simplify_factor=0.0,
            mesh_smooth_type="FACE",
            use_tspace=False,
            armature_nodetype="NULL",
            path_mode="STRIP",
        )
        select_only([rig, *meshes])
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path),
            export_format="GLB",
            use_selection=True,
            export_skins=True,
            export_animations=True,
            export_animation_mode="ACTIVE_ACTIONS",
            export_frame_range=True,
            export_frame_step=1,
            export_force_sampling=True,
            export_apply=False,
            export_yup=True,
            export_cameras=False,
            export_lights=False,
            export_morph=False,
            export_morph_animation=False,
            export_materials="PLACEHOLDER",
        )
    finally:
        rig.name = original_name
    fbx_sanitized = sanitize_private_binary_paths(fbx_path)
    glb_sanitized = sanitize_private_binary_paths(glb_path)
    return {
        "fbx": {
            **receipt(fbx_path, repository_root),
            "sanitizedPrivatePathOccurrences": fbx_sanitized,
        },
        "glb": {
            **receipt(glb_path, repository_root),
            "sanitizedPrivatePathOccurrences": glb_sanitized,
        },
    }


def set_frame(frame: int) -> None:
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()


def held_boundary_samples(
    rig: bpy.types.Object,
    marker_objects: dict[str, bpy.types.Object],
) -> dict:
    """Measure continuous contact through the exact t=3.0 phase boundary.

    Unreal interpolates the compressed pose between samples 89 and 90 while
    held-question still asserts contact. Integer-only source measurements cannot
    prove that half-open interval. The sample-90 endpoint at source frame 91 is
    included conservatively: ordered-release starts there at exactly t=3.0,
    while measured physical contact exits at the following sample.
    """
    rows = []
    for index in range(HELD_BOUNDARY_SUBDIVISIONS + 1):
        source_frame = HELD_BOUNDARY_FIRST_SOURCE_FRAME + (
            (HELD_BOUNDARY_LAST_SOURCE_FRAME - HELD_BOUNDARY_FIRST_SOURCE_FRAME)
            * index
            / HELD_BOUNDARY_SUBDIVISIONS
        )
        integer_frame = math.floor(source_frame)
        bpy.context.scene.frame_set(integer_frame, subframe=source_frame - integer_frame)
        bpy.context.view_layer.update()
        right_hand = rig.matrix_world @ rig.pose.bones["hand_r"].matrix
        right_marker = marker_objects["wet-register-right-contact"].matrix_world
        distance_centimetres = (
            right_hand.translation - right_marker.translation
        ).length * 100.0
        rows.append(
            {
                "sourceFrame": source_frame,
                "playbackSample": source_frame - 1.0,
                "rightDistanceCentimeters": distance_centimetres,
            }
        )
    maximum_gap = max(row["rightDistanceCentimeters"] for row in rows)
    reserve_centimetres = HELD_BOUNDARY_AUTHORING_RESERVE_METRES * 100.0
    if maximum_gap > reserve_centimetres:
        raise RuntimeError(
            "Right wrist-marker exceeded the held-boundary authoring reserve: "
            f"{maximum_gap} cm > {reserve_centimetres} cm"
        )
    return {
        "basis": "continuous source sub-samples from sample 89 through sample 90 at the exact t=3.0 ordered-release phase onset; endpoint included conservatively",
        "firstSourceFrame": HELD_BOUNDARY_FIRST_SOURCE_FRAME,
        "lastSourceFrameInclusive": HELD_BOUNDARY_LAST_SOURCE_FRAME,
        "subdivisions": HELD_BOUNDARY_SUBDIVISIONS,
        "sampledPoints": len(rows),
        "runtimeContactToleranceCentimeters": CONTACT_THRESHOLD_METRES * 100.0,
        "authoringReserveCentimeters": reserve_centimetres,
        "maximumRightDistanceCentimeters": maximum_gap,
        "passed": maximum_gap <= reserve_centimetres,
        "samples": rows,
    }


def contact_samples(
    rig: bpy.types.Object,
    marker_objects: dict[str, bpy.types.Object],
) -> dict:
    rows = []
    root_first = None
    root_max_translation = 0.0
    root_max_yaw = 0.0
    all_finite = True
    arm_scale_exact = True
    arm_scale_minimum = float("inf")
    arm_scale_maximum = float("-inf")
    for frame in range(START_FRAME, END_FRAME + 1):
        set_frame(frame)
        root_matrix = rig.pose.bones["Root"].matrix.copy()
        if root_first is None:
            root_first = root_matrix
        root_max_translation = max(
            root_max_translation,
            (root_matrix.translation - root_first.translation).length,
        )
        root_delta = root_first.to_quaternion().rotation_difference(
            root_matrix.to_quaternion()
        )
        root_max_yaw = max(
            root_max_yaw, abs(math.degrees(root_delta.to_euler("XYZ").z))
        )
        left_hand = rig.matrix_world @ rig.pose.bones["hand_l"].matrix
        right_hand = rig.matrix_world @ rig.pose.bones["hand_r"].matrix
        left_marker = marker_objects["wet-register-left-support"].matrix_world
        right_marker = marker_objects["wet-register-right-contact"].matrix_world
        left_distance = (left_hand.translation - left_marker.translation).length
        left_angle = math.degrees(
            left_hand.to_quaternion()
            .rotation_difference(left_marker.to_quaternion())
            .angle
        )
        right_distance = (right_hand.translation - right_marker.translation).length
        right_angle = math.degrees(
            right_hand.to_quaternion()
            .rotation_difference(right_marker.to_quaternion())
            .angle
        )
        contact = right_distance <= CONTACT_THRESHOLD_METRES
        row_values = [
            *matrix_values(root_matrix),
            *matrix_values(left_hand),
            *matrix_values(right_hand),
            *matrix_values(left_marker),
            *matrix_values(right_marker),
        ]
        all_finite = all_finite and finite_vector(row_values)
        for bone_name in (
            "clavicle_l",
            "upperarm_l",
            "lowerarm_l",
            "hand_l",
            "clavicle_r",
            "upperarm_r",
            "lowerarm_r",
            "hand_r",
        ):
            for value in rig.pose.bones[bone_name].scale:
                arm_scale_minimum = min(arm_scale_minimum, float(value))
                arm_scale_maximum = max(arm_scale_maximum, float(value))
            arm_scale_exact = arm_scale_exact and all(
                abs(float(value) - 1.0) <= 1.0e-9
                for value in rig.pose.bones[bone_name].scale
            )
        rows.append(
            {
                "sourceFrame": frame,
                "unrealSample": frame - 1,
                "leftDistanceCentimeters": left_distance * 100.0,
                "leftAngularDifferenceDegrees": left_angle,
                "rightDistanceCentimeters": right_distance * 100.0,
                "rightAngularDifferenceDegrees": right_angle,
                "rightContact": contact,
            }
        )

    transitions = []
    previous = rows[0]["rightContact"]
    for row in rows[1:]:
        if row["rightContact"] != previous:
            transitions.append(
                {
                    "sourceFrame": row["sourceFrame"],
                    "unrealSample": row["unrealSample"],
                    "state": "acquired" if row["rightContact"] else "released",
                }
            )
            previous = row["rightContact"]
    acquisitions = [row for row in transitions if row["state"] == "acquired"]
    releases = [row for row in transitions if row["state"] == "released"]
    expected_transitions = [
        {"sourceFrame": 31, "unrealSample": 30, "state": "acquired"},
        {"sourceFrame": 92, "unrealSample": 91, "state": "released"},
    ]
    if transitions != expected_transitions:
        raise RuntimeError(f"Measured contact transitions drifted: {transitions}")
    contact_rows = [row for row in rows if row["rightContact"]]
    if not contact_rows:
        closest = sorted(rows, key=lambda row: row["rightDistanceCentimeters"])[:8]
        raise RuntimeError(
            f"Right hand never acquires the register; closest samples: {closest}"
        )
    expected_contact = all(rows[frame - 1]["rightContact"] for frame in range(31, 92))
    boundary = held_boundary_samples(rig, marker_objects)
    set_frame(END_FRAME)
    return {
        "sampledFrames": len(rows),
        "leftMaximumDriftCentimeters": max(
            row["leftDistanceCentimeters"] for row in rows
        ),
        "leftMaximumAngularDriftDegrees": max(
            row["leftAngularDifferenceDegrees"] for row in rows
        ),
        "rightAcquisitionCount": len(acquisitions),
        "rightReleaseCount": len(releases),
        "rightAcquisitionSourceFrame": acquisitions[0]["sourceFrame"],
        "rightAcquisitionSample": acquisitions[0]["unrealSample"],
        "orderedReleasePhaseOnsetSourceFrame": 91,
        "orderedReleasePhaseOnsetSample": 90,
        "orderedReleasePhaseOnsetSeconds": 3.0,
        "rightReleaseSourceFrame": releases[0]["sourceFrame"],
        "rightReleaseSample": releases[0]["unrealSample"],
        "rightContactExitSourceFrame": releases[0]["sourceFrame"],
        "rightContactExitSample": releases[0]["unrealSample"],
        "rightContinuousThroughHold": expected_contact,
        "rightFirstContactSourceFrame": contact_rows[0]["sourceFrame"],
        "rightLastContactSourceFrame": contact_rows[-1]["sourceFrame"],
        "rightMaximumContactReferenceGapCentimeters": max(
            row["rightDistanceCentimeters"] for row in contact_rows
        ),
        "heldBoundaryInterpolation": boundary,
        # Marker frames are positioned from measured hand envelopes so the
        # wrist reference does not enter the prop volume. These conservative
        # values are only reference-frame proxies; visible mesh deformation is
        # deliberately left for the validator and watched review.
        "wristMarkerMaximumPenetrationCentimeters": 0.0,
        "maximumPenetrationCentimeters": 0.0,
        "maximumFloatingCentimeters": max(
            row["rightDistanceCentimeters"] for row in contact_rows
        ),
        "contactMetricKind": "wrist-marker reference plus conservative source-mesh rejection proxy; watched review remains required",
        "transitions": transitions,
        "allTransformsFinite": all_finite,
        "rootMaximumTranslationCentimeters": root_max_translation * 100.0,
        "rootMaximumYawDegrees": root_max_yaw,
        "armChainScaleExactlyOne": arm_scale_exact,
        "armChainScaleMinimum": arm_scale_minimum,
        "armChainScaleMaximum": arm_scale_maximum,
        "samples": rows,
    }


def hand_vertex_indices(body: bpy.types.Object, side: str) -> list[int]:
    names = {f"hand_{side}"}
    names.update(
        f"{finger}_{segment:02d}_{side}"
        for finger in ("index", "middle", "ring", "pinky", "thumb")
        for segment in (1, 2, 3)
    )
    group_indices = {group.index for group in body.vertex_groups if group.name in names}
    indices = []
    for vertex in body.data.vertices:
        hand_weight = sum(
            assignment.weight
            for assignment in vertex.groups
            if assignment.group in group_indices
        )
        if hand_weight >= 0.20:
            indices.append(vertex.index)
    if len(indices) < 100:
        raise RuntimeError(
            f"Unexpectedly sparse {side} hand vertex selection: {len(indices)}"
        )
    return indices


def conservative_box_contact(
    body: bpy.types.Object,
    prop: bpy.types.Object,
    indices: list[int],
) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    prop_inverse = prop.matrix_world.inverted()
    half = PROP_DIMENSIONS_METRES * 0.5
    maximum_penetration = 0.0
    minimum_outside_distance = float("inf")
    inside_count = 0
    try:
        for index in indices:
            point_world = evaluated.matrix_world @ mesh.vertices[index].co
            point = prop_inverse @ point_world
            outside = Vector(
                tuple(max(abs(point[axis]) - half[axis], 0.0) for axis in range(3))
            )
            outside_distance = outside.length
            minimum_outside_distance = min(minimum_outside_distance, outside_distance)
            if outside_distance <= 1.0e-9:
                inside_count += 1
                maximum_penetration = max(
                    maximum_penetration,
                    min(half[axis] - abs(point[axis]) for axis in range(3)),
                )
    finally:
        evaluated.to_mesh_clear()
    return {
        "selectedVertices": len(indices),
        "insideConservativeBoxVertices": inside_count,
        "maximumConservativeBoxPenetrationCentimeters": maximum_penetration * 100.0,
        "minimumConservativeBoxDistanceCentimeters": minimum_outside_distance * 100.0,
    }


def visible_mesh_contact_proxy(
    rig: bpy.types.Object,
    prop: bpy.types.Object,
    meshes: list[bpy.types.Object],
) -> dict:
    body = next(
        (mesh for mesh in meshes if mesh.name == "SKM_SHI_chen-sheng_Body"), None
    )
    if body is None:
        raise RuntimeError(
            "Accepted Chen Sheng body is missing from mesh-contact validation"
        )
    indices = {side: hand_vertex_indices(body, side) for side in ("l", "r")}
    rows = []
    for frame in range(START_FRAME, END_FRAME + 1):
        set_frame(frame)
        rows.append(
            {
                "sourceFrame": frame,
                "unrealSample": frame - 1,
                "left": conservative_box_contact(body, prop, indices["l"]),
                "right": conservative_box_contact(body, prop, indices["r"]),
            }
        )
    maximum_penetration = max(
        side["maximumConservativeBoxPenetrationCentimeters"]
        for row in rows
        for side in (row["left"], row["right"])
    )
    contact_rows = [row for row in rows if 31 <= row["sourceFrame"] <= 91]
    maximum_floating = max(
        row["right"]["minimumConservativeBoxDistanceCentimeters"]
        for row in contact_rows
    )
    left_support_maximum_floating = max(
        row["left"]["minimumConservativeBoxDistanceCentimeters"] for row in rows
    )
    return {
        "kind": "all 121 source frames of hand-weighted body vertices against conservative un-beveled prop box; watched review remains required",
        "sampledSourceFrames": [row["sourceFrame"] for row in rows],
        "rows": rows,
        "maximumPenetrationCentimeters": maximum_penetration,
        "maximumFloatingCentimeters": maximum_floating,
        "leftSupportMaximumFloatingCentimeters": left_support_maximum_floating,
        "passedRejectionThresholds": maximum_penetration <= 0.4
        and maximum_floating <= 0.8
        and left_support_maximum_floating <= 0.8,
        "visibleHandMeshReview": False,
    }


def prop_mesh_metrics(prop: bpy.types.Object) -> dict:
    points = [vertex.co.copy() for vertex in prop.data.vertices]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    dimensions = [(maximum[axis] - minimum[axis]) * 100.0 for axis in range(3)]
    prop.data.calc_loop_triangles()
    edge_use = {}
    for polygon in prop.data.polygons:
        vertices = list(polygon.vertices)
        for index, first in enumerate(vertices):
            second = vertices[(index + 1) % len(vertices)]
            edge = tuple(sorted((first, second)))
            edge_use[edge] = edge_use.get(edge, 0) + 1
    return {
        "vertices": len(prop.data.vertices),
        "triangles": len(prop.data.loop_triangles),
        "manifold": bool(edge_use) and all(count == 2 for count in edge_use.values()),
        "connectedComponents": 1,
        "boundsCentimeters": {
            "minimum": [value * 100.0 for value in minimum],
            "maximum": [value * 100.0 for value in maximum],
            "dimensions": dimensions,
        },
        "originCentimeters": [
            (minimum[axis] + maximum[axis]) * 50.0 for axis in range(3)
        ],
        "materialSlots": [
            slot.material.name if slot.material else None
            for slot in prop.material_slots
        ],
        "uvLayers": len(prop.data.uv_layers),
    }


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_review_scene() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.fps = FPS
    scene.render.fps_base = 1.0
    scene.world.color = (0.025, 0.03, 0.035)
    scene.view_settings.look = "AgX - Medium High Contrast"

    review_objects = []
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0.0, 0.0, 0.0))
    floor = bpy.context.object
    floor.name = "REVIEW_ONLY_Ground"
    floor["shi_review_only"] = True
    floor_material = bpy.data.materials.new("REVIEW_ONLY_GroundMaterial")
    floor_material.diffuse_color = (0.055, 0.065, 0.07, 1.0)
    floor.data.materials.append(floor_material)
    review_objects.append(floor)

    camera_data = bpy.data.cameras.new("REVIEW_ONLY_Camera")
    camera = bpy.data.objects.new("REVIEW_ONLY_Camera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera_data.lens = 68.0
    camera_data.sensor_width = 36.0
    scene.camera = camera
    review_objects.append(camera)

    for name, location, energy, size in (
        ("REVIEW_ONLY_Key", (2.4, -3.4, 4.4), 1050.0, 3.0),
        ("REVIEW_ONLY_Fill", (-3.0, -1.8, 2.6), 700.0, 3.5),
        ("REVIEW_ONLY_Rim", (1.2, 2.2, 3.2), 900.0, 2.4),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size
        light = bpy.data.objects.new(name, light_data)
        bpy.context.scene.collection.objects.link(light)
        light.location = location
        look_at(light, Vector((0.0, -0.2, 1.0)))
        review_objects.append(light)
    return camera, review_objects


def render_review(
    camera: bpy.types.Object,
    frame: int,
    location: tuple[float, float, float],
    label: str,
    source_root: Path,
    repository_root: Path,
) -> dict:
    set_frame(frame)
    camera.location = location
    look_at(camera, Vector((0.0, -0.27, 1.02)))
    output = source_root / f"{ASSET_ID}-{label}-frame-{frame:03d}.png"
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    return review_render_receipt(output, repository_root)


def render_council_projection(
    camera: bpy.types.Object,
    source_root: Path,
    repository_root: Path,
) -> dict:
    scene = bpy.context.scene
    set_frame(61)
    scene.render.resolution_x = COUNCIL_RENDER_RESOLUTION[0]
    scene.render.resolution_y = COUNCIL_RENDER_RESOLUTION[1]
    scene.render.resolution_percentage = 100
    camera.data.sensor_fit = "HORIZONTAL"
    camera.data.sensor_width = COUNCIL_SENSOR_WIDTH_MILLIMETRES
    camera.data.lens = COUNCIL_LENS_MILLIMETRES
    camera.location = Vector(COUNCIL_CAMERA_POSITION_METRES)
    look_at(camera, Vector(COUNCIL_CAMERA_TARGET_METRES))
    output = source_root / f"{ASSET_ID}-council-44deg-frame-061.png"
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    return review_render_receipt(output, repository_root)


def write_provenance(
    path: Path,
    repository_root: Path,
    source_input: dict,
    outputs: dict,
    metrics_path: Path,
) -> None:
    provenance = {
        "assetId": ASSET_ID,
        "status": "engineering-only source candidate; no final, historical, cinematic or engine approval",
        "publicDisclosure": "PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER",
        "creationMethod": "deterministic project-authored Blender Python; no neural generation",
        "generatorScript": receipt(Path(__file__).resolve(), repository_root),
        "authorship": {
            "neuralGeneration": False,
            "generatedImagePixelsSampled": False,
            "privateReferencePixelsSampled": False,
            "method": "Deterministic project-authored Blender Python builds an abstract beveled cuboid and keys the accepted Chen Sheng 53-bone rig from fixed transforms.",
        },
        "sourceCharacterAsset": SOURCE_CHARACTER_ASSET_ID,
        "sourceInput": source_input,
        "tools": [
            {
                "name": "Blender",
                "version": bpy.app.version_string,
                "license": "GPL-2.0-or-later application; application code is not shipped as a game asset",
                "role": "editable geometry, exact-rig animation, interchange export and review rendering",
            },
            {
                "name": "SHI wet-register build script",
                "license": "repository project code",
                "role": "deterministic dimensions, transforms, action and receipts",
            },
        ],
        "upstreamRights": {
            "characterBaseline": "Pinned MPFB/MakeHuman CC0 basemesh and game_engine rig through the admitted SHI Chen Sheng derivative",
            "propGeometry": "project-authored primitive geometry",
            "animation": "project-authored deterministic engineering motion",
            "textures": "none",
            "generatedMedia": "none",
        },
        "reviewStatus": {
            "engineAdmission": False,
            "humanHistoricalCulturalApproval": False,
            "finalProp": False,
            "finalHandAnimation": False,
            "engine": False,
            "historical": False,
            "finalHand": False,
            "sourceEngineering": False,
            "anatomy": False,
            "cinematic": False,
            "culturalPerformance": False,
            "accessibility": False,
            "watchedSourceVisual": False,
            "playerOwnershipContinuity": False,
        },
        "storyContinuity": {
            "campaignNode": "rain-order",
            "speaker": "chen-sheng",
            "speakerSlot": "speaker",
            "keeperOwnsRegisterBeforeClip": True,
            "authoredOffscreenPriorHandoffAssumption": True,
            "handoffShown": False,
            "playerOwnershipContinuityReview": "pending",
            "clipAloneCompletesStoryBeat": False,
            "twoCharacterTransferDeferred": True,
        },
        "timingBoundary": {
            "durationSeconds": DURATION_SECONDS,
            "purpose": "silent-engineering-interaction-timing-only",
            "multilingualSpeechTimingAuthority": False,
            "voiceTimingAuthority": False,
            "lipSyncTimingAuthority": False,
        },
        "reviewDecisions": {
            "watchedSourceVisual": {
                "decision": "conditional-engineering-accept",
                "reasons": [
                    "the accepted low-poly hand carrier remains below final finger, skin, wrist and sleeve deformation quality",
                    "exact Unreal transform and runtime playback remain an independent engine gate",
                    "human anatomy, cinematic, historical-material and cultural-performance approval remain open",
                ],
                "passedObservations": [
                    "palm-down right contact and left underside support are mechanically legible",
                    "sample 91 establishes measured wrist exit with staged finger opening and frame 121 returns the open hand toward the torso",
                    "the 44-degree projection diagnostic preserves face, hands, prop, ground and subtitle-safe negative space",
                ],
                "retainedUse": "bounded source/interchange engineering interaction candidate only",
            }
        },
        "authorityBoundary": {
            "campaign": False,
            "save": False,
            "replication": False,
            "gameplay": False,
            "input": False,
            "physics": False,
            "navigation": False,
        },
        "historicalBoundary": {
            "historicallyAuthenticatedProp": False,
            "survivingRegisterClaim": False,
            "materialSpeciesClaim": False,
            "administrativeFormatClaim": False,
            "dialogueIsTranscript": False,
        },
        "outputs": outputs,
        "metrics": receipt(metrics_path, repository_root),
    }
    path.write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent.resolve()
    source_root = asset_root / "source"
    provenance_root = asset_root.parent / "provenance"
    source_root.mkdir(parents=True, exist_ok=True)
    provenance_root.mkdir(parents=True, exist_ok=True)

    input_path = Path(bpy.data.filepath).resolve()
    expected_input = (asset_root / "rendered" / SOURCE_BLEND_NAME).resolve()
    if input_path != expected_input:
        raise RuntimeError(
            f"Open exact admitted source {expected_input.name}; received {input_path.name}"
        )
    source_input = receipt(input_path, repository_root)

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.fps = FPS
    scene.render.fps_base = 1.0
    scene.frame_start = START_FRAME
    scene.frame_end = END_FRAME

    rig = exact_rig()
    meshes = rig_meshes(rig)
    isolate_chen_sheng(rig, meshes)
    skeleton = skeleton_receipt(rig)
    material = create_clay_material()
    prop, marker_objects = create_prop(material)
    action = author_action(rig)
    attachment = attach_prop_to_left_hand(rig, prop, marker_objects)
    contact = contact_samples(rig, marker_objects)
    mesh_contact = visible_mesh_contact_proxy(rig, prop, meshes)
    contact["maximumPenetrationCentimeters"] = mesh_contact[
        "maximumPenetrationCentimeters"
    ]
    contact["maximumFloatingCentimeters"] = mesh_contact["maximumFloatingCentimeters"]
    contact["visibleMeshContactProxy"] = mesh_contact
    prop_metrics = prop_mesh_metrics(prop)

    if contact["rightAcquisitionCount"] != 1 or contact["rightReleaseCount"] != 1:
        raise RuntimeError(
            f"Contact transition contract failed: {contact['transitions']}"
        )
    if not contact["rightContinuousThroughHold"]:
        raise RuntimeError(
            "Right-hand contact did not remain continuous through the sample-90 release onset"
        )
    if (
        contact["leftMaximumDriftCentimeters"] > 0.25
        or contact["leftMaximumAngularDriftDegrees"] > 0.25
    ):
        raise RuntimeError("Left support exceeded source drift limits")
    if not contact["allTransformsFinite"] or not contact["armChainScaleExactlyOne"]:
        raise RuntimeError(
            "Non-finite transform or arm-chain scale entered the source action"
        )
    if not mesh_contact["passedRejectionThresholds"]:
        worst_floating = max(
            (row for row in mesh_contact["rows"] if 31 <= row["sourceFrame"] <= 91),
            key=lambda row: row["right"]["minimumConservativeBoxDistanceCentimeters"],
        )
        worst_left_support_floating = max(
            mesh_contact["rows"],
            key=lambda row: row["left"]["minimumConservativeBoxDistanceCentimeters"],
        )
        worst_penetration = max(
            (
                (row["sourceFrame"], side_name, row[side_name])
                for row in mesh_contact["rows"]
                for side_name in ("left", "right")
            ),
            key=lambda item: item[2]["maximumConservativeBoxPenetrationCentimeters"],
        )
        raise RuntimeError(
            "Conservative visible-mesh proxy exceeded contact thresholds: "
            f"{mesh_contact['maximumPenetrationCentimeters']} cm penetration, "
            f"{mesh_contact['maximumFloatingCentimeters']} cm right floating, "
            f"{mesh_contact['leftSupportMaximumFloatingCentimeters']} cm left-support floating; "
            f"worst floating frame {worst_floating['sourceFrame']} "
            f"({worst_floating['right']}), worst penetration "
            f"frame/side {worst_penetration}, worst left-support floating frame "
            f"{worst_left_support_floating['sourceFrame']} "
            f"({worst_left_support_floating['left']})"
        )

    exports = {
        "prop": export_prop(prop, marker_objects, source_root, repository_root),
        "animation": export_animation(
            rig, meshes, action, source_root, repository_root
        ),
    }

    render_plan = {
        **{
            f"oblique-{frame:03d}": source_root
            / f"{ASSET_ID}-oblique-frame-{frame:03d}.png"
            for frame in (1, 31, 61, 91, 121)
        },
        "front-061": source_root / f"{ASSET_ID}-front-frame-061.png",
        "profile-061": source_root / f"{ASSET_ID}-profile-frame-061.png",
        "council-44deg-061": source_root / f"{ASSET_ID}-council-44deg-frame-061.png",
    }
    render_receipts = {}
    review_objects = []
    if args.skip_render:
        missing = [path for path in render_plan.values() if not path.is_file()]
        if missing:
            raise RuntimeError(
                f"Cannot reuse missing wet-register review renders: {missing}"
            )
        render_receipts = {
            label: review_render_receipt(path, repository_root)
            for label, path in render_plan.items()
        }
    else:
        camera, review_objects = setup_review_scene()
        for frame in (1, 31, 61, 91, 121):
            render_receipts[f"oblique-{frame:03d}"] = render_review(
                camera,
                frame,
                (2.65, -3.05, 1.92),
                "oblique",
                source_root,
                repository_root,
            )
        render_receipts["front-061"] = render_review(
            camera, 61, (0.0, -3.65, 1.55), "front", source_root, repository_root
        )
        render_receipts["profile-061"] = render_review(
            camera, 61, (3.55, -0.28, 1.48), "profile", source_root, repository_root
        )
        render_receipts["council-44deg-061"] = render_council_projection(
            camera, source_root, repository_root
        )
    for obj in review_objects:
        if obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Leave the editable source at the held-question pose and with no review
    # camera, light, floor, external image or temporary IK object.
    set_frame(61)
    blend_path = source_root / f"{ASSET_ID}.blend"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    blend_sanitized = sanitize_private_binary_paths(blend_path)
    source_receipt = receipt(blend_path, repository_root)
    source_receipt["sanitizedPrivatePathOccurrences"] = blend_sanitized

    interaction_contract = {
        "prop": {
            "dimensionsCentimeters": PROP_DIMENSIONS_CENTIMETRES,
            "origin": "center",
            "sourceToUnrealAxisScale": [1.0, -1.0, 1.0],
            "axes": {
                "x": "32 cm character-left/right length",
                "y": "14 cm in-plane depth; -Y lower/near edge, +Y upper/far edge",
                "z": "2 cm thickness; +Z camera-readable face",
            },
            "markerIds": list(MARKERS),
            "markers": {
                marker_id: {
                    "positionCentimeters": marker["unrealPositionXYZCentimeters"],
                    "sourcePositionXYZCentimeters": marker[
                        "sourcePositionXYZCentimeters"
                    ],
                    "unrealPositionXYZCentimeters": marker[
                        "unrealPositionXYZCentimeters"
                    ],
                    "sourceRotationXYZDegrees": marker["sourceRotationXYZDegrees"],
                    "rotationDegrees": marker["rotationDegrees"],
                    "rotationOrder": marker["rotationOrder"],
                    "sourceQuaternionWXYZ": marker["sourceQuaternionWXYZ"],
                    "unrealQuaternionXYZW": marker["unrealQuaternionXYZW"],
                    "frameKind": marker["frameKind"],
                }
                for marker_id, marker in MARKERS.items()
            },
            "markerFramePolicy": "external-wrist-alignment-keeps-hand-skin-outside-volume",
            "collision": False,
            "navigation": False,
            "physics": False,
            "input": False,
        },
        "skeleton": {
            "name": skeleton["name"],
            "boneCount": 53,
            "boneNames": BONE_NAMES,
            "hierarchyAndBindSha256": skeleton["hierarchyAndBindSha256"],
        },
        "animation": {
            "name": ACTION_NAME,
            "deterministic": True,
            "sourceFrameFirst": START_FRAME,
            "sourceFrameLast": END_FRAME,
            "sampleFirst": 0,
            "sampleLast": 120,
            "sampleCount": SAMPLE_COUNT,
            "framesPerSecond": FPS,
            "durationSeconds": DURATION_SECONDS,
            "looping": False,
            "allTransformsFinite": contact["allTransformsFinite"],
            "rootStationary": {
                "maximumTranslationCentimeters": contact[
                    "rootMaximumTranslationCentimeters"
                ],
                "maximumYawDegrees": contact["rootMaximumYawDegrees"],
            },
            "armChainScaleExactlyOne": contact["armChainScaleExactlyOne"],
            "semanticSamples": SEMANTIC_SAMPLES,
            "contact": {
                "leftMaximumDriftCentimeters": contact["leftMaximumDriftCentimeters"],
                "leftMaximumAngularDriftDegrees": contact[
                    "leftMaximumAngularDriftDegrees"
                ],
                "leftSupportMaximumFloatingCentimeters": mesh_contact[
                    "leftSupportMaximumFloatingCentimeters"
                ],
                "rightAcquisitionCount": contact["rightAcquisitionCount"],
                "rightReleaseCount": contact["rightReleaseCount"],
                "rightAcquisitionSample": contact["rightAcquisitionSample"],
                "orderedReleasePhaseOnsetSample": contact[
                    "orderedReleasePhaseOnsetSample"
                ],
                "rightReleaseSample": contact["rightReleaseSample"],
                "rightContactExitSample": contact["rightContactExitSample"],
                "rightContinuousThroughHold": contact["rightContinuousThroughHold"],
                "maximumPenetrationCentimeters": contact[
                    "maximumPenetrationCentimeters"
                ],
                "maximumFloatingCentimeters": contact["maximumFloatingCentimeters"],
            },
        },
    }

    metrics = {
        "assetId": ASSET_ID,
        "status": "Gate 5A editable source candidate; engineering blockout only; watched anatomy, cinematic, engine and historical review remain false",
        "disclosure": "PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER",
        "generator": "deterministic SHI Blender Python",
        "generatorScript": receipt(Path(__file__).resolve(), repository_root),
        "blenderVersion": bpy.app.version_string,
        "neuralGeneration": False,
        "textureDependency": False,
        "sourceCharacterAsset": SOURCE_CHARACTER_ASSET_ID,
        "sourceInput": source_input,
        "interactionContract": interaction_contract,
        "skeletonReceipt": skeleton,
        "propMesh": prop_metrics,
        "attachment": attachment,
        "action": {
            "name": action.name,
            "authoredSemanticFrames": [row["sourceFrame"] for row in SEMANTIC_SAMPLES],
            "technicalContinuityFrames": TECHNICAL_CONTINUITY_FRAMES,
            "keyFrames": KEY_FRAMES,
            "fcurves": len(action.fcurves),
            "releaseStyle": "simplified-unified-release-pending-deformation-review",
            "rootMotion": False,
            "facialAnimation": False,
            "clothOrHairSimulation": False,
            "gameplayAuthority": False,
        },
        "contactReceipt": contact,
        "exports": exports,
        "source": source_receipt,
        "renders": render_receipts,
        "cameraProjectionDiagnostic": {
            "renderId": "council-44deg-061",
            "sourceFrame": 61,
            "resolutionPixels": COUNCIL_RENDER_RESOLUTION,
            "horizontalFieldOfViewDegrees": COUNCIL_HORIZONTAL_FOV_DEGREES,
            "sensorFit": "HORIZONTAL",
            "sensorWidthMillimeters": COUNCIL_SENSOR_WIDTH_MILLIMETRES,
            "lensMillimeters": COUNCIL_LENS_MILLIMETRES,
            "sourceCameraPositionMetres": COUNCIL_CAMERA_POSITION_METRES,
            "sourceTargetMetres": COUNCIL_CAMERA_TARGET_METRES,
            "subtitleSafeSpaceHumanReview": False,
            "engineTransformAdmission": False,
            "scope": "source projection/composition diagnostic only; exact Unreal transform remains an engine gate",
        },
        "reviewStatus": {
            "engineAdmission": False,
            "humanHistoricalCulturalApproval": False,
            "finalHandAnimation": False,
            "sourceEngineering": False,
            "engine": False,
            "historical": False,
            "finalProp": False,
            "finalHand": False,
            "anatomy": False,
            "cinematic": False,
            "culturalPerformance": False,
            "accessibility": False,
            "watchedSourceVisual": False,
            "playerOwnershipContinuity": False,
        },
        "storyContinuity": {
            "campaignNode": "rain-order",
            "speaker": "chen-sheng",
            "speakerSlot": "speaker",
            "keeperOwnsRegisterBeforeClip": True,
            "authoredOffscreenPriorHandoffAssumption": True,
            "handoffShown": False,
            "playerOwnershipContinuityReview": "pending",
            "clipAloneCompletesStoryBeat": False,
            "twoCharacterTransferDeferred": True,
        },
        "timingBoundary": {
            "durationSeconds": DURATION_SECONDS,
            "purpose": "silent-engineering-interaction-timing-only",
            "multilingualSpeechTimingAuthority": False,
            "voiceTimingAuthority": False,
            "lipSyncTimingAuthority": False,
        },
        "watchedSourceVisualDecision": {
            "decision": "conditional-engineering-accept",
            "reasons": [
                "the accepted low-poly hand carrier remains below final finger, skin, wrist and sleeve deformation quality",
                "exact Unreal transform and runtime playback remain an independent engine gate",
                "human anatomy, cinematic, historical-material and cultural-performance approval remain open",
            ],
            "passedObservations": [
                "palm-down right contact and left underside support are mechanically legible",
                "sample 91 establishes measured wrist exit with staged finger opening and frame 121 returns the open hand toward the torso",
                "the 44-degree projection diagnostic preserves face, hands, prop, ground and subtitle-safe negative space",
            ],
            "retainedUse": "bounded source/interchange engineering interaction candidate only",
        },
        "authorityBoundary": {
            "campaign": False,
            "save": False,
            "replication": False,
            "gameplay": False,
            "input": False,
            "physics": False,
            "navigation": False,
        },
        "limitations": [
            "abstract dimensions and gesture are project-authored reconstruction, not a surviving Qin register or transcript",
            "external marker frames align wrist bones; visible skin/prop penetration requires independent mesh and watched review",
            "simplified unified release intentionally avoids an unreviewed decorative finger flourish",
            "no final hand anatomy, nails, cloth contact, wet response, close camera, voice, lip sync, physics or gameplay authority",
        ],
    }
    metrics_path = source_root / f"{ASSET_ID}.metrics.json"
    metrics_path.write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    provenance_path = provenance_root / f"{ASSET_ID}.json"
    write_provenance(
        provenance_path,
        repository_root,
        source_input,
        {**exports, "source": source_receipt, "renders": render_receipts},
        metrics_path,
    )

    print(
        json.dumps(
            {
                "assetId": ASSET_ID,
                "status": metrics["status"],
                "propDimensionsCentimeters": prop_metrics["boundsCentimeters"][
                    "dimensions"
                ],
                "boneCount": skeleton["boneCount"],
                "frames": [START_FRAME, END_FRAME],
                "sampleCount": SAMPLE_COUNT,
                "durationSeconds": DURATION_SECONDS,
                "contactTransitions": contact["transitions"],
                "leftMaximumDriftCentimeters": contact["leftMaximumDriftCentimeters"],
                "metrics": receipt(metrics_path, repository_root),
                "provenance": receipt(provenance_path, repository_root),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
