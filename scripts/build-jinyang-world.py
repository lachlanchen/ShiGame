"""Editable Jinyang exploration environment. Original scenery, not an excavation model.

Blender metres -> Unreal centimetres. Gameplay route footprints stay unchanged.
Exports four bounded scenery layers and two clothing parts; the importer configures collision.
"""
import bpy
import json
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/3d/jinyang-world"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0
rng = random.Random(20261003)
groups = {k: [] for k in ['Ground', 'Architecture', 'Details', 'Horizon', 'Tunic', 'Robe']}
palette = {
    'Earth': (.20, .135, .075), 'Stone': (.28, .25, .19),
    'Plaster': (.46, .35, .20), 'Timber': (.075, .038, .018),
    'Roof': (.10, .13, .13), 'Thatch': (.31, .23, .095),
    'Grass': (.14, .19, .075), 'Leaf': (.20, .27, .12),
    'Reed': (.30, .30, .13), 'Bronze': (.28, .23, .10),
    'Cloth': (.52, .40, .24), 'Charcoal': (.025, .031, .029),
    'Mountain': (.105, .16, .18), 'Ember': (.85, .32, .06),
}
mats = {}
for key, rgb in palette.items():
    m = bpy.data.materials.new('M_Jinyang_' + key)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = .86
    mats[key] = m

def finish(o, name, mat, group):
    o.name = name
    o.data.materials.append(mats[mat])
    groups[group].append(o)
    return o

def box(name, p, size, mat='Timber', group='Architecture', bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=tuple(v/100 for v in p))
    o = bpy.context.object
    o.dimensions = tuple(v/100 for v in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Worn edges', 'BEVEL'); mod.width=bevel/100; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
        if hasattr(o.data, 'use_auto_smooth'): o.data.use_auto_smooth = True
        o.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return finish(o,name,mat,group)

def rod(name, a, b, radius, mat='Timber', group='Details', sides=8):
    a, b = Vector(a)/100, Vector(b)/100
    d = b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides, radius=radius/100, depth=d.length, location=(a+b)/2)
    o=bpy.context.object; o.rotation_mode='QUATERNION'; o.rotation_quaternion=d.to_track_quat('Z','Y')
    return finish(o,name,mat,group)

def mesh(name, vertices, faces, mat, group='Architecture'):
    data=bpy.data.meshes.new(name)
    data.from_pydata([tuple(v/100 for v in p) for p in vertices],[],faces); data.update()
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o)
    return finish(o,name,mat,group)

def bank(name, rect, z=0):
    x0,y0,x1,y1=rect
    inset=45
    return mesh(name,[(x0,y0,z),(x1,y0,z),(x1,y1,z),(x0,y1,z),
        (x0-inset,y0-inset,-85),(x1+inset,y0-inset,-85),(x1+inset,y1+inset,-85),(x0-inset,y1+inset,-85)],
        [(0,1,2,3),(4,5,1,0),(5,6,2,1),(6,7,3,2),(7,4,0,3),(7,6,5,4)],'Earth','Ground')

walk_rects=[[-2500,-1450,-200,180],[-600,-100,-400,1380],[-650,800,1640,1000],
    [600,-700,800,980],[-650,-700,1630,-470],[970,-700,1230,980],[970,180,2300,710],
    [460,700,880,1210],[770,-810,1330,-400],[700,60,1100,215]]
for i,rect in enumerate(walk_rects): bank('Raised earth '+str(i),rect)
# A city promenade connected to the existing command courtyard; the flood is below the walking surface.
for x in range(-2320,-960,115):
    for y in range(-780,-320,112):
        box('Courtyard paving', (x+rng.uniform(-5,5),y+rng.uniform(-5,5),.7),
            (rng.uniform(92,103),rng.uniform(92,103),3),'Stone','Details',2)

def roof(name,x,y,w,d,h,z,mat='Roof'):
    # Restrained gabled roof; no later imperial ornament or fantasy skyline.
    mesh(name,[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z),
        (x-w*.38,y,z+h),(x+w*.38,y,z+h)],
        [(0,1,5,4),(3,4,5,2),(0,4,3),(1,2,5),(3,2,1,0)],mat)
    rod(name+' ridge',(x-w*.38,y,z+h+4),(x+w*.38,y,z+h+4),8,mat,'Architecture')
    for side in [-1,1]:
        rod(name+' eave',(x-w/2,y+side*d/2,z),(x+w/2,y+side*d/2,z),7,'Timber','Architecture')
    for i in range(1,14):
        xx=x-w/2+i*w/14
        for side in [-1,1]:
            rod(name+' tile seam',(xx,y+side*d*.49,z+2),(x+(xx-x)*.76,y,z+h+2),2.5,mat)

