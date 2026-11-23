/**
 * The manga ink material (DESIGN §2.3, ARCHITECTURE §4): a 3–4 step toon ramp, screen-space screentone dots
 * in the shadow bands, and rim light — blue from the left, orange from the right (Motive).
 * Built on MeshToonMaterial via onBeforeCompile so skinned (animated) models work unchanged.
 */
import * as THREE from "three";

export const INK = new THREE.Color("#0b0b0c");
export const PAPER = new THREE.Color("#f2eee6");
export const BLUE_FIRE = new THREE.Color("#3d7bff");
export const ORANGE_FIRE = new THREE.Color("#ff6a1a");

const rampCache = new Map<number, THREE.DataTexture>();
function toonRamp(steps: 3 | 4) {
  const hit = rampCache.get(steps);
  if (hit) return hit;
  const values = steps === 3 ? [70, 165, 255] : [55, 120, 190, 255];
  const data = new Uint8Array(values.length * 4);
  values.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const tex = new THREE.DataTexture(data, values.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  rampCache.set(steps, tex);
  return tex;
}

export type InkOptions = {
  color: THREE.ColorRepresentation;
  steps?: 3 | 4;
  rimLeft?: THREE.ColorRepresentation;
  rimRight?: THREE.ColorRepresentation;
  rimStrength?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  /** Halftone dot cell size in device pixels (0 disables). */
  tone?: number;
  transparent?: boolean;
  side?: THREE.Side;
};

export type InkUniforms = {
  uRimL: { value: THREE.Color };
  uRimR: { value: THREE.Color };
  uRim: { value: number };
  uTone: { value: number };
  uGlow: { value: number };
};
export type InkMaterial = THREE.MeshToonMaterial & { uniforms: InkUniforms };

export function inkToonMaterial(o: InkOptions): InkMaterial {
  const m = new THREE.MeshToonMaterial({
    color: o.color,
    gradientMap: toonRamp(o.steps ?? 3),
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.emissiveIntensity ?? 1,
    transparent: o.transparent ?? false,
    side: o.side ?? THREE.FrontSide,
  }) as InkMaterial;
  const uniforms: InkUniforms = {
    uRimL: { value: new THREE.Color(o.rimLeft ?? BLUE_FIRE) },
    uRimR: { value: new THREE.Color(o.rimRight ?? ORANGE_FIRE) },
    uRim: { value: o.rimStrength ?? 1 },
    uTone: { value: o.tone ?? 5 },
    uGlow: { value: 0 },
  };
  m.uniforms = uniforms;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uRimL; uniform vec3 uRimR; uniform float uRim; uniform float uTone; uniform float uGlow;`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
{
  vec3 nV = normalize(vNormal);
  float facing = clamp(dot(nV, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float rim = pow(1.0 - facing, 3.2);
  float leftSide = smoothstep(0.15, -0.55, nV.x);
  float rightSide = smoothstep(-0.15, 0.55, nV.x);
  vec3 rimCol = uRimL * leftSide + uRimR * rightSide;
  gl_FragColor.rgb += rimCol * rim * uRim * 1.1 + rimCol * rim * uGlow * 3.0;
  // Screentone: halftone dots in the shadow bands, fixed to the screen like printed manga.
  if (uTone > 0.0) {
    float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
    float shadow = 1.0 - smoothstep(0.12, 0.5, lum);
    vec2 cell = gl_FragCoord.xy / uTone;
    vec2 c = fract(cell) - 0.5;
    float r = 0.48 * shadow;
    float dotMask = 1.0 - smoothstep(r - 0.06, r + 0.06, length(c));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.18, dotMask * shadow);
  }
}`,
      );
  };
  // All ink materials share one program; per-material values live in the uniforms.
  m.customProgramCacheKey = () => "ink-toon";
  return m;
}

/** Flat emissive "light" material for fire/glow geometry (feeds the bloom pass). */
export function lightMaterial(color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(2.2),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}
