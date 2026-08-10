import argparse
import json
import math
from pathlib import Path
import random
import sys

import bpy
import bmesh
from mathutils import Vector


ASSET_ID = "shi-daze-wet-field-vegetation-v1"
STALK_MESH = "SM_SHI_FieldStalkClump_01"
TUFT_MESH = "SM_SHI_LowBladeTuft_01"
MATERIAL = "M_SHI_RainDarkenedFieldPlant"
VERTEX_COLOR = "ShiPlantWind"
TARGET_BOUNDS = {
    "stalk": ((-0.34, -0.30, 0.0), (0.34, 0.31, 1.35)),
    "tuft": ((-0.45, -0.45, 0.0), (0.45, 0.45, 0.52)),
}


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"


def make_material() -> bpy.types.Material:
    material = bpy.data.materials.new(MATERIAL)
    material.use_nodes = True
    material.diffuse_color = (0.055, 0.072, 0.035, 1.0)
    material.use_backface_culling = False
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = (0.033, 0.046, 0.021, 1.0)
    shader.inputs["Roughness"].default_value = 0.87
    shader.inputs["Metallic"].default_value = 0.0
    shader.inputs["Specular IOR Level"].default_value = 0.18
    links.new(shader.outputs[0], output.inputs["Surface"])
    return material


def normalize_bounds(vertices: list[tuple[float, float, float]], kind: str) -> list[tuple[float, float, float]]:
    source_min = [min(vertex[axis] for vertex in vertices) for axis in range(3)]
    source_max = [max(vertex[axis] for vertex in vertices) for axis in range(3)]
    target_min, target_max = TARGET_BOUNDS[kind]
    normalized = []
    for vertex in vertices:
        point = []
        for axis in range(3):
            span = source_max[axis] - source_min[axis]
            ratio = (vertex[axis] - source_min[axis]) / span if span > 1.0e-9 else 0.0
            point.append(target_min[axis] + ratio * (target_max[axis] - target_min[axis]))
        normalized.append(tuple(point))
    return normalized


def append_blade(
    vertices: list[tuple[float, float, float]],
    faces: list[tuple[int, int, int, int]],
    uv0: list[list[tuple[float, float]]],
    alpha: list[float],
    centers: list[tuple[float, float, float]],
    widths: list[float],
) -> None:
    if len(centers) != len(widths) or len(centers) < 2:
        raise ValueError("Blade rows and widths must have equal length and at least two rows")
    direction = Vector(centers[-1]) - Vector(centers[0])
    side = Vector((-direction.y, direction.x, 0.0))
    if side.length < 1.0e-7:
        side = Vector((1.0, 0.0, 0.0))
    side.normalize()
    base = len(vertices)
    row_count = len(centers)
    for row_index, (center, width) in enumerate(zip(centers, widths)):
        center_vector = Vector(center)
        half = side * width * 0.5
        left = center_vector - half
        right = center_vector + half
        vertices.extend((tuple(left), tuple(right)))
        progress = row_index / (row_count - 1)
        wind_alpha = 0.0 if row_index == 0 else progress
        alpha.extend((wind_alpha, wind_alpha))
    for row_index in range(row_count - 1):
        lower = row_index / (row_count - 1)
        upper = (row_index + 1) / (row_count - 1)
        faces.append((base + row_index * 2, base + row_index * 2 + 1,
                      base + (row_index + 1) * 2 + 1, base + (row_index + 1) * 2))
        uv0.append([(0.0, lower), (1.0, lower), (1.0, upper), (0.0, upper)])


