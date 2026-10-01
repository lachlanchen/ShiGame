"""Private curved armhole transition experiment; never an admitted costume.

Retains body/motion and exact distal sleeve coordinates/influences. Rebuilds
only the torso and join, adding three eased rings per arm. No collision masking.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Vector


path = Path(__file__).with_name("build-council-pattern-garment-study.py")
spec = importlib.util.spec_from_file_location("shi_gusset_parent", path)
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)
original = recipe.pattern


def gusset(sleeves, rig):
    obj, joins = original(sleeves, rig)
    old = obj.data
    shell_count = len(old.vertices) - 816
    points = [v.co.copy() for v in old.vertices]
    weights = [{obj.vertex_groups[g.group].name: g.weight for g in v.groups} for v in old.vertices]
    # Pull the lower side panel away from the arm's swept volume. The waist is
    # still independent cloth geometry, not a body-normal displacement.
    for point in points[:shell_count]:
        falloff = max(0, 1 - abs(point.z - 1.14) / .14)
        lateral = min(1, abs(point.x) / .235) ** 4
        point.x *= 1 - .30 * falloff * lateral
    faces = [tuple(p.vertices) for p in old.polygons
             if max(p.vertices) < shell_count or min(p.vertices) >= shell_count]
    additions, addition_weights = [], []
    for side_index, side in enumerate(("l", "r")):
        start = shell_count + side_index * 408
        cuff = list(range(start, start + 24))
        # Existing join faces identify their complete torso boundary without
        # relying on a coordinate threshold or changing retained sleeve order.
        seam_faces = [tuple(p.vertices) for p in old.polygons
                      if min(p.vertices) < shell_count and any(start <= v < start + 24 for v in p.vertices)]
        edges = recipe.parent.Counter(tuple(sorted(e)) for f in seam_faces
                                      for e in zip(f, f[1:] + f[:1])
                                      if max(e) < shell_count)
        boundary = recipe.parent.ordered_loop([e for e, count in edges.items() if count == 1])
        options = []
        for direction in (boundary, list(reversed(boundary))):
            offset = min(range(len(direction)), key=lambda i: (points[direction[i]] - points[cuff[0]]).length)
            loop = direction[offset:] + direction[:offset]
            cost = sum((points[loop[round(i * len(loop) / 24) % len(loop)]] - points[cuff[i]]).length_squared for i in range(24))
            options.append((cost, loop))
        loop = min(options, key=lambda item: item[0])[1]
        samples, sample_weights = [], []
        for column in range(24):
            index = column * len(loop) / 24
            low = math.floor(index); fraction = index - low
            a, b = loop[low], loop[(low + 1) % len(loop)]
            samples.append(points[a].lerp(points[b], fraction))
            sample_weights.append({name: weights[a].get(name, 0) * (1 - fraction) + weights[b].get(name, 0) * fraction
                                   for name in set(weights[a]) | set(weights[b])})
        hole_center = sum(samples, Vector()) / 24
        cuff_center = sum((points[i] for i in cuff), Vector()) / 24
        previous = loop
        for t in (.25, .50, .75):
            ring = []
            for column in range(24):
                point = samples[column].lerp(points[cuff[column]], t)
                radial = point - hole_center.lerp(cuff_center, t)
                assert radial.length > 1e-6
                point += radial.normalized() * (.025 * math.sin(math.pi * t))
                ring.append(len(points) + len(additions))
                additions.append(point)
                base, end = sample_weights[column], weights[cuff[column]]
                addition_weights.append({name: base.get(name, 0) * (1 - t) + end.get(name, 0) * t
                                         for name in set(base) | set(end)})
            recipe.parent.connect_loops(points + additions, faces, previous, ring)
            previous = ring
        recipe.parent.connect_loops(points + additions, faces, previous, cuff)
        joins[side_index]["transitionRings"] = 3
    # Put new transition data before the two established distal sleeves. The
    # independent checker can continue checking their exact final816 vertices.
    order = list(range(shell_count)) + list(range(len(points), len(points) + len(additions))) + list(range(shell_count, len(points)))
    remap = {old_index: new for new, old_index in enumerate(order)}
    all_points, all_weights = points + additions, weights + addition_weights
    mesh = bpy.data.meshes.new("SHI_GussetTransitionStudy")
    mesh.from_pydata([all_points[i] for i in order], [], [tuple(remap[i] for i in f) for f in faces]); mesh.update()
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)); bm.to_mesh(mesh); bm.free()
    for material in old.materials: mesh.materials.append(material)
    obj.data = mesh
    obj.vertex_groups.clear()
    for new, old_index in enumerate(order):
        assignment = all_weights[old_index]; total = sum(assignment.values())
        assert total > 0 and set(assignment) <= set(rig.data.bones.keys())
        for name, weight in assignment.items():
            if weight > 1e-8:
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([new], weight / total, "REPLACE")
    for polygon in mesh.polygons: polygon.use_smooth = True
    bpy.data.meshes.remove(old)
    return obj, joins


def main():
    recipe.pattern = gusset
    recipe.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    path = output / "receipt.json"
    receipt = json.loads(path.read_text())
    receipt["gussetTransition"] = {"authorSHA256": recipe.parent.load_recipe().digest(Path(__file__)),
                                   "ringsPerArm": 3, "maximumRadialEaseMetres": .025,
                                   "maximumLowerPanelInwardFactor": .30,
                                   "method": "Independent pattern, inward underarm panel and eased interpolated transition rings; unchanged distal sleeves"}
    receipt["boundary"] = "Private gusset/armhole skinning experiment, not simulated or historically approved cloth. Independent collision and visual review required; no runtime export."
    path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__": main()
