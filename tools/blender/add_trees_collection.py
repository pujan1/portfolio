"""
One-time migration: add an empty "Trees" collection to vegetation_workspace.blend
without disturbing existing placements. Safe to re-run — it no-ops if the
collection already exists.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \\
      tools/blender/vegetation_workspace.blend \\
      --python tools/blender/add_trees_collection.py
"""

import bpy

if "Trees" in bpy.data.collections:
    print("[add_trees_collection] Trees collection already exists, nothing to do")
else:
    coll = bpy.data.collections.new("Trees")
    bpy.context.scene.collection.children.link(coll)
    bpy.ops.wm.save_mainfile()
    print("[add_trees_collection] added Trees collection and saved blend")
