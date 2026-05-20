# 04 — Acoustic Guitar (Leaning on Log)

**Role**: The "Music" landmark. Sits in a campfire clearing, propped against a log. Implies someone just stepped away mid-strum.

**Scale reference**: Roughly 2× the drone in length. Tall when standing, lying when leaning.

**Drop-in filename**: `guitar.glb`

---

## Nano Banana prompt

Copy-paste this:

```
A stylized low-poly acoustic guitar leaning against a small wooden log,
3/4 view, single composition centered on a plain pastel-cream background
(#f4ecd8).

The guitar has a chunky cute body shape (classic acoustic dreadnought
silhouette but softened), warm honey-wood color, a circular sound-hole,
six visible strings as thin parallel lines, and a slender neck with a
flat headstock. Soft chamfered edges throughout, no razor-sharp lines.

The log it leans against is a short, low cylinder of darker brown wood
with visible bark texture as gentle facets.

Matte materials, no glossy varnish, no metallic specular highlights.

Pastel palette: warm honey-wood guitar body, soft cream sound-hole rim,
darker brown log, pale grey strings. Soft top-lighting with subtle ground
shadow. Kawaii diorama / Studio Ghibli aesthetic. No text, no labels,
no UI, no background scenery.
```

---

## Hunyuan3D notes

- **Strings are essentially invisible at scene-scale** (we're flying overhead). Don't worry if Hunyuan3D loses them entirely. Body shape and the sound-hole are what matter.
- **The log can be its own separate asset if you want flexibility** — split this into `guitar.glb` and `log.glb`. But honestly, fusing them together is fine for our purposes.
- **Headstock should remain clearly separate from the neck** in the source image.

---

## What "good" looks like

- Guitar reads as "acoustic" not "electric" (round body, big sound-hole)
- Posture suggests it was placed there casually
- Wood tone is warm/inviting, not orange or red
- Log is small enough to look like a piece of firewood, not a tree trunk
