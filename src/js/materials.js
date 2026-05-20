// Custom shaders for water and grass.
//
// Both rely on a per-frame `tickMaterials(dt)` call from the animate loop
// to drive their `uTime` uniform. Grass materials are cached by base color
// so identical green tints share one ShaderMaterial (and one uniform).

import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Water — gentle scrolling shimmer. Vertices stay pinned to terrain so
   the authored river/waterfall meshes don't pop out of their carved beds.
   ───────────────────────────────────────────── */
export const WATER_SHADER = new THREE.ShaderMaterial({
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
            vPos    = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uFoam;
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            // Cheap noise approximation — sin × cos over xz with time offset.
            float n = sin(vPos.x * 0.8 + uTime * 1.8) * cos(vPos.z * 0.6 - uTime * 1.3);
            n = smoothstep(-0.2, 0.6, n);
            vec3 col = mix(uColor, uFoam, n * 0.45);
            float light = 0.7 + 0.3 * vNormal.y;
            gl_FragColor = vec4(col * light, 1.0);
        }
    `,
});

// Identify water meshes by base color rather than name — gltf-transform
// consolidates material names but preserves vertex colors. Test: blue
// channel notably dominant over both red and green.
export function isWaterColor(mat) {
    const c = mat?.color;
    if (!c) return false;
    return c.b > 0.45 && c.b > c.r + 0.15 && c.g > c.r + 0.1;
}

/* ─────────────────────────────────────────────
   Grass — bend in a breeze. One material per distinct base color so the
   uniform tick stays cheap regardless of how many tufts use it.
   ───────────────────────────────────────────── */
const grassMaterials = [];
const grassCache = new Map();

export function grassBreezeMaterial(sourceMaterial) {
    const sourceColor = sourceMaterial?.color || new THREE.Color(0x2f7a34);
    const key = sourceColor.getHexString();
    if (grassCache.has(key)) return grassCache.get(key);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime:  { value: 0 },
            uColor: { value: sourceColor.clone() },
        },
        vertexShader: /* glsl */`
            uniform float uTime;
            varying vec3 vNormal;
            varying float vBlade;
            void main() {
                vec3 pos = position;
                // uv.x ≈ 0 at root, 1 at tip — only the tip sways.
                float blade = clamp(uv.x, 0.0, 1.0);
                // Use uv.y as a per-blade phase so neighbors don't sync up.
                float phase = uv.y * 6.28318530718;
                float wave  = sin(uTime * 1.55 + phase + position.x * 0.17 + position.z * 0.11);
                float cross = cos(uTime * 1.12 + phase * 0.7 + position.z * 0.13);
                pos.x += wave * 0.075 * blade;
                pos.z += cross * 0.035 * blade;
                vBlade  = blade;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColor;
            varying vec3 vNormal;
            varying float vBlade;
            void main() {
                float light = 0.62 + 0.38 * max(0.0, vNormal.y);
                vec3 tip  = uColor * 1.18;
                vec3 base = uColor * 0.72;
                gl_FragColor = vec4(mix(base, tip, vBlade) * light, 1.0);
            }
        `,
        side: THREE.DoubleSide,
    });

    grassMaterials.push(material);
    grassCache.set(key, material);
    return material;
}

// Convention: vegetation.glb exports grass tufts with material names
// `Grass_Prototype_*`. Anything else is left with its default PBR material.
export function isGrassMaterial(mat) {
    return mat?.name?.startsWith('Grass_Prototype_');
}

// Called once per frame from the animate loop. dt is in seconds.
export function tickMaterials(dt) {
    WATER_SHADER.uniforms.uTime.value += dt;
    for (const m of grassMaterials) m.uniforms.uTime.value += dt;
}
