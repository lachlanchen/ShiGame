"""Render the accepted council carrier as a private four-second motion study.

Run verified Blender 4.5.12 with --disable-autoexec and the accepted performance
blend. This never saves the source, exports a rig, or admits a shipping asset.
Output must be a new directory. Encode frames externally at 12 fps.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector

SOURCE_SHA = "feb52d4080cdfd0cdfa212fb4ec92a427ba676a6fba84fe74f3ac0f165eab743"
RIG = "SK_SHI_keeper_Rig"
ACTION = "AN_SHI_DazeCouncil_SpeakerMeasured_01"


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def belongs(obj, rig):
    parent = obj.parent
    while parent:
        if parent == rig:
            return True
        parent = parent.parent
    return any(m.type == "ARMATURE" and m.object == rig for m in obj.modifiers)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source = Path(bpy.data.filepath)
    if bpy.app.version[:2] != (4, 5) or digest(source) != SOURCE_SHA:
        raise ValueError("Require verified Blender 4.5 and unchanged accepted source")
    rig = bpy.data.objects[RIG]
    if rig.animation_data.action.name != ACTION:
        raise ValueError("Source must retain the accepted measured-speaker action")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    scene = bpy.context.scene
    meshes = [o for o in scene.objects if o.type == "MESH" and belongs(o, rig)]
    if not meshes:
        raise ValueError("No carrier meshes")
    bounds, samples = [], []
    # Inspect every source frame; the review movie resamples this unchanged action.
    for frame in range(1, 122):
        scene.frame_set(frame)
        graph = bpy.context.evaluated_depsgraph_get()
        evaluated = rig.evaluated_get(graph)
        samples.append({"frame": frame, "landmarks": {
            name: list((evaluated.matrix_world @ evaluated.pose.bones[name].matrix).translation * scene.unit_settings.scale_length)
            for name in ("Root", "foot_l", "foot_r", "hand_l", "hand_r", "head")
        }})
        for mesh in meshes:
            obj = mesh.evaluated_get(graph)
            bounds.extend(obj.matrix_world @ Vector(c) for c in obj.bound_box)
    low = Vector(tuple(min(v[i] for v in bounds) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in bounds) for i in range(3)))
    center = (low + high) / 2
    data = bpy.data.cameras.new("SHI_PrivateMotionReview")
    camera = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(camera)
    data.type = "ORTHO"
    # Blender ortho scale is horizontal; include the complete body at 16:9.
    data.ortho_scale = max(high.z - low.z, high.x - low.x) * 1.2 * 16 / 9
    camera.location = center + Vector((0.4, -1, 0.1)).normalized() * data.ortho_scale * 2
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    for obj in scene.objects:
        if obj.type in {"MESH", "CURVE", "SURFACE", "META", "FONT", "VOLUME"}:
            obj.hide_render = obj not in meshes
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = 640, 360
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.use_compositing = scene.render.use_sequencer = False
    shading = scene.display.shading
    shading.light, shading.color_type = "STUDIO", "MATERIAL"
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.055, 0.055, 0.065)
    shading.show_shadows = False
    shading.show_cavity = True
    frames = []
    for index in range(48):
        frame = 1 + round(index * 30 / 12)
        scene.frame_set(frame)
        path = output / f"frame-{index:03d}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        frames.append({"sourceFrame": frame, "file": path.name, "sha256": digest(path)})
    if digest(source) != SOURCE_SHA:
        raise ValueError("Source bytes changed")
    receipt = {"status": "private-engineering-review-not-shipping", "sourceSha256": SOURCE_SHA,
        "scriptSha256": digest(Path(__file__)), "blender": bpy.app.version_string,
        "rig": RIG, "action": ACTION, "fps": 12, "durationSeconds": 4,
        "frames": frames, "sourceSamples": samples,
        "maximumFootDisplacementMetres": {name: max((Vector(s["landmarks"][name]) - Vector(samples[0]["landmarks"][name])).length for s in samples)
            for name in ("foot_l", "foot_r")},
        "boundary": "Original body blockout, not final acting, clothing, prop contact or historical etiquette. No game choices or saves."}
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
