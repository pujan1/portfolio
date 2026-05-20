// Landscape + vegetation.
//
// Two separate GLBs so the Blender rebuild pipeline can regenerate the
// terrain without clobbering hand-placed vegetation:
//   landscape.glb   — hills, river, road, waterfall, peaks, bridge.
//                     Water meshes are detected by color and re-shaded.
//   vegetation.glb  — grass tufts + trees. Optional: missing is fine.
//                     Grass meshes get the breeze shader.
//
// A flat green plane sits in for the landscape until the GLB arrives,
// so the scene never shows pure background during the first frames.

import * as THREE from 'three';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { scene } from './scene.js';
import { modelUrl } from './paths.js';
import { markLoaded } from './loader.js';
import {
    WATER_SHADER,
    isWaterColor,
    grassBreezeMaterial,
    isGrassMaterial,
} from './materials.js';

/* ── Stand-in ground that gets removed once the real landscape loads ── */
const tempGround = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 160),
    new THREE.MeshStandardMaterial({ color: 0x70b06b, flatShading: true, roughness: 0.95 }),
);
tempGround.rotation.x = -Math.PI / 2;
tempGround.position.set(0, 0, -55);
tempGround.receiveShadow = true;
scene.add(tempGround);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

loader.load(modelUrl('landscape.glb'), (gltf) => {
    const land = gltf.scene;
    let waterCount = 0;
    land.traverse((node) => {
        if (!node.isMesh) return;
        node.receiveShadow = true;
        node.castShadow    = true;
        if (isWaterColor(node.material)) {
            node.material = WATER_SHADER;
            node.castShadow = false;     // water doesn't cast — looks weird
            waterCount++;
        }
    });
    scene.add(land);
    scene.remove(tempGround);
    tempGround.geometry.dispose();
    tempGround.material.dispose();
    console.log(`[landscape] loaded, ${waterCount} water meshes tagged`);
    markLoaded('Landscape ready');
}, undefined, () => markLoaded('Landscape unavailable'));

/* ── Vegetation is optional. Failing to load isn't counted as an asset. ── */
const vegLoader = new GLTFLoader();
vegLoader.setMeshoptDecoder(MeshoptDecoder);
vegLoader.load(modelUrl('vegetation.glb'), (gltf) => {
    const veg = gltf.scene;
    veg.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow    = true;
        node.receiveShadow = true;
        if (isGrassMaterial(node.material) && node.geometry?.attributes?.uv) {
            node.material = grassBreezeMaterial(node.material);
            node.castShadow = false;     // grass shadows muddy the ground
        }
    });
    scene.add(veg);
    console.log('[vegetation] loaded');
}, undefined, () => {
    console.info('[vegetation] optional vegetation.glb not found');
});
