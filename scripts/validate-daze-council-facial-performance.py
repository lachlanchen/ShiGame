"""Independently validate SHI's facial-performance interchange payloads."""

import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-council-facial-performance-v1"
CHARACTER_IDS = ("keeper", "chen-sheng", "wu-guang", "yu-mu", "qin-courier")
MORPH_TARGETS = {
    "eyeBlinkLeft", "eyeBlinkRight",
    "eyeLookDownLeft", "eyeLookDownRight",
    "eyeLookInLeft", "eyeLookInRight",
    "eyeLookOutLeft", "eyeLookOutRight",
    "eyeLookUpLeft", "eyeLookUpRight",
    "browInnerUp", "browDownLeft", "browDownRight",
    "cheekSquintLeft", "cheekSquintRight",
    "jawOpen", "mouthFunnel", "mouthPressLeft", "mouthPressRight",
    "mouthUpperUpLeft", "mouthUpperUpRight",
}
EYE_GAZE_TARGETS = {
    "eyeLookDownLeft", "eyeLookDownRight",
    "eyeLookInLeft", "eyeLookInRight",
    "eyeLookOutLeft", "eyeLookOutRight",
    "eyeLookUpLeft", "eyeLookUpRight",
}
EYE_TEXTURE_SHA256 = "4659691c7295ad6206c78b003e5fd0e5f91dcd53032fa914a229bb48cabe424b"
REQUIRED_BONES = {
    "Root", "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
    "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
    "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
    "thigh_l", "calf_l", "foot_l", "ball_l",
    "thigh_r", "calf_r", "foot_r", "ball_r",
}
for side in ("l", "r"):
    for digit in ("index", "middle", "pinky", "ring", "thumb"):
        for segment in ("01", "02", "03"):
            REQUIRED_BONES.add(f"{digit}_{segment}_{side}")


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def shape_keys(obj: bpy.types.Object) -> set[str]:
    if not obj.data.shape_keys:
        return set()
    return {block.name for block in obj.data.shape_keys.key_blocks if block.name != "Basis"}


def triangle_count(obj: bpy.types.Object) -> int:
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def union_bounds(meshes: list[bpy.types.Object]) -> dict[str, list[float]]:
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return {
        "minimum": minimum,
        "maximum": maximum,
        "dimensions": [maximum[axis] - minimum[axis] for axis in range(3)],
    }


def normalize_material_name(name: str) -> str:
    stem, separator, suffix = name.rpartition(".")
    return stem if separator and suffix.isdigit() else name


