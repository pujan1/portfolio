# Pujan Parikh — Portfolio

A scroll-driven drone flythrough portfolio site, built in vanilla
JavaScript on top of Three.js. Zero build step, deployed straight from
`main` to GitHub Pages.

Live URL: [pujan.tech](https://pujan.tech)

## Layout

```
portfolio/
├── index.html              # Single entry; loads src/styles/main.css + src/js/main.js
├── assets/
│   ├── fonts/GrowYear.ttf
│   ├── photos/photo-1..7.jpg
│   ├── models/*.glb        # Runtime 3D — drone, landscape, vegetation, POI landmarks
│   └── resume.pdf
├── src/
│   ├── styles/             # Split by concern (loader, hud, sections, …)
│   └── js/                 # Three.js modules — see src/js/main.js for the import map
└── tools/
    ├── blender/            # Blender scripts + .blend files for rebuilding the GLBs
    └── prompts/            # Hunyuan3D image-to-3D prompts for the POI landmarks
```

The page is a single Three.js scene rendered into a fixed-position
canvas; HTML POI sections sit on top of the canvas and drive the
drone's curve parameter via scroll position. See [src/js/main.js](src/js/main.js)
for the animate loop.

## Local development

ES modules don't load from `file://` and the GLB loader uses
`fetch()`, so you need an HTTP server:

```bash
python3 -m http.server 8080
# or:  npx serve .
```

Then open `http://localhost:8080/`.

Append `?debugOverview=1` to the URL to swap the chase cam for a slow
overhead orbit — useful when iterating on the landscape.

## Updating site content

The work / education / photography / etc. content is HTML inside
[index.html](index.html). The POI list (positions + which landmark goes
where) is in [src/js/flight-path.js](src/js/flight-path.js) — keep the
section order in HTML aligned with the `POIS` array.

## Rebuilding 3D assets

The runtime GLBs in `assets/models/` are checked in. Regenerating any
of them is a Blender pipeline — see [tools/README.md](tools/README.md).

## Deployment

GitHub Pages serves `/` on `main`. Pushing to `main` is the deploy —
there is no CI step. `.nojekyll` disables Jekyll. `CNAME` pins the
custom domain.
