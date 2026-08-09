import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def principled_input(material: bpy.types.Material, name: str):
    return material.node_tree.nodes.get("Principled BSDF").inputs[name]


def make_stone_material() -> bpy.types.Material:
    material = bpy.data.materials.new("M_SHI_RiverStone")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.028, 0.022, 0.018, 1.0)
    principled.inputs["Roughness"].default_value = 0.84
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6.5
    noise.inputs["Detail"].default_value = 3.2
    noise.inputs["Roughness"].default_value = 0.72
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.008, 0.009, 0.009, 1.0)
    ramp.color_ramp.elements[1].color = (0.048, 0.041, 0.032, 1.0)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.0012
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    return material


def make_bronze_material() -> bpy.types.Material:
    material = bpy.data.materials.new("M_SHI_WorkedBronze")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.09, 0.055, 0.022, 1.0)
    principled.inputs["Metallic"].default_value = 0.82
    principled.inputs["Roughness"].default_value = 0.48
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 18.0
    noise.inputs["Detail"].default_value = 2.5
    noise.inputs["Roughness"].default_value = 0.8
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (0.055, 0.026, 0.010, 1.0)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.13, 0.19, 0.105, 1.0)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.0007
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    return material


def prepare_interchange_materials(
    stone_material: bpy.types.Material,
    bronze_material: bpy.types.Material,
) -> None:
    for material, base_color in (
        (stone_material, (0.028, 0.022, 0.018, 1.0)),
        (bronze_material, (0.09, 0.055, 0.022, 1.0)),
    ):
        principled = material.node_tree.nodes.get("Principled BSDF")
        for input_name in ("Base Color", "Normal"):
            socket = principled.inputs[input_name]
            for link in list(socket.links):
                material.node_tree.links.remove(link)
        principled.inputs["Base Color"].default_value = base_color


def create_core(material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0, location=(0, 0, 0.018))
    core = bpy.context.object
    core.name = "SM_SHI_CommandWeight_LOD0_Stone"
    for vertex in core.data.vertices:
        direction = vertex.co.normalized()
        variation = (
            1.0
            + 0.050 * math.sin(direction.x * 6.7 + direction.y * 2.3)
            + 0.028 * math.sin(direction.y * 9.1 - direction.z * 3.7)
            + 0.018 * math.cos(direction.z * 11.3 + direction.x * 4.9)
        )
        vertex.co *= variation
    core.scale = (0.037, 0.028, 0.017)
    bpy.context.view_layer.objects.active = core
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    subdivision = core.modifiers.new("controlled_surface", "SUBSURF")
    subdivision.levels = 1
    subdivision.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=subdivision.name)
    for polygon in core.data.polygons:
        polygon.use_smooth = True
    core.data.materials.append(material)
    core["shi_use"] = "fictional command signal"
    core["shi_historical_status"] = "not a historical reconstruction"
    return core


