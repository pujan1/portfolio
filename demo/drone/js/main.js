/**
 * Drone flythrough — main entry.
 * First-pass goal: render a placeholder drone with spinning rotors
 * over a simple ground plane, with proper lighting. No flight path yet.
 */

import * as THREE from 'three';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const canvas = document.getElementById('scene-canvas');

/* ─────────────────────────────────────────────
   LOADING SCREEN — tracks asset loads, fades out when complete.
   Total tracked: 1 landscape + 1 drone + 6 POI assets = 8.
   ───────────────────────────────────────────── */
const TOTAL_ASSETS = 8;
let loadedAssets = 0;
const loaderBar    = document.getElementById('loader-bar-fill');
const loaderStatus = document.getElementById('loader-status');
const loaderDetail = document.getElementById('loader-detail');
const loaderOverlay = document.getElementById('loading-overlay');

function markLoaded(label) {
    loadedAssets++;
    const pct = (loadedAssets / TOTAL_ASSETS) * 100;
    if (loaderBar)    loaderBar.style.width = `${pct}%`;
    if (loaderStatus) loaderStatus.textContent = label || 'Loading…';
    if (loaderDetail) loaderDetail.textContent = `${loadedAssets} / ${TOTAL_ASSETS} assets loaded`;
    if (loadedAssets >= TOTAL_ASSETS) {
        if (loaderStatus) loaderStatus.textContent = 'Ready for takeoff';
        // small delay so user sees "Ready" before fade
        setTimeout(() => {
            loaderOverlay?.classList.add('hidden');
        }, 700);
    }
}

/* ─────────────────────────────────────────────
   RENDERER · SCENE · CAMERA
   ───────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
// Cooler, more blue sky — pastel cyan-teal
scene.background = new THREE.Color(0x9fc8d6);
// Far fog distance — back mountains are now 250+ units away and 300 tall
scene.fog = new THREE.Fog(0x9fc8d6, 80, 480);

const camera = new THREE.PerspectiveCamera(
    65,                       // wider FOV — fits distant mountains in frame
    window.innerWidth / window.innerHeight,
    0.1,
    800
);
// Initial pose; flight loop overwrites every frame
camera.position.set(6, 4, 8);
camera.lookAt(0, 1.5, 0);

/* ─────────────────────────────────────────────
   FLIGHT PATH
   Waypoints — one per section. Each becomes a POI on the curve.
   X = left/right · Y = altitude · Z = forward/back (flight direction)
   ───────────────────────────────────────────── */
const POIS = [
    // pos = where the DRONE passes by. The landmark sits below it on the ground.
    // asset = filename in assets/compressed/ (loaded after drone)
    // target = longest-dim after auto-fit, in scene units
    // rotY = optional yaw applied to the asset (degrees)
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

const flightCurve = new THREE.CatmullRomCurve3(
    POIS.map(p => p.pos.clone()),
    false,       // not closed
    'catmullrom',
    0.4          // tension
);

// Visualize the path as a faint line (helpful during dev — easy to hide later)
const SHOW_PATH = true;
if (SHOW_PATH) {
    const pts = flightCurve.getPoints(200);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const pathMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    scene.add(new THREE.Line(pathGeo, pathMat));
}

// Track placeholder cubes by POI so we can swap them when the real GLB loads
const placeholders = new Map();
for (const poi of POIS.slice(1)) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.2, 2.2),
        new THREE.MeshStandardMaterial({ color: poi.color, flatShading: true, roughness: 0.85 })
    );
    cube.position.set(poi.pos.x, 0.5, poi.pos.z);
    cube.castShadow    = true;
    cube.receiveShadow = true;
    cube.userData.poiId = poi.id;
    scene.add(cube);
    placeholders.set(poi.id, cube);
}

/* ─────────────────────────────────────────────
   LIGHTING — warm key + cool fill (matches diorama mood)
   ───────────────────────────────────────────── */
// Cool sky / warm ground — leans blue
const ambient = new THREE.HemisphereLight(0xbcdfee, 0x5a7a5a, 0.65);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2cf, 1.7);
sun.position.set(10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
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

/* ─────────────────────────────────────────────
   LANDSCAPE — Blender-built diorama (hills, waterfall, river,
   dirt road, snow peaks, bridge). Loaded asynchronously.
   ───────────────────────────────────────────── */
const tempGround = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 160),
    new THREE.MeshStandardMaterial({ color: 0x70b06b, flatShading: true, roughness: 0.95 })
);
tempGround.rotation.x = -Math.PI / 2;
tempGround.position.set(0, 0, -55);
tempGround.receiveShadow = true;
scene.add(tempGround);

