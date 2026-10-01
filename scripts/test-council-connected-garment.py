"""Independent fail-closed evaluation of a saved connected garment candidate.

Topology/weights/unchanged carrier plus vertex and face-center collision samples
over all 121 gesture frames. Not exact triangle/self collision or art approval.
"""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def topology(mesh):
    edges = Counter(tuple(sorted(e)) for face in mesh.polygons for e in face.edge_keys)
    assert set(edges.values()) <= {1, 2}, "Nonmanifold garment edges"
    neighbours = {v.index: set() for v in mesh.vertices}
    boundary = {}
    for (a, b), count in edges.items():
        neighbours[a].add(b); neighbours[b].add(a)
        if count == 1:
            boundary.setdefault(a, set()).add(b); boundary.setdefault(b, set()).add(a)
    assert all(len(n) == 2 for n in boundary.values()), "Broken boundary loop"
    seen, stack = set(), [0]
    while stack:
        v = stack.pop()
        if v not in seen: seen.add(v); stack.extend(neighbours[v] - seen)
    assert len(seen) == len(mesh.vertices), "Garment must be one connected surface"
    pending, loops = set(boundary), []
    while pending:
        component, stack = set(), [min(pending)]
        while stack:
            v = stack.pop()
            if v not in component: component.add(v); stack.extend(boundary[v] - component)
        pending -= component; loops.append(len(component))
    assert len(loops) == 4, "Only neck, waist and two cuffs may remain open"
    assert len(mesh.vertices) - len(edges) + len(mesh.polygons) == -2
    return list(edges), loops


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", required=True, type=Path)
    parser.add_argument("--report", type=Path, help="Fresh report path; never overwrite prior evidence")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    output = args.study.resolve(); report_path = args.report.resolve() if args.report else output / "verification.json"
    assert not report_path.exists(), "Never replace earlier verification evidence"
    receipt = json.loads((output / "receipt.json").read_text())
    source = Path(__file__).resolve().parents[1] / "assets/3d/rendered/shi-daze-council-performance-v1.blend"
    assert sha(source) == receipt["sourceSHA256"] == "feb52d4080cdfd0cdfa212fb4ec92a427ba676a6fba84fe74f3ac0f165eab743"
    assert sha(output / "garment-study.blend") == receipt["blendSHA256"]
    assert sha(Path(__file__).with_name("build-council-connected-garment-study.py")) == receipt["builderSHA256"]
    if receipt.get("activeRestShapeFit"):
        assert sha(Path(__file__).with_name("build-council-morphed-garment-study.py")) == receipt["activeRestShapeFit"]["authorSHA256"]
    if receipt.get("shellEase"):
        assert sha(Path(__file__).with_name("build-council-eased-garment-study.py")) == receipt["shellEase"]["authorSHA256"]
    if receipt.get("independentPattern"):
        assert sha(Path(__file__).with_name("build-council-pattern-garment-study.py")) == receipt["independentPattern"]["authorSHA256"]
    for capture in receipt["rendered"]: assert sha(output / capture["file"]) == capture["sha256"]
    path = Path(__file__).with_name("build-council-continuous-sleeve-study.py")
    spec = importlib.util.spec_from_file_location("shi_garment_baseline", path)
    recipe = importlib.util.module_from_spec(spec); spec.loader.exec_module(recipe)
    author = recipe.load_author()
    bpy.ops.wm.open_mainfile(filepath=str(source))
    rig = bpy.data.objects["SK_SHI_keeper_Rig"]; body = bpy.data.objects["SKM_SHI_keeper_Body"]
    body_basis = [tuple(v.co) for v in body.data.vertices]
    body_weights = [[(g.group, g.weight) for g in v.groups] for v in body.data.vertices]
    body_shapes = [(key.name, key.value, [tuple(v.co) for v in key.data]) for key in body.data.shape_keys.key_blocks]
    author.author(rig, bpy.context.scene)
    baseline = []
    for frame in range(1, 122):
        bpy.context.scene.frame_set(frame); bpy.context.view_layer.update()
        baseline.append({b.name: b.matrix.copy() for b in rig.pose.bones})
    retained = []
    for side in ("l", "r"):
        sleeve = recipe.sleeve(rig, side)
        retained.append([(tuple(v.co), {sleeve.vertex_groups[g.group].name: g.weight for g in v.groups})
                         for v in sleeve.data.vertices[8 * 24:]])
    bpy.ops.wm.open_mainfile(filepath=str(output / "garment-study.blend"))
    rig = bpy.data.objects["SK_SHI_keeper_Rig"]; body = bpy.data.objects["SKM_SHI_keeper_Body"]
    obj = bpy.data.objects["SKM_SHI_keeper_ConnectedGarmentStudy"]
    assert body_basis == [tuple(v.co) for v in body.data.vertices]
    assert body_weights == [[(g.group, g.weight) for g in v.groups] for v in body.data.vertices]
    assert body_shapes == [(key.name, key.value, [tuple(v.co) for v in key.data]) for key in body.data.shape_keys.key_blocks]
    assert len(rig.data.bones) == 53 and not body.hide_render, "Never mask body to conceal penetration"
    for start, sleeve in zip((len(obj.data.vertices) - 816, len(obj.data.vertices) - 408), retained):
        for v, (point, weights) in zip(obj.data.vertices[start:start + 408], sleeve):
            assert tuple(v.co) == point
            actual = {obj.vertex_groups[g.group].name: g.weight for g in v.groups}
            assert set(actual) == set(weights) and all(abs(actual[k] - weights[k]) < 1e-6 for k in weights)
    edges, loops = topology(obj.data)
    assert set(g.name for g in obj.vertex_groups) <= set(rig.data.bones.keys())
    assert all(abs(sum(g.weight for g in v.groups) - 1) < 1e-6 for v in obj.data.vertices)
    assert obj.modifiers["GarmentSkin"].object == rig and obj.modifiers["GarmentSkin"].use_deform_preserve_volume
    rest = [(obj.data.vertices[a].co - obj.data.vertices[b].co).length for a, b in edges]
    assert min(rest) > 1e-7, "Collapsed rest edge"
    minimum_clearance, maximum_edge, minimum_area, pose_error = math.inf, 1, math.inf, 0
    worst, worst_edge, samples = None, None, []
    for frame in range(1, 122):
        bpy.context.scene.frame_set(frame); bpy.context.view_layer.update()
        for bone in rig.pose.bones:
            pose_error = max(pose_error, max(abs(bone.matrix[r][c] - baseline[frame - 1][bone.name][r][c]) for r in range(4) for c in range(4)))
        graph = bpy.context.evaluated_depsgraph_get()
        skin = body.evaluated_get(graph); skin_mesh = skin.to_mesh()
        tree = BVHTree.FromPolygons([skin.matrix_world @ v.co for v in skin_mesh.vertices], [tuple(p.vertices) for p in skin_mesh.polygons])
        garment = obj.evaluated_get(graph); mesh = garment.to_mesh()
        points = [garment.matrix_world @ v.co for v in mesh.vertices]
        probes = list(points)
        for face in mesh.polygons:
            minimum_area = min(minimum_area, face.area)
            probes.append(sum((points[v] for v in face.vertices), Vector()) / len(face.vertices))
        frame_clearance = math.inf
        for index, point in enumerate(probes):
            nearest, normal, _, distance = tree.find_nearest(point)
            signed = distance if (point - nearest).dot(normal) >= 0 else -distance
            assert math.isfinite(signed)
            frame_clearance = min(frame_clearance, signed)
            if signed < minimum_clearance:
                minimum_clearance = signed; worst = {"frame": frame, "point": index, "clearanceMetres": signed}
        for (a, b), length in zip(edges, rest):
            ratio = (points[a] - points[b]).length / length
            change = max(ratio, math.inf if ratio == 0 else 1 / ratio)
            if change > maximum_edge:
                maximum_edge = change
                worst_edge = {"frame": frame, "edge": [a, b], "ratio": ratio,
                              "restPoints": [list(obj.data.vertices[i].co) for i in (a, b)]}
        garment.to_mesh_clear(); skin.to_mesh_clear()
        samples.append({"frame": frame, "minimumSampledClearanceMetres": frame_clearance})
    assert pose_error < 1e-6
    accepted = minimum_clearance > 0 and maximum_edge <= 3 and minimum_area > 1e-8
    report = {"status": "sampled-connected-garment-checks-passed" if accepted else "rejected-connected-garment",
              "checkerSHA256": sha(Path(__file__)), "blendSHA256": receipt["blendSHA256"],
              "bodyBasisAndWeightsUnchanged": True, "distalSleeveBasisAndWeightsUnchanged": True,
              "bodyShapeKeyValuesAndCoordinatesUnchanged": True,
              "maximumBoneMatrixError": pose_error, "boundaryLoops": loops, "frames": 121,
              "minimumSampledBodyClearanceMetres": minimum_clearance, "maximumEdgeLengthChangeFactor": maximum_edge,
              "minimumFaceAreaSquareMetres": minimum_area, "worstClearance": worst, "worstEdge": worst_edge, "samples": samples,
              "scope": "Connected shoulder carrier only; sampled clearance is not exact triangle collision, cloth drape, historical authenticity or visual/motion approval. No runtime admission."}
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print("SHI_CONNECTED_GARMENT_CHECK", json.dumps({k: v for k, v in report.items() if k != "samples"}))
    if not accepted: raise ValueError("Reject connected garment candidate; preserve evidence, never ship it")


if __name__ == "__main__": main()
