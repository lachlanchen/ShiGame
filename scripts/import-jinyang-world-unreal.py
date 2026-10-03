"""Import the original editable Jinyang scenery into its isolated asset namespace."""
import json
from pathlib import Path
import unreal

root=Path(unreal.Paths.project_dir()).resolve().parents[1]
source=root/'assets/3d/jinyang-world'
manifest=json.loads((source/'world-manifest.json').read_text())
dest='/Game/SHI/Art/JinyangWorld'
lib=unreal.MaterialEditingLibrary
assets=unreal.EditorAssetLibrary
tools=unreal.AssetToolsHelpers.get_asset_tools()

def node(mat,cls): return lib.create_material_expression(mat,cls)
def link(a,out,b,inp):
    if not lib.connect_material_expressions(a,out,b,inp): raise RuntimeError(inp)
def output(n,p,out=''):
    if not lib.connect_material_property(n,out,p): raise RuntimeError(str(p))

materials={}
for name,color in {**manifest['palette'],'Water':(.022,.095,.11)}.items():
    full='M_Jinyang_'+name
    mat=assets.load_asset(dest+'/'+full) if assets.does_asset_exist(dest+'/'+full) else tools.create_asset(full,dest,unreal.Material,unreal.MaterialFactoryNew())
    lib.delete_all_material_expressions(mat)
    a=node(mat,unreal.MaterialExpressionConstant3Vector);a.constant=unreal.LinearColor(*[c*.62 for c in color],1)
    b=node(mat,unreal.MaterialExpressionConstant3Vector);b.constant=unreal.LinearColor(*color,1)
    noise=node(mat,unreal.MaterialExpressionNoise)
    noise.set_editor_property('noise_function',unreal.NoiseFunction.NOISEFUNCTION_GRADIENT_TEX3D)
    noise.set_editor_property('scale',.025 if name!='Mountain' else .001)
    noise.set_editor_property('quality',1);noise.set_editor_property('levels',2)
    noise.set_editor_property('output_min',0);noise.set_editor_property('output_max',1)
    lerp=node(mat,unreal.MaterialExpressionLinearInterpolate)
    link(a,'',lerp,'A');link(b,'',lerp,'B');link(noise,'',lerp,'Alpha')
    output(lerp,unreal.MaterialProperty.MP_BASE_COLOR)
    rough=node(mat,unreal.MaterialExpressionConstant);rough.r=.19 if name=='Water' else .83
    output(rough,unreal.MaterialProperty.MP_ROUGHNESS)
    if name=='Water':
        # Spatially continuous animated normals: movement never changes the simulation or collision.
        pos=node(mat,unreal.MaterialExpressionWorldPosition)
        time=node(mat,unreal.MaterialExpressionTime)
        wave=node(mat,unreal.MaterialExpressionCustom)
        wave.set_editor_property('code','return normalize(float3(sin(P.x*0.027+T*1.2)*0.10,cos(P.y*0.019+T*0.8)*0.07,1));')
        wave.set_editor_property('output_type',unreal.CustomMaterialOutputType.CMOT_FLOAT3)
        ip=unreal.CustomInput();ip.set_editor_property('input_name','P')
        it=unreal.CustomInput();it.set_editor_property('input_name','T')
        wave.set_editor_property('inputs',[ip,it]);link(pos,'',wave,'P');link(time,'',wave,'T')
        mat.set_editor_property('tangent_space_normal',False)
        output(wave,unreal.MaterialProperty.MP_NORMAL)
    lib.recompile_material(mat);assets.save_loaded_asset(mat)
    materials[full]=mat

report={}
for layer in manifest['layers']:
    name='SM_Jinyang_'+layer
    opts=unreal.FbxImportUI();opts.automated_import_should_detect_type=False
    opts.import_mesh=True;opts.import_as_skeletal=False
    opts.mesh_type_to_import=unreal.FBXImportType.FBXIT_STATIC_MESH
    opts.import_materials=False;opts.import_textures=False;opts.import_animations=False
    d=opts.static_mesh_import_data
    d.combine_meshes=True;d.auto_generate_collision=False;d.convert_scene=True;d.convert_scene_unit=True
    d.generate_lightmap_u_vs=False
    task=unreal.AssetImportTask();task.filename=str(source/(name+'.fbx'))
    task.destination_path=dest;task.destination_name=name
    task.automated=True;task.save=False;task.replace_existing=True
    task.factory=unreal.FbxFactory();task.options=opts
    tools.import_asset_tasks([task])
    mesh=assets.load_asset(dest+'/'+name)
    if not isinstance(mesh,unreal.StaticMesh):raise RuntimeError(name)
    for i,slot in enumerate(mesh.static_materials):
        key=str(slot.material_slot_name).split('.')[0]
        if key not in materials:raise RuntimeError('Unresolved material '+key)
        mesh.set_material(i,materials[key])
    body=mesh.get_editor_property('body_setup')
    if body:body.set_editor_property('collision_trace_flag',unreal.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE)
    assets.save_loaded_asset(mesh,only_if_is_dirty=False)
    bounds=mesh.get_bounding_box()
    report[layer]={'triangles':mesh.get_num_triangles(0),'min':[bounds.min.x,bounds.min.y,bounds.min.z],
                   'max':[bounds.max.x,bounds.max.y,bounds.max.z]}
assets.save_directory(dest,only_if_is_dirty=False,recursive=True)
path=root/'.runtime/jinyang-world-20261003/import.json';path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(report,indent=2)+'\n')
unreal.log('SHI_WORLD_IMPORTED '+json.dumps(report))
