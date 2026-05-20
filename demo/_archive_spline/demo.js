/* ──────────────────────────────────────────────
   Spline demo — capability detection + fallback
   ────────────────────────────────────────────── */

const TIMEOUT_MS = 8000;
const viewer   = document.getElementById('spline-viewer');
const bg       = document.getElementById('spline-bg');
const fallback = document.getElementById('spline-fallback');

function showFallback(reason) {
    console.info('[spline-demo] showing fallback:', reason);
    bg.style.display = 'none';
    fallback.style.display = 'block';
}

/* ── 1. Skip on low-end or mobile devices ── */
function isCapable() {
    if (window.innerWidth < 768) return false;
    if ((navigator.hardwareConcurrency || 4) <= 2) return false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
}

if (!isCapable()) {
    showFallback('device not capable');
} else {
    /* ── 2. Timeout fallback — show static bg if Spline hasn't loaded ── */
    const timeoutId = setTimeout(() => {
        if (!viewer || !viewer.shadowRoot) showFallback('load timeout');
    }, TIMEOUT_MS);

    /* The web component dispatches `load` when the scene is ready */
    viewer.addEventListener('load', () => clearTimeout(timeoutId));
    viewer.addEventListener('error', (e) => {
        clearTimeout(timeoutId);
        showFallback('viewer error: ' + (e?.detail || 'unknown'));
    });
}