// Real landscape replaces the temp plane once loaded
const landscapeLoader = new GLTFLoader();
landscapeLoader.setMeshoptDecoder(MeshoptDecoder);

// Track water meshes for animation
const waterMeshes = [];

// Custom water shader — gentle wave displacement + scrolling shimmer
const WATER_SHADER = new THREE.ShaderMaterial({
    uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(0x44a7c0) },
        uFoam:  { value: new THREE.Color(0xb8e6f2) },
    },
    vertexShader: /* glsl */`
        uniform float uTime;
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            vec3 pos = position;
            pos.y += sin(position.x * 0.6 + uTime * 1.7) * 0.05;
            pos.y += cos(position.z * 0.5 + uTime * 1.3) * 0.04;
            vPos    = pos;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uFoam;
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            // Scrolling noise approximation — gives "moving ripples"
            float n = sin(vPos.x * 0.8 + uTime * 1.8) * cos(vPos.z * 0.6 - uTime * 1.3);
            n = smoothstep(-0.2, 0.6, n);
            vec3 col = mix(uColor, uFoam, n * 0.45);
            // Subtle light directional shading
            float light = 0.7 + 0.3 * vNormal.y;
            gl_FragColor = vec4(col * light, 1.0);
        }
    `,
});

// Identify water by base color (gltf-transform consolidates names but keeps colors)
function isWaterColor(mat) {
    if (!mat?.color) return false;
    const c = mat.color;
    // water = (0.30, 0.72, 0.85), water_deep = (0.18, 0.55, 0.78) in linear space.
    // After gamma conversion these end up roughly in [0.05..0.5] / [0.3..0.7] / [0.5..0.75].
    // Simplest: "is the blue channel notably larger than green and red?"
    return c.b > 0.45 && c.b > c.r + 0.15 && c.g > c.r + 0.1;
}

landscapeLoader.load('assets/compressed/landscape.glb', (gltf) => {
    const land = gltf.scene;
    land.position.set(0, 0, 0);
    land.traverse((node) => {
        if (node.isMesh) {
            node.receiveShadow = true;
            node.castShadow    = true;
            if (isWaterColor(node.material)) {
                node.material = WATER_SHADER;
                node.castShadow = false;
                waterMeshes.push(node);
            }
        }
    });
    scene.add(land);
    scene.remove(tempGround);
    tempGround.geometry.dispose();
    tempGround.material.dispose();
    console.log(`[landscape] loaded, ${waterMeshes.length} water meshes tagged`);
    markLoaded('Landscape ready');

    // Vegetation is now authored in Blender — scatterGrass() removed.
    // The function is kept below for reference but no longer called.
}, undefined, () => markLoaded('Landscape unavailable'));

/* ─────────────────────────────────────────────
   DENSE GRASS via InstancedMesh
   One geometry, thousands of instances — minimal memory cost.
   ───────────────────────────────────────────── */
