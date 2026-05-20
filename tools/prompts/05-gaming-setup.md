# 05 — Gaming Setup / Mini Stadium

**Role**: The "Competitive Games" landmark. A tiny esports-flavored installation — small stadium ring with neon-lit panels, or a desk with monitor + headset + glowing keyboard. Choose whichever you prefer; prompt below covers the stadium version since it's more visually distinct from the cabin.

**Scale reference**: Roughly 3× the drone in width. Compact but readable from the air.

**Drop-in filename**: `gaming-setup.glb`

---

## Nano Banana prompt (Stadium variant — recommended)

Copy-paste this:

```
A stylized low-poly tiny circular esports stadium, isometric 3/4 view,
single object centered on a plain pastel-cream background (#f4ecd8).

The stadium is a small circular bowl, about the size of a fire-pit, with
soft chamfered edges. Tiered seating in matte charcoal rises around the
outside. The interior floor glows with a soft neon panel — split into two
halves, one cool blue and one warm magenta, suggesting opposing teams.
A pair of tall slender light poles flank the bowl, each topped with a
tiny stadium light.

Soft chamfered edges throughout, no razor-sharp lines. Matte materials,
no metallic specular highlights. The neon glow should read as gentle
emissive color, not bright flares.

Pastel palette: matte charcoal seating, soft cool-blue and dusty-magenta
neon floor, warm cream light-pole housings. Soft top-lighting with subtle
ground shadow. Kawaii diorama / Studio Ghibli aesthetic. No text, no
labels, no UI, no background scenery.
```

---

## Nano Banana prompt (Desk variant — alternative)

If you'd rather have a desk setup than a stadium:

```
A stylized low-poly gaming desk setup, isometric 3/4 view, single object
centered on a plain pastel-cream background (#f4ecd8).

A small wooden desk with a chunky cute monitor displaying a soft cyan
glow, a low-profile keyboard with subtle pastel-rainbow underglow, a
gaming mouse, and a pair of over-ear headphones resting beside it. A
small swivel chair with charcoal cushion sits at the desk.

Soft chamfered edges, matte materials, no metallic specular. Pastel palette:
warm honey-brown desk, matte charcoal monitor and chair, cream cream
keyboard with rainbow underglow, soft cyan screen glow. Soft top-lighting
with subtle ground shadow. Kawaii diorama / Studio Ghibli aesthetic. No
text, no labels, no UI, no background scenery.
```

---

## Hunyuan3D notes

- **The neon / glow elements** will probably come out as plain matte color from Hunyuan3D. I'll add emissive material override in three.js so they actually glow on the page.
- **Pick ONE variant** and generate that — don't mix.

---

## What "good" looks like

- Reads as "games" from a drone flyby (not "kitchen", not "desk")
- The glow elements are clearly the visual focus
- Compact enough to feel like a single landmark, not a whole zone
