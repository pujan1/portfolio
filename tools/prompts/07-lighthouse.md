# 07 — Lighthouse

**Role**: The "Contact" landmark. Sits at the far end of the flight path — the drone lands near it. Symbolically: "find me here."

**Scale reference**: Roughly 4× the drone in height. The tallest single object in the scene.

**Drop-in filename**: `lighthouse.glb`

---

## Nano Banana prompt

Copy-paste this:

```
A stylized low-poly tiny lighthouse, isometric 3/4 view, single object
centered on a plain pastel-cream background (#f4ecd8).

A short cylindrical tower with classic red-and-white horizontal stripes,
sitting on a small rocky base of soft chamfered grey stones. The top of
the tower has a circular glass lantern room with a faint warm amber glow
inside. A small conical black cap sits above the lantern room, with a
tiny weather-vane on top.

Soft chamfered edges throughout, no razor-sharp lines. Matte materials,
no metallic specular highlights. The stripes should read as separate
painted bands of geometry, not a wrapped texture.

Pastel palette: warm white and dusty-red tower stripes, soft warm-grey
stone base, matte black lantern cap, gentle amber glow in the lantern
room. Soft top-lighting with subtle ground shadow. Kawaii diorama / Studio
Ghibli aesthetic. No text, no labels, no UI, no background scenery.
```

---

## Hunyuan3D notes

- **Lighthouse stripes** can come out either as separate bands of geometry or as a single tower with a wrap texture. Both work. If it's a texture, that's fine.
- **The amber lantern glow** will probably be matte. I'll add a rotating spotlight in three.js so the lighthouse beam actually sweeps across the landscape during the touchdown moment.
- **Weather-vane** is decorative — if Hunyuan3D drops it or makes it weird, no big deal.

---

## What "good" looks like

- Reads instantly as "lighthouse" from a distance
- Stripes are clean horizontal bands, not slanted
- Base feels like rocks, not a flat disc
- Proportions: tower is taller than it is wide (classic lighthouse silhouette)
