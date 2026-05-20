"""
Landscape builder — generates the full low-poly diorama terrain.

Scene contains:
  - Subdivided ground plane with noise-displaced hills
  - Snow-capped mountains at the far end of the flight path
  - Waterfall flowing from a mountain into a pond
  - River winding from the pond through vegetation, crossing the drone path
  - Dirt road tracing the drone's flight curve
  - Small wooden bridge where the road crosses the river

Flight-path frame of reference (must match POIS in main.js):
  - Drone starts at (0, 0)
  - Flies in the -Z direction
  - Ends near (4, -82)
  - Terrain bounds: x ∈ [-55, 55], z ∈ [25, -130]
  - Mountains live at z ≈ -110 (behind the contact POI)

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender --background \\
      --python build_landscape.py

Outputs: ../assets/blender/landscape.glb
"""

import bpy
import math
import os
import random
from mathutils import Vector

# Deterministic noise — keeps re-runs identical for layout iteration
random.seed(20260519)

# ─────────────────────────────────────────────
# CLEAN SCENE
# ─────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ─────────────────────────────────────────────
# PALETTE — must coordinate with three.js scene
# ─────────────────────────────────────────────
PALETTE = {
    "grass":      (0.44, 0.78, 0.42, 1.0),
    "grass_dark": (0.28, 0.60, 0.30, 1.0),
    "grass_dry":  (0.62, 0.78, 0.42, 1.0),
    "dirt":       (0.55, 0.38, 0.24, 1.0),
    "dirt_dark":  (0.40, 0.26, 0.16, 1.0),
    "rock":       (0.55, 0.55, 0.58, 1.0),
    "rock_dark":  (0.38, 0.38, 0.42, 1.0),
    "snow":       (0.95, 0.97, 1.00, 1.0),
    "water":      (0.30, 0.72, 0.85, 1.0),
    "water_deep": (0.18, 0.55, 0.78, 1.0),
    "foam":       (0.95, 0.99, 1.00, 1.0),
    "wood":       (0.50, 0.32, 0.18, 1.0),
    "wood_dark":  (0.32, 0.20, 0.10, 1.0),
    "moss":       (0.20, 0.65, 0.30, 1.0),
}

_mats = {}
def mat(name):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name=name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = PALETTE[name]
        bsdf.inputs["Roughness"].default_value = 0.92
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.0
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = 0.0
    _mats[name] = m
    return m

def assign_flat(obj, name):
    if obj.data.materials:
        obj.data.materials[0] = mat(name)
    else:
        obj.data.materials.append(mat(name))
    for poly in obj.data.polygons:
        poly.use_smooth = False

