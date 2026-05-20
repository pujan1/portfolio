"""
Export the manually cleaned drone model from drone.blend.

This exports visible mesh objects to:
  demo/drone/assets/blender/drone.glb
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DRONE_DIR = os.path.dirname(SCRIPT_DIR)
OUT_PATH = os.path.join(DRONE_DIR, "assets", "blender", "drone.glb")


for obj in bpy.context.scene.objects:
    obj.select_set(False)

exported = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    if obj.hide_get() or obj.hide_viewport:
        continue
    obj.select_set(True)
    exported.append(obj.name)

if not exported:
    raise RuntimeError("No visible mesh objects found to export from drone.blend.")

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

print(f"Exported drone: {OUT_PATH}")
print(f"Objects exported: {len(exported)}")
if len(exported) <= 30:
    print(f"Objects: {', '.join(exported)}")
