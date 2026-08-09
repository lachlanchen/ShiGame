import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-wet-field-environment-v1"
GROUND_MATERIAL = "M_SHI_WetFieldGround"
WATER_MATERIAL = "M_SHI_ShallowRainwater"
HALF_EXTENT = 12.0
BOTTOM_Z = -0.32


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def smoothstep(edge0: float, edge1: float, value: float) -> float:
    t = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def road_center(x: float) -> float:
    return -5.15 + 0.085 * x + 0.22 * math.sin(x * 0.29 + 0.4)


def terrain_height(x: float, y: float) -> float:
    broad = (
        0.030 * math.sin(x * 0.43 + y * 0.18)
        + 0.018 * math.sin(y * 0.71 - x * 0.16 + 1.2)
        + 0.012 * math.cos((x + y) * 0.91)
    )
    central_distance = math.sqrt((x / 4.25) ** 2 + (y / 3.10) ** 2)
    central_blend = smoothstep(0.88, 1.45, central_distance)
    height = -0.120 + broad * central_blend

    route_distance = abs(y - road_center(x))
    route_basin = math.exp(-((route_distance / 1.42) ** 4))
    rut_a = math.exp(-(((route_distance - 0.56) / 0.19) ** 2))
    rut_b = math.exp(-(((route_distance - 0.82) / 0.22) ** 2))
    height -= 0.018 * route_basin + 0.030 * rut_a + 0.018 * rut_b

    drainage_center = 6.25 - 0.10 * x + 0.20 * math.sin(x * 0.22)
    height -= 0.065 * math.exp(-(((y - drainage_center) / 0.62) ** 2))

    edge = max(abs(x), abs(y))
    height -= 0.060 * smoothstep(9.3, HALF_EXTENT, edge)
    return max(-0.255, min(-0.082, height))


def make_material(
    name: str,
    dark: tuple[float, float, float, float],
    light: tuple[float, float, float, float],
    roughness: float,
    scale: float,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = roughness
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.67
    noise.inputs["Distortion"].default_value = 0.06
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.24
    ramp.color_ramp.elements[0].color = dark
    ramp.color_ramp.elements[1].position = 0.79
    ramp.color_ramp.elements[1].color = light
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    road_ramp = nodes.new("ShaderNodeValToRGB")
    road_ramp.color_ramp.elements[0].position = 0.22
    road_ramp.color_ramp.elements[0].color = (0.006, 0.005, 0.004, 1.0)
    road_ramp.color_ramp.elements[1].position = 0.80
    road_ramp.color_ramp.elements[1].color = (0.040, 0.020, 0.010, 1.0)
    links.new(noise.outputs["Fac"], road_ramp.inputs["Fac"])
    route_mask = nodes.new("ShaderNodeVertexColor")
    route_mask.layer_name = "ShiRouteMask"
    mix = nodes.new("ShaderNodeMixRGB")
    mix.blend_type = "MIX"
    links.new(route_mask.outputs["Alpha"], mix.inputs["Fac"])
    links.new(ramp.outputs["Color"], mix.inputs[1])
    links.new(road_ramp.outputs["Color"], mix.inputs[2])
    links.new(mix.outputs["Color"], principled.inputs["Base Color"])
    return material


def make_water_material() -> bpy.types.Material:
    material = bpy.data.materials.new(WATER_MATERIAL)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.014, 0.022, 0.018, 1.0)
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = 0.16
    principled.inputs["IOR"].default_value = 1.333
    return material


