// Heads-up display — telemetry overlay in the four screen corners.
//
// Numbers are theatrical, not literal: battery drains 87→52 linearly
// with progress, speed climbs from 8 to 20 m/s, GPS drifts west by
// 0.06° over the flight. Mode label flips by progress threshold.

const hud = {
    bat:  document.getElementById('hud-bat'),
    alt:  document.getElementById('hud-alt'),
    spd:  document.getElementById('hud-spd'),
    gps:  document.getElementById('hud-gps'),
    mode: document.getElementById('hud-mode'),
    prog: document.getElementById('hud-progress'),
};

export function updateHud(progress, droneY) {
    const p = progress;
    if (hud.bat)  hud.bat.textContent  = Math.round(87 - p * 35);
    // Altitude is exaggerated (×12) so the number on screen looks dramatic
    // — scene units are tiny relative to a "real" drone's altitude.
    if (hud.alt)  hud.alt.textContent  = String(Math.round(droneY * 12)).padStart(3, '0');
    if (hud.spd)  hud.spd.textContent  = String(Math.round(8 + p * 12)).padStart(2, '0');
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