def make_blade_mesh(name: str, kind: str, blade_count: int, segments: int, seed: int,
                    material: bpy.types.Material) -> bpy.types.Object:
    rng = random.Random(seed)
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    uv0: list[list[tuple[float, float]]] = []
    alpha: list[float] = []
    for index in range(blade_count):
        angle = math.tau * index / blade_count + rng.uniform(-0.16, 0.16)
        base_radius = rng.uniform(0.01, 0.15) if kind == "stalk" else rng.uniform(0.015, 0.12)
        base = Vector((math.cos(angle) * base_radius, math.sin(angle) * base_radius, 0.0))
        if kind == "stalk":
            height = rng.uniform(0.68, 1.35)
            lean = rng.uniform(0.08, 0.32)
            width = rng.uniform(0.018, 0.032)
        else:
            height = rng.uniform(0.22, 0.52)
            lean = rng.uniform(0.19, 0.48)
            width = rng.uniform(0.032, 0.066)
        lean_angle = angle + rng.uniform(-0.42, 0.42)
        lateral = Vector((math.cos(lean_angle), math.sin(lean_angle), 0.0))
        centers = []
        widths = []
        for row_index in range(segments + 1):
            progress = row_index / segments
            curve = progress ** 1.55
            center = base + lateral * lean * curve
            center.z = height * progress
            if 0 < row_index < segments:
                center += Vector((-lateral.y, lateral.x, 0.0)) * math.sin(progress * math.pi) * rng.uniform(-0.025, 0.025)
            centers.append(tuple(center))
            widths.append(width * (1.0 - 0.78 * progress))
        append_blade(vertices, faces, uv0, alpha, centers, widths)
    vertices = normalize_bounds(vertices, kind)
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    normal_mesh = bmesh.new()
    normal_mesh.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(normal_mesh, faces=normal_mesh.faces)
    normal_mesh.to_mesh(mesh)
    normal_mesh.free()
    mesh.materials.append(material)
    mesh.validate(verbose=True)
    mesh.update(calc_edges=True)
    first_uv = mesh.uv_layers.new(name="UVMap")
    second_uv = mesh.uv_layers.new(name="LightmapUV")
    colors = mesh.color_attributes.new(name=VERTEX_COLOR, type="BYTE_COLOR", domain="CORNER")
    grid = math.ceil(math.sqrt(len(mesh.polygons)))
    inset = 0.08 / grid
    cell = 1.0 / grid
    for polygon_index, polygon in enumerate(mesh.polygons):
        cell_x = polygon_index % grid
        cell_y = polygon_index // grid
        u_min = cell_x * cell + inset
        u_max = (cell_x + 1) * cell - inset
        v_min = cell_y * cell + inset
        v_max = (cell_y + 1) * cell - inset
        lightmap = [(u_min, v_min), (u_max, v_min), (u_max, v_max), (u_min, v_max)]
        for local_index, loop_index in enumerate(polygon.loop_indices):
            vertex_index = mesh.loops[loop_index].vertex_index
            first_uv.data[loop_index].uv = uv0[polygon_index][local_index]
            second_uv.data[loop_index].uv = lightmap[local_index]
            rooted = alpha[vertex_index]
            colors.data[loop_index].color = (
                0.20 + rooted * 0.05,
                0.29 + rooted * 0.10,
                0.12 + rooted * 0.06,
                rooted,
            )
        polygon.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0.0, 0.0, 0.0)
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.scale = (1.0, 1.0, 1.0)
    return obj


