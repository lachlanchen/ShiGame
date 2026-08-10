"""Inspect or explicitly import SHI's isolated Chen Sheng skin lookdev v1.

The default mode is read-only with respect to Unreal content. Set exactly
``SHI_DAZE_COUNCIL_SKIN_LOOKDEV_REIMPORT=1`` to replace only
``/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1`` from the reviewed source
package. Both modes refresh the tracked admission report.

The engine inventory is intentionally only three Texture2D assets, one
SubsurfaceProfile and one Material. The canonical 16-bit height remains a
source-only authoring receipt. This script never creates a MaterialInstance,
mesh, Skeleton, PhysicsAsset, animation, Blueprint or gameplay authority, and
it proves the accepted DazeCouncilFacial package did not change.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import struct

import unreal


ASSET_ID = "shi-daze-council-skin-lookdev-v1"
MUTATION_ENV = "SHI_DAZE_COUNCIL_SKIN_LOOKDEV_REIMPORT"
DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilSkinLookdevV1"
BASELINE_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncilFacial"
SHARED_SKELETON_DESTINATION = "/Game/SHI/Art/Characters/DazeCouncil"

PROFILE_NAME = "SP_SHI_ChenSheng_SkinLookdevV1"
MATERIAL_NAME = "M_SHI_ChenSheng_SkinLookdevV1"
BASE_COLOR_NAME = "T_SHI_ChenSheng_Skin_BaseColor_2K"
MASKS_NAME = "T_SHI_ChenSheng_Skin_Masks_2K"
DETAIL_NORMAL_NAME = "T_SHI_ChenSheng_Skin_DetailNormal_1K"

METRICS_RELATIVE_PATH = "assets/3d/source/shi-daze-council-skin-lookdev-v1.metrics.json"
VALIDATION_RELATIVE_PATH = (
    "assets/3d/source/shi-daze-council-skin-lookdev-v1.validation.json"
)
PROVENANCE_RELATIVE_PATH = "assets/provenance/shi-daze-council-skin-lookdev-v1.json"
EVIDENCE_RELATIVE_PATH = (
    "docs/production/evidence/" "unreal-daze-council-skin-lookdev-import-status.json"
)

BASELINE_EVIDENCE_RELATIVE_PATH = (
    "docs/production/evidence/"
    "unreal-daze-council-facial-performance-import-status.json"
)
BASELINE_EVIDENCE_BYTES = 51449
BASELINE_EVIDENCE_SHA256 = (
    "5a4a8d1136ecf3200b844313470585c8c90fb45e8e719d20ca99e58d60db0655"
)
BASELINE_CHEN_MESH_FILE = "SKM_SHI_DazeCouncil_ChenSheng_Facial_01.uasset"
BASELINE_CHEN_MESH_BYTES = 4430335
BASELINE_CHEN_MESH_SHA256 = (
    "fc07683b48b1b43f5f189396cbc229449b66c5607a3772d3e8933103a88cbcd1"
)
BASELINE_SKIN_MATERIAL_FILE = "M_SHI_Character_SkinClay.uasset"
BASELINE_SKIN_MATERIAL_BYTES = 5162
BASELINE_SKIN_MATERIAL_SHA256 = (
    "b7ec2a89a11a9b03127e622c90c1d58d0c7ee3c338d6e2925636893e5ee9d160"
)
SHARED_SKELETON_FILE = "SK_SHI_DazeCouncil_Skeleton.uasset"
SHARED_SKELETON_BYTES = 12278
SHARED_SKELETON_SHA256 = (
    "b0fd0004826603eb3af8f8f8bb261ce87c5ef46da0347b5003fc04e89cd807f1"
)

SPECULAR = 0.25
MAXIMUM_SPECULAR = 0.35
SUBSURFACE_PROFILE_OPACITY_BYTE = 89
SUBSURFACE_PROFILE_OPACITY = SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0
UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD = 0.10
PROFILE_MEAN_FREE_PATH_DISTANCE = 2.6748
MAXIMUM_EFFECTIVE_MEAN_FREE_PATH = (
    PROFILE_MEAN_FREE_PATH_DISTANCE * SUBSURFACE_PROFILE_OPACITY
)
DETAIL_TILING = 24.0
ALLOWED_DETAIL_TILING = (16.0, 24.0, 32.0)
FLOAT_TOLERANCE = 0.00001

# UE 5.8's UMaterialExpressionTextureSampleParameter2D::SetDefaultTexture()
# assigns this exact engine texture before a caller supplies the project texture.
# UMaterialInterface::GetUsedTextures() unions the current-quality compiled
# resources, so that implementation-owned fallback can remain visible beside
# the three authored parameters. No other engine texture is admitted.
ALLOWED_ENGINE_IMPLICIT_TEXTURE_PATHS = frozenset(
    {"/Engine/EngineResources/DefaultTexture.DefaultTexture"}
)
MAXIMUM_ENGINE_IMPLICIT_TEXTURE_COUNT = 1

# Conservative Burley lookdev settings. SurfaceAlbedo is the linearized value
# near the deterministic source's sRGB center, not a complexion claim.
PROFILE_SETTINGS = {
    "surface_albedo": (0.253, 0.133, 0.084, 1.0),
    "mean_free_path_color": (1.0, 0.37, 0.30, 1.0),
    "mean_free_path_distance": PROFILE_MEAN_FREE_PATH_DISTANCE,
    "world_unit_scale": 0.1,
    "enable_burley": True,
    "enable_mean_free_path": True,
    "tint": (1.0, 1.0, 1.0, 1.0),
    "boundary_color_bleed": (1.0, 1.0, 1.0, 1.0),
    "transmission_tint_color": (1.0, 1.0, 1.0, 1.0),
    "extinction_scale": 1.0,
    "normal_scale": 0.08,
    "distance_scale": 1.0,
    "scattering_distribution": 0.93,
    "ior": 1.40,
    "roughness0": 0.75,
    "roughness1": 1.30,
    "lobe_mix": 0.85,
}

SOURCE_TEXTURES = {
    "baseColor": {
        "relativeFile": (
            "assets/3d/source/" "shi-daze-council-skin-lookdev-v1-basecolor-2k.png"
        ),
        "assetName": BASE_COLOR_NAME,
        "parameterName": "BaseColor2K",
        "width": 2048,
        "height": 2048,
        "bitDepth": 8,
        "colorType": 2,
        "srgb": True,
        "compression": "TC_BC7",
        "address": "TA_CLAMP",
        "lodGroup": "TEXTUREGROUP_CHARACTER",
        "samplerType": "SAMPLERTYPE_COLOR",
        "uvMode": "non-tiling-uv0",
    },
    "materialMasks": {
        "relativeFile": (
            "assets/3d/source/" "shi-daze-council-skin-lookdev-v1-masks-2k.png"
        ),
        "assetName": MASKS_NAME,
        "parameterName": "MaterialMasks2K",
        "width": 2048,
        "height": 2048,
        "bitDepth": 8,
        "colorType": 6,
        "srgb": False,
        "compression": "TC_MASKS",
        "address": "TA_CLAMP",
        "lodGroup": "TEXTUREGROUP_CHARACTER",
        "samplerType": "SAMPLERTYPE_MASKS",
        "uvMode": "non-tiling-uv0",
    },
    "detailNormal": {
        "relativeFile": (
            "assets/3d/source/"
            "shi-daze-council-skin-lookdev-v1-detail-normal-dx-1k.png"
        ),
        "assetName": DETAIL_NORMAL_NAME,
        "parameterName": "DetailNormal1K",
        "width": 1024,
        "height": 1024,
        "bitDepth": 8,
        "colorType": 2,
        "srgb": False,
        "compression": "TC_NORMALMAP",
        "address": "TA_WRAP",
        "lodGroup": "TEXTUREGROUP_CHARACTER_NORMAL_MAP",
        "samplerType": "SAMPLERTYPE_NORMAL",
        "uvMode": "repeating-uv0-directx",
    },
}

HEIGHT_SOURCE = {
    "relativeFile": (
        "assets/3d/source/" "shi-daze-council-skin-lookdev-v1-detail-height-1k.png"
    ),
    "width": 1024,
    "height": 1024,
    "bitDepth": 16,
    "colorType": 0,
}


def asset_path(name: str) -> str:
    return f"{DESTINATION}/{name}"


def object_path(name: str) -> str:
    return f"{asset_path(name)}.{name}"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_receipt(path: Path, repository: Path | None = None) -> dict:
    display_path = path.relative_to(repository) if repository else path
    return {
        "file": str(display_path),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def relative_uasset_receipts(root: Path) -> dict[str, dict]:
    if not root.is_dir():
        return {}
    return {
        str(path.relative_to(root)): {
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
        for path in sorted(root.rglob("*.uasset"))
    }


def relative_all_file_receipts(root: Path) -> dict[str, dict]:
    if not root.is_dir():
        return {}
    return {
        str(path.relative_to(root)): {
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
        for path in sorted(item for item in root.rglob("*") if item.is_file())
    }


def encoded_text_variants(value: str) -> tuple[bytes, bytes, bytes]:
    """Return byte-exact narrow and wide encodings used by Unreal packages."""
    return (
        value.encode("utf-8"),
        value.encode("utf-16-le"),
        value.encode("utf-16-be"),
    )


def embedded_text_present(data: bytes, value: str) -> bool:
    return any(candidate in data for candidate in encoded_text_variants(value))


def embedded_metadata_privacy_status(root: Path, repository: Path) -> dict:
    expected_sources = {
        f"{contract['assetName']}.uasset": contract["relativeFile"]
        for contract in SOURCE_TEXTURES.values()
    }
    assets = {}
    for path in sorted(root.glob("*.uasset")):
        data = path.read_bytes()
        expected_source = expected_sources.get(path.name)
        checks = {
            "repositoryAbsolutePathAbsent": not embedded_text_present(
                data, str(repository.resolve())
            ),
            "unixHomePathAbsent": not embedded_text_present(data, "/home/"),
            "macUsersPathAbsent": not embedded_text_present(data, "/Users/"),
            "windowsForwardUsersPathAbsent": not embedded_text_present(
                data, "C:/Users/"
            ),
            "windowsBackslashUsersPathAbsent": not embedded_text_present(
                data, "C:\\Users\\"
            ),
            "absoluteInterchangeFactoryPathAbsent": not embedded_text_present(
                data, "Factory_/"
            )
            and not embedded_text_present(data, "Factory_\\"),
            "interchangeAssetImportDataAbsent": not embedded_text_present(
                data, "InterchangeAssetImportData"
            ),
        }
        if expected_source is not None:
            expected_source_path = str((repository / expected_source).resolve())
            checks.update(
                {
                    "exactSourceAbsolutePathAbsent": not embedded_text_present(
                        data, expected_source_path
                    ),
                    "baseAssetImportDataPresent": embedded_text_present(
                        data, "AssetImportData"
                    ),
                    "relativeFilenamePropertyPresent": embedded_text_present(
                        data, "RelativeFilename"
                    ),
                    "sourceBasenamePresent": embedded_text_present(
                        data, Path(expected_source).name
                    ),
                }
            )
        assets[path.name] = {
            "sourceIdentity": expected_source,
            "checks": checks,
            "passed": all(checks.values()),
        }
    expected_files = {
        f"{PROFILE_NAME}.uasset",
        f"{MATERIAL_NAME}.uasset",
        *(f"{contract['assetName']}.uasset" for contract in SOURCE_TEXTURES.values()),
    }
    checks = {
        "exactFiveAssetsScanned": set(assets) == expected_files and len(assets) == 5,
        "allTrackedBinariesPrivatePathsAbsent": all(
            item["passed"] for item in assets.values()
        ),
    }
    return {"assets": assets, "checks": checks, "passed": all(checks.values())}


def png_ihdr(path: Path) -> dict:
    with path.open("rb") as source:
        header = source.read(33)
    if len(header) != 33 or header[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"Not an exact PNG source: {path}")
    length = struct.unpack(">I", header[8:12])[0]
    if length != 13 or header[12:16] != b"IHDR":
        raise RuntimeError(f"PNG does not begin with a canonical IHDR: {path}")
    width, height, bit_depth, color_type, compression, filtering, interlace = (
        struct.unpack(">IIBBBBB", header[16:29])
    )
    return {
        "width": width,
        "height": height,
        "bitDepth": bit_depth,
        "colorType": color_type,
        "compressionMethod": compression,
        "filterMethod": filtering,
        "interlaceMethod": interlace,
    }


def normalized_manifest_file(value: str) -> str:
    return value.replace("\\", "/").lstrip("./")


def collect_manifest_receipts(value, result: dict[str, dict]) -> None:
    """Collect file receipts from either arrays or role-keyed nested manifests."""
    if isinstance(value, dict):
        if {"file", "bytes", "sha256"}.issubset(value):
            key = normalized_manifest_file(str(value["file"]))
            receipt = {
                "file": key,
                "bytes": int(value["bytes"]),
                "sha256": str(value["sha256"]),
            }
            previous = result.get(key)
            if previous and previous != receipt:
                raise RuntimeError(f"Conflicting manifest receipts for {key}")
            result[key] = receipt
        for nested in value.values():
            collect_manifest_receipts(nested, result)
    elif isinstance(value, list):
        for nested in value:
            collect_manifest_receipts(nested, result)


def load_json_manifest(repository: Path, relative_path: str) -> tuple[dict, dict]:
    path = repository / relative_path
    if not path.is_file():
        raise FileNotFoundError(f"Missing source contract manifest: {path}")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        raise RuntimeError(f"Manifest root must be an object: {path}")
    if manifest.get("assetId") != ASSET_ID:
        raise RuntimeError(f"Manifest assetId drifted: {path}")
    receipts: dict[str, dict] = {}
    collect_manifest_receipts(manifest, receipts)
    return manifest, {
        "manifest": file_receipt(path, repository),
        "fileReceipts": receipts,
    }


def exact_manifest_receipt(
    manifest_name: str,
    manifest_receipts: dict[str, dict],
    relative_path: str,
    actual: dict,
) -> bool:
    candidate = manifest_receipts.get(normalized_manifest_file(relative_path))
    return (
        bool(candidate)
        and candidate["bytes"] == actual["bytes"]
        and candidate["sha256"] == actual["sha256"]
    )


def validate_source_contract(repository: Path) -> dict:
    metrics, metrics_receipts = load_json_manifest(repository, METRICS_RELATIVE_PATH)
    validation, validation_receipts = load_json_manifest(
        repository, VALIDATION_RELATIVE_PATH
    )
    provenance, provenance_receipts = load_json_manifest(
        repository, PROVENANCE_RELATIVE_PATH
    )

    source_receipts = {}
    png_headers = {}
    expected_pngs = {role: contract for role, contract in SOURCE_TEXTURES.items()}
    expected_pngs["canonicalHeight"] = HEIGHT_SOURCE
    for role, contract in expected_pngs.items():
        path = repository / contract["relativeFile"]
        if not path.is_file():
            raise FileNotFoundError(f"Missing skin lookdev source: {path}")
        source_receipts[role] = file_receipt(path, repository)
        png_headers[role] = png_ihdr(path)

    validation_files = validation.get("files", [])
    if not isinstance(validation_files, list):
        raise RuntimeError("Skin validation files must be an array")
    validation_entries = {
        normalized_manifest_file(str(item.get("file", ""))): item
        for item in validation_files
        if isinstance(item, dict)
    }
    expected_source_files = {
        contract["relativeFile"] for contract in expected_pngs.values()
    }

    source_character = provenance.get("sourceCharacter", {})
    source_character_path = repository / str(source_character.get("file", ""))
    source_character_receipt = (
        file_receipt(source_character_path, repository)
        if source_character_path.is_file()
        else None
    )

    checks = {
        "metricsAssetId": metrics.get("assetId") == ASSET_ID,
        "validationAssetId": validation.get("assetId") == ASSET_ID,
        "provenanceAssetId": provenance.get("assetId") == ASSET_ID,
        "validationPassed": validation.get("status") == "pass"
        or validation.get("passed") is True,
        "validationBindsExactlyFourSources": set(validation_entries)
        == expected_source_files
        and len(validation_files) == 4,
        "deterministicNonNeuralAuthorship": provenance.get("authorship", {}).get(
            "method"
        )
        == "deterministic SHI-authored procedural fields"
        and provenance.get("authorship", {}).get("neuralGeneration") is False
        and provenance.get("authorship", {}).get("generatedImagePixelsSampled") is False
        and provenance.get("authorship", {}).get("privateReferencePixelsSampled")
        is False
        and provenance.get("authorship", {}).get("normalFromImageLuminance") is False,
        "reviewCandidateNotEngineOrHumanApproved": provenance.get(
            "reviewStatus", {}
        ).get("engineAdmission")
        is False
        and provenance.get("reviewStatus", {}).get("humanHistoricalCulturalApproval")
        is False
        and provenance.get("reviewStatus", {}).get("finalCharacterArt") is False,
        "exactSourceCharacterReceipt": bool(source_character_receipt)
        and int(source_character.get("bytes", -1)) == source_character_receipt["bytes"]
        and source_character.get("sha256") == source_character_receipt["sha256"],
        "canonicalHeightDeclaredSourceOnly": metrics.get("textureTier", {})
        .get("canonicalHeight", "")
        .startswith("1024x1024 16-bit linear seamless source")
        and provenance.get("channelAuthority", {})
        .get("canonicalHeight", "")
        .startswith("independently authored 16-bit"),
        "normalDerivedOnlyFromCanonicalHeight": provenance.get("channelAuthority", {})
        .get("directxNormal", "")
        .startswith("deterministically derived only from canonical height"),
        "specularContract": provenance.get("channelAuthority", {}).get("specular")
        == "bounded 0.25 starting scalar for later engine review",
        "metallicContract": provenance.get("channelAuthority", {}).get("metallic")
        == "exact zero scalar",
        "subsurfaceProfileOpacitySourceContract": metrics.get(
            "proceduralParameters", {}
        ).get("subsurfaceProfileOpacityByte")
        == SUBSURFACE_PROFILE_OPACITY_BYTE
        and metrics.get("proceduralParameters", {}).get("subsurfaceProfileOpacity")
        == SUBSURFACE_PROFILE_OPACITY
        and metrics.get("proceduralParameters", {}).get(
            "subsurfaceProfileOpacityThresholdExclusive"
        )
        == UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD
        and metrics.get("proceduralParameters", {}).get("profileMeanFreePathDistance")
        == PROFILE_MEAN_FREE_PATH_DISTANCE
        and metrics.get("proceduralParameters", {}).get("maximumEffectiveMeanFreePath")
        == MAXIMUM_EFFECTIVE_MEAN_FREE_PATH
        and metrics.get("proceduralParameters", {}).get("subsurfaceProfileInput")
        == "MP_OPACITY"
        and metrics.get("proceduralParameters", {}).get("subsurfaceColorInput")
        == "unconnected"
        and provenance.get("channelAuthority", {})
        .get("SubsurfaceProfileOpacity", "")
        .startswith("constant 89/255 radius scale; binds only to UE 5.8 MP_OPACITY")
        and validation.get("checks", {}).get(
            "subsurfaceProfileOpacityExactly89Of255AbovePoint10ViaOpacityOnly"
        )
        is True
        and validation.get("checks", {}).get(
            "subsurfaceColorRemainsUnconnectedBySourceContract"
        )
        is True,
    }

    for role, contract in expected_pngs.items():
        relative_path = contract["relativeFile"]
        actual = source_receipts[role]
        header = png_headers[role]
        checks[f"{role}:exactMetricsReceipt"] = exact_manifest_receipt(
            "metrics", metrics_receipts["fileReceipts"], relative_path, actual
        )
        checks[f"{role}:exactValidationReceipt"] = exact_manifest_receipt(
            "validation",
            validation_receipts["fileReceipts"],
            relative_path,
            actual,
        )
        checks[f"{role}:exactProvenanceReceipt"] = exact_manifest_receipt(
            "provenance",
            provenance_receipts["fileReceipts"],
            relative_path,
            actual,
        )
        checks[f"{role}:exactPngEncoding"] = (
            header["width"] == contract["width"]
            and header["height"] == contract["height"]
            and header["bitDepth"] == contract["bitDepth"]
            and header["colorType"] == contract["colorType"]
            and header["compressionMethod"] == 0
            and header["filterMethod"] == 0
            and header["interlaceMethod"] == 0
        )
        validation_entry = validation_entries.get(relative_path, {})
        unreal_import = validation_entry.get("unrealImport", {})
        checks[f"{role}:exactValidationEncoding"] = (
            validation_entry.get("width") == contract["width"]
            and validation_entry.get("height") == contract["height"]
            and validation_entry.get("bitDepth") == contract["bitDepth"]
        )
        if role == "canonicalHeight":
            checks[f"{role}:exactSourceOnlyImportContract"] = (
                unreal_import.get("importToUnreal") is False
                and unreal_import.get("compression") == "SourceOnly"
                and unreal_import.get("addressX") == "Wrap"
                and unreal_import.get("addressY") == "Wrap"
            )
        else:
            expected_address = "Clamp" if contract["address"] == "TA_CLAMP" else "Wrap"
            expected_group = (
                "CharacterNormalMap"
                if contract["lodGroup"] == "TEXTUREGROUP_CHARACTER_NORMAL_MAP"
                else "Character"
            )
            checks[f"{role}:exactUnrealImportContract"] = (
                unreal_import.get("importToUnreal") is True
                and unreal_import.get("sRGB") is contract["srgb"]
                and unreal_import.get("compressionSetting") == contract["compression"]
                and unreal_import.get("textureGroup") == expected_group
                and unreal_import.get("addressX") == expected_address
                and unreal_import.get("addressY") == expected_address
                and (
                    role != "detailNormal"
                    or unreal_import.get("flipGreenChannel") is False
                )
            )

    status = {
        "metrics": metrics_receipts,
        "validation": validation_receipts,
        "provenance": provenance_receipts,
        "sourceCharacter": source_character_receipt,
        "sourceTextures": source_receipts,
        "pngHeaders": png_headers,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(f"Skin lookdev source contract drifted: {checks}")
    return status


def validate_baseline_contract(
    repository: Path, project_dir: Path
) -> tuple[dict, dict[str, dict], list[str], dict]:
    evidence_path = repository / BASELINE_EVIDENCE_RELATIVE_PATH
    evidence_receipt = file_receipt(evidence_path, repository)
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    disk_root = (
        project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncilFacial"
    )
    disk_receipts = relative_uasset_receipts(disk_root)
    accepted_receipts = evidence.get("trackedUnrealAssets", {}).get("receipts", {})
    asset_paths = sorted(
        unreal.EditorAssetLibrary.list_assets(BASELINE_DESTINATION, recursive=True)
    )
    shared_skeleton_file = (
        project_dir
        / "Content"
        / "SHI"
        / "Art"
        / "Characters"
        / "DazeCouncil"
        / SHARED_SKELETON_FILE
    )
    skeleton_receipt = file_receipt(shared_skeleton_file, repository)
    checks = {
        "exactAcceptedEvidence": evidence_receipt["bytes"] == BASELINE_EVIDENCE_BYTES
        and evidence_receipt["sha256"] == BASELINE_EVIDENCE_SHA256,
        "acceptedEvidencePassed": evidence.get("mode") == "import-replace"
        and evidence.get("passed") is True,
        "exactTwentyOneAcceptedUassets": len(disk_receipts) == 21,
        "exactTwentyOneAcceptedRegistryAssets": len(asset_paths) == 21,
        "exactAcceptedUassetReceipts": disk_receipts == accepted_receipts,
        "chenMeshReceipt": disk_receipts.get(BASELINE_CHEN_MESH_FILE)
        == {
            "bytes": BASELINE_CHEN_MESH_BYTES,
            "sha256": BASELINE_CHEN_MESH_SHA256,
        },
        "skinClayReceipt": disk_receipts.get(BASELINE_SKIN_MATERIAL_FILE)
        == {
            "bytes": BASELINE_SKIN_MATERIAL_BYTES,
            "sha256": BASELINE_SKIN_MATERIAL_SHA256,
        },
        "sharedSkeletonReceipt": skeleton_receipt["bytes"] == SHARED_SKELETON_BYTES
        and skeleton_receipt["sha256"] == SHARED_SKELETON_SHA256,
        "isolatedDestination": DESTINATION != BASELINE_DESTINATION
        and not DESTINATION.startswith(f"{BASELINE_DESTINATION}/")
        and not BASELINE_DESTINATION.startswith(f"{DESTINATION}/"),
    }
    status = {
        "acceptedEvidence": evidence_receipt,
        "diskRoot": str(disk_root.relative_to(repository)),
        "assetCount": len(asset_paths),
        "uassetReceipts": disk_receipts,
        "sharedSkeleton": skeleton_receipt,
        "checks": checks,
        "passed": all(checks.values()),
    }
    if not status["passed"]:
        raise RuntimeError(f"Accepted facial baseline drifted: {checks}")
    return status, disk_receipts, asset_paths, skeleton_receipt


def import_texture(source: Path, contract: dict) -> tuple[unreal.Texture2D, list[str]]:
    # Pin the legacy PNG TextureFactory deliberately. UE 5.8 routes an
    # unspecified factory through Interchange, whose serialized factory-node
    # UID contains the absolute source filename. The simple reviewed PNGs are
    # fully revalidated below, while the legacy factory retains only ordinary
    # UAssetImportData and therefore no host path in an Interchange graph.
    factory = unreal.TextureFactory()
    supported_extensions = {
        str(item).split(";", 1)[0].lower()
        for item in factory.get_editor_property("formats")
    }
    extension = source.suffix.removeprefix(".").lower()
    if extension not in supported_extensions:
        raise RuntimeError(
            f"TextureFactory does not declare {extension}: "
            f"{sorted(supported_extensions)}"
        )
    task = unreal.AssetImportTask()
    task.filename = str(source)
    task.destination_path = DESTINATION
    task.destination_name = contract["assetName"]
    task.replace_existing = False
    task.automated = True
    task.save = False
    task.factory = factory
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    imported_paths = list(task.get_editor_property("imported_object_paths"))
    texture = unreal.EditorAssetLibrary.load_asset(asset_path(contract["assetName"]))
    if not isinstance(texture, unreal.Texture2D):
        raise RuntimeError(f"Texture import failed for {source}: {imported_paths}")
    texture.set_editor_property("srgb", contract["srgb"])
    texture.set_editor_property(
        "compression_settings",
        getattr(unreal.TextureCompressionSettings, contract["compression"]),
    )
    address = getattr(unreal.TextureAddress, contract["address"])
    texture.set_editor_property("address_x", address)
    texture.set_editor_property("address_y", address)
    texture.set_editor_property(
        "lod_group", getattr(unreal.TextureGroup, contract["lodGroup"])
    )
    texture.set_editor_property("flip_green_channel", False)
    texture.set_editor_property("virtual_texture_streaming", False)
    import_data = texture.get_editor_property("asset_import_data")
    if import_data is None:
        raise RuntimeError(f"TextureFactory did not produce AssetImportData: {source}")
    import_data_class = import_data.get_class().get_path_name()
    if import_data_class != "/Script/Engine.AssetImportData":
        raise RuntimeError(
            f"Texture import retained non-base import data: {import_data_class}"
        )
    return texture, imported_paths


def create_asset(name: str, asset_class, factory):
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        name, DESTINATION, asset_class, factory
    )
    if not asset:
        raise RuntimeError(f"Could not create exact isolated asset: {asset_path(name)}")
    return asset


def linear_color(value: tuple[float, float, float, float]) -> unreal.LinearColor:
    return unreal.LinearColor(r=value[0], g=value[1], b=value[2], a=value[3])


def author_profile():
    profile = create_asset(
        PROFILE_NAME, unreal.SubsurfaceProfile, unreal.SubsurfaceProfileFactory()
    )
    settings = profile.get_editor_property("settings")
    for property_name, value in PROFILE_SETTINGS.items():
        if isinstance(value, tuple):
            settings.set_editor_property(property_name, linear_color(value))
        else:
            settings.set_editor_property(property_name, value)
    profile.set_editor_property("settings", settings)
    return profile


def expression(material, expression_class, x: int, y: int, description: str):
    node = unreal.MaterialEditingLibrary.create_material_expression(
        material,
        expression_class.static_class(),
        node_pos_x=x,
        node_pos_y=y,
    )
    if not node:
        raise RuntimeError(
            f"Could not create {expression_class} in {material.get_path_name()}"
        )
    node.set_editor_property("desc", description)
    return node


def connect_expression(source, output_name: str, target, input_name: str) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_expressions(
        source, output_name, target, input_name
    ):
        raise RuntimeError(
            f"Could not connect {source.get_name()} to {target.get_name()}.{input_name}"
        )


def connect_output(source, output_name: str, material_property) -> None:
    if not unreal.MaterialEditingLibrary.connect_material_property(
        source, output_name, material_property
    ):
        raise RuntimeError(
            f"Could not connect {source.get_name()} to {material_property}"
        )


def material_usages() -> dict[str, object]:
    return {
        name: getattr(unreal.MaterialUsage, name)
        for name in dir(unreal.MaterialUsage)
        if name.startswith("MATUSAGE_") and name != "MATUSAGE_MAX"
    }


def set_exact_material_usages(material) -> None:
    allowed = {"MATUSAGE_SKELETAL_MESH", "MATUSAGE_MORPH_TARGETS"}
    usages = material_usages()
    if not allowed.issubset(usages):
        raise RuntimeError(f"Unreal MaterialUsage API omitted required flags: {usages}")
    for name, usage in usages.items():
        unreal.MaterialEditingLibrary.set_base_material_usage(
            material, usage, name in allowed
        )


def texture_sample(material, contract: dict, texture, x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionTextureSampleParameter2D,
        x,
        y,
        (
            "Exact deterministic source receipt; review-only skin lookdev, "
            "not historical complexion evidence."
        ),
    )
    node.set_editor_property("parameter_name", contract["parameterName"])
    node.set_editor_property("texture", texture)
    node.set_editor_property(
        "sampler_type", getattr(unreal.MaterialSamplerType, contract["samplerType"])
    )
    return node


def scalar_parameter(material, name: str, value: float, x: int, y: int):
    node = expression(
        material,
        unreal.MaterialExpressionScalarParameter,
        x,
        y,
        f"Bounded deterministic {name}; change only through recorded skin review.",
    )
    node.set_editor_property("parameter_name", name)
    node.set_editor_property("default_value", value)
    node.set_editor_property("group", "Chen Sheng Skin Lookdev V1")
    return node


def author_material(textures: dict, profile):
    material = create_asset(MATERIAL_NAME, unreal.Material, unreal.MaterialFactoryNew())
    unreal.MaterialEditingLibrary.delete_all_material_expressions(material)
    material.set_editor_property("two_sided", False)
    material.set_editor_property("use_material_attributes", False)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property("material_domain", unreal.MaterialDomain.MD_SURFACE)
    material.set_editor_property(
        "shading_model", unreal.MaterialShadingModel.MSM_SUBSURFACE_PROFILE
    )
    material.set_editor_property("subsurface_profile", profile)
    material.set_editor_property("tangent_space_normal", True)
    set_exact_material_usages(material)

    uv0 = expression(
        material,
        unreal.MaterialExpressionTextureCoordinate,
        -920,
        -240,
        "Exact UV0 for the non-tiling whole-body base color and packed mask.",
    )
    uv0.set_editor_property("coordinate_index", 0)
    uv0.set_editor_property("u_tiling", 1.0)
    uv0.set_editor_property("v_tiling", 1.0)

    detail_uv0 = expression(
        material,
        unreal.MaterialExpressionTextureCoordinate,
        -920,
        180,
        "UV0 repeating microdetail; 24 is the bounded midpoint of 16/24/32 tests.",
    )
    detail_uv0.set_editor_property("coordinate_index", 0)
    detail_uv0.set_editor_property("u_tiling", DETAIL_TILING)
    detail_uv0.set_editor_property("v_tiling", DETAIL_TILING)

    base_color = texture_sample(
        material, SOURCE_TEXTURES["baseColor"], textures["baseColor"], -620, -300
    )
    masks = texture_sample(
        material,
        SOURCE_TEXTURES["materialMasks"],
        textures["materialMasks"],
        -620,
        -40,
    )
    normal = texture_sample(
        material,
        SOURCE_TEXTURES["detailNormal"],
        textures["detailNormal"],
        -620,
        260,
    )
    metallic = scalar_parameter(material, "Metallic", 0.0, -300, 420)
    specular = scalar_parameter(material, "Specular", SPECULAR, -300, 540)

    # UE 5.8's MaterialEditingLibrary resolves the shortened graph-pin label
    # (`UVs`), not the underlying FExpressionInput property name (`Coordinates`).
    connect_expression(uv0, "", base_color, "UVs")
    connect_expression(uv0, "", masks, "UVs")
    connect_expression(detail_uv0, "", normal, "UVs")
    connect_output(base_color, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)
    connect_output(masks, "G", unreal.MaterialProperty.MP_ROUGHNESS)
    connect_output(masks, "R", unreal.MaterialProperty.MP_AMBIENT_OCCLUSION)
    # UE 5.8's Subsurface Profile path reads its per-pixel radius/opacity scale
    # from MP_OPACITY -> GBuffer.CustomData.a. MP_SUBSURFACE_COLOR is ignored by
    # that path and must remain unconnected so the source contract cannot appear
    # functional while silently rendering at full profile strength.
    connect_output(masks, "B", unreal.MaterialProperty.MP_OPACITY)
    connect_output(normal, "RGB", unreal.MaterialProperty.MP_NORMAL)
    connect_output(metallic, "", unreal.MaterialProperty.MP_METALLIC)
    connect_output(specular, "", unreal.MaterialProperty.MP_SPECULAR)
    return material


def enum_name(value) -> str:
    text = str(value)
    if "." in text:
        text = text.rsplit(".", 1)[-1]
    return text.split(":", 1)[0].strip(" <>\t\r\n")


def texture_dimensions(texture) -> tuple[int, int]:
    asset_data = unreal.EditorAssetLibrary.find_asset_data(texture.get_path_name())
    value = asset_data.get_tag_value("Dimensions")
    parts = str(value).lower().split("x") if value is not None else []
    if len(parts) != 2:
        return (-1, -1)
    return (int(parts[0]), int(parts[1]))


def inspect_texture(
    role: str, texture, repository: Path, imported_paths: list[str]
) -> dict:
    contract = SOURCE_TEXTURES[role]
    source_path = repository / contract["relativeFile"]
    import_data = texture.get_editor_property("asset_import_data")
    import_filename = str(import_data.get_first_filename()) if import_data else ""
    import_data_class = (
        import_data.get_class().get_path_name() if import_data is not None else ""
    )
    resolved_import_filenames = (
        [Path(str(item)).resolve() for item in import_data.extract_filenames()]
        if import_data is not None
        else []
    )
    is_interchange_import_data = isinstance(
        import_data, unreal.InterchangeAssetImportData
    )
    dimensions = texture_dimensions(texture)
    expected_path = object_path(contract["assetName"])
    expected_imported_paths = [] if not imported_paths else [expected_path]
    checks = {
        "exactClass": isinstance(texture, unreal.Texture2D),
        "exactAssetPath": texture.get_path_name() == expected_path,
        "exactImportedObjectPath": imported_paths == expected_imported_paths,
        "exactSourceFilename": bool(import_filename)
        and Path(import_filename).resolve() == source_path.resolve(),
        "exactBaseAssetImportDataClass": import_data_class
        == "/Script/Engine.AssetImportData",
        "noInterchangeAssetImportData": not is_interchange_import_data,
        "exactOneResolvedSourceFilename": resolved_import_filenames
        == [source_path.resolve()],
        "exactDimensions": dimensions == (contract["width"], contract["height"]),
        "exactSrgb": bool(texture.get_editor_property("srgb")) is contract["srgb"],
        "exactCompression": texture.get_editor_property("compression_settings")
        == getattr(unreal.TextureCompressionSettings, contract["compression"]),
        "exactAddressing": texture.get_editor_property("address_x")
        == getattr(unreal.TextureAddress, contract["address"])
        and texture.get_editor_property("address_y")
        == getattr(unreal.TextureAddress, contract["address"]),
        "exactTextureGroup": texture.get_editor_property("lod_group")
        == getattr(unreal.TextureGroup, contract["lodGroup"]),
        "directxGreenNotFlipped": not bool(
            texture.get_editor_property("flip_green_channel")
        ),
        "notVirtualTexture": not bool(
            texture.get_editor_property("virtual_texture_streaming")
        ),
    }
    return {
        "role": role,
        "assetPath": texture.get_path_name(),
        "source": file_receipt(source_path, repository),
        # Keep the host-specific absolute import filename in memory for the
        # equality check above, but publish only the repository-relative source
        # identity. Public evidence must not disclose workstation paths.
        "importFilename": contract["relativeFile"],
        "serializedImportMetadata": {
            "class": import_data_class,
            "sourceFilenameCount": len(resolved_import_filenames),
            "interchangeGraphRetained": is_interchange_import_data,
        },
        "importedObjectPaths": imported_paths,
        "dimensions": list(dimensions),
        "srgb": bool(texture.get_editor_property("srgb")),
        "compression": enum_name(texture.get_editor_property("compression_settings")),
        "addressX": enum_name(texture.get_editor_property("address_x")),
        "addressY": enum_name(texture.get_editor_property("address_y")),
        "textureGroup": enum_name(texture.get_editor_property("lod_group")),
        "checks": checks,
        "passed": all(checks.values()),
    }


def color_values(value) -> list[float]:
    return [float(value.r), float(value.g), float(value.b), float(value.a)]


def close_float(actual: float, expected: float) -> bool:
    return abs(float(actual) - float(expected)) <= FLOAT_TOLERANCE


def close_color(actual, expected: tuple[float, float, float, float]) -> bool:
    values = color_values(actual)
    return all(close_float(values[index], expected[index]) for index in range(4))


def inspect_profile(profile) -> dict:
    settings = profile.get_editor_property("settings")
    values = {}
    checks = {
        "exactClass": isinstance(profile, unreal.SubsurfaceProfile),
        "exactAssetPath": profile.get_path_name() == object_path(PROFILE_NAME),
    }
    for property_name, expected in PROFILE_SETTINGS.items():
        actual = settings.get_editor_property(property_name)
        values[property_name] = (
            color_values(actual) if isinstance(expected, tuple) else actual
        )
        checks[f"exactSetting:{property_name}"] = (
            close_color(actual, expected)
            if isinstance(expected, tuple)
            else actual is expected
            if isinstance(expected, bool)
            else close_float(actual, expected)
        )
    return {
        "assetPath": profile.get_path_name(),
        "settings": values,
        "checks": checks,
        "passed": all(checks.values()),
    }


def class_name(value) -> str | None:
    return value.get_class().get_name() if value else None


def parameter_map(expressions: list) -> dict[str, object]:
    result = {}
    for node in expressions:
        if isinstance(
            node,
            (
                unreal.MaterialExpressionTextureSampleParameter2D,
                unreal.MaterialExpressionScalarParameter,
            ),
        ):
            result[str(node.get_editor_property("parameter_name"))] = node
    return result


def material_output(material, material_property) -> tuple[object, str]:
    return (
        unreal.MaterialEditingLibrary.get_material_property_input_node(
            material, material_property
        ),
        str(
            unreal.MaterialEditingLibrary.get_material_property_input_node_output_name(
                material, material_property
            )
        ),
    )


def inspect_material(
    material,
    textures: dict,
    profile,
    compile_material: bool,
    prior_compile_receipt: bool,
    allow_used_texture_deferral: bool,
) -> dict:
    expressions = list(unreal.MaterialEditingLibrary.get_material_expressions(material))
    parameters = parameter_map(expressions)
    uv_nodes = [
        node
        for node in expressions
        if isinstance(node, unreal.MaterialExpressionTextureCoordinate)
    ]
    base_uv = next(
        (
            node
            for node in uv_nodes
            if close_float(node.get_editor_property("u_tiling"), 1.0)
            and close_float(node.get_editor_property("v_tiling"), 1.0)
        ),
        None,
    )
    detail_uv = next(
        (
            node
            for node in uv_nodes
            if close_float(node.get_editor_property("u_tiling"), DETAIL_TILING)
            and close_float(node.get_editor_property("v_tiling"), DETAIL_TILING)
        ),
        None,
    )

    expected_parameter_names = {
        "BaseColor2K",
        "MaterialMasks2K",
        "DetailNormal1K",
        "Metallic",
        "Specular",
    }
    base_node = parameters.get("BaseColor2K")
    masks_node = parameters.get("MaterialMasks2K")
    normal_node = parameters.get("DetailNormal1K")
    metallic_node = parameters.get("Metallic")
    specular_node = parameters.get("Specular")

    outputs = {
        "baseColor": material_output(material, unreal.MaterialProperty.MP_BASE_COLOR),
        "roughness": material_output(material, unreal.MaterialProperty.MP_ROUGHNESS),
        "ambientOcclusion": material_output(
            material, unreal.MaterialProperty.MP_AMBIENT_OCCLUSION
        ),
        "opacity": material_output(material, unreal.MaterialProperty.MP_OPACITY),
        "subsurfaceColor": material_output(
            material, unreal.MaterialProperty.MP_SUBSURFACE_COLOR
        ),
        "normal": material_output(material, unreal.MaterialProperty.MP_NORMAL),
        "metallic": material_output(material, unreal.MaterialProperty.MP_METALLIC),
        "specular": material_output(material, unreal.MaterialProperty.MP_SPECULAR),
    }
    expected_outputs = {
        "baseColor": (base_node, "RGB"),
        "roughness": (masks_node, "G"),
        "ambientOcclusion": (masks_node, "R"),
        "opacity": (masks_node, "B"),
        "normal": (normal_node, "RGB"),
        "metallic": (metallic_node, ""),
        "specular": (specular_node, ""),
    }

    compile_errors = (
        list(unreal.MaterialEditingLibrary.recompile_material(material))
        if compile_material
        else []
    )
    usages = {
        name: unreal.MaterialEditingLibrary.has_material_usage(material, usage)
        for name, usage in material_usages().items()
    }
    active_usages = {name for name, active in usages.items() if active}
    expected_usages = {"MATUSAGE_SKELETAL_MESH", "MATUSAGE_MORPH_TARGETS"}

    used_texture_api = getattr(
        unreal.MaterialEditingLibrary, "get_material_used_textures", None
    )
    used_texture_api_available = callable(used_texture_api)
    used_textures = (
        list(used_texture_api(material)) if used_texture_api_available else []
    )
    used_texture_api_returned_exactly_empty = (
        used_texture_api_available and len(used_textures) == 0
    )
    used_texture_api_returned_nonempty = (
        used_texture_api_available and len(used_textures) > 0
    )
    expected_texture_paths = {
        textures[role].get_path_name() for role in SOURCE_TEXTURES
    }
    full_used_texture_paths = {
        item.get_path_name() if item is not None else "<null>" for item in used_textures
    }
    admitted_project_texture_paths = full_used_texture_paths & expected_texture_paths
    missing_project_texture_paths = (
        expected_texture_paths - admitted_project_texture_paths
    )
    engine_extra_texture_paths = {
        path for path in full_used_texture_paths if path.startswith("/Engine/")
    }
    admitted_engine_extra_texture_paths = (
        engine_extra_texture_paths & ALLOWED_ENGINE_IMPLICIT_TEXTURE_PATHS
    )
    unapproved_texture_paths = full_used_texture_paths - (
        expected_texture_paths | admitted_engine_extra_texture_paths
    )
    exact_three_admitted_project_textures = (
        admitted_project_texture_paths == expected_texture_paths
        and len(admitted_project_texture_paths) == 3
    )
    bounded_engine_implicit_texture_extras = (
        engine_extra_texture_paths.issubset(ALLOWED_ENGINE_IMPLICIT_TEXTURE_PATHS)
        and len(engine_extra_texture_paths) <= MAXIMUM_ENGINE_IMPLICIT_TEXTURE_COUNT
    )
    no_unapproved_texture_paths = not unapproved_texture_paths
    used_texture_entries_unique_by_path = len(used_textures) == len(
        full_used_texture_paths
    )
    graph_classes = [class_name(node) for node in expressions]
    scalar_parameters = {
        name: float(parameters[name].get_editor_property("default_value"))
        for name in ("Metallic", "Specular")
        if name in parameters
    }
    texture_parameters = {
        name: {
            "texture": (
                parameters[name].get_editor_property("texture").get_path_name()
                if parameters[name].get_editor_property("texture")
                else None
            ),
            "samplerType": enum_name(
                parameters[name].get_editor_property("sampler_type")
            ),
        }
        for name in ("BaseColor2K", "MaterialMasks2K", "DetailNormal1K")
        if name in parameters
    }

    def exact_uv_input(node, expected_uv) -> bool:
        if node is None or expected_uv is None:
            return False
        inputs = list(
            unreal.MaterialEditingLibrary.get_inputs_for_material_expression(
                material, node
            )
        )
        return (
            bool(inputs)
            and inputs[0] == expected_uv
            and all(item is None for item in inputs[1:])
        )

    checks = {
        "exactClass": isinstance(material, unreal.Material),
        "exactAssetPath": material.get_path_name() == object_path(MATERIAL_NAME),
        "opaqueSubsurfaceProfileSingleSidedSurface": material.get_editor_property(
            "blend_mode"
        )
        == unreal.BlendMode.BLEND_OPAQUE
        and material.get_editor_property("material_domain")
        == unreal.MaterialDomain.MD_SURFACE
        and material.get_editor_property("shading_model")
        == unreal.MaterialShadingModel.MSM_SUBSURFACE_PROFILE
        and not bool(material.get_editor_property("two_sided"))
        and not bool(material.get_editor_property("use_material_attributes")),
        "exactSubsurfaceProfile": material.get_editor_property("subsurface_profile")
        == profile,
        "tangentSpaceNormal": bool(
            material.get_editor_property("tangent_space_normal")
        ),
        "exactSevenNodeGraph": len(expressions) == 7,
        "exactGraphClasses": graph_classes.count(
            "MaterialExpressionTextureSampleParameter2D"
        )
        == 3
        and graph_classes.count("MaterialExpressionTextureCoordinate") == 2
        and graph_classes.count("MaterialExpressionScalarParameter") == 2,
        "exactParameters": set(parameters) == expected_parameter_names,
        "exactTextureParameters": len(texture_parameters) == 3
        and all(
            texture_parameters[contract["parameterName"]]["texture"]
            == textures[role].get_path_name()
            and texture_parameters[contract["parameterName"]]["samplerType"]
            == contract["samplerType"]
            for role, contract in SOURCE_TEXTURES.items()
        ),
        "exactScalarParameters": set(scalar_parameters) == {"Metallic", "Specular"}
        and close_float(scalar_parameters.get("Metallic", -1.0), 0.0)
        and close_float(scalar_parameters.get("Specular", -1.0), SPECULAR)
        and scalar_parameters.get("Specular", 1.0) <= MAXIMUM_SPECULAR,
        "exactUv0BaseAndMask": bool(base_uv)
        and base_uv.get_editor_property("coordinate_index") == 0
        and exact_uv_input(base_node, base_uv)
        and exact_uv_input(masks_node, base_uv),
        "boundedDetailUv0Tiling": bool(detail_uv)
        and detail_uv.get_editor_property("coordinate_index") == 0
        and DETAIL_TILING in ALLOWED_DETAIL_TILING
        and min(ALLOWED_DETAIL_TILING) <= DETAIL_TILING <= max(ALLOWED_DETAIL_TILING)
        and exact_uv_input(normal_node, detail_uv),
        "exactMaterialOutputs": all(
            outputs[name][0] == expected_outputs[name][0]
            and outputs[name][1] == expected_outputs[name][1]
            for name in expected_outputs
        ),
        "exactProfileOpacityFromMaskB": outputs["opacity"][0] == masks_node
        and outputs["opacity"][1] == "B"
        and SUBSURFACE_PROFILE_OPACITY_BYTE == 89
        and UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD
        < SUBSURFACE_PROFILE_OPACITY
        <= SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0
        and close_float(
            PROFILE_SETTINGS["mean_free_path_distance"] * SUBSURFACE_PROFILE_OPACITY,
            MAXIMUM_EFFECTIVE_MEAN_FREE_PATH,
        )
        and MAXIMUM_EFFECTIVE_MEAN_FREE_PATH <= 0.9335576471,
        "subsurfaceColorUnconnected": outputs["subsurfaceColor"][0] is None,
        "exactSkeletalAndMorphUsages": active_usages == expected_usages,
        "compileClean": (
            not compile_errors if compile_material else prior_compile_receipt
        ),
        "noSubsurfaceColorEmissiveOpacityMaskDisplacementOrWorldOffset": all(
            unreal.MaterialEditingLibrary.get_material_property_input_node(
                material, material_property
            )
            is None
            for material_property in (
                unreal.MaterialProperty.MP_SUBSURFACE_COLOR,
                unreal.MaterialProperty.MP_EMISSIVE_COLOR,
                unreal.MaterialProperty.MP_OPACITY_MASK,
                unreal.MaterialProperty.MP_WORLD_POSITION_OFFSET,
            )
        ),
    }
    core_material_checks_passed = all(checks.values())
    strict_used_texture_observation_passed = (
        used_texture_api_returned_nonempty
        and used_texture_entries_unique_by_path
        and exact_three_admitted_project_textures
        and bounded_engine_implicit_texture_extras
        and no_unapproved_texture_paths
    )
    used_texture_inspection_deferred = (
        allow_used_texture_deferral
        and used_texture_api_returned_exactly_empty
        and core_material_checks_passed
    )
    used_texture_inspection_accepted = (
        strict_used_texture_observation_passed or used_texture_inspection_deferred
    )
    if strict_used_texture_observation_passed:
        used_texture_inspection_state = "observed-strict-pass"
    elif used_texture_inspection_deferred:
        used_texture_inspection_state = "deferred-to-read-only-reload"
    elif not used_texture_api_available:
        used_texture_inspection_state = "api-unavailable-fail"
    elif used_texture_api_returned_exactly_empty:
        used_texture_inspection_state = "empty-not-admitted-fail"
    else:
        used_texture_inspection_state = "observed-strict-fail"
    checks["usedTextureInspectionAcceptedForCurrentMode"] = (
        used_texture_inspection_accepted
    )
    return {
        "assetPath": material.get_path_name(),
        "profile": profile.get_path_name(),
        "nodeCount": len(expressions),
        "nodeClasses": graph_classes,
        "fullUsedTexturePaths": sorted(full_used_texture_paths),
        "fullUsedTextureCount": len(full_used_texture_paths),
        "admittedProjectTexturePaths": sorted(admitted_project_texture_paths),
        "missingProjectTexturePaths": sorted(missing_project_texture_paths),
        "usedTextureInspection": {
            "api": "MaterialEditingLibrary.get_material_used_textures",
            "state": used_texture_inspection_state,
            "apiAvailable": used_texture_api_available,
            "apiReturnedExactlyEmpty": used_texture_api_returned_exactly_empty,
            "apiReturnedNonempty": used_texture_api_returned_nonempty,
            "rawEntryCount": len(used_textures),
            "observedTexturePathCount": len(full_used_texture_paths),
            "observedTextureClaimsMade": used_texture_api_returned_nonempty,
            "strictObservationPassed": strict_used_texture_observation_passed,
            "deferredToReadOnlyReload": used_texture_inspection_deferred,
            "deferralAllowedForCurrentMode": allow_used_texture_deferral,
            "acceptedForCurrentMode": used_texture_inspection_accepted,
            "observationChecks": {
                "apiAvailable": used_texture_api_available,
                "apiReturnedNonempty": used_texture_api_returned_nonempty,
                "uniqueEntriesByPathObserved": used_texture_api_returned_nonempty
                and used_texture_entries_unique_by_path,
                "exactThreeAdmittedProjectTexturesObserved": (
                    used_texture_api_returned_nonempty
                    and exact_three_admitted_project_textures
                ),
                "boundedOptionalEngineDefaultObserved": (
                    used_texture_api_returned_nonempty
                    and bounded_engine_implicit_texture_extras
                ),
                "noUnapprovedTexturePathsObserved": (
                    used_texture_api_returned_nonempty and no_unapproved_texture_paths
                ),
                "strictThreeProjectTexturesPlusBoundedEngineDefaultObserved": (
                    strict_used_texture_observation_passed
                ),
            },
            "deferralChecks": {
                "authorizedImportReplaceMode": allow_used_texture_deferral,
                "apiReturnedExactlyEmpty": used_texture_api_returned_exactly_empty,
                "coreMaterialChecksPassedBeforeDeferral": (core_material_checks_passed),
            },
        },
        "engineExtras": {
            "observationAvailable": used_texture_api_returned_nonempty,
            "texturePaths": sorted(engine_extra_texture_paths),
            "count": len(engine_extra_texture_paths),
            "admittedTexturePaths": sorted(admitted_engine_extra_texture_paths),
            "allowedTexturePaths": sorted(ALLOWED_ENGINE_IMPLICIT_TEXTURE_PATHS),
            "maximumCount": MAXIMUM_ENGINE_IMPLICIT_TEXTURE_COUNT,
            "unapprovedTexturePaths": sorted(
                engine_extra_texture_paths - ALLOWED_ENGINE_IMPLICIT_TEXTURE_PATHS
            ),
            "passed": used_texture_api_returned_nonempty
            and bounded_engine_implicit_texture_extras,
        },
        "unapprovedTexturePaths": sorted(unapproved_texture_paths),
        "textureParameters": texture_parameters,
        "scalarParameters": scalar_parameters,
        "uvCoordinates": [
            {
                "coordinateIndex": int(node.get_editor_property("coordinate_index")),
                "uTiling": float(node.get_editor_property("u_tiling")),
                "vTiling": float(node.get_editor_property("v_tiling")),
            }
            for node in uv_nodes
        ],
        "outputs": {
            name: {"node": class_name(value[0]), "output": value[1]}
            for name, value in outputs.items()
        },
        "subsurfaceProfileOpacity": {
            "source": "MaterialMasks2K.B",
            "sourceByte": SUBSURFACE_PROFILE_OPACITY_BYTE,
            "value": SUBSURFACE_PROFILE_OPACITY,
            "thresholdExclusive": UE_SUBSURFACE_PROFILE_OPACITY_THRESHOLD,
            "maximum": SUBSURFACE_PROFILE_OPACITY_BYTE / 255.0,
            "profileMeanFreePathDistance": PROFILE_MEAN_FREE_PATH_DISTANCE,
            "effectiveMeanFreePath": MAXIMUM_EFFECTIVE_MEAN_FREE_PATH,
            "maximumEffectiveMeanFreePath": MAXIMUM_EFFECTIVE_MEAN_FREE_PATH,
            "materialInput": "MP_OPACITY",
            "subsurfaceColorInput": "unconnected",
            "passed": checks["exactProfileOpacityFromMaskB"]
            and checks["subsurfaceColorUnconnected"],
        },
        "materialUsages": usages,
        "activeMaterialUsages": sorted(active_usages),
        "compiledDuringThisRun": compile_material,
        "priorImportCompileReceiptAccepted": prior_compile_receipt,
        "compileErrors": [str(error) for error in compile_errors],
        "coreMaterialChecksPassed": core_material_checks_passed,
        "checks": checks,
        "passed": all(checks.values()),
    }


def destination_inventory() -> dict:
    paths = sorted(unreal.EditorAssetLibrary.list_assets(DESTINATION, recursive=True))
    assets = []
    for path in paths:
        asset = unreal.EditorAssetLibrary.load_asset(path)
        assets.append(
            {
                "path": path,
                "class": asset.get_class().get_name() if asset else None,
            }
        )
    expected = {
        object_path(PROFILE_NAME): "SubsurfaceProfile",
        object_path(MATERIAL_NAME): "Material",
        object_path(BASE_COLOR_NAME): "Texture2D",
        object_path(MASKS_NAME): "Texture2D",
        object_path(DETAIL_NORMAL_NAME): "Texture2D",
    }
    actual = {item["path"]: item["class"] for item in assets}
    forbidden_classes = {
        "MaterialInstanceConstant",
        "SkeletalMesh",
        "StaticMesh",
        "Skeleton",
        "PhysicsAsset",
        "AnimSequence",
        "AnimationAsset",
        "Blueprint",
        "DataAsset",
        "PrimaryDataAsset",
        "Texture2DArray",
    }
    checks = {
        "exactFiveAssetsNoExtras": actual == expected and len(assets) == 5,
        "exactClasses": all(expected[path] == actual.get(path) for path in expected),
        "noMaterialInstanceMeshRigAnimationOrGameplayAssets": all(
            item["class"] not in forbidden_classes for item in assets
        ),
        "noHeightTextureAsset": all("Height" not in item["path"] for item in assets),
    }
    return {
        "assets": assets,
        "expected": expected,
        "checks": checks,
        "passed": all(checks.values()),
    }


def evidence_path(repository: Path) -> Path:
    return repository / EVIDENCE_RELATIVE_PATH


def write_report(repository: Path, report: dict) -> Path:
    path = evidence_path(repository)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(f".{path.name}.tmp")
    temporary_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(path)
    return path


def import_receipt_root(report: dict) -> dict:
    """Return the immutable import receipt, excluding reload inspection state."""
    return {key: value for key, value in report.items() if key != "readOnlyInspection"}


def import_receipt_root_sha256(report: dict) -> str:
    payload = json.dumps(
        import_receipt_root(report),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def successful_import_receipt(report: dict) -> bool:
    material = report.get("material", {})
    tracked = report.get("trackedUnrealAssets", {})
    embedded_metadata_privacy = report.get("embeddedMetadataPrivacy", {})
    receipts = tracked.get("receipts", {})
    expected_uassets = {
        f"{PROFILE_NAME}.uasset",
        f"{MATERIAL_NAME}.uasset",
        f"{BASE_COLOR_NAME}.uasset",
        f"{MASKS_NAME}.uasset",
        f"{DETAIL_NORMAL_NAME}.uasset",
    }
    return (
        report.get("assetId") == ASSET_ID
        and report.get("destination") == DESTINATION
        and report.get("mode") == "import-replace"
        and report.get("mutationAuthorized") is True
        and report.get("passed") is True
        and report.get("saved") is True
        and material.get("compiledDuringThisRun") is True
        and material.get("checks", {}).get("compileClean") is True
        and material.get("passed") is True
        and tracked.get("passed") is True
        and embedded_metadata_privacy.get("passed") is True
        and tracked.get("checks", {}).get("exactFiveUassetsNoDiskExtras") is True
        and set(receipts) == expected_uassets
        and len(receipts) == 5
        and all(
            isinstance(item, dict)
            and isinstance(item.get("bytes"), int)
            and item["bytes"] > 0
            and isinstance(item.get("sha256"), str)
            and len(item["sha256"]) == 64
            for item in receipts.values()
        )
    )


def main() -> None:
    requested_mode = os.environ.get(MUTATION_ENV, "")
    if requested_mode not in {"", "0", "1"}:
        raise RuntimeError(f"{MUTATION_ENV} must be unset, 0 or exactly 1")
    replace = requested_mode == "1"
    project_dir = Path(unreal.Paths.project_dir()).resolve()
    repository = project_dir.parents[1]
    destination_disk_root = (
        project_dir
        / "Content"
        / "SHI"
        / "Art"
        / "Characters"
        / "DazeCouncilSkinLookdevV1"
    )

    previous_import_report = None
    immutable_import_root_sha256 = None
    if not replace:
        canonical_evidence_path = evidence_path(repository)
        if not canonical_evidence_path.is_file():
            raise RuntimeError(
                "Inspect-only requires the canonical successful import-replace "
                "receipt; no evidence file exists. Run the exact authorized import "
                f"with {MUTATION_ENV}=1."
            )
        candidate = json.loads(canonical_evidence_path.read_text(encoding="utf-8"))
        if not successful_import_receipt(candidate):
            raise RuntimeError(
                "Inspect-only refused to replace canonical evidence because it is "
                "not an immutable successful import-replace receipt. The existing "
                "file was left untouched; rerun the exact authorized import first."
            )
        previous_import_report = candidate
        immutable_import_root_sha256 = import_receipt_root_sha256(candidate)

    source_contract = validate_source_contract(repository)
    (
        baseline_status,
        baseline_disk_before,
        baseline_assets_before,
        skeleton_before,
    ) = validate_baseline_contract(repository, project_dir)

    destination_exists = unreal.EditorAssetLibrary.does_directory_exist(DESTINATION)
    if not replace and not destination_exists:
        raise RuntimeError(
            "Skin lookdev destination is absent. Default mode cannot create assets; "
            f"set {MUTATION_ENV}=1 for the exact isolated import."
        )
    if replace and destination_exists:
        if not unreal.EditorAssetLibrary.delete_directory(DESTINATION):
            raise RuntimeError(
                f"Could not replace exact isolated target: {DESTINATION}"
            )

    textures = {}
    imported_paths = {role: [] for role in SOURCE_TEXTURES}
    if replace:
        for role, contract in SOURCE_TEXTURES.items():
            textures[role], imported_paths[role] = import_texture(
                repository / contract["relativeFile"], contract
            )
        profile = author_profile()
        material = author_material(textures, profile)
    else:
        for role, contract in SOURCE_TEXTURES.items():
            texture = unreal.EditorAssetLibrary.load_asset(
                asset_path(contract["assetName"])
            )
            if not isinstance(texture, unreal.Texture2D):
                raise RuntimeError(
                    f"Missing exact isolated Texture2D: {asset_path(contract['assetName'])}"
                )
            textures[role] = texture
        profile = unreal.EditorAssetLibrary.load_asset(asset_path(PROFILE_NAME))
        material = unreal.EditorAssetLibrary.load_asset(asset_path(MATERIAL_NAME))

    if not isinstance(profile, unreal.SubsurfaceProfile):
        raise RuntimeError(
            f"Missing exact SubsurfaceProfile: {asset_path(PROFILE_NAME)}"
        )
    if not isinstance(material, unreal.Material):
        raise RuntimeError(f"Missing exact Material: {asset_path(MATERIAL_NAME)}")

    texture_status = {
        role: inspect_texture(role, textures[role], repository, imported_paths[role])
        for role in SOURCE_TEXTURES
    }
    profile_status = inspect_profile(profile)
    prior_compile_receipt = bool(previous_import_report) and (
        previous_import_report.get("material", {}).get("compiledDuringThisRun") is True
        and previous_import_report.get("material", {})
        .get("checks", {})
        .get("compileClean")
        is True
        and previous_import_report.get("material", {}).get("passed") is True
    )
    material_status = inspect_material(
        material,
        textures,
        profile,
        compile_material=replace,
        prior_compile_receipt=prior_compile_receipt,
        allow_used_texture_deferral=replace,
    )
    inventory = destination_inventory()

    baseline_disk_after = relative_uasset_receipts(
        project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncilFacial"
    )
    baseline_assets_after = sorted(
        unreal.EditorAssetLibrary.list_assets(BASELINE_DESTINATION, recursive=True)
    )
    skeleton_file = (
        project_dir
        / "Content"
        / "SHI"
        / "Art"
        / "Characters"
        / "DazeCouncil"
        / SHARED_SKELETON_FILE
    )
    skeleton_after = file_receipt(skeleton_file, repository)
    preservation_checks = {
        "exactAcceptedFacialUassetHashesUnchanged": baseline_disk_after
        == baseline_disk_before,
        "exactAcceptedFacialAssetInventoryUnchanged": baseline_assets_after
        == baseline_assets_before,
        "sharedSkeletonHashUnchanged": skeleton_after == skeleton_before,
        "destinationRemainsIsolated": DESTINATION != BASELINE_DESTINATION
        and DESTINATION != SHARED_SKELETON_DESTINATION,
    }

    height_path = repository / HEIGHT_SOURCE["relativeFile"]
    height_receipt = file_receipt(height_path, repository)
    report = {
        "assetId": ASSET_ID,
        "status": (
            "isolated Chen Sheng skin material lookdev; source-review candidate, "
            "not final skin or close-camera authority"
        ),
        "disclosure": (
            "CHEN SHENG SKIN MATERIAL LOOKDEV · GENERIC DRAMATIC CASTING · "
            "NOT A HISTORICAL LIKENESS OR COMPLEXION CLAIM · NOT FINAL CHARACTER ART"
        ),
        "mode": "import-replace" if replace else "inspect-only",
        "mutationEnvironment": MUTATION_ENV,
        "mutationAuthorized": replace,
        "engineVersion": unreal.SystemLibrary.get_engine_version(),
        "destination": DESTINATION,
        "sourceContract": source_contract,
        "canonicalHeightSource": {
            "receipt": height_receipt,
            "pngHeader": png_ihdr(height_path),
            "importedIntoEngine": False,
            "derivedNormalAsset": object_path(DETAIL_NORMAL_NAME),
            "checks": {
                "exact16BitSource": png_ihdr(height_path)["bitDepth"] == 16,
                "sourceOnlyNoEngineAsset": "Height"
                not in " ".join(item["path"] for item in inventory["assets"]),
            },
        },
        "textureImports": texture_status,
        "subsurfaceProfile": profile_status,
        "material": material_status,
        "destinationInventory": inventory,
        "acceptedFacialPreservation": {
            "before": baseline_status,
            "assetCountAfter": len(baseline_assets_after),
            "uassetReceiptCountAfter": len(baseline_disk_after),
            "checks": preservation_checks,
            "passed": all(preservation_checks.values()),
        },
        "authorityBoundary": {
            "reviewOnly": True,
            "chenShengOnly": True,
            "historicalPortrait": False,
            "historicallyAttestedComplexion": False,
            "humanHistoricalCulturalReviewApproved": False,
            "closeCameraApproved": False,
            "finalCharacterArt": False,
            "interaction": False,
            "gameplay": False,
            "saveOrCampaign": False,
            "replication": False,
            "runtimeRandomness": False,
            "dynamicNetworkDependency": False,
        },
        "limitations": [
            "Review-only deterministic material candidate; no historical likeness or complexion claim.",
            "Inherited whole-body UV supports material QA, not film-close final framing.",
            "Mouth interior, interaction hands, brows, lashes, hair, costume, voice, lip sync and acting remain red gates.",
            "Human character/anatomy, historical/cultural, cinematic color and accessibility review remain required.",
        ],
    }
    report["canonicalHeightSource"]["passed"] = all(
        report["canonicalHeightSource"]["checks"].values()
    )
    report["passed"] = (
        source_contract["passed"]
        and all(item["passed"] for item in texture_status.values())
        and profile_status["passed"]
        and material_status["passed"]
        and inventory["passed"]
        and report["canonicalHeightSource"]["passed"]
        and report["acceptedFacialPreservation"]["passed"]
    )

    if replace and report["passed"]:
        if not unreal.EditorAssetLibrary.save_directory(
            DESTINATION, only_if_is_dirty=False, recursive=True
        ):
            raise RuntimeError(f"Could not save exact isolated target: {DESTINATION}")
        report["saved"] = True
    else:
        report["saved"] = False

    tracked_files = relative_all_file_receipts(destination_disk_root)
    expected_uassets = {
        f"{PROFILE_NAME}.uasset",
        f"{MATERIAL_NAME}.uasset",
        f"{BASE_COLOR_NAME}.uasset",
        f"{MASKS_NAME}.uasset",
        f"{DETAIL_NORMAL_NAME}.uasset",
    }
    tracked_checks = {
        "exactFiveUassetsNoDiskExtras": set(tracked_files) == expected_uassets
        and len(tracked_files) == 5,
        "allHashesNonEmpty": all(
            item["bytes"] > 0 and len(item["sha256"]) == 64
            for item in tracked_files.values()
        ),
        "canonicalHeightNotImported": all(
            "Height" not in name for name in tracked_files
        ),
    }
    report["trackedUnrealAssets"] = {
        "root": str(destination_disk_root.relative_to(repository)),
        "receipts": tracked_files,
        "checks": tracked_checks,
        "passed": all(tracked_checks.values()),
    }
    report["embeddedMetadataPrivacy"] = embedded_metadata_privacy_status(
        destination_disk_root, repository
    )
    report["passed"] = (
        report["passed"]
        and report["trackedUnrealAssets"]["passed"]
        and report["embeddedMetadataPrivacy"]["passed"]
    )

    baseline_disk_saved = relative_uasset_receipts(
        project_dir / "Content" / "SHI" / "Art" / "Characters" / "DazeCouncilFacial"
    )
    skeleton_saved = file_receipt(skeleton_file, repository)
    saved_preservation = (
        baseline_disk_saved == baseline_disk_before
        and skeleton_saved == skeleton_before
    )
    report["acceptedFacialPreservation"]["checks"][
        "acceptedHashesUnchangedAfterDestinationSave"
    ] = saved_preservation
    report["acceptedFacialPreservation"]["passed"] = (
        report["acceptedFacialPreservation"]["passed"] and saved_preservation
    )
    report["passed"] = report["passed"] and saved_preservation

    current_run_passed = report["passed"]
    if not replace:
        if previous_import_report is None or immutable_import_root_sha256 is None:
            raise RuntimeError(
                "Inspect-only lost its validated immutable import receipt"
            )
        previous_receipts = previous_import_report.get("trackedUnrealAssets", {}).get(
            "receipts", {}
        )
        hashes_unchanged = previous_receipts == tracked_files
        inspection_overall_passed = report["passed"] and hashes_unchanged
        read_only_inspection = {
            "mode": "inspect-only",
            "mutationAuthorized": False,
            "exitCode": 0 if inspection_overall_passed else 1,
            "sourceContractPassed": source_contract["passed"],
            "allThreeTexturesPassed": all(
                item["passed"] for item in texture_status.values()
            ),
            "subsurfaceProfilePassed": profile_status["passed"],
            "materialGraphAndCompilePassed": material_status[
                "coreMaterialChecksPassed"
            ],
            "materialAdmissionPassed": material_status["passed"],
            "usedTextureInspectionStrictPassed": material_status[
                "usedTextureInspection"
            ]["strictObservationPassed"],
            "usedTextureInspection": material_status["usedTextureInspection"],
            "destinationInventoryPassed": inventory["passed"],
            "canonicalHeightRemainedSourceOnly": report["canonicalHeightSource"][
                "passed"
            ],
            "acceptedFacialHashesUnchanged": report["acceptedFacialPreservation"][
                "passed"
            ],
            "trackedUassetHashesUnchanged": hashes_unchanged,
            "embeddedMetadataPrivacyPassed": report["embeddedMetadataPrivacy"][
                "passed"
            ],
            "overallPassed": inspection_overall_passed,
            "passed": inspection_overall_passed,
        }
        previous_import_report["readOnlyInspection"] = read_only_inspection
        preserved_import_root_sha256 = import_receipt_root_sha256(
            previous_import_report
        )
        import_root_preserved = (
            preserved_import_root_sha256 == immutable_import_root_sha256
        )
        read_only_inspection["immutableImportReceiptRootSha256"] = (
            immutable_import_root_sha256
        )
        read_only_inspection["canonicalImportReceiptRootPreserved"] = (
            import_root_preserved
        )
        read_only_inspection["overallPassed"] = (
            inspection_overall_passed and import_root_preserved
        )
        read_only_inspection["passed"] = read_only_inspection["overallPassed"]
        read_only_inspection["exitCode"] = (
            0 if read_only_inspection["overallPassed"] else 1
        )
        current_run_passed = read_only_inspection["overallPassed"]
        report = previous_import_report

    report_path = write_report(repository, report)
    unreal.log(
        f"SHI_DAZE_COUNCIL_SKIN_LOOKDEV_REPORT {json.dumps(report, sort_keys=True)}"
    )
    unreal.log(f"SHI_DAZE_COUNCIL_SKIN_LOOKDEV_EVIDENCE {report_path}")
    if not current_run_passed:
        raise RuntimeError(
            f"Daze council skin lookdev Unreal admission failed: {report}"
        )


main()
