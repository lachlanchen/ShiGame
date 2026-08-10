"""Import or inspect SHI's reviewed Daze rain streak and ripple meshes.

The default mode is read-only inspection. Set SHI_DAZE_RAIN_VFX_REIMPORT=1
only to replace the exact isolated destination with the reviewed FBX exports.
"""

import json
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-daze-rain-vfx-v1"
DESTINATION = "/Game/SHI/Art/VFX/DazeRain"
CONTRACTS = {
    "streak": {
        "name": "SM_SHI_RainStreak_01",
        "source": "streak",
        "triangles": [12, 6],
        "minimum": [-0.6, -0.6, 0.0],
        "maximum": [0.6, 0.6, 100.0],
        "material": "M_SHI_RainStreak",
        "screen": 0.10,
    },
    "ripple": {
        "name": "SM_SHI_RainRipple_01",
        "source": "ripple",
        "triangles": [288, 64],
        "minimum": [-50.0, -50.0, 0.0],
        "maximum": [50.0, 50.0, 0.0],
        "material": "M_SHI_RainRipple",
        "screen": 0.15,
    },
}


def asset_path(contract: dict) -> str:
    return f"{DESTINATION}/{contract['name']}"


def vector_values(vector) -> list[float]:
    return [float(vector.x), float(vector.y), float(vector.z)]


def close_vector(actual: list[float], expected: list[float], tolerance: float = 0.08) -> bool:
    return all(abs(actual[index] - expected[index]) <= tolerance for index in range(3))


def import_mesh(contract: dict, source: Path) -> tuple[unreal.StaticMesh, list[str]]:
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
    mesh_options.set_editor_property("remove_degenerates", True)
    mesh_options.set_editor_property("generate_lightmap_u_vs", False)
    mesh_options.set_editor_property("convert_scene", True)
    mesh_options.set_editor_property("convert_scene_unit", True)
    mesh_options.set_editor_property("vertex_color_import_option", unreal.VertexColorImportOption.REPLACE)
    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = contract["name"]
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = unreal.FbxFactory()
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    mesh = unreal.EditorAssetLibrary.load_asset(asset_path(contract))
    if not isinstance(mesh, unreal.StaticMesh):
        raise RuntimeError(f"Expected StaticMesh {asset_path(contract)}; imported {task.imported_object_paths}")
    return mesh, list(task.get_editor_property("imported_object_paths"))


