"""Private collar/belt surface attachment on the qualified cloth bake.

Fixed barycentric anchors, not per-frame nearest-point projection. Source cloth,
body and performance are unchanged. Shared cache is linked, never copied/freed.
No final costume, historical accuracy or cinematic acceptance is implied.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
import math


def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def surface(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh(); mesh.calc_loop_triangles()
    points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
    triangles = [tuple(triangle.vertices) for triangle in mesh.loop_triangles]
    evaluated.to_mesh_clear()
    return points, triangles


def position(anchor, points):
    a, b, c = [points[i] for i in anchor["triangle"]]
    normal = (b - a).cross(c - a).normalized()
    return a * anchor["weights"][0] + b * anchor["weights"][1] + c * anchor["weights"][2] + normal * anchor["offset"]


def anchor(hit, triangle, points, offset):
    a, b, c = [points[i] for i in triangle]
    # Python scalar arithmetic avoids losing barycentric precision on narrow
    # triangles translated metres away from the scene origin. Only bounded
    # BVH hit roundoff may clamp to an edge; a wrong triangle still fails.
    v0 = [float(b[i]) - float(a[i]) for i in range(3)]
    v1 = [float(c[i]) - float(a[i]) for i in range(3)]
    v2 = [float(hit[i]) - float(a[i]) for i in range(3)]
    dot = lambda x, y: sum(i * j for i, j in zip(x, y))
    d00, d01, d11, d20, d21 = dot(v0, v0), dot(v0, v1), dot(v1, v1), dot(v2, v0), dot(v2, v1)
    denominator = d00 * d11 - d01 * d01
    assert denominator > 1e-16, "Degenerate anchor triangle"
    v = (d11 * d20 - d01 * d21) / denominator
    w = (d00 * d21 - d01 * d20) / denominator
    raw = [1 - v - w, v, w]
    assert min(raw) > -1e-4 and max(raw) < 1.0001, f"Hit outside anchor triangle: {raw}"
    clamped = [max(0, min(1, weight)) for weight in raw]
    total = sum(clamped); weights = [weight / total for weight in clamped]
    return {"triangle": list(triangle), "weights": weights, "offset": offset,
            "maximumBarycentricRoundoff": max(abs(x - y) for x, y in zip(raw, weights))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source = args.study.resolve(); output = args.output.resolve()
    receipt = json.loads((source / "receipt.json").read_text())
    verification = json.loads((source / "verification.json").read_text())
    assert verification["status"] == "sampled-connected-garment-checks-passed"
    assert sha(source / "garment-study.blend") == receipt["blendSHA256"] == verification["blendSHA256"]
    assert sha(Path(__file__).with_name("test-council-connected-garment.py")) == verification["checkerSHA256"]
    for cache in receipt["clothSimulation"]["cache"]:
        assert sha(source / cache["file"]) == cache["sha256"]
    output.mkdir(parents=True, exist_ok=False)
    cache_folder = source / "blendcache_garment-study"
    assert cache_folder.is_dir()
    (output / cache_folder.name).symlink_to(cache_folder, target_is_directory=True)
    bpy.ops.wm.open_mainfile(filepath=str(source / "garment-study.blend"))
    cloth = bpy.data.objects["SKM_SHI_keeper_ConnectedGarmentStudy"]
    scene = bpy.context.scene; offset = receipt["clothSimulation"].get("visibleFrameOffset", 0)
    scene.frame_set(1 + offset); bpy.context.view_layer.update()
    points, triangles = surface(cloth)
    # The cache preserves recipe vertex order: torso, transition rings, sleeves.
    # Restrict attachment by authored ownership, never by whichever surface is
    # closest to the seed in the resting pose (a lowered sleeve can be closer).
    assert sha(Path(__file__).with_name("build-council-pattern-garment-study.py")) == receipt["independentPattern"]["authorSHA256"]
    assert sha(Path(__file__).with_name("build-council-gusset-garment-study.py")) == receipt["gussetTransition"]["authorSHA256"]
    assert len(points) == len(cloth.data.vertices) == receipt["vertices"]
    torso_count = len(points) - receipt["independentPattern"]["retainedDistalSleeveVertices"] - 2 * receipt["gussetTransition"]["ringsPerArm"] * 24
    assert torso_count == 244, "Unsupported torso topology; requalify ownership"
    torso_triangles = [triangle for triangle in triangles if max(triangle) < torso_count]
    assert len(torso_triangles) == 400, "Torso panel inventory changed"
    tree = BVHTree.FromPolygons(points, torso_triangles, all_triangles=True)
    world = cloth.matrix_world.copy(); inverse = world.inverted()
    records = []

    def make(name, seeds, faces, outward_offset):
        old = bpy.data.objects["SKM_SHI_keeper_" + name]
        anchors = []
        for origin, direction in seeds:
            hit, normal, index, distance = tree.ray_cast(world @ origin, (world.to_3x3() @ direction).normalized(), 2)
            assert hit is not None, f"Trim seed misses cloth: {name}/{len(anchors)}"
            anchors.append(anchor(hit, torso_triangles[index], points, outward_offset))
        mesh = bpy.data.meshes.new("SHI_SurfaceAttached_" + name)
        mesh.from_pydata([inverse @ position(a, points) for a in anchors], [], faces); mesh.update()
        for material in old.data.materials: mesh.materials.append(material)
        obj = bpy.data.objects.new("SKM_SHI_keeper_Attached_" + name, mesh)
        scene.collection.objects.link(obj)
        obj.parent = cloth.parent; obj.matrix_parent_inverse = Matrix.Identity(4); obj.matrix_world = world
        obj["shi_status"] = "private-surface-attachment-study-not-admitted"
        for polygon in mesh.polygons: polygon.use_smooth = True
        obj.shape_key_add(name="Basis")
        old.hide_render = True
        records.append({"object": obj, "sourceName": old.name, "anchors": anchors})

    # Original broad crossed-collar motif, reconstructed as conforming bands.
    # Asymmetry is an art-direction experiment, not a claim about209BCE dress.
    for name, start, end, layer in (("CrossBinding_L", (.06, 1.412), (-.10, 1.205), .003),
                                   ("CrossBinding_R", (-.06, 1.412), (.125, 1.12), .005)):
        seeds, faces = [], []
        tangent = Vector((end[0] - start[0], end[1] - start[1])).normalized()
        perpendicular = Vector((-tangent.y, tangent.x)) * .012
        for row in range(25):
            t = row / 24
            center = Vector(start).lerp(Vector(end), t)
            for sign in (-1, 1):
                x, z = center + perpendicular * sign
                seeds.append((Vector((x, -1, z)), Vector((0, 1, 0))))
            if row: faces.append(((row - 1) * 2, (row - 1) * 2 + 1, row * 2 + 1, row * 2))
        make(name, seeds, faces, layer)
    seeds, faces = [], []
    for z in (.925, .955):
        for column in range(64):
            angle = 2 * math.pi * column / 64
            radial = Vector((math.cos(angle), math.sin(angle), 0))
            seeds.append((Vector((0, -.01, z)) + radial * .7, -radial))
    for column in range(64):
        following = (column + 1) % 64
        faces.append((column, following, following + 64, column + 64))
    make("WaistBinding", seeds, faces, .004)

    for visible in range(1, 122):
        simulation = visible + offset
        scene.frame_set(simulation); bpy.context.view_layer.update()
        posed, _ = surface(cloth)
        for record in records:
            obj = record["object"]
            key = obj.shape_key_add(name=f"Visible_{visible:03d}")
            for vertex, a in zip(key.data, record["anchors"]): vertex.co = inverse @ position(a, posed)
            for frame, value in ((simulation - 1, 0), (simulation, 1), (simulation + 1, 0)):
                key.value = value; key.keyframe_insert(data_path="value", frame=frame)
    for record in records:
        for curve in record["object"].data.shape_keys.animation_data.action.fcurves:
            for key in curve.keyframe_points: key.interpolation = "LINEAR"
    scene.frame_set(1 + offset)
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "garment-study.blend"))
    rendered = []
    for visible in (1, 46, 61, 121):
        scene.frame_set(visible + offset); path = output / f"frame-{visible:03d}.png"
        scene.render.filepath = str(path); bpy.ops.render.render(write_still=True)
        rendered.append({"frame": visible, "file": path.name, "sha256": sha(path)})
    result = {"status": "private-attached-trim-candidate-not-admitted", "authorSHA256": sha(Path(__file__)),
              "sourceStudy": str(source), "sourceBlendSHA256": receipt["blendSHA256"],
              "sourceVerificationSHA256": sha(source / "verification.json"),
              "blendSHA256": sha(output / "garment-study.blend"), "visibleFrameOffset": offset,
              "sharedCache": receipt["clothSimulation"]["cache"], "rendered": rendered,
              "attachmentRegion": {"name": "authored-torso-only", "vertices": torso_count, "triangles": len(torso_triangles)},
              "trims": [{"object": record["object"].name, "replaces": record["sourceName"], "anchors": record["anchors"]} for record in records],
              "boundary": "Fixed cloth-surface anchors for collar and belt only. Satchel strap, period costume, materials, continuous motion and human approval remain open. No game export."}
    (output / "receipt.json").write_text(json.dumps(result, indent=2) + "\n")
    assert sha(source / "garment-study.blend") == receipt["blendSHA256"]
    print("SHI_ATTACHED_TRIM", json.dumps({"trims": len(records), "blendSHA256": result["blendSHA256"]}))


if __name__ == "__main__": main()