def create_forged_ribbon(
    name: str,
    points: list[tuple[float, float, float]],
    path_plane_normal: tuple[float, float, float],
    width: float,
    thickness: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    path = [Vector(point) for point in points]
    plane_normal = Vector(path_plane_normal).normalized()
    vertices = []
    for index, point in enumerate(path):
        if index == 0:
            tangent = (path[1] - path[0]).normalized()
        elif index == len(path) - 1:
            tangent = (path[-1] - path[-2]).normalized()
        else:
            tangent = (path[index + 1] - path[index - 1]).normalized()
        width_direction = plane_normal
        thickness_direction = plane_normal.cross(tangent).normalized()
        vertices.extend(
            point + width_direction * width_sign * width * 0.5 + thickness_direction * thickness_sign * thickness * 0.5
            for width_sign, thickness_sign in ((-1, -1), (1, -1), (1, 1), (-1, 1))
        )
    faces = []
    for section in range(len(path) - 1):
        start = section * 4
        next_start = (section + 1) * 4
        for edge in range(4):
            faces.append((start + edge, start + (edge + 1) % 4, next_start + (edge + 1) % 4, next_start + edge))
    faces.extend(((3, 2, 1, 0), tuple((len(path) - 1) * 4 + edge for edge in range(4))))
    faces = [tuple(reversed(face)) for face in faces]
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bevel = obj.modifiers.new("soft_hammered_edges", "BEVEL")
    bevel.width = min(width, thickness) * 0.22
    bevel.segments = 2
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(material)
    return obj


def create_bronze(material: bpy.types.Material) -> list[bpy.types.Object]:
    band_points = []
    for index in range(25):
        angle = -2.95 + 5.90 * index / 24
        band_points.append((0.0205, 0.024 * math.sin(angle), 0.018 + 0.015 * math.cos(angle)))
    band = create_forged_ribbon(
        "SM_SHI_CommandWeight_LOD0_BronzeBand",
        band_points,
        (1.0, 0.0, 0.0),
        0.0060,
        0.0014,
        material,
    )
    neck = create_forged_ribbon(
        "SM_SHI_CommandWeight_LOD0_BronzeNeck",
        [(0.0205, 0.0, 0.033), (0.027, 0.0, 0.0315), (0.0315, 0.0, 0.027)],
        (0.0, 1.0, 0.0),
        0.0046,
        0.0015,
        material,
    )
    bpy.ops.mesh.primitive_torus_add(
        align="WORLD",
        major_segments=32,
        minor_segments=8,
        location=(0.040, 0, 0.027),
        rotation=(math.radians(90), 0, 0),
        major_radius=0.0066,
        minor_radius=0.0018,
    )
    eye = bpy.context.object
    eye.name = "SM_SHI_CommandWeight_LOD0_BronzeEye"
    for polygon in eye.data.polygons:
        polygon.use_smooth = True
    eye.data.materials.append(material)
    for obj in (band, neck, eye):
        obj["shi_use"] = "fictional command signal"
        obj["shi_historical_status"] = "not a historical reconstruction"
    return [band, neck, eye]


def create_collision() -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0.005, 0, 0.018))
    collision = bpy.context.object
    collision.name = "UCX_SM_SHI_CommandWeight_01_01"
    collision.scale = (0.046, 0.030, 0.019)
    bpy.context.view_layer.objects.active = collision
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    collision.display_type = "WIRE"
    collision.hide_render = True
    return collision


def combined_export_copy(objects: list[bpy.types.Object], name: str) -> bpy.types.Object:
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
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    combined.hide_set(True)
    return combined


def ensure_uvs(objects: list[bpy.types.Object]) -> None:
    for obj in objects:
        bpy.ops.object.select_all(action="DESELECT")
        obj.hide_set(False)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
        obj.select_set(False)
    for index, obj in enumerate(objects):
        source = obj.data.uv_layers[0]
        lightmap = obj.data.uv_layers.new(name="LightmapUV")
        offset_x = 0.02 + 0.50 * (index % 2)
        offset_y = 0.02 + 0.50 * (index // 2)
        for loop_index, source_uv in enumerate(source.data):
            lightmap.data[loop_index].uv = (
                offset_x + 0.46 * source_uv.uv.x,
                offset_y + 0.46 * source_uv.uv.y,
            )


def duplicate_lod1(objects: list[bpy.types.Object]) -> list[bpy.types.Object]:
    lod1 = []
    for source in objects:
        duplicate = source.copy()
        duplicate.data = source.data.copy()
        duplicate.name = source.name.replace("LOD0", "LOD1")
        bpy.context.collection.objects.link(duplicate)
        bpy.context.view_layer.objects.active = duplicate
        duplicate.select_set(True)
        decimate = duplicate.modifiers.new("lod1_decimate", "DECIMATE")
        decimate.ratio = 0.34 if "Stone" in duplicate.name else 0.55
        decimate.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=decimate.name)
        duplicate.hide_render = True
        duplicate.hide_set(True)
        lod1.append(duplicate)
    return lod1


def create_studio(targets: list[bpy.types.Object]) -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, -0.001))
    floor = bpy.context.object
    floor.name = "studio_floor"
    floor.scale = (0.45, 0.45, 0.45)
    material = bpy.data.materials.new("M_StudioFloor")
    material.use_nodes = True
    floor_principled = material.node_tree.nodes.get("Principled BSDF")
    floor_principled.inputs["Base Color"].default_value = (0.008, 0.011, 0.011, 1.0)
    floor_principled.inputs["Roughness"].default_value = 0.92
    floor.data.materials.append(material)

    bpy.ops.object.camera_add(location=(0.125, -0.145, 0.092))
    camera = bpy.context.object
    camera.name = "inspection_camera"
    camera.data.lens = 61
    aim(camera, Vector((0.003, 0, 0.020)))
    bpy.context.scene.camera = camera

    lights = []
    for name, location, energy, size, color in (
        ("key", (0.11, -0.08, 0.14), 0.90, 0.105, (1.0, 0.76, 0.55)),
        ("fill", (-0.10, -0.035, 0.075), 0.25, 0.12, (0.50, 0.68, 1.0)),
        ("rim", (0.03, 0.13, 0.11), 0.42, 0.09, (0.62, 0.82, 1.0)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0, 0, 0.018)))
        lights.append(light)
    return floor, [camera, *lights]


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def triangle_count(objects: list[bpy.types.Object]) -> int:
    return sum(len(obj.data.loop_triangles) if obj.data.loop_triangles else (obj.data.calc_loop_triangles() or len(obj.data.loop_triangles)) for obj in objects)


