"""Private reversible shoulder fit over the connected-sleeve study recipe.

Fits intersecting points against the body in the neutral gesture, maps that
surface to rest geometry and transfers its skin weights. Keeps body and rig.
This does not weld the torso garment, simulate cloth or approve final costume.
"""
import importlib.util
import json
from pathlib import Path
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform


path = Path(__file__).with_name("build-council-continuous-sleeve-study.py")
spec = importlib.util.spec_from_file_location("shi_sleeve_recipe", path)
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)
original_sleeve = recipe.sleeve
fits = []


def fit_sleeve(rig, side):
    obj = original_sleeve(rig, side)
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    pose = rig.data.pose_position
    frame = bpy.context.scene.frame_current
    bpy.context.scene.frame_set(1)
    rig.data.pose_position = "POSE"
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    posed_body = body.evaluated_get(graph)
    posed_mesh = posed_body.to_mesh()
    posed_matrix = rig.matrix_world.inverted() @ posed_body.matrix_world
    posed_points = [posed_matrix @ v.co for v in posed_mesh.vertices]
    posed_mesh.calc_loop_triangles()
    triangles = [tuple(t.vertices) for t in posed_mesh.loop_triangles]
    posed_sleeve = obj.evaluated_get(graph)
    posed_sleeve_mesh = posed_sleeve.to_mesh()
    sleeve_matrix = rig.matrix_world.inverted() @ posed_sleeve.matrix_world
    sleeve_points = [sleeve_matrix @ v.co for v in posed_sleeve_mesh.vertices]
    posed_sleeve.to_mesh_clear()
    posed_body.to_mesh_clear()
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    evaluated = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    assert len(mesh.vertices) == len(body.data.vertices), "Weight transfer requires unchanged body topology"
    matrix = rig.matrix_world.inverted() @ evaluated.matrix_world
    points = [matrix @ v.co for v in mesh.vertices]
    mesh.calc_loop_triangles()
    assert triangles == [tuple(t.vertices) for t in mesh.loop_triangles]
    tree = BVHTree.FromPolygons(posed_points, triangles, all_triangles=True)
    source_weights = [{body.vertex_groups[g.group].name: g.weight for g in v.groups} for v in body.data.vertices]
    changes = []
    for vertex in obj.data.vertices:
        # Preserve elbow/cuff construction. The first third is the attachment
        # transition that previously penetrated the torso/shoulder.
        if vertex.index // 24 >= 8:
            continue
        location, normal, triangle, distance = tree.find_nearest(sleeve_points[vertex.index])
        signed = distance if (sleeve_points[vertex.index] - location).dot(normal) >= 0 else -distance
        if signed >= .012:
            continue
        original = vertex.co.copy()
        a, b, c = triangles[triangle]
        weights = barycentric_transform(location, posed_points[a], posed_points[b], posed_points[c], Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)))
        weights = [max(0, float(w)) for w in weights]
        total = sum(weights)
        assert total > 0
        rest_location = sum((points[i] * w / total for i, w in zip((a, b, c), weights)), Vector())
        rest_normal = (points[b] - points[a]).cross(points[c] - points[a]).normalized()
        # A nearest surface point can land on a triangle edge/vertex. Preserve
        # the original tangential offset; otherwise several cloth vertices
        # collapse onto the same skin point and destroy the garment pattern.
        pose_u = (posed_points[b] - posed_points[a]).normalized()
        pose_normal = (posed_points[b] - posed_points[a]).cross(posed_points[c] - posed_points[a]).normalized()
        pose_v = pose_normal.cross(pose_u)
        rest_u = (points[b] - points[a]).normalized()
        rest_v = rest_normal.cross(rest_u)
        delta = sleeve_points[vertex.index] - location
        tangent = rest_u * delta.dot(pose_u) + rest_v * delta.dot(pose_v)
        vertex.co = rest_location + tangent + rest_normal * .012
        assignments = {}
        for index, weight in zip((a, b, c), weights):
            for name, influence in source_weights[index].items():
                assignments[name] = assignments.get(name, 0) + influence * weight / total
        assert abs(sum(assignments.values()) - 1) < 1e-5
        for group in obj.vertex_groups:
            group.remove([vertex.index])
        for name, influence in assignments.items():
            if influence <= 1e-8:
                continue
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([vertex.index], influence, "REPLACE")
        changes.append({"vertex": vertex.index, "displacementMetres": (vertex.co - original).length,
                        "sourceTriangle": triangle, "weights": assignments})
    evaluated.to_mesh_clear()
    rig.data.pose_position = pose
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    obj.data.update()
    fits.append({"sleeve": obj.name, "clearanceMetres": .012, "modifiedVertices": changes})
    return obj


def main():
    recipe.sleeve = fit_sleeve
    recipe.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    receipt_path = output / "receipt.json"
    receipt = json.loads(receipt_path.read_text())
    receipt["shoulderFit"] = {"authorSHA256": recipe.digest(Path(__file__)), "method": "neutral-gesture nearest triangle mapped to rest geometry with barycentric skin-weight transfer", "sleeves": fits}
    receipt["boundary"] += " Shoulder fitting is a separate candidate; torso garment seam and full collision review remain open."
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__":
    main()
