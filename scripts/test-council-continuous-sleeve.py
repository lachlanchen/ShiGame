"""Independently evaluate the saved sleeve study and source gesture in Blender.

Checks connected garment topology, skin weights, body clearance at vertices and
face centers, and unchanged bones/body. Sampled clearance is not exact triangle
collision or cloth/acting approval. No source or study is saved by this checker.
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


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def topology(mesh):
    counts = Counter(tuple(sorted(edge)) for p in mesh.polygons for edge in p.edge_keys)
    assert set(counts.values()) <= {1, 2}
    boundary = [edge for edge, count in counts.items() if count == 1]
    assert len(boundary) == 48, "Two open 24-vertex cuffs required"
    boundary_degree = Counter(v for edge in boundary for v in edge)
    assert set(boundary_degree.values()) == {2}
    neighbours = {v.index: set() for v in mesh.vertices}
    for a, b in counts:
        neighbours[a].add(b)
        neighbours[b].add(a)
    seen, pending = set(), [0]
    while pending:
        current = pending.pop()
        if current in seen:
            continue
        seen.add(current)
        pending.extend(neighbours[current] - seen)
    assert len(seen) == len(mesh.vertices), "Sleeve must be one connected surface"
    assert len(mesh.vertices) - len(counts) + len(mesh.polygons) == 0
    return list(counts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", required=True, type=Path)
    parser.add_argument("--report", type=Path, help="Write a new verification snapshot without replacing prior evidence")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    output = args.study.resolve()
    receipt = json.loads((output / "receipt.json").read_text())
    source = Path(__file__).resolve().parents[1] / "assets/3d/rendered/shi-daze-council-performance-v1.blend"
    source_hash = "feb52d4080cdfd0cdfa212fb4ec92a427ba676a6fba84fe74f3ac0f165eab743"
    assert sha(source) == receipt["sourceSHA256"] == source_hash
    assert sha(output / "sleeve-study.blend") == receipt["blendSHA256"]
    fitted = receipt.get("shoulderFit")
    if fitted:
        assert sha(Path(__file__).with_name("build-council-shoulder-fit-study.py")) == fitted["authorSHA256"]
    for rendered in receipt["rendered"]:
        assert sha(output / rendered["file"]) == rendered["sha256"]
    author_path = Path(__file__).with_name("render-council-palm-gesture-study.py")
    assert sha(author_path) == receipt["palmAuthorSHA256"]
    assert sha(Path(__file__).with_name("render-council-relaxed-gesture-study.py")) == receipt["poseAuthorSHA256"]
    spec = importlib.util.spec_from_file_location("shi_sleeve_source_author", author_path)
    author = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(author)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    rig = bpy.data.objects["SK_SHI_keeper_Rig"]
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    body_basis = [tuple(v.co) for v in body.data.vertices]
    body_weights = [[(group.group, group.weight) for group in v.groups] for v in body.data.vertices]
    author.author(rig, scene)
    baseline = []
    for frame in range(1, 122):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        baseline.append({b.name: b.matrix.copy() for b in rig.pose.bones})
    bpy.ops.wm.open_mainfile(filepath=str(output / "sleeve-study.blend"))
    scene = bpy.context.scene
    rig = bpy.data.objects["SK_SHI_keeper_Rig"]
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    assert body_basis == [tuple(v.co) for v in body.data.vertices]
    assert body_weights == [[(group.group, group.weight) for group in v.groups] for v in body.data.vertices]
    assert len(rig.data.bones) == 53
    sleeves = [bpy.data.objects["SKM_SHI_keeper_ContinuousSleeve_" + side] for side in ("L", "R")]
    edges = []
    for obj in sleeves:
        assert len(obj.data.vertices) == 600 and len(obj.data.polygons) == 576
        assert all(len(p.vertices) == 4 for p in obj.data.polygons)
        edges.append(topology(obj.data))
        groups = set(g.name for g in obj.vertex_groups)
        if fitted:
            assert groups <= set(rig.data.bones.keys())
            assert {"upperarm_" + obj.name[-1].lower(), "lowerarm_" + obj.name[-1].lower()} <= groups
        else:
            assert groups == {"upperarm_" + obj.name[-1].lower(), "lowerarm_" + obj.name[-1].lower()}
        assert all(abs(sum(g.weight for g in v.groups) - 1) < 1e-6 for v in obj.data.vertices)
        assert obj.modifiers["SleeveSkin"].object == rig and obj.modifiers["SleeveSkin"].use_deform_preserve_volume
    for part in ("Upper", "Lower"):
        for side in ("L", "R"):
            assert bpy.data.objects[f"SKM_SHI_keeper_{part}Sleeve_{side}"].hide_render
    minimum_clearance = math.inf
    maximum_pose_error = 0
    minimum_area = math.inf
    maximum_edge_change = 1
    worst_clearance = None
    worst_edge = None
    free_sleeve_clearance = math.inf
    rest_edges = [[(obj.data.vertices[a].co - obj.data.vertices[b].co).length for a, b in group] for obj, group in zip(sleeves, edges)]
    assert all(length > 1e-7 for group in rest_edges for length in group), "Collapsed rest-pose sleeve edge"
    samples = []
    for frame in range(1, 122):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        for bone in rig.pose.bones:
            error = max(abs(bone.matrix[row][col] - baseline[frame - 1][bone.name][row][col]) for row in range(4) for col in range(4))
            maximum_pose_error = max(maximum_pose_error, error)
        body_eval = body.evaluated_get(graph)
        body_mesh = body_eval.to_mesh()
        body_world = [body_eval.matrix_world @ v.co for v in body_mesh.vertices]
        tree = BVHTree.FromPolygons(body_world, [tuple(p.vertices) for p in body_mesh.polygons])
        frame_clearance = math.inf
        for index, obj in enumerate(sleeves):
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            vertices = [evaluated.matrix_world @ v.co for v in mesh.vertices]
            assert all(all(math.isfinite(value) for value in v) for v in vertices)
            points = list(vertices)
            for polygon in mesh.polygons:
                points.append(sum((vertices[i] for i in polygon.vertices), Vector()) / len(polygon.vertices))
                minimum_area = min(minimum_area, polygon.area)
            for point_index, point in enumerate(points):
                location, normal, _, distance = tree.find_nearest(point)
                signed = distance if (point - location).dot(normal) >= 0 else -distance
                frame_clearance = min(frame_clearance, signed)
                # Shoulder/armpit join needs a fitted torso and body masking.
                # Keep its global red measurement; independently inspect the
                # lower upper-arm, elbow and cuff rather than hiding the join.
                row = point_index // 24 if point_index < 600 else (point_index - 600) // 24 + .5
                if row >= 8:
                    free_sleeve_clearance = min(free_sleeve_clearance, signed)
                if signed < minimum_clearance:
                    minimum_clearance = signed
                    worst_clearance = {"frame": frame, "sleeve": obj.name, "point": point_index, "local": list(evaluated.matrix_world.inverted() @ point), "bodyNormal": list(normal)}
            for edge, original in zip(edges[index], rest_edges[index]):
                ratio = (vertices[edge[0]] - vertices[edge[1]]).length / original
                change = max(ratio, 1 / ratio)
                if change > maximum_edge_change:
                    maximum_edge_change = change
                    worst_edge = {"frame": frame, "sleeve": obj.name, "edge": edge, "ratio": ratio}
            evaluated.to_mesh_clear()
        body_eval.to_mesh_clear()
        minimum_clearance = min(minimum_clearance, frame_clearance)
        samples.append({"frame": frame, "sampledBodyClearanceMetres": frame_clearance})
    assert maximum_pose_error < 1e-6, "Garment change modified skeleton performance"
    assert minimum_area > 1e-8, "Collapsed sleeve face"
    assert free_sleeve_clearance > 0, "Sampled elbow/cuff penetrates the body"
    assert sha(source) == source_hash
    fit_pass = bool(fitted and minimum_clearance > 0 and maximum_edge_change <= 3)
    report = {"status": ("sampled-shoulder-fit-checks-passed" if fit_pass else "rejected-shoulder-fit") if fitted else "connected-elbow-checks-passed-shoulder-fit-red", "checkerSHA256": sha(Path(__file__)),
              "blendSHA256": receipt["blendSHA256"], "frames": 121,
              "maximumBoneMatrixError": maximum_pose_error, "bodyBasisAndWeightsUnchanged": True,
              "minimumSampledBodyClearanceMetres": minimum_clearance, "minimumFaceAreaSquareMetres": minimum_area,
              "maximumEdgeLengthChangeFactor": maximum_edge_change, "samples": samples,
              "worstClearance": worst_clearance, "worstEdge": worst_edge,
              "minimumElbowAndCuffSampledClearanceMetres": free_sleeve_clearance,
              "shoulderFitAccepted": fit_pass,
              "scope": "One connected tube per sleeve, normalized skin weights, unchanged source body/53-bone gesture. Vertex/face-center nearest-surface samples do not prove exact triangle collision or cloth self-collision."}
    report_path = args.report.resolve() if args.report else output / "verification.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print("SHI_SLEEVE_CHECK", json.dumps({k: v for k, v in report.items() if k != "samples"}))
    if fitted and not fit_pass:
        raise ValueError(f"Reject shoulder fit: sampled body penetration or edge change above candidate bound. See {report_path}; no asset admission.")


if __name__ == "__main__":
    main()
