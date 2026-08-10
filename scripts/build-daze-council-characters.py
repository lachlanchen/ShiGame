import argparse
import hashlib
import importlib
import json
import math
from pathlib import Path
import sys

import bpy
import bmesh
from mathutils import Vector


ASSET_ID = "shi-daze-council-characters-v1"
RIG_NAME = "SK_SHI_DazeCouncil_Skeleton"
DISCLOSURE = (
    "SKELETAL COUNCIL CHARACTER PRODUCTION BLOCKOUT · GENERIC PRACTICAL LAYERS · "
    "NOT AN EXACT 209 BCE COSTUME OR PORTRAIT RECONSTRUCTION"
)
BONE_NAMES = [
    "Root", "pelvis", "spine_01", "spine_02", "spine_03",
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "index_01_l", "index_02_l", "index_03_l",
    "middle_01_l", "middle_02_l", "middle_03_l",
    "pinky_01_l", "pinky_02_l", "pinky_03_l",
    "ring_01_l", "ring_02_l", "ring_03_l",
    "thumb_01_l", "thumb_02_l", "thumb_03_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
    "index_01_r", "index_02_r", "index_03_r",
    "middle_01_r", "middle_02_r", "middle_03_r",
    "pinky_01_r", "pinky_02_r", "pinky_03_r",
    "ring_01_r", "ring_02_r", "ring_03_r",
    "thumb_01_r", "thumb_02_r", "thumb_03_r",
    "neck_01", "head",
    "thigh_l", "calf_l", "foot_l", "ball_l",
    "thigh_r", "calf_r", "foot_r", "ball_r",
]
CHARACTERS = [
    {
        "id": "keeper",
        "label": "Keeper",
        "upper": (0.18, 0.16, 0.12, 1.0),
        "outer": (0.10, 0.115, 0.105, 1.0),
        "hem": 0.56,
        "upper_width": 1.00,
        "lower_width": 0.90,
        "sleeve": 0.070,
        "hair": "low-knot",
        "role": "document-satchel",
    },
    {
        "id": "chen-sheng",
        "label": "Chen Sheng",
        "upper": (0.145, 0.12, 0.095, 1.0),
        "outer": (0.07, 0.075, 0.065, 1.0),
        "hem": 0.53,
        "upper_width": 1.08,
        "lower_width": 1.03,
        "sleeve": 0.081,
        "hair": "tied-knot",
        "role": "long-weather-layer",
    },
    {
        "id": "wu-guang",
        "label": "Wu Guang",
        "upper": (0.12, 0.135, 0.105, 1.0),
        "outer": (0.09, 0.075, 0.055, 1.0),
        "hem": 0.60,
        "upper_width": 1.05,
        "lower_width": 0.86,
        "sleeve": 0.066,
        "hair": "cropped-cap",
        "role": "asymmetric-wrap",
    },
    {
        "id": "yu-mu",
        "label": "Aunt Yu",
        "upper": (0.19, 0.145, 0.105, 1.0),
        "outer": (0.105, 0.095, 0.075, 1.0),
        "hem": 0.50,
        "upper_width": 1.10,
        "lower_width": 1.12,
        "sleeve": 0.076,
        "hair": "broad-low-knot",
        "role": "work-apron",
    },
    {
        "id": "qin-courier",
        "label": "Courier Han",
        "upper": (0.13, 0.115, 0.09, 1.0),
        "outer": (0.075, 0.085, 0.075, 1.0),
        "hem": 0.61,
        "upper_width": 0.93,
        "lower_width": 0.79,
        "sleeve": 0.061,
        "hair": "small-high-tie",
        "role": "relay-satchel",
    },
]


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def dynamic_import(package_suffix: str, key: str):
    for module_name in tuple(sys.modules):
        if module_name.endswith(package_suffix):
            module = importlib.import_module(module_name)
            if hasattr(module, key):
                return getattr(module, key)
    raise RuntimeError(f"MPFB extension module unavailable: {package_suffix}.{key}")


