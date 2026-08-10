"""Build SHI's bounded council facial-performance engineering blockout.

This script runs inside the pinned Blender 4.5.12/MPFB profile. It reuses the
accepted v1 character silhouette authoring functions, adds the official CC0
MakeHuman low-poly eyes and Faceunits 01 targets, then retains only the exact
runtime contract. No neural generation, portrait input, voice, transcript or
phoneme timing enters this lane.
"""

import argparse
import hashlib
import importlib
import importlib.util
import json
import math
from pathlib import Path
import shutil
import sys

import bpy
from mathutils import Vector


ASSET_ID = "shi-daze-council-facial-performance-v1"
CHARACTER_SOURCE_ID = "shi-daze-council-characters-v1"
RIG_NAME = "SK_SHI_DazeCouncil_Skeleton"
DISCLOSURE = (
    "FACIAL PERFORMANCE ENGINEERING BLOCKOUT · SILENT INTENT CADENCE · "
    "GENERIC NON-PORTRAIT FACE · NOT FINAL ACTING, LIP SYNC OR VOICE"
)
FACEUNITS_ARCHIVE_SHA256 = "d113107bd7eb59f3af4df6fc0ec29bfcc593f496d0b336aec14f086a80ce7146"
EYE_MHCLO_SHA256 = "68582e28e9176cba7cfcf35208f671b6201b8d1bc95c32decff61a3160ec34d8"
EYE_OBJ_SHA256 = "783fe1e6331162c876520b4c2bed7a8ca06354ca15497e8ebd68bb1b59f4d3de"
EYE_MATERIAL_SHA256 = "4abad93ce50541c08127721e77bce035640c9f16bed16cd0f5524b1cd5908465"
EYE_TEXTURE_SHA256 = "4659691c7295ad6206c78b003e5fd0e5f91dcd53032fa914a229bb48cabe424b"
EYE_MATERIAL_NAME = "M_SHI_Character_EyeBrown"
EYE_TEXTURE_NAME = f"{ASSET_ID}-brown-eye-cc0.png"

