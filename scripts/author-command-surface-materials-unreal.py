"""Author or inspect SHI's isolated Unreal command-surface materials.

The default mode is read-only. Set SHI_COMMAND_SURFACE_AUTHOR_MATERIALS=1 only
for the exact imported fallback pair or a previously admitted authored pair.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


DESTINATION = "/Game/SHI/Art/Environment/CommandSurface"
MATERIAL_PATHS = {
    "earth": f"{DESTINATION}/M_SHI_WetPackedEarth",
    "wood": f"{DESTINATION}/M_SHI_DarkWorkedWood",
}
EXPECTED_NODE_COUNTS = {"earth": 10, "wood": 10}
REVIEWED_PARAMETER_VALUES = {
    "earth": {
        "EarthShadow": (0.012, 0.005, 0.002),
        "EarthFirelit": (0.060, 0.022, 0.006),
        "EarthRoughnessLow": 0.68,
        "EarthRoughnessHigh": 0.90,
        "EarthMetallic": 0.0,
        "EarthSpecular": 0.20,
        "EarthAmbientOcclusion": 0.92,
    },
    "wood": {
        "WoodShadow": (0.007, 0.003, 0.001),
        "WoodWarm": (0.038, 0.014, 0.004),
        "WoodRoughnessLow": 0.76,
        "WoodRoughnessHigh": 0.91,
        "WoodMetallic": 0.0,
        "WoodSpecular": 0.22,
        "WoodAmbientOcclusion": 0.90,
    },
}
EXPECTED_OUTPUTS = {
    "baseColor": (unreal.MaterialProperty.MP_BASE_COLOR, "MaterialExpressionLinearInterpolate"),
    "roughness": (unreal.MaterialProperty.MP_ROUGHNESS, "MaterialExpressionLinearInterpolate"),
    "metallic": (unreal.MaterialProperty.MP_METALLIC, "MaterialExpressionScalarParameter"),
    "specular": (unreal.MaterialProperty.MP_SPECULAR, "MaterialExpressionScalarParameter"),
    "ambientOcclusion": (unreal.MaterialProperty.MP_AMBIENT_OCCLUSION, "MaterialExpressionScalarParameter"),
}


def connect(source, output_name: str, target, input_name: str) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_expressions(
        source, output_name, target, input_name
    ):
        raise RuntimeError(
            f"Could not connect {source.get_name()}.{output_name} to {target.get_name()}.{input_name}"
        )


def connect_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(
        source, output_name, material_property
    ):
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
        f"SHI reviewed {name}; tune only through a recorded surface lookdev pass.",
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
        f"SHI reviewed linear {name}; no baked light, glyph or map texture.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property(
        "default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0)
    )
    node.set_editor_property("group", "Surface Color")
    return node


def configure_noise(node, scale: float) -> None:
    noise_enum = getattr(unreal, "NoiseFunction", None)
    fast_gradient = (
        getattr(noise_enum, "NOISEFUNCTION_GRADIENT_TEX3D", None) if noise_enum else None
    )
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


def author_material(role: str, material) -> None:
    prepare_material(material)
    values = REVIEWED_PARAMETER_VALUES[role]
    prefix = "Earth" if role == "earth" else "Wood"

    noise = expression(
        material,
        unreal.MaterialExpressionNoise,
        -820,
        30,
        "Two-octave broad campaign-earth variation." if role == "earth"
        else "Two-octave broad timber variation; quiet enough to avoid decorative noise.",
    )
    configure_noise(noise, 0.025 if role == "earth" else 2.2)
    dark = vector_parameter(material, f"{prefix}Shadow", values[f"{prefix}Shadow"], -760, -240)
    warm_name = f"{prefix}Firelit" if role == "earth" else f"{prefix}Warm"
    warm = vector_parameter(material, warm_name, values[warm_name], -760, -130)
    color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -380,
        -170,
        "Dark irregular packed earth without cartographic marks." if role == "earth"
        else "Dark worked timber perimeter without lacquer-fantasy gloss.",
    )
    connect(dark, "RGB", color, "A")
    connect(warm, "RGB", color, "B")
    connect(noise, "", color, "Alpha")

    rough_low = scalar_parameter(material, f"{prefix}RoughnessLow", values[f"{prefix}RoughnessLow"], -720, 200)
    rough_high = scalar_parameter(material, f"{prefix}RoughnessHigh", values[f"{prefix}RoughnessHigh"], -720, 290)
    roughness = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -360,
        235,
        "Broad response variation; no counterfeit micro-normal detail.",
    )
    connect(rough_low, "", roughness, "A")
    connect(rough_high, "", roughness, "B")
    connect(noise, "", roughness, "Alpha")

    metallic = scalar_parameter(material, f"{prefix}Metallic", values[f"{prefix}Metallic"], -310, 390)
    specular = scalar_parameter(material, f"{prefix}Specular", values[f"{prefix}Specular"], -310, 480)
    occlusion = scalar_parameter(
        material, f"{prefix}AmbientOcclusion", values[f"{prefix}AmbientOcclusion"], -310, 570
    )
    connect_output(color, "", unreal.MaterialProperty.MP_BASE_COLOR)
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
    texture_coordinates = []
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
        elif isinstance(node, unreal.MaterialExpressionNoise):
            noise_settings.append({
                "scale": float(node.get_editor_property("scale")),
                "quality": int(node.get_editor_property("quality")),
                "function": str(node.get_editor_property("noise_function")),
                "levels": int(node.get_editor_property("levels")),
                "turbulence": bool(node.get_editor_property("turbulence")),
            })
        elif isinstance(node, unreal.MaterialExpressionTextureCoordinate):
            texture_coordinates.append({
                "coordinateIndex": int(node.get_editor_property("coordinate_index")),
                "uTiling": float(node.get_editor_property("u_tiling")),
                "vTiling": float(node.get_editor_property("v_tiling")),
            })

    outputs = {}
    output_checks = {}
    for label, (material_property, expected_class) in EXPECTED_OUTPUTS.items():
        source = unreal.MaterialEditingLibrary.get_material_property_input_node(material, material_property)
        source_class = class_name(source)
        outputs[label] = {"class": source_class}
        output_checks[label] = source_class == expected_class
    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    expected_parameters = REVIEWED_PARAMETER_VALUES[role]
    parameter_names_match = set(parameters) == set(expected_parameters)
    parameter_values_match = parameter_names_match
    if parameter_values_match:
        for name, expected in expected_parameters.items():
            actual = parameters[name]
            expected_values = [*expected, 1.0] if isinstance(expected, tuple) else expected
            if isinstance(expected_values, list):
                parameter_values_match &= all(abs(actual[i] - expected_values[i]) <= 1e-5 for i in range(4))
            else:
                parameter_values_match &= abs(actual - expected_values) <= 1e-5
    checks = {
        "exactAsset": material.get_path_name()
        == f"{MATERIAL_PATHS[role]}.{Path(MATERIAL_PATHS[role]).name}",
        "opaqueOneSidedSurface": material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("material_domain") == unreal.MaterialDomain.MD_SURFACE
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNTS[role],
        "oneBoundedFastNoise": len(noise_settings) == 1
        and noise_settings[0]["quality"] == 1 and noise_settings[0]["levels"] == 2
        and "GRADIENT_TEX3D" in noise_settings[0]["function"].upper()
        and not noise_settings[0]["turbulence"],
        "noHiddenCoordinateInputs": not texture_coordinates,
        "exactReviewedParameters": parameter_values_match,
        "allPbrOutputs": all(output_checks.values()),
        "noNormalPretence": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_NORMAL
        ) is None,
        "noTextures": not unreal.MaterialEditingLibrary.get_material_used_textures(material),
        "compileClean": not compile_errors,
    }
    return {
        "assetPath": material.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": classes,
        "parameters": parameters,
        "noise": noise_settings,
        "textureCoordinates": texture_coordinates,
        "outputs": outputs,
        "compileErrors": [str(error) for error in compile_errors],
        "importFallbackBaseline": len(expressions) == 1
        and classes == ["MaterialExpressionVectorParameter"] and list(parameters.keys()) == ["Param"],
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
            node.set_editor_property(
                "default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0)
            )
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

    author_enabled = os.environ.get("SHI_COMMAND_SURFACE_AUTHOR_MATERIALS") == "1"
    if author_enabled:
        existing = {role: inspect_material(role, material) for role, material in materials.items()}
        if all(entry["passed"] for entry in existing.values()):
            for role, material in materials.items():
                retune_authored_material(role, material)
        elif all(entry["importFallbackBaseline"] for entry in existing.values()):
            for role, material in materials.items():
                author_material(role, material)
        else:
            raise RuntimeError("Command-surface material state is neither exact import fallback nor reviewed graph")

    report = {
        "assetId": "shi-command-surface-v1",
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "materials": {role: inspect_material(role, material) for role, material in materials.items()},
    }
    report["passed"] = all(entry["passed"] for entry in report["materials"].values())
    if author_enabled and not report["passed"]:
        raise RuntimeError(f"Authored command-surface material contract failed: {report}")
    if author_enabled:
        for material in materials.values():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        content_root = project_dir / "Content" / "SHI" / "Art" / "Environment" / "CommandSurface"
        for role, asset_path in MATERIAL_PATHS.items():
            asset_file = content_root / f"{Path(asset_path).name}.uasset"
            report["materials"][role]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
            report["materials"][role]["bytes"] = asset_file.stat().st_size
            report["materials"][role]["sha256"] = sha256(asset_file)
    report_path = project_dir / "Saved" / "Automation" / "shi-command-surface-unreal-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    unreal.log(f"SHI_COMMAND_SURFACE_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not author_enabled and not report["passed"]:
        raise RuntimeError("Existing command-surface materials failed read-only inspection")


main()