def house(name,x,y,w=420,d=320,mat='Roof'):
    box(name+' foundation',(x,y,12),(w+36,d+36,24),'Stone',bevel=5)
    # South-facing doorway is a real opening, not a painted rectangle.
    box(name+' back',(x,y+d/2-12,128),(w,24,232),'Plaster',bevel=5)
    for s in [-1,1]:
        box(name+' side',(x+s*(w/2-12),y,128),(24,d,232),'Plaster',bevel=5)
        box(name+' front',(x+s*(w/4+25),y-d/2+12,128),(w/2-65,24,232),'Plaster',bevel=4)
        for t in [-1,1]:
            rod(name+' post',(x+s*(w/2-20),y+t*(d/2-18),22),(x+s*(w/2-20),y+t*(d/2-18),258),9,'Timber','Architecture')
    box(name+' door lintel',(x,y-d/2,222),(116,32,45),'Timber',bevel=3)
    for zz in [65,183,245]:
        box(name+' front beam',(x,y-d/2-2,zz),(w+12,12,13),'Timber','Details',2)
    roof(name+' roof',x,y,w+80,d+80,105,255,mat)
    box(name+' mat',(x,y-d/2+70,26),(105,100,3),'Thatch','Details')

for i,(x,y,w,d) in enumerate([(-2120,-1080,450,370),(-1500,-1080,420,370),(-2180,-100,410,330),(-1570,-100,400,330)]):
    house('Gate quarter '+str(i),x,y,w,d,'Roof' if i%2 else 'Thatch')
# Flooded homes are scenery beyond the safe gate quarter; the water masks their lower walls.
for i,x in enumerate([-1820,-1230]):
    before={o.name for o in bpy.context.scene.objects}
    house('Flooded lower quarter '+str(i),x,640,370,270,'Thatch')
    for o in bpy.context.scene.objects:
        if o.name not in before:o.location.z-=2.0
# A storehouse shelters visible bundles, not an inaccessible decorative facade.
house('Storehouse',-1100,-1140,380,290)
for i in range(5):
    box('Store bundle',(-1200+i*43,-1170,65),(37,52,76),'Thatch','Details',8)

# Rammed-earth defensive wall with a walkable stair and timber observation platform.
for x,y,w,d in [(-240,-140,62,620),(-240,-750,62,140),(-850,160,470,62),(-320,160,170,62),(-1700,160,900,65)]:
    box('Earth defense',(x,y,95),(w,d,190),'Earth',bevel=8)
    if w>d:
        for xx in range(int(x-w/2+30),int(x+w/2),85): box('Crenel',(xx,y,214),(44,64,48),'Plaster',bevel=3)
    else:
        for yy in range(int(y-d/2+30),int(y+d/2),85): box('Crenel',(x,yy,214),(64,44,48),'Plaster',bevel=3)
for i in range(10): box('Watch stair',(-850,-80+i*20,9.5*(i+1)),(100,24,19*(i+1)),'Timber',bevel=1)
box('Watch platform',(-900,95,193),(240,140,16),'Timber',bevel=3)
for xx in [-1010,-790]:
    for yy in [40,150]: rod('Watch post',(xx,yy,0),(xx,yy,405),10,'Timber','Architecture')
roof('Watch roof',-900,95,290,200,75,410)

# Dry levees are supported, with stone edging and low rope handrails at exposed crossings.
for x0,y0,x1,y1 in walk_rects[1:]:
    along_x=x1-x0>y1-y0
    length=(x1-x0) if along_x else (y1-y0)
    for n in range(int(length/145)+1):
        t=min(n*145,length)
        if along_x: x,y=x0+t,y0+8
        else: x,y=x0+8,y0+t
        box('Levee stone',(x,y,4),(44,27,16),'Stone','Details',4)
for y in range(260,801,120):
    for x in [-590,-410]: rod('Exit railing',(x,y,0),(x,y,80),5)
for x in [-590,-410]: rod('Exit handrope',(x,260,66),(x,740,66),2,'Cloth')
# Visible sluice work without obstructing the worker's canonical position.
box('Dam lip',(720,270,29),(440,60,58),'Earth',bevel=5)
for x in [505,565,865,925]: rod('Sluice pile',(x,290,-30),(x,290,130),9,'Timber','Architecture')
for i in range(5): box('Spare beam',(555+i*24,360,18),(18,150,24),'Timber','Details',2)

def tent(name,x,y,color='Cloth'):
    w,d=190,170
    mesh(name,[(x-w/2,y-d/2,3),(x+w/2,y-d/2,3),(x+w/2,y+d/2,3),(x-w/2,y+d/2,3),
        (x,y-d/2,166),(x,y+d/2,166)],[(0,4,5,3),(1,2,5,4),(3,5,2)],color)
    rod(name+' pole',(x,y+d/2,0),(x,y+d/2,175),5,'Timber','Architecture')
    for s in [-1,1]: rod(name+' rope',(x,y+d/2,160),(x+s*130,y+d/2+35,2),1.3,'Cloth')