MORPH_TARGETS = (
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
    "browInnerUp",
    "browDownLeft",
    "browDownRight",
    "cheekSquintLeft",
    "cheekSquintRight",
    "jawOpen",
    "mouthFunnel",
    "mouthPressLeft",
    "mouthPressRight",
    "mouthUpperUpLeft",
    "mouthUpperUpRight",
)
EYE_GAZE_TARGETS = (
    "eyeLookDownLeft",
    "eyeLookDownRight",
    "eyeLookInLeft",
    "eyeLookInRight",
    "eyeLookOutLeft",
    "eyeLookOutRight",
    "eyeLookUpLeft",
    "eyeLookUpRight",
)
REVIEW_STATES = {
    "neutral": {},
    "blink": {"eyeBlinkLeft": 0.82, "eyeBlinkRight": 0.82},
    "object-glance": {"eyeLookOutLeft": 0.18, "eyeLookInRight": 0.18},
    "interrupted-return": {
        "browInnerUp": 0.12,
        "mouthPressLeft": 0.06,
        "mouthPressRight": 0.06,
        "cheekSquintLeft": 0.04,
        "cheekSquintRight": 0.04,
    },
    "silent-speech": {
        "jawOpen": 0.28,
        "mouthFunnel": 0.10,
        "mouthUpperUpLeft": 0.06,
        "mouthUpperUpRight": 0.06,
    },
    "held-breath": {
        "browDownLeft": 0.05,
        "browDownRight": 0.05,
        "cheekSquintLeft": 0.08,
        "cheekSquintRight": 0.08,
        "mouthPressLeft": 0.16,
        "mouthPressRight": 0.16,
    },
}


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def load_character_builder():
    path = Path(__file__).with_name("build-daze-council-characters.py")
    spec = importlib.util.spec_from_file_location("shi_daze_council_character_builder", path)
    if not spec or not spec.loader:
        raise RuntimeError(f"Cannot load accepted character builder: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def dynamic_import(package_suffix: str, key: str):
    for module_name in tuple(sys.modules):
        if module_name.endswith(package_suffix):
            module = importlib.import_module(module_name)
            if hasattr(module, key):
                return getattr(module, key)
    raise RuntimeError(f"MPFB extension module unavailable: {package_suffix}.{key}")


def file_receipt(path: Path, role: str) -> dict:
    return {
        "file": str(path),
        "role": role,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def retain_exact_shape_keys(obj: bpy.types.Object, required: tuple[str, ...]) -> None:
    if not obj.data.shape_keys:
        raise RuntimeError(f"{obj.name} has no facial shape-key payload")
    for block in list(obj.data.shape_keys.key_blocks)[1:][::-1]:
        if block.name not in required:
            obj.shape_key_remove(block)
    actual = {block.name for block in obj.data.shape_keys.key_blocks if block.name != "Basis"}
    if actual != set(required):
        raise RuntimeError(f"{obj.name} shape-key contract drifted: {sorted(actual)}")


def clean_vertex_groups(obj: bpy.types.Object, armature: bpy.types.Object) -> None:
    admitted = {bone.name for bone in armature.data.bones}
    for group in list(obj.vertex_groups):
        if group.name not in admitted:
            obj.vertex_groups.remove(group)
    if not obj.vertex_groups:
        raise RuntimeError(f"{obj.name} lost every admitted skin-weight group")


def morph_receipts(obj: bpy.types.Object) -> dict[str, dict]:
    basis = obj.data.shape_keys.key_blocks[0]
    result = {}
    for block in obj.data.shape_keys.key_blocks[1:]:
        distances = [(block.data[index].co - basis.data[index].co).length
                     for index in range(len(block.data))]
        moved = [distance for distance in distances if distance > 0.000001]
        result[block.name] = {
            "movedVertices": len(moved),
            "maximumDisplacementMetres": max(moved) if moved else 0.0,
            "meanMovedDisplacementMetres": sum(moved) / len(moved) if moved else 0.0,
        }
    return result


def set_face_state(meshes: list[bpy.types.Object], weights: dict[str, float]) -> None:
    for obj in meshes:
        if not obj.data.shape_keys:
            continue
        for block in obj.data.shape_keys.key_blocks:
            if block.name != "Basis":
                block.value = 0.0
        for name, value in weights.items():
            block = obj.data.shape_keys.key_blocks.get(name)
            if block:
                block.value = value


def clone_eyes(base_eyes: bpy.types.Object, armature: bpy.types.Object, collection,
               character_id: str) -> bpy.types.Object:
    eyes = base_eyes.copy()
    eyes.data = base_eyes.data
    eyes.name = f"SKM_SHI_{character_id}_Eyes"
    collection.objects.link(eyes)
    eyes.parent = armature
    for modifier in eyes.modifiers:
        if modifier.type == "ARMATURE":
            modifier.object = armature
            modifier.use_deform_preserve_volume = True
    return eyes


def make_character(builder, spec: dict, base_body: bpy.types.Object,
                   base_armature: bpy.types.Object, base_eyes: bpy.types.Object,
                   scene_collection) -> dict:
    character = builder.make_character(spec, base_body, base_armature, scene_collection)
    body = character["meshes"][0]
    copied_mesh = body.data
    body.data = base_body.data
    if copied_mesh.users == 0:
        bpy.data.meshes.remove(copied_mesh)
    eyes = clone_eyes(base_eyes, character["armature"], character["collection"], spec["id"])
    character["body"] = body
    character["eyes"] = eyes
    character["meshes"].insert(1, eyes)
    character["armature"]["shi_facial_asset_id"] = ASSET_ID
    character["armature"]["shi_facial_status"] = "engineering-blockout-not-final-acting"
    character["armature"]["shi_facial_disclosure"] = DISCLOSURE
    return character


def export_character(builder, character: dict, export_root: Path) -> dict[str, dict]:
    character_id = character["spec"]["id"]
    prefix = export_root / f"{ASSET_ID}-{character_id}"
    fbx_path = prefix.with_suffix(".fbx")
    glb_path = prefix.with_suffix(".glb")
    armature = character["armature"]
    original_armature_name = armature.name
    armature.name = "Armature"
    try:
        builder.select_character(character)
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path), use_selection=True, object_types={"ARMATURE", "MESH"},
            global_scale=100.0, apply_unit_scale=True, apply_scale_options="FBX_SCALE_ALL",
            axis_forward="-Z", axis_up="Y", add_leaf_bones=False,
            bake_anim=False, mesh_smooth_type="FACE", use_tspace=False,
            armature_nodetype="NULL", path_mode="COPY", embed_textures=True,
        )
        builder.select_character(character)
        bpy.ops.export_scene.gltf(
            filepath=str(glb_path), export_format="GLB", use_selection=True,
            export_skins=True, export_animations=False, export_apply=False,
            export_yup=True, export_morph=True, export_morph_normal=True,
            export_morph_tangent=False,
        )
    finally:
        armature.name = original_armature_name
    return {
        "fbx": file_receipt(fbx_path, f"{character_id} facial FBX"),
        "glb": file_receipt(glb_path, f"{character_id} facial GLB"),
    }


