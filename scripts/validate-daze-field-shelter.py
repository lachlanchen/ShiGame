import argparse
import json
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-field-shelter-v1"
MESH_NAME = "SM_SHI_DazeFieldShelter_01"
EXPECTED_MATERIALS = {
    "M_SHI_RainDarkenedWood",
    "M_SHI_WovenReedMat",
    "M_SHI_CoarseFiberCord",
}
EXPECTED_BOUNDS = {
    "LOD0": {
        "minimum": (-4.20, -3.367437, -0.18),
        "maximum": (4.20, 3.367437, 3.370001),
    },
    "LOD1": {
        "minimum": (-4.20, -3.370723, -0.18),
        "maximum": (4.20, 3.370723, 3.370001),
    },
}
EXPECTED_TRIANGLES = {"LOD0": 3948, "LOD1": 460}
COMMAND_SURFACE_HALF_EXTENTS = (2.90, 1.85)
POST_CENTERS = {
    (-3.6, -2.6),
    (3.6, -2.6),
    (-3.6, 2.6),
    (3.6, 2.6),
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
        "baseColor": list(principled.inputs["Base Color"].default_value) if principled else list(material.diffuse_color),
        "metallic": float(principled.inputs["Metallic"].default_value) if principled else float(material.metallic),
        "roughness": float(principled.inputs["Roughness"].default_value) if principled else float(material.roughness),
    }


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
    color_ranges = []
    for attribute in mesh.color_attributes:
        colors = [entry.color for entry in attribute.data if hasattr(entry, "color")]
        color_ranges.append({
            "name": attribute.name,
            "minimumRgb": [min((color[channel] for color in colors), default=0.0) for channel in range(3)],
            "maximumRgb": [max((color[channel] for color in colors), default=0.0) for channel in range(3)],
        })
    return {
        "name": obj.name,
        "vertices": len(mesh.vertices),
        "weldedVertices": welded_vertices,
        "normalOrAttributeSplitVertices": raw_vertices - welded_vertices,
        "triangles": len(mesh.loop_triangles),
        "uvLayers": [layer.name for layer in mesh.uv_layers],
        "colorAttributes": [attribute.name for attribute in mesh.color_attributes],
        "colorAttributeRanges": color_ranges,
        "materials": [slot.name for slot in mesh.materials if slot],
        "nonManifoldEdges": non_manifold_edges,
        "inconsistentWindingEdges": inconsistent_edges,
        "signedVolume": signed_volume,
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


def render_clean_preview(path: Path) -> None:
    # The command slab is deliberately inspection-only and is not part of the export.
    context_material = bpy.data.materials.new("M_SHI_ShelterValidationContext")
    context_material.diffuse_color = (0.014, 0.009, 0.004, 1.0)
    context_material.roughness = 0.94
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.06))
    surface = bpy.context.object
    surface.name = "review_only_command_ground"
    surface.dimensions = (5.8, 3.7, 0.16)
    surface.data.materials.append(context_material)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, -0.125))
    field = bpy.context.object
    field.name = "review_only_wet_field"
    field.data.materials.append(context_material)

    bpy.ops.object.camera_add(location=(10.2, -12.0, 6.8))
    camera = bpy.context.object
    camera.data.lens = 52
    aim(camera, Vector((0.0, 0.0, 1.45)))
    bpy.context.scene.camera = camera
    for location, energy, size, color in (
        ((-4.0, -2.0, 10.0), 3200.0, 7.0, (0.42, 0.55, 0.72)),
        ((-2.8, -3.2, 2.4), 1900.0, 3.5, (1.0, 0.30, 0.075)),
        ((8.0, 4.5, 5.8), 1500.0, 4.5, (0.34, 0.52, 0.78)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, 1.35)))

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world = bpy.data.worlds.new("SHI_DazeShelter_ValidationWorld")
    scene.world.color = (0.0015, 0.003, 0.005)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.20
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def validate_export(
    path: Path,
    lod: str,
    expected_components: int,
    combined: bool,
    preview_path: Path | None = None,
) -> dict:
    clear_scene()
    import_mesh(path)
    objects = sorted(
        (obj for obj in bpy.context.scene.objects if obj.type == "MESH"),
        key=lambda obj: obj.name,
    )
    collision_objects = [obj for obj in objects if obj.name.startswith(("UCX_", "UBX_", "USP_", "UCP_"))]
    render_objects = [obj for obj in objects if obj not in collision_objects]
    meshes = [mesh_report(obj) for obj in render_objects]
    minimum, maximum = aggregate_bounds(render_objects)
    materials = {name for mesh in meshes for name in mesh["materials"]}
    imported_materials = {
        name: material_report(bpy.data.materials[name]) for name in sorted(materials)
    }
    triangles = sum(mesh["triangles"] for mesh in meshes)
    reed_meshes = [mesh for mesh in meshes if "M_SHI_WovenReedMat" in mesh["materials"]]
    post_objects = [obj for obj in render_objects if "Post" in obj.name]
    imported_post_centers = set()
    for obj in post_objects:
        corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        imported_post_centers.add((
            round((min(point.x for point in corners) + max(point.x for point in corners)) * 0.5, 3),
            round((min(point.y for point in corners) + max(point.y for point in corners)) * 0.5, 3),
        ))
    expected_names = {MESH_NAME}
    prefix = f"SM_SHI_DazeShelter_{lod}_"
    expected_materials = EXPECTED_MATERIALS if combined or lod == "LOD0" else {
        "M_SHI_RainDarkenedWood",
        "M_SHI_WovenReedMat",
    }
    if combined:
        topology_clean = all(
            mesh["nonManifoldEdges"] <= (300 if lod == "LOD0" else 12)
            and mesh["inconsistentWindingEdges"] <= (60 if lod == "LOD0" else 2)
            for mesh in meshes
        )
    else:
        topology_clean = all(
            mesh["nonManifoldEdges"] == 0
            and mesh["inconsistentWindingEdges"] == 0
            for mesh in meshes
        )
    reed_color_ranges = [
        color_range
        for mesh in reed_meshes
        for color_range in mesh["colorAttributeRanges"]
    ]
    dark_reed_vertex_fallback = bool(reed_color_ranges) and all(
        max(color_range["maximumRgb"]) < 0.20
        and color_range["maximumRgb"][0] >= color_range["maximumRgb"][1]
        and color_range["maximumRgb"][1] >= color_range["maximumRgb"][2]
        for color_range in reed_color_ranges
    )
    checks = {
        "renderComponentCount": len(render_objects) == expected_components,
        "componentIdentity": (
            {obj.name for obj in render_objects} == expected_names
            if combined
            else all(obj.name.startswith(prefix) for obj in render_objects)
        ),
        "collisionAbsent": len(collision_objects) == 0,
        "materialSlots": materials == expected_materials,
        "darkPhysicalFallbacks": all(
            properties["baseColor"]
            and (
                max(properties["baseColor"][:3]) < 0.16
                or (name == "M_SHI_WovenReedMat" and dark_reed_vertex_fallback)
            )
            and properties["metallic"] == 0.0
            and properties["roughness"] >= 0.75
            for name, properties in imported_materials.items()
        ),
        "uv0AndLightmapUv": all(len(mesh["uvLayers"]) >= 2 for mesh in meshes),
        "reedVertexSignal": bool(reed_meshes) and all(
            bool(mesh["colorAttributes"]) for mesh in reed_meshes
        ),
        "componentTopologyOrBoundedAuthoredJoints": topology_clean,
        "positiveVolume": all(mesh["signedVolume"] > 0 for mesh in meshes),
        "exactMeterBounds": near_vector(minimum, EXPECTED_BOUNDS[lod]["minimum"], 0.012)
        and near_vector(maximum, EXPECTED_BOUNDS[lod]["maximum"], 0.012),
        "groundEmbedAndHeightEnvelope": minimum[2] <= -0.17 and maximum[2] <= 3.451,
        "commandClearance": (
            imported_post_centers == POST_CENTERS
            and all(
                abs(x) > COMMAND_SURFACE_HALF_EXTENTS[0]
                and abs(y) > COMMAND_SURFACE_HALF_EXTENTS[1]
                for x, y in imported_post_centers
            )
        ) if not combined else True,
        "appliedIdentity": all(
            max(abs(value) for value in mesh["location"]) <= 1.0e-5
            and max(abs(value) for value in mesh["rotationEuler"]) <= 1.0e-5
            and max(abs(value - 1.0) for value in mesh["scale"]) <= 1.0e-5
            for mesh in meshes
        ),
        "exactTriangleBudget": triangles == EXPECTED_TRIANGLES[lod],
        "boundedTriangleBudget": triangles < (12000 if lod == "LOD0" else 4000),
    }
    if preview_path:
        render_clean_preview(preview_path)
    return {
        "path": str(path),
        "format": path.suffix.lower().lstrip("."),
        "lod": lod,
        "objects": meshes,
        "boundsMeters": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": [maximum[index] - minimum[index] for index in range(3)],
        },
        "totalTriangles": triangles,
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
    metrics = json.loads((root / "source" / f"{ASSET_ID}.metrics.json").read_text(encoding="utf-8"))
    if metrics["lod0Triangles"] != EXPECTED_TRIANGLES["LOD0"] or metrics["lod1Triangles"] != EXPECTED_TRIANGLES["LOD1"]:
        raise SystemExit("Authored metrics no longer match the reviewed validation contract")
    results = [
        validate_export(
            exports / f"{ASSET_ID}-lod0.glb",
            "LOD0",
            len(metrics["components"]),
            False,
            root / "rendered" / f"{ASSET_ID}-glb-import.png" if args.render_preview else None,
        ),
        validate_export(exports / f"{ASSET_ID}-lod1.glb", "LOD1", 17, False),
        validate_export(exports / f"{ASSET_ID}.fbx", "LOD0", 1, True),
        validate_export(exports / f"{ASSET_ID}-lod1.fbx", "LOD1", 1, True),
    ]
    for result in results:
        result["path"] = str(Path(result["path"]).relative_to(root))
    lod_reduction_ratio = results[1]["totalTriangles"] / results[0]["totalTriangles"]
    checks = {
        "allExportsPass": all(result["passed"] for result in results),
        "lodReduction": 0.05 <= lod_reduction_ratio <= 0.35,
        "metricsMaterialContract": set(metrics["materials"]) == EXPECTED_MATERIALS,
        "metricsCollisionContract": metrics["collisionTriangles"] == 0,
        "metricsHistoricalLabel": "not an attested" in metrics["historicalStatus"],
    }
    report = {
        "assetId": ASSET_ID,
        "validator": "clean Blender import plus bmesh topology/material/UV/color/bounds/clearance inspection",
        "blender": bpy.app.version_string,
        "exports": results,
        "lodReductionRatio": lod_reduction_ratio,
        "checks": checks,
        "passed": all(checks.values()),
    }
    report_path = root / "source" / f"{ASSET_ID}.validation.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