for name,x,y in [('Han',650,1110),('Wei',1120,-850),('Zhi',1870,540)]:
    tent(name+' shelter',x,y)
    for i in range(3):
        rod('Spear shaft',(x+150+i*17,y-35,0),(x+165+i*17,y-35,184),2)
        box('Spear point',(x+165+i*17,y-35,192),(3,5,18),'Bronze','Details')
    for i in range(3): box('Camp crate',(x-145,y+i*38,23),(40,32,45),'Timber','Details',3)

# Original trees, reeds and rocks built from reusable editable primitives.
def tree(x,y,h):
    rod('Willow trunk',(x,y,0),(x+12,y, h*.78),h*.035,'Timber','Details',9)
    for i in range(5):
        a=i*math.tau/5; end=(x+math.cos(a)*h*.3,y+math.sin(a)*h*.3,h*.86)
        rod('Willow branch',(x,y,h*.55),end,h*.018)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=tuple(v/100 for v in end))
        o=bpy.context.object;o.scale=(h*.21/100,h*.21/100,h*.30/100)
        finish(o,'Willow canopy','Leaf','Details')
for x,y,h in [(-2400,-560,410),(-1850,30,390),(-1300,-1400,340),(-2250,-1410,420),(-650,1280,320),(1390,890,350),(2230,680,440)]: tree(x,y,h)
for i in range(100):
    x,y=rng.choice([(-700,rng.uniform(300,1300)),(rng.uniform(50,550),470),(rng.uniform(-1800,-300),240),(1350,rng.uniform(-380,100))])
    for j in range(3):
        h=rng.uniform(35,95); xx=x+rng.uniform(-20,20); yy=y+rng.uniform(-20,20)
        rod('Reed',(xx,yy,-35),(xx+rng.uniform(-14,14),yy,h-35),1.3,'Reed',sides=4)
for i in range(95):
    x,y=rng.uniform(-2450,-980),rng.choice([rng.uniform(-1430,-1330),rng.uniform(40,160)])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x/100,y/100,.05))
    o=bpy.context.object;o.scale=(rng.uniform(.12,.35),rng.uniform(.12,.28),rng.uniform(.08,.25))
    finish(o,'River stone','Stone','Details')
# Continuous smooth ridge field, outside traversable bounds. No giant faceted spheres.
verts=[];faces=[];n=81
for j in range(n):
    for i in range(n):
        x=(i-40)*700;y=(j-40)*700;r=math.hypot(x,y)
        envelope=max(0,min(1,(r-9000)/8000))
        ridge=1150+550*math.sin(x*.00024)+420*math.sin(y*.00032)+280*math.cos((x+y)*.00042)
        verts.append((x,y,-140+envelope*max(150,ridge)))
for j in range(n-1):
    for i in range(n-1):
        a=j*n+i;faces.append((a,a+1,a+1+n,a+n))
ridge=mesh('Valley ridges',verts,faces,'Mountain','Horizon')
for p in ridge.data.polygons:p.use_smooth=True

# Reusable fitted garments for the existing articulated motion rig. Normalized centimetre bounds.
for name,rings in [('Tunic',[(-50,44,47),(-28,48,49),(20,50,50),(34,44,43),(50,19,20)]),
                   ('Robe',[(-50,59,58),(-36,57,57),(0,48,48),(50,40,42)])]:
    vs=[];fs=[];segments=24
    for z,rx,ry in rings:
        for i in range(segments):
            a=i*math.tau/segments;fold=1+.022*math.cos(a*8)
            vs.append((rx*math.cos(a)*fold,ry*math.sin(a)*fold,z))
    for k in range(len(rings)-1):
        for i in range(segments):
            a=k*segments+i;b=k*segments+(i+1)%segments
            fs.append((a,b,b+segments,a+segments))
    fs += [tuple(reversed(range(segments))),tuple(range((len(rings)-1)*segments,len(rings)*segments))]
    o=mesh('Fitted '+name,vs,fs,'Cloth',name)
    for p in o.data.polygons:p.use_smooth=True

# Save a genuinely editable source before joining the export layers.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'shi-jinyang-world-v1.blend'))
report={'id':'shi-jinyang-world-v1','classification':'original-gameplay-reconstruction',
    'seed':20261003,'units':'metres, exported to centimetres','walkRectsCentimetres':walk_rects,
    'palette':palette,'layers':{},'historicalScope':'Flood siege context from Tongjian I; buildings, routes, flora and dimensions are scenery reconstruction.'}
for group,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
    o=bpy.context.object;o.name='SM_Jinyang_'+group
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.export_scene.fbx(filepath=str(OUT/(o.name+'.fbx')),use_selection=True,apply_unit_scale=True,
        axis_forward='-Z',axis_up='Y',object_types={'MESH'},use_mesh_modifiers=True,bake_anim=False)
    report['layers'][group]={'objects':len(objects),'vertices':len(o.data.vertices),'faces':len(o.data.polygons)}
(OUT/'world-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('SHI_JINYANG_WORLD',json.dumps(report))
