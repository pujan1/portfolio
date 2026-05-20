"""
Scatter a dense grass field across the landscape reference.

The script creates/refreshes a child collection named "Auto_Grass_Field" under
"Vegetation", then scatters Grass_Clump_A/B/C as three merged mesh objects.
This keeps the web scene much lighter than exporting tens of thousands of
separate grass objects. It uses raycasts to seat each clump on the generated
terrain and roughly avoids the road, river, bridge, and steep/high mountain
edges.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \\
      demo/drone/blender/vegetation_workspace.blend \\
      --python demo/drone/blender/scatter_grass_field.py
"""

import math
import random

import bpy
from mathutils import Vector

LANDSCAPE_COLLECTION = "Landscape_Reference"
VEGETATION_COLLECTION = "Vegetation"
AUTO_COLLECTION = "Auto_Grass_Field"
PROTOTYPES = ("Grass_Clump_A", "Grass_Clump_B", "Grass_Clump_C")

SEED = 20260520
TARGET_CLUMPS = 50000
MAX_ATTEMPTS = TARGET_CLUMPS * 8
SURFACE_OFFSET = 0.035
RAY_START_Z = 500.0
RAY_LENGTH = 1000.0

# Keep this focused around the central authored flight area. The far edges are
# mountain bowl walls and look better with sparse/manual vegetation.
SCATTER_X = (-48.0, 48.0)
SCATTER_Y = (18.0, 118.0)  # Blender Y is roughly -three.js Z in this workspace.
MAX_TERRAIN_Z = 3.2

ROAD_POINTS = [
    (0, -18), (0, -10), (-1, 0),
    (-8, 14), (6, 28), (-7, 42),
    (-2, 52),
    (9, 56), (-3, 70), (4, 82),
    (6, 92), (6, 100),
]

RIVER_POINTS = [
    (-28, 118), (-31, 112), (-25, 106), (-28, 100),
    (-22, 91), (-18, 82), (-12, 73), (-10, 64),
    (-3, 55), (-2, 52), (5, 47), (8, 42),
    (15, 39), (21, 34), (31, 31), (40, 27), (50, 24),
]


random.seed(SEED)


def ensure_collection(name, parent=None):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if parent and collection.name not in parent.children:
        if not any(child.name == collection.name for child in parent.children):
            parent.children.link(collection)
    elif parent is None and not any(child.name == collection.name for child in bpy.context.scene.collection.children):
        bpy.context.scene.collection.children.link(collection)
    return collection


def clear_collection(collection):
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(collection.children):
        clear_collection(child)
        bpy.data.collections.remove(child)


def find_terrain_mesh():
    collection = bpy.data.collections.get(LANDSCAPE_COLLECTION)
    if collection is None:
        raise RuntimeError(f'Missing collection "{LANDSCAPE_COLLECTION}"')

    meshes = [obj for obj in collection.all_objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f'No mesh objects in "{LANDSCAPE_COLLECTION}"')
    return max(meshes, key=lambda obj: len(obj.data.vertices))


def terrain_hit_at(terrain_eval, terrain_inv, terrain_normal_matrix, x, y):
    ray_origin_world = Vector((x, y, RAY_START_Z))
    ray_direction_world = Vector((0.0, 0.0, -1.0))

    ray_origin_local = terrain_inv @ ray_origin_world
    ray_direction_local = terrain_inv.to_3x3() @ ray_direction_world
    ray_direction_local.normalize()

    hit, loc, normal, _face_index = terrain_eval.ray_cast(
        ray_origin_local,
        ray_direction_local,
        distance=RAY_LENGTH,
    )
    if not hit:
        return None, None

    normal_world = terrain_normal_matrix @ normal
    normal_world.normalize()
    return terrain_eval.matrix_world @ loc, normal_world


def polyline_dist(x, y, points):
    best = 1e9
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        dx, dy = x2 - x1, y2 - y1
        seg_len_sq = dx * dx + dy * dy
        if seg_len_sq < 1e-9:
            best = min(best, math.hypot(x - x1, y - y1))
            continue
        t = ((x - x1) * dx + (y - y1) * dy) / seg_len_sq
        t = max(0.0, min(1.0, t))
        px, py = x1 + t * dx, y1 + t * dy
        best = min(best, math.hypot(x - px, y - py))
    return best


