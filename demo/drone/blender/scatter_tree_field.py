"""
Scatter normal and snow-capped trees onto hills/mountains.

Uses tree meshes from:
  demo/drone/assets/trees/BlenderNatureAsset.blend
  demo/drone/assets/trees/*.fbx

Creates/refreshes "Auto_Tree_Field" under the "Vegetation" collection. The tree
objects are separate linked-mesh objects so they remain easy to delete or move
manually in Blender.
"""

import math
import os
import random

import bpy
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TREE_BLEND = os.path.join(SCRIPT_DIR, "..", "assets", "trees", "BlenderNatureAsset.blend")

LANDSCAPE_COLLECTION = "Landscape_Reference"
VEGETATION_COLLECTION = "Vegetation"
AUTO_COLLECTION = "Auto_Tree_Field"

NORMAL_PINE_SOURCE = "SapinHiver.015"
SNOW_PINE_SOURCE = "SapinHiver"
LOW_FBX = "Tree low.FBX"
ROUND_FBX = "tree.fbx"

SEED = 20260521
SURFACE_OFFSET = 0.02
RAY_START_Z = 500.0
RAY_LENGTH = 1000.0

NORMAL_PINE_COUNT = 2200
SNOW_PINE_COUNT = 800
LOW_TREE_COUNT = 900
ROUND_TREE_COUNT = 450

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
    if parent:
        if not any(child.name == collection.name for child in parent.children):
            parent.children.link(collection)
    elif not any(child.name == collection.name for child in bpy.context.scene.collection.children):
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


def blocked_by_paths(x, y):
    if polyline_dist(x, y, ROAD_POINTS) < 6.5:
        return True
    if polyline_dist(x, y, RIVER_POINTS) < 7.5:
        return True
    if math.hypot(x + 2.0, y - 52.0) < 10.0:
        return True
    return False


def make_mat(name, color):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name=name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.92
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.0
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = 0.0
    return mat


TRUNK_MAT = make_mat("Tree_Trunk_Warm", (0.38, 0.24, 0.13, 1.0))
PINE_MAT = make_mat("Tree_Pine_Green", (0.12, 0.38, 0.18, 1.0))
PINE_DARK_MAT = make_mat("Tree_Pine_Dark", (0.08, 0.28, 0.14, 1.0))
LEAF_MAT = make_mat("Tree_Leaf_Green", (0.28, 0.55, 0.25, 1.0))
SNOW_MAT = make_mat("Tree_Snow_Cap", (0.88, 0.91, 0.95, 1.0))


def load_blend_sources():
    with bpy.data.libraries.load(TREE_BLEND, link=False) as (data_from, data_to):
        wanted = [name for name in (NORMAL_PINE_SOURCE, SNOW_PINE_SOURCE) if name in data_from.objects]
        data_to.objects = wanted
    loaded = {obj.name: obj for obj in data_to.objects if obj}
    missing = [name for name in (NORMAL_PINE_SOURCE, SNOW_PINE_SOURCE) if name not in loaded]
    if missing:
        raise RuntimeError(f"Missing tree objects in blend: {', '.join(missing)}")
    return loaded


def material_for_blend_pine(poly_index, snow=False):
    if poly_index == 0:
        return 0
    if snow and poly_index == 2:
        return 2
    return 1


