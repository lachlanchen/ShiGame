"""Inspect or explicitly import SHI's Daze council facial blockouts.

The default mode is read-only with respect to Unreal content and requires the
isolated facial destination to exist already. Set
SHI_DAZE_COUNCIL_FACIAL_REIMPORT=1 to replace only that destination from the
five reviewed FBX payloads. Both modes refresh the tracked JSON admission
report. The accepted DazeCouncil meshes and their exact shared Skeleton remain
outside the replacement boundary.

This importer creates only five SkeletalMeshes, their bounded materials and
one reviewed eye texture. It creates no Skeleton, PhysicsAsset, animation,
rigid mesh, Blueprint, DataAsset, audio asset or gameplay authority.
"""

import hashlib
import json
import os
from pathlib import Path
import shutil

import unreal


ASSET_ID = "shi-daze-council-facial-performance-v1"
MUTATION_ENV = "SHI_DAZE_COUNCIL_FACIAL_REIMPORT"
DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilFacial"
LEGACY_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"
SKELETON_NAME = "SK_SHI_DazeCouncil_Skeleton"
SKELETON_PATH = f"{LEGACY_DESTINATION}/{SKELETON_NAME}"
EYE_TEXTURE_NAME = "T_SHI_Character_EyeBrown_CC0"
EYE_MATERIAL_NAME = "M_SHI_Character_EyeBrown"
MORPH_SECTION_MATERIALS = {
    "M_SHI_Character_SkinClay",
    EYE_MATERIAL_NAME,
}
EYE_TEXTURE_SHA256 = "4659691c7295ad6206c78b003e5fd0e5f91dcd53032fa914a229bb48cabe424b"
PRESENTATION_SCALE = 100.0
BOUNDS_TOLERANCE_METRES = 0.0005
ROOT_TOLERANCE = 0.000001
EXPECTED_ROOT_TRANSLATION = (0.0, 0.00000006100162863731384, -0.000562518835067749)
EXPECTED_ROOT_ROTATION = (0.0, 0.0, 0.0, 1.0)
EXPECTED_ROOT_SCALE = (1.0, 1.0, 1.0)

BONE_NAMES = (
    "Root", "pelvis", "spine_01", "spine_02", "spine_03", "clavicle_l",
    "upperarm_l", "lowerarm_l", "hand_l", "index_01_l", "index_02_l",
    "index_03_l", "middle_01_l", "middle_02_l", "middle_03_l", "pinky_01_l",
    "pinky_02_l", "pinky_03_l", "ring_01_l", "ring_02_l", "ring_03_l",
    "thumb_01_l", "thumb_02_l", "thumb_03_l", "clavicle_r", "upperarm_r",
    "lowerarm_r", "hand_r", "index_01_r", "index_02_r", "index_03_r",
    "middle_01_r", "middle_02_r", "middle_03_r", "pinky_01_r", "pinky_02_r",
    "pinky_03_r", "ring_01_r", "ring_02_r", "ring_03_r", "thumb_01_r",
    "thumb_02_r", "thumb_03_r", "neck_01", "head", "thigh_l", "calf_l",
    "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r",
)

MORPH_TARGETS = (
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
    "browInnerUp",
    "browDownLeft",
    "browDownRight",
    "cheekSquintLeft",
    "cheekSquintRight",
    "jawOpen",
    "mouthFunnel",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthUpperUpLeft",
    "mouthUpperUpRight",
)

EYE_GAZE_TARGETS = (
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
)

CHARACTERS = (
    {
        "id": "keeper",
        "suffix": "Keeper",
        "triangles": 27840,
        "sourceBytes": 2675132,
        "sourceSha256": "61f34f5b3959c1ded2d86a3a7e0eca1e7429ad1971cecea4331cc13a0e71ec0e",
        "minimum": (-0.4962701201438904, -0.3214700520038605, 0.000982522964477539),
        "maximum": (0.4962701201438904, 0.1899999976158142, 1.6974999904632568),
        "materials": (
            "M_SHI_Character_BindingClay",
            "M_SHI_Character_EyeBrown",
            "M_SHI_Character_HairClay",
            "M_SHI_Character_RolePropClay",
            "M_SHI_Character_SkinClay",
            "M_SHI_keeper_ClothBase",
            "M_SHI_keeper_ClothOuter",
        ),
    },
    {
        "id": "chen-sheng",
        "suffix": "ChenSheng",
        "triangles": 27836,
        "sourceBytes": 2621036,
        "sourceSha256": "febf45db1a7e2d1dfeea4c845b22207237e4a38c73b05733449585f768739688",
        "minimum": (-0.496270090341568, -0.32147011160850525, 0.0009825207525864244),
        "maximum": (0.496270090341568, 0.20000000298023224, 1.7250001430511475),
        "materials": (
            "M_SHI_Character_BindingClay",
            "M_SHI_Character_EyeBrown",
            "M_SHI_Character_HairClay",
            "M_SHI_Character_SkinClay",
            "M_SHI_chen-sheng_ClothBase",
            "M_SHI_chen-sheng_ClothOuter",
        ),
    },
    {
        "id": "wu-guang",
        "suffix": "WuGuang",
        "triangles": 27680,
        "sourceBytes": 2565436,
        "sourceSha256": "abcd72068348b9d860456b780c250f05380802021df90c10fa340ee08406f0e3",
        "minimum": (-0.496270090341568, -0.32147011160850525, 0.0009825207525864244),
        "maximum": (0.496270090341568, 0.1899999976158142, 1.6975001096725464),
        "materials": (
            "M_SHI_Character_BindingClay",
            "M_SHI_Character_EyeBrown",
            "M_SHI_Character_HairClay",
            "M_SHI_Character_SkinClay",
            "M_SHI_wu-guang_ClothBase",
            "M_SHI_wu-guang_ClothOuter",
        ),
    },
    {
        "id": "yu-mu",
        "suffix": "YuMu",
        "triangles": 27828,
        "sourceBytes": 2620604,
        "sourceSha256": "ca0dd69bd48cb797cbbeafd739439b44da37d09559409e1dce0df27807cc90cb",
        "minimum": (-0.496270090341568, -0.32147011160850525, 0.0009825207525864244),
        "maximum": (0.496270090341568, 0.1899999976158142, 1.6975001096725464),
        "materials": (
            "M_SHI_Character_BindingClay",
            "M_SHI_Character_EyeBrown",
            "M_SHI_Character_HairClay",
            "M_SHI_Character_SkinClay",
            "M_SHI_yu-mu_ClothBase",
            "M_SHI_yu-mu_ClothOuter",
        ),
    },
    {
        "id": "qin-courier",
        "suffix": "QinCourier",
        "triangles": 27840,
        "sourceBytes": 2675420,
        "sourceSha256": "dfd9b71921e3ada115a40ff4493029e5c84dfc40c70861a9e1d2f546db0aac91",
        "minimum": (-0.496270090341568, -0.32147011160850525, 0.0009825207525864244),
        "maximum": (0.496270090341568, 0.1899999976158142, 1.7470000982284546),
        "materials": (
            "M_SHI_Character_BindingClay",
            "M_SHI_Character_EyeBrown",
            "M_SHI_Character_HairClay",
            "M_SHI_Character_RolePropClay",
            "M_SHI_Character_SkinClay",
            "M_SHI_qin-courier_ClothBase",
            "M_SHI_qin-courier_ClothOuter",
        ),
    },
)


