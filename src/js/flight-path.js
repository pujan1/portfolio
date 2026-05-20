// Flight path — POI waypoints + the Catmull-Rom curve through them.
//
// Each POI maps to one scrollable section in the page. Coordinates are
// in scene units: X = left/right, Y = altitude, Z = forward/back (the
// drone flies along -Z).
//
// `placeholders` are flat cubes that sit at each POI until the real GLB
// loads; poi-assets.js removes them as each landmark arrives.

import * as THREE from 'three';
import { scene } from './scene.js';

export const POIS = [
    { id: 'intro',       pos: new THREE.Vector3(  0,   1.2,   0), color: 0xe6c86e },
    { id: 'about',       pos: new THREE.Vector3( -8,   5,   -14), color: 0xc06650,
                         asset: 'cabin.glb',      target: 5.5, rotY: -25 },
    { id: 'photography', pos: new THREE.Vector3(  6,   9,   -28), color: 0x6c9bd9,
                         asset: 'camera.glb',     target: 3.0, rotY: 200 },
    { id: 'music',       pos: new THREE.Vector3( -7,   4,   -42), color: 0xe39860,
                         asset: 'guitar.glb',     target: 3.0, rotY: 30 },
    { id: 'games',       pos: new THREE.Vector3(  9,   6,   -56), color: 0xb56bd6,
                         asset: 'game.glb',       target: 5.0, rotY: -40 },
    { id: 'drone',       pos: new THREE.Vector3( -3,   3,   -70), color: 0xd96c6c,
                         asset: 'lighthouse.glb', target: 6.5, rotY: 15 },
    { id: 'contact',     pos: new THREE.Vector3(  4,   1.5, -82), color: 0xf5f3ee,
                         asset: 'landing.glb',    target: 3.5, rotY: 0 },
];

// Tension 0.4 keeps the curve from overshooting at sharp waypoints.
export const flightCurve = new THREE.CatmullRomCurve3(
    POIS.map(p => p.pos.clone()),
    false,
    'catmullrom',
    0.4,
);

// Dev-only path visualization. Set false to hide during reviews — the
// faint white line shows the drone's exact route through the diorama.
const SHOW_PATH = true;
if (SHOW_PATH) {
    const pts  = flightCurve.getPoints(200);
    const geo  = new THREE.BufferGeometry().setFromPoints(pts);
    const mat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    scene.add(new THREE.Line(geo, mat));
}

// One placeholder cube per non-intro POI. Tracked by id so poi-assets.js
// can swap each one out individually when its real model loads.
export const placeholders = new Map();
for (const poi of POIS.slice(1)) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.2, 2.2),
        new THREE.MeshStandardMaterial({ color: poi.color, flatShading: true, roughness: 0.85 }),
    );
    cube.position.set(poi.pos.x, 0.5, poi.pos.z);
    cube.castShadow    = true;
    cube.receiveShadow = true;
    cube.userData.poiId = poi.id;
    scene.add(cube);
    placeholders.set(poi.id, cube);
}
