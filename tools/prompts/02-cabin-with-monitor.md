# 02 — Cabin with Glowing Monitor

**Role**: The "About / Work" landmark. The drone flies past it; the warm glow from inside represents your engineering work.

**Scale reference**: Roughly 4× the drone in width. A small wood cabin you could fit inside.

**Drop-in filename**: `cabin.glb`

---

## Nano Banana prompt

Copy-paste this:

```
A stylized low-poly tiny wooden cabin, isometric 3/4 view, single object
centered on a plain pastel-cream background (#f4ecd8).

The cabin has soft chamfered edges, a peaked dark-terracotta roof with
visible tile or shingle pattern as gentle facets, warm honey-brown wood
plank walls, a small front door, and one large square window glowing warm
amber/orange from within (a hidden monitor inside). A small stone chimney
on one side.

Matte materials, no metallic specular highlights. Soft top-lighting with
subtle ground shadow.

Pastel palette: warm honey-brown wood, dark terracotta roof, soft cream
window frames, glowing amber window light. Kawaii diorama / Studio Ghibli
aesthetic. No text, no labels, no UI, no background scenery.
```

---

## Hunyuan3D notes

- The glowing window should ideally come through as **vertex color or emissive material**. If it just becomes flat yellow geometry, that's fine — I'll add a glow effect in three.js via an emissive material override.
- **Don't include trees or bushes** around the cabin in the image. I place those separately in the scene.

---

## What "good" looks like

- Cabin reads as "small forest cabin" not "house"
- Window is clearly glowing (brighter than the rest)
- Roof has visible facets (low-poly tile feel)
- Chimney is present but subtle