function scatterGrass() {
    // Grass tuft = 3 crossed billboards, each a small quad fan
    const tuftGeo = new THREE.BufferGeometry();
    const verts = [];
    const norms = [];
    for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        const c = Math.cos(a), s = Math.sin(a);
        const w = 0.32, h = 0.65;
        // Triangle 1
        verts.push(-c*w, 0, -s*w,  c*w, 0, s*w,  0, h, 0);
        // Triangle 2 (back face, so blade visible from both sides)
        verts.push( c*w, 0,  s*w, -c*w, 0,-s*w,  0, h, 0);
        for (let i = 0; i < 6; i++) norms.push(0, 1, 0);
    }
    tuftGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    tuftGeo.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));

    // MeshBasicMaterial — no shading, stays vibrant; perfect for stylized grass
    const tuftMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,           // multiplied by per-instance color
        side: THREE.DoubleSide,
        transparent: false,
    });

    const COUNT = 2500;
    const grass = new THREE.InstancedMesh(tuftGeo, tuftMat, COUNT);
    grass.receiveShadow = false;
    grass.castShadow = false;
    grass.frustumCulled = false; // we're spread wide

    // Path/road distance — keep grass off the road and out of water zones
    function pathDist(x, z) {
        const points = [
            [0, 12], [0, 0], [-8, -14], [6, -28], [-7, -42],
            [9, -56], [-3, -70], [4, -82], [6, -95],
        ];
        let best = 1e9;
        for (let i = 0; i < points.length - 1; i++) {
            const [x1, z1] = points[i];
            const [x2, z2] = points[i + 1];
            if (Math.min(z1, z2) <= z && z <= Math.max(z1, z2)) {
                const t = z2 !== z1 ? (z - z1) / (z2 - z1) : 0;
                best = Math.min(best, Math.abs(x - (x1 + t * (x2 - x1))));
            } else {
                best = Math.min(best,
                    Math.hypot(x - x1, z - z1),
                    Math.hypot(x - x2, z - z2));
            }
        }
        return best;
    }

    const dummy = new THREE.Object3D();
    let placed = 0;
    let tries = 0;
    while (placed < COUNT && tries < COUNT * 5) {
        tries++;
        const x = -45 + Math.random() * 90;
        const z = -88 + Math.random() * 100;
        // Avoid road
        if (pathDist(x, z) < 4.5) continue;
        // Avoid the climbing mountain edges (where terrain rises sharply)
        if (Math.abs(x) > 28 || z < -82 || z > 12) continue;
        // Avoid river diagonal band
        const river_t = (z + 95) / (-25 + 95);
        const river_x = -25 + river_t * (50 - (-25));
        if (Math.abs(x - river_x) < 3.5) continue;

        dummy.position.set(x, 0.02, z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        const s = 0.85 + Math.random() * 0.9;
        dummy.scale.set(s, s + Math.random() * 0.4, s);
        dummy.updateMatrix();
        grass.setMatrixAt(placed, dummy.matrix);

        // Brighter, more saturated greens
        const col = new THREE.Color();
        const r = Math.random();
        if      (r < 0.45) col.setHex(0x8dd663);
        else if (r < 0.75) col.setHex(0x6abb47);
        else if (r < 0.92) col.setHex(0xa8e078);
        else               col.setHex(0xdce085); // occasional yellow-green
        grass.setColorAt(placed, col);

        placed++;
    }
    grass.count = placed;
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;

    scene.add(grass);
    console.log(`[grass] scattered ${placed} tufts`);
}

// A few placeholder trees so the scene isn't empty
function addTree(x, z, scale = 1) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a26, flatShading: true });
    const pineMat  = new THREE.MeshStandardMaterial({ color: 0x2d8b46, flatShading: true });

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.5 * scale, 6),
        trunkMat
    );
    trunk.position.set(x, 0.25 * scale, z);
    trunk.castShadow = true;
    scene.add(trunk);

    for (let i = 0; i < 3; i++) {
        const r = (0.55 - i * 0.13) * scale;
        const h = (0.7 - i * 0.05) * scale;
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(r, h, 8),
            pineMat
        );
        cone.position.set(x, 0.5 * scale + i * 0.45 * scale + h * 0.5, z);
        cone.castShadow = true;
        scene.add(cone);
    }
}

// Procedural trees removed — vegetation is now authored in Blender.

/* ─────────────────────────────────────────────
   DRONE — placeholder until Hunyuan3D asset arrives
   Built from primitives so we can verify scale, animation,
   and lighting before swapping in the real model.
   ───────────────────────────────────────────── */
const drone = new THREE.Group();
drone.name = 'Drone';
drone.position.set(0, 3, 0);

const bodyMat  = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, flatShading: true, roughness: 0.6 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0xe6c86e, flatShading: true, roughness: 0.7 });
const dark      = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, flatShading: true, roughness: 0.5 });

// Central body
const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), bodyMat);
body.castShadow = true;
drone.add(body);

// Yellow accent stripe on top
const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.3), accentMat);
stripe.position.y = 0.12;
drone.add(stripe);

// Camera gimbal underneath
const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), dark);
gimbal.position.set(0, -0.18, 0.18);
gimbal.castShadow = true;
drone.add(gimbal);

// Arms + rotors — four corners
const rotors = [];
const armOffset = 0.55;
const armPositions = [
    [ armOffset, 0,  armOffset],
    [-armOffset, 0,  armOffset],
    [ armOffset, 0, -armOffset],
    [-armOffset, 0, -armOffset],
];
for (const [x, y, z] of armPositions) {
    // Arm
    const armLength = Math.hypot(x, z);
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, armLength, 6);
    armGeo.translate(0, armLength / 2, 0);
    const arm = new THREE.Mesh(armGeo, bodyMat);
    arm.position.set(0, 0, 0);
    arm.lookAt(x, 0, z);
    arm.rotateX(Math.PI / 2);
    arm.castShadow = true;
    drone.add(arm);

    // Motor
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), dark);
    motor.position.set(x, 0.07, z);
    motor.castShadow = true;
    drone.add(motor);

    // Rotor (the part that spins)
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
   TRY TO LOAD HUNYUAN3D DRONE (if delivered)
   Replaces the placeholder when found.
   ───────────────────────────────────────────── */
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