def create_terrain(
    name: str,
    resolution: int,
    earth: bpy.types.Material,
) -> bpy.types.Object:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    material_indices: list[int] = []
    step = (HALF_EXTENT * 2.0) / (resolution - 1)

    for yi in range(resolution):
        y = -HALF_EXTENT + yi * step
        for xi in range(resolution):
            x = -HALF_EXTENT + xi * step
            vertices.append((x, y, terrain_height(x, y)))

    for yi in range(resolution - 1):
        for xi in range(resolution - 1):
            a = yi * resolution + xi
            b = a + 1
            d = (yi + 1) * resolution + xi
            c = d + 1
            faces.extend(((a, b, c), (a, c, d)))
            material_indices.extend((0, 0))

    boundary: list[int] = []
    boundary.extend(range(0, resolution))
    boundary.extend(yi * resolution + resolution - 1 for yi in range(1, resolution))
    boundary.extend((resolution - 1) * resolution + xi for xi in range(resolution - 2, -1, -1))
    boundary.extend(yi * resolution for yi in range(resolution - 2, 0, -1))
    bottom_boundary: list[int] = []
    for top_index in boundary:
        x, y, _ = vertices[top_index]
        bottom_boundary.append(len(vertices))
        vertices.append((x, y, BOTTOM_Z))
    bottom_center = len(vertices)
    vertices.append((0.0, 0.0, BOTTOM_Z))
    for index, top_index in enumerate(boundary):
        next_index = (index + 1) % len(boundary)
        next_top = boundary[next_index]
        bottom = bottom_boundary[index]
        next_bottom = bottom_boundary[next_index]
        faces.append((top_index, bottom, next_bottom, next_top))
        material_indices.append(0)
        faces.append((bottom_center, next_bottom, bottom))
        material_indices.append(0)

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(earth)
    route_colors = mesh.color_attributes.new(name="ShiRouteMask", type="BYTE_COLOR", domain="CORNER")
    for loop in mesh.loops:
        vertex = mesh.vertices[loop.vertex_index]
        distance = abs(vertex.co.y - road_center(vertex.co.x))
        route = 1.0 - smoothstep(0.82, 1.48, distance)
        # RGB is the bounded interchange fallback; alpha carries the route
        # blend consumed by the authored Unreal material.
        route_colors.data[loop.index].color = (0.060, 0.030, 0.015, route)
    for polygon, material_index in zip(mesh.polygons, material_indices):
        polygon.material_index = material_index
        polygon.use_smooth = polygon.center.z > BOTTOM_Z + 0.001
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj["shi_use"] = "bounded waterlogged field and route context"
    obj["shi_historical_status"] = "project-authored environment design; not a surveyed reconstruction"
    return obj


def create_puddle(
    name: str,
    center: tuple[float, float],
    radii: tuple[float, float],
    rotation: float,
    segments: int,
    water: bpy.types.Material,
) -> bpy.types.Object:
    cx, cy = center
    base_z = terrain_height(cx, cy) + 0.008
    vertices = [(cx, cy, base_z)]
    for index in range(segments):
        angle = math.tau * index / segments
        local_x = radii[0] * math.cos(angle) * (1.0 + 0.06 * math.sin(angle * 3.0 + cx))
        local_y = radii[1] * math.sin(angle) * (1.0 + 0.05 * math.cos(angle * 4.0 + cy))
        x = cx + local_x * math.cos(rotation) - local_y * math.sin(rotation)
        y = cy + local_x * math.sin(rotation) + local_y * math.cos(rotation)
        z = max(base_z - 0.006, terrain_height(x, y) + 0.006)
        vertices.append((x, y, z))
    faces = [(0, index + 1, ((index + 1) % segments) + 1) for index in range(segments)]
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(water)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def create_puddles(water: bpy.types.Material, lod: str, detailed: bool) -> list[bpy.types.Object]:
    specs = (
        ((5.3, -5.15), (1.20, 0.48), -0.12),
        ((-4.2, -5.55), (0.92, 0.34), 0.18),
        ((8.2, 6.05), (1.34, 0.42), -0.26),
        ((-7.5, 6.75), (1.05, 0.38), 0.11),
        ((8.8, -1.7), (0.73, 0.30), -0.31),
    )
    segments = 32 if detailed else 12
    return [
        create_puddle(
            f"SM_SHI_WetField_{lod}_Puddle{index + 1:02d}",
            center,
            radii,
            rotation,
            segments,
            water,
        )
        for index, (center, radii, rotation) in enumerate(specs)
    ]


def unwrap_object(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    obj.data.uv_layers.new(name="UVMap")
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.018)
    bpy.ops.object.mode_set(mode="OBJECT")
    source = obj.data.uv_layers[0]
    lightmap = obj.data.uv_layers.new(name="LightmapUV")
    for index, source_uv in enumerate(source.data):
        lightmap.data[index].uv = source_uv.uv.copy()
    obj.select_set(False)