def asset_name(suffix: str) -> str:
    return f"SKM_SHI_DazeCouncil_{suffix}_Facial_01"


def asset_path(suffix: str) -> str:
    return f"{DESTINATION}/{asset_name(suffix)}"


def expected_material_names() -> list[str]:
    return sorted(
        {name for character in CHARACTERS for name in character["materials"]}
    )


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_receipt(path: Path, relative_to: Path | None = None) -> dict:
    display_path = path.relative_to(relative_to) if relative_to else path
    return {
        "file": str(display_path),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def relative_file_receipts(root: Path) -> dict[str, dict]:
    if not root.is_dir():
        return {}
    return {
        str(path.relative_to(root)): {
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
        for path in sorted(root.rglob("*.uasset"))
    }


def close_values(actual, expected, tolerance: float) -> bool:
    return len(actual) == len(expected) and all(
        abs(float(actual[index]) - float(expected[index])) <= tolerance
        for index in range(len(expected))
    )


def vector_values(vector) -> list[float]:
    return [float(vector.x), float(vector.y), float(vector.z)]


def expected_unreal_bounds(expected: dict) -> tuple[list[float], list[float]]:
    """Convert reviewed Blender right-handed bounds to Unreal asset-local space."""
    source_minimum = expected["minimum"]
    source_maximum = expected["maximum"]
    return (
        [source_minimum[0], -source_maximum[1], source_minimum[2]],
        [source_maximum[0], -source_minimum[1], source_maximum[2]],
    )


def transform_components(transform) -> dict:
    translation = transform.translation
    rotation = transform.rotation
    scale = transform.scale3d
    return {
        "translation": [float(translation.x), float(translation.y), float(translation.z)],
        "rotation": [float(rotation.x), float(rotation.y), float(rotation.z), float(rotation.w)],
        "scale": [float(scale.x), float(scale.y), float(scale.z)],
    }


def skeleton_bone_names(skeleton) -> list[str]:
    return [str(name) for name in skeleton.get_reference_pose().get_bone_names()]


def skeleton_reference_pose_receipt(skeleton) -> dict:
    pose = skeleton.get_reference_pose()
    transforms = {
        bone_name: transform_components(
            pose.get_ref_bone_pose(bone_name, unreal.AnimPoseSpaces.LOCAL)
        )
        for bone_name in skeleton_bone_names(skeleton)
    }
    canonical = json.dumps(transforms, sort_keys=True, separators=(",", ":"))
    return {
        "boneCount": len(transforms),
        "sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
    }


def validate_source_contract(repository: Path, source_root: Path) -> tuple[dict, dict[str, dict]]:
    metrics_path = repository / "assets" / "3d" / "source" / f"{ASSET_ID}.metrics.json"
    validation_path = repository / "assets" / "3d" / "source" / f"{ASSET_ID}.validation.json"
    if not metrics_path.is_file() or not validation_path.is_file():
        raise FileNotFoundError(
            f"Missing facial metrics or validation contract: {metrics_path}, {validation_path}"
        )
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    tracked_eye_path = (
        repository
        / "assets"
        / "3d"
        / "source"
        / f"{ASSET_ID}-brown-eye-cc0.png"
    )
    if not tracked_eye_path.is_file():
        raise FileNotFoundError(f"Missing tracked CC0 eye texture: {tracked_eye_path}")
    tracked_eye_receipt = file_receipt(tracked_eye_path, repository)
    metrics_characters = {item["id"]: item for item in metrics.get("characters", [])}
    validation_fbx = {
        item["characterId"]: item
        for item in validation.get("formats", {}).get("fbx", [])
    }
    checks = {
        "metricsAssetId": metrics.get("assetId") == ASSET_ID,
        "validationAssetId": validation.get("assetId") == ASSET_ID,
        "cleanValidationPassed": validation.get("status") == "pass",
        "crossFormatMorphEquivalencePassed": validation.get(
            "crossFormatMorphEquivalence", {}
        ).get("status")
        == "pass"
        and float(
            validation.get("crossFormatMorphEquivalence", {}).get(
                "maximumAbsoluteErrorMetres", 1.0
            )
        )
        <= 0.000005,
        "exactTrackedEyeTexture": tracked_eye_receipt["sha256"]
        == EYE_TEXTURE_SHA256,
        "exactMetricsBones": metrics.get("boneNames") == list(BONE_NAMES),
        "exactValidationBoneCount": validation.get("boneCount") == len(BONE_NAMES),
        "exactMetricsMorphs": metrics.get("morphTargets") == list(MORPH_TARGETS),
        "exactValidationMorphs": set(validation.get("morphTargets", [])) == set(MORPH_TARGETS)
        and len(validation.get("morphTargets", [])) == len(MORPH_TARGETS),
        "exactMetricsEyeGazeMorphs": metrics.get("eyeGazeTargets")
        == list(EYE_GAZE_TARGETS),
        "exactValidationEyeGazeMorphs": validation.get("eyeGazeTargets")
        == list(EYE_GAZE_TARGETS),
        "exactMetricsBodyMorphReceipts": set(metrics.get("bodyMorphReceipts", {}))
        == set(MORPH_TARGETS),
        "exactMetricsEyeMorphReceipts": set(metrics.get("eyeMorphReceipts", {}))
        == set(EYE_GAZE_TARGETS),
        "exactCharacterIds": set(metrics_characters) == {item["id"] for item in CHARACTERS}
        and set(validation_fbx) == {item["id"] for item in CHARACTERS},
    }
    source_receipts = {}
    for expected in CHARACTERS:
        character_id = expected["id"]
        source = source_root / f"{ASSET_ID}-{character_id}.fbx"
        if not source.is_file():
            raise FileNotFoundError(f"Missing reviewed facial FBX: {source}")
        receipt = file_receipt(source, repository)
        source_receipts[character_id] = receipt
        metric = metrics_characters.get(character_id, {})
        validated = validation_fbx.get(character_id, {})
        checks[f"{character_id}:sourceReceipt"] = (
            receipt["bytes"] == expected["sourceBytes"]
            and receipt["sha256"] == expected["sourceSha256"]
            and metric.get("exports", {}).get("fbx", {}).get("bytes") == expected["sourceBytes"]
            and metric.get("exports", {}).get("fbx", {}).get("sha256")
            == expected["sourceSha256"]
        )
        checks[f"{character_id}:exactTopology"] = (
            metric.get("triangles") == expected["triangles"]
            and validated.get("triangles") == expected["triangles"]
        )
        checks[f"{character_id}:exactMaterials"] = (
            set(metric.get("materials", [])) == set(expected["materials"])
            and len(metric.get("materials", [])) == len(expected["materials"])
            and set(validated.get("materials", [])) == set(expected["materials"])
            and len(validated.get("materials", [])) == len(expected["materials"])
        )
        metric_bounds = metric.get("boundsMetres", {})
        validated_bounds = validated.get("boundsMetres", {})
        checks[f"{character_id}:exactBounds"] = (
            close_values(metric_bounds.get("minimum", []), expected["minimum"], 0.000001)
            and close_values(metric_bounds.get("maximum", []), expected["maximum"], 0.000001)
            and close_values(validated_bounds.get("minimum", []), expected["minimum"], 0.000001)
            and close_values(validated_bounds.get("maximum", []), expected["maximum"], 0.000001)
        )
        checks[f"{character_id}:exactPerMeshMorphSources"] = (
            set(validated.get("bodyMorphTargets", {})) == set(MORPH_TARGETS)
            and set(validated.get("eyeMorphTargets", {})) == set(EYE_GAZE_TARGETS)
            and validated.get("importerOnlyHelperMeshes") == []
        )
    source_contract = {
        "metrics": file_receipt(metrics_path, repository),
        "validation": file_receipt(validation_path, repository),
        "trackedEyeTexture": tracked_eye_receipt,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not source_contract["passed"]:
        raise RuntimeError(f"Facial source contract drifted: {checks}")
    return source_contract, source_receipts


def load_and_validate_shared_skeleton() -> tuple[unreal.Skeleton, dict]:
    skeleton = unreal.EditorAssetLibrary.load_asset(SKELETON_PATH)
    if not isinstance(skeleton, unreal.Skeleton):
        raise RuntimeError(f"Exact admitted shared Skeleton is missing: {SKELETON_PATH}")
    bone_names = skeleton_bone_names(skeleton)
    root_transform = transform_components(
        skeleton.get_reference_pose().get_ref_bone_pose("Root", unreal.AnimPoseSpaces.LOCAL)
    )
    expected_object_path = f"{SKELETON_PATH}.{SKELETON_NAME}"
    checks = {
        "exactAssetPath": skeleton.get_path_name() == expected_object_path,
        "exactBoneNamesAndOrder": bone_names == list(BONE_NAMES),
        "exactBoneCount": len(bone_names) == len(BONE_NAMES),
        "identityRootScale": close_values(
            root_transform["scale"], EXPECTED_ROOT_SCALE, ROOT_TOLERANCE
        ),
        "identityRootRotation": close_values(
            root_transform["rotation"], EXPECTED_ROOT_ROTATION, ROOT_TOLERANCE
        ),
        "exactAdmittedRootTranslation": close_values(
            root_transform["translation"], EXPECTED_ROOT_TRANSLATION, ROOT_TOLERANCE
        ),
    }
    status = {
        "assetPath": skeleton.get_path_name(),
        "boneCount": len(bone_names),
        "boneNames": bone_names,
        "referencePose": skeleton_reference_pose_receipt(skeleton),
        "referenceRoot": root_transform,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(f"Shared Skeleton admission failed: {checks}")
    return skeleton, status


def load_mesh(suffix: str):
    mesh = unreal.EditorAssetLibrary.load_asset(asset_path(suffix))
    return mesh if isinstance(mesh, unreal.SkeletalMesh) else None


def import_eye_texture(source: Path):
    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = EYE_TEXTURE_NAME
    task.replace_existing = False
    task.automated = True
    task.save = False
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    texture = unreal.EditorAssetLibrary.load_asset(
        f"{DESTINATION}/{EYE_TEXTURE_NAME}"
    )
    if not isinstance(texture, unreal.Texture2D):
        raise RuntimeError(
            f"Reviewed eye texture did not import at {DESTINATION}/{EYE_TEXTURE_NAME}: "
            f"{list(task.get_editor_property('imported_object_paths'))}"
        )
    return texture, list(task.get_editor_property("imported_object_paths"))


def material_expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material, expression_class.static_class(), node_pos_x=x, node_pos_y=y
    )
    if not node:
        raise RuntimeError(
            f"Could not create {expression_class} in {material.get_path_name()}"
        )
    node.set_editor_property("desc", description)
    return node


def connect_material_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(
        source, output_name, material_property
    ):
        raise RuntimeError(
            f"Could not connect {source.get_name()} to {material_property}"
        )


def author_eye_material(texture):
    material = unreal.EditorAssetLibrary.load_asset(
        f"{DESTINATION}/{EYE_MATERIAL_NAME}"
    )
    if not isinstance(material, unreal.Material):
        raise RuntimeError(f"Imported eye material is missing: {EYE_MATERIAL_NAME}")
    unreal.MaterialEditingLibrary.delete_all_material_expressions(material)
    material.set_editor_property("two_sided", False)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property(
        "shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT
    )
    albedo = material_expression(
        material,
        unreal.MaterialExpressionTextureSampleParameter2D,
        -520,
        -120,
        "Exact tracked CC0 MakeHuman brown-eye bitmap; not anatomical or historical evidence.",
    )
    albedo.set_editor_property("parameter_name", "EyeAlbedo")
    albedo.set_editor_property("texture", texture)
    albedo.set_editor_property(
        "sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_COLOR
    )
    roughness = material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -520,
        20,
        "Engineering eye-response roughness; final corneal response remains a red gate.",
    )
    roughness.set_editor_property("parameter_name", "Roughness")
    roughness.set_editor_property("default_value", 0.38)
    specular = material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -520,
        120,
        "Engineering eye-response specular; not final eye lookdev.",
    )
    specular.set_editor_property("parameter_name", "Specular")
    specular.set_editor_property("default_value", 0.32)
    connect_material_output(albedo, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_material_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_material_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    return material


def configure_and_inspect_material_usage(replace: bool) -> dict:
    materials = []
    for name in expected_material_names():
        material = unreal.EditorAssetLibrary.load_asset(f"{DESTINATION}/{name}")
        if not isinstance(material, unreal.Material):
            raise RuntimeError(f"Missing exact isolated facial material: {name}")
        needs_morph_usage = name in MORPH_SECTION_MATERIALS
        if replace:
            unreal.MaterialEditingLibrary.set_base_material_usage(
                material, unreal.MaterialUsage.MATUSAGE_SKELETAL_MESH, True
            )
            unreal.MaterialEditingLibrary.set_base_material_usage(
                material,
                unreal.MaterialUsage.MATUSAGE_MORPH_TARGETS,
                needs_morph_usage,
            )
        compile_errors = (
            list(unreal.MaterialEditingLibrary.recompile_material(material))
            if replace
            else []
        )
        materials.append(
            {
                "name": name,
                "path": material.get_path_name(),
                "requiresMorphTargetUsage": needs_morph_usage,
                "skeletalMeshUsage": unreal.MaterialEditingLibrary.has_material_usage(
                    material, unreal.MaterialUsage.MATUSAGE_SKELETAL_MESH
                ),
                "morphTargetUsage": unreal.MaterialEditingLibrary.has_material_usage(
                    material, unreal.MaterialUsage.MATUSAGE_MORPH_TARGETS
                ),
                "compileErrors": [str(error) for error in compile_errors],
            }
        )

    expected_paths = {
        f"{DESTINATION}/{name}.{name}" for name in expected_material_names()
    }
    checks = {
        "exactFifteenMaterialsNoExtras": len(materials) == 15
        and {item["path"] for item in materials} == expected_paths,
        "allSavedForSkeletalMeshUsage": all(
            item["skeletalMeshUsage"] for item in materials
        ),
        "exactTwoMorphSectionMaterials": {
            item["name"] for item in materials if item["requiresMorphTargetUsage"]
        }
        == MORPH_SECTION_MATERIALS,
        "exactMorphTargetUsageNoShaderPermutationExtras": {
            item["name"] for item in materials if item["morphTargetUsage"]
        }
        == MORPH_SECTION_MATERIALS,
        "allCompileClean": all(not item["compileErrors"] for item in materials),
    }
    return {
        "compiledDuringThisRun": replace,
        "materials": materials,
        "checks": checks,
        "passed": all(checks.values()),
    }


def inspect_eye_material(material, texture, compile_material: bool) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    used_textures = list(unreal.MaterialEditingLibrary.get_material_used_textures(material))
    texture_nodes = [
        node
        for node in expressions
        if isinstance(node, unreal.MaterialExpressionTextureSampleParameter2D)
    ]
    compile_errors = (
        list(unreal.MaterialEditingLibrary.recompile_material(material))
        if compile_material
        else []
    )
    base_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_BASE_COLOR
    )
    roughness_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_ROUGHNESS
    )
    specular_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_SPECULAR
    )
    checks = {
        "exactMaterialPath": material.get_path_name()
        == f"{DESTINATION}/{EYE_MATERIAL_NAME}.{EYE_MATERIAL_NAME}",
        "exactTexturePath": texture.get_path_name()
        == f"{DESTINATION}/{EYE_TEXTURE_NAME}.{EYE_TEXTURE_NAME}",
        "exactThreeNodeGraph": len(expressions) == 3,
        "exactTrackedTextureOnly": len(texture_nodes) == 1
        and texture_nodes[0].get_editor_property("texture") == texture,
        "textureDrivesBaseColor": isinstance(
            base_input, unreal.MaterialExpressionTextureSampleParameter2D
        ),
        "boundedRoughness": isinstance(
            roughness_input, unreal.MaterialExpressionScalarParameter
        )
        and abs(float(roughness_input.get_editor_property("default_value")) - 0.38)
        <= 0.00001,
        "boundedSpecular": isinstance(
            specular_input, unreal.MaterialExpressionScalarParameter
        )
        and abs(float(specular_input.get_editor_property("default_value")) - 0.32)
        <= 0.00001,
        "opaqueDefaultLitSingleSided": material.get_editor_property("blend_mode")
        == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("shading_model")
        == unreal.MaterialShadingModel.MSM_DEFAULT_LIT
        and not bool(material.get_editor_property("two_sided")),
        "skeletalMeshUsage": unreal.MaterialEditingLibrary.has_material_usage(
            material, unreal.MaterialUsage.MATUSAGE_SKELETAL_MESH
        ),
        "morphTargetUsage": unreal.MaterialEditingLibrary.has_material_usage(
            material, unreal.MaterialUsage.MATUSAGE_MORPH_TARGETS
        ),
        "compileClean": not compile_errors,
    }
    return {
        "material": material.get_path_name(),
        "texture": texture.get_path_name(),
        "nodeClasses": [node.get_class().get_name() for node in expressions],
        "usedTextures": [item.get_path_name() for item in used_textures],
        "compileErrors": [str(error) for error in compile_errors],
        "checks": checks,
        "passed": all(checks.values()),
    }