# ─────────────────────────────────────────────
# PRIMITIVE HELPERS
# ─────────────────────────────────────────────
def add_cube(loc, scale, name, mat_name, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.rotation_euler = rot
    assign_flat(o, mat_name)
    return o

def add_cone(loc, radius, depth, name, mat_name, verts=8, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, radius2=0,
                                    depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    assign_flat(o, mat_name)
    return o

def add_cyl(loc, radius, depth, name, mat_name, verts=8, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius,
                                        depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    assign_flat(o, mat_name)
    return o

def add_ico(loc, radius, name, mat_name, subdiv=1, scale=(1,1,1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    assign_flat(o, mat_name)
    return o

# ─────────────────────────────────────────────
# COORD SYSTEM NOTE
# We use three.js-style coordinates throughout this script:
#   X = right · Y = up · Z = forward (with flight path going into -Z)
# Blender uses Z-up. The helper `B(x, y, z)` converts a three.js (x, y, z)
# tuple into the Blender (x, y, z) tuple that — after `export_yup=True` —
# will land at the intended three.js position.
#   three.js (x, y, z) → Blender (x, -z, y)
# ─────────────────────────────────────────────
def B(x, y, z):
    return (x, -z, y)

# ─────────────────────────────────────────────
# BASE GROUND — subdivided plane with gentle hill displacement
# ─────────────────────────────────────────────
GROUND_SIZE_X   = 200   # wider for side mountain headroom
GROUND_SIZE_Z   = 400   # much longer — gives back-edge mountain massive vertical room
GROUND_CENTER_Z = -90   # shift back further so back peaks have proper depth behind path

bpy.ops.mesh.primitive_plane_add(size=1, location=B(0, 0, GROUND_CENTER_Z))
ground = bpy.context.object
ground.name = "Ground"
# Plane lives in XY locally (Blender Z-up). After yup export it'll be XZ in three.js.
# Scale to match: x stays x; y becomes -z, so y scale = Z half-size
ground.scale = (GROUND_SIZE_X / 2, GROUND_SIZE_Z / 2, 1)
bpy.ops.object.transform_apply(scale=True)

# Subdivide for displacement — more cuts = smoother mountain edges
bpy.context.view_layer.objects.active = ground
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
for _ in range(7):  # 2^7 = 128 cuts per side
    bpy.ops.mesh.subdivide(number_cuts=1)
bpy.ops.object.mode_set(mode='OBJECT')

# Displace vertices — gentle rolling hills, avoiding the drone path
mesh = ground.data

PATH_CARVE_RADIUS = 3.2   # within this, terrain is forced FLAT under the road
HILL_FALLOFF      = 7.0   # outside this radius from path, full hills

# ─────────────────────────────────────────────
# ROAD CURVE — Catmull-Rom through control points,
# with small lateral jitter to break up the smoothness.
# ─────────────────────────────────────────────
ROAD_CONTROL = [
    ( 0,  18), ( 0,  10), (-1,   0),   # takeoff approach
    (-8, -14), ( 6, -28), (-7, -42),    # POIs 1–3
    (-2, -52),                          # bridge crossing (~)
    ( 9, -56), (-3, -70), ( 4, -82),    # POIs 4–6
    ( 6, -92), ( 6, -100),              # touchdown extends
]

def catmullrom(points, samples_per_segment=10, tension=0.5):
    if len(points) < 2: return list(points)
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(len(points) - 1):
        p0, p1, p2, p3 = pts[i], pts[i+1], pts[i+2], pts[i+3]
        for s in range(samples_per_segment):
            t = s / samples_per_segment
            t2 = t * t; t3 = t2 * t
            b0 = -tension*t3 + 2*tension*t2 - tension*t
            b1 = (2-tension)*t3 + (tension-3)*t2 + 1
            b2 = (tension-2)*t3 + (3-2*tension)*t2 + tension*t
            b3 = tension*t3 - tension*t2
            x = b0*p0[0] + b1*p1[0] + b2*p2[0] + b3*p3[0]
            z = b0*p0[1] + b1*p1[1] + b2*p2[1] + b3*p3[1]
            out.append((x, z))
    out.append(points[-1])
    return out

# Sample dense points along the road curve, then add small lateral wobble
ROAD_POINTS_RAW = catmullrom(ROAD_CONTROL, samples_per_segment=8)
ROAD_POINTS = []
for i, (x, z) in enumerate(ROAD_POINTS_RAW):
    # Perpendicular jitter — tiny, gives "this road wasn't drawn by a robot" feel
    if i == 0 or i == len(ROAD_POINTS_RAW) - 1:
        ROAD_POINTS.append((x, z))
        continue
    nx, nz = ROAD_POINTS_RAW[i+1][0] - ROAD_POINTS_RAW[i-1][0], ROAD_POINTS_RAW[i+1][1] - ROAD_POINTS_RAW[i-1][1]
    nlen = math.hypot(nx, nz) or 1
    px, pz = -nz / nlen, nx / nlen  # perpendicular unit
    wobble = math.sin(i * 0.37) * 0.6 + math.cos(i * 0.91) * 0.4
    ROAD_POINTS.append((x + px * wobble, z + pz * wobble))

def _polyline_dist(x, z, points):
    """Min distance from (x, z) to a polyline of (x, z) points."""
    best = 1e9
    for i in range(len(points) - 1):
        x1, z1 = points[i]
        x2, z2 = points[i + 1]
        dx, dz = x2 - x1, z2 - z1
        seg_len_sq = dx*dx + dz*dz
        if seg_len_sq < 1e-9:
            best = min(best, math.hypot(x - x1, z - z1))
            continue
        t = ((x - x1) * dx + (z - z1) * dz) / seg_len_sq
        t = max(0, min(1, t))
        px, pz = x1 + t * dx, z1 + t * dz
        best = min(best, math.hypot(x - px, z - pz))
    return best

def path_dist(x, z):
    return _polyline_dist(x, z, ROAD_POINTS)

# ─────────────────────────────────────────────
# RIVER — defined here so the terrain can carve a channel for it before
# the river meshes are placed below
# ─────────────────────────────────────────────
RIVER_POINTS = [
    (-24, -97),    # waterfall pool
    (-22, -88),
    (-15, -75),
    (-8,  -62),
    (-2,  -52),    # crosses road at bridge
    ( 6,  -45),
    ( 14, -38),
    ( 22, -32),
    ( 32, -28),
    ( 50, -24),
]
RIVER_CHANNEL_RADIUS = 3.5    # within this distance, terrain dips to channel floor
RIVER_BANK_FALLOFF   = 6.5    # transition out of the channel — wider for natural slope
RIVER_DEPTH          = 2.2    # deeper channel — river clearly sits below ground level
WATER_SURFACE_Y      = -0.9   # water surface clearly below ground level
RIVER_THICKNESS      = 0.35   # thin slab — just the visible surface

def river_dist(x, z):
    return _polyline_dist(x, z, RIVER_POINTS)

def noise2d(x, z, scale=0.18, octaves=3):
    v = 0; amp = 1.0; freq = scale
    for _ in range(octaves):
        v += amp * (math.sin(x * freq + z * freq * 1.3) +
                    math.cos(x * freq * 1.7 - z * freq * 0.9)) * 0.5
        freq *= 2.1
        amp  *= 0.5
    return v

# Bowl-edge mountain rise.
# Sides are big, the BACK is dramatically taller — like a mountain range looming
# behind the path. Front (behind takeoff) matches the sides.
SIDE_MOUNTAIN_HEIGHT  = 140.0
BACK_MOUNTAIN_HEIGHT  = 300.0   # towering — should fill the back horizon
EDGE_MOUNTAIN_START_X = 35
EDGE_MOUNTAIN_START_Z = 40
EDGE_MOUNTAIN_CURVE   = 1.35
# Variable snow line — noise determines per-area threshold so caps look organic
SNOW_LINE_BASE        = 50.0
SNOW_LINE_VARIATION   = 22.0    # ± from base — some peaks have snow lower, others higher

# Add a vertex color attribute for per-vertex coloring (grass → snow gradient)
if not mesh.color_attributes:
    mesh.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
color_layer = mesh.color_attributes['Col']

GRASS_RGB = PALETTE["grass"][:3]
GRASS_DARK_RGB = PALETTE["grass_dark"][:3]
ROCK_RGB  = PALETTE["rock"][:3]
SNOW_RGB  = PALETTE["snow"][:3]

def lerp_rgb(a, b, t):
    return (a[0]*(1-t)+b[0]*t, a[1]*(1-t)+b[1]*t, a[2]*(1-t)+b[2]*t)

# Plane center in Blender-local Y after our placement (B(0, 0, GROUND_CENTER_Z))
PLANE_CENTER_BY = -GROUND_CENTER_Z   # = 40 with center=-40

for v in mesh.vertices:
    bx, by, _ = v.co.x, v.co.y, v.co.z
    three_x = bx
    three_z = -by

    # Edge mountain rise — bowl shape with the BACK direction much taller
    edge_x = max(0, abs(bx) - EDGE_MOUNTAIN_START_X) / (GROUND_SIZE_X / 2 - EDGE_MOUNTAIN_START_X)
    # Signed Z offset: positive Blender-Y = back direction (negative three.js z)
    z_signed = by - PLANE_CENTER_BY
    edge_z_back  = max(0,  z_signed - EDGE_MOUNTAIN_START_Z) / (GROUND_SIZE_Z / 2 - EDGE_MOUNTAIN_START_Z)
    edge_z_front = max(0, -z_signed - EDGE_MOUNTAIN_START_Z) / (GROUND_SIZE_Z / 2 - EDGE_MOUNTAIN_START_Z)
    side_rise  = (edge_x ** EDGE_MOUNTAIN_CURVE) * SIDE_MOUNTAIN_HEIGHT
    back_rise  = (edge_z_back ** EDGE_MOUNTAIN_CURVE) * BACK_MOUNTAIN_HEIGHT
    front_rise = (edge_z_front ** EDGE_MOUNTAIN_CURVE) * SIDE_MOUNTAIN_HEIGHT
    edge_rise = max(side_rise, back_rise, front_rise)
    edge_rise *= 0.85 + 0.18 * noise2d(three_x * 0.15, three_z * 0.15, octaves=1)

    # Gentle rolling hills near center
    hills_h = noise2d(three_x, three_z, scale=0.13) * 1.1

    # Base terrain height (before path/river carving)
    base_h = hills_h + edge_rise

    # ── ROAD CARVE — flat corridor at ground level ──
    dist_to_path = path_dist(three_x, three_z)
    if dist_to_path < PATH_CARVE_RADIUS:
        terrain_h = 0.0
    elif dist_to_path < PATH_CARVE_RADIUS + HILL_FALLOFF:
        t = (dist_to_path - PATH_CARVE_RADIUS) / HILL_FALLOFF
        terrain_h = base_h * (t ** 1.5)
    else:
        terrain_h = base_h

    # ── RIVER CARVE — terrain dips into a channel along the river ──
    dist_to_river = river_dist(three_x, three_z)
    if dist_to_river < RIVER_CHANNEL_RADIUS:
        # Inside the channel — floor at -RIVER_DEPTH
        terrain_h = -RIVER_DEPTH
    elif dist_to_river < RIVER_CHANNEL_RADIUS + RIVER_BANK_FALLOFF:
        # Bank — blend up from channel floor to surrounding terrain
        t = (dist_to_river - RIVER_CHANNEL_RADIUS) / RIVER_BANK_FALLOFF
        # smoothstep-like blend
        s = t * t * (3 - 2 * t)
        terrain_h = (-RIVER_DEPTH) * (1 - s) + terrain_h * s

    v.co.z = terrain_h
    h = v.co.z

    # Variable snow line — varies per-area via low-frequency noise.
    # Some peaks get snow at 35, others at 65 — gives a natural look.
    local_snow = SNOW_LINE_BASE + noise2d(three_x * 0.06, three_z * 0.06, octaves=2) * SNOW_LINE_VARIATION
    snow_band  = 6.0

    if h < 1.5:
        color = GRASS_RGB
    elif h < local_snow - snow_band:
        t = (h - 1.5) / max(0.1, local_snow - snow_band - 1.5)
        color = lerp_rgb(GRASS_RGB, GRASS_DARK_RGB, t * 0.6)
        color = lerp_rgb(color, ROCK_RGB, max(0, t - 0.5) * 2)
    elif h < local_snow:
        t = (h - (local_snow - snow_band)) / snow_band
        color = lerp_rgb(ROCK_RGB, SNOW_RGB, t)
    else:
        color = SNOW_RGB
    color_layer.data[v.index].color = (color[0], color[1], color[2], 1.0)

# Material for the ground that uses vertex colors
ground_mat = bpy.data.materials.new(name="ground_vc")
ground_mat.use_nodes = True
nodes = ground_mat.node_tree.nodes
links = ground_mat.node_tree.links
vc_node = nodes.new(type='ShaderNodeVertexColor')
vc_node.layer_name = 'Col'
bsdf = nodes['Principled BSDF']
links.new(vc_node.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.95
if 'Specular IOR Level' in bsdf.inputs:
    bsdf.inputs['Specular IOR Level'].default_value = 0.0
elif 'Specular' in bsdf.inputs:
    bsdf.inputs['Specular'].default_value = 0.0
ground.data.materials.clear()
ground.data.materials.append(ground_mat)
for poly in ground.data.polygons:
    poly.use_smooth = False

# (Grass patches removed — terrain vertex color provides variation,
# and dense vegetation is now scattered via three.js InstancedMesh)

# (SNOW_PEAKS removed — mountains are now part of the terrain itself,
# rising from the bowl edges with snow applied via vertex color)

# ─────────────────────────────────────────────
# WATERFALL — flows down the terrain's back-edge mountains
# Naming: anything starting with WATER_ gets animated in three.js
# ─────────────────────────────────────────────
WATERFALL_X, WATERFALL_Z = -28, -120  # back-edge mountain face
WATERFALL_TOP = 55                    # falls from high on the tall back mountain
WATERFALL_BOTTOM = WATER_SURFACE_Y    # bottom meets the new (deeper) water surface

mid_y = (WATERFALL_TOP + WATERFALL_BOTTOM) / 2
half_h = (WATERFALL_TOP - WATERFALL_BOTTOM) / 2
add_cube(loc=B(WATERFALL_X, mid_y, WATERFALL_Z),
         scale=(1.4, 0.25, half_h),
         name="WATER_Waterfall_Main", mat_name="water")

# A wider sheen behind it for "spray"
add_cube(loc=B(WATERFALL_X, mid_y, WATERFALL_Z - 0.3),
         scale=(2.2, 0.18, half_h),
         name="Waterfall_Spray", mat_name="foam")

add_ico(loc=B(WATERFALL_X, WATERFALL_TOP - 0.4, WATERFALL_Z - 0.3),
        radius=2.0, name="Waterfall_Top_Foam", mat_name="foam",
        subdiv=1, scale=(1.0, 0.5, 0.3))
add_ico(loc=B(WATERFALL_X, WATERFALL_BOTTOM + 0.4, WATERFALL_Z + 0.8),
        radius=2.8, name="Waterfall_Pool_Foam", mat_name="foam",
        subdiv=1, scale=(1.0, 0.6, 0.3))

# Pool at base of waterfall — sits at the new water surface level
add_cyl(loc=B(WATERFALL_X, WATER_SURFACE_Y, WATERFALL_Z + 2), radius=4.0, depth=0.3,
        name="WATER_Pool", mat_name="water_deep", verts=14)

# ─────────────────────────────────────────────
# RIVER — winds from the pool, crosses the drone path, exits stage right
# ─────────────────────────────────────────────
# Generate as a series of overlapping flat boxes following a polyline
# River meshes — sit IN the carved channel, with visible depth.
# Channel floor is at y = -RIVER_DEPTH (=-0.8); water surface at y = -0.15 so
# the water clearly fills the dip without poking above the banks.
RIVER_WIDTH_START = 2.6
RIVER_WIDTH_END   = 3.8
# WATER_SURFACE_Y and RIVER_THICKNESS defined earlier (with RIVER_DEPTH)

for i in range(len(RIVER_POINTS) - 1):
    x1, z1 = RIVER_POINTS[i]
    x2, z2 = RIVER_POINTS[i + 1]
    mx, mz = (x1 + x2) / 2, (z1 + z2) / 2
    length = math.hypot(x2 - x1, z2 - z1)
    angle  = math.atan2(-(z2 - z1), x2 - x1)
    t = i / (len(RIVER_POINTS) - 2)
    width = RIVER_WIDTH_START * (1 - t) + RIVER_WIDTH_END * t
    # Water body — TOP face exactly at WATER_SURFACE_Y, extends down into the channel
    add_cube(loc=B(mx, WATER_SURFACE_Y - RIVER_THICKNESS, mz),
             scale=(length / 2 + 0.4, width / 2, RIVER_THICKNESS),
             name=f"WATER_River_{i}", mat_name="water",
             rot=(0, 0, angle))
    # Darker riverbed at the channel floor (just visible at edges)
    add_cube(loc=B(mx, -RIVER_DEPTH + 0.05, mz),
             scale=(length / 2 + 0.7, (width + 0.7) / 2, 0.06),
             name=f"Riverbed_{i}", mat_name="dirt_dark",
             rot=(0, 0, angle))

# Foam highlights along the river — sit just above the water surface
for i, (x, z) in enumerate(RIVER_POINTS[::2]):
    if i == 0: continue
    add_ico(loc=B(x, WATER_SURFACE_Y + 0.05, z), radius=0.4,
            name=f"River_Foam_{i}", mat_name="foam",
            subdiv=1, scale=(1.0, 0.5, 0.2))

# ─────────────────────────────────────────────
# DIRT ROAD — built from the curved+jittered ROAD_POINTS computed earlier
# ─────────────────────────────────────────────
ROAD_WIDTH = 2.6

for i in range(len(ROAD_POINTS) - 1):
    x1, z1 = ROAD_POINTS[i]
    x2, z2 = ROAD_POINTS[i + 1]
    mx, mz = (x1 + x2) / 2, (z1 + z2) / 2
    length = math.hypot(x2 - x1, z2 - z1)
    angle  = math.atan2(-(z2 - z1), x2 - x1)
    # Slight width variation makes the road feel hand-drawn
    width = ROAD_WIDTH + math.sin(i * 0.7) * 0.18
    add_cube(loc=B(mx, 0.05, mz),
             scale=(length / 2 + 0.2, width / 2, 0.05),
             name=f"Road_{i}", mat_name="dirt",
             rot=(0, 0, angle))

# Dirt mounds and small irregularities along the road edges
random.seed(7)
for i, (x, z) in enumerate(ROAD_POINTS):
    if i % 3 != 0: continue
    # Pick an offset perpendicular to the road
    if i == 0 or i == len(ROAD_POINTS) - 1: continue
    nx, nz = ROAD_POINTS[i+1][0] - ROAD_POINTS[i-1][0], ROAD_POINTS[i+1][1] - ROAD_POINTS[i-1][1]
    nlen = math.hypot(nx, nz) or 1
    px, pz = -nz / nlen, nx / nlen
    for side in (-1, 1):
        if random.random() > 0.55: continue
        off = (ROAD_WIDTH / 2 + 0.4 + random.random() * 0.6) * side
        sx = x + px * off
        sz = z + pz * off
        rad = 0.30 + random.random() * 0.4
        bump_mat = random.choice(["dirt_dark", "rock", "grass_dark"])
        add_ico(loc=B(sx, rad * 0.3, sz), radius=rad,
                name=f"Edge_Bump_{i}_{side}", mat_name=bump_mat, subdiv=1,
                scale=(1.0, 0.6, 1.0))

# ─────────────────────────────────────────────
# BRIDGE — wooden plank crossing the river, aligned with the road
# Uses explicit unit vectors along/perpendicular to the road for clarity.
# ─────────────────────────────────────────────
BRIDGE_X, BRIDGE_Z = -2, -52
BRIDGE_LEN = 6.0      # along the road
BRIDGE_WIDTH = 3.0    # across the road
BRIDGE_HEIGHT = 0.55  # deck above ground level

# Find the road sample point closest to (BRIDGE_X, BRIDGE_Z) and use its tangent
_best_i, _best_d = 0, 1e9
for _i, (_rx, _rz) in enumerate(ROAD_POINTS):
    _d = math.hypot(_rx - BRIDGE_X, _rz - BRIDGE_Z)
    if _d < _best_d:
        _best_d, _best_i = _d, _i
# Tangent from neighboring samples
_i0 = max(0, _best_i - 1)
_i1 = min(len(ROAD_POINTS) - 1, _best_i + 1)
road_dx = ROAD_POINTS[_i1][0] - ROAD_POINTS[_i0][0]
road_dz = ROAD_POINTS[_i1][1] - ROAD_POINTS[_i0][1]
road_len = math.hypot(road_dx, road_dz) or 1
# Unit vectors in three.js (x, z)
ax, az = road_dx / road_len, road_dz / road_len           # ALONG road
nx, nz = -az, ax                                          # ACROSS road (90° CCW in xz)
# Cube Z rotation that aligns the cube's local X with the road direction (in Blender XY)
bridge_angle = math.atan2(-az, ax)

def bridge_piece(along, across, height, scale, name, mat_name):
    """along: offset along road from bridge center.
       across: offset perpendicular to road.
       scale: (length-along-road, width-across-road, vertical) — matches the cube's
              X (along after rotation), Y (across), Z (vertical) semantics."""
    world_x = BRIDGE_X + ax * along + nx * across
    world_z = BRIDGE_Z + az * along + nz * across
    add_cube(loc=B(world_x, height, world_z),
             scale=scale, name=name, mat_name=mat_name,
             rot=(0, 0, bridge_angle))

# 2 main side beams running along the road
for side in (-1, 1):
    bridge_piece(0, side * (BRIDGE_WIDTH / 2 - 0.15),
                 BRIDGE_HEIGHT - 0.05,
                 (BRIDGE_LEN / 2, 0.16, 0.18),
                 f"Bridge_Beam_{side}", "wood_dark")

# Cross-beams underneath the planks (run across the road, supporting planks)
for i in range(5):
    t = (i + 0.5) / 5
    a = (t - 0.5) * BRIDGE_LEN
    bridge_piece(a, 0, BRIDGE_HEIGHT - 0.16,
                 (0.07, BRIDGE_WIDTH / 2 - 0.18, 0.06),
                 f"Bridge_Cross_{i}", "wood_dark")

# Plank deck — planks run across the road, spaced along the road
N_PLANKS = 14
plank_extent = BRIDGE_LEN / N_PLANKS
for i in range(N_PLANKS):
    t = i / (N_PLANKS - 1)
    a = (t - 0.5) * (BRIDGE_LEN - 0.2)
    mat_name = "wood" if i % 2 == 0 else "wood_dark"
    # Slightly larger plank (overlap a bit) so seams don't show as gaps
    bridge_piece(a, 0, BRIDGE_HEIGHT,
                 (plank_extent / 2 * 0.96, BRIDGE_WIDTH / 2 - 0.04, 0.05),
                 f"Plank_{i}", mat_name)

# Side railings — posts + horizontal top rail + handrail
for side in (-1, 1):
    edge_across = side * (BRIDGE_WIDTH / 2 - 0.12)
    # Vertical posts
    n_posts = 6
    for j in range(n_posts):
        pt = (j / (n_posts - 1) - 0.5)
        a = pt * (BRIDGE_LEN - 0.3)
        bridge_piece(a, edge_across, BRIDGE_HEIGHT + 0.42,
                     (0.07, 0.07, 0.42),
                     f"Post_{side}_{j}", "wood_dark")
    # Top rail (continuous along road)
    bridge_piece(0, edge_across, BRIDGE_HEIGHT + 0.82,
                 (BRIDGE_LEN / 2 - 0.18, 0.07, 0.07),
                 f"Rail_top_{side}", "wood")
    # Lower handrail
    bridge_piece(0, edge_across, BRIDGE_HEIGHT + 0.46,
                 (BRIDGE_LEN / 2 - 0.2, 0.05, 0.05),
                 f"Rail_mid_{side}", "wood_dark")
    # X cross-bracing between posts (each pair gets one diagonal)
    for j in range(n_posts - 1):
        t0 = (j     / (n_posts - 1) - 0.5) * (BRIDGE_LEN - 0.3)
        t1 = ((j+1) / (n_posts - 1) - 0.5) * (BRIDGE_LEN - 0.3)
        # Center of this rail segment
        a_mid = (t0 + t1) / 2
        seg_len = t1 - t0
        # Diagonal brace from low-front to high-back (visual X shape)
        brace_len = math.hypot(seg_len, 0.42)
        brace_angle_local = math.atan2(0.42, seg_len)
        # We place a small brace tilted at brace_angle_local around the road-perpendicular axis
        # For simplicity, use a tall thin cube angled diagonally in the rail plane.
        # (Approximate via a 2-piece chevron is too much; one diagonal reads as X-ish at distance.)
        bridge_piece(a_mid, edge_across, BRIDGE_HEIGHT + 0.42,
                     (brace_len / 2, 0.04, 0.04),
                     f"Brace_{side}_{j}", "wood")

# Approach dirt mounds at each end of the bridge
for end_sign in (-1, 1):
    end_along = end_sign * (BRIDGE_LEN / 2 + 0.4)
    world_x = BRIDGE_X + ax * end_along
    world_z = BRIDGE_Z + az * end_along
    add_ico(loc=B(world_x, 0.2, world_z), radius=1.0,
            name=f"Bridge_Approach_{end_sign}", mat_name="dirt", subdiv=1,
            scale=(1.3, 0.4, 1.3))

# ─────────────────────────────────────────────
# ROCKS scattered around the river & path edges
# ─────────────────────────────────────────────
for i in range(20):
    x = random.uniform(-50, 50)
    z = random.uniform(-100, 15)
    if path_dist(x, z) < 4: continue
    if z < -90: continue
    r = random.uniform(0.25, 0.55)
    add_ico(loc=B(x, r * 0.4, z), radius=r, name=f"Rock_{i}", mat_name="rock", subdiv=1)

# ─────────────────────────────────────────────
# CAMERA — for preview only (we won't export it)
# ─────────────────────────────────────────────
bpy.ops.object.camera_add(location=(40, -30, 35))
cam = bpy.context.object
cam.rotation_euler = (math.radians(60), 0, math.radians(135))
scene.camera = cam

# ─────────────────────────────────────────────
# EXPORT
# ─────────────────────────────────────────────
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "assets", "blender")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.abspath(os.path.join(out_dir, "landscape.glb"))

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_cameras=False,
    export_lights=False,
)

print(f"\n✅ Exported: {out_path}")
