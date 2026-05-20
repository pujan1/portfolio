// POI landmarks — load one GLB per non-intro POI, fit it to a target
// size, plant it on the ground at the POI's (x, z), and remove the
// stand-in placeholder cube that flight-path.js created.
//
// All loads kick off in parallel; failures fall back to the placeholder
// silently so a single missing model can't block the scene.

import * as THREE from 'three';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { scene } from './scene.js';
import { POIS, placeholders } from './flight-path.js';
import { modelUrl } from './paths.js';
import { markLoaded } from './loader.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

function loadPoi(poi) {
    if (!poi.asset) return;    // intro POI has no landmark
    const url   = modelUrl(poi.asset);
    const label = poi.asset.replace('.glb', '').replace(/^./, c => c.toUpperCase());

    loader.load(url, (gltf) => {
        const root = gltf.scene;

        // Auto-fit longest dimension to the POI-specified target size.
        const box  = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const longest = Math.max(size.x, size.y, size.z);
        const target  = poi.target ?? 4.0;
        if (longest > 0) root.scale.setScalar(target / longest);

        // Re-bound after scaling, then plant on the ground:
        //   bbox center → (poi.x, _, poi.z)
        //   bbox min.y  → y = 0
        box.setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;
        root.position.x += poi.pos.x;
        root.position.z += poi.pos.z;

        if (poi.rotY) root.rotation.y = poi.rotY * Math.PI / 180;

        root.traverse((node) => {
            if (node.isMesh) {
                node.castShadow    = true;
                node.receiveShadow = true;
            }
        });

        scene.add(root);

        // Dispose of the placeholder cube to free GPU memory.
        const cube = placeholders.get(poi.id);
        if (cube) {
            scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
            placeholders.delete(poi.id);
        }
        console.log(`[poi] ${poi.id} → ${poi.asset} loaded`);
        markLoaded(`${label} online`);
    },
    undefined,
    (err) => {
        console.warn(`[poi] failed to load ${url} — placeholder cube stays`, err);
        markLoaded(`${label} (placeholder)`);
    });
}

// Kick off every POI load on import. Order doesn't matter; the loader
// resolves each independently and the animate loop doesn't depend on
// landmarks being present.
for (const poi of POIS) loadPoi(poi);
