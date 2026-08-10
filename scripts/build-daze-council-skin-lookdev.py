#!/usr/bin/env python3
"""Build the isolated Chen Sheng skin-lookdev v1 source texture package.

This is deliberately a source/interchange build.  It does not edit a character,
launch Blender or Unreal, or admit the result to an engine.  The accepted facial
mesh is read only to prove the inherited UV0 receipt and measure UV coverage.
Every pixel written here is deterministic procedural SHI authorship; no generated
or private reference image is sampled.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
from pathlib import Path
import struct
import sys
from typing import Any

import cv2
import numpy as np
from PIL import Image, __version__ as PIL_VERSION


ASSET_ID = "shi-daze-council-skin-lookdev-v1"
CREATED_AT = "2026-08-10"
CHARACTER_ID = "chen-sheng"
BASE_SIZE = 2048
DETAIL_SIZE = 1024
GUTTER_PIXELS = 24
BASE_SEED = 209071
MASK_SEED = 209072
HEIGHT_SEED = 209073
HEIGHT_HALF_RANGE_MM = 0.060
NORMAL_STRENGTH = 0.35
SUBSURFACE_PROFILE_OPACITY_BYTE = 89
SUBSURFACE_PROFILE_OPACITY = SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0
UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD = 0.10
PROFILE_MEAN_FREE_PATH_DISTANCE = 2.6748
MAXIMUM_EFFECTIVE_MEAN_FREE_PATH = (
    PROFILE_MEAN_FREE_PATH_DISTANCE * SUBSURFACE_PROFILE_OPACITY
)
EXPECTED_UV_SHA256 = "f60fd8442a4fd04bb090f467838786d200fea99432d99a205eca74c846ef1ab6"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="SHI repository root (defaults to the script parent)",
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
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def read_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    payload = path.read_bytes()
    if len(payload) < 20 or payload[:4] != b"glTF":
        raise RuntimeError(f"Invalid GLB header: {path}")
    magic, version, total_length = struct.unpack_from("<4sII", payload, 0)
    if magic != b"glTF" or version != 2 or total_length != len(payload):
        raise RuntimeError(f"Unsupported or truncated GLB: {path}")
    offset = 12
    manifest: dict[str, Any] | None = None
    binary: bytes | None = None
    while offset + 8 <= len(payload):
        chunk_length, chunk_type = struct.unpack_from("<II", payload, offset)
        offset += 8
        chunk = payload[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:
            manifest = json.loads(chunk.rstrip(b"\x00 \t\r\n").decode("utf-8"))
        elif chunk_type == 0x004E4942:
            binary = chunk
    if manifest is None or binary is None:
        raise RuntimeError(f"GLB lacks JSON or BIN chunk: {path}")
    return manifest, binary


COMPONENT_DTYPES = {
    5120: np.dtype("i1"),
    5121: np.dtype("u1"),
    5122: np.dtype("<i2"),
    5123: np.dtype("<u2"),
    5125: np.dtype("<u4"),
    5126: np.dtype("<f4"),
}
TYPE_COMPONENTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def accessor_array(
    manifest: dict[str, Any], binary: bytes, accessor_index: int
) -> tuple[np.ndarray, bytes]:
    accessor = manifest["accessors"][accessor_index]
    view = manifest["bufferViews"][accessor["bufferView"]]
    dtype = COMPONENT_DTYPES[accessor["componentType"]]
    components = TYPE_COMPONENTS[accessor["type"]]
    count = accessor["count"]
    item_size = dtype.itemsize * components
    stride = view.get("byteStride", item_size)
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    if stride == item_size:
        raw = binary[offset : offset + count * item_size]
        values = (
            np.frombuffer(raw, dtype=dtype, count=count * components)
            .reshape(count, components)
            .copy()
        )
        return values, raw
    values = np.ndarray(
        shape=(count, components),
        dtype=dtype,
        buffer=binary,
        offset=offset,
        strides=(stride, dtype.itemsize),
    ).copy()
    raw = b"".join(
        binary[offset + row * stride : offset + row * stride + item_size]
        for row in range(count)
    )
    return values, raw


def skin_uv_contract(glb_path: Path) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    manifest, binary = read_glb(glb_path)
    matches: list[tuple[dict[str, Any], str]] = []
    for mesh in manifest.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            material_index = primitive.get("material")
            material_name = (
                manifest["materials"][material_index].get("name", "")
                if material_index is not None
                else ""
            )
            if material_name == "M_SHI_Character_SkinClay":
                matches.append((primitive, mesh.get("name", "")))
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected exactly one SkinClay primitive, found {len(matches)}"
        )
    primitive, mesh_name = matches[0]
    uv, uv_raw = accessor_array(manifest, binary, primitive["attributes"]["TEXCOORD_0"])
    indices, _ = accessor_array(manifest, binary, primitive["indices"])
    indices = indices.reshape(-1).astype(np.int64)
    if indices.size % 3:
        raise RuntimeError("Skin index accessor is not triangular")
    uv_sha256 = sha256_bytes(uv_raw)
    if uv_sha256 != EXPECTED_UV_SHA256:
        raise RuntimeError(f"Accepted UV0 receipt drifted: {uv_sha256}")
    if not np.isfinite(uv).all() or float(uv.min()) < 0.0 or float(uv.max()) > 1.0:
        raise RuntimeError("Skin UV0 contains non-finite or out-of-range values")
    contract = {
        "sourceMesh": mesh_name,
        "material": "M_SHI_Character_SkinClay",
        "vertexCount": int(uv.shape[0]),
        "triangleCount": int(indices.size // 3),
        "accessorFloat32Bytes": len(uv_raw),
        "accessorSha256": uv_sha256,
        "minimum": [float(value) for value in uv.min(axis=0)],
        "maximum": [float(value) for value in uv.max(axis=0)],
    }
    return uv.astype(np.float32), indices.reshape(-1, 3), contract


def uv_coverage(
    uv: np.ndarray, triangles: np.ndarray, size: int
) -> tuple[np.ndarray, dict[str, Any]]:
    pixels = np.empty_like(uv, dtype=np.float64)
    pixels[:, 0] = uv[:, 0] * (size - 1)
    pixels[:, 1] = (1.0 - uv[:, 1]) * (size - 1)
    pixel_points = np.rint(pixels).astype(np.int32)
    polygons = [pixel_points[triangle].reshape(-1, 1, 2) for triangle in triangles]
    occupied = np.zeros((size, size), dtype=np.uint8)
    cv2.fillPoly(occupied, polygons, 255, lineType=cv2.LINE_8)
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (GUTTER_PIXELS * 2 + 1, GUTTER_PIXELS * 2 + 1)
    )
    dilated = cv2.dilate(occupied, kernel, iterations=1)
    occupied_pixels = int(np.count_nonzero(occupied))
    dilated_pixels = int(np.count_nonzero(dilated))
    metrics = {
        "resolution": [size, size],
        "occupiedPixels": occupied_pixels,
        "occupiedFraction": occupied_pixels / float(size * size),
        "gutterPixels": GUTTER_PIXELS,
        "dilatedPixels": dilated_pixels,
        "dilatedFraction": dilated_pixels / float(size * size),
        "opaquePadding": "procedural field covers the full RGB/RGBA canvas; no transparent or black island exterior",
    }
    return occupied, metrics


def standardized_noise(size: int, seed: int, sigma: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal((size, size), dtype=np.float32)
    filtered = cv2.GaussianBlur(
        noise, (0, 0), sigmaX=sigma, sigmaY=sigma, borderType=cv2.BORDER_REFLECT_101
    )
    filtered -= float(filtered.mean())
    deviation = float(filtered.std())
    if deviation <= 1.0e-8:
        raise RuntimeError("Procedural noise unexpectedly collapsed")
    return filtered / deviation


def build_base_color() -> np.ndarray:
    broad = standardized_noise(BASE_SIZE, BASE_SEED, 72.0)
    medium = standardized_noise(BASE_SIZE, BASE_SEED + 1, 15.0)
    fine = standardized_noise(BASE_SIZE, BASE_SEED + 2, 2.4)
    undertone = standardized_noise(BASE_SIZE, BASE_SEED + 3, 29.0)
    base = np.empty((BASE_SIZE, BASE_SIZE, 3), dtype=np.float32)
    base[:] = np.array([0.540, 0.400, 0.320], dtype=np.float32)
    base += broad[..., None] * np.array([0.010, 0.009, 0.007], dtype=np.float32)
    base += medium[..., None] * np.array([0.008, 0.006, 0.004], dtype=np.float32)
    base += undertone[..., None] * np.array([0.007, -0.0025, -0.004], dtype=np.float32)
    base += fine[..., None] * np.array([0.0035, 0.0025, 0.0020], dtype=np.float32)
    base = np.clip(base, 0.08, 0.92)
    return np.rint(base * 255.0).astype(np.uint8)


def build_material_mask() -> np.ndarray:
    roughness_noise = standardized_noise(BASE_SIZE, MASK_SEED, 9.0)
    roughness_fine = standardized_noise(BASE_SIZE, MASK_SEED + 1, 2.0)
    roughness = np.clip(
        0.620 + 0.018 * roughness_noise + 0.009 * roughness_fine, 0.54, 0.70
    )
    packed = np.empty((BASE_SIZE, BASE_SIZE, 4), dtype=np.uint8)
    packed[..., 0] = (
        255  # Deliberately neutral AO: no unproved geometry bake is fabricated.
    )
    packed[..., 1] = np.rint(roughness * 255.0).astype(np.uint8)
    # UE 5.8 Subsurface Profile reads this radius/opacity scale only through
    # MP_OPACITY -> GBuffer.CustomData.a. It is not anatomical thickness or a
    # complexion claim, and must never be connected to MP_SUBSURFACE_COLOR.
    packed[..., 2] = np.uint8(SUBSURFACE_PROFILE_OPACITY_BYTE)
    packed[..., 3] = 255  # Explicit unused/opaque channel.
    return packed


def build_canonical_height() -> np.ndarray:
    rng = np.random.default_rng(HEIGHT_SEED)
    white = rng.standard_normal((DETAIL_SIZE, DETAIL_SIZE), dtype=np.float32)
    spectrum = np.fft.rfft2(white)
    fy = np.fft.fftfreq(DETAIL_SIZE)[:, None] * DETAIL_SIZE
    fx = np.fft.rfftfreq(DETAIL_SIZE)[None, :] * DETAIL_SIZE
    radius = np.sqrt(fx * fx + fy * fy)
    high_pass = 1.0 - np.exp(-np.power(radius / 18.0, 4.0))
    low_pass = np.exp(-np.power(radius / 176.0, 4.0))
    shaping = high_pass * low_pass * np.power(np.maximum(radius, 1.0) / 32.0, 0.22)
    shaping[0, 0] = 0.0
    field = np.fft.irfft2(spectrum * shaping, s=(DETAIL_SIZE, DETAIL_SIZE)).real.astype(
        np.float32
    )
    field -= float(field.mean())
    field /= float(field.std())
    field = np.tanh(field / 2.35)
    maximum = float(np.max(np.abs(field)))
    field *= 0.96 / maximum
    encoded = np.rint((field * 0.5 + 0.5) * 65535.0).astype(np.uint16)
    return encoded


def derive_directx_normal(height: np.ndarray) -> np.ndarray:
    normalized_height = (height.astype(np.float32) - 32767.5) / 32767.5
    du = (
        np.roll(normalized_height, -1, axis=1) - np.roll(normalized_height, 1, axis=1)
    ) * 0.5
    dv_image = (
        np.roll(normalized_height, -1, axis=0) - np.roll(normalized_height, 1, axis=0)
    ) * 0.5
    nx = -du * NORMAL_STRENGTH
    ny_directx = dv_image * NORMAL_STRENGTH
    nz = np.ones_like(nx)
    inverse_length = 1.0 / np.sqrt(nx * nx + ny_directx * ny_directx + nz * nz)
    normal = np.stack(
        (nx * inverse_length, ny_directx * inverse_length, nz * inverse_length), axis=-1
    )
    return np.rint((normal * 0.5 + 0.5) * 255.0).clip(0, 255).astype(np.uint8)


def channel_statistics(array: np.ndarray, labels: list[str]) -> dict[str, Any]:
    if array.ndim == 2:
        array = array[..., None]
    result: dict[str, Any] = {}
    for channel, label in enumerate(labels):
        values = array[..., channel].astype(np.float64)
        result[label] = {
            "minimum": int(values.min()),
            "maximum": int(values.max()),
            "mean": float(values.mean()),
            "standardDeviation": float(values.std()),
            "uniqueValues": int(np.unique(values).size),
        }
    return result


def height_periodicity(height: np.ndarray) -> dict[str, float]:
    values = height.astype(np.float64)
    horizontal_seam = float(np.sqrt(np.mean(np.square(values[:, 0] - values[:, -1]))))
    vertical_seam = float(np.sqrt(np.mean(np.square(values[0, :] - values[-1, :]))))
    horizontal_neighbors = float(
        np.sqrt(np.mean(np.square(values[:, 1:] - values[:, :-1])))
    )
    vertical_neighbors = float(
        np.sqrt(np.mean(np.square(values[1:, :] - values[:-1, :])))
    )
    return {
        "horizontalSeamRmseU16": horizontal_seam,
        "verticalSeamRmseU16": vertical_seam,
        "horizontalInteriorNeighborRmseU16": horizontal_neighbors,
        "verticalInteriorNeighborRmseU16": vertical_neighbors,
        "horizontalSeamToInteriorRatio": horizontal_seam / horizontal_neighbors,
        "verticalSeamToInteriorRatio": vertical_seam / vertical_neighbors,
    }


def normal_subtlety(normal: np.ndarray) -> dict[str, float]:
    decoded = normal.astype(np.float64) / 127.5 - 1.0
    xy_length = np.linalg.norm(decoded[..., :2], axis=2)
    encoded_xy_delta = np.abs(normal[..., :2].astype(np.int16) - 128)
    return {
        "encodedZMinimum": int(normal[..., 2].min()),
        "encodedZMean": float(normal[..., 2].mean()),
        "encodedZFirstPercentile": float(np.percentile(normal[..., 2], 1)),
        "encodedXYAbsoluteDeltaP95": float(np.percentile(encoded_xy_delta, 95)),
        "encodedXYAbsoluteDeltaP99": float(np.percentile(encoded_xy_delta, 99)),
        "decodedXYLengthP95": float(np.percentile(xy_length, 95)),
        "decodedXYLengthP99": float(np.percentile(xy_length, 99)),
    }


def save_png(path: Path, array: np.ndarray, mode: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = Image.fromarray(array, mode=mode)
    image.save(path, format="PNG", compress_level=9, optimize=False)


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    source_dir = root / "assets/3d/source"
    provenance_path = root / "assets/provenance" / f"{ASSET_ID}.json"
    glb_path = (
        root / "assets/3d/export/shi-daze-council-facial-performance-v1-chen-sheng.glb"
    )
    generator_path = root / "scripts/build-daze-council-skin-lookdev.py"
    validator_path = root / "scripts/validate-daze-council-skin-lookdev.py"
    paths = {
        "baseColor": source_dir / f"{ASSET_ID}-basecolor-2k.png",
        "materialMask": source_dir / f"{ASSET_ID}-masks-2k.png",
        "canonicalHeight": source_dir / f"{ASSET_ID}-detail-height-1k.png",
        "directxNormal": source_dir / f"{ASSET_ID}-detail-normal-dx-1k.png",
        "metrics": source_dir / f"{ASSET_ID}.metrics.json",
    }
    if not glb_path.is_file():
        raise RuntimeError(f"Missing accepted Chen Sheng source: {glb_path}")
    if not validator_path.is_file():
        raise RuntimeError(f"Missing independent validator: {validator_path}")

    uv, triangles, uv_contract = skin_uv_contract(glb_path)
    _occupied, coverage = uv_coverage(uv, triangles, BASE_SIZE)
    base_color = build_base_color()
    material_mask = build_material_mask()
    canonical_height = build_canonical_height()
    directx_normal = derive_directx_normal(canonical_height)

    save_png(paths["baseColor"], base_color, "RGB")
    save_png(paths["materialMask"], material_mask, "RGBA")
    save_png(paths["canonicalHeight"], canonical_height, "I;16")
    save_png(paths["directxNormal"], directx_normal, "RGB")

    texture_receipts = {
        name: receipt(path, root) for name, path in paths.items() if name != "metrics"
    }
    upstream_receipt = receipt(glb_path, root)
    metrics: dict[str, Any] = {
        "schemaVersion": 1,
        "assetId": ASSET_ID,
        "createdAt": CREATED_AT,
        "status": "deterministic-procedural-source-review-candidate-not-engine-admitted-not-final",
        "characterId": CHARACTER_ID,
        "scope": "isolated source/interchange texture proof; accepted mesh, skeleton, morphs, materials, gameplay and evidence remain unchanged",
        "disclosure": "CHEN SHENG SKIN MATERIAL LOOKDEV · GENERIC DRAMATIC CASTING · NOT A HISTORICAL LIKENESS · NOT FINAL CHARACTER ART",
        "authorship": {
            "method": "deterministic SHI-authored procedural fields",
            "neuralGeneration": False,
            "generatedImagePixelsSampled": False,
            "privateReferencePixelsSampled": False,
            "portraitOrAnatomyInput": False,
            "normalFromImageLuminance": False,
            "roughnessFromBaseColor": False,
            "aoFromBaseColor": False,
            "sssFromBaseColor": False,
        },
        "sourceCharacter": upstream_receipt,
        "uv0": uv_contract | {"coverage": coverage},
        "textureTier": {
            "baseColor": "2048x2048 RGB8 sRGB, non-tiling UV0, opaque full-canvas padding",
            "materialMask": "2048x2048 RGBA8 linear; R=neutral AO 1.0, G=authored roughness, B=Subsurface Profile opacity/radius scale 89/255 via MP_OPACITY only, A=unused 1.0",
            "canonicalHeight": f"1024x1024 16-bit linear seamless source; 0..65535 maps {-HEIGHT_HALF_RANGE_MM:.3f}..+{HEIGHT_HALF_RANGE_MM:.3f} mm",
            "directxNormal": "1024x1024 RGB8 linear DirectX/Unreal tangent normal source; BC5 consumes R/G and reconstructs Z",
            "metallic": "exact scalar zero; no metallic texture",
            "specular": "bounded engine scalar must begin at 0.25; no specular texture in this source slice",
            "detailRepeatCandidates": [16, 24, 32],
            "selectedDetailRepeat": None,
        },
        "proceduralParameters": {
            "baseColorSeed": BASE_SEED,
            "maskSeed": MASK_SEED,
            "heightSeed": HEIGHT_SEED,
            "baseColorSrgbCenter": [0.540, 0.400, 0.320],
            "roughnessCenter": 0.620,
            "roughnessAuthoredRange": [0.54, 0.70],
            "neutralAo": 1.0,
            "subsurfaceProfileOpacityByte": SUBSURFACE_PROFILE_OPACITY_BYTE,
            "subsurfaceProfileOpacity": SUBSURFACE_PROFILE_OPACITY,
            "subsurfaceProfileOpacityThresholdExclusive": UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD,
            "profileMeanFreePathDistance": PROFILE_MEAN_FREE_PATH_DISTANCE,
            "maximumEffectiveMeanFreePath": MAXIMUM_EFFECTIVE_MEAN_FREE_PATH,
            "subsurfaceProfileInput": "MP_OPACITY",
            "subsurfaceColorInput": "unconnected",
            "heightHalfRangeMillimetres": HEIGHT_HALF_RANGE_MM,
            "normalStrength": NORMAL_STRENGTH,
            "normalConvention": "R=-dH/du, G=+dH/d(image-v), DirectX/Unreal green convention, B=positive reconstructed Z",
        },
        "statistics": {
            "baseColor": channel_statistics(base_color, ["R", "G", "B"]),
            "materialMask": channel_statistics(
                material_mask,
                ["AO", "Roughness", "SubsurfaceProfileOpacity", "Unused"],
            ),
            "canonicalHeight": channel_statistics(canonical_height, ["Height"]),
            "directxNormal": channel_statistics(directx_normal, ["X", "YDirectX", "Z"]),
            "heightPeriodicity": height_periodicity(canonical_height),
            "normalSubtlety": normal_subtlety(directx_normal),
        },
        "outputs": texture_receipts,
        "toolchain": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "Pillow": PIL_VERSION,
            "opencv": cv2.__version__,
            "generator": receipt(generator_path, root),
            "validator": receipt(validator_path, root),
        },
        "openHumanGates": [
            "character/anatomy review",
            "late-Qin material-culture review",
            "Chinese cultural-performance review",
            "cinematic lighting/color review",
            "accessibility review",
            "identity-specific topology and head-UV decision",
            "Unreal tangent-basis proof",
            "Unreal isolated import/package/watched deformation review",
        ],
    }
    write_json(paths["metrics"], metrics)

    provenance: dict[str, Any] = {
        "assetId": ASSET_ID,
        "createdAt": CREATED_AT,
        "status": "source-review-candidate-only-not-engine-admitted-not-final-not-human-approved",
        "characterId": CHARACTER_ID,
        "rightsStatus": "Original SHI procedural texture authorship. The accepted upstream MakeHuman/MPFB facial engineering mesh remains under its recorded CC0/tooling provenance; no mesh or third-party pixels are redistributed by this slice.",
        "historicalStatus": "Generic dramatic material casting only; not a portrait, likeness, complexion claim, ethnicity reconstruction or evidence about Chen Sheng or any late-Qin person.",
        "designSource": "../../docs/art/DAZE_COUNCIL_SKIN_LOOKDEV_BRIEF.md",
        "sourceCharacterAsset": "shi-daze-council-facial-performance-v1",
        "sourceCharacter": upstream_receipt,
        "acceptedUv0AccessorSha256": uv_contract["accessorSha256"],
        "intendedUse": "isolated Chen Sheng source/interchange PBR material trial after technical review; never a baseline overwrite",
        "prohibitedUse": "historical likeness claim, direct final/shipping admission, palette cloning to other roles, or derivation of non-color channels from generated/private imagery",
        "authorship": metrics["authorship"],
        "channelAuthority": {
            "baseColor": "SHI-authored low-amplitude procedural chroma only; no baked illumination, AO, specular, weather, dirt, anatomy or identity motif",
            "AO": "neutral 1.0 placeholder; intentionally does not pretend to be a geometry bake",
            "roughness": "independent deterministic procedural authoring, not inferred from color",
            "SubsurfaceProfileOpacity": (
                "constant 89/255 radius scale; binds only to UE 5.8 MP_OPACITY, "
                "strictly above the 0.10 profile cutoff and no greater than 89/255; "
                "not measured anatomical thickness or a complexion claim"
            ),
            "canonicalHeight": "independently authored 16-bit periodic procedural micro-height",
            "directxNormal": "deterministically derived only from canonical height using the recorded DirectX convention",
            "metallic": "exact zero scalar",
            "specular": "bounded 0.25 starting scalar for later engine review",
        },
        "sourceOutputs": list(texture_receipts.values())
        + [receipt(paths["metrics"], root)],
        "toolchain": metrics["toolchain"],
        "reviewStatus": {
            "automatedSourceValidation": "pending independent validator",
            "engineAdmission": False,
            "packageExercise": False,
            "watchedDeformationReview": False,
            "humanCharacterAnatomyApproval": False,
            "humanHistoricalCulturalApproval": False,
            "humanCinematicColorApproval": False,
            "humanAccessibilityApproval": False,
            "finalCharacterArt": False,
        },
        "openGates": metrics["openHumanGates"],
        "disclosure": metrics["disclosure"],
    }
    write_json(provenance_path, provenance)
    print(
        json.dumps(
            {
                "assetId": ASSET_ID,
                "outputs": texture_receipts,
                "metrics": receipt(paths["metrics"], root),
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
