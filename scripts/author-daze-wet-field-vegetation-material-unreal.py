"""Author or inspect SHI's isolated Unreal wet-field vegetation material.

The default mode is read-only. Set SHI_DAZE_VEGETATION_AUTHOR_MATERIAL=1
only for the exact imported fallback or a previously admitted authored graph.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-daze-wet-field-vegetation-v1"
DESTINATION = "/Game/SHI/Art/Environment/WetFieldVegetation"
MATERIAL_PATH = f"{DESTINATION}/M_SHI_RainDarkenedFieldPlant"
REVIEWED = {
    "RootColor": (0.031, 0.042, 0.018),
    "TipColor": (0.053, 0.069, 0.029),
    "WindDirection": (1.0, 0.35, 0.0),
    "PlantRoughness": 0.86,
    "PlantSpecular": 0.18,
    "WindSpeed": 0.38,
    "WindAmplitude": 2.4,
}
EXPECTED_NODE_COUNT = 15


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


def scalar(material, name: str, value: float, x: int, y: int, group: str):
    node = expression(material, unreal.MaterialExpressionScalarParameter, x, y,
                      f"SHI reviewed {name}; retune only through recorded vegetation lookdev.")
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", group)
    return node


def vector(material, name: str, value: tuple[float, float, float], x: int, y: int, group: str):
    node = expression(material, unreal.MaterialExpressionVectorParameter, x, y,
                      "Texture-free reviewed field-plant response; no botanical species claim.")
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0))
    node.set_editor_property("group", group)
    return node


def author_material(material) -> None:
    for node in list(unreal.MaterialEditingLibrary.get_material_expressions(material)):
        unreal.MaterialEditingLibrary.delete_material_expression(material, node)
    material.set_editor_property("two_sided", True)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT)
    material.set_editor_property("used_with_instanced_static_meshes", True)

    vertex = expression(material, unreal.MaterialExpressionVertexColor, -1100, 30,
                        "ShiPlantWind alpha anchors roots at zero and releases only free tips.")
    root_color = vector(material, "RootColor", REVIEWED["RootColor"], -1060, -350, "Plant Response")
    tip_color = vector(material, "TipColor", REVIEWED["TipColor"], -1060, -250, "Plant Response")
    color = expression(material, unreal.MaterialExpressionLinearInterpolate, -650, -300,
                       "Restrained root-to-tip rain-darkened color variation.")
    connect(root_color, "RGB", color, "A")
    connect(tip_color, "RGB", color, "B")
    connect(vertex, "A", color, "Alpha")

    roughness = scalar(material, "PlantRoughness", REVIEWED["PlantRoughness"], -520, -100, "Plant Response")
    specular = scalar(material, "PlantSpecular", REVIEWED["PlantSpecular"], -520, 0, "Plant Response")

    time = expression(material, unreal.MaterialExpressionTime, -1100, 250,
                      "Engine time drives presentation-only low-frequency wind.")
    speed = scalar(material, "WindSpeed", REVIEWED["WindSpeed"], -1100, 370, "Bounded Wind")
    time_scaled = expression(material, unreal.MaterialExpressionMultiply, -820, 280,
                             "Reviewed wind cycle rate.")
    connect(time, "", time_scaled, "A")
    connect(speed, "", time_scaled, "B")
    sine = expression(material, unreal.MaterialExpressionSine, -590, 280,
                      "Smooth bounded sway; no gust simulation or gameplay authority.")
    connect(time_scaled, "", sine, "")

    amplitude = scalar(material, "WindAmplitude", REVIEWED["WindAmplitude"], -1100, 500, "Bounded Wind")
    wind_mask = expression(material, unreal.MaterialExpressionMultiply, -820, 470,
                           "Vertex alpha fixes roots and bounds free-tip displacement.")
    connect(vertex, "A", wind_mask, "A")
    connect(amplitude, "", wind_mask, "B")
    gust = expression(material, unreal.MaterialExpressionMultiply, -350, 340,
                      "Sine displacement multiplied by the authored root-to-tip mask.")
    connect(sine, "", gust, "A")
    connect(wind_mask, "", gust, "B")
    direction = vector(material, "WindDirection", REVIEWED["WindDirection"], -350, 500, "Bounded Wind")
    offset = expression(material, unreal.MaterialExpressionMultiply, -80, 400,
                        "Maximum reviewed horizontal WPO is 2.4 cm; Z direction remains zero.")
    connect(gust, "", offset, "A")
    connect(direction, "RGB", offset, "B")

    connect_output(color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    connect_output(offset, "", unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET)


def class_name(value) -> str | None:
    return value.get_class().get_name() if value else None


def inspect_material(material) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    parameters = {}
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(node.get_editor_property("default_value"))
        elif isinstance(node, unreal.MaterialExpressionVectorParameter):
            value = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [float(value.r), float(value.g), float(value.b), float(value.a)]
    parameter_match = set(parameters) == set(REVIEWED)
    if parameter_match:
        for name, value in REVIEWED.items():
            actual = parameters[name]
            if isinstance(value, tuple):
                parameter_match &= all(abs(actual[index] - value[index]) <= 1e-5 for index in range(3))
            else:
                parameter_match &= abs(actual - value) <= 1e-5
    base_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_BASE_COLOR)
    roughness_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_ROUGHNESS)
    specular_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_SPECULAR)
    offset_input = unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET)
    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    classes = [class_name(node) for node in expressions]
    checks = {
        "exactAsset": material.get_path_name() == f"{MATERIAL_PATH}.{Path(MATERIAL_PATH).name}",
        "opaqueLitTwoSided": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("shading_model") == unreal.MaterialShadingModel.MSM_DEFAULT_LIT
        and bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "instancedStaticMeshUsage": bool(material.get_editor_property("used_with_instanced_static_meshes")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNT,
        "exactGraphClasses": classes.count("MaterialExpressionVertexColor") == 1
        and classes.count("MaterialExpressionLinearInterpolate") == 1
        and classes.count("MaterialExpressionTime") == 1
        and classes.count("MaterialExpressionSine") == 1
        and classes.count("MaterialExpressionMultiply") == 4
        and classes.count("MaterialExpressionVectorParameter") == 3
        and classes.count("MaterialExpressionScalarParameter") == 4,
        "exactReviewedParameters": parameter_match,
        "baseColorOutput": class_name(base_input) == "MaterialExpressionLinearInterpolate",
        "roughnessOutput": class_name(roughness_input) == "MaterialExpressionScalarParameter",
        "specularOutput": class_name(specular_input) == "MaterialExpressionScalarParameter",
        "gpuWindOutput": class_name(offset_input) == "MaterialExpressionMultiply",
        "noTextureNormalEmissiveOrOpacityPretence": not unreal.MaterialEditingLibrary.get_material_used_textures(material)
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_NORMAL) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_EMISSIVE_COLOR) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_OPACITY) is None,
        "compileClean": not compile_errors,
    }
    repairable_graph = len(expressions) <= 18 and checks["exactAsset"] and checks["opaqueLitTwoSided"] \
        and checks["exactGraphClasses"] and checks["exactReviewedParameters"] \
        and checks["baseColorOutput"] and checks["roughnessOutput"] and checks["specularOutput"] \
        and checks["gpuWindOutput"] and checks["noTextureNormalEmissiveOrOpacityPretence"] and checks["compileClean"]
    return {
        "assetPath": material.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": classes,
        "parameters": parameters,
        "compileErrors": [str(error) for error in compile_errors],
        "importFallbackBaseline": len(expressions) <= 1,
        "repairableReviewedGraph": repairable_graph,
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
    material = unreal.EditorAssetLibrary.load_asset(MATERIAL_PATH)
    if not isinstance(material, unreal.Material):
        raise RuntimeError(f"Exact isolated material is unavailable: {MATERIAL_PATH}")
    author_enabled = os.environ.get("SHI_DAZE_VEGETATION_AUTHOR_MATERIAL") == "1"
    if author_enabled:
        existing = inspect_material(material)
        if not (existing["importFallbackBaseline"] or existing["repairableReviewedGraph"]):
            raise RuntimeError("Material state is neither import fallback nor reviewed vegetation graph")
        author_material(material)
    report = {
        "assetId": ASSET_ID,
        "mode": "author-exact-material" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "material": inspect_material(material),
    }
    report["passed"] = report["material"]["passed"]
    if author_enabled:
        if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
            raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        asset_file = project_dir / "Content" / "SHI" / "Art" / "Environment" / "WetFieldVegetation" / "M_SHI_RainDarkenedFieldPlant.uasset"
        report["material"]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
        report["material"]["bytes"] = asset_file.stat().st_size
        report["material"]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-wet-field-vegetation-unreal-material.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_VEGETATION_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError("Daze wet-field vegetation material is not admitted")


main()
