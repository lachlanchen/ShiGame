"""Private rest-pattern correction:20mm transition ease instead of25mm.

Changes only the144 transition vertices, not body, rig, gesture, topology,
skinning influences or retained distal sleeves. No admission is implied.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

from mathutils import Vector


path = Path(__file__).with_name("build-council-gusset-garment-study.py")
spec = importlib.util.spec_from_file_location("shi_fitted_gusset_parent", path)
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)
original = recipe.gusset


def fitted(sleeves, rig):
    obj, joins = original(sleeves, rig)
    begin = len(obj.data.vertices) - 816 - 144
    assert begin > 0
    for ring in range(6):
        vertices = list(obj.data.vertices[begin + ring * 24:begin + (ring + 1) * 24])
        center = sum((v.co for v in vertices), Vector()) / 24
        reduction = .005 * math.sin(math.pi * ((ring % 3 + 1) / 4))
        for vertex in vertices:
            radial = vertex.co - center
            assert radial.length > reduction
            vertex.co -= radial.normalized() * reduction
    obj.data.update()
    return obj, joins


def main():
    recipe.gusset = fitted
    recipe.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    path = output / "receipt.json"
    receipt = json.loads(path.read_text())
    receipt["transitionEaseFit"] = {
        "authorSHA256": recipe.recipe.parent.load_recipe().digest(Path(__file__)),
        "transitionVertices": 144, "maximumRadialReductionMetres": .005,
        "method": "Tapered reduction of excess transition-ring rest ease about each ring centre; no body projection"}
    receipt["boundary"] = "Private rest-pattern correction, not accepted cloth or cinematic media; body and source gesture unchanged."
    path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__": main()
