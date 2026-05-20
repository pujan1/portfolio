# Asset Prompts — Drone Flythrough Scene

Your pipeline:

```
text prompt → Nano Banana (image) → Hunyuan3D (image-to-3D) → .glb
                                                                ↓
                                       drop into  demo/drone/assets/incoming/<name>.glb
                                                                ↓
                                                three.js auto-loads it
```

Each `NN-<name>.md` file in this folder is one asset, containing:

- **Role** — where it appears in the scene
- **Nano Banana prompt** — copy-pasteable, generates the source image
- **Hunyuan3D notes** — any tweaks for the image-to-3D step
- **Drop-in filename** — what to name the final `.glb`
- **Scale reference** — how big it should be relative to the drone

---

## House style (applied to every asset)

Every Nano Banana prompt in this folder already includes these style anchors. Don't
need to add them — but if you regenerate or experiment, keep these constants:

| Anchor | Reason |
|---|---|
| Low-poly, soft chamfered edges, NOT razor-sharp | Matches camping-diorama reference |
| Matte materials, no metallic specular | Avoids harsh highlights in three.js |
| Pastel palette: sage greens, ivory, warm yellow, terracotta, soft blue | Visual coherence |
| 3/4 isometric view, single object centered | Hunyuan3D segments cleanly |
| Plain pastel-cream background `#f4ecd8` | Easy background removal |
| Soft top lighting, subtle ground shadow only | Avoids baked-in harsh shadows |
| Kawaii diorama / Studio Ghibli aesthetic | Visual style anchor |
| **No text, no labels, no UI elements** | Hunyuan3D will model text as geometry — bad |

---

## Asset checklist

Priority order — generate top-down. The drone is the only blocker for visible
progress; the rest can be filled in incrementally.

| # | Asset | Status | File when done |
|---|---|---|---|
| 01 | Drone | NEEDED FIRST | `drone.glb` |
| 02 | Cabin with glowing monitor | | `cabin.glb` |
| 03 | Camera on tripod | | `camera-tripod.glb` |
| 04 | Acoustic guitar | | `guitar.glb` |
| 05 | Gaming setup / mini stadium | | `gaming-setup.glb` |
| 06 | Drone landing pad (helipad) | | `landing-pad.glb` |
| 07 | Lighthouse | | `lighthouse.glb` |

---

## Tips for Nano Banana

1. **Iterate on the image before sending to Hunyuan3D.** A clean source image with
   good silhouette = a clean 3D model. Garbage in, garbage out.
2. **Aim for 3/4 or isometric view.** Pure front/side views give Hunyuan3D less
   depth information to work with.
3. **Plain pastel-cream background.** Pure white sometimes confuses the segmentation;
   `#f4ecd8` works well.
4. **One subject, centered, no clutter.** No props next to the main object.
5. **If the model comes out fused/blobby**, regenerate the image with sharper edge
   definition or more contrast between parts.

## Tips for Hunyuan3D

1. **Use the "high quality" mode** if your plan supports it — geometry is much better.
2. **Texture mode**: leave textures ON for now. We can strip/override in three.js
   if they clash with the procedural environment.
3. **Decimate before export** if the mesh is over ~50K triangles per asset. The
   browser will thank you.
