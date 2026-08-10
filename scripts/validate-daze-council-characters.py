import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-council-characters-v1"
CHARACTER_IDS = ["keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier"]
REQUIRED_BONES = {
    "Root", "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
    "thigh_l", "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r",
}
for side in ("l", "r"):
    for digit in ("index", "middle", "pinky", "ring", "thumb"):
        for segment in ("01", "02", "03"):
            REQUIRED_BONES.add(f"{digit}_{segment}_{side}")


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def triangle_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def union_bounds(meshes: list[bpy.types.Object]) -> dict[str, list[float]]:
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    dimensions = [maximum[axis] - minimum[axis] for axis in range(3)]
    return {"minimum": minimum, "maximum": maximum, "dimensions": dimensions}


def glb_manifest(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"glTF" or len(data) < 20:
        raise RuntimeError(f"Invalid GLB header: {path}")
    json_size = struct.unpack_from("<I", data, 12)[0]
    if data[16:20] != b"JSON":
        raise RuntimeError(f"Missing GLB JSON chunk: {path}")
    payload = data[20:20 + json_size].rstrip(b"\x00 \t\r\n")
    manifest = json.loads(payload.decode("utf-8"))
    return {
        "meshNames": [mesh.get("name", "") for mesh in manifest.get("meshes", [])],
        "skinJointCounts": [len(skin.get("joints", [])) for skin in manifest.get("skins", [])],
        "imageCount": len(manifest.get("images", [])),
        "textureCount": len(manifest.get("textures", [])),
        "animationCount": len(manifest.get("animations", [])),
    }


def imported_objects(path: Path, kind: str):
    reset_scene()
    if kind == "fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        bpy.ops.import_scene.gltf(filepath=str(path))
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    helper_meshes = []
    if kind == "glb":
        helper_meshes = [obj for obj in meshes if obj.name == "Icosphere" and not obj.modifiers]
        meshes = [obj for obj in meshes if obj not in helper_meshes]
    return armatures, meshes, helper_meshes


def inspect_character(path: Path, kind: str, expected: dict, expected_bones: list[str],
                      reference_pose: dict | None) -> tuple[dict, dict]:
    if not path.is_file():
        raise RuntimeError(f"Missing {kind.upper()} export: {path}")
    armatures, meshes, helpers = imported_objects(path, kind)
    if len(armatures) != 1:
        raise RuntimeError(f"{path.name}: expected one armature, found {len(armatures)}")
    armature = armatures[0]
    bones = [bone.name for bone in armature.data.bones]
    if len(bones) != 53 or set(bones) != REQUIRED_BONES or bones != expected_bones:
        raise RuntimeError(f"{path.name}: 53-bone hierarchy drifted")
    roots = [bone.name for bone in armature.data.bones if bone.parent is None]
    if roots != ["Root"]:
        raise RuntimeError(f"{path.name}: unexpected skeleton roots {roots}")
    pose = {
        bone.name: {
            "parent": bone.parent.name if bone.parent else None,
            "head": [round(value, 6) for value in bone.head_local],
            "tail": [round(value, 6) for value in bone.tail_local],
        }
        for bone in armature.data.bones
    }
    if reference_pose is not None and pose != reference_pose:
        raise RuntimeError(f"{path.name}: shared skeleton rest pose drifted")

    if len(meshes) != expected["meshCount"]:
        raise RuntimeError(f"{path.name}: expected {expected['meshCount']} render meshes, found {len(meshes)}")
    triangles = sum(triangle_count(obj) for obj in meshes)
    if triangles != expected["triangles"] or triangles > 55000:
        raise RuntimeError(f"{path.name}: triangle receipt drifted ({triangles})")

    all_bones = set(bones)
    maximum_influences = 0
    minimum_weight_sum = 10.0
    maximum_weight_sum = 0.0
    for obj in meshes:
        modifiers = [modifier for modifier in obj.modifiers if modifier.type == "ARMATURE"]
        if len(modifiers) != 1 or modifiers[0].object != armature:
            raise RuntimeError(f"{path.name}: {obj.name} is not bound to the sole armature")
        group_names = {group.name for group in obj.vertex_groups}
        if not group_names or not group_names.issubset(all_bones):
            raise RuntimeError(f"{path.name}: {obj.name} has missing or non-skeleton vertex groups")
        for vertex in obj.data.vertices:
            weight_sum = sum(group.weight for group in vertex.groups)
            maximum_influences = max(maximum_influences, len(vertex.groups))
            minimum_weight_sum = min(minimum_weight_sum, weight_sum)
            maximum_weight_sum = max(maximum_weight_sum, weight_sum)
            if not 0.99 <= weight_sum <= 1.01:
                raise RuntimeError(f"{path.name}: unnormalized vertex weights on {obj.name}")
    if maximum_influences > (6 if kind == "fbx" else 4):
        raise RuntimeError(f"{path.name}: excessive vertex influences ({maximum_influences})")

    texture_nodes = []
    for material in bpy.data.materials:
        if material.use_nodes and material.node_tree:
            texture_nodes.extend(node.name for node in material.node_tree.nodes if node.type == "TEX_IMAGE")
    file_images = [image.filepath for image in bpy.data.images if image.source == "FILE" and image.filepath]
    if texture_nodes or file_images:
        raise RuntimeError(f"{path.name}: unexpected texture dependency")
    if bpy.data.actions:
        raise RuntimeError(f"{path.name}: animation actions entered the neutral blockout export")

    payload_bounds = union_bounds(meshes)
    scale_to_metres = 0.01 if kind == "fbx" else 1.0
    bounds = {
        key: [value * scale_to_metres for value in values]
        for key, values in payload_bounds.items()
    }
    physical_height = max(bounds["dimensions"])
    if not 1.55 <= physical_height <= 1.83:
        raise RuntimeError(f"{path.name}: physical height outside contract ({physical_height})")
    material_names = sorted({slot.material.name for obj in meshes for slot in obj.material_slots if slot.material})
    expected_materials = sorted(expected["materials"])
    normalized_materials = sorted(name.rsplit(".", 1)[0] if name.rsplit(".", 1)[-1].isdigit() else name
                                  for name in material_names)
    if sorted(set(normalized_materials)) != expected_materials:
        raise RuntimeError(f"{path.name}: material set drifted ({material_names})")

    manifest = glb_manifest(path) if kind == "glb" else None
    if manifest:
        if len(manifest["meshNames"]) != expected["meshCount"]:
            raise RuntimeError(f"{path.name}: GLB payload mesh count drifted")
        if manifest["skinJointCounts"] != [53] or manifest["imageCount"] or manifest["textureCount"]:
            raise RuntimeError(f"{path.name}: GLB skin/texture manifest drifted")
        if manifest["animationCount"]:
            raise RuntimeError(f"{path.name}: GLB unexpectedly contains animation")

    result = {
        "file": path.as_posix(),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "armature": armature.name,
        "boneCount": len(bones),
        "rootBone": roots[0],
        "meshCount": len(meshes),
        "triangles": triangles,
        "boundsMetres": bounds,
        "payloadBounds": payload_bounds,
        "payloadUnit": "centimetre" if kind == "fbx" else "metre",
        "physicalHeightMetres": physical_height,
        "maximumVertexInfluences": maximum_influences,
        "weightSumRange": [minimum_weight_sum, maximum_weight_sum],
        "materials": material_names,
        "textureDependencies": 0,
        "animations": 0,
        "importerOnlyHelperMeshes": [obj.name for obj in helpers],
        "payloadManifest": manifest,
    }
    return result, pose


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_clean_fbx_lineup(asset_root: Path, output_path: Path) -> dict:
    reset_scene()
    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("SHI_CleanImportWorld")
    scene.world.color = (0.015, 0.017, 0.018)

    spacing = 1.18
    for index, character_id in enumerate(CHARACTER_IDS):
        before = set(bpy.context.scene.objects)
        path = asset_root / "export" / f"{ASSET_ID}-{character_id}.fbx"
        bpy.ops.import_scene.fbx(filepath=str(path))
        created = [obj for obj in bpy.context.scene.objects if obj not in before]
        armatures = [obj for obj in created if obj.type == "ARMATURE"]
        if len(armatures) != 1:
            raise RuntimeError(f"Clean lineup could not identify {character_id} armature")
        armatures[0].scale = (0.01, 0.01, 0.01)
        armatures[0].location.x = (index - 2) * spacing

    ground_material = bpy.data.materials.new("DEV_SHI_CleanImportGround")
    ground_material.diffuse_color = (0.035, 0.038, 0.04, 1.0)
    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0.0, 0.0, -0.008))
    bpy.context.object.data.materials.append(ground_material)

    bpy.ops.object.camera_add(location=(5.9, -7.2, 2.55))
    camera = bpy.context.object
    camera.data.lens = 55
    aim(camera, Vector((0.0, 0.0, 0.94)))
    scene.camera = camera
    for light_type, location, energy, size in (
        ("AREA", (-3.2, -4.0, 5.4), 1500, 5.5),
        ("AREA", (4.0, 1.5, 3.0), 1050, 4.0),
        ("AREA", (0.0, -1.2, 4.8), 700, 3.2),
    ):
        bpy.ops.object.light_add(type=light_type, location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        aim(light, Vector((0.0, 0.0, 1.0)))
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    return {
        "file": output_path.as_posix(),
        "bytes": output_path.stat().st_size,
        "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
    }


def portable_paths(value, repository_root: Path):
    if isinstance(value, dict):
        return {key: portable_paths(child, repository_root) for key, child in value.items()}
    if isinstance(value, list):
        return [portable_paths(child, repository_root) for child in value]
    if isinstance(value, str) and value.startswith("/"):
        try:
            return Path(value).relative_to(repository_root).as_posix()
        except ValueError:
            return value
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent
    metrics_path = asset_root / "source" / f"{ASSET_ID}.metrics.json"
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    if metrics["boneCount"] != 53 or set(metrics["boneNames"]) != REQUIRED_BONES:
        raise RuntimeError("Source metrics do not carry the exact admitted 53-bone hierarchy")
    expected_by_id = {row["id"]: row for row in metrics["characters"]}
    if list(expected_by_id) != CHARACTER_IDS:
        raise RuntimeError("Canonical five-character export order drifted")

    formats = {"fbx": [], "glb": []}
    reference_poses = {"fbx": None, "glb": None}
    for kind in formats:
        for character_id in CHARACTER_IDS:
            path = asset_root / "export" / f"{ASSET_ID}-{character_id}.{kind}"
            result, pose = inspect_character(
                path, kind, expected_by_id[character_id], metrics["boneNames"], reference_poses[kind],
            )
            reference_poses[kind] = reference_poses[kind] or pose
            result["characterId"] = character_id
            formats[kind].append(result)

    render_path = asset_root / "rendered" / f"{ASSET_ID}-fbx-import.png"
    if args.skip_render:
        if not render_path.is_file():
            raise RuntimeError(f"Cannot skip missing clean-import render: {render_path}")
        clean_render = {
            "file": render_path.as_posix(),
            "bytes": render_path.stat().st_size,
            "sha256": hashlib.sha256(render_path.read_bytes()).hexdigest(),
        }
    else:
        clean_render = render_clean_fbx_lineup(asset_root, render_path)

    report = portable_paths({
        "assetId": ASSET_ID,
        "validator": "clean Blender FBX/GLB import plus skeleton, hierarchy, weights, mesh, material, texture, animation, bounds and payload inspection",
        "blenderVersion": bpy.app.version_string,
        "status": "pass",
        "boneCount": 53,
        "sharedRestPose": True,
        "canonicalCharacterIds": CHARACTER_IDS,
        "formats": formats,
        "cleanFbxLineup": clean_render,
        "limitations": [
            "neutral production blockout only; no facial, cloth, hair, LOD or final costume approval",
            "GLB intentionally clamps the CC0 body baseline to four highest joint influences; FBX preserves at most six",
            "Blender GLB import creates one local unbound Icosphere armature-display helper not present in the GLB payload",
        ],
    }, repository_root)
    output_path = asset_root / "source" / f"{ASSET_ID}.validation.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "status": report["status"],
        "fbx": [(row["characterId"], row["triangles"], row["maximumVertexInfluences"])
                for row in formats["fbx"]],
        "glb": [(row["characterId"], row["triangles"], row["maximumVertexInfluences"])
                for row in formats["glb"]],
        "report": output_path.as_posix(),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