// Prefer the compressed build (135KB). Fall back to incoming/ if missing.
const DRONE_URL          = 'assets/compressed/drone.glb';
const DRONE_URL_FALLBACK = 'assets/incoming/drone.glb';

// Tune these once we see the model — Hunyuan3D outputs at arbitrary scale.
const DRONE_SCALE  = 1.0;   // multiplier applied after loading
const DRONE_OFFSET = new THREE.Vector3(0, 0, 0); // local offset within drone group

function attachLoaded(gltf) {
    console.log('[drone] real model loaded, replacing placeholder');
    while (drone.children.length) drone.remove(drone.children[0]);

    const root = gltf.scene;

    // Auto-fit: scale so the longest dimension matches our target
    const box  = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.y, size.z);
    const targetSize = 1.4;
    if (longest > 0) root.scale.setScalar((targetSize / longest) * DRONE_SCALE);

    // Re-center so the drone group's origin = drone's center of mass
    box.setFromObject(root);
    const center = new THREE.Vector3();
    box.getCenter(center);
    root.position.sub(center).add(DRONE_OFFSET);

    root.traverse((node) => {
        if (node.isMesh) {
            node.castShadow    = true;
            node.receiveShadow = false;
        }
    });

    drone.add(root);

    // Add 4 spinning rotor overlays — Hunyuan3D fused the mesh so we can't
    // spin the original rotors. These transparent discs sit on top and rotate,
    // giving the impression of motion-blurred props in flight.
    rotors.length = 0;
    const rotorPositions = [
        [ 0.55, 0.15,  0.55],
        [-0.55, 0.15,  0.55],
        [ 0.55, 0.15, -0.55],
        [-0.55, 0.15, -0.55],
    ];
    const rotorDiscMat = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.30,
        depthWrite: false,
    });
    for (const [x, y, z] of rotorPositions) {
        const rotorGroup = new THREE.Group();
        rotorGroup.position.set(x, y, z);
        // Two thin crossed boxes — when spinning, they read as a blurred disc.
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.015, 0.06), rotorDiscMat);
        const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.55), rotorDiscMat);
        rotorGroup.add(blade1, blade2);
        drone.add(rotorGroup);
        rotors.push(rotorGroup);
    }
}

function attachAndMark(gltf) {
    attachLoaded(gltf);
    markLoaded('Drone armed');
}

loader.load(
    DRONE_URL,
    attachAndMark,
    undefined,
    () => {
        loader.load(
            DRONE_URL_FALLBACK,
            attachAndMark,
            undefined,
            () => {
                console.info('[drone] no real model — using placeholder primitives');
                markLoaded('Drone (placeholder)');
            },
        );
    }
);

/* ─────────────────────────────────────────────
   POI LANDMARK ASSETS
   Load each .glb, auto-fit to target size, sit on ground, swap out
   the placeholder cube.
   ───────────────────────────────────────────── */
