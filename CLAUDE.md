# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Pujan's portfolio site — a Three.js drone flythrough deployed via
GitHub Pages from the repo root. Vanilla JS modules, no build step.

## Local development

`src/js/main.js` is an ES module that pulls in `three` via importmap
and fetches GLBs over HTTP. Opening `index.html` via `file://` will
fail. Serve over HTTP:

```bash
python3 -m http.server 8080
# or:  npx serve .
```

## Deployment

GitHub Pages serves `/` on `main`. `.nojekyll` disables Jekyll
processing. `CNAME` pins the custom domain. Pushing to `main` is the
deploy — there is no CI/build pipeline.

## Architecture

`index.html` is a static shell — the `<canvas>`, HUD overlay, comm
bar, and seven `<section class="poi-section">` blocks that drive the
flight. All 3D and DOM behavior lives in `src/js/`.

### JS module graph

`src/js/main.js` is the entry. The split keeps each file focused:

| Module | Owns |
|---|---|
| `scene.js`        | renderer, scene, camera, lights, resize |
| `flight-path.js`  | POI list, Catmull-Rom curve, placeholder cubes |
| `materials.js`    | water + grass shaders + per-frame `tickMaterials(dt)` |
| `drone.js`        | placeholder drone, real-GLB swap, spinning rotors |
| `landscape.js`    | landscape + optional vegetation load, water/grass material swap |
| `poi-assets.js`   | per-POI GLB loads + placeholder swap |
| `camera-rig.js`   | chase cam + `?debugOverview=1` orbit |
| `hud.js`          | corner telemetry display |
| `ui.js`           | scroll progress, active section, entry accordion, lightbox |
| `loader.js`       | loading overlay (counts 8 critical assets) |
| `paths.js`        | `modelUrl()` — `import.meta.url`-relative to `/assets/models/` |

`main.js` runs the animate loop: it pulls scroll progress from `ui`,
positions the drone along the curve, ticks materials, calls
`updateCamera` and `updateHud`, and renders. Side-effect-only modules
(`landscape`, `poi-assets`, `ui`) start their work at import time.

### Adding/moving POIs

The POI order is the source of truth in two places that **must stay in
sync**:

1. `POIS` array in `src/js/flight-path.js` — drives curve geometry and
   placeholder/landmark placement.
2. `<section class="poi-section">` order in `index.html` — drives the
   curve parameter via scroll height (each section is 100vh).

The Nth section corresponds to `POIS[N]`. The first POI (`intro`) has
no landmark asset; every subsequent POI has `asset`, `target`, and
`rotY` fields.

### Element ID contract

`src/js/` modules find DOM nodes by hard-coded IDs in `index.html`:

| Module | IDs it reads |
|---|---|
| `scene.js`   | `#scene-canvas` |
| `loader.js`  | `#loading-overlay`, `#loader-bar-fill`, `#loader-status`, `#loader-detail` |
| `hud.js`     | `#hud-bat`, `#hud-alt`, `#hud-spd`, `#hud-gps`, `#hud-mode`, `#hud-progress` |
| `ui.js`      | `.poi-section`, `.entry-toggle`, `.photo-grid img`, `#lightbox`, `#lightbox-img` |

### CSS

`src/styles/main.css` is the entry — it `@import`s the rest in order:
`loader`, `hud`, `sections`, `comm-bar`, `components`, `mobile`. The
font is loaded from `assets/fonts/GrowYear.ttf` via `@font-face`.

## Rebuilding 3D assets

The Blender pipeline lives in `tools/`. Outputs land in
`tools/blender/build/` (gitignored), and the `compress_*.sh` scripts
write the runtime-ready compressed GLBs to `assets/models/`. See
[tools/README.md](tools/README.md). You normally don't touch any of
this unless you're iterating on the diorama itself.

## Conventions

- All renderers build HTML strings via template literals — **do not
  pipe user input through `innerHTML`** without escaping.
- Don't add inline `<style>` or CSS-in-JS — every rule belongs in
  `src/styles/`.
- Keep `POIS` indices and `<section>` order locked together.
- The `?debugOverview=1` query string is the supported way to inspect
  the diorama from above without editing camera code.
