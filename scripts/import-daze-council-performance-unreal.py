"""Import or inspect SHI's reviewed Daze council body-performance clips.

Inspection is the default and is read-only. Set
SHI_DAZE_COUNCIL_PERFORMANCE_REIMPORT=1 only to replace the exact isolated
Performance destination with the two validated animation-only FBX exports.
The importer binds both clips to the already admitted shared Skeleton and
creates no mesh, material, texture, morph, physics or gameplay-authority asset.
"""

import json
import math
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-daze-council-performance-v1"
PARENT_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"
DESTINATION = f"{PARENT_DESTINATION}/Performance"
SKELETON_NAME = "SK_SHI_DazeCouncil_Skeleton"
SKELETON_PATH = f"{PARENT_DESTINATION}/{SKELETON_NAME}"
EXPECTED_SECONDS = 4.0
EXPECTED_SAMPLES = 121
EXPECTED_FRAMES_PER_SECOND = 30.0
CLIPS = (
    (
        "attentive-idle",
        "shi-daze-council-performance-v1-attentive-idle.fbx",
        "AN_SHI_DazeCouncil_AttentiveIdle_01",
    ),
    (
        "speaker-measured",
        "shi-daze-council-performance-v1-speaker-measured.fbx",
        "AN_SHI_DazeCouncil_SpeakerMeasured_01",
    ),
)
REFERENCE_POSE_FRAMES = (0, 46, 120)
EXPECTED_IMPORTED_TRACKS = 52


def asset_path(asset_name: str) -> str:
    return f"{DESTINATION}/{asset_name}"


def load_sequence(asset_name: str):
    sequence = unreal.EditorAssetLibrary.load_asset(asset_path(asset_name))
    return sequence if isinstance(sequence, unreal.AnimSequence) else None


def import_sequence(source: Path, asset_name: str, skeleton):
    options = unreal.FbxImportUI()
    options.automated_import_should_detect_type = False
    options.import_mesh = False
    options.import_as_skeletal = True
    options.import_rigid_mesh = False
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_ANIMATION
    options.original_import_type = unreal.FBXImportType.FBXIT_ANIMATION
    options.override_full_name = True
    options.import_materials = False
    options.import_textures = False
    options.import_animations = True
    options.create_physics_asset = False
    options.physics_asset = None
    options.skeleton = skeleton
    options.override_animation_name = asset_name

    animation_options = options.anim_sequence_import_data
    animation_options.set_editor_property("convert_scene", True)
    # The shared Skeleton deliberately retains the reviewed metre-valued local
    # hierarchy and is presented at component scale x100. Applying Unreal's
    # scene-unit conversion to animation translations a second time makes the
    # character leave its admitted bounds while its root remains stationary.
    animation_options.set_editor_property("convert_scene_unit", False)
    animation_options.set_editor_property("force_front_x_axis", False)
    animation_options.set_editor_property("import_uniform_scale", 1.0)
    animation_options.set_editor_property(
        "animation_length",
        unreal.FBXAnimationLengthImportType.FBXALIT_EXPORTED_TIME,
    )
    animation_options.set_editor_property("use_default_sample_rate", True)
    animation_options.set_editor_property("custom_sample_rate", 30)
    animation_options.set_editor_property("snap_to_closest_frame_boundary", True)
    animation_options.set_editor_property("import_custom_attribute", False)
    animation_options.set_editor_property("delete_existing_custom_attribute_curves", True)
    animation_options.set_editor_property("delete_existing_non_curve_custom_attributes", True)
    animation_options.set_editor_property("import_bone_tracks", True)
    animation_options.set_editor_property("add_curve_metadata_to_skeleton", False)
    animation_options.set_editor_property("remove_redundant_keys", False)
    animation_options.set_editor_property("delete_existing_morph_target_curves", True)
    animation_options.set_editor_property("do_not_import_curve_with_zero", True)
    animation_options.set_editor_property("preserve_local_transform", True)
    animation_options.set_editor_property("import_meshes_in_bone_hierarchy", False)

    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = asset_name
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    sequence = load_sequence(asset_name)
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    if not sequence:
        raise RuntimeError(
            f"Expected one AnimSequence at {asset_path(asset_name)}; imported {imported_paths}"
        )
    return sequence, imported_paths


