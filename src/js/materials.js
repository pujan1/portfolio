// Custom shaders for water and grass.
//
// Both rely on a per-frame `tickMaterials(dt)` call from the animate loop
// to drive their `uTime` uniform. Grass materials are cached by base color
// so identical green tints share one ShaderMaterial (and one uniform).

import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Water — procedural ripple normals + fresnel edge + sun specular.
   Vertices stay pinned to terrain so the authored river/waterfall meshes
   don't pop out of their carved beds; all motion happens in fragments.
   ───────────────────────────────────────────── */
export const WATER_SHADER = new THREE.ShaderMaterial({
    uniforms: {
        uTime:    { value: 0 },
        uColor:   { value: new THREE.Color(0x2e8aa6) },
        uDeep:    { value: new THREE.Color(0x0e3a52) },
        uFoam:    { value: new THREE.Color(0xdaf2f8) },
        uSunDir:  { value: new THREE.Vector3(0.42, 0.78, 0.46).normalize() },
    },
    vertexShader: /* glsl */`
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vNormal   = normalize(mat3(modelMatrix) * normal);
            vViewDir  = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3  uColor;
        uniform vec3  uDeep;
        uniform vec3  uFoam;
        uniform vec3  uSunDir;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        // Cheap value-noise good enough for ripple normals at this scale.
        float hash21(vec2 p) {
            p = fract(p * vec2(234.34, 435.345));
            p += dot(p, p + 34.23);
            return fract(p.x * p.y);
        }
        float vnoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        // Two scrolling noise layers → height field; perturb normal in xz.
        float waveHeight(vec2 p) {
            float a = vnoise(p * 1.7 + vec2(uTime *  0.35,  uTime * 0.22));
            float b = vnoise(p * 3.1 + vec2(uTime * -0.27,  uTime * 0.41));
            return a * 0.65 + b * 0.35;
        }

        void main() {
            vec2 uv = vWorldPos.xz * 0.45;

            // Finite-difference gradient of the height field → ripple normal.
            float eps = 0.18;
            float hC = waveHeight(uv);
            float hX = waveHeight(uv + vec2(eps, 0.0));
            float hZ = waveHeight(uv + vec2(0.0, eps));
            vec3 ripple = normalize(vec3(hC - hX, eps * 1.6, hC - hZ));
            // Blend into the mesh normal so vertical-ish surfaces don't go wild.
            vec3 N = normalize(mix(vNormal, ripple, 0.78));

            vec3 V = normalize(vViewDir);
            vec3 L = normalize(uSunDir);

            // Fresnel — water gets brighter at grazing angles.
            float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);

            // Base color: deep tint underneath, light tint at facing angles.
            float facing = clamp(dot(N, V), 0.0, 1.0);
            vec3 base = mix(uDeep, uColor, facing);

            // Sun glint — sharp Blinn-Phong specular toward the camera.
            vec3 H = normalize(L + V);
            float spec = pow(max(dot(N, H), 0.0), 64.0);

            // Foam highlight where the ripple peaks crest.
            float crest = smoothstep(0.55, 0.95, hC);

            vec3 col = base;
            col = mix(col, uFoam, fres * 0.55);          // grazing-angle sky tint
            col = mix(col, uFoam, crest * 0.18);          // foamy ripple tops
            col += vec3(1.0, 0.96, 0.85) * spec * 0.9;    // sun glint
            // Soft ambient response on the mesh normal so river bends still read.
            col *= 0.78 + 0.22 * max(vNormal.y, 0.0);

            gl_FragColor = vec4(col, 1.0);
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