def normalized_mesh_from_single(obj, mesh_name, materials, material_mapper):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    zmin = min(zs)

    verts = [(v.co.x - cx, v.co.y - cy, v.co.z - zmin) for v in obj.data.vertices]
    faces = []
    mat_indices = []
    for poly in obj.data.polygons:
        faces.append(tuple(poly.vertices))
        mat_indices.append(material_mapper(poly.material_index))

    mesh = bpy.data.meshes.new(mesh_name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for mat in materials:
        mesh.materials.append(mat)
    for poly, mat_index in zip(mesh.polygons, mat_indices):
        poly.material_index = mat_index
    return mesh, max(zs) - zmin


def imported_fbx_objects(filename):
    path = os.path.join(SCRIPT_DIR, "..", "assets", "trees", filename)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [obj for obj in bpy.data.objects if obj not in before and obj.type == "MESH"]


def normalized_mesh_from_objects(objects, mesh_name, object_material_fn):
    world_verts = []
    parts = []

    for obj in objects:
        start = len(world_verts)
        for vertex in obj.data.vertices:
            world_verts.append(obj.matrix_world @ vertex.co)
        faces = [tuple(start + index for index in poly.vertices) for poly in obj.data.polygons]
        parts.append((obj, faces))

    xs = [v.x for v in world_verts]
    ys = [v.y for v in world_verts]
    zs = [v.z for v in world_verts]
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    zmin = min(zs)

    materials = []
    material_index = {}
    for obj, _faces in parts:
        mat = object_material_fn(obj)
        if mat.name not in material_index:
            material_index[mat.name] = len(materials)
            materials.append(mat)

    verts = [(v.x - cx, v.y - cy, v.z - zmin) for v in world_verts]
    faces = []
    mat_indices = []
    for obj, obj_faces in parts:
        mat = object_material_fn(obj)
        for face in obj_faces:
            faces.append(face)
            mat_indices.append(material_index[mat.name])

    mesh = bpy.data.meshes.new(mesh_name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    for mat in materials:
        mesh.materials.append(mat)
    for poly, mat_index in zip(mesh.polygons, mat_indices):
        poly.material_index = mat_index

    for obj in objects:
        bpy.data.objects.remove(obj, do_unlink=True)

    return mesh, max(zs) - zmin


def scatter_kind(collection, mesh, source_height, name_prefix, count, x_range, y_range, height_range, slope_min, target_height_range, radius=5.5):
    created = 0
    attempts = 0
    max_attempts = count * 40
    placed = []

    while created < count and attempts < max_attempts:
        attempts += 1
        x = random.uniform(*x_range)
        y = random.uniform(*y_range)
        hit, normal = terrain_hit_at(terrain_eval, terrain_inv, terrain_normal_matrix, x, y)
        if hit is None:
            continue
        if hit.z < height_range[0] or hit.z > height_range[1]:
            continue
        if normal and normal.z < slope_min:
            continue
        if blocked_by_paths(x, y):
            continue
        if any(math.hypot(x - px, y - py) < radius for px, py in placed):
            continue

        obj = bpy.data.objects.new(f"{name_prefix}_{created:03d}", mesh)
        target_height = random.uniform(*target_height_range)
        scale = target_height / max(0.01, source_height)
        obj.location = (x, y, hit.z + SURFACE_OFFSET)
        obj.rotation_euler = (0.0, 0.0, random.uniform(0.0, math.tau))
        obj.scale = (
            scale * random.uniform(0.86, 1.14),
            scale * random.uniform(0.86, 1.14),
            scale * random.uniform(0.90, 1.18),
        )
        collection.objects.link(obj)
        placed.append((x, y))
        created += 1

    print(f"{name_prefix}: scattered {created}/{count} after {attempts} attempts")


terrain = find_terrain_mesh()
depsgraph = bpy.context.evaluated_depsgraph_get()
terrain_eval = terrain.evaluated_get(depsgraph)
terrain_inv = terrain_eval.matrix_world.inverted()
terrain_normal_matrix = terrain_eval.matrix_world.to_3x3()

vegetation = ensure_collection(VEGETATION_COLLECTION)
auto_collection = ensure_collection(AUTO_COLLECTION, vegetation)
clear_collection(auto_collection)

sources = load_blend_sources()
normal_mesh, normal_height = normalized_mesh_from_single(
    sources[NORMAL_PINE_SOURCE],
    "Tree_Pine_Normal_Field_Mesh",
    [TRUNK_MAT, PINE_MAT],
    lambda material_index: material_for_blend_pine(material_index, snow=False),
)
snow_mesh, snow_height = normalized_mesh_from_single(
    sources[SNOW_PINE_SOURCE],
    "Tree_Pine_Snow_Field_Mesh",
    [TRUNK_MAT, PINE_DARK_MAT, SNOW_MAT],
    lambda material_index: material_for_blend_pine(material_index, snow=True),
)
low_mesh, low_height = normalized_mesh_from_objects(
    imported_fbx_objects(LOW_FBX),
    "Tree_Low_FBX_Field_Mesh",
    lambda obj: TRUNK_MAT if "cyl" in obj.name.lower() else LEAF_MAT,
)
round_mesh, round_height = normalized_mesh_from_objects(
    imported_fbx_objects(ROUND_FBX),
    "Tree_Round_FBX_Field_Mesh",
    lambda obj: TRUNK_MAT if "cyl" in obj.name.lower() else LEAF_MAT,
)

scatter_kind(
    auto_collection,
    normal_mesh,
    normal_height,
    "Tree_Pine_Normal_Auto",
    NORMAL_PINE_COUNT,
    (-68.0, 68.0),
    (18.0, 155.0),
    (0.5, 22.0),
    0.42,
    (1.7, 3.2),
    radius=1.4,
)

scatter_kind(
    auto_collection,
    snow_mesh,
    snow_height,
    "Tree_Pine_Snow_Auto",
    SNOW_PINE_COUNT,
    (-72.0, 72.0),
    (120.0, 235.0),
    (14.0, 105.0),
    0.32,
    (1.8, 3.6),
    radius=1.7,
)

scatter_kind(
    auto_collection,
    low_mesh,
    low_height,
    "Tree_Low_FBX_Auto",
    LOW_TREE_COUNT,
    (-62.0, 62.0),
    (26.0, 140.0),
    (0.5, 12.0),
    0.6,
    (1.6, 2.8),
    radius=1.9,
)

scatter_kind(
    auto_collection,
    round_mesh,
    round_height,
    "Tree_Round_FBX_Auto",
    ROUND_TREE_COUNT,
    (-58.0, 58.0),
    (28.0, 130.0),
    (0.5, 10.0),
    0.62,
    (1.5, 2.5),
    radius=2.0,
)

if bpy.data.filepath:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