def aim(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_lineup(scene: bpy.types.Scene, rendered_root: Path) -> dict[str, dict]:
    camera = scene.camera
    outputs = {}
    for name, location, target in (
        ("lineup-front", (0.0, -8.2, 1.22), (0.0, 0.0, 0.92)),
        ("lineup-oblique", (5.9, -7.2, 2.55), (0.0, 0.0, 0.94)),
    ):
        camera.location = location
        aim(camera, Vector(target))
        path = rendered_root / f"{ASSET_ID}-{name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        outputs[name] = file_receipt(path, f"{name} neutral review")
    return outputs


def render_face_states(scene: bpy.types.Scene, characters: list[dict], rendered_root: Path) -> dict[str, dict]:
    keeper = characters[0]
    for character in characters:
        hidden = character is not keeper
        for obj in character["meshes"]:
            obj.hide_render = hidden
    keeper["armature"].location = (0.0, 0.0, 0.0)
    scene.render.resolution_x = 960
    scene.render.resolution_y = 960
    scene.camera.location = (0.0, -0.78, 1.56)
    scene.camera.data.lens = 72
    aim(scene.camera, Vector((0.0, -0.012, 1.54)))
    outputs = {}
    for state_name, weights in REVIEW_STATES.items():
        set_face_state([keeper["body"], keeper["eyes"]], weights)
        path = rendered_root / f"{ASSET_ID}-{state_name}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        outputs[state_name] = {
            **file_receipt(path, f"Keeper {state_name} engineering review"),
            "weights": weights,
        }
    set_face_state([keeper["body"], keeper["eyes"]], {})
    for character in characters:
        for obj in character["meshes"]:
            obj.hide_render = False
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
            return Path(value).name
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-root", type=Path, default=Path("assets/3d"))
    parser.add_argument("--skip-render", action="store_true")
    args = parser.parse_args(script_args())
    asset_root = args.asset_root.resolve()
    repository_root = asset_root.parent.parent
    export_root = asset_root / "export"
    rendered_root = asset_root / "rendered"
    source_root = asset_root / "source"
    for path in (export_root, rendered_root, source_root):
        path.mkdir(parents=True, exist_ok=True)

    builder = load_character_builder()
    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    ExportService = dynamic_import("mpfb.services.exportservice", "ExportService")
    FaceService = dynamic_import("mpfb.services.faceservice", "FaceService")
    LocationService = dynamic_import("mpfb.services.locationservice", "LocationService")
    scene = builder.reset_scene()

    user_data = Path(LocationService.get_user_data())
    eye_mhclo = user_data / "eyes/low-poly/low-poly.mhclo"
    eye_obj = user_data / "eyes/low-poly/low-poly.obj"
    eye_mhmat = user_data / "eyes/materials/brown.mhmat"
    eye_texture_source = user_data / "eyes/materials/brown_eye.png"
    faceunits_archive = Path.home() / ".local/share/shi-tools/downloads/faceunits01.zip"
    required_sources = (eye_mhclo, eye_obj, eye_mhmat, eye_texture_source, faceunits_archive)
    if not all(path.is_file() for path in required_sources):
        raise FileNotFoundError(f"Pinned CC0 face source missing: {required_sources}")
    actual_source_hashes = {
        "faceunitsArchive": hashlib.sha256(faceunits_archive.read_bytes()).hexdigest(),
        "eyeMhclo": hashlib.sha256(eye_mhclo.read_bytes()).hexdigest(),
        "eyeObj": hashlib.sha256(eye_obj.read_bytes()).hexdigest(),
        "eyeMaterial": hashlib.sha256(eye_mhmat.read_bytes()).hexdigest(),
        "eyeTexture": hashlib.sha256(eye_texture_source.read_bytes()).hexdigest(),
    }
    expected_source_hashes = {
        "faceunitsArchive": FACEUNITS_ARCHIVE_SHA256,
        "eyeMhclo": EYE_MHCLO_SHA256,
        "eyeObj": EYE_OBJ_SHA256,
        "eyeMaterial": EYE_MATERIAL_SHA256,
        "eyeTexture": EYE_TEXTURE_SHA256,
    }
    if actual_source_hashes != expected_source_hashes:
        raise RuntimeError(f"Pinned CC0 face source hash drifted: {actual_source_hashes}")
    if not FaceService.is_faceunits01_installed(force_recheck=True):
        raise RuntimeError("Official Faceunits 01 pack is not installed in the isolated profile")

    tracked_eye_texture = source_root / EYE_TEXTURE_NAME
    shutil.copy2(eye_texture_source, tracked_eye_texture)
    if hashlib.sha256(tracked_eye_texture.read_bytes()).hexdigest() != EYE_TEXTURE_SHA256:
        raise RuntimeError("Tracked eye texture copy failed its CC0 source hash")

    base_body = HumanService.create_human()
    base_armature = HumanService.add_builtin_rig(base_body, "game_engine")
    base_eyes = HumanService.add_mhclo_asset(
        str(eye_mhclo), base_body, asset_type="Eyes", subdiv_levels=0,
        material_type="MAKESKIN", set_up_rigging=True,
        interpolate_weights=True, import_subrig=False, import_weights=False,
    )
    FaceService.load_targets(
        base_body, load_microsoft_visemes=False, load_meta_visemes=False,
        load_arkit_faceunits=True,
    )
    FaceService.interpolate_targets(base_body)
    ExportService.bake_modifiers_remove_helpers(
        base_body, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True,
    )
    builder.clean_body_vertex_groups(base_body, base_armature)
    clean_vertex_groups(base_eyes, base_armature)
    if [bone.name for bone in base_armature.data.bones] != builder.BONE_NAMES:
        raise RuntimeError("Pinned MPFB game_engine bone hierarchy drifted")
    retain_exact_shape_keys(base_body, MORPH_TARGETS)
    retain_exact_shape_keys(base_eyes, EYE_GAZE_TARGETS)

    skin_material = builder.make_material(
        "M_SHI_Character_SkinClay", (0.30, 0.215, 0.16, 1.0), 0.78,
    )
    base_body.data.materials.clear()
    base_body.data.materials.append(skin_material)
    if not base_eyes.data.materials:
        raise RuntimeError("CC0 eyes did not create their reviewed brown material")
    eye_material = base_eyes.data.materials[0]
    eye_material.name = EYE_MATERIAL_NAME
    texture_nodes = [node for node in eye_material.node_tree.nodes if node.type == "TEX_IMAGE"]
    for node in texture_nodes:
        if node.image:
            node.image.filepath = str(tracked_eye_texture)
            node.image.name = "T_SHI_Character_EyeBrown_CC0"
    if not texture_nodes:
        raise RuntimeError("CC0 brown eye material did not retain its image texture node")

    characters = [
        make_character(builder, spec, base_body, base_armature, base_eyes, scene.collection)
        for spec in builder.CHARACTERS
    ]
    body_morphs = morph_receipts(base_body)
    eye_morphs = morph_receipts(base_eyes)
    if any(not receipt["movedVertices"] for receipt in body_morphs.values()):
        raise RuntimeError("One or more admitted body face units contains no geometric delta")
    if any(not receipt["movedVertices"] for receipt in eye_morphs.values()):
        raise RuntimeError("One or more admitted eye gaze units contains no geometric delta")
    if max(receipt["maximumDisplacementMetres"] for receipt in body_morphs.values()) > 0.08:
        raise RuntimeError("Body facial displacement exceeds the engineering blockout bound")
    if max(receipt["maximumDisplacementMetres"] for receipt in eye_morphs.values()) > 0.035:
        raise RuntimeError("Eye gaze displacement exceeds the engineering blockout bound")

    character_results = []
    for character in characters:
        bounds = builder.character_bounds(character)
        triangles = sum(builder.triangle_count(obj) for obj in character["meshes"])
        if triangles > 56000 or not 1.55 <= bounds["dimensions"][2] <= 1.83:
            raise RuntimeError(f"Facial character bounds/topology failed for {character['spec']['id']}")
        character_results.append({
            "id": character["spec"]["id"],
            "label": character["spec"]["label"],
            "roleShape": character["spec"]["role"],
            "hairShape": character["spec"]["hair"],
            "triangles": triangles,
            "meshCount": len(character["meshes"]),
            "boundsMetres": bounds,
            "materials": sorted({slot.material.name for obj in character["meshes"]
                                 for slot in obj.material_slots if slot.material}),
            "exports": export_character(builder, character, export_root),
        })

    bpy.data.objects.remove(base_body, do_unlink=True)
    bpy.data.objects.remove(base_eyes, do_unlink=True)
    bpy.data.objects.remove(base_armature, do_unlink=True)
    builder.add_preview_stage(scene, characters, {
        "ground": builder.make_material(
            "DEV_SHI_FacialGround", (0.035, 0.038, 0.04, 1.0), 0.96,
        ),
    })
    set_face_state([characters[0]["body"], characters[0]["eyes"]], {})
    blend_path = rendered_root / f"{ASSET_ID}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)
    if args.skip_render:
        render_names = ("lineup-front", "lineup-oblique", *REVIEW_STATES.keys())
        renders = {
            name: file_receipt(
                rendered_root / f"{ASSET_ID}-{name}.png", f"retained {name} review",
            )
            for name in render_names
        }
    else:
        renders = render_lineup(scene, rendered_root)
        renders.update(render_face_states(scene, characters, rendered_root))

    metrics = portable_paths({
        "assetId": ASSET_ID,
        "sourceCharacterAsset": CHARACTER_SOURCE_ID,
        "status": "five-identity facial-performance engineering blockout; not final acting",
        "disclosure": DISCLOSURE,
        "generator": "deterministic SHI Blender Python with pinned MPFB CC0 body/rig, Faceunits 01 and low-poly brown eyes",
        "blenderVersion": bpy.app.version_string,
        "mpfbVersion": "2.0.17",
        "mpfbCommit": "80919fa4682335c41847f761a4d79dcad4124732",
        "sharedSkeleton": RIG_NAME,
        "boneCount": len(builder.BONE_NAMES),
        "boneNames": builder.BONE_NAMES,
        "morphTargetCount": len(MORPH_TARGETS),
        "morphTargets": list(MORPH_TARGETS),
        "eyeGazeTargets": list(EYE_GAZE_TARGETS),
        "bodyMorphReceipts": body_morphs,
        "eyeMorphReceipts": eye_morphs,
        "reviewStates": REVIEW_STATES,
        "neuralGeneration": False,
        "voiceOrTranscriptInput": False,
        "sourceHashes": actual_source_hashes,
        "sourceUrls": {
            "faceunits": "https://static.makehumancommunity.org/assets/assetpacks/faceunits01.html",
            "systemAssets": "https://static.makehumancommunity.org/asset_packs/makehuman_system_assets.html",
            "license": "https://static.makehumancommunity.org/about/license.html",
        },
        "trackedEyeTexture": file_receipt(
            tracked_eye_texture, "CC0 MakeHuman brown-eye texture used by the facial blockout",
        ),
        "characters": character_results,
        "source": file_receipt(blend_path, "editable facial-performance engineering source"),
        "renders": renders,
        "limitations": [
            "silent intent cadence only; no lip sync, phoneme timing, transcript or voice authority",
            "generic shared non-portrait face; no historical likeness claim",
            "medium development framing only; no final close dialogue or marketing approval",
            "no teeth, tongue, final inner-mouth, eyebrow, lash, skin, cloth, hair or wet-material approval",
        ],
    }, repository_root)
    metrics_path = source_root / f"{ASSET_ID}.metrics.json"
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "assetId": ASSET_ID,
        "characters": [(row["id"], row["triangles"], row["meshCount"])
                       for row in character_results],
        "morphTargets": len(MORPH_TARGETS),
        "metrics": str(metrics_path),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
