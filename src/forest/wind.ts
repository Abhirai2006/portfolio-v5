/**
 * Wind and bending for real plant meshes. Each plant gets its own material clone with:
 *  - uBend: a local-space displacement at the tip (from the spring in physics.ts: camera push,
 *    the frog landing), applied as a cantilever bend (∝ height²), so the stem bends, not slides;
 *  - wind: low-frequency gusts that sway the whole plant plus a high-frequency leaf flutter.
 * Shared time uniform, per-plant bend uniforms. Used by opening.ts.
 */
import * as THREE from "three";

export const windTime = { value: 0 };
export const windStrength = { value: 1 };

export type Bendable = {
  object: THREE.Object3D;
  bend: { value: THREE.Vector3 };
  height: number;
};

export function makeBendable(object: THREE.Object3D, height: number, sway = 1): Bendable {
  const bend = { value: new THREE.Vector3() };
  const uHeight = { value: Math.max(0.05, height) };
  const uSway = { value: sway };
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const patched = mats.map((m) => {
      const mat = (m as THREE.MeshStandardMaterial).clone();
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = windTime;
        shader.uniforms.uWind = windStrength;
        shader.uniforms.uBend = bend;
        shader.uniforms.uHeight = uHeight;
        shader.uniforms.uSway = uSway;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
uniform float uTime; uniform float uWind; uniform vec3 uBend; uniform float uHeight; uniform float uSway;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
{
  float h = clamp(transformed.y / uHeight, 0.0, 1.2);
  float h2 = h * h;
  vec3 wp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  // Gusts: a few incommensurate sines travelling across the ground (real wind is not periodic).
  float g1 = sin(uTime * 0.9 + wp.x * 0.35 + wp.z * 0.22);
  float g2 = sin(uTime * 1.7 - wp.x * 0.8 + wp.z * 0.5) * 0.5;
  float gust = (g1 + g2) * (0.6 + 0.4 * sin(uTime * 0.23 + wp.z * 0.05));
  vec3 sway = vec3(gust, 0.0, gust * 0.4) * 0.025 * uHeight * uWind * uSway * h2;
  // Leaf flutter: small, fast and different for every vertex region.
  float ph = dot(wp, vec3(23.1, 17.7, 19.3));
  vec3 flutter = vec3(sin(uTime * 7.3 + ph), sin(uTime * 9.1 + ph * 1.3), cos(uTime * 6.1 + ph)) * 0.0035 * uWind * h;
  vec3 b = uBend * h2;
  transformed += sway + flutter + b;
  // Keep the stem length roughly constant: bending sideways lowers the tip.
  transformed.y -= 0.5 * dot(b.xz, b.xz) / uHeight * h;
}`,
          );
      };
      mat.customProgramCacheKey = () => "forest-wind";
      return mat;
    });
    mesh.material = Array.isArray(mesh.material) ? patched : patched[0];
  });
  return { object, bend, height };
}
