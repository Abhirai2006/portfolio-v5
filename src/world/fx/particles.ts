/**
 * One GPU particle field for every effect (flames, embers, dust, feathers, sparks): a ring buffer the CPU
 * writes births into; the vertex shader moves and fades each particle by its age. Additive, so it blooms.
 */
import * as THREE from "three";

/** Colour ramps, core → edge (linear colours are boosted so they cross the bloom threshold). */
export const PALETTES = {
  redFlame: ["#ffd2a8", "#ff2e2e"],
  blueFlame: ["#e4f0ff", "#3d7bff"],
  ember: ["#ffc38a", "#ff6a1a"],
  gold: ["#fff1c4", "#ffc34d"],
  paper: ["#ffffff", "#c9c4ba"],
  ink: ["#3a3a3e", "#0b0b0c"],
} as const;
export type PaletteName = keyof typeof PALETTES;
const PALETTE_INDEX: Record<PaletteName, number> = {
  redFlame: 0,
  blueFlame: 1,
  ember: 2,
  gold: 3,
  paper: 4,
  ink: 5,
};

const VERT = /* glsl */ `
attribute vec3 aVel; attribute vec4 aMeta; // birthTime, life, palette, size
uniform float uTime; uniform float uPixel; uniform float uRise; uniform float uTurb;
varying float vT; varying float vPal;
void main(){
  float age = uTime - aMeta.x;
  float life = aMeta.y;
  vT = age / life;
  vPal = aMeta.z;
  if (age < 0.0 || age > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec3 p = position + aVel * age + vec3(0.0, uRise * age * age, 0.0);
  float s = aMeta.x * 13.17;
  p += uTurb * age * vec3(sin(age * 7.0 + s), cos(age * 5.3 + s * 1.7), sin(age * 6.1 + s * 0.6));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float grow = mix(1.0, 0.25, vT);
  gl_PointSize = aMeta.w * grow * uPixel / max(-mv.z, 0.1);
}`;

const FRAG = /* glsl */ `
uniform vec3 uCore[6]; uniform vec3 uEdge[6];
varying float vT; varying float vPal;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  int i = int(vPal + 0.5);
  vec3 core = uCore[0]; vec3 edge = uEdge[0];
  for (int k = 1; k < 6; k++) { if (k == i) { core = uCore[k]; edge = uEdge[k]; } }
  vec3 col = mix(core, edge, smoothstep(0.0, 0.55, vT));
  float a = (1.0 - smoothstep(0.15, 0.5, d)) * (1.0 - smoothstep(0.55, 1.0, vT));
  gl_FragColor = vec4(col * a * 2.4, a);
}`;

export class ParticleField {
  readonly points: THREE.Points;
  private readonly geo: THREE.BufferGeometry;
  private readonly mat: THREE.ShaderMaterial;
  private head = 0;
  private time = 0;
  constructor(
    readonly capacity = 4000,
    opts: { rise?: number; turbulence?: number } = {},
  ) {
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage),
    );
    this.geo.setAttribute(
      "aVel",
      new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage),
    );
    const meta = new Float32Array(capacity * 4);
    for (let i = 0; i < capacity; i++) meta[i * 4] = -1e6; // all dead
    meta.fill(1, 0, 0);
    for (let i = 0; i < capacity; i++) meta[i * 4 + 1] = 1;
    this.geo.setAttribute(
      "aMeta",
      new THREE.BufferAttribute(meta, 4).setUsage(THREE.DynamicDrawUsage),
    );
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    const names = Object.keys(PALETTES) as PaletteName[];
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixel: { value: 300 },
        uRise: { value: opts.rise ?? 0.6 },
        uTurb: { value: opts.turbulence ?? 0.35 },
        uCore: { value: names.map((n) => new THREE.Color(PALETTES[n][0]).convertSRGBToLinear()) },
        uEdge: { value: names.map((n) => new THREE.Color(PALETTES[n][1]).convertSRGBToLinear()) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
  }

  emit(pos: THREE.Vector3, vel: THREE.Vector3, palette: PaletteName, life: number, size: number) {
    const i = this.head;
    this.head = (this.head + 1) % this.capacity;
    const p = this.geo.attributes.position as THREE.BufferAttribute;
    const v = this.geo.attributes.aVel as THREE.BufferAttribute;
    const m = this.geo.attributes.aMeta as THREE.BufferAttribute;
    p.setXYZ(i, pos.x, pos.y, pos.z);
    v.setXYZ(i, vel.x, vel.y, vel.z);
    m.setXYZW(i, this.time, life, PALETTE_INDEX[palette], size);
    p.needsUpdate = v.needsUpdate = m.needsUpdate = true;
  }

  /** Advance the clock; `pixel` scales point size with the canvas height so particles match on any DPR. */
  update(time: number, pixel: number) {
    this.time = time;
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uPixel.value = pixel;
  }

  clear() {
    const m = this.geo.attributes.aMeta as THREE.BufferAttribute;
    for (let i = 0; i < this.capacity; i++) m.setX(i, -1e6);
    m.needsUpdate = true;
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}
