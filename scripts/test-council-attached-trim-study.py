"""Reopen and independently check torso-owned trim throughout the cached gesture.

No generator import, resimulation, asset admission, or exact collision claim.
Run Blender with --python-exit-code 1 so a rejected report fails the command.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bpy


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def evaluated(name):
    obj = bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = obj.to_mesh()
    mesh.calc_loop_triangles()
    points = [obj.matrix_world @ v.co for v in mesh.vertices]
    triangles = [tuple(t.vertices) for t in mesh.loop_triangles]
    edges = [tuple(e.vertices) for e in mesh.edges]
    obj.to_mesh_clear()
    return points, triangles, edges


def digest(rows):
    result = hashlib.sha256()
    for row in rows:
        result.update(struct.pack('<' + 'f' * len(row), *row))
    return result.hexdigest()


def carrier():
    cloth = evaluated('SKM_SHI_keeper_ConnectedGarmentStudy')[0]
    body = evaluated('SKM_SHI_keeper_Body')[0]
    rig = bpy.data.objects['SK_SHI_keeper_Rig']
    assert len(rig.pose.bones) == 53
    return {'cloth': digest(cloth), 'body': digest(body),
            'pose': digest([tuple(x for row in bone.matrix for x in row)
                            for bone in rig.pose.bones])}


def check(study):
    receipt = json.loads((study / 'receipt.json').read_text())
    source = Path(receipt['sourceStudy']).resolve()
    original = json.loads((source / 'receipt.json').read_text())
    verified = json.loads((source / 'verification.json').read_text())
    assert sha(study / 'garment-study.blend') == receipt['blendSHA256']
    assert sha(source / 'garment-study.blend') == receipt['sourceBlendSHA256'] == original['blendSHA256'] == verified['blendSHA256']
    assert sha(source / 'verification.json') == receipt['sourceVerificationSHA256']
    assert verified['status'] == 'sampled-connected-garment-checks-passed'
    assert sha(Path(__file__).with_name('test-council-connected-garment.py')) == verified['checkerSHA256']
    for recipe, key in [('build-council-pattern-garment-study.py', 'independentPattern'),
                        ('build-council-gusset-garment-study.py', 'gussetTransition')]:
        assert sha(Path(__file__).with_name(recipe)) == original[key]['authorSHA256']
    torso_count = original['vertices'] - original['independentPattern']['retainedDistalSleeveVertices'] - 2 * original['gussetTransition']['ringsPerArm'] * 24
    assert torso_count == 244
    # Check actual anchors before metadata: this rejects the former sleeve hit.
    trims = receipt['trims']
    expected = {'CrossBinding_L': (50, 24, .003), 'CrossBinding_R': (50, 24, .005), 'WaistBinding': (128, 64, .004)}
    assert len(trims) == 3
    assert {t['object'] for t in trims} == {'SKM_SHI_keeper_Attached_' + name for name in expected}
    for trim in trims:
        count, _, offset = expected[trim['object'].removeprefix('SKM_SHI_keeper_Attached_')]
        assert len(trim['anchors']) == count
        for anchor in trim['anchors']:
            assert len(anchor['triangle']) == 3 and all(type(i) is int and 0 <= i < torso_count for i in anchor['triangle']), 'Anchor targets sleeve/gusset instead of authored torso'
            assert len(anchor['weights']) == 3 and all(math.isfinite(w) and 0 <= w <= 1 for w in anchor['weights'])
            assert abs(sum(anchor['weights']) - 1) < 1e-10
            assert anchor['offset'] == offset
    assert receipt['attachmentRegion'] == {'name': 'authored-torso-only', 'vertices': 244, 'triangles': 400}
    assert sha(Path(__file__).with_name('build-council-attached-trim-study.py')) == receipt['authorSHA256']
    assert receipt['sharedCache'] == original['clothSimulation']['cache']
    assert len(receipt['sharedCache']) == 151
    for cache in receipt['sharedCache']:
        target = (study / cache['file']).resolve()
        assert target == (source / cache['file']).resolve() and target.is_relative_to(source)
        assert sha(target) == cache['sha256']
    offset = receipt['visibleFrameOffset']
    assert offset == original['clothSimulation']['visibleFrameOffset'] == 30
    bpy.ops.wm.open_mainfile(filepath=str(source / 'garment-study.blend'))
    reference = []
    for frame in range(31, 152):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        reference.append(carrier())
    bpy.ops.wm.open_mainfile(filepath=str(study / 'garment-study.blend'))
    cloth = bpy.data.objects['SKM_SHI_keeper_ConnectedGarmentStudy']
    assert cloth.modifiers['SHI_GarmentCloth'].point_cache.is_baked
    assert not cloth.hide_render and not bpy.data.objects['SKM_SHI_keeper_Body'].hide_render
    max_error, max_edge_factor, minimum_area = 0., 1., float('inf')
    rest_edges = {}
    for trim in trims:
        obj = bpy.data.objects[trim['object']]
        count, faces, _ = expected[trim['object'].removeprefix('SKM_SHI_keeper_Attached_')]
        assert len(obj.data.vertices) == count and len(obj.data.polygons) == faces
        assert not obj.hide_render and not obj.modifiers
        assert bpy.data.objects[trim['replaces']].hide_render
    for index, frame in enumerate(range(31, 152)):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        assert carrier() == reference[index], f'Carrier changed at visible frame {index + 1}'
        points, triangles, _ = evaluated(cloth.name)
        torso = {t for t in triangles if max(t) < torso_count}
        assert len(torso) == 400
        for trim in trims:
            actual, faces, edges = evaluated(trim['object'])
            assert all(math.isfinite(x) for point in actual for x in point)
            for point, anchor in zip(actual, trim['anchors']):
                assert tuple(anchor['triangle']) in torso
                a, b, c = [points[i] for i in anchor['triangle']]
                normal = (b - a).cross(c - a)
                assert normal.length > 1e-10
                normal.normalize()
                u, v, w = anchor['weights']
                target = a * u + b * v + c * w + normal * anchor['offset']
                error = (point - target).length
                max_error = max(max_error, error)
                assert error < 1e-5, f'Trim detached at visible frame {index + 1}: {error}'
            lengths = [(actual[a] - actual[b]).length for a, b in edges]
            assert min(lengths) > 1e-7
            if index == 0:
                rest_edges[trim['object']] = lengths
            for current, rest in zip(lengths, rest_edges[trim['object']]):
                max_edge_factor = max(max_edge_factor, current / rest, rest / current)
            for a, b, c in faces:
                area = (actual[b] - actual[a]).cross(actual[c] - actual[a]).length / 2
                minimum_area = min(minimum_area, area)
                assert area > 1e-8, f'Trim face collapsed at visible frame {index + 1}'
    assert max_edge_factor < 3, f'Excessive trim strain: {max_edge_factor}'
    assert sha(study / 'garment-study.blend') == receipt['blendSHA256']
    return {'status': 'torso-trim-attachment-checks-passed', 'blendSHA256': receipt['blendSHA256'],
            'frames': 121, 'cacheFiles': 151, 'allAnchorsOwnedByTorso': True,
            'carrierClothBodyAnd53BonePosesExact': True, 'maximumAttachmentErrorMetres': max_error,
            'maximumEdgeLengthChangeFactor': max_edge_factor, 'minimumTriangleAreaSquareMetres': minimum_area,
            'boundary': 'Integer-frame surface attachment and carrier preservation only; not exact collision, final costume, continuous playback or human approval. No asset admission.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--study', type=Path, required=True)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    study = args.study.resolve()
    report = args.report.resolve() if args.report else study / 'verification.json'
    assert not report.exists(), 'Never overwrite earlier verification evidence'
    try:
        result = check(study)
    except Exception as error:
        report.write_text(json.dumps({'status': 'rejected', 'checkerSHA256': sha(Path(__file__)),
                                     'reason': str(error)}, indent=2) + '\n')
        raise
    result['checkerSHA256'] = sha(Path(__file__))
    report.write_text(json.dumps(result, indent=2) + '\n')
    print('SHI_TRIM_VERIFICATION', json.dumps(result))


if __name__ == '__main__':
    main()