def transform_components(transform) -> dict:
    translation = transform.translation
    rotation = transform.rotation
    scale = transform.scale3d
    return {
        "translation": [float(translation.x), float(translation.y), float(translation.z)],
        "rotation": [float(rotation.x), float(rotation.y), float(rotation.z), float(rotation.w)],
        "scale": [float(scale.x), float(scale.y), float(scale.z)],
    }


def compare_reference_transform(animated, reference) -> dict:
    actual = transform_components(animated)
    expected = transform_components(reference)
    translation_error = max(
        abs(actual["translation"][index] - expected["translation"][index])
        for index in range(3)
    )
    scale_error = max(
        abs(actual["scale"][index] - expected["scale"][index])
        for index in range(3)
    )
    quaternion_dot = sum(
        actual["rotation"][index] * expected["rotation"][index]
        for index in range(4)
    )
    rotation_error = abs(1.0 - abs(quaternion_dot))
    return {
        "actual": actual,
        "reference": expected,
        "maximumTranslationError": translation_error,
        "maximumScaleError": scale_error,
        "quaternionAlignmentError": rotation_error,
        "passed": translation_error <= 0.0001
        and scale_error <= 0.0001
        and rotation_error <= 0.000001,
    }


def inspect_root_reference_pose(sequence) -> list[dict]:
    samples = []
    options = unreal.AnimPoseEvaluationOptions()
    for frame in REFERENCE_POSE_FRAMES:
        pose = sequence.get_anim_pose_at_frame(frame, options)
        animated = unreal.AnimPoseExtensions.get_bone_pose(
            pose, "Root", unreal.AnimPoseSpaces.LOCAL
        )
        reference = pose.get_ref_bone_pose("Root", unreal.AnimPoseSpaces.LOCAL)
        samples.append({"frame": frame, **compare_reference_transform(animated, reference)})
    return samples


def inspect_rotation_only_channels(sequence, track_names: list[str]) -> dict:
    maximum_translation_error = 0.0
    maximum_scale_error = 0.0
    maximum_rotation_degrees = 0.0
    maximum_rotation_sample = None
    failures = []
    options = unreal.AnimPoseEvaluationOptions()
    for frame in REFERENCE_POSE_FRAMES:
        pose = sequence.get_anim_pose_at_frame(frame, options)
        for bone_name in track_names:
            animated = unreal.AnimPoseExtensions.get_bone_pose(
                pose, bone_name, unreal.AnimPoseSpaces.LOCAL
            )
            reference = pose.get_ref_bone_pose(bone_name, unreal.AnimPoseSpaces.LOCAL)
            actual = transform_components(animated)
            expected = transform_components(reference)
            translation_error = max(
                abs(actual["translation"][index] - expected["translation"][index])
                for index in range(3)
            )
            scale_error = max(
                abs(actual["scale"][index] - expected["scale"][index])
                for index in range(3)
            )
            quaternion_dot = abs(sum(
                actual["rotation"][index] * expected["rotation"][index]
                for index in range(4)
            ))
            rotation_degrees = math.degrees(
                2.0 * math.acos(max(-1.0, min(1.0, quaternion_dot)))
            )
            maximum_translation_error = max(maximum_translation_error, translation_error)
            maximum_scale_error = max(maximum_scale_error, scale_error)
            if rotation_degrees > maximum_rotation_degrees:
                maximum_rotation_degrees = rotation_degrees
                maximum_rotation_sample = {
                    "frame": frame,
                    "bone": bone_name,
                    "degreesFromReference": rotation_degrees,
                    "actualRotation": actual["rotation"],
                    "referenceRotation": expected["rotation"],
                }
            if translation_error > 0.0001 or scale_error > 0.0001:
                failures.append({
                    "frame": frame,
                    "bone": bone_name,
                    "translationError": translation_error,
                    "scaleError": scale_error,
                })
    return {
        "sampledFrames": list(REFERENCE_POSE_FRAMES),
        "sampledBones": len(track_names),
        "maximumTranslationError": maximum_translation_error,
        "maximumScaleError": maximum_scale_error,
        "maximumRotationDegrees": maximum_rotation_degrees,
        "maximumRotationSample": maximum_rotation_sample,
        "failures": failures,
        "passed": not failures,
    }


