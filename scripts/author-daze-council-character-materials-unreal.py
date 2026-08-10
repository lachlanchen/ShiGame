"""Author or inspect SHI's exact Daze council blockout materials.

Inspection is read-only by default. Set SHI_DAZE_COUNCIL_AUTHOR_MATERIALS=1
only to replace FBX import fallbacks or re-author this exact reviewed graph.
The palette is a restrained cinematic readability contract for production
blockouts, not evidence for 209 BCE dye, fabric, complexion, or portraiture.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


ASSET_ID = "shi-daze-council-characters-v1"
DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"
EXPECTED_NODE_COUNT = 3
REVIEWED = {
    "M_SHI_Character_SkinClay": {"BaseColor": (0.300, 0.215, 0.160), "Roughness": 0.78, "Specular": 0.25},
    "M_SHI_Character_HairClay": {"BaseColor": (0.028, 0.026, 0.022), "Roughness": 0.91, "Specular": 0.15},
    "M_SHI_Character_BindingClay": {"BaseColor": (0.115, 0.075, 0.045), "Roughness": 0.88, "Specular": 0.18},
    "M_SHI_Character_RolePropClay": {"BaseColor": (0.070, 0.045, 0.028), "Roughness": 0.86, "Specular": 0.20},
    "M_SHI_keeper_ClothBase": {"BaseColor": (0.180, 0.160, 0.120), "Roughness": 0.90, "Specular": 0.18},
    "M_SHI_keeper_ClothOuter": {"BaseColor": (0.100, 0.115, 0.105), "Roughness": 0.93, "Specular": 0.16},
    "M_SHI_chen-sheng_ClothBase": {"BaseColor": (0.145, 0.120, 0.095), "Roughness": 0.90, "Specular": 0.18},
    "M_SHI_chen-sheng_ClothOuter": {"BaseColor": (0.070, 0.075, 0.065), "Roughness": 0.93, "Specular": 0.16},
    "M_SHI_wu-guang_ClothBase": {"BaseColor": (0.120, 0.135, 0.105), "Roughness": 0.90, "Specular": 0.18},
    "M_SHI_wu-guang_ClothOuter": {"BaseColor": (0.090, 0.075, 0.055), "Roughness": 0.93, "Specular": 0.16},
    "M_SHI_yu-mu_ClothBase": {"BaseColor": (0.190, 0.145, 0.105), "Roughness": 0.90, "Specular": 0.18},
    "M_SHI_yu-mu_ClothOuter": {"BaseColor": (0.105, 0.095, 0.075), "Roughness": 0.93, "Specular": 0.16},
    "M_SHI_qin-courier_ClothBase": {"BaseColor": (0.130, 0.115, 0.090), "Roughness": 0.90, "Specular": 0.18},
    "M_SHI_qin-courier_ClothOuter": {"BaseColor": (0.075, 0.085, 0.075), "Roughness": 0.93, "Specular": 0.16},
}


def expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material, expression_class.static_class(), node_pos_x=x, node_pos_y=y
    )
    if not node:
        raise RuntimeError(f"Could not create {expression_class} in {material.get_path_name()}")
    node.set_editor_property("desc", description)
    return node


def connect_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(source, output_name, material_property):
        raise RuntimeError(f"Could not connect {source.get_name()} to {material_property}")


def scalar(material, name: str, value: float, x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        x,
        y,
        f"SHI reviewed blockout {name}; retune only through recorded council lookdev.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", "Council Blockout Response")
    return node


def vector(material, value: tuple[float, float, float], x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionVectorParameter,
        x,
        y,
        "Reviewed texture-free identity palette; no historical dye, fabric, skin, or portrait claim.",
    )
    node.set_editor_property("parameter_name", "BaseColor")
    node.set_editor_property(
        "default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0)
    )
    node.set_editor_property("group", "Council Blockout Response")
    return node


def author_material(material, values: dict) -> None:
    for node in list(unreal.MaterialEditingLibrary.get_material_expressions(material)):
        unreal.MaterialEditingLibrary.delete_material_expression(material, node)
    material.set_editor_property("two_sided", False)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT)
    material.set_editor_property("used_with_skeletal_mesh", True)

    color = vector(material, values["BaseColor"], -520, -150)
    roughness = scalar(material, "Roughness", values["Roughness"], -520, -20)
    specular = scalar(material, "Specular", values["Specular"], -520, 100)
    connect_output(color, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)


def class_name(value) -> str | None:
    return value.get_class().get_name() if value else None


def inspect_material(name: str, material) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    parameters = {}
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(
                node.get_editor_property("default_value")
            )
        elif isinstance(node, unreal.MaterialExpressionVectorParameter):
            value = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [
                float(value.r), float(value.g), float(value.b), float(value.a)
            ]

    expected = REVIEWED[name]
    parameter_match = set(parameters) == set(expected)
    if parameter_match:
        for parameter_name, expected_value in expected.items():
            actual = parameters[parameter_name]
            if isinstance(expected_value, tuple):
                parameter_match &= all(
                    abs(actual[index] - expected_value[index]) <= 1.0e-5 for index in range(3)
                ) and abs(actual[3] - 1.0) <= 1.0e-5
            else:
                parameter_match &= abs(actual - expected_value) <= 1.0e-5

    color_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_BASE_COLOR
    )
    roughness_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_ROUGHNESS
    )
    specular_input = unreal.MaterialEditingLibrary.get_material_property_input_node(
        material, unreal.MaterialProperty.MP_SPECULAR
    )
    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    classes = [class_name(node) for node in expressions]
    expected_path = f"{DESTINATION}/{name}.{name}"
    checks = {
        "exactAsset": material.get_path_name() == expected_path,
        "opaqueDefaultLitSingleSided": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("shading_model") == unreal.MaterialShadingModel.MSM_DEFAULT_LIT
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "skeletalMeshUsage": bool(material.get_editor_property("used_with_skeletal_mesh")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNT,
        "exactGraphClasses": classes.count("MaterialExpressionVectorParameter") == 1
        and classes.count("MaterialExpressionScalarParameter") == 2,
        "exactReviewedParameters": parameter_match,
        "baseColorOutput": class_name(color_input) == "MaterialExpressionVectorParameter",
        "roughnessOutput": class_name(roughness_input) == "MaterialExpressionScalarParameter",
        "specularOutput": class_name(specular_input) == "MaterialExpressionScalarParameter",
        "noTextureNormalEmissiveOpacityOrDisplacementPretence": not unreal.MaterialEditingLibrary.get_material_used_textures(material)
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_NORMAL) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_EMISSIVE_COLOR) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_OPACITY) is None
        and unreal.MaterialEditingLibrary.get_material_property_input_node(material, unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET) is None,
        "compileClean": not compile_errors,
    }
    repairable_graph = len(expressions) <= 4 and checks["exactAsset"] \
        and checks["opaqueDefaultLitSingleSided"] and checks["exactGraphClasses"] \
        and checks["exactReviewedParameters"] and checks["baseColorOutput"] \
        and checks["roughnessOutput"] and checks["specularOutput"] \
        and checks["noTextureNormalEmissiveOpacityOrDisplacementPretence"] and checks["compileClean"]
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
    repository = project_dir.parents[1]
    author_enabled = os.environ.get("SHI_DAZE_COUNCIL_AUTHOR_MATERIALS") == "1"
    materials = {}
    for name in REVIEWED:
        material = unreal.EditorAssetLibrary.load_asset(f"{DESTINATION}/{name}")
        if not isinstance(material, unreal.Material):
            raise RuntimeError(f"Exact isolated council material is unavailable: {name}")
        if author_enabled:
            existing = inspect_material(name, material)
            if not (existing["importFallbackBaseline"] or existing["repairableReviewedGraph"]):
                raise RuntimeError(f"{name} is neither import fallback nor reviewed council graph")
            author_material(material, REVIEWED[name])
        materials[name] = material

    report = {
        "assetId": ASSET_ID,
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "historicalClaim": "production blockout palette only; no exact dye, fabric, complexion, or portrait reconstruction",
        "materials": {name: inspect_material(name, material) for name, material in materials.items()},
    }
    report["passed"] = len(report["materials"]) == 14 and all(
        item["passed"] for item in report["materials"].values()
    )
    if author_enabled:
        for name, material in materials.items():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {name}")
            asset_file = project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncil" / f"{name}.uasset"
            report["materials"][name]["file"] = str(asset_file.relative_to(repository))
            report["materials"][name]["bytes"] = asset_file.stat().st_size
            report["materials"][name]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-council-character-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_COUNCIL_MATERIALS_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError("Daze council blockout materials are not admitted")


main()