def should_skip(x, y, hit, normal):
    if hit.z > MAX_TERRAIN_Z:
        return True
    if normal and normal.z < 0.82:
        return True
    if polyline_dist(x, y, ROAD_POINTS) < 3.8:
        return True
    if polyline_dist(x, y, RIVER_POINTS) < 4.7:
        return True
    # Keep the bridge crossing readable.
    if math.hypot(x + 2.0, y - 52.0) < 7.0:
        return True
    return False


terrain = find_terrain_mesh()
depsgraph = bpy.context.evaluated_depsgraph_get()
terrain_eval = terrain.evaluated_get(depsgraph)
terrain_inv = terrain_eval.matrix_world.inverted()
terrain_normal_matrix = terrain_eval.matrix_world.to_3x3()
vegetation = ensure_collection(VEGETATION_COLLECTION)
auto_collection = ensure_collection(AUTO_COLLECTION, vegetation)
clear_collection(auto_collection)

prototype_objects = [bpy.data.objects.get(name) for name in PROTOTYPES]
prototype_objects = [obj for obj in prototype_objects if obj is not None]
if len(prototype_objects) != len(PROTOTYPES):
    missing = [name for name in PROTOTYPES if bpy.data.objects.get(name) is None]
    raise RuntimeError(f"Missing grass prototypes: {', '.join(missing)}")

def append_proto_instance(buffers, proto, proto_bounds, loc, yaw, scale):
    verts, faces, vertex_uvs = buffers[proto.name]
    start = len(verts)
    cos_y = math.cos(yaw)
    sin_y = math.sin(yaw)
    sx, sy, sz = scale
    zmin, zheight = proto_bounds[proto.name]
    phase = random.random()

    for vertex in proto.data.vertices:
        co = vertex.co
        x = co.x * sx
        y = co.y * sy
        z = co.z * sz
        rx = x * cos_y - y * sin_y
        ry = x * sin_y + y * cos_y
        verts.append((loc.x + rx, loc.y + ry, loc.z + z))
        wind_weight = max(0.0, min(1.0, (co.z - zmin) / max(0.001, zheight)))
        vertex_uvs.append((wind_weight, phase))

    for poly in proto.data.polygons:
        faces.append(tuple(start + index for index in poly.vertices))


def create_merged_proto_object(proto, verts, faces, collection):
    if not verts:
        return None
    mesh = bpy.data.meshes.new(f"{proto.name}_Auto_Field_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="WindUV")
    vertex_uvs = buffers[proto.name][2]
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            uv_layer.data[loop_index].uv = vertex_uvs[vertex_index]

    obj = bpy.data.objects.new(f"{proto.name}_Auto_Field", mesh)
    if proto.data.materials:
        obj.data.materials.append(proto.data.materials[0])
    for poly in obj.data.polygons:
        poly.use_smooth = False
    collection.objects.link(obj)
    return obj


buffers = {proto.name: ([], [], []) for proto in prototype_objects}
counts = {proto.name: 0 for proto in prototype_objects}
proto_bounds = {}
for proto in prototype_objects:
    zs = [vertex.co.z for vertex in proto.data.vertices]
    proto_bounds[proto.name] = (min(zs), max(zs) - min(zs))

created = 0
attempts = 0
while created < TARGET_CLUMPS and attempts < MAX_ATTEMPTS:
    attempts += 1
    x = random.uniform(*SCATTER_X)
    y = random.uniform(*SCATTER_Y)

    hit, normal = terrain_hit_at(terrain_eval, terrain_inv, terrain_normal_matrix, x, y)
    if hit is None or should_skip(x, y, hit, normal):
        continue

    proto = random.choices(prototype_objects, weights=(0.34, 0.42, 0.24), k=1)[0]
    s = random.uniform(0.72, 1.35)
    append_proto_instance(
        buffers,
        proto,
        proto_bounds,
        Vector((x, y, hit.z + SURFACE_OFFSET)),
        random.uniform(0.0, math.tau),
        (
            s * random.uniform(0.88, 1.12),
            s * random.uniform(0.88, 1.12),
            s * random.uniform(0.85, 1.22),
        ),
    )
    counts[proto.name] += 1
    created += 1

merged = []
for proto in prototype_objects:
    verts, faces, _vertex_uvs = buffers[proto.name]
    obj = create_merged_proto_object(proto, verts, faces, auto_collection)
    if obj:
        merged.append(obj.name)

print(f"Scattered {created} merged grass clumps after {attempts} attempts into {AUTO_COLLECTION}.")
print("Counts:", ", ".join(f"{name}={count}" for name, count in counts.items()))
print("Merged objects:", ", ".join(merged))

if bpy.data.filepath:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
