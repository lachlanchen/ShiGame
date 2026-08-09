"""Author or inspect SHI's isolated Unreal Daze field-shelter materials.

The default mode is read-only. Set SHI_DAZE_FIELD_SHELTER_AUTHOR_MATERIALS=1
only for the exact imported fallbacks or a previously admitted authored set.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


DESTINATION = "/Game/SHI/Art/Environment/DazeShelter"
MATERIAL_PATHS = {
    "wood": f"{DESTINATION}/M_SHI_RainDarkenedWood",
    "reed": f"{DESTINATION}/M_SHI_WovenReedMat",
    "cord": f"{DESTINATION}/M_SHI_CoarseFiberCord",
}
EXPECTED_NODE_COUNTS = {"wood": 8, "reed": 11, "cord": 8}
REVIEWED_PARAMETER_VALUES = {
    "wood": {
        "WoodShadow": (0.0030, 0.0015, 0.0007),
        "WoodDamp": (0.0180, 0.0070, 0.0020),
        "WoodRoughness": 0.84,
        "WoodMetallic": 0.0,
        "WoodSpecular": 0.22,
        "WoodAmbientOcclusion": 0.88,
    },
    "reed": {
        "ReedShadow": (0.0120, 0.0070, 0.0017),
        "ReedDamp": (0.0520, 0.0310, 0.0070),
        "ReedPanelLift": (0.0850, 0.0500, 0.0120),
        "ReedRoughness": 0.89,
        "ReedMetallic": 0.0,
        "ReedSpecular": 0.18,
        "ReedAmbientOcclusion": 0.92,
    },
    "cord": {
        "CordShadow": (0.0020, 0.0010, 0.0005),
        "CordDamp": (0.0120, 0.0060, 0.0020),
        "CordRoughness": 0.93,
        "CordMetallic": 0.0,
        "CordSpecular": 0.15,
        "CordAmbientOcclusion": 0.86,
    },
}
NOISE_SCALE = {"wood": 0.035, "reed": 0.018, "cord": 0.080}


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
        material,
        unreal.MaterialExpressionScalarParameter,
        x,
        y,
        f"SHI reviewed {name}; retune only through a recorded shelter lookdev pass.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", "Surface Response")
    return node


def vector_parameter(material, name: str, value: tuple[float, float, float], x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionVectorParameter,
        x,
        y,
        f"SHI reviewed linear {name}; no baked light or fabricated historical marking.",
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


def connect_surface_response(material, role: str, base_color) -> None:
    title = role.title()
    values = REVIEWED_PARAMETER_VALUES[role]
    roughness = scalar_parameter(material, f"{title}Roughness", values[f"{title}Roughness"], -220, 60)
    metallic = scalar_parameter(material, f"{title}Metallic", values[f"{title}Metallic"], -220, 150)
    specular = scalar_parameter(material, f"{title}Specular", values[f"{title}Specular"], -220, 240)
    occlusion = scalar_parameter(
        material, f"{title}AmbientOcclusion", values[f"{title}AmbientOcclusion"], -220, 330
    )
    connect_output(base_color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    connect_output(occlusion, "", unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)


def author_two_tone(material, role: str) -> None:
    prepare_material(material)
    title = role.title()
    values = REVIEWED_PARAMETER_VALUES[role]
    noise = expression(
        material,
        unreal.MaterialExpressionNoise,
        -900,
        -120,
        "Two-octave broad damp variation; no counterfeit carved or fibrous normal detail.",
    )
    configure_noise(noise, NOISE_SCALE[role])
    shadow = vector_parameter(material, f"{title}Shadow", values[f"{title}Shadow"], -760, -350)
    damp = vector_parameter(material, f"{title}Damp", values[f"{title}Damp"], -760, -250)
    color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -410,
        -250,
        "Restrained wet response at architectural scale.",
    )
    connect(shadow, "RGB", color, "A")
    connect(damp, "RGB", color, "B")
    connect(noise, "", color, "Alpha")
    connect_surface_response(material, role, color)


def author_reed(material) -> None:
    prepare_material(material)
    values = REVIEWED_PARAMETER_VALUES["reed"]
    noise = expression(
        material,
        unreal.MaterialExpressionNoise,
        -980,
        -160,
        "Broad rain-darkened mat variation; deliberately no false micro-normal weave.",
    )
    configure_noise(noise, NOISE_SCALE["reed"])
    vertex_color = expression(
        material,
        unreal.MaterialExpressionVertexColor,
        -980,
        70,
        "Source red carries subtle panel-to-panel reed variation; it is not a historical marking.",
    )
    shadow = vector_parameter(material, "ReedShadow", values["ReedShadow"], -820, -420)
    damp = vector_parameter(material, "ReedDamp", values["ReedDamp"], -820, -320)
    panel_lift = vector_parameter(material, "ReedPanelLift", values["ReedPanelLift"], -820, -220)
    broad_color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -500,
        -330,
        "Large-scale damp variation preserves a subdued reed read.",
    )
    final_color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -250,
        -250,
        "Low-amplitude authored panel signal breaks uniform tarp-like repetition.",
    )
    connect(shadow, "RGB", broad_color, "A")
    connect(damp, "RGB", broad_color, "B")
    connect(noise, "", broad_color, "Alpha")
    connect(broad_color, "", final_color, "A")
    connect(panel_lift, "RGB", final_color, "B")
    connect(vertex_color, "R", final_color, "Alpha")
    connect_surface_response(material, "reed", final_color)


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

    output_properties = {
        "baseColor": unreal.MaterialProperty.MP_BASE_COLOR,
        "roughness": unreal.MaterialProperty.MP_ROUGHNESS,
        "metallic": unreal.MaterialProperty.MP_METALLIC,
        "specular": unreal.MaterialProperty.MP_SPECULAR,
        "ambientOcclusion": unreal.MaterialProperty.MP_AMBIENT_OCCLUSION,
    }
    expected_base_class = "MaterialExpressionLinearInterpolate"
    expected_output_classes = {
        "baseColor": expected_base_class,
        "roughness": "MaterialExpressionScalarParameter",
        "metallic": "MaterialExpressionScalarParameter",
        "specular": "MaterialExpressionScalarParameter",
        "ambientOcclusion": "MaterialExpressionScalarParameter",
    }
    outputs = {}
    output_checks = {}
    for label, material_property in output_properties.items():
        source = unreal.MaterialEditingLibrary.get_material_property_input_node(material, material_property)
        source_class = class_name(source)
        outputs[label] = {"class": source_class}
        output_checks[label] = source_class == expected_output_classes[label]

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

    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    checks = {
        "exactAsset": material.get_path_name() == f"{MATERIAL_PATHS[role]}.{Path(MATERIAL_PATHS[role]).name}",
        "opaqueOneSidedSurface": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("material_domain") == unreal.MaterialDomain.MD_SURFACE
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNTS[role],
        "noiseContract": len(noise_settings) == 1
        and abs(noise_settings[0]["scale"] - NOISE_SCALE[role]) <= 1e-5
        and noise_settings[0]["quality"] == 1
        and noise_settings[0]["levels"] == 2
        and "GRADIENT_TEX3D" in noise_settings[0]["function"].upper()
        and not noise_settings[0]["turbulence"],
        "vertexPanelSignal": len(vertex_colors) == 1 if role == "reed" else not vertex_colors,
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
        "importFallbackBaseline": len(expressions) <= 1
        and all(name == "MaterialExpressionVectorParameter" for name in classes),
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

    author_enabled = os.environ.get("SHI_DAZE_FIELD_SHELTER_AUTHOR_MATERIALS") == "1"
    if author_enabled:
        existing = {role: inspect_material(role, material) for role, material in materials.items()}
        if all(entry["reviewedGraph"] for entry in existing.values()):
            for role, material in materials.items():
                retune_authored_material(role, material)
        elif all(entry["importFallbackBaseline"] for entry in existing.values()):
            author_two_tone(materials["wood"], "wood")
            author_reed(materials["reed"])
            author_two_tone(materials["cord"], "cord")
        else:
            raise RuntimeError("Daze shelter material state is neither exact import fallback nor reviewed graph")

    report = {
        "assetId": "shi-daze-field-shelter-v1",
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "materials": {role: inspect_material(role, material) for role, material in materials.items()},
    }
    report["passed"] = all(entry["passed"] for entry in report["materials"].values())
    if author_enabled and not report["passed"]:
        raise RuntimeError(f"Authored Daze shelter material contract failed: {report}")
    if author_enabled:
        for material in materials.values():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        content_root = project_dir / "Content" / "SHI" / "Art" / "Environment" / "DazeShelter"
        for role, asset_path in MATERIAL_PATHS.items():
            asset_file = content_root / f"{Path(asset_path).name}.uasset"
            report["materials"][role]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
            report["materials"][role]["bytes"] = asset_file.stat().st_size
            report["materials"][role]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-daze-field-shelter-unreal-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    unreal.log(f"SHI_DAZE_FIELD_SHELTER_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not report["passed"]:
        raise RuntimeError("Daze shelter materials are not admitted; run explicit authoring only after source review")


main()
