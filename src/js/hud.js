// Heads-up display — telemetry overlay in the screen corners.
// GPS drifts west over the flight; mode label flips by progress threshold.

const hud = {
    gps:  document.getElementById('hud-gps'),
    mode: document.getElementById('hud-mode'),
    prog: document.getElementById('hud-progress'),
};

export function updateHud(progress, _droneY) {
    const p = progress;
    if (hud.prog) hud.prog.textContent = Math.round(p * 100);
    if (hud.gps) {
        const lat = (37.68 - p * 0.04).toFixed(2);
        const lon = (121.77 + p * 0.06).toFixed(2);
        hud.gps.textContent = `${lat}°N ${lon}°W`;
    }
    if (hud.mode) {
        hud.mode.textContent =
            p < 0.05 ? 'TAKEOFF' :
            p > 0.99 ? 'MISSION COMPLETE' :
            p > 0.95 ? 'LANDING' :
            'CRUISE';
    }
}
