"""Private independent torso pattern with dropped armholes; not admitted cloth.

Run the existing source blend with --python-exit-code 1 and --output NEW_DIR.
No body-surface sampling, offsets, hidden body or changed motion. Distal sleeve
rows are retained exactly. Rest proportions are engineering choices, not claims
about Qin-period dress. This is a skinning study, not a fabric simulation.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

import bmesh
import bpy
from mathutils import Matrix


path = Path(__file__).with_name("build-council-connected-garment-study.py")
spec = importlib.util.spec_from_file_location("shi_pattern_parent", path)
parent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parent)

# (height, lateral half-width, front/back half-depth, depth centre).
# Piecewise rings describe a loose torso silhouette without copying anatomy.
PROFILE = [(1.435, .084, .080, -.014), (1.400, .235, .120, -.014),
           (1.280, .260, .180, -.018), (1.210, .255, .180, -.018),
           (1.140, .235, .170, -.014), (1.060, .225, .160, -.010),
           (.960, .225, .150, -.010), (.840, .235, .160, -.010)]
SEGMENTS = 32


def pattern(recipe, rig):
    vertices, weights, faces = [], [], []
    for row, (z, rx, ry, cy) in enumerate(PROFILE):
        for column in range(SEGMENTS):
            angle = 2 * math.pi * column / SEGMENTS
            x = rx * math.cos(angle)
            vertices.append((x, cy + ry * math.sin(angle), z))
            # Deliberate torso/arm influence, independent of the body's dense
            # anatomical weight field. Smooth across the whole shoulder panel.
            side = "l" if x >= 0 else "r"
            lateral = abs(math.cos(angle)) ** 4
            arm = [0, .45, .45, .30, .10, 0, 0, 0][row] * lateral
            clavicle = [.15, .20, .10, 0, 0, 0, 0, 0][row] * lateral
            weights.append({"spine_03": 1 - arm - clavicle,
                            "upperarm_" + side: arm, "clavicle_" + side: clavicle})
    assert {name for assignment in weights for name in assignment} <= set(rig.data.bones.keys()), "Unknown pattern skinning bone"
    # Two open side panels spanning shoulder to underarm. Their lower edge is
    # deliberately below the anatomical armpit, providing a gusset-like region
    # when joined to the sleeve rather than a tight body-shaped armhole.
    holes = {"l": {30, 31, 0, 1}, "r": {14, 15, 16, 17}}
    for row in range(len(PROFILE) - 1):
        for column in range(SEGMENTS):
            if row in (1, 2, 3) and any(column in h for h in holes.values()):
                continue
            following = (column + 1) % SEGMENTS
            faces.append((row * SEGMENTS + column, row * SEGMENTS + following,
                          (row + 1) * SEGMENTS + following, (row + 1) * SEGMENTS + column))
    # Side-panel interiors do not belong to the surface. Remove them instead
    # of leaving isolated vertices that could falsely inflate topology checks.
    used = sorted({v for f in faces for v in f})
    remap = {old: new for new, old in enumerate(used)}
    vertices = [vertices[i] for i in used]
    weights = [weights[i] for i in used]
    faces = [tuple(remap[v] for v in f) for f in faces]
    boundary_count = parent.Counter(tuple(sorted(e)) for f in faces
                                    for e in zip(f, f[1:] + f[:1]))
    armholes = {}
    for side, sign in (("l", 1), ("r", -1)):
        edges = [(a, b) for (a, b), count in boundary_count.items() if count == 1
                 and all(sign * vertices[i][0] > .15 and 1.13 < vertices[i][2] < 1.41 for i in (a, b))]
        armholes[side] = parent.ordered_loop(edges)
    joins = []
    for side in ("l", "r"):
        sleeve = recipe.sleeve(rig, side)
        start = len(vertices)
        for vertex in sleeve.data.vertices[8 * 24:]:
            vertices.append(tuple(vertex.co))
            weights.append({sleeve.vertex_groups[g.group].name: g.weight for g in vertex.groups})
        for polygon in sleeve.data.polygons:
            if min(polygon.vertices) >= 8 * 24:
                faces.append(tuple(start + v - 8 * 24 for v in polygon.vertices))
        count = parent.connect_loops(vertices, faces, armholes[side], list(range(start, start + 24)))
        joins.append({"side": side, "armholeVertices": count, "retainedSleeveVertices": 408})
        bpy.data.objects.remove(sleeve, do_unlink=True)
    mesh = bpy.data.meshes.new("SHI_IndependentTorsoPatternStudy")
    mesh.from_pydata(vertices, [], faces); mesh.update()
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new("SKM_SHI_keeper_ConnectedGarmentStudy", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = rig; obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_world = rig.matrix_world.copy()
    mesh.materials.append(bpy.data.objects["SKM_SHI_keeper_UpperLayer"].data.materials[0])
    for index, assignment in enumerate(weights):
        total = sum(assignment.values()); assert total > 0
        for name, weight in assignment.items():
            if weight > 1e-8:
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([index], weight / total, "REPLACE")
    modifier = obj.modifiers.new("GarmentSkin", "ARMATURE")
    modifier.object = rig; modifier.use_deform_preserve_volume = True
    for polygon in mesh.polygons: polygon.use_smooth = True
    obj["shi_status"] = "private-independent-cloth-pattern-not-admitted"
    return obj, joins


def main():
    parent.garment = pattern
    parent.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    receipt_path = output / "receipt.json"
    receipt = json.loads(receipt_path.read_text())
    receipt["boundary"] = "Independent torso pattern and zipper sleeve seams; retained distal sleeves. Not historical cloth, exact collision acceptance, simulation or runtime export. Body and gesture unchanged; independent checks required."
    receipt["independentPattern"] = {
        "authorSHA256": parent.load_recipe().digest(Path(__file__)),
        "profile": PROFILE, "segments": SEGMENTS,
        "method": "Independent elliptical torso panels, dropped side armholes, zipper sleeve join; no copied body surface",
        "retainedDistalSleeveVertices": 816,
        "boundary": "Engineering silhouette only, not historical costume, fabric drape or visual acceptance"}
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__": main()
