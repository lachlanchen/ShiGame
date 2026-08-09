"""Author or inspect SHI's isolated Unreal command-weight material graphs.

The default mode is read-only inspection. Set SHI_COMMAND_WEIGHT_AUTHOR_MATERIALS=1
only for an intentional replacement of the two exact imported fallback materials.
"""

import hashlib
import json
import os
from pathlib import Path

import unreal


DESTINATION = "/Game/SHI/Art/Props/CommandWeight"
MATERIAL_PATHS = {
    "stone": f"{DESTINATION}/M_SHI_RiverStone",
    "bronze": f"{DESTINATION}/M_SHI_WorkedBronze",
}
EXPECTED_NODE_COUNTS = {"stone": 10, "bronze": 14}
REVIEWED_PARAMETER_VALUES = {
    "stone": {
        "StoneDark": (0.022, 0.015, 0.011),
        "StoneWarm": (0.075, 0.045, 0.025),
        "StoneRoughnessLow": 0.83,
        "StoneRoughnessHigh": 0.96,
        "StoneMetallic": 0.0,
        "StoneSpecular": 0.24,
        "StoneAmbientOcclusion": 0.92,
    },
    "bronze": {
        "BronzeWorked": (0.075, 0.031, 0.009),
        "BronzePatina": (0.012, 0.060, 0.038),
        "BronzePatinaAmount": 0.32,
        "BronzeRoughnessLow": 0.55,
        "BronzeRoughnessHigh": 0.82,
        "BronzeMetallic": 0.88,
        "BronzePatinaMetallic": 0.48,
        "BronzeSpecular": 0.38,
        "BronzeAmbientOcclusion": 0.94,
    },
}
EXPECTED_OUTPUTS = {
    "baseColor": (unreal.MaterialProperty.MP_BASE_COLOR, "MaterialExpressionLinearInterpolate"),
    "roughness": (unreal.MaterialProperty.MP_ROUGHNESS, "MaterialExpressionLinearInterpolate"),
    "metallic": (unreal.MaterialProperty.MP_METALLIC, None),
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


def scalar_parameter(material, name: str, value: float, x: int, y: int, group: str):
    node = expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        x,
        y,
        f"SHI authored {name}; tune only through reviewed material iteration.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", group)
    return node


def vector_parameter(material, name: str, value: tuple[float, float, float], x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionVectorParameter,
        x,
        y,
        f"SHI authored linear {name}; no baked lighting or generated color field.",
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
        raise RuntimeError("UE 5.8 Fast Gradient 3D noise enum is unavailable; refusing a costly fallback")
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


def retune_authored_material(role: str, material) -> None:
    expected = REVIEWED_PARAMETER_VALUES[role]
    seen = set()
    for node in unreal.MaterialEditingLibrary.get_material_expressions(material):
        if not isinstance(
            node, (unreal.MaterialExpressionScalarParameter, unreal.MaterialExpressionVectorParameter)
        ):
            continue
        name = str(node.get_editor_property("parameter_name"))
        if name not in expected or name in seen:
            continue
        value = expected[name]
        if isinstance(node, unreal.MaterialExpressionScalarParameter) and isinstance(value, float):
            node.set_editor_property("default_value", value)
        elif isinstance(node, unreal.MaterialExpressionVectorParameter) and isinstance(value, tuple):
            node.set_editor_property(
                "default_value", unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=1.0)
            )
        else:
            raise RuntimeError(f"Reviewed parameter type drifted: {role}.{name}")
        seen.add(name)
    if seen != set(expected):
        raise RuntimeError(
            f"Reviewed authored parameter set drifted for {role}: expected {sorted(expected)}, found {sorted(seen)}"
        )


