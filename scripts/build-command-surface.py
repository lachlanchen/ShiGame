import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-command-surface-v1"
EARTH_MATERIAL = "M_SHI_WetPackedEarth"
WOOD_MATERIAL = "M_SHI_DarkWorkedWood"


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def make_earth_material() -> bpy.types.Material:
    material = bpy.data.materials.new(EARTH_MATERIAL)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = 0.82
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.8
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.68
    noise.inputs["Distortion"].default_value = 0.08
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.25
    # Blender stores these values in scene-linear space.  Keep the campaign
    # earth genuinely dark so a warm key cannot turn the surface into pink
    # plaster in the review render.
    ramp.color_ramp.elements[0].color = (0.0022, 0.0009, 0.0003, 1.0)
    ramp.color_ramp.elements[1].position = 0.78
    ramp.color_ramp.elements[1].color = (0.018, 0.0055, 0.0015, 1.0)
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    return material


def make_wood_material() -> bpy.types.Material:
    material = bpy.data.materials.new(WOOD_MATERIAL)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = 0.88
    texcoord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (0.35, 7.5, 1.0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.6
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.72
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.32
    ramp.color_ramp.elements[0].color = (0.009, 0.006, 0.004, 1.0)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.047, 0.024, 0.010, 1.0)
    links.new(texcoord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    return material


def prepare_interchange_materials(
    earth: bpy.types.Material, wood: bpy.types.Material
) -> None:
    for material, base_color, roughness in (
        (earth, (0.010, 0.0030, 0.0008, 1.0), 0.84),
        (wood, (0.025, 0.013, 0.006, 1.0), 0.88),
    ):
        principled = material.node_tree.nodes.get("Principled BSDF")
        for socket_name in ("Base Color", "Roughness", "Normal"):
            for link in list(principled.inputs[socket_name].links):
                material.node_tree.links.remove(link)
        principled.inputs["Base Color"].default_value = base_color
        principled.inputs["Roughness"].default_value = roughness
        principled.inputs["Metallic"].default_value = 0.0


def create_box(
    name: str,
    dimensions: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    bevel_width: float,
    bevel_segments: int,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width > 0.0:
        bevel = obj.modifiers.new("restrained_hand_worked_edge", "BEVEL")
        bevel.width = bevel_width
        bevel.segments = bevel_segments
        bevel.affect = "EDGES"
        bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(material)
    obj["shi_use"] = "fictional low command-ground platform"
    obj["shi_historical_status"] = "not a historical reconstruction"
    return obj


def create_surface_components(
    earth: bpy.types.Material,
    wood: bpy.types.Material,
    lod: str,
    detailed: bool,
) -> list[bpy.types.Object]:
    bevel_earth = 0.020 if detailed else 0.0
    bevel_wood = 0.006 if detailed else 0.0
    earth_obj = create_box(
        f"SM_SHI_CommandSurface_{lod}_PackedEarth",
        (5.80, 3.70, 0.12),
        (0.0, 0.0, 0.08),
        earth,
        bevel_earth,
        3 if detailed else 1,
    )
    rails = [
        create_box(
            f"SM_SHI_CommandSurface_{lod}_WoodWest",
            (0.048, 3.70, 0.156),
            (-2.876, 0.0, 0.058),
            wood,
            bevel_wood,
            2 if detailed else 1,
        ),
        create_box(
            f"SM_SHI_CommandSurface_{lod}_WoodEast",
            (0.052, 3.70, 0.154),
            (2.874, 0.0, 0.057),
            wood,
            bevel_wood,
            2 if detailed else 1,
        ),
        create_box(
            f"SM_SHI_CommandSurface_{lod}_WoodSouth",
            (5.70, 0.050, 0.152),
            (0.0, -1.825, 0.056),
            wood,
            bevel_wood,
            2 if detailed else 1,
        ),
        create_box(
            f"SM_SHI_CommandSurface_{lod}_WoodNorth",
            (5.70, 0.050, 0.150),
            (0.0, 1.825, 0.055),
            wood,
            bevel_wood,
            2 if detailed else 1,
        ),
    ]
    return [earth_obj, *rails]


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
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.025)
    bpy.ops.object.mode_set(mode="OBJECT")
    source = obj.data.uv_layers[0]
    lightmap = obj.data.uv_layers.new(name="LightmapUV")
    for index, source_uv in enumerate(source.data):
        lightmap.data[index].uv = source_uv.uv.copy()
    obj.select_set(False)


def normalize_material_slots(obj: bpy.types.Object, materials: list[bpy.types.Material]) -> None:
    old_material_names = [slot.name if slot else "" for slot in obj.data.materials]
    face_names = [old_material_names[polygon.material_index] for polygon in obj.data.polygons]
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
    collision_material = bpy.data.materials.new("M_SHI_CommandSurface_Collision")
    collision = create_box(
        "UCX_SM_SHI_CommandSurface_01_01",
        (5.80, 3.70, 0.16),
        (0.0, 0.0, 0.06),
        collision_material,
        0.0,
        1,
    )
    collision.display_type = "WIRE"
    collision.hide_render = True
    return collision


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_studio() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.0, -0.025))
    floor = bpy.context.object
    floor.name = "studio_floor"
    floor.scale = (16.0, 16.0, 16.0)
    floor_material = bpy.data.materials.new("M_SHI_CommandSurface_StudioFloor")
    floor_material.use_nodes = True
    floor_principled = floor_material.node_tree.nodes.get("Principled BSDF")
    floor_principled.inputs["Base Color"].default_value = (0.004, 0.006, 0.006, 1.0)
    floor_principled.inputs["Roughness"].default_value = 0.94
    floor.data.materials.append(floor_material)

    bpy.ops.object.camera_add(location=(7.4, -7.8, 4.9))
    camera = bpy.context.object
    camera.name = "inspection_camera"
    camera.data.lens = 56
    aim(camera, Vector((0.0, 0.0, 0.05)))
    bpy.context.scene.camera = camera

    lights = []
    for name, location, energy, size, color in (
        ("warm_key", (-3.8, -3.2, 5.6), 900.0, 4.2, (1.0, 0.50, 0.23)),
        ("cool_fill", (4.4, -1.0, 4.2), 600.0, 5.0, (0.38, 0.56, 1.0)),
        ("edge", (1.8, 5.2, 3.4), 850.0, 3.4, (0.52, 0.72, 1.0)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        aim(light, Vector((0.0, 0.0, 0.04)))
        lights.append(light)
    return camera, [floor, *lights]


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
    earth = make_earth_material()
    wood = make_wood_material()
    lod0 = create_surface_components(earth, wood, "LOD0", True)
    lod1 = create_surface_components(earth, wood, "LOD1", False)
    for obj in [*lod0, *lod1]:
        unwrap_object(obj)
    for obj in lod1:
        obj.hide_set(True)
        obj.hide_render = True
    collision = create_collision()
    unreal_lod0 = combined_export_copy(lod0, "SM_SHI_CommandSurface_01_LOD0_Source", [earth, wood])
    unreal_lod1 = combined_export_copy(lod1, "SM_SHI_CommandSurface_01_LOD1_Source", [earth, wood])
    camera, studio = create_studio()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("SHI_CommandSurface_World")
    scene.world.color = (0.004, 0.006, 0.008)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.55
    render(scene, rendered_dir / f"{ASSET_ID}.png")

    hero_location = camera.location.copy()
    hero_rotation = camera.rotation_euler.copy()
    camera.location = (0.0, -7.8, 0.72)
    camera.data.lens = 62
    aim(camera, Vector((0.0, 0.0, 0.04)))
    render(scene, rendered_dir / f"{ASSET_ID}-profile.png")
    camera.location = hero_location
    camera.rotation_euler = hero_rotation
    camera.data.lens = 56

    blend_path = rendered_dir / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    prepare_interchange_materials(earth, wood)
    export_selection(export_dir / f"{ASSET_ID}-lod0.glb", lod0, "glb")
    export_selection(export_dir / f"{ASSET_ID}-lod1.glb", lod1, "glb")
    unreal_lod0.name = "SM_SHI_CommandSurface_01"
    export_selection(export_dir / f"{ASSET_ID}.fbx", [unreal_lod0, collision], "fbx")
    unreal_lod0.name = "SM_SHI_CommandSurface_01_LOD0_Source"
    unreal_lod1.name = "SM_SHI_CommandSurface_01"
    export_selection(export_dir / f"{ASSET_ID}-lod1.fbx", [unreal_lod1], "fbx")
    unreal_lod1.name = "SM_SHI_CommandSurface_01_LOD1_Source"

    metrics = {
        "assetId": ASSET_ID,
        "generator": "deterministic Blender source script",
        "blender": bpy.app.version_string,
        "historicalStatus": "original fictional command-ground platform; not historical reconstruction",
        "boundsMetersTarget": {"minimum": [-2.9, -1.85, -0.02], "maximum": [2.9, 1.85, 0.14]},
        "lod0Triangles": triangle_count(lod0),
        "lod1Triangles": triangle_count(lod1),
        "collisionTriangles": triangle_count([collision]),
        "materials": [earth.name, wood.name],
        "components": [obj.name for obj in lod0],
        "collision": collision.name,
        "rootIntent": "identity at command-space origin; exact top contact plane local Z=0.14m",
        "exports": {
            "blend": f"../rendered/{ASSET_ID}.blend",
            "render": f"../rendered/{ASSET_ID}.png",
            "profileRender": f"../rendered/{ASSET_ID}-profile.png",
            "cleanImportRender": f"../rendered/{ASSET_ID}-glb-import.png",
            "lod0Glb": f"../export/{ASSET_ID}-lod0.glb",
            "lod1Glb": f"../export/{ASSET_ID}-lod1.glb",
            "fbx": f"../export/{ASSET_ID}.fbx",
            "lod1Fbx": f"../export/{ASSET_ID}-lod1.fbx"
        },
    }
    (source_dir / f"{ASSET_ID}.metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
