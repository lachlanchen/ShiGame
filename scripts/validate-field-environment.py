import argparse
import json
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


ASSET_ID = "shi-wet-field-environment-v1"
EXPECTED_MATERIALS = {"M_SHI_WetFieldGround", "M_SHI_ShallowRainwater"}
EXPECTED_BOUNDS = {
    "minimum": (-12.0, -12.0, -0.32),
    "maximum": (12.0, 12.0, -0.076),
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
    bpy.ops.object.camera_add(location=(11.8, -14.5, 9.2))
    camera = bpy.context.object
    camera.data.lens = 52
    aim(camera, Vector((0.0, -0.4, -0.10)))
    bpy.context.scene.camera = camera
    for location, energy, size, color in (
        ((-5.0, -3.0, 13.0), 3600.0, 8.0, (0.46, 0.58, 0.75)),
        ((-3.8, -5.5, 2.8), 2100.0, 4.0, (1.0, 0.34, 0.09)),
        ((8.0, 6.0, 7.0), 1850.0, 5.0, (0.42, 0.62, 0.88)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, -0.10)))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("SHI_WetField_ValidationWorld")
    scene.world.color = (0.002, 0.004, 0.006)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.10
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def mesh_report(obj: bpy.types.Object) -> dict:
    mesh = obj.data
    mesh.calc_loop_triangles()
    topology = bmesh.new()
    topology.from_mesh(mesh)
    raw_vertices = len(topology.verts)
    bmesh.ops.remove_doubles(topology, verts=topology.verts, dist=1.0e-5)
    welded_vertices = len(topology.verts)
    non_manifold_edges = sum(1 for edge in topology.edges if not edge.is_manifold)
    inconsistent_edges = sum(
        1 for edge in topology.edges if edge.is_manifold and not edge.is_contiguous
    )
    signed_volume = topology.calc_volume(signed=True)
    topology.free()
    central_z = [
        (obj.matrix_world @ vertex.co).z
        for vertex in mesh.vertices
        if abs((obj.matrix_world @ vertex.co).x) <= 3.25
        and abs((obj.matrix_world @ vertex.co).y) <= 2.25
    ]
    color_stats = []
    for attribute in mesh.color_attributes:
        colors = [entry.color for entry in attribute.data if hasattr(entry, "color")]
        color_stats.append({
            "name": attribute.name,
            "maximumRgb": max((max(color[:3]) for color in colors), default=None),
            "minimumAlpha": min((color[3] for color in colors), default=None),
            "maximumAlpha": max((color[3] for color in colors), default=None),
        })
    return {
        "name": obj.name,
        "vertices": len(mesh.vertices),
        "weldedVertices": welded_vertices,
        "normalOrAttributeSplitVertices": raw_vertices - welded_vertices,
        "triangles": len(mesh.loop_triangles),
        "uvLayers": len(mesh.uv_layers),
        "colorAttributes": [attribute.name for attribute in mesh.color_attributes],
        "colorAttributeStats": color_stats,
        "materials": [slot.name for slot in mesh.materials if slot],
        "nonManifoldEdges": non_manifold_edges,
        "inconsistentWindingEdges": inconsistent_edges,
        "signedVolume": signed_volume,
        "centralMaximumZ": max(central_z) if central_z else None,
        "location": list(obj.location),
        "rotationEuler": list(obj.rotation_euler),
        "scale": list(obj.scale),
    }


