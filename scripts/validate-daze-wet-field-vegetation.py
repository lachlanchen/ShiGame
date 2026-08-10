import argparse
import json
import math
from pathlib import Path
import random
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-wet-field-vegetation-v1"
EXPECTED = {
    "stalk-lod0": {
        "triangles": 84,
        "material": "M_SHI_RainDarkenedFieldPlant",
        "minimum": (-0.34, -0.30, 0.0),
        "maximum": (0.34, 0.31, 1.35),
    },
    "stalk-lod1": {
        "triangles": 28,
        "material": "M_SHI_RainDarkenedFieldPlant",
        "minimum": (-0.34, -0.30, 0.0),
        "maximum": (0.34, 0.31, 1.35),
    },
    "tuft-lod0": {
        "triangles": 64,
        "material": "M_SHI_RainDarkenedFieldPlant",
        "minimum": (-0.45, -0.45, 0.0),
        "maximum": (0.45, 0.45, 0.52),
    },
    "tuft-lod1": {
        "triangles": 14,
        "material": "M_SHI_RainDarkenedFieldPlant",
        "minimum": (-0.45, -0.45, 0.0),
        "maximum": (0.45, 0.45, 0.52),
    },
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


def near_vector(actual: list[float], expected: tuple[float, float, float], tolerance: float = 0.002) -> bool:
    return all(abs(actual[index] - expected[index]) <= tolerance for index in range(3))


def object_bounds(obj: bpy.types.Object) -> tuple[list[float], list[float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        [min(point[axis] for point in points) for axis in range(3)],
        [max(point[axis] for point in points) for axis in range(3)],
    )


def alpha_range(mesh: bpy.types.Mesh) -> tuple[float, float]:
    values = [
        float(entry.color[3])
        for attribute in mesh.color_attributes
        for entry in attribute.data
        if hasattr(entry, "color")
    ]
    return (min(values, default=1.0), max(values, default=1.0))


def triangle_areas(mesh: bpy.types.Mesh) -> list[float]:
    mesh.calc_loop_triangles()
    return [
        ((mesh.vertices[triangle.vertices[1]].co - mesh.vertices[triangle.vertices[0]].co).cross(
            mesh.vertices[triangle.vertices[2]].co - mesh.vertices[triangle.vertices[0]].co
        )).length * 0.5
        for triangle in mesh.loop_triangles
    ]


def lightmap_islands_do_not_overlap(mesh: bpy.types.Mesh) -> bool:
    if len(mesh.uv_layers) < 2:
        return False
    layer = mesh.uv_layers[1]
    boxes = []
    for polygon in mesh.polygons:
        values = [layer.data[index].uv for index in polygon.loop_indices]
        boxes.append((
            min(value.x for value in values), min(value.y for value in values),
            max(value.x for value in values), max(value.y for value in values),
        ))
    # GLB/FBX round trips can triangulate each authored quad. Both triangles then
    # legitimately share the same square island bounding box; compare distinct
    # quantized islands so that pair is not misreported as an overlap.
    boxes = list({tuple(round(value, 5) for value in box) for box in boxes})
    tolerance = 1.0e-6
    for first_index, first in enumerate(boxes):
        for second in boxes[first_index + 1:]:
            overlap_x = min(first[2], second[2]) - max(first[0], second[0])
            overlap_y = min(first[3], second[3]) - max(first[1], second[1])
            if overlap_x > tolerance and overlap_y > tolerance:
                return False
    return True


def validate_export(path: Path, label: str) -> dict:
    clear_scene()
    import_mesh(path)
    all_meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    collision = [obj for obj in all_meshes if obj.name.startswith(("UCX_", "UBX_", "USP_", "UCP_"))]
    render_meshes = [obj for obj in all_meshes if obj not in collision]
    contract = EXPECTED[label]
    if len(render_meshes) != 1:
        return {
            "path": str(path),
            "label": label,
            "checks": {"singleRenderMesh": False, "collisionAbsent": not collision},
            "passed": False,
        }
    obj = render_meshes[0]
    mesh = obj.data
    mesh.calc_loop_triangles()
    minimum, maximum = object_bounds(obj)
    materials = [material.name for material in mesh.materials if material]
    minimum_alpha, maximum_alpha = alpha_range(mesh)
    areas = triangle_areas(mesh)
    checks = {
        "singleRenderMesh": True,
        "collisionAbsent": len(collision) == 0,
        "exactTriangleCount": len(mesh.loop_triangles) == contract["triangles"],
        "exactReferenceBounds": near_vector(minimum, contract["minimum"])
        and near_vector(maximum, contract["maximum"]),
        "singleExpectedMaterial": materials == [contract["material"]],
        "uv0AndLightmapUv": len(mesh.uv_layers) >= 2,
        "nonOverlappingLightmapIslands": lightmap_islands_do_not_overlap(mesh),
        "vertexWindMaskPresent": bool(mesh.color_attributes),
        "rootLockedTipFree": minimum_alpha <= 0.02 and maximum_alpha >= 0.98,
        "nonDegenerateTriangles": bool(areas) and min(areas) > 1.0e-8,
        "appliedIdentity": max(abs(value) for value in obj.location) <= 1.0e-5
        and max(abs(value) for value in obj.rotation_euler) <= 1.0e-5
        and max(abs(value - 1.0) for value in obj.scale) <= 1.0e-5,
        "noArmatureOrAnimation": not any(scene_obj.type == "ARMATURE" for scene_obj in bpy.context.scene.objects)
        and not bpy.data.actions,
    }
    return {
        "path": str(path),
        "label": label,
        "object": obj.name,
        "triangles": len(mesh.loop_triangles),
        "vertices": len(mesh.vertices),
        "boundsMeters": {
            "minimum": minimum,
            "maximum": maximum,
            "dimensions": [maximum[index] - minimum[index] for index in range(3)],
        },
        "materials": materials,
        "uvLayers": [layer.name for layer in mesh.uv_layers],
        "colorAttributes": [attribute.name for attribute in mesh.color_attributes],
        "alphaRange": [minimum_alpha, maximum_alpha],
        "minimumTriangleArea": min(areas),
        "checks": checks,
        "passed": all(checks.values()),
    }


def valid_root(x: float, y: float) -> bool:
    return not (abs(x) <= 5.20 and abs(y) <= 4.40) \
        and not (abs(x) < 10.0 and abs(y - 0.28 * x) < 1.15)


def roots(rng: random.Random, count: int) -> list[tuple[float, float, float]]:
    accepted = []
    while len(accepted) < count:
        x = rng.uniform(-11.25, 11.25)
        y = rng.uniform(-11.25, 11.25)
        if valid_root(x, y):
            accepted.append((x, y, rng.uniform(0.0, math.tau)))
    return accepted


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_clean_preview(stalk_path: Path, tuft_path: Path, output_path: Path) -> None:
    clear_scene()
    import_mesh(stalk_path)
    stalk = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
    import_mesh(tuft_path)
    tuft = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj is not stalk)
    stalk.hide_render = True
    tuft.hide_render = True
    rng = random.Random(0x5EED20A)
    for index, (x, y, yaw) in enumerate(roots(rng, 42)):
        instance = bpy.data.objects.new(f"CleanStalk_{index:03d}", stalk.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, -0.076)
        scale = rng.uniform(0.72, 1.06)
        instance.scale = (scale, scale, scale)
        instance.rotation_euler[2] = yaw
    for index, (x, y, yaw) in enumerate(roots(rng, 64)):
        instance = bpy.data.objects.new(f"CleanTuft_{index:03d}", tuft.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, -0.076)
        scale = rng.uniform(0.70, 1.12)
        instance.scale = (scale, scale, scale)
        instance.rotation_euler[2] = yaw
    context = bpy.data.materials.new("M_SHI_VegetationValidationContext")
    context.diffuse_color = (0.020, 0.015, 0.008, 1.0)
    context.roughness = 0.78
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, -0.082))
    bpy.context.object.data.materials.append(context)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, -0.068), scale=(10.7, 1.05, 0.01))
    bpy.context.object.rotation_euler[2] = math.atan(0.28)
    bpy.context.object.data.materials.append(context)
    for x in (-3.6, 3.6):
        for y in (-2.6, 2.6):
            bpy.ops.mesh.primitive_cube_add(location=(x, y, 1.35), scale=(0.07, 0.07, 1.35))
            bpy.context.object.data.materials.append(context)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.83), scale=(4.2, 3.37, 0.055))
    bpy.context.object.data.materials.append(context)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.world = bpy.data.worlds.new("SHI_VegetationValidationWorld")
    scene.world.color = (0.002, 0.003, 0.005)
    bpy.ops.object.camera_add(location=(13.4, -16.4, 8.1))
    camera = bpy.context.object
    camera.data.lens = 52
    aim(camera, Vector((0.0, 0.0, 0.7)))
    scene.camera = camera
    bpy.ops.object.light_add(type="AREA", location=(-4.0, -4.0, 10.0))
    light = bpy.context.object
    light.data.energy = 1350.0
    light.data.color = (0.46, 0.58, 0.72)
    light.data.shape = "DISK"
    light.data.size = 9.0
    aim(light, Vector((0.0, 0.0, 0.0)))
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", required=True)
    parser.add_argument("--render-preview", action="store_true")
    args = parser.parse_args(script_args())
    root = Path(args.asset_root).resolve()
    exports = root / "export"
    metrics = json.loads((root / "source" / f"{ASSET_ID}.metrics.json").read_text(encoding="utf-8"))
    results = []
    for label in EXPECTED:
        for extension in ("glb", "fbx"):
            results.append(validate_export(exports / f"{ASSET_ID}-{label}.{extension}", label))
    if args.render_preview:
        render_clean_preview(
            exports / f"{ASSET_ID}-stalk-lod0.glb",
            exports / f"{ASSET_ID}-tuft-lod0.glb",
            root / "rendered" / f"{ASSET_ID}-glb-import.png",
        )
    metric_checks = {
        "allEightExportsPass": all(result["passed"] for result in results),
        "exactAuthoredTriangles": all(
            metrics["meshes"][kind][f"{lod}Triangles"] == EXPECTED[f"{kind}-{lod}"]["triangles"]
            for kind in ("stalk", "tuft")
            for lod in ("lod0", "lod1")
        ),
        "lodReduction": metrics["meshes"]["stalk"]["lod1Triangles"] < metrics["meshes"]["stalk"]["lod0Triangles"]
        and metrics["meshes"]["tuft"]["lod1Triangles"] < metrics["meshes"]["tuft"]["lod0Triangles"],
        "boundedRuntimeInstances": metrics["runtime"]["stalkInstances"] == 42
        and metrics["runtime"]["tuftInstances"] == 64,
        "exactGpuWindDefaults": metrics["runtime"]["windSpeed"] == 0.38
        and metrics["runtime"]["windAmplitudeCentimeters"] == 2.4
        and metrics["runtime"]["windDirection"] == [1.0, 0.35, 0.0],
        "explicitBotanicalBoundary": "not an exact botanical reconstruction" in metrics["historicalStatus"],
    }
    for result in results:
        result["path"] = str(Path(result["path"]).relative_to(root))
    report = {
        "assetId": ASSET_ID,
        "validator": "clean Blender GLB/FBX import plus topology, dual-UV/island, vertex-wind-mask, material and bounds inspection",
        "blender": bpy.app.version_string,
        "exports": results,
        "checks": metric_checks,
        "passed": all(metric_checks.values()),
    }
    report_path = root / "source" / f"{ASSET_ID}.validation.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
