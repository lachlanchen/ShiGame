"""Private connected torso/armhole study, retaining the existing distal sleeves.

Blender 4.5 --background --disable-autoexec --threads 2 source.blend
--python this-file -- --output NEW_DIRECTORY
This is a skin-weighted collision/continuity carrier, not final historical cloth.
No accepted source, body, rig, gesture or engine export is overwritten.
"""
import argparse
from collections import Counter
import importlib.util
import json
import math
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector


def load_recipe():
    path = Path(__file__).with_name("build-council-continuous-sleeve-study.py")
    spec = importlib.util.spec_from_file_location("shi_connected_garment_recipe", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def ordered_loop(edges):
    neighbours = {}
    for a, b in edges:
        neighbours.setdefault(a, []).append(b)
        neighbours.setdefault(b, []).append(a)
    assert neighbours and all(len(v) == 2 for v in neighbours.values())
    first = min(neighbours)
    result, previous, current = [first], None, first
    while True:
        following = next(v for v in neighbours[current] if v != previous)
        if following == first:
            break
        assert following not in result
        result.append(following)
        previous, current = current, following
    assert len(result) == len(neighbours), "Armhole must be one closed loop"
    return result


def connect_loops(vertices, faces, boundary, cuff):
    # Keep every source boundary vertex. A monotone zipper uses triangles where
    # counts differ, rather than projecting/collapsing a dense hole into 24 points.
    options = []
    for direction in (boundary, list(reversed(boundary))):
        start = min(range(len(direction)), key=lambda i: (Vector(vertices[direction[i]]) - Vector(vertices[cuff[0]])).length)
        loop = direction[start:] + direction[:start]
        cost = sum((Vector(vertices[loop[round(i * len(loop) / len(cuff)) % len(loop)]]) - Vector(vertices[cuff[i]])).length_squared for i in range(len(cuff)))
        options.append((cost, loop))
    loop = min(options, key=lambda item: item[0])[1]
    i = j = 0
    while i < len(loop) or j < len(cuff):
        a, b = loop[i % len(loop)], cuff[j % len(cuff)]
        next_a = (i + 1) / len(loop) if i < len(loop) else math.inf
        next_b = (j + 1) / len(cuff) if j < len(cuff) else math.inf
        if abs(next_a - next_b) < 1e-9:
            faces.append((a, loop[(i + 1) % len(loop)], cuff[(j + 1) % len(cuff)], b))
            i += 1; j += 1
        elif next_a < next_b:
            faces.append((a, loop[(i + 1) % len(loop)], b)); i += 1
        else:
            faces.append((a, cuff[(j + 1) % len(cuff)], b)); j += 1
    return len(loop)


def garment(recipe, rig):
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    bm = bmesh.new()
    bm.from_mesh(body.data)
    deform = bm.verts.layers.deform.verify()
    # A coherent offset shell: no nearest-triangle projection and no body mask.
    bm.normal_update()
    for vertex in bm.verts:
        vertex.co += vertex.normal * .018
    for point, normal in [((0, 0, .84), (0, 0, -1)), ((0, 0, 1.38), (0, 0, 1)),
                          ((.26, 0, 0), (1, 0, 0)), ((-.26, 0, 0), (-1, 0, 0))]:
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                              plane_co=Vector(point), plane_no=Vector(normal),
                              clear_outer=True, clear_inner=False, dist=1e-7)
    bm.verts.ensure_lookup_table(); bm.verts.index_update()
    vertices = [tuple(v.co) for v in bm.verts]
    faces = [tuple(v.index for v in face.verts) for face in bm.faces]
    weights = [{body.vertex_groups[index].name: float(weight) for index, weight in v[deform].items()}
               for v in bm.verts]
    armholes = {}
    for side, x in (("l", .26), ("r", -.26)):
        boundary = [(e.verts[0].index, e.verts[1].index) for e in bm.edges if e.is_boundary
                    and all(abs(v.co.x - x) < 1e-6 for v in e.verts)]
        armholes[side] = ordered_loop(boundary)
    bm.free()
    retained = []
    for side in ("l", "r"):
        sleeve = recipe.sleeve(rig, side)
        start = len(vertices)
        # Rows 8..24 retain exactly the successful elbow/cuff geometry and weights.
        for vertex in sleeve.data.vertices[8 * 24:]:
            vertices.append(tuple(vertex.co))
            weights.append({sleeve.vertex_groups[g.group].name: g.weight for g in vertex.groups})
        for polygon in sleeve.data.polygons:
            if min(polygon.vertices) >= 8 * 24:
                faces.append(tuple(start + v - 8 * 24 for v in polygon.vertices))
        hole_count = connect_loops(vertices, faces, armholes[side], list(range(start, start + 24)))
        retained.append({"side": side, "armholeVertices": hole_count, "retainedSleeveVertices": 17 * 24})
        bpy.data.objects.remove(sleeve, do_unlink=True)
    mesh = bpy.data.meshes.new("SHI_ConnectedTorsoSleevesStudy")
    mesh.from_pydata(vertices, [], faces); mesh.update()
    # Consistent normals on the assembled connected pattern, not hidden skin.
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new("SKM_SHI_keeper_ConnectedGarmentStudy", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = rig; obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_world = rig.matrix_world.copy()
    mesh.materials.append(bpy.data.objects["SKM_SHI_keeper_UpperLayer"].data.materials[0])
    for i, assignment in enumerate(weights):
        total = sum(assignment.values()); assert total > 0
        for name, weight in assignment.items():
            if weight > 1e-8:
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([i], weight / total, "REPLACE")
    modifier = obj.modifiers.new("GarmentSkin", "ARMATURE")
    modifier.object = rig; modifier.use_deform_preserve_volume = True
    for polygon in mesh.polygons: polygon.use_smooth = True
    obj["shi_status"] = "private-connected-shoulder-carrier-not-final-cloth"
    return obj, retained


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    recipe = load_recipe(); author = recipe.load_author(); review = author.pose.review
    source = Path(bpy.data.filepath)
    assert recipe.digest(source) == review.SOURCE_SHA
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    scene = bpy.context.scene; rig = bpy.data.objects[review.RIG]
    author.author(rig, scene)
    obj, retained = garment(recipe, rig)
    hidden = {"SKM_SHI_keeper_UpperLayer"} | {
        f"SKM_SHI_keeper_{part}Sleeve_{side}" for part in ("Upper", "Lower") for side in ("L", "R")}
    for item in scene.objects:
        if item.type == "MESH": item.hide_render = not review.belongs(item, rig) or item.name in hidden
    camera_data = bpy.data.cameras.new("SHI_ConnectedGarmentReview")
    camera = bpy.data.objects.new(camera_data.name, camera_data); scene.collection.objects.link(camera)
    target = rig.matrix_world @ Vector((0, -.02, 1.15))
    camera.location = target + Vector((.5, -3, .08))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"; camera_data.ortho_scale = 1.85; scene.camera = camera
    scene.render.engine = "BLENDER_WORKBENCH"; scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"; scene.display.shading.show_cavity = True
    scene.display.shading.background_type = "VIEWPORT"; scene.display.shading.background_color = (.035, .045, .04)
    scene.render.resolution_x = 1280; scene.render.resolution_y = 720; scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"; scene.render.use_compositing = scene.render.use_sequencer = False
    scene.frame_set(1); bpy.ops.wm.save_as_mainfile(filepath=str(output / "garment-study.blend"))
    rendered = []
    for frame in (1, 46, 61, 121):
        scene.frame_set(frame); image = output / f"frame-{frame:03d}.png"
        scene.render.filepath = str(image); bpy.ops.render.render(write_still=True)
        rendered.append({"frame": frame, "file": image.name, "sha256": recipe.digest(image)})
    assert recipe.digest(source) == review.SOURCE_SHA
    receipt = {"status": "private-connected-garment-candidate-not-admitted", "sourceSHA256": review.SOURCE_SHA,
               "builderSHA256": recipe.digest(Path(__file__)), "blendSHA256": recipe.digest(output / "garment-study.blend"),
               "vertices": len(obj.data.vertices), "faces": len(obj.data.polygons), "joins": retained, "rendered": rendered,
               "boundary": "Coherent offset body-shell carrier with zipper armhole seams; retained distal sleeves. Not historical cloth, exact collision acceptance, simulation or runtime export. Body and gesture unchanged by construction; independent checks required."}
    (output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print("SHI_CONNECTED_GARMENT", json.dumps(receipt))


if __name__ == "__main__": main()
