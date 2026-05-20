# Spline Demo

Self-contained sandbox for the upcoming navigation revamp. Nothing here is wired into the main portfolio yet.

## To run

From the repo root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/demo/
```

(`fetch` isn't used, so `file://` would also work — but keeping it on a server matches how GitHub Pages will serve it.)

## Plug in your scene

1. Open the scene in Spline → **Export → Code Export**
2. Click **Promote to Production**
3. Copy the `https://prod.spline.design/.../scene.splinecode` URL
4. Paste it into `index.html` where it says `REPLACE_ME`

Before exporting, in Play Settings:
- **Hide Background** ON
- **Hide Spline Logo** ON (paid plan only)
- **Geometry Quality** → Performance
- Disable **Page Scroll / Zoom / Pan** unless you actually want them

## What's in here

- `index.html` — `<spline-viewer>` web component embed, no build step
- `styles.css` — full-page fixed background, content on top, fallback styles
- `demo.js` — capability check (skips on mobile / low-end / no WebGL) + 8s load timeout → static fallback

## Why a fallback layer?

Spline's CDN is flaky and WebGL is GPU-heavy. The fallback div mimics the scene's mood with a gradient so the page still looks intentional when:
- the device can't run WebGL well
- the `prod.spline.design` request stalls
- the user is on mobile (currently skipped entirely)