def inspect_mesh(role: str, mesh: unreal.StaticMesh, imported_paths: list[str]) -> dict:
    contract = CONTRACTS[role]
    subsystem = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    bounds = mesh.get_bounding_box()
    minimum = vector_values(bounds.min)
    maximum = vector_values(bounds.max)
    lod_count = subsystem.get_lod_count(mesh)
    lod_triangles = [int(mesh.get_num_triangles(index)) for index in range(lod_count)]
    lod_uv_channels = [int(subsystem.get_num_uv_channels(mesh, index)) for index in range(lod_count)]
    lod_screen_sizes = [float(value) for value in subsystem.get_lod_screen_sizes(mesh)]
    material_slots = [
        {
            "slot": str(slot.material_slot_name),
            "material": slot.material_interface.get_path_name() if slot.material_interface else None,
        }
        for slot in mesh.static_materials
    ]
    simple_collision_count = int(subsystem.get_simple_collision_count(mesh))
    convex_collision_count = int(subsystem.get_convex_collision_count(mesh))
    nanite_enabled = bool(mesh.get_editor_property("nanite_settings").enabled)
    checks = {
        "assetPath": mesh.get_path_name() == f"{asset_path(contract)}.{contract['name']}",
        "lodCount": lod_count == 2,
        "lodTriangles": lod_triangles == contract["triangles"],
        "lodReduction": lod_count == 2 and lod_triangles[1] < lod_triangles[0],
        "lodScreenSizes": len(lod_screen_sizes) == 2
        and abs(lod_screen_sizes[0] - 1.0) <= 1e-5
        and abs(lod_screen_sizes[1] - contract["screen"]) <= 1e-5,
        "materialSlot": len(material_slots) == 1
        and material_slots[0]["slot"] == contract["material"]
        and bool(material_slots[0]["material"]),
        "uv0AndLightmapUv": all(count >= 2 for count in lod_uv_channels),
        "noCollisionGeometry": simple_collision_count == 0 and convex_collision_count == 0,
        "exactCentimeterBounds": close_vector(minimum, contract["minimum"])
        and close_vector(maximum, contract["maximum"]),
        "lightmapContract": int(mesh.get_editor_property("light_map_coordinate_index")) == 1
        and int(mesh.get_editor_property("light_map_resolution")) == 64,
        "naniteDeliberatelyOff": not nanite_enabled,
    }
    return {
        "assetPath": mesh.get_path_name(),
        "importedObjectPaths": imported_paths,
        "boundsCentimeters": {"minimum": minimum, "maximum": maximum},
        "lodCount": lod_count,
        "lodTriangles": lod_triangles,
        "lodUvChannels": lod_uv_channels,
        "lodScreenSizes": lod_screen_sizes,
        "materialSlots": material_slots,
        "simpleCollisionCount": simple_collision_count,
        "convexCollisionCount": convex_collision_count,
        "naniteEnabled": nanite_enabled,
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    source_root = repository / "assets" / "3d" / "export"
    replace = os.environ.get("SHI_DAZE_RAIN_VFX_REIMPORT") == "1"
    existing = [unreal.EditorAssetLibrary.does_asset_exist(asset_path(contract)) for contract in CONTRACTS.values()]
    if replace and any(existing):
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(f"Could not replace isolated target: {DESTINATION}")
        existing = [False, False]
    if not replace and any(existing) and not all(existing):
        raise RuntimeError("Daze rain destination is partial; explicit isolated reimport is required")

    meshes = {}
    imported_paths = {}
    subsystem = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    for role, contract in CONTRACTS.items():
        lod0 = source_root / f"{ASSET_ID}-{contract['source']}-lod0.fbx"
        lod1 = source_root / f"{ASSET_ID}-{contract['source']}-lod1.fbx"
        if not lod0.is_file() or not lod1.is_file():
            raise FileNotFoundError(f"Missing reviewed FBX source: {lod0} or {lod1}")
        mesh = unreal.EditorAssetLibrary.load_asset(asset_path(contract)) if all(existing) else None
        imported_paths[role] = list(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True)) if mesh else []
        if not isinstance(mesh, unreal.StaticMesh):
            mesh, imported_paths[role] = import_mesh(contract, lod0)
            imported_lod = subsystem.import_lod(mesh, 1, str(lod1))
            if imported_lod != 1:
                raise RuntimeError(f"{role} LOD1 import returned {imported_lod}")
            mesh.set_editor_property("light_map_resolution", 64)
            mesh.set_editor_property("light_map_coordinate_index", 1)
            nanite = mesh.get_editor_property("nanite_settings")
            nanite.enabled = False
            mesh.set_editor_property("nanite_settings", nanite)
            if not subsystem.set_lod_screen_sizes(mesh, [1.0, contract["screen"]]):
                raise RuntimeError(f"Could not set deterministic {role} LOD screen sizes")
            unreal.EditorAssetLibrary.save_loaded_asset(mesh, only_if_is_dirty=False)
        meshes[role] = mesh
    if replace or not all(existing):
        unreal.EditorAssetLibrary.save_directory(DESTINATION, only_if_is_dirty=False, recursive=True)
    report = {
        "assetId": ASSET_ID,
        "mode": "import-replace" if replace or not all(existing) else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "meshes": {
            role: inspect_mesh(role, mesh, imported_paths[role]) for role, mesh in meshes.items()
        },
    }
    report["passed"] = all(entry["passed"] for entry in report["meshes"].values())
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-rain-vfx-unreal-import.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_RAIN_VFX_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError(f"Daze rain Unreal admission failed: {report}")


main()