def import_mesh(source: Path, suffix: str, skeleton) -> tuple[unreal.SkeletalMesh, list[str]]:
    options = unreal.FbxImportUI()
    options.automated_import_should_detect_type = False
    options.import_mesh = True
    options.import_as_skeletal = True
    options.import_rigid_mesh = False
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_SKELETAL_MESH
    options.original_import_type = unreal.FBXImportType.FBXIT_SKELETAL_MESH
    options.override_full_name = True
    options.import_materials = True
    # Import the exact tracked bitmap separately; this prevents transient FBX
    # sibling caches and duplicate texture authority.
    options.import_textures = False
    options.import_animations = False
    options.create_physics_asset = False
    options.physics_asset = None
    options.skeleton = skeleton

    mesh_options = options.skeletal_mesh_import_data
    mesh_options.set_editor_property("convert_scene", True)
    mesh_options.set_editor_property("convert_scene_unit", False)
    mesh_options.set_editor_property("force_front_x_axis", False)
    mesh_options.set_editor_property("import_uniform_scale", 1.0)
    mesh_options.set_editor_property("import_mesh_lods", False)
    mesh_options.set_editor_property("reorder_material_to_fbx_order", True)
    mesh_options.set_editor_property("transform_vertex_to_absolute", False)
    mesh_options.set_editor_property("bake_pivot_in_vertex", False)
    mesh_options.set_editor_property("import_morph_targets", True)
    mesh_options.set_editor_property("morph_threshold_position", 0.0)
    mesh_options.set_editor_property("import_vertex_attributes", False)
    mesh_options.set_editor_property("update_skeleton_reference_pose", False)
    mesh_options.set_editor_property("use_t0_as_ref_pose", False)
    mesh_options.set_editor_property("import_meshes_in_bone_hierarchy", False)
    mesh_options.set_editor_property(
        "normal_import_method", unreal.FBXNormalImportMethod.FBXNIM_IMPORT_NORMALS
    )
    mesh_options.set_editor_property("compute_weighted_normals", False)

    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = asset_name(suffix)
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    mesh = load_mesh(suffix)
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    if not mesh:
        raise RuntimeError(
            f"Expected one SkeletalMesh at {asset_path(suffix)}; imported {imported_paths}"
        )
    return mesh, imported_paths