def aggregate_bounds(objects: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return (
        [min(point[axis] for point in points) for axis in range(3)],
        [max(point[axis] for point in points) for axis in range(3)],
    )


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
    objects = sorted((obj for obj in bpy.context.scene.objects if obj.type == "MESH"), key=lambda obj: obj.name)
    render_objects = [obj for obj in objects if not obj.name.startswith("UCX_")]
    collision_objects = [obj for obj in objects if obj.name.startswith("UCX_")]
    minimum, maximum = aggregate_bounds(render_objects)
    meshes = [mesh_report(obj) for obj in objects]
    render_meshes = [mesh for mesh in meshes if not mesh["name"].startswith("UCX_")]
    material_names = {material for mesh in render_meshes for material in mesh["materials"]}
    imported_materials = {name: material_report(bpy.data.materials[name]) for name in sorted(material_names)}
    render_names = {obj.name for obj in render_objects}
    ground_meshes = [mesh for mesh in render_meshes if "Terrain" in mesh["name"] or len(render_meshes) == 1]
    puddle_meshes = [mesh for mesh in render_meshes if "Puddle" in mesh["name"]]
    ground = imported_materials.get("M_SHI_WetFieldGround", {})
    water = imported_materials.get("M_SHI_ShallowRainwater", {})
    render_triangle_count = sum(mesh["triangles"] for mesh in render_meshes)
    expected_combined_open_edges = 160 if render_triangle_count > 5000 else 60
    ground_color_stats = [
        stats
        for mesh in ground_meshes
        for stats in mesh["colorAttributeStats"]
    ]
    dark_vertex_fallback = bool(ground_color_stats) and all(
        stats["maximumRgb"] is not None and stats["maximumRgb"] < 0.16
        for stats in ground_color_stats
    )
    route_alpha_range = bool(ground_color_stats) and all(
        stats["minimumAlpha"] is not None
        and stats["maximumAlpha"] is not None
        and stats["minimumAlpha"] <= 0.02
        and stats["maximumAlpha"] >= 0.98
        for stats in ground_color_stats
    )
    checks = {
        "renderComponentCount": len(render_objects) == expected_render_components,
        "expectedLodNames": all(expected_lod in obj.name for obj in render_objects) if expected_lod else True,
        "expectedRenderNames": render_names == expected_render_names if expected_render_names else True,
        "collisionContract": (
            len(collision_objects) == 1
            and collision_objects[0].name == "UCX_SM_SHI_WetFieldEnvironment_01_01"
        ) if expect_collision else len(collision_objects) == 0,
        "materialSlots": material_names == EXPECTED_MATERIALS,
        "darkExplicitFallbacks": bool(ground.get("baseColor"))
            and (max(ground["baseColor"][:3]) < 0.16 or dark_vertex_fallback)
            and ground["metallic"] == 0.0
            and ground["roughness"] >= 0.75
            and bool(water.get("baseColor"))
            and max(water["baseColor"][:3]) < 0.08
            and water["metallic"] == 0.0
            and water["roughness"] <= 0.25,
        "uv0AndLightmapUv": all(mesh["uvLayers"] >= 2 for mesh in render_meshes),
        "routeVertexColor": all(bool(mesh["colorAttributes"]) for mesh in ground_meshes)
            and route_alpha_range,
        "terrainAndWaterTopology": (
            all(mesh["nonManifoldEdges"] == 0 for mesh in ground_meshes)
            and all(mesh["nonManifoldEdges"] > 0 for mesh in puddle_meshes)
        ) if puddle_meshes else (
            len(ground_meshes) == 1
            and ground_meshes[0]["nonManifoldEdges"] == expected_combined_open_edges
        ),
        "consistentWinding": all(mesh["inconsistentWindingEdges"] == 0 for mesh in meshes),
        "positiveTerrainVolume": all(mesh["signedVolume"] > 0 for mesh in ground_meshes),
        "exactMeterBounds": near_vector(minimum, EXPECTED_BOUNDS["minimum"], 0.012)
            and near_vector(maximum, EXPECTED_BOUNDS["maximum"], 0.012),
        "centralPlatformClearance": all(
            mesh["centralMaximumZ"] is None or mesh["centralMaximumZ"] <= -0.06 for mesh in ground_meshes
        ),
        "appliedScaleAndRotation": all(
            max(abs(value) for value in mesh["rotationEuler"]) <= 1.0e-5
            and max(abs(value - 1.0) for value in mesh["scale"]) <= 1.0e-5
            for mesh in meshes
        ),
        "boundedTriangleCount": render_triangle_count < 12000,
        "onlyExpectedComponents": all(
            name.startswith("SM_SHI_WetField_")
            or name.startswith("SM_SHI_WetFieldEnvironment_")
            or name.startswith("UCX_SM_SHI_WetFieldEnvironment_")
            for name in [mesh["name"] for mesh in meshes]
        ),
    }
    if preview_path:
        render_clean_preview(preview_path)
    return {
        "path": str(path),
        "format": path.suffix.lower().lstrip("."),
        "objects": meshes,
        "boundsMeters": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": [maximum[index] - minimum[index] for index in range(3)],
        },
        "renderTriangles": render_triangle_count,
        "importedMaterials": imported_materials,
        "checks": checks,
        "passed": all(checks.values()),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", required=True)
    parser.add_argument("--render-preview", action="store_true")
    args = parser.parse_args(script_args())
    root = Path(args.asset_root).resolve()
    exports = root / "export"
    results = [
        validate_export(
            exports / f"{ASSET_ID}-lod0.glb", "LOD0", False, 6,
            preview_path=root / "rendered" / f"{ASSET_ID}-glb-import.png" if args.render_preview else None,
        ),
        validate_export(exports / f"{ASSET_ID}-lod1.glb", "LOD1", False, 6),
        validate_export(
            exports / f"{ASSET_ID}.fbx", None, True, 1,
            expected_render_names={"SM_SHI_WetFieldEnvironment_01"},
        ),
        validate_export(
            exports / f"{ASSET_ID}-lod1.fbx", None, False, 1,
            expected_render_names={"SM_SHI_WetFieldEnvironment_01"},
        ),
    ]
    for result in results:
        result["path"] = str(Path(result["path"]).relative_to(root))
    lod_reduction = results[1]["renderTriangles"] < results[0]["renderTriangles"]
    report = {
        "assetId": ASSET_ID,
        "validator": "clean Blender import plus bmesh topology/material/UV/color/bounds inspection",
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