def triangle_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def bounds(obj: bpy.types.Object) -> dict[str, list[float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = [min(point[index] for point in points) for index in range(3)]
    maximum = [max(point[index] for point in points) for index in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": [maximum[index] - minimum[index] for index in range(3)],
    }


def export_selection(path: Path, obj: bpy.types.Object, kind: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if kind == "glb":
        bpy.ops.export_scene.gltf(
            filepath=str(path), export_format="GLB", use_selection=True, export_apply=True, export_yup=True
        )
    else:
        bpy.ops.export_scene.fbx(
            filepath=str(path), use_selection=True, apply_unit_scale=True, axis_forward="-Z", axis_up="Y",
            add_leaf_bones=False, mesh_smooth_type="FACE", use_tspace=True
        )
    obj.select_set(False)


def valid_root(x: float, y: float) -> bool:
    if abs(x) <= 5.20 and abs(y) <= 4.40:
        return False
    if abs(x) < 10.0 and abs(y - 0.28 * x) < 1.15:
        return False
    return True


def preview_roots(rng: random.Random, count: int) -> list[tuple[float, float, float]]:
    roots = []
    attempts = 0
    while len(roots) < count and attempts < 10000:
        attempts += 1
        x = rng.uniform(-11.25, 11.25)
        y = rng.uniform(-11.25, 11.25)
        if valid_root(x, y):
            roots.append((x, y, rng.uniform(0.0, math.tau)))
    if len(roots) != count:
        raise RuntimeError("Could not construct exact preview vegetation budget")
    return roots


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_preview(scene: bpy.types.Scene, stalk: bpy.types.Object, tuft: bpy.types.Object,
                   output_path: Path) -> None:
    stalk.hide_render = True
    tuft.hide_render = True
    rng = random.Random(0x5EED20A)
    for index, (x, y, yaw) in enumerate(preview_roots(rng, 42)):
        instance = bpy.data.objects.new(f"PreviewStalk_{index:03d}", stalk.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, -0.076)
        scale = rng.uniform(0.72, 1.06)
        instance.scale = (scale, scale, scale)
        instance.rotation_euler[2] = yaw
    for index, (x, y, yaw) in enumerate(preview_roots(rng, 64)):
        instance = bpy.data.objects.new(f"PreviewTuft_{index:03d}", tuft.data)
        bpy.context.collection.objects.link(instance)
        instance.location = (x, y, -0.076)
        scale = rng.uniform(0.70, 1.12)
        instance.scale = (scale, scale, scale)
        instance.rotation_euler[2] = yaw

    ground_material = bpy.data.materials.new("PreviewWetField")
    ground_material.use_nodes = True
    ground_shader = ground_material.node_tree.nodes.get("Principled BSDF")
    ground_shader.inputs["Base Color"].default_value = (0.018, 0.014, 0.008, 1.0)
    ground_shader.inputs["Roughness"].default_value = 0.71
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, -0.082))
    bpy.context.object.data.materials.append(ground_material)

    route_material = bpy.data.materials.new("PreviewCompactedRoute")
    route_material.diffuse_color = (0.028, 0.025, 0.019, 1.0)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, -0.068), scale=(10.7, 1.05, 0.01))
    route = bpy.context.object
    route.rotation_euler[2] = math.atan(0.28)
    route.data.materials.append(route_material)

    shelter_material = bpy.data.materials.new("PreviewShelter")
    shelter_material.diffuse_color = (0.075, 0.044, 0.017, 1.0)
    for x in (-3.6, 3.6):
        for y in (-2.6, 2.6):
            bpy.ops.mesh.primitive_cube_add(location=(x, y, 1.35), scale=(0.07, 0.07, 1.35))
            bpy.context.object.data.materials.append(shelter_material)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.83), scale=(4.2, 3.37, 0.055))
    bpy.context.object.data.materials.append(shelter_material)

    world = scene.world or bpy.data.worlds.new("VegetationWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.002, 0.004, 0.006, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.20
    bpy.ops.object.camera_add(location=(13.4, -16.4, 8.1))
    camera = bpy.context.object
    camera.data.lens = 52
    aim(camera, Vector((0.0, 0.0, 0.7)))
    scene.camera = camera
    bpy.ops.object.light_add(type="AREA", location=(-4.0, -4.0, 10.0))
    key = bpy.context.object
    key.data.energy = 1250.0
    key.data.color = (0.46, 0.58, 0.72)
    key.data.shape = "DISK"
    key.data.size = 9.0
    aim(key, Vector((0.0, 0.0, 0.0)))
    bpy.ops.object.light_add(type="AREA", location=(8.0, -1.0, 4.0))
    rim = bpy.context.object
    rim.data.energy = 520.0
    rim.data.color = (0.72, 0.42, 0.18)
    rim.data.size = 5.0
    aim(rim, Vector((2.0, 0.0, 0.5)))
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True)
    args = parser.parse_args(script_args())
    output_root = Path(args.output_root).resolve()
    source_dir = output_root / "source"
    rendered_dir = output_root / "rendered"
    export_dir = output_root / "export"
    for directory in (source_dir, rendered_dir, export_dir):
        directory.mkdir(parents=True, exist_ok=True)

    clear_scene()
    material = make_material()
    stalk_lod0 = make_blade_mesh(f"{STALK_MESH}_LOD0", "stalk", 14, 3, 0x5EED20A, material)
    stalk_lod1 = make_blade_mesh(f"{STALK_MESH}_LOD1", "stalk", 7, 2, 0x5EED20B, material)
    tuft_lod0 = make_blade_mesh(f"{TUFT_MESH}_LOD0", "tuft", 16, 2, 0x5EED20C, material)
    tuft_lod1 = make_blade_mesh(f"{TUFT_MESH}_LOD1", "tuft", 7, 1, 0x5EED20D, material)
    objects = {
        "stalk-lod0": stalk_lod0,
        "stalk-lod1": stalk_lod1,
        "tuft-lod0": tuft_lod0,
        "tuft-lod1": tuft_lod1,
    }
    for label, obj in objects.items():
        export_selection(export_dir / f"{ASSET_ID}-{label}.glb", obj, "glb")
        export_selection(export_dir / f"{ASSET_ID}-{label}.fbx", obj, "fbx")
    create_preview(bpy.context.scene, stalk_lod0, tuft_lod0, rendered_dir / f"{ASSET_ID}.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(rendered_dir / f"{ASSET_ID}.blend"))

    metrics = {
        "assetId": ASSET_ID,
        "blender": bpy.app.version_string,
        "generator": Path(__file__).name,
        "rootIntent": "deterministic texture-free generic wet-field vegetation production blockout",
        "historicalStatus": "generic rain-flattened field-edge forms; not an exact botanical reconstruction",
        "material": MATERIAL,
        "vertexColor": VERTEX_COLOR,
        "runtime": {
            "seed": "0x5EED20A",
            "stalkInstances": 42,
            "tuftInstances": 64,
            "fieldRootHalfExtentCentimeters": 1125.0,
            "centralExclusionHalfExtentCentimeters": [520.0, 440.0],
            "routeSlope": 0.28,
            "routeHalfWidthCentimeters": 115.0,
            "windSpeed": 0.38,
            "windAmplitudeCentimeters": 2.4,
            "windDirection": [1.0, 0.35, 0.0],
        },
        "meshes": {
            "stalk": {
                "lod0Triangles": triangle_count(stalk_lod0),
                "lod1Triangles": triangle_count(stalk_lod1),
                "lod0BoundsMeters": bounds(stalk_lod0),
                "lod1BoundsMeters": bounds(stalk_lod1),
            },
            "tuft": {
                "lod0Triangles": triangle_count(tuft_lod0),
                "lod1Triangles": triangle_count(tuft_lod1),
                "lod0BoundsMeters": bounds(tuft_lod0),
                "lod1BoundsMeters": bounds(tuft_lod1),
            },
        },
        "exports": [f"{ASSET_ID}-{label}.{extension}" for label in objects for extension in ("glb", "fbx")],
    }
    metrics_path = source_dir / f"{ASSET_ID}.metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