def glb_manifest(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"glTF" or len(data) < 20 or data[16:20] != b"JSON":
        raise RuntimeError(f"Invalid GLB payload: {path}")
    json_size = struct.unpack_from("<I", data, 12)[0]
    payload = data[20:20 + json_size].rstrip(b"\x00 \t\r\n")
    manifest = json.loads(payload.decode("utf-8"))
    target_names = []
    for mesh in manifest.get("meshes", []):
        target_names.append(mesh.get("extras", {}).get("targetNames", []))
    return {
        "meshNames": [mesh.get("name", "") for mesh in manifest.get("meshes", [])],
        "targetNames": target_names,
        "skinJointCounts": [len(skin.get("joints", [])) for skin in manifest.get("skins", [])],
        "imageCount": len(manifest.get("images", [])),
        "textureCount": len(manifest.get("textures", [])),
        "animationCount": len(manifest.get("animations", [])),
    }


def image_receipts() -> list[dict]:
    receipts = []
    for image in bpy.data.images:
        if image.name in {"Render Result", "Viewer Node"}:
            continue
        packed = image.packed_file
        packed_hash = None
        packed_bytes = 0
        if packed:
            data = bytes(packed.data)
            packed_bytes = len(data)
            packed_hash = hashlib.sha256(data).hexdigest()
        receipts.append({
            "name": image.name,
            "source": image.source,
            "size": list(image.size),
            "packedBytes": packed_bytes,
            "packedSha256": packed_hash,
            "filepath": Path(image.filepath).name if image.filepath else "",
        })
    return receipts


def morph_receipts(obj: bpy.types.Object, scale_to_metres: float) -> dict[str, dict]:
    if not obj.data.shape_keys:
        return {}
    basis = obj.data.shape_keys.key_blocks[0]
    receipts = {}
    for block in obj.data.shape_keys.key_blocks[1:]:
        distances = [
            (block.data[index].co - basis.data[index].co).length * scale_to_metres
            for index in range(len(block.data))
        ]
        moved = [distance for distance in distances if distance > 0.000001]
        receipts[block.name] = {
            "movedVertices": len(moved),
            "maximumDisplacementMetres": max(moved) if moved else 0.0,
        }
    return receipts


def cross_format_morph_equivalence(formats: dict[str, list[dict]], metrics: dict) -> dict:
    """Prove clean FBX and GLB imports preserve source morph magnitudes.

    Blender's FBX importer represents world bounds in centimetres through the
    armature transform, but imported mesh and shape-key coordinates are already
    metre-valued. Keeping this comparison separate from world bounds prevents a
    second, erroneous x0.01 conversion of morph displacements.
    """
    tolerance_metres = 0.000005
    source_receipts = {
        "body": metrics["bodyMorphReceipts"],
        "eye": metrics["eyeMorphReceipts"],
    }
    rows_by_format = {
        kind: {row["characterId"]: row for row in rows}
        for kind, rows in formats.items()
    }
    characters = []
    maximum_error = 0.0
    for character_id in CHARACTER_IDS:
        character_receipt = {"characterId": character_id, "meshes": {}}
        for mesh_key, receipt_key in (
            ("body", "bodyMorphTargets"),
            ("eye", "eyeMorphTargets"),
        ):
            fbx_receipts = rows_by_format["fbx"][character_id][receipt_key]
            glb_receipts = rows_by_format["glb"][character_id][receipt_key]
            source = source_receipts[mesh_key]
            if set(fbx_receipts) != set(glb_receipts) or set(fbx_receipts) != set(source):
                raise RuntimeError(
                    f"{character_id}: {mesh_key} cross-format morph names drifted"
                )
            morphs = {}
            for morph_name in sorted(source):
                source_value = source[morph_name]["maximumDisplacementMetres"]
                fbx_value = fbx_receipts[morph_name]["maximumDisplacementMetres"]
                glb_value = glb_receipts[morph_name]["maximumDisplacementMetres"]
                error = max(
                    abs(fbx_value - glb_value),
                    abs(fbx_value - source_value),
                    abs(glb_value - source_value),
                )
                maximum_error = max(maximum_error, error)
                if error > tolerance_metres:
                    raise RuntimeError(
                        f"{character_id}: {mesh_key}/{morph_name} displacement "
                        f"drifted by {error:.9f} m (limit {tolerance_metres:.9f} m)"
                    )
                morphs[morph_name] = {
                    "sourceMaximumDisplacementMetres": source_value,
                    "fbxMaximumDisplacementMetres": fbx_value,
                    "glbMaximumDisplacementMetres": glb_value,
                    "maximumAbsoluteErrorMetres": error,
                    "fbxMovedVertices": fbx_receipts[morph_name]["movedVertices"],
                    "glbMovedVertices": glb_receipts[morph_name]["movedVertices"],
                }
            character_receipt["meshes"][mesh_key] = morphs
        characters.append(character_receipt)
    return {
        "status": "pass",
        "coordinateInterpretation": {
            "fbxWorldBounds": "centimetre payload converted to metres",
            "fbxMorphCoordinates": "metres after Blender armature compensation; no second scale conversion",
            "glbWorldBoundsAndMorphCoordinates": "metres",
        },
        "toleranceMetres": tolerance_metres,
        "maximumAbsoluteErrorMetres": maximum_error,
        "movedVertexCountPolicy": "recorded only; GLB body vertex splitting makes cross-format count equality invalid",
        "characters": characters,
    }


def imported_objects(path: Path, kind: str):
    reset_scene()
    if kind == "fbx":
        bpy.ops.import_scene.fbx(filepath=str(path), use_anim=False)
    else:
        bpy.ops.import_scene.gltf(filepath=str(path))
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    helpers = []
    if kind == "glb":
        helpers = [obj for obj in meshes if obj.name == "Icosphere" and not obj.modifiers]
        meshes = [obj for obj in meshes if obj not in helpers]
    return armatures, meshes, helpers


def identify_face_meshes(path: Path, meshes: list[bpy.types.Object]):
    body_candidates = [obj for obj in meshes if shape_keys(obj) == MORPH_TARGETS]
    eye_candidates = [obj for obj in meshes if shape_keys(obj) == EYE_GAZE_TARGETS]
    if len(body_candidates) != 1 or len(eye_candidates) != 1:
        payload = {obj.name: sorted(shape_keys(obj)) for obj in meshes if shape_keys(obj)}
        raise RuntimeError(f"{path.name}: exact body/eye morph meshes not found: {payload}")
    body, eyes = body_candidates[0], eye_candidates[0]
    expected_body_vertices = 13380 if path.suffix.lower() == ".fbx" else 14517
    if len(body.data.vertices) != expected_body_vertices or len(eyes.data.vertices) != 96:
        raise RuntimeError(
            f"{path.name}: facial body/eye topology drifted "
            f"({len(body.data.vertices)} body, {len(eyes.data.vertices)} eyes; "
            f"expected {expected_body_vertices}/96)"
        )
    if any(shape_keys(obj) for obj in meshes if obj not in {body, eyes}):
        raise RuntimeError(f"{path.name}: garment or prop unexpectedly acquired morph authority")
    return body, eyes


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
        raise RuntimeError(f"{path.name}: exact 53-bone shared hierarchy drifted")
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
        raise RuntimeError(f"{path.name}: shared rest pose drifted")
    if len(meshes) != expected["meshCount"]:
        raise RuntimeError(f"{path.name}: expected {expected['meshCount']} meshes, found {len(meshes)}")
    triangles = sum(triangle_count(obj) for obj in meshes)
    if triangles != expected["triangles"] or triangles > 56000:
        raise RuntimeError(f"{path.name}: triangle receipt drifted ({triangles})")

    body, eyes = identify_face_meshes(path, meshes)
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
            raise RuntimeError(f"{path.name}: {obj.name} has non-skeleton or missing groups")
        for vertex in obj.data.vertices:
            weight_sum = sum(group.weight for group in vertex.groups)
            maximum_influences = max(maximum_influences, len(vertex.groups))
            minimum_weight_sum = min(minimum_weight_sum, weight_sum)
            maximum_weight_sum = max(maximum_weight_sum, weight_sum)
            if not 0.99 <= weight_sum <= 1.01:
                raise RuntimeError(f"{path.name}: unnormalized weights on {obj.name}")
    if maximum_influences > (6 if kind == "fbx" else 4):
        raise RuntimeError(f"{path.name}: excessive vertex influences ({maximum_influences})")

    scale_to_metres = 0.01 if kind == "fbx" else 1.0
    payload_bounds = union_bounds(meshes)
    bounds = {key: [value * scale_to_metres for value in values]
              for key, values in payload_bounds.items()}
    physical_height = max(bounds["dimensions"])
    if not 1.55 <= physical_height <= 1.83:
        raise RuntimeError(f"{path.name}: physical height outside contract ({physical_height})")
    materials = sorted({normalize_material_name(slot.material.name)
                        for obj in meshes for slot in obj.material_slots if slot.material})
    if materials != sorted(expected["materials"]):
        raise RuntimeError(f"{path.name}: material set drifted: {materials}")
    images = image_receipts()
    if not images or any(image["size"] != [1024, 1024] for image in images):
        raise RuntimeError(f"{path.name}: CC0 eye texture payload is missing or malformed: {images}")

    # FBX world bounds need centimetre-to-metre conversion, while the imported
    # mesh and shape-key coordinates are already metre-valued beneath the
    # armature's compensating x100 transform.
    morph_scale_to_metres = 1.0
    body_morphs = morph_receipts(body, morph_scale_to_metres)
    eye_morphs = morph_receipts(eyes, morph_scale_to_metres)
    if any(not row["movedVertices"] or row["maximumDisplacementMetres"] > 0.08
           for row in body_morphs.values()):
        raise RuntimeError(f"{path.name}: body morph displacement contract failed")
    if any(not row["movedVertices"] or row["maximumDisplacementMetres"] > 0.035
           for row in eye_morphs.values()):
        raise RuntimeError(f"{path.name}: eye morph displacement contract failed")

    manifest = glb_manifest(path) if kind == "glb" else None
    if manifest:
        target_sets = [set(names) for names in manifest["targetNames"] if names]
        if set(map(frozenset, target_sets)) != {frozenset(MORPH_TARGETS), frozenset(EYE_GAZE_TARGETS)}:
            raise RuntimeError(f"{path.name}: GLB manifest target names drifted")
        if manifest["skinJointCounts"] != [53] or manifest["imageCount"] != 1:
            raise RuntimeError(f"{path.name}: GLB skeleton/eye image manifest drifted")
        if manifest["animationCount"]:
            raise RuntimeError(f"{path.name}: neutral facial mesh unexpectedly contains animation")

    return {
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
        "materials": materials,
        "images": images,
        "bodyMorphTargets": body_morphs,
        "eyeMorphTargets": eye_morphs,
        "importerOnlyHelperMeshes": [obj.name for obj in helpers],
        "payloadManifest": manifest,
    }, pose


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def apply_review_eye_material(eyes: bpy.types.Object, texture_path: Path) -> None:
    """Rebind the separately tracked eye texture for interchange review.

    The production Unreal importer deliberately does not trust or import FBX
    material graphs. This review material proves the clean FBX eye UVs against
    the exact tracked CC0 bitmap without claiming FBX material authority.
    """
    material = bpy.data.materials.new("DEV_SHI_FBXImport_EyeBrown_CC0")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(texture_path), check_existing=True)
    shader.inputs["Roughness"].default_value = 0.38
    shader.inputs["Specular IOR Level"].default_value = 0.32
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs[0], output.inputs["Surface"])
    eyes.data.materials.clear()
    eyes.data.materials.append(material)


