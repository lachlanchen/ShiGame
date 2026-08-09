import argparse
import json
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


ASSET_ID = "shi-command-surface-v1"
EXPECTED_MATERIALS = {"M_SHI_WetPackedEarth", "M_SHI_DarkWorkedWood"}
EXPECTED_BOUNDS = {
    "minimum": (-2.90, -1.85, -0.02),
    "maximum": (2.90, 1.85, 0.14),
}


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_mesh(path: Path) -> None:
    if path.suffix.lower() == ".glb":
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif path.suffix.lower() == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path), use_anim=False)
    else:
        raise ValueError(f"Unsupported mesh format: {path.suffix}")


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def material_report(material: bpy.types.Material) -> dict:
    principled = material.node_tree.nodes.get("Principled BSDF") if material.use_nodes else None
    return {
        "baseColor": list(principled.inputs["Base Color"].default_value) if principled else None,
        "metallic": float(principled.inputs["Metallic"].default_value) if principled else None,
        "roughness": float(principled.inputs["Roughness"].default_value) if principled else None,
    }


def render_clean_preview(path: Path) -> None:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.0, -0.025))
    floor = bpy.context.object
    floor.scale = (16.0, 16.0, 16.0)
    floor_material = bpy.data.materials.new("M_SHI_CommandSurface_ValidationFloor")
    floor_material.use_nodes = True
    floor_principled = floor_material.node_tree.nodes["Principled BSDF"]
    floor_principled.inputs["Base Color"].default_value = (0.004, 0.006, 0.006, 1.0)
    floor_principled.inputs["Roughness"].default_value = 0.94
    floor.data.materials.append(floor_material)
    bpy.ops.object.camera_add(location=(7.4, -7.8, 4.9))
    camera = bpy.context.object
    camera.data.lens = 56
    aim(camera, Vector((0.0, 0.0, 0.05)))
    bpy.context.scene.camera = camera
    for location, energy, size, color in (
        ((-3.8, -3.2, 5.6), 1250.0, 4.2, (1.0, 0.50, 0.23)),
        ((4.4, -1.0, 4.2), 850.0, 5.0, (0.38, 0.56, 1.0)),
        ((1.8, 5.2, 3.4), 1150.0, 3.4, (0.52, 0.72, 1.0)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, 0.04)))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("SHI_CommandSurface_ValidationWorld")
    scene.world.color = (0.004, 0.006, 0.008)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.15
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def mesh_report(obj: bpy.types.Object) -> dict:
    mesh = obj.data
    mesh.calc_loop_triangles()
    topology = bmesh.new()
    topology.from_mesh(mesh)
    raw_vertices = len(topology.verts)
    # glTF splits hard-normal/UV vertices and stores long-axis coordinates as
    # float32. Weld only sub-10-micrometre interchange noise before evaluating
    # the physical closed surface; this is far below any authored edge change.
    bmesh.ops.remove_doubles(topology, verts=topology.verts, dist=1.0e-5)
    welded_vertices = len(topology.verts)
    non_manifold_edges = sum(1 for edge in topology.edges if not edge.is_manifold)
    inconsistent_edges = sum(
        1 for edge in topology.edges if edge.is_manifold and not edge.is_contiguous
    )
    signed_volume = topology.calc_volume(signed=True)
    topology.free()
    return {
        "name": obj.name,
        "vertices": len(mesh.vertices),
        "weldedVertices": welded_vertices,
        "normalSplitVertices": raw_vertices - welded_vertices,
        "triangles": len(mesh.loop_triangles),
        "uvLayers": len(mesh.uv_layers),
        "materials": [slot.name for slot in mesh.materials if slot],
        "nonManifoldEdges": non_manifold_edges,
        "inconsistentWindingEdges": inconsistent_edges,
        "signedVolume": signed_volume,
        "location": list(obj.location),
        "rotationEuler": list(obj.rotation_euler),
        "scale": list(obj.scale),
    }


