import argparse
import json
import math
from pathlib import Path
import random
import sys

import bpy
import bmesh
from mathutils import Vector


ASSET_ID = "shi-daze-rain-vfx-v1"
STREAK_MESH = "SM_SHI_RainStreak_01"
RIPPLE_MESH = "SM_SHI_RainRipple_01"
STREAK_MATERIAL = "M_SHI_RainStreak"
RIPPLE_MATERIAL = "M_SHI_RainRipple"
VERTEX_COLOR = "ShiRainAlpha"


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"


def make_translucent_material(name: str, color: tuple[float, float, float, float], strength: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    if hasattr(material, "use_screen_refraction"):
        material.use_screen_refraction = False
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    elif hasattr(material, "blend_method"):
        material.blend_method = "BLEND"
        if hasattr(material, "show_transparent_back"):
            material.show_transparent_back = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = strength
    vertex = nodes.new("ShaderNodeVertexColor")
    vertex.layer_name = VERTEX_COLOR
    mix = nodes.new("ShaderNodeMixShader")
    links.new(vertex.outputs["Alpha"], mix.inputs[0])
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(emission.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])
    return material


def add_mesh(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]],
             uv0: list[list[tuple[float, float]]], uv1: list[list[tuple[float, float]]],
             alpha_by_vertex: list[float], material: bpy.types.Material) -> bpy.types.Object:
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
    for polygon_index, polygon in enumerate(mesh.polygons):
        for local_index, loop_index in enumerate(polygon.loop_indices):
            vertex_index = mesh.loops[loop_index].vertex_index
            first_uv.data[loop_index].uv = uv0[polygon_index][local_index]
            second_uv.data[loop_index].uv = uv1[polygon_index][local_index]
            colors.data[loop_index].color = (0.42, 0.62, 0.76, alpha_by_vertex[vertex_index])
        polygon.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0.0, 0.0, 0.0)
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.scale = (1.0, 1.0, 1.0)
    return obj


def make_streak(name: str, material: bpy.types.Material, crossed: bool) -> bpy.types.Object:
    width = 0.012
    rows = ((0.0, 0.0), (0.12, 0.90), (0.88, 0.90), (1.0, 0.0))
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    uv0: list[list[tuple[float, float]]] = []
    uv1: list[list[tuple[float, float]]] = []
    alpha: list[float] = []
    plane_count = 2 if crossed else 1
    for plane_index in range(plane_count):
        base = len(vertices)
        for z, row_alpha in rows:
            if plane_index == 0:
                vertices.extend(((-width * 0.5, 0.0, z), (width * 0.5, 0.0, z)))
            else:
                vertices.extend(((0.0, -width * 0.5, z), (0.0, width * 0.5, z)))
            alpha.extend((row_alpha, row_alpha))
        uv1_min = 0.0 if plane_index == 0 else 0.52
        uv1_max = 0.48 if plane_index == 0 else 1.0
        for row_index in range(len(rows) - 1):
            lower_v = rows[row_index][0]
            upper_v = rows[row_index + 1][0]
            faces.append((base + row_index * 2, base + row_index * 2 + 1,
                          base + (row_index + 1) * 2 + 1, base + (row_index + 1) * 2))
            uv0.append([(0.0, lower_v), (1.0, lower_v), (1.0, upper_v), (0.0, upper_v)])
            uv1.append([(uv1_min, lower_v), (uv1_max, lower_v),
                        (uv1_max, upper_v), (uv1_min, upper_v)])
    return add_mesh(name, vertices, faces, uv0, uv1, alpha, material)