def remove_exact_fbx_texture_cache(source: Path, repository: Path) -> dict:
    """Remove only Unreal's reproducible extraction cache beside one admitted FBX."""
    cache = source.with_suffix(".fbm")
    if not cache.exists():
        return {"directory": str(cache.relative_to(repository)), "existed": False, "removed": False}
    files = sorted(path for path in cache.rglob("*") if path.is_file())
    expected_name = f"{ASSET_ID}-brown-eye-cc0.png"
    checks = {
        "directoryIsExactSibling": cache.parent == source.parent
        and cache.name == f"{source.stem}.fbm",
        "oneExpectedBitmapOnly": len(files) == 1 and files[0].name == expected_name,
        "exactTrackedBitmapHash": len(files) == 1
        and sha256_file(files[0]) == EYE_TEXTURE_SHA256,
        "noNestedDirectories": not any(
            path.is_dir() for path in cache.iterdir()
        ),
    }
    if not all(checks.values()):
        raise RuntimeError(
            f"Refusing to remove unexpected FBX extraction cache {cache}: {checks}"
        )
    receipt = file_receipt(files[0], repository)
    shutil.rmtree(cache)
    return {
        "directory": str(cache.relative_to(repository)),
        "existed": True,
        "removed": not cache.exists(),
        "bitmap": receipt,
        "checks": checks,
        "passed": all(checks.values()) and not cache.exists(),
    }


