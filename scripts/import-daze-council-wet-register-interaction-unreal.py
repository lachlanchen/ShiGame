"""Inspect or explicitly import SHI's isolated wet-register interaction v1.

Inspection is the default and is read-only with respect to Unreal content. Set
exactly ``SHI_DAZE_COUNCIL_WET_REGISTER_INTERACTION_REIMPORT=1`` to replace
only ``/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1`` from the
reviewed source package. Both modes refresh one tracked admission report.

The destination owns exactly one StaticMesh blockout prop, one texture-free
clay Material and one non-looping AnimSequence. The already accepted facial
and skin packages and their exact shared 53-bone Skeleton are immutable
dependencies. This importer creates no Skeleton, SkeletalMesh, PhysicsAsset,
texture, Blueprint, audio, input, navigation, gameplay, save or replication
authority.
"""

from __future__ import annotations

import ast
import hashlib
import json
import math
import os
from pathlib import Path
from typing import Any

import unreal


ASSET_ID = "shi-daze-council-wet-register-interaction-v1"
EVIDENCE_SCHEMA_VERSION = 1
MUTATION_ENV = "SHI_DAZE_COUNCIL_WET_REGISTER_INTERACTION_REIMPORT"
DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilWetRegisterInteractionV1"

PROP_NAME = "SM_SHI_DazeCouncil_WetRegister_Blockout_01"
MATERIAL_NAME = "M_SHI_DazeCouncil_WetRegister_Clay_01"
ANIMATION_NAME = "A_SHI_DazeCouncil_ChenSheng_WetRegister_Interaction_01"

PROP_SOURCE_RELATIVE_PATH = (
    "assets/3d/source/shi-daze-council-wet-register-interaction-v1-prop.fbx"
)
ANIMATION_SOURCE_RELATIVE_PATH = (
    "assets/3d/source/" "shi-daze-council-wet-register-interaction-v1-chen-sheng.fbx"
)
METRICS_RELATIVE_PATH = (
    "assets/3d/source/shi-daze-council-wet-register-interaction-v1.metrics.json"
)
VALIDATION_RELATIVE_PATH = (
    "assets/3d/source/shi-daze-council-wet-register-interaction-v1.validation.json"
)
PROVENANCE_RELATIVE_PATH = (
    "assets/provenance/shi-daze-council-wet-register-interaction-v1.json"
)
EVIDENCE_RELATIVE_PATH = (
    "docs/production/evidence/"
    "unreal-daze-council-wet-register-interaction-import-status.json"
)
PINNED_FILE_RECEIPTS = {
    METRICS_RELATIVE_PATH: {
        "bytes": 143071,
        "sha256": "e7a1abae63401305aaf7e82fc24cb53aa350f12a117e1c38d48b0314b612f310",
    },
    VALIDATION_RELATIVE_PATH: {
        "bytes": 109756,
        "sha256": "e2045361f05502296e265cc3620a8b3702fee26c23ea6684a4a8022945acf19c",
    },
    PROVENANCE_RELATIVE_PATH: {
        "bytes": 8765,
        "sha256": "150a1f8b188a8d1b88cfa0c774731863e8aa0e63c932e8a74bb9e70898d926fc",
    },
    PROP_SOURCE_RELATIVE_PATH: {
        "bytes": 21788,
        "sha256": "ea48062b9b9f0a6e844a2d22195e15c6f4b8be4c67fa9845cb68a8b62f678252",
    },
    ANIMATION_SOURCE_RELATIVE_PATH: {
        "bytes": 2703516,
        "sha256": "7438a067220e770456f28d0e22e164bd798fb1cae12fb28561b8710358ff3302",
    },
}
EXPECTED_VALIDATION_CHECK_COUNT = 91
STATIC_MATERIAL_MUTATION_FIELDS = (
    "material_interface",
    "material_slot_name",
    "imported_material_slot_name",
)
IMPORTED_MATERIAL_SLOT_FIELD = "imported_material_slot_name"

SHARED_SKELETON_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"
SHARED_SKELETON_NAME = "SK_SHI_DazeCouncil_Skeleton"
SHARED_SKELETON_PATH = f"{SHARED_SKELETON_DESTINATION}/{SHARED_SKELETON_NAME}"
FACIAL_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilFacial"
SKIN_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1"
FACIAL_EVIDENCE_RELATIVE_PATH = (
    "docs/production/evidence/"
    "unreal-daze-council-facial-performance-import-status.json"
)
SKIN_EVIDENCE_RELATIVE_PATH = (
    "docs/production/evidence/" "unreal-daze-council-skin-lookdev-import-status.json"
)

EXPECTED_PROP_DIMENSIONS_CENTIMETERS = (32.0, 14.0, 2.0)
EXPECTED_PROP_MINIMUM_CENTIMETERS = (-16.0, -7.0, -1.0)
EXPECTED_PROP_MAXIMUM_CENTIMETERS = (16.0, 7.0, 1.0)
PROP_BOUNDS_TOLERANCE_CENTIMETERS = 0.05
PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE = 0.01
PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE = (
    "FBX-to-Unreal static-mesh unit correction only; not runtime scale"
)

EXPECTED_SAMPLES = 121
EXPECTED_SECONDS = 4.0
EXPECTED_FRAMES_PER_SECOND = 30.0
EXPECTED_IMPORTED_TRACKS = 52
EXPECTED_ORDERED_RELEASE_PHASE_ONSET_SAMPLE = 90
EXPECTED_RIGHT_CONTACT_EXIT_SAMPLE = 91
HELD_BOUNDARY_AUTHORING_RESERVE_CENTIMETERS = 0.65
HELD_BOUNDARY_FIRST_SOURCE_FRAME = 90.0
HELD_BOUNDARY_LAST_SOURCE_FRAME = 91.0
HELD_BOUNDARY_SAMPLED_POINTS = 65
ROOT_TRANSLATION_TOLERANCE_ASSET_UNITS = 0.001
ROOT_ROTATION_TOLERANCE_DEGREES = 0.1
SCALE_TOLERANCE = 0.00001
CHILD_TRANSLATION_TOLERANCE_ASSET_UNITS = 0.0001

MARKER_IDS = (
    "wet-register-left-support",
    "wet-register-right-contact",
    "wet-register-camera-readability",
)
MARKER_SOCKET_NAMES = {
    "wet-register-left-support": "WetRegister_LeftSupport",
    "wet-register-right-contact": "WetRegister_RightContact",
    "wet-register-camera-readability": "WetRegister_CameraReadability",
}
EXPECTED_MARKER_TRANSFORMS = {
    "wet-register-left-support": {
        "sourcePositionXYZCentimeters": (11.0, 5.5, -3.35),
        "unrealPositionXYZCentimeters": (11.0, -5.5, -3.35),
        "sourceRotationXYZDegrees": (180.0, 0.0, 0.0),
        "rotationDegrees": (0.0, 0.0, 180.0),
        "unrealQuaternionXYZW": (1.0, 0.0, 0.0, 0.0),
    },
    "wet-register-right-contact": {
        "sourcePositionXYZCentimeters": (-11.0, -5.5, 3.35),
        "unrealPositionXYZCentimeters": (-11.0, 5.5, 3.35),
        "sourceRotationXYZDegrees": (0.0, 0.0, -90.0),
        "rotationDegrees": (0.0, 90.0, 0.0),
        "unrealQuaternionXYZW": (
            0.0,
            0.0,
            0.7071067811865475,
            0.7071067811865476,
        ),
    },
    "wet-register-camera-readability": {
        "sourcePositionXYZCentimeters": (0.0, 0.0, 1.0),
        "unrealPositionXYZCentimeters": (0.0, 0.0, 1.0),
        "sourceRotationXYZDegrees": (0.0, 0.0, 0.0),
        "rotationDegrees": (0.0, 0.0, 0.0),
        "unrealQuaternionXYZW": (0.0, 0.0, 0.0, 1.0),
    },
}
EXPECTED_CONTACT_MEASUREMENTS = {
    "leftMaximumDriftCentimeters": 0.0039685306858313904,
    "leftMaximumAngularDriftDegrees": 0.0,
    "leftSupportMaximumFloatingCentimeters": 0.3386637148479367,
    "maximumPenetrationCentimeters": 0.3500294405966997,
    "maximumFloatingCentimeters": 0.0,
}
EXPECTED_STORY_CONTINUITY = {
    "campaignNode": "rain-order",
    "speaker": "chen-sheng",
    "speakerSlot": "speaker",
    "keeperOwnsRegisterBeforeClip": True,
    "authoredOffscreenPriorHandoffAssumption": True,
    "handoffShown": False,
    "playerOwnershipContinuityReview": "pending",
    "clipAloneCompletesStoryBeat": False,
    "twoCharacterTransferDeferred": True,
}
EXPECTED_TIMING_BOUNDARY = {
    "durationSeconds": 4.0,
    "purpose": "silent-engineering-interaction-timing-only",
    "multilingualSpeechTimingAuthority": False,
    "voiceTimingAuthority": False,
    "lipSyncTimingAuthority": False,
}
REQUIRED_FALSE_REVIEW_GATES = (
    "engineAdmission",
    "humanHistoricalCulturalApproval",
    "finalProp",
    "finalHandAnimation",
    "engine",
    "historical",
    "finalHand",
    "sourceEngineering",
    "anatomy",
    "cinematic",
    "culturalPerformance",
    "accessibility",
    "watchedSourceVisual",
    "playerOwnershipContinuity",
)
SEMANTIC_SAMPLES = (
    {
        "sourceFrame": 1,
        "unrealSample": 0,
        "timeSeconds": 0.0,
        "state": "start",
    },
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
    {
        "sourceFrame": 121,
        "unrealSample": 120,
        "timeSeconds": 4.0,
        "state": "settle",
    },
)

BONE_NAMES = (
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
)
ARM_CHAIN_BONES = (
    "clavicle_l",
    "upperarm_l",
    "lowerarm_l",
    "hand_l",
    "clavicle_r",
    "upperarm_r",
    "lowerarm_r",
    "hand_r",
)

METADATA = {
    "SHI.AssetId": ASSET_ID,
    "SHI.Authority": "engineering-review-only",
    "SHI.CampaignAuthority": "false",
    "SHI.SaveAuthority": "false",
    "SHI.ReplicationAuthority": "false",
    "SHI.NonLooping": "true",
    "SHI.LeftOwnerBone": "hand_l",
    "SHI.RightContactBone": "hand_r",
    "SHI.PropRuntimeScaleCompensation": "0.01",
    "SHI.SemanticSamples": json.dumps(
        SEMANTIC_SAMPLES, separators=(",", ":"), sort_keys=True
    ),
}

MATERIAL_COLOR = (0.185, 0.135, 0.095, 1.0)
MATERIAL_ROUGHNESS = 0.86
MATERIAL_METALLIC = 0.0
MATERIAL_SPECULAR = 0.15


def asset_path(name: str) -> str:
    return f"{DESTINATION}/{name}"