function loadPoiAsset(poi) {
    if (!poi.asset) return;
    const url = `assets/compressed/${poi.asset}`;
    const label = poi.asset.replace('.glb', '').replace(/^./, c => c.toUpperCase());

    loader.load(url, (gltf) => {
        const root = gltf.scene;

        // Auto-fit longest dimension
        const box  = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const longest = Math.max(size.x, size.y, size.z);
        const target  = poi.target ?? 4.0;
        if (longest > 0) root.scale.setScalar(target / longest);

        // Re-bound after scale; sit on ground (bbox.min.y = 0)
        box.setFromObject(root);
        const ground = new THREE.Vector3();
        box.getCenter(ground);
        root.position.x -= ground.x;
        root.position.z -= ground.z;
        root.position.y -= box.min.y;   // bottom of bbox at y=0

        // Place at POI x/z on the ground plane
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

        // Remove the placeholder cube for this POI
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

// Kick off all POI assets in parallel
for (const poi of POIS) loadPoiAsset(poi);

/* ─────────────────────────────────────────────
   RESIZE
   ───────────────────────────────────────────── */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ─────────────────────────────────────────────
   SCROLL → FLIGHT PROGRESS
   The page is taller than the viewport thanks to the .poi-section
   blocks (each is min-height:100vh). scrollY / max scroll = 0..1
   ───────────────────────────────────────────── */
let scrollProgress = 0;          // raw 0..1
let smoothedProgress = 0;        // eased

function updateScroll() {
    const doc  = document.documentElement;
    const max  = doc.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    updateActiveSection();
}

// Show only the section whose center is closest to viewport center
const sectionEls = Array.from(document.querySelectorAll('.poi-section'));
function updateActiveSection() {
    const viewportMid = window.scrollY + window.innerHeight / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < sectionEls.length; i++) {
        const el = sectionEls[i];
        const top = el.offsetTop;
        const mid = top + el.offsetHeight / 2;
        const d = Math.abs(mid - viewportMid);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    for (let i = 0; i < sectionEls.length; i++) {
        sectionEls[i].classList.toggle('active', i === bestIdx);
    }
}

window.addEventListener('scroll', updateScroll, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();

/* ─────────────────────────────────────────────
   RENDER LOOP — drone & camera driven by scroll
   ───────────────────────────────────────────── */
const clock           = new THREE.Clock();
const _tmpPos         = new THREE.Vector3();
const _tmpTangent     = new THREE.Vector3();
const _tmpLookAhead   = new THREE.Vector3();
const _tmpCamTarget   = new THREE.Vector3();
const _tmpCamPos      = new THREE.Vector3();

// HUD live elements
const hud = {
    bat:  document.getElementById('hud-bat'),
    alt:  document.getElementById('hud-alt'),
    spd:  document.getElementById('hud-spd'),
    gps:  document.getElementById('hud-gps'),
    mode: document.getElementById('hud-mode'),
    prog: document.getElementById('hud-progress'),
};

function animate() {
    requestAnimationFrame(animate);
    // IMPORTANT: getDelta() first — getElapsedTime() would consume the delta.
    const dt = clock.getDelta();
    const t  = clock.elapsedTime;

    // Smooth scroll progress — feels nicer than raw scroll
    smoothedProgress += (scrollProgress - smoothedProgress) * Math.min(1, dt * 6);
    const p = smoothedProgress;

    // Spin rotors continuously
    for (const r of rotors) r.rotation.y += dt * 40;

    // Tick water shader
    WATER_SHADER.uniforms.uTime.value += dt;

    /* ── DRONE — position on curve + look ahead ── */
    flightCurve.getPointAt(p, _tmpPos);
    drone.position.copy(_tmpPos);
    // Tiny vertical bob layered on top so it feels alive
    drone.position.y += Math.sin(t * 2.2) * 0.08;

    // Tangent → flight direction
    flightCurve.getTangentAt(Math.min(1, p + 0.001), _tmpTangent);

    // Yaw: rotate around Y so drone "noses" toward flight direction.
    // atan2 keeps the drone's local up axis preserved (no roll/pitch surprises).
    drone.rotation.y = Math.atan2(_tmpTangent.x, _tmpTangent.z) + Math.PI;

    // Pitch: tilt nose down when climbing, up when diving (mild)
    drone.rotation.x = -_tmpTangent.y * 0.4;

    // Bank: roll into turns based on horizontal tangent change
    drone.rotation.z = -_tmpTangent.x * 0.3;

    // DEBUG: ?overview in URL → high orbit cam to inspect the landscape
    if (window.location.search.includes('overview')) {
        const ang = t * 0.12;
        camera.position.set(Math.cos(ang) * 50, 35, Math.sin(ang) * 50 - 50);
        camera.lookAt(0, 0, -55);
        scene.fog.far = 250; // see further in overview
    } else {
        /* ── CAMERA — chase cam behind & above, gentle look-ahead.
              Look target is approximately at drone altitude so distant
              mountains in the background stay in frame. ── */
        const behindDist = 5.5;
        const aboveDist  = 1.8 + drone.position.y * 0.08;
        _tmpCamPos.copy(_tmpPos)
            .add(_tmpTangent.clone().multiplyScalar(-behindDist))
            .add(new THREE.Vector3(0, aboveDist, 0));
        camera.position.lerp(_tmpCamPos, Math.min(1, dt * 3));

        // Look ahead and at roughly drone altitude — keeps horizon (and mountains) in frame
        _tmpCamTarget.copy(_tmpPos).add(_tmpTangent.clone().multiplyScalar(6));
        _tmpCamTarget.y += 0.4;   // slight upward bias so mountains stay framed
        camera.lookAt(_tmpCamTarget);
    }

    /* ── HUD live values ── */
    if (hud.bat)  hud.bat.textContent  = Math.round(87 - p * 35);
    if (hud.alt)  hud.alt.textContent  = String(Math.round(drone.position.y * 12)).padStart(3, '0');
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
            p > 0.95 ? 'LANDING' :
            p > 0.99 ? 'MISSION COMPLETE' :
            'CRUISE';
    }

    renderer.render(scene, camera);
}
animate();

console.log('[drone-demo] scene initialized — placeholder drone hovering');
