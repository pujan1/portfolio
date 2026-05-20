"""
Create a Blender workspace for hand-authoring vegetation.

This imports the generated landscape GLB as a locked reference, creates an empty
Vegetation collection, and saves a .blend file you can reopen for manual edits.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \\
      --python setup_vegetation_workspace.py
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DRONE_DIR = os.path.dirname(SCRIPT_DIR)
LANDSCAPE_GLB = os.path.join(DRONE_DIR, "assets", "blender", "landscape.glb")
WORKSPACE_BLEND = os.path.join(SCRIPT_DIR, "vegetation_workspace.blend")


def ensure_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


bpy.ops.wm.read_factory_settings(use_empty=True)

if not os.path.exists(LANDSCAPE_GLB):
    raise FileNotFoundError(f"Missing landscape reference: {LANDSCAPE_GLB}")

bpy.ops.import_scene.gltf(filepath=LANDSCAPE_GLB)

landscape_collection = ensure_collection("Landscape_Reference")
vegetation_collection = ensure_collection("Vegetation")
trees_collection = ensure_collection("Trees")

for obj in list(bpy.context.scene.objects):
    if obj.name.startswith("Camera") or obj.name.startswith("Light"):
        continue
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    landscape_collection.objects.link(obj)
    obj.hide_select = True
    obj.display_type = "TEXTURED"

bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection

note_curve = bpy.data.curves.new("Vegetation_Workspace_Note", "FONT")
note_curve.body = (
    "Place grass in the Vegetation collection and trees in the Trees collection. "
    "Export combined as tools/blender/build/vegetation.glb."
)
note_curve.align_x = "CENTER"
note_curve.size = 2.0
note = bpy.data.objects.new("Vegetation_Workspace_Note", note_curve)
note.location = (0, 35, 8)
note.rotation_euler = (1.2, 0, 0)
vegetation_collection.objects.link(note)

bpy.ops.object.camera_add(location=(35, -55, 45), rotation=(1.05, 0, 0.55))
bpy.context.scene.camera = bpy.context.object

bpy.ops.wm.save_as_mainfile(filepath=WORKSPACE_BLEND)
print(f"Saved vegetation workspace: {WORKSPACE_BLEND}")