def asset_registry_number(mesh, tag: str) -> int:
    asset_data = unreal.EditorAssetLibrary.find_asset_data(mesh.get_path_name())
    value = asset_data.get_tag_value(tag)
    return int(str(value)) if value is not None else -1


def inspect_mesh(expected: dict, mesh, imported_paths: list[str], skeleton) -> dict:
    bounds = mesh.get_bounds()
    minimum = vector_values(bounds.origin - bounds.box_extent)
    maximum = vector_values(bounds.origin + bounds.box_extent)
    dimensions = [maximum[index] - minimum[index] for index in range(3)]
    materials = [
        {
            "slot": str(slot.material_slot_name),
            "material": (
                slot.material_interface.get_path_name() if slot.material_interface else None
            ),
        }
        for slot in mesh.get_editor_property("materials")
    ]
    material_names = [item["slot"] for item in materials]
    morph_targets = [str(name) for name in mesh.get_all_morph_target_names()]
    mesh_skeleton = mesh.get_editor_property("skeleton")
    subsystem = unreal.get_editor_subsystem(unreal.SkeletalMeshEditorSubsystem)
    triangle_count = asset_registry_number(mesh, "Triangles")
    registry_vertex_count = asset_registry_number(mesh, "Vertices")
    registry_lod_count = asset_registry_number(mesh, "LODs")
    bone_count = asset_registry_number(mesh, "Bones")
    morph_count = asset_registry_number(mesh, "MorphTargets")
    lod_count = int(subsystem.get_lod_count(mesh))
    vertex_count = int(subsystem.get_num_verts(mesh, 0))
    section_count = int(subsystem.get_num_sections(mesh, 0))
    expected_skeleton_path = f"{SKELETON_PATH}.{SKELETON_NAME}"
    expected_minimum, expected_maximum = expected_unreal_bounds(expected)
    checks = {
        "exactAssetIdentity": mesh.get_path_name()
        == f"{asset_path(expected['suffix'])}.{asset_name(expected['suffix'])}",
        "exactSharedSkeleton": mesh_skeleton == skeleton
        and mesh_skeleton.get_path_name() == expected_skeleton_path,
        "exactSkeletonBones": bool(mesh_skeleton)
        and skeleton_bone_names(mesh_skeleton) == list(BONE_NAMES),
        "rootIsSoleTopLevelBone": str(mesh.get_bone_parent("Root")) in {"", "None"},
        "pelvisParentIsRoot": str(mesh.get_bone_parent("pelvis")) == "Root",
        "singleSourceLod": lod_count == 1,
        "assetRegistrySingleSourceLod": registry_lod_count == 1,
        "exactTriangleTopology": triangle_count == expected["triangles"],
        "consistentNonEmptyVertexTopology": vertex_count > 0
        and registry_vertex_count == vertex_count,
        "exactBoneRegistryCount": bone_count == len(BONE_NAMES),
        "oneSectionPerExactMaterial": section_count == len(expected["materials"]),
        "exactMaterialSlotsNoExtras": set(material_names) == set(expected["materials"])
        and len(material_names) == len(expected["materials"]),
        "allMaterialsResolved": all(item["material"] for item in materials),
        "materialsRemainIsolated": all(
            bool(item["material"])
            and item["material"].startswith(f"{DESTINATION}/")
            for item in materials
        ),
        "exactTwentyOneMorphTargetsNoExtras": set(morph_targets) == set(MORPH_TARGETS)
        and len(morph_targets) == len(MORPH_TARGETS),
        "exactMorphRegistryCount": morph_count == len(MORPH_TARGETS),
        "exactRestBounds": close_values(
            minimum, expected_minimum, BOUNDS_TOLERANCE_METRES
        )
        and close_values(maximum, expected_maximum, BOUNDS_TOLERANCE_METRES),
        "boundedPresentedHeight": 155.0
        <= dimensions[2] * PRESENTATION_SCALE
        <= 183.0,
        "noPhysicsAsset": mesh.get_editor_property("physics_asset") is None,
    }
    return {
        "characterId": expected["id"],
        "assetPath": mesh.get_path_name(),
        "importedObjectPaths": imported_paths,
        "sourceTriangles": expected["triangles"],
        "renderTopology": {
            "triangles": triangle_count,
            "vertices": vertex_count,
            "assetRegistryVertices": registry_vertex_count,
            "lods": lod_count,
            "assetRegistryLods": registry_lod_count,
            "sections": section_count,
        },
        "boundsMetres": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": dimensions,
        },
        "expectedUnrealAssetLocalBoundsMetres": {
            "minimum": expected_minimum,
            "maximum": expected_maximum,
        },
        "presentedHeightCentimeters": dimensions[2] * PRESENTATION_SCALE,
        "materials": materials,
        "skeleton": mesh_skeleton.get_path_name() if mesh_skeleton else None,
        "boneCount": bone_count,
        "morphTargets": sorted(morph_targets),
        "physicsAsset": (
            mesh.get_editor_property("physics_asset").get_path_name()
            if mesh.get_editor_property("physics_asset")
            else None
        ),
        "checks": checks,
        "passed": all(checks.values()),
    }


