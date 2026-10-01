"""Private cloth-allowance/underarm-weight experiment on actual rest body shape.

Use --python-exit-code 1. Preserves topology, original body and distal sleeves.
No collision acceptance or final costume is implied by constructing the variant.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy


path = Path(__file__).with_name("build-council-morphed-garment-study.py")
spec = importlib.util.spec_from_file_location("shi_eased_garment_recipe", path)
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)
original = recipe.original
details = {}


def ease_garment(sleeve_recipe, rig):
    obj, joins = original(sleeve_recipe, rig)
    shell_count = len(obj.data.vertices) - 816
    vertices = obj.data.vertices
    neighbours = {i: set() for i in range(len(vertices))}
    for edge in obj.data.edges:
        a, b = edge.vertices
        neighbours[a].add(b); neighbours[b].add(a)
    weights = [{obj.vertex_groups[g.group].name: g.weight for g in v.groups} for v in vertices]
    # Diffuse only upper-arm/torso transition weights, not elbow/cuff data. The
    # smooth regional falloff keeps the surrounding established bind intact.
    strength = {}
    for v in vertices[:shell_count]:
        z = max(0, 1 - abs(v.co.z - 1.255) / .10)
        x = max(0, 1 - abs(abs(v.co.x) - .185) / .085)
        strength[v.index] = .45 * z * x
    for _ in range(6):
        updated = [dict(w) for w in weights]
        for i, amount in strength.items():
            if amount <= 0: continue
            adjacent = neighbours[i]
            average = {}
            for j in adjacent:
                for name, weight in weights[j].items():
                    average[name] = average.get(name, 0) + weight / len(adjacent)
            updated[i] = {name: weights[i].get(name, 0) * (1 - amount) + average.get(name, 0) * amount
                          for name in set(weights[i]) | set(average)}
        weights = updated
    for v in vertices[:shell_count]:
        # Additional ease belongs only to the shell. Taper to zero at the
        # armhole, neck and waist so the retained sleeve seam is not displaced.
        armhole = max(0, min(1, (.26 - abs(v.co.x)) / .045))
        vertical = max(0, min(1, (v.co.z - .84) / .08, (1.38 - v.co.z) / .06))
        allowance = .02 * armhole * vertical
        v.co += v.normal * allowance
        for group in obj.vertex_groups: group.remove([v.index])
        total = sum(weights[v.index].values()); assert total > 0
        for name, influence in weights[v.index].items():
            if influence > 1e-8:
                group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                group.add([v.index], influence / total, "REPLACE")
    obj.data.update()
    details.update({"maximumAdditionalShellAllowanceMetres": .02, "weightDiffusionPasses": 6,
                    "maximumDiffusionPerPass": .45, "retainedDistalSleeveVertices": 816,
                    "method": "Tapered shell-normal ease and bounded local adjacency weight diffusion; no nearest-surface projection"})
    return obj, joins


def main():
    recipe.original = ease_garment
    recipe.main()
    output = Path(sys.argv[sys.argv.index("--output") + 1]).resolve()
    receipt_path = output / "receipt.json"
    receipt = json.loads(receipt_path.read_text())
    receipt["shellEase"] = {"authorSHA256": recipe.recipe.load_recipe().digest(Path(__file__)), **details}
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")


if __name__ == "__main__": main()
