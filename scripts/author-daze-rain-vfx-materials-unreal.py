"""Author or inspect SHI's isolated Unreal Daze rain materials.

The default mode is read-only. Set SHI_DAZE_RAIN_VFX_AUTHOR_MATERIALS=1 only
for the exact imported fallbacks or a previously admitted authored graph.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


DESTINATION = "/Game/SHI/Art/VFX/DazeRain"
MATERIAL_PATHS = {
    "streak": f"{DESTINATION}/M_SHI_RainStreak",
    "ripple": f"{DESTINATION}/M_SHI_RainRipple",
}
REVIEWED = {
    "streak": {"RainColor": (0.055, 0.105, 0.145), "RainOpacity": 0.34, "RainEmissiveStrength": 0.72},
    "ripple": {"RainColor": (0.030, 0.065, 0.090), "RainOpacity": 0.19, "RainEmissiveStrength": 0.48},
}
EXPECTED_NODE_COUNT = 6


def expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material, expression_class.static_class(), node_pos_x=x, node_pos_y=y
    )
    if not node:
        raise RuntimeError(f"Could not create {expression_class} in {material.get_path_name()}")
    node.set_editor_property("desc", description)
    return node


def connect(source, output_name: str, target, input_name: str) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_expressions(source, output_name, target, input_name):
        raise RuntimeError(f"Could not connect {source.get_name()}.{output_name} to {target.get_name()}.{input_name}")


def connect_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(source, output_name, material_property):
        raise RuntimeError(f"Could not connect {source.get_name()} to {material_property}")


def scalar(material, name: str, value: float, x: int, y: int):
    node = expression(material, unreal.MaterialExpressionScalarParameter, x, y,
                      f"SHI reviewed {name}; retune only through recorded rain lookdev.")
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", "Rain Response")
    return node


def vector(material, name: str, value: tuple[float, float, float], x: int, y: int):
    node = expression(material, unreal.MaterialExpressionVectorParameter, x, y,
                      "Restrained cold rain response; no texture or fabricated physical detail.")
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0))
    node.set_editor_property("group", "Rain Response")
    return node


def author_material(role: str, material) -> None:
    values = REVIEWED[role]
    # UE 5.8's DeleteAllMaterialExpressions removes from the collection that its
    # native range loop is traversing and can skip alternating nodes. Iterate over
    # a Python snapshot so a re-author is exact and idempotent.
    for node in list(unreal.MaterialEditingLibrary.get_material_expressions(material)):
        unreal.MaterialEditingLibrary.delete_material_expression(material, node)
    material.set_editor_property("two_sided", True)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    material.set_editor_property("disable_depth_test", False)
    # These authored materials are consumed only through UInstancedStaticMeshComponent.
    # Pin the usage before cooking so a packaged build never substitutes the default
    # surface material while compiling the instanced vertex-factory permutation.
    material.set_editor_property("used_with_instanced_static_meshes", True)
    vertex = expression(material, unreal.MaterialExpressionVertexColor, -720, 100,
                        "Source alpha tapers streak ends and ripple edges.")
    opacity = scalar(material, "RainOpacity", values["RainOpacity"], -700, 230)
    opacity_multiply = expression(material, unreal.MaterialExpressionMultiply, -390, 150,
                                  "Reviewed vertex-alpha opacity; never gameplay authority.")
    color = vector(material, "RainColor", values["RainColor"], -700, -190)
    strength = scalar(material, "RainEmissiveStrength", values["RainEmissiveStrength"], -700, -70)
    emissive_multiply = expression(material, unreal.MaterialExpressionMultiply, -390, -150,
                                   "Restrained unlit visibility under the field exposure.")
    connect(vertex, "A", opacity_multiply, "A")
    connect(opacity, "", opacity_multiply, "B")
    connect(color, "RGB", emissive_multiply, "A")
    connect(strength, "", emissive_multiply, "B")
    connect_output(opacity_multiply, "", unreal.MaterialProperty.MP_OPACITY)
    connect_output(emissive_multiply, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)


def class_name(value) -> str | None:
    return value.get_class().get_name() if value else None


def inspect_material(role: str, material) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    parameters = {}
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(node.get_editor_property("default_value"))
        elif isinstance(node, unreal.MaterialExpressionVectorParameter):
            value = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [float(value.r), float(value.g), float(value.b), float(value.a)]
    expected = REVIEWED[role]
    parameter_match = set(parameters) == set(expected)
    if parameter_match:
        for name, value in expected.items():
            actual = parameters[name]
            if isinstance(value, tuple):
                parameter_match &= all(abs(actual[index] - value[index]) <= 1e-5 for index in range(3))
            else:
                parameter_match &= abs(actual - value) <= 1e-5
    opacity_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_OPACITY)
    emissive_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    checks = {
        "exactAsset": material.get_path_name() == f"{MATERIAL_PATHS[role]}.{Path(MATERIAL_PATHS[role]).name}",
        "translucentUnlitTwoSided": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_TRANSLUCENT
        and material.get_editor_property("shading_model") == unreal.MaterialShadingModel.MSM_UNLIT
        and bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "depthTestPreserved": not bool(material.get_editor_property("disable_depth_test")),
        "instancedStaticMeshUsage": bool(material.get_editor_property("used_with_instanced_static_meshes")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNT,
        "vertexAlphaSignal": sum(isinstance(node, unreal.MaterialExpressionVertexColor) for node in expressions) == 1,
        "exactReviewedParameters": parameter_match,
        "opacityOutput": class_name(opacity_input) == "MaterialExpressionMultiply",
        "emissiveOutput": class_name(emissive_input) == "MaterialExpressionMultiply",
        "noBaseColorOrNormalPretence": unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_BASE_COLOR) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_NORMAL) is None,
        "noTextures": not unreal.MaterialEditingLibrary.get_material_used_textures(material),
        "compileClean": not compile_errors,
    }
    repairable_graph = (
        len(expressions) <= 8
        and checks["exactAsset"]
        and checks["translucentUnlitTwoSided"]
        and checks["depthTestPreserved"]
        and checks["vertexAlphaSignal"]
        and checks["exactReviewedParameters"]
        and checks["opacityOutput"]
        and checks["emissiveOutput"]
        and checks["noBaseColorOrNormalPretence"]
        and checks["noTextures"]
        and checks["compileClean"]
    )
    return {
        "assetPath": material.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": [class_name(node) for node in expressions],
        "parameters": parameters,
        "compileErrors": [str(error) for error in compile_errors],
        "importFallbackBaseline": len(expressions) <= 1,
        "authorableGraph": all(
            value
            for name, value in checks.items()
            if name not in {"exactReviewedParameters", "instancedStaticMeshUsage"}
        ),
        "repairableReviewedGraph": repairable_graph,
        "reviewedGraph": all(value for name, value in checks.items() if name != "exactReviewedParameters"),
        "checks": checks,
        "passed": all(checks.values()),
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    materials = {}
    for role, path in MATERIAL_PATHS.items():
        material = unreal.EditorAssetLibrary.load_asset(path)
        if not isinstance(material, unreal.Material):
            raise RuntimeError(f"Exact isolated material is unavailable: {path}")
        materials[role] = material
    author_enabled = os.environ.get("SHI_DAZE_RAIN_VFX_AUTHOR_MATERIALS") == "1"
    if author_enabled:
        existing = {role: inspect_material(role, material) for role, material in materials.items()}
        for role, material in materials.items():
            if not (
                existing[role]["importFallbackBaseline"]
                or existing[role]["authorableGraph"]
                or existing[role]["repairableReviewedGraph"]
            ):
                raise RuntimeError(f"{role} state is neither import fallback nor reviewed rain graph")
            author_material(role, material)
    report = {
        "assetId": "shi-daze-rain-vfx-v1",
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "materials": {role: inspect_material(role, material) for role, material in materials.items()},
    }
    report["passed"] = all(entry["passed"] for entry in report["materials"].values())
    if author_enabled:
        for material in materials.values():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        content_root = project_dir / "Content" / "SHI" / "Art" / "VFX" / "DazeRain"
        for role, path in MATERIAL_PATHS.items():
            asset_file = content_root / f"{Path(path).name}.uasset"
            report["materials"][role]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
            report["materials"][role]["bytes"] = asset_file.stat().st_size
            report["materials"][role]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-rain-vfx-unreal-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_RAIN_VFX_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError("Daze rain materials are not admitted; explicit authoring is required after source review")


main()
