"""Author or inspect SHI's isolated Unreal wet-field materials.

The default mode is read-only. Set SHI_FIELD_ENVIRONMENT_AUTHOR_MATERIALS=1
only for the exact imported fallback pair or a previously admitted authored pair.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


DESTINATION = "/Game/SHI/Art/Environment/WetField"
MATERIAL_PATHS = {
    "ground": f"{DESTINATION}/M_SHI_WetFieldGround",
    "water": f"{DESTINATION}/M_SHI_ShallowRainwater",
}
EXPECTED_NODE_COUNTS = {"ground": 15, "water": 5}
REVIEWED_PARAMETER_VALUES = {
    "ground": {
        "FieldShadow": (0.004, 0.006, 0.0055),
        "FieldDamp": (0.025, 0.019, 0.013),
        "RouteShadow": (0.006, 0.008, 0.009),
        "RouteDamp": (0.018, 0.021, 0.020),
        "FieldRoughness": 0.86,
        "RouteRoughness": 0.68,
        "FieldMetallic": 0.0,
        "FieldSpecular": 0.20,
        "FieldAmbientOcclusion": 0.94,
    },
    "water": {
        "RainwaterColor": (0.003, 0.008, 0.009),
        "RainwaterRoughness": 0.10,
        "RainwaterMetallic": 0.0,
        "RainwaterSpecular": 0.50,
        "RainwaterAmbientOcclusion": 1.0,
    },
}


def connect(source, output_name: str, target, input_name: str) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_expressions(source, output_name, target, input_name):
        raise RuntimeError(f"Could not connect {source.get_name()}.{output_name} to {target.get_name()}.{input_name}")


def connect_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(source, output_name, material_property):
        raise RuntimeError(f"Could not connect {source.get_name()} to {material_property}")


def expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material, expression_class.static_class(), node_pos_x=x, node_pos_y=y
    )
    if not node:
        raise RuntimeError(f"Could not create {expression_class} in {material.get_path_name()}")
    node.set_editor_property("desc", description)
    return node


def scalar_parameter(material, name: str, value: float, x: int, y: int):
    node = expression(
        material, unreal.MaterialExpressionScalarParameter, x, y,
        f"SHI reviewed {name}; retune only through a recorded environment lookdev pass.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", "Surface Response")
    return node


def vector_parameter(material, name: str, value: tuple[float, float, float], x: int, y: int):
    node = expression(
        material, unreal.MaterialExpressionVectorParameter, x, y,
        f"SHI reviewed linear {name}; no baked light or fabricated historical mark.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0))
    node.set_editor_property("group", "Surface Color")
    return node


def configure_noise(node, scale: float) -> None:
    noise_enum = getattr(unreal, "NoiseFunction", None)
    fast_gradient = getattr(noise_enum, "NOISEFUNCTION_GRADIENT_TEX3D", None) if noise_enum else None
    if fast_gradient is None:
        raise RuntimeError("UE 5.8 Fast Gradient 3D noise is unavailable; refusing a costly fallback")
    node.set_editor_property("scale", scale)
    node.set_editor_property("quality", 1)
    node.set_editor_property("noise_function", fast_gradient)
    node.set_editor_property("turbulence", False)
    node.set_editor_property("levels", 2)
    node.set_editor_property("output_min", 0.0)
    node.set_editor_property("output_max", 1.0)
    node.set_editor_property("level_scale", 2.0)
    node.set_editor_property("tiling", False)


def prepare_material(material) -> None:
    unreal.MaterialEditingLibrary.delete_all_material_expressions(material)
    material.set_editor_property("two_sided", False)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)


def author_ground(material) -> None:
    prepare_material(material)
    values = REVIEWED_PARAMETER_VALUES["ground"]
    vertex_color = expression(
        material, unreal.MaterialExpressionVertexColor, -1040, 120,
        "Source alpha is the deterministic trampled-route blend; RGB is only a dark interchange fallback.",
    )
    noise = expression(
        material, unreal.MaterialExpressionNoise, -1040, -100,
        "Two-octave broad wet-field variation; no counterfeit micro-normal detail.",
    )
    configure_noise(noise, 0.012)
    field_shadow = vector_parameter(material, "FieldShadow", values["FieldShadow"], -930, -390)
    field_damp = vector_parameter(material, "FieldDamp", values["FieldDamp"], -930, -300)
    route_shadow = vector_parameter(material, "RouteShadow", values["RouteShadow"], -930, -210)
    route_damp = vector_parameter(material, "RouteDamp", values["RouteDamp"], -930, -120)
    field_color = expression(
        material, unreal.MaterialExpressionLinearInterpolate, -570, -340,
        "Low-frequency saturated field-earth response.",
    )
    route_color = expression(
        material, unreal.MaterialExpressionLinearInterpolate, -570, -190,
        "Cooler compacted route response, blended only by source alpha.",
    )
    final_color = expression(
        material, unreal.MaterialExpressionLinearInterpolate, -250, -260,
        "Continuous earth-to-route blend; no floating ribbon or polygon steps.",
    )
    connect(field_shadow, "RGB", field_color, "A")
    connect(field_damp, "RGB", field_color, "B")
    connect(noise, "", field_color, "Alpha")
    connect(route_shadow, "RGB", route_color, "A")
    connect(route_damp, "RGB", route_color, "B")
    connect(noise, "", route_color, "Alpha")
    connect(field_color, "", final_color, "A")
    connect(route_color, "", final_color, "B")
    connect(vertex_color, "A", final_color, "Alpha")

    field_roughness = scalar_parameter(material, "FieldRoughness", values["FieldRoughness"], -650, 130)
    route_roughness = scalar_parameter(material, "RouteRoughness", values["RouteRoughness"], -650, 220)
    roughness = expression(
        material, unreal.MaterialExpressionLinearInterpolate, -300, 170,
        "Route compaction lowers roughness without a normal-map claim.",
    )
    connect(field_roughness, "", roughness, "A")
    connect(route_roughness, "", roughness, "B")
    connect(vertex_color, "A", roughness, "Alpha")
    metallic = scalar_parameter(material, "FieldMetallic", values["FieldMetallic"], -250, 340)
    specular = scalar_parameter(material, "FieldSpecular", values["FieldSpecular"], -250, 430)
    occlusion = scalar_parameter(material, "FieldAmbientOcclusion", values["FieldAmbientOcclusion"], -250, 520)
    connect_output(final_color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    connect_output(occlusion, "", unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)


def author_water(material) -> None:
    prepare_material(material)
    values = REVIEWED_PARAMETER_VALUES["water"]
    color = vector_parameter(material, "RainwaterColor", values["RainwaterColor"], -420, -140)
    roughness = scalar_parameter(material, "RainwaterRoughness", values["RainwaterRoughness"], -420, 0)
    metallic = scalar_parameter(material, "RainwaterMetallic", values["RainwaterMetallic"], -420, 90)
    specular = scalar_parameter(material, "RainwaterSpecular", values["RainwaterSpecular"], -420, 180)
    occlusion = scalar_parameter(material, "RainwaterAmbientOcclusion", values["RainwaterAmbientOcclusion"], -420, 270)
    connect_output(color, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    connect_output(occlusion, "", unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)


def class_name(value) -> str | None:
    return value.get_class().get_name() if value else None


def inspect_material(role: str, material) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    classes = [class_name(node) for node in expressions]
    parameters = {}
    noise_settings = []
    vertex_colors = []
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(node.get_editor_property("default_value"))
        elif isinstance(node, unreal.MaterialExpressionVectorParameter):
            value = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [
                float(value.r), float(value.g), float(value.b), float(value.a)
            ]
        elif isinstance(node, unreal.MaterialExpressionNoise):
            noise_settings.append({
                "scale": float(node.get_editor_property("scale")),
                "quality": int(node.get_editor_property("quality")),
                "function": str(node.get_editor_property("noise_function")),
                "levels": int(node.get_editor_property("levels")),
                "turbulence": bool(node.get_editor_property("turbulence")),
            })
        elif isinstance(node, unreal.MaterialExpressionVertexColor):
            vertex_colors.append(node.get_name())

    expected_output_classes = {
        "ground": {
            "baseColor": "MaterialExpressionLinearInterpolate",
            "roughness": "MaterialExpressionLinearInterpolate",
            "metallic": "MaterialExpressionScalarParameter",
            "specular": "MaterialExpressionScalarParameter",
            "ambientOcclusion": "MaterialExpressionScalarParameter",
        },
        "water": {
            "baseColor": "MaterialExpressionVectorParameter",
            "roughness": "MaterialExpressionScalarParameter",
            "metallic": "MaterialExpressionScalarParameter",
            "specular": "MaterialExpressionScalarParameter",
            "ambientOcclusion": "MaterialExpressionScalarParameter",
        },
    }
    output_properties = {
        "baseColor": unreal.MaterialProperty.MP_BASE_COLOR,
        "roughness": unreal.MaterialProperty.MP_ROUGHNESS,
        "metallic": unreal.MaterialProperty.MP_METALLIC,
        "specular": unreal.MaterialProperty.MP_SPECULAR,
        "ambientOcclusion": unreal.MaterialProperty.MP_AMBIENT_OCCLUSION,
    }
    outputs = {}
    output_checks = {}
    for label, material_property in output_properties.items():
        source = unreal.MaterialEditingLibrary.get_material_property_input_node(material, material_property)
        source_class = class_name(source)
        outputs[label] = {"class": source_class}
        output_checks[label] = source_class == expected_output_classes[role][label]
    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    expected_parameters = REVIEWED_PARAMETER_VALUES[role]
    parameter_values_match = set(parameters) == set(expected_parameters)
    if parameter_values_match:
        for name, expected in expected_parameters.items():
            actual = parameters[name]
            expected_values = [*expected, 1.0] if isinstance(expected, tuple) else expected
            if isinstance(expected_values, list):
                parameter_values_match &= all(abs(actual[index] - expected_values[index]) <= 1e-5 for index in range(4))
            else:
                parameter_values_match &= abs(actual - expected_values) <= 1e-5
    checks = {
        "exactAsset": material.get_path_name() == f"{MATERIAL_PATHS[role]}.{Path(MATERIAL_PATHS[role]).name}",
        "opaqueOneSidedSurface": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("material_domain") == unreal.MaterialDomain.MD_SURFACE
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNTS[role],
        "noiseContract": (
            len(noise_settings) == 1
            and noise_settings[0]["quality"] == 1
            and noise_settings[0]["levels"] == 2
            and "GRADIENT_TEX3D" in noise_settings[0]["function"].upper()
            and not noise_settings[0]["turbulence"]
        ) if role == "ground" else not noise_settings,
        "routeVertexColorContract": len(vertex_colors) == 1 if role == "ground" else not vertex_colors,
        "exactReviewedParameters": parameter_values_match,
        "allPbrOutputs": all(output_checks.values()),
        "noNormalPretence": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_NORMAL
        ) is None,
        "noTextures": not unreal.MaterialEditingLibrary.get_material_used_textures(material),
        "compileClean": not compile_errors,
    }
    reviewed_graph = all(value for name, value in checks.items() if name != "exactReviewedParameters")
    return {
        "assetPath": material.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": classes,
        "parameters": parameters,
        "noise": noise_settings,
        "vertexColors": vertex_colors,
        "outputs": outputs,
        "compileErrors": [str(error) for error in compile_errors],
        "importFallbackBaseline": len(expressions) == 1
        and classes == ["MaterialExpressionVectorParameter"]
        and list(parameters.keys()) == ["Param"],
        "reviewedGraph": reviewed_graph,
        "checks": checks,
        "passed": all(checks.values()),
    }


def retune_authored_material(role: str, material) -> None:
    expected = REVIEWED_PARAMETER_VALUES[role]
    seen = set()
    for node in unreal.MaterialEditingLibrary.get_material_expressions(material):
        if not isinstance(node, (unreal.MaterialExpressionScalarParameter, unreal.MaterialExpressionVectorParameter)):
            continue
        name = str(node.get_editor_property("parameter_name"))
        if name not in expected or name in seen:
            continue
        value = expected[name]
        if isinstance(value, tuple):
            node.set_editor_property("default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0))
        else:
            node.set_editor_property("default_value", value)
        seen.add(name)
    if seen != set(expected):
        raise RuntimeError(f"Reviewed parameter set drifted for {role}: found {sorted(seen)}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    materials = {}
    for role, asset_path in MATERIAL_PATHS.items():
        material = unreal.EditorAssetLibrary.load_asset(asset_path)
        if not isinstance(material, unreal.Material):
            raise RuntimeError(f"Exact isolated material is unavailable: {asset_path}")
        materials[role] = material

    author_enabled = os.environ.get("SHI_FIELD_ENVIRONMENT_AUTHOR_MATERIALS") == "1"
    if author_enabled:
        existing = {role: inspect_material(role, material) for role, material in materials.items()}
        if all(entry["reviewedGraph"] for entry in existing.values()):
            for role, material in materials.items():
                retune_authored_material(role, material)
        elif all(entry["importFallbackBaseline"] for entry in existing.values()):
            author_ground(materials["ground"])
            author_water(materials["water"])
        else:
            raise RuntimeError("Wet-field material state is neither exact import fallback nor reviewed graph")

    report = {
        "assetId": "shi-wet-field-environment-v1",
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "materials": {role: inspect_material(role, material) for role, material in materials.items()},
    }
    report["passed"] = all(entry["passed"] for entry in report["materials"].values())
    if author_enabled and not report["passed"]:
        raise RuntimeError(f"Authored wet-field material contract failed: {report}")
    if author_enabled:
        for material in materials.values():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        content_root = project_dir / "Content" / "SHI" / "Art" / "Environment" / "WetField"
        for role, asset_path in MATERIAL_PATHS.items():
            asset_file = content_root / f"{Path(asset_path).name}.uasset"
            report["materials"][role]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
            report["materials"][role]["bytes"] = asset_file.stat().st_size
            report["materials"][role]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-wet-field-environment-unreal-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    unreal.log(f"SHI_FIELD_ENVIRONMENT_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not author_enabled and not report["passed"]:
        raise RuntimeError("Existing wet-field materials failed read-only inspection")


main()
