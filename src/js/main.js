// Entry point. Wires together the modules and runs the animate loop.
//
// Module imports order matters only in that side-effect modules (drone,
// landscape, poi-assets, ui) need to be brought in for their kickoff
// code to run. Pure-utility modules (paths, loader, materials) are only
// imported where used.

import * as THREE from 'three';

import { renderer, scene, camera } from './scene.js';
import { flightCurve }             from './flight-path.js';
import { tickMaterials }           from './materials.js';
import { drone, rotors }           from './drone.js';
import { updateCamera }            from './camera-rig.js';
import { updateHud }               from './hud.js';
import { getScrollProgress,
         getPanelCompositionBias } from './ui.js';

import './landscape.js';     // side-effect: starts landscape + vegetation loads
import './poi-assets.js';    // side-effect: starts POI asset loads

const clock     = new THREE.Clock();
const _tmpPos     = new THREE.Vector3();
const _tmpTangent = new THREE.Vector3();

// Smoothed scroll progress — raw scroll feels jittery when bridging the
// momentum gap between trackpad and curve interpolation. dt-scaled lerp
// keeps the smoothing frame-rate independent.
let smoothedProgress = 0;

function animate() {
    requestAnimationFrame(animate);

    // IMPORTANT: getDelta() first. getElapsedTime() would consume the
    // internal accumulator and return stale dt next frame.
    const dt = clock.getDelta();
    const t  = clock.elapsedTime;

    smoothedProgress += (getScrollProgress() - smoothedProgress) * Math.min(1, dt * 6);
    const p = smoothedProgress;

    // Spin all rotors (count varies — placeholder has 4 grouped rotors,
    // GLB build has 4 disc overlays; the array is rebuilt either way).
    for (const r of rotors) r.rotation.y += dt * 40;

    tickMaterials(dt);

    /* ── Drone position + orientation along the curve ── */
    flightCurve.getPointAt(p, _tmpPos);
    drone.position.copy(_tmpPos);
    drone.position.y += Math.sin(t * 2.2) * 0.08;   // alive-bob

    flightCurve.getTangentAt(Math.min(1, p + 0.001), _tmpTangent);

    // Yaw via atan2 keeps local up axis preserved — no surprise roll/pitch.
    drone.rotation.y = Math.atan2(_tmpTangent.x, _tmpTangent.z) + Math.PI;
    // Mild pitch & bank to suggest physical inertia in turns/climbs.
    drone.rotation.x = -_tmpTangent.y * 0.4;
    drone.rotation.z = -_tmpTangent.x * 0.3;

    updateCamera(drone.position, _tmpTangent, t, dt, getPanelCompositionBias());
    updateHud(p, drone.position.y);

    renderer.render(scene, camera);
}

animate();

console.log('[drone-demo] scene initialized');