def reset_scene() -> bpy.types.Scene:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection != bpy.context.scene.collection:
            bpy.data.collections.remove(collection)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.015, 0.017, 0.018)
    return scene


def make_material(name: str, color: tuple[float, float, float, float], roughness: float = 0.84):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = 0.0
    shader.inputs["Specular IOR Level"].default_value = 0.18
    links.new(shader.outputs[0], output.inputs["Surface"])
    return material


def material_set(spec: dict) -> dict[str, bpy.types.Material]:
    return {
        "skin": make_material("M_SHI_Character_SkinClay", (0.30, 0.215, 0.16, 1.0), 0.78),
        "hair": make_material("M_SHI_Character_HairClay", (0.028, 0.026, 0.022, 1.0), 0.91),
        "base": make_material(f"M_SHI_{spec['id']}_ClothBase", spec["upper"], 0.9),
        "outer": make_material(f"M_SHI_{spec['id']}_ClothOuter", spec["outer"], 0.93),
        "binding": make_material("M_SHI_Character_BindingClay", (0.115, 0.075, 0.045, 1.0), 0.88),
        "prop": make_material("M_SHI_Character_RolePropClay", (0.07, 0.045, 0.028, 1.0), 0.86),
    }


def recalc_mesh(mesh: bpy.types.Mesh) -> None:
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate(verbose=False)
    mesh.update(calc_edges=True)


