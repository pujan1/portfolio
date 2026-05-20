"""
Add low-poly grass clump prototypes to vegetation_workspace.blend.

Run:
  /Applications/Blender.app/Contents/MacOS/Blender --background \\
      demo/drone/blender/vegetation_workspace.blend \\
      --python demo/drone/blender/add_grass_prototypes.py
"""

import math
import os
import random

import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_BLEND = os.path.join(SCRIPT_DIR, "vegetation_workspace.blend")

random.seed(20260519)


def ensure_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def make_mat(name, color):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.9
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.0
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = 0.0
    return mat


def create_blade(center_x, center_y, base_z, width, height, yaw, lean):
    half = width / 2
    tip_x = math.sin(yaw) * lean
    tip_y = math.cos(yaw) * lean
    side_x = math.cos(yaw) * half
    side_y = -math.sin(yaw) * half
    return [
        (center_x - side_x, center_y - side_y, base_z),
        (center_x + side_x, center_y + side_y, base_z),
        (center_x + tip_x, center_y + tip_y, base_z + height),
    ]


def create_grass_clump(name, loc, blade_count, scale, mat):
    if bpy.data.objects.get(name):
        return bpy.data.objects[name]

    verts = []
    faces = []
    for i in range(blade_count):
        yaw = (math.tau * i / blade_count) + random.uniform(-0.22, 0.22)
        height = random.uniform(0.45, 0.9) * scale
        width = random.uniform(0.08, 0.16) * scale
        lean = random.uniform(0.03, 0.16) * scale
        cx = random.uniform(-0.08, 0.08) * scale
        cy = random.uniform(-0.08, 0.08) * scale
        start = len(verts)
        verts.extend(create_blade(cx, cy, 0.0, width, height, yaw, lean))
        faces.append((start, start + 1, start + 2))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = False
    ensure_collection("Vegetation").objects.link(obj)
    return obj


vegetation = ensure_collection("Vegetation")
grass_light = make_mat("Grass_Prototype_Light", (0.34, 0.72, 0.28, 1.0))
grass_dark = make_mat("Grass_Prototype_Dark", (0.20, 0.52, 0.22, 1.0))
grass_dry = make_mat("Grass_Prototype_Dry", (0.56, 0.64, 0.28, 1.0))

prototypes = [
    create_grass_clump("Grass_Clump_A", (-8.0, 6.0, 0.2), 5, 1.0, grass_light),
    create_grass_clump("Grass_Clump_B", (-6.7, 6.0, 0.2), 7, 1.25, grass_dark),
    create_grass_clump("Grass_Clump_C", (-5.2, 6.0, 0.2), 4, 0.85, grass_dry),
]

for obj in prototypes:
    obj.hide_select = False
    obj.select_set(True)

bpy.context.view_layer.objects.active = prototypes[0]

if bpy.data.filepath:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
elif os.path.exists(WORKSPACE_BLEND):
    bpy.ops.wm.save_as_mainfile(filepath=WORKSPACE_BLEND)

print("Added grass prototypes: Grass_Clump_A, Grass_Clump_B, Grass_Clump_C")
