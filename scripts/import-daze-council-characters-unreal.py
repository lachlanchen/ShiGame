"""Import or inspect SHI's five reviewed Daze council skeletal blockouts.

Inspection is the default and is read-only. Set
SHI_DAZE_COUNCIL_CHARACTERS_REIMPORT=1 only to replace the exact isolated
destination with the five validated FBX exports. The importer deliberately
creates no physics asset, animation, texture, morph-target or rigid-mesh path.
"""

import json
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-daze-council-characters-v1"
DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"
SKELETON_NAME = "SK_SHI_DazeCouncil_Skeleton"
SKELETON_PATH = f"{DESTINATION}/{SKELETON_NAME}"
DISCLOSURE = (
    "SKELETAL COUNCIL CHARACTER PRODUCTION BLOCKOUT · GENERIC PRACTICAL LAYERS · "
    "NOT AN EXACT 209 BCE COSTUME OR PORTRAIT RECONSTRUCTION"
)
PRESENTATION_SCALE = 100.0
CHARACTERS = (
    ("keeper", "Keeper", 27668),
    ("chen-sheng", "ChenSheng", 27664),
    ("wu-guang", "WuGuang", 27508),
    ("yu-mu", "YuMu", 27656),
    ("qin-courier", "QinCourier", 27668),
)
BONE_NAMES = (
    "Root", "pelvis", "spine_01", "spine_02", "spine_03", "clavicle_l",
    "upperarm_l", "lowerarm_l", "hand_l", "index_01_l", "index_02_l", "index_03_l",
    "middle_01_l", "middle_02_l", "middle_03_l", "pinky_01_l", "pinky_02_l",
    "pinky_03_l", "ring_01_l", "ring_02_l", "ring_03_l", "thumb_01_l", "thumb_02_l",
    "thumb_03_l", "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r", "index_01_r",
    "index_02_r", "index_03_r", "middle_01_r", "middle_02_r", "middle_03_r",
    "pinky_01_r", "pinky_02_r", "pinky_03_r", "ring_01_r", "ring_02_r", "ring_03_r",
    "thumb_01_r", "thumb_02_r", "thumb_03_r", "neck_01", "head", "thigh_l",
    "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r",
)


def asset_name(suffix: str) -> str:
    return f"SKM_SHI_DazeCouncil_{suffix}_01"


def asset_path(suffix: str) -> str:
    name = asset_name(suffix)
    return f"{DESTINATION}/{name}"


def object_path(value: unreal.Object) -> str:
    return value.get_path_name().split(".", 1)[0]


def load_mesh(suffix: str):
    mesh = unreal.EditorAssetLibrary.load_asset(asset_path(suffix))
    return mesh if isinstance(mesh, unreal.SkeletalMesh) else None


def import_mesh(source: Path, suffix: str, skeleton):
    options = unreal.FbxImportUI()
    options.automated_import_should_detect_type = False
    options.import_mesh = True
    options.import_as_skeletal = True
    options.import_rigid_mesh = False
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_SKELETAL_MESH
    options.original_import_type = unreal.FBXImportType.FBXIT_SKELETAL_MESH
    options.override_full_name = True
    options.import_materials = True
    options.import_textures = False
    options.import_animations = False
    options.create_physics_asset = False
    options.physics_asset = None
    options.skeleton = skeleton

    mesh_options = options.skeletal_mesh_import_data
    mesh_options.set_editor_property("convert_scene", True)
    # The reviewed FBX payload is already numeric centimetres. Unreal 5.8's
    # legacy skeletal importer otherwise applies its scene-unit conversion a
    # second time and collapses a 170 cm figure to 1.70 cm.
    mesh_options.set_editor_property("convert_scene_unit", False)
    mesh_options.set_editor_property("force_front_x_axis", False)
    # The engine-ready FBX has the metre->centimetre conversion baked by the
    # deterministic exporter; actor and import scale therefore remain identity.
    mesh_options.set_editor_property("import_uniform_scale", 1.0)
    mesh_options.set_editor_property("import_mesh_lods", False)
    mesh_options.set_editor_property("reorder_material_to_fbx_order", True)
    mesh_options.set_editor_property("transform_vertex_to_absolute", False)
    mesh_options.set_editor_property("bake_pivot_in_vertex", False)
    # Preserve the explicitly recalculated Blender/FBX vertex normals. Letting
    # the legacy skeletal importer recompute them produced severe dark facial
    # and hand patches in the in-engine council lighting even though the same
    # FBX rendered cleanly when round-tripped through Blender.
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
    if mesh.get_editor_property("physics_asset") is not None:
        raise RuntimeError(f"{asset_name(suffix)} unexpectedly acquired a PhysicsAsset")
    return mesh, imported_paths