def aggregate_bounds(objects: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    points = [
        obj.matrix_world @ Vector(corner)
        for obj in objects
        for corner in obj.bound_box
    ]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return minimum, maximum


def near_vector(actual: list[float], expected: tuple[float, float, float], tolerance: float) -> bool:
    return all(abs(actual[index] - expected[index]) <= tolerance for index in range(3))


def validate_export(
    path: Path,
    expected_lod: str | None,
    expect_collision: bool,
    expected_render_components: int,
    expected_render_names: set[str] | None = None,
    preview_path: Path | None = None,
) -> dict:
    clear_scene()
    import_mesh(path)
    objects = sorted(
        (obj for obj in bpy.context.scene.objects if obj.type == "MESH"),
        key=lambda obj: obj.name,
    )
    render_objects = [obj for obj in objects if not obj.name.startswith("UCX_")]
    collision_objects = [obj for obj in objects if obj.name.startswith("UCX_")]
    minimum, maximum = aggregate_bounds(render_objects)
    dimensions = [maximum[index] - minimum[index] for index in range(3)]
    meshes = [mesh_report(obj) for obj in objects]
    material_names = {
        material
        for mesh in meshes
        if not mesh["name"].startswith("UCX_")
        for material in mesh["materials"]
    }
    render_names = {obj.name for obj in render_objects}
    imported_materials = {
        name: material_report(bpy.data.materials[name])
        for name in sorted(material_names)
    }
    checks = {
        "renderComponentCount": len(render_objects) == expected_render_components,
        "expectedLodNames": all(expected_lod in obj.name for obj in render_objects)
        if expected_lod
        else True,
        "expectedRenderNames": render_names == expected_render_names
        if expected_render_names
        else True,
        "collisionContract": (
            len(collision_objects) == 1
            and collision_objects[0].name == "UCX_SM_SHI_CommandSurface_01_01"
        )
        if expect_collision
        else len(collision_objects) == 0,
        "materialSlots": material_names == EXPECTED_MATERIALS,
        "darkExplicitFallbacks": all(
            properties["baseColor"]
            and max(properties["baseColor"][:3]) < 0.16
            and properties["metallic"] == 0.0
            and properties["roughness"] >= 0.75
            for properties in imported_materials.values()
        ),
        "uv0AndLightmapUv": all(
            mesh["uvLayers"] >= 2
            for mesh in meshes
            if not mesh["name"].startswith("UCX_")
        ),
        "closedMeshes": all(mesh["nonManifoldEdges"] == 0 for mesh in meshes),
        "consistentWinding": all(mesh["inconsistentWindingEdges"] == 0 for mesh in meshes),
        "positiveVolume": all(mesh["signedVolume"] > 0 for mesh in meshes),
        "exactMeterBounds": near_vector(minimum, EXPECTED_BOUNDS["minimum"], 0.012)
        and near_vector(maximum, EXPECTED_BOUNDS["maximum"], 0.012),
        "exactContactPlane": abs(maximum[2] - 0.14) <= 0.004,
        "appliedScaleAndRotation": all(
            max(abs(value) for value in mesh["rotationEuler"]) <= 1.0e-5
            and max(abs(value - 1.0) for value in mesh["scale"]) <= 1.0e-5
            for mesh in meshes
        ),
        "boundedTriangleCount": sum(mesh["triangles"] for mesh in meshes) < 2000,
        "onlyExpectedComponents": all(
            name.startswith("SM_SHI_CommandSurface_")
            or name.startswith("UCX_SM_SHI_CommandSurface_")
            for name in [mesh["name"] for mesh in meshes]
        ),
    }
    if preview_path:
        render_clean_preview(preview_path)
    return {
        "path": str(path),
        "format": path.suffix.lower().lstrip("."),
        "objects": meshes,
        "boundsMeters": {"minimum": minimum, "maximum": maximum, "dimensions": dimensions},
        "totalTriangles": sum(mesh["triangles"] for mesh in meshes),
        "importedMaterials": imported_materials,
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", required=True)
    parser.add_argument(
        "--render-preview",
        action="store_true",
        help="deliberately replace the clean-import human-review preview",
    )
    args = parser.parse_args(script_args())
    root = Path(args.asset_root).resolve()
    exports = root / "export"
    results = [
        validate_export(
            exports / f"{ASSET_ID}-lod0.glb",
            "LOD0",
            False,
            5,
            preview_path=root / "rendered" / f"{ASSET_ID}-glb-import.png"
            if args.render_preview
            else None,
        ),
        validate_export(exports / f"{ASSET_ID}-lod1.glb", "LOD1", False, 5),
        validate_export(
            exports / f"{ASSET_ID}.fbx",
            None,
            True,
            1,
            expected_render_names={"SM_SHI_CommandSurface_01"},
        ),
        validate_export(
            exports / f"{ASSET_ID}-lod1.fbx",
            None,
            False,
            1,
            expected_render_names={"SM_SHI_CommandSurface_01"},
        ),
    ]
    for result in results:
        result["path"] = str(Path(result["path"]).relative_to(root))
    lod_reduction = results[1]["totalTriangles"] < results[0]["totalTriangles"]
    report = {
        "assetId": ASSET_ID,
        "validator": "clean Blender import plus bmesh topology/material/UV/bounds inspection",
        "blender": bpy.app.version_string,
        "exports": results,
        "lodReduction": lod_reduction,
        "passed": all(result["passed"] for result in results) and lod_reduction,
    }
    report_path = root / "source" / f"{ASSET_ID}.validation.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
