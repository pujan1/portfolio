"""
Export manually authored vegetation from vegetation_workspace.blend.

This exports mesh objects in the "Vegetation" collection to:
  demo/drone/assets/blender/vegetation.glb

The original prototype palette objects (Grass_Clump_A/B/C) are skipped, while
linked duplicates such as Grass_Clump_A.001 are included.
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DRONE_DIR = os.path.dirname(SCRIPT_DIR)
OUT_PATH = os.path.join(DRONE_DIR, "assets", "blender", "vegetation.glb")
VEGETATION_COLLECTION = "Vegetation"
PROTOTYPE_NAMES = {"Grass_Clump_A", "Grass_Clump_B", "Grass_Clump_C"}


collection = bpy.data.collections.get(VEGETATION_COLLECTION)
if collection is None:
    raise RuntimeError(f'Missing collection "{VEGETATION_COLLECTION}"')

def export_candidates():
    candidates = set(collection.all_objects)
    candidates.update(
        obj for obj in bpy.data.objects
        if obj.name.startswith("Grass_Clump_")
    )
    return sorted(candidates, key=lambda obj: obj.name)


bpy.ops.object.select_all(action="DESELECT")

exported = []
for obj in export_candidates():
    if obj.type != "MESH":
        continue
    if obj.name in PROTOTYPE_NAMES:
        continue
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.select_set(True)
    exported.append(obj.name)

if not exported:
    raise RuntimeError(
        "No vegetation mesh objects to export. "
        "Duplicate Grass_Clump_A/B/C first; exact prototype palette objects are skipped."
    )

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    use_selection=True,
    export_cameras=False,
    export_lights=False,
)

print(f"Exported vegetation: {OUT_PATH}")
print(f"Objects exported: {len(exported)}")
if len(exported) <= 30:
    print(f"Objects: {', '.join(exported)}")
