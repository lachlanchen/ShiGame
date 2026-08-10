import argparse
import json
import math
from pathlib import Path
import random
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-rain-vfx-v1"
EXPECTED = {
    "streak-lod0": {
        "triangles": 12,
        "material": "M_SHI_RainStreak",
        "minimum": (-0.006, -0.006, 0.0),
        "maximum": (0.006, 0.006, 1.0),
    },
    "streak-lod1": {
        "triangles": 6,
        "material": "M_SHI_RainStreak",
        "minimum": (-0.006, 0.0, 0.0),
        "maximum": (0.006, 0.0, 1.0),
    },
    "ripple-lod0": {
        "triangles": 288,
        "material": "M_SHI_RainRipple",
        "minimum": (-0.5, -0.5, 0.0),
        "maximum": (0.5, 0.5, 0.0),
    },
    "ripple-lod1": {
        "triangles": 64,
        "material": "M_SHI_RainRipple",
        "minimum": (-0.5, -0.5, 0.0),
        "maximum": (0.5, 0.5, 0.0),
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
        "vertexAlphaPresent": bool(mesh.color_attributes),
        "softAlphaTaper": minimum_alpha <= 0.02 and maximum_alpha >= 0.85,
        "nonDegenerateTriangles": bool(areas) and min(areas) > 1.0e-8,
        "appliedIdentity": max(abs(value) for value in obj.location) <= 1.0e-5
        and max(abs(value) for value in obj.rotation_euler) <= 1.0e-5
        and max(abs(value - 1.0) for value in obj.scale) <= 1.0e-5,
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


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_clean_preview(streak_path: Path, ripple_path: Path, output_path: Path) -> None:
    clear_scene()
    import_mesh(streak_path)
    streak = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
    import_mesh(ripple_path)
    ripple = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj is not streak)
    streak.hide_render = True
    ripple.hide_render = True
    rng = random.Random(0x5EED209)
    for index in range(120):
        x = rng.uniform(-5.8, 5.8)
        y = rng.uniform(-4.2, 4.2)
        z = rng.uniform(0.15, 5.2)
        if abs(x) < 2.15 and abs(y) < 1.65 and z < 2.6:
            z += 2.7
        instance = bpy.data.objects.new(f"CleanStreak_{index:03d}", streak.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, z)
        instance.scale = (1.0, 1.0, rng.uniform(0.55, 1.25))
        instance.rotation_euler = (math.radians(-4.0), math.radians(8.0), 0.0)
    for index in range(18):
        x = rng.uniform(-5.5, 5.5)
        y = rng.uniform(-3.9, 3.9)
        if abs(x) < 2.2 and abs(y) < 1.7:
            x += 3.0 if x >= 0 else -3.0
        instance = bpy.data.objects.new(f"CleanRipple_{index:03d}", ripple.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, 0.012)
        scale = rng.uniform(0.35, 1.0)
        instance.scale = (scale, scale, 1.0)
    context = bpy.data.materials.new("M_SHI_RainValidationContext")
    context.diffuse_color = (0.008, 0.012, 0.014, 1.0)
    context.roughness = 0.82
    bpy.ops.mesh.primitive_plane_add(size=14.0)
    bpy.context.object.data.materials.append(context)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.72), scale=(2.2, 1.7, 0.035))
    bpy.context.object.data.materials.append(context)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.world = bpy.data.worlds.new("SHI_RainValidationWorld")
    scene.world.color = (0.001, 0.002, 0.004)
    bpy.ops.object.camera_add(location=(8.5, -10.5, 5.4))
    camera = bpy.context.object
    camera.data.lens = 48
    aim(camera, Vector((0.0, 0.0, 1.7)))
    scene.camera = camera
    bpy.ops.object.light_add(type="AREA", location=(-2.0, -3.0, 8.0))
    light = bpy.context.object
    light.data.energy = 850.0
    light.data.color = (0.38, 0.52, 0.72)
    light.data.shape = "DISK"
    light.data.size = 8.0
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
            exports / f"{ASSET_ID}-streak-lod0.glb",
            exports / f"{ASSET_ID}-ripple-lod0.glb",
            root / "rendered" / f"{ASSET_ID}-glb-import.png",
        )
    metric_checks = {
        "allEightExportsPass": all(result["passed"] for result in results),
        "exactAuthoredTriangles": all(
            metrics["meshes"][kind][f"{lod}Triangles"] == EXPECTED[f"{kind}-{lod}"]["triangles"]
            for kind in ("streak", "ripple")
            for lod in ("lod0", "lod1")
        ),
        "lodReduction": metrics["meshes"]["streak"]["lod1Triangles"] < metrics["meshes"]["streak"]["lod0Triangles"]
        and metrics["meshes"]["ripple"]["lod1Triangles"] < metrics["meshes"]["ripple"]["lod0Triangles"],
        "boundedRuntimePools": metrics["runtime"]["streakInstances"] == 384
        and metrics["runtime"]["ripplePoolInstances"] == 72,
        "explicitDramaticReconstruction": "not evidence" in metrics["historicalStatus"],
    }
    for result in results:
        result["path"] = str(Path(result["path"]).relative_to(root))
    report = {
        "assetId": ASSET_ID,
        "validator": "clean Blender GLB/FBX import plus topology, dual-UV, vertex-alpha, material and bounds inspection",
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
