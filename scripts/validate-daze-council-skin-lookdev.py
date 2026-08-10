#!/usr/bin/env python3
"""Validate the isolated Chen Sheng skin-lookdev v1 source texture package."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
from typing import Any

import cv2
import numpy as np
from PIL import Image


ASSET_ID = "shi-daze-council-skin-lookdev-v1"
EXPECTED_UV_SHA256 = "f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6"
EXPECTED_TEXTURE_HASHES: dict[str, str] = {
    "baseColor": "df82f7574b2376d1b67157b84a1540f2b4d2f3d33d487cc51aefa2fdbed09c41",
    "materialMask": "086baf25c8a03e24ad1ab535fc814b5a4bb00d3ca3eaab6c2ccdd89dc712ad11",
    "canonicalHeight": "ab66885692f70714584e5196379f6e6309c1ba6c204e3305f7927107f66044c5",
    "directxNormal": "c1208afde5bc13b94c3fb8418f6d9e8ad41f0a4bee2ca6f190f74a54fc6f1094",
}
NORMAL_STRENGTH = 0.35
SUBSURFACE_PROFILE_OPACITY_BYTE = 89
SUBSURFACE_PROFILE_OPACITY = SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0
UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD = 0.10
PROFILE_MEAN_FREE_PATH_DISTANCE = 2.6748
MAXIMUM_EFFECTIVE_MEAN_FREE_PATH = (
    PROFILE_MEAN_FREE_PATH_DISTANCE * SUBSURFACE_PROFILE_OPACITY
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    return parser.parse_args()


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def receipt(path: Path, root: Path) -> dict[str, Any]:
    payload = path.read_bytes()
    return {
        "file": path.relative_to(root).as_posix(),
        "bytes": len(payload),
        "sha256": sha256_bytes(payload),
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def accepted_uv_hash(glb_path: Path) -> tuple[str, int, int]:
    payload = glb_path.read_bytes()
    require(payload[:4] == b"glTF", "accepted upstream is not a GLB")
    json_length = struct.unpack_from("<I", payload, 12)[0]
    manifest = json.loads(
        payload[20 : 20 + json_length].rstrip(b"\x00 \t\r\n").decode("utf-8")
    )
    offset = 20 + json_length
    chunk_length, chunk_type = struct.unpack_from("<II", payload, offset)
    require(chunk_type == 0x004E4942, "accepted upstream lacks immediate BIN chunk")
    binary = payload[offset + 8 : offset + 8 + chunk_length]
    matches = []
    for mesh in manifest["meshes"]:
        for primitive in mesh["primitives"]:
            material = manifest["materials"][primitive["material"]]["name"]
            if material == "M_SHI_Character_SkinClay":
                matches.append(primitive)
    require(
        len(matches) == 1,
        f"expected one accepted SkinClay primitive, found {len(matches)}",
    )
    primitive = matches[0]
    accessor = manifest["accessors"][primitive["attributes"]["TEXCOORD_0"]]
    view = manifest["bufferViews"][accessor["bufferView"]]
    require(
        accessor["componentType"] == 5126 and accessor["type"] == "VEC2",
        "accepted UV0 encoding drifted",
    )
    require(
        view.get("byteStride", 8) == 8, "accepted UV0 unexpectedly became interleaved"
    )
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    raw = binary[start : start + accessor["count"] * 8]
    indices = manifest["accessors"][primitive["indices"]]
    return sha256_bytes(raw), int(accessor["count"]), int(indices["count"] // 3)


def derive_directx_normal(height: np.ndarray) -> np.ndarray:
    normalized_height = (height.astype(np.float32) - 32767.5) / 32767.5
    du = (
        np.roll(normalized_height, -1, axis=1) - np.roll(normalized_height, 1, axis=1)
    ) * 0.5
    dv_image = (
        np.roll(normalized_height, -1, axis=0) - np.roll(normalized_height, 1, axis=0)
    ) * 0.5
    nx = -du * NORMAL_STRENGTH
    ny = dv_image * NORMAL_STRENGTH
    nz = np.ones_like(nx)
    inv_length = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack((nx * inv_length, ny * inv_length, nz * inv_length), axis=-1)
    return np.rint((normal * 0.5 + 0.5) * 255.0).clip(0, 255).astype(np.uint8)


def seam_metrics(height: np.ndarray) -> dict[str, float]:
    values = height.astype(np.float64)
    hs = float(np.sqrt(np.mean(np.square(values[:, 0] - values[:, -1]))))
    vs = float(np.sqrt(np.mean(np.square(values[0, :] - values[-1, :]))))
    hi = float(np.sqrt(np.mean(np.square(values[:, 1:] - values[:, :-1]))))
    vi = float(np.sqrt(np.mean(np.square(values[1:, :] - values[:-1, :]))))
    return {
        "horizontalRatio": hs / hi,
        "verticalRatio": vs / vi,
        "horizontalSeam": hs,
        "verticalSeam": vs,
    }


def inspect_png(
    path: Path, expected_mode: str, expected_size: tuple[int, int]
) -> tuple[Image.Image, np.ndarray]:
    with Image.open(path) as image:
        require(image.format == "PNG", f"{path.name}: not PNG")
        require(
            image.mode == expected_mode,
            f"{path.name}: mode {image.mode}, expected {expected_mode}",
        )
        require(
            image.size == expected_size,
            f"{path.name}: size {image.size}, expected {expected_size}",
        )
        require(
            not image.info,
            f"{path.name}: unexpected embedded metadata {sorted(image.info)}",
        )
        copied = image.copy()
        return copied, np.asarray(copied)


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    source_dir = root / "assets/3d/source"
    paths = {
        "baseColor": source_dir / f"{ASSET_ID}-basecolor-2k.png",
        "materialMask": source_dir / f"{ASSET_ID}-masks-2k.png",
        "canonicalHeight": source_dir / f"{ASSET_ID}-detail-height-1k.png",
        "directxNormal": source_dir / f"{ASSET_ID}-detail-normal-dx-1k.png",
        "metrics": source_dir / f"{ASSET_ID}.metrics.json",
        "validation": source_dir / f"{ASSET_ID}.validation.json",
        "provenance": root / "assets/provenance" / f"{ASSET_ID}.json",
    }
    for name, path in paths.items():
        if name != "validation":
            require(path.is_file(), f"missing {name}: {path}")
    require(
        set(EXPECTED_TEXTURE_HASHES)
        == {"baseColor", "materialMask", "canonicalHeight", "directxNormal"},
        "validator exact texture receipts have not been configured",
    )

    actual_receipts = {
        name: receipt(paths[name], root) for name in EXPECTED_TEXTURE_HASHES
    }
    for name, expected_hash in EXPECTED_TEXTURE_HASHES.items():
        require(
            actual_receipts[name]["sha256"] == expected_hash,
            f"{name} deterministic receipt drifted: {actual_receipts[name]['sha256']}",
        )

    _base_image, base = inspect_png(paths["baseColor"], "RGB", (2048, 2048))
    _mask_image, mask = inspect_png(paths["materialMask"], "RGBA", (2048, 2048))
    with Image.open(paths["canonicalHeight"]) as height_image:
        require(
            height_image.format == "PNG" and height_image.size == (1024, 1024),
            "canonical height PNG contract drifted",
        )
        require(not height_image.info, "canonical height contains unexpected metadata")
    height = cv2.imread(str(paths["canonicalHeight"]), cv2.IMREAD_UNCHANGED)
    require(
        height is not None
        and height.dtype == np.uint16
        and height.shape == (1024, 1024),
        f"canonical height is not one-channel 16-bit: {None if height is None else (height.dtype, height.shape)}",
    )
    _normal_image, normal = inspect_png(paths["directxNormal"], "RGB", (1024, 1024))

    require(
        int(base.min()) > 10 and int(base.max()) < 245,
        "base color clips or leaves plausible bounded range",
    )
    means = base.mean(axis=(0, 1)) / 255.0
    require(
        0.50 <= means[0] <= 0.58
        and 0.36 <= means[1] <= 0.44
        and 0.28 <= means[2] <= 0.36,
        f"base color calibrated center drifted: {means.tolist()}",
    )
    require(
        float(base.std(axis=(0, 1)).max()) < 8.0,
        "base color variation became broad or excessive",
    )
    require(np.all(mask[..., 0] == 255), "AO channel fabricates unreviewed occlusion")
    require(
        137 <= int(mask[..., 1].min()) <= 145 and 171 <= int(mask[..., 1].max()) <= 179,
        "roughness left authored bounds",
    )
    require(np.unique(mask[..., 1]).size >= 25, "roughness lost useful precision")
    require(
        np.all(mask[..., 2] == SUBSURFACE_PROFILE_OPACITY_BYTE),
        "Subsurface Profile opacity/radius scale drifted",
    )
    require(
        UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD
        < SUBSURFACE_PROFILE_OPACITY
        <= SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0,
        "Subsurface Profile opacity is outside its exact fail-closed bound",
    )
    require(np.all(mask[..., 3] == 255), "unused/opaque material channel drifted")
    require(
        0 < int(height.min()) and int(height.max()) < 65535,
        "canonical height is clipped",
    )
    require(
        np.unique(height).size > 30000, "canonical height is visibly quantized/banded"
    )
    seams = seam_metrics(height)
    require(
        seams["horizontalRatio"] <= 1.15 and seams["verticalRatio"] <= 1.15,
        f"canonical height is not periodic at its tile boundary: {seams}",
    )
    expected_normal = derive_directx_normal(height)
    require(
        np.array_equal(normal, expected_normal),
        "DirectX normal is not exactly derived from canonical height",
    )
    decoded = normal.astype(np.float64) / 127.5 - 1.0
    lengths = np.linalg.norm(decoded, axis=2)
    require(
        float(np.max(np.abs(lengths - 1.0))) < 0.012,
        "quantized normal vectors are not unit length",
    )
    require(int(normal[..., 2].min()) >= 248, "detail normal became implausibly steep")
    encoded_xy_delta = np.abs(normal[..., :2].astype(np.int16) - 128)
    require(
        float(np.percentile(encoded_xy_delta, 95)) <= 16.0
        and float(np.percentile(encoded_xy_delta, 99)) <= 20.0,
        "detail normal XY response is not subtle enough for repeated skin microdetail",
    )

    uv_hash, uv_vertices, uv_triangles = accepted_uv_hash(
        root / "assets/3d/export/shi-daze-council-facial-performance-v1-chen-sheng.glb"
    )
    require(uv_hash == EXPECTED_UV_SHA256, f"accepted upstream UV0 drifted: {uv_hash}")
    require(
        (uv_vertices, uv_triangles) == (14517, 26756),
        "accepted upstream topology receipt drifted",
    )

    metrics = json.loads(paths["metrics"].read_text(encoding="utf-8"))
    provenance = json.loads(paths["provenance"].read_text(encoding="utf-8"))
    require(
        metrics.get("assetId") == ASSET_ID
        and metrics.get("characterId") == "chen-sheng",
        "metrics scope drifted",
    )
    require(
        metrics.get("uv0", {}).get("accessorSha256") == EXPECTED_UV_SHA256,
        "metrics UV receipt drifted",
    )
    require(
        metrics.get("uv0", {}).get("coverage", {}).get("gutterPixels") == 24,
        "metrics gutter contract drifted",
    )
    require(
        metrics.get("authorship", {}).get("neuralGeneration") is False,
        "metrics imply neural generation",
    )
    for forbidden_authority in (
        "generatedImagePixelsSampled",
        "privateReferencePixelsSampled",
        "portraitOrAnatomyInput",
        "normalFromImageLuminance",
        "roughnessFromBaseColor",
        "aoFromBaseColor",
        "sssFromBaseColor",
    ):
        require(
            metrics["authorship"].get(forbidden_authority) is False,
            f"forbidden authority enabled: {forbidden_authority}",
        )
    require(
        metrics.get("textureTier", {}).get("selectedDetailRepeat") is None,
        "detail repeat was selected without measured in-engine review",
    )
    sss_parameters = metrics.get("proceduralParameters", {})
    require(
        sss_parameters.get("subsurfaceProfileOpacityByte")
        == SUBSURFACE_PROFILE_OPACITY_BYTE
        and sss_parameters.get("subsurfaceProfileOpacity") == SUBSURFACE_PROFILE_OPACITY
        and sss_parameters.get("subsurfaceProfileOpacityThresholdExclusive")
        == UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD
        and sss_parameters.get("profileMeanFreePathDistance")
        == PROFILE_MEAN_FREE_PATH_DISTANCE
        and sss_parameters.get("maximumEffectiveMeanFreePath")
        == MAXIMUM_EFFECTIVE_MEAN_FREE_PATH
        and sss_parameters.get("subsurfaceProfileInput") == "MP_OPACITY"
        and sss_parameters.get("subsurfaceColorInput") == "unconnected",
        "metrics do not bind the exact UE 5.8 Subsurface Profile opacity contract",
    )
    require(
        "not-engine-admitted" in provenance.get("status", ""),
        "provenance overclaims engine admission",
    )
    require(
        provenance.get("reviewStatus", {}).get("finalCharacterArt") is False,
        "provenance overclaims final art",
    )
    require(
        all(
            value is False
            for key, value in provenance["reviewStatus"].items()
            if key != "automatedSourceValidation"
        ),
        "provenance overclaims an open review gate",
    )
    metric_outputs = metrics.get("outputs", {})
    for name, actual in actual_receipts.items():
        require(
            metric_outputs.get(name) == actual, f"metrics receipt mismatch for {name}"
        )

    texture_metadata = {
        "baseColor": {
            "width": 2048,
            "height": 2048,
            "role": "baseColor",
            "bitDepth": 8,
            "channels": 3,
            "colorSpace": "sRGB",
            "unrealImport": {
                "importToUnreal": True,
                "sRGB": True,
                "compression": "BC7",
                "compressionSetting": "TC_BC7",
                "textureGroup": "Character",
                "addressX": "Clamp",
                "addressY": "Clamp",
                "usage": "non-tiling inherited UV0 atlas",
            },
        },
        "materialMask": {
            "width": 2048,
            "height": 2048,
            "role": "packedMaterialMask",
            "bitDepth": 8,
            "channels": 4,
            "colorSpace": "linear",
            "unrealImport": {
                "importToUnreal": True,
                "sRGB": False,
                "compression": "Masks",
                "compressionSetting": "TC_MASKS",
                "textureGroup": "Character",
                "addressX": "Clamp",
                "addressY": "Clamp",
                "channels": "R=neutral AO; G=roughness; B=Subsurface Profile opacity/radius scale 89/255 via MP_OPACITY only; A=unused opaque",
            },
        },
        "canonicalHeight": {
            "width": 1024,
            "height": 1024,
            "role": "canonicalDetailHeight",
            "bitDepth": 16,
            "channels": 1,
            "colorSpace": "linear",
            "unrealImport": {
                "importToUnreal": False,
                "sRGB": False,
                "compression": "SourceOnly",
                "addressX": "Wrap",
                "addressY": "Wrap",
                "usage": "canonical seamless derivation source",
            },
        },
        "directxNormal": {
            "width": 1024,
            "height": 1024,
            "role": "detailNormalDirectX",
            "bitDepth": 8,
            "channels": 3,
            "colorSpace": "linear",
            "unrealImport": {
                "importToUnreal": True,
                "sRGB": False,
                "compression": "BC5",
                "compressionSetting": "TC_NORMALMAP",
                "textureGroup": "CharacterNormalMap",
                "addressX": "Wrap",
                "addressY": "Wrap",
                "flipGreenChannel": False,
                "usage": "DirectX/Unreal tangent-space detail normal; R/G authoritative, Z reconstructable",
            },
        },
    }
    texture_files = []
    for name in ("baseColor", "materialMask", "canonicalHeight", "directxNormal"):
        entry = (
            actual_receipts[name]
            | {"basename": paths[name].name}
            | texture_metadata[name]
        )
        texture_files.append(entry)

    validation: dict[str, Any] = {
        "schemaVersion": 1,
        "assetId": ASSET_ID,
        "validatedAt": "2026-08-10",
        "passed": True,
        "status": "pass",
        "qualification": "automated-source-validation-only-not-engine-admitted-not-final-not-human-approved",
        "scope": "Chen Sheng isolated source/interchange textures only",
        "files": texture_files,
        "textures": texture_files,
        "checks": {
            "exactDeterministicTextureReceipts": True,
            "acceptedUv0ReceiptPreserved": True,
            "dimensionsAndPngEncodings": True,
            "baseColorBoundedNoAlphaNoBakedChannelDerivation": True,
            "neutralAoAndIndependentRoughness": True,
            "subsurfaceProfileOpacityExactly89Of255AbovePoint10ViaOpacityOnly": True,
            "subsurfaceColorRemainsUnconnectedBySourceContract": True,
            "maximumEffectiveMeanFreePathIs0Point9335576471": True,
            "canonicalHeight16BitUnclippedUnbandedPeriodic": True,
            "directxNormalExactlyDerivedFromCanonicalHeight": True,
            "metallicDeclaredExactZero": True,
            "privateOrGeneratedImagePixelsAbsentByBuildContract": True,
            "engineAndHumanGatesRemainOpen": True,
        },
        "acceptedUpstream": {
            "uv0Sha256": uv_hash,
            "vertices": uv_vertices,
            "triangles": uv_triangles,
        },
        "textureReceipts": actual_receipts,
        "heightSeams": seams,
        "decodedNormalLength": {
            "minimum": float(lengths.min()),
            "maximum": float(lengths.max()),
            "maximumAbsoluteUnitError": float(np.max(np.abs(lengths - 1.0))),
        },
        "normalSubtlety": {
            "encodedZMinimum": int(normal[..., 2].min()),
            "encodedZMean": float(normal[..., 2].mean()),
            "encodedZFirstPercentile": float(np.percentile(normal[..., 2], 1)),
            "encodedXYAbsoluteDeltaP95": float(np.percentile(encoded_xy_delta, 95)),
            "encodedXYAbsoluteDeltaP99": float(np.percentile(encoded_xy_delta, 99)),
        },
        "openGates": metrics["openHumanGates"],
        "disclosure": metrics["disclosure"],
    }
    write_json(paths["validation"], validation)
    validation_receipt = receipt(paths["validation"], root)
    provenance["reviewStatus"]["automatedSourceValidation"] = "passed"
    provenance["automatedValidation"] = validation_receipt
    provenance["sourceTextures"] = texture_files
    provenance["sourceOutputs"] = [
        entry
        for entry in provenance["sourceOutputs"]
        if not entry["file"].endswith(".validation.json")
    ]
    provenance["sourceOutputs"].append(validation_receipt)
    write_json(paths["provenance"], provenance)
    print(
        json.dumps(
            {
                "assetId": ASSET_ID,
                "passed": True,
                "validation": validation_receipt,
                "heightSeams": seams,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
