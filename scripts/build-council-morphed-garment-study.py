"""Private controlled variant: fit against the carrier's active rest shape.

Use --python-exit-code 1 for unattended Blender execution. Temporarily supplies
an evaluated rest mesh to the unchanged connected recipe, then restores the
original body datablock before saving/rendering. No body morph is edited.
"""
import importlib.util
import json
from pathlib import Path
import sys

import bpy


path = Path(__file__).with_name("build-council-connected-garment-study.py")
spec = importlib.util.spec_from_file_location("shi_morphed_garment_recipe", path)
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)
original = recipe.garment
details = {}


def fit_actual_rest_shape(sleeve_recipe, rig):
    body = bpy.data.objects["SKM_SHI_keeper_Body"]
    original_mesh = body.data
    original_pose = rig.data.pose_position
    keys = [] if original_mesh.shape_keys is None else [
        {"name": key.name, "value": key.value} for key in original_mesh.shape_keys.key_blocks]
    temporary = None
    try:
        rig.data.pose_position = "REST"; bpy.context.view_layer.update()
        graph = bpy.context.evaluated_depsgraph_get()
        evaluated = body.evaluated_get(graph)
        temporary = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=graph).copy()
        evaluated.to_mesh_clear()
        assert len(temporary.vertices) == len(original_mesh.vertices)
        assert [tuple(p.vertices) for p in temporary.polygons] == [tuple(p.vertices) for p in original_mesh.polygons]
        # Reject lost or changed influence data instead of silently fitting an
        # unweighted shell. No topology-changing modifier is supported here.
        assert [[(g.group, g.weight) for g in v.groups] for v in temporary.vertices] == [
            [(g.group, g.weight) for g in v.groups] for v in original_mesh.vertices]
        details.update({"activeShapeKeys": keys,
                        "maximumRestMorphDisplacementMetres": max((a.co - b.co).length for a, b in zip(temporary.vertices, original_mesh.vertices)),
                        "method": "Evaluated active rest shape; unchanged topology and influences, no nearest-surface projection"})
        body.data = temporary
        return original(sleeve_recipe, rig)
    finally:
        body.data = original_mesh
        rig.data.pose_position = original_pose
        bpy.context.view_layer.update()
        if temporary is not None: bpy.data.meshes.remove(temporary)


def main():
    recipe.garment = fit_actual_rest_shape
    recipe.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    receipt_path = output / "receipt.json"
    receipt = json.loads(receipt_path.read_text())
    receipt["activeRestShapeFit"] = {"authorSHA256": recipe.load_recipe().digest(Path(__file__)), **details}
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__": main()
