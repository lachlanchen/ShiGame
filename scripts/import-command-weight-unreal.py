import json
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-command-weight-v1"
DESTINATION = "/Game/SHI/Art/Props/CommandWeight"
ASSET_NAME = "SM_SHI_CommandWeight_01"
ASSET_PATH = f"{DESTINATION}/{ASSET_NAME}"


def vector_values(vector) -> list[float]:
    return [float(vector.x), float(vector.y), float(vector.z)]


def import_base_mesh(source: Path) -> tuple[unreal.StaticMesh, list[str], bool]:
    if unreal.EditorAssetLibrary.does_asset_exist(ASSET_PATH):
        if os.environ.get("SHI_COMMAND_WEIGHT_REIMPORT") == "1":
            if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
                raise RuntimeError(f"Could not replace isolated target: {DESTINATION}")
        else:
            mesh = unreal.EditorAssetLibrary.load_asset(ASSET_PATH)
            if not isinstance(mesh, unreal.StaticMesh):
                raise RuntimeError(f"Existing isolated target is not a StaticMesh: {ASSET_PATH}")
            return mesh, list(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True)), False

    options = unreal.FbxImportUI()
    options.automated_import_should_detect_type = False
    options.import_mesh = True
    options.import_as_skeletal = False
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_STATIC_MESH
    options.original_import_type = unreal.FBXImportType.FBXIT_STATIC_MESH
    options.import_materials = True
    options.import_textures = False
    options.import_animations = False
    mesh_options = options.static_mesh_import_data
    mesh_options.set_editor_property("combine_meshes", True)
    mesh_options.set_editor_property("auto_generate_collision", False)
    mesh_options.set_editor_property("one_convex_hull_per_ucx", True)
    mesh_options.set_editor_property("remove_degenerates", True)
    mesh_options.set_editor_property("generate_lightmap_u_vs", False)
    mesh_options.set_editor_property("convert_scene", True)
    mesh_options.set_editor_property("convert_scene_unit", True)

    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = ASSET_NAME
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    mesh = unreal.EditorAssetLibrary.load_asset(ASSET_PATH)
    if not isinstance(mesh, unreal.StaticMesh):
        raise RuntimeError(f"Expected one combined StaticMesh at {ASSET_PATH}; imported {imported_paths}")
    return mesh, imported_paths, True


def inspect_mesh(mesh: unreal.StaticMesh, imported_paths: list[str]) -> dict:
    subsystem = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    bounds = mesh.get_bounding_box()
    minimum = vector_values(bounds.min)
    maximum = vector_values(bounds.max)
    dimensions = [maximum[index] - minimum[index] for index in range(3)]
    lod_count = subsystem.get_lod_count(mesh)
    lod_triangles = [int(mesh.get_num_triangles(index)) for index in range(lod_count)]
    lod_vertices = [int(subsystem.get_number_verts(mesh, index)) for index in range(lod_count)]
    lod_uv_channels = [int(subsystem.get_num_uv_channels(mesh, index)) for index in range(lod_count)]
    material_slots = [
        {
            "slot": str(slot.material_slot_name),
            "material": slot.material_interface.get_path_name() if slot.material_interface else None,
        }
        for slot in mesh.static_materials
    ]
    simple_collision_count = int(subsystem.get_simple_collision_count(mesh))
    convex_collision_count = int(subsystem.get_convex_collision_count(mesh))
    lod_screen_sizes = [float(value) for value in subsystem.get_lod_screen_sizes(mesh)]
    checks = {
        "assetPath": mesh.get_path_name() == f"{ASSET_PATH}.{ASSET_NAME}",
        "lodCount": lod_count == 2,
        "lodTriangles": lod_triangles == [3256, 1384],
        "lodReduction": lod_triangles[1] < lod_triangles[0] if lod_count == 2 else False,
        "materialSlots": {entry["slot"] for entry in material_slots}
        == {"M_SHI_RiverStone", "M_SHI_WorkedBronze"},
        "twoMaterials": len(material_slots) == 2 and all(entry["material"] for entry in material_slots),
        "uv0AndLightmapUv": all(count >= 2 for count in lod_uv_channels),
        "customConvexCollision": simple_collision_count == 0 and convex_collision_count == 1,
        "centimeterScale": (
            8.30 <= dimensions[0] <= 8.70
            and 5.40 <= dimensions[1] <= 5.70
            and 3.30 <= dimensions[2] <= 3.60
        ),
        "bottomPivot": -0.40 <= minimum[2] <= 0.40,
    }
    return {
        "assetId": ASSET_ID,
        "engine": {
            "version": unreal.SystemLibrary.get_engine_version(),
            "project": unreal.Paths.get_project_file_path(),
        },
        "assetPath": mesh.get_path_name(),
        "importedObjectPaths": imported_paths,
        "boundsCentimeters": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": dimensions,
        },
        "lodCount": lod_count,
        "lodTriangles": lod_triangles,
        "lodVertices": lod_vertices,
        "lodUvChannels": lod_uv_channels,
        "lodScreenSizes": lod_screen_sizes,
        "materialSlots": material_slots,
        "simpleCollisionCount": simple_collision_count,
        "convexCollisionCount": convex_collision_count,
        "naniteEnabled": bool(mesh.get_editor_property("nanite_settings").enabled),
        "lightMapResolution": int(mesh.get_editor_property("light_map_resolution")),
        "lightMapCoordinateIndex": int(mesh.get_editor_property("light_map_coordinate_index")),
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    source_root = repository / "assets" / "3d" / "export"
    lod0_source = source_root / f"{ASSET_ID}.fbx"
    lod1_source = source_root / f"{ASSET_ID}-lod1.fbx"
    if not lod0_source.is_file() or not lod1_source.is_file():
        raise FileNotFoundError(f"Missing reviewed FBX source: {lod0_source} or {lod1_source}")

    mesh, imported_paths, imported_now = import_base_mesh(lod0_source)
    if imported_now:
        subsystem = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
        if subsystem.get_lod_count(mesh) < 2:
            imported_lod = subsystem.import_lod(mesh, 1, str(lod1_source))
            if imported_lod != 1:
                raise RuntimeError(f"LOD1 import returned {imported_lod}")
        if not subsystem.set_lod_screen_sizes(mesh, [1.0, 0.15]):
            raise RuntimeError("Could not set deterministic LOD screen sizes")
        mesh.set_editor_property("light_map_resolution", 64)
        mesh.set_editor_property("light_map_coordinate_index", 1)
        unreal.EditorAssetLibrary.save_loaded_asset(mesh, only_if_is_dirty=False)
        unreal.EditorAssetLibrary.save_directory(DESTINATION, only_if_is_dirty=False, recursive=True)

    report = inspect_mesh(mesh, imported_paths)
    report["mode"] = "import-replace" if imported_now else "inspect-only"
    report["sources"] = {
        "lod0Fbx": str(lod0_source),
        "lod1Fbx": str(lod1_source),
    }
    report_path = project_dir / "Saved" / "Automation" / "shi-command-weight-unreal-import.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_COMMAND_WEIGHT_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError(f"Command-weight Unreal admission failed: {report['checks']}")


main()
