import argparse
from pathlib import Path
import bpy


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--glb", required=True)
    parser.add_argument("--fbx", required=True)
    args = parser.parse_args(_script_args())

    source = Path(args.source).resolve()
    glb = Path(args.glb).resolve()
    fbx = Path(args.fbx).resolve()
    glb.parent.mkdir(parents=True, exist_ok=True)
    fbx.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.open_mainfile(filepath=str(source))
    for obj in tuple(bpy.data.objects):
        if obj.type in {"CAMERA", "LIGHT"} or obj.name == "studio_floor":
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_apply=True, export_yup=True)
    bpy.ops.export_scene.fbx(filepath=str(fbx), use_selection=False, apply_unit_scale=True, axis_forward="-Z", axis_up="Y")
    print(f"Exported {glb} and {fbx}")


def _script_args() -> list[str]:
    import sys
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


if __name__ == "__main__":
    main()