def destination_inventory() -> dict:
    paths = sorted(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True))
    assets = []
    for path in paths:
        asset = unreal.EditorAssetLibrary.load_asset(path)
        assets.append(
            {
                "path": path,
                "class": asset.get_class().get_name() if asset else None,
            }
        )
    material_names = expected_material_names()
    expected_paths = {
        f"{asset_path(character['suffix'])}.{asset_name(character['suffix'])}"
        for character in CHARACTERS
    }
    expected_paths.update(
        f"{DESTINATION}/{name}.{name}" for name in material_names
    )
    expected_paths.add(f"{DESTINATION}/{EYE_TEXTURE_NAME}.{EYE_TEXTURE_NAME}")
    actual_paths = {item["path"] for item in assets}
    allowed_classes = {"SkeletalMesh", "Material", "Texture2D"}
    checks = {
        "exactExpectedAssetsNoExtras": actual_paths == expected_paths,
        "onlyFiveSkeletalMeshesMaterialsAndOneTexture": all(
            item["class"] in allowed_classes for item in assets
        ),
        "exactAssetCount": len(assets) == len(expected_paths),
        "noSkeletonPhysicsAnimationOrGameplayAssets": all(
            item["class"] not in {
                "Skeleton",
                "PhysicsAsset",
                "AnimSequence",
                "AnimationAsset",
                "Blueprint",
                "DataAsset",
                "PrimaryDataAsset",
                "SoundWave",
                "SoundCue",
            }
            for item in assets
        ),
    }
    return {
        "assets": assets,
        "expectedPaths": sorted(expected_paths),
        "checks": checks,
        "passed": all(checks.values()),
    }


def evidence_path(repository: Path) -> Path:
    return (
        repository
        / "docs"
        / "production"
        / "evidence"
        / "unreal-daze-council-facial-performance-import-status.json"
    )


def write_report(repository: Path, report: dict) -> Path:
    report_path = evidence_path(repository)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report_path


