// Three.js renderer / scene / camera / lights.
//
// Exported as module singletons — every other module imports the same
// scene + camera + renderer. Resize handling lives here too since it
// only touches these three objects.

import * as THREE from 'three';

const canvas = document.getElementById('scene-canvas');

// Mobile: phones blow their fillrate budget on high-DPR + soft shadows.
// Force DPR=1 and shrink the shadow map. `?lowfx=1` forces the same path
// on desktop for A/B testing.
const isMobile = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches
    || new URLSearchParams(window.location.search).get('lowfx') === '1';

export const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
});
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Cool pastel sky — matches the painted landscape mood. Fog reaches just
// past the back mountains (~480 units) so they fade rather than pop.
const SKY = 0x9fc8d6;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 80, 480);

// Wide FOV — distant 300-tall mountains still fit in frame.
export const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    800,
);
camera.position.set(6, 4, 8);
camera.lookAt(0, 1.5, 0);

/* ── Lighting: warm key + cool fill, leans toward cool sky ── */
scene.add(new THREE.HemisphereLight(0xbcdfee, 0x5a7a5a, 0.65));

const sun = new THREE.DirectionalLight(0xfff2cf, 1.7);
sun.position.set(10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
// Shadow camera covers the flight corridor — extending it would smear the
// shadow map across too many pixels and soften everything.
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0005;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8eb8ff, 0.7);
fill.position.set(-8, 10, -6);
scene.add(fill);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
