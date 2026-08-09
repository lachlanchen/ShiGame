import argparse
import json
import math
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-field-shelter-v1"
MESH_NAME = "SM_SHI_DazeFieldShelter_01"
WOOD_MATERIAL = "M_SHI_RainDarkenedWood"
REED_MATERIAL = "M_SHI_WovenReedMat"
CORD_MATERIAL = "M_SHI_CoarseFiberCord"
MATERIAL_NAMES = [WOOD_MATERIAL, REED_MATERIAL, CORD_MATERIAL]


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def make_lookdev_material(
    name: str,
    dark: tuple[float, float, float, float],
    light: tuple[float, float, float, float],
    roughness: float,
    noise_scale: float,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = roughness
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = noise_scale
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.62
    noise.inputs["Distortion"].default_value = 0.025
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.28
    ramp.color_ramp.elements[0].color = dark
    ramp.color_ramp.elements[1].position = 0.76
    ramp.color_ramp.elements[1].color = light
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    material.diffuse_color = light
    material.metallic = 0.0
    material.roughness = roughness
    return material


def create_materials() -> list[bpy.types.Material]:
    wood = make_lookdev_material(
            WOOD_MATERIAL,
            (0.0045, 0.0024, 0.0014, 1.0),
            (0.031, 0.014, 0.006, 1.0),
            0.82,
            3.2,
        )
    reed = bpy.data.materials.new(REED_MATERIAL)
    reed.use_nodes = True
    reed_nodes = reed.node_tree.nodes
    reed_links = reed.node_tree.links
    reed_principled = reed_nodes.get("Principled BSDF")
    reed_principled.inputs["Metallic"].default_value = 0.0
    reed_principled.inputs["Roughness"].default_value = 0.88
    coordinates = reed_nodes.new("ShaderNodeTexCoord")
    strands = reed_nodes.new("ShaderNodeTexWave")
    strands.wave_type = "BANDS"
    strands.bands_direction = "X"
    strands.inputs["Scale"].default_value = 52.0
    strands.inputs["Distortion"].default_value = 2.2
    strands.inputs["Detail"].default_value = 2.0
    strand_ramp = reed_nodes.new("ShaderNodeValToRGB")
    strand_ramp.color_ramp.elements[0].position = 0.32
    strand_ramp.color_ramp.elements[0].color = (0.012, 0.004, 0.001, 1.0)
    strand_ramp.color_ramp.elements[1].position = 0.68
    strand_ramp.color_ramp.elements[1].color = (0.080, 0.038, 0.006, 1.0)
    broad_noise = reed_nodes.new("ShaderNodeTexNoise")
    broad_noise.inputs["Scale"].default_value = 2.4
    broad_noise.inputs["Detail"].default_value = 1.5
    broad_noise.inputs["Roughness"].default_value = 0.55
    broad_ramp = reed_nodes.new("ShaderNodeValToRGB")
    broad_ramp.color_ramp.elements[0].position = 0.24
    broad_ramp.color_ramp.elements[0].color = (0.18, 0.10, 0.02, 1.0)
    broad_ramp.color_ramp.elements[1].position = 0.78
    broad_ramp.color_ramp.elements[1].color = (1.0, 0.58, 0.16, 1.0)
    multiply = reed_nodes.new("ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = 0.42
    reed_links.new(coordinates.outputs["Generated"], strands.inputs["Vector"])
    reed_links.new(coordinates.outputs["Generated"], broad_noise.inputs["Vector"])
    reed_links.new(strands.outputs["Color"], strand_ramp.inputs["Fac"])
    reed_links.new(broad_noise.outputs["Fac"], broad_ramp.inputs["Fac"])
    reed_links.new(strand_ramp.outputs["Color"], multiply.inputs[1])
    reed_links.new(broad_ramp.outputs["Color"], multiply.inputs[2])
    reed_links.new(multiply.outputs["Color"], reed_principled.inputs["Base Color"])
    reed.diffuse_color = (0.050, 0.035, 0.009, 1.0)
    reed.metallic = 0.0
    reed.roughness = 0.88
    cord = make_lookdev_material(
            CORD_MATERIAL,
            (0.0025, 0.0018, 0.0012, 1.0),
            (0.021, 0.012, 0.006, 1.0),
            0.93,
            11.0,
        )
    return [wood, reed, cord]


def apply_identity(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)


def create_cylinder_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    vertices: int,
    material: bpy.types.Material,
) -> bpy.types.Object:
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=direction.length,
        end_fill_type="NGON",
        location=(start_vector + end_vector) * 0.5,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name + "_mesh"
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.rotation_mode = "XYZ"
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    apply_identity(obj)
    return obj


def create_roof_panel(
    name: str,
    x0: float,
    x1: float,
    y0: float,
    y1: float,
    z0: float,
    z1: float,
    lift: float,
    thickness: float,
    material: bpy.types.Material,
    weave_value: float,
) -> bpy.types.Object:
    grid = 3
    layer_size = grid * grid
    vertices: list[tuple[float, float, float]] = []
    for layer_offset in (0.0, -thickness):
        for yi in range(grid):
            v = yi / (grid - 1)
            y = y0 + (y1 - y0) * v
            baseline_z = z0 + (z1 - z0) * v
            for xi in range(grid):
                u = xi / (grid - 1)
                x = x0 + (x1 - x0) * u
                sag = -0.022 * math.sin(math.pi * u) * math.sin(math.pi * v)
                vertices.append((x, y, baseline_z + lift + layer_offset + sag))
    faces: list[tuple[int, ...]] = []
    for yi in range(grid - 1):
        for xi in range(grid - 1):
            top = yi * grid + xi
            bottom = layer_size + top
            faces.append((top, top + 1, top + grid + 1, top + grid))
            faces.append((bottom + grid, bottom + grid + 1, bottom + 1, bottom))
    for xi in range(grid - 1):
        faces.append((xi, layer_size + xi, layer_size + xi + 1, xi + 1))
        top_edge = (grid - 1) * grid + xi
        faces.append((top_edge + 1, layer_size + top_edge + 1, layer_size + top_edge, top_edge))
    for yi in range(grid - 1):
        left = yi * grid
        faces.append((left + grid, layer_size + left + grid, layer_size + left, left))
        right = yi * grid + grid - 1
        faces.append((right, layer_size + right, layer_size + right + grid, right + grid))
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    weave = mesh.color_attributes.new(name="ShiReedWeave", type="BYTE_COLOR", domain="CORNER")
    shade = 0.052 if weave_value < 0.5 else 0.068
    for datum in weave.data:
        datum.color = (shade, shade * 0.62, shade * 0.18, 1.0)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def roof_line(y: float) -> float:
    return 3.34 - (3.34 - 2.78) * abs(y) / 3.30


def create_lashing(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    material: bpy.types.Material,
    detailed: bool,
    around_x_axis: bool = False,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        align="WORLD",
        major_segments=12 if detailed else 8,
        minor_segments=4 if detailed else 3,
        location=location,
        major_radius=radius,
        minor_radius=0.014 if detailed else 0.018,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name + "_mesh"
    obj.data.materials.append(material)
    if around_x_axis:
        obj.rotation_euler.y = math.pi * 0.5
    apply_identity(obj)
    return obj


def create_shelter_components(
    lod: str,
    materials: list[bpy.types.Material],
    detailed: bool,
) -> list[bpy.types.Object]:
    wood, reed, cord = materials
    radial_segments = 12 if detailed else 8
    objects: list[bpy.types.Object] = []
    post_positions = ((-3.6, -2.6), (3.6, -2.6), (-3.6, 2.6), (3.6, 2.6))
    for index, (x, y) in enumerate(post_positions, 1):
        objects.append(create_cylinder_between(
            f"SM_SHI_DazeShelter_{lod}_Post{index:02d}",
            (x, y, -0.18),
            (x, y, 2.70),
            0.115 if detailed else 0.13,
            radial_segments,
            wood,
        ))

    for index, y in enumerate((-2.60, 2.60), 1):
        objects.append(create_cylinder_between(
            f"SM_SHI_DazeShelter_{lod}_EaveBeam{index:02d}",
            (-3.98, y, 2.66),
            (3.98, y, 2.66),
            0.090 if detailed else 0.105,
            radial_segments,
            wood,
        ))
    objects.append(create_cylinder_between(
        f"SM_SHI_DazeShelter_{lod}_RidgeBeam",
        (-4.05, 0.0, 3.23),
        (4.05, 0.0, 3.23),
        0.095 if detailed else 0.11,
        radial_segments,
        wood,
    ))
    for index, x in enumerate((-3.6, 3.6), 1):
        objects.append(create_cylinder_between(
            f"SM_SHI_DazeShelter_{lod}_CrossTie{index:02d}",
            (x, -2.90, 2.59),
            (x, 2.90, 2.59),
            0.075 if detailed else 0.09,
            radial_segments,
            wood,
        ))

    rafter_positions = (-3.6, -2.4, -1.2, 0.0, 1.2, 2.4, 3.6) if detailed else (-3.6, 0.0, 3.6)
    for index, x in enumerate(rafter_positions, 1):
        objects.append(create_cylinder_between(
            f"SM_SHI_DazeShelter_{lod}_RafterN{index:02d}",
            (x, -3.36, 2.68),
            (x, 0.0, 3.27),
            0.043 if detailed else 0.062,
            9 if detailed else 7,
            wood,
        ))
        objects.append(create_cylinder_between(
            f"SM_SHI_DazeShelter_{lod}_RafterS{index:02d}",
            (x, 0.0, 3.27),
            (x, 3.36, 2.68),
            0.043 if detailed else 0.062,
            9 if detailed else 7,
            wood,
        ))

    if detailed:
        brace_specs = (
            ((-3.6, -2.6, 2.38), (-2.85, -2.6, 2.66)),
            ((3.6, -2.6, 2.38), (2.85, -2.6, 2.66)),
            ((-3.6, 2.6, 2.38), (-2.85, 2.6, 2.66)),
            ((3.6, 2.6, 2.38), (2.85, 2.6, 2.66)),
            ((-3.6, -2.6, 2.35), (-3.6, -1.90, 2.59)),
            ((3.6, -2.6, 2.35), (3.6, -1.90, 2.59)),
            ((-3.6, 2.6, 2.35), (-3.6, 1.90, 2.59)),
            ((3.6, 2.6, 2.35), (3.6, 1.90, 2.59)),
        )
        for index, (start, end) in enumerate(brace_specs, 1):
            objects.append(create_cylinder_between(
                f"SM_SHI_DazeShelter_{lod}_Brace{index:02d}",
                start,
                end,
                0.045,
                8,
                wood,
            ))

    panel_columns = 7 if detailed else 1
    panel_rows = ((0.0, 0.38), (0.34, 0.72), (0.68, 1.0)) if detailed else ((0.0, 1.0),)
    panel_width = 8.40 / panel_columns
    for side_index, side in enumerate((-1.0, 1.0), 1):
        eave_y = side * 3.30
        ridge_y = 0.0
        for row_index, (t0, t1) in enumerate(panel_rows, 1):
            y0 = eave_y + (ridge_y - eave_y) * t0
            y1 = eave_y + (ridge_y - eave_y) * t1
            z0 = roof_line(y0)
            z1 = roof_line(y1)
            if not detailed:
                # Match the authored LOD0 ridge silhouette without retaining
                # the three overlapping mat rows.
                z1 += 0.020
            for column in range(panel_columns):
                x0 = -4.20 + column * panel_width
                x1 = x0 + panel_width
                objects.append(create_roof_panel(
                    f"SM_SHI_DazeShelter_{lod}_Mat{side_index}_{row_index}_{column + 1:02d}",
                    x0,
                    x1,
                    y0,
                    y1,
                    z0,
                    z1,
                    row_index * 0.010,
                    0.038 if detailed else 0.050,
                    reed,
                    0.30 if (column + row_index + side_index) % 2 else 0.70,
                ))

    if detailed:
        for post_index, (x, y) in enumerate(post_positions, 1):
            for band_index, z in enumerate((2.52, 2.58, 2.64), 1):
                objects.append(create_lashing(
                    f"SM_SHI_DazeShelter_{lod}_Cord{post_index}_{band_index}",
                    (x, y, z),
                    0.142,
                    cord,
                    True,
                ))
        for ridge_index, x in enumerate((-3.6, -1.2, 1.2, 3.6), 1):
            objects.append(create_lashing(
                f"SM_SHI_DazeShelter_{lod}_RidgeCord{ridge_index:02d}",
                (x, 0.0, 3.23),
                0.105,
                cord,
                True,
                around_x_axis=True,
            ))

    for obj in objects:
        obj["shi_use"] = "open field shelter production blockout"
        obj["shi_historical_status"] = "project-authored practical construction; not an attested reconstruction"
    return objects


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
    copies: list[bpy.types.Object] = []
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
    bm = bmesh.new()
    bm.from_mesh(combined.data)
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bm.to_mesh(combined.data)
    bm.free()
    normalize_material_slots(combined, materials)
    unwrap_object(combined)
    combined.hide_set(True)
    return combined


def create_review_context() -> list[bpy.types.Object]:
    context_material = bpy.data.materials.new("M_SHI_ShelterReviewContext")
    context_material.diffuse_color = (0.018, 0.011, 0.006, 1.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.06))
    surface = bpy.context.object
    surface.name = "review_only_command_ground"
    surface.dimensions = (5.8, 3.7, 0.16)
    surface.data.materials.append(context_material)
    apply_identity(surface)
    surface.hide_render = False
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, -0.125))
    field = bpy.context.object
    field.name = "review_only_wet_field"
    field.data.materials.append(context_material)
    return [surface, field]


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_studio() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    bpy.ops.object.camera_add(location=(10.2, -12.0, 6.8))
    camera = bpy.context.object
    camera.name = "inspection_camera"
    camera.data.lens = 52
    aim(camera, Vector((0.0, 0.0, 1.45)))
    bpy.context.scene.camera = camera
    lights: list[bpy.types.Object] = []
    for name, location, energy, size, color in (
        ("cool_overcast", (-4.0, -2.0, 10.0), 3200.0, 7.0, (0.42, 0.55, 0.72)),
        ("command_fire", (-2.8, -3.2, 2.4), 1900.0, 3.5, (1.0, 0.30, 0.075)),
        ("wet_rim", (8.0, 4.5, 5.8), 1500.0, 4.5, (0.34, 0.52, 0.78)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, 1.35)))
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
        WOOD_MATERIAL: ((0.014, 0.007, 0.003, 1.0), 0.82),
        REED_MATERIAL: ((0.052, 0.039, 0.014, 1.0), 0.88),
        CORD_MATERIAL: ((0.009, 0.005, 0.0025, 1.0), 0.93),
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
        for node in list(material.node_tree.nodes):
            if node != principled and node.bl_idname != "ShaderNodeOutputMaterial":
                material.node_tree.nodes.remove(node)
        material.diffuse_color = base_color
        material.metallic = 0.0
        material.roughness = roughness


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
    materials = create_materials()
    lod0 = create_shelter_components("LOD0", materials, True)
    lod1 = create_shelter_components("LOD1", materials, False)
    for obj in [*lod0, *lod1]:
        unwrap_object(obj)
    for obj in lod1:
        obj.hide_set(True)
        obj.hide_render = True
    unreal_lod0 = combined_export_copy(lod0, f"{MESH_NAME}_LOD0_Source", materials)
    unreal_lod1 = combined_export_copy(lod1, f"{MESH_NAME}_LOD1_Source", materials)
    review_context = create_review_context()
    camera, _studio = create_studio()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("SHI_DazeShelter_World")
    scene.world.color = (0.0015, 0.003, 0.005)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.20
    render(scene, rendered_dir / f"{ASSET_ID}.png")

    camera.location = (11.5, 0.0, 2.4)
    camera.data.lens = 54
    aim(camera, Vector((0.0, 0.0, 1.55)))
    render(scene, rendered_dir / f"{ASSET_ID}-profile.png")

    camera.location = (0.0, -7.4, 1.52)
    camera.data.lens = 48
    aim(camera, Vector((0.0, 0.0, 2.62)))
    render(scene, rendered_dir / f"{ASSET_ID}-underside.png")

    blend_path = rendered_dir / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    for obj in review_context:
        obj.hide_set(True)
        obj.hide_render = True
    prepare_interchange_materials(materials)
    export_selection(export_dir / f"{ASSET_ID}-lod0.glb", lod0, "glb")
    export_selection(export_dir / f"{ASSET_ID}-lod1.glb", lod1, "glb")
    unreal_lod0.name = MESH_NAME
    export_selection(export_dir / f"{ASSET_ID}.fbx", [unreal_lod0], "fbx")
    unreal_lod0.name = f"{MESH_NAME}_LOD0_Source"
    unreal_lod1.name = MESH_NAME
    export_selection(export_dir / f"{ASSET_ID}-lod1.fbx", [unreal_lod1], "fbx")
    unreal_lod1.name = f"{MESH_NAME}_LOD1_Source"

    all_positions = [vertex.co for obj in lod0 for vertex in obj.data.vertices]
    bounds_min = [min(position[index] for position in all_positions) for index in range(3)]
    bounds_max = [max(position[index] for position in all_positions) for index in range(3)]
    metrics = {
        "assetId": ASSET_ID,
        "generator": "deterministic Blender source script",
        "blender": bpy.app.version_string,
        "historicalStatus": "project-authored practical field shelter; not an attested Daze reconstruction",
        "boundsMeters": {"minimum": bounds_min, "maximum": bounds_max},
        "postCentersMeters": [[x, y] for x, y in ((-3.6, -2.6), (3.6, -2.6), (-3.6, 2.6), (3.6, 2.6))],
        "minimumEaveMeters": 2.78,
        "roofRidgeSurfaceMeters": 3.37,
        "maximumAllowedStructureHeightMeters": 3.45,
        "lod0Triangles": triangle_count(lod0),
        "lod1Triangles": triangle_count(lod1),
        "collisionTriangles": 0,
        "materials": [material.name for material in materials],
        "components": [obj.name for obj in lod0],
        "rootIntent": "identity at command-space origin; open posts remain outside the command-ground footprint",
        "exports": {
            "blend": f"../rendered/{ASSET_ID}.blend",
            "render": f"../rendered/{ASSET_ID}.png",
            "profileRender": f"../rendered/{ASSET_ID}-profile.png",
            "undersideRender": f"../rendered/{ASSET_ID}-underside.png",
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
