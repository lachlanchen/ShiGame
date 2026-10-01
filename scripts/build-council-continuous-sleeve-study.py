"""Editable, private sleeve deformation study on the existing keeper carrier.

Blender 4.5 --background --disable-autoexec --threads 2 <accepted blend>
--python this-file -- --output <new-directory> [--movie]
Never overwrites or exports accepted assets. This is cloth geometry, not cloth
simulation, final costume, authenticated dress, or an admitted performance.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_author():
    path = Path(__file__).with_name("render-council-palm-gesture-study.py")
    spec = importlib.util.spec_from_file_location("shi_palm_author", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def smoother(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def sleeve(rig, side):
    upper = rig.data.bones["upperarm_" + side]
    lower = rig.data.bones["lowerarm_" + side]
    a, b, c = upper.head_local.copy(), lower.head_local.copy(), lower.tail_local.copy()
    ulen, llen = (b - a).length, (c - b).length
    total = ulen + llen * .94
    upper_axis, lower_axis = (b - a).normalized(), (c - b).normalized()
    vertices, faces, weights = [], [], []
    rings, segments = 25, 24
    for row in range(rings):
        distance = total * row / (rings - 1)
        # Round the centerline as well as the frame. Rotating ring normals on
        # a sharp centerline alone creates nearly coincident inner elbow rows.
        rounding = .08
        start, end = b - upper_axis * rounding, b + lower_axis * rounding
        t = (distance - ulen + rounding) / (2 * rounding)
        if t < 0:
            center, tangent = a + upper_axis * distance, upper_axis
        elif t > 1:
            center, tangent = b + lower_axis * (distance - ulen), lower_axis
        else:
            center = start * (1 - t) ** 2 + b * (2 * t * (1 - t)) + end * t ** 2
            tangent = upper_axis.lerp(lower_axis, t).normalized()
        blend = smoother(t)
        radial = Vector((0, 1, 0)).cross(tangent).normalized()
        other = tangent.cross(radial).normalized()
        radius = .0784 + (.0469 - .0784) * distance / total
        for column in range(segments):
            angle = 2 * math.pi * column / segments
            vertices.append(tuple(center + radius * (radial * math.cos(angle) + other * math.sin(angle))))
            weights.append((1 - blend, blend))
        if row:
            for column in range(segments):
                first = (row - 1) * segments + column
                next_column = (column + 1) % segments
                faces.append((first, (row - 1) * segments + next_column, row * segments + next_column, row * segments + column))
    mesh = bpy.data.meshes.new("SHI_ContinuousSleeve_" + side)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new("SKM_SHI_keeper_ContinuousSleeve_" + side.upper(), mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = rig
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_world = rig.matrix_world.copy()
    original = bpy.data.objects["SKM_SHI_keeper_UpperSleeve_" + side.upper()]
    mesh.materials.append(original.data.materials[0])
    for index, name in enumerate((upper.name, lower.name)):
        group = obj.vertex_groups.new(name=name)
        for vertex, weight in enumerate(weights):
            if weight[index] > 1e-8:
                group.add([vertex], weight[index], "REPLACE")
    modifier = obj.modifiers.new("SleeveSkin", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = True
    obj["shi_status"] = "private-continuous-sleeve-deformation-study"
    return obj


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--movie", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source = Path(bpy.data.filepath)
    author = load_author()
    review = author.pose.review
    assert bpy.app.version[:2] == (4, 5) and digest(source) == review.SOURCE_SHA
    scene = bpy.context.scene
    rig = bpy.data.objects[review.RIG]
    assert rig.animation_data.action.name == review.ACTION
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    action = author.author(rig, scene)
    sleeves = [sleeve(rig, side) for side in ("l", "r")]
    old_sleeves = [bpy.data.objects[f"SKM_SHI_keeper_{part}Sleeve_{side}"] for part in ("Upper", "Lower") for side in ("L", "R")]
    visible = {o for o in scene.objects if o.type == "MESH" and review.belongs(o, rig)} - set(old_sleeves)
    for obj in scene.objects:
        if obj.type in {"MESH", "CURVE", "SURFACE", "META", "FONT", "VOLUME"}:
            obj.hide_render = obj not in visible
    camera_data = bpy.data.cameras.new("SHI_SleeveReview")
    camera = bpy.data.objects.new(camera_data.name, camera_data)
    scene.collection.objects.link(camera)
    target = rig.matrix_world @ Vector((0, -.02, 1.05))
    camera.location = target + Vector((.5, -3, .08))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 1.70
    scene.camera = camera
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.background_type = "VIEWPORT"
    scene.display.shading.background_color = (.035, .045, .04)
    scene.display.shading.show_cavity = True
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.render.image_settings.file_format = "PNG"
    scene.render.use_compositing = scene.render.use_sequencer = False
    scene.frame_start, scene.frame_end = 1, 120
    scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "sleeve-study.blend"))
    rendered = []
    for frame in range(1, 121) if args.movie else (1, 46, 61, 121):
        scene.frame_set(frame)
        path = output / f"frame-{frame:03d}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        rendered.append({"frame": frame, "file": path.name, "sha256": digest(path)})
    assert digest(source) == review.SOURCE_SHA
    receipt = {"status": "private-cloth-deformation-study-not-shipping", "sourceSHA256": digest(source),
               "builderSHA256": digest(Path(__file__)), "palmAuthorSHA256": digest(Path(author.__file__)),
               "poseAuthorSHA256": digest(Path(author.pose.__file__)), "blender": bpy.app.version_string,
               "blendSHA256": digest(output / "sleeve-study.blend"), "action": action.name,
               "sleeves": [{"name": o.name, "vertices": len(o.data.vertices), "quads": len(o.data.polygons)} for o in sleeves],
               "rendered": rendered, "fps": 30, "movie": args.movie,
               "boundary": "Editable smooth skinning, not cloth simulation or final costume; existing keeper casting retained, not Chen Sheng likeness. No runtime export or narrative change."}
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