def make_object(name: str, vertices, faces, material, collection) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    recalc_mesh(mesh)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def bind_weights(obj: bpy.types.Object, armature: bpy.types.Object, weights: dict[str, dict[int, float]]) -> None:
    for bone_name, assignments in weights.items():
        group = obj.vertex_groups.new(name=bone_name)
        for vertex_index, weight in assignments.items():
            if weight > 1.0e-6:
                group.add([vertex_index], weight, "REPLACE")
    obj.parent = armature
    modifier = obj.modifiers.new(name="Armature", type="ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True


def rigid_bind(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    bind_weights(obj, armature, {bone_name: {index: 1.0 for index in range(len(obj.data.vertices))}})


def vertical_weights(obj: bpy.types.Object, armature: bpy.types.Object) -> None:
    anchors = [
        (0.88, "pelvis"),
        (0.97, "spine_01"),
        (1.055, "spine_02"),
        (1.20, "spine_03"),
        (1.35, "spine_03"),
    ]
    weights: dict[str, dict[int, float]] = {name: {} for _, name in anchors}
    for vertex in obj.data.vertices:
        z_value = vertex.co.z
        if z_value <= anchors[0][0]:
            weights[anchors[0][1]][vertex.index] = 1.0
            continue
        if z_value >= anchors[-1][0]:
            weights[anchors[-1][1]][vertex.index] = 1.0
            continue
        for left, right in zip(anchors, anchors[1:]):
            if left[0] <= z_value <= right[0]:
                span = right[0] - left[0]
                ratio = (z_value - left[0]) / span if span else 0.0
                weights[left[1]][vertex.index] = weights[left[1]].get(vertex.index, 0.0) + 1.0 - ratio
                weights[right[1]][vertex.index] = weights[right[1]].get(vertex.index, 0.0) + ratio
                break
    bind_weights(obj, armature, weights)


def make_elliptical_layer(name: str, rings, segments: int, material, collection) -> bpy.types.Object:
    vertices = []
    faces = []
    for z_value, radius_x, radius_y in rings:
        for index in range(segments):
            angle = math.tau * index / segments
            vertices.append((math.cos(angle) * radius_x, math.sin(angle) * radius_y, z_value))
    for ring_index in range(len(rings) - 1):
        base = ring_index * segments
        following = (ring_index + 1) * segments
        for index in range(segments):
            next_index = (index + 1) % segments
            faces.append((base + index, base + next_index, following + next_index, following + index))
    return make_object(name, vertices, faces, material, collection)


def cylinder_between(name: str, start: Vector, end: Vector, radius_start: float, radius_end: float,
                     material, collection, segments: int = 10) -> bpy.types.Object:
    axis = end - start
    if axis.length < 1.0e-6:
        raise ValueError(f"Zero-length cylinder requested for {name}")
    direction = axis.normalized()
    side = direction.cross(Vector((0.0, 0.0, 1.0)))
    if side.length < 1.0e-5:
        side = direction.cross(Vector((0.0, 1.0, 0.0)))
    side.normalize()
    other = direction.cross(side).normalized()
    vertices = []
    for point, radius in ((start, radius_start), (end, radius_end)):
        for index in range(segments):
            angle = math.tau * index / segments
            offset = side * (math.cos(angle) * radius) + other * (math.sin(angle) * radius)
            vertices.append(tuple(point + offset))
    faces = []
    for index in range(segments):
        next_index = (index + 1) % segments
        faces.append((index, next_index, segments + next_index, segments + index))
    vertices.extend((tuple(start), tuple(end)))
    start_center = len(vertices) - 2
    end_center = len(vertices) - 1
    for index in range(segments):
        next_index = (index + 1) % segments
        faces.append((start_center, next_index, index))
        faces.append((end_center, segments + index, segments + next_index))
    return make_object(name, vertices, faces, material, collection)


def box_object(name: str, center, size, material, collection, z_shear: float = 0.0) -> bpy.types.Object:
    cx, cy, cz = center
    sx, sy, sz = (value * 0.5 for value in size)
    vertices = [
        (cx - sx - z_shear, cy - sy, cz - sz), (cx + sx - z_shear, cy - sy, cz - sz),
        (cx + sx - z_shear, cy + sy, cz - sz), (cx - sx - z_shear, cy + sy, cz - sz),
        (cx - sx + z_shear, cy - sy, cz + sz), (cx + sx + z_shear, cy - sy, cz + sz),
        (cx + sx + z_shear, cy + sy, cz + sz), (cx - sx + z_shear, cy + sy, cz + sz),
    ]
    faces = [
        (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
        (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
    ]
    return make_object(name, vertices, faces, material, collection)


def trapezoid_panel(name: str, center_x: float, y_value: float, top_z: float, bottom_z: float,
                    top_width: float, bottom_width: float, thickness: float,
                    material, collection) -> bpy.types.Object:
    front = y_value - thickness * 0.5
    back = y_value + thickness * 0.5
    vertices = [
        (center_x - bottom_width * 0.5, front, bottom_z),
        (center_x + bottom_width * 0.5, front, bottom_z),
        (center_x + top_width * 0.5, front, top_z),
        (center_x - top_width * 0.5, front, top_z),
        (center_x - bottom_width * 0.5, back, bottom_z),
        (center_x + bottom_width * 0.5, back, bottom_z),
        (center_x + top_width * 0.5, back, top_z),
        (center_x - top_width * 0.5, back, top_z),
    ]
    faces = [
        (0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1),
        (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0),
    ]
    return make_object(name, vertices, faces, material, collection)


def curved_panel(name: str, rings, angle_start: float, angle_end: float, segments: int,
                 material, collection) -> bpy.types.Object:
    vertices = []
    for z_value, radius_x, radius_y in rings:
        for index in range(segments):
            ratio = index / (segments - 1)
            angle = angle_start + (angle_end - angle_start) * ratio
            vertices.append((math.cos(angle) * radius_x, math.sin(angle) * radius_y, z_value))
    faces = []
    for ring_index in range(len(rings) - 1):
        for index in range(segments - 1):
            base = ring_index * segments + index
            faces.append((base, base + 1, base + segments + 1, base + segments))
    return make_object(name, vertices, faces, material, collection)


def make_hair_cap(name: str, center, radii, material, collection, segments: int = 14) -> bpy.types.Object:
    cx, cy, cz = center
    rx, ry, rz = radii
    rings = 6
    vertices = []
    for ring_index in range(rings):
        height_ratio = ring_index / (rings - 1)
        z_value = cz - rz * 0.18 + height_ratio * rz * 1.08
        scale = math.sqrt(max(0.0, 1.0 - ((z_value - cz) / rz) ** 2))
        for index in range(segments):
            angle = math.tau * index / segments
            vertices.append((cx + math.cos(angle) * rx * scale, cy + math.sin(angle) * ry * scale, z_value))
    faces = []
    for ring_index in range(rings - 1):
        for index in range(segments):
            next_index = (index + 1) % segments
            base = ring_index * segments + index
            faces.append((base, ring_index * segments + next_index,
                          (ring_index + 1) * segments + next_index, base + segments))
    return make_object(name, vertices, faces, material, collection)


def make_round_knot(name: str, center, radii, material, collection) -> bpy.types.Object:
    cx, cy, cz = center
    rx, ry, rz = radii
    segments = 12
    rings = 7
    vertices = []
    for ring_index in range(1, rings):
        phi = math.pi * ring_index / rings
        for index in range(segments):
            theta = math.tau * index / segments
            vertices.append((
                cx + rx * math.sin(phi) * math.cos(theta),
                cy + ry * math.sin(phi) * math.sin(theta),
                cz + rz * math.cos(phi),
            ))
    vertices.extend(((cx, cy, cz + rz), (cx, cy, cz - rz)))
    top = len(vertices) - 2
    bottom = len(vertices) - 1
    faces = []
    for ring_index in range(rings - 2):
        base = ring_index * segments
        following = (ring_index + 1) * segments
        for index in range(segments):
            next_index = (index + 1) % segments
            faces.append((base + index, base + next_index, following + next_index, following + index))
    for index in range(segments):
        next_index = (index + 1) % segments
        faces.append((top, next_index, index))
        base = (rings - 2) * segments
        faces.append((bottom, base + index, base + next_index))
    return make_object(name, vertices, faces, material, collection)


def bone_segment(armature: bpy.types.Object, bone_name: str) -> tuple[Vector, Vector]:
    bone = armature.data.bones[bone_name]
    return bone.head_local.copy(), bone.tail_local.copy()


def add_character_layers(spec: dict, armature: bpy.types.Object, collection, materials) -> list[bpy.types.Object]:
    character_id = spec["id"]
    created = []
    width = spec["upper_width"]
    upper = make_elliptical_layer(
        f"SKM_SHI_{character_id}_UpperLayer",
        [(0.84, 0.255 * width, 0.145), (0.98, 0.285 * width, 0.16),
         (1.18, 0.31 * width, 0.175), (1.34, 0.245 * width, 0.145)],
        16, materials["base"], collection,
    )
    vertical_weights(upper, armature)
    created.append(upper)

    lower_width = spec["lower_width"]
    lower = make_elliptical_layer(
        f"SKM_SHI_{character_id}_LowerLayer",
        [(spec["hem"], 0.285 * lower_width, 0.19), (0.76, 0.255 * lower_width, 0.17),
         (0.91, 0.235 * lower_width, 0.155), (0.98, 0.245 * lower_width, 0.15)],
        16, materials["outer"], collection,
    )
    rigid_bind(lower, armature, "pelvis")
    created.append(lower)

    belt = make_elliptical_layer(
        f"SKM_SHI_{character_id}_WaistBinding",
        [(0.925, 0.258 * width, 0.162), (0.955, 0.262 * width, 0.166)],
        16, materials["binding"], collection,
    )
    rigid_bind(belt, armature, "pelvis")
    created.append(belt)

    for side in ("l", "r"):
        upper_start, upper_end = bone_segment(armature, f"upperarm_{side}")
        lower_start, lower_end = bone_segment(armature, f"lowerarm_{side}")
        upper_sleeve = cylinder_between(
            f"SKM_SHI_{character_id}_UpperSleeve_{side.upper()}",
            upper_start, upper_end, spec["sleeve"] * 1.12, spec["sleeve"],
            materials["base"], collection,
        )
        rigid_bind(upper_sleeve, armature, f"upperarm_{side}")
        created.append(upper_sleeve)
        lower_sleeve = cylinder_between(
            f"SKM_SHI_{character_id}_LowerSleeve_{side.upper()}",
            lower_start, lower_end * 0.94 + lower_start * 0.06,
            spec["sleeve"] * 0.95, spec["sleeve"] * 0.67,
            materials["base"], collection,
        )
        rigid_bind(lower_sleeve, armature, f"lowerarm_{side}")
        created.append(lower_sleeve)

        thigh_start, thigh_end = bone_segment(armature, f"thigh_{side}")
        calf_start, calf_end = bone_segment(armature, f"calf_{side}")
        trouser = cylinder_between(
            f"SKM_SHI_{character_id}_Trouser_{side.upper()}",
            thigh_start, thigh_end, 0.105, 0.09, materials["outer"], collection, 12,
        )
        rigid_bind(trouser, armature, f"thigh_{side}")
        created.append(trouser)
        calf_layer = cylinder_between(
            f"SKM_SHI_{character_id}_LegBinding_{side.upper()}",
            calf_start, calf_end * 0.82 + calf_start * 0.18,
            0.084, 0.058, materials["binding"], collection, 10,
        )
        rigid_bind(calf_layer, armature, f"calf_{side}")
        created.append(calf_layer)

    collar_l = box_object(
        f"SKM_SHI_{character_id}_CrossBinding_L", (-0.032, -0.171, 1.255),
        (0.026, 0.018, 0.18), materials["binding"], collection, z_shear=0.032,
    )
    rigid_bind(collar_l, armature, "spine_03")
    created.append(collar_l)
    collar_r = box_object(
        f"SKM_SHI_{character_id}_CrossBinding_R", (0.032, -0.173, 1.255),
        (0.026, 0.018, 0.18), materials["binding"], collection, z_shear=-0.032,
    )
    rigid_bind(collar_r, armature, "spine_03")
    created.append(collar_r)

    hair = make_hair_cap(
        f"SKM_SHI_{character_id}_HairMass", (0.0, 0.025, 1.585),
        (0.116, 0.095, 0.125), materials["hair"], collection,
    )
    rigid_bind(hair, armature, "head")
    created.append(hair)

    if spec["hair"] != "cropped-cap":
        knot_size = {
            "low-knot": (0.052, 0.045, 0.055),
            "tied-knot": (0.067, 0.055, 0.07),
            "broad-low-knot": (0.078, 0.055, 0.058),
            "small-high-tie": (0.043, 0.04, 0.062),
        }[spec["hair"]]
        knot_center = {
            "low-knot": (0.0, 0.105, 1.565),
            "tied-knot": (0.0, 0.105, 1.655),
            "broad-low-knot": (0.0, 0.115, 1.55),
            "small-high-tie": (0.0, 0.085, 1.685),
        }[spec["hair"]]
        knot = make_round_knot(
            f"SKM_SHI_{character_id}_HairTie", knot_center, knot_size,
            materials["hair"], collection,
        )
        rigid_bind(knot, armature, "head")
        created.append(knot)

    if spec["role"] == "document-satchel":
        bag = box_object(f"SKM_SHI_{character_id}_DocumentSatchel", (0.285, -0.035, 0.84),
                         (0.14, 0.09, 0.28), materials["prop"], collection)
        rigid_bind(bag, armature, "pelvis")
        created.append(bag)
        strap = cylinder_between(f"SKM_SHI_{character_id}_SatchelBinding", Vector((-0.16, -0.17, 1.30)),
                                 Vector((0.28, -0.08, 0.94)), 0.012, 0.012,
                                 materials["binding"], collection, 8)
        rigid_bind(strap, armature, "spine_03")
        created.append(strap)
    elif spec["role"] == "long-weather-layer":
        cape = curved_panel(
            f"SKM_SHI_{character_id}_WeatherLayer",
            [(0.68, 0.24, 0.18), (0.98, 0.30, 0.20), (1.31, 0.28, 0.185)],
            0.0, math.pi, 11, materials["outer"], collection,
        )
        rigid_bind(cape, armature, "spine_03")
        created.append(cape)
    elif spec["role"] == "asymmetric-wrap":
        wrap = curved_panel(
            f"SKM_SHI_{character_id}_ShoulderWrap",
            [(1.07, 0.25, 0.17), (1.24, 0.31, 0.19), (1.35, 0.25, 0.17)],
            0.0, math.pi * 0.68, 8, materials["outer"], collection,
        )
        rigid_bind(wrap, armature, "spine_03")
        created.append(wrap)
    elif spec["role"] == "work-apron":
        apron = curved_panel(
            f"SKM_SHI_{character_id}_WorkApron",
            [(0.54, 0.16, 0.19), (0.74, 0.20, 0.20), (0.94, 0.21, 0.18)],
            math.pi, math.tau, 9, materials["outer"], collection,
        )
        rigid_bind(apron, armature, "pelvis")
        created.append(apron)
    elif spec["role"] == "relay-satchel":
        bag = box_object(f"SKM_SHI_{character_id}_RelaySatchel", (-0.265, -0.02, 0.91),
                         (0.14, 0.10, 0.20), materials["prop"], collection)
        rigid_bind(bag, armature, "pelvis")
        created.append(bag)
        strap = cylinder_between(f"SKM_SHI_{character_id}_RelayBinding", Vector((0.15, -0.17, 1.30)),
                                 Vector((-0.255, -0.07, 0.98)), 0.010, 0.010,
                                 materials["binding"], collection, 8)
        rigid_bind(strap, armature, "spine_03")
        created.append(strap)
    return created


def clean_body_vertex_groups(body: bpy.types.Object, armature: bpy.types.Object) -> None:
    allowed = {bone.name for bone in armature.data.bones}
    for group in list(body.vertex_groups):
        if group.name not in allowed:
            body.vertex_groups.remove(group)


def make_character(spec: dict, base_body: bpy.types.Object, base_armature: bpy.types.Object,
                   scene_collection) -> dict:
    collection = bpy.data.collections.new(f"SHI_Character_{spec['id']}")
    scene_collection.children.link(collection)
    armature = base_armature.copy()
    armature.data = base_armature.data.copy()
    armature.name = f"SK_SHI_{spec['id']}_Rig"
    armature.data.name = RIG_NAME
    collection.objects.link(armature)
    for pose_bone in armature.pose.bones:
        pose_bone.custom_shape = None

    body = base_body.copy()
    body.data = base_body.data.copy()
    body.name = f"SKM_SHI_{spec['id']}_Body"
    collection.objects.link(body)
    body.parent = armature
    for modifier in body.modifiers:
        if modifier.type == "ARMATURE":
            modifier.object = armature
            modifier.use_deform_preserve_volume = True
    body.data.materials.clear()
    materials = material_set(spec)
    body.data.materials.append(materials["skin"])
    created = [body]
    created.extend(add_character_layers(spec, armature, collection, materials))

    armature["shi_character_id"] = spec["id"]
    armature["shi_character_label"] = spec["label"]
    armature["shi_status"] = "skeletal-production-blockout-not-final"
    armature["shi_disclosure"] = DISCLOSURE
    return {"spec": spec, "collection": collection, "armature": armature, "meshes": created}


def triangle_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def character_bounds(character: dict) -> dict[str, list[float]]:
    points = []
    for obj in character["meshes"]:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": [maximum[axis] - minimum[axis] for axis in range(3)],
    }


def select_character(character: dict) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    character["armature"].select_set(True)
    for obj in character["meshes"]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = character["armature"]


def export_character(character: dict, export_root: Path) -> dict[str, dict]:
    character_id = character["spec"]["id"]
    prefix = export_root / f"{ASSET_ID}-{character_id}"
    fbx_path = prefix.with_suffix(".fbx")
    glb_path = prefix.with_suffix(".glb")
    # Unreal's legacy FBX importer otherwise promotes the Blender armature object
    # name to an extra root bone. A canonical temporary `Armature` name activates
    # Unreal's documented Blender compatibility path, leaving the authored `Root`
    # as the sole skeleton root for all five identities.
    armature = character["armature"]
    original_armature_name = armature.name
    armature.name = "Armature"
    try:
        # Encode the metre-to-centimetre relationship as FBX global scaling,
        # never as a scaled armature object. Unreal's Blender compatibility path
        # retains the reviewed metre-valued local bounds while FBX_SCALE_ALL
        # keeps the imported skeletal Root at identity scale. Object-scale x100
        # produced a Root scale of 10,000: neutral bind cancellation looked
        # correct, but even restrained bone rotations catastrophically stretched
        # the skin.
        select_character(character)
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path), use_selection=True, object_types={"ARMATURE", "MESH"},
            global_scale=100.0, apply_unit_scale=True, apply_scale_options="FBX_SCALE_ALL",
            axis_forward="-Z", axis_up="Y", add_leaf_bones=False,
            bake_anim=False, mesh_smooth_type="FACE", use_tspace=False, armature_nodetype="NULL",
        )
        select_character(character)
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path), export_format="GLB", use_selection=True,
            export_skins=True, export_animations=False, export_apply=False, export_yup=True,
        )
    finally:
        armature.name = original_armature_name
    outputs = {}
    for kind, path in (("fbx", fbx_path), ("glb", glb_path)):
        outputs[kind] = {
            "file": str(path),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
    return outputs


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_preview_stage(scene: bpy.types.Scene, characters: list[dict], materials) -> None:
    spacing = 1.18
    for index, character in enumerate(characters):
        character["armature"].location.x = (index - 2) * spacing

    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0.0, 0.0, -0.008))
    ground = bpy.context.object
    ground.name = "DEV_SHI_CharacterLineupGround"
    ground.data.materials.append(materials["ground"])
    ground["shi_development_only"] = True

    bpy.ops.object.camera_add(location=(0.0, -8.2, 1.22))
    camera = bpy.context.object
    camera.name = "DEV_SHI_CharacterReviewCamera"
    camera.data.lens = 55
    camera.data.sensor_width = 36
    aim(camera, Vector((0.0, 0.0, 0.92)))
    scene.camera = camera

    bpy.ops.object.light_add(type="AREA", location=(-3.2, -4.0, 5.4))
    key = bpy.context.object
    key.name = "DEV_SHI_CharacterKey"
    key.data.energy = 1500
    key.data.shape = "DISK"
    key.data.size = 5.5
    aim(key, Vector((0.0, 0.0, 1.0)))

    bpy.ops.object.light_add(type="AREA", location=(4.0, 1.5, 3.0))
    rim = bpy.context.object
    rim.name = "DEV_SHI_CharacterRim"
    rim.data.energy = 1050
    rim.data.size = 4.0
    aim(rim, Vector((0.0, 0.0, 1.1)))

    bpy.ops.object.light_add(type="AREA", location=(0.0, -1.2, 4.8))
    fill = bpy.context.object
    fill.name = "DEV_SHI_CharacterFill"
    fill.data.energy = 700
    fill.data.size = 3.2
    aim(fill, Vector((0.0, 0.0, 0.9)))