def main() -> None:
    requested_mode = os.environ.get(MUTATION_ENV, "")
    if requested_mode not in {"", "0", "1"}:
        raise RuntimeError(f"{MUTATION_ENV} must be unset, 0 or exactly 1")
    replace = requested_mode == "1"
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    previous_import_report = None
    if not replace and evidence_path(repository).is_file():
        candidate = json.loads(evidence_path(repository).read_text(encoding="utf-8"))
        if candidate.get("mode") == "import-replace" and candidate.get("passed") is True:
            previous_import_report = candidate
    source_root = repository / "assets" / "3d" / "export"
    legacy_disk_root = project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncil"
    destination_disk_root = (
        project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncilFacial"
    )
    eye_texture_source = (
        repository / "assets" / "3d" / "source" / f"{ASSET_ID}-brown-eye-cc0.png"
    )

    source_contract, source_receipts = validate_source_contract(repository, source_root)
    skeleton, skeleton_status = load_and_validate_shared_skeleton()
    skeleton_bones_before = skeleton_bone_names(skeleton)
    skeleton_pose_before = skeleton_reference_pose_receipt(skeleton)
    skeleton_curves_before = sorted(
        str(name) for name in skeleton.get_curve_meta_data_names()
    )
    legacy_assets_before = sorted(
        unreal.EditorAssetLibrary.list_assets(LEGACY_DESTINATION, recursive=True)
    )
    legacy_disk_before = relative_file_receipts(legacy_disk_root)

    expected_mesh_paths = [asset_path(item["suffix"]) for item in CHARACTERS]
    existing_meshes = [
        unreal.EditorAssetLibrary.does_asset_exist(path) for path in expected_mesh_paths
    ]
    destination_exists = unreal.EditorAssetLibrary.does_directory_exist(DESTINATION)

    if not replace:
        if not destination_exists or not all(existing_meshes):
            raise RuntimeError(
                "Facial destination is absent or partial. Default mode cannot create assets; "
                f"set {MUTATION_ENV}=1 for the isolated import."
            )
    elif destination_exists:
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(f"Could not replace exact isolated target: {DESTINATION}")

    eye_texture_imported_paths = []
    eye_texture = (
        unreal.EditorAssetLibrary.load_asset(f"{DESTINATION}/{EYE_TEXTURE_NAME}")
        if not replace
        else None
    )
    if replace:
        eye_texture, eye_texture_imported_paths = import_eye_texture(
            eye_texture_source
        )
    if not isinstance(eye_texture, unreal.Texture2D):
        raise RuntimeError(
            f"Missing exact tracked eye texture: {DESTINATION}/{EYE_TEXTURE_NAME}"
        )

    meshes = {}
    imported = {}
    extraction_cache_cleanup = {}
    for expected in CHARACTERS:
        source = source_root / f"{ASSET_ID}-{expected['id']}.fbx"
        if not replace and source.with_suffix(".fbm").exists():
            raise RuntimeError(
                f"Inspect-only mode found an untracked FBX extraction cache: {source.with_suffix('.fbm')}"
            )
        before_cache = (
            remove_exact_fbx_texture_cache(source, repository) if replace else None
        )
        imported[expected["id"]] = []
        mesh = None if replace else load_mesh(expected["suffix"])
        if replace:
            mesh, imported[expected["id"]] = import_mesh(
                source, expected["suffix"], skeleton
            )
            after_cache = remove_exact_fbx_texture_cache(source, repository)
            extraction_cache_cleanup[expected["id"]] = {
                "beforeImport": before_cache,
                "afterImport": after_cache,
                "passed": not source.with_suffix(".fbm").exists()
                and (not after_cache.get("existed") or after_cache.get("passed") is True),
            }
        if not mesh:
            raise RuntimeError(f"Missing exact facial SkeletalMesh: {asset_path(expected['suffix'])}")
        meshes[expected["id"]] = mesh

    eye_material = (
        author_eye_material(eye_texture)
        if replace
        else unreal.EditorAssetLibrary.load_asset(
            f"{DESTINATION}/{EYE_MATERIAL_NAME}"
        )
    )
    if not isinstance(eye_material, unreal.Material):
        raise RuntimeError(f"Missing exact reviewed eye material: {EYE_MATERIAL_NAME}")
    material_usage_status = configure_and_inspect_material_usage(replace)
    eye_material_status = inspect_eye_material(eye_material, eye_texture, replace)

    character_status = {
        expected["id"]: inspect_mesh(
            expected,
            meshes[expected["id"]],
            imported[expected["id"]],
            skeleton,
        )
        for expected in CHARACTERS
    }
    inventory = destination_inventory()
    skeleton_bones_after = skeleton_bone_names(skeleton)
    skeleton_pose_after = skeleton_reference_pose_receipt(skeleton)
    skeleton_curves_after = sorted(
        str(name) for name in skeleton.get_curve_meta_data_names()
    )
    curve_names_before = set(skeleton_curves_before)
    curve_names_after = set(skeleton_curves_after)
    added_curve_names = sorted(curve_names_after - curve_names_before)
    removed_curve_names = sorted(curve_names_before - curve_names_after)
    morph_metadata_checks = {
        "exactTwentyOneAddedNoExtras": (
            set(added_curve_names) == set(MORPH_TARGETS)
            if replace
            else set(added_curve_names).issubset(set(MORPH_TARGETS))
        ),
        "existingMetadataPreserved": not removed_curve_names,
    }
    skeleton_status["morphMetadataExtension"] = {
        "beforeNames": skeleton_curves_before,
        "afterNames": skeleton_curves_after,
        "addedNames": added_curve_names,
        "removedNames": removed_curve_names,
        **morph_metadata_checks,
        "passed": all(morph_metadata_checks.values()),
    }
    legacy_assets_after = sorted(
        unreal.EditorAssetLibrary.list_assets(LEGACY_DESTINATION, recursive=True)
    )
    legacy_disk_after = relative_file_receipts(legacy_disk_root)
    preservation_checks = {
        "sharedSkeletonObjectUnchanged": skeleton_bones_after == skeleton_bones_before
        == list(BONE_NAMES),
        "sharedSkeletonReferencePoseUnchanged": skeleton_pose_after
        == skeleton_pose_before,
        "sharedSkeletonMorphMetadataExtensionBounded": skeleton_status[
            "morphMetadataExtension"
        ]["passed"],
        "acceptedV1AssetInventoryUnchanged": legacy_assets_after == legacy_assets_before,
        "acceptedV1DiskReceiptsUnchanged": legacy_disk_after == legacy_disk_before,
        "isolatedDestinationIsNotLegacyDestination": DESTINATION != LEGACY_DESTINATION
        and not DESTINATION.startswith(f"{LEGACY_DESTINATION}/"),
    }

    report = {
        "assetId": ASSET_ID,
        "status": "five-identity facial-performance engineering blockout; not final acting",
        "disclosure": (
            "FACIAL PERFORMANCE ENGINEERING BLOCKOUT · SILENT INTENT CADENCE · "
            "GENERIC NON-PORTRAIT FACE · NOT FINAL ACTING, LIP SYNC OR VOICE"
        ),
        "mode": "import-replace" if replace else "inspect-only",
        "mutationEnvironment": MUTATION_ENV,
        "mutationAuthorized": replace,
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "destination": DESTINATION,
        "coordinateTransform": {
            "sourceSpace": "Blender right-handed Z-up metres",
            "unrealAssetLocalSpace": (
                "Unreal left-handed Z-up asset-local values retaining metre magnitudes"
            ),
            "sourceToAssetLocalScale": [1, -1, 1],
            "runtimePresentationScale": 100,
            "presentedUnit": "centimetres",
            "passed": True,
        },
        "sourceContract": source_contract,
        "sourceFbxReceipts": source_receipts,
        "extractedTextureCacheCleanup": {
            "characters": extraction_cache_cleanup,
            "passed": all(
                item.get("passed") is True
                for item in extraction_cache_cleanup.values()
            )
            if replace
            else all(
                not (
                    source_root / f"{ASSET_ID}-{item['id']}.fbm"
                ).exists()
                for item in CHARACTERS
            ),
        },
        "sharedSkeleton": skeleton_status,
        "characters": character_status,
        "eyeTextureImport": {
            "source": file_receipt(eye_texture_source, repository),
            "assetPath": eye_texture.get_path_name(),
            "importedObjectPaths": eye_texture_imported_paths,
            "passed": eye_texture.get_path_name()
            == f"{DESTINATION}/{EYE_TEXTURE_NAME}.{EYE_TEXTURE_NAME}",
        },
        "eyeMaterial": eye_material_status,
        "materialUsage": material_usage_status,
        "destinationInventory": inventory,
        "acceptedV1Preservation": {
            "assetCountBefore": len(legacy_assets_before),
            "assetCountAfter": len(legacy_assets_after),
            "diskReceiptCountBefore": len(legacy_disk_before),
            "diskReceiptCountAfter": len(legacy_disk_after),
            "checks": preservation_checks,
            "passed": all(preservation_checks.values()),
        },
        "morphContract": {
            "count": len(MORPH_TARGETS),
            "names": list(MORPH_TARGETS),
        },
        "authorityBoundary": {
            "physics": False,
            "animation": False,
            "rigidMesh": False,
            "gameplay": False,
            "saveOrCampaign": False,
            "voiceOrTranscript": False,
        },
        "limitations": [
            "Silent intent cadence only; no lip sync, phoneme timing, transcript or voice authority.",
            "Generic shared non-portrait face; no historical likeness claim.",
            "Medium development framing only; no final close dialogue or marketing approval.",
            "No final inner-mouth, eyebrow, lash, skin, cloth, hair or wet-material approval.",
        ],
    }
    report["passed"] = (
        source_contract["passed"]
        and report["extractedTextureCacheCleanup"]["passed"]
        and skeleton_status["passed"]
        and skeleton_status["morphMetadataExtension"]["passed"]
        and all(item["passed"] for item in character_status.values())
        and report["eyeTextureImport"]["passed"]
        and eye_material_status["passed"]
        and material_usage_status["passed"]
        and inventory["passed"]
        and report["acceptedV1Preservation"]["passed"]
    )

    if replace and report["passed"]:
        unreal.EditorAssetLibrary.save_directory(
            DESTINATION, only_if_is_dirty=False, recursive=True
        )
        legacy_disk_saved = relative_file_receipts(legacy_disk_root)
        saved_preservation = legacy_disk_saved == legacy_disk_before
        report["acceptedV1Preservation"]["checks"][
            "acceptedV1DiskReceiptsUnchangedAfterSave"
        ] = saved_preservation
        report["acceptedV1Preservation"]["passed"] = (
            report["acceptedV1Preservation"]["passed"] and saved_preservation
        )
        report["saved"] = True
        report["passed"] = report["passed"] and saved_preservation
    else:
        report["saved"] = False

    tracked_unreal_assets = relative_file_receipts(destination_disk_root)
    expected_unreal_asset_files = {
        f"{path.rsplit('/', 1)[-1].split('.', 1)[0]}.uasset"
        for path in inventory["expectedPaths"]
    }
    tracked_asset_checks = {
        "exactTwentyOneUassetsNoExtras": set(tracked_unreal_assets)
        == expected_unreal_asset_files
        and len(tracked_unreal_assets) == 21,
        "allReceiptsNonEmpty": all(
            receipt["bytes"] > 0 and len(receipt["sha256"]) == 64
            for receipt in tracked_unreal_assets.values()
        ),
    }
    report["trackedUnrealAssets"] = {
        "root": str(destination_disk_root.relative_to(repository)),
        "receipts": tracked_unreal_assets,
        "checks": tracked_asset_checks,
        "passed": all(tracked_asset_checks.values()),
    }
    report["passed"] = report["passed"] and report["trackedUnrealAssets"]["passed"]

    if not replace and previous_import_report is not None:
        previous_receipts = previous_import_report.get(
            "trackedUnrealAssets", {}
        ).get("receipts", {})
        hashes_unchanged = previous_receipts == tracked_unreal_assets
        read_only_inspection = {
            "mode": "inspect-only",
            "mutationAuthorized": False,
            "exitCode": 0,
            "trackedUassetHashesUnchanged": hashes_unchanged,
            "sourceContractPassed": source_contract["passed"],
            "sharedSkeletonPassed": skeleton_status["passed"],
            "allFiveCharactersPassed": all(
                item["passed"] for item in character_status.values()
            ),
            "eyeMaterialPassed": eye_material_status["passed"],
            "materialUsagePassed": material_usage_status["passed"],
            "destinationInventoryPassed": inventory["passed"],
            "acceptedV1Preserved": report["acceptedV1Preservation"]["passed"],
            "passed": report["passed"] and hashes_unchanged,
        }
        previous_import_report["readOnlyInspection"] = read_only_inspection
        previous_import_report["passed"] = (
            previous_import_report.get("passed") is True
            and read_only_inspection["passed"]
        )
        report = previous_import_report

    report_path = write_report(repository, report)
    unreal.log(f"SHI_DAZE_COUNCIL_FACIAL_REPORT {json.dumps(report, sort_keys=True)}")
    unreal.log(f"SHI_DAZE_COUNCIL_FACIAL_EVIDENCE {report_path}")
    if not report["passed"]:
        raise RuntimeError(f"Daze council facial Unreal admission failed: {report}")


main()
