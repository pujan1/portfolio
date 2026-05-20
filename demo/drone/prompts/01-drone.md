# 01 — Drone (HERO ASSET)

**Role**: The thing you're piloting. On screen during all chase-cam phases. Most-seen asset in the entire portfolio. Worth iterating on multiple times until it looks right.

**Scale reference**: Baseline — every other asset is sized relative to this. Roughly 30cm across (motor to motor) in scene-scale.

**Drop-in filename**: `drone.glb`

---

## Nano Banana prompt

Copy-paste this:

```
A stylized low-poly quadcopter drone, isometric 3/4 view, single object
centered on a plain pastel-cream background (#f4ecd8).

The drone has a chunky cute body, soft chamfered edges (not razor-sharp),
four arms in an X-formation each ending in a motor with a propeller, and
a small camera gimbal underneath. Matte materials, no metallic specular
highlights.

Color: matte ivory-white body, warm yellow accent stripe along the top,
matte charcoal-black motors and gimbal, very pale grey propellers.

Soft top-lighting with a subtle round shadow on the ground beneath the drone.
Kawaii diorama / Studio Ghibli aesthetic. No text, no labels, no UI elements,
no background scenery.
```

---

## Hunyuan3D notes

- **Keep propellers as separate parts if possible** — I'll spin them in three.js. If Hunyuan3D fuses them into the body, that's fine, the placeholder rotors will keep spinning and your drone will just look static (still acceptable).
- **Watch for the gimbal getting fused into the body** — if it does, regenerate the source image with stronger contrast between the gimbal and the underside.
- **Texture mode**: ON. The yellow stripe needs to render as color, not vertex-painted faces.

---

## What "good" looks like

- Drone is clearly a quadcopter (4 distinct arms with rotors)
- Body feels chunky/cute, not aggressive/military
- Yellow stripe is visible from above and slightly from the front
- Gimbal is a clear separate bulge underneath
- No baked-in shadows on the drone itself (only the soft ground shadow)
