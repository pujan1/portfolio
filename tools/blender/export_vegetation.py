"""
Export manually authored vegetation from vegetation_workspace.blend.

Exports mesh objects in the "Vegetation" and "Trees" collections to
tools/blender/build/vegetation.glb. compress_vegetation.sh then writes
the runtime-ready glb to assets/models/vegetation.glb.

The original prototype palette objects (Grass_Clump_A/B/C) are skipped,
while linked duplicates such as Grass_Clump_A.001 are included.
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(SCRIPT_DIR, "build", "vegetation.glb")
SOURCE_COLLECTIONS = ("Vegetation", "Trees")
PROTOTYPE_NAMES = {"Grass_Clump_A", "Grass_Clump_B", "Grass_Clump_C"}


collections = []
for name in SOURCE_COLLECTIONS:
    collection = bpy.data.collections.get(name)
    if collection is None:
        print(f'[export] collection "{name}" missing, skipping')
        continue
    collections.append(collection)
if not collections:
    raise RuntimeError(
        f'No source collections present. Expected at least one of {SOURCE_COLLECTIONS}.'
    )

def export_candidates():
    candidates = set()
    for collection in collections:
        candidates.update(collection.all_objects)
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