def render_clean_fbx_states(asset_root: Path, rendered_root: Path) -> dict[str, dict]:
    fbx_path = asset_root / "export" / f"{ASSET_ID}-keeper.fbx"
    armatures, meshes, _ = imported_objects(fbx_path, "fbx")
    armature = armatures[0]
    body, eyes = identify_face_meshes(fbx_path, meshes)
    apply_review_eye_material(
        eyes, asset_root / "source" / f"{ASSET_ID}-brown-eye-cc0.png",
    )
    # Blender's FBX round trip returns the armature object at x100 while its
    # children retain metre-valued mesh coordinates beneath a compensating
    # parent inverse. Restoring the armature object to identity yields the
    # reviewed 1.66 m figure; setting it to 0.01 would shrink the payload twice.
    armature.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 960
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("SHI_FacialImportWorld")
    scene.world.color = (0.012, 0.014, 0.017)
    bpy.ops.object.camera_add(location=(0.0, -0.78, 1.56))
    camera = bpy.context.object
    camera.data.lens = 72
    aim(camera, Vector((0.0, -0.012, 1.54)))
    scene.camera = camera
    for location, energy, size in (
        ((-0.55, -0.65, 2.15), 155, 0.72),
        ((0.52, -0.25, 1.76), 90, 0.55),
        ((0.0, 0.45, 1.92), 110, 0.50),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        aim(light, Vector((0.0, 0.0, 1.53)))
    states = {
        "neutral": {},
        "blink": {"eyeBlinkLeft": 0.82, "eyeBlinkRight": 0.82},
        "gaze": {"eyeLookOutLeft": 0.18, "eyeLookInRight": 0.18},
        "silent-speech": {
            "jawOpen": 0.28, "mouthFunnel": 0.10,
            "mouthUpperUpLeft": 0.06, "mouthUpperUpRight": 0.06,
        },
    }
    outputs = {}
    for state_name, weights in states.items():
        for obj in (body, eyes):
            for block in obj.data.shape_keys.key_blocks:
                if block.name != "Basis":
                    block.value = weights.get(block.name, 0.0)
        path = rendered_root / f"{ASSET_ID}-fbx-import-{state_name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        outputs[state_name] = {
            "file": path.as_posix(),
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "weights": weights,
            "reviewMaterial": "tracked CC0 eye texture rebound after geometry-only FBX import",
        }
    return outputs


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
    rendered_root = asset_root / "rendered"
    metrics_path = asset_root / "source" / f"{ASSET_ID}.metrics.json"
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    if (metrics.get("morphTargetCount") != 21
            or set(metrics.get("morphTargets", [])) != MORPH_TARGETS
            or set(metrics.get("eyeGazeTargets", [])) != EYE_GAZE_TARGETS
            or metrics.get("boneCount") != 53
            or set(metrics.get("boneNames", [])) != REQUIRED_BONES
            or metrics.get("neuralGeneration") is not False
            or metrics.get("voiceOrTranscriptInput") is not False):
        raise RuntimeError("Facial source metrics do not carry the exact non-neural/silent contract")
    expected_by_id = {row["id"]: row for row in metrics["characters"]}
    if tuple(expected_by_id) != CHARACTER_IDS:
        raise RuntimeError("Canonical five-character facial export order drifted")
    tracked_texture = asset_root / "source" / f"{ASSET_ID}-brown-eye-cc0.png"
    if hashlib.sha256(tracked_texture.read_bytes()).hexdigest() != EYE_TEXTURE_SHA256:
        raise RuntimeError("Tracked CC0 brown-eye texture hash drifted")

    formats = {"fbx": [], "glb": []}
    reference_poses = {"fbx": None, "glb": None}
    for kind in formats:
        for character_id in CHARACTER_IDS:
            path = asset_root / "export" / f"{ASSET_ID}-{character_id}.{kind}"
            result, pose = inspect_character(
                path, kind, expected_by_id[character_id], metrics["boneNames"],
                reference_poses[kind],
            )
            reference_poses[kind] = reference_poses[kind] or pose
            result["characterId"] = character_id
            formats[kind].append(result)

    morph_equivalence = cross_format_morph_equivalence(formats, metrics)

    render_names = ("neutral", "blink", "gaze", "silent-speech")
    if args.skip_render:
        clean_renders = {}
        for name in render_names:
            path = rendered_root / f"{ASSET_ID}-fbx-import-{name}.png"
            if not path.is_file():
                raise RuntimeError(f"Cannot skip missing clean FBX render: {path}")
            clean_renders[name] = {
                "file": path.as_posix(),
                "bytes": path.stat().st_size,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
    else:
        clean_renders = render_clean_fbx_states(asset_root, rendered_root)

    report = portable_paths({
        "assetId": ASSET_ID,
        "validator": "clean Blender FBX/GLB import, exact skeleton/morph/material/texture/weight/bounds checks and clean FBX face-state renders",
        "blenderVersion": bpy.app.version_string,
        "status": "pass",
        "boneCount": 53,
        "morphTargetCount": 21,
        "morphTargets": sorted(MORPH_TARGETS),
        "eyeGazeTargets": sorted(EYE_GAZE_TARGETS),
        "sharedRestPose": True,
        "canonicalCharacterIds": list(CHARACTER_IDS),
        "trackedEyeTextureSha256": EYE_TEXTURE_SHA256,
        "formats": formats,
        "crossFormatMorphEquivalence": morph_equivalence,
        "cleanFbxStateRenders": clean_renders,
        "limitations": [
            "engineering blockout only; no final acting, close-dialogue, voice or lip-sync approval",
            "generic shared non-portrait face and CC0 eye baseline",
            "mouth interior, teeth, tongue, brows, lashes, skin, hair and cloth remain final-art red gates",
        ],
    }, repository_root)
    output_path = asset_root / "source" / f"{ASSET_ID}.validation.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "status": report["status"],
        "fbx": [(row["characterId"], row["triangles"], len(row["bodyMorphTargets"]))
                for row in formats["fbx"]],
        "glb": [(row["characterId"], row["triangles"], len(row["bodyMorphTargets"]))
                for row in formats["glb"]],
        "report": output_path.as_posix(),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