def normalize_material_slots(obj: bpy.types.Object, materials: list[bpy.types.Material]) -> None:
    old_names = [slot.name if slot else "" for slot in obj.data.materials]
    face_names = [old_names[polygon.material_index] for polygon in obj.data.polygons]
    obj.data.materials.clear()
    for material in materials:
        obj.data.materials.append(material)
    name_to_index = {material.name: index for index, material in enumerate(materials)}
    for polygon, material_name in zip(obj.data.polygons, face_names):
        polygon.material_index = name_to_index[material_name]


def combined_export_copy(
    objects: list[bpy.types.Object],
    name: str,
    materials: list[bpy.types.Material],
) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    copies = []
    for source in objects:
        duplicate = source.copy()
        duplicate.data = source.data.copy()
        duplicate.hide_set(False)
        duplicate.hide_render = True
        bpy.context.collection.objects.link(duplicate)
        duplicate.select_set(True)
        copies.append(duplicate)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    combined = bpy.context.object
    combined.name = name
    combined.data.name = name + "_mesh"
    normalize_material_slots(combined, materials)
    unwrap_object(combined)
    combined.hide_set(True)
    return combined


def create_collision() -> bpy.types.Object:
    material = bpy.data.materials.new("M_SHI_WetField_Collision")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, -0.19))
    collision = bpy.context.object
    collision.name = "UCX_SM_SHI_WetFieldEnvironment_01_01"
    collision.dimensions = (24.0, 24.0, 0.26)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    collision.data.materials.append(material)
    collision.display_type = "WIRE"
    collision.hide_render = True
    return collision


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_studio() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    bpy.ops.object.camera_add(location=(11.8, -14.5, 9.2))
    camera = bpy.context.object
    camera.name = "inspection_camera"
    camera.data.lens = 52
    aim(camera, Vector((0.0, -0.4, -0.10)))
    bpy.context.scene.camera = camera
    lights: list[bpy.types.Object] = []
    for name, location, energy, size, color in (
        ("cool_overcast", (-5.0, -3.0, 13.0), 3600.0, 8.0, (0.46, 0.58, 0.75)),
        ("distant_fire", (-3.8, -5.5, 2.8), 2100.0, 4.0, (1.0, 0.34, 0.09)),
        ("wet_edge", (8.0, 6.0, 7.0), 1850.0, 5.0, (0.42, 0.62, 0.88)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, -0.1)))
        lights.append(light)
    return camera, lights