def skeleton_bone_names(skeleton) -> list[str]:
    return [str(name) for name in skeleton.get_reference_pose().get_bone_names()]


def skeleton_reference_pose_count(skeleton) -> int:
    return len(skeleton_bone_names(skeleton))


def inspect_mesh(character_id: str, suffix: str, expected_triangles: int, mesh, imported_paths: list[str]) -> dict:
    skeleton = mesh.get_editor_property("skeleton")
    # Unreal's Blender-compatibility path strips the Armature root transform,
    # retaining the reviewed metre-valued coordinates as asset-local units.
    # The council component therefore carries one explicit x100 presentation
    # scale, which is validated here and again in the runtime model.
    bounds = mesh.get_bounds()
    extent = bounds.box_extent
    dimensions = [float(extent.x * 2.0), float(extent.y * 2.0), float(extent.z * 2.0)]
    materials = []
    for slot in mesh.get_editor_property("materials"):
        interface = slot.material_interface
        materials.append({
            "slot": str(slot.material_slot_name),
            "material": interface.get_path_name() if interface else None,
        })
    expected_skeleton = f"{SKELETON_PATH}.{SKELETON_NAME}"
    checks = {
        "assetPath": mesh.get_path_name() == f"{asset_path(suffix)}.{asset_name(suffix)}",
        "sharedSkeleton": bool(skeleton) and skeleton.get_path_name() == expected_skeleton,
        "exactReferencePoseBones": bool(skeleton) and skeleton_bone_names(skeleton) == list(BONE_NAMES),
        "rootAndPelvisRelationship": str(mesh.get_bone_parent("pelvis")) == "Root",
        "sourceTriangleContract": expected_triangles < 28000,
        "presentedPhysicalHeight": 155.0 <= max(dimensions) * PRESENTATION_SCALE <= 183.0,
        "boundedMaterials": 4 <= len(materials) <= 6 and all(item["material"] for item in materials),
        "noPhysicsAsset": mesh.get_editor_property("physics_asset") is None,
        "noMorphTargets": len(mesh.get_all_morph_target_names()) == 0,
    }
    return {
        "characterId": character_id,
        "assetPath": mesh.get_path_name(),
        "importedObjectPaths": imported_paths,
        "sourceTriangles": expected_triangles,
        "assetLocalBounds": {
            "origin": [float(bounds.origin.x), float(bounds.origin.y), float(bounds.origin.z)],
            "dimensions": dimensions,
            "sphereRadius": float(bounds.sphere_radius),
        },
        "presentationScale": PRESENTATION_SCALE,
        "normalImportMethod": "FBXNIM_IMPORT_NORMALS",
        "presentedDimensionsCentimeters": [value * PRESENTATION_SCALE for value in dimensions],
        "materials": materials,
        "skeleton": skeleton.get_path_name() if skeleton else None,
        "referencePoseBoneCount": skeleton_reference_pose_count(skeleton) if skeleton else 0,
        "referencePoseBones": skeleton_bone_names(skeleton) if skeleton else [],
        "physicsAsset": (
            mesh.get_editor_property("physics_asset").get_path_name()
            if mesh.get_editor_property("physics_asset") else None
        ),
        "morphTargets": list(mesh.get_all_morph_target_names()),
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    source_root = repository / "assets" / "3d" / "export"
    replace = os.environ.get("SHI_DAZE_COUNCIL_CHARACTERS_REIMPORT") == "1"
    expected_paths = [asset_path(suffix) for _, suffix, _ in CHARACTERS]
    existing = [unreal.EditorAssetLibrary.does_asset_exist(path) for path in expected_paths]
    skeleton_exists = unreal.EditorAssetLibrary.does_asset_exist(SKELETON_PATH)

    if replace and (any(existing) or skeleton_exists):
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(f"Could not replace isolated target: {DESTINATION}")
        existing = [False] * len(CHARACTERS)
        skeleton_exists = False
    if not replace and (any(existing) or skeleton_exists) and not (all(existing) and skeleton_exists):
        raise RuntimeError("Daze council destination is partial; explicit isolated reimport is required")

    meshes = {}
    imported = {}
    skeleton = unreal.EditorAssetLibrary.load_asset(SKELETON_PATH) if skeleton_exists else None
    imported_now = not all(existing)
    for index, (character_id, suffix, _) in enumerate(CHARACTERS):
        source = source_root / f"{ASSET_ID}-{character_id}.fbx"
        if not source.is_file():
            raise FileNotFoundError(f"Missing validated council FBX source: {source}")
        mesh = load_mesh(suffix) if all(existing) else None
        imported[character_id] = []
        if not mesh:
            mesh, imported[character_id] = import_mesh(source, suffix, skeleton)
            mesh_skeleton = mesh.get_editor_property("skeleton")
            if index == 0:
                if not isinstance(mesh_skeleton, unreal.Skeleton):
                    raise RuntimeError("Keeper import did not create a Skeleton")
                source_skeleton_path = object_path(mesh_skeleton)
                if source_skeleton_path != SKELETON_PATH:
                    if not unreal.EditorAssetLibrary.rename_asset(source_skeleton_path, SKELETON_PATH):
                        raise RuntimeError(
                            f"Could not name shared Skeleton {source_skeleton_path} -> {SKELETON_PATH}"
                        )
                    skeleton = unreal.EditorAssetLibrary.load_asset(SKELETON_PATH)
                else:
                    skeleton = mesh_skeleton
                if not isinstance(skeleton, unreal.Skeleton):
                    raise RuntimeError("Renamed shared Skeleton could not be loaded")
            if mesh.get_editor_property("skeleton") != skeleton:
                raise RuntimeError(
                    f"{asset_name(suffix)} did not bind to the exact admitted shared Skeleton"
                )
            mesh.set_editor_property("physics_asset", None)
            unreal.EditorAssetLibrary.save_loaded_asset(mesh, only_if_is_dirty=False)
        meshes[character_id] = mesh

    if imported_now:
        unreal.EditorAssetLibrary.save_loaded_asset(skeleton, only_if_is_dirty=False)
        unreal.EditorAssetLibrary.save_directory(DESTINATION, only_if_is_dirty=False, recursive=True)

    report = {
        "assetId": ASSET_ID,
        "status": "five-identity skeletal production blockout; not final character art",
        "disclosure": DISCLOSURE,
        "mode": "import-replace" if imported_now else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "destination": DESTINATION,
        "sharedSkeleton": skeleton.get_path_name() if skeleton else None,
        "presentationScale": PRESENTATION_SCALE,
        "characters": {
            character_id: inspect_mesh(
                character_id, suffix, triangles, meshes[character_id], imported[character_id]
            )
            for character_id, suffix, triangles in CHARACTERS
        },
        "trackedAssets": list(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True)),
        "limitations": [
            "Neutral reference pose only; animation admission is separate.",
            "Generic practical layer blockout; not an exact 209 BCE costume reconstruction.",
            "Generic faces; not portraits of historical people.",
            "Wide and medium council staging only; close facial framing remains prohibited.",
            "Unreal's Blender armature compatibility path retains metre-valued local bounds; the admitted council component scale is exactly 100.",
        ],
    }
    report["passed"] = (
        isinstance(skeleton, unreal.Skeleton)
        and skeleton_bone_names(skeleton) == list(BONE_NAMES)
        and all(item["passed"] for item in report["characters"].values())
    )
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-council-characters-unreal-import.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_COUNCIL_CHARACTERS_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError(f"Daze council skeletal admission failed: {report}")


main()
