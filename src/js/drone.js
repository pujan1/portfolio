// Drone — placeholder built from primitives, replaced when the real GLB
// finishes loading. Either way, four `rotors` groups are exposed so the
// animate loop can spin them every frame.

import * as THREE from 'three';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { scene } from './scene.js';
import { modelUrl } from './paths.js';
import { markLoaded } from './loader.js';

export const drone = new THREE.Group();
drone.name = 'Drone';
drone.position.set(0, 3, 0);

export const rotors = [];

/* ── Placeholder geometry — visible until the real model loads ── */
const bodyMat   = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, flatShading: true, roughness: 0.6 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0xe6c86e, flatShading: true, roughness: 0.7 });
const darkMat   = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, flatShading: true, roughness: 0.5 });

const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), bodyMat);
body.castShadow = true;
drone.add(body);

const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.3), accentMat);
stripe.position.y = 0.12;
drone.add(stripe);

const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), darkMat);
gimbal.position.set(0, -0.18, 0.18);
gimbal.castShadow = true;
drone.add(gimbal);

const armOffset = 0.55;
const armPositions = [
    [ armOffset, 0,  armOffset],
    [-armOffset, 0,  armOffset],
    [ armOffset, 0, -armOffset],
    [-armOffset, 0, -armOffset],
];
for (const [x, , z] of armPositions) {
    const armLength = Math.hypot(x, z);
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, armLength, 6);
    armGeo.translate(0, armLength / 2, 0);
    const arm = new THREE.Mesh(armGeo, bodyMat);
    arm.lookAt(x, 0, z);
    arm.rotateX(Math.PI / 2);
    arm.castShadow = true;
    drone.add(arm);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), darkMat);
    motor.position.set(x, 0.07, z);
    motor.castShadow = true;
    drone.add(motor);

    const rotor = new THREE.Group();
    rotor.position.set(x, 0.15, z);
    const bladeGeo = new THREE.BoxGeometry(0.55, 0.015, 0.06);
    const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.55,
        flatShading: true,
    });
    const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    rotor.add(blade1, blade2);
    drone.add(rotor);
    rotors.push(rotor);
}

scene.add(drone);

/* ─────────────────────────────────────────────
   Replace the placeholder with the authored Hunyuan3D GLB.
   The source model points sideways relative to the flight path, so we
   pre-rotate by -90° on yaw before letting the animate loop set yaw
   from the curve tangent.
   ───────────────────────────────────────────── */
const DRONE_MODEL_YAW = -Math.PI / 2;
const TARGET_SIZE = 1.4;

function attachLoaded(gltf) {
    console.log('[drone] real model loaded, replacing placeholder');
    while (drone.children.length) drone.remove(drone.children[0]);

    const root = gltf.scene;

    // Auto-fit: scale so the longest dimension equals TARGET_SIZE in
    // scene units. Authored models come at arbitrary export scales.
    const box  = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.y, size.z);
    if (longest > 0) root.scale.setScalar(TARGET_SIZE / longest);

    // Re-center: drone group's origin = model's bbox center. Without this,
    // the chase camera framing depends on how the model was authored.
    box.setFromObject(root);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center);
    root.rotation.y += DRONE_MODEL_YAW;

    root.traverse((node) => {
        if (node.isMesh) {
            node.castShadow    = true;
            node.receiveShadow = false;
        }
    });

    drone.add(root);

    // Re-attach four spinning rotor overlays. These read as motion blur
    // regardless of whether the source model includes its own propellers.
    rotors.length = 0;
    const rotorPositions = [
        [ 0.55, 0.15,  0.55],
        [-0.55, 0.15,  0.55],
        [ 0.55, 0.15, -0.55],
        [-0.55, 0.15, -0.55],
    ];
    const discMat = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
    });
    for (const [x, y, z] of rotorPositions) {
        const g = new THREE.Group();
        g.position.set(x, y, z);
        // Two crossed thin boxes — once spinning, they blur into a disc.
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.015, 0.06), discMat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.55), discMat));
        drone.add(g);
        rotors.push(g);
    }
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

loader.load(
    modelUrl('drone.glb'),
    (gltf) => { attachLoaded(gltf); markLoaded('Drone armed'); },
    undefined,
    () => {
        console.info('[drone] no real model — using placeholder primitives');
        markLoaded('Drone (placeholder)');
    },
);