def inspect_sequence(role_id: str, asset_name: str, sequence, imported_paths: list[str]) -> dict:
    skeleton = sequence.get_editor_property("skeleton")
    additive_type = sequence.get_editor_property("additive_anim_type")
    asset_data = unreal.EditorAssetLibrary.find_asset_data(sequence.get_path_name())
    # AnimationBlueprintLibrary is not mounted in SHI's intentionally lean
    # editor target. These registry values are authored by UAnimSequence itself
    # and are also checked from native runtime APIs in the automation suite.
    sample_count = int(asset_data.get_tag_value("NumberOfSampledKeys"))
    frame_count = sample_count - 1
    sequence_length = float(sequence.get_play_length())
    sampling_rate = float(asset_data.get_tag_value("ImportResampleFramerate"))
    track_names = [str(name).lower() for name in unreal.AnimationLibrary.get_animation_track_names(sequence)]
    root_reference_samples = inspect_root_reference_pose(sequence)
    rotation_only_channels = inspect_rotation_only_channels(sequence, track_names)
    expected_skeleton = f"{SKELETON_PATH}.{SKELETON_NAME}"
    checks = {
        "exactAssetIdentity": sequence.get_path_name()
        == f"{asset_path(asset_name)}.{asset_name}",
        "sharedSkeleton": bool(skeleton) and skeleton.get_path_name() == expected_skeleton,
        "sampleCount": sample_count == EXPECTED_SAMPLES,
        "frameCount": frame_count == EXPECTED_SAMPLES - 1,
        "duration": abs(sequence_length - EXPECTED_SECONDS) <= 0.0001,
        "samplingRate": abs(sampling_rate - EXPECTED_FRAMES_PER_SECOND) <= 0.0001,
        "exactTrackCountAfterRootRemoval": len(track_names) == EXPECTED_IMPORTED_TRACKS,
        "rootTrackRemoved": "root" not in track_names,
        "pelvisAndBodyTracksRetained": "pelvis" in track_names and "hand_r" in track_names,
        "rootReferencePosePreserved": all(sample["passed"] for sample in root_reference_samples),
        "rotationOnlyChildChannels": rotation_only_channels["passed"],
        "rootMotionDisabled": not bool(sequence.get_editor_property("enable_root_motion")),
        "notAdditive": additive_type == unreal.AdditiveAnimationType.AAT_NONE,
    }
    return {
        "roleId": role_id,
        "assetPath": sequence.get_path_name(),
        "importedObjectPaths": imported_paths,
        "skeleton": skeleton.get_path_name() if skeleton else None,
        "samples": sample_count,
        "frames": frame_count,
        "durationSeconds": sequence_length,
        "framesPerSecond": sampling_rate,
        "trackCount": len(track_names),
        "trackNames": track_names,
        "rootReferencePoseSamples": root_reference_samples,
        "rotationOnlyChannelInspection": rotation_only_channels,
        "sourcePayload": (
            "FBX with exact admitted 53-bone hierarchy and keeper bind-space carrier; "
            "Unreal import is animation-only"
        ),
        "rootMotionEnabled": bool(sequence.get_editor_property("enable_root_motion")),
        "additiveAnimationType": str(additive_type),
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    # This editor-only reflected library is not loaded by the commandlet until
    # requested. It removes the imported Root track without modifying any child
    # track, allowing the shared Skeleton's reviewed reference Root transform to
    # remain authoritative at runtime.
    unreal.load_module("AnimationBlueprintLibrary")
    unreal.load_module("SHIEditor")
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    source_root = repository / "assets" / "3d" / "export"
    replace = os.environ.get("SHI_DAZE_COUNCIL_PERFORMANCE_REIMPORT") == "1"

    skeleton = unreal.EditorAssetLibrary.load_asset(SKELETON_PATH)
    if not isinstance(skeleton, unreal.Skeleton):
        raise RuntimeError(f"Admitted shared Skeleton is missing: {SKELETON_PATH}")

    expected_paths = [asset_path(name) for _, _, name in CLIPS]
    existing = [unreal.EditorAssetLibrary.does_asset_exist(path) for path in expected_paths]
    tracked_before = list(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True))
    unexpected_before = sorted(set(tracked_before) - {f"{path}.{path.rsplit('/', 1)[-1]}" for path in expected_paths})
    if unexpected_before:
        raise RuntimeError(
            f"Performance destination contains assets outside the exact two-clip contract: {unexpected_before}"
        )
    if replace and any(existing):
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(f"Could not replace isolated target: {DESTINATION}")
        existing = [False] * len(CLIPS)
    if not replace and any(existing) and not all(existing):
        raise RuntimeError("Daze council performance destination is partial; explicit reimport is required")

    imported_now = not all(existing)
    sequences = {}
    imported = {}
    for role_id, filename, name in CLIPS:
        source = source_root / filename
        if not source.is_file():
            raise FileNotFoundError(f"Missing validated body-performance FBX source: {source}")
        sequence = load_sequence(name) if all(existing) else None
        imported[role_id] = []
        if not sequence:
            sequence, imported[role_id] = import_sequence(source, name, skeleton)
            normalize_error = unreal.ShiAnimationImportLibrary.normalize_rotation_only_sequence(
                sequence, EXPECTED_SAMPLES
            )
            if normalize_error:
                raise RuntimeError(
                    f"Rotation-only normalization failed for {name}: {normalize_error}"
                )
            sequence.set_editor_property("enable_root_motion", False)
            unreal.EditorAssetLibrary.save_loaded_asset(sequence, only_if_is_dirty=False)
        sequences[role_id] = sequence

    if imported_now:
        unreal.EditorAssetLibrary.save_directory(DESTINATION, only_if_is_dirty=False, recursive=True)

    report = {
        "assetId": ASSET_ID,
        "status": "shared-skeleton council body-performance blockout; not final acting",
        "mode": "import-replace" if imported_now else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "destination": DESTINATION,
        "sharedSkeleton": skeleton.get_path_name(),
        "expectedSamples": EXPECTED_SAMPLES,
        "expectedDurationSeconds": EXPECTED_SECONDS,
        "expectedFramesPerSecond": EXPECTED_FRAMES_PER_SECOND,
        "clips": {
            role_id: inspect_sequence(role_id, name, sequences[role_id], imported[role_id])
            for role_id, _, name in CLIPS
        },
        "trackedAssets": list(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True)),
        "limitations": [
            "Body-only shared-skeleton blockout; no facial performance, lip sync, cloth or hair simulation.",
            "No root motion, collision, navigation, interaction, gameplay, save or replication authority.",
            "The editor import removes only the FBX Root track so the admitted shared Skeleton reference Root remains authoritative.",
            "Every retained child track preserves imported rotations while position and scale are normalized to the admitted Skeleton reference pose.",
            "Generic measured gesture language; not a claim of reconstructed 209 BCE etiquette.",
            "Wide and medium council staging only; close facial framing remains prohibited.",
            "Role clips loop independently and do not claim dialogue synchronization.",
        ],
    }
    expected_tracked = {
        f"{asset_path(name)}.{name}" for _, _, name in CLIPS
    }
    report["passed"] = (
        set(report["trackedAssets"]) == expected_tracked
        and all(item["passed"] for item in report["clips"].values())
    )
    report_path = (
        project_dir
        / "Saved"
        / "Automation"
        / "shi-daze-council-performance-unreal-import.json"
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_COUNCIL_PERFORMANCE_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError(f"Daze council body-performance admission failed: {report}")


main()
