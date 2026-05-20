# 06 — Drone Landing Pad

**Role**: The "Drone" landmark. Meta — the thing you're piloting circles its own landing pad. Also serves as the final touchdown spot at the end of the flight.

**Scale reference**: Roughly 2.5× the drone in diameter. Just big enough that the drone can plausibly land on it.

**Drop-in filename**: `landing-pad.glb`

---

## Nano Banana prompt

Copy-paste this:

```
A stylized low-poly drone landing pad / helipad, top-down 3/4 view, single
object centered on a plain pastel-cream background (#f4ecd8).

A short circular concrete platform raised slightly off the ground, with
a large painted "H" symbol on top in soft cream-yellow. A subtle ring of
matte-charcoal markings surrounds the H. Four small recessed lights are
spaced evenly around the rim, glowing faint warm amber.

Soft chamfered edges, matte materials, no metallic specular highlights.
The H mark should appear as painted geometry, not a texture decal — a
slight raised relief on the pad surface.

Pastel palette: soft warm-grey concrete, cream-yellow H mark, matte
charcoal ring markings, gentle amber rim lights. Soft top-lighting with
subtle ground shadow. Kawaii diorama / Studio Ghibli aesthetic. No text,
no labels (the "H" itself is fine — it reads as a shape, not text), no UI,
no background scenery.
```

---

## Hunyuan3D notes

- **The "H" is the one exception to the no-text rule** — Hunyuan3D handles single bold letters as raised geometry reasonably well. If it comes out warped, regenerate the image with the H drawn as a deliberate shape (two vertical bars + horizontal crossbar).
- **The amber rim lights** will probably come out matte. I'll add an emissive material in three.js.

---

## What "good" looks like

- Reads instantly as "helipad" from above
- The H is clearly readable, raised slightly off the surface
- Edge of the pad is chamfered, not a sharp cylinder
- Surface is plain — no extra clutter
