"""Author SHI's bounded shared-skeleton council performance blockout.

Run Blender 4.5.12 with the accepted five-character source blend already open:

  blender assets/3d/rendered/shi-daze-council-characters-v1.blend \
    --background --python scripts/build-daze-council-performance.py -- \
    --asset-root assets/3d

The script never regenerates the accepted character meshes. It adds two
project-authored actions to the exact shared 53-bone rig, exports clean FBX/GLB
animation carriers, writes source review renders and saves a separate editable
performance blend.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-council-performance-v1"
CHARACTER_SOURCE_ID = "shi-daze-council-characters-v1"
FPS = 30
START_FRAME = 1
END_FRAME = 121
DURATION_SECONDS = 4.0
RIG_NAMES = [
    "SK_SHI_keeper_Rig",
    "SK_SHI_chen-sheng_Rig",
    "SK_SHI_wu-guang_Rig",
    "SK_SHI_yu-mu_Rig",
    "SK_SHI_qin-courier_Rig",
]
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
ANIMATED_BONES = [
    "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
] + [
    f"{finger}_{segment:02d}_{side}"
    for side in ("l", "r")
    for finger in ("index", "middle", "ring", "pinky", "thumb")
    for segment in (1, 2, 3)
]


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def degrees(x=0.0, y=0.0, z=0.0) -> tuple[float, float, float]:
    return tuple(math.radians(value) for value in (x, y, z))


def finger_pose(amount: float) -> dict[str, tuple[float, float, float]]:
    result = {}
    for side in ("l", "r"):
        # The game_engine finger chains use mirrored rest matrices but the same
        # local curl sign, so one bounded authored curve remains symmetrical.
        for finger, multiplier in (("index", 0.82), ("middle", 1.0), ("ring", 0.92), ("pinky", 0.74)):
            result[f"{finger}_01_{side}"] = degrees(amount * multiplier, 0.0, 0.0)
            result[f"{finger}_02_{side}"] = degrees(amount * multiplier * 0.62, 0.0, 0.0)
            result[f"{finger}_03_{side}"] = degrees(amount * multiplier * 0.34, 0.0, 0.0)
        thumb_sign = 1.0 if side == "l" else -1.0
        result[f"thumb_01_{side}"] = degrees(amount * 0.34, 0.0, thumb_sign * amount * 0.18)
        result[f"thumb_02_{side}"] = degrees(amount * 0.28, 0.0, 0.0)
        result[f"thumb_03_{side}"] = degrees(amount * 0.18, 0.0, 0.0)
    return result


def pose(**bones) -> dict[str, tuple[float, float, float]]:
    result = finger_pose(float(bones.pop("finger_curl", 3.0)))
    for name, rotation in bones.items():
        result[name] = degrees(*rotation)
    return result


ATTENTIVE_KEYS = {
    1: pose(finger_curl=3.0, spine_01=(0.15, 0.0, 0.0), spine_02=(0.30, 0.0, -0.18),
            spine_03=(-0.20, 0.0, 0.15), neck_01=(0.0, 0.0, -0.20), head=(0.0, 0.0, 0.25)),
    31: pose(finger_curl=3.8, spine_01=(-0.20, 0.0, 0.0), spine_02=(-0.48, 0.0, 0.22),
             spine_03=(0.56, 0.0, -0.18), neck_01=(0.12, 0.0, 0.35), head=(-0.20, 0.0, -0.42),
             clavicle_l=(0.12, 0.0, 0.0), clavicle_r=(0.12, 0.0, 0.0)),
    61: pose(finger_curl=3.2, spine_01=(0.10, 0.0, 0.0), spine_02=(0.22, 0.0, 0.18),
             spine_03=(-0.15, 0.0, -0.12), neck_01=(0.0, 0.0, 0.18), head=(0.05, 0.0, -0.22)),
    91: pose(finger_curl=2.7, spine_01=(0.22, 0.0, 0.0), spine_02=(0.52, 0.0, -0.20),
             spine_03=(-0.44, 0.0, 0.16), neck_01=(-0.10, 0.0, -0.28), head=(0.18, 0.0, 0.38),
             clavicle_l=(-0.08, 0.0, 0.0), clavicle_r=(-0.08, 0.0, 0.0)),
}
ATTENTIVE_KEYS[END_FRAME] = ATTENTIVE_KEYS[START_FRAME]

SPEAKER_KEYS = {
    1: pose(finger_curl=3.0, spine_01=(0.10, 0.0, 0.0), spine_02=(0.18, 0.0, 0.0),
            spine_03=(-0.10, 0.0, 0.0), neck_01=(0.0, 0.0, 0.0), head=(0.0, 0.0, 0.0)),
    21: pose(finger_curl=3.4, spine_01=(-0.20, 0.0, 0.0), spine_02=(-0.65, 0.0, -0.30),
             spine_03=(0.55, 0.0, 0.24), neck_01=(0.20, 0.0, 0.35), head=(-0.25, 0.0, -0.50),
             clavicle_r=(0.25, 0.0, 0.0), upperarm_r=(2.0, 0.0, 1.5), lowerarm_r=(2.0, 0.0, 0.8)),
    46: pose(finger_curl=7.5, spine_01=(-0.55, 0.0, 0.0), spine_02=(-1.65, 0.0, -0.55),
             spine_03=(1.20, 0.0, 0.48), neck_01=(0.35, 0.0, 0.55), head=(-0.55, 0.0, -0.78),
             clavicle_r=(0.75, 0.0, 0.0), upperarm_r=(12.0, 0.0, 5.0), lowerarm_r=(10.0, 0.0, 3.0),
             hand_r=(-4.0, 2.0, -3.0), clavicle_l=(0.20, 0.0, 0.0), upperarm_l=(1.5, 0.0, -0.7)),
    76: pose(finger_curl=5.0, spine_01=(-0.20, 0.0, 0.0), spine_02=(-0.72, 0.0, 0.35),
             spine_03=(0.55, 0.0, -0.30), neck_01=(0.10, 0.0, -0.25), head=(-0.18, 0.0, 0.42),
             clavicle_r=(0.35, 0.0, 0.0), upperarm_r=(6.0, 0.0, 2.4), lowerarm_r=(4.5, 0.0, 1.5),
             hand_r=(-1.8, 0.8, -1.2)),
    101: pose(finger_curl=3.4, spine_01=(0.12, 0.0, 0.0), spine_02=(0.35, 0.0, 0.18),
              spine_03=(-0.30, 0.0, -0.15), neck_01=(-0.10, 0.0, -0.15), head=(0.14, 0.0, 0.22),
              clavicle_r=(0.08, 0.0, 0.0), upperarm_r=(1.0, 0.0, 0.5), lowerarm_r=(0.8, 0.0, 0.2)),
}
SPEAKER_KEYS[END_FRAME] = SPEAKER_KEYS[START_FRAME]


def exact_rigs() -> list[bpy.types.Object]:
    rigs = []
    for name in RIG_NAMES:
        rig = bpy.data.objects.get(name)
        if not rig or rig.type != "ARMATURE":
            raise RuntimeError(f"Accepted character source is missing exact armature {name}")
        if [bone.name for bone in rig.data.bones] != BONE_NAMES:
            raise RuntimeError(f"{name} no longer carries the exact admitted 53-bone skeleton")
        rigs.append(rig)
    return rigs


def reset_pose(rig: bpy.types.Object) -> None:
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.location = Vector((0.0, 0.0, 0.0))
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = Vector((1.0, 1.0, 1.0))


def author_action(rig: bpy.types.Object, name: str,
                  keys: dict[int, dict[str, tuple[float, float, float]]], role: str) -> bpy.types.Action:
    existing = bpy.data.actions.get(name)
    if existing:
        bpy.data.actions.remove(existing)
    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    action["shi_asset_id"] = ASSET_ID
    action["shi_role"] = role
    action["shi_status"] = "shared-skeleton-performance-blockout-not-final-acting"
    action["shi_root_motion"] = False
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame, authored in keys.items():
        reset_pose(rig)
        for bone_name, rotation in authored.items():
            if bone_name not in ANIMATED_BONES:
                raise RuntimeError(f"Clip {name} attempts to animate unsupported bone {bone_name}")
            rig.pose.bones[bone_name].rotation_euler = rotation
        # Key every admitted bone at each authored sample. This keeps the source
        # action self-contained and makes the unchanged root contract explicit.
        for bone_name in BONE_NAMES:
            bone = rig.pose.bones[bone_name]
            bone.keyframe_insert(data_path="location", frame=frame, group=bone_name)
            bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone_name)
            bone.keyframe_insert(data_path="scale", frame=frame, group=bone_name)
    for curve in action.fcurves:
        for key in curve.keyframe_points:
            key.interpolation = "BEZIER"
            key.handle_left_type = "AUTO_CLAMPED"
            key.handle_right_type = "AUTO_CLAMPED"
    reset_pose(rig)
    return action


def character_meshes(rig: bpy.types.Object) -> list[bpy.types.Object]:
    meshes = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.parent == rig or any(mod.type == "ARMATURE" and mod.object == rig for mod in obj.modifiers):
            meshes.append(obj)
    if not meshes:
        raise RuntimeError(f"{rig.name} has no deforming review meshes")
    return meshes


def select_export_carrier(rig: bpy.types.Object, meshes: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig


def select_export_armature(rig: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig


def receipt(path: Path) -> dict:
    return {
        "file": path.as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def export_clip(rig: bpy.types.Object, meshes: list[bpy.types.Object], action: bpy.types.Action,
                role: str, export_root: Path) -> dict:
    prefix = export_root / f"{ASSET_ID}-{role}"
    fbx_path = prefix.with_suffix(".fbx")
    glb_path = prefix.with_suffix(".glb")
    rig.animation_data.action = action
    bpy.context.scene.frame_start = START_FRAME
    bpy.context.scene.frame_end = END_FRAME
    bpy.context.scene.frame_set(START_FRAME)
    original_name = rig.name
    original_location = rig.location.copy()
    try:
        rig.name = "Armature"
        rig.location = Vector((0.0, 0.0, 0.0))
        # Keep the exact accepted keeper deformation carrier beside the action
        # in FBX. Unreal still imports animation only, but Blender then writes
        # the same bind-space metadata as the admitted skeletal-mesh FBX; an
        # armature-only payload takes a different compatibility path and can
        # visibly destabilize skinned vertices despite plausible bone curves.
        select_export_carrier(rig, meshes)
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path), use_selection=True, object_types={"ARMATURE", "MESH"},
            global_scale=100.0, apply_unit_scale=True, apply_scale_options="FBX_SCALE_ALL",
            axis_forward="-Z", axis_up="Y", add_leaf_bones=False,
            bake_anim=True, bake_anim_use_all_bones=True, bake_anim_use_nla_strips=False,
            bake_anim_use_all_actions=False, bake_anim_force_startend_keying=True,
            bake_anim_step=1.0, bake_anim_simplify_factor=0.0, mesh_smooth_type="FACE",
            use_tspace=False, armature_nodetype="NULL",
        )
        select_export_carrier(rig, meshes)
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path), export_format="GLB", use_selection=True,
            export_skins=True, export_animations=True, export_animation_mode="ACTIVE_ACTIONS",
            export_frame_range=True, export_frame_step=1, export_force_sampling=True,
            export_apply=False, export_yup=True, export_cameras=False, export_lights=False,
            export_morph=False, export_morph_animation=False,
        )
    finally:
        rig.name = original_name
        rig.location = original_location
    return {"fbx": receipt(fbx_path), "glb": receipt(glb_path)}


def render_review(scene: bpy.types.Scene, rigs: list[bpy.types.Object], actions: dict[str, bpy.types.Action],
                  role: str, frame: int, output: Path) -> dict:
    for rig in rigs:
        rig.animation_data_create()
        rig.animation_data.action = actions["attentive-idle"]
    if role == "speaker-measured":
        # Blender 4.5 actions carry an explicit data-block slot. The exported
        # action is authored against the keeper carrier rig, so source review
        # keeps that exact carrier honest instead of pretending the slot drove
        # another object. Unreal binds the admitted sequence to the shared
        # Skeleton and can therefore reuse it for every validated mesh.
        rigs[0].animation_data.action = actions[role]
    scene.frame_set(frame)
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    return receipt(output)


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
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent
    export_root = asset_root / "export"
    rendered_root = asset_root / "rendered"
    source_root = asset_root / "source"
    for path in (export_root, rendered_root, source_root):
        path.mkdir(parents=True, exist_ok=True)

    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.render.fps_base = 1.0
    scene.frame_start = START_FRAME
    scene.frame_end = END_FRAME
    rigs = exact_rigs()
    carrier = rigs[0]
    actions = {
        "attentive-idle": author_action(carrier, CLIPS["attentive-idle"], ATTENTIVE_KEYS, "attentive-idle"),
        "speaker-measured": author_action(carrier, CLIPS["speaker-measured"], SPEAKER_KEYS, "speaker-measured"),
    }
    meshes = character_meshes(carrier)
    exports = {
        role: export_clip(carrier, meshes, action, role, export_root)
        for role, action in actions.items()
    }
    render_paths = {
        "attentive": rendered_root / f"{ASSET_ID}-attentive-frame-031.png",
        "speakerEmphasis": rendered_root / f"{ASSET_ID}-speaker-frame-046.png",
        "speakerSettle": rendered_root / f"{ASSET_ID}-speaker-frame-076.png",
    }
    if args.skip_render:
        missing = [path for path in render_paths.values() if not path.is_file()]
        if missing:
            raise RuntimeError(f"Cannot skip missing performance review renders: {missing}")
        renders = {key: receipt(path) for key, path in render_paths.items()}
    else:
        renders = {
            "attentive": render_review(scene, rigs, actions, "attentive-idle", 31, render_paths["attentive"]),
            "speakerEmphasis": render_review(scene, rigs, actions, "speaker-measured", 46, render_paths["speakerEmphasis"]),
            "speakerSettle": render_review(scene, rigs, actions, "speaker-measured", 76, render_paths["speakerSettle"]),
        }
    # Leave the editable source on the most informative mixed-role sample.
    for rig in rigs:
        rig.animation_data_create()
        rig.animation_data.action = actions["attentive-idle"]
    rigs[0].animation_data.action = actions["speaker-measured"]
    scene.frame_set(46)
    blend_path = rendered_root / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)

    metrics = portable_paths({
        "assetId": ASSET_ID,
        "status": "shared-skeleton body performance blockout; not final acting or historical etiquette",
        "sourceCharacterAsset": CHARACTER_SOURCE_ID,
        "blenderVersion": bpy.app.version_string,
        "fps": FPS,
        "startFrame": START_FRAME,
        "endFrame": END_FRAME,
        "sampleCount": END_FRAME - START_FRAME + 1,
        "durationSeconds": DURATION_SECONDS,
        "sharedSkeletonBones": len(BONE_NAMES),
        "rootMotion": False,
        "facialAnimation": False,
        "clothOrHairSimulation": False,
        "gameplayAuthority": False,
        "clips": [
            {
                "role": role,
                "action": action.name,
                "authoredFrames": sorted((ATTENTIVE_KEYS if role == "attentive-idle" else SPEAKER_KEYS)),
                "exports": exports[role],
            }
            for role, action in actions.items()
        ],
        "source": receipt(blend_path),
        "renders": renders,
        "limitations": [
            "body performance only: no facial, speech, interaction, cloth or hair performance",
            "generic blockout motion: not reconstructed late-Qin etiquette or final acting",
            "wide and medium council framing only",
        ],
    }, repository_root)
    metrics_path = source_root / f"{ASSET_ID}.metrics.json"
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "clips": [(row["role"], row["action"]) for row in metrics["clips"]],
        "sampleCount": metrics["sampleCount"],
        "durationSeconds": metrics["durationSeconds"],
        "metrics": metrics_path.as_posix(),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
