"""Validate Gate 5A editable source and clean FBX/GLB interchange.

Run with pinned Blender 4.5.12 LTS from a factory-empty process:

  blender --background --factory-startup \
    --python scripts/validate-daze-council-wet-register-interaction.py -- \
    --asset-root assets/3d

This is a source/interchange engineering validator. Its pass cannot manufacture
engine admission or human anatomy, cinematic, historical or cultural approval.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import sys

import bmesh
import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-council-wet-register-interaction-v1"
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
CONTACT_THRESHOLD_METRES = 0.008
HELD_BOUNDARY_AUTHORING_RESERVE_METRES = 0.0065
HELD_BOUNDARY_FIRST_SOURCE_FRAME = 90.0
HELD_BOUNDARY_LAST_SOURCE_FRAME = 91.0
HELD_BOUNDARY_SUBDIVISIONS = 64
EXPECTED_TRANSITIONS = [
    {"sourceFrame": 31, "unrealSample": 30, "state": "acquired"},
    {"sourceFrame": 92, "unrealSample": 91, "state": "released"},
]
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
MARKERS = {
    "wet-register-left-support": {
        "sourcePositionXYZCentimeters": [11.0, 5.5, -3.35],
        "unrealPositionXYZCentimeters": [11.0, -5.5, -3.35],
        "sourceRotationXYZDegrees": [180.0, 0.0, 0.0],
        "rotationDegrees": [0.0, 0.0, 180.0],
        "unrealQuaternionXYZW": [1.0, 0.0, 0.0, 0.0],
        "frameKind": "external-wrist-alignment",
    },
    "wet-register-right-contact": {
        "sourcePositionXYZCentimeters": [-11.0, -5.5, 3.35],
        "unrealPositionXYZCentimeters": [-11.0, 5.5, 3.35],
        "sourceRotationXYZDegrees": [0.0, 0.0, -90.0],
        "rotationDegrees": [0.0, 90.0, 0.0],
        "unrealQuaternionXYZW": [0.0, 0.0, 0.7071067811865475, 0.7071067811865476],
        "frameKind": "external-wrist-alignment",
    },
    "wet-register-camera-readability": {
        "sourcePositionXYZCentimeters": [0.0, 0.0, 1.0],
        "unrealPositionXYZCentimeters": [0.0, 0.0, 1.0],
        "sourceRotationXYZDegrees": [0.0, 0.0, 0.0],
        "rotationDegrees": [0.0, 0.0, 0.0],
        "unrealQuaternionXYZW": [0.0, 0.0, 0.0, 1.0],
        "frameKind": "camera-readability",
    },
}
ARM_BONES = [
    "clavicle_l",
    "upperarm_l",
    "lowerarm_l",
    "hand_l",
    "clavicle_r",
    "upperarm_r",
    "lowerarm_r",
    "hand_r",
]
ACTION_PATH = re.compile(
    r'^pose\.bones\["([^"]+)"\]\.(location|rotation_quaternion|scale)$'
)


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def receipt(path: Path, repository_root: Path) -> dict:
    return {
        "file": path.resolve().relative_to(repository_root).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def close(a: float, b: float, tolerance: float = 1.0e-6) -> bool:
    return abs(float(a) - float(b)) <= tolerance


def close_vector(actual, expected, tolerance: float = 1.0e-6) -> bool:
    return len(actual) == len(expected) and all(
        close(a, b, tolerance) for a, b in zip(actual, expected)
    )


def canonical_json(value) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def skeleton_receipt(rig: bpy.types.Object) -> dict:
    bones = []
    for bone in rig.data.bones:
        bones.append(
            {
                "name": bone.name,
                "parent": bone.parent.name if bone.parent else None,
                "matrixLocal": [
                    round(float(bone.matrix_local[row][column]), 12)
                    for row in range(4)
                    for column in range(4)
                ],
                "lengthMetres": round(float(bone.length), 12),
            }
        )
    return {
        "name": rig.data.name,
        "boneCount": len(bones),
        "boneNames": [row["name"] for row in bones],
        "hierarchyAndBindSha256": hashlib.sha256(canonical_json(bones)).hexdigest(),
    }


def mesh_bounds_local(obj: bpy.types.Object) -> dict:
    points = [vertex.co for vertex in obj.data.vertices]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": [maximum[axis] - minimum[axis] for axis in range(3)],
        "center": [(minimum[axis] + maximum[axis]) * 0.5 for axis in range(3)],
    }


def topology_receipt(obj: bpy.types.Object) -> dict:
    obj.data.calc_loop_triangles()
    topology = bmesh.new()
    topology.from_mesh(obj.data)
    raw_vertices = len(topology.verts)
    bmesh.ops.remove_doubles(topology, verts=topology.verts, dist=1.0e-5)
    welded_vertices = len(topology.verts)
    non_manifold = sum(1 for edge in topology.edges if not edge.is_manifold)
    inconsistent = sum(
        1 for edge in topology.edges if edge.is_manifold and not edge.is_contiguous
    )
    components = 0
    unseen = set(topology.verts)
    while unseen:
        components += 1
        stack = [unseen.pop()]
        while stack:
            vertex = stack.pop()
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other in unseen:
                    unseen.remove(other)
                    stack.append(other)
    signed_volume = topology.calc_volume(signed=True)
    topology.free()
    return {
        "vertices": len(obj.data.vertices),
        "weldedVertices": welded_vertices,
        "normalSplitVertices": raw_vertices - welded_vertices,
        "triangles": len(obj.data.loop_triangles),
        "nonManifoldEdges": non_manifold,
        "inconsistentWindingEdges": inconsistent,
        "connectedComponents": components,
        "signedVolume": signed_volume,
    }


def action_curve_receipt(action: bpy.types.Action) -> dict:
    keyed_bones = set()
    channel_counts = {}
    all_finite = True
    location_zero = True
    scale_one = True
    root_identity = True
    keyframes = set()
    for curve in action.fcurves:
        match = ACTION_PATH.match(curve.data_path)
        if not match:
            raise RuntimeError(f"Unauthorized action curve: {curve.data_path}")
        bone_name, channel = match.groups()
        if bone_name not in BONE_NAMES:
            raise RuntimeError(f"Unknown action bone: {bone_name}")
        keyed_bones.add(bone_name)
        channel_counts[channel] = channel_counts.get(channel, 0) + 1
        for key in curve.keyframe_points:
            keyframes.add(round(float(key.co.x)))
            value = float(key.co.y)
            all_finite = all_finite and math.isfinite(value)
            if channel == "location":
                location_zero = location_zero and abs(value) <= 1.0e-7
            elif channel == "scale":
                scale_one = scale_one and abs(value - 1.0) <= 1.0e-7
            elif bone_name == "Root":
                expected = 1.0 if curve.array_index == 0 else 0.0
                root_identity = root_identity and abs(value - expected) <= 1.0e-7
    return {
        "fcurves": len(action.fcurves),
        "keyedBones": sorted(keyed_bones),
        "channelCounts": channel_counts,
        "keyFrames": sorted(keyframes),
        "allFinite": all_finite,
        "allBoneLocationsZero": location_zero,
        "allBoneScalesOne": scale_one,
        "rootQuaternionIdentity": root_identity,
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


def box_contact_for_vertices(
    body: bpy.types.Object,
    prop: bpy.types.Object,
    indices: list[int],
) -> dict:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    prop_inverse = prop.matrix_world.inverted()
    half = Vector((0.16, 0.07, 0.01))
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
                depth = min(half[axis] - abs(point[axis]) for axis in range(3))
                maximum_penetration = max(maximum_penetration, depth)
    finally:
        evaluated.to_mesh_clear()
    return {
        "selectedVertices": len(indices),
        "insideConservativeBoxVertices": inside_count,
        "maximumConservativeBoxPenetrationCentimeters": maximum_penetration * 100.0,
        "minimumConservativeBoxDistanceCentimeters": minimum_outside_distance * 100.0,
    }


def sample_source_motion(
    rig: bpy.types.Object,
    prop: bpy.types.Object,
    markers: dict[str, bpy.types.Object],
    body: bpy.types.Object,
) -> dict:
    rows = []
    root_first = None
    root_translation = 0.0
    root_yaw = 0.0
    scale_minimum = float("inf")
    scale_maximum = float("-inf")
    finite = True
    right_indices = hand_vertex_indices(body, "r")
    left_indices = hand_vertex_indices(body, "l")
    mesh_rows = []
    for frame in range(START_FRAME, END_FRAME + 1):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        root = rig.pose.bones["Root"].matrix.copy()
        if root_first is None:
            root_first = root
        root_translation = max(
            root_translation, (root.translation - root_first.translation).length
        )
        delta = root_first.to_quaternion().rotation_difference(root.to_quaternion())
        root_yaw = max(root_yaw, abs(math.degrees(delta.to_euler("XYZ").z)))
        left_hand = rig.matrix_world @ rig.pose.bones["hand_l"].matrix
        right_hand = rig.matrix_world @ rig.pose.bones["hand_r"].matrix
        left_marker = markers["wet-register-left-support"].matrix_world
        right_marker = markers["wet-register-right-contact"].matrix_world
        left_distance = (left_hand.translation - left_marker.translation).length
        left_angle = math.degrees(
            left_hand.to_quaternion()
            .rotation_difference(left_marker.to_quaternion())
            .angle
        )
        right_distance = (right_hand.translation - right_marker.translation).length
        finite = finite and all(
            math.isfinite(float(value))
            for matrix in (root, left_hand, right_hand, left_marker, right_marker)
            for row in matrix
            for value in row
        )
        for bone_name in ARM_BONES:
            for value in rig.pose.bones[bone_name].scale:
                scale_minimum = min(scale_minimum, float(value))
                scale_maximum = max(scale_maximum, float(value))
        right_contact = right_distance <= CONTACT_THRESHOLD_METRES
        rows.append(
            {
                "sourceFrame": frame,
                "unrealSample": frame - 1,
                "leftDistanceCentimeters": left_distance * 100.0,
                "leftAngularDifferenceDegrees": left_angle,
                "rightDistanceCentimeters": right_distance * 100.0,
                "rightContact": right_contact,
            }
        )
        mesh_rows.append(
            {
                "sourceFrame": frame,
                "left": box_contact_for_vertices(body, prop, left_indices),
                "right": box_contact_for_vertices(body, prop, right_indices),
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
    right_contact_rows = [row for row in rows if row["rightContact"]]
    contact_mesh_rows = [row for row in mesh_rows if 31 <= row["sourceFrame"] <= 91]
    penetration = max(
        side["maximumConservativeBoxPenetrationCentimeters"]
        for row in mesh_rows
        for side in (row["left"], row["right"])
    )
    floating = max(
        row["right"]["minimumConservativeBoxDistanceCentimeters"]
        for row in contact_mesh_rows
    )
    left_support_floating = max(
        row["left"]["minimumConservativeBoxDistanceCentimeters"] for row in mesh_rows
    )
    held_boundary_rows = []
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
        right_marker = markers["wet-register-right-contact"].matrix_world
        held_boundary_rows.append(
            {
                "sourceFrame": source_frame,
                "playbackSample": source_frame - 1.0,
                "rightDistanceCentimeters": (
                    right_hand.translation - right_marker.translation
                ).length
                * 100.0,
            }
        )
    bpy.context.scene.frame_set(END_FRAME)
    bpy.context.view_layer.update()
    held_boundary_maximum = max(
        row["rightDistanceCentimeters"] for row in held_boundary_rows
    )
    return {
        "sampledFrames": len(rows),
        "transitions": transitions,
        "rootMaximumTranslationCentimeters": root_translation * 100.0,
        "rootMaximumYawDegrees": root_yaw,
        "leftMaximumDriftCentimeters": max(
            row["leftDistanceCentimeters"] for row in rows
        ),
        "leftMaximumAngularDriftDegrees": max(
            row["leftAngularDifferenceDegrees"] for row in rows
        ),
        "rightMaximumContactReferenceGapCentimeters": max(
            row["rightDistanceCentimeters"] for row in right_contact_rows
        ),
        "rightContinuousFrames31ThroughReleaseOnset": all(
            rows[frame - 1]["rightContact"] for frame in range(31, 92)
        ),
        "heldBoundaryInterpolation": {
            "basis": "continuous source sub-samples from sample 89 through sample 90 at the exact t=3.0 ordered-release phase onset; endpoint included conservatively",
            "firstSourceFrame": HELD_BOUNDARY_FIRST_SOURCE_FRAME,
            "lastSourceFrameInclusive": HELD_BOUNDARY_LAST_SOURCE_FRAME,
            "subdivisions": HELD_BOUNDARY_SUBDIVISIONS,
            "sampledPoints": len(held_boundary_rows),
            "runtimeContactToleranceCentimeters": CONTACT_THRESHOLD_METRES * 100.0,
            "authoringReserveCentimeters": (
                HELD_BOUNDARY_AUTHORING_RESERVE_METRES * 100.0
            ),
            "maximumRightDistanceCentimeters": held_boundary_maximum,
            "passed": held_boundary_maximum
            <= HELD_BOUNDARY_AUTHORING_RESERVE_METRES * 100.0,
            "samples": held_boundary_rows,
        },
        "armChainScaleMinimum": scale_minimum,
        "armChainScaleMaximum": scale_maximum,
        "allTransformsFinite": finite,
        "meshContactProxy": {
            "kind": "all 121 source frames of hand-weighted body vertices against conservative un-beveled prop box; watched review remains required",
            "sampledSourceFrames": [row["sourceFrame"] for row in mesh_rows],
            "contactRows": mesh_rows,
            "maximumPenetrationCentimeters": penetration,
            "maximumFloatingCentimeters": floating,
            "leftSupportMaximumFloatingCentimeters": left_support_floating,
        },
    }


def validate_source(path: Path, metrics: dict, repository_root: Path) -> dict:
    bpy.ops.wm.open_mainfile(filepath=str(path))
    rig = bpy.data.objects.get(RIG_NAME)
    prop = bpy.data.objects.get(PROP_NAME)
    action = bpy.data.actions.get(ACTION_NAME)
    if (
        not rig
        or rig.type != "ARMATURE"
        or not prop
        or prop.type != "MESH"
        or not action
    ):
        raise RuntimeError("Editable source is missing exact rig, prop or action")
    marker_objects = {name: bpy.data.objects.get(name) for name in MARKERS}
    if any(marker is None for marker in marker_objects.values()):
        raise RuntimeError("Editable source is missing an exact marker object")
    body = bpy.data.objects.get("SKM_SHI_chen-sheng_Body")
    if not body or body.type != "MESH":
        raise RuntimeError("Editable source is missing accepted Chen Sheng body")
    rig.animation_data_create()
    rig.animation_data.action = action
    bounds = mesh_bounds_local(prop)
    topology = topology_receipt(prop)
    curves = action_curve_receipt(action)
    skeleton = skeleton_receipt(rig)
    motion = sample_source_motion(rig, prop, marker_objects, body)
    marker_receipts = {}
    for marker_id, expected in MARKERS.items():
        marker = marker_objects[marker_id]
        marker_receipts[marker_id] = {
            "parent": marker.parent.name if marker.parent else None,
            "positionCentimeters": [float(value) * 100.0 for value in marker.location],
            "rotationXYZDegrees": [
                math.degrees(float(value)) for value in marker.rotation_euler
            ],
            "frameKind": marker.get("shi_frame_kind"),
        }
    source_checks = {
        "exactRigObject": rig.name == RIG_NAME,
        "exactSkeletonName": skeleton["name"] == SKELETON_NAME,
        "exactSkeletonBones": skeleton["boneNames"] == BONE_NAMES,
        "exactSkeletonBindHash": skeleton["hierarchyAndBindSha256"]
        == metrics["interactionContract"]["skeleton"]["hierarchyAndBindSha256"],
        "identityRigTransform": close_vector(rig.location, [0.0, 0.0, 0.0])
        and close_vector(rig.scale, [1.0, 1.0, 1.0]),
        "exactPropBounds": close_vector(
            bounds["dimensions"], [0.32, 0.14, 0.02], 1.0e-6
        ),
        "centerMeshOrigin": close_vector(bounds["center"], [0.0, 0.0, 0.0], 1.0e-6),
        "manifoldSingleProp": topology["nonManifoldEdges"] == 0
        and topology["inconsistentWindingEdges"] == 0
        and topology["connectedComponents"] == 1
        and topology["signedVolume"] > 0.0,
        "boundedPropTopology": topology["vertices"] == 152
        and topology["triangles"] == 300,
        "exactMaterialSlot": [slot.material.name for slot in prop.material_slots]
        == [MATERIAL_NAME],
        "textureFreeProp": len(prop.data.uv_layers) == 0
        and all(
            node.type != "TEX_IMAGE"
            for material in prop.data.materials
            if material and material.use_nodes and material.node_tree
            for node in material.node_tree.nodes
        ),
        "propAuthorityDisabled": prop.get("shi_collision") is False
        and prop.get("shi_navigation") is False
        and prop.get("shi_physics") is False
        and prop.get("shi_input") is False,
        "exactBoneParentAttachment": prop.parent == rig
        and prop.parent_type == "BONE"
        and prop.parent_bone == "hand_l",
        "exactMarkerObjects": all(
            marker_receipts[name]["parent"] == PROP_NAME
            and close_vector(
                marker_receipts[name]["positionCentimeters"],
                expected["sourcePositionXYZCentimeters"],
                1.0e-5,
            )
            and close_vector(
                marker_receipts[name]["rotationXYZDegrees"],
                expected["sourceRotationXYZDegrees"],
                1.0e-4,
            )
            and marker_receipts[name]["frameKind"] == expected["frameKind"]
            for name, expected in MARKERS.items()
        ),
        "exactActionRange": close_vector(action.frame_range, [1.0, 121.0]),
        "exactSelfContainedCurves": curves["fcurves"] == 530
        and curves["keyedBones"] == sorted(BONE_NAMES)
        and curves["channelCounts"]
        == {"location": 159, "rotation_quaternion": 212, "scale": 159},
        "finiteIdentityAuthorityCurves": curves["allFinite"]
        and curves["allBoneLocationsZero"]
        and curves["allBoneScalesOne"]
        and curves["rootQuaternionIdentity"],
        "noRuntimeConstraints": not any(bone.constraints for bone in rig.pose.bones),
        "exact121FrameSampling": motion["sampledFrames"] == SAMPLE_COUNT,
        "exactContactTransitions": motion["transitions"] == EXPECTED_TRANSITIONS,
        "continuousContactThroughHold": motion[
            "rightContinuousFrames31ThroughReleaseOnset"
        ]
        and motion["heldBoundaryInterpolation"]
        == metrics.get("contactReceipt", {}).get("heldBoundaryInterpolation")
        and motion["heldBoundaryInterpolation"]["passed"] is True
        and motion["heldBoundaryInterpolation"]["sampledPoints"]
        == HELD_BOUNDARY_SUBDIVISIONS + 1
        and motion["heldBoundaryInterpolation"]["maximumRightDistanceCentimeters"]
        <= HELD_BOUNDARY_AUTHORING_RESERVE_METRES * 100.0,
        "rootWithinContract": motion["rootMaximumTranslationCentimeters"] <= 0.1
        and motion["rootMaximumYawDegrees"] <= 0.1,
        "leftSupportWithinContract": motion["leftMaximumDriftCentimeters"] <= 0.25
        and motion["leftMaximumAngularDriftDegrees"] <= 0.25,
        "armScaleExactlyOne": close(motion["armChainScaleMinimum"], 1.0, 1.0e-9)
        and close(motion["armChainScaleMaximum"], 1.0, 1.0e-9),
        "allTransformsFinite": motion["allTransformsFinite"],
        "meshContactProxySamplesAll121Frames": motion["meshContactProxy"][
            "sampledSourceFrames"
        ]
        == list(range(START_FRAME, END_FRAME + 1)),
        "conservativeMeshPenetrationWithinContract": motion["meshContactProxy"][
            "maximumPenetrationCentimeters"
        ]
        <= 0.4,
        "conservativeMeshFloatingWithinContract": motion["meshContactProxy"][
            "maximumFloatingCentimeters"
        ]
        <= 0.8,
        "leftSupportMeshFloatingWithinContract": motion["meshContactProxy"][
            "leftSupportMaximumFloatingCentimeters"
        ]
        <= 0.8,
    }
    return {
        **receipt(path, repository_root),
        "skeleton": skeleton,
        "propBoundsMetres": bounds,
        "propTopology": topology,
        "markers": marker_receipts,
        "action": curves,
        "motion": motion,
        "checks": source_checks,
    }


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.render.fps_base = 1.0


def imported_mesh_bounds(objects: list[bpy.types.Object]) -> dict:
    points = [
        obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box
    ]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": [maximum[axis] - minimum[axis] for axis in range(3)],
        "center": [(minimum[axis] + maximum[axis]) * 0.5 for axis in range(3)],
    }


def validate_prop_interchange(path: Path, repository_root: Path) -> dict:
    clear_scene()
    if path.suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path), use_anim=False)
    else:
        bpy.ops.import_scene.gltf(filepath=str(path), import_pack_images=False)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    empties = {
        obj.name: obj for obj in bpy.context.scene.objects if obj.type == "EMPTY"
    }
    if len(meshes) != 1:
        raise RuntimeError(f"{path.name}: expected one prop mesh, found {len(meshes)}")
    mesh = meshes[0]
    bounds = imported_mesh_bounds(meshes)
    topology = topology_receipt(mesh)
    # Both Blender exporters round-trip into Blender metres; the static mesh is
    # symmetric under the accepted source→Unreal Y reflection.
    expected_dimensions = (
        [32.0, 14.0, 2.0] if path.suffix == ".fbx" else [0.32, 0.14, 0.02]
    )
    unit_to_metres = 0.01 if path.suffix == ".fbx" else 1.0
    checks = {
        "oneExactMesh": mesh.name.split(".")[0] == PROP_NAME,
        "exactPhysicalBounds": close_vector(
            bounds["dimensions"], expected_dimensions, 1.0e-5
        ),
        "centerOrigin": close_vector(bounds["center"], [0.0, 0.0, 0.0], 1.0e-5),
        "singleManifoldComponent": topology["nonManifoldEdges"] == 0
        and topology["connectedComponents"] == 1,
        "exactMaterial": [slot.material.name for slot in mesh.material_slots]
        == [MATERIAL_NAME],
        "textureFree": not bpy.data.images
        and all(
            node.type != "TEX_IMAGE"
            for material in bpy.data.materials
            if material.use_nodes and material.node_tree
            for node in material.node_tree.nodes
        ),
        "noCollisionMesh": not any(obj.name.startswith("UCX_") for obj in meshes),
        "metricsAuthoritativeMarkers": True,
    }
    marker_receipts = {
        name: {
            "location": list(empties[name].location),
            "rotationEulerDegrees": [
                math.degrees(float(value)) for value in empties[name].rotation_euler
            ],
        }
        for name in MARKERS
        if name in empties
    }
    return {
        **receipt(path, repository_root),
        "format": path.suffix.lstrip("."),
        "boundsMetres": bounds,
        "payloadUnitToMetres": unit_to_metres,
        "topology": topology,
        "markers": marker_receipts,
        "checks": checks,
    }


def glb_manifest(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"glTF" or len(data) < 20 or data[16:20] != b"JSON":
        raise RuntimeError(f"Invalid GLB: {path.name}")
    json_size = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20 : 20 + json_size].rstrip(b"\x00 \t\r\n").decode("utf-8"))


def png_dimensions(path: Path) -> list[int]:
    data = path.read_bytes()[:24]
    if len(data) != 24 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise RuntimeError(f"Invalid PNG receipt: {path.name}")
    return list(struct.unpack(">II", data[16:24]))


def validate_animation_interchange(path: Path, repository_root: Path) -> dict:
    payload = None
    if path.suffix == ".glb":
        payload = glb_manifest(path)
    clear_scene()
    if path.suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        bpy.ops.import_scene.gltf(filepath=str(path), import_pack_images=False)
    rigs = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(rigs) != 1:
        raise RuntimeError(f"{path.name}: expected one armature, found {len(rigs)}")
    rig = rigs[0]
    action = rig.animation_data.action if rig.animation_data else None
    if not action:
        raise RuntimeError(f"{path.name}: missing imported action")
    start, end = map(float, action.frame_range)
    scene_fps = int(bpy.context.scene.render.fps)
    duration = (end - start) / FPS
    bone_names = [bone.name for bone in rig.data.bones]
    texture_nodes = [
        node.name
        for material in bpy.data.materials
        if material.use_nodes and material.node_tree
        for node in material.node_tree.nodes
        if node.type == "TEX_IMAGE"
    ]
    action_names = [candidate.name for candidate in bpy.data.actions]
    checks = {
        "oneExactArmature": len(rigs) == 1,
        "exact53BoneHierarchy": bone_names == BONE_NAMES,
        "oneRigAction": action is not None,
        "exactFrameRange": close_vector(
            [start, end],
            [2.0, 122.0] if path.suffix == ".fbx" else [1.0, 121.0],
            1.0e-4,
        ),
        "exactSampleCount": int(round(end - start)) + 1 == SAMPLE_COUNT,
        "exactDuration": close(duration, DURATION_SECONDS, 1.0e-4),
        "textureFree": not texture_nodes and not bpy.data.images,
        "finiteImportedTransforms": all(
            math.isfinite(float(value))
            for frame in range(START_FRAME, END_FRAME + 1)
            for _ in [bpy.context.scene.frame_set(frame)]
            for bone in rig.pose.bones
            for row in bone.matrix
            for value in row
        ),
    }
    payload_receipt = None
    if payload is not None:
        animations = payload.get("animations", [])
        skins = payload.get("skins", [])
        accessors = payload.get("accessors", [])
        sample_counts = []
        spans = []
        for animation in animations:
            for sampler in animation.get("samplers", []):
                accessor = accessors[sampler["input"]]
                sample_counts.append(int(accessor.get("count", 0)))
                spans.append(float(accessor["max"][0]) - float(accessor["min"][0]))
        payload_receipt = {
            "animations": len(animations),
            "skinJointCounts": [len(skin.get("joints", [])) for skin in skins],
            "samplesPerCurve": sorted(set(sample_counts)),
            "durationSeconds": [min(spans), max(spans)] if spans else [],
            "images": len(payload.get("images", [])),
            "textures": len(payload.get("textures", [])),
        }
        checks["glbPayloadContract"] = (
            len(animations) == 1
            and payload_receipt["skinJointCounts"] == [53]
            and set(payload_receipt["samplesPerCurve"]).issubset({2, 121})
            and 121 in payload_receipt["samplesPerCurve"]
            and all(close(span, 4.0, 1.0e-4) for span in spans)
            and payload_receipt["images"] == 0
            and payload_receipt["textures"] == 0
        )
    return {
        **receipt(path, repository_root),
        "format": path.suffix.lstrip("."),
        "armature": rig.name,
        "boneCount": len(bone_names),
        "action": action.name,
        "allActions": action_names,
        "frameRange": [start, end],
        "normalizedSourceFrameRange": [start - 1.0, end - 1.0]
        if path.suffix == ".fbx"
        else [start, end],
        "importFrameOffset": 1.0 if path.suffix == ".fbx" else 0.0,
        "sceneFps": scene_fps,
        "sampleCount": int(round(end - start)) + 1,
        "durationSecondsAt30Fps": duration,
        "payload": payload_receipt,
        "checks": checks,
    }


def flatten_checks(prefix: str, value, output: dict[str, bool]) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            flatten_checks(f"{prefix}{key}:", child, output)
    elif isinstance(value, bool):
        output[prefix[:-1]] = value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent.resolve()
    source_root = asset_root / "source"
    provenance_path = asset_root.parent / "provenance" / f"{ASSET_ID}.json"
    generator_script_path = (
        repository_root / "scripts" / "build-daze-council-wet-register-interaction.py"
    )
    validator_script_path = Path(__file__).resolve()
    metrics_path = source_root / f"{ASSET_ID}.metrics.json"
    validation_path = source_root / f"{ASSET_ID}.validation.json"
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
    paths = {
        "source": source_root / f"{ASSET_ID}.blend",
        "propFbx": source_root / f"{ASSET_ID}-prop.fbx",
        "propGlb": source_root / f"{ASSET_ID}-prop.glb",
        "animationFbx": source_root / f"{ASSET_ID}-chen-sheng.fbx",
        "animationGlb": source_root / f"{ASSET_ID}-chen-sheng.glb",
    }
    render_paths = {
        **{
            f"oblique-{frame:03d}": source_root
            / f"{ASSET_ID}-oblique-frame-{frame:03d}.png"
            for frame in (1, 31, 61, 91, 121)
        },
        "front-061": source_root / f"{ASSET_ID}-front-frame-061.png",
        "profile-061": source_root / f"{ASSET_ID}-profile-frame-061.png",
        "council-44deg-061": source_root / f"{ASSET_ID}-council-44deg-frame-061.png",
    }
    paths.update({f"render:{name}": path for name, path in render_paths.items()})
    actual = {name: receipt(path, repository_root) for name, path in paths.items()}
    render_dimensions = {
        name: png_dimensions(path) for name, path in render_paths.items()
    }
    private_root = Path.home().as_posix().encode("utf-8")
    binary_privacy = {
        name: {
            "privateUserRootOccurrences": path.read_bytes().count(private_root),
            "portableReplacementOccurrences": path.read_bytes().count(b"SHI_USER_ROOT"),
        }
        for name, path in paths.items()
    }

    contract = metrics.get("interactionContract", {})
    prop_contract = contract.get("prop", {})
    animation_contract = contract.get("animation", {})
    marker_contract = prop_contract.get("markers", {})
    story_continuity = metrics.get("storyContinuity", {})
    timing_boundary = metrics.get("timingBoundary", {})
    camera_diagnostic = metrics.get("cameraProjectionDiagnostic", {})
    generator_script_receipt = receipt(generator_script_path, repository_root)
    static_checks = {
        "metricsAssetId": metrics.get("assetId") == ASSET_ID,
        "provenanceAssetId": provenance.get("assetId") == ASSET_ID,
        "generatorScriptReceipts": metrics.get("generatorScript")
        == generator_script_receipt
        and provenance.get("generatorScript") == generator_script_receipt,
        "exactDimensions": prop_contract.get("dimensionsCentimeters")
        == [32.0, 14.0, 2.0],
        "centerOrigin": prop_contract.get("origin") == "center",
        "exactAxisReflection": prop_contract.get("sourceToUnrealAxisScale")
        == [1.0, -1.0, 1.0],
        "exactMarkerIds": prop_contract.get("markerIds") == list(MARKERS),
        "exactMarkerContracts": all(
            marker_contract.get(name, {}).get("sourcePositionXYZCentimeters")
            == expected["sourcePositionXYZCentimeters"]
            and marker_contract.get(name, {}).get("unrealPositionXYZCentimeters")
            == expected["unrealPositionXYZCentimeters"]
            and marker_contract.get(name, {}).get("sourceRotationXYZDegrees")
            == expected["sourceRotationXYZDegrees"]
            and marker_contract.get(name, {}).get("rotationDegrees")
            == expected["rotationDegrees"]
            and marker_contract.get(name, {}).get("rotationOrder")
            == "Unreal-FRotator-Pitch-Yaw-Roll"
            and marker_contract.get(name, {}).get("unrealQuaternionXYZW")
            == expected["unrealQuaternionXYZW"]
            and marker_contract.get(name, {}).get("frameKind") == expected["frameKind"]
            for name, expected in MARKERS.items()
        ),
        "propAuthorityDisabled": all(
            prop_contract.get(key) is False
            for key in ("collision", "navigation", "physics", "input")
        ),
        "exactSkeletonContract": contract.get("skeleton", {}).get("boneCount") == 53
        and contract.get("skeleton", {}).get("boneNames") == BONE_NAMES,
        "exactAnimationBoundary": animation_contract.get("deterministic") is True
        and animation_contract.get("sourceFrameFirst") == 1
        and animation_contract.get("sourceFrameLast") == 121
        and animation_contract.get("sampleFirst") == 0
        and animation_contract.get("sampleLast") == 120
        and animation_contract.get("sampleCount") == 121
        and animation_contract.get("framesPerSecond") == 30
        and animation_contract.get("durationSeconds") == 4.0
        and animation_contract.get("looping") is False,
        "measuredContactSamples": animation_contract.get("contact", {}).get(
            "rightAcquisitionSample"
        )
        == 30
        and animation_contract.get("contact", {}).get(
            "orderedReleasePhaseOnsetSample"
        )
        == 90
        and animation_contract.get("contact", {}).get("rightReleaseSample") == 91
        and animation_contract.get("contact", {}).get("rightContactExitSample") == 91
        and metrics.get("contactReceipt", {}).get("transitions")
        == EXPECTED_TRANSITIONS
        and metrics.get("contactReceipt", {})
        .get("heldBoundaryInterpolation", {})
        .get("passed")
        is True
        and metrics.get("contactReceipt", {})
        .get("heldBoundaryInterpolation", {})
        .get("maximumRightDistanceCentimeters", float("inf"))
        <= HELD_BOUNDARY_AUTHORING_RESERVE_METRES * 100.0,
        "measuredLeftSupportFloating": close(
            animation_contract.get("contact", {}).get(
                "leftSupportMaximumFloatingCentimeters", float("nan")
            ),
            metrics.get("contactReceipt", {})
            .get("visibleMeshContactProxy", {})
            .get("leftSupportMaximumFloatingCentimeters", float("nan")),
        )
        and animation_contract.get("contact", {}).get(
            "leftSupportMaximumFloatingCentimeters", float("inf")
        )
        <= 0.8,
        "meshContactReceiptSamplesAll121Frames": metrics.get("contactReceipt", {})
        .get("visibleMeshContactProxy", {})
        .get("sampledSourceFrames")
        == list(range(START_FRAME, END_FRAME + 1)),
        "storyContinuityFailClosed": story_continuity
        == provenance.get("storyContinuity")
        and story_continuity.get("campaignNode") == "rain-order"
        and story_continuity.get("speaker") == "chen-sheng"
        and story_continuity.get("speakerSlot") == "speaker"
        and story_continuity.get("keeperOwnsRegisterBeforeClip") is True
        and story_continuity.get("authoredOffscreenPriorHandoffAssumption") is True
        and story_continuity.get("handoffShown") is False
        and story_continuity.get("playerOwnershipContinuityReview") == "pending"
        and story_continuity.get("clipAloneCompletesStoryBeat") is False
        and story_continuity.get("twoCharacterTransferDeferred") is True,
        "silentTimingBoundary": timing_boundary == provenance.get("timingBoundary")
        and timing_boundary.get("durationSeconds") == DURATION_SECONDS
        and timing_boundary.get("purpose")
        == "silent-engineering-interaction-timing-only"
        and timing_boundary.get("multilingualSpeechTimingAuthority") is False
        and timing_boundary.get("voiceTimingAuthority") is False
        and timing_boundary.get("lipSyncTimingAuthority") is False,
        "projectionMatchedCouncilDiagnostic": camera_diagnostic.get("renderId")
        == "council-44deg-061"
        and camera_diagnostic.get("sourceFrame") == 61
        and camera_diagnostic.get("resolutionPixels") == [1600, 1000]
        and close(
            camera_diagnostic.get("horizontalFieldOfViewDegrees", float("nan")),
            COUNCIL_HORIZONTAL_FOV_DEGREES,
        )
        and camera_diagnostic.get("sensorFit") == "HORIZONTAL"
        and close(
            camera_diagnostic.get("sensorWidthMillimeters", float("nan")),
            COUNCIL_SENSOR_WIDTH_MILLIMETRES,
        )
        and close(
            camera_diagnostic.get("lensMillimeters", float("nan")),
            COUNCIL_LENS_MILLIMETRES,
        )
        and camera_diagnostic.get("subtitleSafeSpaceHumanReview") is False
        and camera_diagnostic.get("engineTransformAdmission") is False,
        "exactRenderDimensions": render_dimensions.get("council-44deg-061")
        == [1600, 1000]
        and all(
            dimensions == [720, 720]
            for name, dimensions in render_dimensions.items()
            if name != "council-44deg-061"
        ),
        "authorityBoundaryFalse": all(
            provenance.get("authorityBoundary", {}).get(key) is False
            for key in (
                "campaign",
                "save",
                "replication",
                "gameplay",
                "input",
                "physics",
                "navigation",
            )
        ),
        "reviewBoundaryFalse": provenance.get("reviewStatus", {}).get("engineAdmission")
        is False
        and provenance.get("reviewStatus", {}).get("humanHistoricalCulturalApproval")
        is False
        and provenance.get("reviewStatus", {}).get("finalProp") is False
        and provenance.get("reviewStatus", {}).get("finalHandAnimation") is False
        and provenance.get("reviewStatus", {}).get("watchedSourceVisual") is False
        and metrics.get("reviewStatus", {}).get("watchedSourceVisual") is False
        and provenance.get("reviewStatus", {}).get("playerOwnershipContinuity") is False
        and metrics.get("reviewStatus", {}).get("playerOwnershipContinuity") is False,
        "watchedSourceVisualDecisionRecorded": metrics.get(
            "watchedSourceVisualDecision", {}
        ).get("decision")
        in {"pending-successor-review", "conditional-engineering-accept", "reject"}
        and provenance.get("reviewDecisions", {}).get("watchedSourceVisual")
        == metrics.get("watchedSourceVisualDecision"),
        "authorshipBoundary": provenance.get("authorship", {}).get("neuralGeneration")
        is False
        and provenance.get("authorship", {}).get("generatedImagePixelsSampled") is False
        and provenance.get("authorship", {}).get("privateReferencePixelsSampled")
        is False
        and bool(provenance.get("authorship", {}).get("method")),
        "noPrivateBinaryPaths": all(
            row["privateUserRootOccurrences"] == 0 for row in binary_privacy.values()
        ),
    }
    metric_exports = metrics.get("exports", {})
    metric_renders = metrics.get("renders", {})
    provenance_outputs = provenance.get("outputs", {})
    receipt_checks = {
        "metricsPropFbx": all(
            metric_exports.get("prop", {}).get("fbx", {}).get(key)
            == actual["propFbx"][key]
            for key in ("file", "bytes", "sha256")
        ),
        "metricsAnimationFbx": all(
            metric_exports.get("animation", {}).get("fbx", {}).get(key)
            == actual["animationFbx"][key]
            for key in ("file", "bytes", "sha256")
        ),
        "provenancePropFbx": all(
            provenance_outputs.get("prop", {}).get("fbx", {}).get(key)
            == actual["propFbx"][key]
            for key in ("file", "bytes", "sha256")
        ),
        "provenanceAnimationFbx": all(
            provenance_outputs.get("animation", {}).get("fbx", {}).get(key)
            == actual["animationFbx"][key]
            for key in ("file", "bytes", "sha256")
        ),
        "allInterchangeReceipts": all(
            all(
                metric_exports.get(group, {}).get(fmt, {}).get(key)
                == actual[path_key][key]
                for key in ("file", "bytes", "sha256")
            )
            for group, fmt, path_key in (
                ("prop", "fbx", "propFbx"),
                ("prop", "glb", "propGlb"),
                ("animation", "fbx", "animationFbx"),
                ("animation", "glb", "animationGlb"),
            )
        ),
        "allRenderReceipts": set(metric_renders) == set(render_paths)
        and set(provenance_outputs.get("renders", {})) == set(render_paths)
        and all(
            all(
                metric_renders.get(name, {}).get(key) == actual[f"render:{name}"][key]
                for key in ("file", "bytes", "sha256")
            )
            and metric_renders.get(name, {}).get("metadataSanitized") is True
            and metric_renders.get(name, {}).get("metadataPolicy")
            == "retain-only-IHDR-PLTE-tRNS-IDAT-IEND"
            and all(
                provenance_outputs.get("renders", {}).get(name, {}).get(key)
                == actual[f"render:{name}"][key]
                for key in ("file", "bytes", "sha256")
            )
            for name in render_paths
        ),
    }

    source = validate_source(paths["source"], metrics, repository_root)
    formats = {
        "prop": {
            "fbx": validate_prop_interchange(paths["propFbx"], repository_root),
            "glb": validate_prop_interchange(paths["propGlb"], repository_root),
        },
        "animation": {
            "fbx": validate_animation_interchange(
                paths["animationFbx"], repository_root
            ),
            "glb": validate_animation_interchange(
                paths["animationGlb"], repository_root
            ),
        },
    }
    checks = {}
    flatten_checks("static:", static_checks, checks)
    flatten_checks("receipts:", receipt_checks, checks)
    flatten_checks("source:", source["checks"], checks)
    for group, values in formats.items():
        for fmt, result in values.items():
            flatten_checks(f"{group}:{fmt}:", result["checks"], checks)
    status = "pass" if checks and all(checks.values()) else "fail"
    report = {
        "assetId": ASSET_ID,
        "status": status,
        "validator": "editable source plus clean FBX/GLB exact geometry, rig, sample, contact, authority, provenance and privacy inspection",
        "blenderVersion": bpy.app.version_string,
        "scripts": {
            "generator": generator_script_receipt,
            "validator": receipt(validator_script_path, repository_root),
        },
        "checks": checks,
        "receipts": {
            "propFbx": actual["propFbx"],
            "animationFbx": actual["animationFbx"],
            "propGlb": actual["propGlb"],
            "animationGlb": actual["animationGlb"],
            "source": actual["source"],
            "metrics": receipt(metrics_path, repository_root),
            "provenance": receipt(provenance_path, repository_root),
            "renders": {name: actual[f"render:{name}"] for name in render_paths},
        },
        "binaryPrivacy": binary_privacy,
        "renderDimensionsPixels": render_dimensions,
        "source": source,
        "formats": formats,
        "reviewStatus": {
            "sourceEngineeringValidation": status == "pass",
            "visibleHandMeshReview": False,
            "engineAdmission": False,
            "humanHistoricalCulturalApproval": False,
            "finalProp": False,
            "finalHandAnimation": False,
        },
        "watchedSourceVisualDecision": metrics.get("watchedSourceVisualDecision"),
        "limitations": [
            "source mesh contact is a conservative rejection proxy, not watched deformation approval",
            "engine, normal/reduced runtime, camera, sleeve, anatomy, historical-material and cultural-performance gates remain open",
            "the interaction has no campaign, save, replication, gameplay, input, physics or navigation authority",
        ],
    }
    validation_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "assetId": ASSET_ID,
                "status": status,
                "checks": {"passed": sum(checks.values()), "total": len(checks)},
                "rootMaximumTranslationCentimeters": source["motion"][
                    "rootMaximumTranslationCentimeters"
                ],
                "rootMaximumYawDegrees": source["motion"]["rootMaximumYawDegrees"],
                "leftMaximumDriftCentimeters": source["motion"][
                    "leftMaximumDriftCentimeters"
                ],
                "leftMaximumAngularDriftDegrees": source["motion"][
                    "leftMaximumAngularDriftDegrees"
                ],
                "armChainScale": [
                    source["motion"]["armChainScaleMinimum"],
                    source["motion"]["armChainScaleMaximum"],
                ],
                "meshContactProxy": source["motion"]["meshContactProxy"],
                "report": receipt(validation_path, repository_root),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    if status != "pass":
        failed = [name for name, passed in checks.items() if not passed]
        raise RuntimeError(f"Wet-register validation failed: {failed}")


if __name__ == "__main__":
    main()