def render_views(scene: bpy.types.Scene, rendered_root: Path) -> dict[str, dict]:
    camera = scene.camera
    views = {
        "front": ((0.0, -8.2, 1.22), (0.0, 0.0, 0.92)),
        "back": ((0.0, 8.2, 1.22), (0.0, 0.0, 0.92)),
        "oblique": ((5.9, -7.2, 2.55), (0.0, 0.0, 0.94)),
    }
    outputs = {}
    for view_name, (location, target) in views.items():
        camera.location = location
        aim(camera, Vector(target))
        path = rendered_root / f"{ASSET_ID}-{view_name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        outputs[view_name] = {
            "file": str(path),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
    return outputs


def existing_render_receipts(rendered_root: Path) -> dict[str, dict]:
    outputs = {}
    for view_name in ("front", "back", "oblique"):
        path = rendered_root / f"{ASSET_ID}-{view_name}.png"
        if not path.is_file():
            raise RuntimeError(f"Cannot skip missing character review render: {path}")
        outputs[view_name] = {
            "file": str(path),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
    return outputs


def portable_paths(value, repository_root: Path):
    if isinstance(value, dict):
        return {key: portable_paths(child, repository_root) for key, child in value.items()}
    if isinstance(value, list):
        return [portable_paths(child, repository_root) for child in value]
    if isinstance(value, str) and value.startswith("/"):
        path = Path(value)
        try:
            return path.relative_to(repository_root).as_posix()
        except ValueError:
            return value
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    export_root = asset_root / "export"
    rendered_root = asset_root / "rendered"
    source_root = asset_root / "source"
    for path in (export_root, rendered_root, source_root):
        path.mkdir(parents=True, exist_ok=True)

    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    ExportService = dynamic_import("mpfb.services.exportservice", "ExportService")
    scene = reset_scene()

    base_body = HumanService.create_human()
    base_armature = HumanService.add_builtin_rig(base_body, "game_engine")
    ExportService.bake_modifiers_remove_helpers(
        base_body, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True,
    )
    clean_body_vertex_groups(base_body, base_armature)
    if [bone.name for bone in base_armature.data.bones] != BONE_NAMES:
        raise RuntimeError("Pinned MPFB game_engine bone hierarchy drifted")

    characters = [make_character(spec, base_body, base_armature, scene.collection) for spec in CHARACTERS]
    bpy.data.objects.remove(base_body, do_unlink=True)
    bpy.data.objects.remove(base_armature, do_unlink=True)

    character_results = []
    for character in characters:
        bounds = character_bounds(character)
        triangle_total = sum(triangle_count(obj) for obj in character["meshes"])
        if triangle_total > 55000:
            raise RuntimeError(f"Triangle budget exceeded for {character['spec']['id']}: {triangle_total}")
        if not 1.55 <= bounds["dimensions"][2] <= 1.83:
            raise RuntimeError(f"Height contract failed for {character['spec']['id']}: {bounds}")
        exported = export_character(character, export_root)
        character_results.append({
            "id": character["spec"]["id"],
            "label": character["spec"]["label"],
            "roleShape": character["spec"]["role"],
            "hairShape": character["spec"]["hair"],
            "triangles": triangle_total,
            "meshCount": len(character["meshes"]),
            "boundsMetres": bounds,
            "materials": sorted({slot.material.name for obj in character["meshes"]
                                 for slot in obj.material_slots if slot.material}),
            "exports": exported,
        })

    preview_materials = {
        "ground": make_material("DEV_SHI_CharacterGround", (0.035, 0.038, 0.04, 1.0), 0.96),
    }
    add_preview_stage(scene, characters, preview_materials)
    blend_path = rendered_root / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    renders = existing_render_receipts(rendered_root) if args.skip_render else render_views(scene, rendered_root)

    metrics = {
        "assetId": ASSET_ID,
        "status": "five-identity skeletal production blockout; not final character art",
        "generator": "deterministic SHI Blender Python using pinned MPFB CC0 basemesh and game_engine rig",
        "blenderVersion": bpy.app.version_string,
        "mpfbVersion": "2.0.17",
        "mpfbCommit": "80919fa4682335c41847f761a4d79dcad4124732",
        "sharedSkeleton": RIG_NAME,
        "fbxArmatureObjectName": "Armature",
        "boneCount": len(BONE_NAMES),
        "boneNames": BONE_NAMES,
        "disclosure": DISCLOSURE,
        "neuralGeneration": False,
        "textureDependency": False,
        "communityAssets": False,
        "characters": character_results,
        "source": {
            "file": str(blend_path),
            "bytes": blend_path.stat().st_size,
            "sha256": hashlib.sha256(blend_path.read_bytes()).hexdigest(),
        },
        "renders": renders,
    }
    metrics = portable_paths(metrics, asset_root.parent.parent)
    metrics_path = source_root / f"{ASSET_ID}.metrics.json"
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "characters": [(row["id"], row["triangles"], row["meshCount"]) for row in character_results],
        "boneCount": len(BONE_NAMES),
        "metrics": str(metrics_path),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