def make_ripple(name: str, material: bpy.types.Material, segments: int, radii: list[float], alphas: list[float]) -> bpy.types.Object:
    vertices: list[tuple[float, float, float]] = []
    for radius in radii:
        for index in range(segments):
            angle = math.tau * index / segments
            vertices.append((radius * math.cos(angle), radius * math.sin(angle), 0.0))
    faces: list[tuple[int, ...]] = []
    uv0: list[list[tuple[float, float]]] = []
    uv1: list[list[tuple[float, float]]] = []
    for ring in range(len(radii) - 1):
        for index in range(segments):
            next_index = (index + 1) % segments
            face = (
                ring * segments + index,
                ring * segments + next_index,
                (ring + 1) * segments + next_index,
                (ring + 1) * segments + index,
            )
            faces.append(face)
            mapped = []
            for vertex_index in face:
                x, y, _ = vertices[vertex_index]
                mapped.append((0.5 + x, 0.5 + y))
            uv0.append(mapped)
            uv1.append(mapped)
    alpha_by_vertex = [alphas[index // segments] for index in range(len(vertices))]
    return add_mesh(name, vertices, faces, uv0, uv1, alpha_by_vertex, material)


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


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_preview(scene: bpy.types.Scene, streak: bpy.types.Object, ripple: bpy.types.Object,
                   output_path: Path) -> None:
    streak.hide_render = True
    ripple.hide_render = True
    rng = random.Random(0x5EED209)
    for index in range(120):
        x = rng.uniform(-5.8, 5.8)
        y = rng.uniform(-4.2, 4.2)
        z = rng.uniform(0.15, 5.2)
        if abs(x) < 2.15 and abs(y) < 1.65 and z < 2.6:
            z += 2.7
        preview = bpy.data.objects.new(f"PreviewStreak_{index:03d}", streak.data)
        bpy.context.collection.objects.link(preview)
        preview.location = (x, y, z)
        preview.scale = (rng.uniform(0.75, 1.25), rng.uniform(0.75, 1.25), rng.uniform(0.55, 1.25))
        preview.rotation_euler = (math.radians(-4.0), math.radians(8.0), 0.0)
    for index in range(18):
        x = rng.uniform(-5.5, 5.5)
        y = rng.uniform(-3.9, 3.9)
        if abs(x) < 2.2 and abs(y) < 1.7:
            x += 3.0 if x >= 0 else -3.0
        preview = bpy.data.objects.new(f"PreviewRipple_{index:03d}", ripple.data)
        bpy.context.collection.objects.link(preview)
        preview.location = (x, y, 0.012)
        scale = rng.uniform(0.35, 1.0)
        preview.scale = (scale, scale, 1.0)
    ground_material = bpy.data.materials.new("PreviewWetGround")
    ground_material.use_nodes = True
    ground = ground_material.node_tree.nodes.get("Principled BSDF")
    ground.inputs["Base Color"].default_value = (0.006, 0.012, 0.014, 1.0)
    ground.inputs["Roughness"].default_value = 0.24
    ground.inputs["Metallic"].default_value = 0.0
    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0.0, 0.0, 0.0))
    plane = bpy.context.object
    plane.name = "PreviewWetField"
    plane.data.materials.append(ground_material)
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.72), scale=(2.2, 1.7, 0.035))
    roof = bpy.context.object
    roof.name = "PreviewShelterExclusion"
    roof_material = bpy.data.materials.new("PreviewRoof")
    roof_material.diffuse_color = (0.045, 0.025, 0.008, 1.0)
    roof.data.materials.append(roof_material)
    world = scene.world or bpy.data.worlds.new("RainWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.001, 0.003, 0.006, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18
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
    scene.render.film_transparent = False
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
    streak_material = make_translucent_material(STREAK_MATERIAL, (0.11, 0.19, 0.25, 1.0), 1.2)
    ripple_material = make_translucent_material(RIPPLE_MATERIAL, (0.055, 0.11, 0.15, 1.0), 0.8)
    streak_lod0 = make_streak(f"{STREAK_MESH}_LOD0", streak_material, True)
    streak_lod1 = make_streak(f"{STREAK_MESH}_LOD1", streak_material, False)
    ripple_lod0 = make_ripple(f"{RIPPLE_MESH}_LOD0", ripple_material, 48, [0.34, 0.38, 0.45, 0.50], [0.0, 0.58, 0.92, 0.0])
    ripple_lod1 = make_ripple(f"{RIPPLE_MESH}_LOD1", ripple_material, 16, [0.34, 0.43, 0.50], [0.0, 0.90, 0.0])
    objects = {
        "streak-lod0": streak_lod0,
        "streak-lod1": streak_lod1,
        "ripple-lod0": ripple_lod0,
        "ripple-lod1": ripple_lod1,
    }
    for label, obj in objects.items():
        export_selection(export_dir / f"{ASSET_ID}-{label}.glb", obj, "glb")
        export_selection(export_dir / f"{ASSET_ID}-{label}.fbx", obj, "fbx")
    create_preview(bpy.context.scene, streak_lod0, ripple_lod0, rendered_dir / f"{ASSET_ID}.png")
    blend_path = rendered_dir / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    metrics = {
        "assetId": ASSET_ID,
        "blender": bpy.app.version_string,
        "generator": Path(__file__).name,
        "rootIntent": "deterministic texture-free rain streak/ripple production VFX blockout",
        "historicalStatus": "dramatic rain reconstruction; not evidence of exact Daze weather in 209 BCE",
        "materials": [STREAK_MATERIAL, RIPPLE_MATERIAL],
        "runtime": {
            "streakInstances": 384,
            "ripplePoolInstances": 72,
            "fieldHalfExtentCentimeters": 1200.0,
            "spawnCeilingCentimeters": 1050.0,
            "groundInterceptCentimeters": -5.0,
            "shelterHalfExtentCentimeters": [420.0, 336.7437],
            "shelterRoofInterceptCentimeters": 340.0,
            "velocityCentimetersPerSecond": [130.0, 45.0, -1900.0],
            "rippleLifetimeSeconds": 0.70,
        },
        "meshes": {
            "streak": {
                "lod0Triangles": triangle_count(streak_lod0),
                "lod1Triangles": triangle_count(streak_lod1),
                "lod0BoundsMeters": bounds(streak_lod0),
                "lod1BoundsMeters": bounds(streak_lod1),
            },
            "ripple": {
                "lod0Triangles": triangle_count(ripple_lod0),
                "lod1Triangles": triangle_count(ripple_lod1),
                "lod0BoundsMeters": bounds(ripple_lod0),
                "lod1BoundsMeters": bounds(ripple_lod1),
            },
        },
        "exports": [f"export/{ASSET_ID}-{label}.{kind}" for label in objects for kind in ("glb", "fbx")],
    }
    (source_dir / f"{ASSET_ID}.metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
