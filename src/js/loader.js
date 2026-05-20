// Loading overlay.
//
// Eight things get tracked: 1 landscape + 1 drone + 6 POI landmark assets.
// Vegetation is intentionally not counted — it's an optional overlay.
// When everything reports in, fade the overlay away with a short delay so
// the user actually reads "Ready for takeoff" before it disappears.

const TOTAL_ASSETS = 8;
let loadedAssets = 0;

const bar     = document.getElementById('loader-bar-fill');
const status  = document.getElementById('loader-status');
const detail  = document.getElementById('loader-detail');
const overlay = document.getElementById('loading-overlay');

export function markLoaded(label) {
    loadedAssets++;
    const pct = (loadedAssets / TOTAL_ASSETS) * 100;
    if (bar)    bar.style.width = `${pct}%`;
    if (status) status.textContent = label || 'Loading…';
    if (detail) detail.textContent = `${loadedAssets} / ${TOTAL_ASSETS} assets loaded`;

    if (loadedAssets >= TOTAL_ASSETS) {
        if (status) status.textContent = 'Ready for takeoff';
        setTimeout(() => overlay?.classList.add('hidden'), 700);
    }
}