def author_stone(material) -> None:
    prepare_material(material)
    noise = expression(
        material,
        unreal.MaterialExpressionNoise,
        -820,
        40,
        "Two-octave broad river-stone variation; no leather pores, scales or written marks.",
    )
    configure_noise(noise, 0.12)

    dark = vector_parameter(material, "StoneDark", (0.022, 0.015, 0.011), -760, -240)
    warm = vector_parameter(material, "StoneWarm", (0.075, 0.045, 0.025), -760, -130)
    color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -380,
        -170,
        "Broad charcoal-brown variation without a baked studio highlight.",
    )
    connect(dark, "RGB", color, "A")
    connect(warm, "RGB", color, "B")
    connect(noise, "", color, "Alpha")

    rough_low = scalar_parameter(material, "StoneRoughnessLow", 0.83, -720, 190, "Surface Response")
    rough_high = scalar_parameter(material, "StoneRoughnessHigh", 0.96, -720, 280, "Surface Response")
    roughness = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -360,
        235,
        "High roughness with shallow handling variation.",
    )
    connect(rough_low, "", roughness, "A")
    connect(rough_high, "", roughness, "B")
    connect(noise, "", roughness, "Alpha")

    metallic = scalar_parameter(material, "StoneMetallic", 0.0, -310, 390, "Surface Response")
    specular = scalar_parameter(material, "StoneSpecular", 0.24, -310, 480, "Surface Response")
    occlusion = scalar_parameter(material, "StoneAmbientOcclusion", 0.92, -310, 570, "Surface Response")

    connect_output(color, "", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(roughness, "", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    connect_output(occlusion, "", unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)


def author_bronze(material) -> None:
    prepare_material(material)
    noise = expression(
        material,
        unreal.MaterialExpressionNoise,
        -900,
        40,
        "Two-octave restrained worked-bronze variation; no fantasy-gold polish.",
    )
    configure_noise(noise, 0.82)
    patina_amount = scalar_parameter(material, "BronzePatinaAmount", 0.32, -720, 150, "Surface Response")
    patina_mask = expression(
        material,
        unreal.MaterialExpressionMultiply,
        -510,
        75,
        "Restrains green oxidation to a minority of the worked surface.",
    )
    connect(noise, "", patina_mask, "A")
    connect(patina_amount, "", patina_mask, "B")

    bronze = vector_parameter(material, "BronzeWorked", (0.075, 0.031, 0.009), -790, -250)
    patina = vector_parameter(material, "BronzePatina", (0.012, 0.060, 0.038), -790, -140)
    color = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -280,
        -170,
        "Dark worked bronze with oxidation held below ornamental green.",
    )
    connect(bronze, "RGB", color, "A")
    connect(patina, "RGB", color, "B")
    connect(patina_mask, "", color, "Alpha")

    rough_low = scalar_parameter(material, "BronzeRoughnessLow", 0.55, -720, 300, "Surface Response")
    rough_high = scalar_parameter(material, "BronzeRoughnessHigh", 0.82, -720, 390, "Surface Response")
    roughness = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -280,
        320,
        "Hammered handling variation stays rough and never mirror-polished.",
    )
    connect(rough_low, "", roughness, "A")
    connect(rough_high, "", roughness, "B")
    connect(noise, "", roughness, "Alpha")

    metal_clean = scalar_parameter(material, "BronzeMetallic", 0.88, -720, 500, "Surface Response")
    metal_patina = scalar_parameter(material, "BronzePatinaMetallic", 0.48, -720, 590, "Surface Response")
    metallic = expression(
        material,
        unreal.MaterialExpressionLinearInterpolate,
        -280,
        520,
        "Oxidized areas lose metallic response without becoming painted plastic.",
    )
    connect(metal_clean, "", metallic, "A")
    connect(metal_patina, "", metallic, "B")
    connect(patina_mask, "", metallic, "Alpha")
    specular = scalar_parameter(material, "BronzeSpecular", 0.38, -250, 650, "Surface Response")
    occlusion = scalar_parameter(material, "BronzeAmbientOcclusion", 0.94, -250, 740, "Surface Response")

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
    for node in expressions:
        if isinstance(node, unreal.MaterialExpressionScalarParameter):
            parameters[str(node.get_editor_property("parameter_name"))] = float(
                node.get_editor_property("default_value")
            )
        elif isinstance(node, unreal.MaterialExpressionVectorParameter):
            value = node.get_editor_property("default_value")
            parameters[str(node.get_editor_property("parameter_name"))] = [
                float(value.r),
                float(value.g),
                float(value.b),
                float(value.a),
            ]
        elif isinstance(node, unreal.MaterialExpressionNoise):
            noise_settings.append(
                {
                    "scale": float(node.get_editor_property("scale")),
                    "quality": int(node.get_editor_property("quality")),
                    "function": str(node.get_editor_property("noise_function")),
                    "levels": int(node.get_editor_property("levels")),
                    "turbulence": bool(node.get_editor_property("turbulence")),
                }
            )

    outputs = {}
    output_checks = {}
    for label, (material_property, expected_class) in EXPECTED_OUTPUTS.items():
        source = unreal.MaterialEditingLibrary.get_material_property_input_node(material, material_property)
        source_class = class_name(source)
        outputs[label] = {
            "class": source_class,
            "output": str(
                unreal.MaterialEditingLibrary.get_material_property_input_node_output_name(
                    material, material_property
                )
            ),
        }
        output_checks[label] = source_class is not None and (
            expected_class is None or source_class == expected_class
        )

    compile_errors = list(unreal.MaterialEditingLibrary.recompile_material(material)) if expressions else []
    checks = {
        "exactAsset": material.get_path_name() == f"{MATERIAL_PATHS[role]}.{Path(MATERIAL_PATHS[role]).name}",
        "opaqueOneSidedSurface": (
            material.get_editor_property("blend_mode") == unreal.BlendMode.BLEND_OPAQUE
            and material.get_editor_property("material_domain") == unreal.MaterialDomain.MD_SURFACE
            and not bool(material.get_editor_property("two_sided"))
            and not bool(material.get_editor_property("use_material_attributes"))
        ),
        "exactNodeCount": len(expressions) == EXPECTED_NODE_COUNTS[role],
        "oneBoundedFastNoise": (
            len(noise_settings) == 1
            and noise_settings[0]["quality"] == 1
            and noise_settings[0]["levels"] == 2
            and "GRADIENT_TEX3D" in noise_settings[0]["function"].upper()
            and not noise_settings[0]["turbulence"]
        ),
        "allPbrOutputs": all(output_checks.values()),
        "noNormalPretence": unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, unreal.MaterialProperty.MP_NORMAL
        )
        is None,
        "compileClean": not compile_errors,
    }
    return {
        "assetPath": material.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": classes,
        "parameters": parameters,
        "noise": noise_settings,
        "outputs": outputs,
        "usedTextures": [
            texture.get_path_name()
            for texture in unreal.MaterialEditingLibrary.get_material_used_textures(material)
        ],
        "compileErrors": [str(error) for error in compile_errors],
        "importFallbackBaseline": (
            len(expressions) == 1
            and classes == ["MaterialExpressionVectorParameter"]
            and list(parameters.keys()) == ["Param"]
        ),
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
    for role, asset_path in MATERIAL_PATHS.items():
        material = unreal.EditorAssetLibrary.load_asset(asset_path)
        if not isinstance(material, unreal.Material):
            raise RuntimeError(f"Exact isolated material is unavailable: {asset_path}")
        materials[role] = material

    author_enabled = os.environ.get("SHI_COMMAND_WEIGHT_AUTHOR_MATERIALS") == "1"
    if author_enabled:
        existing = {role: inspect_material(role, material) for role, material in materials.items()}
        if all(entry["passed"] for entry in existing.values()):
            for role, material in materials.items():
                retune_authored_material(role, material)
        elif all(entry["importFallbackBaseline"] for entry in existing.values()):
            author_stone(materials["stone"])
            author_bronze(materials["bronze"])
        else:
            raise RuntimeError(
                "Command-weight material state is neither the exact import fallback nor the reviewed authored graph"
            )

    report = {
        "assetId": "shi-command-weight-v1",
        "mode": "author-exact-materials" if author_enabled else "inspect-only",
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "materials": {
            role: inspect_material(role, material) for role, material in materials.items()
        },
    }
    report["passed"] = all(entry["passed"] for entry in report["materials"].values())
    if author_enabled and not report["passed"]:
        raise RuntimeError(f"Authored command-weight material contract failed: {report}")

    if author_enabled:
        for material in materials.values():
            if not unreal.EditorAssetLibrary.save_loaded_asset(material, only_if_is_dirty=False):
                raise RuntimeError(f"Could not save exact authored material: {material.get_path_name()}")
        content_root = project_dir / "Content" / "SHI" / "Art" / "Props" / "CommandWeight"
        for role, asset_path in MATERIAL_PATHS.items():
            asset_file = content_root / f"{Path(asset_path).name}.uasset"
            report["materials"][role]["file"] = str(asset_file.relative_to(project_dir.parents[1]))
            report["materials"][role]["bytes"] = asset_file.stat().st_size
            report["materials"][role]["sha256"] = sha256(asset_file)

    report_path = project_dir / "Saved" / "Automation" / "shi-command-weight-unreal-materials.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    unreal.log(f"SHI_COMMAND_WEIGHT_MATERIAL_REPORT {json.dumps(report, sort_keys=True)}")
    if not author_enabled and not all(
        entry["importFallbackBaseline"] for entry in report["materials"].values()
    ) and not report["passed"]:
        raise RuntimeError("Existing authored command-weight materials failed read-only inspection")


main()
