"""
Drop selected vegetation objects onto the landscape reference terrain.

Use inside Blender:
  1. Select the grass/tree objects you want to fix, or select nothing to snap
     every placed vegetation object.
  2. Open this file in Blender's Text Editor.
  3. Press Run Script.

Assumes the landscape reference is in a collection named "Landscape_Reference".
The script raycasts against the largest mesh in that collection, which is the
terrain plane, and moves selected Vegetation objects down/up to touch it.
"""

import bpy
from mathutils import Vector

LANDSCAPE_COLLECTION = "Landscape_Reference"
VEGETATION_COLLECTION = "Vegetation"
SURFACE_OFFSET = 0.035
RAY_START_Z = 500.0
RAY_LENGTH = 1000.0
PROTOTYPE_NAMES = {"Grass_Clump_A", "Grass_Clump_B", "Grass_Clump_C"}


def in_collection(obj, collection_name):
    return any(collection.name == collection_name for collection in obj.users_collection)


def find_terrain_mesh():
    collection = bpy.data.collections.get(LANDSCAPE_COLLECTION)
    if collection is None:
        raise RuntimeError(f'Missing collection "{LANDSCAPE_COLLECTION}"')

    meshes = [obj for obj in collection.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f'No mesh objects in "{LANDSCAPE_COLLECTION}"')

    # The generated terrain is by far the largest mesh. This avoids snapping to
    # road cubes, bridge pieces, water, foam, or rocks.
    return max(meshes, key=lambda obj: len(obj.data.vertices))


def terrain_hit_at(terrain, x, y):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    terrain_eval = terrain.evaluated_get(depsgraph)

    ray_origin_world = Vector((x, y, RAY_START_Z))
    ray_direction_world = Vector((0.0, 0.0, -1.0))

    inv = terrain_eval.matrix_world.inverted()
    ray_origin_local = inv @ ray_origin_world
    ray_direction_local = inv.to_3x3() @ ray_direction_world
    ray_direction_local.normalize()

    hit, loc, _normal, _face_index = terrain_eval.ray_cast(
        ray_origin_local,
        ray_direction_local,
        distance=RAY_LENGTH,
    )
    if not hit:
        return None

    return terrain_eval.matrix_world @ loc


terrain = find_terrain_mesh()
selected = [
    obj for obj in bpy.context.selected_objects
    if obj.type in {"MESH", "EMPTY"} and in_collection(obj, VEGETATION_COLLECTION)
    and obj.name not in PROTOTYPE_NAMES
]

if not selected:
    collection = bpy.data.collections.get(VEGETATION_COLLECTION)
    candidates = set(collection.all_objects)
    candidates.update(
        obj for obj in bpy.data.objects
        if obj.name.startswith("Grass_Clump_")
    )
    selected = [
        obj for obj in candidates
        if obj.type in {"MESH", "EMPTY"} and obj.name not in PROTOTYPE_NAMES
    ]

if not selected:
    raise RuntimeError(
        f'No placed vegetation objects found. Duplicate the grass prototypes first.'
    )

snapped = 0
missed = []
for obj in selected:
    world_origin = obj.matrix_world.translation
    hit = terrain_hit_at(terrain, world_origin.x, world_origin.y)
    if hit is None:
        missed.append(obj.name)
        continue
    obj.location.z += (hit.z + SURFACE_OFFSET) - world_origin.z
    snapped += 1

print(f"Snapped {snapped} object(s) to {terrain.name}.")
if missed:
    print("No terrain hit for:", ", ".join(missed))

if bpy.data.filepath:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
