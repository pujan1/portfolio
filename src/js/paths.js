// Resolve a GLB filename to an absolute URL relative to /assets/models/.
// Using import.meta.url keeps this robust regardless of where the site is
// deployed (e.g. GitHub Pages sub-paths) — no hard-coded leading slashes.
export const modelUrl = (filename) =>
    new URL(`../../assets/models/${filename}`, import.meta.url).href;
