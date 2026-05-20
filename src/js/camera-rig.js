// Chase-cam rig.
//
// Two modes:
//   • Default — sits behind and slightly above the drone, looks ahead
//     along the curve, and laterally biases the look target so the
//     active section's text panel doesn't sit on top of the landmark.
//   • Debug overview — engaged via ?debugOverview=1 in the URL. Orbits
//     high above the diorama for inspection. Pushes fog farther so the
//     back mountains stay readable.

import * as THREE from 'three';
import { camera, scene } from './scene.js';

const _tmpCamPos      = new THREE.Vector3();
const _tmpCamTarget   = new THREE.Vector3();
const _tmpCameraRight = new THREE.Vector3();
const WORLD_UP        = new THREE.Vector3(0, 1, 0);

const debugOverview = new URLSearchParams(window.location.search).get('debugOverview') === '1';
if (debugOverview) {
    scene.fog.far = 250;
}

// Smoothed lateral offset so the panel-shift transition feels gentle
// rather than snapping when the active section changes.
let lateralBias = 0;

export function updateCamera(dronePos, tangent, time, dt, targetBias) {
    if (debugOverview) {
        const ang = time * 0.12;
        camera.position.set(Math.cos(ang) * 50, 35, Math.sin(ang) * 50 - 50);
        camera.lookAt(0, 0, -55);
        return;
    }

    // Chase position: trail the drone by `behindDist` along its flight
    // direction, with altitude rising slightly as the drone climbs.
    const behindDist = 5.5;
    const aboveDist  = 1.8 + dronePos.y * 0.08;
    _tmpCamPos.copy(dronePos)
        .add(tangent.clone().multiplyScalar(-behindDist))
        .add(new THREE.Vector3(0, aboveDist, 0));
    // Lerp toward target — instant snap looks robotic at high scroll speed.
    camera.position.lerp(_tmpCamPos, Math.min(1, dt * 3));

    // Look target sits ahead of the drone with a small upward bias so
    // distant mountains stay in frame instead of being clipped by the
    // bottom of the viewport.
    _tmpCamTarget.copy(dronePos).add(tangent.clone().multiplyScalar(6));
    _tmpCamTarget.y += 0.4;

    // Panel composition bias — push the look target left or right so the
    // section's text doesn't overlap the landmark. Smoothed.
    lateralBias += (targetBias - lateralBias) * Math.min(1, dt * 4);
    _tmpCameraRight.crossVectors(tangent, WORLD_UP).normalize();
    _tmpCamTarget.addScaledVector(_tmpCameraRight, lateralBias);

    camera.lookAt(_tmpCamTarget);
}