def triangle_count(objects: list[bpy.types.Object]) -> int:
    total = 0
    for obj in objects:
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def export_selection(path: Path, objects: list[bpy.types.Object], kind: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if kind == "glb":
        bpy.ops.export_scene.gltf(
            filepath=str(path), export_format="GLB", use_selection=True, export_apply=True, export_yup=True
        )
    else:
        bpy.ops.export_scene.fbx(
            filepath=str(path), use_selection=True, apply_unit_scale=True, axis_forward="-Z", axis_up="Y",
            add_leaf_bones=False, mesh_smooth_type="FACE", use_tspace=True
        )
    for obj in objects:
        obj.select_set(False)


def prepare_interchange_materials(materials: list[bpy.types.Material]) -> None:
    settings = {
        GROUND_MATERIAL: ((0.018, 0.009, 0.003, 1.0), 0.82),
        WATER_MATERIAL: ((0.006, 0.011, 0.009, 1.0), 0.16),
    }
    for material in materials:
        principled = material.node_tree.nodes.get("Principled BSDF")
        for socket_name in ("Base Color", "Roughness", "Normal"):
            for link in list(principled.inputs[socket_name].links):
                material.node_tree.links.remove(link)
        base_color, roughness = settings[material.name]
        principled.inputs["Base Color"].default_value = base_color
        principled.inputs["Roughness"].default_value = roughness
        principled.inputs["Metallic"].default_value = 0.0
        # GLB exporters deliberately support only a constrained Principled
        # graph.  Strip lookdev-only nodes after the editable .blend is saved
        # so both GLB and FBX carry the same explicit dark PBR fallback.
        for node in list(material.node_tree.nodes):
            if node != principled and node.bl_idname != "ShaderNodeOutputMaterial":
                material.node_tree.nodes.remove(node)
        material.diffuse_color = base_color
        material.metallic = 0.0
        material.roughness = roughness
        material.use_nodes = False


def render(scene: bpy.types.Scene, path: Path) -> None:
    scene.render.filepath = str(path)
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
    earth = make_material(GROUND_MATERIAL, (0.012, 0.0045, 0.0015, 1.0), (0.075, 0.026, 0.006, 1.0), 0.82, 2.15)
    water = make_water_material()
    materials = [earth, water]
    lod0 = [
        create_terrain("SM_SHI_WetField_LOD0_Terrain", 65, earth),
        *create_puddles(water, "LOD0", True),
    ]
    lod1 = [
        create_terrain("SM_SHI_WetField_LOD1_Terrain", 33, earth),
        *create_puddles(water, "LOD1", False),
    ]
    for obj in [*lod0, *lod1]:
        unwrap_object(obj)
    for obj in lod1:
        obj.hide_set(True)
        obj.hide_render = True
    collision = create_collision()
    unreal_lod0 = combined_export_copy(lod0, "SM_SHI_WetFieldEnvironment_01_LOD0_Source", materials)
    unreal_lod1 = combined_export_copy(lod1, "SM_SHI_WetFieldEnvironment_01_LOD1_Source", materials)
    camera, studio = create_studio()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("SHI_WetField_World")
    scene.world.color = (0.002, 0.004, 0.006)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.10
    render(scene, rendered_dir / f"{ASSET_ID}.png")

    hero_location = camera.location.copy()
    hero_rotation = camera.rotation_euler.copy()
    camera.location = (0.0, -15.5, 1.25)
    camera.data.lens = 58
    aim(camera, Vector((0.0, 0.0, -0.13)))
    render(scene, rendered_dir / f"{ASSET_ID}-profile.png")
    camera.location = hero_location
    camera.rotation_euler = hero_rotation
    camera.data.lens = 52

    blend_path = rendered_dir / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    prepare_interchange_materials(materials)
    export_selection(export_dir / f"{ASSET_ID}-lod0.glb", lod0, "glb")
    export_selection(export_dir / f"{ASSET_ID}-lod1.glb", lod1, "glb")
    unreal_lod0.name = "SM_SHI_WetFieldEnvironment_01"
    export_selection(export_dir / f"{ASSET_ID}.fbx", [unreal_lod0, collision], "fbx")
    unreal_lod0.name = "SM_SHI_WetFieldEnvironment_01_LOD0_Source"
    unreal_lod1.name = "SM_SHI_WetFieldEnvironment_01"
    export_selection(export_dir / f"{ASSET_ID}-lod1.fbx", [unreal_lod1], "fbx")
    unreal_lod1.name = "SM_SHI_WetFieldEnvironment_01_LOD1_Source"

    all_positions = [vertex.co for obj in lod0 for vertex in obj.data.vertices]
    bounds_min = [min(position[index] for position in all_positions) for index in range(3)]
    bounds_max = [max(position[index] for position in all_positions) for index in range(3)]
    center_samples = [
        terrain_height(x, y)
        for x in (-3.2, 0.0, 3.2)
        for y in (-2.2, 0.0, 2.2)
    ]
    metrics = {
        "assetId": ASSET_ID,
        "generator": "deterministic Blender source script",
        "blender": bpy.app.version_string,
        "historicalStatus": "project-authored Daze rain-pressure environment; not surveyed reconstruction",
        "boundsMeters": {"minimum": bounds_min, "maximum": bounds_max},
        "centralHeightMeters": {"minimum": min(center_samples), "maximum": max(center_samples)},
        "lod0Triangles": triangle_count(lod0),
        "lod1Triangles": triangle_count(lod1),
        "collisionTriangles": triangle_count([collision]),
        "materials": [material.name for material in materials],
        "components": [obj.name for obj in lod0],
        "collision": collision.name,
        "rootIntent": "identity at command-space origin; central ground remains below command-surface bottom",
        "exports": {
            "blend": f"../rendered/{ASSET_ID}.blend",
            "render": f"../rendered/{ASSET_ID}.png",
            "profileRender": f"../rendered/{ASSET_ID}-profile.png",
            "cleanImportRender": f"../rendered/{ASSET_ID}-glb-import.png",
            "lod0Glb": f"../export/{ASSET_ID}-lod0.glb",
            "lod1Glb": f"../export/{ASSET_ID}-lod1.glb",
            "fbx": f"../export/{ASSET_ID}.fbx",
            "lod1Fbx": f"../export/{ASSET_ID}-lod1.fbx",
        },
    }
    (source_dir / f"{ASSET_ID}.metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