def object_path(name: str) -> str:
    return f"{asset_path(name)}.{name}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_receipt(path: Path, repository: Path | None = None) -> dict:
    display = path.relative_to(repository) if repository else path
    return {
        "file": str(display).replace("\\", "/"),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def relative_file_receipts(root: Path) -> dict[str, dict]:
    if not root.is_dir():
        return {}
    return {
        str(path.relative_to(root)).replace("\\", "/"): {
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
        for path in sorted(item for item in root.rglob("*") if item.is_file())
    }


def normalized_manifest_file(value: str) -> str:
    return value.replace("\\", "/").lstrip("./")


def collect_manifest_receipts(value: Any, result: dict[str, dict]) -> None:
    if isinstance(value, dict):
        if {"file", "bytes", "sha256"}.issubset(value):
            key = normalized_manifest_file(str(value["file"]))
            receipt = {
                "file": key,
                "bytes": int(value["bytes"]),
                "sha256": str(value["sha256"]),
            }
            previous = result.get(key)
            if previous is not None and previous != receipt:
                raise RuntimeError(f"Conflicting manifest receipts for {key}")
            result[key] = receipt
        for nested in value.values():
            collect_manifest_receipts(nested, result)
    elif isinstance(value, list):
        for nested in value:
            collect_manifest_receipts(nested, result)


def load_json_manifest(
    repository: Path, relative_path: str
) -> tuple[dict, dict[str, dict], dict]:
    path = repository / relative_path
    if not path.is_file():
        raise FileNotFoundError(f"Missing Gate 5A source manifest: {path}")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        raise RuntimeError(f"Manifest root must be an object: {path}")
    if manifest.get("assetId") != ASSET_ID:
        raise RuntimeError(f"Manifest assetId drifted: {path}")
    receipts: dict[str, dict] = {}
    collect_manifest_receipts(manifest, receipts)
    return manifest, receipts, file_receipt(path, repository)


def exact_receipt_in_manifest(
    receipts: dict[str, dict], relative_path: str, actual: dict
) -> bool:
    candidate = receipts.get(normalized_manifest_file(relative_path))
    return (
        isinstance(candidate, dict)
        and candidate.get("bytes") == actual["bytes"]
        and candidate.get("sha256") == actual["sha256"]
    )


def exact_pinned_receipt(relative_path: str, actual: dict) -> bool:
    expected = PINNED_FILE_RECEIPTS[relative_path]
    return (
        actual.get("file") == relative_path
        and actual.get("bytes") == expected["bytes"]
        and actual.get("sha256") == expected["sha256"]
    )


def exact_float(value: Any, expected: float, tolerance: float = 0.000001) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
        and abs(float(value) - expected) <= tolerance
    )


def exact_numeric_vector(
    value: Any, expected: tuple[float, ...], tolerance: float = 0.000001
) -> bool:
    return (
        isinstance(value, list)
        and len(value) == len(expected)
        and all(
            exact_float(value[index], expected[index], tolerance)
            for index in range(len(expected))
        )
    )


def finite_numeric_vector(value: Any, length: int) -> bool:
    return (
        isinstance(value, list)
        and len(value) == length
        and all(
            isinstance(item, (int, float))
            and not isinstance(item, bool)
            and math.isfinite(float(item))
            for item in value
        )
    )


def normalized_semantic_samples(value: Any) -> list[dict]:
    if not isinstance(value, list):
        return []
    return [
        {
            "sourceFrame": item.get("sourceFrame"),
            "unrealSample": item.get("unrealSample"),
            "timeSeconds": item.get("timeSeconds"),
            "state": item.get("state"),
        }
        for item in value
        if isinstance(item, dict)
    ]


def validate_static_material_binding_source(
    source_path: Path | None = None,
) -> dict:
    """Require native mutation plus read-only validation of the exact binding."""
    path = source_path if source_path is not None else Path(__file__).resolve()
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=path.name)
    forbidden_fields = set(STATIC_MATERIAL_MUTATION_FIELDS) | {"static_materials"}
    forbidden_setter_methods = {
        "set_static_materials",
        "set_material",
        "set_material_by_name",
    }
    reflected_setters = []
    alternate_setters = []
    direct_assignments = []
    python_constructors = []
    python_static_material_references = []
    forbidden_dotted_or_dynamic_imported_slot_reads = []
    reflected_imported_slot_reads = []
    configure_helper = (
        "unreal.ShiAnimationImportLibrary.configure_exact_single_material_binding"
    )
    validate_helper = (
        "unreal.ShiAnimationImportLibrary.validate_exact_single_material_binding"
    )
    configure_calls = []
    validate_calls = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute):
            dotted_name = ast_dotted_name(node)
            if dotted_name == "unreal.StaticMaterial":
                python_static_material_references.append(node.lineno)
            if node.attr == IMPORTED_MATERIAL_SLOT_FIELD:
                forbidden_dotted_or_dynamic_imported_slot_reads.append(
                    {"access": dotted_name, "line": node.lineno}
                )
        if isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                assigned_fields = sorted(
                    {
                        child.attr
                        for child in ast.walk(target)
                        if isinstance(child, ast.Attribute)
                        and child.attr in forbidden_fields
                    }
                )
                if assigned_fields:
                    direct_assignments.append(
                        {"fields": assigned_fields, "line": node.lineno}
                    )
        if not isinstance(node, ast.Call):
            continue
        function = node.func
        call_name = ast_dotted_name(function)
        property_name = (
            node.args[0].value
            if node.args
            and isinstance(node.args[0], ast.Constant)
            and isinstance(node.args[0].value, str)
            else None
        )
        if (
            isinstance(function, ast.Attribute)
            and function.attr == "get_editor_property"
            and property_name == IMPORTED_MATERIAL_SLOT_FIELD
        ):
            reflected_imported_slot_reads.append(
                {
                    "access": call_name,
                    "line": node.lineno,
                    "positionalLiteral": property_name,
                    "keywordArguments": [keyword.arg for keyword in node.keywords],
                }
            )
        if (
            call_name == "getattr"
            and len(node.args) >= 2
            and isinstance(node.args[1], ast.Constant)
            and node.args[1].value == IMPORTED_MATERIAL_SLOT_FIELD
        ):
            forbidden_dotted_or_dynamic_imported_slot_reads.append(
                {"access": call_name, "line": node.lineno}
            )
        if (
            isinstance(function, ast.Attribute)
            and function.attr == "set_editor_property"
        ):
            if property_name in forbidden_fields or (
                call_name == "mesh.set_editor_property"
                and property_name != "nanite_settings"
            ):
                reflected_setters.append(
                    {
                        "field": property_name,
                        "line": node.lineno,
                    }
                )
        mutates_material_array_readback = (
            isinstance(function, ast.Attribute)
            and function.attr
            in {"append", "clear", "extend", "insert", "pop", "remove", "__setitem__"}
            and any(
                isinstance(child, ast.Call)
                and ast_dotted_name(child.func).endswith(".get_editor_property")
                and child.args
                and isinstance(child.args[0], ast.Constant)
                and child.args[0].value == "static_materials"
                for child in ast.walk(function.value)
            )
        )
        if (
            (
                isinstance(function, ast.Attribute)
                and function.attr in forbidden_setter_methods
            )
            or ".static_materials." in call_name
            or mutates_material_array_readback
        ):
            alternate_setters.append(
                {
                    "method": function.attr,
                    "line": node.lineno,
                }
            )
        if (
            isinstance(function, ast.Attribute)
            and isinstance(function.value, ast.Name)
            and function.value.id == "unreal"
            and function.attr == "StaticMaterial"
        ):
            python_constructors.append(
                {
                    "line": node.lineno,
                    "keywords": [keyword.arg for keyword in node.keywords],
                }
            )
        call_receipt = {
            "line": node.lineno,
            "positionalArguments": [ast_dotted_name(arg) for arg in node.args],
            "keywordArguments": [keyword.arg for keyword in node.keywords],
        }
        if call_name == configure_helper:
            configure_calls.append(call_receipt)
        elif call_name == validate_helper:
            validate_calls.append(call_receipt)

    wrapper = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "prepare_exact_single_material_binding"
        ),
        None,
    )
    wrapper_signature = (
        [argument.arg for argument in wrapper.args.args] if wrapper is not None else []
    )
    wrapper_configure_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.Call)
            and ast_dotted_name(node.func) == configure_helper
        ]
        if wrapper is not None
        else []
    )
    wrapper_validate_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.Call)
            and ast_dotted_name(node.func) == validate_helper
        ]
        if wrapper is not None
        else []
    )
    mutation_guard_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.If)
            and isinstance(node.test, ast.Name)
            and node.test.id == "mutation_authorized"
            and any(
                isinstance(child, ast.Call)
                and ast_dotted_name(child.func) == configure_helper
                for child in ast.walk(node)
            )
        ]
        if wrapper is not None
        else []
    )
    validation_guard_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.If)
            and any(
                isinstance(child, ast.Call)
                and ast_dotted_name(child.func) == validate_helper
                for child in ast.walk(node)
            )
        ]
        if wrapper is not None
        else []
    )
    exact_arguments = ["mesh", "material", "MATERIAL_NAME"]
    exact_configure_call = (
        len(configure_calls) == 1
        and configure_calls[0]["positionalArguments"] == exact_arguments
        and configure_calls[0]["keywordArguments"] == []
    )
    exact_validate_call = (
        len(validate_calls) == 1
        and validate_calls[0]["positionalArguments"] == exact_arguments
        and validate_calls[0]["keywordArguments"] == []
    )
    inspector = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "inspect_prop"
        ),
        None,
    )
    inspector_reflected_imported_slot_read_lines = (
        [
            node.lineno
            for node in ast.walk(inspector)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and ast_dotted_name(node.func) == "slot.get_editor_property"
            and node.args
            and isinstance(node.args[0], ast.Constant)
            and node.args[0].value == IMPORTED_MATERIAL_SLOT_FIELD
        ]
        if inspector is not None
        else []
    )
    checks = {
        "noReflectedStaticMaterialArrayOrFieldSetters": not reflected_setters,
        "noAlternateStaticMaterialSetterMethods": not alternate_setters,
        "noDirectStaticMaterialArrayOrFieldAssignments": not direct_assignments,
        "noDottedOrDynamicImportedMaterialSlotNameRead": not (
            forbidden_dotted_or_dynamic_imported_slot_reads
        ),
        "exactOneReadOnlyReflectedImportedMaterialSlotNameRead": len(
            reflected_imported_slot_reads
        )
        == 1
        and reflected_imported_slot_reads[0]["access"]
        == "slot.get_editor_property"
        and reflected_imported_slot_reads[0]["positionalLiteral"]
        == IMPORTED_MATERIAL_SLOT_FIELD
        and reflected_imported_slot_reads[0]["keywordArguments"] == []
        and inspector_reflected_imported_slot_read_lines
        == [reflected_imported_slot_reads[0]["line"]],
        "noPythonStaticMaterialConstruction": not python_constructors,
        "noPythonStaticMaterialReferenceOrAlias": not python_static_material_references,
        "exactNativeMaterialBindingConfigureCall": exact_configure_call,
        "exactNativeMaterialBindingValidateCall": exact_validate_call,
        "helpersInsideExactPreparationWrapper": wrapper_signature
        == ["mesh", "material", "mutation_authorized"]
        and len(wrapper_configure_lines) == 1
        and len(configure_calls) == 1
        and wrapper_configure_lines[0] == configure_calls[0]["line"]
        and len(wrapper_validate_lines) == 1
        and len(validate_calls) == 1
        and wrapper_validate_lines[0] == validate_calls[0]["line"],
        "configureStrictlyMutationGuarded": len(mutation_guard_lines) == 1
        and len(wrapper_configure_lines) == 1
        and mutation_guard_lines[0] < wrapper_configure_lines[0],
        "readOnlyValidationAlwaysRunsAfterConfigure": not validation_guard_lines
        and len(wrapper_configure_lines) == 1
        and len(wrapper_validate_lines) == 1
        and wrapper_configure_lines[0] < wrapper_validate_lines[0],
    }
    status = {
        "nativeMutationFields": list(STATIC_MATERIAL_MUTATION_FIELDS),
        "readOnlyReflectedField": IMPORTED_MATERIAL_SLOT_FIELD,
        "forbiddenDottedOrDynamicImportedMaterialSlotReads": (
            forbidden_dotted_or_dynamic_imported_slot_reads
        ),
        "reflectedImportedMaterialSlotReads": reflected_imported_slot_reads,
        "inspectorReflectedImportedMaterialSlotReadLines": (
            inspector_reflected_imported_slot_read_lines
        ),
        "forbiddenPythonConstructors": python_constructors,
        "forbiddenPythonStaticMaterialReferences": python_static_material_references,
        "forbiddenReflectedSetterCalls": reflected_setters,
        "forbiddenAlternateSetterCalls": alternate_setters,
        "forbiddenDirectAssignments": direct_assignments,
        "configureHelper": configure_helper,
        "validateHelper": validate_helper,
        "configureCalls": configure_calls,
        "validateCalls": validate_calls,
        "wrapperSignature": wrapper_signature,
        "wrapperConfigureLines": wrapper_configure_lines,
        "wrapperValidateLines": wrapper_validate_lines,
        "mutationGuardLines": mutation_guard_lines,
        "validationGuardLines": validation_guard_lines,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(
            "UE 5.8 FStaticMaterial mutation must use only the guarded native "
            "configure helper, ImportedMaterialSlotName may only use the one "
            "read-only reflected inspect_prop getter, and the authoritative native "
            "read-only validator must run in both modes: "
            f"{status}"
        )
    return status


def ast_dotted_name(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        prefix = ast_dotted_name(node.value)
        return f"{prefix}.{node.attr}" if prefix else node.attr
    return ""


def validate_static_mesh_import_source(source_path: Path | None = None) -> dict:
    """Freeze the prop's FBX-to-Unreal unit correction at import time."""
    path = source_path if source_path is not None else Path(__file__).resolve()
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=path.name)
    importer = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "import_prop"
        ),
        None,
    )
    importer_signature = (
        [argument.arg for argument in importer.args.args]
        if importer is not None
        else []
    )
    main = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "main"
        ),
        None,
    )
    source_guard_call_lines = []
    unreal_module_load_lines = []
    if main is not None:
        for node in ast.walk(main):
            if not isinstance(node, ast.Call):
                continue
            call_name = ast_dotted_name(node.func)
            if call_name == "validate_static_mesh_import_source":
                if not node.args and not node.keywords:
                    source_guard_call_lines.append(node.lineno)
                else:
                    source_guard_call_lines.append(-node.lineno)
            elif call_name == "unreal.load_module":
                unreal_module_load_lines.append(node.lineno)
    scale_constant_assignments = [
        node
        for node in tree.body
        if isinstance(node, ast.Assign)
        and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == "PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE"
    ]
    exact_scale_constant = (
        len(scale_constant_assignments) == 1
        and isinstance(scale_constant_assignments[0].value, ast.Constant)
        and isinstance(scale_constant_assignments[0].value.value, (int, float))
        and not isinstance(scale_constant_assignments[0].value.value, bool)
        and float(scale_constant_assignments[0].value.value) == 0.01
    )
    mesh_options_assignments = (
        [
            node.lineno
            for node in importer.body
            if isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
            and node.targets[0].id == "mesh_options"
            and ast_dotted_name(node.value) == "options.static_mesh_import_data"
        ]
        if importer is not None
        else []
    )
    property_calls: dict[str, list[dict]] = {}
    direct_scale_assignments = []
    import_task_lines = []
    if importer is not None:
        for node in ast.walk(importer):
            if isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
                targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                if any(
                    isinstance(child, ast.Attribute)
                    and child.attr == "import_uniform_scale"
                    for target in targets
                    for child in ast.walk(target)
                ):
                    direct_scale_assignments.append(node.lineno)
            if not isinstance(node, ast.Call):
                continue
            call_name = ast_dotted_name(node.func)
            if call_name == "unreal.AssetToolsHelpers.get_asset_tools":
                import_task_lines.append(node.lineno)
            property_name = (
                node.args[0].value
                if node.args
                and isinstance(node.args[0], ast.Constant)
                and isinstance(node.args[0].value, str)
                else None
            )
            if property_name not in {
                "convert_scene",
                "convert_scene_unit",
                "import_uniform_scale",
            }:
                continue
            property_calls.setdefault(property_name, []).append(
                {
                    "call": call_name,
                    "line": node.lineno,
                    "argumentCount": len(node.args),
                    "valueExpression": (
                        ast_dotted_name(node.args[1])
                        if len(node.args) >= 2
                        else ""
                    ),
                    "literalValue": (
                        node.args[1].value
                        if len(node.args) >= 2
                        and isinstance(node.args[1], ast.Constant)
                        else None
                    ),
                    "keywordArguments": [keyword.arg for keyword in node.keywords],
                }
            )

    convert_scene_calls = property_calls.get("convert_scene", [])
    convert_scene_unit_calls = property_calls.get("convert_scene_unit", [])
    import_scale_calls = property_calls.get("import_uniform_scale", [])

    def exact_boolean_property_call(calls: list[dict]) -> bool:
        return (
            len(calls) == 1
            and calls[0]["call"] == "mesh_options.set_editor_property"
            and calls[0]["argumentCount"] == 2
            and calls[0]["literalValue"] is True
            and calls[0]["keywordArguments"] == []
        )

    exact_scale_call = (
        len(import_scale_calls) == 1
        and import_scale_calls[0]["call"]
        == "mesh_options.set_editor_property"
        and import_scale_calls[0]["argumentCount"] == 2
        and import_scale_calls[0]["valueExpression"]
        == "PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE"
        and import_scale_calls[0]["keywordArguments"] == []
    )
    ordered_lines = (
        [convert_scene_calls[0]["line"]]
        + [convert_scene_unit_calls[0]["line"]]
        + [import_scale_calls[0]["line"]]
        + import_task_lines
        if convert_scene_calls
        and convert_scene_unit_calls
        and import_scale_calls
        and len(import_task_lines) == 1
        else []
    )
    checks = {
        "exactImportPropWrapper": importer_signature == ["source", "metadata_values"],
        "exactSourceGuardCallBeforeUnrealModuleLoad": len(source_guard_call_lines)
        == 1
        and source_guard_call_lines[0] > 0
        and unreal_module_load_lines
        and source_guard_call_lines[0] < min(unreal_module_load_lines),
        "exactStaticMeshImportDataBinding": len(mesh_options_assignments) == 1,
        "exactPinnedPointZeroOneImportScaleConstant": exact_scale_constant,
        "convertSceneExplicitlyTrue": exact_boolean_property_call(
            convert_scene_calls
        ),
        "convertSceneUnitExplicitlyTrue": exact_boolean_property_call(
            convert_scene_unit_calls
        ),
        "importUniformScaleExplicitlyPointZeroOne": exact_scale_call,
        "noDirectImportScaleAssignment": not direct_scale_assignments,
        "unitCorrectionConfiguredBeforeImportTask": len(ordered_lines) == 4
        and ordered_lines == sorted(ordered_lines)
        and len(set(ordered_lines)) == 4,
    }
    status = {
        "importData": "UFbxStaticMeshImportData",
        "importUniformScale": PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE,
        "convertScene": True,
        "convertSceneUnit": True,
        "purpose": PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE,
        "runtimeScaleAuthority": False,
        "sourceGeometryChanged": False,
        "markerOrWorldScaleChanged": False,
        "expectedImportedAssetDimensionsCentimeters": list(
            EXPECTED_PROP_DIMENSIONS_CENTIMETERS
        ),
        "importerSignature": importer_signature,
        "sourceGuardCallLines": source_guard_call_lines,
        "unrealModuleLoadLines": unreal_module_load_lines,
        "meshOptionsAssignmentLines": mesh_options_assignments,
        "propertyCalls": property_calls,
        "directScaleAssignments": direct_scale_assignments,
        "importTaskLines": import_task_lines,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(
            "The prop must apply exactly 0.01 through "
            "UFbxStaticMeshImportData.ImportUniformScale with ConvertScene and "
            "ConvertSceneUnit enabled before import. This corrects the FBX-to-UE "
            f"unit boundary and is not runtime scaling: {status}"
        )
    return status


def validate_static_mesh_socket_source(source_path: Path | None = None) -> dict:
    """Require native exact-set mutation and const validation for prop sockets."""
    path = source_path if source_path is not None else Path(__file__).resolve()
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=path.name)
    configure_helper = "unreal.ShiAnimationImportLibrary.configure_exact_review_sockets"
    validate_helper = "unreal.ShiAnimationImportLibrary.validate_exact_review_sockets"
    forbidden_socket_fields = {
        "socket_name",
        "relative_location",
        "relative_rotation",
        "relative_scale",
        "tag",
    }
    forbidden_socket_methods = {
        "add_socket",
        "clear_sockets",
        "get_all_sockets",
        "get_sockets",
        "remove_socket",
        "set_socket",
        "set_sockets",
    }
    protected_array_accesses = []
    python_socket_type_references = []
    forbidden_socket_setters = []
    forbidden_socket_assignments = []
    forbidden_alternate_methods = []
    configure_calls = []
    validate_calls = []
    find_socket_calls = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute):
            dotted_name = ast_dotted_name(node)
            if dotted_name == "unreal.StaticMeshSocket":
                python_socket_type_references.append(node.lineno)
            if node.attr == "sockets":
                protected_array_accesses.append(
                    {"access": dotted_name, "line": node.lineno}
                )
        if isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                assigned_fields = sorted(
                    {
                        child.attr
                        for child in ast.walk(target)
                        if isinstance(child, ast.Attribute)
                        and child.attr in forbidden_socket_fields | {"sockets"}
                    }
                )
                if assigned_fields:
                    forbidden_socket_assignments.append(
                        {"fields": assigned_fields, "line": node.lineno}
                    )
        if not isinstance(node, ast.Call):
            continue

        function = node.func
        call_name = ast_dotted_name(function)
        property_name = (
            node.args[0].value
            if node.args
            and isinstance(node.args[0], ast.Constant)
            and isinstance(node.args[0].value, str)
            else None
        )
        if (
            isinstance(function, ast.Attribute)
            and function.attr in {"get_editor_property", "set_editor_property"}
            and property_name == "sockets"
        ) or (
            call_name in {"getattr", "setattr", "delattr"}
            and len(node.args) >= 2
            and isinstance(node.args[1], ast.Constant)
            and node.args[1].value == "sockets"
        ):
            protected_array_accesses.append({"access": call_name, "line": node.lineno})
        if (
            isinstance(function, ast.Attribute)
            and function.attr == "set_editor_property"
            and property_name in forbidden_socket_fields
        ):
            forbidden_socket_setters.append(
                {"field": property_name, "line": node.lineno}
            )
        if (
            isinstance(function, ast.Attribute)
            and function.attr in forbidden_socket_methods
        ):
            forbidden_alternate_methods.append(
                {"method": function.attr, "line": node.lineno}
            )
        call_receipt = {
            "line": node.lineno,
            "positionalArguments": [ast_dotted_name(arg) for arg in node.args],
            "keywordArguments": [keyword.arg for keyword in node.keywords],
        }
        if call_name == configure_helper:
            configure_calls.append(call_receipt)
        elif call_name == validate_helper:
            validate_calls.append(call_receipt)
        elif isinstance(function, ast.Attribute) and function.attr == "find_socket":
            find_socket_calls.append(call_receipt)

    wrapper = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "prepare_exact_review_sockets"
        ),
        None,
    )
    wrapper_signature = (
        [argument.arg for argument in wrapper.args.args] if wrapper is not None else []
    )
    wrapper_configure_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.Call)
            and ast_dotted_name(node.func) == configure_helper
        ]
        if wrapper is not None
        else []
    )
    wrapper_validate_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.Call)
            and ast_dotted_name(node.func) == validate_helper
        ]
        if wrapper is not None
        else []
    )
    mutation_guard_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.If)
            and isinstance(node.test, ast.Name)
            and node.test.id == "mutation_authorized"
            and any(
                isinstance(child, ast.Call)
                and ast_dotted_name(child.func) == configure_helper
                for child in ast.walk(node)
            )
        ]
        if wrapper is not None
        else []
    )
    validation_guard_lines = (
        [
            node.lineno
            for node in ast.walk(wrapper)
            if isinstance(node, ast.If)
            and any(
                isinstance(child, ast.Call)
                and ast_dotted_name(child.func) == validate_helper
                for child in ast.walk(node)
            )
        ]
        if wrapper is not None
        else []
    )
    ordered_contract_assignments = {}
    if wrapper is not None:
        for node in wrapper.body:
            if (
                isinstance(node, ast.Assign)
                and len(node.targets) == 1
                and isinstance(node.targets[0], ast.Name)
                and node.targets[0].id in {"names", "locations", "rotations", "tags"}
            ):
                ordered_contract_assignments[node.targets[0].id] = node.value

    def exact_marker_order_comprehension(node: ast.AST | None) -> bool:
        return (
            isinstance(node, ast.ListComp)
            and len(node.generators) == 1
            and isinstance(node.generators[0].target, ast.Name)
            and node.generators[0].target.id == "marker_id"
            and ast_dotted_name(node.generators[0].iter) == "MARKER_IDS"
            and not node.generators[0].ifs
            and node.generators[0].is_async == 0
        )

    inspector = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "inspect_known_review_sockets"
        ),
        None,
    )
    inspector_signature = (
        [argument.arg for argument in inspector.args.args]
        if inspector is not None
        else []
    )
    inspector_find_lines = (
        [
            node.lineno
            for node in ast.walk(inspector)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "find_socket"
        ]
        if inspector is not None
        else []
    )
    main = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "main"
        ),
        None,
    )
    main_calls: dict[str, list[int]] = {}
    if main is not None:
        for node in ast.walk(main):
            if isinstance(node, ast.Call):
                main_calls.setdefault(ast_dotted_name(node.func), []).append(
                    node.lineno
                )
    preparation_lines = main_calls.get("prepare_exact_review_sockets", [])
    prop_authoring_lines = main_calls.get("import_prop", [])
    prop_inspection_lines = main_calls.get("inspect_prop", [])
    exact_helper_arguments = ["mesh", "names", "locations", "rotations", "tags"]
    checks = {
        "noProtectedSocketArrayReadWriteOrEnumeration": not protected_array_accesses,
        "noPythonStaticMeshSocketTypeReferenceOrConstruction": not python_socket_type_references,
        "noPythonSocketFieldSetters": not forbidden_socket_setters,
        "noDirectPythonSocketFieldAssignments": not forbidden_socket_assignments,
        "noAlternatePythonSocketMutationOrEnumerationMethods": not forbidden_alternate_methods,
        "exactNativeConfigureHelperCall": len(configure_calls) == 1
        and configure_calls[0]["positionalArguments"] == exact_helper_arguments
        and configure_calls[0]["keywordArguments"] == [],
        "exactNativeConstValidateHelperCall": len(validate_calls) == 1
        and validate_calls[0]["positionalArguments"] == exact_helper_arguments
        and validate_calls[0]["keywordArguments"] == [],
        "helpersInsideExactPreparationWrapper": wrapper_signature
        == ["mesh", "marker_contract", "mutation_authorized"]
        and wrapper_configure_lines == [configure_calls[0]["line"]]
        if len(configure_calls) == 1
        else False,
        "validatorInsideExactPreparationWrapper": wrapper_signature
        == ["mesh", "marker_contract", "mutation_authorized"]
        and wrapper_validate_lines == [validate_calls[0]["line"]]
        if len(validate_calls) == 1
        else False,
        "configureStrictlyMutationGuarded": len(mutation_guard_lines) == 1
        and wrapper_configure_lines
        and mutation_guard_lines[0] < wrapper_configure_lines[0],
        "constValidationAlwaysRunsAfterConfiguration": not validation_guard_lines
        and len(wrapper_configure_lines) == 1
        and len(wrapper_validate_lines) == 1
        and wrapper_configure_lines[0] < wrapper_validate_lines[0],
        "allNativeArraysUseFrozenMarkerOrder": set(ordered_contract_assignments)
        == {"names", "locations", "rotations", "tags"}
        and all(
            exact_marker_order_comprehension(ordered_contract_assignments[name])
            for name in ("names", "locations", "rotations", "tags")
        ),
        "exactIndependentFindSocketReadback": len(find_socket_calls) == 1
        and find_socket_calls[0]["positionalArguments"] == ["socket_name"]
        and find_socket_calls[0]["keywordArguments"] == []
        and inspector_signature == ["mesh"]
        and inspector_find_lines == [find_socket_calls[0]["line"]],
        "preparationFollowsImportAndPrecedesInspection": len(preparation_lines) == 1
        and len(prop_authoring_lines) == 1
        and len(prop_inspection_lines) == 1
        and prop_authoring_lines[0] < preparation_lines[0] < prop_inspection_lines[0],
    }
    status = {
        "protectedNativeOnlyProperty": "UStaticMesh.Sockets",
        "configureHelper": configure_helper,
        "validateHelper": validate_helper,
        "forbiddenProtectedArrayAccesses": protected_array_accesses,
        "forbiddenPythonSocketTypeReferences": python_socket_type_references,
        "forbiddenSocketFieldSetters": forbidden_socket_setters,
        "forbiddenSocketFieldAssignments": forbidden_socket_assignments,
        "forbiddenAlternateMethods": forbidden_alternate_methods,
        "configureCalls": configure_calls,
        "validateCalls": validate_calls,
        "findSocketCalls": find_socket_calls,
        "wrapperSignature": wrapper_signature,
        "wrapperConfigureLines": wrapper_configure_lines,
        "wrapperValidateLines": wrapper_validate_lines,
        "mutationGuardLines": mutation_guard_lines,
        "validationGuardLines": validation_guard_lines,
        "orderedContractAssignments": sorted(ordered_contract_assignments),
        "inspectorSignature": inspector_signature,
        "inspectorFindLines": inspector_find_lines,
        "mainPreparationLines": preparation_lines,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(
            "UE 5.8 UStaticMesh.Sockets is native-only: exact-set mutation must "
            "use the guarded native helper, const native validation must always "
            "run, and Python may inspect only the three known names with "
            f"find_socket: {status}"
        )
    return status


def validate_runtime_admission_source(source_path: Path | None = None) -> dict:
    """Lock the reflected UE 5.8 collision and compressed-pose API contract."""
    path = source_path if source_path is not None else Path(__file__).resolve()
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=path.name)
    calls: dict[str, list[int]] = {}
    attribute_reads: dict[str, list[int]] = {}
    compressed_assignments = []
    navigation_readbacks = []
    imported_material_slot_reflected_readbacks = []

    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute):
            attribute_reads.setdefault(ast_dotted_name(node), []).append(node.lineno)
        if isinstance(node, ast.Call):
            call_name = ast_dotted_name(node.func)
            calls.setdefault(call_name, []).append(node.lineno)
            if (
                call_name.endswith(".get_editor_property")
                and node.args
                and isinstance(node.args[0], ast.Constant)
                and node.args[0].value == "has_navigation_data"
            ):
                navigation_readbacks.append(node.lineno)
            if (
                call_name == "slot.get_editor_property"
                and len(node.args) == 1
                and isinstance(node.args[0], ast.Constant)
                and node.args[0].value == IMPORTED_MATERIAL_SLOT_FIELD
                and not node.keywords
            ):
                imported_material_slot_reflected_readbacks.append(node.lineno)
        if (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and ast_dotted_name(node.targets[0]) == "options.evaluation_type"
            and ast_dotted_name(node.value) == "unreal.AnimDataEvalType.COMPRESSED"
        ):
            compressed_assignments.append(node.lineno)

    material_configure_helper = (
        "unreal.ShiAnimationImportLibrary.configure_exact_single_material_binding"
    )
    material_validate_helper = (
        "unreal.ShiAnimationImportLibrary.validate_exact_single_material_binding"
    )
    collision_helper = (
        "unreal.ShiAnimationImportLibrary." "prepare_collisionless_review_static_mesh"
    )
    compression_helper = "unreal.ShiAnimationImportLibrary.prepare_compressed_sequence"
    collision_enum = "unreal.CollisionTraceFlag.CTF_USE_SIMPLE_AS_COMPLEX"
    main = next(
        (
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "main"
        ),
        None,
    )
    main_calls: dict[str, list[int]] = {}
    if main is not None:
        for node in ast.walk(main):
            if isinstance(node, ast.Call):
                main_calls.setdefault(ast_dotted_name(node.func), []).append(
                    node.lineno
                )

    material_prepare_lines = main_calls.get(
        "prepare_exact_single_material_binding", []
    )
    collision_prepare_lines = main_calls.get(
        "prepare_collisionless_review_static_mesh", []
    )
    compression_prepare_lines = main_calls.get("prepare_compressed_animation", [])
    prop_authoring_lines = main_calls.get("import_prop", [])
    animation_authoring_lines = main_calls.get("import_animation", [])
    prop_inspection_lines = main_calls.get("inspect_prop", [])
    animation_inspection_lines = main_calls.get("inspect_animation", [])
    material_slot_reads = attribute_reads.get("slot.material_slot_name", [])
    material_interface_reads = attribute_reads.get("slot.material_interface", [])
    dotted_imported_material_slot_reads = attribute_reads.get(
        f"slot.{IMPORTED_MATERIAL_SLOT_FIELD}", []
    )
    collision_enum_reads = attribute_reads.get(collision_enum, [])
    sample_evaluation_lines = calls.get("sequence.get_anim_pose_at_frame", [])

    checks = {
        "exactMaterialBindingConfigureCppHelperCall": len(
            calls.get(material_configure_helper, [])
        )
        == 1,
        "exactMaterialBindingValidateCppHelperCall": len(
            calls.get(material_validate_helper, [])
        )
        == 1,
        "exactCollisionlessCppHelperCall": len(calls.get(collision_helper, [])) == 1,
        "exactCompressionCppHelperCall": len(calls.get(compression_helper, [])) == 1,
        "exactSafeMaterialSlotAndInterfaceReadback": len(material_slot_reads) == 1
        and len(material_interface_reads) == 1,
        "noDottedImportedMaterialSlotReadback": not dotted_imported_material_slot_reads,
        "exactOneReadOnlyReflectedImportedMaterialSlotReadback": len(
            imported_material_slot_reflected_readbacks
        )
        == 1,
        "exactNavigationFlagReadback": len(navigation_readbacks) == 1,
        "collisionComplexityReadbackPresent": len(
            calls.get("subsystem.get_collision_complexity", [])
        )
        == 1,
        "collisionComplexityFailClosedTokenPresent": len(collision_enum_reads) >= 2,
        "explicitCompressedEvaluationAssignment": len(compressed_assignments) == 1,
        "compressedEvaluationAssignedBeforeSampling": len(compressed_assignments) == 1
        and len(sample_evaluation_lines) == 1
        and compressed_assignments[0] < sample_evaluation_lines[0],
        "collisionHelperPrecedesPropInspection": len(collision_prepare_lines) == 1
        and len(prop_inspection_lines) == 1
        and collision_prepare_lines[0] < prop_inspection_lines[0],
        "collisionHelperFollowsPropAuthoring": len(prop_authoring_lines) == 1
        and len(collision_prepare_lines) == 1
        and prop_authoring_lines[0] < collision_prepare_lines[0],
        "materialHelperFollowsPropAuthoring": len(prop_authoring_lines) == 1
        and len(material_prepare_lines) == 1
        and prop_authoring_lines[0] < material_prepare_lines[0],
        "materialHelperPrecedesCollisionHelper": len(material_prepare_lines) == 1
        and len(collision_prepare_lines) == 1
        and material_prepare_lines[0] < collision_prepare_lines[0],
        "materialHelperPrecedesPropInspection": len(material_prepare_lines) == 1
        and len(prop_inspection_lines) == 1
        and material_prepare_lines[0] < prop_inspection_lines[0],
        "compressionHelperPrecedesAnimationInspection": len(compression_prepare_lines)
        == 1
        and len(animation_inspection_lines) == 1
        and compression_prepare_lines[0] < animation_inspection_lines[0],
        "compressionHelperFollowsAnimationNormalization": len(animation_authoring_lines)
        == 1
        and len(compression_prepare_lines) == 1
        and animation_authoring_lines[0] < compression_prepare_lines[0],
    }
    status = {
        "api": {
            "materialConfigureHelper": material_configure_helper,
            "materialValidateHelper": material_validate_helper,
            "collisionHelper": collision_helper,
            "compressionHelper": compression_helper,
            "collisionComplexity": collision_enum,
            "compressedEvaluation": "unreal.AnimDataEvalType.COMPRESSED",
        },
        "locations": {
            "materialConfigureHelperCalls": calls.get(
                material_configure_helper, []
            ),
            "materialValidateHelperCalls": calls.get(material_validate_helper, []),
            "collisionHelperCalls": calls.get(collision_helper, []),
            "compressionHelperCalls": calls.get(compression_helper, []),
            "materialSlotReads": material_slot_reads,
            "materialInterfaceReads": material_interface_reads,
            "dottedImportedMaterialSlotReads": dotted_imported_material_slot_reads,
            "reflectedImportedMaterialSlotReads": (
                imported_material_slot_reflected_readbacks
            ),
            "navigationFlagReads": navigation_readbacks,
            "collisionComplexityReads": calls.get(
                "subsystem.get_collision_complexity", []
            ),
            "propAuthoringCalls": prop_authoring_lines,
            "materialPreparationCallsInMain": material_prepare_lines,
            "collisionPreparationCallsInMain": collision_prepare_lines,
            "propInspectionCalls": prop_inspection_lines,
            "animationAuthoringCalls": animation_authoring_lines,
            "compressionPreparationCallsInMain": compression_prepare_lines,
            "animationInspectionCalls": animation_inspection_lines,
            "compressedEvaluationAssignments": compressed_assignments,
            "compressedSampleEvaluations": sample_evaluation_lines,
        },
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(
            "The frozen UE 5.8 collision/navigation or compressed-pose API "
            f"contract regressed: {status}"
        )
    return status


def validate_source_contract(repository: Path) -> dict:
    metrics, metric_receipts, metrics_receipt = load_json_manifest(
        repository, METRICS_RELATIVE_PATH
    )
    validation, validation_receipts, validation_receipt = load_json_manifest(
        repository, VALIDATION_RELATIVE_PATH
    )
    provenance, provenance_receipts, provenance_receipt = load_json_manifest(
        repository, PROVENANCE_RELATIVE_PATH
    )

    source_paths = {
        "propFbx": repository / PROP_SOURCE_RELATIVE_PATH,
        "animationFbx": repository / ANIMATION_SOURCE_RELATIVE_PATH,
    }
    for role, path in source_paths.items():
        if not path.is_file():
            raise FileNotFoundError(f"Missing validated Gate 5A {role}: {path}")
    sources = {
        role: file_receipt(path, repository) for role, path in source_paths.items()
    }

    contract = metrics.get("interactionContract")
    if not isinstance(contract, dict):
        raise RuntimeError("Metrics omit the exact interactionContract object")
    prop = contract.get("prop", {})
    skeleton = contract.get("skeleton", {})
    animation = contract.get("animation", {})
    root = animation.get("rootStationary", {})
    contact = animation.get("contact", {})
    markers = prop.get("markers", {})

    expected_semantic_samples = [dict(item) for item in SEMANTIC_SAMPLES]
    validation_passed = (
        validation.get("passed") is True or validation.get("status") == "pass"
    )
    validation_checks = validation.get("checks", {})
    validation_review_status = validation.get("reviewStatus", {})
    metrics_review_status = metrics.get("reviewStatus", {})
    review_status = provenance.get("reviewStatus", {})
    authority = provenance.get("authorityBoundary", {})
    authorship = provenance.get("authorship", {})
    contact_receipt = metrics.get("contactReceipt", {})
    visible_mesh_contact = contact_receipt.get("visibleMeshContactProxy", {})
    metrics_story = metrics.get("storyContinuity", {})
    provenance_story = provenance.get("storyContinuity", {})
    metrics_timing = metrics.get("timingBoundary", {})
    provenance_timing = provenance.get("timingBoundary", {})
    metrics_watched_decision = metrics.get("watchedSourceVisualDecision", {})
    validation_watched_decision = validation.get("watchedSourceVisualDecision", {})
    provenance_watched_decision = provenance.get("reviewDecisions", {}).get(
        "watchedSourceVisual", {}
    )
    checks = {
        "metricsAssetId": metrics.get("assetId") == ASSET_ID,
        "validationAssetId": validation.get("assetId") == ASSET_ID,
        "provenanceAssetId": provenance.get("assetId") == ASSET_ID,
        "sourceValidationPassed": validation_passed,
        "allNamedSourceValidationChecksPassed": isinstance(validation_checks, dict)
        and len(validation_checks) == EXPECTED_VALIDATION_CHECK_COUNT
        and all(value is True for value in validation_checks.values()),
        "exactPinnedMetricsReceipt": exact_pinned_receipt(
            METRICS_RELATIVE_PATH, metrics_receipt
        ),
        "exactPinnedValidationReceipt": exact_pinned_receipt(
            VALIDATION_RELATIVE_PATH, validation_receipt
        ),
        "exactPinnedProvenanceReceipt": exact_pinned_receipt(
            PROVENANCE_RELATIVE_PATH, provenance_receipt
        ),
        "exactPinnedFbxReceipts": exact_pinned_receipt(
            PROP_SOURCE_RELATIVE_PATH, sources["propFbx"]
        )
        and exact_pinned_receipt(
            ANIMATION_SOURCE_RELATIVE_PATH, sources["animationFbx"]
        ),
        "validationBindsExactPinnedMetricsAndProvenance": exact_receipt_in_manifest(
            validation_receipts, METRICS_RELATIVE_PATH, metrics_receipt
        )
        and exact_receipt_in_manifest(
            validation_receipts, PROVENANCE_RELATIVE_PATH, provenance_receipt
        ),
        "exactSourceReceiptsInMetrics": all(
            exact_receipt_in_manifest(metric_receipts, receipt["file"], receipt)
            for receipt in sources.values()
        ),
        "exactSourceReceiptsInValidation": all(
            exact_receipt_in_manifest(validation_receipts, receipt["file"], receipt)
            for receipt in sources.values()
        ),
        "exactSourceReceiptsInProvenance": all(
            exact_receipt_in_manifest(provenance_receipts, receipt["file"], receipt)
            for receipt in sources.values()
        ),
        "exactPropEnvelope32By14By2Centimeters": exact_numeric_vector(
            prop.get("dimensionsCentimeters"), EXPECTED_PROP_DIMENSIONS_CENTIMETERS
        ),
        "centeredPropOrigin": prop.get("origin") == "center",
        "exactSourceToUnrealHandednessConversion": exact_numeric_vector(
            prop.get("sourceToUnrealAxisScale"), (1.0, -1.0, 1.0)
        ),
        "exactThreeNamedMarkers": prop.get("markerIds") == list(MARKER_IDS)
        and isinstance(markers, dict)
        and set(markers) == set(MARKER_IDS)
        and all(
            finite_numeric_vector(
                markers[marker].get("sourcePositionXYZCentimeters"), 3
            )
            and finite_numeric_vector(
                markers[marker].get("unrealPositionXYZCentimeters"), 3
            )
            and finite_numeric_vector(markers[marker].get("rotationDegrees"), 3)
            and exact_numeric_vector(
                markers[marker].get("sourcePositionXYZCentimeters"),
                EXPECTED_MARKER_TRANSFORMS[marker]["sourcePositionXYZCentimeters"],
            )
            and exact_numeric_vector(
                markers[marker].get("unrealPositionXYZCentimeters"),
                EXPECTED_MARKER_TRANSFORMS[marker]["unrealPositionXYZCentimeters"],
            )
            and exact_numeric_vector(
                markers[marker].get("sourceRotationXYZDegrees"),
                EXPECTED_MARKER_TRANSFORMS[marker]["sourceRotationXYZDegrees"],
            )
            and exact_numeric_vector(
                markers[marker].get("rotationDegrees"),
                EXPECTED_MARKER_TRANSFORMS[marker]["rotationDegrees"],
            )
            and exact_numeric_vector(
                markers[marker].get("unrealQuaternionXYZW"),
                EXPECTED_MARKER_TRANSFORMS[marker]["unrealQuaternionXYZW"],
            )
            and markers[marker].get("rotationOrder") == "Unreal-FRotator-Pitch-Yaw-Roll"
            for marker in MARKER_IDS
        ),
        "wristMarkersAreExplicitExternalAlignmentFrames": all(
            markers[marker].get("frameKind") == "external-wrist-alignment"
            for marker in (
                "wet-register-left-support",
                "wet-register-right-contact",
            )
        )
        and markers["wet-register-camera-readability"].get("frameKind")
        == "camera-readability"
        and prop.get("markerFramePolicy")
        == "external-wrist-alignment-keeps-hand-skin-outside-volume",
        "noPropCollisionNavigationPhysicsOrInput": prop.get("collision") is False
        and prop.get("navigation") is False
        and prop.get("physics") is False
        and prop.get("input") is False,
        "exactSharedSkeletonContract": skeleton.get("boneCount") == len(BONE_NAMES)
        and skeleton.get("boneNames") == list(BONE_NAMES),
        "exact121SampleFourSecondContract": animation.get("sourceFrameFirst") == 1
        and animation.get("sourceFrameLast") == 121
        and animation.get("sampleFirst") == 0
        and animation.get("sampleLast") == 120
        and animation.get("sampleCount") == EXPECTED_SAMPLES
        and exact_float(animation.get("framesPerSecond"), EXPECTED_FRAMES_PER_SECOND)
        and exact_float(animation.get("durationSeconds"), EXPECTED_SECONDS),
        "nonLoopingDeterministicAnimation": animation.get("looping") is False
        and animation.get("deterministic") is True,
        "allSourceTransformsFinite": animation.get("allTransformsFinite") is True,
        "rootStationaryExactZero": isinstance(root, dict)
        and exact_float(root.get("maximumTranslationCentimeters"), 0.0)
        and exact_float(root.get("maximumYawDegrees"), 0.0)
        and exact_float(contact_receipt.get("rootMaximumTranslationCentimeters"), 0.0)
        and exact_float(contact_receipt.get("rootMaximumYawDegrees"), 0.0),
        "armChainScaleExactlyOne": animation.get("armChainScaleExactlyOne") is True
        and contact_receipt.get("armChainScaleExactlyOne") is True
        and exact_float(contact_receipt.get("armChainScaleMinimum"), 1.0)
        and exact_float(contact_receipt.get("armChainScaleMaximum"), 1.0),
        "exactFiveSemanticSamples": normalized_semantic_samples(
            animation.get("semanticSamples")
        )
        == expected_semantic_samples,
        "exactMeasuredLeftSupport": exact_float(
            contact.get("leftMaximumDriftCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["leftMaximumDriftCentimeters"],
            1.0e-12,
        )
        and exact_float(
            contact.get("leftMaximumAngularDriftDegrees"),
            EXPECTED_CONTACT_MEASUREMENTS["leftMaximumAngularDriftDegrees"],
            1.0e-12,
        )
        and exact_float(
            contact.get("leftSupportMaximumFloatingCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["leftSupportMaximumFloatingCentimeters"],
            1.0e-12,
        )
        and exact_float(
            visible_mesh_contact.get("leftSupportMaximumFloatingCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["leftSupportMaximumFloatingCentimeters"],
            1.0e-12,
        ),
        "rightContactAcquiresHoldsAndReleasesExactlyOnce": contact.get(
            "rightAcquisitionCount"
        )
        == 1
        and contact.get("rightReleaseCount") == 1
        and contact.get("rightAcquisitionSample") == 30
        and contact.get("orderedReleasePhaseOnsetSample")
        == EXPECTED_ORDERED_RELEASE_PHASE_ONSET_SAMPLE
        and contact.get("rightReleaseSample") == EXPECTED_RIGHT_CONTACT_EXIT_SAMPLE
        and contact.get("rightContactExitSample")
        == EXPECTED_RIGHT_CONTACT_EXIT_SAMPLE
        and contact.get("rightContinuousThroughHold") is True,
        "exactMeasuredConservativeContact": exact_float(
            contact.get("maximumPenetrationCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["maximumPenetrationCentimeters"],
            1.0e-12,
        )
        and exact_float(
            contact.get("maximumFloatingCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["maximumFloatingCentimeters"],
            1.0e-12,
        )
        and exact_float(
            visible_mesh_contact.get("maximumPenetrationCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["maximumPenetrationCentimeters"],
            1.0e-12,
        )
        and exact_float(
            visible_mesh_contact.get("maximumFloatingCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["maximumFloatingCentimeters"],
            1.0e-12,
        )
        and visible_mesh_contact.get("passedRejectionThresholds") is True
        and visible_mesh_contact.get("visibleHandMeshReview") is False
        and len(visible_mesh_contact.get("sampledSourceFrames", []))
        == EXPECTED_SAMPLES,
        "exactMeasuredContactReceipt": contact_receipt.get("sampledFrames")
        == EXPECTED_SAMPLES
        and exact_float(
            contact_receipt.get("leftMaximumDriftCentimeters"),
            EXPECTED_CONTACT_MEASUREMENTS["leftMaximumDriftCentimeters"],
            1.0e-12,
        )
        and exact_float(
            contact_receipt.get("leftMaximumAngularDriftDegrees"),
            EXPECTED_CONTACT_MEASUREMENTS["leftMaximumAngularDriftDegrees"],
            1.0e-12,
        )
        and contact_receipt.get("rightAcquisitionSample") == 30
        and contact_receipt.get("orderedReleasePhaseOnsetSample")
        == EXPECTED_ORDERED_RELEASE_PHASE_ONSET_SAMPLE
        and contact_receipt.get("rightReleaseSample")
        == EXPECTED_RIGHT_CONTACT_EXIT_SAMPLE
        and contact_receipt.get("rightContactExitSample")
        == EXPECTED_RIGHT_CONTACT_EXIT_SAMPLE
        and contact_receipt.get("rightContinuousThroughHold") is True
        and contact_receipt.get("heldBoundaryInterpolation", {}).get("passed")
        is True
        and exact_float(
            contact_receipt.get("heldBoundaryInterpolation", {}).get(
                "firstSourceFrame"
            ),
            HELD_BOUNDARY_FIRST_SOURCE_FRAME,
        )
        and exact_float(
            contact_receipt.get("heldBoundaryInterpolation", {}).get(
                "lastSourceFrameInclusive"
            ),
            HELD_BOUNDARY_LAST_SOURCE_FRAME,
        )
        and contact_receipt.get("heldBoundaryInterpolation", {}).get(
            "sampledPoints"
        )
        == HELD_BOUNDARY_SAMPLED_POINTS
        and contact_receipt.get("heldBoundaryInterpolation", {}).get(
            "maximumRightDistanceCentimeters", float("inf")
        )
        <= HELD_BOUNDARY_AUTHORING_RESERVE_CENTIMETERS,
        "exactStoryContinuityBoundary": metrics_story == EXPECTED_STORY_CONTINUITY
        and provenance_story == EXPECTED_STORY_CONTINUITY,
        "exactSilentTimingBoundary": metrics_timing == EXPECTED_TIMING_BOUNDARY
        and provenance_timing == EXPECTED_TIMING_BOUNDARY,
        "conditionalEngineeringDecisionOnly": metrics_watched_decision
        == provenance_watched_decision
        and validation_watched_decision == metrics_watched_decision
        and metrics_watched_decision.get("decision") == "conditional-engineering-accept"
        and metrics_watched_decision.get("retainedUse")
        == "bounded source/interchange engineering interaction candidate only",
        "allVisualHumanEngineReviewGatesRemainFalse": all(
            metrics_review_status.get(key) is False and review_status.get(key) is False
            for key in REQUIRED_FALSE_REVIEW_GATES
        )
        and validation_review_status.get("sourceEngineeringValidation") is True
        and validation_review_status.get("visibleHandMeshReview") is False
        and validation_review_status.get("engineAdmission") is False
        and validation_review_status.get("humanHistoricalCulturalApproval") is False
        and validation_review_status.get("finalProp") is False
        and validation_review_status.get("finalHandAnimation") is False,
        "deterministicNonNeuralSourceAuthorship": isinstance(
            authorship.get("method"), str
        )
        and bool(authorship["method"].strip())
        and authorship.get("neuralGeneration") is False
        and authorship.get("generatedImagePixelsSampled") is False
        and authorship.get("privateReferencePixelsSampled") is False,
        "noSourceGameplayAuthority": all(
            authority.get(key) is False
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
    }
    status = {
        "metrics": metrics_receipt,
        "validation": validation_receipt,
        "provenance": provenance_receipt,
        "sources": sources,
        "interactionContract": contract,
        "contactReceipt": {
            "sampledFrames": contact_receipt.get("sampledFrames"),
            "leftMaximumDriftCentimeters": contact_receipt.get(
                "leftMaximumDriftCentimeters"
            ),
            "leftMaximumAngularDriftDegrees": contact_receipt.get(
                "leftMaximumAngularDriftDegrees"
            ),
            "rootMaximumTranslationCentimeters": contact_receipt.get(
                "rootMaximumTranslationCentimeters"
            ),
            "rootMaximumYawDegrees": contact_receipt.get("rootMaximumYawDegrees"),
            "armChainScaleMinimum": contact_receipt.get("armChainScaleMinimum"),
            "armChainScaleMaximum": contact_receipt.get("armChainScaleMaximum"),
            "visibleMeshContactProxy": {
                "sampledSourceFrames": visible_mesh_contact.get("sampledSourceFrames"),
                "maximumPenetrationCentimeters": visible_mesh_contact.get(
                    "maximumPenetrationCentimeters"
                ),
                "maximumFloatingCentimeters": visible_mesh_contact.get(
                    "maximumFloatingCentimeters"
                ),
                "leftSupportMaximumFloatingCentimeters": visible_mesh_contact.get(
                    "leftSupportMaximumFloatingCentimeters"
                ),
                "passedRejectionThresholds": visible_mesh_contact.get(
                    "passedRejectionThresholds"
                ),
                "visibleHandMeshReview": visible_mesh_contact.get(
                    "visibleHandMeshReview"
                ),
            },
        },
        "storyContinuity": metrics_story,
        "timingBoundary": metrics_timing,
        "watchedSourceVisualDecision": metrics_watched_decision,
        "reviewStatus": metrics_review_status,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        failed = sorted(name for name, passed in checks.items() if not passed)
        raise RuntimeError(f"Gate 5A source contract drifted: {failed}")
    return status


def interaction_metadata(source_contract: dict) -> dict[str, str]:
    """Bind reviewed contact/marker observations into all three isolated assets."""
    contract = source_contract["interactionContract"]
    contact_receipt = {
        "contact": contract["animation"]["contact"],
        "markerFramePolicy": contract["prop"]["markerFramePolicy"],
        "markers": contract["prop"]["markers"],
    }
    return METADATA | {
        "SHI.ContactContract": json.dumps(
            contact_receipt, separators=(",", ":"), sort_keys=True
        ),
        "SHI.StoryContinuity": json.dumps(
            source_contract["storyContinuity"],
            separators=(",", ":"),
            sort_keys=True,
        ),
        "SHI.SilentTimingBoundary": json.dumps(
            source_contract["timingBoundary"],
            separators=(",", ":"),
            sort_keys=True,
        ),
        "SHI.SourceVisualDecision": source_contract["watchedSourceVisualDecision"][
            "decision"
        ],
    }


def package_disk_root(project_dir: Path, destination: str) -> Path:
    relative = destination.removeprefix("/Game/")
    return project_dir / "Content" / Path(relative)


def validate_accepted_package(
    repository: Path,
    project_dir: Path,
    label: str,
    destination: str,
    evidence_relative_path: str,
) -> dict:
    evidence_path = repository / evidence_relative_path
    if not evidence_path.is_file():
        raise FileNotFoundError(f"Missing accepted {label} evidence: {evidence_path}")
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    disk_root = package_disk_root(project_dir, destination)
    disk_receipts = relative_file_receipts(disk_root)
    accepted_receipts = evidence.get("trackedUnrealAssets", {}).get("receipts", {})
    registry_assets = sorted(
        unreal.EditorAssetLibrary.list_assets(destination, recursive=True)
    )
    checks = {
        "acceptedEvidencePassed": evidence.get("mode") == "import-replace"
        and evidence.get("passed") is True,
        "nonEmptyAcceptedReceiptSet": bool(accepted_receipts),
        "exactAcceptedDiskReceipts": disk_receipts == accepted_receipts,
        "nonEmptyAcceptedRegistryInventory": bool(registry_assets),
        "isolatedFromGate5Destination": destination != DESTINATION
        and not destination.startswith(f"{DESTINATION}/")
        and not DESTINATION.startswith(f"{destination}/"),
    }
    status = {
        "label": label,
        "destination": destination,
        "evidence": file_receipt(evidence_path, repository),
        "diskRoot": str(disk_root.relative_to(repository)).replace("\\", "/"),
        "diskReceipts": disk_receipts,
        "registryAssets": registry_assets,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(f"Accepted {label} baseline drifted: {checks}")
    return status


def skeleton_reference_pose_receipt(skeleton) -> dict:
    pose = skeleton.get_reference_pose()
    bones = [str(name) for name in pose.get_bone_names()]
    transforms = []
    for bone_name in bones:
        transform = pose.get_ref_bone_pose(bone_name, unreal.AnimPoseSpaces.LOCAL)
        transforms.append({"bone": bone_name, **transform_components(transform)})
    payload = json.dumps(transforms, separators=(",", ":"), sort_keys=True).encode(
        "utf-8"
    )
    return {
        "boneNames": bones,
        "boneCount": len(bones),
        "transformsSha256": hashlib.sha256(payload).hexdigest(),
    }


def validate_shared_skeleton(project_dir: Path) -> tuple[Any, dict]:
    skeleton = unreal.EditorAssetLibrary.load_asset(SHARED_SKELETON_PATH)
    if not isinstance(skeleton, unreal.Skeleton):
        raise RuntimeError(
            f"Accepted shared Skeleton is missing: {SHARED_SKELETON_PATH}"
        )
    skeleton_file = (
        package_disk_root(project_dir, SHARED_SKELETON_DESTINATION)
        / f"{SHARED_SKELETON_NAME}.uasset"
    )
    if not skeleton_file.is_file():
        raise FileNotFoundError(f"Shared Skeleton package is missing: {skeleton_file}")
    pose = skeleton_reference_pose_receipt(skeleton)
    checks = {
        "exactObjectPath": skeleton.get_path_name()
        == f"{SHARED_SKELETON_PATH}.{SHARED_SKELETON_NAME}",
        "exact53BoneHierarchy": pose["boneNames"] == list(BONE_NAMES)
        and pose["boneCount"] == 53,
        "exactSharedSkeletonPackageExists": skeleton_file.stat().st_size > 0,
    }
    status = {
        "objectPath": skeleton.get_path_name(),
        "package": file_receipt(skeleton_file, project_dir.parents[1]),
        "referencePose": pose,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(f"Shared Skeleton contract drifted: {checks}")
    return skeleton, status


def create_asset(name: str, asset_class, factory):
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        name, DESTINATION, asset_class, factory
    )
    if not asset:
        raise RuntimeError(f"Could not create exact isolated asset: {asset_path(name)}")
    return asset


def material_expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material,
        expression_class.static_class(),
        node_pos_x=x,
        node_pos_y=y,
    )
    if not node:
        raise RuntimeError(
            f"Could not create {expression_class} in {object_path(MATERIAL_NAME)}"
        )
    node.set_editor_property("desc", description)
    return node


def connect_material_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(
        source, output_name, material_property
    ):
        raise RuntimeError(f"Could not connect clay node to {material_property}")


def author_material():
    material = create_asset(MATERIAL_NAME, unreal.Material, unreal.MaterialFactoryNew())
    unreal.MaterialEditingLibrary.delete_all_material_expressions(material)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property(
        "shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT
    )
    material.set_editor_property("two_sided", False)
    material.set_editor_property("use_material_attributes", False)

    color = material_expression(
        material,
        unreal.MaterialExpressionVectorParameter,
        -520,
        -120,
        "Muted texture-free engineering clay; no material-history claim",
    )
    color.set_editor_property("parameter_name", "ClayColor")
    color.set_editor_property(
        "default_value",
        unreal.LinearColor(
            r=MATERIAL_COLOR[0],
            g=MATERIAL_COLOR[1],
            b=MATERIAL_COLOR[2],
            a=MATERIAL_COLOR[3],
        ),
    )
    roughness = material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -520,
        20,
        "Roughness",
    )
    roughness.set_editor_property("parameter_name", "Roughness")
    roughness.set_editor_property("default_value", MATERIAL_ROUGHNESS)
    metallic = material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -520,
        120,
        "Exact nonmetallic blockout",
    )
    metallic.set_editor_property("parameter_name", "Metallic")
    metallic.set_editor_property("default_value", MATERIAL_METALLIC)
    specular = material_expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        -520,
        220,
        "Bounded neutral specular",
    )
    specular.set_editor_property("parameter_name", "Specular")
    specular.set_editor_property("default_value", MATERIAL_SPECULAR)

    connect_material_output(color, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_material_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_material_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_material_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    return material


def apply_metadata(asset, values: dict[str, str]) -> None:
    for key, value in values.items():
        unreal.EditorAssetLibrary.set_metadata_tag(asset, key, value)


def import_prop(
    source: Path,
    metadata_values: dict[str, str],
):
    options = unreal.FbxImportUI()
    options.automated_import_should_detect_type = False
    options.import_mesh = True
    options.import_as_skeletal = False
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_STATIC_MESH
    options.original_import_type = unreal.FBXImportType.FBXIT_STATIC_MESH
    options.import_materials = False
    options.import_textures = False
    options.import_animations = False
    mesh_options = options.static_mesh_import_data
    mesh_options.set_editor_property("combine_meshes", True)
    mesh_options.set_editor_property("auto_generate_collision", False)
    mesh_options.set_editor_property("one_convex_hull_per_ucx", False)
    mesh_options.set_editor_property("remove_degenerates", True)
    mesh_options.set_editor_property("generate_lightmap_u_vs", False)
    mesh_options.set_editor_property("convert_scene", True)
    mesh_options.set_editor_property("convert_scene_unit", True)
    mesh_options.set_editor_property(
        "import_uniform_scale", PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE
    )
    mesh_options.set_editor_property(
        "vertex_color_import_option", unreal.VertexColorImportOption.IGNORE
    )

    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = PROP_NAME
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    mesh = unreal.EditorAssetLibrary.load_asset(asset_path(PROP_NAME))
    if not isinstance(mesh, unreal.StaticMesh):
        raise RuntimeError(
            f"Expected one StaticMesh at {asset_path(PROP_NAME)}; imported {imported_paths}"
        )

    nanite = mesh.get_editor_property("nanite_settings")
    nanite.enabled = False
    mesh.set_editor_property("nanite_settings", nanite)
    apply_metadata(mesh, metadata_values | {"SHI.MarkerIds": ",".join(MARKER_IDS)})
    return mesh, imported_paths


def import_animation(source: Path, skeleton, metadata_values: dict[str, str]):
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
    options.override_animation_name = ANIMATION_NAME

    animation_options = options.anim_sequence_import_data
    animation_options.set_editor_property("convert_scene", True)
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
    animation_options.set_editor_property(
        "delete_existing_custom_attribute_curves", True
    )
    animation_options.set_editor_property(
        "delete_existing_non_curve_custom_attributes", True
    )
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
    task.destination_name = ANIMATION_NAME
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    sequence = unreal.EditorAssetLibrary.load_asset(asset_path(ANIMATION_NAME))
    if not isinstance(sequence, unreal.AnimSequence):
        raise RuntimeError(
            f"Expected one AnimSequence at {asset_path(ANIMATION_NAME)}; imported {imported_paths}"
        )

    normalize_error = unreal.ShiAnimationImportLibrary.normalize_rotation_only_sequence(
        sequence, EXPECTED_SAMPLES
    )
    if normalize_error:
        raise RuntimeError(
            f"Rotation-only interaction normalization failed: {normalize_error}"
        )
    sequence.set_editor_property("enable_root_motion", False)
    sequence.set_editor_property("rate_scale", 1.0)
    apply_metadata(sequence, metadata_values)
    return sequence, imported_paths


def prepare_exact_single_material_binding(
    mesh, material, mutation_authorized: bool
) -> dict:
    configuration = {
        "helper": (
            "unreal.ShiAnimationImportLibrary."
            "configure_exact_single_material_binding"
        ),
        "mutationAuthorized": mutation_authorized,
        "invoked": False,
        "skippedInInspectOnly": not mutation_authorized,
        "postconditionsValidatedByCpp": False,
        "result": "",
        "passed": True,
    }
    if mutation_authorized:
        configure_result = str(
            unreal.ShiAnimationImportLibrary.configure_exact_single_material_binding(
                mesh, material, MATERIAL_NAME
            )
        )
        configuration.update(
            {
                "invoked": True,
                "skippedInInspectOnly": False,
                "postconditionsValidatedByCpp": not configure_result,
                "result": configure_result,
                "passed": not configure_result,
            }
        )
        if configure_result:
            raise RuntimeError(
                f"Exact native material binding configuration failed: {configure_result}"
            )

    validate_result = str(
        unreal.ShiAnimationImportLibrary.validate_exact_single_material_binding(
            mesh, material, MATERIAL_NAME
        )
    )
    validation = {
        "helper": (
            "unreal.ShiAnimationImportLibrary."
            "validate_exact_single_material_binding"
        ),
        "invoked": True,
        "readOnlyConstNativeValidation": True,
        "exactSingleBindingIncludingImportedSlotValidatedByCpp": not validate_result,
        "result": validate_result,
        "passed": not validate_result,
    }
    if validate_result:
        raise RuntimeError(
            f"Exact native material binding validation failed: {validate_result}"
        )
    return {
        "expectedSlot": MATERIAL_NAME,
        "configuration": configuration,
        "validation": validation,
        "passed": configuration["passed"] and validation["passed"],
    }


def prepare_exact_review_sockets(
    mesh, marker_contract: dict, mutation_authorized: bool
) -> dict:
    names = [MARKER_SOCKET_NAMES[marker_id] for marker_id in MARKER_IDS]
    locations = [
        unreal.Vector(
            marker_contract[marker_id]["unrealPositionXYZCentimeters"][0],
            marker_contract[marker_id]["unrealPositionXYZCentimeters"][1],
            marker_contract[marker_id]["unrealPositionXYZCentimeters"][2],
        )
        for marker_id in MARKER_IDS
    ]
    rotations = [
        unreal.Rotator(
            pitch=marker_contract[marker_id]["rotationDegrees"][0],
            yaw=marker_contract[marker_id]["rotationDegrees"][1],
            roll=marker_contract[marker_id]["rotationDegrees"][2],
        )
        for marker_id in MARKER_IDS
    ]
    tags = [marker_id for marker_id in MARKER_IDS]
    primitive_locations = [
        [float(location.x), float(location.y), float(location.z)]
        for location in locations
    ]
    primitive_rotations = [
        [float(rotation.pitch), float(rotation.yaw), float(rotation.roll)]
        for rotation in rotations
    ]
    contract_checks = {
        "exactThreeOrderedNames": names
        == [MARKER_SOCKET_NAMES[marker_id] for marker_id in MARKER_IDS]
        and len(names) == 3
        and len(set(names)) == 3,
        "exactThreeOrderedTags": tags == list(MARKER_IDS)
        and len(tags) == 3
        and len(set(tags)) == 3,
        "exactFrozenLocations": all(
            exact_numeric_vector(
                primitive_locations[index],
                EXPECTED_MARKER_TRANSFORMS[marker_id]["unrealPositionXYZCentimeters"],
            )
            for index, marker_id in enumerate(MARKER_IDS)
        ),
        "exactFrozenRotations": all(
            exact_numeric_vector(
                primitive_rotations[index],
                EXPECTED_MARKER_TRANSFORMS[marker_id]["rotationDegrees"],
            )
            for index, marker_id in enumerate(MARKER_IDS)
        ),
    }
    if not all(contract_checks.values()):
        raise RuntimeError(
            "Exact ordered native socket inputs diverged from the frozen marker "
            f"contract: {contract_checks}"
        )

    configuration_result = ""
    if mutation_authorized:
        configuration_result = str(
            unreal.ShiAnimationImportLibrary.configure_exact_review_sockets(
                mesh, names, locations, rotations, tags
            )
        )
    validation_result = str(
        unreal.ShiAnimationImportLibrary.validate_exact_review_sockets(
            mesh, names, locations, rotations, tags
        )
    )
    status = {
        "expectedOrderedNames": names,
        "expectedOrderedTags": tags,
        "expectedOrderedLocationsCentimeters": primitive_locations,
        "expectedOrderedRotationsDegrees": primitive_rotations,
        "inputContractChecks": contract_checks,
        "configuration": {
            "helper": (
                "unreal.ShiAnimationImportLibrary.configure_exact_review_sockets"
            ),
            "mutationAuthorized": mutation_authorized,
            "invoked": mutation_authorized,
            "skippedInInspectOnly": not mutation_authorized,
            "postconditionsValidatedByCpp": mutation_authorized
            and not configuration_result,
            "result": configuration_result,
            "passed": not configuration_result,
        },
        "validation": {
            "helper": (
                "unreal.ShiAnimationImportLibrary.validate_exact_review_sockets"
            ),
            "invoked": True,
            "readOnlyConstNativeValidation": True,
            "exactCountOrderNoExtrasValidatedByCpp": not validation_result,
            "findSocketIdentityValidatedByCpp": not validation_result,
            "result": validation_result,
            "passed": not validation_result,
        },
        "passed": not configuration_result and not validation_result,
    }
    if not status["passed"]:
        raise RuntimeError(
            "Exact native socket configuration/const validation failed: " f"{status}"
        )
    return status


def prepare_collisionless_review_static_mesh(mesh, mutation_authorized: bool) -> dict:
    status = {
        "helper": (
            "unreal.ShiAnimationImportLibrary."
            "prepare_collisionless_review_static_mesh"
        ),
        "mutationAuthorized": mutation_authorized,
        "invoked": False,
        "readbackOnly": not mutation_authorized,
        "postconditionsValidatedByCpp": False,
        "error": "",
        "passed": True,
    }
    if not mutation_authorized:
        return status

    error = str(
        unreal.ShiAnimationImportLibrary.prepare_collisionless_review_static_mesh(mesh)
    )
    status.update(
        {
            "invoked": True,
            "postconditionsValidatedByCpp": not error,
            "error": error,
            "passed": not error,
        }
    )
    if error:
        raise RuntimeError(f"Collision/navigation authority removal failed: {error}")
    return status


def prepare_compressed_animation(sequence) -> dict:
    result = str(unreal.ShiAnimationImportLibrary.prepare_compressed_sequence(sequence))
    status = {
        "helper": "unreal.ShiAnimationImportLibrary.prepare_compressed_sequence",
        "invoked": True,
        "cacheOnlyNoPackageSaveRequested": True,
        "validationBasis": "UAnimSequence::IsBoneCompressedDataValid",
        "result": result,
        "compressedDataValid": not result,
        "passed": not result,
    }
    if result:
        raise RuntimeError(f"Compressed runtime animation preparation failed: {result}")
    return status


def transform_components(transform) -> dict:
    translation = transform.translation
    rotation = transform.rotation
    scale = transform.scale3d
    return {
        "translation": [
            float(translation.x),
            float(translation.y),
            float(translation.z),
        ],
        "rotation": [
            float(rotation.x),
            float(rotation.y),
            float(rotation.z),
            float(rotation.w),
        ],
        "scale": [float(scale.x), float(scale.y), float(scale.z)],
    }


def transform_finite(transform: dict) -> bool:
    return all(
        math.isfinite(value)
        for key in ("translation", "rotation", "scale")
        for value in transform[key]
    )


def quaternion_degrees_between(first: list[float], second: list[float]) -> float:
    dot = abs(sum(first[index] * second[index] for index in range(4)))
    return math.degrees(2.0 * math.acos(max(-1.0, min(1.0, dot))))


def inspect_all_animation_samples(sequence) -> dict:
    options = unreal.AnimPoseEvaluationOptions()
    options.evaluation_type = unreal.AnimDataEvalType.COMPRESSED
    evaluation_type = options.evaluation_type
    maximum_root_translation = 0.0
    maximum_root_rotation = 0.0
    maximum_arm_scale_error = 0.0
    maximum_any_scale_error = 0.0
    maximum_child_translation_error = 0.0
    non_finite = []
    non_positive_scale = []
    arm_scale_failures = []
    child_translation_failures = []
    root_failures = []
    for frame in range(EXPECTED_SAMPLES):
        pose = sequence.get_anim_pose_at_frame(frame, options)
        for bone_name in BONE_NAMES:
            animated = transform_components(
                unreal.AnimPoseExtensions.get_bone_pose(
                    pose, bone_name, unreal.AnimPoseSpaces.LOCAL
                )
            )
            reference = transform_components(
                pose.get_ref_bone_pose(bone_name, unreal.AnimPoseSpaces.LOCAL)
            )
            if not transform_finite(animated):
                non_finite.append({"frame": frame, "bone": bone_name})
                continue
            scale_error = max(
                abs(animated["scale"][index] - reference["scale"][index])
                for index in range(3)
            )
            maximum_any_scale_error = max(maximum_any_scale_error, scale_error)
            if bone_name != "Root":
                translation_error = max(
                    abs(
                        animated["translation"][index] - reference["translation"][index]
                    )
                    for index in range(3)
                )
                maximum_child_translation_error = max(
                    maximum_child_translation_error, translation_error
                )
                if translation_error > CHILD_TRANSLATION_TOLERANCE_ASSET_UNITS:
                    child_translation_failures.append(
                        {
                            "frame": frame,
                            "bone": bone_name,
                            "error": translation_error,
                        }
                    )
            if any(value <= 0.0 for value in animated["scale"]):
                non_positive_scale.append(
                    {"frame": frame, "bone": bone_name, "scale": animated["scale"]}
                )
            if bone_name in ARM_CHAIN_BONES:
                scale_error = max(
                    abs(animated["scale"][index] - 1.0) for index in range(3)
                )
                maximum_arm_scale_error = max(maximum_arm_scale_error, scale_error)
                if scale_error > SCALE_TOLERANCE:
                    arm_scale_failures.append(
                        {"frame": frame, "bone": bone_name, "error": scale_error}
                    )
            if bone_name == "Root":
                translation_error = max(
                    abs(
                        animated["translation"][index] - reference["translation"][index]
                    )
                    for index in range(3)
                )
                rotation_error = quaternion_degrees_between(
                    animated["rotation"], reference["rotation"]
                )
                maximum_root_translation = max(
                    maximum_root_translation, translation_error
                )
                maximum_root_rotation = max(maximum_root_rotation, rotation_error)
                if (
                    translation_error > ROOT_TRANSLATION_TOLERANCE_ASSET_UNITS
                    or rotation_error > ROOT_ROTATION_TOLERANCE_DEGREES
                ):
                    root_failures.append(
                        {
                            "frame": frame,
                            "translationErrorAssetUnits": translation_error,
                            "rotationErrorDegrees": rotation_error,
                        }
                    )
    checks = {
        "explicitCompressedRuntimeEvaluation": evaluation_type
        == unreal.AnimDataEvalType.COMPRESSED,
        "all121By53TransformsFinite": not non_finite,
        "allBoneScalesPositive": not non_positive_scale,
        "allBoneScalesMatchReference": maximum_any_scale_error <= SCALE_TOLERANCE,
        "childTranslationsMatchReference": not child_translation_failures,
        "rootStationaryEverySample": not root_failures,
        "armChainScaleUnchangedEverySample": not arm_scale_failures,
    }
    return {
        "evaluationType": "Compressed",
        "reflectedEvaluationType": str(evaluation_type),
        "expectedReflectedEvaluationType": str(unreal.AnimDataEvalType.COMPRESSED),
        "sampledFrames": EXPECTED_SAMPLES,
        "sampledBonesPerFrame": len(BONE_NAMES),
        "maximumRootTranslationErrorAssetUnits": maximum_root_translation,
        "maximumRootRotationErrorDegrees": maximum_root_rotation,
        "maximumArmChainScaleError": maximum_arm_scale_error,
        "maximumAnyBoneScaleError": maximum_any_scale_error,
        "maximumChildTranslationError": maximum_child_translation_error,
        "nonFiniteFailures": non_finite,
        "nonPositiveScaleFailures": non_positive_scale,
        "rootFailures": root_failures,
        "armScaleFailures": arm_scale_failures,
        "childTranslationFailures": child_translation_failures,
        "checks": checks,
        "passed": all(checks.values()),
    }


def metadata_status(asset, expected_metadata: dict[str, str]) -> dict:
    actual = {
        key: unreal.EditorAssetLibrary.get_metadata_tag(asset, key)
        for key in expected_metadata
    }
    checks = {
        "exactInteractionMetadata": actual == expected_metadata,
        "contactMetadataPresent": actual.get("SHI.SemanticSamples")
        == METADATA["SHI.SemanticSamples"],
        "exactReviewedContactContractPresent": bool(actual.get("SHI.ContactContract"))
        and actual.get("SHI.ContactContract")
        == expected_metadata.get("SHI.ContactContract"),
        "exactFailClosedStoryContinuityPresent": actual.get("SHI.StoryContinuity")
        == expected_metadata.get("SHI.StoryContinuity"),
        "exactSilentTimingBoundaryPresent": actual.get("SHI.SilentTimingBoundary")
        == expected_metadata.get("SHI.SilentTimingBoundary"),
        "conditionalEngineeringDecisionOnly": actual.get("SHI.SourceVisualDecision")
        == "conditional-engineering-accept",
        "reviewOnlyNoCampaignSaveOrReplicationAuthority": actual.get("SHI.Authority")
        == "engineering-review-only"
        and actual.get("SHI.CampaignAuthority") == "false"
        and actual.get("SHI.SaveAuthority") == "false"
        and actual.get("SHI.ReplicationAuthority") == "false",
    }
    return {"values": actual, "checks": checks, "passed": all(checks.values())}


def inspect_material(material, compile_material: bool) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    parameters = {}
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionVectorParameter):
            color = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [
                float(color.r),
                float(color.g),
                float(color.b),
                float(color.a),
            ]
        elif isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(
                node.get_editor_property("default_value")
            )
    used_textures = list(
        unreal.MaterialEditingLibrary.get_material_used_textures(material)
    )
    compile_errors = (
        list(unreal.MaterialEditingLibrary.recompile_material(material))
        if compile_material
        else []
    )
    forbidden_outputs = (
        unreal.MaterialProperty.MP_EMISSIVE_COLOR,
        unreal.MaterialProperty.MP_OPACITY,
        unreal.MaterialProperty.MP_OPACITY_MASK,
        unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET,
    )
    required_outputs = {
        "ClayColor": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_BASE_COLOR
        ),
        "Roughness": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_ROUGHNESS
        ),
        "Metallic": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_METALLIC
        ),
        "Specular": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_SPECULAR
        ),
    }
    checks = {
        "exactAssetPath": material.get_path_name() == object_path(MATERIAL_NAME),
        "surfaceOpaqueDefaultLitOneSided": material.get_editor_property(
            "material_domain"
        )
        == unreal.MaterialDomain.MD_SURFACE
        and material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("shading_model")
        == unreal.MaterialShadingModel.MSM_DEFAULT_LIT
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "exactTextureFreeFourNodeGraph": len(expressions) == 4 and not used_textures,
        "exactMutedClayParameters": exact_numeric_vector(
            parameters.get("ClayColor"), MATERIAL_COLOR
        )
        and exact_float(parameters.get("Roughness"), MATERIAL_ROUGHNESS)
        and exact_float(parameters.get("Metallic"), MATERIAL_METALLIC)
        and exact_float(parameters.get("Specular"), MATERIAL_SPECULAR),
        "exactFourMaterialOutputs": all(
            node is not None
            and str(node.get_editor_property("parameter_name")) == parameter_name
            for parameter_name, node in required_outputs.items()
        ),
        "noEmissiveOpacityMaskOrWorldOffset": all(
            unreal.MaterialEditingLibrary.get_material_property_input_node(
                material, output
            )
            is None
            for output in forbidden_outputs
        ),
        "compileClean": not compile_errors if compile_material else True,
    }
    return {
        "assetPath": material.get_path_name(),
        "parameters": parameters,
        "expressionClasses": sorted(
            node.get_class().get_name() for node in expressions
        ),
        "usedTextures": [texture.get_path_name() for texture in used_textures],
        "outputs": {
            parameter_name: node.get_class().get_name() if node else None
            for parameter_name, node in required_outputs.items()
        },
        "compiledDuringThisRun": compile_material,
        "compileErrors": [str(error) for error in compile_errors],
        "checks": checks,
        "passed": all(checks.values()),
    }


def vector_values(vector) -> list[float]:
    return [float(vector.x), float(vector.y), float(vector.z)]


def rotator_values(rotator) -> list[float]:
    return [float(rotator.pitch), float(rotator.yaw), float(rotator.roll)]


def inspect_known_review_sockets(mesh) -> dict[str, dict]:
    sockets = {}
    for marker_id in MARKER_IDS:
        socket_name = MARKER_SOCKET_NAMES[marker_id]
        socket = mesh.find_socket(socket_name)
        if socket is None:
            sockets[socket_name] = {
                "requestedName": socket_name,
                "found": False,
                "socketName": None,
                "tag": None,
                "locationCentimeters": None,
                "rotationDegrees": None,
                "scale": None,
            }
            continue
        sockets[socket_name] = {
            "requestedName": socket_name,
            "found": True,
            "socketName": str(socket.get_editor_property("socket_name")),
            "tag": str(socket.get_editor_property("tag")),
            "locationCentimeters": vector_values(
                socket.get_editor_property("relative_location")
            ),
            "rotationDegrees": rotator_values(
                socket.get_editor_property("relative_rotation")
            ),
            "scale": vector_values(socket.get_editor_property("relative_scale")),
        }
    return sockets


def inspect_prop(
    mesh,
    material,
    imported_paths: list[str],
    expected_metadata: dict[str, str],
) -> dict:
    subsystem = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    bounds = mesh.get_bounding_box()
    minimum = vector_values(bounds.min)
    maximum = vector_values(bounds.max)
    dimensions = [maximum[index] - minimum[index] for index in range(3)]
    sockets = inspect_known_review_sockets(mesh)
    materials = []
    for slot in mesh.get_editor_property("static_materials"):
        material_interface = slot.material_interface
        materials.append(
            {
                "materialSlotName": str(slot.material_slot_name),
                "importedMaterialSlotName": str(
                    slot.get_editor_property("imported_material_slot_name")
                ),
                "material": (
                    material_interface.get_path_name()
                    if material_interface is not None
                    else None
                ),
            }
        )
    simple_collision_count = int(subsystem.get_simple_collision_count(mesh))
    convex_collision_count = int(subsystem.get_convex_collision_count(mesh))
    collision_complexity = subsystem.get_collision_complexity(mesh)
    has_navigation_data = bool(mesh.get_editor_property("has_navigation_data"))
    lod_count = int(subsystem.get_lod_count(mesh))
    lod_triangles = [int(mesh.get_num_triangles(index)) for index in range(lod_count)]
    checks = {
        "exactAssetPath": mesh.get_path_name() == object_path(PROP_NAME),
        "exactImportedObjectPath": imported_paths in ([], [object_path(PROP_NAME)]),
        "exactCentered32By14By2CentimeterBounds": exact_numeric_vector(
            minimum,
            EXPECTED_PROP_MINIMUM_CENTIMETERS,
            PROP_BOUNDS_TOLERANCE_CENTIMETERS,
        )
        and exact_numeric_vector(
            maximum,
            EXPECTED_PROP_MAXIMUM_CENTIMETERS,
            PROP_BOUNDS_TOLERANCE_CENTIMETERS,
        )
        and exact_numeric_vector(
            dimensions,
            EXPECTED_PROP_DIMENSIONS_CENTIMETERS,
            PROP_BOUNDS_TOLERANCE_CENTIMETERS,
        ),
        "exactOneClayMaterialBinding": len(materials) == 1
        and materials[0]["material"] == material.get_path_name(),
        "exactMaterialSlotName": len(materials) == 1
        and materials[0]["materialSlotName"] == MATERIAL_NAME,
        "exactImportedMaterialSlotName": len(materials) == 1
        and materials[0]["importedMaterialSlotName"] == MATERIAL_NAME,
        "allThreeKnownSocketsIndependentlyFoundAndExact": set(sockets)
        == set(MARKER_SOCKET_NAMES.values())
        and len(sockets) == 3
        and all(
            sockets[socket_name]["found"] is True
            and sockets[socket_name]["requestedName"] == socket_name
            and sockets[socket_name]["socketName"] == socket_name
            and sockets[socket_name]["tag"] == marker_id
            and exact_numeric_vector(sockets[socket_name]["scale"], (1.0, 1.0, 1.0))
            and exact_numeric_vector(
                sockets[socket_name]["locationCentimeters"],
                EXPECTED_MARKER_TRANSFORMS[marker_id]["unrealPositionXYZCentimeters"],
            )
            and exact_numeric_vector(
                sockets[socket_name]["rotationDegrees"],
                EXPECTED_MARKER_TRANSFORMS[marker_id]["rotationDegrees"],
            )
            for marker_id, socket_name in MARKER_SOCKET_NAMES.items()
        ),
        "noSimpleOrConvexCollision": simple_collision_count == 0
        and convex_collision_count == 0,
        "perPolyCollisionDisabled": collision_complexity
        == unreal.CollisionTraceFlag.CTF_USE_SIMPLE_AS_COMPLEX,
        "navigationDataDisabled": not has_navigation_data,
        "exactOneNonEmptyEngineeringLod": lod_count == 1
        and len(lod_triangles) == 1
        and lod_triangles[0] > 0,
        "naniteDeliberatelyOff": not bool(
            mesh.get_editor_property("nanite_settings").enabled
        ),
    }
    return {
        "assetPath": mesh.get_path_name(),
        "importedObjectPaths": imported_paths,
        "boundsCentimeters": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": dimensions,
        },
        "materials": materials,
        "sockets": sockets,
        "simpleCollisionCount": simple_collision_count,
        "convexCollisionCount": convex_collision_count,
        "collisionComplexity": str(collision_complexity),
        "expectedCollisionComplexity": str(
            unreal.CollisionTraceFlag.CTF_USE_SIMPLE_AS_COMPLEX
        ),
        "hasNavigationData": has_navigation_data,
        "lodCount": lod_count,
        "lodTriangles": lod_triangles,
        "naniteEnabled": bool(mesh.get_editor_property("nanite_settings").enabled),
        "metadata": metadata_status(mesh, expected_metadata),
        "checks": checks,
        "passed": all(checks.values())
        and metadata_status(mesh, expected_metadata)["passed"],
    }


def inspect_animation(
    sequence,
    skeleton,
    imported_paths: list[str],
    expected_metadata: dict[str, str],
    compression_preparation: dict,
) -> dict:
    asset_data = unreal.EditorAssetLibrary.find_asset_data(sequence.get_path_name())
    sample_count = int(asset_data.get_tag_value("NumberOfSampledKeys"))
    sampling_rate = float(asset_data.get_tag_value("ImportResampleFramerate"))
    duration = float(sequence.get_play_length())
    track_names = [
        str(name)
        for name in unreal.AnimationLibrary.get_animation_track_names(sequence)
    ]
    sequence_skeleton = sequence.get_editor_property("skeleton")
    additive_type = sequence.get_editor_property("additive_anim_type")
    sample_status = inspect_all_animation_samples(sequence)
    checks = {
        "exactAssetPath": sequence.get_path_name() == object_path(ANIMATION_NAME),
        "exactImportedObjectPath": imported_paths
        in ([], [object_path(ANIMATION_NAME)]),
        "exactSharedSkeleton": sequence_skeleton is skeleton
        or (
            sequence_skeleton
            and sequence_skeleton.get_path_name()
            == f"{SHARED_SKELETON_PATH}.{SHARED_SKELETON_NAME}"
        ),
        "exact121Samples120Intervals": sample_count == EXPECTED_SAMPLES,
        "exact30FpsFourSeconds": exact_float(
            sampling_rate, EXPECTED_FRAMES_PER_SECOND, 0.0001
        )
        and exact_float(duration, EXPECTED_SECONDS, 0.0001),
        "exact52TracksAfterRootRemoval": len(track_names) == EXPECTED_IMPORTED_TRACKS
        and "Root" not in track_names
        and "root" not in [name.lower() for name in track_names],
        "bothHandAndArmChainsRetained": all(
            bone in track_names for bone in ARM_CHAIN_BONES
        ),
        "rootMotionDisabledAndNotAdditive": not bool(
            sequence.get_editor_property("enable_root_motion")
        )
        and additive_type == unreal.AdditiveAnimationType.AAT_NONE,
        "unitRateScale": exact_float(sequence.get_editor_property("rate_scale"), 1.0),
        "compressedRuntimeDataValid": compression_preparation["passed"]
        and compression_preparation["compressedDataValid"],
        "compressedPoseEvaluationExplicit": sample_status["checks"][
            "explicitCompressedRuntimeEvaluation"
        ],
        "allSamplesFiniteRootStationaryArmScaleOne": sample_status["passed"],
    }
    metadata = metadata_status(sequence, expected_metadata)
    return {
        "assetPath": sequence.get_path_name(),
        "importedObjectPaths": imported_paths,
        "skeleton": sequence_skeleton.get_path_name() if sequence_skeleton else None,
        "samples": sample_count,
        "frames": sample_count - 1,
        "durationSeconds": duration,
        "framesPerSecond": sampling_rate,
        "trackCount": len(track_names),
        "trackNames": track_names,
        "rootMotionEnabled": bool(sequence.get_editor_property("enable_root_motion")),
        "rateScale": float(sequence.get_editor_property("rate_scale")),
        "additiveAnimationType": str(additive_type),
        "compressionPreparation": compression_preparation,
        "sampleInspection": sample_status,
        "contactMetadata": metadata,
        "checks": checks,
        "passed": all(checks.values()) and metadata["passed"],
    }


def destination_inventory() -> dict:
    paths = sorted(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True))
    assets = []
    for path in paths:
        asset = unreal.EditorAssetLibrary.load_asset(path)
        assets.append(
            {"path": path, "class": asset.get_class().get_name() if asset else None}
        )
    expected = {
        object_path(PROP_NAME): "StaticMesh",
        object_path(MATERIAL_NAME): "Material",
        object_path(ANIMATION_NAME): "AnimSequence",
    }
    actual = {item["path"]: item["class"] for item in assets}
    forbidden_classes = {
        "Skeleton",
        "SkeletalMesh",
        "PhysicsAsset",
        "Texture2D",
        "Blueprint",
        "DataAsset",
        "PrimaryDataAsset",
        "SoundWave",
        "SoundCue",
        "NavMeshBoundsVolume",
    }
    checks = {
        "exactThreeAssetsNoExtras": actual == expected and len(assets) == 3,
        "exactStaticMeshMaterialAnimSequenceClasses": all(
            actual.get(path) == asset_class for path, asset_class in expected.items()
        ),
        "noRigTexturePhysicsAudioNavigationOrGameplayAssets": all(
            item["class"] not in forbidden_classes for item in assets
        ),
    }
    return {
        "assets": assets,
        "expected": expected,
        "checks": checks,
        "passed": all(checks.values()),
    }


def encoded_text_variants(value: str) -> tuple[bytes, bytes, bytes]:
    return (
        value.encode("utf-8"),
        value.encode("utf-16-le"),
        value.encode("utf-16-be"),
    )


def embedded_text_present(data: bytes, value: str) -> bool:
    return any(candidate in data for candidate in encoded_text_variants(value))


def embedded_metadata_privacy_status(root: Path, repository: Path) -> dict:
    expected_source_by_asset = {
        f"{PROP_NAME}.uasset": PROP_SOURCE_RELATIVE_PATH,
        f"{ANIMATION_NAME}.uasset": ANIMATION_SOURCE_RELATIVE_PATH,
        f"{MATERIAL_NAME}.uasset": None,
    }
    assets = {}
    for path in sorted(root.glob("*.uasset")):
        data = path.read_bytes()
        source_relative = expected_source_by_asset.get(path.name)
        checks = {
            "repositoryAbsolutePathAbsent": not embedded_text_present(
                data, str(repository.resolve())
            ),
            "unixHomePathAbsent": not embedded_text_present(data, "/home/"),
            "macUsersPathAbsent": not embedded_text_present(data, "/Users/"),
            "windowsForwardUsersPathAbsent": not embedded_text_present(
                data, "C:/Users/"
            ),
            "windowsBackslashUsersPathAbsent": not embedded_text_present(
                data, "C:\\Users\\"
            ),
            "absoluteInterchangeFactoryPathAbsent": not embedded_text_present(
                data, "Factory_/"
            )
            and not embedded_text_present(data, "Factory_\\"),
            "interchangeAssetImportDataAbsent": not embedded_text_present(
                data, "InterchangeAssetImportData"
            ),
            "credentialTokenMarkersAbsent": all(
                not embedded_text_present(data, token)
                for token in (
                    "AndroidFileServer",
                    "password=",
                    "Authorization:",
                    "github_pat_",
                    "sk-proj-",
                )
            ),
        }
        if source_relative is not None:
            checks.update(
                {
                    "exactSourceAbsolutePathAbsent": not embedded_text_present(
                        data, str((repository / source_relative).resolve())
                    ),
                    "assetImportDataPresent": embedded_text_present(
                        data, "AssetImportData"
                    ),
                    "relativeFilenamePresent": embedded_text_present(
                        data, "RelativeFilename"
                    ),
                    "sourceBasenamePresent": embedded_text_present(
                        data, Path(source_relative).name
                    ),
                }
            )
        else:
            checks["materialHasNoSourceIdentity"] = all(
                not embedded_text_present(data, Path(item).name)
                for item in (PROP_SOURCE_RELATIVE_PATH, ANIMATION_SOURCE_RELATIVE_PATH)
            )
        assets[path.name] = {
            "sourceIdentity": source_relative,
            "checks": checks,
            "passed": all(checks.values()),
        }
    checks = {
        "exactThreeUassetsScanned": set(assets) == set(expected_source_by_asset)
        and len(assets) == 3,
        "allTrackedBinariesPrivatePathsAndCredentialsAbsent": all(
            item["passed"] for item in assets.values()
        ),
    }
    return {"assets": assets, "checks": checks, "passed": all(checks.values())}


def evidence_path(repository: Path) -> Path:
    return repository / EVIDENCE_RELATIVE_PATH


def write_report(repository: Path, report: dict) -> Path:
    path = evidence_path(repository)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    return path


def import_receipt_root(report: dict) -> dict:
    return {key: value for key, value in report.items() if key != "readOnlyInspection"}


def import_receipt_root_sha256(report: dict) -> str:
    payload = json.dumps(
        import_receipt_root(report),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def successful_import_receipt(report: dict) -> bool:
    tracked = report.get("trackedUnrealAssets", {})
    receipts = tracked.get("receipts", {})
    prop = report.get("prop", {})
    prop_checks = prop.get("checks", {})
    animation = report.get("animation", {})
    animation_checks = animation.get("checks", {})
    sample_inspection = animation.get("sampleInspection", {})
    material_binding = report.get("staticMeshMaterialBindingPreparation", {})
    material_configuration = material_binding.get("configuration", {})
    material_validation = material_binding.get("validation", {})
    static_mesh_import_guard = report.get("staticMeshImportSourceGuard", {})
    static_mesh_import_correction = report.get("staticMeshImportCorrection", {})
    socket_preparation = report.get("staticMeshSocketPreparation", {})
    socket_configuration = socket_preparation.get("configuration", {})
    socket_validation = socket_preparation.get("validation", {})
    expected_files = {
        f"{PROP_NAME}.uasset",
        f"{MATERIAL_NAME}.uasset",
        f"{ANIMATION_NAME}.uasset",
    }
    return (
        report.get("assetId") == ASSET_ID
        and report.get("schemaVersion") == EVIDENCE_SCHEMA_VERSION
        and report.get("destination") == DESTINATION
        and report.get("mode") == "import-replace"
        and report.get("mutationAuthorized") is True
        and report.get("passed") is True
        and report.get("saved") is True
        and isinstance(report.get("importProcessId"), int)
        and report.get("staticMaterialBindingSourceGuard", {}).get("passed") is True
        and static_mesh_import_guard.get("importData")
        == "UFbxStaticMeshImportData"
        and static_mesh_import_guard.get("importUniformScale")
        == PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE
        and static_mesh_import_guard.get("convertScene") is True
        and static_mesh_import_guard.get("convertSceneUnit") is True
        and static_mesh_import_guard.get("purpose")
        == PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE
        and static_mesh_import_guard.get("runtimeScaleAuthority") is False
        and static_mesh_import_guard.get("sourceGeometryChanged") is False
        and static_mesh_import_guard.get("markerOrWorldScaleChanged") is False
        and static_mesh_import_guard.get("checks")
        == {
            "exactImportPropWrapper": True,
            "exactSourceGuardCallBeforeUnrealModuleLoad": True,
            "exactStaticMeshImportDataBinding": True,
            "exactPinnedPointZeroOneImportScaleConstant": True,
            "convertSceneExplicitlyTrue": True,
            "convertSceneUnitExplicitlyTrue": True,
            "importUniformScaleExplicitlyPointZeroOne": True,
            "noDirectImportScaleAssignment": True,
            "unitCorrectionConfiguredBeforeImportTask": True,
        }
        and static_mesh_import_guard.get("passed") is True
        and static_mesh_import_correction.get("importData")
        == "UFbxStaticMeshImportData"
        and static_mesh_import_correction.get("importUniformScale")
        == PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE
        and static_mesh_import_correction.get("convertScene") is True
        and static_mesh_import_correction.get("convertSceneUnit") is True
        and static_mesh_import_correction.get("purpose")
        == PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE
        and static_mesh_import_correction.get("runtimeScaleAuthority") is False
        and static_mesh_import_correction.get("runtimeComponentScaleContractChanged")
        is False
        and static_mesh_import_correction.get("sourceGeometryChanged") is False
        and static_mesh_import_correction.get("markerOrWorldScaleChanged") is False
        and static_mesh_import_correction.get("expectedAssetBoundsCentimeters")
        == {
            "minimum": list(EXPECTED_PROP_MINIMUM_CENTIMETERS),
            "maximum": list(EXPECTED_PROP_MAXIMUM_CENTIMETERS),
            "dimensions": list(EXPECTED_PROP_DIMENSIONS_CENTIMETERS),
        }
        and static_mesh_import_correction.get("observedAssetBoundsCentimeters")
        == prop.get("boundsCentimeters")
        and static_mesh_import_correction.get("assetBoundsReadbackPassed") is True
        and static_mesh_import_correction.get("passed") is True
        and report.get("staticMeshSocketSourceGuard", {}).get("passed") is True
        and report.get("runtimeAdmissionSourceGuard", {}).get("passed") is True
        and material_binding.get("expectedSlot") == MATERIAL_NAME
        and material_configuration.get("helper")
        == (
            "unreal.ShiAnimationImportLibrary."
            "configure_exact_single_material_binding"
        )
        and material_configuration.get("mutationAuthorized") is True
        and material_configuration.get("invoked") is True
        and material_configuration.get("skippedInInspectOnly") is False
        and material_configuration.get("postconditionsValidatedByCpp") is True
        and material_configuration.get("result") == ""
        and material_configuration.get("passed") is True
        and material_validation.get("helper")
        == (
            "unreal.ShiAnimationImportLibrary."
            "validate_exact_single_material_binding"
        )
        and material_validation.get("invoked") is True
        and material_validation.get("readOnlyConstNativeValidation") is True
        and material_validation.get(
            "exactSingleBindingIncludingImportedSlotValidatedByCpp"
        )
        is True
        and material_validation.get("result") == ""
        and material_validation.get("passed") is True
        and material_binding.get("passed") is True
        and socket_preparation.get("expectedOrderedNames")
        == [MARKER_SOCKET_NAMES[marker_id] for marker_id in MARKER_IDS]
        and socket_preparation.get("expectedOrderedTags") == list(MARKER_IDS)
        and socket_preparation.get("inputContractChecks")
        == {
            "exactThreeOrderedNames": True,
            "exactThreeOrderedTags": True,
            "exactFrozenLocations": True,
            "exactFrozenRotations": True,
        }
        and socket_configuration.get("helper")
        == "unreal.ShiAnimationImportLibrary.configure_exact_review_sockets"
        and socket_configuration.get("mutationAuthorized") is True
        and socket_configuration.get("invoked") is True
        and socket_configuration.get("skippedInInspectOnly") is False
        and socket_configuration.get("postconditionsValidatedByCpp") is True
        and socket_configuration.get("result") == ""
        and socket_configuration.get("passed") is True
        and socket_validation.get("helper")
        == "unreal.ShiAnimationImportLibrary.validate_exact_review_sockets"
        and socket_validation.get("invoked") is True
        and socket_validation.get("readOnlyConstNativeValidation") is True
        and socket_validation.get("exactCountOrderNoExtrasValidatedByCpp") is True
        and socket_validation.get("findSocketIdentityValidatedByCpp") is True
        and socket_validation.get("result") == ""
        and socket_validation.get("passed") is True
        and socket_preparation.get("passed") is True
        and report.get("staticMeshCollisionlessPreparation", {}).get("invoked") is True
        and report.get("staticMeshCollisionlessPreparation", {}).get(
            "postconditionsValidatedByCpp"
        )
        is True
        and report.get("staticMeshCollisionlessPreparation", {}).get("passed") is True
        and report.get("animationCompressionPreparation", {}).get("compressedDataValid")
        is True
        and report.get("animationCompressionPreparation", {}).get("passed") is True
        and report.get("sourceContract", {}).get("passed") is True
        and prop.get("passed") is True
        and prop.get("materials")
        == [
            {
                "materialSlotName": MATERIAL_NAME,
                "importedMaterialSlotName": MATERIAL_NAME,
                "material": object_path(MATERIAL_NAME),
            }
        ]
        and prop_checks.get("exactMaterialSlotName") is True
        and prop_checks.get("exactImportedMaterialSlotName") is True
        and prop_checks.get("allThreeKnownSocketsIndependentlyFoundAndExact") is True
        and prop_checks.get("noSimpleOrConvexCollision") is True
        and prop_checks.get("perPolyCollisionDisabled") is True
        and prop_checks.get("navigationDataDisabled") is True
        and animation.get("passed") is True
        and animation_checks.get("compressedRuntimeDataValid") is True
        and animation_checks.get("compressedPoseEvaluationExplicit") is True
        and sample_inspection.get("evaluationType") == "Compressed"
        and sample_inspection.get("passed") is True
        and report.get("destinationInventory", {}).get("passed") is True
        and report.get("embeddedMetadataPrivacy", {}).get("passed") is True
        and report.get("acceptedAssetPreservation", {}).get("passed") is True
        and tracked.get("passed") is True
        and set(receipts) == expected_files
        and len(receipts) == 3
        and all(
            isinstance(item, dict)
            and isinstance(item.get("bytes"), int)
            and item["bytes"] > 0
            and isinstance(item.get("sha256"), str)
            and len(item["sha256"]) == 64
            for item in receipts.values()
        )
    )


def main() -> None:
    requested_mode = os.environ.get(MUTATION_ENV, "")
    if requested_mode not in {"", "0", "1"}:
        raise RuntimeError(f"{MUTATION_ENV} must be unset, 0 or exactly 1")
    replace = requested_mode == "1"

    # These are deliberately before any Unreal module load or destination
    # touch. UE 5.8 forbids Python construction/setters for the imported slot;
    # the exact binding must pass through the frozen native helper instead.
    static_material_binding_source_guard = validate_static_material_binding_source()
    static_mesh_import_source_guard = validate_static_mesh_import_source()
    static_mesh_socket_source_guard = validate_static_mesh_socket_source()
    runtime_admission_source_guard = validate_runtime_admission_source()

    # The reflected normalizer removes only Root and normalizes translations
    # and scales without changing the accepted Skeleton or any facial asset.
    unreal.load_module("AnimationBlueprintLibrary")
    unreal.load_module("SHIEditor")
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    destination_disk_root = package_disk_root(project_dir, DESTINATION)

    previous_import_report = None
    immutable_import_root_sha256 = None
    if not replace:
        canonical_path = evidence_path(repository)
        if not canonical_path.is_file():
            raise RuntimeError(
                "Inspect-only requires a canonical successful import-replace receipt; "
                f"run the exact isolated import with {MUTATION_ENV}=1 first."
            )
        candidate = json.loads(canonical_path.read_text(encoding="utf-8"))
        if not successful_import_receipt(candidate):
            raise RuntimeError(
                "Inspect-only refused a noncanonical or failed import receipt; "
                "the existing evidence file was left untouched."
            )
        if candidate.get("importProcessId") == os.getpid():
            raise RuntimeError(
                "Read-only verification must run in a second Unreal process."
            )
        previous_import_report = candidate
        immutable_import_root_sha256 = import_receipt_root_sha256(candidate)

    # Every fail-closed source and accepted-baseline check occurs before the
    # isolated destination may be deleted or created.
    source_contract = validate_source_contract(repository)
    expected_metadata = interaction_metadata(source_contract)
    facial_before = validate_accepted_package(
        repository,
        project_dir,
        "facial-performance",
        FACIAL_DESTINATION,
        FACIAL_EVIDENCE_RELATIVE_PATH,
    )
    skin_before = validate_accepted_package(
        repository,
        project_dir,
        "skin-lookdev",
        SKIN_DESTINATION,
        SKIN_EVIDENCE_RELATIVE_PATH,
    )
    skeleton, skeleton_before = validate_shared_skeleton(project_dir)

    destination_exists = unreal.EditorAssetLibrary.does_directory_exist(DESTINATION)
    if not replace and not destination_exists:
        raise RuntimeError(
            "Wet-register destination is absent. Default mode cannot create assets; "
            f"set {MUTATION_ENV}=1 for the exact isolated import."
        )
    if replace and destination_exists:
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(
                f"Could not replace exact isolated target: {DESTINATION}"
            )

    imported_paths = {"prop": [], "animation": []}
    if replace:
        material = author_material()
        prop, imported_paths["prop"] = import_prop(
            repository / PROP_SOURCE_RELATIVE_PATH,
            expected_metadata,
        )
        animation, imported_paths["animation"] = import_animation(
            repository / ANIMATION_SOURCE_RELATIVE_PATH,
            skeleton,
            expected_metadata,
        )
        apply_metadata(material, expected_metadata)
    else:
        prop = unreal.EditorAssetLibrary.load_asset(asset_path(PROP_NAME))
        material = unreal.EditorAssetLibrary.load_asset(asset_path(MATERIAL_NAME))
        animation = unreal.EditorAssetLibrary.load_asset(asset_path(ANIMATION_NAME))

    if not isinstance(prop, unreal.StaticMesh):
        raise RuntimeError(
            f"Missing exact isolated StaticMesh: {asset_path(PROP_NAME)}"
        )
    if not isinstance(material, unreal.Material):
        raise RuntimeError(
            f"Missing exact isolated Material: {asset_path(MATERIAL_NAME)}"
        )
    if not isinstance(animation, unreal.AnimSequence):
        raise RuntimeError(
            f"Missing exact isolated AnimSequence: {asset_path(ANIMATION_NAME)}"
        )

    # Python cannot mutate ImportedMaterialSlotName in UE 5.8. The guarded
    # native helper authors the exact binding only in import mode; its read-only
    # companion validates all three fields in both processes before inspection.
    material_binding_preparation = prepare_exact_single_material_binding(
        prop, material, replace
    )
    # UStaticMesh.Sockets is protected in UE 5.8. One native exact-set helper
    # owns mutation; its const companion validates exact order/count/no extras
    # in both import and inspect-only processes before named Python readback.
    socket_preparation = prepare_exact_review_sockets(
        prop,
        source_contract["interactionContract"]["prop"]["markers"],
        replace,
    )
    # A second native helper is the only mutation path for private
    # BodySetup/NavCollision state.
    static_mesh_preparation = prepare_collisionless_review_static_mesh(prop, replace)
    # This prepares current-platform derived data without saving or dirtying the
    # package, then authoritatively checks IsBoneCompressedDataValid in C++.
    compression_preparation = prepare_compressed_animation(animation)

    prop_status = inspect_prop(
        prop, material, imported_paths["prop"], expected_metadata
    )
    material_status = inspect_material(material, compile_material=replace)
    animation_status = inspect_animation(
        animation,
        skeleton,
        imported_paths["animation"],
        expected_metadata,
        compression_preparation,
    )
    material_metadata = metadata_status(material, expected_metadata)
    inventory = destination_inventory()

    facial_after = relative_file_receipts(
        package_disk_root(project_dir, FACIAL_DESTINATION)
    )
    skin_after = relative_file_receipts(
        package_disk_root(project_dir, SKIN_DESTINATION)
    )
    _, skeleton_after = validate_shared_skeleton(project_dir)
    preservation_checks = {
        "acceptedFacialHashesUnchanged": facial_after == facial_before["diskReceipts"],
        "acceptedSkinHashesUnchanged": skin_after == skin_before["diskReceipts"],
        "sharedSkeletonPackageAndReferencePoseUnchanged": skeleton_after["package"]
        == skeleton_before["package"]
        and skeleton_after["referencePose"] == skeleton_before["referencePose"],
        "isolatedDestination": all(
            DESTINATION != baseline
            and not DESTINATION.startswith(f"{baseline}/")
            and not baseline.startswith(f"{DESTINATION}/")
            for baseline in (
                FACIAL_DESTINATION,
                SKIN_DESTINATION,
                SHARED_SKELETON_DESTINATION,
            )
        ),
    }
    static_mesh_import_correction = {
        "importData": "UFbxStaticMeshImportData",
        "importUniformScale": PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE,
        "convertScene": True,
        "convertSceneUnit": True,
        "purpose": PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE,
        "runtimeScaleAuthority": False,
        "runtimeComponentScaleContractChanged": False,
        "sourceGeometryChanged": False,
        "markerOrWorldScaleChanged": False,
        "expectedAssetBoundsCentimeters": {
            "minimum": list(EXPECTED_PROP_MINIMUM_CENTIMETERS),
            "maximum": list(EXPECTED_PROP_MAXIMUM_CENTIMETERS),
            "dimensions": list(EXPECTED_PROP_DIMENSIONS_CENTIMETERS),
        },
        "observedAssetBoundsCentimeters": prop_status["boundsCentimeters"],
        "assetBoundsReadbackPassed": prop_status["checks"][
            "exactCentered32By14By2CentimeterBounds"
        ],
        "passed": static_mesh_import_source_guard["passed"]
        and prop_status["checks"]["exactCentered32By14By2CentimeterBounds"],
    }

    report = {
        "assetId": ASSET_ID,
        "schemaVersion": EVIDENCE_SCHEMA_VERSION,
        "status": (
            "isolated wet-register hand-interaction engineering blockout; "
            "not final prop, hand animation, historical reconstruction or close-camera approval"
        ),
        "disclosure": (
            "PROJECT-ORIGINAL WET-REGISTER INTERACTION BLOCKOUT · "
            "DRAMATIC RECONSTRUCTION · NOT A SURVIVING QIN REGISTER"
        ),
        "mode": "import-replace" if replace else "inspect-only",
        "mutationEnvironment": MUTATION_ENV,
        "mutationAuthorized": replace,
        "importProcessId": os.getpid() if replace else None,
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "destination": DESTINATION,
        "staticMaterialBindingSourceGuard": static_material_binding_source_guard,
        "staticMeshImportSourceGuard": static_mesh_import_source_guard,
        "staticMeshImportCorrection": static_mesh_import_correction,
        "staticMeshSocketSourceGuard": static_mesh_socket_source_guard,
        "runtimeAdmissionSourceGuard": runtime_admission_source_guard,
        "staticMeshMaterialBindingPreparation": material_binding_preparation,
        "staticMeshSocketPreparation": socket_preparation,
        "staticMeshCollisionlessPreparation": static_mesh_preparation,
        "animationCompressionPreparation": compression_preparation,
        "sourceContract": source_contract,
        "sharedSkeleton": skeleton_before,
        "prop": prop_status,
        "material": material_status,
        "animation": animation_status,
        "materialMetadata": material_metadata,
        "destinationInventory": inventory,
        "acceptedAssetPreservation": {
            "facialBefore": facial_before,
            "skinBefore": skin_before,
            "checks": preservation_checks,
            "passed": all(preservation_checks.values()),
        },
        "runtimeContract": {
            "route": "-ShiCouncilWetRegisterInteractionReview",
            "campaignNode": "rain-order",
            "speakerIdentity": "chen-sheng",
            "speakerSlot": "speaker",
            "leftOwnerBone": "hand_l",
            "rightContactBone": "hand_r",
            "propRuntimeScaleCompensation": 0.01,
            "propNeverReparented": True,
            "terminalClampSeconds": 4.0,
            "looping": False,
            "semanticSamples": [dict(item) for item in SEMANTIC_SAMPLES],
            "contactMeasurements": EXPECTED_CONTACT_MEASUREMENTS,
            "storyContinuity": source_contract["storyContinuity"],
            "timingBoundary": source_contract["timingBoundary"],
            "watchedSourceVisualDecision": source_contract[
                "watchedSourceVisualDecision"
            ],
        },
        "authorityBoundary": {
            "reviewOnly": True,
            "conditionalEngineeringSourceDecisionOnly": True,
            "engineAdmission": False,
            "visibleHandMeshReview": False,
            "playerOwnershipContinuityReviewApproved": False,
            "humanHistoricalCulturalReviewApproved": False,
            "humanAnatomyReviewApproved": False,
            "humanCinematicReviewApproved": False,
            "historicalPropAuthentication": False,
            "finalHandAnimation": False,
            "closeCameraApproved": False,
            "campaign": False,
            "choice": False,
            "input": False,
            "save": False,
            "replication": False,
            "physics": False,
            "collision": False,
            "navigation": False,
            "voice": False,
            "lipSync": False,
            "audio": False,
        },
        "limitations": [
            "Texture-free abstract prop and generic hand-performance engineering proof only.",
            "The 0.01 UFbxStaticMeshImportData scale is solely an FBX-to-Unreal unit correction that restores the frozen 32 x 14 x 2 cm asset bounds; it does not change source geometry, marker/world coordinates or runtime component-scale authority.",
            "The interaction is SHI-authored dramatization, not an attested council, quotation or surviving Qin register.",
            "The Keeper/player owns the register before this clip; an offscreen Keeper-to-Chen handoff is assumed, not shown, and the two-rig transfer remains deferred.",
            "Source visual review is conditional engineering acceptance only; player-ownership continuity and completion of the story beat remain unapproved.",
            "No final hand anatomy, skin, sleeve contact, wet response, inner mouth, voice, lip sync or close framing.",
            "Human historical-material, cultural-performance, anatomy, animation, cinematic, accessibility and localization review remain required.",
            "This asset package cannot mutate campaign truth, choices or saves and cannot own input, physics, navigation or replication.",
        ],
    }
    report["passed"] = (
        static_material_binding_source_guard["passed"]
        and static_mesh_import_source_guard["passed"]
        and static_mesh_import_correction["passed"]
        and static_mesh_socket_source_guard["passed"]
        and runtime_admission_source_guard["passed"]
        and material_binding_preparation["passed"]
        and socket_preparation["passed"]
        and static_mesh_preparation["passed"]
        and compression_preparation["passed"]
        and source_contract["passed"]
        and prop_status["passed"]
        and material_status["passed"]
        and animation_status["passed"]
        and material_metadata["passed"]
        and inventory["passed"]
        and report["acceptedAssetPreservation"]["passed"]
    )

    if replace and report["passed"]:
        if not unreal.EditorAssetLibrary.save_directory(
            DESTINATION, only_if_is_dirty=False, recursive=True
        ):
            raise RuntimeError(f"Could not save exact isolated target: {DESTINATION}")
        report["saved"] = True
    else:
        report["saved"] = False

    tracked_files = relative_file_receipts(destination_disk_root)
    expected_files = {
        f"{PROP_NAME}.uasset",
        f"{MATERIAL_NAME}.uasset",
        f"{ANIMATION_NAME}.uasset",
    }
    tracked_checks = {
        "exactThreeUassetsNoDiskExtras": set(tracked_files) == expected_files
        and len(tracked_files) == 3,
        "allHashesNonEmpty": all(
            item["bytes"] > 0 and len(item["sha256"]) == 64
            for item in tracked_files.values()
        ),
    }
    report["trackedUnrealAssets"] = {
        "root": str(destination_disk_root.relative_to(repository)).replace("\\", "/"),
        "receipts": tracked_files,
        "checks": tracked_checks,
        "passed": all(tracked_checks.values()),
    }
    report["embeddedMetadataPrivacy"] = embedded_metadata_privacy_status(
        destination_disk_root, repository
    )

    facial_saved = relative_file_receipts(
        package_disk_root(project_dir, FACIAL_DESTINATION)
    )
    skin_saved = relative_file_receipts(
        package_disk_root(project_dir, SKIN_DESTINATION)
    )
    _, skeleton_saved = validate_shared_skeleton(project_dir)
    saved_preservation = (
        facial_saved == facial_before["diskReceipts"]
        and skin_saved == skin_before["diskReceipts"]
        and skeleton_saved["package"] == skeleton_before["package"]
        and skeleton_saved["referencePose"] == skeleton_before["referencePose"]
    )
    report["acceptedAssetPreservation"]["checks"][
        "acceptedHashesUnchangedAfterDestinationSave"
    ] = saved_preservation
    report["acceptedAssetPreservation"]["passed"] = (
        report["acceptedAssetPreservation"]["passed"] and saved_preservation
    )
    report["passed"] = (
        report["passed"]
        and report["trackedUnrealAssets"]["passed"]
        and report["embeddedMetadataPrivacy"]["passed"]
        and report["acceptedAssetPreservation"]["passed"]
    )

    current_run_passed = report["passed"]
    if not replace:
        if previous_import_report is None or immutable_import_root_sha256 is None:
            raise RuntimeError("Inspect-only lost its canonical import receipt")
        previous_receipts = previous_import_report.get("trackedUnrealAssets", {}).get(
            "receipts", {}
        )
        hashes_unchanged = previous_receipts == tracked_files
        static_mesh_import_inspection_passed = (
            static_mesh_import_source_guard["passed"] is True
            and static_mesh_import_source_guard["importUniformScale"]
            == PROP_STATIC_MESH_IMPORT_UNIFORM_SCALE
            and static_mesh_import_source_guard["convertScene"] is True
            and static_mesh_import_source_guard["convertSceneUnit"] is True
            and static_mesh_import_source_guard["purpose"]
            == PROP_STATIC_MESH_IMPORT_SCALE_PURPOSE
            and static_mesh_import_source_guard["runtimeScaleAuthority"] is False
            and static_mesh_import_correction["runtimeScaleAuthority"] is False
            and static_mesh_import_correction[
                "runtimeComponentScaleContractChanged"
            ]
            is False
            and static_mesh_import_correction["sourceGeometryChanged"] is False
            and static_mesh_import_correction["markerOrWorldScaleChanged"] is False
            and static_mesh_import_correction["assetBoundsReadbackPassed"] is True
            and static_mesh_import_correction["passed"] is True
        )
        material_binding_inspection_passed = (
            material_binding_preparation["expectedSlot"] == MATERIAL_NAME
            and material_binding_preparation["configuration"][
                "mutationAuthorized"
            ]
            is False
            and material_binding_preparation["configuration"]["invoked"] is False
            and material_binding_preparation["configuration"][
                "skippedInInspectOnly"
            ]
            is True
            and material_binding_preparation["configuration"][
                "postconditionsValidatedByCpp"
            ]
            is False
            and material_binding_preparation["configuration"]["result"] == ""
            and material_binding_preparation["configuration"]["passed"] is True
            and material_binding_preparation["validation"]["invoked"] is True
            and material_binding_preparation["validation"][
                "readOnlyConstNativeValidation"
            ]
            is True
            and material_binding_preparation["validation"][
                "exactSingleBindingIncludingImportedSlotValidatedByCpp"
            ]
            is True
            and material_binding_preparation["validation"]["result"] == ""
            and material_binding_preparation["validation"]["passed"] is True
            and material_binding_preparation["passed"] is True
            and prop_status["checks"]["exactOneClayMaterialBinding"] is True
            and prop_status["checks"]["exactMaterialSlotName"] is True
            and prop_status["checks"]["exactImportedMaterialSlotName"] is True
        )
        socket_inspection_passed = (
            socket_preparation["configuration"]["mutationAuthorized"] is False
            and socket_preparation["configuration"]["invoked"] is False
            and socket_preparation["configuration"]["skippedInInspectOnly"] is True
            and socket_preparation["configuration"]["result"] == ""
            and socket_preparation["configuration"]["passed"] is True
            and socket_preparation["validation"]["invoked"] is True
            and socket_preparation["validation"]["readOnlyConstNativeValidation"]
            is True
            and socket_preparation["validation"][
                "exactCountOrderNoExtrasValidatedByCpp"
            ]
            is True
            and socket_preparation["validation"]["findSocketIdentityValidatedByCpp"]
            is True
            and socket_preparation["validation"]["result"] == ""
            and socket_preparation["validation"]["passed"] is True
            and prop_status["checks"]["allThreeKnownSocketsIndependentlyFoundAndExact"]
            is True
        )
        inspection_passed = (
            report["passed"]
            and hashes_unchanged
            and static_mesh_import_inspection_passed
            and material_binding_inspection_passed
            and socket_inspection_passed
        )
        read_only_inspection = {
            "mode": "inspect-only",
            "mutationAuthorized": False,
            "inspectionProcessId": os.getpid(),
            "distinctFromImportProcess": previous_import_report.get("importProcessId")
            != os.getpid(),
            "sourceContractPassed": source_contract["passed"],
            "propPassed": prop_status["passed"],
            "propStaticMeshImportSourceGuardPassed": (
                static_mesh_import_source_guard["passed"]
            ),
            "propStaticMeshFbxToUnrealImportUniformScale": (
                static_mesh_import_source_guard["importUniformScale"]
            ),
            "propStaticMeshConvertSceneEnabled": static_mesh_import_source_guard[
                "convertScene"
            ],
            "propStaticMeshConvertSceneUnitEnabled": static_mesh_import_source_guard[
                "convertSceneUnit"
            ],
            "propStaticMeshImportCorrectionPurpose": (
                static_mesh_import_source_guard["purpose"]
            ),
            "propStaticMeshImportCorrectionHasNoRuntimeScaleAuthority": (
                not static_mesh_import_source_guard["runtimeScaleAuthority"]
            ),
            "propStaticMeshImportedBoundsExact": static_mesh_import_correction[
                "assetBoundsReadbackPassed"
            ],
            "propStaticMeshImportInspectionReceiptPassed": (
                static_mesh_import_inspection_passed
            ),
            "propMaterialSlotNamesExact": prop_status["checks"]["exactMaterialSlotName"]
            and prop_status["checks"]["exactImportedMaterialSlotName"],
            "propMaterialBindingSourceGuardPassed": (
                static_material_binding_source_guard["passed"]
            ),
            "propMaterialBindingConfigurationSkippedInInspectOnly": (
                material_binding_preparation["configuration"][
                    "skippedInInspectOnly"
                ]
            ),
            "propMaterialBindingNativeConstValidationInvoked": (
                material_binding_preparation["validation"]["invoked"]
            ),
            "propMaterialBindingIncludingImportedSlotValidatedByCpp": (
                material_binding_preparation["validation"][
                    "exactSingleBindingIncludingImportedSlotValidatedByCpp"
                ]
            ),
            "propMaterialBindingIndependentReflectedReadbackPassed": (
                prop_status["checks"]["exactOneClayMaterialBinding"]
                and prop_status["checks"]["exactMaterialSlotName"]
                and prop_status["checks"]["exactImportedMaterialSlotName"]
            ),
            "propMaterialBindingInspectionReceiptPassed": (
                material_binding_inspection_passed
            ),
            "propSocketSourceGuardPassed": static_mesh_socket_source_guard["passed"],
            "propSocketConfigurationSkippedInInspectOnly": socket_preparation[
                "configuration"
            ]["skippedInInspectOnly"],
            "propSocketNativeConstValidationInvoked": socket_preparation["validation"][
                "invoked"
            ],
            "propSocketNativeExactCountOrderNoExtrasValidated": socket_preparation[
                "validation"
            ]["exactCountOrderNoExtrasValidatedByCpp"],
            "propSocketIndependentKnownNameReadbackPassed": prop_status["checks"][
                "allThreeKnownSocketsIndependentlyFoundAndExact"
            ],
            "propSocketInspectionReceiptPassed": socket_inspection_passed,
            "propCollisionNavigationReadbackPassed": prop_status["checks"][
                "noSimpleOrConvexCollision"
            ]
            and prop_status["checks"]["perPolyCollisionDisabled"]
            and prop_status["checks"]["navigationDataDisabled"],
            "materialPassed": material_status["passed"],
            "animationPassed": animation_status["passed"],
            "compressedRuntimeDataValid": animation_status["checks"][
                "compressedRuntimeDataValid"
            ],
            "compressedPoseEvaluationExplicit": animation_status["checks"][
                "compressedPoseEvaluationExplicit"
            ],
            "all121By53TransformsResampled": animation_status["sampleInspection"][
                "passed"
            ],
            "destinationInventoryPassed": inventory["passed"],
            "acceptedFacialSkinSkeletonHashesUnchanged": report[
                "acceptedAssetPreservation"
            ]["passed"],
            "trackedUassetHashesUnchanged": hashes_unchanged,
            "embeddedMetadataPrivacyPassed": report["embeddedMetadataPrivacy"][
                "passed"
            ],
            "exitCode": 0 if inspection_passed else 1,
            "passed": inspection_passed,
        }
        previous_import_report["readOnlyInspection"] = read_only_inspection
        preserved_root_sha256 = import_receipt_root_sha256(previous_import_report)
        import_root_preserved = preserved_root_sha256 == immutable_import_root_sha256
        read_only_inspection["immutableImportReceiptRootSha256"] = (
            immutable_import_root_sha256
        )
        read_only_inspection["canonicalImportReceiptRootPreserved"] = (
            import_root_preserved
        )
        read_only_inspection["passed"] = (
            read_only_inspection["passed"] and import_root_preserved
        )
        read_only_inspection["exitCode"] = 0 if read_only_inspection["passed"] else 1
        current_run_passed = read_only_inspection["passed"]
        report = previous_import_report

    report_path = write_report(repository, report)
    unreal.log(
        "SHI_DAZE_COUNCIL_WET_REGISTER_INTERACTION_REPORT "
        f"{json.dumps(report, sort_keys=True)}"
    )
    unreal.log(f"SHI_DAZE_COUNCIL_WET_REGISTER_INTERACTION_EVIDENCE {report_path}")
    if not current_run_passed:
        raise RuntimeError(
            f"Daze council wet-register interaction Unreal admission failed: {report}"
        )


main()