def export_selection(path: Path, objects: list[bpy.types.Object], kind: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if kind == "glb":
        bpy.ops.export_scene.gltf(
            filepath=str(path),
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_yup=True,
        )
    else:
        bpy.ops.export_scene.fbx(
            filepath=str(path),
            use_selection=True,
            apply_unit_scale=True,
            axis_forward="-Z",
            axis_up="Y",
            add_leaf_bones=False,
            mesh_smooth_type="FACE",
            use_tspace=True,
        )
    for obj in objects:
        obj.select_set(False)


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
    stone_material = make_stone_material()
    bronze_material = make_bronze_material()
    core = create_core(stone_material)
    bronze = create_bronze(bronze_material)
    lod0 = [core, *bronze]
    ensure_uvs(lod0)
    lod1 = duplicate_lod1(lod0)
    collision = create_collision()
    unreal_lod0 = combined_export_copy(lod0, "SM_SHI_CommandWeight_01_LOD0_Source")
    unreal_lod1 = combined_export_copy(lod1, "SM_SHI_CommandWeight_01_LOD1_Source")
    floor, studio = create_studio(lod0)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("SHI_CommandWeight_World")
    scene.world.color = (0.006, 0.009, 0.009)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.10
    render_path = rendered_dir / "shi-command-weight-v1.png"
    scene.render.filepath = str(render_path)
    bpy.ops.render.render(write_still=True)

    camera = studio[0]
    hero_location = camera.location.copy()
    hero_rotation = camera.rotation_euler.copy()
    camera.location = (-0.12, 0.14, 0.085)
    aim(camera, Vector((0.003, 0, 0.020)))
    back_render_path = rendered_dir / "shi-command-weight-v1-back.png"
    scene.render.filepath = str(back_render_path)
    bpy.ops.render.render(write_still=True)
    camera.location = hero_location
    camera.rotation_euler = hero_rotation

    blend_path = rendered_dir / "shi-command-weight-v1.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    prepare_interchange_materials(stone_material, bronze_material)
    export_selection(export_dir / "shi-command-weight-v1-lod0.glb", lod0, "glb")
    export_selection(export_dir / "shi-command-weight-v1-lod1.glb", lod1, "glb")
    unreal_lod0.name = "SM_SHI_CommandWeight_01"
    export_selection(export_dir / "shi-command-weight-v1.fbx", [unreal_lod0, collision], "fbx")
    unreal_lod0.name = "SM_SHI_CommandWeight_01_LOD0_Source"
    unreal_lod1.name = "SM_SHI_CommandWeight_01"
    export_selection(export_dir / "shi-command-weight-v1-lod1.fbx", [unreal_lod1], "fbx")
    unreal_lod1.name = "SM_SHI_CommandWeight_01_LOD1_Source"

    metrics = {
        "assetId": "shi-command-weight-v1",
        "generator": "deterministic Blender source script",
        "blender": bpy.app.version_string,
        "historicalStatus": "original fictional game signal; not historical reconstruction",
        "dimensionsMetersTarget": [0.084, 0.060, 0.045],
        "lod0Triangles": triangle_count(lod0),
        "lod1Triangles": triangle_count(lod1),
        "collisionTriangles": triangle_count([collision]),
        "materials": [stone_material.name, bronze_material.name],
        "components": [obj.name for obj in lod0],
        "collision": collision.name,
        "rootIntent": "bottom-center at local Z=0",
        "exports": {
            "blend": "../rendered/shi-command-weight-v1.blend",
            "render": "../rendered/shi-command-weight-v1.png",
            "backRender": "../rendered/shi-command-weight-v1-back.png",
            "cleanImportRender": "../rendered/shi-command-weight-v1-glb-import.png",
            "lod0Glb": "../export/shi-command-weight-v1-lod0.glb",
            "lod1Glb": "../export/shi-command-weight-v1-lod1.glb",
            "fbx": "../export/shi-command-weight-v1.fbx",
            "lod1Fbx": "../export/shi-command-weight-v1-lod1.fbx"
        }
    }
    (source_dir / "shi-command-weight-v1.metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
